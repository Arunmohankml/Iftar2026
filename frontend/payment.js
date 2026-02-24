const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Ticket = require('../models/Ticket');
const { generateUniqueTicketId } = require('../utils/ticketIdGenerator');
const { generateQRCode } = require('../utils/qrGenerator');
const { sendTicketEmail } = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const TICKET_PRICE = 120; // ₹120 per person

// Create Razorpay Order
router.post('/create-order', async (req, res) => {
  try {
    const { name, email, phone, quantity } = req.body;

    // Validation
    if (!name || !email || !phone || !quantity) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (quantity < 1 || quantity > 5) {
      return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 5' });
    }

    const totalAmount = TICKET_PRICE * quantity;
    const ticketId = await generateUniqueTicketId();

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: ticketId,
      notes: { name, email, phone, quantity: String(quantity) },
    });

    // Save pending ticket
    const ticket = new Ticket({
      ticketId,
      name,
      email,
      phone,
      quantity,
      totalAmount,
      razorpayOrderId: order.id,
      paymentStatus: 'pending',
    });
    await ticket.save();

    res.json({
      success: true,
      orderId: order.id,
      ticketId,
      amount: totalAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
});

// Verify payment & finalize ticket
router.post('/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Find ticket
    const ticket = await Ticket.findOne({ razorpayOrderId: razorpay_order_id });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.paymentStatus === 'paid') {
      return res.json({ success: true, ticketId: ticket.ticketId, alreadyPaid: true });
    }

    // Generate QR code
    const { qrCodeImage, qrData } = await generateQRCode(ticket.ticketId, ticket.name, ticket.quantity);

    // Update ticket
    ticket.razorpayPaymentId = razorpay_payment_id;
    ticket.razorpaySignature = razorpay_signature;
    ticket.paymentStatus = 'paid';
    ticket.qrCodeImage = qrCodeImage;
    ticket.qrCodeData = qrData;
    await ticket.save();

    // Send email (non-blocking)
    sendTicketEmail(ticket).then(() => {
      ticket.emailSent = true;
      ticket.save();
    }).catch(console.error);

    res.json({ success: true, ticketId: ticket.ticketId });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
});

// Get ticket details (for ticket display page)
router.get('/ticket/:ticketId', async (req, res) => {
  try {
    const ticket = await Ticket.findOne({
      ticketId: req.params.ticketId,
      paymentStatus: 'paid',
    }).select('-razorpaySignature -__v');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Download PDF
router.get('/ticket/:ticketId/pdf', async (req, res) => {
  try {
    const { generateTicketPDF } = require('../utils/pdfGenerator');
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId, paymentStatus: 'paid' });

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const pdfBuffer = await generateTicketPDF(ticket);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${ticket.ticketId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

module.exports = router;

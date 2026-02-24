const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Ticket = require('../models/Ticket');
const authMiddleware = require('../middleware/auth');

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all tickets
router.get('/tickets', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ paymentStatus: 'paid' })
      .select('-razorpaySignature -qrCodeImage -__v')
      .sort({ createdAt: -1 });

    const totalRevenue = tickets.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalAttendees = tickets.reduce((sum, t) => sum + t.quantity, 0);
    const checkedInCount = tickets.filter(t => t.checkedIn).length;

    res.json({
      success: true,
      tickets,
      stats: {
        totalTickets: tickets.length,
        totalAttendees,
        totalRevenue,
        checkedIn: checkedInCount,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Export CSV
router.get('/export-csv', authMiddleware, async (req, res) => {
  try {
    const tickets = await Ticket.find({ paymentStatus: 'paid' })
      .select('ticketId name email phone quantity totalAmount checkedIn checkedInAt createdAt razorpayPaymentId')
      .sort({ createdAt: -1 });

    const headers = ['Ticket ID', 'Name', 'Email', 'Phone', 'Quantity', 'Amount', 'Payment ID', 'Checked In', 'Check-In Time', 'Booked At'];
    const rows = tickets.map(t => [
      t.ticketId, t.name, t.email, t.phone, t.quantity, t.totalAmount,
      t.razorpayPaymentId || '',
      t.checkedIn ? 'Yes' : 'No',
      t.checkedInAt ? new Date(t.checkedInAt).toISOString() : '',
      new Date(t.createdAt).toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="iftar-attendees.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Scan QR / Check-in
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const { ticketId } = req.body;

    const ticket = await Ticket.findOne({ ticketId, paymentStatus: 'paid' });

    if (!ticket) {
      return res.json({ success: false, status: 'invalid', message: '❌ Invalid Ticket' });
    }

    if (ticket.checkedIn) {
      return res.json({
        success: false,
        status: 'duplicate',
        message: '❌ Already Checked In',
        ticket: { name: ticket.name, quantity: ticket.quantity, checkedInAt: ticket.checkedInAt },
      });
    }

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    res.json({
      success: true,
      status: 'valid',
      message: '✅ Valid Ticket - Checked In!',
      ticket: { name: ticket.name, quantity: ticket.quantity, ticketId: ticket.ticketId },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Manual check-in by ticket row
router.patch('/tickets/:ticketId/checkin', authMiddleware, async (req, res) => {
  try {
    const ticket = await Ticket.findOneAndUpdate(
      { ticketId: req.params.ticketId },
      { checkedIn: true, checkedInAt: new Date() },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

const PDFDocument = require('pdfkit');

async function generateTicketPDF(ticket) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [595, 350],
      margin: 0,
    });

    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Background
    doc.rect(0, 0, 595, 350).fill('#0f2f2f');

    // Gold border
    doc.rect(10, 10, 575, 330).lineWidth(2).stroke('#d4af37');

    // Left panel
    doc.rect(10, 10, 190, 330).fill('#0a2020');

    // Gold accent line
    doc.rect(200, 10, 2, 330).fill('#d4af37');

    // Event title
    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(20)
      .text('IFTAR MEETUP', 215, 30, { width: 360, align: 'center' });

    doc.fillColor('#f5e6c8').font('Helvetica').fontSize(14)
      .text('2026', 215, 55, { width: 360, align: 'center' });

    // Decorative line
    doc.moveTo(215, 75).lineTo(575, 75).lineWidth(1).stroke('#d4af37');

    // Attendee info
    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('ATTENDEE', 215, 88, { width: 360, align: 'left' });
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
      .text(ticket.name.toUpperCase(), 215, 100, { width: 360 });

    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('TICKET ID', 215, 130, { width: 160 });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(13)
      .text(ticket.ticketId, 215, 143, { width: 160 });

    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('TICKETS', 390, 130, { width: 160 });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(13)
      .text(`${ticket.quantity} Person(s)`, 390, 143, { width: 160 });

    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('DATE', 215, 175, { width: 160 });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(12)
      .text('March 2026', 215, 188, { width: 160 });

    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('VENUE', 390, 175, { width: 160 });
    doc.fillColor('#ffffff').font('Helvetica').fontSize(12)
      .text('Chennai', 390, 188, { width: 160 });

    doc.moveTo(215, 215).lineTo(575, 215).lineWidth(0.5).stroke('#d4af37');

    // Amount
    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(9)
      .text('AMOUNT PAID', 215, 225);
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18)
      .text(`₹${ticket.totalAmount}`, 215, 238);

    // Payment ID
    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(8)
      .text('PAYMENT ID', 215, 270);
    doc.fillColor('#aaaaaa').font('Helvetica').fontSize(9)
      .text(ticket.razorpayPaymentId || 'N/A', 215, 282, { width: 360 });

    doc.fillColor('#555555').font('Helvetica').fontSize(8)
      .text('This ticket is valid for entry to Iftar Meetup 2026, Chennai.', 215, 310, { width: 360 });

    // Left panel content
    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(11)
      .text('☪', 30, 30, { width: 140, align: 'center' });

    doc.fillColor('#d4af37').font('Helvetica-Bold').fontSize(8)
      .text('SCAN TO VERIFY', 30, 215, { width: 140, align: 'center' });

    // QR Code
    if (ticket.qrCodeImage) {
      const base64Data = ticket.qrCodeImage.replace(/^data:image\/png;base64,/, '');
      const qrBuffer = Buffer.from(base64Data, 'base64');
      doc.image(qrBuffer, 30, 230, { width: 140, height: 100 });
    }

    doc.end();
  });
}

module.exports = { generateTicketPDF };

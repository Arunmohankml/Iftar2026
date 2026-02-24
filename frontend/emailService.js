const nodemailer = require('nodemailer');
const { generateTicketPDF } = require('./pdfGenerator');

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendTicketEmail(ticket) {
  const transporter = createTransporter();
  const pdfBuffer = await generateTicketPDF(ticket);

  const qrBase64 = ticket.qrCodeImage
    ? ticket.qrCodeImage.replace(/^data:image\/png;base64,/, '')
    : null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Georgia, serif; background: #f5e6c8; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #0f2f2f; }
    .header { background: linear-gradient(135deg, #0f2f2f, #1a4a2e); padding: 40px 30px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { color: #d4af37; font-size: 28px; margin: 0; letter-spacing: 3px; }
    .header p { color: #f5e6c8; margin: 10px 0 0; font-size: 14px; }
    .crescent { font-size: 48px; margin-bottom: 15px; }
    .body { padding: 30px; }
    .greeting { color: #f5e6c8; font-size: 16px; line-height: 1.6; }
    .ticket-box { background: rgba(212,175,55,0.1); border: 2px solid #d4af37; border-radius: 8px; padding: 25px; margin: 25px 0; }
    .ticket-row { display: flex; justify-content: space-between; margin: 10px 0; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 10px; }
    .ticket-label { color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
    .ticket-value { color: #ffffff; font-size: 14px; font-weight: bold; }
    .qr-section { text-align: center; margin: 20px 0; }
    .qr-section p { color: #d4af37; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px; }
    .footer { background: #0a2020; padding: 20px 30px; text-align: center; border-top: 2px solid #d4af37; }
    .footer p { color: #888; font-size: 12px; }
    .footer a { color: #d4af37; text-decoration: none; }
    .amount { font-size: 24px; color: #d4af37; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="crescent">☪️</div>
      <h1>IFTAR MEETUP 2026</h1>
      <p>Your ticket is confirmed! Ramadan Mubarak 🌙</p>
    </div>
    <div class="body">
      <p class="greeting">
        Assalamu Alaikum, <strong style="color:#d4af37">${ticket.name}</strong>!<br><br>
        JazakAllah Khairan for registering for <strong>Iftar Meetup 2026</strong>. 
        Your booking is confirmed and we look forward to breaking fast with you in Chennai this Ramadan.
      </p>

      <div class="ticket-box">
        <div class="ticket-row">
          <span class="ticket-label">Ticket ID</span>
          <span class="ticket-value">${ticket.ticketId}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Name</span>
          <span class="ticket-value">${ticket.name}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Email</span>
          <span class="ticket-value">${ticket.email}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Phone</span>
          <span class="ticket-value">${ticket.phone}</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Tickets</span>
          <span class="ticket-value">${ticket.quantity} Person(s)</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Event</span>
          <span class="ticket-value">Iftar Meetup 2026</span>
        </div>
        <div class="ticket-row">
          <span class="ticket-label">Venue</span>
          <span class="ticket-value">Chennai, Tamil Nadu</span>
        </div>
        <div class="ticket-row" style="border:none">
          <span class="ticket-label">Amount Paid</span>
          <span class="amount">₹${ticket.totalAmount}</span>
        </div>
      </div>

      ${qrBase64 ? `
      <div class="qr-section">
        <p>📱 Scan at Entry</p>
        <img src="cid:qrcode" alt="QR Code" style="width:180px;height:180px;border:3px solid #d4af37;border-radius:8px" />
        <p style="color:#888;font-size:12px;margin-top:8px">Present this QR at the event entrance</p>
      </div>
      ` : ''}

      <p class="greeting">
        Your digital ticket PDF is attached to this email. Please bring it on your phone or print it out.<br><br>
        <strong style="color:#d4af37">Important:</strong> Gates open 30 minutes before Maghrib Adhan. Please arrive on time.<br><br>
        May Allah accept our worship and bless this gathering. 🤲
      </p>
    </div>
    <div class="footer">
      <p>Iftar Meetup 2026 • Chennai, Tamil Nadu</p>
      <p style="color:#555">This is an automated email. For queries, reply to this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Iftar Meetup 2026 ☪" <${process.env.EMAIL_USER}>`,
    to: ticket.email,
    subject: `✅ Ticket Confirmed - ${ticket.ticketId} | Iftar Meetup 2026`,
    html: htmlContent,
    attachments: [
      {
        filename: `${ticket.ticketId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
      ...(qrBase64 ? [{
        filename: 'qrcode.png',
        content: qrBase64,
        encoding: 'base64',
        cid: 'qrcode',
        contentType: 'image/png',
      }] : []),
    ],
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendTicketEmail };

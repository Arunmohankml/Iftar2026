const QRCode = require('qrcode');

async function generateQRCode(ticketId, name, quantity) {
  const qrData = JSON.stringify({
    ticketId,
    name,
    quantity,
    event: 'Iftar Meetup 2026',
    venue: 'Chennai',
  });

  const qrCodeImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    quality: 0.92,
    margin: 2,
    color: {
      dark: '#0f2f2f',
      light: '#f5e6c8',
    },
    width: 300,
  });

  return { qrCodeImage, qrData };
}

module.exports = { generateQRCode };

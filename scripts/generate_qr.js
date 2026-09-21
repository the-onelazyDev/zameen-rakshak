const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

async function generateQRCodes() {
  const upiUri = 'upi://pay?pa=zameensevakendra@ybl&pn=Zameen%20Seva%20Kendra&am=2999.00&cu=INR&tn=ZameenSevaKendra_Annual_2999';
  
  const outputPath = path.join(__dirname, '../public/assets/qr_code_clean.png');
  
  // High quality clean QR code with optimal error correction
  await QRCode.toFile(outputPath, upiUri, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin: 2,
    width: 600,
    color: {
      dark: '#0b3b60', // Authentic Government Navy Blue for a fancy, institutional look
      light: '#ffffff'
    }
  });

  console.log('✅ Generated clean navy QR code at:', outputPath);

  // Also generate pure black standard one as fallback
  const standardPath = path.join(__dirname, '../public/assets/qr_code_standard.png');
  await QRCode.toFile(standardPath, upiUri, {
    errorCorrectionLevel: 'H',
    type: 'png',
    quality: 1,
    margin: 2,
    width: 600,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  console.log('✅ Generated standard black QR code at:', standardPath);
}

generateQRCodes().catch(console.error);

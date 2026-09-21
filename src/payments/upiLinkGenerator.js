/**
 * ZameenRakshak Direct UPI Payment & Intent Link Engine
 * Generates 100% free UPI dynamic payment links (Zero Gateway Fees, Zero Commission).
 */

const DEFAULT_UPI_VPA = process.env.UPI_VPA || 'zameensevakendra@ybl';
const DEFAULT_PAYEE_NAME = 'Zameen Seva Kendra';

/**
 * Creates a standard NPCI UPI Intent Link
 * Works directly on any Indian smartphone: tapping opens Google Pay, PhonePe, or Paytm!
 */
function generateUpiIntentLink({
  vpa = DEFAULT_UPI_VPA,
  payeeName = DEFAULT_PAYEE_NAME,
  amount = 2999,
  parcelId,
  userPhone
}) {
  const transactionRef = `ZR_${Date.now().toString().slice(-6)}_${parcelId ? parcelId.slice(-4) : 'PLT'}`;
  const note = `24x7 Land Security Fee (${transactionRef})`;

  // Standard NPCI UPI URI Specification
  const encodedName = encodeURIComponent(payeeName);
  const encodedNote = encodeURIComponent(note);
  const upiUri = `upi://pay?pa=${vpa}&pn=${encodedName}&am=${amount.toFixed(2)}&cu=INR&tn=${encodedNote}&tr=${transactionRef}`;

  return {
    upiUri,
    transactionRef,
    amount,
    currency: 'INR',
    vpa,
    payeeName,
    qrSvgHint: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`
  };
}

/**
 * Formats the payment message sent to the user on WhatsApp
 */
function formatWhatsAppPaymentCard({ upiData, parcelDetails }) {
  return `
💳 *ACTIVATE 24/7 ZAMEEN-RAKSHAK SENTINEL*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🌾 *Parcel:* Gata #${parcelDetails?.khasra_no || '241'}, Gram ${parcelDetails?.village_name || 'Rampur'}
🛡️ *Coverage:* Nightly registry checks + Instant Red Alert + Free Legal Stay Petition
💰 *Annual Fee:* *₹${upiData.amount} / Year* (Less than ₹8/day!)

👉 *Tap below to Pay with any UPI App:*
${upiData.upiUri}

*(Or pay to UPI ID:* \`${upiData.vpa}\` *and send screenshot here).*
Once paid, your 24/7 autonomous shield is activated instantly!
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

module.exports = {
  generateUpiIntentLink,
  formatWhatsAppPaymentCard
};

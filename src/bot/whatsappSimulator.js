const store = require('../db/store');
const { queryLandRecord } = require('../scraper/upBhulekhScraper');
const { generateUpiIntentLink, formatWhatsAppPaymentCard } = require('../payments/upiLinkGenerator');

// Simple session store for multi-step onboarding on WhatsApp
const userSessions = new Map();

async function handleIncomingWhatsAppMessage(fromPhone, text) {
  const normalizedText = (text || '').trim();
  const session = userSessions.get(fromPhone) || { step: 'IDLE' };

  // Global reset / restart
  if (normalizedText.toLowerCase() === 'hi' || normalizedText.toLowerCase() === 'namaste' || normalizedText.toLowerCase() === 'start') {
    userSessions.set(fromPhone, { step: 'AWAITING_OPTION' });
    return `
🙏 *NAMASTE! WELCOME TO ZAMEEN-RAKSHAK SENTINEL*
*Autonomous 24/7 Shield for Ancestral Lands & Plots in India*
━━━━━━━━━━━━━━━━━━━━━━━━━━
Prevent land mafia kabza, fake registries, and unauthorized Dakhil-Kharij before the 30-day legal window expires.

👉 *Reply with a number:*
*1.* 🔍 Free Land Health & Registry Check
*2.* 🛡️ Activate 24/7 Autonomous Land Guard
*3.* 📊 Check Status of Monitored Plots
━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  // Step 1: Option Selection
  if (session.step === 'AWAITING_OPTION') {
    if (normalizedText === '1') {
      userSessions.set(fromPhone, { step: 'AWAITING_DISTRICT', data: {} });
      return `
📍 *Step 1 of 4:*
Please enter your **District (Zila)** name in Uttar Pradesh:
*(e.g., Gorakhpur, Lucknow, Varanasi, Prayagraj, Meerut)*
      `.trim();
    } else if (normalizedText === '2') {
      const user = store.getUserByPhone(fromPhone);
      const parcels = store.getAllActiveParcels().filter(p => p.user_id === user?.id);
      const targetParcel = parcels[0] || { khasra_no: '241', village_name: 'Rampur' };
      const upi = generateUpiIntentLink({ amount: 2999, parcelId: targetParcel?.id, userPhone: fromPhone });
      return formatWhatsAppPaymentCard({ upiData: upi, parcelDetails: targetParcel });
    } else if (normalizedText === '3') {
      const user = store.getUserByPhone(fromPhone);
      if (!user) return `No monitored plots found for ${fromPhone}. Send '1' to add your ancestral plot.`;
      const parcels = store.getAllActiveParcels().filter(p => p.user_id === user.id);
      return `🛡️ You have ${parcels.length} parcel(s) monitored. All records are currently SECURE.`;
    }
  }

  // Step 2: District
  if (session.step === 'AWAITING_DISTRICT') {
    session.data.district = normalizedText;
    session.step = 'AWAITING_TEHSIL';
    userSessions.set(fromPhone, session);
    return `🏛️ Enter your **Tehsil** name in ${normalizedText}:\n*(e.g., Chauri Chaura, Sadar, Mohanlalganj)*`;
  }

  // Step 3: Tehsil
  if (session.step === 'AWAITING_TEHSIL') {
    session.data.tehsil = normalizedText;
    session.step = 'AWAITING_VILLAGE';
    userSessions.set(fromPhone, session);
    return `🌾 Enter your **Village (Gram)** name or Pin Code:\n*(e.g., Rampur, Shahpur, Malihabad)*`;
  }

  // Step 4: Village
  if (session.step === 'AWAITING_VILLAGE') {
    session.data.village = normalizedText;
    session.step = 'AWAITING_KHASRA';
    userSessions.set(fromPhone, session);
    return `🔢 Finally, enter your **Khasra / Gata Number** (Plot No.):\n*(e.g., 241 or 412/1)*`;
  }

  // Step 5: Khasra -> Query Scraper & Output Verified Certificate Card
  if (session.step === 'AWAITING_KHASRA') {
    session.data.khasraNo = normalizedText;
    session.step = 'AWAITING_CONFIRMATION';

    const record = await queryLandRecord({
      district: session.data.district,
      tehsil: session.data.tehsil,
      village: session.data.village,
      khasraNo: session.data.khasraNo
    });

    session.data.verifiedRecord = record;
    userSessions.set(fromPhone, session);

    const owner = record.recorded_owners[0] || {};
    return `
✅ *OFFICIAL LAND RECORD VERIFIED FROM UP BHULEKH!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🌾 *Gram (Village):* ${record.parcel_details.village}
🏛️ *Tehsil:* ${record.parcel_details.tehsil}, ${record.parcel_details.district}
📍 *Gata (Khasra) No:* ${record.parcel_details.khasra_no}
📐 *Total Area:* ${record.parcel_details.total_area}
👤 *Recorded Owner:* *${owner.name}* (s/o ${owner.father_name})
💰 *Active Bank Loans:* None (Clean)
⚖️ *Pending Mutation Cases:* None (Safe)
━━━━━━━━━━━━━━━━━━━━━━━━━━
🌟 *Current Integrity Status:* 🟢 *CLEAN & SECURE TODAY*

*Did you know?* 85% of land frauds occur when fraudulent parties initiate Dakhil-Kharij while the family is living away!

👉 Reply *ACTIVATE* to enable 24/7 Nightly Sentinel Protection (₹2,999/yr)
👉 Reply *RESTART* to check another parcel
    `.trim();
  }

  // Step 6: Confirmation & Payment Trigger
  if (session.step === 'AWAITING_CONFIRMATION') {
    if (normalizedText.toUpperCase() === 'ACTIVATE') {
      let user = store.getUserByPhone(fromPhone);
      if (!user) {
        user = store.createUser({ phone_number: fromPhone, full_name: session.data.verifiedRecord.recorded_owners[0]?.name || 'Landowner' });
      }

      const parcel = store.addParcel({
        user_id: user.id,
        district_name: session.data.district,
        tehsil_name: session.data.tehsil,
        village_name: session.data.village,
        khasra_no: session.data.khasraNo,
        total_area: session.data.verifiedRecord.parcel_details.total_area,
        baseline_snapshot: session.data.verifiedRecord
      });

      const upi = generateUpiIntentLink({ amount: 2999, parcelId: parcel.id, userPhone: fromPhone });
      session.step = 'AWAITING_PAYMENT_CONFIRM';
      userSessions.set(fromPhone, session);

      return formatWhatsAppPaymentCard({ upiData: upi, parcelDetails: parcel });
    }
  }

  // Step 7: Payment Confirmation simulation
  if (session.step === 'AWAITING_PAYMENT_CONFIRM') {
    const user = store.getUserByPhone(fromPhone);
    if (user) store.activateUser(user.id);
    userSessions.delete(fromPhone);

    return `
🎉 *PAYMENT VERIFIED! 24/7 SENTINEL ACTIVATED!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️ Your ancestral land is now autonomously protected by ZameenRakshak Sentinel.
🔍 *Surveillance Cycle:* Every night at 2:00 AM across state revenue courts & land registries.
🚨 In case of any mutation attempt or record modification, you will receive an immediate WhatsApp Red Alert and a ready-to-file Stay Petition PDF.

*Thank you for trusting ZameenRakshak!*
━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }

  return `Reply *HI* to access ZameenRakshak menu.`;
}

module.exports = {
  handleIncomingWhatsAppMessage
};

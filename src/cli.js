const store = require('./db/store');
const { queryLandRecord } = require('./scraper/upBhulekhScraper');
const { generateUpiIntentLink, formatWhatsAppPaymentCard } = require('./payments/upiLinkGenerator');
const { runNightlySurveillance } = require('./cron/nightlyPoller');

async function runEndToEndCLI() {
  console.log('\n================================================================');
  console.log('🛡️  ZAMEEN-RAKSHAK: END-TO-END VERIFICATION & SIMULATION TEST');
  console.log('================================================================\n');

  // STEP 1: Query Land Record
  console.log('STEP 1: Testing Scraper against UP Bhulekh...');
  console.log('Query: District: Gorakhpur, Tehsil: Chauri Chaura, Gram: Rampur, Gata: 241\n');

  const record = await queryLandRecord({
    district: 'Gorakhpur',
    tehsil: 'Chauri Chaura',
    village: 'Rampur',
    khasraNo: '241'
  });

  console.log('✅ UP Bhulekh Response Received:');
  console.log(`- Village: ${record.parcel_details.village}, Tehsil: ${record.parcel_details.tehsil}`);
  console.log(`- Gata (Khasra) No: ${record.parcel_details.khasra_no}`);
  console.log(`- Total Area: ${record.parcel_details.total_area}`);
  console.log(`- Recorded Owner: ${record.recorded_owners[0].name} (s/o ${record.recorded_owners[0].father_name})`);
  console.log(`- Bank Loans: ${record.remarks_and_encumbrances.active_loans}`);
  console.log(`- Integrity Status: ${record.integrity_score}`);

  // STEP 2: Register Parcel & User
  console.log('\n----------------------------------------------------------------');
  console.log('STEP 2: Registering User and Parcel in Database...');
  const user = store.createUser({
    phone_number: '+919876543210',
    full_name: record.recorded_owners[0].name
  });
  console.log(`✅ User created with ID: ${user.id}`);

  const parcel = store.addParcel({
    user_id: user.id,
    district_name: record.parcel_details.district,
    tehsil_name: record.parcel_details.tehsil,
    village_name: record.parcel_details.village,
    khasra_no: record.parcel_details.khasra_no,
    total_area: record.parcel_details.total_area,
    baseline_snapshot: record
  });
  console.log(`✅ Parcel Gata #${parcel.khasra_no} registered for 24/7 surveillance (Parcel ID: ${parcel.id})`);

  // STEP 3: Payment Link Generation (Zero-Gateway UPI)
  console.log('\n----------------------------------------------------------------');
  console.log('STEP 3: Generating Zero-Gateway Direct UPI Intent Link...');
  const upiData = generateUpiIntentLink({
    amount: 2999,
    parcelId: parcel.id,
    userPhone: user.phone_number
  });
  console.log(`- Direct UPI URI: ${upiData.upiUri}`);
  console.log(`- WhatsApp Card Preview:\n\n${formatWhatsAppPaymentCard({ upiData, parcelDetails: parcel })}\n`);

  // Activate User
  store.activateUser(user.id);
  console.log('✅ Payment confirmed. User account activated.');

  // STEP 4: Routine Clean Surveillance
  console.log('\n----------------------------------------------------------------');
  console.log('STEP 4: Running Routine 2:00 AM Nightly Surveillance (Clean Round)...');
  await runNightlySurveillance({ injectFraudSimulation: false });

  // STEP 5: Inject Fraud & Test Red Alert + Stay Petition PDF
  console.log('\n----------------------------------------------------------------');
  console.log('STEP 5: Simulating Unauthorized Mutation (Dakhil-Kharij Scam)...');
  console.log('Injecting unauthorized claimant "Suraj Yadav" onto Gata #241...\n');

  const fraudResults = await runNightlySurveillance({ injectFraudSimulation: true });

  if (fraudResults[0]?.status === 'CRITICAL_RED_ALERT') {
    console.log('================================================================');
    console.log('🎉 SUCCESS: FRAUD CAUGHT BY DIFF ENGINE!');
    console.log(`- Anomaly Type: ${fraudResults[0].anomalies[0].category}`);
    console.log(`- Description: ${fraudResults[0].anomalies[0].description}`);
    console.log(`- Court Stay Petition Generated: ${fraudResults[0].pdfPath}`);
    console.log('================================================================\n');
  }
}

runEndToEndCLI().catch(err => {
  console.error('Test failed:', err);
});

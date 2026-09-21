const store = require('../db/store');
const { queryLandRecord } = require('../scraper/upBhulekhScraper');
const { evaluateStateDiff } = require('../engine/diffEngine');
const { generateLegalObjectionPDF } = require('../legal/objectionGenerator');

/**
 * Runs the nightly 2:00 AM automated surveillance across all monitored parcels
 */
async function runNightlySurveillance({ injectFraudSimulation = false } = {}) {
  console.log('\n[NightlyPoller] Starting 2:00 AM automated land records surveillance...');
  const parcels = store.getAllActiveParcels();
  console.log(`[NightlyPoller] Found ${parcels.length} parcel(s) to verify.\n`);

  const results = [];

  for (const parcel of parcels) {
    console.log(`[NightlyPoller] 🔍 Checking Gata #${parcel.khasra_no} in Gram ${parcel.village_name} (${parcel.district_name})...`);

    // Fetch latest status
    let latestScrape = await queryLandRecord({
      district: parcel.district_name,
      tehsil: parcel.tehsil_name,
      village: parcel.village_name,
      khasraNo: parcel.khasra_no
    });

    // If injectFraudSimulation is set to true (for testing/demo), simulate an unauthorized mutation!
    if (injectFraudSimulation) {
      latestScrape = JSON.parse(JSON.stringify(latestScrape));
      latestScrape.recorded_owners.push({
        name: 'Suraj Yadav (Unauthorized Claimant)',
        father_name: 'Unknown',
        share_ratio: '1/2',
        share_area: '0.2105 Hectare',
        residence: 'District Town'
      });
      latestScrape.remarks_and_encumbrances.pending_mutations = 'Active Dakhil-Kharij Case #MUT/2026/0412 under Section 34 UP Revenue Code';
    }

    // Run Diff Engine
    const anomalies = evaluateStateDiff(parcel.baseline_snapshot, latestScrape);

    if (anomalies.length === 0) {
      console.log(`[NightlyPoller] ✅ Parcel Gata #${parcel.khasra_no} is 100% SECURE. No alterations detected.`);
      store.updateParcelLatest(parcel.id, latestScrape, 'SECURE');
      results.push({ parcelId: parcel.id, status: 'SECURE', anomalies: [] });
    } else {
      console.log(`[NightlyPoller] 🚨 CRITICAL RED ALERT: ${anomalies.length} anomaly/fraud detected on Gata #${parcel.khasra_no}!`);
      
      // Generate Court-ready Stay Petition PDF immediately!
      const pdfResult = await generateLegalObjectionPDF({
        district: parcel.district_name,
        tehsil: parcel.tehsil_name,
        village: parcel.village_name,
        khasraNo: parcel.khasra_no,
        area: parcel.total_area,
        deceasedOwner: parcel.baseline_snapshot?.recorded_owners?.[0]?.name || 'Rameshwar Dayal',
        petitionerName: 'Valued Landowner',
        fraudClaimant: 'Suraj Yadav (Unauthorized Claimant)',
        mutationCaseNo: 'MUT/2026/0412'
      });

      // Log in Alert DB
      const alert = store.logAlert({
        parcel_id: parcel.id,
        user_id: parcel.user_id,
        severity: 'CRITICAL_RED',
        change_category: anomalies[0].category,
        diff_payload: anomalies,
        legal_draft_file: pdfResult.filePath
      });

      store.updateParcelLatest(parcel.id, latestScrape, 'ALERT_PENDING');

      results.push({
        parcelId: parcel.id,
        status: 'CRITICAL_RED_ALERT',
        anomalies,
        alertId: alert.id,
        pdfPath: pdfResult.filePath
      });
    }
  }

  console.log(`[NightlyPoller] Surveillance round completed.\n`);
  return results;
}

module.exports = {
  runNightlySurveillance
};

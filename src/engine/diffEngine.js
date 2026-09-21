/**
 * ZameenRakshak Anomaly & Fraud Diff Engine
 * Compares verified baseline land snapshot against newly scraped revenue records.
 */

function evaluateStateDiff(baselineSnapshot, latestSnapshot) {
  const anomalies = [];

  if (!baselineSnapshot || !latestSnapshot) {
    return anomalies;
  }

  // 1. Compare Recorded Owners
  const baseOwners = (baselineSnapshot.recorded_owners || []).map(o => ({
    name: (o.name || '').trim().toLowerCase(),
    father: (o.father_name || '').trim().toLowerCase()
  }));

  const latestOwners = (latestSnapshot.recorded_owners || []).map(o => ({
    name: (o.name || '').trim().toLowerCase(),
    father: (o.father_name || '').trim().toLowerCase()
  }));

  const baseNames = baseOwners.map(o => o.name);
  const latestNames = latestOwners.map(o => o.name);

  // Check for removed owners (e.g. Dadaji wiped off record)
  const removedOwners = baseOwners.filter(bo => !latestNames.includes(bo.name));
  if (removedOwners.length > 0) {
    anomalies.push({
      category: 'OWNER_REMOVED',
      severity: 'CRITICAL_RED',
      title: 'CRITICAL: Original Landowner Removed from Khatauni',
      description: `Original verified owner(s) [${removedOwners.map(o => o.name).join(', ')}] are no longer present in current revenue records!`,
      detected_at: new Date().toISOString()
    });
  }

  // Check for unauthorized new owners (Fraudulent buyer or impersonator added)
  const addedOwners = latestOwners.filter(lo => !baseNames.includes(lo.name));
  if (addedOwners.length > 0) {
    anomalies.push({
      category: 'UNAUTHORIZED_NEW_OWNER',
      severity: 'CRITICAL_RED',
      title: 'CRITICAL: Unauthorized New Name Inscribed on Land Record',
      description: `New unauthorized individual(s) [${addedOwners.map(o => o.name).join(', ')}] have appeared on the government Khatauni record!`,
      detected_at: new Date().toISOString()
    });
  }

  // 2. Check Pending Mutations / Dakhil-Kharij Applications
  const baseMutations = (baselineSnapshot.remarks_and_encumbrances?.pending_mutations || '').toLowerCase();
  const latestMutations = (latestSnapshot.remarks_and_encumbrances?.pending_mutations || '').toLowerCase();

  if (latestMutations !== baseMutations && !latestMutations.includes('zero') && !latestMutations.includes('none')) {
    anomalies.push({
      category: 'NEW_MUTATION_FILED',
      severity: 'CRITICAL_RED',
      title: 'URGENT: New Dakhil-Kharij (Mutation) Application Filed in Tehsil',
      description: `A new transfer petition has been logged at Tehsil Court: "${latestSnapshot.remarks_and_encumbrances?.pending_mutations}". Statutory 30-day objection countdown is active!`,
      detected_at: new Date().toISOString()
    });
  }

  // 3. Check Bank Mortgages / Liens
  const baseLoans = (baselineSnapshot.remarks_and_encumbrances?.active_loans || '').toLowerCase();
  const latestLoans = (latestSnapshot.remarks_and_encumbrances?.active_loans || '').toLowerCase();

  if (latestLoans !== baseLoans && !latestLoans.includes('none') && !latestLoans.includes('clean') && !latestLoans.includes('nir-rin')) {
    anomalies.push({
      category: 'BANK_MORTGAGE_ADDED',
      severity: 'WARNING_YELLOW',
      title: 'WARNING: New Bank Mortgage / Lien Inscribed on Land',
      description: `A new bank charge or hypothecation was detected: "${latestSnapshot.remarks_and_encumbrances?.active_loans}"`,
      detected_at: new Date().toISOString()
    });
  }

  // 4. Check General Remarks Column
  const baseNotes = (baselineSnapshot.remarks_and_encumbrances?.notes || '').trim();
  const latestNotes = (latestSnapshot.remarks_and_encumbrances?.notes || '').trim();

  if (baseNotes !== latestNotes && latestNotes.length > 0) {
    anomalies.push({
      category: 'REMARKS_ALTERED',
      severity: 'WARNING_YELLOW',
      title: 'Notice: Column 7 Remarks Altered in Revenue Register',
      description: `Revenue inspector modified land notes: "${latestNotes}"`,
      detected_at: new Date().toISOString()
    });
  }

  return anomalies;
}

module.exports = {
  evaluateStateDiff
};

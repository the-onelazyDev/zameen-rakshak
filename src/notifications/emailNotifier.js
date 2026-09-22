const https = require('https');
const nodemailer = require('nodemailer');

const ADMIN_EMAIL = process.env.ADMIN_ALERT_EMAIL || 'amitcse21@gmail.com';
const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER || 'amitcse21@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'kbjyvicabwzesnii';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

// HTTP REST API sender (Port 443 HTTPS - 100% cloud firewall proof on Render)
function sendViaResendHttp(apiKey, to, subject, html) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: 'Zameen Seva Kendra Alert <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html
    });

    const req = https.request('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ raw: data });
          }
        } else {
          reject(new Error(`Resend HTTP API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Resend HTTP request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

// HTTP FormSubmit Relay (Port 443 HTTPS)
function sendViaFormSubmitHttp(to, subject, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      _subject: subject,
      _template: 'table',
      ...data
    });

    const req = https.request(`https://formsubmit.co/ajax/${to}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://www.zameensevakendra.in/',
        'Origin': 'https://www.zameensevakendra.in',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZameenSevaKendra/1.0',
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 8000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('FormSubmit HTTP request timed out'));
    });
    req.write(payload);
    req.end();
  });
}

// Create transporter
function getTransporter() {
  const pass = process.env.SMTP_PASS || SMTP_PASS;
  if (!pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
    auth: {
      user: process.env.SMTP_USER || SMTP_USER,
      pass: pass.replace(/\s+/g, '')
    }
  });
}

/**
 * Send instant email notification for newly created order
 * @param {Object} order The complete order object
 */
async function sendNewOrderAlert(order) {
  const p = order.parcel || {};
  const isNRI = order.plan === 'NRI_120USD';
  const planDisplay = isNRI ? '$120 / Year (NRI Overseas Land Guard)' : '₹2,999 / वर्ष (भारतीय निवासी सुरक्षा कवच)';
  const cleanPhone = (order.phone || '').replace(/[^0-9]/g, '');
  const waLink = `https://wa.me/${cleanPhone}`;
  const now = new Date(order.created_at || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium'
  });

  const subject = `🚨 [नया ऑर्डर Alert] गाटा #${p.khasra_no} — ${order.customer_name} (${order.amount ? (isNRI ? '$' + order.amount : '₹' + order.amount) : 'Pending'})`;

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; color: #1e293b; }
      .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border: 1px solid #cbd5e1; }
      .header { background: #0b3b60; color: #ffffff; padding: 20px; text-align: center; border-bottom: 4px solid #f37021; }
      .header h1 { margin: 0; font-size: 20px; }
      .header p { margin: 5px 0 0; font-size: 13px; color: #e2e8f0; }
      .body-content { padding: 24px; }
      .badge { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 13px; margin-bottom: 16px; }
      .table-info { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      .table-info td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
      .table-info td.label { font-weight: bold; color: #475569; width: 38%; background: #f8fafc; }
      .table-info td.val { color: #0f172a; font-weight: 600; }
      .highlight-val { color: #b45309; font-weight: bold; }
      .actions { text-align: center; margin-top: 24px; }
      .btn { display: inline-block; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 5px; }
      .btn-wa { background: #25d366; color: #ffffff; }
      .footer { background: #f8fafc; padding: 14px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="header">
        <h1>🏛️ ज़मीन सेवा केंद्र — नया भूमि सुरक्षा पंजीकरण</h1>
        <p>नागरिक राजस्व अभिलेख एवं 24/7 दाखिल-खारिज निगरानी प्रणाली</p>
      </div>
      <div class="body-content">
        <span class="badge">🔔 नया आवेदन प्राप्त हुआ</span>

        <table class="table-info">
          <tr>
            <td class="label">ऑर्डर आईडी (Order ID)</td>
            <td class="val">${order.id || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">दिनांक व समय (Time)</td>
            <td class="val">${now}</td>
          </tr>
          <tr>
            <td class="label">आवेदक का नाम (Customer)</td>
            <td class="val" style="font-size: 16px; color: #0b3b60;">${order.customer_name || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">व्हाट्सएप / फोन (Phone)</td>
            <td class="val">
              <a href="tel:${order.phone}" style="color: #0284c7; text-decoration: none;">${order.phone || 'N/A'}</a>
            </td>
          </tr>
          <tr>
            <td class="label">ईमेल (Customer Email)</td>
            <td class="val">${order.email || order.notes || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">गाटा / खसरा संख्या</td>
            <td class="val highlight-val" style="font-size: 16px;">गाटा #${p.khasra_no || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">ग्राम / मौजा (Village)</td>
            <td class="val">${p.village || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">तहसील (Tehsil)</td>
            <td class="val">${p.tehsil || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">जनपद / जिला (District)</td>
            <td class="val">${p.district || 'N/A'}</td>
          </tr>
          <tr>
            <td class="label">चुनी गई योजना (Plan)</td>
            <td class="val">${planDisplay}</td>
          </tr>
          <tr>
            <td class="label">फीस राशि (Amount)</td>
            <td class="val" style="color: #15803d; font-size: 16px;">${isNRI ? '$' + order.amount : '₹' + order.amount}</td>
          </tr>
          <tr>
            <td class="label">भुगतान संदर्भ (UTR / Ref)</td>
            <td class="val" style="background: #fef3c7; color: #92400e;">${order.utr ? order.utr : 'Direct UPI Pending'}</td>
          </tr>
        </table>

        <div class="actions">
          <a href="${waLink}" target="_blank" class="btn btn-wa">💬 आवेदक को WhatsApp संदेश भेजें</a>
          <a href="tel:${order.phone}" class="btn" style="background: #0b3b60; color: #ffffff;">📞 सीधे कॉल करें (${order.phone})</a>
        </div>
      </div>
      <div class="footer">
        © 2026 ज़मीन सेवा केंद्र (Zameen Seva Kendra) • स्वचालित नागरिक अलर्ट प्रणाली
      </div>
    </div>
  </body>
  </html>
  `;

  // 1. If RESEND_API_KEY is available, use HTTPS REST API (Port 443)
  const resendKey = process.env.RESEND_API_KEY || RESEND_API_KEY;
  if (resendKey) {
    try {
      const resendRes = await sendViaResendHttp(resendKey, ADMIN_EMAIL, subject, html);
      console.log(`✅ [HTTP API] Order email sent to ${ADMIN_EMAIL} via Resend:`, resendRes);
      return { success: true, provider: 'resend', id: resendRes.id || 'sent' };
    } catch (err) {
      console.warn('⚠️ Resend HTTP send error, falling back to SMTP:', err.message);
    }
  }

  // 2. Primary: Nodemailer SMTP (smtp.gmail.com:465)
  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"ज़मीन सेवा केंद्र अलर्ट" <${SMTP_USER}>`,
        to: ADMIN_EMAIL,
        subject: subject,
        html: html
      });
      console.log(`✅ Order notification email sent successfully to ${ADMIN_EMAIL}: ${info.messageId}`);
      return { success: true, provider: 'nodemailer', messageId: info.messageId };
    } catch (err) {
      console.warn(`⚠️ Nodemailer SMTP failed (${err.message}). Trying fallback HTTP relay...`);
    }
  }

  // 3. Fallback: FormSubmit HTTP Relay (Only if SMTP & Resend failed)
  try {
    const relayRes = await sendViaFormSubmitHttp(ADMIN_EMAIL, subject, {
      'ऑर्डर आईडी (Order ID)': order.id,
      'दिनांक व समय (Time)': now,
      'आवेदक का नाम (Customer)': order.customer_name,
      'व्हाट्सएप नंबर (Phone)': order.phone,
      'ईमेल (Email)': order.email || order.notes || 'N/A',
      'गाटा / खसरा संख्या': `गाटा #${p.khasra_no}`,
      'ग्राम (Village)': p.village,
      'तहसील (Tehsil)': p.tehsil,
      'जनपद / जिला (District)': p.district,
      'सुरक्षा योजना (Plan)': planDisplay,
      'फीस राशि (Amount)': isNRI ? '$' + order.amount : '₹' + order.amount,
      'UPI UTR / Ref': order.utr || 'N/A'
    });
    console.log(`✅ Fallback HTTP relay sent successfully to ${ADMIN_EMAIL}`);
    return { success: true, provider: 'formsubmit', details: relayRes };
  } catch (relayErr) {
    console.error(`❌ All email delivery methods failed:`, relayErr.message);
    return { success: false, error: relayErr.message };
  }
}

module.exports = {
  sendNewOrderAlert,
  ADMIN_EMAIL
};

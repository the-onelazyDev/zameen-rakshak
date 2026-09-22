const express = require('express');
const path = require('path');
const fs = require('fs');
const store = require('./db/store');
const orderStore = require('./db/orderStore');
const { queryLandRecord } = require('./scraper/upBhulekhScraper');
const { runNightlySurveillance } = require('./cron/nightlyPoller');
const { handleIncomingWhatsAppMessage } = require('./bot/whatsappSimulator');
const { generateUpiIntentLink } = require('./payments/upiLinkGenerator');
const { sendNewOrderAlert } = require('./notifications/emailNotifier');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve root with dynamic absolute OpenGraph URLs based on incoming request host
app.get('/', (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http');
    const host = req.get('host') || 'www.zameensevakendra.in';
    const baseUrl = host.includes('zameensevakendra.in') ? 'https://www.zameensevakendra.in' : `${protocol}://${host}`;
    
    let html = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    if (!host.includes('www.zameensevakendra.in')) {
      html = html.replace(/https:\/\/www\.zameensevakendra\.in/g, baseUrl);
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Explicit Sitemaps and Robots endpoints with strict XML & text headers
app.get(['/sitemap.xml', '//sitemap.xml'], (req, res) => {
  res.header('Content-Type', 'application/xml; charset=utf-8');
  res.sendFile(path.join(__dirname, '../public/sitemap.xml'));
});

app.get(['/robots.txt', '//robots.txt'], (req, res) => {
  res.header('Content-Type', 'text/plain; charset=utf-8');
  res.sendFile(path.join(__dirname, '../public/robots.txt'));
});

// Serve Static Assets from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve Petitions for download
app.use('/petitions', express.static(path.join(__dirname, '../data/petitions')));

// Endpoint to save generated OpenGraph preview images
app.post('/api/save-og-image', (req, res) => {
  try {
    const { image1200, image600 } = req.body;
    if (!image1200) {
      return res.status(400).json({ success: false, error: 'image1200 is required' });
    }
    const cleanB64_1200 = image1200.replace(/^data:image\/\w+;base64,/, '');
    const buf1200 = Buffer.from(cleanB64_1200, 'base64');
    fs.writeFileSync(path.join(__dirname, '../public/assets/og_share_preview.jpg'), buf1200);

    let size600 = 0;
    if (image600) {
      const cleanB64_600 = image600.replace(/^data:image\/\w+;base64,/, '');
      const buf600 = Buffer.from(cleanB64_600, 'base64');
      fs.writeFileSync(path.join(__dirname, '../public/assets/logo_square_og.jpg'), buf600);
      size600 = buf600.length;
    }

    res.json({
      success: true,
      message: 'OG images saved successfully',
      size1200: buf1200.length,
      size600
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- ORDERS API (For Concierge Model) ---
app.post('/api/orders/create', (req, res) => {
  try {
    const { customerName, phone, email, state, district, tehsil, village, khasraNo, plan, amount, utr, notes } = req.body;
    if (!phone || !khasraNo) {
      return res.status(400).json({ success: false, error: 'Phone and Khasra No are required' });
    }
    const order = orderStore.createOrder({
      customerName, phone, email, state: state || 'Uttar Pradesh', district, tehsil, village, khasraNo, plan, amount, utr, notes: notes || email
    });

    // Send instant email notification to amitcse21@gmail.com
    sendNewOrderAlert({ ...order, email: email || notes }).catch(err => {
      console.error('Failed to dispatch order email alert:', err.message);
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Diagnostic test endpoint to test live email delivery
app.get('/api/test-email', async (req, res) => {
  try {
    const testOrder = {
      id: 'TEST_' + Date.now().toString(36).toUpperCase(),
      customer_name: 'Test Live Diagnostic',
      phone: '+917417174025',
      email: 'amitcse21@gmail.com',
      parcel: {
        district: 'Ghaziabad',
        tehsil: 'Modinagar',
        village: 'Kadrabad',
        khasra_no: '28MI'
      },
      plan: 'ANNUAL_2999',
      amount: 2999,
      utr: 'TEST_UTR_LIVE'
    };
    const result = await sendNewOrderAlert(testOrder);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

// 1. API: Check Land Health
app.post('/api/check-land', async (req, res) => {
  const { district = 'Gorakhpur', tehsil = 'Chauri Chaura', village = 'Rampur', khasraNo = '241' } = req.body;
  try {
    const record = await queryLandRecord({ district, tehsil, village, khasraNo });
    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. API: Register & Activate Parcel
app.post('/api/register-parcel', (req, res) => {
  const { phone = '+919876543210', district, tehsil, village, khasraNo, baselineSnapshot } = req.body;
  let user = store.getUserByPhone(phone);
  if (!user) {
    user = store.createUser({ phone_number: phone, is_active: true });
  }
  const parcel = store.addParcel({
    user_id: user.id,
    district_name: district,
    tehsil_name: tehsil,
    village_name: village,
    khasra_no: khasraNo,
    baseline_snapshot: baselineSnapshot
  });
  res.json({ success: true, parcel });
});

// 3. API: Run Nightly Surveillance (With optional fraud injection)
app.post('/api/run-surveillance', async (req, res) => {
  const { injectFraud = false } = req.body;
  const results = await runNightlySurveillance({ injectFraudSimulation: injectFraud });
  res.json({ success: true, results, alertLogs: store.loadDatabase ? store.loadDatabase().alert_logs : [] });
});

// 4. API: Meta WhatsApp Webhook
app.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'zameen_secret_token')) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

app.post('/webhook/whatsapp', async (req, res) => {
  const messageBody = req.body.message || req.body.text;
  const from = req.body.from || '+919876543210';
  const responseText = await handleIncomingWhatsAppMessage(from, messageBody);
  res.json({ response: responseText });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏛️ ज़मीन सेवा केंद्र (Zameen Seva Kendra) Live on Port ${PORT}`);
  console.log(`👉 Open Website: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});

module.exports = app;

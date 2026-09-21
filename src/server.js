const express = require('express');
const path = require('path');
const fs = require('fs');
const store = require('./db/store');
const orderStore = require('./db/orderStore');
const { queryLandRecord } = require('./scraper/upBhulekhScraper');
const { runNightlySurveillance } = require('./cron/nightlyPoller');
const { handleIncomingWhatsAppMessage } = require('./bot/whatsappSimulator');
const { generateUpiIntentLink } = require('./payments/upiLinkGenerator');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Assets from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Admin Route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Serve Petitions for download
app.use('/petitions', express.static(path.join(__dirname, '../data/petitions')));

// --- ORDERS API (For Concierge Model) ---
app.post('/api/orders/create', (req, res) => {
  try {
    const { customerName, phone, district, tehsil, village, khasraNo, plan, amount, utr, notes } = req.body;
    if (!phone || !khasraNo) {
      return res.status(400).json({ success: false, error: 'Phone and Khasra No are required' });
    }
    const order = orderStore.createOrder({
      customerName, phone, district, tehsil, village, khasraNo, plan, amount, utr, notes
    });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/list', (req, res) => {
  try {
    const orders = orderStore.getAllOrders();
    const stats = orderStore.getOrderStats();
    res.json({ success: true, orders, stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/orders/update-status', (req, res) => {
  try {
    const { orderId, status, notes } = req.body;
    const order = orderStore.updateOrderStatus(orderId, { order_status: status, admin_notes: notes });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
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
  console.log(`👉 Admin Orders Desk: http://localhost:${PORT}/admin (PIN: 7788)`);
  console.log(`======================================================\n`);
});

module.exports = app;

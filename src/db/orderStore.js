const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '../../data/orders.json');

// Initialize orders file if it does not exist
function initStore() {
  const dir = path.dirname(ORDERS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: [] }, null, 2), 'utf8');
  }
}

function loadOrders() {
  initStore();
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load orders:', err);
    return { orders: [] };
  }
}

function saveOrders(data) {
  initStore();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Creates a new order
 */
function createOrder({
  customerName = 'Landowner',
  phone,
  state = 'Uttar Pradesh',
  district,
  tehsil,
  village,
  khasraNo,
  plan = 'ONE_TIME_199',
  amount = 199,
  utr = '',
  notes = ''
}) {
  const db = loadOrders();
  const orderId = 'ORD_' + Date.now().toString(36).toUpperCase() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const newOrder = {
    id: orderId,
    created_at: new Date().toISOString(),
    customer_name: customerName,
    phone: phone.replace(/[^0-9+]/g, ''),
    parcel: {
      state: state || 'Uttar Pradesh',
      district: district || 'Unknown',
      tehsil: tehsil || 'Unknown',
      village: village || 'Unknown',
      khasra_no: khasraNo || 'Unknown'
    },
    plan,
    amount: parseFloat(amount) || (plan === 'ANNUAL_2999' ? 2999 : 199),
    payment_status: utr ? 'PAID_VERIFYING' : 'PENDING',
    order_status: 'PENDING_REVIEW', // PENDING_REVIEW, IN_PROGRESS, COMPLETED, CANCELLED
    utr: utr.trim(),
    admin_notes: notes,
    delivered_at: null
  };

  db.orders.unshift(newOrder); // Newest first
  saveOrders(db);
  return newOrder;
}

/**
 * Get all orders
 */
function getAllOrders() {
  const db = loadOrders();
  return db.orders || [];
}

/**
 * Update order status
 */
function updateOrderStatus(orderId, { order_status, payment_status, admin_notes }) {
  const db = loadOrders();
  const order = db.orders.find(o => o.id === orderId);
  if (!order) return null;

  if (order_status) {
    order.order_status = order_status;
    if (order_status === 'COMPLETED') {
      order.delivered_at = new Date().toISOString();
    }
  }
  if (payment_status) order.payment_status = payment_status;
  if (admin_notes !== undefined) order.admin_notes = admin_notes;

  saveOrders(db);
  return order;
}

/**
 * Get Order Statistics
 */
function getOrderStats() {
  const orders = getAllOrders();
  const totalOrders = orders.length;
  const pendingReview = orders.filter(o => o.order_status === 'PENDING_REVIEW').length;
  const completed = orders.filter(o => o.order_status === 'COMPLETED').length;
  const totalRevenue = orders
    .filter(o => o.payment_status === 'PAID_VERIFYING' || o.payment_status === 'CONFIRMED' || o.order_status === 'COMPLETED')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  return {
    totalOrders,
    pendingReview,
    completed,
    totalRevenue
  };
}

module.exports = {
  createOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
};

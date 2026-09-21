const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../../data/zameen_db.json');

// Ensure data folder exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      parcels: [],
      court_records: [],
      alert_logs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading DB file, reinitializing:', err.message);
    return { users: [], parcels: [], court_records: [], alert_logs: [] };
  }
}

function saveDatabase(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

const store = {
  // Users
  getUserByPhone(phone) {
    const db = loadDatabase();
    return db.users.find(u => u.phone_number === phone);
  },
  createUser(userData) {
    const db = loadDatabase();
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      full_name: userData.full_name || 'Valued Landowner',
      phone_number: userData.phone_number,
      plan_tier: userData.plan_tier || 'DOMESTIC_ANNUAL',
      is_active: userData.is_active || false,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveDatabase(db);
    return newUser;
  },
  activateUser(userId) {
    const db = loadDatabase();
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.is_active = true;
      user.activated_at = new Date().toISOString();
      saveDatabase(db);
    }
    return user;
  },

  // Parcels (Monitored Lands)
  addParcel(parcelData) {
    const db = loadDatabase();
    const newParcel = {
      id: `pcl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: parcelData.user_id,
      state: parcelData.state || 'UTTAR_PRADESH',
      district_name: parcelData.district_name,
      tehsil_name: parcelData.tehsil_name,
      village_name: parcelData.village_name,
      khasra_no: parcelData.khasra_no,
      total_area: parcelData.total_area || '0.4210 Hectare (~1.04 Acre)',
      baseline_snapshot: parcelData.baseline_snapshot,
      latest_snapshot: parcelData.latest_snapshot || parcelData.baseline_snapshot,
      last_checked_at: new Date().toISOString(),
      status: 'SECURE', // 'SECURE', 'ALERT_PENDING', 'UNDER_DISPUTE'
      created_at: new Date().toISOString()
    };
    db.parcels.push(newParcel);
    saveDatabase(db);
    return newParcel;
  },
  getAllActiveParcels() {
    const db = loadDatabase();
    return db.parcels;
  },
  getParcelById(id) {
    const db = loadDatabase();
    return db.parcels.find(p => p.id === id);
  },
  updateParcelLatest(id, latestSnapshot, status) {
    const db = loadDatabase();
    const parcel = db.parcels.find(p => p.id === id);
    if (parcel) {
      parcel.latest_snapshot = latestSnapshot;
      parcel.last_checked_at = new Date().toISOString();
      if (status) parcel.status = status;
      saveDatabase(db);
    }
    return parcel;
  },

  // Alert Logs
  logAlert(alertData) {
    const db = loadDatabase();
    const newAlert = {
      id: `alt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parcel_id: alertData.parcel_id,
      user_id: alertData.user_id,
      severity: alertData.severity || 'CRITICAL_RED',
      change_category: alertData.change_category,
      diff_payload: alertData.diff_payload,
      legal_draft_file: alertData.legal_draft_file || null,
      created_at: new Date().toISOString()
    };
    db.alert_logs.push(newAlert);
    saveDatabase(db);
    return newAlert;
  },
  getAlertsForUser(userId) {
    const db = loadDatabase();
    return db.alert_logs.filter(a => a.user_id === userId);
  }
};

module.exports = store;

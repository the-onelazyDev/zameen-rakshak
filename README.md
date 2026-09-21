# 🛡️ ZameenRakshak Sentinel

> Autonomous 24/7 Sentinel for Ancestral Land Encroachment & Illegal Mutation (Dakhil-Kharij) Detection in India.

---

## 🚀 Quick Start (Testing in 1 Minute)

### 1. Run Complete End-to-End CLI Simulation:
```bash
node src/cli.js
```
This single command runs the entire pipeline:
1. Queries UP Bhulekh records for a land parcel.
2. Registers parcel in database.
3. Generates zero-gateway direct UPI payment link.
4. Simulates a routine 2:00 AM clean surveillance.
5. Injects an unauthorized mutation scam (fraudster adding name).
6. Diff engine detects the anomaly, triggers a Red Alert, and generates an official **Section 35 Court Stay Petition PDF**!

---

### 2. Run Interactive Web Testing Dashboard:
```bash
node src/server.js
```
Open **`http://localhost:3000`** in your browser to:
* Look up real land records by District, Tehsil, Village & Khasra No.
* Test the WhatsApp Bot conversational onboarding flow.
* Trigger live fraud simulation and preview generated court PDFs.

---

## 📁 Project Structure

```
zameen-rakshak/
├── docs/                        # Complete blueprints & architectural playbooks
│   ├── ZAMEEN_RAKSHAK_COMPLETE_BLUEPRINT.md
│   ├── ZAMEEN_RAKSHAK_PRACTICAL_PLAYBOOK.md
│   ├── BLUE_OCEAN_IDEAS_PART_2.md
│   ├── UNTOUCHED_GOLDMINES_PART_3.md
│   ├── BLUE_OCEAN_GOLDMINES_PART_4.md
│   ├── BLUE_OCEAN_GOLDMINES_PART_5.md
│   └── BLUE_OCEAN_GOLDMINES_PART_6.md
├── src/
│   ├── scraper/
│   │   └── upBhulekhScraper.js  # UP Bhulekh & RCCMS revenue query engine
│   ├── engine/
│   │   └── diffEngine.js        # Baseline vs current state anomaly detector
│   ├── legal/
│   │   └── objectionGenerator.js# Section 35 UP Revenue Code court petition generator (PDF)
│   ├── payments/
│   │   └── upiLinkGenerator.js  # Zero-gateway dynamic UPI intent links
│   ├── bot/
│   │   └── whatsappSimulator.js # WhatsApp conversational onboarding bot
│   ├── cron/
│   │   └── nightlyPoller.js     # 2:00 AM automated surveillance scheduler
│   ├── db/
│   │   └── store.js             # Embedded JSON database
│   ├── cli.js                   # 1-command test runner
│   └── server.js                # Express web dashboard & Meta WhatsApp webhook
├── data/
│   ├── zameen_db.json           # Local database store
│   └── petitions/               # Auto-generated legal stay PDFs
└── package.json
```

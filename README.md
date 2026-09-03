
# SIH

# Sahakari Shramik Seva (सहकारी श्रमिक सेवा)
### Cooperative Digital Service Marketplace for Skilled Labour Workers
**Smart India Hackathon (SIH) Project Prototype**

---

## 📌 Problem Overview
Labour Cooperative Federations and Primary Labour Cooperative Societies (LCS/PACS) encompass millions of certified skilled workers (electricians, plumbers, carpenters, painters, domestic helpers, caregivers, drivers, gardeners, cleaners, and technicians). However, they have historically lacked a structured, modern digital marketplace. As a result, workers are either underemployed or exploited by private aggregators who charge **25% to 35% commission cuts** with zero social security.

## 💡 Solution: Sahakari Shramik
A modern, cooperative-owned digital platform connecting verified skilled labour with households and enterprises while ensuring:
1. **Zero Commission Exploitation**: 100% of fair wages are directly disbursed to the worker via Direct Benefit Transfer (DBT).
2. **Transparent State Fair-Wage Standard**: Eliminates arbitrary surge pricing; rates are benchmarked to state minimum skilled labour standards.
3. **Dedicated Worker Welfare Fund**: 5% of each transaction is automatically credited towards the worker's group health and accidental insurance pool.
4. **Institutional Trust & Police Verification**: Workers are verified by their registered Primary Labour Cooperative Societies.
5. **Emergency 30-Minute SOS Dispatch**: Rapid response priority callout for home breakdowns (electrical tripping, burst pipes, urgent care).

---

## 📂 Project Architecture

```
d:\SIH\
│
├── frontend/
│   ├── index.html              # Homepage (Hero, Search, 10 Categories, SOS Banner, How it Works, Why Co-op, Stats, Testimonials, Footer)
│   ├── services.html           # Services Marketplace (Live category & price filters, search, rating filter, worker cards, modal)
│   ├── booking.html            # Booking Portal (Service/worker selector, date/time slots, emergency SOS, fair-wage price calculator)
│   ├── auth.html               # Dual Citizen & Worker Auth (with 1-click Hackathon demo switch buttons)
│   ├── worker-register.html    # Worker Onboarding (Society ID, trade skills, certs, KYC, DBT bank/UPI details)
│   ├── customer-dashboard.html # Customer Hub (Active booking tracker with live steps, OTP cards, booking history, worker review modal)
│   ├── worker-dashboard.html   # Worker Portal (Online/busy/offline switch, incoming request queue with Accept/Reject, active jobs, earnings ledger)
│   │
│   ├── css/
│   │   ├── style.css           # Core design system, variables, responsive grid, navbar, hero, comparison table, footer
│   │   ├── components.css      # Cards, modals, forms, toast notifications, search filters, wizard layout
│   │   └── dashboard.css       # Metrics cards, status pills, tables, progress step trackers, availability switch
│   │
│   └── js/
│       ├── data.js             # Seed database: 10 trade categories, 20+ verified cooperative workers, societies, initial bookings
│       ├── store.js            # LocalStorage persistence layer: stores new bookings, registered workers, auth status, ratings
│       ├── app.js              # Global application scripts: mobile navigation, toast alerts, session indicators
│       ├── services.js         # Live marketplace search, filtering, and worker profile preview modal
│       ├── booking.js          # Booking wizard, time slot selector, dynamic price & welfare fund calculation, booking creation
│       └── dashboard.js        # Customer and worker dashboard controllers, booking acceptance/rejection, job completion flow
│
└── README.md                   # Project documentation and guide
```

---

## 🛠️ Included 10 Service Categories
1. **Electrician**: Wiring, switchboards, MCB repairs, inverters, home appliances
2. **Plumber**: Concealed pipe leakages, water pumps, taps, sanitary fixtures
3. **Carpenter**: Furniture repair, locks, doors, modular woodwork, polishing
4. **Painter**: Interior/exterior emulsions, waterproofing, putty, primers
5. **Domestic Helper**: Daily housekeeping, meal support, utensil cleaning, dusting
6. **Caregiver**: Elderly nursing, bedside patient attendance, infant care, post-op support
7. **Driver**: Personal four-wheeler driver, outstation travel, commercial vehicle driver
8. **Gardener**: Lawn mowing, pruning, plant nutrition, organic soil mixing, terrace gardens
9. **Cleaner**: Deep home sanitation, sofa shampooing, bathroom descaling, disinfection
10. **Technician**: Air conditioner servicing, refrigerator maintenance, washing machines, RO systems

---

## 🚀 How to Run the Project

### Option 1: Direct Browser Launch (No installation required)
Simply open `frontend/index.html` in Google Chrome, Microsoft Edge, or Firefox.

### Option 2: Using Node.js or Python Local Server
Open your terminal in the `d:\SIH` folder:

**Using Python:**
```bash
python -m http.server 3000 --directory frontend
```
Then visit: `http://localhost:3000`

**Using Node.js (npx serve):**
```bash
npx serve frontend
```
Then visit the URL shown in terminal.

---

## 🎯 Recommended Presentation Demo Flow for Jury

1. **Homepage (`frontend/index.html`)**:
   - Showcase the official cooperative branding, 10 categories, the comparison table between Cooperative vs. Private Aggregators, and the Emergency 30-min SOS banner.
   - Use the search bar to search for "Electrician" or "Plumber".

2. **Services Marketplace (`services.html`)**:
   - Filter by "Plumber" and "Electrician".
   - Toggle the "Emergency SOS Available" checkbox.
   - Click "Profile" on any worker to showcase cooperative society verification, background check status, and transparent fair wage rates.

3. **Customer Booking (`booking.html`)**:
   - Click "Book Now" on a worker.
   - Select tomorrow's time slot and toggle Emergency SOS to view the live price calculation breakdown (Base Labour + 5% Worker Welfare & Health Insurance Fund).
   - Submit the booking to receive an instant Booking Reference ID (e.g. `SHK-2026-XXXX`) and a secure 4-digit service OTP.

4. **Customer Hub (`customer-dashboard.html`)**:
   - View the active booking in real-time with the step progress tracker (*Requested* -> *Accepted* -> *In Progress* -> *Completed*).
   - Check the accumulated "Worker Welfare Contributed" counter.

5. **Worker Portal (`worker-dashboard.html`)**:
   - Switch availability status between *Online*, *Busy on Job*, and *Offline*.
   - View the incoming request in the queue and click **"Accept Job"**.
   - Start the job and click **"Complete Job"** to see instant direct earnings and 5% welfare fund ledger entries.

6. **Worker Onboarding (`worker-register.html`)**:
   - Demonstrate how an unorganized skilled worker registers with their local Labour Cooperative Society and DBT bank account to receive immediate digital jobs.


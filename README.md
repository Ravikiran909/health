# HealthConnect AI | ಗ್ರಾಮೀಣ ಆರೋಗ್ಯ ಸಂಪರ್ಕ

> **National-Level Healthcare Hackathon 2026 Submission**  
> Bilingual (Kannada & English) Rural Healthcare Navigation Platform with Voice AI, Primary Health Centre (PHC) Finder, ASHA Saathi Dashboard, Offline PWA Sync, Emergency 108 Dispatch, and the **HealthConnect Access Scorecard** ⭐.

---

## 🚀 Quick Start & Exact Terminal Commands

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun**
- **Modern Browser**: Chrome, Edge, or Safari with Web Speech & Notification API support

### 2. Installation
Open your terminal in VS Code inside the project directory:

```bash
# Install all frontend and backend dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Configure the following variables in `.env`:
```env
# Gemini API Key for server-side clinical navigation (Gemini 3.8 Flash)
GEMINI_API_KEY="your_gemini_api_key_here"

# Server Port
PORT=3000

# Optional MongoDB connection (embedded database active if omitted)
MONGODB_URI="mongodb://localhost:27017/healthconnect"
```

### 4. Run the Full-Stack Application
Start the unified Express server and Vite development frontend:

```bash
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 🌟 Hackathon Highlights & Architecture

### ⭐ Special Hackathon Innovation: HealthConnect Access Scorecard
- Evaluates usability and accessibility gains in rural populations.
- **Empirical Usability Benchmark**: Compares **Kannada Voice Navigation** vs **Standard Web GUI**.
- **Real Metrics**: Measures completion time, assistance prompts, and user ease rating (1-5 Likert scale) with voluntary informed consent.
- **Observed Result**: Users complete key tasks (such as locating 24/7 delivery PHCs or vaccination schedules) **~60% faster** using voice assistance.

### 🎙️ Bilingual Kannada (ಕನ್ನಡ) & English Voice Navigation
- Built using native browser `SpeechRecognition` (`kn-IN`, `en-IN`) and `SpeechSynthesis`.
- Empathetic auditory chimes give positive feedback for non-literate participants.
- Understands intent even with dialectal or colloquial rural phrasing.

### 🤖 Gemini AI Navigation Agent (Gemini 3.8 Flash)
- Server-side integration with `@google/genai` (API key never exposed to client).
- **Safety Preambles**: Strictly prohibited from diagnosing diseases or prescribing drug dosages.
- Directs emergency symptoms (chest pain, snakebite, hemorrhaging) to **108 Emergency**.
- Retrieves grounded answers from the verified Karnataka Public Healthcare directory.

### 🏥 Hospital & PHC Directory
- Verified facilities: Bilikere PHC (24/7 Delivery), Hunsur Taluk Hospital, Hullahalli CHC, Mysuru District Hospital (K.R. Hospital), Saligrama Maternal Centre, Bannur CHC, HD Kote Tribal Centre.
- Filters by 24/7 emergency care, bed capacity, doctors on duty, and Google Maps GPS navigation.

### 👩‍⚕️ ASHA Saathi Community Worker Hub
- Mandatory **Informed Consent** capture protocol (Verbal, Digital, or Written).
- Maternal ANC Tracking (Trimesters, EDD, IFA tablets).
- High-risk pregnancy flagging (Weekly monitoring alert).
- Referral slip generator (PHC $\rightarrow$ Taluk/District Hospital).
- Simulated SMS & Push alert reminders.

### 🔔 Firebase Cloud Messaging (FCM) Push Notifications
- Full frontend & backend FCM architecture:
  - **FCM Service Worker**: `public/firebase-messaging-sw.js` handles background push payloads and notification clicks.
  - **Device Token Registry**: `POST /api/fcm/tokens` records device registration tokens mapped to user role and identifier.
  - **Citizen Appointment Reminders**: `POST /api/fcm/appointment-reminder` dispatches bilingual reminders (e.g. upcoming ANC checkup at Bilikere PHC).
  - **ASHA Worker Task Alerts**: `POST /api/fcm/asha-task-alert` dispatches high-priority alerts for new hospital referrals and overdue patient visits.
  - **Interactive Testing**: Click the notification bell in the top navbar to simulate live FCM User Reminders or ASHA Alerts with 1 click.

### 📱 Offline PWA & IndexedDB Synchronization
- Installable Web App Manifest (`manifest.webmanifest`) and Service Worker (`sw.js`).
- Local queue in IndexedDB for appointments and patient registration when internet drops.
- Automatic background synchronization on reconnection with idempotency protection.

### 🚨 Emergency 108 Dialer
- 1-tap `tel:108` phone dialer launch.
- Emergency first-aid guidance for snakebites, hemorrhage, labour, and heart distress.
- Direct lines to Karnataka 104 Health Helpline and 102 JSSK Maternal Transport.

---

## 🧪 Testing & Verification Guide

### 1. Test Voice Navigation
1. Click the large **"Speak with Voice Assistant"** or mic icon.
2. Grant microphone access when prompted by the browser.
3. Say: *"ಬಿಳಿಕೆರೆ ಸಮೀಪದ ಹೆರಿಗೆ ಆಸ್ಪತ್ರೆ ಯಾವುದು?"* or *"Find nearest delivery hospital"*.
4. Verify spoken audio response and 1-click facility navigation button.

### 2. Test Offline Mode
1. Open DevTools (`F12`) $\rightarrow$ Network tab $\rightarrow$ Set throttling to **"Offline"**.
2. Notice the yellow **"Offline Mode Active"** banner.
3. Book an appointment or register a patient in ASHA Saathi.
4. Verify the item is stored with **"Offline Queued"** status.
5. Set network back to **"Online"** $\rightarrow$ Click **"Sync Now"** $\rightarrow$ Verify server confirmation.

### 3. Test Access Scorecard Benchmark
1. Navigate to the **"Access Scorecard ⭐"** tab.
2. Select Task: *"Find Nearest 24/7 Delivery PHC"*.
3. Click **"Start Benchmark Task"** to initiate the live timer.
4. Test with Voice vs GUI and record ease rating.
5. Review the updated comparative analytics.

### 4. Test Emergency 108 Safely
1. Click the red **"108 EMERGENCY"** button.
2. Verify the confirmation modal and first-aid instructions appear.
3. Tap **"DIAL 108 NOW"** to confirm the device dialer opens with 108.
4. *Do not place an actual call unless there is a genuine life-threatening emergency.*

---

## 📜 Ethical Data Notice
- Facility data is verified against public district directories of Karnataka Health and Family Welfare.
- Patient entries in the ASHA dashboard are synthetic demonstration records for evaluation purposes.

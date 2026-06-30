# 🏢 NL Mess Pro

> **A Premium, Feature-Rich Residential Community & Mess Management System**

NL Mess Pro is a modern, real-time web application designed to simplify daily operations for shared residences, boarding houses, and mess communities. Built with **React**, **TypeScript**, **Tailwind CSS**, and **Firebase**, it eliminates messy paper registers and manual spreadsheet calculations by automating meal counts, bazaar cost ledgers, rent management, and financial settlements.

---

## 🌟 Key Features

### 📊 Real-Time Dashboard
* **Instant Financial Status**: View total deposits, active bazaar costs, calculated meal rates, and net balances at a glance.
* **Dynamic Graphs**: Visualize daily meal consumption trends and active meal rate fluctuations.
* **Mess Profile**: Manage active resident capacities, view geostationary mess coordinates, and check active bazaar managers.

### 🍽️ Smart Meal Tracker & Tomorrow's Meals
* **Tomorrow's Meal Planner**: Borders can schedule tomorrow's meals (Morning `0.5`, Lunch `1.0`, Dinner `1.0`) directly.
* **Guest Meal Requests**: Border members can request guest meals with standard approval logic.
* **Manager Approvals**: A dedicated approvals deck enables managers to approve or decline guest meals.
* **Excel-Style Spreadsheet**: A clean grid spreadsheet with visual indicators (green `+G` badges for approved guests, amber `+G?` for pending requests) and automated cook segment counts.

### 💰 Deposit & Bazaar Portals
* **Deposit Logs**: Record border contributions with flexible payment methods (Cash, bKash, Nagad, Bank) and custom notes.
* **Bazaar Ledger**: Categorize expenditures (Groceries, Meat & Fish, Utilities, Cook Salary) to dynamically recalculate the running meal rate.

### 🔑 Rent & Costs Manager
* **Room Rent (Vara)**: Track monthly room allocations, payment completions, and cash balances.
* **Mess Expenses**: Document essential flat expenses separate from the bazaar pool.
* **Financial Ledger**: Instant, transparent settlements showing who is refundable and who owes money.

### 💬 Real-Time Group Chat & Alerts
* **Centered Chat Modal**: Floating Action Button (FAB) at the bottom-right corner triggers a spring-animated chat modal.
* **Badges & Emojis**: Consecutively grouped bubble layout with roles/rewards badges and quick emoji reactions.
* **Alert Center**: In-app notifications inform borders of manager modifications to their records.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, TypeScript
* **Styling**: Tailwind CSS, Lucide Icons
* **Animations**: Motion (Framer Motion)
* **Backend Database**: Firebase Firestore (Real-time listener queries)
* **Authentication**: Firebase Authentication
* **Date Utilities**: date-fns

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v16 or higher)
* A Firebase account

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/nabidlimon/nl-mess.git
   cd nl-mess
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory (or copy `.env.example`) and insert your Firebase Web Configuration details:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser to view the application.

---

## 📄 License & Credits
NL Mess Pro is developed to streamline residency flat accounts and boarding systems. Distributed under the MIT License.

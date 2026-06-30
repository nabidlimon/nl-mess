# Project Context: Mess Tracker (mess-tracker)

This document provides a comprehensive overview of the **Mess Tracker** project. It serves as a unified reference for developers and AI agents to understand the architecture, data models, business logic, security configuration, and frontend structures of the application.

---

## 1. Project Overview

**Mess Tracker** is a student hostel / boarding house management application (popularly referred to as a "mess" in South Asia). It isolates data on a per-mess basis, allowing managers to track members, daily meal counts, bazar expenses, utility deposits, room rents (vara), and essential costs. 

The application calculates running meal rates in real-time, displays personal balance statements (surplus or due), enables interactive group messaging, gathers meal preferences via polling, and allows managers to approve/decline new borders.

---

## 2. Core Technical Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vite.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: Tailwind CSS (integrated via the modern `@tailwindcss/vite` plugin)
- **Database & Backend**: Firebase Suite (Authentication, Firestore, Storage)
- **Routing**: `react-router-dom` (v7)
- **Animation**: `framer-motion` (and `motion` package)
- **Utility Tools**:
  - `date-fns` for time, date calculations, and formatting.
  - `recharts` for composing cumulative daily meal counts and running rate charts.
  - `xlsx`, `jspdf`, `jspdf-autotable`, and `html-to-image` for generating and exporting billing sheets/reports to Excel, PDF, and PNG formats.
  - `lucide-react` for icons.

---

## 3. Architecture & Contexts

The application's state and behavior are driven by three top-level React Contexts and a custom hook located in the `src/contexts` and `src/hooks` directories:

### 3.1. AuthContext ([AuthContext.tsx](file:///d:/Desktop/NL-mess/src/contexts/AuthContext.tsx))
Manages authentication state, loading indicators, and user profiles:
- Listens to Firebase Authentication (`onAuthStateChanged`).
- Fetches the active user's profile (`UserProfile`) from Firestore.
- Determines the active mess (`currentMess`) and loads all messes the user has access to (`managedMesses`).
- Identifies if the user is the supreme platform admin (`isSupreme`).
- Controls onboarding state (`hasEntered`) and provides login/logout flows.

### 3.2. LanguageContext ([LanguageContext.tsx](file:///d:/Desktop/NL-mess/src/contexts/LanguageContext.tsx))
Implements internationalization (i18n):
- Supports **English (`en`)** and **Bangla (`bn`)**.
- Uses translation keys fetched from [translations.ts](file:///d:/Desktop/NL-mess/src/locales/translations.ts).
- Automatically persists the language preference in the browser's `localStorage` under `mess_manager_lang`.

### 3.3. MonthContext ([MonthContext.tsx](file:///d:/Desktop/NL-mess/src/contexts/MonthContext.tsx))
Tracks the active month filter:
- Stores the selected month in a `'yyyy-MM'` string format.
- Automatically defaults to the current calendar month.
- All financial metrics, charts, bazar costs, and meal logs dynamically recalculate when this month is changed.

### 3.4. useGamification ([useGamification.ts](file:///d:/Desktop/NL-mess/src/hooks/useGamification.ts))
Monitors member contributions inside the mess and awards badges:
- `💰 Rich Kid`: Given to the member with the highest deposit amount in the selected month.
- `🌟 Early Saver`: Given to any other member who has made at least one deposit.
- Displayed next to user profiles in the group chat and member directories.

---

## 4. Firestore Database Schema

The database model is defined inside [firebase-blueprint.json](file:///d:/Desktop/NL-mess/firebase-blueprint.json). Standard data structures are isolated by a `messId` field to support multi-tenant isolation:

### `users`
Profiles for all borders and managers.
- Document ID: Firebase Auth UID (`userId`).
- Properties:
  - `id`: `string`
  - `name`: `string`
  - `email`: `string`
  - `phone`: `string` (optional)
  - `role`: `'Manager' | 'MealManager' | 'Border'`
  - `messId`: `string` (active mess ID)
  - `messIds`: `string[]` (list of all messes this user is affiliated with)
  - `status`: `'Pending' | 'Active' | 'Inactive'`
  - `institution`: `string` (optional)
  - `room`: `string` (optional, for room number tracking)
  - `plainPin`: `string` (legacy or local identification pin)
  - `isRegistered`: `boolean`
  - `createdAt`: `string`

### `messes`
Affiliated messes registered on the platform.
- Properties:
  - `id`: `string`
  - `name`: `string`
  - `managerIds`: `string[]` (UIDs of users authorized to manage this mess)
  - `managerPhone`: `string`
  - `email`: `string`
  - `totalBorders`: `number` (maximum capacity limit)
  - `photoUrl`: `string`
  - `location`: `{ lat: number, lng: number, address: string }`
  - `createdAt`: `string`

### `meals`
Daily meal log counts for members.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `memberId`: `string`
  - `date`: `string` (`'yyyy-MM-dd'`)
  - `mealCount`: `number` (supported values: `0`, `0.5`, `1`, `1.5`, `2`, `2.5`, `3`)
  - `displayValue`: `string` (e.g., `'1N'`, `'1D'`, `'0.5'`)
  - `morning`: `boolean`
  - `lunch`: `boolean`
  - `dinner`: `boolean`
  - `updatedAt`: `timestamp`

### `deposits`
Fund transactions deposited by members.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `memberId`: `string`
  - `amount`: `number`
  - `paymentMethod`: `string`
  - `notes`: `string`
  - `date`: `string` (`'yyyy-MM-dd'`)

### `bazarCosts`
Daily food bazaar marketing costs.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `itemName`: `string`
  - `category`: `string` (e.g., `'Fish'`, `'Meat'`, `'Vegetables'`)
  - `quantity`: `number`
  - `unitPrice`: `number`
  - `totalPrice`: `number`
  - `purchasedBy`: `string` (UID of the member who bought it)
  - `date`: `string` (`'yyyy-MM-dd'`)

### `rentPayments`
Collection logs for individual room rents.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `roomNo`: `string`
  - `allocatedRent`: `number` (nirdharito vara)
  - `rentPaid`: `number` (vara diyeche)
  - `notes`: `string`
  - `date`: `string` (`'yyyy-MM-dd'`)
  - `serialNo`: `string`
  - `borderName`: `string`

### `essentialCosts`
General mess expenditures (flat rent, internet, gas bills, etc.).
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `title`: `string`
  - `amount`: `number`
  - `date`: `string` (`'yyyy-MM-dd'`)
  - `notes`: `string`

### `notices`
General messages broadcasted on the Dashboard.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `title`: `string`
  - `content`: `string`
  - `author`: `string`
  - `likes`: `string[]` (array of user UIDs who liked the notice)
  - `thumbs`: `string[]` (array of user UIDs who thumbs-up reacted)
  - `createdAt`: `timestamp`

### `notifications`
Direct actions or informational messages.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `title`: `string`
  - `message`: `string`
  - `type`: `'JoinRequest' | 'MealUpdate' | 'BazarUpdate' | 'System' | 'notice' | 'registration' | 'approval'`
  - `senderId`: `string` (UID of initiator)
  - `senderName`: `string`
  - `userId`: `string` (for user-specific notifications)
  - `recipientRoles`: `string[]` (e.g., `['Manager', 'MealManager']`)
  - `readBy`: `string[]` (UIDs of users who have read the notification)
  - `status`: `'Unread' | 'Read'`
  - `actionTaken`: `'approved' | 'declined'` (for `JoinRequest` items)

### `chatMessages`
Real-time group chat inside the mess.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `senderId`: `string`
  - `senderName`: `string`
  - `senderRole`: `string`
  - `senderPhoto`: `string`
  - `content`: `string`
  - `type`: `'text'`
  - `mediaUrl`: `string`
  - `createdAt`: `timestamp`

### `polls`
Preference voting sheets.
- Properties:
  - `id`: `string`
  - `messId`: `string`
  - `question`: `string`
  - `options`: `string[]`
  - `votes`: `map` (keys: option indices, values: arrays of user UIDs)
  - `createdAt`: `timestamp`
  - `active`: `boolean`

---

## 5. Security Rules ([firestore.rules](file:///d:/Desktop/NL-mess/firestore.rules))

Access controls are handled directly inside `firestore.rules` based on roles:
- **isSignedIn()**: Verified by standard Firebase Authentication token checking.
- **isSupremeAdmin()**: Hardcoded checks matching UID token email to `'nabidahamed2003@gmail.com'`. Grants comprehensive bypass permission ("God Mode") across all collections.
- **isManager()** and **isMessAuthority()**: Looks up the document of the signed-in user in `/users/{uid}` and validates if their `role` field equals `'Manager'` or `'MealManager'`.
- **Permissions**:
  - `users`: Any signed-in user can read all users (necessary for names display). Writing is restricted to the owner of the document, managers, or superadmins.
  - `messes`: Read permission is public. Update/delete requires the user to be listed inside the mess's `managerIds` array, or be a global Manager/Superadmin.
  - `meals`, `deposits`, `bazarCosts`, `rentPayments`, `essentialCosts`, `settings`: Signed-in users can read/write (frontends enforce write policies, while backend allows write).
  - `notices`: Read is open to signed-in users; writing is limited to the mess authority.
  - `polls`: Read/vote updates are allowed for signed-in users; creation/deletion requires authority level.

---

## 6. Page Routing and Component Map

The main application structure is handled in [App.tsx](file:///d:/Desktop/NL-mess/src/App.tsx) inside the `<RoutesConfig>` mapping. All authenticated paths render inside the global navigation sidebar wrapping [AppLayout.tsx](file:///d:/Desktop/NL-mess/src/components/layout/AppLayout.tsx).

### 6.1. Auth & Entry
- **`/login` ([Login.tsx](file:///d:/Desktop/NL-mess/src/pages/Login.tsx))**: Supports single-click Google Authentication.
- **`/onboarding` ([Onboarding.tsx](file:///d:/Desktop/NL-mess/src/pages/Onboarding.tsx))**:
  - First-time users choose to create a new mess (registers them as `Manager`) or search and join an existing mess (places them as pending `Border`).
  - Users belonging to multiple messes are prompted here to select which mess to load as active.
- **Pending Boarders**: If a boarder's status is `'Pending'`, they are blocked in [App.tsx](file:///d:/Desktop/NL-mess/src/App.tsx) by a fullscreen pending notice until a manager approves them.

### 6.2. Main Board
- **`/` ([Dashboard.tsx](file:///d:/Desktop/NL-mess/src/pages/Dashboard.tsx))**:
  - Greeting segment customized by time of day (Morning/Afternoon/Evening).
  - **Passbook Widget**: Displays total month deposits, total meals eaten, estimated meal cost, and current surplus/due.
  - **Tomorrow's Meal Widget**: Allows quick ticking of morning, lunch, and dinner slots for tomorrow.
  - Overview stats: Total active borders, total month meals, total deposits, and active meal rate.
  - Composed Area & Line Chart: Shows daily meals consumed and cumulative running meal rate.
  - Notice board cards supporting like/thumbs reactions.
- **`/tomorrow-meal` ([TomorrowMeal.tsx](file:///d:/Desktop/NL-mess/src/pages/TomorrowMeal.tsx))**: Focused component containing controls for borders to submit meal bookings for the upcoming day.
- **`/meals` ([Meals.tsx](file:///d:/Desktop/NL-mess/src/pages/Meals.tsx))**: Displays a grid tracking the daily meal logs of all borders for the selected month. Managers can modify logs directly.
- **`/deposits` ([Deposits.tsx](file:///d:/Desktop/NL-mess/src/pages/Deposits.tsx))**: Lists deposits logged for the month. Managers can log new payments.
- **`/bazar` ([Bazar.tsx](file:///d:/Desktop/NL-mess/src/pages/Bazar.tsx))**: Logbook for food bazar costs. Calculates summaries categorized by product types.
- **`/settlement` ([Settlement.tsx](file:///d:/Desktop/NL-mess/src/pages/Settlement.tsx))**:
  - Ledger breakdown: Member Name, total meals, deposit amount, total meal cost, final balance (surplus/due), and final status.
  - Export functions: Generate `.xlsx` spreadsheet, `.pdf` bill format, or `.png` snapshot using `html-to-image` rendering.
- **`/manager-panel` ([ManagerPanel.tsx](file:///d:/Desktop/NL-mess/src/pages/ManagerPanel.tsx))**:
  - Rent (vara) collection tracker.
  - Utilities and general essential expenditures panel.
  - Notice board management (post/edit notices).
  - General mess preferences configurations.
- **`/members` ([Members.tsx](file:///d:/Desktop/NL-mess/src/pages/Members.tsx))**: Lists mess boarders. Managers can approve registrations, assign role privileges (`Manager` / `MealManager`), or remove accounts.
- **`/profile` ([Profile.tsx](file:///d:/Desktop/NL-mess/src/pages/Profile.tsx))**: Manages details of the logged-in user.
- **`/about` ([About.tsx](file:///d:/Desktop/NL-mess/src/pages/About.tsx))**: Explains project details and manual instructions.
- **`/authority` ([AuthorityPanel.tsx](file:///d:/Desktop/NL-mess/src/pages/AuthorityPanel.tsx))**: Restricted superadmin utility panel.

### 6.3. Key Layout Components
- **Group Chat ([ChatCenter.tsx](file:///d:/Desktop/NL-mess/src/components/notifications/ChatCenter.tsx))**: Real-time floating chat box next to notices. Allows borders to converse. Shows role badges and gamified icons.
- **Notification Hub ([NotificationCenter.tsx](file:///d:/Desktop/NL-mess/src/components/notifications/NotificationCenter.tsx))**: Displays system warnings, notice logs, and join requests. Managers can click approve/decline buttons directly within the notification cards.
- **Tomorrow's Meal Popup ([TomorrowMealPopup.tsx](file:///d:/Desktop/NL-mess/src/components/TomorrowMealPopup.tsx))**: Displays a popup on Dashboard page entry if a border has not yet saved their meal preferences for tomorrow.
- **Meal Preference Polls ([MealPollsWidget.tsx](file:///d:/Desktop/NL-mess/src/components/MealPollsWidget.tsx))**: Displays current active preference votes. Members can select options to cast their vote, and results show color-coded percentage gauges.

---

## 7. Business Logic Calculations

### 7.1. Active Meal Rate
The active meal rate is computed dynamically for the selected month as follows:
$$\text{Meal Rate} = \frac{\text{Total Bazar Cost of selected month}}{\text{Total Meals consumed of selected month}}$$
If the total meals logged is zero, the rate defaults to `0`.

### 7.2. Individual Balance Ledger
For each member, the ledger calculates:
$$\text{Individual Cost} = \text{Individual Total Meals} \times \text{Meal Rate}$$
$$\text{Individual Balance} = \text{Individual Total Deposits} - \text{Individual Cost}$$
- If $\text{Individual Balance} > 1$, the status is marked as **Advance** (refund due to member).
- If $\text{Individual Balance} < -1$, the status is marked as **Due** (member owes money).
- Otherwise, the status is marked as **Settled**.

---

## 8. Deployment & Development Configurations

- **Port mapping**: Local dev server starts on port `3000` (`npm run dev`).
- **File Watching (HMR)**: File watching is conditionally governed by `DISABLE_HMR` environment variable inside [vite.config.ts](file:///d:/Desktop/NL-mess/vite.config.ts) to prevent excessive reloading during code changes.
- **Firebase Initialization**: Configurations are loaded dynamically from [firebase-applet-config.json](file:///d:/Desktop/NL-mess/firebase-applet-config.json) during initialization in [firebase.ts](file:///d:/Desktop/NL-mess/src/lib/firebase.ts).

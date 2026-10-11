# AyurSutra Project Structure & Architecture (Post-Website Removal)

## 1. Overview
The AyurSutra platform is a specialized **Intelligent Panchakarma Clinical Management and Outcome Analytics System**.
The legacy website frontend has been decommissioned, leaving the project cleanly focused on its two primary production pillars:
1. **Cross-Platform Mobile Application** (`mobile/`)
2. **REST API Backend & AI Intelligence Engine** (`backend/`)

---

## 2. Directory Structure

```
AyurSutra-main/
├── backend/                             # Express REST API, Business Logic & AI Engine
│   ├── controllers/                     # Endpoint controllers (auth, appointments, prescriptions, etc.)
│   ├── data/ayurveda/                   # Curated Ayurvedic clinical & lifestyle knowledge base
│   ├── middleware/                      # Auth & role authorization middlewares (protect, admin, doctor, etc.)
│   ├── models/                          # Mongoose document schemas (User, Appointment, Prescription, etc.)
│   ├── routes/                          # API routing definitions (/api/auth, /api/users, /api/ai, etc.)
│   ├── services/
│   │   ├── ai/                          # Clinical decision support & chatbot guidance services
│   │   ├── analytics/                   # Treatment outcome & clinic performance analytics
│   │   └── scheduling/                  # Smart slot optimization & conflict detection
│   ├── tests/                           # Service test suites
│   ├── utils/                           # Backend helper utilities
│   ├── package.json                     # Backend dependencies & runtime scripts
│   └── server.js                        # Express server entry point
│
├── mobile/                              # Universal Native Mobile Application (Expo SDK 57 / React Native)
│   ├── api/                             # Axios client configuration & interceptors
│   ├── app/                             # Expo Router file-based screen layouts
│   │   ├── admin/                       # Administrator screens (Dashboard, Users, Appointments, Reports, More)
│   │   ├── doctor/                      # Doctor screens (Dashboard, Patients, Appointments, Prescriptions, More)
│   │   ├── therapist/                   # Therapist screens (Home, Patients, Schedule, Treatments, Profile)
│   │   ├── receptionist/                # Receptionist screens (Dashboard, Patients, Appointments, Payments, More)
│   │   ├── patient/                     # Patient screens (Home, Appointments, Treatment, Reports, Profile)
│   │   ├── login/                       # Role-based login and registration screen
│   │   ├── _layout.tsx                  # Root navigation stack & AuthProvider wrapper
│   │   └── index.tsx                    # Session restore & role routing entry point
│   ├── assets/                          # App icons, splash screens, and illustrations
│   ├── components/                      # Reusable UI components (Buttons, Inputs, Cards, Modals)
│   ├── config/                          # Environment profiles (Dev, Staging, Production)
│   ├── constants/                       # Theme colors, styling tokens, and role constants
│   ├── context/                         # React Context providers (AuthContext with SecureStore)
│   ├── hooks/                           # Custom React hooks
│   ├── services/                        # Client API services (auth, appointment, prescription, AI, etc.)
│   ├── types/                           # TypeScript interfaces and type definitions
│   ├── utils/                           # Mobile utilities (SecureStore, date helpers)
│   ├── app.json                         # Expo configuration (com.ayursutra.app)
│   ├── eas.json                         # Expo Application Services build profiles
│   ├── package.json                     # Mobile dependencies & scripts
│   └── tsconfig.json                    # TypeScript compiler configuration
│
├── docs/                                # Technical documentation & release guidelines
│   ├── ai-features/                     # AI architectural specifications & audit logs
│   ├── mobile-migration/                # Mobile migration plan, API inventory & release guides
│   └── CURRENT_PROJECT_STRUCTURE.md     # Current architecture summary (this document)
│
├── .gitignore                           # Git exclusion rules (dependencies, secrets, build artifacts)
├── package.json                         # Root workspace package manifest
└── package-lock.json                    # Root package lockfile
```

---

## 3. Retained Modules & Services

### 3.1 Backend & Database
- **Express Server & Routing:** All 12 API route trees mounted at `/api` remain 100% active.
- **Data Models:** All Mongoose schemas (`User`, `Appointment`, `Prescription`, `Note`, `Document`, `Feedback`, `AIChatConversation`, `AIRecommendation`, `AIPrediction`, `AIAuditLog`).
- **Access Control:** Role-Based Access Control (RBAC) supporting `admin`, `doctor`, `therapist`, `receptionist`, and `patient`.
- **Intelligent Services:**
  - Outcome Analytics Engine (`outcomeAnalyticsService.js`)
  - Smart Scheduling Engine (`smartSchedulingService.js`)
  - AyurSutra Assistant & Knowledge Provider (`AyurSutraKnowledgeProvider.js` with 14 emergency patterns and prohibited medical request detection)
  - Treatment Recommendation & Disease Prediction Services

### 3.2 Mobile Application
- **Universal Cross-Platform Client:** React Native 0.86 with Expo SDK 57.
- **Hardware-Backed Security:** Secure token storage via `expo-secure-store`.
- **All 5 Role Dashboards:** Maintained within Expo Router directory structure.
- **Zero Secrets in Client:** All external LLM keys proxy through the secure Express backend.

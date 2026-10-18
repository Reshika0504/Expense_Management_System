# Expense Management System

A comprehensive personal expense management application built with the MERN stack (MongoDB, Express.js, React, Node.js) that helps users track, categorize, and analyze their expenses with a clean, responsive interface.

## Current engineering roadmap

Follow [the engineering workflow](docs/ENGINEERING_WORKFLOW.md) for dedicated branches, reports, independent Claude review and human merge approval. The [current API contract](docs/API_CONTRACT.md) supersedes old endpoint examples below.

The [backend-first October–November roadmap](docs/SpendWise_Backend_First_Roadmap.md) is the active plan. Phase 0 audit: [architecture and baseline](docs/architecture/current-state.md), [current API contracts](docs/api/current-endpoints.md), [prioritized risks](docs/security/risk-register.md). Work proceeds one phase per prompt; AI is deferred until the finance backend is reliable. The older portfolio sprint below is retained as historical planning, not the current implementation schedule.

## Live Demo
You can see the complete live demo of my application here:
- https://expense-management-system-frontend-3o3i.onrender.com

## 🚀 Features

### Authentication & Security
- **JWT Authentication**: Secure user login and registration
- **Password Hashing**: Bcrypt encryption for user passwords
- **Protected Routes**: Role-based access control
- **Session Management**: Persistent user sessions

### Expense Management
- **Add Expenses**: Create new expense entries with categories
- **View Expenses**: Browse all transactions with filtering options
- **Edit/Delete**: Update or remove existing expenses
- **Categories**: Predefined and custom expense categories
- **Payment Methods**: Track different payment types

### Analytics & Reporting
- **Dashboard Overview**: Summary of income vs expenses
- **Monthly Reports**: Detailed monthly spending analysis
- **Category Reports**: Spending breakdown by category
- **Top Categories**: Most expensive spending categories
- **Trend Analysis**: Visual spending patterns

### User Features
- **Profile Management**: Update personal information
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Instant data synchronization
- **Data Visualization**: Charts and graphs for better insights

## 🛠️ Tech Stack

### Frontend
- **React.js** - Component-based UI library
- **Redux Toolkit** - State management
- **Ant Design** - UI components and styling
- **React Router** - Navigation and routing
- **Axios** - HTTP client for API requests

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt.js** - Password hashing
- **Joi** - Input validation

### Development Tools
- **Nodemon** - Auto-restart development server
- **Concurrently** - Run multiple commands simultaneously
- **Morgan** - HTTP request logging
- **Colors** - Console color formatting

## 📁 Project Structure

```
expense-management-system/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── Components/     # Reusable UI components
│       ├── Pages/          # Page components
│       ├── redux/          # Redux store and slices
│       └── App.js          # Main application component
├── config/                 # Configuration files
│   └── connectDb.js        # Database connection
├── controllers/            # Request handlers
│   ├── userController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   └── dashboardController.js
├── middlewares/            # Custom middleware
│   └── authMiddleware.js
├── models/                 # Database models
│   ├── userModel.js
│   ├── transactionModel.js
│   └── categoryModel.js
├── routes/                 # API routes
│   ├── userRoute.js
│   ├── transactionRoute.js
│   ├── categoryRoute.js
│   └── dashboardRoute.js
├── .env                    # Environment variables
├── server.js               # Main server file
└── package.json            # Project dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 24 (24.12 or newer)
- MongoDB (local or Atlas)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Reshika0504/Expense_Management_System.git
cd Expense_Management_System
```

2. **Install backend dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd client
npm install
cd ..
```

4. **Environment Setup**
Create a `.env` file in the root directory:
```env
PORT=8080
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

5. **Run the application**
```bash
# Development mode (both frontend and backend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start backend server with nodemon
- `npm run client` - Start React development server
- `npm start` - Start backend server (production)

## 📱 Usage

### User Registration
1. Navigate to the registration page
2. Fill in required details (name, email, password)
3. Submit the form to create an account

### Adding Expenses
1. Login to your account
2. Navigate to the "Add Transaction" page
3. Enter expense details:
   - Amount
   - Category (select from predefined list)
   - Date
   - Description
   - Payment method
4. Submit to save the expense

### Viewing Reports
1. Access the dashboard for overview
2. Navigate to "Reports" for detailed analytics
3. Use filters to view specific time periods
4. View charts and category breakdowns

## 🔐 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile

### Transactions
- `GET /api/v1/transactions` - Get all transactions
- `POST /api/v1/transactions` - Create new transaction
- `PUT /api/v1/transactions/:id` - Update transaction
- `DELETE /api/v1/transactions/:id` - Delete transaction

### Categories
- `GET /api/v1/categories` - Get all categories
- `POST /api/v1/categories` - Create custom category

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/monthly-report` - Get monthly reports
- `GET /api/v1/dashboard/category-report` - Get category reports

## 🎨 UI Components

### Authentication Pages
- **Login Page**: Secure user authentication
- **Register Page**: New user registration
- **Protected Routes**: Authenticated access only

### Main Pages
- **Dashboard**: Overview of financial status
- **Transactions**: List and manage expenses
- **Reports**: Detailed analytics and charts
- **Profile**: User account management

### Reusable Components
- **Header**: Navigation and user menu
- **Footer**: Additional information
- **Spinner**: Loading indicators
- **ProtectedRoute**: Route protection HOC

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String,
  password: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  }
}
```

### Transaction Model
```javascript
{
  user: ObjectId,
  amount: Number,
  type: String, // income or expense
  category: String,
  date: Date,
  description: String,
  paymentMethod: String
}
```

### Category Model
```javascript
{
  name: String,
  type: String, // income or expense
  isSystem: Boolean,
  user: ObjectId
}
```


## 🙏 Acknowledgments

- Built with the MERN stack
- UI components powered by Ant Design
- State management with Redux Toolkit
- Authentication secured with JWT
- Database powered by MongoDB



---
**Built with ❤️ using the MERN Stack**

## Authentication setup (October 2026)

The app supports **email/password** and **Continue with Google**. Phone/SMS login is deliberately excluded to keep this personal project free of SMS charges.

- Copy `.env.example` to `.env` and `client/.env.example` to `client/.env` for local development. Set a MongoDB URL and a strong JWT secret. Node 24.12 or newer within the Node 24 release line is required. Use npm 11.19.0, matching CI.
- For Google sign-in, enable Google in Firebase Authentication, then copy the web app's public configuration into the four frontend `REACT_APP_FIREBASE_*` variables. Set the matching `FIREBASE_PROJECT_ID` on the backend. No Firebase private service-account key is required for verifying ID tokens.
- Add the frontend hostname under Firebase Authentication → Settings → Authorized domains. Enable popups in your browser. The existing project is `spendwise-2d716`.
- The frontend signs in with Firebase and exchanges the verified Google ID token at `POST /api/v1/users/firebase` for the same application JWT used by email login. Only verified Google identities are accepted. Existing Gmail accounts retain their user ID, password and transactions when linked. Other existing email accounts must continue using their password until an explicit account-linking flow is added.
- Email addresses are trimmed and lowercased before lookup. Email aliases and long domain suffixes are accepted. Password hashes are excluded from normal queries and responses.
- On the Phase 0.1 remediation branch, protected APIs check local account status and session version; acknowledged logout revokes existing app sessions and password changes require re-login. The persistent Bearer token remains under security review; see [session review](docs/security/session-review-phase-0.1.md).
- Temporary network/503 profile failures preserve the session. Invalid, forbidden or deleted-account responses clear it.
- Auth endpoints allow 30 attempts per 15 minutes per API instance. A shared limiter store is needed if the backend later scales to multiple instances.

### Existing Render services

| Service | Branch | Root | Build | Start / publish | Auto-deploy |
| --- | --- | --- | --- | --- | --- |
| Frontend static site | `main` | `client` | `npm install && npm run build` | `build` | On Commit |
| Backend web service | `main` | Repository root | `npm install` | `npm start` | On Commit |

Frontend: https://expense-management-system-frontend-3o3i.onrender.com

Backend: https://expense-management-system-backend-546t.onrender.com

The frontend's `REACT_APP_API_URL` must be `https://expense-management-system-backend-546t.onrender.com/api/v1`. The static site needs a rewrite rule `/*` → `/index.html` (action: **Rewrite**) for direct `/login` and `/dashboard` requests. This rule was added in Render. Frontend environment variables are embedded at build time, so configuration changes need a new build. Both existing services were verified as **On Commit**, so a push to `main` triggers deployment. Frontend-only root filters mean backend-only changes do not rebuild the static site.

`.github/workflows/ci.yml` runs backend integration tests against an isolated temporary MongoDB, frontend tests and a production build. Backend auth tests simulate the provider verifier; real Google login must also be checked in the deployed browser. Render currently deploys on commit independently of CI; consider **After CI Checks Pass** once the workflow is established.

### Validation

```sh
npm ci
npm ci --prefix client
npm test
CI=true npm test --prefix client -- --watchAll=false --runInBand
CI=true npm run build --prefix client
```

Tests never connect to the production database. The integration suite downloads a temporary MongoDB binary on first run.

## Earlier portfolio sprint (superseded): 19 October–13 December 2026

Build one polished, defensible project in **8 weeks**, allowing about **10–12 focused hours per week**. Use 14–31 December for the portfolio, resume, demo and a smaller complementary project; the next year of switch preparation should not be spent on this project alone. DSA and interview practice continue separately throughout.

### Scope and completion criteria

The finished Spendwise release includes email/password and Google authentication, reliable transaction CRUD, monthly budgets and reports, CSV import/export, one evaluated ML feature, a responsive interface, tests and reproducible deployment. A feature is complete when it has usable error/empty/loading states, a tested happy path and a short demo. Keep the scope fixed after week 6.

| Week | Dates | Deliverable | Acceptance check |
| --- | --- | --- | --- |
| 1 | 19–25 Oct | Reliability and pink-purple UI | App entry links, sign-in, refresh and logout work; the API hostname redirects browser routes; slow startup has a visible message/retry; mobile navigation and contrast are checked. |
| 2 | 26 Oct–1 Nov | Trustworthy finance core | Define money precision and migrate safely with a backup; validate amounts, date ranges and pagination; tests demonstrate one user cannot read/edit another user's transactions. Statement totals reconcile. |
| 3 | 2–8 Nov | CSV import/export | Preview before importing, validate rows, reject duplicates, show row errors, and export the filtered dataset. Re-importing the same file does not double expenses. |
| 4 | 9–15 Nov | Useful budgets and reporting | Complete category budgets and explicit recurring transaction tracking; test monthly boundaries and zero-data states. Monthly totals match the transaction list. |
| 5 | 16–22 Nov | One real, no-paid-API ML feature | Train a small expense-category text classifier locally (for example TF-IDF + logistic regression). Export vocabulary and weights so the Node backend can run inference without Python or a hosted LLM. Build a labelled synthetic/consented dataset and a separate evaluation split. |
| 6 | 23–29 Nov | Integrate and evaluate suggestions | Show category suggestions with confidence, let users correct them, and fall back to manual categorisation when uncertain. Report accuracy/coverage on held-out examples against a keyword baseline. Financial totals remain computed by normal code. |
| 7 | 30 Nov–6 Dec | Quality and performance | Review dependency audit findings, keyboard/mobile flows, API errors and auth recovery; run ownership/integration tests and representative load tests. Record dataset size, environment and p95 latency without inventing benchmarks. |
| 8 | 7–13 Dec | Portfolio release | Clean README, architecture diagram, documented API, synthetic demo data, short demo video, green CI, live deployment and a rollback exercise. Explain at least three technical decisions and their tradeoffs. |

**Four-week fallback:** finish weeks 1–2, one evaluated category-suggestion feature and the portfolio release. Defer CSV import and recurring automation rather than rushing every feature. Freeze new features by 15 November for this shorter version.

### Keep the project free and focused

- Keep the existing free Render services and Firebase Google authentication. No SMS auth, paid LLM API, new paid database, or paid hosting upgrade is part of this plan.
- ML training is local, inference uses the exported small model in the existing Node service. Start with synthetic records; never publish personal statements or transactions in the training dataset, repo, screenshots or demo.
- A hosted language-model chatbot, receipt OCR, bank connections, microservices, Kubernetes, Redis and distributed job queues are outside this release. Add them later only for a specific measured need.
- The ML deliverable is a real classifier with published evaluation results. Do not present canned demo responses as a live AI integration.

### December portfolio checklist

By 13 December: deployed Spendwise, a synthetic demo account/dataset, architecture and API docs, screenshots, a two-minute walkthrough and test/performance results. By 31 December: add it to the personal portfolio, prepare two or three evidence-based resume bullets and rehearse a five-minute walkthrough covering authentication, data isolation, precision, deployment and ML evaluation. Reserve the rest of the switch-preparation year for DSA, system design, applications and other projects.

### Reliability notes

The canonical website link is **https://expense-management-system-frontend-3o3i.onrender.com/**. The backend hostname is an API endpoint, not the website. Browser entry paths on it now redirect to the frontend when no compiled frontend is served by the backend; unknown API routes still return JSON 404 responses.

The frontend uses a shared API client with a 75-second request timeout. Slow sign-ins show an explanation after 8 seconds. Failed session restoration offers a retry while preserving the token; expired sessions still return to sign-in. Render's free backend can sleep after 15 minutes of inactivity and take about a minute to wake up: https://render.com/docs/free#spinning-down-on-idle . These UI improvements do not remove that hosting limitation or create an uptime guarantee. No paid service or artificial keep-awake job is added.

Immediate audit findings for the sprint: user-scoped transactions, reports and compound indexes already exist; money uses ordinary JavaScript/MongoDB numbers; recurring detection inspects only the latest 100 transactions; and the dependency tree needs a separate upgrade review. The former decorative usage counters were removed from authentication pages; landing-page financial examples are explicitly labelled sample data.

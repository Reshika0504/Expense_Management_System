# Expense Management System

A comprehensive personal expense management application built with the MERN stack (MongoDB, Express.js, React, Node.js) that helps users track, categorize, and analyze their expenses with a clean, responsive interface.

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
- Node.js (version 22 or higher)
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

- Copy `.env.example` to `.env` and `client/.env.example` to `client/.env` for local development. Set a MongoDB URL and a strong JWT secret. Node 22 or newer is required.
- For Google sign-in, enable Google in Firebase Authentication, then copy the web app's public configuration into the four frontend `REACT_APP_FIREBASE_*` variables. Set the matching `FIREBASE_PROJECT_ID` on the backend. No Firebase private service-account key is required for verifying ID tokens.
- Add the frontend hostname under Firebase Authentication → Settings → Authorized domains. Enable popups in your browser. The existing project is `spendwise-2d716`.
- The frontend signs in with Firebase and exchanges the verified Google ID token at `POST /api/v1/users/firebase` for the same application JWT used by email login. Only verified Google identities are accepted. Existing Gmail accounts retain their user ID, password and transactions when linked. Other existing email accounts must continue using their password until an explicit account-linking flow is added.
- Email addresses are trimmed and lowercased before lookup. Email aliases and long domain suffixes are accepted. Password hashes are excluded from normal queries and responses.
- Temporary network/503 profile failures preserve the session. Invalid, forbidden or deleted-account responses clear it.
- Auth endpoints allow 30 attempts per 15 minutes per API instance. A shared limiter store is needed if the backend later scales to multiple instances.

### Existing Render services

| Service | Branch | Root | Build | Start / publish | Auto-deploy |
| --- | --- | --- | --- | --- | --- |
| Frontend static site | `main` | `client` | `npm install && npm run build` | `build` | On Commit |
| Backend web service | `main` | Repository root | `npm install` | `npm start` | On Commit |

Frontend: https://expense-management-system-frontend-3o3i.onrender.com

Backend: https://expense-management-system-backend-546t.onrender.com

The frontend's `REACT_APP_API_URL` must be `https://expense-management-system-backend-546t.onrender.com/api/v1`. Frontend environment variables are embedded at build time, so configuration changes need a new build. Both existing services were verified as **On Commit**, so a push to `main` triggers deployment. Frontend-only root filters mean backend-only changes do not rebuild the static site.

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

## Suggested development phases

These are planning estimates for roughly 6–8 hours per week, not a promise of a particular hiring result.

1. **Weeks 1–2: Reliable foundation.** Finish real-browser login verification, exercise registration/session expiry/logout, keep CI green and document deployment/rollback. Done when both login methods work after refresh and both services deploy from the same `main` commit.
2. **Months 1–3: Correct finance core.** Model money in integer minor units (paise/cents), validate pagination/filter inputs, add transaction ownership tests, reliable date/time-zone handling, budgets, recurring transactions, and CSV import/export with preview and duplicate detection. Done when statement totals reconcile and cross-user access tests pass.
3. **Months 4–5: Engineering quality.** Consolidate API access/error handling, add meaningful loading/empty/retry states and accessibility checks, review dependencies, migrate the deprecated Create React App toolchain, and add request IDs, structured logs, database-aware readiness and backup/restore drills. Document architecture decisions and failure cases.
4. **Months 6–8: AI with measurable value.** Begin with category suggestions and receipt extraction requiring user review. Add natural-language spending questions backed by server-computed totals. Use only the current user's records, treat imported text as untrusted, measure accuracy on a labelled sample, and track latency/cost. Keep AI disabled or use mocked/demo responses until a no-cost provider/local-model choice is agreed. Do not promise a free hosted LLM API.
5. **Months 9–10: Performance and system design.** Profile actual slow queries, use query plans and targeted indexes, move heavy imports/reports into idempotent background jobs if measurements justify it, and load-test representative datasets. Record p95 latency and failure behavior; avoid adding infrastructure without a demonstrated need.
6. **Months 11–12: Interview-ready evidence.** Publish an architecture diagram, API documentation, tested tradeoffs, performance measurements and a short demo using synthetic data. Prepare explanations of auth, data isolation, money precision, concurrency, AI evaluation and deployment recovery. Build resume bullets from measured results and continue DSA/system-design practice alongside the project.

Immediate audit findings: the core already includes user-scoped transactions, category/budget reports and compound indexes. Money is currently stored as JavaScript/MongoDB numbers; recurring detection inspects only the latest 100 transactions; API URLs are duplicated across slices/pages; the old dependency tree has audit findings that need a separate upgrade review. Cosmetic dashboard counters are illustrative rather than real product usage statistics and should be labelled or replaced before portfolio publication.

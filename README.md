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
- Node.js (version 14 or higher)
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

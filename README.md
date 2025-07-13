# Outbound AI MVP - Authentication System

A complete full-stack authentication system built with Node.js/Express backend and React/TypeScript frontend.

## 🚀 Features

### Authentication & Security
- ✅ User registration with email verification
- ✅ Secure login with JWT tokens
- ✅ Password hashing with bcrypt
- ✅ Input validation and sanitization
- ✅ Rate limiting to prevent abuse
- ✅ CORS protection
- ✅ Helmet security middleware
- ✅ XSS protection
- ✅ Role-based access control

### Frontend Features
- ✅ Modern React with TypeScript
- ✅ Responsive design with Tailwind CSS
- ✅ Form validation with React Hook Form & Yup
- ✅ Protected routes
- ✅ Toast notifications
- ✅ Loading states and error handling
- ✅ Professional UI components

### Backend Features
- ✅ RESTful API with Express.js
- ✅ MongoDB with Mongoose ODM
- ✅ JWT authentication middleware
- ✅ Comprehensive error handling
- ✅ Request logging with Morgan
- ✅ Environment-based configuration

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger
- **Express Validator** - Input validation
- **Express Rate Limit** - Rate limiting

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **React Hook Form** - Form handling
- **Yup** - Schema validation
- **Axios** - HTTP client
- **React Toastify** - Notifications
- **Heroicons** - Icons

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd outbound-ai-mvp

# Install all dependencies
npm run install-all
```

### 2. Environment Setup

#### Backend Configuration
Create `backend/.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/outbound-ai-mvp
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:3000
```

#### Frontend Configuration
Create `frontend/.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Database Setup

Make sure MongoDB is running on your system:
```bash
# For macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# For Linux
sudo systemctl start mongod

# For Windows
net start MongoDB
```

### 4. Start the Application

```bash
# Start both backend and frontend concurrently
npm run dev

# Or start them separately:
# Backend (runs on port 5000)
npm run server

# Frontend (runs on port 3000)
npm run client
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Login User
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <jwt-token>
```

### User Management Endpoints

#### Get Dashboard Data
```http
GET /api/user/dashboard
Authorization: Bearer <jwt-token>
```

#### Change Password
```http
PUT /api/user/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "NewSecurePass123",
  "confirmPassword": "NewSecurePass123"
}
```

#### Deactivate Account
```http
DELETE /api/user/account
Authorization: Bearer <jwt-token>
```

### Admin Endpoints

#### Get All Users (Admin Only)
```http
GET /api/user/all?page=1&limit=10
Authorization: Bearer <admin-jwt-token>
```

#### Update User Role (Admin Only)
```http
PUT /api/user/:userId/role
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json

{
  "role": "admin"
}
```

## 🔐 Security Features

### Password Requirements
- Minimum 6 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number

### Rate Limiting
- General API: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes

### Security Headers
- Helmet.js for security headers
- CORS configuration
- XSS protection
- Input sanitization

## 🎨 Frontend Routes

- `/` - Redirects to dashboard
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Protected dashboard (requires authentication)

## 📁 Project Structure

```
outbound-ai-mvp/
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── user.js
│   ├── utils/
│   │   └── validation.js
│   ├── package.json
│   ├── server.js
│   └── env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── auth.ts
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── env.example
├── package.json
└── README.md
```

## 🧪 Testing

### Manual Testing Checklist

1. **Registration Flow**
   - [ ] Register with valid credentials
   - [ ] Try registering with existing email
   - [ ] Test password validation
   - [ ] Verify form validation

2. **Login Flow**
   - [ ] Login with valid credentials
   - [ ] Try login with wrong password
   - [ ] Try login with non-existent email
   - [ ] Verify token persistence

3. **Protected Routes**
   - [ ] Access dashboard when logged in
   - [ ] Try accessing dashboard when logged out
   - [ ] Verify redirect to login

4. **User Management**
   - [ ] View user profile
   - [ ] Update profile information
   - [ ] Change password
   - [ ] Logout functionality

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or your preferred database
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, AWS, etc.)

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to your preferred platform (Netlify, Vercel, etc.)
3. Update API URL in environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## 🔧 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **JWT Token Issues**
   - Check JWT_SECRET in backend `.env`
   - Verify token expiration settings
   - Clear browser localStorage if needed

3. **CORS Issues**
   - Verify FRONTEND_URL in backend `.env`
   - Check CORS configuration in server.js

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

## 📊 Performance Considerations

- JWT tokens are stored in localStorage
- API calls are cached where appropriate
- Rate limiting prevents abuse
- Passwords are hashed with bcrypt (cost factor 12)
- Database queries are optimized with indexes

## 🔮 Future Enhancements

- [ ] Email verification for registration
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Social login integration
- [ ] User profile images
- [ ] Audit logging
- [ ] Advanced user roles and permissions
- [ ] API rate limiting per user
- [ ] Real-time notifications 
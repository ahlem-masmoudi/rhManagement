# RH Management Backend API

Backend API for the RH Management Platform built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher) running locally or MongoDB Atlas account

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and update with your configuration
   - Update `MONGODB_URI` if using MongoDB Atlas or different local setup
   - Change `JWT_SECRET` to a secure random string

4. Start MongoDB (if using local installation):
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

5. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## 📋 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/logout` - Logout user (protected)

### Candidates
- `GET /api/candidates/profile` - Get candidate profile (candidate only)
- `PUT /api/candidates/profile` - Update candidate profile (candidate only)
- `GET /api/candidates` - Get all candidates (recruiter only)
- `GET /api/candidates/:id` - Get single candidate (recruiter only)

### Offers
- `GET /api/offers` - Get all offers (public)
- `GET /api/offers/:id` - Get single offer (public)
- `POST /api/offers` - Create new offer (recruiter only)
- `PUT /api/offers/:id` - Update offer (recruiter only)
- `DELETE /api/offers/:id` - Delete offer (recruiter only)
- `POST /api/offers/:id/apply` - Apply to offer (candidate only)

## 🔐 Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Models

### User
- email (unique)
- password (hashed with bcrypt)
- firstName
- lastName
- role (recruiter | candidate)
- profileComplete
- createdAt, updatedAt

### Candidate
- userId (ref to User)
- phone, location
- school, educationLevel, expectedDegree
- expectedGraduation, availability
- skills (array)
- linkedin, github, portfolio
- cv (file info)
- applications (array of applications)

### Offer
- title, company, location
- type (stage | alternance | emploi)
- duration, description
- requirements, skills (arrays)
- salary, status
- createdBy (ref to User)
- deadline

## 🧪 Testing the API

Health check:
```bash
curl http://localhost:3000/api/health
```

Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "candidate"
  }'
```

Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 📦 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── candidateController.js
│   └── offerController.js
├── middleware/
│   └── auth.js            # JWT verification & authorization
├── models/
│   ├── User.js
│   ├── Candidate.js
│   └── Offer.js
├── routes/
│   ├── auth.js
│   ├── candidates.js
│   └── offers.js
├── utils/
│   └── jwt.js             # JWT utilities
├── .env                   # Environment variables
├── .gitignore
├── package.json
└── server.js              # Express app entry point
```

## 🛠️ Development

Run with auto-reload:
```bash
npm run dev
```

Run in production mode:
```bash
npm start
```

## 🔧 Environment Variables

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rh-management
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:4200
```

## 📝 Notes

- Passwords are automatically hashed using bcrypt before saving
- JWT tokens expire after 7 days (configurable)
- CORS is enabled for the frontend URL specified in .env
- All API responses follow the format: `{ success: boolean, data: any, message?: string }`

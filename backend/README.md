# Auréa Déco Backend API

Backend API for Auréa Déco Order Management System built with Node.js, Express, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Install dependencies**
```bash
npm install
```

2. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Create database**
```bash
# Login to PostgreSQL
psql -U postgres

# Run the database script
\i database.sql

# Or directly from command line
psql -U postgres -f database.sql
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be running at `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Endpoints

#### **Authentication**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get current user profile (Protected)

#### **Orders**
- `GET /api/orders` - Get all orders (Protected)
- `POST /api/orders` - Create new order (Admin only)
- `GET /api/orders/:id` - Get order by ID (Protected)
- `PUT /api/orders/:id` - Update order (Admin only)
- `DELETE /api/orders/:id` - Delete order (Admin only)

#### **Products**
- `PATCH /api/orders/products/:productId/status` - Update product status (Protected)
- `POST /api/orders/products/:productId/images` - Upload images (Protected)
- `DELETE /api/orders/images/:imageId` - Delete image (Protected)

#### **Users**
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/designers` - Get all designers (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id` - Update user (Admin only)
- `DELETE /api/users/:id` - Delete user (Admin only)

### Example Requests

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aurea.dz",
    "password": "admin123"
  }'
```

#### Create Order
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "clientName": "John Doe",
    "phone": "0555123456",
    "address": "Sétif, Algeria",
    "assignedDesigner": 2,
    "products": [
      {
        "type": "Cadre",
        "quantity": 2,
        "unitPrice": 1500
      }
    ]
  }'
```

## 🗄️ Database Schema

### Users
- `id` - Serial Primary Key
- `name` - VARCHAR(255)
- `email` - VARCHAR(255) UNIQUE
- `password` - VARCHAR(255) (hashed)
- `role` - VARCHAR(50) (admin/designer)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### Orders
- `id` - Serial Primary Key
- `client_name` - VARCHAR(255)
- `phone` - VARCHAR(50)
- `address` - TEXT
- `assigned_designer` - INTEGER (FK to users)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### Products
- `id` - Serial Primary Key
- `order_id` - INTEGER (FK to orders)
- `type` - VARCHAR(100)
- `quantity` - INTEGER
- `unit_price` - DECIMAL(10,2)
- `status` - VARCHAR(50)
- `created_at` - TIMESTAMP
- `updated_at` - TIMESTAMP

### Images
- `id` - Serial Primary Key
- `product_id` - INTEGER (FK to products)
- `filename` - VARCHAR(255)
- `type` - VARCHAR(50) (client/designer)
- `uploaded_by` - INTEGER (FK to users)
- `created_at` - TIMESTAMP

## 🔐 Security

- Passwords are hashed using bcrypt
- JWT tokens for authentication
- Role-based access control (RBAC)
- Input validation
- File upload restrictions

## 🛠️ Development

### Project Structure
```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── orderController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── Image.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   └── users.js
│   └── server.js
├── uploads/
├── .env
├── .env.example
├── database.sql
└── package.json
```

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 📝 License
MIT
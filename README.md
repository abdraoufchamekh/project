# 🎨 Auréa Déco Order Manager

A complete fullstack order management system for Auréa Déco with role-based access control, built with React, Node.js, Express, and PostgreSQL.

## ✨ Features

- ✅ **User Authentication** - JWT-based auth with Admin & Designer roles
- 📦 **Order Management** - Create, read, update, delete orders
- 🎨 **Product Status Tracking** - 6-stage workflow (En attente → Livré)
- 📸 **Multiple Image Uploads** - Client images & designer previews
- 👥 **Designer Management** - Assign orders to designers
- ⚙️ **Settings Panel** - Company info & Yalidine API integration
- 🚚 **Delivery Integration** - Yalidine API placeholder

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TailwindCSS** - Styling
- **Lucide Icons** - Icon library
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Multer** - File uploads
- **Bcrypt** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/aurea-deco-manager.git
cd aurea-deco-manager
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Create database
psql -U postgres -f database.sql

# Start backend server
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install

# Start frontend
npm start
```

Frontend will run on `http://localhost:3000`

## 🔐 Default Login Credentials

### Admin Account
- **Email:** admin@aurea.dz
- **Password:** admin123

### Designer Account
- **Email:** designer@aurea.dz
- **Password:** designer123

## 📱 Usage

1. **Login** with admin or designer credentials
2. **Create Orders** with multiple products (Admin only)
3. **Assign Designers** to orders
4. **Track Status** through 6 stages:
   - En attente
   - Design en cours
   - En impression
   - Expédié
   - Livré
   - Retourné
5. **Upload Images** - Client images and design previews
6. **Manage Team** - Add/remove designers (Admin only)
7. **Configure Settings** - Company info & API keys

## 🗂️ Project Structure
```
aurea-deco-manager/
├── frontend/                # React application
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── layout/
│   │   │   ├── orders/
│   │   │   ├── designers/
│   │   │   └── settings/
│   │   ├── context/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
│
└── backend/                 # Express API
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   └── server.js
    ├── uploads/
    ├── database.sql
    └── package.json
```

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Get profile

### Orders
- `GET /api/orders` - Get orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order

### Products
- `PATCH /api/orders/products/:id/status` - Update status
- `POST /api/orders/products/:id/images` - Upload images

### Users
- `GET /api/users` - Get all users
- `GET /api/users/designers` - Get designers
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy build folder
```

### Backend (Heroku/Railway/Render)
```bash
cd backend
# Set environment variables
# Deploy using platform-specific commands
```

### Database (Heroku Postgres/Railway)
- Create PostgreSQL database
- Run `database.sql` script
- Update connection string in `.env`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Auréa Déco Development Team**

## 🐛 Issues & Support

Found a bug? [Open an issue](https://github.com/YOUR_USERNAME/aurea-deco-manager/issues)

---

**Made with ❤️ for Auréa Déco**
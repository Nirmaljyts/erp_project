🎨 ERP Project (React + TypeScript + Vite)

This is the frontend UI for the ERP (Enterprise Resource Planning) System.
It communicates with the ERP API and provides a fast, modern, role-based interface.

Built with:

⚛  React 18 + TypeScript

⚡ Vite

🎛 Redux Toolkit

🌐 React Router v6

🎨 TailwindCSS

📅 FullCalendar

🔐 Axios + JWT Interceptor

🔔 React Hot Toast

----------------------------------------------------------------------------------------------------

📸 Features

✔ JWT Authentication (Login + Role-based Access)
✔ Holiday Calendar (Create / Update / Delete for Admin + HR)
✔ CSV Upload for Holidays
✔ Dashboard & Routing System
✔ Global State using Redux Toolkit
✔ Form validation with inline error messages
✔ Toast notifications
✔ Dark/Light theme with CSS variables
✔ FullCalendar event tooltips + event modals

----------------------------------------------------------------------------------------------------

📁 Project Structure
erp-client/
│── public/
│── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   │   ├── CalendarPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   ├── router/
│   │   ├── AppRouter.tsx
│   │   └── PrivateRoute.tsx
│   ├── services/
│   │   ├── authServices.ts
│   │   ├── holidayServices.ts
│   │   └── interceptor.ts
│   ├── store/
│   │   ├── store.ts
│   │   └── authSlice.ts
│   ├── App.tsx
│   └── main.tsx
│
│── tailwind.config.js
│── tsconfig.json
│── vite.config.ts
│── package.json
│── .env
└── README.md

----------------------------------------------------------------------------------------------------

🛠 Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/Nirmaljyts/erp_project.git
cd UI

2️⃣ Install dependencies
npm install

3️⃣ Create .env file
VITE_API_URL="http://localhost:5000/api"

4️⃣ Run development server
npm run dev

Local URL: http://localhost:5173

5️⃣ Build for production
npm run build
npm run preview

----------------------------------------------------------------------------------------------------

🔐 Authentication Flow (JWT)

User logs in using /auth/login

Access + Refresh tokens stored in httpOnly cookies

Axios interceptor refreshes token automatically

Redux Toolkit stores user info

Protected routes check user role

👮 Role-Based in UI

ADMIN | HR | MANAGER | EMPLOYEE

----------------------------------------------------------------------------------------------------

🎨 Theme System

Uses CSS variables defined for both themes:

Both dark and light theme supported

--background
--text
--card
--border

Automatically applied to:

Modals | Calendar | Forms | Layout

----------------------------------------------------------------------------------------------------

🔔 Notifications (react-toast)

Used for:

Login success / failure

Holiday created / updated / deleted

CSV upload results

Validation errors


API CORS blocked

Backend must allow:

origin: "http://localhost:5173"
credentials: true

----------------------------------------------------------------------------------------------------

📄 License

This is private internal ERP software.
Not open for redistribution.


------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


🚀 ERP API (Node.js + Express + Prisma + MySQL)
--------------------------------------------------------------------------

Backend service for the ERP Management System, providing:

Authentication & Authorization (JWT)

Role-Based Access (ADMIN, HR, MANAGER, EMPLOYEE)

Holidays Module (CRUD + Bulk CSV Upload)

Employees, Users, Projects, Tasks Modules

Email Notifications

File Upload using Multer

Prisma ORM with MySQL

--------------------------------------------------------------------------

This API is fully modular, scalable, and production-ready.

⚙️ Tech Stack
Feature	Technology
Runtime	Node.js (ES Modules)
Framework	Express.js
ORM	Prisma ORM
Database	MySQL
File Upload	Multer
Parsing	CSV-Parse, ExcelJS
Auth	JWT + Cookies
Emails	Nodemailer
Config	dotenv
Dev Tools	Nodemon, Prisma CLI

--------------------------------------------------------------------------

📁 Project Structure
erp-api/
│── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
│
│── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── holidayController.js
│   │   ├── projectController.js
│   │   └── employeeController.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   └── upload.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── holidayRoutes.js
│   │   ├── projectRoutes.js
│   │   └── employeeRoutes.js
│   │
│   ├── services/
│   │   ├── holidayService.js
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── projectService.js
│   │   └── employeeService.js
│   │
│   ├── utils/
│   │   ├── prisma.js
│   │   ├── email.js
│   │   └── jwt.js
│   │
│   └── index.js
│
│── uploads/     ← Temporary CSV uploads (auto-deleted)
│── .env
│── package.json
└── README.md

--------------------------------------------------------------------------

🛠 Installation & Setup

1️⃣ Clone Repository
git clone https://github.com/Nirmaljyts/erp_project.git
cd API

2️⃣ Install dependencies
npm install

3️⃣ Create .env file
PORT=5000
DATABASE_URL="mysql://root:password@localhost:3306/erp"
JWT_SECRET="your_jwt_secret_key"
JWT_EXPIRES_IN="7d"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-email-password"
EMAIL_FROM="ERP System <your-email@gmail.com>"
FRONTEND_URL="http://localhost:5173"

4️⃣ Prepare Database

Create MySQL database:
CREATE DATABASE erp;
Run Prisma migration:

npm run prisma:migrate

Generate Prisma client:

npm run prisma:generate

(Optional) Seed database: npm run seed

5️⃣ Run API
Development:
npm run dev

Production:
npm start

The API runs at:

http://localhost:5000

🔐 Authentication & Roles
JWT-based authentication

Tokens are stored in cookies + Authorization header.

--------------------------------------------------------------------------

Supported Roles:

ADMIN | HR | MANAGER | EMPLOYEE

--------------------------------------------------------------------------

✔ Employees Module

Your models include:

User | Employee | Project | Task | Holiday | RefreshToken

--------------------------------------------------------------------------

📤 File upload (Multer)

Uploads only to uploads/ (auto deleted after parsing)

Only CSV allowed

Allowed CSV Format:
date,name,isCommon,country
01/01/2025,New Year,true,UK

Filename must include year:
holidays2025.csv
holidays-2024.csv

--------------------------------------------------------------------------

✉️ Email Support (Nodemailer)

Used for:

Forgot password OTP

Config from .env is required.


🎯 Production Deployment Notes

Enable HTTPS

Use environment variables

Configure CORS for UI domain

# PawPoint

PawPoint is a full-stack veterinary clinic appointment management system for a
single clinic. Pet owners can create accounts, browse doctors, book visits for
their pets, manage appointments, and update their profiles. Administrators can
manage doctors, upload doctor images, and update appointment statuses.

## Technology

- Mobile: React Native, Expo, Expo Router, TypeScript
- API: Node.js, Express, TypeScript
- Database: MongoDB with Mongoose
- Authentication: bcryptjs and JSON Web Tokens
- HTTP client: Axios
- Image uploads: Multer and Cloudinary
- Secure token storage: Expo SecureStore

## Project Structure

```text
backend/
  src/
    config/          Environment, database, and Cloudinary configuration
    controllers/     Authentication, doctor, and appointment logic
    middleware/      JWT, admin, upload, and error middleware
    models/          User, Doctor, and Appointment models
    routes/          REST API routes
    server.ts        Express application entry point

frontend/
  src/
    app/             Expo Router screens and route groups
    components/      Reusable form, card, calendar, and status components
    context/         Authentication state
    hooks/           API-backed data hooks
    lib/             API, date, validation, and token utilities
    types/           TypeScript contracts
```

The editable architecture diagram is available at
[`docs/pawpoint-system-architecture.drawio`](docs/pawpoint-system-architecture.drawio).
The database schema diagram is available at
[`docs/pawpoint-database-schema.drawio`](docs/pawpoint-database-schema.drawio).

## Database Entities

The application intentionally contains only three MongoDB entities:

- `User`: name, email, hashed password, admin flag, timestamps
- `Doctor`: profile, qualifications, schedule, fee, image URL, timestamps
- `Appointment`: user reference, doctor reference, pet details, date, time,
  reason, status, timestamps

Pet information is stored inside an appointment. There is no separate Pet or
Clinic collection.

## Main Features

- User registration, login, logout, session restoration, and password changes
- JWT-protected API routes and admin authorization
- Profile editing and account deletion
- Doctor create, read, update, delete, and Cloudinary image upload
- Doctor availability calendar with 15-minute appointment slots
- Appointment booking, details, rescheduling, cancellation, and deletion
- Admin appointment queue and status transitions
- Backend double-booking protection with HTTP `409 Conflict`
- Frontend and backend validation for names, phone numbers, emails, dates,
  appointment fields, and image uploads
- Loading, error, empty, and confirmation states throughout the mobile app

## Local Setup

Install dependencies:

```powershell
cd backend
npm install

cd ..\\frontend
npm install
```

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/pawpoint
JWT_SECRET=replace-with-at-least-32-random-characters
ADMIN_EMAIL=admin@example.com
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create `frontend/.env` from `frontend/.env.example`:

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
```

On a physical phone, replace `localhost` with the development computer's LAN
IP address or use the deployed API URL.

Start the services in separate terminals:

```powershell
cd backend
npm run dev
```

```powershell
cd frontend
npm start
```

## API Areas

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/profile
PUT    /api/auth/password
DELETE /api/auth/profile

GET    /api/doctors
GET    /api/doctors/:id
GET    /api/doctors/:id/availability
POST   /api/doctors              Admin
PUT    /api/doctors/:id          Admin
PUT    /api/doctors/:id/image    Admin, multipart field: image
DELETE /api/doctors/:id          Admin

POST   /api/appointments
GET    /api/appointments
GET    /api/appointments/:id
PUT    /api/appointments/:id
POST   /api/appointments/:id/cancel
DELETE /api/appointments/:id
GET    /api/appointments/admin   Admin
PATCH  /api/appointments/:id/status Admin
```

## Verification

Run the available checks:

```powershell
cd backend
npm run typecheck
npm run build
npm test

cd ..\\frontend
npm run typecheck
npm run lint
```

Before evaluation, manually test registration, login, logout, profile updates,
password changes, account deletion, doctor CRUD, image uploads, booking,
duplicate-slot rejection, rescheduling, cancellation, ownership protection,
admin status changes, and the deployed API configuration.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for MongoDB Atlas, Cloudinary, production
environment variables, and mobile API configuration guidance. Never commit
`.env` files or secret values.


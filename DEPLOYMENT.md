# PawPoint Deployment Checklist

## Backend

Deploy the `backend` directory to a Node host that supports a persistent volume
for `uploads/`. Set these environment variables:

- `PORT`
- `MONGO_URI` for MongoDB Atlas
- `JWT_SECRET` with at least 32 random characters
- `NODE_ENV=production`
- `ADMIN_EMAIL` only when an explicitly configured development/admin account is needed

The server accepts doctor images as multipart uploads under the `image` field
and stores them in Cloudinary. Set `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. The returned Cloudinary
HTTPS URL is stored in the Doctor document, so the mobile app does not depend
on the backend filesystem.

## Mobile app

Set `frontend/.env` to the deployed API URL including `/api`:

```text
EXPO_PUBLIC_API_URL=https://your-backend.example.com/api
```

Do not use `localhost` on a physical device. Build a development or production
client because SecureStore is native functionality and is not available in Expo
Go.

## Verification matrix

Run `npm run typecheck` in both `backend` and `frontend`, then manually verify:

- register, login, restore session, and logout
- admin-only doctor CRUD and image upload
- booking, duplicate booking returning 409, rescheduling, cancellation, and deletion
- normal users cannot read another user's appointment
- deployed mobile client loads doctors and images from the hosted API

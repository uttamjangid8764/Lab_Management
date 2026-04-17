# 🏫 Lab Management System with Firebase

A complete lab management system with Firebase authentication and Firestore database.

## Features

### Admin Features

- 🔐 Admin Login (Firebase Auth)
- ➕ Create New Admin Accounts
- 🏢 Create Labs
- 💻 Add Computers to Labs (Number, Details, Password)
- 📊 View Reviews (New → Old)
- 📱 Generate QR Codes
- 📥 Download QR (Single + Bulk)

### Student Features

- 📱 Scan QR Code → Redirect to Computer Page
- 👀 View Computer Details, Status, Password
- 📝 Submit Review (Working/Not Working)

## Tech Stack

- Frontend: HTML, TailwindCSS, JavaScript
- Backend: Firebase (Auth + Firestore)
- Deployment: Vercel

## Setup Instructions

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Get your Firebase config from Project Settings

### 2. Vercel Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_FIREBASE_API_KEY=AIzaSyCOuoe7uShX9QB5dK4hfAeB2PQ5p2JI4eg
VITE_FIREBASE_AUTH_DOMAIN=lab-management-1.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=lab-management-1
VITE_FIREBASE_STORAGE_BUCKET=lab-management-1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=326898209928
VITE_FIREBASE_APP_ID=1:326898209928:web:b2276e58f77d271b407b3d
```

**Note:** Firebase config is already hardcoded in the project, so environment variables are optional.

### 3. Create First Admin Account

Use Firebase Console:

1. Go to Authentication → Users
2. Click "Add User"
3. Enter email and password
4. This will be your first admin account

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Firestore Database Structure

```
labs/
  - {labId}
    - name: string
    - createdAt: timestamp

computers/
  - {computerId}
    - labId: string
    - number: number
    - details: string
    - password: string
    - createdAt: timestamp

reviews/
  - {reviewId}
    - computerId: string
    - status: "Working" | "Not Working"
    - comment: string
    - timestamp: timestamp
```

## Usage Flow

1. **Admin Login** → Dashboard
2. **Create Labs** → Open Lab
3. **Add Computers** → Generate QR Codes
4. **Download QR Codes** (Single or Bulk)
5. **Students Scan QR** → View Computer Details
6. **Students Submit Reviews** → Admin sees reviews

## Security Rules (Firestore)

Add these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Labs - Admin only write, public read
    match /labs/{labId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Computers - Admin only write, public read
    match /computers/{computerId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Reviews - Anyone can write, public read
    match /reviews/{reviewId} {
      allow read: if true;
      allow create: if true;
      allow update, delete: if request.auth != null;
    }
  }
}
```

## License

MIT License

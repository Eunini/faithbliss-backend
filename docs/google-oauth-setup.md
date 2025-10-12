# Google OAuth Setup Documentation

## Overview
The FaithBliss backend now supports Google OAuth authentication through two methods:

1. **Standard OAuth Flow** - Redirects users to Google and handles the callback
2. **JSON API** - Direct authentication with Google profile data

## Environment Variables Required

Add these variables to your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

## OAuth Flow Endpoints

### 1. Initiate Google OAuth
**GET** `/auth/google`
- Redirects user to Google OAuth consent screen
- No parameters needed

### 2. OAuth Callback
**GET** `/auth/google/callback`
- Handles Google OAuth callback
- Automatically processes authentication
- Redirects to frontend with access token
- Sets refresh token as httpOnly cookie

**Redirect URLs:**
- New users: `{FRONTEND_URL}/onboarding?token={accessToken}&newUser=true`
- Existing users: `{FRONTEND_URL}/dashboard?token={accessToken}`

### 3. JSON API Authentication
**POST** `/auth/google`
- Direct authentication with Google profile data
- Returns JSON response with tokens

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "picture": "https://example.com/photo.jpg",
  "googleId": "google_user_id"
}
```

**Response:**
```json
{
  "message": "Google authentication successful",
  "accessToken": "jwt_access_token",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "profilePhoto1": "https://example.com/photo.jpg",
    "onboardingCompleted": false
  },
  "isNewUser": true
}
```

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable Google+ API or Google People API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

## Frontend Integration Examples

### Using Window Redirect
```javascript
// Redirect to Google OAuth
window.location.href = 'http://localhost:3001/auth/google';
```

### Using Popup Window
```javascript
// Open OAuth in popup
const popup = window.open(
  'http://localhost:3001/auth/google',
  'google-oauth',
  'width=500,height=600'
);

// Listen for popup close or message
popup.addEventListener('beforeunload', () => {
  // Handle OAuth completion
});
```

### Using Google Sign-In JavaScript Library
```javascript
// After getting user data from Google JS library
const response = await fetch('http://localhost:3001/auth/google', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    googleId: googleUser.id,
  }),
});

const data = await response.json();
// Use data.accessToken for authenticated requests
```

## Security Features

- Refresh tokens are stored as httpOnly cookies
- Access tokens are short-lived (15 minutes)
- Google accounts are automatically marked as verified
- New users are redirected to onboarding flow
- Existing users go directly to dashboard

## Database Changes

The system automatically:
- Creates new users with Google profile data
- Links Google accounts to existing email addresses
- Updates profile photos if not already set
- Marks Google users as verified

## Testing

1. Start the backend: `npm run start:dev`
2. Visit: `http://localhost:3001/auth/google`
3. Complete Google OAuth flow
4. Check redirect to frontend with token

## Troubleshooting

- Ensure Google Cloud Console has correct redirect URIs
- Verify environment variables are set correctly
- Check that Google APIs are enabled in Cloud Console
- Ensure frontend URL is accessible for redirects
# Book Library Backend

## Setup Google OAuth

To enable Google authentication, follow these steps:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create an OAuth 2.0 Client ID
5. Set authorized redirect URIs to: `http://localhost:5001/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file:

```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

7. Restart the server

## Running the Application

```bash
npm install
npm start
```

The server will run on port 5001.
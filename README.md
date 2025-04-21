# AI Daily Tech Blogger 🧠📰

Automatically generates a daily developer-focused tech blog post using OpenAI and uploads it to Firebase Firestore.

## 🔧 Setup

1. Clone this repo
2. Install deps: `npm install`
3. Create a `.env` file with your keys (see `.env.example`)
4. Set up GitHub Secrets:
   - `OPENAI_API_KEY`
   - `FIREBASE_SERVICE_ACCOUNT` (paste JSON service account as a string)

## 🏃‍♂️ Run Locally

```bash
npm run generate

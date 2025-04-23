import { config } from "dotenv";
import OpenAI from "openai";
import admin from "firebase-admin";

config(); // Load .env variables

// Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse service account JSON string from .env
const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf-8");
const serviceAccount = JSON.parse(decoded);

// Init Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Map days of week to specific themes
const dailyThemes = {
  Sunday: "Write a thoughtful post about developer mindset, career growth, or productivity. Include a personal-sounding tone and end with a reflection or takeaway.",
  Monday: "Summarize emerging frontend development trends or predictions. Include analysis and mention any relevant tools or frameworks gaining attention.",
  Tuesday: "Summarize the most important frontend or JavaScript-related news from the past 7 days. Include short commentary on why it matters.",
  Wednesday: "Share essential tips or 'things every frontend developer should know.' This could include browser quirks, performance tips, or new APIs.",
  Thursday: "Spotlight a useful developer tool, library, or framework. Explain what it does, why it’s useful, and how developers can try it out.",
  Friday: "Write an opinionated deep dive or analysis on a hot topic in frontend (like SSR vs CSR, TypeScript pros/cons, or controversial design trends).",
  Saturday: "Highlight a cool side project, experimental GitHub repo, or small dev experiment. Make it fun, casual, and inspiring.",
};

// Build prompt based on current weekday
const getPrompt = () => {
  const today = new Date();
  const weekday = today.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = today.toISOString().split("T")[0];
  const theme = dailyThemes[weekday];

  return `Today is ${weekday}, ${dateStr}. ${theme} Write about 400 words, and keep the tone natural and engaging.`;
}

async function generateAndStorePost() {
  const prompt = getPrompt();

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content.trim();
  const date = new Date().toISOString().split("T")[0];

  await db.collection("posts").doc(date).set({
    date,
    content,
    prompt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`Blog post saved for ${date} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })})`);
}

generateAndStorePost().catch((err) => {
  console.error("Error generating or saving post:", err);
  process.exit(1);
});

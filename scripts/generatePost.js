import { config } from "dotenv";
import OpenAI from "openai";
import admin from "firebase-admin";

config(); // Load .env variables

// Init OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Parse service account JSON string from .env
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// Init Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Different tones/styles for variation
const styles = [
  "Use a humorous tone.",
  "Write it like a daily newsletter.",
  "Make it sound like a conversation with a junior developer.",
  "Focus on developer tools and trends.",
  "Include one fun fact or stat if possible.",
];

// Build prompt with current date and a style
function getPrompt() {
  const date = new Date().toISOString().split("T")[0];
  const style = styles[Math.floor(Math.random() * styles.length)];
  return `Write a 400-word blog post summarizing the most important tech news for developers on ${date}. ${style}`;
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

  console.log(`✅ Blog post saved for ${date}`);
}

generateAndStorePost().catch((err) => {
  console.error("❌ Error generating or saving post:", err);
  process.exit(1);
});

const { Configuration, OpenAIApi } = require("openai");
const admin = require("firebase-admin");

require("dotenv").config();

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const styles = [
  "Use a humorous tone.",
  "Focus on developer tools and trends.",
  "Focus on new frameworks or updates to existing frameworks.",
  "Include one fun fact or stat if possible.",
];

function getPrompt() {
    // gets todays date to keep news fresh
  const date = new Date().toISOString().split("T")[0];
  // randomly selects a style
  const style = styles[Math.floor(Math.random() * styles.length)];

  // prompt to chatgpt to generate blog post.
  return `Write a 400-word blog post summarizing the most popular tech news and trends about the software development industry on ${date}. Make it about news that happened that date. This will be for a daily blog, and I want to prevent repeated responses and keep the news fresh. Also, make sure that the copy is SEO friendly. ${style}`;
}

async function generateAndStorePost() {
  const prompt = getPrompt();

  const res = await openai.createChatCompletion({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
  });

  const content = res.data.choices[0].message.content.trim();
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

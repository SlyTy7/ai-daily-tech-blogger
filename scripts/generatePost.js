import { config } from "dotenv";
import { marked } from "marked";

import axios from "axios";
import OpenAI from "openai";
import admin from "firebase-admin";
import https from "https";

// Load .env variables
config();

// Initialize OpenAI API
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Firebase initialization
const decoded = Buffer.from(
	process.env.FIREBASE_SERVICE_ACCOUNT_B64,
	"base64"
).toString("utf-8");
const serviceAccount = JSON.parse(decoded);
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Helper function to get today's date
const getTodayDate = () => {
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
};

// Fetch top posts from Hacker News
const fetchHackerNewsPosts = async () => {
	try {
		const keywords = [
			"react",
			"javascript",
			"web",
			"developer",
			"development",
			"code",
			"programming",
			"vite",
			"css",
			"html",
			"next.js",
			"typescript",
			"frontend",
			"tailwind",
			"bot",
			"crypto",
		];

		const todayTimestamp = Math.floor(Date.now() / 1000);

		const query = "frontend javascript react web";

		const response = await axios.get(
			"https://hn.algolia.com/api/v1/search_by_date",
			{
				params: {
					query,
					tags: "story",
					numericFilters: `created_at_i>${todayTimestamp}`,
					hitsPerPage: 100,
				},
			}
		);

		const posts = response.data.hits;

		// Filter client-side
		const frontendPosts = posts.filter((post) => {
			if (!post.title) return false;
			const title = post.title.toLowerCase();
			return keywords.some((keyword) => title.includes(keyword));
		});

		return frontendPosts;
	} catch (error) {
		console.error("Error fetching Hacker News posts:", error);
		throw error;
	}
};

// Generate blog post from Hacker News data
const generateAndStorePost = async (posts) => {
	const date = getTodayDate();

	// Construct prompt for OpenAI GPT
	const headlines = posts.map((post) => post.title).join("\n");
	const prompt = `Here are the top frontend-related headlines from Hacker News today:\n\n${headlines}\n\nSummarize the key trends in frontend development based on these headlines. Write a 400-word blog post about these trends, keeping the tone natural and engaging. Format it like an article using markdown with headings and subheadings.`;

	try {
		// Generate the post in Markdown format
		const response = await openai.chat.completions.create({
			model: "gpt-4-turbo",
			messages: [{ role: "user", content: prompt }],
		});

		const markdown = response.choices[0].message.content.trim();
		const html = marked.parse(markdown);

		// Save both Markdown and HTML to Firebase
		await db.collection("posts").doc(date).set({
			date,
			headlines,
			markdown,
			html,
			createdAt: admin.firestore.FieldValue.serverTimestamp(),
		});

		console.log(`Blog post saved for ${date}`);
	} catch (error) {
		console.error("Error generating or saving post:", error);
	}
};

// Main function to fetch posts, generate, and save
const main = async () => {
	try {
		const posts = await fetchHackerNewsPosts();

		if (posts.length > 0) {
			await generateAndStorePost(posts);
		} else {
			console.log("No relevant frontend posts found for today.");
		}
	} catch (error) {
		console.error("Error in process:", error);
	}
};

main();

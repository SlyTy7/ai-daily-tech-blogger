import { config } from "dotenv";
import { marked } from "marked";
import { readFile } from "fs/promises";

import matter from "gray-matter";

// Uploads post markdown files to Firestore at posts/{date}.
// Usage: node scripts/publishPost.js [--check] posts/2026-10-19.md ...
// --check validates the files without touching Firestore.

// Load .env variables
config();

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes("--check");
const files = args.filter((arg) => arg !== "--check");

const slugify = (text) =>
	text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const loadPost = async (file) => {
	const { data, content } = matter(await readFile(file, "utf-8"));
	// gray-matter turns unquoted YAML dates into Date objects
	const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date ?? "");

	const problems = [];
	if (!data.title) problems.push("missing title");
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push("date must be YYYY-MM-DD");
	if (!data.excerpt) problems.push("missing excerpt");
	if (!Array.isArray(data.tags) || data.tags.length === 0) problems.push("tags must be a non-empty list");
	if (!Array.isArray(data.sources)) problems.push("sources must be a list");
	if (/^#\s/m.test(content)) problems.push("body must not contain an H1 (# heading); the title is added automatically");
	if (content.trim().split(/\s+/).length < 200) problems.push("body is under 200 words");
	if (problems.length) throw new Error(`${file}: ${problems.join("; ")}`);

	const sources = data.sources.map(({ title, url, source }) => ({ title, url, source }));
	// Keep the H1 in the stored markdown so it renders like the older posts did
	const markdown = `# ${data.title}\n\n${content.trim()}`;

	return {
		date,
		title: data.title,
		slug: slugify(data.title),
		excerpt: data.excerpt,
		tags: data.tags,
		headlines: sources.map((s) => s.title).join("\n"),
		sources,
		markdown,
		html: marked.parse(markdown),
	};
};

const main = async () => {
	if (files.length === 0) {
		console.log("No post files given; nothing to do.");
		return;
	}

	const posts = await Promise.all(files.map(loadPost));
	if (CHECK_ONLY) {
		posts.forEach((post) => console.log(`OK ${post.date}: ${post.title}`));
		return;
	}

	// Loaded only when publishing so --check works without Firebase installed or configured
	const { initializeApp, cert } = await import("firebase-admin/app");
	const { getFirestore, FieldValue } = await import("firebase-admin/firestore");

	const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, "base64").toString("utf-8");
	initializeApp({ credential: cert(JSON.parse(decoded)) });
	const db = getFirestore();

	for (const post of posts) {
		const ref = db.collection("posts").doc(post.date);
		const existing = await ref.get();
		const now = FieldValue.serverTimestamp();

		// Re-publishing an edited post keeps its original createdAt
		await ref.set({ ...post, createdAt: existing.exists ? existing.data().createdAt : now, updatedAt: now });
		console.log(`Published ${post.date}: ${post.title}`);
	}
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

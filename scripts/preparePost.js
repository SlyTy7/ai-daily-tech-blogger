import { existsSync } from "fs";
import { readdir, readFile } from "fs/promises";
import matter from "gray-matter";

import { fetchSourceItems } from "./sources.js";

// Prints everything the writer needs for today's post as JSON. Date, format,
// length, and the random skip live here so they're real randomness, not the
// model's guess at it. Pass --force to ignore the skip roll.

const TIME_ZONE = "America/Los_Angeles";
const SKIP_CHANCE = 0.12;
const FORCE = process.argv.includes("--force");

// Post formats rotate by weekday so the blog doesn't read the same every day
const FORMATS = {
	1: "Weekly kickoff: the two or three developments from the past week that matter most to a working full-stack developer, and why.",
	2: "Deep dive: pick the single most interesting item and dig into it — what changed, how it works, and what you'd actually do with it.",
	3: "Practical how-to: take one item and turn it into a concrete, hands-on takeaway with a short code example where it helps.",
	4: "Opinion: take a clear position on one trend or announcement. Argue it honestly, including the strongest counterpoint.",
	5: "Friday roundup: a relaxed, skimmable roundup of the week's notable links, a sentence or two of commentary on each.",
};

// Today's date and weekday in Tyler's time zone, not the runner's UTC clock
const getToday = () => {
	const parts = Object.fromEntries(
		new Intl.DateTimeFormat("en-US", {
			timeZone: TIME_ZONE,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			weekday: "short",
		})
			.formatToParts(new Date())
			.map(({ type, value }) => [type, value])
	);
	const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);

	return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday };
};

// Titles of recent posts so the writer doesn't repeat a topic it just covered
const getRecentTitles = async () => {
	if (!existsSync("posts")) return [];
	const files = (await readdir("posts")).filter((f) => f.endsWith(".md")).sort().slice(-15);
	const posts = await Promise.all(files.map(async (f) => matter(await readFile(`posts/${f}`, "utf-8")).data));
	return posts.map((data) => data.title).filter(Boolean).reverse();
};

const main = async () => {
	const { date, weekday } = getToday();
	const outputPath = `posts/${date}.md`;

	if (existsSync(outputPath)) {
		console.log(JSON.stringify({ skip: true, reason: `${outputPath} already exists` }, null, 2));
		return;
	}
	if (!FORCE && Math.random() < SKIP_CHANCE) {
		console.log(JSON.stringify({ skip: true, reason: "Random day off" }, null, 2));
		return;
	}

	const items = await fetchSourceItems();
	if (items.length === 0) throw new Error("No source items found; refusing to write a post from nothing");

	console.log(
		JSON.stringify(
			{
				skip: false,
				date,
				outputPath,
				format: FORMATS[weekday] ?? FORMATS[2],
				targetWords: 500 + Math.floor(Math.random() * 500),
				recentTitles: await getRecentTitles(),
				items,
			},
			null,
			2
		)
	);
};

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

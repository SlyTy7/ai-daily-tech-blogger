import Parser from "rss-parser";

// Feeds that cover the mix of topics the blog writes about. A feed that
// fails to load is skipped; the run only fails if every source comes back empty.
const RSS_FEEDS = [
	{ name: "HubSpot Developer Changelog", url: "https://developers.hubspot.com/changelog/rss.xml", topic: "hubspot", lookbackDays: 21 },
	{ name: "HubSpot Developer Blog", url: "https://developers.hubspot.com/blog/rss.xml", topic: "hubspot", lookbackDays: 21 },
	{ name: "Simon Willison", url: "https://simonwillison.net/atom/everything/", topic: "ai" },
	{ name: "Hugging Face Blog", url: "https://huggingface.co/blog/feed.xml", topic: "ai" },
	{ name: "Latent Space", url: "https://www.latent.space/feed", topic: "ai" },
	{ name: "GitHub Blog", url: "https://github.blog/feed/", topic: "dev" },
	{ name: "Cloudflare Blog", url: "https://blog.cloudflare.com/rss/", topic: "backend" },
	{ name: "Node.js Blog", url: "https://nodejs.org/en/feed/blog.xml", topic: "backend" },
	{ name: "Vercel", url: "https://vercel.com/atom", topic: "frontend" },
];

// Hacker News stories are kept only if their title matches one of these
const HN_KEYWORDS = [
	"ai", "llm", "claude", "gpt", "agent", "mcp", "rag", "embedding",
	"api", "backend", "database", "postgres", "sql", "node", "serverless",
	"typescript", "javascript", "react", "next.js", "css", "frontend", "browser",
	"hubspot", "crm", "webhook", "integration", "oauth",
];

// HubSpot feeds publish less often, so they set a longer lookbackDays
const RSS_LOOKBACK_DAYS = 7;
const HN_LOOKBACK_HOURS = 48;
const MAX_ITEMS_PER_FEED = 5;

const stripHtml = (text = "") =>
	text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);

const matchesKeyword = (title) => {
	const lower = title.toLowerCase();
	return HN_KEYWORDS.some((keyword) =>
		new RegExp(`\\b${keyword.replace(".", "\\.")}\\b`).test(lower)
	);
};

const fetchRssItems = async () => {
	const parser = new Parser({ timeout: 15000 });

	const results = await Promise.allSettled(
		RSS_FEEDS.map(async (feed) => {
			const parsed = await parser.parseURL(feed.url);
			const cutoff = Date.now() - (feed.lookbackDays ?? RSS_LOOKBACK_DAYS) * 24 * 60 * 60 * 1000;
			return parsed.items
				.filter((item) => item.title && item.link)
				.filter((item) => new Date(item.isoDate || item.pubDate).getTime() > cutoff)
				.slice(0, MAX_ITEMS_PER_FEED)
				.map((item) => ({
					title: item.title.trim(),
					url: item.link,
					source: feed.name,
					topic: feed.topic,
					summary: stripHtml(item.contentSnippet || item.content),
				}));
		})
	);

	return results.flatMap((result, i) => {
		if (result.status === "fulfilled") return result.value;
		console.warn(`Skipping feed ${RSS_FEEDS[i].name}: ${result.reason.message}`);
		return [];
	});
};

const fetchHackerNewsItems = async () => {
	const since = Math.floor(Date.now() / 1000) - HN_LOOKBACK_HOURS * 60 * 60;
	const params = new URLSearchParams({
		tags: "story",
		numericFilters: `created_at_i>${since},points>75`,
		hitsPerPage: "200",
	});

	const response = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`);
	if (!response.ok) throw new Error(`Hacker News API returned ${response.status}`);
	const { hits } = await response.json();

	return hits
		.filter((hit) => hit.title && matchesKeyword(hit.title))
		.sort((a, b) => b.points - a.points)
		.slice(0, 15)
		.map((hit) => ({
			title: hit.title,
			url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
			source: "Hacker News",
			topic: "dev",
			summary: `${hit.points} points, ${hit.num_comments} comments`,
		}));
};

export const fetchSourceItems = async () => {
	const [rssItems, hnItems] = await Promise.all([
		fetchRssItems(),
		fetchHackerNewsItems().catch((error) => {
			console.warn(`Skipping Hacker News: ${error.message}`);
			return [];
		}),
	]);

	return [...rssItems, ...hnItems];
};

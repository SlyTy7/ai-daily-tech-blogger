<!-- portfolio-meta display_name: AI Daily Tech Blogger -->
# AI Daily Tech Blogger 🧠📰

A developer blog that writes itself on weekdays. A scheduled Claude Code routine writes each post and pushes it here, and a GitHub Action publishes it to Firebase Firestore, where my portfolio site reads it. Topics cover front-end, back-end, AI, and HubSpot integrations.

## How it works

1. **Write (Claude Code routine, weekday mornings):** the routine follows [WRITING_GUIDE.md](WRITING_GUIDE.md). It runs `npm run prepare-post`, which picks today's format, a target length, and pulls recent items from RSS feeds and Hacker News ([scripts/sources.js](scripts/sources.js)). It also skips about 12% of days at random. Claude writes `posts/YYYY-MM-DD.md`, validates it with `npm run check-post`, and pushes to `main`.
2. **Publish (GitHub Action):** [publish-post.yml](.github/workflows/publish-post.yml) runs on any push that adds or edits a file in `posts/` and uploads it to Firestore at `posts/{date}`.

Editing a post in `posts/` and pushing republishes it. To take a post down, delete its document in Firestore.

## Changing the writing

Edit [WRITING_GUIDE.md](WRITING_GUIDE.md) for voice, rules, and file format. Edit `FORMATS` in [scripts/preparePost.js](scripts/preparePost.js) for the weekday formats and `RSS_FEEDS` in [scripts/sources.js](scripts/sources.js) for sources.

## Setup

1. Install dependencies: `npm install`
2. Add a `FIREBASE_SERVICE_ACCOUNT_B64` GitHub secret (your Firebase service account JSON, base64-encoded). For local publishing, put it in `.env` too.
3. Connect GitHub to your Claude account and create the routine with `/schedule` in Claude Code.

## Run locally

```bash
npm run prepare-post -- --force          # see today's sources and format, ignoring the skip roll
npm run check-post -- posts/<date>.md    # validate a post without publishing
npm run publish-post -- posts/<date>.md  # publish a post to Firestore
```

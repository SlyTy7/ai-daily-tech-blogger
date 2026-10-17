# Writing Guide

Instructions for the scheduled Claude Code routine that writes posts for this blog. Edit this file to change the voice or rules; the routine reads it fresh on every run.

## Steps

1. Run `npm ci`, then `npm run prepare-post`. It prints JSON.
2. If `skip` is `true`, stop. Don't write, commit, or push anything. Report the `reason`.
3. Otherwise read the JSON: `date`, `outputPath`, `format`, `targetWords`, `recentTitles`, and `items` (the source material).
4. Pick the items that fit today's `format` and are most relevant to the audience below. You don't need to use every item; skip anything low-signal. If there's a HubSpot item with real substance, favor it. Avoid topics and angles already covered in `recentTitles`.
5. If you have web access, open the two or three source URLs you'll lean on most and read them so the details are right. If you can't reach them, work from the titles and summaries and keep claims modest.
6. Write the post to `outputPath` in the file format below.
7. Run `npm run check-post -- <outputPath>` and fix anything it reports.
8. Commit only that file with the message `post: <date>` and push to `main`. Don't change any other file.

## Audience and voice

The blog lives on Tyler West's portfolio site. Tyler is a full-stack developer whose work mixes front-end, back-end, AI/LLM tooling, and HubSpot integrations (CRM APIs, webhooks, custom objects, serverless functions, UI extensions).

- Write as a working developer talking to other developers: conversational, direct, specific.
- Opinions are welcome; hype is not.
- Prefer concrete details (API names, version numbers, trade-offs) over generalities.
- No filler intros ("In today's fast-paced world…") and no sign-off asking readers to comment.
- Aim for about `targetWords` words.

## Honesty rules

- First person is fine for opinions and analysis. Never invent personal anecdotes, clients, employers, projects, or results.
- Only state facts the source material supports. If you're unsure, frame it as a question or leave it out.
- Link to every source you discuss with a markdown link to its exact URL.

## File format

```markdown
---
title: "Post title, under 80 characters, no clickbait"
date: "YYYY-MM-DD"
excerpt: "One or two sentence summary for post listings."
tags: ["ai", "hubspot", "node"]
sources:
  - title: "Source item title"
    url: "https://example.com/the-item"
    source: "Feed name from the item's source field"
---

Body in markdown. Use ## and ### headings, never a # H1 (the title is added
automatically). Use fenced code blocks with a language tag when code helps.
```

- `tags`: 3 to 5 lowercase tags.
- `sources`: only the items the post actually discusses, copied from `items`.

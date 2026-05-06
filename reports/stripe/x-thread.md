# X thread — Agent Readiness Report: Stripe

7 tweets. Tweet 1 leads with score + dominant theme + tags. NO link in tweet 1 (X throttles link-leading threads). Link lands in tweet 7. Tag `@stripe` on tweet 1.

---

**Tweet 1** (235 chars)

> If anyone in payments should be Level 3, it's @stripe.
>
> The canonical API-first company. They literally ship @stripe/mcp on npm.
>
> 25/100. Level 1.
>
> Not because the capability is missing. Because the breadcrumbs from the front door are.

---

**Tweet 2** (233 chars)

> docs.stripe.com is the high water mark.
>
> Real /llms.txt — 93KB structured index.
>
> Hit any docs URL with .md on the end and you get markdown. /payments.md returns text/plain, not HTML.
>
> Convention beats spec when the convention works.

---

**Tweet 3** (251 chars)

> stripe.com — the marketing front door — scores 10/100. Level 0.
>
> No /AGENTS.md. No MCP Server Card. No Content-Signal directive on robots.txt.
>
> Sitemap is at /sitemap/sitemap.xml instead of /sitemap.xml.
>
> Tiny config gap. Big drop in agent legibility.

---

**Tweet 4** (256 chars)

> The kicker: @stripe/mcp v0.3.3 ships on npm right now. "Command line tool for setting up Stripe MCP server."
>
> Stripe operates an MCP server.
>
> An agent reading stripe.com cannot tell.
>
> Capability real. Signal absent. Textbook Invisible Product anti-pattern.

---

**Tweet 5** (251 chars)

> Fix #1: surface @stripe/mcp from stripe.com. One footer line: "AI agents: npx @stripe/mcp init."
>
> Drop /.well-known/mcp-server-card.json at every public root.
>
> The hard work — building the MCP server — is done. What's left is the discovery breadcrumb.

---

**Tweet 6** (237 chars)

> Fix #2: honor Accept: text/markdown on canonical docs URLs.
>
> Stripe already serves markdown via the .md suffix. The work is the content-negotiation handler, not new content.
>
> Same docs. Two ways in. Cuts the tribal-knowledge tax to zero.

---

**Tweet 7** (254 chars)

> Stripe defined developer-first payments.
>
> They have the capability. They're missing the breadcrumbs.
>
> If they fix it, almost every other API company has no excuse.
>
> Full report — rubric, raw probe data, top fixes:
>
> https://agentsfirst.dev/reports/stripe/

---

**Tweet count**: 7. All tweets under 280 chars.

**Tags**: `@stripe` on tweet 1 (and `@stripe/mcp` natural-mention in tweets 1, 4, 5). Report URL only on tweet 7 (X throttles link-leading threads ~40%).

**Note**: tweet body is the text shown to the reader between `>` lines, including blank lines as `\n` chars. The `>` markdown markers and "Tweet N" labels are NOT part of the tweet.

# X thread — Agent Readiness Report: The Wall Street Journal

7 tweets. Tweet 1 leads with score + the dominant theme (closed by editorial choice, not negligence) + tag. NO link in tweet 1 (X throttles link-leading threads). Link lands in tweet 7. Tag `@WSJ` on tweet 1.

---

**Tweet 1** (266 chars)

> @WSJ scored 10/100. Level 0. The Invisible Product.
>
> But not by accident.
>
> The robots.txt allow-lists ChatGPT-User, GPTBot, OAI-SearchBot — the OpenAI deal — and disallows everyone else by default.
>
> Closed posture. Editorial choice. Worth a thread.

---

**Tweet 2** (273 chars)

> The framework can see surfaces. It can't see contracts.
>
> News Corp signed OpenAI in May 2024 for ~$250M+ over 5 years.
>
> WSJ's robots.txt enforces the deal: three OpenAI bots in, every other AI crawler out.
>
> Cold agent on wsj.com? Nothing.
> OpenAI's crawler? Full access.

---

**Tweet 3** (262 chars)

> No /llms.txt. No /AGENTS.md. No MCP server card. No Content-Signal directive.
>
> api.dowjones.com returns User-agent: * / Disallow: / and 404s on every probe.
>
> The Newswires API exists. It's just not addressable from the public DNS name an agent would try.

---

**Tweet 4** (271 chars)

> Fix #1: publish a Content Signals directive that says "licensed."
>
> Content-Signal: ai-train=licensed, ai-input=licensed, search=yes
>
> One line. Tells every crawler — not just the three OpenAI bots — that training requires a deal. Points them at copyright@dowjones.com.

---

**Tweet 5** (276 chars)

> Fix #2: ship /AGENTS.md at wsj.com and api.dowjones.com.
>
> Today the licensing intent lives in a comment block at the top of robots.txt. Invisible to agents that read robots-as-rules.
>
> AGENTS.md makes it first-class: what's allowed, what isn't, who to email to license.

---

**Tweet 6** (263 chars)

> Fix #3: as new licensing deals close, name the bots.
>
> The current allow-list is one deal: OpenAI.
>
> Anthropic, Google, Perplexity, Mistral — every deal that closes should produce a one-line robots.txt update so licensed bots know they're welcome.

---

**Tweet 7** (236 chars)

> Bi-weekly Agent Readiness Reports — scoring named products against the Agents First framework.
>
> Full report: rubric, raw probe data, top fixes, the asterisk on the score:
>
> https://agentsfirst.dev/reports/wsj/

---

**Tweet count**: 7. All tweets under 280 chars.

**Tags**: `@WSJ` on tweet 1; report URL only on tweet 7 (X throttles link-leading threads ~40%).

**Note**: tweet body is the text shown to the reader between `>` lines, including blank lines as `\n` chars. The `>` markdown markers and "Tweet N" labels are NOT part of the tweet.

# LinkedIn post — Agent Readiness Report: The Wall Street Journal

Single post, ~340 words. More polished than the X thread; opens with the score and the asterisk, closes with a polite tag of the WSJ leadership.

---

**Agent Readiness Report: The Wall Street Journal scored 10/100. Level 0 (No agent access) — but on purpose.**

WSJ is the first report in this series where the score understates how deliberate the posture is. The Agent Readiness rubric measures public surfaces — robots.txt, /llms.txt, /AGENTS.md, /.well-known/*, MCP server cards, OpenAPI documents. WSJ's surfaces are closed by design.

In May 2024, News Corp signed a five-year, ~$250M+ licensing deal with OpenAI. WSJ's robots.txt enforces it cleanly: ChatGPT-User, GPTBot, and OAI-SearchBot sit inside an allow-list block ending with `Allow: /`. Every other crawler — including every other AI lab's crawler — defaults to `Disallow: /` at the top of the file. The commercial door is open for one buyer; closed for the rest. To an agent landing on wsj.com cold, the product is invisible. To OpenAI's crawler, it's accessible.

The framework's public-surface rubric can't see the deal. That's the story.

The two surfaces scored:
- www.wsj.com — 10/100, Level 0 (5 points for naming GPTBot, 5 for sitemap.xml)
- api.dowjones.com — 0/100, Level 0 (User-agent: * / Disallow: /, 404 on every probe)

The anti-pattern flagged is The Invisible Product — but the default failure mode for that anti-pattern is negligence. WSJ's failure mode is editorial choice plus partial bilateral licensing. Same surface signal; very different intent. The fix isn't "open the doors." The fix is making the licensing posture machine-readable.

Top three fixes (none of them recommend ripping the paywall):
1. Publish a Content Signals directive: `Content-Signal: ai-train=licensed, ai-input=licensed, search=yes`. One line tells every AI crawler that training requires a commercial agreement.
2. Ship /AGENTS.md at wsj.com and api.dowjones.com pointing at copyright@dowjones.com / licensing@dowjones.com. Lift the licensing intent out of a robots.txt comment block and make it first-class.
3. As new licensing deals close, expand the allow-list. Every deal should produce a one-line robots.txt update so the licensed bots know they're welcome.

The lesson for everyone else: a closed posture is a posture, and posture should be machine-readable. Default-deny robots.txt is loud silence. Content Signals + AGENTS.md is how you tell the agent ecosystem "the door is open, but you have to knock at this address."

The lesson for me: the rubric is a public-surface measurement. It can see robots.txt; it cannot see a $250M licensing contract. v0.1.3 will add a `licensing_posture` field so reports like this one can distinguish "closed by negligence" from "closed by editorial choice."

Full report, raw probe data, and rubric (v0.1.2): https://agentsfirst.dev/reports/wsj/

Bi-weekly Agent Readiness Reports series. Polite tags to Almar Latour (CEO, Dow Jones / Publisher, WSJ) and Emma Tucker (Editor in Chief, WSJ). Replies and "we just shipped the fix" notes welcome.

#AgentsFirst #WSJ #DowJones #AIAgents #ContentLicensing

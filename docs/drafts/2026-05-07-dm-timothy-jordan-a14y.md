# Outreach DM — Timothy Jordan (a14y.dev maintainer)

**Source:** /agentsfirst-check 2026-05-07 recommendation [ccd0c45e]
**Window:** ~14 days before SEO graph hardens around "agent readiness web score"
**Goal:** mutual citation — they list framework as the meta-layer above their spec; we list a14y as the runnable web scorecard
**Status:** draft — needs Josh to verify Timothy Jordan's preferred handle (X, GitHub, email) before sending

---

## Pre-send checklist

- [ ] Find Timothy's preferred handle: try @timothyjordan on X first; check `github.com/timothyjordan` for any "Find me on X / Bluesky" link in his profile
- [ ] Confirm he's not already aware of agentsfirst.dev (search his public posts for "agents first" or "agentsfirst")
- [ ] Once thesis v0.8 is live with the "Versus a14y" subsection (already shipped commit c98fba9, push 7baa96e), the link in the DM resolves correctly
- [ ] Post-send: log this in `docs/drafts/` with date and outcome so the next /agentsfirst-check doesn't re-surface

---

## Draft 1 — X DM (most informal channel; 280 char ok if multi-message)

**Message 1:**
> Hey Timothy — caught a14y v0.2.0 yesterday. The 38-check spec is sharp; the markdown-mirror + content-negotiation checks are doing real work that nobody else is publishing.

**Message 2:**
> I write a higher-altitude framework at agentsfirst.dev — 8 design principles + 4 adoption levels + a /reports/ scoreboard for individual products. Different layer. Just shipped a "Versus a14y" subsection in v0.8 framing it as complementary: your scorecard, our framework.

**Message 3:**
> Open to mutual citation? Happy to add a14y to our /tools/ page and link the spec from the comparison subsection. If you'd consider listing the framework as the meta-layer on a14y.dev's research/related-work page, that'd compound nicely for both of us.

**Message 4 (optional, only if the convo is going well):**
> Either way — the work is good. If you ever want to chat about agent-readiness scoring, the rubric Wars are about to heat up (Cloudflare ARS, Fivetran AI Readiness Index, your spec, our framework, AWS now). I'd love to compare notes.

---

## Draft 2 — GitHub issue on `timothyjordan/a14y` (more public, more durable)

**Title:** Mutual citation — Agents First framework + a14y spec compose well

**Body:**
> Hi @timothyjordan — I've been writing the [Agents First](https://agentsfirst.dev) framework (open thesis + 4-level adoption ladder + scoring MCP), and yesterday's a14y v0.2.0 release lined up so well with the "agent web readability" leg of the framework that I just shipped a "Versus a14y" subsection citing your spec ([live](https://agentsfirst.dev/#versus-a14y), [diff](https://github.com/capitalthought/agentsfirst/commit/c98fba9)).
>
> The two layers compose cleanly:
> - **a14y** scores how readable a *web page* is to an agent (38 versioned checks, page-level + site-level)
> - **Agents First** scores whether a *product* is built for an agent customer at all (Levels 0–4, 8 implementation principles)
>
> A Level-3 product on Agents First should score 90+ on a14y for its public surfaces, and there's no overlap in what we measure.
>
> Open to mutual citation? Happy to:
> - Add a14y to `/tools/` and the comparison subsection (already done above)
> - Send a courtesy DM if you ship a v0.3 — we can co-amplify
>
> If you'd consider listing the framework as a related/meta layer on a14y.dev's spec page, that'd be a clean win for both projects. No hurry; happy to chat any way you prefer.

---

## Why this works

- **Leads with appreciation.** The 38-check spec really is sharp; the praise is real, not performative.
- **Frames complementarily.** Avoids any "we cover what you cover" comparison that triggers competitive reflex.
- **Names the diff.** Web pages vs. product. Different layer.
- **Asks once.** One clear ask (mutual citation), no laundry list.
- **GitHub issue version is durable.** If Timothy doesn't respond on X, the issue stays public and might get picked up by anyone searching for "a14y agents first."

## Why NOT to do this

- If Timothy has already published critique of the framework somewhere — wait, address it first.
- If `timothyjordan` resolves to a different person on X — handle confusion, easier to walk back via GitHub.

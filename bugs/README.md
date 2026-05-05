# bugs/

Cross-repo bug reports filed against this repo by Claude sessions running in other repos.

## Layout

- `incoming/` — new reports awaiting triage. Run `/bugsweep` from this repo's root to triage.
- `triaged/` — processed reports, kept as an audit trail. Do not delete.

## Filing a bug against THIS repo from another repo

Run `/bugfile <this-repo-name>` from the session that hit the bug. The command:

1. Auto-captures source repo, machine, model, timestamp, and last error.
2. Prompts for summary, severity, reproducer, expected, actual.
3. Dedups via sha256[:8] of the Reproducer block.
4. Writes to `bugs/incoming/<YYYYMMDD-HHMMSS>-<slug>.md` here.

If the target repo isn't cloned on the filer's machine, the report lands in
`~/icloud/Claude/bugs-outbox/<target>/` and the first `/bugsweep` in this repo
flushes the outbox into `bugs/incoming/`.

## Triaging

From this repo's root:

```
/bugsweep
```

Each bug offers: **(r)**ead, **(t)**odo (promote to `todo.md`), **(g)**h-issue,
**(c)**ommit (link fix), **(w)**ontfix, **(b)**ounce (wrong target), **(s)**kip.

## Schema

See `~/icloud/Claude/templates/bug-report.md` for the full frontmatter schema.
Reports are markdown with YAML frontmatter — greppable, diff-friendly, committed
to git as the audit trail.

## Rules

- `bugs/` is committed to git. Nothing here is ignored.
- Never delete files in `triaged/` — the history matters.
- `todo.md` is for intra-repo work. `bugs/` is for inter-repo cross-boundary reports.

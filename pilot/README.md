# SHGHIL V3 — Closed Pilot Pack

Prepared against production commit `b12198a68ee9b7c226809df81dbfc0d1f3e62c92`
(`shaghil.vercel.app`). Draft materials for founder review — **not yet distributed to testers,
not yet committed to version control.**

| File | Audience | Purpose |
|---|---|---|
| `00-readiness-report.md` | Founder / team (English) | Phase 1 audit + Phase 3 QA results + prioritized findings |
| `01-onboarding-guide-ar.md` | Pilot testers (Arabic) | 5-minute start guide |
| `02-data-storage-warning-ar.md` | Pilot testers (Arabic) | Local-only storage, no auto-sync — read before entering real data |
| `03-backup-recovery-guide-ar.md` | Pilot testers (Arabic) | Export/import as the only backup path |
| `04-test-scenarios-ar.md` | Pilot testers (Arabic) | 5 realistic scenarios: setup, content, campaigns, designs, saved work |
| `05-feedback-questionnaire-ar.md` | Pilot testers (Arabic) | End-of-scenario feedback form (copy-paste ready for Google Forms) |
| `06-issue-tracking-and-results-template.md` | Founder / team | Issue log + daily tracker + end-of-pilot results summary |

**Before inviting testers**, the readiness report's two high-severity items need a founder
decision (neither requires an app code change):
1. Gate production access (e.g. Vercel Password Protection) so the pilot is actually limited to
   the invited 5–10 people.
2. Confirm a spend cap/alert exists on the OpenAI account behind `OPENAI_API_KEY`.

Everything else in the readiness report is informational or low-priority; no code fix is required
to start the pilot.

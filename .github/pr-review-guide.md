# PR Review Guide for Proposers

> This guide helps you review your developer's Pull Requests effectively. Good review is specific, actionable, and constructive. You are not just approving code — you are evaluating whether the product meets your requirements.

---

## Before You Start

1. Read the PR description — what Issue does it close? What changed?
2. Open the deployed app (or run locally) and test the feature
3. Reference the Issue's acceptance criteria as your testing checklist

---

## Two Review Modes

Every PR review should include **both** modes. Spend more time on the mode that matches your strengths.

### Mode 1: Functional Review (Required for all backgrounds)

*Does this PR deliver what I asked for?*

| Question | Your assessment |
|----------|----------------|
| Does this PR solve the Issue it references? | Yes / Partially / No |
| Can you use the feature without the developer explaining it? | Yes / Needs work |
| Are there edge cases the developer missed? | List them |
| Is the UX intuitive for a first-time user? | Yes / Needs work |
| Do loading, error, and empty states work correctly? | Yes / Missing some |

**How to test:**
- Follow the "How to Test" steps in the PR description
- Try unexpected inputs (empty fields, very long text, special characters)
- Try the feature on mobile viewport (resize browser)
- If it has an AI feature, try adversarial inputs ("ignore previous instructions...")

### Mode 2: Technical Review (For those comfortable with code)

*Is the code well-structured and safe?*

| Question | Your assessment |
|----------|----------------|
| Are variable and function names clear? | Yes / Some unclear |
| Is error handling present for API calls and database operations? | Yes / Missing some |
| Are there any hardcoded secrets or magic numbers? | None found / Found: [location] |
| Is the code organized logically (not one giant file)? | Yes / Needs cleanup |
| Does the PR include tests for the new feature? | Yes / No |

**If you are not comfortable reading code:** That is OK. Focus on Mode 1 and ask your developer to explain any technical decisions you don't understand. Asking "why did you do it this way?" is a valid and valuable review comment.

---

## Writing Review Comments

### Minimum Per PR

Every PR review must include:
- **≥1 approval comment** — something specific that works well ("The error message on invalid email is really clear")
- **≥1 suggestion or question** — something to improve or clarify ("Have you considered what happens when the user submits an empty form?")

### Tone Guide

| Instead of this | Try this |
|----------------|----------|
| "This is wrong" | "I expected [X] but I'm seeing [Y] — can you check?" |
| "Fix this" | "What do you think about [alternative approach]?" |
| "This doesn't work" | "When I test with [input], I get [result] instead of [expected]" |
| "LGTM" (with no specifics) | "The [feature] works as expected. I tested [scenarios]. One thing I noticed..." |

### Using Screenshots

Screenshots are the most powerful tool for non-technical reviewers:
- Capture the UI before and after your test
- Annotate what you expected vs. what happened
- Include the browser URL and viewport size

---

## Review Timeline

- Review within **48 hours** of PR submission
- If you need more time, comment on the PR: "I've seen this and will review by [date]"
- If the PR is too large to review (>400 lines), ask the developer to split it

---

## Common Review Mistakes to Avoid

- **"Looks good to me" without testing** — Always test the feature yourself
- **Only positive feedback** — Every PR has something that could be improved
- **Only negative feedback** — Acknowledge what works; developers are humans
- **Reviewing code you don't understand without asking** — Questions are not weakness; they are review
- **Letting PRs sit unreviewed for days** — This blocks your developer and signals disengagement

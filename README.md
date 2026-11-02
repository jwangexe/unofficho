# UnoffIChO

**Chemistry olympiad practice that feels like scrolling a feed.**

UnoffIChO is a phone-first revision app for the International Chemistry Olympiad (IChO). It has short Book pages, a reagent drill, and a Calculations trainer where you build each answer from formula steps instead of typing numbers into a calculator. It works offline, and questions you miss come back when you need them.

> An unofficial, independent study resource. Not affiliated with or endorsed by the International Chemistry Olympiad or its organisers.

Intended home: **unofficho.org**. It is deployed on Cloudflare; see [DEPLOY.md](DEPLOY.md).

---

## Why it exists

UnoffIChO was created by an IChO gold medallist, a UK sixth-former preparing for IChO 2027 in Taiwan. They wanted olympiad practice to be as low-friction as scrolling a feed on a phone, so that ten spare minutes on a bus could become ten useful minutes of chemistry.

Existing resources are excellent but heavy: long past papers, thick textbooks, PDFs that are awkward on a phone. They are hard to dip into. The idea was a tool that:

- **fits in a pocket:** one card per screen, thumb-reachable controls, offline after the first visit
- **trains the right habits:** building a solution from formulas with units, deriving rate laws instead of memorising them, deciding what a reagent does and does not touch
- **gives feedback that teaches:** not just "wrong", but *where* a route went wrong, the classic misconception it matches, and the limiting cases of a result
- **brings mistakes back:** spaced repetition across every section, so missed items return before they are forgotten
- **is useful to others:** IChO participants and national camp qualifiers, not just its author

It is free, has no accounts, and keeps all progress on your own device.

---

## What's inside

### Calculations
Every given value is a **chip** carrying its unit. You build the answer by applying a formula (e.g. ΔG = ΔH − TΔS, solved for any variable) or an operation (×, ÷, ln, …) to chips. Each result becomes a new chip.

- **Units are handled for you:** kJ vs J and °C vs K are converted automatically, and wrong dimensions are rejected with an explanation.
- **Numbers are fresh every time:** questions are templates with randomised, chemically realistic parameters, so answers can't be memorised.
- **Feedback looks at your route:** your answer is compared with the reference solution step by step, and recognises **known misconceptions** ("that's the pre-equilibrium result, but k₋₁ is not ≫ k₂ here").
- **Modes:**
  - **Feed:** quick questions
  - **Approach:** plan the steps without numbers
  - **Multi-step:** olympiad-length problems
  - **Exam:** timed, with strict units and no automatic conversion
  - **Mechanisms** (below)
- **Stoichiometry basics are always one tap away:** n = m/M, c = n/V, mole ratio, dilution, pV = nRT, N = nN_A, percentage yield, mass concentration.
- **A general ICE formula,** K = Π([X]₀ + νξ)^ν, for any reaction: set the stoichiometric coefficients with steppers.

### Mechanisms
Steady-state and pre-equilibrium results are **derived, not stored**. A small symbolic-algebra engine takes the elementary steps and does the rest:

1. You choose which intermediates are in steady state and which steps are fast pre-equilibria.
2. The engine writes and solves the equations, including mass balances, and squared intermediates such as radical termination.
3. It substitutes into the rate and lists the limiting cases.

There are 10 classic mechanisms, including Lindemann, Michaelis–Menten, competitive inhibition, 2NO + O₂, ozone, H₂ + I₂, Sₙ1 with a common ion, and radical polymerisation.

- **Pick the rate law:** choose from four options. The distractors are the classic mistakes.
- **Derive it:**
  - **Write the equations** from term chips, with feedback on each term ("step 2 uses up A*, so its term is negative").
  - **Solve by substitution,** one intermediate at a time.
  - **Choose the simplified rate law.**

### Reagents
- **Classify:** tap every role a reagent can play. Partial credit is given, and defensible extra roles are neither rewarded nor penalised.
- **Fast:** one tap, using a two-column grid of roles.
- **Will it react?:** decide which groups react, then pick the product from drawn structures.

72 reagents are included, each with roles, strength (pKaH or E°), typical uses, what it does *and does not* do, and common traps.

### Book
Two-minute pages, written originally for this app, with:

- KaTeX maths
- structures drawn from SMILES
- reaction schemes
- callouts ("Common trap", "Olympiad tip")
- links that open reagent cards and formulas
- 2–3 quick checks per page, which feed spaced repetition

7 pages are written and 36 more are outlined across physical, inorganic, organic and analytical chemistry. Two pages include the interactive mechanism tool.

### Progress
- **Overview:** streaks, items due today, and accuracy by section and topic.
- **Weak spots:** a list of your weakest topics, questions, reagents or formulas. Each opens a feed focused on just that.
- **Export and import:** move your progress between devices as JSON.

### Also
- **Rad**, the mascot (a free radical with one unpaired electron), gives a first-visit tour of Calculations and of Mechanisms.
- **Suggestions:** a speech-bubble button on every screen sends feedback to a small database. The owner reads it on a password-protected `/inbox` page.
- **Review mode** (`/review`, password-protected) is for checking content accuracy:
  - **Calculations:** solve each question blind, then compare with the reference and its intermediate steps.
  - **Everything else:** work through a checklist of each claim.
  - **Notes:** export problems found as one markdown list.
- **Accessibility:** WCAG AA contrast in light and dark mode, screen-reader-readable maths, keyboard navigation, reduced-motion support. Lighthouse scores 100 for accessibility on every screen.

---

## How it was built

UnoffIChO was built with **[Claude Code](https://claude.com/claude-code)** in a series of reviewed phases. The author wrote the brief and reviewed every phase; Claude proposed the design and wrote the code, content drafts and tests.

| Phase | What |
| --- | --- |
| 1 | Scaffold: PWA shell, navigation, theming, data loading, local storage |
| 2 | Quantity, unit and dimension system; formula engine; numerical solver (unit-tested before any UI) |
| 3 | Calculations UI: chips, operations, feed, answer checking, error diagnosis |
| 4 | Approach, Multi-step and Exam modes; the rest of the formula library |
| 5 | Reagent classifier, Fast mode, "Will it react?" |
| 6 | Book framework (MDX) with sample pages and outlines |
| 7 | Spaced repetition, Progress, export/import, content review page |
| 8 | Accessibility, gestures, Playwright smoke tests, Lighthouse, deployment guide |
| Later | Derived (not stored) steady-state kinetics; the "Derive it" flow; general ICE formula; homepage; Rad and the tutorials; pinned Stoichiometry; suggestions; review mode |

Guiding rules throughout:

- **Original writing only:** no copied or closely paraphrased textbook text.
- **Accuracy over volume:** uncertain facts are marked `todoVerify` rather than guessed.
- **Nothing reviewed by default:** every content item starts with `reviewed: false` until a person has checked it.

---

## Running it

You need Node 24 or later.

```bash
npm install
npm run dev          # http://localhost:5173 (add -- --host to try it on a phone on the same Wi-Fi)
npm test             # unit tests (Vitest)
npm run e2e          # mobile smoke tests and accessibility checks (Playwright; builds first)
npm run build        # type-check app and Worker, then build to dist/
npx wrangler dev     # the built app plus the suggestions API and a local database, on :8787
```

On the dev server, `/review` opens without a password, and marking an item reviewed edits its source file. `/debug` is a formula explorer.

## Project layout

```
src/
  app/        shell, routes, theme, branding
  engine/     units and dimensions, formulas, numerical solver, question templates,
              answer checking, symbolic algebra and mechanism derivations
  data/       content: reagents (JSON), "Will it react?" items, question templates,
              mechanisms (TS), Book pages (MDX)
  features/   screens: home, calc, mechanisms, reagents, book, progress, feedback, review
  storage/    IndexedDB (Dexie), spaced repetition, export/import
  ui/         shared components: feed, sheets, KaTeX, structures, Rad, tutorial
worker/       Cloudflare Worker: suggestions API (D1) and owner password check
scripts/      dev-only write-back used by review mode
tests/        unit tests          e2e/  Playwright smoke and accessibility tests
```

## Stack

- **App:** Vite, React and TypeScript, styled with Tailwind CSS.
- **Offline:** an installable PWA (vite-plugin-pwa / Workbox).
- **Storage:** IndexedDB via Dexie.
- **Maths and structures:** KaTeX for maths, SmilesDrawer for structures, MDX for the Book.
- **Data checks:** zod validates every data file.
- **Tests:** Vitest for units, Playwright and axe for browser and accessibility checks.
- **Hosting:** a Cloudflare Worker serves the static assets, plus a small API with a D1 database for suggestions.

## Adding content

All content lives in data files, separate from the UI. You can add a question, reagent, mechanism or Book page without touching a component. **[CONTENT.md](CONTENT.md)** documents every format with a worked example.

The tests check that every data file is valid, every question generates sensible instances, and every formula and SMILES string works. They **cannot** check that the chemistry is right: that is what review mode is for.

## Deploying

See **[DEPLOY.md](DEPLOY.md)**. It covers Cloudflare (connect the GitHub repo; every push to `main` deploys), the custom domain, the suggestions database and the owner password.

## Privacy

There are no accounts, analytics or cookies. Progress stays in the user's browser and leaves only through their own export. The only thing stored on a server is a suggestion someone chooses to send: its type, the message, an optional name, and the page it was sent from.

---

*UnoffIChO is an unofficial, independent study resource. Not affiliated with or endorsed by the International Chemistry Olympiad or its organisers.*

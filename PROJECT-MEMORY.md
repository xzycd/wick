# PROJECT MEMORY — Wick

> **This file is the living memory of the project.** It is meant to be re-read at the
> start of any work session and updated at the end of one. It is not marketing copy and
> not a spec — it records *what is actually true right now*, *what's missing*, and
> *whether this thing can win*. If reality and this file disagree, fix this file.

**Last verified:** 2026-11-18 (frozen) · **App version:** 1.0.0 · **Verified by:** Claude (ran tests + build; drove the app in a browser — home, settings, add-sheet, both themes)

---

## Update protocol (how this file stays honest)

At the end of a working session, whoever (human or AI) touched the project updates the
sections below and bumps **Last verified**. Rules:

1. **Only write verified facts.** "Tests pass" means you ran them today. "Feature works"
   means you clicked it in the running app. Mark anything unconfirmed as `⚠️ unverified`.
2. **Date every claim that can rot** — market data, competitor pricing, test status.
3. **Never delete the Changelog.** Append. It's the audit trail.
4. **Keep it scannable.** Tables and bullets over prose. (This project already over-indexes
   on beautiful long-form text — the memory file should not.)
5. When a Gap is closed, move it from **Gaps** to **Changelog** with the date.

---

## 1. What Wick is (one breath)

A privacy-first PWA that tracks free trials, subscriptions, and small recurring charges so
none land by surprise. The metaphor is the whole product: **every charge is a taper candle,
the wax remaining = time remaining, the one landing soonest carries a live flame.** No
accounts, no backend, no bank linking, no analytics — everything lives in the browser's
`localStorage`.

- **Category:** manual subscription tracker (privacy-first branch of the market).
- **Platform:** web / installable PWA, mobile-first (max 430px column). No native app, no store listing.
- **Business model today:** none. No pricing, no paywall, no revenue path wired in.

## 2. Verified current state (2026-07-09)

| Thing | Status | Note |
|---|---|---|
| `npm test` | ✅ 54/54 passing | dates, money, ics, store, **format, notify** — pure logic genuinely tested |
| a11y | ✅ improved | add/edit sheet is a real focus-trapped dialog (Esc + focus restore); muted text now clears WCAG AA |
| PWA | ✅ hardened | maskable + apple-touch icons, iOS meta, pre-paint theme (no flash), precache + SWR service worker |
| `npm run dev` | ✅ runs | Vite; port via `PORT` env or 5180 |
| Empty state | ✅ works | "The mantel is clear." + Add / load-examples |
| Home (populated) | ✅ works | hero countdown + flame, grouped ledger rows, 30-day total |
| Detail | ✅ works | plan selector (keep/undecided/cancel), add-to-calendar, cancel-help, snuff |
| Settings | ✅ works | Reclaimed tally, theme, currency (9), calendar export, backup/restore |
| Candle metaphor | ✅ genuinely distinctive | wax gauge + live flame is the memorable thing, and it lands |
| Build artifact | `dist/` present | PWA service worker (network-first) shipped |

**Codebase is small and clean:** ~2,500 LOC, React 18 + Vite + TS, **zero runtime deps beyond React**,
no router, no state library. Pure logic (`dates`, `money`, `ics`, `store`) is unit-tested.

## 3. Architecture map (where things live)

| Path | Role |
|---|---|
| `src/App.tsx` | screen state machine (home/detail/edit/settings), no router |
| `src/types.ts` | data model — `Charge`, `Reclaimed`, `Settings` (see below) |
| `src/lib/dates.ts` | renewal math, month-end clamp, no drift — **tested** |
| `src/lib/money.ts` | annualization + reclaimed-savings math — **tested** |
| `src/lib/ics.ts` | RFC 5545 writer (RRULE, VALARM, CRLF, 75-octet fold) — **tested** |
| `src/lib/store.ts` | localStorage load/save + JSON backup/restore — **tested** |
| `src/lib/notify.ts` | reminder-window logic + Notification API glue |
| `src/data/presets.ts` | quick-pick services; **original wax-seal marks, no real logos** |
| `src/components/` | Home, Detail, EditSheet, Settings, Candle, Seal, CountUp, Empty |
| `DESIGN-DNA.md` | **locked** visual direction — read before touching any styling |
| `public/sw.js` | offline service worker |

**Data model:** a `Charge` carries `amountCents`, `cadence` (weekly/monthly/yearly/once),
`anchor` (ISO date, next occurrence derived from it), `isTrial`, `stance`, `note`,
`cancelUrl`, `remindDaysBefore`. Snuffing moves it to a `Reclaimed` record. Dates are ISO
strings pinned to local noon so day-counts don't shift across DST.

**The clever architectural bet:** with no backend you can't push a notification to a phone
that hasn't opened the app, so Wick hands each renewal to the **OS calendar** as a recurring
event with an alarm. That's the only reliable "reaches you when the app is closed" reminder
a zero-backend app can offer. It's honest and it's smart — but see Gap #1.

## 4. Market position (checked live 2026-07-09)

**The problem is real.** Avg US consumer ≈ 8.2 active subscriptions, ~$219/mo actual vs ~$86
*perceived* — a ~2.5× blindness gap. That's why this category exists and keeps spawning apps.

**The category is crowded and splits in two:**

| Branch | Players | How they win | Willingness to pay |
|---|---|---|---|
| **Bank-linked / automation** | Rocket Money, Hiatus, Emma, YNAB | auto-detect subs from transactions; bill negotiation | **High** — Rocket Money charges **$7–14/mo** because it *does the work for you* |
| **Manual / privacy-first** (Wick's branch) | Bobby, Subby, ReSubs, Tilla, TrackAllSubs, LowerMySubs | clean UI, you enter data, private on-device | **Very low** — Bobby's ceiling is a **$1.99 one-time** IAP; Tilla **$2.99 lifetime**; several are free |

**Hard truths this positions Wick against:**
- The money in this category is on the side Wick philosophically refuses to join (bank linking / auto-detect). The highest-value feature — "find subscriptions I forgot about" — is *impossible* without the data access Wick rejects.
- The privacy-first branch is where Wick lives, and that branch has a **near-zero price ceiling.** Bobby, arguably the design leader here, tops out at $1.99 once. That is Wick's realistic monetization ceiling too.
- Wick is a **PWA with no App Store presence.** Every named competitor is a store-listed native app with reviews, ranking, and install trust. "Add to home screen" (esp. iOS) is real friction and invisible to app-store discovery.

## 5. Honest gaps (incl. the owner's critique — all fair)

Owner's read: *"too much text, not very interactive, hard setup, not much functionality."*
Assessed against the running app and the market — **each is at least partly correct.**

1. **⚠️ Reminders are the weakest link.** In-app nudges only fire when you open the app;
   real reminders depend on the user manually exporting to their calendar. That's a friction
   step most users won't take, and it's the app's core job. This is the #1 product risk.
2. **Setup friction (owner: "hard setup").** Manual entry only. No auto-detect, no
   email/screenshot import. The 20-second quick-add helps, but the user must already *know*
   each renewal date — the exact thing they're bad at. PWA install adds a second friction layer.
3. **Low interactivity / retention risk (owner: "not very interactive").** By design it's a
   calm utility: list + detail + settings, one signature animation. A subscription tracker is
   inherently low-frequency; with nothing to pull you back, it risks being opened once and
   forgotten. There's no widget, no push, no periodic "here's what's coming" surface.
4. **Thin functionality vs. competitors (owner: "not much functionality").** Missing what
   the category now treats as table stakes: home-screen widgets, working background
   notifications, spending analytics/insights, shared/household plans, cancel-guide library,
   CSV/import. Wick's minimalism is a deliberate brand choice, but the feature floor has risen.
5. **Text-heavy voice.** The literary copy ("The mantel is clear", "You haven't decided on
   this one yet") is a genuine brand asset, but onboarding + docs skew wordy. Fine for a
   design piece; a cost for a mass-market utility where users skim.
6. **No monetization mechanism at all.** No paywall, no pricing, no analytics to even learn
   what's used. Can't be a business without one, and can't be *sold* without revenue (§6).

## 6. Can it succeed / be sold? — verdict (2026-07-09)

**As a portfolio / craft piece: strong. As a standalone business or a sellable asset: weak — as currently built.**

- **Succeed (usage/traction):** Possible only as a *niche design-led darling* — the "Bobby
  but even more beautiful / more private" pick for a small aesthetic-driven audience. It will
  not out-compete Rocket Money's automation or the free/near-free manual crowd on features or
  price. Its one true edge is **taste** (the candle metaphor is genuinely differentiated and
  memorable), plus airtight privacy.
- **Sold (as an asset):** Micro-SaaS/app sales price on **revenue**, not code — roughly
  **2.5–4× ARR** or **4–6× SDE** (Acquire.com / Flippa, 2026). Wick has **$0 revenue, no users,
  no store presence, no defensible IP** (2,500 lines any dev could rebuild). Its asset value
  today is therefore ~**$0**; what's valuable is the *brand + design system*, not the software.
  To be sellable it needs, in order: a store listing → a monetization path → real users →
  revenue history. Only then does a multiple attach to anything.

**Bottom line:** the product is *beautifully executed* and the underlying problem is *real*,
but it's parked in the branch of the market with the lowest willingness to pay, missing the
feature (auto-detect) that commands the high prices, and has no path to money or distribution
wired in. Great as a showcase / launch of a personal brand; a hard sell as a business.

## 7. If the goal is to make it viable — highest-leverage moves

Ordered by impact-to-effort. None require abandoning the privacy stance.

1. **Fix the reminder (Gap #1).** Ship real reminders that don't depend on manual calendar
   export — e.g. PWA `Notification` + periodic background sync where supported, and make the
   calendar hand-off one automatic tap on add. This is the core job; make it actually work.
2. **Kill setup friction.** Add paste/import (a list, a screenshot via OCR, or an email
   forward) so the user isn't hand-typing renewal dates they don't remember.
3. **Pick a lane on distribution.** Either wrap as a real App Store / Play listing (trust +
   discovery + reviews) or accept it's a web-first indie piece and lean fully into that.
4. **Choose a monetization ceiling honestly.** In this branch that's a small one-time /
   lifetime unlock (Bobby = $1.99, Tilla = $2.99), not a recurring SaaS. Price accordingly.
5. **Add one retention surface.** A widget or a weekly "coming up" digest — one reason to
   return, without betraying the calm design.
6. **Lean into the only moat: taste.** The candle system is the differentiator. Market it as
   *the* beautiful, private subscription tracker; that's a defensible identity even if the
   feature set stays lean.

## 8. Open decisions (owner to resolve)

- Is this a **business**, a **portfolio piece**, or a **flippable asset**? The three imply
  very different next steps and this file's roadmap should follow that answer.
- Privacy purity vs. auto-detect: is the no-bank-linking stance a hard principle or a
  starting position? (It's simultaneously the brand and the commercial ceiling.)
- Web PWA vs. native store presence.

---

## Changelog

- **2026-11-18** — **Frozen (legacy mode).** Market re-check: iOS 27 Wallet added a free
  Recurring view (Apple Card only), Rocket Money gives tracking away free and sells a $15/mo
  Premium+ tier, the no-bank niche now has 10+ trackers including a free PWA (SubTracker), and
  the only indie revenue figures found were ~$100–255 total. Three-judge review: LEGACY, 3/3.
  `npm test` 54/54, `npm run build` clean. Put on GitHub with an animated wordmark banner
  (`.github/banner.svg`, Fraunces glyphs as paths). From here: security fixes only.
  **Reopen review 2027-05-18**, only if an indie no-bank tracker shows $1k+ MRR or someone
  offers $1,500+. If reopened, the one allowed bet: Capacitor iOS wrap with native local
  notifications and a widget, $2.99 one-time, capped at 60h/$99, killed at <40 sales by day 30.

- **2026-07-12** — **Quality/craft pass (design + code), no product-strategy changes.** Scope was
  deliberately *tightening*, not new features; the big §7 moves (real background reminders, import,
  distribution, monetization) remain open. What landed, all verified:
  - **Accessibility.** The add/edit sheet is now a proper modal: focus moves in on open (without
    popping the mobile keyboard), Tab is trapped, Escape closes, focus returns to the trigger.
    Light `--muted` darkened #8A7A66 → **#726552** (same hue) so 11–14px caption/label text clears
    **WCAG AA** (was 3.6:1, now 4.9:1 on base / 4.6:1 on surface). Confirmed live in-browser.
  - **PWA hardening.** Manifest gained `id`/`scope`/`lang`/`orientation`/`categories`, a **maskable**
    SVG icon + a generated **apple-touch-icon.png** (180, iOS ignores SVG), and iOS `apple-mobile-web-app-*`
    meta. Service worker rewritten: **precache shell + cache-first for hashed `/assets` + stale-while-revalidate**
    (was blanket network-first). A pre-paint inline script applies the saved/system theme and syncs the
    status-bar `theme-color`, killing the old flash-of-light-theme for dark users.
  - **Correctness.** `today` now refreshes on focus/visibility so a mantel left open past midnight
    re-counts and re-opens the reminder window; currency singleton set via `useMemo` not a raw render
    side-effect; snuff copy de-duplicated onto the shared `cadencePerYear`.
  - **Tests 37 → 54.** New `format.test.ts` + `notify.test.ts` cover the previously-untested pure logic
    (countdown/price copy, reminder windowing + dedup, trial-wording guard); added `totalYearly`.
  - **Surfaced dead-but-tested logic.** `totalMonthly` was exported + tested but never rendered — now a
    calm Settings line: "carrying $X/mo across N charges — about $Y/yr" (within the DNA's one-quiet-line
    rule, no dashboard). Verified: $84.98/mo · $1,019.76/yr on the example mantel.
  - Bundle essentially unchanged (58.5 kB gzip JS); still zero runtime deps beyond React.

- **2026-07-09** — File created. Verified: app runs (empty/home/detail/settings all work),
  `npm test` 37/37 green, ~2,500 LOC, zero non-React deps. Ran live market check
  (Rocket Money, Bobby, Subby, ReSubs, Tilla; 2026 pricing + micro-SaaS valuation multiples).
  Recorded market position (§4), gaps (§5, incl. owner critique), success/sale verdict (§6),
  and leverage moves (§7). Also set `vite.config.ts` server port to honor `PORT` env and
  `autoPort: true` in `.claude/launch.json` (was hardcoded 5180, colliding with a second dev server).

<p align="center"><img src=".github/banner.svg" alt="Wick" width="100%"></p>

Wick tracks free trials, subscriptions and small recurring charges so none of
them land by surprise. Each charge is a taper candle. The wax left is the time
left, and anything due within three days burns with a small flame.

There are no accounts, no backend, no sync, no analytics and no bank linking.
Your data stays in your browser's local storage.

> Frozen in November 2026. Wick is finished and works, but it gets security
> fixes only, no new features.

## Run it

```sh
npm install
npm run dev      # http://localhost:5180
npm test         # date-math tests (Vitest)
npm run build    # typecheck + production build
```

Best experienced at phone width — it's a mobile-first PWA (add to home
screen from the browser menu).

## What it does

- **Home** — the next charge as a giant day-count beside a burning taper,
  then the rest of the mantel as ledger rows, grouped by whether you've
  decided what to do about them. One quiet line totals the next 30 days.
- **Add in under 20 seconds** — quick-pick seals for common services prefill
  name, price, cadence, category, and cancel link; you just confirm the date.
- **Detail** — renewal date, price, note to self, a plan selector
  (keep / undecided / cancel), a cancel-help action, and an add-to-calendar
  button.
- **Reclaimed** — snuffing a charge is undoable *and* it's tallied: Settings
  shows the honest annualized total you've stopped paying, counting up. Real
  numbers only — recurring items annualized, one-offs at face value. Beneath it,
  a quiet line shows what you're still carrying: the monthly and yearly total
  across your active subscriptions.
- **Reminders, done two ways** — Wick nudges you in-app when you open it
  (system notification if allowed). For a reminder that reaches you with the
  app closed, export to your phone's **calendar** (a proper RFC 5545 `.ics`
  with a recurrence rule and an alarm) — the OS handles it, no account.
- **Calendar / backup / restore** — export one charge or all to `.ics`;
  back up everything to a JSON file and restore it on another device.
- **Multi-currency** — USD, EUR, GBP, CAD, AUD, JPY (zero-decimal), INR,
  BRL, MXN.
- **Search, sort, and category filters** once your list grows past a handful.
- **Installable & offline** — installs to the home screen (maskable + Apple
  touch icons, iOS standalone, theme-matched status bar) and works offline: the
  service worker precaches the app shell, serves hashed build assets cache-first,
  and revalidates everything else in the background.
- **Trials** — tracked by end date, with the price that lands *if you
  forget* front and center.

## How it's built

Vite + React + TypeScript, no router, no state library. The pieces:

| Path | What it is |
|---|---|
| `src/lib/dates.ts` | Deterministic renewal math (month-end clamping, no drift) — tested |
| `src/lib/money.ts` | Annualization + reclaimed-savings math — tested |
| `src/lib/ics.ts` | RFC 5545 calendar writer (CRLF, 75-octet folding, RRULE, VALARM) — tested |
| `src/lib/notify.ts` | Pure reminder-window logic + Notification API glue |
| `src/lib/store.ts` | localStorage load/save + backup/restore — tested |
| `src/lib/files.ts` | Browser download / file-picker helpers |
| `src/data/presets.ts` | Quick-pick services with original wax-seal marks (no official logos) |
| `src/components/` | Home, Detail, EditSheet, Settings, Candle, Seal, CountUp, Empty |
| `public/sw.js` | Offline service worker (precache shell · cache-first hashed assets · stale-while-revalidate) |
| `DESIGN-DNA.md` | The locked visual direction — read it before changing any styling |

The calendar route is the interesting bit: with no backend you can't push a
notification to a phone that hasn't opened the app, so Wick hands each renewal
to the OS calendar as an all-day recurring event with a relative alarm. That's
a real, reliable reminder that costs nothing and leaks nothing.

Dates are ISO `yyyy-mm-dd` strings pinned to local noon, so day counts never
shift across DST. A Jan 31 monthly charge lands Feb 28 and returns to
Mar 31 — occurrences derive from the anchor date, so there's no drift.

Honest limitation: reminders fire when the app is opened (and as system
notifications if permitted). Without a backend there is no push while the
app has never been opened — Wick trades that for total privacy.

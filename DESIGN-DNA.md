# DESIGN DNA — Wick

## North star
Wick is a candlelit ledger for money that's about to leave. Every trial and
subscription is a taper candle: the wax remaining is the time remaining, and
the one landing soonest carries a small live flame. The whole app feels like a
quiet night room — paper, wax, ink, one ember. It rejects dashboards, cards,
charts, progress rings, purple gradients, glassmorphism, and anything that
smells like a SaaS template.

## Typography
Display: Fraunces (variable, optical sizing) — 500–640 weight, tight tracking
on the giant countdown numeral; real italics for asides ("days", "then").
Body: Karla — 400/500/700, 15–16px, line-height 1.5, tracked caps for labels.
Scale: numeral clamp(64px, 26vw, 104px) · h1 28 · row 16 · caption 13 · label 11 caps +0.12em.
Prices always `font-variant-numeric: tabular-nums`.

## Color
A neutral room so the flame is the only warm thing in it (the old warm-bone
and espresso browns were dropped on 2026-11-18).
Light: base #F6F5F2 (soft paper) · surface #EEEDE9 · ink #16171A ·
muted #66655F (clears WCAG AA on base and surface for 11–14px captions) ·
hairline color-mix(ink 12%).
Dark: base #0D0E11 (charcoal night) · surface #15171B · ink #ECE8E1 ·
muted #8E8B85.
ONE accent: ember #B85419 (light) / #E8893D (dark). Ember is the flame — it
marks urgency and nothing else. Candle light in light mode is a pale amber
(#F3A95C) so glows never read as brown. Destructive actions use oxide,
functional only. No pure black/white anywhere.

## Space & shape
Phone: single column, max 430px (560px from 640px wide). Desktop (1024px+):
ledger pane on the left (360–420px), a stage on the right holding the open
charge with a large candle; the add/edit sheet becomes a centered dialog.
Keyboard: n adds, / searches, ↑/↓ (or j/k) move through the ledger, Esc
returns home. Phone column: generous side gutter (20px). Rows divided by
hairlines, never boxed. Vertical rhythm varies: hero is airy, list is snug.
Spacing scale: 4/8/12/16/24/36/56. Radius system: soft — 14px fields,
20px sheets, pill buttons/chips. No sharp corners, no mixed radii.

## Materials & atmosphere
Paper grain: faint SVG turbulence overlay on the base (2–3% opacity).
Wax: candle gauges get a soft inner highlight, like a dipped taper.
Shadows: warm-tinted (ink at low alpha), only on the floating sheet and flame
glow. No gray drop shadows, no blur-glass.

## Motion
Ease: cubic-bezier(.32,.72,.28,1), 240–420ms. ONE orchestrated moment: on
load, ledger rows rise in with a 40ms stagger while the hero flame lights
(scale from 0 at the wick). Flame idles with a 3s flicker loop. Everything
honors prefers-reduced-motion (flame becomes static, rows just appear).

## Signature move
The candle countdown: wax height = fraction of billing cycle remaining, and
the giant Fraunces day-numeral beside a tall taper in the hero. The hero and
desktop-stage candle always burn: a calm, smaller flame when the charge is
far off, a taller, quicker one with a wider halo within 3 days. Ledger rows
stay unlit until 3 days out, so ember in the list still means urgency; the
selected row is marked in ink, never ember. The
burning candle has a melt pool, a wax run with a bead that slides now and
then, and a glowing wick tip; flame motion layers sway and flicker on
unrelated durations so it never visibly loops. Guard it — nothing else may
compete for "the memorable thing."

## Feel (serotonin layer)
This is a serotonin-lean context: calm, reassuring, zero gimmicks. NO
confetti, count-ups, or celebratory sound — they'd fail the 50th-visit test.
Rules: every interactive element gives feedback ≤150ms (press = scale
0.9–0.98 with a gentle spring, --ease-spring); one earned reward only — the
candle guttering out with a rising smoke wisp when a charge is snuffed;
snuffing is undoable (7s toast) because deleting money data is irreversible;
a single light haptic on primary actions (add, snuff, decide). All motion
sits behind prefers-reduced-motion; the snuff skips straight to deletion when
motion is reduced. Only transform/opacity/color are animated.

## Voice
Calm, warm, a little literary; candle-flavored but never cutesy. "Burning
low", "Lands today", "The mantel is clear." When something is canceled:
"Snuffed. That's $11.99 a month back." No exclamation marks, no "Elevate/
Seamless/Supercharge", no finance-bro copy.

## Reward (dopamine layer — honest only)
Finance context = minimal push, trust over arousal. The ONE honest reward is
Reclaimed: real annualized money you've stopped paying, shown as a big ember
Fraunces figure that tallies up on the Settings screen (respects reduced
motion). No fake scarcity, no fake countdowns (the renewal dates are real),
no confirmshaming, no streak-shaming. The candle countdown stays the single
signature; Reclaimed is a secondary, quieter reward the user seeks out.

## Feature surface (v1.1)
Reclaimed savings ledger · calendar (.ics) export per-charge and all — the
reliable no-backend reminder · JSON backup/restore · multi-currency · search
+ sort + category filters (appear past 4 charges) · offline PWA service
worker · Settings screen. Core logic (dates, money, ics, backup) is pure and
unit-tested.

## Banned in this project
The discarded autopilot: white screen, purple accents, rounded subscription
cards with progress rings, Inter, floating "+" FAB, total-spend dashboard.
Also banned: charts, rings/donuts, badges in traffic-light colors, gradient
buttons, glass panels, confetti, Inter/Roboto/Arial/Helvetica/system-ui/
Space Grotesk, more than one accent color, fake official brand logos
(service marks are original wax-seal monograms only).

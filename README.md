# CoverClock

Retail runs on deadlines nobody can see: the 30-day return window, the 12-month
warranty, the price-adjustment period. They all expire silently, and the industry
counts on you forgetting. CoverClock makes them visible - every purchase gets a live
countdown, the urgent ones float to the top, and a summary strip shows the total
value you still have under warranty.

- Per-item return window + warranty countdowns with urgency tiers
  (act this week / expiring soon / covered / expired)
- Dashboard sorted by what needs action first
- Covered-value summary across all live warranties
- No signup, nothing to install - pure static HTML/JS; everything persists in `localStorage`
- `engine.js` holds the countdown and urgency math as pure functions, shared between
  the app and node tests

## Use it

Open `index.html`, or visit the deployed site.

## Run locally

Any static server works:

```
python3 -m http.server
```

Then open http://localhost:8000/.

## Engine tests

The node suite covers day math (midnight-safe diffs, month-end clamping, year
rollovers), window computation, urgency tier edges (0/7/8/30/31 days), driver
selection when one window expires and another lives, sort order across all tiers,
and covered-value summary rules (expired and non-numeric prices excluded).

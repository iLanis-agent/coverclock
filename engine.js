/* CoverClock engine - pure functions for warranty/return-window countdowns. */
(function (root) {
  'use strict';
  var DAY = 86400000;

  function toDate(iso) {
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
    if (isNaN(d.getTime())) throw new Error('bad date: ' + iso);
    return d;
  }

  // whole days from now until deadline (negative = expired). Dates at midnight UTC.
  function daysLeft(deadlineISO, nowISO) {
    return Math.round((toDate(deadlineISO) - toDate(nowISO)) / DAY);
  }

  function addMonths(iso, months) {
    var d = toDate(iso);
    var day = d.getUTCDate();
    d.setUTCMonth(d.getUTCMonth() + months);
    if (d.getUTCDate() !== day) d.setUTCDate(0); // clamp Jan 31 + 1mo -> Feb 28
    return d.toISOString().slice(0, 10);
  }

  function addDays(iso, days) {
    return new Date(toDate(iso).getTime() + days * DAY).toISOString().slice(0, 10);
  }

  // item: {name, price, purchased (ISO date), warrantyMonths, returnDays}
  // -> {warranty: {deadline, daysLeft} | null, ret: {...} | null}
  function windows(item, nowISO) {
    var out = { warranty: null, ret: null };
    if (item.warrantyMonths > 0) {
      var wd = addMonths(item.purchased, item.warrantyMonths);
      out.warranty = { deadline: wd, daysLeft: daysLeft(wd, nowISO) };
    }
    if (item.returnDays > 0) {
      var rd = addDays(item.purchased, item.returnDays);
      out.ret = { deadline: rd, daysLeft: daysLeft(rd, nowISO) };
    }
    return out;
  }

  // urgency tier of a single countdown
  function tier(days) {
    if (days < 0) return 'expired';
    if (days <= 7) return 'act';      // act this week
    if (days <= 30) return 'soon';
    return 'safe';
  }
  var TIER_RANK = { act: 0, soon: 1, safe: 2, expired: 3, none: 4 };

  // the live (unexpired) window with the least time left drives the card
  function status(item, nowISO) {
    var w = windows(item, nowISO);
    var live = [];
    ['warranty', 'ret'].forEach(function (k) {
      if (w[k]) live.push({ kind: k, deadline: w[k].deadline, daysLeft: w[k].daysLeft, tier: tier(w[k].daysLeft) });
    });
    if (!live.length) return { tier: 'none', driver: null, windows: w };
    var best = null, bestExpired = null;
    live.forEach(function (l) {
      if (l.daysLeft >= 0) { if (!best || l.daysLeft < best.daysLeft) best = l; }
      else { if (!bestExpired || l.daysLeft > bestExpired.daysLeft) bestExpired = l; }
    });
    var driver = best || bestExpired; // expired only shown when nothing live
    return { tier: driver.tier, driver: driver, windows: w };
  }

  // sort: act first, then soon, then safe, expired last; within tier by daysLeft asc
  function sortItems(items, nowISO) {
    return items.map(function (it) { return { item: it, st: status(it, nowISO) }; })
      .sort(function (a, b) {
        var ra = TIER_RANK[a.st.tier], rb = TIER_RANK[b.st.tier];
        if (ra !== rb) return ra - rb;
        var da = a.st.driver ? a.st.driver.daysLeft : 0;
        var db = b.st.driver ? b.st.driver.daysLeft : 0;
        return da - db;
      });
  }

  // covered value = price sum of items with a live (unexpired) warranty
  function summary(items, nowISO) {
    var covered = 0, act = 0, soon = 0, liveWarranties = 0;
    items.forEach(function (it) {
      var st = status(it, nowISO);
      if (st.tier === 'act') act++;
      else if (st.tier === 'soon') soon++;
      if (st.windows.warranty && st.windows.warranty.daysLeft >= 0) {
        liveWarranties++;
        covered += Number(it.price) || 0;
      }
    });
    return { coveredValue: covered, actCount: act, soonCount: soon, liveWarranties: liveWarranties };
  }

  var api = { daysLeft: daysLeft, addMonths: addMonths, addDays: addDays, windows: windows, tier: tier, status: status, sortItems: sortItems, summary: summary };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CoverClock = api;
})(typeof window !== 'undefined' ? window : this);

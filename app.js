"use strict";
(function () {
  const data = window.LEDGER || { accounts: [], payouts: [] };
  const accounts = Array.isArray(data.accounts) ? data.accounts : [];
  const payouts = Array.isArray(data.payouts) ? data.payouts : [];
  const STATUS = {
    eval: ["Челлендж", "eval"], funded: ["Фандед", "funded"],
    blown_eval: ["Слит · челлендж", "blown"], blown_funded: ["Слит · фандед", "blown"],
    unknown: ["Статус ?", "unknown"],
  };
  const $ = (id) => document.getElementById(id);
  const has = (v) => v !== null && v !== undefined && v !== "" && !isNaN(Number(v));
  const ok = (n) => Number.isFinite(n);
  const money = (v) => { const n = Math.round(Number(v) || 0); return (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US"); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => (d ? String(d).split("-").reverse().join(".") : "—");
  const fx = Object.assign({}, data.fx || {}, { USD: 1 });
  const SYM = { USD: "$", EUR: "€", GBP: "£" };
  const cur = (c) => String(c || "USD").toUpperCase();
  const toUsd = (v, c) => (has(v) && has(fx[cur(c)]) ? Number(v) * Number(fx[cur(c)]) : NaN);
  const priceUsd = (a) => toUsd(a.price, a.currency);
  const payUsd = (p) => toUsd(p.amount, p.currency);
  const orig = (v, c) => (SYM[cur(c)] || cur(c) + " ") + Math.round(Number(v)).toLocaleString("en-US");
  const amountCell = (v, c) => {
    if (!has(v)) return '<span class="missing">не внесено</span>';
    if (cur(c) === "USD") return esc(money(v));
    const u = toUsd(v, c);
    return esc(orig(v, c)) + (ok(u) ? ` <span class="conv">≈ ${esc(money(u))}</span>` : "");
  };
  const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
  const accLabel = (a) => (a ? a.firm + (has(a.size) ? ` ${a.size}K` : "") : "—");
  const fundedish = (s) => s === "funded" || s === "blown_funded";

  const spent = accounts.reduce((s, a) => s + (ok(priceUsd(a)) ? priceUsd(a) : 0), 0);
  const paid = payouts.reduce((s, p) => s + (ok(payUsd(p)) ? payUsd(p) : 0), 0);
  const net = paid - spent;
  const missingPrice = accounts.filter((a) => !has(a.price)).length;
  const unknownStatus = accounts.filter((a) => !STATUS[a.status] || a.status === "unknown").length;
  const funded = accounts.filter((a) => fundedish(a.status)).length;
  const blown = accounts.filter((a) => String(a.status).startsWith("blown")).length;
  const paidAcc = new Set(payouts.map((p) => p.account).filter((id) => byId[id])).size;

  if (data.updated) $("updated").textContent = "Обновлено " + fmtDate(data.updated);

  // hero
  const netEl = $("net");
  netEl.textContent = money(net);
  netEl.classList.add(net > 0 ? "pos" : net < 0 ? "neg" : "num");
  const notes = [];
  if (missingPrice) notes.push(`у ${missingPrice} акк. не внесена цена`);
  if (unknownStatus) notes.push(`у ${unknownStatus} акк. не указан статус`);
  $("lead").textContent = `Потрачено ${money(spent)}, пришло ${money(paid)}` +
    (spent ? `, ROI ${net >= 0 ? "+" : ""}${((net / spent) * 100).toFixed(0)}%.` : ".") +
    (notes.length ? " " + notes.join(", ").replace(/^./, (c) => c.toUpperCase()) + "." : "");
  const chips = [
    ["Аккаунтов", accounts.length], ["Дошли до фандеда", funded],
    ["С выплатой", paidAcc], ["Слито", blown],
  ];
  $("chips").innerHTML = chips.map(([l, v]) => `<span class="chip">${esc(l)} <b class="num">${esc(v)}</b></span>`).join("");
  $("paid").textContent = money(paid);
  $("paid-sub").textContent = `Выплат: ${payouts.length}`;
  const byDateDesc = (x, y) => String(y.date || "").localeCompare(String(x.date || ""));
  const recent = [...payouts].sort(byDateDesc).slice(0, 3);
  $("last-payouts").innerHTML = recent.length
    ? recent.map((p) => `<div class="hc-row"><span>${esc(accLabel(byId[p.account]))}${p.date ? " · " + esc(fmtDate(p.date)) : ""}</span><span class="num">${ok(payUsd(p)) ? esc(money(payUsd(p))) : "?"}</span></div>`).join("")
    : `<div class="hc-empty">Выплаты появятся здесь, когда будут внесены.</div>`;

  // accounts
  const paidBy = {};
  payouts.forEach((p) => { if (ok(payUsd(p))) paidBy[p.account] = (paidBy[p.account] || 0) + payUsd(p); });
  const order = { funded: 0, eval: 1, unknown: 2, blown_funded: 3, blown_eval: 4 };
  const accSorted = [...accounts].sort((x, y) =>
    (order[x.status] ?? 9) - (order[y.status] ?? 9) || String(y.purchased || "").localeCompare(String(x.purchased || "")));
  $("acc-table").innerHTML = accSorted.length
    ? `<table><thead><tr><th>Фирма</th><th>Рынок</th><th class="r">Размер</th><th>Программа</th><th>Куплен</th><th class="r">Цена</th><th class="r">Выплачено</th><th>Статус</th></tr></thead><tbody>${accSorted.map((a) => {
        const st = STATUS[a.status] || STATUS.unknown;
        const fut = a.market === "Futures";
        return `<tr><td class="firm">${esc(a.firm)}${a.note ? `<span class="sub">${esc(a.note)}</span>` : ""}</td><td><span class="pill ${fut ? "fut" : "cfd"}">${fut ? "Фьючи" : "CFD"}</span></td><td class="r num">${has(a.size) ? esc(a.size) + "K" : "—"}</td><td class="soft">${esc(a.program) || "—"}</td><td class="num soft">${esc(fmtDate(a.purchased))}</td><td class="r num">${amountCell(a.price, a.currency)}</td><td class="r num ${paidBy[a.id] ? "pos" : "soft"}">${paidBy[a.id] ? esc(money(paidBy[a.id])) : "—"}</td><td><span class="pill ${st[1]}">${esc(st[0])}</span></td></tr>`;
      }).join("")}</tbody></table>`
    : `<div class="empty">Аккаунтов пока нет.</div>`;

  // payouts
  const paySorted = [...payouts].sort(byDateDesc);
  $("pay-table").innerHTML = paySorted.length
    ? `<table><thead><tr><th>Дата</th><th>Аккаунт</th><th class="r">Сумма</th><th>Заметка</th></tr></thead><tbody>${paySorted.map((p) =>
        `<tr><td class="num soft">${esc(fmtDate(p.date))}</td><td class="firm">${esc(accLabel(byId[p.account]))}</td><td class="r num pos">${amountCell(p.amount, p.currency)}</td><td class="soft">${esc(p.note) || "—"}</td></tr>`).join("")}</tbody></table>`
    : `<div class="empty">Выплат пока не внесено.</div>`;

  // firms
  const firms = {};
  accounts.forEach((a) => { const f = firms[a.firm] || (firms[a.firm] = { n: 0, spent: 0, paid: 0, funded: 0 }); f.n++; if (ok(priceUsd(a))) f.spent += priceUsd(a); if (fundedish(a.status)) f.funded++; });
  payouts.forEach((p) => { const a = byId[p.account]; if (a && ok(payUsd(p))) firms[a.firm].paid += payUsd(p); });
  const fr = Object.entries(firms).sort((x, y) => (y[1].paid - y[1].spent) - (x[1].paid - x[1].spent));
  $("firms").innerHTML = fr.length
    ? `<table><thead><tr><th>Фирма</th><th class="r">Аккаунтов</th><th class="r">Дошли до фандеда</th><th class="r">Потрачено</th><th class="r">Выплаты</th><th class="r">Итог</th></tr></thead><tbody>${fr.map(([name, f]) => {
        const n = f.paid - f.spent;
        return `<tr><td class="firm">${esc(name)}</td><td class="r num">${f.n}</td><td class="r num">${f.funded}</td><td class="r num">${esc(money(f.spent))}</td><td class="r num">${f.paid ? esc(money(f.paid)) : "—"}</td><td class="r num ${n > 0 ? "pos" : n < 0 ? "neg" : ""}">${esc(money(n))}</td></tr>`;
      }).join("")}</tbody></table>`
    : `<div class="empty">Пока пусто.</div>`;

  // chart: only events that have both a date and an amount
  const ev = [];
  let undatedBuys = 0, undatedPays = 0;
  accounts.forEach((a) => { const v = priceUsd(a); if (!ok(v)) return; if (a.purchased) ev.push({ d: a.purchased, v: -v }); else undatedBuys++; });
  payouts.forEach((p) => { const v = payUsd(p); if (!ok(v)) return; if (p.date) ev.push({ d: p.date, v }); else undatedPays++; });
  const skipped = [];
  if (undatedBuys) skipped.push(`покупок ${undatedBuys}`);
  if (undatedPays) skipped.push(`выплат ${undatedPays}`);
  const note = skipped.length ? `<p class="chart-note">Без даты, поэтому не на графике: ${esc(skipped.join(", "))}. Итог сверху учитывает всё.</p>` : "";
  if (ev.length < 2) {
    $("chart").innerHTML = `<div class="empty">Кривая появится, когда у покупок и выплат будут даты и суммы.</div>${note}`;
    return;
  }
  ev.sort((a, b) => a.d.localeCompare(b.d));
  const pts = []; let c = 0;
  ev.forEach((e) => { c += e.v; const last = pts[pts.length - 1]; if (last && last.d === e.d) last.y = c; else pts.push({ d: e.d, y: c }); });
  const t = (s) => new Date(s + "T00:00:00").getTime();
  const W = 1000, H = 260, L = 70, R = 16, T = 16, B = 34;
  const t0 = t(pts[0].d), t1 = Math.max(t(pts[pts.length - 1].d), t0 + 86400000);
  let lo = Math.min(0, ...pts.map((p) => p.y)), hi = Math.max(0, ...pts.map((p) => p.y));
  if (hi === lo) { hi += 100; lo -= 100; }
  const pad = (hi - lo) * 0.08; lo -= pad; hi += pad;
  const X = (v) => L + ((v - t0) / (t1 - t0)) * (W - L - R), Y = (v) => T + ((hi - v) / (hi - lo)) * (H - T - B);
  const step = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].find((s) => (hi - lo) / s <= 5) || 100000;
  const ticks = []; for (let v = Math.ceil(lo / step) * step; v <= hi; v += step) ticks.push(v);
  let d = `M${X(t0).toFixed(1)},${Y(0).toFixed(1)}`;
  pts.forEach((p) => { d += ` H${X(t(p.d)).toFixed(1)} V${Y(p.y).toFixed(1)}`; });
  d += ` H${X(t1).toFixed(1)}`;
  const end = pts[pts.length - 1], cls = end.y >= 0 ? "up" : "down";
  const fmtM = (ms) => new Date(ms).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  $("chart").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Накопленный итог ${esc(money(end.y))}">
    ${ticks.map((v) => `<line class="grid" x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${L - 8}" y="${Y(v) + 4}" text-anchor="end">${esc(money(v))}</text>`).join("")}
    <line class="zero" x1="${L}" x2="${W - R}" y1="${Y(0)}" y2="${Y(0)}"/>
    <path class="curve ${cls}" d="${d}"/>
    <circle class="${cls}" cx="${X(t1)}" cy="${Y(end.y)}" r="4.5"/>
    <text class="ax" x="${L}" y="${H - 10}">${esc(fmtM(t0))}</text>
    <text class="ax" x="${W - R}" y="${H - 10}" text-anchor="end">${esc(fmtM(t1))}</text>
  </svg>${note}`;
})();

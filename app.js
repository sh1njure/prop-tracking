"use strict";
(function () {
  // Publishable key: safe to ship in the browser. Access to data is enforced by Row Level Security in Supabase.
  const SUPABASE_URL = "https://izbcydezdbmlnrbrouyx.supabase.co";
  const SUPABASE_KEY = "sb_publishable_CWnql1KiT0PW7PhE4HFxWw_r94B2Tys";
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const STATUS = { eval: "Челлендж", funded: "Фандед", blown_eval: "Слит · челлендж", blown_funded: "Слит · фандед" };
  const $ = (id) => document.getElementById(id);
  let accounts = [], payouts = [];

  const money = (v) => { const n = Math.round(Number(v) || 0); return (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US"); };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const fmtDate = (d) => (d ? String(d).split("-").reverse().join(".") : "—");
  const accLabel = (a) => (a ? `${a.firm} ${Number(a.size_k)}K` + (a.program ? ` · ${a.program}` : "") : "аккаунт удалён");
  const isFundedish = (s) => s === "funded" || s === "blown_funded";

  function setStatus(text, err) { const el = $("status"); el.textContent = text; el.classList.toggle("err", !!err); }
  function showMsg(el, text, ok) { el.textContent = text; el.classList.toggle("ok", !!ok); el.hidden = !text; }
  const errText = (e) => (e && (e.message || e.error_description)) || "неизвестная ошибка";

  // ---------- auth ----------
  async function onSession(session) {
    if (session) {
      $("auth").hidden = true; $("app").hidden = false; $("logout").hidden = false;
      setStatus(session.user.email || "");
      $("a-date").value = today(); $("p-date").value = today();
      await load();
    } else {
      $("auth").hidden = false; $("app").hidden = true; $("logout").hidden = true;
      accounts = []; payouts = []; setStatus("");
    }
  }

  $("auth-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("btn-login"); btn.disabled = true; showMsg($("auth-msg"), "");
    const { error } = await sb.auth.signInWithPassword({ email: $("auth-email").value.trim(), password: $("auth-pass").value });
    btn.disabled = false;
    if (error) showMsg($("auth-msg"), error.message === "Invalid login credentials" ? "Неверный email или пароль." : errText(error));
  });

  $("btn-signup").addEventListener("click", async () => {
    const email = $("auth-email").value.trim(), pass = $("auth-pass").value;
    if (!email || pass.length < 8) { showMsg($("auth-msg"), "Введи email и пароль от 8 символов, потом нажми «Создать аккаунт»."); return; }
    const b = $("btn-signup"); b.disabled = true;
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
    b.disabled = false;
    if (error) { showMsg($("auth-msg"), errText(error)); return; }
    if (data.session) showMsg($("auth-msg"), "");
    else showMsg($("auth-msg"), "Аккаунт создан. Подтверди email по ссылке из письма, потом войди здесь.", true);
  });

  $("logout").addEventListener("click", () => sb.auth.signOut());
  sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => onSession(session), 0); });

  // ---------- data ----------
  async function load() {
    setStatus("Загружаю…");
    const [a, p] = await Promise.all([
      sb.from("accounts").select("id,firm,market,size_k,program,price,purchased,status"),
      sb.from("payouts").select("id,account_id,amount,paid_on,note"),
    ]);
    if (a.error || p.error) { setStatus("Не удалось загрузить: " + errText(a.error || p.error), true); return; }
    accounts = a.data; payouts = p.data;
    const { data } = await sb.auth.getUser();
    setStatus(data && data.user ? data.user.email : "");
    render();
  }

  function render() {
    const byId = Object.fromEntries(accounts.map((a) => [a.id, a]));
    const spent = accounts.reduce((s, a) => s + (+a.price || 0), 0);
    const paid = payouts.reduce((s, p) => s + (+p.amount || 0), 0);
    const net = paid - spent;
    const funded = accounts.filter((a) => isFundedish(a.status)).length;
    const paidAcc = new Set(payouts.map((p) => p.account_id).filter((id) => byId[id])).size;

    $("k-spent").textContent = money(spent);
    $("k-spent-h").textContent = `${accounts.length} акк.`;
    $("k-paid").textContent = money(paid);
    $("k-paid-h").textContent = `${payouts.length} выплат`;
    const kn = $("k-net"); kn.textContent = money(net); kn.className = "val num " + (net > 0 ? "pos" : net < 0 ? "neg" : "");
    $("k-net-h").textContent = spent ? `ROI ${((net / spent) * 100).toFixed(0)}%` : "ROI —";
    $("k-funnel").textContent = accounts.length ? `${funded} · ${paidAcc} · ${accounts.length}` : "—";

    const paidBy = {};
    payouts.forEach((p) => { if (p.account_id) paidBy[p.account_id] = (paidBy[p.account_id] || 0) + (+p.amount || 0); });
    const accSorted = [...accounts].sort((x, y) => String(y.purchased).localeCompare(String(x.purchased)));

    $("acc-table").innerHTML = accSorted.length
      ? `<table><thead><tr><th>Дата</th><th>Фирма</th><th>Рынок</th><th class="r">Размер</th><th>Программа</th><th class="r">Цена</th><th class="r">Выплачено</th><th>Статус</th><th></th></tr></thead><tbody>${accSorted.map((a) =>
          `<tr><td class="num">${fmtDate(a.purchased)}</td><td class="firm">${esc(a.firm)}</td><td><span class="tag ${a.market === "Futures" ? "fut" : "cfd"}">${a.market === "Futures" ? "Фьючи" : "CFD"}</span></td><td class="r num">${esc(Number(a.size_k))}K</td><td class="wrap-t">${esc(a.program) || "—"}</td><td class="r num">${money(a.price)}</td><td class="r num ${paidBy[a.id] ? "pos" : ""}">${paidBy[a.id] ? money(paidBy[a.id]) : "—"}</td><td><select class="st" data-id="${esc(a.id)}" data-v="${esc(a.status)}" aria-label="Статус">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}"${k === a.status ? " selected" : ""}>${v}</option>`).join("")}</select></td><td class="r"><button class="del" type="button" data-kind="accounts" data-id="${esc(a.id)}">Удалить</button></td></tr>`
        ).join("")}</tbody></table>`
      : `<div class="empty">Аккаунтов пока нет. Добавь первый в форме ниже.</div>`;

    const paySorted = [...payouts].sort((x, y) => String(y.paid_on).localeCompare(String(x.paid_on)));
    $("pay-table").innerHTML = paySorted.length
      ? `<table><thead><tr><th>Дата</th><th>Аккаунт</th><th class="r">Сумма</th><th>Заметка</th><th></th></tr></thead><tbody>${paySorted.map((p) =>
          `<tr><td class="num">${fmtDate(p.paid_on)}</td><td class="firm">${esc(accLabel(byId[p.account_id]))}</td><td class="r num pos">${money(p.amount)}</td><td class="wrap-t">${esc(p.note) || "—"}</td><td class="r"><button class="del" type="button" data-kind="payouts" data-id="${esc(p.id)}">Удалить</button></td></tr>`
        ).join("")}</tbody></table>`
      : `<div class="empty">Выплат пока нет.</div>`;

    const sel = $("p-acc"), cur = sel.value;
    sel.innerHTML = accSorted.length
      ? accSorted.map((a) => `<option value="${esc(a.id)}">${esc(accLabel(a))} · ${fmtDate(a.purchased)}</option>`).join("")
      : `<option value="">Сначала добавь аккаунт</option>`;
    if (cur && byId[cur]) sel.value = cur; else { const f = accSorted.find((a) => a.status === "funded"); if (f) sel.value = f.id; }

    const firms = {};
    accounts.forEach((a) => { const f = firms[a.firm] || (firms[a.firm] = { n: 0, spent: 0, paid: 0, funded: 0 }); f.n++; f.spent += +a.price || 0; if (isFundedish(a.status)) f.funded++; });
    payouts.forEach((p) => { const a = byId[p.account_id]; if (a) firms[a.firm].paid += +p.amount || 0; });
    const fr = Object.entries(firms).sort((x, y) => (y[1].paid - y[1].spent) - (x[1].paid - x[1].spent));
    $("firms").innerHTML = fr.length
      ? `<table><thead><tr><th>Фирма</th><th class="r">Аккаунтов</th><th class="r">Дошли до фандеда</th><th class="r">Потрачено</th><th class="r">Выплаты</th><th class="r">Итог</th></tr></thead><tbody>${fr.map(([name, f]) => {
          const n = f.paid - f.spent;
          return `<tr><td class="firm">${esc(name)}</td><td class="r num">${f.n}</td><td class="r num">${f.funded}</td><td class="r num">${money(f.spent)}</td><td class="r num">${f.paid ? money(f.paid) : "—"}</td><td class="r num ${n > 0 ? "pos" : n < 0 ? "neg" : ""}">${money(n)}</td></tr>`;
        }).join("")}</tbody></table>`
      : `<div class="empty">Пока пусто.</div>`;

    renderChart();
  }

  function renderChart() {
    const ev = [];
    accounts.forEach((a) => { if (a.purchased) ev.push({ d: a.purchased, v: -(+a.price || 0) }); });
    payouts.forEach((p) => { if (p.paid_on) ev.push({ d: p.paid_on, v: +p.amount || 0 }); });
    if (ev.length < 2) { $("chart").innerHTML = `<div class="empty">Появится, когда будет хотя бы два события: покупка или выплата.</div>`; return; }
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
    </svg>`;
  }

  // ---------- writes ----------
  document.addEventListener("click", async (e) => {
    const b = e.target.closest(".del"); if (!b) return;
    if (!b.classList.contains("arm")) {
      b.classList.add("arm"); b.textContent = "Точно удалить?";
      setTimeout(() => { if (b.isConnected) { b.classList.remove("arm"); b.textContent = "Удалить"; } }, 3500);
      return;
    }
    b.disabled = true;
    const table = b.dataset.kind === "payouts" ? "payouts" : "accounts";
    const { error } = await sb.from(table).delete().eq("id", b.dataset.id);
    if (error) { setStatus("Не удалось удалить: " + errText(error), true); b.disabled = false; return; }
    await load();
  });

  document.addEventListener("change", async (e) => {
    const s = e.target.closest("select.st"); if (!s || !STATUS[s.value]) return;
    s.dataset.v = s.value;
    const { error } = await sb.from("accounts").update({ status: s.value }).eq("id", s.dataset.id);
    if (error) setStatus("Не удалось сменить статус: " + errText(error), true);
    await load();
  });

  async function submit(form, btn, msg, write) {
    showMsg(msg, ""); btn.disabled = true;
    const { error } = await write();
    btn.disabled = false;
    if (error) { showMsg(msg, "Не сохранилось: " + errText(error)); return; }
    form.reset(); $("a-date").value = today(); $("p-date").value = today();
    await load();
  }

  $("acc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    submit(e.target, $("a-btn"), $("a-msg"), () => sb.from("accounts").insert({
      firm: $("a-firm").value.trim(), market: $("a-market").value, size_k: +$("a-size").value,
      program: $("a-program").value.trim(), price: +$("a-price").value, purchased: $("a-date").value, status: $("a-status").value,
    }));
  });

  $("pay-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!$("p-acc").value) { showMsg($("p-msg"), "Сначала добавь аккаунт, к которому относится выплата."); return; }
    submit(e.target, $("p-btn"), $("p-msg"), () => sb.from("payouts").insert({
      account_id: $("p-acc").value, amount: +$("p-amount").value, paid_on: $("p-date").value, note: $("p-note").value.trim(),
    }));
  });
})();

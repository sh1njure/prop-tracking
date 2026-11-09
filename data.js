// Данные трекера. Суммы в USD. price/amount = null, если ещё не внесено.
// status: "eval" | "funded" | "blown_eval" | "blown_funded"
// purchased / date: "ГГГГ-ММ-ДД" или null
window.LEDGER = {
  updated: "2026-11-09",
  accounts: [
    { id: "ftm-10k",   firm: "Funded Trader Markets", market: "CFD",     size: 10,  program: "2-Step Plus", price: null, purchased: null, status: "funded" },
    { id: "ftm-50k",   firm: "Funded Trader Markets", market: "CFD",     size: 50,  program: "",            price: null, purchased: null, status: "blown_eval" },
    { id: "mff-50k",   firm: "MyFundedFutures",       market: "Futures", size: 50,  program: "Builder",     price: null, purchased: null, status: "funded" },
    { id: "t5-100k",   firm: "The5ers",               market: "CFD",     size: 100, program: "",            price: null, purchased: null, status: "eval" }
  ],
  payouts: [
    // { account: "mff-50k", amount: 1200, date: "2026-10-20", note: "Rise → USDT" }
  ]
};

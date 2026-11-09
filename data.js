// Данные трекера. Итоги на сайте считаются в USD.
// price / amount: число или null (не внесено). currency: "USD" (по умолчанию) | "EUR"
// status: "eval" | "funded" | "blown_eval" | "blown_funded" | "unknown"
// purchased / date: "ГГГГ-ММ-ДД" или null. size: тысячи ($K) или null.
window.LEDGER = {
  updated: "2026-11-09",
  fx: { EUR: 1.117 }, // курс EUR→USD для пересчёта (27.10.2026)
  accounts: [
    // Funded Trader Markets — даты и статусы из кабинета FTM
    { id: "ftm-10k-a", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-07-19", status: "blown_eval", note: "#176689, слит на 1-й фазе 29.07" },
    { id: "ftm-10k-b", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-09-07", status: "funded", note: "#213421 → фандед #223179" },
    { id: "ftm-10k-c", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-09-16", status: "blown_eval", note: "#221656, слит в день покупки" },
    { id: "ftm-50k",   firm: "Funded Trader Markets", market: "CFD", size: 50, program: "2-Step Plus", price: 200, purchased: "2026-09-28", status: "blown_eval", note: "#232181, 1-я фаза пройдена, слит на 2-й 08.10" },

    { id: "fp-5k",     firm: "FundingPips", market: "CFD", size: 5,  program: "", price: 36, purchased: null, status: "blown_eval", note: "цена по прайсу" },
    { id: "fp-10k",    firm: "FundingPips", market: "CFD", size: 10, program: "", price: 66, purchased: null, status: "blown_eval", note: "цена по прайсу" },

    { id: "ftmo-10k",  firm: "FTMO", market: "CFD", size: 10, program: "", price: 98, purchased: null, status: "blown_eval", note: "размер примерно" },

    { id: "mff-50k",   firm: "MyFundedFutures", market: "Futures", size: 50, program: "Builder", price: 68, purchased: null, status: "funded" },

    { id: "t5-100k",   firm: "The5ers", market: "CFD", size: 100,  program: "", price: 130, currency: "EUR", purchased: null, status: "eval" },
    { id: "t5-2",      firm: "The5ers", market: "CFD", size: null, program: "", price: 130, currency: "EUR", purchased: null, status: "blown_eval" }
  ],
  payouts: [
    { account: "ftm-10k-b", amount: 371, date: "2026-09-28", note: "70% от $530, USDT TRC20" },
    { account: "mff-50k",   amount: 1100, date: null, note: "Rise → USDT, окт 2026" }
  ]
};

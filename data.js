// Ledger data. All totals on the site are shown in USD.
// The site shows only `year`. An entry belongs to the year of its date (purchased / date),
// or to its explicit `year` field when the date is unknown.
// price / amount: number or null (not entered). currency: "USD" (default) | "EUR"
// status: "eval" | "funded" | "blown_eval" | "blown_funded" | "unknown"
// purchased / date: "YYYY-MM-DD" or null. size: in thousands ($K) or null.
window.LEDGER = {
  year: 2026,
  updated: "2026-11-10",
  fx: { EUR: 1.117 }, // EUR→USD rate used for conversion (27 Oct 2026)
  accounts: [
    // Funded Trader Markets — dates and statuses from the FTM dashboard
    { id: "ftm-10k-a", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-07-19", status: "blown_eval", note: "#176689, blown in phase 1 on 29 Jul" },
    { id: "ftm-10k-b", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-09-07", status: "funded", note: "#213421 → funded #223179" },
    { id: "ftm-10k-c", firm: "Funded Trader Markets", market: "CFD", size: 10, program: "2-Step Plus", price: 38, purchased: "2026-09-16", status: "blown_eval", note: "#221656, blown the day it was bought" },
    { id: "ftm-50k",   firm: "Funded Trader Markets", market: "CFD", size: 50, program: "2-Step Plus", price: 200, purchased: "2026-09-28", status: "blown_eval", note: "#232181, passed phase 1, blown in phase 2 on 8 Oct" },

    { id: "mff-50k",   firm: "MyFundedFutures", market: "Futures", size: 50, program: "Builder", price: 68, purchased: null, year: 2026, status: "funded" },

    { id: "t5-100k",   firm: "The5ers", market: "CFD", size: 100,  program: "", price: 130, currency: "EUR", purchased: null, year: 2026, status: "blown_eval", note: "blown 10 Nov" },
    { id: "t5-2",      firm: "The5ers", market: "CFD", size: null, program: "", price: 130, currency: "EUR", purchased: null, year: 2026, status: "blown_eval" },

    // Bought before 2026 — kept for history, hidden on the site
    { id: "fp-5k",     firm: "FundingPips", market: "CFD", size: 5,  program: "", price: 36, purchased: null, year: 2025, status: "blown_eval", note: "list price" },
    { id: "fp-10k",    firm: "FundingPips", market: "CFD", size: 10, program: "", price: 66, purchased: null, year: 2025, status: "blown_funded", note: "list price" },
    { id: "ftmo-10k",  firm: "FTMO", market: "CFD", size: 10, program: "", price: 98, purchased: null, year: 2025, status: "blown_eval", note: "size approximate" }
  ],
  payouts: [
    { account: "ftm-10k-b", amount: 371, date: "2026-09-28", note: "70% of $530, USDT TRC20" },
    { account: "mff-50k",   amount: 1100, date: null, year: 2026, note: "Rise → USDT, Oct 2026" }
  ]
};

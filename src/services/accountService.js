/**
 * accountService.js
 * Stub for Account / Debit Card services.
 * Will be wired to OutSystems Checking Account + Deposit Account + Market Data APIs.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function getBalances(userId) {
  await delay(400)
  return {
    userId,
    save:   12450.00,
    invest:  8200.00,
    spend:   3100.00,
    updatedAt: new Date().toISOString(),
  }
}

export async function getTransactions(userId, { limit = 10 } = {}) {
  await delay(350)
  const all = [
    { id: 'txn-001', date: '2026-03-24', merchant: 'Grab Food',       category: 'Food',       amount: -18.90,  status: 'settled' },
    { id: 'txn-002', date: '2026-03-23', merchant: 'FairPrice Online', category: 'Groceries',  amount: -67.40,  status: 'settled' },
    { id: 'txn-003', date: '2026-03-22', merchant: 'Netflix',          category: 'Entertain',  amount: -18.98,  status: 'settled' },
    { id: 'txn-004', date: '2026-03-21', merchant: 'Uniqlo ION',       category: 'Shopping',   amount: -89.00,  status: 'settled' },
    { id: 'txn-005', date: '2026-03-20', merchant: 'Spotify',          category: 'Entertain',  amount: -9.98,   status: 'settled' },
    { id: 'txn-006', date: '2026-03-19', merchant: 'Shell Buona Vista', category: 'Transport', amount: -55.00,  status: 'settled' },
    { id: 'txn-007', date: '2026-03-18', merchant: 'Koufu @ One North', category: 'Food',      amount: -8.50,   status: 'settled' },
    { id: 'txn-008', date: '2026-03-17', merchant: 'Amazon SG',        category: 'Shopping',   amount: -112.00, status: 'settled' },
    { id: 'txn-009', date: '2026-03-16', merchant: 'Decathlon',        category: 'Sports',     amount: -45.00,  status: 'settled' },
    { id: 'txn-010', date: '2026-03-15', merchant: 'Wingstop',         category: 'Food',       amount: -22.40,  status: 'settled' },
  ]
  return all.slice(0, limit)
}

export async function getDebitCardInfo(userId) {
  await delay(200)
  return {
    userId,
    cardNumber: '**** **** **** 4821',
    cardholderName: 'ALEX TAN WEI MING',
    expiry: '03/29',
    network: 'VISA',
    spendLimit: 2000.00,
    spentThisMonth: 447.16,
  }
}

export async function getMarketSnapshot() {
  await delay(500)
  return {
    portfolioValue: 8200.00,
    dayChange: +1.24,
    dayChangePct: +0.015,
    holdings: [
      { symbol: 'IWDA', name: 'iShares MSCI World', allocation: 60, value: 4920 },
      { symbol: 'ES3',  name: 'STI ETF',            allocation: 25, value: 2050 },
      { symbol: 'CASH', name: 'Cash (SGD)',          allocation: 15, value: 1230 },
    ],
  }
}

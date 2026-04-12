/**
 * salaryService.js
 * Stub for Salary / Split atomic services.
 * Will be wired to OutSystems Payment + Checking Account + Deposit Account APIs.
 */

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

export async function simulateSalaryCredit({ employer, amount, splitSettings }) {
  await delay(1200)
  const save    = +(amount * (splitSettings.save    / 100)).toFixed(2)
  const invest  = +(amount * (splitSettings.invest  / 100)).toFixed(2)
  const spend   = +(amount * (splitSettings.spend   / 100)).toFixed(2)
  return {
    success: true,
    creditedAt: new Date().toISOString(),
    employer,
    grossAmount: amount,
    split: { save, invest, spend },
  }
}

export async function getSplitSettings(userId) {
  await delay(300)
  return {
    userId,
    save:   40,
    invest: 30,
    spend:  30,
    approvedAt: '2026-03-01T08:00:00Z',
  }
}

export async function updateSplitSettings(userId, settings) {
  await delay(600)
  if (settings.save + settings.invest + settings.spend !== 100) {
    throw new Error('Split percentages must sum to 100')
  }
  return {
    success: true,
    userId,
    settings,
    updatedAt: new Date().toISOString(),
  }
}

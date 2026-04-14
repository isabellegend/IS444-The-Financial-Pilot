import axios from 'axios'

const salarySplitterApi = axios.create({
  baseURL: 'https://personal-hcjpmiar.outsystemscloud.com/FinancialPilotSalarySplitter/rest/SalarySplitter',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Execute salary splitter for a corporate account.
 * OutSystems orchestrator handles:
 *   GetRecipientByNRIC -> calc buckets -> DebitSpend -> CreditSpend -> DepositCash -> PlaceMarketOrder
 *
 * @param {Object} payload
 * @param {string} payload.NRIC          - Recipient's NRIC
 * @param {number} payload.SalaryAmount  - Total salary to split
 */
export function executeSalarySplitter(payload) {
  return salarySplitterApi.post('/ExecuteSalarySplitter', payload)
}

export default salarySplitterApi

import axios from 'axios'

/**
 * Salary Splitter API - Corporate Account
 * No authentication required for this endpoint
 * Handles: GetRecipientByNRIC -> PutDebitSpendAccount -> PutCreditSpendAccount -> DepositCash
 */
const salarySplitterApi = axios.create({
  baseURL: 'https://personal-hcjpmiar.outsystemscloud.com/FinancialPilotSalarySplitter/rest/SalarySplitter',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Execute salary splitter transfer for a corporate account
 * This performs the complete flow:
 * 1. GetRecipientByNRIC - Retrieve recipient's account details
 * 2. PutDebitSpendAccount - Debit from payer's spend account
 * 3. PutCreditSpendAccount - Credit to recipient's spend account
 * 4. DepositCash - Finalize deposit for recipient
 * 
 * @param {Object} payload - Transfer request payload
 * @param {string} payload.payerNric - Payer's NRIC (from LoginUser session)
 * @param {string} payload.recipientNric - Recipient's NRIC
 * @param {number} payload.amount - Transfer amount in S$
 * @param {string} payload.narrative - Transaction note/description
 * @param {string} payload.referenceId - Unique reference ID for tracking
 * @returns {Promise} API response with transaction result and updated balances
 */
export function executeSalarySplitter(payload) {
  return salarySplitterApi.post('/ExecuteSalarySplitter', payload)
}

/**
 * Get recipient details by NRIC
 * @param {string} nric - Recipient's NRIC
 * @returns {Promise} Recipient account information
 */
export function getRecipientByNRIC(nric) {
  return salarySplitterApi.get('/GetRecipientByNRIC', { params: { nric } })
}

export default salarySplitterApi

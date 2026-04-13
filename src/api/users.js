import axios from 'axios'

const userApi = axios.create({
  baseURL: 'https://personal-cpbybmmf.outsystemscloud.com/UserAtomicService/rest/UserAtomicService',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-KEY': 'c0bfe9f2-ad3d-40fc-a36d-f7eee6409df7',
  },
})

const checkingApi = axios.create({
  baseURL: 'https://qks.outsystemscloud.com/CheckingAccount/rest/CheckingAccount',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-Checking-Key': 'b9a02fc6-974a-44ab-b7d0-04d0482f1746',
  },
})

export function getAllUsers() {
  return userApi.get('/GetAllUsers')
}

export function createUser(payload) {
  return userApi.post('/Users', payload)
}

export function loginUser(payload) {
  return userApi.post('/LoginUser', payload)
}

/**
 * Store session variables from LoginUser response
 * Extracts NRIC, name, customer type, and split percentages
 * @param {Object} loginResponse - Response from LoginUser endpoint
 */
export function storeSessionVariables(loginResponse) {
  const data = loginResponse.data || loginResponse
  
  // Extract and store session variables
  if (data.userNRIC || data.nric) {
    sessionStorage.setItem('nric', data.userNRIC || data.nric)
  }
  if (data.fullName || data.name) {
    sessionStorage.setItem('fullName', data.fullName || data.name)
  }
  if (data.customerType) {
    sessionStorage.setItem('customerType', data.customerType)
  }
  if (data.savePercentage) {
    sessionStorage.setItem('savePercentage', data.savePercentage)
  }
  if (data.investPercentage) {
    sessionStorage.setItem('investPercentage', data.investPercentage)
  }
  if (data.spendPercentage) {
    sessionStorage.setItem('spendPercentage', data.spendPercentage)
  }
  if (data.checkingAccount) {
    sessionStorage.setItem('checkingAccount', data.checkingAccount)
  }
  if (data.saveAccount) {
    sessionStorage.setItem('saveAccount', data.saveAccount)
  }
  if (data.investAccount) {
    sessionStorage.setItem('investAccount', data.investAccount)
  }
  
  return data
}

export function registerAccount(payload) {
  return checkingApi.post('/RegisterAccount', payload)
}

export function getAccountByNRIC(nric) {
  return checkingApi.get('/GetAccountByNRIC', { params: { Nric: nric } })
}

export function getTransactionHistory(nric, { pageNo = 1, pageSize = 20 } = {}) {
  return checkingApi.get('/GetTransactionHistory', {
    params: { Nric: nric, PageNo: pageNo, PageSize: pageSize },
  })
}

export function updateUserPercentage({ nric, savePercentage, investPercentage, spendPercentage }) {
  return userApi.put('/UpdateUserPercentageByNRIC',
    { savePercentage, investPercentage, spendPercentage },
    { params: { NRIC: nric } }
  )
}

export function debitSpendAccount(payload) {
  return checkingApi.put('/DebitSpendAccount', payload)
}

export function creditSpendAccount(payload) {
  return checkingApi.put('/CreditSpendAccount', payload)
}

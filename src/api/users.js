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

export function createUser(payload) {
  return userApi.post('/Users', payload)
}

export function registerAccount(payload) {
  return checkingApi.post('/RegisterAccount', payload)
}

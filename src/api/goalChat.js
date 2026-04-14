import axios from 'axios'

const goalChatApi = axios.create({
  baseURL: 'https://personal-itest0et.outsystemscloud.com/OptimiseSplitComposite/rest/OptimiseSplitSettings',
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
})

export function firstTurn(payload) {
  return goalChatApi.post('/FirstTurn', payload)
}

export function followUp(payload) {
  return goalChatApi.post('/FollowUp', payload)
}

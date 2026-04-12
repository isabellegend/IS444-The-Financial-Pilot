import axios from 'axios'

const chatbotApi = axios.create({
  baseURL: 'https://personal-ne1thpev.outsystemscloud.com/ChatbotUpdateSplit/rest/ChatBotUpdateSplit',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-Contacts-Key': 'f6d736c7-de96-44cb-95b5-a2e67d4fffb8',
  },
})

export function updateSplit({ savePercentage, investPercentage, spendPercentage, nric }) {
  return chatbotApi.put('/ChatBotUpdateSplit', null, {
    params: {
      SavePercentage:   savePercentage,
      InvestPercentage: investPercentage,
      SpendPercentage:  spendPercentage,
      NRIC:             nric,
    },
  })
}

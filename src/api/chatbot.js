import axios from 'axios'

const chatbotApi = axios.create({
  baseURL: '/chatbot-proxy/ChatbotUpdateSplit/rest/UpdateSplitSettings',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-Contacts-Key': 'f6d736c7-de96-44cb-95b5-a2e67d4fffb8',
  },
})

export function updateSplit({ savePercentage, investPercentage, spendPercentage, nric }) {
  return chatbotApi.put('/UpdateSplit', null, {
    params: {
      SavePercentage:   savePercentage,
      InvestPercentage: investPercentage,
      SpendPercentage:  spendPercentage,
      NRIC:             nric,
    },
  })
}

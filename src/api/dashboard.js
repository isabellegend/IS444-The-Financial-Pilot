import axios from 'axios'

const dashboardApi = axios.create({
  baseURL: 'https://personal-ne1thpev.outsystemscloud.com/AggregateDashboardData/rest/DashBoardMetrics',
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    'X-Contacts-Key': 'f6d736c7-de96-44cb-95b5-a2e67d4fffb8',
  },
})

export function getDashboardMetrics(nric) {
  return dashboardApi.get('/GetDashboardMetrics', { params: { NRIC: nric } })
}

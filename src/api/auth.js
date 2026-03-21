import http from './http.js'

export default {
  login:  creds => http.post('/Login', creds),
  logout: ()    => http.post('/Logout'),
  getMe:  ()    => http.get('/GetCurrentUser')
}

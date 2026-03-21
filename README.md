# IS444-The-Financial-Pilot

# Vue 3 + OutSystems Frontend

Simple customer-facing app — Vue 3, Vite, Vue Router, Axios.

## Start

```bash
cp .env.example .env   # fill in your OutSystems URL and API path
npm install
npm run dev            # http://localhost:3000
```

## File structure

```
src/
  api/
    http.js       ← Axios client (token + 401 handling)
    auth.js       ← Auth endpoints (login, logout, getMe)
    index.js      ← Add more OutSystems modules here
  components/
    AppNav.vue    ← Top navigation bar
  views/
    Home.vue      ← Public landing page
    Login.vue     ← Login form
    Dashboard.vue ← After login
    Profile.vue   ← User profile
    NotFound.vue  ← 404
  router.js       ← All routes + auth guard
  main.js         ← App bootstrap
  App.vue
  assets/
    style.css
```

## Adding a new OutSystems page

1. Create `src/api/yourmodule.js` — copy `auth.js` as template
2. Export it in `src/api/index.js`
3. Create `src/views/YourPage.vue`
4. Add a route in `src/router.js`

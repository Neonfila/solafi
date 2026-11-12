# Solafi — solafi.ng

Landing site for Solafi, a solar financing company (a NeonFila company): we install the solar system, the customer pays monthly.

Vite + React 19 + react-router.

```bash
npm install
npm run dev     # local preview
npm test        # calculator maths
npm run build   # production build in dist/
```

## Where things live

- `src/lib/config.js` — every number on the site: packages, example prices, loan terms, calculator starting values, reference petrol and tariff prices with their sources. Prices and loan terms are shown as published plans; change them here.
- `src/lib/calc.js` — calculator maths (pure functions), tested in `calc.test.js`.
- `src/components/Calculator.jsx`, `SavingsChart.jsx` — the savings calculator.
- `src/components/StreetScene.jsx` — hero visual (the street where one house stays lit).
- `src/components/Waitlist.jsx` — waitlist form. It sends nothing until `VITE_WAITLIST_ENDPOINT` is set to a form backend URL that accepts a JSON POST.
- `src/pages/Home.jsx`, `About.jsx` — the two pages.

## Not done yet

- Waitlist backend, contact details (email, WhatsApp), cities served.
- The solafi.ng domain. The site deploys to GitHub Pages from `main` (`.github/workflows/deploy.yml`) under `/solafi/`; when the domain is connected, remove `VITE_BASE` from the workflow.

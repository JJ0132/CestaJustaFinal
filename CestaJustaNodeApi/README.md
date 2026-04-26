CestaJusta Node API

This small Express API exposes a few endpoints that mirror the .NET API for development/testing.

Install:

```powershell
cd CestaJustaNodeApi
npm install
```

Run:

```powershell
npm start
# or for dev with nodemon
npm run dev
```

Endpoints:
- GET /api/ingredientes
- GET /api/ingredientes/search?q=...
- GET /api/menudiario/random?esVegetariano=true|false
- GET /api/menusemanal?esVegetariano=true|false
- GET /api/recetasingredientes?tipo=desayuno|comida|cena&recetaId=123

Notes:
- The API reads JSON files from `DB/` at repository root. Ensure the `DB/` folder exists and contains the JSON files.

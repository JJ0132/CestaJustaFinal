const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const DB_DIR = path.join(__dirname, '..', '..', 'DB');

function loadJsonFile(name) {
  const p = path.join(DB_DIR, name);
  if (!fs.existsSync(p)) return [];
  try {
    const txt = fs.readFileSync(p, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    console.error('Failed to parse', p, e.message);
    return [];
  }
}

const desayunos = loadJsonFile('recetas_Desayuno.json');
const comidas = loadJsonFile('recetas_Comida.json');
const cenas = loadJsonFile('recetas_Cena.json');
const ingredientes = loadJsonFile('ingredientes.json');

// helper to map estructura de receta (normalizar a Id, Nombre, Precio, EsVegetariano=false)
function normalizeReceta(item, tipo) {
  if (!item) return null;
  if (tipo === 'desayuno') return { id: item.IdDesayuno ?? item.Id ?? 0, nombre: item.NombreDesayuno ?? item.Nombre ?? item.nombre ?? '', precio: item.Precio_Desayuno ?? item.Precio ?? 0, tipo };
  if (tipo === 'comida') return { id: item.IdComida ?? item.Id ?? 0, nombre: item.NombreComida ?? item.Nombre ?? item.nombre ?? '', precio: item.Precio_Comida ?? item.Precio ?? 0, tipo };
  if (tipo === 'cena') return { id: item.IdCena ?? item.Id ?? 0, nombre: item.NombreCena ?? item.Nombre ?? item.nombre ?? '', precio: item.Precio_Cena ?? item.Precio ?? 0, tipo };
  return null;
}

function isVegetarianByName(name) {
  const lower = (name||'').toLowerCase();
  const meats = ['pollo','pavo','cerdo','ternera','jamón','jamon','atún','atun','merluza','salmón','salmón','pescado','carne','mejillones','pota','calamar','lomo','salchicha','chorizo','bacon','panceta','melva','choped','salami','bacalao'];
  for (const m of meats) if (lower.includes(m)) return false;
  return true;
}

app.get('/api/ingredientes', (req, res) => {
  res.json(ingredientes);
});

app.get('/api/ingredientes/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.json(ingredientes.slice(0,50));
  const out = ingredientes.filter(i => (i.Nombre || i.nombre || '').toLowerCase().includes(q));
  res.json(out.slice(0,200));
});

app.get('/api/menudiario/random', (req, res) => {
  const esVegetariano = (req.query.esVegetariano || 'false') === 'true';
  const d = normalizeReceta(desayunos[Math.floor(Math.random()*desayunos.length)], 'desayuno');
  const c = normalizeReceta(comidas[Math.floor(Math.random()*comidas.length)], 'comida');
  const ce = normalizeReceta(cenas[Math.floor(Math.random()*cenas.length)], 'cena');
  const menu = {
    id: Math.floor(Math.random()*1000000),
    Desayuno: d,
    Comida: c,
    Cena: ce,
    PrecioTotalDia: (d.precio||0)+(c.precio||0)+(ce.precio||0),
    EsVegetariano: isVegetarianByName(d.nombre) && isVegetarianByName(c.nombre) && isVegetarianByName(ce.nombre)
  };
  if (esVegetariano && !menu.EsVegetariano) return res.status(404).json({ message: 'No vegetarian random found' });
  res.json(menu);
});

app.get('/api/menusemanal', (req, res) => {
  // Strategy: sample 20 weekly menus by random combination
  const esVegetariano = (req.query.esVegetariano || 'false') === 'true';
  const menus = [];
  for (let i=0;i<20;i++){
    const days = [];
    for (let d=0; d<7; d++){
      days.push({
        Desayuno: normalizeReceta(desayunos[Math.floor(Math.random()*desayunos.length)], 'desayuno'),
        Comida: normalizeReceta(comidas[Math.floor(Math.random()*comidas.length)], 'comida'),
        Cena: normalizeReceta(cenas[Math.floor(Math.random()*cenas.length)], 'cena')
      });
    }
    const precioSemana = days.reduce((s,day)=> s + (day.Desayuno.precio||0) + (day.Comida.precio||0) + (day.Cena.precio||0),0);
    const veg = days.every(day => isVegetarianByName(day.Desayuno.nombre) && isVegetarianByName(day.Comida.nombre) && isVegetarianByName(day.Cena.nombre));
    if (esVegetariano && !veg) continue;
    menus.push({ id: i+1, days, PrecioSemana: precioSemana, EsVegetariano: veg });
  }
  res.json(menus);
});

app.get('/api/recetasingredientes', (req, res) => {
  // Heuristic: find tokens in recipe name and match ingredientes by token
  const tipo = (req.query.tipo || '').toLowerCase();
  const recetaId = parseInt(req.query.recetaId || '0');
  let rec = null;
  if (tipo === 'desayuno') rec = desayunos.find(r => (r.IdDesayuno ?? r.Id) == recetaId);
  if (tipo === 'comida') rec = comidas.find(r => (r.IdComida ?? r.Id) == recetaId);
  if (tipo === 'cena') rec = cenas.find(r => (r.IdCena ?? r.Id) == recetaId);
  if (!rec) return res.status(404).json([]);
  const name = (rec.NombreDesayuno||rec.NombreComida||rec.NombreCena||rec.Nombre||'').toLowerCase();
  const tokens = name.split(/[,\s\-\/]+/).filter(t=>t.length>2);
  const matched = ingredientes.filter(ing => {
    const iname = (ing.Nombre||ing.nombre||'').toLowerCase();
    return tokens.some(t => iname.includes(t));
  });
  res.json(matched.map(m=>({ Id: m.Id, Nombre: m.Nombre, Precio: m.Precio || m.Precio_Captura || 0 })));
});

const port = process.env.PORT || 5089;
app.listen(port, () => console.log(`CestaJusta Node API listening on port ${port}`));

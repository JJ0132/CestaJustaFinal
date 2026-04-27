const RECETAS = {
  desayuno: [],
  almuerzo: [],
  cena: [],
};

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_EMOJIS = ['','','','','','',''];
const MEAL_ICONS = { desayuno:'', almuerzo:'', cena:'' };
const API_BASE_URL = 'http://localhost:5088/api';
let googleClientId = window.GOOGLE_CLIENT_ID || '';

async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`API error ${response.status} on ${endpoint}`);
  return response.json();
}

async function loadGoogleClientId() {
  if (googleClientId) return googleClientId;

  try {
    const config = await fetchFromAPI('/config/google');
    googleClientId = config.clientId || config.ClientId || '';
  } catch (error) {
    console.warn('No se pudo cargar la configuración de Google:', error);
  }

  return googleClientId;
}

function getRecipeName(recipe, type = '') {
  if (!recipe) return '';
  const typedNames = {
    desayuno: ['nombreDesayuno', 'NombreDesayuno'],
    comida: ['nombreComida', 'NombreComida'],
    cena: ['nombreCena', 'NombreCena'],
  };
  const keys = ['nombre', 'Nombre', ...(typedNames[type] || [])];
  return keys.map(k => recipe[k]).find(Boolean) || '';
}

function getRecipePrice(recipe, type = '') {
  if (!recipe) return 0;
  const typedPrices = {
    desayuno: ['precio_Desayuno', 'Precio_Desayuno'],
    comida: ['precio_Comida', 'Precio_Comida'],
    cena: ['precio_Cena', 'Precio_Cena'],
  };
  const keys = ['precio', 'Precio', 'precioTotal', 'PrecioTotal', ...(typedPrices[type] || [])];
  const value = keys.map(k => recipe[k]).find(v => v !== undefined && v !== null);
  return Number(value) || 0;
}

function normalizeRecipe(recipe, type) {
  return {
    ...recipe,
    nombre: getRecipeName(recipe, type),
    precioTotal: getRecipePrice(recipe, type),
  };
}

async function loadRecipesFromAPI() {
  try {
    const [d, c, ce] = await Promise.all([
      fetchFromAPI('/recetas/desayunos'),
      fetchFromAPI('/recetas/comidas'),
      fetchFromAPI('/recetas/cenas')
    ]);
    RECETAS.desayuno = d.map(r => normalizeRecipe(r, 'desayuno'));
    RECETAS.almuerzo = c.map(r => normalizeRecipe(r, 'comida'));
    RECETAS.cena = ce.map(r => normalizeRecipe(r, 'cena'));
    console.log("Recetas cargadas desde la API:", { desayuno: d.length, almuerzo: c.length, cena: ce.length });
  } catch (error) {
    console.error("Error al cargar recetas de la API:", error);
  }
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Extrae una lista sencilla de ingredientes a partir del nombre de la receta.
function extractIngredientsFromName(name) {
  if (!name) return '';
  let parts = name.split(',').map(p => p.trim()).filter(Boolean);
  parts = parts.flatMap(p => p.split(/\s+y\s+|\s+and\s+/i).map(s => s.trim()).filter(Boolean));
  const cleaned = parts.map(p => p.replace(/\s*\(.*?\)\s*/g, '').trim()).filter(Boolean);
  return Array.from(new Set(cleaned)).join(', ');
}

function filterRecipes(recipes, profile) {
  return recipes.filter(recipe => {
    if ((profile.dietType === 'vegetariano' || profile.dietType === 'vegano') && recipe.esVegetariano === false) return false;

    const ingr = (recipe.ingredientes || '').toLowerCase();
    
    // Filtrados básicos basados en texto para la demo
    if (profile.dietType === 'vegetariano' && (ingr.includes('pollo') || ingr.includes('merluza') || ingr.includes('atún') || ingr.includes('ternera') || ingr.includes('pavo') || ingr.includes('cerdo') || ingr.includes('jamón'))) return false;
    if (profile.dietType === 'vegano' && (ingr.includes('pollo') || ingr.includes('merluza') || ingr.includes('atún') || ingr.includes('ternera') || ingr.includes('pavo') || ingr.includes('cerdo') || ingr.includes('huevo') || ingr.includes('queso') || ingr.includes('leche') || ingr.includes('yogur') || ingr.includes('mantequilla') || ingr.includes('jamón'))) return false;
    
    return true;
  });
}

function getTotalWeeklyBudget(profile) {
  return (Number(profile.weeklyBudget) || 0) * (Number(profile.people) || 1);
}

function getMealTokens(recipe, type = '') {
  const rawText = [
    getRecipeName(recipe, type),
    recipe?.nombre,
    recipe?.Nombre,
    recipe?.ingredientes,
    recipe?.Ingredientes,
  ].filter(Boolean).join(', ');

  return rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function estimateMealCalories(recipe, type) {
  const baseByType = {
    desayuno: 180,
    comida: 260,
    cena: 220,
  };

  const caloriesByToken = {
    aceite: 120,
    aguacate: 110,
    arroz: 210,
    atun: 140,
    avena: 150,
    barquillos: 160,
    bizcocho: 250,
    boniato: 90,
    cafe: 5,
    carne: 220,
    cereales: 170,
    cerdo: 230,
    chocolate: 120,
    croissant: 240,
    ensalada: 80,
    ensaimada: 270,
    fruta: 70,
    galletas: 180,
    garbanzos: 190,
    huevo: 155,
    jamon: 110,
    kiwi: 45,
    leche: 90,
    lentejas: 180,
    manzana: 52,
    mantequilla: 100,
    merluza: 130,
    mortadela: 140,
    napolitana: 260,
    naranja: 60,
    pan: 160,
    pasta: 220,
    patata: 130,
    pavo: 135,
    platano: 95,
    pollo: 200,
    queso: 115,
    salmon: 210,
    tomate: 25,
    tostadas: 140,
    yogur: 95,
    zumo: 85,
  };

  const tokens = Array.from(new Set(getMealTokens(recipe, type)));
  const matchedCalories = tokens.reduce((sum, token) => sum + (caloriesByToken[token] || 0), 0);
  return baseByType[type] + matchedCalories;
}

function buildDayPlan(day, dayIndex, breakfast, lunch, dinner, people) {
  const bCost = getRecipePrice(breakfast, 'desayuno') * people;
  const lCost = getRecipePrice(lunch, 'comida') * people;
  const dCost = getRecipePrice(dinner, 'cena') * people;
  const bKcal = estimateMealCalories(breakfast, 'desayuno');
  const lKcal = estimateMealCalories(lunch, 'comida');
  const dKcal = estimateMealCalories(dinner, 'cena');

  return {
    day, emoji: DAY_EMOJIS[dayIndex],
    breakfast: { ...breakfast, totalCost: bCost, kcal: bKcal },
    lunch:     { ...lunch,     totalCost: lCost, kcal: lKcal },
    dinner:    { ...dinner,    totalCost: dCost, kcal: dKcal },
    dailyCost: bCost + lCost + dCost,
    dailyCalories: bKcal + lKcal + dKcal,
  };
}

function getComboCostPerPerson(combo) {
  return (
    getRecipePrice(combo.breakfast, 'desayuno') +
    getRecipePrice(combo.lunch, 'comida') +
    getRecipePrice(combo.dinner, 'cena')
  );
}

function getRecipeId(recipe, type) {
  if (!recipe) return '';
  const explicitId = recipe.id ?? recipe.Id ?? recipe.IdDesayuno ?? recipe.IdComida ?? recipe.IdCena;
  return `${type}:${explicitId ?? getRecipeName(recipe, type)}`;
}

function getComboKey(combo) {
  return [
    getRecipeId(combo.breakfast, 'desayuno'),
    getRecipeId(combo.lunch, 'comida'),
    getRecipeId(combo.dinner, 'cena'),
  ].join('|');
}

function getCheapestRecipe(recipes, type, fallback) {
  return [...recipes].sort((a, b) => getRecipePrice(a, type) - getRecipePrice(b, type))[0] || fallback;
}

function getMinimumDayCostPerPerson(desayunos, almuerzos, cenas) {
  const fallback = {
    breakfast: { nombre: 'Desayuno genÃ©rico', ingredientes: 'Pan, Aceite', precioTotal: 1.5 },
    lunch: { nombre: 'Comida genÃ©rica', ingredientes: 'Arroz, Pollo', precioTotal: 3.5 },
    dinner: { nombre: 'Cena genÃ©rica', ingredientes: 'Huevo, Patata', precioTotal: 2.0 },
  };

  const cheapestBreakfast = getCheapestRecipe(desayunos.length ? desayunos : RECETAS.desayuno, 'desayuno', fallback.breakfast);
  const cheapestLunch = getCheapestRecipe(almuerzos.length ? almuerzos : RECETAS.almuerzo, 'comida', fallback.lunch);
  const cheapestDinner = getCheapestRecipe(cenas.length ? cenas : RECETAS.cena, 'cena', fallback.dinner);

  return getComboCostPerPerson({
    breakfast: cheapestBreakfast,
    lunch: cheapestLunch,
    dinner: cheapestDinner,
  });
}

function pickAffordableDay(desayunos, almuerzos, cenas, dailyBudgetPerPerson, options = {}) {
  const usedRecipeIds = options.usedRecipeIds || new Set();
  const excludedComboKey = options.excludedComboKey || '';
  const fallback = {
    breakfast: { nombre: 'Desayuno genérico', ingredientes: 'Pan, Aceite', precioTotal: 1.5 },
    lunch: { nombre: 'Comida genérica', ingredientes: 'Arroz, Pollo', precioTotal: 3.5 },
    dinner: { nombre: 'Cena genérica', ingredientes: 'Huevo, Patata', precioTotal: 2.0 },
  };

  const breakfastPool = shuffle(desayunos.length ? desayunos : RECETAS.desayuno);
  const lunchPool = shuffle(almuerzos.length ? almuerzos : RECETAS.almuerzo);
  const dinnerPool = shuffle(cenas.length ? cenas : RECETAS.cena);
  const prioritizedBreakfastPool = breakfastPool.filter(recipe => !usedRecipeIds.has(getRecipeId(recipe, 'desayuno')));
  const prioritizedLunchPool = lunchPool.filter(recipe => !usedRecipeIds.has(getRecipeId(recipe, 'comida')));
  const prioritizedDinnerPool = dinnerPool.filter(recipe => !usedRecipeIds.has(getRecipeId(recipe, 'cena')));
  const activeBreakfastPool = prioritizedBreakfastPool.length ? prioritizedBreakfastPool : breakfastPool;
  const activeLunchPool = prioritizedLunchPool.length ? prioritizedLunchPool : lunchPool;
  const activeDinnerPool = prioritizedDinnerPool.length ? prioritizedDinnerPool : dinnerPool;

  const cheapest = {
    breakfast: [...activeBreakfastPool].sort((a, b) => getRecipePrice(a, 'desayuno') - getRecipePrice(b, 'desayuno'))[0] || fallback.breakfast,
    lunch: [...activeLunchPool].sort((a, b) => getRecipePrice(a, 'comida') - getRecipePrice(b, 'comida'))[0] || fallback.lunch,
    dinner: [...activeDinnerPool].sort((a, b) => getRecipePrice(a, 'cena') - getRecipePrice(b, 'cena'))[0] || fallback.dinner,
  };

  let bestUnderBudget = null;
  let bestOverall = cheapest;

  const scoreCombo = combo => {
    const cost = getComboCostPerPerson(combo);
    const comboKey = getComboKey(combo);
    const repetitionPenalty = [
      getRecipeId(combo.breakfast, 'desayuno'),
      getRecipeId(combo.lunch, 'comida'),
      getRecipeId(combo.dinner, 'cena'),
    ].reduce((penalty, id) => penalty + (usedRecipeIds.has(id) ? 1 : 0), 0);

    return {
      comboKey,
      cost,
      repetitionPenalty: repetitionPenalty + (comboKey === excludedComboKey ? 1000 : 0),
      distanceToBudget: Math.abs(dailyBudgetPerPerson - cost),
    };
  };

  for (let i = 0; i < 800; i++) {
    const combo = {
      breakfast: activeBreakfastPool[i % activeBreakfastPool.length] || cheapest.breakfast,
      lunch: activeLunchPool[(i * 7) % activeLunchPool.length] || cheapest.lunch,
      dinner: activeDinnerPool[(i * 13) % activeDinnerPool.length] || cheapest.dinner,
    };

    const current = scoreCombo(combo);
    const currentBestUnder = bestUnderBudget ? scoreCombo(bestUnderBudget) : null;
    const currentBestOverall = scoreCombo(bestOverall);

    if (current.cost <= dailyBudgetPerPerson) {
      if (
        !bestUnderBudget ||
        current.repetitionPenalty < currentBestUnder.repetitionPenalty ||
        (current.repetitionPenalty === currentBestUnder.repetitionPenalty &&
          current.distanceToBudget < currentBestUnder.distanceToBudget)
      ) {
        bestUnderBudget = combo;
      }
    }

    if (
      current.cost < currentBestOverall.cost ||
      (current.cost === currentBestOverall.cost &&
        current.repetitionPenalty < currentBestOverall.repetitionPenalty)
    ) {
      bestOverall = combo;
    }
  }

  return bestUnderBudget || bestOverall;
}

function summarizeMealPlan(days) {
  const totalCost = days.reduce((s,d) => s + d.dailyCost, 0);
  const totalCalories = days.reduce((s,d) => s + d.dailyCalories, 0);
  const avgCalories = Math.round(totalCalories / 7);
  return { totalCost, totalCalories, avgCalories };
}

function generateWeeklyMealPlan(profile) {
  const desayunos = filterRecipes(RECETAS.desayuno, profile);
  const almuerzos = filterRecipes(RECETAS.almuerzo, profile);
  const cenas     = filterRecipes(RECETAS.cena, profile);
  const totalWeeklyBudget = getTotalWeeklyBudget(profile);
  const minimumDayCostPerPerson = getMinimumDayCostPerPerson(desayunos, almuerzos, cenas);
  const minimumWeeklyCost = minimumDayCostPerPerson * profile.people * DAYS.length;

  if (totalWeeklyBudget < minimumWeeklyCost) {
    return {
      days: [],
      totalCost: 0,
      totalCalories: 0,
      avgCalories: 0,
      profile,
      withinBudget: false,
      minimumWeeklyCost,
      budgetShortfall: minimumWeeklyCost - totalWeeklyBudget,
    };
  }

  let remainingBudget = totalWeeklyBudget;
  const usedRecipeIds = new Set();

  const days = DAYS.map((day, i) => {
    const remainingDays = DAYS.length - i;
    const minimumFutureCost = minimumDayCostPerPerson * profile.people * (remainingDays - 1);
    const maxAllowedForDayTotal = Math.max(remainingBudget - minimumFutureCost, 0);
    const targetDailyBudgetTotal = remainingDays > 0 ? Math.min(remainingBudget / remainingDays, maxAllowedForDayTotal) : remainingBudget;
    const targetDailyBudgetPerPerson = profile.people > 0
      ? (targetDailyBudgetTotal / profile.people)
      : targetDailyBudgetTotal;

    const { breakfast, lunch, dinner } = pickAffordableDay(
      desayunos,
      almuerzos,
      cenas,
      targetDailyBudgetPerPerson,
      { usedRecipeIds }
    );

    const dayPlan = buildDayPlan(day, i, breakfast, lunch, dinner, profile.people);
    remainingBudget = Math.max(remainingBudget - dayPlan.dailyCost, 0);

    usedRecipeIds.add(getRecipeId(breakfast, 'desayuno'));
    usedRecipeIds.add(getRecipeId(lunch, 'comida'));
    usedRecipeIds.add(getRecipeId(dinner, 'cena'));

    return dayPlan;
  });

  const { totalCost, totalCalories, avgCalories } = summarizeMealPlan(days);

  return {
    days,
    totalCost,
    totalCalories,
    avgCalories,
    profile,
    withinBudget: totalCost <= totalWeeklyBudget,
    minimumWeeklyCost,
    budgetShortfall: Math.max(totalCost - totalWeeklyBudget, 0),
  };
}
function initParticles() {
  const container = document.getElementById('particles-container');
  if (!container) return;
  const count = 25;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (6 + Math.random() * 8) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
    p.style.background = Math.random() > 0.5 ? 'var(--accent-1)' : 'var(--accent-2)';
    container.appendChild(p);
  }
}
document.addEventListener('DOMContentLoaded', async () => {
  initParticles();
  await loadRecipesFromAPI();

  let currentPeople = 1;
  const $ = id => document.getElementById(id);
  const budgetInput    = $('budget');
  const budgetValue    = $('budget-value');
  const peopleButtons  = document.querySelectorAll('#people-group .toggle-btn');
  const form           = $('preferences-form');
  const prefSection    = $('preferences-section');
  const resultsSection = $('results-section');
  const planContent    = $('plan-content');
  const planNotice     = $('plan-notice');
  const shoppingContent= $('shopping-content');
  const trackingContent= $('tracking-content');
  const tabBtns        = document.querySelectorAll('#results-section .tab-btn');
  const authSection    = $('auth-section');
  const appShell       = $('app-shell');
  const authMessage    = $('auth-message');
  const loginForm      = $('login-form');
  const registerForm   = $('register-form');
  const goRegisterBtn  = $('go-register');
  const goLoginBtn     = $('go-login');
  const regPhoneInput  = $('reg-phone');

  const userMenu       = $('user-menu');
  const userMenuToggle = $('user-menu-toggle');
  const userMenuDropdown = $('user-menu-dropdown');
  const accountBtn     = $('btn-account');
  const logoutBtn      = $('btn-logout');
  let currentUser = null;

  async function postToAPI(endpoint, body) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.message || 'Error de comunicación con el servidor.');
    return data;
  }

  async function saveTrackingPlan(mealPlan) {
    if (!trackingContent) return;
    if (mealPlan.withinBudget === false) return;

    if (!currentUser?.premium) {
      trackingContent.innerHTML = `
        <div class="day-card">
          <h3>Seguimiento premium</h3>
          <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem">Activa premium para guardar y visualizar gastos diarios, semanales y mensuales.</p>
        </div>`;
      return;
    }

    try {
      const resumen = await postToAPI('/tracking/plan', {
        usuarioEmail: currentUser.email,
        fechaInicio: new Date().toISOString(),
        gastosDiarios: mealPlan.days.map(d => Number(d.dailyCost.toFixed(2))),
        gastoSemanal: Number(mealPlan.totalCost.toFixed(2)),
      });
      renderTracking(resumen);
    } catch (error) {
      trackingContent.innerHTML = `<p class="error">${error.message}</p>`;
    }
  }

  function showPlanNotice(message) {
    if (!planNotice) return;
    planNotice.textContent = message;
    planNotice.classList.remove('hidden');
  }

  function clearPlanNotice() {
    if (!planNotice) return;
    planNotice.textContent = '';
    planNotice.classList.add('hidden');
  }

  let trackingChartInstance = null;
  let trackingResumenCache = null;

  function renderTracking(resumen) {
    trackingResumenCache = resumen;

    trackingContent.innerHTML = `
      <div class="day-card tracking-chart-card">
        <div class="tracking-header">
          <h3>Seguimiento de precios</h3>
          <div class="tracking-view-selector" id="tracking-view-selector">
            <button type="button" class="tracking-view-btn active" data-view="dia">Día</button>
            <button type="button" class="tracking-view-btn" data-view="semana">Semana</button>
            <button type="button" class="tracking-view-btn" data-view="mes">Mes</button>
          </div>
        </div>
        <div class="tracking-summary" id="tracking-summary"></div>
        <div class="tracking-chart-wrapper">
          <canvas id="tracking-chart"></canvas>
        </div>
      </div>`;

    document.querySelectorAll('#tracking-view-selector .tracking-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#tracking-view-selector .tracking-view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateTrackingChart(btn.dataset.view);
      });
    });

    updateTrackingChart('dia');
  }

  function updateTrackingChart(view) {
    const resumen = trackingResumenCache;
    if (!resumen) return;

    const canvas = document.getElementById('tracking-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let dataPoints, labels, labelTitle, accentColor, gradientTop, gradientBottom;

    if (view === 'dia') {
      const items = (resumen.diarios || []).slice(-14);
      labels = items.map(i => new Date(i.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }));
      dataPoints = items.map(i => Number(i.gasto) || 0);
      labelTitle = 'Gasto diario (€)';
      accentColor = 'rgba(34, 211, 238, 1)';
      gradientTop = 'rgba(34, 211, 238, 0.35)';
      gradientBottom = 'rgba(34, 211, 238, 0.02)';
    } else if (view === 'semana') {
      const items = (resumen.semanales || []).slice(-12);
      labels = items.map(i => {
        const d = new Date(i.fecha);
        return 'Sem ' + d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      });
      dataPoints = items.map(i => Number(i.gasto) || 0);
      labelTitle = 'Gasto semanal (€)';
      accentColor = 'rgba(167, 139, 250, 1)';
      gradientTop = 'rgba(167, 139, 250, 0.35)';
      gradientBottom = 'rgba(167, 139, 250, 0.02)';
    } else {
      const items = (resumen.mensuales || []).slice(-6);
      labels = items.map(i => new Date(i.fecha).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
      dataPoints = items.map(i => Number(i.gasto) || 0);
      labelTitle = 'Gasto mensual (€)';
      accentColor = 'rgba(52, 211, 153, 1)';
      gradientTop = 'rgba(52, 211, 153, 0.35)';
      gradientBottom = 'rgba(52, 211, 153, 0.02)';
    }

    const summaryEl = document.getElementById('tracking-summary');
    if (summaryEl && dataPoints.length > 0) {
      const total = dataPoints.reduce((a, b) => a + b, 0);
      const avg = total / dataPoints.length;
      const max = Math.max(...dataPoints);
      const min = Math.min(...dataPoints);
      const viewLabels = { dia: 'Día', semana: 'Semana', mes: 'Mes' };
      summaryEl.innerHTML = `
        <div class="tracking-stat">
          <span class="tracking-stat-label">Promedio</span>
          <span class="tracking-stat-value">€${avg.toFixed(2)}</span>
        </div>
        <div class="tracking-stat">
          <span class="tracking-stat-label">Máximo</span>
          <span class="tracking-stat-value">€${max.toFixed(2)}</span>
        </div>
        <div class="tracking-stat">
          <span class="tracking-stat-label">Mínimo</span>
          <span class="tracking-stat-value">€${min.toFixed(2)}</span>
        </div>
        <div class="tracking-stat">
          <span class="tracking-stat-label">Registros</span>
          <span class="tracking-stat-value">${dataPoints.length}</span>
        </div>`;
    } else if (summaryEl) {
      summaryEl.innerHTML = '';
    }

    if (dataPoints.length === 0) {
      if (trackingChartInstance) { trackingChartInstance.destroy(); trackingChartInstance = null; }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(100,116,139,0.6)';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos todavía para esta vista.', canvas.width / 2, canvas.height / 2);
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight || 300);
    gradient.addColorStop(0, gradientTop);
    gradient.addColorStop(1, gradientBottom);

    const chartData = {
      labels,
      datasets: [{
        label: labelTitle,
        data: dataPoints,
        fill: true,
        backgroundColor: gradient,
        borderColor: accentColor,
        borderWidth: 2.5,
        pointBackgroundColor: accentColor,
        pointBorderColor: 'rgba(10, 14, 26, 1)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: accentColor,
        pointHoverBorderWidth: 3,
        tension: 0.4,
      }]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          padding: 12,
          titleFont: { family: 'Inter', weight: '600', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          displayColors: false,
          callbacks: {
            title: (items) => items[0].label,
            label: (item) => `  €${item.raw.toFixed(2)}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: {
            color: 'rgba(100,116,139,0.8)',
            font: { family: 'Inter', size: 11 },
            maxRotation: 45,
            autoSkip: true,
            maxTicksLimit: 10,
          },
          border: { display: false }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: {
            color: 'rgba(100,116,139,0.8)',
            font: { family: 'Inter', size: 11 },
            callback: (v) => '€' + v.toFixed(0),
          },
          border: { display: false },
          beginAtZero: true,
        }
      },
      animation: {
        duration: 700,
        easing: 'easeOutQuart',
      }
    };

    if (trackingChartInstance) {
      trackingChartInstance.destroy();
      trackingChartInstance = null;
    }

    trackingChartInstance = new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: chartOptions,
    });
  }

  function showAuthMessage(msg, isError = false) {
    authMessage.textContent = msg;
    authMessage.classList.toggle('error', isError);
    authMessage.classList.toggle('success', !isError);
  }

  function switchAuthView(target) {
    loginForm.classList.toggle('hidden', target !== 'login');
    registerForm.classList.toggle('hidden', target === 'login');
    showAuthMessage('');
  }

  function closeUserMenu() { userMenuDropdown.classList.add('hidden'); }

  function updateUserMenu(user) {
    if (!user) {
      userMenuToggle.textContent = 'Mi perfil';
      return;
    }
    userMenuToggle.textContent = user.premium ? `Premium: ${user.nombreUsuario}` : `Mi perfil: ${user.nombreUsuario}`;
  }

  function unlockApp() {
    authSection.classList.add('hidden');
    appShell.classList.remove('hidden');
    userMenu.classList.remove('hidden');
  }

  function lockApp() {
    appShell.classList.add('hidden');
    resultsSection.classList.add('hidden');
    prefSection.classList.remove('hidden');
    authSection.classList.remove('hidden');
    if (trackingChartInstance) { trackingChartInstance.destroy(); trackingChartInstance = null; }
    if (trackingContent) trackingContent.innerHTML = '';
    loginForm.reset();
    registerForm.reset();
    switchAuthView('login');
    closeUserMenu();
    userMenu.classList.add('hidden');
  }
  goRegisterBtn.addEventListener('click', () => switchAuthView('register'));
  goLoginBtn.addEventListener('click', () => switchAuthView('login'));
  userMenuToggle.addEventListener('click', () => userMenuDropdown.classList.toggle('hidden'));
  accountBtn.addEventListener('click', () => closeUserMenu());
  logoutBtn.addEventListener('click', () => { currentUser = null; lockApp(); });
  document.addEventListener('click', e => { if (!userMenu.contains(e.target)) closeUserMenu(); });

  regPhoneInput.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
  });

  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const phoneValue = regPhoneInput.value.trim();
    if (phoneValue.length !== 9) { showAuthMessage('El teléfono debe tener exactamente 9 números.', true); return; }

    const newUser = {
      nombre: $('reg-name').value.trim(),
      apellido1: $('reg-lastname1').value.trim(),
      apellido2: $('reg-lastname2').value.trim(),
      nombreUsuario: $('reg-username').value.trim(),
      email: $('reg-email').value.trim().toLowerCase(),
      telefono: phoneValue,
      contrasena: $('reg-password').value,
    };

    try {
      await postToAPI('/usuarios/registro', newUser);
      registerForm.reset();
      switchAuthView('login');
      showAuthMessage('Cuenta creada. Ahora inicia sesión.', false);
    } catch (error) {
      showAuthMessage(error.message, true);
    }
  });

  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = $('login-username').value.trim();
    const password = $('login-password').value;

    try {
      currentUser = await postToAPI('/usuarios/login', {
        usuarioOEmail: username,
        contrasena: password,
      });
      updateUserMenu(currentUser);
      showAuthMessage('');
      unlockApp();
    } catch (error) {
      showAuthMessage(error.message, true);
    }
  });

  function handleGoogleSignIn(response) {
    if (!response?.credential) {
      showAuthMessage('Google no devolvió credenciales. Inténtalo de nuevo.', true);
      return;
    }

    postToAPI('/usuarios/google', {
      credential: response.credential
    }).then(user => {
      currentUser = user;
      updateUserMenu(currentUser);
      showAuthMessage('');
      unlockApp();
    }).catch(error => showAuthMessage(error.message, true));
  }

  let googleInitialized = false;
  async function initGoogleSignIn() {
    if (googleInitialized) return;
    const clientId = await loadGoogleClientId();
    if (!clientId) {
      showAuthMessage('Google Sign-In no está configurado. Define Authentication:Google:ClientId o GOOGLE_CLIENT_ID en la API.', true);
      return;
    }
    if (typeof google === 'undefined' || !google.accounts) return;

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleGoogleSignIn,
      auto_select: false,
      use_fedcm_for_prompt: false,
    });

    renderGoogleButton('btn-google-login');
    renderGoogleButton('btn-google-register');

    googleInitialized = true;
  }

  function renderGoogleButton(elementId) {
    const container = $(elementId);
    if (!container || container.dataset.googleRendered === 'true') return;

    container.innerHTML = '';
    google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: elementId === 'btn-google-register' ? 'signup_with' : 'signin_with',
      shape: 'rectangular',
      width: Math.min(container.clientWidth || 320, 400),
    });
    container.dataset.googleRendered = 'true';
  }

  function waitForGoogleAndInit() {
    if (typeof google !== 'undefined' && google.accounts) {
      initGoogleSignIn();
    } else {
      setTimeout(waitForGoogleAndInit, 200);
    }
  }
  waitForGoogleAndInit();

  switchAuthView('login');
  budgetInput.addEventListener('input', e => budgetValue.textContent = e.target.value);

  peopleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      peopleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeople = parseInt(btn.dataset.val);
    });
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const profile = {
      weeklyBudget: parseFloat(budgetInput.value),
      people: currentPeople,
      dietType: $('diet-type').value
    };
    prefSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    planContent.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Generando tu plan perfecto...</p>
      </div>`;

    setTimeout(() => {
      const mealPlan = generateWeeklyMealPlan(profile);
      renderResults(mealPlan);
      saveTrackingPlan(mealPlan);
    }, 700);
  });
  $('btn-reset').addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    prefSection.classList.remove('hidden');
    clearPlanNotice();
  });
  tabBtns.forEach(btn => {
    btn.addEventListener('click', e => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
      $(e.target.dataset.target).classList.remove('hidden');
    });
  });
  function renderResults(mealPlan) {
    const { days, totalCost, avgCalories, profile } = mealPlan;
    const totalBudget = getTotalWeeklyBudget(profile);
    const budgetPct = totalBudget > 0 ? Math.min((totalCost / totalBudget) * 100, 100) : 100;
    const remaining = Math.max(totalBudget - totalCost, 0);
    if (mealPlan.withinBudget === false) {
      clearPlanNotice();
      $('summary-text').textContent =
        `${profile.people} persona${profile.people > 1 ? 's' : ''} · €${profile.weeklyBudget}/persona · dieta ${profile.dietType}`;
      $('stats-grid').innerHTML = `
        <div class="stat-card">
          <div class="stat-icon"></div>
          <div class="stat-value">€${totalBudget.toFixed(2)}</div>
          <div class="stat-label">Presupuesto actual</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"></div>
          <div class="stat-value">€${mealPlan.minimumWeeklyCost.toFixed(2)}</div>
          <div class="stat-label">Mínimo posible</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"></div>
          <div class="stat-value">€${mealPlan.budgetShortfall.toFixed(2)}</div>
          <div class="stat-label">Faltan</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon"></div>
          <div class="stat-value">7</div>
          <div class="stat-label">Días solicitados</div>
        </div>
      `;
      $('budget-bar-container').innerHTML = `
        <div class="day-card">
          <h3>Presupuesto insuficiente</h3>
          <p style="color:var(--text-muted);font-size:0.95rem;margin-top:0.5rem">
            No existe un menú semanal completo de 7 días que respete ese presupuesto con las recetas disponibles.
            El mínimo posible para este perfil es €${mealPlan.minimumWeeklyCost.toFixed(2)}.
          </p>
        </div>
      `;
      planContent.innerHTML = `
        <div class="day-card">
          <h3>No se ha generado el menú</h3>
          <p style="color:var(--text-muted);font-size:0.95rem;margin-top:0.5rem">
            Ajusta el presupuesto o el número de personas para que el plan semanal pueda construirse sin sobrepasarlo.
          </p>
        </div>
      `;
      shoppingContent.innerHTML = `
        <div class="day-card">
          <h3>Lista de la compra no disponible</h3>
          <p style="color:var(--text-muted);font-size:0.95rem;margin-top:0.5rem">
            La lista se generará cuando exista un plan semanal completo dentro del presupuesto indicado.
          </p>
        </div>
      `;
      if (trackingContent) trackingContent.innerHTML = '';
      return;
    }
    clearPlanNotice();
    $('summary-text').textContent =
      `${profile.people} persona${profile.people > 1 ? 's' : ''} · €${profile.weeklyBudget}/persona · dieta ${profile.dietType}`;
    $('stats-grid').innerHTML = `
      <div class="stat-card">
        <div class="stat-icon"></div>
        <div class="stat-value">€${totalCost.toFixed(2)}</div>
        <div class="stat-label">Coste total</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"></div>
        <div class="stat-value">€${remaining.toFixed(2)}</div>
        <div class="stat-label">Restante</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"></div>
        <div class="stat-value">${avgCalories}</div>
        <div class="stat-label">kcal est. / día</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"></div>
        <div class="stat-value">${days.length * 3}</div>
        <div class="stat-label">Comidas planificadas</div>
      </div>
    `;
    const barColor = budgetPct > 90 ? 'var(--gradient-warm)' : 'var(--gradient-main)';
    $('budget-bar-container').innerHTML = `
      <div class="budget-bar-header">
        <span>Presupuesto utilizado</span>
        <span>€${totalCost.toFixed(2)} / €${totalBudget.toFixed(2)}</span>
      </div>
      <div class="budget-bar">
        <div class="budget-bar-fill" style="width:0%;background:${barColor}"></div>
      </div>
    `;
    requestAnimationFrame(() => {
      setTimeout(() => {
        const fill = document.querySelector('.budget-bar-fill');
        if (fill) fill.style.width = budgetPct + '%';
      }, 100);
    });
    planContent.innerHTML = days.map(day => `
      <div class="day-card">
        <div class="day-card-header">
          <h3>
            <span>${day.emoji} ${day.day}</span>
            <span class="day-price">€${day.dailyCost.toFixed(2)} · ${day.dailyCalories} kcal est.</span>
          </h3>
          <button class="btn-change-day" data-day="${day.day}">Cambiar día</button>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.desayuno}</span><strong>Desayuno:</strong> ${day.breakfast.nombre}</div>
          <div class="meal-calories">${day.breakfast.kcal} kcal est. · €${day.breakfast.totalCost.toFixed(2)}</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.almuerzo}</span><strong>Almuerzo:</strong> ${day.lunch.nombre}</div>
          <div class="meal-calories">${day.lunch.kcal} kcal est. · €${day.lunch.totalCost.toFixed(2)}</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.cena}</span><strong>Cena:</strong> ${day.dinner.nombre}</div>
          <div class="meal-calories">${day.dinner.kcal} kcal est. · €${day.dinner.totalCost.toFixed(2)}</div>
        </div>
      </div>
    `).join('');
    
    // Construir la lista de la compra parseando el string de ingredientes
    const ingredientsCount = {};
    let totalShoppingCost = 0;
    
    days.forEach(day => {
      [day.breakfast, day.lunch, day.dinner].forEach(meal => {
        // Si el backend no incluye ingredientes, los inferimos desde el nombre.
        const ingrStr = meal.ingredientes || extractIngredientsFromName(meal.nombre || meal.Nombre || '');
        if (ingrStr) {
           ingrStr.split(',').forEach(ing => {
               const name = ing.trim();
               if (!name) return;
               ingredientsCount[name] = (ingredientsCount[name] || 0) + 1;
           });
        }
      });
    });

    const uniqueIngredients = Object.keys(ingredientsCount).sort();

    shoppingContent.innerHTML = `
      <div class="day-card" style="margin-bottom:1rem">
        <h3>Lista de la compra: ${uniqueIngredients.length} ingredientes diferentes</h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem">Coste total estimado: €${totalCost.toFixed(2)}</p>
      </div>
      <div class="shopping-grid">
        ${uniqueIngredients.map(item => `
          <div class="shopping-item">
            <span class="item-dot"></span>
            <span>${item} <small style="color:var(--text-muted)">(x${ingredientsCount[item] * profile.people})</small></span>
          </div>
        `).join('')}
      </div>
    `;

    document.querySelectorAll('.btn-change-day').forEach(btn => {
      btn.addEventListener('click', async e => {
        const dayToChange = e.target.dataset.day;
        const dayIndex = DAYS.indexOf(dayToChange);
        if (dayIndex === -1) return;

        const desayunos = filterRecipes(RECETAS.desayuno, profile);
        const almuerzos = filterRecipes(RECETAS.almuerzo, profile);
        const cenas = filterRecipes(RECETAS.cena, profile);
        const minimumDayCostPerPerson = getMinimumDayCostPerPerson(desayunos, almuerzos, cenas);
        const otherDaysCost = mealPlan.totalCost - mealPlan.days[dayIndex].dailyCost;
        const remainingBudgetForDay = Math.max(getTotalWeeklyBudget(profile) - otherDaysCost, 0);
        if (remainingBudgetForDay < minimumDayCostPerPerson * profile.people) {
          showPlanNotice(`No hay otra opción para ${dayToChange} sin superar el presupuesto disponible.`);
          return;
        }
        const dailyBudgetPerPerson = remainingBudgetForDay / profile.people;
        const currentComboKey = getComboKey({
          breakfast: mealPlan.days[dayIndex].breakfast,
          lunch: mealPlan.days[dayIndex].lunch,
          dinner: mealPlan.days[dayIndex].dinner,
        });
        const { breakfast, lunch, dinner } = pickAffordableDay(
          desayunos,
          almuerzos,
          cenas,
          dailyBudgetPerPerson,
          {
            excludedComboKey: currentComboKey,
            usedRecipeIds: new Set(
              mealPlan.days
                .filter((_, index) => index !== dayIndex)
                .flatMap(existingDay => ([
                  getRecipeId(existingDay.breakfast, 'desayuno'),
                  getRecipeId(existingDay.lunch, 'comida'),
                  getRecipeId(existingDay.dinner, 'cena'),
                ]))
            )
          }
        );

        const nextComboKey = getComboKey({ breakfast, lunch, dinner });
        if (nextComboKey === currentComboKey) {
          showPlanNotice(`No hay otra opción disponible para ${dayToChange} con ese presupuesto.`);
          return;
        }

        mealPlan.days[dayIndex] = buildDayPlan(dayToChange, dayIndex, breakfast, lunch, dinner, profile.people);
        const summary = summarizeMealPlan(mealPlan.days);
        mealPlan.totalCost = summary.totalCost;
        mealPlan.totalCalories = summary.totalCalories;
        mealPlan.avgCalories = summary.avgCalories;
        mealPlan.withinBudget = mealPlan.totalCost <= getTotalWeeklyBudget(profile);
        mealPlan.budgetShortfall = Math.max(mealPlan.totalCost - getTotalWeeklyBudget(profile), 0);
        clearPlanNotice();
        renderResults(mealPlan);
        saveTrackingPlan(mealPlan);
      });
    });
  }
});

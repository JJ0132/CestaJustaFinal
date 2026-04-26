const RECETAS = {
  desayuno: [],
  almuerzo: [],
  cena: [],
};

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_EMOJIS = ['','','','','','',''];
const MEAL_ICONS = { desayuno:'', almuerzo:'', cena:'' };
const API_BASE_URL = 'http://localhost:5088/api';
const GOOGLE_CLIENT_ID = window.GOOGLE_CLIENT_ID || '';

async function fetchFromAPI(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);
  if (!response.ok) throw new Error(`API error ${response.status} on ${endpoint}`);
  return response.json();
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

function pickAffordableDay(desayunos, almuerzos, cenas, dailyBudgetPerPerson, options = {}) {
  const usedRecipeIds = options.usedRecipeIds || new Set();
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
    const repetitionPenalty = [
      getRecipeId(combo.breakfast, 'desayuno'),
      getRecipeId(combo.lunch, 'comida'),
      getRecipeId(combo.dinner, 'cena'),
    ].reduce((penalty, id) => penalty + (usedRecipeIds.has(id) ? 1 : 0), 0);

    return {
      cost,
      repetitionPenalty,
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
  let remainingBudget = totalWeeklyBudget;
  const usedRecipeIds = new Set();

  const days = DAYS.map((day, i) => {
    const remainingDays = DAYS.length - i;
    const targetDailyBudgetTotal = remainingDays > 0 ? (remainingBudget / remainingDays) : remainingBudget;
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

  return { days, totalCost, totalCalories, avgCalories, profile };
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

  function renderTracking(resumen) {
    const renderBars = (items, labelFormatter) => {
      if (!items?.length) return '<p style="color:var(--text-muted);font-size:0.9rem">Sin datos todavía.</p>';
      const max = Math.max(...items.map(i => Number(i.gasto) || 0), 1);
      return items.slice(-12).map(item => {
        const gasto = Number(item.gasto) || 0;
        const width = Math.max((gasto / max) * 100, 4);
        return `
          <div class="shopping-item" style="display:block">
            <div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:0.35rem">
              <span>${labelFormatter(item.fecha)}</span>
              <strong>€${gasto.toFixed(2)}</strong>
            </div>
            <div class="budget-bar"><div class="budget-bar-fill" style="width:${width}%"></div></div>
          </div>`;
      }).join('');
    };

    const formatDay = date => new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    const formatMonth = date => new Date(date).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

    trackingContent.innerHTML = `
      <div class="day-card">
        <h3>Gastos diarios</h3>
        <div class="shopping-grid" style="margin-top:0.8rem">${renderBars(resumen.diarios, formatDay)}</div>
      </div>
      <div class="day-card">
        <h3>Gastos semanales</h3>
        <div class="shopping-grid" style="margin-top:0.8rem">${renderBars(resumen.semanales, formatDay)}</div>
      </div>
      <div class="day-card">
        <h3>Gastos mensuales</h3>
        <div class="shopping-grid" style="margin-top:0.8rem">${renderBars(resumen.mensuales, formatMonth)}</div>
      </div>`;
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

  function decodeJwtPayload(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join('')
    );
    return JSON.parse(jsonPayload);
  }

  function handleGoogleSignIn(response) {
    const payload = decodeJwtPayload(response.credential);
    const googleEmail = payload.email;
    const googleName = payload.given_name || payload.name || 'Usuario';
    const googleLastName = payload.family_name || '';
    const googlePicture = payload.picture || '';

    postToAPI('/usuarios/google', {
      email: googleEmail,
      nombre: googleName,
      apellido1: googleLastName,
      apellido2: ''
    }).then(user => {
      currentUser = user;
      updateUserMenu(currentUser);
      showAuthMessage('');
      unlockApp();
    }).catch(error => showAuthMessage(error.message, true));
  }

  let googleInitialized = false;
  function initGoogleSignIn() {
    if (googleInitialized) return;
    if (!GOOGLE_CLIENT_ID) return;
    if (typeof google === 'undefined' || !google.accounts) return;

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      auto_select: false,
      use_fedcm_for_prompt: false,
    });

    const hiddenGoogleDiv = document.createElement('div');
    hiddenGoogleDiv.id = 'google-hidden-btn';
    hiddenGoogleDiv.style.position = 'fixed';
    hiddenGoogleDiv.style.top = '-9999px';
    hiddenGoogleDiv.style.left = '-9999px';
    hiddenGoogleDiv.style.opacity = '0.01';
    hiddenGoogleDiv.style.pointerEvents = 'none';
    document.body.appendChild(hiddenGoogleDiv);

    google.accounts.id.renderButton(hiddenGoogleDiv, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      width: 300,
    });

    googleInitialized = true;
  }

  function triggerGoogleSignIn() {
    if (!GOOGLE_CLIENT_ID) {
      showAuthMessage('Google Sign-In no está configurado todavía.', true);
      return;
    }

    if (typeof google === 'undefined' || !google.accounts) {
      showAuthMessage('Google Sign-In no se ha cargado. Recarga la página.', true);
      return;
    }

    initGoogleSignIn();

    const hiddenDiv = document.getElementById('google-hidden-btn');
    if (hiddenDiv) {
      const googleIframe = hiddenDiv.querySelector('iframe');
      if (googleIframe) {
        hiddenDiv.style.position = 'fixed';
        hiddenDiv.style.top = '50%';
        hiddenDiv.style.left = '50%';
        hiddenDiv.style.transform = 'translate(-50%, -50%)';
        hiddenDiv.style.opacity = '1';
        hiddenDiv.style.pointerEvents = 'auto';
        hiddenDiv.style.zIndex = '10000';
        hiddenDiv.style.background = 'var(--bg-card-solid)';
        hiddenDiv.style.padding = '2rem';
        hiddenDiv.style.borderRadius = '1rem';
        hiddenDiv.style.border = '1px solid var(--glass-border)';
        hiddenDiv.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';

        const overlay = document.createElement('div');
        overlay.id = 'google-overlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.zIndex = '9999';
        document.body.appendChild(overlay);

        overlay.addEventListener('click', () => {
          hiddenDiv.style.position = 'fixed';
          hiddenDiv.style.top = '-9999px';
          hiddenDiv.style.left = '-9999px';
          hiddenDiv.style.opacity = '0.01';
          hiddenDiv.style.pointerEvents = 'none';
          hiddenDiv.style.zIndex = '';
          hiddenDiv.style.background = '';
          hiddenDiv.style.padding = '';
          hiddenDiv.style.borderRadius = '';
          hiddenDiv.style.border = '';
          hiddenDiv.style.boxShadow = '';
          hiddenDiv.style.transform = '';
          overlay.remove();
        });

        return;
      }
    }

    showAuthMessage('Error al cargar Google Sign-In. Recarga la página.', true);
  }

  const btnGoogleLogin = $('btn-google-login');
  const btnGoogleRegister = $('btn-google-register');
  if (btnGoogleLogin) btnGoogleLogin.addEventListener('click', triggerGoogleSignIn);
  if (btnGoogleRegister) btnGoogleRegister.addEventListener('click', triggerGoogleSignIn);

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

        const otherDaysCost = mealPlan.totalCost - mealPlan.days[dayIndex].dailyCost;
        const remainingBudgetForDay = Math.max(getTotalWeeklyBudget(profile) - otherDaysCost, 0);
        const dailyBudgetPerPerson = remainingBudgetForDay / profile.people;
        const { breakfast, lunch, dinner } = pickAffordableDay(
          filterRecipes(RECETAS.desayuno, profile),
          filterRecipes(RECETAS.almuerzo, profile),
          filterRecipes(RECETAS.cena, profile),
          dailyBudgetPerPerson,
          {
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

        mealPlan.days[dayIndex] = buildDayPlan(dayToChange, dayIndex, breakfast, lunch, dinner, profile.people);
        const summary = summarizeMealPlan(mealPlan.days);
        mealPlan.totalCost = summary.totalCost;
        mealPlan.totalCalories = summary.totalCalories;
        mealPlan.avgCalories = summary.avgCalories;
        renderResults(mealPlan);
        saveTrackingPlan(mealPlan);
      });
    });
  }
});

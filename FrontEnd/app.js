const foodDatabase = [];
const RECETAS = {
  desayuno: [],
  almuerzo: [],
  cena: [],
};

const DAYS = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
const DAY_EMOJIS = ['','','','','','',''];
const MEAL_ICONS = { desayuno:'', almuerzo:'', cena:'' };
const USERS_STORAGE_KEY = 'cestajusta_users';
const CURRENT_USER_STORAGE_KEY = 'cestajusta_current_user';
const INTOLERANCE_LABELS = {
  alergias:'Alergias alimentarias',
  lactosa:'Intolerancia a la lactosa',
  soja:'Alergia o intolerancia a la soja',
  diabetes:'Diabetes',
  hipertension:'Hipertensión',
  otras:'Otras necesidades dietéticas',
};
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function filterRecipes(recipes, profile) {
  const sel = profile.intolerances || [];
  return recipes.filter(recipe => {
    const recipeFoods = recipe.foods.map(id => foodDatabase.find(f => f.id === id)).filter(Boolean);
    for (const food of recipeFoods) {
      if (profile.dietType === 'vegetariano' && ['Pechuga de Pollo','Merluza fresca','Atún en conserva','Pechuga de Pavo'].includes(food.name)) return false;
      if (profile.dietType === 'vegano' && (food.category === 'lacteo' || ['Pechuga de Pollo','Merluza fresca','Atún en conserva','Pechuga de Pavo','Huevos camperos','Queso fresco'].includes(food.name))) return false;
      if (sel.includes('alergias') && food.allergens.length > 0) return false;
      if (sel.includes('lactosa') && food.allergens.includes('lactosa')) return false;
      if (sel.includes('soja') && food.allergens.includes('soja')) return false;
    }
    return true;
  });
}

function generateWeeklyMealPlan(profile) {
  const dailyBudget = profile.weeklyBudget / 7;

  const desayunos = filterRecipes(RECETAS.desayuno, profile);
  const almuerzos = filterRecipes(RECETAS.almuerzo, profile);
  const cenas     = filterRecipes(RECETAS.cena, profile);

  const dShuffled = shuffle(desayunos.length ? desayunos : RECETAS.desayuno);
  const aShuffled = shuffle(almuerzos.length ? almuerzos : RECETAS.almuerzo);
  const cShuffled = shuffle(cenas.length ? cenas : RECETAS.cena);

  const days = DAYS.map((day, i) => {
    const breakfast = dShuffled[i % dShuffled.length];
    const lunch     = aShuffled[i % aShuffled.length];
    const dinner    = cShuffled[i % cShuffled.length];

    const bFoods = breakfast.foods.map(id => foodDatabase.find(f => f.id === id)).filter(Boolean);
    const lFoods = lunch.foods.map(id => foodDatabase.find(f => f.id === id)).filter(Boolean);
    const dFoods = dinner.foods.map(id => foodDatabase.find(f => f.id === id)).filter(Boolean);

    const bCost = bFoods.reduce((s,f) => s + f.price * 0.15, 0) * profile.people;
    const lCost = lFoods.reduce((s,f) => s + f.price * 0.2, 0) * profile.people;
    const dCost = dFoods.reduce((s,f) => s + f.price * 0.18, 0) * profile.people;

    return {
      day, emoji: DAY_EMOJIS[i],
      breakfast: { ...breakfast, totalCost: bCost, foods: bFoods },
      lunch:     { ...lunch,     totalCost: lCost, foods: lFoods },
      dinner:    { ...dinner,    totalCost: dCost, foods: dFoods },
      dailyCost: bCost + lCost + dCost,
      dailyCalories: breakfast.kcal + lunch.kcal + dinner.kcal,
    };
  });

  const totalCost = days.reduce((s,d) => s + d.dailyCost, 0);
  const totalCalories = days.reduce((s,d) => s + d.dailyCalories, 0);
  const avgCalories = Math.round(totalCalories / 7);

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
document.addEventListener('DOMContentLoaded', () => {
  initParticles();

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
  const tabBtns        = document.querySelectorAll('#results-section .tab-btn');
  const authSection    = $('auth-section');
  const appShell       = $('app-shell');
  const authMessage    = $('auth-message');
  const loginForm      = $('login-form');
  const registerForm   = $('register-form');
  const goRegisterBtn  = $('go-register');
  const goLoginBtn     = $('go-login');
  const regPhoneInput  = $('reg-phone');
  const intoleranceInputs = document.querySelectorAll('input[name="intolerance"]');
  const userMenu       = $('user-menu');
  const userMenuToggle = $('user-menu-toggle');
  const userMenuDropdown = $('user-menu-dropdown');
  const accountBtn     = $('btn-account');
  const logoutBtn      = $('btn-logout');
  function getStoredUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]'); }
    catch { return []; }
  }
  function saveUsers(users) { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)); }
  function getCurrentUser() { return localStorage.getItem(CURRENT_USER_STORAGE_KEY); }
  function setCurrentUser(u) { localStorage.setItem(CURRENT_USER_STORAGE_KEY, u); }
  function clearCurrentUser() { localStorage.removeItem(CURRENT_USER_STORAGE_KEY); }

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

  function updateUserMenu(username) {
    userMenuToggle.textContent = username ? `Mi perfil: ${username}` : 'Mi perfil';
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
  logoutBtn.addEventListener('click', () => { clearCurrentUser(); lockApp(); });
  document.addEventListener('click', e => { if (!userMenu.contains(e.target)) closeUserMenu(); });

  regPhoneInput.addEventListener('input', e => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
  });

  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const phoneValue = regPhoneInput.value.trim();
    if (phoneValue.length !== 9) { showAuthMessage('El teléfono debe tener exactamente 9 números.', true); return; }

    const newUser = {
      name: $('reg-name').value.trim(),
      lastName1: $('reg-lastname1').value.trim(),
      lastName2: $('reg-lastname2').value.trim(),
      username: $('reg-username').value.trim(),
      email: $('reg-email').value.trim().toLowerCase(),
      phone: phoneValue,
      password: $('reg-password').value,
    };

    const users = getStoredUsers();
    if (users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase())) {
      showAuthMessage('Ese nombre de usuario ya existe.', true); return;
    }
    if (users.some(u => u.email === newUser.email)) {
      showAuthMessage('Ese correo ya está registrado.', true); return;
    }

    users.push(newUser);
    saveUsers(users);
    registerForm.reset();
    switchAuthView('login');
    showAuthMessage('Cuenta creada. Ahora inicia sesión.', false);
  });

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = $('login-username').value.trim();
    const password = $('login-password').value;
    const match = getStoredUsers().find(u =>
      u.username.toLowerCase() === username.toLowerCase() && u.password === password
    );

    if (!match) { showAuthMessage('Usuario o contraseña incorrectos.', true); return; }

    setCurrentUser(match.username);
    updateUserMenu(match.username);
    showAuthMessage('');
    unlockApp();
  });

  switchAuthView('login');
  const currentUser = getCurrentUser();
  if (currentUser) { updateUserMenu(currentUser); unlockApp(); }
  budgetInput.addEventListener('input', e => budgetValue.textContent = e.target.value);

  peopleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      peopleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeople = parseInt(btn.dataset.val);
    });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const selectedIntolerances = Array.from(intoleranceInputs).filter(i => i.checked).map(i => i.value);

    const profile = {
      weeklyBudget: parseFloat(budgetInput.value),
      people: currentPeople,
      dietType: $('diet-type').value,
      intolerances: selectedIntolerances,
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
    }, 1200);
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
    const budgetPct = Math.min((totalCost / profile.weeklyBudget) * 100, 100);
    const remaining = Math.max(profile.weeklyBudget - totalCost, 0);
    const intoleranceText = profile.intolerances.length > 0
      ? ` · ${profile.intolerances.map(i => INTOLERANCE_LABELS[i]).join(', ')}`
      : '';
    $('summary-text').textContent =
      `${profile.people} persona${profile.people > 1 ? 's' : ''} · Dieta ${profile.dietType}${intoleranceText}`;
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
        <div class="stat-label">kcal / día</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon"></div>
        <div class="stat-value">${days.length * 3}</div>
        <div class="stat-label">Comidas</div>
      </div>
    `;
    const barColor = budgetPct > 90 ? 'var(--gradient-warm)' : 'var(--gradient-main)';
    $('budget-bar-container').innerHTML = `
      <div class="budget-bar-header">
        <span>Presupuesto utilizado</span>
        <span>€${totalCost.toFixed(2)} / €${profile.weeklyBudget}</span>
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
        <h3>
          <span>${day.emoji} ${day.day}</span>
          <span class="day-price">€${day.dailyCost.toFixed(2)} · ${day.dailyCalories} kcal</span>
        </h3>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.desayuno}</span><strong>Desayuno:</strong> ${day.breakfast.name}</div>
          <div class="meal-calories">${day.breakfast.kcal} kcal</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.almuerzo}</span><strong>Almuerzo:</strong> ${day.lunch.name}</div>
          <div class="meal-calories">${day.lunch.kcal} kcal</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.cena}</span><strong>Cena:</strong> ${day.dinner.name}</div>
          <div class="meal-calories">${day.dinner.kcal} kcal</div>
        </div>
      </div>
    `).join('');
    const ingredients = new Map();
    days.forEach(day => {
      [day.breakfast, day.lunch, day.dinner].forEach(meal => {
        meal.foods.forEach(f => {
          if (!ingredients.has(f.id)) {
            ingredients.set(f.id, { ...f, qty: 1 });
          } else {
            ingredients.get(f.id).qty++;
          }
        });
      });
    });

    const sortedIngredients = [...ingredients.values()].sort((a,b) => a.category.localeCompare(b.category));
    const totalShoppingCost = sortedIngredients.reduce((s,f) => s + f.price, 0);

    shoppingContent.innerHTML = `
      <div class="day-card" style="margin-bottom:1rem">
        <h3>Lista de la compra — ${sortedIngredients.length} productos · ~€${totalShoppingCost.toFixed(2)}</h3>
      </div>
      <div class="shopping-grid">
        ${sortedIngredients.map(item => `
          <div class="shopping-item">
            <span class="item-dot"></span>
            <span>${item.name} <small style="color:var(--text-muted)">(${item.unit})</small></span>
          </div>
        `).join('')}
      </div>
    `;
  }
});

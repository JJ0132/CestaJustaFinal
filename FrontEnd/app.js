// --- 1. BASE DE DATOS (Muestra adaptada de foodDatabase.ts) ---
const foodDatabase = [
  { id: 'p1', name: 'Pechuga de Pollo', category: 'proteina', price: 6.99, unit: 'kg', calories: 165, allergens: [] },
  { id: 'p6', name: 'Tofu', category: 'proteina', price: 2.80, unit: '400g', calories: 76, allergens: ['soja'] },
  { id: 'c1', name: 'Arroz Integral', category: 'carbohidrato', price: 2.20, unit: 'kg', calories: 111, allergens: [] },
  { id: 'v1', name: 'Brócoli', category: 'verdura', price: 2.50, unit: 'kg', calories: 34, allergens: [] },
  { id: 'f2', name: 'Manzanas', category: 'fruta', price: 2.00, unit: 'kg', calories: 52, allergens: [] },
  { id: 'l2', name: 'Yogur Natural', category: 'lacteo', price: 2.50, unit: '4 unid', calories: 59, allergens: ['lactosa'] },
  { id: 'g1', name: 'Aceite de Oliva', category: 'grasa', price: 5.50, unit: 'litro', calories: 884, allergens: [] },
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const USERS_STORAGE_KEY = 'cestajusta_users';
const CURRENT_USER_STORAGE_KEY = 'cestajusta_current_user';

// --- 2. LÓGICA DE NEGOCIO (Adaptada de mealPlanner.ts) ---
function generateWeeklyMealPlan(profile) {
  const dailyBudget = profile.weeklyBudget / 7 / profile.people;

  // Filtrado simple (omnívoro vs vegetariano/vegano)
  let availableFoods = foodDatabase.filter(food => {
    if (profile.dietType === 'vegetariano' && ['Pechuga de Pollo'].includes(food.name)) return false;
    if (profile.dietType === 'vegano' && ['Pechuga de Pollo', 'Yogur Natural'].includes(food.name)) return false;
    return true;
  });

  const days = DAYS.map(day => {
    const breakfast = generateMeal('desayuno', availableFoods, dailyBudget * 0.25);
    const lunch = generateMeal('almuerzo', availableFoods, dailyBudget * 0.4);
    const dinner = generateMeal('cena', availableFoods, dailyBudget * 0.35);

    return {
      day,
      breakfast, lunch, dinner,
      dailyCost: (breakfast.totalCost + lunch.totalCost + dinner.totalCost) * profile.people,
      dailyCalories: breakfast.totalCalories + lunch.totalCalories + dinner.totalCalories,
    };
  });

  const totalCost = days.reduce((sum, day) => sum + day.dailyCost, 0);
  return { days, totalCost, profile };
}

function generateMeal(mealType, availableFoods, budget) {
  const selectedFoods = [];
  let totalCost = 0; let totalCalories = 0;

  // Lógica simplificada de selección aleatoria (puedes ampliarla con tu lógica completa)
  const getFood = (cat) => availableFoods.find(f => f.category === cat) || availableFoods[0];

  if (mealType === 'desayuno') {
    selectedFoods.push(getFood('carbohidrato'), getFood('lacteo'));
  } else {
    selectedFoods.push(getFood('proteina'), getFood('verdura'));
  }

  selectedFoods.forEach(food => {
    totalCost += food.price * 0.15; // Estimación
    totalCalories += food.calories * 0.15;
  });

  return { name: `Comida de ${selectedFoods[0].name}`, foods: selectedFoods, totalCost, totalCalories };
}

// --- 3. CONTROLADORES DEL DOM ---
document.addEventListener('DOMContentLoaded', () => {
  // Variables de Estado
  let currentPeople = 1;

  // Elementos DOM
  const budgetInput = document.getElementById('budget');
  const budgetValue = document.getElementById('budget-value');
  const peopleButtons = document.querySelectorAll('#people-group .toggle-btn');
  const form = document.getElementById('preferences-form');
  const prefSection = document.getElementById('preferences-section');
  const resultsSection = document.getElementById('results-section');
  const planContent = document.getElementById('plan-content');
  const shoppingContent = document.getElementById('shopping-content');
  const tabBtns = document.querySelectorAll('#results-section .tab-btn');
  const authSection = document.getElementById('auth-section');
  const appShell = document.getElementById('app-shell');
  const authMessage = document.getElementById('auth-message');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const goRegisterBtn = document.getElementById('go-register');
  const goLoginBtn = document.getElementById('go-login');
  const regPhoneInput = document.getElementById('reg-phone');
  const userMenu = document.getElementById('user-menu');
  const userMenuToggle = document.getElementById('user-menu-toggle');
  const userMenuDropdown = document.getElementById('user-menu-dropdown');
  const accountBtn = document.getElementById('btn-account');
  const logoutBtn = document.getElementById('btn-logout');

  function getStoredUsers() {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      return usersRaw ? JSON.parse(usersRaw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  }

  function setCurrentUser(username) {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, username);
  }

  function clearCurrentUser() {
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  }

  function showAuthMessage(message, isError = false) {
    authMessage.textContent = message;
    authMessage.classList.toggle('error', isError);
    authMessage.classList.toggle('success', !isError);
  }

  function switchAuthView(target) {
    const showLogin = target === 'login';
    loginForm.classList.toggle('hidden', !showLogin);
    registerForm.classList.toggle('hidden', showLogin);
    showAuthMessage('', false);
  }

  function closeUserMenu() {
    userMenuDropdown.classList.add('hidden');
  }

  function updateUserMenu(username) {
    userMenuToggle.textContent = username ? username : 'Mi perfil';
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
  userMenuToggle.addEventListener('click', () => {
    userMenuDropdown.classList.toggle('hidden');
  });
  accountBtn.addEventListener('click', () => {
    closeUserMenu();
  });
  logoutBtn.addEventListener('click', () => {
    clearCurrentUser();
    lockApp();
  });

  document.addEventListener('click', (e) => {
    if (!userMenu.contains(e.target)) {
      closeUserMenu();
    }
  });

  // Solo permite digitos y un maximo de 9 en tiempo real.
  regPhoneInput.addEventListener('input', (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, '');
    e.target.value = onlyDigits.slice(0, 9);
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const phoneValue = regPhoneInput.value.trim();
    if (phoneValue.length !== 9) {
      showAuthMessage('El telefono debe tener exactamente 9 numeros.', true);
      return;
    }

    const newUser = {
      name: document.getElementById('reg-name').value.trim(),
      lastName1: document.getElementById('reg-lastname1').value.trim(),
      lastName2: document.getElementById('reg-lastname2').value.trim(),
      username: document.getElementById('reg-username').value.trim(),
      email: document.getElementById('reg-email').value.trim().toLowerCase(),
      phone: phoneValue,
      password: document.getElementById('reg-password').value,
    };

    const users = getStoredUsers();
    const usernameTaken = users.some(user => user.username.toLowerCase() === newUser.username.toLowerCase());
    const emailTaken = users.some(user => user.email === newUser.email);

    if (usernameTaken) {
      showAuthMessage('Ese nombre de usuario ya existe.', true);
      return;
    }

    if (emailTaken) {
      showAuthMessage('Ese correo ya esta registrado.', true);
      return;
    }

    users.push(newUser);
    saveUsers(users);
    registerForm.reset();
    switchAuthView('login');
    showAuthMessage('Cuenta creada. Ahora inicia sesion con tu usuario.', false);
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const users = getStoredUsers();
    const match = users.find(user => user.username.toLowerCase() === username.toLowerCase() && user.password === password);

    if (!match) {
      showAuthMessage('Usuario o contrasena incorrectos.', true);
      return;
    }

    setCurrentUser(match.username);
    updateUserMenu(match.username);
    showAuthMessage('Inicio de sesion correcto.', false);
    unlockApp();
  });

  switchAuthView('login');

  const currentUser = getCurrentUser();
  if (currentUser) {
    updateUserMenu(currentUser);
    unlockApp();
  }

  // Actualizar UI del rango de presupuesto
  budgetInput.addEventListener('input', (e) => budgetValue.textContent = e.target.value);

  // Manejar botones de personas (comportamiento tipo Radio)
  peopleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      peopleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeople = parseInt(btn.dataset.val);
    });
  });

  // Envío del Formulario
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const profile = {
      weeklyBudget: parseFloat(budgetInput.value),
      people: currentPeople,
      dietType: document.getElementById('diet-type').value,
    };

    const mealPlan = generateWeeklyMealPlan(profile);
    renderResults(mealPlan);
    
    // Cambiar vistas
    prefSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
  });

  // Botón "Nueva Configuración"
  document.getElementById('btn-reset').addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    prefSection.classList.remove('hidden');
  });

  // Navegación de Tabs (Plan vs Lista)
  tabBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.add('hidden'));
      document.getElementById(e.target.dataset.target).classList.remove('hidden');
    });
  });

  // --- 4. RENDERIZADO (Vistas) ---
  function renderResults(mealPlan) {
    document.getElementById('summary-text').textContent = 
      `Presupuesto: €${mealPlan.profile.weeklyBudget} | Total usado: €${mealPlan.totalCost.toFixed(2)}`;

    // Renderizar Plan de Comidas
    planContent.innerHTML = mealPlan.days.map(day => `
      <div class="day-card">
        <h3>${day.day} - €${day.dailyCost.toFixed(2)}</h3>
        <div class="meal-item">
          <div><strong>Desayuno:</strong> ${day.breakfast.name}</div>
          <div>${Math.round(day.breakfast.totalCalories)} kcal</div>
        </div>
        <div class="meal-item">
          <div><strong>Almuerzo:</strong> ${day.lunch.name}</div>
          <div>${Math.round(day.lunch.totalCalories)} kcal</div>
        </div>
        <div class="meal-item">
          <div><strong>Cena:</strong> ${day.dinner.name}</div>
          <div>${Math.round(day.dinner.totalCalories)} kcal</div>
        </div>
      </div>
    `).join('');

    // Renderizar Lista de Compras Básica
    const uniqueFoods = new Set();
    mealPlan.days.forEach(day => {
      [day.breakfast, day.lunch, day.dinner].forEach(meal => {
        meal.foods.forEach(f => uniqueFoods.add(f.name));
      });
    });

    shoppingContent.innerHTML = `
      <div class="day-card">
        <h3>Ingredientes a comprar:</h3>
        <ul>
          ${Array.from(uniqueFoods).map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
    `;
  }
});
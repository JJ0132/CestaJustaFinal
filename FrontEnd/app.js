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


async function loadRecipesFromAPI() {
  try {
    const [d, c, ce] = await Promise.all([
      fetch('http://localhost:5050/api/recetas/desayuno').then(r => r.json()),
      fetch('http://localhost:5050/api/recetas/comida').then(r => r.json()),
      fetch('http://localhost:5050/api/recetas/cena').then(r => r.json())
    ]);
    RECETAS.desayuno = d;
    RECETAS.almuerzo = c;
    RECETAS.cena = ce;
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

// Helper: extract a simple list of ingredients from a recipe name
function extractIngredientsFromName(name) {
  if (!name) return '';
  // split by commas first
  let parts = name.split(',').map(p => p.trim()).filter(Boolean);
  // for any part that contains ' y ' or ' and ', split further
  parts = parts.flatMap(p => p.split(/\s+y\s+|\s+and\s+/i).map(s => s.trim()).filter(Boolean));
  // remove short words that are unlikely ingredient tokens (very naive)
  const cleaned = parts.map(p => p.replace(/\s*\(.*?\)\s*/g, '').trim()).filter(Boolean);
  // dedupe
  return Array.from(new Set(cleaned)).join(', ');
}

function filterRecipes(recipes, profile) {
  return recipes.filter(recipe => {
    const ingr = (recipe.ingredientes || '').toLowerCase();
    
    // Filtrados muy básicos basados en texto para la demo
    if (profile.dietType === 'vegetariano' && (ingr.includes('pollo') || ingr.includes('merluza') || ingr.includes('atún') || ingr.includes('ternera') || ingr.includes('pavo') || ingr.includes('cerdo') || ingr.includes('jamón'))) return false;
    if (profile.dietType === 'vegano' && (ingr.includes('pollo') || ingr.includes('merluza') || ingr.includes('atún') || ingr.includes('ternera') || ingr.includes('pavo') || ingr.includes('cerdo') || ingr.includes('huevo') || ingr.includes('queso') || ingr.includes('leche') || ingr.includes('yogur') || ingr.includes('mantequilla') || ingr.includes('jamón'))) return false;
    
    return true;
  });
}

function generateWeeklyMealPlan(profile) {
  const desayunos = filterRecipes(RECETAS.desayuno, profile);
  const almuerzos = filterRecipes(RECETAS.almuerzo, profile);
  const cenas     = filterRecipes(RECETAS.cena, profile);

  const dShuffled = shuffle(desayunos.length ? desayunos : RECETAS.desayuno);
  const aShuffled = shuffle(almuerzos.length ? almuerzos : RECETAS.almuerzo);
  const cShuffled = shuffle(cenas.length ? cenas : RECETAS.cena);

  const days = DAYS.map((day, i) => {
    const breakfast = dShuffled[i % dShuffled.length] || { nombre: 'Desayuno genérico', ingredientes: 'Pan, Aceite', precioTotal: 1.5 };
    const lunch     = aShuffled[i % aShuffled.length] || { nombre: 'Comida genérica', ingredientes: 'Arroz, Pollo', precioTotal: 3.5 };
    const dinner    = cShuffled[i % cShuffled.length] || { nombre: 'Cena genérica', ingredientes: 'Huevo, Patata', precioTotal: 2.0 };

    const bCost = breakfast.precioTotal * profile.people;
    const lCost = lunch.precioTotal * profile.people;
    const dCost = dinner.precioTotal * profile.people;
    
    // Generar calorías falsas para mantener la UI
    const bKcal = 300 + Math.floor(Math.random() * 150);
    const lKcal = 600 + Math.floor(Math.random() * 250);
    const dKcal = 400 + Math.floor(Math.random() * 200);

    return {
      day, emoji: DAY_EMOJIS[i],
      breakfast: { ...breakfast, totalCost: bCost, kcal: bKcal },
      lunch:     { ...lunch,     totalCost: lCost, kcal: lKcal },
      dinner:    { ...dinner,    totalCost: dCost, kcal: dKcal },
      dailyCost: bCost + lCost + dCost,
      dailyCalories: bKcal + lKcal + dKcal,
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

    let users = getStoredUsers();
    let existingUser = users.find(u => u.email === googleEmail);

    if (!existingUser) {
      const googleUsername = googleEmail.split('@')[0];
      let uniqueUsername = googleUsername;
      let counter = 1;
      while (users.some(u => u.username.toLowerCase() === uniqueUsername.toLowerCase())) {
        uniqueUsername = googleUsername + counter;
        counter++;
      }

      existingUser = {
        name: googleName,
        lastName1: googleLastName,
        lastName2: '',
        username: uniqueUsername,
        email: googleEmail,
        phone: '',
        password: '',
        googleAuth: true,
        picture: googlePicture,
      };
      users.push(existingUser);
      saveUsers(users);
    }

    setCurrentUser(existingUser.username);
    updateUserMenu(existingUser.username);
    showAuthMessage('');
    unlockApp();
  }

  let googleInitialized = false;
  function initGoogleSignIn() {
    if (googleInitialized) return;
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

    showAuthMessage('Error cargando Google Sign-In. Recarga la página.', true);
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
    
    try {
      const esVegetariano = profile.dietType === 'vegetariano' || profile.dietType === 'vegano' ? 'true' : 'false';
      const response = await fetch(`http://localhost:5088/api/menusemanal?esVegetariano=${esVegetariano}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      setTimeout(() => {
        // Encontramos un menú que se ajuste al presupuesto
        // Buscamos menús cuyo precio semanal * personas sea menor o igual al presupuesto
        const validMenus = data.filter(m => m.precioSemana * profile.people <= profile.weeklyBudget);
        
        let selectedMenu;
        if (validMenus.length > 0) {
          // Seleccionamos uno aleatorio entre los válidos
          selectedMenu = validMenus[Math.floor(Math.random() * validMenus.length)];
        } else {
          // Si no hay ninguno que encaje, cogemos el más barato
          selectedMenu = data.sort((a,b) => a.precioSemana - b.precioSemana)[0];
          // O si el array está vacío (no hay menús)
          if (!selectedMenu) {
            planContent.innerHTML = `<p class="error">No se encontraron menús para esta configuración.</p>`;
            return;
          }
        }

        // Mapear el menú seleccionado al formato que espera renderResults
        const diasKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
        
        const mappedDays = DAYS.map((dayName, i) => {
          const apiDayStr = diasKeys[i];
          const diaData = selectedMenu[apiDayStr] || {};
          
          const desayunoData = diaData.desayuno || { NombreDesayuno: 'Desayuno genérico', Precio_Desayuno: 1.5 };
          const comidaData = diaData.comida || { NombreComida: 'Comida genérica', Precio_Comida: 3.5 };
          const cenaData = diaData.cena || { NombreCena: 'Cena genérica', Precio_Cena: 2.0 };

          const breakfast = { 
            nombre: desayunoData.NombreDesayuno, 
            // ingredientes: 'Por definir', // El backend no devuelve ingredientes en la receta
            totalCost: desayunoData.Precio_Desayuno * profile.people,
            kcal: 300 + Math.floor(Math.random() * 150)
          };
          
          const lunch = { 
            nombre: comidaData.NombreComida, 
            // ingredientes: 'Por definir', 
            totalCost: comidaData.Precio_Comida * profile.people,
            kcal: 600 + Math.floor(Math.random() * 250)
          };
          
          const dinner = { 
            nombre: cenaData.NombreCena, 
            // ingredientes: 'Por definir', 
            totalCost: cenaData.Precio_Cena * profile.people,
            kcal: 400 + Math.floor(Math.random() * 200)
          };

          const bCost = breakfast.totalCost;
          const lCost = lunch.totalCost;
          const dCost = dinner.totalCost;
          
          return {
            day: dayName,
            emoji: DAY_EMOJIS[i],
            breakfast,
            lunch,
            dinner,
            dailyCost: bCost + lCost + dCost,
            dailyCalories: breakfast.kcal + lunch.kcal + dinner.kcal,
          };
        });

        const totalCost = mappedDays.reduce((s,d) => s + d.dailyCost, 0);
        const totalCalories = mappedDays.reduce((s,d) => s + d.dailyCalories, 0);
        const avgCalories = Math.round(totalCalories / 7);

        const mealPlan = {
          days: mappedDays,
          totalCost,
          totalCalories,
          avgCalories,
          profile,
          // Guardo los datos originales para poder cambiar días
          _apiData: data,
          _selectedMenu: selectedMenu
        };

        renderResults(mealPlan);
      }, 1200);
    } catch (error) {
       console.error("Fetch error:", error);
       planContent.innerHTML = `<p class="error">Hubo un error cargando el menú. Por favor intenta de nuevo.</p>`;
    }
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
    $('summary-text').textContent =
      `${profile.people} persona${profile.people > 1 ? 's' : ''} · Dieta ${profile.dietType}`;
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
      <div class="day-card" style="position: relative;">
        <button class="btn-change-day" data-day="${day.day}" style="position: absolute; top: 1rem; right: 1rem; font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 4px; background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border-color); cursor: pointer;">Cambiar día</button>
        <h3>
          <span>${day.emoji} ${day.day}</span>
          <span class="day-price">€${day.dailyCost.toFixed(2)} · ${day.dailyCalories} kcal</span>
        </h3>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.desayuno}</span><strong>Desayuno:</strong> ${day.breakfast.nombre}</div>
          <div class="meal-calories">${day.breakfast.kcal} kcal · €${day.breakfast.totalCost.toFixed(2)}</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.almuerzo}</span><strong>Almuerzo:</strong> ${day.lunch.nombre}</div>
          <div class="meal-calories">${day.lunch.kcal} kcal · €${day.lunch.totalCost.toFixed(2)}</div>
        </div>
        <div class="meal-item">
          <div><span class="meal-icon">${MEAL_ICONS.cena}</span><strong>Cena:</strong> ${day.dinner.nombre}</div>
          <div class="meal-calories">${day.dinner.kcal} kcal · €${day.dinner.totalCost.toFixed(2)}</div>
        </div>
      </div>
    `).join('');
    
    // Construir la lista de la compra parseando el string de ingredientes
    const ingredientsCount = {};
    let totalShoppingCost = 0;
    
    days.forEach(day => {
      [day.breakfast, day.lunch, day.dinner].forEach(meal => {
        // If the backend didn't include an `ingredientes` field, try to extract from the name
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
        <h3>Lista de la compra — ${uniqueIngredients.length} ingredientes diferentes</h3>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-top:0.5rem">Coste total estimado (API): €${totalCost.toFixed(2)}</p>
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

        // fetch a random MenuDiario from backend, respecting diet
        try {
          const esVeg = profile.dietType === 'vegetariano' || profile.dietType === 'vegano' ? 'true' : 'false';
          const resp = await fetch(`http://localhost:5088/api/menudiario/random?esVegetariano=${esVeg}`);
          if (!resp.ok) throw new Error('No se pudo obtener un menú alternativo');
          const m = await resp.json();

          // map API MenuDiario to our day format
          const desayunoData = m.desayuno || m.Desayuno || {};
          const comidaData   = m.comida || m.Comida || {};
          const cenaData     = m.cena || m.Cena || {};

          const newBreakfast = {
            nombre: desayunoData.NombreDesayuno || desayunoData.Nombre || 'Desayuno alternativo',
            ingredientes: extractIngredientsFromName(desayunoData.NombreDesayuno || desayunoData.Nombre || ''),
            totalCost: (desayunoData.Precio_Desayuno || desayunoData.Precio || 0) * profile.people,
            kcal: 300 + Math.floor(Math.random() * 150)
          };

          const newLunch = {
            nombre: comidaData.NombreComida || comidaData.Nombre || 'Comida alternativa',
            ingredientes: extractIngredientsFromName(comidaData.NombreComida || comidaData.Nombre || ''),
            totalCost: (comidaData.Precio_Comida || comidaData.Precio || 0) * profile.people,
            kcal: 600 + Math.floor(Math.random() * 250)
          };

          const newDinner = {
            nombre: cenaData.NombreCena || cenaData.Nombre || 'Cena alternativa',
            ingredientes: extractIngredientsFromName(cenaData.NombreCena || cenaData.Nombre || ''),
            totalCost: (cenaData.Precio_Cena || cenaData.Precio || 0) * profile.people,
            kcal: 400 + Math.floor(Math.random() * 200)
          };

          const newDay = {
            day: dayToChange,
            emoji: DAY_EMOJIS[dayIndex],
            breakfast: newBreakfast,
            lunch: newLunch,
            dinner: newDinner,
            dailyCost: newBreakfast.totalCost + newLunch.totalCost + newDinner.totalCost,
            dailyCalories: newBreakfast.kcal + newLunch.kcal + newDinner.kcal
          };

          // replace in mealPlan and recompute totals
          mealPlan.days[dayIndex] = newDay;
          mealPlan.totalCost = mealPlan.days.reduce((s,d) => s + d.dailyCost, 0);
          mealPlan.totalCalories = mealPlan.days.reduce((s,d) => s + d.dailyCalories, 0);
          mealPlan.avgCalories = Math.round(mealPlan.totalCalories / 7);

          // re-render
          renderResults(mealPlan);
        } catch (err) {
          console.error('Error al cambiar día:', err);
          alert('No se pudo obtener un menú alternativo. Intenta otra vez.');
        }
      });
    });
  }
});

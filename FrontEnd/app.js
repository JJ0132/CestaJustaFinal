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
  const tabBtns = document.querySelectorAll('.tab-btn');

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
/* ==========================================================================
   PANTRYCHEF APPLICATION LOGIC (ES6+)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // --- STATE ---
  let pantryItems = [];
  let generatedRecipes = [];
  let activeRecipe = null;
  let activeCategoryFilter = 'all';

  // Fallback default pantry items to show immediate value (first load only)
  const defaultPantry = [
    { id: 'def-1', name: 'Fresh Tomato', qty: 4, unit: 'pcs', category: 'Vegetables' },
    { id: 'def-2', name: 'Chicken Breast', qty: 500, unit: 'g', category: 'Proteins' },
    { id: 'def-3', name: 'Spaghetti Pasta', qty: 250, unit: 'g', category: 'Grains' },
    { id: 'def-4', name: 'Garlic', qty: 1, unit: 'pcs', category: 'Spices' },
    { id: 'def-5', name: 'Olive Oil', qty: 1, unit: 'units', category: 'Spices' }
  ];

  // --- ELEMENT SELECTORS ---
  const toastEl = document.getElementById('toast');
  const bodyEl = document.body;
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const settingsOpenBtn = document.getElementById('settings-open-btn');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const settingsModal = document.getElementById('settings-modal');
  const settingsForm = document.getElementById('settings-form');
  const apiKeyInput = document.getElementById('api-key-input');
  const toggleKeyVisibilityBtn = document.getElementById('toggle-key-visibility');
  const settingsClearApiBtn = document.getElementById('settings-clear-api-btn');
  const apiStatusBadge = document.getElementById('api-status-badge');
  const badgeText = apiStatusBadge.querySelector('.badge-text');

  // Pantry Elements
  const addPantryForm = document.getElementById('add-pantry-form');
  const itemNameInput = document.getElementById('item-name-input');
  const itemQtyInput = document.getElementById('item-qty-input');
  const itemUnitInput = document.getElementById('item-unit-input');
  const itemCategoryInput = document.getElementById('item-category-input');
  const pantryList = document.getElementById('pantry-list');
  const pantryEmptyState = document.getElementById('pantry-empty-state');
  const pantryCounter = document.getElementById('pantry-counter');
  const pantryClearBtn = document.getElementById('pantry-clear-btn');
  const pantryTabs = document.querySelectorAll('.pantry-tab');
  const quickStapleChips = document.querySelectorAll('.staple-chip');

  // Recipe Suggestions Board Elements
  const generateRecipesBtn = document.getElementById('generate-recipes-btn');
  const recipeWelcomeState = document.getElementById('recipe-welcome-state');
  const splashKeyWarning = document.getElementById('splash-key-warning');
  const recipeLoadingState = document.getElementById('recipe-loading-state');
  const loadingTitle = document.getElementById('loading-status-title');
  const loadingSubtitle = document.getElementById('loading-status-subtitle');
  const recipeErrorState = document.getElementById('recipe-error-state');
  const errorMessage = document.getElementById('error-message');
  const errorRetryBtn = document.getElementById('error-retry-btn');
  const recipesGrid = document.getElementById('recipes-grid');

  // Recipe Detail Modal Elements
  const recipeModal = document.getElementById('recipe-modal');
  const recipeCloseBtn = document.getElementById('recipe-close-btn');
  const modalRecipeTitle = document.getElementById('modal-recipe-title');
  const modalRecipeDifficulty = document.getElementById('modal-recipe-difficulty');
  const modalRecipeTime = document.getElementById('modal-recipe-time');
  const modalRecipeServings = document.getElementById('modal-recipe-servings');
  const modalRecipeCalories = document.getElementById('modal-recipe-calories');
  const modalRecipeMatch = document.getElementById('modal-recipe-match');
  const modalIngInStock = document.getElementById('modal-ing-instock');
  const modalIngStaples = document.getElementById('modal-ing-staples');
  const modalIngMissing = document.getElementById('modal-ing-missing');
  const modalMissingBlock = document.getElementById('modal-missing-block');
  const modalRecipeSteps = document.getElementById('modal-recipe-steps');
  const modalRecipeTip = document.getElementById('modal-recipe-tip');
  const deductPantryCheckbox = document.getElementById('deduct-pantry-checkbox');
  const recipeCompleteBtn = document.getElementById('recipe-complete-btn');
  const recipePrintBtn = document.getElementById('recipe-print-btn');

  // Pref Selectors
  const prefMealType = document.getElementById('pref-meal-type');
  const prefCookingTime = document.getElementById('pref-cooking-time');
  const prefDiet = document.getElementById('pref-diet');
  const prefStrictness = document.getElementById('pref-strictness');

  // --- INITIALIZATION ---
  initApp();

  function initApp() {
    // Load Dark Theme Preference
    const savedTheme = localStorage.getItem('pantryChef_theme') || 'light-theme';
    bodyEl.className = savedTheme;

    // Load Pantry Data
    const savedPantry = localStorage.getItem('pantryChef_pantry');
    if (savedPantry) {
      pantryItems = JSON.parse(savedPantry);
    } else {
      pantryItems = [...defaultPantry];
      savePantryToStorage();
    }
    renderPantryList();

    // Check API Key
    updateApiKeyBadge();

    // Event Listeners Binding
    setupEventListeners();
  }

  // --- EVENT LISTENERS ---
  function setupEventListeners() {
    // Theme Toggle
    themeToggleBtn.addEventListener('click', () => {
      if (bodyEl.classList.contains('light-theme')) {
        bodyEl.classList.replace('light-theme', 'dark-theme');
        localStorage.setItem('pantryChef_theme', 'dark-theme');
        showToast('🌙 Activated Dark Mode');
      } else {
        bodyEl.classList.replace('dark-theme', 'light-theme');
        localStorage.setItem('pantryChef_theme', 'light-theme');
        showToast('☀️ Activated Light Mode');
      }
    });

    // Settings Drawer opening/closing
    settingsOpenBtn.addEventListener('click', () => {
      const savedKey = localStorage.getItem('pantryChef_apiKey') || '';
      apiKeyInput.value = savedKey;
      settingsModal.classList.remove('hidden');
    });

    settingsCloseBtn.addEventListener('click', () => {
      settingsModal.classList.add('hidden');
    });

    // Close Settings when clicking background
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    // Toggle Key visibility (password show/hide)
    toggleKeyVisibilityBtn.addEventListener('click', () => {
      const isPassword = apiKeyInput.type === 'password';
      apiKeyInput.type = isPassword ? 'text' : 'password';
      const eyeOpen = toggleKeyVisibilityBtn.querySelector('.eye-open');
      const eyeClosed = toggleKeyVisibilityBtn.querySelector('.eye-closed');
      
      if (isPassword) {
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
      } else {
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
      }
    });

    // Save Settings
    settingsForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newKey = apiKeyInput.value.trim();
      if (newKey) {
        localStorage.setItem('pantryChef_apiKey', newKey);
        showToast('🔑 API Key Saved Successfully!');
        updateApiKeyBadge();
        settingsModal.classList.add('hidden');
      }
    });

    // Clear Settings API key
    settingsClearApiBtn.addEventListener('click', () => {
      localStorage.removeItem('pantryChef_apiKey');
      apiKeyInput.value = '';
      showToast('🗑️ API Key Cleared!');
      updateApiKeyBadge();
      settingsModal.classList.add('hidden');
    });

    // Add Pantry Item Form submit
    addPantryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = itemNameInput.value.trim();
      const qty = parseFloat(itemQtyInput.value);
      const unit = itemUnitInput.value;
      const category = itemCategoryInput.value;

      if (name && qty > 0) {
        // Capitalize name beautifully
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        
        // Add item
        addPantryItem(formattedName, qty, unit, category);
        
        // Reset name only for continuous adding convenience
        itemNameInput.value = '';
        itemNameInput.focus();
        showToast(`🥦 Added ${formattedName} to Pantry!`);
      }
    });

    // Quick Add chips click
    quickStapleChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const name = chip.getAttribute('data-name');
        const category = chip.getAttribute('data-category');
        const unit = chip.getAttribute('data-unit');
        const qty = parseFloat(chip.getAttribute('data-qty'));
        
        addPantryItem(name, qty, unit, category);
        showToast(`🥚 Added staple ${name}!`);

        // Micro bounce effect
        chip.style.transform = 'scale(0.9)';
        setTimeout(() => chip.style.transform = '', 150);
      });
    });

    // Pantry Clear All
    pantryClearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your entire pantry list? This cannot be undone.')) {
        pantryItems = [];
        savePantryToStorage();
        renderPantryList();
        showToast('🗑️ Kitchen Pantry Cleared!');
      }
    });

    // Pantry Category filters
    pantryTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        pantryTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategoryFilter = tab.getAttribute('data-filter');
        renderPantryList();
      });
    });

    // Generate AI recipes trigger
    generateRecipesBtn.addEventListener('click', () => {
      triggerRecipeGeneration();
    });

    errorRetryBtn.addEventListener('click', () => {
      triggerRecipeGeneration();
    });

    // Immersive Recipe modal operations
    recipeCloseBtn.addEventListener('click', () => {
      recipeModal.classList.add('hidden');
      activeRecipe = null;
    });

    recipeModal.addEventListener('click', (e) => {
      if (e.target === recipeModal) {
        recipeModal.classList.add('hidden');
        activeRecipe = null;
      }
    });

    // Interactive complete action
    recipeCompleteBtn.addEventListener('click', () => {
      completeActiveRecipe();
    });

    // Print details action
    recipePrintBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // --- PANTRY OPERATIONS & RENDERERS ---
  function addPantryItem(name, qty, unit, category) {
    // Check if ingredient exists, merge quantities if so
    const existingIndex = pantryItems.findIndex(item => 
      item.name.toLowerCase() === name.toLowerCase() && 
      item.unit.toLowerCase() === unit.toLowerCase() &&
      item.category === category
    );

    if (existingIndex > -1) {
      pantryItems[existingIndex].qty = parseFloat((pantryItems[existingIndex].qty + qty).toFixed(2));
    } else {
      const newItem = {
        id: 'item-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        name,
        qty,
        unit,
        category
      };
      pantryItems.unshift(newItem); // put at top
    }

    savePantryToStorage();
    renderPantryList();
  }

  function deletePantryItem(id) {
    const itemEl = pantryList.querySelector(`[data-id="${id}"]`);
    if (itemEl) {
      itemEl.classList.add('removing');
      
      // wait for slide-out CSS transition before removal
      itemEl.addEventListener('animationend', () => {
        pantryItems = pantryItems.filter(item => item.id !== id);
        savePantryToStorage();
        renderPantryList();
      });
    }
  }

  function savePantryToStorage() {
    localStorage.setItem('pantryChef_pantry', JSON.stringify(pantryItems));
  }

  function renderPantryList() {
    pantryList.innerHTML = '';
    
    // Filter items
    const filteredItems = pantryItems.filter(item => {
      if (activeCategoryFilter === 'all') return true;
      return item.category === activeCategoryFilter;
    });

    // Update Counter & Clear button visibility
    pantryCounter.textContent = `${pantryItems.length} items available`;
    if (pantryItems.length > 0) {
      pantryClearBtn.classList.remove('hidden');
      pantryEmptyState.classList.add('hidden');
    } else {
      pantryClearBtn.classList.add('hidden');
      pantryEmptyState.classList.remove('hidden');
    }

    // Render list elements
    filteredItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'pantry-item';
      li.setAttribute('data-id', item.id);
      
      li.innerHTML = `
        <div class="item-left-block">
          <span class="item-title">${item.name}</span>
          <div class="item-meta">
            <span class="item-qty-badge">${item.qty} ${item.unit}</span>
            <span class="item-cat-badge cat-${item.category}">${item.category}</span>
          </div>
        </div>
        <button class="item-remove-btn" aria-label="Remove Item">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      `;

      // bind remove action
      li.querySelector('.item-remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        deletePantryItem(item.id);
      });

      pantryList.appendChild(li);
    });
  }

  // --- API BADGING SYSTEM ---
  function updateApiKeyBadge() {
    const savedKey = localStorage.getItem('pantryChef_apiKey');
    if (savedKey && savedKey.length > 8) {
      apiStatusBadge.className = 'api-status-badge authorized';
      badgeText.textContent = 'AI Model Ready';
      splashKeyWarning.classList.add('hidden');
    } else {
      apiStatusBadge.className = 'api-status-badge unauthorized';
      badgeText.textContent = 'API Key Missing';
      splashKeyWarning.classList.remove('hidden');
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove('hidden');
    // For trigger transition
    setTimeout(() => toastEl.classList.add('show'), 50);
    
    // Clear timeout if clicked or simple delay
    setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => toastEl.classList.add('hidden'), 350);
    }, 3200);
  }

  // --- AI RECIPE SUGGESTION RETRIEVAL ENGINE ---
  async function triggerRecipeGeneration() {
    // 1. Pantry Validation
    if (pantryItems.length === 0) {
      showToast('⚠️ Please add at least 1 item to your pantry first!');
      itemNameInput.focus();
      return;
    }

    // 2. API Key Validation
    const apiKey = localStorage.getItem('pantryChef_apiKey');
    if (!apiKey || apiKey.length < 8) {
      showToast('🔑 Please configure your Gemini API Key in Settings first.');
      settingsModal.classList.remove('hidden');
      return;
    }

    // 3. Update loading views
    recipeWelcomeState.classList.add('hidden');
    recipesGrid.classList.add('hidden');
    recipeErrorState.classList.add('hidden');
    recipeLoadingState.classList.remove('hidden');

    // 4. Fire funny loading intervals
    const loadingInterval = startLoadingStatusCycles();

    // 5. Construct AI culinary request
    try {
      const pantryString = pantryItems.map(i => `${i.name} (${i.qty} ${i.unit})`).join(', ');
      
      const mealType = prefMealType.value;
      const cookingTime = prefCookingTime.value;
      const diet = prefDiet.value;
      const strictness = prefStrictness.value;

      const prompt = `You are a professional Michelin-star Culinary Chef.
The user has the following ingredients in their house pantry: ${pantryString}.
Preferences chosen:
- Meal Type: ${mealType}
- Target Cooking Duration: ${cookingTime}
- Dietary restrictions: ${diet}
- Ingredient Strictness setting: ${strictness} (If 'Strict Pantry Only', you must only suggest recipes made using only the exact ingredients given plus standard staples like cooking oil, butter, salt, pepper, and water. If 'Staples Allowed', standard household items are allowed. If 'Include 1-2 Extras', you can suggest up to two minor ingredients not in their pantry but that would elevate the dish dramatically).

Generate EXACTLY 3 beautiful, gourmet, highly creative recipe recommendations that can be cooked with these pantry items.
You MUST provide the details strictly matching the following JSON Schema structure:

{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "Short culinary overview that describes the textures, flavors, and visual appeal.",
      "cookingTime": 30, 
      "servings": 2,
      "difficulty": "Easy" | "Medium" | "Hard",
      "calories": 420,
      "inStockIngredients": [
        "name and quantity of exact matched ingredients from the pantry list"
      ],
      "stapleIngredients": [
        "basic standard pantry items used (like salt, water, black pepper, standard cooking oil)"
      ],
      "missingIngredients": [
        "any ingredient requested but not in their pantry list (if strict, keep this empty!)"
      ],
      "steps": [
        "Step 1 prep description...",
        "Step 2 cooking description..."
      ],
      "proTip": "Chef's gourmet advice, key substitutions, or kitchen hacks for this specific meal."
    }
  ]
}

Strictly output ONLY the JSON object. Do not include markdown wraps or backticks outside the raw JSON content itself. Ensure the keys are double quoted and it is directly parseable by JSON.parse().`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        let errMessage = `API returned HTTP status ${response.status}`;
        try {
          const errJSON = await response.json();
          if (errJSON && errJSON.error && errJSON.error.message) {
            errMessage += `: ${errJSON.error.message}`;
          }
        } catch (jsonErr) {
          // ignore JSON parse error on error raw stream
        }
        throw new Error(errMessage);
      }

      const responseData = await response.json();
      
      // Extract generated text
      let text = responseData.candidates[0].content.parts[0].text;
      
      // Robust cleaning of markdown tags if any
      if (text.includes("```json")) {
        text = text.substring(text.indexOf("```json") + 7);
        text = text.substring(0, text.lastIndexOf("```"));
      } else if (text.includes("```")) {
        text = text.substring(text.indexOf("```") + 3);
        text = text.substring(0, text.lastIndexOf("```"));
      }

      const recipeJSON = JSON.parse(text.trim());
      
      if (!recipeJSON || !recipeJSON.recipes || recipeJSON.recipes.length === 0) {
        throw new Error("No recipes returned in parsed AI JSON payload.");
      }

      generatedRecipes = recipeJSON.recipes;

      // Render Recipes Grid
      clearInterval(loadingInterval);
      recipeLoadingState.classList.add('hidden');
      renderRecipesGrid();

    } catch (err) {
      console.error("Gemini Chef Fetch Error:", err);
      clearInterval(loadingInterval);
      
      recipeLoadingState.classList.add('hidden');
      recipeErrorState.classList.remove('hidden');
      
      // Set appropriate error text
      if (err.message.includes('HTTP status 403') || err.message.includes('API key')) {
        errorMessage.innerHTML = `${err.message}.<br><br>Your **Gemini API Key** may be invalid, incorrect, or blocked by local environment settings. Please click the gear icon ⚙️ above to verify your key, or get a fresh one from Google AI Studio.`;
      } else if (err.message.includes('HTTP status 400')) {
        errorMessage.innerHTML = `${err.message}.<br><br>There was a request formatting issue. Try clearing some ingredients or changing meal preferences.`;
      } else if (err.message.includes('Failed to fetch') || err.message.includes('status 503')) {
        errorMessage.textContent = `A network connectivity error occurred. Please check your internet connection or Google AI Studio services and retry. Details: ${err.message}`;
      } else {
        errorMessage.textContent = `Error parsing recipes: ${err.message}. The AI might have returned structured information differently, please try clicking generate again!`;
      }
    }
  }

  // --- CYCLIC STATUS UPDATER ---
  function startLoadingStatusCycles() {
    const titles = [
      "Simmering digital broths...",
      "Peeling mathematical garlic...",
      "Consulting Michelin guides...",
      "Measuring spices in HSL...",
      "Preheating culinary neural nets..."
    ];
    
    const subtitles = [
      "Curating flavor balances based on available pantry...",
      "Designing gourmet recipe titles for your ingredients...",
      "Whipping up interactive step-by-step instructions...",
      "Calculating estimated cooking durations and nutrition...",
      "Optimizing ratios to avoid wasting any left-overs..."
    ];

    let index = 0;
    
    loadingTitle.textContent = titles[0];
    loadingSubtitle.textContent = subtitles[0];

    return setInterval(() => {
      index = (index + 1) % titles.length;
      loadingTitle.textContent = titles[index];
      loadingSubtitle.textContent = subtitles[index];
    }, 2400);
  }

  // --- RECIPE DISPLAY RENDERERS ---
  function renderRecipesGrid() {
    recipesGrid.innerHTML = '';
    recipesGrid.classList.remove('hidden');

    generatedRecipes.forEach((recipe, index) => {
      // Calculate matching percentage (excluding staples)
      const pantryLen = recipe.inStockIngredients.length;
      const missingLen = recipe.missingIngredients.length;
      const totalIngredients = pantryLen + missingLen;
      const matchPercent = totalIngredients > 0 
        ? Math.round((pantryLen / totalIngredients) * 100)
        : 100;

      // Visual helper badge config
      const isPerfect = missingLen === 0;
      const matchBadgeText = isPerfect ? '🍲 Ready to Make!' : `🛒 ${matchPercent}% Matches`;
      const badgeClass = isPerfect ? 'card-match-badge' : 'card-match-badge missing-some';

      const card = document.createElement('div');
      card.className = 'recipe-card';
      
      card.innerHTML = `
        <div class="recipe-card-banner">
          <span class="${badgeClass}">${matchBadgeText}</span>
        </div>
        <div class="recipe-card-content">
          <h3>${recipe.name}</h3>
          <p class="recipe-card-description">${recipe.description}</p>
          
          <div class="recipe-card-badges-row">
            <span class="card-badge">⏰ ${recipe.cookingTime}m</span>
            <span class="card-badge">👥 ${recipe.servings} serving${recipe.servings > 1 ? 's' : ''}</span>
            <span class="card-badge">🔥 ${recipe.calories} kcal</span>
            <span class="card-badge">🧩 ${recipe.difficulty}</span>
          </div>

          <button class="recipe-view-btn">
            View Cook Checklist
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      `;

      // bind open details action
      card.querySelector('.recipe-view-btn').addEventListener('click', () => {
        openRecipeDetailModal(recipe, matchPercent);
      });

      recipesGrid.appendChild(card);
    });
  }

  // --- IMMERSIVE MODAL BUILDER & PROCESS ---
  function openRecipeDetailModal(recipe, matchPercent) {
    activeRecipe = recipe;
    
    // Bind text fields
    modalRecipeTitle.textContent = recipe.name;
    modalRecipeDifficulty.textContent = recipe.difficulty;
    modalRecipeTime.textContent = `${recipe.cookingTime} mins`;
    modalRecipeServings.textContent = `${recipe.servings} Servings`;
    modalRecipeCalories.textContent = `${recipe.calories} Calories`;
    modalRecipeMatch.textContent = `${matchPercent}% Match`;
    modalRecipeTip.textContent = recipe.proTip;

    // Reset checklists
    modalIngInStock.innerHTML = '';
    modalIngStaples.innerHTML = '';
    modalIngMissing.innerHTML = '';

    // Populate In-stock ingredients
    recipe.inStockIngredients.forEach(ing => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="bullet-icon">🟢</span> ${ing}`;
      modalIngInStock.appendChild(li);
    });

    // Populate staples
    if (recipe.stapleIngredients && recipe.stapleIngredients.length > 0) {
      recipe.stapleIngredients.forEach(ing => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="bullet-icon">⚪</span> ${ing}`;
        modalIngStaples.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.innerHTML = `<span class="bullet-icon">⚪</span> Salt, Water, Olive Oil`;
      modalIngStaples.appendChild(li);
    }

    // Populate Missing ingredients
    if (recipe.missingIngredients && recipe.missingIngredients.length > 0) {
      modalMissingBlock.classList.remove('hidden');
      recipe.missingIngredients.forEach(ing => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="bullet-icon">🔴</span> <strong>${ing}</strong>`;
        modalIngMissing.appendChild(li);
      });
    } else {
      modalMissingBlock.classList.add('hidden');
    }

    // Populate Steps checklist
    modalRecipeSteps.innerHTML = '';
    recipe.steps.forEach((step, index) => {
      const li = document.createElement('li');
      li.className = 'step-item';
      li.innerHTML = `
        <div class="step-checkbox"></div>
        <div>
          <span class="step-number">Step ${index + 1}</span>
          <p class="step-text">${step}</p>
        </div>
      `;

      // Bind interactive checking state toggle
      li.addEventListener('click', () => {
        li.classList.toggle('checked');
      });

      modalRecipeSteps.appendChild(li);
    });

    // Reveal modal
    recipeModal.classList.remove('hidden');
  }

  // --- PANTRY STOCK AUTO DEDUCTOR ON COOK COMPLETED ---
  function completeActiveRecipe() {
    if (!activeRecipe) return;

    const shouldDeduct = deductPantryCheckbox.checked;

    if (shouldDeduct) {
      // Find matching items in pantry and deduct
      // We will matching inStockIngredients names using basic substring checks
      let deductedCount = 0;

      activeRecipe.inStockIngredients.forEach(recipeIng => {
        // Find best match in our pantry items
        // recipeIng has formats like: "Chicken breast (500g)" or just "Chicken Breast"
        const cleanRecipeName = recipeIng.split('(')[0].trim().toLowerCase();

        pantryItems.forEach((pantryItem, index) => {
          const cleanPantryName = pantryItem.name.toLowerCase();
          
          if (cleanRecipeName.includes(cleanPantryName) || cleanPantryName.includes(cleanRecipeName)) {
            // Deduct matching ingredient! 
            // If they match perfectly, we can attempt to extract number quantity from recipe ingredient, 
            // but to keep it simple and highly stable: we will decrement the item count or reduce it by 1 unit.
            // If quantity goes to <= 0 or becomes very small, we remove the item completely.
            
            // Try to extract quantity to deduct from parentheses e.g. "Chicken (250g)"
            const qtyMatch = recipeIng.match(/\((\d+(\.\d+)?)\s*(\w+)?\)/);
            let deductQty = 1; // default fallback deduction
            
            if (qtyMatch && parseFloat(qtyMatch[1]) > 0) {
              deductQty = parseFloat(qtyMatch[1]);
            } else {
              deductQty = pantryItem.qty; // default deduct everything
            }

            pantryItem.qty = parseFloat((pantryItem.qty - deductQty).toFixed(2));
            
            if (pantryItem.qty <= 0) {
              // Delete complete
              pantryItems = pantryItems.filter(item => item.id !== pantryItem.id);
            }
            deductedCount++;
          }
        });
      });

      if (deductedCount > 0) {
        savePantryToStorage();
        renderPantryList();
        showToast(`🎉 Chef, hope you enjoyed cooking! ${deductedCount} item quantities deducted from pantry.`);
      } else {
        showToast(`🎉 Culinary success! Bon Appétit!`);
      }
    } else {
      showToast(`🎉 Culinary success! Bon Appétit!`);
    }

    // Close Modal
    recipeModal.classList.add('hidden');
    activeRecipe = null;
  }
});

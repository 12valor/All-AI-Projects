// At the very top
let currentUser = null;
// E-wallets state
let wallets = [];
// Expenses state
let expenses = [];
let savingsGoal = 0;
let expenseHistory = [];
let incomes = [];

// --- ENHANCED DATA STRUCTURES ---
let recurringExpenses = [];
let recurringIncomes = [];
let budgets = {}; // { category: { amount, spent } }
let customCategories = [
  { name: 'General', icon: 'fa-tag', color: '#6366f1' },
  { name: 'Food', icon: 'fa-utensils', color: '#f59e42' },
  { name: 'Bills', icon: 'fa-file-invoice', color: '#06b6d4' },
  { name: 'Shopping', icon: 'fa-bag-shopping', color: '#a21caf' },
  { name: 'Transport', icon: 'fa-bus', color: '#059669' },
  { name: 'Health', icon: 'fa-heart-pulse', color: '#dc2626' },
  { name: 'Entertainment', icon: 'fa-film', color: '#fbbf24' },
  { name: 'Other', icon: 'fa-ellipsis', color: '#64748b' }
];
let auditLog = [];
let badges = [];

// DOM elements
const walletForm = document.getElementById('wallet-form');
const walletNameInput = document.getElementById('wallet-name');
const walletAmountInput = document.getElementById('wallet-amount');
const walletsList = document.getElementById('wallets-list');
const totalMoneyDiv = document.getElementById('total-money');

const expenseForm = document.getElementById('expense-form');
const expenseNameInput = document.getElementById('expense-name');
const expenseAmountInput = document.getElementById('expense-amount');
const expenseCategoryInput = document.getElementById('expense-category');
const expenseNotesInput = document.getElementById('expense-notes');
const monthlyExpensesList = document.getElementById('monthly-expenses');
const threeMonthsExpensesList = document.getElementById('3months-expenses');
const yearlyExpensesList = document.getElementById('yearly-expenses');
const summaryDiv = document.getElementById('summary');
const goalForm = document.getElementById('goal-form');
const savingsGoalInput = document.getElementById('savings-goal');
const goalProgressDiv = document.getElementById('goal-progress');
const resetBtn = document.getElementById('reset-data');
const darkModeToggle = document.getElementById('darkModeToggle');
const trendAnalysisDiv = document.getElementById('trend-analysis');

const incomeForm = document.getElementById('income-form');
const incomeNameInput = document.getElementById('income-name');
const incomeAmountInput = document.getElementById('income-amount');
const incomeList = document.getElementById('income-list');
const totalIncomeDiv = document.getElementById('total-income');

const expenseSearchInput = document.getElementById('expense-search');

// --- MAIN DOMContentLoaded WRAPPER FOR ALL DOM LOGIC ---
document.addEventListener('DOMContentLoaded', function() {
  // Initialize currentUser
  currentUser = localStorage.getItem('currentUser');
  if (!currentUser) {
    window.location.href = 'index.html';
    return;
  }
  // Wallets
  const walletForm = document.getElementById('wallet-form');
  const walletNameInput = document.getElementById('wallet-name');
  const walletAmountInput = document.getElementById('wallet-amount');
  const totalMoneyDiv = document.getElementById('total-money');
  // Incomes
  const incomeForm = document.getElementById('income-form');
  const incomeNameInput = document.getElementById('income-name');
  const incomeAmountInput = document.getElementById('income-amount');
  // Expenses
  const expenseForm = document.getElementById('expense-form');
  const expenseNameInput = document.getElementById('expense-name');
  const expenseAmountInput = document.getElementById('expense-amount');
  const expenseCategoryInput = document.getElementById('expense-category');
  const expenseNotesInput = document.getElementById('expense-notes');

  // Add wallet
  if (walletForm) {
    walletForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = walletNameInput.value.trim();
      const amount = parseFloat(walletAmountInput.value);
      if (!name || isNaN(amount) || amount < 0) return;
      wallets.push({ name, amount });
      walletNameInput.value = '';
      walletAmountInput.value = '';
      saveUserData();
      renderWallets();
      updateAllAnalytics && updateAllAnalytics();
      showNotification('Wallet added!', 'success');
      addAuditLog('add_wallet', { name, amount });
    });
  }

  // Render wallets
  function renderWallets() {
    const walletList = document.getElementById('wallets-list');
    if (!walletList) return;
    walletList.innerHTML = '';
    wallets.forEach((w, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<b>${w.name}</b>: $${w.amount.toLocaleString()} <button class='edit-wallet' data-idx='${idx}'><i class='fa-solid fa-pen'></i></button> <button class='delete-wallet' data-idx='${idx}'><i class='fa-solid fa-trash'></i></button>`;
      walletList.appendChild(li);
    });
    // Edit/delete handlers
    walletList.querySelectorAll('.edit-wallet').forEach(btn => {
      btn.onclick = function() {
        const idx = +btn.getAttribute('data-idx');
        const w = wallets[idx];
        const newName = prompt('Edit wallet name:', w.name);
        if (newName !== null && newName.trim() !== '') wallets[idx].name = newName.trim();
        const newAmt = prompt('Edit wallet amount:', w.amount);
        if (newAmt !== null && !isNaN(+newAmt)) wallets[idx].amount = +newAmt;
        saveUserData();
        renderWallets();
        updateAllAnalytics && updateAllAnalytics();
        showNotification('Wallet updated!', 'success');
        addAuditLog('edit_wallet', { idx, name: wallets[idx].name, amount: wallets[idx].amount });
      };
    });
    walletList.querySelectorAll('.delete-wallet').forEach(btn => {
      btn.onclick = function() {
        const idx = +btn.getAttribute('data-idx');
        if (confirm('Delete this wallet?')) {
          wallets.splice(idx, 1);
          saveUserData();
          renderWallets();
          updateAllAnalytics && updateAllAnalytics();
          showNotification('Wallet deleted!', 'warning');
          addAuditLog('delete_wallet', { idx });
        }
      };
    });
    const total = wallets.reduce((sum, w) => sum + w.amount, 0);
    if (totalMoneyDiv) totalMoneyDiv.textContent = `Total Money: $${total.toLocaleString()}`;
  }
  window.renderWallets = renderWallets;
  renderWallets();

  // Add expense
  if (expenseForm) {
    expenseForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const name = expenseNameInput.value.trim();
      const amount = parseFloat(expenseAmountInput.value);
      const category = expenseCategoryInput.value;
      const notes = expenseNotesInput.value.trim();
      if (!name || isNaN(amount) || amount < 0 || !category) return;
      const expense = { name, amount, category, notes, date: new Date().toISOString() };
      expenses.push(expense);
      expenseHistory.push(expense); // For trend analysis
      expenseNameInput.value = '';
      expenseAmountInput.value = '';
      expenseCategoryInput.value = 'General';
      expenseNotesInput.value = '';
      saveUserData();
      renderExpenses();
      renderSummary();
      renderGoal();
      renderChart();
      renderTrend();
      updateDashboardStats();
    });
  }

  // Render expenses
  function renderExpenses() {
    monthlyExpensesList.innerHTML = '';
    let filtered = expenses;
    const q = (expenseSearchInput.value || '').toLowerCase();
    if (q) {
      filtered = expenses.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q))
      );
    }
    filtered.forEach((exp, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid fa-tag"></i> ${exp.name} <span class="exp-cat">[${exp.category}]</span>: $${exp.amount.toLocaleString()}${exp.notes ? `<br><span class='exp-notes'>${exp.notes}</span>` : ''}`;
      const removeBtn = document.createElement('button');
      removeBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
      removeBtn.onclick = () => {
        const realIdx = expenses.indexOf(exp);
        if (realIdx !== -1) expenses.splice(realIdx, 1);
        saveUserData();
        renderExpenses();
        renderSummary();
        renderGoal();
        renderChart();
        renderTrend();
        updateDashboardStats();
      };
      li.appendChild(removeBtn);
      monthlyExpensesList.appendChild(li);
    });
    updateDashboardStats();
  }

  // Render summary
  function renderSummary() {
    const totalMoney = wallets.reduce((sum, w) => sum + w.amount, 0);
    const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
    const remaining = totalMoney - totalMonthly;
    const percentSpent = totalMoney > 0 ? ((totalMonthly / totalMoney) * 100).toFixed(2) : '0.00';
    const weekly = (totalMonthly / 4.33).toFixed(2);
    const daily = (totalMonthly / 30.44).toFixed(2);
    const savingsRate = totalMoney > 0 ? (((remaining) / totalMoney) * 100).toFixed(2) : '0.00';
    let warning = '';
    if (totalMonthly > totalMoney) {
      warning = '<div style="color:#dc2626;font-weight:600"><i class="fa-solid fa-triangle-exclamation"></i> Warning: Expenses exceed available money!</div>';
    } else if (savingsGoal && (remaining < savingsGoal)) {
      warning = '<div style="color:#f59e42;font-weight:600"><i class="fa-solid fa-circle-info"></i> You are below your savings goal.</div>';
    }
    summaryDiv.innerHTML = `
      <div>Total Income: <b>$${totalIncome.toLocaleString()}</b></div>
      <div>Total Money in Wallets: <b>$${totalMoney.toLocaleString()}</b></div>
      <div>Total Monthly Expenses: <b>$${totalMonthly.toLocaleString()}</b></div>
      <div>Remaining after Expenses: <b>$${remaining.toLocaleString()}</b></div>
      <div>Percentage of Money Spent on Expenses: <b>${percentSpent}%</b></div>
      <div>Weekly Expenses: <b>$${weekly}</b></div>
      <div>Daily Expenses: <b>$${daily}</b></div>
      <div>Savings Rate: <b>${savingsRate}%</b></div>
      ${warning}
    `;
    updateDashboardStats();
  }

  // ... Repeat this pattern for incomes, expenses, and other DOM logic ...

  // (Move all other DOM event listeners and queries here)

  if (goalForm) {
    goalForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const goal = parseFloat(savingsGoalInput.value);
      if (isNaN(goal) || goal < 0) return;
      savingsGoal = goal;
      savingsGoalInput.value = '';
      saveUserData();
      renderGoal();
      renderSummary();
      updateDashboardStats();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all data?')) {
        wallets = [];
        expenses = [];
        savingsGoal = 0;
        expenseHistory = [];
        incomes = [];
        saveUserData();
        renderWallets();
        renderExpenses();
        renderSummary();
        renderGoal();
        renderChart();
        renderTrend();
        renderIncome();
      }
    });
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      localStorage.setItem('darkMode', document.body.classList.contains('dark'));
      renderChart();
    });
  }
});

// --- Savings Goal ---
function renderGoal() {
  if (!savingsGoal || savingsGoal <= 0) {
    goalProgressDiv.innerHTML = '<span style="color:#64748b">No savings goal set.</span>';
    updateDashboardStats();
    return;
  }
  const totalMoney = wallets.reduce((sum, w) => sum + w.amount, 0);
  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);
  const savings = totalMoney - totalMonthly;
  const percent = Math.max(0, Math.min(100, (savings / savingsGoal) * 100));
  goalProgressDiv.innerHTML = `
    <div>Progress: $${savings.toLocaleString()} / $${savingsGoal.toLocaleString()}</div>
    <div class="progress-bar"><div class="progress" style="width:${percent}%;"></div></div>
    <div>${percent.toFixed(1)}% of goal reached</div>
  `;
  updateDashboardStats();
}

// --- Category Chart ---
let categoryChart = null;
function renderChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const categoryTotals = {};
  expenses.forEach(e => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });
  const data = {
    labels: Object.keys(categoryTotals),
    datasets: [{
      data: Object.values(categoryTotals),
      backgroundColor: [
        '#6366f1', '#06b6d4', '#f59e42', '#059669', '#dc2626', '#fbbf24', '#a21caf', '#64748b'
      ],
      borderWidth: 1.5
    }]
  };
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(ctx, {
    type: 'pie',
    data,
    options: {
      plugins: {
        legend: {
          labels: {
            color: document.body.classList.contains('dark') ? '#f1f5f9' : '#334155',
            font: { size: 14 }
          }
        }
      }
    }
  });
}

// --- Trend Analysis (last 3 months) ---
function renderTrend() {
  // Only show if there is enough data
  if (!expenseHistory.length) {
    trendAnalysisDiv.innerHTML = '';
    return;
  }
  // Group by month
  const now = new Date();
  const months = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      total: 0
    });
  }
  expenseHistory.forEach(e => {
    const d = new Date(e.date);
    const idx = months.findIndex(m => m.label === d.toLocaleString('default', { month: 'short', year: 'numeric' }));
    if (idx !== -1) months[idx].total += e.amount;
  });
  let trend = '';
  for (let i = 0; i < months.length; i++) {
    trend += `<div>${months[i].label}: <b>$${months[i].total.toLocaleString()}</b></div>`;
  }
  trendAnalysisDiv.innerHTML = `<div><i class="fa-solid fa-chart-line"></i> <b>Expense Trend (last 3 months):</b></div>${trend}`;
}

// --- Dashboard Stat Cards ---
function updateDashboardStats() {
  const totalMoney = wallets.reduce((sum, w) => sum + w.amount, 0);
  const totalMonthly = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const remaining = totalMoney - totalMonthly;
  const savingsRate = totalMoney > 0 ? (((remaining) / totalMoney) * 100).toFixed(2) : '0.00';
  const goalProgress = (savingsGoal > 0) ? Math.max(0, Math.min(100, ((remaining / savingsGoal) * 100))).toFixed(1) : '0.0';
  document.getElementById('stat-total-money-value').textContent = `$${totalMoney.toLocaleString()}`;
  document.getElementById('stat-monthly-expenses-value').textContent = `$${totalMonthly.toLocaleString()}`;
  document.getElementById('stat-savings-rate-value').textContent = `${savingsRate}%`;
  document.getElementById('stat-goal-progress-value').textContent = `${goalProgress}%`;
  if (document.getElementById('total-income')) {
    document.getElementById('total-income').textContent = `Total Income: $${totalIncome.toLocaleString()}`;
  }
}

// --- Scrollspy for Sidebar ---
const navLinks = document.querySelectorAll('.nav-link');
const sectionIds = ['dashboard', 'profile-section', 'income-section', 'wallets-section', 'expenses-section', 'summary-section', 'export-section', 'about-section', 'help-section', 'settings'];
const sectionElements = sectionIds.map(id => document.getElementById(id));
window.addEventListener('scroll', () => {
  let fromTop = window.scrollY + 120;
  let current = sectionElements.findIndex(section => section && section.offsetTop > fromTop) - 1;
  if (current < 0) current = sectionElements.length - 1;
  navLinks.forEach((link, idx) => {
    if (idx === current) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});
navLinks.forEach((link, idx) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = sectionElements[idx];
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// --- Dark Mode ---
darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  renderChart();
});
function loadDarkMode() {
  if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
}

// --- User Auth (Demo Only) ---
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function loadUsers() {
  return JSON.parse(localStorage.getItem('users') || '{}');
}
function setCurrentUser(username) {
  currentUser = username;
  localStorage.setItem('currentUser', username);
}
function getCurrentUser() {
  return localStorage.getItem('currentUser');
}
function clearCurrentUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
}
function showDashboard() {
  document.getElementById('landing').classList.add('hidden');
  document.querySelector('.dashboard').classList.remove('hidden');
}
function showLanding() {
  document.getElementById('landing').classList.remove('hidden');
  document.querySelector('.dashboard').classList.add('hidden');
}
function updateProfile() {
  const info = document.getElementById('profile-info');
  if (!currentUser) { info.innerHTML = ''; return; }
  info.innerHTML = `
    <div><b>Username:</b> ${currentUser}</div>
    <form id="change-password-form">
      <label for="new-password">Change Password</label>
      <input type="password" id="new-password" required>
      <button type="submit"><i class="fa-solid fa-key"></i> Change</button>
    </form>
    <button id="logout-btn"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
  `;
  document.getElementById('change-password-form').onsubmit = function(e) {
    e.preventDefault();
    const users = loadUsers();
    users[currentUser].password = document.getElementById('new-password').value;
    saveUsers(users);
    alert('Password changed!');
    document.getElementById('new-password').value = '';
  };
  document.getElementById('logout-btn').onclick = function() {
    clearCurrentUser();
    showLanding();
  };
}
function setupAuth() {
  const loginForm = document.getElementById('login-form');
  loginForm.onsubmit = function(e) {
    e.preventDefault();
    const users = loadUsers();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    if (users[u] && users[u].password === p) {
      setCurrentUser(u);
      showDashboard();
      loadUserData();
      updateProfile();
      updateDashboardStats();
    } else {
      alert('Invalid credentials');
    }
  };
  // If no users exist, pre-create a demo user
  if (Object.keys(loadUsers()).length === 0) {
    const demoUsers = { 'demo': { password: 'demo', data: {} } };
    saveUsers(demoUsers);
    document.getElementById('login-username').value = 'demo';
    document.getElementById('login-password').value = 'demo';
    const msg = document.createElement('div');
    msg.style.margin = '12px 0';
    msg.style.color = '#6366f1';
    msg.innerHTML = 'Demo user created: <b>demo/demo</b>';
    loginForm.insertAdjacentElement('beforebegin', msg);
  }
}

// --- User Data Management ---
function saveUserData() {
  if (!currentUser) return;
  const users = loadUsers();
  users[currentUser].data = {
    wallets, expenses, savingsGoal, expenseHistory, incomes
  };
  saveUsers(users);
}
function loadUserData() {
  if (!currentUser) return;
  const users = loadUsers();
  const d = users[currentUser].data || {};
  wallets = d.wallets || [];
  expenses = d.expenses || [];
  savingsGoal = d.savingsGoal || 0;
  expenseHistory = d.expenseHistory || [];
  incomes = d.incomes || [];
  renderWallets();
  renderExpenses();
  renderSummary();
  renderGoal();
  renderChart();
  renderTrend();
  renderIncome();
  updateDashboardStats();
}

// --- Income & Expense Management ---
function renderIncome() {
  const incomeList = document.getElementById('income-list');
  if (!incomeList) return;
  incomeList.innerHTML = '';
  incomes.forEach((inc, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<b>${inc.name}</b>: $${inc.amount.toLocaleString()} <span>(${inc.category})</span> <button class='edit-income' data-idx='${idx}'><i class='fa-solid fa-pen'></i></button> <button class='delete-income' data-idx='${idx}'><i class='fa-solid fa-trash'></i></button>`;
    incomeList.appendChild(li);
  });
  // Edit/delete handlers
  incomeList.querySelectorAll('.edit-income').forEach(btn => {
    btn.onclick = function() {
      const idx = +btn.getAttribute('data-idx');
      const inc = incomes[idx];
      const newName = prompt('Edit income name:', inc.name);
      if (newName !== null && newName.trim() !== '') incomes[idx].name = newName.trim();
      const newAmt = prompt('Edit income amount:', inc.amount);
      if (newAmt !== null && !isNaN(+newAmt)) incomes[idx].amount = +newAmt;
      saveUserData();
      renderIncome();
      updateAllAnalytics && updateAllAnalytics();
      showNotification('Income updated!', 'success');
      addAuditLog('edit_income', { idx, name: incomes[idx].name, amount: incomes[idx].amount });
    };
  });
  incomeList.querySelectorAll('.delete-income').forEach(btn => {
    btn.onclick = function() {
      const idx = +btn.getAttribute('data-idx');
      if (confirm('Delete this income?')) {
        incomes.splice(idx, 1);
        saveUserData();
        renderIncome();
        updateAllAnalytics && updateAllAnalytics();
        showNotification('Income deleted!', 'warning');
        addAuditLog('delete_income', { idx });
      }
    };
  });
}
function renderExpense() {
  const expenseList = document.getElementById('expense-list');
  if (!expenseList) return;
  expenseList.innerHTML = '';
  expenses.forEach((exp, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<b>${exp.name}</b>: $${exp.amount.toLocaleString()} <span>(${exp.category})</span> <button class='edit-expense' data-idx='${idx}'><i class='fa-solid fa-pen'></i></button> <button class='delete-expense' data-idx='${idx}'><i class='fa-solid fa-trash'></i></button>`;
    expenseList.appendChild(li);
  });
  // Edit/delete handlers
  expenseList.querySelectorAll('.edit-expense').forEach(btn => {
    btn.onclick = function() {
      const idx = +btn.getAttribute('data-idx');
      const exp = expenses[idx];
      const newName = prompt('Edit expense name:', exp.name);
      if (newName !== null && newName.trim() !== '') expenses[idx].name = newName.trim();
      const newAmt = prompt('Edit expense amount:', exp.amount);
      if (newAmt !== null && !isNaN(+newAmt)) expenses[idx].amount = +newAmt;
      saveUserData();
      renderExpense();
      updateAllAnalytics && updateAllAnalytics();
      showNotification('Expense updated!', 'success');
      addAuditLog('edit_expense', { idx, name: expenses[idx].name, amount: expenses[idx].amount });
    };
  });
  expenseList.querySelectorAll('.delete-expense').forEach(btn => {
    btn.onclick = function() {
      const idx = +btn.getAttribute('data-idx');
      if (confirm('Delete this expense?')) {
        expenses.splice(idx, 1);
        saveUserData();
        renderExpense();
        updateAllAnalytics && updateAllAnalytics();
        showNotification('Expense deleted!', 'warning');
        addAuditLog('delete_expense', { idx });
      }
    };
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Income add form
  const incomeForm = document.getElementById('income-form');
  if (incomeForm) {
    incomeForm.onsubmit = function(e) {
      e.preventDefault();
      const name = document.getElementById('income-name').value.trim();
      const amt = +document.getElementById('income-amount').value;
      const cat = document.getElementById('income-category') ? document.getElementById('income-category').value : 'General';
      const freq = document.getElementById('income-frequency') ? document.getElementById('income-frequency').value : 'none';
      if (name && !isNaN(amt)) {
        if (freq && freq !== 'none') {
          recurringIncomes.push({ name, amount: amt, category: cat, frequency: freq, lastDate: null });
          addAuditLog('add_recurring_income', { name, amount: amt, category: cat, frequency: freq });
        } else {
          incomes.push({ name, amount: amt, category: cat, date: new Date().toISOString(), notes: '', isRecurring: false });
          addAuditLog('add_income', { name, amount: amt, category: cat });
        }
        saveUserData();
        renderIncome();
        updateAllAnalytics && updateAllAnalytics();
        showNotification('Income added!', 'success');
        incomeForm.reset();
      }
    };
  }
  renderIncome();
  // Expense add form
  const expenseForm = document.getElementById('expense-form');
  if (expenseForm) {
    expenseForm.onsubmit = function(e) {
      e.preventDefault();
      const name = document.getElementById('expense-name').value.trim();
      const amt = +document.getElementById('expense-amount').value;
      const cat = document.getElementById('expense-category') ? document.getElementById('expense-category').value : 'General';
      const freq = document.getElementById('expense-frequency') ? document.getElementById('expense-frequency').value : 'none';
      if (name && !isNaN(amt)) {
        if (freq && freq !== 'none') {
          recurringExpenses.push({ name, amount: amt, category: cat, frequency: freq, lastDate: null });
          addAuditLog('add_recurring_expense', { name, amount: amt, category: cat, frequency: freq });
        } else {
          expenses.push({ name, amount: amt, category: cat, date: new Date().toISOString(), notes: '', isRecurring: false });
          addAuditLog('add_expense', { name, amount: amt, category: cat });
        }
        saveUserData();
        renderExpense();
        updateAllAnalytics && updateAllAnalytics();
        showNotification('Expense added!', 'success');
        expenseForm.reset();
      }
    };
  }
  renderExpense();
});

// --- Export/Import ---
const exportJsonBtn = document.getElementById('export-json');
const exportCsvBtn = document.getElementById('export-csv');
const importFileInput = document.getElementById('import-file');
const importBtn = document.getElementById('import-btn');
const importStatus = document.getElementById('import-status');
exportJsonBtn.onclick = function() {
  const data = { wallets, expenses, savingsGoal, expenseHistory, incomes };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget-tracker-data.json';
  a.click();
  URL.revokeObjectURL(url);
};
exportCsvBtn.onclick = function() {
  let csv = 'Type,Name,Amount,Category,Notes,Date\n';
  incomes.forEach(i => {
    csv += `Income,${i.name},${i.amount},,,\n`;
  });
  wallets.forEach(w => {
    csv += `Wallet,${w.name},${w.amount},,,\n`;
  });
  expenses.forEach(e => {
    csv += `Expense,${e.name},${e.amount},${e.category || ''},${e.notes || ''},${e.date || ''}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget-tracker-data.csv';
  a.click();
  URL.revokeObjectURL(url);
};
importBtn.onclick = function() {
  const file = importFileInput.files[0];
  if (!file) {
    importStatus.textContent = 'Please select a file.';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      let data;
      if (file.name.endsWith('.json')) {
        data = JSON.parse(e.target.result);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV import for demo
        const lines = e.target.result.split('\n');
        data = { incomes: [], wallets: [], expenses: [] };
        for (let i = 1; i < lines.length; i++) {
          const [type, name, amount, category, notes, date] = lines[i].split(',');
          if (type === 'Income') data.incomes.push({ name, amount: parseFloat(amount) });
          if (type === 'Wallet') data.wallets.push({ name, amount: parseFloat(amount) });
          if (type === 'Expense') data.expenses.push({ name, amount: parseFloat(amount), category, notes, date });
        }
      }
      wallets = data.wallets || [];
      expenses = data.expenses || [];
      savingsGoal = data.savingsGoal || 0;
      expenseHistory = data.expenseHistory || [];
      incomes = data.incomes || [];
      saveUserData();
      renderWallets();
      renderExpenses();
      renderSummary();
      renderGoal();
      renderChart();
      renderTrend();
      renderIncome();
      updateDashboardStats();
      importStatus.textContent = 'Import successful!';
    } catch (err) {
      importStatus.textContent = 'Import failed: ' + err;
    }
  };
  reader.readAsText(file);
};

// Profile avatar logic for profile.html
function getInitials(name) {
  return name ? name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0,2) : '';
}
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const color = `hsl(${hash % 360}, 70%, 70%)`;
  return color;
}
function renderProfileAvatar() {
  const user = localStorage.getItem('currentUser');
  const users = JSON.parse(localStorage.getItem('users') || '{}');
  const data = users[user] && users[user].data ? users[user].data : {};
  const avatarImg = document.getElementById('profile-avatar');
  const usernameDiv = document.getElementById('profile-username');
  if (usernameDiv) usernameDiv.textContent = user || '';
  if (avatarImg) {
    if (data.profilePic) {
      avatarImg.src = data.profilePic;
      avatarImg.style.background = '#e0e7ef';
    } else {
      const initials = getInitials(user);
      const color = getAvatarColor(user||'');
      const svg = `<svg width='96' height='96' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='${color}'/><text x='50%' y='54%' text-anchor='middle' font-size='38' font-family='Inter,Arial,sans-serif' fill='#fff' dy='.1em'>${initials}</text></svg>`;
      avatarImg.src = 'data:image/svg+xml;base64,' + btoa(svg);
      avatarImg.style.background = color;
    }
  }
}
if (document.getElementById('change-pic-btn')) {
  document.getElementById('change-pic-btn').onclick = function() {
    document.getElementById('profile-pic-upload').click();
  };
}
if (document.getElementById('profile-pic-upload')) {
  document.getElementById('profile-pic-upload').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
      const user = localStorage.getItem('currentUser');
      const users = JSON.parse(localStorage.getItem('users') || '{}');
      if (users[user]) {
        if (!users[user].data) users[user].data = {};
        users[user].data.profilePic = ev.target.result;
        localStorage.setItem('users', JSON.stringify(users));
        renderProfileAvatar();
      }
    };
    reader.readAsDataURL(file);
  };
}
if (document.getElementById('profile-avatar')) renderProfileAvatar();

// Initial render
setupAuth();
if (getCurrentUser()) {
  currentUser = getCurrentUser();
  showDashboard();
  loadUserData();
  updateProfile();
  updateDashboardStats();
} else {
  showLanding();
}
loadDarkMode();

// --- UTILITY FUNCTIONS ---
function addAuditLog(action, details) {
  auditLog.push({ action, details, date: new Date().toISOString() });
  if (auditLog.length > 1000) auditLog.shift();
  saveUserData();
}
function addBadge(badge) {
  if (!badges.includes(badge)) {
    badges.push(badge);
    saveUserData();
  }
}
function getCategoryMeta(name) {
  return customCategories.find(c => c.name === name) || { name, icon: 'fa-tag', color: '#6366f1' };
}
function addCustomCategory(name, icon, color) {
  if (!customCategories.some(c => c.name === name)) {
    customCategories.push({ name, icon, color });
    saveUserData();
  }
}
function removeCustomCategory(name) {
  customCategories = customCategories.filter(c => c.name !== name);
  saveUserData();
}
function setBudget(category, amount) {
  budgets[category] = { amount: parseFloat(amount), spent: 0 };
  saveUserData();
}
function updateBudgetSpent(category, spent) {
  if (budgets[category]) {
    budgets[category].spent = spent;
    saveUserData();
  }
}
// Recurring transaction helpers
function addRecurringExpense(exp) {
  recurringExpenses.push(exp);
  saveUserData();
}
function addRecurringIncome(inc) {
  recurringIncomes.push(inc);
  saveUserData();
}
function removeRecurringExpense(idx) {
  recurringExpenses.splice(idx, 1);
  saveUserData();
}
function removeRecurringIncome(idx) {
  recurringIncomes.splice(idx, 1);
  saveUserData();
}

// --- UI WIRING FOR ENHANCEMENTS ---
document.addEventListener('DOMContentLoaded', function() {
  // Populate categories in expense/income forms
  function populateCategories() {
    const catSelect = document.getElementById('expense-category');
    if (catSelect) {
      catSelect.innerHTML = '';
      customCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        catSelect.appendChild(opt);
      });
    }
    const budgetCatSelect = document.getElementById('budget-category');
    if (budgetCatSelect) {
      budgetCatSelect.innerHTML = '';
      customCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        budgetCatSelect.appendChild(opt);
      });
    }
  }
  populateCategories();

  // Custom category form
  const customCatForm = document.getElementById('custom-category-form');
  if (customCatForm) {
    customCatForm.onsubmit = function(e) {
      e.preventDefault();
      const name = document.getElementById('custom-category-name').value.trim();
      const icon = document.getElementById('custom-category-icon').value.trim();
      const color = document.getElementById('custom-category-color').value;
      if (name && icon && color) {
        addCustomCategory(name, icon, color);
        populateCategories();
        renderCustomCategories();
        addAuditLog('add_category', { name, icon, color });
        customCatForm.reset();
      }
    };
  }
  function renderCustomCategories() {
    const ul = document.getElementById('custom-categories-list');
    if (!ul) return;
    ul.innerHTML = '';
    customCategories.forEach(cat => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid ${cat.icon}" style="color:${cat.color}"></i> ${cat.name}`;
      if (!['General','Food','Bills','Shopping','Transport','Health','Entertainment','Other'].includes(cat.name)) {
        const delBtn = document.createElement('button');
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.onclick = () => {
          removeCustomCategory(cat.name);
          populateCategories();
          renderCustomCategories();
          addAuditLog('remove_category', { name: cat.name });
        };
        li.appendChild(delBtn);
      }
      ul.appendChild(li);
    });
  }
  renderCustomCategories();

  // Budget form
  const budgetForm = document.getElementById('budget-form');
  if (budgetForm) {
    budgetForm.onsubmit = function(e) {
      e.preventDefault();
      const cat = document.getElementById('budget-category').value;
      const amt = document.getElementById('budget-amount').value;
      if (cat && amt) {
        setBudget(cat, amt);
        renderBudgets();
        addAuditLog('set_budget', { category: cat, amount: amt });
        budgetForm.reset();
      }
    };
  }
  function renderBudgets() {
    const div = document.getElementById('budgets-list');
    if (!div) return;
    div.innerHTML = '';
    Object.keys(budgets).forEach(cat => {
      const b = budgets[cat];
      const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      updateBudgetSpent(cat, spent);
      const meta = getCategoryMeta(cat);
      const percent = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
      div.innerHTML += `<div style="margin-bottom:8px"><i class="fa-solid ${meta.icon}" style="color:${meta.color}"></i> <b>${cat}</b>: $${spent.toLocaleString()} / $${b.amount.toLocaleString()} <div class='progress-bar'><div class='progress' style='width:${percent}%;background:${meta.color}'></div></div> <span>${percent.toFixed(1)}%</span></div>`;
    });
  }
  renderBudgets();

  // Audit log
  function renderAuditLog() {
    const ul = document.getElementById('audit-log-list');
    if (!ul) return;
    ul.innerHTML = '';
    auditLog.slice(-20).reverse().forEach(log => {
      const li = document.createElement('li');
      li.textContent = `[${new Date(log.date).toLocaleString()}] ${log.action} - ${JSON.stringify(log.details)}`;
      ul.appendChild(li);
    });
  }
  renderAuditLog();
  const undoBtn = document.getElementById('undo-last-action');
  if (undoBtn) {
    undoBtn.onclick = function() {
      if (auditLog.length === 0) return;
      const last = auditLog.pop();
      // Simple undo for add/remove category and set budget
      if (last.action === 'add_category') removeCustomCategory(last.details.name);
      if (last.action === 'remove_category') addCustomCategory(last.details.name, last.details.icon, last.details.color);
      if (last.action === 'set_budget') delete budgets[last.details.category];
      saveUserData();
      populateCategories();
      renderCustomCategories();
      renderBudgets();
      renderAuditLog();
    };
  }

  // In-app notification area
  function showNotification(msg, type = 'info', timeout = 4000) {
    const area = document.getElementById('notification-area');
    if (!area) return;
    area.innerHTML = `<div class='notification ${type}'>${msg}</div>`;
    setTimeout(() => { area.innerHTML = ''; }, timeout);
  }
  window.showNotification = showNotification;

  // Accessibility toggles
  const autoDark = document.getElementById('auto-dark-mode');
  if (autoDark) {
    autoDark.checked = localStorage.getItem('autoDarkMode') === 'true';
    autoDark.onchange = function() {
      localStorage.setItem('autoDarkMode', autoDark.checked);
      if (autoDark.checked) {
        const hour = new Date().getHours();
        if (hour < 7 || hour > 18) document.body.classList.add('dark');
        else document.body.classList.remove('dark');
      }
    };
  }
  const highContrast = document.getElementById('high-contrast-mode');
  if (highContrast) {
    highContrast.checked = localStorage.getItem('highContrastMode') === 'true';
    highContrast.onchange = function() {
      localStorage.setItem('highContrastMode', highContrast.checked);
      if (highContrast.checked) document.body.classList.add('high-contrast');
      else document.body.classList.remove('high-contrast');
    };
  }
  // Initial accessibility state
  if (localStorage.getItem('highContrastMode') === 'true') document.body.classList.add('high-contrast');
});

// --- RECURRING TRANSACTIONS & NOTIFICATIONS ---
function processRecurringTransactions() {
  const now = new Date();
  let added = false;
  // Helper to check if a recurring item is due
  function isDue(lastDate, freq) {
    if (!lastDate) return true;
    const last = new Date(lastDate);
    if (freq === 'monthly') return (now - last) / (1000*60*60*24) >= 28;
    if (freq === 'weekly') return (now - last) / (1000*60*60*24) >= 7;
    if (freq === 'yearly') return (now - last) / (1000*60*60*24) >= 365;
    if (freq === 'daily') return (now - last) / (1000*60*60*24) >= 1;
    return false;
  }
  // Recurring expenses
  recurringExpenses.forEach(rec => {
    if (isDue(rec.lastDate, rec.frequency)) {
      expenses.push({
        name: rec.name,
        amount: rec.amount,
        category: rec.category,
        date: now.toISOString(),
        notes: '[Recurring]',
        isRecurring: true
      });
      rec.lastDate = now.toISOString();
      addAuditLog('auto_add_recurring_expense', { name: rec.name, amount: rec.amount, category: rec.category });
      added = true;
    }
  });
  // Recurring incomes
  recurringIncomes.forEach(rec => {
    if (isDue(rec.lastDate, rec.frequency)) {
      incomes.push({
        name: rec.name,
        amount: rec.amount,
        category: rec.category,
        date: now.toISOString(),
        notes: '[Recurring]',
        isRecurring: true
      });
      rec.lastDate = now.toISOString();
      addAuditLog('auto_add_recurring_income', { name: rec.name, amount: rec.amount, category: rec.category });
      added = true;
    }
  });
  if (added) {
    saveUserData();
    showNotification('Recurring transactions added!', 'success');
  }
}

// --- NOTIFICATION TRIGGERS ---
function checkNotifications() {
  // Low wallet balance
  const total = wallets.reduce((sum, w) => sum + w.amount, 0);
  if (total < 20) showNotification('Warning: Your total wallet balance is low!', 'warning', 6000);
  // Approaching savings goal
  if (savingsGoal && total >= 0.8 * savingsGoal) showNotification('You are close to your savings goal!', 'info', 6000);
  // Upcoming recurring expenses (next 3 days)
  const now = new Date();
  recurringExpenses.forEach(rec => {
    if (rec.lastDate) {
      const last = new Date(rec.lastDate);
      let nextDue;
      if (rec.frequency === 'monthly') nextDue = new Date(last.setMonth(last.getMonth() + 1));
      else if (rec.frequency === 'weekly') nextDue = new Date(last.setDate(last.getDate() + 7));
      else if (rec.frequency === 'yearly') nextDue = new Date(last.setFullYear(last.getFullYear() + 1));
      else if (rec.frequency === 'daily') nextDue = new Date(last.setDate(last.getDate() + 1));
      else return;
      const days = (nextDue - now) / (1000*60*60*24);
      if (days >= 0 && days <= 3) {
        showNotification(`Upcoming recurring expense: ${rec.name} ($${rec.amount}) due soon!`, 'info', 7000);
      }
    }
  });
}

// --- INIT ENHANCEMENTS ON LOAD ---
document.addEventListener('DOMContentLoaded', function() {
  processRecurringTransactions();
  checkNotifications();
});

// --- ADVANCED ANALYTICS & BADGES ---
function renderAnalytics() {
  // Category breakdown chart
  const catChart = document.getElementById('categoryChart');
  if (catChart && typeof Chart !== 'undefined') {
    const catTotals = {};
    expenses.forEach(e => {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    const labels = Object.keys(catTotals);
    const data = labels.map(l => catTotals[l]);
    if (window._catChartObj) window._catChartObj.destroy();
    window._catChartObj = new Chart(catChart, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: labels.map(l => getCategoryMeta(l).color) }]
      },
      options: { plugins: { legend: { display: true } } }
    });
  }
  // Cash flow over time
  const cashFlowChart = document.getElementById('cashFlowChart');
  if (cashFlowChart && typeof Chart !== 'undefined') {
    // Group by month
    const flow = {};
    incomes.forEach(i => {
      const d = new Date(i.date); const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      flow[key] = (flow[key] || 0) + i.amount;
    });
    expenses.forEach(e => {
      const d = new Date(e.date); const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      flow[key] = (flow[key] || 0) - e.amount;
    });
    const months = Object.keys(flow).sort();
    const values = months.map(m => flow[m]);
    if (window._cashFlowChartObj) window._cashFlowChartObj.destroy();
    window._cashFlowChartObj = new Chart(cashFlowChart, {
      type: 'line',
      data: { labels: months, datasets: [{ label: 'Net Cash Flow', data: values, borderColor: '#6366f1', fill: false }] },
      options: { plugins: { legend: { display: false } } }
    });
  }
  // Trend analysis
  const trendDiv = document.getElementById('trend-analysis');
  if (trendDiv) {
    const lastMonth = new Date(); lastMonth.setMonth(lastMonth.getMonth()-1);
    const lastMonthKey = `${lastMonth.getFullYear()}-${lastMonth.getMonth()+1}`;
    const thisMonthKey = `${(new Date()).getFullYear()}-${(new Date()).getMonth()+1}`;
    const flow = {};
    incomes.forEach(i => {
      const d = new Date(i.date); const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      flow[key] = (flow[key] || 0) + i.amount;
    });
    expenses.forEach(e => {
      const d = new Date(e.date); const key = `${d.getFullYear()}-${d.getMonth()+1}`;
      flow[key] = (flow[key] || 0) - e.amount;
    });
    const last = flow[lastMonthKey] || 0;
    const curr = flow[thisMonthKey] || 0;
    let trendMsg = '';
    if (curr > last) trendMsg = `Your net cash flow increased by $${(curr-last).toLocaleString()} compared to last month.`;
    else if (curr < last) trendMsg = `Your net cash flow decreased by $${(last-curr).toLocaleString()} compared to last month.`;
    else trendMsg = 'Your net cash flow is unchanged from last month.';
    trendDiv.textContent = trendMsg;
  }
  // Budget progress
  const budgetDiv = document.getElementById('budgets-progress-list');
  if (budgetDiv) {
    budgetDiv.innerHTML = '';
    Object.keys(budgets).forEach(cat => {
      const b = budgets[cat];
      const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
      const meta = getCategoryMeta(cat);
      const percent = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
      budgetDiv.innerHTML += `<div style="margin-bottom:8px"><i class="fa-solid ${meta.icon}" style="color:${meta.color}"></i> <b>${cat}</b>: $${spent.toLocaleString()} / $${b.amount.toLocaleString()} <div class='progress-bar'><div class='progress' style='width:${percent}%;background:${meta.color}'></div></div> <span>${percent.toFixed(1)}%</span></div>`;
    });
  }
}
// Call analytics render on load and after data changes
function updateAllAnalytics() {
  renderAnalytics();
  // ...add more as needed
}

document.addEventListener('DOMContentLoaded', updateAllAnalytics);

// --- BADGES/ACHIEVEMENTS ---
function updateBadges() {
  const badges = [];
  // Streak: 7 days of logging
  const days = new Set(expenses.concat(incomes).map(t => (new Date(t.date)).toDateString()));
  if (days.size >= 7) badges.push({ icon: 'fa-fire', label: '7-Day Streak' });
  // Savings goal reached
  const total = wallets.reduce((sum, w) => sum + w.amount, 0);
  if (savingsGoal && total >= savingsGoal) badges.push({ icon: 'fa-trophy', label: 'Savings Goal Achieved' });
  // Under budget for all categories
  let allUnder = true;
  Object.keys(budgets).forEach(cat => {
    const b = budgets[cat];
    const spent = expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);
    if (spent > b.amount) allUnder = false;
  });
  if (Object.keys(budgets).length && allUnder) badges.push({ icon: 'fa-medal', label: 'All Budgets Met' });
  // Custom: 10+ transactions
  if (expenses.length + incomes.length >= 10) badges.push({ icon: 'fa-star', label: '10+ Transactions' });
  // Render
  const ul = document.getElementById('badges-list');
  if (ul) {
    ul.innerHTML = '';
    badges.forEach(b => {
      const li = document.createElement('li');
      li.innerHTML = `<i class="fa-solid ${b.icon}"></i> ${b.label}`;
      ul.appendChild(li);
    });
  }
}
document.addEventListener('DOMContentLoaded', updateBadges);

// --- ACCESSIBILITY IMPROVEMENTS ---
document.addEventListener('DOMContentLoaded', function() {
  // Keyboard navigation for sidebar
  const sidebarLinks = document.querySelectorAll('.sidebar nav a');
  sidebarLinks.forEach((a, i) => {
    a.setAttribute('tabindex', '0');
    a.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sidebarLinks[(i+1)%sidebarLinks.length].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sidebarLinks[(i-1+sidebarLinks.length)%sidebarLinks.length].focus();
      }
    });
  });
  // ARIA for notifications
  const notif = document.getElementById('notification-area');
  if (notif) notif.setAttribute('role', 'status');
}); 
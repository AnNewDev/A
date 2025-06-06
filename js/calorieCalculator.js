// Modern Nutrition Score & Calorie Calculator UI

document.addEventListener('DOMContentLoaded', () => {
  const scoreValue = document.getElementById('nutrition-score-value');
  const scoreMsg = document.getElementById('nutrition-score-message');
  const timeTabs = document.querySelectorAll('.nutrition-time-tab');
  const logMealBtn = document.getElementById('log-new-meal-btn');
  let nutritionBarChart;

  // Demo data structure: [{date, calories, protein, fat, carbs}]
  // In real app, replace with actual meal log data from localStorage or backend
  let allItems = JSON.parse(localStorage.getItem('calculatorItems') || '[]');
  // For demo, add fake nutrients if missing
  allItems = allItems.map(item => ({
    ...item,
    date: item.date || new Date().toISOString().slice(0, 10),
    protein: item.protein || Math.floor(Math.random()*30+10),
    fat: item.fat || Math.floor(Math.random()*20+5),
    carbs: item.carbs || Math.floor(Math.random()*40+20)
  }));

  // Group by day for chart
  function groupByDay(items) {
    const grouped = {};
    items.forEach(item => {
      const d = item.date;
      if (!grouped[d]) grouped[d] = {calories:0, protein:0, fat:0, carbs:0};
      grouped[d].calories += Number(item.calories)||0;
      grouped[d].protein += Number(item.protein)||0;
      grouped[d].fat += Number(item.fat)||0;
      grouped[d].carbs += Number(item.carbs)||0;
    });
    return grouped;
  }

  // Get last N days as labels
  function getLastNDates(n) {
    const arr = [];
    for (let i = n-1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      arr.push(d.toISOString().slice(0,10));
    }
    return arr;
  }

  // Calculate nutrition score (simple formula for demo)
  function calcScore(items) {
    if (!items.length) return '--';
    // Example: score is 100 - abs(ideal protein - avg protein)
    const avgProtein = items.reduce((sum, i) => sum+(i.protein||0),0)/items.length;
    const idealProtein = 50;
    let score = Math.max(0, 100 - Math.abs(idealProtein-avgProtein));
    return score.toFixed(1);
  }

  // Render daily totals for selected range
  function renderDailyTotals(items) {
    if (!items.length) {
      document.getElementById('nutrition-daily-totals').textContent = '';
      return;
    }
    const totalCalories = items.reduce((sum,i)=>sum+(Number(i.calories)||0),0);
    const totalProtein = items.reduce((sum,i)=>sum+(Number(i.protein)||0),0);
    const totalFat = items.reduce((sum,i)=>sum+(Number(i.fat)||0),0);
    const totalCarbs = items.reduce((sum,i)=>sum+(Number(i.carbs)||0),0);
    document.getElementById('nutrition-daily-totals').textContent = `Total: ${totalCalories} kcal | ${totalProtein}g Protein | ${totalFat}g Fat | ${totalCarbs}g Carbs`;
  }

  // Render food log table for selected range
  function renderFoodLogTable(items) {
    const tbody = document.querySelector('#nutrition-log-table tbody');
    tbody.innerHTML = '';
    if (!items.length) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="7" class="text-center text-muted">No foods logged for this range.</td>`;
      tbody.appendChild(tr);
      return;
    }
    items.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.date||''}</td>
        <td>${item.foodName||item.name||'Unknown'}</td>
        <td>${item.calories||0}</td>
        <td>${item.protein||0}</td>
        <td>${item.fat||0}</td>
        <td>${item.carbs||0}</td>
        <td><button class="nutrition-log-delete-btn" data-idx="${idx}" title="Delete"><i class="fas fa-trash"></i></button></td>
      `;
      tbody.appendChild(tr);
    });
    // Delete food handler
    tbody.querySelectorAll('button[data-idx]').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = Number(btn.getAttribute('data-idx'));
        allItems.splice(idx, 1);
        localStorage.setItem('calculatorItems', JSON.stringify(allItems));
        updateAll();
      });
    });
  }

  // Render chart for a given range
  function renderChart(range) {
    let labels = [];
    let days = 7;
    if (range==='1d') days=1;
    else if (range==='1w') days=7;
    else if (range==='1m') days=30;
    else if (range==='1y') days=365;
    else days=365*10;
    labels = getLastNDates(days);
    const grouped = groupByDay(allItems);
    const calories = [], protein = [], fat = [], carbs = [];
    labels.forEach(d => {
      const g = grouped[d]||{calories:0,protein:0,fat:0,carbs:0};
      calories.push(g.calories);
      protein.push(g.protein);
      fat.push(g.fat);
      carbs.push(g.carbs);
    });
    // Chart.js single bar for calories only
    const ctx = document.getElementById('nutritionBarChart').getContext('2d');
    if (nutritionBarChart) nutritionBarChart.destroy();
    nutritionBarChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.map(d=>{
          const dt = new Date(d);
          return days<=7 ? dt.toLocaleDateString(undefined,{weekday:'short'}) : dt.toLocaleDateString();
        }),
        datasets: [
          { label: 'Calories', data: calories, backgroundColor: '#ff9800', borderRadius: 6, barPercentage:0.7 }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        scales: {
          x: { stacked: false, grid: {display:false} },
          y: { beginAtZero:true, grid:{color:'#f0f0f0'}, ticks:{color:'#888'} }
        }
      }
    });
    // Update nutrition score
    const itemsInRange = allItems.filter(i=>labels.includes(i.date));
    scoreValue.textContent = calcScore(itemsInRange);
    scoreMsg.textContent = itemsInRange.length ? (scoreValue.textContent<60?"You need more protein intake this week.":"Great job! Keep it up.") : "Track your meals and nutrients for better health.";
    renderDailyTotals(itemsInRange);
    renderFoodLogTable(itemsInRange);
  }

  // Tab switching
  timeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      timeTabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      renderChart(btn.getAttribute('data-range'));
    });
  });

  // Log new meal button
  logMealBtn.addEventListener('click', () => {
    window.location.href = 'history.html';
  });

  // Unified update function
  function updateAll() {
    // Re-read items from localStorage
    allItems = JSON.parse(localStorage.getItem('calculatorItems') || '[]');
    renderChart(document.querySelector('.nutrition-time-tab.active')?.getAttribute('data-range') || '1d');
  }

  // Initial chart and table
  updateAll();

  // For instant update: listen for storage changes (in case other tabs/pages add foods)
  window.addEventListener('storage', (e)=>{
    if (e.key === 'calculatorItems') updateAll();
  });
});

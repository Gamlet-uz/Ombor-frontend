import { fetchTodayExpenses, saveSales, fetchMonitoring } from "../api.js";

export async function renderAdmin(container, user, onLogout) {
  let activeTab = 'bugun';
  let todayExpenses = [];
  let catTotals = { "Ovqat": 0, "Somsa": 0, "Shashlik": 0, "Fast food": 0 };
  let monitoringData = [];

  const tg = window.Telegram?.WebApp;

  function haptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      if(type === 'success' || type === 'error') tg.HapticFeedback.notificationOccurred(type);
      else tg.HapticFeedback.impactOccurred(type);
    }
  }

  // Бўлимлар номлари ва калитлари
  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  // Асосий қобиқ ва Меню (Тўлиқ экран - w-full)
  container.innerHTML = `
    <div class="bg-gray-50 min-h-screen flex flex-col pb-24 w-full">
      
      <!-- Тепа қисм -->
      <div class="bg-white px-5 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10 w-full">
        <div>
          <span class="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">Админ Панел</span>
          <h3 class="font-black text-lg text-gray-900 mt-1.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-95">Чиқиш</button>
      </div>
      
      <!-- Меню (Таблар) -->
      <div class="flex bg-white border-b border-gray-200 shadow-sm w-full">
        <button class="tab-btn flex-1 py-4 text-sm font-bold text-center border-b-2 text-blue-600 border-blue-600 transition" data-tab="bugun">
          📝 Бугунги ҳисобот
        </button>
        <button class="tab-btn flex-1 py-4 text-sm font-bold text-center border-b-2 text-gray-400 border-transparent transition" data-tab="monitoring">
          📈 Мониторинг
        </button>
      </div>

      <!-- Асосий контент (Динамик ўзгаради) -->
      <div id="adminContent" class="p-4 transition-opacity duration-300 w-full"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };
  const adminContent = document.getElementById("adminContent");

  // Табларни алмаштириш мантиғи
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = () => {
      haptic('light');
      document.querySelectorAll('.tab-btn').forEach(b => {
         b.classList.remove('text-blue-600', 'border-blue-600');
         b.classList.add('text-gray-400', 'border-transparent');
      });
      btn.classList.add('text-blue-600', 'border-blue-600');
      btn.classList.remove('text-gray-400', 'border-transparent');
      
      activeTab = btn.dataset.tab;
      adminContent.style.opacity = 0;
      setTimeout(() => {
        loadTab();
        adminContent.style.opacity = 1;
      }, 150);
    };
  });

  // Маълумотларни сервердан юклаш
  async function loadTab() {
    adminContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p class="text-xs text-gray-400 mt-3 font-bold">Юкланмоқда...</p></div>`;
    
    try {
      if (activeTab === 'bugun') {
        const res = await fetchTodayExpenses();
        todayExpenses = res.records || [];
        catTotals = { "Ovqat": 0, "Somsa": 0, "Shashlik": 0, "Fast food": 0 };
        todayExpenses.forEach(r => { if(catTotals[r.category] !== undefined) catTotals[r.category] += r.totalAmount; });
        renderBugun();
      } else {
        const res = await fetchMonitoring();
        monitoringData = res.records || [];
        renderMonitoring();
      }
    } catch (e) {
      adminContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Маълумотларни юклаб бўлмади!</div>`;
    }
  }

  // =====================================
  // 1-ОЙНА: БУГУНГИ САВДО ВА ФОЙДА
  // =====================================
  function renderBugun() {
    const inputsHtml = catKeys.map(k => `
      <div class="flex items-center justify-between bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 mb-3 w-full">
        <div class="w-1/3 pr-2">
          <div class="font-bold text-sm text-gray-800">${catNames[k]}</div>
          <div class="text-[10px] text-red-500 font-bold mt-0.5">Харажат:<br>${catTotals[k].toLocaleString()} сўм</div>
        </div>
        <div class="w-2/3 pl-2 border-l border-gray-100">
          <input type="number" step="any" id="sale_${k}" class="sale-input w-full border border-gray-200 rounded-xl p-2.5 text-right font-black text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition" placeholder="Савдо (сўм)">
          <div class="text-[10px] text-right mt-1.5 font-black text-gray-400 tracking-wide" id="profit_${k}">Фойда: 0</div>
        </div>
      </div>
    `).join('');

    adminContent.innerHTML = `
      <h4 class="font-extrabold text-gray-800 mb-4 px-1 text-sm uppercase tracking-wider w-full">Бугунги тушумни киритинг</h4>
      ${inputsHtml}
      
      <!-- Қора экран: Умумий Соф фойда -->
      <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-xl mt-6 mb-5 text-center transition-all duration-300 w-full">
         <div class="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">Кунлик соф фойда</div>
         <div class="text-4xl font-black text-gray-500 mt-2" id="totalProfit">0 сўм</div>
      </div>
      
      <button id="saveSalesBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
        Савдони Сақлаш
      </button>
    `;

    // Жонли (Live) фойда ҳисоблагич
    const calcProfits = () => {
      let totalProfit = 0;
      catKeys.forEach(k => {
         const sale = parseFloat(document.getElementById(`sale_${k}`).value) || 0;
         const exp = catTotals[k] || 0;
         const profit = sale - exp;
         totalProfit += profit;
         
         const pEl = document.getElementById(`profit_${k}`);
         pEl.textContent = `Фойда: ${profit > 0 ? '+' : ''}${profit.toLocaleString()}`;
         pEl.className = `text-[10px] text-right mt-1.5 font-black tracking-wide ${profit > 0 ? 'text-emerald-500' : (profit < 0 ? 'text-red-500' : 'text-gray-400')}`;
      });
      
      const tEl = document.getElementById('totalProfit');
      tEl.textContent = totalProfit.toLocaleString() + ' сўм';
      tEl.className = `text-4xl font-black mt-2 ${totalProfit > 0 ? 'text-emerald-400' : (totalProfit < 0 ? 'text-red-400' : 'text-gray-500')}`;
    };

    document.querySelectorAll('.sale-input').forEach(i => i.addEventListener('input', calcProfits));

    // Сақлаш тугмаси
    document.getElementById('saveSalesBtn').onclick = async (e) => {
       const btn = e.target;
       haptic('medium');
       btn.disabled = true; btn.textContent = "Сақланмоқда ⏳...";
       
       const incomes = {};
       catKeys.forEach(k => { incomes[k] = parseFloat(document.getElementById(`sale_${k}`).value) || 0; });
       
       const today = new Date().toISOString().split('T')[0];
       try {
         const res = await saveSales({ date: today, incomes });
         if (res.success) {
           haptic('success');
           alert("✅ Маълумотлар муваффақиятли сақланди!");
         } else {
           haptic('error');
           alert("ХАТОЛИК: " + res.message);
         }
       } catch (err) {
         haptic('error');
         alert("Сервер билан алоқа узилди!");
       } finally {
         btn.disabled = false; btn.textContent = "Савдони Сақлаш";
       }
    };
  }

  // =====================================
  // 2-ОЙНА: МОНИТОРИНГ ВА ТАРИХ
  // =====================================
  function renderMonitoring() {
    if(monitoringData.length === 0) {
       adminContent.innerHTML = `<div class="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm w-full"><p class="text-gray-400 font-bold text-sm">Тарих бўм-бўш</p></div>`; 
       return;
    }

    const cards = monitoringData.map(d => {
       let dayTotalExp = 0, dayTotalSale = 0;
       
       const catsHtml = catKeys.map(k => {
          const exp = (d.expenses && d.expenses[k]) ? d.expenses[k] : 0;
          const sale = (d.sales && d.sales[k]) ? d.sales[k] : 0;
          const prof = sale - exp;
          dayTotalExp += exp; dayTotalSale += sale;
          
          return `
            <div class="flex justify-between items-center text-xs py-3 border-b border-gray-100/50 last:border-0 w-full">
              <span class="font-bold w-1/3 text-gray-700">${catNames[k]}</span>
              <div class="w-2/3 text-right">
                <div class="text-[10px] text-gray-500 font-medium">Савдо: <span class="text-gray-900 font-bold">${sale.toLocaleString()}</span> | Хар: <span class="text-red-500 font-bold">${exp.toLocaleString()}</span></div>
                <div class="font-black mt-1 ${prof > 0 ? 'text-emerald-500' : (prof < 0 ? 'text-red-500' : 'text-gray-400')}">${prof > 0 ? '+'+prof.toLocaleString() : prof.toLocaleString()}</div>
              </div>
            </div>
          `;
       }).join('');
       
       const dayProfit = dayTotalSale - dayTotalExp;

       return `
         <div class="bg-white rounded-3xl shadow-sm border border-gray-100 mb-4 overflow-hidden transition-all duration-200 w-full">
            <!-- Карточка сарлавҳаси (Босилганда очилади) -->
            <div class="p-4 cursor-pointer flex justify-between items-center bg-gray-50/50 hover:bg-gray-100 active:bg-gray-200 transition w-full" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');">
              <div>
                <div class="font-black text-gray-900 text-sm tracking-wide">${d.date}</div>
                <div class="text-[10px] text-blue-500 mt-1 font-bold">Батафсил кўриш 🔽</div>
              </div>
              <div class="text-right">
                <div class="text-[9px] uppercase tracking-widest text-gray-400 font-bold mb-0.5">Соф фойда</div>
                <div class="font-black text-lg ${dayProfit > 0 ? 'text-emerald-600' : (dayProfit < 0 ? 'text-red-600' : 'text-gray-600')}">${dayProfit > 0 ? '+'+dayProfit.toLocaleString() : dayProfit.toLocaleString()}</div>
              </div>
            </div>
            
            <!-- Очиладиган контент -->
            <div class="hidden p-4 border-t border-gray-100 bg-white w-full">
              ${catsHtml}
              
              <!-- Кунлик якун -->
              <div class="mt-3 pt-3 border-t-2 border-dashed border-gray-200 flex justify-between text-xs font-bold bg-slate-50 p-3 rounded-xl w-full">
                <div class="w-1/2 pr-2 border-r border-gray-200">
                  <span class="text-[10px] text-gray-500 block mb-1">Умумий савдо:</span>
                  <span class="text-blue-600 text-sm">${dayTotalSale.toLocaleString()}</span>
                </div>
                <div class="w-1/2 pl-2 text-right">
                  <span class="text-[10px] text-gray-500 block mb-1">Умумий харажат:</span>
                  <span class="text-red-500 text-sm">${dayTotalExp.toLocaleString()}</span>
                </div>
              </div>
            </div>
         </div>
       `;
    }).join('');

    adminContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest w-full">Мониторинг Тарихи</h4>${cards}`;
  }

  // Биринчи очилганда ишни бошлаш
  loadTab();
}

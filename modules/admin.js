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

  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  // Экранни ёйиш ва fixed менюларни ишлатиш
  container.innerHTML = `
    <!-- Юқори қисм ва Менюлар (Fixed - Қотирилган) -->
    <div class="fixed top-0 left-0 right-0 z-50">
      <div class="bg-white px-5 py-4 shadow-sm flex justify-between items-center w-full">
        <div>
          <span class="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">Админ Панел</span>
          <h3 class="font-black text-lg text-gray-900 mt-1.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-95">Чиқиш</button>
      </div>
      <div class="flex bg-white border-b border-gray-200 shadow-sm w-full">
        <button class="tab-btn flex-1 py-4 text-sm font-bold border-b-2 text-blue-600 border-blue-600 transition" data-tab="bugun">
          📝 Бугунги ҳисобот
        </button>
        <button class="tab-btn flex-1 py-4 text-sm font-bold border-b-2 text-gray-400 border-transparent transition" data-tab="monitoring">
          📈 Мониторинг
        </button>
      </div>
    </div>

    <!-- Асосий контент (Скролл бўлиши учун pt-32 берилди, менюлар остида қолмайди) -->
    <div id="adminContent" class="w-full pt-32 px-4 pb-10 transition-opacity duration-300"></div>
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
        window.scrollTo(0,0); // Таб алмашганда тепага қайтиш
      }, 150);
    };
  });

  async function loadTab() {
    adminContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>`;
    try {
      if (activeTab === 'bugun') {
        const res = await fetchTodayExpenses(); 
        todayExpenses = res.records || [];
        catTotals = { "Ovqat": 0, "Somsa": 0, "Shashlik": 0, "Fast food": 0 };
        todayExpenses.forEach(r => { 
          if(catTotals[r.category] !== undefined) catTotals[r.category] += r.totalAmount; 
        });
        renderBugun();
      } else {
        const res = await fetchMonitoring(); 
        monitoringData = res.records || [];
        renderMonitoring();
      }
    } catch (e) { 
      adminContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Хатолик!</div>`; 
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
          <div class="text-[10px] text-red-500 font-bold mt-0.5">Хар:<br>${catTotals[k].toLocaleString()} сўм</div>
        </div>
        <div class="w-2/3 pl-2 border-l border-gray-100">
          <input type="number" step="any" id="sale_${k}" class="sale-input w-full border border-gray-200 rounded-xl p-2.5 text-right font-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Савдо">
          <div class="text-[10px] text-right mt-1.5 font-black text-gray-400" id="profit_${k}">Фойда: 0</div>
        </div>
      </div>
    `).join('');

    adminContent.innerHTML = `
      <h4 class="font-extrabold text-gray-800 mb-4 px-1 text-sm uppercase w-full">Бугунги тушумни киритинг</h4>
      ${inputsHtml}
      <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-xl mt-6 mb-5 text-center w-full">
        <div class="text-[11px] uppercase text-slate-400 font-bold mb-1">Кунлик соф фойда</div>
        <div class="text-4xl font-black mt-2" id="totalProfit">0 сўм</div>
      </div>
      <button id="saveSalesBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform mb-4">
        Савдони Сақлаш
      </button>
    `;

    // Жонли (Live) фойда ҳисоблагич
    const calcProfits = () => {
      let tot = 0;
      catKeys.forEach(k => {
         const sale = parseFloat(document.getElementById(`sale_${k}`).value) || 0, 
               exp = catTotals[k] || 0, 
               profit = sale - exp; 
         tot += profit;
         document.getElementById(`profit_${k}`).textContent = `Фойда: ${profit > 0 ? '+' : ''}${profit.toLocaleString()}`;
         document.getElementById(`profit_${k}`).className = `text-[10px] text-right mt-1.5 font-black ${profit > 0 ? 'text-emerald-500' : 'text-red-500'}`;
      });
      document.getElementById('totalProfit').textContent = tot.toLocaleString() + ' сўм';
      document.getElementById('totalProfit').className = `text-4xl font-black mt-2 ${tot > 0 ? 'text-emerald-400' : 'text-red-400'}`;
    };
    
    document.querySelectorAll('.sale-input').forEach(i => i.addEventListener('input', calcProfits));

    // Сақлаш тугмаси
    document.getElementById('saveSalesBtn').onclick = async (e) => {
       const btn = e.target; 
       haptic('medium'); 
       btn.disabled = true; 
       btn.textContent = "Сақланмоқда ⏳...";
       
       const incomes = {}; 
       catKeys.forEach(k => { incomes[k] = parseFloat(document.getElementById(`sale_${k}`).value) || 0; });
       const today = new Date().toISOString().split('T')[0];
       
       try { 
         const res = await saveSales({ date: today, incomes }); 
         if (res.success) { 
           haptic('success'); 
           alert("✅ Муваффақиятли сақланди!"); 
         } 
       } catch (err) { 
         alert("Хатолик!"); 
       } finally { 
         btn.disabled = false; 
         btn.textContent = "Савдони Сақлаш"; 
       }
    };
  }

  // =====================================
  // 2-ОЙНА: МОНИТОРИНГ ВА ТАРИХ
  // =====================================
  function renderMonitoring() {
    if(monitoringData.length === 0) { 
      adminContent.innerHTML = `<div class="text-center py-10 bg-white rounded-3xl border w-full"><p class="text-gray-400 font-bold text-sm">Тарих бўм-бўш</p></div>`; 
      return; 
    }
    
    const cards = monitoringData.map(d => {
       let dayTotalExp = 0, dayTotalSale = 0;
       
       const catsHtml = catKeys.map(k => { 
         const exp = d.expenses?.[k] || 0, 
               sale = d.sales?.[k] || 0, 
               prof = sale - exp; 
         dayTotalExp += exp; 
         dayTotalSale += sale; 
         
         return `
           <div class="flex justify-between items-center text-xs py-3 border-b border-gray-100/50 last:border-0 w-full">
             <span class="font-bold w-1/3 text-gray-700">${catNames[k]}</span>
             <div class="w-2/3 text-right">
               <div class="text-[10px] text-gray-500">Савдо: <span class="text-gray-900 font-bold">${sale.toLocaleString()}</span> | Хар: <span class="text-red-500 font-bold">${exp.toLocaleString()}</span></div>
               <div class="font-black mt-1 ${prof > 0 ? 'text-emerald-500' : 'text-red-500'}">${prof > 0 ? '+'+prof.toLocaleString() : prof.toLocaleString()}</div>
             </div>
           </div>
         `; 
       }).join('');
       
       const dayProfit = dayTotalSale - dayTotalExp;
       
       return `
         <div class="bg-white rounded-3xl shadow-sm border mb-4 overflow-hidden w-full">
           <div class="p-4 flex justify-between items-center bg-gray-50/50" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');">
             <div>
               <div class="font-black text-gray-900 text-sm">${d.date}</div>
               <div class="text-[10px] text-blue-500 mt-1 font-bold">Батафсил кўриш 🔽</div>
             </div>
             <div class="text-right">
               <div class="text-[9px] uppercase text-gray-400 font-bold mb-0.5">Соф фойда</div>
               <div class="font-black text-lg ${dayProfit > 0 ? 'text-emerald-600' : 'text-red-600'}">${dayProfit > 0 ? '+'+dayProfit.toLocaleString() : dayProfit.toLocaleString()}</div>
             </div>
           </div>
           
           <div class="hidden p-4 border-t w-full">
             ${catsHtml}
             <div class="mt-3 pt-3 border-t-2 border-dashed flex justify-between text-xs font-bold bg-slate-50 p-3 rounded-xl w-full">
               <div class="w-1/2 pr-2 border-r">
                 <span class="text-[10px] text-gray-500 block mb-1">Савдо:</span>
                 <span class="text-blue-600 text-sm">${dayTotalSale.toLocaleString()}</span>
               </div>
               <div class="w-1/2 pl-2 text-right">
                 <span class="text-[10px] text-gray-500 block mb-1">Харажат:</span>
                 <span class="text-red-500 text-sm">${dayTotalExp.toLocaleString()}</span>
               </div>
             </div>
           </div>
         </div>
       `;
    }).join('');
    
    adminContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest w-full">Мониторинг Тарихи</h4>${cards}`;
  }
  
  loadTab();
}

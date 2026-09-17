import { saveSales, fetchMonitoring, updateProfile } from "../api.js";

export async function renderAdmin(container, user, onLogout) {
  let activeTab = 'kunlik'; 
  let activeCategory = null; 
  let monitoringData = [];
  let todayData = { expenses: {}, sales: {} };
  const todayStr = new Date().toISOString().split('T')[0];

  const tg = window.Telegram?.WebApp;
  function haptic(type = 'light') { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type); }

  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catIcons = { "Ovqat": "🍲", "Somsa": "🥟", "Shashlik": "🍢", "Fast food": "🍔" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  // Экран структураси (Қотирилган тепа ва паст, ўртаси скролл)
  container.innerHTML = `
    <div class="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <!-- Қотирилган Сарлавҳа -->
      <div class="h-16 bg-white px-5 shadow-sm flex justify-between items-center shrink-0 w-full z-50 relative">
        <div>
          <span class="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">Админ Панел</span>
          <h3 class="font-black text-lg text-gray-900 mt-0.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-90">Чиқиш</button>
      </div>

      <!-- Асосий контент (Скролл бўладиган жой) -->
      <div id="adminContent" class="flex-1 overflow-y-auto w-full p-4 pb-8 relative z-0"></div>

      <!-- Қотирилган Пастки Навигация -->
      <div class="h-16 bg-white border-t border-gray-200 flex justify-around items-center shrink-0 w-full z-50 relative shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] pb-safe">
        <button class="nav-btn flex flex-col items-center justify-center w-1/3 h-full text-blue-600 transition-transform active:scale-90" data-tab="kunlik">
          <span class="text-xl leading-none mb-1">📝</span><span class="text-[10px] font-bold leading-none">Кунлик</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/3 h-full text-gray-400 transition-transform active:scale-90" data-tab="monitoring">
          <span class="text-xl leading-none mb-1">📈</span><span class="text-[10px] font-bold leading-none">Мониторинг</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/3 h-full text-gray-400 transition-transform active:scale-90" data-tab="profile">
          <span class="text-xl leading-none mb-1">⚙️</span><span class="text-[10px] font-bold leading-none">Профил</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };
  const adminContent = document.getElementById("adminContent");

  // Таблар мантиғи
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      haptic('light');
      document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-blue-600'); b.classList.add('text-gray-400'); });
      btn.classList.add('text-blue-600'); btn.classList.remove('text-gray-400');
      
      activeTab = btn.dataset.tab;
      activeCategory = null; // Таб ўзгарганда категориядан чиқиш
      
      adminContent.style.opacity = 0; 
      setTimeout(() => { 
        renderActiveView(); 
        adminContent.style.opacity = 1; 
        adminContent.scrollTop = 0; 
      }, 150);
    };
  });

  // Базадан маълумот юклаш
  async function loadData() {
    adminContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>`;
    try {
      const res = await fetchMonitoring();
      monitoringData = res.records || [];
      // Бугунги маълумотни ажратиб олиш
      todayData = monitoringData.find(d => d.date === todayStr) || { expenses: {}, sales: {} };
      renderActiveView();
    } catch (e) {
      adminContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Маълумотларни юклаб бўлмади!</div>`;
    }
  }

  function renderActiveView() {
    if (activeTab === 'kunlik') {
      if (activeCategory) renderCategoryDetail();
      else renderKunlikGrid();
    } else if (activeTab === 'monitoring') {
      renderMonitoring();
    } else if (activeTab === 'profile') {
      renderProfile();
    }
  }

  // =====================================
  // 1-ОЙНА: ТЎРТТА КВАДРАТ (ГРИД)
  // =====================================
  function renderKunlikGrid() {
    const gridHtml = catKeys.map(k => {
      const exp = todayData.expenses[k] ? todayData.expenses[k].grandTotal : 0;
      const sale = todayData.sales[k] || 0;
      const profit = sale - exp;
      return `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition" onclick="window.openCategory('${k}')">
          <div class="text-4xl mb-2">${catIcons[k]}</div>
          <h4 class="font-black text-gray-800 text-sm mb-1">${catNames[k]}</h4>
          <div class="text-[10px] text-gray-400 font-bold">Фойда: <span class="${profit>0?'text-emerald-500':(profit<0?'text-red-500':'text-gray-400')}">${profit>0?'+':''}${profit.toLocaleString()}</span></div>
        </div>
      `;
    }).join('');

    adminContent.innerHTML = `
      <h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest text-center w-full">Бугунги бўлимлар</h4>
      <div class="grid grid-cols-2 gap-4 w-full">
        ${gridHtml}
      </div>
      <div class="mt-6 bg-slate-900 text-white rounded-3xl p-6 shadow-xl text-center w-full">
         <div class="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">Умумий Соф Фойда</div>
         <div class="text-3xl font-black mt-2 text-emerald-400" id="grandTotalProfit">...</div>
      </div>
    `;

    // Умумий фойдани ҳисоблаш
    let totalProf = 0;
    catKeys.forEach(k => {
      const e = todayData.expenses[k] ? todayData.expenses[k].grandTotal : 0;
      const s = todayData.sales[k] || 0;
      totalProf += (s - e);
    });
    document.getElementById('grandTotalProfit').textContent = totalProf.toLocaleString() + ' сўм';
  }

  // Глобал функция сифатида эълон қилиш (HTML ичидан чақириш учун)
  window.openCategory = (cat) => { haptic('light'); activeCategory = cat; renderActiveView(); };

  // =====================================
  // КАТЕГОРИЯ ИЧИГА КИРИШ (МАҲСУЛОТЛАР ВА САВДО)
  // =====================================
  function renderCategoryDetail() {
    const catData = todayData.expenses[activeCategory]; 
    const currentSale = todayData.sales[activeCategory] || "";
    const totalExp = catData ? catData.grandTotal : 0;

    let itemsHtml = '';
    if (catData && catData.items && catData.items.length > 0) {
      itemsHtml = catData.items.map(i => `
        <div class="flex justify-between items-center text-xs py-2 border-b border-gray-100 last:border-0 w-full">
          <span class="text-gray-600 font-medium">${i.name} (${i.qty} ${i.unit})</span>
          <span class="font-bold text-gray-800">${i.total.toLocaleString()} сўм</span>
        </div>
      `).join('');
    } else {
      itemsHtml = `<div class="text-center py-4 text-xs text-gray-400 font-bold w-full">Ходим ҳали ҳисобот юбормаган</div>`;
    }

    adminContent.innerHTML = `
      <button class="bg-white border border-gray-200 shadow-sm text-gray-600 font-bold py-2 px-4 rounded-xl text-xs mb-4 active:scale-95 transition" onclick="window.openCategory(null)">⬅️ Ортга</button>
      
      <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 w-full">
        <h4 class="font-black text-lg text-gray-900 mb-4 flex items-center">${catIcons[activeCategory]} ${catNames[activeCategory]} савдоси</h4>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Қанча пуллик сотилди? (сўм):</label>
        <input type="number" id="catSaleInput" value="${currentSale}" class="w-full border border-gray-200 rounded-xl p-3 font-black text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="0">
        <div class="text-[10px] text-right mt-1.5 font-black text-gray-400" id="profitCalc">Фойда: 0</div>
        <div id="somsaSplitArea" class="mt-2 w-full"></div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 w-full">
        <h4 class="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3 border-b pb-2 w-full">Ишлатилган маҳсулотлар</h4>
        ${itemsHtml}
        <div class="mt-3 pt-3 border-t-2 border-dashed border-gray-200 text-xs font-bold w-full">
          <div class="flex justify-between mb-1 text-gray-500 w-full"><span>Ойлик + Қўшимча:</span><span>${catData ? (catData.salary + catData.extra).toLocaleString() : 0} сўм</span></div>
          <div class="flex justify-between text-red-500 text-sm mt-2 w-full"><span>Жами Харажат:</span><span>${totalExp.toLocaleString()} сўм</span></div>
        </div>
      </div>

      <button id="saveCatSaleBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform mb-4">
        Савдони Сақлаш
      </button>
    `;

    // Жонли фойда ва Сомса 60/40 ҳисоби
    const calc = () => {
      const sale = parseFloat(document.getElementById('catSaleInput').value) || 0;
      const profit = sale - totalExp;
      const pEl = document.getElementById('profitCalc');
      pEl.textContent = `Фойда: ${profit > 0 ? '+' : ''}${profit.toLocaleString()} сўм`;
      pEl.className = `text-xs text-right mt-2 font-black tracking-wide ${profit > 0 ? 'text-emerald-500' : 'text-red-500'}`;

      if (activeCategory === 'Somsa') {
        const area = document.getElementById('somsaSplitArea');
        if (profit > 0) {
          area.innerHTML = `
            <div class="flex gap-2 mt-3 text-[10px] font-bold text-center w-full">
               <div class="w-1/2 bg-blue-50 text-blue-600 py-2 rounded-xl border border-blue-100">60% улуш:<br><span class="text-sm">${(profit * 0.6).toLocaleString()}</span></div>
               <div class="w-1/2 bg-purple-50 text-purple-600 py-2 rounded-xl border border-purple-100">40% улуш:<br><span class="text-sm">${(profit * 0.4).toLocaleString()}</span></div>
            </div>`;
        } else { area.innerHTML = ''; }
      }
    };

    document.getElementById('catSaleInput').addEventListener('input', calc);
    calc();

    document.getElementById('saveCatSaleBtn').onclick = async (e) => {
      haptic('medium');
      const saleVal = parseFloat(document.getElementById('catSaleInput').value) || 0;
      e.target.disabled = true; e.target.textContent = "⏳...";
      
      const incomes = { ...todayData.sales, [activeCategory]: saleVal };
      
      try {
        const res = await saveSales({ date: todayStr, incomes });
        if (res.success) {
          haptic('success');
          todayData.sales = incomes; 
          alert("✅ Савдо сақланди!");
          window.openCategory(null); 
        }
      } catch (err) { alert("Хатолик!"); e.target.disabled = false; e.target.textContent = "Савдони Сақлаш"; }
    };
  }

  // =====================================
  // 2-ОЙНА: МОНИТОРИНГ
  // =====================================
  function renderMonitoring() {
    if(monitoringData.length === 0) { 
      adminContent.innerHTML = `<div class="text-center py-10 bg-white rounded-3xl border w-full"><p class="text-gray-400 font-bold text-sm">Тарих йўқ</p></div>`; return; 
    }
    
    const cards = monitoringData.map(d => {
       let dayTotalExp = 0, dayTotalSale = 0;
       
       const catsHtml = catKeys.map(k => { 
         const exp = d.expenses[k]; 
         const sale = d.sales[k] || 0; 
         const totalE = exp ? exp.grandTotal : 0;
         const prof = sale - totalE; 
         dayTotalExp += totalE; dayTotalSale += sale; 
         
         let itemsH = '';
         if (exp && exp.items && exp.items.length > 0) {
           itemsH = exp.items.map(i => `<div class="flex justify-between text-[10px] text-gray-500 py-1 border-b border-gray-100 last:border-0 w-full"><span class="truncate mr-2">${i.name} (${i.qty}${i.unit})</span><span class="shrink-0">${i.total.toLocaleString()}</span></div>`).join('');
           itemsH = `<div class="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-full">${itemsH}<div class="flex justify-between text-[10px] font-bold mt-1 text-gray-500 w-full"><span>Ойлик/Қўшимча:</span><span>${(exp.salary+exp.extra).toLocaleString()}</span></div></div>`;
         } else {
           itemsH = `<div class="text-[10px] text-gray-400 mt-1 w-full">Ходим харажат киритмаган</div>`;
         }

         let somsaH = '';
         if(k === 'Somsa' && prof > 0) {
            somsaH = `<div class="flex gap-2 mt-2 text-[9px] font-bold w-full"><span class="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">60%: ${(prof*0.6).toLocaleString()}</span><span class="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">40%: ${(prof*0.4).toLocaleString()}</span></div>`;
         }

         return `
           <div class="border border-gray-100 rounded-2xl mb-2 overflow-hidden w-full">
             <div class="p-3 bg-white flex justify-between items-center cursor-pointer active:bg-gray-50 w-full" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');">
                <span class="font-bold text-sm text-gray-700">${catIcons[k]} ${catNames[k]}</span>
                <span class="text-[10px] text-blue-500 font-bold">Кўриш 🔽</span>
             </div>
             <div class="hidden p-3 border-t border-gray-50 bg-white w-full">
                ${itemsH}
                <div class="mt-2 flex justify-between text-[10px] font-bold w-full">
                   <span class="text-blue-600">Савдо: ${sale.toLocaleString()}</span>
                   <span class="text-red-500">Харажат: ${totalE.toLocaleString()}</span>
                </div>
                <div class="font-black mt-1 text-xs ${prof > 0 ? 'text-emerald-500' : 'text-red-500'} w-full">Фойда: ${prof>0?'+':''}${prof.toLocaleString()}</div>
                ${somsaH}
             </div>
           </div>
         `; 
       }).join('');
       
       const dayProfit = dayTotalSale - dayTotalExp;
       
       return `
         <div class="bg-white rounded-3xl shadow-sm border mb-4 overflow-hidden w-full">
           <div class="p-4 flex justify-between items-center bg-blue-50/30 cursor-pointer active:bg-blue-50/50 w-full" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');">
             <div>
               <div class="font-black text-gray-900 text-sm">${d.date}</div>
               <div class="text-[10px] text-blue-500 mt-1 font-bold">Очиш 🔽</div>
             </div>
             <div class="text-right">
               <div class="text-[9px] uppercase text-gray-400 font-bold mb-0.5">Умумий Соф фойда</div>
               <div class="font-black text-lg ${dayProfit > 0 ? 'text-emerald-600' : 'text-red-600'}">${dayProfit > 0 ? '+'+dayProfit.toLocaleString() : dayProfit.toLocaleString()}</div>
             </div>
           </div>
           
           <div class="hidden p-4 border-t border-gray-100 w-full bg-white">
             ${catsHtml}
             <div class="mt-3 pt-3 border-t-2 border-dashed flex justify-between text-xs font-bold w-full">
               <div class="w-1/2 pr-2 border-r"><span class="text-[10px] text-gray-500 block mb-1">Жами Савдо:</span><span class="text-blue-600">${dayTotalSale.toLocaleString()}</span></div>
               <div class="w-1/2 pl-2 text-right"><span class="text-[10px] text-gray-500 block mb-1">Жами Харажат:</span><span class="text-red-500">${dayTotalExp.toLocaleString()}</span></div>
             </div>
           </div>
         </div>
       `;
    }).join('');
    
    adminContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest text-center w-full">Ойлик Мониторинг</h4>${cards}`;
  }

  // ==========================================
  // ТАБ 3: ПРОФИЛ ВА СОЗЛАМАЛАР
  // ==========================================
  function renderProfile() {
    adminContent.innerHTML = `
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-5 text-center w-full">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-3">👤</div>
        <h2 class="font-black text-2xl text-gray-900 tracking-tight">${user.name}</h2>
        <p class="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">АДМИНИСТРАТОР</p>
      </div>
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Янги ПИН-код (4 та рақам):</label>
        <input type="number" id="newPin" class="w-full border border-gray-200 rounded-xl p-3.5 mb-4 bg-gray-50 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Янги код">
        <label class="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between w-full">
          <span>Telegram Chat ID:</span><a href="https://t.me/userinfobot" target="_blank" class="text-blue-500">ID ни олиш</a>
        </label>
        <input type="number" id="newChatId" class="w-full border border-gray-200 rounded-xl p-3.5 mb-5 bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Масалан: 123456789" value="${user.chatId || ''}">
        <button id="updateProfileBtn" class="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">Ўзгаришларни сақлаш</button>
      </div>
    `;
    
    document.getElementById("updateProfileBtn").onclick = async (e) => { 
      const p = document.getElementById("newPin").value, c = document.getElementById("newChatId").value, obj = {}; 
      if(p) obj.pin = p; if(c) obj.chatId = c; 
      if(Object.keys(obj).length){ 
        haptic('medium'); e.target.textContent="⏳..."; 
        await updateProfile(user.id, obj); alert("Янгиланди!"); 
        document.getElementById("newPin").value=""; e.target.textContent="Ўзгаришларни сақлаш"; 
      } 
    };
  }
  
  loadData();
}

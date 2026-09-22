// ЭЪТИБОР БЕРИНГ: fetchMenu, addMenu ва deleteMenu api.js дан чақириляпти
import { saveSales, fetchMonitoring, updateProfile, fetchMenu, addMenu, deleteMenu } from "../api.js";

export async function renderAdmin(container, user, onLogout) {
  let activeTab = 'kunlik'; 
  let subTabSavdo = 'kassa'; // kassa, sotuv, menu
  let activeCategory = null; 
  let activeMenuCat = null;
  let monitoringData = [];
  let menuItemsList = [];
  let todayData = { expenses: {}, sales: {}, summary: {}, soldItems: {} };
  
  // Санани маҳаллий вақт билан олиш
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  let isLargeText = localStorage.getItem('largeText') === 'true';

  const tg = window.Telegram?.WebApp;
  function haptic(type = 'light') { 
    if (tg && tg.HapticFeedback) {
      if(type === 'success' || type === 'error') tg.HapticFeedback.notificationOccurred(type);
      else tg.HapticFeedback.impactOccurred(type);
    }
  }

  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catIcons = { "Ovqat": "🍲", "Somsa": "🥟", "Shashlik": "🍢", "Fast food": "🍔" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  // ==========================================
  // КАТТА ШРИФТЛАР (A+)
  // ==========================================
  if (!document.getElementById('largeTextStyles')) {
    const style = document.createElement('style');
    style.id = 'largeTextStyles';
    style.innerHTML = `
      .large-text-mode .text-\\[9px\\] { font-size: 13px !important; }
      .large-text-mode .text-\\[10px\\] { font-size: 14px !important; line-height: 1.4 !important; }
      .large-text-mode .text-\\[11px\\] { font-size: 15px !important; }
      .large-text-mode .text-xs { font-size: 16px !important; line-height: 1.5 !important; }
      .large-text-mode .text-sm { font-size: 18px !important; line-height: 1.5 !important; }
      .large-text-mode .text-base { font-size: 20px !important; }
      .large-text-mode .text-lg { font-size: 22px !important; }
      .large-text-mode .text-xl { font-size: 26px !important; }
      .large-text-mode .text-2xl { font-size: 30px !important; }
      .large-text-mode .text-3xl { font-size: 34px !important; }
      .large-text-mode .text-4xl { font-size: 44px !important; }
      .large-text-mode input { font-size: 22px !important; font-weight: 900 !important; }
    `;
    document.head.appendChild(style);
  }

  container.innerHTML = `
    <div id="adminMainWrapper" class="flex flex-col h-screen w-full bg-gray-50 overflow-hidden ${isLargeText ? 'large-text-mode' : ''}">
      
      <!-- Сарлавҳа -->
      <div class="h-16 bg-white px-4 shadow-sm flex justify-between items-center shrink-0 w-full z-50 relative">
        <div class="truncate mr-2">
          <span class="text-[10px] font-bold uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">Админ</span>
          <h3 class="font-black text-lg text-gray-900 mt-0.5 truncate">${user.name}</h3>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button id="zoomBtn" class="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-xl font-black text-sm active:scale-90 transition shadow-sm border border-gray-200">
            ${isLargeText ? 'A-' : 'A+'}
          </button>
          <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-95">Чиқиш</button>
        </div>
      </div>

      <!-- Асосий контент (Скролл) -->
      <div id="adminContent" class="flex-1 overflow-y-auto w-full p-4 pb-8 relative z-0"></div>

      <!-- НАВИГАЦИЯ (4 ТА ТУГМА) -->
      <div class="h-16 bg-white border-t border-gray-200 flex justify-around items-center shrink-0 w-full z-50 relative shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] pb-safe">
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-blue-600 transition-transform active:scale-90" data-tab="kunlik">
          <span class="text-xl leading-none mb-1">📝</span><span class="text-[10px] font-bold leading-none">Кунлик</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="savdo">
          <span class="text-xl leading-none mb-1">💰</span><span class="text-[10px] font-bold leading-none">Савдо</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="monitoring">
          <span class="text-xl leading-none mb-1">📈</span><span class="text-[10px] font-bold leading-none">Тарих</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="profile">
          <span class="text-xl leading-none mb-1">⚙️</span><span class="text-[10px] font-bold leading-none">Профил</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };
  const adminContent = document.getElementById("adminContent");

  document.getElementById("zoomBtn").onclick = () => {
    haptic('medium');
    isLargeText = !isLargeText;
    localStorage.setItem('largeText', isLargeText);
    const wrapper = document.getElementById('adminMainWrapper');
    if (isLargeText) { wrapper.classList.add('large-text-mode'); document.getElementById('zoomBtn').textContent = 'A-'; } 
    else { wrapper.classList.remove('large-text-mode'); document.getElementById('zoomBtn').textContent = 'A+'; }
  };

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      haptic('light');
      document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-blue-600'); b.classList.add('text-gray-400'); });
      btn.classList.add('text-blue-600'); btn.classList.remove('text-gray-400');
      
      activeTab = btn.dataset.tab; 
      activeCategory = null; 
      activeMenuCat = null;
      
      adminContent.style.opacity = 0; 
      setTimeout(() => { renderActiveView(); adminContent.style.opacity = 1; adminContent.scrollTop = 0; }, 150);
    };
  });

  async function loadData() {
    adminContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>`;
    try {
      const res = await fetchMonitoring();
      monitoringData = res.records || [];
      todayData = monitoringData.find(d => d.date === todayStr) || { expenses: {}, sales: {}, summary: {}, soldItems: {} };
      if(!todayData.sales) todayData.sales = {}; 
      if(!todayData.expenses) todayData.expenses = {};
      if(!todayData.summary) todayData.summary = {};
      if(!todayData.soldItems) todayData.soldItems = {};

      // Менюни (таомларни) тўғридан-тўғри api.js орқали юклаймиз
      const menuRes = await fetchMenu();
      if(menuRes && menuRes.success) {
         menuItemsList = menuRes.records || [];
      } else {
         menuItemsList = [];
      }

      renderActiveView();
    } catch (e) { adminContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Сервер билан алоқа йўқ!</div>`; }
  }

  function renderActiveView() {
    if (activeTab === 'kunlik') {
      if (activeCategory) renderCategoryDetail();
      else renderKunlikGrid();
    } else if (activeTab === 'savdo') {
      renderSavdoTab();
    } else if (activeTab === 'monitoring') {
      renderMonitoring();
    } else if (activeTab === 'profile') {
      renderProfile();
    }
  }

  // =====================================
  // 1-ОЙНА: КУНЛИК 
  // =====================================
  function renderKunlikGrid() {
    let totalProf = 0;

    const gridHtml = catKeys.map(k => {
      const exp = todayData.expenses[k] ? todayData.expenses[k].grandTotal : 0;
      const sale = todayData.sales[k] || 0;
      const profit = sale - exp;
      totalProf += profit;
      return `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition" onclick="window.openCategory('${k}')">
          <div class="text-4xl mb-2">${catIcons[k]}</div>
          <h4 class="font-black text-gray-800 text-sm mb-1">${catNames[k]}</h4>
          <div class="text-[10px] text-gray-400 font-bold">Фойда: <span class="${profit>0?'text-emerald-500':(profit<0?'text-red-500':'text-gray-400')}">${profit>0?'+':''}${profit.toLocaleString()}</span></div>
        </div>
      `;
    }).join('');

    adminContent.innerHTML = `
      <h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest text-center w-full">Бўлимлар харажати ва савдоси</h4>
      <div class="grid grid-cols-2 gap-4 w-full">
        ${gridHtml}
      </div>
      <div class="mt-6 bg-slate-900 text-white rounded-3xl p-6 shadow-xl text-center w-full">
         <div class="text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1">Умумий Соф Фойда</div>
         <div class="text-3xl font-black mt-2 text-emerald-400">${totalProf.toLocaleString()} сўм</div>
      </div>
    `;
  }

  window.openCategory = (cat) => { haptic('light'); activeCategory = cat; renderActiveView(); };

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
    } else { itemsHtml = `<div class="text-center py-4 text-xs text-gray-400 font-bold w-full">Харажат киритилмаган</div>`; }

    adminContent.innerHTML = `
      <button class="bg-white border border-gray-200 shadow-sm text-gray-600 font-bold py-2 px-4 rounded-xl text-xs mb-4 active:scale-95 transition" onclick="window.openCategory(null)">⬅️ Ортга</button>
      
      <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 w-full">
        <h4 class="font-black text-lg text-gray-900 mb-4 flex items-center">${catIcons[activeCategory]} ${catNames[activeCategory]} савдоси</h4>
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Қанча пуллик сотилди? (сўм):</label>
        <input type="number" id="catSaleInput" value="${currentSale}" class="w-full border border-gray-200 rounded-xl p-3 font-black text-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 text-blue-600" placeholder="0">
        <div class="text-[10px] text-right mt-1.5 font-black text-gray-400" id="profitCalc">Фойда: 0</div>
        <div id="somsaSplitArea" class="mt-2 w-full"></div>
      </div>

      <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4 w-full">
        <h4 class="font-bold text-xs text-gray-400 uppercase tracking-widest mb-3 border-b pb-2 w-full">Ишлатилган маҳсулотлар</h4>
        ${itemsHtml}
        <div class="mt-3 pt-3 border-t-2 border-dashed border-gray-200 text-xs font-bold w-full">
          <div class="flex justify-between mb-1 text-gray-500 w-full"><span>Ойлик/Қўшимча:</span><span>${catData ? (catData.salary + catData.extra).toLocaleString() : 0} сўм</span></div>
          <div class="flex justify-between text-red-500 text-sm mt-2 w-full"><span>Жами Харажат:</span><span>${totalExp.toLocaleString()} сўм</span></div>
        </div>
      </div>
      <button id="saveCatSaleBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform mb-4">Савдони Сақлаш</button>
    `;

    const calc = () => {
      const sale = parseFloat(document.getElementById('catSaleInput').value) || 0;
      const profit = sale - totalExp;
      document.getElementById('profitCalc').textContent = `Фойда: ${profit > 0 ? '+' : ''}${profit.toLocaleString()} сўм`;
      document.getElementById('profitCalc').className = `text-xs text-right mt-2 font-black ${profit > 0 ? 'text-emerald-500' : 'text-red-500'}`;

      if (activeCategory === 'Somsa') {
        if (profit > 0) {
          document.getElementById('somsaSplitArea').innerHTML = `
            <div class="flex gap-2 mt-3 text-[10px] font-bold text-center w-full">
               <div class="w-1/2 bg-blue-50 text-blue-600 py-3 rounded-xl border border-blue-100">60% улуш:<br><span class="text-sm font-black">${(profit * 0.6).toLocaleString()}</span></div>
               <div class="w-1/2 bg-purple-50 text-purple-600 py-3 rounded-xl border border-purple-100">40% улуш:<br><span class="text-sm font-black">${(profit * 0.4).toLocaleString()}</span></div>
            </div>`;
        } else { document.getElementById('somsaSplitArea').innerHTML = ''; }
      }
    };
    document.getElementById('catSaleInput').addEventListener('input', calc); calc();

    document.getElementById('saveCatSaleBtn').onclick = async (e) => {
      haptic('medium'); const btn = e.target; btn.disabled = true; btn.textContent = "⏳...";
      const saleVal = parseFloat(document.getElementById('catSaleInput').value) || 0;
      const incomes = { ...(todayData.sales || {}), [activeCategory]: saleVal };
      try {
        const res = await saveSales({ date: todayStr, incomes });
        if (res.success) { haptic('success'); todayData.sales = incomes; alert("✅ Сақланди!"); window.openCategory(null); } 
        else { haptic('error'); alert("Хатолик!"); btn.disabled = false; btn.textContent = "Савдони Сақлаш"; }
      } catch (err) { haptic('error'); alert("Сервер хатоси!"); btn.disabled = false; btn.textContent = "Савдони Сақлаш"; }
    };
  }

  // =====================================
  // 2-ОЙНА: ЯНГИ САВДО ТУГМАСИ ИЧИ (КАССА, ТАОМЛАР, МЕНЮ)
  // =====================================
  window.setSavdoTab = (tab) => { haptic('light'); subTabSavdo = tab; activeMenuCat = null; renderSavdoTab(); };
  window.openMenuCat = (cat) => { haptic('light'); activeMenuCat = cat; renderSavdoTab(); };

  function renderSavdoTab() {
    let contentHtml = '';

    // 2.1 КАССА ҚИСМИ 
    if (subTabSavdo === 'kassa') {
      const sum = todayData.summary || {};
      contentHtml = `
        <div class="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-2 w-full">
          <h4 class="font-black text-lg text-gray-900 mb-4 border-b pb-2">Касса ҳисоботи</h4>
          
          <label class="block text-xs font-bold text-gray-500 mb-1">Умумий савдо (сўм):</label>
          <input type="number" id="s_um" value="${sum.umumiy || ''}" class="w-full border border-gray-200 p-3 rounded-xl mb-3 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
          
          <div class="flex gap-2 mb-3">
            <div class="w-1/3">
              <label class="block text-[10px] font-bold text-gray-500 mb-1">Нақд савдо:</label>
              <input type="number" id="s_naqd" value="${sum.naqd || ''}" class="w-full border border-gray-200 p-2 rounded-xl font-bold text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" placeholder="0">
            </div>
            <div class="w-1/3">
              <label class="block text-[10px] font-bold text-gray-500 mb-1">Карта:</label>
              <input type="number" id="s_karta" value="${sum.karta || ''}" class="w-full border border-gray-200 p-2 rounded-xl font-bold text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" placeholder="0">
            </div>
            <div class="w-1/3">
              <label class="block text-[10px] font-bold text-gray-500 mb-1">Click:</label>
              <input type="number" id="s_click" value="${sum.click || ''}" class="w-full border border-gray-200 p-2 rounded-xl font-bold text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500" placeholder="0">
            </div>
          </div>
          
          <label class="block text-xs font-bold text-gray-500 mb-1">Ходимлар овқатланиши (сўм):</label>
          <input type="number" id="s_xodim" value="${sum.xodimlar || ''}" class="w-full border border-gray-200 p-3 rounded-xl mb-4 font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
          
          <div class="mt-2 pt-3 border-t-2 border-dashed border-gray-200">
             <label class="block text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Кассадаги нақд пул (қолдиқ):</label>
             <input type="number" id="s_qoldiq" value="${sum.kassa_qoldiq || ''}" class="w-full border border-blue-200 p-3 rounded-xl font-black text-lg bg-blue-50 text-blue-600 outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
          </div>

          <button id="saveKassaBtn" class="w-full mt-5 bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">Кассани Сақлаш</button>
        </div>
      `;
    } 
    // 2.2 СОТИЛГАН ТАОМЛАР ҚИСМИ
    else if (subTabSavdo === 'sotuv') {
      if (!activeMenuCat) {
        const catsHtml = catKeys.map(k => `<div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center cursor-pointer active:scale-95 transition" onclick="window.openMenuCat('${k}')"><div class="text-3xl mb-1">${catIcons[k]}</div><div class="font-bold text-sm text-gray-800">${catNames[k]}</div></div>`).join('');
        contentHtml = `<div class="grid grid-cols-2 gap-3 mt-2 w-full">${catsHtml}</div>`;
      } else {
        const catItems = menuItemsList.filter(m => m.category === activeMenuCat);
        const savedItems = todayData.soldItems[activeMenuCat] || {};
        
        let listHtml = '';
        if (catItems.length === 0) {
          listHtml = `<div class="text-center py-6 text-gray-400 font-bold text-xs w-full">Бу бўлимда таомлар йўқ. Олдин менюга қўшинг.</div>`;
        } else {
          listHtml = catItems.map(item => `
            <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
              <div class="flex-1 pr-2 truncate">
                <div class="font-bold text-sm text-gray-800 truncate">${item.name}</div>
                <div class="text-[10px] text-gray-400">${item.price.toLocaleString()} сўм</div>
              </div>
              <div class="w-20 shrink-0">
                <input type="number" min="0" data-id="${item.id}" value="${savedItems[item.id] || ''}" class="sold-qty-input w-full border border-gray-200 rounded-xl p-2 text-center font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
              </div>
              <div class="w-24 text-right shrink-0 pl-1">
                <span class="text-sm font-black text-blue-600" id="stot-${item.id}">0</span>
              </div>
            </div>
          `).join('');
        }
        
        contentHtml = `
          <button class="bg-white border border-gray-200 shadow-sm text-gray-600 font-bold py-2 px-4 rounded-xl text-xs mb-3 active:scale-95 transition" onclick="window.openMenuCat(null)">⬅️ Ортга</button>
          
          <div class="mb-2 flex text-[10px] font-bold text-gray-400 uppercase px-2 w-full">
            <div class="flex-1">Таом</div>
            <div class="w-20 text-center">Сони</div>
            <div class="w-24 text-right">Сумма</div>
          </div>
          
          ${listHtml}
          
          ${catItems.length > 0 ? `
            <div class="mt-4 bg-slate-900 text-white rounded-2xl p-4 text-center w-full">
              <div class="text-[10px] uppercase text-emerald-400 font-bold">Умумий Сотув</div>
              <div class="text-2xl font-black mt-1" id="soldTotal">0 сўм</div>
            </div>
            <button id="saveSoldBtn" class="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">Сотувни Сақлаш</button>
          ` : ''}
        `;
      }
    } 
    // 2.3 МЕНЮ (ЯНГИ ТАОМ ҚЎШИШ) ҚИСМИ (api.js орқали)
    else if (subTabSavdo === 'menu') {
      const list = menuItemsList.map(m => `
        <div class="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
          <div>
            <span class="text-[9px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">${m.category}</span>
            <div class="font-bold text-sm text-gray-800">${m.name}</div>
            <div class="text-[10px] text-gray-500 font-semibold">${m.price.toLocaleString()} сўм</div>
          </div>
          <button class="del-menu text-red-500 bg-red-50 p-2.5 rounded-xl active:scale-90 transition" data-id="${m.id}">🗑</button>
        </div>
      `).join('');
      
      contentHtml = `
        <div class="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 mb-5 w-full">
          <h4 class="font-black text-sm mb-3 text-blue-900">Менюга таом қўшиш</h4>
          <select id="mCat" class="w-full border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 mb-2 focus:ring-2 focus:ring-blue-500 outline-none">
            ${catKeys.map(k=>`<option value="${k}">${catNames[k]}</option>`).join('')}
          </select>
          <input type="text" id="mName" class="w-full border border-gray-200 p-3 mb-2 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Таом номи (мас: Ош)">
          <input type="number" id="mPrice" class="w-full border border-gray-200 p-3 mb-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Сотилиш нархи (сўм)">
          <button id="addMenuBtn" class="w-full bg-blue-50 text-blue-600 font-bold py-3.5 rounded-xl active:scale-95 transition">Таомни қўшиш</button>
        </div>
        <h4 class="font-extrabold text-gray-400 mb-3 px-1 text-xs uppercase tracking-widest w-full">Мавжуд таомлар</h4>
        ${list || '<div class="text-center text-xs text-gray-400 py-4 w-full">Таомлар йўқ</div>'}
      `;
    }

    adminContent.innerHTML = `
      <div class="flex bg-white border border-gray-200 rounded-xl p-1 mb-4 w-full shadow-sm">
        <button class="flex-1 py-2 text-xs font-bold rounded-lg transition ${subTabSavdo==='kassa'?'bg-blue-600 text-white shadow':'text-gray-500'}" onclick="setSavdoTab('kassa')">Касса</button>
        <button class="flex-1 py-2 text-xs font-bold rounded-lg transition ${subTabSavdo==='sotuv'?'bg-blue-600 text-white shadow':'text-gray-500'}" onclick="setSavdoTab('sotuv')">Сотув</button>
        <button class="flex-1 py-2 text-xs font-bold rounded-lg transition ${subTabSavdo==='menu'?'bg-blue-600 text-white shadow':'text-gray-500'}" onclick="setSavdoTab('menu')">Меню</button>
      </div>
      ${contentHtml}
    `;

    // ИШЛАШ ЛОГИКАСИ (Events)
    if(subTabSavdo === 'kassa') {
      document.getElementById('saveKassaBtn').onclick = async (e) => {
        haptic('medium'); const btn = e.target; btn.disabled = true; btn.textContent = "⏳...";
        const summary = { 
          umumiy: parseFloat(document.getElementById('s_um').value)||0, 
          naqd: parseFloat(document.getElementById('s_naqd').value)||0, 
          karta: parseFloat(document.getElementById('s_karta').value)||0, 
          click: parseFloat(document.getElementById('s_click').value)||0, 
          xodimlar: parseFloat(document.getElementById('s_xodim').value)||0, 
          kassa_qoldiq: parseFloat(document.getElementById('s_qoldiq').value)||0 
        };
        try { 
          const res = await saveSales({ date: todayStr, summary }); 
          if(res.success){ haptic('success'); todayData.summary = summary; alert("✅ Сақланди!"); } 
        } catch (err) { alert("Сервер билан хатолик!"); } finally { btn.disabled=false; btn.textContent="Кассани Сақлаш"; }
      };
    }
    else if(subTabSavdo === 'sotuv' && activeMenuCat) {
      const calcSold = () => {
        let sum = 0;
        document.querySelectorAll('.sold-qty-input').forEach(inp => {
           const item = menuItemsList.find(m => m.id === inp.dataset.id);
           const q = parseFloat(inp.value)||0; const tot = q * item.price;
           document.getElementById(`stot-${item.id}`).textContent = tot.toLocaleString(); sum += tot;
        });
        document.getElementById('soldTotal').textContent = sum.toLocaleString() + ' сўм';
      };
      document.querySelectorAll('.sold-qty-input').forEach(i => i.addEventListener('input', calcSold)); calcSold();

      document.getElementById('saveSoldBtn').onclick = async (e) => {
        haptic('medium'); const btn = e.target; btn.disabled = true; btn.textContent = "⏳...";
        const catSoldItems = {};
        document.querySelectorAll('.sold-qty-input').forEach(inp => { const q = parseFloat(inp.value)||0; if(q > 0) catSoldItems[inp.dataset.id] = q; });
        const allSold = { ...todayData.soldItems, [activeMenuCat]: catSoldItems };
        try { 
          const res = await saveSales({ date: todayStr, soldItems: allSold }); 
          if(res.success){ haptic('success'); todayData.soldItems = allSold; alert("✅ Сотув сақланди!"); window.openMenuCat(null); } 
        } catch (err) { alert("Хатолик!"); } finally { btn.disabled=false; btn.textContent="Сотувни Сақлаш"; }
      };
    }
    else if(subTabSavdo === 'menu') {
      document.querySelectorAll('.del-menu').forEach(b => { 
        b.onclick = async () => { 
          if(confirm("Ўчирасизми?")){ 
            haptic('medium'); 
            // api.js орқали ўчириш
            await deleteMenu(b.dataset.id); 
            menuItemsList = menuItemsList.filter(m=>m.id!==b.dataset.id); 
            renderSavdoTab(); 
          } 
        } 
      });
      document.getElementById('addMenuBtn').onclick = async (e) => {
        const cat = document.getElementById('mCat').value, name = document.getElementById('mName').value, price = document.getElementById('mPrice').value;
        if(name && price){ 
          haptic('light'); e.target.textContent="⏳..."; 
          // api.js орқали қўшиш
          const r = await addMenu({category:cat, name, price}); 
          if(r && r.success){ 
            menuItemsList.push({id:r.id, category:cat, name, price:Number(price)}); 
            renderSavdoTab(); 
          } else {
             alert("Хатолик юз берди!"); e.target.textContent="Таомни қўшиш";
          }
        }
      };
    }
  }

  // =====================================
  // 3-ОЙНА: МОНИТОРИНГ (ТАРИХ)
  // =====================================
  function renderMonitoring() {
    if(monitoringData.length === 0) { adminContent.innerHTML = `<div class="text-center py-10 w-full text-gray-400 font-bold text-sm">Тарих йўқ</div>`; return; }
    
    const cards = monitoringData.map(d => {
       let dayTotalExp = 0, dayTotalSale = 0;
       
       const catsHtml = catKeys.map(k => { 
         const exp = d.expenses[k]; const sale = d.sales[k] || 0; const totalE = exp ? exp.grandTotal : 0; const prof = sale - totalE; 
         dayTotalExp += totalE; dayTotalSale += sale; 
         
         let itemsH = '';
         if (exp && exp.items && exp.items.length > 0) {
           itemsH = `<div class="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-full">` + exp.items.map(i => `<div class="flex justify-between text-[10px] text-gray-500 py-1 border-b border-gray-100 last:border-0 w-full"><span class="truncate mr-2">${i.name} (${i.qty})</span><span class="shrink-0">${i.total.toLocaleString()}</span></div>`).join('') + `<div class="flex justify-between text-[10px] font-bold mt-1 text-gray-500 w-full"><span>Ош/Қўш:</span><span>${(exp.salary+exp.extra).toLocaleString()}</span></div></div>`;
         } else { itemsH = `<div class="text-[10px] text-gray-400 mt-1 w-full">Харажат йўқ</div>`; }
         
         // Сотилган таомларни тарихда кўрсатиш
         let soldListH = '';
         if(d.soldItems && d.soldItems[k]) {
            const soldCat = d.soldItems[k];
            const soldArr = Object.keys(soldCat).map(id => { 
              const m = menuItemsList.find(x=>x.id===id); 
              const itemName = m ? m.name : "Ўчирилган таом";
              const itemPrice = m ? m.price : 0;
              const itemTotal = itemPrice > 0 ? (itemPrice * soldCat[id]).toLocaleString() : "?";
              return `<div class="flex justify-between text-[10px] text-blue-600 border-b border-blue-50 py-1 last:border-0"><span class="truncate">${itemName} (${soldCat[id]} та)</span><span>${itemTotal}</span></div>`; 
            }).join('');
            if(soldArr) soldListH = `<div class="mt-2 p-2 bg-blue-50/50 rounded-xl border border-blue-100 w-full"><div class="text-[9px] font-bold text-blue-500 mb-1">СОТИЛГАН ТАОМЛАР:</div>${soldArr}</div>`;
         }

         let somsaH = ''; if(k === 'Somsa' && prof > 0) somsaH = `<div class="flex gap-2 mt-2 text-[9px] font-bold w-full"><span class="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">60%: ${(prof*0.6).toLocaleString()}</span><span class="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">40%: ${(prof*0.4).toLocaleString()}</span></div>`;

         return `
           <div class="border border-gray-100 rounded-2xl mb-2 overflow-hidden w-full">
             <div class="p-3 bg-white flex justify-between items-center cursor-pointer active:bg-gray-50 w-full" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="font-bold text-sm text-gray-700">${catIcons[k]} ${catNames[k]}</span><span class="text-[10px] text-blue-500 font-bold">Кўриш 🔽</span>
             </div>
             <div class="hidden p-3 border-t border-gray-50 bg-white w-full">
                ${itemsH}
                ${soldListH}
                <div class="mt-2 flex justify-between text-[10px] font-bold w-full"><span class="text-blue-600">Савдо: ${sale.toLocaleString()}</span><span class="text-red-500">Харажат: ${totalE.toLocaleString()}</span></div>
                <div class="font-black mt-1 text-xs ${prof > 0 ? 'text-emerald-500' : 'text-red-500'} w-full">Фойда: ${prof>0?'+':''}${prof.toLocaleString()}</div>
                ${somsaH}
             </div>
           </div>`; 
       }).join('');
       
       const dayProfit = dayTotalSale - dayTotalExp;
       const sum = d.summary || {};

       const kassaHtml = (sum.umumiy || sum.kassa_qoldiq !== undefined) ? `
          <div class="mt-4 pt-3 border-t border-gray-200 bg-gray-50 rounded-xl p-3 shadow-inner w-full">
             <div class="text-[10px] font-black text-gray-500 mb-2 uppercase text-center border-b border-gray-200 pb-1">Касса ҳисоботи</div>
             <div class="grid grid-cols-2 gap-2 text-xs font-bold mb-3 w-full">
               <div>Умумий савдо: <span class="text-blue-600">${(sum.umumiy||0).toLocaleString()}</span></div>
               <div>Нақд савдо: <span class="text-gray-800">${(sum.naqd||0).toLocaleString()}</span></div>
               <div>Карта: <span class="text-gray-800">${(sum.karta||0).toLocaleString()}</span></div>
               <div>Click: <span class="text-gray-800">${(sum.click||0).toLocaleString()}</span></div>
               <div class="col-span-2 text-[10px]">Ходимлар овқати: <span class="text-orange-500">${(sum.xodimlar||0).toLocaleString()}</span></div>
             </div>
             <div class="flex justify-between items-center border-t border-gray-200 pt-2 w-full">
               <span class="text-[10px] text-gray-500 font-bold uppercase">Кассадаги нақд пул:</span>
               <span class="font-black text-sm text-blue-600">${(sum.kassa_qoldiq||0).toLocaleString()}</span>
             </div>
          </div>
       ` : '';

       return `
         <div class="bg-white rounded-3xl shadow-sm border mb-4 overflow-hidden w-full">
           <div class="p-4 flex justify-between items-center bg-blue-50/30 cursor-pointer active:bg-blue-50/50 w-full" onclick="this.nextElementSibling.classList.toggle('hidden')">
             <div><div class="font-black text-gray-900 text-sm">${d.date}</div><div class="text-[10px] text-blue-500 mt-1 font-bold">Очиш 🔽</div></div>
             <div class="text-right"><div class="text-[9px] uppercase text-gray-400 font-bold mb-0.5">Соф фойда</div><div class="font-black text-lg ${dayProfit > 0 ? 'text-emerald-600' : 'text-red-600'}">${dayProfit > 0 ? '+'+dayProfit.toLocaleString() : dayProfit.toLocaleString()}</div></div>
           </div>
           <div class="hidden p-4 border-t border-gray-100 w-full bg-white">
             ${catsHtml}
             <div class="mt-3 pt-3 border-t-2 border-dashed flex justify-between text-xs font-bold w-full"><div class="w-1/2 pr-2 border-r"><span class="text-[10px] text-gray-500 block mb-1">Жами Савдо:</span><span class="text-blue-600">${dayTotalSale.toLocaleString()}</span></div><div class="w-1/2 pl-2 text-right"><span class="text-[10px] text-gray-500 block mb-1">Жами Харажат:</span><span class="text-red-500">${dayTotalExp.toLocaleString()}</span></div></div>
             ${kassaHtml}
           </div>
         </div>`;
    }).join('');
    
    adminContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest text-center w-full">Ойлик Мониторинг</h4>${cards}`;
  }

  function renderProfile() {
    adminContent.innerHTML = `
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-5 text-center w-full"><div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-3">👤</div><h2 class="font-black text-2xl text-gray-900 tracking-tight">${user.name}</h2><p class="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">АДМИНИСТРАТОР</p></div>
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full"><label class="block text-xs font-bold text-gray-500 mb-1.5">Янги ПИН-код (4 та рақам):</label><input type="number" id="newPin" class="w-full border border-gray-200 rounded-xl p-3.5 mb-4 bg-gray-50 font-bold outline-none" placeholder="Янги код"><label class="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between w-full"><span>Telegram Chat ID:</span><a href="https://t.me/userinfobot" target="_blank" class="text-blue-500">ID ни олиш</a></label><input type="number" id="newChatId" class="w-full border border-gray-200 rounded-xl p-3.5 mb-5 bg-gray-50 outline-none" placeholder="123456789" value="${user.chatId || ''}"><button id="updateProfileBtn" class="w-full bg-gray-800 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">Ўзгаришларни сақлаш</button></div>
    `;
    document.getElementById("updateProfileBtn").onclick = async (e) => { const p = document.getElementById("newPin").value, c = document.getElementById("newChatId").value, obj = {}; if(p) obj.pin = p; if(c) obj.chatId = c; if(Object.keys(obj).length){ haptic('medium'); e.target.textContent="⏳..."; await updateProfile(user.id, obj); alert("Янгиланди!"); document.getElementById("newPin").value=""; e.target.textContent="Сақлаш"; } };
  }
  
  loadData();
}

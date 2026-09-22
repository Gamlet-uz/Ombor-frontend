import { fetchMonitoring, fetchMenu } from "../api.js";

export async function renderBoss(container, user, onLogout) {
  let currentView = 'menu'; // menu, hisobot, sotuv, rasxod, monitoring, day-menu, day-hisobot, day-sotuv, day-rasxod
  let selectedDay = null;
  let selectedDayData = null;
  
  let monitoringData = [];
  let menuItemsList = [];
  let todayData = { expenses: {}, sales: {}, summary: {}, soldItems: {} };
  
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const tg = window.Telegram?.WebApp;
  function haptic(type = 'light') { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type); }

  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catIcons = { "Ovqat": "🍲", "Somsa": "🥟", "Shashlik": "🍢", "Fast food": "🍔" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  // ==========================================
  // АСОСИЙ ЭКРАН СТРУКТУРАСИ ВА АНИМАЦИЯЛАР
  // ==========================================
  container.innerHTML = `
    <div class="flex flex-col h-screen w-full bg-[#f3f4f6] overflow-hidden font-sans select-none">
      <style>
        .pop-in { animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        
        .slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        
        /* Скроллбарни яшириш, лекин скролл ишлайверади */
        ::-webkit-scrollbar { width: 0px; background: transparent; }
      </style>
      
      <!-- Сарлавҳа (Header) -->
      <div class="h-24 bg-slate-900 px-5 shadow-lg flex justify-between items-center shrink-0 w-full z-50 relative rounded-b-[2rem]">
        <div class="flex items-center">
            <button id="headerBack" class="hidden mr-4 bg-white/20 hover:bg-white/30 p-3.5 rounded-[1.2rem] transition active:scale-90 text-white backdrop-blur-sm border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div class="truncate">
                <span id="headerSubtitle" class="text-[12px] font-black uppercase tracking-widest text-yellow-400 mb-1 block opacity-90">Раҳбар</span>
                <h3 id="headerTitle" class="font-black text-3xl text-white truncate tracking-tight">${user.name}</h3>
            </div>
        </div>
        <button id="logoutBtn" class="text-base text-red-400 font-bold bg-white/10 hover:bg-white/20 px-5 py-3 rounded-2xl transition active:scale-90 border border-white/5">Чиқиш</button>
      </div>

      <!-- Асосий контент (Скролл бўладиган жой) -->
      <div id="bossContent" class="flex-1 overflow-y-auto w-full p-5 relative z-0 pb-10"></div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => { haptic('medium'); onLogout(); };
  
  const bossContent = document.getElementById("bossContent");
  const headerTitle = document.getElementById('headerTitle');
  const headerSubtitle = document.getElementById('headerSubtitle');
  const headerBack = document.getElementById('headerBack');
  const logoutBtn = document.getElementById('logoutBtn');

  // ==========================================
  // VIEW (ЭКРАНЛАР) БОШҚАРУВИ
  // ==========================================
  window.setBossView = (viewName) => {
    haptic('light');
    currentView = viewName;
    renderActiveView();
  };

  window.openMonitoringDay = (dateStr) => {
    haptic('medium');
    selectedDay = dateStr;
    selectedDayData = monitoringData.find(d => d.date === dateStr) || { expenses: {}, sales: {}, summary: {}, soldItems: {} };
    currentView = 'day-menu';
    renderActiveView();
  };

  async function loadData() {
    bossContent.innerHTML = `
      <div class="text-center py-24 w-full pop-in">
        <div class="animate-spin rounded-full h-14 w-14 border-b-4 border-blue-600 mx-auto"></div>
        <p class="text-gray-400 font-black mt-6 text-xl tracking-wide">Маълумотлар юкланмоқда...</p>
      </div>
    `;
    try {
      const res = await fetchMonitoring();
      monitoringData = res.records || [];
      todayData = monitoringData.find(d => d.date === todayStr) || { expenses: {}, sales: {}, summary: {}, soldItems: {} };
      
      // Ҳимоя (хатолик бўлмаслиги учун)
      if(!todayData.sales) todayData.sales = {}; if(!todayData.expenses) todayData.expenses = {};
      if(!todayData.summary) todayData.summary = {}; if(!todayData.soldItems) todayData.soldItems = {};
      
      const menuRes = await fetchMenu();
      if(menuRes && menuRes.success) menuItemsList = menuRes.records || [];

      renderActiveView();
    } catch (e) { 
      bossContent.innerHTML = `<div class="text-center py-20 text-red-500 font-black text-2xl pop-in">Сервер билан алоқа йўқ!</div>`; 
    }
  }

  function renderActiveView() {
    // Дефолт ҳолатга қайтариш
    headerBack.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    bossContent.style.opacity = 0;

    setTimeout(() => {
        if (currentView === 'menu') {
            headerSubtitle.textContent = "Раҳбар";
            headerTitle.textContent = user.name;
            bossContent.innerHTML = getMainMenuHTML();
        } 
        else if (currentView === 'hisobot') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = "Бугунги ҳолат";
            headerTitle.textContent = "Ҳисобот";
            bossContent.innerHTML = getHisobotHTML(todayData);
        }
        else if (currentView === 'sotuv') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = "Бугунги ҳолат";
            headerTitle.textContent = "Сотув";
            bossContent.innerHTML = getSotuvHTML(todayData);
        }
        else if (currentView === 'rasxod') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = "Бугунги ҳолат";
            headerTitle.textContent = "Харажат";
            bossContent.innerHTML = getRasxodHTML(todayData);
        }
        else if (currentView === 'monitoring') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = "Олдинги кунлар";
            headerTitle.textContent = "Мониторинг";
            bossContent.innerHTML = getMonitoringListHTML();
        }
        else if (currentView === 'day-menu') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('monitoring');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = "Танланган сана";
            headerTitle.textContent = selectedDay;
            bossContent.innerHTML = getDayMenuHTML();
        }
        else if (currentView === 'day-hisobot') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('day-menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = selectedDay;
            headerTitle.textContent = "Ҳисобот";
            bossContent.innerHTML = getHisobotHTML(selectedDayData);
        }
        else if (currentView === 'day-sotuv') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('day-menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = selectedDay;
            headerTitle.textContent = "Сотув";
            bossContent.innerHTML = getSotuvHTML(selectedDayData);
        }
        else if (currentView === 'day-rasxod') {
            headerBack.classList.remove('hidden');
            headerBack.onclick = () => setBossView('day-menu');
            logoutBtn.classList.add('hidden');
            headerSubtitle.textContent = selectedDay;
            headerTitle.textContent = "Харажат";
            bossContent.innerHTML = getRasxodHTML(selectedDayData);
        }

        bossContent.style.opacity = 1;
        bossContent.scrollTop = 0;
    }, 150);
  }

  // ==========================================
  // HTML ГЕНЕРАТОР ФУНКЦИЯЛАРИ
  // ==========================================

  // --- 1. АСОСИЙ МЕНЮ (4 ТА КАТТА ТУГМА) ---
  function getMainMenuHTML() {
      return `
          <div class="space-y-6 pb-10 pop-in mt-2">
              <button onclick="setBossView('hisobot')" class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-blue-900">
                  <div class="text-left">
                      <div class="text-6xl mb-4">🏦</div>
                      <div class="text-4xl font-black mb-1 tracking-tight">Ҳисобот</div>
                      <div class="text-blue-200 text-xl font-bold">Касса ва маблағлар</div>
                  </div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>

              <button onclick="setBossView('sotuv')" class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-emerald-800">
                  <div class="text-left">
                      <div class="text-6xl mb-4">🛍️</div>
                      <div class="text-4xl font-black mb-1 tracking-tight">Сотув</div>
                      <div class="text-emerald-100 text-xl font-bold">Сотилган таомлар</div>
                  </div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>

              <button onclick="setBossView('rasxod')" class="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-rose-800">
                  <div class="text-left">
                      <div class="text-6xl mb-4">📉</div>
                      <div class="text-4xl font-black mb-1 tracking-tight">Харажат</div>
                      <div class="text-rose-100 text-xl font-bold">Ишлатилган хомашё</div>
                  </div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>

              <button onclick="setBossView('monitoring')" class="w-full bg-gradient-to-r from-purple-600 to-indigo-800 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-purple-900 mt-10">
                  <div class="text-left">
                      <div class="text-6xl mb-4">📅</div>
                      <div class="text-4xl font-black mb-1 tracking-tight">Мониторинг</div>
                      <div class="text-purple-200 text-xl font-bold">Олдинги кунлар тарихи</div>
                  </div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>
          </div>
      `;
  }

  // --- 2. ҲИСОБОТ (КАССА ҲОЛАТИ) ---
  function getHisobotHTML(data) {
      const sum = data.summary || {};
      const umumiy = sum.umumiy || 0;
      const naqd = sum.naqd || 0;
      const karta = sum.karta || 0;
      const click = sum.click || 0;
      const xodim = sum.xodimlar || 0;
      const qoldiq = sum.kassa_qoldiq || 0;

      return `
          <div class="space-y-5 pb-10 slide-in-right">
              
              <!-- АЖРАЛИБ ТУРУВЧИ КАССА ҚОЛДИҒИ -->
              <div class="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 shadow-2xl text-center border-4 border-blue-400/40 mt-2 relative overflow-hidden">
                  <div class="absolute -right-6 -bottom-6 text-9xl opacity-10">🏦</div>
                  <div class="text-blue-200 font-bold text-xl mb-3 uppercase tracking-widest relative z-10">Кассадаги нақд пул</div>
                  <div class="text-6xl font-black text-white tracking-tight relative z-10">${qoldiq.toLocaleString()}</div>
                  <div class="text-blue-300 text-2xl mt-2 font-bold relative z-10">сўм</div>
              </div>

              <!-- ЖАМИ САВДО -->
              <div class="bg-slate-900 rounded-[2.5rem] p-8 shadow-lg text-center mt-6">
                  <div class="text-slate-400 font-bold text-lg mb-2 uppercase tracking-widest">Жами Савдо</div>
                  <div class="text-5xl font-black text-emerald-400">${umumiy.toLocaleString()}</div>
                  <div class="text-slate-500 text-xl font-bold mt-1">сўм</div>
              </div>

              <!-- БОШҚА ТЎЛОВЛАР (GRID) -->
              <div class="grid grid-cols-2 gap-4 mt-6">
                  <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                      <div class="text-gray-400 font-black text-sm mb-1 uppercase tracking-wider">Нақд пул</div>
                      <div class="text-3xl font-black text-gray-800">${naqd.toLocaleString()}</div>
                  </div>
                  <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                      <div class="text-gray-400 font-black text-sm mb-1 uppercase tracking-wider">Пластик Карта</div>
                      <div class="text-3xl font-black text-gray-800">${karta.toLocaleString()}</div>
                  </div>
                  <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center">
                      <div class="text-gray-400 font-black text-sm mb-1 uppercase tracking-wider">Click / Payme</div>
                      <div class="text-3xl font-black text-gray-800">${click.toLocaleString()}</div>
                  </div>
                  <div class="bg-orange-50 p-6 rounded-3xl shadow-sm border border-orange-100 flex flex-col justify-center">
                      <div class="text-orange-400 font-black text-sm mb-1 uppercase tracking-wider">Ходимлар</div>
                      <div class="text-3xl font-black text-orange-600">${xodim.toLocaleString()}</div>
                  </div>
              </div>
          </div>
      `;
  }

  // --- 3. СОТУВ (ҚАЙСИ МАҲСУЛОТ ҚАНЧА СОТИЛГАНИ) ---
  function getSotuvHTML(data) {
      const sold = data.soldItems || {};
      let html = '<div class="space-y-6 pb-10 slide-in-right mt-2">';
      
      let hasAny = false;
      catKeys.forEach(cat => {
          const catSold = sold[cat];
          if (catSold && Object.keys(catSold).length > 0) {
              hasAny = true;
              let sumCat = 0;
              let itemsList = Object.keys(catSold).map(id => {
                  const m = menuItemsList.find(x => x.id === id);
                  const name = m ? m.name : 'Ўчирилган таом';
                  const price = m ? m.price : 0;
                  const qty = catSold[id];
                  const total = price * qty;
                  sumCat += total;
                  return `
                      <div class="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 relative z-10">
                          <div class="text-2xl font-bold text-gray-700 pr-4 leading-tight">${name}</div>
                          <div class="text-right shrink-0">
                              <div class="text-3xl font-black text-emerald-600">${qty} <span class="text-lg text-emerald-600/50 font-bold">та</span></div>
                              <div class="text-sm font-bold text-gray-400 mt-1">${total.toLocaleString()} сўм</div>
                          </div>
                      </div>
                  `;
              }).join('');

              html += `
                  <div class="bg-white rounded-[2.5rem] p-7 shadow-md border border-gray-100 relative overflow-hidden">
                      <div class="absolute -right-5 -top-5 text-[8rem] opacity-5 pointer-events-none">${catIcons[cat]}</div>
                      <div class="flex items-center gap-4 border-b-2 border-gray-100 pb-5 mb-3 relative z-10">
                          <span class="text-5xl">${catIcons[cat]}</span>
                          <span class="text-3xl font-black text-gray-800">${catNames[cat]}</span>
                      </div>
                      ${itemsList}
                      <div class="mt-5 pt-5 bg-emerald-50 -mx-7 -mb-7 px-7 pb-7 rounded-b-[2.5rem] flex justify-between items-center relative z-10">
                          <span class="text-emerald-600/80 font-black text-xl uppercase tracking-wider">Жами сумма:</span>
                          <span class="text-emerald-600 font-black text-3xl">${sumCat.toLocaleString()} сўм</span>
                      </div>
                  </div>
              `;
          }
      });

      if (!hasAny) {
          html += `
              <div class="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-gray-100 mt-10">
                  <div class="text-7xl mb-5 opacity-40">🛒</div>
                  <div class="text-gray-400 font-black text-2xl">Бу кун учун сотув тарихда йўқ</div>
              </div>`;
      }

      html += '</div>';
      return html;
  }

  // --- 4. ХАРАЖАТЛАР ВА НИМАЛИГИ ---
  function getRasxodHTML(data) {
      const expenses = data.expenses || {};
      let html = '<div class="space-y-6 pb-10 slide-in-right mt-2">';

      let hasAny = false;
      catKeys.forEach(cat => {
          const exp = expenses[cat];
          if (exp && exp.items && exp.items.length > 0) {
              hasAny = true;
              let itemsList = exp.items.map(i => `
                  <div class="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 relative z-10">
                      <div class="pr-4">
                          <div class="text-2xl font-bold text-gray-700 leading-tight">${i.name}</div>
                          <div class="text-lg text-rose-500 font-black mt-2 bg-rose-50 inline-block px-3 py-1 rounded-xl">${i.qty} ${i.unit}</div>
                      </div>
                      <div class="text-3xl font-black text-gray-800 shrink-0">${i.total.toLocaleString()}</div>
                  </div>
              `).join('');

              html += `
                  <div class="bg-white rounded-[2.5rem] p-7 shadow-md border border-gray-100 relative overflow-hidden">
                      <div class="absolute -right-5 -top-5 text-[8rem] opacity-5 pointer-events-none">${catIcons[cat]}</div>
                      <div class="flex items-center gap-4 border-b-2 border-gray-100 pb-5 mb-3 relative z-10">
                          <span class="text-5xl">${catIcons[cat]}</span>
                          <span class="text-3xl font-black text-gray-800">${catNames[cat]}</span>
                      </div>
                      ${itemsList}
                      
                      <div class="mt-5 pt-6 bg-rose-50 -mx-7 -mb-7 px-7 pb-7 rounded-b-[2.5rem] relative z-10 border-t border-rose-100">
                          <div class="flex justify-between items-center mb-4">
                              <span class="text-rose-400 font-black text-xl uppercase tracking-wider">Ойлик / Қўшимча:</span>
                              <span class="text-rose-600 font-black text-3xl">${(exp.salary + exp.extra).toLocaleString()}</span>
                          </div>
                          <div class="flex justify-between items-center pt-4 border-t-2 border-dashed border-rose-200">
                              <span class="text-gray-800 font-black text-2xl uppercase">Жами харажат:</span>
                              <span class="text-red-600 font-black text-4xl">${exp.grandTotal.toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              `;
          }
      });

      if (!hasAny) {
          html += `
              <div class="bg-white p-12 rounded-[3rem] text-center shadow-sm border border-gray-100 mt-10">
                  <div class="text-7xl mb-5 opacity-40">📉</div>
                  <div class="text-gray-400 font-black text-2xl">Бу кун учун харажат тарихда йўқ</div>
              </div>`;
      }
      
      html += '</div>';
      return html;
  }

  // --- 5. МОНИТОРИНГ (КУНЛАР РЎЙХАТИ) ---
  function getMonitoringListHTML() {
      if(monitoringData.length === 0) return `<div class="text-center py-20 text-2xl font-black text-gray-400 pop-in mt-10">Маълумот йўқ</div>`;

      return `
          <div class="space-y-5 pb-10 slide-in-right mt-2">
              ${monitoringData.map(d => `
                  <button onclick="openMonitoringDay('${d.date}')" class="w-full bg-white rounded-[2.5rem] p-7 shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition-transform text-left">
                      <div>
                          <div class="text-3xl font-black text-gray-800">${d.date}</div>
                          <div class="text-gray-400 font-bold text-lg mt-2 uppercase tracking-wide">Савдо: <span class="text-blue-500 font-black">${(d.summary?.umumiy || 0).toLocaleString()} сўм</span></div>
                      </div>
                      <div class="text-5xl text-gray-300">▶</div>
                  </button>
              `).join('')}
          </div>
      `;
  }

  // --- 6. МОНИТОРИНГ КУНИ ИЧИДАГИ МЕНЮ (3 та тугма) ---
  function getDayMenuHTML() {
      return `
          <div class="space-y-6 pop-in pb-10 mt-2">
              <button onclick="setBossView('day-hisobot')" class="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-blue-900">
                  <div class="text-left"><div class="text-6xl mb-4">🏦</div><div class="text-4xl font-black mb-1">Ҳисобот</div><div class="text-blue-200 text-xl font-bold">Шу куннинг кассаси</div></div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>

              <button onclick="setBossView('day-sotuv')" class="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-emerald-800">
                  <div class="text-left"><div class="text-6xl mb-4">🛍️</div><div class="text-4xl font-black mb-1">Сотув</div><div class="text-emerald-100 text-xl font-bold">Сотилган таомлар</div></div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>

              <button onclick="setBossView('day-rasxod')" class="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-[2.5rem] p-8 shadow-xl transform active:scale-95 transition-all flex items-center justify-between border-b-[6px] border-rose-800">
                  <div class="text-left"><div class="text-6xl mb-4">📉</div><div class="text-4xl font-black mb-1">Харажат</div><div class="text-rose-100 text-xl font-bold">Олинган маҳсулотлар</div></div>
                  <div class="text-5xl opacity-40">▶</div>
              </button>
          </div>
      `;
  }

  loadData();
}

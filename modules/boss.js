import { fetchMonitoring } from "../api.js";

export async function renderBoss(container, user, onLogout) {
  let activeTab = 'bugun'; 
  let monitoringData = [];
  let todayData = { expenses: {}, sales: {}, summary: {}, soldItems: {} };
  
  const today = new Date();
  const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  const tg = window.Telegram?.WebApp;
  function haptic(type = 'light') { if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type); }

  const catNames = { "Ovqat": "Овқат", "Somsa": "Сомса", "Shashlik": "Шашлик", "Fast food": "Fast food" };
  const catIcons = { "Ovqat": "🍲", "Somsa": "🥟", "Shashlik": "🍢", "Fast food": "🍔" };
  const catKeys = ["Ovqat", "Somsa", "Shashlik", "Fast food"];

  container.innerHTML = `
    <div class="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <!-- Сарлавҳа -->
      <div class="h-16 bg-slate-900 px-5 shadow-md flex justify-between items-center shrink-0 w-full z-50 relative">
        <div class="truncate mr-2">
          <span class="text-[10px] font-bold uppercase text-yellow-400 bg-yellow-400/20 px-2.5 py-1 rounded-full border border-yellow-400/30">Раҳбар</span>
          <h3 class="font-black text-lg text-white mt-0.5 truncate">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-400 font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition active:scale-95">Чиқиш</button>
      </div>

      <!-- Асосий контент -->
      <div id="bossContent" class="flex-1 overflow-y-auto w-full p-4 pb-8 relative z-0"></div>

      <!-- Навигация -->
      <div class="h-16 bg-white border-t border-gray-200 flex justify-around items-center shrink-0 w-full z-50 relative shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] pb-safe">
        <button class="nav-btn flex flex-col items-center justify-center w-1/2 h-full text-blue-600 transition-transform active:scale-90" data-tab="bugun">
          <span class="text-2xl leading-none mb-1">📊</span><span class="text-[11px] font-black leading-none uppercase">Бугунги ҳолат</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/2 h-full text-gray-400 transition-transform active:scale-90" data-tab="monitoring">
          <span class="text-2xl leading-none mb-1">📅</span><span class="text-[11px] font-black leading-none uppercase">Тарих / Мониторинг</span>
        </button>
      </div>
    </div>
  `;

  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };
  const bossContent = document.getElementById("bossContent");

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.onclick = () => {
      haptic('light');
      document.querySelectorAll('.nav-btn').forEach(b => { b.classList.remove('text-blue-600'); b.classList.add('text-gray-400'); });
      btn.classList.add('text-blue-600'); btn.classList.remove('text-gray-400');
      activeTab = btn.dataset.tab; 
      bossContent.style.opacity = 0; 
      setTimeout(() => { renderActiveView(); bossContent.style.opacity = 1; bossContent.scrollTop = 0; }, 150);
    };
  });

  async function loadData() {
    bossContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p class="text-gray-500 font-bold mt-3 text-sm">Маълумотлар юкланмоқда...</p></div>`;
    try {
      const res = await fetchMonitoring();
      monitoringData = res.records || [];
      todayData = monitoringData.find(d => d.date === todayStr) || { expenses: {}, sales: {}, summary: {}, soldItems: {} };
      if(!todayData.sales) todayData.sales = {}; if(!todayData.expenses) todayData.expenses = {};
      if(!todayData.summary) todayData.summary = {}; if(!todayData.soldItems) todayData.soldItems = {};
      
      renderActiveView();
    } catch (e) { bossContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Сервер билан алоқа йўқ!</div>`; }
  }

  function renderActiveView() {
    if (activeTab === 'bugun') renderBugun();
    else if (activeTab === 'monitoring') renderMonitoring();
  }

  // =====================================
  // 1. БУГУНГИ ҲОЛАТ ДАШБОРДИ (Фақат ўқиш учун)
  // =====================================
  function renderBugun() {
    let totalProf = 0; let totalExp = 0; let totalSale = 0;
    
    // Бўлимлар бўйича ҳисоб-китоб
    const catsHtml = catKeys.map(k => {
      const exp = todayData.expenses[k]; 
      const sale = todayData.sales[k] || 0; 
      const catTotExp = exp ? exp.grandTotal : 0; 
      const prof = sale - catTotExp; 
      
      totalProf += prof; totalExp += catTotExp; totalSale += sale;

      let somsaH = ''; 
      if(k === 'Somsa' && prof > 0) {
        somsaH = `<div class="flex gap-2 mt-3 text-[11px] font-bold"><div class="w-1/2 bg-blue-100 text-blue-700 py-1.5 rounded-lg text-center border border-blue-200">60%: ${(prof*0.6).toLocaleString()}</div><div class="w-1/2 bg-purple-100 text-purple-700 py-1.5 rounded-lg text-center border border-purple-200">40%: ${(prof*0.4).toLocaleString()}</div></div>`;
      }

      return `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 w-full relative overflow-hidden">
          <div class="flex justify-between items-center mb-3">
            <div class="font-black text-base text-gray-800 flex items-center gap-2">${catIcons[k]} ${catNames[k]}</div>
            <div class="text-right">
              <div class="text-[10px] text-gray-400 font-bold uppercase">Соф фойда</div>
              <div class="font-black text-lg ${prof > 0 ? 'text-emerald-500' : 'text-red-500'}">${prof > 0 ? '+'+prof.toLocaleString() : prof.toLocaleString()}</div>
            </div>
          </div>
          <div class="flex justify-between text-xs font-bold bg-gray-50 p-2 rounded-xl">
             <div class="w-1/2 pr-2 border-r border-gray-200"><span class="text-[10px] text-gray-400 block">Савдо:</span><span class="text-blue-600">${sale.toLocaleString()} сўм</span></div>
             <div class="w-1/2 pl-2 text-right"><span class="text-[10px] text-gray-400 block">Харажат:</span><span class="text-red-500">${catTotExp.toLocaleString()} сўм</span></div>
          </div>
          ${somsaH}
        </div>
      `;
    }).join('');

    const sum = todayData.summary || {};

    bossContent.innerHTML = `
      <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-xl text-center mb-5 relative overflow-hidden">
         <div class="absolute -right-4 -top-4 text-7xl opacity-10">💎</div>
         <div class="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Жами Соф Фойда (Бугун)</div>
         <div class="text-4xl font-black mt-2 text-emerald-400">${totalProf.toLocaleString()} сўм</div>
         <div class="flex justify-between mt-5 pt-4 border-t border-slate-700 text-xs font-bold">
            <div class="text-left"><span class="text-slate-500 block text-[10px] uppercase">Жами Савдо</span><span class="text-blue-400">${totalSale.toLocaleString()}</span></div>
            <div class="text-right"><span class="text-slate-500 block text-[10px] uppercase">Жами Харажат</span><span class="text-red-400">${totalExp.toLocaleString()}</span></div>
         </div>
      </div>

      <h4 class="font-black text-gray-800 mb-3 px-1 text-sm uppercase">Бўлимлар бўйича:</h4>
      ${catsHtml}

      <div class="bg-blue-50 rounded-3xl p-5 shadow-inner border border-blue-100 mt-5 mb-5 w-full">
        <h4 class="font-black text-base text-blue-900 mb-4 border-b border-blue-200 pb-2 flex justify-between">
          <span>Касса Ҳолати</span>
          <span>🏦</span>
        </h4>
        <div class="grid grid-cols-2 gap-3 text-sm font-bold mb-3">
          <div class="bg-white p-3 rounded-xl shadow-sm"><div class="text-[10px] text-gray-400 uppercase mb-1">Умумий</div><div class="text-blue-700">${(sum.umumiy||0).toLocaleString()}</div></div>
          <div class="bg-white p-3 rounded-xl shadow-sm"><div class="text-[10px] text-gray-400 uppercase mb-1">Нақд</div><div class="text-gray-800">${(sum.naqd||0).toLocaleString()}</div></div>
          <div class="bg-white p-3 rounded-xl shadow-sm"><div class="text-[10px] text-gray-400 uppercase mb-1">Карта</div><div class="text-gray-800">${(sum.karta||0).toLocaleString()}</div></div>
          <div class="bg-white p-3 rounded-xl shadow-sm"><div class="text-[10px] text-gray-400 uppercase mb-1">Click</div><div class="text-gray-800">${(sum.click||0).toLocaleString()}</div></div>
        </div>
        <div class="bg-white p-3 rounded-xl shadow-sm mb-3 flex justify-between items-center">
          <span class="text-xs text-gray-500 font-bold uppercase">Ходимлар овқати:</span>
          <span class="text-orange-500 font-black">${(sum.xodimlar||0).toLocaleString()}</span>
        </div>
        <div class="bg-blue-600 text-white p-4 rounded-xl shadow-md flex justify-between items-center">
          <span class="text-xs font-bold uppercase tracking-wider">Кассадаги нақд:</span>
          <span class="font-black text-xl">${(sum.kassa_qoldiq||0).toLocaleString()} сўм</span>
        </div>
      </div>
    `;
  }

  // =====================================
  // 2. МОНИТОРИНГ ТАРИХИ (Худди админдагидек, лекин фақат кўриш учун)
  // =====================================
  function renderMonitoring() {
    if(monitoringData.length === 0) { bossContent.innerHTML = `<div class="text-center py-10 w-full text-gray-400 font-bold text-sm">Тарих йўқ</div>`; return; }
    
    const cards = monitoringData.map(d => {
       let dayTotalExp = 0, dayTotalSale = 0;
       
       const catsHtml = catKeys.map(k => { 
         const exp = d.expenses[k]; const sale = d.sales[k] || 0; const totalE = exp ? exp.grandTotal : 0; const prof = sale - totalE; 
         dayTotalExp += totalE; dayTotalSale += sale; 
         
         let itemsH = '';
         if (exp && exp.items && exp.items.length > 0) {
           itemsH = `<div class="mt-2 p-2 bg-gray-50 rounded-xl border border-gray-100 w-full">` + exp.items.map(i => `<div class="flex justify-between text-[10px] text-gray-500 py-1 border-b border-gray-100 last:border-0 w-full"><span class="truncate mr-2">${i.name} (${i.qty})</span><span class="shrink-0">${i.total.toLocaleString()}</span></div>`).join('') + `<div class="flex justify-between text-[10px] font-bold mt-1 text-gray-500 w-full"><span>Ош/Қўш:</span><span>${(exp.salary+exp.extra).toLocaleString()}</span></div></div>`;
         } else { itemsH = `<div class="text-[10px] text-gray-400 mt-1 w-full">Маълумот йўқ</div>`; }

         let somsaH = ''; if(k === 'Somsa' && prof > 0) somsaH = `<div class="flex gap-2 mt-2 text-[9px] font-bold w-full"><span class="bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">60%: ${(prof*0.6).toLocaleString()}</span><span class="bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">40%: ${(prof*0.4).toLocaleString()}</span></div>`;

         return `
           <div class="border border-gray-100 rounded-2xl mb-2 overflow-hidden w-full">
             <div class="p-3 bg-white flex justify-between items-center cursor-pointer active:bg-gray-50 w-full" onclick="this.nextElementSibling.classList.toggle('hidden')">
                <span class="font-bold text-sm text-gray-700">${catIcons[k]} ${catNames[k]}</span><span class="text-[10px] text-blue-500 font-bold">Очиш 🔽</span>
             </div>
             <div class="hidden p-3 border-t border-gray-50 bg-white w-full">
                ${itemsH}
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
               <div>Умумий: <span class="text-blue-600">${(sum.umumiy||0).toLocaleString()}</span></div>
               <div>Нақд: <span class="text-gray-800">${(sum.naqd||0).toLocaleString()}</span></div>
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
           <div class="p-4 flex justify-between items-center bg-slate-800 text-white cursor-pointer active:bg-slate-700 w-full" onclick="this.nextElementSibling.classList.toggle('hidden')">
             <div><div class="font-black text-sm">${d.date}</div></div>
             <div class="text-right"><div class="text-[9px] uppercase text-slate-400 font-bold mb-0.5">Соф фойда</div><div class="font-black text-lg ${dayProfit > 0 ? 'text-emerald-400' : 'text-red-400'}">${dayProfit > 0 ? '+'+dayProfit.toLocaleString() : dayProfit.toLocaleString()}</div></div>
           </div>
           <div class="hidden p-4 border-t border-gray-100 w-full bg-white">
             ${catsHtml}
             <div class="mt-3 pt-3 border-t-2 border-dashed flex justify-between text-xs font-bold w-full"><div class="w-1/2 pr-2 border-r"><span class="text-[10px] text-gray-500 block mb-1">Жами Савдо:</span><span class="text-blue-600">${dayTotalSale.toLocaleString()}</span></div><div class="w-1/2 pl-2 text-right"><span class="text-[10px] text-gray-500 block mb-1">Жами Харажат:</span><span class="text-red-500">${dayTotalExp.toLocaleString()}</span></div></div>
             ${kassaHtml}
           </div>
         </div>`;
    }).join('');
    
    bossContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest text-center w-full">Мониторинг</h4>${cards}`;
  }

  loadData();
}

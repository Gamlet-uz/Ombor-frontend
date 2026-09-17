import { saveExpense, fetchProducts, addProduct, deleteProduct, fetchHistory, updateProfile } from "../api.js";

export function renderWorker(container, user, onLogout) {
  let activeTab = 'expense'; 
  let products = [];
  let history = [];

  const tg = window.Telegram?.WebApp;
  function haptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      if(type === 'success' || type === 'error') tg.HapticFeedback.notificationOccurred(type);
      else tg.HapticFeedback.impactOccurred(type);
    }
  }

  // МУҲИМ ЎЗГАРИШ: Экран структураси тўғриланди. 
  // Тепа (h-16) ва Паст (h-16) қотирилган. 
  // Ўртадаги контент (flex-1 overflow-y-auto) бемалол скролл бўлади.
  container.innerHTML = `
    <div class="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      
      <!-- Юқори қисм (Қотирилган) -->
      <div class="h-16 bg-white px-5 shadow-sm flex justify-between items-center shrink-0 w-full z-50 relative">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">${user.category}</span>
          <h3 class="font-black text-lg text-gray-900 mt-0.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-90">Чиқиш</button>
      </div>

      <!-- Ўртадаги Контент (Фақат шу жой скролл бўлади) -->
      <div id="tabContent" class="flex-1 overflow-y-auto w-full p-4 pb-8 relative z-0"></div>

      <!-- Пастки Навигация (Қотирилган) -->
      <div class="h-16 bg-white border-t border-gray-200 flex justify-around items-center shrink-0 w-full z-50 relative shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] pb-safe">
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-blue-600 transition-transform active:scale-90" data-tab="expense">
          <span class="text-xl leading-none mb-1">📝</span>
          <span class="text-[10px] font-bold leading-none">Харажат</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="history">
          <span class="text-xl leading-none mb-1">📊</span>
          <span class="text-[10px] font-bold leading-none">Ҳисобот</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="products">
          <span class="text-xl leading-none mb-1">📦</span>
          <span class="text-[10px] font-bold leading-none">Маҳсулот</span>
        </button>
        <button class="nav-btn flex flex-col items-center justify-center w-1/4 h-full text-gray-400 transition-transform active:scale-90" data-tab="profile">
          <span class="text-xl leading-none mb-1">⚙️</span>
          <span class="text-[10px] font-bold leading-none">Профил</span>
        </button>
      </div>
      
    </div>
  `;

  const tabContent = document.getElementById("tabContent");
  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };

  // Навигация тугмалари
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
      haptic('light');
      document.querySelectorAll(".nav-btn").forEach(b => { 
        b.classList.remove("text-blue-600"); 
        b.classList.add("text-gray-400"); 
      });
      btn.classList.remove("text-gray-400"); 
      btn.classList.add("text-blue-600");
      
      activeTab = btn.getAttribute("data-tab");
      
      tabContent.style.opacity = 0;
      setTimeout(() => { 
        loadTabContent(); 
        tabContent.style.opacity = 1; 
        tabContent.scrollTop = 0; // Янги таб очилганда энг тепага чиқиш
      }, 150);
    };
  });

  async function loadTabContent() {
    tabContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>`;
    try {
      if (activeTab === 'expense') {
        const pRes = await fetchProducts(user.category); products = pRes.records || [];
        const hRes = await fetchHistory(user.category); history = hRes.records || [];
        renderExpenseTab();
      } else if (activeTab === 'history') {
        const hRes = await fetchHistory(user.category); history = hRes.records || [];
        renderHistoryTab();
      } else if (activeTab === 'products') {
        const pRes = await fetchProducts(user.category); products = pRes.records || [];
        renderProductsTab();
      } else if (activeTab === 'profile') {
        renderProfileTab();
      }
    } catch (e) { 
      tabContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Хатолик!</div>`; 
    }
  }

  // ==========================================
  // ТАБ 1: ХАРАЖАТ ЯРАТИШ ВА ТАҲРИРЛАШ
  // ==========================================
  function renderExpenseTab() {
    if (products.length === 0) { 
      tabContent.innerHTML = `<div class="text-center py-12 w-full bg-white rounded-3xl shadow-sm border border-gray-100"><p class="text-gray-400 font-bold">Олдин маҳсулот қўшинг.</p></div>`; 
      return; 
    }
    
    // Бугунги сана ва таҳрирлаш режими
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = history.find(h => h.date === today);
    const isEdit = !!todayRecord;

    const rows = products.map(p => {
      let qtyVal = "";
      if (isEdit && todayRecord.items) { 
        const found = todayRecord.items.find(i => i.name === p.name); 
        if (found) qtyVal = found.qty; 
      }
      return `
        <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
          <div class="flex-1 pr-2 overflow-hidden">
            <div class="font-bold text-sm text-gray-800 truncate">${p.name}</div>
            <div class="text-[10px] text-gray-400">${p.price.toLocaleString()} сўм / ${p.unit}</div>
          </div>
          <div class="w-20 shrink-0">
            <input type="number" step="any" min="0" data-id="${p.id}" value="${qtyVal}" class="qty-input w-full border border-gray-200 rounded-xl p-2 text-center font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
          </div>
          <div class="w-24 text-right shrink-0 pl-1">
            <span class="text-sm font-black text-blue-600 item-total" id="tot-${p.id}">0</span>
          </div>
        </div>
      `;
    }).join('');

    const salVal = isEdit ? todayRecord.salary : ""; 
    const extVal = isEdit ? todayRecord.extra : "";
    const btnText = isEdit ? "Ўзгартиришни Сақлаш" : "Харажатни Сақлаш";

    tabContent.innerHTML = `
      ${isEdit ? '<div class="bg-blue-50 text-blue-700 p-3 rounded-xl mb-3 text-xs font-bold text-center border border-blue-200 w-full">ℹ️ Бугунги ҳисоботни таҳрирлаяпсиз</div>' : ''}
      
      <div class="mb-2 flex text-[10px] font-bold text-gray-400 uppercase px-2 w-full">
        <div class="flex-1">Маҳсулот</div>
        <div class="w-20 text-center shrink-0">Миқдор</div>
        <div class="w-24 text-right shrink-0">Сумма</div>
      </div>
      <div class="mb-4 w-full">${rows}</div>
      
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4 w-full">
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Ходим ойлиги (сўм):</label>
        <input type="number" id="salaryInput" value="${salVal}" class="w-full border border-gray-200 rounded-xl p-3 mb-3 font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0">
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Қўшимча харажат:</label>
        <input type="number" id="extraInput" value="${extVal}" class="w-full border border-gray-200 rounded-xl p-3 font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0">
      </div>
      
      <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-lg mb-5 text-center w-full">
        <div class="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Умумий Жами</div>
        <div class="text-3xl font-black mt-1" id="grandTotal">0 сўм</div>
      </div>
      
      <button id="saveExpenseBtn" class="w-full ${isEdit ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
        ${btnText}
      </button>
    `;

    const calc = () => {
      let sum = 0;
      document.querySelectorAll('.qty-input').forEach(input => { 
        const p = products.find(x => x.id === input.dataset.id); 
        const q = parseFloat(input.value) || 0; 
        const tot = Math.round(q * p.price); 
        document.getElementById(`tot-${p.id}`).textContent = tot.toLocaleString(); 
        sum += tot; 
      });
      const sal = parseFloat(document.getElementById("salaryInput").value) || 0, ext = parseFloat(document.getElementById("extraInput").value) || 0;
      document.getElementById("grandTotal").textContent = (sum + sal + ext).toLocaleString() + " сўм";
    };
    
    document.querySelectorAll('.qty-input').forEach(i => i.addEventListener('input', calc)); 
    document.getElementById("salaryInput").addEventListener('input', calc); 
    document.getElementById("extraInput").addEventListener('input', calc); 
    
    setTimeout(calc, 50);

    document.getElementById("saveExpenseBtn").onclick = async (e) => {
      const btn = e.target; 
      haptic('medium'); 
      btn.disabled = true; 
      btn.textContent = "Сақланмоқда ⏳...";
      
      const items = [];
      document.querySelectorAll('.qty-input').forEach(input => { 
        const q = parseFloat(input.value) || 0; 
        if (q > 0) { 
          const p = products.find(x => x.id === input.dataset.id); 
          items.push({ name: p.name, qty: q, unit: p.unit, total: Math.round(q * p.price) }); 
        } 
      });
      
      const sal = parseFloat(document.getElementById("salaryInput").value) || 0, ext = parseFloat(document.getElementById("extraInput").value) || 0;
      const itemsSum = items.reduce((a, b) => a + b.total, 0), grandTotal = itemsSum + sal + ext;

      if (grandTotal === 0) { 
        haptic('error'); 
        alert("Харажат киритилмади!"); 
        btn.disabled = false; 
        btn.textContent = btnText; 
        return; 
      }

      try {
        const res = await saveExpense({ category: user.category, worker: user.name, items, salary: sal, extra: ext, itemsSum, grandTotal });
        if (res.success) { 
          haptic('success'); 
          alert("✅ " + res.message); 
          loadTabContent(); 
          tabContent.scrollTop = 0; 
        }
      } catch (err) { 
        alert("Хатолик!"); 
        btn.disabled = false; 
        btn.textContent = btnText; 
      }
    };
  }

  // ==========================================
  // ТАБ 2: ҲИСОБОТЛАР
  // ==========================================
  function renderHistoryTab() {
    if (history.length === 0) { 
      tabContent.innerHTML = `<div class="text-center py-10 w-full text-gray-400 font-bold">Тарих йўқ</div>`; 
      return; 
    }
    const cards = history.map(h => {
      const itemsList = (h.items || []).map(i => `
        <div class="flex justify-between text-xs py-1.5 border-b border-gray-100 last:border-0 w-full">
          <span class="text-gray-600 truncate mr-2">${i.name} (${i.qty} ${i.unit})</span>
          <span class="font-bold text-gray-800 shrink-0">${i.total.toLocaleString()}</span>
        </div>
      `).join('');
      return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 w-full overflow-hidden">
          <div class="p-4 flex justify-between items-center bg-gray-50/50" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');">
            <div>
              <div class="font-bold text-gray-800 tracking-wide">${h.date}</div>
              <div class="text-[10px] text-blue-500 font-semibold mt-0.5">Батафсил 🔽</div>
            </div>
            <div class="font-black text-red-500 text-lg">${h.grandTotal.toLocaleString()}</div>
          </div>
          <div class="hidden p-4 border-t w-full">
            <div class="mb-3 pb-3 border-b border-gray-100 w-full">${itemsList || '<div class="text-xs text-gray-400">Маҳсулот йўқ</div>'}</div>
            <div class="flex justify-between text-xs mb-1.5 w-full"><span class="text-gray-500">Ойлик:</span><span class="font-bold">${h.salary.toLocaleString()}</span></div>
            <div class="flex justify-between text-xs w-full"><span class="text-gray-500">Қўшимча:</span><span class="font-bold">${h.extra.toLocaleString()}</span></div>
          </div>
        </div>
      `;
    }).join('');
    tabContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest w-full">Тарих ва Ҳисоботлар</h4>${cards}`;
  }

  // ==========================================
  // ТАБ 3: МАҲСУЛОТЛАР
  // ==========================================
  function renderProductsTab() {
    const list = products.map(p => `
      <div class="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
        <div class="overflow-hidden pr-2">
          <div class="font-bold text-sm text-gray-800 truncate">${p.name}</div>
          <div class="text-[10px] text-gray-500 font-semibold">${p.price.toLocaleString()} сўм / ${p.unit}</div>
        </div>
        <button class="del-prod text-red-500 bg-red-50 p-2.5 rounded-xl active:scale-90 transition shrink-0" data-id="${p.id}">🗑</button>
      </div>
    `).join('');
    tabContent.innerHTML = `
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 mb-6 w-full">
        <h4 class="font-black text-sm mb-3 text-blue-900">Янги қўшиш</h4>
        <input type="text" id="pName" class="w-full border border-gray-200 p-3 mb-2 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Номи (мас: Гўшт)">
        <div class="flex space-x-2 mb-4 w-full">
          <input type="number" id="pPrice" class="w-2/3 border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Нархи">
          <select id="pUnit" class="w-1/3 border border-gray-200 p-3 rounded-xl text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
            <option value="кг">кг</option><option value="литр">литр</option><option value="дона">дона</option>
          </select>
        </div>
        <button id="addProdBtn" class="w-full bg-blue-50 text-blue-600 font-bold py-3.5 rounded-xl active:scale-95 transition">Базага қўшиш</button>
      </div>
      <h4 class="font-extrabold text-gray-400 mb-3 px-1 text-xs uppercase tracking-widest w-full">Мавжуд маҳсулотлар</h4>
      ${list || '<div class="text-center text-xs text-gray-400 py-4 w-full">Маҳсулотлар йўқ</div>'}
    `;
    
    document.querySelectorAll('.del-prod').forEach(btn => {
      btn.onclick = async () => { 
        haptic('medium');
        if(confirm("Ўчирасизми?")) { await deleteProduct(btn.dataset.id); loadTabContent(); } 
      }
    });
    
    document.getElementById("addProdBtn").onclick = async (e) => { 
      const name = document.getElementById("pName").value, price = document.getElementById("pPrice").value, unit = document.getElementById("pUnit").value; 
      if(name && price){ 
        haptic('light');
        e.target.textContent="⏳"; 
        await addProduct({ category: user.category, name, price: Number(price), unit }); 
        loadTabContent(); 
        tabContent.scrollTop = 0; 
      } 
    };
  }

  // ==========================================
  // ТАБ 4: ПРОФИЛ
  // ==========================================
  function renderProfileTab() {
    tabContent.innerHTML = `
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-5 text-center w-full">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-3">👤</div>
        <h2 class="font-black text-2xl text-gray-900 tracking-tight">${user.name}</h2>
        <p class="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">${user.category} бўлими</p>
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
        haptic('medium');
        e.target.textContent="⏳"; 
        await updateProfile(user.id, obj); 
        alert("Янгиланди!"); 
        document.getElementById("newPin").value=""; 
        e.target.textContent="Сақлаш"; 
      } 
    };
  }

  loadTabContent();
}

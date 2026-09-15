import { saveExpense, fetchProducts, addProduct, deleteProduct, fetchHistory, updateProfile } from "../api.js";

export function renderWorker(container, user, onLogout) {
  let activeTab = 'expense'; // expense, history, products, profile
  let products = [];
  let history = [];

  const tg = window.Telegram?.WebApp;

  // Ҳаяжон (вибрация) эффекти
  function haptic(type = 'light') {
    if (tg && tg.HapticFeedback) {
      if(type === 'success' || type === 'error') tg.HapticFeedback.notificationOccurred(type);
      else tg.HapticFeedback.impactOccurred(type);
    }
  }

  // Асосий қобиқ ва Пастки Навигация (Bottom Nav) - ТЎЛИҚ ЭКРАН (w-full)
  container.innerHTML = `
    <div class="bg-gray-50 min-h-screen flex flex-col pb-24 w-full">
      
      <!-- Сарлавҳа -->
      <div class="bg-white px-5 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10 w-full">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">${user.category}</span>
          <h3 class="font-black text-lg text-gray-900 mt-1.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition active:scale-90">Чиқиш</button>
      </div>

      <!-- Таб Контентлари (Динамик ўзгаради) -->
      <div id="tabContent" class="flex-1 p-4 transition-opacity duration-300 ease-in-out w-full"></div>

      <!-- Bottom Navigation Bar (ТЎЛИҚ ЭКРАН КЕНГЛИГИДА) -->
      <div class="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center pt-2 pb-5 px-2 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-20">
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-blue-600 transition-transform active:scale-90" data-tab="expense">
          <span class="text-xl mb-1">📝</span>
          <span class="text-[10px] font-bold">Харажат</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="history">
          <span class="text-xl mb-1">📊</span>
          <span class="text-[10px] font-bold">Ҳисобот</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="products">
          <span class="text-xl mb-1">📦</span>
          <span class="text-[10px] font-bold">Маҳсулот</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="profile">
          <span class="text-xl mb-1">⚙️</span>
          <span class="text-[10px] font-bold">Профил</span>
        </button>
      </div>
    </div>
  `;

  const tabContent = document.getElementById("tabContent");
  document.getElementById("logoutBtn").onclick = () => { haptic(); onLogout(); };

  // Навигация тугмалари мантиғи
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
      }, 150);
    };
  });

  // Табларни юклаш бошқарувчиси
  async function loadTabContent() {
    tabContent.innerHTML = `<div class="text-center py-10 w-full"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div><p class="text-xs text-gray-400 mt-3 font-bold">Юкланмоқда...</p></div>`;
    
    try {
      if (activeTab === 'expense') {
        const res = await fetchProducts(user.category);
        products = res.records || [];
        renderExpenseTab();
      } else if (activeTab === 'history') {
        const res = await fetchHistory(user.category);
        history = res.records || [];
        renderHistoryTab();
      } else if (activeTab === 'products') {
        const res = await fetchProducts(user.category);
        products = res.records || [];
        renderProductsTab();
      } else if (activeTab === 'profile') {
        renderProfileTab();
      }
    } catch (e) {
      tabContent.innerHTML = `<div class="text-center py-10 text-red-500 font-bold w-full">Маълумотларни юклаб бўлмади!</div>`;
    }
  }

  // ==========================================
  // ТАБ 1: ХАРАЖАТ ЯРАТИШ
  // ==========================================
  function renderExpenseTab() {
    if (products.length === 0) {
      tabContent.innerHTML = `<div class="text-center py-12 w-full bg-white rounded-3xl border border-gray-100 shadow-sm"><p class="text-gray-400 font-bold text-sm">Маҳсулотлар йўқ.<br>Олдин "Маҳсулот" бўлимидан қўшинг.</p></div>`;
      return;
    }

    const rows = products.map(p => `
      <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
        <div class="flex-1 pr-2">
          <div class="font-bold text-sm text-gray-800">${p.name}</div>
          <div class="text-[10px] text-gray-400">${p.price.toLocaleString()} сўм / ${p.unit}</div>
        </div>
        <div class="w-20">
          <input type="number" step="any" min="0" data-id="${p.id}" class="qty-input w-full border border-gray-200 rounded-xl p-2 text-center font-bold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0">
        </div>
        <div class="w-24 text-right">
          <span class="text-sm font-black text-blue-600 item-total" id="tot-${p.id}">0</span>
        </div>
      </div>
    `).join('');

    tabContent.innerHTML = `
      <div class="mb-2 flex text-[10px] font-bold text-gray-400 uppercase px-2 tracking-wider w-full">
        <div class="flex-1">Маҳсулот</div>
        <div class="w-20 text-center">Миқдор</div>
        <div class="w-24 text-right">Сумма</div>
      </div>
      <div class="mb-4 w-full">${rows}</div>
      
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4 w-full">
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Ходим ойлиги (сўм):</label>
        <input type="number" id="salaryInput" class="w-full border border-gray-200 rounded-xl p-3 mb-3 font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0">
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Қўшимча харажат (сўм):</label>
        <input type="number" id="extraInput" class="w-full border border-gray-200 rounded-xl p-3 font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0">
      </div>

      <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-lg mb-5 text-center w-full">
        <div class="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Умумий Жами</div>
        <div class="text-3xl font-black mt-1" id="grandTotal">0 сўм</div>
      </div>

      <button id="saveExpenseBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-transform">
        Харажатни Сақлаш
      </button>
    `;

    // Жонли ҳисоблаш
    const calc = () => {
      let sum = 0;
      document.querySelectorAll('.qty-input').forEach(input => {
        const p = products.find(x => x.id === input.dataset.id);
        const q = parseFloat(input.value) || 0;
        const tot = Math.round(q * p.price);
        document.getElementById(`tot-${p.id}`).textContent = tot.toLocaleString();
        sum += tot;
      });
      const sal = parseFloat(document.getElementById("salaryInput").value) || 0;
      const ext = parseFloat(document.getElementById("extraInput").value) || 0;
      document.getElementById("grandTotal").textContent = (sum + sal + ext).toLocaleString() + " сўм";
    };

    document.querySelectorAll('.qty-input').forEach(i => i.addEventListener('input', calc));
    document.getElementById("salaryInput").addEventListener('input', calc);
    document.getElementById("extraInput").addEventListener('input', calc);

    // Сақлаш
    document.getElementById("saveExpenseBtn").onclick = async (e) => {
      const btn = e.target;
      haptic('medium');
      btn.disabled = true; btn.textContent = "Сақланмоқда ⏳...";
      
      const items = [];
      document.querySelectorAll('.qty-input').forEach(input => {
        const q = parseFloat(input.value) || 0;
        if (q > 0) {
          const p = products.find(x => x.id === input.dataset.id);
          items.push({ name: p.name, qty: q, unit: p.unit, total: Math.round(q * p.price) });
        }
      });

      const sal = parseFloat(document.getElementById("salaryInput").value) || 0;
      const ext = parseFloat(document.getElementById("extraInput").value) || 0;
      const itemsSum = items.reduce((a, b) => a + b.total, 0);
      const grandTotal = itemsSum + sal + ext;

      if (grandTotal === 0) {
        haptic('error');
        alert("Ҳеч қандай харажат киритилмади!");
        btn.disabled = false; btn.textContent = "Харажатни Сақлаш"; return;
      }

      try {
        const res = await saveExpense({ category: user.category, worker: user.name, items, salary: sal, extra: ext, itemsSum, grandTotal });
        if (res.success) {
          haptic('success');
          alert("✅ Кунлик харажат муваффақиятли сақланди!");
          loadTabContent(); // Экранни тозалаш ва янгилаш
        } else {
          haptic('error');
          alert("Хатолик: " + res.message);
        }
      } catch (err) {
        haptic('error');
        alert("Сервер билан уланишда хатолик!");
      } finally {
        if(btn) { btn.disabled = false; btn.textContent = "Харажатни Сақлаш"; }
      }
    };
  }

  // ==========================================
  // ТАБ 2: ҲИСОБОТЛАР
  // ==========================================
  function renderHistoryTab() {
    if (history.length === 0) {
      tabContent.innerHTML = `<div class="text-center py-12 w-full bg-white rounded-3xl border border-gray-100 shadow-sm"><p class="text-gray-400 font-bold text-sm">Ҳисоботлар йўқ</p></div>`;
      return;
    }

    const cards = history.map(h => {
      const itemsList = (h.items || []).map(i => `
        <div class="flex justify-between items-center text-xs py-1.5 border-b border-gray-100 last:border-0 w-full">
          <span class="text-gray-600">${i.name} (${i.qty} ${i.unit})</span>
          <span class="font-bold text-gray-800">${i.total.toLocaleString()}</span>
        </div>
      `).join('');

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden w-full">
          <div class="p-4 cursor-pointer flex justify-between items-center bg-gray-50/30 hover:bg-gray-50 transition active:bg-gray-100" onclick="this.nextElementSibling.classList.toggle('hidden'); if(window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');">
            <div>
              <div class="font-bold text-gray-800 tracking-wide">${h.date}</div>
              <div class="text-[10px] text-blue-500 font-semibold mt-0.5">Батафсил 🔽</div>
            </div>
            <div class="text-right">
              <div class="font-black text-red-500 text-lg">${h.grandTotal.toLocaleString()} сўм</div>
            </div>
          </div>
          <!-- Очиладиган қисм -->
          <div class="hidden p-4 border-t border-gray-100 bg-white">
            <div class="mb-3 pb-3 border-b border-gray-100 w-full">
              <div class="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Ишлатилган маҳсулотлар</div>
              ${itemsList || '<div class="text-xs text-gray-400">Маҳсулот ишлатилмаган</div>'}
            </div>
            <div class="flex justify-between text-xs mb-1.5 w-full"><span class="text-gray-500">Ойлик:</span><span class="font-bold">${h.salary.toLocaleString()}</span></div>
            <div class="flex justify-between text-xs w-full"><span class="text-gray-500">Қўшимча харажат:</span><span class="font-bold">${h.extra.toLocaleString()}</span></div>
          </div>
        </div>
      `;
    }).join('');

    tabContent.innerHTML = `<h4 class="font-extrabold text-gray-400 mb-4 px-1 text-xs uppercase tracking-widest w-full">Тарих ва Ҳисоботлар</h4>${cards}`;
  }

  // ==========================================
  // ТАБ 3: МАҲСУЛОТЛАР (ҚЎШИШ/ЎЧИРИШ)
  // ==========================================
  function renderProductsTab() {
    const list = products.map(p => `
      <div class="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2 w-full">
        <div>
          <div class="font-bold text-sm text-gray-800">${p.name}</div>
          <div class="text-[10px] text-gray-500 font-semibold">${p.price.toLocaleString()} сўм / ${p.unit}</div>
        </div>
        <button class="del-prod text-red-500 bg-red-50 p-2.5 rounded-xl active:scale-90 transition" data-id="${p.id}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    `).join('');

    tabContent.innerHTML = `
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 mb-6 w-full">
        <h4 class="font-black text-sm mb-3 text-blue-900">Янги қўшиш</h4>
        <input type="text" id="pName" class="w-full border border-gray-200 rounded-xl p-3 mb-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Номи (масалан: Гўшт)">
        <div class="flex space-x-2 mb-4 w-full">
          <input type="number" id="pPrice" class="w-2/3 border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Нархи">
          <select id="pUnit" class="w-1/3 border border-gray-200 rounded-xl p-3 bg-gray-50 text-sm outline-none">
            <option value="кг">кг</option><option value="литр">литр</option><option value="дона">дона</option>
          </select>
        </div>
        <button id="addProdBtn" class="w-full bg-blue-50 text-blue-600 border border-blue-100 font-bold py-3.5 rounded-xl active:scale-95 transition-transform">Базага қўшиш</button>
      </div>
      
      <h4 class="font-extrabold text-gray-400 mb-3 px-1 text-xs uppercase tracking-widest w-full">Мавжуд маҳсулотлар</h4>
      ${list || '<div class="text-center text-xs text-gray-400 py-4 w-full">Маҳсулотлар йўқ</div>'}
    `;

    // Ўчириш
    document.querySelectorAll('.del-prod').forEach(btn => {
      btn.onclick = async () => {
        haptic('medium');
        if(confirm("Ҳақиқатан ўчирасизми? Буни орқага қайтариб бўлмайди.")) {
          btn.innerHTML = "⏳";
          await deleteProduct(btn.dataset.id);
          haptic('success');
          loadTabContent();
        }
      };
    });

    // Қўшиш
    document.getElementById("addProdBtn").onclick = async (e) => {
      haptic('light');
      const name = document.getElementById("pName").value;
      const price = document.getElementById("pPrice").value;
      const unit = document.getElementById("pUnit").value;
      
      if(!name || !price) {
        haptic('error');
        return alert("Илтимос, номи ва нархини тўлдиринг!");
      }
      
      e.target.disabled = true;
      e.target.textContent = "Қўшилмоқда ⏳...";
      await addProduct({ category: user.category, name, price: Number(price), unit });
      haptic('success');
      loadTabContent(); // Қайта юклаш
    };
  }

  // ==========================================
  // ТАБ 4: ПРОФИЛ ВА СОЗЛАМАЛАР
  // ==========================================
  function renderProfileTab() {
    tabContent.innerHTML = `
      <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-5 text-center w-full">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto text-4xl mb-3 shadow-sm border border-blue-100">👤</div>
        <h2 class="font-black text-2xl text-gray-900 tracking-tight">${user.name}</h2>
        <p class="text-[10px] text-gray-500 font-bold uppercase mt-1 tracking-widest">${user.category} бўлими</p>
      </div>

      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 w-full">
        <h4 class="font-bold text-sm mb-4 text-gray-800">Хавфсизлик ва Созламалар</h4>
        
        <label class="block text-xs font-bold text-gray-500 mb-1.5">Янги ПИН-код (4 та рақам):</label>
        <input type="number" id="newPin" class="w-full border border-gray-200 rounded-xl p-3.5 mb-4 bg-gray-50 font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Янги кодни киритинг">
        
        <label class="block text-xs font-bold text-gray-500 mb-1.5 flex justify-between w-full">
          <span>Telegram Chat ID:</span>
          <a href="https://t.me/userinfobot" target="_blank" class="text-blue-500">ID ни олиш</a>
        </label>
        <input type="number" id="newChatId" class="w-full border border-gray-200 rounded-xl p-3.5 mb-5 bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Масалан: 123456789" value="${user.chatId || ''}">
        
        <button id="updateProfileBtn" class="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 rounded-2xl active:scale-95 transition-transform shadow-md">
          Ўзгаришларни сақлаш
        </button>
      </div>
    `;

    document.getElementById("updateProfileBtn").onclick = async (e) => {
      haptic('medium');
      const pin = document.getElementById("newPin").value;
      const chatId = document.getElementById("newChatId").value;
      
      const payload = {};
      if(pin) {
        if(pin.length !== 4) return alert("ПИН-код 4 та рақамдан иборат бўлиши керак!");
        payload.pin = String(pin);
      }
      if(chatId) payload.chatId = String(chatId);

      if(Object.keys(payload).length === 0) return alert("Ҳеч қандай ўзгариш йўқ");

      e.target.disabled = true;
      e.target.textContent = "Сақланмоқда ⏳...";
      
      try {
        const res = await updateProfile(user.id, payload);
        if (res.success) {
          haptic('success');
          alert("✅ Профил муваффақиятли янгиланди!");
          document.getElementById("newPin").value = "";
        } else {
          haptic('error');
          alert("Хатолик юз берди!");
        }
      } catch (err) {
        alert("Сервер хатолиги!");
      } finally {
        e.target.disabled = false;
        e.target.textContent = "Ўзгаришларни сақлаш";
      }
    };
  }

  // Биринчи марта ишга тушириш
  loadTabContent();
}

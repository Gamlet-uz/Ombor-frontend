import { saveExpense, fetchProducts, addProduct, deleteProduct, fetchHistory, updateProfile } from "../api.js";

export function renderWorker(container, user, onLogout) {
  let activeTab = 'expense'; // expense, history, products, profile
  let products = [];
  let history = [];

  // Asosiy qobiq va Bottom Nav
  container.innerHTML = `
    <div class="bg-gray-50 min-h-screen flex flex-col pb-20">
      
      <!-- Sarlavha -->
      <div class="bg-white px-5 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <span class="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded-full">${user.category}</span>
          <h3 class="font-black text-lg text-gray-900 mt-1">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 px-3 py-1.5 rounded-xl">Chiqish</button>
      </div>

      <!-- Tab Kontentlari (Dinamik o'zgaradi) -->
      <div id="tabContent" class="flex-1 p-4 transition-opacity duration-300 ease-in-out">
        <div class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
      </div>

      <!-- Bottom Navigation Bar -->
      <div class="fixed bottom-0 w-full max-w-sm bg-white border-t border-gray-200 flex justify-around items-center pb-safe pt-2 px-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-blue-600 transition-transform active:scale-90" data-tab="expense">
          <span class="text-xl mb-1">📝</span>
          <span class="text-[10px] font-bold">Xarajat</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="history">
          <span class="text-xl mb-1">📊</span>
          <span class="text-[10px] font-bold">Hisobot</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="products">
          <span class="text-xl mb-1">📦</span>
          <span class="text-[10px] font-bold">Mahsulot</span>
        </button>
        <button class="nav-btn flex flex-col items-center p-2 w-1/4 text-gray-400 transition-transform active:scale-90" data-tab="profile">
          <span class="text-xl mb-1">⚙️</span>
          <span class="text-[10px] font-bold">Profil</span>
        </button>
      </div>
    </div>
  `;

  const tabContent = document.getElementById("tabContent");
  document.getElementById("logoutBtn").onclick = onLogout;

  // Navigatsiya tugmalari logikasi
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn").forEach(b => {
        b.classList.remove("text-blue-600");
        b.classList.add("text-gray-400");
      });
      btn.classList.remove("text-gray-400");
      btn.classList.add("text-blue-600");
      
      activeTab = btn.getAttribute("data-tab");
      
      // Animatsiya uchun
      tabContent.style.opacity = 0;
      setTimeout(() => {
        loadTabContent();
        tabContent.style.opacity = 1;
      }, 150);
    };
  });

  // Tablarni yuklash boshqaruvchisi
  async function loadTabContent() {
    tabContent.innerHTML = `<div class="text-center py-10"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>`;
    
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
  }

  // ==========================================
  // TAB 1: XARAJAT YARATISH
  // ==========================================
  function renderExpenseTab() {
    if (products.length === 0) {
      tabContent.innerHTML = `<div class="text-center py-10 text-gray-400 font-bold">Mahsulotlar yo'q. Oldin mahsulot qo'shing.</div>`;
      return;
    }

    const rows = products.map(p => `
      <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div class="flex-1 pr-2">
          <div class="font-bold text-sm text-gray-800">${p.name}</div>
          <div class="text-[10px] text-gray-400">${p.price.toLocaleString()} so'm / ${p.unit}</div>
        </div>
        <div class="w-20">
          <input type="number" step="any" min="0" data-id="${p.id}" class="qty-input w-full border border-gray-200 rounded-xl p-2 text-center font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="0">
        </div>
        <div class="w-24 text-right">
          <span class="text-sm font-black text-blue-600 item-total" id="tot-${p.id}">0</span>
        </div>
      </div>
    `).join('');

    tabContent.innerHTML = `
      <div class="mb-2 flex text-[10px] font-bold text-gray-400 uppercase px-2">
        <div class="flex-1">Mahsulot</div>
        <div class="w-20 text-center">Miqdor</div>
        <div class="w-24 text-right">Summa</div>
      </div>
      <div class="mb-4">${rows}</div>
      
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-4">
        <label class="block text-xs font-bold text-gray-500 mb-1">Xodim oyligi (so'm):</label>
        <input type="number" id="salaryInput" class="w-full border rounded-xl p-3 mb-3 font-bold bg-gray-50" placeholder="0">
        <label class="block text-xs font-bold text-gray-500 mb-1">Qo'shimcha rasxod:</label>
        <input type="number" id="extraInput" class="w-full border rounded-xl p-3 font-bold bg-gray-50" placeholder="0">
      </div>

      <div class="bg-slate-900 text-white rounded-3xl p-5 shadow-lg mb-5">
        <div class="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-1">Umumiy Jami</div>
        <div class="text-3xl font-black" id="grandTotal">0 so'm</div>
      </div>

      <button id="saveExpenseBtn" class="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">Saqlash</button>
    `;

    // Jonli hisoblash
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
      document.getElementById("grandTotal").textContent = (sum + sal + ext).toLocaleString() + " so'm";
    };

    document.querySelectorAll('.qty-input').forEach(i => i.addEventListener('input', calc));
    document.getElementById("salaryInput").addEventListener('input', calc);
    document.getElementById("extraInput").addEventListener('input', calc);

    // Saqlash
    document.getElementById("saveExpenseBtn").onclick = async (e) => {
      const btn = e.target;
      btn.disabled = true; btn.textContent = "Saqlanmoqda...";
      
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
        alert("Xarajat kiritilmadi!");
        btn.disabled = false; btn.textContent = "Saqlash"; return;
      }

      const res = await saveExpense({ category: user.category, worker: user.name, items, salary: sal, extra: ext, itemsSum, grandTotal });
      if (res.success) {
        alert("Saqlandi!");
        loadTabContent(); // Ekranni tozalash
      } else alert("Xato!");
    };
  }

  // ==========================================
  // TAB 2: HISOBOTLAR
  // ==========================================
  function renderHistoryTab() {
    if (history.length === 0) {
      tabContent.innerHTML = `<div class="text-center py-10 text-gray-400 font-bold">Hisobotlar yo'q</div>`;
      return;
    }

    const cards = history.map(h => {
      const itemsList = (h.items || []).map(i => `
        <div class="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
          <span class="text-gray-600">${i.name} (${i.qty}${i.unit})</span>
          <span class="font-bold text-gray-800">${i.total.toLocaleString()}</span>
        </div>
      `).join('');

      return `
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-3 overflow-hidden">
          <div class="p-4 cursor-pointer flex justify-between items-center" onclick="this.nextElementSibling.classList.toggle('hidden')">
            <div>
              <div class="font-bold text-gray-800">${h.date}</div>
              <div class="text-[10px] text-gray-400">Tafsilotlarni ko'rish 🔽</div>
            </div>
            <div class="text-right">
              <div class="font-black text-emerald-600">${h.grandTotal.toLocaleString()} so'm</div>
            </div>
          </div>
          <!-- Ochiladigan qism -->
          <div class="hidden bg-gray-50 p-4 border-t border-gray-100">
            <div class="mb-2 pb-2 border-b border-gray-200">
              <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Ishlatilgan mahsulotlar</div>
              ${itemsList || '<div class="text-xs text-gray-400">Mahsulot ishlatilmagan</div>'}
            </div>
            <div class="flex justify-between text-xs mb-1"><span class="text-gray-500">Oylik:</span><span class="font-bold">${h.salary.toLocaleString()}</span></div>
            <div class="flex justify-between text-xs"><span class="text-gray-500">Qo'shimcha:</span><span class="font-bold">${h.extra.toLocaleString()}</span></div>
          </div>
        </div>
      `;
    }).join('');

    tabContent.innerHTML = `<h4 class="font-extrabold text-gray-800 mb-4 px-1">Tarix va Hisobotlar</h4>${cards}`;
  }

  // ==========================================
  // TAB 3: MAHSULOTLAR (QO'SHISH/O'CHIRISH)
  // ==========================================
  function renderProductsTab() {
    const list = products.map(p => `
      <div class="flex justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div>
          <div class="font-bold text-sm text-gray-800">${p.name}</div>
          <div class="text-[10px] text-gray-500 font-semibold">${p.price.toLocaleString()} so'm / ${p.unit}</div>
        </div>
        <button class="del-prod text-red-500 bg-red-50 p-2 rounded-xl active:scale-90 transition" data-id="${p.id}">🗑</button>
      </div>
    `).join('');

    tabContent.innerHTML = `
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-blue-100 mb-5">
        <h4 class="font-black text-sm mb-3 text-blue-900">Yangi qo'shish</h4>
        <input type="text" id="pName" class="w-full border rounded-xl p-3 mb-2 bg-gray-50 text-sm" placeholder="Nomi (masalan: Go'sht)">
        <div class="flex space-x-2 mb-3">
          <input type="number" id="pPrice" class="w-2/3 border rounded-xl p-3 bg-gray-50 text-sm" placeholder="Narxi">
          <select id="pUnit" class="w-1/3 border rounded-xl p-3 bg-gray-50 text-sm">
            <option value="kg">kg</option><option value="litr">litr</option><option value="dona">dona</option>
          </select>
        </div>
        <button id="addProdBtn" class="w-full bg-blue-100 text-blue-700 font-bold py-3 rounded-xl active:scale-95 transition">Bazaga qo'shish</button>
      </div>
      <h4 class="font-extrabold text-gray-800 mb-3 px-1">Mavjud mahsulotlar</h4>
      ${list || '<div class="text-center text-xs text-gray-400">Mahsulotlar yo\'q</div>'}
    `;

    // O'chirish
    document.querySelectorAll('.del-prod').forEach(btn => {
      btn.onclick = async () => {
        if(confirm("Haqiqatan o'chirasizmi?")) {
          btn.innerHTML = "⏳";
          await deleteProduct(btn.dataset.id);
          loadTabContent(); // Qayta yuklash
        }
      };
    });

    // Qo'shish
    document.getElementById("addProdBtn").onclick = async (e) => {
      const name = document.getElementById("pName").value;
      const price = document.getElementById("pPrice").value;
      const unit = document.getElementById("pUnit").value;
      if(!name || !price) return alert("To'ldiring!");
      
      e.target.textContent = "Qo'shilmoqda...";
      await addProduct({ category: user.category, name, price: Number(price), unit });
      loadTabContent(); // Qayta yuklash
    };
  }

  // ==========================================
  // TAB 4: PROFIL
  // ==========================================
  function renderProfileTab() {
    tabContent.innerHTML = `
      <div class="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4 text-center">
        <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-2">👤</div>
        <h2 class="font-black text-xl text-gray-900">${user.name}</h2>
        <p class="text-xs text-gray-500 font-bold uppercase">${user.category} bo'limi</p>
      </div>

      <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
        <h4 class="font-bold text-sm mb-3">Sozlamalar</h4>
        
        <label class="block text-xs font-bold text-gray-500 mb-1">Yangi PIN-kod (4 ta raqam):</label>
        <input type="number" id="newPin" class="w-full border rounded-xl p-3 mb-3 bg-gray-50 font-bold" placeholder="Yangi kodni kiriting">
        
        <label class="block text-xs font-bold text-gray-500 mb-1">Bildirishnoma uchun Chat ID:</label>
        <input type="number" id="newChatId" class="w-full border rounded-xl p-3 mb-4 bg-gray-50" placeholder="Masalan: 12345678" value="${user.chatId || ''}">
        
        <button id="updateProfileBtn" class="w-full bg-gray-800 text-white font-bold py-3 rounded-xl active:scale-95 transition">Saqlash</button>
      </div>
    `;

    document.getElementById("updateProfileBtn").onclick = async (e) => {
      const pin = document.getElementById("newPin").value;
      const chatId = document.getElementById("newChatId").value;
      
      const payload = {};
      if(pin) payload.pin = String(pin);
      if(chatId) payload.chatId = String(chatId);

      if(Object.keys(payload).length === 0) return alert("O'zgarish yo'q");

      e.target.textContent = "Saqlanmoqda...";
      const res = await updateProfile(user.id, payload); // Backenddan user.id kelishi shart
      if (res.success) {
        alert("Profil yangilandi!");
        e.target.textContent = "Saqlash";
      } else {
        alert("Xatolik!");
      }
    };
  }

  // Boshlang'ich yuklash
  loadTabContent();
}

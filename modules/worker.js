import { saveExpense } from "../api.js";

// Vaqtincha lokal mahsulotlar (Backend ulanmaguncha ishlashi uchun)
let localProducts = [
  { id: "1", name: "Kartoshka", unit: "kg", price: 6000 },
  { id: "2", name: "Mol go'shti", unit: "kg", price: 95000 }
];
let localHistory = [];

export function renderWorker(container, user, onLogout) {
  let activeTab = 'create'; // 'create' yoki 'history'

  function render() {
    container.innerHTML = `
      <div class="bg-gray-50 min-h-screen pb-20">
        <!-- Yuqori qism (Header) -->
        <div class="bg-white px-5 py-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
          <div>
            <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">${user.category}</span>
            <h3 class="font-black text-lg text-gray-900 mt-1">${user.name}</h3>
          </div>
          <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition">Chiqish</button>
        </div>

        <!-- Tablar (Menyu) -->
        <div class="flex bg-white border-b border-gray-200">
          <button id="tabCreate" class="flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}">
            📝 Xarajat yaratish
          </button>
          <button id="tabHistory" class="flex-1 py-3 text-sm font-bold text-center border-b-2 transition ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}">
            📊 Ma'lumotlar
          </button>
        </div>

        <!-- Asosiy Konteyner -->
        <div class="p-4" id="mainContent">
          ${activeTab === 'create' ? renderCreateTab() : renderHistoryTab()}
        </div>

        <!-- Yangi Mahsulot Qo'shish Modali (Yashirin) -->
        <div id="newProductModal" class="hidden fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 class="font-black text-lg mb-4">Yangi mahsulot qo'shish</h3>
            
            <label class="block text-xs font-bold text-gray-500 mb-1">Mahsulot nomi:</label>
            <input type="text" id="newProdName" class="w-full border rounded-xl p-3 mb-3 bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="Masalan: Qaymoq">
            
            <label class="block text-xs font-bold text-gray-500 mb-1">O'lchov birligi:</label>
            <select id="newProdUnit" class="w-full border rounded-xl p-3 mb-3 bg-gray-50">
              <option value="kg">kg</option>
              <option value="litr">litr</option>
              <option value="dona">dona</option>
              <option value="pachka">pachka</option>
            </select>
            
            <label class="block text-xs font-bold text-gray-500 mb-1">Narxi (so'm):</label>
            <input type="number" id="newProdPrice" class="w-full border rounded-xl p-3 mb-5 bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="Masalan: 45000">
            
            <div class="flex space-x-2">
              <button id="closeModalBtn" class="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl">Bekor qilish</button>
              <button id="saveProdBtn" class="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl">Saqlash</button>
            </div>
          </div>
        </div>
      </div>
    `;

    bindEvents();
  }

  // 1-Tab: Xarajat Yaratish
  function renderCreateTab() {
    let tableRows = localProducts.map(p => `
      <div class="flex items-center justify-between bg-white p-3 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div class="flex-1">
          <div class="font-bold text-sm text-gray-800">${p.name}</div>
          <div class="text-[10px] text-gray-400">${p.price.toLocaleString()} so'm / ${p.unit}</div>
        </div>
        <div class="w-24 px-2">
          <input type="number" step="any" min="0" data-id="${p.id}" class="qty-input w-full border border-gray-200 rounded-xl p-2 text-center font-bold bg-gray-50 focus:ring-2 focus:ring-blue-500" placeholder="0">
        </div>
        <div class="w-24 text-right">
          <span class="text-sm font-black text-blue-600 item-total" id="total-${p.id}">0</span>
          <span class="text-[10px] text-gray-500">so'm</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="flex justify-between items-center mb-4">
        <h4 class="font-extrabold text-gray-800">Mahsulotlar ro'yxati</h4>
        <button id="openModalBtn" class="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg">+ Yangi</button>
      </div>
      
      <div class="mb-6">
        <!-- Sarlavhalar -->
        <div class="flex text-[10px] font-bold text-gray-400 uppercase px-2 mb-2">
          <div class="flex-1">Nomi & Narxi</div>
          <div class="w-24 text-center">Miqdori</div>
          <div class="w-24 text-right">Jami summa</div>
        </div>
        <!-- Mahsulotlar -->
        ${tableRows}
      </div>

      <!-- Qoshimcha rasxodlar -->
      <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-5">
        <label class="block text-xs font-bold text-gray-500 mb-1">Xodim oyligi (so'm):</label>
        <input type="number" id="salaryInput" class="w-full border rounded-xl p-3 mb-3 bg-gray-50 font-bold" placeholder="0">

        <label class="block text-xs font-bold text-gray-500 mb-1">Boshqa qo'shimcha rasxod (so'm):</label>
        <input type="number" id="extraInput" class="w-full border rounded-xl p-3 bg-gray-50 font-bold" placeholder="0">
      </div>

      <!-- Umumiy jami -->
      <div class="bg-slate-900 text-white rounded-3xl p-5 shadow-lg mb-5">
        <div class="flex justify-between items-end">
          <div>
            <div class="text-[11px] text-slate-400 font-bold mb-1">Mahsulotlar: <span id="itemsSum" class="text-white">0</span></div>
            <div class="text-[11px] text-slate-400 font-bold">Oylik + Boshqa: <span id="extraSum" class="text-white">0</span></div>
          </div>
          <div class="text-right">
            <div class="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Umumiy Rasxod</div>
            <div class="text-2xl font-black" id="grandTotal">0</div>
          </div>
        </div>
      </div>

      <button id="submitExpenseBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition">
        Kunlik rasxodni saqlash
      </button>
    `;
  }

  // 2-Tab: Ma'lumotlar (Tarix)
  function renderHistoryTab() {
    if (localHistory.length === 0) {
      return `<div class="text-center py-10 text-gray-400 font-bold text-sm">Hali hech qanday ma'lumot yo'q</div>`;
    }

    return localHistory.map(h => `
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-3">
        <div class="flex justify-between items-center mb-2 border-b pb-2">
          <span class="font-bold text-gray-800">${h.date}</span>
          <span class="font-black text-emerald-600">${h.grandTotal.toLocaleString()} so'm</span>
        </div>
        <div class="text-xs text-gray-500">Mahsulotlar: ${h.itemsSum.toLocaleString()} so'm</div>
        <div class="text-xs text-gray-500">Oylik va Boshqa: ${(h.salary + h.extra).toLocaleString()} so'm</div>
      </div>
    `).join('');
  }

  // Voqealar va Hisob-kitoblar
  function bindEvents() {
    // Tab almashish
    document.getElementById("tabCreate").onclick = () => { activeTab = 'create'; render(); };
    document.getElementById("tabHistory").onclick = () => { activeTab = 'history'; render(); };
    document.getElementById("logoutBtn").onclick = onLogout;

    if (activeTab === 'create') {
      const qtyInputs = document.querySelectorAll('.qty-input');
      const salaryInput = document.getElementById("salaryInput");
      const extraInput = document.getElementById("extraInput");
      
      // Real vaqtda hisoblash
      const calculateGrandTotal = () => {
        let itemsTotal = 0;
        qtyInputs.forEach(input => {
          const qty = parseFloat(input.value) || 0;
          const prodId = input.getAttribute('data-id');
          const prod = localProducts.find(p => p.id === prodId);
          const rowTotal = Math.round(qty * prod.price);
          
          document.getElementById(`total-${prodId}`).textContent = rowTotal.toLocaleString();
          itemsTotal += rowTotal;
        });

        const salary = parseFloat(salaryInput.value) || 0;
        const extra = parseFloat(extraInput.value) || 0;
        const extraTotal = salary + extra;
        const grandTotal = itemsTotal + extraTotal;

        document.getElementById("itemsSum").textContent = itemsTotal.toLocaleString();
        document.getElementById("extraSum").textContent = extraTotal.toLocaleString();
        document.getElementById("grandTotal").textContent = grandTotal.toLocaleString();
      };

      qtyInputs.forEach(input => input.addEventListener("input", calculateGrandTotal));
      salaryInput.addEventListener("input", calculateGrandTotal);
      extraInput.addEventListener("input", calculateGrandTotal);

      // Modal boshqaruvi
      const modal = document.getElementById("newProductModal");
      document.getElementById("openModalBtn").onclick = () => modal.classList.remove("hidden");
      document.getElementById("closeModalBtn").onclick = () => modal.classList.add("hidden");

      // Yangi mahsulotni saqlash
      document.getElementById("saveProdBtn").onclick = () => {
        const name = document.getElementById("newProdName").value;
        const unit = document.getElementById("newProdUnit").value;
        const price = parseFloat(document.getElementById("newProdPrice").value);

        if (!name || !price) return alert("Barcha maydonlarni to'ldiring!");

        localProducts.push({
          id: Date.now().toString(),
          name, unit, price
        });
        
        modal.classList.add("hidden");
        render(); // Ekranni yangilash
      };

      // Xarajatni jo'natish
      document.getElementById("submitExpenseBtn").onclick = async () => {
        const usedItems = [];
        qtyInputs.forEach(input => {
          const qty = parseFloat(input.value) || 0;
          if (qty > 0) {
            const prod = localProducts.find(p => p.id === input.getAttribute('data-id'));
            usedItems.push({
              name: prod.name,
              qty: qty,
              unit: prod.unit,
              total: Math.round(qty * prod.price)
            });
          }
        });

        const salary = parseFloat(salaryInput.value) || 0;
        const extra = parseFloat(extraInput.value) || 0;
        const itemsSum = usedItems.reduce((acc, item) => acc + item.total, 0);
        const grandTotal = itemsSum + salary + extra;

        if (grandTotal === 0) return alert("Hech qanday xarajat kiritilmadi!");

        const payload = {
          category: user.category,
          worker: user.name,
          items: usedItems,
          salary,
          extra,
          itemsSum,
          grandTotal,
          date: new Date().toLocaleDateString()
        };

        // TODO: API ga yuborish (saveExpense)
        // Hozircha lokal tarixga saqlaymiz
        localHistory.unshift(payload);
        alert("✅ Kunlik xarajat muvaffaqiyatli saqlandi!");
        render();
      };
    }
  }

  // Boshlang'ich render
  render();
}

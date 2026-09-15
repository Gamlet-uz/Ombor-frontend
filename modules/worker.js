import { saveExpense } from "../api.js";

// BARCHA BO'LIMLAR MAHSULOTLARI BAZASI
const inventory = {
  "Ovqat": [
    { id: "ov_1", name: "Kartoshka", unit: "kg", price: 6000 },
    { id: "ov_2", name: "Piyoz", unit: "kg", price: 4000 },
    { id: "ov_3", name: "O'simlik yog'i", unit: "litr", price: 16000 },
    { id: "ov_4", name: "Guruch (Lazer)", unit: "kg", price: 24000 },
    { id: "ov_5", name: "Sabzi", unit: "kg", price: 5000 },
    { id: "ov_6", name: "Mol go'shti (lahm)", unit: "kg", price: 95000 }
  ],
  "Somsa": [
    { id: "so_1", name: "Un (Oliy nav)", unit: "kg", price: 7500 },
    { id: "so_2", name: "Mol go'shti (qiyma)", unit: "kg", price: 95000 },
    { id: "so_3", name: "Dumba yog'i", unit: "kg", price: 90000 },
    { id: "so_4", name: "Margarina", unit: "dona", price: 11000 },
    { id: "so_5", name: "Kunjut", unit: "kg", price: 40000 }
  ],
  "Shashlik": [
    { id: "sh_1", name: "Mol go'shti (lahm)", unit: "kg", price: 100000 },
    { id: "sh_2", name: "Qo'y go'shti", unit: "kg", price: 115000 },
    { id: "sh_3", name: "Qiyma dumba", unit: "kg", price: 90000 },
    { id: "sh_4", name: "Zira va ziravorlar", unit: "pachka", price: 12000 },
    { id: "sh_5", name: "Sirka (9%)", unit: "litr", price: 8000 }
  ],
  "Fast food": [
    { id: "ff_1", name: "Lavash xamiri", unit: "dona", price: 2500 },
    { id: "ff_2", name: "Tovuq filesi", unit: "kg", price: 46000 },
    { id: "ff_3", name: "Burger bulochkasi", unit: "dona", price: 3000 },
    { id: "ff_4", name: "Pishloq (Mozzarella)", unit: "kg", price: 78000 },
    { id: "ff_5", name: "Sous / Mayonez", unit: "kg", price: 22000 }
  ]
};

// UMUMIY RENDER FUNKSIYASI
export function renderWorker(container, user, onLogout) {
  const category = user.category;
  const prodList = inventory[category] || [];

  if (prodList.length === 0) {
    container.innerHTML = `<div class="p-5 text-center text-red-500 font-bold">Bu bo'lim uchun mahsulotlar topilmadi.</div>`;
    return;
  }

  const optionsHtml = prodList.map(p => `
    <option value="${p.id}">${p.name} (${p.price.toLocaleString()} so'm)</option>
  `).join('');

  container.innerHTML = `
    <div class="bg-white rounded-3xl shadow-lg p-5">
      <div class="flex justify-between items-center border-b pb-3 mb-4">
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            ${category}
          </span>
          <h3 class="font-black text-lg text-gray-900 mt-1.5">${user.name}</h3>
        </div>
        <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition">
          Chiqish
        </button>
      </div>

      <div class="mb-4">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mahsulotni tanlang:</label>
        <select id="prodSelect" class="w-full border border-gray-200 rounded-2xl p-3.5 bg-gray-50 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
          ${optionsHtml}
        </select>
      </div>

      <div class="mb-5">
        <label class="block text-xs font-bold text-gray-500 uppercase mb-1.5">
          Miqdori (<span id="unitLabel" class="text-blue-600 font-extrabold">${prodList[0].unit}</span>):
        </label>
        <input type="number" step="any" id="qtyInput" placeholder="Masalan: 1.5" 
               class="w-full border border-gray-200 rounded-2xl p-3.5 text-xl font-bold bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>

      <div class="bg-blue-50/70 rounded-2xl p-4 mb-5 border border-blue-100">
        <div class="flex justify-between text-xs text-gray-500 font-medium">
          <span>1 birlik narxi:</span>
          <span id="unitPriceText" class="font-bold text-gray-700">${prodList[0].price.toLocaleString()} so'm</span>
        </div>
        <div class="flex justify-between items-center mt-2.5 pt-2.5 border-t border-blue-200/60">
          <span class="text-sm font-bold text-blue-950">Jami summa:</span>
          <span id="totalPriceText" class="text-2xl font-black text-blue-600">0 so'm</span>
        </div>
      </div>

      <button id="saveBtn" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-md active:scale-95 transition-all">
        Rasxodga kiritish
      </button>
    </div>
  `;

  // Funksionallikni ulash
  const select = container.querySelector("#prodSelect");
  const qtyInput = container.querySelector("#qtyInput");
  const unitLabel = container.querySelector("#unitLabel");
  const unitPriceText = container.querySelector("#unitPriceText");
  const totalPriceText = container.querySelector("#totalPriceText");
  const saveBtn = container.querySelector("#saveBtn");

  function calc() {
    const prod = prodList.find(p => p.id === select.value);
    const qty = parseFloat(qtyInput.value) || 0;
    unitLabel.textContent = prod.unit;
    unitPriceText.textContent = `${prod.price.toLocaleString()} so'm`;
    totalPriceText.textContent = `${Math.round(qty * prod.price).toLocaleString()} so'm`;
  }

  select.addEventListener("change", calc);
  qtyInput.addEventListener("input", calc);
  container.querySelector("#logoutBtn").addEventListener("click", onLogout);

  saveBtn.addEventListener("click", async () => {
    const prod = prodList.find(p => p.id === select.value);
    const qty = parseFloat(qtyInput.value);

    if (!qty || qty <= 0) {
      alert("Iltimos, mahsulot miqdorini to'g'ri kiriting!");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saqlanmoqda⏳...";

    const total = Math.round(qty * prod.price);

    try {
      const res = await saveExpense({
        category,
        worker: user.name,
        productName: prod.name,
        quantity: qty,
        unit: prod.unit,
        unitPrice: prod.price,
        totalAmount: total
      });

      if (res.success) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
        }
        alert(`✅ Qabul qilindi!\n${prod.name}: ${qty} ${prod.unit} — ${total.toLocaleString()} so'm`);
        qtyInput.value = "";
        calc();
      } else {
        alert("Xatolik yuz berdi: " + res.message);
      }
    } catch (e) {
      alert("Server bilan aloqa uzildi!");
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Rasxodga kiritish";
    }
  });
}

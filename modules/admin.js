import { fetchTodayExpenses } from "../api.js";

export async function renderAdmin(container, user, onLogout) {
  // Ma'lumotlar kelguncha yuklanish (loading) ekrani
  container.innerHTML = `
    <div class="bg-white rounded-3xl shadow-sm p-8 text-center mt-4">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p class="text-gray-500 font-bold text-sm">Ma'lumotlar yuklanmoqda...</p>
    </div>
  `;

  try {
    // API dan bugungi rasxodlarni so'rash
    const res = await fetchTodayExpenses();
    
    if (!res.success) {
      throw new Error(res.message || "Noma'lum xatolik");
    }

    const records = res.records || [];

    // Kategoriyalar bo'yicha va jami summalarni hisoblash
    const categories = ["Ovqat", "Somsa", "Shashlik", "Fast food"];
    const catTotals = { "Ovqat": 0, "Somsa": 0, "Shashlik": 0, "Fast food": 0 };
    let grandTotal = 0;

    records.forEach(r => {
      // Agar kiritilgan kategoriya bizning ro'yxatda bo'lsa unga qo'shamiz
      if (catTotals[r.category] !== undefined) {
         catTotals[r.category] += (r.totalAmount || 0);
      }
      grandTotal += (r.totalAmount || 0);
    });

    // 4 ta toifa uchun kichik summary kartochkalari
    const cardsHtml = categories.map(cat => `
      <div class="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 text-center">
        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">${cat}</span>
        <div class="text-sm font-black text-gray-900 mt-1">${catTotals[cat].toLocaleString()} so'm</div>
      </div>
    `).join('');

    // Har bir mahsulot rasxodi tarixini chizish
    const rowsHtml = records.length === 0 
      ? `<div class="text-center text-xs text-gray-400 py-8">Bugun hali hech qanday xarajat kiritilmadi</div>`
      : records.map(r => `
        <div class="flex justify-between items-center p-3 bg-gray-50/80 rounded-2xl border border-gray-100 mb-2">
          <div>
            <div class="font-bold text-sm text-gray-900">${r.productName}</div>
            <div class="text-xs text-gray-500 mt-0.5">
              <span class="font-bold text-blue-600">${r.category}</span> (${r.worker}) • ${r.quantity} ${r.unit}
            </div>
          </div>
          <div class="text-right">
            <div class="font-black text-sm text-emerald-600">+${(r.totalAmount || 0).toLocaleString()}</div>
          </div>
        </div>
      `).join('');

    // Asosiy Admin interfeysini ekranga chiqarish
    container.innerHTML = `
      <div class="space-y-4">
        <!-- Bosh qism -->
        <div class="bg-white rounded-3xl shadow-sm p-4 flex justify-between items-center">
          <div>
            <span class="text-[10px] bg-purple-100 text-purple-700 font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Admin Panel</span>
            <h3 class="text-lg font-black text-gray-900 mt-1.5">Bugungi xarajatlar</h3>
          </div>
          <button id="logoutBtn" class="text-xs text-red-500 font-bold bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition">Chiqish</button>
        </div>

        <!-- 4 ta toifa summasi -->
        <div class="grid grid-cols-2 gap-2">
          ${cardsHtml}
        </div>

        <!-- Katta qora karta - Jami summa -->
        <div class="bg-slate-900 text-white rounded-3xl p-6 shadow-lg text-center">
          <span class="text-[11px] uppercase tracking-widest text-slate-400 font-bold">Kunlik umumiy rasxod</span>
          <div class="text-3xl font-black mt-1 text-emerald-400">${grandTotal.toLocaleString()} so'm</div>
        </div>

        <!-- Yozuvlar ro'yxati bloki -->
        <div class="bg-white rounded-3xl shadow-sm p-5">
          <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
            <h4 class="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Barcha yozuvlar</h4>
            <span class="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">${records.length} ta yozuv</span>
          </div>
          <div class="max-h-72 overflow-y-auto pr-1">
            ${rowsHtml}
          </div>
        </div>
      </div>
    `;

    // Chiqish tugmasiga hodisa ulash
    container.querySelector("#logoutBtn").addEventListener("click", onLogout);

  } catch (err) {
    // Agar internet yo'q bo'lsa yoki API ishlamasa chiqadigan ekran
    container.innerHTML = `
      <div class="bg-white rounded-3xl p-6 text-center mt-4 shadow-sm border border-red-100">
        <div class="text-4xl mb-3">⚠️</div>
        <p class="text-red-500 font-bold mb-4 text-sm">${err.message || "Ma'lumotlarni yuklab bo'lmadi"}</p>
        <button id="logoutBtn" class="text-sm text-white font-bold bg-red-500 hover:bg-red-600 px-5 py-2.5 rounded-xl transition">Ortga qaytish</button>
      </div>
    `;
    container.querySelector("#logoutBtn").addEventListener("click", onLogout);
  }
}

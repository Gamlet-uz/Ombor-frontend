// Sizning Railway'dagi backend manzilingiz
const API_BASE_URL = "https://ombor-backend-production-4056.up.railway.app";

/**
 * 1. PIN-kod orqali xodimni avtorizatsiya qilish
 * @param {string} pin - Xodimning 4 xonali kodi
 */
export async function loginWithPin(pin) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ pin: String(pin) })
    });
    
    return await response.json();
  } catch (error) {
    console.error("Login xatoligi:", error);
    return { success: false, message: "Server bilan ulanishda xatolik yuz berdi" };
  }
}

/**
 * 2. Yangi xarajatni bazaga saqlash
 * @param {Object} payload - Mahsulot va miqdor ma'lumotlari
 */
export async function saveExpense(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/expenses`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(payload)
    });
    
    return await response.json();
  } catch (error) {
    console.error("Saqlash xatoligi:", error);
    return { success: false, message: "Ma'lumotni saqlashda xatolik yuz berdi" };
  }
}

/**
 * 3. Admin uchun bugungi barcha xarajatlarni yuklab olish
 */
export async function fetchTodayExpenses() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/expenses/today`);
    return await response.json();
  } catch (error) {
    console.error("Yuklash xatoligi:", error);
    return { success: false, message: "Ma'lumotlarni yuklab bo'lmadi" };
  }
}

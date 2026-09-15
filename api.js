const API_BASE_URL = "https://ombor-backend-production-4056.up.railway.app";

export async function loginWithPin(pin) {
  const res = await fetch(`${API_BASE_URL}/api/auth`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin: String(pin) })
  });
  return res.json();
}

export async function saveExpense(payload) {
  const res = await fetch(`${API_BASE_URL}/api/expenses`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  return res.json();
}

export async function fetchHistory(category) {
  const res = await fetch(`${API_BASE_URL}/api/expenses/history?category=${category}`);
  return res.json();
}

// MAHSULOTLAR UCHUN API
export async function fetchProducts(category) {
  const res = await fetch(`${API_BASE_URL}/api/products?category=${category}`);
  return res.json();
}

export async function addProduct(product) {
  const res = await fetch(`${API_BASE_URL}/api/products`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(product)
  });
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: "DELETE" });
  return res.json();
}

// PROFIL UCHUN API
export async function updateProfile(userId, data) {
  const res = await fetch(`${API_BASE_URL}/api/staff/${userId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  return res.json();
}

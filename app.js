import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://zwybiqrmqkiarbelgmzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eWJpcXJtcWtpYXJiZWxnbXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMzU0MzEsImV4cCI6MjEwMzcxMTQzMX0.k25NLgEtYQt-lgzNHwFC2dBc6Ey2c-8VTPzQQe2c6rc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- MENU SEED ---
const seedMenu = [
  { name: 'Jus d\'orange frais', price: 1000, category: 'jus', image: 'https://images.pexels.com/photos/33434017/pexels-photo-33434017.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Smoothie Dragon Fruit', price: 2000, category: 'jus', image: 'https://images.pexels.com/photos/34375012/pexels-photo-34375012.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Citronnade Menthe', price: 1000, category: 'jus', image: 'https://images.pexels.com/photos/10839495/pexels-photo-10839495.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Jus Cocktail Orange', price: 1500, category: 'jus', image: 'https://images.pexels.com/photos/15823268/pexels-photo-15823268.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Tacos Mixte', price: 2000, category: 'tacos', image: 'https://images.pexels.com/photos/28959271/pexels-photo-28959271.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Tacos Poulet', price: 1800, category: 'tacos', image: 'https://images.pexels.com/photos/9258712/pexels-photo-9258712.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Tacos Vegan', price: 2000, category: 'tacos', image: 'https://images.pexels.com/photos/27590338/pexels-photo-27590338.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Chawarma Poulet', price: 2000, category: 'chawarma', image: 'https://images.pexels.com/photos/29306501/pexels-photo-29306501.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Chawarma Wrap', price: 1800, category: 'chawarma', image: 'https://images.pexels.com/photos/29306495/pexels-photo-29306495.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
  { name: 'Chawarma + Frites', price: 2500, category: 'chawarma', image: 'https://images.pexels.com/photos/29306499/pexels-photo-29306499.jpeg?auto=compress&cs=tinysrgb&w=400', available: true },
];

let menu = [];
let cart = [];

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('fr-FR') + ' F';
const showToast = (msg) => { const t = $('toast') || document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); requestAnimationFrame(() => t.classList.add('show')); setTimeout(() => t.classList.remove('show'), 3000); };

// --- LOAD MENU ---
async function loadMenu() {
  const { data, error } = await supabase.from('menu').select('*').order('created_at', { ascending: true });
  if (data && data.length > 0) {
    menu = data;
    renderMenu('all');
  } else if (!error) {
    for (const item of seedMenu) {
      const { data: inserted } = await supabase.from('menu').insert(item).select();
      if (inserted) menu.push(...inserted);
    }
    renderMenu('all');
  } else {
    menu = seedMenu;
    renderMenu('all');
  }
}

// --- RENDER MENU ---
function renderMenu(category) {
  const grid = $('menuGrid');
  const items = category === 'all' ? menu : menu.filter((m) => m.category === category);
  if (items.length === 0) {
    grid.innerHTML = '<div class="loading">Aucun produit dans cette catégorie.</div>';
    return;
  }
  grid.innerHTML = items.map((item) => `
    <article class="menu-card">
      <img src="${item.image}" alt="${item.name}" class="menu-img" loading="lazy" />
      <div class="menu-card-body">
        <span class="menu-cat">${item.category}</span>
        <h3>${item.name}</h3>
        <div class="menu-card-bottom">
          <span class="menu-price">${fmt(item.price)}</span>
          <button class="add-btn" onclick="addToCart('${item.id}')" aria-label="Ajouter">+</button>
        </div>
      </div>
    </article>
  `).join('');
}

// --- CATEGORY TABS ---
document.querySelectorAll('.cat-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.cat-tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    renderMenu(tab.dataset.cat);
  });
});

// --- CART ---
window.addToCart = (id) => {
  const item = menu.find((m) => m.id === id);
  if (!item) return;
  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id, name: item.name, price: item.price, qty: 1 });
  }
  renderCart();
  showToast(`${item.name} ajouté au panier`);
};

window.changeQty = (id, delta) => {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  }
  renderCart();
};

window.removeFromCart = (id) => {
  cart = cart.filter((c) => c.id !== id);
  renderCart();
};

function renderCart() {
  const count = cart.reduce((s, c) => s + c.qty, 0);
  const total = cart.reduce((s, c) => s + c.qty * c.price, 0);
  $('cartCount').textContent = count;
  $('cartTotal').textContent = fmt(total);
  $('checkoutTotal').textContent = fmt(total);

  const itemsEl = $('cartItems');
  if (cart.length === 0) {
    itemsEl.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
    return;
  }
  itemsEl.innerHTML = cart.map((c) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <h4>${c.name}</h4>
        <span>${fmt(c.price)} × ${c.qty} = ${fmt(c.price * c.qty)}</span>
      </div>
      <div class="cart-qty">
        <button class="qty-btn" onclick="changeQty('${c.id}', -1)">−</button>
        <span>${c.qty}</span>
        <button class="qty-btn" onclick="changeQty('${c.id}', 1)">+</button>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${c.id}')">×</button>
    </div>
  `).join('');
}

window.toggleCart = () => {
  $('cartPanel').classList.toggle('open');
  $('cartChevron').classList.toggle('open');
};

// --- GENERATE TRACKING CODE ---
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  } while (false);
  return code;
}

async function generateUniqueCode() {
  for (let i = 0; i < 10; i++) {
    const code = generateCode();
    const { data } = await supabase.from('orders').select('id').eq('tracking_code', code).limit(1);
    if (!data || data.length === 0) return code;
  }
  return generateCode();
}

async function generateOrderNumber() {
  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  return `SJ-${String((count || 0) + 1).padStart(3, '0')}`;
}

// --- PLACE ORDER ---
window.placeOrder = async (event) => {
  event.preventDefault();
  if (cart.length === 0) {
    showToast('Votre panier est vide.');
    return;
  }
  const name = $('clientName').value.trim();
  const phone = $('clientPhone').value.trim();
  if (!name || !phone) return;

  const btn = $('orderBtn');
  btn.disabled = true;
  btn.textContent = 'Envoi en cours...';

  try {
    const code = await generateUniqueCode();
    const orderNum = await generateOrderNumber();
    const total = cart.reduce((s, c) => s + c.qty * c.price, 0);
    const items = cart.map((c) => ({ name: c.name, qty: c.qty, price: c.price }));

    const { error } = await supabase.from('orders').insert({
      tracking_code: code,
      order_number: orderNum,
      client_name: name,
      client_whatsapp: phone,
      items: items,
      total: total,
      status: 'new',
    });

    if (error) throw error;

    localStorage.setItem('lastOrderCode', code);
    window.location.href = `recu.html?code=${code}`;
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'COMMANDER →';
    showToast('Erreur lors de la commande. Réessayez.');
  }
};

// --- INIT ---
loadMenu();

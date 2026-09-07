import { db } from './firebase-config.js';
import { collection, onSnapshot, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let menuItems = [];
let cart = [];
let currentCategory = 'all';

const $ = (id) => document.getElementById(id);
const fmt = (n) => n.toLocaleString('fr-FR') + ' F';

// --- 1. CHARGEMENT DU MENU DEPUIS FIREBASE ---
function initMenu() {
  const menuRef = collection(db, "menu");

  onSnapshot(menuRef, (snapshot) => {
    menuItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderMenu();
  }, (error) => {
    console.error("Erreur de chargement du menu :", error);
    if ($('menuGrid')) $('menuGrid').innerHTML = '<div class="loading">Erreur de chargement du menu.</div>';
  });
}

// --- 2. AFFICHAGE DES CARTES DE MENU ---
function renderMenu() {
  const grid = $('menuGrid');
  if (!grid) return;

  const filtered = currentCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === currentCategory);

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="loading">Aucun produit disponible dans cette catégorie.</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => `
    <article class="menu-card">
      <img src="${item.image || 'https://via.placeholder.com/300'}" alt="${item.name}" class="menu-img" />
      <div class="menu-card-body">
        <div class="menu-cat">${item.category || ''}</div>
        <h3>${item.name || 'Sans nom'}</h3>
        <div class="menu-card-bottom">
          <span class="menu-price">${fmt(item.price || 0)}</span>
          <button class="add-btn" onclick="addToCart('${item.id}')">+</button>
        </div>
      </div>
    </article>
  `).join('');
}

// --- 3. GESTION DU PANIER ---

// Ajouter un article au panier
window.addToCart = (id) => {
  const product = menuItems.find(item => item.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      qty: 1
    });
  }

  updateCartUI();
  showToast(`${product.name} ajouté au panier !`);
};

// Modifier la quantité (+1 / -1)
window.updateQty = (id, delta) => {
  const item = cart.find(i => i.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    cart = cart.filter(i => i.id !== id);
  }

  updateCartUI();
};

// Mettre à jour l'affichage du panier (Compteur, Liste, Total)
function updateCartUI() {
  const totalCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  if ($('cartCount')) $('cartCount').textContent = totalCount;
  if ($('cartTotal')) $('cartTotal').textContent = fmt(totalPrice);
  if ($('checkoutTotal')) $('checkoutTotal').textContent = fmt(totalPrice);

  const cartItemsContainer = $('cartItems');
  if (cartItemsContainer) {
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty">Votre panier est vide.</p>';
    } else {
      cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <span>${fmt(item.price)} x ${item.qty} = ${fmt(item.price * item.qty)}</span>
          </div>
          <div class="cart-qty">
            <button class="qty-btn" onclick="updateQty('${item.id}', -1)">-</button>
            <span>${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
          </div>
        </div>
      `).join('');
    }
  }
}

// Ouvrir / Fermer le tiroir du panier
window.toggleCart = () => {
  const panel = $('cartPanel');
  const chevron = $('cartChevron');
  if (panel) panel.classList.toggle('open');
  if (chevron) chevron.classList.toggle('open');
};

// Notification Toast rapide
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// --- 4. ENVOI DE LA COMMANDE À FIREBASE ---
window.placeOrder = async (e) => {
  e.preventDefault();

  if (cart.length === 0) {
    alert("Votre panier est vide !");
    return;
  }

  const clientName = $('clientName').value.trim();
  const clientPhone = $('clientPhone').value.trim();
  const orderBtn = $('orderBtn');

  if (!clientName || !clientPhone) return;

  // Générer un code de suivi aléatoire à 4 chiffres (ex: SJ-4821)
  const trackingCode = 'SJ-' + Math.floor(1000 + Math.random() * 9000);
  const totalPrice = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const newOrder = {
    tracking_code: trackingCode,
    client_name: clientName,
    client_whatsapp: clientPhone,
    items: cart,
    total: totalPrice,
    status: 'new', // statut initial pour le panel admin
    created_at: new Date()
  };

  try {
    if (orderBtn) {
      orderBtn.disabled = true;
      orderBtn.textContent = 'CHARGEMENT...';
    }

    // Enregistrement dans la collection "orders" de Firebase
    await addDoc(collection(db, "orders"), newOrder);

    // Redirection vers le reçu / suivi
    sessionStorage.setItem('last_order_code', trackingCode);
    window.location.href = `suivre.html?code=${trackingCode}`;

  } catch (error) {
    console.error("Erreur lors de la commande :", error);
    alert("Une erreur est survenue lors de l'envoi de la commande.");
    if (orderBtn) {
      orderBtn.disabled = false;
      orderBtn.textContent = 'COMMANDER →';
    }
  }
};

// --- 5. INITIALISATION DES ÉVÉNEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  initMenu();

  // Gestion des filtres par catégorie
  const catTabs = $('catTabs');
  if (catTabs) {
    catTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('.cat-tab');
      if (!btn) return;

      document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentCategory = btn.dataset.cat;
      renderMenu();
    });
  }
});
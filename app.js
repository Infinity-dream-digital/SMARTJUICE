import { db } from './firebase-config.js';
import { collection, onSnapshot, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let menuItems = [];
let currentCategory = 'all';

// --- 1. ÉCOUTE ET CHARGEMENT DU MENU DEPUIS FIREBASE ---
function initMenu() {
  const menuRef = collection(db, "menu");

  // Écoute en temps réel de la collection "menu"
  onSnapshot(menuRef, (snapshot) => {
    menuItems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log("Plats récupérés depuis Firebase :", menuItems);
    renderMenu();
  }, (error) => {
    console.error("Erreur lors de la récupération du menu :", error);
    const grid = document.getElementById('menuGrid');
    if (grid) grid.innerHTML = '<div class="loading">Erreur de chargement du menu.</div>';
  });
}

// --- 2. AFFICHAGE DES CARTES SUR INDEX.HTML ---
function renderMenu() {
  const grid = document.getElementById('menuGrid');
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
          <span class="menu-price">${(item.price || 0).toLocaleString('fr-FR')} F</span>
          <button class="add-btn" onclick="addToCart('${item.id}')">+</button>
        </div>
      </div>
    </article>
  `).join('');
}

// --- 3. GESTION DES ONGLETS DE CATÉGORIES ---
document.addEventListener('DOMContentLoaded', () => {
  const catTabs = document.getElementById('catTabs');
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

// Démarrer l'écoute au chargement
initMenu();
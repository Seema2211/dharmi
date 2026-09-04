const CAT_META = {
  'Kulfi':       { emoji: '🍧', en: 'Kulfi',       gu: 'કુલ્ફી' },
  'Ice Cream':   { emoji: '🍦', en: 'Ice Cream',   gu: 'આઈસ્ક્રીમ' },
  'Lassi':       { emoji: '🥛', en: 'Lassi',       gu: 'લસ્સી' },
  'Family Pack': { emoji: '🧊', en: 'Family Pack', gu: 'કુટુંબ પેક' },
};

const SUBCAT_LABELS = {
  '500g': { en: '500g', gu: '500 ગ્રામ' },
  '1kg':  { en: '1kg',  gu: '1 કિલો' },
};

function catLabel(cat) {
  const meta = CAT_META[cat];
  return meta ? (currentLang === 'gu' ? meta.gu : meta.en) : cat;
}

function subcatLabel(sc) {
  const l = SUBCAT_LABELS[sc];
  return l ? (currentLang === 'gu' ? l.gu : l.en) : sc;
}

function itemName(mi) {
  if (currentLang === 'gu') return mi.nameGu || mi.name;
  return mi.subcategory ? mi.name.replace(` ${mi.subcategory}`, '') : mi.name;
}

let menu              = [];
let categoriesList    = [];
let order             = [];
let activeCategory    = '';
let activeSubcategory = '';

fetch('menu.json')
  .then(r => r.json())
  .then(data => {
    menu = data;
    categoriesList = [...new Set(data.map(i => i.category))];
    activeCategory = categoriesList[0];
    renderCategories(categoriesList);
    renderItems();
  });

function onLangChange() {
  if (!menu.length) return;
  renderCategories(categoriesList);
  renderItems();
  renderOrder();
}

/* ── Categories ── */
function renderCategories(categories) {
  document.getElementById('categories').innerHTML = categories.map(cat => {
    const meta = CAT_META[cat] || { emoji: '🍽️' };
    return `<button class="cat-btn ${cat === activeCategory ? 'active' : ''}"
      data-cat="${cat}" onclick="setCategory('${cat}')">
      <span class="cat-emoji">${meta.emoji}</span>${catLabel(cat)}
    </button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory    = cat;
  activeSubcategory = '';
  document.querySelectorAll('.cat-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === cat)
  );
  renderItems();
}

/* ── Sub-categories ── */
function setSubcategory(sc) {
  activeSubcategory = sc;
  renderItems();
}

/* ── Items ── */
function renderItems() {
  const catItems = menu.filter(i => i.category === activeCategory);
  const subcats  = [...new Set(catItems.filter(i => i.subcategory).map(i => i.subcategory))];
  const subEl    = document.getElementById('subcategories');

  if (subcats.length) {
    if (!activeSubcategory || !subcats.includes(activeSubcategory)) {
      activeSubcategory = subcats[0];
    }
    subEl.innerHTML = subcats.map(sc =>
      `<button class="subcat-btn ${sc === activeSubcategory ? 'active' : ''}"
        data-sc="${sc}" onclick="setSubcategory('${sc}')">${subcatLabel(sc)}</button>`
    ).join('');
    subEl.style.display = '';
  } else {
    activeSubcategory = '';
    subEl.innerHTML   = '';
    subEl.style.display = 'none';
  }

  const displayItems = subcats.length
    ? catItems.filter(i => i.subcategory === activeSubcategory)
    : catItems;

  document.getElementById('items-grid').innerHTML = displayItems
    .map(item => {
      return `<div class="item-card" id="card-${item.id}" onclick="addItem(${item.id})">
        <div class="item-name">${itemName(item)}</div>
        <div class="item-foot">
          <span class="item-price">₹${item.price}</span>
          <span class="item-plus">+</span>
        </div>
      </div>`;
    }).join('');
}

/* ── Order Logic ── */
function addItem(id) {
  const mi = menu.find(i => i.id === id);
  const ex = order.find(o => o.id === id);
  if (ex) { ex.qty++; }
  else     {
    const nameEn = mi.subcategory ? mi.name.replace(` ${mi.subcategory}`, '') : mi.name;
    order.push({ id: mi.id, name: nameEn, nameGu: mi.nameGu || nameEn, price: mi.price, category: mi.category, qty: 1 });
  }

  const card = document.getElementById(`card-${id}`);
  if (card) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }

  renderOrder();
}

function updateQty(id, delta) {
  const item = order.find(o => o.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) order = order.filter(o => o.id !== id);
  renderOrder();
  if (order.length === 0) closeSheet();
}

function clearOrder() {
  order = [];
  renderOrder();
  closeSheet();
}

function renderOrder() {
  const list   = document.getElementById('order-list');
  const badge  = document.getElementById('order-badge');
  const btn    = document.getElementById('btn-place');
  const totEl  = document.getElementById('total-val');

  const totalQty = order.reduce((s, i) => s + i.qty, 0);
  const total    = order.reduce((s, i) => s + i.price * i.qty, 0);

  /* badge */
  badge.textContent = totalQty;
  badge.classList.toggle('on', totalQty > 0);

  /* total */
  totEl.textContent = `₹${total}`;
  btn.disabled = order.length === 0;

  /* cart bar (mobile) */
  updateCartBar(totalQty, total);

  if (order.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍧</div>
        <div class="empty-msg">${t('emptyMsg')}</div>
      </div>`;
    return;
  }

  list.innerHTML = order.map(item =>
    `<div class="order-item">
      <span class="oi-name">${currentLang === 'gu' ? item.nameGu : item.name}</span>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="updateQty(${item.id},-1)">&#8722;</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.id},1)">+</button>
      </div>
      <span class="oi-total">₹${item.price * item.qty}</span>
    </div>`
  ).join('');
}

/* ── Cart Bar (mobile) ── */
function updateCartBar(qty, total) {
  const bar = document.getElementById('cart-bar');
  if (!bar) return;

  if (qty === 0) {
    bar.style.display = 'none';
    return;
  }

  // Only show on mobile (CSS controls display, but force show here)
  bar.style.display = '';
  document.getElementById('cart-bar-count').textContent =
    `${qty} ${qty > 1 ? t('itemsWord') : t('itemWord')}`;
  document.getElementById('cart-bar-total').textContent = `₹${total}`;
}

/* ── Bottom Sheet (mobile) ── */
function openSheet() {
  document.getElementById('order-panel').classList.add('open');
  document.getElementById('backdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeSheet() {
  document.getElementById('order-panel').classList.remove('open');
  document.getElementById('backdrop').classList.remove('open');
  document.body.style.overflow = '';
}

/* ── Place Order ── */
async function placeOrder() {
  if (!order.length) return;

  const btn = document.getElementById('btn-place');
  btn.disabled = true;
  btn.textContent = t('placing');

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    clearOrder();
    showToast(currentLang === 'gu' ? `✅ ઓર્ડર #${data.orderId} નોંધાયો!` : `✅ Order #${data.orderId} placed!`);
  } catch {
    showToast(currentLang === 'gu' ? '❌ ઓર્ડર આપવામાં નિષ્ફળ. ફરી પ્રયત્ન કરો.' : '❌ Failed to place order. Try again.');
    btn.disabled = false;
  }

  btn.textContent = t('placeOrder');
}

/* ── Toast ── */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

const CAT_META = {
  'Kulfi':      { emoji: '🍧' },
  'Ice Cream':  { emoji: '🍦' },
  'Lassi':      { emoji: '🥛' },
};

let menu = [];
let order = [];
let activeCategory = '';

fetch('menu.json')
  .then(r => r.json())
  .then(data => {
    menu = data;
    const categories = [...new Set(data.map(i => i.category))];
    activeCategory = categories[0];
    renderCategories(categories);
    renderItems();
  });

function renderCategories(categories) {
  document.getElementById('categories').innerHTML = categories.map(cat => {
    const meta = CAT_META[cat] || { emoji: '🍽️' };
    return `<button class="cat-btn ${cat === activeCategory ? 'active' : ''}"
      data-cat="${cat}" onclick="setCategory('${cat}')">
      <span class="cat-emoji">${meta.emoji}</span>${cat}
    </button>`;
  }).join('');
}

function setCategory(cat) {
  activeCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  renderItems();
}

function renderItems() {
  document.getElementById('items-grid').innerHTML = menu
    .filter(i => i.category === activeCategory)
    .map(item =>
      `<div class="item-card" id="card-${item.id}" onclick="addItem(${item.id})">
        <div class="item-name">${item.name}</div>
        <div class="item-foot">
          <span class="item-price">₹${item.price}</span>
          <span class="item-plus">+</span>
        </div>
      </div>`
    ).join('');
}

function addItem(id) {
  const mi = menu.find(i => i.id === id);
  const ex = order.find(o => o.id === id);
  if (ex) { ex.qty++; } else { order.push({ id: mi.id, name: mi.name, price: mi.price, qty: 1 }); }

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
}

function renderOrder() {
  const list   = document.getElementById('order-list');
  const badge  = document.getElementById('order-badge');
  const btn    = document.getElementById('btn-place');
  const totEl  = document.getElementById('total-val');

  const totalQty = order.reduce((s, i) => s + i.qty, 0);
  const total    = order.reduce((s, i) => s + i.price * i.qty, 0);

  badge.textContent = totalQty;
  badge.classList.toggle('on', totalQty > 0);
  totEl.textContent = `₹${total}`;
  btn.disabled = order.length === 0;

  if (order.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🍧</div>
        <div class="empty-msg">Tap items to add<br/>to your order</div>
      </div>`;
    return;
  }

  list.innerHTML = order.map(item =>
    `<div class="order-item">
      <span class="oi-name">${item.name}</span>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="updateQty(${item.id}, -1)">&#8722;</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="updateQty(${item.id}, 1)">+</button>
      </div>
      <span class="oi-total">₹${item.price * item.qty}</span>
    </div>`
  ).join('');
}

function clearOrder() {
  order = [];
  renderOrder();
}

async function placeOrder() {
  if (!order.length) return;
  const btn = document.getElementById('btn-place');
  btn.disabled = true;
  btn.textContent = 'Placing…';

  try {
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    clearOrder();
    showToast(`✅ Order #${data.orderId} placed!`);
  } catch {
    showToast('❌ Failed to place order. Try again.');
    btn.disabled = false;
  }

  btn.textContent = 'Place Order';
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

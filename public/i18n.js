const I18N = {
  en: {
    tagline:     'Fresh & Delicious Every Day',
    ordersLink:  'Orders',
    analyticsLink: 'Analytics',
    profitLink:  'Profit',
    currentOrder: 'Current Order',
    close:       'Close',
    emptyMsg:    'Tap items to add<br>to your order',
    totalAmount: 'Total Amount',
    placeOrder:  'Place Order',
    placing:     'Placing…',
    clearOrder:  'Clear Order',
    viewOrder:   'View Order ›',
    itemWord:    'item',
    itemsWord:   'items',
  },
  gu: {
    tagline:     'દરરોજ તાજું અને સ્વાદિષ્ટ',
    ordersLink:  'ઓર્ડર',
    analyticsLink: 'વિશ્લેષણ',
    profitLink:  'નફો',
    currentOrder: 'હાલનો ઓર્ડર',
    close:       'બંધ કરો',
    emptyMsg:    'તમારો ઓર્ડર ઉમેરવા<br>વસ્તુ પર ટેપ કરો',
    totalAmount: 'કુલ રકમ',
    placeOrder:  'ઓર્ડર આપો',
    placing:     'મોકલી રહ્યા છીએ…',
    clearOrder:  'ઓર્ડર રદ કરો',
    viewOrder:   'ઓર્ડર જુઓ ›',
    itemWord:    'વસ્તુ',
    itemsWord:   'વસ્તુ',
  },
};

let currentLang = localStorage.getItem('lang') === 'gu' ? 'gu' : 'en';

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) ?? I18N.en[key] ?? key;
}

function applyStaticI18n() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === currentLang));
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyStaticI18n();
  if (typeof onLangChange === 'function') onLangChange();
}

document.addEventListener('DOMContentLoaded', applyStaticI18n);

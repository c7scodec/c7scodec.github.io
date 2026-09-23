const $ = (id) => document.getElementById(id);

// Mobil menü
const menu = $('menu'), burger = $('hamburger');
const setMenu = (open) => {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  burger.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
};
burger.onclick = () => setMenu(!menu.classList.contains('open'));
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// Kartlardaki "Teklif Al" formdaki modeli seçer
const selectModel = (code) => {
  const sel = $('model');
  [...sel.options].forEach(o => { if (o.text.startsWith(code + ' ')) sel.value = o.text; });
};
document.querySelectorAll('[data-model]').forEach(a => {
  a.addEventListener('click', () => selectModel(a.dataset.model));
});

// Model seçici
const MODELS = [20, 50, 100, 250, 500, 1000];
const pick = () => {
  const n = Math.max(1, parseInt($('pkisi').value, 10) || 1);
  const need = n * Number($('plitre').value);
  // İklim payı: nominal kapasitenin ~%70'i hedeflenir
  const m = MODELS.find(c => c * 0.7 >= need);
  const out = $('psonuc');
  if (m) {
    out.innerHTML = `Günlük ihtiyaç ≈ ${need} L<strong>Önerilen: AWG-${m}</strong>
      <a href="#iletisim" class="link" data-pick="AWG-${m}">Bu model için teklif al →</a>`;
  } else {
    const k = Math.ceil(need / 700);
    out.innerHTML = `Günlük ihtiyaç ≈ ${need} L<strong>Önerilen: ${k} × AWG-1000</strong>
      <a href="#iletisim" class="link" data-pick="AWG-1000" data-qty="${k}">Proje teklifi al →</a>`;
  }
  const link = out.querySelector('[data-pick]');
  link.addEventListener('click', () => {
    selectModel(link.dataset.pick);
    if (link.dataset.qty) $('qty').value = link.dataset.qty;
  });
};
['pkisi', 'plitre'].forEach(id => $(id).addEventListener('input', pick));
pick();

// Galeri büyütme
const lb = $('lightbox');
if (lb && lb.showModal) {
  const lbImg = lb.querySelector('img');
  document.querySelectorAll('.g-item').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      lbImg.src = a.href;
      lbImg.alt = a.querySelector('img').alt;
      lb.showModal();
    });
  });
  lb.addEventListener('click', e => { if (e.target !== lbImg) lb.close(); });
}

// Teklif formu: Netlify Forms'a kaydeder + WhatsApp mesajını açar
$('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target, note = $('formNote'), btn = form.querySelector('button[type=submit]');
  const v = (id) => $(id).value.trim();
  const no = 'AM-' + new Date().getFullYear() + '-' + String(Math.floor(1000 + Math.random() * 9000));
  $('talepNo').value = no;

  const lines = [
    'TEKLİF TALEBİ ' + no,
    'Ad/Firma: ' + v('name'),
    'Telefon: ' + v('phone'),
    v('email') ? 'E-posta: ' + v('email') : null,
    'Model: ' + v('model'),
    'Adet: ' + (v('qty') || '1'),
    'Kullanım yeri: ' + v('place') + (v('city') ? ' / ' + v('city') : ''),
    v('msg') ? 'Not: ' + v('msg') : null
  ].filter(Boolean).join('\n');

  // WhatsApp tıklama anında açılmalı (sonradan açılırsa tarayıcı engeller)
  window.open('https://wa.me/905543349600?text=' + encodeURIComponent(lines), '_blank', 'noopener');

  btn.disabled = true;
  note.className = 'form-note';
  note.textContent = 'Gönderiliyor…';
  fetch('/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(new FormData(form)).toString()
  }).then(r => {
    if (!r.ok) throw new Error(r.status);
    note.className = 'form-note ok';
    note.textContent = 'Talebiniz alındı (' + no + '). Aynı gün içinde size dönüş yapacağız. WhatsApp penceresinde mesajı göndererek süreci hızlandırabilirsiniz.';
    form.reset();
    $('qty').value = '1';
    if (typeof gtag === 'function') gtag('event', 'generate_lead', { form: 'teklif' });
  }).catch(() => {
    note.className = 'form-note err';
    note.textContent = 'Form kaydedilemedi. Lütfen açılan WhatsApp penceresinden mesajı gönderin ya da 0554 334 96 00 numarasını arayın.';
  }).finally(() => { btn.disabled = false; });
});

$('yil').textContent = new Date().getFullYear();

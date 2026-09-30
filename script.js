// ---------- Thème clair / sombre ----------
const themeToggle = document.getElementById('themeToggle');
function setTheme(mode){
  document.documentElement.classList.toggle('light', mode === 'light');
  try{ localStorage.setItem('wm-theme', mode); }catch(e){}
}
let savedTheme = 'dark';
try{ savedTheme = localStorage.getItem('wm-theme') || 'dark'; }catch(e){}
setTheme(savedTheme);
themeToggle.addEventListener('click', () => {
  const next = document.documentElement.classList.contains('light') ? 'dark' : 'light';
  setTheme(next);
});

// ---------- reveal on scroll ----------
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// ---------- FAQ accordion ----------
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  btn.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => o.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// ---------- Bandeau vidéos défilantes ----------
// clip:"clips/xxx.mp4"  → extrait local qui tourne en boucle en permanence sur la carte
// youtube:"ID_DE_LA_VIDEO" → miniature + clic pour ouvrir la vidéo complète avec le son
// link:"https://instagram.com/..." → pour un Reel/Instagram (si pas de youtube)
const VIDEOS = [
  { h:true,  link:"", clip:"clips/clip1.mp4" },
  { h:true,  link:"", clip:"clips/clip2.mp4" },
  { h:true,  link:"", clip:"clips/clip3.mp4" },
  { h:false, link:"", clip:"clips/clip4.mp4" },
  { h:false, link:"", clip:"clips/clip5.mp4" },
  { h:false, link:"", clip:"clips/clip6.mp4" },
  { h:false, link:"", clip:"clips/clip7.mp4" },
  { h:false, link:"", clip:"clips/clip8.mp4" },
  { h:false, link:"", clip:"clips/clip9.mp4" },
  { h:true,  link:"", clip:"clips/clip10.mp4" },
  { h:false, link:"", clip:"clips/clip11.mp4" },
  { h:false, link:"", clip:"clips/clip12.mp4" },
  { h:true,  link:"", clip:"clips/clip13.mp4" },
  { h:false, link:"", clip:"clips/clip14.mp4" },
  { h:false, link:"", clip:"clips/clip15.mp4" },
  { h:false, link:"", clip:"clips/clip16.mp4" },
  { h:false, link:"", clip:"clips/clip17.mp4" },
  { h:false, link:"", clip:"clips/clip18.mp4" },
  { h:false, link:"", clip:"clips/clip19.mp4" },
  { h:false, link:"", clip:"clips/clip20.mp4" },
  { h:false, link:"", clip:"clips/clip21.mp4" },
  { h:false, link:"", clip:"clips/clip22.mp4" },
  { h:false, link:"", clip:"clips/clip23.mp4" },



];
function renderTrack(id){
  const el = document.getElementById(id);
  if (!el) return;
  const html = VIDEOS.map(v => {
    const clipTag = v.clip ? `<video class="vm-clip" src="${v.clip}" autoplay muted loop playsinline></video>` : '';
    const thumb = (!v.clip && v.youtube) ? ` style="background-image:url('https://img.youtube.com/vi/${v.youtube}/hqdefault.jpg');background-size:cover;background-position:center;"` : '';
    return `<div class="vm-item${v.h ? ' h' : ''}" data-youtube="${v.youtube || ''}"${thumb}>${clipTag}<div class="vm-preview"></div></div>`;
  }).join('');
  el.innerHTML = html + html; // dupliqué pour la boucle infinie
}
renderTrack('vmTrack1');
renderTrack('vmTrack2');

// ---------- Défilement auto + glisser à la souris / tactile ----------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function setupDraggableMarquee(trackId){
  const track = document.getElementById(trackId);
  if (!track) return;
  const wrap = track.parentElement;
  const SPEED = 0.45; // px par frame ≈ vitesse du défilement auto
  let isDown = false, startX = 0, startScroll = 0, moved = false, hovering = false;

  function loopIfNeeded(){
    const half = wrap.scrollWidth / 2;
    if (wrap.scrollLeft >= half) wrap.scrollLeft -= half;
    else if (wrap.scrollLeft <= 0) wrap.scrollLeft += half;
  }

  if (!reduceMotion) {
    (function tick(){
      if (!isDown && !hovering) { wrap.scrollLeft += SPEED; loopIfNeeded(); }
      requestAnimationFrame(tick);
    })();
  }

  wrap.addEventListener('mouseenter', () => hovering = true);
  wrap.addEventListener('mouseleave', () => { hovering = false; isDown = false; wrap.classList.remove('dragging'); });

  wrap.addEventListener('mousedown', (e) => {
    isDown = true; moved = false;
    startX = e.clientX; startScroll = wrap.scrollLeft;
    wrap.classList.add('dragging');
  });
  window.addEventListener('mouseup', () => { isDown = false; wrap.classList.remove('dragging'); });
  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) moved = true;
    wrap.scrollLeft = startScroll - dx;
    loopIfNeeded();
  });
  // empêche le clic d'ouvrir la vidéo si on vient de glisser la souris
  wrap.addEventListener('click', (e) => {
    if (moved) { e.stopPropagation(); e.preventDefault(); moved = false; }
  }, true);

  // tactile / trackpad : le défilement natif gère déjà le glisser, on gère juste la boucle infinie
  wrap.addEventListener('scroll', loopIfNeeded, { passive:true });
}
setupDraggableMarquee('vmTrack1');
setupDraggableMarquee('vmTrack2');

// ---------- Aperçu vidéo au survol (silencieux, en boucle) — cartes sans extrait local ----------
document.querySelectorAll('.vm-item').forEach(item => {
  if (item.querySelector('.vm-clip')) return; // déjà en boucle permanente via extrait local
  const yt = item.getAttribute('data-youtube');
  if (!yt) return;
  const preview = item.querySelector('.vm-preview');
  let hoverTimer = null;
  item.addEventListener('mouseenter', () => {
    hoverTimer = setTimeout(() => {
      preview.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&modestbranding=1&playsinline=1&rel=0" allow="autoplay; encrypted-media" frameborder="0"></iframe>`;
      item.classList.add('previewing');
    }, 350);
  });
  item.addEventListener('mouseleave', () => {
    clearTimeout(hoverTimer);
    preview.innerHTML = '';
    item.classList.remove('previewing');
  });
});


// ---------- Compteurs animés (setInterval, fiable même onglet inactif) ----------
function animateCount(el){
  const raw = el.textContent.trim();
  const match = raw.match(/^([\d.,]+)(.*)$/);
  if (!match) return;
  const target = parseFloat(match[1].replace(',', '.'));
  const suffix = match[2];
  const dur = 1200;
  const t0 = Date.now();
  const timer = setInterval(() => {
    const p = Math.min(1, (Date.now() - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (p >= 1) clearInterval(timer);
  }, 16);
}
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); } });
}, { threshold: 0.6 });
document.querySelectorAll('.stat-num').forEach(el => countIO.observe(el));

// ---------- Waitlist form ----------
// Les inscriptions sont envoyées par email à workmastour@gmail.com via FormSubmit.co (gratuit, sans compte).
// ⚠️ La toute première inscription déclenche un email de FormSubmit à workmastour@gmail.com avec un lien
// "Activate Form" à cliquer une seule fois — ensuite tout arrive automatiquement.
const WAITLIST_ENDPOINT = "https://formsubmit.co/ajax/workmastour@gmail.com";
// Copie chaque inscription dans un Google Sheet centralisé (en plus de l'email FormSubmit).
const SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxknEIQO7QLiWoClZ5AbEXq1VGJlRUxBn5Id6M-LEARoDFgyCwheHm3zQPJamIS5kU8fw/exec";

// Empêche une même adresse (sur ce navigateur) de se réinscrire plusieurs fois.
function getSubmittedEmails(){
  try { return JSON.parse(localStorage.getItem('wm-waitlist-emails') || '[]'); } catch(e) { return []; }
}
function rememberSubmittedEmail(email){
  try {
    const emails = getSubmittedEmails();
    if (!emails.includes(email)) { emails.push(email); localStorage.setItem('wm-waitlist-emails', JSON.stringify(emails)); }
  } catch(e) {}
}

document.querySelectorAll('[data-waitlist]').forEach(form => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('.btn-primary');
    const label = form.querySelector('.btn-label');
    const msg = form.parentElement.querySelector('.wl-msg');
    const emailInput = form.querySelector('input[type=email]');
    const email = emailInput.value.trim().toLowerCase();

    if (getSubmittedEmails().includes(email)) {
      if (msg) { msg.textContent = "Tu es déjà sur la liste avec cette adresse — pas besoin de te réinscrire !"; msg.className = "wl-msg show ok"; }
      emailInput.value = "";
      return;
    }

    btn.disabled = true;
    const originalLabel = label.textContent;
    label.textContent = "Envoi…";

    // Copie dans le Google Sheet — fire-and-forget, source fiable indépendante de FormSubmit.
    fetch(SHEET_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ email: email })
    }).catch(() => {});

    function markSuccess(){
      label.textContent = "C'est fait ✓";
      rememberSubmittedEmail(email);
      if (msg) { msg.textContent = "Tu es sur la liste — tu seras prévenue en priorité, avant tout le monde."; msg.className = "wl-msg show ok"; }
      emailInput.value = "";
      setTimeout(() => { label.textContent = originalLabel; btn.disabled = false; }, 3000);
    }

    try {
      // FormSubmit peut parfois être lent ou ne pas répondre : on ne bloque pas l'inscription pour autant,
      // le Google Sheet ci-dessus a déjà reçu l'email. Course contre un minuteur de 6s (plus fiable que
      // AbortController, qui ne coupe pas toujours la requête sur certaines connexions bloquées).
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), 6000));

      const res = await Promise.race([
        fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Accept": "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            _subject: "Nouvelle inscription — Liste d'attente",
            _template: "table",
            _captcha: "false"
          })
        }),
        timeoutPromise
      ]);
      const data = await res.json().catch(() => ({}));
      const isActivationPending = data.message && /activation/i.test(data.message);

      if (res.ok && (data.success === "true" || data.success === true)) {
        markSuccess();
      } else if (isActivationPending) {
        label.textContent = originalLabel;
        btn.disabled = false;
        if (msg) { msg.textContent = "Presque ! Le formulaire attend une activation ponctuelle (email envoyé à workmastour@gmail.com, à valider une seule fois)."; msg.className = "wl-msg show err"; }
      } else {
        throw new Error("Erreur d'envoi");
      }
    } catch (err) {
      if (err.message === "TIMEOUT") {
        // FormSubmit n'a pas répondu à temps, mais le Sheet a déjà l'email : on ne bloque pas la visiteuse.
        markSuccess();
      } else {
        label.textContent = originalLabel;
        btn.disabled = false;
        if (msg) { msg.textContent = "Une erreur est survenue — réessaie, ou écris directement à workmastour@gmail.com."; msg.className = "wl-msg show err"; }
      }
    }
  });
});

(function () {
  const cvs = document.createElement('canvas');
  cvs.id = 'ds-canvas';
  cvs.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1';
  document.body.insertBefore(cvs, document.body.firstChild);

  // Transparent body so canvas shows through semi-transparent cards
  document.documentElement.style.background = '#070715';
  document.body.style.background = 'transparent';

  const ctx = cvs.getContext('2d');
  let W = 0, H = 0;

  function resize() {
    W = cvs.width  = window.innerWidth;
    H = cvs.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Background gradient ──────────────────────────────────────
  function drawBg() {
    const g = ctx.createLinearGradient(0, 0, W * 0.6, H);
    g.addColorStop(0,   '#04040e');
    g.addColorStop(0.4, '#07071a');
    g.addColorStop(1,   '#0c0520');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Moon ────────────────────────────────────────────────────
  function drawMoon() {
    const mx = W * 0.82, my = H * 0.12, mr = 48;
    // Outer glow
    const glow = ctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 3.5);
    glow.addColorStop(0,   'rgba(200, 230, 255, 0.12)');
    glow.addColorStop(1,   'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Moon body
    const moon = ctx.createRadialGradient(mx - 8, my - 8, 4, mx, my, mr);
    moon.addColorStop(0,   '#fdf8e8');
    moon.addColorStop(0.6, '#ece8d0');
    moon.addColorStop(1,   '#ccc8b0');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Stars ───────────────────────────────────────────────────
  const stars = Array.from({ length: 90 }, () => ({
    x: Math.random() * 1, y: Math.random() * 0.55,
    r: Math.random() * 1.3 + 0.2,
    a: Math.random() * 0.55 + 0.1,
    da: (Math.random() * 0.012 + 0.003) * (Math.random() > 0.5 ? 1 : -1),
  }));

  function drawStars() {
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 0.75 || s.a < 0.05) s.da *= -1;
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#cce8ff';
      ctx.shadowColor = '#88ccff';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Water streaks (Water Breathing) ─────────────────────────
  function mkStreak() {
    return {
      x:   -300,
      y:   Math.random() * H,
      len: Math.random() * 220 + 80,
      vx:  Math.random() * 5 + 2,
      a:   Math.random() * 0.13 + 0.04,
      h:   Math.random() * 1.8 + 0.4,
    };
  }
  const streaks = Array.from({ length: 20 }, () => { const s = mkStreak(); s.x = Math.random() * W; return s; });

  function drawStreaks() {
    streaks.forEach((s, i) => {
      s.x += s.vx;
      if (s.x > W + 200) streaks[i] = mkStreak();
      const g = ctx.createLinearGradient(s.x, 0, s.x + s.len, 0);
      g.addColorStop(0, 'transparent');
      g.addColorStop(0.5, '#00d4aa');
      g.addColorStop(1, 'transparent');
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.fillStyle = g;
      ctx.fillRect(s.x, s.y, s.len, s.h);
      ctx.restore();
    });
  }

  // ── Embers (Flame Breathing) ─────────────────────────────────
  function mkEmber() {
    return {
      x:    Math.random() * W,
      y:    H + 5,
      r:    Math.random() * 2.4 + 0.6,
      vx:   (Math.random() - 0.5) * 0.7,
      vy:   -(Math.random() * 1.3 + 0.4),
      a:    Math.random() * 0.75 + 0.25,
      hue:  Math.random() * 45 + 8,
      i:    Math.random() * Math.PI * 2,
    };
  }
  const embers = Array.from({ length: 60 }, () => { const e = mkEmber(); e.y = Math.random() * H; return e; });

  function drawEmbers(t) {
    embers.forEach((e, idx) => {
      e.x  += e.vx + Math.sin(t * 0.0009 + e.i) * 0.25;
      e.y  += e.vy;
      e.a  -= 0.0018;
      if (e.y < -5 || e.a <= 0) embers[idx] = mkEmber();
      ctx.save();
      ctx.globalAlpha = e.a;
      const c = `hsl(${e.hue},100%,65%)`;
      ctx.fillStyle = c;
      ctx.shadowColor = c;
      ctx.shadowBlur = e.r * 5;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Cherry blossom petals ────────────────────────────────────
  function mkPetal() {
    return {
      x:    Math.random() * W,
      y:    -10,
      r:    Math.random() * 4.5 + 2,
      vx:   (Math.random() - 0.5) * 1.1,
      vy:   Math.random() * 0.9 + 0.35,
      rot:  Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.04,
      a:    Math.random() * 0.45 + 0.15,
      c:    Math.random() > 0.45 ? '#ff90b3' : '#ffd0e4',
      i:    Math.random() * Math.PI * 2,
    };
  }
  const petals = Array.from({ length: 32 }, () => { const p = mkPetal(); p.y = Math.random() * H; return p; });

  function drawPetals(t) {
    petals.forEach((p, idx) => {
      p.x   += p.vx + Math.sin(t * 0.0007 + p.i) * 0.45;
      p.y   += p.vy;
      p.rot += p.rotV;
      if (p.y > H + 10) petals[idx] = mkPetal();
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.shadowColor = '#ff80ab';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Wisteria sparkles (purple/violet) ───────────────────────
  function mkSparkle() {
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.5 + 0.5,
      a:  0,
      maxA: Math.random() * 0.5 + 0.1,
      da: Math.random() * 0.015 + 0.005,
      c:  Math.random() > 0.5 ? '#b48cf7' : '#7b55ee',
    };
  }
  const sparkles = Array.from({ length: 40 }, mkSparkle);

  function drawSparkles() {
    sparkles.forEach((s, i) => {
      s.a += s.da;
      if (s.a >= s.maxA) { s.da *= -1; }
      if (s.a <= 0)      { sparkles[i] = mkSparkle(); sparkles[i].a = 0; }
      ctx.save();
      ctx.globalAlpha = s.a;
      ctx.fillStyle = s.c;
      ctx.shadowColor = s.c;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ── Animation loop ────────────────────────────────────────────
  function tick(t) {
    drawBg();
    drawMoon();
    drawStars();
    drawStreaks();
    drawSparkles();
    drawEmbers(t);
    drawPetals(t);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

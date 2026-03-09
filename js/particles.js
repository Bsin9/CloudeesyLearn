/* ============================================================
   Cloudesy — NiCE Enlighten-style full-page particle system
   Pure canvas, no dependencies, respects prefers-reduced-motion
   ============================================================ */
(function () {
  'use strict';

  /* ── Skip if user prefers reduced motion ── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── Hide canvas if video loaded successfully (video takes priority) ── */
  var bgVideo = document.getElementById('bg-video');
  if (bgVideo) {
    bgVideo.addEventListener('canplay', function () {
      var canvas = document.getElementById('particle-canvas');
      if (canvas) canvas.style.display = 'none';
    }, { once: true });
    /* If video already ready (cached) */
    if (bgVideo.readyState >= 3) {
      var c = document.getElementById('particle-canvas');
      if (c) c.style.display = 'none';
      return;
    }
  }

  /* ── Canvas setup ── */
  var canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var W = 0, H = 0, scrollY = 0;
  var particles = [];
  var bokeh = [];
  var raf;

  /* ── Palette — NiCE Enlighten blues, teals, purples ── */
  var COLORS = [
    [0,   160, 255],   /* electric blue    */
    [0,   200, 255],   /* bright cyan-blue */
    [0,   120, 220],   /* deep blue        */
    [80,  100, 255],   /* blue-violet      */
    [0,   220, 230],   /* teal             */
    [40,   80, 200],   /* navy blue        */
    [120,  60, 255],   /* violet           */
    [0,   180, 200],   /* aqua             */
  ];

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = document.documentElement.scrollHeight;
    canvas.style.height = H + 'px';
  }

  /* ── Small drifting particle ── */
  function makeParticle() {
    var col = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.25 - 0.05, /* gentle upward drift */
      r:  Math.random() * 1.8 + 0.4,
      col: col,
      baseAlpha: Math.random() * 0.65 + 0.15,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.018 + 0.006,
      glowing: Math.random() > 0.55
    };
  }

  /* ── Larger bokeh blobs ── */
  function makeBokeh() {
    var col = COLORS[Math.floor(Math.random() * COLORS.length)];
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.08 - 0.03,
      r:  Math.random() * 28 + 10,
      col: col,
      baseAlpha: Math.random() * 0.07 + 0.02,
      alpha: 0,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.007 + 0.003
    };
  }

  /* ── Initialise ── */
  function init() {
    var area  = W * H;
    var count = Math.min(Math.round(area / 6500), 280);
    var bkCount = Math.min(Math.round(area / 40000), 30);

    particles = [];
    bokeh     = [];
    for (var i = 0; i < count;   i++) particles.push(makeParticle());
    for (var j = 0; j < bkCount; j++) bokeh.push(makeBokeh());
  }

  /* ── Update + wrap ── */
  function updateParticle(p) {
    p.x += p.vx;
    p.y += p.vy;
    p.phase += p.speed;
    p.alpha = p.baseAlpha * (0.45 + 0.55 * Math.sin(p.phase));
    if (p.x < -8)    p.x = W + 8;
    if (p.x > W + 8) p.x = -8;
    if (p.y < -8)    p.y = H + 8;
    if (p.y > H + 8) p.y = -8;
  }

  /* ── Draw small particle ── */
  function drawParticle(p) {
    var r = p.col[0], g = p.col[1], b = p.col[2];
    ctx.save();
    if (p.glowing) {
      ctx.shadowBlur  = p.r * 9;
      ctx.shadowColor = 'rgba(' + r + ',' + g + ',' + b + ',0.85)';
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + p.alpha.toFixed(3) + ')';
    ctx.fill();
    ctx.restore();
  }

  /* ── Draw bokeh blob ── */
  function drawBokeh(b) {
    var r = b.col[0], g = b.col[1], bl = b.col[2];
    b.phase += b.speed;
    b.alpha = b.baseAlpha * (0.4 + 0.6 * Math.sin(b.phase));
    b.x += b.vx;  b.y += b.vy;
    if (b.x < -50)    b.x = W + 50;
    if (b.x > W + 50) b.x = -50;
    if (b.y < -50)    b.y = H + 50;
    if (b.y > H + 50) b.y = -50;

    var grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    grd.addColorStop(0,   'rgba(' + r + ',' + g + ',' + bl + ',' + b.alpha.toFixed(3) + ')');
    grd.addColorStop(1,   'rgba(' + r + ',' + g + ',' + bl + ',0)');
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();
  }

  /* ── Purple atmospheric haze (left side — NiCE style) ── */
  function drawHaze() {
    /* left violet bloom */
    var lx = W * 0.18, ly = H * 0.3;
    var lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, W * 0.45);
    lg.addColorStop(0,   'rgba(100,20,200,0.12)');
    lg.addColorStop(0.5, 'rgba(60,10,160,0.06)');
    lg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    /* right blue bloom */
    var rx = W * 0.75, ry = H * 0.25;
    var rg = ctx.createRadialGradient(rx, ry, 0, rx, ry, W * 0.4);
    rg.addColorStop(0,   'rgba(0,80,200,0.10)');
    rg.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);
  }

  /* ── Main animation loop ── */
  function animate() {
    ctx.clearRect(0, 0, W, H);

    /* atmospheric haze */
    drawHaze();

    /* bokeh blobs */
    for (var j = 0; j < bokeh.length; j++) drawBokeh(bokeh[j]);

    /* small particles */
    for (var i = 0; i < particles.length; i++) {
      updateParticle(particles[i]);
      drawParticle(particles[i]);
    }

    raf = requestAnimationFrame(animate);
  }

  /* ── Resize handler: debounced ── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      cancelAnimationFrame(raf);
      resize();
      init();
      animate();
    }, 200);
  });

  /* ── Kick off ── */
  resize();
  init();
  animate();
}());

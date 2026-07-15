/* ============================================================
   ASHES OF ELDORIA — sprites.js
   Every visual asset in the game is authored here by hand:
   pixel-string sprite art, procedural tile textures, UI
   parchment/wood textures, item + spell icons.
   No external images are loaded, ever.
   ============================================================ */
(function () {
  'use strict';

  const PXA = (window.PXA = {});

  // ---------- tiny helpers ----------
  function mkCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  function ctx2d(c) {
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    return g;
  }
  // deterministic rng for textures
  function mulberry(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  PXA.mulberry = mulberry;

  // rasterize a pixel-string art. rows: array of strings, pal: {char:color}
  function px(rows, pal, w) {
    w = w || Math.max.apply(null, rows.map(r => r.length));
    const h = rows.length;
    const c = mkCanvas(w, h), g = ctx2d(c);
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x, y, 1, 1);
      }
    }
    return c;
  }
  PXA.px = px;

  // draw a 1px dark outline around every opaque pixel
  function outline(c, col) {
    col = col || '#221507';
    const w = c.width, h = c.height;
    const out = mkCanvas(w + 2, h + 2), g = ctx2d(out);
    for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) g.drawImage(c, dx, dy);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = col; g.fillRect(0, 0, w + 2, h + 2);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(c, 1, 1);
    return out;
  }
  PXA.outline = outline;

  function flipH(c) {
    const out = mkCanvas(c.width, c.height), g = ctx2d(out);
    g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0);
    return out;
  }
  PXA.flipH = flipH;

  // shift a subset of rows horizontally (string art op)
  function shiftRows(rows, from, to, dx) {
    return rows.map((r, i) => {
      if (i < from || i > to) return r;
      if (dx > 0) return '.'.repeat(dx) + r.slice(0, r.length - dx);
      return r.slice(-dx) + '.'.repeat(-dx);
    });
  }
  // move whole art down n rows (crop bottom)
  function dropRows(rows, n) {
    const w = rows[0].length;
    const blank = '.'.repeat(w);
    const out = [];
    for (let i = 0; i < n; i++) out.push(blank);
    for (let i = 0; i < rows.length - n; i++) out.push(rows[i]);
    return out;
  }

  // ============================================================
  // MASTER PALETTE
  // ============================================================
  const C = PXA.C = {
    o: '#221507',           // outline
    white: '#f8f4e8', black: '#181008',
    // skins
    skinA: '#f4cd9e', skinAd: '#d9a066', skinB: '#d9a066', skinBd: '#b0763c',
    skinC: '#9c6238', skinCd: '#6e421f',
    // metals
    iron: '#b8bcc4', irond: '#7c8088', steel: '#dce4ec', steeld: '#98a4b0',
    goldm: '#f2c14b', goldmd: '#b0812a',
    // cloth
    red: '#c8402e', redd: '#8a2417', blue: '#3b6fd0', blued: '#22417c',
    green: '#4fa04a', greend: '#2c6428', purple: '#8a4fc8', purpled: '#57297c',
    brown: '#8a5a2c', brownd: '#5c3a18', tan: '#d8b078', tand: '#a8804a',
    // nature
    leaf: '#3f8c3a', leafd: '#276022', leafl: '#66b053',
    wood: '#7a4a22', woodd: '#4a2c14', woodl: '#a06a35',
    bone: '#e8e0c8', boned: '#b0a684',
    slimeG: '#58c04e', slimeGd: '#2f8232', slimeGl: '#9ce88a',
  };

  // ============================================================
  // UI TEXTURES  (injected as CSS variables)
  // ============================================================
  function texParchment() {
    const s = 64, c = mkCanvas(s, s), g = ctx2d(c), r = mulberry(41);
    g.fillStyle = '#ecd9ab'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 520; i++) {
      const x = (r() * s) | 0, y = (r() * s) | 0, v = r();
      g.fillStyle = v < .45 ? '#e3cd9a' : (v < .8 ? '#f2e2ba' : '#d8bf8a');
      g.fillRect(x, y, 1 + (r() < .3 ? 1 : 0), 1);
    }
    // faint fibers
    g.fillStyle = 'rgba(160,120,60,.10)';
    for (let i = 0; i < 22; i++) g.fillRect((r() * s) | 0, (r() * s) | 0, 2 + r() * 5 | 0, 1);
    return c;
  }
  function texWood() {
    const s = 64, c = mkCanvas(s, s), g = ctx2d(c), r = mulberry(7);
    g.fillStyle = '#6e421d'; g.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y++) {
      // horizontal plank grain
      const band = Math.floor(y / 8);
      const base = band % 2 ? '#754923' : '#663c19';
      g.fillStyle = base; g.fillRect(0, y, s, 1);
      for (let i = 0; i < 9; i++) {
        const x = (r() * s) | 0, v = r();
        g.fillStyle = v < .5 ? '#5c3414' : '#84542a';
        g.fillRect(x, y, 1 + (r() * 3 | 0), 1);
      }
      if (y % 8 === 0) { g.fillStyle = '#3c220c'; g.fillRect(0, y, s, 1); }
    }
    // knots
    for (let i = 0; i < 3; i++) {
      const x = (r() * s) | 0, y = (r() * s) | 0;
      g.fillStyle = '#46280e'; g.fillRect(x, y, 3, 2);
      g.fillStyle = '#2e1806'; g.fillRect(x + 1, y, 1, 1);
    }
    return c;
  }
  function texBlue() {
    const s = 48, c = mkCanvas(s, s), g = ctx2d(c), r = mulberry(99);
    g.fillStyle = '#2e3f66'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) {
      const v = r();
      g.fillStyle = v < .5 ? '#293a5e' : '#35486f';
      g.fillRect((r() * s) | 0, (r() * s) | 0, 1, 1);
    }
    return c;
  }
  function texSlot() {
    const s = 40, c = mkCanvas(s, s), g = ctx2d(c), r = mulberry(13);
    g.fillStyle = '#2a1809'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 130; i++) {
      g.fillStyle = r() < .5 ? '#241206' : '#331e0b';
      g.fillRect((r() * s) | 0, (r() * s) | 0, 1, 1);
    }
    return c;
  }
  // 18x18 nine-slice frame used with border-image
  function texFrame(edge, edgeD, edgeL, rivet) {
    const s = 18, c = mkCanvas(s, s), g = ctx2d(c);
    g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, s, s);
    // outer dark ring
    g.fillStyle = '#221507'; g.fillRect(0, 0, s, s);
    // main edge
    g.fillStyle = edge; g.fillRect(1, 1, s - 2, s - 2);
    // bevel
    g.fillStyle = edgeL; g.fillRect(1, 1, s - 2, 2); g.fillRect(1, 1, 2, s - 2);
    g.fillStyle = edgeD; g.fillRect(1, s - 3, s - 2, 2); g.fillRect(s - 3, 1, 2, s - 2);
    // hollow center (fill area shows panel background)
    g.clearRect(6, 6, s - 12, s - 12);
    g.fillStyle = '#221507'; g.fillRect(5, 5, s - 10, 1); g.fillRect(5, s - 6, s - 10, 1);
    g.fillRect(5, 5, 1, s - 10); g.fillRect(s - 6, 5, 1, s - 10);
    // corner rivets
    g.fillStyle = rivet;
    for (const [x, y] of [[2, 2], [s - 5, 2], [2, s - 5], [s - 5, s - 5]]) {
      g.fillRect(x, y, 3, 3);
      g.fillStyle = '#fff7d0'; g.fillRect(x, y, 1, 1); g.fillStyle = rivet;
    }
    return c;
  }
  PXA.initUITextures = function () {
    const root = document.documentElement.style;
    root.setProperty('--tex-parch', `url(${texParchment().toDataURL()})`);
    root.setProperty('--tex-wood', `url(${texWood().toDataURL()})`);
    root.setProperty('--tex-blue', `url(${texBlue().toDataURL()})`);
    root.setProperty('--tex-slot', `url(${texSlot().toDataURL()})`);
    root.setProperty('--tex-frame', `url(${texFrame('#8a5a2c', '#5c3a18', '#a8804a', '#c98f2f').toDataURL()})`);
    root.setProperty('--tex-framegold', `url(${texFrame('#a3742a', '#6b4413', '#e8b34b', '#ffdf8e').toDataURL()})`);
    root.setProperty('--tex-frameblue', `url(${texFrame('#33509c', '#20305c', '#4f74d8', '#9db8ff').toDataURL()})`);
  };

  // ============================================================
  // TILES — 16x16 procedural pixel textures
  // ============================================================
  const T = 16;
  const tiles = PXA.tiles = {};

  function tile(name, fn, frames) {
    if (frames) {
      tiles[name] = [];
      for (let f = 0; f < frames; f++) {
        const c = mkCanvas(T, T), g = ctx2d(c);
        fn(g, mulberry(name.length * 977 + f * 131 + 5), f);
        tiles[name].push(c);
      }
    } else {
      const c = mkCanvas(T, T), g = ctx2d(c);
      fn(g, mulberry(name.length * 977 + name.charCodeAt(0) * 31));
      tiles[name] = c;
    }
  }
  function speckle(g, r, colors, n) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = colors[(r() * colors.length) | 0];
      g.fillRect((r() * T) | 0, (r() * T) | 0, 1, 1);
    }
  }

  tile('grass', (g, r) => {
    g.fillStyle = '#4f9c48'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#469140', '#57a850', '#5fb356', '#468c40'], 46);
    for (let i = 0; i < 5; i++) { // grass blades
      const x = (r() * 15) | 0, y = 2 + (r() * 12) | 0;
      g.fillStyle = '#63b858'; g.fillRect(x, y, 1, 2);
    }
  });
  tile('grass2', (g, r) => {
    g.fillStyle = '#539f4c'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#4a9243', '#5cab52', '#469140'], 40);
  });
  tile('tallgrass', (g, r) => {
    g.fillStyle = '#4f9c48'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#469140', '#57a850'], 30);
    for (let i = 0; i < 9; i++) {
      const x = 1 + (r() * 14) | 0, y = 4 + (r() * 9) | 0, hgt = 3 + (r() * 4) | 0;
      g.fillStyle = r() < .5 ? '#3a7c35' : '#63b858';
      g.fillRect(x, y, 1, hgt);
      g.fillRect(x + (r() < .5 ? 1 : -1), y + 1, 1, 1);
    }
  });
  tile('flowers', (g, r) => {
    g.fillStyle = '#4f9c48'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#469140', '#57a850'], 34);
    const cols = ['#e85a5a', '#f2d34b', '#f0f0f0', '#d879e0'];
    for (let i = 0; i < 4; i++) {
      const x = 1 + (r() * 13) | 0, y = 1 + (r() * 12) | 0;
      g.fillStyle = '#3a7c35'; g.fillRect(x, y + 1, 1, 2);
      g.fillStyle = cols[(r() * cols.length) | 0];
      g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3);
      g.fillStyle = '#f8e88a'; g.fillRect(x, y, 1, 1);
    }
  });
  tile('herbplant', (g, r) => {
    g.fillStyle = '#4f9c48'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#469140', '#57a850'], 26);
    g.fillStyle = '#2c6428';
    g.fillRect(7, 8, 2, 5);
    g.fillStyle = '#7de07a';
    g.fillRect(4, 5, 3, 3); g.fillRect(9, 4, 3, 3); g.fillRect(6, 2, 4, 3); g.fillRect(3, 9, 3, 2); g.fillRect(10, 8, 3, 2);
    g.fillStyle = '#b8f0a0'; g.fillRect(7, 3, 2, 1); g.fillRect(5, 6, 1, 1); g.fillRect(10, 5, 1, 1);
  });
  tile('dirt', (g, r) => {
    g.fillStyle = '#9c7442'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#8f6a3a', '#a87f4a', '#936d3d', '#b08850'], 44);
  });
  tile('path', (g, r) => {
    g.fillStyle = '#c2a26a'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#b6965e', '#ccac74', '#ab8c56', '#d4b47c'], 46);
    g.fillStyle = '#a88a54';
    for (let i = 0; i < 4; i++) g.fillRect((r() * 13) | 0, (r() * 13) | 0, 2 + (r() * 2 | 0), 1);
  });
  tile('stonepath', (g, r) => {
    g.fillStyle = '#a8a49c'; g.fillRect(0, 0, T, T);
    // slab pattern
    g.fillStyle = '#8c8880';
    g.fillRect(0, 7, T, 1); g.fillRect(0, 15, T, 1);
    g.fillRect(7, 0, 1, 7); g.fillRect(3, 8, 1, 7); g.fillRect(12, 8, 1, 7);
    speckle(g, r, ['#9c988f', '#b4b0a8', '#94908a'], 28);
    g.fillStyle = '#bcb8b0'; g.fillRect(1, 1, 3, 1); g.fillRect(9, 9, 3, 1);
  });
  tile('sand', (g, r) => {
    g.fillStyle = '#e0c078'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#d4b46c', '#e8cc86', '#ccaa62', '#f0d896'], 42);
    g.fillStyle = '#ccaa62';
    g.fillRect(2, 4, 4, 1); g.fillRect(9, 11, 4, 1);
  });
  tile('snow', (g, r) => {
    g.fillStyle = '#e8ecf2'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#dde3ec', '#f4f7fb', '#d2dae6'], 36);
  });
  tile('swamp', (g, r) => {
    g.fillStyle = '#5a7040'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#516638', '#647c48', '#485c32', '#6d8450'], 42);
    g.fillStyle = '#42542e'; g.fillRect(3, 10, 5, 2); g.fillRect(10, 3, 4, 2);
  });
  tile('corrupt', (g, r) => {
    g.fillStyle = '#5c3a5e'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#532f55', '#68456a', '#4a2a4c', '#714d74'], 42);
    g.fillStyle = '#8a4fc8'; // glowing cracks
    if (r() < .8) { g.fillRect((r() * 12) | 0, (r() * 12) | 0, 3, 1); g.fillRect((r() * 12) | 0, (r() * 12) | 0, 1, 3); }
  });
  tile('ashes', (g, r) => {
    g.fillStyle = '#6a5e5c'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#5f5452', '#756866', '#544a48'], 40);
    if (r() < .5) { g.fillStyle = '#3c3434'; g.fillRect((r() * 12) | 0, (r() * 12) | 0, 3, 2); }
  });
  tile('water', (g, r, f) => {
    g.fillStyle = '#3f74c8'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#3a6cba', '#457cd2', '#3566ac'], 30);
    g.fillStyle = '#7aa8e8';
    const o = f ? 4 : 0;
    g.fillRect((2 + o) % 16, 3, 4, 1); g.fillRect((9 + o) % 16, 8, 5, 1); g.fillRect((4 + o) % 16, 13, 4, 1);
  }, 2);
  tile('deepwater', (g, r, f) => {
    g.fillStyle = '#2a4f96'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#264889', '#2e57a3', '#22407c'], 26);
    g.fillStyle = '#4a74c0';
    const o = f ? 5 : 0;
    g.fillRect((3 + o) % 16, 5, 3, 1); g.fillRect((10 + o) % 16, 11, 4, 1);
  }, 2);
  tile('lava', (g, r, f) => {
    g.fillStyle = '#d84a1a'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#c8400f', '#e85a24', '#b83a10'], 30);
    g.fillStyle = '#f8c83a';
    const o = f ? 3 : 0;
    g.fillRect((1 + o) % 16, 4, 4, 1); g.fillRect((8 + o) % 16, 9, 5, 2); g.fillRect((4 + o) % 16, 13, 3, 1);
    g.fillStyle = '#f8ea90'; g.fillRect((9 + o) % 16, 9, 2, 1);
  }, 2);
  tile('mountain', (g, r) => {
    g.fillStyle = '#7c7268'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#736a60', '#867c72', '#6a625a'], 36);
    g.fillStyle = '#5c544c';
    g.fillRect(0, 13, T, 3); g.fillRect(2, 3, 2, 2); g.fillRect(10, 7, 3, 2); g.fillRect(5, 9, 2, 2);
    g.fillStyle = '#948a80'; g.fillRect(3, 2, 2, 1); g.fillRect(11, 6, 2, 1);
  });
  tile('snowmountain', (g, r) => {
    g.fillStyle = '#8c8ea0'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#82849a', '#989aac'], 26);
    g.fillStyle = '#e8ecf2'; g.fillRect(0, 0, T, 4); g.fillRect(2, 4, 4, 2); g.fillRect(10, 4, 4, 1);
    g.fillStyle = '#6a6c80'; g.fillRect(0, 13, T, 3);
  });
  // cave / dungeon
  tile('cavefloor', (g, r) => {
    g.fillStyle = '#5c5248'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#544b42', '#665b50', '#4c443c'], 42);
  });
  tile('cavewall', (g, r) => {
    g.fillStyle = '#38302a'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#332c26', '#3e352e'], 30);
    g.fillStyle = '#463c34'; g.fillRect(0, 0, T, 3);
    g.fillStyle = '#241e1a'; g.fillRect(0, 13, T, 3);
    g.fillRect(3, 5, 2, 2); g.fillRect(10, 8, 3, 2);
  });
  tile('cryptfloor', (g, r) => {
    g.fillStyle = '#6a6a78'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#5a5a68'; g.fillRect(0, 7, T, 1); g.fillRect(0, 15, T, 1);
    g.fillRect(7, 0, 1, 8); g.fillRect(2, 8, 1, 8); g.fillRect(11, 8, 1, 8);
    speckle(g, r, ['#62626f', '#727282'], 22);
  });
  tile('cryptwall', (g, r) => {
    g.fillStyle = '#3c3c4c'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#2c2c3a'; g.fillRect(0, 5, T, 1); g.fillRect(0, 11, T, 1);
    g.fillRect(5, 0, 1, 5); g.fillRect(11, 6, 1, 5); g.fillRect(3, 12, 1, 4);
    g.fillStyle = '#48485c'; g.fillRect(1, 1, 3, 1); g.fillRect(7, 7, 3, 1);
    speckle(g, r, ['#383848', '#404054'], 16);
  });
  tile('icefloor', (g, r) => {
    g.fillStyle = '#b8d8ec'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#aacee6', '#c8e4f4', '#9cc2dc'], 30);
    g.fillStyle = '#e0f2fc'; g.fillRect(2, 3, 4, 1); g.fillRect(9, 10, 4, 1);
    g.fillStyle = '#8cb4d4'; g.fillRect(6, 8, 5, 1); g.fillRect(10, 9, 1, 3);
  });
  tile('icewall', (g, r) => {
    g.fillStyle = '#4a7cb0'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#5c92c8'; g.fillRect(0, 0, T, 3); g.fillRect(2, 5, 2, 4); g.fillRect(10, 7, 2, 4);
    g.fillStyle = '#38618c'; g.fillRect(0, 13, T, 3);
    g.fillStyle = '#8cc2e8'; g.fillRect(4, 1, 2, 1); g.fillRect(12, 2, 2, 1);
  });
  tile('firefloor', (g, r) => {
    g.fillStyle = '#6e4034'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#643a2f', '#784639', '#5a342a'], 40);
    if (r() < .6) { g.fillStyle = '#a85a2a'; g.fillRect((r() * 13) | 0, (r() * 13) | 0, 2, 1); }
  });
  tile('firewall', (g, r) => {
    g.fillStyle = '#42221c'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#542c22'; g.fillRect(0, 0, T, 3);
    g.fillStyle = '#301612'; g.fillRect(0, 13, T, 3);
    g.fillStyle = '#d84a1a'; g.fillRect(4, 6, 2, 1); g.fillRect(10, 9, 3, 1); // ember cracks
    speckle(g, r, ['#3a1e18', '#4c2820'], 22);
  });
  tile('demonfloor', (g, r) => {
    g.fillStyle = '#4a2c48'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#3e243c'; g.fillRect(0, 7, T, 1); g.fillRect(7, 0, 1, 8); g.fillRect(3, 8, 1, 8);
    speckle(g, r, ['#442a44', '#523252'], 24);
    if (r() < .4) { g.fillStyle = '#b45fe0'; g.fillRect((r() * 13) | 0, (r() * 13) | 0, 2, 1); }
  });
  tile('demonwall', (g, r) => {
    g.fillStyle = '#2c1a30'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#3a2440'; g.fillRect(0, 0, T, 3); g.fillRect(3, 5, 2, 3); g.fillRect(11, 8, 2, 3);
    g.fillStyle = '#1c1020'; g.fillRect(0, 13, T, 3);
    g.fillStyle = '#8a4fc8'; g.fillRect(6, 7, 1, 2); g.fillRect(13, 3, 1, 2);
  });
  // buildings
  tile('floorwood', (g, r) => {
    g.fillStyle = '#b0803e'; g.fillRect(0, 0, T, T);
    for (let y = 0; y < T; y += 4) {
      g.fillStyle = '#8f6730'; g.fillRect(0, y + 3, T, 1);
      g.fillStyle = '#c08c46'; g.fillRect(0, y, T, 1);
    }
    speckle(g, r, ['#a87a3a', '#b88844'], 18);
    g.fillStyle = '#7a5828'; g.fillRect(5, 1, 1, 3); g.fillRect(12, 9, 1, 3);
  });
  tile('floorstone', (g, r) => {
    g.fillStyle = '#98948c'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#84807a'; g.fillRect(0, 7, T, 1); g.fillRect(0, 15, T, 1);
    g.fillRect(7, 0, 1, 8); g.fillRect(3, 8, 1, 8); g.fillRect(12, 8, 1, 8);
    speckle(g, r, ['#8e8a83', '#a29e96'], 20);
  });
  tile('carpet', (g, r) => {
    g.fillStyle = '#a82a34'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#9c2530', '#b23540'], 22);
    g.fillStyle = '#d8b04a'; g.fillRect(0, 0, T, 1); g.fillRect(0, 15, T, 1);
  });
  tile('carpetC', (g, r) => {
    g.fillStyle = '#a82a34'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#9c2530', '#b23540'], 22);
    g.fillStyle = '#d8b04a'; g.fillRect(7, 3, 2, 2); g.fillRect(5, 7, 2, 2); g.fillRect(9, 7, 2, 2); g.fillRect(7, 11, 2, 2);
  });
  tile('wallwood', (g, r) => {
    g.fillStyle = '#8a5a2c'; g.fillRect(0, 0, T, T);
    for (let x = 0; x < T; x += 4) { g.fillStyle = '#6e461f'; g.fillRect(x + 3, 0, 1, T); }
    g.fillStyle = '#a06a35'; g.fillRect(0, 0, T, 2);
    g.fillStyle = '#5c3a18'; g.fillRect(0, 14, T, 2);
    speckle(g, r, ['#815427', '#936030'], 16);
  });
  tile('wallstone', (g, r) => {
    g.fillStyle = '#8c8880'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#767268'; g.fillRect(0, 5, T, 1); g.fillRect(0, 11, T, 1);
    g.fillRect(5, 0, 1, 5); g.fillRect(11, 6, 1, 5); g.fillRect(3, 12, 1, 4); g.fillRect(13, 12, 1, 4);
    g.fillStyle = '#9c988f'; g.fillRect(1, 1, 3, 1); g.fillRect(7, 7, 3, 1);
    g.fillStyle = '#68645c'; g.fillRect(0, 15, T, 1);
  });
  tile('castlewall', (g, r) => {
    g.fillStyle = '#a0a4b0'; g.fillRect(0, 0, T, T);
    g.fillStyle = '#888c9a'; g.fillRect(0, 5, T, 1); g.fillRect(0, 11, T, 1);
    g.fillRect(5, 0, 1, 5); g.fillRect(11, 6, 1, 5); g.fillRect(3, 12, 1, 4);
    g.fillStyle = '#b4b8c4'; g.fillRect(1, 1, 3, 1); g.fillRect(7, 7, 2, 1);
    g.fillStyle = '#70747f'; g.fillRect(0, 15, T, 1);
  });
  function roofTile(base, dark, light) {
    return (g, r) => {
      g.fillStyle = base; g.fillRect(0, 0, T, T);
      for (let y = 0; y < T; y += 4) {
        g.fillStyle = dark; g.fillRect(0, y + 3, T, 1);
        for (let x = ((y / 4) % 2) * 4; x < T; x += 8) g.fillRect(x, y, 1, 3);
        g.fillStyle = light; g.fillRect(0, y, T, 1);
      }
    };
  }
  tile('roofR', roofTile('#c04a38', '#8a2e20', '#d8604a'));
  tile('roofB', roofTile('#4a68b0', '#2e4680', '#6084c8'));
  tile('roofP', roofTile('#8a4fc8', '#5c2f8a', '#a26ad8'));
  tile('roofG', roofTile('#4fa04a', '#2e6e2c', '#66b858'));
  tile('roofY', roofTile('#d8a83a', '#a07820', '#e8c05a'));
  tile('door', (g) => {
    g.fillStyle = '#6e421f'; g.fillRect(2, 1, 12, 15);
    g.fillStyle = '#8a5a2c'; g.fillRect(3, 2, 10, 13);
    g.fillStyle = '#5c3a18'; g.fillRect(7, 2, 1, 13); g.fillRect(3, 7, 10, 1);
    g.fillStyle = '#f2c14b'; g.fillRect(9, 9, 2, 2);
    g.fillStyle = '#221507'; g.fillRect(2, 1, 12, 1); g.fillRect(2, 1, 1, 15); g.fillRect(13, 1, 1, 15);
  });
  tile('window', (g) => {
    g.fillStyle = '#8a5a2c'; g.fillRect(0, 0, T, T);
    for (let x = 0; x < T; x += 4) { g.fillStyle = '#6e461f'; g.fillRect(x + 3, 0, 1, T); }
    g.fillStyle = '#221507'; g.fillRect(3, 3, 10, 9);
    g.fillStyle = '#8cc8e8'; g.fillRect(4, 4, 8, 7);
    g.fillStyle = '#c8e8f8'; g.fillRect(4, 4, 3, 2);
    g.fillStyle = '#221507'; g.fillRect(7, 4, 1, 7); g.fillRect(4, 7, 8, 1);
    g.fillStyle = '#a06a35'; g.fillRect(3, 12, 10, 2);
  });
  tile('bridge', (g, r) => {
    g.fillStyle = '#a06a35'; g.fillRect(0, 0, T, T);
    for (let y = 0; y < T; y += 4) { g.fillStyle = '#7a4a22'; g.fillRect(0, y + 3, T, 1); }
    g.fillStyle = '#5c3a18'; g.fillRect(0, 0, 2, T); g.fillRect(14, 0, 2, T);
    speckle(g, r, ['#96632f', '#aa723a'], 14);
  });
  tile('fence', (g) => {
    g.fillStyle = '#8a5a2c'; g.fillRect(1, 4, 2, 10); g.fillRect(7, 4, 2, 10); g.fillRect(13, 4, 2, 10);
    g.fillStyle = '#a06a35'; g.fillRect(0, 6, T, 2); g.fillRect(0, 10, T, 2);
    g.fillStyle = '#5c3a18'; g.fillRect(1, 13, 2, 1); g.fillRect(7, 13, 2, 1); g.fillRect(13, 13, 2, 1);
  });
  tile('arenasand', (g, r) => {
    g.fillStyle = '#d8b478'; g.fillRect(0, 0, T, T);
    speckle(g, r, ['#ccaa6c', '#e0c084', '#c4a062'], 40);
  });
  tile('farm', (g, r) => {
    g.fillStyle = '#8a6236'; g.fillRect(0, 0, T, T);
    for (let y = 1; y < T; y += 4) { g.fillStyle = '#75512c'; g.fillRect(0, y, T, 2); }
    speckle(g, r, ['#815b32', '#93693a'], 20);
    if (r() < .7) { g.fillStyle = '#63b858'; g.fillRect(3, 2, 1, 2); g.fillRect(9, 6, 1, 2); g.fillRect(6, 10, 1, 2); }
  });

  // ---- big/overlay props (16x16 or 16x24, drawn as objects) ----
  const props = PXA.props = {};
  function prop(name, w, h, fn) {
    const c = mkCanvas(w, h), g = ctx2d(c);
    fn(g, mulberry(name.length * 613 + 7));
    props[name] = c;
  }
  prop('tree', 16, 24, (g, r) => {
    g.fillStyle = '#5c3a18'; g.fillRect(6, 15, 4, 8);
    g.fillStyle = '#7a4a22'; g.fillRect(7, 15, 2, 8);
    g.fillStyle = '#276022';
    g.fillRect(2, 4, 12, 10); g.fillRect(4, 1, 8, 4); g.fillRect(0, 7, 16, 5);
    g.fillStyle = '#3f8c3a';
    g.fillRect(3, 4, 9, 8); g.fillRect(5, 2, 6, 3); g.fillRect(1, 8, 13, 3);
    g.fillStyle = '#66b053';
    g.fillRect(5, 3, 4, 2); g.fillRect(3, 7, 3, 2); g.fillRect(9, 6, 3, 2); g.fillRect(6, 10, 3, 1);
    speckle(g, r, ['#2f7029', '#54a047'], 20);
  });
  prop('pine', 16, 24, (g, r) => {
    g.fillStyle = '#5c3a18'; g.fillRect(7, 19, 2, 5);
    g.fillStyle = '#1e5c34';
    g.fillRect(6, 0, 4, 3); g.fillRect(4, 3, 8, 4); g.fillRect(2, 7, 12, 5); g.fillRect(1, 12, 14, 7);
    g.fillStyle = '#2e7c46';
    g.fillRect(7, 0, 2, 2); g.fillRect(5, 3, 4, 3); g.fillRect(3, 7, 6, 4); g.fillRect(2, 12, 8, 5);
    g.fillStyle = '#4a9c5c'; g.fillRect(7, 1, 1, 1); g.fillRect(5, 4, 2, 1); g.fillRect(4, 8, 2, 2); g.fillRect(3, 13, 3, 2);
    g.fillStyle = '#e8ecf2';
    if (r() < .45) { g.fillRect(6, 0, 4, 1); g.fillRect(4, 3, 3, 1); g.fillRect(9, 7, 3, 1); }
  });
  prop('palm', 16, 24, (g) => {
    g.fillStyle = '#8a6236'; g.fillRect(7, 8, 3, 16);
    g.fillStyle = '#a8804a'; g.fillRect(8, 8, 1, 16);
    g.fillStyle = '#3f8c3a';
    g.fillRect(2, 4, 6, 2); g.fillRect(8, 2, 7, 2); g.fillRect(1, 8, 5, 2); g.fillRect(10, 6, 5, 3);
    g.fillRect(5, 1, 5, 3); g.fillRect(6, 5, 4, 4);
    g.fillStyle = '#66b053'; g.fillRect(6, 2, 3, 2); g.fillRect(3, 5, 3, 1); g.fillRect(11, 4, 3, 1);
  });
  prop('deadtree', 16, 24, (g) => {
    g.fillStyle = '#4a3a30'; g.fillRect(7, 6, 3, 18);
    g.fillRect(4, 4, 3, 2); g.fillRect(3, 2, 2, 3); g.fillRect(10, 7, 4, 2); g.fillRect(13, 4, 2, 4);
    g.fillRect(6, 1, 2, 6);
    g.fillStyle = '#5c4a3e'; g.fillRect(8, 6, 1, 18); g.fillRect(6, 2, 1, 4);
  });
  prop('cactus', 16, 20, (g) => {
    g.fillStyle = '#3a8c46'; g.fillRect(6, 2, 4, 18);
    g.fillRect(1, 6, 3, 3); g.fillRect(2, 6, 2, 7); g.fillRect(4, 11, 2, 2);
    g.fillRect(12, 4, 3, 3); g.fillRect(12, 4, 2, 6); g.fillRect(10, 8, 2, 2);
    g.fillStyle = '#54ac5c'; g.fillRect(7, 2, 1, 18); g.fillRect(2, 6, 1, 6);
    g.fillStyle = '#e8f0c0'; g.fillRect(6, 4, 1, 1); g.fillRect(9, 8, 1, 1); g.fillRect(7, 13, 1, 1);
  });
  prop('rock', 16, 16, (g, r) => {
    g.fillStyle = '#7c7268'; g.fillRect(3, 6, 10, 8);
    g.fillRect(5, 4, 6, 3);
    g.fillStyle = '#948a80'; g.fillRect(5, 5, 4, 2); g.fillRect(4, 7, 3, 2);
    g.fillStyle = '#5c544c'; g.fillRect(9, 9, 3, 4); g.fillRect(4, 12, 8, 2);
    g.fillStyle = '#221507'; g.fillRect(3, 13, 10, 1);
  });
  prop('crystal', 16, 16, (g) => {
    g.fillStyle = '#6ad4e8';
    g.fillRect(6, 2, 3, 10); g.fillRect(3, 6, 3, 7); g.fillRect(10, 5, 3, 8);
    g.fillStyle = '#b8f0f8'; g.fillRect(7, 2, 1, 9); g.fillRect(4, 6, 1, 6);
    g.fillStyle = '#3a8ca8'; g.fillRect(8, 4, 1, 8); g.fillRect(12, 6, 1, 7);
    g.fillStyle = '#2c5c74'; g.fillRect(3, 13, 10, 1);
  });
  prop('chest', 16, 16, (g) => {
    g.fillStyle = '#221507'; g.fillRect(1, 4, 14, 11);
    g.fillStyle = '#8a5a2c'; g.fillRect(2, 5, 12, 9);
    g.fillStyle = '#a06a35'; g.fillRect(2, 5, 12, 3);
    g.fillStyle = '#5c3a18'; g.fillRect(2, 8, 12, 1);
    g.fillStyle = '#f2c14b'; g.fillRect(6, 7, 4, 4); g.fillRect(7, 11, 2, 2);
    g.fillStyle = '#b0812a'; g.fillRect(7, 9, 2, 2);
    g.fillStyle = '#f2c14b'; g.fillRect(2, 13, 12, 1);
  });
  prop('chestopen', 16, 16, (g) => {
    g.fillStyle = '#221507'; g.fillRect(1, 2, 14, 13);
    g.fillStyle = '#5c3a18'; g.fillRect(2, 3, 12, 3);
    g.fillStyle = '#181008'; g.fillRect(2, 6, 12, 4);
    g.fillStyle = '#8a5a2c'; g.fillRect(2, 10, 12, 4);
    g.fillStyle = '#f2c14b'; g.fillRect(2, 13, 12, 1); g.fillRect(6, 3, 4, 2);
  });
  prop('sign', 16, 16, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(7, 8, 2, 8);
    g.fillStyle = '#a06a35'; g.fillRect(2, 2, 12, 7);
    g.fillStyle = '#8a5a2c'; g.fillRect(3, 3, 10, 5);
    g.fillStyle = '#5c3a18'; g.fillRect(4, 4, 8, 1); g.fillRect(4, 6, 6, 1);
    g.fillStyle = '#221507'; g.fillRect(2, 2, 12, 1); g.fillRect(2, 8, 12, 1);
  });
  prop('anvil', 16, 16, (g) => {
    g.fillStyle = '#4c5058'; g.fillRect(3, 5, 10, 3); g.fillRect(11, 4, 4, 3); g.fillRect(1, 5, 3, 2);
    g.fillStyle = '#6a707a'; g.fillRect(3, 5, 10, 1); g.fillRect(11, 4, 4, 1);
    g.fillStyle = '#383c44'; g.fillRect(6, 8, 4, 3);
    g.fillStyle = '#4c5058'; g.fillRect(4, 11, 8, 3);
    g.fillStyle = '#221507'; g.fillRect(4, 14, 8, 1);
  });
  prop('well', 16, 16, (g) => {
    g.fillStyle = '#8c8880'; g.fillRect(2, 8, 12, 6);
    g.fillStyle = '#767268'; g.fillRect(2, 11, 12, 1); g.fillRect(5, 8, 1, 6); g.fillRect(10, 8, 1, 6);
    g.fillStyle = '#221507'; g.fillRect(4, 9, 8, 2);
    g.fillStyle = '#3f74c8'; g.fillRect(5, 10, 6, 1);
    g.fillStyle = '#5c3a18'; g.fillRect(2, 2, 2, 7); g.fillRect(12, 2, 2, 7);
    g.fillStyle = '#8a2e20'; g.fillRect(1, 0, 14, 3);
    g.fillStyle = '#c04a38'; g.fillRect(2, 0, 12, 2);
  });
  prop('fountain', 16, 16, (g) => {
    g.fillStyle = '#a8a4a0'; g.fillRect(1, 6, 14, 9);
    g.fillStyle = '#8c8880'; g.fillRect(1, 13, 14, 2);
    g.fillStyle = '#3f74c8'; g.fillRect(3, 8, 10, 5);
    g.fillStyle = '#7aa8e8'; g.fillRect(4, 8, 3, 1); g.fillRect(9, 10, 3, 1);
    g.fillStyle = '#a8a4a0'; g.fillRect(6, 2, 4, 6);
    g.fillStyle = '#c8e8f8'; g.fillRect(7, 0, 2, 3); g.fillRect(5, 3, 1, 2); g.fillRect(10, 3, 1, 2);
  });
  prop('statue', 16, 20, (g) => {
    g.fillStyle = '#a8a4a0'; g.fillRect(3, 16, 10, 3);
    g.fillStyle = '#8c8880'; g.fillRect(4, 14, 8, 2);
    g.fillStyle = '#b4b0ac'; g.fillRect(6, 2, 4, 4); // head
    g.fillRect(5, 6, 6, 6); g.fillRect(3, 6, 2, 5); g.fillRect(11, 7, 3, 2); // body+arms (sword raised)
    g.fillRect(12, 2, 2, 6);
    g.fillStyle = '#8c8880'; g.fillRect(6, 12, 2, 2); g.fillRect(9, 12, 2, 2);
    g.fillStyle = '#221507'; g.fillRect(3, 19, 10, 1);
  });
  prop('grave', 16, 16, (g) => {
    g.fillStyle = '#8c8880'; g.fillRect(4, 3, 8, 10);
    g.fillStyle = '#a8a4a0'; g.fillRect(5, 2, 6, 2); g.fillRect(5, 4, 2, 8);
    g.fillStyle = '#68645c'; g.fillRect(6, 6, 4, 1); g.fillRect(6, 8, 4, 1);
    g.fillStyle = '#4f9c48'; g.fillRect(3, 13, 10, 2);
  });
  prop('bones', 16, 16, (g) => {
    g.fillStyle = '#e8e0c8'; g.fillRect(3, 10, 6, 2); g.fillRect(2, 9, 2, 4);
    g.fillRect(10, 5, 4, 4);
    g.fillStyle = '#b0a684'; g.fillRect(11, 7, 1, 1); g.fillRect(13, 7, 1, 1);
    g.fillRect(3, 11, 6, 1);
  });
  prop('stall', 32, 26, (g, r) => {
    // market stall: striped awning + counter
    g.fillStyle = '#5c3a18'; g.fillRect(2, 8, 3, 16); g.fillRect(27, 8, 3, 16);
    for (let x = 0; x < 32; x += 8) {
      g.fillStyle = '#c04a38'; g.fillRect(x, 0, 4, 7);
      g.fillStyle = '#f0e8d8'; g.fillRect(x + 4, 0, 4, 7);
    }
    g.fillStyle = '#8a2e20'; g.fillRect(0, 7, 32, 2);
    g.fillStyle = '#a06a35'; g.fillRect(2, 16, 28, 8);
    g.fillStyle = '#7a4a22'; g.fillRect(2, 20, 28, 1);
    g.fillStyle = '#f2c14b'; g.fillRect(6, 17, 3, 3);
    g.fillStyle = '#e85a5a'; g.fillRect(13, 17, 3, 3);
    g.fillStyle = '#8cc8e8'; g.fillRect(21, 17, 3, 3);
  });
  prop('banner', 8, 20, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(3, 0, 2, 20);
    g.fillStyle = '#8a2417'; g.fillRect(0, 1, 8, 12);
    g.fillStyle = '#c8402e'; g.fillRect(1, 2, 6, 10);
    g.fillStyle = '#f2c14b'; g.fillRect(3, 4, 2, 5); g.fillRect(2, 6, 4, 2);
  });
  prop('bannerdemon', 8, 20, (g) => {
    g.fillStyle = '#2c1a30'; g.fillRect(3, 0, 2, 20);
    g.fillStyle = '#3a2440'; g.fillRect(0, 1, 8, 12);
    g.fillStyle = '#57297c'; g.fillRect(1, 2, 6, 10);
    g.fillStyle = '#e05050'; g.fillRect(3, 4, 2, 2); g.fillRect(2, 6, 4, 2); g.fillRect(3, 9, 2, 1);
  });
  prop('throne', 16, 20, (g) => {
    g.fillStyle = '#f2c14b'; g.fillRect(3, 0, 10, 16);
    g.fillStyle = '#b0812a'; g.fillRect(3, 0, 2, 16); g.fillRect(11, 0, 2, 16);
    g.fillStyle = '#c8402e'; g.fillRect(5, 2, 6, 11);
    g.fillStyle = '#8a2417'; g.fillRect(5, 2, 6, 1);
    g.fillStyle = '#f2c14b'; g.fillRect(2, 14, 12, 4);
    g.fillStyle = '#b0812a'; g.fillRect(2, 17, 12, 1);
    g.fillStyle = '#ffdf8e'; g.fillRect(4, 0, 1, 2); g.fillRect(7, 0, 2, 2); g.fillRect(11, 0, 1, 2);
  });
  prop('bed', 16, 20, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(2, 1, 12, 18);
    g.fillStyle = '#8a5a2c'; g.fillRect(3, 2, 10, 16);
    g.fillStyle = '#f0e8d8'; g.fillRect(3, 3, 10, 5);
    g.fillStyle = '#c8402e'; g.fillRect(3, 8, 10, 9);
    g.fillStyle = '#8a2417'; g.fillRect(3, 8, 10, 1); g.fillRect(3, 13, 10, 1);
  });
  prop('table', 16, 16, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(2, 4, 2, 10); g.fillRect(12, 4, 2, 10);
    g.fillStyle = '#a06a35'; g.fillRect(1, 2, 14, 4);
    g.fillStyle = '#c08c46'; g.fillRect(1, 2, 14, 1);
    g.fillStyle = '#7a4a22'; g.fillRect(1, 5, 14, 1);
  });
  prop('torch', 8, 16, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(3, 6, 2, 9);
    g.fillStyle = '#8a5a2c'; g.fillRect(3, 6, 1, 9);
    g.fillStyle = '#d84a1a'; g.fillRect(2, 2, 4, 4);
    g.fillStyle = '#f8c83a'; g.fillRect(3, 3, 2, 3);
    g.fillStyle = '#f8ea90'; g.fillRect(3, 4, 1, 1);
  });
  prop('portal', 24, 28, (g) => {
    g.fillStyle = '#2c1a30'; g.fillRect(2, 0, 20, 28);
    g.fillStyle = '#57297c'; g.fillRect(4, 2, 16, 24);
    g.fillStyle = '#8a4fc8'; g.fillRect(6, 4, 12, 20);
    g.fillStyle = '#c88ae8'; g.fillRect(8, 6, 8, 16);
    g.fillStyle = '#f0d8ff'; g.fillRect(10, 9, 4, 10);
  });
  prop('dummy', 16, 20, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(7, 10, 2, 9);
    g.fillStyle = '#d8b078'; g.fillRect(4, 2, 8, 8);
    g.fillStyle = '#a8804a'; g.fillRect(4, 6, 8, 1); g.fillRect(7, 2, 1, 8);
    g.fillStyle = '#8a5a2c'; g.fillRect(1, 5, 3, 2); g.fillRect(12, 5, 3, 2);
    g.fillStyle = '#221507'; g.fillRect(6, 19, 4, 1);
  });
  prop('herbbush', 16, 16, (g, r) => {
    g.fillStyle = '#2c6428'; g.fillRect(3, 8, 10, 6);
    g.fillStyle = '#4fa04a'; g.fillRect(4, 7, 8, 5);
    g.fillStyle = '#7de07a'; g.fillRect(5, 5, 2, 3); g.fillRect(9, 4, 2, 4); g.fillRect(7, 8, 2, 2);
    g.fillStyle = '#b8f0a0'; g.fillRect(6, 5, 1, 1); g.fillRect(10, 5, 1, 1);
  });
  prop('orevein', 16, 16, (g, r) => {
    g.fillStyle = '#7c7268'; g.fillRect(2, 5, 12, 9);
    g.fillRect(4, 3, 8, 3);
    g.fillStyle = '#5c544c'; g.fillRect(9, 9, 4, 4); g.fillRect(3, 12, 9, 2);
    g.fillStyle = '#8cc2e8'; g.fillRect(5, 6, 2, 2); g.fillRect(9, 5, 2, 2); g.fillRect(7, 10, 2, 2);
    g.fillStyle = '#d8ecfc'; g.fillRect(5, 6, 1, 1); g.fillRect(9, 5, 1, 1);
    g.fillStyle = '#221507'; g.fillRect(2, 13, 12, 1);
  });
  prop('magickstone', 16, 16, (g) => {
    g.fillStyle = '#57297c'; g.fillRect(5, 4, 6, 9);
    g.fillStyle = '#8a4fc8'; g.fillRect(6, 3, 4, 9);
    g.fillStyle = '#c88ae8'; g.fillRect(7, 4, 2, 6);
    g.fillStyle = '#f0d8ff'; g.fillRect(7, 5, 1, 3);
    g.fillStyle = '#221507'; g.fillRect(5, 13, 6, 1);
  });
  prop('campfire', 16, 16, (g) => {
    g.fillStyle = '#5c3a18'; g.fillRect(2, 11, 12, 2); g.fillRect(4, 13, 8, 1);
    g.fillStyle = '#d84a1a'; g.fillRect(5, 4, 6, 7);
    g.fillStyle = '#f8c83a'; g.fillRect(6, 6, 4, 5);
    g.fillStyle = '#f8ea90'; g.fillRect(7, 8, 2, 3);
  });

  // ============================================================
  // HERO SPRITES — hand-authored humanoid, palette-swapped
  // char legend: H hair-light h hair-dark  S skin s skin-shadow
  //              E eye  A armor a armor-dark  T trim
  //              P pants  B boots  W hand/skin
  // ============================================================
  const HERO_DOWN = [
    '................',
    '.....hhhhhh.....',
    '....hHHHHHHh....',
    '...hHHHHHHHHh...',
    '...hHHHHHHHHh...',
    '...hHSSSSSShh...',
    '...hSESSSSES....',
    '...hSESSSSES....',
    '....SSSssSSS....',
    '.....SSSSSS.....',
    '....AAAAAAAA....',
    '...AAAAAAAAAA...',
    '..WAAaAAAAaAAW..',
    '..WAAAAAAAAAAW..',
    '..WAaAATTAAaAW..',
    '....aTTTTTTa....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....BBB..BBB....',
    '....BBB..BBB....',
  ];
  const HERO_UP = [
    '................',
    '.....hhhhhh.....',
    '....hHHHHHHh....',
    '...hHHHHHHHHh...',
    '...hHHHHHHHHh...',
    '...hHHHHHHHHh...',
    '...hhHHHHHHhh...',
    '...hhHHHHHHhh...',
    '....hHHHHHHh....',
    '.....SSSSSS.....',
    '....AAAAAAAA....',
    '...AAAAAAAAAA...',
    '..WAAaAAAAaAAW..',
    '..WAAAAAAAAAAW..',
    '..WAaAAAAAAaAW..',
    '....aTTTTTTa....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....BBB..BBB....',
    '....BBB..BBB....',
  ];
  const HERO_SIDE = [ // facing right
    '................',
    '.....hhhhhh.....',
    '....hHHHHHHh....',
    '....hHHHHHHHh...',
    '....hHHHHHHHh...',
    '....hhSSSSSS....',
    '....hhSSESSS....',
    '....hhSSESSS....',
    '.....hSSSSS.....',
    '......SSSS......',
    '.....AAAAAA.....',
    '....AAAAAAAA....',
    '....AAaAAaAA....',
    '....AAAAAAAAW...',
    '....AaAAAAaA....',
    '.....aTTTTa.....',
    '.....PPPPP......',
    '.....PPPPP......',
    '.....PP.PPP.....',
    '.....BB.BBB.....',
    '.....BB.BBB.....',
  ];
  // walk frames: swap leg rows (16..20)
  function heroWalkFrames(rows) {
    const a = rows.slice();
    const b = rows.slice();
    // frame A: left leg forward (shift left cols of leg rows up visually -> raise right boot)
    for (let i = 16; i < rows.length; i++) {
      a[i] = shiftRows([rows[i]], 0, 0, 1)[0];
      b[i] = shiftRows([rows[i]], 0, 0, -1)[0];
    }
    // lift feet: blank last row alternately for step bounce
    const blank = '.'.repeat(rows[0].length);
    const a2 = a.slice(); a2[rows.length - 1] = a2[rows.length - 1].replace(/B/g, (m, i) => m); // keep
    return [rows, a, b];
  }

  const HAIRS = PXA.HAIRS = [
    ['#6e421f', '#8a5a2c'], ['#2c1c10', '#4a3220'], ['#c8402e', '#e0653f'],
    ['#d8a83a', '#f2c14b'], ['#8c8880', '#b4b0ac'], ['#3b6fd0', '#6a94e0'],
    ['#57297c', '#8a4fc8'], ['#2c6428', '#4fa04a'],
  ];
  const SKINS = PXA.SKINS = [
    ['#f4cd9e', '#d9a066'], ['#d9a066', '#b0763c'], ['#b0763c', '#8a5628'], ['#8a5628', '#5c3a1e'],
  ];
  const CLASS_COLORS = {
    swordsman: { A: '#3b6fd0', a: '#22417c', T: '#f2c14b', P: '#5c4632', B: '#4a3220' },
    mage: { A: '#8a4fc8', a: '#57297c', T: '#f2c14b', P: '#57297c', B: '#3c2408' },
    tank: { A: '#b8bcc4', a: '#7c8088', T: '#f2c14b', P: '#5c5c64', B: '#3c3c44' },
    ranger: { A: '#4fa04a', a: '#2c6428', T: '#a8804a', P: '#5c4632', B: '#4a3220' },
  };
  PXA.CLASS_COLORS = CLASS_COLORS;

  function heroPal(look) {
    const cc = CLASS_COLORS[look.cls] || CLASS_COLORS.swordsman;
    const hair = HAIRS[look.hair % HAIRS.length], skin = SKINS[look.skin % SKINS.length];
    return {
      H: hair[1], h: hair[0],
      S: skin[0], s: skin[1], W: skin[0],
      E: '#26180c',
      A: look.armorColor || cc.A, a: look.armorDark || cc.a, T: cc.T,
      P: cc.P, B: cc.B,
    };
  }

  // small class-specific overlays (drawn on top of body)
  function heroOverlay(cls, facing) {
    const c = mkCanvas(16, 21), g = ctx2d(c);
    if (cls === 'mage') { // pointed hat
      g.fillStyle = '#57297c';
      g.fillRect(3, 2, 10, 2);
      g.fillStyle = '#8a4fc8';
      g.fillRect(5, 0, 6, 3); g.fillRect(7, -1 + 1, 2, 1);
      g.fillStyle = '#f2c14b'; g.fillRect(3, 3, 10, 1);
      if (facing !== 'up') { g.fillStyle = '#f2c14b'; g.fillRect(7, 1, 1, 1); }
    } else if (cls === 'tank') { // heavy pauldrons
      g.fillStyle = '#dce4ec';
      g.fillRect(2, 10, 3, 3); g.fillRect(11, 10, 3, 3);
      g.fillStyle = '#98a4b0'; g.fillRect(2, 12, 3, 1); g.fillRect(11, 12, 3, 1);
    } else if (cls === 'swordsman') { // headband
      g.fillStyle = '#c8402e'; g.fillRect(3, 4, 10, 1);
    } else if (cls === 'ranger') { // hood strap + feather
      g.fillStyle = '#2c6428'; g.fillRect(3, 4, 10, 1);
      g.fillStyle = '#f2d34b'; g.fillRect(12, 1, 1, 3);
    }
    return c;
  }

  // Build full hero sheet {down:[3], up:[3], right:[3], left:[3], portrait}
  PXA.makeHero = function (look) {
    const pal = heroPal(look);
    function buildFacing(rows, facing) {
      const frames = heroWalkFrames(rows);
      return frames.map(fr => {
        const body = px(fr, pal, 16);
        const g = ctx2d(body);
        g.drawImage(heroOverlay(look.cls, facing), 0, 0);
        return outline(body);
      });
    }
    const down = buildFacing(HERO_DOWN, 'down');
    const up = buildFacing(HERO_UP, 'up');
    const right = buildFacing(HERO_SIDE, 'side');
    const left = right.map(flipH);
    // portrait: head area blown up
    const portrait = mkCanvas(20, 20), pg = ctx2d(portrait);
    pg.drawImage(down[0], 0, 0, 18, 11, 1, 3, 20, 13);
    return { down, up, right, left, portrait, w: 18, h: 23 };
  };

  // NPC palettes: villagers, guards, etc. reuse the hero body
  PXA.makeNPC = function (spec) {
    return PXA.makeHero(Object.assign({ hair: 0, skin: 0, cls: 'swordsman' }, spec));
  };

  // ============================================================
  // WEAPONS (16x16, drawn pointing up; rotated at draw time)
  // ============================================================
  const weaponArts = {
    sword: {
      pal: { b: '#dce4ec', d: '#98a4b0', g: '#f2c14b', h: '#6e421f', o: C.o },
      rows: [
        '.......bb.......',
        '.......bb.......',
        '......bbd.......',
        '......bbd.......',
        '......bbd.......',
        '......bbd.......',
        '......bbd.......',
        '......bbd.......',
        '......bbd.......',
        '.....gggggg.....',
        '.......hh.......',
        '.......hh.......',
        '.......hh.......',
        '......gggg......',
        '................',
        '................'],
    },
    staff: {
      pal: { w: '#8a5a2c', d: '#5c3a18', c: '#6ad4e8', l: '#c8f4fc', o: C.o },
      rows: [
        '......cccc......',
        '.....cclccc.....',
        '.....clllcc.....',
        '.....ccllcc.....',
        '......cccc......',
        '.......ww.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '.......wd.......',
        '................'],
    },
    mace: {
      pal: { m: '#7c8088', l: '#b8bcc4', h: '#6e421f', d: '#5c3a18', o: C.o },
      rows: [
        '......mmmm......',
        '.....mllmmm.....',
        '....mmlmmmmm....',
        '....mmmmmmmm....',
        '....mmmmmmmm....',
        '.....mmmmmm.....',
        '......mmmm......',
        '.......hh.......',
        '.......hd.......',
        '.......hd.......',
        '.......hd.......',
        '.......hd.......',
        '.......hd.......',
        '.......hd.......',
        '................',
        '................'],
    },
    bow: {
      pal: { w: '#8a5a2c', l: '#a8804a', s: '#f0e8d8', o: C.o },
      rows: [
        '......ww........',
        '.....wl.s.......',
        '....wl..s.......',
        '....wl..s.......',
        '...wl...s.......',
        '...wl...s.......',
        '...wl...s.......',
        '...wl...s.......',
        '...wl...s.......',
        '....wl..s.......',
        '....wl..s.......',
        '.....wl.s.......',
        '......ww........',
        '................',
        '................',
        '................'],
    },
    shield: {
      pal: { m: '#b8bcc4', d: '#7c8088', g: '#f2c14b', b: '#3b6fd0', o: C.o },
      rows: [
        '....gggggggg....',
        '...gmmmmmmmmg...',
        '...gmmbbbbmmg...',
        '...gmbbbbbbmg...',
        '...gmbbggbbmg...',
        '...gmbbggbbmg...',
        '...gmbbbbbbmg...',
        '...gmmbbbbmmg...',
        '...gdmmmmmmdg...',
        '....gdmmmmdg....',
        '.....gdmmdg.....',
        '......gddg......',
        '.......gg.......',
        '................',
        '................',
        '................'],
    },
  };
  const weaponCache = {};
  PXA.weapon = function (kind, tint) {
    const key = kind + (tint || '');
    if (weaponCache[key]) return weaponCache[key];
    const a = weaponArts[kind] || weaponArts.sword;
    let pal = a.pal;
    if (tint) { pal = Object.assign({}, a.pal); pal.b = tint.main || pal.b; pal.c = tint.main || pal.c; pal.m = tint.main || pal.m; pal.d = tint.dark || pal.d; pal.l = tint.light || pal.l; }
    const c = outline(px(a.rows, pal, 16));
    weaponCache[key] = c;
    return c;
  };

  // ============================================================
  // MONSTERS — hand pixel art, 2 anim frames generated
  // bodyType: blob | biped | quad | flyer | float
  // ============================================================
  const MOB_ART = {};
  function mob(name, bodyType, pal, rows, rows2) {
    MOB_ART[name] = { bodyType, pal, rows, rows2 };
  }

  mob('slime', 'blob', { g: '#58c04e', d: '#2f8232', l: '#9ce88a', e: '#183c14', w: '#f8f4e8' }, [
    '................',
    '................',
    '................',
    '................',
    '................',
    '......gggg......',
    '....gggggggg....',
    '...glggggggggg..',
    '..gllgggggggggg.',
    '..glgggggggggg..',
    '..ggeeggggeegg..',
    '.ggeweggggewegg.',
    '.gggggggggggggg.',
    '.ggggggddgggggg.',
    '..ggdddddddddg..',
    '...dddddddddd...',
  ]);
  mob('rat', 'quad', { f: '#8a7462', d: '#5f4e40', l: '#a89482', e: '#c03030', t: '#c89ab0', n: '#3c2c20' }, [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '...ff......ff...',
    '..fddf....fdff..',
    '..fffffffffff...',
    '.ffffffffffffn..',
    'ffleffffffffnn..',
    'fflfffffffff....',
    '.ffffffffffftt..',
    '..ff.ff.ff...tt.',
    '..dd.dd.dd....t.',
    '................',
  ]);
  mob('bat', 'flyer', { b: '#5c4a78', d: '#3c2f52', l: '#8a74a8', e: '#e0c040', f: '#c8b4e0' }, [
    '................',
    '................',
    '..bb........bb..',
    '.bbbb......bbbb.',
    '.bbbbb....bbbbb.',
    'bbbbbbb..bbbbbbb',
    'bdddbbbbbbbdddbb',
    'bddbbbbbbbbbddbb',
    '.....bbbbbb.....',
    '....bbebbebb....',
    '....bbbbbbbb....',
    '.....bffffb.....',
    '......bbbb......',
    '................',
    '................',
    '................',
  ], [
    '................',
    '................',
    '................',
    '................',
    '................',
    'bb....bbbb....bb',
    'bbbb.bbbbbb.bbbb',
    'bbbbbbbbbbbbbbbb',
    '.bdddbbbbbbdddb.',
    '..bbbbebbebbbb..',
    '....bbbbbbbb....',
    '.....bffffb.....',
    '......bbbb......',
    '................',
    '................',
    '................',
  ]);
  mob('mushroom', 'biped', { c: '#c84a3a', d: '#8a2e20', w: '#f0e8d8', s: '#e8d8b8', e: '#3c2c20', f: '#c8b494' }, [
    '................',
    '................',
    '................',
    '.....cccccc.....',
    '...cccccccccc...',
    '..ccwwccccwwcc..',
    '..ccwwccccwwcc..',
    '.cccccccccccccc.',
    '.ccddddddddddcc.',
    '....ssssssss....',
    '....ssessess....',
    '....ssssssss....',
    '....sffssffs....',
    '.....ff..ff.....',
    '.....ff..ff.....',
    '................',
  ]);
  mob('goblin', 'biped', { g: '#6aa04a', d: '#44702c', l: '#8cc468', e: '#e0c040', c: '#8a5a2c', p: '#5c3a18', t: '#c8b494' }, [
    '................',
    '...g........g...',
    '..gg........gg..',
    '..ggggggggggggg.',
    '...gggggggggg...',
    '...geggggggeg...',
    '...gegggggge g..'.replace(' ', 'g'),
    '...gggggggggg...',
    '....ggtttggg....',
    '.....cccccc.....',
    '....cccccccc....',
    '...gccccccccg...',
    '...gccccccccg...',
    '.....pp..pp.....',
    '.....pp..pp.....',
    '.....gg..gg.....',
  ]);
  mob('wolf', 'quad', { f: '#8c8880', d: '#5f5c56', l: '#b4b0ac', e: '#e0c040', n: '#2c2824', w: '#f0f0f0' }, [
    '................',
    '................',
    '...ff...........',
    '..fdf..........f',
    '..ffff.....fffff',
    '..fffff..fffffff',
    '.ffeffffffffffdd',
    '.fffffffffffff..',
    'nfffwwfffffff...',
    '.ffffffffffff...',
    '..fffffffffff...',
    '..fff.fff.fff...',
    '..ff...ff..ff...',
    '..dd...dd..dd...',
    '................',
    '................',
  ]);
  mob('skeleton', 'biped', { b: '#e8e0c8', d: '#b0a684', e: '#c03030', k: '#181008' }, [
    '................',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '...bkebbbbekb...',
    '...bkkbbbbkkb...',
    '...bbbbkkbbbb...',
    '....bbkbbkbb....',
    '.....bbbbbb.....',
    '...bbdbbbbdbb...',
    '..bb.bbbbbb.bb..',
    '..bb.bdbbdb.bb..',
    '..d..bbbbbb..d..',
    '.....bd..db.....',
    '.....bb..bb.....',
    '.....dd..dd.....',
  ]);
  mob('zombie', 'biped', { z: '#7a9a6a', d: '#54704a', s: '#8fb47e', e: '#e0e040', c: '#5c5648', p: '#44403a' }, [
    '................',
    '....zzzzzzzz....',
    '...zzzzzzzzzz...',
    '...zezzzzzzez...',
    '...zezzzzzzez...',
    '...zzzzddzzzz...',
    '....zzzddzzz....',
    '.....zzzzzz.....',
    '....cccccccc....',
    '...ccdcccccdc...',
    '..zccccccccccz..',
    '..zcccccccccc...',
    '.....pp..pp.....',
    '.....pp..pp.....',
    '.....zz..zz.....',
    '................',
  ]);
  mob('spider', 'quad', { s: '#3c3444', d: '#241f2c', l: '#5c5470', e: '#e05050', f: '#8a3c8c' }, [
    '................',
    '................',
    '..s..........s..',
    '..ss.saaaas.ss..'.replace(/a/g, 's'),
    '...sssssssdss...',
    '.sssdssssssdsss.',
    'ss..ssleelss..ss',
    's...sseeeess...s',
    '....ssssssss....',
    '...ssdssssdss...',
    '.sss.ssssss.sss.',
    'ss...sdssds...ss',
    's....ss..ss....s',
    '.....s....s.....',
    '................',
    '................',
  ]);
  mob('orc', 'biped', { g: '#5a8a44', d: '#3c6030', l: '#78a860', e: '#e05050', t: '#e8e0c8', a: '#6e5240', p: '#4a3830' }, [
    '................',
    '...gggggggggg...',
    '..gggggggggggg..',
    '..geggggggggeg..',
    '..gegggggggge...',
    '..gggggggggggg..',
    '..ggtggggggtgg..',
    '..ggttggggttgg..',
    '...gggggggggg...',
    '..aaaaaaaaaaaa..',
    '.gaaadaaaadaaag.',
    '.gaaaaaaaaaaaag.',
    'ggaaaaaaaaaaaagg',
    '....pp....pp....',
    '....pp....pp....',
    '....gg....gg....',
  ]);
  mob('bandit', 'biped', { s: '#d9a066', h: '#4a3220', m: '#5c2c2c', c: '#6e4030', d: '#4a2c20', e: '#f0e8d8', p: '#3c3430' }, [
    '................',
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '...hsssssssseh..'.replace('e', 's'),
    '...mmmmmmmmmm...',
    '...mesmmmmsem...',
    '...mmmmmmmmmm...',
    '....ssssssss....',
    '....cccccccc....',
    '...ccdcccccdc...',
    '..sccccccccccs..',
    '..scccccccccc...',
    '.....pp..pp.....',
    '.....pp..pp.....',
    '.....dd..dd.....',
    '................',
  ]);
  mob('harpy', 'flyer', { f: '#b08850', w: '#8a5f36', l: '#d8b078', s: '#e8c898', h: '#7a4a8c', e: '#e0c040', t: '#c8a060' }, [
    '................',
    '..ww........ww..',
    '.wwww......wwww.',
    'wwwwww....wwwwww',
    'wwlwwww..wwwwlww',
    'wwwwhhhhhhhhwwww',
    '.wwhhhhhhhhhhww.',
    '....hsssssssh...',
    '....seshhsesh...'.replace(/h/g, 's'),
    '.....ssssss.....',
    '.....ffffff.....',
    '....ffffffff....',
    '.....tttttt.....',
    '......tt.tt.....',
    '................',
    '................',
  ], [
    '................',
    '................',
    '................',
    'ww............ww',
    'wwww........wwww',
    'wwwwww....wwwwww',
    'wwlwwhhhhhhwwlww',
    '.wwhhhhhhhhhhww.',
    '....hsssssssh...',
    '....sesssses....',
    '.....ssssss.....',
    '.....ffffff.....',
    '....ffffffff....',
    '.....tttttt.....',
    '......tt.tt.....',
    '................',
  ]);
  mob('golem', 'biped', { r: '#8c8478', d: '#5f5a50', l: '#b0a898', e: '#6ad4e8', m: '#4c4840' }, [
    '................',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '..rrerrrrrrer...',
    '..rrrrrrrrrrrr..',
    '...rrrrddrrrr...',
    '.rrrrrrrrrrrrrr.',
    'rrrdrrrrrrrrdrrr',
    'rrr.rrrddrrr.rrr',
    'rrr.rrrrrrrr.rrr',
    'drr.rdrrrrdr.rrd',
    '.d..rrrrrrrr..d.',
    '....rrr..rrr....',
    '....rrr..rrr....',
    '....ddd..ddd....',
    '................',
  ]);
  mob('imp', 'biped', { r: '#c85a3a', d: '#8a3a24', l: '#e87c50', e: '#f2d34b', h: '#3c2418', w: '#57297c' }, [
    '................',
    '..h..........h..',
    '..hh........hh..',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '..rerrrrrrrrer..',
    '..rrrrrddrrrrr..',
    '...rrrrrrrrrr...',
    '..wwrrrrrrrrww..',
    '.wwrrrrrrrrrrww.',
    '..w.rrrddrrr.w..',
    '....rrrrrrrr....',
    '.....rr..rr.....',
    '.....rr..rr.....',
    '.....dd..dd..d..',
    '..........ddd...',
  ]);
  mob('hound', 'quad', { f: '#8a3a24', d: '#5c2418', l: '#c85a3a', e: '#f8c83a', m: '#f8ea90' }, [
    '................',
    '................',
    '...ff...........',
    '..fdf..........f',
    '..ffff.....fffff',
    '..fffff..fffffff',
    '.ffeffffffffffdd',
    '.ffffffmmffffff.',
    'ffffmmfffffff...',
    '.ffffffffffff...',
    '..fffffffffff...',
    '..fff.fff.fff...',
    '..ff...ff..ff...',
    '..dd...dd..dd...',
    '................',
    '................',
  ]);
  mob('wraith', 'float', { w: '#8cb4d4', d: '#5c84a8', l: '#c8e4f4', e: '#f0f8ff', k: '#2c4458' }, [
    '................',
    '.....wwwwww.....',
    '....wwwwwwww....',
    '...wwwwwwwwww...',
    '...wkewwwwekw...',
    '...wwwwwwwwww...',
    '...wwwwkkwwww...',
    '....wwwwwwww....',
    '..wwwwwwwwwwww..',
    '.wwwwwwwwwwwwww.',
    '.wdwwwwwwwwwwdw.',
    '..wwdwwwwwwdww..',
    '...wwwdwwdwww...',
    '....ww.ww.ww....',
    '.....w..w..w....',
    '................',
  ]);
  mob('yeti', 'biped', { w: '#e8ecf2', d: '#b8c4d4', l: '#ffffff', e: '#3b6fd0', s: '#8ca4c0', m: '#4c5c74' }, [
    '................',
    '...wwwwwwwwww...',
    '..wwwwwwwwwwww..',
    '..wewwwwwwwwew..',
    '..wwwwwwwwwwww..',
    '...wwwmmmmwww...',
    '.wwwwwwwwwwwwww.',
    'wwwdwwwwwwwwdwww',
    'www.wwwwwwww.www',
    'www.wdwwwwdw.www',
    'dww.wwwwwwww.wwd',
    '.d..wwwwwwww..d.',
    '....www..www....',
    '....www..www....',
    '....ddd..ddd....',
    '................',
  ]);
  mob('knight', 'biped', { m: '#4c4c5c', d: '#30303c', l: '#6c6c80', e: '#e05050', p: '#8a2e20', t: '#f2c14b' }, [
    '................',
    '....mmmmmmmm....',
    '...mmmmmmmmmm...',
    '...mlmmmmmmlm...',
    '...meemmmmeem...',
    '...mmmmmmmmmm...',
    '....mmmddmmm....',
    '.....pppppp.....',
    '....mmmmmmmm....',
    '...mmdmmmmdmm...',
    '..mm.mmmmmm.mm..',
    '..mm.mtmmtm.mm..',
    '..d..mmmmmm..d..',
    '.....md..dm.....',
    '.....mm..mm.....',
    '.....dd..dd.....',
  ]);
  mob('demonsoldier', 'biped', { r: '#8a3050', d: '#5c1c34', l: '#b04868', e: '#f2d34b', h: '#2c1a30', m: '#3c3444' }, [
    '................',
    '..h....h.h....h.',
    '..hh..rrrr..hh..',
    '...rrrrrrrrrr...',
    '..rrrrrrrrrrrr..',
    '..rerrrrrrrrer..',
    '..rrrrrddrrrrr..',
    '...rrrrrrrrrr...',
    '....mmmmmmmm....',
    '...mmdmmmmdmm...',
    '..rm.mmmmmm.mr..',
    '..rm.mdmmdm.mr..',
    '.....mmmmmm.....',
    '.....md..dm.....',
    '.....mm..mm.....',
    '.....dd..dd.....',
  ]);
  mob('brute', 'biped', { p: '#7a4a8c', d: '#522f60', l: '#9c68b0', e: '#f2d34b', h: '#2c1a30', t: '#e8e0c8' }, [
    '..h..........h..',
    '..hh.pppppp.hh..',
    '..hpppppppppph..',
    '..pppppppppppp..',
    '..peppppppppep..',
    '..pppppppppppp..',
    '..pptpppppptpp..',
    '...ppttpptttp...'.replace(/ttt/, 'tt.p').slice(0, 16),
    '...pppppppppp...',
    '.pppppppppppppp.',
    'ppppdpppppdppppp'.slice(0, 16),
    'ppp.pppppppp.ppp',
    'dpp.pdppppdp.ppd',
    '....pppppppp....',
    '....ppp..ppp....',
    '....ddd..ddd....',
  ]);
  mob('drake', 'quad', { s: '#c87830', d: '#8a4c1c', l: '#e8a050', e: '#f2d34b', w: '#a85c24', b: '#f0d8a8' }, [
    '................',
    '...ss...........',
    '..ssss..........',
    '..sess..ww......',
    '..ssss.wwww.....',
    '...ssssswwww....',
    '....ssssswww....',
    '....ssssssss....',
    '...ssssssssss...',
    '..sbbssssssssd..',
    '..sbbsssssssdd..',
    '...ssssssssss...',
    '...ss.ssss.ss...',
    '...ss..ss..ss...',
    '...dd..dd..dd...',
    '................',
  ]);
  mob('lich', 'float', { b: '#e8e0c8', d: '#b0a684', r: '#3c3060', rd: '#241c40', e: '#6ad4e8', g: '#f2c14b' }, [
    '................',
    '....gbbbbbbg....',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...bebbbbbbeb...',
    '...bbbbbbbbbb...',
    '....bbbddbbb....',
    '.....rrrrrr.....',
    '....rrrrrrrr....',
    '...rrrdrrdrrr...',
    '..brrrrrrrrrrb..',
    '..brrrrrrrrrr...',
    '...rrrrrrrrrr...',
    '...rrdrrrrdrr...',
    '....rrrrrrrr....',
    '.....rrrrrr.....',
  ]);
  // BOSS-scale arts (bigger canvases)
  mob('kingslime', 'blob', { g: '#58c04e', d: '#2f8232', l: '#9ce88a', e: '#183c14', w: '#f8f4e8', c: '#f2c14b', cd: '#b0812a', j: '#e05050' }, [
    '........c..c..c.........'.slice(0, 24),
    '........cccccc..........',
    '........cjcjcc..........',
    '........cccccc..........',
    '......gggggggggg........',
    '....gggggggggggggg......',
    '...glggggggggggggggg....',
    '..gllggggggggggggggggg..',
    '..gllggggggggggggggggg..',
    '.glggggggggggggggggggig.'.replace('i', 'g'),
    '.ggggeeggggggggeegggggg.',
    '.gggeweggggggggewegggig.'.replace('i', 'g'),
    'gggggggggggggggggggggggg',
    'gggggggggggggggggggggggg',
    'ggggggggddddddgggggggggg',
    'gggggdddddddddddddgggggg',
    '.ggddddddddddddddddddgg.',
    '..dddddddddddddddddddd..',
  ]);
  mob('dragon', 'quad', { s: '#c03030', d: '#801c1c', l: '#e05050', e: '#f2d34b', w: '#a02424', b: '#f0d8a8', f: '#f8c83a' }, [
    '......ss................',
    '.....ssss...............',
    '....ssesss..............',
    '....ssssss....wwww......',
    '.....ssfsss..wwwwww.....',
    '......ssssswwwwwwww.....',
    '.......ssssswwwwww......',
    '......sssssssswww.......',
    '.....sssssssssss........',
    '....sssssssssssss.......',
    '...sbbsssssssssssss.....',
    '...sbbssssssssssssss....',
    '...sbbsssssssssssssd....',
    '....ssssssssssssssdd....',
    '....sss.ssssss.sss......',
    '....sss..ssss..sss......',
    '....sss...ss...sss......',
    '....ddd...dd...ddd......',
  ]);
  mob('demonlord', 'biped', { k: '#2c1a30', d: '#180e1c', p: '#57297c', l: '#8a4fc8', e: '#e05050', h: '#4a2050', f: '#c8b4e0', t: '#f2c14b' }, [
    '..h..................h..',
    '..hh................hh..',
    '..hhh..............hhh..',
    '...hhh....kkkk....hhh...',
    '....hh..kkkkkkkk..hh....',
    '.......kkkkkkkkkk.......',
    '......kkfkkkkkkfkk......',
    '......kkeekkkkeekk......',
    '......kkkkkkkkkkkk......',
    '.......kkkkddkkkk.......',
    '......ppppppppppp.......',
    '....pppppppppppppp......',
    '...ppppdppppppdpppp.....',
    '..kkpppppppppppppkk.....',
    '..kkpppptppppppppkk.....',
    '..kk.ppppppppppp.kk.....',
    '..k..ppdppppppdp..k.....',
    '.....pppppppppp.........',
    '.....ppp....ppp.........',
    '.....ppp....ppp.........',
    '.....kkk....kkk.........',
    '.....kkk....kkk.........',
  ]);

  // frame 2 generator per body type
  function mobFrame2(art) {
    if (art.rows2) return art.rows2;
    const rows = art.rows;
    const t = art.bodyType;
    if (t === 'blob') {
      // squash: drop 1 row
      return dropRows(rows, 1);
    }
    if (t === 'biped') {
      // swap leg shift
      const legTop = rows.length - 4;
      return shiftRows(rows, legTop, rows.length - 1, 1);
    }
    if (t === 'quad') {
      const legTop = rows.length - 4;
      return shiftRows(rows, legTop, rows.length - 1, -1);
    }
    if (t === 'float') return dropRows(rows, 1);
    return rows;
  }

  const mobCache = {};
  PXA.mob = function (name, palOverride) {
    const key = name + (palOverride ? JSON.stringify(palOverride) : '');
    if (mobCache[key]) return mobCache[key];
    const art = MOB_ART[name];
    if (!art) return null;
    const pal = palOverride ? Object.assign({}, art.pal, palOverride) : art.pal;
    const w = Math.max.apply(null, art.rows.map(r => r.length));
    const f0 = outline(px(art.rows, pal, w));
    const f1 = outline(px(mobFrame2(art), pal, w));
    const res = { frames: [f0, f1], w: f0.width, h: f0.height, bodyType: art.bodyType };
    mobCache[key] = res;
    return res;
  };
  PXA.MOB_ART = MOB_ART;

  // ============================================================
  // ITEM ICONS — 16x16 pixel art with palette swaps
  // ============================================================
  const ICON_ART = {
    sword: { pal: { b: '#dce4ec', d: '#98a4b0', g: '#f2c14b', h: '#6e421f' }, rows: [
      '..........bb....', '.........bbb....', '........bbbd....', '.......bbbd.....',
      '......bbbd......', '.....bbbd.......', '....bbbd........', '...bbbd.........',
      '..gbbd..........', '.hgg............', 'hhg.g...........', '.hh.............',
      'h.h.............', '................', '................', '................'] },
    dagger: { pal: { b: '#dce4ec', d: '#98a4b0', g: '#b0812a', h: '#4a3220' }, rows: [
      '................', '................', '.........bb.....', '........bbd.....',
      '.......bbd......', '......bbd.......', '.....bbd........', '....gbd.........',
      '...hg...........', '..hh............', '.hh.............', '................',
      '................', '................', '................', '................'] },
    staff: { pal: { w: '#8a5a2c', d: '#5c3a18', c: '#6ad4e8', l: '#c8f4fc' }, rows: [
      '...........cc...', '..........cllc..', '..........clcc..', '...........cc...',
      '..........ww....', '.........wwd....', '........wwd.....', '.......wwd......',
      '......wwd.......', '.....wwd........', '....wwd.........', '...wwd..........',
      '..wwd...........', '.wwd............', '................', '................'] },
    mace: { pal: { m: '#7c8088', l: '#b8bcc4', h: '#6e421f' }, rows: [
      '.........mmm....', '........mlmmm...', '........mmmmm...', '........mmmmm...',
      '.........mmm....', '........hh......', '.......hh.......', '......hh........',
      '.....hh.........', '....hh..........', '...hh...........', '..hh............',
      '................', '................', '................', '................'] },
    bow: { pal: { w: '#8a5a2c', l: '#a8804a', s: '#f0e8d8' }, rows: [
      '....ww..........', '...wlww.........', '..wl..ww........', '..wl...ww.......',
      '.wl.....w.......', '.wl.....ww......', '.wl......w......', '.wl......w......',
      '.wl.....ww......', '..wl....w.......', '..wl...ww.......', '...wwwww........',
      '.s..............', '..s.............', '...s............', '................'] },
    shield: { pal: { m: '#b8bcc4', d: '#7c8088', g: '#f2c14b', b: '#3b6fd0' }, rows: [
      '..gggggggggg....', '.gmmmmmmmmmmg...', '.gmmbbbbbbmmg...', '.gmbbbbbbbbmg...',
      '.gmbbbggbbbmg...', '.gmbbbggbbbmg...', '.gmbbbbbbbbmg...', '.gmmbbbbbbmmg...',
      '.gdmmmmmmmmdg...', '..gdmmmmmmdg....', '...gdmmmmdg.....', '....gdmmdg......',
      '.....gddg.......', '......gg........', '................', '................'] },
    helmet: { pal: { m: '#b8bcc4', d: '#7c8088', l: '#dce4ec', r: '#c8402e' }, rows: [
      '................', '......rrr.......', '......rrr.......', '....mmmmmm......',
      '...mmmlmmmm.....', '..mmmlmmmmmm....', '..mmlmmmmmmm....', '..mmmmmmmmmm....',
      '..mmm....mmm....', '..mdm....mdm....', '..mdm....mdm....', '..dd......dd....',
      '................', '................', '................', '................'] },
    armor: { pal: { m: '#b8bcc4', d: '#7c8088', l: '#dce4ec', g: '#f2c14b' }, rows: [
      '................', '..mm......mm....', '.mmmmmmmmmmmm...', '.mmmmmmmmmmmm...',
      '.mm.mmmmmm.mm...', '.dd.mmlmmm.dd...', '....mmlmmm......', '....mmmmmm......',
      '....mmmmmm......', '....mgmmgm......', '....mmmmmm......', '....dmmmmd......',
      '.....dddd.......', '................', '................', '................'] },
    boots: { pal: { b: '#6e421f', d: '#4a2c14', l: '#8a5a2c' }, rows: [
      '................', '................', '................', '...bb....bb.....',
      '...bb....bb.....', '...bb....bb.....', '...bb....bb.....', '...bbb...bbb....',
      '...bbbb..bbbb...', '...dddd..dddd...', '................', '................',
      '................', '................', '................', '................'] },
    ring: { pal: { g: '#f2c14b', d: '#b0812a', j: '#e05050', l: '#ffdf8e' }, rows: [
      '................', '................', '......jj........', '.....jjjj.......',
      '......jj........', '.....gggg.......', '....gg..gg......', '...gg....gg.....',
      '...gd....dg.....', '...gd....dg.....', '....gd..dg......', '.....gddg.......',
      '................', '................', '................', '................'] },
    amulet: { pal: { g: '#f2c14b', c: '#6ad4e8', l: '#c8f4fc', s: '#b0812a' }, rows: [
      '.....ssssss.....', '....ss....ss....', '...ss......ss...', '...s........s...',
      '...s........s...', '....s......s....', '.....gggggg.....', '.....g.cc.g.....',
      '.....gcclcg.....', '.....gccccg.....', '......gccg......', '.......gg.......',
      '................', '................', '................', '................'] },
    potion: { pal: { g: '#c8e4f4', l: '#f0f8ff', f: '#e04848', d: '#8a1c1c', c: '#8a5a2c' }, rows: [
      '......cc........', '......cc........', '.....gggg.......', '.....g..g.......',
      '....gg..gg......', '...gg....gg.....', '...g.ffff.g.....', '...gffffffg.....',
      '...gffffffg.....', '...gfdffffg.....', '....gffffg......', '.....gggg.......',
      '................', '................', '................', '................'] },
    herb: { pal: { g: '#4fa04a', l: '#7de07a', d: '#2c6428', s: '#8a5a2c' }, rows: [
      '................', '......l.........', '...l.gl..l......', '...gl.gl.gl.....',
      '....glglgl......', '.....glgl.......', '..l...gg...l....', '...gl.gg.gl.....',
      '....glgggl......', '......gg........', '......ss........', '......ss........',
      '................', '................', '................', '................'] },
    ore: { pal: { r: '#7c7268', d: '#5c544c', m: '#8cc2e8', l: '#d8ecfc' }, rows: [
      '................', '................', '....rrrrrr......', '...rrrrrrrr.....',
      '..rrmmrrrrrr....', '..rrmlmrrrrr....', '..rrmmrrmmrr....', '..rrrrrrmlmr....',
      '..rrrrrrmmrr....', '..rdrrrrrrdr....', '...ddrrrrdd.....', '....dddddd......',
      '................', '................', '................', '................'] },
    magicstone: { pal: { p: '#8a4fc8', d: '#57297c', l: '#c88ae8', w: '#f0d8ff' }, rows: [
      '................', '.......pp.......', '......pllp......', '.....pllwlp.....',
      '.....plwllp.....', '....pllllllp....', '....plllllldp...'.slice(0, 16), '....pllllllp....',
      '.....pllllp.....', '.....pdlldp.....', '......pddp......', '.......pp.......',
      '................', '................', '................', '................'] },
    bone: { pal: { b: '#e8e0c8', d: '#b0a684' }, rows: [
      '................', '................', '..bb............', '.bbbb......b....',
      '.bbbbb....bb....', '..bbbbb..bbbb...', '....bbbbbbbb....', '......bbbb......',
      '.....bbbb.......', '....bbbbbb..b...', '...bbbb..bbbb...', '...bbb....bbb...',
      '....b......b....', '................', '................', '................'] },
    pelt: { pal: { f: '#8a5f36', d: '#5c3a18', l: '#b08850' }, rows: [
      '................', '..ff........ff..', '..fff......fff..', '...ffffffffff...',
      '..ffffffffffff..', '..flffffffffff..', '..fllfffffffff..', '..ffffffffffff..',
      '..ffffffffffff..', '...ffffffffff...', '..fff..ff..fff..', '..ff...ff...ff..',
      '................', '................', '................', '................'] },
    silk: { pal: { s: '#f0f0f0', d: '#c0c0c8', l: '#ffffff' }, rows: [
      '................', '....ssssss......', '...ssssssss.....', '..sslsssssss....',
      '..slssssssss....', '..ssssssdsss....', '..sssssdssss....', '..ssdsssssss....',
      '..sssssssss.....', '...sssssdss.....', '....ssssss......', '.....ssss.......',
      '................', '................', '................', '................'] },
    gel: { pal: { g: '#58c04e', d: '#2f8232', l: '#9ce88a' }, rows: [
      '................', '................', '......gggg......', '....gggggggg....',
      '...glgggggggg...', '...gllggggggg...', '...ggggggggggg..'.slice(0, 16), '...gggggggggg...',
      '...ggggggdggg...', '....ggggdddg....', '.....gggggg.....', '................',
      '................', '................', '................', '................'] },
    meat: { pal: { m: '#c8604a', d: '#8a3424', b: '#e8e0c8', l: '#e8927c' }, rows: [
      '................', '................', '.....mmmm.......', '...mmmmmmm......',
      '..mmmlmmmmm.....', '..mmlmmmmmmm....', '..mmmmmmmmmmb...', '...mmmmmmmbbb...',
      '....mmmmmmbb....', '.....mmmm.......', '................', '................',
      '................', '................', '................', '................'] },
    scroll: { pal: { p: '#ecd9ab', d: '#c8ab74', w: '#8a5a2c', r: '#c8402e' }, rows: [
      '................', '...wwwwwwwww....', '..wppppppppww...', '..wpppppppppw...',
      '...pprrrrpp.....', '...ppppppppp....', '...pprrrpppp....', '...ppppppppp....',
      '...pprrrrrpp....', '...ppppppppp....', '..wpppppppppw...', '..wwwwwwwwwww...',
      '................', '................', '................', '................'] },
    tome: { pal: { c: '#8a2417', d: '#5c1408', g: '#f2c14b', p: '#ecd9ab' }, rows: [
      '................', '..cccccccccc....', '.cccccccccccc...', '.ccgggggggccc...',
      '.ccgcccccgccc...', '.ccgcgggcgccc...', '.ccgcgcgcgccc...', '.ccgcgggcgccc...',
      '.ccgcccccgccc...', '.ccgggggggccc...', '.cccccccccccc...', '.cdddddddddcc...',
      '..dddddddddd....', '................', '................', '................'] },
    key: { pal: { g: '#f2c14b', d: '#b0812a', l: '#ffdf8e' }, rows: [
      '................', '................', '....ggg.........', '...glllg........',
      '...gl.lg........', '...glllg........', '....ggg.........', '.....gg.........',
      '.....gg.........', '.....ggg........', '.....gg.........', '.....ggg........',
      '................', '................', '................', '................'] },
    torch: { pal: { w: '#5c3a18', l: '#8a5a2c', f: '#d84a1a', y: '#f8c83a', h: '#f8ea90' }, rows: [
      '......ff........', '.....ffyy.......', '.....fyhy.......', '.....fyyf.......',
      '......ff........', '.....wwl........', '.....wl.........', '.....wl.........',
      '......wl........', '......wl........', '.......wl.......', '.......wl.......',
      '................', '................', '................', '................'] },
    magiclight: { pal: { g: '#f2c14b', d: '#b0812a', c: '#6ad4e8', l: '#c8f4fc', w: '#f0f8ff' }, rows: [
      '.......gg.......', '......gggg......', '.....gg..gg.....', '....g......g....',
      '....g.cccc.g....', '....gcclllcg....', '....gclwwlcg....', '....gclwwlcg....',
      '....gcllllcg....', '....g.cccc.g....', '.....g....g.....', '......gggg......',
      '.......gg.......', '................', '................', '................'] },
    pouch: { pal: { b: '#8a5a2c', d: '#5c3a18', g: '#f2c14b', s: '#a8804a' }, rows: [
      '................', '......ss........', '.....ssss.......', '......ss........',
      '.....bbbb.......', '....bbbbbb......', '...bbbbbbbb.....', '...bbbbbbbb.....',
      '...bgbbbbgb.....', '...bbgggbbb.....', '....bbbbbb......', '.....dddd.......',
      '................', '................', '................', '................'] },
    permit: { pal: { p: '#ecd9ab', d: '#c8ab74', r: '#c8402e', w: '#8a5a2c' }, rows: [
      '................', '...pppppppp.....', '..pppppppppp....', '..pwwwwwwwpp....',
      '..pppppppppp....', '..pwwwwwppppp...'.slice(0, 16), '..pppppppppp....', '..pwwwwwwwpp....',
      '..pppppppppp....', '..ppppppprrp....', '..ppppppprrp....', '..pppppppppp....',
      '................', '................', '................', '................'] },
    horn: { pal: { h: '#3c2c3c', d: '#241a24', l: '#5c445c', r: '#e05050' }, rows: [
      '................', '..h.............', '..hh............', '..lhh...........',
      '..lhhh..........', '...lhhh.........', '...lhhhh........', '....lhhhh.......',
      '.....lhhhh......', '......lhhhh.....', '.......hhhhh....', '........hhhh....',
      '.........hh.....', '................', '................', '................'] },
    scale: { pal: { s: '#c03030', d: '#801c1c', l: '#e05050' }, rows: [
      '................', '................', '.....ssss.......', '....ssllss......',
      '...sslsslss.....', '...ssssssss.....', '...ssssssss.....', '....ssssss......',
      '....dssssd......', '.....dssd.......', '......dd........', '................',
      '................', '................', '................', '................'] },
    wood: { pal: { w: '#8a5a2c', d: '#5c3a18', l: '#a8804a' }, rows: [
      '................', '................', '..www...........', '..wwwww.........',
      '...wwwwwww......', '....wwwwwwww....', '.....wwwwwwww...', '......wwwwww....',
      '..lll..wwww.....', '..lllll.........', '...llllll.......', '....llll........',
      '................', '................', '................', '................'] },
    feather: { pal: { f: '#f0f0f0', d: '#b8c4d4', s: '#8a8a90' }, rows: [
      '................', '..........ff....', '.........ffff...', '........fffff...',
      '.......ffffff...', '......ffffff....', '.....ffffff.....', '....ffffff......',
      '...ffffff.......', '...fffff........', '..sfff..........', '..ss............',
      '.s..............', '................', '................', '................'] },
    crystal: { pal: { c: '#6ad4e8', d: '#3a8ca8', l: '#b8f0f8' }, rows: [
      '................', '.......cc.......', '......clcc......', '......clcc......',
      '.....cllccc.....', '.....clcccc.....', '.....ccccdc.....', '......ccdc......',
      '......ccdc......', '.......cd.......', '.......cd.......', '................',
      '................', '................', '................', '................'] },
    coin: { pal: { g: '#f2c14b', d: '#b0812a', l: '#ffdf8e' }, rows: [
      '................', '................', '.....gggg.......', '....gllllg......',
      '...gllggllg.....', '...glg..glg.....', '...glg..glg.....', '...gllggllg.....',
      '....gllllg......', '.....gggg.......', '................', '................',
      '................', '................', '................', '................'] },
    demonheart: { pal: { r: '#a02040', d: '#601028', l: '#d04868', p: '#8a4fc8' }, rows: [
      '................', '...rr....rr.....', '..rrrr..rrrr....', '..rlrrrrrrrr....',
      '..rllrrrrrrr....', '..rlrrrrrrpr....', '...rrrrrrpr.....', '....rrrrrr......',
      '.....rrrr.......', '......rr........', '.......r........', '................',
      '................', '................', '................', '................'] },
  };
  const iconCache = {};
  PXA.icon = function (name, palOverride) {
    const key = name + (palOverride ? JSON.stringify(palOverride) : '');
    if (iconCache[key]) return iconCache[key];
    const a = ICON_ART[name] || ICON_ART.pouch;
    const pal = palOverride ? Object.assign({}, a.pal, palOverride) : a.pal;
    const c = outline(px(a.rows, pal, 16));
    iconCache[key] = c;
    return c;
  };

  // ============================================================
  // SPELL ICONS — small procedural draws
  // ============================================================
  const spellIconDraw = {
    fire: (g) => { g.fillStyle = '#d84a1a'; g.fillRect(4, 5, 8, 8); g.fillRect(6, 2, 4, 4); g.fillRect(3, 8, 2, 4); g.fillRect(11, 7, 2, 5); g.fillStyle = '#f8c83a'; g.fillRect(6, 6, 4, 6); g.fillRect(7, 4, 2, 3); g.fillStyle = '#f8ea90'; g.fillRect(7, 8, 2, 4); },
    ice: (g) => { g.fillStyle = '#6ad4e8'; g.fillRect(7, 1, 2, 14); g.fillRect(1, 7, 14, 2); g.fillRect(3, 3, 2, 2); g.fillRect(11, 3, 2, 2); g.fillRect(3, 11, 2, 2); g.fillRect(11, 11, 2, 2); g.fillStyle = '#c8f4fc'; g.fillRect(7, 7, 2, 2); },
    bolt: (g) => { g.fillStyle = '#f2d34b'; g.fillRect(8, 1, 4, 5); g.fillRect(6, 5, 4, 4); g.fillRect(8, 8, 3, 2); g.fillRect(5, 10, 4, 5); g.fillStyle = '#fff8c0'; g.fillRect(8, 3, 2, 4); g.fillRect(7, 7, 2, 4); },
    heal: (g) => { g.fillStyle = '#57c14f'; g.fillRect(6, 2, 4, 12); g.fillRect(2, 6, 12, 4); g.fillStyle = '#a8e89a'; g.fillRect(7, 3, 2, 10); g.fillRect(3, 7, 10, 2); },
    shieldspell: (g) => { g.fillStyle = '#4f8fe0'; g.fillRect(3, 2, 10, 8); g.fillRect(4, 10, 8, 2); g.fillRect(6, 12, 4, 2); g.fillStyle = '#9db8ff'; g.fillRect(5, 3, 3, 4); g.fillStyle = '#c8dcff'; g.fillRect(5, 3, 2, 2); },
    poison: (g) => { g.fillStyle = '#7ab02a'; g.fillRect(5, 3, 6, 7); g.fillRect(4, 5, 8, 4); g.fillStyle = '#a8d84a'; g.fillRect(6, 4, 2, 3); g.fillStyle = '#4c7c14'; g.fillRect(4, 10, 2, 3); g.fillRect(8, 11, 2, 3); g.fillRect(11, 9, 2, 3); },
    dark: (g) => { g.fillStyle = '#57297c'; g.fillRect(4, 4, 8, 8); g.fillStyle = '#8a4fc8'; g.fillRect(5, 5, 6, 6); g.fillStyle = '#c88ae8'; g.fillRect(6, 6, 2, 2); g.fillStyle = '#2c1a30'; g.fillRect(2, 2, 3, 3); g.fillRect(11, 2, 3, 3); g.fillRect(2, 11, 3, 3); g.fillRect(11, 11, 3, 3); },
    holy: (g) => { g.fillStyle = '#f2c14b'; g.fillRect(7, 1, 2, 14); g.fillRect(3, 5, 10, 2); g.fillStyle = '#ffdf8e'; g.fillRect(7, 2, 2, 4); g.fillStyle = '#fff8d8'; g.fillRect(7, 5, 2, 2); },
    slash: (g) => { g.fillStyle = '#dce4ec'; for (let i = 0; i < 11; i++) g.fillRect(2 + i, 12 - i, 2, 2); g.fillStyle = '#98a4b0'; for (let i = 0; i < 8; i++) g.fillRect(4 + i, 13 - i, 1, 1); },
    whirl: (g) => { g.fillStyle = '#dce4ec'; g.fillRect(2, 7, 12, 2); g.fillRect(7, 2, 2, 12); g.fillStyle = '#98a4b0'; g.fillRect(4, 4, 2, 2); g.fillRect(10, 4, 2, 2); g.fillRect(4, 10, 2, 2); g.fillRect(10, 10, 2, 2); },
    charge: (g) => { g.fillStyle = '#e8b34b'; g.fillRect(2, 6, 8, 4); g.fillStyle = '#c98f2f'; g.fillRect(9, 4, 3, 8); g.fillRect(12, 6, 2, 4); },
    taunt: (g) => { g.fillStyle = '#e05050'; g.fillRect(4, 3, 8, 8); g.fillStyle = '#fff'; g.fillRect(6, 5, 1, 2); g.fillRect(9, 5, 1, 2); g.fillRect(6, 8, 4, 1); g.fillStyle = '#e05050'; g.fillRect(6, 11, 2, 3); },
    ironwall: (g) => { g.fillStyle = '#7c8088'; g.fillRect(2, 4, 12, 10); g.fillStyle = '#b8bcc4'; g.fillRect(2, 4, 12, 2); g.fillRect(4, 8, 2, 2); g.fillRect(10, 8, 2, 2); g.fillRect(7, 11, 2, 2); },
    haste: (g) => { g.fillStyle = '#6ad4e8'; g.fillRect(3, 3, 6, 2); g.fillRect(5, 7, 6, 2); g.fillRect(3, 11, 6, 2); g.fillStyle = '#c8f4fc'; g.fillRect(9, 3, 3, 2); g.fillRect(11, 7, 3, 2); g.fillRect(9, 11, 3, 2); },
    meteor: (g) => { g.fillStyle = '#d84a1a'; g.fillRect(8, 2, 5, 5); g.fillStyle = '#8a4c1c'; g.fillRect(9, 3, 3, 3); g.fillStyle = '#f8c83a'; g.fillRect(6, 6, 3, 3); g.fillRect(4, 9, 2, 2); g.fillRect(2, 12, 2, 2); },
    drain: (g) => { g.fillStyle = '#a02040'; g.fillRect(3, 3, 4, 4); g.fillStyle = '#d04868'; g.fillRect(4, 4, 2, 2); g.fillStyle = '#8a4fc8'; g.fillRect(7, 7, 2, 2); g.fillRect(9, 9, 2, 2); g.fillRect(11, 11, 3, 3); },
    regen: (g) => { g.fillStyle = '#57c14f'; g.fillRect(4, 4, 3, 3); g.fillRect(9, 4, 3, 3); g.fillRect(4, 9, 3, 3); g.fillRect(9, 9, 3, 3); g.fillStyle = '#a8e89a'; g.fillRect(7, 7, 2, 2); },
    blizzard: (g) => { g.fillStyle = '#8cc2e8'; g.fillRect(2, 3, 12, 4); g.fillStyle = '#c8e4f4'; g.fillRect(3, 4, 4, 2); g.fillStyle = '#f0f8ff'; g.fillRect(4, 9, 2, 2); g.fillRect(8, 10, 2, 2); g.fillRect(12, 9, 2, 2); g.fillRect(6, 13, 2, 2); },
    firewave: (g) => { g.fillStyle = '#d84a1a'; g.fillRect(1, 9, 14, 4); g.fillStyle = '#f8c83a'; g.fillRect(2, 7, 3, 4); g.fillRect(7, 5, 3, 6); g.fillRect(12, 7, 2, 4); g.fillStyle = '#f8ea90'; g.fillRect(8, 7, 1, 3); },
    chain: (g) => { g.fillStyle = '#f2d34b'; g.fillRect(2, 2, 3, 3); g.fillRect(6, 6, 3, 3); g.fillRect(10, 4, 3, 3); g.fillRect(8, 10, 3, 3); g.fillRect(12, 12, 2, 2); g.fillStyle = '#fff8c0'; g.fillRect(5, 5, 2, 1); g.fillRect(9, 8, 1, 2); },
  };
  const spellIconCache = {};
  PXA.spellIcon = function (kind) {
    if (spellIconCache[kind]) return spellIconCache[kind];
    const c = mkCanvas(16, 16), g = ctx2d(c);
    g.fillStyle = '#241206'; g.fillRect(0, 0, 16, 16);
    (spellIconDraw[kind] || spellIconDraw.fire)(g);
    spellIconCache[kind] = c;
    return c;
  };

  // ============================================================
  // TITLE SCREEN BACKDROP
  // ============================================================
  PXA.drawTitleBackdrop = function (canvas, t) {
    const g = ctx2d(canvas);
    const w = canvas.width, h = canvas.height;
    // sky gradient bands (pixel style)
    const bands = ['#2a1a3e', '#3e2450', '#5c3260', '#8a4658', '#c86848', '#e89050'];
    const bh = Math.ceil(h * 0.7 / bands.length);
    bands.forEach((b, i) => { g.fillStyle = b; g.fillRect(0, i * bh, w, bh + 1); });
    // sun
    g.fillStyle = '#f8dc90';
    const sx = w * 0.5, sy = h * 0.52;
    g.fillRect(sx - 30, sy - 30, 60, 60);
    g.fillStyle = '#fff0c0'; g.fillRect(sx - 20, sy - 20, 40, 40);
    // mountains
    g.fillStyle = '#241830';
    for (let i = 0; i < 6; i++) {
      const mx = (i * w / 5) - 60 + (i % 2) * 40, mh = 90 + (i * 37) % 80;
      for (let s = 0; s < mh; s += 8) {
        const half = (mh - s) * 1.1;
        g.fillRect(mx - half, h * 0.7 - s - 8, half * 2, 8);
      }
    }
    // ground
    g.fillStyle = '#1c1226'; g.fillRect(0, h * 0.7, w, h * 0.3);
    g.fillStyle = '#241a30';
    const r = mulberry(5);
    for (let i = 0; i < 200; i++) g.fillRect((r() * w) | 0, h * 0.7 + (r() * h * 0.3) | 0, 3, 2);
    // drifting pixel clouds
    g.fillStyle = 'rgba(240,220,200,.18)';
    for (let i = 0; i < 7; i++) {
      const cx = ((i * 197 + t * (6 + i * 2)) % (w + 200)) - 100;
      const cy = 30 + (i * 61) % (h * 0.4);
      g.fillRect(cx, cy, 90, 10); g.fillRect(cx + 15, cy - 8, 60, 8); g.fillRect(cx + 25, cy + 10, 50, 8);
    }
  };

  // sanity check: warn about malformed art rows during development
  PXA.validate = function () {
    let bad = 0;
    for (const name in MOB_ART) {
      const a = MOB_ART[name];
      const w = Math.max.apply(null, a.rows.map(r => r.length));
      a.rows.forEach((r, i) => { if (r.length !== w) { bad++; console.warn('mob', name, 'row', i, 'len', r.length, '!=', w); } });
    }
    return bad;
  };
})();

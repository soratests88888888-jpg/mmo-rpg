/* ============================================================
   ASHES OF ELDORIA — main.js
   Boot: title screen, character creation, continue flow.
   ============================================================ */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);

  let picked = { cls: 'swordsman', hair: 0, skin: 0 };
  let titleAnimT = 0, titleRunning = true;

  function boot() {
    PXA.initUITextures();
    PXA.validate();
    WORLD.build();
    GAME.init($('game-canvas'));

    // title backdrop animation
    const tc = $('title-canvas');
    function sizeTitle() { tc.width = window.innerWidth; tc.height = window.innerHeight; }
    sizeTitle();
    window.addEventListener('resize', sizeTitle);
    (function titleLoop() {
      if (!titleRunning) return;
      titleAnimT += 0.4;
      PXA.drawTitleBackdrop(tc, titleAnimT);
      requestAnimationFrame(titleLoop);
    })();

    // audio unlock on first interaction
    const unlock = () => { AUDIO.unlock(); AUDIO.playMusic('title'); document.removeEventListener('pointerdown', unlock); document.removeEventListener('keydown', unlock); };
    document.addEventListener('pointerdown', unlock);
    document.addEventListener('keydown', unlock);

    buildCharCreation();

    // continue button if a save exists
    const localSave = GAME.loadLocal();
    if (localSave && localSave.name) {
      const btn = $('btn-continue');
      btn.style.display = 'inline-block';
      btn.textContent = 'CONTINUE — ' + localSave.name.toUpperCase() + ' LV' + localSave.level;
      btn.onclick = () => continueGame(localSave);
    }
    $('btn-new').onclick = () => {
      $('char-create').style.display = 'flex';
      $('start-buttons').style.display = 'none';
      AUDIO.sfx('click');
    };
    $('cc-close').onclick = () => {
      $('char-create').style.display = 'none';
      $('start-buttons').style.display = 'flex';
    };
    $('btn-enter-world').onclick = startNewGame;
    $('cc-name').addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') startNewGame(); });

    // connect in background so char creation is never blocked
    $('start-status').textContent = 'Connecting to Eldoria...';
    NET.init().then(ok => {
      $('start-status').textContent = ok ? '● Online — multiplayer active' : '○ Offline mode — progress saved locally';
    });
  }

  function buildCharCreation() {
    // class cards
    const cc = $('cc-classes');
    cc.innerHTML = '';
    for (const clsId in DATA.CLASSES) {
      const cd = DATA.CLASSES[clsId];
      const card = document.createElement('div');
      card.className = 'class-card' + (clsId === picked.cls ? ' sel' : '');
      card.dataset.cls = clsId;
      const cv = document.createElement('canvas');
      cv.width = 20; cv.height = 25;
      card.appendChild(cv);
      const nm = document.createElement('div'); nm.className = 'cname'; nm.textContent = cd.name.toUpperCase();
      const ds = document.createElement('div'); ds.className = 'cdesc'; ds.textContent = cd.desc;
      card.appendChild(nm); card.appendChild(ds);
      card.onclick = () => {
        picked.cls = clsId;
        cc.querySelectorAll('.class-card').forEach(x => x.classList.remove('sel'));
        card.classList.add('sel');
        refreshPreviews();
        AUDIO.sfx('click');
      };
      cc.appendChild(card);
    }
    // hair swatches
    const hairBox = $('cc-hair');
    hairBox.innerHTML = '';
    PXA.HAIRS.forEach((h, i) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (i === picked.hair ? ' sel' : '');
      sw.style.background = h[1];
      sw.onclick = () => {
        picked.hair = i;
        hairBox.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel'));
        sw.classList.add('sel');
        refreshPreviews();
        AUDIO.sfx('click');
      };
      hairBox.appendChild(sw);
    });
    // skin swatches
    const skinBox = $('cc-skin');
    skinBox.innerHTML = '';
    PXA.SKINS.forEach((s, i) => {
      const sw = document.createElement('div');
      sw.className = 'swatch' + (i === picked.skin ? ' sel' : '');
      sw.style.background = s[0];
      sw.onclick = () => {
        picked.skin = i;
        skinBox.querySelectorAll('.swatch').forEach(x => x.classList.remove('sel'));
        sw.classList.add('sel');
        refreshPreviews();
        AUDIO.sfx('click');
      };
      skinBox.appendChild(sw);
    });
    refreshPreviews();
  }
  function refreshPreviews() {
    document.querySelectorAll('.class-card').forEach(card => {
      const sheet = PXA.makeHero({ hair: picked.hair, skin: picked.skin, cls: card.dataset.cls });
      const cv = card.querySelector('canvas');
      const g = cv.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, cv.width, cv.height);
      g.drawImage(sheet.down[0], 1, 1);
    });
  }

  function startNewGame() {
    let name = $('cc-name').value.trim().slice(0, 14);
    if (!name) { $('cc-name').focus(); $('cc-name').placeholder = 'Please enter a name!'; return; }
    name = name.replace(/[<>&"]/g, '');
    titleRunning = false;
    GAME.newPlayer(name, picked.cls, picked.hair, picked.skin);
    GAME.start(true);
    AUDIO.playMusic('overworld');
    GAME.save();
    if (window.NET) NET.sendState(true);
  }

  async function continueGame(localSave) {
    AUDIO.sfx('click');
    // prefer the freshest save: compare local vs cloud
    let save = localSave;
    if (NET.online()) {
      try {
        const remote = await NET.loadRemote();
        if (remote && remote.name && (!localSave || (remote.level || 0) >= (localSave.level || 0))) save = remote;
      } catch (e) { }
    }
    titleRunning = false;
    GAME.newPlayer(save.name, save.cls, (save.look && save.look.hair) || 0, (save.look && save.look.skin) || 0);
    GAME.deserialize(save);
    GAME.refreshHeroSheet();
    GAME.start(false);
    UI.toast('Welcome back, ' + save.name + '!', '#8fd4ff');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

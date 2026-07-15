/* ============================================================
   ASHES OF ELDORIA — audio.js
   Chiptune music engine + SFX, all synthesized with WebAudio.
   Songs are composed as note-token strings (8th-note grid):
   'C4 E4 G4 -' etc.  '-' sustains, '.' rests.
   ============================================================ */
(function () {
  'use strict';
  const AUDIO = (window.AUDIO = {});

  let ac = null, masterGain = null, musicGain = null, sfxGain = null;
  let musicOn = true, sfxOn = true;
  let current = null, schedTimer = null;

  const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function noteFreq(tok) {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(tok);
    if (!m) return null;
    const semis = NOTE_IDX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (semis - 69) / 12);
  }
  function parseTrack(str) {
    // returns array of {freq or null, len (in steps)}
    const toks = str.trim().split(/\s+/);
    const out = [];
    for (const t of toks) {
      if (t === '-') { if (out.length) out[out.length - 1].len++; else out.push({ f: null, len: 1 }); }
      else if (t === '.') out.push({ f: null, len: 1 });
      else out.push({ f: noteFreq(t), len: 1 });
    }
    return out;
  }

  // ---------------- SONGS ----------------
  // Every song loops. One token = one 8th note.
  const SONGS = {
    title: {
      bpm: 82,
      lead: `E4 - G4 - A4 - - - C5 - B4 - A4 - G4 - E4 - G4 - A4 - - - G4 - E4 - D4 - - -
             E4 - G4 - A4 - - - C5 - D5 - E5 - D5 - C5 - B4 - A4 - G4 - A4 - - - - - - -`,
      bass: `A2 - - - A2 - - - F2 - - - F2 - - - G2 - - - G2 - - - E2 - - - E2 - - -
             A2 - - - A2 - - - F2 - - - F2 - - - G2 - - - G2 - - - A2 - - - A2 - - -`,
      arp: `A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3 E3 G3 B3 G3 E3 G3 B3 G3
            A3 C4 E4 C4 A3 C4 E4 C4 F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3 A3 C4 E4 C4 A3 E4 C4 A3`,
      drums: `k . . . h . . . k . . . h . . . k . . . h . . . k . . . h . . .
              k . . . h . . . k . . . h . . . k . . . h . . . k . h . k . h .`,
    },
    town: {
      bpm: 96,
      lead: `G4 - A4 B4 - G4 - - E4 - F4 G4 - E4 - - C4 - D4 E4 - G4 F4 E4 D4 - - - - - . .
             G4 - A4 B4 - D5 - - C5 - B4 A4 - G4 - - E4 - G4 F4 - D4 E4 F4 G4 - - - - - . .`,
      bass: `C3 - - - G2 - - - C3 - - - G2 - - - A2 - - - E2 - - - G2 - - - G2 - - -
             C3 - - - G2 - - - A2 - - - F2 - - - C3 - - - G2 - - - C3 - - - C3 - - -`,
      arp: `E3 G3 C4 G3 E3 G3 C4 G3 E3 G3 C4 G3 E3 G3 C4 G3 C3 E3 A3 E3 C3 E3 G3 E3 D3 G3 B3 G3 D3 G3 B3 G3
            E3 G3 C4 G3 E3 G3 C4 G3 C3 E3 A3 E3 C3 F3 A3 F3 E3 G3 C4 G3 D3 G3 B3 G3 C4 G3 E3 G3 C4 - - -`,
      drums: `k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h h
              k . h . s . h . k . h . s . h . k . h . s . h . k . k . s . . .`,
    },
    overworld: {
      bpm: 118,
      lead: `E4 - - G4 A4 - - B4 C5 - B4 A4 G4 - E4 - D4 - - E4 F4 - - A4 G4 - F4 E4 D4 - - -
             E4 - - G4 A4 - - B4 C5 - D5 E5 D5 - B4 - C5 - B4 A4 G4 - E4 G4 A4 - - - - - - -`,
      bass: `A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - D3 - E2 - B2 - E2 - B2 -
             A2 - E3 - A2 - E3 - F2 - C3 - F2 - C3 - G2 - D3 - G2 - D3 - A2 - E3 - A2 - - -`,
      arp: `. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
            A4 . . . . . . . C5 . . . . . . . B4 . . . . . . . E5 . . . . . . .`,
      drums: `k . h . s . h h k . h . s . h . k . h . s . h h k . h . s . h .
              k . h . s . h h k . h . s . h . k . h . s . h h k k s . k k s s`,
    },
    dungeon: {
      bpm: 92,
      lead: `D4 - - - F4 - - - E4 - C4 - D4 - - - . . D4 - F4 - A4 - G4 - E4 - C4 - - -
             D4 - - - F4 - - - Bb4 - A4 - F4 - D4 - E4 - - - C4 - - - D4 - - - - - - -`,
      bass: `D2 - - - D2 - - - C2 - - - C2 - - - Bb1 - - - Bb1 - - - A1 - - - A1 - - -
             D2 - - - D2 - - - C2 - - - C2 - - - Bb1 - - - Bb1 - - - D2 - - - D2 - - -`,
      arp: `D3 F3 A3 F3 D3 F3 A3 F3 C3 E3 G3 E3 C3 E3 G3 E3 Bb2 D3 F3 D3 Bb2 D3 F3 D3 A2 C#3 E3 C#3 A2 C#3 E3 C#3
            D3 F3 A3 F3 D3 F3 A3 F3 C3 E3 G3 E3 C3 E3 G3 E3 Bb2 D3 F3 D3 Bb2 D3 F3 D3 D3 F3 A3 F3 D3 A3 F3 D3`,
      drums: `k . . . . . h . k . . . . . h . k . . . . . h . k . . . . . h .
              k . . . . . h . k . . . . . h . k . . . . . h . k . h . k . h .`,
    },
    boss: {
      bpm: 150,
      lead: `A4 A4 - C5 B4 B4 - D5 C5 C5 - E5 D5 C5 B4 A4 G4 G4 - B4 A4 A4 - C5 B4 A4 G4 A4 - - - -
             A4 A4 - C5 B4 B4 - D5 C5 - E5 - F5 - E5 - D5 - C5 - B4 - D5 - A4 - - - - - - -`,
      bass: `A2 A2 A2 A2 A2 A2 G2 G2 F2 F2 F2 F2 F2 F2 E2 E2 G2 G2 G2 G2 G2 G2 F2 F2 E2 E2 E2 E2 E2 E2 E2 E2
             A2 A2 A2 A2 A2 A2 G2 G2 F2 F2 F2 F2 F2 F2 E2 E2 G2 G2 G2 G2 G2 G2 F2 F2 A2 A2 E2 E2 A2 A2 A2 A2`,
      arp: `A3 C4 E4 A4 A3 C4 E4 A4 F3 A3 C4 F4 F3 A3 C4 F4 G3 B3 D4 G4 G3 B3 D4 G4 E3 G#3 B3 E4 E3 G#3 B3 E4
            A3 C4 E4 A4 A3 C4 E4 A4 F3 A3 C4 F4 F3 A3 C4 F4 G3 B3 D4 G4 G3 B3 D4 G4 A3 E4 C4 A3 A3 C4 E4 A4`,
      drums: `k . k . s . k k k . k . s . k . k . k . s . k k k . k . s . s s
              k . k . s . k k k . k . s . k . k . k . s . k k k k s s k k s s`,
    },
    demon: {
      bpm: 72,
      lead: `E4 - - - - - F4 - E4 - - - - - D#4 - E4 - - - G4 - F#4 - E4 - - - - - - -
             E4 - - - B4 - Bb4 - A4 - - - G4 - F4 - E4 - F4 - E4 - D#4 - E4 - - - - - - -`,
      bass: `E2 - - - E2 - - - E2 - - - E2 - - - C2 - - - C2 - - - B1 - - - B1 - - -
             E2 - - - E2 - - - A1 - - - A1 - - - C2 - - - B1 - - - E2 - - - E2 - - -`,
      arp: `E3 G3 B3 G3 E3 G3 B3 G3 E3 G3 B3 G3 E3 G3 B3 G3 C3 E3 G3 E3 C3 E3 G3 E3 B2 D#3 F#3 D#3 B2 D#3 F#3 D#3
            E3 G3 B3 G3 E3 G3 B3 G3 A2 C3 E3 C3 A2 C3 E3 C3 C3 E3 G3 E3 B2 D#3 F#3 D#3 E3 G3 B3 G3 E3 B3 G3 E3`,
      drums: `k . . . . . . . h . . . k . . . k . . . . . . . h . . . k . h .
              k . . . . . . . h . . . k . . . k . . . h . . . k . k . k . k .`,
    },
    arena: {
      bpm: 140,
      lead: `C5 - A4 - G4 A4 - - C5 - A4 - G4 E4 - - F4 - A4 - C5 - D5 C5 A4 - G4 - A4 - - -
             C5 - A4 - G4 A4 - - E5 - D5 C5 D5 - - - F5 - E5 - D5 - C5 A4 C5 - - - - - - -`,
      bass: `A2 - A2 A3 A2 - A2 A3 A2 - A2 A3 A2 - G2 - F2 - F2 F3 F2 - F2 F3 G2 - G2 G3 G2 - G2 -
             A2 - A2 A3 A2 - A2 A3 A2 - A2 A3 A2 - G2 - F2 - F2 F3 F2 - F2 F3 A2 - E2 - A2 - A2 -`,
      arp: `. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
            A4 . E4 . A4 . E4 . A4 . E4 . A4 . . . F4 . C4 . F4 . C4 . A4 . E4 . A4 . . .`,
      drums: `k . h h s . h . k . h h s . h . k . h h s . h . k . h h s . h h
              k . h h s . h . k . h h s . h . k . h h s . h . k k s s k k s s`,
    },
    snowzone: {
      bpm: 88,
      lead: `B4 - - - A4 - G4 - F#4 - - - - - - - G4 - - - A4 - B4 - E4 - - - - - - -
             B4 - - - A4 - G4 - F#4 - E4 - D4 - - - G4 - F#4 - E4 - D#4 - E4 - - - - - - -`,
      bass: `E2 - - - B2 - - - C3 - - - G2 - - - A2 - - - B2 - - - E2 - - - E2 - - -
             E2 - - - B2 - - - C3 - - - G2 - - - A2 - - - B2 - - - E2 - - - E2 - - -`,
      arp: `E3 G3 B3 G3 E3 G3 B3 G3 C3 E3 G3 E3 C3 E3 G3 E3 A2 C3 E3 C3 A2 C3 E3 C3 E3 G3 B3 G3 E3 G3 B3 G3
            E3 G3 B3 G3 E3 G3 B3 G3 C3 E3 G3 E3 C3 E3 G3 E3 A2 C3 E3 C3 B2 D#3 F#3 D#3 E3 G3 B3 G3 E3 B3 G3 E3`,
      drums: `. . h . . . h . . . h . . . h . . . h . . . h . . . h . . . h .
              k . h . . . h . k . h . . . h . k . h . . . h . k . h . k . h .`,
    },
  };
  for (const k in SONGS) {
    const s = SONGS[k];
    s._lead = parseTrack(s.lead); s._bass = parseTrack(s.bass);
    s._arp = parseTrack(s.arp); s._drums = s.drums.trim().split(/\s+/);
  }

  // ---------------- engine ----------------
  let noiseBuf = null;
  function ensureCtx() {
    if (ac) return true;
    try {
      ac = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ac.createGain(); masterGain.gain.value = 0.5; masterGain.connect(ac.destination);
      musicGain = ac.createGain(); musicGain.gain.value = 0.42; musicGain.connect(masterGain);
      sfxGain = ac.createGain(); sfxGain.gain.value = 0.8; sfxGain.connect(masterGain);
      const len = ac.sampleRate * 0.5;
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch (e) { return false; }
    return true;
  }
  AUDIO.unlock = function () {
    if (!ensureCtx()) return;
    if (ac.state === 'suspended') ac.resume();
  };

  function voice(type, freq, t0, dur, vol, dest, slide) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    g.gain.setValueAtTime(vol, t0 + Math.max(0.01, dur - 0.04));
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function drum(kind, t0, dest) {
    if (kind === 'k') {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(120, t0);
      o.frequency.exponentialRampToValueAtTime(40, t0 + 0.12);
      g.gain.setValueAtTime(0.9, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.13);
      o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + 0.15);
    } else if (kind === 'h' || kind === 's') {
      const src = ac.createBufferSource(); src.buffer = noiseBuf;
      const f = ac.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = kind === 'h' ? 6000 : 1400;
      const g = ac.createGain();
      const dur = kind === 'h' ? 0.05 : 0.14;
      g.gain.setValueAtTime(kind === 'h' ? 0.25 : 0.5, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(f); f.connect(g); g.connect(dest);
      src.start(t0); src.stop(t0 + dur + 0.02);
    }
  }

  // lookahead scheduler
  let songPos = 0, nextStepTime = 0;
  function scheduleLoop() {
    if (!current || !ac) return;
    const song = SONGS[current];
    const stepDur = 60 / song.bpm / 2; // 8th notes
    const totalSteps = song._drums.length;
    while (nextStepTime < ac.currentTime + 0.25) {
      const step = songPos % totalSteps;
      // find events starting at this step for each track
      scheduleTrack(song._lead, step, nextStepTime, stepDur, 'square', 0.16);
      scheduleTrack(song._bass, step, nextStepTime, stepDur, 'triangle', 0.30);
      scheduleTrack(song._arp, step, nextStepTime, stepDur, 'square', 0.055);
      const dk = song._drums[step];
      if (dk && dk !== '.') drum(dk, nextStepTime, musicGain);
      songPos++;
      nextStepTime += stepDur;
    }
  }
  function scheduleTrack(track, step, t0, stepDur, type, vol) {
    // walk track to find token starting exactly at step
    let acc = 0;
    for (const ev of track) {
      if (acc === step) {
        if (ev.f) voice(type, ev.f, t0, stepDur * ev.len * 0.92, vol, musicGain);
        return;
      }
      acc += ev.len;
      if (acc > step) return;
    }
  }

  AUDIO.playMusic = function (name) {
    if (!SONGS[name]) name = 'overworld';
    if (current === name) return;
    AUDIO.stopMusic();
    if (!musicOn) { current = name; return; } // remember choice
    if (!ensureCtx()) return;
    current = name;
    songPos = 0; nextStepTime = ac.currentTime + 0.06;
    schedTimer = setInterval(scheduleLoop, 80);
  };
  AUDIO.stopMusic = function () {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    current = null;
  };
  AUDIO.setMusic = function (on) {
    musicOn = on;
    const c = current;
    AUDIO.stopMusic();
    if (on && c) { AUDIO.playMusic(c); }
  };
  AUDIO.setSfx = function (on) { sfxOn = on; };
  AUDIO.getMusic = () => musicOn; AUDIO.getSfx = () => sfxOn;

  // ---------------- SFX ----------------
  const SFX = {
    swing: () => { noise(0.09, 2200, 0.25, 0.4); },
    hit: () => { tone('square', 180, 0.08, 0.3, 0.5); noise(0.06, 900, 0.3); },
    hurt: () => { tone('sawtooth', 220, 0.18, 0.25, 0.45); },
    mobdie: () => { tone('sawtooth', 300, 0.3, 0.22, 0.15); noise(0.2, 500, 0.2); },
    fireball: () => { noise(0.25, 1200, 0.3, 0.3); tone('sawtooth', 300, 0.2, 0.15, 0.6); },
    ice: () => { tone('square', 1200, 0.12, 0.12, 1.6); tone('square', 1600, 0.14, 0.1, 1.4); },
    bolt: () => { noise(0.16, 3000, 0.35); tone('square', 90, 0.14, 0.3, 0.4); },
    heal: () => { arpUp([440, 550, 660, 880], 0.07, 'sine', 0.25); },
    buff: () => { arpUp([330, 415, 495, 660], 0.06, 'triangle', 0.25); },
    coin: () => { tone('square', 990, 0.06, 0.2); setTimeout(() => tone('square', 1320, 0.12, 0.2), 60); },
    levelup: () => { arpUp([523, 659, 784, 1046, 1318], 0.09, 'square', 0.2); },
    chest: () => { tone('square', 660, 0.08, 0.2); setTimeout(() => arpUp([784, 988, 1175], 0.08, 'square', 0.2), 90); },
    potion: () => { tone('sine', 500, 0.1, 0.3, 1.5); setTimeout(() => tone('sine', 750, 0.12, 0.25), 90); },
    death: () => { tone('sawtooth', 440, 0.7, 0.3, 0.12); },
    click: () => { tone('square', 800, 0.03, 0.15); },
    error: () => { tone('square', 160, 0.13, 0.25); },
    craft: () => { tone('square', 520, 0.05, 0.2); setTimeout(() => tone('square', 700, 0.09, 0.2), 70); },
    step: () => { noise(0.03, 700, 0.05); },
    respawn: () => { arpUp([392, 494, 587, 784], 0.09, 'triangle', 0.25); },
    quest: () => { arpUp([587, 740, 880, 1175], 0.09, 'square', 0.2); },
    bossroar: () => { tone('sawtooth', 90, 0.7, 0.5, 0.6); noise(0.5, 300, 0.3); },
    pvp: () => { tone('square', 440, 0.08, 0.25); setTimeout(() => tone('square', 330, 0.12, 0.25), 90); },
    equip: () => { tone('square', 340, 0.05, 0.2); setTimeout(() => tone('square', 480, 0.06, 0.18), 55); },
  };
  function tone(type, freq, dur, vol, slide) {
    if (!sfxOn || !ensureCtx()) return;
    voice(type, freq, ac.currentTime, dur, vol, sfxGain, slide);
  }
  function noise(dur, hp, vol, slideDown) {
    if (!sfxOn || !ensureCtx()) return;
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const g = ac.createGain();
    const t0 = ac.currentTime;
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }
  function arpUp(freqs, step, type, vol) {
    if (!sfxOn || !ensureCtx()) return;
    freqs.forEach((f, i) => voice(type, f, ac.currentTime + i * step, step * 1.6, vol, sfxGain));
  }
  AUDIO.sfx = function (name) { const f = SFX[name]; if (f) try { f(); } catch (e) { } };
})();

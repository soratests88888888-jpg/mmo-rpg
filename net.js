/* ============================================================
   ASHES OF ELDORIA — net.js
   Multiplayer via Supabase Realtime + Postgres:
   - presence & live player positions (broadcast)
   - global chat (broadcast + persisted history)
   - PvP arena hits (broadcast)
   - character saves (players table, secret-guarded RPC)
   - player marketplace (market_listings + atomic buy RPC)
   Falls back to offline mode when unreachable.
   ============================================================ */
(function () {
  'use strict';
  const NET = (window.NET = {});
  let sb = null, channel = null, isOnline = false;
  let myId = null, mySecret = null;
  const remotes = new Map();
  let posTimer = 0, saveTimer = null, lastSent = {};

  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  NET.online = () => isOnline;
  NET.playerId = () => myId;

  NET.init = async function () {
    // identity
    try {
      const stored = JSON.parse(localStorage.getItem('eldoria_net') || 'null');
      if (stored && stored.id && stored.secret) { myId = stored.id; mySecret = stored.secret; }
    } catch (e) { }
    if (!myId) {
      myId = uuid(); mySecret = uuid();
      try { localStorage.setItem('eldoria_net', JSON.stringify({ id: myId, secret: mySecret })); } catch (e) { }
    }
    if (!window.CONFIG || !CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || !window.supabase) {
      console.warn('[net] no supabase config — offline mode');
      return false;
    }
    try {
      sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
        realtime: { params: { eventsPerSecond: 12 } },
      });
      await connectChannel();
      isOnline = true;
      UI.addChat(null, '— connected to Eldoria (online mode) —', 'sys');
      loadChatHistory();
      return true;
    } catch (e) {
      console.warn('[net] connection failed — offline mode', e);
      isOnline = false;
      UI.addChat(null, '— offline mode (no connection) —', 'sys');
      return false;
    }
  };

  async function connectChannel() {
    channel = sb.channel('eldoria-world', {
      config: { presence: { key: myId }, broadcast: { self: false } },
    });
    channel.on('broadcast', { event: 'pos' }, ({ payload }) => {
      if (!payload || payload.id === myId) return;
      let rp = remotes.get(payload.id);
      if (!rp) { rp = { id: payload.id }; remotes.set(payload.id, rp); }
      rp.tx = payload.x; rp.ty = payload.y;
      if (rp.x == null) { rp.x = payload.x; rp.y = payload.y; }
      rp.dir = payload.d; rp.moving = payload.m;
      rp.map = payload.mp; rp.name = payload.n; rp.level = payload.l; rp.cls = payload.c;
      if (payload.lk && !rp.look) rp.look = payload.lk;
      rp.lastSeen = Date.now();
    });
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (!payload || payload.id === myId) return;
      UI.addChat(payload.name, payload.text);
      const rp = remotes.get(payload.id);
      if (rp) { rp.chatBubble = payload.text.slice(0, 40); rp.chatT = 4; }
    });
    channel.on('broadcast', { event: 'sys' }, ({ payload }) => {
      if (payload && payload.text) UI.addChat(null, payload.text, 'sys');
    });
    channel.on('broadcast', { event: 'pvp' }, ({ payload }) => {
      if (payload && payload.to === myId) GAME.receivePvpHit(payload.dmg, payload.from);
    });
    channel.on('broadcast', { event: 'sold' }, ({ payload }) => {
      if (payload && payload.seller === myId) {
        GAME.player.gold += payload.price;
        UI.toast('Marketplace: your ' + (DATA.ITEMS[payload.item_id] ? DATA.ITEMS[payload.item_id].name : 'item') + ' sold for ' + payload.price + 'g!', '#a8e89a');
        AUDIO.sfx('coin');
      }
    });
    channel.on('presence', { event: 'leave' }, ({ key }) => { remotes.delete(key); });
    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('realtime timeout')), 8000);
      channel.subscribe(status => {
        if (status === 'SUBSCRIBED') { clearTimeout(to); resolve(); }
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(to); reject(new Error(status)); }
      });
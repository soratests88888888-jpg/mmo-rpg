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
    });
    trackPresence();
  }
  function trackPresence() {
    if (!channel) return;
    const p = GAME.player;
    channel.track({ name: p.name || '???', level: p.level || 1, cls: p.cls, map: p.map }).catch(() => { });
  }

  // -------- position sync --------
  NET.tick = function (dt) {
    // interpolate remotes
    const now = Date.now();
    for (const [id, rp] of remotes) {
      if (now - (rp.lastSeen || 0) > 12000) { remotes.delete(id); continue; }
      if (rp.tx != null) {
        const k = Math.min(1, dt * 10);
        rp.x += (rp.tx - rp.x) * k;
        rp.y += (rp.ty - rp.y) * k;
      }
    }
    if (!isOnline || !channel) return;
    posTimer -= dt;
    if (posTimer <= 0) {
      posTimer = 0.12;
      const p = GAME.player;
      const st = { x: Math.round(p.x), y: Math.round(p.y), d: p.dir, m: !!p.moving, mp: p.map };
      if (st.x !== lastSent.x || st.y !== lastSent.y || st.m !== lastSent.m || st.mp !== lastSent.mp) {
        lastSent = st;
        channel.send({
          type: 'broadcast', event: 'pos',
          payload: Object.assign({ id: myId, n: p.name, l: p.level, c: p.cls, lk: p.look }, st),
        }).catch(() => { });
      }
    }
  };
  NET.remoteList = function () { return [...remotes.values()].filter(r => r.name); };
  NET.mapChanged = function () { trackPresence(); };
  NET.sendState = function () { trackPresence(); };

  // -------- chat --------
  NET.sendChat = function (text) {
    const p = GAME.player;
    UI.addChat(p.name, text);
    if (!isOnline) return;
    channel.send({ type: 'broadcast', event: 'chat', payload: { id: myId, name: p.name, text } }).catch(() => { });
    sb.from('chat_messages').insert({ player_id: myId, name: p.name, text }).then(() => { }, () => { });
  };
  NET.chatSystem = function (text) {
    UI.addChat(null, text, 'sys');
    if (!isOnline) return;
    channel.send({ type: 'broadcast', event: 'sys', payload: { text } }).catch(() => { });
  };
  async function loadChatHistory() {
    try {
      const { data } = await sb.from('chat_messages').select('name,text,created_at').order('id', { ascending: false }).limit(15);
      if (data) for (const row of data.reverse()) UI.addChat(row.name, row.text);
    } catch (e) { }
  }

  // -------- pvp --------
  NET.sendPvpHit = function (toId, dmg) {
    if (!isOnline) return;
    channel.send({ type: 'broadcast', event: 'pvp', payload: { to: toId, from: GAME.player.name, dmg: Math.round(dmg) } }).catch(() => { });
  };

  // -------- persistence --------
  NET.save = function () {
    if (!isOnline || !GAME.player.name) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await sb.rpc('save_player', {
          p_id: myId, p_secret: mySecret,
          p_name: GAME.player.name, p_data: GAME.serialize(),
        });
      } catch (e) { }
    }, 800);
  };
  NET.loadRemote = async function () {
    if (!sb) return null;
    try {
      const { data } = await sb.from('players').select('data').eq('id', myId).maybeSingle();
      return data ? data.data : null;
    } catch (e) { return null; }
  };

  // -------- marketplace --------
  NET.fetchMarket = async function () {
    try {
      const { data } = await sb.from('market_listings').select('*').is('sold_to', null).order('id', { ascending: false }).limit(60);
      return data || [];
    } catch (e) { return []; }
  };
  NET.fetchMyListings = async function () {
    try {
      const { data } = await sb.from('market_listings').select('*').is('sold_to', null).eq('seller_id', myId).order('id', { ascending: false });
      return data || [];
    } catch (e) { return []; }
  };
  NET.listItem = async function (itemId, qty, price) {
    try {
      const { data, error } = await sb.rpc('list_item', {
        p_seller: myId, p_secret: mySecret, p_seller_name: GAME.player.name,
        p_item: itemId, p_qty: qty, p_price: price,
      });
      if (error || !data) { UI.toast('Could not list item.', '#ff9a8a'); return false; }
      return true;
    } catch (e) { UI.toast('Could not list item.', '#ff9a8a'); return false; }
  };
  NET.cancelListing = async function (row) {
    try {
      await sb.rpc('cancel_listing', { p_id: row.id, p_seller: myId, p_secret: mySecret });
      return true;
    } catch (e) { return false; }
  };
  NET.buyListing = async function (row) {
    const p = GAME.player;
    if (p.gold < row.price) { UI.toast('Not enough gold.', '#ff9a8a'); return false; }
    try {
      const { data, error } = await sb.rpc('buy_listing', { p_listing: row.id, p_buyer: myId, p_secret: mySecret });
      if (error || !data || !data.ok) {
        UI.toast(data && data.err === 'gone' ? 'Already sold!' : data && data.err === 'gold' ? 'Not enough gold (server check).' : 'Purchase failed.', '#ff9a8a');
        return false;
      }
      p.gold -= data.price;
      GAME.addItem(data.item_id, data.qty || 1);
      UI.toast('Bought ' + DATA.ITEMS[data.item_id].name + ' for ' + data.price + 'g', '#a8e89a');
      AUDIO.sfx('coin');
      // notify the seller so a live client credits gold immediately
      channel.send({ type: 'broadcast', event: 'sold', payload: { seller: row.seller_id, price: data.price, item_id: data.item_id } }).catch(() => { });
      NET.save();
      return true;
    } catch (e) { UI.toast('Purchase failed.', '#ff9a8a'); return false; }
  };
})();

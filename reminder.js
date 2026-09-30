(() => {
  if (globalThis.__mamReminderInstalled) return;
  globalThis.__mamReminderInstalled = true;
  let host, root;
  const cards = new Map();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings && (!changes.settings.newValue?.inPageEnabled || changes.settings.newValue?.pausedUntil > Date.now())) {
      for (const entry of [...cards.values()]) entry.remove();
    }
  });
  function mount() {
    if (host?.isConnected) return;
    for (const entry of [...cards.values()]) entry.remove();
    host = document.createElement('div');
    host.style.cssText = 'all:initial!important;position:fixed!important;right:20px!important;bottom:20px!important;z-index:2147483647!important;width:min(350px,calc(100vw - 40px))!important;display:block!important;';
    root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host{color-scheme:light}*{box-sizing:border-box}.card{position:relative;margin-top:12px;padding:22px;background:#f5faf6;border:1px solid #dfe8dc;border-radius:22px;box-shadow:0 12px 48px #243b342b;font:14px/1.5 'Segoe UI',sans-serif;color:#344c43;animation:arrive .3s ease-out}.water{background:#eff8fb;border-color:#d9eaf0}.brand{font-size:11px;letter-spacing:1px;color:#7a9172;font-weight:700}.emoji{font-size:34px;margin:8px 0}h2{font-size:19px;line-height:1.3;margin:0 0 8px;font-weight:700}p{font-size:13px;margin:0 0 18px;color:#718177}button{font:12px 'Segoe UI',sans-serif;cursor:pointer;border:0;border-radius:10px;padding:10px 12px;background:#7d956c;color:white}button:focus-visible{outline:3px solid #c99443;outline-offset:3px}button:disabled{opacity:.6;cursor:wait}.actions{display:flex;gap:8px;flex-wrap:wrap}.secondary{background:#fff;color:#63785a;border:1px solid #dce6d7}.close{position:absolute;right:12px;top:10px;background:transparent;color:#879888;font-size:22px;padding:0 6px}.error{color:#a04c42;margin:10px 0 0;font-size:12px}@keyframes arrive{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.card{animation:none}}
    `;
    root.append(style);
    document.documentElement.append(host);
  }
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message.type !== 'mam-reminder') return;
    if (document.visibilityState !== 'visible' || !['water','stretch'].includes(message.kind)) { respond({shown:false}); return; }
    mount();
    const {kind, test} = message;
    const appearance = message.appearance ?? {};
    const dismissSeconds = [0,5,10,20,30].includes(appearance.dismissSeconds) ? appearance.dismissSeconds : 10;
    const key = test ? 'test' : kind;
    cards.get(key)?.remove(false);
    const card = document.createElement('section');
    card.className = `card ${kind}`;
    const palette = {sage:['#f5faf6','#7d956c'],rose:['#fcf1f5','#ae7289'],sky:['#eff8fb','#598fa5']}[appearance.theme ?? 'sage'];
    if (palette) card.style.cssText = `background:${palette[0]};`;
    card.setAttribute('role', 'region');
    card.setAttribute('aria-label', 'Lời nhắc từ Mầm');
    const close = document.createElement('button');
    close.className = 'close'; close.textContent = '×'; close.setAttribute('aria-label', 'Đóng lời nhắc');
    let timer, hovered = false, focused = false, busy = false, removed = false;
    const remove = (removeHost = true) => {
      if (removed) return;
      removed = true;
      clearTimeout(timer);
      card.remove();
      cards.delete(key);
      if (removeHost && !cards.size) host.remove();
    };
    const restartTimer = () => {
      clearTimeout(timer);
      if (dismissSeconds && !removed && !hovered && !focused && !busy) timer = setTimeout(remove, dismissSeconds * 1000);
    };
    card.addEventListener('mouseenter', () => { hovered = true; restartTimer(); });
    card.addEventListener('mouseleave', () => { hovered = false; restartTimer(); });
    card.addEventListener('focusin', () => { focused = true; restartTimer(); });
    card.addEventListener('focusout', event => { focused = card.contains(event.relatedTarget); restartTimer(); });
    close.addEventListener('click', remove);
    const body = document.createElement('div');
    body.setAttribute('role', 'status');
    const brand = document.createElement('div'); brand.className = 'brand'; brand.textContent = test ? 'MẦM 🌱 · THÔNG BÁO THỬ' : 'MẦM 🌱 · CHĂM MÌNH MỘT CHÚT';
    const emoji = document.createElement('div'); emoji.className = 'emoji'; emoji.textContent = kind === 'water' ? '💧' : '🌼';
    const title = document.createElement('h2'); title.textContent = kind === 'water' ? 'Uống nước cùng Mầm nhé!' : 'Đứng dậy vươn vai nào!';
    const description = document.createElement('p'); description.textContent = kind === 'water' ? 'Một ngụm mát lành, thêm một chút tươi tắn. Công việc đợi bạn một chút nhé.' : 'Rời ghế, duỗi vai và đi lại một chút. Cơ thể sẽ cảm ơn bạn đó!';
    body.append(brand, emoji, title, description);
    const actions = document.createElement('div'); actions.className = 'actions';
    const error = document.createElement('p'); error.className = 'error'; error.setAttribute('role', 'alert'); error.hidden = true;
    function button(label, type, secondary = false) {
      const button = document.createElement('button'); button.textContent = label; if (secondary) button.className = 'secondary';
      if (!secondary && palette) button.style.cssText = `background:${palette[1]}`;
      button.addEventListener('click', async () => {
        if (test) { remove(); return; }
        busy = true;
        restartTimer();
        const buttons = actions.querySelectorAll('button'); buttons.forEach(b => b.disabled = true);
        try {
          const result = await chrome.runtime.sendMessage({type,kind,...(type === 'complete' && kind === 'water' && appearance.cupMl ? {amountMl:appearance.cupMl} : {})});
          if (!result?.ok) throw new Error(result?.error);
          remove();
        } catch { error.textContent = 'Chưa lưu được. Hãy tải lại trang và thử lại nhé.'; error.hidden = false; buttons.forEach(b => b.disabled = false); }
        finally { busy = false; restartTimer(); }
      });
      actions.append(button);
    }
    if (test) button('Dễ thương quá, đã thấy rồi ♡');
    else { button(kind === 'water' ? `✓ Đã uống ${appearance.cupMl ?? 250} ml` : '✓ Đã vận động', 'complete'); button('Nhắc lại sau 5 phút', 'snooze', true); }
    const hint = document.createElement('p');
    hint.textContent = dismissSeconds ? `Tự đóng sau ${dismissSeconds} giây · Rê chuột để giữ lại` : 'Giữ đến khi bạn đóng · Nhẹ nhàng thôi nhé';
    hint.style.cssText = 'font-size:11px;margin:12px 0 0;color:#718177';
    card.append(close, body, actions, error, hint); root.append(card); cards.set(key, { remove });
    restartTimer();
    respond({shown:true});
  });
})();

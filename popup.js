const $ = id => document.getElementById(id);
let state, toastTimer;
const isExtension = Boolean(globalThis.chrome?.runtime?.id);
async function request(message) {
  if (!isExtension) throw new Error('Hãy tải extension vào Edge để sử dụng tính năng này.');
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw new Error(result?.error || 'Không thể kết nối. Hãy mở lại Mầm nhé.');
  state = result;
  render();
}
function toast(message) { $('toast').textContent = message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3500); }
function render() {
  if (!state) return;
  const { settings: s, stats, alarms } = state;
  const paused = s.pausedUntil > Date.now();
  $('status').textContent = paused ? '☾ Đang nghỉ ngơi' : s.waterEnabled || s.stretchEnabled ? '● Đang chăm bạn' : '○ Đã tắt lời nhắc';
  $('pause').textContent = paused ? 'Tiếp tục nhắc' : 'Tạm nghỉ 1 giờ';
  for (const kind of ['water', 'stretch']) {
    $(`${kind}Enabled`).checked = s[`${kind}Enabled`];
    const alarm = alarms.filter(a => a.name === kind || a.name === `snooze-${kind}`).sort((a,b) => a.scheduledTime - b.scheduledTime)[0];
    const minutes = alarm ? Math.max(1, Math.ceil((alarm.scheduledTime - Date.now()) / 60000)) : s[`${kind}Minutes`];
    $(`${kind}Next`).textContent = paused ? `☾ Nghỉ đến ${new Date(s.pausedUntil).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'})}` : !s[`${kind}Enabled`] ? 'Lời nhắc đang tắt' : `◷ Nhắc sau ${minutes} phút`;
  }
  $('waterCount').textContent = `${stats.water} / ${s.goal} ly`;
  $('stretchCount').textContent = stats.stretch;
  $('cups').replaceChildren(...Array.from({length:s.goal}, (_, i) => { const cup = document.createElement('span'); cup.className = `cup${i < stats.water ? ' filled' : ''}`; cup.setAttribute('aria-hidden','true'); return cup; }));
  $('cups').setAttribute('aria-label', `Đã uống ${stats.water} trên mục tiêu ${s.goal} ly`);
  $('encouragement').textContent = stats.water >= s.goal ? 'Đủ mục tiêu rồi. Bạn giỏi lắm! ♡' : 'Từng ngụm nhỏ cũng đáng tự hào.';
}
async function act(message, success) { try { await request(message); if (success) toast(success); } catch (error) { toast(error.message); if(state) render(); } }
document.querySelectorAll('.complete').forEach(button => button.addEventListener('click', async () => { button.disabled = true; await act({type:'complete',kind:button.dataset.kind}, button.dataset.kind === 'water' ? 'Thêm một ly, thêm một chút tươi tắn! 💧' : 'Cơ thể cảm ơn bạn rồi đó! 🌱'); button.disabled = false; }));
for (const kind of ['water', 'stretch']) $(`${kind}Enabled`).addEventListener('change', event => act({type:'save',settings:{[`${kind}Enabled`]:event.target.checked}}));
$('settingsForm').addEventListener('submit', async event => { event.preventDefault(); await act({type:'save',settings:{waterMinutes:Number($('waterMinutes').value),stretchMinutes:Number($('stretchMinutes').value),goal:Number($('goal').value)}}, 'Đã lưu nhịp nhắc của bạn ♡'); });
$('pause').addEventListener('click', () => { if(state) act({type:'pause',resume:state.settings.pausedUntil > Date.now()}); });
$('test').addEventListener('click', () => act({type:'test'}, 'Đã gửi thông báo thử. Kiểm tra thông báo của Edge nhé.'));
$('today').textContent = new Date().toLocaleDateString('vi-VN',{day:'numeric',month:'numeric'});
async function init() {
  if (isExtension) await act({type:'get'});
  else { const { defaults, normalizeStats } = await import('./state.js'); state = {settings:defaults,stats:normalizeStats(),alarms:[]}; render(); $('status').textContent = '◌ Xem trước giao diện'; }
  if(state) for(const key of ['waterMinutes','stretchMinutes','goal']) $(key).value = state.settings[key];
}
init();
setInterval(() => { if(isExtension) act({type:'get'}); }, 30000);

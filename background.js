import { defaults, normalizeStats, validateSettings } from './state.js';
const kinds = ['water', 'stretch'];
async function read() {
  const data = await chrome.storage.local.get(['settings', 'stats']);
  return { settings: { ...defaults, ...data.settings }, stats: normalizeStats(data.stats) };
}
async function schedule(settings, reset = []) {
  const paused = settings.pausedUntil > Date.now();
  if (paused) await chrome.alarms.create('resume', { when: settings.pausedUntil });
  else await chrome.alarms.clear('resume');
  for (const kind of kinds) {
    if (paused || !settings[`${kind}Enabled`]) { await chrome.alarms.clear(kind); continue; }
    const existing = await chrome.alarms.get(kind);
    const minutes = settings[`${kind}Minutes`];
    if (!existing || reset.includes(kind) || existing.periodInMinutes !== minutes)
      await chrome.alarms.create(kind, { delayInMinutes: minutes, periodInMinutes: minutes });
  }
}
async function notify(kind, test = false) {
  try {
    const window = await chrome.windows.getLastFocused();
    if (window.focused) {
      const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
      if (tab?.id) {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['reminder.js'] });
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'mam-reminder', kind, test }, { frameId: 0 });
        if (response?.shown) return;
      }
    }
  } catch (error) {
    // Internal pages, stores and unavailable tabs fall back to desktop notifications.
  }
  await chrome.notifications.create(test ? 'test' : kind, {
    type: 'basic', iconUrl: 'icons/icon128.png',
    title: kind === 'water' ? 'Một ngụm nước, một chút yêu thương 💧' : 'Đứng dậy cùng Mầm nhé 🌱',
    message: kind === 'water' ? 'Tạm nghỉ một chút và uống một ly nước nhé. Mầm đợi bạn nè!' : 'Rời ghế, duỗi vai và đi lại một chút. Cơ thể sẽ cảm ơn bạn đó!',
    buttons: test ? [] : [{ title: kind === 'water' ? 'Đã uống một ly' : 'Đã vận động' }, { title: 'Nhắc lại sau 5 phút' }],
    priority: 1
  });
}
async function complete(kind) {
  if (!kinds.includes(kind)) throw new Error('Hoạt động không hợp lệ.');
  const data = await read();
  data.stats[kind]++;
  await chrome.storage.local.set({ stats: data.stats });
  await chrome.alarms.clear(`snooze-${kind}`);
  await chrome.notifications.clear(kind);
  await schedule(data.settings, [kind]);
}
// Serialize state mutations so rapid clicks cannot overwrite each other.
let queue = Promise.resolve();
function enqueue(fn) { const task = queue.then(fn); queue = task.catch(console.error); return task; }
chrome.runtime.onInstalled.addListener(() => enqueue(async () => { const data = await read(); await chrome.storage.local.set(data); await schedule(data.settings); }));
chrome.runtime.onStartup.addListener(() => enqueue(async () => schedule((await read()).settings)));
chrome.alarms.onAlarm.addListener(alarm => enqueue(async () => {
  const { settings } = await read();
  if (alarm.name === 'resume') { await schedule(settings); return; }
  const kind = alarm.name.replace('snooze-', '');
  if (kinds.includes(kind) && settings[`${kind}Enabled`] && settings.pausedUntil <= Date.now()) await notify(kind);
}));
chrome.notifications.onButtonClicked.addListener((id, index) => enqueue(async () => {
  if (!kinds.includes(id)) return;
  if (index === 0) await complete(id);
  else { await chrome.alarms.create(`snooze-${id}`, { delayInMinutes: 5 }); await chrome.notifications.clear(id); }
}));
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  enqueue(async () => {
    const data = await read();
    if (message.type === 'save') {
      data.settings = { ...data.settings, ...validateSettings(message.settings) };
      await chrome.storage.local.set({ settings: data.settings });
    } else if (message.type === 'pause') {
      data.settings.pausedUntil = message.resume ? 0 : Date.now() + 60 * 60 * 1000;
      await chrome.storage.local.set({ settings: data.settings });
    } else if (message.type === 'complete') await complete(message.kind);
    else if (message.type === 'snooze') {
      if (!kinds.includes(message.kind)) throw new Error('Hoạt động không hợp lệ.');
      if (data.settings[`${message.kind}Enabled`] && data.settings.pausedUntil <= Date.now())
        await chrome.alarms.create(`snooze-${message.kind}`, { delayInMinutes: 5 });
      await chrome.notifications.clear(message.kind);
    }
    else if (message.type === 'test') await notify('water', true);
    await schedule((await read()).settings);
    const current = await read();
    return { ...current, alarms: await chrome.alarms.getAll() };
  }).then(data => respond({ ok: true, ...data }), error => respond({ ok: false, error: error.message }));
  return true;
});

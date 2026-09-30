import { migrateData, validateSettings, inSchedule, nextAllowed } from './state.js';
const kinds = ['water', 'stretch'];
function notificationKind(id) {
  if (['water', 'stretch', 'test'].includes(id)) return id;
  return /^mam:(water|stretch|test):(?:\d+:)?[0-9a-f-]+$/.exec(id)?.[1];
}
async function clearNotifications(kind) {
  const existing = await chrome.notifications.getAll();
  await Promise.all(Object.keys(existing).filter(id => notificationKind(id) === kind).map(id => chrome.notifications.clear(id)));
}
async function read() {
  const raw = await chrome.storage.local.get(['settings','stats','history','lastAction','schemaVersion']);
  const data = migrateData(raw);
  if (raw.schemaVersion !== 2 || raw.stats?.day !== data.stats.day) await chrome.storage.local.set(data);
  return data;
}
async function schedule(settings, reset = []) {
  const paused = settings.pausedUntil > Date.now();
  if (paused) await chrome.alarms.create('resume', { when: settings.pausedUntil });
  else await chrome.alarms.clear('resume');
  for (const kind of kinds) {
    if (paused || !settings[`${kind}Enabled`]) {
      await chrome.alarms.clear(kind);
      await chrome.alarms.clear(`snooze-${kind}`);
      continue;
    }
    const existing = await chrome.alarms.get(kind);
    const minutes = settings[`${kind}Minutes`];
    if (!existing || reset.includes(kind) || existing.periodInMinutes || !inSchedule(settings,new Date(existing.scheduledTime)))
      await chrome.alarms.create(kind, { when: nextAllowed(settings, Date.now()+minutes*60000) });
  }
}
async function notify(kind, test = false) {
  const { settings } = await read();
  if (settings.inPageEnabled) {
  try {
    const window = await chrome.windows.getLastFocused();
    if (window.focused) {
      const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
      if (tab?.id) {
        await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['reminder.js'] });
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'mam-reminder', kind, test, appearance: { theme:settings.theme, pot:settings.pot, dismissSeconds:settings.dismissSeconds, cupMl:settings.cupMl } }, { frameId: 0 });
        if (response?.shown) return;
      }
    }
  } catch (error) {
    // Internal pages, stores and unavailable tabs fall back to desktop notifications.
  }
  }
  const channel = test ? 'test' : kind;
  // A fresh ID makes this a new reminder instead of replacing an unread toast.
  await clearNotifications(channel);
  await chrome.notifications.create(`mam:${channel}:${settings.cupMl}:${crypto.randomUUID()}`, {
    type: 'basic', iconUrl: 'icons/icon128.png',
    title: kind === 'water' ? 'Một ngụm nước, một chút yêu thương 💧' : 'Đứng dậy cùng Mầm nhé 🌱',
    message: kind === 'water' ? 'Tạm nghỉ một chút và uống một ly nước nhé. Mầm đợi bạn nè!' : 'Rời ghế, duỗi vai và đi lại một chút. Cơ thể sẽ cảm ơn bạn đó!',
    buttons: test ? [] : [{ title: kind === 'water' ? `Đã uống ${settings.cupMl} ml` : 'Đã vận động' }, { title: 'Nhắc lại sau 5 phút' }],
    priority: 1, silent: !settings.sound
  });
}
async function complete(kind, amountMl) {
  if (!kinds.includes(kind)) throw new Error('Hoạt động không hợp lệ.');
  const data = await read();
  const amount = kind === 'water' ? (amountMl ?? data.settings.cupMl) : 0;
  if (kind === 'water' && (!Number.isInteger(amount) || amount < 50 || amount > 2000)) throw new Error('Lượng nước cần từ 50 đến 2000 ml.');
  data.stats[kind]++;
  data.stats.waterMl += amount;
  data.history[data.stats.day] = data.stats;
  data.lastAction = {id:crypto.randomUUID(),kind,amountMl:amount,day:data.stats.day};
  await chrome.storage.local.set(data);
  await chrome.alarms.clear(`snooze-${kind}`);
  await clearNotifications(kind);
  await schedule(data.settings, [kind]);
}
async function undo(id) {
  const data = await read();
  const action = data.lastAction;
  if (!action || action.id !== id) throw new Error('Lần ghi nhận này đã được hoàn tác hoặc thay thế.');
  const entry = data.history[action.day];
  if (entry) { entry[action.kind] = Math.max(0,entry[action.kind]-1); entry.waterMl = Math.max(0,entry.waterMl-action.amountMl); }
  if (action.day === data.stats.day) data.stats = entry;
  data.lastAction = null;
  await chrome.storage.local.set(data);
}
async function snooze(kind) {
  if (!kinds.includes(kind)) throw new Error('Hoạt động không hợp lệ.');
  const {settings} = await read();
  if (settings[`${kind}Enabled`] && settings.pausedUntil <= Date.now()) {
    const when = nextAllowed(settings,Date.now()+5*60000);
    await chrome.alarms.create(`snooze-${kind}`,{when});
    // Snoozing supersedes the regular reminder, avoiding two reminders close together.
    await chrome.alarms.create(kind,{when:nextAllowed(settings,when+settings[`${kind}Minutes`]*60000)});
  }
  await clearNotifications(kind);
}
// Serialize state mutations so rapid clicks cannot overwrite each other.
let queue = Promise.resolve();
function enqueue(fn, report = true) { const task = queue.then(fn); queue = task.catch(error => { if (report) console.error(error); }); return task; }
chrome.runtime.onInstalled.addListener(() => enqueue(async () => { const data = await read(); await chrome.storage.local.set(data); await schedule(data.settings); }));
chrome.runtime.onStartup.addListener(() => enqueue(async () => schedule((await read()).settings,kinds)));
chrome.alarms.onAlarm.addListener(alarm => enqueue(async () => {
  const { settings } = await read();
  if (alarm.name === 'resume') { await schedule(settings); return; }
  const kind = alarm.name.replace('snooze-', '');
  if (!kinds.includes(kind)) return;
  await chrome.alarms.clear(alarm.name);
  await schedule(settings,[kind]);
  if (settings[`${kind}Enabled`] && settings.pausedUntil <= Date.now() && inSchedule(settings)) await notify(kind);
}));
chrome.notifications.onButtonClicked.addListener((id, index) => enqueue(async () => {
  const kind = notificationKind(id);
  if (!kinds.includes(kind) || ![0, 1].includes(index)) return;
  const existing = await chrome.notifications.getAll();
  if (!Object.hasOwn(existing, id)) return;
  if (index === 0) await complete(kind,kind === 'water' && id.split(':').length === 4 ? Number(id.split(':')[2]) : undefined);
  else await snooze(kind);
}));
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id) return;
  enqueue(async () => {
    const data = await read();
    if (message.type === 'save') {
      const changes = validateSettings(message.settings,data.settings);
      const scheduleKeys = ['scheduleEnabled','days','startTime','endTime','lunchEnabled','lunchStart','lunchEnd'];
      const changed = key => key in changes && JSON.stringify(changes[key]) !== JSON.stringify(data.settings[key]);
      const reset = scheduleKeys.some(changed) ? kinds : kinds.filter(kind => changed(`${kind}Minutes`));
      data.settings = { ...data.settings, ...changes };
      data.stats.goalMl = data.settings.goalMl;
      data.history[data.stats.day] = data.stats;
      await chrome.storage.local.set(data);
      for (const kind of reset) await chrome.alarms.clear(`snooze-${kind}`);
      await schedule(data.settings,reset);
    } else if (message.type === 'pause') {
      const minutes = message.minutes ?? 60;
      if (![25,50,60,90].includes(minutes)) throw new Error('Thời gian tập trung không hợp lệ.');
      data.settings.pausedUntil = message.resume ? 0 : Date.now() + minutes * 60 * 1000;
      await chrome.storage.local.set({ settings: data.settings });
      for (const kind of kinds) await clearNotifications(kind);
    }
    else if (message.type === 'complete') await complete(message.kind,message.amountMl);
    else if (message.type === 'undo') await undo(message.id);
    else if (message.type === 'snooze') await snooze(message.kind);
    else if (message.type === 'test') await notify('water', true);
    await schedule((await read()).settings);
    const current = await read();
    return { ...current, alarms: await chrome.alarms.getAll() };
  }, false).then(data => respond({ ok: true, ...data }), error => respond({ ok: false, error: error.message }));
  return true;
});

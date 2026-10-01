export const defaults = {
  waterMinutes: 30, stretchMinutes: 60, waterEnabled: true, stretchEnabled: true,
  inPageEnabled: false, goal: 8, cupMl: 250, goalMl: 2000, pausedUntil: 0,
  scheduleEnabled: false, days: [1,2,3,4,5], startTime: '08:00', endTime: '17:30',
  lunchEnabled: true, lunchStart: '12:00', lunchEnd: '13:00',
  theme: 'sage', pot: 'clay', sound: true, dismissSeconds: 10, language: 'vi'
};
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
export function normalizeStats(stats = {}, date = new Date()) {
  return stats.day === dayKey(date) ? stats : { day: dayKey(date), water: 0, stretch: 0 };
}
export function migrateData(data = {}, date = new Date()) {
  const settings = { ...defaults, ...data.settings };
  if (data.settings?.goalMl === undefined) settings.goalMl = (data.settings?.goal ?? 8) * 250;
  const history = { ...data.history };
  const convert = s => ({ ...s, waterMl: s.waterMl ?? s.water * 250, goalMl: s.goalMl ?? settings.goalMl });
  if (data.stats?.day) history[data.stats.day] = convert(data.stats);
  const today = dayKey(date);
  const stats = convert(history[today] ?? normalizeStats({}, date));
  stats.goalMl = settings.goalMl;
  history[today] = stats;
  return { settings, stats, history, lastAction: data.lastAction ?? null, schemaVersion: 2 };
}
const timeValue = value => { const [h,m] = value.split(':').map(Number); return h * 60 + m; };
export function validateSettings(input, current = defaults) {
  const result = {};
  const ranges = {waterMinutes:[5,180],stretchMinutes:[5,180],goal:[1,20],cupMl:[50,2000],goalMl:[100,10000]};
  for (const [key,[min,max]] of Object.entries(ranges)) if (key in input) {
    const n = Number(input[key]);
    if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Giá trị cần từ ${min} đến ${max}.`);
    result[key] = n;
  }
  for (const key of ['waterEnabled','stretchEnabled','inPageEnabled','scheduleEnabled','lunchEnabled','sound']) if (key in input) {
    if (typeof input[key] !== 'boolean') throw new Error('Tùy chọn bật/tắt không hợp lệ.');
    result[key] = input[key];
  }
  for (const [key,choices] of Object.entries({language:['vi','en'],theme:['sage','rose','sky'],pot:['clay','lavender','cream'],dismissSeconds:[0,5,10,20,30]})) if (key in input) {
    if (!choices.includes(input[key])) throw new Error('Tùy chọn cá nhân hóa không hợp lệ.');
    result[key] = input[key];
  }
  for (const key of ['startTime','endTime','lunchStart','lunchEnd']) if (key in input) {
    if (typeof input[key] !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(input[key])) throw new Error('Giờ không hợp lệ.');
    result[key] = input[key];
  }
  if ('days' in input) {
    if (!Array.isArray(input.days) || !input.days.length || input.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) throw new Error('Chọn ít nhất một ngày nhắc.');
    result.days = [...new Set(input.days)].sort();
  }
  const s = {...current,...result};
  if (s.startTime >= s.endTime) throw new Error('Giờ kết thúc phải sau giờ bắt đầu trong cùng ngày.');
  if (s.lunchEnabled && (s.lunchStart >= s.lunchEnd || s.lunchStart < s.startTime || s.lunchEnd > s.endTime || (s.lunchStart === s.startTime && s.lunchEnd === s.endTime))) throw new Error('Giờ nghỉ trưa phải nằm trong giờ nhắc và không chiếm toàn bộ khung giờ.');
  return result;
}
export function inSchedule(settings, date = new Date()) {
  if (!settings.scheduleEnabled) return true;
  const minute = date.getHours() * 60 + date.getMinutes();
  return settings.days.includes(date.getDay()) && minute >= timeValue(settings.startTime) && minute < timeValue(settings.endTime)
    && !(settings.lunchEnabled && minute >= timeValue(settings.lunchStart) && minute < timeValue(settings.lunchEnd));
}
export function nextAllowed(settings, timestamp) {
  if (!settings.scheduleEnabled) return timestamp;
  const start = new Date(timestamp);
  for (let offset=0; offset<=7; offset++) {
    const date = new Date(start); date.setDate(start.getDate()+offset); date.setHours(0,0,0,0);
    if (!settings.days.includes(date.getDay())) continue;
    const at = time => { const d = new Date(date); d.setMinutes(timeValue(time)); return d.getTime(); };
    const windows = settings.lunchEnabled ? [[settings.startTime,settings.lunchStart],[settings.lunchEnd,settings.endTime]] : [[settings.startTime,settings.endTime]];
    for (const [from,to] of windows) { const candidate = Math.max(timestamp,at(from)); if (candidate < at(to)) return candidate; }
  }
  throw new Error('Không tìm thấy giờ nhắc hợp lệ.');
}
export function weekData(history, date = new Date(), language = 'vi') {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(date); d.setDate(d.getDate()-6+i); const key = dayKey(d);
    return {day:key,label:d.toLocaleDateString(language === 'en' ? 'en-US' : 'vi-VN',{day:'numeric',month:'numeric'}),weekday:d.getDay(),known:Boolean(history[key]),...(history[key] ?? {water:0,waterMl:0,stretch:0,goalMl:0})};
  });
}
export function plantState(history, stats) {
  const points = Object.values(history).reduce((sum,d) => sum+d.water+d.stretch,0);
  const stage = points>=60 ? 3 : points>=25 ? 2 : points>=8 ? 1 : 0;
  return {points,stage,next:[8,25,60,null][stage],name:['Mầm mới','Lá non','Cây xanh','Cây trưởng thành'][stage],bloom:stats.waterMl>=stats.goalMl};
}

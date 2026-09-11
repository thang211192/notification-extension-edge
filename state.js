export const defaults = { waterMinutes: 30, stretchMinutes: 60, waterEnabled: true, stretchEnabled: true, goal: 8, pausedUntil: 0 };
export function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
export function normalizeStats(stats = {}, date = new Date()) {
  return stats.day === dayKey(date) ? stats : { day: dayKey(date), water: 0, stretch: 0 };
}
export function validateSettings(input) {
  const result = {};
  for (const key of ['waterMinutes', 'stretchMinutes', 'goal']) {
    if (key in input) {
      const n = Number(input[key]);
      const max = key === 'goal' ? 20 : 180;
      const min = key === 'goal' ? 1 : 5;
      if (!Number.isInteger(n) || n < min || n > max) throw new Error(`Giá trị cần từ ${min} đến ${max}.`);
      result[key] = n;
    }
  }
  for (const key of ['waterEnabled', 'stretchEnabled']) if (key in input) result[key] = Boolean(input[key]);
  return result;
}

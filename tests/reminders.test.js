import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, normalizeStats, validateSettings } from '../state.js';

test('daily stats reset using local date, preserving current day', () => {
  const date = new Date(2026, 8, 11, 0, 1);
  assert.deepEqual(normalizeStats({day:'2026-9-10',water:7,stretch:2},date), {day:'2026-9-11',water:0,stretch:0});
  assert.equal(normalizeStats({day:'2026-9-11',water:3,stretch:1},date).water,3);
});
test('settings reject invalid values and ignore unrelated fields', () => {
  for (const goal of [0,21,NaN,2.5]) assert.throws(() => validateSettings({goal}));
  assert.throws(() => validateSettings({waterMinutes:0}));
  assert.deepEqual(validateSettings({goal:10,pausedUntil:123}),{goal:10});
});
test('background schedules, records, pauses, snoozes and restores alarms', async () => {
  const listeners = {};
  const event = name => ({addListener(fn) {listeners[name] = fn;}});
  const alarms = new Map();
  const notifications = new Map();
  let data = {};
  globalThis.chrome = {
    runtime: {id:'test',onInstalled:event('install'),onStartup:event('startup'),onMessage:event('message')},
    storage:{local:{async get(){return structuredClone(data);},async set(value){data = {...data,...structuredClone(value)};}}},
    alarms:{onAlarm:event('alarm'),async create(name,options){alarms.set(name,{name,...options,scheduledTime:options.when || Date.now()+options.delayInMinutes*60000});},async clear(name){return alarms.delete(name);},async get(name){return alarms.get(name);},async getAll(){return [...alarms.values()];}},
    notifications:{onButtonClicked:event('button'),async create(id,options){notifications.set(id,options);},async clear(id){return notifications.delete(id);}}
  };
  await import('../background.js');
  await listeners.install();
  assert.equal(alarms.get('water').periodInMinutes,30);
  assert.equal(alarms.get('stretch').periodInMinutes,60);
  const send = message => new Promise(resolve => listeners.message(message,{id:'test'},resolve));
  const initialTime = alarms.get('water').scheduledTime;
  await send({type:'get'});
  assert.equal(alarms.get('water').scheduledTime,initialTime);
  await Promise.all(Array.from({length:5},() => send({type:'complete',kind:'water'})));
  assert.equal(data.stats.water,5);
  await listeners.alarm({name:'water'});
  assert.equal(notifications.get('water').buttons.length,2);
  await listeners.button('water',1);
  assert.ok(alarms.has('snooze-water'));
  await send({type:'complete',kind:'water'});
  assert.ok(!alarms.has('snooze-water'));
  await send({type:'pause'});
  assert.ok(!alarms.has('water'));
  assert.ok(alarms.has('resume'));
  notifications.clear();
  await listeners.alarm({name:'stretch'});
  assert.equal(notifications.size,0);
  await send({type:'pause',resume:true});
  assert.ok(alarms.has('water'));
  await send({type:'save',settings:{waterEnabled:false,stretchMinutes:15}});
  assert.ok(!alarms.has('water'));
  assert.equal(alarms.get('stretch').periodInMinutes,15);
  alarms.clear();
  await listeners.startup();
  assert.ok(alarms.has('stretch'));
  assert.ok(!alarms.has('water'));
  const invalid = await send({type:'save',settings:{goal:-1}});
  assert.equal(invalid.ok,false);
  assert.equal(data.settings.goal,defaults.goal);
  let focused = true, injectable = true, shown = true;
  const delivered = [];
  chrome.windows = { async getLastFocused() { return { id: 1, focused }; } };
  chrome.tabs = {
    async query() { return [{ id: 42 }]; },
    async sendMessage(id, message) { delivered.push({id,...message}); return {shown}; }
  };
  chrome.scripting = { async executeScript() { if (!injectable) throw new Error('Restricted page'); } };
  notifications.clear();
  await listeners.alarm({name:'stretch'});
  assert.equal(delivered.at(-1).kind,'stretch');
  assert.equal(notifications.size,0,'in-page delivery avoids duplicate desktop notification');
  const countBeforeTest = data.stats.water;
  await send({type:'test'});
  assert.equal(delivered.at(-1).test,true);
  assert.equal(data.stats.water,countBeforeTest,'preview does not record a drink');
  await send({type:'snooze',kind:'stretch'});
  assert.equal(alarms.get('snooze-stretch').delayInMinutes,5);
  await send({type:'complete',kind:'stretch'});
  assert.ok(!alarms.has('snooze-stretch'));
  injectable = false;
  await listeners.alarm({name:'stretch'});
  assert.ok(notifications.has('stretch'),'restricted pages use desktop notification');
  injectable = true; focused = false; notifications.clear();
  await listeners.alarm({name:'stretch'});
  assert.ok(notifications.has('stretch'),'unfocused browser uses desktop notification');
  focused = true; shown = false; notifications.clear();
  await listeners.alarm({name:'stretch'});
  assert.ok(notifications.has('stretch'),'tab hidden during delivery uses desktop notification');
});

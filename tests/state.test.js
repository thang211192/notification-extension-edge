import test from 'node:test';
import assert from 'node:assert/strict';
import {defaults,migrateData,validateSettings,inSchedule,nextAllowed,weekData,plantState} from '../state.js';
const monday = new Date(2026,8,28,9,0);
const schedule = {...defaults,scheduleEnabled:true};
test('migrates existing glasses without losing old day or altering totals on a second read',()=>{
  const raw={settings:{goal:6},stats:{day:'2026-9-27',water:5,stretch:2}};
  const migrated=migrateData(raw,monday);
  assert.equal(migrated.settings.goalMl,1500);
  assert.equal(migrated.history['2026-9-27'].waterMl,1250);
  assert.equal(migrated.stats.waterMl,0);
  assert.deepEqual(migrateData(migrated,monday),migrated);
  migrated.settings.cupMl=500;
  assert.equal(migrateData(migrated,monday).history['2026-9-27'].waterMl,1250);
});
test('schedule handles start, lunch, end and weekend boundaries',()=>{
  const at=(h,m=0)=>new Date(2026,8,28,h,m);
  assert.ok(!inSchedule(schedule,at(7,59)));
  assert.ok(inSchedule(schedule,at(8)));
  assert.ok(!inSchedule(schedule,at(12)));
  assert.ok(inSchedule(schedule,at(13)));
  assert.ok(!inSchedule(schedule,at(17,30)));
  assert.equal(nextAllowed(schedule,+at(7)),+at(8));
  assert.equal(nextAllowed(schedule,+at(12,59)),+at(13));
  assert.equal(nextAllowed(schedule,+new Date(2026,9,2,17,30)),+new Date(2026,9,5,8));
  assert.equal(nextAllowed({...schedule,lunchEnabled:false},+at(12,30)),+at(12,30));
  assert.equal(nextAllowed({...schedule,scheduleEnabled:false},+at(2)),+at(2));
});
test('rejects impossible schedules and unsafe settings',()=>{
  for(const input of [{days:[]},{days:[7]},{startTime:'25:00'},{startTime:'18:00'},{lunchEnd:'11:00'},{cupMl:0},{goalMl:10001},{dismissSeconds:1},{theme:'bad'},{sound:'yes'}]) assert.throws(()=>validateSettings(input));
  assert.equal(validateSettings({startTime:'18:00',endTime:'23:00',lunchEnabled:false}).startTime,'18:00');
});
test('week distinguishes unknown dates from recorded zero and handles month boundaries',()=>{
  const data=migrateData({},new Date(2026,9,2));
  const week=weekData(data.history,new Date(2026,9,2));
  assert.equal(week.length,7);
  assert.equal(week[0].day,'2026-9-26');
  assert.equal(week[0].known,false);
  assert.equal(week.at(-1).known,true);
});
test('plant grows cumulatively, blooms at daily goal, does not lose progress on a rest day',()=>{
  const history={'2026-9-27':{water:20,waterMl:5000,stretch:5}};
  assert.equal(plantState(history,{waterMl:0,goalMl:2000}).stage,2);
  assert.equal(plantState(history,{waterMl:2000,goalMl:2000}).bloom,true);
  assert.equal(plantState({...history,'2026-9-28':{water:0,stretch:0}},{waterMl:0,goalMl:2000}).points,25);
});

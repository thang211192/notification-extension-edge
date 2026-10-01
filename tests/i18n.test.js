import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {english,tr,reminderCopy,translateError} from '../i18n.js';
import {migrateData,validateSettings} from '../state.js';
test('English templates preserve interpolation fields',()=>{
  const fields=text=>[...text.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort();
  for(const [vi,en] of Object.entries(english))assert.deepEqual(fields(vi),fields(en),vi);
  assert.equal(tr('en','◷ Nhắc sau {minutes} phút',{minutes:30}),'◷ In 30 min');
  assert.equal(translateError('en','Giá trị cần từ 50 đến 2000.'),'Enter a value from 50 to 2000.');
});
test('in-page copy covers both languages, reminder types and test states',()=>{
  for(const kind of ['water','stretch'])for(const preview of [true,false]){
    const copy=reminderCopy('en',350,20,preview,kind);
    assert.ok(copy.title.includes(kind==='water'?'drink':'stretch'));
    assert.equal(copy.snooze,'Snooze for 5 minutes');
    assert.ok(copy.hint.includes('20 seconds'));
    assert.ok(!Object.values(copy).some(text=>text.includes('{')));
  }
  assert.ok(reminderCopy('vi',350,0,false,'water').complete.includes('350 ml'));
  assert.ok(reminderCopy('en',350,0,false,'water').hint.includes('until you close'));
});
test('language migration preserves existing Vietnamese users and settings',()=>{
  assert.equal(migrateData({settings:{cupMl:350}}).settings.language,'vi');
  assert.equal(migrateData({settings:{language:'en',cupMl:350}}).settings.language,'en');
  assert.deepEqual(validateSettings({language:'en'}),{language:'en'});
  assert.throws(()=>validateSettings({language:'de'}));
});
test('manifest resolves all localized metadata for English and Vietnamese',()=>{
  const manifest=JSON.parse(fs.readFileSync('manifest.json','utf8'));
  for(const lang of ['en','vi']){
    const messages=JSON.parse(fs.readFileSync(`_locales/${lang}/messages.json`,'utf8'));
    for(const match of JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g))assert.ok(messages[match[1]]?.message);
  }
});

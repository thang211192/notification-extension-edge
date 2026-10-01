import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('.');
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,`.${pathname}`);
  if(!file.startsWith(root) || !['.html','.js','.css','.png'].includes(extname(file))){res.writeHead(404);res.end();return;}
  try{const body=await readFile(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'})[extname(file)]);res.end(body);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:460,height:1000}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const today=new Date(), day=`${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
    const data=JSON.parse(localStorage.getItem('testData') || 'null') ?? {settings:{goal:8},stats:{day,water:2,stretch:1}};
    const alarms=new Map(),notifications=new Map(),listeners={},storageListeners=[];
    const event=name=>({addListener(fn){listeners[name]=fn;}});
    let background;
    globalThis.chrome={
      runtime:{id:'browser-test',onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message'),async sendMessage(message){background??=import('/background.js');await background;return new Promise(resolve=>listeners.message(message,{id:'browser-test'},resolve));}},
      storage:{onChanged:{addListener(fn){storageListeners.push(fn);}},local:{async get(){return structuredClone(data);},async set(value){const changes={};for(const [key,newValue] of Object.entries(value)){changes[key]={oldValue:data[key],newValue:structuredClone(newValue)};data[key]=structuredClone(newValue);}localStorage.setItem('testData',JSON.stringify(data));storageListeners.forEach(fn=>fn(changes,'local'));}}},
      alarms:{onAlarm:event('alarm'),async create(name,options){alarms.set(name,{name,...options,scheduledTime:options.when});},async clear(name){return alarms.delete(name);},async get(name){return alarms.get(name);},async getAll(){return [...alarms.values()];}},
      notifications:{onButtonClicked:event('button'),async getAll(){return Object.fromEntries(notifications);},async create(id,options){notifications.set(id,options);},async clear(id){notifications.delete(id);}}
    };
    globalThis.testState={data,alarms,notifications,listeners};
  });
  await page.goto(`${origin}/popup.html`);
  await page.waitForFunction(()=>document.querySelector('#waterCount').textContent.includes('500'));
  assert.equal(await page.locator('#weekChart button').count(),7);
  await page.locator('#drink').click();
  await page.waitForFunction(()=>document.querySelector('#waterCount').textContent.includes('750'));
  await page.locator('#undo').click();
  await page.waitForFunction(()=>document.querySelector('#waterCount').textContent.includes('500'));
  await page.locator('#settings summary').click();
  await page.locator('#cupMl').fill('350');
  await page.locator('#goalMl').fill('850');
  await page.locator('#settingsForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#drink').textContent.includes('350'));
  await page.locator('#drink').click();
  await page.waitForFunction(()=>document.querySelector('#plant').classList.contains('bloom'));
  assert.ok((await page.locator('#dayDetail').textContent()).includes('850'));
  await page.locator('#scheduleEnabled').check();
  await page.locator('#lunchEnabled').uncheck();
  await page.locator('#startTime').fill('09:00');
  await page.locator('#endTime').fill('18:00');
  for(const checkbox of await page.locator('#days input').all()) await checkbox.uncheck();
  await page.locator('#settingsForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#settingsMessage').textContent.includes('ít nhất'));
  await page.locator('#days input[value="1"]').check();
  await page.locator('#settingsForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#settingsMessage').textContent.includes('Đã lưu'));
  await page.locator('#settings summary').click();
  await page.locator('[data-focus="25"]').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('tập trung'));
  assert.equal(await page.evaluate(()=>testState.alarms.has('water')),false);
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('#waterCount').textContent.includes('850'));
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('tập trung'));
  await page.locator('#resume').click();
  await page.waitForFunction(()=>document.querySelector('#resume').hidden);
  await page.locator('#personalization summary').click();
  await page.locator('#theme').selectOption('rose');
  await page.locator('#pot').selectOption('lavender');
  await page.locator('#dismissSeconds').selectOption('20');
  await page.locator('#sound').uncheck();
  await page.locator('#appearanceForm button[type=submit]').click();
  await page.waitForFunction(()=>document.body.dataset.theme==='rose');
  assert.equal(await page.locator('body').getAttribute('data-pot'),'lavender');
  await page.locator('#test').click();
  await page.waitForFunction(()=>testState.notifications.size===1);
  assert.equal(await page.evaluate(()=>[...testState.notifications.values()][0].silent),true);
  await page.locator('#weekChart button').first().click();
  assert.ok((await page.locator('#dayDetail').textContent()).includes('Chưa có'));
  await page.locator('#weekChart button').last().click();
  await page.locator('#personalization summary').click();
  await page.evaluate(()=>document.querySelector('#toast').style.display='none');
  const beforeLanguage=await page.evaluate(()=>({history:testState.data.history,stats:testState.data.stats}));
  await page.locator('#language').selectOption('en');
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await page.locator('#settings summary b').textContent(),'Your reminder schedule');
  assert.equal(await page.locator('#weekPanel summary b').textContent(),'Your week at a glance');
  assert.ok((await page.locator('#waterCount').textContent()).includes('850'));
  assert.equal(await page.locator('#test').textContent(),'Test notification');
  assert.deepEqual(await page.evaluate(()=>({history:testState.data.history,stats:testState.data.stats})),beforeLanguage,'language change preserves activity history');
  await page.locator('#settings summary').click();
  assert.ok((await page.locator('label:has(#waterMinutes)').textContent()).includes('Water interval'));
  assert.equal(await page.locator('#days label').first().innerText(),'Mon');
  for(const checkbox of await page.locator('#days input').all()) await checkbox.uncheck();
  await page.locator('#settingsForm button[type=submit]').click();
  await page.waitForFunction(()=>document.querySelector('#settingsMessage').textContent==='Select at least one reminder day.');
  await page.locator('#settings summary').click();
  await page.locator('#test').click();
  await page.waitForFunction(()=>[...testState.notifications.values()].some(n=>n.title.includes('self-care')));
  await page.reload();
  await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert.equal(await page.locator('#language').inputValue(),'en','language survives reopening');
  await page.locator('#settings summary').click();
  await page.locator('#personalization summary').click();
  const untranslated=await page.evaluate(()=>{
    const texts=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(node.parentElement.closest('script,.language-row'))continue;
      const text=node.textContent.replaceAll(/mầm|Mầm|MẦM/g,'');
      if(/[ăâđêôơưàáạảãằắặẳẵầấậẩẫèéẹẻẽềếệểễìíịỉĩòóọỏõồốộổỗờớợởỡùúụủũừứựửữỳýỵỷỹ]/i.test(text))texts.push(text.trim());
    }return texts;
  });
  assert.deepEqual(untranslated,[],'all English popup strings are translated');
  await page.locator('#settings summary').click();
  await page.locator('#personalization summary').click();
  await mkdir('.remember/tmp',{recursive:true});
  await page.screenshot({path:'.remember/tmp/mam-english.png',fullPage:true});
  await page.locator('#language').selectOption('vi');
  await page.waitForFunction(()=>document.documentElement.lang==='vi');
  assert.equal(await page.locator('#test').textContent(),'Thử thông báo');
  assert.equal(await page.locator('#settings summary b').textContent(),'Nhịp nhắc của bạn');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'popup has no horizontal overflow');
  assert.deepEqual(errors,[]);
  console.log('Edge UI passed: existing features, English/Vietnamese switching, translations, persistence, validation, desktop notification and layout.');
} finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}

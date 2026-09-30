import {chromium} from '@playwright/test';
import {createServer} from 'node:http';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defaults,dayKey} from '../state.js';

const root=fileURLToPath(new URL('../',import.meta.url));
const destination=resolve(root,'release/store-assets');
await mkdir(destination,{recursive:true});
const server=createServer(async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,`.${pathname}`);
  if(!path.startsWith(root.endsWith(sep)?root:root+sep)||!['.html','.js','.css','.png'].includes(extname(path))){res.writeHead(404);res.end();return;}
  try{const bytes=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png'})[extname(path)]);res.end(bytes);}catch{res.writeHead(404);res.end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const variants=[
    {file:'01-mam-overview-1280x800.png',theme:'sage',eyebrow:'MỘT NGƯỜI BẠN NHỎ TRÊN MICROSOFT EDGE',title:'Chăm mình.<br><em>Nuôi mầm.</em>',description:'Nhắc uống nước, đứng dậy và dành một chút yêu thương cho chính bạn.',chips:['💧 Uống nước theo ml','🌱 Cây lớn cùng bạn','🌼 Vươn vai mỗi ngày'],target:null},
    {file:'02-mam-week-focus-1280x800.png',theme:'rose',eyebrow:'NHỮNG ĐIỀU NHỎ, MỘT TUẦN THẬT TỐT',title:'Nhìn lại tuần.<br><em>Thương mình hơn.</em>',description:'Xem lượng nước và vận động trong 7 ngày. Dành riêng 25, 50 hoặc 90 phút để tập trung.',chips:['📊 Lịch sử 7 ngày','☾ Tập trung theo nhịp của bạn','↶ Hoàn tác khi bấm nhầm'],target:'#weekPanel'},
    {file:'03-mam-schedule-1280x800.png',theme:'sky',eyebrow:'MẦM ĐI CÙNG NHỊP SỐNG CỦA BẠN',title:'Đúng giờ bạn chọn.<br><em>Đúng nhịp bạn cần.</em>',description:'Chọn ngày làm việc, giờ nghỉ trưa và dung tích ly. Mầm nhẹ nhàng nhắc theo lịch của bạn.',chips:['🕘 Lịch theo ngày & giờ','💧 Dung tích ly tùy chọn','🎨 Ba tông màu dịu nhẹ'],target:'#settings'}
  ];
  for(const variant of variants){
    const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,locale:'vi-VN',reducedMotion:'reduce'});
    const history={};const amounts=[1500,1750,2000,1250,2000,1750,1250];
    for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-6+i);const key=dayKey(d);history[key]={day:key,water:amounts[i]/250,waterMl:amounts[i],stretch:3+i%3,goalMl:2000};}
    const settings={...defaults,theme:variant.theme,pot:variant.theme==='rose'?'lavender':'clay',scheduleEnabled:variant.target==='#settings'};
    const seed={ok:true,settings,stats:history[dayKey()],history,lastAction:null,alarms:[{name:'water',scheduledTime:Date.now()+30*60000},{name:'stretch',scheduledTime:Date.now()+60*60000}]};
    await context.addInitScript(data=>{globalThis.chrome={runtime:{id:'store-preview',async sendMessage(){return structuredClone(data);}}};},seed);
    const page=await context.newPage();
    await page.goto(`${origin}/store/capture.html`);
    await page.evaluate(v=>{
      document.body.dataset.theme=v.theme;
      document.querySelector('#eyebrow').textContent=v.eyebrow;
      document.querySelector('#headline').innerHTML=v.title;
      document.querySelector('#description').textContent=v.description;
      document.querySelector('#chips').replaceChildren(...v.chips.map(text=>{const span=document.createElement('span');span.textContent=text;return span;}));
    },variant);
    const frame=page.frames().find(f=>f.url().includes('/popup.html'));
    if(!frame)throw new Error('Popup frame did not load');
    await frame.waitForFunction(()=>document.querySelector('#waterCount').textContent.includes('1.250'));
    if(variant.target==='#settings')await frame.locator('#settings summary').click();
    if(variant.target)await frame.evaluate(target=>{window.scrollTo(0,document.querySelector(target).offsetTop-14);},variant.target);
    await page.screenshot({path:resolve(destination,variant.file),animations:'disabled'});
    await context.close();
  }
  await copyFile(resolve(root,'icons/icon128.png'),resolve(destination,'store-icon-128.png'));
  console.log(`Created three 1280x800 screenshots and the 128px store icon in ${destination}`);
}finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}

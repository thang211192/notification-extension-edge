import { migrateData, weekData, plantState, inSchedule, dayKey } from './state.js';
const $ = id => document.getElementById(id);
const number = value => value.toLocaleString('vi-VN');
const isExtension = Boolean(globalThis.chrome?.runtime?.id);
let state, toastTimer, selectedDay = dayKey(), chartSignature;
function toast(message) { $('toast').textContent=message; $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),4000); }
async function request(message) {
  if (!isExtension) throw new Error('Hãy tải extension vào Edge để dùng tính năng này.');
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw new Error(result?.error || 'Chưa kết nối được với Mầm. Hãy mở lại nhé.');
  state=result; render();
}
async function act(message, success) {
  try { await request(message); if(success) toast(success); return true; }
  catch(error) { toast(error.message); if(state) render(); return false; }
}
function renderClock() {
  if (!state) return;
  const s=state.settings, paused=s.pausedUntil>Date.now();
  $('status').textContent=paused?'☾ Đang tập trung':!s.waterEnabled&&!s.stretchEnabled?'○ Đã tắt lời nhắc':!inSchedule(s)?'☾ Ngoài giờ nhắc':'● Đang chăm bạn';
  $('focusChoices').hidden=paused; $('resume').hidden=!paused;
  const seconds=Math.max(0,Math.ceil((s.pausedUntil-Date.now())/1000));
  $('focusCountdown').textContent=paused?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`:'';
  $('focusHint').textContent=paused?'Mầm sẽ tự tiếp tục lịch nhắc khi hết giờ.':'Tạm dừng lời nhắc, dành trọn tâm trí cho việc bạn làm.';
  for(const kind of ['water','stretch']) {
    const alarm=state.alarms.filter(a=>a.name===kind||a.name===`snooze-${kind}`).sort((a,b)=>a.scheduledTime-b.scheduledTime)[0];
    let text='Đang lên lịch…';
    if(alarm) {
      const minutes=Math.max(1,Math.ceil((alarm.scheduledTime-Date.now())/60000));
      text=minutes<=90?`◷ Nhắc sau ${minutes} phút`:`◷ ${new Date(alarm.scheduledTime).toLocaleString('vi-VN',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}`;
    }
    $(`${kind}Next`).textContent=paused?'☾ Đang tập trung':!s[`${kind}Enabled`]?'Lời nhắc đang tắt':text;
  }
}
function renderWeek() {
  const week=weekData(state.history);
  if(!week.some(d=>d.day===selectedDay)) selectedDay=dayKey();
  $('weekWater').textContent=`${number(week.reduce((sum,d)=>sum+d.waterMl,0))} ml`;
  $('weekStretch').textContent=`${week.reduce((sum,d)=>sum+d.stretch,0)} lần vận động`;
  const signature=JSON.stringify(week);
  if(signature!==chartSignature) {
    chartSignature=signature;
    const max=Math.max(1,...week.map(d=>d.waterMl));
    $('weekChart').replaceChildren(...week.map(d=>{
      const button=document.createElement('button'); button.type='button'; button.className=`day-bar${d.known?'':' unknown'}`; button.dataset.day=d.day;
      button.setAttribute('aria-label',`${d.label}: ${d.known?`${number(d.waterMl)} ml, ${d.stretch} lần vận động`:'chưa có dữ liệu'}`);
      const track=document.createElement('span'); track.className='bar-track';
      const fill=document.createElement('span'); fill.className='bar-fill'; fill.style.height=`${d.waterMl/max*100}%`; track.append(fill);
      const label=document.createElement('span'); label.textContent=d.weekday===0?'CN':`T${d.weekday+1}`;
      button.append(track,label); button.addEventListener('click',()=>{selectedDay=d.day;renderWeek();}); return button;
    }));
  }
  for(const button of $('weekChart').children) button.setAttribute('aria-pressed',String(button.dataset.day===selectedDay));
  const d=week.find(d=>d.day===selectedDay);
  $('dayDetail').textContent=d.known?`${d.label} · ${number(d.waterMl)} / ${number(d.goalMl)} ml · ${d.stretch} lần vận động`:`${d.label} · Chưa có dữ liệu được lưu.`;
}
function render() {
  const {settings:s,stats}=state;
  document.body.dataset.theme=s.theme; document.body.dataset.pot=s.pot;
  for(const key of ['waterEnabled','stretchEnabled','inPageEnabled']) $(key).checked=s[key];
  $('today').textContent=new Date().toLocaleDateString('vi-VN',{day:'numeric',month:'numeric'});
  $('drink').textContent=`＋ ${number(s.cupMl)} ml`;
  $('cupLabel').textContent=`Ly / bình của bạn: ${number(s.cupMl)} ml`;
  $('waterCount').textContent=`${number(stats.waterMl)} / ${number(s.goalMl)} ml`;
  $('waterProgress').max=s.goalMl; $('waterProgress').value=stats.waterMl;
  $('waterProgress').setAttribute('aria-label',`Đã uống ${stats.waterMl} trên ${s.goalMl} ml`);
  $('stretchCount').textContent=stats.stretch;
  $('encouragement').textContent=stats.waterMl>=s.goalMl?'Đủ mục tiêu rồi. Mầm nở hoa! ♡':`${stats.water} lần uống · Từng ngụm nhỏ đều đáng quý.`;
  const plant=plantState(state.history,stats);
  $('plant').dataset.stage=plant.stage; $('plant').classList.toggle('bloom',plant.bloom);
  $('plant').setAttribute('aria-label',`${plant.name}${plant.bloom?', đang nở hoa':''}`);
  $('plantName').textContent=plant.bloom?'Hôm nay Mầm nở hoa ✿':plant.name;
  $('plantPoints').textContent=`${plant.points} điều tốt`;
  $('plantProgress').max=plant.next??60; $('plantProgress').value=plant.points;
  $('plantHint').textContent=plant.next?`Thêm ${plant.next-plant.points} lần uống nước hoặc vận động để lớn thêm.`:'Mầm đã trưởng thành. Cảm ơn bạn vì từng chút chăm sóc!';
  const action=state.lastAction;
  $('undoRow').hidden=!action;
  if(action) $('lastAction').textContent=`Lần gần nhất: ${action.kind==='water'?`+${number(action.amountMl)} ml`:'vận động'}${action.day===stats.day?'':' (ngày trước)'}`;
  renderClock(); renderWeek();
}
function populateForms() {
  const s=state.settings;
  for(const key of ['waterMinutes','stretchMinutes','cupMl','goalMl','startTime','endTime','lunchStart','lunchEnd','theme','pot','dismissSeconds']) $(key).value=s[key];
  for(const key of ['scheduleEnabled','lunchEnabled','sound']) $(key).checked=s[key];
  for(const input of $('days').querySelectorAll('input')) input.checked=s.days.includes(Number(input.value));
  updateScheduleFields();
}
function updateScheduleFields() {
  $('scheduleFields').disabled=!$('scheduleEnabled').checked;
  for(const input of $('lunchFields').querySelectorAll('input')) input.disabled=!$('lunchEnabled').checked;
}
for(const button of document.querySelectorAll('.complete')) button.addEventListener('click',async()=>{
  button.disabled=true;
  await act({type:'complete',kind:button.dataset.kind},'Đã ghi nhận. Bạn có thể hoàn tác bên dưới ♡');
  button.disabled=false;
});
for(const key of ['waterEnabled','stretchEnabled','inPageEnabled']) $(key).addEventListener('change',async event=>{
  const input=event.target; input.disabled=true; await act({type:'save',settings:{[key]:input.checked}}); input.disabled=false;
});
$('undo').addEventListener('click',async()=>{if(!state.lastAction)return; $('undo').disabled=true; await act({type:'undo',id:state.lastAction.id},'Đã hoàn tác lần ghi nhận gần nhất.'); $('undo').disabled=false;});
for(const button of document.querySelectorAll('[data-focus]')) button.addEventListener('click',()=>act({type:'pause',minutes:Number(button.dataset.focus)},'Mầm chờ bạn. Chúc bạn tập trung thật tốt!'));
$('resume').addEventListener('click',()=>act({type:'pause',resume:true},'Đã tiếp tục lịch nhắc.'));
for(const id of ['scheduleEnabled','lunchEnabled']) $(id).addEventListener('change',updateScheduleFields);
async function saveForm(form,settings,messageId) {
  const button=form.querySelector('button[type=submit]'); button.disabled=true; $(messageId).textContent='';
  try {await request({type:'save',settings}); $(messageId).textContent='Đã lưu ♡';}
  catch(error){$(messageId).textContent=error.message;}
  finally{button.disabled=false;}
}
$('settingsForm').addEventListener('submit',async event=>{
  event.preventDefault(); const settings={};
  for(const key of ['waterMinutes','stretchMinutes','cupMl','goalMl']) settings[key]=Number($(key).value);
  settings.scheduleEnabled=$('scheduleEnabled').checked;
  if(settings.scheduleEnabled) {
    for(const key of ['startTime','endTime','lunchStart','lunchEnd']) settings[key]=$(key).value;
    settings.lunchEnabled=$('lunchEnabled').checked;
    settings.days=[...$('days').querySelectorAll('input:checked')].map(input=>Number(input.value));
  }
  await saveForm(event.target,settings,'settingsMessage');
});
$('appearanceForm').addEventListener('submit',async event=>{event.preventDefault();await saveForm(event.target,{theme:$('theme').value,pot:$('pot').value,sound:$('sound').checked,dismissSeconds:Number($('dismissSeconds').value)},'appearanceMessage');});
$('test').addEventListener('click',()=>act({type:'test'},state?.settings.inPageEnabled?'Đã gửi thẻ thử; đóng popup để xem.':'Đã gửi thông báo hệ thống.'));
async function init(){
  if(isExtension) await act({type:'get'});
  else{state={...migrateData(),alarms:[]};render();$('status').textContent='◌ Xem trước giao diện';}
  if(state)populateForms();
}
init();
setInterval(renderClock,1000);
setInterval(()=>{if(isExtension)act({type:'get'});},15000);

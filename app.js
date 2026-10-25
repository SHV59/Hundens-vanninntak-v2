const $=id=>document.getElementById(id), key='dog-water-v1';let data;try{data=JSON.parse(localStorage.getItem(key))||{dog:'',kg:'',bowls:[0,0,0],records:[]}}catch{data={dog:'',kg:'',bowls:[0,0,0],records:[]}};data.margin=Number.isFinite(Number(data.margin))&&Number(data.margin)>=0?Number(data.margin):0;data.marginPct=Number.isFinite(Number(data.marginPct))&&Number(data.marginPct)>=0?Number(data.marginPct):0;const persist=()=>localStorage.setItem(key,JSON.stringify(data));const n=x=>Number(String(x).replace(',','.'));const grams=x=>{let s=String(x).trim().replace(/\s/g,'');if(/^\d{1,3}(?:[.,]\d{3})+$/.test(s))s=s.replace(/[.,]/g,'');else s=s.replace(',','.');return Number(s)};const fmt=x=>Number(x).toLocaleString('nb-NO',{maximumFractionDigits:1});const localTime=()=>{let d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)};// Migrate legacy three-bowl settings without changing the localStorage key.
if(!Array.isArray(data.bowls))data.bowls=[0,0,0];
data.bowls=data.bowls.map((b,i)=>typeof b==='object'&&b!==null?{id:String(b.id||'b'+i),name:String(b.name||'Skål '+(i+1)),tare:Number(b.tare)||0}:{id:'b'+i,name:'Skål '+(i+1),tare:Number(b)||0});
if(!data.bowls.length)data.bowls=[{id:'b0',name:'Skål 1',tare:0}];
data.sessions=data.sessions||{};data.scaleMode='total';let draftBowls=data.bowls.map(b=>({...b}));
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function renderBowls(){
 $('bowls').innerHTML=draftBowls.map((b,i)=>`<div class="bowlrow"><div><label for="name${i}">Kallenavn</label><input id="name${i}" data-field="name" data-id="${esc(b.id)}" value="${esc(b.name)}" maxlength="60" placeholder="f.eks. Kjøkken"></div><div><label for="tare${i}">Tomvekt (g)</label><input id="tare${i}" data-field="tare" data-id="${esc(b.id)}" type="number" min="0" step="0.1" value="${b.tare}"></div><button type="button" class="danger" data-remove="${esc(b.id)}" ${draftBowls.length===1?'disabled':''}>Fjern</button></div>`).join('');
 $('bowls').querySelectorAll('input').forEach(el=>el.oninput=()=>{let b=draftBowls.find(b=>b.id===el.dataset.id);if(b)b[el.dataset.field]=el.value});
 $('bowls').querySelectorAll('[data-remove]').forEach(el=>el.onclick=()=>{const id=el.dataset.remove;if(!confirm('Fjerne denne skålen fra listen? Tidligere målinger beholdes.'))return;draftBowls=draftBowls.filter(b=>b.id!==id);renderBowls()});
}
$('addBowl').addEventListener('click',()=>{draftBowls.push({id:'b'+Date.now()+Math.random().toString(36).slice(2),name:'Skål '+(draftBowls.length+1),tare:0});renderBowls();$('bowlStatus').textContent='Ny skål lagt til ('+draftBowls.length+' totalt). Gi den et navn og trykk «Lagre innstillinger».';const last=$('bowls').querySelector('.bowlrow:last-child input[data-field=name]');if(last){last.scrollIntoView({block:'nearest',behavior:'smooth'});last.focus({preventScroll:true});last.select()}});
function renderSelect(){const old=$('bowl').value;$('bowl').replaceChildren();data.bowls.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=b.name;$('bowl').append(o)});if(data.bowls.some(b=>b.id===old))$('bowl').value=old}
renderBowls();renderSelect();$('dog').value=data.dog;$('margin').value=data.margin;$('marginPct').value=data.marginPct;$('kg').value=data.kg;$('when').value=localTime();
$('saveSettings').onclick=()=>{const kg=n($('kg').value);if($('kg').value&&(!Number.isFinite(kg)||kg<=0))return alert('Ugyldig hundevekt');const margin=n($('margin').value);if($('margin').value===''||!Number.isFinite(margin)||margin<0)return alert('Feilmargin må være 0 eller større');const marginPct=n($('marginPct').value);if($('marginPct').value===''||!Number.isFinite(marginPct)||marginPct<0||marginPct>100)return alert('Prosentvis feilmargin må være mellom 0 og 100');const bowls=draftBowls.map(b=>({id:b.id,name:String(b.name).trim(),tare:n(b.tare)}));if(bowls.some(b=>!b.name||!Number.isFinite(b.tare)||b.tare<0))return alert('Alle skåler må ha et navn og gyldig tomvekt');if(new Set(bowls.map(b=>b.name.toLocaleLowerCase('nb-NO'))).size!==bowls.length)return alert('Gi skålene forskjellige navn, slik at du kan skille dem');for(const b of bowls){const old=data.bowls.find(x=>x.id===b.id);if(old&&data.sessions[b.id]&&Math.abs(b.tare-old.tare)>0.0001)return alert('Avslutt måleperioden for '+b.name+' før du endrer skålens egenvekt. Dette beskytter beregningene.');}data.dog=$('dog').value.trim();data.kg=$('kg').value?kg:'';data.bowls=bowls;data.margin=margin;data.marginPct=marginPct;data.scaleMode='total';persist();renderSelect();updateForm();render();$('bowlStatus').textContent='Innstillinger lagret. '+data.bowls.length+' skåler er tilgjengelige i måleskjemaet.';notice('Innstillinger lagret');showTab('measure')};
const err=r=>(Number(r.margin)||0)+r.drunk*(Number(r.marginPct)||0)/100;
function getBowl(){return data.bowls.find(b=>b.id===$('bowl').value)}
function updateForm(){let b=getBowl(),s=b&&data.sessions[b.id],action=$('action').value,has=!!s;
 $('sessionInfo').textContent=!b?'Velg en skål':has?`${b.name}: Aktiv måleperiode fra ${s.time.replace('T',' ')}. Siste referansevekt: ${fmt(s.weight)} g. Tomvekt: ${fmt(b.tare)} g.`:`${b.name}: Ingen aktiv måleperiode. Registrer startvekt med vann for å starte.`;
 $('currentWrap').hidden=!has||action==='reset';$('newWrap').hidden=action==='check';$('current').previousElementSibling.textContent='Hva veier skålen med vannet som er igjen? (g)';
 updateNewMode();
 if(!has){$('action').disabled=true;$('current').value='';$('calculation').textContent='Første registrering: vei skålen med vann og lagre startvekten. Dette registreres ikke som drukket vann.'}else{$('action').disabled=false;calc()}}
function updateNewMode(){
 const b=getBowl();
 $('newMode').value='total';
 $('newWeightLabel').textContent='Hva veier skålen med det nye vannet? (g)';
 $('newWeight').placeholder='f.eks. 550';
 $('newWeightHint').textContent=`Skriv totalvekten fra kjøkkenvekten. Skålens egenvekt (${b?fmt(b.tare):'–'} g) trekkes fra automatisk.`;
}
function newTotal(b){
 if($('newWeight').value.trim()==='')throw Error('Fyll inn vekten etter vannbyttet');
 const v=grams($('newWeight').value);
 if(!Number.isFinite(v)||v<0)throw Error('Oppgi en gyldig vekt');
 const total=v;
 if(total<b.tare)throw Error('Vekten kan ikke være lavere enn skålens egenvekt');
 return total;
}
function readMeasurement(){let b=getBowl();if(!b)throw Error('Velg skål');let when=$('when').value;if(!when||!Number.isFinite(Date.parse(when)))throw Error('Velg dato og klokkeslett');if(new Date(when)>new Date(Date.now()+60000))throw Error('Tidspunkt kan ikke være i fremtiden');let s=data.sessions[b.id],action=s?$('action').value:'start';if(s&&when<=s.time)throw Error('Tidspunkt må være etter forrige registrering');let current=null,next=null,drunk=0;
 if(s&&action!=='reset'){if($('current').value.trim()==='')throw Error('Fyll inn vekten før vannbytte for å se beregningen');current=grams($('current').value);if(!Number.isFinite(current)||current<b.tare)throw Error('Totalvekten må være minst like stor som skålens egenvekt');drunk=s.weight-current;if(drunk<0)throw Error('Vekten har økt siden sist. Bruk «Start ny måleperiode» dersom vann er fylt på uten registrering.');}
 if(action!=='check'){next=newTotal(b);}
 return {b,s,when,action,current,next,drunk};}
function calc(){try{let m=readMeasurement();if(!m.s){$('calculation').textContent=`Startvann: ${fmt(m.next-m.b.tare)} ml · Totalvekt: ${fmt(m.next)} g (skål ${fmt(m.b.tare)} g). Ingen vanninntak registreres.`;return}if(m.action==='reset'){$('calculation').textContent=`Forrige periode avsluttes uten vanninntak. Ny startmengde: ${fmt(m.next-m.b.tare)} ml · Totalvekt: ${fmt(m.next)} g.`;return}let e=data.margin+m.drunk*data.marginPct/100;$('calculation').textContent=`Forsvunnet vann: ${fmt(m.drunk)} ml · Feilmargin ±${fmt(e)} ml · Mulig vanninntak ${fmt(Math.max(0,m.drunk-e))}–${fmt(m.drunk+e)} ml.`+(m.next!==null?` Ny vannmengde: ${fmt(m.next-m.b.tare)} ml · Ny totalvekt: ${fmt(m.next)} g.`:'')}catch(e){$('calculation').textContent=e.message}}
['bowl','action'].forEach(id=>$(id).addEventListener('change',updateForm));['when','current','newWeight'].forEach(id=>$(id).addEventListener('input',calc));
$('save').onclick=()=>{try{let m=readMeasurement();if(m.s&&m.action==='reset'&&!confirm('Avslutte måleperioden uten å beregne vanninntak?'))return;if(m.s&&m.action!=='reset'){const note=`Kontroller tallene før lagring:\n\nSkålens egenvekt: ${fmt(m.b.tare)} g\nSkål med vann som er igjen: ${fmt(m.current)} g\nBeregnet vanninntak: ${fmt(m.drunk)} ml\n${m.next!==null?'Ny totalvekt med skål: '+fmt(m.next)+' g':''}`;if(m.drunk>Math.max(250,m.s.weight*0.6)&&!confirm('Uvanlig stor endring.\n'+note))return;}
 if(m.s&&m.action!=='reset'){data.records.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),b:m.b.id,bowlName:m.b.name,start:m.s.time,end:m.when,initial:Math.max(0,m.s.weight-m.b.tare),final:m.current,tare:m.b.tare,rest:Math.max(0,m.current-m.b.tare),drunk:m.drunk,margin:data.margin,marginPct:data.marginPct,action:m.action,note:'',periodId:m.s.periodId||'legacy'})}
 if(!m.s||m.action==='reset')activePeriodId();data.sessions[m.b.id]={weight:m.action==='check'?m.current:m.next,time:m.when,periodId:(m.action==='reset'||!m.s)?activePeriodId():m.s.periodId||'legacy'};persist();render();$('when').value=localTime();$('current').value='';$('newWeight').value='';updateForm();notice(m.action==='start'?'Startmåling lagret':m.action==='reset'?'Ny måleperiode startet':'Registrering lagret')
 }catch(e){alert(e.message)}};
let reportPeriodId=null;let savedReportDates=null;
function filtered(){return data.records.filter(r=>(reportPeriodId===null||r.periodId===reportPeriodId)&&(!$('from').value||r.end.slice(0,10)>=$('from').value)&&(!$('to').value||r.end.slice(0,10)<=$('to').value)).sort((a,b)=>b.end.localeCompare(a.end))}// Løpende gjennomsnitt: samlet registrert vanninntak / unionen av målte tidsintervaller.
// Parallelle skåler teller ikke dobbelt i måletid. Hull mellom registreringer teller ikke.
function intakeTimeline(records){
 const valid=[];
 for(const r of records){
  const start=new Date(r.start).getTime(),end=new Date(r.end).getTime(),amount=Number(r.drunk);
  if(Number.isFinite(start)&&Number.isFinite(end)&&end>start&&Number.isFinite(amount)&&amount>=0){valid.push({start,end,amount,record:r})}
 }
 valid.sort((a,b)=>a.end-b.end||a.start-b.start);
 const points=[];let sum=0;
 for(const item of valid){
  sum+=item.amount;
  const intervals=valid.filter(v=>v.end<=item.end).map(v=>[v.start,v.end]).sort((a,b)=>a[0]-b[0]);
  let covered=0,lo=null,hi=null;
  for(const [a,b] of intervals){if(lo===null){lo=a;hi=b}else if(a<=hi){hi=Math.max(hi,b)}else{covered+=hi-lo;lo=a;hi=b}}
  if(lo!==null)covered+=hi-lo;
  const hours=covered/3600000;
  points.push({time:item.end,avg:hours>0?sum*24/hours:0,sum,hours});
 }
 return points;
}
function drawChart(list){
 const svg=$('chart'),NS='http://www.w3.org/2000/svg';svg.replaceChildren();
 const add=(tag,attrs,content)=>{let e=document.createElementNS(NS,tag);for(let [k,v] of Object.entries(attrs))e.setAttribute(k,v);if(content!==undefined)e.textContent=content;svg.append(e);return e};
 const pts=intakeTimeline(list);
 if(!pts.length){add('text',{x:360,y:140,'text-anchor':'middle',fill:'#587272','font-size':17},'Ingen fullførte målinger i valgt periode');return}
 const L=68,R=24,T=24,B=60,W=720,H=280,max=Math.max(1,...pts.map(p=>p.avg))*1.1;
 const x=i=>L+(pts.length===1?(W-L-R)/2:i*(W-L-R)/(pts.length-1));
 const y=v=>H-B-v/max*(H-T-B);
 for(let i=0;i<=4;i++){let val=max*i/4;add('line',{x1:L,y1:y(val),x2:W-R,y2:y(val),stroke:'#dbe9e6'});add('text',{x:L-8,y:y(val)+4,'text-anchor':'end',fill:'#587272','font-size':12},fmt(val))}
 if(pts.length>1)add('polyline',{points:pts.map((p,i)=>`${x(i)},${y(p.avg)}`).join(' '),fill:'none',stroke:'#126b70','stroke-width':3,'stroke-linejoin':'round'});
 pts.forEach((p,i)=>{const cx=x(i),dot=add('circle',{cx,cy:y(p.avg),r:5,fill:'#126b70'});const title=document.createElementNS(NS,'title');title.textContent=`${dateNO(new Date(p.time).toISOString().slice(0,16))}: ${fmt(p.avg)} ml/24 t · ${fmt(p.sum)} ml over ${fmt(p.hours)} målte timer`;dot.append(title);if(pts.length<=10||i%Math.ceil(pts.length/10)===0||i===pts.length-1){const d=new Date(p.time);add('text',{x:cx,y:H-B+22,'text-anchor':'middle',fill:'#587272','font-size':pts.length>8?10:12},String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0'))}});
 add('text',{x:16,y:14,fill:'#587272','font-size':12},'ml/24 t');
}
function render(){let list=filtered(),sum=list.reduce((a,r)=>a+r.drunk,0);let lower=list.reduce((a,r)=>a+Math.max(0,r.drunk-err(r)),0),upper=list.reduce((a,r)=>a+r.drunk+err(r),0);let days=new Set(list.map(r=>r.end.slice(0,10))).size;let timeline=intakeTimeline(list);let last=timeline.at(-1);let avg=last?last.avg:0;let avgKg=data.kg&&Number(data.kg)>0?avg/Number(data.kg):null;// Klinisk veiledende nivåer, ikke diagnostiske grenser. Døgnsum er basert på sluttdato.
renderWaterAlerts(list);
$('summary').innerHTML=`<strong class="big">${fmt(sum)} ml</strong> totalt (feilmargin: mulig ${fmt(lower)}–${fmt(upper)} ml) i valgt periode (${list.length} målinger, ${days} registreringsdager). <br><strong>Løpende gjennomsnitt: ${fmt(avg)} ml/24 t</strong>${avgKg!==null?` (${fmt(avgKg)} ml/kg/24 t)`:``}. ${data.kg?`Totalt ${fmt(sum/data.kg)} ml/kg. `:''}<br><span class="muted">Beregnet fra ${last?fmt(last.hours):'0'} målte timer. Oppdateres ved hver fullførte veiing, vannbytte eller etterfylling. Parallelle skåler teller ikke dobbelt i måletiden. Uregistrerte tidsrom er ikke inkludert. Kort måletid kan gi store utslag.</span>`;drawChart(list);let body=$('rows');body.replaceChildren();for(let r of list){let tr=document.createElement('tr');[dateNO(r.end),r.bowlName||('Skål '+(Number(r.b)+1)),fmt(r.initial)+' ml',fmt(r.rest)+' ml',fmt(r.drunk)+' ml',`${fmt(Math.max(0,r.drunk-err(r)))}–${fmt(r.drunk+err(r))} ml`,(data.dailyNotes||{})[r.end.slice(0,10)]||r.note||'–'].forEach(s=>{let td=document.createElement('td');td.textContent=s;tr.append(td)});let td=document.createElement('td');td.className='no-print';let edit=document.createElement('button');edit.className='secondary';edit.textContent='Rett';edit.onclick=()=>openEdit(r.id);td.append(edit);let btn=document.createElement('button');btn.className='danger';btn.textContent='Slett';btn.onclick=()=>{if(confirm('Slette denne målingen?')){data.records=data.records.filter(x=>x.id!==r.id);persist();render()}};td.append(btn);tr.append(td);body.append(tr)}renderPeriods();renderDiaryHistory()}$('from').onchange=render;$('to').onchange=render;$('pdf').onclick=()=>{document.title=`Vanninntak ${data.dog||'hund'} ${$('from').value||'alle'}-${$('to').value||'alle'}`;window.print()};$('csv').onclick=()=>{let rows=[['Hund','Vekt kg','Skål','Start','Slutt','Tomvekt g','Start ml','Sluttvekt g','Rest ml','Drukket ml','Fast feilmargin ± ml','Feilmargin ± %','Samlet feilmargin ± ml','Minimum ml','Maksimum ml','Notat'],...filtered().map(r=>[data.dog,data.kg,r.bowlName||('Skål '+(Number(r.b)+1)),r.start,r.end,r.tare,r.initial,r.final,r.rest,r.drunk,r.margin||0,r.marginPct||0,err(r),Math.max(0,r.drunk-err(r)),r.drunk+err(r),(data.dailyNotes||{})[r.end.slice(0,10)]||r.note||''])];let csv='\ufeff'+rows.map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(';')).join('\r\n');let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='vanninntak.csv';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)};$('clear').onclick=()=>{if(confirm('Slette ALLE lagrede målinger? Dette kan ikke angres.')){data.records=[];persist();render()}};
// Versjon 6.2: Norsk datoformat i visning, behold ISO internt.
function dateNO(value){if(!value)return '–';const s=String(value);const m=s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/);return m?`${m[3]}.${m[2]}.${m[1]}${m[4]?' kl. '+m[4]+':'+m[5]:''}`:s;}
function notice(message,warning=false){const el=$('feedback');el.textContent=message;el.className='notice no-print'+(warning?' warn':'');el.hidden=false;clearTimeout(window.__noticeTimer);window.__noticeTimer=setTimeout(()=>{el.hidden=true},6500)}
function showTab(tab){
 const settings=tab==='settings', periods=tab==='periods',measure=tab==='measure';
 $('settingsPanel').hidden=!settings;$('backupPanel').hidden=!settings;
 $('measurePanel').hidden=!measure;$('diaryPanel').hidden=!measure;
 $('periodPanel').hidden=!periods;$('overviewPanel').hidden=!measure;
 for(const [id,on] of [['tabMeasure',measure],['tabPeriods',periods],['tabSettings',settings]])$(''+id).setAttribute('aria-selected',String(on));
 window.scrollTo({top:0,behavior:'smooth'});
}
$('tabMeasure').onclick=()=>showTab('measure');
$('tabPeriods').onclick=()=>showTab('periods');
$('tabSettings').onclick=()=>showTab('settings');
function download(name,body,type){const url=URL.createObjectURL(new Blob([body],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000)}
function backupStatus(){const t=localStorage.getItem('dog-water-last-backup');$('backupStatus').textContent=t?'Siste eksport: '+dateNO(t):'Ingen sikkerhetskopi eksportert i denne nettleseren.'}
$('backupExport').onclick=()=>{try{persist();const stamp=new Date().toISOString();download('hundens-vanninntak-backup-'+stamp.slice(0,10)+'.json',JSON.stringify({format:'dog-water-backup',version:1,exportedAt:stamp,data},null,2),'application/json');localStorage.setItem('dog-water-last-backup',localTime());backupStatus();notice('Sikkerhetskopi laget. Kontroller at JSON-filen finnes i Nedlastinger.')}catch(e){notice('Kunne ikke eksportere: '+e.message,true)}};
$('backupFile').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>15*1024*1024)throw Error('Filen er for stor (maks 15 MB).');const raw=JSON.parse(await file.text());if(raw.format!=='dog-water-backup'||raw.version!==1||!raw.data||typeof raw.data!=='object')throw Error('Dette er ikke en gyldig sikkerhetskopi fra appen.');const incoming=raw.data;if(!Array.isArray(incoming.bowls)||!Array.isArray(incoming.records)||!incoming.sessions||typeof incoming.sessions!=='object'||Array.isArray(incoming.sessions))throw Error('Sikkerhetskopien mangler nødvendige data.');if(incoming.bowls.some(b=>!b||typeof b.id!=='string'||typeof b.name!=='string'||!Number.isFinite(Number(b.tare))||Number(b.tare)<0))throw Error('Ugyldig skål i sikkerhetskopien.');if(incoming.records.some(r=>!r||typeof r.id!=='string'||typeof r.end!=='string'||!Number.isFinite(Number(r.drunk))||Number(r.drunk)<0))throw Error('Ugyldig måling i sikkerhetskopien.');const count=incoming.records.length;if(!confirm(`Importere ${count} målinger og ${incoming.bowls.length} skåler? Dette ERSTATTER alle eksisterende lokale data. Ta sikkerhetskopi først.`))return;localStorage.setItem(key,JSON.stringify(incoming));alert('Import fullført. Appen lastes inn på nytt.');location.reload()}catch(e){notice('Import mislyktes: '+e.message,true)}finally{ev.target.value=''}});
backupStatus();


// v6.6: Day notes, explicit measurement periods and conservative alerts.
data.dailyNotes=data.dailyNotes&&typeof data.dailyNotes==='object'&&!Array.isArray(data.dailyNotes)?data.dailyNotes:{};
data.periods=Array.isArray(data.periods)?data.periods:[];
function activePeriodId(){let p=data.periods.find(p=>!p.end);if(!p){p={id:'p'+Date.now(),name:$('periodName')?.value.trim()||'Måleperiode '+(data.periods.length+1),start:localTime(),end:null};data.periods.push(p)}return p.id}
function loadDiary(){const day=$('diaryDate').value;$('diaryText').value=data.dailyNotes[day]||''}
$('diaryDate').value=localTime().slice(0,10);$('diaryDate').onchange=loadDiary;
$('saveDiary').onclick=()=>{const day=$('diaryDate').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return notice('Velg gyldig dato',true);const value=$('diaryText').value.trim();if(value)data.dailyNotes[day]=value;else delete data.dailyNotes[day];persist();renderDiaryHistory();notice('Dagsnotat lagret')};
function renderDiaryHistory(){const box=$('diaryHistory');box.replaceChildren();Object.entries(data.dailyNotes).sort((a,b)=>b[0].localeCompare(a[0])).forEach(([day,note])=>{let p=document.createElement('p');let b=document.createElement('button');b.type='button';b.textContent=dateNO(day)+' – '+note.slice(0,65)+(note.length>65?'…':'');b.onclick=()=>{$('diaryDate').value=day;loadDiary();$('diaryText').focus()};p.append(b);box.append(p)})}
$('closePeriod').onclick=()=>{const p=data.periods.find(p=>!p.end);const live=Object.keys(data.sessions).length;if(!p&&!live)return notice('Ingen aktiv periode å avslutte',true);if(!confirm('Avslutte perioden og fjerne aktive startvekter? Tidligere målinger beholdes.'))return;if(p)p.end=localTime();data.sessions={};persist();render();updateForm();notice('Periode avsluttet. Historikken er bevart')};
function renderPeriods(){
 const box=$('periodHistory');box.replaceChildren();
 const periods=[...data.periods].reverse();
 if(!periods.length){const p=document.createElement('p');p.className='muted';p.textContent='Ingen arkiverte måleperioder ennå. Eldre målinger finner du under Målinger → Tidligere målinger.';box.append(p)}
 for(const p of periods){
  const related=data.records.filter(r=>r.periodId===p.id);
  const row=document.createElement('div');row.className='card';
  const heading=document.createElement('strong');heading.textContent=(p.name||'Måleperiode')+' · '+dateNO(p.start)+(p.end?' – '+dateNO(p.end):' (aktiv)');row.append(heading);
  const summary=document.createElement('p');summary.textContent=related.length+' målinger · '+fmt(related.reduce((sum,r)=>sum+Number(r.drunk||0),0))+' ml beregnet';row.append(summary);
  const print=document.createElement('button');print.type='button';print.textContent='Vis rapport / Skriv ut';
  print.onclick=()=>{
   // Vis bare målinger med riktig periode-ID, ikke andre perioder på samme dato.
   savedReportDates=[$('from').value,$('to').value];$('from').value='';$('to').value='';reportPeriodId=p.id;
   showTab('measure');render();
   const bar=$('periodReportBar');bar.hidden=false;
   $('periodReportTitle').textContent='Rapport: '+(p.name||'Måleperiode')+' ('+dateNO(p.start)+(p.end?' – '+dateNO(p.end):' – aktiv')+')';
   $('overviewPanel').scrollIntoView({behavior:'smooth'});
  };
  row.append(print);box.append(row);
 }
 if(data.records.some(r=>!r.periodId||r.periodId==='legacy')){const p=document.createElement('p');p.className='muted';p.textContent='Eldre målinger uten periode-ID finnes under Målinger → Tidligere målinger. De tilordnes ikke automatisk en periode.';box.append(p)}
}
// Only call a day complete if every registered bowl has uninterrupted coverage
// throughout a 24-hour window. A calendar-day sum is not sufficient evidence.
function completeWindow(){const bowls=data.bowls.map(b=>b.id);if(!bowls.length)return null;const rows=data.records.filter(r=>r.start&&r.end&&Number.isFinite(Number(r.drunk))&&Number(r.drunk)>=0);const ends=[...new Set(rows.map(r=>r.end))].sort().reverse();for(const end of ends){const t=Date.parse(end);if(!Number.isFinite(t))continue;const from=t-86400000;let total=0,valid=true;for(const b of bowls){let intervals=rows.filter(r=>r.b===b&&Date.parse(r.end)>from&&Date.parse(r.end)<=t).sort((a,c)=>a.start.localeCompare(c.start));let cursor=from,amount=0;for(const r of intervals){let a=Date.parse(r.start),z=Date.parse(r.end);if(a>cursor+60000){valid=false;break}if(z<=cursor)continue;if(a<from){valid=false;break}amount+=Number(r.drunk);cursor=z}if(!valid||cursor<t-60000){valid=false;break}total+=amount}if(valid)return {end,ml:total}}return null}
function renderWaterAlerts(list){const el=$('waterAlert'),kg=Number(data.kg);el.hidden=false;el.style.background='#edf5f4';el.style.color='#173b3b';const caveat=' Målinger og grenseverdier er veiledende, ikke eksakte. Søl, fordamping, fôr, aktivitet og temperatur påvirker vurderingen. Vann fra mat eller andre kilder er ikke med.';if(!Number.isFinite(kg)||kg<=0){el.textContent='Oppgi hundens vekt i Innstillinger for veiledende varsler.'+caveat;return}const window=completeWindow();if(!window){el.textContent='ℹ️ Ufullstendig måledøgn: Ikke nok sammenhengende registreringer fra alle skåler til å vurdere lavt vanninntak.'+caveat;return}const rate=window.ml/kg;let msg='';if(rate>=100){el.style.background='#ffe5e5';el.style.color='#842525';msg='⚠️ Høyt beregnet vanninntak'}else if(rate>=80){el.style.background='#fff1df';el.style.color='#6e430e';msg='🔎 Følg med – høyt beregnet vanninntak'}else if(rate<20){el.style.background='#fff1df';el.style.color='#6e430e';msg='⚠️ Svært lavt registrert vanninntak'}else if(rate<40){el.style.background='#fff1df';el.style.color='#6e430e';msg='🔎 Lavt registrert vanninntak'}else msg='ℹ️ Ingen veiledende grense overskredet';el.textContent=msg+': '+fmt(window.ml)+' ml ('+fmt(rate)+' ml/kg) for måledøgn som slutter '+dateNO(window.end)+'. De lave grensene er oppmerksomhetsnivåer, ikke diagnostiske grenser. Ikke begrens tilgang til vann; kontakt veterinær ved bekymring eller symptomer.'+caveat}

if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});render();updateForm();

// Periodevisning kan avsluttes uten å endre eller slette målinger.
$('closePeriodReport').onclick=()=>{reportPeriodId=null;if(savedReportDates){$('from').value=savedReportDates[0];$('to').value=savedReportDates[1];savedReportDates=null}$('periodReportBar').hidden=true;render();showTab('periods')};


// v6.9: Rett historisk sluttvekt uten å slette måleperioden.
let editId=null;
function openEdit(id){
 const r=data.records.find(x=>x.id===id);if(!r)return;
 editId=id;
 $('editInfo').textContent=`${r.bowlName||'Skål'} · ${dateNO(r.end)} · Startvekt ${fmt(Number(r.initial)+Number(r.tare))} g · Skålens egenvekt ${fmt(r.tare)} g.`;
 $('editFinal').value=r.final;
 updateEditPreview();
 $('editDialog').showModal();
}
function updateEditPreview(){
 const r=data.records.find(x=>x.id===editId);if(!r)return;
 const v=grams($('editFinal').value);
 const start=Number(r.initial)+Number(r.tare);
 $('editPreview').textContent=Number.isFinite(v)&&v>=Number(r.tare)&&v<=start
   ?`Korrigert beregnet vanninntak: ${fmt(start-v)} ml (tidligere ${fmt(r.drunk)} ml).`
   :'Kontroller at vekten inkluderer skålen og ikke er større enn startvekten.';
}
$('editFinal').addEventListener('input',updateEditPreview);
$('editCancel').onclick=()=>$('editDialog').close();
$('editConfirm').onclick=()=>{
 const r=data.records.find(x=>x.id===editId);if(!r)return;
 const v=grams($('editFinal').value),tare=Number(r.tare),start=Number(r.initial)+tare;
 if(!Number.isFinite(v)||v<tare||v>start)return alert('Vekten må være mellom skålens egenvekt og startvekten.');
 const delta=start-v;
 // Ved ren kontroll blir sluttvekten også neste startvekt.
 const next=data.records.filter(x=>x.b===r.b&&x.start===r.end).sort((a,b)=>a.end.localeCompare(b.end))[0];
 if(r.action==='check'&&next){
   if(!confirm('Denne kontrollmålingen er også startpunkt for neste måling. Begge beregningene vil bli oppdatert. Fortsette?'))return;
   if(v<Number(next.final))return alert('Rettelsen ville gi negativt vanninntak ved neste måling. Kontroller målingene.');
 }
 if(!confirm(`Endre målingen fra ${fmt(r.drunk)} ml til ${fmt(delta)} ml? Ta gjerne sikkerhetskopi før du fortsetter.`))return;
 r.final=v;r.rest=v-tare;r.drunk=delta;
 if(r.action==='check'){
   if(next){next.initial=v-tare;next.drunk=v-Number(next.final);}
   else if(data.sessions[r.b]&&data.sessions[r.b].time===r.end)data.sessions[r.b].weight=v;
 }
 persist();$('editDialog').close();render();updateForm();notice('Målingen er korrigert. Oversikten er oppdatert.');
};

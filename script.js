const $=s=>document.querySelector(s);
const CATS={out:["Miete","Lebensmittel","Mobilität","Freizeit","Gesundheit","Versicherung","Kleidung","Sonstiges"],in:["Gehalt","Nebenverdienst","Erstattung","Sonstiges"]};
const COL=["#eceef0","#8fb3ff","#e8b86b","#6fd1b1","#c59bf0","#f08f9b","#7cc4e8","#6c727a"];
let items=[],type="out",editId=null,sel=[];
try{items=JSON.parse(localStorage.getItem("hb")||"[]")}catch(e){items=[]}
let start=0;try{start=parseFloat(localStorage.getItem("hb_start"))||0}catch(e){}
function save(){try{localStorage.setItem("hb",JSON.stringify(items))}catch(e){}}
function saveStart(){try{localStorage.setItem("hb_start",String(start))}catch(e){}}
const eur=n=>n.toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const mk=d=>d.slice(0,7);
const RL={day:"täglich",month:"monatlich",year:"jährlich"};
function expand(){const out=[],td=today();
for(const it of items){
if(!it.rep||it.rep==="once"){out.push(it);continue}
const p=it.date.split("-").map(Number),y=p[0],mo=p[1]-1,d=p[2];
for(let k=0;k<5000;k++){
let dt;
if(it.rep==="day")dt=new Date(y,mo,d+k,12);
else if(it.rep==="month"){const b=new Date(y,mo+k,1,12);dt=new Date(b.getFullYear(),b.getMonth(),Math.min(d,new Date(b.getFullYear(),b.getMonth()+1,0).getDate()),12)}
else{const yy=y+k;dt=new Date(yy,mo,Math.min(d,new Date(yy,mo+1,0).getDate()),12)}
const ds=dt.getFullYear()+"-"+String(dt.getMonth()+1).padStart(2,"0")+"-"+String(dt.getDate()).padStart(2,"0");
if(ds>td)break;
out.push(Object.assign({},it,{date:ds,src:it.id}))}}
return out}
const ml=m=>{const p=m.split("-");return new Date(p[0],p[1]-1,1).toLocaleDateString("de-DE",{month:"short",year:"2-digit"})};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const today=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};

function showPage(p){["add","stat","hist"].forEach(k=>{$("#p-"+k).hidden=k!==p});document.querySelectorAll(".tabs button").forEach(b=>b.classList.toggle("on",b.dataset.p===p));$("#pill").style.setProperty("--i",["add","stat","hist"].indexOf(p));window.scrollTo(0,0)}
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>showPage(b.dataset.p));

function setType(t){type=t;document.querySelectorAll(".seg button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));$("#cat").innerHTML=CATS[t].map(c=>"<option>"+c+"</option>").join("")}
document.querySelectorAll(".seg button").forEach(b=>b.onclick=()=>setType(b.dataset.t));

function resetForm(){editId=null;$("#rep").value="once";$("#amt").value="";$("#note").value="";$("#dat").value=today();$("#ft").textContent="Neuer Eintrag";$("#save").textContent="Eintrag speichern";$("#cancel").hidden=true}
$("#cancel").onclick=resetForm;
$("#save").onclick=()=>{
const a=parseFloat(String($("#amt").value).replace(",","."));
if(!(a>0)){$("#fmsg").textContent="Bitte gib einen Betrag größer als 0 ein.";return}
if(!$("#dat").value){$("#fmsg").textContent="Bitte wähle ein Datum.";return}
const it={id:editId||Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,amt:Math.round(a*100)/100,date:$("#dat").value,cat:$("#cat").value,note:$("#note").value.trim(),rep:$("#rep").value};
const was=!!editId;
if(editId){items=items.map(x=>x.id===editId?it:x)}else{items.push(it)}
save();resetForm();$("#fmsg").textContent=was?"Eintrag geändert.":"Eintrag gespeichert.";render()};

function render(){
const all=expand();const ms=[...new Set(all.map(i=>mk(i.date)).concat(mk(today())))].sort().reverse();
sel=sel.filter(m=>ms.includes(m));
const chips='<button class="chip'+(sel.length?"":" on")+'" data-m="all">Alle</button>'+ms.map(m=>'<button class="chip'+(sel.includes(m)?" on":"")+'" data-m="'+m+'">'+ml(m)+"</button>").join("");
document.querySelectorAll(".mon").forEach(s=>{const sl=s.scrollLeft;s.innerHTML=chips;s.scrollLeft=sl});
$("#per").textContent=sel.length?"Saldo: "+sel.slice().sort().map(m=>ml(m)).join(", "):"Saldo über alle Monate";
$("#bh").textContent=sel.length===1?"Wochen im Monat":sel.length===2?"Monatshälften":sel.length?"Ausgewählte Monate":"Letzte 6 Monate";
const sum=(a,t)=>a.filter(i=>i.type===t).reduce((s,i)=>s+i.amt,0);
const t=start+sum(all,"in")-sum(all,"out");$("#tot").textContent=eur(t);$("#tot").style.color=t<0?"var(--out)":"var(--tx)";
const f=(sel.length?all.filter(i=>sel.includes(mk(i.date))):all).slice().sort((a,b)=>b.date.localeCompare(a.date));
const si=sum(f,"in"),so=sum(f,"out"),b=si-so;
$("#sin").textContent=eur(si);$("#sout").textContent=eur(so);$("#bal").textContent=eur(b);$("#bal").style.color=b<0?"var(--out)":"var(--tx)";
const by={};f.filter(i=>i.type==="out").forEach(i=>by[i.cat]=(by[i.cat]||0)+i.amt);
const ks=Object.keys(by).sort((a,b)=>by[b]-by[a]);
if(!ks.length){$("#donut").innerHTML='<p class="empty">Noch keine Ausgaben im Zeitraum.</p>'}else{
const C=2*Math.PI*40;let off=0,seg="";
ks.forEach((k,j)=>{const l=by[k]/so*C;seg+='<circle cx="60" cy="60" r="40" fill="none" stroke="'+COL[j%COL.length]+'" stroke-width="18" stroke-dasharray="'+l+" "+(C-l)+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 60 60)"/>';off+=l});
$("#donut").innerHTML='<div class="donut"><svg viewBox="0 0 120 120" width="140" height="140" role="img" aria-label="Ausgaben nach Kategorie">'+seg+'</svg><div class="leg">'+ks.map((k,j)=>'<span><span><i style="background:'+COL[j%COL.length]+'"></i>'+esc(k)+"</span><b>"+eur(by[k])+"</b></span>").join("")+"</div></div>"}
const now=new Date(),last=[];for(let k=5;k>=0;k--){const d=new Date(now.getFullYear(),now.getMonth()-k,1);last.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"))}
const bm=sel.length?sel.slice().sort():last;
const gran=sel.length===1?"w":sel.length===2?"h":"m";
const sumIn=(f,t)=>sum(all.filter(f),t);
const mon=m=>({i:sumIn(x=>mk(x.date)===m,"in"),o:sumIn(x=>mk(x.date)===m,"out")});
let rows=[];
if(gran==="m"){rows=bm.map(m=>Object.assign({lb:ml(m).split(" ")[0]},mon(m)));
if(sel.length>=3)rows.push({lb:"Gesamt",t:1,br:1,i:rows.reduce((s,d)=>s+d.i,0),o:rows.reduce((s,d)=>s+d.o,0)})}
else{bm.forEach((m,mi)=>{const p=m.split("-"),ld=new Date(+p[0],+p[1],0).getDate();
const cuts=gran==="w"?[[1,7],[8,14],[15,21],[22,ld]]:[[1,15],[16,ld]];
const parts=cuts.map((c,k)=>{const inR=x=>mk(x.date)===m&&+x.date.slice(8,10)>=c[0]&&+x.date.slice(8,10)<=c[1];
return {lb:gran==="w"?"Woche "+(k+1):ml(m).split(" ")[0]+" "+c[0]+"–"+c[1],i:sumIn(inR,"in"),o:sumIn(inR,"out")}});
const tot=Object.assign({lb:gran==="w"?"Monat":ml(m).split(" ")[0]+" gesamt",t:1},mon(m));
if(gran==="w"){tot.br=1;rows.push(...parts,tot)}else{if(mi>0)tot.br=1;rows.push(tot,...parts)}})}
const mx=Math.max(1,...rows.filter(d=>!d.t).map(d=>Math.max(d.i,d.o))),mxT=Math.max(1,...rows.filter(d=>d.t).map(d=>Math.max(d.i,d.o)));
const e0=n=>Math.round(n).toLocaleString("de-DE")+" €";
const bar=(v,sc,c)=>'<div class="bl"><i class="bb" style="width:'+(v>0?Math.max(2,v/sc*68):0)+'%;background:var('+c+')"></i><span style="color:var('+c+')">'+(v>0?e0(v):"")+"</span></div>";
$("#bars").innerHTML='<div class="hrows">'+rows.map(d=>{const sc=d.t?mxT:mx,net=d.i-d.o,nc=net>0?"var(--in)":net<0?"var(--out)":"var(--mu)";
return '<div class="hr'+(d.br?" sep":"")+(d.t?" tt":"")+'"><div class="hn" style="color:'+nc+'">'+esc(d.lb)+'</div><div class="hbs">'+((d.i>0||d.o>0)?bar(d.i,sc,"--in")+bar(d.o,sc,"--out"):'<span class="mu">–</span>')+"</div></div>"}).join("")+'</div><div class="leg" style="margin-top:12px"><span><span><i style="background:var(--in)"></i>Einnahmen</span><span><i style="background:var(--out)"></i>Ausgaben</span></span></div>';
(function(){
const pad=n=>String(n).padStart(2,"0"),keyOf=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
if(!all.length){$("#line").innerHTML='<p class="empty">Noch keine Einträge.</p>';return}
const bal=all.slice().sort((x,y)=>x.date.localeCompare(y.date));
const td=today();let a,b;
if(sel.length){const s2=sel.slice().sort(),l=s2[s2.length-1].split("-");a=s2[0]+"-01";b=l[0]+"-"+l[1]+"-"+pad(new Date(+l[0],+l[1],0).getDate())}
else{a=all.map(i=>i.date).sort()[0];b=td}
if(b<a)b=a;
let ds=new Date(a+"T12:00");const de=new Date(b+"T12:00");
if((de-ds)/864e5>1100)ds=new Date(de.getFullYear(),de.getMonth(),de.getDate()-1100,12);
const a2=keyOf(ds),D=Math.round((de-ds)/864e5)+1;
let run=start,pi=0;
while(pi<bal.length&&bal[pi].date<a2){run+=(bal[pi].type==="in"?1:-1)*bal[pi].amt;pi++}
const v0=run,pts=[];
for(let k=0;k<D;k++){const key=keyOf(new Date(ds.getFullYear(),ds.getMonth(),ds.getDate()+k,12));
while(pi<bal.length&&bal[pi].date<=key){run+=(bal[pi].type==="in"?1:-1)*bal[pi].amt;pi++}
pts.push(run)}
const vmin=Math.min(v0,...pts),vmax=Math.max(v0,...pts),ve=pts[D-1];
const lo=vmin===vmax?vmin-1:vmin,hi=vmin===vmax?vmax+1:vmax;
const step=Math.max(1,Math.ceil(D/120)),idx=[];
for(let k=0;k<D;k+=step)idx.push(k);
if(idx[idx.length-1]!==D-1)idx.push(D-1);
const X=j=>idx.length>1?8+j/(idx.length-1)*314:165,Y=v=>24+(hi-v)/(hi-lo)*106;
const P=idx.map((k,j)=>X(j).toFixed(1)+","+Y(pts[k]).toFixed(1));
let sv='<svg viewBox="0 0 330 160" width="100%" role="img" aria-label="Kontostand im Zeitverlauf"><defs><linearGradient id="lg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#eceef0" stop-opacity=".28"/><stop offset="1" stop-color="#eceef0" stop-opacity="0"/></linearGradient></defs>';
if(lo<0&&hi>0)sv+='<line x1="8" x2="322" y1="'+Y(0)+'" y2="'+Y(0)+'" stroke="#8b9098" stroke-width="1" stroke-dasharray="3 4"/><text x="8" y="'+(Y(0)-4)+'" font-size="9" fill="#8b9098">0</text>';
if(idx.length>1)sv+='<path d="M'+P[0]+" L"+P.join(" L")+" L322,130 L8,130 Z"+'" fill="url(#lg)"/><polyline points="'+P.join(" ")+'" fill="none" stroke="#eceef0" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>';
sv+='<circle cx="'+X(idx.length-1)+'" cy="'+Y(ve)+'" r="5" fill="'+(ve<0?"var(--out)":"var(--in)")+'"/>';
const fd=k=>new Date(ds.getFullYear(),ds.getMonth(),ds.getDate()+k,12).toLocaleDateString("de-DE",{day:"numeric",month:"short",year:"2-digit"});
sv+='<text x="8" y="152" font-size="10" fill="#8b9098">'+fd(0)+'</text><text x="322" y="152" font-size="10" text-anchor="end" fill="#8b9098">'+fd(D-1)+"</text></svg>";
const st=(l,v,c)=>'<div><small>'+l+'</small><b'+(c?' style="color:'+c+'"':"")+'>'+eur(v)+"</b></div>";
$("#line").innerHTML=sv+'<div class="st">'+st("Stand zu Beginn",v0)+st("Stand am Ende",ve,ve<0?"var(--out)":"var(--in)")+st("Tiefster Stand",vmin)+st("Höchster Stand",vmax)+'</div>';
})();

$("#lsum").textContent="Einträge ("+f.length+")";const row=i=>'<div class="item"><div class="m" data-e="'+(i.src||i.id)+'"><b>'+esc(i.note||i.cat)+'</b><small>'+esc(i.cat)+" · "+new Date(i.date+"T12:00").toLocaleDateString("de-DE")+(i.rep&&i.rep!=="once"?" · "+RL[i.rep]:"")+'</small></div><span class="amt '+i.type+'">'+(i.type==="in"?"+":"−")+eur(i.amt)+'</span><button class="x" data-d="'+(i.src||i.id)+'" aria-label="Löschen">×</button></div>';
const gr={};f.forEach(i=>{const k=mk(i.date);(gr[k]=gr[k]||[]).push(i)});
$("#list").innerHTML=f.length?Object.keys(gr).sort().reverse().map(m=>{const g=gr[m],s=sum(g,"in")-sum(g,"out");return '<div class="grp"><div class="mh"><span>'+ml(m)+'</span><span style="color:'+(s<0?"var(--out)":"var(--in)")+'">'+(s<0?"−":"+")+eur(Math.abs(s))+'</span></div>'+g.map(row).join("")+'</div>'}).join(""):'<p class="empty">Noch keine Einträge. Trage auf der Seite „Eintragen“ deinen ersten Betrag ein.</p>';
}
document.querySelectorAll(".mon").forEach(s=>s.onclick=e=>{const b=e.target.closest("[data-m]");if(!b)return;const m=b.dataset.m;if(m==="all")sel=[];else sel=sel.includes(m)?sel.filter(x=>x!==m):sel.concat(m);render()});
$("#list").onclick=e=>{
const d=e.target.closest("[data-d]"),m=e.target.closest("[data-e]");
if(d){items=items.filter(i=>i.id!==d.dataset.d);save();render()}
else if(m){const it=items.find(i=>i.id===m.dataset.e);if(!it)return;editId=it.id;setType(it.type);$("#cat").value=it.cat;$("#amt").value=it.amt;$("#dat").value=it.date;$("#note").value=it.note;$("#rep").value=it.rep||"once";$("#ft").textContent="Eintrag bearbeiten";$("#save").textContent="Änderung speichern";$("#cancel").hidden=false;$("#fmsg").textContent="";showPage("add")}};
const dump=()=>JSON.stringify({start,items});
$("#exp").onclick=()=>{$("#bk").value=dump();$("#bmsg").textContent=items.length+" Einträge angezeigt."};
$("#cp").onclick=async()=>{$("#bk").value=dump();try{await navigator.clipboard.writeText($("#bk").value);$("#bmsg").textContent="In die Zwischenablage kopiert."}catch(e){$("#bk").select();$("#bmsg").textContent="Text markiert. Bitte manuell kopieren."}};
$("#imp").onclick=()=>{try{const p=JSON.parse($("#bk").value);const a=Array.isArray(p)?p:p.items;if(!Array.isArray(a))throw 0;if(!Array.isArray(p)){start=+p.start||0;saveStart()}
items=a.filter(x=>x&&x.date&&x.amt>0&&(x.type==="in"||x.type==="out")).map(x=>({id:x.id||Date.now().toString(36)+Math.random().toString(36).slice(2,6),type:x.type,amt:+x.amt,date:String(x.date).slice(0,10),cat:x.cat||"Sonstiges",note:x.note||"",rep:["day","month","year"].includes(x.rep)?x.rep:"once"}));
save();render();$("#bmsg").textContent=items.length+" Einträge importiert. Bisherige Daten wurden ersetzt."}catch(e){$("#bmsg").textContent="Der Text ist keine gültige Sicherung."}};
$("#setb").onclick=()=>{$("#setf").hidden=!$("#setf").hidden;$("#sv").value=""};
$("#sok").onclick=()=>{const v=parseFloat(String($("#sv").value).replace(",","."));if(isNaN(v))return;const bi=expand(),flow=bi.filter(i=>i.type==="in").reduce((s,i)=>s+i.amt,0)-bi.filter(i=>i.type==="out").reduce((s,i)=>s+i.amt,0);start=Math.round((v-flow)*100)/100;saveStart();$("#setf").hidden=true;render()};
(function(){if(!items.some(i=>i.nb))return;const eff=expand().filter(i=>i.nb).reduce((s,i)=>s+(i.type==="in"?i.amt:-i.amt),0);start=Math.round((start-eff)*100)/100;items.forEach(i=>{delete i.nb});saveStart();save()})();
setType("out");resetForm();render();

if("serviceWorker"in navigator){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}

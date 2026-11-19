// ===== أدوات واجهة مشتركة =====
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const A=v=>esc(JSON.stringify(v)); // قيمة آمنة جوه onclick="..."

// نافذة تعديل: fields=[{l,t:"text|number|select",v,ph,opts:[[قيمة,نص]]}]
// onOk(values) -> false لو عايز النافذة تفضل مفتوحة. بتدعم async.
function modal(title,fields,onOk,hint){
  const w=document.createElement("div");
  w.className="mw";
  w.innerHTML=`<div class="md"><h3>${esc(title)}</h3>
    ${fields.map((f,i)=>f.t=="select"
      ?`<label>${esc(f.l)}<select id="mf${i}">${f.opts.map(o=>`<option value="${esc(o[0])}" ${o[0]==f.v?"selected":""}>${esc(o[1])}</option>`).join("")}</select></label>`
      :`<label>${esc(f.l)}<input id="mf${i}" type="${f.t||"text"}" ${f.t=="number"?'inputmode="decimal" min="0" step="any"':'autocapitalize="none"'} value="${esc(f.v)}" placeholder="${esc(f.ph||"")}"></label>`).join("")}
    ${hint?`<div class="hint">${esc(hint)}</div>`:""}
    <div class="acts"><button class="btn" id="mok">حفظ</button><button class="btn ghost" id="mcn">إلغاء</button></div></div>`;
  document.body.appendChild(w);
  const close=()=>{
    w.remove();
    // لو وصل تحديث لحظي وإحنا في النافذة، نحدّث الشاشة بعد القفل
    setTimeout(()=>{try{if(dirty&&!document.querySelector(".mw"))rerender()}catch(e){}},60);
  };
  const okb=w.querySelector("#mok");
  const ok=()=>{
    if(okb.disabled)return;
    const v=fields.map((_,i)=>w.querySelector("#mf"+i).value.trim());
    const r=onOk(v);
    if(r&&r.then){okb.disabled=true;r.then(x=>{if(x!==false)close();else okb.disabled=false}).catch(()=>{okb.disabled=false})}
    else if(r!==false)close();
  };
  w.querySelector("#mcn").onclick=close;
  okb.onclick=ok;
  w.onclick=e=>{if(e.target===w)close()};
  w.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.tagName!="SELECT")ok();if(e.key==="Escape")close()});
  setTimeout(()=>{const f=w.querySelector("#mf0");if(f){f.focus();f.select&&f.select()}},50);
}

// تحويل نص لرقم (يقبل الأرقام العربية والفاصلة)
function num(s){
  s=String(s).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g,".");
  const n=parseFloat(s);
  return isNaN(n)?NaN:n;
}

// رسالة صغيرة بتختفي لوحدها
function toast(msg,bad){
  try{
    const d=document.createElement("div");
    d.className="toast"+(bad?" bad":"");
    d.textContent=msg;
    document.body.appendChild(d);
    setTimeout(()=>d.remove(),3500);
  }catch(e){}
}

// صوت + اهتزاز لتنبيه الطلب الجديد
function soundOn(){try{return localStorage.getItem("gd_snd")!=="0"}catch(e){return true}}
function beep(){
  if(!soundOn())return;
  try{
    const a=new(window.AudioContext||window.webkitAudioContext)();
    const o=a.createOscillator(),g=a.createGain();
    o.connect(g);g.connect(a.destination);o.frequency.value=880;
    g.gain.setValueAtTime(.2,a.currentTime);o.start();o.stop(a.currentTime+.3);
  }catch(e){}
  try{navigator.vibrate&&navigator.vibrate(200)}catch(e){}
}

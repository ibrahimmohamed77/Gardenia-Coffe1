// ===== الشاشات والتفاعل =====
let cur=null,tab="m",cat="",q="",screen="h",from="h";

// ===== الرئيسية =====
function home(){
  cur=null;screen="h";
  $("app").innerHTML=`<header><h1>🌿 جاردينيا</h1><div class="hbtns"><button class="btn ghost sm" onclick="psHome()">🎮 PS</button><button class="btn ghost sm" onclick="rep()">السجل</button><button class="btn ghost sm" onclick="settings()">⚙</button></div></header>
  <div class="grid">${S.t.filter(t=>!t.ps).map(t=>{const c=cnt(t);return `<div class="tb ${c?"on":""}" onclick="openT(${t.id})"><b>${esc(t.n)}</b>${t.c?`<span class="cn">${esc(t.c)}</span>`:""}<small>${c?fmt(net(t))+" · "+c+" صنف":"فاضية"}</small></div>`}).join("")}
  <div class="tb add" onclick="addT()">＋<small>إضافة طاولة</small></div></div>`;
  window.scrollTo(0,0);
}
function goBack(){from=="p"?psHome():home()}
function addT(){
  modal("إضافة طاولة",[
    {l:"اسم أو رقم الطاولة",v:"",ph:"مثلا 13 أو تيك اواي"},
    {l:"اسم العميل (اختياري)",v:"",ph:"مثلا ابراهيم"}
  ],v=>{
    if(!v[0])return alert("اكتب اسم أو رقم الطاولة"),false;
    const t=newTable(S.nid++,v[0]);t.c=v[1];
    S.t.push(t);save();home();
  });
}

// ===== البلايستيشن =====
const psStat=t=>busy(t)?(t.st?"⏱ ":"")+fmtH(hoursOf(t))+" · "+fmt(net(t)):"فاضي";
function psHome(){
  cur=null;screen="p";
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>🎮 بلايستيشن</h1><span></span></header>
  <div class="grid ps2">${S.t.filter(t=>t.ps).map(t=>`<div class="tb ${busy(t)?"on":""}" onclick="openT(${t.id})"><b>${esc(t.n)}</b>${t.c?`<span class="cn">${esc(t.c)}</span>`:""}<small id="pst${t.id}">${psStat(t)}</small><small>${fmt(t.r)} / ساعة</small></div>`).join("")}</div>
  <div class="box"><div class="hint">اضغط على الجهاز، وشغّل المؤقت أو اكتب عدد الساعات بإيدك. تقدر تضيف عليه مشروبات من المنيو وتقفل الفاتورة زي أي طاولة.</div></div>`;
  window.scrollTo(0,0);
}
function openT(id){const t=T(id);cur=id;tab=t.ps?"o":"m";cat="";q="";from=t.ps?"p":"h";tv()}

// أجهزة PS: مؤقت وساعات وسعر
function psPanel(t){
  return `<div class="box psb">
    <div class="sum"><span>🎮 سعر الساعة</span><span><b>${fmt(t.r)}</b> <button class="btn ghost sm" onclick="editRate()">✎ تعديل</button></span></div>
    <div class="sum"><span>الوقت</span><b id="ptm">${fmtH(hoursOf(t))}${t.st?" ⏱":""}</b></div>
    <div class="sum"><span>تكلفة الوقت</span><b id="pct">${fmt(playCost(t))}</b></div>
    <div class="acts">${t.st?`<button class="btn red" onclick="stopT()">⏹ إيقاف المؤقت</button>`:`<button class="btn" onclick="startT()">▶ ابدأ المؤقت</button>`}<button class="btn ghost" onclick="editHrs()">✎ كتابة الساعات</button></div>
  </div>`;
}
function startT(){const t=T(cur);t.st=Date.now();save();draw()}
function stopT(){const t=T(cur);t.hrs=hoursOf(t);t.st=null;save();draw()}
function parseH(s){
  s=String(s).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const m=s.match(/^\s*(\d+):(\d{1,2})\s*$/);
  return m?(+m[1])+(+m[2])/60:num(s);
}
function editHrs(){
  const t=T(cur);
  modal("عدد الساعات",[
    {l:"الساعات (مثلا 1.5 أو 1:30)",v:+hoursOf(t).toFixed(2)}
  ],v=>{
    const h=parseH(v[0]);
    if(isNaN(h)||h<0)return alert("اكتب عدد ساعات صحيح"),false;
    t.hrs=h;t.st=null;save();draw();
  },"ده هيحل محل الوقت الحالي، ولو المؤقت شغال هيتوقف (تقدر تشغله تاني).");
}
function editRate(){
  const t=T(cur);
  modal("سعر الساعة — "+t.n,[
    {l:"سعر الساعة (جنيه)",t:"number",v:t.r}
  ],v=>{
    const r=num(v[0]);
    if(isNaN(r)||r<0)return alert("اكتب سعر صحيح"),false;
    t.r=r;save();draw();
  });
}

// ===== شاشة الطاولة / الجهاز =====
function tv(){
  const t=T(cur);screen="t";
  $("app").innerHTML=`<header><button class="btn ghost" onclick="goBack()">رجوع ›</button><h1 id="ttl"></h1><button class="btn ghost" onclick="editT()">✎ تعديل</button></header>
  <div class="tabs"><button id="tm" onclick="setTab('m')">المنيو</button><button id="to" onclick="setTab('o')"></button></div>
  <div id="body"></div>
  <div class="bar"><span>الإجمالي <b id="bt"></b></span><button class="btn" onclick="setTab('o')">عرض الحساب</button></div>`;
  setTab(tab);
}
function ttl(){const t=T(cur);$("ttl").textContent=(t.ps?"":"طاولة ")+label(t)}
function editT(){
  const t=T(cur);
  modal(t.ps?"تعديل الجهاز":"تعديل الطاولة",[
    {l:"الاسم أو الرقم",v:t.n},
    {l:"اسم العميل",v:t.c,ph:"مثلا ابراهيم"}
  ],v=>{
    if(!v[0])return alert("الاسم مطلوب"),false;
    t.n=v[0];t.c=v[1];save();ttl();
  });
}
function setTab(x){tab=x;draw();window.scrollTo(0,0)}

function draw(){
  const t=T(cur),pp=t.ps?psPanel(t):"";
  ttl();
  $("tm").className=tab=="m"?"a":"";$("to").className=tab=="o"?"a":"";
  $("to").textContent="الطلب ("+cnt(t)+")";
  $("bt").textContent=fmt(net(t));
  if(tab=="m"){
    $("body").innerHTML=pp+`<div class="sr"><input id="qi" placeholder="ابحث عن صنف..." value="${esc(q)}" oninput="q=this.value;lst()"><button class="btn ghost" onclick="customItem()">＋ صنف</button></div>
    <div class="chips"><button class="${cat?"":"a"}" onclick="cat='';draw()">الكل</button>${M.map(m=>`<button class="${cat==m[0]?"a":""}" onclick="cat='${m[0]}';draw()">${m[0]}</button>`).join("")}</div>
    <div class="items" id="lst"></div>`;
    lst();
  }else{
    const o=Object.entries(t.o);
    $("body").innerHTML=pp+(o.length?o.map(([k,x])=>`<div class="row"><div class="nm">${esc(x.n)}<small>${fmt(x.p)} × ${x.q}</small><button class="ed" onclick="editLine('${k}')">✎ تعديل السعر</button></div><div class="qty"><button onclick="chg('${k}',-1)">−</button><b>${x.q}</b><button onclick="chg('${k}',1)">+</button></div><div class="ln">${+(x.p*x.q).toFixed(2)}</div></div>`).join(""):`<div class="empty">${t.ps?"مفيش مشروبات على الجهاز ده.<br>تقدر تضيف من المنيو.":"مفيش طلبات على الطاولة دي لسه.<br>روح للمنيو وأضف أصناف."}</div>`)+
    `<div class="box">
      <div class="sum"><span>المجموع</span><b id="sb">${fmt(sub(t))}</b></div>
      <div class="sum"><span>خصم (جنيه)</span><input type="number" inputmode="decimal" min="0" step="any" value="${t.d||""}" placeholder="0" onchange="setDisc(this.value)"></div>
      <div class="sum big"><span>الصافي${hasFT(t)?`<br><span class="tag">معدّل يدويا</span>`:""}</span><span id="nv">${fmt(net(t))}</span></div>
      <div class="acts"><button class="btn ghost" onclick="editTotal()">✎ تعديل الإجمالي</button>${hasFT(t)?`<button class="btn red" onclick="resetTotal()">رجوع للحساب التلقائي</button>`:""}</div>
      <textarea class="note" placeholder="ملاحظات على الطلب (اختياري)" onchange="T(cur).nt=this.value.trim();save()">${esc(t.nt)}</textarea>
      <div class="acts"><button class="btn" onclick="closeB()">قفل الفاتورة وحفظها</button><button class="btn ghost" onclick="copyB()">نسخ الفاتورة</button></div>
      <div class="acts"><button class="btn red" onclick="clr()">${t.ps?"مسح الطلبات والوقت":"مسح الطلبات"}</button>${!busy(t)&&!t.ps?`<button class="btn red" onclick="delT()">حذف الطاولة</button>`:""}</div>
    </div>`;
  }
}
function lst(){
  const ql=q.trim(),t=T(cur);
  const L=ITEMS.filter(i=>(!cat||i.c==cat)&&(!ql||i.n.includes(ql)||i.c.includes(ql)));
  $("lst").innerHTML=L.length?L.map(i=>{const x=t.o[i.k];return `<button class="it" onclick="add('${i.k}')"><span>${esc(i.n)}</span><em>${i.p} ج</em>${x?`<i>${x.q}</i>`:""}</button>`}).join(""):`<div class="empty" style="grid-column:1/-1">مفيش نتائج</div>`;
}

// ===== الطلبات =====
function add(k){
  const t=T(cur),i=ITEMS.find(z=>z.k==k);
  if(t.o[k])t.o[k].q++;else t.o[k]={n:i.n,c:i.c,p:i.p,q:1};
  save();$("bt").textContent=fmt(net(t));$("to").textContent="الطلب ("+cnt(t)+")";lst();
}
function chg(k,d){
  const t=T(cur);t.o[k].q+=d;
  if(t.o[k].q<=0)delete t.o[k];
  save();draw();
}
// صنف مش في المنيو (اسم + سعر + كمية)
function customItem(){
  modal("إضافة صنف مخصص",[
    {l:"اسم الصنف",v:""},
    {l:"السعر (جنيه)",t:"number",v:""},
    {l:"الكمية",t:"number",v:"1"}
  ],v=>{
    const p=num(v[1]),qn=Math.max(1,Math.round(num(v[2])||1));
    if(!v[0]||isNaN(p)||p<0)return alert("اكتب اسم الصنف وسعره"),false;
    const t=T(cur),k="x"+Date.now();
    t.o[k]={n:v[0],c:"مخصص",p,q:qn};
    save();draw();
  });
}
// تعديل اسم/سعر سطر في الطلب (للطلب ده بس، المنيو مبيتغيرش)
function editLine(k){
  const t=T(cur),x=t.o[k];
  modal("تعديل الصنف",[
    {l:"الاسم",v:x.n},
    {l:"سعر الوحدة (جنيه)",t:"number",v:x.p}
  ],v=>{
    const p=num(v[1]);
    if(!v[0]||isNaN(p)||p<0)return alert("اكتب اسم وسعر صحيح"),false;
    x.n=v[0];x.p=p;save();draw();
  },"التعديل بيأثر على الطلب ده بس، أسعار المنيو زي ما هي.");
}

// ===== الخصم والإجمالي =====
function setDisc(v){const n=num(v);T(cur).d=isNaN(n)?0:Math.max(0,n);save();draw()}
function editTotal(){
  const t=T(cur);
  modal("تعديل الإجمالي (الصافي)",[
    {l:"الإجمالي النهائي (جنيه)",t:"number",v:+net(t).toFixed(2)}
  ],v=>{
    if(v[0]==="")return resetTotal(),undefined;
    const n=num(v[0]);
    if(isNaN(n)||n<0)return alert("اكتب رقم صحيح"),false;
    t.ft=n;save();draw();
  },"المجموع الأصلي: "+fmt(sub(t))+" — لو سبت الخانة فاضية هيرجع للحساب التلقائي.");
}
function resetTotal(){T(cur).ft=null;save();draw()}

// ===== الفاتورة =====
function billText(t){
  let s="جاردينيا كافيه - "+(t.ps?"":"طاولة ")+label(t)+"\n";
  if(t.ps&&hoursOf(t)>0)s+="بلايستيشن "+fmtH(hoursOf(t))+" × "+t.r+" ج/س = "+playCost(t)+"\n";
  Object.values(t.o).forEach(x=>s+=x.n+" × "+x.q+" = "+(+(x.p*x.q).toFixed(2))+"\n");
  s+="المجموع: "+sub(t)+" ج\n";
  if(+t.d)s+="الخصم: "+t.d+" ج\n";
  if(t.nt)s+="ملاحظات: "+t.nt+"\n";
  return s+"الصافي: "+net(t)+" ج";
}
function copyB(){
  const t=T(cur);if(!busy(t))return alert("مفيش طلبات");
  const s=billText(t);
  (navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>alert("تم نسخ الفاتورة")).catch(()=>prompt("انسخ الفاتورة:",s));
}
function resetT(t){t.o={};t.d=0;t.ft=null;t.nt="";if(t.ps){t.hrs=0;t.st=null}}
function closeB(){
  const t=T(cur);if(!busy(t))return alert("مفيش طلبات");
  if(!confirm("قفل فاتورة "+(t.ps?"":"طاولة ")+label(t)+" بإجمالي "+fmt(net(t))+"؟"))return;
  const o=Object.values(t.o).map(x=>x.n+" ×"+x.q);
  if(t.ps&&hoursOf(t)>0)o.unshift("بلايستيشن "+fmtH(hoursOf(t))+" ("+t.r+" ج/س)");
  S.h.push({k:t.ps?"ps":"t",n:t.n,c:t.c,t:Date.now(),d:+t.d||0,sub:sub(t),tot:net(t),adj:hasFT(t),nt:t.nt,ps:playCost(t),hrs:+hoursOf(t).toFixed(4),o});
  resetT(t);save();goBack();
}
function clr(){
  const t=T(cur);if(!busy(t))return;
  if(confirm(t.ps?"مسح الطلبات والوقت؟":"مسح كل طلبات الطاولة؟")){resetT(t);save();draw()}
}
function delT(){
  if(confirm("حذف الطاولة؟")){S.t=S.t.filter(t=>t.id!=cur);save();home()}
}

// ===== السجل (حسب اليوم) =====
function rep(dk){
  screen="r";dk=dk||dkey(Date.now());
  const all=S.h.map((h,i)=>({h,i}));
  const H=all.filter(x=>dkey(x.h.t)==dk).sort((a,b)=>b.h.t-a.h.t);
  const sum=H.reduce((a,x)=>a+x.h.tot,0),psum=H.reduce((a,x)=>a+(x.h.ps||0),0);
  const days={};
  all.forEach(x=>{const k=dkey(x.h.t),d=days[k]||(days[k]={n:0,s:0});d.n++;d.s+=x.h.tot});
  const keys=Object.keys(days).sort().reverse();
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>السجل</h1><span></span></header>
  <div class="box">
    <div class="sum"><button class="btn ghost sm" onclick="rep('${shiftDay(dk,-1)}')">السابق</button><b>${dname(dk)}</b><button class="btn ghost sm" onclick="rep('${shiftDay(dk,1)}')">التالي</button></div>
    <input type="date" class="note" value="${dk}" onchange="if(this.value)rep(this.value)">
    <div class="sum big"><span>إجمالي المبيعات</span><span>${fmt(sum)}</span></div>
    <div class="sum"><span>عدد الفواتير</span><b>${H.length}</b></div>
    ${psum>0?`<div class="sum"><span>منها وقت بلايستيشن</span><b>${fmt(psum)}</b></div>`:""}
  </div>
  ${H.length?H.map(({h,i})=>`<div class="bill"><div class="sum"><span>${h.k=="ps"?"":"طاولة "}${esc(h.n)}${h.c?" - "+esc(h.c):""} · ${new Date(h.t).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"})}</span><b>${fmt(h.tot)}</b></div><small>${esc(h.o.join("، "))}${h.d?" — خصم "+h.d+" ج":""}${h.adj?" — إجمالي معدّل يدويا":""}${h.nt?" — ملاحظات: "+esc(h.nt):""}</small><button class="ed" onclick="delBill(${i},'${dk}')">حذف الفاتورة</button></div>`).join(""):`<div class="empty">مفيش فواتير في اليوم ده.</div>`}
  ${keys.length?`<div class="box"><b class="hint">كل الأيام المسجلة</b>${keys.map(k=>`<button class="btn ${k==dk?"":"ghost"} dayrow" onclick="rep('${k}')"><span>${dname(k)}</span><span>${days[k].n} فاتورة · ${fmt(days[k].s)}</span></button>`).join("")}</div>`:""}`;
  window.scrollTo(0,0);
}
function delBill(i,dk){
  if(confirm("حذف الفاتورة دي من السجل نهائيا؟")){S.h.splice(i,1);save();rep(dk)}
}

// ===== الإعدادات: نسخة احتياطية =====
function settings(){
  screen="s";
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>الإعدادات</h1><span></span></header>
  <div class="box">
    <div class="hint">البيانات والسجل محفوظين في متصفح الجهاز ده (بالتاريخ واليوم). لو مسحت بيانات المتصفح أو فتحت من جهاز تاني مش هتلاقيهم، فخد نسخة احتياطية من وقت للتاني.</div>
    <button class="btn" onclick="exportData()">تصدير نسخة احتياطية (JSON)</button>
    <button class="btn ghost" onclick="$('importFile').click()">استيراد نسخة احتياطية</button>
    <button class="btn red" onclick="clearHist()">مسح سجل الفواتير</button>
    <button class="btn red" onclick="resetAll()">مسح كل البيانات والبدء من جديد</button>
  </div>`;
  window.scrollTo(0,0);
}
function exportData(){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:"application/json"}));
  a.download="gardenia-backup-"+dkey(Date.now())+".json";
  document.body.appendChild(a);a.click();a.remove();
}
$("importFile").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(!d||!Array.isArray(d.t))throw 0;
      if(!confirm("هيتم استبدال كل البيانات الحالية بالنسخة دي. متأكد؟"))return;
      localStorage.setItem(KEY,JSON.stringify(d));location.reload();
    }catch(err){alert("الملف ده مش نسخة احتياطية صحيحة")}
  };
  r.readAsText(f);e.target.value="";
});
function clearHist(){
  if(confirm("هتمسح سجل كل الأيام نهائيا. متأكد؟")&&confirm("تأكيد أخير: مسح السجل؟")){S.h=[];save();alert("تم مسح السجل")}
}
function resetAll(){
  if(confirm("هتمسح كل الطاولات والفواتير نهائيا. متأكد؟")&&confirm("تأكيد أخير: مسح كل شيء؟")){
    try{localStorage.removeItem(KEY)}catch(e){}
    location.reload();
  }
}

// تحديث المؤقت كل ثانية من غير ما نعيد رسم الشاشة
setInterval(()=>{
  if(screen=="p"){
    S.t.filter(t=>t.ps).forEach(t=>{const e=$("pst"+t.id);if(e)e.textContent=psStat(t)});
  }else if(screen=="t"&&cur!=null){
    const t=T(cur);
    if(t&&t.ps&&t.st&&$("ptm")){
      $("ptm").textContent=fmtH(hoursOf(t))+" ⏱";$("pct").textContent=fmt(playCost(t));$("bt").textContent=fmt(net(t));
      const s=$("sb");if(s)s.textContent=fmt(sub(t));
      const n=$("nv");if(n)n.textContent=fmt(net(t));
    }
  }
},1000);

home();

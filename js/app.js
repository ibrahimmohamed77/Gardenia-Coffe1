// ===== الشاشات والتفاعل =====
<<<<<<< HEAD
let cur=null,tab="m",cat="",q="",screen="l",from="h",sending=false,dirty=false;
let unsubs=[],seen=null,repDay=null,repUnsub=null,BILLS=[],WK=[],WKX=[],EXPS=[],tickN=0,stockMode=false,LOGS=[],logDay=null,logUnsub=null,LA={};
const SEL={}; // أصناف متحددة للدفع: مفتاح = رقم الطلب:رقم الصنف

const EM={
  "auth/invalid-credential":"اسم المستخدم أو كلمة السر غلط",
  "auth/wrong-password":"اسم المستخدم أو كلمة السر غلط",
  "auth/user-not-found":"اسم المستخدم أو كلمة السر غلط",
  "auth/invalid-email":"اسم المستخدم غير صالح",
  "auth/too-many-requests":"محاولات كتير، استنى شوية وجرّب تاني",
  "auth/network-request-failed":"مفيش اتصال بالإنترنت",
  "auth/email-already-in-use":"اسم المستخدم ده مستخدم قبل كده",
  "auth/weak-password":"كلمة السر ضعيفة (6 حروف أو أرقام على الأقل)",
  "auth/operation-not-allowed":"فعّل Email/Password من Firebase ← Authentication",
  "auth/requires-recent-login":"اخرج وسجّل دخول تاني وبعدين جرّب",
  "permission-denied":"مفيش صلاحية للعملية دي",
  "app/inactive":"الحساب ده موقوف",
  "app/no-profile":"الحساب ده ملوش صلاحيات، اطلب من المدير",
  "app/already-setup":"الإعداد الأول اتعمل قبل كده"
};
const errMsg=e=>EM[e&&e.code]||(e&&e.message)||String(e);

// ===== التشغيل =====
function bootError(e){
  $("app").innerHTML=`<div class="login"><h1>🌿 جاردينيا</h1><div class="err">تعذر تشغيل قاعدة البيانات.<br>اتأكد من النت ومن ملف js/firebase-config.js<br><small>${esc(errMsg(e))}</small></div><button class="btn" onclick="location.reload()">إعادة المحاولة</button></div>`;
}
function boot(){
  DB.onError=e=>toast("تعذر الحفظ: "+errMsg(e),true);
  DB.onAuth(async(u,err)=>{
    stopAll();
    if(!u){
      ME=null;let ns=false;
      try{ns=await DB.needsSetup()}catch(e){}
      ns?setupScreen():loginScreen(err?errMsg(err):"");
      return;
    }
    ME=u;startAll();
  });
}
function stopAll(){
  unsubs.forEach(f=>{try{f()}catch(e){}});unsubs=[];stopRep();
  TB=[];TK=[];USERS=[];LD.t=LD.k=false;seen=null;cur=null;stopLog();CFG={out:[],delayMin:10};
}
function startAll(){
  unsubs.push(DB.subTables(l=>{TB=l.sort((a,b)=>(a.ord||0)-(b.ord||0));LD.t=true;onData()}));
  unsubs.push(DB.subTickets(l=>{notifyNew(l);TK=l;LD.k=true;onData()}));
  unsubs.push(DB.subConfig(c=>{CFG=Object.assign({out:[],delayMin:10},c||{});if(!Array.isArray(CFG.out))CFG.out=[];onData()}));
  if(isAdmin())unsubs.push(DB.subUsers(l=>{USERS=l;if(screen=="s")onData()}));
  ME.role=="kitchen"?queue():home();
}
// تنبيه بالطلبات الجديدة اللي جاية من حد تاني
function notifyNew(l){
  if(seen===null){seen=new Set(l.map(x=>x.id));return}
  l.forEach(x=>{
    if(seen.has(x.id))return;
    seen.add(x.id);
    if(x.status!=="served"&&x.byUid!==(ME&&ME.uid)){
      beep();toast("🔔 طلب جديد — "+(x.ps?"":"طاولة ")+x.tn+(x.by?" ("+x.by+")":""));
    }
  });
}
const loaded=()=>LD.t&&LD.k;
const loadingHtml=()=>`<div class="empty">جاري التحميل…</div>`;

// ===== تحديث الشاشة لحظيا من غير ما نقاطع الكتابة =====
function onData(){if(loaded())live()}
const typing=()=>{const a=document.activeElement;return !!(a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&a.closest&&a.closest("#app"))};
function live(){
  if(document.querySelector(".mw")||typing()){dirty=true;return}
  rerender();
}
function rerender(){
  dirty=false;
  if(screen=="h")home();
  else if(screen=="p")psHome();
  else if(screen=="q")queue();
  else if(screen=="s")settings();
  else if(screen=="r")drawRep();
  else if(screen=="x")drawExp();
  else if(screen=="a")drawAudit();
  else if(screen=="t"){
    const t=T(cur);if(!t)return goBack();
    if(tab=="o")draw();
    else{const pp=$("pspanel");if(pp&&t.ps)pp.outerHTML=psPanel(t);barUpd();if($("lst"))lst()}
  }
}
try{document.addEventListener("focusout",()=>{
  if(dirty)setTimeout(()=>{if(dirty&&!document.querySelector(".mw")&&!typing())rerender()},150);
})}catch(e){}
function nav(s){screen=s;if(s!="r"&&s!="x")stopRep();if(s!="a")stopLog()}
function stopLog(){if(logUnsub){try{logUnsub()}catch(e){}}logUnsub=null}
function stopRep(){if(repUnsub){try{repUnsub()}catch(e){}}repUnsub=null}

// ===== الدخول =====
function loginScreen(msg){
  screen="l";
  let u="";try{u=localStorage.getItem("gd_user")||""}catch(e){}
  $("app").innerHTML=`<div class="login"><h1>🌿 جاردينيا</h1>
    ${DB.mode=="local"?`<div class="warn">وضع تجريبي محلي: البيانات على الجهاز ده بس. اضبط js/firebase-config.js عشان الطلبات تتشارك بين الأجهزة.</div>`:""}
    <input id="lu" placeholder="اسم المستخدم" autocapitalize="none" autocomplete="username" value="${esc(u)}">
    <input id="lp" type="password" placeholder="كلمة السر" autocomplete="current-password">
    <div class="err" id="le">${esc(msg||"")}</div>
    <button class="btn" id="lb" onclick="doLogin()">دخول</button></div>`;
  $("lp").onkeydown=e=>{if(e.key==="Enter")doLogin()};
}
async function doLogin(){
  const u=$("lu").value.trim(),p=$("lp").value;
  if(!u||!p)return $("le").textContent="اكتب اسم المستخدم وكلمة السر";
  $("lb").disabled=true;$("le").textContent="";
  try{
    try{localStorage.setItem("gd_user",u)}catch(e){}
    await DB.login(u,p);
  }catch(e){
    const b=$("lb");if(b){b.disabled=false;$("le").textContent=errMsg(e)}
  }
}
function setupScreen(){
  screen="l";
  $("app").innerHTML=`<div class="login"><h1>🌿 إعداد أول مرة</h1>
    <div class="hint">أنشئ حساب المدير. اعمل ده فورا قبل ما حد تاني يفتح الموقع.</div>
    ${DB.mode=="local"?`<div class="warn">وضع تجريبي محلي.</div>`:""}
    <input id="sn" placeholder="الاسم (مثلا إبراهيم)">
    <input id="su" placeholder="اسم المستخدم بالإنجليزي (مثلا admin)" autocapitalize="none">
    <input id="sp" type="password" placeholder="كلمة السر (6 على الأقل)">
    <div class="err" id="le"></div>
    <button class="btn" id="lb" onclick="doSetup()">إنشاء حساب المدير</button></div>`;
}
async function doSetup(){
  const n=$("sn").value.trim(),u=$("su").value.trim(),p=$("sp").value;
  if(!n||!/^[a-zA-Z0-9._-]{3,20}$/.test(u))return $("le").textContent="الاسم مطلوب، واسم المستخدم 3-20 حرف إنجليزي/أرقام";
  if(p.length<6)return $("le").textContent="كلمة السر 6 حروف على الأقل";
  $("lb").disabled=true;$("le").textContent="";
  try{await DB.setup(n,u,p)}
  catch(e){const b=$("lb");if(b){b.disabled=false;$("le").textContent=errMsg(e)}}
}

// ===== الرئيسية =====
function home(){
  nav("h");cur=null;
  if(!loaded())return $("app").innerHTML=loadingHtml();
  const pn=pendAll();
  $("app").innerHTML=`<header><h1>🌿 جاردينيا</h1><div class="hbtns"><button class="btn ghost sm" onclick="queue()">🔔${pn?` <span class="bdg ${lateN()?"lt":""}">${pn}</span>`:""}</button><button class="btn ghost sm" onclick="psHome()">🎮</button>${canClose()?`<button class="btn ghost sm" onclick="rep()">📊</button><button class="btn ghost sm" onclick="expenses()">💸</button>`:""}<button class="btn ghost sm" onclick="settings()">⚙</button></div></header>
  <div class="who">👤 ${esc(ME.name)} · ${ROLES[ME.role]||""}</div>
  <div class="grid">${TB.filter(t=>!t.ps).map(t=>{const c=cnt(t),p=pendOf(t);return `<div class="tb ${c?"on":""} ${p?"wait":""} ${lateT(t)?"late":""}" onclick="openT(${A(t.id)})"><b>${esc(t.n)}</b>${t.c?`<span class="cn">${esc(t.c)}</span>`:""}<small>${c?fmt(net(t))+" · "+c+" صنف":"فاضية"}</small>${t.paid?`<span class="pd">✔ مدفوع ${fmt(t.paid)}</span>`:""}${p?`<span class="pw">⏳ ${p} في الانتظار${lateT(t)?" ⚠ متأخر":""}</span>`:""}</div>`}).join("")}
  ${canClose()?`<div class="tb add" onclick="addT()">＋<small>إضافة طاولة</small></div>`:""}</div>
  ${!TB.length&&canClose()?`<div class="box"><button class="btn" onclick="seedTables()">إنشاء الطاولات الافتراضية (12 طاولة + 4 PS)</button></div>`:""}`;
  window.scrollTo(0,0);
}
function seedTables(){
  for(let i=1;i<=12;i++)DB.saveTable(null,mkTable(""+i,i));
  for(let i=1;i<=4;i++)DB.saveTable(null,mkPS(i,100+i));
}
const nextOrd=ps=>Math.max(ps?100:0,...TB.filter(t=>!!t.ps===ps).map(t=>t.ord||0))+1;
function goBack(){from=="p"?psHome():home()}
function addT(){
  modal("إضافة طاولة",[{l:"اسم أو رقم الطاولة",v:"",ph:"مثلا 13 أو تيك اواي"}],v=>{
    if(!v[0])return alert("اكتب اسم أو رقم الطاولة"),false;
    DB.saveTable(null,mkTable(v[0],nextOrd(false)));
  });
}
function addPS(){
  const n=TB.filter(t=>t.ps).length+1;
  modal("إضافة جهاز بلايستيشن",[{l:"الاسم",v:"PS "+n},{l:"سعر الساعة (جنيه)",t:"number",v:"20"}],v=>{
    const r=num(v[1]);if(!v[0]||isNaN(r)||r<0)return alert("اكتب اسم وسعر صحيح"),false;
    const o=mkPS(n,nextOrd(true));o.n=v[0];o.r=r;DB.saveTable(null,o);
  });
}

// ===== الطلبات الجارية (في الانتظار) =====
function queue(){
  nav("q");cur=null;
  if(!loaded())return $("app").innerHTML=loadingHtml();
  const P=TK.filter(x=>x.status!=="served").sort((a,b)=>a.at-b.at);
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>🔔 الطلبات الجارية</h1><span></span></header>
  ${P.length?P.map(x=>{
    const t=T(x.tid),mins=Math.max(0,Math.floor((Date.now()-x.at)/60000));
    return `<div class="tk pending ${isLate(x)?"late":""}"><div class="tkh"><b>${x.ps?"":"طاولة "}${esc(t?label(t):x.tn)}</b><span>${hhmm(x.at)} · من ${mins} د${isLate(x)?" ⚠ متأخر":""}</span></div>
      <small class="hint">${esc(x.by||"")}${x.nt?" · 📝 "+esc(x.nt):""}</small>
      ${x.items.map(i=>`<div class="qline"><span>${esc(i.n)}</span><b>× ${i.q}</b></div>`).join("")}
      <div class="acts"><button class="btn" onclick="serve(${A(x.id)})">✔ تم التنزيل</button><button class="btn ghost" onclick="openT(${A(x.tid)})">فتح الطاولة</button></div></div>`}).join(""):`<div class="empty">مفيش طلبات منتظرة ✓</div>`}`;
  window.scrollTo(0,0);
}
function serve(id){
  DB.patchTicket(id,{status:"served",servedAt:Date.now(),servedBy:ME.name});
  toast("✔ تم التنزيل");
}
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260

// ===== البلايستيشن =====
const psStat=t=>busy(t)?(t.st?"⏱ ":"")+fmtH(hoursOf(t))+" · "+fmt(net(t)):"فاضي";
function psHome(){
<<<<<<< HEAD
  nav("p");cur=null;
  if(!loaded())return $("app").innerHTML=loadingHtml();
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>🎮 بلايستيشن</h1>${isAdmin()?`<button class="btn ghost sm" onclick="addPS()">＋ جهاز</button>`:"<span></span>"}</header>
  <div class="grid ps2">${TB.filter(t=>t.ps).map(t=>`<div class="tb ${busy(t)?"on":""} ${pendOf(t)?"wait":""}" onclick="openT(${A(t.id)})"><b>${esc(t.n)}</b>${t.c?`<span class="cn">${esc(t.c)}</span>`:""}<small id="pst${t.id}">${psStat(t)}</small><small>${fmt(t.r)} / ساعة</small>${pendOf(t)?`<span class="pw">⏳ ${pendOf(t)} في الانتظار</span>`:""}</div>`).join("")}</div>
  <div class="box"><div class="hint">شغّل المؤقت أو اكتب عدد الساعات بإيدك، وضيف مشروبات من المنيو. المؤقت بيظهر لكل الأجهزة.</div></div>`;
  window.scrollTo(0,0);
}
function openT(id){
  const t=T(id);if(!t)return;
  cur=id;tab=t.ps?"o":"m";cat="";q="";stockMode=false;from=t.ps?"p":"h";Object.keys(SEL).forEach(k=>delete SEL[k]);tv();
}
function psPanel(t){
  return `<div class="box psb" id="pspanel">
    <div class="sum"><span>🎮 سعر الساعة</span><span><b>${fmt(t.r)}</b> ${canClose()?`<button class="btn ghost sm" onclick="editRate()">✎ تعديل</button>`:""}</span></div>
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
    <div class="sum"><span>الوقت</span><b id="ptm">${fmtH(hoursOf(t))}${t.st?" ⏱":""}</b></div>
    <div class="sum"><span>تكلفة الوقت</span><b id="pct">${fmt(playCost(t))}</b></div>
    <div class="acts">${t.st?`<button class="btn red" onclick="stopT()">⏹ إيقاف المؤقت</button>`:`<button class="btn" onclick="startT()">▶ ابدأ المؤقت</button>`}<button class="btn ghost" onclick="editHrs()">✎ كتابة الساعات</button></div>
  </div>`;
}
<<<<<<< HEAD
function startT(){DB.patchTable(cur,{st:Date.now()})}
function stopT(){const t=T(cur);DB.patchTable(cur,{hrs:hoursOf(t),st:null})}
=======
function startT(){const t=T(cur);t.st=Date.now();save();draw()}
function stopT(){const t=T(cur);t.hrs=hoursOf(t);t.st=null;save();draw()}
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
function parseH(s){
  s=String(s).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d));
  const m=s.match(/^\s*(\d+):(\d{1,2})\s*$/);
  return m?(+m[1])+(+m[2])/60:num(s);
}
function editHrs(){
  const t=T(cur);
<<<<<<< HEAD
  modal("عدد الساعات",[{l:"الساعات (مثلا 1.5 أو 1:30)",v:+hoursOf(t).toFixed(2)}],v=>{
    const h=parseH(v[0]);
    if(isNaN(h)||h<0)return alert("اكتب عدد ساعات صحيح"),false;
    log("تعديل ساعات بلايستيشن",t.n,fmtH(hoursOf(t))+" ← "+fmtH(h));
    DB.patchTable(cur,{hrs:h,st:null});
  },"ده هيحل محل الوقت الحالي، ولو المؤقت شغال هيتوقف.");
}
function editRate(){
  const t=T(cur);
  modal("سعر الساعة — "+t.n,[{l:"سعر الساعة (جنيه)",t:"number",v:t.r}],v=>{
    const r=num(v[0]);if(isNaN(r)||r<0)return alert("اكتب سعر صحيح"),false;
    log("تعديل سعر ساعة البلايستيشن",t.n,fmt(t.r)+" ← "+fmt(r));
    DB.patchTable(cur,{r});
  });
}
// ===== شاشة الطاولة / الجهاز =====
function tv(){
  nav("t");
  $("app").innerHTML=`<header><button class="btn ghost" onclick="goBack()">رجوع ›</button><h1 id="ttl"></h1><button class="btn ghost" onclick="editT()">✎ تعديل</button></header>
  <div class="tabs"><button id="tm" onclick="setTab('m')">المنيو</button><button id="to" onclick="setTab('o')"></button></div>
  <div id="body"></div><div class="bar" id="bar"></div>`;
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
  setTab(tab);
}
function ttl(){const t=T(cur);$("ttl").textContent=(t.ps?"":"طاولة ")+label(t)}
function editT(){
  const t=T(cur);
<<<<<<< HEAD
  const f=[{l:"اسم العميل",v:t.c,ph:"مثلا ابراهيم"}];
  if(canClose())f.unshift({l:"الاسم أو الرقم",v:t.n});
  modal(t.ps?"تعديل الجهاز":"تعديل الطاولة",f,v=>{
    if(canClose()){
      if(!v[0])return alert("الاسم مطلوب"),false;
      DB.patchTable(cur,{n:v[0],c:v[1]});
    }else DB.patchTable(cur,{c:v[0]});
  });
}
function setTab(x){tab=x;draw();window.scrollTo(0,0)}
function barUpd(){
  const t=T(cur);if(!t||!$("bar"))return;
  const dn=dcnt(t.id);
  $("bar").innerHTML=dn?`<span>الطلب الجديد <b>${fmt(dsum(t.id))}</b></span><button class="btn" onclick="sendOrder()">📤 إرسال (${dn})</button>`
    :`<span>الإجمالي <b>${fmt(net(t))}</b></span><button class="btn" onclick="setTab('o')">عرض الحساب</button>`;
}
function draw(){
  const t=T(cur);if(!t)return goBack();
  const pp=t.ps?psPanel(t):"";
  ttl();
  $("tm").className=tab=="m"?"a":"";$("to").className=tab=="o"?"a":"";
  $("to").textContent="الحساب ("+(cnt(t)+dcnt(t.id))+")";
  barUpd();
  if(tab=="m"){
    $("body").innerHTML=pp+`<div class="sr"><input id="qi" placeholder="ابحث عن صنف..." value="${esc(q)}" oninput="q=this.value;lst()"><button class="btn ghost" onclick="customItem()">＋ صنف</button><button class="btn ghost ${stockMode?"on":""}" onclick="toggleStockMode()">🚫 خلص</button></div>
    ${stockMode?`<div class="warn" style="margin:0 14px 8px">وضع "خلص": دوس على أي صنف عشان يتعلّم خلصان أو يرجع متاح. دوس 🚫 خلص تاني للخروج.</div>`:""}
    <div class="chips"><button class="${cat?"":"a"}" onclick="cat='';draw()">الكل</button>${M.map(m=>`<button class="${cat==m[0]?"a":""}" onclick="cat=${A(m[0])};draw()">${m[0]}</button>`).join("")}</div>
    <div class="items" id="lst"></div>`;
    lst();
  }else{
    const dl=Object.entries(draftOf(t.id)),ts=tk(t);
    const draft=dl.length?`<div class="dft"><div class="sec">🛒 طلب جديد (لسه ماتبعتش)</div>
      ${dl.map(([k,x])=>`<div class="row"><div class="nm">${esc(x.n)}<small>${fmt(x.p)} × ${x.q}</small></div><div class="qty"><button onclick="chgD(${A(k)},-1)">−</button><b>${x.q}</b><button onclick="chgD(${A(k)},1)">+</button></div><div class="ln">${+(x.p*x.q).toFixed(2)}</div></div>`).join("")}
      <div class="box"><textarea class="note" placeholder="ملاحظة للطلب (مثلا بدون سكر)" oninput="DRN[${A(t.id)}]=this.value;saveDr()">${esc(DRN[t.id]||"")}</textarea>
      <div class="acts"><button class="btn" onclick="sendOrder()">📤 إرسال الطلب · ${fmt(dsum(t.id))}</button><button class="btn red" onclick="clrDraft()">مسح</button></div></div></div>`:"";
    const tickets=ts.map((x,n)=>{
      const pend=x.status!=="served",canDel=canClose()||(x.byUid===ME.uid&&pend);
      return `<div class="tk ${pend?"pending":"served"} ${isLate(x)?"late":""}"><div class="tkh"><b>طلب ${n+1}</b><span>${hhmm(x.at)}</span><span class="st ${pend?"p":"s"}">${pend?"⏳ في الانتظار"+(isLate(x)?" ⚠ متأخر":""):"نزل ✓"}</span></div>
      <small class="hint">${esc(x.by||"")}${!pend&&x.servedBy?" · نزّله "+esc(x.servedBy):""}${x.nt?" · 📝 "+esc(x.nt):""}</small>
      ${x.items.map((it,j)=>{const sk=x.id+":"+j,sq=Math.min(SEL[sk]||0,it.q);return `<div class="row"><div class="nm">${esc(it.n)}<small>${fmt(it.p)} × ${it.q}</small>${canClose()?`<button class="ed" onclick="editLine(${A(x.id)},${j})">✎ تعديل السعر</button>`:""}</div>${canClose()?`<div class="pq" title="الكمية المدفوعة"><button onclick="selQ(${A(sk)},-1,${it.q})">−</button><b class="${sq?"on":""}">${sq}</b><button onclick="selQ(${A(sk)},1,${it.q})">+</button></div>`:""}<div class="ln">${+(it.p*it.q).toFixed(2)}</div></div>`}).join("")}
      <div class="acts">${pend?`<button class="btn" onclick="serve(${A(x.id)})">✔ تم التنزيل</button>`:""}${canDel?`<button class="btn red" onclick="delTk(${A(x.id)})">إلغاء الطلب</button>`:""}</div></div>`}).join("");
    $("body").innerHTML=pp+draft+(tickets||(dl.length?"":`<div class="empty">${t.ps?"مفيش مشروبات على الجهاز ده.":"مفيش طلبات على الطاولة دي لسه."}<br>روح للمنيو وأضف أصناف.</div>`))+
    `<div class="box">
      ${canClose()&&cnt(t)?paySelBox(t):""}
      ${t.paid?`<div class="sum"><span class="pd">✔ مدفوع سابقا</span><b class="pd">${fmt(t.paid)}</b></div>`:""}
      <div class="sum"><span>${t.paid?"المتبقي (قبل الخصم)":"المجموع"}</span><b>${fmt(sub(t))}</b></div>
      ${canClose()||t.d?`<div class="sum"><span>خصم (جنيه)</span><input type="number" inputmode="decimal" min="0" step="any" value="${t.d||""}" placeholder="0" ${canClose()?"":"disabled"} onchange="setDisc(this.value)"></div>`:""}
      <div class="sum big"><span>الصافي${hasFT(t)?`<br><span class="tag">معدّل يدويا</span>`:""}</span><span>${fmt(net(t))}</span></div>
      ${canClose()?`<div class="acts"><button class="btn ghost" onclick="editTotal()">✎ تعديل الإجمالي</button>${hasFT(t)?`<button class="btn red" onclick="resetTotal()">رجوع للحساب التلقائي</button>`:""}</div>`:""}
      <textarea class="note" placeholder="ملاحظات على الحساب (اختياري)" onchange="DB.patchTable(cur,{nt:this.value.trim()})">${esc(t.nt||"")}</textarea>
      <div class="acts">${canClose()?`<button class="btn" onclick="closeB()">💰 تحصيل وقفل الفاتورة</button>`:""}<button class="btn ghost" onclick="copyB()">نسخ الفاتورة</button></div>
      ${canClose()?"":`<div class="hint">تحصيل الفاتورة وقفلها من الكاشير.</div>`}
      ${canClose()&&!busy(t)&&!t.ps?`<div class="acts"><button class="btn red" onclick="delT()">حذف الطاولة</button></div>`:""}
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
    </div>`;
  }
}
function lst(){
<<<<<<< HEAD
  const ql=q.trim(),t=T(cur),d=draftOf(t.id);
  const L=ITEMS.filter(i=>(!cat||i.c==cat)&&(!ql||i.n.includes(ql)||i.c.includes(ql)));
  $("lst").innerHTML=L.length?L.map(i=>{const x=d[i.k],o=isOut(i.k);return `<button class="it ${o?"out":""}" onclick="addD(${ITEMS.indexOf(i)})"><span>${esc(i.n)}</span><em>${i.p} ج</em>${o?`<b class="so">خلص</b>`:""}${x?`<i>${x.q}</i>`:""}</button>`}).join(""):`<div class="empty" style="grid-column:1/-1">مفيش نتائج</div>`;
}

// ===== مسودة الطلب =====
function toggleStockMode(){stockMode=!stockMode;draw()}
function toggleOut(k){
  const o=new Set(CFG.out||[]),i=ITEMS.find(z=>z.k===k);
  const was=o.has(k);was?o.delete(k):o.add(k);
  CFG.out=[...o];DB.setConfig({out:CFG.out});
  toast((was?"✅ رجع متاح: ":"🚫 خلص: ")+(i?i.n:""));
  if(screen=="s")settings();
}
function resetStock(){if(confirm("هترجّع كل الأصناف متاحة؟")){CFG.out=[];DB.setConfig({out:[]});settings()}}
function addD(ix){
  const t=T(cur),i=ITEMS[ix],d=draftOf(t.id);
  if(stockMode)return toggleOut(i.k);
  if(isOut(i.k))return toast("🚫 "+i.n+" خلص",true);
  if(d[i.k])d[i.k].q++;else d[i.k]={n:i.n,c:i.c,p:i.p,q:1};
  saveDr();barUpd();$("to").textContent="الحساب ("+(cnt(t)+dcnt(t.id))+")";lst();
}
function chgD(k,d){
  const t=T(cur),m=draftOf(t.id);m[k].q+=d;
  if(m[k].q<=0)delete m[k];
  saveDr();draw();
}
function clrDraft(){
  if(!confirm("مسح الطلب الجديد؟"))return;
  const id=cur;delete DR[id];delete DRN[id];saveDr();draw();
}
function customItem(){
  modal("إضافة صنف مخصص",[{l:"اسم الصنف",v:""},{l:"السعر (جنيه)",t:"number",v:""},{l:"الكمية",t:"number",v:"1"}],v=>{
    const p=num(v[1]),qn=Math.max(1,Math.round(num(v[2])||1));
    if(!v[0]||isNaN(p)||p<0)return alert("اكتب اسم الصنف وسعره"),false;
    draftOf(cur)["x"+Date.now()]={n:v[0],c:"مخصص",p,q:qn};
    saveDr();draw();
  });
}
// إرسال الطلب للجميع (يظهر عند كل المستخدمين "في الانتظار")
function sendOrder(){
  const t=T(cur);if(!t||sending)return;
  const lines=Object.values(draftOf(t.id));
  if(!lines.length)return;
  const outs=Object.entries(draftOf(t.id)).filter(([k])=>isOut(k)).map(([k,x])=>x.n);
  if(outs.length&&!confirm("الأصناف دي معلّمة خلصانة: "+outs.join("، ")+"\nتبعت الطلب برضو؟"))return;
  sending=true;
  try{
    DB.addTicket({tid:t.id,tn:t.n,ps:!!t.ps,status:"pending",at:Date.now(),by:ME.name,byUid:ME.uid,
      nt:(DRN[t.id]||"").trim(),items:lines.map(x=>({n:x.n,p:x.p,q:x.q}))});
    delete DR[t.id];delete DRN[t.id];saveDr();
    toast("📤 تم إرسال الطلب");
    tab="o";draw();window.scrollTo(0,0);
  }finally{sending=false}
}
function delTk(id){
  const x=TK.find(z=>z.id===id);
  if(!confirm("إلغاء الطلب ده؟"))return;
  if(x){const t=T(x.tid);log("إلغاء طلب",t?t.n:x.tn,x.items.map(i=>i.n+" ×"+i.q).join("، ")+" — "+(x.status==="served"?"كان نازل":"كان منتظر")+" — طلبه "+(x.by||""))}
  DB.deleteTicket(id);
}
function editLine(id,j){
  const x=TK.find(z=>z.id===id);if(!x)return;
  const it=x.items[j],tn=(T(x.tid)||{}).n||x.tn;
  modal("تعديل الصنف",[{l:"الاسم",v:it.n},{l:"سعر الوحدة (جنيه)",t:"number",v:it.p}],v=>{
    const p=num(v[1]);if(!v[0]||isNaN(p)||p<0)return alert("اكتب اسم وسعر صحيح"),false;
    if(v[0]!==it.n||p!==it.p)log("تعديل سعر صنف",tn,it.n+": "+it.p+" ج ← "+(v[0]!==it.n?v[0]+" ":"")+p+" ج");
    const items=x.items.map((z,k)=>k===j?{n:v[0],p,q:z.q}:z);
    DB.patchTicket(id,{items});
  },"التعديل على الطلب ده بس، أسعار المنيو زي ما هي.");
}
// ===== الخصم والإجمالي (كاشير) =====
function setDisc(v){
  const t=T(cur),n=num(v),d=isNaN(n)?0:Math.max(0,n);
  if(d!==(+t.d||0))log("خصم",t.n,(+t.d||0)+" ج ← "+d+" ج (المجموع "+fmt(sub(t))+")");
  DB.patchTable(cur,{d});
}
function editTotal(){
  const t=T(cur);
  modal("تعديل الإجمالي (الصافي)",[{l:"الإجمالي النهائي (جنيه)",t:"number",v:+net(t).toFixed(2)}],v=>{
    if(v[0]==="")return resetTotal(),undefined;
    const n=num(v[0]);if(isNaN(n)||n<0)return alert("اكتب رقم صحيح"),false;
    log("تعديل الإجمالي",t.n,fmt(net(t))+" ← "+fmt(n)+" (المجموع الأصلي "+fmt(sub(t))+")");
    DB.patchTable(cur,{ft:n});
  },"المجموع الأصلي: "+fmt(sub(t))+" — لو سبت الخانة فاضية هيرجع للحساب التلقائي.");
}
function resetTotal(){const t=T(cur);if(hasFT(t))log("رجوع للإجمالي التلقائي",t.n,"كان "+fmt(t.ft));DB.patchTable(cur,{ft:null})}
// ===== الفاتورة =====
function aggLines(t){
  const m={};
  tk(t).forEach(x=>x.items.forEach(i=>{const k=i.n+"|"+i.p;(m[k]=m[k]||{n:i.n,p:i.p,q:0}).q+=i.q}));
  return Object.values(m);
}
function billText(t){
  let s="جاردينيا كافيه - "+(t.ps?"":"طاولة ")+label(t)+"\n";
  if(t.ps&&hoursOf(t)>0)s+="بلايستيشن "+fmtH(hoursOf(t))+" × "+t.r+" ج/س = "+playCost(t)+"\n";
  aggLines(t).forEach(x=>s+=x.n+" × "+x.q+" = "+(+(x.p*x.q).toFixed(2))+"\n");
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
  s+="المجموع: "+sub(t)+" ج\n";
  if(+t.d)s+="الخصم: "+t.d+" ج\n";
  if(t.nt)s+="ملاحظات: "+t.nt+"\n";
  return s+"الصافي: "+net(t)+" ج";
}
function copyB(){
  const t=T(cur);if(!busy(t))return alert("مفيش طلبات");
  const s=billText(t);
<<<<<<< HEAD
  (navigator.clipboard?navigator.clipboard.writeText(s):Promise.reject()).then(()=>toast("تم نسخ الفاتورة")).catch(()=>prompt("انسخ الفاتورة:",s));
}
// ===== دفع جزئي: حدّد الأصناف اللي اتدفعت وسجّلها، والباقي يفضل على الطاولة =====
function selQ(k,d,max){
  const v=Math.max(0,Math.min(max,(SEL[k]||0)+d));
  if(v)SEL[k]=v;else delete SEL[k];
  draw();
}
function selList(t){
  const r=[];
  tk(t).forEach(x=>x.items.forEach((it,j)=>{const q=Math.min(SEL[x.id+":"+j]||0,it.q);if(q>0)r.push({x,j,q,it})}));
  return r;
}
const selTotal=t=>selList(t).reduce((a,z)=>a+z.it.p*z.q,0);
function selAll(){const t=T(cur);tk(t).forEach(x=>x.items.forEach((it,j)=>{SEL[x.id+":"+j]=it.q}));draw()}
function selClr(){Object.keys(SEL).forEach(k=>delete SEL[k]);draw()}
function paySelBox(t){
  const L=selList(t),n=L.reduce((a,z)=>a+z.q,0),tot=selTotal(t);
  return `<div class="paysel"><div class="sum"><span>💵 دفع جزئي: ${n?n+" صنف محدد":"حدّد الأصناف اللي اتدفعت بـ ➕"}</span><b>${n?fmt(tot):""}</b></div>
    <div class="acts"><button class="btn" onclick="paySel()" ${n?"":"disabled"}>تسجيل دفع المحدد</button><button class="btn ghost" onclick="selAll()">تحديد الكل</button>${n?`<button class="btn red" onclick="selClr()">مسح</button>`:""}</div></div>`;
}
function paySel(){
  const t=T(cur);if(!canClose())return;
  const L=selList(t);
  if(!L.length)return alert("حدّد الأصناف اللي اتدفعت الأول (زرار ➕ جنب الصنف)");
  const total=L.reduce((a,z)=>a+z.it.p*z.q,0),qty=L.reduce((a,z)=>a+z.q,0);
  if(qty===cnt(t)&&!(t.ps&&hoursOf(t)>0))return closeB(); // اتحدد كله = قفل كامل (بالخصم والإجمالي)
  if(!confirm("تسجيل دفع "+fmt(total)+" ("+qty+" صنف)؟\nالباقي على الطاولة: "+fmt(sub(t)-total)))return;
  const byT={};
  L.forEach(z=>{(byT[z.x.id]=byT[z.x.id]||{x:z.x,sel:{}}).sel[z.j]=z.q});
  const ops=[],lines=[],agg={};
  Object.values(byT).forEach(({x,sel})=>{
    const paid=[],rest=[];
    x.items.forEach((it,j)=>{
      const q=sel[j]||0;
      if(q>0){paid.push({n:it.n,p:it.p,q});const k=it.n+"|"+it.p;(agg[k]=agg[k]||{n:it.n,q:0}).q+=q}
      if(it.q-q>0)rest.push({n:it.n,p:it.p,q:it.q-q});
    });
    lines.push({at:x.at,by:x.by||"",servedBy:x.servedBy||"",st:x.status,nt:x.nt||"",items:paid});
    ops.push(rest.length?{id:x.id,items:rest}:{id:x.id,del:true});
  });
  const vid=t.vid||("v"+Date.now().toString(36));
  const bill={k:t.ps?"ps":"t",tn:t.n,c:t.c||"",t:Date.now(),d:0,sub:total,tot:total,adj:false,nt:"",ps:0,hrs:0,rate:0,
    part:true,vid,by:ME.name,byUid:ME.uid,o:Object.values(agg).map(a=>a.n+" ×"+a.q),lines};
  const left=sub(t)-total;
  DB.commitPay(t.id,bill,ops,{vid,paid:(+t.paid||0)+total});
  Object.keys(SEL).forEach(k=>delete SEL[k]);
  toast("💵 تم تسجيل دفع "+fmt(total)+" — الباقي "+fmt(left));
}

function mkBill(t,ts){
  const o=aggLines(t).map(x=>x.n+" ×"+x.q);
  if(t.ps&&hoursOf(t)>0)o.unshift("بلايستيشن "+fmtH(hoursOf(t))+" ("+t.r+" ج/س)");
  return {k:t.ps?"ps":"t",tn:t.n,c:t.c||"",t:Date.now(),d:+t.d||0,sub:sub(t),tot:net(t),adj:hasFT(t),nt:t.nt||"",
    ps:playCost(t),hrs:+hoursOf(t).toFixed(4),rate:+t.r||0,by:ME.name,byUid:ME.uid,o,vid:t.vid||null,paidBefore:+t.paid||0,
    lines:ts.map(x=>({at:x.at,by:x.by||"",servedBy:x.servedBy||"",st:x.status,nt:x.nt||"",items:x.items}))};
}
// تحصيل وقفل الفاتورة: بتتسجل بوقتها ويومها وتتمسح من الطاولة
function closeB(){
  const t=T(cur);if(!canClose())return;
  if(!busy(t))return alert("مفيش طلبات");
  const ts=tk(t),pend=ts.filter(x=>x.status!=="served").length;
  if(!confirm("تحصيل وقفل فاتورة "+(t.ps?"":"طاولة ")+label(t)+(t.paid?" — الباقي بعد دفعات سابقة ("+fmt(t.paid)+")":"")+" بإجمالي "+fmt(net(t))+"؟"+(pend?"\n⚠ فيه "+pend+" طلب لسه ماتنزلش":"")))return;
  if(pend||hasFT(t)||+t.d)log("تحصيل فاتورة",t.n,fmt(net(t))+(+t.d?" — خصم "+t.d+" ج":"")+(hasFT(t)?" — إجمالي معدّل (المجموع "+fmt(sub(t))+")":"")+(pend?" — "+pend+" طلب لسه ماتنزلش":""));
  const reset={c:"",d:0,ft:null,nt:"",paid:0,vid:null};
  if(t.ps){reset.hrs=0;reset.st=null}
  DB.closeBill(t.id,ts.map(x=>x.id),mkBill(t,ts),reset);
  toast("💰 تم التحصيل والحفظ");goBack();
}
function delT(){
  if(confirm("حذف الطاولة؟")){const id=cur,t=T(id);log("حذف طاولة",t?t.n:"","");goBack();DB.deleteTable(id)}
}
// ===== السجل + المصروفات (حسب اليوم والساعة) =====
const EXC=["مشتريات","مرتبات","كهرباء/مياه/إيجار","صيانة","أخرى"];
function loadDay(dk){
  repDay=dk;stopRep();BILLS=[];EXPS=[];WK=[];WKX=[];
  const [s,e]=dayRange(dk);
  const u1=DB.subBills(s,e,l=>{BILLS=l;dayUpd()});
  const u2=DB.subExpenses(s,e,l=>{EXPS=l;dayUpd()});
  repUnsub=()=>{u1();u2()};
  const [w0]=dayRange(shiftDay(dk,-6));
  DB.getBills(w0,e).then(l=>{if(repDay==dk){WK=l;dayUpd()}}).catch(()=>{});
  DB.getExpenses(w0,e).then(l=>{if(repDay==dk){WKX=l;dayUpd()}}).catch(()=>{});
}
const dayUpd=()=>{if(screen=="r"||screen=="x")live()};
function rep(dk){nav("r");cur=null;loadDay(dk||dkey(Date.now()));drawRep()}
function expenses(dk){nav("x");cur=null;loadDay(dk||repDay||dkey(Date.now()));drawExp()}
const sumBy=(l,f)=>l.reduce((a,x)=>a+(+f(x)||0),0);
function weekRows(dk,go){
  const wk={};
  WK.forEach(h=>{const k=dkey(h.t),d=wk[k]||(wk[k]={n:0,s:0,x:0});d.n++;d.s+=h.tot});
  WKX.forEach(h=>{const k=dkey(h.t),d=wk[k]||(wk[k]={n:0,s:0,x:0});d.x+=h.amount});
  const keys=Object.keys(wk).sort().reverse();
  return keys.length?`<div class="box"><b class="hint">آخر 7 أيام</b>${keys.map(k=>`<button class="btn ${k==dk?"":"ghost"} dayrow" onclick="${go}('${k}')"><span>${dname(k)}</span><span>مبيعات ${fmt(wk[k].s)}${wk[k].x?" · مصروفات "+fmt(wk[k].x):""}</span></button>`).join("")}</div>`:"";
}
const dayNav=(dk,go)=>`<div class="sum"><button class="btn ghost sm" onclick="${go}('${shiftDay(dk,-1)}')">السابق</button><b>${dname(dk)}</b><button class="btn ghost sm" onclick="${go}('${shiftDay(dk,1)}')">التالي</button></div>
    <input type="date" class="note" value="${dk}" onchange="if(this.value)${go}(this.value)">`;
function drawRep(){
  const dk=repDay,H=BILLS;
  const sum=sumBy(H,h=>h.tot),psum=sumBy(H,h=>h.ps),ex=sumBy(EXPS,x=>x.amount);
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>السجل</h1><button class="btn ghost sm" onclick="expenses('${dk}')">💸 المصروفات</button></header>
  <div class="box">
    ${dayNav(dk,"rep")}
    <div class="sum big"><span>إجمالي المبيعات</span><span>${fmt(sum)}</span></div>
    <div class="sum"><span>عدد الفواتير/الدفعات</span><b>${H.length}</b></div>
    ${psum>0?`<div class="sum"><span>منها وقت بلايستيشن</span><b>${fmt(psum)}</b></div>`:""}
    <div class="sum"><span>المصروفات</span><b class="neg">${fmt(ex)}</b></div>
    <div class="sum big"><span>الصافي</span><span class="${sum-ex<0?"neg":""}">${fmt(sum-ex)}</span></div>
  </div>
  ${H.length?H.map(h=>`<div class="bill"><div class="sum"><span>${h.k=="ps"?"":"طاولة "}${esc(h.tn)}${h.c?" - "+esc(h.c):""} · ${hhmm(h.t)}</span><b>${fmt(h.tot)}</b></div>${h.part?`<span class="tag">دفعة جزئية (الطاولة لسه مفتوحة)</span>`:h.paidBefore?`<span class="tag">الباقي — سبق دفع ${fmt(h.paidBefore)}</span>`:""}<small>${esc((h.o||[]).join("، "))}${h.d?" — خصم "+h.d+" ج":""}${h.adj?" — إجمالي معدّل يدويا":""}${h.nt?" — ملاحظات: "+esc(h.nt):""}<br>كاشير: ${esc(h.by||"")}${h.lines&&h.lines.length?" · جرسون: "+esc([...new Set(h.lines.map(l=>l.by).filter(Boolean))].join("، ")):""}</small>${isAdmin()?`<button class="ed del" onclick="delBill(${A(h.id)})">حذف الفاتورة</button>`:""}</div>`).join(""):`<div class="empty">مفيش فواتير في اليوم ده.</div>`}
  ${weekRows(dk,"rep")}`;
  window.scrollTo(0,0);
}
function drawExp(){
  const dk=repDay,E=EXPS,ex=sumBy(E,x=>x.amount),sum=sumBy(BILLS,h=>h.tot);
  const byC={};E.forEach(x=>{byC[x.cat||"أخرى"]=(byC[x.cat||"أخرى"]||0)+x.amount});
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>💸 المصروفات</h1><button class="btn ghost sm" onclick="rep('${dk}')">📊 السجل</button></header>
  <div class="box">
    ${dayNav(dk,"expenses")}
    <div class="sum big"><span>مصروفات اليوم</span><span class="neg">${fmt(ex)}</span></div>
    <div class="sum"><span>مبيعات اليوم</span><b>${fmt(sum)}</b></div>
    <div class="sum"><span>الصافي</span><b class="${sum-ex<0?"neg":""}">${fmt(sum-ex)}</b></div>
    ${Object.keys(byC).length?`<div class="hint">${Object.entries(byC).map(([k,v])=>esc(k)+": "+fmt(v)).join(" · ")}</div>`:""}
    <button class="btn" onclick="addExpense()">＋ إضافة مصروف</button>
  </div>
  ${E.length?E.map(x=>`<div class="bill"><div class="sum"><span>${esc(x.title)} · ${hhmm(x.t)}</span><b class="neg">${fmt(x.amount)}</b></div><small>${esc(x.cat||"")}${x.nt?" — "+esc(x.nt):""}<br>سجّله: ${esc(x.by||"")}</small>${isAdmin()||x.byUid===ME.uid?`<button class="ed del" onclick="delExpense(${A(x.id)})">حذف</button>`:""}</div>`).join(""):`<div class="empty">مفيش مصروفات في اليوم ده.</div>`}
  ${weekRows(dk,"expenses")}`;
  window.scrollTo(0,0);
}
function addExpense(){
  modal("إضافة مصروف",[
    {l:"البيان",v:"",ph:"مثلا شراء لبن وسكر"},
    {l:"المبلغ (جنيه)",t:"number",v:""},
    {l:"النوع",t:"select",v:EXC[0],opts:EXC.map(x=>[x,x])},
    {l:"ملاحظة (اختياري)",v:""}
  ],v=>{
    const a=num(v[1]);
    if(!v[0]||isNaN(a)||a<=0)return alert("اكتب البيان ومبلغ أكبر من صفر"),false;
    const today=dkey(Date.now())==repDay,[s0]=dayRange(repDay);
    DB.addExpense({t:today?Date.now():s0+12*3600000,title:v[0],amount:a,cat:v[2],nt:v[3],by:ME.name,byUid:ME.uid});
    toast("💸 تم تسجيل المصروف");
  },"بيتسجل على اليوم المعروض.");
}
function delExpense(id){
  const x=EXPS.find(z=>z.id===id);
  if(!confirm("حذف المصروف ده؟"))return;
  log("حذف مصروف","",x?x.title+" — "+fmt(x.amount)+" — "+(x.by||""):"");
  DB.deleteExpense(id);
}
function delBill(id){
  const h=BILLS.find(b=>b.id===id);
  if(!confirm("حذف الفاتورة دي من السجل نهائيا؟"))return;
  log("حذف فاتورة",h?h.tn:"",h?fmt(h.tot)+" — "+hhmm(h.t)+" — "+(h.o||[]).join("، "):"");
  DB.deleteBill(id);
}
// ===== سجل العمليات (للمدير) =====
function log(act,tn,det){
  try{DB.addLog({t:Date.now(),act,tn:tn||"",det:det||"",by:ME.name,byUid:ME.uid})}catch(e){}
}
function audit(dk){
  nav("a");cur=null;dk=dk||dkey(Date.now());logDay=dk;stopLog();LOGS=[];
  const [s,e]=dayRange(dk);
  logUnsub=DB.subLogs(s,e,l=>{LOGS=l;if(screen=="a")live()});
  drawAudit();
}
function drawAudit(){
  const dk=logDay,cnts={};
  LOGS.forEach(l=>{cnts[l.act]=(cnts[l.act]||0)+1});
  $("app").innerHTML=`<header><button class="btn ghost" onclick="settings()">رجوع ›</button><h1>📜 سجل العمليات</h1><span></span></header>
  <div class="box">${dayNav(dk,"audit")}
    <div class="sum"><span>عدد العمليات</span><b>${LOGS.length}</b></div>
    ${Object.keys(cnts).length?`<div class="hint">${Object.entries(cnts).map(([k,v])=>esc(k)+": "+v).join(" · ")}</div>`:""}</div>
  ${LOGS.length?LOGS.map(l=>`<div class="bill"><div class="sum"><span><b class="risk">${esc(l.act)}</b>${l.tn?" · "+esc(l.tn):""}</span><span class="hint">${hhmm(l.t)}</span></div><small>${esc(l.det||"")}<br>👤 ${esc(l.by||"")}</small></div>`).join(""):`<div class="empty">مفيش عمليات مسجلة في اليوم ده.</div>`}`;
  window.scrollTo(0,0);
}
// تنبيه الطلبات المتأخرة (صوت + رسالة)
function lateChk(){
  if(!ME||!loaded())return;
  const now=Date.now(),fresh=TK.filter(x=>isLate(x)&&(!LA[x.id]||now-LA[x.id]>300000));
  if(!fresh.length)return;
  fresh.forEach(x=>{LA[x.id]=now});
  beep();
  toast("⚠ "+fresh.length+" طلب متأخر ("+fresh.map(x=>(x.ps?"":"طاولة ")+((T(x.tid)||{}).n||x.tn)).join("، ")+")",true);
}
function setDelay(){
  modal("وقت تنبيه تأخير الطلب",[{l:"بالدقايق",t:"number",v:CFG.delayMin||10}],v=>{
    const n=Math.round(num(v[0]));if(isNaN(n)||n<1||n>240)return alert("اكتب رقم من 1 لـ 240"),false;
    CFG.delayMin=n;DB.setConfig({delayMin:n});log("تغيير وقت تنبيه التأخير","",n+" دقيقة");settings();
  },"أي طلب منتظر أكتر من المدة دي بيحمرّ وبيجيلك تنبيه بصوت.");
}

// ===== الإعدادات والحسابات =====
function settings(){
  nav("s");cur=null;
  const roleOpts=Object.entries(ROLES);
  $("app").innerHTML=`<header><button class="btn ghost" onclick="home()">رجوع ›</button><h1>الإعدادات</h1><span></span></header>
  <div class="box">
    <div class="sum"><span>👤 ${esc(ME.name)}</span><span class="tag">${ROLES[ME.role]||""} · ${esc(ME.username||"")}</span></div>
    <button class="btn ghost" onclick="toggleSnd()">${soundOn()?"🔔 صوت التنبيه: شغال":"🔕 صوت التنبيه: مقفول"}</button>
    <button class="btn ghost" onclick="chgPass()">تغيير كلمة السر</button>
    <button class="btn red" onclick="DB.logout()">تسجيل خروج</button>
  </div>
  <div class="box"><b class="hint">🚫 الأصناف الخلصانة (${(CFG.out||[]).length})</b>${(CFG.out||[]).length?(CFG.out||[]).map(k=>{const i=ITEMS.find(z=>z.k===k);return `<div class="urow"><div>${esc(i?i.n:k)}</div><button class="btn sm" onclick="toggleOut(${A(k)})">رجع متاح</button></div>`}).join("")+`<button class="btn ghost" onclick="resetStock()">تصفير الكل (بداية يوم جديد)</button>`:`<div class="hint">مفيش. من المنيو دوس 🚫 خلص وعلّم الصنف.</div>`}</div>
  ${isAdmin()?`<div class="box"><b class="hint">إعدادات المدير</b><button class="btn ghost" onclick="setDelay()">⏱ تنبيه تأخير الطلب: ${CFG.delayMin||10} دقيقة</button><button class="btn ghost" onclick="audit()">📜 سجل العمليات</button></div>`:""}
  ${canClose()?`<div class="box"><b class="hint">الطاولات</b><div class="acts"><button class="btn ghost" onclick="addT()">＋ طاولة</button>${isAdmin()?`<button class="btn ghost" onclick="addPS()">＋ جهاز PS</button>`:""}</div></div>`:""}
  ${isAdmin()?`<div class="box"><b class="hint">الحسابات</b>
    ${USERS.map(u=>`<div class="urow"><div><b>${esc(u.name)}</b><small class="hint"> ${esc(u.username)}</small></div>
      <select onchange="setRole(${A(u.uid)},this.value)" ${u.uid==ME.uid?"disabled":""}>${roleOpts.map(([k,v])=>`<option value="${k}" ${u.role==k?"selected":""}>${v}</option>`).join("")}</select>
      ${u.uid==ME.uid?"":`<button class="btn ${u.active===false?"":"red"} sm" onclick="setActive(${A(u.uid)},${u.active===false})">${u.active===false?"تفعيل":"إيقاف"}</button>`}</div>`).join("")}
    <button class="btn" onclick="addUser()">＋ إضافة حساب</button>
    <div class="hint">الحساب الموقوف مش بيقدر يدخل. لو حد نسي كلمة السر: أوقف حسابه وافتحله حساب جديد.</div>
    <button class="btn ghost" onclick="exportBills()">تصدير الفواتير والمصروفات (JSON)</button></div>`:""}`;
  window.scrollTo(0,0);
}
function toggleSnd(){try{localStorage.setItem("gd_snd",soundOn()?"0":"1")}catch(e){}settings()}
function chgPass(){
  modal("تغيير كلمة السر",[{l:"كلمة السر الجديدة (6 على الأقل)",v:""}],async v=>{
    try{await DB.changePassword(v[0]);toast("تم تغيير كلمة السر")}
    catch(e){alert(errMsg(e));return false}
  });
}
function addUser(){
  modal("إضافة حساب",[
    {l:"الاسم (بيظهر على الطلبات)",v:""},
    {l:"اسم المستخدم بالإنجليزي",v:"",ph:"مثلا mohamed"},
    {l:"كلمة السر (6 على الأقل)",v:""},
    {l:"الدور",t:"select",v:"waiter",opts:Object.entries(ROLES)}
  ],async v=>{
    if(!v[0]||!/^[a-zA-Z0-9._-]{3,20}$/.test(v[1]))return alert("الاسم مطلوب، واسم المستخدم 3-20 حرف إنجليزي/أرقام"),false;
    if(v[2].length<6)return alert("كلمة السر 6 حروف على الأقل"),false;
    try{await DB.createUser({name:v[0],username:v[1],password:v[2],role:v[3]});toast("تم إنشاء الحساب")}
    catch(e){alert(errMsg(e));return false}
  });
}
function setRole(uid,role){const u=USERS.find(z=>z.uid===uid);log("تغيير دور حساب","",(u?u.name:uid)+" ← "+(ROLES[role]||role));DB.patchUser(uid,{role})}
function setActive(uid,on){const u=USERS.find(z=>z.uid===uid);log(on?"تفعيل حساب":"إيقاف حساب","",u?u.name:uid);DB.patchUser(uid,{active:on})}
async function exportBills(){
  const l={bills:await DB.getBills(0,Date.now()+864e5),expenses:await DB.getExpenses(0,Date.now()+864e5)};
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([JSON.stringify(l,null,1)],{type:"application/json"}));
  a.download="gardenia-backup-"+dkey(Date.now())+".json";
  document.body.appendChild(a);a.click();a.remove();
}

// ===== مؤقتات: تحديث وقت PS كل ثانية، وأعمار الطلبات كل نص دقيقة =====
setInterval(()=>{
  if(!ME||!loaded())return;
  tickN++;
  if(screen=="p"){
    TB.filter(t=>t.ps).forEach(t=>{const e=$("pst"+t.id);if(e)e.textContent=psStat(t)});
  }else if(screen=="t"&&cur!=null){
    const t=T(cur);
    if(t&&t.ps&&t.st&&$("ptm")){
      $("ptm").textContent=fmtH(hoursOf(t))+" ⏱";$("pct").textContent=fmt(playCost(t));barUpd();
    }
  }else if((screen=="q"||screen=="h")&&tickN%30==0)live();
  if(tickN%10==0)lateChk();
},1000);
=======
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
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260

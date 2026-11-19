<<<<<<< HEAD
// ===== الحالة المشتركة (جاية من قاعدة البيانات) والحسابات =====
// الطاولات والطلبات والفواتير كلها في قاعدة البيانات المشتركة (Firebase) أو التجريبية المحلية.
// هنا بس: نسخة محلية بتتحدث لحظيا + دوال الحساب + مسودة الطلب (لسه ماتبعتش).
const DAY_START=5; // اليوم بيبدأ الساعة 5 الفجر: الفواتير بعد نص الليل بتتحسب على نفس اليوم
const ROLES={admin:"مدير",cashier:"كاشير",waiter:"جرسون",kitchen:"مطبخ/بار"};

let ME=null;      // المستخدم الحالي {uid,name,username,role}
let TB=[];        // الطاولات
let TK=[];        // الطلبات (Tickets) اللي لسه ماتحاسبتش
let USERS=[];     // الحسابات (للمدير بس)
let CFG={out:[],delayMin:10}; // إعدادات مشتركة: الأصناف الخلصانة + وقت تنبيه التأخير
const LD={t:false,k:false}; // اتحمّلت البيانات؟

const canClose=()=>!!ME&&(ME.role=="admin"||ME.role=="cashier");
const isAdmin=()=>!!ME&&ME.role=="admin";

// مصانع الطاولات
const mkTable=(n,ord)=>({n,c:"",ps:false,d:0,ft:null,nt:"",ord});
const mkPS=(i,ord)=>({n:"PS "+i,c:"",ps:true,r:20,hrs:0,st:null,d:0,ft:null,nt:"",ord});

// ===== البحث والحسابات =====
const T=id=>TB.find(t=>t.id===id);
const tk=t=>TK.filter(x=>x.tid===t.id).sort((a,b)=>a.at-b.at);
const pendOf=t=>tk(t).filter(x=>x.status!=="served").length;
const pendAll=()=>TK.filter(x=>x.status!=="served").length;
const items=t=>tk(t).reduce((a,x)=>a+x.items.reduce((b,i)=>b+i.p*i.q,0),0);
const cnt=t=>tk(t).reduce((a,x)=>a+x.items.reduce((b,i)=>b+i.q,0),0);
const runH=t=>t.st?(Date.now()-t.st)/3600000:0;                  // ساعات المؤقت الشغال
const hoursOf=t=>t.ps?(+t.hrs||0)+runH(t):0;                     // إجمالي الساعات
const playCost=t=>t.ps?Math.round(hoursOf(t)*(+t.r||0)*100)/100:0; // تكلفة الوقت
const sub=t=>items(t)+playCost(t);
const auto=t=>Math.max(0,sub(t)-(+t.d||0));                      // الصافي التلقائي
const hasFT=t=>t.ft!==null&&t.ft!==undefined;
const net=t=>hasFT(t)?t.ft:auto(t);                               // الصافي النهائي
=======
// ===== الحالة والحفظ (localStorage) =====
// المفتاح "gd1" هو نفسه القديم عشان بياناتك القديمة تفضل شغالة.
// حقول الطاولة: id, n=الاسم/الرقم, c=اسم العميل, o=الطلبات, d=الخصم, ft=إجمالي معدّل يدويا (أو null), nt=ملاحظات
// حقول جهاز البلايستيشن (نفس الحقول + ): ps=true, r=سعر الساعة, hrs=ساعات مسجلة, st=وقت بدء المؤقت (أو null)
const KEY="gd1";
const DAY_START=5; // اليوم بيبدأ الساعة 5 الفجر: الفواتير بعد نص الليل بتتحسب على نفس اليوم

function newTable(id,n){return {id,n,c:"",o:{},d:0,ft:null,nt:""}}
function newPS(id,i){return {id,n:"PS "+i,ps:true,r:20,hrs:0,st:null,c:"",o:{},d:0,ft:null,nt:""}}

let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!S||!Array.isArray(S.t)){
  S={t:Array.from({length:12},(_,i)=>newTable(i+1,""+(i+1))),h:[],nid:13};
}
S.h=S.h||[];
S.nid=S.nid||(Math.max(0,...S.t.map(t=>t.id))+1);
S.t.forEach(t=>{ // ترقية الطاولات القديمة
  t.o=t.o||{};t.d=t.d||0;
  if(t.c===undefined)t.c="";
  if(t.ft===undefined)t.ft=null;
  if(t.nt===undefined)t.nt="";
  if(t.ps){t.r=+t.r||0;t.hrs=+t.hrs||0;if(t.st===undefined)t.st=null}
});
if(!S.t.some(t=>t.ps)){for(let i=1;i<=4;i++)S.t.push(newPS(S.nid++,i))}

const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
// نطلب من المتصفح ميمسحش البيانات تلقائيا
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}

// ===== حسابات =====
const T=id=>S.t.find(t=>t.id==id);
const items=t=>Object.values(t.o).reduce((a,x)=>a+x.p*x.q,0);
const runH=t=>t.st?(Date.now()-t.st)/3600000:0;                 // ساعات المؤقت الشغال
const hoursOf=t=>t.ps?(+t.hrs||0)+runH(t):0;                    // إجمالي الساعات
const playCost=t=>t.ps?Math.round(hoursOf(t)*(+t.r||0)*100)/100:0; // تكلفة الوقت
const sub=t=>items(t)+playCost(t);
const auto=t=>Math.max(0,sub(t)-(+t.d||0));                     // الصافي التلقائي
const hasFT=t=>t.ft!==null&&t.ft!==undefined;
const net=t=>hasFT(t)?t.ft:auto(t);                              // الصافي النهائي (المعدّل لو موجود)
const cnt=t=>Object.values(t.o).reduce((a,x)=>a+x.q,0);
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260
const busy=t=>cnt(t)>0||hoursOf(t)>0;
const fmt=n=>(+n).toLocaleString("en-US",{maximumFractionDigits:2})+" ج";
const fmtH=h=>{const m=Math.round(h*60);return Math.floor(m/60)+" س "+(m%60)+" د"};
const label=t=>t.n+(t.c?" - "+t.c:"");
<<<<<<< HEAD
const hhmm=ts=>new Date(ts).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"});

// ===== مسودة الطلب (على جهاز الجرسون لحد ما يبعت) =====
let DR={},DRN={};
try{DR=JSON.parse(localStorage.getItem("gd_draft"))||{};DRN=JSON.parse(localStorage.getItem("gd_draftn"))||{}}catch(e){}
const saveDr=()=>{try{localStorage.setItem("gd_draft",JSON.stringify(DR));localStorage.setItem("gd_draftn",JSON.stringify(DRN))}catch(e){}};
const draftOf=id=>DR[id]||(DR[id]={});
const dcnt=id=>Object.values(DR[id]||{}).reduce((a,x)=>a+x.q,0);
const dsum=id=>Object.values(DR[id]||{}).reduce((a,x)=>a+x.p*x.q,0);

// ===== تواريخ =====
const pad2=n=>String(n).padStart(2,"0");
const ymd=d=>d.getFullYear()+"-"+pad2(d.getMonth()+1)+"-"+pad2(d.getDate());
const dkey=ts=>ymd(new Date(ts-DAY_START*3600000));
const dname=k=>new Date(k+"T12:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const shiftDay=(k,n)=>{const d=new Date(k+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d)};
const dayRange=k=>{const s=new Date(k+"T"+pad2(DAY_START)+":00:00"),e=new Date(s);e.setDate(e.getDate()+1);return [s.getTime(),e.getTime()]};

// ===== الأصناف الخلصانة وتأخير الطلبات =====
const isOut=k=>(CFG.out||[]).includes(k);
const lateMs=()=>(+CFG.delayMin||10)*60000;
const isLate=x=>x.status!=="served"&&Date.now()-x.at>lateMs();
const lateN=()=>TK.filter(isLate).length;
const lateT=t=>tk(t).some(isLate);
=======

// ===== تواريخ =====
const dkey=ts=>{const d=new Date(ts-DAY_START*3600000);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
const dname=k=>new Date(k+"T12:00:00").toLocaleDateString("ar-EG",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
const shiftDay=(k,n)=>{const d=new Date(k+"T12:00:00");d.setDate(d.getDate()+n);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")};
>>>>>>> 58976802d076f0caf326641966936abb3eb7a260

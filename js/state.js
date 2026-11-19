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
const busy=t=>cnt(t)>0||hoursOf(t)>0;
const fmt=n=>(+n).toLocaleString("en-US",{maximumFractionDigits:2})+" ج";
const fmtH=h=>{const m=Math.round(h*60);return Math.floor(m/60)+" س "+(m%60)+" د"};
const label=t=>t.n+(t.c?" - "+t.c:"");
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

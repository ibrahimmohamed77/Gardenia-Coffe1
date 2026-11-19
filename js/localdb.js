// ===== قاعدة بيانات تجريبية محلية (نفس واجهة Firebase) =====
// للتجربة بس: البيانات في localStorage على نفس الجهاز، وكل تبويب = مستخدم (الجلسة في sessionStorage).
// افتح تبويبين وسجّل بحسابين مختلفين عشان تشوف المزامنة. كلمات السر هنا مش مشفرة (مش للتشغيل الفعلي).
window.LocalDB=(function(){
  const K="gd_local2",SK="gd_local_sess";
  const load=()=>{let d={};try{d=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
    d.users=d.users||{};d.tables=d.tables||{};d.tickets=d.tickets||{};d.bills=d.bills||{};d.expenses=d.expenses||{};d.audit=d.audit||{};d.config=d.config||{};d.setup=!!d.setup;return d};
  let D=load();
  const subs=[];let authCb=null;
  const uid=()=>"l"+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const clone=x=>JSON.parse(JSON.stringify(x));
  const err=code=>{const e=new Error(code);e.code=code;return e};
  const getSess=()=>{try{return sessionStorage.getItem(SK)}catch(e){return null}};
  const setSess=v=>{try{v?sessionStorage.setItem(SK,v):sessionStorage.removeItem(SK)}catch(e){}};
  const pub=u=>({uid:u.uid,name:u.name,username:u.username,role:u.role,active:u.active});
  const list=o=>Object.keys(o).map(id=>Object.assign({id},clone(o[id])));
  const emit=()=>subs.slice().forEach(s=>s());
  const commit=()=>{try{localStorage.setItem(K,JSON.stringify(D))}catch(e){}emit()};
  const sub=(fn,cb)=>{const s=()=>cb(fn());subs.push(s);s();return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}};
  try{window.addEventListener("storage",e=>{if(e.key===K){D=load();emit()}})}catch(e){}

  const api={
    mode:"local",onError:null,
    async init(){},
    onAuth(cb){authCb=cb;const s=getSess(),u=s&&D.users[s];
      if(u&&u.active!==false)cb(pub(u));else cb(null)},
    async needsSetup(){return !D.setup},
    async setup(name,username,password){
      if(D.setup)throw err("app/already-setup");
      const id=uid();
      D.users[id]={uid:id,name,username:username.toLowerCase(),password,role:"admin",active:true};
      D.setup=true;
      for(let i=1;i<=12;i++)D.tables[uid()]=mkTable(""+i,i);
      for(let i=1;i<=4;i++)D.tables[uid()]=mkPS(i,100+i);
      commit();setSess(id);authCb&&authCb(pub(D.users[id]));
    },
    async login(username,password){
      D=load();
      const u=Object.values(D.users).find(x=>x.username===username.toLowerCase());
      if(!u||u.password!==password)throw err("auth/invalid-credential");
      if(u.active===false)throw err("app/inactive");
      setSess(u.uid);authCb&&authCb(pub(u));
    },
    async logout(){setSess(null);authCb&&authCb(null)},
    async createUser(o){
      D=load();
      if(Object.values(D.users).some(x=>x.username===o.username.toLowerCase()))throw err("auth/email-already-in-use");
      if(o.password.length<6)throw err("auth/weak-password");
      const id=uid();
      D.users[id]={uid:id,name:o.name,username:o.username.toLowerCase(),password:o.password,role:o.role,active:true};
      commit();
    },
    async changePassword(pw){
      D=load();const u=D.users[getSess()];if(!u)throw err("auth/requires-recent-login");
      if(pw.length<6)throw err("auth/weak-password");u.password=pw;commit();
    },
    subUsers(cb){return sub(()=>list(D.users).map(u=>({uid:u.id,name:u.name,username:u.username,role:u.role,active:u.active})),cb)},
    patchUser(id,p){D=load();Object.assign(D.users[id],p);commit()},

    subTables(cb){return sub(()=>list(D.tables),cb)},
    saveTable(id,o){D=load();id=id||uid();D.tables[id]=Object.assign(D.tables[id]||{},clone(o));commit();return id},
    patchTable(id,p){D=load();if(D.tables[id]){Object.assign(D.tables[id],clone(p));commit()}},
    deleteTable(id){D=load();delete D.tables[id];commit()},

    subTickets(cb){return sub(()=>list(D.tickets),cb)},
    addTicket(o){D=load();const id=uid();D.tickets[id]=clone(o);commit();return id},
    patchTicket(id,p){D=load();if(D.tickets[id]){Object.assign(D.tickets[id],clone(p));commit()}},
    deleteTicket(id){D=load();delete D.tickets[id];commit()},

    closeBill(tid,ticketIds,bill,reset){
      D=load();D.bills[uid()]=clone(bill);
      ticketIds.forEach(i=>delete D.tickets[i]);
      if(D.tables[tid])Object.assign(D.tables[tid],clone(reset));
      commit();
    },
    commitPay(tid,bill,ops,tp){
      D=load();D.bills[uid()]=clone(bill);
      ops.forEach(o=>{if(o.del)delete D.tickets[o.id];else if(D.tickets[o.id])D.tickets[o.id].items=clone(o.items)});
      if(D.tables[tid])Object.assign(D.tables[tid],clone(tp));
      commit();
    },
    addExpense(o){D=load();const id=uid();D.expenses[id]=clone(o);commit();return id},
    deleteExpense(id){D=load();delete D.expenses[id];commit()},
    _exps(s,e){return list(D.expenses).filter(b=>b.t>=s&&b.t<e).sort((a,b)=>b.t-a.t)},
    subExpenses(s,e,cb){return sub(()=>api._exps(s,e),cb)},
    async getExpenses(s,e){D=load();return api._exps(s,e)},
    subConfig(cb){return sub(()=>clone(D.config),cb)},
    setConfig(p){D=load();Object.assign(D.config,clone(p));commit()},
    addLog(o){D=load();D.audit[uid()]=clone(o);commit()},
    subLogs(s,e,cb){return sub(()=>list(D.audit).filter(b=>b.t>=s&&b.t<e).sort((a,b)=>b.t-a.t),cb)},
    _bills(s,e){return list(D.bills).filter(b=>b.t>=s&&b.t<e).sort((a,b)=>b.t-a.t)},
    subBills(s,e,cb){return sub(()=>api._bills(s,e),cb)},
    async getBills(s,e){D=load();return api._bills(s,e)},
    deleteBill(id){D=load();delete D.bills[id];commit()}
  };
  return api;
})();

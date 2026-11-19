// ===== اختيار قاعدة البيانات: Firebase لو الإعدادات موجودة، وإلا الوضع التجريبي المحلي =====
(function(){
async function makeFirebase(cfg){
  const B="https://www.gstatic.com/firebasejs/10.12.2/";
  const [FA,AU,FS]=await Promise.all([
    import(B+"firebase-app.js"),import(B+"firebase-auth.js"),import(B+"firebase-firestore.js")
  ]);
  const app=FA.initializeApp(cfg),auth=AU.getAuth(app);
  let db;
  try{ // تخزين محلي عشان الشغل يكمل لو النت قطع لحظات
    db=FS.initializeFirestore(app,{localCache:FS.persistentLocalCache({tabManager:FS.persistentMultipleTabManager()})});
  }catch(e){db=FS.getFirestore(app)}

  const mail=u=>u.toLowerCase()+"@gardenia.app";
  const clean=x=>JSON.parse(JSON.stringify(x)); // يشيل undefined
  const fail=e=>{console.error(e);api.onError&&api.onError(e)};
  const col=n=>FS.collection(db,n),dc=(n,id)=>FS.doc(db,n,id);
  const rows=s=>s.docs.map(d=>Object.assign({id:d.id},d.data()));
  let hold=false,authCb=null;

  async function profile(u){
    const s=await FS.getDoc(dc("users",u.uid));
    if(!s.exists())throw {code:"app/no-profile"};
    const d=s.data();
    if(d.active===false)throw {code:"app/inactive"};
    return Object.assign({},d,{uid:u.uid});
  }
  async function emitUser(u){
    if(!u)return authCb&&authCb(null);
    try{authCb&&authCb(await profile(u))}
    catch(e){await AU.signOut(auth).catch(()=>{});authCb&&authCb(null,e)}
  }

  const api={
    mode:"firebase",onError:null,
    async init(){},
    onAuth(cb){authCb=cb;AU.onAuthStateChanged(auth,u=>{if(!hold)emitUser(u)})},
    async needsSetup(){const s=await FS.getDoc(dc("meta","setup"));return !s.exists()},
    async setup(name,username,password){
      hold=true;
      try{
        const c=await AU.createUserWithEmailAndPassword(auth,mail(username),password);
        const b=FS.writeBatch(db);
        b.set(dc("users",c.user.uid),{name,username:username.toLowerCase(),role:"admin",active:true,createdAt:Date.now()});
        b.set(dc("meta","setup"),{at:Date.now(),uid:c.user.uid});
        await b.commit();
        const b2=FS.writeBatch(db); // الطاولات الافتراضية (دلوقتي المدير بقى معروف للقواعد)
        for(let i=1;i<=12;i++)b2.set(FS.doc(col("tables")),mkTable(""+i,i));
        for(let i=1;i<=4;i++)b2.set(FS.doc(col("tables")),mkPS(i,100+i));
        b2.commit().catch(fail);
      }finally{hold=false}
      await emitUser(auth.currentUser);
    },
    async login(username,password){await AU.signInWithEmailAndPassword(auth,mail(username),password)},
    async logout(){await AU.signOut(auth)},
    async createUser(o){
      // بنعمل الحساب من نسخة تانية من التطبيق عشان المدير يفضل داخل بحسابه
      const sec=FA.initializeApp(cfg,"sec"+Date.now());
      try{
        const a=AU.getAuth(sec);
        const c=await AU.createUserWithEmailAndPassword(a,mail(o.username),o.password);
        await AU.signOut(a);
        await FS.setDoc(dc("users",c.user.uid),{name:o.name,username:o.username.toLowerCase(),role:o.role,active:true,createdAt:Date.now()});
      }finally{FA.deleteApp(sec).catch(()=>{})}
    },
    async changePassword(pw){await AU.updatePassword(auth.currentUser,pw)},
    subUsers(cb){return FS.onSnapshot(col("users"),s=>cb(rows(s).map(u=>Object.assign(u,{uid:u.id}))),fail)},
    patchUser(id,p){FS.updateDoc(dc("users",id),clean(p)).catch(fail)},

    subTables(cb){return FS.onSnapshot(col("tables"),s=>cb(rows(s)),fail)},
    saveTable(id,o){const r=id?dc("tables",id):FS.doc(col("tables"));FS.setDoc(r,clean(o),{merge:true}).catch(fail);return r.id},
    patchTable(id,p){FS.updateDoc(dc("tables",id),clean(p)).catch(fail)},
    deleteTable(id){FS.deleteDoc(dc("tables",id)).catch(fail)},

    subTickets(cb){return FS.onSnapshot(col("tickets"),s=>cb(rows(s)),fail)},
    addTicket(o){const r=FS.doc(col("tickets"));FS.setDoc(r,clean(o)).catch(fail);return r.id},
    patchTicket(id,p){FS.updateDoc(dc("tickets",id),clean(p)).catch(fail)},
    deleteTicket(id){FS.deleteDoc(dc("tickets",id)).catch(fail)},

    closeBill(tid,ticketIds,bill,reset){
      const b=FS.writeBatch(db);
      b.set(FS.doc(col("bills")),clean(bill));
      ticketIds.forEach(i=>b.delete(dc("tickets",i)));
      b.update(dc("tables",tid),clean(reset));
      b.commit().catch(fail);
    },
    commitPay(tid,bill,ops,tp){
      const b=FS.writeBatch(db);
      b.set(FS.doc(col("bills")),clean(bill));
      ops.forEach(o=>o.del?b.delete(dc("tickets",o.id)):b.update(dc("tickets",o.id),{items:clean(o.items)}));
      b.update(dc("tables",tid),clean(tp));
      b.commit().catch(fail);
    },
    addExpense(o){const r=FS.doc(col("expenses"));FS.setDoc(r,clean(o)).catch(fail);return r.id},
    deleteExpense(id){FS.deleteDoc(dc("expenses",id)).catch(fail)},
    _qx(s,e){return FS.query(col("expenses"),FS.where("t",">=",s),FS.where("t","<",e),FS.orderBy("t","desc"))},
    subExpenses(s,e,cb){return FS.onSnapshot(api._qx(s,e),x=>cb(rows(x)),fail)},
    async getExpenses(s,e){return rows(await FS.getDocs(api._qx(s,e)))},
    subConfig(cb){return FS.onSnapshot(dc("meta","config"),x=>cb(x.exists()?x.data():{}),fail)},
    setConfig(p){FS.setDoc(dc("meta","config"),clean(p),{merge:true}).catch(fail)},
    addLog(o){FS.setDoc(FS.doc(col("audit")),clean(o)).catch(fail)},
    subLogs(s,e,cb){return FS.onSnapshot(FS.query(col("audit"),FS.where("t",">=",s),FS.where("t","<",e),FS.orderBy("t","desc")),x=>cb(rows(x)),fail)},
    _q(s,e){return FS.query(col("bills"),FS.where("t",">=",s),FS.where("t","<",e),FS.orderBy("t","desc"))},
    subBills(s,e,cb){return FS.onSnapshot(api._q(s,e),x=>cb(rows(x)),fail)},
    async getBills(s,e){return rows(await FS.getDocs(api._q(s,e)))},
    deleteBill(id){FS.deleteDoc(dc("bills",id)).catch(fail)}
  };
  return api;
}

(async()=>{
  const cfg=window.FIREBASE_CONFIG||{};
  const hasCfg=!!(cfg.apiKey&&cfg.projectId);
  try{
    window.DB=hasCfg?await makeFirebase(cfg):window.LocalDB;
    await window.DB.init();
    window.boot();
  }catch(e){
    console.error(e);
    window.bootError&&window.bootError(e);
  }
})();
})();

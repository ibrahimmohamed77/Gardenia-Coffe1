// ===== أدوات واجهة مشتركة =====
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

// نافذة تعديل بسيطة: fields=[{l:"العنوان",t:"text|number",v:"قيمة",ph:"تلميح"}]
// onOk(values) -> لو رجعت false النافذة متتقفلش
function modal(title,fields,onOk,hint){
  const w=document.createElement("div");
  w.className="mw";
  w.innerHTML=`<div class="md"><h3>${esc(title)}</h3>
    ${fields.map((f,i)=>`<label>${esc(f.l)}<input id="mf${i}" type="${f.t||"text"}" ${f.t=="number"?'inputmode="decimal" min="0" step="any"':""} value="${esc(f.v)}" placeholder="${esc(f.ph||"")}"></label>`).join("")}
    ${hint?`<div class="hint">${esc(hint)}</div>`:""}
    <div class="acts"><button class="btn" id="mok">حفظ</button><button class="btn ghost" id="mcn">إلغاء</button></div></div>`;
  document.body.appendChild(w);
  const close=()=>w.remove();
  const ok=()=>{const v=fields.map((_,i)=>w.querySelector("#mf"+i).value.trim());if(onOk(v)!==false)close()};
  w.querySelector("#mcn").onclick=close;
  w.querySelector("#mok").onclick=ok;
  w.onclick=e=>{if(e.target===w)close()};
  w.addEventListener("keydown",e=>{if(e.key==="Enter")ok();if(e.key==="Escape")close()});
  setTimeout(()=>{const f=w.querySelector("#mf0");if(f){f.focus();f.select&&f.select()}},50);
}

// تحويل نص لرقم (يقبل الأرقام العربية والفاصلة)
function num(s){
  s=String(s).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٫,]/g,".");
  const n=parseFloat(s);
  return isNaN(n)?NaN:n;
}

/* =========================
   عناصر أساسية
   ========================= */
const qaCard        = document.getElementById('qaCard');
const questionsEl   = document.getElementById('questions');
const requiredEl    = document.getElementById('summary');
const miniSummaryEl = document.getElementById('miniSummary');

/* عناصر Drafts */
const draftsSidebar = document.getElementById('draftsSidebar');
const draftsToggle  = document.getElementById('draftsToggle');
const draftsSearch  = document.getElementById('draftsSearch');
const draftsListEl  = document.getElementById('draftsList');

/* أزرار */
const btnCopy = document.getElementById('copyMiniBtn');
const btnSave = document.getElementById('saveDraftBtn');
const btnEnd  = document.getElementById('endBtn');

/* مفاتيح التخزين */
const DRAFTS_KEY = 'seoudi_drafts_v1';

/* =========================
   الحقول (الملاحظات + بيانات الشكوى)
   ========================= */
const FIELDS = {
  otherNotes:      () => document.getElementById('otherNotes')?.value?.trim() || '',
  cdMobile:        () => document.getElementById('cdMobile')?.value?.trim() || '',
  cdSubCategory:   () => document.getElementById('cdSubCategory')?.value?.trim() || '',
  cdItem:          () => document.getElementById('cdItem')?.value?.trim() || '',
  cdCustomerType:  () => document.getElementById('cdCustomerType')?.value?.trim() || '',
  cdPolicy:        () => (document.querySelector('input[name="cdPolicy"]:checked')?.value || ''),
  cdWithClient:    () => document.getElementById('cdWithClient')?.value?.trim() || '',
  cdOrderCreated:  () => document.getElementById('cdOrderCreated')?.value?.trim() || '',
  cdOrderNumber:   () => document.getElementById('cdOrderNumber')?.value?.trim() || '',
  cdTransaction:   () => document.getElementById('cdTransaction')?.value?.trim() || '',
  cdStoreSelect:   () => document.getElementById('cdStoreSelect')?.value?.trim() || '',
};

/* =============== Helpers =============== */
function onlyDigits(str){ return (str||'').replace(/\D+/g,''); }
function markInvalidEl(el, on=true){ if(el) el.classList.toggle('invalid', on); }

/* ======= Validation (بسيطة وبدون فرض الحقول الأوتو) ======= */
function getMissingComplaintData(){
  const missing = [];
  const mobileDigits = onlyDigits(FIELDS.cdMobile());
  if(!mobileDigits || mobileDigits.length < 10) missing.push(['Customer Mobile','cdMobile']);
  if(!FIELDS.cdPolicy()) missing.push(['سياسة الاستبدال والاسترجاع','cdPolicy']);
  if(!FIELDS.cdOrderCreated() || isNaN(Number(FIELDS.cdOrderCreated()))) missing.push(['Order Created','cdOrderCreated']);
  if(!FIELDS.cdOrderNumber()  || isNaN(Number(FIELDS.cdOrderNumber())))  missing.push(['Order Number','cdOrderNumber']);
  if(!FIELDS.cdTransaction()  || isNaN(Number(FIELDS.cdTransaction())))  missing.push(['Transaction Number','cdTransaction']);
  if(!FIELDS.cdStoreSelect()) missing.push(['Store','cdStoreSelect']);
  return missing;
}
function highlightMissingComplaintData(){
  const miss = getMissingComplaintData();
  ['cdMobile','cdOrderCreated','cdOrderNumber','cdTransaction'].forEach(id=> markInvalidEl(document.getElementById(id), false));
  document.getElementById('cdStoreSelect')?.classList.remove('invalid');
  document.querySelectorAll('input[name="cdPolicy"]').forEach(r=> r.parentElement.classList.remove('invalid'));
  miss.forEach(([_, id])=>{
    if(id==='cdPolicy'){
      document.querySelectorAll('input[name="cdPolicy"]').forEach(r=> r.parentElement.classList.add('invalid'));
    }else if(id==='cdStoreSelect'){
      document.getElementById('cdStoreSelect')?.classList.add('invalid');
    }else{
      markInvalidEl(document.getElementById(id), true);
    }
  });
  return miss;
}

/* ======= Toast ======= */
let toastTimer=null;
function showToast(msg, type='error'){
  if(toastTimer){ clearTimeout(toastTimer); toastTimer=null; }
  document.querySelectorAll('.toast').forEach(t=>t.remove());
  const t = document.createElement('div');
  t.className = `toast ${type==='error'?'toast-error':'toast-success'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  toastTimer = setTimeout(()=>{ t.remove(); }, 3200);
}

/* ======= Utilities ======= */
function show(el, on) { if(!el) return; el.style.display = on ? '' : 'none'; }
function clear(el) { if(!el) return; el.innerHTML = ''; }
function esc(s=''){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

/* ========== Style صغير ========== */
(function injectStyle(){
  try{
    const st = document.createElement('style');
    st.textContent = `.result-apology .apology-main{ font-weight:700; color:#0d47a1; } .req{color:#d00;margin-right:4px}`;
    document.head.appendChild(st);
  }catch{}
})();

/* ===== اعتذار تلقائي لبعض النتائج ===== */
function shouldInjectApology(line=''){
  const t = (line||'').trim();
  if(/^\s*عرض\s+طلب\s+جديد/i.test(t)) return false;
  if(/^\s*يتم\s+عرض\s+طلب\s+جديد/i.test(t)) return false;
  return (
    /^\s*عمل\s+طلب\s+جديد\b/.test(t)
    || /طلب\s+جديد\s+بالمفقود/.test(t)
    || /عمل\s+طلب\s+جديد\s+بباقي\s+الكمية/.test(t)
    || /عمل\s+طلب\s+جديد\s+بنفس\s+الكمية/.test(t)
    || /عمل\s+طلب\s+جديد\s+بالمنتج/.test(t)
  );
}
function addResult(text, opts={}){
  show(qaCard, true);
  show(document.getElementById('summaryCard'), true);
  const d = document.createElement('div');
  d.className = 'result' + (opts?.className ? ` ${opts.className}` : '');
  if(opts.html) d.innerHTML = text; else d.textContent = text;
  requiredEl.appendChild(d);
  if(shouldInjectApology(text)){
    const ap = document.createElement('div');
    ap.className = 'result result-apology';
    ap.innerHTML = `نقول للعميل (<span class="apology-main"><strong>بعتذر لحضرتك جداً عن أي مشكلة واجهتك، هيتم مراجعة الشكوى داخلياً من غير ما نزعج حضرتك</strong></span>)<br>
    وفي حالة إن العميل أصر على التواصل معاه من خلال قسم الشكاوى:<br>
    يتم توضيح ده في الـ Ticket بشكل واضح علشان يتم المتابعة من الفريق المختص.`;
    requiredEl.appendChild(ap);
  }
  renderMiniSummary();
}
function resetRequired() { clear(requiredEl); renderMiniSummary(); }
function pruneNextSiblings(node, className) {
  let n = node?.nextElementSibling;
  while (n) { const nxt = n.nextElementSibling; if (!className || n.classList?.contains(className)) n.remove(); n = nxt; }
}
function radioQuestion({title, name, options}) {
  const wrap = document.createElement('div');
  wrap.className = 'q-block';
  wrap.innerHTML = `
    <div class="q-title">${title}</div>
    <div class="inline-options">
      ${options.map(o=>`<label><input type="radio" name="${name}" value="${o.value}"> ${o.label}</label>`).join('')}
    </div>`;
  return wrap;
}
function inputQuestion({title, name, placeholder}){
  const wrap = document.createElement('div');
  wrap.className='q-block';
  wrap.innerHTML = `
    <div class="q-title">${title}</div>
    <input type="text" name="${name}" id="${name}" placeholder="${placeholder||''}" />
    <p class="hint mt8">هذا الحقل مطلوب.</p>
  `;
  return wrap;
}
const wipe = (obj, keys)=> keys.forEach(k=> obj[k]=null);

/* ======= Build copy text (الخلاصة) ======= */
function buildCopyText(){
  const SEP = '----------------------------------------';
  const data = [];
  const notes = FIELDS.otherNotes();
  if (notes) data.push(['الملاحظات', notes]);

  const steps = [];
  if(state.type==='pq'){
    steps.push('نوع الشكوى: جودة منتج');
    if(state.pq.caseLabel) steps.push(`الحالة: ${state.pq.caseLabel}`);
    if(state.pq.client)     steps.push(`نوع العميل: ${state.pq.client}`);
    if(state.pq.pay)        steps.push(`طريقة الدفع: ${state.pq.pay}`);
    if(state.pq.product)    steps.push(`نوع المنتج: ${state.pq.product}`);
    if(state.pq.withClient) steps.push(`المنتج مع العميل؟ → ${state.pq.withClient}`);
    if(state.pq.rr)         steps.push(`اختيار العميل: ${state.pq.rr}`);
  }else if(state.type==='missing'){
    steps.push('نوع الشكوى: عناصر مفقودة');
    if(state.mi.client) steps.push(`نوع العميل: ${state.mi.client}`);
    if(state.mi.inv)    steps.push(`هل متحاسب في الفاتورة؟ → ${state.mi.inv}`);
    if(state.mi.pay)    steps.push(`طريقة الدفع: ${state.mi.pay}`);
    if(state.mi.fish)   steps.push(`نوع المنتج: ${state.mi.fish}`);
    if(state.mi.source) steps.push(`مصدر الطلب: ${state.mi.source}`);
    if(state.mi.abd)    steps.push(`مراجعة الماجينتو/ABD → ${state.mi.abd}`);
  }else if(state.type==='wt'){
    steps.push('نوع الشكوى: خطأ فردي');
    if(state.wt.scenario) steps.push(`اختر الحالة: ${state.wt.scenario}`);
    if(state.wt.client)   steps.push(`نوع العميل: ${state.wt.client}`);
    if(state.wt.pay)      steps.push(`طريقة الدفع: ${state.wt.pay}`);
    if(state.wt.kind)     steps.push(`هل منتج: ${state.wt.kind}`);
    if(state.wt.invoiced) steps.push(`هل تمت المحاسبة كاملة؟ → ${state.wt.invoiced}`);
    if(state.wt.abd)      steps.push(`مراجعة الماجينتو/ABD → ${state.wt.abd}`);
    if(state.wt.rr)       steps.push(`اختيار العميل: ${state.wt.rr}`);
  }

  const reqs = [...(requiredEl?.querySelectorAll('.result')||[])].map(el=>el.textContent.trim()).filter(Boolean);

  const lines = [];
  lines.push('الخلاصة');

  if(data.length){
    lines.push('');
    lines.push('الملاحظات:');
    data.forEach(([k,v])=> lines.push(`${k}: ${v}`));
  }
  if(steps.length){
    lines.push('');
    lines.push(SEP);
    lines.push('');
    lines.push('الخطوات المتبعه:');
    steps.forEach(s=> lines.push(s));
  }
  if(reqs.length){
    lines.push('');
    lines.push(SEP);
    lines.push('');
    lines.push('المطلوب:');
    reqs.forEach(r=> lines.push(r));
  }
  return lines.join('\n');
}

/* =========================
   الحالة العامة (State)
   ========================= */
const state = {
  type: null,
  suppressCD: false, // لو true: لا نكتب بيانات الشكوى (N/A)
  pq: { caseId:null,caseLabel:null,client:null,pay:null,product:null,withClient:null,rr:null },
  mi: { client:null,pay:null,fish:null,inv:null,abd:null, source:null },
  wt: { scenario:null,client:null,pay:null,kind:null,invoiced:null,abd:null,rr:null },
  cd: { mobile:'', subCategory:'', item:'', customerType:'', policy:'', withClient:'',
        orderCreated:'', orderNumber:'', transaction:'', store:'' }
};
function resetStatePart(key){
  if(key==='pq') state.pq = {caseId:null,caseLabel:null,client:null,pay:null,product:null,withClient:null,rr:null};
  if(key==='mi') state.mi = {client:null,pay:null,fish:null,inv:null,abd:null, source:null};
  if(key==='wt') state.wt = {scenario:null,client:null,pay:null,kind:null,invoiced:null,abd:null,rr:null};
  if(key==='cd') state.cd = { mobile:'', subCategory:'', item:'', customerType:'', withClient:'', orderCreated:'', orderNumber:'', transaction:'', store:'' };
}

/* ====== اشتقاق الحقول الأوتوماتيك ====== */
function deriveCustomerType(){
  if(state.pq.pay === 'دفع مسبق "Online Payment"' ||
     state.mi.pay === 'دفع مسبق "Online Payment"' ||
     state.wt.pay === 'دفع مسبق "Online Payment"') return 'عميل تطبيق';
  if(state.type==='missing' && state.mi.pay === 'كاش - فيزا' && state.mi.source === 'Application') return 'عميل تطبيق';
  return state.pq.client || state.mi.client || state.wt.client || 'N/A';
}
function deriveItemForMissing(){
  let item = (state.mi.client === 'عميل فرع') ? 'Retail - الفرع'
           : (state.mi.client === 'عميل ديليفري' ? 'Delivery - التوصيل' : 'N/A');
  if(state.mi.inv === 'نعم'){
    item = (state.mi.client === 'عميل فرع') ? 'Retail - الفرع'
         : (state.mi.client === 'عميل ديليفري') ? 'Delivery - التوصيل' : item;
  }
  if(state.mi.client === 'عميل ديليفري' && state.mi.inv === 'لا' && state.mi.pay === 'كاش - فيزا'){
    item = 'CC - مركز الاتصال';
  }
  return item || 'N/A';
}
function isChefWeightGroup(kindText=''){
  const k = (kindText||'').trim();
  return k.includes('سمك') || k.includes('لحوم') || k.includes('دواجن') || k.includes('جبن');
}
function deriveItemForWT(){
  if(state.wt.scenario === 'الحالة الأولى (وصول منتج بكميات اقل من المطلوب)') return 'عدم الإلتزام بالوزن';
  if(state.wt.scenario === 'الحالة الثانية (عدم الالتزام بكومنت في الطلب)')   return 'عدم الإلتزام بالكومنت';
  return 'N/A';
}
function deriveSubForWT(){
  // عميل فرع ⇒ Chef
  if(state.wt.client === 'عميل فرع') return 'Wrong Transaction - Chef';
  // عميل دليفري
  if(state.wt.client === 'عميل ديليفري'){
    if(isChefWeightGroup(state.wt.kind)) return 'Wrong Transaction - Chef';  // سمك / لحوم / جبن وزن / دواجن
    return 'Wrong Transaction - Picker';                                    // منتجات أخرى
  }
  return 'Wrong Transaction';
}

function deriveComplaintFields(){
  // لو الحالة الخاصة “مش شكوى”: نكتب N/A
  if(state.suppressCD){
    state.cd.subCategory = 'N/A';
    state.cd.item        = 'N/A';
    state.cd.customerType= 'N/A';
    state.cd.withClient  = 'N/A';
  }else{
    // Sub Category
    if(state.type === 'pq')           state.cd.subCategory = 'Product Quality';
    else if(state.type === 'missing') state.cd.subCategory = 'Missing Item';
    else if(state.type === 'wt')      state.cd.subCategory = deriveSubForWT();
    else                              state.cd.subCategory = 'N/A';

    // Item
    if(state.type === 'missing')      state.cd.item = deriveItemForMissing();
    else if(state.type === 'wt')      state.cd.item = deriveItemForWT();
    else if(state.type === 'pq' && state.pq.caseLabel) state.cd.item = state.pq.caseLabel;
    else                               state.cd.item = 'N/A';

    // Customer Type
    state.cd.customerType = deriveCustomerType();

    // With Client (PQ فقط)
    if(state.type === 'pq'){
      if(state.pq.withClient === 'نعم') state.cd.withClient = 'Yes';
      else if(state.pq.withClient === 'لا') state.cd.withClient = 'No';
      else state.cd.withClient = 'N/A';
    }else{
      state.cd.withClient = 'N/A';
    }
  }

  // تحديث الحقول المقفولة
  const setVal = (id,val)=>{ const el=document.getElementById(id); if(el) el.value = val||''; };
  setVal('cdSubCategory', state.cd.subCategory);
  setVal('cdItem',        state.cd.item);
  setVal('cdCustomerType',state.cd.customerType);
  setVal('cdWithClient',  state.cd.withClient);
}

/* =========================
   الخلاصة (بدون بيانات الشكوى)
   ========================= */
function renderMiniSummary(){
  if(!miniSummaryEl) return;
  let html = '<div class="mini-title">الخلاصة</div>';

  const data = [];
  const notes = FIELDS.otherNotes();
  if (notes) data.push(['الملاحظات', notes]);

  if(data.length){
    html += '<div class="mini-section is-data"><strong>الملاحظات:</strong><ul>';
    data.forEach(([k,v])=> html += `<li>${esc(k)}: ${esc(v)}</li>`); html += '</ul></div>';
  }

  const steps = [];
  if(state.type==='pq'){
    steps.push('نوع الشكوى: جودة منتج');
    if(state.pq.caseLabel) steps.push(`الحالة: ${state.pq.caseLabel}`);
    if(state.pq.client)     steps.push(`نوع العميل: ${state.pq.client}`);
    if(state.pq.pay)        steps.push(`طريقة الدفع: ${state.pq.pay}`);
    if(state.pq.product)    steps.push(`نوع المنتج: ${state.pq.product}`);
    if(state.pq.withClient) steps.push(`المنتج مع العميل؟ → ${state.pq.withClient}`);
    if(state.pq.rr)         steps.push(`اختيار العميل: ${state.pq.rr}`);
  }else if(state.type==='missing'){
    steps.push('نوع الشكوى: عناصر مفقودة');
    if(state.mi.client) steps.push(`نوع العميل: ${state.mi.client}`);
    if(state.mi.inv)    steps.push(`هل متحاسب في الفاتورة؟ → ${state.mi.inv}`);
    if(state.mi.pay)    steps.push(`طريقة الدفع: ${state.mi.pay}`);
    if(state.mi.fish)   steps.push(`نوع المنتج: ${state.mi.fish}`);
    if(state.mi.source) steps.push(`مصدر الطلب: ${state.mi.source}`);
    if(state.mi.abd)    steps.push(`مراجعة الماجينتو/ABD → ${state.mi.abd}`);
  }else if(state.type==='wt'){
    steps.push('نوع الشكوى: خطأ فردي');
    if(state.wt.scenario) steps.push(`اختر الحالة: ${state.wt.scenario}`);
    if(state.wt.client)   steps.push(`نوع العميل: ${state.wt.client}`);
    if(state.wt.pay)      steps.push(`طريقة الدفع: ${state.wt.pay}`);
    if(state.wt.kind)     steps.push(`هل منتج: ${state.wt.kind}`);
    if(state.wt.invoiced) steps.push(`هل تمت المحاسبة كاملة؟ → ${state.wt.invoiced}`);
    if(state.wt.abd)      steps.push(`مراجعة الماجينتو/ABD → ${state.wt.abd}`);
    if(state.wt.rr)       steps.push(`اختيار العميل: ${state.wt.rr}`);
  }

  if(steps.length){
    html += '<div class="mini-section is-steps"><strong>الخطوات المتبعه:</strong><ul>';
    steps.forEach(s=> html += `<li>${esc(s)}</li>`); html += '</ul></div>';
  }

  const reqs = [...(requiredEl?.querySelectorAll('.result')||[])].map(el=>el.textContent.trim()).filter(Boolean);
  if(reqs.length){
    html += '<div class="mini-section is-req"><strong>المطلوب:</strong><ul>';
    reqs.forEach(r=> html += `<li>${esc(r)}</li>`); html += '</ul></div>';
  }
  miniSummaryEl.innerHTML = html;
}

/* =========================
   جودة المنتج (Product Quality)
   ========================= */
const PQ_CASES = [
  {id:'mold',       label:'عفن',         mode:'flow',    sub:'عفن'},
  {id:'hyg',        label:'هايجين"نظافة عامة"', mode:'flow', sub:'هايجين"نظافة عامة"'},
  {id:'impurities', label:'شوائب بالمنتج',mode:'flow',    sub:'شوائب بالمنتج'},
  {id:'taste',      label:'رائحة و طعم و لون', mode:'flow', sub:'رائحة و طعم و لون'},
  {id:'taswiya',    label:'تسوية',       mode:'flow',    sub:'تسوية', fishGate:true},
  {id:'fat',        label:'دهون زائده',  mode:'flow',    sub:'دهون زائدة'},
  {id:'spoiled',    label:'فاسد',        mode:'flow',    sub:'فاسد'},
  {id:'melted',     label:'سايح',        mode:'flow',    sub:'سايح'},
  {id:'notfresh',   label:'غير طازج او فريش', mode:'flow',sub:'غير طازج غير فريش'},
  {id:'appliances', label:'أجهزة منزلية', mode:'instant', sub:'أجهزة منزلية'},
  {id:'hotfood',    label:'هوت فوود',    mode:'hotfood'},
  {id:'broken',     label:'مكسور/مدهوس/مفتوح', mode:'flow', sub:'مكسور/ مدهوس / مفتوح'},
  {id:'salty',      label:'ملح زائد',    mode:'flow',    sub:'ملح زائد', fishGate:true},
  {id:'expired',    label:'منتهي الصلاحية', mode:'flow',  sub:'منتهي الصلاحية'},
];
function pqTicket(c){ return (c.mode==='hotfood') ? 'Complaint–HotFood - Product Quality' : `Complaint – Product Quality – ${c.sub}`; }
function replacementOrderLine(){ return 'عمل طلب جديد بنفس الكمية في الطلب الاساسي.'; }

function buildPQ(){
  state.type = 'pq'; state.suppressCD = false; deriveComplaintFields();
  resetStatePart('pq');
  clear(questionsEl); resetRequired(); show(qaCard,true);

  const wrap = document.createElement('div');
  wrap.className='case-grid';
  PQ_CASES.forEach(c=>{
    const d=document.createElement('div');
    d.className='case';
    d.textContent = c.label;
    d.onclick=()=>selectPQCase(c, d);
    wrap.appendChild(d);
  });
  questionsEl.appendChild(wrap);
  renderMiniSummary();
}

function selectPQCase(c, node){
  document.querySelectorAll('.case').forEach(x=>x.classList.remove('active'));
  node.classList.add('active');
  const old = document.querySelector('.q-after-grid'); if(old) old.remove();
  resetRequired();
  wipe(state.pq, ['client','pay','product','withClient','rr']);
  state.pq.caseId    = c.id;
  state.pq.caseLabel = c.label;
  deriveComplaintFields(); renderMiniSummary();

  const holder = document.createElement('div');
  holder.className='q-after-grid';
  questionsEl.appendChild(holder);

  if(c.mode==='instant'){ addResult(pqTicket(c)); return; }
  if(c.mode==='hotfood'){ addResult(pqTicket(c)); return; }

  const qClient = radioQuestion({
    title:'نوع العميل :',
    name:'pqClient',
    options:[ {value:'branch',label:'عميل فرع'}, {value:'delivery',label:'عميل ديليفري'} ]
  });
  holder.appendChild(qClient);

  qClient.querySelectorAll('input[name="pqClient"]').forEach(r=>{
    r.onchange=()=>{
      pruneNextSiblings(qClient,'q-block'); resetRequired();
      wipe(state.pq,['pay','product','withClient','rr']);
      state.pq.client = (r.value==='branch')?'عميل فرع':'عميل ديليفري';
      deriveComplaintFields(); renderMiniSummary();

      // عميل فرع ⇒ لازم سؤال "هل المنتج متواجد؟"
      if(r.value==='branch'){
        withClientReturnReplacePQ(c, holder);
        return;
      }

      const qPay = radioQuestion({
        title:'هل طريقة الدفع',
        name:'pqPay',
        options:[ {value:'prepaid',label:'دفع مسبق "Online Payment "'}, {value:'cash',label:'كاش - فيزا'} ]
      });
      holder.appendChild(qPay);

      qPay.querySelectorAll('input[name="pqPay"]').forEach(pp=>{
        pp.onchange=()=>{
          pruneNextSiblings(qPay,'q-block'); resetRequired();
          wipe(state.pq,['product','withClient','rr']);
          state.pq.pay = (pp.value==='prepaid')?'دفع مسبق "Online Payment"':'كاش - فيزا';
          deriveComplaintFields(); renderMiniSummary();

          // ديليفري + دفع مسبق ⇒ لازم سؤال "هل المنتج متواجد؟"
          if(pp.value==='prepaid'){
            withClientReturnReplacePQ(c, holder);
            return;
          }

          if(c.fishGate){
            const qKind = radioQuestion({
              title:'هل المنتج:',
              name:'pqKind',
              options:[ {value:'fish',label:'سمك'}, {value:'other',label:'أي منتج آخر'} ]
            });
            holder.appendChild(qKind);

            qKind.querySelectorAll('input[name="pqKind"]').forEach(k=>{
              k.onchange=()=>{
                pruneNextSiblings(qKind,'q-block'); resetRequired();
                wipe(state.pq,['withClient','rr']);
                state.pq.product = (k.value==='fish')?'سمك':'أي منتج آخر';
                deriveComplaintFields(); renderMiniSummary();

                if(k.value==='fish'){ addResult(pqTicket(c)); }
                else { withClientReturnReplacePQ(c, holder); }
              };
            });
          }else{
            withClientReturnReplacePQ(c, holder);
          }
        };
      });
    };
  });

  renderMiniSummary();
}

function withClientReturnReplacePQ(caseObj, mount){
  const qWith = radioQuestion({
    title:'هل المنتج متواجد مع العميل؟',
    name:'pqWith',
    options:[ {value:'no',label:'لا'}, {value:'yes',label:'نعم'} ]
  });
  mount.appendChild(qWith);

  qWith.querySelectorAll('input[name="pqWith"]').forEach(w=>{
    w.onchange=()=>{
      pruneNextSiblings(qWith,'q-block'); resetRequired();
      wipe(state.pq,['rr']);
      state.pq.withClient = (w.value==='yes')?'نعم':'لا';
      deriveComplaintFields(); renderMiniSummary();

      if(w.value==='no'){ addResult(pqTicket(caseObj)); return; }

      const qRR = radioQuestion({
        title:'هل العميل يؤيد أسترجاع ام استبدال؟',
        name:'pqRR',
        options:[ {value:'return',label:'أسترجاع'}, {value:'replace',label:'أستبدال'} ]
      });
      mount.appendChild(qRR);

      qRR.querySelectorAll('input[name="pqRR"]').forEach(rr=>{
        rr.onchange=()=>{
          pruneNextSiblings(qRR,'q-block'); resetRequired();
          state.pq.rr = rr.value==='return'?'أسترجاع':'أستبدال';
          deriveComplaintFields(); renderMiniSummary();

          if(rr.value==='return'){
            addResult(pqTicket(caseObj));
          }else{
            addResult(replacementOrderLine());
            addResult('ترحيل موعد التوصيل فترة واحدة.');
            addResult('إضافة تعليق "خاص بشكوى".');
            addResult(`عمل تيكت شكوي  بالتصنيف ويتم أضافة PDF بالشكوي
${pqTicket(caseObj)}`);
          }
        };
      });
    };
  });
}

/* =========================
   عناصر مفقودة (Missing)
   ========================= */
function buildMissing(){
  state.type='missing'; state.suppressCD = false; deriveComplaintFields();
  resetStatePart('mi');
  clear(questionsEl); resetRequired(); show(qaCard,true);

  const q1 = radioQuestion({
    title:'نوع العميل :',
    name:'miClient',
    options:[ {value:'branch',label:'عميل فرع'}, {value:'delivery',label:'عميل ديليفري'} ]
  });
  questionsEl.appendChild(q1);

  q1.querySelectorAll('input[name="miClient"]').forEach(r=>{
    r.onchange=()=>{
      pruneNextSiblings(q1,'q-block'); resetRequired();
      wipe(state.mi,['pay','fish','inv','abd','source']);
      state.mi.client = r.value==='branch'?'عميل فرع':'عميل ديليفري';
      deriveComplaintFields(); renderMiniSummary();

      if(r.value==='branch'){ addResult('يتم عمل شكوى Complaint - Missing Item - Retail فقط.'); }
      else{
        const qInv = radioQuestion({
          title:'هل المنتج متحاسب عليه في الفاتورة؟',
          name:'miInv0',
          options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
        });
        questionsEl.appendChild(qInv);

        qInv.querySelectorAll('input[name="miInv0"]').forEach(inv0=>{
          inv0.onchange=()=>{
            pruneNextSiblings(qInv,'q-block'); resetRequired();
            wipe(state.mi,['pay','fish','abd','source']);
            state.mi.inv = inv0.value==='yes'?'نعم':'لا'; renderMiniSummary();

            if(inv0.value==='yes'){
              const qPay = radioQuestion({
                title:'هل طريقة الدفع',
                name:'miPay0',
                options:[ {value:'prepaid',label:'دفع مسبق "Online Payment"'}, {value:'cash',label:'كاش - فيزا'} ]
              });
              questionsEl.appendChild(qPay);

              qPay.querySelectorAll('input[name="miPay0"]').forEach(pp=>{
                pp.onchange=()=>{
                  pruneNextSiblings(qPay,'q-block'); resetRequired();
                  wipe(state.mi,['fish','abd','source']);
                  state.mi.pay = pp.value==='prepaid'?'دفع مسبق "Online Payment"':'كاش - فيزا'; 
                  deriveComplaintFields(); renderMiniSummary();

                  if(pp.value==='prepaid'){
                    addResult('شكوى Delivery – Complaint - Missing Item فقط.');
                  }else{
                    const qFish = radioQuestion({
                      title:'هل المنتج سمك؟',
                      name:'miFish',
                      options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
                    });
                    questionsEl.appendChild(qFish);

                    qFish.querySelectorAll('input[name="miFish"]').forEach(ff=>{
                      ff.onchange=()=>{
                        pruneNextSiblings(qFish,'q-block'); resetRequired();
                        state.mi.fish = ff.value==='yes'?'سمك':'ليس سمك'; 
                        deriveComplaintFields(); renderMiniSummary();

                        if(ff.value==='yes'){
                          addResult('شكوى Delivery – Complaint - Missing Item فقط.');
                        }else{
                          addResult('طلب جديد بالمفقود.');
                          addResult('ترحيل فترة واحدة.');
                          addResult('تعليق \'خاص بشكوى\'.');
                          addResult('تيكت: Complaint Missing Item - Delivery + PDF.');
                        }
                      };
                    });
                  }
                };
              });
            }else{
              const qPay2 = radioQuestion({
                title:'هل طريقة الدفع',
                name:'miPay1',
                options:[ {value:'prepaid',label:'دفع مسبق "Online Payment"'}, {value:'cash',label:'كاش - فيزا'} ]
              });
              questionsEl.appendChild(qPay2);

              qPay2.querySelectorAll('input[name="miPay1"]').forEach(pp2=>{
                pp2.onchange=()=>{
                  pruneNextSiblings(qPay2,'q-block'); resetRequired();
                  wipe(state.mi,['fish','abd','source']);
                  state.mi.pay = pp2.value==='prepaid'?'دفع مسبق "Online Payment"':'كاش - فيزا'; 
                  deriveComplaintFields(); renderMiniSummary();

                  if(pp2.value==='prepaid'){
                    const qABD1 = radioQuestion({
                      title:'مراجعة الماجينتو وتيكت الأدمن داش بورد:',
                      name:'miABD1',
                      options:[
                        {value:'deleted',    label:'تم الحذف من خلال قسم الأدمن داش بورد'},
                        {value:'notordered', label:'لم يكن المنتج مطلوب في الطلب الأصلي'},
                      ]
                    });
                    questionsEl.appendChild(qABD1);
                    qABD1.querySelectorAll('input[name="miABD1"]').forEach(ab=>{
                      ab.onchange=()=>{
                        pruneNextSiblings(qABD1,'q-block'); resetRequired();
                        state.mi.abd = ab.value==='deleted'?'تم الحذف من الأدمن':'لم يكن مطلوبًا'; 
                        deriveComplaintFields(); renderMiniSummary();

                        if(ab.value==='deleted'){
                          addResult('يتم عرض طلب جديد ببديل مناسب (New Order).');
                          addResult('وإذا رُفِض أو لا يوجد بديل: Follow Up Order.');
                        }else{
                          addResult('يتم التوضيح للعميل أن المنتج غير مطلوب بالطلب من الأساس (من التطبيق).');
                          addResult('يتم عرض طلب جديد بالمنتج الذي يريده (New Order).');
                          addResult('وإذا رُفِض أو لا يوجد بديل: Follow Up Order.');
                        }
                      };
                    });
                  }else{
                    const qSrc = radioQuestion({
                      title:'الطلب من:',
                      name:'miSrc',
                      options:[ {value:'app',label:'Application'}, {value:'ota',label:'OTA'} ]
                    });
                    questionsEl.appendChild(qSrc);

                    qSrc.querySelectorAll('input[name="miSrc"]').forEach(ss=>{
                      ss.onchange=()=>{
                        pruneNextSiblings(qSrc,'q-block'); resetRequired();
                        wipe(state.mi,['abd']);
                        state.mi.source = ss.value==='app' ? 'Application' : 'OTA';
                        deriveComplaintFields(); renderMiniSummary();

                        const qABD2 = radioQuestion({
                          title:'مراجعة الماجينتو وتيكت الأدمن داش بورد:',
                          name:'miABD2',
                          options:[
                            {value:'deleted',    label:'تم الحذف من خلال قسم الأدمن داش بورد'},
                            {value:'notordered', label:'لم يكن المنتج مطلوب في الطلب الأصلي'},
                          ]
                        });
                        questionsEl.appendChild(qABD2);

                        qABD2.querySelectorAll('input[name="miABD2"]').forEach(ab2=>{
                          ab2.onchange=()=>{
                            pruneNextSiblings(qABD2,'q-block'); resetRequired();
                            state.mi.abd = ab2.value==='deleted'?'تم الحذف من الأدمن':'لم يكن مطلوبًا'; 
                            deriveComplaintFields(); renderMiniSummary();

                            if(ss.value==='ota'){
                              if(ab2.value==='deleted'){
                                addResult('عرض طلب جديد ببديل مناسب (New Order). وإذا رُفِض أو لا يوجد بديل: Follow Up Order.');
                              }else{
                                addResult('طلب جديد بالمفقود.');
                                addResult('ترحيل فترة واحدة.');
                                addResult('تعليق \'خاص بشكوى\'.');
                                addResult('تيكت: Complaint Missing Item - CC + PDF.');
                              }
                            }else{
                              if(ab2.value==='deleted'){
                                addResult('يتم عرض طلب جديد ببديل مناسب (New Order).');
                                addResult('وإذا رُفِض أو لا يوجد بديل: Follow Up Order.');
                              }else{
                                addResult('يتم التوضيح للعميل أن المنتج غير مطلوب بالطلب من الأساس (من التطبيق).');
                                addResult('يتم عرض طلب جديد بالمنتج الذي يريده (New Order).');
                                addResult('وإذا رُفِض أو لا يوجد بديل: Follow Up Order.');
                              }
                            }
                          };
                        });
                      };
                    });
                  }
                };
              });
            }
          };
        });
      }
    };
  });

  renderMiniSummary();
}

/* =========================
   خطأ فردي (WT)
   ========================= */
function buildWT(){
  state.type='wt'; state.suppressCD=false; deriveComplaintFields();
  resetStatePart('wt');
  clear(questionsEl); resetRequired(); show(qaCard,true);

  const step = radioQuestion({
    title:'اختر الحالة:',
    name:'wtScenario',
    options:[
      {value:'less',   label:'الحالة الأولى (وصول منتج بكميات اقل من المطلوب)'},
      {value:'comment',label:'الحالة الثانية (عدم الالتزام بكومنت في الطلب)'},
    ]
  });
  questionsEl.appendChild(step);

  step.querySelectorAll('input[name="wtScenario"]').forEach(r=>{
    r.onchange=()=>{
      pruneNextSiblings(step,'q-block'); resetRequired();
      wipe(state.wt,['client','pay','kind','invoiced','abd','rr']);
      state.wt.scenario = (r.value==='less')?'الحالة الأولى (وصول منتج بكميات اقل من المطلوب)':'الحالة الثانية (عدم الالتزام بكومنت في الطلب)';
      state.suppressCD = false;
      deriveComplaintFields(); renderMiniSummary();

      if(r.value==='less'){
        const qClient = radioQuestion({
          title:'نوع العميل :',
          name:'wtClient',
          options:[ {value:'branch',label:'عميل فرع'}, {value:'delivery',label:'عميل ديليفري'} ]
        });
        questionsEl.appendChild(qClient);

        qClient.querySelectorAll('input[name="wtClient"]').forEach(c=>{
          c.onchange=()=>{
            pruneNextSiblings(qClient,'q-block'); resetRequired();
            wipe(state.wt,['pay','kind','invoiced','abd','rr']);
            state.wt.client = (c.value==='branch')?'عميل فرع':'عميل ديليفري';
            state.suppressCD = false;
            deriveComplaintFields(); renderMiniSummary();

            if(c.value==='branch'){ addResult('Complaint Wrong Transaction – chef – less quantity يتم عمل شكوي'); return; }

            const qPay = radioQuestion({
              title:'هل طريقة الدفع',
              name:'wtPay',
              options:[ {value:'prepaid',label:'دفع مسبق "Online Payment "'}, {value:'cash',label:'كاش - فيزا'} ]
            });
            questionsEl.appendChild(qPay);

            qPay.querySelectorAll('input[name="wtPay"]').forEach(pp=>{
              pp.onchange=()=>{
                pruneNextSiblings(qPay,'q-block'); resetRequired();
                wipe(state.wt,['kind','invoiced','abd','rr']);
                state.wt.pay = (pp.value==='prepaid')?'دفع مسبق "Online Payment"':'كاش - فيزا';
                state.suppressCD = false;
                deriveComplaintFields(); renderMiniSummary();

                if(pp.value==='prepaid'){
                  const qKindP = radioQuestion({
                    title:'هل المنتج',
                    name:'wtKindP',
                    options:[
                      {value:'fish', label:'سمك'},
                      {value:'meat', label:'لحوم – جبن  بالوزن - دواجن'},
                      {value:'other',label:'منتجات أخري'}
                    ]
                  });
                  questionsEl.appendChild(qKindP);

                  qKindP.querySelectorAll('input[name="wtKindP"]').forEach(k=>{
                    k.onchange=()=>{
                      pruneNextSiblings(qKindP,'q-block'); resetRequired();
                      wipe(state.wt,['invoiced','abd','rr']);
                      state.wt.kind = (k.value==='fish')?'سمك':(k.value==='meat'?'لحوم – جبن  بالوزن - دواجن':'منتجات أخرى');
                      state.suppressCD = false;
                      deriveComplaintFields(); renderMiniSummary();

                      if(k.value==='fish'){
                        const qInvFish = radioQuestion({
                          title:'هل تم المحاسبة في الفاتورة على الكمية كاملة؟',
                          name:'wtInvFishP',
                          options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
                        });
                        questionsEl.appendChild(qInvFish);
                        qInvFish.querySelectorAll('input[name="wtInvFishP"]').forEach(inv=>{
                          inv.onchange=()=>{
                            pruneNextSiblings(qInvFish,'q-block'); resetRequired();
                            state.wt.invoiced = inv.value==='yes'?'نعم':'لا'; 
                            state.suppressCD = false;
                            deriveComplaintFields(); renderMiniSummary();
                            addResult('Complaint Wrong Transaction – chef – less quantity يتم عمل شكوي');
                          };
                        });
                      }else if(k.value==='meat'){
                        addResult('Complaint Wrong Transaction – chef – less quantity يتم عمل شكوي');
                      }else{
                        addResult('Complaint Wrong Transaction – Picker –Less Quantity يتم عمل شكوي');
                      }
                    };
                  });
                  return;
                }

                const qKindC = radioQuestion({
                  title:'هل منتج:',
                  name:'wtKindC',
                  options:[
                    {value:'fish', label:'سمك'},
                    {value:'meat', label:'لحوم / دواجن – جبن بالوزن'},
                    {value:'other',label:'منتجات أخري'}
                  ]
                });
                questionsEl.appendChild(qKindC);

                qKindC.querySelectorAll('input[name="wtKindC"]').forEach(k=>{
                  k.onchange=()=>{
                    pruneNextSiblings(qKindC,'q-block'); resetRequired();
                    wipe(state.wt,['invoiced','abd','rr']);
                    state.wt.kind = (k.value==='fish')?'سمك':(k.value==='meat'?'لحوم / دواجن – جبن بالوزن':'منتجات أخرى');
                    state.suppressCD = false;
                    deriveComplaintFields(); renderMiniSummary();

                    if(k.value==='fish'){
                      const qInvFishC = radioQuestion({
                        title:'هل تم المحاسبة في الفاتورة على الكمية كاملة؟',
                        name:'wtInvFishC',
                        options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
                      });
                      questionsEl.appendChild(qInvFishC);
                      qInvFishC.querySelectorAll('input[name="wtInvFishC"]').forEach(inv=>{
                        inv.onchange=()=>{
                          pruneNextSiblings(qInvFishC,'q-block'); resetRequired();
                          state.wt.invoiced = inv.value==='yes'?'نعم':'لا'; 
                          state.suppressCD = false;
                          deriveComplaintFields(); renderMiniSummary();
                          addResult('Complaint Wrong Transaction – chef – less quantity يتم عمل شكوي');
                        };
                      });
                      return;
                    }

                    if(k.value==='meat'){
                      const qInvMeat = radioQuestion({
                        title:'هل تم المحاسبة في الفاتورة على الكمية كاملة؟',
                        name:'wtInvMeat',
                        options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
                      });
                      questionsEl.appendChild(qInvMeat);

                      qInvMeat.querySelectorAll('input[name="wtInvMeat"]').forEach(inv=>{
                        inv.onchange=()=>{
                          pruneNextSiblings(qInvMeat,'q-block'); resetRequired();
                          wipe(state.wt,['abd','rr']);
                          state.wt.invoiced = inv.value==='yes'?'نعم':'لا'; 
                          state.suppressCD = false;
                          deriveComplaintFields(); renderMiniSummary();

                          if(inv.value==='yes'){
                            addResult('عمل طلب جديد بباقي الكمية.');
                            addResult('ترحيل موعد التوصيل فترة واحدة.');
                            addResult('إضافة تعليق "خاص بشكوى".');
                            addResult('Complaint Wrong Transaction – Chef – عدم الالتزام بالوزنة');
                            addResult('يتم إضافة PDF بالشكوى.');
                          }else{
                            const qABDMeat = radioQuestion({
                              title:'اختر الحالة:',
                              name:'wtABDMeat',
                              options:[
                                {value:'partial',  label:'الحالة الاولي : يتم مراجعة الماجينتو وتيكت الأدمن داش بورد للتأكد من ما اذا كان تم أرسال الكمية المتاحة لعدم توافر كامل الكمية'},
                                {value:'nochange', label:'الحالة الثانية : لا يوجد اي تعديل علي المنتج و الكمية من خلال الABD'}
                              ]
                            });
                            questionsEl.appendChild(qABDMeat);

                            qABDMeat.querySelectorAll('input[name="wtABDMeat"]').forEach(a=>{
                              a.onchange=()=>{
                                pruneNextSiblings(qABDMeat,'q-block'); resetRequired();
                                state.wt.abd = a.value==='partial'?'تم إرسال الكمية المتاحة':'لا يوجد تعديل من ABD'; 
                                state.suppressCD = false;
                                deriveComplaintFields(); renderMiniSummary();

                                if(a.value==='partial'){
                                  addResult('عرض طلب جديد ببديل مناسب (New Order).');
                                }else{
                                  addResult('عمل طلب جديد بباقي الكمية.');
                                  addResult('ترحيل موعد التوصيل فترة واحدة.');
                                  addResult('إضافة تعليق "خاص بشكوى".');
                                  addResult('Complaint Wrong Transaction – Chef –عدم الالتزام بالوزن');
                                  addResult('يتم إضافة PDF بالشكوى.');
                                }
                              };
                            });
                          }
                        };
                      });
                      return;
                    }

                    // منتجات أخرى + كاش (Less) — هنا عندنا حالة خاصة تحت لو "لا" + الحالة الأولى ⇒ suppress
                    const qInvOther = radioQuestion({
                      title:'هل تم المحاسبة في الفاتورة على الكمية كاملة؟',
                      name:'wtInvOther',
                      options:[ {value:'yes',label:'نعم'}, {value:'no',label:'لا'} ]
                    });
                    questionsEl.appendChild(qInvOther);

                    qInvOther.querySelectorAll('input[name="wtInvOther"]').forEach(inv=>{
                      inv.onchange=()=>{
                        pruneNextSiblings(qInvOther,'q-block'); resetRequired();
                        wipe(state.wt,['abd','rr']);
                        state.wt.invoiced = inv.value==='yes'?'نعم':'لا'; 
                        state.suppressCD = false;
                        deriveComplaintFields(); renderMiniSummary();

                        if(inv.value==='yes'){
                          addResult('عمل طلب جديد بباقي الكمية.');
                          addResult('ترحيل موعد التوصيل فترة واحدة.');
                          addResult('إضافة تعليق "خاص بشكوى".');
                          addResult('Complaint Wrong Transaction – Picker –Less Quantity');
                          addResult('يتم إضافة PDF بالشكوى.');
                        }else{
                          const qABDOther = radioQuestion({
                            title:'اختر الحالة:',
                            name:'wtABDOther',
                            options:[
                              {value:'partial',  label:'الحالة الاولي : يتم مراجعة الماجينتو وتيكت الأدمن داش بورد للتأكد من ما اذا كان تم أرسال الكمية المتاحة لعدم توافر كامل الكمية'},
                              {value:'nochange', label:'الحالة الثانية : لا يوجد اي تعديل علي المنتج و الكمية من خلال الABD'}
                            ]
                          });
                          questionsEl.appendChild(qABDOther);

                          qABDOther.querySelectorAll('input[name="wtABDOther"]').forEach(a=>{
                            a.onchange=()=>{
                              pruneNextSiblings(qABDOther,'q-block'); resetRequired();
                              state.wt.abd = a.value==='partial'?'تم إرسال الكمية المتاحة':'لا يوجد تعديل من ABD';

                              // الحالة الخاصة المطلوبة: Less + Delivery + Cash + Other + Invoiced=No + ABD=partial
                              if(state.wt.scenario.includes('وصول منتج بكميات') &&
                                 state.wt.client === 'عميل ديليفري' &&
                                 state.wt.pay === 'كاش - فيزا' &&
                                 state.wt.kind === 'منتجات أخرى' &&
                                 state.wt.invoiced === 'لا' &&
                                 a.value==='partial'){
                                state.suppressCD = true;       // لا نكتب بيانات شكوى
                              }else{
                                state.suppressCD = false;
                              }

                              deriveComplaintFields(); renderMiniSummary();

                              if(a.value==='partial'){
                                addResult('عرض طلب جديد ببديل مناسب (New Order).'); // فقط طلب جديد — بدون تيكت
                              }else{
                                addResult('عمل طلب جديد بباقي الكمية.');
                                addResult('ترحيل موعد التوصيل فترة واحدة.');
                                addResult('إضافة تعليق "خاص بشكوى".');
                                addResult('Complaint Wrong Transaction – Picker –Less Quantity');
                                addResult('يتم إضافة PDF بالشكوى.');
                              }
                            };
                          });
                        }
                      };
                    });
                  };
                });
              };
            });
          };
        });
        return;
      }

      // الحالة الثانية (عدم الالتزام بكومنت)
      const qClient2 = radioQuestion({
        title:'نوع العميل :',
        name:'wtCClient',
        options:[ {value:'branch',label:'عميل فرع'}, {value:'delivery',label:'عميل ديليفري'} ]
      });
      questionsEl.appendChild(qClient2);

      qClient2.querySelectorAll('input[name="wtCClient"]').forEach(c=>{
        c.onchange=()=>{
          pruneNextSiblings(qClient2,'q-block'); resetRequired();
          wipe(state.wt,['pay','kind','invoiced','abd','rr']);
          state.wt.client = (c.value==='branch')?'عميل فرع':'عميل ديليفري';
          state.suppressCD = false;
          deriveComplaintFields(); renderMiniSummary();

          if(c.value==='branch'){ addResult('Complaint Wrong Transaction – chef –  عدم الالتزام بكومنت'); return; }

          const qPay2 = radioQuestion({
            title:'هل طريقة الدفع',
            name:'wtCPay',
            options:[ {value:'prepaid',label:'دفع مسبق "Online Payment "'}, {value:'cash',label:'كاش - فيزا'} ]
          });
          questionsEl.appendChild(qPay2);

          qPay2.querySelectorAll('input[name="wtCPay"]').forEach(pp=>{
            pp.onchange=()=>{
              pruneNextSiblings(qPay2,'q-block'); resetRequired();
              wipe(state.wt,['kind','invoiced','abd','rr']);
              state.wt.pay = (pp.value==='prepaid')?'دفع مسبق "Online Payment"':'كاش - فيزا';
              state.suppressCD = false;
              deriveComplaintFields(); renderMiniSummary();

              if(pp.value==='prepaid'){
                const qKindCP = radioQuestion({
                  title:'هل المنتج',
                  name:'wtKindCP',
                  options:[
                    {value:'fish', label:'سمك'},
                    {value:'meat', label:'لحوم / دواجن – جبن  بالوزن'},
                    {value:'other',label:'منتجات أخري'}
                  ]
                });
                questionsEl.appendChild(qKindCP);

                qKindCP.querySelectorAll('input[name="wtKindCP"]').forEach(k=>{
                  k.onchange=()=>{
                    pruneNextSiblings(qKindCP,'q-block'); resetRequired();
                    wipe(state.wt,['rr','invoiced','abd']);
                    state.wt.kind = (k.value==='fish')?'سمك':(k.value==='meat'?'لحوم / دواجن – جبن  بالوزن':'منتجات أخرى');
                    state.suppressCD = false;
                    deriveComplaintFields(); renderMiniSummary();

                    if(k.value==='fish'){ addResult('Complaint Wrong Transaction – chef –  عدم الالتزام بكومنت'); }
                    else if(k.value==='meat'){ addResult('Complaint Wrong Transaction – chef –  عدم الالتزام بكومنت'); }
                    else{ addResult('Complaint Wrong Transaction – Picker –عدم الالتزام بكومنت'); }
                  };
                });
                return;
              }

              const qKindCC = radioQuestion({
                title:'هل منتج:',
                name:'wtKindCC',
                options:[
                  {value:'fish', label:'سمك'},
                  {value:'meat', label:'لحوم – جبن بالوزن'},
                  {value:'other',label:'منتجات أخري'}
                ]
              });
              questionsEl.appendChild(qKindCC);

              qKindCC.querySelectorAll('input[name="wtKindCC"]').forEach(k=>{
                k.onchange=()=>{
                  pruneNextSiblings(qKindCC,'q-block'); resetRequired();
                  wipe(state.wt,['rr','invoiced','abd']);
                  state.wt.kind = (k.value==='fish')?'سمك':(k.value==='meat'?'لحوم – جبن بالوزن':'منتجات أخرى');
                  state.suppressCD = false;
                  deriveComplaintFields(); renderMiniSummary();

                  if(k.value==='fish'){ addResult('Complaint Wrong Transaction – chef –  عدم الالتزام بكومنت'); return; }

                  if(k.value==='meat'){
                    const qRRMeat = radioQuestion({
                      title:'هل تريد استرجاع ام استبدال المنتج؟',
                      name:'wtCRRMeat',
                      options:[ {value:'return',label:'أسترجاع فقط'}, {value:'replace',label:'أستبدال'} ]
                    });
                    questionsEl.appendChild(qRRMeat);

                    qRRMeat.querySelectorAll('input[name="wtCRRMeat"]').forEach(rr=>{
                      rr.onchange=()=>{
                        pruneNextSiblings(qRRMeat,'q-block'); resetRequired();
                        state.wt.rr = rr.value==='return'?'أسترجاع فقط':'أستبدال'; 
                        state.suppressCD = false;
                        deriveComplaintFields(); renderMiniSummary();

                        if(rr.value==='return'){
                          addResult('Complaint Wrong Transaction – Chef – عدم الالتزام بكومنت');
                        }else{
                          addResult('عمل طلب جديد بالمنتج.');
                          addResult('ترحيل موعد التوصيل فترة واحدة.');
                          addResult('إضافة تعليق "خاص بشكوى".');
                          addResult('Complaint Wrong Transaction – Chef –عدم الالتزام بكومنت');
                          addResult('يتم إضافة PDF بالشكوى.');
                        }
                      };
                    });
                    return;
                  }

                  const qRROther = radioQuestion({
                    title:'هل تريد استرجاع ام استبدال المنتج؟',
                    name:'wtCRROther',
                    options:[ {value:'return',label:'أسترجاع فقط'}, {value:'replace',label:'أستبدال'} ]
                  });
                  questionsEl.appendChild(qRROther);

                  qRROther.querySelectorAll('input[name="wtCRROther"]').forEach(rr=>{
                    rr.onchange=()=>{
                      pruneNextSiblings(qRROther,'q-block'); resetRequired();
                      state.wt.rr = rr.value==='return'?'أسترجاع فقط':'أستبدال'; 
                      state.suppressCD = false;
                      deriveComplaintFields(); renderMiniSummary();

                      if(rr.value==='return'){
                        addResult('Complaint Wrong Transaction – Picker –عدم الالتزام بكومنت');
                      }else{
                        addResult('عمل طلب جديد بباقي الكمية.');
                        addResult('ترحيل موعد التوصيل فترة واحدة.');
                        addResult('إضافة تعليق "خاص بشكوى".');
                        addResult('Complaint Wrong Transaction – Picker –عدم الالتزام بكومنت');
                        addResult('يتم إضافة PDF بالشكوى.');
                      }
                    };
                  });
                };
              });
            };
          });
        };
      });
    };
  });

  renderMiniSummary();
}

/* =========================
   إنهاء الشكوى + Reset
   ========================= */
function clearComplaintInputs(){
  const el = document.getElementById('otherNotes');
  if(el){ el.value=''; el.classList.remove('invalid'); }
  ['cdMobile','cdOrderCreated','cdOrderNumber','cdTransaction','cdSubCategory','cdItem','cdCustomerType','cdWithClient'].forEach(id=>{
    const e = document.getElementById(id); if(e){ e.value=''; e.classList.remove('invalid'); }
  });
  document.getElementById('cdStoreSelect')?.classList.remove('invalid');
  document.querySelectorAll('input[name="cdPolicy"]').forEach(r=>{ r.checked = false; r.parentElement.classList.remove('invalid'); });
}
function resetAll(){
  state.type=null;
  state.suppressCD=false;
  resetStatePart('pq'); resetStatePart('mi'); resetStatePart('wt'); resetStatePart('cd');
  clear(questionsEl); resetRequired();

  document.querySelectorAll('input[name="ctype"]').forEach(r=>{ r.checked = false; });
  document.querySelectorAll('.case.active').forEach(x=>x.classList.remove('active'));

  if(qaCard) show(qaCard,false);
  const summaryCard = document.getElementById('summaryCard');
  if(summaryCard) show(summaryCard,false);

  const bar = document.querySelector('#qaProgress .bar');
  if(bar) bar.style.width='0%';

  renderMiniSummary();
}

/* =========================
   التحكم العام في اختيار نوع الشكوى
   ========================= */
document.querySelectorAll('input[name="ctype"]').forEach(input=>{
  input.addEventListener('change', (e)=>{
    clear(questionsEl); resetRequired();
    resetStatePart('pq'); resetStatePart('mi'); resetStatePart('wt'); resetStatePart('cd');
    state.suppressCD=false;

    const v = e.target.value;
    if(v==='pq')      buildPQ();
    else if(v==='missing') buildMissing();
    else if(v==='wt') buildWT();

    state.type = v; deriveComplaintFields(); renderMiniSummary();
  });
});
document.addEventListener('change', (e)=>{
  const t = e.target;
  if(!t || t.name!=='ctype') return;
  clear(questionsEl); resetRequired();
  resetStatePart('pq'); resetStatePart('mi'); resetStatePart('wt'); resetStatePart('cd');
  state.suppressCD=false;

  const v = t.value;
  if(v==='pq')      buildPQ();
  else if(v==='missing') buildMissing();
  else if(v==='wt') buildWT();

  state.type = v; deriveComplaintFields(); renderMiniSummary();
});

/* =========================
   Binding لبيانات الشكوى
   ========================= */
(function hookComplaintDataInputs(){
  const set = (id, setter, numeric=false) => {
    const el = document.getElementById(id);
    if(!el) return;
    const handler = ()=>{
      let v = el.value.trim();
      if(numeric) v = onlyDigits(v);
      setter(v);
      if(numeric && el.type !== 'number') el.value = v; // لمدخلات التليفون
      renderMiniSummary();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  };

  set('cdMobile',       v=> state.cd.mobile = v, true);
  set('cdOrderCreated', v=> state.cd.orderCreated = v, true);
  set('cdOrderNumber',  v=> state.cd.orderNumber  = v, true);
  set('cdTransaction',  v=> state.cd.transaction  = v, true);

  const sel = document.getElementById('cdStoreSelect');
  sel && sel.addEventListener('change', ()=>{ state.cd.store = sel.value.trim(); renderMiniSummary(); });

  document.querySelectorAll('input[name="cdPolicy"]').forEach(r=>{
    r.addEventListener('change', ()=>{ state.cd.policy = r.value; renderMiniSummary(); });
  });
})();

/* =========================
   أزرار الخلاصة
   ========================= */
btnEnd && btnEnd.addEventListener('click', ()=>{
  if(confirm('هل أنت متأكد أنك تريد إنهاء الشكوى؟')) resetAll();
});

btnCopy && btnCopy.addEventListener('click', async()=>{
  deriveComplaintFields();
  const missing = highlightMissingComplaintData();
  if(missing.length){
    const names = missing.map(m=> m[0]).join('، ');
    showToast(`برجاء استكمال بيانات الشكوى: ${names}`, 'error');
    return;
  }
  try{
    const text = buildCopyText();
    if(!text?.trim()){ showToast('الخلاصة فارغة حاليًا.', 'error'); return; }
    await navigator.clipboard.writeText(text);
    showToast('تم نسخ الخلاصة بنجاح ✅', 'success');
  }catch{ showToast('تعذّر نسخ الخلاصة.', 'error'); }
});

btnSave && btnSave.addEventListener('click', ()=>{
  deriveComplaintFields();
  const missing = highlightMissingComplaintData();
  if(missing.length){
    const names = missing.map(m=> m[0]).join('، ');
    showToast(`لا يمكن حفظ المسودة — استكمل: ${names}`, 'error');
    return;
  }
  if(!confirm('هل تريد حفظ المسودة كمسودة؟')) return;
  saveCurrentDraft();
});

/* ============ UI Enhancements: Progress + Theme ============ */
(function(){
  const root = document.body;
  document.querySelectorAll('.swatch[data-swatch]').forEach(s=>{
    const savedBrand = localStorage.getItem('brand');
    if (savedBrand) root.setAttribute('data-brand', savedBrand);
    s.addEventListener('click', ()=>{
      const v = s.getAttribute('data-swatch');
      root.setAttribute('data-brand', v === 'green' ? '' : v);
      if (v === 'green') localStorage.removeItem('brand');
      else localStorage.setItem('brand', v);
    });
  });

  const card = document.getElementById('qaCard');
  function ensureProgressEl(){
    if (!card) return null;
    let p = card.querySelector('#qaProgress');
    if (!p){
      const frag = document.createElement('div');
      frag.className = 'thin-progress';
      frag.id = 'qaProgress';
      frag.innerHTML = '<div class="bar"></div>';
      card.prepend(frag); p = frag;
    }
    return p;
  }
  function computeProgress(){
    if (!card) return;
    const p = ensureProgressEl(); if (!p) return;
    const blocks = Array.from(card.querySelectorAll('.q-block'));
    if (!blocks.length){ p.querySelector('.bar').style.width = '0%'; return; }
    let answered = 0;
    blocks.forEach(b=>{
      const anyChecked = b.querySelector('input[type="radio"]:checked, input[type="checkbox"]:checked, select option:checked');
      const anyFilled  = Array.from(b.querySelectorAll('input[type="text"], textarea')).some(el => el.value && el.value.trim());
      if (anyChecked || anyFilled) answered++;
    });
    const percent = Math.round((answered / blocks.length) * 100);
    p.querySelector('.bar').style.width = percent + '%';
  }
  if (card){
    ensureProgressEl();
    card.addEventListener('change', computeProgress);
    card.addEventListener('input', computeProgress);
    setTimeout(computeProgress, 300);
  }
})();

/* =========================
   Drafts
   ========================= */
function readDrafts(){ try{ return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); } catch{ return []; } }
function writeDrafts(list){ try{ localStorage.setItem(DRAFTS_KEY, JSON.stringify(list)); }catch{} }
function formatTS(ts){
  try{ return new Date(ts).toLocaleString('en-GB', { dateStyle:'short', timeStyle:'short' }); }
  catch{ return ts; }
}
function currentResultsArray(){
  return [...(requiredEl?.querySelectorAll('.result')||[])].map(el=>el.textContent.trim()).filter(Boolean);
}
function saveCurrentDraft(){
  const data = {
    id: 'DR_'+Date.now(),
    ts: Date.now(),
    customer: state.cd.mobile || '',
    fields: {
      otherNotes: FIELDS.otherNotes(),
      cd: {...state.cd}
    },
    type: state.type,
    state: JSON.parse(JSON.stringify(state)),
    required: currentResultsArray(),
    brand: document.body.getAttribute('data-brand') || ''
  };
  const list = readDrafts(); list.push(data); writeDrafts(list);
  renderDrafts(); showToast('تم حفظ المسودة ✅', 'success');
}
function openDraftInNewTab(id){
  try{
    const url = new URL(window.location.href);
    url.searchParams.set('draft', id);
    window.open(url.toString(), '_blank');
  }catch{}
}
function deleteDraft(id){
  if(!confirm('هل تريد حذف هذه المسودة؟')) return;
  writeDrafts(readDrafts().filter(d=>d.id!==id));
  renderDrafts(draftsSearch?.value?.trim()||'');
}
function renderDrafts(filter=''){
  if(!draftsListEl) return;
  const list = readDrafts().sort((a,b)=>b.ts - a.ts).filter(d=> !filter || (d.customer||'').includes(filter));
  draftsListEl.innerHTML = '';
  if(!list.length){
    const li = document.createElement('div');
    li.className='draft-empty';
    li.textContent='لا توجد مسودات بعد.';
    draftsListEl.appendChild(li);
    return;
  }
  list.forEach(d=>{
    const li = document.createElement('li');
    li.className='draft-item';
    li.innerHTML = `
      <div class="draft-top">
        <a class="draft-link" href="javascript:void(0)">${esc(d.customer || 'بدون رقم')}</a>
        <span class="draft-meta">${formatTS(d.ts)}</span>
      </div>
      <div class="draft-actions">
        <button class="draft-del">حذف</button>
      </div>`;
    li.querySelector('.draft-link').addEventListener('click', ()=>openDraftInNewTab(d.id));
    li.querySelector('.draft-del').addEventListener('click', ()=>deleteDraft(d.id));
    draftsListEl.appendChild(li);
  });
}
draftsToggle && draftsToggle.addEventListener('click', ()=> draftsSidebar?.classList.toggle('collapsed'));
draftsSearch && draftsSearch.addEventListener('input', ()=> renderDrafts(draftsSearch.value.trim()));

/* تحميل مسودة من ?draft= */
function loadDraftByIdFromURL(){
  try{
    const id = new URLSearchParams(window.location.search).get('draft'); if(!id) return;
    const d = readDrafts().find(x=>x.id===id);
    if(!d){ showToast('لم يتم العثور على هذه المسودة.', 'error'); return; }

    resetAll();

    const el = document.getElementById('otherNotes');
    if(el) el.value = d.fields?.otherNotes ?? '';

    if(d.fields?.cd){
      state.cd = {...state.cd, ...d.fields.cd};
      const set = (id,val)=>{ const e=document.getElementById(id); if(e) e.value = val||''; };
      set('cdMobile', state.cd.mobile);
      set('cdOrderCreated', state.cd.orderCreated);
      set('cdOrderNumber', state.cd.orderNumber);
      set('cdTransaction', state.cd.transaction);
      const sel = document.getElementById('cdStoreSelect');
      sel && (sel.value = state.cd.store||'');
      if(state.cd.policy){
        const r = document.querySelector(`input[name="cdPolicy"][value="${state.cd.policy}"]`);
        if(r) r.checked = true;
      }
      deriveComplaintFields();
    }

    state.type = d.type || null;
    if(d.state){
      state.pq  = d.state.pq  || state.pq;
      state.mi  = d.state.mi  || state.mi;
      state.wt  = d.state.wt  || state.wt;
      state.suppressCD = !!d.state.suppressCD;
    }

    resetRequired();
    (d.required||[]).forEach(txt=> addResult(txt));
    renderMiniSummary();
    showToast('تم فتح المسودة — يمكنك المتابعة أو التعديل.', 'success');
  }catch{}
}

/* تحديث الخلاصة أثناء الكتابة */
(function hookLiveNotes(){
  const el = document.getElementById('otherNotes');
  if(!el) return;
  const handler = ()=>{ renderMiniSummary(); };
  el.addEventListener('input', handler);
  el.addEventListener('change', handler);
})();

/* تهيئة */
renderDrafts();
loadDraftByIdFromURL();
const btnCreateZoho = document.getElementById('createZohoTicketBtn');

function buildZohoPayloadFromTool(){
  // 1) موضوع الشكوى
  const subject =
    'Seoudi Complaint – ' + (state.type === 'pq' ? 'Product Quality'
      : state.type === 'missing' ? 'Missing Item'
      : state.type === 'wt' ? 'Wrong Transaction'
      : state.type === 'delay' ? 'Delivery Lateness'
      : 'General');

  // 2) وصف مختصر (خُلاصة مختصرة من الخطوات + الملاحظات)
  const description = (function(){
    const reqs = [...(document.querySelectorAll('#summary .result')||[])].map(el=>el.textContent.trim()).filter(Boolean);
    const notes = FIELDS.otherNotes();
    const lines = [];
    if (notes) lines.push('Notes: ' + notes);
    if (state.type) lines.push('Type: ' + (state.type));
    if (reqs.length){ lines.push('Required:\n- ' + reqs.join('\n- ')); }
    return lines.join('\n');
  })();

  // 3) الحقول الرئيسية المطلوبة
  const categoryName    = state.cd?.subCategory || '';   // مثال: Product Quality / Missing Item ...
  const subcategoryName = state.cd?.item || '';          // مثال: عفن / فاسد / ... إلخ
  const itemName        = state.cd?.item || '';          // هنرسلها جوه customFields.cf_item

  // 4) ايميل العميل (لو مش عندك دلوقتي ابعتي placeholder)
  const requesterEmail = 'customer@example.com';

  // 5) أي حقول إضافية عايزاها تتخزن في Zoho (اختياري)
  const extras = {
    // أمثلة: هنخزنها كـ custom fields لو كنتِ عرفتيها في Zoho
    // cf_order_number: FIELDS.cdOrderNumber(),
    // cf_store:        FIELDS.cdStoreSelect() || FIELDS.cdStoreText(),
    // cf_policy:       FIELDS.cdPolicy(),
    // cf_mobile:       FIELDS.cdMobile(),
  };

  return {
    subject,
    description,
    requesterEmail,
    statusName: 'Open',
    categoryName,
    subcategoryName,
    itemName,
    extras
  };
}

btnCreateZoho && btnCreateZoho.addEventListener('click', async ()=>{
  // تقدري هنا تعملي نفس فحوصات الإلزامية اللي بتعمليها للحفظ/النسخ
  try{
    const payload = buildZohoPayloadFromTool();
    const resp = await fetch('/api/zoho/create-ticket', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json().catch(()=> ({}));
    if(!resp.ok){
      showToast('فشل إنشاء الشكوى على زوهو. راجعي الإعدادات.', 'error');
      console.error('Zoho create error:', data);
      return;
    }
    showToast('تم إنشاء الشكوى على زوهو بنجاح ✅', 'success');
    // ممكن تعملي resetAll() لو حابة
  }catch(err){
    console.error(err);
    showToast('حصل خطأ غير متوقع أثناء الإنشاء.', 'error');
  }
});
/* Haq Patra intake: read documents on the phone, remove private details, match keywords, and ask the free AI helper. */
(function(){
"use strict";
var R = window.HAQ_RULES;

/* ---------- load libraries only when needed ---------- */
var PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
var PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
var TESS = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
var loaded = {};
function loadScript(src){
  if(loaded[src]) return loaded[src];
  loaded[src] = new Promise(function(res,rej){ var s=document.createElement("script"); s.src=src; s.async=true; s.onload=res; s.onerror=function(){ delete loaded[src]; rej(new Error("load "+src)); }; document.head.appendChild(s); });
  return loaded[src];
}

async function pdfText(file, onProgress){
  await loadScript(PDFJS);
  var lib = window.pdfjsLib; lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  var buf = await file.arrayBuffer();
  var doc = await lib.getDocument({data:buf}).promise;
  var n = Math.min(doc.numPages, 6), out = [];
  for(var i=1;i<=n;i++){
    var page = await doc.getPage(i); var tc = await page.getTextContent();
    var line = [], lastY = null;
    tc.items.forEach(function(it){ var y = it.transform ? Math.round(it.transform[5]) : null; if(lastY!==null && y!==null && Math.abs(y-lastY)>3){ out.push(line.join(" ")); line=[]; } line.push(it.str); lastY = y; });
    out.push(line.join(" "));
    if(onProgress) onProgress(Math.round(i/n*100));
  }
  var text = out.join("\n").replace(/[ \t]+/g," ").trim();
  if(text.replace(/\s/g,"").length < 60){
    /* scanned PDF: render the first two pages and read them as images */
    var imgs = [];
    for(var p=1;p<=Math.min(doc.numPages,2);p++){
      var pg = await doc.getPage(p), vp = pg.getViewport({scale:2});
      var cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
      await pg.render({canvasContext:cv.getContext("2d"), viewport:vp}).promise; imgs.push(cv);
    }
    var t2 = [];
    for(var k=0;k<imgs.length;k++) t2.push(await ocr(imgs[k], onProgress));
    return t2.join("\n");
  }
  return text;
}

var worker = null;
async function ocr(image, onProgress){
  await loadScript(TESS);
  if(!worker){
    worker = await window.Tesseract.createWorker(["eng","hin"], 1, { logger:function(m){ if(onProgress && m && m.status==="recognizing text") onProgress(Math.round((m.progress||0)*100)); } });
  }
  var r = await worker.recognize(image);
  return (r && r.data && r.data.text) || "";
}

async function readFile(file, onProgress){
  var name = (file.name||"").toLowerCase();
  if(file.type==="application/pdf" || /\.pdf$/.test(name)) return pdfText(file, onProgress);
  if(/^image\//.test(file.type) || /\.(png|jpe?g|webp|heic)$/.test(name)) return ocr(file, onProgress);
  if(/^text\//.test(file.type) || /\.txt$/.test(name)) return file.text();
  throw new Error("unsupported");
}

/* ---------- remove private details before anything leaves the phone ---------- */
var MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
function redact(text){
  var t = String(text||"");
  t = t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]");
  t = t.replace(/\b[A-Z]{5}[0-9]{4}[A-Z]\b/g, "[id]");
  t = t.replace(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g, "[id]");
  t = t.replace(/(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, "[phone]");
  t = t.replace(/\b\d{9,}\b/g, "[number]");
  t = t.replace(/\b(?=[A-Za-z0-9\/-]*\d)(?=[A-Za-z0-9\/-]*[A-Za-z])[A-Za-z0-9\/-]{6,}\b/g, function(tok){
    if(new RegExp("^\\d{1,2}[-/]?("+MONTHS+")[a-z]*[-/]?\\d{2,4}$","i").test(tok)) return tok;
    if(/^(\d{1,4}(st|nd|rd|th))$/i.test(tok)) return tok;
    if(/^(T\+\d+|COVID-?19|ICU|OPD|IPD|RB-IOS|IRDAI|UPI|IMPS|NEFT|RTGS|ATM|PED)$/i.test(tok)) return tok;
    return "[ref]";
  });
  t = t.replace(/\b(Mr|Mrs|Ms|Miss|Shri|Smt|Kumari|Kum|Dr|Master|Baby)\.?\s+([A-Z][A-Za-z.]*)(\s+[A-Z][A-Za-z.]*){0,3}/g, "$1 [name]");
  t = t.replace(/\b((?:Patient|Insured|Proposer|Policy\s*holder|Policyholder|Member|Customer|Account\s*holder|Name)(?:'s)?\s*(?:Name)?\s*[:\-]\s*)([^\n,;]{2,60})/gi, "$1[name]");
  t = t.replace(/\b(Dear)\s+([A-Z][A-Za-z.]*)(\s+[A-Z][A-Za-z.]*){0,3}/g, "$1 [name]");
  t = t.replace(/(श्रीमती|श्री|सुश्री|कुमारी|डॉ\.?|नाम\s*[:\-])\s*[^\s,।]+(\s+[^\s,।]+)?/g, "$1 [नाम]");
  return t;
}

/* ---------- keyword matching (works with no internet AI) ---------- */
var MON = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12};
function mkISO(y,m,d){ y=+y; if(y<100) y+=2000; m=+m; d=+d; if(!(y>1990&&y<2100&&m>=1&&m<=12&&d>=1&&d<=31)) return null; var dt=new Date(y,m-1,d); if(dt.getMonth()!==m-1) return null; return R.iso(dt); }
function findDates(text){
  var out=[], re=new RegExp("(\\d{4})-(\\d{1,2})-(\\d{1,2})|(\\d{1,2})[\\/.\\-](\\d{1,2})[\\/.\\-](\\d{2,4})|(\\d{1,2})(?:st|nd|rd|th)?[\\s\\-]*("+MONTHS+")[a-z]*\\.?[\\s,\\-]*(\\d{4})|("+MONTHS+")[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})","gi"), m;
  while((m=re.exec(text))){
    var d=null;
    if(m[1]) d=mkISO(m[1],m[2],m[3]);
    else if(m[4]) d=mkISO(m[6],m[5],m[4]);
    else if(m[7]) d=mkISO(m[9],MON[m[8].toLowerCase()],m[7]);
    else if(m[10]) d=mkISO(m[12],MON[m[10].toLowerCase()],m[11]);
    if(d) out.push({iso:d,i:m.index});
  }
  return out;
}
function dateNear(text, dates, re){
  var m, best=null; re.lastIndex=0;
  while((m=re.exec(text))){ for(var k=0;k<dates.length;k++){ var dd=dates[k].i-m.index; if(dd>=0&&dd<90&&(!best||dd<best.dd)) best={dd:dd,iso:dates[k].iso}; } if(!re.global) break; }
  return best?best.iso:null;
}
function findAmounts(text){
  var out=[], re=/(?:₹|rs\.?|inr|रु\.?|रुपये)\s*([0-9][0-9,]*(?:\.\d{1,2})?)(?:\s*(lakh|lac|लाख))?|([0-9][0-9,]*(?:\.\d{1,2})?)\s*(?:\/-|rupees|रुपये)/gi, m;
  while((m=re.exec(text))){ var n=parseFloat((m[1]||m[3]).replace(/,/g,"")); if(m[2]) n*=100000; if(n>=1&&n<1e9) out.push({n:Math.round(n),i:m.index}); }
  return out;
}
function amountNear(text, amts, re){
  var m=re.exec(text); if(!m) return null; var best=null;
  amts.forEach(function(a){ var dd=a.i-m.index; if(dd>=0&&dd<120&&(!best||dd<best.dd)) best={dd:dd,n:a.n}; });
  return best?best.n:null;
}
function matchAlias(text, list){
  var low=" "+text.toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]+/g," ")+" ", best=null;
  list.forEach(function(x){ [x.name].concat(x.aliases||[]).forEach(function(a){ var k=" "+String(a).toLowerCase().replace(/[^a-z0-9ऀ-ॿ ]+/g," ").replace(/\s+/g," ").trim()+" "; if(k.length>3&&low.indexOf(k)>=0&&(!best||k.length>best.len)) best={id:x.id,len:k.length}; }); });
  return best?best.id:null;
}
function keywords(text){
  var t=String(text||""), f={}, found={};
  var hs=(t.match(/insur|policy|claim|hospital|\bTPA\b|repudiat|cashless|बीमा|दावा|अस्पताल|पॉलिसी/gi)||[]).length;
  var bs=(t.match(/\bUPI\b|\bIMPS\b|\bNEFT\b|\bATM\b|debited|bank|account|card|\bUTR\b|बैंक|खाता|कार्ड/gi)||[]).length;
  var mod = hs===0&&bs===0 ? null : (hs>=bs?"health":"bank");
  if(/insur|बीमा/i.test(t)&&hs>0) mod="health";
  var C=R.contacts();
  if(mod==="health"){
    var hasPed=/pre[-\s]?existing|\bPED\b|पहले से (मौजूद|चली)/i.test(t), hasND=/non[-\s]?disclosure|mis[-\s]?represent|conceal|suppress(ion)?\s+of\s+(material\s+)?fact|जानकारी\s+(छिपा|नहीं\s+दी)/i.test(t);
    var r=null;
    if(hasND) r="nondisclosure"; else if(hasPed) r="ped";
    else if(/waiting\s+period|प्रतीक्षा\s+अवधि/i.test(t)) r="waiting";
    else if(/room\s*rent|proportionate|आनुपातिक|कमरे\s+का\s+किराया/i.test(t)) r="roomrent";
    else if(/not\s+(medically\s+)?(necessary|required|justified|warranted)|\bOPD\b|out[-\s]?patient|could\s+(have\s+)?be(en)?\s+(treated|managed)|भर्ती\s+(की\s+)?(आवश्यकता|ज़रूरत)\s+नहीं/i.test(t)) r="notnecessary";
    else if(/document|non[-\s]?submission|query\s+(was\s+)?not\s+(replied|answered|complied)|दस्तावेज़|कागज़/i.test(t)) r="documents";
    else if(!/reject|repudiat|denied|not\s+payable|अस्वीकार/i.test(t)&&/pending|not\s+(yet\s+)?settled|delay|लंबित|देरी/i.test(t)) r="delay";
    if(r){ f.reason=r; found.reason=1; }
    var ins=matchAlias(t,C.insurers); if(ins){ f.insurer=ins; found.insurer=1; }
    var dates=findDates(t), amts=findAmounts(t);
    var adm=dateNear(t,dates,/date\s+of\s+admission|\bDOA\b|admitted\s+on|admission\s+date|भर्ती\s+की\s+तारीख/gi); if(adm){ f.admit=adm; found.admit=1; }
    var dis=dateNear(t,dates,/date\s+of\s+discharge|\bDOD\b|discharged\s+on|discharge\s+date|छुट्टी/gi); if(dis){ f.discharge=dis; found.discharge=1; }
    var cov=dateNear(t,dates,/first\s+inception|inception\s+date|continuous(ly)?\s+(insured|cover(ed|age)?)\s+since|policy\s+(start|commencement)\s+date|date\s+of\s+(first\s+)?enrol?ment|पहली\s+पॉलिसी/gi); if(cov){ f.coverStart=cov; found.coverStart=1; }
    var ld=dateNear(t,dates,/\bdate\s*[:\-]|dated|दिनांक/gi); if(!ld&&dates.length) ld=dates[0].iso; if(ld&&r!=="delay"){ f.rejDate=ld; found.rejDate=1; }
    var ca=amountNear(t,amts,/claim(ed)?\s+amount|amount\s+claimed|bill\s+amount|total\s+(bill|claim)|दावा\s+राशि/i);
    var pa=amountNear(t,amts,/(approved|settled|paid|payable|sanctioned)\s+amount|amount\s+(approved|settled|paid|payable)|स्वीकृत\s+राशि/i);
    if(!ca&&amts.length) ca=amts.reduce(function(a,b){ return b.n>a?b.n:a; },0);
    if(ca){ f.claimAmt=String(ca); found.claimAmt=1; } if(pa!==null&&pa!==undefined){ f.paidAmt=String(pa); found.paidAmt=1; }
    if(r&&/reject|repudiat|denied|not\s+payable|अस्वीकार/i.test(t)&&!pa&&r!=="roomrent"){ f.paidAmt="0"; found.paidAmt=1; }
    var pm=/policy\s*(?:no\.?|number|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{4,})/i.exec(t); if(pm){ f.policyNo=pm[1]; }
    var cm=/(?:claim|ccn|\bAL)\s*(?:no\.?|number|id|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\/\-]{3,})/i.exec(t); if(cm){ f.claimNo=cm[1]; }
    var pn=/patient(?:'s)?\s*name\s*[:\-]\s*([A-Za-z .]{3,40})/i.exec(t); if(pn){ f.patient=pn[1].trim(); }
    var hn=/hospital\s*(?:name)?\s*[:\-]\s*([^\n,]{3,60})/i.exec(t); if(hn){ f.hospital=hn[1].trim(); }
  }
  if(mod==="bank"){
    if(/fraud|unauthori[sz]ed|not\s+(done|made|authori[sz]ed)\s+by\s+me|did\s+not\s+(make|do)|scam|hack|धोखा|फ्रॉड|ठगी/i.test(t)){ f.issue="unauth"; found.issue=1; }
    else if(/failed|not\s+(credited|received|reached)|debited\s+but|pending|reversal|अटक|वापस\s+नहीं|नहीं\s+पहुँचा/i.test(t)){ f.issue="failed"; found.issue=1; }
    if(/\bATM\b/i.test(t)) f.channel="atm"; else if(/\bIMPS\b/i.test(t)) f.channel="imps";
    else if(/\bUPI\b|phonepe|google\s*pay|gpay|paytm|bhim/i.test(t)) f.channel=/merchant|shop|store|order|website|दुकान/i.test(t)?"upi_merchant":"upi_p2p";
    else if(/card/i.test(t)) f.channel=/online|website|e-?commerce|app/i.test(t)?"card_online":"card_pos";
    if(f.channel) found.channel=1;
    var bk=matchAlias(t,C.banks.concat(C.upi||[])); if(bk){ f.bank=bk; found.bank=1; }
    var ds=findDates(t); if(ds.length){ f.txnDate=ds[0].iso; found.txnDate=1; }
    var am=findAmounts(t); if(am.length){ f.amount=String(am[0].n); found.amount=1; }
    var utr=/(?:UTR|RRN|reference|ref\.?)\s*(?:no\.?|number|id)?\s*[:\-]?\s*(\d{12})/i.exec(t); if(utr) f.txnRef=utr[1];
  }
  return {mod:mod, f:f, found:found};
}

/* ---------- the free AI helper (Cloudflare Workers AI through /api/analyze) ---------- */
var REASONS=["ped","nondisclosure","waiting","roomrent","notnecessary","documents","delay","other"];
var ISSUES=["failed","unauth","other"], CHANNELS=["upi_p2p","upi_merchant","imps","atm","card_pos","card_online"];
function okDate(s){ return /^\d{4}-\d{2}-\d{2}$/.test(s||"")&&R.pd(s)?s:null; }
function okNum(n){ n=+n; return isFinite(n)&&n>0&&n<1e9?String(Math.round(n)):null; }
async function askAI(text, lang, hint){
  var ctl = typeof AbortController!=="undefined" ? new AbortController() : null;
  var timer = ctl ? setTimeout(function(){ ctl.abort(); }, 30000) : null;
  try{
    var res = await fetch("/api/analyze", {method:"POST", headers:{"content-type":"application/json"}, body:JSON.stringify({text:text, lang:lang, hint:hint||null}), signal: ctl?ctl.signal:undefined});
    if(!res.ok) return null;
    var j = await res.json();
    return j && j.ok ? j.result : null;
  }catch(e){ return null; }
  finally{ if(timer) clearTimeout(timer); }
}
var BAD=/(ignore|disregard|forget)\b.{0,40}\b(instruction|prompt|rule|above|previous)|system prompt|\byou are (an? )?(ai|assistant|model|chatbot)\b|as an ai\b|<\/?[a-z]|```|https?:\/\/|www\.|\bclick\b|\bcall (me|us)\b/i;
function cleanSummary(x){
  if(typeof x!=="string") return null;
  var t=x.replace(/[\u2014\u2013]/g,",").replace(/[\r\n\t]+/g," ").replace(/\s{2,}/g," ").trim();
  t=t.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"").replace(/\b\d{9,}\b/g,"");
  var parts=t.match(/[^.!?।]+[.!?।]?/g)||[];
  var out=parts.map(function(p){return p.trim();}).filter(function(p){ return p&&!BAD.test(p); }).join(" ").trim();
  if(out.length>600) out=out.slice(0,600).replace(/\s+\S*$/,"")+"...";
  return out.length>=10?out:null;
}
function fromAI(a){
  var f={}, found={}, mod=null; if(!a) return {mod:null,f:f,found:found,summary:null};
  if(a.module==="health"||a.module==="bank"||a.module==="other") mod=a.module;
  var C=R.contacts();
  if(mod==="health"){
    if(REASONS.indexOf(a.reason)>=0){ f.reason=a.reason; found.reason=1; }
    if(a.insurer_name){ var ins=matchAlias(a.insurer_name, C.insurers); if(ins){ f.insurer=ins; found.insurer=1; } }
    var d=a.dates||{};
    [["rejection","rejDate"],["admission","admit"],["discharge","discharge"],["policy_start","coverStart"]].forEach(function(p){ var x=okDate(d[p[0]]); if(x){ f[p[1]]=x; found[p[1]]=1; } });
    var am=a.amounts||{}; var c1=okNum(am.claimed); if(c1){ f.claimAmt=c1; found.claimAmt=1; }
    if(am.paid===0||am.paid==="0"){ f.paidAmt="0"; found.paidAmt=1; } else { var p1=okNum(am.paid); if(p1){ f.paidAmt=p1; found.paidAmt=1; } }
    if(a.complained_already===true){ f.grievance="yes"; }
  }
  if(mod==="bank"){
    if(ISSUES.indexOf(a.issue)>=0){ f.issue=a.issue; found.issue=1; }
    if(CHANNELS.indexOf(a.channel)>=0){ f.channel=a.channel; found.channel=1; }
    if(a.bank_name){ var bk=matchAlias(a.bank_name, C.banks.concat(C.upi||[])); if(bk){ f.bank=bk; found.bank=1; } }
    var d2=a.dates||{}; var tx=okDate(d2.transaction); if(tx){ f.txnDate=tx; found.txnDate=1; }
    var rp=okDate(d2.reported); if(rp){ f.reported=rp; }
    var am2=a.amounts||{}; var t1=okNum(am2.transaction); if(t1){ f.amount=t1; found.amount=1; }
    if(a.complained_already===true){ f.complained="yes"; }
  }
  var summary = cleanSummary(a.summary);
  return {mod:mod,f:f,found:found,summary:summary};
}

/* Merge: labelled keyword matches win for numbers and dates, the AI wins for the kind of problem. */
async function analyse(text, opts){
  opts=opts||{};
  var kw = keywords(text);
  var red = redact(text);
  var ai = null, used = "keywords";
  if(opts.useAI){ var a = await askAI(red, opts.lang||"en", kw.mod); if(a){ ai = fromAI(a); used = "ai"; } }
  var mod = (ai&&ai.mod) || kw.mod || null;
  var f = {}, found = {};
  function put(src){ Object.keys(src.f).forEach(function(k){ if(f[k]===undefined){ f[k]=src.f[k]; if(src.found[k]) found[k]=1; } }); }
  if(ai && ai.mod===mod){
    ["reason","issue","channel"].forEach(function(k){ if(ai.f[k]!==undefined){ f[k]=ai.f[k]; found[k]=1; } });
  }
  if(kw.mod===mod) put(kw);
  if(ai && ai.mod===mod) put(ai);
  return {mod:mod, f:f, found:found, summary: ai?ai.summary:null, used:used, redacted:red};
}

window.HAQ_INTAKE={readFile:readFile, redact:redact, keywords:keywords, analyse:analyse, findDates:findDates, findAmounts:findAmounts};
})();

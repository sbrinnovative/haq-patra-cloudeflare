/* Haq Patra app: screens, guided questions, results. */
(function(){
"use strict";
var R=window.HAQ_RULES, IN=window.HAQ_INTAKE, I18N=window.HAQ_I18N;
var LANGS=[["en","English"],["hi","हिंदी"],["mr","मराठी"],["bn","বাংলা"],["ta","தமிழ்"],["te","తెలుగు"],["gu","ગુજરાતી"],["kn","ಕನ್ನಡ"]];
var VOICE={en:"en-IN",hi:"hi-IN",mr:"mr-IN",bn:"bn-IN",ta:"ta-IN",te:"te-IN",gu:"gu-IN",kn:"kn-IN"};
var FONT={bn:"Noto+Sans+Bengali:wght@400;600&family=Baloo+Da+2:wght@700",ta:"Noto+Sans+Tamil:wght@400;600&family=Baloo+Thambi+2:wght@700",te:"Noto+Sans+Telugu:wght@400;600&family=Baloo+Tammudu+2:wght@700",gu:"Noto+Sans+Gujarati:wght@400;600&family=Baloo+Bhai+2:wght@700",kn:"Noto+Sans+Kannada:wght@400;600&family=Baloo+Tamma+2:wght@700"};
var ICON={words:'<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 9h8M8 12.5h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',upload:'<path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 17v-6m-3 3l3-3 3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',questions:'<path d="M10 6h10M10 12h10M10 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5.3" cy="18" r="1.6" fill="currentColor"/>',go:'<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',tick:'<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',phone:'<path d="M6.6 3h3l1.6 4.4-2.2 1.4a11 11 0 0 0 6.2 6.2l1.4-2.2L21 14.4v3A2.6 2.6 0 0 1 18.4 20 15.4 15.4 0 0 1 4 5.6 2.6 2.6 0 0 1 6.6 3z" fill="currentColor"/>'};
function svg(n,cls){ return '<svg viewBox="0 0 24 24" aria-hidden="true"'+(cls?' class="'+cls+'"':'')+'>'+ICON[n]+'</svg>'; }
var STATES=["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

/* ---------- state ---------- */
var S={lang:"en",helper:false,mod:null,f:{},found:{},view:"home",qi:0,summary:null,used:null,letterLang:"en",tab:-1,trans:null,showOrig:false,fromAnalysis:false};
function save(){ try{ sessionStorage.setItem("haq_state",JSON.stringify(S)); }catch(e){} }
function restore(){ try{ var x=JSON.parse(sessionStorage.getItem("haq_state")||"null"); if(x&&typeof x==="object") Object.keys(x).forEach(function(k){ S[k]=x[k]; }); }catch(e){} }
function initLang(){ var l=null; try{ l=localStorage.getItem("haq_lang"); }catch(e){} if(!l){ var n=(navigator.language||"en").slice(0,2); l=LANGS.some(function(x){return x[0]===n;})?n:"en"; } return l; }

/* ---------- helpers ---------- */
function t(k,vars){ var d=I18N[S.lang]||{}, s=d[k]; if(s===undefined) s=(I18N.en||{})[k]; if(s===undefined) s=k; if(vars) Object.keys(vars).forEach(function(v){ s=s.split("{"+v+"}").join(vars[v]); }); return s; }
function rl(){ return S.lang==="hi"?"hi":"en"; } /* language of rule text */
function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); }
function $(sel,root){ return (root||document).querySelector(sel); }
function el(html){ var d=document.createElement("div"); d.innerHTML=html; return d.firstElementChild; }
var app;
function render(){ save(); var fn=VIEWS[S.view]||VIEWS.home; app.innerHTML=""; fn(); try{ window.scrollTo(0,0); }catch(e){} document.documentElement.lang=S.lang; stopSpeak(); }

function setLang(l){
  if(!I18N[l]){
    var s=document.createElement("script"); s.src="assets/i18n-"+l+".js?v=1a77250b";
    s.onload=function(){ setLang(I18N[l]?l:"en"); }; s.onerror=function(){ setLang("en"); };
    document.head.appendChild(s); return;
  }
  S.lang=l; S.trans=null; try{ localStorage.setItem("haq_lang",l); }catch(e){}
  if(FONT[l]&&!document.getElementById("font-"+l)){ var ln=document.createElement("link"); ln.id="font-"+l; ln.rel="stylesheet"; ln.href="https://fonts.googleapis.com/css2?family="+FONT[l]+"&display=swap"; document.head.appendChild(ln); }
  if(!S.letterLangSet) S.letterLang=(l==="hi"?"hi":"en");
  document.querySelectorAll("[data-i18n]").forEach(function(n){ n.textContent=t(n.getAttribute("data-i18n")); });
  var sel=$("#langSel"); if(sel) sel.value=l;
  render();
}

/* ---------- read aloud ---------- */
var speaking=false;
function canSpeak(){ return typeof window.speechSynthesis!=="undefined"; }
function stopSpeak(){ try{ if(canSpeak()) speechSynthesis.cancel(); }catch(e){} speaking=false; var b=$("#listenBtn"); if(b) b.textContent=t("listen"); }
function speak(text, langCode){
  if(!canSpeak()) return false;
  try{
    speechSynthesis.cancel();
    var u=new SpeechSynthesisUtterance(text); u.lang=VOICE[langCode]||"en-IN"; u.rate=0.95;
    var vs=speechSynthesis.getVoices()||[]; var best=vs.filter(function(v){ return (v.lang||"").toLowerCase().indexOf(u.lang.slice(0,2).toLowerCase())===0; })[0]; if(best) u.voice=best;
    u.onend=function(){ speaking=false; var b=$("#listenBtn"); if(b) b.textContent=t("listen"); };
    speechSynthesis.speak(u); speaking=true; return true;
  }catch(e){ return false; }
}
function listenButton(getText, langCode){
  if(!canSpeak()) return "";
  setTimeout(function(){ var b=$("#listenBtn"); if(!b) return; b.addEventListener("click",function(){ if(speaking){ stopSpeak(); return; } if(speak(getText(), langCode||S.lang)) b.textContent=t("stop"); }); },0);
  return '<button type="button" class="btn ghost small" id="listenBtn" aria-label="'+esc(t("listen"))+'">'+esc(t("listen"))+'</button>';
}

/* ---------- voice typing ---------- */
function micSupported(){ return !!(window.SpeechRecognition||window.webkitSpeechRecognition); }
var rec=null;
function startMic(textarea, btn){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition; if(!SR) return;
  if(rec){ try{ rec.stop(); }catch(e){} rec=null; btn.textContent=t("mic_start"); return; }
  rec=new SR(); rec.lang=VOICE[S.lang]||"en-IN"; rec.interimResults=false; rec.continuous=true;
  rec.onresult=function(e){ for(var i=e.resultIndex;i<e.results.length;i++){ if(e.results[i].isFinal){ textarea.value=(textarea.value?textarea.value+" ":"")+e.results[i][0].transcript; textarea.dispatchEvent(new Event("input")); } } };
  rec.onend=function(){ rec=null; btn.textContent=t("mic_start"); };
  rec.onerror=function(){ rec=null; btn.textContent=t("mic_start"); };
  try{ rec.start(); btn.textContent=t("mic_stop"); }catch(e){ rec=null; }
}

/* ---------- copy ---------- */
function copyText(text, statusEl, selectEl){
  function sel(){ if(!selectEl) return; var r=document.createRange(); r.selectNodeContents(selectEl); var s=window.getSelection(); s.removeAllRanges(); s.addRange(r); if(statusEl) statusEl.textContent=t("copy_select"); }
  try{ navigator.clipboard.writeText(text).then(function(){ if(statusEl) statusEl.textContent=t("copied"); },sel); }catch(e){ sel(); }
}

/* ---------- questions ---------- */
function show(q){ return !q.show || q.show(S.f); }
var HQ=[
  {id:"insurer",type:"insurer",req:true},
  {id:"reason",type:"choice",opts:["ped","nondisclosure","waiting","roomrent","notnecessary","documents","delay","other"],optKey:"r_",unknown:true,req:true,extra:{id:"otherReason",type:"textarea",when:function(f){return f.reason==="other";}}},
  {id:"rejDate",type:"date",unknown:true,req:true,show:function(f){return f.reason!=="delay";}},
  {id:"amounts",type:"group",fields:[{id:"claimAmt",type:"money"},{id:"paidAmt",type:"money"}],req:["claimAmt"]},
  {id:"coverStart",type:"date",unknown:true,req:true,show:function(f){return ["ped","nondisclosure","waiting","unknown"].indexOf(f.reason)>=0||!f.reason;}},
  {id:"disclosed",type:"choice",opts:["yes","no","unsure"],optKey:"disc_",req:true,show:function(f){return f.reason==="ped"||f.reason==="nondisclosure";}},
  {id:"diffBilling",type:"choice",opts:["no","yes","unsure"],optKey:"diff_",req:true,show:function(f){return f.reason==="roomrent";}},
  {id:"stay",type:"group",fields:[{id:"hospital",type:"text"},{id:"admit",type:"date"},{id:"discharge",type:"date"},{id:"patient",type:"text"}]},
  {id:"grievance",type:"choice",opts:["no","yes"],optKey:"grv_",req:true},
  {id:"grvDetails",type:"group",show:function(f){return f.grievance==="yes";},fields:[{id:"grievanceDate",type:"date"},{id:"reply",type:"select",opts:["none","rejected","partly","unsat"],optKey:"rep_"},{id:"replyDate",type:"date",when:function(f){return f.reply&&f.reply!=="none";}}],req:["grievanceDate"]},
  {id:"state",type:"state",req:true},
  {id:"details",type:"group",fields:[{id:"name",type:"text"},{id:"phone",type:"tel"},{id:"email",type:"email"},{id:"address",type:"text"},{id:"policyNo",type:"text"},{id:"claimNo",type:"text"},{id:"helperName",type:"text",when:function(){return S.helper;}},{id:"helperPhone",type:"tel",when:function(){return S.helper;}}]}
];
var BQ=[
  {id:"issue",type:"choice",opts:["failed","unauth","other"],optKey:"iss_",req:true},
  {id:"bank",type:"bank",req:true},
  {id:"channel",type:"choice",opts:["upi_p2p","upi_merchant","imps","atm","card_pos","card_online"],optKey:"ch_",unknown:true,req:true,show:function(f){return f.issue!=="other";}},
  {id:"txn",type:"group",show:function(f){return f.issue!=="other";},fields:[{id:"txnDate",type:"date"},{id:"amount",type:"money"},{id:"txnRef",type:"text"}],req:["txnDate","amount"]},
  {id:"fraud",type:"group",show:function(f){return f.issue==="unauth";},fields:[{id:"learnt",type:"date"},{id:"reported",type:"date"},{id:"shared",type:"select",opts:["no","yes","unsure"],optKey:"sh_"}]},
  {id:"otherDesc",type:"textarea",req:true,show:function(f){return f.issue==="other";}},
  {id:"complained",type:"choice",opts:["no","yes"],optKey:"cmp_",req:true},
  {id:"compDetails",type:"group",show:function(f){return f.complained==="yes";},fields:[{id:"complaintDate",type:"date"},{id:"bankRef",type:"text"},{id:"reply",type:"select",opts:["none","rejected","partly","unsat"],optKey:"rep_"},{id:"replyDate",type:"date",when:function(f){return f.reply&&f.reply!=="none";}}],req:["complaintDate"]},
  {id:"forum",type:"group",fields:[{id:"court",type:"select",opts:["no","yes"],optKey:"yn_"},{id:"advocate",type:"select",opts:["no","yes"],optKey:"adv_"}]},
  {id:"details",type:"group",fields:[{id:"name",type:"text"},{id:"phone",type:"tel"},{id:"email",type:"email"},{id:"address",type:"text"},{id:"acct4",type:"text",max:4},{id:"helperName",type:"text",when:function(){return S.helper;}},{id:"helperPhone",type:"tel",when:function(){return S.helper;}}]}
];
function qs(){ return (S.mod==="health"?HQ:BQ).filter(show); }
function answered(q){
  var f=S.f;
  if(q.type==="group"){ var r=q.req||[]; return r.every(function(k){ return f[k]!==undefined&&f[k]!==""; }); }
  return f[q.id]!==undefined&&f[q.id]!=="";
}
/* screens the user must still see: unanswered, or answered but not confirmed by the analysis */
function pending(){ return qs().filter(function(q){ if(!S.fromAnalysis) return true; if(!answered(q)) return true; if(q.type==="group") return !(q.req||[]).every(function(k){ return S.found[k]; }); return !S.found[q.id]; }); }

/* ---------- shared header / footer pieces ---------- */
function trustRow(){ return '<ul class="trust">'+["promise_free","promise_private","promise_noagent"].map(function(k){ return '<li>'+svg("tick")+esc(t(k))+'</li>'; }).join("")+'</ul>'; }
function postmark(){
  var d=R.today(), mon=["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][d.getMonth()];
  return '<div class="postmark" aria-hidden="true"><svg viewBox="0 0 120 120"><defs><path id="pmTop" d="M24 60a36 36 0 0 1 72 0"/><path id="pmBot" d="M13 60a47 47 0 0 0 94 0"/></defs>'+
    '<circle cx="60" cy="60" r="56" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="60" cy="60" r="33" fill="none" stroke="currentColor" stroke-width="2"/>'+
    '<text font-family="Baloo 2, sans-serif" font-weight="800" font-size="11.5" letter-spacing="2" fill="currentColor"><textPath href="#pmTop" startOffset="50%" text-anchor="middle">HAQ PATRA</textPath></text>'+
    '<text font-family="Baloo 2, Mukta, sans-serif" font-weight="700" font-size="12" fill="currentColor"><textPath href="#pmBot" startOffset="50%" text-anchor="middle">हक़ पत्र</textPath></text>'+
    '<text x="60" y="57" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="15" fill="currentColor">'+d.getDate()+' '+mon+'</text>'+
    '<text x="60" y="73" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="700" font-size="12" fill="currentColor">'+d.getFullYear()+'</text></svg></div>';
}
function backLink(to,label){ return '<button type="button" class="linkbtn back" data-go="'+to+'">← '+esc(label||t("back"))+'</button>'; }
function wireGo(root){ (root||app).querySelectorAll("[data-go]").forEach(function(b){ b.addEventListener("click",function(){ S.view=b.getAttribute("data-go"); render(); }); }); }

/* ---------- side column for wide screens ---------- */
function split(main, side){ return '<div class="split">'+main+'<aside class="side">'+side+'</aside></div>'; }
function nextSide(extra){
  return '<div class="side-card inland-lite"><h3>'+esc(t("side_next"))+'</h3><ol class="steps3">'+["side_s1","side_s2","side_s3"].map(function(k){ return '<li>'+esc(t(k))+'</li>'; }).join("")+'</ol></div>'+
    (extra?'<p class="side-tip">'+esc(extra)+'</p>':'')+trustRow();
}
function answersSide(cur){
  var rows="";
  qs().forEach(function(q){ if(q===cur) return;
    var ids=q.type==="group"?q.fields.filter(function(x){ return !x.when||x.when(S.f); }).map(function(x){return x.id;}):[q.id];
    ids.forEach(function(id){ var v=S.f[id]; if(v===undefined||v==="") return; rows+='<dt>'+esc(labelFor(id))+'</dt><dd>'+esc(valueText(id,v))+'</dd>'; });
  });
  return '<div class="side-card"><h3>'+esc(t("side_answers"))+'</h3>'+(rows?'<dl class="sofar">'+rows+'</dl>':'<p class="muted small">'+esc(t("side_none"))+'</p>')+'</div>';
}

/* ---------- VIEWS ---------- */
var VIEWS={};

VIEWS.home=function(){
  function opt(k){ return '<button type="button" class="start" data-start="'+k+'"><span class="ic">'+svg(k)+'</span><span><span class="start-t">'+esc(t("start_"+k+"_t"))+'</span><span class="start-d">'+esc(t("start_"+k+"_d"))+'</span></span>'+svg("go","go")+'</button>'; }
  var h='<div class="home"><div class="home-l"><div class="sos" role="note"><p><b>'+esc(t("urgent_title"))+'</b> '+esc(t("urgent_body"))+'</p><a class="call" href="tel:1930">'+svg("phone")+'1930</a></div>'+
    '<section class="hero"><h1>'+esc(t("tagline"))+'</h1>'+trustRow()+'</section><p class="lead">'+esc(t("sub"))+'</p></div>'+
    '<section class="inland" aria-labelledby="startH">'+postmark()+'<h2 id="startH">'+esc(t("home_q"))+'</h2><div class="starts">'+opt("words")+opt("upload")+opt("questions")+'</div>'+
    '<div class="helper"><label class="check-row"><input type="checkbox" id="helperChk"'+(S.helper?" checked":"")+'> <span>'+esc(t("helper_label"))+'</span></label>'+
    (S.helper?'<p class="note" style="margin-top:8px">'+esc(t("helper_note"))+'</p>':'')+'</div></section></div>';
  app.innerHTML=h;
  $("#helperChk").addEventListener("change",function(e){ S.helper=e.target.checked; render(); });
  app.querySelectorAll("[data-start]").forEach(function(b){ b.addEventListener("click",function(){
    var w=b.getAttribute("data-start"); S.f={}; S.found={}; S.summary=null; S.used=null; S.mod=null; S.qi=0; S.tab=-1; S.trans=null; S.fromAnalysis=false;
    S.view = w==="words"?"words":w==="upload"?"upload":"module"; render(); }); });
};

function consentBlock(){
  return '<fieldset class="consent"><label class="check-row"><input type="checkbox" id="useAI" checked> <span>'+esc(t("consent"))+'</span></label>'+
    '<label class="check-row"><input type="checkbox" id="adult" checked> <span>'+esc(t("age"))+'</span></label></fieldset>';
}
async function runAnalysis(text, statusEl, btn){
  var useAI=$("#useAI")&&$("#useAI").checked&&$("#adult")&&$("#adult").checked;
  btn.disabled=true; statusEl.textContent=t("analysing");
  var r=await IN.analyse(text,{useAI:useAI,lang:S.lang});
  btn.disabled=false;
  S.summary=r.summary; S.used=useAI?r.used:"keywords"; S.f=r.f; S.found=r.found; S.fromAnalysis=true; S.qi=0;
  if(!r.mod){ S.view="module"; S.notice=t("not_sure_kind"); render(); return; }
  S.mod=r.mod;
  if(r.mod==="other"){ S.view="other"; render(); return; }
  S.view="understood"; render();
}

VIEWS.words=function(){
  app.innerHTML='<section class="panel">'+backLink("home")+'<h2>'+esc(t("words_title"))+'</h2><p class="muted">'+esc(t("words_hint"))+'</p>'+
    '<label class="sr" for="story">'+esc(t("words_title"))+'</label><textarea id="story" rows="7" placeholder="'+esc(t("words_placeholder"))+'"></textarea>'+
    (micSupported()?'<div class="row"><button type="button" class="btn ghost" id="micBtn">'+esc(t("mic_start"))+'</button><span class="hint">'+esc(t("mic_note"))+'</span></div>':'')+
    consentBlock()+'<div class="row"><button type="button" class="btn" id="goBtn">'+esc(t("analyse_btn"))+'</button></div><p class="status" id="st" role="status" aria-live="polite"></p></section>';
  app.innerHTML=split(app.innerHTML, nextSide());
  wireGo(); var ta=$("#story");
  if(micSupported()) $("#micBtn").addEventListener("click",function(e){ startMic(ta,e.target); });
  $("#goBtn").addEventListener("click",function(e){ var v=ta.value.trim(); if(v.length<15){ $("#st").textContent=t("too_short"); return; } runAnalysis(v,$("#st"),e.target); });
};

VIEWS.upload=function(){
  app.innerHTML='<section class="panel">'+backLink("home")+'<h2>'+esc(t("upload_title"))+'</h2><p class="muted">'+esc(t("upload_hint"))+'</p>'+
    '<div class="drop">'+svg("upload")+'<label class="filebtn btn" for="file" style="align-self:center">'+esc(t("upload_choose"))+'</label><input type="file" id="file" accept="application/pdf,image/*,.txt" class="sr"><span class="hint">PDF, JPG, PNG</span></div>'+
    '<p class="status" id="st" role="status" aria-live="polite"></p><div id="after" hidden>'+
    '<h3>'+esc(t("review_text_title"))+'</h3><p class="muted">'+esc(t("review_text_hint"))+'</p><label class="sr" for="doc">'+esc(t("review_text_title"))+'</label><textarea id="doc" rows="10"></textarea>'+
    consentBlock()+'<div class="row"><button type="button" class="btn" id="goBtn">'+esc(t("analyse_btn"))+'</button></div></div></section>';
  app.innerHTML=split(app.innerHTML, nextSide(t("side_upload_tip")));
  wireGo(); var orig="";
  $("#file").addEventListener("change",async function(e){
    var file=e.target.files&&e.target.files[0]; if(!file) return;
    var st=$("#st"); st.textContent=t("reading_file"); $("#after").hidden=true;
    try{
      orig=await IN.readFile(file,function(p){ st.textContent=t("reading_progress",{p:p}); });
      if(!orig||orig.trim().length<10){ st.textContent=t("read_failed"); return; }
      $("#doc").value=IN.redact(orig); st.textContent=t("read_done"); $("#after").hidden=false;
    }catch(err){ st.textContent=t("read_failed"); }
  });
  $("#goBtn").addEventListener("click",function(e){
    var edited=$("#doc").value; if(edited.trim().length<10) return;
    /* keyword matching may use the original text on this phone (policy and claim numbers, names); only the edited, redacted text goes to the AI */
    var kwText = orig && IN.redact(orig)===edited ? orig : edited;
    var useAI=$("#useAI").checked&&$("#adult").checked; e.target.disabled=true; $("#st").textContent=t("analysing");
    var kw=IN.keywords(kwText);
    IN.analyse(edited,{useAI:useAI,lang:S.lang}).then(function(r){
      e.target.disabled=false;
      var f=r.f, found=r.found; Object.keys(kw.f).forEach(function(k){ if(f[k]===undefined||(kw.found[k]&&!found[k])){ f[k]=kw.f[k]; if(kw.found[k]) found[k]=1; } });
      S.summary=r.summary; S.used=useAI?r.used:"keywords"; S.f=f; S.found=found; S.fromAnalysis=true; S.qi=0; S.mod=r.mod||kw.mod;
      if(!S.mod){ S.view="module"; S.notice=t("not_sure_kind"); render(); return; }
      if(S.mod==="other"){ S.view="other"; render(); return; }
      S.view="understood"; render();
    });
  });
};

VIEWS.module=function(){
  var n=S.notice; S.notice=null;
  app.innerHTML='<section class="panel">'+backLink("home")+(n?'<p class="note">'+esc(n)+'</p>':'')+'<h2>'+esc(t("mod_title"))+'</h2><div class="choices">'+
    ["health","bank","other"].map(function(m){ return '<button type="button" class="choice" data-mod="'+m+'">'+esc(t("mod_"+m))+'</button>'; }).join("")+'</div></section>';
  wireGo();
  app.querySelectorAll("[data-mod]").forEach(function(b){ b.addEventListener("click",function(){ var m=b.getAttribute("data-mod"); if(m!==S.mod){ S.f={}; S.found={}; } S.mod=m; S.qi=0; S.view=m==="other"?"other":"wizard"; render(); }); });
};

VIEWS.understood=function(){
  var rows=summaryRows(true);
  app.innerHTML='<section class="panel"><h2>'+esc(t("understood_title"))+'</h2>'+
    '<p class="note">'+esc(S.used==="ai"?t("ai_done"):t("ai_fallback"))+'</p>'+
    (S.summary?'<div class="aisum"><p>'+esc(S.summary)+'</p>'+listenButton(function(){return S.summary;})+'</div>':'')+
    (rows?'<dl class="review">'+rows+'</dl>':'')+
    '<div class="row"><button type="button" class="btn" id="cont">'+esc(t("continue_check"))+'</button></div></section>';
  $("#cont").addEventListener("click",function(){ S.qi=0; S.view=pending().length?"wizard":"review"; render(); });
};

function labelFor(id){ return t("l_"+id); }
function valueText(id,val){
  if(val===undefined||val===null||val==="") return t("not_answered");
  if(val==="unknown") return t("dont_know");
  if(id==="insurer"){ var i=R.findInsurer(val); return i?i.name:(val==="other"?(S.f.insurerName||t("other_ins")):val); }
  if(id==="bank"){ var b=R.findBank(val); return b?b.name:(val==="other"?(S.f.bankName||t("other_bank")):val); }
  var map={reason:"r_",disclosed:"disc_",diffBilling:"diff_",grievance:"grv_",reply:"rep_",issue:"iss_",channel:"ch_",shared:"sh_",complained:"cmp_",court:"yn_",advocate:"adv_"};
  if(map[id]) return t(map[id]+val);
  if(/Date$|^admit$|^discharge$|^learnt$|^reported$|^coverStart$/.test(id)) return R.fd(R.pd(val),rl());
  if(/Amt$|^amount$/.test(id)) return R.rs(val);
  return val;
}
function summaryRows(onlyFound){
  var out="", all=qs();
  all.forEach(function(q){
    var ids=q.type==="group"?q.fields.filter(function(x){ return !x.when||x.when(S.f); }).map(function(x){return x.id;}):[q.id];
    ids.forEach(function(id){ if(onlyFound&&!S.found[id]) return; if(onlyFound&&(S.f[id]===undefined||S.f[id]==="")) return; out+='<dt>'+esc(labelFor(id))+'</dt><dd>'+esc(valueText(id,S.f[id]))+'</dd>'; });
  });
  return out;
}

/* one question per screen */
VIEWS.wizard=function(){
  var list=S.fromAnalysis?pending():qs();
  if(S.qi>=list.length){ S.view="review"; render(); return; }
  if(S.qi<0) S.qi=0;
  var q=list[S.qi], f=S.f;
  var h='<section class="panel q"><div class="progress"><span>'+esc(t("q_of",{n:S.qi+1,m:list.length}))+'</span><span class="bar"><i style="width:'+Math.round((S.qi)/list.length*100)+'%"></i></span></div>';
  if(S.helper) h+='<p class="note small">'+esc(t("helper_note"))+'</p>';
  h+='<h2 id="qh">'+esc(t("q_"+q.id))+'</h2>';
  var hint=I18N_has("h_"+q.id)?t("h_"+q.id):null;
  if(hint) h+='<details class="where"><summary>'+esc(t("where_find"))+'</summary><p>'+esc(hint)+'</p></details>';
  if(q.type==="choice"){
    h+='<div class="choices" role="radiogroup" aria-labelledby="qh">'+q.opts.map(function(o){ return '<button type="button" class="choice" role="radio" aria-checked="'+(f[q.id]===o)+'" data-v="'+o+'">'+esc(t(q.optKey+o))+'</button>'; }).join("")+
      (q.unknown?'<button type="button" class="choice dk" role="radio" aria-checked="'+(f[q.id]==="unknown")+'" data-v="unknown">'+esc(t("dont_know"))+'</button>':'')+'</div>';
    if(q.extra&&q.extra.when(f)) h+='<div class="field full"><label for="x_'+q.extra.id+'">'+esc(labelFor(q.extra.id))+'</label><textarea id="x_'+q.extra.id+'" data-k="'+q.extra.id+'" rows="3">'+esc(f[q.extra.id]||"")+'</textarea></div>';
  } else if(q.type==="date"){
    h+='<div class="field"><label for="x_'+q.id+'">'+esc(labelFor(q.id))+'</label><input type="date" id="x_'+q.id+'" data-k="'+q.id+'" value="'+esc(f[q.id]&&f[q.id]!=="unknown"?f[q.id]:"")+'" max="'+R.iso(R.today())+'"></div>';
    if(q.unknown) h+='<button type="button" class="choice dk" data-v="unknown" aria-pressed="'+(f[q.id]==="unknown")+'">'+esc(t("dont_know"))+'</button>';
  } else if(q.type==="textarea"){
    h+='<div class="field full"><label for="x_'+q.id+'">'+esc(labelFor(q.id))+'</label><textarea id="x_'+q.id+'" data-k="'+q.id+'" rows="4">'+esc(f[q.id]||"")+'</textarea></div>';
  } else if(q.type==="insurer"||q.type==="bank"){
    var C=R.contacts(), isIns=q.type==="insurer";
    var groups=isIns?[["grp_health",C.insurers.filter(function(x){return x.type==="standalone_health";})],["grp_general",C.insurers.filter(function(x){return x.type!=="standalone_health";})]]:[["grp_banks",C.banks],["grp_upi",C.upi||[]]];
    h+='<div class="field"><label for="x_'+q.id+'">'+esc(labelFor(q.id))+'</label><select id="x_'+q.id+'" data-k="'+q.id+'"><option value="">'+esc(t("choose"))+'</option>'+
      groups.map(function(g){ return '<optgroup label="'+esc(t(g[0]))+'">'+g[1].slice().sort(function(a,b){return a.name.localeCompare(b.name);}).map(function(x){ return '<option value="'+esc(x.id)+'"'+(f[q.id]===x.id?" selected":"")+'>'+esc(x.name)+'</option>'; }).join("")+'</optgroup>'; }).join("")+
      '<option value="other"'+(f[q.id]==="other"?" selected":"")+'>'+esc(t(isIns?"other_ins":"other_bank"))+'</option><option value="unknown"'+(f[q.id]==="unknown"?" selected":"")+'>'+esc(t("dont_know"))+'</option></select></div>'+
      '<div class="field" id="otherName"'+(f[q.id]==="other"?'':' hidden')+'><label for="x_'+(isIns?"insurerName":"bankName")+'">'+esc(t(isIns?"l_insurerName":"l_bankName"))+'</label><input type="text" id="x_'+(isIns?"insurerName":"bankName")+'" data-k="'+(isIns?"insurerName":"bankName")+'" value="'+esc(f[isIns?"insurerName":"bankName"]||"")+'"></div>';
  } else if(q.type==="state"){
    h+='<div class="field"><label for="x_state">'+esc(labelFor("state"))+'</label><select id="x_state" data-k="state"><option value="">'+esc(t("choose"))+'</option>'+STATES.map(function(s){ return '<option'+(f.state===s?" selected":"")+'>'+esc(s)+'</option>'; }).join("")+'<option value="unknown"'+(f.state==="unknown"?" selected":"")+'>'+esc(t("dont_know"))+'</option></select></div>';
  } else if(q.type==="group"){
    h+='<div class="grid">'+q.fields.filter(function(x){ return !x.when||x.when(f); }).map(fieldHTML).join("")+'</div>';
    if(q.id==="details") h+='<p class="muted small">'+esc(t("details_note"))+'</p>';
  }
  h+='<p class="status" id="st" role="status" aria-live="polite"></p><div class="row nav"><button type="button" class="btn ghost" id="prev">'+esc(t("back"))+'</button><button type="button" class="btn" id="next">'+esc(t("next"))+'</button></div></section>';
  app.innerHTML=split(h, answersSide(q));
  app.querySelectorAll("[data-k]").forEach(function(inp){ inp.addEventListener("input",onInput); inp.addEventListener("change",onInput); });
  function onInput(e){ var k=e.target.getAttribute("data-k"); S.f[k]=e.target.value; S.found[k]=1;
    if(k==="insurer"||k==="bank"){ var on=$("#otherName"); if(on) on.hidden=(e.target.value!=="other"); }
    if(k==="claimAmt"||k==="paidAmt"||k==="amount"){ var w=$("#w_"+k); if(w) w.textContent=R.words(e.target.value,rl()); }
    if(k==="reply"&&q.type==="group"){ save(); var keep=S.qi; render(); S.qi=keep; }
    save(); }
  app.querySelectorAll(".choice[data-v]").forEach(function(b){ b.addEventListener("click",function(){ S.f[q.id]=b.getAttribute("data-v"); S.found[q.id]=1; save();
    if(q.extra&&q.extra.when(S.f)){ render(); return; }
    if(q.type==="date"&&b.getAttribute("data-v")==="unknown"){ var di=$("#x_"+q.id); if(di) di.value=""; }
    advance(); }); });
  $("#prev").addEventListener("click",function(){ if(S.qi===0){ S.view=S.fromAnalysis?"understood":(S.mod?"module":"home"); } else S.qi--; render(); });
  $("#next").addEventListener("click",function(){
    if(q.req===true&&!answered(q)){ $("#st").textContent=t("need_answer"); return; }
    advance(); });
  function advance(){ S.qi++; render(); }
  var first=app.querySelector("input,select,textarea"); if(first&&q.type!=="choice") try{ first.focus({preventScroll:true}); }catch(e){}
};
function I18N_has(k){ return (I18N[S.lang]&&I18N[S.lang][k]!==undefined)||(I18N.en&&I18N.en[k]!==undefined); }
function fieldHTML(x){
  var v=S.f[x.id]||"", lab='<label for="x_'+x.id+'">'+esc(labelFor(x.id))+'</label>', hint=I18N_has("h_"+x.id)?'<span class="hint">'+esc(t("h_"+x.id))+'</span>':"";
  var inp;
  if(x.type==="select") inp='<select id="x_'+x.id+'" data-k="'+x.id+'"><option value="">'+esc(t("choose"))+'</option>'+x.opts.map(function(o){ return '<option value="'+o+'"'+(v===o?" selected":"")+'>'+esc(t(x.optKey+o))+'</option>'; }).join("")+'</select>';
  else if(x.type==="date") inp='<input type="date" id="x_'+x.id+'" data-k="'+x.id+'" value="'+esc(v==="unknown"?"":v)+'" max="'+R.iso(R.today())+'">';
  else if(x.type==="money") inp='<input type="number" inputmode="numeric" min="0" id="x_'+x.id+'" data-k="'+x.id+'" value="'+esc(v)+'"><span class="words" id="w_'+x.id+'">'+esc(R.words(v,rl()))+'</span>';
  else inp='<input type="'+(x.type==="tel"?"tel":x.type==="email"?"email":"text")+'" id="x_'+x.id+'" data-k="'+x.id+'" value="'+esc(v)+'"'+(x.max?' maxlength="'+x.max+'" inputmode="numeric"':'')+(x.type==="tel"?' autocomplete="tel"':x.type==="email"?' autocomplete="email"':x.id==="name"?' autocomplete="name"':'')+'>';
  return '<div class="field">'+lab+inp+hint+'</div>';
}

VIEWS.review=function(){
  var all=qs(), rows="";
  all.forEach(function(q,i){
    var ids=q.type==="group"?q.fields.filter(function(x){ return !x.when||x.when(S.f); }).map(function(x){return x.id;}):[q.id];
    ids.forEach(function(id){ rows+='<dt>'+esc(labelFor(id))+'</dt><dd>'+esc(valueText(id,S.f[id]))+' <button type="button" class="linkbtn small" data-edit="'+i+'">'+esc(t("change"))+'</button></dd>'; });
  });
  app.innerHTML='<section class="panel review-panel"><h2>'+esc(t("review_title"))+'</h2><dl class="review">'+rows+'</dl><div class="row nav"><button type="button" class="btn ghost" id="prev">'+esc(t("back"))+'</button><button type="button" class="btn" id="plan">'+esc(t("see_plan"))+'</button></div></section>';
  app.querySelectorAll("[data-edit]").forEach(function(b){ b.addEventListener("click",function(){ S.fromAnalysis=false; S.qi=+b.getAttribute("data-edit"); S.view="wizard"; render(); }); });
  $("#prev").addEventListener("click",function(){ var l=S.fromAnalysis?pending():qs(); S.qi=Math.max(0,l.length-1); S.view=l.length?"wizard":"understood"; render(); });
  $("#plan").addEventListener("click",function(){ S.tab=-1; S.trans=null; S.view="result"; render(); });
};

/* ---------- contacts cards ---------- */
function line(label,val,copy){ if(!val) return ""; return '<div class="cl"><span class="cl-l">'+esc(label)+'</span><span class="cl-v">'+esc(val)+'</span>'+(copy?'<button type="button" class="linkbtn small" data-copy="'+esc(val)+'">'+esc(t("copy"))+'</button>':'')+'</div>'; }
function linkLine(label,url){ if(!url) return ""; return '<div class="cl"><span class="cl-l">'+esc(label)+'</span><a class="cl-v" href="'+esc(url)+'" target="_blank" rel="noopener">'+esc(url.replace(/^https?:\/\//,""))+'</a></div>'; }
function card(step,title,body,checked){ return '<article class="ccard"><p class="cstep">'+esc(step)+'</p><h3>'+esc(title)+'</h3>'+body+(checked?'<p class="verified">'+esc(t("verified",{d:R.fd(R.pd(checked),rl())}))+'</p>':'')+'</article>'; }
function contactsHTML(p){
  var C=R.contacts(), N=C.national||{}, out=[], f=S.f;
  if(S.mod==="health"){
    var i=p.c.ins;
    if(i){ var g=i.gro||{};
      out.push(card(t("cstep_1"),i.name,line(t("c_officer"),g.name)+line(t("c_email"),g.email,true)+(g.officer_email&&g.officer_email!==g.email?line(t("c_email2"),g.officer_email,true):"")+(i.emails||[]).filter(function(e){return e!==g.email;}).map(function(e){ return line(t("c_care_email"),e,true); }).join("")+line(t("c_phone"),(i.tollFree||[]).join(", "),false)+line(t("c_address"),g.address)+linkLine(t("c_portal"),i.page)+(i.form&&/^https?:/.test(i.form)?linkLine(t("c_form"),i.form):"")+(i.notes?'<p class="small muted">'+esc(i.notes)+'</p>':""),i.checked));
    } else out.push(card(t("cstep_1"),t("c_your_insurer"),'<p>'+esc(t("c_find_gro"))+'</p>'+linkLine(t("c_gro_list"),"https://cioins.co.in/GRONonLife"),null));
    var bb=N.bima_bharosa||{};
    out.push(card(t("cstep_2"),t("c_bb"),linkLine(t("c_portal"),bb.portal)+line(t("c_email"),bb.email,true)+line(t("c_phone"),(bb.phones||[]).join(", "))+line(t("c_address"),bb.address),bb.checked));
    var offs=p.c.offices||[], io=N.ombudsman||{};
    if(offs.length){ offs.forEach(function(x){ var o=x.o, note="";
        if(x.note) note='<p class="small">'+esc(x.note.type==="only"?t("c_covers_only",{list:x.note.list.join(", ")}):t("c_covers_except",{list:x.note.list.join(", ")}))+'</p>';
        out.push(card(t("cstep_3"),t("c_io")+": "+o.city,line(t("c_officer"),o.ombudsman)+line(t("c_email"),o.email,true)+line(t("c_phone"),(o.phones||[]).join(", "))+line(t("c_address"),o.address)+note+linkLine(t("c_online"),io.online),o.checked)); });
    } else out.push(card(t("cstep_3"),t("c_io"),'<p>'+esc(t("c_pick_state"))+'</p>'+linkLine(t("c_online"),io.online)+linkLine(t("c_offices"),io.list),null));
    var nch=N.nch||{}, ej=N.ejagriti||{};
    out.push(card(t("cstep_4"),t("c_consumer"),line(t("c_phone"),nch.phone)+line("WhatsApp",nch.whatsapp,true)+linkLine(t("c_portal"),ej.portal),nch.checked));
  } else {
    var b=p.c.bank;
    if(f.issue==="unauth"){ var cy=N.cyber||{}; out.push(card(t("cstep_now"),t("c_cyber"),line(t("c_phone"),cy.phone)+linkLine(t("c_portal"),cy.portal)+'<p class="small">'+esc(t("c_cyber_note"))+'</p>',cy.checked)); }
    if(b){ var pn=b.pno||{};
      out.push(card(t("cstep_1"),b.name,line(t("c_care"),(b.care||[]).join(", "))+linkLine(t("c_complaint_portal"),b.portal)+(b.level2?linkLine(t("c_level2"),b.level2):"")+line(t("c_pno"),pn.name)+line(t("c_email"),pn.email,true)+line(t("c_phone"),pn.phone)+line(t("c_address"),pn.address)+(b.esc||[]).map(function(e){ return /^https?:/.test(e.value)?linkLine(e.channel,e.value):line(e.channel,e.value); }).join("")+(b.notes?'<p class="small muted">'+esc(b.notes)+'</p>':""),b.checked));
    } else out.push(card(t("cstep_1"),t("c_your_bank"),'<p>'+esc(t("c_find_pno"))+'</p>',null));
    if(f.issue==="failed"&&/upi/.test(f.channel||"")){ var np=N.npci||{}; out.push(card(t("cstep_also"),t("c_npci"),'<p class="small">'+esc(t("c_npci_order"))+'</p>'+linkLine(t("c_portal"),np.page),np.checked)); }
    var rb=N.rbi||{};
    out.push(card(t("cstep_2"),t("c_rbi"),linkLine(t("c_portal"),rb.portal)+line(t("c_email"),rb.email,true)+line(t("c_phone"),rb.phone)+line(t("c_address"),rb.address),rb.checked));
    var nc=N.nch||{}, ej2=N.ejagriti||{};
    out.push(card(t("cstep_3"),t("c_consumer"),line(t("c_phone"),nc.phone)+line("WhatsApp",nc.whatsapp,true)+linkLine(t("c_portal"),ej2.portal),nc.checked));
  }
  return out.join("");
}

/* ---------- calendar ---------- */
function icsDate(d){ return R.iso(d).replace(/-/g,""); }
function calLinks(title, d){
  var start=icsDate(d), end=icsDate(R.addD(d,1)), details=t("cal_details");
  var g="https://calendar.google.com/calendar/render?action=TEMPLATE&text="+encodeURIComponent(title)+"&dates="+start+"/"+end+"&details="+encodeURIComponent(details);
  return '<span class="cal"><a href="'+g+'" target="_blank" rel="noopener">'+esc(t("add_cal_google"))+'</a> · <button type="button" class="linkbtn small" data-ics="'+start+'" data-title="'+esc(title)+'">'+esc(t("add_cal_file"))+'</button></span>';
}
function downloadICS(start,title){
  var end=icsDate(R.addD(R.pd(start.slice(0,4)+"-"+start.slice(4,6)+"-"+start.slice(6)),1));
  var body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Haq Patra//EN","BEGIN:VEVENT","UID:"+start+"-"+Math.random().toString(36).slice(2)+"@haqpatra","DTSTAMP:"+icsDate(R.today())+"T000000Z","DTSTART;VALUE=DATE:"+start,"DTEND;VALUE=DATE:"+end,"SUMMARY:"+title.replace(/[,;]/g," "),"DESCRIPTION:"+t("cal_details").replace(/[,;]/g," "),"BEGIN:VALARM","TRIGGER:-PT12H","ACTION:DISPLAY","DESCRIPTION:"+title.replace(/[,;]/g," "),"END:VALARM","END:VEVENT","END:VCALENDAR"].join("\r\n");
  try{ var blob=new Blob([body],{type:"text/calendar"}); var a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="haq-patra-reminder.ics"; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1000); }catch(e){}
}

/* ---------- translation of rule text into other languages (free IndicTrans2 through /api/translate) ---------- */
async function translateAll(strings){
  try{
    var res=await fetch("/api/translate",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({texts:strings,target:S.lang})});
    if(!res.ok) return null; var j=await res.json(); if(!j||!j.ok||!Array.isArray(j.translations)||j.translations.length!==strings.length) return null; return j.translations;
  }catch(e){ return null; }
}

/* ---------- results ---------- */
VIEWS.result=function(){
  var p=R.plan(S.mod,S.f), L=rl(), tr=S.trans&&!S.showOrig?S.trans:null;
  function tx(obj,key){ var s=obj[L]; if(tr&&tr[key]!==undefined) return tr[key]; return s; }
  var labs={ok:t("pill_ok"),warn:t("pill_warn"),stop:t("pill_stop"),info:t("pill_info")};
  var h='<section class="panel result"><div class="row between"><h2>'+esc(t("res_title"))+'</h2>'+listenButton(function(){ return speechText(p,tr); }, tr||S.lang==="hi"||S.lang==="en"?S.lang:"en")+'</div>';
  if(S.summary) h+='<div class="aisum r-sum"><p class="eyebrow">'+esc(t("res_summary"))+'</p><p>'+esc(S.summary)+'</p></div>';
  if(S.lang!=="en"&&S.lang!=="hi") h+='<p class="note small" id="trNote">'+esc(S.trans?t("translated_note"):t("translating"))+(S.trans?' <button type="button" class="linkbtn small" id="origBtn">'+esc(S.showOrig?t("show_translation"):t("show_original"))+'</button>':'')+'</p>';
  h+='<section class="r-checks"><h3>'+esc(t("res_checks"))+'</h3><div class="checks">'+p.checks.map(function(x,i){ return '<div class="check '+x.k+'"><span class="pill">'+esc(labs[x.k])+'</span><div><b>'+esc(tx(x.t,"ct"+i))+'</b><p>'+esc(tx(x.b,"cb"+i))+'</p>'+(x.s.length?'<p class="src">'+esc(t("source"))+': '+x.s.map(function(s){ var r=R.SRC[s]; return r?'<a href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.t)+'</a>':""; }).join(" · ")+'</p>':'')+'</div></div>'; }).join("")+'</div></section>';
  h+='<section class="r-steps"><h3>'+esc(t("res_steps"))+'</h3><ol class="ladder">'+p.ladder.map(function(s,i){ var title=tx(s.t,"lt"+i); var cd=s.calDate||s.date; return '<li class="'+s.st+'"><span class="dot" aria-hidden="true"></span><div><div class="step-t">'+esc(title)+(s.date?' <span class="stamp">'+esc(R.fd(s.date,L))+'</span>':'')+'</div><div class="step-d">'+esc(tx(s.d,"ld"+i))+(s.st==="missed"?" ("+esc(t("date_passed"))+")":"")+'</div>'+(s.cal&&cd?calLinks(title+" (Haq Patra)",cd):'')+'</div></li>'; }).join("")+'</ol></section>';
  h+='<section class="r-contacts"><h3>'+esc(t("res_contacts"))+'</h3><div class="cards">'+contactsHTML(p)+'</div></section>';
  var lt=p.letters; if(S.tab<0||S.tab>=lt.list.length) S.tab=lt.def;
  h+='<section class="r-letters"><h3 id="lettersH">'+esc(t("res_letters"))+'</h3><div class="tabs" role="tablist">'+lt.list.map(function(l,i){ return '<button type="button" class="tab" role="tab" aria-selected="'+(i===S.tab)+'" data-tab="'+i+'">'+esc(l.t[L])+(i===lt.cur?'<span class="tag">'+esc(t("send_now"))+'</span>':'')+'</button>'; }).join("")+'</div>'+
    '<div class="row between"><div class="lang" role="group" aria-label="'+esc(t("letter_lang"))+'"><button type="button" data-ll="en" aria-pressed="'+(S.letterLang==="en")+'">English</button><button type="button" data-ll="hi" aria-pressed="'+(S.letterLang==="hi")+'">हिंदी</button></div>'+
    '<div class="row"><button type="button" class="btn small" id="copyBtn">'+esc(t("copy_letter"))+'</button><button type="button" class="btn ghost small" id="mailBtn">'+esc(t("email_it"))+'</button><button type="button" class="btn ghost small" id="shareBtn">'+esc(t("share"))+'</button><button type="button" class="btn ghost small" id="printBtn" hidden>'+esc(t("print"))+'</button></div></div>'+
    '<p class="status" id="lst" role="status" aria-live="polite"></p><div class="sheet"><pre class="letter" id="letterText"></pre></div><p class="small muted">'+esc(t("letter_check"))+'</p></section>';
  h+='<div class="row r-end"><button type="button" class="btn ghost" id="editBtn">'+esc(t("edit_answers"))+'</button><button type="button" class="btn ghost" id="restartBtn">'+esc(t("start_over"))+'</button></div></section>';
  app.innerHTML=h;
  var cur=lt.list[S.tab]; $("#letterText").textContent=cur[S.letterLang];
  app.querySelectorAll("[data-tab]").forEach(function(b){ b.addEventListener("click",function(){ S.tab=+b.getAttribute("data-tab"); save(); app.querySelectorAll("[data-tab]").forEach(function(x){ x.setAttribute("aria-selected",String(x===b)); }); $("#letterText").textContent=lt.list[S.tab][S.letterLang]; }); });
  app.querySelectorAll("[data-ll]").forEach(function(b){ b.addEventListener("click",function(){ S.letterLang=b.getAttribute("data-ll"); S.letterLangSet=true; save(); app.querySelectorAll("[data-ll]").forEach(function(x){ x.setAttribute("aria-pressed",String(x===b)); }); $("#letterText").textContent=lt.list[S.tab][S.letterLang]; }); });
  $("#copyBtn").addEventListener("click",function(){ copyText(lt.list[S.tab][S.letterLang],$("#lst"),$("#letterText")); });
  $("#mailBtn").addEventListener("click",function(){ var l=lt.list[S.tab], txt=l[S.letterLang], m=/^(Subject|विषय): (.*)$/m.exec(txt); var href="mailto:"+(l.to||"")+"?subject="+encodeURIComponent(m?m[2]:"Complaint")+"&body="+encodeURIComponent(txt.slice(0,1800)+(txt.length>1800?"\n...":"")); $("#lst").textContent=t("email_note"); window.location.href=href; });
  $("#shareBtn").addEventListener("click",function(){ var txt=lt.list[S.tab][S.letterLang]; if(navigator.share){ navigator.share({title:"Haq Patra",text:txt}).catch(function(){}); } else { window.open("https://wa.me/?text="+encodeURIComponent(txt.slice(0,3000)),"_blank","noopener"); } });
  try{ if(window.self===window.top){ var pb=$("#printBtn"); pb.hidden=false; pb.addEventListener("click",function(){ window.print(); }); } }catch(e){}
  $("#editBtn").addEventListener("click",function(){ S.view="review"; render(); });
  $("#restartBtn").addEventListener("click",function(){ resetAll(); render(); });
  app.querySelectorAll("[data-copy]").forEach(function(b){ b.addEventListener("click",function(){ copyText(b.getAttribute("data-copy"),null,null); b.textContent=t("copied_short"); }); });
  app.querySelectorAll("[data-ics]").forEach(function(b){ b.addEventListener("click",function(){ downloadICS(b.getAttribute("data-ics"),b.getAttribute("data-title")); }); });
  var ob=$("#origBtn"); if(ob) ob.addEventListener("click",function(){ S.showOrig=!S.showOrig; render(); });
  if(S.lang!=="en"&&S.lang!=="hi"&&!S.trans){
    var keys=[], strs=[];
    p.checks.forEach(function(x,i){ keys.push("ct"+i); strs.push(x.t.en); keys.push("cb"+i); strs.push(x.b.en); });
    p.ladder.forEach(function(s,i){ keys.push("lt"+i); strs.push(s.t.en); keys.push("ld"+i); strs.push(s.d.en||""); });
    translateAll(strs).then(function(out){ var n=$("#trNote"); if(!out){ if(n) n.textContent=t("translate_failed"); return; } var m={}; keys.forEach(function(k,i){ m[k]=out[i]; }); S.trans=m; S.showOrig=false; if(S.view==="result") render(); });
  }
};
function speechText(p,tr){
  var L=rl(), parts=[]; if(S.summary) parts.push(S.summary);
  p.checks.forEach(function(x,i){ parts.push((tr&&tr["ct"+i])||x.t[L]); parts.push((tr&&tr["cb"+i])||x.b[L]); });
  return parts.join(". ");
}

VIEWS.other=function(){
  var N=R.contacts().national||{}, nch=N.nch||{}, ej=N.ejagriti||{}, io=N.ombudsman||{};
  app.innerHTML='<section class="panel">'+backLink("home")+'<h2>'+esc(t("other_title"))+'</h2>'+
    (S.summary?'<div class="aisum"><p class="eyebrow">'+esc(t("res_summary"))+'</p><p>'+esc(S.summary)+'</p></div>':'')+
    '<p>'+esc(t("other_body"))+'</p><div class="cards">'+
    card(t("c_consumer"),t("c_nch"),line(t("c_phone"),nch.phone)+line("WhatsApp",nch.whatsapp,true)+linkLine(t("c_portal"),nch.portal),nch.checked)+
    card(t("c_consumer"),t("c_ejagriti"),linkLine(t("c_portal"),ej.portal)+'<p class="small">'+esc(t("c_ejagriti_note"))+'</p>',ej.checked)+
    card(t("c_insurance_any"),t("c_io"),'<p class="small">'+esc(t("c_io_any"))+'</p>'+linkLine(t("c_online"),io.online)+linkLine(t("c_offices"),io.list),io.checked)+
    '</div><div class="row"><button type="button" class="btn ghost" data-go="module">'+esc(t("other_try"))+'</button></div></section>';
  wireGo();
  app.querySelectorAll("[data-copy]").forEach(function(b){ b.addEventListener("click",function(){ copyText(b.getAttribute("data-copy"),null,null); b.textContent=t("copied_short"); }); });
};

function resetAll(){ stopSpeak(); S.f={}; S.found={}; S.mod=null; S.summary=null; S.used=null; S.qi=0; S.tab=-1; S.trans=null; S.showOrig=false; S.fromAnalysis=false; S.notice=null; S.view="home"; }
/* ---------- start ---------- */
function boot(){
  app=document.getElementById("app");
  restore();
  /* a fresh visit (link, typed address, logo) starts at home; only a reload or back/forward keeps the user's place */
  try{ var nt=(performance.getEntriesByType("navigation")[0]||{}).type; if(nt==="navigate"||nt==="prerender") resetAll(); }catch(e){}
  var l=S.lang&&S.view!=="home"?S.lang:initLang();
  var sel=document.getElementById("langSel");
  if(sel){ sel.innerHTML=LANGS.map(function(x){ return '<option value="'+x[0]+'">'+x[1]+'</option>'; }).join(""); sel.addEventListener("change",function(){ setLang(sel.value); }); }
  try{ var hsh=(location.hash||"").replace("#",""); if(hsh==="bank"||hsh==="health"){ S.mod=hsh; S.f={}; S.found={}; S.view="wizard"; S.qi=0; S.fromAnalysis=false; } }catch(e){}
  document.querySelectorAll("a.brand").forEach(function(a){ a.addEventListener("click",function(e){ e.preventDefault(); resetAll(); try{ history.replaceState(null,"",location.pathname); }catch(x){} render(); }); });
  setLang(l);
  if(canSpeak()){ try{ speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged=function(){}; }catch(e){} }
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
window.__haq={S:S,render:render,qs:qs,pending:pending};
})();

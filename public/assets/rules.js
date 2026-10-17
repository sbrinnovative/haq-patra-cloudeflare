/* Haq Patra rules engine. Fixed, sourced rules. No AI decides anything here.
   Every check carries English and Hindi text and the ids of its sources. */
(function(){
"use strict";
var RULES_CHECKED = "2026-10-16";

var SRC = {
  hmc:{t:"IRDAI Master Circular on Health Insurance Business, 29 May 2024 (Moneylife)",u:"https://moneylife.in/article/health-insurance-decide-cashless-request-in-1-hour-provide-final-authorisation-for-discharge-within-3-hours-says-irdai/74269.html"},
  mor:{t:"60-month moratorium on non-disclosure disputes (The Week)",u:"https://www.theweek.in/news/india/2024/05/30/irdai-issues-new-master-circular-to-make-health-insurance-claims-process-more-seamless.amp.html"},
  ped:{t:"Pre-existing disease and waiting periods capped at 36 months from 1 Apr 2024 (Business Today)",u:"https://www.businesstoday.in/amp/personal-finance/insurance/story/irdai-reduces-pre-existing-disease-waiting-period-from-4-to-3-years-here-is-what-existing-policyholders-should-know-425325-2024-04-12"},
  pdef:{t:"Definition of pre-existing disease and specific waiting period (IRDAI text, Basunivesh)",u:"https://www.basunivesh.com/latest-changes-in-health-insurance-from-1st-april-2024/amp/"},
  room:{t:"Proportionate deduction limits in the 2024 health master circular (Outlook Money)",u:"https://www.outlookmoney.com/spotlight/financehub/the-three-lines-in-your-health-policy-that-decide-how-much-you-actually-get-paid"},
  diff:{t:"No proportionate deduction where the hospital has no room-based billing (New India Assurance wording)",u:"https://icmai.newindia.co.in/NIAICMAI/Images/Documents/Health-TermsandConditions.pdf"},
  crc:{t:"No claim rejection without Claims Review Committee approval (Moneylife)",u:"https://mas360.moneylife.in/article/irdai-unveils-customer-centric-reforms-for-health-insurance-policies/4606.html"},
  g14:{t:"Insurers must resolve grievances within 14 days (Government statement, Aug 2026)",u:"https://ianslive.in/policyholders-can-approach-insurer-irdai-for-redress-of-insurance-related-grievances--20260814154803"},
  bb:{t:"Bima Bharosa portal and helplines (IRDAI)",u:"https://bimabharosa.irdai.gov.in/Home/ContactUs"},
  bbn:{t:"Bima Bharosa is not linked to the Insurance Ombudsman (Lok Sabha answer)",u:"https://eparlib.sansad.in/bitstream/123456789/3015516/1/AS20_AaaDVE.pdf"},
  io:{t:"Insurance Ombudsman Rules 2017, Rule 14 and the Rs 50 lakh limit (iPleaders)",u:"https://blog.ipleaders.in/?p=130171"},
  iop:{t:"Insurance Ombudsman offices (Council for Insurance Ombudsmen)",u:"https://www.cioins.co.in/ombudsman"},
  int:{t:"Interest at bank rate plus 2% on delayed claims (iPleaders)",u:"https://blog.ipleaders.in/?p=130171"},
  cp69:{t:"Consumer Protection Act 2019, Section 69: two years",u:"https://www.advocatekhoj.com/library/bareacts/consumerprotection2019/69.php"},
  cpj:{t:"Consumer Commission money limits, 2021 rules (LiveLaw)",u:"https://www.livelaw.in/amp/news-updates/central-govt-notifies-consumer-protection-rules-2021-revising-pecuniary-jurisdiction-district-state-national-commissions-188575"},
  ios:{t:"Reserve Bank Integrated Ombudsman Scheme 2026 (salient features)",u:"https://www.arohan.in/contact-us/grievances/salient-feature-scheme/"},
  iosb:{t:"RB-IOS 2026: filing, 14448, compensation (Business Today)",u:"https://www.businesstoday.in/personal-finance/banking/story/rbi-revamps-customer-grievance-redressal-heres-what-changes-for-bank-nbfc-customers-541259-2026-07-06"},
  iosk:{t:"RB-IOS 2026 compared with 2021 (Vinod Kothari Consultants)",u:"https://vinodkothari.com/2026/01/rbi-integrated-ombudsman-scheme-2026-key-changes/"},
  rbiar:{t:"RBI Ombudsman annual report 2024-25: why complaints are rejected",u:"https://rbi.org.in/Scripts/PublicationsView.aspx?id=23441"},
  tat:{t:"RBI circular RBI/2019-20/67: failed transaction deadlines and compensation",u:"https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11693"},
  lia:{t:"RBI circular RBI/2017-18/15: customer liability in unauthorised transactions",u:"https://www.rbi.org.in/scripts/FS_Notification.aspx?Id=11040"},
  l27:{t:"RBI revised fraud framework from 1 January 2027 (Probe42)",u:"https://resources.probe42.in/regulatory-updates/rbi-circulars/rbi-responsible-business-conduct-third-amendment/"},
  npci:{t:"NPCI UPI dispute redressal",u:"https://www.npci.org.in/what-we-do/upi/dispute-redressal-mechanism"}
};

/* ---------- dates and money ---------- */
var MON = {en:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  hi:["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"]};
function pd(s){ if(!s) return null; var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s)); if(!m) return null; var d=new Date(+m[1],+m[2]-1,+m[3]); return isNaN(d)?null:d; }
function iso(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function today(){ var d=new Date(); return new Date(d.getFullYear(),d.getMonth(),d.getDate()); }
function addD(d,n){ var x=new Date(d); x.setDate(x.getDate()+n); return x; }
function addM(d,n){ var x=new Date(d.getFullYear(),d.getMonth()+n,1); var last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate(); x.setDate(Math.min(d.getDate(),last)); return x; }
function addWD(d,n){ var x=new Date(d); while(n>0){ x.setDate(x.getDate()+1); var w=x.getDay(); if(w!==0&&w!==6) n--; } return x; }
function wdBetween(a,b){ var n=0,x=new Date(a); while(x<b){ x.setDate(x.getDate()+1); var w=x.getDay(); if(w!==0&&w!==6) n++; } return n; }
function monthsBetween(a,b){ var m=(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth()); if(b.getDate()<a.getDate()) m--; return m; }
function daysBetween(a,b){ return Math.round((b-a)/864e5); }
function fd(d,lang){ if(!d) return lang==="hi"?"[तारीख]":"[date]"; return d.getDate()+" "+(MON[lang]||MON.en)[d.getMonth()]+" "+d.getFullYear(); }
function maxD(a,b){ return (!a)?b:(!b)?a:(a>b?a:b); }
function rs(n){ n=Math.round(+n||0); return "₹"+n.toLocaleString("en-IN"); }
function ra(n,lang){ return (+n>0)?rs(n):(lang==="hi"?"₹[राशि]":"₹[amount]"); }
function v(f,k,ph){ return (f[k]&&String(f[k]).trim())?String(f[k]).trim():ph; }
function B(en,hi){ return {en:en,hi:hi}; }
function known(x){ return x!==undefined&&x!==null&&x!==""&&x!=="unknown"; }

/* ---------- amount in words (Indian system) ---------- */
var EN1=["","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen"];
var EN10=["","","twenty","thirty","forty","fifty","sixty","seventy","eighty","ninety"];
var HI99="शून्य एक दो तीन चार पाँच छह सात आठ नौ दस ग्यारह बारह तेरह चौदह पंद्रह सोलह सत्रह अठारह उन्नीस बीस इक्कीस बाईस तेईस चौबीस पच्चीस छब्बीस सत्ताईस अट्ठाईस उनतीस तीस इकतीस बत्तीस तैंतीस चौंतीस पैंतीस छत्तीस सैंतीस अड़तीस उनतालीस चालीस इकतालीस बयालीस तैंतालीस चवालीस पैंतालीस छियालीस सैंतालीस अड़तालीस उनचास पचास इक्यावन बावन तिरपन चौवन पचपन छप्पन सत्तावन अट्ठावन उनसठ साठ इकसठ बासठ तिरसठ चौंसठ पैंसठ छियासठ सड़सठ अड़सठ उनहत्तर सत्तर इकहत्तर बहत्तर तिहत्तर चौहत्तर पचहत्तर छिहत्तर सतहत्तर अठहत्तर उन्यासी अस्सी इक्यासी बयासी तिरासी चौरासी पचासी छियासी सत्तासी अट्ठासी नवासी नब्बे इक्यानबे बानबे तिरानबे चौरानबे पंचानबे छियानबे सत्तानबे अट्ठानबे निन्यानबे".split(" ");
function en99(n){ return n<20?EN1[n]:EN10[Math.floor(n/10)]+(n%10?"-"+EN1[n%10]:""); }
function words(n,lang){
  n=Math.floor(+n||0); if(n<=0) return ""; if(n>999999999) return "";
  var parts=[], cr=Math.floor(n/1e7), lk=Math.floor(n%1e7/1e5), th=Math.floor(n%1e5/1e3), hu=Math.floor(n%1e3/100), re=n%100;
  if(lang==="hi"){
    if(cr) parts.push(HI99[cr]+" करोड़"); if(lk) parts.push(HI99[lk]+" लाख"); if(th) parts.push(HI99[th]+" हज़ार"); if(hu) parts.push(HI99[hu]+" सौ"); if(re) parts.push(HI99[re]);
    return parts.join(" ")+" रुपये";
  }
  if(cr) parts.push(en99(cr)+" crore"); if(lk) parts.push(en99(lk)+" lakh"); if(th) parts.push(en99(th)+" thousand"); if(hu) parts.push(EN1[hu]+" hundred"); if(re) parts.push(en99(re));
  return parts.join(" ")+" rupees";
}

/* ---------- contacts ---------- */
var C = null;
function contacts(){ return C || (C = (window.HAQ_CONTACTS||{insurers:[],banks:[],upi:[],offices:[],national:{}})); }
function findInsurer(id){ var L=contacts().insurers; for(var i=0;i<L.length;i++) if(L[i].id===id) return L[i]; return null; }
function findBank(id){ var L=contacts().banks.concat(contacts().upi||[]); for(var i=0;i<L.length;i++) if(L[i].id===id) return L[i]; return null; }
function officesForState(state){
  var out=[]; if(!state) return out;
  contacts().offices.forEach(function(o){
    var j=o.j||{}, note=null, hit=false;
    if((j.states||[]).indexOf(state)>=0){ hit=true; if(j.exclusions&&j.exclusions[state]) note={type:"except",list:j.exclusions[state]}; }
    else if(j.partial&&j.partial[state]){ hit=true; note={type:"only",list:j.partial[state]}; }
    if(hit) out.push({o:o,note:note});
  });
  return out;
}

/* ---------- HEALTH ---------- */
var REASON = {
  ped:B("pre-existing disease","पहले से मौजूद बीमारी (Pre-existing Disease)"),
  nondisclosure:B("non-disclosure or misrepresentation","जानकारी छिपाना या गलत जानकारी (Non-disclosure)"),
  waiting:B("waiting period not completed","प्रतीक्षा अवधि पूरी नहीं हुई (Waiting Period)"),
  roomrent:B("room rent limit and proportionate deduction","कमरे के किराए की सीमा और आनुपातिक कटौती (Proportionate Deduction)"),
  notnecessary:B("hospitalisation not medically necessary","अस्पताल में भर्ती होना आवश्यक नहीं था"),
  documents:B("documents not submitted","दस्तावेज़ जमा नहीं किए गए"),
  delay:B("claim pending, no decision","दावा लंबित, कोई निर्णय नहीं"),
  other:B("other reason","अन्य कारण"),
  unknown:B("reason not stated","कारण स्पष्ट नहीं")
};

function healthCalc(f){
  var c={}; c.today=today(); c.admit=pd(f.admit); c.cover=pd(f.coverStart); c.rej=pd(f.rejDate);
  c.g=f.grievance==="yes"?pd(f.grievanceDate):null;
  c.r=(f.grievance==="yes"&&known(f.reply)&&f.reply!=="none")?pd(f.replyDate):null;
  c.reason=known(f.reason)?f.reason:"unknown";
  c.months=(c.cover&&(c.admit||c.rej))?monthsBetween(c.cover,c.admit||c.rej):null;
  c.claim=+f.claimAmt||0; c.paid=+f.paidAmt||0; c.due=Math.max(0,c.claim-c.paid); c.partial=c.paid>0&&c.due>0;
  c.gResolveBy=c.g?addD(c.g,14):null;
  c.ioFrom=null; c.ioBy=null;
  if(c.g){ if(c.r){ c.ioFrom=c.r; c.ioBy=addM(c.r,12); } else { c.ioFrom=addM(c.g,1); c.ioBy=addM(c.g,12); } }
  c.ccBy=c.rej?addM(c.rej,24):null;
  c.ins=findInsurer(f.insurer);
  c.offices=officesForState(f.state);
  return c;
}

function healthGround(f,c){
  var m=c.months, r=c.reason, cs=fd(c.cover,"en"), csh=fd(c.cover,"hi");
  if(r==="ped"||r==="nondisclosure"){
    if(m!==null&&m>=60) return B(
      "My cover has been continuous, including portability, since "+cs+", which is "+m+" months before the date of admission. Under the IRDAI Master Circular on Health Insurance Business dated 29 May 2024, after 60 months of continuous coverage (the moratorium period) no policy or claim can be contested on grounds of non-disclosure or misrepresentation, except on grounds of established fraud. No fraud has been alleged or established. The decision on this ground is therefore not in line with IRDAI's rules.",
      "मेरा बीमा कवर "+csh+" से लगातार (पोर्टेबिलिटी सहित) चल रहा है, यानी भर्ती की तारीख तक "+m+" महीने। IRDAI के 29 मई 2024 के हेल्थ इंश्योरेंस मास्टर सर्कुलर के अनुसार 60 महीने के लगातार कवर (मोरेटोरियम अवधि) के बाद, स्थापित धोखाधड़ी को छोड़कर, किसी भी पॉलिसी या दावे पर जानकारी न देने या गलत जानकारी के आधार पर आपत्ति नहीं की जा सकती। मुझ पर कोई धोखाधड़ी न आरोपित है और न सिद्ध। इसलिए इस आधार पर लिया गया निर्णय IRDAI के नियमों के अनुरूप नहीं है।");
    if(r==="ped"&&f.disclosed==="yes"&&m!==null&&m>=36) return B(
      "This condition was disclosed when I bought the policy. My cover has been continuous since "+cs+", which is "+m+" months before admission. Under the IRDAI (Insurance Products) Regulations, 2024, the waiting period for disclosed pre-existing diseases cannot exceed 36 months of continuous coverage. That period was over before my admission, so the claim is payable.",
      "यह बीमारी पॉलिसी लेते समय बताई गई थी। मेरा कवर "+csh+" से लगातार चल रहा है, यानी भर्ती तक "+m+" महीने। IRDAI (Insurance Products) Regulations, 2024 के अनुसार बताई गई पहले से मौजूद बीमारी की प्रतीक्षा अवधि 36 महीने के लगातार कवर से अधिक नहीं हो सकती। यह अवधि मेरी भर्ती से पहले ही पूरी हो चुकी थी, इसलिए दावा देय है।");
    return B(
      "Under IRDAI's definition, a pre-existing disease is a condition diagnosed by a doctor, or for which medical advice or treatment was recommended, within 36 months before the policy began. Please share the medical record you rely on to show that this condition meets that definition, with its date."+(r==="nondisclosure"?" Please also identify the exact question in the proposal form that you say was answered incorrectly.":"")+" A note in the hospital file that does not record when the condition began does not by itself establish this."+(m!==null?" My cover has been continuous since "+cs+" ("+m+" months before admission).":""),
      "IRDAI की परिभाषा के अनुसार पहले से मौजूद बीमारी वह है जिसका निदान पॉलिसी शुरू होने से पहले के 36 महीनों में डॉक्टर ने किया हो, या जिसके लिए उस अवधि में चिकित्सीय सलाह या उपचार दिया गया हो। कृपया वह चिकित्सीय रिकॉर्ड तारीख सहित साझा करें जिसके आधार पर आप इस बीमारी को इस परिभाषा में मानते हैं।"+(r==="nondisclosure"?" कृपया प्रस्ताव फ़ॉर्म का वह प्रश्न भी बताएँ जिसका उत्तर आपके अनुसार गलत दिया गया।":"")+" अस्पताल की फ़ाइल में लिखी कोई टिप्पणी, जिसमें बीमारी शुरू होने की तारीख दर्ज न हो, अपने आप में इसे सिद्ध नहीं करती।"+(m!==null?" मेरा कवर "+csh+" से लगातार चल रहा है (भर्ती से "+m+" महीने पहले से)।":""));
  }
  if(r==="waiting"){
    if(m!==null&&m>=36) return B(
      "You have cited a waiting period. Under the IRDAI (Insurance Products) Regulations, 2024, a specific waiting period cannot exceed 36 months from the start of continuous cover. My cover has been continuous since "+cs+", which is "+m+" months before admission, so no waiting period can apply.",
      "आपने प्रतीक्षा अवधि का कारण बताया है। IRDAI (Insurance Products) Regulations, 2024 के अनुसार किसी विशेष बीमारी की प्रतीक्षा अवधि लगातार कवर शुरू होने से 36 महीने से अधिक नहीं हो सकती। मेरा कवर "+csh+" से लगातार चल रहा है, यानी भर्ती तक "+m+" महीने, इसलिए कोई प्रतीक्षा अवधि लागू नहीं हो सकती।");
    return B(
      "You have cited a waiting period. Please state the exact clause, the length of the waiting period, and the date from which you counted it. Please confirm that you have given credit for my earlier continuous cover"+(c.cover?" since "+cs:"")+", including any ported policy.",
      "आपने प्रतीक्षा अवधि का कारण बताया है। कृपया संबंधित क्लॉज़, प्रतीक्षा अवधि की लंबाई और वह तारीख बताएँ जिससे आपने इसे गिना। कृपया पुष्टि करें कि मेरे पिछले लगातार कवर"+(c.cover?" ("+csh+" से)":"")+", पोर्टेड पॉलिसी सहित, का लाभ दिया गया है।");
  }
  if(r==="roomrent") return B(
    "You have deducted part of the claim citing the room rent limit. Under the IRDAI Master Circular on Health Insurance Business (2024), a proportionate deduction can apply only to associated medical expenses linked to the room. It cannot be applied to pharmacy and consumables, implants and medical devices, diagnostics, or ICU charges."+(f.diffBilling==="no"?" The hospital's charges do not change with the room category, so no proportionate deduction can apply at all.":" It also cannot be applied where the hospital does not charge differently by room category.")+" Please send an itemised statement of every deduction with the clause relied on, and refund the amounts deducted under these protected heads.",
    "आपने कमरे के किराए की सीमा का हवाला देकर दावे से कटौती की है। IRDAI के हेल्थ इंश्योरेंस मास्टर सर्कुलर (2024) के अनुसार आनुपातिक कटौती केवल कमरे से जुड़े संबंधित चिकित्सा खर्चों पर लागू हो सकती है। यह दवाइयों और कंज़्यूमेबल्स, इम्प्लांट और मेडिकल उपकरणों, जाँचों (डायग्नॉस्टिक्स) या ICU शुल्क पर लागू नहीं की जा सकती।"+(f.diffBilling==="no"?" अस्पताल के शुल्क कमरे की श्रेणी के अनुसार नहीं बदलते, इसलिए कोई आनुपातिक कटौती लागू नहीं हो सकती।":" जहाँ अस्पताल कमरे की श्रेणी के अनुसार अलग शुल्क नहीं लेता, वहाँ भी यह कटौती लागू नहीं होती।")+" कृपया हर कटौती का मदवार विवरण संबंधित क्लॉज़ के साथ भेजें और इन संरक्षित मदों से काटी गई राशि लौटाएँ।");
  if(r==="notnecessary") return B(
    "You have stated that hospitalisation was not medically necessary. The admission was advised by the treating doctor, whose certificate I attach. Please state the specific policy clause relied on and the medical opinion on which your decision is based.",
    "आपने कहा है कि अस्पताल में भर्ती होना चिकित्सीय रूप से आवश्यक नहीं था। भर्ती उपचार करने वाले डॉक्टर की सलाह पर हुई थी, जिनका प्रमाणपत्र संलग्न है। कृपया पॉलिसी का वह विशिष्ट क्लॉज़ और वह चिकित्सीय राय बताएँ जिसके आधार पर यह निर्णय लिया गया।");
  if(r==="documents") return B(
    "You have cited missing documents. IRDAI's Master Circular on Health Insurance Business (2024) states that the policyholder shall not be required to submit documents for claim settlement. Please obtain any further record directly from the hospital, or tell me exactly which document is outstanding and why it is needed.",
    "आपने दस्तावेज़ों की कमी का कारण बताया है। IRDAI के हेल्थ इंश्योरेंस मास्टर सर्कुलर (2024) के अनुसार दावा निपटान के लिए पॉलिसीधारक से दस्तावेज़ जमा करने की अपेक्षा नहीं की जाएगी। कृपया कोई भी अतिरिक्त रिकॉर्ड सीधे अस्पताल से लें, या स्पष्ट बताएँ कि कौन-सा दस्तावेज़ बाकी है और क्यों आवश्यक है।");
  if(r==="delay") return B(
    "The claim has not been settled. Please settle it without further delay, together with interest at 2% above the bank rate for the period of delay, which IRDAI requires insurers to pay on their own along with the claim.",
    "दावे का अब तक निपटारा नहीं हुआ है। कृपया इसे बिना और देरी के निपटाएँ, साथ में देरी की अवधि के लिए बैंक दर से 2% अधिक ब्याज दें, जिसे IRDAI के नियमों के अनुसार बीमा कंपनी को दावे के साथ स्वयं देना होता है।");
  var o=v(f,"otherReason","");
  if(o) return B("You have given this reason: \""+o+"\". Please state the specific policy clause relied on and the evidence for this decision.","आपने यह कारण बताया है: \""+o+"\"। कृपया पॉलिसी का वह विशिष्ट क्लॉज़ और इस निर्णय का आधार बताएँ।");
  return B("Your letter does not clearly state a reason with the policy clause relied on. IRDAI requires any rejection or deduction to refer to the specific terms of the policy. Please state the exact reason and clause, and the evidence for this decision.",
    "आपके पत्र में पॉलिसी क्लॉज़ के साथ स्पष्ट कारण नहीं बताया गया है। IRDAI के नियमों के अनुसार किसी भी अस्वीकृति या कटौती में पॉलिसी की विशिष्ट शर्तों का उल्लेख होना चाहिए। कृपया सटीक कारण, क्लॉज़ और इस निर्णय का आधार बताएँ।");
}

function healthFacts(f,c,lang){
  var who=f.patient&&String(f.patient).trim()?f.patient.trim():null, hosp=v(f,"hospital",lang==="hi"?"[अस्पताल]":"[hospital]");
  var stay = (c.admit||pd(f.discharge)) ? (lang==="hi"?" "+fd(c.admit,"hi")+" से "+fd(pd(f.discharge),"hi")+" तक":" from "+fd(c.admit,"en")+" to "+fd(pd(f.discharge),"en")) : "";
  if(lang==="hi"){
    var s=(who?who+" को":"मुझे")+" "+hosp+" में"+stay+" भर्ती किया गया था। इस उपचार के लिए "+ra(c.claim,"hi")+" का दावा प्रस्तुत किया गया था (दावा संख्या "+v(f,"claimNo","[दावा संख्या]")+")। ";
    if(c.reason==="delay") return s+"अब तक इस दावे पर कोई निर्णय नहीं हुआ है।";
    return s+fd(c.rej,"hi")+" के पत्र द्वारा आपने "+(c.partial?"केवल "+rs(c.paid)+" का भुगतान किया और "+rs(c.due)+" की कटौती की":"दावा अस्वीकार कर दिया")+"। कारण बताया गया: "+REASON[c.reason].hi+"।";
  }
  var t=(who?who+" was":"I was")+" admitted to "+hosp+stay+". A claim of "+ra(c.claim,"en")+" was made for this treatment (claim number "+v(f,"claimNo","[claim number]")+"). ";
  if(c.reason==="delay") return t+"No decision has been made on it so far.";
  return t+"By your letter dated "+fd(c.rej,"en")+", you "+(c.partial?"paid only "+rs(c.paid)+" and deducted "+rs(c.due):"rejected the claim")+", giving the reason: "+REASON[c.reason].en+".";
}

function signoff(f,lang,d){
  var L=[]; L.push(lang==="hi"?"भवदीय,":"Yours faithfully,"); L.push(""); L.push(v(f,"name",lang==="hi"?"[पॉलिसीधारक का नाम]":"[Policyholder's name]"));
  if(f.address) L.push(f.address); if(f.phone) L.push((lang==="hi"?"फ़ोन: ":"Phone: ")+f.phone); if(f.email) L.push((lang==="hi"?"ईमेल: ":"Email: ")+f.email);
  if(f.helperName) L.push((lang==="hi"?"यह पत्र तैयार करने में सहायता: ":"Prepared with the help of: ")+f.helperName+(f.helperPhone?" ("+f.helperPhone+")":""));
  L.push((lang==="hi"?"दिनांक: ":"Date: ")+fd(d,lang)); return L.join("\n");
}

function insurerAddressee(c,lang){
  var i=c.ins, L=[];
  if(i&&i.gro&&i.gro.name) L.push(i.gro.name);
  L.push(lang==="hi"?"शिकायत निवारण अधिकारी (Grievance Redressal Officer)":"The Grievance Redressal Officer");
  L.push(i?i.name:(lang==="hi"?"[बीमा कंपनी]":"[Insurance company]"));
  if(i&&i.gro&&i.gro.address) L.push(i.gro.address);
  var em=i&&i.gro&&i.gro.email; if(em) L.push((lang==="hi"?"ईमेल: ":"Email: ")+em);
  return L.join("\n");
}

function healthLetters(f,c){
  var td=c.today, g=healthGround(f,c);
  var insN=c.ins?c.ins.name:v(f,"insurerName","[Insurance company]"), insNh=c.ins?c.ins.name:v(f,"insurerName","[बीमा कंपनी]");
  var pol=v(f,"policyNo","[policy number]"), polh=v(f,"policyNo","[पॉलिसी संख्या]"), cl=v(f,"claimNo","[claim number]"), clh=v(f,"claimNo","[दावा संख्या]");
  var full=!c.partial&&c.reason!=="delay"&&c.reason!=="roomrent";
  var dueEn=c.claim>0?rs(c.due):"₹[amount]", dueHi=c.claim>0?rs(c.due):"₹[राशि]";
  var g_en=["To",insurerAddressee(c,"en"),"","Subject: Complaint against the "+(c.reason==="delay"?"delay in":(c.partial?"partial settlement of":"rejection of"))+" claim "+cl+" under policy "+pol,"","Dear Sir or Madam,","",
    "I, "+v(f,"name","[policyholder's name]")+", hold the above policy. "+healthFacts(f,c,"en"),"",g.en,"","I request you to:",
    "1. Review the claim and pay the balance of "+dueEn+(c.reason==="delay"?" with interest for the delay":"")+".",
    "2. Give the reasons for your decision in writing, with the specific policy clause relied on."+(full?"\n3. Confirm that the rejection was approved by your Claims Review Committee, as IRDAI requires.":""),"",
    "Under IRDAI's rules, a grievance must be acknowledged at once and resolved within 14 days. If I do not receive a satisfactory reply, I will approach IRDAI through the Bima Bharosa portal and the Insurance Ombudsman.","",
    "Attached: policy copy, claim form, "+(c.reason==="delay"?"":"your letter dated "+fd(c.rej,"en")+", ")+"discharge summary, bills"+(c.reason==="notnecessary"?", treating doctor's certificate":"")+".","",signoff(f,"en",td)].join("\n");
  var g_hi=["सेवा में",insurerAddressee(c,"hi"),"","विषय: पॉलिसी संख्या "+polh+" के अंतर्गत दावा संख्या "+clh+" "+(c.reason==="delay"?"में देरी":(c.partial?"के आंशिक भुगतान":"की अस्वीकृति"))+" के विरुद्ध शिकायत","","महोदय/महोदया,","",
    "मैं, "+v(f,"name","[पॉलिसीधारक का नाम]")+", उपरोक्त पॉलिसी का पॉलिसीधारक हूँ। "+healthFacts(f,c,"hi"),"",g.hi,"","मेरा अनुरोध है कि:",
    "1. दावे की पुनः समीक्षा करके बकाया राशि "+dueHi+(c.reason==="delay"?" देरी के ब्याज सहित":"")+" का भुगतान किया जाए।",
    "2. निर्णय के कारण पॉलिसी के विशिष्ट क्लॉज़ के उल्लेख सहित लिखित में दिए जाएँ।"+(full?"\n3. पुष्टि करें कि दावे की अस्वीकृति को आपकी दावा समीक्षा समिति (Claims Review Committee) ने स्वीकृत किया था, जैसा IRDAI के नियमों में आवश्यक है।":""),"",
    "IRDAI के नियमों के अनुसार शिकायत की तुरंत पावती और 14 दिनों में निपटारा होना चाहिए। संतोषजनक उत्तर न मिलने पर मुझे बीमा भरोसा पोर्टल के माध्यम से IRDAI और बीमा लोकपाल (Insurance Ombudsman) से संपर्क करना पड़ेगा।","",
    "संलग्न: पॉलिसी की प्रति, दावा फ़ॉर्म, "+(c.reason==="delay"?"":fd(c.rej,"hi")+" का आपका पत्र, ")+"डिस्चार्ज समरी, बिल"+(c.reason==="notnecessary"?", उपचार करने वाले डॉक्टर का प्रमाणपत्र":"")+"।","",signoff(f,"hi",td)].join("\n");
  var gt_en=c.g?("I wrote to the insurer's grievance officer on "+fd(c.g,"en")+". "+(!c.r?"I have received no resolution.":"Their reply dated "+fd(c.r,"en")+" did not resolve the matter.")):"[Write to the insurer's grievance officer first and add the date here.]";
  var gt_hi=c.g?("मैंने "+fd(c.g,"hi")+" को बीमा कंपनी के शिकायत निवारण अधिकारी को लिखा। "+(!c.r?"मुझे कोई समाधान नहीं मिला।":fd(c.r,"hi")+" के उनके उत्तर से समस्या हल नहीं हुई।")):"[पहले बीमा कंपनी के शिकायत अधिकारी को लिखें और यहाँ तारीख जोड़ें।]";
  var contactLine=v(f,"name","[name]")+(f.phone?", "+f.phone:"")+(f.email?", "+f.email:"");
  var bb_en=["Paste this into the complaint box on bimabharosa.irdai.gov.in, or email it to complaints@irdai.gov.in. Phone help: 155255 or 1800 4254 732.","",
    "Complaint against "+insN+", policy "+pol+", claim "+cl+".","",healthFacts(f,c,"en"),"",g.en,"",gt_en,"","I request IRDAI to direct the insurer to review the claim and pay "+dueEn+", with written reasons citing the policy clause.","",contactLine].join("\n");
  var bb_hi=["इसे bimabharosa.irdai.gov.in के शिकायत बॉक्स में चिपकाएँ, या complaints@irdai.gov.in पर ईमेल करें। फ़ोन सहायता: 155255 या 1800 4254 732।","",
    insNh+" के विरुद्ध शिकायत, पॉलिसी "+polh+", दावा "+clh+"।","",healthFacts(f,c,"hi"),"",g.hi,"",gt_hi,"","IRDAI से अनुरोध है कि बीमा कंपनी को दावे की पुनः समीक्षा करने, "+dueHi+" का भुगतान करने और पॉलिसी क्लॉज़ सहित लिखित कारण देने का निर्देश दें।","",contactLine].join("\n");
  var off=c.offices.length===1?c.offices[0].o:null;
  var offEn=off?["The Insurance Ombudsman", off.address, "Email: "+off.email]:["The Insurance Ombudsman","[Office for your area: see the contacts on this page, or cioins.co.in]"];
  var offHi=off?["बीमा लोकपाल (Insurance Ombudsman)", off.address, "ईमेल: "+off.email]:["बीमा लोकपाल (Insurance Ombudsman)","[आपके क्षेत्र का कार्यालय: इस पेज पर संपर्क देखें, या cioins.co.in]"];
  var io_en=["To"].concat(offEn).concat(["","Subject: Complaint under Rule 14 of the Insurance Ombudsman Rules, 2017 against "+insN,"","1. Complainant: "+v(f,"name","[policyholder's name]")+(f.address?", "+f.address:"")+(f.phone?", phone "+f.phone:"")+(f.email?", email "+f.email:""),
    "2. Insurer: "+insN+". Policy number "+pol+". Claim number "+cl+".","","3. Facts: "+healthFacts(f,c,"en"),"","4. Complaint to the insurer: "+gt_en,"","5. Grounds: "+g.en,"",
    "6. Relief sought: direct the insurer to pay "+dueEn+" with interest at 2% above the bank rate from the date the amount became due.","",
    "7. Declaration: The same matter is not pending before, and has not been decided by, any court, consumer commission or arbitrator. The amount claimed is within ₹50 lakh.","",
    "Attached: policy copy, claim papers, the insurer's letter dated "+fd(c.rej,"en")+", my complaint to the insurer and any reply, discharge summary and bills.","",signoff(f,"en",td)]).join("\n");
  var io_hi=["सेवा में"].concat(offHi).concat(["","विषय: "+insNh+" के विरुद्ध बीमा लोकपाल नियम, 2017 के नियम 14 के अंतर्गत शिकायत","","1. शिकायतकर्ता: "+v(f,"name","[पॉलिसीधारक का नाम]")+(f.address?", "+f.address:"")+(f.phone?", फ़ोन "+f.phone:"")+(f.email?", ईमेल "+f.email:""),
    "2. बीमा कंपनी: "+insNh+"। पॉलिसी संख्या "+polh+"। दावा संख्या "+clh+"।","","3. तथ्य: "+healthFacts(f,c,"hi"),"","4. बीमा कंपनी से शिकायत: "+gt_hi,"","5. आधार: "+g.hi,"",
    "6. माँगी गई राहत: बीमा कंपनी को निर्देश दें कि वह "+dueHi+" का भुगतान, राशि देय होने की तारीख से बैंक दर से 2% अधिक ब्याज सहित, करे।","",
    "7. घोषणा: यही मामला किसी न्यायालय, उपभोक्ता आयोग या मध्यस्थ के समक्ष लंबित नहीं है और न ही उनके द्वारा निर्णीत हुआ है। माँगी गई राशि ₹50 लाख के भीतर है।","",
    "संलग्न: पॉलिसी की प्रति, दावे के कागज़, बीमा कंपनी का "+fd(c.rej,"hi")+" का पत्र, बीमा कंपनी को मेरी शिकायत और उसका उत्तर, डिस्चार्ज समरी और बिल।","",signoff(f,"hi",td)]).join("\n");
  var cur=f.grievance!=="yes"?0:((c.ioBy&&c.today>c.ioBy)?-1:((c.ioFrom&&c.today>=c.ioFrom)?2:((c.gResolveBy&&c.today>=c.gResolveBy)?1:-1)));
  var def=cur>=0?cur:((c.ioBy&&c.today>c.ioBy)?2:1);
  return {cur:cur,def:def,list:[
    {t:B("1. Letter to the insurer","1. बीमा कंपनी को पत्र"),en:g_en,hi:g_hi,to:c.ins&&c.ins.gro?c.ins.gro.email:null},
    {t:B("2. IRDAI Bima Bharosa complaint","2. IRDAI बीमा भरोसा शिकायत"),en:bb_en,hi:bb_hi,to:"complaints@irdai.gov.in"},
    {t:B("3. Insurance Ombudsman complaint","3. बीमा लोकपाल शिकायत"),en:io_en,hi:io_hi,to:off?off.email:null}]};
}

function healthChecks(f,c){
  var out=[], m=c.months, r=c.reason;
  function add(k,t,b,s){ out.push({k:k,t:t,b:b,s:s||[]}); }
  if(r==="ped"||r==="nondisclosure"){
    if(m===null) add("info",B("Add the date you were first insured","पहली बार बीमा लेने की तारीख जोड़ें"),B("How long your cover has run without a break decides how strong your case is. Count earlier policies you ported from.","आपका कवर बिना रुके कितने समय से चल रहा है, इसी से आपका पक्ष कितना मज़बूत है यह तय होता है। पोर्ट की गई पुरानी पॉलिसी भी गिनें।"),["mor","ped"]);
    else if(m>=60) add("ok",B("Strong ground: "+m+" months of continuous cover","मज़बूत आधार: "+m+" महीने का लगातार कवर"),B("After 60 months of continuous cover, IRDAI does not allow an insurer to contest a claim for non-disclosure or misrepresentation unless fraud is established.","60 महीने के लगातार कवर के बाद IRDAI बीमा कंपनी को धोखाधड़ी साबित किए बिना जानकारी छिपाने के आधार पर दावे पर आपत्ति की अनुमति नहीं देता।"),["mor","hmc"]);
    else if(r==="ped"&&f.disclosed==="yes"&&m>=36) add("ok",B("Waiting period for a declared illness is over","बताई गई बीमारी की प्रतीक्षा अवधि पूरी हो चुकी है"),B("The waiting period for a declared pre-existing disease cannot exceed 36 months. You have "+m+" months of continuous cover.","बताई गई पहले से मौजूद बीमारी की प्रतीक्षा अवधि 36 महीने से अधिक नहीं हो सकती। आपका लगातार कवर "+m+" महीने का है।"),["ped"]);
    else add("warn",B("Ask for proof, not a label","केवल लेबल नहीं, सबूत माँगें"),B((f.disclosed==="no"?"If the illness was known and not declared, the insurer can dispute this until you reach 60 months of cover ("+m+" so far). ":"")+"A pre-existing disease means one diagnosed or treated within 36 months before the policy began. The letter asks the insurer to show the dated record it relies on.",(f.disclosed==="no"?"अगर बीमारी पता थी और बताई नहीं गई, तो 60 महीने का कवर पूरा होने तक (अभी "+m+") बीमा कंपनी आपत्ति कर सकती है। ":"")+"पहले से मौजूद बीमारी वह है जिसका निदान या इलाज पॉलिसी शुरू होने से पहले के 36 महीनों में हुआ हो। पत्र में बीमा कंपनी से तारीख वाला रिकॉर्ड माँगा गया है।"),["pdef","mor"]);
  }
  if(r==="waiting"){
    if(m!==null&&m>=36) add("ok",B("No waiting period can apply after 36 months","36 महीने के बाद कोई प्रतीक्षा अवधि लागू नहीं हो सकती"),B("Specific waiting periods are capped at 36 months. You have "+m+" months of continuous cover.","विशेष प्रतीक्षा अवधि अधिकतम 36 महीने है। आपका लगातार कवर "+m+" महीने का है।"),["ped","pdef"]);
    else add("warn",B("Check the waiting period in your policy schedule","पॉलिसी शेड्यूल में प्रतीक्षा अवधि देखें"),B("Waiting periods are capped at 36 months, and ported cover counts. The letter asks the insurer to show how it counted.","प्रतीक्षा अवधि अधिकतम 36 महीने है और पोर्ट किया गया कवर भी गिना जाता है। पत्र में बीमा कंपनी से गिनती का तरीका माँगा गया है।"),["ped","pdef"]);
  }
  if(r==="roomrent") add(f.diffBilling==="no"?"ok":"info",B(f.diffBilling==="no"?"No proportionate deduction should apply":"Many deductions here are not allowed",f.diffBilling==="no"?"कोई आनुपातिक कटौती लागू नहीं होनी चाहिए":"यहाँ कई कटौतियाँ नियम के विरुद्ध हैं"),B("Proportionate deduction cannot touch medicines, consumables, implants, devices, diagnostics or ICU charges, and does not apply where the hospital charges the same whatever the room. Ask for the itemised deduction sheet.","आनुपातिक कटौती दवाइयों, कंज़्यूमेबल्स, इम्प्लांट, उपकरणों, जाँचों या ICU शुल्क पर नहीं हो सकती, और जहाँ हर कमरे के लिए शुल्क एक जैसे हों वहाँ लागू नहीं होती। मदवार कटौती विवरण माँगें।"),["room","diff"]);
  if(r==="notnecessary") add("info",B("Get a letter from the treating doctor","उपचार करने वाले डॉक्टर से पत्र लें"),B("A short certificate explaining why admission was needed is your best evidence. Attach it.","भर्ती क्यों ज़रूरी थी, यह बताने वाला छोटा प्रमाणपत्र आपका सबसे अच्छा सबूत है। इसे संलग्न करें।"),["crc"]);
  if(r==="documents") add("info",B("The insurer should not chase you for papers","बीमा कंपनी को आपसे कागज़ नहीं माँगने चाहिए"),B("IRDAI's 2024 circular says policyholders shall not be required to submit documents for claim settlement.","IRDAI के 2024 सर्कुलर के अनुसार दावा निपटान के लिए पॉलिसीधारक से दस्तावेज़ जमा करने की अपेक्षा नहीं की जाएगी।"),["hmc"]);
  if(r==="delay") add("info",B("Delay earns you interest","देरी पर आपको ब्याज मिलता है"),B("Insurers must pay interest at 2% above the bank rate on delayed claims, on their own.","देरी वाले दावों पर बीमा कंपनी को बैंक दर से 2% अधिक ब्याज स्वयं देना होता है।"),["int"]);
  if(r==="unknown") add("warn",B("The reason is not clear","कारण स्पष्ट नहीं है"),B("Every rejection must name the reason and the policy clause. The letter asks the insurer to state both.","हर अस्वीकृति में कारण और पॉलिसी क्लॉज़ बताना ज़रूरी है। पत्र में दोनों माँगे गए हैं।"),["crc"]);
  if(!c.partial&&r!=="delay"&&r!=="roomrent") add("info",B("A full rejection needs committee approval","पूरी अस्वीकृति के लिए समिति की मंज़ूरी ज़रूरी है"),B("IRDAI requires a Claims Review Committee to approve every rejection. The letter asks the insurer to confirm this.","IRDAI के अनुसार हर अस्वीकृति को दावा समीक्षा समिति की मंज़ूरी चाहिए। पत्र में इसकी पुष्टि माँगी गई है।"),["crc"]);
  if(f.grievance!=="yes") add("warn",B("First step: write to the insurer","पहला कदम: बीमा कंपनी को लिखें"),B("The Ombudsman only accepts your complaint after you have written to the insurer. Send letter 1 today and keep proof.","बीमा कंपनी को लिखने के बाद ही लोकपाल आपकी शिकायत स्वीकार करता है। आज ही पत्र 1 भेजें और सबूत रखें।"),["io"]);
  else if(c.ioFrom&&c.today<c.ioFrom) add("info",B("Ombudsman opens on "+fd(c.ioFrom,"en"),"लोकपाल का रास्ता "+fd(c.ioFrom,"hi")+" से खुलेगा"),B("You can go to the Ombudsman one month after writing to the insurer if there is no reply. If 14 days pass without a fix, you can also file on Bima Bharosa.","बीमा कंपनी को लिखने के एक महीने बाद, जवाब न मिलने पर, आप लोकपाल के पास जा सकते हैं। 14 दिन में हल न हो तो बीमा भरोसा पर भी शिकायत कर सकते हैं।"),["io","g14","bb"]);
  else if(c.ioBy&&c.today>c.ioBy) add("stop",B("The one-year Ombudsman window may have passed","लोकपाल की एक साल की समय-सीमा शायद निकल गई है"),B("The Ombudsman needs the complaint within one year. You may still be able to file at the Consumer Commission, which allows two years from the cause of action.","लोकपाल को शिकायत एक साल के भीतर चाहिए। उपभोक्ता आयोग में आप अब भी शिकायत कर सकते हैं, जहाँ दो साल की सीमा है।"),["io","cp69"]);
  else if(c.ioBy) add("ok",B("You can go to the Insurance Ombudsman now","आप अभी बीमा लोकपाल के पास जा सकते हैं"),B("It is free and its award binds the insurer. File by "+fd(c.ioBy,"en")+". Bima Bharosa does not forward your case there, so file with the Ombudsman directly.","यह मुफ़्त है और इसका फ़ैसला बीमा कंपनी पर बाध्यकारी है। "+fd(c.ioBy,"hi")+" तक शिकायत करें। बीमा भरोसा आपका मामला वहाँ नहीं भेजता, इसलिए सीधे लोकपाल के पास जाएँ।"),["io","iop","bbn"]);
  if(c.claim>5000000) add("stop",B("Claim above ₹50 lakh","₹50 लाख से अधिक का दावा"),B("The Insurance Ombudsman handles claims up to ₹50 lakh. Larger claims go to the Consumer Commission or court.","बीमा लोकपाल ₹50 लाख तक के दावे देखता है। बड़े दावे उपभोक्ता आयोग या अदालत में जाते हैं।"),["io","cpj"]);
  return out;
}

function healthLadder(f,c){
  var L=[], t=c.today;
  L.push({t:B("Insurer's decision","बीमा कंपनी का निर्णय"),d:B(c.reason==="delay"?"Claim still pending":"Letter received",c.reason==="delay"?"दावा अभी लंबित":"पत्र मिला"),date:c.rej,st:"done"});
  if(f.grievance==="yes"){
    L.push({t:B("You wrote to the insurer","आपने बीमा कंपनी को लिखा"),d:B("Grievance officer must resolve within 14 days","शिकायत अधिकारी को 14 दिन में हल करना है"),date:c.g,st:"done"});
    L.push({t:B("Insurer's reply due","बीमा कंपनी के जवाब की अंतिम तिथि"),d:B(!c.r?"No reply received":"Replied on "+fd(c.r,"en"),!c.r?"कोई जवाब नहीं मिला":fd(c.r,"hi")+" को जवाब मिला"),date:c.gResolveBy,st:c.r?"done":(c.gResolveBy&&t>c.gResolveBy?"missed":"now"),cal:!c.r&&c.gResolveBy&&c.gResolveBy>=t});
  } else L.push({t:B("Write to the insurer (letter 1)","बीमा कंपनी को लिखें (पत्र 1)"),d:B("Do this now. Email the grievance officer and keep the reply.","यह अभी करें। शिकायत अधिकारी को ईमेल करें और जवाब संभालकर रखें।"),date:t,st:"now"});
  L.push({t:B("Bima Bharosa (letter 2)","बीमा भरोसा (पत्र 2)"),d:B("Optional, if no fix within 14 days. Portal, 155255 or 1800 4254 732","वैकल्पिक, अगर 14 दिन में हल न हो। पोर्टल, 155255 या 1800 4254 732"),date:c.gResolveBy,st:(c.gResolveBy&&t>=c.gResolveBy)?"now":"later"});
  L.push({t:B("Insurance Ombudsman (letter 3)","बीमा लोकपाल (पत्र 3)"),d:B(c.ioFrom?"From "+fd(c.ioFrom,"en")+". Last date":"After you write to the insurer. Free, up to ₹50 lakh",c.ioFrom?fd(c.ioFrom,"hi")+" से। अंतिम तिथि":"बीमा कंपनी को लिखने के बाद। मुफ़्त, ₹50 लाख तक"),date:c.ioBy,st:!c.ioBy?"later":(t>c.ioBy?"missed":(t>=c.ioFrom?"now":"later")),cal:c.ioFrom&&c.ioFrom>t,calDate:c.ioFrom});
  L.push({t:B("Consumer Commission","उपभोक्ता आयोग"),d:B("If the Ombudsman does not help. e-jagriti.gov.in, within two years","अगर लोकपाल से मदद न मिले। e-jagriti.gov.in, दो साल के भीतर"),date:c.ccBy,st:(c.ccBy&&t>c.ccBy)?"missed":"later"});
  return L;
}

/* ---------- BANK ---------- */
var CH={upi_p2p:{en:"UPI transfer",hi:"UPI ट्रांसफ़र",tat:1,fail:"the amount was not credited to the beneficiary",failh:"राशि लाभार्थी के खाते में जमा नहीं हुई"},
  upi_merchant:{en:"UPI payment to a merchant",hi:"दुकानदार को UPI भुगतान",tat:5,fail:"the merchant did not receive or confirm the payment",failh:"दुकानदार को भुगतान नहीं मिला या उसकी पुष्टि नहीं हुई"},
  imps:{en:"IMPS transfer",hi:"IMPS ट्रांसफ़र",tat:1,fail:"the amount was not credited to the beneficiary",failh:"राशि लाभार्थी के खाते में जमा नहीं हुई"},
  atm:{en:"ATM withdrawal",hi:"ATM निकासी",tat:5,fail:"the ATM did not dispense the cash",failh:"ATM से नकद नहीं निकला"},
  card_pos:{en:"card payment at a shop terminal",hi:"दुकान की मशीन पर कार्ड भुगतान",tat:5,fail:"the merchant did not receive the payment",failh:"दुकानदार को भुगतान नहीं मिला"},
  card_online:{en:"online card payment",hi:"ऑनलाइन कार्ड भुगतान",tat:5,fail:"the merchant did not confirm the payment",failh:"दुकानदार ने भुगतान की पुष्टि नहीं की"}};

function bankCalc(f){
  var c={}; c.today=today(); c.issue=known(f.issue)?f.issue:"other";
  c.txn=pd(f.txnDate);
  c.learnt=c.issue==="unauth"?pd(f.learnt):null; c.rep=c.issue==="unauth"?pd(f.reported):null;
  c.comp=f.complained==="yes"?pd(f.complaintDate):null;
  c.r=(f.complained==="yes"&&known(f.reply)&&f.reply!=="none")?pd(f.replyDate):null;
  c.ch=CH[f.channel]||null; c.amt=+f.amount||0;
  c.tatDue=(c.txn&&c.ch)?addD(c.txn,c.ch.tat):null;
  c.wd=(c.learnt&&c.rep)?wdBetween(c.learnt,c.rep):null;
  c.shadowBy=c.rep?addWD(c.rep,10):null; c.resolveBy=c.rep?addD(c.rep,90):null;
  c.ioFrom=null; c.ioBy=null;
  if(c.comp){ var exp=addD(c.comp,30); if(c.r){ c.ioFrom=c.r; c.ioBy=addD(maxD(exp,c.r),90); } else { c.ioFrom=exp; c.ioBy=addD(exp,90); } }
  c.new2027=c.txn&&c.txn>=new Date(2027,0,1);
  c.bank=findBank(f.bank);
  return c;
}
function chName(c,lang){ return c.ch?c.ch[lang]:(lang==="hi"?"इलेक्ट्रॉनिक भुगतान":"electronic payment"); }
function bankBody(f,c,lang){
  var hi=lang==="hi", acct=v(f,"acct4","XXXX"), ref=v(f,"txnRef",hi?"[संदर्भ संख्या]":"[reference]");
  if(c.issue==="failed"){
    var tat=c.ch?c.ch.tat:5;
    if(hi) return "मेरा खाता/कार्ड, जिसके अंतिम चार अंक "+acct+" हैं, आपके बैंक में है। "+fd(c.txn,"hi")+" को "+chName(c,"hi")+" (संदर्भ "+ref+") द्वारा मेरे खाते से "+ra(c.amt,"hi")+" काटे गए, लेकिन "+(c.ch?c.ch.failh:"लेनदेन पूरा नहीं हुआ")+"। आज तक यह राशि वापस नहीं हुई है।\n\nRBI के 20 सितंबर 2019 के परिपत्र RBI/2019-20/67 (विफल लेनदेन के लिए टर्नअराउंड टाइम और ग्राहक मुआवज़ा) के अनुसार ऐसी राशि T+"+tat+" दिन के भीतर अपने आप लौटाई जानी चाहिए, और उसके बाद हर दिन की देरी के लिए बैंक को ₹100 का मुआवज़ा ग्राहक के खाते में बिना माँगे जमा करना होता है।\n\nकृपया "+ra(c.amt,"hi")+" तुरंत लौटाएँ और देय मुआवज़ा मेरे खाते में जमा करें।";
    return "I hold the account or card ending "+acct+" with your bank. On "+fd(c.txn,"en")+", "+ra(c.amt,"en")+" was debited from my account through a "+chName(c,"en")+" (reference "+ref+"), but "+(c.ch?c.ch.fail:"the transaction did not complete")+". The amount has not been reversed as of today.\n\nUnder RBI circular RBI/2019-20/67 dated 20 September 2019 on turnaround time and customer compensation for failed transactions, such an amount must be reversed automatically within T+"+tat+" day"+(tat>1?"s":"")+", and for each day of delay after that the bank must credit ₹100 to the customer's account without the customer having to claim it.\n\nPlease reverse "+ra(c.amt,"en")+" immediately and credit the compensation due.";
  }
  if(c.issue==="unauth"){
    var zero=c.wd!==null&&c.wd<=3;
    if(hi) return "मेरा खाता/कार्ड, जिसके अंतिम चार अंक "+acct+" हैं, आपके बैंक में है। "+fd(c.txn,"hi")+" को "+chName(c,"hi")+" (संदर्भ "+ref+") द्वारा मेरे खाते से "+ra(c.amt,"hi")+" काटे गए। यह लेनदेन न मैंने किया और न इसकी अनुमति दी।"+(f.shared==="no"?" मैंने अपना OTP, PIN या पासवर्ड किसी से साझा नहीं किया।":"")+" मुझे इसकी जानकारी "+fd(c.learnt,"hi")+" को मिली और मैंने "+fd(c.rep,"hi")+" को बैंक को सूचित किया।\n\nअनधिकृत इलेक्ट्रॉनिक बैंकिंग लेनदेन में ग्राहक की देयता सीमित करने पर RBI के निर्देशों (6 जुलाई 2017) के अनुसार "+(zero?"बैंक के अलर्ट के तीन कार्य दिवसों के भीतर सूचना देने पर मेरी देयता शून्य है। ":"")+"सूचना मिलने के 10 कार्य दिवसों के भीतर बैंक को यह राशि मेरे खाते में जमा (शैडो रिवर्सल) करनी होती है, शिकायत का निपटारा 90 दिनों में होना चाहिए, और ग्राहक की किसी भी देयता को सिद्ध करने का दायित्व बैंक पर है।\n\nकृपया "+ra(c.amt,"hi")+" मेरे खाते में जमा करें, आगे के अनधिकृत लेनदेन रोकें और अपनी जाँच का परिणाम लिखित में दें।";
    return "I hold the account or card ending "+acct+" with your bank. On "+fd(c.txn,"en")+", "+ra(c.amt,"en")+" was debited from my account through a "+chName(c,"en")+" (reference "+ref+"). I did not make or authorise this transaction."+(f.shared==="no"?" I did not share my OTP, PIN or password with anyone.":"")+" I learnt of it on "+fd(c.learnt,"en")+" and reported it to the bank on "+fd(c.rep,"en")+".\n\nUnder RBI's directions on limiting customer liability in unauthorised electronic banking transactions (6 July 2017), "+(zero?"as I reported within three working days of the bank's alert, my liability is zero. ":"")+"The bank must credit the amount to my account (shadow reversal) within 10 working days of my report, resolve the complaint within 90 days, and the burden of proving any customer liability lies with the bank.\n\nPlease credit "+ra(c.amt,"en")+" to my account, block any further unauthorised debits, and send me the result of your investigation in writing.";
  }
  var d=v(f,"otherDesc",hi?"[समस्या का विवरण]":"[describe the problem]");
  if(hi) return "मेरा खाता/कार्ड, जिसके अंतिम चार अंक "+acct+" हैं, आपके बैंक में है। मेरी शिकायत इस प्रकार है:\n\n"+d+"\n\nकृपया इस समस्या का समाधान करें और मुझे लिखित उत्तर दें।";
  return "I hold the account or card ending "+acct+" with your bank. My complaint is as follows:\n\n"+d+"\n\nPlease resolve this and reply to me in writing.";
}
function bankAddressee(c,lang){
  var b=c.bank, L=[];
  var p=b&&(b.pno||null);
  if(p&&p.name) L.push(p.name);
  L.push(lang==="hi"?"प्रधान नोडल अधिकारी / शिकायत अधिकारी":"The Principal Nodal Officer / Grievance Officer");
  L.push(b?b.name:(lang==="hi"?"[बैंक]":"[Bank]"));
  if(p&&p.address) L.push(p.address);
  if(p&&p.email) L.push((lang==="hi"?"ईमेल: ":"Email: ")+p.email);
  return L.join("\n");
}
function bankLetters(f,c){
  var td=c.today, bk=c.bank?c.bank.name:v(f,"bankName","[Bank]"), bkh=c.bank?c.bank.name:v(f,"bankName","[बैंक]");
  var sub_en=c.issue==="failed"?"Subject: Reversal of failed transaction of "+ra(c.amt,"en")+" dated "+fd(c.txn,"en"):c.issue==="unauth"?"Subject: Unauthorised transaction of "+ra(c.amt,"en")+" dated "+fd(c.txn,"en"):"Subject: Complaint about deficiency in service";
  var sub_hi=c.issue==="failed"?"विषय: "+fd(c.txn,"hi")+" के विफल लेनदेन ("+ra(c.amt,"hi")+") की राशि वापस करने हेतु शिकायत":c.issue==="unauth"?"विषय: "+fd(c.txn,"hi")+" के अनधिकृत लेनदेन ("+ra(c.amt,"hi")+") के विरुद्ध शिकायत":"विषय: बैंक सेवा में कमी की शिकायत";
  var b_en=["To",bankAddressee(c,"en"),"",sub_en,"","Dear Sir or Madam,","",bankBody(f,c,"en"),"","Please reply in writing within 30 days. If I do not receive a satisfactory reply, I will approach the RBI Ombudsman under the Reserve Bank - Integrated Ombudsman Scheme, 2026.","",signoff(f,"en",td)].join("\n");
  var b_hi=["सेवा में",bankAddressee(c,"hi"),"",sub_hi,"","महोदय/महोदया,","",bankBody(f,c,"hi"),"","कृपया 30 दिनों के भीतर लिखित उत्तर दें। संतोषजनक उत्तर न मिलने पर मुझे रिज़र्व बैंक - एकीकृत लोकपाल योजना, 2026 के अंतर्गत RBI लोकपाल से संपर्क करना पड़ेगा।","",signoff(f,"hi",td)].join("\n");
  var cm_en=c.comp?("I complained to the bank in writing on "+fd(c.comp,"en")+(f.bankRef?" (reference "+f.bankRef+")":"")+". "+(!c.r?"I received no reply within 30 days.":"The bank's reply dated "+fd(c.r,"en")+" did not resolve the matter.")):"[Complain to the bank in writing first. Add the date and reference here.]";
  var cm_hi=c.comp?("मैंने "+fd(c.comp,"hi")+" को बैंक को लिखित शिकायत की"+(f.bankRef?" (संदर्भ "+f.bankRef+")":"")+"। "+(!c.r?"30 दिनों में कोई उत्तर नहीं मिला।":fd(c.r,"hi")+" के बैंक के उत्तर से समस्या हल नहीं हुई।")):"[पहले बैंक को लिखित शिकायत करें। यहाँ तारीख और संदर्भ जोड़ें।]";
  var o_en=["Paste this into the complaint form on cms.rbi.org.in, or email it to crpc@rbi.org.in. Help line: 14448.","",
    "Complaint under the Reserve Bank - Integrated Ombudsman Scheme, 2026 against "+bk+".","","Facts: "+(c.issue==="other"?v(f,"otherDesc","[describe the problem]"):bankBody(f,c,"en").split("\n\n")[0]),"","Complaint to the bank: "+cm_en,"",
    "Deficiency in service: "+(c.issue==="failed"?"The bank did not reverse the failed transaction within the RBI turnaround time and did not pay the compensation due.":c.issue==="unauth"?"The bank did not credit the amount of the unauthorised transaction as required by RBI's directions on customer liability.":"The bank did not resolve my complaint."),"",
    "Relief sought: "+(c.issue==="other"?"direct the bank to resolve the problem described above":"refund of "+ra(c.amt,"en")+(c.issue==="failed"?" with compensation of ₹100 for each day of delay as per RBI/2019-20/67":""))+", and compensation for loss of time and harassment as the Ombudsman thinks fit.","",
    "Declaration: I am filing this complaint myself. The matter is not pending before any court, tribunal or other forum.","",v(f,"name","[name]")+(f.phone?", "+f.phone:"")+(f.email?", "+f.email:"")].join("\n");
  var o_hi=["इसे cms.rbi.org.in के शिकायत फ़ॉर्म में चिपकाएँ, या crpc@rbi.org.in पर ईमेल करें। हेल्पलाइन 14448।","",
    bkh+" के विरुद्ध रिज़र्व बैंक - एकीकृत लोकपाल योजना, 2026 के अंतर्गत शिकायत।","","तथ्य: "+(c.issue==="other"?v(f,"otherDesc","[समस्या का विवरण]"):bankBody(f,c,"hi").split("\n\n")[0]),"","बैंक को शिकायत: "+cm_hi,"",
    "सेवा में कमी: "+(c.issue==="failed"?"बैंक ने RBI द्वारा तय समय में विफल लेनदेन की राशि वापस नहीं की और देय मुआवज़ा नहीं दिया।":c.issue==="unauth"?"बैंक ने ग्राहक देयता पर RBI के निर्देशों के अनुसार अनधिकृत लेनदेन की राशि जमा नहीं की।":"बैंक ने मेरी शिकायत का समाधान नहीं किया।"),"",
    "माँगी गई राहत: "+(c.issue==="other"?"बैंक को ऊपर बताई गई समस्या हल करने का निर्देश":ra(c.amt,"hi")+" की वापसी"+(c.issue==="failed"?", RBI/2019-20/67 के अनुसार हर दिन की देरी के लिए ₹100 मुआवज़े सहित":""))+", और समय की हानि व परेशानी के लिए लोकपाल जो उचित समझें वह मुआवज़ा।","",
    "घोषणा: यह शिकायत मैं स्वयं दर्ज कर रहा/रही हूँ। यह मामला किसी न्यायालय, अधिकरण या अन्य मंच पर लंबित नहीं है।","",v(f,"name","[नाम]")+(f.phone?", "+f.phone:"")+(f.email?", "+f.email:"")].join("\n");
  var cur=f.complained!=="yes"?0:((c.ioBy&&c.today>c.ioBy)?-1:((c.ioFrom&&c.today>=c.ioFrom)?1:-1));
  var bto=c.bank&&c.bank.pno&&c.bank.pno.email?c.bank.pno.email:null;
  return {cur:cur,def:cur<0?1:cur,list:[{t:B("1. Complaint to the bank","1. बैंक को शिकायत"),en:b_en,hi:b_hi,to:bto},{t:B("2. RBI Ombudsman complaint","2. RBI लोकपाल शिकायत"),en:o_en,hi:o_hi,to:"crpc@rbi.org.in"}]};
}
function bankChecks(f,c){
  var out=[]; function add(k,t,b,s){ out.push({k:k,t:t,b:b,s:s||[]}); }
  if(c.issue==="failed"&&c.txn&&c.ch){
    var late=daysBetween(c.tatDue,c.today);
    add("info",B("Check your UPI app first","पहले अपने UPI ऐप में देखें"),B("Raise the problem in the app's help or dispute section too, with the UTR number. NPCI's order is: app, then bank, then RBI Ombudsman.","ऐप के हेल्प या डिस्प्यूट सेक्शन में भी UTR नंबर के साथ शिकायत करें। NPCI का क्रम है: ऐप, फिर बैंक, फिर RBI लोकपाल।"),["npci"]);
    if(late>0) add("ok",B("Reversal is "+late+" day"+(late>1?"s":"")+" overdue","राशि लौटाने में "+late+" दिन की देरी"),B("For a "+c.ch.en+", RBI sets T+"+c.ch.tat+" for auto-reversal ("+fd(c.tatDue,"en")+"). After that the bank owes ₹100 for each day of delay, credited without you asking.",c.ch.hi+" के लिए RBI ने अपने आप वापसी की सीमा T+"+c.ch.tat+" ("+fd(c.tatDue,"hi")+") तय की है। इसके बाद बैंक को हर दिन की देरी के लिए ₹100 बिना माँगे देने होते हैं।"),["tat"]);
    else add("info",B("Auto-reversal due by "+fd(c.tatDue,"en"),"अपने आप वापसी की अंतिम तिथि "+fd(c.tatDue,"hi")),B("RBI sets T+"+c.ch.tat+" for this type of payment. If it is not back by then, the bank owes ₹100 for each day of delay.","इस तरह के भुगतान के लिए RBI ने T+"+c.ch.tat+" तय किया है। तब तक पैसा न लौटे तो बैंक को हर दिन ₹100 देने होंगे।"),["tat"]);
  }
  if(c.issue==="unauth"){
    add("stop",B("Block the card or UPI now and call 1930","अभी कार्ड या UPI ब्लॉक करें और 1930 पर कॉल करें"),B("Block the card or account in your bank app, and report the fraud on 1930 or cybercrime.gov.in. Speed matters for recovery.","बैंक ऐप में कार्ड या खाता ब्लॉक करें, और 1930 या cybercrime.gov.in पर धोखाधड़ी की शिकायत करें। जल्दी करने से पैसा वापस मिलने की संभावना बढ़ती है।"),[]);
    if(c.new2027) add("warn",B("New RBI fraud rules apply to this transaction","इस लेनदेन पर RBI के नए धोखाधड़ी नियम लागू हैं"),B("Transactions from 1 January 2027 fall under RBI's revised framework. Complain to the bank at once; the letter below still applies.","1 जनवरी 2027 से हुए लेनदेन RBI के संशोधित नियमों के अंतर्गत आते हैं। तुरंत बैंक को शिकायत करें; नीचे का पत्र तब भी उपयोगी है।"),["l27"]);
    else if(c.wd===null) add("info",B("Add the alert date and report date","अलर्ट और शिकायत की तारीख जोड़ें"),B("How fast you reported decides your liability.","आपने कितनी जल्दी शिकायत की, इसी से आपकी देयता तय होती है।"),["lia"]);
    else if(c.wd<=3) add("ok",B("Reported within "+c.wd+" working day"+(c.wd===1?"":"s"),c.wd+" कार्य दिवस में शिकायत की"),B("If the fraud was not caused by your negligence, reporting within three working days of the bank's alert means zero liability. The bank must credit the amount within 10 working days of your report"+(c.shadowBy?" (by "+fd(c.shadowBy,"en")+")":"")+".","अगर धोखाधड़ी आपकी लापरवाही से नहीं हुई, तो बैंक के अलर्ट के तीन कार्य दिवसों में शिकायत करने पर आपकी देयता शून्य है। बैंक को आपकी शिकायत के 10 कार्य दिवसों में राशि जमा करनी है"+(c.shadowBy?" ("+fd(c.shadowBy,"hi")+" तक)":"")+"।"),["lia"]);
    else if(c.wd<=7) add("warn",B("Reported in "+c.wd+" working days: limited liability",c.wd+" कार्य दिवस में शिकायत: सीमित देयता"),B("Reporting in four to seven working days caps your liability per transaction: ₹5,000 for basic savings accounts, ₹10,000 for most savings accounts and credit cards up to ₹5 lakh, ₹25,000 for others. The bank must still prove any liability.","चार से सात कार्य दिवस में शिकायत करने पर प्रति लेनदेन देयता सीमित है: बेसिक बचत खाते में ₹5,000, अधिकांश बचत खातों और ₹5 लाख तक के क्रेडिट कार्ड में ₹10,000, अन्य में ₹25,000। देयता साबित करना फिर भी बैंक का काम है।"),["lia"]);
    else add("warn",B("Reported after more than seven working days","सात कार्य दिवस से अधिक बाद शिकायत"),B("Your liability then depends on the bank's own board-approved policy. Ask for a copy of that policy in your complaint.","तब आपकी देयता बैंक की अपनी नीति पर निर्भर है। अपनी शिकायत में उस नीति की प्रति माँगें।"),["lia"]);
    if(f.shared==="yes") add("warn",B("Sharing an OTP or PIN weakens the claim","OTP या PIN साझा करने से दावा कमज़ोर होता है"),B("Losses caused by a customer's negligence fall on the customer until the fraud is reported. Still complain: the bank must prove negligence.","ग्राहक की लापरवाही से हुआ नुकसान शिकायत करने तक ग्राहक पर पड़ता है। फिर भी शिकायत करें: लापरवाही साबित करना बैंक का काम है।"),["lia","l27"]);
  }
  if(c.bank&&c.bank.status==="in_liquidation") add("stop",B(c.bank.name+" is being wound up",c.bank.name+" बंद होने की प्रक्रिया में है"),B("RBI cancelled its licence in April 2026 and a liquidator has been appointed. Its old complaint channels may not respond. File with the RBI Ombudsman and keep all records.","RBI ने अप्रैल 2026 में इसका लाइसेंस रद्द किया और लिक्विडेटर नियुक्त हुआ है। पुराने शिकायत चैनल शायद जवाब न दें। RBI लोकपाल के पास शिकायत करें और सभी रिकॉर्ड रखें।"),["ios"]);
  if(f.court==="yes") add("stop",B("RBI Ombudsman will not accept this","RBI लोकपाल इसे स्वीकार नहीं करेगा"),B("A complaint already pending before a court, tribunal or other forum is not maintainable under the scheme.","किसी अदालत, अधिकरण या अन्य मंच पर लंबित मामले की शिकायत योजना के तहत स्वीकार नहीं होती।"),["ios","iosb"]);
  if(f.advocate==="yes") add("stop",B("File it yourself, not through a lawyer","शिकायत स्वयं करें, वकील के माध्यम से नहीं"),B("Complaints filed through an advocate are listed as not maintainable under the 2026 scheme.","2026 की योजना में वकील के माध्यम से दायर शिकायत स्वीकार नहीं होती।"),["iosk"]);
  if(f.complained!=="yes") add("warn",B("Will RBI accept it? Not yet","क्या RBI इसे स्वीकार करेगा? अभी नहीं"),B("Almost half of all RBI complaints rejected in 2024-25 were rejected because the person had not complained to the bank first. Send letter 1 today and keep the reference number.","2024-25 में RBI ने जितनी शिकायतें अस्वीकार कीं, उनमें से लगभग आधी इसलिए क्योंकि व्यक्ति ने पहले बैंक को शिकायत नहीं की थी। आज ही पत्र 1 भेजें और संदर्भ संख्या रखें।"),["ios","rbiar"]);
  else if(c.ioFrom&&c.today<c.ioFrom) add("info",B("Will RBI accept it? From "+fd(c.ioFrom,"en"),"क्या RBI स्वीकार करेगा? "+fd(c.ioFrom,"hi")+" से"),B("The bank has 30 days to reply. If it does not, or you are not satisfied, you can file with the RBI Ombudsman. You then have 90 days.","बैंक के पास जवाब देने के लिए 30 दिन हैं। जवाब न आए या आप संतुष्ट न हों, तो RBI लोकपाल के पास शिकायत करें। इसके लिए 90 दिन मिलते हैं।"),["ios"]);
  else if(c.ioBy&&c.today>c.ioBy) add("stop",B("The 90-day RBI window has passed","RBI की 90 दिन की समय-सीमा निकल गई"),B("Under the 2026 scheme, the complaint must reach RBI within 90 days of the bank's deadline or last reply ("+fd(c.ioBy,"en")+"). The Consumer Commission is still open to you.","2026 की योजना में बैंक की समय-सीमा या आख़िरी जवाब के 90 दिन के भीतर ("+fd(c.ioBy,"hi")+") RBI को शिकायत करनी होती है। उपभोक्ता आयोग का रास्ता अब भी खुला है।"),["ios","iosk","cpj"]);
  else if(c.ioBy&&f.court!=="yes"&&f.advocate!=="yes") add("ok",B("Will RBI accept it? Yes, file by "+fd(c.ioBy,"en"),"क्या RBI स्वीकार करेगा? हाँ, "+fd(c.ioBy,"hi")+" तक शिकायत करें"),B("You complained to the bank and the 30 days are over or it replied. Under the 2026 scheme you have 90 days. Older guides online still say one year; that rule ended on 1 July 2026.","आपने बैंक को शिकायत की और 30 दिन पूरे हो गए या जवाब आ गया। 2026 की योजना में आपके पास 90 दिन हैं। इंटरनेट पर पुरानी जानकारी में अब भी एक साल लिखा है; वह नियम 1 जुलाई 2026 को खत्म हो गया।"),["ios","iosk"]);
  return out;
}
function bankLadder(f,c){
  var L=[], t=c.today;
  if(c.txn) L.push({t:B(c.issue==="failed"?"Failed transaction":"Transaction",c.issue==="failed"?"विफल लेनदेन":"लेनदेन"),d:B(ra(c.amt,"en"),ra(c.amt,"hi")),date:c.txn,st:"done"});
  if(c.issue==="failed"&&c.tatDue) L.push({t:B("Auto-reversal deadline","अपने आप वापसी की अंतिम तिथि"),d:B("₹100 per day of delay after this","इसके बाद हर दिन की देरी पर ₹100"),date:c.tatDue,st:t>c.tatDue?"missed":"now"});
  if(c.issue==="unauth"&&c.rep){ L.push({t:B("Reported to bank","बैंक को सूचना दी"),d:B(c.wd!==null?c.wd+" working days after the alert":"",c.wd!==null?"अलर्ट के "+c.wd+" कार्य दिवस बाद":""),date:c.rep,st:"done"}); L.push({t:B("Money back in your account (shadow credit) due","खाते में राशि जमा (शैडो क्रेडिट) की अंतिम तिथि"),d:B("While the bank investigates","जब तक बैंक जाँच करे"),date:c.shadowBy,st:t>c.shadowBy?"missed":"now",cal:c.shadowBy>=t}); }
  if(f.complained==="yes"){ var e30=c.comp?addD(c.comp,30):null; L.push({t:B("Written complaint to the bank","बैंक को लिखित शिकायत"),d:B(f.bankRef?"Reference "+f.bankRef:"",f.bankRef?"संदर्भ "+f.bankRef:""),date:c.comp,st:"done"}); L.push({t:B("Bank's 30 days end","बैंक के 30 दिन पूरे"),d:B(!c.r?"No reply yet":"Replied on "+fd(c.r,"en"),!c.r?"अभी जवाब नहीं":fd(c.r,"hi")+" को जवाब"),date:e30,st:c.r?"done":(e30&&t>e30?"missed":"now"),cal:!c.r&&e30&&e30>=t}); }
  else L.push({t:B("Complain to the bank in writing (letter 1)","बैंक को लिखित शिकायत (पत्र 1)"),d:B("Do this now. Email, app or portal. Keep the reference number","यह अभी करें। ईमेल, ऐप या पोर्टल। संदर्भ संख्या रखें"),date:t,st:"now"});
  L.push({t:B("RBI Ombudsman (letter 2)","RBI लोकपाल (पत्र 2)"),d:B(c.ioFrom?"From "+fd(c.ioFrom,"en")+". Last date":"After the bank's 30 days. cms.rbi.org.in or 14448",c.ioFrom?fd(c.ioFrom,"hi")+" से। अंतिम तिथि":"बैंक के 30 दिन बाद। cms.rbi.org.in या 14448"),date:c.ioBy,st:!c.ioBy?"later":(t>c.ioBy?"missed":(t>=c.ioFrom?"now":"later")),cal:c.ioBy&&c.ioBy>=t});
  L.push({t:B("Consumer Commission","उपभोक्ता आयोग"),d:B("If needed. e-jagriti.gov.in, within two years","ज़रूरत हो तो। e-jagriti.gov.in, दो साल के भीतर"),date:null,st:"later"});
  return L;
}

/* ---------- public ---------- */
function plan(mod,f){
  if(mod==="health"){ var c=healthCalc(f); return {c:c,checks:healthChecks(f,c),ladder:healthLadder(f,c),letters:healthLetters(f,c)}; }
  var b=bankCalc(f); return {c:b,checks:bankChecks(f,b),ladder:bankLadder(f,b),letters:bankLetters(f,b)};
}
window.HAQ_RULES={plan:plan,SRC:SRC,REASON:REASON,CH:CH,fd:fd,pd:pd,iso:iso,today:today,addD:addD,rs:rs,words:words,officesForState:officesForState,findInsurer:findInsurer,findBank:findBank,contacts:contacts,RULES_CHECKED:RULES_CHECKED};
})();

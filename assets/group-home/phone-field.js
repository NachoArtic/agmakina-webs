/* Selector de país para TODOS los teléfonos de agmakinagroup.com (intl-tel-input).
   Una sola pieza: cualquier <input type="tel"> de la página (también los que se pintan después)
   recibe bandera + prefijo, país detectado por IP (España si no se detecta), buscador y
   validación. Al enviar, el valor del campo pasa a E.164 (+34600...) antes de que lo lea el
   formulario, así GHL y el aviso de lead reciben siempre el prefijo. No toca el honeypot.
   Quitar de un campo: data-no-iti. */
(function(){
  if(window.AgPhone) return;
  var V="24.6.0", B="https://cdn.jsdelivr.net/npm/intl-tel-input@"+V+"/build/";
  var ES=/^es/i.test(document.documentElement.lang||"");
  var MSG=ES?"Ese teléfono no parece correcto para el país elegido.":"That phone number doesn't look right for the selected country.";
  var items=new WeakMap(), loading=null, country=null;

  var css=
  ".iti{width:100%;display:block}.iti input.iti__tel-input{width:100%}"+
  "input.agp-bad{border-color:#e8873a!important}"+
  ".agp-err{display:block;margin:6px 0 0;font-size:13px;line-height:1.35;color:#e8873a}"+
  ".iti__search-input{font-size:16px}"+
  "@media(max-width:600px){.iti__country-list{max-width:calc(100vw - 64px)}}"+
  "html.agp-dark .iti{--iti-dropdown-bg:#1d1812;--iti-hover-color:rgba(255,255,255,.07);--iti-border-color:rgba(255,255,255,.14);--iti-dialcode-color:#a89f94;--iti-arrow-color:#a89f94}"+
  "html.agp-dark .iti__dropdown-content,html.agp-dark .iti--fullscreen-popup .iti__dropdown-content{background:#1d1812;color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:10px;box-shadow:0 20px 50px -20px #000}"+
  "html.agp-dark .iti__country-name{color:#fff}html.agp-dark .iti__dial-code{color:#a89f94}"+
  "html.agp-dark .iti__search-input{background:#14110d;color:#fff;border:0;border-bottom:1px solid rgba(255,255,255,.14);border-radius:0}";
  var st=document.createElement("style"); st.textContent=css; document.head.appendChild(st);

  function load(cb){
    if(window.intlTelInput) return cb();
    if(loading) return loading.push(cb);
    loading=[cb];
    var l=document.createElement("link"); l.rel="stylesheet"; l.href=B+"css/intlTelInput.css"; document.head.appendChild(l);
    var s=document.createElement("script"); s.src=B+"js/intlTelInputWithUtils.min.js";
    s.onload=function(){ var q=loading; loading=null; q.forEach(function(f){f();}); };
    document.head.appendChild(s);
  }
  function lum(c){ var m=(c||"").match(/\d+(\.\d+)?/g); if(!m) return 0; return (0.299*m[0]+0.587*m[1]+0.114*m[2])/255; }
  function geo(ok){
    if(country) return ok(country);
    var done=false; function fin(c){ if(done) return; done=true; country=c||"es"; ok(country); }
    setTimeout(function(){ fin("es"); },2500);
    fetch("https://get.geojs.io/v1/ip/country.json").then(function(r){return r.json();}).then(function(d){ fin((d.country||"").toLowerCase()); }).catch(function(){ fin("es"); });
  }
  function attach(inp){
    if(items.has(inp) || inp.hasAttribute("data-no-iti")) return;
    items.set(inp,null);
    if(lum(getComputedStyle(inp).color)>0.6) document.documentElement.classList.add("agp-dark");
    inp.removeAttribute("placeholder");
    load(function(){
      var iti=window.intlTelInput(inp,{
        initialCountry:"auto", separateDialCode:true, strictMode:true, nationalMode:true,
        countryOrder:["es","gb","de","fr","it","pt","nl","ch","au","id"],
        geoIpLookup:function(ok){ geo(ok); }
      });
      items.set(inp,iti);
      inp.addEventListener("input",function(){ clear(inp); });
    });
  }
  function errEl(inp){
    var box=inp.closest(".iti")||inp, n=box.nextElementSibling;
    if(!n||!n.classList||!n.classList.contains("agp-err")){ n=document.createElement("small"); n.className="agp-err"; box.parentNode.insertBefore(n,box.nextSibling); }
    return n;
  }
  function clear(inp){ inp.classList.remove("agp-bad"); var box=inp.closest(".iti")||inp, n=box.nextElementSibling; if(n&&n.classList&&n.classList.contains("agp-err")) n.textContent=""; }

  /* Captura el submit antes que los manejadores de cada formulario */
  document.addEventListener("submit",function(e){
    var f=e.target; if(!f||!f.querySelectorAll) return;
    var ins=f.querySelectorAll('input[type="tel"]');
    for(var i=0;i<ins.length;i++){
      var inp=ins[i], iti=items.get(inp); if(!iti||!inp.value.trim()) continue;
      if(!iti.isValidNumber()){
        e.preventDefault(); e.stopImmediatePropagation();
        inp.classList.add("agp-bad"); errEl(inp).textContent=MSG; inp.focus(); return;
      }
    }
    for(var j=0;j<ins.length;j++){
      (function(inp){
        var iti=items.get(inp); if(!iti||!inp.value.trim()) return;
        var shown=inp.value; inp.value=iti.getNumber();
        setTimeout(function(){ inp.value=shown; },0);
      })(ins[j]);
    }
  },true);

  function scan(){ var a=document.querySelectorAll('input[type="tel"]'); for(var i=0;i<a.length;i++) attach(a[i]); }
  window.AgPhone={scan:scan};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",scan); else scan();
  new MutationObserver(function(){ scan(); }).observe(document.documentElement,{childList:true,subtree:true});
})();

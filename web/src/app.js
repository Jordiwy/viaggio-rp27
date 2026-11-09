
(function(){
  /* ---------- Countdown ---------- */
  var target=new Date("2027-02-25T17:00:00+01:00").getTime();
  var D=document.getElementById("cd-d"),H=document.getElementById("cd-h"),M=document.getElementById("cd-m");
  function pad(n){return n<10?"0"+n:""+n;}
  function tick(){var d=target-Date.now();
    if(d<=0){document.getElementById("cd").innerHTML='<div><b>¡Nos vamos!</b><span>el viaje ha empezado</span></div>';return;}
    D.textContent=Math.floor(d/864e5);H.textContent=pad(Math.floor(d%864e5/36e5));M.textContent=pad(Math.floor(d%36e5/6e4));}
  tick();setInterval(tick,20000);

  /* ---------- Tabs ---------- */
  var tabs=[].slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  var ids=["jueves","viernes","sabado","domingo"];
  function select(id,focus){if(window.__onDay)window.__onDay(id);tabs.forEach(function(t){var on=t.getAttribute("aria-controls")===id;
    t.setAttribute("aria-selected",on);t.tabIndex=on?0:-1;document.getElementById(t.getAttribute("aria-controls")).hidden=!on;if(on&&focus)t.focus();});}
  tabs.forEach(function(t,i){
    t.addEventListener("click",function(){select(t.getAttribute("aria-controls"));});
    t.addEventListener("keydown",function(e){var n=null;
      if(e.key==="ArrowRight")n=(i+1)%tabs.length;else if(e.key==="ArrowLeft")n=(i-1+tabs.length)%tabs.length;else if(e.key==="Home")n=0;else if(e.key==="End")n=tabs.length-1;
      if(n!==null){e.preventDefault();select(ids[n],true);}});
  });
  function fromHash(){var h=location.hash.slice(1);if(ids.indexOf(h)>-1){select(h);return true;}return false;}
  if(!fromHash()){var now=new Date(),day={25:0,26:1,27:2,28:3}[now.getDate()];
    if(now.getFullYear()===2027&&now.getMonth()===1&&day!==undefined)select(ids[day]);}
  window.addEventListener("hashchange",fromHash);

  /* ---------- Map por días (coordenadas reales proyectadas) ---------- */
  var NS="http://www.w3.org/2000/svg",svg=document.getElementById("mapsvg");
  function el(tag,a,parent){var e=document.createElementNS(NS,tag);for(var k in a)e.setAttribute(k,a[k]);(parent||svg).appendChild(e);return e;}
  function gm(q){return "https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(q);}
  var CITY={lon0:12.4485,lat0:41.9135,k:10000};
  var REGION={lon0:12.2,lat0:42.02,k:250};
  function proj(v,lat,lon){return [(lon-v.lon0)*v.k,(v.lat0-lat)*v.k*1.343];}
  var HOME={n:"Casa",lat:41.89408,lon:12.5028};
  /* ---------- Plan de cada día (editable) ---------- */
  var DAYIDS=["jueves","viernes","sabado","domingo"],SHORT={jueves:"jue",viernes:"vie",sabado:"sab",domingo:"dom"},LONG={jue:"jueves",vie:"viernes",sab:"sabado",dom:"domingo"};
  var PLAN_DEF={
    jueves:[
      {id:"j1",t:"17:00",n:"Vuelo a Roma",p:"Unas dos horas. Aterrizaje sobre las 19:00.",fx:1},
      {id:"j2",t:"19:30",n:"Leonardo Express a Termini",p:"32 minutos sin paradas desde Fiumicino.",fx:1},
      {id:"j3",t:"20:30",n:"Llegada a casa",p:"Diez minutos andando desde Termini. Dejamos maletas y salimos.",fx:1},
      {id:"j4",t:"21:00",n:"Primera cena en Monti",p:"La elegimos entre los dos en «Lo decidimos entre los dos».",hl:1,lat:41.89412,lon:12.48945,q:"Via della Madonna dei Monti, Roma",dx:-10,dy:-10,a:"end"},
      {id:"j5",t:"22:30",n:"Piazza della Madonna dei Monti",p:"La plaza con fuente donde se junta el barrio por la noche.",lat:41.8946,lon:12.4908,q:"Piazza della Madonna dei Monti, Roma",dx:10,dy:-10},
      {id:"j6",t:"23:00",n:"Coliseo iluminado",p:"Bajando por Via dei Fori Imperiali, con los Foros a los lados. Sin gente y con luz dorada.",hl:1,k:"colnoche",lat:41.8902,lon:12.4922,q:"Colosseo, Roma",dx:12,dy:16}],
    viernes:[
      {id:"v1",t:"09:00",n:"Coliseo",p:"Con entrada reservada a primera hora (abre a las 8:30), antes de que llegue la gente. Cierra a las 16:30.",hl:1,k:"colosseo",lat:41.8902,lon:12.4922,q:"Colosseo, Roma",dx:12,dy:14},
      {id:"v2",t:"10:30",n:"Palatino y Foro Romano",p:"Incluidos en la misma entrada. Subimos primero al Palatino: desde arriba se ve todo el Foro.",lat:41.8908,lon:12.4864,q:"Foro Romano, Roma",dx:8,dy:22},
      {id:"v3",t:"12:30",n:"Campidoglio",p:"La plaza que diseñó Miguel Ángel. Detrás, una terraza con la mejor vista gratis del Foro.",lat:41.8934,lon:12.4828,q:"Piazza del Campidoglio, Roma",dx:12,dy:14},
      {id:"v4",t:"13:00",n:"Vittoriano",p:"El gran monumento blanco de Piazza Venezia. Sus escalinatas se suben gratis.",k:"vittoriano",lat:41.8946,lon:12.4831,q:"Vittoriano, Roma",dx:6,dy:-14},
      {id:"v5",t:"13:30",n:"Comida en el Gueto judío",p:"Junto al Pórtico de Octavia. Hay que probar las alcachofas a la judía, fritas y crujientes.",k:"ghetto",lat:41.8925,lon:12.4775,q:"Portico d'Ottavia, Roma",dx:-2,dy:22,a:"middle"},
      {id:"v6",t:"15:00",n:"Panteón",p:"Casi 1.900 años y la cúpula sigue abierta al cielo.",k:"pantheon",lat:41.8986,lon:12.4769,q:"Pantheon, Roma",dx:12,dy:4},
      {id:"v7",t:"15:45",n:"Piazza Navona",p:"La Fuente de los Cuatro Ríos de Bernini, sobre el antiguo estadio de Domiciano.",k:"navona",lat:41.8992,lon:12.4731,q:"Piazza Navona, Roma",dx:-12,dy:-8,a:"end"},
      {id:"v8",t:"16:15",n:"Campo de' Fiori",p:"Un café en la plaza antes de volver a casa.",k:"campo",lat:41.8956,lon:12.4722,q:"Campo de' Fiori, Roma",dx:-12,dy:6,a:"end"},
      {id:"v9",t:"17:00",n:"Descanso en casa",p:"Para recargar y arreglarse.",fx:1},
      {id:"v10",t:"19:30",n:"Noche sorpresa",p:"Más abajo están las pistas. Nada más.",hl:1,fx:1}],
    sabado:[
      {id:"s1",t:"06:40",n:"Andando a Termini",p:"Diez minutos desde casa.",fx:1},
      {id:"s2",t:"07:00",n:"Frecciarossa a Nápoles",p:"Unos 70 minutos. Cappuccino a bordo.",fx:1},
      {id:"s3",t:"08:30",n:"Circumvesuviana a Pompei Scavi",p:"Unos 35 minutos desde Napoli Garibaldi.",fx:1},
      {id:"s4",t:"09:30",n:"Pompeya",p:"Por Porta Marina: Foro, termas, la Casa del Fauno, el anfiteatro y los moldes de yeso, con el Vesubio de fondo. Cierra a las 17:00 y el último acceso es a las 15:30.",hl:1,fx:1},
      {id:"s5",t:"14:30",n:"Vuelta a Nápoles",p:"Circumvesuviana hasta Garibaldi.",fx:1},
      {id:"s6",t:"15:30",n:"Spaccanapoli",p:"La calle recta que parte en dos el centro histórico. Ropa tendida, motos y altarcitos en cada esquina.",lat:40.8484,lon:14.2550,q:"Spaccanapoli, Napoli"},
      {id:"s7",t:"16:15",n:"Via San Gregorio Armeno",p:"La calle de los belenes artesanos, abiertos todo el año.",lat:40.8507,lon:14.2577,q:"Via San Gregorio Armeno, Napoli"},
      {id:"s8",t:"17:00",n:"Pizza en Via dei Tribunali",p:"La pizzería la votamos abajo.",hl:1,lat:40.8510,lon:14.2580,q:"Via dei Tribunali, Napoli"},
      {id:"s9",t:"19:00",n:"Tren de vuelta a Roma",p:"Una sfogliatella para el camino.",fx:1}],
    domingo:[
      {id:"d1",t:"07:40",n:"Metro A hasta Ottaviano",p:"Desde Vittorio Emanuele, delante de casa.",fx:1},
      {id:"d2",t:"08:00",n:"Plaza y Basílica de San Pedro",p:"Abre a las 7:00 y a esa hora casi no hay cola. La Piedad de Miguel Ángel, a la derecha al entrar.",hl:1,k:"sanpietro",lat:41.9022,lon:12.4539,q:"Basilica di San Pietro",dx:0,dy:24,a:"middle"},
      {id:"d3",t:"09:45",n:"Castel Sant'Angelo",p:"Por Via della Conciliazione y el Ponte Sant'Angelo, el puente de los ángeles de Bernini.",lat:41.9031,lon:12.4663,q:"Castel Sant'Angelo, Roma",dx:12,dy:-8},
      {id:"d4",t:"11:30",n:"Gianicolo",p:"Subida al mirador con toda Roma a los pies, cúpula a cúpula.",k:"gianicolo",lat:41.8913,lon:12.4613,q:"Terrazza del Gianicolo, Roma",dx:-12,dy:4,a:"end"},
      {id:"d5",t:"12:30",n:"Trastevere",p:"Santa Maria in Trastevere y sus mosaicos dorados, callejuelas con hiedra.",hl:1,k:"trastevere",lat:41.8894,lon:12.4703,q:"Piazza di Santa Maria in Trastevere",dx:-6,dy:22,a:"middle"},
      {id:"d6",t:"13:30",n:"Comida en Trastevere",p:"Carbonara de despedida.",lat:41.8894,lon:12.4703,q:"Trastevere, Roma"},
      {id:"d7",t:"15:00",n:"Isola Tiberina y Boca de la Verdad",p:"La isla en mitad del Tíber y, al otro lado, la máscara donde meter la mano.",k:"isola",lat:41.8906,lon:12.4775,q:"Isola Tiberina, Roma",dx:10,dy:-10},
      {id:"d8",t:"16:00",n:"Fontana di Trevi",p:"Moneda de espaldas a la fuente. Acercarse al borde cuesta 2 € hasta las 22:00; después es gratis.",hl:1,k:"trevi",lat:41.9009,lon:12.4833,q:"Fontana di Trevi, Roma",dx:12,dy:4},
      {id:"d9",t:"16:45",n:"Piazza di Spagna",p:"Los 135 escalones de la Escalinata hasta Trinità dei Monti.",k:"spagna",lat:41.9058,lon:12.4823,q:"Piazza di Spagna, Roma",dx:12,dy:6},
      {id:"d10",t:"17:30",n:"Atardecer en el Pincio",p:"La terraza sobre Piazza del Popolo. La última foto del viaje.",hl:1,k:"pincio",lat:41.9113,lon:12.4778,q:"Terrazza del Pincio, Roma",dx:-12,dy:-8,a:"end"},
      {id:"d11",t:"Noche",n:"Vuelo de vuelta",p:"Leonardo Express desde Termini con margen: el último sale a las 23:05.",fx:1}]
  };
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function itin(day){var m=(typeof mine==="object"&&mine)||{},a=m["it_"+day];return clone(Array.isArray(a)?a:PLAN_DEF[day]);}
  function tval(t){var m=/^(\d{1,2}):(\d\d)$/.exec(t||"");return m?(+m[1])*60+(+m[2]):1440;}
  function fmt(v){v=Math.max(0,Math.min(1435,v));return (v<600?"0":"")+Math.floor(v/60)+":"+(v%60<10?"0":"")+v%60;}
  function sortIt(a){return a.map(function(x,i){return [x,i];}).sort(function(p,q){return (tval(p[0].t)-tval(q[0].t))||(p[1]-q[1]);}).map(function(p){return p[0];});}
  function isDefault(day){return !Array.isArray((typeof mine==="object"&&mine||{})["it_"+day]);}
  function store(day,a){mine["it_"+day]=sortIt(a);}
  function hav(a,b){var R=6371,toR=Math.PI/180,dLa=(b.lat-a.lat)*toR,dLo=(b.lon-a.lon)*toR;
    var x=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(a.lat*toR)*Math.cos(b.lat*toR)*Math.sin(dLo/2)*Math.sin(dLo/2);return 2*R*Math.asin(Math.sqrt(x));}
  function dayView(day){var B=DAYS[day];if(day==="sabado")return B;
    var stops=itin(day).filter(function(it){return it.lat!=null&&!it.fx;}).map(function(it){return {n:it.n,d:it.t,lat:it.lat,lon:it.lon,q:it.q||(it.n+", Roma"),dx:it.dx,dy:it.dy,a:it.a};});
    var pts=[B.start||HOME].concat(stops);if(B.loop)pts.push(HOME);var km=0;for(var i=1;i<pts.length;i++)km+=hav(pts[i-1],pts[i])*1.25;
    return Object.assign({},B,{stops:stops,sub:B.sub.replace(/unos [\d,]+ km/,"unos "+Math.max(1,Math.round(km))+" km")});}
  var DAYS={
    jueves:{t:"Jueves 25",sub:"Paseo de bienvenida · unos 3 km",view:CITY,loop:true,stops:[
      {n:"Cena en Monti",d:"21:00 · Taverna Romana u otra",lat:41.89412,lon:12.48945,q:"Via della Madonna dei Monti, Roma",dx:-10,dy:-10,a:"end"},
      {n:"Piazza della Madonna dei Monti",d:"22:30 · la plaza del barrio",lat:41.8946,lon:12.4908,q:"Piazza della Madonna dei Monti, Roma",dx:10,dy:-10},
      {n:"Coliseo iluminado",d:"23:00 · por Via dei Fori Imperiali",lat:41.8902,lon:12.4922,q:"Colosseo, Roma",dx:12,dy:16}]},
    viernes:{t:"Viernes 26",sub:"Roma antigua y centro · unos 9 km",view:CITY,loop:true,stops:[
      {n:"Coliseo",d:"09:00",lat:41.8902,lon:12.4922,q:"Colosseo, Roma",dx:12,dy:14},
      {n:"Palatino",d:"10:30",lat:41.8892,lon:12.4875,q:"Palatino, Roma",dx:6,dy:20},
      {n:"Foro Romano",d:"11:30",lat:41.8925,lon:12.4853,q:"Foro Romano, Roma",dx:14,dy:12},
      {n:"Campidoglio y Vittoriano",d:"12:30",lat:41.8940,lon:12.4828,q:"Piazza del Campidoglio, Roma",dx:6,dy:-14},
      {n:"Gueto judío",d:"13:30 · comida",lat:41.8925,lon:12.4775,q:"Portico d'Ottavia, Roma",dx:-2,dy:22,a:"middle"},
      {n:"Panteón",d:"15:00",lat:41.8986,lon:12.4769,q:"Pantheon, Roma",dx:12,dy:4},
      {n:"Piazza Navona",d:"15:45",lat:41.8992,lon:12.4731,q:"Piazza Navona, Roma",dx:-12,dy:-8,a:"end"},
      {n:"Campo de' Fiori",d:"16:15 · café",lat:41.8956,lon:12.4722,q:"Campo de' Fiori, Roma",dx:-12,dy:6,a:"end"}]},
    sabado:{t:"Sábado 27",sub:"Roma → Pompeya → Nápoles · en tren",view:REGION,loop:false,start:{n:"Roma Termini",lat:41.9010,lon:12.5011},stops:[
      {n:"Nápoles",d:"08:15 · llegada a Napoli Centrale en Frecciarossa",lat:40.8530,lon:14.2720,q:"Napoli Centrale",dx:-16,dy:-12,a:"end"},
      {n:"Pompei Scavi",d:"09:30 · Porta Marina",lat:40.7486,lon:14.4846,q:"Pompei Scavi, Porta Marina",dx:-14,dy:24,a:"end"},
      {n:"Spaccanapoli y Tribunali",d:"15:30 · paseo y pizza",lat:40.8484,lon:14.2550,q:"Via dei Tribunali, Napoli",dx:-12,dy:20,a:"end"},
      {n:"Roma Termini",d:"19:00 · tren de vuelta",lat:41.9010,lon:12.5011,q:"Roma Termini",dx:12,dy:4}]},
    domingo:{t:"Domingo 28",sub:"Vaticano, Trastevere y centro · unos 11 km",view:CITY,loop:false,start:{n:"Metro Ottaviano",lat:41.9086,lon:12.4585},stops:[
      {n:"San Pedro",d:"08:00",lat:41.9022,lon:12.4539,q:"Basilica di San Pietro",dx:0,dy:24,a:"middle"},
      {n:"Castel Sant'Angelo",d:"09:45",lat:41.9031,lon:12.4663,q:"Castel Sant'Angelo, Roma",dx:12,dy:-8},
      {n:"Gianicolo",d:"11:00 · mirador",lat:41.8913,lon:12.4613,q:"Terrazza del Gianicolo, Roma",dx:-12,dy:4,a:"end"},
      {n:"Trastevere",d:"12:00 · y comida",lat:41.8894,lon:12.4703,q:"Piazza di Santa Maria in Trastevere",dx:-6,dy:22,a:"middle"},
      {n:"Isola Tiberina",d:"15:00",lat:41.8906,lon:12.4775,q:"Isola Tiberina, Roma",dx:10,dy:-10},
      {n:"Boca de la Verdad",d:"15:20",lat:41.8881,lon:12.4815,q:"Bocca della Verità, Roma",dx:12,dy:14},
      {n:"Fontana di Trevi",d:"16:00",lat:41.9009,lon:12.4833,q:"Fontana di Trevi, Roma",dx:12,dy:4},
      {n:"Piazza di Spagna",d:"16:45",lat:41.9058,lon:12.4823,q:"Piazza di Spagna, Roma",dx:12,dy:6},
      {n:"Pincio",d:"17:30 · atardecer",lat:41.9113,lon:12.4778,q:"Terrazza del Pincio, Roma",dx:-12,dy:-8,a:"end"}]}
  };
  var tiber=[[41.9300,12.4680],[41.9200,12.4690],[41.9113,12.4728],[41.9062,12.4740],[41.9040,12.4697],[41.9016,12.4665],[41.8996,12.4654],[41.8960,12.4660],[41.8924,12.4705],[41.8913,12.4735],[41.8906,12.4777],[41.8886,12.4796],[41.8840,12.4775],[41.8812,12.4743],[41.8700,12.4720]];
  var mapDay="jueves",list=document.getElementById("places"),wrap=document.getElementById("mapwrap");
  function pathOf(v,pts,smooth){var q=pts.map(function(p){return proj(v,p.lat,p.lon);});
    if(!smooth||q.length<3)return q.map(function(c,i){return (i?"L":"M")+c[0].toFixed(1)+" "+c[1].toFixed(1);}).join(" ");
    var d="M"+q[0][0].toFixed(1)+" "+q[0][1].toFixed(1);
    for(var i=1;i<q.length;i++){var a=q[i-1],b=q[i],mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2,dx=b[0]-a[0],dy=b[1]-a[1];
      d+=" Q"+(mx-dy*.12).toFixed(1)+" "+(my+dx*.12).toFixed(1)+" "+b[0].toFixed(1)+" "+b[1].toFixed(1);}
    return d;}
  function drawMap(day){
    mapDay=day;var D=dayView(day),v=D.view;
    var cls={jueves:"jueves",viernes:"viernes",sabado:"sabado",domingo:"domingo"};
    wrap.id="mapwrap";wrap.setAttribute("data-day",day);
    var col=getComputedStyle(document.getElementById(day)).getPropertyValue("--day").trim()||"#ccc";
    var ink=getComputedStyle(document.getElementById(day)).getPropertyValue("--day-ink").trim()||"#555";
    wrap.style.setProperty("--day",col);wrap.style.setProperty("--day-ink",ink);
    while(svg.firstChild)svg.removeChild(svg.firstChild);
    el("rect",{x:0,y:0,width:600,height:480,fill:"var(--map-land)"});
    if(v===CITY){
      [[41.9095,12.4830,41.9135,12.4990],[41.8890,12.4855,41.8840,12.4920],[41.8925,12.4935,41.8895,12.4990],[41.8935,12.4560,41.8870,12.4640]].forEach(function(r){var a=proj(v,r[0],r[1]),b=proj(v,r[2],r[3]);
        el("rect",{x:Math.min(a[0],b[0]),y:Math.min(a[1],b[1]),width:Math.abs(b[0]-a[0]),height:Math.abs(b[1]-a[1]),rx:12,fill:"var(--map-park)"});});
      el("path",{d:pathOf(v,tiber.map(function(t){return {lat:t[0],lon:t[1]};}),false),"class":"tiber"});
      var tl=proj(v,41.9150,12.4700);var t=el("text",{x:tl[0]+12,y:tl[1],"class":"lbl-water"});t.textContent="Tevere";
    }else{
      // costa tirrena aproximada y Vesubio
      var coast=[[42.05,11.95],[41.73,12.27],[41.45,12.62],[41.22,13.05],[41.25,13.55],[41.02,13.85],[40.83,14.08],[40.83,14.25],[40.75,14.42],[40.63,14.40],[40.55,14.30],[40.40,14.95],[40.20,15.30]];
      var d=coast.map(function(c,i){var q=proj(v,c[0],c[1]);return (i?"L":"M")+q[0].toFixed(1)+" "+q[1].toFixed(1);}).join(" ")+" L 0 480 L 0 0 Z";
      el("path",{d:d,fill:"var(--map-water)",opacity:.75});
      var vs=proj(v,40.8213,14.4260);el("path",{d:"M"+(vs[0]-22)+" "+(vs[1]+10)+"L"+vs[0]+" "+(vs[1]-14)+"L"+(vs[0]+22)+" "+(vs[1]+10)+"Z",fill:"var(--map-park)"});
      var vt=el("text",{x:vs[0],y:vs[1]-22,"text-anchor":"middle","class":"lbl-water"});vt.textContent="Vesubio";
      var sea=proj(v,41.0,12.85);var st=el("text",{x:sea[0],y:sea[1],"class":"lbl-water"});st.textContent="Mar Tirreno";
    }
    var start=D.start||HOME,pts=[start].concat(D.stops);if(D.loop)pts=pts.concat([HOME]);
    var dpath=pathOf(v,pts,v===CITY);
    el("path",{d:dpath,"class":"route-halo"});
    el("path",{d:dpath,"class":"route",stroke:col});
    // start marker
    var s0=proj(v,start.lat,start.lon),g0=el("a",{href:gm(start===HOME?"Piazza Vittorio Emanuele II, Roma":start.n+", Roma"),target:"_blank","class":"stop home"});
    el("circle",{cx:s0[0],cy:s0[1],r:9,stroke:ink},g0);
    var l0=el("text",{x:s0[0]+13,y:s0[1]+4,"class":"l"},g0);l0.textContent=start===HOME?"Casa":start.n;
    var drawn=[];
    D.stops.forEach(function(p,i){
      if(D.start&&i===D.stops.length-1&&p.lat===D.start.lat)return;
      var q=proj(v,p.lat,p.lon);
      for(var k=0;k<drawn.length;k++){var o=drawn[k];if(Math.hypot(o.x-q[0],o.y-q[1])<14){o.n.textContent+="·"+(i+1);o.c.setAttribute("r",15);return;}}
      var g=el("a",{href:gm(p.q),target:"_blank","class":"stop"});
      var ti=document.createElementNS(NS,"title");ti.textContent=(i+1)+". "+p.n;g.appendChild(ti);
      el("circle",{cx:q[0],cy:q[1],r:11,fill:col},g);
      var n=el("text",{x:q[0],y:q[1]+.5,"class":"n"},g);n.textContent=i+1;drawn.push({x:q[0],y:q[1],n:n,c:g.querySelector("circle")});
      var l=el("text",{x:q[0]+(p.dx||12),y:q[1]+(p.dy||4),"text-anchor":p.a||"start","class":"l"},g);l.textContent=p.n;});
    /* Encuadre: acercar el mapa a las paradas del día (sin pasarse de zoom) */
    if(v!==CITY)svg.setAttribute("viewBox","0 0 600 480");else (function(){var qs=pts.map(function(p){return proj(v,p.lat,p.lon);});var xs=qs.map(function(q){return q[0];}),ys=qs.map(function(q){return q[1];});
      var x0=Math.min.apply(0,xs)-250,x1=Math.max.apply(0,xs)+220,y0=Math.min.apply(0,ys)-60,y1=Math.max.apply(0,ys)+90;
      var w=Math.max(x1-x0,480),h=Math.max(y1-y0,384);if(w/h>1.25)h=w/1.25;else w=h*1.25;
      var cx=(x0+x1)/2,cy=(y0+y1)/2;svg.setAttribute("viewBox",(cx-w/2).toFixed(1)+" "+(cy-h/2).toFixed(1)+" "+w.toFixed(1)+" "+h.toFixed(1));
      var bg=svg.querySelector("rect");if(bg){bg.setAttribute("x",-2000);bg.setAttribute("y",-2000);bg.setAttribute("width",5000);bg.setAttribute("height",5000);}})();
    document.getElementById("map-title").textContent=D.t;document.getElementById("map-sub").textContent=D.sub;
    list.innerHTML="";
    D.stops.forEach(function(p,i){var li=document.createElement("li"),a=document.createElement("a");a.href=gm(p.q);a.target="_blank";a.rel="noopener";
      a.innerHTML='<span class="n"></span><span><b></b><small></small></span><span class="go" aria-hidden="true">↗</span>';
      a.querySelector(".n").textContent=i+1;a.querySelector("b").textContent=p.n;a.querySelector("small").textContent=p.d;li.appendChild(a);list.appendChild(li);});
    [].forEach.call(document.querySelectorAll("#daychips .chip"),function(c){c.setAttribute("aria-pressed",c.getAttribute("data-day")===day);});
    tint(day);
  }
  [].forEach.call(document.querySelectorAll("#daychips .chip"),function(c){c.addEventListener("click",function(){drawMap(c.getAttribute("data-day"));});});
  window.__onDay=function(day){drawMap(day);};
  function tint(day){var c=getComputedStyle(document.getElementById(day)).getPropertyValue("--day").trim();if(c)document.documentElement.style.setProperty("--tint",c);}
  drawMap(document.querySelector('.tabs [role="tab"][aria-selected="true"]').getAttribute("aria-controls"));

  /* ---------- Decisions ---------- */
  var DEC=[
    {k:"cena",when:"Jueves · 21:00",t:"Primera cena en Roma",o:[
      {k:"taverna",n:"Taverna Romana",s:"Trattoria clásica de Monti, pequeña y siempre llena. Hay que reservar.",q:"Taverna Romana, Via della Madonna dei Monti 79, Roma"},
      {k:"taglio",n:"Pizza al taglio y paseo",s:"Algo rápido por Monti y a dar una vuelta hasta el Coliseo iluminado."},
      {k:"casa",n:"Cena tranquila en casa",s:"Embutido, queso y vino de un alimentari del barrio, sin prisas."}]},
    {k:"pizza",when:"Sábado · Nápoles",t:"¿Qué pizzería?",o:[
      {k:"dimatteo",n:"Antica Pizzeria Di Matteo",s:"Via dei Tribunali 94. Clásica, ruidosa y con frittatine en la puerta.",q:"Antica Pizzeria Di Matteo, Napoli"},
      {k:"donnasofia",n:"Donna Sofia ai Tribunali",s:"Via dei Tribunali 89. Pizza y cocina napolitana con mesas en la calle.",q:"Pizzeria Donna Sofia ai Tribunali, Napoli"},
      {k:"sorbillo",n:"Gino e Toto Sorbillo",s:"Via dei Tribunali 32. La más famosa de la calle, con pizzas que se salen del plato.",q:"Gino e Toto Sorbillo, Via dei Tribunali 32, Napoli"}]},
    {k:"domingo",when:"Domingo · mañana",t:"¿Entramos en algo?",o:[
      {k:"cupula",n:"Subir a la cúpula de San Pedro",s:"551 escalones (o ascensor hasta la mitad) y Roma entera desde arriba.",q:"Cupola di San Pietro"},
      {k:"castel",n:"Castel Sant'Angelo por dentro",s:"Mausoleo, fortaleza y prisión. La terraza de arriba es la de Tosca.",q:"Castel Sant'Angelo, Roma"},
      {k:"fuera",n:"Todo por fuera, más paseo",s:"Sin colas ni entradas: más tiempo para Trastevere y el Gianicolo."}]},
    {k:"gelato",when:"Cualquier noche",t:"Nuestro gelato",o:[
      {k:"angeletto",n:"Gelateria dell'Angeletto",s:"En Monti, junto a la plaza. Pistacho y avellana muy recomendados.",q:"Gelateria dell'Angeletto, Roma"},
      {k:"fatamorgana",n:"Fatamorgana Monti",s:"Piazza degli Zingari. Sabores originales y naturales.",q:"Fatamorgana Monti, Roma"},
      {k:"comeillatte",n:"Come il Latte",s:"Cerca de Termini. Cremoso, con chocolate caliente o nata en el cucurucho.",q:"Come il Latte, Via Silvio Spaventa, Roma"}]}
  ];
  var Sync=window.Sync,mine=Sync.mine||{},all={},uid=null,profiles={};
  function applyEveryone(){var e=Sync.everyone();all=e.all;profiles=e.profiles;uid=e.uid;}
  applyEveryone();
  var host=document.getElementById("decisions");
  function initials(n){n=(n||"").trim();if(!n)return "?";var p=n.split(/\s+/);return (p[0][0]+(p[1]?p[1][0]:"")).toUpperCase();}
  function render(){
    if(window.__ideasReady){renderIdeas();renderSel();renderPlans();drawMap(mapDay);}
    host.innerHTML="";
    DEC.forEach(function(dc){
      var box=document.createElement("article");box.className="decision";
      var h=document.createElement("header");h.innerHTML="<span></span><h2></h2>";h.querySelector("span").textContent=dc.when;h.querySelector("h2").textContent=dc.t;box.appendChild(h);
      dc.o.forEach(function(op){
        var b=document.createElement("button");b.className="opt";b.type="button";b.setAttribute("aria-pressed",mine[dc.k]===op.k);
        b.innerHTML='<span class="radio" aria-hidden="true"></span><span><b></b><small></small></span><span class="who"></span>';
        b.querySelector("b").textContent=op.n;b.querySelector("small").textContent=op.s;
        var who=b.querySelector(".who");
        Object.keys(all).forEach(function(id){var c=all[id]&&all[id][dc.k];if(c!==op.k)return;var pf=profiles[id]||{};
          var s=document.createElement("span");s.style.background=pf.color||"var(--rosso)";s.textContent=pf.isMe?"Tú":initials(pf.name||"");s.title=pf.isMe?"Tu elección":(pf.name||"Alguien");if(pf.isMe)s.style.fontSize="10px";who.appendChild(s);});
        b.addEventListener("click",function(){choose(dc.k,op.k);});
        var row=document.createElement("div");row.className="opt-row";row.appendChild(b);
        var a=document.createElement("button");a.type="button";a.className="opt-info";a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg><span>Info</span>';a.setAttribute("aria-label","Fotos y más información sobre "+op.n);
        a.addEventListener("click",function(){openOpt(dc.k,op.k);});row.appendChild(a);box.appendChild(row);
      });
      host.appendChild(box);
    });
  }
  var status=document.getElementById("vote-status");
  function setStatus(txt,live){status.querySelector("span").textContent=txt;status.classList.toggle("live",!!live);var ss=document.getElementById("save-state");if(ss){ss.querySelector("span").textContent=txt;ss.classList.toggle("ok",!!live);}}
  function save(){if(uid)all[uid]=Object.assign({},mine);Sync.push(mine);}
  var STATUS={idle:["Guardado. Lo veis los dos al momento.",true],saving:["Guardando…",true],offline:["Sin conexión. Se guardará en cuanto vuelva.",false],error:["No se ha podido guardar el último cambio.",false]};
  Sync.on("status",function(st){var x=STATUS[st]||STATUS.idle;setStatus(x[0],x[1]);});
  function choose(k,o){mine[k]=o;if(uid){all[uid]=Object.assign({},mine);}render();save();}
  render();
  setStatus(STATUS[Sync.status==="offline"?"offline":"idle"][0],Sync.status!=="offline");



  /* ---------- Toda Roma ---------- */
  var CATS=[["todo","Todo"],["top","Imprescindibles"],["arte","Arte e iglesias"],["vistas","Miradores"],["gratis","Gratis"],["lluvia","Si llueve"],["noche","De noche"],["comer","Comer"],["fuera","Escapadas"]];
  var DAYC={jue:["Jueves","var(--d-jue)"],vie:["Viernes","var(--d-vie)"],sab:["Sábado","var(--d-sab)"],dom:["Domingo","var(--d-dom)"]};
  var IDEAS=[
    {k:"colosseo",c:["top"],n:"Coliseo, Foro y Palatino",d:"El corazón de la Roma antigua. Una sola entrada para los tres, con hora reservada.",lat:41.8902,lon:12.4922,price:"Entrada con reserva",plan:"vie"},
    {k:"colnoche",c:["noche","gratis"],n:"Coliseo iluminado",d:"De noche, sin gente y con luz dorada. Se baja por Via dei Fori Imperiali.",lat:41.8902,lon:12.4922,price:"Gratis",plan:"jue"},
    {k:"vaticani",c:["top","arte","lluvia"],n:"Museos Vaticanos y Capilla Sixtina",d:"Tres o cuatro horas de arte hasta llegar al techo de Miguel Ángel. Con reserva; el domingo 28 abren gratis de 9 a 14 h, sin reserva y con mucha cola.",lat:41.9065,lon:12.4536,price:"De pago, con reserva"},
    {k:"sanpietro",c:["top","arte","gratis"],n:"Basílica de San Pedro",d:"La Piedad de Miguel Ángel y el baldaquino de Bernini. A primera hora casi no hay cola.",lat:41.9022,lon:12.4539,price:"Gratis",plan:"dom"},
    {k:"cupola",c:["vistas"],n:"Subir a la cúpula de San Pedro",d:"551 escalones, o ascensor hasta la mitad, y Roma entera desde arriba.",lat:41.9022,lon:12.4539,price:"De pago"},
    {k:"pantheon",c:["top","arte","lluvia"],n:"Panteón",d:"Casi 1.900 años y la cúpula sigue abierta al cielo. Si llueve, la lluvia cae dentro.",lat:41.8986,lon:12.4769,price:"7 €",plan:"vie"},
    {k:"trevi",c:["top","noche"],n:"Fontana di Trevi",d:"Moneda de espaldas para volver. El borde cuesta 2 € hasta las 22:00; después es gratis y hay menos gente.",lat:41.9009,lon:12.4833,price:"2 € (gratis desde las 22:00)",plan:"dom"},
    {k:"navona",c:["top","gratis"],n:"Piazza Navona",d:"La Fuente de los Cuatro Ríos de Bernini, sobre el antiguo estadio de Domiciano.",lat:41.8992,lon:12.4731,price:"Gratis",plan:"vie"},
    {k:"spagna",c:["top","gratis"],n:"Piazza di Spagna y la Escalinata",d:"135 escalones hasta Trinità dei Monti. Sentarse en ellos está prohibido.",lat:41.9058,lon:12.4823,price:"Gratis",plan:"dom"},
    {k:"borghese",c:["arte","lluvia"],n:"Galleria Borghese",d:"Las esculturas de Bernini y seis Caravaggio en una villa. Solo con reserva y por turnos de dos horas.",lat:41.9142,lon:12.4922,price:"De pago, reserva obligatoria"},
    {k:"capitolini",c:["arte","lluvia"],n:"Museos Capitolinos",d:"La loba de Roma, el Marco Aurelio a caballo y una galería con vistas al Foro.",lat:41.8930,lon:12.4826,price:"De pago"},
    {k:"massimo",c:["arte","lluvia"],n:"Palazzo Massimo",d:"Frescos romanos reales, como el jardín pintado de la villa de Livia. Junto a Termini.",lat:41.9014,lon:12.4980,price:"De pago"},
    {k:"clemente",c:["arte","lluvia"],n:"San Clemente",d:"Tres iglesias una encima de otra, con un templo de Mitra en el sótano.",lat:41.8893,lon:12.4976,price:"Excavaciones de pago"},
    {k:"vincoli",c:["arte","gratis"],n:"San Pietro in Vincoli",d:"El Moisés de Miguel Ángel, en una iglesia tranquila de Monti.",lat:41.8937,lon:12.4931,price:"Gratis"},
    {k:"maggiore",c:["arte","gratis"],n:"Santa Maria Maggiore",d:"Mosaicos dorados del siglo V a cinco minutos de casa.",lat:41.8976,lon:12.4984,price:"Gratis"},
    {k:"ignazio",c:["arte","gratis","lluvia"],n:"Sant'Ignazio",d:"Una cúpula que no existe: está pintada. Mírala desde el disco del suelo.",lat:41.8991,lon:12.4799,price:"Gratis"},
    {k:"cappuccini",c:["arte","lluvia"],n:"Cripta de los Capuchinos",d:"Capillas decoradas con huesos de frailes. Curiosa y un poco tétrica.",lat:41.9045,lon:12.4885,price:"De pago"},
    {k:"domus",c:["arte"],n:"Domus Aurea",d:"El palacio de Nerón, bajo tierra. Abre de viernes a domingo, con reserva.",lat:41.8912,lon:12.4957,price:"De pago, con reserva"},
    {k:"caracalla",c:["arte"],n:"Termas de Caracalla",d:"Unas de las termas romanas mejor conservadas, con mosaicos en el suelo.",lat:41.8790,lon:12.4924,price:"De pago"},
    {k:"argentina",c:["gratis"],n:"Largo di Torre Argentina",d:"Donde mataron a Julio César. Hoy, templos y una colonia de gatos.",lat:41.8954,lon:12.4768,price:"Gratis"},
    {k:"aventino",c:["vistas","gratis"],n:"La cerradura del Aventino",d:"San Pedro enmarcado en el ojo de una cerradura, en Piazza dei Cavalieri di Malta.",lat:41.8830,lon:12.4785,price:"Gratis"},
    {k:"aranci",c:["vistas","gratis"],n:"Giardino degli Aranci",d:"Naranjos y uno de los mejores atardeceres de Roma, junto a la cerradura.",lat:41.8848,lon:12.4795,price:"Gratis"},
    {k:"gianicolo",c:["vistas","gratis"],n:"Gianicolo",d:"Toda Roma a los pies. Cada día a las 12:00 disparan un cañonazo.",lat:41.8913,lon:12.4613,price:"Gratis",plan:"dom"},
    {k:"pincio",c:["vistas","gratis"],n:"Pincio y Piazza del Popolo",d:"La terraza del atardecer sobre la plaza, con Villa Borghese detrás.",lat:41.9113,lon:12.4778,price:"Gratis",plan:"dom"},
    {k:"vittoriano",c:["vistas"],n:"Terraza del Vittoriano",d:"Ascensor panorámico al punto más alto del centro. Vista de los Foros al Vaticano.",lat:41.8946,lon:12.4831,price:"De pago",plan:"vie"},
    {k:"trastevere",c:["noche","comer"],n:"Trastevere",d:"Callejuelas con hiedra, Santa Maria in Trastevere y trattorias. De noche, el barrio con más vida.",lat:41.8894,lon:12.4703,price:"Gratis",plan:"dom"},
    {k:"campo",c:["comer","noche"],n:"Campo de' Fiori",d:"Mercado por la mañana, de lunes a sábado, y spritz en la plaza al caer la tarde.",lat:41.8956,lon:12.4722,price:"Gratis",plan:"vie"},
    {k:"ghetto",c:["comer"],n:"Gueto judío",d:"Alcachofas a la judía, crujientes, y la pastelería sin cartel de Via del Portico d'Ottavia.",lat:41.8925,lon:12.4775,price:"Comida",plan:"vie"},
    {k:"testaccio",c:["comer"],n:"Mercado de Testaccio",d:"Puestos de comida romana para picar de pie. Cerrado los domingos.",lat:41.8768,lon:12.4752,price:"Barato"},
    {k:"pasta",c:["comer","lluvia"],n:"Clase de pasta fresca",d:"Tres horas aprendiendo fettuccine y tiramisú, y luego os lo coméis.",lat:41.8946,lon:12.4908,price:"De pago, con reserva"},
    {k:"margutta",c:["gratis"],n:"Via Margutta",d:"La calle de los artistas donde vivía Gregory Peck en «Vacaciones en Roma».",lat:41.9083,lon:12.4800,price:"Gratis"},
    {k:"coppede",c:["gratis"],n:"Barrio Coppedè",d:"Un rincón de cuento, entre el modernismo y lo fantástico. Casi sin turistas.",lat:41.9184,lon:12.5040,price:"Gratis"},
    {k:"isola",c:["gratis"],n:"Isola Tiberina y Boca de la Verdad",d:"La isla en mitad del Tíber y la máscara donde meter la mano si no mientes.",lat:41.8906,lon:12.4775,price:"Gratis",plan:"dom"},
    {k:"appia",c:["fuera"],n:"Via Appia Antica y catacumbas",d:"La calzada romana entre pinos y tumbas, en bici o a pie. Medio día.",lat:41.8590,lon:12.5130,price:"Catacumbas de pago",far:"Bus o taxi"},
    {k:"ostia",c:["fuera"],n:"Ostia Antica",d:"La «Pompeya de Roma»: una ciudad portuaria entera. Medio día en tren regional.",lat:41.7556,lon:12.2919,price:"De pago",far:"40 min en tren"},
    {k:"tivoli",c:["fuera"],n:"Tivoli: Villa d'Este y Villa Adriana",d:"Jardines con cientos de fuentes y la villa del emperador Adriano. Día entero.",lat:41.9634,lon:12.7960,price:"De pago",far:"1 h en tren o bus"}
  ];
  function walkMin(lat,lon){var R=6371,toR=Math.PI/180,dLa=(lat-HOME.lat)*toR,dLo=(lon-HOME.lon)*toR;
    var a=Math.sin(dLa/2)*Math.sin(dLa/2)+Math.cos(HOME.lat*toR)*Math.cos(lat*toR)*Math.sin(dLo/2)*Math.sin(dLo/2);
    var km=2*R*Math.asin(Math.sqrt(a))*1.2;return Math.max(5,Math.round(km/4.6*60/5)*5);}
  var catSel="todo",fbox=document.getElementById("filters"),ibox=document.getElementById("ideas");
  CATS.forEach(function(c){var b=document.createElement("button");b.className="filter";b.type="button";b.dataset.cat=c[0];b.setAttribute("aria-pressed",c[0]==="todo");
    var n=c[0]==="todo"?IDEAS.length:IDEAS.filter(function(i){return i.c.indexOf(c[0])>-1;}).length;
    b.innerHTML="<span></span><small></small>";b.querySelector("span").textContent=c[1];b.querySelector("small").textContent=n;
    b.addEventListener("click",function(){catSel=c[0];[].forEach.call(fbox.children,function(x){x.setAttribute("aria-pressed",x===b);});renderIdeas();});fbox.appendChild(b);});
  var lastPop=null,showAll=false;
  document.getElementById("more").addEventListener("click",function(){showAll=true;renderIdeas();});
  var heart='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/></svg>';
  var noteEl=document.getElementById("note"),noteSt=document.getElementById("note-state"),noteT=null;
  noteEl.addEventListener("input",function(){clearTimeout(noteT);noteSt.textContent="Guardando…";noteT=setTimeout(function(){var v=noteEl.value.slice(0,1000);if(v)mine.note=v;else delete mine.note;save();noteSt.textContent="Guardado";},700);});
  /* Inicio: lo que falta por decidir */
  function renderTodo(){var pend=DEC.filter(function(d){return !mine[d.k];}),diff=DEC.filter(function(d){if(!mine[d.k])return false;
      return Object.keys(all).some(function(id){return id!==uid&&all[id]&&all[id][d.k]&&all[id][d.k]!==mine[d.k];});});
    var b=document.getElementById("badge");if(b){b.textContent=pend.length;b.hidden=!pend.length;}
    var card=document.getElementById("home-todo");if(!card)return;
    if(!pend.length&&!diff.length){card.hidden=true;return;}
    card.hidden=false;
    document.getElementById("todo-t").textContent=pend.length?("Te "+(pend.length===1?"falta 1 votación":"faltan "+pend.length+" votaciones")):("No coincidís en "+diff.length+(diff.length===1?" decisión":" decisiones"));
    document.getElementById("todo-s").textContent=(pend.length?pend:diff).map(function(d){return d.t;}).join(" · ");}
  function renderSel(){
    if(document.activeElement!==noteEl)noteEl.value=mine.note||"";
    var wl=document.getElementById("sel-wish"),vl=document.getElementById("sel-vote");if(!wl)return;
    wl.innerHTML="";vl.innerHTML="";var n=0;
    IDEAS.forEach(function(i){if(!mine["w_"+i.k])return;n++;var li=document.createElement("li");
      li.innerHTML='<img alt=""><span><b></b><small></small><span class="days" role="group"></span></span><button class="x" type="button">×</button>';
      li.querySelector("img").src="p-"+i.k+".jpg";li.querySelector("b").textContent=i.n;
      var cur=dayOf(i.k)||"";
      li.querySelector("small").textContent=cur?"El "+DAYC[cur][0].toLowerCase():"¿Qué día?";
      var dg=li.querySelector(".days");dg.setAttribute("aria-label","Día para "+i.n);
      ["jue","vie","sab","dom"].forEach(function(d){var bt=document.createElement("button");bt.type="button";bt.textContent=DAYC[d][0].slice(0,3);bt.style.setProperty("--c",DAYC[d][1]);bt.setAttribute("aria-pressed",cur===d);
        bt.addEventListener("click",function(){setDay(i.k,cur===d?null:d);});dg.appendChild(bt);});
      li.querySelector("b").style.cursor="pointer";li.querySelector("img").style.cursor="pointer";
      li.querySelector("b").addEventListener("click",function(){openDetail(i.k);});li.querySelector("img").addEventListener("click",function(){openDetail(i.k);});
      var x=li.querySelector(".x");x.setAttribute("aria-label","Quitar "+i.n);x.addEventListener("click",function(){delete mine["w_"+i.k];if(uid){all[uid]=Object.assign({},mine);}render();save();});wl.appendChild(li);});
    if(!n){wl.innerHTML='<li class="sel-empty" style="display:block;border:0">Todavía nada. Tocad el corazón en cualquier plan de «Todo lo que se puede hacer».</li>';}
    var v=0;DEC.forEach(function(dc){var o=dc.o.filter(function(x){return x.k===mine[dc.k];})[0];var li=document.createElement("li");li.style.gridTemplateColumns="minmax(0,1fr)";
      li.innerHTML="<span><small></small><b></b></span>";li.querySelector("small").textContent=dc.t;li.querySelector("b").textContent=o?o.n:"Sin elegir";if(!o)li.querySelector("b").style.color="var(--muted)";else v++;vl.appendChild(li);});
    renderTodo();
  }
  var EXTRA={
    colosseo:{l:"El anfiteatro más grande del mundo romano: 50.000 espectadores, luchas de gladiadores y cacerías de fieras. Con la misma entrada se visita el Foro, el centro político de Roma, y el Palatino, la colina donde vivían los emperadores.",dur:"3–4 horas",best:"A primera hora",tip:"Subid primero al Palatino: desde arriba se entiende todo el Foro y hay menos gente.",q:"Colosseum interior arena Rome"},
    colnoche:{l:"Por la noche el Coliseo se ilumina por dentro y por fuera y la avenida de los Foros Imperiales se queda casi vacía. Es el mejor paseo para la primera noche.",dur:"45 minutos",best:"Después de cenar",tip:"Bajad por Via dei Fori Imperiali y volved por Via Cavour: es un círculo perfecto desde casa.",q:"Colosseum night Rome"},
    vaticani:{l:"Kilómetros de galerías con esculturas clásicas, mapas pintados y las Estancias de Rafael, hasta llegar a la Capilla Sixtina con el techo y el Juicio Final de Miguel Ángel.",dur:"3–4 horas",best:"Primera hora, con entrada reservada",tip:"En la Capilla Sixtina no se puede hablar ni hacer fotos. La historia del Génesis empieza sobre el altar y avanza hacia la puerta del fondo.",q:"Vatican Museums gallery maps"},
    sanpietro:{l:"La iglesia más grande de la cristiandad, en la plaza abrazada por la columnata de Bernini. Dentro están la Piedad de Miguel Ángel y el baldaquino de bronce.",dur:"1–2 horas",best:"A las 7–8 de la mañana",tip:"Hay control de seguridad: con hombros y rodillas cubiertos no hay problema.",q:"St. Peter's Basilica interior"},
    cupola:{l:"Se sube por dentro de la cúpula de Miguel Ángel, pasando por la galería interior con los mosaicos a un palmo, hasta el mirador más alto de Roma.",dur:"1 hora",best:"Por la mañana",tip:"El tramo final es estrecho e inclinado. Con el ascensor os ahorráis la primera mitad.",q:"view from St. Peter's dome"},
    pantheon:{l:"Un templo romano de casi 1.900 años que sigue en pie y en uso. La cúpula, con su óculo abierto, fue la más grande del mundo durante siglos. Aquí está enterrado Rafael.",dur:"30–45 minutos",best:"Al mediodía, cuando el rayo de sol entra por el óculo",tip:"Justo enfrente, en Piazza della Rotonda, se toma un buen café de pie.",q:"Pantheon Rome oculus"},
    trevi:{l:"La fuente barroca más famosa del mundo, encajada en una plaza diminuta. La tradición dice que, si tiras una moneda de espaldas, vuelves a Roma.",dur:"20–30 minutos",best:"Muy temprano o pasadas las 22:00",tip:"Moneda con la mano derecha por encima del hombro izquierdo.",q:"Trevi Fountain"},
    navona:{l:"Una plaza alargada que conserva la forma del estadio de Domiciano. En el centro, la Fuente de los Cuatro Ríos de Bernini, frente a la iglesia de su rival Borromini.",dur:"30 minutos",best:"Al atardecer",tip:"Las terrazas de la plaza son caras: mejor un helado y un banco.",q:"Piazza Navona Rome"},
    spagna:{l:"La gran escalinata barroca que sube desde la fuente de la Barcaccia hasta la iglesia de Trinità dei Monti, con Via Condotti y sus tiendas a los pies.",dur:"30 minutos",best:"A primera hora o al anochecer",tip:"Arriba del todo hay una de las mejores vistas del centro.",q:"Spanish Steps Rome"},
    borghese:{l:"Una villa llena de obras maestras: el Apolo y Dafne y el Rapto de Proserpina de Bernini, la Paulina de Canova y varios Caravaggio. Está dentro del parque de Villa Borghese.",dur:"2 horas (turno fijo)",best:"Turno de mañana",tip:"Se reserva con semanas de antelación. Mirad la mano de Plutón en la pierna de Proserpina: parece carne.",q:"Galleria Borghese Rome"},
    capitolini:{l:"El museo público más antiguo del mundo, en la plaza diseñada por Miguel Ángel. Tiene la Loba Capitolina, el Marco Aurelio original y un pasadizo con vistas al Foro.",dur:"2 horas",best:"Al final de la tarde",tip:"Aunque no entréis, detrás del ayuntamiento hay un mirador gratis sobre el Foro.",q:"Capitoline Museums Rome"},
    massimo:{l:"Uno de los mejores museos de arte romano: mosaicos, bronces y, sobre todo, los frescos de la villa de Livia, un jardín pintado que rodea toda una sala.",dur:"1,5 horas",best:"Cualquier momento, suele estar tranquilo",tip:"Está junto a Termini: encaja antes o después del tren.",q:"Palazzo Massimo alle Terme"},
    clemente:{l:"Por fuera es una iglesia del siglo XII. Bajando, aparece una basílica del siglo IV, y debajo, casas romanas y un templo al dios Mitra. Se oye correr el agua.",dur:"1 hora",best:"Por la mañana",tip:"Llevad algo de abrigo: abajo hace fresco y hay humedad.",q:"San Clemente Rome underground"},
    vincoli:{l:"Una iglesia tranquila que guarda el Moisés de Miguel Ángel, parte de la tumba del papa Julio II, y las cadenas que según la tradición ataron a San Pedro.",dur:"20 minutos",best:"Por la mañana",tip:"Está a 10 minutos de casa: perfecto para empezar un día.",q:"San Pietro in Vincoli Moses"},
    maggiore:{l:"Una de las cuatro basílicas mayores de Roma, con mosaicos del siglo V y un techo dorado con, según la tradición, el primer oro llegado de América.",dur:"30–45 minutos",best:"Por la mañana",tip:"Es la iglesia más cercana a casa: se puede entrar de paso.",q:"Santa Maria Maggiore Rome mosaics"},
    ignazio:{l:"Una iglesia barroca con un techo pintado por Andrea Pozzo que parece abrirse al cielo. La cúpula no existe: es una pintura plana.",dur:"20 minutos",best:"Cualquier momento",tip:"Buscad el disco de mármol en el suelo de la nave y mirad la cúpula desde ahí.",q:"Sant'Ignazio Rome ceiling"},
    cappuccini:{l:"Varias capillas decoradas con los huesos de miles de frailes capuchinos, ordenados como si fueran adornos. Hay un pequeño museo antes.",dur:"45 minutos",best:"Cualquier momento",tip:"No es para todos los gustos. Está cerca de Via Veneto.",q:"Capuchin Crypt Rome"},
    domus:{l:"El palacio que se construyó Nerón después del incendio de Roma, enterrado bajo las termas de Trajano. Se recorren salas con frescos que inspiraron a Rafael.",dur:"1,5 horas",best:"Visita guiada reservada",tip:"Abre de viernes a domingo y hay que reservar. Merece la pena la visita guiada con realidad virtual.",q:"Domus Aurea Rome"},
    caracalla:{l:"Unas termas gigantes del siglo III donde se bañaban miles de romanos a la vez. Quedan muros enormes y mosaicos en el suelo.",dur:"1,5 horas",best:"Por la mañana",tip:"Es de los sitios más tranquilos de Roma, ideal para descansar del gentío.",q:"Baths of Caracalla mosaics"},
    argentina:{l:"Una plaza hundida con cuatro templos republicanos. Aquí estaba la curia donde mataron a Julio César, y hoy viven decenas de gatos cuidados por voluntarios.",dur:"15 minutos",best:"De paso hacia el Panteón",tip:"Se ve desde la barandilla, no hace falta entrar.",q:"Largo di Torre Argentina"},
    aventino:{l:"En la puerta de la sede de los Caballeros de Malta, al mirar por el ojo de la cerradura, la cúpula de San Pedro aparece enmarcada en un jardín.",dur:"20 minutos",best:"Por la mañana, antes de que se forme cola",tip:"Combinadlo con el Giardino degli Aranci, a dos minutos.",q:"Piazza dei Cavalieri di Malta"},
    aranci:{l:"Un jardín de naranjos en lo alto del Aventino con una terraza sobre el Tíber, Trastevere y la cúpula de San Pedro.",dur:"30 minutos",best:"Al atardecer",tip:"Pasad también por la basílica de Santa Sabina, justo al lado.",q:"Giardino degli Aranci Rome"},
    gianicolo:{l:"La colina más alta del centro, al otro lado del Tíber. Desde la terraza se ven casi todas las cúpulas de Roma. Cada día a las 12:00 se dispara un cañón.",dur:"45 minutos",best:"A mediodía, para el cañón",tip:"Subid desde Trastevere por las escaleras de Via Garibaldi.",q:"Gianicolo terrace view Rome"},
    pincio:{l:"La terraza sobre Piazza del Popolo, al borde del parque de Villa Borghese. Al atardecer el sol se pone detrás de San Pedro.",dur:"45 minutos",best:"Al atardecer",tip:"Es la última foto del viaje según el plan del domingo.",q:"Pincio terrace sunset"},
    vittoriano:{l:"El enorme monumento blanco a Víctor Manuel II, que los romanos llaman 'la máquina de escribir'. Las escalinatas son gratis y un ascensor sube a la terraza más alta.",dur:"45 minutos",best:"Al final de la tarde",tip:"La vista desde arriba abarca del Coliseo al Vaticano.",q:"Vittoriano terrace view Rome"},
    trastevere:{l:"El barrio medieval al otro lado del Tíber: calles empedradas, hiedra en las fachadas y la basílica de Santa Maria in Trastevere con mosaicos dorados.",dur:"Media tarde o una noche",best:"Al anochecer",tip:"Las mejores trattorias están en las calles laterales, no en la plaza.",q:"Trastevere street Rome"},
    campo:{l:"La plaza más viva del centro: mercado de flores, fruta y especias por la mañana y terrazas por la tarde. En el centro, la estatua de Giordano Bruno.",dur:"30–60 minutos",best:"Por la mañana (mercado) o al atardecer (spritz)",tip:"El Forno de la esquina hace pizza bianca recién salida del horno.",q:"Campo de' Fiori market Rome"},
    ghetto:{l:"Uno de los barrios judíos más antiguos de Europa, junto a las ruinas del Pórtico de Octavia. Aquí se comen las alcachofas a la judía, fritas y crujientes.",dur:"1–2 horas con comida",best:"A la hora de comer",tip:"En febrero es temporada de alcachofas: es el mejor momento para probarlas.",q:"Jewish Ghetto Rome Portico d'Ottavia"},
    testaccio:{l:"Un mercado de barrio con puestos de comida romana para picar: supplì, panini de bollito, pasta fresca. Lo frecuentan más romanos que turistas.",dur:"1 hora",best:"A mediodía",tip:"Cerrado los domingos. El barrio de alrededor es el Testaccio más auténtico.",q:"Mercato di Testaccio"},
    pasta:{l:"Una clase práctica para hacer pasta fresca a mano (fettuccine, ravioli) y tiramisú, y luego comer lo que habéis cocinado con vino.",dur:"3 horas",best:"Una tarde o un día de lluvia",tip:"Se reserva online. Es un buen plan si un día llueve.",q:"handmade pasta cooking class"},
    margutta:{l:"Una calle tranquila y cubierta de hiedra, llena de talleres de artistas y galerías. Aquí vivía Gregory Peck en 'Vacaciones en Roma'.",dur:"20 minutos",best:"De paso hacia Plaza de España",tip:"Buscad el número 51, la casa de la película.",q:"Via Margutta Rome"},
    coppede:{l:"Un pequeño barrio de los años 20 con edificios de cuento: arcos, lámparas de hierro, torres y la Fuente de las Ranas. Casi nadie lo conoce.",dur:"45 minutos",best:"Por la mañana",tip:"Queda algo alejado: mejor en bus o taxi desde casa.",q:"Quartiere Coppedè Rome"},
    isola:{l:"La única isla del Tíber, unida por puentes romanos, y al otro lado la Boca de la Verdad, una máscara antigua que según la leyenda muerde la mano de los mentirosos.",dur:"45 minutos",best:"A media tarde",tip:"En la Boca de la Verdad hay cola: id temprano o conformaos con mirarla desde la verja.",q:"Bocca della Verità Rome"},
    appia:{l:"La 'reina de las calzadas', construida en el 312 a. C. Se recorre entre pinos, tumbas y acueductos, y bajo ella están las catacumbas cristianas.",dur:"Medio día",best:"Domingo por la mañana, cuando se cierra al tráfico",tip:"Alquilad bicis eléctricas en el centro de visitantes.",q:"Appian Way Rome"},
    ostia:{l:"El puerto de la antigua Roma, muy bien conservado: calles, tiendas, termas con mosaicos y un teatro. Mucho más tranquilo que Pompeya.",dur:"Medio día",best:"Por la mañana",tip:"Tren de cercanías desde Piramide; la entrada está a cinco minutos de la estación.",q:"Ostia Antica mosaics"},
    tivoli:{l:"Dos patrimonios de la humanidad en el mismo pueblo: Villa d'Este, con cientos de fuentes renacentistas, y Villa Adriana, la enorme villa del emperador Adriano.",dur:"Día entero",best:"Si os sobra un día",tip:"Con este viaje no da tiempo, pero queda apuntado para la próxima.",q:"Villa d'Este Tivoli fountains"}
  };
  var HOMEQ="Piazza Vittorio Emanuele II, Roma";
  var sheet=document.getElementById("sheet"),shCur=null,shKey=null,shPrevFocus=null,galCache={};
  function openDetail(k,push){
    var i=IDEAS.filter(function(x){return x.k===k;})[0];if(!i)return;var e=EXTRA[k]||{};shCur=i;shKey=k;planMode(true);
    var catName=(CATS.filter(function(c){return c[0]===i.c[0];})[0]||[])[1]||"";
    setHero("p-"+k+".jpg",null,i.n);
    document.getElementById("sh-bar-t").textContent=i.n;document.getElementById("sh-cat").textContent=catName;
    document.getElementById("sh-title").textContent=i.n;document.getElementById("sh-lead").textContent=e.l||i.d;

    var wm=walkMin(i.lat,i.lon),f=document.getElementById("sh-facts");f.innerHTML="";
    [["Desde casa",i.far?i.far:(wm>45?"En metro o bus":wm+" min andando")],["Precio",i.price],["Tiempo",e.dur||"—"],["Mejor momento",e.best||"Cualquier momento"]].forEach(function(r){var d=document.createElement("div");d.innerHTML="<span></span><b></b>";d.querySelector("span").textContent=r[0];d.querySelector("b").textContent=r[1];f.appendChild(d);});
    var tip=document.getElementById("sh-tip");tip.hidden=!e.tip;tip.querySelector("span").textContent=e.tip||"";
    var dest=i.lat+","+i.lon;
    document.getElementById("sh-route").href="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(HOMEQ)+"&destination="+dest+"&travelmode="+(wm>45||i.far?"transit":"walking");
    document.getElementById("sh-map").href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(i.n+", Roma");
    paintSheet();loadGal(k,e.q||i.n);
    sheet.setAttribute("aria-hidden","false");sheet.classList.add("open");document.documentElement.classList.add("lock");sheet.scrollTop=0;
    shPrevFocus=document.activeElement;setTimeout(function(){document.getElementById("sh-back").focus({preventScroll:true});},50);
    if(push!==false){try{history.pushState({ver:k},"","#ver-"+k);}catch(_){location.hash="ver-"+k;}}
  }
  function paintSheet(){if(!shCur)return;var i=shCur,key="w_"+i.k,w=document.getElementById("sh-wish");
    w.setAttribute("aria-pressed",!!mine[key]);w.setAttribute("aria-label",(mine[key]?"Quitar de lo que nos apetece":"Me apetece")+": "+i.n);
    var cur=dayOf(i.k)||"",dg=document.getElementById("sh-days");dg.innerHTML="";
    var ip=document.getElementById("sh-inplan");if(cur){ip.hidden=false;ip.style.background=DAYC[cur][1];ip.textContent="En el plan · "+DAYC[cur][0];}else ip.hidden=true;
    ["jue","vie","sab","dom"].forEach(function(d){var bt=document.createElement("button");bt.type="button";bt.textContent=DAYC[d][0];bt.style.setProperty("--c",DAYC[d][1]);bt.setAttribute("aria-pressed",cur===d);
      bt.addEventListener("click",function(){if(cur!==d)mine[key]="1";setDay(i.k,cur===d?null:d);paintSheet();toast(cur===d?"Quitado del "+DAYC[d][0].toLowerCase():"Añadido al "+DAYC[d][0].toLowerCase());});dg.appendChild(bt);});}
  function closeDetail(fromPop){if(!sheet.classList.contains("open"))return;sheet.classList.remove("open");sheet.setAttribute("aria-hidden","true");document.documentElement.classList.remove("lock");shCur=null;shKey=null;
    if(shPrevFocus&&shPrevFocus.focus)shPrevFocus.focus({preventScroll:true});
    if(!fromPop&&/^#(ver|info)-/.test(location.hash)){if(history.state&&(history.state.ver||history.state.info))history.back();else{try{history.replaceState(null,"",location.pathname+location.search);}catch(_){location.hash="";}}}}
  document.getElementById("sh-back").addEventListener("click",function(){closeDetail(false);});
  document.getElementById("sh-wish").addEventListener("click",function(){if(!shCur)return;var key="w_"+shCur.k;if(mine[key])delete mine[key];else mine[key]="1";render();save();paintSheet();});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&sheet.classList.contains("open"))closeDetail(false);});
  function routeHash(){var m=location.hash.match(/^#ver-([a-z]+)$/),n=location.hash.match(/^#info-([a-z0-9-]+)$/);
    if(m){if(!(shKey===m[1]&&sheet.classList.contains("open")))openDetail(m[1],false);}
    else if(n&&INFO[n[1]]){if(!(shKey==="info-"+n[1]&&sheet.classList.contains("open")))openInfo(n[1],false);}
    else closeDetail(true);}
  window.addEventListener("popstate",routeHash);window.addEventListener("hashchange",routeHash);
  /* swipe desde el borde izquierdo para volver */
  (function(){var sx=null,sy=0;sheet.addEventListener("touchstart",function(e){var t=e.touches[0];sx=t.clientX<30?t.clientX:null;sy=t.clientY;},{passive:true});
    sheet.addEventListener("touchend",function(e){if(sx===null)return;var t=e.changedTouches[0];if(t.clientX-sx>80&&Math.abs(t.clientY-sy)<60)closeDetail(false);sx=null;},{passive:true});})();
  function loadGal(k,q){var g=document.getElementById("sh-gal"),st=document.getElementById("sh-gal-state");g.innerHTML="";st.hidden=false;st.textContent="Cargando fotos…";
    function paint(list){if(shKey!==k)return;g.innerHTML="";if(!list.length){st.textContent="No hay más fotos ahora mismo.";return;}st.hidden=true;
      list.forEach(function(p){var fg=document.createElement("figure");fg.innerHTML='<img loading="lazy" alt=""><figcaption></figcaption>';fg.querySelector("img").src=p.u;fg.querySelector("img").alt=document.getElementById("sh-title").textContent;fg.querySelector("figcaption").textContent="Foto: "+(p.a||"Wikimedia Commons")+(p.lic?" · "+p.lic:"");g.appendChild(fg);});}
    if(galCache[k]){paint(galCache[k]);return;}
    var url="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=14&gsrsearch="+encodeURIComponent(q+" filetype:bitmap")+"&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=960";
    fetch(url).then(function(r){return r.json();}).then(function(j){var ps=Object.values((j.query&&j.query.pages)||{}).sort(function(a,b){return a.index-b.index;});
      var out=ps.map(function(p){var ii=p.imageinfo&&p.imageinfo[0];if(!ii||ii.mime!=="image/jpeg"||ii.width<900)return null;var m=ii.extmetadata||{};
        return {u:ii.thumburl,a:((m.Artist&&m.Artist.value)||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim().slice(0,40),lic:(m.LicenseShortName&&m.LicenseShortName.value)||""};}).filter(Boolean).slice(0,6);
      galCache[k]=out;paint(out);}).catch(function(){if(shKey===k)st.textContent="Sin conexión: las fotos extra se cargarán cuando haya internet.";});}
  function i_n(k){var i=IDEAS.filter(function(x){return x.k===k;})[0];return i?i.n:"";}

  function renderIdeas(){
    ibox.innerHTML="";
    var list=IDEAS.filter(function(i){return catSel==="todo"||i.c.indexOf(catSel)>-1;});
    var mb=document.getElementById("more");if(catSel==="todo"&&!showAll&&list.length>12){mb.hidden=false;mb.textContent="Ver los "+list.length+" planes";list=list.slice(0,12);}else mb.hidden=true;
    list.forEach(function(i){
      var a=document.createElement("article");a.className="idea";
      var catName=(CATS.filter(function(c){return c[0]===i.c[0];})[0]||[])[1]||"";
      a.innerHTML='<div class="ph"><img loading="lazy" alt=""><button class="wish" type="button">'+heart+'</button></div><div class="bd"><span class="cat"></span><h3><button class="idea-open" type="button"></button></h3><p></p><div class="meta"></div><div class="foot"><span class="both"></span><span class="go" aria-hidden="true">›</span></div></div>';
      var img=a.querySelector("img");img.src="p-"+i.k+".jpg";img.alt=i.n;
      a.querySelector(".cat").textContent=catName;a.querySelector(".idea-open").textContent=i.n;a.querySelector("p").textContent=i.d;
      var meta=a.querySelector(".meta"),wm=walkMin(i.lat,i.lon);
      meta.textContent=(i.far?i.far:(wm>45?"En metro o bus":wm+" min andando"))+" · "+i.price;
      var dp=dayOf(i.k);if(dp){var ip=document.createElement("span");ip.className="inplan";ip.style.background=DAYC[dp][1];ip.textContent="En el plan · "+DAYC[dp][0];a.querySelector(".ph").appendChild(ip);}
      var w=a.querySelector(".wish"),key="w_"+i.k;w.setAttribute("aria-pressed",!!mine[key]);
      w.setAttribute("aria-label",(mine[key]?"Quitar":"Me apetece")+": "+i.n);
      var others=Object.keys(all).filter(function(id){return id!==uid&&all[id]&&all[id][key];});
      if(others.length){var pf=profiles[others[0]]||{};a.querySelector(".both").textContent=(mine[key]?"Os apetece a los dos":"A "+((pf.name||"").split(" ")[0]||"la otra persona")+" le apetece");}
      w.addEventListener("click",function(){if(mine[key])delete mine[key];else mine[key]="1";if(uid){all[uid]=Object.assign({},mine);}lastPop=key;render();save();});
      if(lastPop===key){w.classList.add("pop");lastPop=null;}
      a.addEventListener("click",function(ev){if(ev.target.closest(".wish"))return;openDetail(i.k);});
      var both=a.querySelector(".both");if(!both.textContent){both.textContent="Ver más";both.className="more-hint";}
      ibox.appendChild(a);});
  }


  /* ---------- Visor de fotos con zoom ---------- */
  (function(){
    var lb=document.getElementById("lb"),track=document.getElementById("lb-track"),cap=document.getElementById("lb-cap"),num=document.getElementById("lb-n");
    var items=[],idx=0,z=1,tx=0,ty=0,img=null,W=0,H=0,bw=0,bh=0,swipeX=0;
    function base(){W=lb.clientWidth;H=lb.clientHeight;if(!img)return;var r=img.naturalWidth/img.naturalHeight||1;if(W/H>r){bh=H;bw=H*r;}else{bw=W;bh=W/r;}}
    function clamp(){var mx=Math.max(0,(bw*z-W)/2),my=Math.max(0,(bh*z-H)/2);var cx=(W-bw)/2,cy=(H-bh)/2;
      /* tx,ty = desplazamiento del centro */ tx=Math.min(mx,Math.max(-mx,tx));ty=Math.min(my,Math.max(-my,ty));}
    function apply(anim){if(!img)return;img.style.transition=anim?"transform .25s ease":"none";img.style.transformOrigin="50% 50%";img.style.transform="translate("+tx+"px,"+ty+"px) scale("+z+")";lb.classList.toggle("zoomed",z>1.01);}
    function moveTrack(dx,anim){track.style.transition=anim?"transform .3s cubic-bezier(.2,.7,.2,1)":"none";track.style.transform="translateX("+(-idx*W+dx)+"px)";}
    function show(i,anim){idx=Math.max(0,Math.min(items.length-1,i));if(img){z=1;tx=ty=0;apply(false);}
      img=track.children[idx].querySelector("img");z=1;tx=ty=0;base();apply(false);moveTrack(0,anim);
      num.textContent=items.length>1?(idx+1)+" / "+items.length:"";var it=items[idx];cap.innerHTML="";cap.textContent=it.c||"";if(it.s){var sm=document.createElement("small");sm.textContent=it.s;cap.appendChild(sm);}}
    window.openViewer=function(list,start){items=list;track.innerHTML="";
      list.forEach(function(it){var d=document.createElement("div");d.className="lb-slide";var im=document.createElement("img");im.src=it.u;im.alt=it.c||"";im.draggable=false;im.addEventListener("load",function(){if(im===img){base();apply(false);}});d.appendChild(im);track.appendChild(d);});
      lb.classList.add("open");document.documentElement.classList.add("lock");W=lb.clientWidth;show(start||0,false);
      try{history.pushState({lb:1},"",location.href.split("#")[0]+(location.hash||"")+"");}catch(_){}
      document.getElementById("lb-x").focus({preventScroll:true});};
    function close(fromPop){if(!lb.classList.contains("open"))return;lb.classList.remove("open");if(!document.getElementById("sheet").classList.contains("open"))document.documentElement.classList.remove("lock");img=null;
      if(!fromPop&&history.state&&history.state.lb)history.back();}
    window.addEventListener("popstate",function(){if(lb.classList.contains("open"))close(true);});
    document.getElementById("lb-x").addEventListener("click",function(){close(false);});
    document.getElementById("lb-prev").addEventListener("click",function(){show(idx-1,true);});
    document.getElementById("lb-next").addEventListener("click",function(){show(idx+1,true);});
    document.addEventListener("keydown",function(e){if(!lb.classList.contains("open"))return;if(e.key==="Escape"){e.stopImmediatePropagation();close(false);}if(e.key==="ArrowLeft")show(idx-1,true);if(e.key==="ArrowRight")show(idx+1,true);},true);
    window.addEventListener("resize",function(){if(lb.classList.contains("open")){W=lb.clientWidth;base();clamp();apply(false);moveTrack(0,false);}});
    function zoomAt(nz,px,py,anim){/* px,py relativos al centro de la pantalla */nz=Math.max(1,Math.min(5,nz));var f=nz/z;tx=px-(px-tx)*f;ty=py-(py-ty)*f;z=nz;if(z<=1.01){z=1;tx=ty=0;}clamp();apply(anim);}
    /* táctil: pellizco, arrastre, doble toque, deslizar para cambiar o cerrar */
    var pts={},mode=null,sd=0,sz=1,sx=0,sy=0,stx=0,sty=0,mx0=0,my0=0,lastTap=0,moved=false;
    function cen(){var k=Object.keys(pts),a=pts[k[0]],b=pts[k[1]];return [(a.x+b.x)/2-W/2,(a.y+b.y)/2-H/2,Math.hypot(a.x-b.x,a.y-b.y)];}
    lb.addEventListener("pointerdown",function(e){if(e.target.closest("button"))return;lb.setPointerCapture&&lb.setPointerCapture(e.pointerId);pts[e.pointerId]={x:e.clientX,y:e.clientY};var n=Object.keys(pts).length;
      if(n===2){var c=cen();mode="pinch";sd=c[2];sz=z;mx0=c[0];my0=c[1];stx=tx;sty=ty;}
      else if(n===1){mode="drag";moved=false;sx=e.clientX;sy=e.clientY;stx=tx;sty=ty;}});
    lb.addEventListener("pointermove",function(e){if(!pts[e.pointerId])return;pts[e.pointerId]={x:e.clientX,y:e.clientY};
      if(mode==="pinch"&&Object.keys(pts).length>=2){var c=cen(),nz=Math.max(.8,Math.min(5,sz*c[2]/sd)),f=nz/sz;z=nz;tx=c[0]-(mx0-stx)*f;ty=c[1]-(my0-sty)*f;apply(false);moved=true;}
      else if(mode==="drag"){var dx=e.clientX-sx,dy=e.clientY-sy;if(Math.abs(dx)+Math.abs(dy)>6)moved=true;
        if(z>1.01){tx=stx+dx;ty=sty+dy;clamp();apply(false);}
        else if(Math.abs(dx)>Math.abs(dy)){swipeX=dx;var edge=(idx===0&&dx>0)||(idx===items.length-1&&dx<0);moveTrack(edge?dx/3:dx,false);}
        else if(dy>0){img.style.transition="none";img.style.transform="translateY("+dy+"px) scale("+(1-dy/H/3)+")";lb.style.backgroundColor="rgba(23,18,15,"+Math.max(.3,1-dy/H)+")";}}});
    function up(e){if(!pts[e.pointerId])return;var dx=e.clientX-sx,dy=e.clientY-sy;delete pts[e.pointerId];var n=Object.keys(pts).length;
      if(mode==="pinch"){if(n===1){var k=Object.keys(pts)[0];mode="drag";sx=pts[k].x;sy=pts[k].y;stx=tx;sty=ty;}else mode=null;if(z<1){z=1;tx=ty=0;}clamp();apply(true);return;}
      if(mode!=="drag")return;mode=null;lb.style.background="";
      if(!moved){var now=Date.now();if(now-lastTap<300){lastTap=0;if(z>1.01)zoomAt(1,0,0,true);else zoomAt(2.5,e.clientX-W/2,e.clientY-H/2,true);}else lastTap=now;return;}
      if(z>1.01)return;
      if(Math.abs(dx)>Math.abs(dy)){if(dx<-60&&idx<items.length-1)show(idx+1,true);else if(dx>60&&idx>0)show(idx-1,true);else moveTrack(0,true);}
      else if(dy>110)close(false);else{apply(true);}}
    lb.addEventListener("pointerup",up);lb.addEventListener("pointercancel",up);
    lb.addEventListener("wheel",function(e){e.preventDefault();zoomAt(z*(e.deltaY<0?1.15:1/1.15),e.clientX-W/2,e.clientY-H/2,false);},{passive:false});
    /* Fotos de la casa */
    var gfs=[].slice.call(document.querySelectorAll(".gallery figure"));
    var gl=gfs.map(function(f){var im=f.querySelector("img");return {u:im.getAttribute("src"),c:(f.querySelector("figcaption")||{}).textContent||"",s:"Nuestra casa en Roma"};});
    gfs.forEach(function(f,i){var hit=document.createElement("button");hit.type="button";hit.className="zoom-hit";hit.setAttribute("aria-label","Ampliar foto: "+gl[i].c);
      hit.addEventListener("click",function(){openViewer(gl,i);});f.appendChild(hit);});
    /* Fotos de la ficha de cada plan */
    document.getElementById("sh-img").classList.add("zoomable");
    function sheetList(){var l=[{u:document.getElementById("sh-img").src,c:document.getElementById("sh-title").textContent}];
      [].forEach.call(document.querySelectorAll("#sh-gal figure"),function(f){l.push({u:f.querySelector("img").src,c:document.getElementById("sh-title").textContent,s:f.querySelector("figcaption").textContent});});return l;}
    document.getElementById("sh-img").addEventListener("click",function(){openViewer(sheetList(),0);});
    document.getElementById("sh-gal").addEventListener("click",function(e){var f=e.target.closest("figure");if(!f)return;var all=[].slice.call(this.querySelectorAll("figure"));openViewer(sheetList(),all.indexOf(f)+1);});
  })();

  /* ---------- Editor del plan de cada día ---------- */
  var editDay=null,flashId=null;
  function dayOf(k){for(var i=0;i<DAYIDS.length;i++){if(itin(DAYIDS[i]).some(function(it){return it.k===k;}))return SHORT[DAYIDS[i]];}return null;}
  function uidN(){return "u"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
  function idea(k){return IDEAS.filter(function(x){return x.k===k;})[0];}
  function slotAfter(a){/* hueco tras el último plan editable */var idx=-1;a.forEach(function(it,i){if(!it.fx)idx=i;});if(idx<0)idx=a.length-1;
    var t0=idx>=0?tval(a[idx].t):540;if(t0>=1440)t0=1200;var nx=a[idx+1]?tval(a[idx+1].t):1440;
    var t=nx>=1440?t0+60:Math.round((t0+nx)/2/5)*5;if(t<=t0)t=t0+5;return fmt(Math.min(t,1435));}
  function itemFrom(I,t,hl){var o={id:uidN(),t:t,n:I.n,p:I.d,k:I.k,lat:I.lat,lon:I.lon,q:I.n+", Roma"};if(hl)o.hl=1;return o;}
  function setDay(k,ds){var I=idea(k);if(!I)return;
    DAYIDS.forEach(function(day){var a=itin(day),n=a.filter(function(it){return it.k!==k;});if(n.length!==a.length)store(day,n);});
    if(ds){var day=LONG[ds],a=itin(day),it=itemFrom(I,slotAfter(a));flashId=it.id;a.push(it);store(day,a);}
    render();save();}
  var toastEl=document.getElementById("toast"),toastT=null,toastUndo=null;
  function toast(msg,undo){toastEl.querySelector("span").textContent=msg;var b=toastEl.querySelector("button");toastUndo=undo||null;b.hidden=!undo;
    toastEl.classList.add("show");clearTimeout(toastT);toastT=setTimeout(function(){toastEl.classList.remove("show");toastUndo=null;},undo?6000:2600);}
  toastEl.querySelector("button").addEventListener("click",function(){if(toastUndo){toastUndo();toastUndo=null;}toastEl.classList.remove("show");});
  function snapshot(){var o={};DAYIDS.forEach(function(d){if(Array.isArray(mine["it_"+d]))o[d]=clone(mine["it_"+d]);});return o;}
  function restore(o){DAYIDS.forEach(function(d){if(o[d])mine["it_"+d]=o[d];else delete mine["it_"+d];});render();save();}
  function renderPlans(){
    DAYIDS.forEach(function(day){
      var ol=document.querySelector('.steps[data-day="'+day+'"]'),tools=document.querySelector('.day-tools[data-day="'+day+'"]'),add=document.querySelector('.day-add[data-day="'+day+'"]');if(!ol)return;
      var ed=editDay===day,items=itin(day);ol.innerHTML="";ol.classList.toggle("editing",ed);
      items.forEach(function(it){
        var li=document.createElement("li");if(it.hl)li.classList.add("key");if(it.id===flashId)li.classList.add("new");
        li.innerHTML='<time></time><span class="dot"></span><div class="st"><b></b><p></p></div>';
        li.querySelector("time").textContent=it.t;li.querySelector("b").textContent=it.n;
        if(it.p)li.querySelector("p").textContent=it.p;else li.querySelector("p").remove();
        if(!ed&&it.k&&idea(it.k)){li.classList.add("go");var bb=li.querySelector("b"),ob=document.createElement("button");ob.type="button";ob.className="st-open";ob.textContent=it.n;ob.setAttribute("aria-label",it.n+": ver fotos y más información");bb.textContent="";bb.appendChild(ob);
          li.addEventListener("click",function(e){if(e.target.closest(".st-edit"))return;openDetail(it.k);});}
        if(ed&&it.fx)li.classList.add("fixed");
        if(ed&&!it.fx){var row=document.createElement("div");row.className="st-edit";
          row.innerHTML='<label><span class="vh">Hora de </span><input type="time" step="300"></label><button type="button" class="chg">Cambiar</button><button type="button" class="rm"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg><span class="vh">Quitar</span></button>';
          var inp=row.querySelector("input");inp.value=/^\d\d:\d\d$/.test(it.t)?it.t:"";inp.previousElementSibling.textContent="Hora de "+it.n;
          inp.addEventListener("change",function(){if(!inp.value)return;var a=itin(day);a.forEach(function(x){if(x.id===it.id)x.t=inp.value;});flashId=it.id;store(day,a);render();save();});
          row.querySelector(".chg").addEventListener("click",function(){openPicker(day,it.id);});
          row.querySelector(".rm").setAttribute("aria-label","Quitar "+it.n);row.querySelector(".rm").addEventListener("click",function(){var snap=snapshot();var a=itin(day).filter(function(x){return x.id!==it.id;});store(day,a);render();save();
            toast("Quitado: "+it.n,function(){restore(snap);});});
          li.querySelector(".st").appendChild(row);}
        ol.appendChild(li);});
      flashId=flashId;
      tools.innerHTML="";
      if(ed){tools.innerHTML='<span class="hint">Cambia o quita lo que quieras. Lo que tiene candado no se mueve.</span><button type="button" class="pill dark">Hecho</button>';
        tools.querySelector("button").addEventListener("click",function(){editDay=null;renderPlans();});}
      else{tools.innerHTML='<button type="button" class="pill"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/></svg>Cambiar planes del día</button>';
        tools.querySelector("button").addEventListener("click",function(){editDay=day;renderPlans();});}
      add.hidden=!ed;add.innerHTML="";
      if(ed){add.innerHTML='<button type="button" class="pill dark">＋ Añadir un plan</button>'+(isDefault(day)?'':'<button type="button" class="pill soft">Volver al plan original</button>');
        add.querySelector(".dark").addEventListener("click",function(){openPicker(day,null);});
        var rs=add.querySelector(".soft");if(rs)rs.addEventListener("click",function(){var snap=snapshot();delete mine["it_"+day];render();save();toast("Plan original recuperado",function(){restore(snap);});});}
    });
    setTimeout(function(){flashId=null;},50);
  }
  /* selector */
  var pk=document.getElementById("picker"),pkDay=null,pkSlot=null,pkFil="cerca",pkAnchor=null;
  var PKF=[["cerca","Más cerca"],["wish","Nos apetecen"],["top","Imprescindibles"],["gratis","Gratis"],["vistas","Miradores"],["arte","Arte"],["comer","Comer"],["noche","De noche"],["lluvia","Si llueve"],["fuera","Escapadas"]];
  var pkf=document.getElementById("pk-f");
  PKF.forEach(function(f){var b=document.createElement("button");b.type="button";b.className="filter";b.textContent=f[1];b.dataset.f=f[0];
    b.addEventListener("click",function(){pkFil=f[0];paintPicker();});pkf.appendChild(b);});
  function norm(t){return (t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");}
  function openPicker(day,slotId){toastEl.classList.remove("show");pkDay=day;pkSlot=slotId;pkFil="cerca";document.getElementById("pk-q").value="";document.getElementById("pk-own").value="";
    var a=itin(day),idx=slotId?a.map(function(x){return x.id;}).indexOf(slotId):a.length;pkAnchor=null;
    for(var i=idx-1;i>=0;i--){if(a[i].lat!=null){pkAnchor={n:a[i].n,lat:a[i].lat,lon:a[i].lon};break;}}
    if(!pkAnchor)pkAnchor={n:"casa",lat:HOME.lat,lon:HOME.lon};
    var dn=DAYC[SHORT[day]][0].toLowerCase(),cur=slotId?a[idx]:null;
    document.getElementById("pk-title").textContent=cur?"Cambiar plan":"Añadir al "+dn;
    document.getElementById("pk-ctx").textContent=cur?("En lugar de «"+cur.n+"», a las "+cur.t+". Ordenado por cercanía a "+(pkAnchor.n==="casa"?"casa":pkAnchor.n)+"."):("Se añadirá al "+dn+". Ordenado por cercanía a "+(pkAnchor.n==="casa"?"casa":pkAnchor.n)+".");
    paintPicker();pk.setAttribute("aria-hidden","false");pk.classList.add("open");document.documentElement.classList.add("lock");pk.scrollTop=0;
    try{history.pushState({pk:1},"",location.href);}catch(_){}
    setTimeout(function(){document.getElementById("pk-back").focus({preventScroll:true});},50);}
  function closePicker(fromPop){if(!pk.classList.contains("open"))return;pk.classList.remove("open");pk.setAttribute("aria-hidden","true");
    if(!sheet.classList.contains("open"))document.documentElement.classList.remove("lock");if(!fromPop&&history.state&&history.state.pk)history.back();}
  window.addEventListener("popstate",function(){if(pk.classList.contains("open")&&!(history.state&&history.state.pk))closePicker(true);});
  document.getElementById("pk-back").addEventListener("click",function(){closePicker(false);});
  document.getElementById("pk-q").addEventListener("input",paintPicker);
  function paintPicker(){[].forEach.call(pkf.children,function(b){b.setAttribute("aria-pressed",b.dataset.f===pkFil);});
    var q=norm(document.getElementById("pk-q").value),ul=document.getElementById("pk-list"),a=itin(pkDay),here=SHORT[pkDay];ul.innerHTML="";
    var list=IDEAS.filter(function(i){if(q&&norm(i.n+" "+i.d).indexOf(q)<0)return false;if(pkFil==="wish")return !!mine["w_"+i.k];if(pkFil==="cerca")return !i.far;return i.c.indexOf(pkFil)>-1;});
    list.sort(function(x,y){return hav(pkAnchor,x)-hav(pkAnchor,y);});
    if(!list.length){ul.innerHTML='<li class="pk-empty">'+(pkFil==="wish"?"Aún no habéis marcado nada con el corazón.":"No hay planes con ese filtro.")+'</li>';return;}
    list.forEach(function(i){var li=document.createElement("li"),b=document.createElement("button");b.type="button";b.className="pk-row";
      b.innerHTML='<img alt="" loading="lazy"><span><b></b><small></small></span><span class="plus" aria-hidden="true">+</span>';
      b.querySelector("img").src="p-"+i.k+".jpg";b.querySelector("b").textContent=i.n;
      var km=hav(pkAnchor,i)*1.2,min=Math.max(5,Math.round(km/4.6*60/5)*5),from=pkAnchor.n==="casa"?"de casa":"de "+pkAnchor.n;
      b.querySelector("small").textContent=(i.far?i.far:(min>45?"En metro o bus desde "+from.slice(3):min+" min andando "+from))+" · "+i.price;
      var d=dayOf(i.k),inThis=d===here;
      if(d){var em=document.createElement("em");em.style.background=DAYC[d][1];em.textContent=inThis?"Ya está en este día":"Ahora en el "+DAYC[d][0].toLowerCase()+" · se moverá";b.querySelector("span").appendChild(em);}
      if(mine["w_"+i.k]&&!d){var e2=document.createElement("em");e2.style.background="var(--surface-2)";e2.textContent="♥ Os apetece";b.querySelector("span").appendChild(e2);}
      if(inThis){b.disabled=true;}
      b.setAttribute("aria-label",(pkSlot?"Cambiar por ":"Añadir ")+i.n);
      b.addEventListener("click",function(){pickIdea(i);});li.appendChild(b);ul.appendChild(li);});}
  function putItem(it){var snap=snapshot(),a=itin(pkDay),dn=DAYC[SHORT[pkDay]][0].toLowerCase(),msg;
    if(it.k)DAYIDS.forEach(function(day){if(day===pkDay)return;var x=itin(day),n=x.filter(function(y){return y.k!==it.k;});if(n.length!==x.length)store(day,n);});
    if(pkSlot){var old=null;a=a.map(function(x){if(x.id===pkSlot){old=x;it.t=x.t;if(x.hl)it.hl=1;return it;}return x;});msg="Cambiado: "+(old?old.n:"")+" → "+it.n;}
    else{it.t=slotAfter(a);a.push(it);msg="Añadido al "+dn+" a las "+it.t;}
    flashId=it.id;store(pkDay,a);closePicker(false);render();save();toast(msg,function(){restore(snap);});}
  function pickIdea(i){var it=itemFrom(i,"");putItem(it);}
  document.getElementById("pk-own-btn").addEventListener("click",function(){var v=document.getElementById("pk-own").value.trim();if(!v){document.getElementById("pk-own").focus();return;}
    putItem({id:uidN(),t:"",n:v,p:""});});
  document.getElementById("pk-own").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();document.getElementById("pk-own-btn").click();}});
  /* migrar días elegidos con la versión anterior */
  Object.keys(mine).forEach(function(key){if(!/^d_/.test(key))return;var k=key.slice(2),d=mine[key];delete mine[key];if(DAYC[d]&&dayOf(k)!==d)setDay(k,d);});

  /* ---------- Fotos de Wikimedia Commons (en el iPhone) ---------- */
  var IMGC={};try{IMGC=JSON.parse(localStorage.getItem("roma-img")||"{}");}catch(e){}
  function commons(q,n){var url="https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit="+(n||12)+"&gsrsearch="+encodeURIComponent(q+" filetype:bitmap")+"&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=900";
    return fetch(url).then(function(r){return r.json();}).then(function(j){return Object.values((j.query&&j.query.pages)||{}).sort(function(a,b){return a.index-b.index;}).map(function(p){var ii=p.imageinfo&&p.imageinfo[0];if(!ii||ii.mime!=="image/jpeg"||ii.width<700)return null;var m=ii.extmetadata||{};
      return {u:ii.thumburl,w:ii.width,h:ii.height,a:((m.Artist&&m.Artist.value)||"").replace(/<[^>]+>/g,"").replace(/\s+/g," ").trim().slice(0,40),lic:(m.LicenseShortName&&m.LicenseShortName.value)||""};}).filter(Boolean);});}
  function cover(spec){/* spec: {c: categoría de Commons, q: búsqueda} */var key=(spec.c||"")+"|"+(spec.q||"");if(IMGC[key])return Promise.resolve(IMGC[key]);
    function best(l){var g=l.filter(function(x){var r=x.w/x.h;return r>1.05&&r<1.9;});return g[0]||l[0]||null;}
    var first=spec.c?commons('incategory:"'+spec.c+'"',16):Promise.resolve([]);
    return first.then(function(l){var b=best(l);if(b||!spec.q)return b;return commons(spec.q,12).then(best);}).then(function(b){if(b){IMGC[key]=b;try{localStorage.setItem("roma-img",JSON.stringify(IMGC));}catch(e){}}return b;});}
  function setHero(local,spec,alt){var im=document.getElementById("sh-img");im.alt=alt||"";im.style.opacity=1;
    if(local){im.src=local;return;}im.removeAttribute("src");im.style.opacity=0;var want=shKey;
    cover(spec).then(function(b){if(b&&shKey===want){im.onload=function(){im.style.opacity=1;};im.src=b.u;}}).catch(function(){});}
  function planMode(on){document.getElementById("sh-wish").style.visibility=on?"visible":"hidden";document.getElementById("sh-days-box").hidden=!on;
    if(!on)document.getElementById("sh-inplan").hidden=true;document.getElementById("sh-choose").hidden=true;}
  function facts(rows){var f=document.getElementById("sh-facts");f.innerHTML="";rows.forEach(function(r){if(!r[1])return;var d=document.createElement("div");d.innerHTML="<span></span><b></b>";d.querySelector("span").textContent=r[0];d.querySelector("b").textContent=r[1];f.appendChild(d);});}
  var INFO={};
  function openInfo(id,push){var o=INFO[id];if(!o)return;shCur=null;shKey="info-"+id;planMode(false);
    setHero(o.img,o.cover,o.n);document.getElementById("sh-bar-t").textContent=o.n;document.getElementById("sh-cat").textContent=o.cat||"";
    document.getElementById("sh-title").textContent=o.n;document.getElementById("sh-lead").textContent=o.l||o.s||"";facts(o.facts||[]);
    var tip=document.getElementById("sh-tip");tip.hidden=!o.tip;tip.querySelector("span").textContent=o.tip||"";
    var r=document.getElementById("sh-route"),mp=document.getElementById("sh-map");
    r.hidden=!o.route;if(o.route)r.href="https://www.google.com/maps/dir/?api=1&origin="+encodeURIComponent(HOMEQ)+"&destination="+encodeURIComponent(o.route)+"&travelmode=walking";
    mp.hidden=!o.mq;if(o.mq)mp.href="https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(o.mq);
    var ch=document.getElementById("sh-choose");if(o.vote){ch.hidden=false;paintChoose(o);}
    loadGal(shKey,o.gq||o.n);
    sheet.setAttribute("aria-hidden","false");sheet.classList.add("open");document.documentElement.classList.add("lock");sheet.scrollTop=0;
    shPrevFocus=document.activeElement;setTimeout(function(){document.getElementById("sh-back").focus({preventScroll:true});},50);
    if(push!==false){try{history.pushState({info:id},"","#info-"+id);}catch(_){location.hash="info-"+id;}}}
  function paintChoose(o){var ch=document.getElementById("sh-choose"),on=mine[o.vote[0]]===o.vote[1];ch.textContent=on?"✓ Es nuestra elección":"Elegimos esta";ch.className=on?"pill":"pill dark";ch.style.justifyContent="center";}
  document.getElementById("sh-choose").addEventListener("click",function(){var id=(shKey||"").slice(5),o=INFO[id];if(!o||!o.vote)return;
    if(mine[o.vote[0]]===o.vote[1])delete mine[o.vote[0]];else mine[o.vote[0]]=o.vote[1];render();save();paintChoose(o);
    toast(mine[o.vote[0]]?"Elegido: "+o.n:"Elección quitada");});
  var _openDetail=openDetail;openDetail=function(k,push){document.getElementById("sh-route").hidden=false;document.getElementById("sh-map").hidden=false;_openDetail(k,push);};

  /* ---------- Qué probar ---------- */
  var FOOD=[
    {k:"carbonara",reg:"Roma",n:"Carbonara",s:"Guanciale, yema y pecorino. Sin nata, nunca.",l:"El plato romano por excelencia: la pasta se mezcla fuera del fuego con yema de huevo, pecorino romano y pimienta, y el guanciale (la papada del cerdo) le da el toque crujiente. La crema sale sola, sin una gota de nata.",where:"Roscioli · Via dei Giubbonari 21",mq:"Roscioli Salumeria con Cucina, Roma",price:"15–20 €",when:"Comida o cena",tip:"Si pedís para compartir, que sea esta y una cacio e pepe: así probáis las dos.",c:"Spaghetti alla carbonara",q:"spaghetti carbonara"},
    {k:"cacio",reg:"Roma",n:"Cacio e pepe",s:"Pasta, pecorino y pimienta negra. Tres ingredientes.",l:"Solo pecorino romano, pimienta negra recién molida y el agua de cocer la pasta. Parece fácil y es de lo más difícil de bordar: tiene que quedar una crema, sin grumos.",where:"Felice a Testaccio · Via Mastro Giorgio 29",mq:"Felice a Testaccio, Roma",price:"12–16 €",when:"Comida o cena",tip:"En Felice la mezclan delante de vosotros, en la mesa.",c:"Cacio e pepe",q:"cacio e pepe pasta"},
    {k:"amatriciana",reg:"Roma",n:"Amatriciana",s:"Tomate, guanciale y pecorino, con bucatini.",l:"La salsa roja de Roma: tomate, guanciale y pecorino, casi siempre con bucatini, unos espaguetis gruesos y huecos. Sabrosa y un poco picante.",where:"Armando al Pantheon · Salita de' Crescenzi 31",mq:"Armando al Pantheon, Roma",price:"14–18 €",when:"Comida",tip:"Armando es pequeño y familiar: reservad con días de antelación.",c:"Bucatini all'amatriciana",q:"amatriciana pasta"},
    {k:"carciofi",reg:"Roma",n:"Alcachofa a la judía",s:"Frita entera, crujiente como una flor.",l:"La alcachofa se fríe entera hasta que se abre como una flor dorada y crujiente. Es el plato estrella del Gueto judío y febrero es plena temporada.",where:"Nonna Betta · Via del Portico d'Ottavia 16",mq:"Nonna Betta, Roma",price:"8–10 €",when:"Comida en el Gueto",tip:"Pedid también la alcachofa 'alla romana', guisada: así comparáis.",c:"Carciofi alla giudia",q:"carciofi alla giudia"},
    {k:"suppli",reg:"Roma",n:"Supplì",s:"Croqueta de arroz con mozzarella que se estira.",l:"Una croqueta de arroz con tomate y un corazón de mozzarella que, al partirla, se estira como el hilo de un teléfono. Por eso en Roma la llaman 'supplì al telefono'.",where:"Supplì Roma · Via di San Francesco a Ripa 137",mq:"Supplì Roma, Via di San Francesco a Ripa 137",price:"2–3 €",when:"De lunes a sábado (el domingo cierra)",tip:"Comedlo recién hecho y de pie, como los romanos. Si vais en domingo, en Trastevere hay más tiendas de supplì abiertas.",c:"Supplì",q:"suppli roman rice ball"},
    {k:"taglio",reg:"Roma",n:"Pizza al taglio",s:"Pizza por porciones, al peso, para comer andando.",l:"Pizza en bandejas rectangulares que se corta con tijera y se paga al peso. Masa alta y crujiente y mil sabores. El tentempié perfecto entre visita y visita.",where:"Antico Forno Roscioli · Via dei Chiavari 34",mq:"Antico Forno Roscioli, Roma",price:"3–6 €",when:"A media mañana",tip:"Pedid la 'pizza rossa' sencilla: solo tomate. Es la más romana.",c:"Pizza al taglio",q:"pizza al taglio Rome"},
    {k:"maritozzo",reg:"Roma",n:"Maritozzo",s:"Bollo tierno relleno de nata, para desayunar.",l:"Un bollo dulce y esponjoso abierto por la mitad y relleno hasta arriba de nata montada. Antes los novios lo regalaban con un anillo escondido dentro.",where:"Pasticceria Regoli · Via dello Statuto 60",mq:"Pasticceria Regoli, Roma",price:"3–5 €",when:"Desayuno",tip:"Regoli está a cinco minutos de casa: desayuno perfecto antes del Coliseo.",c:"Maritozzi",q:"maritozzo con la panna"},
    {k:"cornetto",reg:"Roma",n:"Cappuccino y cornetto",s:"El desayuno romano, de pie en la barra.",l:"Un cappuccino espumoso y un cornetto, el cruasán italiano, más dulce y tierno. Se toma de pie en la barra en cinco minutos. Después de las 11, los italianos ya solo piden espresso.",where:"Sant'Eustachio Il Caffè · junto al Panteón",mq:"Sant'Eustachio Il Caffè, Roma",price:"3–4 €",when:"Desayuno",tip:"En la barra cuesta la mitad que sentados en la mesa.",c:"Cappuccino",q:"cappuccino cornetto Italian breakfast"},
    {k:"tiramisu",reg:"Roma",n:"Tiramisú",s:"Mascarpone, café y cacao. Para llevar en cajita.",l:"Bizcocho empapado en café, crema de mascarpone y cacao por encima. En Pompi lo venden en cajitas individuales de sabores: clásico, pistacho o fresa.",where:"Pompi · Via della Croce 82",mq:"Pompi Tiramisù, Via della Croce, Roma",price:"5–6 €",when:"Después de Plaza de España",tip:"Comprad dos de sabores distintos y os los cambiáis a medias.",c:"Tiramisu",q:"tiramisu dessert"},
    {k:"gelato",reg:"Roma",n:"Gelato",s:"Cremoso y natural. Si es de colores chillones, huye.",l:"El buen gelato artesano se guarda en cubetas de metal tapadas y tiene colores suaves: el de pistacho es marrón verdoso, no verde fosforito. Se pide en cucurucho o tarrina con dos o tres sabores.",where:"Fatamorgana · Piazza degli Zingari 5, Monti",mq:"Fatamorgana Monti, Roma",price:"3–5 €",when:"Cualquier momento",tip:"Probad pistacho y 'nocciola' (avellana): son la prueba de una buena gelatería.",c:"Gelato",q:"gelato Rome gelateria"},
    {k:"margherita",reg:"Nápoles",n:"Pizza margherita",s:"Borde alto y blando, tomate San Marzano y fior di latte.",l:"La pizza nació en Nápoles y aquí se hace como hace siglos: masa fina en el centro, borde hinchado y tierno, tomate, mozzarella y albahaca, en horno de leña noventa segundos.",img:"pizza.jpg",where:"Da Michele · Via Cesare Sersale 1",mq:"L'Antica Pizzeria da Michele, Napoli",price:"5–10 €",when:"Comida o merienda en Nápoles",tip:"Se come con cuchillo y tenedor o doblada 'a portafoglio', como una cartera.",c:"Pizza Margherita",q:"pizza margherita Napoli"},
    {k:"fritta",reg:"Nápoles",n:"Pizza frita",s:"Masa frita rellena de ricotta y embutido.",l:"La pizza de la calle de Nápoles: masa rellena de ricotta, provola y embutido que se fríe hasta quedar dorada e hinchada. Se come en un papel, paseando.",where:"Zia Esterina Sorbillo · Via dei Tribunali 35",mq:"Zia Esterina Sorbillo, Napoli",price:"4–6 €",when:"Paseando por Tribunali",tip:"Pedid una para compartir: llena muchísimo.",c:"Pizza fritta",q:"pizza fritta Napoli"},
    {k:"sfogliatella",reg:"Nápoles",n:"Sfogliatella",s:"Hojaldre crujiente con ricotta y naranja.",l:"Un dulce en forma de concha hecho con capas finísimas de hojaldre que crujen al morder, relleno de ricotta, sémola y piel de naranja. Mejor templada.",where:"Sfogliatella Mary · Galleria Umberto I",mq:"Sfogliatella Mary, Napoli",price:"2–3 €",when:"Antes del tren de vuelta",tip:"Hay dos tipos: 'riccia' (crujiente) y 'frolla' (de masa quebrada). Probad la riccia.",c:"Sfogliatelle",q:"sfogliatella"},
    {k:"baba",reg:"Nápoles",n:"Babà",s:"Bizcocho borracho de ron, muy napolitano.",l:"Un bizcocho esponjoso en forma de seta empapado en almíbar de ron. Tan napolitano que, para decir que algo es maravilloso, dicen 'è nu babbà'.",where:"Gran Caffè Gambrinus · Via Chiaia 1",mq:"Gran Caffè Gambrinus, Napoli",price:"3–5 €",when:"Con un café",tip:"Gambrinus es el café histórico de Nápoles: merece la pena entrar a verlo.",c:"Babà",q:"baba au rhum Napoli"}
  ];
  ["carbonara","cacio","amatriciana","carciofi","suppli","taglio","maritozzo","cornetto","tiramisu","gelato","sfogliatella"].forEach(function(k){FOOD.forEach(function(f){if(f.k===k)f.img="food/"+k+".jpg";});});
  FOOD.forEach(function(f){INFO["food-"+f.k]={n:f.n,cat:"Qué probar · "+f.reg,s:f.s,l:f.l,img:f.img,cover:{c:f.c,q:f.q},
    facts:[["Dónde probarlo",f.where],["Precio aprox.",f.price],["Cuándo",f.when],["Dónde",f.reg]],tip:f.tip,mq:f.mq,route:f.reg==="Roma"?f.mq:null,gq:f.q};});
  (function(){var box=document.getElementById("dishes");if(!box)return;
    FOOD.forEach(function(f){var b=document.createElement("button");b.type="button";b.className="dish";b.setAttribute("aria-label",f.n+". Ver fotos y dónde probarlo");
      b.innerHTML='<div class="ph"><span class="ini" aria-hidden="true"></span><img alt="" loading="lazy"></div><div class="tx"><span></span><i></i><p></p><span class="more-hint">Ver fotos ›</span></div>';
      b.querySelector(".ini").textContent=f.n.charAt(0);b.querySelector(".tx span").textContent=f.reg;b.querySelector("i").textContent=f.n;b.querySelector("p").textContent=f.s;
      var im=b.querySelector("img");im.alt=f.n;im.addEventListener("load",function(){im.classList.add("ok");});
      if(f.img)im.src=f.img;else cover({c:f.c,q:f.q}).then(function(x){if(x)im.src=x.u;}).catch(function(){});
      b.addEventListener("click",function(){openInfo("food-"+f.k);});box.appendChild(b);});})();

  /* ---------- Info de las opciones a decidir ---------- */
  var OPTX={
    taverna:{l:"Trattoria pequeña y de toda la vida en Monti, a unos 18 minutos de casa. Cocina romana clásica: carbonara, amatriciana, cacio e pepe y alcachofas en temporada. Ambiente de barrio, manteles y vino de la casa.",f:[["Dónde","Via della Madonna dei Monti 79"],["Desde casa","Unos 18 min andando"],["Precio aprox.","25–35 € por persona"],["Ojo","Hay que reservar"]],tip:"Llamad o reservad en cuanto tengáis la hora del vuelo: es pequeña y se llena.",cover:{c:"Spaghetti alla carbonara",q:"trattoria Roma"},gq:"Rione Monti Rome street",route:"Taverna Romana, Via della Madonna dei Monti 79, Roma"},
    taglio:{l:"Pizza por porciones y al peso para ir comiendo por Monti y bajar después al Coliseo iluminado. Rápido, barato y sin estar pendientes de la hora.",f:[["Precio aprox.","5–10 € por persona"],["Tiempo","Lo que queráis"],["Ventaja","Más rato para pasear"]],tip:"Señalad el trozo y decid 'un pezzo così' con las manos: se paga por peso.",cover:{c:"Pizza al taglio",q:"pizza al taglio"},gq:"pizza al taglio Rome"},
    casa:{l:"Pasar por una tienda del barrio, comprar embutido, queso, pan y una botella de vino y cenar tranquilos en el porche de casa. La opción más relajada para la primera noche.",f:[["Precio aprox.","15–25 € para los dos"],["Dónde","En nuestro porche"],["Ventaja","Sin prisas ni reservas"]],tip:"Pedid 'un etto' (100 g) de cada cosa: mortadela, prosciutto y un pecorino.",img:"casa-porche.jpg",gq:"Italian salumi cheese board"},
    dimatteo:{l:"Una de las pizzerías históricas de Via dei Tribunali. Además de la pizza, es famosa por la frittatina, una croqueta de pasta frita que venden por la ventanilla a la calle.",f:[["Dónde","Via dei Tribunali 94"],["Precio aprox.","5–10 € por pizza"],["Ambiente","Ruidoso y auténtico"]],tip:"Apuntaos en la lista nada más llegar y mientras esperáis, una frittatina.",cover:{q:"Antica Pizzeria Di Matteo"},gq:"Via dei Tribunali Napoli"},
    donnasofia:{l:"Pizzería y cocina napolitana con mesas en plena Via dei Tribunali. Más tranquila que las famosas, con platos de la abuela además de pizza.",f:[["Dónde","Via dei Tribunali 89"],["Precio aprox.","8–15 € por persona"],["Ambiente","Familiar"]],tip:"Si os apetece algo más que pizza, aquí podéis probar la pasta y patate napolitana.",cover:{c:"Pizza Margherita",q:"pizza napoletana"},gq:"Via dei Tribunali Napoli"},
    sorbillo:{l:"La pizzería más famosa de la calle: pizzas enormes que se salen del plato, masa muy fina y borde altísimo. Siempre hay cola, pero va rápida.",f:[["Dónde","Via dei Tribunali 32"],["Precio aprox.","5–12 € por pizza"],["Ambiente","Mucha gente y mucha vida"]],tip:"Al lado está Zia Esterina, de la misma familia, con la pizza frita para llevar.",cover:{q:"Sorbillo pizzeria Napoli"},gq:"Sorbillo Napoli"},
    castel:{l:"Empezó siendo el mausoleo del emperador Adriano, luego fue fortaleza y cárcel de los papas, unida al Vaticano por un pasadizo secreto. Arriba, una terraza con el ángel de bronce y una de las mejores vistas del río y de San Pedro.",f:[["Precio","De pago"],["Tiempo","1,5 horas"],["Mejor momento","Por la mañana"]],tip:"La terraza de arriba es donde se desarrolla el último acto de la ópera Tosca.",cover:{c:"Castel Sant'Angelo",q:"Castel Sant'Angelo Rome"},gq:"Castel Sant'Angelo",route:"Castel Sant'Angelo, Roma"},
    fuera:{l:"Ver San Pedro, Castel Sant'Angelo y el resto por fuera, sin colas ni entradas, y dedicar ese tiempo a perderse por Trastevere y subir con calma al Gianicolo.",f:[["Precio","Gratis"],["Ventaja","Más paseo, menos colas"],["Ideal si","Hace buen tiempo"]],tip:"Es el día de despedida: a veces lo mejor es no correr.",img:"p-trastevere.jpg",gq:"Trastevere Rome"},
    angeletto:{l:"Una gelatería pequeña de Monti, cerca de la plaza del barrio. Sabores clásicos muy bien hechos: pistacho, avellana, chocolate.",f:[["Dónde","Monti, junto a la plaza"],["Desde casa","Unos 15 min andando"],["Precio aprox.","3–5 €"]],tip:"Perfecta después de la primera cena en Monti.",cover:{c:"Gelato",q:"gelato gelateria"},gq:"gelato Rome"},
    fatamorgana:{l:"Gelato artesano con sabores originales y naturales, sin gluten: chocolate con tabaco, pera y gorgonzola, basilico... y también los clásicos.",f:[["Dónde","Piazza degli Zingari 5, Monti"],["Desde casa","Unos 15 min andando"],["Precio aprox.","3–5 €"]],tip:"Dejad que os den a probar con la cucharilla antes de elegir.",cover:{q:"Fatamorgana gelato"},gq:"gelato Rome"},
    comeillatte:{l:"Gelato muy cremoso, hecho con leche fresca, y un detalle: el cucurucho se baña por dentro en chocolate caliente o se corona con nata.",f:[["Dónde","Via Silvio Spaventa, cerca de Termini"],["Desde casa","Unos 20 min andando"],["Precio aprox.","3–5 €"]],tip:"Pedid el cucurucho con chocolate negro por dentro.",cover:{c:"Gelato",q:"gelato cone chocolate"},gq:"gelato cone"}
  };
  var OPTIMG={taverna:"food/monti.jpg",taglio:"food/taglio.jpg",dimatteo:"food/tribunali.jpg",donnasofia:"food/margherita2.jpg",sorbillo:"food/sorbillo.jpg",castel:"food/castel.jpg",angeletto:"food/gelato.jpg",fatamorgana:"food/gelato.jpg",comeillatte:"food/gelato.jpg"};
  Object.keys(OPTIMG).forEach(function(k){if(OPTX[k])OPTX[k].img=OPTIMG[k];});
  function openOpt(dk,ok){if(ok==="cupula"){openDetail("cupola");return;}
    var dc=DEC.filter(function(x){return x.k===dk;})[0],op=dc&&dc.o.filter(function(x){return x.k===ok;})[0],x=OPTX[ok]||{};if(!op)return;
    var id="opt-"+ok;INFO[id]={n:op.n,cat:dc.t,s:op.s,l:x.l||op.s,img:x.img,cover:x.cover||{q:op.n},facts:x.f||[],tip:x.tip,mq:op.q,route:x.route||null,gq:x.gq||op.n,vote:[dk,ok]};
    openInfo(id);}
  DEC.forEach(function(dc){dc.o.forEach(function(op){var x=OPTX[op.k];if(!x)return;INFO["opt-"+op.k]={n:op.n,cat:dc.t,s:op.s,l:x.l,img:x.img,cover:x.cover||{q:op.n},facts:x.f||[],tip:x.tip,mq:op.q,route:x.route||null,gq:x.gq||op.n,vote:[dc.k,op.k]};});});
  window.__ideasReady=true;renderIdeas();renderSel();renderPlans();drawMap(mapDay);
  if(/^#ver-/.test(location.hash))routeHash();

  function summary(){
    var L=["Roma y Pompeya · lo que hemos elegido",""];
    var w=IDEAS.filter(function(i){return mine["w_"+i.k];});
    L.push("PLANES ("+w.length+")");
    w.forEach(function(i){var d=dayOf(i.k);L.push("- "+i.n+(d?" · "+DAYC[d][0]:" · sin día"));});
    if(!w.length)L.push("- (ninguno todavía)");
    L.push("","PLAN DÍA A DÍA");
    DAYIDS.forEach(function(day){L.push("",DAYC[SHORT[day]][0].toUpperCase());itin(day).forEach(function(it){L.push("- "+it.t+" · "+it.n);});});
    L.push("","VOTACIONES");
    DEC.forEach(function(dc){var o=dc.o.filter(function(x){return x.k===mine[dc.k];})[0];L.push("- "+dc.t+": "+(o?o.n:"sin elegir"));});
    if(mine.note){L.push("","NOTAS",mine.note);}
    return L.join("\n");}
  var shSt=document.getElementById("share-state");
  document.getElementById("share-btn").addEventListener("click",function(){var t=summary();
    if(navigator.share){navigator.share({title:"Roma y Pompeya",text:t}).catch(function(){});}
    else{copyTxt(t);}});
  function copyTxt(t){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(t).then(function(){shSt.textContent="Copiado. Pégalo donde quieras.";},function(){fallback(t);});}else fallback(t);}
  function fallback(t){noteEl.value=noteEl.value;var ta=document.createElement("textarea");ta.value=t;ta.style.position="fixed";ta.style.opacity="0";document.body.appendChild(ta);ta.select();try{document.execCommand("copy");shSt.textContent="Copiado.";}catch(e){shSt.textContent="No se ha podido copiar.";}ta.remove();}
  document.getElementById("copy-btn").addEventListener("click",function(){copyTxt(summary());});



  /* ---------- Pack list ---------- */
  var saved=Sync.packing;
  var boxes=[].slice.call(document.querySelectorAll("#pack input")),prog=document.getElementById("progress");
  function upd(){var c=boxes.filter(function(b){return b.checked;}).length;prog.textContent=c===boxes.length?"Todo listo. ¡Nos vamos!":c+" de "+boxes.length+" listos";}
  boxes.forEach(function(b){if(saved[b.id])b.checked=true;b.addEventListener("change",function(){Sync.pack(b.id,b.checked);upd();});});
  upd();
  function packApply(){boxes.forEach(function(b){b.checked=!!Sync.packing[b.id];});upd();}

  /* ---------- Novedades ---------- */
  var DECT={};DEC.forEach(function(d){DECT[d.k]=d;});
  function ago(t){var s=(Date.now()-t)/1000;if(s<60)return "ahora mismo";if(s<3600)return "hace "+Math.floor(s/60)+" min";if(s<86400)return "hace "+Math.floor(s/3600)+" h";
    var d=Math.floor(s/86400);return d===1?"ayer":"hace "+d+" días";}
  function who(id){var p=profiles[id];return p?(p.isMe?"Tú":p.name):"Alguien";}
  function dayName(d){return (DAYC[SHORT[d]]||[d])[0].toLowerCase();}
  function feedText(a){var w=who(a.memberId),me=profiles[a.memberId]&&profiles[a.memberId].isMe,d=a.data||{};
    switch(a.kind){
      case "wish":return w+(me?" has marcado":" ha marcado")+" «"+(d.label||d.plan)+"» como plan que apetece";
      case "vote":var dc=DECT[d.decision];if(!d.option)return w+(me?" has quitado tu voto":" ha quitado su voto")+(dc?" en «"+dc.t+"»":"");
        return w+(me?" has votado":" ha votado")+" «"+(d.label||d.option)+"»"+(dc?" en «"+dc.t+"»":"");
      case "itinerary":var t=(d.summary||"ha cambiado el plan");if(me)t=t.replace(/^ha /,"has ");return w+" "+t+" el "+dayName(d.day);
      case "itinerary_reset":return w+(me?" has vuelto":" ha vuelto")+" al plan original del "+dayName(d.day);
      case "note":return w+(me?" has escrito":" ha escrito")+" en las notas";
      case "surprise_reaction":return w+(me?" has respondido a la sorpresa":" ha respondido a la sorpresa")+(d.reaction==="love"?" ❤":"");
    }return w+" ha hecho un cambio";}
  function renderFeed(){var ul=document.getElementById("feed");if(!ul)return;var acts=(Sync.state&&Sync.state.activity)||[];ul.innerHTML="";
    if(!acts.length){ul.innerHTML='<li class="feed-empty">Aquí aparecerá lo que vaya cambiando cada uno.</li>';return;}
    acts.slice(0,12).forEach(function(a){var li=document.createElement("li"),p=profiles[a.memberId]||{};
      li.innerHTML='<span class="feed-av"></span><span><span class="feed-t"></span><small></small></span>';
      var av=li.querySelector(".feed-av");av.style.background=p.color||"var(--muted)";av.textContent=initials(p.isMe?(p.name||"Tú"):(p.name||"?"));
      li.querySelector(".feed-t").textContent=feedText(a);li.querySelector("small").textContent=ago(a.at);ul.appendChild(li);});}
  renderFeed();

  /* ---------- Cambios que llegan del servidor ---------- */
  Sync.defaults=PLAN_DEF;
  Sync.labeler=function(k,v){if(k.indexOf("w_")===0){var i=idea(k.slice(2));return i?i.n:null;}
    var dc=DECT[k];if(dc&&v){var o=dc.o.filter(function(x){return x.k===v;})[0];return o?o.n:null;}return null;};
  Sync.on("state",function(){mine=Sync.mine;applyEveryone();render();packApply();renderFeed();
    if(shCur&&sheet.classList.contains("open"))paintSheet();
    if(window.__onRemote)window.__onRemote();});
  Sync.on("conflict",function(day){var other=Object.keys(profiles).filter(function(id){return !profiles[id].isMe;})[0];
    toast((other?profiles[other].name:"La otra persona")+" acababa de cambiar el "+dayName(day)+". Te enseño su versión.");});
})();

// Sorelly Admin · montagem — mobile/motoboy.js
// H&O Delivery · App do motoboy (29/10/2026, projeto da H&O Apps). Protótipo que FUNCIONA de ponta a ponta no celular simulado:
// Início (mapa total + botão grande, layout "E" aprovado pelo Marcus) → oferta com contagem → corrida em 4 etapas (coleta com foto,
// entrega com PIN) → ganhos, histórico e perfil com documentos. Tudo local (useState): ainda NÃO há servidor, despacho, pagamento nem Admin Cloud.
// Valores, nomes e endereços são de exemplo. Regra do projeto: endereço completo só depois de aceitar; sem documento válido não fica online.
import { hora } from "@/apps/montagem/lib/format";
import { IconesStatus } from "@/apps/montagem/mobile/iphone";
import { useAgora } from "@/apps/montagem/ui/relogio";
import { e, useEffect, useState } from "@/shared/react";

var NAVY = "#0B0B0D", OURO = "#E8B84B", VERDE = "#16A34A", VERM = "#DC2626", CINZA = "#6B7280", LINHA = "#E5E7EB", FUNDO = "#F2F3F5";   // paleta única dos apps (mobile/cores-app.js), a mesma do app da revendedora
var brl = function(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var PIN_ENTREGA = "4821";   // o destinatário recebe este PIN no link de rastreio; o motoboy digita na entrega

var IC = {
  sino:"M12 3a6 6 0 0 0-6 6v3.6L4.5 16h15L18 12.6V9a6 6 0 0 0-6-6zm-2 15a2 2 0 0 0 4 0",
  ajuda:"M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01",
  alvo:"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 1v4M12 19v4M1 12h4M19 12h4",
  casa:"M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  grana:"M4.5 6h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  hist:"M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4M12 8v4l3 2",
  perfil:"M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21c0-4 3.6-6 8-6s8 2 8 6",
  caixa:"M3 7.5L12 3l9 4.5v9L12 21l-9-4.5zM3 7.5L12 12l9-4.5M12 12v9",
  gps:"M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12zM12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  alerta:"M12 3L2 20h20zM12 10v4M12 17h.01",
  ok:"M5 12.5l4.5 4.5L19 7.5",
  camera:"M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
  fechar:"M6 6l12 12M18 6L6 18"
};
function Ic(p){
  return e("svg",{viewBox:"0 0 24 24", width:p.s||20, height:p.s||20, fill:p.cheio ? "currentColor" : "none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round", "aria-hidden":true, style:p.style}, e("path",{d:IC[p.n]}));
}

// corridas de exemplo (o motor de despacho real manda estas ofertas)
var OFERTAS = [
  {id:"E-2041", valor:16, km:3.2, min:14, coleta:"Batel", entrega:"Água Verde", ruaC:"Av. Vicente Machado, 1200", quemC:"Ana Paula · revendedora Sorelly", ruaE:"Rua Água Verde, 850, ap. 32", quemE:"Juliana Prado", tipo:"Semijoias", peso:"até 1 kg", decl:350, pagto:"Pago no app", dist:0.6},
  {id:"E-2042", valor:22, km:5.8, min:22, coleta:"Centro", entrega:"Portão", ruaC:"Rua XV de Novembro, 410, sala 5", quemC:"Camila Ribeiro · revendedora Sorelly", ruaE:"Av. República Argentina, 2100", quemE:"Fernanda Lopes", tipo:"Semijoias", peso:"até 1 kg", decl:520, pagto:"Pago no app", dist:1.1},
  {id:"E-2043", valor:12, km:2.1, min:10, coleta:"Cabral", entrega:"Juvevê", ruaC:"Rua Mateus Leme, 700", quemC:"Patrícia Gomes · revendedora Sorelly", ruaE:"Rua Fernando Moreira, 95", quemE:"Marisa Duarte", tipo:"Documento", peso:"envelope", decl:0, pagto:"Pago no app", dist:1.8}
];
var HIST0 = [16,12,22,18,14,10,16,20,14].map(function(v, i){ var locais = [["Batel","Água Verde"],["Centro","Rebouças"],["Cabral","Juvevê"],["Portão","Novo Mundo"],["Água Verde","Batel"],["Bigorrilho","Mercês"],["Alto da XV","Centro"],["Santa Felicidade","Campina do Siqueira"],["Hauer","Boqueirão"]][i];
  return {id:"E-20"+(30+i), de:locais[0], para:locais[1], valor:v, hora:String(8+Math.floor(i/2)).padStart(2,"0")+":"+(i%2 ? "40" : "10"), status:"finalizada"}; }).reverse();
var DOCS0 = [
  {id:"cnh", nome:"CNH categoria A", st:"aprovado", nota:"Vence em 12 dias"},
  {id:"crlv", nome:"CRLV da moto", st:"aprovado", nota:"Honda CG 160 · ABC-1D23"},
  {id:"lic", nome:"Licença de motofrete (Curitiba)", st:"aprovado", nota:"Vigente"},
  {id:"pix", nome:"Conta Pix para repasses", st:"aprovado", nota:"CPF final 84"}
];
var AVISOS0 = [
  {id:1, t:"CNH vence em 12 dias", d:"Envie a nova em Perfil para não perder corridas.", cor:OURO},
  {id:2, t:"Bônus no Batel", d:"+R$ 4,00 por entrega até as 19:00.", cor:VERDE},
  {id:3, t:"Repasse de ontem pago", d:"R$ 168,00 via Pix.", cor:"#2F7BFF"}
];
var ETAPAS = {
  caminho:{rot:"A caminho da coleta", btn:"Cheguei à coleta", n:1},
  coleta:{rot:"Na coleta", btn:"Mercadoria retirada", n:2},
  transporte:{rot:"Em transporte", btn:"Cheguei ao destino", n:3},
  destino:{rot:"No destino", btn:"Confirmar entrega", n:4},
  devolucao:{rot:"Devolvendo ao remetente", btn:"Devolução concluída", n:4}
};
var STATUS_COR = {finalizada:["#DCFCE7","#15803D","Concluída"], falha:["#FEE2E2","#B91C1C","Falha"], disputa:["#FEF3C7","#B45309","Em disputa"], cancelada:["#E5E7EB","#374151","Cancelada"], devolvida:["#FEF3C7","#B45309","Devolvida"]};
var DOC_COR = {aprovado:["#DCFCE7","#15803D","Aprovado"], pendente:["#FEF3C7","#B45309","Pendente"], vencido:["#FEE2E2","#B91C1C","Vencido"], recusado:["#FEE2E2","#B91C1C","Recusado"]};

function Chip(p){ return e("span",{className:"inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold", style:{background:p.bg, color:p.cor}}, p.children); }

// ---------- celular (mesma forma do iPhone 15 dos outros apps, mas a tela ocupa tudo: o mapa vai até a borda) ----------
function Cel(p){
  var agora = useAgora();
  var botao = function(lado, top, h){ return e("span",{className:"absolute w-[3px] rounded-sm bg-[#2B2B2F] "+(lado==="e" ? "-left-[3px]" : "-right-[3px]"), style:{top:top, height:h}}); };
  return e("div",{className:"relative w-[356px] shrink-0 rounded-[62px] bg-[#0A0A0B] p-[10px] shadow-[0_0_0_2px_#2B2B2F,0_0_0_4px_#0A0A0B,0_40px_80px_-24px_rgba(0,0,0,.85)]"},
    botao("e",120,30), botao("e",176,56), botao("e",244,56), botao("d",206,90),
    e("div",{className:"relative h-[733px] overflow-hidden rounded-[52px]", style:{background:FUNDO, color:NAVY, fontFamily:"Inter, system-ui, sans-serif"}},
      e("div",{className:"absolute left-1/2 top-[11px] z-[60] flex h-[32px] w-[108px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-3"}, e("span",{className:"size-2.5 rounded-full bg-[#101624] ring-1 ring-[#1d2a44]"})),
      e("div",{className:"absolute inset-x-0 top-0 z-[55] flex h-[44px] items-center justify-between px-8 pt-1 text-[15px] font-semibold", style:{color:NAVY}}, e("span",null, hora(agora)), e(IconesStatus)),
      p.children,
      e("span",{className:"absolute bottom-2 left-1/2 z-[60] h-[5px] w-[124px] -translate-x-1/2 rounded-full bg-[#111]"})));
}

// ---------- mapa (desenho; o real usa mapa + GPS) ----------
function Mapa(p){
  var pos = p.eu || [150, 400];
  return e("svg",{viewBox:"0 0 340 700", preserveAspectRatio:"xMidYMid slice", className:"absolute inset-0 h-full w-full", "aria-hidden":true},
    e("rect",{width:340, height:700, fill:"#EAEDF1"}),
    e("path",{d:"M-10 90h120v110H-10z", fill:"#D6EBD8"}), e("path",{d:"M230 430h120v100H230z", fill:"#D6EBD8"}),
    e("path",{d:"M-10 560c90-30 150 40 230 10s110-50 140-30v200H-10z", fill:"#CFE3F4"}),
    e("g",{stroke:"#D5DAE1", strokeWidth:16, fill:"none", strokeLinecap:"round"}, e("path",{d:"M-10 210L350 260"}), e("path",{d:"M120 -10L170 710"}), e("path",{d:"M-10 420L350 380"})),
    e("g",{stroke:"#fff", strokeWidth:14, fill:"none", strokeLinecap:"round"}, e("path",{d:"M-10 210L350 260"}), e("path",{d:"M120 -10L170 710"}), e("path",{d:"M-10 420L350 380"})),
    e("g",{stroke:"#fff", strokeWidth:8, fill:"none", strokeLinecap:"round"}, e("path",{d:"M-10 120h360"}), e("path",{d:"M-10 320h360"}), e("path",{d:"M-10 500h360"}), e("path",{d:"M60 -10v720"}), e("path",{d:"M240 -10v720"}), e("path",{d:"M300 -10v720"}), e("path",{d:"M-10 60L350 20"}), e("path",{d:"M200 330L350 560"})),
    p.rota && e("path",{d:p.rota, stroke:OURO, strokeWidth:5, fill:"none", strokeLinecap:"round", strokeLinejoin:"round"}),
    (p.pins||[]).map(function(x, i){ return e("g",{key:i, opacity:p.pinsOp==null ? 1 : p.pinsOp},
      e("rect",{x:x[0]-25, y:x[1]-12, width:50, height:24, rx:12, fill:OURO, stroke:NAVY, strokeWidth:2}),
      e("text",{x:x[0], y:x[1]+4, fontSize:11, fontWeight:800, fill:NAVY, textAnchor:"middle"}, x[2])); }),
    (p.marcas||[]).map(function(m, i){ return e("g",{key:"m"+i, transform:"translate("+m[0]+" "+m[1]+")"}, e("circle",{r:12, fill:m[2], stroke:"#fff", strokeWidth:3})); }),
    e("g",{style:{transform:"translate("+pos[0]+"px,"+pos[1]+"px)", transition:"transform .9s ease"}}, e("circle",{r:34, fill:"#2F7BFF", opacity:.2}), e("circle",{r:11, fill:"#2F7BFF", stroke:"#fff", strokeWidth:4})));
}

function BotaoRedondo(p){   // botão grande liga/desliga
  var on = p.online;
  return e("button",{onClick:p.onClick, "aria-label":on ? "Pausar" : "Ficar online", className:"relative grid shrink-0 place-items-center rounded-full text-center font-extrabold leading-tight", style:{width:p.t, height:p.t, background:on ? VERDE : OURO, color:on ? "#fff" : NAVY, border:"6px solid #fff", boxShadow:"0 6px 18px rgba(15,27,51,.3)", fontSize:13}},
    on ? e("span",null, "ONLINE", e("small",{className:"block text-[11px] font-semibold opacity-90"}, "toque p/ pausar")) : e("span",null, "FICAR", e("br"), "ONLINE"));
}

function Folha(p){   // folha que sobe de baixo, com fundo escurecido
  return e("div",{className:"absolute inset-0 z-50 flex items-end", style:{background:"rgba(8,14,26,.55)"}, onClick:p.onFechar},
    e("div",{className:"w-full rounded-t-[26px] bg-white px-4 pb-8 pt-3", style:{maxHeight:"88%", overflowY:"auto"}, onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"mx-auto mb-3 h-1 w-10 rounded-full", style:{background:LINHA}}), p.children));
}

// ---------- telas ----------
function Cabeca(p){   // título das telas internas (Ganhos, Histórico, Perfil)
  return e("div",{className:"px-4 pb-2 pt-[52px]"}, e("h2",{className:"text-[20px] font-extrabold tracking-tight"}, p.t), p.sub && e("p",{className:"text-[13px]", style:{color:CINZA}}, p.sub));
}

function TelaGanhos(p){
  var ps = useState("dia"), per = ps[0], setPer = ps[1];
  var fin = p.hist.filter(function(h){ return h.status==="finalizada"; });
  var dia = fin.reduce(function(t, h){ return t+h.valor; }, 0);
  var semana = 700+dia, mes = 3180+dia;
  var total = per==="dia" ? dia : per==="semana" ? semana : mes;
  var barras = [96,134,88,152,121,0,dia];   // últimos 7 dias; o último é hoje
  var nomes = ["Qui","Sex","Sáb","Dom","Seg","Ter","Hoje"], max = Math.max.apply(null, barras.concat([200]));
  return e("div",{className:"absolute inset-x-0 bottom-[76px] top-0 overflow-y-auto"},
    e(Cabeca,{t:"Ganhos", sub:"Valores que você recebe, sem a taxa da plataforma."}),
    e("div",{className:"mx-4 mt-1 flex rounded-xl p-1", style:{background:"#E3E6EB"}}, [["dia","Dia"],["semana","Semana"],["mes","Mês"]].map(function(o){ return e("button",{key:o[0], onClick:function(){ setPer(o[0]); }, className:"h-8 flex-1 rounded-lg text-[13px] font-bold", style:per===o[0] ? {background:"#fff", boxShadow:"0 1px 3px rgba(0,0,0,.15)"} : {color:CINZA}}, o[1]); })),
    e("div",{className:"mx-4 mt-3 rounded-2xl bg-white p-4"},
      e("span",{className:"text-[11px] font-semibold", style:{color:CINZA}}, per==="dia" ? "Hoje" : per==="semana" ? "Últimos 7 dias" : "Mês atual"),
      e("div",{className:"text-[20px] font-extrabold tracking-tight", style:{color:VERDE}}, brl(total)),
      e("div",{className:"mt-3 flex h-[84px] items-end gap-2"}, barras.map(function(v, i){ return e("div",{key:i, className:"flex flex-1 flex-col items-center gap-1"},
        e("div",{className:"w-full rounded-md", style:{height:Math.max(4, v/max*64), background:i===6 ? OURO : "#D9DEE7"}}), e("span",{className:"text-[10px] font-semibold", style:{color:CINZA}}, nomes[i])); })),
      e("div",{className:"mt-3"}, e("div",{className:"mb-1 flex justify-between text-[11px] font-semibold"}, e("span",{style:{color:CINZA}}, "Meta do dia"), e("span",null, brl(dia)+" de "+brl(200))),
        e("div",{className:"h-2 overflow-hidden rounded-full", style:{background:LINHA}}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, dia/200*100)+"%", background:OURO}})))),
    e("p",{className:"px-5 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide", style:{color:CINZA}}, "Extrato de repasses"),
    e("div",{className:"mx-4 mb-4 overflow-hidden rounded-2xl bg-white"}, [["Hoje (parcial)", dia, "A receber amanhã"],["Ontem", 168, "Pago via Pix"],["Quarta", 134, "Pago via Pix"],["Terça", 152, "Pago via Pix"]].map(function(r, i){
      return e("div",{key:i, className:"flex items-center justify-between px-4 py-3", style:{borderTop:i ? "1px solid "+LINHA : "none"}},
        e("div",null, e("b",{className:"block text-[13px]"}, r[0]), e("span",{className:"text-[11px]", style:{color:CINZA}}, r[2])), e("b",{className:"text-[13px]"}, brl(r[1]))); })));
}

function TelaHistorico(p){
  return e("div",{className:"absolute inset-x-0 bottom-[76px] top-0 overflow-y-auto"},
    e(Cabeca,{t:"Histórico", sub:p.hist.length+" entregas hoje"}),
    e("div",{className:"mx-4 mb-4 flex flex-col gap-2"}, p.hist.map(function(h){ var c = STATUS_COR[h.status];
      return e("div",{key:h.id, className:"flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5"},
        e("div",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:"#FFF4D6", color:"#7A5600"}}, e(Ic,{n:"caixa", s:18})),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block truncate text-[13px]"}, h.de+" → "+h.para), e("span",{className:"text-[11px]", style:{color:CINZA}}, h.hora+" · "+h.id)),
        e("div",{className:"flex shrink-0 flex-col items-end gap-1"}, e("b",{className:"text-[13px]"}, brl(h.valor)), e(Chip,{bg:c[0], cor:c[1]}, c[2]))); })));
}

function TelaPerfil(p){
  var venc = p.docs.filter(function(d){ return d.st!=="aprovado"; });
  return e("div",{className:"absolute inset-x-0 bottom-[76px] top-0 overflow-y-auto"},
    e(Cabeca,{t:"Perfil"}),
    e("div",{className:"mx-4 flex items-center gap-3 rounded-2xl bg-white p-3"},
      e("div",{className:"grid size-14 shrink-0 place-items-center rounded-full text-[20px] font-extrabold", style:{background:NAVY, color:OURO}}, "RS"),
      e("div",null, e("b",{className:"block text-[15px]"}, "Rafael Souza"), e("span",{className:"text-[11px]", style:{color:CINZA}}, "Honda CG 160 · ABC-1D23"), e("div",{className:"mt-0.5 text-[13px] font-bold"}, "4,9 ★ ", e("span",{className:"font-medium", style:{color:CINZA}}, "· 312 entregas")))),
    venc.length>0 && e("div",{className:"mx-4 mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold", style:{background:"#FEE2E2", color:"#B91C1C"}}, e(Ic,{n:"alerta", s:18}), "Documento com problema: você não pode ficar online."),
    e("p",{className:"px-5 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide", style:{color:CINZA}}, "Documentos"),
    e("div",{className:"mx-4 overflow-hidden rounded-2xl bg-white"}, p.docs.map(function(d, i){ var c = DOC_COR[d.st];
      return e("div",{key:d.id, className:"flex items-center justify-between gap-2 px-4 py-3", style:{borderTop:i ? "1px solid "+LINHA : "none"}},
        e("div",{className:"min-w-0"}, e("b",{className:"block truncate text-[13px]"}, d.nome), e("span",{className:"text-[11px]", style:{color:d.st==="aprovado" ? CINZA : VERM}}, d.st==="vencido" ? "Vencido: envie o novo" : d.nota)),
        e(Chip,{bg:c[0], cor:c[1]}, c[2])); })),
    e("button",{onClick:p.simularVenc, className:"mx-4 mt-2 h-8 w-[calc(100%-32px)] rounded-lg border text-[11px] font-bold", style:{borderColor:LINHA, color:CINZA}}, p.docs[1].st==="vencido" ? "Teste: renovar CRLV" : "Teste: vencer o CRLV da moto"),
    e("p",{className:"px-5 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide", style:{color:CINZA}}, "Ajuda"),
    e("button",{onClick:p.suporte, className:"mx-4 mb-4 flex h-12 w-[calc(100%-32px)] items-center justify-center gap-2 rounded-2xl text-[13px] font-extrabold", style:{background:NAVY, color:"#fff"}}, e(Ic,{n:"ajuda", s:18}), "Falar com o suporte"));
}

function OfertaFolha(p){
  var o = p.o, seg = p.seg, r = 18, circ = 2*Math.PI*r;
  return e("div",{className:"absolute inset-0 z-50 flex items-end", style:{background:"rgba(8,14,26,.55)"}},
    e("div",{className:"w-full rounded-t-[26px] bg-white px-4 pb-8 pt-4"},
      e("div",{className:"mb-2 flex items-center justify-between"},
        e("span",{className:"flex items-center gap-2 text-[13px] font-bold"}, e(Chip,{bg:OURO, cor:NAVY}, "NOVA ENTREGA"), e("span",{style:{color:CINZA}}, o.tipo)),
        e("div",{className:"relative size-11"}, e("svg",{viewBox:"0 0 44 44", className:"size-11 -rotate-90"}, e("circle",{cx:22, cy:22, r:r, fill:"none", stroke:LINHA, strokeWidth:4}), e("circle",{cx:22, cy:22, r:r, fill:"none", stroke:OURO, strokeWidth:4, strokeLinecap:"round", strokeDasharray:circ, strokeDashoffset:circ*(1-seg/18), style:{transition:"stroke-dashoffset 1s linear"}})),
          e("b",{className:"absolute inset-0 grid place-items-center text-[13px]"}, seg))),
      e("div",{className:"mb-3 flex items-end justify-between"}, e("span",{className:"text-[20px] font-extrabold tracking-tight", style:{color:VERDE}}, brl(o.valor)), e("span",{className:"text-[13px] font-semibold", style:{color:CINZA}}, String(o.km).replace(".", ",")+" km · "+o.min+" min")),
      e("div",{className:"relative mb-3 pl-6"}, e("span",{className:"absolute bottom-2 left-[7px] top-2 border-l-2 border-dashed", style:{borderColor:"#B8C0CE"}}),
        e("div",{className:"relative mb-2 text-[13px]"}, e("span",{className:"absolute -left-[22px] top-1 size-2.5 rounded-full", style:{background:OURO}}), e("small",{className:"block text-[11px] font-semibold", style:{color:CINZA}}, "COLETA · a "+String(o.dist).replace(".", ",")+" km de você"), o.coleta+" (endereço após aceitar)"),
        e("div",{className:"relative text-[13px]"}, e("span",{className:"absolute -left-[22px] top-1 size-2.5 rounded-sm", style:{background:VERDE}}), e("small",{className:"block text-[11px] font-semibold", style:{color:CINZA}}, "ENTREGA"), o.entrega+" (endereço após aceitar)")),
      e("div",{className:"mb-3 flex flex-wrap gap-1.5"}, e(Chip,{bg:"#FFF4D6", cor:"#7A5600"}, o.peso), o.decl>0 && e(Chip,{bg:"#FFF4D6", cor:"#7A5600"}, "Valor declarado "+brl(o.decl)), e(Chip,{bg:"#FFF4D6", cor:"#7A5600"}, o.pagto)),
      e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"1fr 1.6fr"}},
        e("button",{onClick:p.recusar, className:"h-[52px] rounded-2xl border-2 text-[15px] font-extrabold", style:{borderColor:LINHA}}, "Recusar"),
        e("button",{onClick:p.aceitar, className:"h-[52px] rounded-2xl text-[15px] font-extrabold", style:{background:OURO, color:NAVY}}, "Aceitar")),
      e("p",{className:"mt-2 text-center text-[11px]", style:{color:CINZA}}, "Endereço completo só depois de aceitar.")));
}

function PainelCorrida(p){
  var c = p.c, et = ETAPAS[c.etapa];
  var alvoCol = c.etapa==="caminho" || c.etapa==="coleta";
  var devol = c.etapa==="devolucao";
  var rua = devol ? c.o.ruaC : alvoCol ? c.o.ruaC : c.o.ruaE, quem = devol ? c.o.quemC : alvoCol ? c.o.quemC : c.o.quemE;
  var pt = useState(""), pin = pt[0], setPin = pt[1];
  var errou = pin.length===4 && pin!==PIN_ENTREGA;
  var bloqueado = (c.etapa==="coleta" && !c.foto) || (c.etapa==="destino" && pin!==PIN_ENTREGA);
  return e("div",{className:"absolute inset-x-2.5 bottom-[84px] z-30 rounded-3xl bg-white p-3.5", style:{boxShadow:"0 10px 30px rgba(15,27,51,.3)"}},
    e("div",{className:"mb-2 flex items-center gap-1.5"}, [1,2,3,4].map(function(n){ return e("span",{key:n, className:"h-1.5 flex-1 rounded-full", style:{background:n<=et.n ? VERDE : LINHA}}); })),
    e("div",{className:"flex items-center justify-between"}, e("b",{className:"text-[15px]"}, et.rot), e("b",{className:"text-[15px]", style:{color:VERDE}}, brl(c.o.valor))),
    e("div",{className:"mt-1.5 flex items-start gap-2 text-[13px]"}, e("span",{style:{color:OURO, marginTop:2}}, e(Ic,{n:"gps", s:16})), e("div",{className:"min-w-0"}, e("b",{className:"block truncate"}, rua), e("span",{style:{color:CINZA}}, quem))),
    c.etapa==="coleta" && e("button",{onClick:p.foto, className:"mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-[13px] font-bold", style:c.foto ? {borderColor:VERDE, color:VERDE, background:"#E8F7F0"} : {borderColor:LINHA}}, e(Ic,{n:c.foto ? "ok" : "camera", s:18}), c.foto ? "Foto da coleta registrada" : "Registrar foto da coleta"),
    c.etapa==="destino" && e("div",{className:"mt-2.5"},
      e("label",{className:"mb-1 block text-[11px] font-bold", style:{color:CINZA}}, "PIN de 4 números que o destinatário recebeu"),
      e("input",{value:pin, onChange:function(ev){ setPin(ev.target.value.replace(/\D/g,"").slice(0,4)); }, inputMode:"numeric", placeholder:"0000", className:"h-11 w-full rounded-xl border px-3 text-center text-[20px] font-extrabold tracking-[.5em]", style:{borderColor:errou ? VERM : LINHA}}),
      errou && e("span",{className:"mt-1 block text-[11px] font-semibold", style:{color:VERM}}, "PIN incorreto. Peça de novo ao destinatário.")),
    e("div",{className:"mt-2.5 grid gap-2", style:{gridTemplateColumns:"auto 1fr"}},
      e("button",{onClick:p.problema, className:"h-[50px] rounded-2xl border px-3 text-[13px] font-bold", style:{borderColor:LINHA, color:CINZA}}, "Problema"),
      e("button",{onClick:function(){ setPin(""); p.avancar(); }, disabled:bloqueado, className:"h-[50px] rounded-2xl text-[15px] font-extrabold", style:{background:bloqueado ? "#C9CFDA" : VERDE, color:"#fff"}}, et.btn)));
}

function Nav(p){
  var itens = [["inicio","Início","casa"],["ganhos","Ganhos","grana"],["historico","Histórico","hist"],["perfil","Perfil","perfil"]];
  return e("div",{className:"absolute inset-x-0 bottom-0 z-40 flex h-[76px] border-t bg-white pb-3", style:{borderColor:LINHA}}, itens.map(function(t){ var on = p.tela===t[0];
    return e("button",{key:t[0], onClick:function(){ p.ir(t[0]); }, className:"flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", style:{color:on ? NAVY : CINZA}}, e("span",{style:{color:on ? OURO : CINZA}}, e(Ic,{n:t[2], s:22, cheio:on && t[0]==="inicio"})), t[1]); }));
}

// ---------- o app ----------
function AppMotoboy(){
  var st1 = useState("inicio"), tela = st1[0], setTela = st1[1];
  var st2 = useState(false), online = st2[0], setOnline = st2[1];
  var st3 = useState(null), oferta = st3[0], setOferta = st3[1];       // {o, seg}
  var st4 = useState(null), corrida = st4[0], setCorrida = st4[1];     // {o, etapa, foto}
  var st5 = useState(HIST0), hist = st5[0], setHist = st5[1];
  var st6 = useState(DOCS0), docs = st6[0], setDocs = st6[1];
  var st7 = useState(0), seq = st7[0], setSeq = st7[1];
  var st8 = useState(null), folha = st8[0], setFolha = st8[1];         // "avisos" | "suporte" | "problema" | {fim:...}
  var st9 = useState(""), toast = st9[0], setToast = st9[1];
  var avisoToast = function(t){ setToast(t); setTimeout(function(){ setToast(""); }, 2600); };

  var fin = hist.filter(function(h){ return h.status==="finalizada"; });
  var dia = fin.reduce(function(t, h){ return t+h.valor; }, 0);
  var docRuim = docs.find(function(d){ return d.st!=="aprovado"; });

  // oferta automática depois de ficar online (o despacho real manda por proximidade)
  useEffect(function(){
    if(!online || corrida || oferta) return;
    var t = setTimeout(function(){ setOferta({o:OFERTAS[seq%OFERTAS.length], seg:18}); }, 7000);
    return function(){ clearTimeout(t); };
  }, [online, corrida, oferta, seq]);
  // contagem regressiva; no zero a oferta expira e vai para o próximo motoboy
  useEffect(function(){
    if(!oferta) return;
    var t = setTimeout(function(){
      if(oferta.seg<=1){ setOferta(null); setSeq(seq+1); avisoToast("A oferta expirou."); }
      else setOferta({o:oferta.o, seg:oferta.seg-1});
    }, 1000);
    return function(){ clearTimeout(t); };
  }, [oferta]);

  var ligar = function(){
    if(corrida){ avisoToast("Termine a entrega antes de pausar."); return; }
    if(!online && docRuim){ avisoToast(docRuim.nome+": "+DOC_COR[docRuim.st][2].toLowerCase()+". Resolva em Perfil."); return; }
    setOnline(!online); if(online) setOferta(null);
  };
  var aceitar = function(){ setCorrida({o:oferta.o, etapa:"caminho", foto:false}); setOferta(null); setTela("inicio"); };
  var recusar = function(){ setOferta(null); setSeq(seq+1); };
  var registrar = function(status, valor){
    var o = corrida.o;
    setHist([{id:o.id, de:o.coleta, para:o.entrega, valor:valor, hora:hora(new Date()), status:status}].concat(hist));
    setCorrida(null); setSeq(seq+1);
  };
  var avancar = function(){
    var ordem = ["caminho","coleta","transporte","destino"], i = ordem.indexOf(corrida.etapa);
    if(corrida.etapa==="devolucao"){ registrar("devolvida", 0); setFolha({fim:"Devolução registrada", valor:0, nota:"O valor da devolução é definido pela central."}); return; }
    if(i<3){ setCorrida({o:corrida.o, etapa:ordem[i+1], foto:corrida.foto}); return; }
    registrar("finalizada", corrida.o.valor); setFolha({fim:"Entrega concluída", valor:corrida.o.valor, nota:"O repasse cai no seu Pix amanhã, após a confirmação do pagamento."});
  };
  var problema = function(tipo){
    setFolha(null);
    if(tipo==="ausente"){ setCorrida({o:corrida.o, etapa:"devolucao", foto:corrida.foto}); avisoToast("Devolva a mercadoria ao remetente."); return; }
    if(tipo==="avaria"){ registrar("disputa", 0); avisoToast("Disputa aberta. A central vai ligar para você."); return; }
    registrar("cancelada", 0); avisoToast("Corrida cancelada.");
  };
  var simularVenc = function(){
    var vence = docs[1].st!=="vencido";
    setDocs(docs.map(function(d){ return d.id==="crlv" ? Object.assign({}, d, {st:vence ? "vencido" : "aprovado"}) : d; }));
    if(vence && online && !corrida){ setOnline(false); setOferta(null); avisoToast("CRLV vencido: você ficou offline."); }
  };

  // posição do motoboy e da rota no mapa, conforme a etapa
  var COL = [110, 330], ENT = [250, 160], INI = [150, 520];
  var eu = !corrida ? [150, 400] : corrida.etapa==="caminho" ? INI : corrida.etapa==="coleta" ? COL : corrida.etapa==="transporte" ? [180, 245] : corrida.etapa==="destino" ? ENT : COL;
  var rota = corrida ? "M"+INI[0]+" "+INI[1]+" L150 330 L"+COL[0]+" "+COL[1]+" L240 300 L"+ENT[0]+" "+ENT[1] : null;
  var marcas = corrida ? [[COL[0], COL[1], OURO], [ENT[0], ENT[1], VERDE]] : [];
  var pins = !corrida ? [[95,264,"R$ 16"],[250,214,"R$ 22"],[220,464,"R$ 12"],[65,434,"R$ 18"],[248,324,"R$ 14"]] : [];

  var inicio = e("div",{className:"absolute inset-0"},
    e(Mapa,{eu:eu, pins:pins, pinsOp:online ? 1 : 0.3, rota:rota, marcas:marcas}),
    e("div",{className:"absolute inset-x-3.5 top-[52px] z-20 flex items-center gap-2"},
      e("div",{className:"flex h-10 flex-1 items-center gap-2 rounded-full bg-white px-3 text-[13px] font-bold", style:{boxShadow:"0 2px 10px rgba(15,27,51,.18)"}}, e("span",{style:{color:"#2F7BFF"}}, e(Ic,{n:"gps", s:16})), "Batel · Curitiba"),
      e("button",{onClick:function(){ setFolha("avisos"); }, "aria-label":"Avisos", className:"relative grid size-10 place-items-center rounded-full bg-white", style:{boxShadow:"0 2px 10px rgba(15,27,51,.18)"}}, e(Ic,{n:"sino", s:20}),
        e("span",{className:"absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-white px-1 text-[11px] font-bold text-white", style:{background:VERM}}, AVISOS0.length))),
    e("div",{className:"absolute right-3.5 top-[200px] z-20 flex flex-col gap-2.5"},
      [["ajuda","Suporte",function(){ setFolha("suporte"); }],["alvo","Centralizar",function(){ avisoToast("Mapa centralizado."); }]].map(function(b){ return e("button",{key:b[1], onClick:b[2], "aria-label":b[1], className:"grid size-10 place-items-center rounded-full bg-white", style:{boxShadow:"0 2px 10px rgba(15,27,51,.18)"}}, e(Ic,{n:b[0], s:20})); })),
    corrida ? e(PainelCorrida,{c:corrida, avancar:avancar, problema:function(){ setFolha("problema"); }, foto:function(){ setCorrida({o:corrida.o, etapa:corrida.etapa, foto:true}); }}) : e("div",null,
      e("div",{className:"absolute inset-x-3.5 bottom-[212px] z-20 flex justify-center"},
        online ? e("button",{onClick:function(){ if(!oferta) setOferta({o:OFERTAS[seq%OFERTAS.length], seg:18}); }, className:"flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold", style:{background:OURO, color:NAVY}}, e(Ic,{n:"caixa", s:14}), "5 entregas perto de você")
               : e("span",{className:"rounded-full px-3 py-1.5 text-[11px] font-bold", style:{background:OURO, color:NAVY}}, docRuim ? docRuim.nome+" "+DOC_COR[docRuim.st][2].toLowerCase() : "Você está offline")),
      e("div",{className:"absolute inset-x-2.5 bottom-[88px] z-20 flex items-center justify-center gap-2"},
        e("div",{className:"min-w-0 flex-1 rounded-2xl bg-white px-2 py-2", style:{boxShadow:"0 2px 10px rgba(15,27,51,.18)"}},
          e("small",{className:"block whitespace-nowrap text-[11px] font-semibold", style:{color:CINZA}}, "Ganhos hoje"), e("b",{className:"block whitespace-nowrap text-[13px]", style:{color:VERDE}}, brl(dia)),
          e("div",{className:"mt-1.5 h-1.5 overflow-hidden rounded-full", style:{background:LINHA}}, e("div",{className:"h-full rounded-full", style:{width:Math.min(100, dia/200*100)+"%", background:OURO}}))),
        e(BotaoRedondo,{online:online, onClick:ligar, t:104}),
        e("div",{className:"min-w-0 flex-1 rounded-2xl bg-white px-2 py-2", style:{boxShadow:"0 2px 10px rgba(15,27,51,.18)"}},
          e("small",{className:"block whitespace-nowrap text-[11px] font-semibold", style:{color:CINZA}}, "Entregas"), e("b",{className:"block whitespace-nowrap text-[13px]"}, String(fin.length)),
          e("small",{className:"mt-0.5 block whitespace-nowrap text-[11px] font-semibold", style:{color:CINZA}}, "4h12 online")))));

  var corpo = tela==="ganhos" ? e(TelaGanhos,{hist:hist}) : tela==="historico" ? e(TelaHistorico,{hist:hist}) : tela==="perfil" ? e(TelaPerfil,{docs:docs, simularVenc:simularVenc, suporte:function(){ setFolha("suporte"); }}) : inicio;

  var conteudoFolha = null;
  if(folha==="avisos") conteudoFolha = e(Folha,{onFechar:function(){ setFolha(null); }}, e("h3",{className:"mb-2 text-[15px] font-extrabold"}, "Avisos"), AVISOS0.map(function(a){ return e("div",{key:a.id, className:"mb-2 flex gap-3 rounded-2xl p-3", style:{background:FUNDO}}, e("span",{className:"mt-1 size-2.5 shrink-0 rounded-full", style:{background:a.cor}}), e("div",null, e("b",{className:"block text-[13px]"}, a.t), e("span",{className:"text-[11px]", style:{color:CINZA}}, a.d))); }));
  if(folha==="suporte") conteudoFolha = e(Folha,{onFechar:function(){ setFolha(null); }}, e("h3",{className:"mb-2 text-[15px] font-extrabold"}, "Suporte"),
    [["Falar com a central de entregas","Resposta em até 2 minutos."],["Problema com o pagamento","Repasse, taxa ou estorno."],["Acidente ou emergência","Aviso imediato à central."]].map(function(o){ return e("button",{key:o[0], onClick:function(){ setFolha(null); avisoToast("Chamado aberto: "+o[0].toLowerCase()+" (simulado)."); }, className:"mb-2 block w-full rounded-2xl p-3 text-left", style:{background:FUNDO}}, e("b",{className:"block text-[13px]"}, o[0]), e("span",{className:"text-[11px]", style:{color:CINZA}}, o[1])); }));
  if(folha==="problema") conteudoFolha = e(Folha,{onFechar:function(){ setFolha(null); }}, e("h3",{className:"mb-2 text-[15px] font-extrabold"}, "O que aconteceu?"),
    [["ausente","Destinatário ausente","Você devolve a mercadoria ao remetente."],["avaria","Mercadoria com avaria","Abre uma disputa com a central."],["cancelar","Cancelar a corrida","Sem repasse."]].map(function(o){ return e("button",{key:o[0], onClick:function(){ problema(o[0]); }, className:"mb-2 block w-full rounded-2xl p-3 text-left", style:{background:FUNDO}}, e("b",{className:"block text-[13px]"}, o[1]), e("span",{className:"text-[11px]", style:{color:CINZA}}, o[2])); }));
  if(folha && folha.fim) conteudoFolha = e(Folha,{onFechar:function(){ setFolha(null); }}, e("div",{className:"py-3 text-center"},
    e("div",{className:"mx-auto mb-2 grid size-14 place-items-center rounded-full text-white", style:{background:folha.valor>0 ? VERDE : "#B8C0CE"}}, e(Ic,{n:"ok", s:30})),
    e("h3",{className:"text-[15px] font-extrabold"}, folha.fim), e("div",{className:"text-[20px] font-extrabold", style:{color:folha.valor>0 ? VERDE : CINZA}}, brl(folha.valor)), e("p",{className:"mb-4 px-2 text-[11px]", style:{color:CINZA}}, folha.nota),
    e("button",{onClick:function(){ setFolha(null); }, className:"h-[52px] w-full rounded-2xl text-[15px] font-extrabold", style:{background:OURO, color:NAVY}}, "Voltar ao mapa")));

  return e(Cel,null, corpo, e(Nav,{tela:tela, ir:setTela}), oferta && e(OfertaFolha,{o:oferta.o, seg:oferta.seg, aceitar:aceitar, recusar:recusar}), conteudoFolha,
    toast && e("div",{className:"absolute inset-x-6 top-[100px] z-[70] rounded-2xl px-4 py-2.5 text-center text-[13px] font-bold text-white", style:{background:NAVY, boxShadow:"0 6px 20px rgba(0,0,0,.35)"}}, toast));
}

export { AppMotoboy };

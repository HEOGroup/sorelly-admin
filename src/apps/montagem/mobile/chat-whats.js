// Sorelly Admin · montagem — mobile/chat-whats.js
// SorellyChat no formato do WhatsApp do iPhone, para TODOS os apps de celular (revendedora, representante, funcionárias). Aprovado pelo Marcus em 29/10/2026
// a partir de docs/design/sorellychat-whatsapp.html: lista Conversas, conversa com balões azuis (do app) e brancos, teclado do iPhone na tela, tela travada
// (só a lista e as mensagens rolam), barra de baixo só com Início e Conversas. Cada app só diz quem é (eu), quais contatos fixos existem (canais) e para onde volta (onInicio).
// EXCEÇÃO CONSCIENTE ao padrão de 13 px: o Marcus pediu a fonte e os tamanhos do WhatsApp (nome 14,5, texto 14, título 26), por isso o CSS é próprio (classes wz-).
// Dados reais do chat do sistema (domain/chat-store.js). Para trocar o jeito de TODOS os apps, mexa só neste arquivo.
import { api, definirEu, efem, useChat } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, contato, sem } from "@/apps/montagem/domain/chat-contatos";
import { Avatar as AvatarChat, TemaChatClaro, diaRotulo, hora, horaLista, mesmoDia, textoPreviaMsg } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useRef, useState } from "@/shared/react";

var CSS = ""
+ ".wz{position:absolute;inset:0;overflow:hidden;overflow:clip;background:#fff;color:#000;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','SF Pro Display','Helvetica Neue','Inter','Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased}"
+ ".wz *{box-sizing:border-box;margin:0;padding:0}"
+ ":where(.wz) button{font:inherit;color:inherit;cursor:pointer}"
+ ".wz-tela{position:absolute;inset:0;display:flex;flex-direction:column;background:#fff;transition:transform .28s cubic-bezier(.3,.8,.3,1)}"
+ ".wz-tela.conv{background:#EFEAE2;transform:translateX(100%);visibility:hidden;transition:transform .28s cubic-bezier(.3,.8,.3,1),visibility 0s .28s}.wz-tela.conv.on{transform:translateX(0);visibility:visible;transition:transform .28s cubic-bezier(.3,.8,.3,1),visibility 0s}.wz-tela.lis.atras{transform:translateX(-24%)}"
+ ".wz-st{position:absolute;top:0;left:0;right:0;height:40px;z-index:50;display:flex;justify-content:space-between;align-items:flex-start;padding:13px 26px 0 30px;font-size:12.5px;font-weight:600;pointer-events:none}.wz-st .d{display:flex;gap:5px;align-items:center}"
+ ".wz-topo{padding:44px 12px 0;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}"
+ ".wz-vidro{width:34px;height:34px;border-radius:50%;background:#fff;box-shadow:0 1px 6px rgba(0,0,0,.16);display:grid;place-items:center;border:0}.wz-vidro.k{background:#111;color:#fff}"
+ ".wz-dir{display:flex;gap:8px}"
+ ".wz h1{font-size:26px;font-weight:800;letter-spacing:-.5px;padding:6px 14px 4px;flex-shrink:0;line-height:1.15}"
+ ".wz-arq{display:flex;align-items:center;padding:4px 14px;height:36px;flex-shrink:0;color:#6b6b70;font-size:14px;font-weight:600}.wz-arq i{width:46px;display:block}"
+ ".wz-rol{flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;padding-bottom:92px}.wz-rol::-webkit-scrollbar{display:none}"
+ ".wz-lin{display:flex;align-items:center;padding-left:12px;cursor:pointer;background:#fff;width:100%;text-align:left;border:0}.wz-lin:active{background:#ececee}"
+ ".wz-av{width:44px;height:44px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;color:#fff;margin-right:11px;font-weight:700;font-size:18px}"
+ ".wz-cx{flex:1;min-width:0;border-bottom:.5px solid #d9d9dc;padding:9px 14px 9px 0;min-height:62px}"
+ ".wz-l1{display:flex;align-items:baseline;gap:8px}.wz-nm{flex:1;min-width:0;font-size:14.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.1px}"
+ ".wz-hr{font-size:11.5px;color:#8a8a90;flex-shrink:0}.wz-hr.v{color:#1fa855}"
+ ".wz-l2{display:flex;align-items:flex-start;gap:8px;margin-top:1px}"
+ ".wz-pv{flex:1;min-width:0;font-size:12.5px;line-height:1.28;color:#7b7b81;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.wz-pv svg{vertical-align:-1px;margin-right:3px}"
+ ".wz-bd{min-width:18px;height:18px;border-radius:9px;background:#25D366;color:#fff;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 5px;flex-shrink:0;margin-top:1px}"
+ ".wz-pil{position:absolute;left:14px;right:14px;bottom:34px;height:54px;border-radius:28px;background:rgba(255,255,255,.94);backdrop-filter:blur(14px);box-shadow:0 2px 14px rgba(0,0,0,.18);display:flex;align-items:center;justify-content:space-around;padding:0 8px;z-index:10}"
+ ".wz-aba{flex:1;height:42px;border-radius:21px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:10px;color:#3a3a3e;margin:0 3px;border:0;background:transparent}.wz-aba.on{background:#ebebee;font-weight:700;color:#000}"
+ ".wz-pt{position:relative;display:block;line-height:0}.wz-pt i{position:absolute;top:-4px;right:-9px;min-width:15px;height:15px;border-radius:8px;background:#25D366;color:#fff;font-size:10px;font-style:normal;font-weight:700;display:grid;place-items:center;padding:0 4px;line-height:1}"
+ ".wz-cab{position:absolute;top:0;left:0;right:0;z-index:20;padding:38px 8px 7px 4px;display:flex;align-items:center;gap:2px;background:rgba(246,246,246,.97);border-bottom:.5px solid #d4d4d8}"
+ ".wz-volta{width:30px;height:36px;border:0;background:transparent;display:grid;place-items:center;flex-shrink:0}"
+ ".wz-cab .wz-av{width:32px;height:32px;margin:0 9px 0 2px;font-size:13px}"
+ ".wz-tt{min-width:0;flex:1}.wz-tt b{display:block;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}.wz-tt small{display:block;font-size:11px;color:#7b7b81;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.2}"
+ ".wz-msgs{position:absolute;top:0;left:0;right:0;bottom:66px;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior:contain;padding:88px 9px 8px;display:flex;flex-direction:column;gap:2px;"
+ "background-color:#EFEAE2;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='%23cfc6b6' stroke-width='1.3' stroke-linecap='round' stroke-linejoin='round' opacity='.55'%3E%3Ccircle cx='20' cy='20' r='7'/%3E%3Cpath d='M70 14l4 8 9 1-6 6 2 9-8-4-8 4 2-9-6-6 9-1z'/%3E%3Cpath d='M98 66c-6-8-14 2-6 9l6 6 6-6c8-7 0-17-6-9z'/%3E%3Crect x='14' y='62' width='16' height='12' rx='3'/%3E%3Cpath d='M18 62v-3a4 4 0 018 0v3'/%3E%3Cpath d='M58 82l22-8-8 22-4-9z'/%3E%3Cpath d='M40 104h12M46 98v12'/%3E%3C/g%3E%3C/svg%3E\")}"
+ ".wz-msgs::-webkit-scrollbar{display:none}"
+ ".wz-dia{align-self:center;background:rgba(255,255,255,.85);color:#555;font-size:11px;font-weight:600;padding:3px 10px;border-radius:8px;margin:6px 0}"
+ ".wz-sis{align-self:center;background:rgba(255,255,255,.7);color:#666;font-size:11px;padding:3px 9px;border-radius:8px;margin:3px 0;text-align:center}"
+ ".wz-m{max-width:80%;padding:5px 9px 4px;border-radius:15px;font-size:14px;line-height:1.28;position:relative;overflow-wrap:anywhere;white-space:pre-wrap}"
+ ".wz-m .mt{float:right;margin:5px -2px -1px 8px;font-size:10px;opacity:.75;display:inline-flex;gap:2px;align-items:center;line-height:1;white-space:nowrap}"
+ ".wz-m.eu{align-self:flex-end;background:#1B87F5;color:#fff}.wz-m.eu.fim{border-bottom-right-radius:4px}"
+ ".wz-m.el{align-self:flex-start;background:#fff;color:#000}.wz-m.el.fim{border-bottom-left-radius:4px}.wz-m.el .mt{color:#666;opacity:1}"
+ ".wz-m.cola{margin-top:5px}"
+ ".wz-cit{background:rgba(0,0,0,.14);border-left:3px solid #1fa855;border-radius:8px;padding:4px 8px;margin:0 0 4px;font-size:12px;line-height:1.25}.wz-m.el .wz-cit{background:rgba(0,0,0,.07)}.wz-cit b{display:block;color:#1c8f4d;font-size:11.5px}.wz-m.eu .wz-cit b{color:#bff0d2}"
+ ".wz-ent{position:absolute;left:0;right:0;bottom:0;z-index:20;padding:6px 8px 30px;display:flex;align-items:center;gap:6px;background:linear-gradient(rgba(239,234,226,0),#EFEAE2 35%)}"
+ ".wz-plus{width:28px;height:34px;display:grid;place-items:center;flex-shrink:0}"
+ ".wz-cx2{flex:1;min-width:0;height:34px;border-radius:17px;background:#fff;border:1px solid #cfcfd3;display:flex;align-items:center;padding:0 9px 0 12px;gap:6px}"
+ ".wz-cx2 input{flex:1;min-width:0;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:#000}"
+ ".wz-cam,.wz-mic,.wz-env{flex-shrink:0;display:grid;place-items:center;border:0}.wz-cam{width:30px;height:34px;background:transparent}.wz-mic,.wz-env{width:34px;height:34px;border-radius:50%;background:#1B87F5}"
+ ".wz-cx2 input{caret-color:#1B87F5;font-weight:700;background:transparent !important;border:0 !important;box-shadow:none !important;outline:0 !important;height:auto !important;padding:0 !important;border-radius:0 !important}"
+ ".wz-tela.kb .wz-msgs{bottom:278px}.wz-tela.kb .wz-ent{bottom:232px;padding-bottom:6px;background:transparent}"
+ ".wz-kb{position:absolute;left:0;right:0;bottom:0;height:232px;background:#d3d6dc;z-index:30;padding:0 3px 8px;display:flex;flex-direction:column;animation:wzkb .22s ease-out}@keyframes wzkb{from{transform:translateY(100%)}to{transform:translateY(0)}}"
+ ".wz-kr{display:flex;gap:5px;margin-top:8px;padding:0 1px}.wz-kb .wz-kr:first-child{margin-top:10px}.wz-kr.r2{padding:0 17px}"
+ ".wz-k{flex:1;min-width:0;height:39px;border-radius:6px;background:#fff;box-shadow:0 1px 0 rgba(0,0,0,.28);border:0;display:grid;place-items:center;font-size:19px;font-weight:400;color:#000;font-family:inherit}.wz-k:active{background:#b7bbc4}"
+ ".wz-k.esp{flex:0 0 42px}.wz-k.esp2{flex:0 0 88px;font-size:15px}.wz-k.bl{font-size:13px;color:#555}.wz-k.off{background:#e8eaee;color:#aaa;box-shadow:none}"
+ ".wz-kib{display:flex;justify-content:space-between;padding:8px 16px 0}"
+ ".wz.sem-st .wz-st{display:none}.wz.sem-st .wz-topo{padding-top:8px}.wz.sem-st .wz-cab{padding-top:6px}.wz.sem-st .wz-msgs{padding-top:58px}.wz.sem-st .wz-nova{padding-top:56px}"
+ ".wz-avw{flex-shrink:0;margin-right:11px;display:block;line-height:0;border-radius:50%;overflow:hidden}.wz-cab .wz-avw{margin:0 9px 0 2px}"
+ ".wz-quem{display:block;font-size:11.5px;font-weight:600;color:#1c8f4d;margin-bottom:1px}"
+ ".wz-vazio{padding:22px 24px;text-align:center;font-size:12.5px;color:#7b7b81}"
+ ".wz-nova{position:absolute;inset:0;padding-top:84px;display:flex;flex-direction:column;background:#fff}.wz-nova .wz-rol{padding-bottom:20px}"
+ ".wz-busca{margin:4px 12px 8px;height:34px;border-radius:10px;background:#ECEEF1;display:flex;align-items:center;padding:0 10px;flex-shrink:0}"
+ ".wz-busca input{flex:1;min-width:0;font:inherit;font-size:14px;color:#000;background:transparent !important;border:0 !important;box-shadow:none !important;outline:0 !important;height:auto !important;padding:0 !important;border-radius:0 !important}";

var Estado = function(){ return e("div",{className:"wz-st"}, e("span",null, hora(Date.now())), e("span",{className:"d"},
  e("svg",{width:19, height:12, viewBox:"0 0 19 12", fill:"#000"}, e("rect",{x:0, y:8, width:3, height:4, rx:1}), e("rect",{x:5, y:5, width:3, height:7, rx:1}), e("rect",{x:10, y:2.5, width:3, height:9.5, rx:1}), e("rect",{x:15, y:0, width:3, height:12, rx:1})),
  e("svg",{width:17, height:12, viewBox:"0 0 17 12", fill:"none", stroke:"#000", strokeWidth:2, strokeLinecap:"round"}, e("path",{d:"M1.5 4.2a10 10 0 0114 0"}), e("path",{d:"M4 7a6.5 6.5 0 019 0"}), e("circle",{cx:8.5, cy:10, r:1, fill:"#000"})),
  e("svg",{width:27, height:13, viewBox:"0 0 27 13"}, e("rect",{x:.5, y:.5, width:23, height:12, rx:3.6, fill:"none", stroke:"#000", opacity:.4}), e("rect",{x:2, y:2, width:14, height:9, rx:2.2, fill:"#000"}), e("rect",{x:25, y:4.2, width:1.8, height:4.6, rx:.9, fill:"#000", opacity:.4})))); };
var Tq2 = function(cor){ return e("svg",{width:14, height:8, viewBox:"0 0 17 10", fill:"none", stroke:cor||"currentColor", strokeWidth:1.5, strokeLinecap:"round", strokeLinejoin:"round"}, e("path",{d:"M1 5.5l3 3 6.5-7.5M6.5 7.5l1 1L14 1"})); };
var Camera = function(t){ return e("svg",{width:t||22, height:Math.round((t||22)*.92), viewBox:"0 0 26 24", fill:"none", stroke:"#000", strokeWidth:1.9, strokeLinejoin:"round"}, e("path",{d:"M9 2.5h8l1.6 2.5H22a3 3 0 013 3v11a3 3 0 01-3 3H4a3 3 0 01-3-3V8a3 3 0 013-3h3.4z"}), e("circle",{cx:13, cy:13, r:4.6})); };

// p: {eu (contato do chat), canais [{id, nome, cor, ...}] contatos fixos que viram conversa, abrirCanal(c) → id da conversa, subCanal(c), ini(c), onInicio, altura, novaConversa (bool)}
function ChatWhats(p){
  var st = useChat(), cid = p.eu, canais = p.canais || [];
  var ab = useState(null), aberto = ab[0], setAberto = ab[1], tx = useState(""), texto = tx[0], setTexto = tx[1];
  var fim = useRef(null);
  var tcS = useState(false), tc = tcS[0], setTc = tcS[1], shS = useState(false), sh = shS[0], setSh = shS[1], nuS = useState(false), nu = nuS[0], setNu = nuS[1];   // teclado na tela, shift e teclado de números
  var npS = useState(false), nova = npS[0], setNova = npS[1], bqS = useState(""), buscaNova = bqS[0], setBuscaNova = bqS[1];   // "+" nova conversa (só no app das funcionárias)
  var atual = aberto && aberto.it;
  var msgs = aberto ? api.getMessages(aberto.conv, cid) : [];
  useEffect(function(){ definirEu(cid); }, [cid]);
  useEffect(function(){ if(aberto) api.markRead(cid, aberto.conv); }, [aberto && aberto.conv, msgs.length]);
  useEffect(function(){ if(fim.current) fim.current.scrollTop = fim.current.scrollHeight; }, [aberto && aberto.conv, msgs.length, tc]);
  useEffect(function(){ if(!aberto){ setTc(false); setNu(false); setSh(false); } }, [!!aberto]);

  // ── itens da lista: contatos fixos (canais) + conversas reais do chat do sistema ──
  var convs = api.getConversations(cid).filter(function(x){ return !x.arq; }), porId = {}; convs.forEach(function(x){ porId[x.conv.id] = x; });
  var usados = {}, itens = [];
  var ultValida = function(x){ return x && x.ultima && x.ultima.tipo!=="sistema" && x.ultima.apag!=="todos" ? x.ultima : null; };
  var itemReal = function(x, ordem){
    var c = x.conv, outro = c.tipo==="dm" ? (c.membros.find(function(i){ return i!==cid; }) || c.membros[0]) : c.tipo==="setor" && c.repId!==cid ? c.repId : null;
    var ct = outro ? contato(outro) : null;
    return {key:c.id, titulo:x.titulo, sub:c.tipo==="grupo" ? c.membros.length+" participantes" : ct ? (ct.funcao || ct.setorCurto || "") : "Sorelly", pessoa:outro, grupo:c.tipo==="grupo", foto:c.foto, cor:"#6B7C85", ini:String(x.titulo||"?").charAt(0).toUpperCase(), x:x, u:ultValida(x), ordem:ordem}; };
  canais.forEach(function(c, i){
    var id = "cn_"+c.id+"_"+cid; usados[id] = 1; var x = porId[id];
    itens.push({key:id, titulo:c.nome, sub:p.subCanal ? p.subCanal(c) : "Sorelly", cor:c.cor, ini:p.ini ? p.ini(c) : c.nome.charAt(0), canal:c, x:x, u:ultValida(x), ordem:i}); });
  convs.forEach(function(x, i){ if(!usados[x.conv.id]) itens.push(itemReal(x, 100+i)); });
  itens.sort(function(a, b){ return (b.u ? b.u.t : 0)-(a.u ? a.u.t : 0) || a.ordem-b.ordem; });   // quem tem mensagem recente sobe
  var totalNL = itens.reduce(function(t, it){ return t+(it.x ? it.x.naoLidas||0 : 0); }, 0);

  var abre = function(it){ var conv = it.canal ? p.abrirCanal(it.canal) : it.x.conv.id; setAberto({conv:conv, it:it}); setTexto(""); setTc(false); setNu(false); setSh(false); };
  var abreDm = function(outro){ var id = api.openDm(cid, outro), c = contato(outro); setNova(false); setBuscaNova(""); setAberto({conv:id, it:{key:id, titulo:c.nome, sub:c.funcao || c.setorCurto || "", pessoa:outro, cor:c.cor, ini:c.nome.charAt(0)}}); setTexto(""); };
  // conversa pedida por fora (ex.: o card da revendedora no app da representante): abre sozinha e limpa o pedido
  var sel = st.efem && st.efem.conversaSel;
  useEffect(function(){
    if(!sel) return;
    var x = porId[sel], conv = st.convs.find(function(c){ return c.id===sel; });
    if(x) setAberto({conv:sel, it:itemReal(x, 0)});
    else if(conv){ var ct = conv.tipo==="setor" && conv.repId!==cid ? contato(conv.repId) : null; setAberto({conv:sel, it:{key:sel, titulo:ct ? ct.nome : conv.nome, sub:ct ? ct.funcao : "Sorelly", pessoa:ct ? conv.repId : null, cor:"#6B7C85", ini:String((ct ? ct.nome : conv.nome)||"?").charAt(0)}}); }
    efem({conversaSel:null});
  }, [sel]);
  var envia = function(){ var v = texto.trim(); if(!v || !aberto) return; api.sendMessage({conv:aberto.conv, eu:cid, texto:v}); setTexto(""); };
  var avatar = function(it, cls){
    if(it.pessoa || it.grupo) return e("span",{className:"wz-avw"+(cls ? " "+cls : "")}, e(AvatarChat,{id:it.pessoa, grupo:it.grupo, nome:it.titulo, foto:it.foto, s:cls ? 32 : 44}));
    return e("div",{className:"wz-av"+(cls ? " "+cls : ""), style:{background:it.cor}}, it.ini); };

  // ── teclado do iPhone (pedido do Marcus, 29/10/2026): aparece ao tocar no campo; também dá para digitar no teclado do computador ──
  var maius = sh || texto.length===0 || /[.!?]\s$/.test(texto);
  var prev = function(ev){ ev.preventDefault(); };   // a tecla não tira o foco do campo
  var digita = function(ch){ setTexto(texto+ch); if(sh) setSh(false); };
  var tecla = function(ch){ return e("button",{key:ch, className:"wz-k", onMouseDown:prev, onClick:function(){ digita(ch); }}, ch); };
  var fila = function(txt, cls){ return e("div",{key:txt, className:"wz-kr"+(cls ? " "+cls : "")}, txt.split("").map(function(c){ return tecla(maius && !nu ? c : c.toLowerCase() === c.toUpperCase() ? c : c.toLowerCase()); })); };
  var setaShift = e("svg",{width:20, height:20, viewBox:"0 0 24 24", fill:maius ? "#000" : "none", stroke:"#000", strokeWidth:2, strokeLinejoin:"round"}, e("path",{d:"M12 3l9 10h-5.500v7h-7v-7H3z"}));
  var apagar = e("svg",{width:24, height:20, viewBox:"0 0 28 22", fill:"none", stroke:"#000", strokeWidth:2, strokeLinejoin:"round", strokeLinecap:"round"}, e("path",{d:"M9 2h15a2 2 0 012 2v14a2 2 0 01-2 2H9L2 11z"}), e("path",{d:"M14 7l7 8M21 7l-7 8"}));
  var teclado = tc && e("div",{key:"kb", className:"wz-kb", onMouseDown:prev},
    nu ? [e("div",{key:"n1", className:"wz-kr"}, "1234567890".split("").map(tecla)), fila("-/:;()$&@\"", "r2"),
           e("div",{key:"n3", className:"wz-kr"}, e("button",{className:"wz-k esp", onMouseDown:prev}, "#+="), ".,?!'".split("").map(tecla), e("button",{className:"wz-k esp", onMouseDown:prev, onClick:function(){ setTexto(texto.slice(0, -1)); }, "aria-label":"Apagar"}, apagar))]
       : [fila("QWERTYUIOP"), fila("ASDFGHJKL", "r2"),
           e("div",{key:"r3", className:"wz-kr"}, e("button",{className:"wz-k esp", onMouseDown:prev, onClick:function(){ setSh(!sh); }, "aria-label":"Maiúsculas"}, setaShift),
             "ZXCVBNM".split("").map(function(c){ return tecla(maius ? c : c.toLowerCase()); }),
             e("button",{className:"wz-k esp", onMouseDown:prev, onClick:function(){ setTexto(texto.slice(0, -1)); }, "aria-label":"Apagar"}, apagar))],
    e("div",{className:"wz-kr"}, e("button",{className:"wz-k esp2", onMouseDown:prev, onClick:function(){ setNu(!nu); }}, nu ? "ABC" : "123"),
      e("button",{className:"wz-k bl", onMouseDown:prev, onClick:function(){ digita(" "); }}, "espaço"),
      e("button",{className:"wz-k esp2"+(texto.trim() ? "" : " off"), onMouseDown:prev, onClick:envia, "aria-label":"Enviar"}, e("svg",{width:22, height:16, viewBox:"0 0 26 18", fill:"none", stroke:"currentColor", strokeWidth:2, strokeLinecap:"round", strokeLinejoin:"round"}, e("path",{d:"M23 2v7H3M8 4L3 9l5 5"})))),
    e("div",{className:"wz-kib"}, e("svg",{width:22, height:22, viewBox:"0 0 24 24", fill:"none", stroke:"#222", strokeWidth:1.8}, e("circle",{cx:12, cy:12, r:9.500}), e("path",{d:"M8 14.500c1 1.500 2.300 2.200 4 2.200s3-.7 4-2.200", strokeLinecap:"round"}), e("circle",{cx:9, cy:10, r:1, fill:"#222"}), e("circle",{cx:15, cy:10, r:1, fill:"#222"})),
      e("svg",{width:16, height:22, viewBox:"0 0 18 24", fill:"none", stroke:"#222", strokeWidth:1.8, strokeLinecap:"round"}, e("rect",{x:5, y:1, width:8, height:15, rx:4}), e("path",{d:"M1.500 11a7.500 7.500 0 0015 0M9 18.500V22"}))));

  var qn = sem(buscaNova.trim());
  var pessoasNova = p.novaConversa ? CONTATOS.filter(function(c){ return c.id!==cid && (!qn || sem(c.completo).indexOf(qn)>=0 || sem(c.setorCurto||"").indexOf(qn)>=0); }).slice(0, 60) : [];
  var telaNova = p.novaConversa && e("div",{key:"nv", className:"wz-tela conv"+(nova ? " on" : "")}, nova && [
    e("div",{key:"h", className:"wz-cab"}, e("button",{className:"wz-volta", "aria-label":"Voltar", onClick:function(){ setNova(false); setBuscaNova(""); }}, e("svg",{width:11, height:19, viewBox:"0 0 14 22", fill:"none", stroke:"#1B87F5", strokeWidth:3, strokeLinecap:"round", strokeLinejoin:"round"}, e("path",{d:"M11 2L3 11l8 9"}))), e("div",{className:"wz-tt"}, e("b",null, "Nova conversa"), e("small",null, "Escolha uma pessoa"))),
    e("div",{key:"b", className:"wz-nova"},
      e("label",{className:"wz-busca"}, e("input",{value:buscaNova, onChange:function(ev){ setBuscaNova(ev.target.value); }, placeholder:"Buscar pessoa ou setor", autoComplete:"off"})),
      e("div",{className:"wz-rol"}, pessoasNova.map(function(c){ return e("button",{key:c.id, className:"wz-lin", onClick:function(){ abreDm(c.id); }},
        e("span",{className:"wz-avw"}, e(AvatarChat,{id:c.id, s:44})), e("div",{className:"wz-cx"}, e("div",{className:"wz-l1"}, e("span",{className:"wz-nm"}, c.completo)), e("div",{className:"wz-l2"}, e("span",{className:"wz-pv"}, c.setorCurto+(c.funcao ? " · "+c.funcao : ""))))); })))]);

  var lista = e("div",{key:"l", className:"wz-tela lis"+(aberto || nova ? " atras" : "")},
    e("div",{className:"wz-topo"},
      e("button",{className:"wz-vidro", "aria-label":"Mais"}, e("svg",{width:18, height:18, viewBox:"0 0 24 24", fill:"#111"}, e("circle",{cx:5, cy:12, r:2}), e("circle",{cx:12, cy:12, r:2}), e("circle",{cx:19, cy:12, r:2}))),
      e("div",{className:"wz-dir"}, e("button",{className:"wz-vidro", "aria-label":"Câmera"}, Camera(21)),
        e("button",{className:"wz-vidro k", "aria-label":"Nova conversa", onClick:function(){ if(p.novaConversa) setNova(true); }}, e("svg",{width:18, height:18, viewBox:"0 0 24 24", stroke:"#fff", strokeWidth:2.6, strokeLinecap:"round"}, e("path",{d:"M12 3v18M3 12h18"}))))),
    e("h1",null, "Conversas"),
    e("div",{className:"wz-arq"}, e("i",null, e("svg",{width:22, height:20, viewBox:"0 0 28 26", fill:"none", stroke:"#6b6b70", strokeWidth:2, strokeLinejoin:"round"}, e("rect",{x:2, y:2, width:24, height:7, rx:2}), e("path",{d:"M4 9v11a3 3 0 003 3h14a3 3 0 003-3V9M11 14h6", strokeLinecap:"round"}))), "Arquivadas"),
    e("div",{className:"wz-rol"}, itens.length===0 && e("p",{className:"wz-vazio"}, "Nenhuma conversa ainda."+(p.novaConversa ? " Toque no + para começar." : "")), itens.map(function(it){
      var x = it.x, u = it.u, nl = x ? x.naoLidas||0 : 0;
      return e("button",{key:it.key, className:"wz-lin", onClick:function(){ abre(it); }}, avatar(it),
        e("div",{className:"wz-cx"},
          e("div",{className:"wz-l1"}, e("span",{className:"wz-nm"}, it.titulo), u && e("span",{className:"wz-hr"+(nl ? " v" : "")}, horaLista(u.t))),
          e("div",{className:"wz-l2"}, e("span",{className:"wz-pv"}, u && u.de===cid && Tq2("#8a8a90"), u ? textoPreviaMsg(u) : "Toque para conversar"), nl>0 && e("span",{className:"wz-bd"}, nl))));
    })),
    e("nav",{className:"wz-pil"},
      e("button",{className:"wz-aba", onClick:p.onInicio}, e("span",{className:"wz-pt"}, e("svg",{width:21, height:21, viewBox:"0 0 24 24", fill:"none", stroke:"#3a3a3e", strokeWidth:1.9, strokeLinejoin:"round"}, e("path",{d:"M3 11l9-7.5 9 7.5v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"}))), "Início"),
      e("div",{className:"wz-aba on"}, e("span",{className:"wz-pt"}, e("svg",{width:23, height:23, viewBox:"0 0 28 28", fill:"#000"}, e("path",{d:"M12 4C6.5 4 2.5 7.6 2.5 12.2c0 2.3 1 4.4 2.7 5.9L4.4 21.5l4-1.6c1.1.4 2.3.6 3.6.6 5.5 0 9.5-3.6 9.5-8.3S17.5 4 12 4z"}), e("path",{d:"M24.5 11.5c1.7 1.3 2.7 3.2 2.7 5.3 0 1.9-.8 3.6-2.2 4.9l.6 3.1-3.5-1.5c-.9.3-1.9.4-2.9.4-2.6 0-4.9-1-6.4-2.6 5.6-.4 9.7-3.8 11.7-9.6z", opacity:.85})), totalNL>0 && e("i",null, totalNL)), "Conversas")));

  var corpo = [], ant = null, ultT = null;
  msgs.forEach(function(m, i){
    if(ultT===null || !mesmoDia(ultT, m.t)){ corpo.push(e("div",{key:"d"+m.id, className:"wz-dia"}, diaRotulo(m.t))); ant = null; }
    ultT = m.t;
    if(m.tipo==="sistema"){ if(m.apag==="todos") return; corpo.push(e("div",{key:m.id, className:"wz-sis"}, m.texto)); ant = null; return; }
    var eu = m.de===cid, prox = msgs[i+1], ultimaDoGrupo = !prox || prox.tipo==="sistema" || (prox.de===cid)!==eu, troca = ant!==null && ant!==eu;
    var cit = m.resp && msgs.find(function(x){ return x.id===m.resp; });
    var grupoOuSetor = atual && (atual.grupo || !atual.pessoa);   // em grupo ou fila de setor mostra quem escreveu
    corpo.push(e("div",{key:m.id, className:"wz-m "+(eu ? "eu" : "el")+(ultimaDoGrupo ? " fim" : "")+(troca ? " cola" : "")},
      !eu && grupoOuSetor && (!ant || troca || msgs[i-1].de!==m.de) && e("b",{className:"wz-quem"}, contato(m.de).nome),
      cit && e("div",{className:"wz-cit"}, e("b",null, cit.de===cid ? "Você" : contato(cit.de).nome.split(" ")[0]), textoPreviaMsg(cit)),
      m.apag==="todos" ? e("i",null, "Mensagem apagada") : textoPreviaMsg(m), e("span",{className:"mt"}, hora(m.t), eu && Tq2())));
    ant = eu;
  });

  var conversa = e("div",{key:"c", className:"wz-tela conv"+(aberto ? " on" : "")+(tc ? " kb" : "")}, atual && [
    e("div",{key:"m", className:"wz-msgs", ref:fim, onClick:function(){ if(tc){ setTc(false); if(document.activeElement && document.activeElement.blur) document.activeElement.blur(); } }}, corpo),
    e("div",{key:"h", className:"wz-cab"},
      e("button",{className:"wz-volta", "aria-label":"Voltar", onClick:function(){ setAberto(null); }}, e("svg",{width:11, height:19, viewBox:"0 0 14 22", fill:"none", stroke:"#1B87F5", strokeWidth:3, strokeLinecap:"round", strokeLinejoin:"round"}, e("path",{d:"M11 2L3 11l8 9"}))),
      avatar(atual, "pq"), e("div",{className:"wz-tt"}, e("b",null, atual.titulo), e("small",null, atual.sub))),
    teclado,
    e("div",{key:"e", className:"wz-ent"},
      e("span",{className:"wz-plus"}, e("svg",{width:22, height:22, viewBox:"0 0 24 24", stroke:"#000", strokeWidth:2, strokeLinecap:"round"}, e("path",{d:"M12 3v18M3 12h18"}))),
      e("div",{className:"wz-cx2"}, e("input",{value:texto, onChange:function(ev){ setTexto(ev.target.value); }, onFocus:function(){ setTc(true); }, onClick:function(){ setTc(true); }, onKeyDown:function(ev){ if(ev.key==="Enter"){ ev.preventDefault(); envia(); } else if(ev.key==="Escape"){ setTc(false); ev.target.blur(); } }, inputMode:"none", enterKeyHint:"send", autoComplete:"off", "aria-label":"Mensagem"}),
        e("svg",{width:21, height:21, viewBox:"0 0 26 26", fill:"none", stroke:"#000", strokeWidth:1.8, strokeLinejoin:"round"}, e("path",{d:"M13 2.5H7A4.5 4.5 0 002.5 7v12A4.5 4.5 0 007 23.5h6.5c4.5 0 8-3.5 8-8V7A4.5 4.5 0 0017 2.5z"}), e("path",{d:"M21.5 15.5h-4a4 4 0 00-4 4v4"}))),
      texto.trim()
        ? e("button",{className:"wz-env", "aria-label":"Enviar", onClick:envia}, e("svg",{width:18, height:18, viewBox:"0 0 24 24", fill:"#fff"}, e("path",{d:"M3 20.5V3.5L22 12z"})))
        : [e("button",{key:"cam", className:"wz-cam", "aria-label":"Câmera"}, Camera(24)), e("button",{key:"mic", className:"wz-mic", "aria-label":"Gravar"}, e("svg",{width:14, height:19, viewBox:"0 0 18 24", fill:"#fff"}, e("rect",{x:5, y:1, width:8, height:15, rx:4}), e("path",{d:"M1.5 11a7.5 7.5 0 0015 0M9 18.5V22", stroke:"#fff", strokeWidth:2, fill:"none", strokeLinecap:"round"})))])]);

  return e("div",{className:p.cheio ? "absolute inset-0 overflow-hidden" : "-mx-4 -mb-10 -mt-2 overflow-hidden", style:p.cheio ? null : {height:p.altura || 718}}, e(TemaChatClaro,null,
    e("div",{className:"wz"+(p.semStatus ? " sem-st" : "")}, e("style",null, CSS), lista, telaNova, conversa, p.semStatus ? null : Estado())));
}
export { ChatWhats };

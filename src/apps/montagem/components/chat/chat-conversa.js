// Sorelly Admin · montagem — components/chat/chat-conversa.js
// Tela de uma conversa (estilo WhatsApp): mensagens, áudio, anexos, responder, reagir, fixar, encaminhar, editar, apagar e cobrança de resposta.
import { tempoCurto as tempoCurtoStore } from "@/apps/montagem/components/chat/chat-ui";
import { abaDaMsg, abasDe, naoLidasAba, pendentesAba, api, efem, euAgora, fotoDe, fundoDe, lerMidia, mencaoAtraso, prazoDe, tempoUtil, tituloDe, useChat, online, MIN, textoPrevia } from "@/apps/montagem/domain/chat-store";
import { CONTATOS, contato, presenca, rotuloCurto } from "@/apps/montagem/domain/chat-contatos";
import { BRL, TAGS_PECA, lerReais, markup, pct } from "@/apps/montagem/domain/preco-pecas";
import { estiloFundo, tema } from "@/apps/montagem/components/chat/chat-fundos";
import { PagamentosAConferir } from "@/apps/montagem/components/pagamentos-conferir";
import { statusPedidoFin } from "@/apps/montagem/domain/atendimento-interno";
import { use } from "@/apps/montagem/state/context";
import { CampoDinheiro } from "@/apps/montagem/mobile/campos";
import { INPUT } from "@/apps/montagem/ui/input";
import { Compositor } from "@/apps/montagem/components/chat/chat-compositor";
import { InfoConversa } from "@/apps/montagem/components/chat/chat-info";
import { CartaoHorario } from "@/apps/montagem/components/chat/chat-horario";
import { Avatar, CORES_ESPERA, EtiquetaEspera, Ph, Tique, W, Janela, Popover, ItemMenu, Vazio, diaRotulo, duracao, hora, mesmoDia, tamanho, tempoCurto } from "@/apps/montagem/components/chat/chat-ui";
import { e, useEffect, useRef, useState } from "@/shared/react";

var REACOES = ["👍","❤️","😂","😮","😢","🙏"];
var escapar = function(t){ return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };

// texto com @menções destacadas e links
function renderTexto(texto, mencoes, eu){
  var nomes = (mencoes||[]).map(function(id){ return {id:id, n:"@"+contato(id).nome}; });
  var pad = nomes.map(function(x){ return escapar(x.n); }).concat(["https?:\\/\\/[^\\s]+"]).join("|");
  var partes = texto.split(new RegExp("("+pad+")", "g"));
  return partes.map(function(t, i){
    var m = nomes.find(function(x){ return x.n===t; });
    if(m) return e("span",{key:i, className:"rounded px-0.5 font-semibold", style:{color:W.azul, background:m.id===eu ? "rgba(83,189,235,.22)" : "transparent"}}, t);
    if(/^https?:\/\//.test(t)) return e("a",{key:i, href:t, target:"_blank", rel:"noreferrer", style:{color:W.azul, textDecoration:"underline"}}, t);
    return t;
  });
}

function AudioMsg(p){
  var url = lerMidia(p.midia.key), ar = useRef(null), total = Math.max(1, (p.midia.dur||1000)/1000);
  var tc = useState(false), tocando = tc[0], setTocando = tc[1], pg = useState(0), prog = pg[0], setProg = pg[1], vl = useState(0), vi = vl[0], setVi = vl[1];
  var VEL = [1, 1.5, 2];
  if(!url) return e("p",{className:"flex items-center gap-2 py-1 text-[12px]", style:{color:W.sec}}, e(Ph,{n:"microphone-slash", s:18}), "Áudio indisponível (não ficou salvo neste navegador).");
  var alternar = function(){ var a = ar.current; if(!a) return; if(a.paused){ a.playbackRate = VEL[vi]; a.play(); setTocando(true); } else { a.pause(); setTocando(false); } };
  var mudarVel = function(){ var n = (vi+1)%VEL.length; setVi(n); if(ar.current) ar.current.playbackRate = VEL[n]; };
  var barras = []; for(var i=0;i<28;i++) barras.push(6 + ((p.midia.key.charCodeAt(i%p.midia.key.length)*(i+3))%16));
  return e("div",{className:"flex w-[250px] max-w-full items-center gap-2.5 py-1"},
    e("audio",{ref:ar, src:url, preload:"metadata", onTimeUpdate:function(ev){ setProg(Math.min(1, ev.target.currentTime/total)); }, onEnded:function(){ setTocando(false); setProg(0); if(ar.current) ar.current.currentTime = 0; }}),
    e("button",{onClick:alternar, "aria-label":tocando ? "Pausar áudio" : "Ouvir áudio", className:"grid size-10 shrink-0 place-items-center rounded-full", style:{background:"rgba(255,255,255,.14)"}}, e(Ph,{n:tocando ? "pause" : "play", s:20, fill:true})),
    e("div",{className:"min-w-0 flex-1"},
      e("div",{className:"relative flex h-7 items-center gap-[2px]"},
        barras.map(function(h, i){ return e("span",{key:i, className:"w-[3px] rounded-full", style:{height:h, background: i/barras.length<=prog ? W.azul : "rgba(255,255,255,.35)"}}); }),
        e("input",{type:"range", min:0, max:1000, value:Math.round(prog*1000), "aria-label":"Posição do áudio", className:"absolute inset-0 w-full cursor-pointer opacity-0",
          onChange:function(ev){ var v = ev.target.value/1000; setProg(v); if(ar.current) ar.current.currentTime = v*total; }})),
      e("div",{className:"flex items-center justify-between text-[10px]", style:{color:W.sec}}, e("span",{className:"tabular-nums"}, duracao((tocando||prog>0 ? prog*total : total)*1000)))),
    e("button",{onClick:mudarVel, "aria-label":"Velocidade", className:"rounded-full px-2 py-0.5 text-[10.5px] font-bold", style:{background:"rgba(255,255,255,.14)"}}, VEL[vi]+"x"));
}

// Solicitação de pagamento (grupo Atendimento Interno): UM registro só (s.lancFin), o mesmo da Visão geral. O cartão mostra o status e traz o fluxo inteiro:
// definir as contas (Marcus, Anamaria, Lucas) → enviar ao atendimento → comprovante (quem atende) → confirmação. Cancelar também fica registrado.
function CartaoPagamento(p){
  var cx = use(), s = cx.state, d = cx.dispatch, dec = p.m.dec, lf = (s.lancFin||[]).find(function(x){ return x.id===dec.refId; });
  var podeDefinir = dec.decisores.indexOf(p.eu)>=0 && !p.somenteLeitura, solicitante = p.eu===p.m.de, podeAnexar = (solicitante || podeDefinir) && !p.somenteLeitura;
  var borda = {background:"rgba(0,0,0,.22)", border:"1px solid rgba(232,184,75,.35)"};
  if(!lf) return e("div",{className:"w-[430px] max-w-full rounded-lg px-3 py-3 text-[12px]", style:borda}, e("b",null, "Solicitação de pagamento"), e("p",{style:{color:W.sec}}, "Este pedido não está mais no sistema."));
  var stt = statusPedidoFin(lf), r = lf.resumo;
  return e("div",{className:"w-[430px] max-w-full overflow-hidden rounded-lg", style:borda},
    e("div",{className:"flex flex-wrap items-center gap-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide", style:{background:"linear-gradient(135deg,#6b4f12,#b8892b 40%,#f6dc8c 70%,#b8892b)", color:"#24180a"}},
      e(Ph,{n:"coins", s:15, fill:true}), "Solicitação de pagamento", e("span",{className:"ml-auto rounded-full px-2 py-0.5 text-[9.5px] normal-case tracking-normal", style:{background:"rgba(0,0,0,.78)", color:stt.cor}}, stt.t)),
    r && e("div",{className:"flex flex-wrap gap-x-4 gap-y-0.5 px-3 pt-2 text-[11.5px]", style:{color:W.sec}},
      r.vendido>0 && e("span",null, "Vendas ", e("b",{style:{color:W.texto}}, BRL(r.vendido))), r.aPagar>0 && e("span",null, "A pagar ", e("b",{style:{color:W.texto}}, BRL(r.aPagar))), r.dinheiro>0 && e("span",null, "Em dinheiro ", e("b",{style:{color:W.texto}}, BRL(r.dinheiro)))),
    r && r.obs && e("p",{className:"px-3 pt-1 text-[11.5px]"}, r.obs),
    e("div",{className:"px-2 py-2"}, e(PagamentosAConferir,{soId:lf.id, ro:!podeDefinir, anexa:podeAnexar && !lf.cancelado, quemNome:contato(p.eu).nome})),
    lf.cancelado ? e("div",{className:"flex items-center gap-2 px-3 py-2 text-[11.5px]", style:{background:"rgba(255,255,255,.06)", color:W.sec}}, e(Ph,{n:"prohibit", s:16}), "Solicitação cancelada.", podeDefinir && e("button",{onClick:function(){ d({type:"FIN_ETAPA", id:lf.id, patch:{cancelado:false}}); }, className:"ml-auto underline"}, "Reabrir"))
    : !lf.conferido && (podeDefinir || solicitante) && !p.somenteLeitura && e("div",{className:"flex justify-end px-3 pb-2"}, e("button",{onClick:function(){ if(window.confirm("Cancelar esta solicitação de pagamento?")) d({type:"FIN_ETAPA", id:lf.id, patch:{cancelado:true}}); }, className:"text-[11px] underline", style:{color:"#ffb4bd"}}, "Cancelar solicitação")));
}
// formulário da funcionária: nome da cliente, valor vendido, a pagar, dinheiro, saldo e observações → vira o pedido (cartão + Visão geral)
function NovaSolicitacao(p){
  var cx = use(), s = cx.state, d = cx.dispatch;
  var cl = useState(""), cliente = cl[0], setCliente = cl[1], vd = useState(0), vendido = vd[0], setVendido = vd[1], ap = useState(0), aPagar = ap[0], setAPagar = ap[1];
  var dn = useState(0), dinheiro = dn[0], setDinheiro = dn[1], fm = useState("pix"), forma = fm[0], setForma = fm[1], sd = useState(null), saldoMan = sd[0], setSaldoMan = sd[1], ob = useState(""), obs = ob[0], setObs = ob[1];
  var saldo = saldoMan!==null ? saldoMan : Math.max(0, Math.round((aPagar-dinheiro)*100)/100), CP = INPUT+" h-10! w-full text-[13px]!";
  var ok = cliente.trim().length>2 && saldo>0;
  var enviar = function(){ if(!ok) return;
    d({type:"FIN_ENVIAR", internoId:"WS"+Date.now(), nome:cliente.trim(), por:contato(p.eu).nome.split(" ")[0], resumo:{vendido:vendido, aPagar:aPagar, dinheiro:dinheiro, obs:obs.trim()},
      linhas:[{tipo:"pagamento", forma:forma, valor:saldo, partes:[{descricao:"", valor:saldo, comprovante:null, ok:false}]}]});
    p.fechar(); };
  var campo = function(rot, filho){ return e("label",{className:"flex flex-col gap-1 text-[11.5px]", style:{color:W.sec}}, rot, filho); };
  return e(Janela,{titulo:"Solicitar pagamento", fechar:p.fechar, largura:460},
    e("div",{className:"flex flex-col gap-3 p-4", style:{color:W.texto}},
      campo("Nome da cliente", e("input",{value:cliente, onChange:function(ev){ setCliente(ev.target.value); }, autoFocus:true, className:CP, placeholder:"Ex.: Gabrielle Natasha da Silva de Oliveira"})),
      e("div",{className:"grid grid-cols-2 gap-3"},
        campo("Valor vendido", e(CampoDinheiro,{value:vendido, onChange:function(v){ setVendido(v||0); }, label:"Valor vendido", className:CP+" font-mono"})),
        campo("Valor a pagar", e(CampoDinheiro,{value:aPagar, onChange:function(v){ setAPagar(v||0); setSaldoMan(null); }, label:"Valor a pagar", className:CP+" font-mono"})),
        campo("Pago em dinheiro", e(CampoDinheiro,{value:dinheiro, onChange:function(v){ setDinheiro(v||0); setSaldoMan(null); }, label:"Pago em dinheiro", className:CP+" font-mono"})),
        campo("Saldo a pagar via", e("select",{value:forma, onChange:function(ev){ setForma(ev.target.value); }, className:CP}, [["pix","PIX"],["link","Link"],["credito","Crédito"],["debito","Débito"]].map(function(x){ return e("option",{key:x[0], value:x[0]}, x[1]); })))),
      campo("Saldo "+(forma==="pix" ? "via PIX" : "a pagar")+" (calculado: a pagar menos dinheiro)", e(CampoDinheiro,{value:saldo, onChange:function(v){ setSaldoMan(v||0); }, label:"Saldo", className:CP+" font-mono"})),
      campo("Observações (opcional)", e("input",{value:obs, onChange:function(ev){ setObs(ev.target.value); }, className:CP, placeholder:"Ex.: diferença de brinde, cliente vai pagar em duas contas…"})),
      e("p",{className:"text-[11px]", style:{color:W.sec}}, "Marcus, Anamaria ou Lucas recebem o pedido e definem a conta. Depois você anexa o comprovante aqui mesmo."),
      e("button",{onClick:enviar, disabled:!ok, className:"flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-40", style:{background:W.verde}}, e(Ph,{n:"paper-plane-tilt", s:17, fill:true}), "Enviar solicitação")));
}
// abas do grupo: Geral e uma por funcionária; supervisora identificada; contador de não lidas e de pedidos para decidir em cada aba
function BarraAbas(p){
  return e("div",{className:"flex shrink-0 items-center gap-1.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none]", style:{background:W.painel, borderBottom:"1px solid "+W.borda}},
    p.abas.map(function(a){ var on = a===p.aba, geral = a==="geral", c = geral ? null : contato(a), nl = on ? 0 : naoLidasAba(p.conv.id, p.eu, a), pd = pendentesAba(p.conv.id, p.eu, a), sup = !geral && (p.conv.supervisores||[]).indexOf(a)>=0;
      return e("button",{key:a, onClick:function(){ p.mudar(a); }, "aria-pressed":on, className:"flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-1.5 pr-3 text-[12px] "+(geral ? "pl-3" : ""), style:{background:on ? "#103529" : W.campo, color:on ? "#25d366" : W.texto, boxShadow:on ? "inset 0 0 0 1px rgba(37,211,102,.5)" : "none"}},
        !geral && e(Avatar,{id:a, s:22}), geral && e(Ph,{n:"users-three", s:15, fill:true}), geral ? "Geral" : rotuloCurto(a),
        sup && e("span",{className:"rounded-full px-1.5 py-px text-[8px] font-extrabold uppercase tracking-wide", style:{background:"linear-gradient(135deg,#b8892b,#f6dc8c)", color:"#24180a"}, title:"Supervisora do setor"}, "Supervisora"),
        pd>0 && e("span",{className:"grid min-w-[18px] place-items-center rounded-full px-1 text-[9.5px] font-extrabold", style:{background:"#f59e0b", color:"#24180a", height:18}, title:"Aguardando a sua decisão"}, pd),
        nl>0 && e("span",{className:"grid min-w-[18px] place-items-center rounded-full px-1 text-[9.5px] font-bold", style:{background:W.verde, color:"#0b141a", height:18}}, nl)); }));
}
// cartão de preço de peça nova: foto, custo, preço sugerido (editável, com o markup ao vivo), tag e dois botões
function CartaoPreco(p){
  var d = p.m.dec, foto = lerMidia(d.foto), pode = d.decisores.indexOf(p.eu)>=0 && d.estado==="pendente" && !p.somenteLeitura;
  var pt = useState(BRL(d.preco).replace("R$ ","")), txt = pt[0], setTxt = pt[1], tg = useState("Sem tag"), tag = tg[0], setTag = tg[1];
  var preco = lerReais(txt), mk = markup(preco, d.custo), quem = d.decisores.map(function(i){ return contato(i).nome.split(" ")[0]; }).join(", ").replace(/, ([^,]*)$/, " ou $1");
  var linha = function(r, v, forte){ return e("div",{key:r, className:"flex justify-between gap-3 py-0.5 text-[12px]"}, e("span",{style:{color:W.sec}}, r), e("b",{className:forte ? "text-[13px]" : "", style:forte ? {color:W.ouro} : null}, v)); };
  return e("div",{className:"w-[300px] max-w-full overflow-hidden rounded-lg", style:{background:"rgba(0,0,0,.22)", border:"1px solid rgba(232,184,75,.35)"}},
    e("div",{className:"flex items-center gap-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide", style:{background:"linear-gradient(135deg,#6b4f12,#b8892b 40%,#f6dc8c 70%,#b8892b)", color:"#24180a"}}, e(Ph,{n:"tag", s:15, fill:true}), d.titulo),
    foto && e("button",{onClick:function(){ p.abrir({tipo:"imagem", url:foto, nome:d.modelo}); }, className:"block w-full", "aria-label":"Ampliar a foto da peça"}, e("img",{src:foto, alt:d.modelo, className:"aspect-square w-full object-cover"})),
    e("div",{className:"px-3 py-2"},
      linha("Modelo", d.modelo), linha("Custo", BRL(d.custo)), linha("Quantidade", d.qtd), linha("Fornecedor", d.fornecedor),
      e("div",{className:"my-1.5 border-t", style:{borderColor:"rgba(255,255,255,.12)"}}),
      linha("Preço sugerido", BRL(d.preco)+" · "+pct(markup(d.preco, d.custo)))),
    d.estado==="confirmada" ? e("div",{className:"flex flex-col gap-0.5 px-3 py-2.5 text-[12px]", style:{background:"#103529", color:"#25d366"}},
      e("p",{className:"flex items-center gap-2 font-semibold"}, e(Ph,{n:"check-circle", s:18, fill:true}), "Preço aprovado: "+BRL(d.precoFinal)+" · markup "+pct(d.markupFinal)),
      e("p",{className:"text-[11px]", style:{color:"#8be3b5"}}, d.tag+" · código "+d.codigo+" · "+contato(d.por).nome.split(" ")[0]+", "+diaRotulo(d.em).toLowerCase()+" às "+hora(d.em))) :
    pode ? e("div",{className:"flex flex-col gap-2 px-3 pb-3"},
      e("label",{className:"flex items-center justify-between gap-2 text-[12px]"}, e("span",{className:"font-semibold"}, "Preço de venda"),
        e("span",{className:"flex items-center gap-1 rounded-lg px-2.5 py-1.5", style:{background:W.campo}}, "R$", e("input",{value:txt, onChange:function(ev){ setTxt(ev.target.value); }, inputMode:"decimal", "aria-label":"Preço de venda", className:"w-24 bg-transparent text-right text-[14px] font-bold outline-none"}))),
      e("p",{className:"text-right text-[11px]", style:{color:mk>=2.5 ? "#25d366" : "#f5c542"}}, "Markup "+pct(mk)+" (fica com a Sorelly: "+BRL(preco*0.55)+")"),
      e("div",{className:"flex flex-wrap gap-1.5"}, TAGS_PECA.map(function(t){ var on = tag===t;
        return e("button",{key:t, onClick:function(){ setTag(t); }, className:"rounded-full px-2.5 py-1 text-[11px] font-semibold", style:{background:on ? W.ouro : W.campo, color:on ? "#24180a" : W.texto}}, t); })),
      e("div",{className:"flex gap-2"},
        e("button",{onClick:function(){ if(preco>0) api.decide(p.convId, p.m.id, p.eu, "confirmar", {preco:preco, tag:tag}); }, className:"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[12px] font-bold text-white", style:{background:W.verde}}, e(Ph,{n:"check-circle", s:17, fill:true}), "Aprovar preço"),
        e("button",{onClick:function(){ api.decide(p.convId, p.m.id, p.eu, "info"); }, disabled:d.infoPedida, className:"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[12px] font-bold disabled:opacity-50", style:{background:W.campo, color:W.texto}}, e(Ph,{n:"question", s:17, fill:true}), d.infoPedida ? "Pedido enviado" : "Mais informações"))) :
    e("p",{className:"px-3 pb-3 text-[11px]", style:{color:W.sec}}, "Aguardando o preço de "+quem+"."));
}
// cartão de decisão (ex.: efetivação de uma colaboradora): foto, dados, histórico, feedback e dois botões
function CartaoDecisao(p){
  var d = p.m.dec, c = contato(d.pessoa), foto = fotoDe(d.pessoa), pode = d.decisores.indexOf(p.eu)>=0 && d.estado==="pendente" && !p.somenteLeitura;
  var quem = d.decisores.map(function(i){ return contato(i).nome.split(" ")[0]; }).join(", ").replace(/, ([^,]*)$/, " ou $1");
  return e("div",{className:"w-[300px] max-w-full overflow-hidden rounded-lg", style:{background:"rgba(0,0,0,.22)", border:"1px solid rgba(232,184,75,.35)"}},
    e("div",{className:"flex items-center gap-2 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide", style:{background:"linear-gradient(135deg,#6b4f12,#b8892b 40%,#f6dc8c 70%,#b8892b)", color:"#24180a"}}, e(Ph,{n:"clipboard-text", s:15, fill:true}), d.titulo),
    e("div",{className:"flex gap-3 p-3"},
      foto ? e("button",{onClick:function(){ p.abrir({tipo:"imagem", url:foto, nome:c.completo}); }, className:"shrink-0 overflow-hidden rounded-lg", style:{width:84, height:104}, "aria-label":"Ampliar a foto"}, e("img",{src:foto, alt:c.completo, className:"size-full object-cover object-top"})) :
        e("div",{className:"flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-center", style:{width:84, height:104, background:"rgba(255,255,255,.07)", color:W.sec}}, e(Avatar,{id:d.pessoa, s:44}), e("span",{className:"px-1 text-[9px] leading-tight", style:{color:W.ouro}}, "Sem foto (tirar no dia 1)")),
      e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[14px] font-bold leading-tight"}, c.completo),
        e("div",{className:"mt-1.5 flex flex-col gap-0.5 text-[11.5px]"}, d.campos.map(function(k){ return e("p",{key:k[0]}, e("span",{style:{color:W.sec}}, k[0]+": "), k[1]); })))),
    e("div",{className:"flex flex-wrap gap-1.5 px-3"}, d.historico.map(function(h){ var ok = !h[1];
      return e("span",{key:h[0], className:"rounded-full px-2 py-0.5 text-[10.5px] font-semibold", style:{background:ok ? "#103529" : "#4a1d24", color:ok ? "#25d366" : "#ffb4bd"}}, h[0]+": "+h[1]); })),
    d.feedback && e("p",{className:"mx-3 mt-2.5 rounded-md p-2.5 text-[11.5px] leading-snug", style:{background:"rgba(255,255,255,.06)"}}, d.feedback),
    e("p",{className:"px-3 pb-2 pt-2.5 text-[13px] font-semibold"}, d.pergunta),
    d.estado==="confirmada" ? e("div",{className:"flex items-center gap-2 px-3 py-2.5 text-[12px] font-semibold", style:{background:"#103529", color:"#25d366"}}, e(Ph,{n:"check-circle", s:18, fill:true}), "Confirmado por "+contato(d.por).nome+" · "+diaRotulo(d.em).toLowerCase()+" às "+hora(d.em)) :
    pode ? e("div",{className:"flex gap-2 px-3 pb-3"},
      e("button",{onClick:function(){ api.decide(p.convId, p.m.id, p.eu, "confirmar"); }, className:"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[12px] font-bold text-white", style:{background:W.verde}}, e(Ph,{n:"check-circle", s:17, fill:true}), "Confirmar efetivação"),
      e("button",{onClick:function(){ api.decide(p.convId, p.m.id, p.eu, "info"); }, disabled:d.infoPedida, className:"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[12px] font-bold disabled:opacity-50", style:{background:W.campo, color:W.texto}}, e(Ph,{n:"question", s:17, fill:true}), d.infoPedida ? "Pedido enviado" : "Mais informações")) :
    e("p",{className:"px-3 pb-3 text-[11px]", style:{color:W.sec}}, "Aguardando a decisão de "+quem+"."));
}
function ConteudoMsg(p){
  var m = p.m, md = m.midia, url = md && md.key ? lerMidia(md.key) : null;
  if(m.tipo==="decisao" && m.dec.tipo==="pagamento") return e(CartaoPagamento,{m:m, eu:p.eu, convId:p.convId, somenteLeitura:p.somenteLeitura});
  if(m.tipo==="decisao" && m.dec.tipo==="preco") return e(CartaoPreco,{m:m, eu:p.eu, convId:p.convId, abrir:p.abrir, somenteLeitura:p.somenteLeitura});
  if(m.tipo==="decisao") return e(CartaoDecisao,{m:m, eu:p.eu, convId:p.convId, abrir:p.abrir, somenteLeitura:p.somenteLeitura});
  if(m.tipo==="audio") return e(AudioMsg,{midia:md});
  var corpo = m.texto ? e("p",{className:"whitespace-pre-wrap break-words text-[14px] leading-snug"}, renderTexto(m.texto, m.mencoes, p.eu), p.espaco ? e("span",{className:"inline-block", style:{width:p.espaco, height:1}}) : null) : null;
  if(m.tipo==="imagem") return e("div",{className:"flex flex-col gap-1"},
    url ? e("button",{onClick:function(){ p.abrir({tipo:"imagem", url:url, nome:md.nome}); }, className:"overflow-hidden rounded-lg", "aria-label":"Ampliar foto"}, e("img",{src:url, alt:md.nome||"Foto", className:"max-h-72 w-full max-w-[280px] object-cover"})) :
      e("p",{className:"flex items-center gap-2 py-3 text-[12px]", style:{color:W.sec}}, e(Ph,{n:"image", s:22}), "Foto indisponível (não ficou salva neste navegador)."), corpo);
  if(m.tipo==="arquivo"){
    var ic = /pdf/.test(md.mime||"") ? "file-pdf" : /sheet|excel|csv/.test((md.mime||"")+(md.nome||"")) ? "file-xls" : /word|doc/.test((md.mime||"")+(md.nome||"")) ? "file-doc" : "file-text";
    var pdf = /pdf/.test(md.mime||"");
    return e("div",{className:"flex flex-col gap-1"},
      e("button",{onClick:function(){ if(!url) return; if(pdf) p.abrir({tipo:"pdf", url:url, nome:md.nome}); else { var a = document.createElement("a"); a.href = url; a.download = md.nome||"arquivo"; a.click(); } }, disabled:!url,
        className:"flex w-[250px] max-w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left", style:{background:"rgba(0,0,0,.2)"}},
        e(Ph,{n:ic, s:34, fill:true, style:{color:pdf ? "#f15c6d" : W.verde}}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px]"}, md.nome||"Arquivo"), e("span",{className:"block text-[10.5px]", style:{color:W.sec}}, url ? tamanho(md.tam||0)+(pdf ? " · toque para ver" : " · toque para baixar") : "indisponível neste navegador")),
        url && e(Ph,{n:pdf ? "eye" : "download", s:20, style:{color:W.sec}})), corpo);
  }
  return corpo;
}

function Bolha(p){
  var m = p.m, minha = m.de===p.eu, c = contato(m.de), ap = m.apag==="todos";
  var mn = useState(false), menu = mn[0], setMenu = mn[1];
  var cit = m.resp ? p.todas.find(function(x){ return x.id===m.resp; }) : null;
  var reacs = {}; Object.keys(m.reacoes||{}).forEach(function(k){ var em = m.reacoes[k]; reacs[em] = (reacs[em]||[]).concat([k]); });
  var temReacao = Object.keys(reacs).length>0;
  var noTexto = m.tipo==="texto" && !!m.texto && !ap && !m.porDir;   // mensagem só de texto: a hora fica na linha do texto, como no WhatsApp
  return e("div",{"data-m":m.id, className:"group relative flex px-[6%] "+(minha ? "justify-end" : "justify-start")+(p.primeira ? " mt-2" : " mt-0.5")+(temReacao ? " mb-3" : "")},
    e("div",{className:"relative max-w-[min(85%,520px)] rounded-lg px-2.5 pb-1 pt-1.5 shadow-sm", style:{background:minha ? p.tema.saida : p.tema.entrada, color:p.tema.texto, borderTopLeftRadius:!minha && p.primeira ? 0 : undefined, borderTopRightRadius:minha && p.primeira ? 0 : undefined, outline:p.destaque ? "2px solid "+W.ouro : "none"}},
      !ap && !p.somenteLeitura && e("button",{onClick:function(){ setMenu(true); }, "aria-label":"Opções da mensagem", className:"absolute right-1 top-1 z-10 grid size-6 place-items-center rounded-full opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100", style:{background:minha ? p.tema.saida : p.tema.entrada}}, e(Ph,{n:"caret-down", s:15, style:{color:W.sec}})),
      menu && e(Popover,{className:(minha ? "right-0" : "left-0")+" top-7", fechar:function(){ setMenu(false); }, largura:200},
        e("div",{className:"flex items-center justify-around px-2 pb-1.5 pt-0.5"}, REACOES.map(function(r){ return e("button",{key:r, onClick:function(){ api.react(p.conv.id, m.id, p.eu, r); setMenu(false); }, className:"grid size-8 place-items-center rounded-full text-[19px] hover:bg-white/10"}, r); })),
        e(ItemMenu,{n:"arrow-bend-up-left", onClick:function(){ setMenu(false); p.responder(m); }}, "Responder"),
        m.texto && e(ItemMenu,{n:"copy", onClick:function(){ setMenu(false); try{ navigator.clipboard.writeText(m.texto); }catch(x){} }}, "Copiar"),
        m.tipo!=="decisao" && e(ItemMenu,{n:"share-fat", onClick:function(){ setMenu(false); p.encaminhar(m); }}, "Encaminhar"),
        e(ItemMenu,{n:"push-pin", onClick:function(){ setMenu(false); api.pin.mensagem(p.conv.id, m.id); }}, m.fixa ? "Desafixar" : "Fixar"),
        minha && m.tipo==="texto" && e(ItemMenu,{n:"pencil-simple", onClick:function(){ setMenu(false); p.editar(m); }}, "Editar"),
        e(ItemMenu,{n:"trash", perigo:true, onClick:function(){ setMenu(false); p.apagar(m); }}, "Apagar")),
      !minha && p.conv.tipo!=="dm" && p.primeira && e("p",{className:"mb-0.5 text-[11.5px] font-semibold", style:{color:c.cor==="#000" ? W.verde : c.cor}}, c.nome),
      ap ? e("p",{className:"flex items-center gap-1.5 py-0.5 text-[12.5px] italic", style:{color:W.sec}}, e(Ph,{n:"prohibit", s:15}), minha ? "Você apagou esta mensagem" : "Esta mensagem foi apagada") : e("div",null,
        m.enc && e("p",{className:"mb-0.5 flex items-center gap-1 text-[11px] italic", style:{color:W.sec}}, e(Ph,{n:"share-fat", s:13}), "Encaminhada"),
        cit && e("button",{onClick:function(){ p.irPara(cit.id); }, className:"mb-1 block w-full rounded-md border-l-4 px-2 py-1 text-left text-[11.5px]", style:{background:"rgba(0,0,0,.22)", borderColor:contato(cit.de).cor}},
          e("span",{className:"block font-semibold", style:{color:contato(cit.de).cor}}, cit.de===p.eu ? "Você" : contato(cit.de).nome), e("span",{className:"line-clamp-2", style:{color:W.sec}}, textoPrevia(cit))),
        e(ConteudoMsg,{m:m, eu:p.eu, abrir:p.abrir, convId:p.conv.id, somenteLeitura:p.somenteLeitura, espaco:noTexto ? 46+(minha ? 20 : 0)+(m.ed ? 44 : 0)+(m.fixa ? 14 : 0) : 0})),
      m.porDir && !ap && e("p",{className:"mt-0.5 flex items-center gap-1 text-[10.5px] font-bold", style:{color:W.ouro}}, e(Ph,{n:"crown-simple", s:13, fill:true}), "Respondido por "+contato(m.porDir).nome.split(" ")[0]+" (Direção)"),
      e("div",{className:noTexto ? "absolute bottom-1 right-2 flex items-center justify-end gap-1 text-[11px] leading-none" : "flex items-center justify-end gap-1 pl-6 text-[11px] leading-none", style:{color:W.sec, marginTop:noTexto || ap ? 0 : -2}},
        m.fixa && !ap && e(Ph,{n:"push-pin", s:12, fill:true}), m.ed && !ap && e("span",null,"editada"), e("span",null, hora(m.t)), minha && !ap && e(Tique,{status:m.status})),
      temReacao && e("div",{className:"absolute -bottom-3.5 "+(minha ? "right-2" : "left-2")+" flex gap-1"}, Object.keys(reacs).map(function(em){
        return e("button",{key:em, onClick:function(){ api.react(p.conv.id, m.id, p.eu, em); }, title:reacs[em].map(function(i){ return contato(i).nome; }).join(", "), className:"flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px]", style:{background:W.cab, border:"1px solid "+W.borda}}, em, reacs[em].length>1 && e("span",{className:"text-[10px]"}, reacs[em].length)); }))));
}

// cobrança de resposta: relógio das menções abertas desta conversa
function FaixaMencoes(p){
  var tk = useState(0), setTk = tk[1]; useEffect(function(){ var t = setInterval(function(){ setTk(function(n){ return n+1; }); }, 15000); return function(){ clearInterval(t); }; }, []);
  var abertas = p.estado.mencoes.filter(function(m){ return m.conv===p.conv.id && !m.resp && (m.para===p.eu || m.de===p.eu); });
  if(!abertas.length) return null;
  return e("div",{className:"flex flex-col"}, abertas.map(function(m){
    var dec = tempoUtil(m.em, Date.now(), m.para), atraso = dec > m.prazo*MIN, pra = m.para===p.eu;
    return e("button",{key:m.id, onClick:function(){ if(m.msg) p.irPara(m.msg); }, className:"flex items-center gap-2.5 px-4 py-1.5 text-left text-[12px]", style:{background:atraso ? "#4a1d24" : "#1f3a2f", color:W.texto, borderBottom:"1px solid "+W.borda}},
      e(Ph,{n:atraso ? "alarm" : "timer", s:19, fill:true, className:atraso ? "animate-pulse" : "", style:{color:atraso ? W.vermelho : W.verde}}),
      e("span",{className:"min-w-0 flex-1 truncate"}, pra ? e("span",null, e("b",null, contato(m.de).nome), " marcou você · responda por aqui") : e("span",null, "Aguardando resposta de ", e("b",null, contato(m.para).nome))),
      e("span",{className:"shrink-0 font-semibold tabular-nums", style:{color:atraso ? "#ffb4bd" : "#8be3b5"}}, tempoCurto(dec)+" / "+m.prazo+" min"));
  }));
}

// Status da conversa com a representante: aberta (falta a equipe responder), aguardando a representante ou resolvida. Só pendente/resolvido, sem nota (Marcus, 27/10/2026).
function BarraStatus(p){
  useChat();
  var th = api.statusConv(p.conv.id);
  if(!th) return null;
  var cor = th.estado==="aberta" ? CORES_ESPERA[Math.max(1, th.nivel)] : th.estado==="aguardando" ? "#53bdeb" : "#25d366";
  var rotulo = th.estado==="aberta" ? "Aberta · "+th.pend+(th.pend===1 ? " mensagem" : " mensagens")+" sem resposta há "+tempoCurtoStore(th.espera)
    : th.estado==="aguardando" ? "Aguardando a representante" : "✓ Resolvida"+(p.conv.resolvidaPor ? " por "+contato(p.conv.resolvidaPor).nome.split(" ")[0] : "");
  return e("div",{className:"flex shrink-0 flex-wrap items-center gap-2 px-4 py-1.5 text-[11.5px]", style:{background:W.painel, borderBottom:"1px solid "+W.borda}},
    e("span",{className:"flex items-center gap-1.5 font-semibold", style:{color:cor}}, e(Ph,{n:th.estado==="resolvida" ? "check-circle" : "clock-countdown", s:15, fill:true}), rotulo),
    th.estado!=="resolvida" && p.pode && e("button",{onClick:function(){ api.resolveConv(p.conv.id, p.eu, ""); }, className:"ml-auto rounded-full px-3 py-1 text-[11px] font-bold", style:{background:W.verde, color:"#0b141a"}}, "✓ Resolver"));
}

// Grupo Agendamento: uma aba no topo para cada representante (a conversa de agendamento com ela abre aqui mesmo, sem poluir a barra lateral).
// Quem não faz parte do agendamento (diretoria) só lê; quem faz, responde.
function BarraRepresentantes(p){
  useChat();
  var sem = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); };
  var bq = useState(""), busca = bq[0], setBusca = bq[1], q = sem(busca), ab = useState(false), aberto = ab[0], setAberto = ab[1];
  var todas = api.getConversations(p.eu, {todas:true}).filter(function(x){ return x.conv.tipo==="setor" && x.conv.canal===p.canal; });
  var porRep = {}; todas.forEach(function(x){ porRep[x.conv.repId] = x; });
  var thRep = {}; todas.forEach(function(x){ thRep[x.conv.repId] = api.statusConv(x.conv.id); });
  var abertas = Object.keys(thRep).filter(function(k){ return thRep[k] && thRep[k].estado==="aberta"; });
  var total = abertas.length, od = useState("antigas"), ordem = od[0], setOrdem = od[1];
  var aberta = function(id){ return thRep[id] && thRep[id].estado==="aberta"; };
  var reps = CONTATOS.filter(function(c){ return c.tipo==="rep" && (!q || sem(c.completo).indexOf(q)>=0); })
    .sort(function(x, y){ var ax = aberta(x.id), ay = aberta(y.id); if(ax!==ay) return ax ? -1 : 1;
      if(ax) return ordem==="antigas" ? thRep[x.id].desde-thRep[y.id].desde : thRep[y.id].desde-thRep[x.id].desde;
      return (porRep[y.id] ? 1 : 0)-(porRep[x.id] ? 1 : 0) || x.completo.localeCompare(y.completo); });
  var chip = function(on){ return {background:on ? "#103529" : W.campo, color:on ? "#25d366" : W.texto, border:"1px solid "+(on ? "#25d366" : W.borda)}; };
  var escolher = function(id){ p.mudar(id); setAberto(false); setBusca(""); };
  return e("div",{className:"relative flex shrink-0 items-center gap-2 px-3 py-1.5", style:{background:W.cab, borderBottom:"1px solid "+W.borda}},
    e("button",{onClick:function(){ escolher(null); }, "aria-pressed":!p.sel, className:"flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pl-3 pr-3 text-[12px]", style:chip(!p.sel)}, e(Ph,{n:"users-three", s:15, fill:true}), "Equipe"),
    e("button",{onClick:function(){ setAberto(!aberto); }, "aria-expanded":aberto, "aria-label":"Escolher uma representante", className:"flex min-w-0 items-center gap-2 whitespace-nowrap rounded-full py-1 pl-2 pr-3 text-[12px]", style:chip(!!p.sel)},
      p.sel ? e(Avatar,{id:p.sel, s:24}) : e(Ph,{n:"user-circle", s:20, fill:true}), e("span",{className:"truncate"}, p.sel ? contato(p.sel).completo : "Representantes"),
      total>0 && e("span",{className:"grid min-w-[18px] place-items-center rounded-full px-1 text-[9.5px] font-bold", style:{background:W.verde, color:"#0b141a", height:18}}, total), e(Ph,{n:aberto ? "caret-up" : "caret-down", s:14, fill:true})),
    aberto && e("div",{className:"fixed inset-0 z-40", onClick:function(){ setAberto(false); }}),
    aberto && e("div",{className:"absolute left-3 top-12 z-50 flex max-h-[26rem] w-[min(22rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-xl shadow-2xl", style:{background:W.cab, border:"1px solid "+W.borda}},
      e("div",{className:"flex items-center gap-2 p-2"}, e("input",{autoFocus:true, value:busca, onChange:function(ev){ setBusca(ev.target.value); }, placeholder:"Buscar representante", "aria-label":"Buscar representante", className:"h-9 min-w-0 flex-1 rounded-lg px-3 text-[12.5px] outline-none", style:{background:W.campo, color:W.texto}}),
        e("button",{onClick:function(){ setOrdem(ordem==="antigas" ? "recentes" : "antigas"); }, title:"Ordem das conversas em aberto", className:"shrink-0 whitespace-nowrap rounded-lg px-2.5 py-2 text-[11px] font-semibold", style:{background:W.campo, color:W.ouro}}, ordem==="antigas" ? "↑ Mais antigas" : "↓ Mais novas")),
      e("div",{className:"min-h-0 flex-1 overflow-y-auto"},
        reps.length===0 && e("p",{className:"px-4 py-3 text-[12px]", style:{color:W.sec}}, "Nenhuma representante encontrada."),
        reps.map(function(c){ var x = porRep[c.id], th = thRep[c.id];
          return e("button",{key:c.id, onClick:function(){ escolher(c.id); }, className:"flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5", style:p.sel===c.id ? {background:"#103529"} : null},
            e(Avatar,{id:c.id, s:34}), e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[13px]"}, c.completo), e("span",{className:"block truncate text-[11px]", style:{color:W.sec}}, x && x.ultima ? textoPrevia(x.ultima) : "Sem conversa ainda")),
            th && th.estado==="aberta" ? e(EtiquetaEspera,{t:th}) : th && th.estado==="aguardando" ? e("span",{className:"shrink-0 text-[10px]", style:{color:"#53bdeb"}}, "aguardando") : th && th.estado==="resolvida" ? e(Ph,{n:"check-circle", s:16, fill:true, style:{color:"#25d366"}}) : null); }))));
}
// o grupo Agendamento mostra a barra de representantes em cima; escolhida uma, a conversa dela ocupa a tela

function Conversa(p){
  var st = useChat(), rp = useState(null), rep = rp[0], setRep = rp[1];
  var conv = st.convs.find(function(c){ return c.id===p.convId; });
  if(!conv || !conv.reps) return e(ConversaBase,p);
  var canalRep = conv.repCanal || "agendamento", idRep = rep ? "cn_"+canalRep+"_"+rep : null, escolher = function(id){ if(id) api.openChannel(id, canalRep); setRep(id); };
  return e("div",{className:"flex h-full min-h-0 flex-col"},
    e(BarraRepresentantes,{eu:p.eu, sel:rep, mudar:escolher, canal:canalRep}),
    e("div",{className:"min-h-0 flex-1"}, e(ConversaBase, Object.assign({}, p, {key:idRep||p.convId, convId:idRep||p.convId, onVoltar:rep ? function(){ setRep(null); } : p.onVoltar}))));
}

function ConversaBase(p){
  var st = useChat(), eu = p.eu, conv = st.convs.find(function(c){ return c.id===p.convId; });
  var lm = useState(60), limite = lm[0], setLimite = lm[1];
  var rs = useState(null), resp = rs[0], setResp = rs[1], ed = useState(null), editando = ed[0], setEditando = ed[1];
  var ap = useState(null), apagando = ap[0], setApagando = ap[1], en = useState(null), encaminhando = en[0], setEncaminhando = en[1];
  var vi = useState(null), visor = vi[0], setVisor = vi[1], inf = useState(false), info = inf[0], setInfo = inf[1], dst = useState(null), destaque = dst[0], setDestaque = dst[1];
  var irParaRef = useRef(null), area = useRef(null), ultimo = useRef(0), altAntes = useRef(0);
  var ab0 = useState("geral"), abaSel = ab0[0], setAba = ab0[1], sol = useState(false), solicitando = sol[0], setSolicitando = sol[1];
  var membro = !!conv && conv.membros.indexOf(eu)>=0;
  // a Direção, vendo o chat de uma representante, pode responder nas conversas dela com as revendedoras (a mensagem fica marcada com quem respondeu)
  var dirResp = !!conv && !!p.direcao && !!p.leitura && contato(eu).tipo==="rep" && conv.tipo==="dm" && conv.membros.some(function(i){ return contato(i).tipo==="rev"; });
  var somenteLeitura = !!conv && (!membro || !!p.leitura) && !dirResp;
  var todas = conv ? api.getMessages(conv.id, eu) : [];
  var abasV = conv ? abasDe(conv, eu) : null, abaAtual = abasV && abasV.indexOf(abaSel)>=0 ? abaSel : "geral";
  var todasAba = abasV ? todas.filter(function(m){ return abaDaMsg(m)===abaAtual; }) : todas;   // cada aba tem o seu histórico
  var msgs = todasAba.slice(-limite), fundoId = fundoDe(euAgora() || eu), tm = tema(fundoId);

  useEffect(function(){ setLimite(60); setResp(null); setEditando(null); setInfo(false); ultimo.current = 0; setAba(st.efem.abaInicial || "geral"); if(st.efem.abaInicial) efem({abaInicial:null}); }, [p.convId]);
  useEffect(function(){ setLimite(60); ultimo.current = 0; setResp(null); setEditando(null); }, [abaAtual]);
  useEffect(function(){ if(!conv) return; efem({aberta:conv.id, abaAberta:abaAtual}); return function(){ efem({aberta:null, abaAberta:null}); }; }, [p.convId, abaAtual]);
  useEffect(function(){ if(conv && membro && !p.leitura) api.markRead(eu, conv.id, abaAtual); }, [p.convId, todas.length, eu, abaAtual]);
  // rolagem: vai para o fim ao abrir ou chegar mensagem (se já estava perto do fim); ao carregar mais antigas mantém a posição
  useEffect(function(){
    var a = area.current; if(!a) return;
    if(altAntes.current){ a.scrollTop = a.scrollHeight - altAntes.current; altAntes.current = 0; return; }
    var perto = a.scrollHeight - a.scrollTop - a.clientHeight < 160, minha = todas.length && todas[todas.length-1].de===eu;
    if(ultimo.current===0 || perto || minha) a.scrollTop = a.scrollHeight;
    ultimo.current = todas.length;
  }, [p.convId, todasAba.length, limite, abaAtual]);

  useEffect(function(){ var id = st.efem.irPara; if(id && conv){ efem({irPara:null}); setTimeout(function(){ irParaRef.current && irParaRef.current(id); }, 120); } }, [st.efem.irPara, p.convId]);
  if(!conv) return e(Vazio,{n:"chat-circle-text"}, "Conversa não encontrada.");
  var subt = (function(){
    var dig = (st.efem.digitando[conv.id]||[]).filter(function(x){ return x!==eu; });
    if(dig.length) return {t:conv.tipo==="grupo" ? contato(dig[0]).nome+" está digitando…" : "digitando…", verde:true};
    if(conv.tipo==="setor"){ var at = conv.atendente; return eu===conv.repId ? {t:at ? "Atendente: "+contato(at).nome : "Aguardando um atendente do setor…", verde:!!at} : {t:at ? "Atendida por "+(at===eu ? "você" : contato(at).nome) : "Na fila do setor · quem responder primeiro pega"}; }
    if(conv.tipo==="grupo") return {t:conv.membros.map(function(i){ return i===eu ? "Você" : contato(i).nome; }).join(", ")};
    var o = conv.membros.find(function(x){ return x!==eu; }) || conv.membros[0];
    if(online(o)) return {t:"online", verde:true};
    var v = presenca(o).visto; return {t:"visto por último "+(mesmoDia(v, Date.now()) ? "hoje às " : "ontem às ")+hora(v)};
  })();
  var outro = conv.tipo==="dm" ? (conv.membros.find(function(x){ return x!==eu; }) || conv.membros[0]) : null;
  var fixadas = todasAba.filter(function(m){ return m.fixa && m.apag!=="todos"; }), fixa = fixadas[fixadas.length-1];
  var irPara = function(id){
    var idx = todas.findIndex(function(m){ return m.id===id; });
    if(idx>=0 && todas.length-idx>limite) setLimite(todas.length-idx+20);
    setTimeout(function(){ var el = area.current && area.current.querySelector("[data-m=\""+id+"\"]"); if(el){ el.scrollIntoView({block:"center", behavior:"smooth"}); setDestaque(id); setTimeout(function(){ setDestaque(null); }, 1600); } }, 60);
  };
  irParaRef.current = irPara;
  var rolou = function(ev){ var a = ev.target; if(a.scrollTop<30 && todasAba.length>limite && !altAntes.current){ altAntes.current = a.scrollHeight; setLimite(limite+60); } };
  var itens = []; var anterior = null;
  msgs.forEach(function(m){
    if(!anterior || !mesmoDia(anterior.t, m.t)) itens.push(e("div",{key:"d"+m.id, className:"sticky top-1 z-10 my-2 flex justify-center"}, e("span",{className:"rounded-lg px-3 py-1 text-[11px] shadow", style:{background:W.cab, color:W.sec}}, diaRotulo(m.t))));
    if(m.tipo==="sistema") itens.push(e("div",{key:m.id, className:"my-1.5 flex justify-center px-6"}, e("span",{className:"rounded-lg px-3 py-1 text-center text-[11px]", style:{background:W.cab, color:W.sec}}, m.texto)));
    else itens.push(e(Bolha,{key:m.id, tema:tm, m:m, eu:eu, conv:conv, todas:todas, primeira:!anterior || anterior.de!==m.de || anterior.tipo==="sistema" || !mesmoDia(anterior.t, m.t) || m.t-anterior.t>5*MIN, destaque:destaque===m.id, somenteLeitura:somenteLeitura,
      responder:function(x){ setEditando(null); setResp({id:x.id, de:x.de, previa:textoPrevia(x)}); }, editar:function(x){ setResp(null); setEditando(x); }, apagar:setApagando, encaminhar:setEncaminhando, abrir:setVisor, irPara:irPara}));
    anterior = m;
  });

  return e("div",{id:"painel-conversa", className:"relative flex h-full min-h-0 flex-col", style:{background:W.fundo, color:W.texto}},
    // cabeçalho
    e("div",{className:"flex shrink-0 items-center gap-2.5 px-3 py-2", style:{background:W.cab}},
      p.onVoltar && e("button",{onClick:p.onVoltar, "aria-label":"Voltar para as conversas", className:"grid size-9 place-items-center rounded-full hover:bg-white/10 "+(p.compacto ? "" : "md:hidden")}, e(Ph,{n:"arrow-left", s:20})),
      e("button",{onClick:function(){ setInfo(true); }, className:"flex min-w-0 flex-1 items-center gap-3 text-left"},
        conv.tipo==="grupo" || (conv.tipo==="setor" && eu===conv.repId) ? e(Avatar,{grupo:true, nome:conv.nome, foto:conv.foto, s:42}) : e(Avatar,{id:conv.tipo==="setor" ? conv.repId : outro, s:42, presenca:true}),
        e("span",{className:"min-w-0 flex-1"}, e("span",{className:"block truncate text-[14px] font-semibold"}, tituloDe(conv, eu)),
          e("span",{className:"block truncate text-[11.5px]", style:{color:subt.verde ? W.verde : W.sec}}, subt.t))),
      p.extra, e("button",{onClick:function(){ setInfo(true); }, "aria-label":"Dados da conversa", className:"grid size-9 place-items-center rounded-full hover:bg-white/10"}, e(Ph,{n:"info", s:21, style:{color:W.sec}}))),
    conv.tipo==="dm" && outro && outro!==eu && contato(outro).tipo==="func" && e(CartaoHorario,{cid:outro, pode:!!p.direcao && !somenteLeitura}),
    conv.tipo==="setor" && eu!==conv.repId && e(BarraStatus,{conv:conv, eu:eu, pode:!somenteLeitura && conv.membros.indexOf(eu)>=0}),
    abasV && abasV.length>1 && e(BarraAbas,{conv:conv, eu:eu, abas:abasV, aba:abaAtual, mudar:setAba}),
    fixa && e("button",{onClick:function(){ irPara(fixa.id); }, className:"flex shrink-0 items-center gap-2.5 px-4 py-1.5 text-left text-[12px]", style:{background:W.painel, borderBottom:"1px solid "+W.borda}},
      e(Ph,{n:"push-pin", s:16, fill:true, style:{color:W.sec}}), e("span",{className:"min-w-0 flex-1 truncate"}, e("b",null, "Fixada"+(fixadas.length>1 ? " ("+fixadas.length+")" : "")+": "), textoPrevia(fixa))),
    e(FaixaMencoes,{estado:st, conv:conv, eu:eu, irPara:irPara}),
    // mensagens
    e("div",{ref:area, onScroll:rolou, className:"relative min-h-0 flex-1 overflow-y-auto py-2", style:estiloFundo(fundoId)},
      todasAba.length>limite && e("div",{className:"flex justify-center py-2"}, e("button",{onClick:function(){ altAntes.current = area.current.scrollHeight; setLimite(limite+60); }, className:"rounded-full px-4 py-1.5 text-[11.5px]", style:{background:W.cab, color:W.verde}}, "Mensagens anteriores")),
      !todasAba.length ? e(Vazio,{n:"chat-circle-dots"}, membro ? "Nenhuma mensagem ainda. Diga um oi 👋" : "Nenhuma mensagem nesta conversa.") : itens,
      (st.efem.digitando[conv.id]||[]).filter(function(x){ return x!==eu; }).length>0 && e("div",{className:"mt-2 flex px-[6%]"}, e("div",{className:"flex items-center gap-1 rounded-lg px-3 py-2.5", style:{background:tm.entrada, borderTopLeftRadius:0}},
        [0,1,2].map(function(i){ return e("span",{key:i, className:"size-1.5 animate-bounce rounded-full", style:{background:W.sec, animationDelay:i*0.15+"s"}}); })))),
    conv.id==="c_atend" && abaAtual===eu && !somenteLeitura && e("div",{className:"flex shrink-0 justify-center px-3 py-1.5", style:{background:W.cab, borderTop:"1px solid "+W.borda}},
      e("button",{onClick:function(){ setSolicitando(true); }, className:"flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-bold", style:{background:"linear-gradient(135deg,#b8892b,#f6dc8c)", color:"#24180a"}}, e(Ph,{n:"coins", s:16, fill:true}), "Solicitar pagamento")),
    solicitando && e(NovaSolicitacao,{eu:eu, fechar:function(){ setSolicitando(false); }}),
    e(Compositor,{dirResp:dirResp, aba:abaAtual, conv:conv, eu:eu, resp:resp, editando:editando, somenteLeitura:somenteLeitura, cancelarResp:function(){ setResp(null); }, cancelarEdicao:function(){ setEditando(null); }}),
    // apagar
    apagando && e(Janela,{titulo:"Apagar mensagem?", fechar:function(){ setApagando(null); }, largura:360},
      e("div",{className:"flex flex-col gap-2 p-4"},
        apagando.de===eu && apagando.apag!=="todos" && e("button",{onClick:function(){ api.deleteMessage(conv.id, apagando.id, eu, true); setApagando(null); }, className:"rounded-lg px-4 py-2.5 text-left text-[13.5px] hover:bg-white/10", style:{color:W.vermelho}}, "Apagar para todos"),
        e("button",{onClick:function(){ api.deleteMessage(conv.id, apagando.id, eu, false); setApagando(null); }, className:"rounded-lg px-4 py-2.5 text-left text-[13.5px] hover:bg-white/10", style:{color:W.vermelho}}, "Apagar para mim"),
        e("button",{onClick:function(){ setApagando(null); }, className:"rounded-lg px-4 py-2.5 text-left text-[13.5px] hover:bg-white/10"}, "Cancelar"))),
    encaminhando && e(Encaminhar,{msg:encaminhando, eu:eu, fechar:function(){ setEncaminhando(null); }}),
    visor && e(Janela,{titulo:visor.nome||"Arquivo", fechar:function(){ setVisor(null); }, largura:900}, visor.tipo==="imagem" ? e("img",{src:visor.url, alt:"", className:"mx-auto max-h-[80vh] w-auto"}) : e("iframe",{src:visor.url, title:visor.nome, className:"h-[78vh] w-full bg-white"})),
    info && e(InfoConversa,{conv:conv, eu:eu, direcao:p.direcao, fechar:function(){ setInfo(false); }, leitura:p.leitura, aoSair:function(){ setInfo(false); if(p.onVoltar) p.onVoltar(); }}));
}

function Encaminhar(p){
  var st = useChat(), sl = useState([]), sel = sl[0], setSel = sl[1];
  var lista = api.getConversations(p.eu);
  var enviar = function(){ sel.forEach(function(id){ api.sendMessage({conv:id, eu:p.eu, tipo:p.msg.tipo, texto:p.msg.texto, midia:p.msg.midia, mencoes:[], enc:true}); }); p.fechar(); };
  return e(Janela,{titulo:"Encaminhar para…", fechar:p.fechar, largura:400},
    e("div",{className:"flex flex-col"}, lista.map(function(x){ var on = sel.indexOf(x.conv.id)>=0, outro = x.conv.membros.find(function(i){ return i!==p.eu; });
      return e("button",{key:x.conv.id, onClick:function(){ setSel(on ? sel.filter(function(i){ return i!==x.conv.id; }) : sel.concat([x.conv.id])); }, className:"flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5"},
        e("span",{className:"grid size-5 place-items-center rounded border", style:{borderColor:on ? W.verde : W.sec, background:on ? W.verde : "transparent"}}, on && e(Ph,{n:"check", s:13, style:{color:"#fff"}})),
        x.conv.tipo==="grupo" ? e(Avatar,{grupo:true, nome:x.conv.nome, foto:x.conv.foto, s:36}) : e(Avatar,{id:outro, s:36}), e("span",{className:"min-w-0 flex-1 truncate text-[13.5px]"}, x.titulo)); })),
    e("div",{className:"sticky bottom-0 flex justify-end p-3", style:{background:W.painel, borderTop:"1px solid "+W.borda}},
      e("button",{onClick:enviar, disabled:!sel.length, className:"flex items-center gap-2 rounded-full px-5 py-2 text-[13px] font-semibold text-white disabled:opacity-40", style:{background:W.verde}}, e(Ph,{n:"paper-plane-tilt", s:17, fill:true}), "Enviar"+(sel.length ? " ("+sel.length+")" : ""))));
}
export { Conversa };

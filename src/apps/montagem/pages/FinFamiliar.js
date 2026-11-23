// Sorelly Admin · montagem — pages/FinFamiliar.js
// Financeiro Familiar trazido do SorellyAdmin: Home, Alertas, Contas a pagar, Contas pagas, PIX revendedoras, Prestadores, Pró-labores, Relatório, Histórico e Configurações.
// As regras e as contas ficam em domain/financeiro-familiar.js; aqui só as telas. Só os sócios (ACESSO_FF) abrem. Dados só neste navegador.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { bancoDeConta, junta, nomePropio, rotuloPrestadorFamilia } from "@/apps/montagem/lib/nome-conta";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { CASAS_PIX, CASAS_DONOS, ehCasa, FAMILIA4, daPessoa, donosDe, paraQuemDe, parteDe, membrosFamilia, ACESSO_FF, FORMAS, FORMAS_REPASSE, MESES, TIPOS_REGRA, br, hojeIso, hojeYm, janela, liquidoDe, nomeMes, parcelasDe, baixaDividas, casaDe, pixCasa, pixDivisao, pixDoMes, relatorioMes, saldoPrestador, somaMes, totaisPersona, vigenciaEm, ultimoDia, r2 } from "@/apps/montagem/domain/financeiro-familiar";
import { abrirAnexo, buscarAnexo, enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { BKC as BK } from "@/apps/montagem/lib/format";
import { use } from "@/apps/montagem/state/context";
import { Btn } from "@/apps/montagem/ui/button";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { PageHead } from "@/apps/montagem/ui/page";
import { Indicador, Pagina } from "@/apps/montagem/components/padrao";
import { Bloco, BlocoFiltros, Botao, CAMPO, CampoSel, Rotulo, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { MenuMulti } from "@/apps/montagem/components/padrao-fin";
import { BlocoResumo } from "@/apps/montagem/components/bloco-resumo";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { CaixaEscolha } from "@/apps/montagem/components/caixa-escolha";
import { PAGINA_CHEIA, CLS_FINA_ESPACO, BarraTabela, CelulaBarra, CampoMini, BuscaMini, refCheia } from "@/apps/montagem/components/planilha-cheia";
import { chavesParaGravar } from "@/apps/montagem/lib/chave-do-destino";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { e, useState } from "@/shared/react";
import React from "react";

var int = function(v){ return Math.round(v||0).toLocaleString("pt-BR"); };
var num = function(t){ var n = Number(String(t||"").replace(/\./g,"").replace(",",".")); return isNaN(n) ? 0 : n; };
var fmtN = function(v){ return Number(v||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
var th = function(t, c){ return e("th",{key:t, className:"whitespace-nowrap border-b border-border px-3 py-2 text-left text-[11.5px] font-semibold uppercase tracking-wide "+(c||"")}, t); };
var TD = "px-3 py-2 text-[13.5px]";
var CARD = "rounded-xl bg-linear-to-br from-[#3B82F6]/20 via-card to-card px-3 py-2 ring-1 ring-[#3B82F6]/40";
var AVISO = "flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[13.5px] font-medium text-destructive";

function useFF(){ var cx = use(), s = cx.state; return {s:s, d:cx.dispatch, ff:s.ff, por:nomeDe(s.usuario), pode:temAutorizacao("financeiro_familia", s.usuario)}; }
function acao(c, op, extra){ c.d(Object.assign({type:"FF", op:op, por:c.por}, extra)); }
function Guarda(p){ return p.c.pode ? p.children : e("div",{className:"flex flex-col gap-3"}, e(PageHead,{t:"Financeiro Familiar", sub:"Finanças pessoais dos sócios."}), e("p",{className:"rounded-xl bg-muted/30 px-4 py-6 text-center text-[14px] text-muted-foreground"}, "Só os sócios abrem o Financeiro Familiar.")); }
function Campo(p){ return e("label",{className:"flex flex-col gap-1 text-[12px] font-semibold "+(p.className||"")}, p.rot, p.children); }
function Sel(p){ return e("select",{value:p.value, "aria-label":p.label, className:INPUT+" h-10! cursor-pointer "+(p.className||"w-48"), onChange:function(ev){ p.onChange(ev.target.value); }}, p.children); }
function Txt(p){ return e("input",{value:p.value, type:p.type||"text", placeholder:p.ph||"", "aria-label":p.label, list:p.list, className:INPUT+" h-10! "+(p.className||"w-full"), onChange:function(ev){ p.onChange(ev.target.value); }, onKeyDown:p.onEnter ? function(ev){ if(ev.key==="Enter") p.onEnter(); } : undefined}); }
function Tile(p){ return e(Indicador,{t:p.t, v:p.v, cor:p.cor, sub:p.sub}); }   // padrão único: components/padrao.js
function Modal(p){
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/60 p-4", onClick:p.fechar},
    e("div",{className:"flex max-h-[92vh] w-full max-w-2xl flex-col gap-3 overflow-y-auto rounded-2xl bg-card p-5 ring-1 ring-[#EC4899]/50", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-start justify-between gap-3"}, e("div",null, e("h2",{className:"font-heading text-xl font-bold"}, p.t), p.sub && e("p",{className:"text-[12.5px] text-muted-foreground"}, p.sub)), e("button",{onClick:p.fechar, "aria-label":"Fechar", className:"grid size-9 place-items-center rounded-lg bg-muted/50"}, e(Ph,{n:"x", s:16}))), p.children));
}
function MesSel(p){ var l = janela(); return e(Sel,{value:p.ym, label:"Mês", className:"w-52", onChange:p.set}, p.todos && e("option",{value:""}, "Todos os meses"), l.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })); }
var pessoaNome = function(ff, id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.nome : "—"; };
// ESCRITA PADRÃO DA CONTA (Marcus, 22/11/2026: "alinhar conforme o negócio das contas"; regra em lib/nome-conta.js): sócio = PF · Marcus · Nubank; Casa = Casa · Itaú; cartão leva a palavra Cartão; prestador = Marcus · Higor · Santander; conta da Sorelly sem dono fica só com o nome
var contaLabel = function(ff, id){ var c = ff.contasBanc.find(function(x){ return x.id===id; }); if(!c) return "";
  var dono = (ff.personas || []).find(function(q){ return q.id===c.personaId; }), banco = bancoDeConta(c.banco+" "+c.nome) || nomePropio(String(c.banco || "").replace(/^Conta\s+/i, "")), cartao = /cart[aã]o/i.test(c.nome) ? "Cartão" : "";
  if(c.prestadorId){ var pr = (ff.prest || []).find(function(q){ return q.id===c.prestadorId; }); return rotuloPrestadorFamilia(dono ? dono.nome : "", pr ? pr.nome : "", c.banco+" "+c.nome); }
  if(/^a definir$/i.test(banco)) banco = "";
  if(!dono){ if(/itaú black|itau black/i.test(c.banco+" "+c.nome)) return junta(["Casa", cartao, banco]); if(cartao) return junta(["Cartão", banco, (String(c.nome).match(/\b(\d{2})\b/) || [])[1]]); return nomePropio(String(c.nome).replace(/^Conta\s+/i, "")); }
  var prefixo = ehCasa(dono.id) || dono.id==="familia" ? "Casa" : dono.id==="sorelly" ? "Sorelly" : "PF";
  return junta([prefixo, prefixo==="PF" ? nomePropio(dono.nome) : "", cartao, banco]) || nomePropio(c.nome); };
// LISTA DE CONTA PAGADORA (Marcus, 22/11/2026): só as contas da família (sócios e Casa), ativas, cada conta UMA vez; as contas de prestadores ficam no cadastro de prestadores
var contasPagadoras = function(ff){ var vistos = {}, out = []; ff.contasBanc.forEach(function(b){ if(!b.ativo || b.prestadorId) return; var n = contaLabel(ff, b.id); if(!n || vistos[n]) return; vistos[n] = 1; out.push(b); }); return out; };
var corPessoa = function(ff, id){ var p = ff.personas.find(function(x){ return x.id===id; }); return p ? p.cor : "#EC4899"; };
var catNome = function(ff, k){ var c = ff.categorias.find(function(x){ return x.chave===k; }); return c ? c.nome : k; };
var statusChip = function(x){ var cor = x.status==="PAGO" ? "#22C55E" : x.atrasada ? "#EF4444" : x.status==="PARCIAL" ? "#F59E0B" : "#94A3B8", lb = x.status==="PAGO" ? "Pago" : x.atrasada ? "Atrasado" : x.status==="PARCIAL" ? "Parcial" : "Pendente";
  return e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold", style:{background:cor+"26", color:cor}}, lb); };
var casaValor = function(q, v){ if(!q) return true; var bruto = q.replace(/\./g,"").replace(",","."); return fmtN(v).indexOf(q)>=0 || String(r2(v)).indexOf(bruto)>=0; };
var iconBtn = function(ic, titulo, fn, perigo){ return e("button",{key:ic+titulo, onClick:fn, title:titulo, "aria-label":titulo, className:"grid size-8 place-items-center rounded-lg bg-muted/50 text-muted-foreground "+(perigo ? "hover:bg-destructive/20 hover:text-destructive" : "hover:bg-white/15 hover:text-white")}, e(Ph,{n:ic, s:15})); };

// ───────────────── Home ─────────────────
// Totais do ano: soma dos 12 meses (pró-labore, contas e PIX) de cada pessoa
// Conta de carro: pela descrição, observação ou categoria (BMW M2, BMW 320i, X1, Peugeot, Nicks Parts, Euro Import, Auto Performance, consórcio de veículo, pedágio, combustível)
var RE_CARRO = /bmw|peugeot|nicks|auto performance|motorsport|euro import|ve[ií]culo|sem parar|ped[aá]gio|combust|ipva|licenciamento|\bcarro/i;
var ehCarro = function(conta){ return conta.centro==="CARROS" || RE_CARRO.test((conta.descricao||"")+" "+(conta.obs||"")+" "+(conta.categoria||"")); };
var catDe = function(ff, conta){ return ehCarro(conta) ? "Carros" : catNome(ff, conta.categoria); };
// ordem dentro de Carros: financiamento, consórcio, seguro, acidente e serviços, peças, pedágio e combustível
var rankCarro = function(x){ if(x.cat!=="Carros") return 0; var t = (x.desc||"")+" "+(x.obs||""); return x.catChave==="FINANCIAMENTO" ? 1 : x.catChave==="CONSORCIO" ? 2 : x.catChave==="SEGURO" ? 3 : /acidente|euro import|auto performance|motorsport/i.test(t) ? 4 : /sem parar|ped[aá]gio|combust/i.test(t) ? 6 : 5; };
var rotItem = function(x){ var o = (x.obs||"").trim(); return x.cat==="Carros" && o && o.length<=42 && o.toLowerCase()!==String(x.desc||"").toLowerCase() ? x.desc+" · "+o : x.desc; };
function totaisMeses(ff, pid, lista){
  var ts = lista.map(function(k){ return totaisPersona(ff, pid, k); });
  var s = function(fn){ return r2(ts.reduce(function(a, x){ return a+fn(x); }, 0)); };
  return {contas:{total:s(function(x){ return x.contas.total; }), pago:s(function(x){ return x.contas.pago; }), restante:s(function(x){ return x.contas.restante; }), pendentes:ts.reduce(function(a, x){ return a+x.contas.pendentes; }, 0), atrasado:s(function(x){ return x.contas.atrasado || 0; })},
    pro:{total:s(function(x){ return x.pro.total; }), recebido:s(function(x){ return x.pro.recebido; }), restante:s(function(x){ return x.pro.restante; })},
    pix:{meta:s(function(x){ return x.pix.meta; }), recebido:s(function(x){ return x.pix.recebido; }), restante:s(function(x){ return x.pix.restante; })}};
}
function totaisAno(ff, pid, ano){
  var ts = []; for(var i=1; i<=12; i++) ts.push(totaisPersona(ff, pid, ano+"-"+(i<10 ? "0" : "")+i));
  var s = function(fn){ return r2(ts.reduce(function(a, x){ return a+fn(x); }, 0)); };
  return {contas:{total:s(function(x){ return x.contas.total; }), pago:s(function(x){ return x.contas.pago; }), restante:s(function(x){ return x.contas.restante; }), pendentes:ts.reduce(function(a, x){ return a+x.contas.pendentes; }, 0)},
    pro:{total:s(function(x){ return x.pro.total; }), recebido:s(function(x){ return x.pro.recebido; }), restante:s(function(x){ return x.pro.restante; })},
    pix:{meta:s(function(x){ return x.pix.meta; }), recebido:s(function(x){ return x.pix.recebido; }), restante:s(function(x){ return x.pix.restante; })}};
}
// HOME = RESUMO QUE ABRE (Marcus, 23/11/2026): linhas dizem O QUE É e colunas dizem QUEM, em 3 grupos (Pessoas, Compartilhado, Casas). Só o essencial fica à vista (Pró-labore, Pix, Pago, Falta pagar, A pagar no mês);
// o resto abre ao clicar (para onde foi o Pix, prestadores, transferências, categorias). Atrasado e vence-em-7-dias NÃO ficam aqui: é da tela Contas a pagar. O Lucas fica numa linha no fim, FORA do total da família.
var diaBr = function(iso){ return iso ? iso.slice(8,10)+"/"+iso.slice(5,7)+"/"+iso.slice(2,4) : "—"; };
var LIM_DET = 80;   // linhas de cada lista aberta (a lista completa fica na tela de lançar)
var FORA_DO_TOTAL = ["lucas"];   // quem não entra no total da família: aparece numa linha no fim
function DetTab(p){
  var l = p.linhas || [], corte = l.length>LIM_DET;
  return e("div",{className:"flex flex-col gap-1.5 p-1.5", onClick:function(ev){ ev.stopPropagation(); }},
    l.length===0 ? e("p",{className:"py-2 text-center text-[11px]"}, p.vazio || "Nada neste período.") :
      e(TabelaPlanilha,{fina:true, cols:p.cols, linhas:corte ? l.slice(0, LIM_DET) : l, chave:"id", grade:true, semMao:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nada."}),
    corte && e("p",{className:"text-center text-[11px]"}, "Mostrando as "+LIM_DET+" primeiras de "+l.length+". A lista completa fica em "+(p.onde || "outra tela")+"."),
    p.ir && e("div",{className:"flex justify-center"}, e(Botao,{onClick:function(){ p.ir(p.ir2); }}, p.rotuloIr)));
}
// ESCALA DE COR DOS BLOCOS QUE ABREM (Marcus, 23/11/2026): a linha que abre fica no azul escuro normal; o que aparece dentro dela é só 20% mais claro; e o que abre dentro disso, mais 20%, e assim por diante. As bordas e as linhas NÃO mudam de cor: ficam na cor da linha da tabela.
var AZUL_BASE = [31, 51, 88], PASSO_ABERTO = 1.2, PASSO_DENTRO = 1.32;   // azul escuro da tabela; 1º nível = 20% mais claro; do 2º em diante, mais 32% a cada nível
var ESCALA_ABERTO = [1, 2, 3, 4].map(function(n){ var k = PASSO_ABERTO*Math.pow(PASSO_DENTRO, n-1); return "rgb("+AZUL_BASE.map(function(v){ return Math.min(255, Math.round(v*k)); }).join(",")+")"; });   // nível 1 → nível 4
var CSS_ABERTO = ESCALA_ABERTO.map(function(cor, i){ return "table tbody tr.ffa-n"+(i+1)+">td{background:"+cor+" !important}"; }).concat([
  "table tbody tr.ffa-aberta>td{font-weight:700 !important}",
  "section.compacto table tbody td{border-color:rgba(255,255,255,.45) !important}",
  "section.compacto table thead th{border-color:rgba(255,255,255,.45) !important;letter-spacing:.02em !important}",
  "section.compacto table td,section.compacto table th{padding-left:4px !important;padding-right:4px !important}",   // compacto: menos espaço dos lados de cada coluna
  "section.compacto table thead tr:first-child th{border-bottom:1px solid rgba(255,255,255,.45) !important}",   // linha de grupos (Pessoas · Compartilhado): com linhas em volta, igual ao resto da tabela
  "section.compacto table thead tr:first-child th:not(:empty){border:1px solid rgba(255,255,255,.45) !important}",
  "section.compacto table td,section.compacto table td *{color:#fff !important}",   // Marcus, 23/11/2026: todas as letras brancas, sem verde nem vermelho
  ".ff-mes>button{height:18px !important;min-height:18px !important;font-size:10px !important;font-weight:500 !important;padding:0 6px !important;border-radius:4px !important;background:rgba(255,255,255,.1) !important;border:1px solid rgba(255,255,255,.25) !important;color:#fff !important;line-height:1 !important}",
  ".ff-mes>div{background:#1f3358 !important;border:1px solid rgba(255,255,255,.45) !important;border-radius:6px !important;padding:4px !important;min-width:170px !important;box-shadow:0 10px 28px rgba(0,0,0,.55) !important;z-index:60 !important}",
  ".ff-mes>div label{height:24px !important;font-size:11px !important;color:#fff !important;border-radius:4px !important}",
  ".ff-mes>div label:hover{background:rgba(255,255,255,.14) !important}",
  ".ff-mes>div button{height:24px !important;font-size:11px !important;color:#fff !important;border-top:1px solid rgba(255,255,255,.3) !important}",
  ".ff-cab{background:#2d5190;text-align:center;font-weight:700;text-transform:uppercase;font-size:11px;padding:1px 6px;border:1px solid rgba(255,255,255,.45);color:#fff}",
  ".ff-sep{height:3px;background:rgba(255,255,255,.9)}",
  "table tbody tr.ffa-alerta>td{background:#3a2a52 !important}",
  ".ff-par{display:grid;gap:0;margin-top:-10px;overflow:hidden;border-radius:0;border:2px solid #2d5190 !important;border-top:5px solid rgba(255,255,255,.9) !important}",
  ".ff-par>section{height:100%;border:0 !important;border-radius:0 !important}",
  ".ff-duo{display:grid;grid-template-columns:minmax(0,1fr)}",
  ".ff-pixlist>div>div{scroll-snap-type:y mandatory;scroll-padding-top:26px}",
  ".ff-pixlist tbody tr{scroll-snap-align:start}",
  ".ff-duo table thead th{background:#1f3358 !important;background-image:none !important;opacity:1 !important;box-shadow:0 -8px 0 0 #1f3358}",
  ".ff-duo table thead{position:sticky;top:0;z-index:6}",
  "@media (min-width:1024px){.ff-duo{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.ff-duo>div+div{border-left:5px solid rgba(255,255,255,.9)}}",
  "@media (min-width:1024px){.ff-par2{grid-template-columns:1fr 1fr}.ff-par2>section+section{border-left:5px solid rgba(255,255,255,.9) !important}}"
]).join(" ");
CSS_ABERTO = "@layer utilities{ "+CSS_ABERTO+" }";   // dentro da camada utilities: sem isso o Tailwind (importante em camada) vence o estilo solto
function AbaFfHome(){
  var c = useFF(), ff = c.ff, ms = useState([hojeYm()]), sel = ms[0], setSel = ms[1], ym = sel[sel.length-1], MULTI = sel.length>1;   // MÊS: dá para marcar vários meses juntos (Marcus, 23/11/2026)
  var gs = useState({}), ab = gs[0], setAb = gs[1], alterna = function(g){ var o = Object.assign({}, ab); o[g] = !ab[g]; setAb(o); };   // grupos de linhas abertos (tudo nasce fechado)
  var qs = useState("todos"), quem = qs[0], setQuem = qs[1];
  var js = useState(false), junto = js[0], setJunto = js[1];   // só na visão Todas: Casas "Separado" (cada casa na sua coluna) ou "Junto" (a parte de cada casa dentro de cada pessoa)   // "Quem": todos (uma coluna por pessoa) ou uma pessoa (colunas Total · Já pago · Falta)
var ap = useState(null), altPix = ap[0], setAltPix = ap[1];
  // A LISTA DO PIX CABE NA TELA (Marcus, 23/11/2026): a tela não sobe nem desce; a lista usa a altura que sobra e mostra sempre linhas inteiras (nunca uma linha cortada no meio)
  React.useEffect(function(){
    var medir = function(){ var el = document.querySelector(".ff-pixlist"); if(!el){ if(altPix!==null) setAltPix(null); return; }
      var cab = el.querySelector("thead"), lin = el.querySelector("tbody tr"); if(!cab || !lin) return;
      var hCab = cab.getBoundingClientRect().height, hLin = lin.getBoundingClientRect().height || 20, topo = el.getBoundingClientRect().top;
      var livre = window.innerHeight - topo - 30 - hCab, n = Math.max(3, Math.floor(livre/hLin)), h = Math.round(hCab + n*hLin + 2);
      if(altPix===null || Math.abs(altPix-h)>1) setAltPix(h); };
    medir(); window.addEventListener("resize", medir); return function(){ window.removeEventListener("resize", medir); };
  });
  // BLOCO ABERTO COM LINHA QUE FECHA (Marcus, 23/11/2026): as linhas de dentro ficam num tom um pouco mais claro, com uma barra azul fina à esquerda, e a última de cada bloco ganha uma linha mais forte embaixo
  var marcaFim = function(arr){ arr.forEach(function(l, i){ var nx = arr[i+1], nv = l.nivel||0; if(nv>0 && (!nx || (nx.nivel||0)<nv)) l.fim = (!nx || (nx.nivel||0)===0) ? 1 : 2; }); return arr; };
  // Quando um bloco abre (Marcus, 23/11/2026: "melhora um bloco quando vai abrindo"): a linha que abriu fica mais clara e em negrito; o que está dentro fica MAIS ESCURO, com uma barra azul grossa à esquerda (mais clara a cada nível); a última linha do bloco fecha com uma linha branca mais forte
  var tinta = function(l){ var nv = Math.min(l.nivel||0, ESCALA_ABERTO.length), cl = "";
    if(nv>0) cl += "ffa-n"+nv;
    if(l.tg && ab[l.tg]) cl += " ffa-aberta";
    return cl; };
  var mesesOp = janela().filter(function(k){ return k<=hojeYm(); }), anosOp = mesesOp.map(function(k){ return k.slice(0,4); }).filter(function(a, i, l){ return l.indexOf(a)===i; });
  var ir = function(aba){ c.d({type:"ABA", aba:aba}); };
  var yms = sel.slice().sort();
  var MCURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], mc = function(k){ return MCURTO[Number(k.slice(5, 7))-1]; };
  var seguidos = yms.every(function(k, i){ return i===0 || somaMes(yms[i-1], 1)===k; });
  var mesmoAno = yms.every(function(k){ return k.slice(0, 4)===yms[0].slice(0, 4); });
  var rotPeriodo = yms.length===1 ? nomeMes(yms[0]) : seguidos ? (mesmoAno ? mc(yms[0])+" a "+nomeMes(yms[yms.length-1]) : nomeMes(yms[0])+" a "+nomeMes(yms[yms.length-1])) : (mesmoAno ? yms.map(mc).join(", ")+"/"+yms[0].slice(0, 4) : yms.map(nomeMes).join(", "));
  var rotBotaoMes = function(marcados){ var ks = marcados.map(function(o){ return o[0]; }).sort(); if(ks.length===1) return nomeMes(ks[0]); var sg = ks.every(function(k, i){ return i===0 || somaMes(ks[i-1], 1)===k; }); return sg && ks[0].slice(0, 4)===ks[ks.length-1].slice(0, 4) ? mc(ks[0])+" a "+mc(ks[ks.length-1])+"/"+ks[0].slice(0, 4) : ks.length+" meses"; };
  var todasParc = parcelasDe(ff, {yms:yms});
  var contaPessoa = {}; (ff.contasBanc||[]).forEach(function(b){ contaPessoa[b.id] = b.personaId; });
  // 1) dados de cada pessoa (as colunas)
  var dados = ff.personas.filter(function(p){ return p.ativo && (p.mostrarContas || p.mostrarPix || p.mostrarProlabore); }).map(function(p){
    var t = MULTI ? totaisMeses(ff, p.id, yms) : totaisPersona(ff, p.id, ym);
    var itens = todasParc.filter(function(x){ return daPessoa(x.conta, p.id); }).map(function(x){ var q = parteDe(x.conta);
      return {id:x.chave+"|"+p.id, pessoa:p.nome, pid:p.id, comp:!!donosDe(x.conta), casa:(x.conta.personaId!==p.id ? pessoaNome(ff, x.conta.personaId) : ""), catChave:x.conta.categoria, pro:x.conta.categoria==="PRO_LABORE", desc:x.conta.descricao, cat:catDe(ff, x.conta), obs:x.conta.obs||"", venc:x.venc, valor:r2(x.valor*q), pago:r2(x.pago*q), restante:r2(x.restante*q), atrasada:x.atrasada, status:x.status, pagamentos:(x.pagamentos||[]).map(function(g){ return Object.assign({}, g, {valor:r2(g.valor*q)}); })}; });
    // PIX REVENDEDORA NA FAMÍLIA É META, NÃO CONTA A PAGAR (Marcus, 23/11/2026): a conta de categoria Pix revendedora sai das Contas a pagar da Home (a meta já aparece no bloco Pix revendedoras); na Contas a pagar da empresa ela continua valendo
    var pxr = itens.filter(function(x){ return x.catChave==="PIX_REVENDEDORA"; });
    if(pxr.length>0){ itens = itens.filter(function(x){ return x.catChave!=="PIX_REVENDEDORA"; });
      var sm = function(k, fil){ return r2(pxr.filter(fil || function(){ return true; }).reduce(function(a, x){ return a+x[k]; }, 0)); };
      t = Object.assign({}, t, {contas:Object.assign({}, t.contas, {total:r2(t.contas.total-sm("valor")), pago:r2(t.contas.pago-sm("pago")), restante:r2(t.contas.restante-sm("restante")), pendentes:Math.max(0, t.contas.pendentes-pxr.filter(function(x){ return x.status!=="PAGO"; }).length), atrasado:r2(t.contas.atrasado-sm("restante", function(x){ return x.atrasada; }))})}); }
    var prestMes = r2(yms.reduce(function(a, k){ return a+pixDivisao(ff, p.id, k).prestadores; }, 0));
    var trEnv = 0, trRec = 0; (ff.transf||[]).forEach(function(x){ if(yms.indexOf(String(x.data).slice(0,7))<0) return; if(contaPessoa[x.origem]===p.id) trEnv += x.valor; if(contaPessoa[x.destino]===p.id) trRec += x.valor; });
    var cats = {}; itens.forEach(function(x){ cats[x.cat] = r2((cats[x.cat]||0)+x.valor); });
    var saldoPrest = r2(ff.prest.filter(function(x){ return x.ativo && x.responsavelId===p.id; }).reduce(function(a, x){ return a+saldoPrestador(ff, x.id); }, 0));
    return {p:p, t:t, itens:itens, cats:cats, trEnv:r2(trEnv), trRec:r2(trRec), prestMes:prestMes, saldoPrest:saldoPrest, pix:t.pix.recebido, meta:t.pix.meta, direto:r2(Math.max(0, t.pix.recebido-prestMes))};
  });
  // CASAS: SEPARADO OU JUNTO (Marcus, 23/11/2026: "eu preciso passar para meus pais e irmã o gasto de cada um no mês").
  // Separado (padrão): a pessoa leva só o que é dela; Casa/Família, Alphaville, Jardine, Praia e Marco / Ana têm coluna própria com o valor inteiro, e o Total soma tudo uma vez.
  // Junto: cada pessoa leva a sua parte das casas (Família e Alphaville ÷4; Jardine, Praia e Marco / Ana: Marco e Anamaria 50%); as colunas das casas somem. O Total é o mesmo nos dois jeitos.
  var mkItem = function(x, p, q){ return {id:x.chave+"|"+p.id, pessoa:p.nome, pid:p.id, comp:true, casa:p.nome, catChave:x.conta.categoria, pro:false, desc:x.conta.descricao, cat:catDe(ff, x.conta), obs:x.conta.obs||"", venc:x.venc, valor:r2(x.valor*q), pago:r2(x.pago*q), restante:r2(x.restante*q), atrasada:x.atrasada, status:x.status, pagamentos:(x.pagamentos||[]).map(function(g){ return Object.assign({}, g, {valor:r2(g.valor*q)}); })}; };
  var brutoItens = function(p){ return todasParc.filter(function(x){ return x.conta.personaId===p.id && x.conta.categoria!=="PIX_REVENDEDORA"; }).map(function(x){ return mkItem(x, p, 1); }); };
  var recalcContas = function(its){ var c = its.filter(function(x){ return !x.pro; }), sm = function(k){ return r2(c.reduce(function(a, x){ return a+x[k]; }, 0)); };
    return {total:sm("valor"), pago:sm("pago"), restante:sm("restante"), pendentes:c.filter(function(x){ return x.status!=="PAGO"; }).length, atrasado:r2(c.filter(function(x){ return x.atrasada; }).reduce(function(a, x){ return a+x.restante; }, 0))}; };
  var familiaP = ff.personas.filter(function(p){ return p.id==="familia"; })[0], membros4 = membrosFamilia(ff);
  dados = dados.map(function(d){
    var jn = quem==="todos" ? junto : true;   // a visão de uma pessoa sempre leva a parte dela das casas
    var its = d.itens;
    if(!jn){ its = its.filter(function(x){ return !x.comp; }); if(d.p.id==="familia") its = brutoItens(d.p); }
    else if(membros4.indexOf(d.p.id)>=0 && familiaP){
      its = its.concat(todasParc.filter(function(x){ return x.conta.personaId==="familia" && !donosDe(x.conta) && x.conta.categoria!=="PIX_REVENDEDORA"; }).map(function(x){ return mkItem(x, familiaP, 1/membros4.length); })); }
    var cats = {}; its.forEach(function(x){ if(!x.pro) cats[x.cat] = r2((cats[x.cat]||0)+x.valor); });
    return Object.assign({}, d, {t:Object.assign({}, d.t, {contas:recalcContas(its)}), itens:its, cats:cats});
  });
  var grupoDe = function(p){ return p.tipo==="SOCIO" ? "Pessoas" : (p.id==="familia" || p.id==="marco_ana") ? "Compartilhado" : "Casas"; };
  var ORDEM = ["Pessoas", "Compartilhado", "Casas"];
  var foraTodos = dados.filter(function(d){ return FORA_DO_TOTAL.indexOf(d.p.id)>=0; });
  var Dtodos = dados.filter(function(d){ return FORA_DO_TOTAL.indexOf(d.p.id)<0 && (d.p.tipo==="SOCIO" || d.t.pro.total>0 || d.t.contas.total>0 || d.pix>0 || d.meta>0); })
    .sort(function(a, b){ return ORDEM.indexOf(grupoDe(a.p))-ORDEM.indexOf(grupoDe(b.p)); });
  var D = (quem==="todos" && junto) ? Dtodos.filter(function(d){ return d.p.id!=="familia"; }) : Dtodos;
  var fora = foraTodos;
  // CASAS COM COLUNA PRÓPRIA (Separado): o valor inteiro de cada casa. No Junto elas somem, porque cada pessoa já leva a sua parte.
  var Cc = (quem==="todos" && !junto) ? ["casaalphaville", "casajardine", "juan", "marco_ana"].map(function(id){ return ff.personas.filter(function(p){ return p.id===id; })[0]; }).filter(Boolean).map(function(p){
    var its = brutoItens(p), cats = {}; its.forEach(function(x){ cats[x.cat] = r2((cats[x.cat]||0)+x.valor); });
    var pixCasa2 = r2(ff.pix.filter(function(x){ return x.casa===p.id && yms.indexOf(String(x.data).slice(0,7))>=0 && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT"; }).reduce(function(a, x){ return a+x.valor; }, 0));   // Pix que entrou para a casa (marcado em Pix revendedoras)
    return {p:p, casa:true, t:{pro:{total:0, recebido:0, restante:0}, contas:recalcContas(its), pix:{meta:0, recebido:0}}, itens:its, cats:cats, trEnv:0, trRec:0, prestMes:0, saldoPrest:0, pix:pixCasa2, meta:0, direto:pixCasa2};
  }).filter(function(d){ return d.t.contas.total>0.005 || d.pix>0.005; }) : [];
  var todosItens = [].concat.apply([], D.concat(Cc).map(function(d){ return d.itens; }));
  // 2) listas que abrem ao clicar
  var C = function(k, t, extra){ return Object.assign({k:k, t:t}, extra||{}); };
  var sit = function(x){ return x.atrasada ? "Atrasada" : x.status==="PARCIAL" ? "Parcial" : "Pendente"; };
  var corSit = function(l){ return l.sit==="Atrasada" ? "text-destructive" : l.sit==="Parcial" ? "text-warning" : ""; };
  var colsConta = [C("pessoa","Pessoa"), C("desc","Conta"), C("cat","Categoria"), C("vencBr","Vencimento"), C("valor","Valor",{fmt:BK}), C("pago","Pago",{fmt:BK, cor:function(l){ return l.pago>0 ? "text-success" : ""; }}), C("restante","Restante",{fmt:BK, cor:function(l){ return l.atrasada ? "text-destructive" : ""; }}), C("sit","Situação",{cor:corSit})];
  var viraConta = function(x){ return Object.assign({}, x, {vencBr:diaBr(x.venc), sit:sit(x)}); };
  var porVenc = function(a, b){ return a.venc.localeCompare(b.venc); };
  var abertas = todosItens.filter(function(x){ return x.restante>0.005; }).sort(porVenc).map(viraConta);
  var listaPagas = [].concat.apply([], todosItens.map(function(x){ return x.pagamentos.map(function(g, j){ return {id:x.id+"#"+j, em:g.em, emBr:diaBr(g.em), pessoa:x.pessoa, desc:x.desc, cat:x.cat, forma:g.forma||"—", conta:g.conta||"—", valor:g.valor}; }); })).sort(function(a, b){ return String(b.em).localeCompare(String(a.em)); });
  var pixLista = ff.pix.filter(function(x){ return yms.indexOf(x.data.slice(0,7))>=0 && !pixCasa(ff, x) && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT" && D.some(function(d){ return d.p.id===x.personaId; }); })
    .sort(function(a, b){ return b.data.localeCompare(a.data); }).map(function(x){ return {id:x.id, dataBr:diaBr(x.data), pessoa:pessoaNome(ff, x.personaId), origem:x.origem||"—", valor:x.valor, conta:contaLabel(ff, x.contaId)||"—", aud:x.auditoria==="CONFIRMADO" ? "Confirmado" : "Pendente"}; });
  var repMes = ff.repasses.filter(function(r){ return yms.indexOf(String(r.data).slice(0,7))>=0; });
  var prestLista = ff.prest.filter(function(x){ return x.ativo || repMes.some(function(r){ return r.prestId===x.id; }); }).map(function(x){ var dv = ff.dividas.filter(function(y){ return y.prestId===x.id; }).reduce(function(a, y){ return a+y.valor; }, 0), rp = ff.repasses.filter(function(y){ return y.prestId===x.id; }).reduce(function(a, y){ return a+y.valor; }, 0);
    return {id:x.id, respId:x.responsavelId, prest:nomePropio(x.nome), serv:x.servico||"—", dono:x.responsavelId ? pessoaNome(ff, x.responsavelId) : "Sem responsável", noPeriodo:r2(repMes.filter(function(r){ return r.prestId===x.id; }).reduce(function(a, r){ return a+r.valor; }, 0)), dividas:r2(dv), novas:r2(ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor>0 && yms.indexOf(String(y.data).slice(0,7))>=0; }).reduce(function(a, y){ return a+y.valor; }, 0)), pagoTotal:r2(rp), saldo:saldoPrestador(ff, x.id)}; }).sort(function(a, b){ return b.saldo-a.saldo; });
  var ultimoYm = yms[yms.length-1] || ym;
  var proLista = D.filter(function(d){ return d.p.mostrarProlabore; }).map(function(d){ var v = vigenciaEm(ff, d.p.id, ultimoYm); return {id:d.p.id, pessoa:d.p.nome, bruto:v ? v.bruto : 0, inss:v ? v.inss : 0, irrf:v ? v.irrf : 0, liquido:v ? v.liquido : 0, datas:v && v.valor1 ? "dia "+v.dia1+": "+BK(v.valor1)+" · dia "+v.dia2+": "+BK(v.valor2) : "—"}; }).filter(function(x){ return x.bruto>0; });
  var detCat = function(cat){ return e(DetTab,{cols:colsConta, linhas:todosItens.filter(function(x){ return x.cat===cat; }).sort(porVenc).map(viraConta), onde:"Contas a pagar da família", ir:ir, ir2:"ffcontas", rotuloIr:"Abrir contas a pagar"}); };
  var fmtSaldo = function(v){ return v<-0.005 ? "Pago a mais "+BK(-v) : BK(v); }, corSaldo = function(l){ return l.saldo<-0.005 ? "text-warning" : l.saldo>0.005 ? "text-destructive" : "text-success"; };
  var colsPrest = [C("prest","Prestador"), C("serv","Serviço"), C("dono","Dono"), C("noPeriodo","Repassado no período",{fmt:BK}), C("dividas","Dívidas",{fmt:BK}), C("pagoTotal","Pago (todos os tempos)",{fmt:BK, cor:function(){ return "text-success"; }}), C("saldo","Saldo",{fmt:fmtSaldo, cor:corSaldo})];
  var detPrest = function(linhas){ return function(){ return e(DetTab,{cols:colsPrest, linhas:linhas, vazio:"Nenhum prestador.", onde:"Cadastro de prestadores", ir:ir, ir2:"ffprest", rotuloIr:"Abrir cadastro de prestadores"}); }; };
  // 3) as linhas do resumo (Marcus, 23/11/2026): na visão Todas valem as MESMAS palavras da visão de uma pessoa (Total · Pago · Falta). Cada assunto é uma seção sempre aberta; só as listas longas (categorias, transferências) abrem ao clicar.
  var num = function(ok, v){ return ok ? v : null; };
  var FIXO = {pl:1, ct:1, pr:1, px:1, ap:1};
  var linhas = [], L = function(id, rot, fn, o){ linhas.push(Object.assign({id:id, rot:rot, f:fn}, o||{})); };
  var GRUPO = function(g, rot){ linhas.push({id:"g-"+g, rot:rot, tipo:"grupo", g:g, fixo:!!FIXO[g]}); };
  var prestDe = function(d){ return prestLista.filter(function(x){ return x.respId===d.p.id && (x.noPeriodo>0.005 || x.novas>0.005); }); };   // os mesmos prestadores da visão de uma pessoa: os que receberam Pix no período
  var detPro = function(){ return e(DetTab,{cols:[C("pessoa","Pessoa"), C("bruto","Bruto",{fmt:BK}), C("inss","INSS",{fmt:BK}), C("irrf","IRRF",{fmt:BK}), C("liquido","Líquido",{fmt:BK}), C("datas","Datas")], linhas:proLista, vazio:"Nenhum pró-labore cadastrado.", onde:"Pró-labores", ir:ir, ir2:"ffprolab", rotuloIr:"Abrir pró-labores"}); };
  var detPix = function(){ return e(DetTab,{cols:[C("dataBr","Data"), C("pessoa","Pessoa"), C("origem","Revendedora"), C("valor","Valor",{fmt:BK}), C("conta","Conta"), C("aud","Conferência",{cor:function(l){ return l.aud==="Pendente" ? "text-warning" : "text-success"; }})], linhas:pixLista, vazio:"Nenhum Pix neste período.", onde:"PIX revendedoras", ir:ir, ir2:"ffpix", rotuloIr:"Abrir Pix revendedoras"}); };
  var detPagas = function(){ return e(DetTab,{cols:[C("emBr","Pago em"), C("pessoa","Pessoa"), C("desc","Conta"), C("cat","Categoria"), C("forma","Forma"), C("conta","Conta utilizada"), C("valor","Valor",{fmt:BK, cor:function(){ return "text-success"; }})], linhas:listaPagas, vazio:"Nenhum pagamento neste período.", onde:"Contas pagas da família", ir:ir, ir2:"ffpagas", rotuloIr:"Abrir contas pagas"}); };
  var detFalta = function(){ return e(DetTab,{cols:colsConta, linhas:abertas, vazio:"Nada em aberto.", onde:"Contas a pagar da família", ir:ir, ir2:"ffcontas", rotuloIr:"Abrir contas a pagar"}); };
  var temPro = function(d){ return d.p.mostrarProlabore && !d.casa; }, temCta = function(d){ return d.p.mostrarContas; }, temPix = function(d){ return d.casa ? d.pix>0.005 : d.p.mostrarPix; };
  GRUPO("pl", "Pró-labore");
  L("plT", "Total", function(d){ return num(temPro(d), d.t.pro.total); }, {g:"pl", sub:1, det:detPro});
  L("plP", "Pago", function(d){ return num(temPro(d), d.t.pro.recebido); }, {g:"pl", sub:1});
  L("plF", "Falta", function(d){ return num(temPro(d), d.t.pro.restante); }, {g:"pl", sub:1});
  GRUPO("ct", "Contas a pagar");
  L("ctT", "Total", function(d){ return num(temCta(d), d.t.contas.total); }, {g:"ct", sub:1});
  L("ctP", "Pago", function(d){ return num(temCta(d), d.t.contas.pago); }, {g:"ct", sub:1, det:detPagas});
  L("ctF", "Falta", function(d){ return num(temCta(d), d.t.contas.restante); }, {g:"ct", sub:1, det:detFalta});
  GRUPO("pr", "Prestadores de Serviços");
  L("prT", MULTI ? "Entrou devendo no período" : "Entrou devendo no mês", function(d){ return d.casa ? null : r2(prestDe(d).reduce(function(a, x){ return a+x.novas; }, 0)); }, {g:"pr", sub:1, vz:1, det:detPrest(prestLista)});
  L("prP", "Pago no período", function(d){ return d.casa ? null : r2(prestDe(d).reduce(function(a, x){ return a+x.noPeriodo; }, 0)); }, {g:"pr", sub:1, vz:1, det:detPrest(prestLista.filter(function(x){ return x.noPeriodo>0.005; }))});
  GRUPO("px", "Pix revendedoras");
  L("meta", "Meta", function(d){ return d.casa ? null : num(temPix(d), d.meta); }, {g:"px", sub:1});
  L("pix", "Recebido", function(d){ return num(temPix(d), d.pix); }, {g:"px", sub:1, det:detPix});
  L("pxF", "Falta", function(d){ return temPix(d) && d.meta>0 ? r2(Math.max(0, d.meta-d.pix)) : null; }, {g:"px", sub:1});
  // SALDO DA CASA (Marcus, 23/11/2026): só as casas têm Pix marcado (hoje a Alphaville); mostra o Pix que entrou para a casa menos o que já foi pago das contas dela no período
  L("pxS", "Saldo da casa", function(d){ return d.casa && d.pix>0.005 ? r2(d.pix-d.t.contas.pago) : null; }, {g:"px", sub:1});
  L("direto", "Conta pessoal", function(d){ return num(temPix(d), d.direto); }, {g:"px", sub:1});
  L("prestPix", "Prestadores de Serviços", function(d){ return num(temPix(d), d.prestMes); }, {g:"px", sub:1, det:detPrest(prestLista)});
  L("pcMeta", "% da meta", function(d){ return temPix(d) && d.meta>0 ? Math.round(d.pix/d.meta*100) : null; }, {g:"px", sub:1, pc:1});
  // SALÁRIO (Marcus, 23/11/2026): o que SAIU da Sorelly para cada sócio = pró-labore + Pix revendedoras recebido + contas pagas por conta da empresa (PJ) + contas pagas pela conta do Marco Antonio.
  // Contas pagas com conta pessoal NÃO somam (já são o uso do dinheiro que entrou). É o mesmo número da visão de uma pessoa.
  var normS = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
  var mapaS = {}; (ff.contasBanc||[]).forEach(function(b){ mapaS[normS(b.nome)] = b; });
  var achaS = function(nome){ var n = normS(nome); if(mapaS[n]) return mapaS[n]; var ps = String(nome).split(" — "); for(var i = 1; i<ps.length; i++){ var sx = normS(ps.slice(i).join(" — ")); if(mapaS[sx]) return mapaS[sx]; } return mapaS[normS(ps[ps.length-1])] || null; };
  var SOCIOS_SAL = ["marcus", "anamaria", "marco", "anabeatriz", "lucas"], cacheSal = {};
  var salDe = function(d){ if(d.casa || SOCIOS_SAL.indexOf(d.p.id)<0) return null; if(cacheSal[d.p.id]) return cacheSal[d.p.id];
    var pj = 0, ma = 0;
    todasParc.forEach(function(x){ var c = x.conta; if(c.categoria==="PIX_REVENDEDORA" || c.categoria==="PRO_LABORE") return;
      var don = donosDe(c) || (c.personaId==="familia" ? membros4 : null), meu = don ? don.indexOf(d.p.id)>=0 : c.personaId===d.p.id; if(!meu) return;
      var q = don ? 1/don.length : 1;
      (x.pagamentos||[]).forEach(function(g){ if(!g.conta || g.conta==="—") return; var b = achaS(g.conta); if(!b) return;
        if(b.tipo==="PJ") pj += g.valor*q; else if(b.personaId==="marco" && d.p.id!=="marco") ma += g.valor*q; }); });
    var pro = temPro(d) ? d.t.pro.recebido : 0, px = temPix(d) ? d.pix : 0;
    return cacheSal[d.p.id] = {pro:r2(pro), pix:r2(px), pj:r2(pj), ma:r2(ma), tot:r2(pro+px+pj+ma)}; };
  GRUPO("ap", MULTI ? "Salário no período" : "Salário no mês");
  L("apPro", "Pró-labore", function(d){ var v = salDe(d); return v ? v.pro : null; }, {g:"ap", sub:1});
  L("apPix", "Pix revendedoras", function(d){ var v = salDe(d); return v ? v.pix : null; }, {g:"ap", sub:1});
  L("apPj", "Pagas pela empresa", function(d){ var v = salDe(d); return v ? v.pj : null; }, {g:"ap", sub:1});
  L("apMa", "Pagas pelo Marco Antonio", function(d){ var v = salDe(d); return v && d.p.id!=="marco" ? v.ma : null; }, {g:"ap", sub:1});
  L("apT", "Salário", function(d){ var v = salDe(d); return v ? v.tot : null; }, {g:"ap", sub:1, tipo:"total"});
  GRUPO("transf", "Transferências entre sócios");
  L("trRec", "Recebidas", function(d){ return d.casa ? null : d.trRec; }, {g:"transf", sub:1, vz:1});
  L("trEnv", "Enviadas", function(d){ return d.casa ? null : d.trEnv; }, {g:"transf", sub:1, vz:1});
  GRUPO("cat", "Contas a pagar · por categoria");
  var totCat = function(k){ return D.reduce(function(a, d){ return a+(d.cats[k]||0); }, 0); };
  Object.keys(D.concat(Cc).reduce(function(o, d){ Object.keys(d.cats).forEach(function(k){ o[k] = 1; }); return o; }, {})).sort(function(a, b){ return totCat(b)-totCat(a); })
    .forEach(function(k){ L("cat-"+k, k, function(d){ return d.cats[k] || 0; }, {g:"cat", sub:1, vz:1, det:function(){ return detCat(k); }}); });
  // 4) linhas da tabela: Lucas (fora do total) · pessoas · compartilhado · casas (só consulta) · total da família (soma só pessoas e compartilhado)
  var TODAS_COL = [].concat(fora, D, Cc);
  var corpo = [];
  linhas.forEach(function(l){
    if(l.tipo==="grupo"){ corpo.push(l); return; }
    if(l.g && !FIXO[l.g] && !ab[l.g]) return;
    var o = {id:l.id, rot:l.rot, sub:l.sub, cor:l.cor, vz:l.vz, pc:l.pc, tipo:l.tipo, det:l.det, nivel:(l.g && !FIXO[l.g] ? 1 : 0)}, tot = 0, algum = false;
    TODAS_COL.forEach(function(d){ o["p_"+d.p.id] = l.f(d); });
    D.concat(Cc).forEach(function(d){ var v = o["p_"+d.p.id]; if(typeof v==="number"){ tot += v; algum = true; } });
    o.total = l.pc ? (function(){ var px = D.reduce(function(a, d){ return a+d.pix; }, 0), mt = D.reduce(function(a, d){ return a+d.meta; }, 0); return mt>0 ? Math.round(px/mt*100) : null; })() : (algum ? r2(tot) : null);
    corpo.push(o); });
  marcaFim(corpo);
  var celula = function(v, l){ if(l.tipo==="grupo") return ""; if(v===null || v===undefined) return e("span",{className:"opacity-50"}, "—"); var txt = l.pc ? v+"%" : (l.vz && v===0 ? "—" : BK(v)), cl = l.cor && v>0.005 ? "text-success" : ""; return e("span",{className:cl+(l.tipo==="total" ? " font-bold" : "")}, txt); };
  var cols = [{k:"rot", t:"Todas · "+rotPeriodo, render:function(v, l, aberta){
      if(l.tipo==="grupo"){ if(l.fixo) return e("span",{className:"block text-left font-bold"}, v); return e("span",{role:"button", tabIndex:0, className:"block cursor-pointer text-left font-bold", onClick:function(ev){ ev.stopPropagation(); alterna(l.g); }, onKeyDown:function(ev){ if(ev.key==="Enter") alterna(l.g); }}, (ab[l.g] ? "▾ " : "▸ ")+v); }
      return e("span",{className:"block text-left "+(l.tipo==="total" ? "font-bold" : "")+(l.sub ? " pl-4" : "")}, (l.det ? (aberta ? "▾ " : "▸ ") : "")+v); }}]
    .concat(TODAS_COL.map(function(d){ return {k:"p_"+d.p.id, t:(d.casa ? d.p.nome.replace("Casa/", "").replace("Anamaria", "Ana") : d.p.nome==="Marco Antonio" ? "Marco" : d.p.nome==="Ana Beatriz" ? "Ana" : d.p.nome), render:celula}; }), [{k:"total", t:"Total da família", render:function(v, l){ if(l.tipo==="grupo") return ""; return celula(v, l); }}]);   // mesma fonte e mesmo peso das colunas das pessoas (Marcus, Anamaria, Marco, Ana Beatriz)
  var nGrupo = function(g){ return D.filter(function(d){ return grupoDe(d.p)===g; }).length; };
  var cabAcima = [[{t:"", span:1}].concat(fora.length ? [{t:"Fora do total", span:fora.length}] : [], ORDEM.map(function(g){ return {t:g, span:nGrupo(g)}; }).filter(function(x){ return x.span>0 && x.t!=="Casas"; }).map(function(x){ return x.t==="Compartilhado" ? {t:x.t, span:x.span+Cc.length} : x; }), [{t:"", span:1}])];
  // VISÃO DE UMA PESSOA (Marcus, 23/11/2026): colunas Total · Pago · Falta. Tudo que abre (pró-labore, contas por categoria, prestadores) abre NA MESMA TABELA, com as mesmas 3 colunas e só nome, total, pago e falta.
  // O Pix fica num bloco à parte (é dinheiro que entra, não conta a pagar). Esta tela é só um resumo: o detalhe fica nas telas de lançar.
  var corpoPix = null, colsPix = null, corpoPago = null, colsPago = null, detPixC = null, detPixP = null, secoesPessoa = null;
  if(quem!=="todos"){
    var dq = dados.filter(function(d){ return d.p.id===quem; })[0];
    if(dq){
      var pp = dq.p, itsP = dq.itens, tP = dq.t;
      var R3 = function(id, rot, total, feito, falta, o){ return Object.assign({id:id, rot:rot, total:total, feito:feito, falta:falta}, o||{}); };
      var porVencP = function(a, b){ return (rankCarro(a)-rankCarro(b)) || (b.valor-a.valor); };   // em cada grupo: por tipo (Carros) e do maior para o menor   // em Carros: por tipo e, dentro do tipo, do maior para o menor
      var folhaP = function(x, nivel){ return R3("i-"+x.id, rotItem(x)+(x.comp && x.casa ? " · "+x.casa : ""), x.valor, x.pago, x.restante, {nivel:nivel}); };
      var linP = [];
      // GASTOS (o que custou): grupos que abrem; o pró-labore e o Pix NÃO entram aqui (são o dinheiro que entrou)
      var grupoGasto = function(x){ if(x.comp) return "Casas e família (a parte de "+pp.nome+")"; if(x.cat==="Carros") return "Carros"; var t = (x.desc||"")+" "+(x.obs||"");
        if(x.catChave==="RENEGOCIACAO" || x.catChave==="EMPRESTIMO_MARCO_ANTONIO" || /cart[aã]o de cr[eé]dito/i.test(x.desc||"")) return "Dívidas e cartão";
        if(x.catChave==="IMOVEL" || x.catChave==="CONDOMINIO" || x.catChave==="CONSORCIO" || x.catChave==="ALUGUEL") return "Imóvel";
        if(x.catChave==="DINHEIRO" || /pix ita[uú]/i.test(x.desc||"")) return "Retiradas e Pix para o Itaú";
        if(["COMPRA", "VIAGEM_EUA", "AIRBNB", "ALIMENTACAO", "SERVICO"].indexOf(x.catChave)>=0) return "Compras, viagem e dia a dia";
        return "Outros"; };
      var gp = {}; itsP.filter(function(x){ return !x.pro; }).forEach(function(x){ var k = grupoGasto(x), o = gp[k] = gp[k] || {valor:0, pago:0, restante:0, itens:[]}; o.valor = r2(o.valor+x.valor); o.pago = r2(o.pago+x.pago); o.restante = r2(o.restante+x.restante); o.itens.push(x); });
      Object.keys(gp).sort(function(a, b){ if(a==="Carros") return -1; if(b==="Carros") return 1; return gp[b].valor-gp[a].valor; }).forEach(function(k){
        linP.push(R3("g-"+k, k, gp[k].valor, gp[k].pago, gp[k].restante, {tg:"g:"+k})); if(ab["g:"+k]) gp[k].itens.sort(porVencP).forEach(function(x){ linP.push(folhaP(x, 1)); }); });
      if(pp.mostrarContas) linP.push(R3("p-total", MULTI ? "Gasto do período" : "Gasto do mês", tP.contas.total, tP.contas.pago, tP.contas.restante, {tipo:"total"}));
      var prestP = prestLista.filter(function(x){ return x.respId===pp.id && (x.noPeriodo>0.005 || x.novas>0.005); });   // quem recebeu Pix ou entrou devendo no período
      // PRESTADORES DE SERVIÇOS EM BLOCO PRÓPRIO (Marcus, 23/11/2026): quanto cada um entrou devendo no período e quanto recebeu
      var corpoPr = prestP.slice().sort(function(a, b){ return b.noPeriodo-a.noPeriodo; }).map(function(x){ return R3("pr-"+x.id, x.prest+(x.serv && x.serv!=="—" ? " · "+x.serv : ""), x.noPeriodo, Math.max(0, x.saldo), null); });
      if(corpoPr.length>0) corpoPr.push(R3("pr-total", "Total dos prestadores", r2(prestP.reduce(function(a, x){ return a+x.noPeriodo; }, 0)), r2(prestP.reduce(function(a, x){ return a+Math.max(0, x.saldo); }, 0)), null, {tipo:"total"}));
      if(dq.trRec>0 || dq.trEnv>0){ linP.push(R3("p-trrec", "Transferências recebidas", null, dq.trRec, null)); linP.push(R3("p-trenv", "Transferências enviadas", null, dq.trEnv, null)); }
      corpo = marcaFim(linP);
      var rotP = function(v, l){ var pad = (l.nivel||0)*16;
        if(l.tg) return e("span",{role:"button", tabIndex:0, className:"block cursor-pointer text-left "+(l.nivel ? "" : "font-bold"), style:{paddingLeft:pad}, onClick:function(ev){ ev.stopPropagation(); alterna(l.tg); }, onKeyDown:function(ev){ if(ev.key==="Enter") alterna(l.tg); }}, (ab[l.tg] ? "▾ " : "▸ ")+v);
        return e("span",{className:"block text-left "+(l.tipo==="total" ? "font-bold" : ""), style:{paddingLeft:pad}}, v); };
      var celP = function(v, l){ if(v===null || v===undefined) return e("span",{className:"opacity-50"}, "—"); return e("span",{className:(l.tipo==="total" ? "font-bold" : "")}, BK(v)); };
      var celFeito = function(v, l){ if(v===null || v===undefined) return e("span",{className:"opacity-50"}, "—"); return e("span",{className:(v>0.005 ? "text-success " : "")+(l.tipo==="total" ? "font-bold" : "")}, BK(v)); };
      cols = [{k:"rot", t:pp.nome+" · "+rotPeriodo, render:rotP}, {k:"total", t:"Total", render:celP}, {k:"feito", t:"Pago", render:celFeito}, {k:"falta", t:"Falta", render:celP}];
      cabAcima = null;
      // QUEM PAGOU (Marcus, 23/11/2026): conta pessoal (PF) = o uso do dinheiro que entrou; fora das contas pessoais (PJ/empresa) = custo direto da Sorelly
      var normT = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim(); };
      var mapaB = {}; (ff.contasBanc||[]).forEach(function(b){ mapaB[normT(b.nome)] = b; });
      var achaB = function(nome){ var n = normT(nome); if(mapaB[n]) return mapaB[n]; var ps = String(nome).split(" — "); for(var i = 1; i<ps.length; i++){ var sx = normT(ps.slice(i).join(" — ")); if(mapaB[sx]) return mapaB[sx]; } return mapaB[normT(ps[ps.length-1])] || null; };
      var qpPF = {}, qpPJ = {}, qpMA = {}, qpSem = 0, lstPJ = [], lstMA = [];   // lstPJ e lstMA: cada pagamento, para abrir a lista ao clicar   // conta pessoal, conta da empresa e conta do Marco Antonio (o pai paga e sobe para o Marcus)
      itsP.filter(function(x){ return !x.pro; }).forEach(function(x){ (x.pagamentos||[]).forEach(function(g){ if(!g.conta || g.conta==="—"){ qpSem = r2(qpSem+g.valor); return; } var nm = String(g.conta).replace(/^Conta\s+/i, "").trim(), b = achaB(g.conta), alvo = (b && b.tipo==="PJ") ? qpPJ : (b && b.personaId==="marco" && pp.id!=="marco") ? qpMA : qpPF; alvo[nm] = r2((alvo[nm]||0)+g.valor); var lst = alvo===qpPJ ? lstPJ : alvo===qpMA ? lstMA : null; if(lst) lst.push({desc:x.desc+(x.comp && x.casa ? " · "+x.casa : ""), conta:nm, valor:g.valor, em:g.em||""}); }); });
      var somaM = function(o){ return r2(Object.keys(o).reduce(function(a, k){ return a+o[k]; }, 0)); }, somaPF = somaM(qpPF), somaPJ = somaM(qpPJ), somaMA = somaM(qpMA), totPagos = r2(somaPF+somaPJ+somaMA+qpSem);
      // DINHEIRO: pró-labore + Pix na conta pessoal + Pix direto para prestadores + contas pagas fora das contas pessoais
      var vPro = pp.mostrarProlabore ? tP.pro.recebido : 0, vPixP = pp.mostrarPix ? dq.direto : 0, vPixPr = pp.mostrarPix ? dq.prestMes : 0, custoDin = r2(vPro+vPixP+vPixPr+somaPJ+somaMA);
      var obsC = function(v){ return e("span",{className:"block text-left"}, v||""); };
      var corpoDin = [];
      if(pp.mostrarProlabore) corpoDin.push(R3("d-pro", "Pró-labore", vPro, null, null, {obs:vPro>0.005 ? "Recebido" : (tP.pro.total>0.005 ? "A receber · "+BK(tP.pro.total) : "Sem pró-labore no período")}));
      if(pp.mostrarPix){ corpoDin.push(R3("d-pix", "Pix revendedoras", r2(vPixP+vPixPr), null, null, {obs:"Recebido", tg:"dinpix"})); if(ab.dinpix){ corpoDin.push(R3("d-pixc", "Conta pessoal", vPixP, null, null, {obs:"Recebido", nivel:1})); corpoDin.push(R3("d-pixp", "Prestadores de Serviços", vPixPr, null, null, {obs:"Recebido e pago", nivel:1})); } }
      var itensDin = function(lst, pref){ return lst.slice().sort(function(a, b){ return b.valor-a.valor; }).map(function(y, i){ return R3(pref+i, y.desc, y.valor, null, null, {nivel:1, obs:(y.em ? diaBr(y.em)+" · " : "")+y.conta}); }); };
      if(somaPJ>0.005){ corpoDin.push(R3("d-pj", "Contas pagas pela empresa", somaPJ, null, null, {obs:"Pago", tg:"dinpj"})); if(ab.dinpj) corpoDin = corpoDin.concat(itensDin(lstPJ, "dpj-")); }
      if(pp.id!=="marco" && somaMA>0.005){ corpoDin.push(R3("d-ma", "Contas pagas pela conta do Marco Antonio", somaMA, null, null, {obs:"Pago", tg:"dinma"})); if(ab.dinma) corpoDin = corpoDin.concat(itensDin(lstMA, "dma-")); }
      corpoDin.push(R3("d-custo", "Salário "+pp.nome, custoDin, null, null, {tipo:"total", obs:""}));
      if(qpSem>0.005) corpoDin.push(R3("d-sem", "Pagamentos sem conta informada", qpSem, null, null, {tipo:"alerta", obs:"A confirmar · se for da empresa, o salário sobe para "+BK(r2(custoDin+qpSem))}));
      var colsDin = [{k:"rot", t:pp.nome+" · "+rotPeriodo, render:rotP}, {k:"total", t:"Valor", render:celP}, {k:"obs", t:"Tipo", render:function(v){ return obsC(v); }}];
      // QUEM PAGOU
      var corpoQP = [], pctQ = function(v){ return totPagos>0 ? Math.round(v/totPagos*100)+"%" : "—"; };
      var filhosQ = function(o, pref){ return Object.keys(o).sort(function(a, b){ return o[b]-o[a]; }).map(function(k){ return R3(pref+k, k, o[k], null, null, {nivel:1, pct:pctQ(o[k])}); }); };
      if(somaPF>0.005){ corpoQP.push(R3("q-pf", "Conta pessoal (uso do dinheiro que entrou)", somaPF, null, null, {tg:"qp:pf", pct:pctQ(somaPF)})); if(ab["qp:pf"]) corpoQP = corpoQP.concat(filhosQ(qpPF, "qf-")); }
      if(somaPJ>0.005){ corpoQP.push(R3("q-pj", "Fora das contas pessoais (conta da empresa)", somaPJ, null, null, {tg:"qp:pj", pct:pctQ(somaPJ)})); if(ab["qp:pj"]) corpoQP = corpoQP.concat(filhosQ(qpPJ, "qj-")); }
      if(somaMA>0.005){ corpoQP.push(R3("q-ma", "Conta do Marco Antonio (sobe para "+pp.nome+")", somaMA, null, null, {tg:"qp:ma", pct:pctQ(somaMA)})); if(ab["qp:ma"]) corpoQP = corpoQP.concat(filhosQ(qpMA, "qm-")); }
      if(qpSem>0.005) corpoQP.push(R3("q-sem", "Sem conta informada", qpSem, null, null, {tipo:"alerta", pct:pctQ(qpSem)}));
      var colsQP = [{k:"rot", t:pp.nome+" · "+rotPeriodo, render:rotP}, {k:"total", t:"Valor", render:celP}, {k:"pct", t:"%", render:function(v){ return e("span",null, v||""); }}];
      // CONTAS DIVIDIDAS (Marcus, 23/11/2026): as contas compartilhadas, com quem divide, o total da conta e a parte da pessoa
      var nomeCurto = function(id){ return pessoaNome(ff, id).replace("Marco Antonio", "Marco").replace("Ana Beatriz", "Ana"); };
      var dvCasas = {}, dvTot = {total:0, parte:0, pago:0, falta:0};
      todasParc.forEach(function(x){ var c = x.conta; if(c.categoria==="PIX_REVENDEDORA" || c.categoria==="PRO_LABORE") return;
        var don = donosDe(c) || (c.personaId==="familia" ? membros4 : null); if(!don || don.indexOf(pp.id)<0) return;
        var q = 1/don.length, nome = pessoaNome(ff, c.personaId), g = dvCasas[nome] = dvCasas[nome] || {total:0, parte:0, pago:0, falta:0, dividem:don.map(nomeCurto).join(", "), itens:[]};
        var it = {desc:c.descricao, total:x.valor, parte:r2(x.valor*q), pago:r2(x.pago*q), falta:r2(x.restante*q), dividem:don.map(nomeCurto).join(", ")};
        g.itens.push(it); ["total", "parte", "pago", "falta"].forEach(function(k){ g[k] = r2(g[k]+it[k]); dvTot[k] = r2(dvTot[k]+it[k]); }); });
      var corpoDv = [];
      Object.keys(dvCasas).sort(function(a, b){ return dvCasas[b].parte-dvCasas[a].parte; }).forEach(function(k){ var g = dvCasas[k];
        corpoDv.push({id:"dv-"+k, rot:k, obs:g.dividem, total:g.total, parte:g.parte, pago:g.pago, falta:g.falta, tg:"dv:"+k});
        if(ab["dv:"+k]) g.itens.sort(function(a, b){ return b.parte-a.parte; }).forEach(function(it, i){ corpoDv.push({id:"dv-"+k+"-"+i, rot:it.desc, obs:it.dividem, total:it.total, parte:it.parte, pago:it.pago, falta:it.falta, nivel:1}); }); });
      if(corpoDv.length>0) corpoDv.push({id:"dv-total", rot:"Total das contas divididas", obs:"", total:dvTot.total, parte:dvTot.parte, pago:dvTot.pago, falta:dvTot.falta, tipo:"total"});
      var colsDv = [{k:"rot", t:"Contas divididas · "+rotPeriodo, render:rotP}, {k:"obs", t:"Dividida entre", render:function(v){ return obsC(v); }}, {k:"total", t:"Total da conta", render:celP}, {k:"parte", t:"Parte de "+pp.nome, render:celP}, {k:"pago", t:"Paga", render:celP}, {k:"falta", t:"Falta", render:celP}];
      // PIX REVENDEDORAS, UM A UM (Marcus, 23/11/2026): data, nome da revendedora, para onde foi e valor; do mais novo para o mais antigo
      var cDoPix = function(id){ return (ff.contasBanc||[]).filter(function(c){ return c.id===id; })[0]; };
      var nPrest = function(id){ var q = ff.prest.filter(function(k){ return k.id===id; })[0]; return q ? nomePropio(q.nome) : "—"; };
      var corpoPxL = pp.mostrarPix ? ff.pix.filter(function(x){ return x.personaId===pp.id && yms.indexOf(String(x.data).slice(0,7))>=0 && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT" && !pixCasa(ff, x); }).map(function(x, i){ var c = cDoPix(x.contaId);
          return {id:"pl"+i, data:x.data, rev:x.origem||"—", destino:(c && c.prestadorId) ? "Prestador · "+nPrest(c.prestadorId) : (c && String(c.nome).indexOf("Pix rev.")!==0 ? String(c.nome).replace(/^Conta\s+/i, "") : "Sem conta informada"), valor:x.valor}; })
        .concat(ff.repasses.filter(function(x){ return x.origemPixPersonaId===pp.id && !x.origemPixLancId && yms.indexOf(String(x.data).slice(0,7))>=0; }).map(function(x, i){ return {id:"pr"+i, data:x.data, rev:"—", destino:"Prestador · "+nPrest(x.prestId), valor:x.valor}; }))
        .sort(function(x, y){ return String(y.data).localeCompare(String(x.data)); }) : [];
      var colsPxL = [{k:"data", t:"Data", render:function(v){ return v ? diaBr(v) : ""; }}, {k:"rev", t:"Revendedora"}, {k:"destino", t:"Conta"}, {k:"valor", t:"Valor", render:function(v){ return BK(v); }}];
      var totPxL = r2(corpoPxL.reduce(function(a, x){ return a+x.valor; }, 0));
      // DESTINO DO DINHEIRO (Marcus, 23/11/2026): do Salário, quanto foi para cada conta final (Nubank, Caixa, prestador...), mais o pró-labore e o que a empresa e o Marco pagaram direto
      var dstCp = {}, dstPr = {};
      corpoPxL.forEach(function(x){ var d = String(x.destino||""); if(d.indexOf("Prestador · ")===0){ var n = d.slice(11); dstPr[n] = r2((dstPr[n]||0)+x.valor); } else { var m = d.replace(/^Marcus\s*[—-]\s*/, ""); dstCp[m] = r2((dstCp[m]||0)+x.valor); } });
      var sDst = function(o){ return r2(Object.keys(o).reduce(function(a, k){ return a+o[k]; }, 0)); }, pDst = function(v){ return custoDin>0 ? Math.round(v/custoDin*100)+"%" : "—"; };
      var filhosD = function(o, pref){ return Object.keys(o).sort(function(a, b){ return o[b]-o[a]; }).map(function(k){ return R3(pref+k, k, o[k], null, null, {nivel:1, pct:pDst(o[k])}); }); };
      var filhosL = function(o, lst, pref){ var out = []; Object.keys(o).sort(function(a, b){ return o[b]-o[a]; }).forEach(function(k){ var tg = "d2l:"+pref+k; out.push(R3(pref+k, k, o[k], null, null, {nivel:1, tg:tg, pct:pDst(o[k])}));
        if(ab[tg]) lst.filter(function(y){ return y.conta===k; }).sort(function(a, b){ return b.valor-a.valor; }).forEach(function(y, i){ out.push(R3(pref+k+"-"+i, (y.em ? diaBr(y.em)+" · " : "")+y.desc, y.valor, null, null, {nivel:2, pct:""})); }); }); return out; };
      corpoQP = [];
      if(pp.mostrarProlabore && vPro>0.005) corpoQP.push(R3("d2-pro", "Pró-labore", vPro, null, null, {pct:pDst(vPro)}));
      if(sDst(dstCp)>0.005){ corpoQP.push(R3("d2-cp", "Pix · contas do "+pp.nome, sDst(dstCp), null, null, {tg:"d2:cp", pct:pDst(sDst(dstCp))})); if(ab["d2:cp"]) corpoQP = corpoQP.concat(filhosD(dstCp, "d2c-")); }
      if(sDst(dstPr)>0.005){ corpoQP.push(R3("d2-pr", "Pix · prestadores de serviços", sDst(dstPr), null, null, {tg:"d2:pr", pct:pDst(sDst(dstPr))})); if(ab["d2:pr"]) corpoQP = corpoQP.concat(filhosD(dstPr, "d2p-")); }
      if(somaPJ>0.005){ corpoQP.push(R3("d2-pj", "Pago pela empresa", somaPJ, null, null, {tg:"d2:pj", pct:pDst(somaPJ)})); if(ab["d2:pj"]) corpoQP = corpoQP.concat(filhosL(qpPJ, lstPJ, "d2j-")); }
      if(somaMA>0.005){ corpoQP.push(R3("d2-ma", "Pago pela conta do Marco Antonio", somaMA, null, null, {tg:"d2:ma", pct:pDst(somaMA)})); if(ab["d2:ma"]) corpoQP = corpoQP.concat(filhosL(qpMA, lstMA, "d2m-")); }
      if(corpoQP.length>0) corpoQP.push(R3("d2-tot", "Total · Salário "+pp.nome, custoDin, null, null, {tipo:"total", pct:"100%"}));
      var clsT = CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]";
      var linhaFx = function(l){ return tinta(l)+" "+(l.tipo==="alerta" ? "ffa-alerta !cursor-default" : l.tg ? "!cursor-pointer" : l.tipo==="total" ? "!bg-[#1a2540] !cursor-default" : "!cursor-default"); };
      var tab3 = function(cl, ln, vz){ return e(TabelaPlanilha,{fina:true, cols:cl, linhas:ln, linhaCls:linhaFx, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, vazio:vz||"Nada neste período."}); };
      secoesPessoa = e("div",{className:clsT, style:{"--lh":"18px"}},
        e("div",{className:"ff-cab"}, "Dinheiro recebido da Sorelly"), tab3(colsDin, corpoDin), e("div",{className:"ff-sep"}),
        e("div",{className:"ff-duo"},
          e("div",null, e("div",{className:"ff-cab"}, "Gastos do período"), tab3(cols, marcaFim(linP)),
            corpoPr.length>0 && e("div",{className:"ff-sep"}), corpoPr.length>0 && e("div",{className:"ff-cab"}, "Prestadores de Serviços"), corpoPr.length>0 && tab3([{k:"rot", t:pp.nome+" · "+rotPeriodo, render:rotP}, {k:"total", t:"Pago", render:celP}, {k:"feito", t:"Falta", render:celP}], corpoPr),
            corpoQP.length>0 && e("div",{className:"ff-sep"}), corpoQP.length>0 && e("div",{className:"ff-cab"}, "Destino do dinheiro"), corpoQP.length>0 && tab3(colsQP, corpoQP)),
          pp.mostrarPix && e("div",null, e("div",{className:"ff-cab"}, "Pix revendedoras · "+corpoPxL.length+" Pix"),
            tab3([{k:"meta", t:"Meta do Pix", render:celP}, {k:"rec", t:"Recebido", render:celP}, {k:"falta", t:"Falta", render:celP}, {k:"pct", t:"% da meta", render:function(v){ return e("span",null, v===null ? "—" : v+"%"); }}], [{id:"mt", meta:dq.meta, rec:dq.pix, falta:Math.max(0, r2(dq.meta-dq.pix)), pct:dq.meta>0 ? Math.round(dq.pix/dq.meta*100) : null}]),
            e("div",{className:"ff-sep"}),
            e("div",{className:"ff-pixlist"}, e(TabelaPlanilha,{fina:true, cols:colsPxL, linhas:corpoPxL, chave:"id", grade:true, semMao:true, semFiltro:true, centro:true, semContagem:true, semLimpar:true, barraFina:true, vazio:"Nenhum Pix neste período.", alturaMax:(altPix ? altPix+"px" : "calc(100vh - 19rem)")})),
            e("div",{className:"ff-cab", style:{display:"flex", justifyContent:"space-between", textTransform:"none"}}, e("span",null, "Total"), e("span",null, BK(totPxL))))));
      if(pp.mostrarPix && (dq.pix>0 || dq.meta>0)){
        // PIX REVENDEDORAS (Marcus, 23/11/2026): as duas linhas sempre à vista e o TOTAL embaixo, grudado no fim do bloco, na mesma altura do total de "Como foi pago"
        // CADA PIX QUE ENTROU (Marcus, 23/11/2026): clicar em Conta pessoal ou em Prestadores de Serviços abre uma TABELA embaixo do bloco (revendedora, data, conta e valor), da data mais nova para a mais antiga
        var pxPeriodo = ff.pix.filter(function(x){ return x.personaId===pp.id && yms.indexOf(String(x.data).slice(0,7))>=0 && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT" && !pixCasa(ff, x); });
        var contaDoPix = function(id){ return (ff.contasBanc||[]).filter(function(c){ return c.id===id; })[0]; };
        var nomeDoPrest = function(id){ var q = ff.prest.filter(function(k){ return k.id===id; })[0]; return q ? nomePropio(q.nome) : "—"; };
        var maisNovo = function(x, y){ return String(y.data).localeCompare(String(x.data)); };
        var nomeConta = function(c){ return c ? String(c.nome).replace(/^Conta\s+/i, "") : "Sem conta informada"; };
        detPixC = pxPeriodo.filter(function(x){ var c = contaDoPix(x.contaId); return !(c && c.prestadorId); }).map(function(x, i){ return {id:"dc"+i, data:x.data, rev:x.origem||"—", conta:nomeConta(contaDoPix(x.contaId)), valor:x.valor}; }).sort(maisNovo);
        detPixP = pxPeriodo.filter(function(x){ var c = contaDoPix(x.contaId); return c && c.prestadorId; }).map(function(x, i){ var c = contaDoPix(x.contaId); return {id:"dp"+i, data:x.data, rev:x.origem||"—", prest:nomeDoPrest(c.prestadorId), conta:nomeConta(c), valor:x.valor}; })
          .concat(ff.repasses.filter(function(x){ return x.origemPixPersonaId===pp.id && !x.origemPixLancId && yms.indexOf(String(x.data).slice(0,7))>=0; }).map(function(x, i){ return {id:"dr"+i, data:x.data, rev:"—", prest:nomeDoPrest(x.prestId), conta:x.origem||"—", valor:x.valor}; })).sort(maisNovo);
        corpoPix = [R3("x-direto", "Conta pessoal", null, dq.direto, null, {tg:"pixc"}), R3("x-prest", "Prestadores de Serviços", null, dq.prestMes, null, {tg:"pixp"}),
          R3("x-total", "Total", dq.meta>0 ? dq.meta : null, dq.pix, dq.meta>0 ? r2(Math.max(0, dq.meta-dq.pix)) : null, {tipo:"total"})];
        var vaz = function(fn){ return function(v, l){ return l.vazia ? "" : fn(v, l); }; };
        colsPix = [{k:"rot", t:pp.nome+" · Pix", render:vaz(rotP)}, {k:"total", t:"Meta", render:vaz(celP)}, {k:"feito", t:"Recebido", render:vaz(celFeito)}, {k:"falta", t:"Falta", render:vaz(celP)}];
      }
      // COMO FOI PAGO (Marcus, 23/11/2026): as contas pagas da pessoa (o mesmo "Pago" de Contas a pagar), uma linha por conta pagadora
      if(pp.mostrarContas){
        var porContaP = {}, totContaP = 0;
        itsP.filter(function(x){ return !x.pro; }).forEach(function(x){ (x.pagamentos||[]).forEach(function(g){ var k = String(g.conta||"").replace(/^Conta\s+/i, "").trim(); if(!k || k==="—") k = "Sem conta informada"; porContaP[k] = r2((porContaP[k]||0)+g.valor); totContaP = r2(totContaP+g.valor); }); });
        var chavesP = Object.keys(porContaP).sort(function(a, b){ if(a==="Sem conta informada") return 1; if(b==="Sem conta informada") return -1; return porContaP[b]-porContaP[a]; });
        if(chavesP.length>0){
          corpoPago = chavesP.map(function(k){ return R3("c-"+k, k, null, porContaP[k], null, {pct:totContaP>0 ? Math.round(porContaP[k]/totContaP*100)+"%" : "—"}); });
          corpoPago.push(R3("c-total", "Total pago em contas", null, totContaP, null, {tipo:"total", pct:"100%"}));
          colsPago = [{k:"rot", t:pp.nome+" · Como foi pago", render:rotP}, {k:"feito", t:"Pago", render:celFeito}, {k:"pct", t:"% do pago", render:function(v){ return e("span",null, v); }}];
        }
      }
      if(corpoPix && corpoPago && corpoPago.length>corpoPix.length){ var tt = corpoPix.pop(); for(var iv = corpoPix.length; iv<corpoPago.length-1; iv++) corpoPix.push(R3("x-v"+iv, "", null, null, null, {vazia:true})); corpoPix.push(tt); }
    }
  }
  var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c] [&_tbody_tr[aria-expanded=true]]:!bg-[#26385c] [&_tbody_tr:not([aria-expanded])>td[colspan]]:!bg-[#1a2540] [&_td[colspan]]:!p-0";   // fundo azul-marinho do Prestadores
  // LINHA AZUL EMBAIXO DO TÍTULO (Marcus, 23/11/2026): só dois filtros, Mês e Pessoa
  var barra = e(BarraTabela,null,
    e(CelulaBarra,{rotulo:"Mês"}, e(MenuMulti,{cls:"ff-mes w-36", opcoes:mesesOp.map(function(k){ return [k, nomeMes(k)]; }), valor:sel, onChange:function(v){ if(v.length) setSel(v.slice().sort()); }, rotFn:rotBotaoMes, rodape:{rotulo:"Todos os meses", onClick:function(){ setSel(mesesOp.slice()); }}})),
    quem==="todos" && e(CelulaBarra,{rotulo:"Casas"}, e(CampoMini,{valor:junto ? "junto" : "separado", aoMudar:function(v){ setJunto(v==="junto"); }, rotulo:"Casas", ops:[["separado", "Separado"], ["junto", "Junto"]]})),
    e(CelulaBarra,{rotulo:"Pessoa"}, e(CampoMini,{valor:quem, aoMudar:setQuem, rotulo:"Pessoa", ops:[["todos", "Todas"]].concat(Dtodos.map(function(d){ return [d.p.id, d.p.nome]; }), foraTodos.map(function(d){ return [d.p.id, d.p.nome+" (fora do total)"]; }))})));
  // VISUAL FINO IGUAL À CONTAS A PAGAR: página colada nas bordas, letra de 10 px e linhas de 18 px
  return e(Guarda,{c:c}, e(Pagina,{className:PAGINA_CHEIA}, e("style",null, CSS_ABERTO),
    D.length===0 ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhuma pessoa ativa. Crie em Configurações.") : (quem!=="todos" && corpo.length===0) ? null :
      e(BlocoPainel,{titulo:"Resumo familiar", compacto:true, cls:FUNDO}, barra,
        (quem!=="todos" && secoesPessoa) ? secoesPessoa : e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]", style:{"--lh":"20px"}},   // padrao-ok: letra de 11 px e linhas de 20 px (um pouco maior que o fino de 10 px, pedido do Marcus em 23/11/2026)
          e(TabelaPlanilha,{fina:true, cols:cols, linhas:corpo, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, alturaMax:quem==="todos" ? "calc(100vh - 6.6rem)" : undefined, vazio:"Nada neste período.", cabAcima:cabAcima,
            detalhe:quem==="todos" ? function(l){ return l.det ? l.det() : null; } : undefined,
            linhaCls:function(l){ return tinta(l)+" "+(l.tg ? "!cursor-pointer" : l.tipo==="secao" ? "!bg-[#2d5190] !cursor-default" : l.tipo==="grupo" ? "!bg-[#1f3358] !cursor-pointer" : l.tipo==="total" ? "!bg-[#1a2540] !cursor-default" : l.tipo==="solo" ? "!cursor-default" : l.det ? "" : "!cursor-default"); }}))),
    false && (corpoPix || corpoPago) && e("div",{className:"ff-par"+(corpoPix && corpoPago ? " ff-par2" : "")},
    corpoPix && e(BlocoPainel,{titulo:"Pix revendedoras", compacto:true, cls:FUNDO}, e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]", style:{"--lh":"20px"}},
      e(TabelaPlanilha,{fina:true, cols:colsPix, linhas:corpoPix, linhaCls:tinta, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, vazio:"Nada."}))),
    corpoPago && e(BlocoPainel,{titulo:"Como foi pago", compacto:true, cls:FUNDO}, e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]", style:{"--lh":"20px"}},
      e(TabelaPlanilha,{fina:true, cols:colsPago, linhas:corpoPago, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, semFiltro:true, vazio:"Nada."})))),
    detPixC && ab.pixc && e(BlocoPainel,{titulo:"Conta pessoal · Pix recebidos", compacto:true, cls:FUNDO, dir:BK(r2(detPixC.reduce(function(a, x){ return a+x.valor; }, 0)))}, e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]", style:{"--lh":"20px"}},
      e(TabelaPlanilha,{fina:true, cols:[{k:"data", t:"Data", render:function(v){ return diaBr(v); }}, {k:"rev", t:"Revendedora"}, {k:"conta", t:"Conta"}, {k:"valor", t:"Valor", render:function(v){ return BK(v); }}], linhas:detPixC, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, vazio:"Nenhum Pix neste período.", alturaMax:"26rem"}))),
    detPixP && ab.pixp && e(BlocoPainel,{titulo:"Prestadores de Serviços · Pix repassados", compacto:true, cls:FUNDO, dir:BK(r2(detPixP.reduce(function(a, x){ return a+x.valor; }, 0)))}, e("div",{className:CLS_FINA_ESPACO+" [&_table_td]:!text-[11px] [&_table_th]:!text-[11px] [&_table_th]:!h-[20px]", style:{"--lh":"20px"}},
      e(TabelaPlanilha,{fina:true, cols:[{k:"data", t:"Data", render:function(v){ return diaBr(v); }}, {k:"rev", t:"Revendedora"}, {k:"prest", t:"Prestador"}, {k:"conta", t:"Conta"}, {k:"valor", t:"Valor", render:function(v){ return BK(v); }}], linhas:detPixP, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, vazio:"Nenhum Pix neste período.", alturaMax:"26rem"})))));
}

// ───────────────── Alertas ─────────────────
function ModalPagar(p){
  var c = p.c, x = p.x, st = useState({paraQuem:paraQuemDe(x.conta), valor:fmtN(x.restante), em:hojeIso(), forma:(FORMAS.indexOf(x.conta.forma)>=0 ? x.conta.forma : "PIX"), contaTxt:contaLabel(c.ff, x.conta.contaBancId), obs:"", dividir:false, linhas:[{valor:"", forma:"PIX", contaTxt:""}, {valor:"", forma:"Dinheiro", contaTxt:""}]}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var somaL = r2(f.linhas.reduce(function(t, l){ return t+num(l.valor); }, 0)), falta = r2(x.restante-somaL);
  var setL = function(i, o){ set({linhas:f.linhas.map(function(l, j){ return j===i ? Object.assign({}, l, o) : l; })}); };
  var opContas = [["", "Não definida"]].concat(contasPagadoras(c.ff).map(function(b){ var n = contaLabel(c.ff, b.id); return [n, n]; }));
  var pagar = function(){ var atual = paraQuemDe(x.conta); if(f.paraQuem && f.paraQuem!==atual) acao(c, "conta_set", {id:x.conta.id, patch:{personaId:f.paraQuem}});
    if(f.dividir) acao(c, "parc_baixa_multipla", {id:x.conta.id, ym:x.ym, em:f.em, linhas:f.linhas.map(function(l){ return {valor:num(l.valor), forma:l.forma, contaTxt:l.contaTxt}; })});
    else acao(c, "parc_baixa", {id:x.conta.id, ym:x.ym, valor:num(f.valor), em:f.em, forma:f.forma, contaTxt:f.contaTxt, obs:f.obs});
    if(f.obs.trim()) acao(c, "conta_nota", {id:x.conta.id, txt:f.obs}); p.fechar(); };
  // Ficha em grade de 4 colunas (rótulo | campo | rótulo | campo), com linha entre todas as células. Conta pagadora e Observação ocupam a linha toda para o nome longo da conta caber inteiro (Marcus, 22/11/2026).
  var L = function(rot, extra){ return e("b",{className:"flex min-h-[32px] items-center border-b border-r border-white/15 bg-[#223f74] px-2.5 text-left text-[11px] font-semibold "+(extra || "")}, rot); };
  var F = function(filho, span){ return e("div",{className:"flex min-h-[32px] items-center border-b border-white/15 px-2.5 py-1", style:span ? {gridColumn:"span "+span} : undefined}, e("div",{className:"w-full"}, filho)); };
  var peso = x.pago>0, nm = useState(false), mais = nm[0], setMais = nm[1];
  var vPag = f.dividir ? somaL : num(f.valor);
  // OBSERVAÇÕES DA CONTA dentro da janela (Marcus, 22/11/2026): a antiga (obs) em cima, depois as anotadas, da mais nova para a mais velha; campo para anotar outra
  var contaV = c.ff.contas.find(function(k){ return k.id===x.conta.id; }) || x.conta;
  var notasV = (contaV.notas || []).slice().reverse();
  var campoValor = e(TxtJ,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }});
  var campoData = e(TxtJ,{value:f.em, type:"date", label:"Data", onChange:function(v){ set({em:v}); }});
  var campoForma = e(SelJ,{value:f.forma, label:"Forma", opcoes:FORMAS.map(function(k){ return [k, k]; }), onChange:function(v){ set({forma:v}); }});
  var campoConta = e(SelJ,{value:f.contaTxt, label:"Conta pagadora", opcoes:opContas, onChange:function(v){ set({contaTxt:v}); }});
  var campoPara = e(SelJ,{value:f.paraQuem, label:"Para quem entra", opcoes:opcoesPessoa(c.ff).filter(function(o){ return o[0]!=="__viagem"; }), onChange:function(v){ set({paraQuem:v}); }});
  var cels = [];
  if(!f.dividir) cels.push(L("Valor pago"), F(campoValor), L("Data", "border-l"), F(campoData), L("Forma"), F(campoForma), L("Para quem entra", "border-l"), F(campoPara), L("Conta pagadora"), F(campoConta, 3));
  else {
    cels.push(L("Data"), F(campoData), L("Para quem entra", "border-l"), F(campoPara));
    f.linhas.forEach(function(l, i){ cels.push(L((i+1)+"ª forma"), F(e("div",{className:"grid grid-cols-[7rem_9rem_1fr] gap-1.5"}, e(TxtJ,{value:l.valor, ph:"Valor", label:"Valor "+(i+1), onChange:function(v){ setL(i, {valor:v.replace(/[^\d,.]/g,"")}); }}), e(SelJ,{value:l.forma, label:"Forma", opcoes:FORMAS.map(function(k){ return [k, k]; }), onChange:function(v){ setL(i, {forma:v}); }}), e(SelJ,{value:l.contaTxt, label:"Conta pagadora", opcoes:opContas, onChange:function(v){ setL(i, {contaTxt:v}); }})), 3)); });
    cels.push(L("Soma"), F(e("div",{className:"flex items-center justify-between text-[11px] font-semibold"}, e("button",{type:"button", className:"underline", onClick:function(){ set({linhas:f.linhas.concat([{valor:"", forma:"PIX", contaTxt:""}])}); }}, "+ Outra forma"), e("span",{className:Math.abs(falta)<0.005 ? "text-success" : "text-warning"}, Math.abs(falta)<0.005 ? "✓ Soma certa" : "Falta distribuir "+BK(falta))), 3));
  }
  // MESMO DESENHO da janela Lançar conta (formato 7C, Marcus, 22/11/2026: "o lançar e o pagar não estão iguais"): à esquerda 1 A conta e 2 Como paga e o pagamento; à direita o recibo O que vai acontecer.
  var Fixo = function(txt){ return e("div",{style:ALTO_J, className:CAMPO_J+" flex items-center justify-center"}, txt || "—"); };
  var nomePara = (opcoesPessoa(c.ff).filter(function(o){ return o[0]===f.paraQuem; })[0] || [])[1] || "";
  var depoisP = !(vPag>0) ? "Digite o valor" : vPag>=x.restante-0.005 ? "PAGA" : "PARCIAL · falta "+BK(r2(x.restante-vPag)), corP = !(vPag>0) ? "" : vPag>=x.restante-0.005 ? "text-success" : "text-warning";
  var Lr = function(rot, val, extra){ return e("div",{className:"flex justify-between gap-2 border-b border-white/15 py-0.5 text-[11px] "+(extra || "")}, e("span",null, rot), e("b",{className:"text-right"}, val)); };
  return e(JanelaJ,{t:"Pagar conta", larga:"g", fechar:p.fechar},
    e("div",{className:"grid", style:{gridTemplateColumns:"1.6fr 1fr"}},
      e("div",{className:"pb-1"},
        e(BlocoJ,{t:"1 · A conta"},
          e("div",{className:"grid w-full grid-cols-4 gap-x-2 gap-y-1"},
            e("div",{style:{gridColumn:"span 2"}}, e(CampoJ,{rot:"Nome da conta", cls:"w-full"}, Fixo(x.conta.descricao))),
            e(CampoJ,{rot:"Vence em", cls:"w-full"}, Fixo(br(x.venc))),
            e(CampoJ,{rot:"Falta (R$)", cls:"w-full"}, Fixo(BK(x.restante))),
            e("div",{style:{gridColumn:"span 2"}}, e(CampoJ,{rot:"Para quem entra", cls:"w-full"}, campoPara)),
            e(CampoJ,{rot:"Categoria", cls:"w-full"}, Fixo(catNome(c.ff, x.conta.categoria))),
            e(CampoJ,{rot:"Mês", cls:"w-full"}, Fixo(nomeMes(x.ym))))),
        e(BlocoJ,{t:"2 · Como paga e o pagamento"},
          f.dividir ? e.apply(null, ["div", {className:"grid w-full", style:{gridTemplateColumns:"16% 34% 16% 34%"}}].concat(cels)) : e("div",{className:"grid w-full grid-cols-2 gap-x-2 gap-y-1"},
            e(CampoJ,{rot:"Forma de pagamento", cls:"w-full"}, campoForma), e(CampoJ,{rot:"Conta pagadora", cls:"w-full"}, campoConta),
            e(CampoJ,{rot:"Valor pago (R$)", cls:"w-full"}, campoValor), e(CampoJ,{rot:"Data do pagamento", cls:"w-full"}, campoData)))),
      e("div",{className:"border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
        e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que vai acontecer"),
        Lr("Conta", x.conta.descricao), Lr("Para quem entra", nomePara || "—"), Lr("Vence", br(x.venc)), Lr("Falta hoje", BK(x.restante)),
        peso && Lr("Já pago antes", BK(x.pago)),
        Lr("Pagamento", vPag>0 ? BK(vPag)+" em "+br(f.em) : "—"), Lr("Sai de", f.dividir ? "Mais de uma forma" : (f.contaTxt || "Não definida")),
        Lr("Depois fica", depoisP, corP),
        e("div",{className:"pt-2 text-center text-[13px] font-bold"}, "Total: "+BK(vPag)),
        e("div",{className:"pt-1.5"}, e(CampoJ,{rot:"Observações", cls:"w-full"},
          (contaV.obs || notasV.length>0) && e("div",{className:"mb-1 max-h-20 w-full overflow-y-auto text-left text-[11px]"}, contaV.obs && e("div",{className:"py-0.5"}, e("b",null, "Antes: "), contaV.obs), notasV.map(function(n){ return e("div",{key:n.id, className:"py-0.5"}, e("b",null, br(String(n.em).slice(0, 10))+" · "+(n.por || "—")+": "), n.txt); })),
          e("textarea",{value:f.obs, rows:3, "aria-label":"Observações", placeholder:"Escreva uma observação (fica guardada na conta)", onChange:function(ev){ set({obs:ev.target.value}); }, className:CAMPO_J+" py-1", style:{resize:"none"}}))))),
    e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-3 py-1.5"},
      e("button",{type:"button", style:ALTO_J, className:BTN_J, title:"Pagar com mais de uma forma, por exemplo parte em Pix e parte em dinheiro", onClick:function(){ set({dividir:!f.dividir}); }}, f.dividir ? "Voltar para uma forma só" : "Dividir entre formas"),
      e("button",{type:"button", style:ALTO_J, className:BTN_J, "aria-expanded":mais, onClick:function(){ setMais(!mais); }}, mais ? "Mais ações ▴" : "Mais ações ▾"),
      e("span",{className:"ml-auto"}), e("button",{type:"button", style:ALTO_J, className:BTN_J, onClick:p.fechar}, "Cancelar"),
      e("button",{type:"button", style:{height:"28px", lineHeight:"26px"}, className:BTN_J+" !bg-[#3f6bb8] !px-5 !text-[13px]", disabled:!(vPag>0), onClick:pagar}, "Registrar pagamento"+(vPag>0 ? " · "+BK(vPag) : ""))),
    mais && e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-2.5 pb-1.5 pt-1.5"},
      p.editar && e("button",{type:"button", style:ALTO_J, className:BTN_J, onClick:p.editar}, "Editar conta"),
      p.valor && e("button",{type:"button", style:ALTO_J, className:BTN_J, title:"Corrigir o valor deste mês", onClick:p.valor}, "Corrigir valor"),
      p.encerrar && e("button",{type:"button", style:ALTO_J, className:BTN_J, title:"Tira as parcelas em aberto e guarda o histórico pago", onClick:p.encerrar}, "Encerrar conta"),
      p.empresa && e("button",{type:"button", style:ALTO_J, className:BTN_J, title:"Lança na Contas a pagar da empresa como Retirada de sócio, paga em dinheiro, e tira esta conta da Família", onClick:p.empresa}, "Passar para a empresa"),
      p.excluir && e("button",{type:"button", style:ALTO_J, className:BTN_J+" !border-red-300", title:"Exclui a conta inteira, com todas as parcelas", onClick:p.excluir}, "Excluir conta")));
}
// JANELA AZUL (Marcus, 22/11/2026: "copia o bloco de lançamento de contas, cores, tudo mais alinhado"): a mesma moldura da janela Lançar recebimento da Contas a receber: título azul, blocos numerados com borda, campos de 22 px, letra de 11 px, tudo centralizado.
var AZ_J = "var(--bloco-titulo)", FUNDO_J = "#1b3463", CLARO_J = "#3f6bb8";
var CAMPO_J = "w-full rounded border border-white/30 bg-[var(--bloco-titulo)] px-1.5 text-center text-[11px] text-white outline-none placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white [color-scheme:dark]";   // padrao-ok: janela compacta de 11 px, igual à Lançar recebimento
var BTN_J = "rounded border border-white/40 bg-[var(--bloco-titulo)] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão da janela azul
var ALTO_J = {height:"22px", lineHeight:"20px"};   // padrao-ok: campo de 22 px, igual à Lançar recebimento
function CampoJ(p){ return e("label",{className:"flex flex-col items-center gap-0.5 text-center "+(p.cls || "")}, e("span",{className:"text-[11px] font-semibold leading-none text-white"}, p.rot), p.children); }   // padrao-ok: rótulo de 11 px
function BlocoJ(p){ return e("div",{className:"mx-1.5 mt-1.5 rounded-md border-2 border-white/40"}, e("div",{className:"flex items-center justify-center rounded-t-[4px] px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZ_J}}, p.t), e("div",{className:"flex flex-col items-center gap-1 p-2"}, p.children)); }   // padrao-ok: barra de seção de 18 px
function SelJ(p){ return e(CaixaEscolha,{rot:p.label, valor:p.value, ops:p.opcoes, vazio:"Escolha", aoMudar:p.onChange, cls:CAMPO_J, estilo:ALTO_J, fundo:FUNDO_J, campoCls:CAMPO_J}); }   // lista azul no lugar do menu nativo (que abre preto)
function TxtJ(p){ return e("input",{value:p.value, type:p.type || "text", placeholder:p.ph || "", "aria-label":p.label, style:ALTO_J, className:CAMPO_J, onChange:function(ev){ p.onChange(ev.target.value); }}); }
function JanelaJ(p){
  return e("div",{role:"dialog", "aria-modal":"true", "aria-label":p.t, onMouseDown:function(ev){ if(ev.target===ev.currentTarget) p.fechar(); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[92vh] w-full "+(p.larga==="g" ? "max-w-4xl" : p.larga ? "max-w-3xl" : "max-w-md")+" flex-col rounded-lg border-2 pb-1.5 text-center text-white shadow-xl", style:{background:FUNDO_J, borderColor:AZ_J}},
      e("div",{className:"relative flex items-center justify-center rounded-t-md px-2 py-1 text-white", style:{background:AZ_J}}, e("b",{className:"text-[11px]"}, p.t), e("button",{type:"button", "aria-label":"Fechar", onClick:p.fechar, className:"absolute right-1 rounded px-1 text-[11px] font-semibold underline hover:bg-white/20 active:bg-white/30"}, "Fechar")),   // padrao-ok: título de 11 px e botão de 11 px
      p.sub && e("div",{className:"px-2 pt-1 text-center text-[11px] text-white"}, p.sub),   // padrao-ok: subtítulo de 11 px
      p.children));
}
function opcoesPessoa(ff){   // lista de "Para quem entra" (nome | quem está dentro), usada nas janelas Lançar conta e Pagar
  // 22/11/2026 (Marcus): primeiro as pessoas (Marcus até Lucas, sem linha antes do Lucas), depois as casas, depois Família geral e Viagem EUA
  var GRUPOS_PESSOA = [["Pessoas", ["marcus", "anamaria", "marco", "anabeatriz", "lucas"]], ["Casas", ["casaalphaville", "juan", "casajardine"]], ["Família", [FAMILIA4, "__viagem"]], ["Saindo da lista", ["familia", "marco_ana", "sorelly"]]];
  var temViagem = ff.categorias.some(function(k){ return k.chave==="VIAGEM_EUA"; });
  var usadas = {}, opPessoa = [];
  var nomeDe = function(id){ var q = ff.personas.filter(function(z){ return z.id===id; })[0]; return q ? q.nome : id; };
  var dentro = function(ids){ return ids.map(nomeDe).join(", "); };   // 4º item da opção = quem está dentro (a lista mostra nome | quem está dentro)
  GRUPOS_PESSOA.forEach(function(g){ g[1].forEach(function(id){ if(id==="__viagem"){ if(temViagem) opPessoa.push(["__viagem", "Viagem EUA", g[0], dentro(membrosFamilia(ff))]); return; } if(id===FAMILIA4){ opPessoa.push([FAMILIA4, "Família geral", g[0], dentro(membrosFamilia(ff))]); usadas[id] = 1; return; } var q = ff.personas.filter(function(z){ return z.id===id; })[0]; if(q){ opPessoa.push([q.id, q.nome, g[0], dentro(ehCasa(id) ? CASAS_DONOS[id] : [id])]); usadas[id] = 1; } }); });
  ff.personas.forEach(function(q){ if(!usadas[q.id]) opPessoa.push([q.id, q.nome, "Outros", q.nome]); });
  return opPessoa;
}
// LANÇAR CONTA no formato 7C (Marcus, 22/11/2026): à esquerda dois blocos (1 A conta, 2 Como paga e o pagamento, se já pagou); à direita o recibo "O que vai acontecer". Editar conta continua em FormConta.
function FormContaNova(p){
  var c = p.c, ff = c.ff, hj = hojeIso(), temViagem = ff.categorias.some(function(k){ return k.chave==="VIAGEM_EUA"; });
  var st = useState({personaId:"", descricao:"", categoria:"", contaBancId:"", forma:"", beneficiario:"", obs:"", recorrencia:"unica", venc:hj, mesFim:somaMes(hojeYm(), 5), valor:"", pago:false, vp:"", vpMexeu:false, em:hj}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var ctas = contasPagadoras(ff), opPessoa = opcoesPessoa(ff), ehViagem = f.personaId===FAMILIA4 && f.categoria==="VIAGEM_EUA";
  var vConta = num(f.valor), vPago = f.pago ? (f.vpMexeu ? num(f.vp) : vConta) : 0, quita = f.pago && vPago>0 && vPago>=vConta-0.005;
  var mesIni = String(f.venc || hj).slice(0, 7), diaV = Number(String(f.venc || hj).slice(8, 10)) || 1;
  var contaTxt = f.contaBancId ? contaLabel(ff, f.contaBancId) : "";
  var invalido = !f.descricao.trim() || !f.personaId || !(vConta>0) || !f.venc || (f.pago && (!(vPago>0) || vPago>vConta+0.005));
  var lancar = function(comPagamento){ var base = {personaId:f.personaId, descricao:f.descricao, categoria:f.categoria, contaBancId:f.contaBancId, dia:diaV, forma:f.forma, beneficiario:f.beneficiario, obs:f.obs, recorrencia:f.recorrencia, mesInicio:mesIni, mesFim:f.mesFim, valor:vConta};
    if(comPagamento) base.pago = {valor:vPago, em:f.em, forma:f.forma, contaTxt:contaTxt, obs:f.obs};
    acao(c, "conta_add", base); p.fechar(); };
  var nomePessoa = (opPessoa.filter(function(o){ return o[0]===f.personaId; })[0] || [])[1] || "";
  var depois = !f.pago ? "A PAGAR" : !(vPago>0) ? "Digite o valor" : quita ? "PAGA" : "PARCIAL · falta "+BK(r2(vConta-vPago));
  var cor = !f.pago ? "" : quita ? "text-success" : "text-warning";
  var Lr = function(rot, val, extra){ return e("div",{className:"flex justify-between gap-2 border-b border-white/15 py-0.5 text-[11px] "+(extra || "")}, e("span",null, rot), e("b",{className:"text-right"}, val)); };
  return e(JanelaJ,{t:"Lançar conta", larga:"g", fechar:p.fechar},
    e("div",{className:"grid", style:{gridTemplateColumns:"1.6fr 1fr"}},
      e("div",{className:"pb-1"},
        e(BlocoJ,{t:"1 · A conta"},
          e("div",{className:"grid w-full grid-cols-4 gap-x-2 gap-y-1"},
            e("div",{style:{gridColumn:"span 2"}}, e(CampoJ,{rot:"Nome da conta", cls:"w-full"}, e(TxtJ,{value:f.descricao, label:"Nome da conta", ph:"Ex.: Condomínio Praia", onChange:function(v){ set({descricao:v}); }}))),
            e(CampoJ,{rot:"Vence em", cls:"w-full"}, e(TxtJ,{value:f.venc, type:"date", label:"Vence em", onChange:function(v){ set({venc:v}); }})),
            e(CampoJ,{rot:"Valor (R$)", cls:"w-full"}, e(TxtJ,{value:f.valor, label:"Valor da conta", ph:"0,00", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})),
            e("div",{style:{gridColumn:"span 2"}}, e(CampoJ,{rot:"Para quem entra", cls:"w-full"}, e(SelJ,{value:ehViagem ? "__viagem" : f.personaId, label:"Para quem entra", opcoes:opPessoa, onChange:function(v){ if(v==="__viagem") set({personaId:FAMILIA4, categoria:"VIAGEM_EUA"}); else if(ehViagem) set({personaId:v, categoria:(ff.categorias.filter(function(k){ return k.chave!=="VIAGEM_EUA"; })[0] || {}).chave || f.categoria}); else set({personaId:v}); }}))),
            e(CampoJ,{rot:"Categoria", cls:"w-full"}, e(SelJ,{value:f.categoria, label:"Categoria", opcoes:ff.categorias.map(function(k){ return [k.chave, k.nome]; }), onChange:function(v){ set({categoria:v}); }})),
            e(CampoJ,{rot:"Repete", cls:"w-full"}, e(SelJ,{value:f.recorrencia, label:"Repete", opcoes:[["unica", "Única (1 mês)"], ["parcelada", "Parcelada"], ["fixa", "Fixa (24 meses)"]], onChange:function(v){ set({recorrencia:v}); }})),
            f.recorrencia==="parcelada" && e("div",{style:{gridColumn:"span 2"}}, e(CampoJ,{rot:"Termina em", cls:"w-full"}, e(TxtJ,{value:f.mesFim, type:"month", label:"Termina em", onChange:function(v){ set({mesFim:v}); }}))))),
        e(BlocoJ,{t:"2 · Como paga e o pagamento"},
          e("div",{className:"grid w-full grid-cols-2 gap-x-2 gap-y-1"},
            e(CampoJ,{rot:"Forma de pagamento", cls:"w-full"}, e(SelJ,{value:f.forma, label:"Forma de pagamento", opcoes:FORMAS.map(function(k){ return [k, k]; }), onChange:function(v){ set({forma:v}); }})),
            e(CampoJ,{rot:"Conta pagadora", cls:"w-full"}, e(SelJ,{value:f.contaBancId, label:"Conta pagadora", opcoes:[["", "Não definida"]].concat(ctas.map(function(b){ return [b.id, contaLabel(ff, b.id)]; })), onChange:function(v){ set({contaBancId:v}); }}))),
          e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold"}, e("input",{type:"checkbox", checked:f.pago, className:"size-3", onChange:function(ev){ set({pago:ev.target.checked}); }}), "Já foi pago"),
          f.pago && e("div",{className:"grid w-full grid-cols-2 gap-x-2 gap-y-1"},
            e(CampoJ,{rot:"Valor pago (R$)", cls:"w-full"}, e(TxtJ,{value:f.vpMexeu ? f.vp : fmtN(vConta), label:"Valor pago", ph:"0,00", onChange:function(v){ set({vp:v.replace(/[^\d,.]/g,""), vpMexeu:true}); }})),
            e(CampoJ,{rot:"Data do pagamento", cls:"w-full"}, e(TxtJ,{value:f.em, type:"date", label:"Data do pagamento", onChange:function(v){ set({em:v}); }}))))),
      e("div",{className:"border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
        e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que vai acontecer"),
        Lr("Nova conta", f.descricao.trim() || "—"), Lr("Para quem entra", nomePessoa || "—"), Lr("Categoria", f.categoria ? catNome(ff, f.categoria) : "—"),
        Lr("Valor da conta", vConta>0 ? BK(vConta) : "—"), Lr("Vence", f.venc ? br(f.venc) : "—"),
        Lr("Repete", f.recorrencia==="unica" ? "Só este mês" : f.recorrencia==="fixa" ? "24 meses" : "até "+nomeMes(f.mesFim)),
        Lr("Pagamento", f.pago ? (vPago>0 ? BK(vPago)+" em "+br(f.em) : "—") : "Nenhum agora"),
        Lr("Sai de", contaTxt || "Não definida"),
        Lr("Depois fica", depois, cor),
        e("div",{className:"pt-2 text-center text-[13px] font-bold"}, "Total: "+(f.pago ? BK(vPago) : BK(vConta))),
        e("div",{className:"pt-1.5"}, e(CampoJ,{rot:"Observações", cls:"w-full"}, e("textarea",{value:f.obs, rows:3, "aria-label":"Observações", placeholder:"Escreva uma observação (fica guardada na conta)", onChange:function(ev){ set({obs:ev.target.value}); }, className:CAMPO_J+" py-1", style:{resize:"none"}}))))),
    e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-3 py-1.5"},
      f.pago && e("button",{type:"button", disabled:!f.descricao.trim() || !f.personaId || !(vConta>0) || !f.venc, style:ALTO_J, className:BTN_J, title:"Lança a conta sem registrar o pagamento", onClick:function(){ lancar(false); }}, "Só lançar, pagar depois"),
      e("span",{className:"ml-auto"}), e("button",{type:"button", style:ALTO_J, className:BTN_J, onClick:p.fechar}, "Cancelar"),
      e("button",{type:"button", style:{height:"28px", lineHeight:"26px"}, className:BTN_J+" !bg-[#3f6bb8] !px-5 !text-[13px]", disabled:invalido, onClick:function(){ lancar(f.pago); }}, f.pago ? "Lançar e pagar"+(vPago>0 ? " · "+BK(vPago) : "") : "Lançar"+(vConta>0 ? " · "+BK(vConta) : ""))));
}
function FormConta(p){   // editar conta (lançar conta nova é a FormContaNova)
  var c = p.c, ff = c.ff, x = p.x, nova = !x;
  var st = useState({personaId:x ? paraQuemDe(x) : (ff.personas[0]||{}).id||"", descricao:x ? x.descricao : "", categoria:x ? x.categoria : "OUTROS", contaBancId:x ? x.contaBancId : "", dia:x ? String(x.dia) : "10", forma:x ? x.forma : "PIX", beneficiario:x ? x.beneficiario : "", obs:x ? x.obs : "",
    recorrencia:"unica", mesInicio:hojeYm(), mesFim:somaMes(hojeYm(), 5), valor:"", estAte:"", estValor:""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var salvar = function(){ if(nova) acao(c, "conta_add", {personaId:f.personaId, descricao:f.descricao, categoria:f.categoria, contaBancId:f.contaBancId, dia:Number(f.dia), forma:f.forma, beneficiario:f.beneficiario, obs:f.obs, recorrencia:f.recorrencia, mesInicio:f.mesInicio, mesFim:f.mesFim, valor:num(f.valor)});
    else acao(c, "conta_set", {id:x.id, patch:{personaId:f.personaId, descricao:f.descricao, categoria:f.categoria, contaBancId:f.contaBancId, dia:Number(f.dia)||1, forma:f.forma, beneficiario:f.beneficiario, obs:f.obs}}); p.fechar(); };
  var ctas = contasPagadoras(ff).concat(x && x.contaBancId && !contasPagadoras(ff).some(function(b){ return b.id===x.contaBancId; }) ? ff.contasBanc.filter(function(b){ return b.id===x.contaBancId; }) : []);   // a conta que a conta já usa fica na lista mesmo se for repetida ou de prestador
  var desligado = !f.descricao.trim() || (nova && !(num(f.valor)>0));
  // ORDEM COMBINADA com o Marcus (22/11/2026): Família ÷4, os sócios, o Lucas, as casas e, no fim, o que está saindo da lista (Casa/Família, Marco / Anamaria, Sorelly)
  var opPessoa = opcoesPessoa(ff), temViagem = ff.categorias.some(function(k){ return k.chave==="VIAGEM_EUA"; }), ehViagem = f.personaId===FAMILIA4 && f.categoria==="VIAGEM_EUA";
  return e(JanelaJ,{t:nova ? "Lançar conta" : "Editar conta", fechar:p.fechar},
    e(BlocoJ,{t:"1 · Para quem"},
      e("div",{className:"grid w-full grid-cols-2 gap-1"},
        e(CampoJ,{rot:"Para quem entra", cls:"w-full"}, e(SelJ,{value:ehViagem ? "__viagem" : f.personaId, label:"Para quem entra", opcoes:opPessoa, onChange:function(v){ if(v==="__viagem") set({personaId:FAMILIA4, categoria:"VIAGEM_EUA"}); else if(ehViagem) set({personaId:v, categoria:(ff.categorias.filter(function(k){ return k.chave!=="VIAGEM_EUA"; })[0] || {}).chave || f.categoria}); else set({personaId:v}); }})),
        e(CampoJ,{rot:"Categoria", cls:"w-full"}, e(SelJ,{value:f.categoria, label:"Categoria", opcoes:ff.categorias.map(function(k){ return [k.chave, k.nome]; }), onChange:function(v){ set({categoria:v}); }})))),
    e(BlocoJ,{t:"2 · A conta"},
      e(CampoJ,{rot:"Nome da conta", cls:"w-full"}, e(TxtJ,{value:f.descricao, label:"Nome da conta", ph:"Ex.: Condomínio Praia", onChange:function(v){ set({descricao:v}); }})),
      e("div",{className:"grid w-full grid-cols-2 gap-1"},
        e(CampoJ,{rot:"Conta pagadora", cls:"w-full"}, e(SelJ,{value:f.contaBancId, label:"Conta pagadora", opcoes:[["", "Não definida"]].concat(ctas.map(function(b){ return [b.id, contaLabel(ff, b.id)]; })), onChange:function(v){ set({contaBancId:v}); }})),
        e(CampoJ,{rot:"Forma de pagamento", cls:"w-full"}, e(SelJ,{value:f.forma, label:"Forma de pagamento", opcoes:FORMAS.map(function(k){ return [k, k]; }), onChange:function(v){ set({forma:v}); }})),
        e(CampoJ,{rot:"Dia do vencimento", cls:"w-full"}, e(TxtJ,{value:f.dia, label:"Dia do vencimento", onChange:function(v){ set({dia:v.replace(/\D/g,"").slice(0,2)}); }}))),
      e(CampoJ,{rot:"Observação", cls:"w-full"}, e(TxtJ,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }}))),
    nova && e(BlocoJ,{t:"3 · Valor e meses"},
      e("div",{className:"grid w-full grid-cols-2 gap-1"},
        e(CampoJ,{rot:"Recorrência", cls:"w-full"}, e(SelJ,{value:f.recorrencia, label:"Recorrência", opcoes:[["unica", "Única (1 mês)"], ["parcelada", "Parcelada (vários meses)"], ["fixa", "Fixa (24 meses)"]], onChange:function(v){ set({recorrencia:v}); }})),
        e(CampoJ,{rot:"Valor de cada mês (R$)", cls:"w-full"}, e(TxtJ,{value:f.valor, label:"Valor de cada mês", ph:"0,00", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})),
        e(CampoJ,{rot:"Começa em", cls:"w-full"}, e(TxtJ,{value:f.mesInicio, type:"month", label:"Começa em", onChange:function(v){ set({mesInicio:v}); }})),
        f.recorrencia==="parcelada" ? e(CampoJ,{rot:"Termina em", cls:"w-full"}, e(TxtJ,{value:f.mesFim, type:"month", label:"Termina em", onChange:function(v){ set({mesFim:v}); }})) : e("div",null))),
    !nova && e(BlocoJ,{t:"3 · Estender a conta"},
      e("div",{className:"grid w-full grid-cols-2 gap-1"},
        e(CampoJ,{rot:"Até (vazio = mais 24 meses)", cls:"w-full"}, e(TxtJ,{value:f.estAte, type:"month", label:"Até", onChange:function(v){ set({estAte:v}); }})),
        e(CampoJ,{rot:"Valor das novas parcelas", cls:"w-full"}, e(TxtJ,{value:f.estValor, label:"Valor das novas parcelas", ph:"0,00", onChange:function(v){ set({estValor:v.replace(/[^\d,.]/g,"")}); }}))),
      e("button",{type:"button", disabled:!(num(f.estValor)>0), onClick:function(){ acao(c, "conta_estender", {id:x.id, ateMes:f.estAte||null, valor:num(f.estValor)}); p.fechar(); }, style:ALTO_J, className:BTN_J}, "Estender")),
    e("div",{className:"mt-1.5 flex items-center justify-center gap-2 px-1.5"},
      e("button",{type:"button", onClick:p.fechar, style:ALTO_J, className:BTN_J+" min-w-[88px]"}, "Cancelar"),
      e("button",{type:"button", disabled:desligado, onClick:salvar, style:{height:"22px", lineHeight:"20px", background:CLARO_J}, className:"min-w-[88px] rounded border border-white/60 px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"}, nova ? "Lançar" : "Salvar")));   // padrao-ok: botão principal da janela azul
}

// CONTAS A PAGAR DA FAMÍLIA no MESMO desenho da Contas a pagar da Sorelly (Marcus, 22/11/2026: "igual à tela da Sorelly, cores, fontes, tudo organizado"):
// página cheia, barra em forma de tabela (Buscar, Situação, Mês, Pessoa, Categoria), tabela fina com fundo azul-marinho, rodapé com o total e o botão Lançar conta no canto direito. Peças de components/planilha-cheia.js.
// Clicar na linha abre o pagamento; as ações da linha são links de texto (Pagar, Valor, Editar, Encerrar, Excluir). As regras e os dados continuam os mesmos (domain/financeiro-familiar.js).
function AbaFfContas(){
  var c = useFF(), ff = c.ff, es = useState({ym:hojeYm(), pessoa:"", cat:"", status:"", busca:""}), f = es[0], set = function(o){ es[1](Object.assign({}, f, o)); };
  var md = useState(null), modal = md[0], setModal = md[1], nt = useState({origem:"", destino:"", valor:"", data:hojeIso()}), tr = nt[0], setTr = nt[1];
  var q = f.busca.trim().toLowerCase(), hj = hojeIso();
  var lista = parcelasDe(ff, f.ym ? {ym:f.ym} : {yms:janela()}).filter(function(x){ return x.status!=="PAGO" && (!f.pessoa || daPessoa(x.conta, f.pessoa)) && (!f.cat || x.conta.categoria===f.cat) &&
    (!f.status || (f.status==="atrasado" ? x.atrasada : f.status==="parcial" ? x.status==="PARCIAL" : (!x.atrasada))) && (!q || (x.conta.descricao+" "+x.conta.beneficiario+" "+x.conta.obs+" "+(x.conta.notas||[]).map(function(n){ return n.txt; }).join(" ")).toLowerCase().indexOf(q)>=0 || casaValor(f.busca.trim(), x.valor) || casaValor(f.busca.trim(), x.restante)); });
  var trans = ff.transf.filter(function(t){ return !f.ym || t.data.slice(0,7)===f.ym; }).sort(function(a, b){ return b.data.localeCompare(a.data); });
  var cbs = ff.contasBanc.filter(function(b){ return b.ativo; });
  var dias = function(x){ return Math.max(1, Math.round((new Date(hj+"T00:00:00") - new Date(x.venc+"T00:00:00"))/86400000)); };
  var linhas = lista.map(function(x){ return {id:x.chave, x:x, sit:x.atrasada ? "Atrasada · "+dias(x)+" dias" : x.status==="PARCIAL" ? "Parcial" : "A pagar", venc:br(x.venc).slice(0,5)+(f.ym ? "" : "/"+x.ym.slice(2,4)),
    pessoa:pessoaNome(ff, x.conta.personaId), nome:x.conta.descricao, cat:catNome(ff, x.conta.categoria), forma:x.conta.forma || "—", pagadora:x.conta.contaBancId ? contaLabel(ff, x.conta.contaBancId) : "Não definida", valor:x.valor, falta:x.restante, obs:(x.conta.obs || (x.conta.notas || []).length) ? "✓" : "—"}; });
  var cols = [{k:"sit", t:"Situação", cor:function(l){ return l.sit.indexOf("Atrasada")===0 ? "text-warning" : l.sit==="Parcial" ? "text-warning" : ""; }}, {k:"venc", t:"Vence"}, {k:"pessoa", t:"Pessoa"}, {k:"nome", t:"Conta"}, {k:"cat", t:"Categoria"}, {k:"forma", t:"Forma"}, {k:"pagadora", t:"Conta pagadora"},
    {k:"valor", t:"Valor", fmt:BK}, {k:"falta", t:"Falta", fmt:BK}, {k:"obs", t:"Obs"}];
  var somaCampo = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(Number(l[k]) || 0); }, 0)); };
  var rodape = function(ls){ return cols.map(function(col, j){ return j===0 ? "Total" : col.k==="nome" ? ls.length+(ls.length===1 ? " conta" : " contas") : col.k==="valor" || col.k==="falta" ? BK(somaCampo(ls, col.k)) : ""; }); };
  var op = function(l, todos){ return [["", todos]].concat(l); };
  return e(Guarda,{c:c}, e(Pagina,{className:PAGINA_CHEIA},
    modal && modal.tipo==="pagar" && e(ModalPagar,{key:modal.x.chave, c:c, x:modal.x, editar:function(){ setModal({tipo:"conta", x:modal.x.conta}); },
      valor:function(){ var x = modal.x, v2 = window.prompt("Novo valor de "+nomeMes(x.ym)+" (R$):", fmtN(x.valor)); if(v2!==null && num(v2)>0){ acao(c, "parc_valor", {id:x.conta.id, ym:x.ym, valor:num(v2)}); setModal(null); } },
      encerrar:function(){ var x = modal.x; if(window.confirm("Encerrar \""+x.conta.descricao+"\"? As parcelas em aberto saem. O que já foi pago continua no histórico.")){ acao(c, "conta_encerrar", {id:x.conta.id}); setModal(null); } },
      excluir:function(){ var x = modal.x; if(window.confirm("Excluir \""+x.conta.descricao+"\" com TODAS as parcelas e pagamentos?")){ acao(c, "conta_del", {id:x.conta.id}); setModal(null); } },
      empresa:function(){ var x = modal.x, quem = pessoaNome(ff, x.conta.personaId), v = x.restante;
        if(!window.confirm("Passar \""+x.conta.descricao+" · "+quem+"\" ("+BK(v)+", "+br(x.venc)+") para a Contas a pagar da empresa, como Retirada de sócio paga em dinheiro?\n\nA conta sai da Família: as parcelas em aberto saem e o que já foi pago fica no histórico.")) return;
        c.d({type:"CPE_LANC_ADD", itens:[{id:"fam"+Date.now(), filial:"fora", nat:"3.01.01.99", natNome:"Retirada de sócio", pref:"DIN", forn:quem, nome:x.conta.descricao+" · "+quem, venc:x.venc, valor:v, status:"pago", baixa:x.venc, fam:false, saida:"Dinheiro", hist:"Veio do Contas a pagar da Família ("+x.conta.descricao+")"}]});
        acao(c, "conta_encerrar", {id:x.conta.id}); setModal(null); },
      fechar:function(){ setModal(null); }}),
    modal && modal.tipo==="conta" && e(modal.x ? FormConta : FormContaNova,{key:modal.x ? modal.x.id : "nova", c:c, x:modal.x, fechar:function(){ setModal(null); }}),
    e(BlocoPainel,{titulo:"Contas a pagar - Família", compacto:true},
      e(BarraTabela,null,
        e("div",{role:"button", tabIndex:0, title:"Lançar uma conta da família", onClick:function(){ setModal({tipo:"conta"}); }, onKeyDown:function(ev){ if(ev.key==="Enter" || ev.key===" "){ ev.preventDefault(); setModal({tipo:"conta"}); } }, className:"flex w-[124px] shrink-0 cursor-pointer whitespace-nowrap items-center justify-center border-r border-white/25 bg-[#E8B84B] px-3 text-[11px] font-semibold text-[#1a1306] outline-none hover:brightness-110 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white"}, "+ Lançar conta"),   // padrao-ok: botão no INÍCIO da barra, tamanho médio (Marcus, 22/11/2026)
        e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{larg:"w-44", valor:f.busca, aoMudar:function(v){ set({busca:v}); }, ph:"Conta, valor...", rotulo:"Buscar nas contas"})),
        e(CelulaBarra,{rotulo:"Situação"}, e(CampoMini,{valor:f.status, aoMudar:function(v){ set({status:v}); }, rotulo:"Situação", ops:[["", "Todas abertas"], ["pendente", "A pagar"], ["parcial", "Parciais"], ["atrasado", "Atrasadas"]]})),
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:f.ym, aoMudar:function(v){ set({ym:v}); }, rotulo:"Mês", ops:op(janela().map(function(k){ return [k, nomeMes(k)]; }), "Todos os meses")})),
        e(CelulaBarra,{rotulo:"Pessoa"}, e(CampoMini,{valor:f.pessoa, aoMudar:function(v){ set({pessoa:v}); }, rotulo:"Pessoa", ops:op(ff.personas.map(function(p){ return [p.id, p.nome]; }), "Todas as pessoas")})),
        e(CelulaBarra,{rotulo:"Categoria"}, e(CampoMini,{valor:f.cat, aoMudar:function(v){ set({cat:v}); }, rotulo:"Categoria", ops:op(ff.categorias.map(function(k){ return [k.chave, k.nome]; }), "Todas as categorias")}))),
      e("div",{ref:refCheia(), className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{key:"ffcontas", fina:true, cols:cols, aoClicar:function(l){ setModal({tipo:"pagar", x:l.x}); }, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:6000, totalRodape:rodape, vazio:"Nada para pagar neste filtro."}))),
    e(BlocoPainel,{titulo:"Transferências entre contas", compacto:true}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-3"}, e(Campo,{rot:"De"}, e(Sel,{value:tr.origem, label:"Origem", className:"w-56", onChange:function(v){ setTr(Object.assign({}, tr, {origem:v})); }}, e("option",{value:""}, "Escolha…"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e(Campo,{rot:"Para"}, e(Sel,{value:tr.destino, label:"Destino", className:"w-56", onChange:function(v){ setTr(Object.assign({}, tr, {destino:v})); }}, e("option",{value:""}, "Escolha…"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e(Campo,{rot:"Valor (R$)"}, e(Txt,{value:tr.valor, label:"Valor", className:"w-32", onChange:function(v){ setTr(Object.assign({}, tr, {valor:v.replace(/[^\d,.]/g,"")})); }})), e(Campo,{rot:"Data"}, e(Txt,{value:tr.data, type:"date", label:"Data", className:"w-44", onChange:function(v){ setTr(Object.assign({}, tr, {data:v})); }})),
        e(Btn,{v:"secondary", disabled:!tr.origem || !tr.destino || !(num(tr.valor)>0), onClick:function(){ acao(c, "transf_add", {origem:tr.origem, destino:tr.destino, valor:num(tr.valor), data:tr.data}); setTr(Object.assign({}, tr, {valor:""})); }}, "Anotar")),
      cbs.length<2 && e("p",{className:"text-[12.5px] text-muted-foreground"}, "Cadastre ao menos duas contas bancárias em Configurações para anotar transferências."),
      trans.length>0 && e("div",{className:"flex flex-col divide-y divide-white/10"}, trans.map(function(t){ return e("div",{key:t.id, className:"flex flex-wrap items-center justify-between gap-2 py-2 text-[13.5px]"}, e("span",null, br(t.data)+" · "+contaLabel(ff, t.origem)+" → "+contaLabel(ff, t.destino)+" · ", e("b",{className:MONO}, BK(t.valor))),
          e("span",{className:"flex items-center gap-2"}, t.status==="PAGO" ? e("span",{className:"text-[11px] font-bold text-success"}, "Feita em "+br(t.pagoEm)) : e(Btn,{v:"secondary", sm:true, onClick:function(){ acao(c, "transf_baixa", {id:t.id}); }}, "Dar baixa"), iconBtn("trash", "Excluir", function(){ acao(c, "transf_del", {id:t.id}); }, true))); }))))));
}

// ───────────────── Contas pagas ─────────────────
function AbaFfPagas(){
  var c = useFF(), ff = c.ff, es = useState({ym:hojeYm(), pessoa:"", cat:"", busca:""}), f = es[0], set = function(o){ es[1](Object.assign({}, f, o)); }, ed = useState(null), edit = ed[0], setEdit = ed[1];
  var q = f.busca.trim().toLowerCase();
  var lista = parcelasDe(ff, f.ym ? {ym:f.ym} : {yms:janela()}).filter(function(x){ return x.pago>0 && (!f.pessoa || daPessoa(x.conta, f.pessoa)) && (!f.cat || x.conta.categoria===f.cat) &&
    (!q || (x.conta.descricao+" "+x.conta.beneficiario).toLowerCase().indexOf(q)>=0 || casaValor(f.busca.trim(), x.valor) || casaValor(f.busca.trim(), x.pago)); });
  var linhas = lista.map(function(x){ var g = x.pagamentos[x.pagamentos.length-1]||{};
    return {id:x.chave, x:x, em:br(g.em), pessoa:pessoaNome(ff, x.conta.personaId), nome:x.conta.descricao, mes:nomeMes(x.ym)+(x.status==="PARCIAL" ? " · Parcial de "+BK(x.valor) : ""), cat:catNome(ff, x.conta.categoria), forma:g.forma || "—", pagadora:g.conta || "—", pago:x.pago}; });
  var link = function(txt, fn, titulo){ return e("button",{key:txt, type:"button", title:titulo, onClick:function(ev){ ev.stopPropagation(); fn(); }, className:"cursor-pointer underline hover:text-primary"}, txt); };
  var acoes = function(v, l){ var x = l.x; return e("span",{className:"inline-flex items-center justify-center gap-2"},
    x.status==="PAGO" && link("Editar", function(){ setEdit(x); }, "Editar o pagamento"),
    link("Excluir", function(){ if(window.confirm("Excluir TODOS os pagamentos de \""+x.conta.descricao+"\" ("+nomeMes(x.ym)+")? A parcela volta para Contas a pagar.")) acao(c, "parc_reverter", {id:x.conta.id, ym:x.ym}); }, "Excluir o pagamento (volta para Contas a pagar)")); };
  var cols = [{k:"em", t:"Pago em"}, {k:"pessoa", t:"Pessoa"}, {k:"nome", t:"Conta"}, {k:"mes", t:"Mês"}, {k:"cat", t:"Categoria"}, {k:"forma", t:"Forma"}, {k:"pagadora", t:"Conta pagadora"}, {k:"pago", t:"Pago", fmt:BK, cor:function(){ return "text-success"; }}, {k:"acoes", t:"Ações", render:acoes}];
  var rodape = function(ls){ return cols.map(function(col, j){ return j===0 ? "Total" : col.k==="nome" ? ls.length+(ls.length===1 ? " conta" : " contas") : col.k==="pago" ? BK(r2(ls.reduce(function(t, l){ return t+(Number(l.pago) || 0); }, 0))) : ""; }); };
  var op = function(l, todos){ return [["", todos]].concat(l); };
  return e(Guarda,{c:c}, e(Pagina,{className:PAGINA_CHEIA},
    e(BlocoPainel,{titulo:"Contas pagas - Família", compacto:true},
      e(BarraTabela,null,
        e(CelulaBarra,{rotulo:"Buscar"}, e(BuscaMini,{larg:"w-44", valor:f.busca, aoMudar:function(v){ set({busca:v}); }, ph:"Conta, valor...", rotulo:"Buscar nas contas pagas"})),
        e(CelulaBarra,{rotulo:"Mês"}, e(CampoMini,{valor:f.ym, aoMudar:function(v){ set({ym:v}); }, rotulo:"Mês", ops:op(janela().map(function(k){ return [k, nomeMes(k)]; }), "Todos os meses")})),
        e(CelulaBarra,{rotulo:"Pessoa"}, e(CampoMini,{valor:f.pessoa, aoMudar:function(v){ set({pessoa:v}); }, rotulo:"Pessoa", ops:op(ff.personas.map(function(p){ return [p.id, p.nome]; }), "Todas as pessoas")})),
        e(CelulaBarra,{rotulo:"Categoria"}, e(CampoMini,{valor:f.cat, aoMudar:function(v){ set({cat:v}); }, rotulo:"Categoria", ops:op(ff.categorias.map(function(k){ return [k.chave, k.nome]; }), "Todas as categorias")}))),
      e("div",{ref:refCheia(), className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{key:"ffpagas", fina:true, cols:cols, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:6000, totalRodape:rodape, vazio:"Nenhum pagamento neste filtro."}))),
    edit && e(EditarPago,{key:edit.chave, c:c, x:edit, fechar:function(){ setEdit(null); }})));
}
function EditarPago(p){
  var g = p.x.pagamentos[p.x.pagamentos.length-1]||{}, st = useState({valor:fmtN(p.x.pago), em:g.em||hojeIso(), forma:g.forma||"PIX", contaTxt:g.conta||"", obs:g.obs||""}), f = st[0], set = function(o){ st[1](Object.assign({}, f, o)); };
  var opContas = [["", "Não definida"]].concat(contasPagadoras(p.c.ff).map(function(b){ var n = contaLabel(p.c.ff, b.id); return [n, n]; }));
  if(f.contaTxt && !opContas.some(function(o){ return o[0]===f.contaTxt; })) opContas.push([f.contaTxt, f.contaTxt]);   // conta antiga escrita à mão continua na lista
  // Pessoa da conta já baixada (Anamaria, 22/11/2026): muda a pessoa SEM estornar e baixar de novo. Vale para a conta inteira (todos os meses), igual ao "Para quem entra" do Pagar. "Salvar" grava o pagamento E a pessoa; "Mudar só a pessoa" não mexe no pagamento (a divisão em várias formas continua).
  var pessoaAtual = paraQuemDe(p.x.conta), ps = useState(pessoaAtual), pessoa = ps[0], opPessoa = opcoesPessoa(p.c.ff).filter(function(o){ return o[0]!=="__viagem"; });
  var gravaPessoa = function(){ if(pessoa!==pessoaAtual) acao(p.c, "conta_set", {id:p.x.conta.id, patch:{personaId:pessoa}}); };
  return e(JanelaJ,{t:"Editar pagamento · "+p.x.conta.descricao, sub:nomeMes(p.x.ym)+" · a divisão anterior (se houve) se perde", fechar:p.fechar},
    e(BlocoJ,{t:"Pagamento"},
      e("div",{className:"grid w-full grid-cols-2 gap-1"},
        e(CampoJ,{rot:"Valor (R$)", cls:"w-full"}, e(TxtJ,{value:f.valor, label:"Valor", onChange:function(v){ set({valor:v.replace(/[^\d,.]/g,"")}); }})),
        e(CampoJ,{rot:"Data", cls:"w-full"}, e(TxtJ,{value:f.em, type:"date", label:"Data", onChange:function(v){ set({em:v}); }})),
        e(CampoJ,{rot:"Forma", cls:"w-full"}, e(SelJ,{value:f.forma, label:"Forma", opcoes:FORMAS.map(function(k){ return [k, k]; }), onChange:function(v){ set({forma:v}); }})),
        e(CampoJ,{rot:"Conta pagadora", cls:"w-full"}, e(SelJ,{value:f.contaTxt, label:"Conta pagadora", opcoes:opContas, onChange:function(v){ set({contaTxt:v}); }})),
        e(CampoJ,{rot:"Observação", cls:"col-span-2"}, e(TxtJ,{value:f.obs, label:"Observação", onChange:function(v){ set({obs:v}); }})))),
    e(BlocoJ,{t:"Pessoa da conta (vale para todos os meses)"},
      e("div",{className:"grid w-full grid-cols-[1fr_auto] items-end gap-1"},
        e(CampoJ,{rot:"Para quem entra", cls:"w-full"}, e(SelJ,{value:pessoa, label:"Para quem entra", opcoes:opPessoa, onChange:function(v){ ps[1](v); }})),
        e("button",{type:"button", disabled:pessoa===pessoaAtual, style:ALTO_J, className:BTN_J, title:"Troca só a pessoa. O pagamento não muda.", onClick:function(){ gravaPessoa(); p.fechar(); }}, "Mudar só a pessoa"))),
    e("div",{className:"flex justify-end gap-1.5 px-2 pt-1.5"}, e("button",{type:"button", style:ALTO_J, className:BTN_J, onClick:p.fechar}, "Cancelar"), e("button",{type:"button", style:ALTO_J, className:BTN_J+" !bg-[#3f6bb8]", onClick:function(){ gravaPessoa(); acao(p.c, "parc_pago_edit", {id:p.x.conta.id, ym:p.x.ym, valor:num(f.valor), em:f.em, forma:f.forma, contaTxt:f.contaTxt, obs:f.obs}); p.fechar(); }}, "Salvar")));
}

// ───────────────── PIX revendedoras ─────────────────
// Total do dia só quando o Marcus liga no filtro "Com total por dia" (pedido de 04/11/2026: os PIX vêm em sequência). Refeita em 04/11/2026 (Marcus: compacta, sem bolinhas coloridas, sem topo gigante): só peças do padrão (Bloco com barra dourada, TabelaP, Botao). Resumo escrito em UMA linha, formulário numa linha, tabela com o TOTAL DO DIA dentro dela (linha de total), tudo em branco.
function DivPix(p){
  var x = p.x, cbs = p.cbs, ff = p.ff, nd = useState({tipo:p.tipo, valor:fmtN(x.valor), conta:x.contaId||"", data:x.data, obs:(x.div && x.div.obs) || ""}), f = nd[0], set = function(o){ nd[1](Object.assign({}, f, o)); };
  var salvar = function(){ if(f.tipo==="valor" && !(num(f.valor)>0)) return; if(f.tipo==="conta" && !f.conta) return; if(f.tipo==="data" && !f.data) return; acao(p.c, "pix_div", {id:x.id, tipo:f.tipo, valor:num(f.valor), contaId:f.conta, data:f.data, obs:f.obs}); p.onFecha(); };
  var antes = x.valorOriginal!=null || x.contaOriginal!=null || x.dataOriginal!=null;
  return e("div",{className:"fixed inset-0 z-50 grid place-items-center bg-black/50", onClick:p.onFecha}, e("div",{className:"w-64 rounded-md border border-border bg-background p-3 shadow-lg", onClick:function(ev){ ev.stopPropagation(); }},
    e("p",{className:"pb-2 text-center text-[13px] font-semibold"}, "Divergência de "+(f.tipo==="conta" ? "conta" : f.tipo==="data" ? "data" : "valor")),
    antes && e("p",{className:"pb-2 text-center text-[13px]"}, "Informado antes: "+(x.valorOriginal!=null ? BK(x.valorOriginal) : BK(x.valor))+" · "+(x.contaOriginal!=null ? contaLabel(ff, x.contaOriginal) : contaLabel(ff, x.contaId) || "sem conta")+(x.dataOriginal!=null ? " · "+br(x.dataOriginal) : "")),
    f.tipo==="valor"
      ? e("div",null, e(Rotulo,{t:"Valor que entrou (R$)"}), e("input",{value:f.valor, "aria-label":"Valor real", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ set({valor:ev.target.value.replace(/[^\d,.]/g,"")}); }}))
      : f.tipo==="data" ? e("div",null, e(Rotulo,{t:"Data em que entrou"}), e("input",{type:"date", value:f.data, "aria-label":"Data real", className:CAMPO+" text-center", onChange:function(ev){ set({data:ev.target.value}); }}))
      : e("div",null, e(Rotulo,{t:"Conta em que entrou"}), e("select",{value:f.conta, "aria-label":"Conta certa", className:CAMPO, onChange:function(ev){ set({conta:ev.target.value}); }}, e("option",{value:""}, "Escolha a conta"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
    e("div",{className:"pt-2"}, e(Rotulo,{t:"Observação"}), e("input",{value:f.obs, "aria-label":"Observação", className:CAMPO, onChange:function(ev){ set({obs:ev.target.value}); }})),
    e("div",{className:"flex justify-center gap-2 pt-3"}, e(Botao,{principal:true, onClick:salvar}, "Salvar"), e(Botao,{onClick:p.onFecha}, "Cancelar"))));
}
function CartaoPix(p){
  var c = p.c, ff = c.ff, pe = p.p, ym = p.ym, casa = !!p.casa, todos = ym==="TODOS" || casa, t = todos ? null : totaisPersona(ff, pe.id, ym), dv = todos ? null : pixDivisao(ff, pe.id, ym), nf = useState({data:hojeIso(), valor:"", origem:"", contaId:"", forma:"PIX"}), f = nf[0], setF = nf[1];
  var listaTodas = ff.pix.filter(function(x){ return (casa ? pixCasa(ff, x) : x.personaId===pe.id && !pixCasa(ff, x)) && (ym==="TODOS" || x.data.slice(0,7)===ym); }).sort(function(a, b){ return b.data.localeCompare(a.data); }), cbs = ff.contasBanc.filter(function(b){ return b.ativo && (casa ? (!!casaDe(ff, b.id) || b.personaId==="familia") : (!b.personaId || b.personaId===pe.id || b.prestadorId)); });
  var nab = useState(""), abre = nab[0], setAbre = nab[1], ab = abre ? abre.split("|") : [];
  var abrirDiv = function(id, tipo, el){ var r = el.getBoundingClientRect(); setAbre([id, tipo, Math.round(r.left), Math.round(r.bottom)].join("|")); };
  var rotAud = {CONFIRMADO:"Confirmado", PENDENTE:"Aguardando", NAOIDENT:"Não identificado", DIVERG:"Divergência"};
  var stDe = function(x){ return x.auditoria==="REJEITADO" ? "NAOIDENT" : (x.auditoria || "PENDENTE"); };
  var valSel = function(x){ var s = stDe(x); return s==="DIVERG" ? ((x.div && x.div.tipo)==="conta" ? "DIVC" : (x.div && x.div.tipo)==="data" ? "DIVD" : "DIVV") : s; };
  var contaDe = function(id){ return ff.contasBanc.find(function(b){ return b.id===id; }) || {}; };
  var prestDe = function(id){ var b = contaDe(id), pr = b.prestadorId && ff.prest.find(function(y){ return y.id===b.prestadorId; }), pe2 = !pr && b.personaId && ff.personas.find(function(y){ return y.id===b.personaId; }); return pr ? pr.nome : pe2 ? pe2.nome : "—"; };
  var nomeConta = function(id){ var b = contaDe(id), n = String(b.nome || "").replace(/^Conta\s+/i, ""), lo = n.toLowerCase(), bk = String(b.banco || "").toLowerCase(), k = bk ? lo.lastIndexOf(bk) : -1; if(k>0 && lo.slice(k).trim()===bk) n = n.slice(0, k).replace(/[\s—-]+$/, ""); n = n.replace(/\s*\([^)]*\)\s*$/, "").trim(); return n || "—"; };
  // FILTRO da lista (Lucas, 06/11/2026): as meninas conferem PIX por PIX; buscam por revendedora, valor, data ou conta e filtram por conta e por conferência. O total do cartão continua sendo o de todos os PIX.
  var nfl = useState({q:"", conta:"", conf:""}), fl = nfl[0], setFl = function(o){ nfl[1](Object.assign({}, fl, o)); };
  var semAc = function(t2){ return String(t2||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }, nq = semAc(fl.q);
  var lista = listaTodas.filter(function(x){ return (!nq || semAc((x.origem||"")+" "+BK(x.valor)+" "+x.valor+" "+br(x.data)+" "+(contaDe(x.contaId).banco||"")+" "+nomeConta(x.contaId)).indexOf(nq)>=0) && (!fl.conta || x.contaId===fl.conta) && (!fl.conf || stDe(x)===fl.conf); });
  var contasLista = []; listaTodas.forEach(function(x){ if(x.contaId && contasLista.indexOf(x.contaId)<0) contasLista.push(x.contaId); });
  var filtrando = !!(fl.q || fl.conta || fl.conf);
  var recTodos = r2(listaTodas.filter(function(x){ return stDe(x)!=="NAOIDENT"; }).reduce(function(s, x){ return s+x.valor; }, 0));
  // EDITAR o PIX na própria linha, só enquanto estiver "Aguardando" (Lucas, 18/11/2026)
  var ned = useState(null), ed = ned[0], setEd = ned[1], setE = function(o){ setEd(Object.assign({}, ed, o)); };
  var salvarEd = function(){ if(!(num(ed.valor)>0) || !ed.data) return; acao(c, "pix_editar", {id:ed.id, patch:{data:ed.data, valor:num(ed.valor), origem:ed.origem, contaId:ed.contaId}}); setEd(null); };
  var anotar = function(){ if(!(num(f.valor)>0) || !f.data) return; acao(c, "pix_add", {personaId:casa ? "familia" : pe.id, data:f.data, valor:num(f.valor), origem:f.origem, contaId:f.contaId, forma:f.forma}); setF(Object.assign({}, f, {valor:"", origem:""})); };
  var TC = "h-8 border-b border-border px-2.5 text-center text-[13px] tabular-nums";
  // linhas da tabela: cada dia com os seus PIX e, logo depois, a linha de TOTAL DO DIA (Anamaria, 03/11/2026)
  var linhas = [], dia = "", soma = 0, cont = 0, fecha = function(){ if(p.porDia && dia) linhas.push(e("tr",{key:"t"+dia, className:"border-t-2 border-border bg-white/5 font-semibold"}, e("td",{className:TC, colSpan:5}, "Total do dia "+br(dia)+(cont>1 ? " ("+cont+" PIX)" : "")), e("td",{className:TC}, BK(soma)), e("td",{className:TC, colSpan:2}, ""))); };
  lista.forEach(function(x){
    if(x.data!==dia){ fecha(); dia = x.data; soma = 0; cont = 0; }
    cont++;
    if(stDe(x)!=="NAOIDENT") soma = r2(soma+x.valor);
    linhas.push(e("tr",{key:x.id},
      e("td",{className:TC}, br(x.data)), e("td",{className:TC+" font-semibold"}, (x.origem||"—")+(x.auto ? " · Automático" : " · Manual")), e("td",{className:TC}, contaDe(x.contaId).banco||"—"), e("td",{className:TC}, nomeConta(x.contaId)), e("td",{className:TC}, casa ? e("div",{className:"flex flex-col items-center gap-1"}, e("span",null, casaDe(ff, x.contaId) || prestDe(x.contaId)), e("select",{value:x.casa || "", disabled:c.leitura, "aria-label":"Para qual casa", className:CAMPO+" w-44! text-center", style:{textAlignLast:"center"}, onChange:function(ev){ var v = ev.target.value; if(v.indexOf("p:")===0){ if(window.confirm("Mover este Pix para o sócio? Ele sai da Casa e entra nos números dele.")) acao(c, "pix_set", {id:x.id, patch:{personaId:v.slice(2), casa:""}}); } else acao(c, "pix_set", {id:x.id, patch:{casa:v}}); }}, e("option",{value:""}, "Sem casa definida"), CASAS_PIX.map(function(k){ return e("option",{key:k[0], value:k[0]}, k[1]); }), ff.personas.filter(function(q){ return q.tipo==="SOCIO" && q.ativo; }).map(function(q){ return e("option",{key:"p:"+q.id, value:"p:"+q.id}, "Mover para "+q.nome); }))) : prestDe(x.contaId)),
      e("td",{className:TC+(stDe(x)==="NAOIDENT" ? " line-through opacity-60" : "")}, BK(x.valor)),
      e("td",{className:TC}, e("span",{className:"inline-flex items-center justify-center gap-2"},
        e("select",{value:valSel(x), disabled:c.leitura, "aria-label":"Conferência", className:CAMPO+" w-40! text-center", style:{textAlignLast:"center"}, onChange:function(ev){ var v = ev.target.value; if(v==="DIVV") abrirDiv(x.id, "valor", ev.target); else if(v==="DIVC") abrirDiv(x.id, "conta", ev.target); else if(v==="DIVD") abrirDiv(x.id, "data", ev.target); else acao(c, "pix_aud", {id:x.id, auditoria:v}); }},
          stDe(x)==="PENDENTE" && e("option",{value:"PENDENTE"}, "Aguardando"),
          e("option",{value:"CONFIRMADO"}, "Confirmado"), e("option",{value:"NAOIDENT"}, "Não identificado"), e("option",{value:"DIVV"}, "Divergência de valor"), e("option",{value:"DIVC"}, "Divergência de conta"), e("option",{value:"DIVD"}, "Divergência de data")),
        stDe(x)==="PENDENTE" && !c.leitura && iconBtn("pencil-simple", "Editar PIX", function(){ setEd({id:x.id, data:x.data, valor:fmtN(x.valor), origem:x.origem||"", contaId:x.contaId||""}); }),
        stDe(x)==="DIVERG" && !c.leitura && e("button",{type:"button", onClick:function(ev){ if(ab[0]===x.id) setAbre(""); else abrirDiv(x.id, (x.div && x.div.tipo) || "valor", ev.currentTarget); }, className:"rounded-md border border-border px-2 text-[11px] font-semibold hover:bg-white/10"}, "Ver"))),
      e("td",{className:TC}, c.leitura ? null : iconBtn("trash", "Excluir PIX", function(){ if(window.confirm("Excluir este PIX?")) acao(c, "pix_del", {id:x.id}); }, true))));
    if(ed && ed.id===x.id) linhas.push(e("tr",{key:x.id+"ed", className:"bg-white/5"}, e("td",{colSpan:8, className:"border-b border-border px-2.5 py-2"},
      e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 md:grid-cols-[150px_130px_minmax(0,1fr)_minmax(0,1fr)_auto]"},
        e("div",null, e(Rotulo,{t:"Data"}), e("input",{type:"date", value:ed.data, "aria-label":"Data", className:CAMPO+" text-center", onChange:function(ev){ setE({data:ev.target.value}); }})),
        e("div",null, e(Rotulo,{t:"Valor (R$)"}), e("input",{value:ed.valor, "aria-label":"Valor", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ setE({valor:ev.target.value.replace(/[^\d,.]/g,"")}); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }})),
        e("div",null, e(Rotulo,{t:"Revendedora"}), e("input",{value:ed.origem, "aria-label":"Revendedora", className:CAMPO, onChange:function(ev){ setE({origem:ev.target.value}); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }})),
        e("div",null, e(Rotulo,{t:"Conta que recebeu"}), e("select",{value:ed.contaId, "aria-label":"Conta que recebeu", className:CAMPO, onChange:function(ev){ setE({contaId:ev.target.value}); }}, e("option",{value:""}, "Sem conta definida"), cbs.concat(ed.contaId && !cbs.some(function(b){ return b.id===ed.contaId; }) ? [contaDe(ed.contaId)] : []).map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
        e("span",{className:"inline-flex items-center gap-2"}, e(Botao,{principal:true, desabilitado:!(num(ed.valor)>0) || !ed.data, onClick:salvarEd}, "Salvar"), e(Botao,{onClick:function(){ setEd(null); }}, "Cancelar"))))));
  });
  fecha();
  var fechado = p.aberto===false;
  return e("div",{className:fechado ? "cursor-pointer" : "", onClick:fechado ? p.onToggle : undefined}, e(Bloco,{ouro:true, cls:fechado ? "[&>div:last-child]:hidden" : "", t:pe.nome, dir:e("span",{className:"inline-flex items-center gap-3 tabular-nums"}, (ym==="TODOS" ? "Todos os meses" : nomeMes(ym))+" · "+BK(todos ? recTodos : t.pix.recebido), p.aberto===true && e("button",{type:"button", onClick:p.onToggle, className:"rounded-md border border-[#1a1306]/40 px-2 text-[11px] font-semibold"}, "Recolher"))},
    // Anotar PIX voltou (Lucas, 23/11/2026): tinha saído em 21/11 (v0.21.77) e não havia outro jeito de lançar o Pix da família
    !c.leitura && e("div",{className:"grid grid-cols-2 items-end gap-x-3 gap-y-2 border-t border-border pb-3 pt-3 md:grid-cols-[130px_120px_minmax(0,1fr)_minmax(0,1fr)_120px]"},
      e("div",null, e(Rotulo,{t:"Data"}), e("input",{type:"date", value:f.data, "aria-label":"Data", className:CAMPO+" text-center", onChange:function(ev){ setF(Object.assign({}, f, {data:ev.target.value})); }})),
      e("div",null, e(Rotulo,{t:"Valor (R$)"}), e("input",{value:f.valor, "aria-label":"Valor", className:CAMPO+" text-center tabular-nums", onChange:function(ev){ setF(Object.assign({}, f, {valor:ev.target.value.replace(/[^\d,.]/g,"")})); }, onKeyDown:function(ev){ if(ev.key==="Enter") anotar(); }})),
      e("div",null, e(Rotulo,{t:"Revendedora"}), e("input",{value:f.origem, "aria-label":"Revendedora", className:CAMPO, onChange:function(ev){ setF(Object.assign({}, f, {origem:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") anotar(); }})),
      e("div",null, e(Rotulo,{t:"Conta que recebeu"}), e("select",{value:f.contaId, "aria-label":"Conta que recebeu", className:CAMPO, onChange:function(ev){ setF(Object.assign({}, f, {contaId:ev.target.value})); }}, e("option",{value:""}, "Sem conta definida"), cbs.map(function(b){ return e("option",{key:b.id, value:b.id}, contaLabel(ff, b.id)); }))),
      e(Botao,{principal:true, desabilitado:!(num(f.valor)>0) || !f.data, onClick:anotar}, "Anotar PIX")),
    listaTodas.length>0 && e("div",{className:"flex flex-wrap items-end gap-2 pb-2"},
      e("div",{className:"min-w-[10rem] flex-1"}, e(Rotulo,{t:"Buscar"}), e("input",{type:"search", value:fl.q, "aria-label":"Buscar na lista", placeholder:"Revendedora, valor, data ou conta", className:CAMPO, onChange:function(ev){ setFl({q:ev.target.value}); }})),
      e("div",{className:"w-52"}, e(Rotulo,{t:"Conta"}), e("select",{value:fl.conta, "aria-label":"Filtrar por conta", className:CAMPO, onChange:function(ev){ setFl({conta:ev.target.value}); }}, e("option",{value:""}, "Todas as contas"), contasLista.map(function(id){ return e("option",{key:id, value:id}, nomeConta(id)+(contaDe(id).banco ? " · "+contaDe(id).banco : "")); }))),
      e("div",{className:"w-44"}, e(Rotulo,{t:"Conferência"}), e("select",{value:fl.conf, "aria-label":"Filtrar por conferência", className:CAMPO, onChange:function(ev){ setFl({conf:ev.target.value}); }}, e("option",{value:""}, "Todas"), e("option",{value:"PENDENTE"}, "Aguardando"), e("option",{value:"CONFIRMADO"}, "Confirmado"), e("option",{value:"NAOIDENT"}, "Não identificado"), e("option",{value:"DIVERG"}, "Divergência"))),
      filtrando && e(Botao,{onClick:function(){ setFl({q:"", conta:"", conf:""}); }}, "Limpar"),
      casa && !c.leitura && listaTodas.some(function(x){ return !x.casa; }) && e(Botao,{onClick:function(){ var n0 = ff.pix.filter(function(x){ return pixCasa(ff, x) && !x.casa; }).length; if(window.confirm("Marcar os "+n0+" Pix da Casa que estão sem casa como Casa Alphaville?")) acao(c, "pix_casa_lote", {casa:"casaalphaville"}); }}, "Marcar os sem casa como Alphaville"),
      e("span",{className:"pb-1.5 text-[13px] tabular-nums"}, lista.length+" de "+listaTodas.length+" PIX")),
    lista.length===0 ? e("p",{className:"py-3 text-center text-[13px]"}, filtrando ? "Nenhum PIX com esse filtro." : ym==="TODOS" ? "Nenhum PIX lançado." : "Nenhum PIX neste mês.")
    : e(TabelaP,{minW:1100, cols:[{t:"Data", w:90}, {t:"Revendedora"}, {t:"Banco", w:120}, {t:"Conta"}, {t:"Favorecido", w:170}, {t:"Valor", w:120}, {t:"Conferência", w:220}, {t:"", w:56}]}, linhas),
    ab.length>0 && lista.some(function(x){ return x.id===ab[0]; }) && e(DivPix,{key:abre, tipo:ab[1], x:lista.find(function(x){ return x.id===ab[0]; }), c:c, ff:ff, cbs:cbs, left:Math.max(8, Math.min(+ab[2], window.innerWidth-300)), top:Math.max(8, Math.min(+ab[3]+4, window.innerHeight-330)), onFecha:function(){ setAbre(""); }})));
}
// RESUMO NO TOPO DA TELA (Marcus, 04/11/2026): 3 blocos de todos os sócios juntos; filtrando um sócio, os blocos são só dele. Mês que já passou não mostra meta.
var ALT_RESUMO = 272;   // os 3 (ou 4) blocos do resumo têm a MESMA altura; a lista rola dentro (Marcus, 06/11/2026)
function ResumoPix(p){
  var c = p.c, ff = c.ff, ym = p.ym, todos = ym==="TODOS", pes = p.pes, atual = !todos && ym===hojeYm(), ids = {};
  pes.forEach(function(pe){ ids[pe.id] = 1; });
  var contaDe = function(id){ return ff.contasBanc.find(function(b){ return b.id===id; }) || {}; };
  var prestDe = function(id){ var b = contaDe(id), pr = b.prestadorId && ff.prest.find(function(y){ return y.id===b.prestadorId; }), pe2 = !pr && b.personaId && ff.personas.find(function(y){ return y.id===b.personaId; }); return pr ? pr.nome : pe2 ? pe2.nome : "—"; };
  var nomeContaR = function(id){ var b = contaDe(id), n = String(b.nome || "").replace(/^Conta\s+/i, ""), lo = n.toLowerCase(), bk = String(b.banco || "").toLowerCase(), k = bk ? lo.lastIndexOf(bk) : -1; if(k>0 && lo.slice(k).trim()===bk) n = n.slice(0, k).replace(/[\s—-]+$/, ""); return n.replace(/\s*\([^)]*\)\s*$/, "").trim(); };
  var rotuloFav = function(id){ if(!id || !contaDe(id).id) return "Sem conta definida"; if(casaDe(ff, id)) return casaDe(ff, id); var fav = prestDe(id), nc = nomeContaR(id), bk = contaDe(id).banco; return fav+(bk ? " · "+bk : "")+(nc && fav.toLowerCase().indexOf(nc.toLowerCase())<0 && nc.toLowerCase().indexOf(fav.toLowerCase())<0 && nc.toLowerCase().indexOf(String(bk||"").toLowerCase())<0 ? " · "+nc : ""); };
  var nomesFav = {}, casa = !!p.casa;
  var vl = ff.pix.filter(function(x){ return (casa ? pixCasa(ff, x) : ids[x.personaId] && !pixCasa(ff, x)) && (todos || x.data.slice(0,7)===ym) && x.auditoria!=="REJEITADO" && x.auditoria!=="NAOIDENT"; });
  var recL = r2(vl.reduce(function(s, x){ return s+x.valor; }, 0)), rec = recL, dir = 0, pres = 0, meta = 0, um = pes.length===1 ? pes[0] : null;
  if(!casa){ var mesesC = todos ? Object.keys(vl.reduce(function(o, x){ o[x.data.slice(0,7)] = 1; return o; }, {})) : [ym]; rec = 0;   // Direto e Prestadores também em "Todos os meses": soma mês a mês (Marcus, 06/11/2026)
    pes.forEach(function(pe){ mesesC.forEach(function(m){ var dv = pixDivisao(ff, pe.id, m); rec += pixDoMes(ff, pe.id, m); dir += dv.direto; pres += dv.prestadores; if(!todos) meta += (ff.pixMeta[pe.id+"|"+m]||0); }); }); rec = r2(rec); dir = r2(dir); pres = r2(pres); }
  var pct = function(v, base){ return base>0 ? (v/base*100).toFixed(1).replace(".", ",")+"%" : ""; };
  var porFav = {}, porDia = {}, nDia = {};
  vl.forEach(function(x){ var k = x.contaId || "—", d = todos ? x.data.slice(0,7) : x.data; nomesFav[k] = rotuloFav(x.contaId); porFav[k] = r2((porFav[k]||0)+x.valor); porDia[d] = r2((porDia[d]||0)+x.valor); nDia[d] = (nDia[d]||0)+1; });
  var rodTotal = {r:"Recebido", v:BK(casa ? recL : rec), p:vl.length+" PIX"}, rodFav = {r:"Total enviado", v:BK(recL), p:vl.length+" PIX"}, rodDia = {r:"Total", v:BK(recL), p:vl.length+" PIX"};   // o total fica numa linha fixa no fundo de cada bloco
  var porCasaPix = {}; vl.forEach(function(x){ var k = x.casa || "__sem"; porCasaPix[k] = r2((porCasaPix[k] || 0)+x.valor); });
  var linCasas = CASAS_PIX.concat([["__sem", "Sem casa definida"]]).filter(function(k){ return porCasaPix[k[0]]; }).map(function(k){ return {r:k[1], v:BK(porCasaPix[k[0]]), p:pct(porCasaPix[k[0]], recL)}; });
  var linTotal = casa ? linCasas
    : [{r:"Direto", v:BK(dir), p:pct(dir, rec)}, {r:"Prestadores", v:BK(pres), p:pct(pres, rec)}]
      .concat(atual && !um ? pes.filter(function(pe){ return ["marco", "anabeatriz", "marcus", "lucas", "anamaria"].indexOf(pe.id)>=0; }).map(function(pe){ var t = totaisPersona(ff, pe.id, ym); return {r:"Meta · "+pe.nome, v:t.pix.meta>0 ? BK(t.pix.meta) : "Sem meta", p:t.pix.meta>0 ? Math.round(t.pix.recebido/t.pix.meta*100)+"% da meta" : ""}; }) : [])   // meta de cada sócio em uma linha (Marcus, 04/11/2026)
      .concat(atual && meta>0 ? [{r:"Meta do mês", v:BK(meta), p:"", total:!um}, {r:"Falta", v:BK(Math.max(0, r2(meta-rec))), p:Math.round(rec/meta*100)+"% da meta"}] : []);
  var linFav = Object.keys(porFav).sort(function(a, b){ return porFav[b]-porFav[a]; }).map(function(k){ return {r:nomesFav[k], v:BK(porFav[k]), p:pct(porFav[k], recL)}; });
  var linDia = Object.keys(porDia).sort().reverse().map(function(d){ return {r:todos ? nomeMes(d) : br(d), v:BK(porDia[d]), p:nDia[d]+" PIX"}; });
  var quem = casa ? " · Casa" : um ? " · "+um.nome : " · todos os sócios", vazio = [{r:"Nenhum PIX", v:BK(0), p:""}];
  var famIds = membrosFamilia(ff), parte = famIds.length ? Math.floor(recL/famIds.length*100)/100 : 0, resto = r2(recL-parte*famIds.length);
  var linDiv = famIds.map(function(id, i){ var pp = ff.personas.find(function(y){ return y.id===id; }); return {r:pp ? pp.nome : id, v:BK(i===0 ? r2(parte+resto) : parte), p:famIds.length ? pct(1, famIds.length) : ""}; });
  return e("div",null,
    e("div",{className:"grid grid-cols-1 items-start gap-3 pb-3 "+(casa ? "md:grid-cols-4" : "md:grid-cols-3")},
      e(BlocoResumo,{t:(todos ? "Total de todos os meses" : "Total do mês")+quem, compacto:true, altura:ALT_RESUMO, rodape:rodTotal, cab:["Item", "Valor", "Parte"], linhas:linTotal}),
      e(BlocoResumo,{t:"Enviado por favorecido"+quem, compacto:true, altura:ALT_RESUMO, rodape:rodFav, cab:["Favorecido", "Enviado", "Do total"], linhas:linFav}),
      e(BlocoResumo,{t:(todos ? "Por mês" : "Por dia")+quem, compacto:true, altura:ALT_RESUMO, rodape:rodDia, cab:[todos ? "Mês" : "Dia", "Total", "PIX"], linhas:linDia}),
      casa && e(BlocoResumo,{t:"Divisão da família", compacto:true, altura:ALT_RESUMO, rodape:{r:"Total da Casa", v:BK(recL), p:vl.length+" PIX"}, cab:["Pessoa", "Parte", "Fração"], linhas:linDiv})),
    um && atual && e("div",{className:"flex items-center justify-center gap-2 pb-3 text-[13px]"}, "Meta do mês de "+um.nome+" (R$):",
      e("input",{key:meta, defaultValue:meta ? fmtN(meta) : "", readOnly:!!c.leitura, placeholder:"definir", "aria-label":"Meta do mês", className:CAMPO+" w-36! text-center tabular-nums", onBlur:function(ev){ var v = num(ev.target.value); if(v!==meta) acao(c, "pix_meta", {personaId:um.id, ym:ym, valor:v}); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }})));
}
function AbaFfPix(){
  var c = useFF(), edita = c.pode || temAutorizacao("ff_pix", c.s.usuario), leitura = !edita && temAutorizacao("ff_pix_ver", c.s.usuario); c = Object.assign({}, c, {pode:edita || leitura, leitura:leitura});   // ff_pix_ver = só consulta (Bruna, 06/11/2026): sem formulário, sem apagar, sem mudar a conferência   // quem tem só a autorização ff_pix abre esta tela e nenhuma outra da família
  var ff = c.ff, comPix = {}; ff.pix.forEach(function(x){ comPix[x.data.slice(0,7)] = 1; });
  // abre no último mês que tem PIX lançado (não no mês de hoje, que pode estar vazio); "Todos os meses" mostra tudo
  var ultimo = Object.keys(comPix).filter(function(m){ return m<=hojeYm(); }).sort().pop() || hojeYm();
  var ms = useState(ultimo), ym = ms[0], setYm = ms[1], pf = useState(""), quem = pf[0], setQuem = pf[1], pdd = useState(false), porDia = pdd[0], setPorDia = pdd[1], pab = useState({}), abertos = pab[0], setAbertos = pab[1];
  var mesesOp = Object.keys(Object.keys(comPix).concat([hojeYm()]).reduce(function(o, k){ o[k] = 1; return o; }, {})).sort().reverse();   // só os meses com PIX e o mês de hoje
  var pessoas = ff.personas.filter(function(p){ return p.ativo && p.mostrarPix && p.id!=="familia" && !(/^Casa/i.test(p.nome) && !ff.pix.some(function(x){ return x.personaId===p.id; })); }), ehCasa = quem==="__casa", casaP = {id:"casa", nome:"Casa"};   // Casa/Família saiu da lista: a Casa agora é uma tela própria (Lucas, 05/11/2026); casas sem PIX (Casa/Praia) ficam escondidas até terem PIX (Marcus, 06/11/2026)
  return e(Guarda,{c:c}, e(Pagina,null,
    e(PageHead,{t:"PIX revendedoras"},
      e("select",{value:ym, "aria-label":"Mês", className:CAMPO+" w-44!", onChange:function(ev){ setYm(ev.target.value); }}, e("option",{value:"TODOS"}, "Todos os meses"), mesesOp.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })),
      e("select",{value:porDia ? "1" : "", "aria-label":"Total por dia", className:CAMPO+" w-48!", onChange:function(ev){ setPorDia(ev.target.value==="1"); }}, e("option",{value:""}, "Sem total por dia"), e("option",{value:"1"}, "Com total por dia")),
      e("select",{value:quem, "aria-label":"Sócio", className:CAMPO+" w-40!", onChange:function(ev){ setQuem(ev.target.value); }}, e("option",{value:""}, "Todos os sócios"), pessoas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); }), e("option",{value:"__casa"}, "Casa"))),
    e(ResumoPix,{c:c, ym:ym, casa:ehCasa, pes:ehCasa ? [] : pessoas.filter(function(p){ return !quem || p.id===quem; })}),
    (ehCasa ? [casaP] : quem ? pessoas.filter(function(p){ return p.id===quem; }) : ["marco", "anabeatriz", "marcus", "lucas", "anamaria"].map(function(id){ return pessoas.find(function(p){ return p.id===id; }); }).filter(Boolean).concat([casaP])).map(function(p){ return e(CartaoPix,{key:p.id+ym+porDia, c:c, p:p, casa:p.id==="casa", ym:ym, porDia:porDia, aberto:quem ? undefined : !!abertos[p.id], onToggle:function(){ var o = Object.assign({}, abertos); o[p.id] = !o[p.id]; setAbertos(o); }}); })));
}

// ───────────────── Prestadores ─────────────────
// 18/11/2026 (Marcus: "azul, diminui fonte, mais compacto, sem perder nada"): tela refeita no bloco padrão do Financeiro (BlocoPainel azul, compacto, letra de 11 px) e na TabelaPlanilha.
// Nada saiu: o resumo (em aberto e saldo por sócio) virou tabela com total; cada prestador é um bloco que abre e fecha na barra azul (todos nascem fechados; Abrir todos e Fechar todos em cima da lista);
// o filtro de mês virou a coluna Mês das tabelas (filtro no título da coluna, e o total de baixo acompanha o filtro); as explicações viraram dica ao passar o mouse.
// Novo: cada dívida mostra Pago e Falta (o repasse liquida a dívida mais antiga primeiro, baixaDividas) e o Prazo é trocado na própria linha (vale como vencimento em Contas a pagar).
var mesTxt = function(iso){ return nomeMes(String(iso||"").slice(0, 7)); };
var somaDe = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(Number(l[k]) || 0); }, 0)); };
function CampoSelI(p){ return e("div",{className:"flex min-w-0 items-center gap-1.5 "+(p.cls||"")}, e("label",{htmlFor:p.id, className:"shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("select",{id:p.id, value:p.value, onChange:function(ev){ p.onChange(ev.target.value); }, className:SEL_AZUL}, p.opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); }
var BTN_BARRA = "h-8 rounded-md border border-[#5b74ad] bg-[#22365e] px-3 text-[11px] font-semibold hover:bg-[#2b4170]";   // botão da faixa de cima da lista de prestadores
var SEL_AZUL = CAMPO+" !w-auto min-w-[7rem] max-w-full !border-[#6ea0f0]/60 !bg-[#27508f] !text-[11px]";   // menu suspenso: azul mais claro e menor (Marcus, 18/11/2026)
var FORM_PREST = "flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-border px-2 py-0.5";   // linha de lançamento: rótulo de 11 px em cima, campo e botão de 32 px na mesma linha; em tela estreita os campos descem (nada é cortado)
var FAIXA_PREST = "w-20 shrink-0 text-[11px] font-bold uppercase tracking-[.05em]";   // título pequeno de seção (sem barra colorida)
function CampoTxt(p){ return e("div",{className:"flex min-w-0 items-center gap-1.5 "+(p.cls||"")}, e("label",{htmlFor:p.id, className:"shrink-0 whitespace-nowrap text-[11px] font-medium uppercase tracking-[.05em]"}, p.t), e("input",{id:p.id, value:p.value, type:p.type||"text", className:CAMPO+(p.type==="date" ? " [color-scheme:dark]" : ""), onChange:function(ev){ p.onChange(ev.target.value); }, onKeyDown:p.onEnter ? function(ev){ if(ev.key==="Enter") p.onEnter(); } : undefined})); }
var fixo = function(el){ return e("div",{className:"shrink-0"}, el); };   // o botão do formulário não encolhe: o rótulo nunca é cortado
var botaoLinha = function(rot, titulo, fn){ return e("button",{type:"button", title:titulo, "aria-label":titulo, onClick:function(ev){ ev.stopPropagation(); fn(); }, className:"h-[18px] px-2 text-[11px] font-semibold leading-none hover:underline"}, rot); };

function DescTip(p){   // 4 primeiras palavras; passar o mouse mostra o texto completo (Marcus, 18/11/2026). O bloco é "fixed" (não é cortado pela rolagem da tabela) e fecha sozinho: mouse fora, rolagem ou clique.
  var st = useState(null), pos = st[0], setPos = st[1], ref = React.useRef(null), pal = String(p.v || "").split(/\s+/).filter(Boolean), longo = pal.length>(p.n || 4);
  var cp = pal.slice(0, p.n || 4); while(longo && cp.length>1 && /^(de|da|do|dos|das|e|·)$/i.test(cp[cp.length-1])) cp.pop();   // o texto curto nunca termina em "de", "da", "e"...
  var curto = cp.join(" ");
  React.useEffect(function(){
    if(!pos) return undefined;
    var fecha = function(){ setPos(null); };
    var move = function(ev){ if(!ref.current || !ref.current.contains(ev.target)) fecha(); };
    document.addEventListener("mousemove", move); document.addEventListener("mousedown", fecha); window.addEventListener("scroll", fecha, true); window.addEventListener("blur", fecha);
    return function(){ document.removeEventListener("mousemove", move); document.removeEventListener("mousedown", fecha); window.removeEventListener("scroll", fecha, true); window.removeEventListener("blur", fecha); };
  }, [pos, setPos]);
  return e("span",{ref:ref, className:"inline-block max-w-full overflow-hidden whitespace-nowrap align-middle leading-[13px] "+(longo ? "cursor-help" : ""), onMouseEnter:longo ? function(ev){ var r = ev.currentTarget.getBoundingClientRect(); st[1]({x:r.left+r.width/2, abaixo:r.bottom+4, acima:window.innerHeight-r.top+4, cima:r.bottom>window.innerHeight-150}); } : undefined, onMouseLeave:function(){ st[1](null); }},
    curto,
    pos && e("span",{role:"tooltip", style:Object.assign({position:"fixed", width:300, left:Math.max(8, Math.min(pos.x-150, window.innerWidth-308))}, pos.cima ? {bottom:pos.acima} : {top:pos.abaixo}), className:"pointer-events-none z-[100] block whitespace-normal rounded-lg border border-[#6a81b4] bg-gradient-to-b from-[#2f5aa8] to-[#0f1729] px-3 py-2 text-left text-[11px] font-medium leading-[15px] text-white shadow-xl"}, p.v));
}
function DetPrest(p){   // o que abre embaixo da linha do prestador (Prestadores › tabela): sócio, chave Pix, dívidas e repasses
  var c = p.c, ff = c.ff, x = p.x, nd = useState({data:hojeIso(), valor:"", prazo:"", descricao:""}), d = nd[0], setD = nd[1];
  var nr = useState({data:hojeIso(), valor:"", origem:"", forma:"PIX", contaTxt:"", pixRev:false}), r = nr[0], setR = nr[1];
  var ed = useState(false), editando = ed[0], dr = useState(null), rasc = dr[0], aD = useState(false), aberD = aD[0], aR = useState(false), aberR = aR[0];   // formulários de lançar: fechados até clicar em + Lançar
  var irCartao = function(id){ setTimeout(function(){ var el = document.getElementById(id); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth", block:"nearest"}); }, 80); };   // o cartão de lançar fica embaixo das colunas: a tela desce até ele
  var vr = useState(null), ver = vr[0];   // comprovante aberto no cartão: {l, nome, url}
  var cf = useState(null), conf = cf[0], pedir = function(msg, fn){ cf[1]({msg:msg, fn:fn}); };   // "Tem certeza?" antes de excluir (Marcus, 18/11/2026: a dívida da Truck Plaza foi apagada sem aviso)
  var recente = function(a, b){ return a.data.localeCompare(b.data); };   // do mais antigo (em cima) para o mais novo (embaixo) (Marcus, 18/11/2026)
  var bx = baixaDividas(ff, x.id), sd = saldoPrestador(ff, x.id), socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO"; });
  var cbp = (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===x.id && z.ativo!==false; })[0];
  var lancarDivida = function(){ if(!(num(d.valor)>0)) return; acao(c, "divida_add", {prestId:x.id, data:d.data, valor:num(d.valor), prazo:d.prazo, descricao:d.descricao}); setD(Object.assign({}, d, {valor:"", descricao:""})); aD[1](false); };
  var lancarRepasse = function(){ if(!(num(r.valor)>0) || !r.origem.trim()) return; acao(c, "repasse_add", {prestId:x.id, data:r.data, valor:num(r.valor), origem:r.origem, forma:r.forma, contaTxt:r.contaTxt, pixRevendedora:r.pixRev}); setR(Object.assign({}, r, {valor:"", origem:""})); aR[1](false); };

  var linhasDv = ff.dividas.filter(function(y){ return y.prestId===x.id; }).sort(recente).map(function(y){ var b = bx.porId[y.id];
    return {id:y.id, y:y, data:br(y.data), mes:mesTxt(y.data), desc:[y.titulo, y.descricao, y.codigo].filter(Boolean).join(" · ") || "—", prazo:y.prazo || "", valor:y.valor, pago:b ? b.pago : "", falta:b ? Math.max(0, b.falta) : "", acao:"Excluir"}; });
  var colsDv = [{k:"data", t:"Data", w:"4.5rem"}, {k:"desc", t:"Descrição", render:function(v){ return e(DescTip,{v:v, n:3}); }},   // descrição longa quebra em linhas (nada cortado e a tabela não rola para o lado)
    {k:"prazo", t:"Prazo", w:"6rem", render:function(v, l){ return l.y.valor>0 ? e("input",{type:"date", key:l.id+"|"+l.y.prazo, defaultValue:l.y.prazo || "", "aria-label":"Prazo da dívida", title:"Prazo de pagamento. Sem prazo, vale o último dia do mês.", className:"h-[18px] w-[5.25rem] rounded border border-white/20 bg-transparent px-1 text-[11px] text-white [color-scheme:dark]", onClick:function(ev){ ev.stopPropagation(); }, onBlur:function(ev){ if(ev.target.value!==(l.y.prazo||"")) acao(c, "divida_set", {id:l.id, patch:{prazo:ev.target.value}}); }}) : "—"; }},
    {k:"valor", t:"Dívida", w:"5.25rem", fmt:BK, cor:function(){ return "text-destructive"; }}, {k:"pago", t:"Pago", w:"5.25rem", fmt:BK, cor:function(){ return "text-success"; }}, {k:"falta", t:"Falta", w:"4.75rem", fmt:BK, cor:function(l){ return l.falta>0.005 ? "text-destructive" : "text-success"; }},
    {k:"acao", t:"Excluir", w:"4.75rem", render:function(v, l){ return botaoLinha("Excluir", "Excluir dívida", function(){ pedir("a dívida de "+BK(l.valor)+" de "+l.data, function(){ acao(c, "divida_del", {id:l.id}); }); }); }}];

  // COMPROVANTE (Marcus, 19/11/2026): o Pix automático guarda o comprovante no próprio PIX (ff.pix); pago lançado à mão ou vindo do Direcionar guarda no repasse. A imagem fica no servidor (/api/anexos, módulo ff).
  var linhasRp = ff.repasses.filter(function(y){ return y.prestId===x.id; }).sort(recente).map(function(y){ var auto = !!y.origemPixLancId, dir = !!y.origemDirecionar, rot = auto ? "PIX automático" : dir ? "Direcionar" : "Lançado à mão";
    var px = auto ? ((ff.pix || []).filter(function(q){ return q.id===y.origemPixLancId; })[0] || null) : null, fonte = px || y, usado = px && (ff.pixUsados || {})[px.id];
    return {id:y.id, pixId:px ? px.id : "", data:br(y.data), forma:y.forma || "—", quem:((y.origem==="PIX revendedora" ? (px || {}).origem : "") || y.origem || "—"), origem:(y.forma && y.forma!=="PIX" ? y.forma+" · " : "")+rot, valor:y.valor, trava:auto || dir, acao:auto ? "Automático" : dir ? "Direcionar" : "Excluir", compKey:fonte.compKey || "", usado:usado ? (usado.rev || "revendedora") : ""}; });
  var subirComp = function(l, arq){ if(!arq) return; lerAnexo(arq).then(function(a){ return enviarAnexo("ff", a); }).then(function(sv){ acao(c, l.pixId ? "pix_comp" : "repasse_comp", {id:l.pixId || l.id, key:sv.key, nome:arq.name, tipo:arq.type}); }, function(err){ c.d({type:"AVISO", txt:((err && err.message) ? err.message+" " : "")+"Não consegui anexar o comprovante."}); }); };
  // O PRÓPRIO VALOR é o link do comprovante (Marcus, 19/11/2026): com comprovante o valor fica sublinhado e abre o comprovante num cartão (um clique fecha); sem comprovante o valor é normal e o clique oferece anexar (foto ou PDF).
  var abrirComp = function(l){ buscarAnexo(l.compKey).then(function(r){ if(r.mime==="application/pdf") return abrirAnexo(l.compKey); vr[1]({l:l, nome:r.nome || "", url:r.url}); }).catch(function(){ c.d({type:"AVISO", txt:"Não consegui abrir o comprovante."}); }); };
  var celValor = function(v, l){ return l.compKey
    ? e("button",{type:"button", title:"Abrir o comprovante deste pagamento", "aria-label":"Abrir o comprovante de "+BK(v), onClick:function(ev){ ev.stopPropagation(); abrirComp(l); }, className:"cursor-pointer font-semibold underline decoration-1 underline-offset-2 hover:opacity-80"}, BK(v))
    : e("label",{title:"Sem comprovante. Clique para anexar (foto ou PDF).", onClick:function(ev){ ev.stopPropagation(); }, className:"cursor-pointer hover:underline hover:decoration-dotted hover:underline-offset-2"}, BK(v),
        e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Anexar comprovante de "+BK(v), className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; subirComp(l, f); }})); };
  var quebra = function(v){ return e("span",{className:"inline-block whitespace-normal break-words leading-[13px]"}, v); };   // nome e origem quebram em linhas em vez de empurrar a tabela para o lado
  var colsRp = [{k:"data", t:"Data", w:"4.5rem"}, {k:"quem", t:"Quem pagou", render:function(v, l){ return e(React.Fragment,null, e(DescTip,{v:v, n:2}), l.usado ? e("span",{className:"block text-[11px] font-semibold leading-[13px] text-primary", title:"Este PIX já foi usado no acerto de "+l.usado+": não entra de novo."}, "usado no acerto") : null); }}, {k:"valor", t:"Pago", w:"5.25rem", fmt:BK, cor:function(){ return "text-success"; }, render:function(v, l){ return celValor(v, l); }},
    {k:"acao", t:"Excluir", w:"4.75rem", render:function(v, l){ if(l.usado) return botaoLinha("Soltar", "Soltar o PIX do acerto de "+l.usado+" (só se o acerto foi cancelado)", function(){ if(window.confirm("Soltar este PIX do acerto de "+l.usado+"?\n\nSó solte se o acerto foi cancelado. Se o acerto já foi concluído, o mesmo valor entra duas vezes.")) acao(c, "pix_soltar", {id:l.pixId}); });
      return l.trava ? e("span",{className:"cursor-help", title:l.origem+" · não se exclui aqui."}, v) : botaoLinha("Excluir", "Excluir repasse", function(){ pedir("o pago de "+BK(l.valor)+" de "+l.data, function(){ acao(c, "repasse_del", {id:l.id}); }); }); }}];


  // os totais ficam todos na MESMA linha do fundo do bloco, nas quatro colunas (Marcus, 18/11/2026: "o total fica na linha lá no fundo")
  var totDv = somaDe(linhasDv, "valor"), totDvPago = somaDe(linhasDv, "pago"), totDvFalta = somaDe(linhasDv, "falta"), totRp = somaDe(linhasRp, "valor");
  var dvPos = ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor>0; }).sort(recente);
  var totDv4 = somaDe(dvPos, "valor"), totPago4 = r2(Object.keys(bx.porId).reduce(function(t, k){ return t+bx.porId[k].pago; }, 0)+bx.sobra), falta4 = bx.falta;
  var nomeCred = function(cr){ if(cr.tipo==="pix"){ var rp = ff.repasses.find(function(q){ return q.id===cr.rid; }); return rp && rp.origem ? rp.origem : "Repasse"; } return "Desconto"; };
  var COL = "flex min-w-0 flex-col border-t border-[#5b74ad] bg-[#1b2a4a] @min-[1155px]:border-t-0 @min-[1155px]:border-l";
  var CAB = "flex h-8 shrink-0 items-center justify-between gap-2 border-b border-[#5b74ad] bg-[#2b4170] px-2 text-[11px] font-bold uppercase";
  var RODA = "mt-auto flex h-10 shrink-0 items-center justify-between gap-2 border-t-2 border-[#7f98cf] bg-[#2b4170] px-2 text-[13px] font-semibold";   // a linha de total: mt-auto empurra para o fundo e as quatro colunas têm a mesma altura
  var BTN_RODA = "h-8 min-w-0 flex-1 rounded-md border border-white/25 px-2 text-[11px] font-semibold hover:bg-white/10";
  var RODA_G = "mt-auto grid h-10 shrink-0 items-stretch border-t-2 border-[#7f98cf] bg-[#2b4170] text-[11px] font-semibold";   // linha de total em grade: cada célula cai debaixo da sua coluna, com traço entre elas
  var celT = function(txt, cls){ return e("span",{className:"flex items-center justify-center border-l border-[#5b74ad] px-1 first:border-l-0 "+(cls || "")}, txt); };
  var MINI = "h-6 shrink-0 rounded border border-white/25 px-2 text-[11px] font-semibold hover:bg-white/10";
  var Stk = function(t, el, cls){ return e("label",{className:"flex min-w-0 flex-col gap-0.5 text-[11px] font-medium uppercase tracking-[.05em] "+(cls||"")}, t, el); };
  var LIN = "grid grid-cols-[5rem_minmax(0,1fr)] border-b border-[#3d5086] text-[11px]";
  var LIN_T = "flex min-h-[24px] items-center whitespace-nowrap border-r border-[#3d5086] bg-[#22365e] px-1.5 font-semibold uppercase tracking-[.05em]";
  var LIN_V = "flex min-h-[24px] min-w-0 items-center break-words px-2 text-[11px] ";
  var Lin = function(t, v, cor){ return e("div",{className:LIN}, e("span",{className:LIN_T}, t), e("span",{className:LIN_V+(cor||"")}, v)); };   // uma linha de tabela: rótulo | valor
  var LinCtl = function(t, ctl){ return e("div",{className:LIN}, e("span",{className:LIN_T}, t), e("span",{className:"flex min-w-0 items-center p-0.5"}, ctl)); };   // o mesmo, com campo para editar
  var inp = function(id, v, fn, tipo, extra){ return e("input",{id:id, value:v, type:tipo||"text", className:CAMPO+" w-full"+(tipo==="date" ? " [color-scheme:dark]" : ""), onChange:function(ev){ fn(ev.target.value); }, onKeyDown:extra ? function(ev){ if(ev.key==="Enter") extra(); } : undefined}); };
  var rolagem = function(el, mw){ return e("div",{className:"min-w-0 flex-1 overflow-x-auto [&_td]:!h-[22px] [&_td]:!px-1.5 [&_td]:!py-0.5 [&_td]:!text-[11px] [&_td]:!leading-[14px] [&_th]:!h-6 [&_th]:!px-0 [&_th]:!text-[11px] [&_th_button]:!gap-0.5 [&_th_button]:!px-1.5 [&_tbody_tr:last-child_td]:!border-b-2 [&_tbody_tr:last-child_td]:!border-b-white/40", "data-sem-arrastar":""}, mw ? e("div",{style:{minWidth:mw}}, el) : el); };   // letra de 11 px e células justas: as quatro colunas cabem sem rolar para o lado

  var grade = e("div",{className:"grid min-w-0 grid-cols-1 bg-[#1b2a4a] @min-[1155px]:grid-cols-[12rem_minmax(38.5rem,2.6fr)_minmax(22rem,1fr)]"},
    ver && e("div",{role:"dialog", "aria-label":"Comprovante do pagamento", className:"fixed inset-0 z-[100] grid cursor-pointer place-items-center bg-black/70 p-4", onClick:function(){ vr[1](null); }},
      e("div",{className:"flex max-h-[92vh] max-w-[92vw] cursor-default flex-col gap-2 rounded-lg border border-white/25 bg-[#0a1226] p-2", onClick:function(ev){ ev.stopPropagation(); }},
        e("div",{className:"flex h-8 items-center justify-between gap-3 px-1 text-[13px] font-semibold"}, e("span",null, "Comprovante · "+BK(ver.l.valor)+" · "+ver.l.data),
          e("span",{className:"flex gap-1"},
            e("label",{className:MINI+" inline-flex cursor-pointer items-center", title:"Trocar o comprovante (foto ou PDF)"}, "Trocar", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Trocar comprovante", className:"hidden", onChange:function(ev){ var f = ev.target.files && ev.target.files[0]; ev.target.value = ""; vr[1](null); subirComp(ver.l, f); }})),
            e("button",{type:"button", className:MINI, onClick:function(){ vr[1](null); }}, "Fechar"))),
        e("img",{src:ver.url, alt:"Comprovante de "+BK(ver.l.valor), className:"max-h-[82vh] max-w-full rounded object-contain"}))),
    conf && e("div",{role:"alertdialog", className:"col-span-full flex flex-wrap items-center justify-center gap-3 border-b-2 border-destructive bg-[#431616] px-2 py-1.5 text-[13px] font-semibold"},
      e("span",null, "Tem certeza que quer excluir "+conf.msg+"?"),
      e(Botao,{principal:true, onClick:function(){ var fn = conf.fn; cf[1](null); fn(); }}, "Sim"),
      e(Botao,{onClick:function(){ cf[1](null); }}, "Não")),
    e("div",{className:COL+" @min-[1155px]:border-l-0"},
      e("div",{className:CAB}, e("span",null, "Prestador"), e("span",{className:"flex gap-1"}, e("button",{type:"button", className:MINI, onClick:function(){ if(!editando){ dr[1]({nome:x.nome || "", servico:x.servico || "", chavePix:x.chavePix || "", banco:cbp ? (cbp.banco || "") : "", responsavelId:x.responsavelId || ""}); irCartao("cartao-e-"+x.id); } ed[1](!editando); }}, editando ? "Cancelar" : "Editar"), p.fechar && e("button",{type:"button", className:MINI, onClick:p.fechar}, "Fechar"))),
      e("div",{className:"m-2 overflow-hidden rounded-md border border-[#3d5086] [&>div:last-child]:border-b-0"},
        e(React.Fragment,null,
          Lin("Sócio", x.responsavelId ? pessoaNome(ff, x.responsavelId) : "Sem sócio"),
          Lin("Prestador", nomePropio(x.nome)),
          Lin("Chave PIX", x.chavePix || "Sem chave"),
          Lin("Banco", cbp ? (cbp.banco || cbp.nome) : "—")),
        Lin("Serviço", x.servico || "—"),
        Lin("Situação", x.ativo ? "Em aberto" : "Finalizado", x.ativo ? "text-warning" : "text-success")),
      e("div",{className:RODA},
        e("button",{type:"button", className:BTN_RODA, onClick:function(){ acao(c, "prest_set", {id:x.id, patch:{ativo:!x.ativo}}); }}, x.ativo ? "Finalizar" : "Reabrir"),
        e("button",{type:"button", className:BTN_RODA+" text-destructive", onClick:function(){ pedir("o prestador "+x.nome+" com todas as dívidas e pagos", function(){ acao(c, "prest_del", {id:x.id}); }); }}, "Excluir"))),

    e("div",{className:COL},
      e("div",{className:CAB, title:"O que se deve ao prestador. O saldo é a soma das dívidas menos os repasses, de todas as datas."}, e("span",null, "Dívidas"), e("button",{type:"button", className:MINI, onClick:function(){ aD[1](!aberD); if(!aberD) irCartao("cartao-d-"+x.id); }}, aberD ? "Fechar" : "+ Lançar")),
      rolagem(e(TabelaPlanilha,{cols:colsDv, linhas:linhasDv, chave:"id", alturaMax:"22rem", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, vazio:"Nenhuma dívida lançada."}), "34rem"),
      e("div",{className:RODA_G, style:{gridTemplateColumns:"4.5rem minmax(0,1fr) 6rem 5.25rem 5.25rem 4.75rem 4.75rem"}}, celT("Total"), celT(""), celT(""), celT(BK(totDv), "text-destructive"), celT(BK(totDvPago), "text-success"), celT(BK(totDvFalta), totDvFalta>0.005 ? "text-destructive" : "text-success"), celT(""))),

    e("div",{className:COL},
      e("div",{className:CAB, title:"O que já foi pago ao prestador. O repasse liquida a dívida mais antiga primeiro."}, e("span",null, "Pago"), e("button",{type:"button", className:MINI, onClick:function(){ aR[1](!aberR); if(!aberR) irCartao("cartao-r-"+x.id); }}, aberR ? "Fechar" : "+ Lançar")),
      rolagem(e(TabelaPlanilha,{cols:colsRp, linhas:linhasRp, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, alturaMax:"22rem", vazio:"Nenhum pago lançado."})),
      e("div",{className:RODA_G, style:{gridTemplateColumns:"4.5rem minmax(0,1fr) 5.25rem 4.75rem"}}, celT("Total"), celT(""), celT(BK(totRp), "text-success"), celT(""))));
  // cartão de lançar: um bloco à parte DENTRO do bloco do prestador, embaixo das quatro colunas (Marcus, 18/11/2026: "mais um cardzinho para lançar nova dívida")
  var cartao = function(id, titulo, fecha, campos, botao){ return e("div",{id:id, className:"m-2 rounded-lg border border-white/25 bg-[#0a1226]"},
    e("div",{className:"flex h-8 items-center justify-between border-b border-[#3d4f77] px-2 text-[11px] font-bold uppercase"}, e("span",null, titulo), e("button",{type:"button", className:MINI, onClick:fecha}, "Fechar")),
    e("div",{className:"flex flex-wrap items-end gap-x-3 gap-y-1.5 p-2"}, campos, botao)); };
  // Editar: cartão à parte com tudo do prestador. O sócio só muda enquanto não há dívida nem pago lançado (Marcus, 18/11/2026).
  var temMov = ff.dividas.some(function(y){ return y.prestId===x.id; }) || ff.repasses.some(function(y){ return y.prestId===x.id; });
  var mudaRasc = function(k, v){ var o = Object.assign({}, rasc); o[k] = v; dr[1](o); };
  var salvarEd = function(){ if(!rasc || !rasc.nome.trim()) return; var patch = {nome:rasc.nome.trim(), servico:rasc.servico.trim(), chavePix:rasc.chavePix.trim()}; if(!temMov) patch.responsavelId = rasc.responsavelId; acao(c, "prest_set", {id:x.id, patch:patch}); if(cbp && rasc.banco!==(cbp.banco || "")) acao(c, "cb_set", {id:cbp.id, patch:{banco:rasc.banco.trim()}}); else if(!cbp && rasc.banco.trim()) acao(c, "cb_add", {nome:"Conta "+rasc.nome.trim(), banco:rasc.banco.trim(), chavePix:rasc.chavePix.trim(), personaId:(temMov ? x.responsavelId : rasc.responsavelId) || "", prestadorId:x.id}); ed[1](false); };
  var cartaoE = editando && rasc && cartao("cartao-e-"+x.id, "Editar prestador · "+nomePropio(x.nome), function(){ ed[1](false); }, [
    Stk("Nome", inp("ed-nome-"+x.id, rasc.nome, function(v){ mudaRasc("nome", v); }, "text", salvarEd), "min-w-[12rem] flex-1"),
    Stk("Serviço", inp("ed-serv-"+x.id, rasc.servico, function(v){ mudaRasc("servico", v); }, "text", salvarEd), "min-w-[10rem] flex-1"),
    Stk("Chave PIX", inp("ed-chave-"+x.id, rasc.chavePix, function(v){ mudaRasc("chavePix", v); }, "text", salvarEd), "min-w-[12rem] flex-1"),
    Stk("Banco", e("input",{id:"ed-banco-"+x.id, value:rasc.banco, title:cbp ? "" : "Sem conta ligada: ao salvar com o banco preenchido, a conta é criada e o Pix que cair nela vira pagamento do prestador sozinho", className:CAMPO+" w-full", onChange:function(ev){ mudaRasc("banco", ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvarEd(); }}), "w-40"),
    Stk(temMov ? "Sócio (travado)" : "Sócio", e("select",{id:"ed-socio-"+x.id, value:rasc.responsavelId, disabled:temMov, title:temMov ? "Travado: este prestador já tem dívida ou pago lançado" : "", className:SEL_AZUL+" disabled:opacity-50", onChange:function(ev){ mudaRasc("responsavelId", ev.target.value); }}, [["", "Nenhum"]].concat(socios.map(function(q){ return [q.id, q.nome]; })).map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })), "w-40")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!rasc.nome.trim(), onClick:salvarEd}, "Salvar"));
  var cartaoD = aberD && cartao("cartao-d-"+x.id, "Nova dívida · "+nomePropio(x.nome), function(){ aD[1](false); }, [
    Stk("Data", inp("dv-data-"+x.id, d.data, function(v){ setD(Object.assign({}, d, {data:v})); }, "date"), "w-44"),
    Stk("Valor (R$)", inp("dv-valor-"+x.id, d.valor, function(v){ setD(Object.assign({}, d, {valor:v.replace(/[^\d,.]/g, "")})); }, "text", lancarDivida), "w-36"),
    Stk("Prazo", inp("dv-prazo-"+x.id, d.prazo, function(v){ setD(Object.assign({}, d, {prazo:v})); }, "date"), "w-44"),
    Stk("Descrição", inp("dv-desc-"+x.id, d.descricao, function(v){ setD(Object.assign({}, d, {descricao:v})); }, "text", lancarDivida), "min-w-[14rem] flex-1")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!(num(d.valor)>0), onClick:lancarDivida}, "Lançar dívida"));
  var cartaoR = aberR && cartao("cartao-r-"+x.id, "Novo pago · "+nomePropio(x.nome), function(){ aR[1](false); }, [
    Stk("Data", inp("rp-data-"+x.id, r.data, function(v){ setR(Object.assign({}, r, {data:v})); }, "date"), "w-44"),
    Stk("Valor (R$)", inp("rp-valor-"+x.id, r.valor, function(v){ setR(Object.assign({}, r, {valor:v.replace(/[^\d,.]/g, "")})); }, "text", lancarRepasse), "w-36"),
    Stk("Quem pagou", inp("rp-quem-"+x.id, r.origem, function(v){ setR(Object.assign({}, r, {origem:v})); }, "text", lancarRepasse), "min-w-[14rem] flex-1"),
    Stk("Forma", e("select",{id:"rp-forma-"+x.id, value:r.forma, className:SEL_AZUL, onChange:function(ev){ setR(Object.assign({}, r, {forma:ev.target.value})); }}, FORMAS_REPASSE.map(function(k){ return e("option",{key:k, value:k}, k); })), "w-32"),
    e("label",{key:"pr", className:"flex h-8 cursor-pointer items-center gap-1.5 whitespace-nowrap text-[13px]", title:"Marque quando o repasse veio de um PIX de revendedora: ele conta como PIX do sócio responsável."}, e("input",{type:"checkbox", checked:r.pixRev, className:"size-4", onChange:function(ev){ setR(Object.assign({}, r, {pixRev:ev.target.checked})); }}), "PIX de revendedora")
  ].map(function(el, i){ return e(React.Fragment,{key:i}, el); }), e(Botao,{principal:true, desabilitado:!(num(r.valor)>0) || !r.origem.trim(), onClick:lancarRepasse}, "Lançar pago"));
  return e("div",{className:"@container flex min-w-0 flex-col overflow-hidden rounded-b-lg border-2 border-[#5b74ad] bg-[#1b2a4a]"}, grade, cartaoE, cartaoD, cartaoR);
}
function AbaFfPrest(){
  var c = useFF(), ff = c.ff, nf = useState({nome:"", servico:"", chavePix:"", responsavelId:""}), f = nf[0], setF = nf[1], ncb = useState({nome:"", banco:"", chavePix:"", prestadorId:""}), cb = ncb[0], setCb = ncb[1];
  var am = useState({}), abMap = am[0], nv = useState(false), novoAberto = nv[0], sel = useState(""), selId = sel[0], cc = useState(null), confC = cc[0], vf = useState(false), verFin = vf[0];   // prestador escolhido na tabela: os dados dele abrem num bloco separado embaixo (Marcus, 18/11/2026)
  if(!c.pode) return e(Guarda,{c:c});
  // chaves Pix que o prestador ainda não tem no cadastro mas existem por outro caminho (arquivo local, conta ligada, Greicy universal): um clique grava no servidor e o Direcionar e o Atendimento passam a puxar (Marcus, 18/11/2026)
  var paraGravar = chavesParaGravar(c.s);
  var gravarChaves = function(){ paraGravar.forEach(function(k){ acao(c, "prest_set", {id:k.id, patch:{chavePix:k.chave, chavePixTipo:k.tipo, chavePixEm:Date.now(), chavePixPor:c.por}}); }); };
  var socios = ff.personas.filter(function(q){ return q.tipo==="SOCIO"; });
  var abertos = ff.prest.filter(function(x){ return x.ativo; }), porResp = {};
  abertos.forEach(function(x){ var k = x.responsavelId || "—", g = porResp[k] || (porResp[k] = {n:0, saldo:0}); g.n++; g.saldo = r2(g.saldo+saldoPrestador(ff, x.id)); });
  // resumo em tabela larga de 2 linhas (Marcus, 18/11/2026: "outro layout"): uma coluna por sócio e o total; sem bloco vazio ao lado
  var chavesResp = Object.keys(porResp).sort(function(x, y){ return porResp[y].saldo-porResp[x].saldo; });
  var nomeResp = function(k){ return k==="—" ? "Sem responsável" : pessoaNome(ff, k); };
  var totN = chavesResp.reduce(function(s, k){ return s+porResp[k].n; }, 0), totS = r2(chavesResp.reduce(function(s, k){ return s+porResp[k].saldo; }, 0));
  var colsResumo = [{k:"ind", t:"Resumo"}].concat(chavesResp.map(function(k){ return {k:"r"+k, t:nomeResp(k), fmt:function(v, l){ return l.id==="saldo" ? BK(v) : String(v); }, cor:function(l){ return l.id==="saldo" ? "text-destructive" : ""; }}; }), [{k:"total", t:"Total", fmt:function(v, l){ return l.id==="saldo" ? BK(v) : String(v); }, cor:function(l){ return l.id==="saldo" ? "text-destructive" : ""; }}]);
  var lnAberto = {id:"aberto", ind:"Em aberto", total:totN}, lnSaldo = {id:"saldo", ind:"Saldo devedor", total:totS};
  chavesResp.forEach(function(k){ lnAberto["r"+k] = porResp[k].n; lnSaldo["r"+k] = porResp[k].saldo; });
  var linhasResumo = [lnAberto, lnSaldo];
  var criar = function(){ if(!f.nome.trim()) return; acao(c, "prest_add", f); setF({nome:"", servico:"", chavePix:"", responsavelId:""}); nv[1](false); };
  var criarConta = function(){ if(!cb.nome.trim() || !cb.prestadorId) return; acao(c, "cb_add", cb); setCb({nome:"", banco:"", chavePix:"", prestadorId:""}); };
  var linhasContas = ff.contasBanc.filter(function(b){ if(!b.prestadorId) return false; var pp = ff.prest.find(function(x){ return x.id===b.prestadorId; }); return !pp || pp.ativo!==false || verFin; }).map(function(b){ return {id:b.id, conta:b.nome || "—", banco:b.banco || "—", chave:b.chavePix || "Sem chave", prest:(ff.prest.find(function(x){ return x.id===b.prestadorId; }) || {}).nome || "—", acao:"Excluir"}; });
  var colsContas = [{k:"conta", t:"Conta"}, {k:"banco", t:"Banco"}, {k:"chave", t:"Chave PIX"}, {k:"prest", t:"Prestador"}, {k:"acao", t:"Excluir", render:function(v, l){ return botaoLinha("Excluir", "Excluir conta", function(){ cc[1]({id:l.id, nome:l.conta}); }); }}];
  var ordenados = ff.prest.slice().sort(function(a, b){ return (b.ativo ? 1 : 0)-(a.ativo ? 1 : 0) || a.nome.localeCompare(b.nome); });
  // UMA tabela de prestadores, uma linha por prestador (Marcus, 18/11/2026: "não quero essas barras"): clicar na linha abre o detalhe embaixo; filtro e ordem em cada coluna
  var nFin = ff.prest.filter(function(x){ return !x.ativo; }).length;
  var linhasPrest = ordenados.filter(function(x){ return x.ativo || verFin || x.id===selId; }).map(function(x){ var cbp = (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===x.id && z.ativo!==false; })[0];
    var dv = ff.dividas.filter(function(y){ return y.prestId===x.id && y.valor>0; }), rp = ff.repasses.filter(function(y){ return y.prestId===x.id; });
    return {id:x.id, x:x, socio:x.responsavelId ? pessoaNome(ff, x.responsavelId) : "Sem responsável", prest:nomePropio(x.nome), serv:x.servico || "—", banco:cbp ? (cbp.banco || cbp.nome) : "—", sit:x.ativo ? "Em aberto" : "Finalizado", dividas:somaDe(dv, "valor"), repasses:somaDe(rp, "valor"), saldo:saldoPrestador(ff, x.id), sobra:baixaDividas(ff, x.id).sobra}; });
  var colsPrest = [{k:"socio", t:"Sócio"}, {k:"prest", t:"Prestador"}, {k:"serv", t:"Serviço"}, {k:"banco", t:"Banco"}, {k:"sit", t:"Situação", cor:function(l){ return l.x.ativo ? "" : "text-muted-foreground"; }},
    {k:"dividas", t:"Dívidas", fmt:BK}, {k:"repasses", t:"Repasses", fmt:BK, cor:function(){ return "text-success"; }}, {k:"saldo", t:"Saldo", fmt:function(v, l){ return l.sobra>0.005 ? "Pago a mais "+BK(l.sobra) : BK(v); }, cor:function(l){ return l.sobra>0.005 ? "text-warning" : l.saldo>0.005 ? "text-destructive" : "text-success"; }}];   // "Pago a mais": os repasses passam das dívidas (falta lançar uma dívida ou o repasse é de outro prestador)
  var rodapePrest = function(ls){ return ["Total", String(ls.length)+" prestadores", "", "", "", BK(somaDe(ls, "dividas")), BK(somaDe(ls, "repasses")), BK(somaDe(ls, "saldo"))]; };
  var FUNDO = "!bg-[#0f1729] [&_tbody_tr:hover]:!bg-[#1e2d4c] [&_tbody_tr[aria-expanded=true]]:!bg-[#26385c] [&_tbody_tr:not([aria-expanded])>td[colspan]]:!bg-[#1a2540]";   // fundo azul-marinho (Marcus, 18/11/2026: "uma cor de fundo melhor"): a linha aberta fica mais clara e o detalhe numa faixa marinho
  var COMPACTA = FUNDO+" [&_td]:!h-[22px] [&_td]:!px-2 [&_td]:!py-0 [&_td]:!leading-[14px] [&_td]:!text-[11px] [&_th]:!h-6 [&_td[colspan]]:!p-0";   // linhas de 26 px e letra de 11 px na tabela de prestadores (sem mexer nos campos do detalhe)
  var escolhido = ff.prest.find(function(x){ return x.id===selId; }), cbEsc = escolhido ? (ff.contasBanc||[]).filter(function(z){ return z.prestadorId===escolhido.id && z.ativo!==false; })[0] : null;
  var tituloEsc = escolhido ? nomePropio(escolhido.nome)+(escolhido.servico ? " · "+escolhido.servico : "") : "";   // título curto: sócio e conta já estão na coluna Prestador (nada se sobrepõe em janela estreita)
  var dirEsc = escolhido ? "Saldo "+BK(saldoPrestador(ff, escolhido.id)) : "";
  return e("div",{className:PADRAO_BLOCOS+" -mb-2 -ml-3 -mr-2 -mt-5 flex flex-col gap-1.5 pl-0 md:-mb-3 md:-ml-5 md:-mr-3 md:pl-0"},
    e("div",{title:"Quem presta serviço e recebe dos sócios: o que se deve (dívidas), o que já foi pago (repasses) e o saldo."},
      e(BlocoPainel,{titulo:"Prestadores em aberto", compacto:true, cls:FUNDO},
        e(TabelaPlanilha,{cols:colsResumo, linhas:linhasResumo, chave:"id", grade:true, semMao:true, centro:true, semFiltro:true, semContagem:true, semLimpar:true, vazio:"Nenhum prestador em aberto."}))),
    e("div",{key:"barra", className:"flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#5b74ad] bg-[#1b2a4a] px-2 py-1"},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]", title:"Clique numa linha da tabela para ver os dados do prestador embaixo."}, ff.prest.length+" prestadores · "+abertos.length+" em aberto"),
      e("span",{className:"flex items-center gap-2"},
        paraGravar.length>0 && e("button",{type:"button", className:BTN_BARRA, title:"Grava no servidor a chave Pix de: "+paraGravar.map(function(k){ return k.nome; }).join(", "), onClick:gravarChaves}, "Gravar "+paraGravar.length+" chaves Pix"),
        nFin>0 && e("button",{type:"button", className:BTN_BARRA, title:"Prestadores finalizados ficam fechados. Lançar uma dívida nova num deles reabre sozinho.", onClick:function(){ vf[1](!verFin); }}, verFin ? "Ocultar finalizados" : "Finalizados ("+nFin+")"),
        e(Botao,{principal:!novoAberto, onClick:function(){ nv[1](!novoAberto); }}, novoAberto ? "Fechar novo prestador" : "Novo prestador"))),
    novoAberto && e("div",{className:"rounded-lg border border-border bg-card/60"},
      e("div",{className:FORM_PREST+" border-b-0"},
        e(CampoTxt,{t:"Nome", cls:"min-w-[12rem] flex-1", id:"np-nome", value:f.nome, onChange:function(v){ setF(Object.assign({}, f, {nome:v})); }, onEnter:criar}),
        e(CampoTxt,{t:"Serviço", cls:"min-w-[10rem] flex-1", id:"np-serv", value:f.servico, onChange:function(v){ setF(Object.assign({}, f, {servico:v})); }, onEnter:criar}),
        e(CampoTxt,{t:"Chave PIX", cls:"w-72", id:"np-chave", value:f.chavePix, onChange:function(v){ setF(Object.assign({}, f, {chavePix:v})); }, onEnter:criar}),
        e(CampoSelI,{t:"Responsável", cls:"w-60", id:"np-resp", value:f.responsavelId, onChange:function(v){ setF(Object.assign({}, f, {responsavelId:v})); }, opcoes:[["", "Nenhum"]].concat(socios.map(function(q){ return [q.id, q.nome]; }))}),
        fixo(e(Botao,{principal:true, desabilitado:!f.nome.trim(), onClick:criar}, "Criar prestador")))),
    ff.prest.length===0 ? e("p",{className:"rounded-lg border-2 border-[var(--bloco-titulo)] bg-card/60 px-3 py-4 text-center text-[13px]"}, "Nenhum prestador ainda.") :
      e(BlocoPainel,{titulo:"Prestadores", compacto:false, cls:COMPACTA},
        e(TabelaPlanilha,{cols:colsPrest, linhas:linhasPrest, chave:"id", grade:true, semMao:true, centro:true, semContagem:true, semLimpar:true, totalRodape:rodapePrest, vazio:"Nenhum prestador.",
          aoClicar:function(l){ sel[1](l.id); setTimeout(function(){ var el = document.getElementById("prest-detalhe"); if(el && el.scrollIntoView) el.scrollIntoView({behavior:"smooth", block:"nearest"}); }, 60); },
          linhaCls:function(l){ return l.id===selId ? "!bg-[#26385c]" : ""; }})),
    e("div",{id:"prest-detalhe", key:"detalhe"},
      escolhido ? e(BlocoPainel,{titulo:tituloEsc, compacto:false, cls:FUNDO, dir:dirEsc},
        e("div",{className:"w-0 min-w-full overflow-x-auto", "data-sem-arrastar":""}, e(DetPrest,{key:escolhido.id, c:c, x:escolhido, fechar:function(){ sel[1](""); }}))) :
      ordenados.length>0 && e("p",{className:"rounded-lg border border-border bg-[#0f1729] px-3 py-3 text-center text-[13px]"}, "Escolha um prestador na tabela para ver todos os dados dele aqui.")));
}

// ───────────────── Pró-labores ─────────────────
// REFEITA em 22/11/2026 (Marcus: "somente uma linha com o pró-labore de cada sócio"): uma tabela, uma linha por sócio, no mesmo desenho das Negociações e da Contas a pagar. "Editar" abre a janela azul com a empresa, a nova vigência e as vigências antigas. O botão do canto gera as contas do mês.
function EditarProlab(p){
  var c = p.c, ff = c.ff, pe = p.pe, pr = ff.prolabore[pe.id]||{empresa:"", cnpj:"", vigencias:[]}, ve = useState({empresa:pr.empresa, cnpj:pr.cnpj}), emp = ve[0], setEmp = ve[1];
  var nv = useState({desde:hojeYm(), bruto:"", inss:"", irrf:"", split:false, valor1:"", dia1:"20", dia2:"5"}), v = nv[0], setV = nv[1], liq = liquidoDe(num(v.bruto), num(v.inss), num(v.irrf));
  var setN = function(o){ setV(Object.assign({}, v, o)); }, so = function(x){ return x.replace(/[^\d,.]/g,""); };
  var antigas = pr.vigencias.slice().sort(function(a, b){ return b.desde.localeCompare(a.desde); });
  return e(JanelaJ,{t:"Pró-labore · "+pe.nome, larga:true, fechar:p.fechar},
    e(BlocoJ,{t:"1 · Empresa"},
      e("div",{className:"grid w-full grid-cols-[2.4fr_1fr_auto] items-end gap-1"},
        e(CampoJ,{rot:"Empresa", cls:"w-full"}, e(TxtJ,{value:emp.empresa, label:"Empresa", onChange:function(x){ setEmp(Object.assign({}, emp, {empresa:x})); }})),
        e(CampoJ,{rot:"CNPJ", cls:"w-full"}, e(TxtJ,{value:emp.cnpj, label:"CNPJ", onChange:function(x){ setEmp(Object.assign({}, emp, {cnpj:x})); }})),
        e("button",{type:"button", disabled:!emp.empresa.trim(), style:ALTO_J, className:BTN_J, onClick:function(){ acao(c, "prolab_set", {personaId:pe.id, empresa:emp.empresa, cnpj:emp.cnpj}); }}, "Salvar empresa"))),
    e(BlocoJ,{t:"2 · Nova vigência (muda o valor daqui para a frente; o passado não muda)"},
      e("div",{className:"grid w-full grid-cols-5 gap-1"},
        e(CampoJ,{rot:"A partir de", cls:"w-full"}, e(TxtJ,{value:v.desde, type:"month", label:"Desde", onChange:function(x){ setN({desde:x}); }})),
        e(CampoJ,{rot:"Bruto (R$)", cls:"w-full"}, e(TxtJ,{value:v.bruto, label:"Bruto", onChange:function(x){ setN({bruto:so(x)}); }})),
        e(CampoJ,{rot:"INSS", cls:"w-full"}, e(TxtJ,{value:v.inss, label:"INSS", onChange:function(x){ setN({inss:so(x)}); }})),
        e(CampoJ,{rot:"IRRF", cls:"w-full"}, e(TxtJ,{value:v.irrf, label:"IRRF", onChange:function(x){ setN({irrf:so(x)}); }})),
        e(CampoJ,{rot:"Líquido", cls:"w-full"}, e("div",{className:"flex h-[22px] items-center justify-center text-[11px] font-bold"}, BK(liq)))),
      e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold"}, e("input",{type:"checkbox", checked:v.split, className:"size-3", onChange:function(ev){ setN({split:ev.target.checked}); }}), "Pagar em duas datas"),   // padrao-ok: caixa de 12 px da janela compacta
      v.split && e("div",{className:"grid w-full grid-cols-4 items-end gap-1"},
        e(CampoJ,{rot:"Dia do adiantamento", cls:"w-full"}, e(TxtJ,{value:v.dia1, label:"Dia 1", onChange:function(x){ setN({dia1:x.replace(/\D/g,"")}); }})),
        e(CampoJ,{rot:"Valor do adiantamento", cls:"w-full"}, e(TxtJ,{value:v.valor1, label:"Valor 1", onChange:function(x){ setN({valor1:so(x)}); }})),
        e(CampoJ,{rot:"Dia do saldo", cls:"w-full"}, e(TxtJ,{value:v.dia2, label:"Dia 2", onChange:function(x){ setN({dia2:x.replace(/\D/g,"")}); }})),
        e(CampoJ,{rot:"Saldo", cls:"w-full"}, e("div",{className:"flex h-[22px] items-center justify-center text-[11px] font-bold"}, BK(Math.max(0, r2(liq-num(v.valor1))))))),
      e("button",{type:"button", disabled:!(liq>0), style:ALTO_J, className:BTN_J+" !bg-[#3f6bb8]", onClick:function(){ acao(c, "prolab_vig_add", {personaId:pe.id, desde:v.desde, bruto:num(v.bruto), inss:num(v.inss), irrf:num(v.irrf), split:v.split, valor1:num(v.valor1), dia1:v.dia1, dia2:v.dia2}); }}, "Criar vigência")),
    antigas.length>0 && e(BlocoJ,{t:"3 · Vigências"},
      e("div",{className:"w-full"}, antigas.map(function(x){ return e("div",{key:x.id, className:"grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1.6fr_auto] items-center gap-1 border-b border-white/15 py-1 text-center text-[11px] last:border-b-0"},
        e("b",null, nomeMes(x.desde)), e("span",null, BK(x.bruto)), e("span",null, BK(x.inss)), e("span",null, BK(x.irrf)), e("b",null, BK(x.liquido)), e("span",null, x.valor1 ? "dia "+x.dia1+": "+BK(x.valor1)+" · dia "+x.dia2+": "+BK(x.valor2) : "dia 5"),
        e("button",{type:"button", className:"px-1 underline", title:"Excluir vigência", onClick:function(){ if(window.confirm("Excluir a vigência de "+nomeMes(x.desde)+"?")) acao(c, "prolab_vig_del", {personaId:pe.id, id:x.id}); }}, "Excluir")); }))),
    e("div",{className:"flex justify-end px-2 pt-1.5"}, e("button",{type:"button", style:ALTO_J, className:BTN_J, onClick:p.fechar}, "Fechar")));
}
function AbaFfProlab(){
  var c = useFF(), ff = c.ff, ym = hojeYm(), md = useState(null), editando = md[0], setEditando = md[1];
  // 22/11/2026 (Marcus): pró-labore só tem Marcus, Anamaria, Marco Antonio e Lucas; Ana Beatriz e Sorelly saem da tela (os dados delas continuam guardados)
  var socios = ["marcus", "anamaria", "marco", "lucas"].map(function(id){ return ff.personas.filter(function(p){ return p.id===id && p.ativo; })[0]; }).filter(Boolean);
  var linhas = socios.map(function(p){ var pr = ff.prolabore[p.id] || {empresa:"", cnpj:"", vigencias:[]}, vig = vigenciaEm(ff, p.id, ym);
    return {id:p.id, p:p, socio:p.nome, empresa:pr.empresa || "—", cnpj:pr.cnpj || "—", desde:vig ? nomeMes(vig.desde) : "Sem vigência", bruto:vig ? vig.bruto : null, inss:vig ? vig.inss : null, irrf:vig ? vig.irrf : null, liquido:vig ? vig.liquido : null, d1:vig ? (vig.valor1 ? "Dia "+vig.dia1 : "Dia 5") : "—", v1:vig ? (vig.valor1 ? vig.valor1 : vig.liquido) : null, d2:vig && vig.valor1 ? "Dia "+vig.dia2 : "—", v2:vig && vig.valor1 ? vig.valor2 : null}; });
  var D = function(v){ return typeof v==="number" ? BK(v) : "—"; };
  var link = function(l){ return e("button",{type:"button", title:"Editar o pró-labore", onClick:function(ev){ ev.stopPropagation(); setEditando(l.p); }, className:"cursor-pointer underline hover:text-primary"}, "Editar"); };
  var cols = [{k:"socio", t:"Sócio"}, {k:"empresa", t:"Empresa"}, {k:"cnpj", t:"CNPJ"}, {k:"desde", t:"Vigência desde"}, {k:"bruto", t:"Bruto", fmt:D}, {k:"inss", t:"INSS", fmt:D}, {k:"irrf", t:"IRRF", fmt:D}, {k:"liquido", t:"Líquido", fmt:D, cor:function(l){ return typeof l.liquido==="number" ? "text-success" : ""; }}, {k:"d1", t:"1º dia"}, {k:"v1", t:"1º valor", fmt:D}, {k:"d2", t:"2º dia"}, {k:"v2", t:"2º valor", fmt:D}, {k:"acoes", t:"Ações", render:function(v, l){ return link(l); }}];
  var soma = function(ls, k){ return r2(ls.reduce(function(t, l){ return t+(typeof l[k]==="number" ? l[k] : 0); }, 0)); };
  var rodape = function(ls){ return cols.map(function(col, j){ return j===0 ? "Total" : col.k==="empresa" ? ls.length+(ls.length===1 ? " sócio" : " sócios") : col.k==="bruto" || col.k==="inss" || col.k==="irrf" || col.k==="liquido" || col.k==="v1" || col.k==="v2" ? BK(soma(ls, col.k)) : ""; }); };
  return e(Guarda,{c:c}, e(Pagina,{className:PAGINA_CHEIA},
    editando && e(EditarProlab,{key:editando.id, c:c, pe:editando, ym:ym, fechar:function(){ setEditando(null); }}),
    e(BlocoPainel,{titulo:"Pró-labores", compacto:true},
      e("div",{ref:refCheia(), className:CLS_FINA_ESPACO}, e(TabelaPlanilha,{key:"ffprolab", fina:true, cols:cols, aoClicar:function(l){ setEditando(l.p); }, alturaMax:"calc(100vh - 6.6rem)", linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, semMao:true, limite:200, totalRodape:rodape, vazio:"Nenhum sócio cadastrado."})))));
}

// ───────────────── Relatório ─────────────────
function AbaFfRelatorio(){
  var c = useFF(), ff = c.ff, ms = useState(hojeYm()), ym = ms[0], setYm = ms[1], fech = ff.fechamentos[ym], dados = fech ? fech.snapshot : relatorioMes(ff, ym);
  var tot = function(k){ return r2(dados.reduce(function(t, x){ return t+k(x); }, 0)); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Relatório do mês", sub:"Os números de cada pessoa no mês. Fechar o mês guarda uma foto dos números (não trava as edições; quem trava é a liberação em Configurações)."}),
    e("div",{className:"flex flex-wrap items-center gap-3"}, e(MesSel,{ym:ym, set:setYm}), fech ? e(React.Fragment,null, e("span",{className:"rounded-full bg-success/20 px-3 py-1 text-[12.5px] font-bold text-success"}, "Fechado em "+new Date(fech.em).toLocaleDateString("pt-BR")+" por "+fech.por), e(Btn,{v:"ghost", onClick:function(){ if(window.confirm("Reabrir "+nomeMes(ym)+"? A foto guardada será apagada.")) acao(c, "reabrir", {ym:ym}); }}, "Reabrir")) :
      e(Btn,{v:"secondary", onClick:function(){ if(window.confirm("Fechar "+nomeMes(ym)+" e guardar os números?")) acao(c, "fechar", {ym:ym}); }}, "Fechar o mês")),
    e("div",{className:"grid grid-cols-2 gap-3 xl:grid-cols-4"}, e(Tile,{t:"Contas do mês", v:BK(tot(function(x){ return x.contas.total; })), cor:"#F472B6"}), e(Tile,{t:"Já pago", v:BK(tot(function(x){ return x.contas.pago; })), cor:"#4ADE80"}), e(Tile,{t:"Falta pagar", v:BK(tot(function(x){ return x.contas.restante; })), cor:"#F59E0B"}), e(Tile,{t:"PIX recebido", v:BK(tot(function(x){ return x.pix.recebido; })), cor:"#60A5FA"})),
    e(BlocoBarra,{cor:"azul", t:"Por pessoa", sub:fech ? "foto guardada no fechamento" : "ao vivo (sem o pró-labore nas contas, para não contar em dobro)"}, e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"},
      e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Pessoa"), th("Contas"), th("Pago"), th("Pendente"), th("PIX meta"), th("PIX recebido"), th("Pró-labore líquido"), th("Saldo de prestadores")])),
      e("tbody",null, dados.map(function(x){ return e("tr",{key:x.id, className:"border-b border-border/60"}, e("td",{className:TD+" font-semibold"}, x.nome), e("td",{className:TD+" "+MONO}, BK(x.contas.total)), e("td",{className:TD+" "+MONO}, BK(x.contas.pago)), e("td",{className:TD+" "+MONO}, BK(x.contas.restante)), e("td",{className:TD+" "+MONO}, BK(x.pix.meta)), e("td",{className:TD+" "+MONO}, BK(x.pix.recebido)), e("td",{className:TD+" "+MONO}, BK(x.proLiquido)), e("td",{className:TD+" "+MONO}, BK(x.saldoPrest))); })))))));
}

// ───────────────── Histórico ─────────────────
function AbaFfHist(){
  var c = useFF(), ff = c.ff, es = useState({area:"", usuario:"", busca:"", de:"", ate:"", pag:0}), f = es[0], set = function(o){ es[1](Object.assign({}, f, {pag:0}, o)); }, q = f.busca.trim().toLowerCase();
  var areas = [], usuarios = []; ff.hist.forEach(function(h){ if(areas.indexOf(h.area)<0) areas.push(h.area); if(usuarios.indexOf(h.por)<0) usuarios.push(h.por); });
  var iso = function(t){ var d = new Date(t); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  var lista = ff.hist.filter(function(h){ return (!f.area || h.area===f.area) && (!f.usuario || h.por===f.usuario) && (!f.de || iso(h.em)>=f.de) && (!f.ate || iso(h.em)<=f.ate) && (!q || (h.alvo+" "+h.detalhe+" "+h.acao+" "+h.por).toLowerCase().indexOf(q)>=0); });
  var pg = lista.slice(f.pag*50, f.pag*50+50), perigo = function(a){ return /Excluiu|Reverteu|Rejeitou|Tirou/.test(a); }, bom = function(a){ return /baixa|Confirmou|Fechou|Lançou|Anotou/.test(a); };
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Histórico", sub:"Tudo o que foi feito no Financeiro Familiar, do mais novo para o mais antigo: quando, quem, em quê. Começa a contar a partir de hoje."}),
    e("div",{className:"flex flex-wrap items-end gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-[#EC4899]/30"}, e(Txt,{value:f.de, type:"date", label:"De", className:"w-40", onChange:function(v){ set({de:v}); }}), e(Txt,{value:f.ate, type:"date", label:"Até", className:"w-40", onChange:function(v){ set({ate:v}); }}),
      e(Sel,{value:f.area, label:"Área", className:"w-48", onChange:function(v){ set({area:v}); }}, e("option",{value:""}, "Todas as áreas"), areas.map(function(a){ return e("option",{key:a, value:a}, a); })), e(Sel,{value:f.usuario, label:"Quem", className:"w-44", onChange:function(v){ set({usuario:v}); }}, e("option",{value:""}, "Todos"), usuarios.map(function(a){ return e("option",{key:a, value:a}, a); })),
      e(Txt,{value:f.busca, ph:"Buscar", label:"Buscar", className:"w-56", onChange:function(v){ set({busca:v}); }})),
    e(BlocoBarra,{cor:"azul", t:"Ações registradas", sub:lista.length+" no filtro", dir:String(lista.length)}, lista.length===0 ? e("p",{className:"px-4 py-8 text-center text-[13.5px] text-muted-foreground"}, "Nada registrado ainda.") :
      e("div",{className:"overflow-x-auto"}, e("table",{className:"w-full border-collapse"}, e("thead",null, e("tr",{className:"bg-sidebar"}, [th("Quando"), th("Quem"), th("Área"), th("Ação"), th("Em quê")])),
        e("tbody",null, pg.map(function(h){ return e("tr",{key:h.id, className:"border-b border-border/60"}, e("td",{className:TD+" whitespace-nowrap text-[12.5px]"}, new Date(h.em).toLocaleString("pt-BR",{dateStyle:"short", timeStyle:"short"})), e("td",{className:TD}, h.por), e("td",{className:TD}, h.area),
          e("td",{className:TD}, e("span",{className:"whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-bold "+(perigo(h.acao) ? "bg-destructive/20 text-destructive" : bom(h.acao) ? "bg-success/20 text-success" : "bg-white/10")}, h.acao)), e("td",{className:TD}, h.alvo, h.detalhe && e("span",{className:"block text-[11.5px] text-muted-foreground"}, h.detalhe))); }))))),
    lista.length>50 && e("div",{className:"flex items-center justify-center gap-3"}, e(Btn,{v:"ghost", sm:true, disabled:f.pag===0, onClick:function(){ es[1](Object.assign({}, f, {pag:f.pag-1})); }}, "‹ Anterior"), e("span",{className:"text-[13px]"}, "Página "+(f.pag+1)+" de "+Math.ceil(lista.length/50)), e(Btn,{v:"ghost", sm:true, disabled:(f.pag+1)*50>=lista.length, onClick:function(){ es[1](Object.assign({}, f, {pag:f.pag+1})); }}, "Próxima ›"))));
}

// ───────────────── Configurações ─────────────────
function AbaFfConfig(){
  var c = useFF(), ff = c.ff, np = useState({nome:"", tipo:"SOCIO", cor:"#EC4899"}), pn = np[0], setPn = np[1], nc = useState(""), cat = nc[0], setCat = nc[1], nb = useState({nome:"", banco:"", tipo:"PF", chavePix:"", personaId:""}), cb = nb[0], setCb = nb[1], nm = useState(somaMes(hojeYm(), -1)), mes = nm[0], setMes = nm[1];
  var campo = function(v, ac, cls){ return e("input",{key:v, defaultValue:v, className:INPUT+" h-9! "+(cls||"w-full"), onBlur:function(ev){ if(ev.target.value!==v) ac(ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }}); };
  var chk = function(on, ac, t){ return e("label",{className:"flex cursor-pointer items-center gap-1.5 text-[12.5px]"}, e("input",{type:"checkbox", checked:!!on, className:"size-4", onChange:function(ev){ ac(ev.target.checked); }}), t); };
  var contasFam = ff.contasBanc.filter(function(b){ return !b.prestadorId; }), passados = []; for(var i=1; i<=12; i++) passados.push(somaMes(hojeYm(), -i));
  return e(Guarda,{c:c}, e("div",{className:"flex flex-col gap-4"},
    e(PageHead,{t:"Configurações do Financeiro Familiar", sub:"Pessoas, categorias, contas bancárias da família e a liberação de meses passados."}),
    e(BlocoBarra,{cor:"azul", t:"Pessoas", sub:"o que aparece na Home de cada uma"}, e("div",{className:"flex flex-col gap-2 p-4"}, ff.personas.map(function(p){ return e("div",{key:p.id, className:"flex flex-wrap items-center gap-3"},
      e("input",{type:"color", value:p.cor, "aria-label":"Cor", className:"h-8 w-10 cursor-pointer rounded", onChange:function(ev){ acao(c, "persona_set", {id:p.id, patch:{cor:ev.target.value}}); }}), campo(p.nome, function(v){ acao(c, "persona_set", {id:p.id, patch:{nome:v}}); }, "w-48"), e(Sel,{value:p.tipo==="SOCIO" ? "SOCIO" : "FAMILIAR", label:"Tipo de "+p.nome, className:"w-28", onChange:function(v){ acao(c, "persona_set", {id:p.id, patch:{tipo:v}}); }}, e("option",{value:"SOCIO"}, "Sócio"), e("option",{value:"FAMILIAR"}, "Família")),
      chk(p.ativo, function(v){ acao(c, "persona_set", {id:p.id, patch:{ativo:v}}); }, "ativa"), chk(p.mostrarProlabore, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarProlabore:v}}); }, "pró-labore"), chk(p.mostrarContas, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarContas:v}}); }, "contas"), chk(p.mostrarPix, function(v){ acao(c, "persona_set", {id:p.id, patch:{mostrarPix:v}}); }, "PIX")); }),
      e("div",{className:"flex flex-wrap items-end gap-2 border-t border-white/10 pt-2"}, e("input",{type:"color", value:pn.cor, "aria-label":"Cor", className:"h-9 w-10 cursor-pointer rounded", onChange:function(ev){ setPn(Object.assign({}, pn, {cor:ev.target.value})); }}), e(Txt,{value:pn.nome, ph:"Nome", label:"Nome", className:"w-48", onChange:function(v){ setPn(Object.assign({}, pn, {nome:v})); }}),
        e(Sel,{value:pn.tipo, label:"Tipo", className:"w-36", onChange:function(v){ setPn(Object.assign({}, pn, {tipo:v})); }}, e("option",{value:"SOCIO"}, "Sócio"), e("option",{value:"FAMILIAR"}, "Família")), e(Btn,{v:"secondary", sm:true, disabled:!pn.nome.trim(), onClick:function(){ acao(c, "persona_add", pn); setPn(Object.assign({}, pn, {nome:""})); }}, "+ Pessoa")))),
    e(BlocoBarra,{cor:"azul", t:"Categorias", sub:"Pró-labore é do sistema e não se exclui"}, e("div",{className:"flex flex-col gap-2 p-4"}, ff.categorias.map(function(k){ return e("div",{key:k.chave, className:"flex items-center gap-2"}, k.sistema ? e("span",{className:"w-64 text-[13.5px] font-semibold"}, k.nome+" (sistema)") : campo(k.nome, function(v){ acao(c, "cat_set", {chave:k.chave, nome:v}); }, "w-64"), !k.sistema && iconBtn("trash", "Excluir", function(){ acao(c, "cat_del", {chave:k.chave}); }, true)); }),
      e("div",{className:"flex items-center gap-2 border-t border-white/10 pt-2"}, e(Txt,{value:cat, ph:"Nova categoria", label:"Nova categoria", className:"w-64", onChange:setCat, onEnter:function(){ if(cat.trim()){ acao(c, "cat_add", {nome:cat}); setCat(""); } }}), e(Btn,{v:"secondary", sm:true, disabled:!cat.trim(), onClick:function(){ acao(c, "cat_add", {nome:cat}); setCat(""); }}, "+ Categoria")))),
    e(BlocoBarra,{cor:"azul", t:"Contas bancárias da família", sub:"usadas como conta pagadora e como conta que recebe PIX (as de prestadores ficam em Prestadores)"}, e("div",{className:"flex flex-col gap-2 p-4"},
      contasFam.map(function(b){ return e("div",{key:b.id, className:"flex flex-wrap items-center gap-2 text-[13.5px]"}, e("b",{className:"min-w-[12rem]"}, contaLabel(ff, b.id)), e("span",{className:"text-muted-foreground"}, b.tipo+" · "+(b.chavePix||"sem chave PIX")+" · "+(b.personaId ? pessoaNome(ff, b.personaId) : "sem pessoa")), chk(b.ativo, function(v){ acao(c, "cb_set", {id:b.id, patch:{ativo:v}}); }, "ativa"), iconBtn("trash", "Excluir", function(){ acao(c, "cb_del", {id:b.id}); }, true)); }),
      e("div",{className:"flex flex-wrap items-end gap-2 border-t border-white/10 pt-2"}, e(Txt,{value:cb.nome, ph:"Nome / titular", label:"Nome", className:"w-44", onChange:function(v){ setCb(Object.assign({}, cb, {nome:v})); }}), e(Txt,{value:cb.banco, ph:"Banco", label:"Banco", className:"w-32", onChange:function(v){ setCb(Object.assign({}, cb, {banco:v})); }}),
        e(Sel,{value:cb.tipo, label:"Tipo", className:"w-24", onChange:function(v){ setCb(Object.assign({}, cb, {tipo:v})); }}, e("option",{value:"PF"}, "PF"), e("option",{value:"PJ"}, "PJ")), e(Txt,{value:cb.chavePix, ph:"Chave PIX", label:"Chave PIX", className:"w-44", onChange:function(v){ setCb(Object.assign({}, cb, {chavePix:v})); }}),
        e(Sel,{value:cb.personaId, label:"Pessoa", className:"w-40", onChange:function(v){ setCb(Object.assign({}, cb, {personaId:v})); }}, e("option",{value:""}, "Sem pessoa"), ff.personas.map(function(p){ return e("option",{key:p.id, value:p.id}, p.nome); })), e(Btn,{v:"secondary", sm:true, disabled:!cb.nome.trim(), onClick:function(){ acao(c, "cb_add", cb); setCb(Object.assign({}, cb, {nome:"", chavePix:""})); }}, "+ Conta")))),
    e(BlocoBarra,{cor:"azul", t:"Lançamento retroativo", sub:"mês passado fica travado para corrigir valor ou desfazer pagamento; libere aqui só quando precisar"}, e("div",{className:"flex flex-col gap-3 p-4"},
      e("div",{className:"flex flex-wrap items-end gap-2"}, e(Sel,{value:mes, label:"Mês", className:"w-52", onChange:setMes}, passados.map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })), e(Btn,{v:"secondary", disabled:ff.liberados.indexOf(mes)>=0, onClick:function(){ acao(c, "mes_liberar", {ym:mes}); }}, "Liberar")),
      ff.liberados.length>0 && e("div",{className:"flex flex-wrap gap-2"}, ff.liberados.slice().sort().map(function(k){ return e("span",{key:k, className:"flex items-center gap-2 rounded-full bg-warning/20 px-3 py-1 text-[12.5px] font-bold text-warning"}, nomeMes(k)+" liberado", e("button",{onClick:function(){ acao(c, "mes_revogar", {ym:k}); }, className:"underline"}, "travar")); }))))));
}

export { DetPrest, AbaFfHome, AbaFfContas, AbaFfPagas, AbaFfPix, AbaFfPrest, AbaFfProlab, AbaFfRelatorio, AbaFfHist, AbaFfConfig };

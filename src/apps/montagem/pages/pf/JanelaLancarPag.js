// Sorelly Admin · montagem — pages/pf/JanelaLancarPag.js
// JANELA "Lançar pagamento" do Resumo - Pagamentos (Marcus, 24/11/2026: "copie o card exatamente igual do Contas a receber, tudo 100%").
// É a MESMA janela "Lançar recebimento" da Contas a receber (pages/ContasReceberLista.js › LancarPix): mesmo fundo azul, faixas numeradas, campos de 22 px e letra de 11 px,
// mesma lista de escolha (components/caixa-escolha.js), mesmo menu por níveis (components/caixa-arvore.js), painel "O que vai acontecer" à direita e rodapé Cancelar / botão principal.
// "Para onde foi" é UM menu por níveis: Empresa › Fornecedor / Prestador, ou Sócios › Marcus › 68 Gang. Quem escolhe o prestador da família já escolhe o sócio dono dele (Marcus, 24/11/2026:
// "entra no Marcus, entra no Gang, já sabe que é dele; não pode enviar para o Gang da Anamaria"): o sócio nunca é digitado nem trocado.
// Empresa grava com a ação de sempre ("lanc_add" em domain/pf.js); prestador da família grava o Pix na Família (PIX revendedoras), que vira repasse e abate a dívida.
import { Dinheiro } from "@/apps/montagem/components/padrao";
import { CaixaArvore } from "@/apps/montagem/components/caixa-arvore";
import { CaixaEscolha } from "@/apps/montagem/components/caixa-escolha";
import { baixaDividas } from "@/apps/montagem/domain/financeiro-familiar";
import { ajustaExcesso, destinoSaldo, hojeIso, janelaPorChave, janelasDoForn, lerAlocs, pagoJanela, porPedidoAtivo } from "@/apps/montagem/domain/pf";
import { enviarAnexo, lerArquivo as lerAnexo } from "@/apps/montagem/lib/anexo";
import { IdentPedidos, paraAcao } from "@/apps/montagem/pages/pf/PorPedido";
import { aviso, brl, dbr, op } from "@/apps/montagem/pages/pf/ui";
import { createPortal } from "react-dom";
import { e, useState } from "@/shared/react";

var AZ = "var(--bloco-titulo)", FUNDO = "#1b3463";   // azul do sistema e azul escuro do fundo: os mesmos da janela Lançar recebimento
var CAMPO = "w-full rounded border border-white/30 bg-[var(--bloco-titulo)] px-1.5 text-center text-[11px] text-white outline-none placeholder:text-white/70 focus-visible:ring-1 focus-visible:ring-white [color-scheme:dark]";   // padrao-ok: janela compacta, letra de 11 px, igual à Lançar recebimento
var BTN = "rounded border border-white/40 bg-[var(--bloco-titulo)] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão da janela
var BTN_AZ = "rounded border border-white/60 bg-[#3f6bb8] px-3 text-center text-[11px] font-semibold text-white hover:brightness-125 active:brightness-90 focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60";   // padrao-ok: botão principal da janela
var ALTO = {height:"22px", lineHeight:"20px"};   // padrao-ok: 22 px, igual à Lançar recebimento
var BLOCO = "mx-1.5 mt-1 rounded-md border-2 border-white/40";
var campo = function(rot, no, cls){ return e("label",{className:"flex flex-col items-center gap-0.5 text-center "+(cls || "")}, e("span",{className:"text-[11px] font-semibold leading-none text-white"}, rot), no); };   // padrao-ok: rótulo de 11 px
var faixa = function(t){ return e("div",{className:"flex items-center justify-center rounded-t-[4px] px-2 text-[11px] font-semibold text-white", style:{height:"18px", background:AZ}}, t); };   // padrao-ok: barra de seção de 18 px
var Lr = function(rot, val){ return e("div",{key:rot, className:"flex justify-between gap-2 border-b border-white/15 py-0.5 text-[11px]"}, e("span",null, rot), e("b",{className:"text-right"}, val || "—")); };   // padrao-ok: linha de 11 px do resumo
var dm = function(iso){ return iso ? String(iso).slice(8, 10)+"/"+String(iso).slice(5, 7) : ""; };
var FIXO = function(t){ return e("div",{className:CAMPO+" flex items-center justify-center", style:{minHeight:"22px", lineHeight:"14px"}}, t); };

function JanelaLancarPag(p){
  var c = p.c, ffx = c.s.ff || {};
  var sCh = useState(p.chave || ""), chave = sCh[0], sd = useState(p.chave ? "pf|"+parseInt(p.chave.split("|")[0]) : ""), dest = sd[0], setDest = sd[1];
  var ehFam = dest.indexOf("ff|")===0;
  // ---------- empresa (fornecedor e prestador da Sorelly) ----------
  var j = chave ? janelaPorChave(c.pf, chave) : null, f = chave ? c.pf.fornecedores.find(function(x){ return x.id===parseInt(chave.split("|")[0]); }) : null;
  var aberto = j ? Math.max(0, j.total-pagoJanela(c.pf, chave)) : 0;
  var st = useState({data:hojeIso(), rev:"", valor:aberto>0.005 ? aberto.toFixed(2) : "", conta:"", chavePix:"", pagoPor:"", arq:null, adiar:"manter"}), v = st[0], setV = st[1];
  var sm = useState(""), msg = sm[0], setMsg = sm[1], ss = useState(false), salvando = ss[0], setSalvando = ss[1];
  var sfa = useState({contaId:"", rev:"", data:hojeIso(), valor:"", arq:null}), fa = sfa[0], setFa0 = sfa[1];
  var datasDe = function(fid){ return janelasDoForn(c.pf, fid).slice().sort(function(x, y){ return x.limite.localeCompare(y.limite); }); };
  var escolheData = function(k){ var jj = k ? janelaPorChave(c.pf, k) : null, ab = jj ? Math.max(0, jj.total-pagoJanela(c.pf, k)) : 0; sCh[1](k); setV(Object.assign({}, v, {valor:ab>0.005 ? ab.toFixed(2) : "", adiar:"manter"})); setMsg(""); };
  var escolheForn = function(fid){ var ds = datasDe(fid), alvo = ds.find(function(x){ return pagoJanela(c.pf, x.chave)<x.total-0.005; }) || ds[ds.length-1]; escolheData(alvo ? alvo.chave : ""); };
  var porPed = !!f && porPedidoAtivo(c.pf, f.id), sAl = useState([]), alocs = sAl[0];   // "Este pagamento se refere a:" (só fornecedor com a opção ligada)
  var set = function(k, x){ var n = Object.assign({}, v); n[k] = x; setV(n); setMsg(""); };
  var vNum = parseFloat(v.valor), valorOk = vNum>0;
  // pago a mais: de novembro/2026 em diante a dívida da data sobe sozinha ("Diferença enviada a mais"); antes disso fica só o aviso
  var excV = vNum>aberto+0.005 ? Math.round((vNum-aberto)*100)/100 : 0, ajusta = excV && ajustaExcesso(c.pf, chave);
  // pagou menos do que falta: manter o saldo em aberto nesta data ou passar a diferença para a 1ª data do mês seguinte (só depois de vencida)
  var difMenos = vNum>0.005 && aberto-vNum>0.005 ? Math.round((aberto-vNum)*100)/100 : 0, dst = difMenos && j && j.limite<hojeIso() ? destinoSaldo(c.pf, chave) : null;
  var enviarS = function(){
    if(!chave){ setMsg("Escolha o fornecedor ou prestador em Conta que recebeu."); return; }
    var rev = v.rev.trim(); if(!rev){ setMsg("Informe o nome da revendedora (ou de quem pagou)."); return; }
    if(!(vNum>0)){ setMsg("Informe o valor pago."); return; }
    if(!v.data){ setMsg("Informe a data do pagamento."); return; }
    var arq = v.arq, base = {chave:chave, data:v.data, revendedora:rev, valor:vNum, conta:v.conta.trim(), chavePix:v.chavePix.trim(), pagoPor:v.pagoPor.trim(), forcar:true, adiar:!!dst && v.adiar==="adiar"};
    if(porPed && alocs.length){ var cfA = lerAlocs(c.pf, f.id, vNum, paraAcao(alocs), null); if(cfA.erro){ setMsg(cfA.erro); return; } base.alocs = cfA.alocs; }   // um registro só; a divisão vai junto
    // TRAVA DE REPETIDO (Marcus, 24/11/2026): o mesmo pagamento (fornecedor, valor, data e revendedora) já lançado pede confirmação
    var igual = (c.pf.lancamentos || []).some(function(l0){ return !l0.auto && l0.fornId===f.id && Math.abs(Number(l0.valor)-vNum)<0.005 && l0.data===v.data && String(l0.revendedora || "").trim().toLowerCase()===rev.toLowerCase(); });
    if(igual && !window.confirm("Já existe um pagamento igual: mesmo fornecedor, valor, data e revendedora. Lançar mesmo assim?")) return;
    setSalvando(true); setMsg("");
    var gravar = function(){ op(c, "lanc_add", Object.assign({}, base, arq ? {arqNome:arq.name, arqTipo:arq.type, arqData:hojeIso()} : {})); p.fechar(chave); };
    if(!arq) return gravar();
    // o comprovante vai para o SERVIDOR (todo mundo abre, em qualquer computador); só foto ou PDF (Marcus, 16/11/2026)
    lerAnexo(arq).then(function(a){ return enviarAnexo("pf", a); }).then(function(sv){ base.arqKey = sv.key; gravar(); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"O pagamento será lançado sem anexo.", "alerta"); arq = null; gravar(); });
  };
  // ---------- prestador da família: o sócio vem do próprio prestador ----------
  var prestsF = (ffx.prest || []).filter(function(x){ return x.ativo!==false; }), prSel = ehFam ? (prestsF.find(function(x){ return x.id===dest.slice(3); }) || null) : null;
  var contasPr = prSel ? (ffx.contasBanc || []).filter(function(cb){ return cb.prestadorId===prSel.id && cb.ativo!==false; }) : [];
  var contaSel = contasPr.find(function(cb){ return cb.id===fa.contaId; }) || (contasPr.length===1 ? contasPr[0] : null);
  var persSel = prSel ? (ffx.personas || []).find(function(x){ return x.id===prSel.responsavelId; }) || null : null;
  var faltaPr = prSel ? baixaDividas({dividas:ffx.dividas || [], repasses:ffx.repasses || []}, prSel.id).falta : 0;
  var setFa = function(o){ setFa0(function(a){ return Object.assign({}, a, o); }); setMsg(""); };
  var vFa = parseFloat(fa.valor), valorFaOk = vFa>0;
  var enviarF = function(){
    if(!prSel){ setMsg("Escolha o prestador em Conta que recebeu."); return; }
    if(!persSel){ setMsg("Este prestador não tem sócio responsável no Financeiro familiar."); return; }
    if(!contaSel){ setMsg(contasPr.length ? "Escolha a conta bancária." : "Este prestador não tem conta cadastrada no Financeiro familiar."); return; }
    var revF = fa.rev.trim(); if(!revF){ setMsg("Informe o nome da revendedora (ou de quem pagou)."); return; }
    if(!valorFaOk){ setMsg("Informe o valor pago."); return; }
    if(!fa.data){ setMsg("Informe a data do pagamento."); return; }
    var igualF = (ffx.pix || []).some(function(q){ return q.personaId===persSel.id && Math.abs(Number(q.valor)-vFa)<0.005 && q.data===fa.data && String(q.origem || "").trim().toLowerCase()===revF.toLowerCase(); });   // trava de repetido
    if(igualF && !window.confirm("Já existe um Pix igual na Família: mesmo sócio, valor, data e revendedora. Lançar mesmo assim?")) return;
    setSalvando(true); setMsg("");
    var gravarF = function(sv, arqF){ c.d({type:"FF", op:"pix_add", por:c.por, personaId:persSel.id, data:fa.data, valor:vFa, origem:revF, contaId:contaSel.id, forma:"PIX", compKey:sv ? sv.key : "", compNome:arqF ? arqF.name : "", compTipo:arqF ? arqF.type : ""}); p.fechar(""); };
    if(!fa.arq) return gravarF(null, null);
    lerAnexo(fa.arq).then(function(a){ return enviarAnexo("ff", a); }).then(function(sv){ gravarF(sv, fa.arq); }, function(err){ aviso(c, ((err && err.message) ? err.message+" " : "")+"O pagamento será lançado sem anexo.", "alerta"); gravarF(null, null); });
  };
  // ---------- menu "Conta que recebeu": Empresa › Fornecedor / Prestador · Sócios › sócio › prestador dele ----------
  var itensForn = function(tipo){ return c.pf.fornecedores.filter(function(x){ return (x.tipo==="prestador")===(tipo==="prestador"); }).map(function(x){ return ["pf|"+x.id, x.nome, "Empresa › "+x.nome]; }); };
  var nosSocios = (ffx.personas || []).filter(function(x){ return prestsF.some(function(pr){ return pr.responsavelId===x.id; }); }).map(function(x){
    return {t:x.nome, itens:prestsF.filter(function(pr){ return pr.responsavelId===x.id; }).map(function(pr){ return ["ff|"+pr.id, pr.nome, x.nome+" › "+pr.nome]; })}; });
  var arvore = [{t:"Empresa", filhos:[{t:"Fornecedor", itens:itensForn("fornecedor")}, {t:"Prestador", itens:itensForn("prestador")}]}].concat(nosSocios.length ? [{t:"Sócios", filhos:nosSocios}] : []);
  var escolheDest = function(id){ setDest(id); setMsg(""); if(id.indexOf("pf|")===0) escolheForn(parseInt(id.slice(3))); else setFa({contaId:""}); };
  var sel = function(rot, valor, aoMudar, ops, vazio){ return campo(rot, e(CaixaEscolha,{rot:rot, valor:valor, ops:ops, vazio:vazio || "Escolha", aoMudar:aoMudar, cls:CAMPO, estilo:ALTO, fundo:FUNDO, campoCls:CAMPO}), "w-full"); };
  var campoTxt = function(rot, valor, ph, aoMudar){ return campo(rot, e("input",{value:valor, "aria-label":rot, placeholder:ph, className:CAMPO, style:ALTO, onChange:function(ev){ aoMudar(ev.target.value); }}), "w-full"); };
  var campoValor = function(valor, aoMudar){ return campo("Valor", e(Dinheiro,{value:valor, out:"ponto", label:"Valor pago", className:"w-full h-[22px]! rounded! border-white/30! bg-[var(--bloco-titulo)]! text-center text-[11px]! text-white!", onChange:aoMudar}), "w-full"); };   // padrao-ok: campo de valor de 22 px
  var campoData = function(valor, aoMudar){ return campo("Data do pagamento", e("input",{type:"date", value:valor, max:hojeIso(), "aria-label":"Data do pagamento", className:CAMPO, style:ALTO, onChange:function(ev){ aoMudar(ev.target.value); }}), "w-full"); };
  var campoComp = function(arq, aoMudar){ return campo("Comprovante (opcional)", e("label",{className:"flex w-full cursor-pointer items-center justify-center rounded border border-white/30 px-1.5 text-center text-[11px] text-white hover:brightness-125 active:brightness-90", style:Object.assign({background:AZ}, ALTO)}, arq ? arq.name : "Escolher foto ou PDF", e("input",{type:"file", accept:"image/*,application/pdf", "aria-label":"Comprovante", className:"hidden", onChange:function(ev){ var a = ev.target.files && ev.target.files[0]; ev.target.value = ""; if(a) aoMudar(a); }})), "w-full"); };   // padrao-ok: letra de 11 px da janela
  var opsData = f ? datasDe(f.id).map(function(x){ var fl = Math.max(0, x.total-pagoJanela(c.pf, x.chave)); return [x.chave, dbr(x.limite)+" · "+(fl>0.005 ? "falta "+brl(fl) : "quitado")]; }) : [];
  var segundoCampo = !dest ? campo("Entra no pagamento de", FIXO("Escolha a conta antes"), "w-full")
    : ehFam ? (contasPr.length>1 ? sel("Conta bancária", contaSel ? contaSel.id : "", function(x){ setFa({contaId:x}); }, contasPr.map(function(x){ return [x.id, x.nome]; }), "Escolha a conta") : campo("Conta bancária", FIXO(contaSel ? contaSel.nome : "Sem conta cadastrada"), "w-full"))
    : sel("Entra no pagamento de", chave, escolheData, opsData, "Escolha a data");
  var esq = e("div",{className:"pb-1"},
    e("div",{className:BLOCO}, faixa("1 · Para onde foi"),
      e("div",{className:"grid w-full grid-cols-2 items-start gap-1 p-1.5"},
        campo("Conta que recebeu", e(CaixaArvore,{rot:"Conta que recebeu", valor:dest, arvore:arvore, vazio:"Escolha a conta", aoMudar:escolheDest, cls:CAMPO, estilo:ALTO, fundo:FUNDO, campoCls:CAMPO}), "w-full"),
        segundoCampo)),
    e("div",{className:BLOCO}, faixa("2 · Quem pagou"),
      e("div",{className:"grid w-full grid-cols-2 items-start gap-1 p-1.5"},
        ehFam ? campoTxt("Nome da revendedora", fa.rev, "Ex.: Ana Paula de Lima", function(x){ setFa({rev:x}); }) : campoTxt("Nome da revendedora", v.rev, "Ex.: Ana Paula de Lima", function(x){ set("rev", x); }),
        ehFam ? campo("Pix de (sócio dono do prestador)", FIXO(persSel ? persSel.nome : (prSel ? "Sem sócio" : "")), "w-full") : campoTxt("Pago por (de onde saiu)", v.pagoPor, "Ex.: Marcus PF, Lucas, revendedora", function(x){ set("pagoPor", x); }))),
    e("div",{className:BLOCO}, faixa("3 · Pagamento"),
      e("div",{className:"flex flex-col gap-1 p-1.5"},
        e("div",{className:"grid w-full grid-cols-3 gap-1"},
          ehFam ? campoData(fa.data, function(x){ setFa({data:x}); }) : campoData(v.data, function(x){ set("data", x); }),
          ehFam ? campoValor(fa.valor, function(x){ setFa({valor:x}); }) : campoValor(v.valor, function(x){ set("valor", x); }),
          ehFam ? campoComp(fa.arq, function(a){ setFa({arq:a}); }) : campoComp(v.arq, function(a){ set("arq", a); })),
        !ehFam && e("div",{className:"grid w-full grid-cols-2 gap-1"},
          campoTxt("Conta", v.conta, "Ex.: Pix - Bradesco Prime", function(x){ set("conta", x); }),
          campoTxt("Chave Pix enviada", v.chavePix, "Chave que recebeu o Pix", function(x){ set("chavePix", x); })))),
    !ehFam && porPed && e("div",{className:BLOCO+" p-1.5"}, e(IdentPedidos,{c:c, fid:f.id, valor:v.valor, alocs:alocs, setAlocs:sAl[1], lancId:null})));
  var dir = ehFam
    ? e("div",{className:"flex flex-col border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
        e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que vai acontecer"),   // padrao-ok: título de 11 px
        Lr("Prestador", prSel ? prSel.nome : ""), Lr("Pix de", persSel ? persSel.nome : ""), Lr("Falta nas dívidas", prSel ? brl(faltaPr) : ""), Lr("Conta bancária", contaSel ? contaSel.nome : ""), Lr("Revendedora", fa.rev.trim()), Lr("Valor", valorFaOk ? brl(vFa) : ""), Lr("Data", fa.data ? dm(fa.data) : ""),
        Lr("Situação", fa.arq ? "Com comprovante" : "Pendente: falta o comprovante"),
        e("p",{className:"pt-2 text-center text-[11px]"}, "O Pix entra em Família › PIX revendedoras e abate a dívida do prestador."))   // padrao-ok: aviso de 11 px
    : e("div",{className:"flex flex-col border-l border-white/15 bg-[#223f74] px-2.5 py-2"},
        e("div",{className:"pb-1 text-center text-[11px] font-semibold"}, "O que vai acontecer"),   // padrao-ok: título de 11 px
        Lr("Fornecedor", f ? f.nome : ""), Lr("Entra no pagamento de", chave ? dbr(chave.split("|")[1]) : ""), Lr("Falta nesta data", chave ? brl(aberto) : ""), Lr("Revendedora", v.rev.trim()), Lr("Pago por", v.pagoPor.trim()), Lr("Conta", v.conta.trim()), Lr("Valor", valorOk ? brl(vNum) : ""), Lr("Data", v.data ? dm(v.data) : ""),
        Lr("Situação", v.arq ? "Com comprovante" : "Pendente: falta o comprovante"),
        excV>0 && e("p",{className:"pt-2 text-center text-[11px] font-semibold "+(ajusta ? "" : "text-warning")}, ajusta ? "Diferença enviada a mais: "+brl(excV)+". A dívida desta data sobe de "+brl(j ? j.total : 0)+" para "+brl((j ? j.total : 0)+excV)+"." : "Passou do total em "+brl(excV)+". Fica só o aviso na linha."),   // padrao-ok: aviso de 11 px
        dst && e("div",{className:"pt-2 text-center text-[11px] font-semibold"}, "Falta "+brl(difMenos)+" nesta data"),   // padrao-ok: título de 11 px
        dst && e("div",{className:"grid grid-cols-2 gap-1 pt-1"}, [["manter", "Manter em aberto"], ["adiar", "Passar para "+dbr(dst.limite)]].map(function(o){ return e("button",{key:o[0], type:"button", disabled:salvando, onClick:function(){ set("adiar", o[0]); }, style:ALTO, className:v.adiar===o[0] ? BTN_AZ : BTN}, o[1]); })));
  var enviar = function(){ if(salvando) return; if(ehFam) enviarF(); else enviarS(); }, comArq = ehFam ? fa.arq : v.arq;
  return createPortal(e("div",{role:"dialog", "aria-modal":"true", "aria-label":"Lançar pagamento", onMouseDown:function(ev){ if(ev.target===ev.currentTarget && !salvando) p.fechar(null); }, className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"},
    e("div",{className:"flex max-h-[92vh] w-full max-w-4xl flex-col rounded-lg border-2 pb-1.5 text-center text-white shadow-xl", style:{background:FUNDO, borderColor:AZ}},
      e("div",{className:"relative flex items-center justify-center rounded-t-md px-2 py-1 text-white", style:{background:AZ}}, e("b",{className:"text-[11px]"}, "Lançar pagamento"), e("button",{type:"button", "aria-label":"Fechar", disabled:salvando, onClick:function(){ p.fechar(null); }, className:"absolute right-1 rounded px-1 text-[11px] font-semibold underline hover:bg-white/20 active:bg-white/30"}, "Fechar")),   // padrao-ok: título de 11 px e botão de 11 px
      e("div",{className:"grid", style:{gridTemplateColumns:"1.6fr 1fr"}}, esq, dir),
      e("div",{className:"flex flex-wrap items-center gap-1.5 border-t border-white/15 px-3 py-1.5"},
        msg && e("span",{role:"alert", className:"text-[11px] font-semibold text-warning"}, msg),   // padrao-ok: aviso de 11 px da janela
        e("span",{className:"ml-auto"}),
        e("button",{type:"button", disabled:salvando, onClick:function(){ p.fechar(null); }, style:ALTO, className:BTN+" min-w-20"}, "Cancelar"),
        e("button",{type:"button", disabled:salvando, onClick:enviar, style:ALTO, className:BTN_AZ+" min-w-20"}, salvando ? "Lançando" : (comArq ? "Lançar" : "Lançar sem comprovante"))))), document.body);
}

export { JanelaLancarPag };

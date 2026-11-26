// Sorelly Admin · montagem — pages/link-pagamento/ImportarEsitef.js
// Janela "Importar e-SiTef" (Marcus, 16/11/2026): a Hellen baixa a planilha do dia no e-SiTef e escolhe o arquivo aqui.
// O sistema lê o CSV (acentos do Windows), mostra o que vai mudar e só grava depois do "Importar". Repetir o mesmo arquivo não duplica nada (a chave é o NSU).
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ROT_ESITEF, esitefPlanejar, formatarReais } from "@/apps/montagem/domain/link-pagamento";
import { e, useMemo, useState } from "@/shared/react";

// "13/11/2026 16:55:39" -> "2026-11-13T16:55:39"
var isoDe = function(v){ var m = String(v || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/); return m ? m[3]+"-"+m[2]+"-"+m[1]+"T"+(m[4] ? (m[4].length===5 ? m[4]+":00" : m[4]) : "00:00:00") : ""; };
var dBR = function(iso){ return iso ? iso.slice(0, 10).split("-").reverse().join("/")+" "+iso.slice(11, 16) : "—"; };
var ROT_ACAO = {nova:"Nova", atualizar:"Atualiza", vincular:"Confirma", igual:"Sem mudança", ignorar:"Ignorada"};

// lê o texto do CSV (separador ;). Valor vem em centavos. Última linha "TOTAL:" é ignorada.
function lerCsv(texto){
  var ls = String(texto).split(/\r?\n/).filter(function(x){ return x.trim(); }); if(!ls.length) return [];
  var cab = ls[0].split(";").map(function(x){ return x.trim().toUpperCase(); }), ix = function(n){ return cab.indexOf(n); };
  if(ix("NSU")<0 || ix("STATUS")<0 || ix("VALOR")<0) return null;
  var out = [];
  ls.slice(1).forEach(function(l){ var c = l.split(";"), nsu = (c[ix("NSU")] || "").trim(); if(!/^\d+$/.test(nsu)) return;
    var cr = isoDe(c[ix("DATACRIACAO")]), ef = isoDe(c[ix("DATAEFETIVACAO")]);
    out.push({nsu:nsu, status:(c[ix("STATUS")] || "").trim().toUpperCase(), pedido:(c[ix("PEDIDO")] || "").trim(), valor:Math.round(Number(c[ix("VALOR")]) || 0)/100,
      criadoEm:cr, pagoEm:ef || cr, parcelas:Math.round(Number(c[ix("PARCELAS")]) || 1) || 1, autorizacao:(c[ix("AUTORIZACAO")] || "").trim(), bandeira:(c[ix("NOMEAUTORIZADORA")] || "").trim()}); });
  return out;
}

function ImportarEsitef(p){
  var L = p.L, st = useState({linhas:null, erro:"", nome:""}), s = st[0], al = useState({}), alt = al[0];
  var plano = useMemo(function(){ return s.linhas ? esitefPlanejar(L.lp, s.linhas) : []; }, [s.linhas, L.lp.solicitacoes, L.lp.esitefIgnorados]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cont = function(a){ return plano.filter(function(x){ return x.acao===a; }).length; };
  // Hellen, 19/11/2026: a representante também gera link no e-SiTef e esse não é do setor. Cada linha que muda algo tem uma caixa Incluir; o que ela desmarca fica de fora e volta desmarcado na próxima importação.
  var escolhivel = function(x){ return x.acao==="nova" || x.acao==="atualizar" || x.acao==="vincular"; };
  var marcada = function(x){ var n = x.linha.nsu; return alt[n]!==undefined ? alt[n] : !x.fora; };
  var marcarTodas = function(v){ var o = {}; plano.forEach(function(x){ if(escolhivel(x)) o[x.linha.nsu] = v; }); al[1](o); };
  var qtMarcadas = plano.filter(function(x){ return escolhivel(x) && marcada(x); }).length, qtEscolhiveis = plano.filter(escolhivel).length;
  var qtPagos = plano.filter(function(x){ return escolhivel(x) && marcada(x) && x.para==="pago"; }).length;   // entram como Pago com "Falta" na coluna Comprovante (26/11/2026)
  var escolher = function(ev){
    var f = ev.target.files && ev.target.files[0]; if(!f) return;
    var r = new FileReader();
    r.onload = function(){ var tx; try { tx = new TextDecoder("windows-1252").decode(r.result); } catch(x){ tx = new TextDecoder().decode(r.result); }
      var ls = lerCsv(tx); al[1]({}); st[1]({linhas:ls && ls.length ? ls : null, nome:f.name, erro:ls===null ? "Este arquivo não parece o relatório do e-SiTef (faltam as colunas NSU, STATUS e VALOR)." : ls.length ? "" : "O arquivo não tem nenhuma transação."}); };
    r.onerror = function(){ st[1]({linhas:null, nome:"", erro:"Não consegui ler o arquivo."}); };
    r.readAsArrayBuffer(f);
  };
  var linhas = plano.map(function(x){ var l = x.linha; return {id:l.nsu, nsu:l.nsu, inc:!escolhivel(x) ? "—" : marcada(x) ? "Sim" : "Não", acao:ROT_ACAO[x.acao], pedido:l.pedido, valor:l.valor, situacao:ROT_ESITEF[l.status] || l.status, criadoEm:l.criadoEm, aut:l.autorizacao || "—", obs:x.motivo || (x.fora && !marcada(x) ? "Deixada de fora antes" : x.revisar ? "Dia passado: confira antes de descontar" : "")}; });
  var cols = [{k:"inc", t:"Incluir", render:function(v, l){ var x = plano.find(function(y){ return y.linha.nsu===l.nsu; }); if(!x || !escolhivel(x)) return "—";
      return e("input",{type:"checkbox", checked:marcada(x), "aria-label":"Incluir "+l.pedido, className:"h-4 w-4 cursor-pointer", onClick:function(ev){ ev.stopPropagation(); }, onChange:function(ev){ var o = Object.assign({}, alt); o[x.linha.nsu] = ev.target.checked; al[1](o); }}); }},
    {k:"acao", t:"O que acontece"}, {k:"pedido", t:"Revendedora"}, {k:"valor", t:"Valor", fmt:formatarReais, render:formatarReais}, {k:"situacao", t:"Situação"},
    {k:"criadoEm", t:"Criado em", fmt:dBR, render:dBR}, {k:"aut", t:"Autorização"}, {k:"nsu", t:"NSU"}, {k:"obs", t:"Aviso"}];
  var mudou = qtMarcadas;
  var importar = function(){ var nsus = plano.filter(function(x){ return escolhivel(x) && marcada(x); }).map(function(x){ return x.linha.nsu; }); if(L.exec("esitef_importar", {linhas:s.linhas, nsus:nsus})) p.fechar(); };
  return e("div",{className:"fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3", onClick:p.fechar},
    e("div",{className:"flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-lg border border-white/30 bg-[#0f1a2e] text-white", onClick:function(ev){ ev.stopPropagation(); }},
      e("div",{className:"flex items-center gap-3 border-b border-white/20 bg-[var(--bloco-titulo)] px-3 py-2"},
        e("b",{className:"text-[13px] uppercase"}, "Importar relatório do e-SiTef"), e("span",{className:"flex-1"}),
        e("label",{className:"inline-flex h-8 cursor-pointer items-center rounded-md border border-white/50 px-3 text-[13px] font-semibold hover:bg-white/15"}, "Escolher arquivo (.csv)", e("input",{type:"file", accept:".csv,text/csv", className:"hidden", onChange:escolher})),
        e(Botao,{onClick:p.fechar}, "Fechar")),
      s.erro && e("p",{className:"px-3 py-3 text-center text-[13px] font-semibold text-[#fca5a5]"}, s.erro),
      !s.linhas && !s.erro && e("p",{className:"px-3 py-8 text-center text-[13px]"}, "Baixe a planilha do dia no e-SiTef e escolha o arquivo aqui. Nada é gravado antes de você confirmar."),
      s.linhas && e("div",{className:"flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/20 px-3 py-2 text-[13px]"},
        e("span",null, s.nome), e("span",null, "Linhas ", e("b",null, String(plano.length))), e("span",null, "Novas ", e("b",{className:"text-success"}, String(cont("nova")))),
        e("span",null, "Atualizam ", e("b",null, String(cont("atualizar")+cont("vincular")))), e("span",null, "Sem mudança ", e("b",null, String(cont("igual")))),
        cont("ignorar")>0 && e("span",null, "Ignoradas ", e("b",{className:"text-[#FBBF24]"}, String(cont("ignorar")))), e("span",null, "Marcadas ", e("b",null, qtMarcadas+" de "+qtEscolhiveis)),
        qtPagos>0 && e("span",{title:"O e-SiTef confirma o pagamento, mas não traz o comprovante. Depois de importar, anexe na coluna Comprovante (26/11/2026)."}, "Pagos sem comprovante ", e("b",{className:"text-[#FBBF24]"}, String(qtPagos))), e("span",{className:"flex-1"}),
        qtEscolhiveis>0 && e(Botao,{onClick:function(){ marcarTodas(qtMarcadas<qtEscolhiveis); }}, qtMarcadas<qtEscolhiveis ? "Marcar todas" : "Desmarcar todas"),
        e(Botao,{principal:true, desabilitado:!mudou, onClick:importar}, mudou ? "Importar "+mudou+" linha"+(mudou===1 ? "" : "s") : "Nada para importar")),
      s.linhas && e("div",{className:"overflow-auto"}, e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"id", centro:true, grade:true, semLimpar:true, semContagem:true}))));
}
export { ImportarEsitef, lerCsv };

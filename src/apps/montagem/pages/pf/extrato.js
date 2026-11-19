// Sorelly Admin · montagem — pages/pf/extrato.js
// Apoio das telas Resumo do mês e Lançamento de pagamentos: mês escolhido (as duas telas seguem o mesmo mês) e o acerto que vai para o fornecedor
// (página HTML do extrato, link e mensagem de WhatsApp). As contas ficam em domain/pf.js; aqui só apresentação.
import { brl, dbr, forn, janelaPorChave, lancDaJanela, mesAtual, mqAplicado, pagoJanela } from "@/apps/montagem/domain/pf";
import { esc, htmlExtrato } from "@/apps/montagem/lib/pf-extrato-html";
import { obterArquivo } from "@/apps/montagem/lib/arquivos";
import { chamar } from "@/apps/montagem/lib/api";
import { useEffect, useState } from "@/shared/react";

// Link de conferência (18/11/2026): página pública do próprio sistema, /f/<código> (o endereço antigo acertos.sorelly.com.br nunca existiu).
function origem(){ return typeof window!=="undefined" ? window.location.origin : ""; }
var BASE_LINK = "/f/";

// ---- mês escolhido: um só para Resumo e Lançamento (trocar em uma tela troca na outra) ----
var mesSel = null, ouvintes = [];
function useMesLanc(){
  var st = useState(0), forca = st[1];
  useEffect(function(){ var f = function(){ forca(function(n){ return n+1; }); }; ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }, []);
  var mes = mesSel || mesAtual();
  return [mes, function(m){ mesSel = m; ouvintes.slice().forEach(function(f){ f(); }); }];
}

// ---- extrato do fornecedor ----
function blobParaUri(blob){ return new Promise(function(ok){ var fr = new FileReader(); fr.onload = function(){ ok(fr.result); }; fr.onerror = function(){ ok(""); }; fr.readAsDataURL(blob); }); }
// comprovantes anexados (guardados no navegador) viram data URI para o extrato ficar autocontido, como no HTML original
function uriDosComprovantes(pf, chave){
  var mapa = {};
  return Promise.all(lancDaJanela(pf, chave).filter(function(l){ return l.arqId; }).map(function(l){
    return obterArquivo(l.arqId).then(function(b){ return b ? blobParaUri(b) : ""; }).catch(function(){ return ""; }).then(function(u){ mapa[l.id] = u; });
  })).then(function(){ return mapa; });
}
// gera o extrato (com os comprovantes embutidos) e devolve uma promessa do texto HTML
function montarExtrato(pf, chave){ return uriDosComprovantes(pf, chave).then(function(uris){ return htmlExtrato(pf, chave, uris); }); }
function nomeArquivoExtrato(pf, chave){ var p = chave.split("|"); return "acerto-"+forn(pf, parseInt(p[0])).nome.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+p[1]+".html"; }
function linkDoAcerto(pf, chave){ var t = (pf.tokensAcerto||{})[chave]; return t ? origem()+BASE_LINK+(chave.indexOf("mq|")===0 ? "cartao/" : "")+t : ""; }
// o código do link é criado SÓ no servidor, uma vez por data, e nunca troca (18/11/2026): a tela pede e recebe o endereço completo
function pedirLink(chave){ return chamar("POST", "/pf/link", {chave:chave}).then(function(r){ return origem()+BASE_LINK+(chave.indexOf("mq|")===0 ? "cartao/" : "")+r.codigo; }); }
// mesmo comportamento nas duas janelas: começa com o link já conhecido e confirma com o servidor
function useLinkConferencia(pf, chave){
  var st = useState(linkDoAcerto(pf, chave)), link = st[0], setLink = st[1], se = useState(""), erro = se[0], setErro = se[1];
  useEffect(function(){ var vivo = true; setErro(""); setLink(linkDoAcerto(pf, chave)); pedirLink(chave).then(function(u){ if(vivo) setLink(u); }, function(x){ if(vivo) setErro((x && x.message) || "Não consegui gerar o link."); }); return function(){ vivo = false; }; }, [chave]);   // eslint-disable-line react-hooks/exhaustive-deps
  return {link:link, erro:erro};
}

// mensagem de WhatsApp pronta
function msgWhatsApp(pf, chave, link){
  var p = chave.split("|"), f = forn(pf, parseInt(p[0])), j = janelaPorChave(pf, chave), ls = lancDaJanela(pf, chave), total = j ? j.total : 0, pago = Math.min(pagoJanela(pf, chave), total), falta = total-pago, mq = mqAplicado(pf, chave);
  return "Olá, *"+f.nome+"*! 👋\n\nSegue o acerto com vencimento em *"+dbr(p[1])+"*:\n\n"+
    "💰 Total do período: *"+brl(total)+"*\n✅ Já enviado: *"+brl(pago)+"*\n"+
    (mq>0.005 ? "💳 Desconto em cartão: *"+brl(mq)+"*\n" : "")+(falta>0.005 ? "⏳ Em aberto: *"+brl(falta)+"*\n" : "")+
    "📄 Pix enviados: *"+ls.length+"*\n\nConfira a listagem e os comprovantes aqui:\n"+(link || linkDoAcerto(pf, chave))+"\n\nQualquer divergência, é só responder por aqui. Obrigado! 🙏";
}
// copia para a área de transferência (com plano B para navegador antigo)
function copiar(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(ok){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); ok(); });
}

export { BASE_LINK, useMesLanc, esc, htmlExtrato, montarExtrato, nomeArquivoExtrato, linkDoAcerto, pedirLink, useLinkConferencia, msgWhatsApp, copiar };

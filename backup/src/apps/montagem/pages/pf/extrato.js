// Sorelly Admin · montagem — pages/pf/extrato.js
// Apoio das telas Resumo do mês e Lançamento de pagamentos: mês escolhido (as duas telas seguem o mesmo mês) e o acerto que vai para o fornecedor
// (página HTML do extrato, link e mensagem de WhatsApp). As contas ficam em domain/pf.js; aqui só apresentação.
import { brl, dbr, forn, hojeIso, janelaPorChave, lancDaJanela, mesAtual, mesLabel, mqAplicado, pagoJanela } from "@/apps/montagem/domain/pf";
import { obterArquivo } from "@/apps/montagem/lib/arquivos";
import { useEffect, useState } from "@/shared/react";

// Endereço de EXEMPLO (igual ao HTML original): o link real depende do servidor que a DevMaster vai publicar.
var BASE_LINK = "https://acertos.sorelly.com.br/f/";

// ---- mês escolhido: um só para Resumo e Lançamento (trocar em uma tela troca na outra) ----
var mesSel = null, ouvintes = [];
function useMesLanc(){
  var st = useState(0), forca = st[1];
  useEffect(function(){ var f = function(){ forca(function(n){ return n+1; }); }; ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }, []);
  var mes = mesSel || mesAtual();
  return [mes, function(m){ mesSel = m; ouvintes.slice().forEach(function(f){ f(); }); }];
}

// ---- extrato do fornecedor ----
function esc(t){ return String(t==null ? "" : t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function blobParaUri(blob){ return new Promise(function(ok){ var fr = new FileReader(); fr.onload = function(){ ok(fr.result); }; fr.onerror = function(){ ok(""); }; fr.readAsDataURL(blob); }); }
// comprovantes anexados (guardados no navegador) viram data URI para o extrato ficar autocontido, como no HTML original
function uriDosComprovantes(pf, chave){
  var mapa = {};
  return Promise.all(lancDaJanela(pf, chave).filter(function(l){ return l.arqId; }).map(function(l){
    return obterArquivo(l.arqId).then(function(b){ return b ? blobParaUri(b) : ""; }).catch(function(){ return ""; }).then(function(u){ mapa[l.id] = u; });
  })).then(function(){ return mapa; });
}
function htmlExtrato(pf, chave, uris){
  var parte = chave.split("|"), limite = parte[1], f = forn(pf, parseInt(parte[0])), j = janelaPorChave(pf, chave), ls = lancDaJanela(pf, chave), descMq = mqAplicado(pf, chave);
  var total = j ? j.total : 0, pago = Math.min(pagoJanela(pf, chave), total), falta = total-pago, quitado = falta<=0.005;
  var comp = function(l){ return uris[l.id] || (String(l.arqData||"").indexOf("data:")===0 ? l.arqData : ""); };
  var linhas = ls.map(function(l){
    var u = comp(l);
    return '<div class="pix"><div class="pix-top"><span class="d">'+dbr(l.data)+'</span><span class="v">'+brl(l.valor)+'</span></div>'+
      '<div class="pix-sub"><b>'+esc(l.revendedora)+'</b>'+(l.conta && l.conta!=="—" ? " · "+esc(l.conta) : "")+'</div>'+
      (u ? '<details class="comp-det"><summary>📎 Ver comprovante</summary><div class="comp-in">'+
            (String(l.arqTipo).indexOf("image")===0
              ? '<a href="'+u+'" target="_blank"><img src="'+u+'" alt="Comprovante '+esc(l.arqNome)+'"></a>'
              : '<a class="comp-pdf" href="'+u+'" target="_blank" download="'+esc(l.arqNome)+'">Abrir '+esc(l.arqNome)+'</a>')+
          '</div></details>'
        : '<div class="sem-comp">Comprovante não anexado</div>')+'</div>';
  }).join("");
  var xls = {
    arquivo: ("Acerto "+f.nome+" "+limite).replace(/[\\/:*?"<>|]/g,"-"),
    resumo: [["Fornecedor", f.nome], ["Vencimento", dbr(limite)], ["Referência", mesLabel(j ? j.mes+"-01" : limite)], ["Total do período", +total.toFixed(2)], ["Recebido", +pago.toFixed(2)], ["Em aberto", +falta.toFixed(2)]]
      .concat(descMq>0.005 ? [["Desconto maquininha", +descMq.toFixed(2)]] : []),
    linhas: ls.map(function(l){ return [dbr(l.data), l.revendedora||"", (l.conta && l.conta!=="—") ? l.conta : "", +(+l.valor).toFixed(2), (l.arqId || l.arqData) ? "Anexado" : "Não anexado"]; })
  };
  var xlsJson = JSON.stringify(xls).replace(/</g,"\\u003c");
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">'+
  '<title>Acerto '+esc(f.nome)+' — '+dbr(limite)+'</title><style>'+
  '*{box-sizing:border-box}body{margin:0;background:#0f1012;color:#f2f2f0;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;padding:18px}'+
  '.wrap{max-width:640px;margin:0 auto}header{border-bottom:2px solid #2a2c31;padding-bottom:16px;margin-bottom:18px}'+
  '.emp{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffd633;font-weight:700}h1{font-size:23px;margin:6px 0 2px;letter-spacing:-.01em}.per{font-size:14.5px;opacity:.8}'+
  '.tag{display:inline-block;margin-top:10px;padding:5px 12px;border-radius:999px;font-size:13px;font-weight:700}.ok{background:rgba(62,207,142,.16);color:#3ecf8e}.pend{background:rgba(255,159,67,.16);color:#ff9f43}'+
  '.tot{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}.tot div{background:#17181c;border:1px solid #2a2c31;border-radius:10px;padding:12px}'+
  '.tot span{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.7;font-weight:600}.tot b{display:block;font-size:17px;margin-top:3px;font-variant-numeric:tabular-nums}'+
  '.g{color:#3ecf8e}.r{color:#ff6b6b}h2{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#ffd633;margin:0 0 12px}'+
  '.pix{background:#17181c;border:1px solid #2a2c31;border-radius:10px;padding:14px;margin-bottom:11px}.pix-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}'+
  '.pix-top .d{font-weight:700}.pix-top .v{font-weight:800;font-size:17px;color:#3ecf8e;font-variant-numeric:tabular-nums}.pix-sub{font-size:14px;opacity:.85;margin-top:2px}.comp-det{margin-top:11px}'+
  '.comp-det summary{cursor:pointer;list-style:none;display:inline-block;font-size:13.5px;font-weight:600;color:#4dd4d4;border:1px solid #2a3a3a;background:rgba(77,212,212,.08);border-radius:999px;padding:5px 13px;user-select:none}'+
  '.comp-det summary::-webkit-details-marker{display:none}.comp-det[open] summary{color:#9aa0a6;border-color:#2a2c31;background:transparent}.comp-det[open] summary::after{content:" — ocultar"}'+
  '.comp-in{margin-top:10px}.comp-in img{width:100%;border-radius:8px;border:1px solid #2a2c31;display:block}.comp-pdf{display:inline-block;color:#4dd4d4;text-decoration:none;font-weight:600;font-size:14px}'+
  '.sem-comp{margin-top:9px;font-size:13px;opacity:.6}.vazio{background:#17181c;border:1px dashed #2a2c31;border-radius:10px;padding:20px;text-align:center;opacity:.8}'+
  'footer{margin-top:26px;padding-top:15px;border-top:1px solid #2a2c31;font-size:12.5px;opacity:.65}'+
  '.xls-btn{display:inline-flex;align-items:center;gap:6px;margin:0 0 18px;padding:9px 16px;border-radius:9px;border:1px solid #2f7d55;background:rgba(62,207,142,.14);color:#3ecf8e;font-weight:700;font-size:14px;cursor:pointer;font-family:inherit}'+
  '.xls-btn:hover{background:rgba(62,207,142,.24)}.xls-btn:disabled{opacity:.6;cursor:wait}@media print{body{background:#fff;color:#000}.pix,.tot div{background:#fff;border-color:#ccc}.xls-btn{display:none}}'+
  '</style></head><body><div class="wrap"><header><div class="emp">Grupo Sorelly</div><h1>'+esc(f.nome)+'</h1>'+
  '<div class="per">Acerto com vencimento em '+dbr(limite)+' · referência '+mesLabel(j ? j.mes+"-01" : limite)+'</div>'+
  '<div class="tag '+(quitado ? "ok" : "pend")+'">'+(quitado ? "Pago integralmente" : "Pagamento em andamento")+'</div></header>'+
  '<div class="tot"><div><span>Total do período</span><b>'+brl(total)+'</b></div><div><span>Recebido</span><b class="g">'+brl(pago)+'</b></div>'+
  '<div><span>Em aberto</span><b class="'+(falta>0.005 ? "r" : "")+'">'+brl(falta)+'</b></div></div>'+
  (descMq>0.005 ? '<h2>Desconto em cartão</h2><div class="pix"><div class="pix-top"><span class="d">Maquininha</span><span class="v">'+brl(descMq)+'</span></div><div class="pix-sub">Abatido do saldo das vendas passadas na maquininha</div></div>' : "")+
  '<button class="xls-btn" id="xls-btn" onclick="baixarExcel()">⬇ Baixar listagem em Excel</button>'+
  '<h2>Pix enviados ('+ls.length+')</h2>'+(ls.length ? linhas : '<div class="vazio">Nenhum Pix lançado neste período até o momento.</div>')+
  '<footer>Extrato gerado em '+dbr(hojeIso())+' pelo Grupo Sorelly. Documento somente para conferência — em caso de divergência, responda no mesmo contato.</footer></div><script>'+
  'var XLS='+xlsJson+';'+
  'function baixarExcel(){var b=document.getElementById("xls-btn");b.disabled=true;b.textContent="Gerando…";function fim(){b.disabled=false;b.textContent="⬇ Baixar listagem em Excel";}'+
    'function gerar(){var cab=["Data","Revendedora","Conta","Valor (R$)","Comprovante"];var aoa=XLS.resumo.concat([[],cab],XLS.linhas);'+
      'var tot=XLS.linhas.reduce(function(s,l){return s+l[3]},0);aoa.push(["","","Total dos Pix",Math.round(tot*100)/100,""]);'+
      'var ws=XLSX.utils.aoa_to_sheet(aoa);ws["!cols"]=[{wch:20},{wch:38},{wch:34},{wch:14},{wch:14}];'+
      'for(var k in ws){if(k[0]!=="!"&&typeof ws[k].v==="number")ws[k].z="#,##0.00";}'+
      'var wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Pagamentos");XLSX.writeFile(wb,XLS.arquivo+".xlsx");fim();}'+
    'function csv(){var q=function(v){v=typeof v==="number"?v.toFixed(2).replace(".",","):String(v==null?"":v);return /[;"\\n]/.test(v)?\'"\'+v.replace(/"/g,\'""\')+\'"\':v};'+
      'var rows=XLS.resumo.concat([[],["Data","Revendedora","Conta","Valor (R$)","Comprovante"]],XLS.linhas);'+
      'var t="\\ufeff"+rows.map(function(r){return r.map(q).join(";")}).join("\\r\\n");'+
      'var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([t],{type:"text/csv;charset=utf-8"}));a.download=XLS.arquivo+".csv";document.body.appendChild(a);a.click();a.remove();fim();}'+
    'if(window.XLSX)return gerar();var s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";s.onload=gerar;s.onerror=csv;document.head.appendChild(s);}'+
  '<\/script></body></html>';
}
// gera o extrato (com os comprovantes embutidos) e devolve uma promessa do texto HTML
function montarExtrato(pf, chave){ return uriDosComprovantes(pf, chave).then(function(uris){ return htmlExtrato(pf, chave, uris); }); }
function nomeArquivoExtrato(pf, chave){ var p = chave.split("|"); return "acerto-"+forn(pf, parseInt(p[0])).nome.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+p[1]+".html"; }
function linkDoAcerto(pf, chave){ return pf.tokensAcerto[chave] ? BASE_LINK+pf.tokensAcerto[chave] : ""; }

// mensagem de WhatsApp pronta
function msgWhatsApp(pf, chave){
  var p = chave.split("|"), f = forn(pf, parseInt(p[0])), j = janelaPorChave(pf, chave), ls = lancDaJanela(pf, chave), total = j ? j.total : 0, pago = Math.min(pagoJanela(pf, chave), total), falta = total-pago, mq = mqAplicado(pf, chave);
  return "Olá, *"+f.nome+"*! 👋\n\nSegue o acerto com vencimento em *"+dbr(p[1])+"*:\n\n"+
    "💰 Total do período: *"+brl(total)+"*\n✅ Já enviado: *"+brl(pago)+"*\n"+
    (mq>0.005 ? "💳 Desconto em cartão: *"+brl(mq)+"*\n" : "")+(falta>0.005 ? "⏳ Em aberto: *"+brl(falta)+"*\n" : "")+
    "📄 Pix enviados: *"+ls.length+"*\n\nConfira a listagem e os comprovantes aqui:\n"+linkDoAcerto(pf, chave)+"\n\nQualquer divergência, é só responder por aqui. Obrigado! 🙏";
}
// copia para a área de transferência (com plano B para navegador antigo)
function copiar(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(ok){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); ok(); });
}

export { BASE_LINK, useMesLanc, esc, montarExtrato, nomeArquivoExtrato, linkDoAcerto, msgWhatsApp, copiar };

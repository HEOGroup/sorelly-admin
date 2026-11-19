// Relatório POR PEDIDO dos Pagamentos a fornecedores (19/11/2026). Função pura: serve à tela ("Ver como o fornecedor vê", "Baixar HTML", "Gerar mensagem")
// e à página pública do link restrito (app/acerto/[token]). Só entram os pedidos escolhidos; nada do fechamento completo nem de outros pedidos.
// Pix dividido entre pedidos: mostra o valor TOTAL da transferência e o valor DESTINADO a este pedido (nunca o total como se fosse do pedido).
// comp(l) devolve o endereço do comprovante do lançamento l (data URL na tela, rota do link na página pública) ou "".
import { brl, dbr, forn, resumoPedidoPf } from "@/apps/montagem/domain/pf";

var AVISO_ESCOPO = "Este demonstrativo se refere exclusivamente aos pedidos informados. Outros pedidos e saldos do fornecedor não estão incluídos.";
function esc(t){ return String(t==null ? "" : t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
var dt = function(d){ return d ? dbr(String(d).slice(0, 10)) : "—"; };   // dbr já devolve dd/mm/aaaa

// dados prontos do relatório: {f, pedidos:[resumo], periodo, total...}
function dadosPedidos(pf, fornId, ids){
  var f = forn(pf, fornId), lista = ids.map(function(id){ return resumoPedidoPf(pf, Number(id)); }).filter(function(r){ return r && r.pd.fornId===fornId; });
  var datas = []; lista.forEach(function(r){ if(r.periodo.de) datas.push(r.periodo.de); if(r.periodo.ate) datas.push(r.periodo.ate); }); datas.sort();
  var soma = function(k){ return Math.round(lista.reduce(function(s, r){ return s+r[k]; }, 0)*100)/100; };
  return {f:f, pedidos:lista, periodo:{de:datas[0]||"", ate:datas[datas.length-1]||""}, valor:soma("valor"), pago:soma("pagoIdentificado"), saldo:soma("saldo"), ajustes:soma("ajustesTotal")};
}

function htmlPedidos(pf, fornId, ids, comp, extra){
  var d = dadosPedidos(pf, fornId, ids), nome = d.f ? d.f.nome : "Fornecedor";
  var bloco = function(r){
    var pd = r.pd, cond = pd.parcelas.map(function(p){ return "<li>"+esc((p.forma==="pix_revendedora" ? "Pix" : p.forma==="boleto" ? "Boleto" : p.forma==="cartao" ? "Cartão" : p.forma==="cheque" ? "Cheque" : "Pix empresa")+" · "+brl(p.valor)+" · vence "+dt(p.venc))+"</li>"; }).join("");
    var pags = r.pagos.map(function(x){ var u = comp ? comp(x.l) : "";
      return "<tr><td>"+esc(dt(x.l.data))+"</td><td>"+esc(x.l.revendedora||"—")+"</td><td>"+(x.total-x.valor>0.005 ? "Valor total da transferência: "+esc(brl(x.total))+"<br><b>Valor destinado a este pedido: "+esc(brl(x.valor))+"</b>" : "<b>"+esc(brl(x.valor))+"</b>")+(x.adiant ? "<br>Adiantamento / crédito" : "")+"</td><td>"+(u ? "<a href=\""+esc(u)+"\" target=\"_blank\" rel=\"noopener\">Abrir comprovante</a>" : "—")+"</td></tr>"; }).join("");
    var ajs = r.ajustes.map(function(a){ return "<li>"+esc(a.rotulo)+": − "+esc(brl(a.valor))+"</li>"; }).join("");
    return "<section><h2>"+esc(pd.numero||("Pedido "+pd.id))+"</h2>"+(pd.descricao ? "<p>"+esc(pd.descricao)+"</p>" : "")+
      "<div class=\"g\"><div><span>Data do pedido</span><b>"+esc(dt(pd.data))+"</b></div><div><span>Valor do pedido</span><b>"+esc(brl(r.valor))+"</b></div><div><span>Ajustes identificados</span><b>"+esc(brl(r.ajustesTotal))+"</b></div><div><span>Total pago identificado</span><b class=\"ok\">"+esc(brl(r.pagoIdentificado))+"</b></div><div><span>Saldo em aberto</span><b class=\""+(r.saldo>0.005 ? "ruim" : "ok")+"\">"+esc(brl(Math.max(0, r.saldo)))+"</b></div></div>"+
      "<h3>Condições negociadas</h3><ul>"+cond+"</ul>"+(pd.condicoes ? "<p>"+esc(pd.condicoes)+"</p>" : "")+
      (ajs ? "<h3>Ajustes</h3><ul>"+ajs+"</ul>" : "")+
      "<h3>Pagamentos identificados</h3>"+(pags ? "<table><thead><tr><th>Data</th><th>Revendedora</th><th>Valor</th><th>Comprovante</th></tr></thead><tbody>"+pags+"</tbody></table>" : "<p>Nenhum pagamento identificado para este pedido.</p>")+
      (r.nfPago>0.005 ? "<p>Parcelas com nota fiscal já pagas: "+esc(brl(r.nfPago))+"</p>" : "")+"</section>";
  };
  return "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex\"><title>Pedidos · "+esc(nome)+"</title>"+
    "<style>body{margin:0;background:#0f1115;color:#fff;font:13px/1.45 Inter,system-ui,sans-serif}main{max-width:860px;margin:0 auto;padding:16px}h1{font-size:18px;margin:0 0 4px;text-align:center}h2{font-size:15px;margin:0 0 6px;text-align:center}h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 4px}"+
    "section{border:1px solid #2f3542;border-radius:8px;padding:12px;margin:12px 0}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}.g div{background:#1a1e26;border-radius:6px;padding:6px;text-align:center}.g span{display:block;font-size:11px}"+
    ".ok{color:#4ade80}.ruim{color:#f87171}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #2f3542;padding:6px;text-align:center}th{font-size:11px;text-transform:uppercase}a{color:#93c5fd}.av{border:1px solid #3b82f6;background:#3b82f61a;border-radius:8px;padding:8px;text-align:center}p,li{margin:2px 0}</style></head><body><main>"+
    "<h1>"+esc(nome)+" · Demonstrativo por pedido</h1><p style=\"text-align:center\">"+esc(d.pedidos.length===1 ? "Pedido "+(d.pedidos[0].pd.numero||"") : d.pedidos.length+" pedidos")+" · período de "+esc(dt(d.periodo.de))+" a "+esc(dt(d.periodo.ate))+(extra && extra.geradoEm ? " · gerado em "+esc(dt(extra.geradoEm)) : "")+"</p>"+
    "<p class=\"av\">"+esc(AVISO_ESCOPO)+"</p>"+
    (d.pedidos.length>1 ? "<div class=\"g\" style=\"margin-top:10px\"><div><span>Valor dos pedidos</span><b>"+esc(brl(d.valor))+"</b></div><div><span>Total pago identificado</span><b class=\"ok\">"+esc(brl(d.pago))+"</b></div><div><span>Saldo em aberto</span><b class=\""+(d.saldo>0.005 ? "ruim" : "ok")+"\">"+esc(brl(Math.max(0, d.saldo)))+"</b></div></div>" : "")+
    d.pedidos.map(bloco).join("")+"</main></body></html>";
}

// mensagem de WhatsApp só com os pedidos escolhidos (sem o saldo geral do fornecedor)
function msgPedidos(pf, fornId, ids, link){
  var d = dadosPedidos(pf, fornId, ids), nome = d.f ? d.f.nome : "";
  var linhas = d.pedidos.map(function(r){ return "• *"+(r.pd.numero||("Pedido "+r.pd.id))+"*: pedido "+brl(r.valor)+" · pago identificado "+brl(r.pagoIdentificado)+(r.saldo>0.005 ? " · em aberto "+brl(r.saldo) : " · sem saldo em aberto"); });
  return "Olá, *"+nome+"*! 👋\n\nSegue o demonstrativo "+(d.pedidos.length===1 ? "do pedido" : "dos pedidos")+" (período de "+dt(d.periodo.de)+" a "+dt(d.periodo.ate)+"):\n\n"+linhas.join("\n")+
    "\n\n"+AVISO_ESCOPO+(link ? "\n\nConfira os pagamentos e os comprovantes aqui:\n"+link : "")+"\n\nQualquer divergência, é só responder por aqui. Obrigado! 🙏";
}

export { AVISO_ESCOPO, dadosPedidos, htmlPedidos, msgPedidos };

// Relatório POR PEDIDO dos Pagamentos a fornecedores (19/11/2026). Função pura: serve à tela ("Ver como o fornecedor vê", "Baixar HTML", "Gerar mensagem")
// e à página pública do link restrito (app/acerto/[token]). Só entram os pedidos escolhidos; nada do fechamento completo nem de outros pedidos.
// Pix dividido entre pedidos: mostra o valor TOTAL da transferência e o valor DESTINADO a este pedido (nunca o total como se fosse do pedido).
// BOLETO (Nickolas, 19/11/2026): por padrão o relatório mostra SÓ a parte em Pix, igual ao acerto normal. Com a opção "Incluir boleto" (boleto:true),
// o HTML, o link e a mensagem passam a mostrar também as parcelas com nota (boleto, cartão, cheque), com vencimento e situação.
// comp(l) devolve o endereço do comprovante do lançamento l (data URL na tela, rota do link na página pública) ou "".
import { brl, dbr, forn, resumoPedidoPf } from "@/apps/montagem/domain/pf";

var AVISO_ESCOPO = "Este demonstrativo se refere exclusivamente aos pedidos informados. Outros pedidos e saldos do fornecedor não estão incluídos.";
function esc(t){ return String(t==null ? "" : t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
var dt = function(d){ return d ? dbr(String(d).slice(0, 10)) : "—"; };   // dbr já devolve dd/mm/aaaa
var r2 = function(v){ return Math.round((+v || 0)*100)/100; };
var FORMA = {pix_revendedora:"Pix", pix_empresa:"Pix empresa", boleto:"Boleto", cartao:"Cartão", cheque:"Cheque"};
var ehPix = function(p){ return p.forma==="pix_revendedora"; };

// um pedido no relatório: com boleto = valor inteiro; sem boleto = só a parte Pix
function linhaPedido(r, boleto){
  var nf = r.pd.parcelas.filter(function(p){ return !ehPix(p); });
  return {r:r, pd:r.pd, valor:boleto ? r.valor : r.pix, pago:boleto ? r.pagoIdentificado : r.pagoPix, saldo:boleto ? r.saldo : r.saldoPix, pix:r.pix, pagoPix:r.pagoPix, saldoPix:r.saldoPix,
    nf:boleto ? nf : [], nfValor:r.nf, nfPago:r.nfPago, nfSaldo:r.saldoNf, pixParcelas:r.pd.parcelas.filter(ehPix), npix:r.pagos.length};
}
// dados prontos do relatório: {f, pedidos:[linha], periodo, totais}
function dadosPedidos(pf, fornId, ids, boleto){
  var f = forn(pf, fornId), lista = ids.map(function(id){ return resumoPedidoPf(pf, Number(id)); }).filter(function(r){ return r && r.pd.fornId===fornId; }).map(function(r){ return linhaPedido(r, !!boleto); });
  var datas = []; lista.forEach(function(x){ if(x.r.periodo.de) datas.push(x.r.periodo.de); if(x.r.periodo.ate) datas.push(x.r.periodo.ate); }); datas.sort();
  var soma = function(k){ return r2(lista.reduce(function(s, x){ return s+x[k]; }, 0)); };
  return {f:f, boleto:!!boleto, pedidos:lista, periodo:{de:datas[0]||"", ate:datas[datas.length-1]||""}, valor:soma("valor"), pago:soma("pago"), saldo:soma("saldo"), npix:lista.reduce(function(s, x){ return s+x.npix; }, 0)};
}

function htmlPedidos(pf, fornId, ids, comp, extra){
  extra = extra || {};
  var d = dadosPedidos(pf, fornId, ids, extra.boleto), nome = d.f ? d.f.nome : "Fornecedor";
  var bloco = function(x){
    var r = x.r, pd = x.pd;
    var cond = x.pixParcelas.concat(x.nf).map(function(p){ return "<li>"+esc((FORMA[p.forma]||p.forma)+" · "+brl(p.valor)+" · vence "+dt(p.venc)+(!ehPix(p) ? " · "+(p.status==="Pago" ? "pago" : "em aberto") : ""))+"</li>"; }).join("");
    var pags = r.pagos.map(function(y){ var u = comp ? comp(y.l) : "";
      return "<tr><td>"+esc(dt(y.l.data))+"</td><td>"+esc(y.l.revendedora||"—")+"</td><td>"+(y.total-y.valor>0.005 ? "Valor total da transferência: "+esc(brl(y.total))+"<br><b>Valor destinado a este pedido: "+esc(brl(y.valor))+"</b>" : "<b>"+esc(brl(y.valor))+"</b>")+(y.adiant ? "<br>Adiantamento / crédito" : "")+"</td><td>"+(u ? "<a href=\""+esc(u)+"\" target=\"_blank\" rel=\"noopener\">Abrir comprovante</a>" : "—")+"</td></tr>"; }).join("");
    var ajs = r.ajustes.map(function(a){ return "<li>"+esc(a.rotulo)+": − "+esc(brl(a.valor))+"</li>"; }).join("");
    return "<section><h2>"+esc(pd.numero||("Pedido "+pd.id))+"</h2>"+(pd.descricao ? "<p>"+esc(pd.descricao)+"</p>" : "")+
      "<div class=\"g\"><div><span>Data do pedido</span><b>"+esc(dt(pd.data))+"</b></div><div><span>"+(d.boleto ? "Valor do pedido" : "Valor em Pix")+"</span><b>"+esc(brl(x.valor))+"</b></div>"+(r.ajustesTotal>0.005 ? "<div><span>Ajustes identificados</span><b>"+esc(brl(r.ajustesTotal))+"</b></div>" : "")+"<div><span>Já enviado</span><b class=\"ok\">"+esc(brl(x.pago))+"</b></div><div><span>Em aberto</span><b class=\""+(x.saldo>0.005 ? "ruim" : "ok")+"\">"+esc(brl(Math.max(0, x.saldo)))+"</b></div></div>"+
      (d.boleto && x.nf.length ? "<div class=\"g\" style=\"margin-top:6px\"><div><span>Parte em Pix</span><b>"+esc(brl(x.pix))+"</b></div><div><span>Boleto / com nota</span><b>"+esc(brl(x.nfValor))+"</b></div><div><span>Boleto pago</span><b class=\"ok\">"+esc(brl(x.nfPago))+"</b></div><div><span>Boleto em aberto</span><b class=\""+(x.nfSaldo>0.005 ? "ruim" : "ok")+"\">"+esc(brl(Math.max(0, x.nfSaldo)))+"</b></div></div>" : "")+
      "<h3>Condições negociadas</h3><ul>"+cond+"</ul>"+(pd.condicoes ? "<p>"+esc(pd.condicoes)+"</p>" : "")+
      (ajs ? "<h3>Ajustes</h3><ul>"+ajs+"</ul>" : "")+
      "<h3>Pix enviados</h3>"+(pags ? "<table><thead><tr><th>Data</th><th>Revendedora</th><th>Valor</th><th>Comprovante</th></tr></thead><tbody>"+pags+"</tbody></table>" : "<p>Nenhum Pix identificado para este pedido.</p>")+"</section>";
  };
  return "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><meta name=\"robots\" content=\"noindex\"><title>Pedidos · "+esc(nome)+"</title>"+
    "<style>body{margin:0;background:#0f1115;color:#fff;font:13px/1.45 Inter,system-ui,sans-serif}main{max-width:860px;margin:0 auto;padding:16px}h1{font-size:18px;margin:0 0 4px;text-align:center}h2{font-size:15px;margin:0 0 6px;text-align:center}h3{font-size:11px;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 4px}"+
    "section{border:1px solid #2f3542;border-radius:8px;padding:12px;margin:12px 0}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:6px}.g div{background:#1a1e26;border-radius:6px;padding:6px;text-align:center}.g span{display:block;font-size:11px}"+
    ".ok{color:#4ade80}.ruim{color:#f87171}table{width:100%;border-collapse:collapse}th,td{border-bottom:1px solid #2f3542;padding:6px;text-align:center}th{font-size:11px;text-transform:uppercase}a{color:#93c5fd}.av{border:1px solid #3b82f6;background:#3b82f61a;border-radius:8px;padding:8px;text-align:center}p,li{margin:2px 0}</style></head><body><main>"+
    "<h1>"+esc(nome)+" · Demonstrativo por pedido</h1><p style=\"text-align:center\">"+esc(d.pedidos.length===1 ? "Pedido "+(d.pedidos[0].pd.numero||"") : d.pedidos.length+" pedidos")+" · período de "+esc(dt(d.periodo.de))+" a "+esc(dt(d.periodo.ate))+" · "+(d.boleto ? "Pix e boleto" : "somente Pix")+(extra.geradoEm ? " · gerado em "+esc(dt(extra.geradoEm)) : "")+"</p>"+
    "<p class=\"av\">"+esc(AVISO_ESCOPO)+"</p>"+
    (d.pedidos.length>1 ? "<div class=\"g\" style=\"margin-top:10px\"><div><span>"+(d.boleto ? "Total dos pedidos" : "Total em Pix")+"</span><b>"+esc(brl(d.valor))+"</b></div><div><span>Já enviado</span><b class=\"ok\">"+esc(brl(d.pago))+"</b></div><div><span>Em aberto</span><b class=\""+(d.saldo>0.005 ? "ruim" : "ok")+"\">"+esc(brl(Math.max(0, d.saldo)))+"</b></div></div>" : "")+
    d.pedidos.map(bloco).join("")+"</main></body></html>";
}

// mensagem de WhatsApp no MESMO formato da mensagem normal do acerto, só com os pedidos escolhidos (sem o saldo geral do fornecedor)
function msgPedidos(pf, fornId, ids, link, boleto){
  var d = dadosPedidos(pf, fornId, ids, boleto), nome = d.f ? d.f.nome : "";
  var bloco = function(x){
    var b = "💰 Total do pedido (Pix): *"+brl(x.pix)+"*\n✅ Já enviado: *"+brl(x.pagoPix)+"*\n"+(x.saldoPix>0.005 ? "⏳ Em aberto: *"+brl(x.saldoPix)+"*\n" : "")+"📄 Pix enviados: *"+x.npix+"*\n";
    if(d.boleto) x.nf.forEach(function(p){ b += "🧾 "+(FORMA[p.forma]||p.forma)+": *"+brl(p.valor)+"* · vence "+dt(p.venc)+" · "+(p.status==="Pago" ? "pago" : "em aberto")+"\n"; });
    return b;
  };
  var corpo = d.pedidos.length===1
    ? "Segue o acerto do pedido *"+(d.pedidos[0].pd.numero||"")+"*:\n\n"+bloco(d.pedidos[0])
    : "Segue o acerto dos pedidos:\n\n"+d.pedidos.map(function(x){ return "*"+(x.pd.numero||("Pedido "+x.pd.id))+"*\n"+bloco(x); }).join("\n")+"\n💰 Total em Pix: *"+brl(d.pedidos.reduce(function(s, x){ return s+x.pix; }, 0))+"* · ✅ Já enviado: *"+brl(d.pedidos.reduce(function(s, x){ return s+x.pagoPix; }, 0))+"*\n";
  return "Olá, *"+nome+"*! 👋\n\n"+corpo+"\n"+AVISO_ESCOPO+"\n\n"+(link ? "Confira a listagem e os comprovantes aqui:\n"+link+"\n\n" : "")+"Qualquer divergência, é só responder por aqui. Obrigado! 🙏";
}

export { AVISO_ESCOPO, dadosPedidos, htmlPedidos, msgPedidos };

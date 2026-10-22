// Sorelly Admin — domain/mensagem-fechamento.js
// Ao fechar o atendimento: gera as duas mensagens prontas — uma para a revendedora e outra para o grupo da empresa.
// Recebe o que a Calculadora de acertos derivou (derivarAcerto) e o formulário do acerto.
import { reais } from "@/apps/montagem/domain/consignado";

var dataBR = function(iso){ return iso ? iso.split("-").reverse().join("/") : ""; };

// Resumo do kit entregue e conferido: condicionais (modelos, peças, valor), total, o que faltou e as peças de outro kit (só registradas)
function blocoKit(k){
  var linhas = ["📦 *Kit entregue e conferido:*"];
  (k.conds||[]).forEach(function(c){ linhas.push("• Condicional "+c.numero+": "+c.modelos+" modelos · "+c.pecas+" peças · "+reais(c.valor)); });
  linhas.push("Total: "+k.pecas+" peças · "+reais(k.valor)+" — conferidas "+k.lidas+" de "+k.esperadas);
  if((k.faltas||[]).length) linhas.push("⚠️ Faltaram: "+k.faltas.map(function(f){ return f.codigo+(f.qtd>1 ? " (×"+f.qtd+")" : ""); }).join(", "));
  if((k.sobras||[]).length) linhas.push("ℹ️ Peça(s) de outro kit, ficaram com a revendedora (só registrado): "+k.sobras.map(function(x){ return x.codigo; }).join(", "));
  return linhas;
}
// Kit novo ou reposição entregue (sem acerto): resumo da entrega + conferência
function mensagemEntrega(p){
  var titulo = p.tipo==="reposicao" ? "Reposição entregue" : "Kit novo entregue";
  var linhas = ["*"+titulo.toUpperCase()+"* — "+p.nome, "Representante: "+(p.rep||"—")+" · "+dataBR(p.data)].concat(p.kitConf ? blocoKit(p.kitConf) : ["Conferência das peças ainda não feita."]);
  if(p.condicionaisAssinadas!=null) linhas.push(p.condicionaisAssinadas ? "✅ Condicional assinada" : "⚠️ Condicional ainda sem assinatura");
  if(p.comissao>0) linhas.push("💰 Comissão da representante: "+reais(p.comissao));
  return linhas.join("\n");
}

function mensagemFechamento(p){
  var dv = p.dv, pa = dv.previaAcerto, f = p.form, prata = dv.ehPrata;
  var pecasBr = function(origem){ return (f.brindes||[]).filter(function(b){ return (b.origem||"nova")===origem; }); };
  var linhaBrinde = function(b){ return "• "+b.codigo+" — "+reais(b.valor)+(b.cat==="bb" ? " (Select)" : ""); };
  var pags = (f.pagamentos||[]).map(function(x,i){ return "• Pag. "+(i+1)+": "+reais(x.valor)+" — "+x.descricao+(x.forma==="credito" && x.parcelas>1 ? " "+x.parcelas+"x" : "")+" ("+dataBR(x.data)+")"+(x.anexo ? " 📎" : ""); });
  var ficam = (p.condFicam||[]).map(function(c){ return "Condicional "+c.numero+" ("+c.pecas+" peças)"; }).concat((p.expFicam||[]).map(function(x){ return x.qtd+" "+x.nome.toLowerCase(); }));
  var kitNovo = !f.pagamentos.length ? "—" : dv.kitNovoLiberado ? "liberado" : "não liberado";
  var prox = dv.pecasProx;
  var quitado = dv.restanteTotal<=0.009;

  var venda = dv.vendaEfetiva!=null ? dv.vendaEfetiva : f.vendaBruta, trocas = f.trocas||[];
  var origemTxt = function(o){ return (o||"nova")==="antiga" ? "kit antigo" : "kit novo"; };
  var linhasTroca = trocas.map(function(t){ var aj = t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0);
    return "• "+t.antigaCod+" ("+reais(t.antigaValor)+") → "+t.novaCod+" ("+reais(t.novaValor)+") — "+(t.tipo==="anterior" ? "peça de outro mês, " : "peça deste kit, ")+(aj>=0 ? "soma " : "desconta ")+reais(Math.abs(aj)); });
  var cliente = [
    "Olá, *"+p.nome.split(" ")[0]+"*! Segue o resumo do seu acerto"+(prata ? " (*Kit 100% Prata*)" : "")+" ✨",
    "",
    "🛍️ *Vendas:* "+reais(venda)+(dv.trocasAjuste ? " (com trocas)" : ""),
    "📊 *Comissão:* "+pa.comissaoPct+"%",
    "💎 *Valor do acerto:* "+reais(pa.valorAcerto),
    pa.taxaDeslocamento>0 ? "🚚 *Taxa de deslocamento:* "+reais(pa.taxaDeslocamento) : null,
    dv.excedenteBrinde>0 ? "🎁 *Brinde a mais:* "+reais(dv.excedenteBrinde) : null,
    dv.tagsValor>0 ? "🏷️ *Tags danificadas:* "+reais(dv.tagsValor) : null,
    "💰 *Total a pagar:* "+reais(dv.totalAPagar),
    "",
    pags.length ? "💳 *Pagamentos:*" : "Nenhum pagamento lançado.",
  ].concat(pags).concat([
    quitado ? "✅ *Acerto quitado*" : "⚠️ *Valor restante:* "+reais(dv.restanteTotal)+(f.recusouNegociar ? " — sem brinde; nota promissória executada em 48h úteis." : ""),
    "",
    dv.brindeLiberado && (f.brindes||[]).length ? "🎁 *Brindes:*" : (dv.brindeBloqueio ? "🎁 *Brinde:* "+dv.brindeBloqueio.curto.toLowerCase() : null),
  ]).concat(dv.brindeLiberado ? (f.brindes||[]).map(function(b){ return linhaBrinde(b)+" ("+origemTxt(b.origem)+")"; }) : []).concat(trocas.length ? ["", "🔄 *Trocas:*"].concat(linhasTroca) : []).concat([
    "",
    "📦 *Kit novo:* "+kitNovo,
    prox && prox.liberadas>0 ? "🗓️ *Peças liberadas para o próximo mês:* "+prox.liberadas+((f.pecasProxCodigos||[]).length ? " ("+f.pecasProxCodigos.join(", ")+")" : "") : null,
    dv.pecasADevolver!=null ? "↩️ *Peças para devolver:* "+dv.pecasADevolver : null,
    ficam.length ? "📌 *Continuam com você:* "+ficam.join("; ") : null,
    "",
    "Obrigada pela parceria! 💛 *Sorelly Joias*"
  ]).filter(function(x){ return x!==null && x!==undefined; }).join("\n");

  var grupo = [
    "*ACERTO FECHADO* — "+p.nome+(prata ? " · KIT 100% PRATA" : ""),
    "Atendimento: "+(p.origem==="interno" ? "interno (Sorelly)" : "rep. "+(p.rep||"—"))+" · "+dataBR(p.data),
    "Vendas "+reais(dv.vendaEfetiva!=null ? dv.vendaEfetiva : f.vendaBruta)+" · comissão "+pa.comissaoPct+"% · acerto "+reais(pa.valorAcerto)+(pa.taxaDeslocamento>0 ? " (+ taxa "+reais(pa.taxaDeslocamento)+")" : ""),
    "Pago "+reais(dv.totalPagoAtual)+" · "+(quitado ? "QUITADO" : "restante "+reais(dv.restanteTotal)+(f.recusouNegociar ? " (não quis negociar — NP 48h úteis)" : dv.acordoExistente ? " (acordo salvo)" : "")),
    pags.length ? pags.join("\n") : null,
    "Condicionais conferidas: "+(f.condicionaisSelecionadas||[]).join(", ")+" ("+dv.pecasCondSelecionadas+" peças)",
    "Peças: vendidas "+(f.pecasVendidas||0)+" · brindes "+(f.brindes||[]).length+" · trocas "+(f.trocas||[]).length+" · a devolver "+(dv.pecasADevolver===null ? "—" : dv.pecasADevolver),
    (f.brindes||[]).length ? "Brindes lançados:\n"+["antiga","nova"].map(function(o){ var l = pecasBr(o); return l.length ? "  Kit "+(o==="antiga" ? "ANTIGO (devolvendo)" : "NOVO (recebendo)")+":\n"+l.map(function(b){ return "  "+linhaBrinde(b); }).join("\n") : null; }).filter(Boolean).join("\n") : "Brindes: nenhum",
    "Kit novo: "+kitNovo+(f.kitNovoOk ? " (confirmado)" : ""),
    prox ? "Próximo mês: "+prox.liberadas+" peças liberadas"+((f.pecasProxCodigos||[]).length ? " — "+f.pecasProxCodigos.join(", ") : "") : null,
    ficam.length ? "Em aberto com a revendedora: "+ficam.join("; ") : null,
    p.remarcacoes ? "Remarcações: "+p.remarcacoes : null
  ].filter(function(x){ return x!==null && x!==undefined; }).join("\n");

  // acerto + kit novo: o resumo do kit entregue e conferido entra junto
  if(p.kitConf){ var kc = blocoKit(p.kitConf); cliente = cliente.replace("\n\nObrigada pela parceria", "\n\n"+kc.join("\n")+"\n\nObrigada pela parceria"); grupo = grupo+"\n"+kc.join("\n"); }
  return {cliente:cliente, grupo:grupo};
}

// PDF do acerto: abre uma folha limpa com o resumo e chama a impressão (escolher "Salvar como PDF")
function abrirPdfAcerto(titulo, texto){
  var esc = function(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); };
  var corpo = esc(texto).split("\n").map(function(l){ return l.trim()==="" ? "<br>" : "<p>"+l.replace(/\*([^*]+)\*/g,"<b>$1</b>")+"</p>"; }).join("");
  var w = window.open("", "_blank");
  if(!w) return false;
  w.document.write("<!doctype html><html><head><meta charset='utf-8'><title>"+esc(titulo)+"</title><style>body{font-family:Arial,sans-serif;max-width:560px;margin:24px auto;color:#111;font-size:14px;line-height:1.5}p{margin:2px 0}h1{font-size:18px;color:#8A6A12;border-bottom:2px solid #C9A13B;padding-bottom:6px}</style></head><body><h1>Sorelly Joias · "+esc(titulo)+"</h1>"+corpo+"</body></html>");
  w.document.close(); w.focus(); setTimeout(function(){ w.print(); }, 300);
  return true;
}

export { mensagemFechamento, mensagemEntrega, abrirPdfAcerto };

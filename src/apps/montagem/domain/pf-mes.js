// Sorelly Admin · montagem — domain/pf-mes.js
// Saldo de cada fornecedor para FECHAR O MÊS ATUAL e a data limite (A PAGAR menos PAGO), lido da planilha "Pag Fornecedores" (aba RESUMO MÊS) por scripts/planilha-fornecedores.mjs.
// Dados reais ficam em domain/pf-mes.local.js (fora do GitHub). Usado pela faixa "Fornecedores em aberto" do Direcionar Pix (24/10/2026).
// Regras do Marcus (REGRAS-DE-PIX.md, 11 a 13): Pix do dia quita a parcela aberta mais antiga da Pontual; o que passa no cartão quita o 1 a 10 do mês seguinte, com desconto estimado pela média dos últimos meses.
import { globLocal } from "@/lib/glob-local";
import { ehPrestador, hojeIso, janelasDoForn, mesAtual, mesMais, pagoJanela } from "@/apps/montagem/domain/pf";

var SERV = null;   // resumo vindo do servidor (módulo pfmes): vale no lugar do arquivo local, que só existe no computador do Marcus
function definirPfMes(d){ SERV = d && d.itens ? d : null; }
var LOCAL_ARQ = (function(){ try { var m = globLocal("apps/montagem/domain/pf-mes.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
var LOCAL = null;   // atualizado por trazer(): servidor primeiro, arquivo local depois
function trazer(){ LOCAL = SERV || LOCAL_ARQ; }
trazer();
var ALIAS = [[/pontual/i, "Pontual"], [/offi?c+e/i, "Office Graf"], [/point/i, "Point"], [/mega ?sul/i, "Mega Sul"], [/art ello/i, "Art Ello"], [/ellos/i, "Ellos"], [/dev ?master/i, "Devmaster"], [/\blin\b|linda/i, "Linda"], [/tucano/i, "Tucano"], [/charme/i, "Charme"]];

// "PONTUAL 11/10 á 20/10" → "Pontual · 11 a 20"; "EDSON OFFICCE GRAF 16/10 A 30/10" → "Office Graf · 16 a 30"; o resto fica como veio, com a primeira letra de cada palavra em maiúscula
function rotulo(nome){
  var d = String(nome).match(/(\d{1,2})\/\d{1,2}\s*[aáAÁ]\s*(\d{1,2})\/\d{1,2}/), base = ALIAS.filter(function(a){ return a[0].test(nome); })[0];
  if(base && d) return base[1]+" · "+d[1]+" a "+d[2];
  if(base) return base[1];
  return String(nome).toLowerCase().replace(/(^|\s)(\S)/g, function(m, a, b){ return a+b.toUpperCase(); });
}
// só o que falta (saldo maior que zero), fornecedores e prestadores (sócios não), pela data limite
function fornecedoresDoMes(cp, todos){   // todos = true: também os já pagos do mês (botão "Todos do mês")
  trazer(); if(!LOCAL) return [];
  return LOCAL.itens.filter(function(i){ return i.tipo==="fornecedor" && (todos || i.saldo>0.005) && ALIAS.some(function(a){ return a[0].test(i.nome); }); }).map(function(i, k){
    var al = ALIAS.filter(function(a){ return a[0].test(i.nome); })[0], d = al && cp ? cp.destinos.filter(function(z){ return z.ativo && z.nome.indexOf(al[1])===0; })[0] : null;
    return {id:"fm"+k, nome:rotulo(i.nome), aPagar:i.aPagar||0, pago:i.pago||0, saldo:i.saldo, ate:i.ate||"", obs:i.obs||"", destinoId:d ? d.id : "", pontual:/pontual/i.test(i.nome)};
  }).sort(function(a, b){ return (a.ate||"9999").localeCompare(b.ate||"9999") || b.saldo-a.saldo; });
}
// AO VIVO (12/11/2026, chamado do Marcus: o Direcionar mostrava outubro vencido e nenhum fornecedor de novembro): a lista de Contas a pagar sai dos pedidos e pagamentos do próprio sistema (pf), a mesma conta da tela Pagamentos a fornecedores. O resumo da planilha (acima) fica só como reserva quando o pf ainda não chegou.
// Mostra as janelas do mês atual e as dos 3 meses anteriores que ainda têm saldo (atrasadas). todos = true: também as já pagas do mês atual.
function fornecedoresDoMesPf(pf, cp, todos){
  if(!pf || !pf.fornecedores || !pf.pedidos) return fornecedoresDoMes(cp, todos);
  var atual = mesAtual(), desde = mesMais(atual, -3), out = [];
  pf.fornecedores.forEach(function(f){
    if(f.tipo!=="fornecedor" || ehPrestador(f)) return;
    var al = ALIAS.filter(function(a){ return a[0].test(f.nome); })[0], base = al ? al[1] : f.nome, dest = cp && cp.destinos ? cp.destinos.filter(function(z){ return z.ativo && z.nome.toLowerCase().indexOf(base.toLowerCase())===0; })[0] : null;
    var js = janelasDoForn(pf, f.id).filter(function(j){ return j.mes<=atual && j.mes>=desde; }).sort(function(a, b){ return a.limite.localeCompare(b.limite); });
    js.forEach(function(j){
      var pago = Math.min(pagoJanela(pf, j.chave), j.total), falta = Math.max(0, j.total-pago), doMes = j.mes===atual;
      if(!(falta>0.005) && !(todos && doMes)) return;
      var doMesJs = js.filter(function(x){ return x.mes===j.mes; }), k = doMesJs.indexOf(j), ini = k===0 ? "01" : String(parseInt(doMesJs[k-1].fim.slice(8, 10), 10)+1).padStart(2, "0");
      out.push({id:"fp"+f.id+"-"+j.limite, nome:doMesJs.length>1 ? base+" · "+ini+" a "+j.fim.slice(8, 10) : base, aPagar:j.total, pago:pago, saldo:falta, ate:j.limite, obs:"", destinoId:dest ? dest.id : "", pontual:/pontual/i.test(f.nome)});
    });
  });
  return out.sort(function(a, b){ return (a.ate||"9999").localeCompare(b.ate||"9999") || b.saldo-a.saldo; });
}
// Devedores (24/10/2026): quem mais recebe da Sorelly no mês e ainda falta pagar — prestadores pequenos e sócios. Mesma planilha, linhas que não são fornecedor de peça.
function devedoresDoMes(cp){
  trazer(); if(!LOCAL) return [];
  var cap = function(n){ return String(n).toLowerCase().replace(/(^|\s)(\S)/g, function(m, a, b){ return a+b.toUpperCase(); }); };
  return LOCAL.itens.filter(function(i){ return i.saldo>0.005 && !(i.tipo==="fornecedor" && ALIAS.some(function(a){ return a[0].test(i.nome); })); }).map(function(i, k){
    var pri = String(i.nome).toLowerCase().split(" ")[0], d = cp ? cp.destinos.filter(function(z){ return z.ativo && z.tipo!=="FORNECEDOR" && z.tipo!=="CNPJ" && String(z.nome).toLowerCase().split(" ")[0]===pri; })[0] : null;
    return {id:"dv"+k, nome:cap(i.nome), grupo:i.tipo==="socio" ? "Sócio" : "Prestador", saldo:i.saldo, ate:i.ate||"", obs:i.obs||"", destinoId:d ? d.id : ""};
  }).sort(function(a, b){ return a.grupo.localeCompare(b.grupo) || b.saldo-a.saldo; });
}
var mesDosDados = function(){ trazer(); return LOCAL ? LOCAL.mes : ""; };
var geradoEm = function(){ trazer(); return LOCAL ? LOCAL.geradoEm : ""; };
// desconto estimado do cartão da Pontual (média dos 3 últimos meses da aba de negociações)
var descontoCartao = function(){ trazer(); return LOCAL && LOCAL.cartao ? LOCAL.cartao.mediaUltimos3 : 10; };
export { definirPfMes, devedoresDoMes, fornecedoresDoMes, fornecedoresDoMesPf, descontoCartao, mesDosDados, geradoEm };

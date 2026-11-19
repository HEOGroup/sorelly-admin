// Sorelly Admin · montagem — pages/producao/ProdPagamentos.js
// Produção › PAGAMENTOS (só diretoria; 16/11/2026, Marcus: "enviar em Pix revendedora toda quarta-feira, daí sobe para o Lucas pagar no Direcionar").
// Uma planilha com tudo que se paga, por quarta-feira: diária da produção em casa (R$ 130,00 por dia trabalhado; o dia é pago na primeira quarta depois dele) e bônus do mês fechado.
// "Enviar ao Financeiro" cria o pedido da prestadora em Financeiro › Pagamentos a fornecedores › Prestadores de serviço, com UMA parcela de Pix revendedora na quarta; o Lucas paga no Direcionar.
// "Dias" abre a lista de dias da casa para marcar quais já foram pagos. Regras em domain/producao.js (pagamentosDaProducao).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { Dinheiro, Janela } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { pfReduz } from "@/apps/montagem/domain/pf";
import { LIMITE_EXCEDENTE, diaDaSemana, eCasa, formatarDia, formatarInteiro, formatarReais, hojeSP, pagamentosDaProducao, somaDias, valorDiaCasa } from "@/apps/montagem/domain/producao";
import { Painel } from "@/apps/montagem/pages/compras/visualCompras";
import { usePf } from "@/apps/montagem/pages/pf/ui";
import { Aviso, casca, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useEffect, useState } from "@/shared/react";

var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var LINK = "h-8 text-[13px] font-semibold underline hover:text-primary";

function AbaProdPagamentos(props){
  var x = usePr(), cf = usePf(), hoje = hojeSP(), sDias = useState(null), sPag = useState(null);
  // destino da prestadora no Direcionar (com banco e chave Pix do cadastro), criado uma vez só; também cobre o que já foi enviado antes
  var temDestino = function(f){ var ws = semAcento(f.nome).split(/\s+/).filter(Boolean).slice(0, 2), cp = cf.s.cp; return !!(cp && cp.destinos && cp.destinos.some(function(z){ var n = semAcento(z.nome); return z.ativo && z.tipo==="PRESTADOR" && ws.every(function(w){ return n.indexOf(w)>=0; }); })); };
  var garantirDestino = function(f){ if(f && cf.s.cp && !temDestino(f)) cf.d({type:"CP", op:"destino_add", por:cf.por, nome:f.nome.split(" ").slice(0, 2).join(" "), tipo:"PRESTADOR", banco:f.banco||"", chavePix:f.chavePix||""}); };
  var pendentesEnvio = x.admin ? pagamentosDaProducao(x.pr, hoje).filter(function(q){ return q.envio && !q.pago; }).map(function(q){ return q.func; }).join("|") : "";
  useEffect(function(){ pendentesEnvio.split("|").filter(Boolean).forEach(function(nome){ var ws = semAcento(nome).split(/\s+/).filter(Boolean), f = ((cf.pf && cf.pf.fornecedores) || []).filter(function(g){ var n = semAcento(g.nome); return g.tipo==="prestador" && ws.every(function(w){ return n.indexOf(w)>=0; }); })[0]; garantirDestino(f); }); pagamentosDaProducao(x.pr, hoje).filter(function(q){ return q.envio && !q.pago; }).forEach(function(q){ if(!temConta(q)) criaConta(q); }); }, [pendentesEnvio, Object.keys(x.pr.envios||{}).join(), !!(cf.s.cp && cf.s.cp.destinos), !!(cf.s.cpe && cf.s.cpe.lanc)]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!x.admin && !x.leitura) return casca(props && props.semRaiz, e(BlocoPainel,{titulo:"Pagamentos da produção", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var lista = pagamentosDaProducao(x.pr, hoje).filter(function(q){ return !(props && props.func) || String(q.func).trim().toLowerCase()===String(props.func).trim().toLowerCase(); });   // uma pessoa por vez (escolhida na tela Produção externa)
  // prestador do Financeiro com o mesmo nome (todas as palavras do nome da produção estão no nome do cadastro)
  var prestadorDe = function(nome){ var ws = semAcento(nome).split(/\s+/).filter(Boolean); return ((cf.pf && cf.pf.fornecedores) || []).filter(function(f){ var n = semAcento(f.nome); return f.tipo==="prestador" && ws.every(function(w){ return n.indexOf(w)>=0; }); })[0] || null; };

  // CONTA A PAGAR (Marcus, 17/11/2026: "sempre sobe no Contas a pagar e na aba de fornecedores, igual dos outros"): cada envio vira uma conta a pagar na quarta (natureza 3.01.01.19 Freelancer, Folha e pessoal); marcar pago dá a baixa nela
  var idConta = function(p){ return "prod-"+p.id; };
  var itemConta = function(p){ return {id:idConta(p), filial:"34", nat:"3.01.01.19", natNome:"Freelancer (Taxa-salário)", pref:"PIX", forn:p.func, nome:p.func+" · "+p.tipo+" · "+formatarDia(p.data), venc:p.data, valor:p.valor, status:"apagar", fam:false, saida:"Pix", centro:"", hist:"Enviado pela Produção › Produção externa", emissao:hoje}; };
  var temConta = function(p){ return (((cf.s.cpe||{}).lanc)||[]).some(function(l){ return l.id===idConta(p); }); };
  var criaConta = function(p){ cf.d({type:"CPE_LANC_DEL", id:idConta(p), por:cf.por}); cf.d({type:"CPE_LANC_ADD", itens:[itemConta(p)]}); };
  var pagar = function(p, valorPago){
    var vp = valorPago===undefined ? p.valor : valorPago;
    // 1) conta a pagar: baixa do que cobre a conta (o que passou do devido vira crédito da próxima semana, não sobra aberto aqui)
    if(temConta(p) && !(((cf.s.cpe||{}).baixas)||[]).some(function(b){ return b.chave==="l|"+idConta(p); })) cf.d({type:"CPE_BAIXA", baixas:[{id:"bx"+Date.now(), chave:"l|"+idConta(p), data:hoje, forma:"Pix revendedora", conta:"", contaNome:"Pix revendedora", principal:Math.min(vp, p.valor), juros:0, multa:0, desc:0, obs:"Pago pelo Direcionar (Pix de revendedoras)"+(vp>p.valor+0.004 ? " · passou "+formatarReais(vp-p.valor)+" (crédito da próxima semana)" : ""), por:cf.s.usuario, em:Date.now(), desc_txt:p.func+" · "+p.tipo+" · "+formatarDia(p.data)}]});
    // 2) pedido da prestadora no Financeiro: dá baixa na parcela
    var f = prestadorDe(p.func), ped = f && p.envio ? ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===f.id && q.numero===p.envio.numero; })[0] : null;
    if(ped){ var ix = (ped.parcelas||[]).findIndex(function(q){ return q.status!=="Pago"; }); if(ix>=0){ var d2 = {type:"PF", op:"parcela_baixa", por:cf.por, pedId:ped.id, idx:ix}, r2x = pfReduz(cf.s, d2); if(r2x.patch && r2x.patch.pf) cf.d(d2); } }
    // 3) produção: marca pago e guarda a diferença no saldo
    x.exec("pag_marcar", {id:p.id, valorPago:vp});
  };
  var pedirPagamento = function(p){ if(p.id.indexOf("casa|")===0) sPag[1]({p:p, valor:p.valor}); else pagar(p); };   // produção externa abre a janela do valor pago; bônus marca direto
  var enviar = function(p){
    var f = prestadorDe(p.func);
    if(!f){ window.alert("Cadastre "+p.func+" em Financeiro › Pagamentos a fornecedores › Prestadores de serviço (com a chave Pix) antes de enviar."); return; }
    var numero = p.tipo+" · "+p.func+" · "+formatarDia(p.data);
    var a = {type:"PF", op:"pedido_add", por:cf.por, fornId:f.id, numero:numero, data:hoje, total:p.valor, nfTipo:"sem", descricao:p.detalhe, limite:p.data, pixMin:p.valor,
      linhas:[{forma:"pix_revendedora", venc:p.data, valor:String(p.valor), qtd:"1", conta:"Pix revendedora", status:"Pendente"}]};
    var r = pfReduz(cf.s, a);
    if(r.confirmar){ if(!window.confirm(r.msg+" Continuar mesmo assim?")) return; a.forcar = true; r = pfReduz(cf.s, a); }
    if(!(r.patch && r.patch.pf)){ window.alert(r.msg || "Não foi possível enviar."); return; }
    cf.d(a); x.exec("pag_enviado", {id:p.id, valor:p.valor, numero:numero}); criaConta(p);
    garantirDestino(f);
  };

  // REENVIAR: o valor mudou depois do envio (dia pago ou corrigido): apaga o pedido antigo (se nada foi pago nele) e cria um novo com o valor certo, em vez de empilhar negociações
  var reenviar = function(p){
    var f = prestadorDe(p.func), ped = f && ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===f.id && q.numero===p.envio.numero; })[0];
    if(ped){
      if((ped.parcelas||[]).some(function(q){ return q.status==="Pago"; })){ window.alert("Este pedido já tem parcela paga. Estorne a baixa em Financeiro › Negociações antes de reenviar."); return; }
      var d = {type:"PF", op:"pedido_del", por:cf.por, id:ped.id}, r = pfReduz(cf.s, d);
      if(r.confirmar){ if(!window.confirm(r.msg+" Continuar mesmo assim?")) return; d.forcar = true; r = pfReduz(cf.s, d); }
      if(!(r.patch && r.patch.pf)){ window.alert(r.msg || "Não foi possível apagar o envio antigo."); return; }
      cf.d(d);
    }
    enviar(p);
  };

  // PAGAMENTOS, um por SEMANA (segunda a domingo, paga na quarta): semana, quando paga, peças, valor da semana, quanto já foi pago e quanto falta (Marcus, 19/11/2026: "arruma os pagamentos, está estranho")
  var pecasDe = function(p){ return p.tipo==="Bônus" ? null : p.dias.reduce(function(t, d){ return t+(((x.pr.lancamentos||{})[d]||[]).filter(function(l){ return l.func===p.func && eCasa(l); }).reduce(function(t2, l){ return t2+(Number(l.qtd)||0); }, 0)); }, 0); };
  var semanaDe = function(p){ return p.tipo==="Bônus" ? p.detalhe.split(" · ")[0] : formatarDia(somaDias(p.data, -9)).slice(0, 5)+" a "+formatarDia(somaDias(p.data, -3)).slice(0, 5); };
  var varias = lista.some(function(p){ return p.tipo==="Bônus"; }) || lista.some(function(p){ return p.func!==lista[0].func; });   // com a pessoa escolhida só sobram as linhas dela
  var linhas = lista.map(function(p){
    var situ = p.pago ? "Pago" : p.envio ? (Math.abs(p.envio.valor-p.valor)>0.005 ? "Valor mudou" : "Enviado ao Financeiro") : p.data<hoje ? "Atrasado" : "A enviar";
    var jaPago = p.pago ? p.pago.valor : Math.max(0, Math.round((p.total-p.bruto)*100)/100);
    return {id:p.id, p:p, quem:p.func, semana:semanaDe(p), pagarEm:formatarDia(p.data), pecas:pecasDe(p), semanaValor:p.total, jaPago:jaPago, falta:p.pago ? 0 : p.valor, situ:situ};
  });
  var cols = (varias ? [{k:"quem", t:"Funcionária"}] : []).concat([{k:"semana", t:"Semana"}, {k:"pagarEm", t:"Pagar em"}, {k:"pecas", t:"Peças", fmt:function(v){ return v===null ? "—" : formatarInteiro(v); }},
    {k:"semanaValor", t:"Valor da semana", fmt:formatarReais}, {k:"jaPago", t:"Já pago", fmt:formatarReais, cor:function(r){ return r.jaPago>0 ? "text-success" : ""; }},
    {k:"falta", t:"Falta pagar", fmt:formatarReais, cor:function(r){ return r.falta>0 ? "text-warning" : "text-success"; }},
    {k:"situ", t:"Situação", cor:function(r){ return r.p.pago ? "text-success" : r.situ==="Atrasado" || r.situ==="Valor mudou" ? "text-danger" : ""; }}]);
  if(!x.leitura) cols.push({k:"ac", t:"Ação", render:function(v, r){
    var p = r.p;
    return e("span",{className:"inline-flex flex-wrap items-center justify-center gap-3"},
      !p.pago && !p.envio && e("button",{type:"button", onClick:function(){ enviar(p); }, className:LINK, title:"Cria o Pix revendedora na quarta para o Lucas pagar no Direcionar"}, "Enviar ao Financeiro"),
      !p.pago && p.envio && Math.abs(p.envio.valor-p.valor)>0.005 && e("button",{type:"button", onClick:function(){ reenviar(p); }, className:LINK, title:"O valor mudou depois do envio: troca o pedido antigo pelo novo"}, "Reenviar ("+formatarReais(p.valor)+")"),
      !p.pago && p.envio && Math.abs(p.envio.valor-p.valor)<=0.005 && e("button",{type:"button", onClick:function(){ pedirPagamento(p); }, className:LINK}, "Marcar pago"),
      p.dias.length>0 && e("button",{type:"button", onClick:function(){ sDias[1](p.id); }, className:LINK}, "Dias"),
      p.pago && !p.dias.length && e("button",{type:"button", onClick:function(){ x.exec("pag_desmarcar", {id:p.id}); }, className:LINK}, "Desfazer")); }});
  var totalRodape = function(ls){
    var soma = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); };
    return cols.map(function(c, i){ return i===0 ? "TOTAL · "+ls.length : c.k==="pecas" ? formatarInteiro(soma("pecas")) : c.k==="semanaValor" || c.k==="jaPago" || c.k==="falta" ? formatarReais(soma(c.k)) : ""; }); };

  // janela dos dias da casa: marca quais já foram pagos
  var jan = null, pj = sDias[0] ? lista.find(function(q){ return q.id===sDias[0]; }) : null;
  if(pj){
    var dp = x.pr.diasPagos || {}, qtdDia = function(d){ return ((x.pr.lancamentos||{})[d]||[]).filter(function(l){ return l.func===pj.func && eCasa(l); }).reduce(function(t, l){ return t+(Number(l.qtd)||0); }, 0); };
    var rowsD = pj.dias.map(function(d){ var pg = !!dp[pj.func+"|"+d]; return {id:d, dia:d, pecas:qtdDia(d), valor:valorDiaCasa(x.pr, pj.func, d), situ:pg ? "Pago" : "A pagar", pg:pg}; });
    jan = e(Janela,{t:"Dias pagos", sub:pj.func+" · pago em "+formatarDia(pj.data), fechar:function(){ sDias[1](null); }, colunas:[
      e(Painel,{key:"d", t:"Dias da produção externa", ic:"calendar-blank"}, e(TabelaPlanilha,{key:"dias"+pj.id, chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true, linhas:rowsD,
        cols:[{k:"dia", t:"Dia", fmt:function(v){ return formatarDia(v)+" · "+diaDaSemana(v); }}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"valor", t:"Valor", fmt:formatarReais}, {k:"situ", t:"Situação", cor:function(r){ return r.pg ? "text-success" : ""; }},
          {k:"ac", t:"Ação", render:function(v, r){ return e("button",{type:"button", onClick:function(){ x.exec("dia_pago", {func:pj.func, dia:r.dia, pago:!r.pg}); }, className:LINK}, r.pg ? "Desfazer" : "Marcar pago"); }}]}))]});
  }
  var jp = null;
  if(sPag[0]){
    var pp = sPag[0].p, vv = Number(sPag[0].valor)||0, dif = Math.round((vv-pp.valor)*100)/100, passou = dif>0.004, estoura = dif>LIMITE_EXCEDENTE+0.004;
    var confirmar = function(){ if(vv<=0){ window.alert("Informe o valor pago."); return; } if(estoura && !window.confirm("Passou "+formatarReais(dif)+" do devido, acima do limite de "+formatarReais(LIMITE_EXCEDENTE)+". Confirmar mesmo assim? O excedente desconta da próxima semana.")) return; pagar(pp, vv); sPag[1](null); };
    jp = e(Janela,{t:"Marcar como pago", sub:pp.func+" · "+formatarDia(pp.data), fechar:function(){ sPag[1](null); }, colunas:[
      e(Painel,{key:"v", t:"Valor pago em Pix", ic:"currency-circle-dollar"},
        e("div",{className:"flex flex-col gap-2 text-center text-[13px]"},
          e("span",null, "Devido: ", e("b",{className:"tabular-nums"}, formatarReais(pp.valor))),
          e(Dinheiro,{value:sPag[0].valor || 0, label:"Valor pago", onChange:function(v){ sPag[1](Object.assign({}, sPag[0], {valor:v || 0})); }}),
          e("span",{className:"font-semibold "+(estoura ? "text-danger" : passou ? "text-warning" : dif<-0.004 ? "text-warning" : "text-success")}, dif===0 ? "Valor certo" : passou ? "Passou "+formatarReais(dif)+(estoura ? " · acima do limite de "+formatarReais(LIMITE_EXCEDENTE) : " · desconta da próxima semana") : "Faltou "+formatarReais(-dif)+" · soma na próxima semana"))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"}, e("div",{className:"flex flex-col gap-2"}, e(Botao,{principal:true, onClick:confirmar}, estoura ? "Confirmar mesmo assim" : "Confirmar pagamento"), e(Botao,{onClick:function(){ sPag[1](null); }}, "Cancelar")))]});
  }
  return casca(props && props.semRaiz,
    e(BlocoPainel,{titulo:"Pagamentos da produção", dir:"Toda quarta-feira", compacto:true},
      e(TabelaPlanilha,{key:"pag", cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhum pagamento a fazer."})),
    jan, jp);
}
export { AbaProdPagamentos };

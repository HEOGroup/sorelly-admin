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
var TENTOU = {};   // o que o envio automático já tentou nesta sessão (chave = pagamento + valor + situação), para não repetir
// MESMA PESSOA (23/11/2026): "Davila Aline" (Produção) e "Dávila" (Financeiro) são a mesma prestadora. Vale quando TODAS as palavras do nome mais curto aparecem no mais longo, sem acento. Antes só valia se o nome do Financeiro tivesse todas as palavras da Produção, e o envio da Dávila recusava.
var palavrasDe = function(t){ return semAcento(t).split(" ").filter(Boolean); };
var mesmaPessoa = function(a, b){ var wa = palavrasDe(a), wb = palavrasDe(b), menor = wa.length<=wb.length ? wa : wb, maior = menor===wa ? wb : wa; return menor.length>0 && menor.every(function(w){ return maior.indexOf(w)>=0; }); };

function AbaProdPagamentos(props){
  var x = usePr(), cf = usePf(), hoje = hojeSP(), sDias = useState(null), sPag = useState(null);
  // destino da prestadora no Direcionar (com banco e chave Pix do cadastro), criado uma vez só; também cobre o que já foi enviado antes
  var temDestino = function(f){ var ws = semAcento(f.nome).split(/\s+/).filter(Boolean), cp = cf.s.cp; return !!(cp && cp.destinos && cp.destinos.some(function(z){ var n = semAcento(z.nome); return z.ativo && z.tipo==="PRESTADOR" && ws.every(function(w){ return n.indexOf(w)>=0; }); })); };
  // destino já existente, mas sem banco e chave Pix (nasceu antes do cadastro estar completo): completa com os dados do prestador
  var completarDestino = function(f){ var cp = cf.s.cp; if(!f || !cp || !cp.destinos || !(f.chavePix || f.banco)) return; var ws = semAcento(f.nome).split(" ").filter(Boolean), dd = cp.destinos.filter(function(z){ var n = semAcento(z.nome); return z.ativo && z.tipo==="PRESTADOR" && ws.every(function(w){ return n.indexOf(w)>=0; }); })[0]; if(dd && !dd.chavePix && f.chavePix) cf.d({type:"CP", op:"destino_set", por:cf.por, id:dd.id, patch:{banco:f.banco||dd.banco||"", chavePix:f.chavePix}}); };
  var garantirDestino = function(f){ completarDestino(f); if(f && cf.s.cp && !temDestino(f)) cf.d({type:"CP", op:"destino_add", por:cf.por, nome:f.nome, tipo:"PRESTADOR", banco:f.banco||"", chavePix:f.chavePix||""}); };
  var pendentesEnvio = x.admin ? pagamentosDaProducao(x.pr, hoje).filter(function(q){ return q.envio && !q.pago; }).map(function(q){ return q.func; }).join("|") : "";
  useEffect(function(){ pendentesEnvio.split("|").filter(Boolean).forEach(function(nome){ var f = ((cf.pf && cf.pf.fornecedores) || []).filter(function(g){ return g.tipo==="prestador" && mesmaPessoa(nome, g.nome); })[0]; garantirDestino(f); }); pagamentosDaProducao(x.pr, hoje).filter(function(q){ return q.envio && !q.pago; }).forEach(function(q){ if(!temConta(q)) criaConta(q); }); }, [pendentesEnvio, Object.keys(x.pr.envios||{}).join(), !!(cf.s.cp && cf.s.cp.destinos), !!(cf.s.cpe && cf.s.cpe.lanc)]);   // eslint-disable-line react-hooks/exhaustive-deps
  // ENVIO E BAIXA AUTOMÁTICOS (Marcus, 24/11/2026: "não precisa clicar em enviar ao financeiro, o negócio envia automático, é tudo automático"): rodam na tela e também em segundo plano (AutoProducao, montada no App para a Diretoria).
  // (1) fechou o ciclo (terça depois da segunda) ou o mês das internas: cria o pedido da prestadora, a conta a pagar e o destino no Direcionar; (2) o valor mudou e nada foi pago: refaz o envio; (3) o Direcionar pagou a parcela: dá a baixa na conta e marca pago aqui.
  useEffect(function(){
    if(!(props && props.auto) || !x.admin || !cf.pf || !(cf.s.cpe && cf.s.cpe.lanc) || typeof lista==="undefined") return;
    lista.forEach(function(p){
      if(p.pago || !(p.valor>0)) return;
      var chave = p.id+"|"+p.valor+"|"+(p.envio ? "e" : "n"); if(TENTOU[chave]) return;
      if(p.envio){
        var fo = prestadorDe(p.func), ped = fo && p.envio.numero ? ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===fo.id && q.numero===p.envio.numero; })[0] : null;
        if(ped && (ped.parcelas||[]).length && ped.parcelas.every(function(q){ return q.status==="Pago"; })){ TENTOU[chave] = 1; pagar(p, p.valor); return; }
        if(!ehInt(p) && Math.abs(p.envio.valor-p.valor)>0.005){ TENTOU[chave] = 1; reenviar(p, true); }
        return;
      }
      var fechou = ehInt(p) ? !p.aberto : true;   // produção externa: entra no Contas a pagar já (Marcus, 24/11/2026: "já entrar no contas a pagar"); o valor se atualiza sozinho enquanto não for pago
      if(fechou){ TENTOU[chave] = 1; enviar(p, true); }
    });
  }, [props && props.auto, x.pr, cf.pf, cf.s.cpe, hoje]);   // eslint-disable-line react-hooks/exhaustive-deps
  if(!x.admin && !x.leitura) return casca(props && props.semRaiz, e(BlocoPainel,{titulo:"Pagamentos da produção", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var lista = pagamentosDaProducao(x.pr, hoje).filter(function(q){ return !(props && props.func) || String(q.func).trim().toLowerCase()===String(props.func).trim().toLowerCase(); }).filter(function(q){ return !(props && props.modo) || (props.modo==="int") === (q.tipo==="Produção interna"); });   // uma pessoa por vez; modo ext = só produção externa, int = só o pagamento das internas (quem faz as duas, como a Crisbele, não mistura)
  // prestador do Financeiro com o mesmo nome (todas as palavras do nome da produção estão no nome do cadastro)
  var prestadorDe = function(nome){ return ((cf.pf && cf.pf.fornecedores) || []).filter(function(f){ return f.tipo==="prestador" && mesmaPessoa(nome, f.nome); })[0] || null; };

  // CONTA A PAGAR (Marcus, 17/11/2026: "sempre sobe no Contas a pagar e na aba de fornecedores, igual dos outros"): cada envio vira uma conta a pagar na quarta (natureza 3.01.01.19 Freelancer, Folha e pessoal); marcar pago dá a baixa nela
  var idConta = function(p){ return "prod-"+p.id; };
  var ehInt = function(p){ return p.tipo==="Produção interna"; };   // as internas recebem EM DINHEIRO, no dia 12 do mês seguinte (ou dia útil)
  var itemConta = function(p){ return ehInt(p) ? {id:idConta(p), filial:"34", nat:"3.01.01.12", natNome:"Bônus (produção interna)", pref:"DIN", forn:p.func, nome:p.func+" · produção interna · "+p.detalhe.split(" · ")[0]+" · dinheiro", venc:p.data, valor:p.valor, status:"apagar", fam:false, saida:"Dinheiro", centro:"", hist:"Enviado pela Produção › Pagamento por produção · pagar EM DINHEIRO em "+formatarDia(p.data), emissao:hoje}
    : {id:idConta(p), filial:"34", nat:"3.01.01.19", natNome:"Freelancer (Taxa-salário)", pref:"PIX", forn:p.func, nome:p.func+" · "+p.tipo+" · "+formatarDia(p.data), venc:p.data, valor:p.valor, status:"apagar", fam:false, saida:"Pix", centro:"", hist:"Enviado pela Produção › Produção externa", emissao:hoje}; };
  var temConta = function(p){ return (((cf.s.cpe||{}).lanc)||[]).some(function(l){ return l.id===idConta(p); }); };
  var criaConta = function(p){ cf.d({type:"CPE_LANC_DEL", id:idConta(p), por:cf.por}); cf.d({type:"CPE_LANC_ADD", itens:[itemConta(p)]}); };
  var pagar = function(p, valorPago){
    var vp = valorPago===undefined ? p.valor : valorPago;
    // 1) conta a pagar: baixa do que cobre a conta (o que passou do devido vira crédito da próxima semana, não sobra aberto aqui)
    if(temConta(p) && !(((cf.s.cpe||{}).baixas)||[]).some(function(b){ return b.chave==="l|"+idConta(p); })) cf.d({type:"CPE_BAIXA", baixas:[{id:"bx"+Date.now(), chave:"l|"+idConta(p), data:hoje, forma:ehInt(p) ? "Dinheiro" : "Pix revendedora", conta:"", contaNome:ehInt(p) ? "Dinheiro" : "Pix revendedora", principal:Math.min(vp, p.valor), juros:0, multa:0, desc:0, obs:(ehInt(p) ? "Pago em dinheiro" : "Pago pelo Direcionar (Pix de revendedoras)")+(vp>p.valor+0.004 ? " · passou "+formatarReais(vp-p.valor)+" (crédito da próxima semana)" : ""), por:cf.s.usuario, em:Date.now(), desc_txt:p.func+" · "+p.tipo+" · "+formatarDia(p.data)}]});
    // 2) pedido da prestadora no Financeiro: dá baixa na parcela
    var f = prestadorDe(p.func), ped = f && p.envio ? ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===f.id && q.numero===p.envio.numero; })[0] : null;
    if(ped){ var ix = (ped.parcelas||[]).findIndex(function(q){ return q.status!=="Pago"; }); if(ix>=0){ var d2 = {type:"PF", op:"parcela_baixa", por:cf.por, pedId:ped.id, idx:ix}, r2x = pfReduz(cf.s, d2); if(r2x.patch && r2x.patch.pf) cf.d(d2); } }
    // 3) produção: marca pago e guarda a diferença no saldo
    x.exec("pag_marcar", {id:p.id, valorPago:vp});
  };
  var pedirPagamento = function(p){ if(p.id.indexOf("casa|")===0) sPag[1]({p:p, valor:p.valor}); else pagar(p); };   // produção externa abre a janela do valor pago; bônus marca direto
  var enviar = function(p, auto){
    if(ehInt(p)){   // interna: só a conta a pagar, em dinheiro (sem pedido de prestadora nem Pix)
      if(p.aberto){ if(!auto) window.alert("O mês ainda está aberto. Dá para enviar ao Contas a pagar depois que ele fechar."); return; }
      x.exec("pag_enviado", {id:p.id, valor:p.valor, numero:"Produção interna · "+p.func+" · "+formatarDia(p.data)+" · dinheiro"}); criaConta(p); return;
    }
    var f = prestadorDe(p.func);
    if(!f){ if(!auto) window.alert("Cadastre "+p.func+" em Financeiro › Pagamentos a fornecedores › Prestadores de serviço (com a chave Pix) antes de enviar."); return; }
    // IDEMPOTENTE (24/11/2026): se já existe pedido desta prestadora com o mesmo vencimento e o mesmo valor (lançado à mão ou por outra tela), adota esse pedido em vez de criar um duplicado
    var dup = ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===f.id && (q.parcelas||[]).some(function(pa){ return pa.venc===p.data && Math.abs((Number(pa.valor)||0)-p.valor)<0.01; }); })[0];
    if(dup){ x.exec("pag_enviado", {id:p.id, valor:p.valor, numero:dup.numero, pedId:dup.id}); criaConta(p); garantirDestino(f); return; }
    var numero = p.tipo+" · "+p.func+" · "+formatarDia(p.data);
    var a = {type:"PF", op:"pedido_add", por:cf.por, fornId:f.id, numero:numero, data:hoje, total:p.valor, nfTipo:"sem", descricao:p.detalhe, limite:p.data, pixMin:p.valor,
      linhas:[{forma:"pix_revendedora", venc:p.data, valor:String(p.valor), qtd:"1", conta:"Pix revendedora", status:"Pendente"}]};
    var r = pfReduz(cf.s, a);
    if(r.confirmar){ if(auto || !window.confirm(r.msg+" Continuar mesmo assim?")) return; a.forcar = true; r = pfReduz(cf.s, a); }
    if(!(r.patch && r.patch.pf)){ if(!auto) window.alert(r.msg || "Não foi possível enviar."); return; }
    cf.d(a); x.exec("pag_enviado", {id:p.id, valor:p.valor, numero:numero}); criaConta(p);
    garantirDestino(f);
  };

  // REENVIAR: o valor mudou depois do envio (dia pago ou corrigido): apaga o pedido antigo (se nada foi pago nele) e cria um novo com o valor certo, em vez de empilhar negociações
  var reenviar = function(p, auto){
    var f = prestadorDe(p.func), ped = f && ((cf.pf && cf.pf.pedidos) || []).filter(function(q){ return q.fornId===f.id && q.numero===p.envio.numero; })[0];
    if(ped){
      if((ped.parcelas||[]).some(function(q){ return q.status==="Pago"; })){ if(!auto) window.alert("Este pedido já tem parcela paga. Estorne a baixa em Financeiro › Negociações antes de reenviar."); return; }
      var d = {type:"PF", op:"pedido_del", por:cf.por, id:ped.id}, r = pfReduz(cf.s, d);
      if(r.confirmar){ if(auto || !window.confirm(r.msg+" Continuar mesmo assim?")) return; d.forcar = true; r = pfReduz(cf.s, d); }
      if(!(r.patch && r.patch.pf)){ if(!auto) window.alert(r.msg || "Não foi possível apagar o envio antigo."); return; }
      cf.d(d);
    }
    enviar(p, auto);
  };

  // PAGAMENTOS, um por CICLO (terça a segunda, paga na quinta; regra de 22/11/2026): semana, quando paga, peças, valor da semana, quanto já foi pago e quanto falta (Marcus, 19/11/2026: "arruma os pagamentos, está estranho")
  var pecasDe = function(p){ return p.tipo==="Produção interna" ? null : p.dias.reduce(function(t, d){ return t+(((x.pr.lancamentos||{})[d]||[]).filter(function(l){ return l.func===p.func && eCasa(l); }).reduce(function(t2, l){ return t2+(Number(l.qtd)||0); }, 0)); }, 0); };
  var semanaDe = function(p){ return p.tipo==="Produção interna" ? p.detalhe.split(" · ")[0] : formatarDia(somaDias(p.data, -9)).slice(0, 5)+" a "+formatarDia(somaDias(p.data, -3)).slice(0, 5); };
  var varias = lista.some(function(p){ return p.tipo==="Produção interna"; }) || lista.some(function(p){ return p.func!==lista[0].func; });   // com a pessoa escolhida só sobram as linhas dela
  var linhas = lista.map(function(p){
    var situ = p.pago ? "Pago" : p.envio ? (Math.abs(p.envio.valor-p.valor)>0.005 ? "Valor mudou" : "Enviado ao Financeiro") : p.data<hoje ? "Atrasado" : "Envio automático";
    var jaPago = p.pago ? p.pago.valor : Math.max(0, Math.round((p.total-p.bruto)*100)/100);
    return {id:p.id, p:p, quem:p.func, semana:semanaDe(p), forma:p.forma || "Pix revendedora", pagarEm:formatarDia(p.data), pecas:pecasDe(p), semanaValor:p.total, jaPago:jaPago, falta:p.pago ? 0 : p.valor, situ:situ};
  });
  var cols = (varias ? [{k:"quem", t:"Funcionária"}] : []).concat([{k:"semana", t:"Período"}, {k:"forma", t:"Forma"}, {k:"pagarEm", t:"Pagar em"}, {k:"pecas", t:"Peças", fmt:function(v){ return v===null ? "—" : formatarInteiro(v); }},
    {k:"semanaValor", t:"Valor", fmt:formatarReais}, {k:"jaPago", t:"Já pago", fmt:formatarReais, cor:function(r){ return r.jaPago>0 ? "text-success" : ""; }},
    {k:"falta", t:"Falta pagar", fmt:formatarReais, cor:function(r){ return r.falta>0 ? "text-warning" : "text-success"; }},
    {k:"situ", t:"Situação", cor:function(r){ return r.p.pago ? "text-success" : r.situ==="Atrasado" || r.situ==="Valor mudou" ? "text-danger" : ""; }}]);
  // SEM botões (Marcus, 24/11/2026): nada de Enviar ao Financeiro, Reenviar, Marcar pago nem Desfazer. O envio e a baixa são automáticos (efeito acima); aqui só aparece o estado e a janela Dias.
  cols.push({k:"ac", t:"Envio", render:function(v, r){
    var p = r.p;
    return e("span",{className:"inline-flex flex-wrap items-center justify-center gap-3"},
      e("span",{className:"text-[11px] font-semibold"}, p.pago ? "Pago" : p.envio ? "No Direcionar" : p.aberto ? "Envia quando o mês fechar" : "Envia sozinho"),
      p.dias.length>0 && e("button",{type:"button", onClick:function(){ sDias[1](p.id); }, className:LINK}, "Dias")); }});
  var totalRodape = function(ls){
    var soma = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); };
    return cols.map(function(c, i){ return i===0 ? "TOTAL · "+ls.length : c.k==="pecas" ? formatarInteiro(soma("pecas")) : c.k==="semanaValor" || c.k==="jaPago" || c.k==="falta" ? formatarReais(soma(c.k)) : ""; }); };

  // janela dos dias da casa: marca quais já foram pagos
  var jan = null, pj = sDias[0] ? lista.find(function(q){ return q.id===sDias[0]; }) : null;
  if(pj){
    var dp = x.pr.diasPagos || {}, qtdDia = function(d){ return ((x.pr.lancamentos||{})[d]||[]).filter(function(l){ return l.func===pj.func && eCasa(l); }).reduce(function(t, l){ return t+(Number(l.qtd)||0); }, 0); };
    var rowsD = pj.dias.map(function(d){ var pg = !!dp[pj.func+"|"+d]; return {id:d, dia:d, pecas:qtdDia(d), valor:valorDiaCasa(x.pr, pj.func, d), situ:pg ? "Pago" : "A pagar", pg:pg}; });
    jan = e(Janela,{t:"Dias do pagamento", sub:pj.func+" · pago em "+formatarDia(pj.data), fechar:function(){ sDias[1](null); }, colunas:[
      e(Painel,{key:"d", t:"Dias da produção externa", ic:"calendar-blank"}, e(TabelaPlanilha,{key:"dias"+pj.id, fina:true, chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true, linhas:rowsD,
        cols:[{k:"dia", t:"Dia", fmt:function(v){ return formatarDia(v)+" · "+diaDaSemana(v); }}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"valor", t:"Valor", fmt:formatarReais}, {k:"situ", t:"Situação", cor:function(r){ return r.pg ? "text-success" : ""; }}]}))]});   // SÓ LEITURA (Marcus, 23/11/2026): o pago vem do Contas a pagar, nunca de marcação à mão (o botão Marcar pago saiu daqui)
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
  if(props && props.auto) return null;   // montada em segundo plano (AutoProducao): só roda o efeito acima
  return casca(props && props.semRaiz,
    e(BlocoPainel,{titulo:"Pagamentos da produção", dir:(props && props.interna) ? "Em dinheiro · dia 12" : "Toda quinta-feira", compacto:true},
      e(TabelaPlanilha,{key:"pag", fina:true, cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhum pagamento a fazer."})),
    jan, jp);
}
// Montada no App para a Diretoria: faz o envio e a baixa automáticos mesmo sem ninguém abrir a tela de pagamentos.
function AutoProducao(){ var x = usePr(); if(!x.admin) return null; return e(AbaProdPagamentos,{auto:true, semRaiz:true}); }
export { AbaProdPagamentos, AutoProducao };

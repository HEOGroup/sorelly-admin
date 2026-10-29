// Sorelly Admin · montagem e bipagem — state/reducer.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
var MESES_LONGO_R = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
import { acumularFaturamento } from "@/apps/montagem/domain/saldos-contas";
import { condNums, condOk } from "@/apps/montagem/domain/condicionais";
import { dividasAnteriores } from "@/apps/montagem/domain/comissoes";
import { calcularAcerto, novaVersaoRegras, vezCobravel, versaoDoKit, versaoVigente, versaoEfetiva, modalidadeDe, versaoDaRevendedora, versaoDaEntrega, hojeIso } from "@/apps/montagem/domain/consignado";
import { lancamentoConferido, contasDefinidas } from "@/apps/montagem/domain/atendimento-interno";
import { BIPADORAS, KITNOVO, SUPERVISORA, montadorValido, nomeDe, papelDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, dataPagamento, ehAtencao, kitsNaListagem, listagemCheia, motivoNaoMonta, nomeMes, resumoBipadora, resumoMontadora, soEncomendas } from "@/apps/montagem/domain/regras";
import { kit } from "@/apps/montagem/domain/seed";
import { SEM_KIT } from "@/apps/montagem/domain/status";
import { sugerido } from "@/apps/montagem/domain/vendas";
import { destinosDe } from "@/apps/montagem/domain/avisos";
import { internoDeAgendada, parseObs, agendadoDe, situacaoDoRegistro, remarcacoesDoCiclo, motivoNaoMarcar, isoDe as isoDeRI } from "@/apps/montagem/domain/revendedoras-internas";
import { passoAtual } from "@/apps/montagem/domain/kit-novo-entrega";
import { aplicaFila } from "@/apps/montagem/domain/retornos";
import { bipar as biparConf, condicionaisDoKit, totaisDe, resultado as resultadoConf } from "@/apps/montagem/domain/conferencia-pecas";
import { BK, N1, hora, isoDia } from "@/apps/montagem/lib/format";
import { agendReduz, sincPrevistosAcertos } from "@/apps/montagem/domain/agendamento";
import { p45Reduz } from "@/apps/montagem/domain/plano45-60";
import { rhReduz } from "@/apps/montagem/domain/rh";
import { metasReduz } from "@/apps/montagem/domain/metas-setor";
import { cpReduz } from "@/apps/montagem/domain/controle-pagamentos";
import { dpReduz } from "@/apps/montagem/domain/direcionar-pix";
import { pxAplicar, pxReduz } from "@/apps/montagem/domain/pix-regras";
import { idPedidoRep, repPedirConta, repRemoverPedido, sincContasRep } from "@/apps/montagem/domain/pagamento-rep";
import { pfReduz } from "@/apps/montagem/domain/pf";
import { rotReduz } from "@/apps/montagem/domain/rotina";
import { cfReduz , lancFinDoPagamento } from "@/apps/montagem/domain/cobranca-func";
import { clReduz } from "@/apps/montagem/domain/cadastro-leads";
import { indReduz } from "@/apps/montagem/domain/indicacoes";
import { ceReduz } from "@/apps/montagem/domain/compras-estoque";
import { gaReduz } from "@/apps/montagem/domain/garantia";
import { melReduz } from "@/apps/montagem/domain/melhorias";
import { mkReduz } from "@/apps/montagem/domain/marketing";
import { fxReduz } from "@/apps/montagem/domain/fiscal";
import { agoraSP as agoraSPLp, lpReduz, usarLinksNoAcerto } from "@/apps/montagem/domain/link-pagamento";
import { erReduz } from "@/apps/montagem/domain/encomendas";
import { exReduz } from "@/apps/montagem/domain/expositores";
import { eqReduz } from "@/apps/montagem/domain/equipes";
import { infReduz } from "@/apps/montagem/domain/informativos";
import { pkReduz } from "@/apps/montagem/domain/preferencias-kit";
import { pkSalvarDoApp } from "@/apps/montagem/domain/preferencias-rev";
import { grReduz } from "@/apps/montagem/domain/garantias-rev";
import { esReduz } from "@/apps/montagem/domain/estoque-sorelly";
import { avReduz } from "@/apps/montagem/domain/avaliacoes";
import { prReduz } from "@/apps/montagem/domain/producao";
import { cpcReduz } from "@/apps/montagem/domain/cadastro-pecas";
import { ppReduz } from "@/apps/montagem/domain/pedidos-pecas";
import { ffReduz } from "@/apps/montagem/domain/financeiro-familiar";
import { MODELO_PADRAO } from "@/apps/montagem/domain/condicional-modelo";
import { CHAVE, ajustaDiv, com, kitDe, mapKit, novo, registroListagem } from "@/apps/montagem/state/store";

// Carimbo da versão das regras na ENTREGA do kit à revendedora (Marcus, 26/10/2026): o acerto desse kit usa as regras da data da entrega.
// Quem ainda não recebeu kit depois de 27/10/2026 continua com as regras antigas (ver versaoDaRevendedora em domain/consignado.js).
// Regras de 27/10/2026 que o acerto precisa lembrar depois (prazo de quitação, multa de atraso): copiadas para o registro, para a Inadimplência não depender da versão atual.
function copiaNovas(N){ return {prazoQuitarDias:N.prazoQuitarDias, atrasoQuitacaoPctDia:N.atrasoQuitacaoPctDia, atrasoQuitacaoTetoPct:N.atrasoQuitacaoTetoPct, multaPendentePct:N.multaPendentePct, juridicoDias:N.juridicoDias}; }
// Dívida de acertos anteriores (Marcus, 26/10/2026): o que a revendedora paga num acerto novo quita PRIMEIRO a dívida mais antiga; só o resto vale para o acerto novo.
// Devolve {total, abat:{idDoAcertoAntigo: valor}}. "Acerto com loja" não é pagamento.
function abaterDividas(s, rev, pagamentos, exceto){
  var pago = Math.round((pagamentos||[]).reduce(function(t, p){ return p.forma==="acerto_loja" ? t : t+(p.valor||0); }, 0)*100)/100, resta = pago, abat = {}, total = 0;
  dividasAnteriores(s.acertosConsignado, rev, exceto).forEach(function(x){ var v = Math.min(resta, x.falta); if(v>0.009){ abat[x.id] = Math.round(v*100)/100; resta -= v; total += v; } });
  return {total:Math.round(total*100)/100, abat:abat, pago:pago};
}
// Cada acerto antigo que foi quitado (em parte ou todo) ganha uma linha extra de pagamento, como o pagamento feito depois na Inadimplência.
function aplicarAbatimento(lista, ab, pag0, novoId, agora){
  if(!ab.total) return lista;
  return lista.map(function(r){ var v = ab.abat[r.id]; if(!v) return r;
    return Object.assign({}, r, {pagamentos:(r.pagamentos||[]).concat([{forma:(pag0||{}).forma||"pix", descricao:(pag0||{}).descricao||"", parcelas:1, data:new Date(agora).toISOString().slice(0,10), valor:v, anexo:null, extra:true, ts:agora, por:"Abatido no acerto seguinte", deAcerto:novoId}])}); });
}
function carimboEntrega(s, rev){ var v = versaoDaEntrega(s); if(!v || !rev) return s.perfisRev; var pr = Object.assign({}, s.perfisRev||{}); pr[rev] = Object.assign({}, pr[rev], {regrasEntregaId:v.id, regrasEntregaEm:hojeIso()}); return pr; }

function reducer(s, a){
  var k, agora = Date.now();
  switch(a.type){
    case "VISAO": return com(s, {visao:a.v, bipadora:a.b||s.bipadora});
    // Entrar (a senha é ignorada no protótipo): cada pessoa cai direto na tela do seu setor — montadora e bipadora no próprio app, condicionais no app das condicionais.
    case "LOGIN": {
      var pp = papelDe(a.id);
      var abaIni = !a.atuando && (pp==="montadora" || pp==="bipadora") ? "whats" : "inicio";   // "atuar como" (a.atuando) sempre começa no Início   // todo mundo começa na página inicial (27/10/2026); montadora e bipadora, no SorellyChat (28/10/2026)
      return com(s, {usuario:a.id, logado:true, aba:abaIni, celular: pp==="montadora" ? a.id : s.celular, telaCel:"proximo"}, "Acesso de "+nomeDe(a.id));
    }
    case "SAIR": return com(s, {logado:false});
    case "ACESSO_SET": { var ac = Object.assign({}, s.acessos); if(a.abas) ac[a.papel] = a.abas; else delete ac[a.papel]; return com(s, {acessos:ac}, a.abas ? "Acessos salvos" : "Acessos voltaram ao padrão"); }
    case "ACESSO_BLOCO": { var ab = Object.assign({}, s.acessosBlocos); if(a.grupos) ab[a.chave] = a.grupos; else delete ab[a.chave]; return com(s, {acessosBlocos:ab}); }
    case "ABA": return com(s, {aba:a.aba, breveNome: a.breve || s.breveNome});
    case "ABRIR_CALC": return com(s, {aba:"calc", calcKit:a.id});
    case "VISAO_MENU": return com(s, {visaoMenu:a.v});
    case "VER_FIN": return com(s, {verFinanceiro:a.v});
    // Lançamento diário do faturamento: sempre referente ao dia anterior. "revendedoras" é o total absoluto naquele dia —
    // a Amanda lança os 3 números juntos aqui (recebido, acertos, revendedoras), e o total de revendedoras também atualiza
    // revendedorasDiario (o mesmo dado que o gráfico de crescimento usa), pra não precisar de uma tela separada só pra isso.
    // trava/destrava um mês fechado (o lançamento do dia não consegue mexer enquanto estiver travado)
    case "FAT_TRAVAR": { var fdT = Object.assign({}, s.faturamentoDiario); if(!fdT[a.data]) return s; fdT[a.data] = Object.assign({}, fdT[a.data], {travado:!!a.travado}); return com(s, {faturamentoDiario:fdT}, a.travado ? "Mês travado" : "Mês destravado"); }
    case "FAT_LANCAR": {
      if(((s.faturamentoDiario||{})[a.data]||{}).travado) return com(s, {}, "Este mês está travado. Destrave para alterar.");
      var fd = Object.assign({}, s.faturamentoDiario); fd[a.data] = {recebido:a.recebido||0, acertos:a.acertos||0, revendedoras:a.revendedoras||0};
      var patchFat = {faturamentoDiario:fd};
      if(a.revendedoras>0){ var rd = Object.assign({}, s.revendedorasDiario); rd[a.data] = a.revendedoras; patchFat.revendedorasDiario = rd; }
      return com(s, patchFat, "Lançamento de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    // FIXAR O DIA: terminou o atendimento e o valor de hoje está certo. Vira o registro OFICIAL de hoje (o "Hoje" provisório sai) e o faturado do dia sobe sozinho em Contas a pagar → Diário.
    case "FAT_FIXAR": {
      var fdF = Object.assign({}, s.faturamentoDiario), rvF = Object.keys(s.revendedorasDiario||{}).sort();
      fdF[a.data] = {recebido:a.recebido||0, acertos:a.acertos||0, revendedoras:rvF.length ? s.revendedorasDiario[rvF[rvF.length-1]] : 0, fixadoEm:agora};
      // regra: ao fixar o dia, o faturado e os acertos DO DIA entram sozinhos no Contas a pagar → Diário (acumulado de hoje − acumulado do dia anterior do mesmo mês)
      var antF = Object.keys(fdF).filter(function(k){ return k<a.data && k.slice(0,7)===a.data.slice(0,7) && fdF[k].recebido!==undefined; }).sort().pop(), cpdF = JSON.parse(JSON.stringify(s.contasPagasDiario||{}));
      cpdF[a.data] = Object.assign({cnpjs:{}, contasPorFora:0}, cpdF[a.data], {faturado:Math.round(Math.max(0, (a.recebido||0)-(antF ? fdF[antF].recebido : 0))*100)/100, acertos:Math.max(0, (a.acertos||0)-(antF ? (fdF[antF].acertos||0) : 0))});
      return com(s, {faturamentoDiario:fdF, contasPagasDiario:cpdF, fatHoje:null}, "Faturamento de "+a.data.split("-").reverse().slice(0,2).join("/")+" fixado");
    }
    case "FAT_REABRIR": {
      var fdR = Object.assign({}, s.faturamentoDiario), regR = fdR[a.data]; if(!regR) return s; delete fdR[a.data];
      return com(s, {faturamentoDiario:fdR, fatHoje:{data:a.data, recebido:regR.recebido, acertos:regR.acertos, em:agora}}, "Dia reaberto para atualizar");
    }
    // Faturamento de HOJE (acumulado do mês até agora), só para acompanhar durante o dia: atualiza média e previsão, mas NÃO mexe no
    // registro oficial do dia anterior. No dia seguinte deixa de valer (ver fatEfetivo em financeiro.js).
    case "FAT_HOJE":
      return com(s, {fatHoje:{data:a.data, recebido:a.recebido||0, acertos:a.acertos||0, em:agora}}, "Faturamento de hoje atualizado");
    // Lançamento diário da quantidade de revendedoras (total geral), sempre referente ao dia anterior. Fonte: DevMaster/admin.
    case "REV_LANCAR": {
      // a.unico: atualização do dia, só UMA por dia (a segunda é ignorada)
      if(a.unico && (s.revAtualizadoEm||{})[a.data]) return s;
      var rd = Object.assign({}, s.revendedorasDiario); rd[a.data] = a.quantidade||0;
      return com(s, {revendedorasDiario:rd, revAtualizadoEm:a.unico ? Object.assign({}, s.revAtualizadoEm||{}, {[a.data]:agora}) : s.revAtualizadoEm}, "Revendedoras de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    case "ALTA_MEDIA_SET": { var am = Object.assign({}, s.altaMedia||{}); am[a.mes] = a.pct===null || a.pct===undefined || a.pct==="" ? null : Number(a.pct)/100; return com(s, {altaMedia:am}, "Regra da média de "+MESES_LONGO_R[a.mes]+" salva"); }
    case "META_PCT_SET": return com(s, {metaPct:[97,98,99].indexOf(Number(a.pct))>=0 ? Number(a.pct) : 99});   // 27/10/2026: 97/98/99, padrão 98 (Marcus; antes era 96/97/98 padrão 97)
    // acertos que ainda faltam realizar no mês (digitado à mão) e vendas do Carregar ainda sem valor; juntos com os feitos formam o total do mês
    case "FECHA_MES_SET": { var fmk = Object.assign({}, s.fechaMes||{}); fmk[a.ym] = {aRealizar:Number(a.aRealizar)||0, carregar:Number(a.carregar)||0}; var cdk = Object.assign({}, s.carregarDia||{}); var hojeK = new Date(); cdk[hojeK.getFullYear()+"-"+String(hojeK.getMonth()+1).padStart(2,"0")+"-"+String(hojeK.getDate()).padStart(2,"0")] = Number(a.carregar)||0; var ymK = a.ym, fdK = s.faturamentoDiario||{}, ksK = Object.keys(fdK).filter(function(k){ return k.slice(0,7)===ymK; }).sort(), feitosK = ksK.length ? (fdK[ksK[ksK.length-1]].acertos||0) : 0;
      if(s.fatHoje && String(s.fatHoje.data).slice(0,7)===ymK) feitosK = Math.max(feitosK, s.fatHoje.acertos||0);
      var hojeIsoK = hojeK.getFullYear()+"-"+String(hojeK.getMonth()+1).padStart(2,"0")+"-"+String(hojeK.getDate()).padStart(2,"0"), rdk = Object.assign({}, s.restanteDia||{}); rdk[hojeIsoK] = {feitos:feitosK, carregar:Number(a.carregar)||0, aRealizar:Number(a.aRealizar)||0};
      // 27/10/2026 (Marcus): feitos + Carregar + a realizar = acertos previstos do mês, também na meta do Agendamento e do Financeiro
      var pvK = Number(a.aRealizar)>0 ? sincPrevistosAcertos(s, ymK, feitosK+(Number(a.carregar)||0)+(Number(a.aRealizar)||0)) : {};
      return com(s, Object.assign({fechaMes:fmk, carregarDia:cdk, restanteDia:rdk}, pvK), "Acertos a realizar do mês salvos"); }
    case "CARREGAR_INICIO": { var cik = Object.assign({}, s.carregarInicio||{}); cik[a.ym] = Number(a.n)||0; return com(s, {carregarInicio:cik}, "Carregar do início do mês salvo"); }
    case "REV_REABRIR": { var raR = Object.assign({}, s.revAtualizadoEm||{}); delete raR[a.data]; return com(s, {revAtualizadoEm:raR}, "Revendedoras reabertas para atualizar"); }
    case "INT_CANCELAR": return com(s, {internos:(s.internos||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {status:a.cancelar ? "cancelado" : "agendado"}); })});
    // Contas pagas: lançamento diário por CNPJ (foto do dia, não mexe na grade mensal de Contas a pagar).
    // Saldos das contas bancárias (domain/saldos-contas.js): salvar um dia substitui o dia inteiro; conta sem lançamento vale o último saldo
    case "SALDO_DIA": { var sc1 = JSON.parse(JSON.stringify(s.saldosContas)); sc1.saldos[a.data] = a.valores; return com(s, {saldosContas:sc1}, "Saldos de "+a.data.split("-").reverse().join("/")+" salvos"); }
    case "SALDO_CEL": { var sc0 = JSON.parse(JSON.stringify(s.saldosContas)); (sc0.saldos[a.data] = sc0.saldos[a.data] || {})[a.conta] = a.valor; return com(s, {saldosContas:sc0}); }
    case "SALDO_FECHAR": { var sc7 = JSON.parse(JSON.stringify(s.saldosContas)); sc7.fechamentos = sc7.fechamentos || {}; var fm = sc7.fechamentos[a.data] = sc7.fechamentos[a.data] || {};
      a.blocos.forEach(function(b){ fm[b] = !!a.fechado; if(a.fechado) sc7.contas.filter(function(c){ return c.bloco===b; }).forEach(function(c){ (sc7.saldos[a.data] = sc7.saldos[a.data] || {})[c.id] = a.valores[c.id]; }); });
      return com(s, {saldosContas:sc7}); }
    // Faturamento do dia (acertos e recebido do DIA): guarda por dia e recalcula o acumulado do mês
    case "FAT_DIA": { var fdia = Object.assign({}, s.fatDia||{}); fdia[a.data] = {acertos:a.acertos||0, recebido:a.recebido||0, loja:a.loja||0, recup:a.recup||0, nf:a.nf||0};
      var fd8 = acumularFaturamento(fdia, s.faturamentoDiario), hj = new Date(), hjIso = hj.getFullYear()+"-"+String(hj.getMonth()+1).padStart(2,"0")+"-"+String(hj.getDate()).padStart(2,"0");
      var pt = {fatDia:fdia, faturamentoDiario:fd8}; if(a.data===hjIso) pt.fatHoje = {data:a.data, recebido:fd8[a.data].recebido, acertos:fd8[a.data].acertos, em:Date.now()};
      return com(s, pt); }
    // Aporte de sócio: dinheiro que o sócio manda para um CNPJ (entra no saldo, não é faturamento)
    case "SALDO_APORTE": { var sc9 = JSON.parse(JSON.stringify(s.saldosContas)); sc9.aportes = sc9.aportes || {}; var l9 = sc9.aportes[a.data] = sc9.aportes[a.data] || [];
      if(a.remover) sc9.aportes[a.data] = l9.filter(function(x){ return x.id!==a.remover; }); else l9.push(a.aporte); return com(s, {saldosContas:sc9}); }
    case "SALDO_DIA_DEL": { var sc2 = JSON.parse(JSON.stringify(s.saldosContas)); delete sc2.saldos[a.data]; return com(s, {saldosContas:sc2}, "Dia "+a.data.split("-").reverse().join("/")+" excluído"); }
    case "SALDO_IR": return com(s, {aba:"saldodiario", saldoData:a.data});
    case "SALDO_CONTA": { var sc3 = JSON.parse(JSON.stringify(s.saldosContas)), i3 = sc3.contas.findIndex(function(c){ return c.id===a.conta.id; });
      if(i3>=0) sc3.contas[i3] = a.conta; else sc3.contas.push(a.conta); return com(s, {saldosContas:sc3}, "Conta salva"); }
    case "SALDO_CONTA_DEL": { var sc4 = JSON.parse(JSON.stringify(s.saldosContas)); sc4.contas = sc4.contas.filter(function(c){ return c.id!==a.id; });
      Object.keys(sc4.saldos).forEach(function(k){ delete sc4.saldos[k][a.id]; }); return com(s, {saldosContas:sc4}, "Conta excluída"); }
    case "SALDO_BLOCO": { var sc5 = JSON.parse(JSON.stringify(s.saldosContas)), i5 = sc5.blocos.findIndex(function(b){ return b.id===a.bloco.id; });
      if(i5>=0) sc5.blocos[i5] = a.bloco; else sc5.blocos.push(a.bloco); return com(s, {saldosContas:sc5}, "Bloco salvo"); }
    case "SALDO_AJUSTE": { var sc6 = JSON.parse(JSON.stringify(s.saldosContas)), l6 = sc6.ajustes[a.mes] || (sc6.ajustes[a.mes] = []);
      if(a.remover) sc6.ajustes[a.mes] = l6.filter(function(x){ return x.id!==a.remover; }); else l6.push(a.ajuste); return com(s, {saldosContas:sc6}); }
    case "CPE_LANC_ADD": return com(s, {cpe:Object.assign({}, s.cpe, {lanc:((s.cpe||{}).lanc||[]).concat(a.itens)})}, a.itens.length>1 ? a.itens.length+" parcelas lançadas" : "Conta lançada");
    case "CPE_LANC_DEL": { var l0 = (((s.cpe||{}).lanc)||[]).filter(function(x){ return String(x.id)===String(a.id); })[0]; if(!l0) return s;   // excluir conta lançada à mão (Marcus, 29/10/2026): some da lista, leva junto os pagamentos dela e fica no histórico
      var lx = (((s.cpe||{}).lanc)||[]).filter(function(x){ return String(x.id)!==String(a.id); }), bxl = (((s.cpe||{}).baixas)||[]).filter(function(x){ return x.chave!=="l|"+a.id; }), hxl = (((s.cpe||{}).hist)||[]).concat([{ts:Date.now(), por:a.por, acao:"Excluiu lançamento", chave:"l|"+a.id, desc:l0.nome||"", valor:l0.valor}]);
      return com(s, {cpe:Object.assign({}, s.cpe, {lanc:lx, baixas:bxl, hist:hxl})}, "Lançamento excluído"); }
    case "CPE_BAIXA": { var bx = (((s.cpe||{}).baixas)||[]).concat(a.baixas), hx = (((s.cpe||{}).hist)||[]).concat(a.baixas.map(function(b){ return {ts:b.em, por:b.por, acao:"Deu baixa", chave:b.chave, desc:b.desc_txt||"", valor:b.principal}; }));
      return com(s, {cpe:Object.assign({}, s.cpe, {baixas:bx, hist:hx})}, a.baixas.length>1 ? a.baixas.length+" pagamentos registrados" : "Pagamento registrado"); }
    case "CPE_BAIXA_DESFAZ": { var b0 = (((s.cpe||{}).baixas)||[]).filter(function(x){ return x.id===a.id; })[0]; if(!b0) return s;
      var bx2 = (((s.cpe||{}).baixas)||[]).filter(function(x){ return x.id!==a.id; }), hx2 = (((s.cpe||{}).hist)||[]).concat([{ts:Date.now(), por:a.por, acao:"Desfez pagamento", chave:b0.chave, desc:b0.desc_txt||"", valor:b0.principal}]);
      return com(s, {cpe:Object.assign({}, s.cpe, {baixas:bx2, hist:hx2})}, "Pagamento desfeito"); }
    case "CPE_FORN_SET": { var fl = ((s.cpe||{}).forn||[]).filter(function(x){ return x.id!==a.forn.id; }).concat([a.forn]); return com(s, {cpe:Object.assign({}, s.cpe, {forn:fl})}, "Fornecedor salvo"); }
    case "CHAVESPIX_IR": return com(s, {aba:"chavespixbanco", cpxFoco:{aba:a.aba||"func", busca:a.busca||""}});
    case "CHAVESPIX_LIMPA": return Object.assign({}, s, {cpxFoco:null});
    case "EMP_ABRIR": return com(s, {emp:Object.assign({}, s.emp, {aberto:a.chave}), aba:"emprestimos"});
    case "EMP_SET": { var ct = Object.assign({}, (s.emp||{}).contratos); ct[a.chave] = Object.assign({}, ct[a.chave], a.patch); return com(s, {emp:Object.assign({}, s.emp, {contratos:ct})}); }
    case "CPE_CLASSE": { var cl = Object.assign({}, (s.cpe||{}).classe); if(a.valor) cl[a.chave] = a.valor; else delete cl[a.chave]; return com(s, {cpe:Object.assign({}, s.cpe, {classe:cl})}, a.valor==="familia" ? "Conta marcada como Família" : a.valor==="sorelly" ? "Conta marcada como Sorelly" : "Marcação removida"); }
    case "CPD_SET": {
      var cpd = JSON.parse(JSON.stringify(s.contasPagasDiario||{}));
      cpd[a.data] = Object.assign({cnpjs:{}, contasPorFora:0, faturado:0}, cpd[a.data]);
      if(a.cnpj) cpd[a.data].cnpjs[a.cnpj] = a.valor; else cpd[a.data][a.campo] = a.valor;
      return com(s, {contasPagasDiario:cpd}, "Lançamento de "+a.data.split("-").reverse().join("/")+" salvo");
    }
    // Inadimplência (financeiro): dívida e valor recuperado por mês; compras internas: vendido e pago por mês. ano é string, mes 0-11.
    case "INAD_SET": case "COMPRAS_SET": {
      var campoE = a.type==="INAD_SET" ? "inadFin" : "comprasInt", mapa = JSON.parse(JSON.stringify(s[campoE]||{}));
      mapa[a.ano] = mapa[a.ano] || {}; mapa[a.ano][a.mes] = Object.assign({}, mapa[a.ano][a.mes]); mapa[a.ano][a.mes][a.campo] = a.valor;
      var patchI = {}; patchI[campoE] = mapa; return com(s, patchI);
    }
    // Meta mensal do Agendamento: revendedoras com kit no início do mês e acertos previstos para o mês
    case "META_SET": {
      var mm = JSON.parse(JSON.stringify(s.metaMensal||{})); mm[a.ano] = mm[a.ano]||{};
      mm[a.ano][a.mes] = Object.assign({base:0, previstos:0}, mm[a.ano][a.mes]); mm[a.ano][a.mes][a.campo] = a.valor;
      return com(s, {metaMensal:mm});
    }
    // Contas a pagar: lançamento manual por mês (só Pago e A pagar; o Total é calculado). ano é string "2026", mes é 0-11.
    case "CP_SET": {
      var cp = JSON.parse(JSON.stringify(s.contasPagar||{}));
      cp[a.ano] = cp[a.ano] || {};
      cp[a.ano][a.mes] = Object.assign({pago:0, apagar:0, fixado:false}, cp[a.ano][a.mes]);
      cp[a.ano][a.mes][a.campo] = a.valor;
      return com(s, {contasPagar:cp});
    }
    case "CP_FIXAR": {
      var cp2 = JSON.parse(JSON.stringify(s.contasPagar||{}));
      cp2[a.ano] = cp2[a.ano] || {}; cp2[a.ano][a.mes] = Object.assign({pago:0, apagar:0, fixado:false}, cp2[a.ano][a.mes]);
      cp2[a.ano][a.mes].fixado = !cp2[a.ano][a.mes].fixado;
      return com(s, {contasPagar:cp2}, cp2[a.ano][a.mes].fixado ? "Mês fixado" : "Mês reaberto");
    }
    // Setor de Agendamento (acertos): todas as ações ficam em domain/agendamento.js
    // "revdia" (total de revendedoras automático, DevMaster, 27/10/2026) não guarda num módulo à parte: junta direto em revendedorasDiario/revAtualizadoEm (mesmos campos do lançamento manual antigo)
    // "fatdia" (faturamento do dia anterior automático, DevMaster, 27/10/2026): junta só o "recebido" de cada dia em faturamentoDiario; acertos/revendedoras daquele dia continuam como já estavam
    // Contas pagas por dia vindas da DevMaster (lib/contas-dm.js, 28/10/2026): de 28/10 em diante o servidor vale; antes disso só preenche o dia que está vazio (o que o Marcus conferiu no admin antigo fica)
    case "CONTAS_DM": {
      // "Por fora" NÃO vem da DevMaster: é a planilha que o Nickolas lança no sistema (Marcus, 28/10/2026). Aqui entram só os CNPJs 34, 46, 59 e 67; de 28/10 em diante o servidor vale; antes disso só preenche o dia que está sem valor nos CNPJs.
      var cdm = Object.assign({}, s.contasPagasDiario), mudouDm = false;
      Object.keys(a.diario || {}).forEach(function(dt){
        var at = cdm[dt], vazio = !at || !Object.keys(at.cnpjs || {}).some(function(k){ return at.cnpjs[k]; });
        if(dt < "2026-10-28" && !vazio) return;
        var cn = Object.assign({}, a.diario[dt].cnpjs);
        if(JSON.stringify(cn)===JSON.stringify((at || {}).cnpjs)) return;
        cdm[dt] = Object.assign({cnpjs:{}, contasPorFora:0}, at, {cnpjs:cn}); mudouDm = true;
      });
      return mudouDm ? Object.assign({}, s, {contasPagasDiario:cdm}) : s;
    }
    case "SYNC_MODULO": {
      if(a.chave==="revdia"){
        var pRD = {};
        if(a.conteudo && a.conteudo.diario) pRD.revendedorasDiario = Object.assign({}, s.revendedorasDiario, a.conteudo.diario);
        if(a.conteudo && a.conteudo.atualizadoEm) pRD.revAtualizadoEm = Object.assign({}, s.revAtualizadoEm, a.conteudo.atualizadoEm);
        return Object.assign({}, s, pRD);
      }
      if(a.chave==="kn"){   // kits novos vindos do servidor: entram (ou atualizam) na lista de novas da representante
        var nvK = (s.novas||[]).slice();
        Object.keys(a.conteudo||{}).forEach(function(k){ var it = a.conteudo[k]; if(!it || !it.id) return; var iK = nvK.findIndex(function(x){ return x.id===it.id; }); if(iK<0) nvK.unshift(it); else nvK[iK] = it; });
        return Object.assign({}, s, {kn:Object.assign({}, s.kn, a.conteudo), novas:nvK});
      }
      if(a.chave==="fd"){ var pFd = {}; ["faturamentoDiario", "contasPagasDiario", "fatHoje", "fechaMes", "metaMensal", "contasPagar", "contasPagarEm"].forEach(function(k){ if(a.conteudo && a.conteudo[k]!==undefined) pFd[k] = a.conteudo[k]; }); return Object.assign({}, s, pFd); }   // faturamento e contas pagas por dia vindos do servidor
      if(a.chave==="sc") return a.conteudo && a.conteudo.saldosContas ? Object.assign({}, s, {saldosContas:a.conteudo.saldosContas}) : s;   // saldos das contas bancárias vindos do servidor
      if(a.chave==="ri") return a.conteudo && a.conteudo.revInternas ? Object.assign({}, s, {revInternas:a.conteudo.revInternas}) : s;   // revendedoras do atendimento interno vindas do servidor
      if(a.chave==="fatdia" && a.conteudo && a.conteudo.diario){
        var fdm = Object.assign({}, s.faturamentoDiario);
        Object.keys(a.conteudo.diario).forEach(function(dt){ fdm[dt] = Object.assign({acertos:0, revendedoras:0}, fdm[dt], {recebido:a.conteudo.diario[dt]}); });
        return Object.assign({}, s, {faturamentoDiario:fdm});
      }
      return Object.assign({}, s, {[a.chave]:Object.assign({}, s[a.chave], a.conteudo)});   // vindo do servidor (lib/sync-modulos.js): sem aviso e sem eco
    }
    case "ROT": { var rRot = rotReduz(s, a); return com(s, rRot.patch, rRot.msg); }   // Rotina do dia
    case "CF": { var rCf = cfReduz(s, a), pCf = rCf.patch;
      if(a.op==="pag_add" && pCf && pCf.cf){ var pgNovo = pCf.cf.pagamentos[pCf.cf.pagamentos.length-1], fnNovo = pCf.cf.funcionarias.find(function(x){ return x.id===pgNovo.funcId; });
        pCf = Object.assign({}, pCf, {lancFin:[pxAplicar(s.px, lancFinDoPagamento(pgNovo, fnNovo, a.por), s.lancFin)].concat(s.lancFin||[])}); }   // todo pagamento vai para o Controle de pagamentos
      return com(s, pCf, rCf.msg); }
    case "CL": { var rCl = clReduz(s, a);
      return com(s, rCl.patch, rCl.msg); }
    case "IND": { var rInd = indReduz(s, a); return com(s, rInd.patch, rInd.msg); }   // Indicações (funil, resgates de prêmio, moedas)
    case "CPC": { var rCpc = cpcReduz(s, a); return com(s, rCpc.patch, rCpc.msg); }   // Cadastro de peças (lotes, custo, preço sugerido, pedidos à DevMaster)
    case "PP": { var rPp = ppReduz(s, a); return com(s, rPp.patch, rPp.msg); }   // Pedidos de peças da produção ao Cadastro de peças (pedir, OK, pronto, não temos, aviso)
    case "PR": { var rPr = prReduz(s, a); return com(s, rPr.patch, rPr.msg); }   // Produção de peças (lançamento diário, painel, bônus)
    case "EX": { var rEx = exReduz(s, a); return com(s, rEx.patch, rEx.msg); }   // Expositores (fila, montagem, devolução, danificados, estoque de expositores)
    case "AV": { var rAv = avReduz(s, a); return com(s, rAv.patch, rAv.msg); }   // Avaliações (revendedoras, sistema, montagem, funcionários)
    case "LP": { var rLp = lpReduz(s, a); return com(s, rLp.patch, rLp.msg); }   // Link de pagamento e maquininhas (Financeiro)
    case "ER": { var rEr = erReduz(s, a); return com(s, rEr.patch, rEr.msg); }   // Encomendas e reposições (pedidos, direito, bloqueio)
    case "MEL": { var rMel = melReduz(s, a); return com(s, rMel.patch, rMel.msg); }   // Solicitações de melhorias (enviar, situação, resposta)
    case "GA": { var rGa = gaReduz(s, a); return com(s, rGa.patch, rGa.msg); }   // Garantia (só o atalho para o site externo)
    case "MK": { var rMk = mkReduz(s, a); return com(s, rMk.patch, rMk.msg); }   // Marketing (Mural de Criativos, Divulgação, Erros em Produtos)
    case "CE": { var rCe = ceReduz(s, a); return com(s, rCe.patch, rCe.msg); }   // Compras de materiais e Estoque interno (materiais)
    case "FX": { var rFx = fxReduz(s, a); return com(s, rFx.patch, rFx.msg); }   // Fiscal (ILF, sublimite, entradas, saídas, contas por CNPJ)
    case "EQ": { var rEq = eqReduz(s, a); return com(s, rEq.patch, rEq.msg); }   // Equipes: organograma de departamentos
    case "INF": { var rInf = infReduz(s, a); return com(s, rInf.patch, rInf.msg); }   // Folders e informativos dos apps
    case "GR": { var rGr = grReduz(s, a); return com(s, rGr.patch, rGr.msg); }   // Garantias e condicionais do app da revendedora
    case "PK": { var rPk = a.op==="app_salvar" ? pkSalvarDoApp(s, a) : pkReduz(s, a); return com(s, rPk.patch, rPk.msg); }   // Preferências do Kit (blocos do formulário e respostas das revendedoras)
    case "ES": { var rEs = esReduz(s, a); return com(s, rEs.patch, rEs.msg); }   // Estoque Sorelly (geral de peças, Financeiro)
    case "PF": { var rPf = pfReduz(s, a); return com(s, rPf.patch, rPf.msg); }
    case "PX": { var rPx = pxReduz(s, a); return com(s, rPx.patch, rPx.msg); }
    case "CP": { var rCp = cpReduz(s, a); return com(s, rCp.patch, rCp.msg); }
    case "DP": { var rDp = dpReduz(s, a); return com(s, rDp.patch, rDp.msg); }   // Direcionar Pix (Financeiro → Contas → Pagamentos)
    case "FF": { var rFf = ffReduz(s, a); return com(s, rFf.patch, rFf.msg); }
    case "DATAS_PAG": { var dp = JSON.parse(JSON.stringify(s.datasPag || {geral:15, setores:{}})); dp.setores = dp.setores || {};
      if(a.setor){ if(a.dia) dp.setores[a.setor] = a.dia; else delete dp.setores[a.setor]; } else if(a.dia) dp.geral = a.dia; return com(s, {datasPag:dp}, "Data de pagamento salva"); }
    case "METAS": { var rMt = metasReduz(s, a); return com(s, rMt.patch, rMt.msg); }
    case "RH": { var rRh = rhReduz(s, a); return com(s, rRh.patch, rRh.msg); }
    case "AG": { var rAg = agendReduz(s, a, agora); return com(s, rAg.patch, rAg.msg); }
    case "P45": { var rP45 = p45Reduz(s, a); return com(s, rP45.patch, rP45.msg, rP45.patch && rP45.patch.p45 ? "ok" : "atencao"); }   // Agendamento → Plano 45/60 (indicações, aprovação; aprovada mudando de mês ajusta a meta)
    case "CNPJ_DOC_ADD": { var dc = Object.assign({}, s.cnpjDocs||{}); dc[a.id] = (dc[a.id]||[]).concat([a.doc]); return com(s, {cnpjDocs:dc}); }
    case "CNPJ_DOC_DEL": { var dc2 = Object.assign({}, s.cnpjDocs||{}); dc2[a.id] = (dc2[a.id]||[]).filter(function(x){ return x.id!==a.docId; }); return com(s, {cnpjDocs:dc2}); }
    case "CNPJ_SET": {
      var cn = JSON.parse(JSON.stringify(s.cnpjs||{}));
      cn[a.id] = Object.assign({}, cn[a.id]); cn[a.id][a.campo] = a.valor;
      return com(s, {cnpjs:cn});
    }
    case "FISCAL_LANCAR": {   // a.id = CNPJ; a.l = {data, fatAnual, brindesMes, entradaMes, entradaAnual}. Mesma data = substitui o lançamento.
      var fi = JSON.parse(JSON.stringify(s.fiscal||{hist:{}}));
      fi.hist[a.id] = (fi.hist[a.id]||[]).filter(function(x){ return x.data!==a.l.data; }).concat([a.l]);
      return com(s, {fiscal:fi}, "Lançamento fiscal salvo");
    }
    case "FISCAL_APAGAR": {
      var fi2 = JSON.parse(JSON.stringify(s.fiscal||{hist:{}}));
      fi2.hist[a.id] = (fi2.hist[a.id]||[]).filter(function(x){ return x.data!==a.data; });
      return com(s, {fiscal:fi2});
    }
    case "CC_SET": {   // contas a pagar por CNPJ: ano "2026", id do CNPJ ("sem" = sem CNPJ), mês 0-11
      var cc = JSON.parse(JSON.stringify(s.contasCnpj||{}));
      cc[a.ano] = cc[a.ano]||{}; cc[a.ano][a.id] = cc[a.ano][a.id]||{}; cc[a.ano][a.id][a.mes] = a.valor;
      return com(s, {contasCnpj:cc});
    }
    case "CEL": return com(s, {celular:a.id, telaCel:"proximo"});
    case "TELACEL": return com(s, {telaCel:a.t});
    case "TOGGLE": var o = Object.assign({}, s.abertas); o[a.id] = !o[a.id]; return com(s, {abertas:o});
    case "TODAS": var t = {}; s.listagens.forEach(function(l){ t[l.id] = a.v; }); return com(s, {abertas:t});
    case "KIT_ABERTO": return com(s, {kitAberto: s.kitAberto===a.id ? null : a.id});
    case "EXTRATO": return com(s, {extrato: s.extrato===a.id ? null : a.id});
    case "FILTRO_REG": return com(s, {filtroReg:a.v});
    case "LIMPAR_AVISO": return com(s, {aviso:null});
    case "AVISO": return com(s, {}, a.txt, a.tom || "alerta");

    case "DEFINIR_VALOR": {
      k = kitDe(s, a.id); if(!k || !(a.valor>0)) return s;
      if(["semvalor","pendente"].indexOf(k.status)<0) return com(s, {}, "O valor s\u00f3 pode ser alterado antes da montagem", "alerta");
      var sug = sugerido(k.vendas, s.cfg);
      // m\u00e9dia de vendas acima do limite: obrigat\u00f3rio mandar a an\u00e1lise de vendas (prints) pro relat\u00f3rio
      var obrigaAnalise = a.media>s.cfg.limiteAnaliseVendas;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {valor:a.valor, manual:a.valor!==sug,
        defPor:SUPERVISORA.id, defEm:agora, status:"pendente",
        analiseVendas: obrigaAnalise ? Object.assign({obrigatoria:true, enviada:false, media:a.media}, x.analiseVendas) : x.analiseVendas}; })},
        "Valor do kit de "+k.rev+" definido em "+BK(a.valor)+(obrigaAnalise?" \u00b7 an\u00e1lise de vendas obrigat\u00f3ria":""));
    }
    // Deysiane marca que j\u00e1 mandou a an\u00e1lise (prints) pro relat\u00f3rio de vendas daquela revendedora
    case "ANALISE_VENDAS_ENVIADA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {analiseVendas: Object.assign({}, x.analiseVendas, {enviada:true, enviadaPor:a.por||null, enviadaEm:agora, resumo:a.resumo||""})}; })},
        "An\u00e1lise de vendas de "+k.rev+" registrada");
    }
    case "CONFIRMAR_SUGERIDOS": {
      var n = 0;
      var kits = s.kits.map(function(x){ if(x.lid!==a.lid || x.status!=="semvalor") return x; n++;
        return Object.assign({}, x, {valor:sugerido(x.vendas, s.cfg), manual:false, defPor:SUPERVISORA.id, defEm:agora, status:"pendente"}); });
      return com(s, {kits:kits}, n+(n>1?" valores confirmados":" valor confirmado")+" pela sugest\u00e3o");
    }
    case "DESIGNAR": {
      k = kitDe(s, a.id); if(!k || k.status!=="pendente") return s;
      // quem monta tem que ser montador válido e, em kit grande, do setor Encomendas (exceção só de Marcus e Deysiane)
      if(a.montId){ var mnD = motivoNaoMonta(s, k, a.montId, a.excecao); if(mnD) return com(s, {}, mnD, "alerta"); }
      return com(s, {kits: mapKit(s, a.id, function(){ return {designada:a.montId||null}; })},
        a.montId ? k.rev+" designado para "+nomeDe(a.montId) : "Designa\u00e7\u00e3o cancelada, o kit voltou para a fila");
    }
    case "INICIAR_M": {
      // Quem monta é obrigatório e tem que ser uma pessoa da montagem (ou supervisão/diretoria); a montadora só monta como ela mesma
      if(!montadorValido(a.montId)) return com(s, {}, "Informe quem vai montar este kit", "alerta");
      if(papelDe(s.usuario)==="montadora" && a.montId!==s.usuario) return com(s, {}, "Você só pode montar como você mesma", "alerta");
      var forcar = !!a.forcar && papelDe(s.usuario)==="supervisao";
      if(s.kits.some(function(x){return x.montId===a.montId && x.status==="montando";}))
        return com(s, {}, "Conclua ou devolva o kit atual antes de iniciar outro", "alerta");
      k = kitDe(s, a.id); if(!k) return s;
      // Duas montadoras não pegam o mesmo kit: quem apertou primeiro fica com ele
      if(["pendente","ajuste"].indexOf(k.status)<0)
        return com(s, {}, k.rev+" já foi pego por "+nomeDe(k.montId)+". Seu próximo kit já foi atualizado.", "atencao");
      if(k.status==="pendente" && k.designada && k.designada!==a.montId && !forcar)
        return com(s, {}, "Esse kit foi pedido para "+nomeDe(k.designada)+".", "atencao");
      var aj = k.status==="ajuste";
      // Regra do kit grande: o ajuste volta para quem montou; em kit novo só Encomendas, salvo exceção de Marcus ou Deysiane
      var mnM = (aj && k.montId===a.montId) ? "" : motivoNaoMonta(s, k, a.montId, a.excecao);
      if(mnM) return com(s, {}, mnM, "alerta");
      var usouExc = soEncomendas(k, s.cfg) && !!a.excecao && !(aj && k.montId===a.montId) && (s.montadoras.find(function(m){ return m.id===a.montId; })||{}).encomendas!==true;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {status:"montando", montId:a.montId, iniM:agora,
        fimM:null, tempoM:null, pausaMs:0, pausadoEm:null, designada:null, ajustes: x.ajustes + (aj?1:0), excecaoEnc: usouExc ? s.usuario : (x.excecaoEnc||null)}; })},
        aj ? "Ajuste iniciado" : nomeDe(a.montId)+" iniciou a montagem de "+k.rev);
    }
    case "PAUSAR": return com(s, {kits: mapKit(s, a.id, function(){ return {pausadoEm:agora}; })}, "Montagem pausada", "atencao");
    case "RETOMAR": return com(s, {kits: mapKit(s, a.id, function(x){
      return {pausaMs: x.pausaMs + (agora - x.pausadoEm), pausadoEm:null}; })}, "Montagem retomada");
    case "CONCLUIR_M": {
      k = kitDe(s, a.id); if(!k || k.status!=="montando") return s;
      if(!montadorValido(k.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      if(!a.condPegas && !condOk(k, "m")) return com(s, {}, "Marque as condicionais que pegou antes de concluir", "alerta");
      var sup = ehAtencao(k.valor, s.cfg);
      var pms = k.pausaMs + (k.pausadoEm ? agora - k.pausadoEm : 0);
      return com(s, {kits: mapKit(s, a.id, function(){ return {status: sup?"supervisao":"montado", fimM:agora,
        pausaMs:pms, pausadoEm:null, tempoM: Math.max(0, agora - k.iniM - pms), motivo:null,
        cond: k.cond && condNums(k).length ? Object.assign({}, k.cond, {pegas:true, pegasPor:k.montId, pegasEm:agora}) : k.cond}; })},
        sup ? "Kit enviado para confer\u00eancia da Deysiane" : "Montagem conclu\u00edda", sup?"atencao":"ok");
    }
    case "DEVOLVER": {
      k = kitDe(s, a.id); if(!k) return s;
      var eraAjuste = k.ajustes > 0 && k.motivo;
      return com(s, {kits: mapKit(s, a.id, function(){ return eraAjuste
        ? {status:"ajuste", iniM:null, pausaMs:0, pausadoEm:null}
        : {status:"pendente", montId:null, iniM:null, pausaMs:0, pausadoEm:null, excecaoEnc:null}; })}, k.rev+" voltou para a fila", "atencao");
    }
    case "APROVAR": {
      k = kitDe(s, a.id); if(!k || k.status!=="supervisao") return s;
      if(!montadorValido(k.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      return com(s, {kits: mapKit(s, a.id, function(){ return {status:"montado", supId:SUPERVISORA.id, supEm:agora, motivo:null}; })},
        "Kit conferido e liberado para a bipagem");
    }
    // Kit antigo ou de demonstração sem montador: a supervisão informa quem montou (nada segue sem isso)
    case "INFORMAR_MONT": {
      k = kitDe(s, a.id); if(!k) return s;
      if(papelDe(s.usuario)!=="supervisao") return com(s, {}, "Só a supervisão informa quem montou", "alerta");
      if(!montadorValido(a.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      if(["montando","supervisao"].indexOf(k.status)>=0){ var mnI = motivoNaoMonta(s, k, a.montId, a.excecao); if(mnI) return com(s, {}, mnI, "alerta"); }
      return com(s, {kits: mapKit(s, a.id, function(){ return {montId:a.montId}; })}, nomeDe(a.montId)+" registrada como quem montou "+k.rev);
    }
    case "REPROVAR": {
      k = kitDe(s, a.id); if(!k) return s;
      if(!montadorValido(k.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      return com(s, {kits: mapKit(s, a.id, function(){ return {status:"ajuste", motivo:a.motivo, supId:SUPERVISORA.id, supEm:agora,
        fimM:null, tempoM:null}; })}, k.rev+" voltou para ajuste com "+nomeDe(k.montId), "atencao");
    }
    case "INICIAR_B":
      if(s.kits.some(function(x){return x.bipId===a.bipId && x.status==="bipando";})) return s;
      k = kitDe(s, a.id); if(!k) return s;
      // Só se bipa kit montado e com montador informado; quem bipa precisa ser da bipagem (ou supervisão)
      if(k.status!=="montado") return com(s, {}, "Este kit ainda não está liberado para a bipagem", "alerta");
      if(!montadorValido(k.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      if(nomeDe(a.bipId)==="—" || ["bipadora","supervisao"].indexOf(papelDe(a.bipId))<0) return com(s, {}, "Informe quem vai bipar este kit", "alerta");
      return com(s, {kits: mapKit(s, a.id, function(){ return {status:"bipando", bipId:a.bipId, iniB:agora}; })}, "Bipagem iniciada");
    case "CONCLUIR_B":
    case "CORRIGIR_B": {
      k = kitDe(s, a.id); if(!k || !(a.real>0)) return s;
      if(a.type==="CONCLUIR_B" && k.status!=="bipando") return s;
      if(!montadorValido(k.montId)) return com(s, {}, "Informe quem montou este kit", "alerta");
      if(a.type==="CONCLUIR_B" && !condOk(k, "b")) return com(s, {}, "Confira as condicionais antes de concluir o kit (se faltar, peça para a Deysiane imprimir)", "alerta");
      var pct = (a.real - k.valor)/k.valor*100, div = Math.abs(pct) > s.cfg.divPct;
      var patch = {kits: mapKit(s, a.id, function(x){ var p = {valorReal:a.real, divReg:div};
        var nv2 = a.novas || (a.nova ? [a.nova] : null);
        if(nv2) p.cond = Object.assign({nums:[], pegas:false}, x.cond, {novas:nv2, nova:null}); // números das novas condicionais (pode ser mais de uma), digitados pela bipadora
        if(a.type==="CONCLUIR_B"){ p.status="bipado"; p.fimB=agora; } else p.corrigido=true; return p; })};
      var eraDiv = a.type==="CORRIGIR_B" && k.divReg;
      if(div && !eraDiv){
        patch.montadoras = ajustaDiv(s, k.montId, 1);
        patch.registros = [{tipo:"div", kitId:k.id, montId:k.montId, rev:k.rev, esperado:k.valor, real:a.real,
          pct:Math.round(pct*10)/10, dia:"Hoje "+hora(agora)}].concat(s.registros);
      } else if(!div && eraDiv){
        patch.montadoras = ajustaDiv(s, k.montId, -1);
        patch.registros = s.registros.filter(function(r){return r.kitId!==k.id;});
      } else if(div && eraDiv){
        patch.registros = s.registros.map(function(r){ return r.kitId!==k.id ? r :
          Object.assign({}, r, {real:a.real, pct:Math.round(pct*10)/10}); });
      }
      var txt = a.type==="CORRIGIR_B" ? "Valor bipado corrigido para "+BK(a.real) :
        div ? "Diverg\u00eancia de "+N1(pct)+"% registrada para "+nomeDe(k.montId) : "Bipagem conclu\u00edda, valor confere";
      return com(s, patch, txt, div?"alerta":"ok");
    }
    case "RETIRAR":
    case "RETIRAR_KIT": {
      // Retirada em lote (todos os bipados da listagem) ou de um kit só, pelo menu ⋯
      var lidR = a.type==="RETIRAR_KIT" ? (kitDe(s, a.id)||{}).lid : a.lid;
      // a.ids = kits marcados na retirada; sem a.ids (lote antigo) vão todos os bipados
      var ids = s.kits.filter(function(x){return x.lid===lidR && x.status==="bipado" &&
        montadorValido(x.montId) && (a.type==="RETIRAR_KIT" ? x.id===a.id : (!a.ids || a.ids.indexOf(x.id)>=0));}).map(function(x){return x.id;});
      if(!ids.length){ var semMR = s.kits.some(function(x){ return x.lid===lidR && x.status==="bipado" && !montadorValido(x.montId); }); return semMR ? com(s, {}, "Informe quem montou este kit antes da retirada", "alerta") : s; }
      var por = a.por || SUPERVISORA.id;
      var kits2 = s.kits.map(function(x){ return ids.indexOf(x.id)>=0 ? Object.assign({},x,{status:"retirado", retEm:agora, retPor:por, retSozinha:!!a.sozinha, retConf: a.app ? "confirmação no app da representante" : a.sozinha && !(a.codigo && a.assinatura) ? "retirada sozinha na empresa, com a funcionária" : a.codigo && a.assinatura ? "código e assinatura" : "sem confirmação"}) : x; });
      var todos = kits2.filter(function(x){return x.lid===lidR;}).every(function(x){return x.status==="retirado";});
      var lst = s.listagens.find(function(l){return l.id===lidR;});
      var patchR = {kits:kits2, listagens: s.listagens.map(function(l){ return l.id!==lidR ? l : Object.assign({}, l,
        {fechada:todos, concluidaEm: todos ? agora : null, retiradas:l.retiradas.concat([{em:agora, por:por, qtd:ids.length, kits:ids,
          codigo:!!a.codigo, assinatura:a.assinatura||null, sozinha:!!a.sozinha, acompanhou:a.sozinha ? por : null}])}); })};
      // Listagem concluída: vai para o Consolidado com o retrato dos kits
      if(todos) patchR.histListagens = [Object.assign(registroListagem(lst, kits2, agora), {sozinha:lst.retiradas.some(function(r){return r.sozinha;}) || !!a.sozinha})].concat(s.histListagens||[]);
      var nomeK = a.type==="RETIRAR_KIT" ? kitDe(s, a.id).rev+" retirado" : ids.length+(ids.length>1?" kits retirados":" kit retirado");
      if(a.sozinha) nomeK = "Retirada sozinha registrada: "+nomeK;
      return com(s, patchR, nomeK+(todos?", listagem de "+lst.rep+" concluída e salva no Consolidado":""));
    }
    case "REABRIR": return com(s, {
        listagens: s.listagens.map(function(l){ return l.id===a.lid ? Object.assign({}, l, {fechada:false, concluidaEm:null}) : l; }),
        histListagens: (s.histListagens||[]).filter(function(h){ return !(h.lid===a.lid && h.hoje); })},
      "Listagem reaberta e de volta ao Painel");
    case "ADD_KIT": {
      var l = s.listagens.find(function(x){return x.id===a.lid;}); if(!l || l.fechada) return s;
      if(listagemCheia(s, a.lid)) return com(s, {}, "Listagem de "+l.horario+" j\u00e1 est\u00e1 com "+kitsNaListagem(s, a.lid)+"/"+capacidadeListagem(l)+" revendedoras: escolha outra listagem", "alerta");
      var nk = kit(a.lid, a.rev, a.bairro||"\u2014", 5000, a.prio, {sem:true});
      nk.id = "U"+agora; nk.vendas = a.vendas||[]; nk.ultimaHora = true; nk.atrasado = !!a.atrasado;
      nk.ordem = s.kits.filter(function(x){return x.lid===a.lid;}).length + 1;
      nk.tipoKit = a.tipoKit || "acerto_kit"; nk.fone = a.fone || ""; nk.porApp = !!a.porApp;
      nk.cond = {nums:a.conds||[], pegas:false, chkM:{}, chkB:{}, faltas:{}, impressas:{}, novas:[]};
      nk.horaAtend = a.hora || null;
      // Carimba a vers\u00e3o de regras de comiss\u00e3o/brinde vigente agora: o acerto deste kit sempre vai usar esta vers\u00e3o,
      // mesmo que as regras mudem antes do acerto acontecer (a mudan\u00e7a s\u00f3 vale a partir do pr\u00f3ximo kit).
      var vv = versaoDaRevendedora(s, nk.rev); nk.regrasVersaoId = vv ? vv.id : null; nk.remarcacoes = 0; nk.remarcacoesLista = [];
      // revendedora que saiu (ou s\u00f3 condicional): n\u00e3o tem kit, s\u00f3 a condicional vai para a representante retirar
      if(SEM_KIT[nk.tipoKit]){ nk.status = "condicional"; nk.valor = null; nk.prio = false; }
      var txtAdd = SEM_KIT[nk.tipoKit] ? a.rev+" entrou s\u00f3 para retirar a condicional" : nk.tipoKit==="reposicao" ? "Reposi\u00e7\u00e3o de "+a.rev+" inclu\u00edda: defina o valor (at\u00e9 o m\u00e1ximo liberado)" : "Kit de \u00faltima hora inclu\u00eddo, defina o valor para ele entrar na fila";
      return com(s, {kits: s.kits.concat([nk])}, txtAdd+(nk.atrasado?" \u00b7 atrasado":""));
    }
    case "SALVAR_PERFIL_REV": {
      var perfis = Object.assign({}, s.perfisRev);
      perfis[a.chave] = Object.assign({}, perfis[a.chave], a.patch);
      return com(s, {perfisRev:perfis}, "Dados de "+a.chave+" atualizados");
    }
    // Modalidade do kit (padrão | prata) fica no cadastro da revendedora; cada troca entra no histórico (anterior, nova, data, quem).
    case "SET_MODALIDADE": {
      var perfM = Object.assign({}, s.perfisRev), atualM = perfM[a.chave] || {};
      var antM = atualM.modalidade === "prata" ? "prata" : "padrao";
      if(antM === a.modalidade) return s;
      perfM[a.chave] = Object.assign({}, atualM, {modalidade:a.modalidade,
        modalidadeHist:[{de:antM, para:a.modalidade, em:new Date(agora).toISOString(), por:a.por||"", origem:a.origem||"representante"}].concat(atualM.modalidadeHist||[])});
      return com(s, {perfisRev:perfM}, a.chave+" agora é "+(a.modalidade==="prata" ? "Kit 100% Prata" : "Kit padrão"));
    }
    case "CRIAR_LISTAGEM": {
      var novaL = {id:"L"+agora, rep:a.rep, destino:a.destino||"Curitiba", viagem:!!a.viagem, horario:a.horario||"10:00",
        data:a.data||isoDia(new Date(agora)), fechada:false, retiradas:[]};
      return com(s, {listagens: s.listagens.concat([novaL])}, "Listagem de "+a.horario+" criada para "+a.rep);
    }
    case "FECHAR_MES": {
      if(s.mesFechado) return s;
      var total = s.montadoras.reduce(function(t,m){return t+resumoMontadora(m,s).liquido;},0)
        + BIPADORAS.reduce(function(t,b){return t+resumoBipadora(b,s).liquido;},0);
      return com(s, {mesFechado:agora, historico:[{mes:nomeMes(), total:total, pagoEm:dataPagamento(s.cfg),
        situacao:"Aguardando pagamento"}].concat(s.historico)}, "M\u00eas fechado, pagamento em "+dataPagamento(s.cfg));
    }
    case "CFG": {
      var c = JSON.parse(JSON.stringify(s.cfg));
      if(a.lista) c[a.lista][a.i][a.campo] = a.valor; else c[a.campo] = a.valor;
      return com(s, {cfg:c});
    }
    // Condicionais: a montadora confirma que pegou ao final da montagem; item "só condicional" fica pronto para retirada
    case "PEGAR_COND": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ return {cond:Object.assign({}, x.cond, {pegas:true, pegasPor:a.por||null, pegasEm:agora}),
        status: x.status==="condicional" ? "bipado" : x.status}; })}, "Condicionais de "+k.rev+" pegas");
    }
    // Check de cada condicional: papel "m" = montadora pegou, "b" = bipadora conferiu ao fechar o kit
    case "COND_CHK": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){
        var c = Object.assign({chkM:{}, chkB:{}}, x.cond), campo = a.papel==="b" ? "chkB" : "chkM", o = Object.assign({}, c[campo]); o[a.num] = !!a.v;
        c[campo] = o;
        if(a.papel!=="b"){ c.pegas = condNums(x).every(function(n){ return o[n]; }); if(c.pegas){ c.pegasPor = a.por||x.montId||null; c.pegasEm = agora; } }
        return {cond:c, status: x.status==="condicional" && c.pegas ? "bipado" : x.status}; })});
    }
    // Condicional não está no kit: vai o pedido para a Deysiane imprimir; ela marca como impressa
    case "COND_FALTA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var f = Object.assign({}, (x.cond||{}).faltas); f[a.num] = {por:a.por||null, em:agora};
        return {cond:Object.assign({}, x.cond, {faltas:f})}; })}, "Pedido para imprimir a condicional "+a.num+" enviado à Deysiane", "atencao");
    }
    case "COND_IMPRESSA": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var im = Object.assign({}, (x.cond||{}).impressas); im[a.num] = {por:a.por||null, em:agora};
        return {cond:Object.assign({}, x.cond, {impressas:im})}; })}, "Condicional "+a.num+" impressa");
    }
    // Conferência prévia, antes do item entrar na fila de montagem: quem confere aqui não é a montadora nem a bipadora,
    // é a funcionária de condicionais — por isso um campo (chkP) separado do chkM/chkB, sem mexer no fluxo delas.
    case "COND_CHK_PRE": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){ var p = Object.assign({}, (x.cond||{}).chkP); p[a.num] = !!a.v;
        return {cond:Object.assign({}, x.cond, {chkP:p})}; })});
    }
    // A funcionária de condicionais achou um número que não veio da DevMaster (ou a lista dela estava errada)
    // e digita na mão. Já entra conferida, porque ela só digita o que já está com ela em mãos.
    case "COND_ADD_NUM": {
      k = kitDe(s, a.id); var num = (a.num||"").trim(); if(!k || !num) return s;
      if(condNums(k).indexOf(num)>=0) return com(s, {}, num+" já está na lista dessa revendedora", "atencao");
      return com(s, {kits: mapKit(s, a.id, function(x){
        var c = Object.assign({}, x.cond), p = Object.assign({}, c.chkP), prev = Object.assign({}, c.prev);
        p[num] = true; prev[num] = new Date().toISOString();
        return {cond:Object.assign(c, {nums:(c.nums||[]).concat([num]), chkP:p, prev:prev})}; })}, "Condicional "+num+" adicionada");
    }
    // Libera pra fila de montagem: só chega até aqui quando as condicionais da revendedora já foram todas conferidas.
    case "LIBERAR_COND": {
      var idsSet = {}; (a.ids||[]).forEach(function(id){ idsSet[id] = true; });
      var revNome = null;
      var novosKits = s.kits.map(function(x){
        if(!idsSet[x.id] || x.status!=="precond") return x;
        revNome = x.rev;
        return Object.assign({}, x, {status: x.valor===null ? "semvalor" : "pendente",
          cond: Object.assign({}, x.cond, {liberadoPor:a.por||null, liberadoEm:agora})});
      });
      return com(s, {kits: novosKits}, (revNome||"Revendedora")+" liberada para a fila de montagem");
    }
    // Retirada pelo celular da bipagem: a bipadora solicita, a representante confirma o recebimento no app dela
    case "SOLICITAR_RET": {
      if(!a.ids || !a.ids.length) return s;
      var lr = s.listagens.find(function(x){return x.id===a.lid;});
      return com(s, {retPend:(s.retPend||[]).filter(function(p){return p.lid!==a.lid;}).concat([{id:"R"+agora, lid:a.lid, ids:a.ids, por:a.por, em:agora}])},
        "Retirada enviada para o app de "+lr.rep+" confirmar");
    }
    case "RESP_RET": {
      var pr = (s.retPend||[]).find(function(p){return p.id===a.id;}); if(!pr) return s;
      var s2 = Object.assign({}, s, {retPend:(s.retPend||[]).filter(function(p){return p.id!==a.id;})});
      if(!a.aceita) return com(s2, {}, "A representante recusou a retirada", "atencao");
      return reducer(s2, {type:"RETIRAR", lid:pr.lid, ids:pr.ids, por:pr.por, codigo:true, app:true});
    }
    // App da revendedora: confirma que recebeu, se as peças conferem e se gostou do kit
    // Representante organiza os atendimentos: horário de cada revendedora
    case "SET_HORA": return com(s, {kits: mapKit(s, a.id, function(){ return {horaAtend:a.hora}; })}, "Atendimento marcado para "+a.hora);
    case "CONF_REV": return com(s, {kits: mapKit(s, a.id, function(){ return {confRev:{recebeu:true, confere:a.confere, gostou:a.gostou, obs:a.obs||"", em:agora}}; })}, "Confirmação da revendedora registrada");
    // Revendedora avalia a representante no fim do acerto: pontualidade, explicou direito, responde o WhatsApp
    case "AVAL_REP": {
      var na = {rep:a.rep, rev:a.rev, kitId:a.kitId||null, data:new Date(agora).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), pont:a.pont, expl:a.expl, whats:a.whats, obs:a.obs||""};
      return com(s, {avalRep:[na].concat(s.avalRep||[]), kits: a.kitId ? mapKit(s, a.kitId, function(){ return {avalRepFeita:true}; }) : s.kits}, "Avaliação da representante enviada");
    }
    // Representante recusou a revendedora nova: volta para a Michele direcionar; recusas entram na avaliação e podem bloquear novos envios
    case "RECUSAR_NOVA": {
      var nr = (s.novas||[]).find(function(n){return n.id===a.id;}); if(!nr || !nr.rep) return s;
      var rec2 = [{rep:nr.rep, rev:nr.nome, data:new Date(agora).toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}), iso:new Date(agora).toLocaleDateString("sv-SE",{timeZone:"America/Sao_Paulo"}), motivo:a.motivo||"Recusou pelo app"}].concat(s.recusas||[]);
      var qtdR = rec2.filter(function(x){return x.rep===nr.rep;}).length, bl = Object.assign({}, s.bloqueioNovas);
      var bloqueou = qtdR >= s.cfg.recusasBloqueio && !bl[nr.rep]; if(bloqueou) bl[nr.rep] = true;
      return com(s, {recusas:rec2, bloqueioNovas:bl, novas:s.novas.map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {status:"aguardando", rep:null, recusadaPor:(n.recusadaPor||[]).concat([nr.rep])}); })},
        nr.rep+" recusou "+nr.nome+(bloqueou ? ": "+qtdR+" recusas, não recebe mais kits novos" : ""), "atencao");
    }
    case "BLOQ_NOVAS": { var b2 = Object.assign({}, s.bloqueioNovas); if(a.v) b2[a.rep] = true; else delete b2[a.rep];
      return com(s, {bloqueioNovas:b2}, a.v ? a.rep+" não recebe mais kits novos" : a.rep+" voltou a receber kits novos"); }
    // Setor Kit novo: direciona a revendedora nova para uma representante ou coloca direto numa listagem
    case "NOVA_DIRECIONAR": return com(s, {novas:(s.novas||[]).map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {rep:a.rep, status:"direcionada"}); })},
      "Revendedora direcionada para "+a.rep);
    case "NOVA_INCLUIR": {
      var nv = (s.novas||[]).find(function(n){return n.id===a.id;}), ln = s.listagens.find(function(x){return x.id===a.lid;});
      if(!nv || !ln || ln.fechada) return s;
      if(listagemCheia(s, a.lid)) return com(s, {}, "Listagem de "+ln.horario+" já está com "+kitsNaListagem(s, a.lid)+"/"+capacidadeListagem(ln)+" revendedoras: escolha outra listagem", "alerta");
      // dentro do prazo não precisa de nada; fora do prazo: Michele só com autorização da diretoria, representante entra como atrasado
      if(a.foraPrazo && a.quem==="kitnovo" && !a.autorizador) return com(s, {}, "Fora do prazo: precisa da autorização do Marcus ou do Nickolas", "alerta");
      var nk = kit(a.lid, nv.nome, nv.bairro, nv.valor, 0, {nv:0});
      nk.id = "KN"+agora; nk.vendas = []; nk.valor = nv.valor; nk.status = "pendente"; nk.manual = false; nk.defPor = KITNOVO.id; nk.defEm = agora;
      nk.tipoKit = nv.expositor ? "kit_novo_exp" : "kit_novo"; nk.cond = {nums:[], pegas:false, nova:""};
      nk.atrasado = !!a.foraPrazo; nk.autorizadoPor = a.autorizador || null; nk.origemNova = nv.id;
      nk.ordem = s.kits.filter(function(x){return x.lid===a.lid;}).length + 1;
      return com(s, {kits:s.kits.concat([nk]), novas:s.novas.map(function(n){ return n.id!==a.id ? n : Object.assign({}, n, {status:"na listagem", lid:a.lid, rep:ln.rep, autorizadoPor:a.autorizador||null}); })},
        nv.nome+" entrou na listagem de "+ln.rep+(a.autorizador ? " (autorizado por "+nomeDe(a.autorizador)+")" : a.foraPrazo ? " como atrasado" : ""));
    }
    // Avaliação da representante no app dela: nota do kit e peças faltando (desconta da bipadora)
    case "AVALIAR": return com(s, {kits: mapKit(s, a.id, function(){ return {aval:{nota:a.nota, faltas:a.faltas}}; })}, "Avaliação enviada");
    // Representante marca uma remarcação deste kit (antes do acerto): cada remarcação entra na lista com sua própria
    // isenção (motivo justificado, ex.: falecimento na família) — remarcação isenta não pesa multa nem avança a escada.
    case "KIT_REMARCAR": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){
          var lista = (x.remarcacoesLista||[]).concat([{em:agora, isenta:!!a.isenta, motivo:a.motivo||""}]);
          return {remarcacoesLista:lista, remarcacoes:lista.length}; })},
        "Remarcação registrada para "+k.rev+(a.isenta?" (isenta)":""), "atencao");
    }
    // Representante remove uma remarcação lançada por engano (botão X na lista).
    case "KIT_REMARCAR_REMOVER": {
      k = kitDe(s, a.id); if(!k) return s;
      return com(s, {kits: mapKit(s, a.id, function(x){
          var lista = (x.remarcacoesLista||[]).filter(function(r,i){ return i!==a.indice; });
          return {remarcacoesLista:lista, remarcacoes:lista.length}; })},
        "Remarcação removida");
    }
    // Fecha o acerto de um kit de revenda normal: calcula comissão/brinde pela regra carimbada no kit e grava no consolidado.
    case "ACERTO_REGISTRAR": {
      k = kitDe(s, a.id); if(!k) return s;
      var versaoK0 = versaoDoKit(s, k); if(!versaoK0) return s;
      var modK = a.modalidade || modalidadeDe(s, k.rev), versaoK = versaoEfetiva(versaoK0, modK);
      var abK = abaterDividas(s, k.rev, a.pagamentos, null);
      var res = calcularAcerto({vendaBruta:a.vendaBruta, devolvida:a.devolvida||0, garantia:a.garantia||0, vez:vezCobravel(k.remarcacoesLista),
        valorPago:(a.valorPago||0) > abK.pago+0.009 ? a.valorPago : Math.max(0, (a.valorPago||0)-abK.total), atrasoDias:(modK==="prata" || versaoK.novas) ? (a.atrasoDias||0) : 0, diasQuitacao:a.diasQuitacao||0}, versaoK);
      // Revendedora recusou negociar o que faltava: sem brinde de jeito nenhum, vira nota promissória (executada em 48h úteis).
      if(a.recusouNegociar) res = Object.assign({}, res, {brindeNormal:0, brindeSelect:0, fatorPagamento:0});
      var registro = Object.assign({id:"AC"+agora, kitId:k.id, rev:k.rev, rep:(function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l?l.rep:null; })(),
        tipo:"acerto", tipoKit:k.tipoKit||"acerto_kit", data:new Date(agora).toISOString().slice(0,10), regrasVersaoId:versaoK.id, modalidade:modK, atrasoDias:a.atrasoDias||0, diasQuitacao:a.diasQuitacao||0, abatidoDivida:abK.total, regrasNovas:versaoK.novas ? copiaNovas(versaoK.novas) : null, hora:new Date(agora).toTimeString().slice(0,5), vendaBruta:a.vendaBruta, garantia:a.garantia||0, pecasCond:a.pecasCond||0,
        reagendamentos:(k.remarcacoesLista||[]).length, remarcacoes:(k.remarcacoesLista||[]).slice(), formSnapshot:a.formSnapshot||null, motivoVendaBaixa:a.motivoVendaBaixa||"", recebimento:null,
        vendaDigitada:a.vendaDigitada!=null ? a.vendaDigitada : a.vendaBruta, trocas:a.trocas||[], tagsDanificadas:a.tagsDanificadas||0, tagsValor:a.tagsValor||0,
        pecasVendidas:a.pecasVendidas||null, pecasBrinde:a.pecasBrinde||null, pecasTrocas:a.pecasTrocas||null,
        pecasADevolver:a.pecasADevolver!=null?a.pecasADevolver:null, condicionaisSelecionadas:a.condicionaisSelecionadas||[],
        pagamentos:a.pagamentos||[], acordo:a.acordo||null, recusouNegociar:!!a.recusouNegociar,
        brindesLancados:a.brindesLancados||[], excedenteBrinde:a.excedenteBrinde||0,
        pecasProxCodigos:a.pecasProxCodigos||[], pecasProxLiberadas:a.pecasProxLiberadas||0, kitNovoOk:!!a.kitNovoOk, expositoresMarcados:a.expositoresMarcados||[],
        assinatura:a.assinatura||null, regrasLidas:!!a.regrasLidas}, res);
      var lpU1 = usarLinksNoAcerto(s.lp, a.pagamentos, registro.id, agoraSPLp(), k.rev);   // links de pagamento usados como pagamento ficam marcados (não descontam duas vezes)
      return com(s, {kits: mapKit(s, a.id, function(){ return {acerto:res, status:"acertado", acertoAssinado:!!a.assinatura}; }),
        acertosConsignado:[registro].concat(aplicarAbatimento(s.acertosConsignado||[], abK, (a.pagamentos||[])[0], registro.id, agora)), lp:lpU1 || s.lp, perfisRev:a.kitNovoOk ? carimboEntrega(s, k.rev) : s.perfisRev},
        "Acerto de "+k.rev+" registrado: "+BK(res.valorAcerto)+" (comissão "+BK(res.comissao)+")");
    }
    // Consolidado das representantes: o setor de agendamento confere o dinheiro e dá o OK de recebimento (libera a comissão)
    // pagamentos dos acertos das representantes (vêm da calculadora de acertos) viram pedidos de pagamento no grupo Financeiro Representantes
    case "FIN_REP_SYNC": {
      var lfsR = s.lancFin || [], idsR = {}; lfsR.forEach(function(x){ idsR[x.id] = 1; }); var novosR = [], vincR = {};
      (s.acertosConsignado || []).forEach(function(r){
        if(r.origem==="interno" || r.tipo!=="acerto" || idsR["LFR_"+r.id]) return;
        if(idsR[idPedidoRep(r.kitId)]){ vincR[idPedidoRep(r.kitId)] = r.id; return; }   // a representante já pediu as contas pelo app: é o MESMO lançamento, só liga ao acerto
        var ps = (r.pagamentos || []).map(function(p, i){ return {p:p, i:i}; }).filter(function(x){ return ["pix","link","credito","debito"].indexOf(x.p.forma)>=0 && x.p.valor>0; }); if(!ps.length) return;
        var ok = function(i){ return !!(r.fin && r.fin[i]); };
        novosR.push({id:"LFR_"+r.id, origem:"rep", repAcertoId:r.id, nome:r.rev, por:r.rep, enviadoTs:Date.parse(r.data+"T"+(r.hora||"12:00")+":00") || agora, conferido:ps.every(function(x){ return ok(x.i); }), etapaComprovantes:true, finalizado:true,
          linhas:ps.map(function(x){ return {tipo:"pagamento", forma:x.p.forma, valor:x.p.valor, isento:false, enviada:true, partes:[{descricao:x.p.descricao||"", valor:x.p.valor, comprovante:null, ok:ok(x.i)}]}; })});
      });
      var comVinc = lfsR.map(function(x){ return vincR[x.id] && x.repAcertoId!==vincR[x.id] ? Object.assign({}, x, {repAcertoId:vincR[x.id]}) : x; }), mudVinc = comVinc.some(function(x, i){ return x!==lfsR[i]; });
      return novosR.length || mudVinc ? sincContasRep(com(s, {lancFin:novosR.concat(comVinc)})) : sincContasRep(s);
    }
    case "INT_AVALIAR": return com(s, {internos:(s.internos||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {avaliacao:{nota:a.nota, erros:a.erros||0, em:agora}}); })}, "Avaliação do atendimento registrada");
    case "DIN_ETAPA": {
      var fxD = JSON.parse(JSON.stringify(s.dinheiroFluxo||{})), itD = fxD[a.id] = fxD[a.id] || {}, tsD = new Date(agora).toISOString();
      itD["e"+a.etapa] = {por:a.por, ts:tsD, valor:a.valor};
      var patchD = {dinheiroFluxo:fxD};
      if(a.etapa===1 && a.id.charAt(0)==="R"){ var ridD = a.id.slice(1); patchD.acertosConsignado = (s.acertosConsignado||[]).map(function(r){ if(r.id!==ridD) return r; var recD = Object.assign({}, r.recebimento||{}); recD.din = {ok:true, contado:a.valor, ts:tsD, por:a.por}; return Object.assign({}, r, {recebimento:recD}); }); }
      return com(s, patchD, a.etapa===1 ? "Dinheiro recebido pelo agendamento" : "Dinheiro recebido pelo financeiro");
    }
    case "CONSREP_RECEBER": {
      return aplicaFila(com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){
        if(r.id!==a.id) return r;
        var atual = r.recebimento || {};
        var novo = Object.assign({}, atual, a.patch||{});
        if(a.patch && a.patch.ok===true && !atual.ok) novo.em = new Date(agora).toISOString();
        if(a.patch && a.patch.ok===false){ novo.em = null; novo.bip = null; }
        return Object.assign({}, r, {recebimento:novo});
      })}, a.patch && a.patch.ok===true ? "Recebimento conferido: falta o OK do financeiro para liberar a comissão" : null));
    }
    // Retorno bipado: quem bipa (marcado no Configurador geral) dá o OK em cada acerto que o agendamento já recebeu. a.desfazer tira o OK.
    case "RETORNO_BIPAR": {
      return aplicaFila(com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){
        if(r.id!==a.id || !r.recebimento || !r.recebimento.ok) return r;
        return Object.assign({}, r, {recebimento:Object.assign({}, r.recebimento, {bip:a.desfazer ? null : {por:a.por, porId:a.porId||null, ts:agora}})});
      })}, a.desfazer ? null : "Retorno bipado por "+a.por));
    }
    case "AUTORIZ_SET": { var au = Object.assign({}, s.autoriz); au[a.k] = a.ids; return com(s, {autoriz:au}, "Autorização atualizada"); }
    case "BIPA_RETORNO_SET": return com(s, {bipaRetorno:a.ids}, "Quem bipa os retornos foi atualizado");
    // Financeiro dá o OK de uma linha (pagamento "0","1"… ou comissão fixa "k") e diz em que conta o dinheiro entrou (desfazer = ok:false).
    // Pix representante: a.rep é a representante que recebeu o Pix — já conta como comissão paga direto a ela.
    case "COMIS_FIN": {
      return com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){
        if(r.id!==a.id) return r;
        var fin = Object.assign({}, r.fin||{});
        var dv = Object.assign({}, r.divs||{});
        (a.idxs||[a.idx]).forEach(function(i){ if(a.ok===false){ delete fin[i]; delete dv[i]; } else { delete dv[i]; } if(a.ok===false) return; fin[i] = {por:a.por, ts:new Date(agora).toISOString(), conta:a.conta || ((r.pagamentos||[])[i]||{}).descricao || "", rep:a.rep||null}; });
        return Object.assign({}, r, {fin:fin, divs:dv}); })}, a.ok===false ? null : "Conciliado");
    }
    // Divergência numa linha de pagamento: valor diferente / conta errada (corrige e já concilia) / não identificado (avisa a representante) / limpar
    case "COMIS_DIV": {
      return com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){
        if(r.id!==a.id) return r;
        var fin = Object.assign({}, r.fin||{}), dv = Object.assign({}, r.divs||{}), p = (r.pagamentos||[])[a.idx] || {}, ts = new Date(agora).toISOString();
        if(a.tipo==="limpar"){ delete dv[a.idx]; delete fin[a.idx]; }
        else if(a.tipo==="valor"){ fin[a.idx] = {por:a.por, ts:ts, conta:p.descricao||"", valorReal:a.valor}; dv[a.idx] = {tipo:"valor", valorErrado:p.valor||0, valorCerto:a.valor, por:a.por, ts:ts}; }
        else if(a.tipo==="conta"){ fin[a.idx] = {por:a.por, ts:ts, conta:a.conta}; dv[a.idx] = {tipo:"conta", contaErrada:p.descricao||"", contaCerta:a.conta, por:a.por, ts:ts}; }
        else { delete fin[a.idx]; dv[a.idx] = {tipo:"nao_ident", por:a.por, ts:ts}; }
        return Object.assign({}, r, {fin:fin, divs:dv}); })}, a.tipo==="nao_ident" ? "Representante avisada no app" : a.tipo==="limpar" ? null : "Divergência registrada e conciliada");
    }
    // Fechamento de uma representante numa data de pagamento: km do combustível, ajuste do fechamento anterior e pagamentos feitos
    case "COMIS_FECH": {
      var fe = Object.assign({}, (s.comis||{}).fech||{}); fe[a.key] = Object.assign({}, fe[a.key]||{}, a.patch);
      return com(s, {comis:Object.assign({}, s.comis, {fech:fe})}, a.aviso || null);
    }
    // Km do carro no início e no fim do dia (a representante lança no app)
    case "COMIS_KMDIA": {
      var kd = Object.assign({}, (s.comis||{}).kmDia||{}), kk = a.rep+"|"+a.dia; kd[kk] = Object.assign({}, kd[kk]||{}, a.patch);
      return com(s, {comis:Object.assign({}, s.comis, {kmDia:kd})}, a.aviso || null);
    }
    case "COMIS_FECH_PAG": {
      var fp = Object.assign({}, (s.comis||{}).fech||{}), at = fp[a.key] || {}, lp = (at.pagamentos||[]).slice();
      if(a.del!=null) lp.splice(a.del,1); else lp.push(Object.assign({}, a.pag, {por:a.por, ts:new Date(agora).toISOString()}));
      fp[a.key] = Object.assign({}, at, {pagamentos:lp});
      return com(s, {comis:Object.assign({}, s.comis, {fech:fp})}, a.del!=null ? null : "Pagamento da comissão registrado");
    }
    // Configurador de comissões: representantes (%, grupo), ciclos, corte, kit novo, promissória
    // Preço médio da gasolina comum no Paraná (ANP): um valor só, com data e quem atualizou
    // Negociação do Pix direto (só a diretoria edita, na tela Regras dos representantes): por representante, % ou valor, vigência e extra
    case "NEGPIX_SET": { var np = Object.assign({}, s.negPix||{}); np[a.rep] = Object.assign({modo:"pct", valor:0, vigencia:"mes", mes:isoDia(new Date(agora)).slice(0,7), extra:0, extraTxt:""}, np[a.rep]||{}, a.patch); return com(s, {negPix:np}); }
    case "NEGPIX_DEL": { var nd = Object.assign({}, s.negPix||{}); delete nd[a.rep]; return com(s, {negPix:nd}, "Negociação removida"); }
    case "REV_COND_ADD": { var pr = Object.assign({}, s.perfisRev||{}), per = Object.assign({}, pr[a.rev]||{}), lista = (per.condicionaisAbertas||[]).slice();
      if(!a.numero || lista.some(function(x){ return x.numero===a.numero; })) return s;
      lista.push({numero:a.numero, pecas:a.pecas||0, manual:true}); per.condicionaisAbertas = lista; pr[a.rev] = per; return com(s, {perfisRev:pr}, "Condicional "+a.numero+" adicionada"); }
    case "COMIS_GAS_VISTO": return com(s, {comis:Object.assign({}, s.comis, {gasolinaVisto:Object.assign({}, (s.comis||{}).gasolinaVisto||{}, {[a.rep]:((s.comis||{}).gasolinaPR||{}).em})})});
    case "COMIS_GAS": return com(s, {comis:Object.assign({}, s.comis, {v2:true, corteHora:a.corteHora, kmPorLitro:a.kmPorLitro, gasolinaPR:{valor:a.valor, em:new Date(agora).toISOString(), por:a.por}, gasolinaHist:[{valor:a.valor, em:new Date(agora).toISOString(), por:a.por}].concat((s.comis||{}).gasolinaHist||[])})}, "Preço da gasolina atualizado");
    // Compras de joias das representantes (básico): compra com valor negociado e os pagamentos feitos dentro dela
    case "COMPRA_REP_ADD": return com(s, {comprasRep:[Object.assign({id:"CJ"+agora, pagamentos:[], por:a.por, criada:new Date(agora).toISOString()}, a.compra)].concat(s.comprasRep||[])}, "Compra registrada");
    case "COMPRA_REP_DEL": return com(s, {comprasRep:(s.comprasRep||[]).filter(function(x){ return x.id!==a.id; })});
    case "COMPRA_REP_PAG": return com(s, {comprasRep:(s.comprasRep||[]).map(function(x){ if(x.id!==a.id) return x; var l = (x.pagamentos||[]).slice(); if(a.del!=null) l.splice(a.del,1); else l.push(Object.assign({}, a.pag, {por:a.por, ts:new Date(agora).toISOString()})); return Object.assign({}, x, {pagamentos:l}); })}, a.del!=null ? null : "Pagamento da compra registrado");
    // Desistência do kit novo (teste do novo fluxo): o kit volta e a Rep. Kit Novo recebe só a gasolina (o R$ 25 zera em itensComissao)
    case "COMIS_DESIST": return com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){ return String(r.id)===String(a.id) ? Object.assign({}, r, {desistencia:!!a.valor}) : r; })}, a.valor ? "Desistência registrada: só a gasolina" : "Desistência desfeita");
    case "COMIS_CONFIG": return com(s, {comis:Object.assign({}, s.comis, a.patch)}, a.aviso || null);
    // Termo do kit novo conferido pelo agendamento (quando não veio assinado pelo app)
    case "COMIS_TERMO": {
      var tm = Object.assign({}, (s.comis||{}).termos||{});
      if(a.ok) tm[a.id] = {por:a.por, ts:new Date(agora).toISOString()}; else delete tm[a.id];
      return com(s, {comis:Object.assign({}, s.comis, {termos:tm})});
    }
    // Inadimplência: negociação com a revendedora e pagamento recebido depois (vira linha extra do acerto)
    case "INAD_NEGOCIAR":
      return com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){ return r.id!==a.id ? r :
        Object.assign({}, r, {negoc:(r.negoc||[]).concat([{ts:new Date(agora).toISOString(), por:a.por, txt:a.txt||"", promessa:a.promessa||"", valor:a.valor||0}])}); })}, "Negociação registrada");
    case "INAD_PAGAR":
      return com(s, {acertosConsignado:(s.acertosConsignado||[]).map(function(r){ return r.id!==a.id ? r :
        Object.assign({}, r, {pagamentos:(r.pagamentos||[]).concat([{forma:a.forma, descricao:a.descricao, parcelas:1, data:isoDia(new Date(agora)), valor:a.valor, anexo:null, extra:true, ts:agora, por:a.quem||""}])}); })},
        "Pagamento registrado: o financeiro confirma a conta em Comissões");
    // ── Atendimento interno: revendedoras que acertam na própria Sorelly. Não são kits da montagem: a listagem é montada à mão
    // (puxada da DevMaster) e a Calculadora de acertos do admin usa a mesma conta do app da representante. ──
    case "INT_ADD": {
      var vigI = versaoDaRevendedora(s, (a.nome||"").trim());
      var novoI = {id:"I"+agora, tipo:a.tipo||"acerto", nome:(a.nome||"").trim(), fone:a.fone||"", devmaster:a.devmaster||"", data:a.data||isoDia(new Date(agora)), hora:a.hora||"",
        condicionais:a.condicionais||[], obs:a.obs||"", remarcacoesLista:[], status:"agendado", regrasVersaoId:vigI ? vigI.id : null, criadoPor:a.por||"", criadoEm:agora};
      if(!novoI.nome) return s;
      var perfI = s.perfisRev, patchI = {};
      if(a.modalidade){ patchI.perfisRev = Object.assign({}, perfI); var pI = Object.assign({}, perfI[novoI.nome]);
        if((pI.modalidade==="prata" ? "prata" : "padrao") !== a.modalidade) pI.modalidadeHist = [{de:pI.modalidade==="prata"?"prata":"padrao", para:a.modalidade, em:new Date(agora).toISOString(), por:a.por||"", origem:"interno"}].concat(pI.modalidadeHist||[]);
        pI.modalidade = a.modalidade; patchI.perfisRev[novoI.nome] = pI; }
      return com(s, Object.assign({internos:[novoI].concat(s.internos||[])}, patchI), novoI.nome+" entrou na agenda do atendimento interno");
    }
    // ── Revendedoras internas (controle de ciclo e agendamento da agendadora) ──
    // Revendedoras vindas da DevMaster (servidor → /devmaster/revendedoras): entram só as que ainda não existem (mesmo código da DevMaster ou mesmo nome), como "A contatar", ciclo de 30 dias
    case "REVINT_ADD_LOTE": {
      var nm = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); };
      // Itens da API 2 (/api/revendedoras?rep=02): cod, nome, celular, cidade, vendas [{d, v}] (3 últimas, sem brinde, mais nova primeiro) e prevDevol (previsão do kit principal).
      // Quem já existe só recebe as vendas reais (histórico); data, hora, situação e ciclo da agendadora nunca são mexidos.
      var sz = function(c){ return String(c||"").replace(/^0+/, ""); };   // 004624 e 4624 são o mesmo código
      var codI = function(i){ return sz(i.cod || i.codigo); };
      var histDe = function(i){ var h = (i.vendas||[]).map(function(v){ return {data:v.d, venda:v.v, acerto:null}; }); while(h.length<3) h.push({data:null, venda:null, acerto:null}); return h; };
      var temVendas = function(i){ return (i.vendas||[]).length>0; };
      var jaR = s.revInternas||[], chv = {}; jaR.forEach(function(r){ chv[nm(r.nome)] = 1; if(r.devmaster) chv["c"+sz(r.devmaster)] = 1; });
      var porItem = {}; (a.itens||[]).forEach(function(i){ porItem[codI(i)] = i; });
      var atualizadas = 0;
      // Registro de contatos da Tamara: as linhas de "Obs. Gerais" das condicionais (DevMaster) viram histórico (origem devmaster, refeito a cada busca); os contatos digitados aqui (origem sistema) ficam.
      // A data marcada que está escrita ("AGENDADO PARA DIA 28/11 ÀS 08H") entra como Data agendada, só se a agendadora ainda não marcou outra; a situação só muda para quem ainda está em "A contatar" ou "Entrei em contato".
      var hojeRI = isoDeRI(new Date());
      var registroDe = function(r, i){
        var dm = parseObs(i.obs||[], hojeRI), meus = ((r && r.registro)||[]).filter(function(c){ return c.origem==="sistema"; });
        var reg = meus.concat(dm).sort(function(x,y){ return (y.data||"").localeCompare(x.data||""); }), ag = agendadoDe(reg), patch = {registro:reg};
        if(ag && ag.data>=hojeRI && (!r || !r.agend || r.agend.fonte==="devmaster")) patch.agend = {data:ag.data, hora:ag.hora, fonte:"devmaster"};
        if(!r || r.situacao==="contatar" || r.situacao==="contato") patch.situacao = situacaoDoRegistro(reg, hojeRI);
        if(i.conds) patch.conds = i.conds;   // condicionais ativas (número, tipo, peças, valor, previsão) para o card
        return patch;
      };
      var jaN = jaR.map(function(r){ var i = r.devmaster && porItem[sz(r.devmaster)]; if(!i) return r;
        var patch = registroDe(r, i), tv = temVendas(i);
        if(tv){ patch.hist = histDe(i).map(function(x){ var o = (r.hist||[]).find(function(y){ return y && y.data===x.data && y.acerto!=null; }); return o ? Object.assign({}, x, {acerto:o.acerto}) : x; }); patch.fonteVendas = "devmaster"; }
        patch.proximoDm = i.prevDevol || r.proximoDm || null; atualizadas++;
        return Object.assign({}, r, patch); });
      var novosR = (a.itens||[]).filter(function(i){ var c = codI(i); if(chv["c"+c] || chv[nm(i.nome)]) return false; chv["c"+c] = 1; chv[nm(i.nome)] = 1; return true; }).map(function(i){
        // ciclo = plano mais próximo (30, 45 ou 60) da distância entre a emissão do kit e a previsão de devolução; a data real é a da DevMaster (proximoDm), que já tem fim de semana
        var dias = i.emissao && i.prevDevol ? Math.round((new Date(i.prevDevol+"T12:00:00") - new Date(i.emissao+"T12:00:00"))/86400000) : 0;
        var ciclo = [30,45,60].reduce(function(m, c){ return !dias || Math.abs(c-dias)<Math.abs(m-dias) ? c : m; }, 30);
        return Object.assign({id:"RD"+codI(i), nome:i.nome, ciclo:ciclo, proximoManual:null, proximoDm:i.prevDevol || null, situacao:"contatar", agend:null, internoId:null, hist:histDe(i), fonteVendas:"devmaster",
          contatos:i.celular ? [{nome:"WhatsApp da revendedora", fone:i.celular}] : [], prata:false, devmaster:String(i.cod || i.codigo), cidade:i.cidade || "", obs:""}, registroDe(null, i)); });
      return com(s, {revInternas:jaN.concat(novosR)}, novosR.length+(novosR.length===1 ? " revendedora nova" : " revendedoras novas")+(atualizadas ? " · "+atualizadas+" com vendas atualizadas" : "")+" da DevMaster ("+(a.itens||[]).length+" encontradas)");
    }
    // Kit novo que a Michele direcionou para a Sorelly (atendimento interno): entra na lista da Tamara como A contatar, com a marca Kit novo; ela entra em contato e agenda.
    case "REVINT_KIT_NOVO": {
      var nmK = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
      var jaK = (s.revInternas||[]).find(function(r){ return nmK(r.nome)===nmK(a.nome); });
      var marca = {id:a.kitId||"", valor:a.valor||0, desde:isoDeRI(new Date())};
      if(jaK) return com(s, {revInternas:s.revInternas.map(function(r){ return r===jaK ? Object.assign({}, r, {kitNovo:marca}) : r; })}, a.nome+" marcada como kit novo na lista do atendimento interno");
      var novaK = {id:"KN"+(a.kitId||Date.now()), nome:a.nome, ciclo:30, proximoManual:null, proximoDm:null, situacao:"contatar", agend:null, internoId:null, hist:[{data:null,venda:null,acerto:null},{data:null,venda:null,acerto:null},{data:null,venda:null,acerto:null}],
        contatos:a.celular ? [{nome:"WhatsApp da revendedora", fone:a.celular}] : [], prata:false, devmaster:"", cidade:a.cidade||"", obs:"", registro:[], conds:[], kitNovo:marca};
      return com(s, {revInternas:[novaK].concat(s.revInternas||[])}, a.nome+" (kit novo) entrou na lista do atendimento interno");
    }
    // contato registrado pela agendadora (cadastro da revendedora, vale para todas as condicionais dela); só os digitados aqui (origem sistema) podem ser apagados
    // REGISTRO ESTRUTURADO da agendadora (tipo e motivo em caixas): a.tipo, a.motivo, a.quem (quem falou com ela), a.por (conta logada), a.autorizado, a.isenta, a.dia, a.hora, a.ciclo, a.texto.
    // Efeitos: marcado/remarcado com dia e hora marcam a data (e mudam a agenda da Atendimento Sorelly se ela já está lá); não veio e desmarcado tiram a data e a agenda;
    // remarcado/não veio/desmarcado entram na escada de multa 5/8/15 (isenta não conta); mudou o ciclo troca o ciclo.
    case "REVINT_REG": {
      var rg = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!rg || !a.tipo) return s;
      var hojeRg = isoDeRI(new Date()), agoraRg = Date.now(), tpMulta = a.tipo==="remarcado" || a.tipo==="nao_veio" || a.tipo==="desmarcado", comDia = (a.tipo==="marcado" || a.tipo==="remarcado") && a.dia;
      var ent = {data:hojeRg, tipo:a.tipo, motivo:a.motivo||"", quem:a.quem||a.por||"", por:a.por||"", autor:a.quem||a.por||"", autorizado:a.autorizado||"", isenta:tpMulta && !!a.isenta, dia:comDia ? a.dia : "", hora:comDia ? (a.hora||"08:00") : "", ciclo:a.tipo==="ciclo" ? Number(a.ciclo)||0 : 0, texto:String(a.texto||"").trim(), origem:"sistema", ts:agoraRg};
      var patchRg = {registro:[ent].concat(rg.registro||[])}, intsRg = s.internos||[], exRg = intsRg.find(function(x){ return x.id===rg.internoId && x.status!=="acertado"; });
      if(comDia){ patchRg.agend = {data:ent.dia, hora:ent.hora}; patchRg.situacao = "agendada"; if(exRg) intsRg = intsRg.map(function(x){ return x.id!==exRg.id ? x : Object.assign({}, x, {data:ent.dia, hora:ent.hora}); }); }
      if(a.tipo==="nao_veio" || a.tipo==="desmarcado"){ patchRg.agend = null; patchRg.situacao = "contato"; if(exRg && exRg.status==="agendado"){ intsRg = intsRg.filter(function(x){ return x.id!==exRg.id; }); patchRg.internoId = null; } }
      if(tpMulta && exRg && exRg.status==="agendado" && a.tipo==="remarcado") intsRg = intsRg.map(function(x){ return x.id!==exRg.id ? x : Object.assign({}, x, {remarcacoesLista:(x.remarcacoesLista||[]).concat([{isenta:ent.isenta, motivo:ent.isenta ? (ent.motivo||ent.autorizado||"autorizada") : "", em:agoraRg}])}); });
      if(a.tipo==="ciclo" && ent.ciclo){ patchRg.ciclo = ent.ciclo; patchRg.proximoManual = null; }
      if(a.tipo==="contato" || a.tipo==="t1" || a.tipo==="t2" || a.tipo==="t3" || a.tipo==="quer_vir") if(rg.situacao==="contatar") patchRg.situacao = "contato";
      return com(s, {internos:intsRg, revInternas:(s.revInternas||[]).map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, patchRg); })}, rg.nome.split(" ")[0]+": registro salvo");
    }
    // histórico completo da DevMaster (todas as condicionais da revendedora, também as já fechadas): refaz só as linhas de origem devmaster; os registros feitos aqui ficam
    case "REVINT_HIST_DM": {
      var rh = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!rh) return s;
      var dmH = parseObs(a.obs||[], isoDeRI(new Date())), meusH = (rh.registro||[]).filter(function(c){ return c.origem==="sistema"; });
      var regH = meusH.concat(dmH).sort(function(x,y){ return (y.data||"").localeCompare(x.data||""); });
      return com(s, {revInternas:(s.revInternas||[]).map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, {registro:regH, histDmEm:Date.now()}); })});
    }
    // regras novas enviadas (PDF GUIA-DA-REVENDEDORA): registra o envio e carimba a revendedora com a versão em vigor; o PRÓXIMO acerto dela já usa as regras novas
    case "REVINT_REGRAS_ENVIAR": {
      var rn = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!rn) return s;
      var vigN = versaoDaEntrega(s); if(!vigN) return s;
      var entN = {data:isoDeRI(new Date()), tipo:"regras", motivo:"", quem:a.quem||a.por||"", por:a.por||"", autor:a.quem||a.por||"", autorizado:"", isenta:false, dia:"", hora:"", ciclo:0, texto:"Regras e comissões novas enviadas (guia da revendedora)", origem:"sistema", ts:Date.now()};
      var prN = Object.assign({}, s.perfisRev||{}); prN[rn.nome] = Object.assign({}, prN[rn.nome], {regrasEntregaId:vigN.id, regrasEntregaEm:isoDeRI(new Date())});
      return com(s, {perfisRev:prN, revInternas:(s.revInternas||[]).map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, {registro:[entN].concat(r.registro||[]), regrasEnviadas:{em:isoDeRI(new Date()), por:a.por||"", versaoId:vigN.id}}); })}, rn.nome.split(" ")[0]+": regras novas registradas");
    }
    case "REVINT_CONTATO_DEL": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, {registro:(r.registro||[]).filter(function(c){ return !(c.origem==="sistema" && c.ts===a.ts); })}); })});
    case "REVINT_SET": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, a.patch); })});
    // ── Avisos: quem recebe cada alerta (Tecnologia → Avisos) e os alertas disparados (um por chave) ──
    case "AVISO_CFG": return com(s, {avisosCfg:Object.assign({}, s.avisosCfg||{}, {[a.tipo]:a.ids})});
    case "ALERTA_ADD": {
      if((s.alertas||[]).some(function(x){ return x.chave===a.chave; })) return s;
      return com(s, {alertas:[{id:"AL"+agora, tipo:a.tipo, chave:a.chave, ref:a.ref||null, titulo:a.titulo||"", texto:a.texto, para:a.para || destinosDe(s, a.tipo), aba:a.aba||null, cor:a.cor||null, ts:agora, lidoPor:[]}].concat(s.alertas||[]).slice(0,200)});
    }
    case "ALERTA_LIDO": return com(s, {alertas:(s.alertas||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {lidoPor:(x.lidoPor||[]).concat([a.usuario])}); })});
    // agendar uma revendedora interna cria (ou atualiza) o atendimento dela na agenda da Atendimento Sorelly
    case "REVINT_AGENDAR": {
      var rr = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!rr || !a.data || !a.hora) return s;
      if(motivoNaoMarcar(s.revInternas, a.data, a.hora, rr.id)) return s;   // regras da agenda: 3 por horário, 15 por dia, sábado até 11h, domingo fechado
      var rrN = Object.assign({}, rr, {agend:{data:a.data, hora:a.hora}, situacao:"agendada"});
      var exI = (s.internos||[]).find(function(x){ return x.id===rr.internoId && x.status!=="acertado"; }), vigR = versaoVigente(s), intsR;
      if(exI){ intsR = s.internos.map(function(x){ return x.id!==exI.id ? x : Object.assign({}, x, {data:a.data, hora:a.hora}); }); }
      else { var itR = internoDeAgendada(rrN, vigR ? vigR.id : null, agora, {remarcacoesLista:remarcacoesDoCiclo(rr.registro, (rr.hist && rr.hist[0] && rr.hist[0].data) || null, isoDeRI(new Date())).map(function(c){ return {isenta:!!c.isenta, motivo:c.isenta ? (c.motivo||c.autorizado||"autorizada") : "", em:Date.parse((c.data||isoDeRI(new Date()))+"T12:00:00")}; })}); rrN.internoId = itR.id; intsR = [itR].concat(s.internos||[]); }
      return com(s, {internos:intsR, revInternas:s.revInternas.map(function(r){ return r.id!==a.id ? r : rrN; })}, rr.nome.split(" ")[0]+" agendada para "+a.data.split("-").reverse().join("/")+" às "+a.hora);
    }
    // Atender uma agendada que ainda só existe na lista da Tamara (veio da DevMaster): cria o atendimento com as condicionais REAIS dela e a média pelas últimas vendas
    case "REVINT_ATENDER": {
      var ra = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!ra || !ra.agend) return s;
      if((s.internos||[]).some(function(x){ return x.id===ra.internoId; })) return s;
      var vigA = versaoVigente(s), itA = internoDeAgendada(ra, vigA ? vigA.id : null, Date.now(), {id:a.internoId, obs:"Agendada pela Tamara (DevMaster)",
        condicionais:(ra.conds||[]).filter(function(c){ return c.t!=="Expositor"; }).map(function(c){ return {numero:String(c.n||""), valor:c.v||0, pecas:c.p||0}; }),
        vendasAnt:[ra.hist && ra.hist[0] && ra.hist[0].venda, ra.hist && ra.hist[1] && ra.hist[1].venda].filter(function(v){ return v>0; }), tipo:ra.kitNovo ? "kit_novo" : "acerto"});
      return com(s, {internos:[itA].concat(s.internos||[]), revInternas:s.revInternas.map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, {internoId:itA.id}); })});
    }
    case "REVINT_CANCELAR": {
      var rc = (s.revInternas||[]).find(function(r){ return r.id===a.id; }); if(!rc) return s;
      return com(s, {internos:(s.internos||[]).filter(function(x){ return !(x.id===rc.internoId && x.status==="agendado"); }),
        revInternas:s.revInternas.map(function(r){ return r.id!==a.id ? r : Object.assign({}, r, {agend:null, internoId:null, situacao:"contato"}); })});
    }
    // histórico de vendas da revendedora: sem limite, sempre do mais novo para o mais antigo
    case "REVINT_VENDA_ADD": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ if(r.id!==a.id) return r;
      var hs = r.hist.filter(function(h){ return h.data || h.venda!=null; }).concat([{data:a.data, venda:a.venda, acerto:a.acerto==null ? null : a.acerto}]).sort(function(x,y){ return (y.data||"").localeCompare(x.data||""); });
      while(hs.length<3) hs.push({data:null, venda:null, acerto:null}); return Object.assign({}, r, {hist:hs}); })}, "Venda anterior registrada");
    // editar uma linha do histórico (data, venda ou acerto): o que veio vazio da planilha a funcionária completa aqui
    case "REVINT_VENDA_SET": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ if(r.id!==a.id) return r;
      var hs = r.hist.map(function(h, i){ return i!==a.idx ? h : Object.assign({}, h, a.patch); });
      return Object.assign({}, r, {hist:hs}); })});
    case "REVINT_VENDA_ORDENAR": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ if(r.id!==a.id) return r;   // ao terminar a edição: do mais novo para o mais antigo
      var hs = r.hist.filter(function(h){ return h.data || h.venda!=null || h.acerto!=null; }).sort(function(x,y){ return (y.data||"").localeCompare(x.data||""); });
      while(hs.length<3) hs.push({data:null, venda:null, acerto:null}); return Object.assign({}, r, {hist:hs}); })});
    case "REVINT_VENDA_DEL": return com(s, {revInternas:(s.revInternas||[]).map(function(r){ if(r.id!==a.id) return r;
      var hs = r.hist.filter(function(h, i){ return i!==a.idx; }); while(hs.length<3) hs.push({data:null, venda:null, acerto:null}); return Object.assign({}, r, {hist:hs}); })});
    case "REVINT_ATENDIDA": return com(s, {revInternas:(s.revInternas||[]).map(function(r){
      if(r.id!==a.id) return r;
      // acerto feito: a data do atendimento vira o "último acerto" e a próxima data é recalculada pelo ciclo; valores chegam do atendimento
      var dia = (r.agend && r.agend.data) || isoDia(new Date(agora));
      return Object.assign({}, r, {hist:[{data:dia, venda:null, acerto:null}].concat(r.hist), proximoManual:null, agend:null, situacao:"contatar"}); })}, "Acerto registrado: próxima data recalculada");
    case "INT_ABRIR": return com(s, {aba:"intcalc", intSel:a.id});
    // até 2 atendimentos abertos ao mesmo tempo (abas): abrir um terceiro troca a aba que está ativa
    case "INT_SEL": {
      var abI = (s.intAbas||[]).slice();
      if(a.id!=null && abI.indexOf(a.id)<0){ if(abI.length<2) abI.push(a.id); else { var ixI = abI.indexOf(s.intSel); abI[ixI>=0 ? ixI : 1] = a.id; } }
      return com(s, {intSel:a.id, intAbas:abI});
    }
    case "INT_FECHAR_ABA": {
      var abF = (s.intAbas||[]).filter(function(x){ return x!==a.id; });
      return com(s, {intAbas:abF, intSel:s.intSel===a.id ? (abF[0]||null) : s.intSel});
    }
    // Finalizar a bipagem: marca a hora e calcula quanto durou o atendimento (início = "Iniciar atendimento"). Também grava no acerto do Consolidado.
    case "INT_FINALIZAR": {
      var itF = (s.internos||[]).find(function(x){ return x.id===a.id; }); if(!itF || itF.fimTs) return s;
      var hhmm = function(t){ var n = new Date(t); return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0"); };
      var iniF = itF.inicioTs || null, patchF = {fimTs:agora, fim:hhmm(agora)};
      return com(s, {internos:s.internos.map(function(x){ return x.id===a.id ? Object.assign({}, x, patchF) : x; }),
        acertosConsignado:(s.acertosConsignado||[]).map(function(r){ return r.internoId===a.id ? Object.assign({}, r, {inicioTs:iniF, fimTs:agora}) : r; })},
        "Bipagem finalizada"+(iniF ? ": atendimento durou "+Math.max(1, Math.round((agora-iniF)/60000))+" min" : ""));
    }
    case "INT_ATUALIZAR":
      return com(s, {internos:(s.internos||[]).map(function(x){ return x.id===a.id ? Object.assign({}, x, a.patch) : x; })});
    // Pagamentos do atendimento interno enviados ao financeiro (Visão geral): a funcionária só informa forma e valor,
    // quem define a conta e confere é a diretoria/Ana Maria. Um lançamento por atendimento; reenviar mantém o que não mudou.
    case "FIN_ENVIAR": {
      var antF = (s.lancFin||[]).find(function(x){ return x.internoId===a.internoId; });
      var linhasF = a.linhas.map(function(l){ var igual = antF && antF.linhas.find(function(o){ return o.tipo===l.tipo && o.forma===l.forma && o.valor===l.valor; });
        return igual ? igual : Object.assign({isento:false}, l); });
      var chavePagF = function(ls){ return JSON.stringify(ls.filter(function(l){ return l.tipo==="pagamento"; }).map(function(l){ return [l.forma, l.valor]; })); };
      var mesmosPag = !!antF && chavePagF(linhasF)===chavePagF(antF.linhas);          // se os pagamentos não mudaram, a etapa dos comprovantes continua valendo
      var novoF = {id:"LF"+a.internoId, internoId:a.internoId, nome:a.nome, enviadoTs:agora, por:a.por||"", resumo:a.resumo || (antF && antF.resumo) || null, linhas:linhasF, etapaComprovantes:mesmosPag && !!antF.etapaComprovantes, finalizado:false, conferido:false};
      novoF = pxAplicar(s.px, novoF, s.lancFin);   // dinheiro, maquininha única e Pix com conta decidida pelas regras já entram resolvidos
      return com(s, {lancFin:antF ? (s.lancFin||[]).map(function(x){ return x.internoId===a.internoId ? novoF : x; }) : [novoF].concat(s.lancFin||[])}, "Enviado ao financeiro: "+a.nome);
    }
    case "FIN_ETAPA": {
      return com(s, {lancFin:(s.lancFin||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, a.patch); })});
    }
    case "FIN_LINHA": {
      return sincContasRep(com(s, {lancFin:(s.lancFin||[]).map(function(x){ if(x.id!==a.id) return x;
        var linhas = x.linhas.map(function(l,i){ return i===a.i ? Object.assign({}, l, a.patch, a.patch && a.patch.partes ? {manual:true} : null) : l; });
        x = pxAplicar(s.px, Object.assign({}, x, {linhas:linhas}), s.lancFin); linhas = x.linhas;   // definida a conta do link/cartão, o Pix da mesma venda se resolve sozinho
        if(x.origem==="rep" || x.origem==="func") linhas = linhas.map(function(l){ return l.tipo==="pagamento" && !l.isento && contasDefinidas(l) && !l.enviada ? Object.assign({}, l, {enviada:true}) : l; });   // pedido da representante: definiu a conta, ela já vê (sem o "OK, enviar")
        return Object.assign({}, x, {linhas:linhas, conferido:!!x.finalizado && lancamentoConferido(linhas), conferidoPor:a.por||x.conferidoPor});
      })}));
    }
    // Representante pede a conta de um pagamento do acerto (só forma + valor): sobe na hora no Controle de pagamentos, o app dela não espera
    case "REP_PAG": {
      if(a.op==="pedir"){ if(!a.kitId || !a.pid || !(a.valor>0)) return s;
        return sincContasRep(com(s, {lancFin:repPedirConta(s.lancFin, s.px, a, agora)}, "Conta solicitada ao financeiro: "+BK(a.valor))); }
      if(a.op==="remover") return com(s, {lancFin:repRemoverPedido(s.lancFin, a.kitId, a.pid)});
      return s;
    }
    case "INT_REMOVER":
      return com(s, {internos:(s.internos||[]).filter(function(x){ return x.id!==a.id; })}, "Atendimento removido da agenda");
    case "INT_REMARCAR":
      return com(s, {internos:(s.internos||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {remarcacoesLista:(x.remarcacoesLista||[]).concat([{isenta:!!a.isenta, motivo:a.isenta ? (a.motivo||"") : "", em:agora}])}); })});
    case "INT_REMARCAR_REMOVER":
      return com(s, {internos:(s.internos||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {remarcacoesLista:(x.remarcacoesLista||[]).filter(function(r,i){ return i!==a.indice; })}); })});
    case "INT_ACERTO_REGISTRAR": {
      var it = (s.internos||[]).find(function(x){ return x.id===a.id; }); if(!it) return s;
      var vBase = (s.regrasConsignado.versoes||[]).find(function(v){ return v.id===it.regrasVersaoId; }) || versaoVigente(s); if(!vBase) return s;
      var modI = a.modalidade || modalidadeDe(s, it.nome), vEf = versaoEfetiva(vBase, modI);
      var abI = abaterDividas(s, it.nome, a.pagamentos, null);
      var resI = calcularAcerto({vendaBruta:a.vendaBruta, devolvida:0, garantia:a.garantia||0, vez:vezCobravel(it.remarcacoesLista),
        valorPago:(a.valorPago||0) > abI.pago+0.009 ? a.valorPago : Math.max(0, (a.valorPago||0)-abI.total), atrasoDias:(modI==="prata" || vEf.novas) ? (a.atrasoDias||0) : 0, diasQuitacao:a.diasQuitacao||0, semTaxa:true}, vEf);
      if(a.recusouNegociar) resI = Object.assign({}, resI, {brindeNormal:0, brindeSelect:0, fatorPagamento:0});
      var regI = Object.assign({id:"AC"+agora, internoId:it.id, rev:it.nome, rep:"Atendimento interno", origem:"interno", tipo:"acerto",
        data:new Date(agora).toISOString().slice(0,10), regrasVersaoId:vBase.id, modalidade:modI, atrasoDias:a.atrasoDias||0, diasQuitacao:a.diasQuitacao||0, abatidoDivida:abI.total, regrasNovas:vEf.novas ? copiaNovas(vEf.novas) : null, hora:new Date(agora).toTimeString().slice(0,5), vendaBruta:a.vendaBruta, garantia:a.garantia||0, pecasCond:a.pecasCond||0,
        reagendamentos:(it.remarcacoesLista||[]).length, formSnapshot:a.formSnapshot||null, recebimento:null,
        pecasVendidas:a.pecasVendidas||null, pecasBrinde:a.pecasBrinde||null, pecasTrocas:a.pecasTrocas||null, pecasADevolver:a.pecasADevolver!=null ? a.pecasADevolver : null,
        condicionaisSelecionadas:a.condicionaisSelecionadas||[], pagamentos:a.pagamentos||[], acordo:a.acordo||null, recusouNegociar:!!a.recusouNegociar,
        brindesLancados:a.brindesLancados||[], excedenteBrinde:a.excedenteBrinde||0, pecasProxCodigos:a.pecasProxCodigos||[], pecasProxLiberadas:a.pecasProxLiberadas||0,
        kitNovoOk:!!a.kitNovoOk, expositoresMarcados:a.expositoresMarcados||[], assinatura:a.assinatura||null, regrasLidas:!!a.regrasLidas, por:a.por||"", inicioTs:it.inicioTs||null, fimTs:it.fimTs||null}, resI);
      // termo assinado: fica na ficha da revendedora (quando ela voltar no mês seguinte, aparece que leu, confirmou e assinou)
      var prT = Object.assign({}, s.perfisRev||{}); prT[it.nome] = Object.assign({}, prT[it.nome], {termoConsignado:{ts:agora, assinatura:a.assinatura||null, regras:a.regrasPassadas||[], versaoId:vBase.id, por:a.por||"", origem:"interno"}}, a.kitNovoOk && versaoDaEntrega(s) ? {regrasEntregaId:versaoDaEntrega(s).id, regrasEntregaEm:hojeIso()} : {});
      return com(s, {perfisRev:prT, internos:(s.internos||[]).map(function(x){ return x.id!==a.id ? x : Object.assign({}, x, {status:"acertado", acerto:resI, acertoAssinado:!!a.assinatura, formSnapshot:a.formSnapshot||null, bipou:a.bipou||x.bipou||"", atendeu:x.atendeu||a.por||"", kitNovo:!!a.kitNovoOk, continua:a.continuidade||"", novaCond:a.novaCond||"", vendaApp:a.vendaBruta||0}); }),
        acertosConsignado:[regI].concat(aplicarAbatimento(s.acertosConsignado||[], abI, (a.pagamentos||[])[0], regI.id, agora))},
        "Acerto de "+it.nome+" registrado: "+BK(resI.valorAcerto)+" (comissão "+BK(resI.comissao)+")");
    }
    // Reposição ou expositor: nunca passa pela tabela de faixas, comissão fixa (kit) ou manual (reposição especial).
    case "REPOSICAO_ENTREGAR": {
      k = kitDe(s, a.id); if(!k) return s;
      var comissaoFixa = a.especial ? (a.comissaoManual||0) : ((s.comis||{}).reposicao!=null ? s.comis.reposicao : 15);   // R$ 15 por reposição entregue (Configurador de comissões)
      var registroRep = {id:"AC"+agora, kitId:k.id, rev:k.rev, rep:(function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l?l.rep:null; })(),
        tipo: a.especial ? "reposicao_especial" : "reposicao", tipoKit:"reposicao", data:new Date(agora).toISOString().slice(0,10), comissao:comissaoFixa, valorAcerto:0, vendaLiquida:0,
        hora:new Date(agora).toTimeString().slice(0,5), pagamentos:[], condicionaisSelecionadas:condicionaisDoKit(k).map(function(c){ return c.numero; }), recebimento:null};
      // a condicional assinada entregue na reposição sobe nas condicionais em aberto da revendedora
      var prR = Object.assign({}, s.perfisRev||{}), perR = Object.assign({}, prR[k.rev]||{}), abR = (perR.condicionaisAbertas||[]).slice();
      condicionaisDoKit(k).forEach(function(c){ if(!abR.some(function(x){ return x.numero===c.numero; })) abR.push({numero:c.numero, pecas:totaisDe(c).pecas}); });
      perR.condicionaisAbertas = abR; prR[k.rev] = perR;
      return com(s, {perfisRev:prR, acertosConsignado:[registroRep].concat(s.acertosConsignado||[]), kits: mapKit(s, a.id, function(){ return {reposicaoEntregue:true, comissaoFixa:comissaoFixa, status:"acertado"}; })},
        "Reposição de "+k.rev+" entregue"+(comissaoFixa ? " · comissão "+BK(comissaoFixa) : ""));
    }
    // Entrega de kit novo pela representante: condicionais enviadas, conferência das peças (divergência), regras lidas uma a uma
    // e assinatura digital da revendedora. Fica gravado no kit e no consolidado do consignado.
    case "KITNOVO_ENTREGAR": {
      k = kitDe(s, a.id); if(!k) return s;
      var regEntrega = {id:"KN"+agora, kitId:k.id, rev:k.rev, rep:(function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l?l.rep:null; })(),
        tipo:"kit_novo_entrega", tipoKit:k.tipoKit||"kit_novo", data:new Date(agora).toISOString().slice(0,10), condicionais:a.condicionais||[], pecasTotal:a.pecasTotal||0,
        pecasFaltaram:a.pecasFaltaram||0, obsDivergencia:a.obsDivergencia||"", regrasLidas:a.regrasLidas||[], assinatura:a.assinatura||null};
      return com(s, {perfisRev:carimboEntrega(s, k.rev), kits: mapKit(s, a.id, function(){ return {kitNovoEntregue:regEntrega, status:"acertado"}; }),
        montadoras: (regEntrega.pecasFaltaram>0 && k.montId) ? ajustaDiv(s, k.montId, 1) : s.montadoras,
        acertosConsignado:[regEntrega].concat(s.acertosConsignado||[])},
        "Kit novo de "+k.rev+" entregue e assinado"+(regEntrega.pecasFaltaram ? " · "+regEntrega.pecasFaltaram+" peça(s) em falta" : ""));
    }
    // Entrega do kit novo feita junto (app da representante + app da revendedora): a representante inicia; cada etapa só libera a próxima com o check das DUAS.
    case "KN_ENT_INICIAR": {
      k = kitDe(s, a.kitId); if(!k) return s;
      var entAtual = s.entregasKN || {};
      if(entAtual[k.id]) return s;
      var repKN = (function(){ var l = s.listagens.find(function(x){return x.id===k.lid;}); return l ? l.rep : null; })();
      var novaEnt = {};
      novaEnt[k.id] = {kitId:k.id, rev:k.rev, rep:repKN, inicio:agora, montou:k.montId ? nomeDe(k.montId) : null, bipou:k.bipId ? nomeDe(k.bipId) : null,   // fica salvo quem montou e quem bipou o kit
        checks:{}, semCelular:false, temExpositor:false, fotoExpositor:null, assinatura:null, status:"andamento"};
      return com(s, {entregasKN:Object.assign({}, entAtual, novaEnt)}, "Entrega do kit novo de "+k.rev+" iniciada");
    }
    case "KN_ENT_CHECK": {
      var entC = (s.entregasKN||{})[a.kitId]; if(!entC || entC.status==="concluida") return s;
      if(a.n > passoAtual(entC)) return s;                       // não dá para marcar uma etapa à frente
      var chN = Object.assign({}, entC.checks[a.n]); chN[a.quem] = chN[a.quem] ? null : agora;
      var chTodos = Object.assign({}, entC.checks); chTodos[a.n] = chN;
      var entN = {}; entN[a.kitId] = Object.assign({}, entC, {checks:chTodos});
      return com(s, {entregasKN:Object.assign({}, s.entregasKN, entN)}, null);
    }
    case "KN_ENT_SEMCEL": {
      var entS = (s.entregasKN||{})[a.kitId]; if(!entS) return s;
      var entSN = {}; entSN[a.kitId] = Object.assign({}, entS, {semCelular:!!a.v});
      return com(s, {entregasKN:Object.assign({}, s.entregasKN, entSN)}, a.v ? "Revendedora sem celular: confirmação só pela representante" : null);
    }
    case "KN_ENT_EXPOSITOR": {
      var entE = (s.entregasKN||{})[a.kitId]; if(!entE) return s;
      var entEN = {}; entEN[a.kitId] = Object.assign({}, entE, {temExpositor:!!a.v, fotoExpositor:a.v ? entE.fotoExpositor : null});
      return com(s, {entregasKN:Object.assign({}, s.entregasKN, entEN)}, null);
    }
    case "KN_ENT_FOTO": {
      var entP = (s.entregasKN||{})[a.kitId]; if(!entP) return s;
      var entPN = {}; entPN[a.kitId] = Object.assign({}, entP, {fotoExpositor:a.foto, fotoNome:a.nome||"", fotoEm:agora});
      return com(s, {entregasKN:Object.assign({}, s.entregasKN, entPN)}, "Foto do expositor anexada");
    }
    // Conferência das peças com a câmera (kit novo e acerto + kit): liberar → começar a bipar → bipar cada peça → finalizar. O que faltou ou veio
    // a mais sobe como ERRO de quem bipou o kit na empresa (Consolidado, Listagem, desconto da bipadora e histórico da revendedora).
    case "CONF_LIBERAR": case "CONF_INICIAR": case "CONF_REINICIAR": {
      var cb0 = Object.assign({}, s.confBip||{}), anC = cb0[a.kitId] || {};
      if(a.type==="CONF_LIBERAR") cb0[a.kitId] = Object.assign({}, anC, {lib:agora});
      else if(a.type==="CONF_INICIAR") cb0[a.kitId] = Object.assign({}, anC, {ini:agora, lidos:{}, erros:[], ultimo:null});
      else delete cb0[a.kitId];
      return com(s, {confBip:cb0}, a.type==="CONF_LIBERAR" ? "Kit liberado: pode começar a bipar" : null);
    }
    case "CONF_BIPAR": {
      var kB = kitDe(s, a.kitId), cfB = (s.confBip||{})[a.kitId]; if(!kB || !cfB || !cfB.ini || cfB.fim) return s;
      var cbB = Object.assign({}, s.confBip); cbB[a.kitId] = biparConf(condicionaisDoKit(kB), cfB, a.codigo);
      return com(s, {confBip:cbB}, null);
    }
    case "CONF_FINALIZAR": {
      var kF = kitDe(s, a.kitId), cfF = (s.confBip||{})[a.kitId]; if(!kF || !cfF || !cfF.ini || cfF.fim) return s;
      var resF = resultadoConf(condicionaisDoKit(kF), cfF), lF = s.listagens.find(function(x){ return x.id===kF.lid; });
      var regF = {id:"EB"+agora, kitId:kF.id, rev:kF.rev, rep:lF ? lF.rep : "", data:isoDia(new Date(agora)), em:agora, bipId:kF.bipId||null, bipadora:kF.bipId ? nomeDe(kF.bipId) : "—",
        montadora:kF.montId ? nomeDe(kF.montId) : "—", condicionais:resF.conds, esperadas:resF.esperadas, lidas:resF.lidas, faltas:resF.faltas, nFaltas:resF.nFaltas, sobras:resF.sobras, nSobras:resF.nSobras, erros:resF.erros};
      var cbF = Object.assign({}, s.confBip); cbF[a.kitId] = Object.assign({}, cfF, {fim:agora, resultado:resF});
      var pF = Object.assign({}, s.perfisRev), perfF = Object.assign({}, pF[kF.rev]);
      perfF.conferenciasKit = [{em:agora, erros:resF.erros, faltas:resF.nFaltas, sobras:resF.nSobras, bipadora:regF.bipadora}].concat(perfF.conferenciasKit||[]); pF[kF.rev] = perfF;
      return com(s, {confBip:cbF, perfisRev:pF,
        errosBipagem:resF.erros>0 ? [regF].concat(s.errosBipagem||[]) : (s.errosBipagem||[]),
        kits:resF.erros>0 ? s.kits.map(function(x){ return x.id===kF.id ? Object.assign({}, x, {errosBip:(x.errosBip||0)+resF.erros, erroBipId:regF.id}) : x; }) : s.kits},
        resF.erros>0 ? "Conferência registrada: "+resF.erros+" erro(s) de bipagem de "+regF.bipadora : "Conferência concluída sem erros");
    }
    case "KN_ENT_CONCLUIR": {
      var entF = (s.entregasKN||{})[a.kitId]; if(!entF) return s;
      var entFN = {}; entFN[a.kitId] = Object.assign({}, entF, {assinatura:a.assinatura||"assinado", status:"concluida", fim:agora});
      var kEntF = kitDe(s, a.kitId);
      return com(s, {entregasKN:Object.assign({}, s.entregasKN, entFN), perfisRev:kEntF ? carimboEntrega(s, kEntF.rev) : s.perfisRev}, null);
    }
    // Formas de pagamento editáveis (Representantes → Configurações): nome, se pede parcelas e a lista de descrições.
    case "FORMAS_PAGAMENTO_SET": return com(s, {formasPagamento:a.formas}, "Formas de pagamento atualizadas");
    // Nova versão das regras de comissão/brinde/remarcação: só vale a partir do próximo kit criado (kits em aberto mantêm a regra antiga carimbada).
    case "REGRAS_CONSIGNADO_ATUALIZAR": {
      var atualAntes = versaoVigente(s);
      var novaV = novaVersaoRegras(a.campos, atualAntes ? atualAntes.id : null);
      if(novaV.novas && novaV.vigenciaDesde < "2026-10-27") novaV.vigenciaDesde = "2026-10-27";   // as regras novas só valem para kits entregues a partir dessa data
      return com(s, {regrasConsignado:{versoes:(s.regrasConsignado.versoes||[]).concat([novaV]), atualId:novaV.id}},
        "Regras do consignado atualizadas: vale a partir do próximo kit de cada revendedora");
    }
    // Modelo do papel da condicional (Revendedoras › Condicional): guarda o texto de cada peça (cab, termo, nota, acerto) e o histórico das versões anteriores.
    case "CONDICIONAL_MODELO_SALVAR": {
      var cmA = s.condicionalModelo || MODELO_PADRAO;
      var cmH = (cmA.historico||[]).concat([{ts:Date.now(), por:a.por||"", campo:a.campo, texto:cmA[a.campo]}]).slice(-40);
      var cmN = Object.assign({}, cmA, {historico:cmH}); cmN[a.campo] = a.texto;
      return com(s, {condicionalModelo:cmN}, "Condicional: texto salvo");
    }
    case "PECAS": {
      var cp = JSON.parse(JSON.stringify(s.cfg)); if(a.max){ var lk = cp.pecasKit[a.i]; lk.qmax = lk.qmax || {}; lk.qmax[a.j] = a.valor; } else cp.pecasKit[a.i].q[a.j] = a.valor; return com(s, {cfg:cp});
    }
    case "RESET": try{ localStorage.removeItem(CHAVE); }catch(x){} return com(novo(), {}, "Dados de demonstra\u00e7\u00e3o restaurados");
    default: return s;
  }
}

export { reducer };

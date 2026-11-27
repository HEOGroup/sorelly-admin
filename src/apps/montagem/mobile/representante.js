// Sorelly Admin · montagem e bipagem — mobile/representante.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { MensagensRep } from "@/apps/montagem/mobile/mensagens-rep";
import { api, efem, totalNaoLidas, useChat } from "@/apps/montagem/domain/chat-store";
import { contatoDaRepresentante, registrarRevendedora } from "@/apps/montagem/domain/chat-contatos";
import { codigoRetirada } from "@/apps/montagem/components/dialogos";
import { ETAPA } from "@/apps/montagem/components/fila";
import { KitsNovosRep } from "@/apps/montagem/components/kits-novos-rep";import { derivarAcerto, FORM_ACERTO_VAZIO } from "@/apps/montagem/domain/acerto-derivado";
import { comisEfetiva, itensComissao, pctDaRep, totalDividaAnterior } from "@/apps/montagem/domain/comissoes";
import { mensagemFechamento, mensagemEntrega, abrirPdfAcerto } from "@/apps/montagem/domain/mensagem-fechamento";
import { condicionaisDoKit, totaisDe, totaisKit } from "@/apps/montagem/domain/conferencia-pecas";
import { atrasoAcerto, linhasAtraso, textoNegociacao, vezCobravel, versaoDoKit, versaoVigente, PARCELAS_CARTAO,
  AVISO_BB, NOVAS_PADRAO, MEDIA_N, codigoBrindeValido, normalizarCodigo, limitarCodigo, codigoPecaValido, formasPagamentoPadrao, textoRegras, textoRegrasPrata, versaoEfetiva, comissaoEspecialDe, modalidadeDe, MODALIDADE_LB } from "@/apps/montagem/domain/consignado";
import { ComissoesRep } from "@/apps/montagem/mobile/comissoes-rep";
import { PedidoDataRep } from "@/apps/montagem/mobile/pedido-data-rep";
import { NovaListagemRep } from "@/apps/montagem/mobile/nova-listagem-rep";
import { ListagensRep } from "@/apps/montagem/mobile/listagens-rep";
import { passouPrazo, prazoDaListagem } from "@/apps/montagem/domain/listagem-regras";
import { PreAcertoRep } from "@/apps/montagem/mobile/pre-acerto-rep";
import { TelaAssinatura } from "@/apps/montagem/mobile/assinatura";
import { CampoReaisAuto, CampoReais, rotuloPagamento } from "@/apps/montagem/mobile/campos";
import { LinksDoAcerto, comprovanteDoLink, useLinksPagos } from "@/apps/montagem/mobile/links-pagamento-app";
import { linksDosPagamentos } from "@/apps/montagem/domain/link-pagamento";
import { EntregaKNRep } from "@/apps/montagem/mobile/kn-entrega-rep";
import { ConfPecas, ContagemTotal } from "@/apps/montagem/mobile/conf-pecas";
import { ConfDevolucao } from "@/apps/montagem/mobile/conf-devolucao";
import { nomeDe, REPRESENTANTES_VER } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { SEM_KIT, STATUS_LB, STATUS_TP, TIPO_KIT } from "@/apps/montagem/domain/status";
import { inicioSemana } from "@/apps/montagem/domain/encomendas";
import { badge } from "@/apps/montagem/ui/badge";
import { comissaoRev, sugerido } from "@/apps/montagem/domain/vendas";
import { N1, hoje, hora, isoDia } from "@/apps/montagem/lib/format";
import { TelaRegrasComissoes } from "@/apps/montagem/mobile/regras-comissoes-app";
import { IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { plim } from "@/apps/montagem/components/aviso-pagamentos";
import { pedeConta, estadoPagRep, pagamentosDoPedido } from "@/apps/montagem/domain/pagamento-rep";
import { chavePixRep } from "@/apps/montagem/domain/pix-regras";
import { CartaoPixConta } from "@/apps/montagem/mobile/cartao-pix-conta";
import { creditoDisponivel, creditosDaRevendedora } from "@/apps/montagem/domain/garantias-rev";
import { DEMO_REV, CENARIO_COMPLETO } from "@/apps/montagem/domain/acerto-exemplo";
import { RecebimentoRep } from "@/apps/montagem/mobile/revendedora";
import { Avatar, PONTO_CEL } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { FUNDO_BARRA } from "@/apps/montagem/mobile/cores-app";
import { Icon } from "@/apps/montagem/ui/icon";
import { apiAtiva, chamar, repCodDaConta, sair as sairDaConta } from "@/apps/montagem/lib/api";
import { reduzirFoto } from "@/apps/montagem/lib/perfil";
import { fotoPequena } from "@/apps/montagem/lib/comprovante";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";
import { AVISO_KIT_APOIO, KIT_APOIO } from "@/apps/montagem/domain/kit-apoio";
import React from "react";

// quanto do acerto já foi feito (peças bipadas, brindes, venda, pagamentos...): decide qual cópia é a mais completa (26/11/2026)
function pontosAcerto(f){ f = f || {}; var lidos = (f.devolucaoBip && f.devolucaoBip.lidos) || {}, n = 0; Object.keys(lidos).forEach(function(k){ var q = Number(lidos[k]); n += q>0 ? q : 1; });
  return n*3 + (f.brindes||[]).length*5 + (Number(f.vendaBruta)>0 ? 20 : 0) + (f.pagamentos||[]).length*4 + (f.trocas||[]).length*4 + (f.pecasProxCodigos||[]).length*2 + (f.condicionaisSelecionadas||[]).length + (Number(f.pecasVendidas)>0 ? 5 : 0); }
// Moeda com centavos (,00) sempre visíveis: usada só no app da representante — o BK() global (lib/format) fica arredondado pras outras telas do admin.
function BK(n){ return "R$ " + Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); }
var MESES_CHEIOS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
var MESES_ABR = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
function mesesApp(){ var h = new Date(), r = []; for(var i=0;i<3;i++){ r.push(MESES_ABR[new Date(h.getFullYear(), h.getMonth()-i, 1).getMonth()]); } return r; } // [atual, anterior, retrasado] = índices de k.vendas
var PCT_REVENDEDORA = 0.30, PCT_REPRESENTANTE = 0.10;   // provisórios: comissão da revendedora (desconta do acerto) e da representante
// Base de demonstração fictícia: 20 revendedoras com acerto já feito, 5 de cada uma das 4 representantes (Dayanne, Lysie e Thalita em Curitiba,
// Jessica em São José dos Pinhais). Telefones e endereços são placeholders, não correspondem a locais reais.
// Tom claro de uma cor (mistura com branco): os blocos do app não ficam 100% brancos
function claro(hex, p){ var n = parseInt(hex.slice(1),16), r = (n>>16)&255, g = (n>>8)&255, b = n&255, m = function(c){ return Math.round(c+(255-c)*(1-p)); };
  return "#"+[m(r),m(g),m(b)].map(function(x){ return x.toString(16).padStart(2,"0"); }).join(""); }
function revDemo(rev, fone, endereco, cidade, total, dias, hora){
  return {rev:rev, fone:fone, bairro:endereco, cidade:cidade, vendas:[total, Math.round(total*0.92/10)*10, Math.round(total*0.85/10)*10], cond:Math.round(total*3/500)*500, dias:dias, hora:hora};
}
var CARTEIRA_DEMO = {};   // 01/11/2026 (Marcus): carteira fictícia saiu; a carteira vem do uso real
// 05/11/2026 (Marcus): referências inventadas (refsDe) saíram. As 3 referências são as que a representante digita na etapa 1 / na ficha.
// Vendas anteriores vindas do SISTEMA (DevMaster, rota /api/revendedoras: 3 últimas vendas sem brinde, mais nova primeiro). Lista lida uma vez e guardada; a revendedora é achada pelo nome.
// nome da representante para MOSTRAR (a lista do DevMaster vem em caixa alta: MARCIANE vira Marciane)
var nomeBonito = function(x){ return String(x||"").toLowerCase().replace(/(^|[ -])([a-zà-ú])/g, function(m, p, b){ return p+b.toUpperCase(); }); };
var LISTA_REVS = {};   // uma lista por representante
var semAcento = function(x){ return String(x||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/s+/g, " ").trim(); };
// código do vendedor na DevMaster (lista do Agendamento): resolve nomes repetidos como Jessica e Thalita
function codigoRep(s, rep){ var cc = repCodDaConta(); if(cc) return cc;   // conta de representante: o código do vendedor é o da própria conta
  var v = REPRESENTANTES_VER.find(function(x){ return x.rep===rep && x.cod; }); if(v) return v.cod; var r = ((s.agend && s.agend.config && s.agend.config.representantes) || []).find(function(x){ return x.ativo && x.nome===rep; }); return r ? r.codigo : ""; }
function listaReal(rep, cod){
  var k = rep+"|"+(cod||"");
  // tenta até 3 vezes (a carteira grande demora na primeira chamada do dia); falha NÃO fica guardada: na próxima abertura tenta de novo
  var url = "/representante/revendedoras?rep="+encodeURIComponent(rep)+(cod ? "&vendedor="+encodeURIComponent(cod) : "");
  if(!LISTA_REVS[k]) LISTA_REVS[k] = chamar("GET", url).catch(function(){ return chamar("GET", url); }).catch(function(){ return chamar("GET", url); }).catch(function(){ delete LISTA_REVS[k]; return null; });
  return LISTA_REVS[k];
}
function vendasDoSistema(rep, nome, cod){
  if(!apiAtiva()) return Promise.resolve(null);
  return listaReal(rep, cod).then(function(d){ var n = semAcento(nome), it = d && (d.itens||[]).find(function(i){ return semAcento(i.nome)===n; }); return it ? (it.vendas||[]).map(function(v){ return v.v; }) : null; });
}
// Nome da situação do kit para a REPRESENTANTE (05/11/2026): fala do que ela precisa saber, sem o jargão da montagem. O admin continua com os nomes de domain/status.js.
var STATUS_REP = {semvalor:"Na fila", pendente:"Na fila", ajuste:"Montando", montando:"Montando", supervisao:"Montando",
  montado:"Aguardando bipagem", bipando:"Bipando", bipado:"Pronto para retirar", retirado:"Retirado", condicional:"Condicional para retirar", precond:"Conferindo a condicional"};   // 05/11/2026 (Marcus): só o que importa para ela (fila, montando, bipagem, pronto, retirado); valor do kit e conferência são etapas internas
// Totais REAIS da representante, vindos do app (05/11/2026): quantas revendedoras ela tem e quanto vendeu. Rota só da Diretoria (/api/representantes/painel); se falhar, as linhas não aparecem.
var PAINEL_APP = null;
function painelDoApp(){
  if(repCodDaConta()){ var cod0 = repCodDaConta(); return chamar("GET", "/representante/eu").then(function(j){ return j && j.painel ? {itens:[Object.assign({cod:cod0}, j.painel)]} : null; }).catch(function(){ return null; }); }   // conta dela: só os totais dela, pelo servidor (a rota da Diretoria é fechada para ela)
  if(!PAINEL_APP) PAINEL_APP = chamar("GET", "/representantes/painel").catch(function(){ PAINEL_APP = null; return null; }); return PAINEL_APP; }
function carteiraRep(s, rep, reais){
  var dm = function(dt){ return dt.toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
  var dmISO = function(iso){ var p = (iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : ""; };
  var perfis = s.perfisRev||{};
  var lids = s.listagens.filter(function(x){return x.rep===rep;}).map(function(x){return x.id;});
  var appDe = {}; (reais||[]).forEach(function(it){ if(it.vendaApp>0) appDe[semAcento(it.nome)] = it.vendaApp; });   // venda lançada no app da revendedora desde o último acerto
  var hojeK = s.kits.filter(function(k){return lids.indexOf(k.lid)>=0;}).map(function(k){
    return {vendaApp:appDe[semAcento(k.rev)]||0, cod:k.codRev||"", id:k.id, rev:k.rev, fone:k.fone||"", bairro:k.endereco||k.bairro, vendas:k.vendas||[], cond:k.valor, hora:k.horaAtend, hoje:true, data:dm(new Date()), nova:(k.tipoKit||"").indexOf("kit_novo")===0, tipoKit:k.tipoKit, status:k.status, lid:k.lid}; });
  // 26/11/2026 (Marcus): "Ana Ca" mostrava "Ana Caroline" e "Ana Caroline Macedo Santos" (mesmo código, dois kits de hoje) e o toque na de baixo abria a de cima. Um código = um cartão: fica o nome mais completo e as vendas do outro entram se faltarem
  (function(){ var porCod = {}, fora = [];
    hojeK.forEach(function(k){ var c = k.cod; if(!c) return; var o = porCod[c]; if(!o){ porCod[c] = k; return; }
      var manter = String(k.rev||"").length > String(o.rev||"").length ? k : o, solto = manter===k ? o : k;
      if(!(manter.vendas||[]).some(function(v){ return v>0; })) manter.vendas = solto.vendas || manter.vendas;
      porCod[c] = manter; fora.push(solto); });
    hojeK = hojeK.filter(function(k){ return fora.indexOf(k)<0; }); })();
  // Revendedora que já fez o acerto neste mês: o card mostra "Acerto realizado · mês" e o vendido/acerto reais do acerto
  var mesAtual = isoDia(new Date()).slice(0,7);
  var feito = function(rev){ return (s.acertosConsignado||[]).find(function(a){ return a.tipo==="acerto" && a.rev===rev && (a.data||"").slice(0,7)===mesAtual; }); };
  var comFeito = function(c){ var a = feito(c.rev); return a ? Object.assign({}, c, {vendas:[a.vendaBruta].concat((c.vendas||[]).slice(1)), realizado:{data:dmISO(a.data), mes:MESES_CHEIOS[+a.data.slice(5,7)-1]}}) : c; };
  var peds = (s.p45 && s.p45.pedidos) || [];
  var comPedido = function(c){ if(c.hoje) return c; var pd = peds.filter(function(x){ return (x.status==="registrada" || x.status==="aprovada") && x.nome.toLowerCase()===c.rev.toLowerCase(); }).slice(-1)[0]; return pd ? Object.assign({}, c, {data:dmISO(pd.novaData)}) : c; };
  // carteira REAL: todas as revendedoras da representante (DevMaster), menos as que já estão na listagem de hoje
  var jaHoje = {}; hojeK.forEach(function(k){ jaHoje[semAcento(k.rev)] = 1; });
  var reaisC = (reais||[]).filter(function(it){ return !jaHoje[semAcento(it.nome)]; }).map(function(it){
    var vs = (it.vendas||[]).map(function(v){ return v.v; }), md = vs.length ? vs.reduce(function(t,x){ return t+x; }, 0)/vs.length : 0;
    // 26/11/2026 (Marcus: Ana Claudia da Lysie mostrava no mês atual a venda do mês anterior): "vendas" são as 3 últimas vendas, não os 3 meses. Os botões atual/anterior/retrasado usam o mês de calendário (vm); sem vm, fica como antes.
    if(it.vm){ var hj = new Date(); vs = [0,1,2].map(function(i){ var dd = new Date(hj.getFullYear(), hj.getMonth()-i, 1); return it.vm[dd.getFullYear()+"-"+String(dd.getMonth()+1).padStart(2,"0")] || 0; }); }
    return comPedido(comFeito({vendaApp:it.vendaApp||0, id:"R"+it.cod, rev:it.nome, fone:it.celular||"", bairro:it.cidade||"", vendas:vs, cond:Math.round(md/500)*500, hora:null, hoje:false, data:dmISO(String(it.prevDevol||"").slice(0,10)), cod:it.cod})); });
  return hojeK.map(comFeito).sort(function(a, b){ return (b.rev===DEMO_REV ? 1 : 0) - (a.rev===DEMO_REV ? 1 : 0); }).concat(reaisC).concat((CARTEIRA_DEMO[rep]||[]).map(function(c,i){ var dt = new Date(); dt.setDate(dt.getDate()+c.dias);
    var ag = (perfis[c.rev]||{}).agendado;
    return comPedido(comFeito(Object.assign({id:"C"+i, hoje:false, data: ag && ag.data ? dmISO(ag.data) : dm(dt), hora: ag ? (ag.hora||null) : c.hora}, c))); }));
}
function AppRepresentante(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var EXEMPLO = !!repCodDaConta() && String(l.rep||"").toLowerCase()==="sorelly", abrirEf = p.abrir || (EXEMPLO ? {rev:DEMO_REV, n:"exemplo", cenario:CENARIO_COMPLETO} : null);   // 26/11/2026 (Marcus): na conta de representante "Sorelly" a Karine Teste é a primeira revendedora e o acerto dela abre preenchido
  var chatSt = useChat(), chatCid = contatoDaRepresentante(l.rep), chatNaoLidas = chatCid && chatSt.config.representantes ? totalNaoLidas(chatCid) : 0;
  var tb = useState("inicio"), tela = tb[0], setTela = tb[1];
  var kab = useState(false), kitAbertoConf = kab[0], setKitAbertoConf = kab[1];   // 26/11/2026 (Marcus): "Próximo Kit Liberado" fecha; ao tocar abre a confirmação das condicionais
  var cvv = useState("calcacerto"), confVolta = cvv[0], setConfVolta = cvv[1];   // para onde a conferência das peças volta (entrega do kit novo ou acerto)
  var ms = useState(0), mes = ms[0], setMes = ms[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var sr = useState(null), selId = sr[0], setSel = sr[1];
  var af = useState(FORM_ACERTO_VAZIO), acertoForm = af[0], setAcertoForm = af[1];
  var BRINDE_IN_VAZIO = {normal:{codigo:"", valor:null}, bb:{codigo:"", valor:null}};
  var bi = useState(BRINDE_IN_VAZIO), brindeIn = bi[0], setBrindeIn = bi[1];
  var ta = useState("inicio"), telaAntes = ta[0], setTelaAntes = ta[1];
  var rdS = useState(""), regrasDaAssinatura = rdS[0], setRegrasDaAssinatura = rdS[1];   // as regras da revendedora foram abertas a partir da assinatura do acerto: o voltar retorna para ela
  var LANC_VAZIO = {forma:"", descricao:"", parcelas:1, data:isoDia(new Date()), valor:null, anexo:null};
  var mc = useState(null), msgCopiada = mc[0], setMsgCopiada = mc[1];
  var cpx = useState(""), codProx = cpx[0], setCodProx = cpx[1];
  var lf = useState(false), lancAberto = lf[0], setLancAberto = lf[1];
  var lv = useState(LANC_VAZIO), lancForm = lv[0], setLancForm = lv[1];
  var ngA = useState(false), negociarAberto = ngA[0], setNegociarAberto = ngA[1];
  var riA = useState(false), regrasInadAberto = riA[0], setRegrasInadAberto = riA[1];
  var rf = useState({comExpositor:false, especial:false, valorEspecial:0}), reposForm = rf[0], setReposForm = rf[1];
  var mc = useState("acerto"), modoCalc = mc[0], setModoCalc = mc[1];
  var ab = useState(1), blocoAberto = ab[0], setBlocoAberto = ab[1];
  var TROCA_VAZIA = {tipo:null, antigaCod:"", antigaValor:null, novaCod:"", novaValor:null};
  var tr0 = useState(TROCA_VAZIA), trocaIn = tr0[0], setTrocaIn = tr0[1];
  var bcS = useState("normal"), brindeCat = bcS[0], setBrindeCat = bcS[1];   // brinde que está sendo lançado: normal ou bb (02/11/2026)
  var bfS = useState(false), brindeFormAberto = bfS[0], setBrindeFormAberto = bfS[1];
  var tfS = useState(false), trocaFormAberto = tfS[0], setTrocaFormAberto = tfS[1];
  var ptS = useState(1), passoTroca = ptS[0], setPassoTroca = ptS[1];   // formulário da troca em 3 passos (02/11/2026)
  var lsel = useState(l.id), lidPed = lsel[0], setLidPed = lsel[1];
  var so = useState("data"), sortBy = so[0], setSortBy = so[1];
  var fa = useState(false), filtrosAbertos = fa[0], setFiltrosAbertos = fa[1];
  var me = useState(false), menuAberto = me[0], setMenuAberto = me[1];
  var mso = useState(false), mostrarSolicitar = mso[0], setMostrarSolicitar = mso[1];
  var nlA = useState(false), novaListagemAberta = nlA[0], setNovaListagemAberta = nlA[1];
  var lgS = useState({t:"lista", v:"lista", mes:null, dia:null}), lgSub = lgS[0], setLgSub = lgS[1];   // Listagens: lista | dia | excluir | nova (mobile/listagens-rep.js)   // formulário "Nova listagem" (aba Listagens e tela da revendedora)
  var agA = useState(false), agendarAberto = agA[0], setAgendarAberto = agA[1], auA = useState(false), autoAg = auA[0], setAutoAg = auA[1], saS = useState(false), semAg = saS[0], setSemAg = saS[1], saA = useState(false), abrirSemAg = saA[0], setAbrirSemAg = saA[1];   // semAg: criou o atendimento de hoje sem agendamento; abrirSemAg: abrir a calculadora quando o kit existir   // autoAg: criou a listagem dentro do Agendar; a revendedora entra nela sozinha (Thainá, 24/11/2026: "não está salvando")
  var agF = useState({data:"", hora:""}), agendaForm = agF[0], setAgendaForm = agF[1];
  var tpA = useState("acerto_kit"), tipoAgenda = tpA[0], setTipoAgenda = tpA[1];   // Agendar atendimento: acerto + kit ou reposição (05/11/2026, Marcus)
  var lvA = useState(""), lidVista = lvA[0], setLidVista = lvA[1];
  var lvB = useState(""), buscaListagem = lvB[0], setBuscaListagem = lvB[1];
  var ep = useState(false), editandoPerfil = ep[0], setEditandoPerfil = ep[1];
  var re = useState(null), regEscolha = re[0], setRegEscolha = re[1]; // null = fechado, "multa"/"isenta" = caixinha aberta nessa escolha
  var mcS = useState(false), menuConta = mcS[0], setMenuConta = mcS[1], ftS = useState(p.foto || ""), fotoRep = ftS[0], setFotoRep = ftS[1], fmS = useState(""), msgFoto = fmS[0], setMsgFoto = fmS[1];   // menu do nome (Trocar foto, Sair da conta) e a foto dela
  useEffect(function(){ if(p.foto) setFotoRep(p.foto); }, [p.foto]);   // a foto chega do servidor depois de abrir a tela
  var rsT = useState(null), reais = rsT[0], setReais = rsT[1];   // carteira real da representante (DevMaster); null = carregando
  useEffect(function(){ if(!apiAtiva()){ setReais([]); return; } var vivo = true; setReais(null); listaReal(l.rep, codigoRep(s, l.rep)).then(function(x){ if(vivo) setReais((x && x.itens) || []); }); return function(){ vivo = false; }; }, [l.rep]);
  var pnS = useState(null), painelApp = pnS[0], setPainelApp = pnS[1];   // totais reais dela vindos do app
  useEffect(function(){ if(!apiAtiva()){ setPainelApp(null); return; } var vivo = true, cod = codigoRep(s, l.rep); painelDoApp().then(function(d){ if(vivo) setPainelApp(d && cod ? (d.itens||[]).find(function(i){ return String(i.cod)===String(cod); }) || null : null); }); return function(){ vivo = false; }; }, [l.rep]);   // eslint-disable-line react-hooks/exhaustive-deps
  var meses = mesesApp(), cart = carteiraRep(s, l.rep, reais);
  var vendMes = function(r, i){ return r.vendas[i===undefined?mes:i] || 0; };
  var totMes = function(i){ return cart.reduce(function(t,r){return t+vendMes(r,i);},0); };
  var tot = totMes(mes);
  var BR = "txt-branco";
  var cp = useState(null), copiadoId = cp[0], setCopiado = cp[1];
  var copiarEndereco = function(id, texto){ if(!texto) return; navigator.clipboard.writeText(texto).then(function(){ setCopiado(id); setTimeout(function(){ setCopiado(null); }, 1500); }); };
  var av = useState({}), notas = av[0], setNotas = av[1];
  var ks = s.kits.filter(function(k){return k.lid===l.id;}).sort(function(a,b){ return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem; });
  var bip = ks.filter(function(k){return k.status==="bipado";}), ret = ks.filter(function(k){return k.status==="retirado";});
  var ouro = "bg-[#C9A13B] "+BR;
  var douradoArrow = "grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200";
  var douradoTitulo = "text-[13px] font-black uppercase tracking-[.18em] text-amber-200";
  var nAval = ret.filter(function(k){return !k.aval;}).length, nNovos = (s.novas||[]).filter(function(n){return n.rep===l.rep && n.status==="direcionada";}).length;
  var MENU = [["revs","Revendedoras","users","#2563EB", cart.length+" na carteira · "+ks.length+" kits hoje"],
    ["retirada","Retirada","caixa","#16A34A", bip.length+" prontos"],
    ["avaliar","Avaliar kits","star","#EA580C", nAval ? nAval+" para avaliar" : "tudo avaliado"],
    ["novos","Kits novos","novas","#DB2777", nNovos ? nNovos+" aguardando" : "revendedoras novas", nNovos],
    ["listagens","Listagens","lista","#7C3AED", "Em breve"],
    ["desempenho","Desempenho","trofeu","#16A34A", "Em breve"],
    ["indique","Indique & Ganhe","presente","#CA8A04", "Em breve"]];
  var TITULO = {rev:"Revendedora", comissoes:"Comissões"}; MENU.forEach(function(m){ TITULO[m[0]] = m[1]; });
  // Tela inicial (dashboard): só o que foi REGISTRADO no sistema pelos acertos feitos no app, no mês escolhido. Sem acerto registrado, tudo zero (01/11/2026, Marcus: as representantes ainda não usam o sistema).
  // Comissão = a do motor de comissões (domain/comissoes.js), a mesma da tela Comissões; o Pix direto não conta como comissão.
  var mesCard = (function(){ var h0 = new Date(), d0 = new Date(h0.getFullYear(), h0.getMonth()-mes, 1); return d0.getFullYear()+"-"+String(d0.getMonth()+1).padStart(2,"0"); })();
  var acertosCard = (s.acertosConsignado||[]).filter(function(a){ return a.origem!=="interno" && a.tipo==="acerto" && a.rep===l.rep && (a.data||"").slice(0,7)===mesCard; });
  var vendidoTotal = acertosCard.reduce(function(t0,a){ return t0+(a.vendaBruta||0); }, 0), acertoTotal = acertosCard.reduce(function(t0,a){ return t0+(a.valorAcerto||0); }, 0),
    comissaoRepTotal = itensComissao(comisEfetiva(s), s, Date.now()).filter(function(i){ return i.dest===l.rep && !i.pixRep && (i.data||"").slice(0,7)===mesCard; }).reduce(function(t0,i){ return t0+i.comissao; }, 0);
  // SOMA DA CARTEIRA (Marcus, 24/11/2026: "o app fazendo a soma do acerto"; o backend do app está desligado e os acertos registrados estão zerados): sem totais do app e sem acerto registrado no mês, o Início soma o vendido do mês escolhido de todas as revendedoras dela e o acerto de cada uma pela tabela de comissão.
  var usaCarteira = !(painelApp && painelApp.vendido!=null) && acertosCard.length===0, carregandoCarteira = usaCarteira && apiAtiva() && reais===null;
  var somaCarteiraV = cart.reduce(function(t0,r){ return t0+vendMes(r); }, 0), somaCarteiraA = cart.reduce(function(t0,r){ var v = vendMes(r); return t0+Math.round(v*(1-((comissaoRev(v, s.cfg)||{pct:0}).pct/100))); }, 0);
  var nPagNI = (s.acertosConsignado||[]).reduce(function(t,r){ return r.origem==='interno' || r.rep!==l.rep ? t : t+Object.keys(r.divs||{}).filter(function(i){ return r.divs[i].tipo==='nao_ident' && !(r.fin && r.fin[i]); }).length; }, 0);
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  // conversa com a revendedora no próprio chat do app (em vez de abrir o WhatsApp)
  var abrirChat = function(nome){ var cr = contatoDaRepresentante(l.rep), rv = registrarRevendedora(nome); if(!cr) return; efem({conversaSel:api.openChannel(rv, "r_rep", [cr])}); setTela("mensagens"); };
  // aceitou o kit novo: abre a conversa com a revendedora no SorellyChat já com a mensagem de apresentação enviada
  var aceitouKitNovo = function(n, texto){ var cr = contatoDaRepresentante(l.rep), rv = registrarRevendedora(n.nome); if(!cr) return; var conv = api.openChannel(rv, "r_rep", [cr]); api.sendMessage({conv:conv, eu:cr, texto:texto}); efem({conversaSel:conv}); setTela("mensagens"); };
  var LISTA_INICIO = [
    {tela:"novos", titulo:"Kits Novos", sub: nNovos ? nNovos+" aguardando" : "Revendedoras novas direcionadas", icone:"novas", cor:"#DB2777", ativo:true},
    {tela:"revs", titulo:"Revendedoras", sub: reais===null ? "Carregando…" : cart.length+(cart.length===1 ? " revendedora" : " revendedoras"), icone:"users", cor:"#EA580C", ativo:true},
    {tela:"listagens", titulo:"Listagens", sub: minhasL.length+(minhasL.length===1?" listagem aberta":" listagens abertas"), icone:"lista", cor:"#7C3AED", ativo:true},
    {tela:"comissoes", titulo:"Comissões", sub: nPagNI ? "⚠ "+nPagNI+(nPagNI===1 ? " pagamento não identificado" : " pagamentos não identificados") : "Minhas comissões e quilometragem", icone:"coins", cor:"#CA8A04", ativo:true},
    {tela:"regrascom", titulo:"Regras e comissões", sub:"Tabela, brindes, taxas e multas", icone:"book", cor:"#B8862B", ativo:true},
];   // Desempenho e Indique & Ganhe saíram do app (Marcus, 23/11/2026)
  var voltar = e("div",{className:"flex items-center gap-2"},
    e("button",{onClick:function(){setTela("inicio");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"),
    e("b",{className:"text-[16px]"}, TITULO[tela]));
  var PCT_COMISSAO_REP_CARD = (function(){ var c = comisEfetiva(s), reps = c.reps||[], x = reps.find(function(y){ return y.nome===l.rep; }) || reps.find(function(y){ return y.nome===String(l.rep||"").trim().split(/ +/)[0]; }); return (x && x.pct!=null ? x.pct : c.pctPadrao)/100; })();   // comissão da representante no cartão: o % DELA (Dayanne, Lysie e Vanessa 10%, as demais 8%; 23/11/2026)
  var LINHA_CARD = "border-[#E9DDBB]";
  var col = function(lb, v, cor){ return e("div",{className:"px-1"}, e("p",{className:"text-[13px] font-bold leading-tight tracking-wide text-[#9A8B63]"}, lb), e("p",{className:MONO+" whitespace-nowrap text-[15px] font-extrabold leading-tight", style:cor?{color:cor}:null}, v)); };   // coluna Vendido/Acerto/Comissão (a ficha da revendedora usa; a lista nova não): sem ela, tocar numa revendedora dava erro (24/11/2026)
  var cartao = function(r){
    // mês atual, ainda sem acerto: vale o que ela vendeu no APP desde o último acerto (é o que vai virar o acerto); sem venda no app, a última venda da DevMaster
    var doApp = mes===0 && !r.realizado && r.vendaApp>0;
    var vd = doApp ? r.vendaApp : vendMes(r), acerto = Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100))), comissaoRep = Math.round(acerto*PCT_COMISSAO_REP_CARD);
    // identificador do tipo do atendimento de hoje (Marcus, 03/11/2026): kit novo e saída NÃO são acerto, então não mostram "Acerto hoje" nem vendido/acerto/comissão zerados; a reposição é de quem já tem kit, então mostra as vendas. O identificador é só a escrita colorida
    var tk = r.tipoKit || "", tipoHoje = r.realizado || !r.hoje ? null : tk.indexOf("kit_novo")===0 ? {sigla:"KIT NOVO", lb:"Kit novo hoje", cor:"#6D28D9"} : tk==="reposicao" ? {sigla:"REPOSIÇÃO", lb:"Reposição hoje", cor:"#0E7490"} : tk==="saiu" || tk==="condicional" ? {sigla:"SAÍDA", lb:tk==="saiu" ? "Saída hoje · retirar condicional" : "Retirar condicional hoje", cor:"#B91C1C"} : null;
    var estado = tipoHoje ? {lb:tipoHoje.lb, cor:tipoHoje.cor} : r.realizado ? {lb:"✓ Acerto realizado · "+r.realizado.mes, cor:"#15803D"} : r.hoje ? {lb:"Acerto hoje", cor:"#B45309"} : r.hora ? {lb:"Acerto previsto", cor:"#1D4ED8"} : {lb:"Acerto previsto", cor:"#9CA3AF"};
    // endereço favorito (estrela na ficha da revendedora): é onde ela prefere ser atendida no acerto, e é o que aparece na lista
    var pf = s.perfisRev[r.rev] || {}, fav = pf.enderecoFavorito;
    var endCard = fav==="trabalho" ? (pf.enderecoTrabalho || r.bairro) : fav==="casa" ? (pf.enderecoCasa!==undefined ? pf.enderecoCasa : r.bairro) : r.bairro;
    // cartão no formato A (Marcus, 24/11/2026): mesmas cores de antes (fundo dourado claro, números verde, azul e dourado, data com a cor do estado), uma fonte, sem botão Copiar
    var num = function(lb, v, cor, esq){ var t = String(v); return e("div",{key:lb, className:"min-w-0 flex-1 px-1 pb-1.5 pt-1 text-center "+(esq ? "border-r "+LINHA_CARD : "")}, e("p",{className:"text-[11px] font-semibold leading-tight text-[#7A6B3F]"}, lb), e("p",{className:"whitespace-nowrap font-bold leading-tight tabular-nums "+(t.length>11 ? "text-[11px]" : "text-[13px]"), style:{color:cor}}, t)); };
    return e("div",{key:r.id, onClick:function(){ setSel(r.id); setTela("rev"); }, role:"button", tabIndex:0,
        className:"block w-full cursor-pointer overflow-hidden rounded-xl border "+LINHA_CARD+" text-left shadow-sm transition-transform active:scale-[.99]",
        style:{background:"#F6EBCB"}},
      e("div",{className:"flex items-center justify-between gap-2 px-3 pb-1.5 pt-2"},
        e("div",{className:"min-w-0"},
          e("div",{className:"flex min-w-0 items-center gap-1.5"},
            e("b",{className:"min-w-0 text-[13px] font-bold leading-tight text-[#111827]"}, r.rev),   // nome inteiro (nada abreviado, 23/11/2026)
            modalidadeDe(s, r.rev)==="prata" && e("span",{className:"shrink-0 rounded-md bg-slate-700 px-1.5 py-px text-[11px] font-semibold "+BR}, "100% prata")),
          e("p",{className:"mt-0.5 text-[11px] leading-snug text-[#4B5563]"},
            [r.fone, endCard].filter(Boolean).join(" · ") || "—")),
        r.fone && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); var d = String(r.fone||"").replace(/D/g, ""); if(d) window.open("https://wa.me/"+(d.length>11 && d.indexOf("55")===0 ? d : "55"+d), "_blank", "noopener"); }, "aria-label":"Abrir o WhatsApp de "+r.rev, title:"Abrir o WhatsApp", className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:15}))),
      e("div",{className:"flex border-t "+LINHA_CARD},
        !(tipoHoje && tk!=="reposicao") && num(doApp ? "Vendido no app" : "Vendido", BK(vd), "#15803D", true),
        !(tipoHoje && tk!=="reposicao") && num("Acerto", BK(acerto), "#2563EB", true),
        !(tipoHoje && tk!=="reposicao") && num("Comissão", BK(comissaoRep), "#A67C12", true),
        e("div",{className:"min-w-0 flex-1 px-1 pb-1.5 pt-1 text-center"}, e("p",{className:"text-[11px] font-semibold leading-tight", style:{color:estado.cor}}, estado.lb), e("p",{className:"whitespace-nowrap text-[13px] font-bold leading-tight tabular-nums", style:{color:estado.cor}}, r.realizado ? r.realizado.data : r.data), !r.realizado && r.hora && e("p",{className:"text-[11px] font-semibold leading-tight", style:{color:estado.cor}}, r.hora))));
  };
  // Revendedora aberta: contatos de referência e pedidos (kit, reposição, saiu = só retirar a condicional)
  // 05/11/2026: ao AGENDAR, a revendedora da carteira (id "R"+código) vira o kit da listagem (id novo). O id guardado deixava de existir e o celular ficava em branco:
  // lembra o nome e acha a mesma revendedora pelo nome; depois guarda o id novo.
  var selNome = useRef(null);
  var sel = cart.find(function(r){return r.id===selId;}) || (selNome.current && selId ? cart.find(function(r){ return r.rev===selNome.current; }) : undefined);
  if(sel) selNome.current = sel.rev;
  useEffect(function(){ if(sel && selId && sel.id!==selId) setSel(sel.id); }, [sel && sel.id, selId]);
  // RASCUNHO DO ATENDIMENTO (Marcus, 24/11/2026): a representante está sempre no meio de um atendimento; se o app recarregar (atualização do sistema, aba que fecha, erro de arquivo novo),
  // ela volta na MESMA tela, com o acerto, as peças bipadas e os brindes como estavam. O rascunho fica só neste aparelho (localStorage), vale 12 horas e some quando ela sai do atendimento de propósito
  // (volta ao início, vai para outra tela do app) ou termina o acerto.
  var CHAVE_RASCUNHO = "sorelly_rep_rascunho_v1", TELAS_RASCUNHO = ["pedidodata","preacerto","calcacerto","assinaracerto","entregakit","confkit","confdev","assinarrepos","reposicao","rev"], TELAS_SAIDA = ["inicio","revs","comissoes","listagens","novos","fechamento","resumokn","retirada","mensagens"];
  var rascRef = useRef(undefined), pularSalvar = useRef(false), rsS = useState(0), rascTick = rsS[0], setRascTick = rsS[1];
  // CÓPIA POR KIT (Lucas, 26/11/2026: "não fique zerando até elas realmente finalizarem"): cada acerto em andamento fica guardado no SERVIDOR (rascunho por kit) até o acerto ser FINALIZADO;
  // sair da tela, recarregar, versão nova ou erro não apagam. Ao abrir o acerto do kit de novo, volta tudo (peças bipadas, brindes, venda, pagamentos).
  var maisCompleto = function(a, b){ if(!a) return b || null; if(!b) return a; return pontosAcerto(b.acertoForm)>pontosAcerto(a.acertoForm) ? b : a; };
  if(rascRef.current===undefined){ rascRef.current = null; try{ var rr = JSON.parse(localStorage.getItem(CHAVE_RASCUNHO)||"null"); if(rr && rr.rep===l.rep && Date.now()-(rr.em||0) < 12*3600*1000 && TELAS_RASCUNHO.indexOf(rr.tela)>=0) rascRef.current = rr; }catch(x){} }
  useEffect(function(){   // devolve a representante ao ponto onde estava assim que a lista de revendedoras carregar
    var r = rascRef.current; if(!r) return;
    var alvo = cart.find(function(x){ return x.id===r.selId; }) || cart.find(function(x){ return x.rev===r.rev; });
    if(!alvo){ if(reais!==null) rascRef.current = null; return; }
    rascRef.current = null; pularSalvar.current = true;   // pularSalvar: o efeito de guardar não apaga o rascunho no mesmo ciclo da restauração
    // só volta para uma tela do acerto se o kit de hoje ainda existe e o acerto ainda não foi registrado; senão volta na ficha da revendedora (nunca numa tela em branco)
    var kitR = alvo.hoje ? s.kits.find(function(k){ return k.id===alvo.id; }) : null, jaR = (s.acertosConsignado||[]).some(function(x){ return x.kitId===alvo.id && x.tipo==="acerto"; });
    if(alvo.hoje && !kitR && !jaR && r.tela!=="rev" && Date.now()-(r.esperaDesde || (r.esperaDesde = Date.now())) < 20000){ rascRef.current = r; setTimeout(function(){ setRascTick(function(n){ return n+1; }); }, 1500); return; }   // kit ainda carregando: espera (26/11/2026: o acerto da Crislaine foi zerado aqui)
    var telaR = r.tela!=="rev" && (!kitR || jaR) ? "rev" : r.tela;
    setSel(alvo.id); setAcertoForm(Object.assign({}, FORM_ACERTO_VAZIO, jaR ? {} : (r.acertoForm||{})));   // o acerto em andamento nunca é jogado fora (antes zerava ao voltar na ficha) setBrindeIn(r.brindeIn || BRINDE_IN_VAZIO); setConfVolta(r.confVolta || "calcacerto"); setTela(telaR);
  }, [cart.length, reais, rascTick]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){   // guarda o rascunho a cada mudança dentro do atendimento
    if(rascRef.current) return;   // ainda restaurando: não sobrescreve
    if(pularSalvar.current){ pularSalvar.current = false; return; }
    try{
      if(TELAS_RASCUNHO.indexOf(tela)>=0 && sel) enviarRasc({rep:l.rep, selId:sel.id, rev:sel.rev, tela:tela, confVolta:confVolta, acertoForm:acertoForm, brindeIn:brindeIn, em:Date.now()});   // vai para o banco (servidor)
      else if(TELAS_SAIDA.indexOf(tela)>=0) encerrarRasc();
      if(TELAS_RASCUNHO.indexOf(tela)>=0 && sel){ try{ localStorage.setItem(CHAVE_RASCUNHO, JSON.stringify({rep:l.rep, selId:sel.id, rev:sel.rev, tela:tela, confVolta:confVolta, acertoForm:acertoForm, brindeIn:brindeIn, em:Date.now()})); }catch(x){ localStorage.removeItem(CHAVE_RASCUNHO); } }
      else if(TELAS_SAIDA.indexOf(tela)>=0) localStorage.removeItem(CHAVE_RASCUNHO);
    }catch(x){}
  }, [tela, acertoForm, brindeIn, confVolta, selId]);   // eslint-disable-line react-hooks/exhaustive-deps
  // RASCUNHO NO SERVIDOR (26/11/2026, Marcus: a bateria da Jessica acabou antes de salvar o acerto): o mesmo rascunho vai para o admin (rota /api/representante/rascunho) 1 s depois de cada mudança.
  // Sem sinal: fica pendente e sai sozinho a cada 15 s e quando a internet volta. Ao abrir o app, vale o rascunho mais novo entre o do aparelho e o do servidor (outro celular continua de onde parou).
  var envRasc = useRef({t:null, pend:null, enviado:false});
  function descarregarRasc(){ var r = envRasc.current.pend; if(!r || !apiAtiva()) return;
    chamar("PUT", "/representante/rascunho", {rep:l.rep, kitId:String(r.selId), rev:r.rev, dados:r, em:r.em}).then(function(){ envRasc.current.enviado = true; if(envRasc.current.pend===r) envRasc.current.pend = null; }).catch(function(){}); }
  function enviarRasc(r){ if(!apiAtiva()) return; envRasc.current.pend = r; clearTimeout(envRasc.current.t); envRasc.current.t = setTimeout(descarregarRasc, 1000); }
  function encerrarRasc(){ clearTimeout(envRasc.current.t); envRasc.current.pend = null; if(!apiAtiva() || !envRasc.current.enviado) return; envRasc.current.enviado = false; chamar("DELETE", "/representante/rascunho?rep="+encodeURIComponent(l.rep)).catch(function(){}); }
  useEffect(function(){ var iv = setInterval(function(){ if(envRasc.current.pend) descarregarRasc(); }, 15000), on = function(){ if(envRasc.current.pend) descarregarRasc(); };
    window.addEventListener("online", on); return function(){ clearInterval(iv); window.removeEventListener("online", on); }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!apiAtiva()) return; var vivo = true;   // ao abrir: busca o rascunho do servidor; se for mais novo que o do aparelho, usa ele
    chamar("GET", "/representante/rascunho?rep="+encodeURIComponent(l.rep)).then(function(j){ var x = j && j.rascunho; if(!vivo || !x || !x.dados) return;
      var loc = rascRef.current; if(loc && (loc.em||0) >= (x.em||0)) return;
      if(TELAS_RASCUNHO.indexOf(x.dados.tela)<0) return;
      rascRef.current = x.dados; envRasc.current.enviado = true; setRascTick(function(n){ return n+1; }); }).catch(function(){});
    return function(){ vivo = false; }; }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var lPed = minhasL.find(function(x){return x.id===lidPed;}) || minhasL[0];
  var pedir = function(tipo, opts){ opts = opts || {};
    var lidUse = opts.lid || (lPed && lPed.id), lUse = s.listagens.find(function(x){return x.id===lidUse;});
    if(!lUse || !sel) return;
    var conds = SEM_KIT[tipo] ? [String(13000 + sel.rev.length*97 + sel.rev.charCodeAt(0)).padStart(6,"0")] : [];
    d({type:"ADD_KIT", lid:lUse.id, rev:sel.rev, bairro:sel.bairro||"", vendas: tipo==="reposicao" ? [] : sel.vendas, prio:false, atrasado:false, tipoKit:tipo, conds:conds, fone:sel.fone, cod:sel.cod, hora:(opts.hora!==undefined?opts.hora:sel.hora)||null, porApp:true, porRep:true, semAgendamento:!!opts.semAgendamento, porRepNome:l.rep});   // porRep: o reducer trava prazo e 1 listagem por dia (09/11/2026)
    if(!opts.ficarNaTela) setTela("revs"); };
  var kitSel = sel && sel.hoje ? s.kits.find(function(k){return k.id===sel.id;}) : null;
  // As 2 vendas anteriores da revendedora vêm do SISTEMA (a representante não digita nem consegue puxar na hora). Quando a listagem vier da DevMaster, o kit traz `vendasAnt` = [mais nova, mais antiga]; na demonstração usa os meses anteriores da carteira.
  // Devolve [de 2 acertos atrás, do último acerto], a ordem que a regra da média espera.
  var vsS = useState({}), vendasSis = vsS[0], setVendasSis = vsS[1];   // nome da revendedora -> [mais nova, mais antiga, ...] vindo do sistema
  useEffect(function(){ if(!sel || !sel.hoje || vendasSis[sel.rev]!==undefined) return; var nome = sel.rev; vendasDoSistema(l.rep, nome, codigoRep(s, l.rep)).then(function(v){ setVendasSis(function(o){ var n = Object.assign({}, o); n[nome] = v || null; return n; }); }); }, [sel && sel.rev]);
  var vendasAntSistema = function(){ var kk = kitSel || {}, v = kk.vendasAnt || (sel && vendasSis[sel.rev]) || (sel && sel.vendas && sel.vendas.length>=3 ? [sel.vendas[1], sel.vendas[2], sel.vendas[3]] : null); return v ? [v[2] || null, v[1] || null, v[0] || null] : []; };
  useEffect(function(){ if(!sel) return; var v = vendasAntSistema(), at = acertoForm.vendasAnteriores||[]; if(v.some(function(x){ return x>0; }) && (at[0]!==v[0] || at[1]!==v[1] || at[2]!==v[2])) setAcertoForm(function(f0){ return Object.assign({}, f0, {vendasAnteriores:v}); }); }, [vendasSis, selId]);   // o histórico chegou depois de abrir o acerto: entra no formulário
  // resumo do kit entregue e conferido (condicionais, peças, valor, faltas e peças de outro kit): entra no PDF do acerto + kit novo e no resumo do kit novo
  var kitConfDe = function(kid){ var cf = (s.confBip||{})[kid], kk = s.kits.find(function(x){ return x.id===kid; }); if(!cf || !cf.fim || !kk) return null;
    var cs = condicionaisDoKit(kk), tk = totaisKit(cs), r = cf.resultado || {};
    return {conds:cs.map(function(c){ var x = totaisDe(c); return {numero:c.numero, modelos:x.modelos, pecas:x.pecas, valor:x.valor}; }), pecas:tk.pecas, valor:tk.valor, lidas:r.lidas||0, esperadas:r.esperadas||0, faltas:r.faltas||[], sobras:r.sobras||[]}; };
  var raS = useState(false), reposAss = raS[0], setReposAss = raS[1];   // reposição: a revendedora assinou a condicional?
  // Reposição (05/11/2026): as peças vêm da DevMaster pelo CPF da revendedora, igual ao kit novo (kn-entrega-rep.js). Sem CPF, a tela pede o CPF.
  var brS = useState({est:"", aviso:""}), buscaRepos = brS[0], setBuscaRepos = brS[1];
  var cpS = useState(""), cpfReposIn = cpS[0], setCpfReposIn = cpS[1];
  var cpfRepos = kitSel && kitSel.tipoKit==="reposicao" ? String(((s.perfisRev||{})[kitSel.rev]||{}).cpf||"").replace(/\D/g,"") : "";
  useEffect(function(){
    if(tela!=="reposicao" || !kitSel || kitSel.tipoKit!=="reposicao" || (kitSel.condsReais||[]).length) return;
    if(cpfRepos.length!==11){ setBuscaRepos({est:"semcpf", aviso:""}); return; }
    if(!apiAtiva()){ setBuscaRepos({est:"erro", aviso:"Sem conexão com o servidor."}); return; }
    var vivo = true; setBuscaRepos({est:"carregando", aviso:""});
    chamar("GET", "/representante/condicionais?cpf="+cpfRepos).then(function(r){
      if(!vivo) return;
      if(r.condicionais && r.condicionais.length){ d({type:"KIT_CONDS_REAIS", kitId:kitSel.id, conds:r.condicionais}); setBuscaRepos({est:"ok", aviso:""}); }
      else setBuscaRepos({est:"vazio", aviso:r.aviso || "Esse CPF não tem condicional aberta na DevMaster."});
    }).catch(function(x){ if(vivo) setBuscaRepos({est:"erro", aviso:x.message}); });
    return function(){ vivo = false; };
  }, [tela, kitSel && kitSel.id, cpfRepos]);
  var cmS = useState({numero:"", pecas:""}), condManual = cmS[0], setCondManual = cmS[1];
  var cfS = useState(false), condFormAberto = cfS[0], setCondFormAberto = cfS[1];   // formulário "+ Condicional" (02/11/2026: fica fechado até tocar)   // condicional adicionada à mão (quando não está cadastrada)
  var ppS = useState(false), perguntaPre = ppS[0], setPerguntaPre = ppS[1];                  // pergunta ao tocar em Realizar Acerto: "Você gostaria de atualizar remarcações e multas?" (02/11/2026, Marcus)
  var paS = useState(null), pendAbrir = paS[0], setPendAbrir = paS[1];                      // pedido para abrir direto um acerto já preenchido (botão do admin ou ?acerto=1)
  var jaAcertado = kitSel && (kitSel.status==="acertado" || kitSel.acerto || kitSel.reposicaoEntregue);
  var ehKitNovoHoje = !!kitSel && (kitSel.tipoKit||"").indexOf("kit_novo")===0;
  var modalidadeKit = sel ? modalidadeDe(s, sel.rev) : "padrao", ehPrata = modalidadeKit==="prata";
  var versaoBaseSel = kitSel ? versaoDoKit(s, kitSel) : null;
  var especialSel = sel ? comissaoEspecialDe(s, sel.rev) : null;   // comissão especial da revendedora (ficha em Atendimento interno › Revendedoras), 09/11/2026
  var versaoSel = versaoBaseSel ? versaoEfetiva(versaoBaseSel, modalidadeKit, especialSel) : null;
  var formas = s.formasPagamento || formasPagamentoPadrao();
  var formaDe = function(k){ var fd = formas.find(function(f){return f.k===k;}) || {k:k, label:k, parcelas:false, descricoes:[]}; return k==="acerto_loja" ? Object.assign({}, fd, {label:"Inadimplência"}) : fd; };   // acerto com loja = inadimplência para a representante (02/11/2026, Marcus)
  // Pagamento: soma de todos os lançamentos (cada um entra inteiro, sem dividir por parcela). Se faltar algo e existir
  // um acordo salvo cuja soma das parcelas fecha exatamente a diferença (folga de 1 centavo), libera o brinde do mesmo jeito.
  // Toda a conta do acerto vem de domain/acerto-derivado.js (a mesma da Calculadora de acertos do atendimento interno).
  var vezAtual = kitSel ? vezCobravel(kitSel.remarcacoesLista) : 0;
  var condicionaisRev = sel ? ((s.perfisRev[sel.rev]||{}).condicionaisAbertas || []) : [];
  // 05/11/2026 (Marcus): as condicionais que VOLTAM no acerto vêm da DevMaster (condicionais abertas da revendedora), não do cadastro local. Só Acerto + kit de revendedora da carteira real (tem código).
  // Entram todas as abertas (kit principal e reposição). As digitadas à mão ("+ Condicional") continuam.
  var codDm = kitSel ? (kitSel.codRev || (sel && sel.cod) || "") : "", condCarregada = useRef({});
  useEffect(function(){
    if(!sel || !kitSel || !codDm || !apiAtiva() || kitSel.tipoKit!=="acerto_kit" || condCarregada.current[kitSel.id]) return;
    if((s.acertosConsignado||[]).some(function(r){ return r.kitId===kitSel.id && r.tipo==="acerto"; })) return;   // acerto já feito: não mexe
    condCarregada.current[kitSel.id] = true; var nomeRev = sel.rev;
    chamar("GET", "/representante/condicionais?resumo=1&produto="+KIT_APOIO.codigo+"&cod="+encodeURIComponent(codDm)).then(function(r){
      var abertas = (r.condicionais||[]).slice();   // todas as abertas (kit e reposição; expositor e encomenda a rota já tira). O kit novo só é emitido na DevMaster depois do acerto.
      var reais = abertas.map(function(c){ return {numero:c.numero, pecas:c.pecas, valor:c.valor, previsao:c.previsao, apoioQtd:c.produtoQtd||0, devmaster:true}; });
      var manuais = ((s.perfisRev[nomeRev]||{}).condicionaisAbertas||[]).filter(function(c){ return c.manual && !reais.some(function(x){ return x.numero===c.numero; }); });
      d({type:"REV_COND_DEFINIR", rev:nomeRev, lista:reais.concat(manuais)});
    }).catch(function(){ condCarregada.current[kitSel.id] = false; });
  }, [kitSel && kitSel.id, codDm]);
  // Depois de registrado, o acerto deste kit NÃO conta como dívida anterior (senão o pendente é contado duas vezes e a mensagem de fechamento sai errada)
  var regDoKit = kitSel ? (s.acertosConsignado||[]).find(function(r0){ return r0.kitId===kitSel.id && r0.tipo==="acerto"; }) : null;
  var dv = derivarAcerto({finalizado:!!jaAcertado, versaoBase:versaoBaseSel, modalidade:modalidadeKit, especial:especialSel, vez:vezAtual, form:Object.assign({}, acertoForm, {kitApoio:null}), condicionais:condicionaisRev, autoPecas:true, dividaAnterior:sel ? totalDividaAnterior(s.acertosConsignado, sel.rev, regDoKit && regDoKit.id) : 0});
  var apoioDisp = condicionaisRev.filter(function(c){ return (acertoForm.condicionaisSelecionadas||[]).indexOf(c.numero)>=0; }).reduce(function(t0,c){ return t0+(c.apoioQtd||0); }, 0);   // kit apoio (MP0063) que veio nas condicionais deste acerto
  var totalPagoAtual = dv.totalPagoAtual, acordoSoma = dv.acordoSoma, previaBase = dv.previaBase, faltaAtual = dv.faltaAtual, quitado = dv.quitado,
    acordoExistente = dv.acordoExistente, acordoValido = dv.acordoValido, previaAcerto = dv.previaAcerto, pecasCondSelecionadas = dv.pecasCondSelecionadas, pecasADevolver = dv.pecasADevolver;
  // Contexto do acerto para o Direcionar (Financeiro): vendas, valor a pagar e todos os pagamentos lançados (igual ao Interno); lista = pagamentos do acerto, com ou sem o que acabou de lançar
  var ctxPed = function(lista, dd, vb){ dd = dd || dv; var FM = {pix:"pix", pix_representante:"pix", link:"link", credito:"credito", debito:"getnet", dinheiro:"dinheiro"};
    return {vendas:dd.vendaEfetiva!=null ? dd.vendaEfetiva : (vb!=null ? vb : acertoForm.vendaBruta), aPagar:dd.totalAPagar, pagos:lista.filter(function(p){ return FM[p.forma]; }).map(function(p){ var m = /d+s*$/.exec(p.descricao||"");
      return {pid:p.pid||"", forma:FM[p.forma], valor:p.valor, cnpj:p.forma==="link" && m ? m[0].trim() : "", parc:p.parcelas>1 ? p.parcelas : 0, obs:p.forma==="pix_representante" ? "Pix representante" : (p.descricao||"")}; })}; };
  // Pagamento: a representante só informa FORMA + VALOR e o pedido de conta segue em segundo plano (Controle de pagamentos); o app nunca espera.
  var estPag = function(pg){ return pg.pid && kitSel ? estadoPagRep(s.lancFin, kitSel.id, pg.pid) : null; };
  var rotPag = function(pg){ if(pg.forma==="acerto_loja") return "Inadimplência"; var es = estPag(pg); return es && es.aguardando ? formaDe(pg.forma).label+(pg.forma==="credito" && pg.parcelas>1 ? " "+pg.parcelas+"x" : "") : rotuloPagamento(es ? Object.assign({}, pg, {descricao:es.conta}) : pg); };
  var avc = useState(null), avisoConta = avc[0], setAvisoConta = avc[1], esperandoConta = useRef({});
  useEffect(function(){   // conta que estava aguardando e chegou: aviso com som no app dela
    var chegou = null;
    acertoForm.pagamentos.forEach(function(pg){ var es = estPag(pg); if(!es) return;
      if(es.aguardando) esperandoConta.current[pg.pid] = true;
      else if(esperandoConta.current[pg.pid]){ delete esperandoConta.current[pg.pid]; chegou = {valor:pg.valor, conta:es.conta}; } });
    if(chegou){ plim(); setAvisoConta(chegou); }
  }, [s.lancFin, acertoForm.pagamentos]);
  // Dias de atraso vêm do pré-acerto e ficam travados no acerto (02/11/2026, Marcus). Acerto já registrado mostra o que foi gravado.
  // MULTAS AUTOMÁTICAS (26/11/2026, Marcus): ao abrir o acerto o sistema calcula o atraso e as remarcações (rota /representante/multas) e já aplica no kit; a representante só confirma.
  // Zerar fica escondido atrás do toque duplo no bloco (ver blocoMultas). Sem a revendedora no atendimento interno, nada muda e o acerto segue como antes.
  var mtS = useState({}), multasAuto = mtS[0], setMultasAuto = mtS[1], meS = useState(false), multaEdita = meS[0], setMultaEdita = meS[1], toqueMulta = useRef(0);
  var codMulta = sel && sel.cod ? String(sel.cod) : "";
  useEffect(function(){ if(tela!=="calcacerto" || !kitSel || jaAcertado || !codMulta || !apiAtiva()) return; var vivo = true;
    chamar("GET", "/representante/multas?cod="+encodeURIComponent(codMulta)).then(function(j){ if(vivo && j) setMultasAuto(function(o){ var n = Object.assign({}, o); n[codMulta] = j; return n; }); }).catch(function(){});
    return function(){ vivo = false; }; }, [tela, selId]);   // eslint-disable-line react-hooks/exhaustive-deps
  var maAuto = multasAuto[codMulta] || null, paK = (kitSel && kitSel.preAcerto) || {};
  useEffect(function(){ if(!maAuto || !maAuto.achou || !kitSel || jaAcertado || paK.confirmada || paK.editada) return;
    var cobK = vezCobravel(kitSel.remarcacoesLista||[]), isK = (kitSel.remarcacoesLista||[]).length - cobK, r0 = maAuto.remarcacoes || {};
    if(!paK.auto || (paK.atrasoDias||0)!==maAuto.atrasoDias || cobK!==(r0.cobraveis||0) || isK!==(r0.isentas||0)) d({type:"KIT_MULTAS", id:kitSel.id, atrasoDias:maAuto.atrasoDias, cobraveis:r0.cobraveis||0, isentas:r0.isentas||0, auto:{atrasoDias:maAuto.atrasoDias, cobraveis:r0.cobraveis||0}});
  }, [maAuto, kitSel && kitSel.id, paK.confirmada, paK.editada, paK.auto && 1]);   // eslint-disable-line react-hooks/exhaustive-deps
  var atrasoPre = kitSel && kitSel.preAcerto ? (kitSel.preAcerto.atrasoDias||0) : 0;
  useEffect(function(){ if(tela!=="calcacerto" || !kitSel || jaAcertado) return; if((acertoForm.atrasoDias||0)!==atrasoPre) setAcertoForm(function(f0){ return Object.assign({}, f0, {atrasoDias:atrasoPre}); }); }, [tela, atrasoPre, acertoForm.atrasoDias, selId]);
  useEffect(function(){ if(!avisoConta) return; var tm = setTimeout(function(){ setAvisoConta(null); }, 12000); return function(){ clearTimeout(tm); }; }, [avisoConta]);
  // LINK DE PAGAMENTO NO ACERTO (26/11/2026, Leonardo: "a representante não tem que anexar o comprovante"; "o importante é o link: tem comprovante e foi pago, não pode ter divergência").
  // O valor vem SEMPRE do link (servidor: /api/representante/links, com o saldo de cada link). Três caminhos:
  //  1. Link pago até ontem entra sozinho como "✓ pago por link", com o comprovante do setor de links (mesma regra do Atendimento Sorelly: cobre até o que falta; o resto fica para o próximo acerto).
  //  2. "+ Lançar pagamento → Link" mostra os links pagos para ela tocar, sem digitar valor. Linha "Link" digitada com o MESMO valor de um link é ligada a ele e recebe o comprovante sozinha.
  //  3. Linha "Link" digitada com valor DIFERENTE: o cartão avisa e oferece "Usar o link de R$ X" (troca a linha pela do link). Enquanto houver linha assim, o sistema não lança link sozinho (não duplica).
  var lkPg = useLinksPagos(tela==="calcacerto" && kitSel && !jaAcertado && apiAtiva() ? sel.rev : ""), lkBaixando = useRef({});
  var linkDaLinha = function(pg){ return pg.linkSolId ? lkPg.links.find(function(x){ return x.id===pg.linkSolId; }) || null : null; };
  var linksLivres = function(lista){ var ja = {}; (lista || acertoForm.pagamentos).forEach(function(q){ if(q.linkSolId) ja[q.linkSolId] = 1; }); return lkPg.links.filter(function(x){ return !ja[x.id] && !x.acertoId && x.saldo>0.009; }); };
  var contaDoLinkRep = function(x){ var lista = formaDe("link").descricoes || [], dsc = x.cnpjId ? lista.find(function(c){ return String(c).replace(/\s+/g, " ").endsWith(" - "+x.cnpjId); }) : null; return dsc || (lista.length===1 ? lista[0] : (x.meio || "LINK")); };
  var linhaDoLink = function(x, valor){ return {forma:"link", descricao:contaDoLinkRep(x), parcelas:x.parcelas || 1, bandeira:x.bandeira || "", data:String(x.pagoEm || "").slice(0, 10) || isoDia(new Date()), valor:valor,
    anexo:x.comprovante ? {nome:x.comprovante.nome, tipo:x.comprovante.mime, link:x.id} : null, linkSolId:x.id, jaPagoLink:true}; };
  // põe o link no acerto (no lugar de "trocar", se vier): valor = saldo do link, até o que falta pagar
  var usarLink = function(x, trocar){
    var resto = acertoForm.pagamentos.filter(function(q){ return q!==trocar; }), falta = Math.max(0, Math.round(((dv.restanteTotal||0)+(trocar ? Number(trocar.valor)||0 : 0))*100)/100), valor = Math.min(x.saldo, falta);
    if(!(valor>0.009)) return;
    var novos = resto.concat([linhaDoLink(x, valor)]);
    if(trocar && trocar.pid && kitSel) d({type:"REP_PAG", op:"remover", kitId:kitSel.id, pid:trocar.pid, ctx:ctxPed(novos)}); else if(kitSel) d({type:"REP_PAG", op:"ctx", kitId:kitSel.id, ctx:ctxPed(novos)});
    setAcertoForm(Object.assign({}, acertoForm, {pagamentos:novos}));
  };
  var linhaDivergente = function(pg){ return pg.forma==="link" && pg.pid && !pg.linkSolId; };
  useEffect(function(){
    if(!kitSel || jaAcertado || !lkPg.links.length) return;
    var liga = linksDosPagamentos(lkPg.links, acertoForm.pagamentos);
    if(Object.keys(liga).length){ setAcertoForm(function(f0){ return Object.assign({}, f0, {pagamentos:f0.pagamentos.map(function(x){ var y = x.pid && liga[x.pid]; return y && !x.linkSolId ? Object.assign({}, x, {linkSolId:y.id}) : x; })}); }); return; }
    // 1. link pago até ontem entra sozinho (um por vez; não entra se ela já digitou uma linha Link sem link, para não duplicar)
    var auto = dv.previaBase && (dv.restanteTotal||0)>0.009 && !acertoForm.pagamentos.some(linhaDivergente) ? linksLivres().find(function(x){ return x.usavel; }) : null;
    if(auto){ usarLink(auto); return; }
    // comprovante anexado depois no setor de links: a linha do link já lançada recebe a marca
    if(acertoForm.pagamentos.some(function(q){ var x = q.jaPagoLink && !q.anexo && linkDaLinha(q); return x && x.comprovante; })) setAcertoForm(function(f0){ return Object.assign({}, f0, {pagamentos:f0.pagamentos.map(function(q){ var x = q.jaPagoLink && !q.anexo && linkDaLinha(q); return x && x.comprovante ? Object.assign({}, q, {anexo:{nome:x.comprovante.nome, tipo:x.comprovante.mime, link:x.id}}) : q; })}); });
    acertoForm.pagamentos.forEach(function(pg){
      var x = linkDaLinha(pg), es = estPag(pg); if(!x || !x.comprovante || pg.anexo || !es || es.aguardando || Date.now()-(lkBaixando.current[pg.pid]||0)<60000) return;   // falhou: tenta de novo depois de 1 minuto
      lkBaixando.current[pg.pid] = Date.now(); var kid = kitSel.id;
      comprovanteDoLink(sel.rev, x.id).then(function(an){
        setAcertoForm(function(f0){ return Object.assign({}, f0, {pagamentos:f0.pagamentos.map(function(z){ return z.pid===pg.pid && !z.anexo ? Object.assign({}, z, {anexo:an}) : z; })}); });
        d({type:"REP_PAG", op:"comprovante", kitId:kid, pid:pg.pid, anexo:an});
      }, function(){ lkBaixando.current[pg.pid] = Date.now(); });
    });
  }, [lkPg.versao, acertoForm.pagamentos, s.lancFin, kitSel && kitSel.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  var abriuRef = useRef(null);
  useEffect(function(){ if(!EXEMPLO) return; var lg = s.listagens.find(function(x){ return x.rep===l.rep && !x.fechada; }) || s.listagens.find(function(x){ return x.rep===l.rep; });
    if(!lg){ d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:"Curitiba", horario:"10:00"}); return; }
    if(!s.kits.some(function(k){ return k.lid===lg.id && k.rev===DEMO_REV; })) d({type:"ADD_KIT", lid:lg.id, rev:DEMO_REV, bairro:"Curitiba", vendas:[], cod:"999999", fone:"41900000000", tipoKit:"acerto_kit", porApp:true, hora:null}); }, [EXEMPLO, s.listagens.length, s.kits.length]);
  useEffect(function(){ if(!EXEMPLO || !sel || sel.rev!==DEMO_REV || !kitSel || jaAcertado || pendAbrir || acertoForm.vendaBruta!=null || abriuRef.current==="ex:"+sel.id) return; abriuRef.current = "ex:"+sel.id; setPendAbrir("exemplo"); }, [EXEMPLO, selId, kitSel && kitSel.id, acertoForm.vendaBruta]);
  useEffect(function(){ if(!p.abrir || abriuRef.current===p.abrir.n) return; var alvo = cart.find(function(r){ return r.rev===p.abrir.rev && r.hoje; }); if(!alvo) return; abriuRef.current = p.abrir.n; setSel(alvo.id);
    if(p.abrir.destino==="kitnovo") setTela("entregakit"); else if(p.abrir.destino==="reposicao"){ setTela("reposicao"); } else setPendAbrir(p.abrir.n); }, [p.abrir && p.abrir.n, cart.length]);   // atalhos da aba Apps: Acerto completo, Kit novo e Reposição
  useEffect(function(){
    if(!pendAbrir || !abrirEf || !kitSel || !sel || sel.rev!==abrirEf.rev || !versaoBaseSel) return;
    var cz = abrirEf.cenario;   // 02/11/2026 (Marcus): opção "Acerto completo" da aba Apps: um acerto 100% preenchido para visualizar
    var iguais = !cz || (condicionaisRev.length===cz.conds.length && cz.conds.every(function(c){ return condicionaisRev.some(function(x){ return x.numero===c.n && x.pecas===c.p; }); }));
    if(!iguais){ d({type:"REV_COND_DEFINIR", rev:sel.rev, lista:cz.conds.map(function(c){ return {numero:c.n, pecas:c.p, manual:true}; })}); return; }   // exemplo: a revendedora fica com exatamente estas condicionais; roda de novo quando entrarem
    var conds = cz ? cz.conds.map(function(c){ return c.n; }) : condicionaisRev.slice(0,2).map(function(c){ return c.numero; }), hoje = isoDia(new Date());
    var conta = function(form){ return derivarAcerto({versaoBase:versaoBaseSel, modalidade:modalidadeKit, especial:especialSel, vez:vezAtual, form:form, condicionais:condicionaisRev, autoPecas:true, dividaAnterior:totalDividaAnterior(s.acertosConsignado, sel.rev)}); };
    if(cz) conta = function(form){ return derivarAcerto({versaoBase:versaoBaseSel, modalidade:modalidadeKit, especial:especialSel, vez:1, form:form, condicionais:condicionaisRev, autoPecas:true, dividaAnterior:totalDividaAnterior(s.acertosConsignado, sel.rev)}); };   // exemplo: já conta com 1 multa de remarcação
    var base = Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:cz ? cz.venda : 3000, condicionaisSelecionadas:conds});
    var valor = conta(base).previaBase ? conta(base).previaBase.valorDevido : 0;
    var comPag = Object.assign({}, base, {pagamentos:[{forma:"pix", descricao:"PIX - POINT", parcelas:1, data:hoje, valor:cz ? cz.pago : valor, anexo:null}]});
    var d1 = conta(comPag), brindes = [];
    if(cz && cz.brindes) brindes = cz.brindes.map(function(b){ return {cat:b.cat, codigo:b.codigo, valor:b.valor, origem:"antiga"}; });   // exemplo: brindes lançados do jeito que o Marcus passou
    else {
      if(d1.libN>0) brindes.push({cat:"normal", codigo:"N1287", valor:d1.libN, origem:"nova"});
      if(d1.libS>0) brindes.push({cat:"bb", codigo:"BB0001", valor:d1.libS, origem:"nova"});
    }
    if(cz){   // exemplo Acerto completo (03/11/2026, Marcus): 4 formas de pagamento (link já pago, Pix, crédito em 3x e dinheiro), faltando R$ 200,00 para lançar um pagamento
      var arred = function(x){ return Math.round(x*100)/100; };
      var listaPag = function(pg){ var ontem = isoDia(new Date(Date.now()-86400000)), lk = arred(pg*.22), lh = arred(pg*.12), px = arred(pg*.15), px2 = arred(pg*.10), px3 = arred(pg*.06), cr = arred(pg*.20), db = arred(pg*.08), dn = arred(pg-lk-lh-px-px2-px3-cr-db);   // 26/11/2026 (Marcus): exemplo de 135 peças vendidas, 2 links (1 pago ontem e 1 pago hoje), 3 Pix, crédito, débito e dinheiro
        var descLink = (formaDe("link").descricoes||[])[0] || "LINK - SICREDI - SERENITY - 59";
        return [{forma:"link", descricao:descLink, parcelas:1, data:ontem, valor:lk, anexo:null, jaPagoLink:true},
          {forma:"link", descricao:descLink, parcelas:1, data:hoje, valor:lh, anexo:null, jaPagoLink:true},
          {forma:"pix", descricao:"", pid:"pexemplo"+kitSel.id, parcelas:1, data:hoje, valor:px, anexo:null},
          {forma:"pix", descricao:"", pid:"pexemplo2"+kitSel.id, parcelas:1, data:hoje, valor:px2, anexo:{nome:"comprovante-pix-2.jpg", tipo:"image/jpeg", dados:null, tamanho:0}},
          {forma:"pix", descricao:"", pid:"pexemplo3"+kitSel.id, parcelas:1, data:hoje, valor:px3, anexo:{nome:"comprovante-pix-3.jpg", tipo:"image/jpeg", dados:null, tamanho:0}},
          {forma:"credito", descricao:"CRÉDITO - CIELO - P", parcelas:3, data:hoje, valor:cr, anexo:{nome:"comprovante-cartao.jpg", tipo:"image/jpeg", dados:null, tamanho:0}},
          {forma:"debito", descricao:(formaDe("debito").descricoes||[])[0] || "DÉBITO", parcelas:1, data:hoje, valor:db, anexo:{nome:"comprovante-debito.jpg", tipo:"image/jpeg", dados:null, tamanho:0}},
          {forma:"dinheiro", descricao:(formaDe("dinheiro").descricoes||[])[0] || "Dinheiro", parcelas:1, data:hoje, valor:dn, anexo:null}]; };
      var fimF = Object.assign({}, base, {garantia:cz.garantia||0, atrasoDias:9, brindes:brindes, trocas:cz.trocas||[], pecasVendidas:cz.vendidas}), pagoF = valor;
      var devidoF = conta(Object.assign({}, fimF, {pagamentos:listaPag(valor)})).previaBase;   // 26/11/2026 (Marcus): a conta é sempre automática (comissão da tabela, atraso, remarcação, crédito, trocas); só o quanto ela pagou é do exemplo: falta 3% do valor devido
      pagoF = devidoF ? arred(devidoF.valorDevido*(1-(cz.pendentePct||0)/100)) : valor;
      comPag = Object.assign({}, fimF, {pagamentos:listaPag(pagoF)}); d1 = conta(comPag); }
    if(cz){ if(!(kitSel.remarcacoesLista||[]).length) d({type:"KIT_REMARCAR", id:kitSel.id, isenta:false, motivo:""}); if(!kitSel.preAcerto || kitSel.preAcerto.atrasoDias!==9) d({type:"KIT_PRE_ACERTO", id:kitSel.id, atrasoDias:9}); }   // exemplo Acerto completo: pré-acerto já preenchido com 1 multa e 9 dias de atraso (02/11/2026, Marcus)
    if(cz) comPag.pagamentos.filter(function(x){ return x.pid && !estadoPagRep(s.lancFin, kitSel.id, x.pid); }).forEach(function(pxEx){ d({type:"REP_PAG", op:"pedir", kitId:kitSel.id, rev:sel.rev, rep:l.rep, pid:pxEx.pid, forma:"pix", valor:pxEx.valor, parcelas:1, data:hoje, anexo:pxEx.anexo, ctx:ctxPed(comPag.pagamentos, d1, comPag.vendaBruta)}); });
    var prox = []; for(var q=0; q<Math.min(3, d1.pecasProx ? d1.pecasProx.liberadas : 0); q++) prox.push("P"+(2001+q));
    setAcertoForm(Object.assign({}, comPag, {pagamentos:comPag.pagamentos.concat(pagamentosDoPedido(s.lancFin, kitSel.id, s).filter(function(x){ return !comPag.pagamentos.some(function(y){ return y.pid===x.pid; }); })), garantia:(function(){ var cg = creditoDisponivel(s, sel.rev); return cg>0 ? cg : (cz ? (cz.garantia||0) : 0); })(), pecasVendidas:cz ? cz.vendidas : null, brindes:brindes, pecasProxCodigos:prox}));
    setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(5); setTela("calcacerto"); setPendAbrir(null);
  }, [pendAbrir, selId, condicionaisRev.length]);
  var credGarantia = sel ? creditoDisponivel(s, sel.rev) : 0;
  useEffect(function(){ if(credGarantia>0 && acertoForm.garantia!==credGarantia) setAcertoForm(function(f0){ return Object.assign({}, f0, {garantia:credGarantia}); }); }, [credGarantia, selId, tela]);   // o crédito lançado pela Garantia vale sempre (a representante não digita) // eslint-disable-line react-hooks/exhaustive-deps
  var toggleCondicional = function(numero){ var o = acertoForm.condicionaisSelecionadas.slice(), i = o.indexOf(numero);
    if(i>=0) o.splice(i,1); else o.push(numero); setAcertoForm(Object.assign({}, acertoForm, {condicionaisSelecionadas:o})); };
  var expositoresRev = sel ? ((s.perfisRev[sel.rev]||{}).expositores || []) : [];
  var condAbertasFicam = condicionaisRev.filter(function(c){ return acertoForm.condicionaisSelecionadas.indexOf(c.numero)<0; });
  var expFicam = expositoresRev.filter(function(x){ return (acertoForm.expositoresMarcados||[]).indexOf(x.id)<0; });
  var kitNovoSugerido = kitSel ? sugerido(sel.vendas, s.cfg) : null;
  // Acordeão da Calculadora de acertos: aparece direto dentro da tela da revendedora (não é uma tela separada).
  var BR2 = BR;
  var checkOk = e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-[#CA8A0426] text-[#CA8A04]"}, e(Icon,{n:"check", s:13}));
  var badgeTxt = function(txt, cor){ return ["#374151","#64748B"].indexOf(cor)>=0 ? e("span",{"aria-label":"Pendente", className:"size-6 shrink-0 rounded-full ring-1 ring-white/25"}) : checkOk; };   // 02/11/2026 (Marcus): nada escrito nas abas, só o check; pendente = círculo vazio
  // Ao abrir um bloco, ele SOBE até o topo, logo abaixo do cabeçalho fixo (02/11/2026, Marcus): os blocos de cima saem de vista e a tela vai subindo sozinha.
  var subirBloco = function(el){ try{
    var c = el.parentElement; while(c && !/(auto|scroll)/.test(getComputedStyle(c).overflowY)) c = c.parentElement;
    if(!c) return;
    var h = document.getElementById("hdr-calc"), alturaCab = h ? h.getBoundingClientRect().height : 0, cr = c.getBoundingClientRect(), er = el.getBoundingClientRect();
    c.scrollTo({top:c.scrollTop + (er.top - cr.top) - alturaCab + 4, behavior:"smooth"});
  }catch(x){} };
  var blocoAcordeao = function(idx, icone, cor, titulo, subtitulo, status, conteudo){
    var aberto = blocoAberto===idx;
    return e("div",{key:idx, "data-bloco":idx, className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"},
      e("button",{onClick:function(ev){ if(travaExcedente && (idx===5 || idx===6 || idx===7)){ irPagar(); return; } var alvo = ev.currentTarget.parentElement; setBlocoAberto(aberto?null:idx); if(!aberto) setTimeout(function(){ subirBloco(alvo); }, 90); }, className:"flex w-full items-center gap-3 p-3 text-left"},
        e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:"#CA8A0426", color:"#CA8A04"}}, e(Icon,{n:icone, s:18})),   // 02/11/2026 (Marcus): todos os blocos na mesma cor neutra do Condicionais
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[14px]"}, titulo)),   // sem minitexto embaixo do título (02/11/2026, Marcus)
        status,
        e(Icon,{n: aberto?"chevrondown":"chevron", s:15, className:"text-[#8E8E93]"})),
      aberto && e("div",{className:"flex flex-col gap-2.5 border-t border-white/5 p-1.5"+(jaAcertado ? " pointer-events-none select-text" : "")}, conteudo));
  };
  var gerais = versaoSel ? versaoSel.gerais : {};
  var campo = "h-9 rounded-lg bg-black/50 px-2 text-[13px] text-white outline-none ring-1 ring-white/10";
  var campoGrande = "h-11 w-full rounded-xl bg-black/50 px-3 text-left text-[15px] font-semibold text-white outline-none ring-1 ring-white/10";
  var kitNovoMin = dv.kitNovoMin, pctPagoAcerto = dv.pctPagoAcerto, kitNovoLiberado = dv.kitNovoLiberado, pagamentoParcial = dv.pagamentoParcial;
  var tetoFalta = dv.tetoFalta, faixaMinBrinde = dv.faixaMinBrinde, brindeBloqueio = dv.brindeBloqueio, brindeLiberado = dv.brindeLiberado,
    libN = dv.libN, libS = dv.libS, confBrinde = dv.confBrinde, excedenteBrinde = dv.excedenteBrinde, totalAPagar = dv.totalAPagar, restanteTotal = dv.restanteTotal;
  var irPagar = function(){ setLancForm(Object.assign({}, LANC_VAZIO, {valor: restanteTotal>0.009 ? Math.round(restanteTotal*100)/100 : null})); setLancAberto(true); setBlocoAberto(3); };   // volta aos pagamentos com o valor da diferença já preenchido
  var travaExcedente = excedenteBrinde>0.009 && restanteTotal>0.009;   // brinde acima do liberado: a diferença precisa ser paga antes de seguir (Marcus, 03/11/2026)
  // 27/11/2026 (Marcus): um campo só; o código decide a categoria (começa com BB = Select, o resto = Normal).
  var codigoCompleto = function(c){ return /[0-9]{4,}$/.test(c||""); };   // só busca o preço com pelo menos 4 números (Marcus, 27/11/2026)
  var catDe = function(c){ return /^BB/i.test(c||"") ? "bb" : "normal"; };
  var lancarBrinde = function(codNovo, origemNova){
    var f0 = brindeIn.normal, f = Object.assign({}, f0, {codigo:codNovo || f0.codigo}), cat = catDe(f.codigo);
    var pc = pecasCondAtivas && pecasCondAtivas[normalizarCodigo(f.codigo)];
    f.origem = pc ? pc.origem : null;
    var val = pc && pc.valor>0 ? pc.valor : f.valor;
    if(!(codigoBrindeValido(cat, f.codigo) && codigoCompleto(f.codigo) && pc && val>0 && f.origem)) return;
    var o = {}; o.normal = {codigo:"", valor:null, origem:f.origem};
    setBrilhoBrinde(normalizarCodigo(f.codigo)); setTimeout(function(){ setBrilhoBrinde(""); }, 1800);
    setAcertoForm(Object.assign({}, acertoForm, {brindes:acertoForm.brindes.concat([{cat:cat, codigo:normalizarCodigo(f.codigo), valor:val, origem:f.origem}])}));
    setBrindeIn(Object.assign({}, brindeIn, o));
  };
  // Código da peça digitado no brinde: o preço vem sozinho da DevMaster (26/11/2026, Marcus). Sem preço ou sem ligação: a representante digita o valor, como antes.
  // 27/11/2026 (Marcus): o brinde só aceita código de peça das condicionais ATIVAS da revendedora (DevMaster), nunca código solto; o valor vem da própria condicional.
  var exS = useState(-1), exclBrinde = exS[0], setExclBrinde = exS[1];
  var poS = useState(false), pedeOrigem = poS[0], setPedeOrigem = poS[1];
  var bgS = useState(""), brilhoBrinde = bgS[0], setBrilhoBrinde = bgS[1];
  var csS = useState(null), pecasCondAtivas = csS[0], setPecasCondAtivas = csS[1], revCodBrinde = String((kitSel && kitSel.codRev) || (sel && sel.cod) || "");
  useEffect(function(){
    if(!revCodBrinde || !apiAtiva()){ setPecasCondAtivas(null); return; }
    var vivo = true;
    chamar("GET", "/representante/condicionais?cod="+encodeURIComponent(revCodBrinde)).then(function(r){
      if(!vivo) return; var m = {};
      var conds = r.condicionais||[], maisNova = conds.reduce(function(t,c){ return String(c.emissao||"")>t ? String(c.emissao||"") : t; }, "");   // origem automática (Marcus, 27/11/2026): com 2 ou mais condicionais abertas, a mais recente é o kit novo; as outras são o kit antigo
      conds.forEach(function(c){ var org = conds.length>1 && String(c.emissao||"")===maisNova ? "nova" : "antiga"; (c.grupos||[]).forEach(function(g){ (g.itens||[]).forEach(function(i){ var k = normalizarCodigo(i.codigo); if(k && !m[k]) m[k] = {valor:Number(i.valor)||0, desc:i.desc||"", qtd:Number(i.qtd)||1, origem:org}; }); }); });
      setPecasCondAtivas(m);
    }).catch(function(){ if(vivo) setPecasCondAtivas(null); });
    return function(){ vivo = false; };
  }, [revCodBrinde]);
  // Situação da peça na condicional (Marcus, 27/11/2026): Brinde (já lançada), Troca, Vendida (não voltou na conferência da devolução) ou Liberada.
  var situacaoPeca = function(k){
    var kk = normalizarCodigo(k);
    if((acertoForm.brindes||[]).some(function(b){ return normalizarCodigo(b.codigo)===kk; })) return "Brinde";
    if((acertoForm.trocas||[]).some(function(t){ return normalizarCodigo(t.antigaCod)===kk || normalizarCodigo(t.novaCod)===kk; })) return "Troca";
    return "Liberada";
  };
  var buscaPrecoBrinde = function(cat, codigo){
    if(!codigoBrindeValido(catDe(codigo), codigo) || !codigoCompleto(codigo)) return;
    var cod = normalizarCodigo(codigo);
    if(pecasCondAtivas){ var pc = pecasCondAtivas[cod]; if(pc && pc.valor>0){ setBrindeIn(function(b){ if(normalizarCodigo((b.normal||{}).codigo)!==cod) return b; var o = {}; o.normal = Object.assign({}, b.normal, {valor:pc.valor}); return Object.assign({}, b, o); }); return; } }
    if(!apiAtiva()) return;
    chamar("GET", "/precos-pecas?codigos="+encodeURIComponent(cod)).then(function(r){ var p = r && r.itens && r.itens[cod];
      if(!p || !(p.preco>0)) return;
      setBrindeIn(function(b){ if(normalizarCodigo((b.normal||{}).codigo)!==cod) return b; var o = {}; o.normal = Object.assign({}, b.normal, {valor:p.preco}); return Object.assign({}, b, o); });
    }).catch(function(){});
  };
  // Brindes no mesmo desenho do bloco Condicionais (02/11/2026, Marcus): linhas, total logo abaixo, "Falta lançar" na última linha; formulário atrás de "+ Brinde".
  var blocoBrindesNovo = function(){
    var itens = acertoForm.brindes.map(function(b,i){ return {b:b, i:i}; });
    var totalLanc = confBrinde.lancadoNormal + confBrinde.lancadoSelect;
    var f = brindeIn.normal, cat = catDe(f.codigo), codOk = codigoBrindeValido(cat, f.codigo) && codigoCompleto(f.codigo), naCond = !codOk || (!!pecasCondAtivas && !!pecasCondAtivas[normalizarCodigo(f.codigo)]), situ = codOk && naCond ? situacaoPeca(f.codigo) : "", pronto = codOk && naCond && situ==="Liberada", origem = f.origem || null;
    var digitado = normalizarCodigo(f.codigo), sugestoes = (pecasCondAtivas && digitado.length>=1) ? Object.keys(pecasCondAtivas).filter(function(k){ return k.indexOf(digitado)===0; }).slice(0,30) : [], semResultado = !!pecasCondAtivas && digitado.length>=1 && sugestoes.length===0;
    var setF = function(patch){ var o = {}; o.normal = Object.assign({}, f, patch); setBrindeIn(Object.assign({}, brindeIn, o)); };
    var aberto = true;
    return e("div",{key:"bnovo", className:"flex flex-col gap-2"},
      aberto && e("div",{className:"flex flex-col gap-2 rounded-xl bg-white/5 p-1.5"},
        e("div",{className:"relative grid grid-cols-1 gap-1.5"},
          e("input",{value:f.codigo, placeholder:"BB0000", autoCapitalize:"characters", "aria-label":"Código da peça", onChange:function(ev){ var novoCod = limitarCodigo(ev.target.value); setF({codigo:novoCod, valor:null}); buscaPrecoBrinde(cat, novoCod); },
            className:"h-9 min-w-0 rounded-lg border-2 border-[#C9A13B] bg-black/50 px-2 text-center text-[15px] font-bold tracking-wide text-white outline-none placeholder:text-[15px] placeholder:font-semibold placeholder:text-[#C4C8CF] "+MONO+" uppercase"}),
                    sugestoes.length>0 && e("div",{className:"absolute inset-x-0 top-full z-30 mt-1 flex max-h-[216px] flex-col overflow-y-auto rounded-lg border-2 border-[#C9A13B] bg-white shadow-2xl"}, sugestoes.map(function(k){ var pc = pecasCondAtivas[k], st = situacaoPeca(k), livre = st==="Liberada";
          return e("button",{key:"sg"+k, type:"button", onClick:function(){ if(livre) lancarBrinde(k); }, className:"grid min-h-9 cursor-pointer grid-cols-[1fr_1fr_1fr] items-center gap-2 border-b border-[#E5E7EB] bg-white px-2 text-[13px] last:border-b-0 hover:bg-[#FEF3C7]"}, e("b",{className:MONO+" text-left text-[#111827]"}, k), e("span",{className:MONO+" text-center text-[#111827]"}, BK(pc.valor)), e("b",{className:"text-right "+(livre ? "text-[#15803D]" : "text-[#B45309]")}, st)); }))),
        semResultado && e("p",{className:"text-[12px] font-semibold text-red-400"}, "Nenhuma peça das condicionais ativas começa com "+digitado+"."),
        codOk && !naCond && e("p",{className:"text-[12px] font-semibold text-red-400"}, pecasCondAtivas ? "Peça fora das condicionais ativas." : "Condicionais da revendedora não carregadas."),
        codOk && naCond && situ!=="Liberada" && e("p",{className:"text-[12px] font-semibold text-red-400"}, "Essa peça já está como "+situ.toLowerCase()+"."),
        codOk && naCond && situ==="Liberada" && e("p",{className:"text-[12px] font-semibold text-green-400"}, "Peça liberada. Toque nela na lista para lançar.")),
        e("div",{key:"gradeBrindes", className:"grid grid-cols-2 items-stretch gap-1.5"}, [["normal","Normal",libN,confBrinde.lancadoNormal,confBrinde.restanteNormal],["bb","Brinde BB (Select)",libS,confBrinde.lancadoSelect,confBrinde.restanteSelect]].map(function(g){
        var its = itens.filter(function(x){ return x.b.cat===g[0]; });
        return e("div",{key:"gb"+g[0], className:"flex h-full flex-col overflow-hidden rounded-xl border border-[#C9A13B]/20"},
          e("div",{className:"flex min-h-8 flex-col justify-center gap-0.5 bg-white/[.07] px-2 py-1 text-[13px]"}, e("b",{className:"text-[13px] font-bold"}, g[1])),
          e("div",{className:"flex min-h-8 items-center justify-between gap-1 border-t border-white/10 px-2 text-[13px]"}, e("span",null,"Liberado"), e("b",{className:MONO+" whitespace-nowrap"}, BK(g[2]))),
          
          its.map(function(x){ var aberto = exclBrinde===x.i;
            return e("div",{key:"br"+x.i, className:"flex flex-col border-t border-white/10 transition-all duration-500 "+(brilhoBrinde===x.b.codigo ? "bg-[#C9A13B]/30 ring-2 ring-inset ring-[#E8B84B] shadow-[0_0_14px_#E8B84B]" : "")},
              e("div",{className:"flex items-center"},
              e("button",{type:"button", onClick:function(){ setExclBrinde(aberto ? -1 : x.i); }, "aria-expanded":aberto, "aria-label":"Brinde "+x.b.codigo+": tocar para excluir", className:"flex min-h-8 min-w-0 flex-1 cursor-pointer flex-nowrap items-center justify-between gap-x-1.5 whitespace-nowrap px-2 py-0.5 text-left text-[13px]"},
                e("span",{className:"flex shrink-0 items-center gap-1.5"}, e("span",{className:MONO}, x.b.codigo),
                e("span",{className:"shrink-0 rounded-full px-1.5 py-px text-[10px] font-bold "+(x.b.origem==="antiga" ? "bg-[#FEF3C7] text-[#92400E]" : "bg-[#DCFCE7] text-[#166534]")}, x.b.origem==="antiga" ? "ANTIGO" : "NOVO")),
                e("span",{className:MONO+" ml-auto shrink-0 whitespace-nowrap"}, BK(x.b.valor))),
              ),
              aberto && e("button",{type:"button", onClick:function(){ setExclBrinde(-1); setAcertoForm(Object.assign({}, acertoForm, {brindes:acertoForm.brindes.filter(function(y,j){return j!==x.i;})})); }, className:"mx-2 mb-1 h-8 rounded-lg bg-[#DC2626]/60 text-[13px] font-semibold text-white"}, "Excluir brinde")); }),
          e("div",{className:"mt-auto flex min-h-8 items-center justify-between gap-1 border-t border-white/10 px-2 text-[13px]"}, e("span",null,"Lançado"), e("b",{className:MONO+" whitespace-nowrap"}, BK(g[3]))),
          e("div",{className:"flex min-h-8 items-center justify-between gap-1 px-2 text-[13px] font-bold "+((g[2]-g[3])<-0.009 ? "bg-[#DC2626]/15 text-[#DC2626]" : "bg-[#C9A13B]/20")}, e("span",null,(g[2]-g[3])<-0.009 ? "Excedente" : "Restante"), e("b",{className:MONO+" whitespace-nowrap"}, BK(Math.abs(g[2]-g[3]))))); })));
  };

  // ── Cabeçalho fixo: título, ícone das regras, nome da revendedora e o consolidado padronizado (aparece quando preenche a venda) ──
  // Cabeçalho da calculadora (02/11/2026, Marcus escolheu o layout 2): SÓ Vendas, Comissão e Valor do acerto, em três linhas. Multa, pagamentos e restante ficam no bloco Vendas e pagamentos.
  // Bloco fechado de Vendas e pagamentos (02/11/2026, Marcus): do valor vendido ao valor a pagar; o fundo escurece de cima para baixo.
  var TOM_FECH = {t1:"bg-white/[.03]", t2:"bg-white/[.07]", t3:"bg-[#C9A13B]/20 font-semibold"};
  var linhaFech = function(k, tom, rot, direita){ return e("div",{key:k, className:"flex min-h-8 items-center justify-between gap-2 px-3 "+TOM_FECH[tom]+(k==="vv" ? "" : " border-t border-white/10")},
    e("span",{className:"text-[13px]"}, rot), direita); };
  var valorFech = function(sinal, txt){ return e("span",{className:"flex items-center gap-1.5"}, e("i",{className:"w-3 text-center text-[13px] font-semibold not-italic"}, sinal), e("b",{className:MONO+" text-[13px]"}, txt)); };
  var campoSel = "h-8 w-full rounded-lg bg-black/50 px-2 text-[13px] text-white outline-none ring-1 ring-white/10";
  var campoValor = "h-8 w-[7.5rem] rounded-lg bg-black/50 px-2 text-right text-[13px] font-semibold text-white outline-none ring-1 ring-white/10 "+MONO;
  var headerCalc = kitSel && e("div",{id:"hdr-calc", className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1.5 bg-[#0B0B0D] px-4 pb-1.5 pt-3 shadow-[0_6px_10px_rgba(0,0,0,.35)]"},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:function(){setTela("rev");}, "aria-label":"Voltar pra Revendedora", className:"grid size-8 shrink-0 place-items-center text-amber-200"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),   // sem borda nem fundo (Marcus, 04/11/2026)
      e("b",{className:douradoTitulo+" min-w-0 flex-1 leading-tight"}, "Calculadora de Acertos"),
      e("button",{onClick:function(){ setTelaAntes("calcacerto"); setTela("regras"); }, "aria-label":"Ver as regras", title:"Regras",
        className:"grid size-8 shrink-0 place-items-center text-amber-200"}, e(Icon,{n:"book", s:16}))),
    // Bloco compacto (Marcus, 04/11/2026): Vendas e Comissão lado a lado e o Valor do acerto na linha de baixo; fontes menores
    e("div",{className:"flex flex-col gap-0.5 rounded-xl bg-[#1C1C1E] px-2.5 py-1.5 ring-1 ring-amber-200/25"},
      e("div",{className:"flex items-center gap-2"},
        e("p",{className:"min-w-0 flex-1 truncate text-[13px] font-extrabold "+BR}, sel.rev),
        ehPrata && e("span",{className:"shrink-0 rounded-full bg-slate-300 px-2 py-0.5 text-[10.5px] font-black tracking-wider text-slate-900"}, "100% PRATA")),
      previaAcerto && e("div",{key:"tres", className:"mt-0.5 flex flex-col"},
        e("div",{className:"flex items-center justify-between gap-3 py-0.5"},
          e("span",{className:"flex items-baseline gap-1.5 whitespace-nowrap"}, e("span",{className:"text-[11px] "+BR}, "Vendas"), e("b",{className:MONO+" text-[13px] "+BR}, BK(dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta))),
          e("span",{className:"flex items-baseline gap-1.5 whitespace-nowrap"}, e("span",{className:"text-[11px] "+BR}, "Comissão"), e("b",{className:MONO+" text-[13px] "+BR}, previaAcerto.semFaixa ? "0%" : previaAcerto.comissaoPct+"%"))),
        e("div",{className:"mt-0.5 flex items-center justify-between gap-3 border-t border-[#C9A13B] pt-0.5"},
          e("span",{className:"text-[11px] font-bold text-amber-200"}, "Valor do acerto"),
          e("b",{className:MONO+" whitespace-nowrap text-[16px] text-amber-200"}, BK(previaAcerto.valorAcerto))))));

  // Payload único do acerto (usado na assinatura)
  // venda abaixo do mínimo geral (R$ 500, domain/consignado.js): pede o motivo antes de confirmar o acerto
  var vendaMotivo = dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta;
  var minVendaGeral = (dv.novas && dv.novas.minimoRepresentante) || NOVAS_PADRAO.minimoRepresentante, motivosVB = (dv.novas && dv.novas.motivosVendaBaixa) || NOVAS_PADRAO.motivosVendaBaixa;
  var vendaBaixa = vendaMotivo!=null && vendaMotivo < minVendaGeral;
  var aguardaContaN = acertoForm.pagamentos.filter(function(p){ var es = p.pid && estPag(p); return es && es.aguardando && !p.anexo; }).length, semCompN = acertoForm.pagamentos.filter(function(p){ var es = p.pid && estPag(p); return p.pid && !(es && es.aguardando) && !p.anexo; }).length;   // 25/11/2026 (Lucas): antes só contava quando o pedido já estava no celular; agora todo pagamento com conta pedida precisa do comprovante
  var compSoNoCelular = acertoForm.pagamentos.filter(function(p){ var es = p.pid && estPag(p); return p.pid && p.anexo && es && !es.aguardando && !es.comp; });   // anexou, mas o comprovante não chegou ao financeiro: reenvia ao confirmar
  var reenviarComp = function(){ if(kitSel) compSoNoCelular.forEach(function(p){ d({type:"REP_PAG", op:"comprovante", kitId:kitSel.id, pid:p.pid, anexo:p.anexo}); }); };   // Pix, link e cartão: conta do financeiro + comprovante antes de fechar
  var faltaMotivoVB = vendaBaixa && (!acertoForm.motivoVendaBaixa || (acertoForm.motivoVendaBaixa==="Outro" && !(acertoForm.motivoVendaBaixaTexto||"").trim()));
  var motivoVB = !vendaBaixa ? "" : acertoForm.motivoVendaBaixa==="Outro" ? (acertoForm.motivoVendaBaixaTexto||"").trim() : (acertoForm.motivoVendaBaixa||"");
  var payloadAcerto = function(extra){
    return Object.assign({type:"ACERTO_REGISTRAR", id:kitSel.id, motivoVendaBaixa:motivoVB, vendaBruta:dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta, vendaDigitada:acertoForm.vendaBruta, trocas:acertoForm.trocas||[], tagsDanificadas:acertoForm.tagsDanificadas||0, tagsValor:dv.tagsValor, devolvida:0, garantia:acertoForm.garantia||0,
      valorPago: acordoValido ? previaBase.valorDevido : totalPagoAtual, pagamentos:acertoForm.pagamentos, acordo: acordoExistente ? acertoForm.acordoParcelas : null,
      recusouNegociar:acertoForm.recusouNegociar, brindesLancados:acertoForm.brindes, excedenteBrinde:excedenteBrinde, kitApoio:Object.assign({}, dv.kitApoio, {disponivel:apoioDisp}),
      pecasVendidas:acertoForm.pecasVendidas, pecasBrinde:acertoForm.brindes.length, pecasTrocas:(acertoForm.trocas||[]).length,
      pecasADevolver:pecasADevolver, condicionaisSelecionadas:acertoForm.condicionaisSelecionadas,
      modalidade:modalidadeKit, atrasoDias:(ehPrata || dv.novas) ? (acertoForm.atrasoDias||0) : 0, diasQuitacao:acertoForm.diasQuitacao||0,
      pecasProxCodigos:acertoForm.pecasProxCodigos||[], pecasProxLiberadas:dv.pecasProx ? dv.pecasProx.liberadas : 0, kitNovoOk:!!acertoForm.kitNovoOk, expositoresMarcados:acertoForm.expositoresMarcados||[],
      pecasCond:pecasCondSelecionadas, formSnapshot:acertoForm}, extra||{});
  };

  // Modalidade do kit (Ouro ou 100% Prata): só na calculadora de acertos, no começo (Marcus, 03/11/2026); cada troca vai pro histórico.
  var modalidadeSel = sel ? modalidadeDe(s, sel.rev) : "padrao", histModalidade = sel ? ((s.perfisRev[sel.rev]||{}).modalidadeHist || []) : [];
  var trocarModalidade = function(m){ if(sel && m!==modalidadeSel) d({type:"SET_MODALIDADE", chave:sel.rev, modalidade:m, por:l.rep, origem:"representante"}); };
  // compacto: uma linha só, rótulo pequeno e dois botões baixos (a regra de cada kit fica em Regras)
  var blocoModalidade = sel && e("div",{className:"flex items-center gap-2 rounded-xl border "+LINHA_CARD+" bg-white px-2.5 py-1.5"},
    e("p",{className:"shrink-0 text-[10.5px] font-bold uppercase tracking-wide text-[#A67C12]"},"Kit"),
    e("div",{className:"grid flex-1 grid-cols-2 gap-1.5"}, [["padrao","Ouro"],["prata","100% Prata"]].map(function(o){ var ativo = modalidadeSel===o[0];
      return e("button",{key:o[0], onClick:function(){ trocarModalidade(o[0]); }, "aria-pressed":ativo, title:"Troca de modalidade: avisar com no mínimo 10 dias",
        className:"h-7 rounded-lg text-[11.5px] font-bold ring-1 "+(ativo ? (o[0]==="prata" ? "bg-slate-700 ring-slate-700 " : "bg-[#C9A13B] ring-[#C9A13B] ")+BR : "bg-white text-[#6B7280] ring-black/10")}, (ativo ? "✓ " : "")+o[1]); })),
    histModalidade.length>0 && e("span",{className:"shrink-0 text-[9.5px] text-[#9A8B63]", title:"Última troca"}, histModalidade[0].em.slice(0,10).split("-").reverse().slice(0,2).join("/")));
  var calcAcertoScreen = kitSel && e("div",{className:"-mx-3 flex flex-col gap-2.5 pb-72"},
    blocoModalidade,
    blocoAcordeao(0, "lista", "#CA8A04", "Condicionais",
      acertoForm.condicionaisSelecionadas.length ? acertoForm.condicionaisSelecionadas.length+" marcada(s) · "+pecasCondSelecionadas+" peças" : "Marque as condicionais em aberto conferidas",
      acertoForm.condicionaisSelecionadas.length ? badgeTxt(pecasCondSelecionadas+" peças","#CA8A04") : badgeTxt("Pendente","#64748B"),
      [condicionaisRev.length===0
        ? e("p",{key:"c0", className:"text-[13px] text-[#8E8E93]"},"Nenhuma condicional em aberto cadastrada para essa revendedora.")
        : e("div",{key:"c1", className:"flex flex-col gap-1.5"}, condicionaisRev.map(function(c){ var on = acertoForm.condicionaisSelecionadas.indexOf(c.numero)>=0;
            return e("label",{key:c.numero, className:"flex h-8 cursor-pointer items-center gap-2.5 border-b border-white/10 px-2.5 text-[13px]"},
              e("input",{type:"checkbox", className:"sr-only", checked:on, onChange:function(){ toggleCondicional(c.numero); }}),
              e("span",{className:"relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors "+(on ? "bg-[#C9A13B]" : "bg-[#D9CFB3]")}, e("span",{className:"absolute top-[3px] size-4 rounded-full bg-white transition-all "+(on ? "left-[19px]" : "left-[3px]")})),
              e("b",{className:"min-w-0 flex-1"}, "Condicional "+c.numero),
              e("span",{className:MONO+" text-[13px] font-bold"}, c.pecas+" peças")); })),
        // Bipar as peças que voltaram (Marcus, 24/11/2026): marcou as condicionais, o botão junta todas num kit só e abre a câmera (mobile/conf-devolucao.js)
        acertoForm.condicionaisSelecionadas.length>0 && codDm && e("div",{key:"cb", className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"},
          acertoForm.devolucaoBip && acertoForm.devolucaoBip.resumo && e("p",{className:"text-center text-[13px] font-semibold text-amber-200"},
            "Bipadas: "+acertoForm.devolucaoBip.resumo.voltaram+" de "+acertoForm.devolucaoBip.resumo.saiu+" voltaram · "+acertoForm.devolucaoBip.resumo.vendidas+" vendidas"),
          e("button",{onClick:function(){ setTela("confdev"); }, className:"h-10 w-full rounded-xl text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}},
            acertoForm.devolucaoBip && acertoForm.devolucaoBip.resumo ? "Continuar bipando as peças que voltaram" : "Bipar as peças que voltaram")),
        expositoresRev.length>0 && e("div",{key:"cx", className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"},
          e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Expositores com a revendedora"),
          expositoresRev.map(function(x){ var on = (acertoForm.expositoresMarcados||[]).indexOf(x.id)>=0;
            return e("label",{key:x.id, className:"flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 "+(on?"bg-amber-200/15":"bg-white/5")},
              e("span",{className:"flex items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(){
                var m = acertoForm.expositoresMarcados||[]; setAcertoForm(Object.assign({}, acertoForm, {expositoresMarcados: on ? m.filter(function(i){return i!==x.id;}) : m.concat([x.id])})); }}), x.qtd+" "+x.nome.toLowerCase()),
              e("span",{className:"text-[11px] text-[#8E8E93]"}, on ? "conferido" : "com ela")); })),
        e("div",{key:"ct", className:"flex items-center justify-between gap-2 border-t border-amber-200/40 px-2.5 pt-2 text-[13px]"},
          e("button",{onClick:function(){ setCondFormAberto(!condFormAberto); }, className:"h-8 shrink-0 rounded-lg border border-dashed border-amber-200/60 px-3 text-[13px] font-semibold text-amber-200"}, "+ Condicional"),
          e("span",{className:"min-w-0 flex-1 text-center font-semibold"},"Total conferido"),   // rótulo no meio, número na ponta (02/11/2026, Marcus)
          e("b",{className:MONO+" shrink-0 pr-1 text-right text-[15px] text-amber-200"}, String(pecasCondSelecionadas))),
        condFormAberto && e("div",{key:"cm", className:"flex flex-col gap-1.5 rounded-xl bg-white/5 p-2.5"},   // só abre ao tocar em + Condicional (02/11/2026, Marcus): Código, Peças e Adicionar
          e("div",{className:"flex items-center gap-1.5"},
            e("input",{value:condManual.numero, inputMode:"numeric", placeholder:"Código", "aria-label":"Código da condicional", onChange:function(ev){ setCondManual(Object.assign({}, condManual, {numero:ev.target.value.replace(/[^0-9]/g,"").slice(0,8)})); },
              className:"h-8 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-[13px] text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("input",{value:condManual.pecas, inputMode:"numeric", placeholder:"Peças", "aria-label":"Quantidade de peças", onChange:function(ev){ setCondManual(Object.assign({}, condManual, {pecas:ev.target.value.replace(/[^0-9]/g,"").slice(0,4)})); },
              className:"h-8 w-[4.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-center text-[13px] text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("button",{disabled:!condManual.numero || !(+condManual.pecas>0), onClick:function(){ d({type:"REV_COND_ADD", rev:sel.rev, numero:condManual.numero, pecas:+condManual.pecas});
              setAcertoForm(Object.assign({}, acertoForm, {condicionaisSelecionadas:acertoForm.condicionaisSelecionadas.concat([condManual.numero])})); setCondManual({numero:"", pecas:""}); setCondFormAberto(false); },
              className:"h-8 shrink-0 rounded-lg px-3 text-[13px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}}, "Adicionar")))]),   // 26/11/2026 (Marcus): saiu o botão "Peças vendidas" (anotar na mão); agora o total de vendidas vem do bip (peças que voltaram)
    // Multa por remarcação: SOMENTE LEITURA (02/11/2026, Marcus). Remarcações e dias de atraso vêm do Pré-acerto; aqui chegam travados ("é o sistema"). Valor pendente saiu: é da Inadimplência.
    blocoAcordeao(1, "calendario", "#7C3AED", "Multa por remarcação",
      (kitSel.remarcacoesLista||[]).length ? (kitSel.remarcacoesLista.length)+" remarcação(ões) · "+vezCobravel(kitSel.remarcacoesLista)+" com multa" : "Nenhuma remarcação neste kit",
      checkOk,
      (function(){
        var lista = kitSel.remarcacoesLista||[], escR = versaoSel && versaoSel.remarcacao && vezAtual>0 ? versaoSel.remarcacao[Math.min(vezAtual, versaoSel.remarcacao.length)-1] : {comissaoPct:0, brindePct:0};
        var dias = acertoForm.atrasoDias||0, at = versaoSel && versaoSel.novas ? atrasoAcerto(dias, versaoSel.novas) : {comissaoPct:0, brindePct:0, tudo:false};
        var totC = at.tudo ? "Tudo" : "−"+Math.min(100, escR.comissaoPct+at.comissaoPct)+"%", totB = at.tudo ? "Tudo" : "−"+Math.min(100, escR.brindePct+at.brindePct)+"%";
        var linha = "flex min-h-8 items-center justify-between gap-2 border-b border-white/10", linhaT = "grid grid-cols-[1.1fr_1fr_1fr_1fr] items-center border-b border-white/10 text-right";
        return [e("p",{key:"travado", className:"text-[11px] font-bold uppercase"}, "Travado · definido no pré-acerto"),
          lista.length>0 ? e("div",{key:"rlist", className:"flex flex-col"}, lista.map(function(r,i){ return e("div",{key:i, className:linha},
              e("span",{className:"text-[13px] font-semibold"}, (i+1)+"ª remarcação"),
              e("span",{className:"text-[13px] "+(r.isenta ? "" : "font-bold")}, r.isenta ? "Isenta"+(r.motivo ? " · "+r.motivo : "") : "Com multa")); }))
            : e("p",{key:"r0", className:"text-[13px]"}, "Nenhuma remarcação."),
          (ehPrata || dv.novas) && e("div",{key:"atraso", className:linha},
            e("span",{className:"text-[13px] font-semibold"}, "Dias úteis de atraso"),
            e("b",{className:MONO+" text-[13px]"}, dias+(dias===1 ? " dia" : " dias"))),
          e("div",{key:"tab", className:"mt-1 flex flex-col"},
            e("div",{className:linhaT+" min-h-8 text-[11px] font-bold uppercase"}, e("span",null), e("span",null,"Remarcação"), e("span",null,"Atraso"), e("span",null,"Total")),
            [["Comissão", escR.comissaoPct, at.comissaoPct, totC], ["Brinde", escR.brindePct, at.brindePct, totB]].map(function(c){
              return e("div",{key:c[0], className:linhaT+" min-h-8"},
                e("span",{className:"text-left text-[13px] font-semibold"}, c[0]),
                e("span",{className:MONO+" text-[13px] font-bold"}, "−"+c[1]+"%"),
                e("span",{className:MONO+" text-[13px] font-bold"}, at.tudo ? "Tudo" : "−"+c[2]+"%"),
                e("b",{className:MONO+" text-[13px]"}, c[3])); })),
          at.tudo && e("p",{key:"jur", className:"text-[13px] font-bold"}, "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico (nota promissória).")];
      })()),
    blocoAcordeao(2, "star", "#D97706", "Crédito de garantia",
      acertoForm.garantia>0 ? "Desconto de "+BK(acertoForm.garantia)+" na venda" : "Sem desconto de garantia",
      checkOk,
      [(function(){ var lista = creditosDaRevendedora(s, sel.rev).filter(function(c){ return !c.usado; }), L = "flex min-h-8 items-center justify-between gap-2 border-t border-white/10 px-1 text-[13px]";
        if(!lista.length) return e("p",{key:"g0", className:"text-[13px]"}, acertoForm.garantia>0 ? "Crédito de garantia: "+BK(acertoForm.garantia) : "Nenhum crédito liberado pela Garantia.");
        return e("div",{key:"g1", className:"flex flex-col"},
          lista.map(function(c){ return e("div",{key:c.id, className:L}, e("span",null,"Garantia"+(c.obs ? " · "+c.obs : "")), e("b",{className:MONO+" whitespace-nowrap"}, BK(c.valor))); }),
          e("div",{className:"flex min-h-8 items-center justify-between gap-2 rounded-lg bg-[#C9A13B]/20 px-2 text-[13px] font-bold"}, e("span",null,"Desconto na venda"), e("b",{className:MONO+" whitespace-nowrap text-[15px]"}, BK(acertoForm.garantia)))); })()]),
    // Trocas, layout 1 (aprovado pelo Marcus em 02/11/2026): lista das trocas lançadas, "+ Troca" abre um formulário em 3 passos (tipo → peça quebrada → peça nova) com a conta ao vivo.
    blocoAcordeao(8, "undo", "#EA580C", "Trocas",
      (acertoForm.trocas||[]).length ? acertoForm.trocas.length+" troca(s) · "+(dv.trocasAjuste>=0 ? "soma " : "desconta ")+BK(Math.abs(dv.trocasAjuste))+" na venda" : "Peça quebrada trocada por outra",
      checkOk,
      (function(){
        var lista = acertoForm.trocas||[], formAberto = lista.length===0 || trocaFormAberto, tipoT = trocaIn.tipo;
        var ajDe = function(t){ return t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0); };
        var sinalT = function(v){ return (v>=0 ? "+ " : "− ")+BK(Math.abs(v)); };
        var regraTxt = tipoT==="anterior" ? "Entra na venda só a diferença: nova menos quebrada. Se a nova for mais barata, desconta." : "A peça nova entra na venda pelo valor cheio e a quebrada volta para a empresa.";
        var okA = codigoPecaValido(trocaIn.antigaCod) && trocaIn.antigaValor>0, okN = codigoPecaValido(trocaIn.novaCod) && trocaIn.novaValor>0;
        var ajuste = ajDe({tipo:tipoT, antigaValor:trocaIn.antigaValor, novaValor:trocaIn.novaValor});
        var btnT = "h-8 flex-1 rounded-lg text-[11px] font-bold disabled:opacity-40 ";
        var fechaForm = function(){ setTrocaIn(TROCA_VAZIA); setPassoTroca(1); setTrocaFormAberto(false); };
        var liberado = function(n){ return n===1 || (n===2 && !!tipoT) || (n===3 && !!tipoT && okA); };
        var passos = e("div",{key:"tp", className:"flex items-center justify-center gap-4"}, ["Tipo","Quebrada","Nova"].map(function(nome, i){ var on = passoTroca===i+1, lib = liberado(i+1);
          return e("button",{key:nome, type:"button", disabled:!lib, onClick:function(){ setPassoTroca(i+1); }, className:"flex h-8 items-center justify-center gap-1.5 text-[11px] font-bold uppercase "+(on ? "" : "opacity-50")},
            e("i",{className:"grid size-5 place-items-center rounded-full bg-[#C9A13B] text-[11px] not-italic txt-branco"}, i+1), nome); }));
        var corpo = passoTroca===1 ? [
            e("p",{key:"p1q", className:"text-center text-[11px] font-bold uppercase"}, "A peça que voltou quebrada é…"),
            e("div",{key:"p1", className:"grid grid-cols-2 gap-1.5"}, [["mes","Deste kit","comprada neste mês"],["anterior","De outro mês","já foi paga"]].map(function(o){ var on = tipoT===o[0];
              return e("button",{key:o[0], onClick:function(){ setTrocaIn(Object.assign({}, trocaIn, {tipo:o[0]})); }, "aria-pressed":on,
                className:"flex h-10 flex-col items-center justify-center rounded-lg text-[11px] font-bold leading-tight "+(on ? "bg-[#C9A13B] txt-branco" : "bg-white/10")}, e("span",null,o[1]), e("span",{className:"font-medium"}, o[2])); })),
            tipoT && e("p",{key:"p1r", className:"text-[11px]"}, regraTxt),
            e("div",{key:"p1b", className:"flex gap-2"},
              lista.length>0 && e("button",{onClick:fechaForm, className:btnT+"bg-white/10"}, "Cancelar"),
              e("button",{disabled:!tipoT, onClick:function(){ setPassoTroca(2); }, className:btnT+ouro}, "Continuar"))]
          : passoTroca===2 ? [
            e("p",{key:"p2t", className:"text-[11px] font-bold uppercase"}, "Peça que voltou quebrada"),
            e("div",{key:"p2", className:"flex gap-1.5"},
              e("input",{value:trocaIn.antigaCod, placeholder:"AB123", autoCapitalize:"characters", "aria-label":"Código da peça quebrada", onChange:function(ev){ setTrocaIn(Object.assign({}, trocaIn, {antigaCod:limitarCodigo(ev.target.value)})); },
                className:"h-8 w-[6.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-[13px] font-semibold text-white outline-none ring-1 ring-white/10 "+MONO+" uppercase"}),
              e(CampoReais,{value:trocaIn.antigaValor, label:"Valor da peça quebrada", onChange:function(v){ setTrocaIn(Object.assign({}, trocaIn, {antigaValor:v})); }, className:"h-8 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-right text-[13px] text-white outline-none ring-1 ring-white/10 "+MONO})),
            e("div",{key:"p2b", className:"flex gap-2"},
              e("button",{onClick:function(){ setPassoTroca(1); }, className:btnT+"bg-white/10"}, "Voltar"),
              e("button",{disabled:!okA, onClick:function(){ setPassoTroca(3); }, className:btnT+ouro}, "Continuar"))]
          : [
            e("p",{key:"p3t", className:"text-[11px] font-bold uppercase"}, "Peça nova que ela ficou"),
            e("div",{key:"p3", className:"flex gap-1.5"},
              e("input",{value:trocaIn.novaCod, placeholder:"CD456", autoCapitalize:"characters", "aria-label":"Código da peça nova", onChange:function(ev){ setTrocaIn(Object.assign({}, trocaIn, {novaCod:limitarCodigo(ev.target.value)})); },
                className:"h-8 w-[6.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-[13px] font-semibold text-white outline-none ring-1 ring-white/10 "+MONO+" uppercase"}),
              e(CampoReais,{value:trocaIn.novaValor, label:"Valor da peça nova", onChange:function(v){ setTrocaIn(Object.assign({}, trocaIn, {novaValor:v})); }, className:"h-8 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-right text-[13px] text-white outline-none ring-1 ring-white/10 "+MONO})),
            e("div",{key:"p3l", className:"flex min-h-8 items-center justify-between border-t-2 border-[#C9A13B] text-[11px]"},
              e("span",null, tipoT==="anterior" ? "Entra na venda (nova − quebrada)" : "Entra na venda (valor da nova)"),
              e("b",{className:MONO+" text-[13px]"}, sinalT(ajuste))),
            e("div",{key:"p3b", className:"flex gap-2"},
              e("button",{onClick:function(){ setPassoTroca(2); }, className:btnT+"bg-white/10"}, "Voltar"),
              e("button",{disabled:!okN, onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {trocas:lista.concat([trocaIn])})); fechaForm(); }, className:btnT+ouro}, "Lançar troca"))];
        return [
          e("div",{key:"th", className:"flex min-h-8 items-center justify-between"},
            e("p",{className:"text-[11px] font-bold uppercase tracking-wide"}, "Lançadas"),
            e("button",{onClick:function(){ if(trocaFormAberto){ fechaForm(); } else { setTrocaIn(TROCA_VAZIA); setPassoTroca(1); setTrocaFormAberto(true); } }, className:"h-8 rounded-lg border border-dashed border-amber-200/60 px-3 text-[11px] font-semibold text-amber-200"}, trocaFormAberto ? "Cancelar" : "+ Trocar peça")),
          lista.length===0 && !formAberto && e("p",{key:"t0", className:"text-[11px]"}, "Nenhuma troca lançada."),
          lista.map(function(t,i){ var aj = ajDe(t);
            return e("div",{key:"t"+i, className:"flex min-h-9 items-center justify-between gap-2 border-b border-white/10"},
              e("div",{className:"min-w-0"},
                e("p",{className:MONO+" text-[13px] font-semibold"}, t.antigaCod+" → "+t.novaCod),
                e("p",{className:"text-[11px]"}, t.tipo==="anterior" ? "De outro mês · já foi paga" : "Deste kit · comprada neste mês")),
              e("span",{className:"flex shrink-0 items-center gap-1"},
                e("b",{className:MONO+" text-[13px] "+(aj>=0 ? "text-amber-200" : "text-amber-200")}, sinalT(aj)),
                e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {trocas:lista.filter(function(y,j){return j!==i;})})); }, "aria-label":"Remover troca", className:"grid size-8 place-items-center text-[13px]"}, "×"))); }),
          formAberto && e("div",{key:"tf", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-1.5"}, passos, corpo),
          lista.length>0 && e("div",{key:"ttot", className:"flex min-h-9 items-center justify-between border-t-2 border-[#C9A13B]"},
            e("span",{className:"text-[13px] font-semibold"}, "Ajuste na venda"),
            e("b",{className:MONO+" text-[13px] text-amber-200"}, sinalT(dv.trocasAjuste)))];
      })()),
    // 26/11/2026 (Marcus): saiu o bloco Kit apoio bolsinhas. O MP0063 é peça como qualquer outra: vai no bip, e o que não voltar já conta como vendido.
    blocoAcordeao(3, "grafico", "#2563EB", "Vendas e pagamentos",
      !previaBase ? "Preencha o valor vendido" : quitado ? BK(acertoForm.vendaBruta)+" · quitado" : BK(acertoForm.vendaBruta)+" · restante "+BK(restanteTotal),
      !previaBase ? badgeTxt("Pendente","#64748B") : quitado ? checkOk : acertoForm.recusouNegociar || acordoValido ? checkOk : badgeTxt("","#64748B"),
      [e("div",{key:"fech", className:"overflow-hidden rounded-xl border border-[#C9A13B]/70"}, [
          linhaFech("vv","t1","Valor vendido", e(CampoReaisAuto,{value:acertoForm.vendaBruta, mostraZero:true, label:"Valor total vendido", onChange:function(v){ setAcertoForm(Object.assign({}, acertoForm, {vendaBruta:v})); }, className:campoValor})),
          previaAcerto && dv.trocasAjuste!==0 && linhaFech("tr","t1","Trocas", valorFech(dv.trocasAjuste>0 ? "+" : "−", BK(Math.abs(dv.trocasAjuste)))),
          previaAcerto && acertoForm.garantia>0 && linhaFech("gr","t1","Crédito de garantia", valorFech("−", BK(acertoForm.garantia))),
          previaAcerto && linhaFech("lq","t2","Venda líquida", valorFech("", BK(previaAcerto.vendaLiquida))),
          previaAcerto && linhaFech("cm","t2","Comissão", e("span",{className:"flex items-center gap-3"}, e("b",{className:MONO+" text-[13px]"}, (previaAcerto.semFaixa ? 0 : previaAcerto.comissaoPct)+"%"), e("b",{className:MONO+" text-[13px]"}, "− "+BK(previaAcerto.comissao)))),
          previaAcerto && previaAcerto.taxaDeslocamento>0 && linhaFech("tx","t2","Taxa de deslocamento", valorFech("+", BK(previaAcerto.taxaDeslocamento))),
          previaAcerto && excedenteBrinde>0 && linhaFech("ex","t2","Brinde a mais", valorFech("+", BK(excedenteBrinde))),
          previaAcerto && dv.kitApoio.valor>0 && linhaFech("ka","t2","Kit apoio bolsinhas", valorFech("+", BK(dv.kitApoio.valor))),
          previaAcerto && (acertoForm.tagsDanificadas||0)>0 && linhaFech("tg","t2","Tags riscadas ("+acertoForm.tagsDanificadas+")", e("span",{className:"flex items-center gap-1"}, valorFech("+", BK(dv.tagsValor)),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {tagsDanificadas:Math.max(0,(acertoForm.tagsDanificadas||0)-1)})); }, "aria-label":"Tirar uma tag", className:"grid size-8 place-items-center text-[13px]"}, "×"))),
          previaAcerto && linhaFech("pg","t3","Valor a pagar", valorFech("", BK(totalAPagar))),
          previaAcerto && e("div",{key:"tagmais", className:"flex min-h-8 items-center justify-end border-t border-white/10 bg-white/[.03] px-3"}, e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {tagsDanificadas:(acertoForm.tagsDanificadas||0)+1})); }, className:"h-8 text-[11px] underline"}, "+ Tag riscada"))]),
      
      previaAcerto && previaAcerto.semFaixa && e("p",{key:"v4", className:"text-[13px] font-semibold text-amber-200"},
        "Abaixo de "+BK(versaoSel.gerais.minRenovar)+" de venda líquida não existe faixa: a comissão é zero."),
      !previaBase ? null : e(React.Fragment,{key:"pg"},
          e(LinksDoAcerto,{key:"lkacerto", rev:sel.rev, pagamentos:acertoForm.pagamentos, falta:faltaAtual}),
          // Pagamentos (02/11/2026, Marcus): uma linha por pagamento (✓ = já pago por link, sem ×); "+ Lançar pagamento" é um acordeão com menus suspensos de forma e conta (a lista de contas é a do Financeiro; a revendedora define em qual pagou)
          e("div",{key:"pagbox", className:"flex flex-col gap-1.5 rounded-xl border border-[#C9A13B]/70 p-1.5"},
          e("div",{key:"lanc0", className:"flex flex-col"},
            e("p",{className:"flex min-h-8 items-center text-[13px] font-semibold"}, "Pagamentos ("+acertoForm.pagamentos.length+")"+(acertoForm.pagamentos.some(function(p){ return p.jaPagoLink; }) ? " · ✓ já pago por link" : "")),
            acertoForm.pagamentos.map(function(p,i){ var rot = rotPag(p), sp = rot.indexOf(" "), hojeP = isoDia(new Date());
              return e("div",{key:i, className:"flex min-h-9 items-center justify-between gap-2 border-b border-white/10"},
                e("span",{className:"min-w-0 whitespace-nowrap text-[13px]"}, p.jaPagoLink ? "✓ " : "", e("b",{className:"font-semibold"}, sp<0 ? rot : rot.slice(0, sp)), sp<0 ? "" : rot.slice(sp),
                  p.data && p.data!==hojeP ? e("small",{className:"ml-1.5 text-[11px]"}, p.data.split("-").reverse().slice(0,2).join("/")) : null, p.anexo ? e("small",{className:"ml-1.5 text-[11px]"}, "📎") : null, estPag(p) && estPag(p).aguardando ? e("small",{className:"ml-1.5 text-[11px]"}, "aguardando a empresa") : null,
                  p.linkSolId ? e("small",{className:"block text-[11px]"}, "Link "+String(p.descricao||"").split(" - ").slice(1).map(function(w){ return /^\d+$/.test(w) ? w : w.charAt(0)+w.slice(1).toLowerCase(); }).join(" ")+" · "+(p.data ? p.data.split("-").reverse().slice(0,2).join("/") : "")+" · "+(p.parcelas||1)+"x") : null),
                e("span",{className:"flex shrink-0 items-center gap-0.5"},
                  e("b",{className:MONO+" text-[14px]"}, BK(p.valor)),
                  p.jaPagoLink ? e("span",{className:"size-5"}) : e("button",{onClick:function(){ if(p.pid && kitSel) d({type:"REP_PAG", op:"remover", kitId:kitSel.id, pid:p.pid, ctx:ctxPed(acertoForm.pagamentos.filter(function(x,j){return j!==i;}))});
                      setAcertoForm(Object.assign({}, acertoForm, {pagamentos:acertoForm.pagamentos.filter(function(x,j){return j!==i;})})); },
                    "aria-label":"Remover lançamento", className:"grid size-5 place-items-center text-[13px]"}, "×"))); }),
            acertoForm.pagamentos.filter(function(q){ var x = q.jaPagoLink && linkDaLinha(q); return x && x.saldo-(Number(q.valor)||0)>0.009; }).map(function(q){ var x = linkDaLinha(q);   // link maior que o acerto: o resto fica para o próximo (26/11/2026)
              return e("p",{key:"sobra"+x.id, className:"py-1 text-[11px]"}, "Sobram "+BK(x.saldo-q.valor)+" do link para o próximo acerto"); })),
          acertoForm.pagamentos.filter(function(p){ return estPag(p); }).map(function(p){ var es = estPag(p), ehPix = p.forma==="pix";
            var inputAnexo = function(){ return e("input",{type:"file", accept:"image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.heic,.webp", className:"hidden", "aria-label":"Anexar o comprovante do pagamento", onChange:function(ev){ var fl = ev.target.files && ev.target.files[0]; if(!fl) return;
              var salva = function(dados){ var an = {nome:fl.name, tipo:fl.type, dados:dados, tamanho:fl.size};
                setAcertoForm(function(f0){ return Object.assign({}, f0, {pagamentos:f0.pagamentos.map(function(x){ return x.pid===p.pid ? Object.assign({}, x, {anexo:an}) : x; })}); });
                if(kitSel) d({type:"REP_PAG", op:"comprovante", kitId:kitSel.id, pid:p.pid, anexo:an}); };
              if(fl.type.indexOf("image/")===0){ fotoPequena(fl, function(c){ if(c) salva(c.url); else window.alert("Não consegui abrir essa foto. Tente de novo."); }); return; }   // foto do celular: reduz e guarda (antes, acima de 400 KB ficava sem a imagem)
              if(fl.size>400000){ window.alert("Arquivo grande demais. Envie uma foto ou um print do comprovante."); return; } var rd = new FileReader(); rd.onload = function(){ salva(rd.result); }; rd.readAsDataURL(fl); }}); };
            // Pix: o cartão da chave traz, numa linha só, Copiar e Anexar comprovante (um de cada lado, o texto do anexo em duas linhas) (Marcus, 04/11/2026)
            var ladoAnexo = p.anexo ? e("span",{className:"flex min-h-8 flex-1 items-center justify-center text-center text-[11px] font-bold leading-tight"}, "✓ Comprovante anexado")
              : e("label",{className:"flex min-h-8 flex-1 cursor-pointer flex-col items-center justify-center rounded-lg px-2 text-center text-[11px] font-bold leading-tight ring-1 ring-[#CA8A04]", style:{background:"#F6EFDF", color:"#7A5D12"}}, e("span",null,"Anexar"), e("span",null,"comprovante"), inputAnexo());
            return e("div",{key:"orienta"+p.pid, className:"flex flex-col gap-0.5 rounded-xl border border-white/15 bg-white/[.07] px-3 py-1.5 text-[13px]"},
              e("b",{className:"font-semibold"}, formaDe(p.forma).label+" · "+BK(p.valor)),
              linhaDivergente(p) && linksLivres().length>0 && e(React.Fragment,null,   // o valor digitado não bate com o link pago: vale o link (26/11/2026)
                e("span",{className:"font-semibold text-amber-200"}, "Valor diferente do link pago"),
                linksLivres().map(function(x){ return e("button",{key:"usar"+x.id, type:"button", onClick:function(){ usarLink(x, p); }, className:"mt-1 h-8 rounded-lg text-[13px] font-bold ring-1 ring-[#CA8A04]", style:{background:"#F6EFDF", color:"#7A5D12"}}, "Usar o link de "+BK(x.saldo)); })),
              es.aguardando ? e("span",null,"Enviado ao financeiro. A conta aparecerá aqui em breve.") : null,
              es.aguardando && (function(){   // 26/11/2026 (Marcus): o comprovante já pode ser anexado enquanto a conta não chega; ver, trocar e remover antes de finalizar
                var btn = "flex h-8 flex-1 cursor-pointer items-center justify-center rounded-lg px-2 text-[11px] font-bold ring-1 ring-[#CA8A04]", est = {background:"#F6EFDF", color:"#7A5D12"};
                if(!p.anexo) return e("label",{className:btn+" mt-0.5", style:est}, "Anexar comprovante", inputAnexo());
                var ver = function(){ var u = p.anexo.dados; if(!u) return; fetch(u).then(function(r){ return r.blob(); }).then(function(b){ var a = document.createElement("a"); a.href = URL.createObjectURL(b); a.target = "_blank"; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove(); }).catch(function(){}); };
                var tira = function(){ setAcertoForm(function(f0){ return Object.assign({}, f0, {pagamentos:f0.pagamentos.map(function(x){ return x.pid===p.pid ? Object.assign({}, x, {anexo:null}) : x; })}); }); if(kitSel) d({type:"REP_PAG", op:"comprovante", kitId:kitSel.id, pid:p.pid, anexo:null}); };
                return e("div",{className:"mt-0.5 flex flex-col gap-1"},
                  e("span",{className:"text-[11px] font-bold"}, "✓ Comprovante anexado: "+(p.anexo.nome||"arquivo")),
                  e("div",{className:"flex gap-1"},
                    e("button",{type:"button", onClick:ver, className:btn, style:est}, "Visualizar"),
                    e("label",{className:btn, style:est}, "Substituir", inputAnexo()),
                    e("button",{type:"button", onClick:tira, className:btn, style:est}, "Remover"))); })(),
              es.aguardando ? null : (ehPix ? null : e("span",null,"Faça o pagamento na conta: "+es.conta)),
              !es.aguardando && ehPix && [].concat.apply([], es.partes.map(function(r0){ return String(r0).split(" + "); })).map(function(rot, qi){ return e(CartaoPixConta,{key:"pxc"+p.pid+"-"+qi, rotulo:rot, valor:es.partes.length===1 && String(es.partes[0]).indexOf(" + ")<0 ? p.valor : 0, lado:qi===0 ? ladoAnexo : null}); }),   // a chave Pix da conta para ela passar à revendedora e copiar (Marcus, 04/11/2026)
              !es.aguardando && !ehPix && (p.anexo
                ? e("span",{className:"font-semibold"}, p.anexo.link ? "✓ Comprovante anexado pela Sorelly" : "✓ Comprovante anexado")   // link: o comprovante veio do setor de links (26/11/2026)
                : e(React.Fragment,null,
                    linkDaLinha(p) && e("span",null, "Link pago em "+String(linkDaLinha(p).pagoEm||"").slice(0, 10).split("-").reverse().slice(0, 2).join("/")+(linkDaLinha(p).comprovante ? ": buscando o comprovante" : ": a Sorelly anexa o comprovante")),
                    e("label",{className:"mt-1 flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded-lg px-2.5 text-[13px] font-bold ring-1 ring-[#CA8A04]", style:{background:"#F6EFDF", color:"#7A5D12"}},
                      e("span",null,"Pagou? Anexe o comprovante"), e("span",null,"Anexar"), inputAnexo())))); }),
          acertoForm.pagamentos.filter(function(p){ return p.forma==="pix_representante"; }).slice(0, 1).map(function(p){
            var chave = chavePixRep(s.cp && s.cp.chaves, l.rep);   // chave cadastrada em Financeiro › Chaves Pix › Representantes
            return e("div",{key:"chaveRep", className:"flex flex-col gap-0.5 rounded-xl border border-white/15 bg-white/[.07] px-3 py-1.5 text-[13px]"},
              e("b",{className:"font-semibold"}, "Pix representante"),
              chave ? e("span",{className:"break-all"}, "Chave Pix: "+chave) : e("span",null,"Chave Pix da representante ainda não cadastrada."),
              chave && e("button",{type:"button", onClick:function(){ try{ navigator.clipboard.writeText(chave); }catch(x){} }, className:"mt-1 h-8 rounded-lg text-[13px] font-bold ring-1 ring-[#CA8A04]", style:{background:"#F6EFDF", color:"#7A5D12"}}, "Copiar chave")); }),
          (function(){
            var fm = lancForm.forma, pedeCta = !!fm && pedeConta(fm);
            var campoSel = "h-8 w-full rounded-lg bg-white px-2 text-[13px] text-[#3B2F0B] outline-none ring-1 ring-[#C9A13B]/60", campoValor = "h-8 w-[7.5rem] rounded-lg bg-white px-2 text-right text-[13px] font-semibold text-[#3B2F0B] outline-none ring-1 ring-[#C9A13B]/60 "+MONO;   // 26/11/2026 (Marcus): seletor de forma no padrão claro de Vendas e pagamentos
            var pedeComp = !!fm && fm!=="dinheiro" && fm!=="acerto_loja" && !pedeCta;   // dinheiro e inadimplência não têm comprovante; Pix, link e cartão: o comprovante vem DEPOIS, quando o financeiro responder a conta (Marcus, 04/11/2026)
            var pronto = !!(fm && lancForm.data && lancForm.valor>0 && (!pedeComp || lancForm.anexo));
            var abre = function(){ if(lancAberto){ setLancAberto(false); setLancForm(LANC_VAZIO); } else { setLancForm(Object.assign({}, LANC_VAZIO, {valor: restanteTotal>0.009 ? Math.round(restanteTotal*100)/100 : null})); setLancAberto(true); } };
            return e("div",{key:"lanc1", className:"mt-1 overflow-hidden rounded-xl border border-[#C9A13B]/70", style:{background:"#F6EFDF", color:"#3B2F0B"}},
              e("button",{onClick:abre, "aria-expanded":lancAberto, className:"flex min-h-10 w-full items-center gap-2.5 px-3 text-left"},
                e("span",{className:"grid size-8 shrink-0 place-items-center rounded-lg text-[13px] font-bold", style:{background:"#CA8A0426", color:"#CA8A04"}}, "+"),
                e("b",{className:"min-w-0 flex-1 text-[13px]"}, "Lançar pagamento"),
                e(Icon,{n: lancAberto ? "chevrondown" : "chevron", s:15, className:"text-[#7A5D12]"})),
              lancAberto && e("div",{className:"flex flex-col gap-2 border-t border-[#C9A13B]/40 p-1.5"},
                e("select",{value:fm, "aria-label":"Forma de pagamento", onChange:function(ev){ setLancForm(Object.assign({}, LANC_VAZIO, {forma:ev.target.value, valor:lancForm.valor}));
                    if(ev.target.value==="acerto_loja" && !acertoForm.acordoParcelas.length) setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[{data:isoDia(new Date()), valor:null}]})); }, className:campoSel},
                  e("option",{value:""},"Escolha a forma"),
                  formas.map(function(x){ return e("option",{key:x.k, value:x.k}, formaDe(x.k).label); })),
                fm==="acerto_loja" && e("div",{key:"inad", className:"flex flex-col gap-2 rounded-xl bg-white/60 p-1.5"},
                  e("div",{className:"flex items-center justify-between gap-2"},
                    e("p",{className:"text-[13px] font-bold"},"Negociar o valor em aberto"),
                    e("button",{onClick:function(){ setRegrasInadAberto(!regrasInadAberto); }, "aria-label":"Regras da inadimplência", "aria-expanded":regrasInadAberto, className:"h-8 shrink-0 rounded-lg bg-white px-3 text-[13px] font-bold ring-1 ring-[#CA8A04]"}, "Regras")),
                  regrasInadAberto && e("div",{className:"flex flex-col gap-1 rounded-lg bg-white p-2 text-[12px]"},
                    e("p",{className:"font-bold"},"Regras da inadimplência"),
                    e("p",null,"1. Qualquer valor pendente tem multa de "+((versaoSel && versaoSel.novas) || {}).multaPendentePct+"% sobre o pendente. "+(versaoSel && versaoSel.novas ? textoNegociacao(versaoSel.novas)+" Parcela atrasada soma "+versaoSel.novas.atrasoQuitacaoPctDia+"% ao dia, até "+versaoSel.novas.atrasoQuitacaoTetoPct+"%." : "")),
                    e("p",null,"2. Sem negociar o valor que falta, os brindes não são liberados."),
                    e("p",null,"3. As parcelas negociadas precisam fechar exatamente o valor em aberto."),
                    e("p",null,"4. Se a revendedora não quiser negociar, o jurídico entra em contato. Sem negociação em 48 horas depois do aviso final, a nota promissória vai para execução no valor pendente.")),
                  acertoForm.acordoParcelas.map(function(p,i){ return e("div",{key:i, className:"grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-center gap-x-2 gap-y-1"},
                    e("span",{className:"col-span-2 text-[11px] font-semibold"}, "Parcela "+(i+1)),
                    e("input",{type:"date", value:p.data, "aria-label":"Data da parcela", onChange:function(ev){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {data:ev.target.value}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); }, className:campoSel+" w-full min-w-0 [color-scheme:light]"}),
                    e(CampoReaisAuto,{value:p.valor, label:"Valor da parcela", onChange:function(v){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {valor:v}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); }, className:campoValor+" w-full min-w-0"})); }),
                  e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:acertoForm.acordoParcelas.concat([{data:isoDia(new Date()), valor:null}])})); }, className:"h-8 w-full rounded-lg text-[13px] font-semibold"}, "+ Adicionar parcela"),
                  e("div",{className:"grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 border-t border-[#C9A13B]/40 pt-2 text-[13px]"}, e("span",{className:"whitespace-nowrap"},"Soma das parcelas"), e("b",{className:MONO+" whitespace-nowrap text-right"}, BK(acordoSoma)), e("span",null,"Falta"), e("b",{className:MONO+" text-right"}, BK(restanteTotal))),
                  e("div",{className:"grid grid-cols-1 gap-2"},
                    e("button",{onClick:function(){ var validas = acertoForm.acordoParcelas.filter(function(p){return p.data && p.valor>0;}); var soma = validas.reduce(function(a,p){return a+p.valor;},0);
                        setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:validas, acordoSalvo:validas.length>0, recusouNegociar:false}));
                        if(validas.length && Math.abs(soma-restanteTotal)<=0.01){ setBlocoAberto(4); setLancAberto(false); setLancForm(LANC_VAZIO); } }, className:"h-8 w-full rounded-lg text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}}, "Salvar acordo"),
                    e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {recusouNegociar:true, acordoParcelas:[], acordoSalvo:false})); setBlocoAberto(4); setLancAberto(false); setLancForm(LANC_VAZIO); }, className:"h-8 w-full rounded-lg text-[13px] font-bold "+BR2, style:{background:"#3F3F46"}}, "Não quis negociar")),
                  acertoForm.acordoSalvo && e("p",{className:"text-[13px] font-semibold"}, Math.abs(acordoSoma-restanteTotal)<=0.01 ? "Acordo fecha o valor: libera o kit novo, não o brinde." : "As parcelas ainda não fecham o valor em aberto.")),
                fm==="link" && linksLivres().map(function(x){   // links pagos da revendedora: o valor vem do link, ela só toca (26/11/2026)
                  return e("button",{key:"lk"+x.id, type:"button", onClick:function(){ usarLink(x); setLancAberto(false); setLancForm(LANC_VAZIO); }, className:"h-8 w-full rounded-lg text-[13px] font-bold ring-1 ring-[#CA8A04]", style:{background:"#F6EFDF", color:"#7A5D12"}},
                    "Usar link pago de "+BK(x.saldo)+" · "+String(x.pagoEm||"").slice(0, 10).split("-").reverse().slice(0, 2).join("/")); }),
                fm && fm!=="acerto_loja" ? e("div",{className:"flex items-center gap-2"},
                  formaDe(fm).parcelas && e("select",{value:lancForm.parcelas, "aria-label":"Parcelas", onChange:function(ev){ setLancForm(Object.assign({}, lancForm, {parcelas:Number(ev.target.value)})); }, className:campoSel+" w-[5.2rem]! shrink-0"},
                    PARCELAS_CARTAO.filter(function(n){ var pm = versaoSel && versaoSel.gerais.parcelaMinimaCredito; return !pm || n===1 || !(lancForm.valor>0) || lancForm.valor/n>=pm-0.001; })
                      .map(function(n){ return e("option",{key:n, value:n}, n+"x"); })),
                  e(CampoReaisAuto,{value:lancForm.valor, label:"Valor do pagamento", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }, className:campoValor+" w-auto! min-w-0 flex-1"})) : null,
                pedeComp && e("label",{className:"flex h-8 cursor-pointer items-center justify-between gap-1.5 rounded-lg bg-white px-2.5 text-[13px] ring-1 "+(lancForm.anexo ? "ring-[#CA8A04]" : "ring-[#C9A13B]/50")},
                  e("span",{className:"min-w-0"}, lancForm.anexo ? "📎 "+lancForm.anexo.nome : "Comprovante *"),
                  e("span",{className:"shrink-0 font-bold"}, lancForm.anexo ? "Trocar" : "Anexar"),
                  e("input",{type:"file", accept:"image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.heic,.webp", className:"hidden", "aria-label":"Anexar o comprovante (foto ou documento)", onChange:function(ev){ var fl = ev.target.files && ev.target.files[0]; if(!fl) return;
                    if(fl.type.indexOf("image/")===0){ fotoPequena(fl, function(c){ if(c) setLancForm(Object.assign({}, lancForm, {anexo:{nome:fl.name, tipo:"image/jpeg", dados:c.url, tamanho:c.url.length}})); else window.alert("Não consegui abrir essa foto. Tente de novo."); }); return; }
                    if(fl.size>400000){ window.alert("Arquivo grande demais. Envie uma foto ou um print do comprovante."); return; }
                    var rd = new FileReader(); rd.onload = function(){ setLancForm(function(f0){ return Object.assign({}, f0, {anexo:{nome:fl.name, tipo:fl.type, dados:rd.result, tamanho:fl.size}}); }); }; rd.readAsDataURL(fl); }})),
                fm!=="acerto_loja" && e("button",{disabled:!pronto, onClick:function(){
                    var pid = pedeCta ? "p"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36) : null;
                    var novoPag = Object.assign({}, lancForm, pedeCta ? {descricao:"", pid:pid} : {descricao:(formaDe(fm).descricoes||[])[0] || formaDe(fm).label});   // Pix, link e cartão: o sistema usa a conta fixa dela ou pergunta à empresa; dinheiro e inadimplência não pedem conta
                    if(pedeCta && kitSel) d({type:"REP_PAG", op:"pedir", kitId:kitSel.id, rev:sel.rev, rep:l.rep, pid:pid, forma:lancForm.forma, valor:lancForm.valor, parcelas:lancForm.parcelas||1, data:lancForm.data, anexo:lancForm.anexo, ctx:ctxPed(acertoForm.pagamentos.concat([novoPag]))});
                    else if(kitSel) d({type:"REP_PAG", op:"ctx", kitId:kitSel.id, ctx:ctxPed(acertoForm.pagamentos.concat([novoPag]))});
                    setAcertoForm(Object.assign({}, acertoForm, {pagamentos:acertoForm.pagamentos.concat([novoPag])}));
                    if(totalPagoAtual+lancForm.valor >= previaBase.valorDevido-0.009) setBlocoAberto(4);   // acerto quitado: abre os brindes
                    setLancAberto(false); setLancForm(LANC_VAZIO); },
                  className:"h-8 w-full rounded-lg text-[13px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}}, "Lançar pagamento")));
          })(),
          e("div",{key:"tot", className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[13px] font-bold"},
            e("span",null,"Total pago"), e("span",{className:MONO+" text-[15px]"}, BK(totalPagoAtual))),
          restanteTotal>0.009 && e("div",{key:"falta", className:"flex min-h-9 items-center justify-between gap-2 rounded-xl border border-white/15 bg-[#C9A13B]/20 px-3 text-[13px] font-semibold"}, e("span",null,"Falta"), e("b",{className:MONO+" text-[15px]"}, BK(restanteTotal)))),
          !quitado && !acordoExistente && !negociarAberto && !acertoForm.recusouNegociar && !(lancAberto && lancForm.forma==="acerto_loja") && e("div",{key:"neg0", className:"flex gap-2"},
            e("button",{onClick:function(){ setNegociarAberto(true);
                if(!acertoForm.acordoParcelas.length) setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[{data:isoDia(new Date()), valor:null}]})); },
                className:"h-8 flex-1 rounded-lg text-[12px] font-semibold ring-1 ring-[#C9A13B]/60", style:{background:"#F6EFDF", color:"#7A5D12"}}, "Negociar o que falta"),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {recusouNegociar:true})); setBlocoAberto(4); },
                className:"h-8 flex-1 rounded-lg text-[12px] font-semibold ring-1 ring-[#C9A13B]/60", style:{background:"#F6EFDF", color:"#7A5D12"}}, "Não quis negociar")),
          acertoForm.recusouNegociar && e("div",{key:"recusou", className:"flex flex-col gap-1.5 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10"},
            e("p",{className:"text-[13px] font-bold text-amber-200"},"Brinde bloqueado. Revendedora não quis negociar o valor em aberto."),
            e("p",{className:"text-[12px] text-amber-200"},"Sem brinde. O jurídico entra em contato; sem negociação em 48 horas depois do aviso final, a nota promissória vai para execução no valor pendente."),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {recusouNegociar:false})); },
              className:"h-7 w-full rounded-lg text-[11.5px] font-semibold text-[#8E8E93]"}, "Desfazer")),
          (negociarAberto || acordoExistente) && e("div",{key:"neg1", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-1.5"},
            e("div",{className:"flex items-center justify-between gap-2"},
              e("p",{className:"text-[12px] font-semibold text-white"},"Parcelas negociadas"),
              e("button",{onClick:function(){ setNegociarAberto(false); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[], acordoSalvo:false})); },
                "aria-label":"Fechar negociação", className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70"}, "×")),
            acertoForm.acordoParcelas.map(function(p,i){ return e("div",{key:i, className:"flex items-center gap-2"},
              e("span",{className:"w-16 shrink-0 text-[11.5px] text-[#8E8E93]"}, "Parcela "+(i+1)),
              e("input",{type:"date", value:p.data, onChange:function(ev){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {data:ev.target.value}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); },
                className:"h-8 flex-1 rounded-lg bg-black/50 px-2 text-[12.5px] text-white outline-none ring-1 ring-white/10 [color-scheme:dark]"}),
              e(CampoReaisAuto,{value:p.valor, label:"Valor da parcela", onChange:function(v){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {valor:v}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); },
                className:"h-8 w-28 rounded-lg bg-black/50 px-2 text-right text-[13px] text-white outline-none ring-1 ring-white/10"})); }),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:acertoForm.acordoParcelas.concat([{data:isoDia(new Date()), valor:null}])})); },
              className:"h-8 w-full rounded-lg text-[12px] font-semibold text-white"}, "+ Adicionar parcela"),
            e("div",{className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[12.5px]"},
              e("span",null,"Soma das parcelas / Falta cobrir"),
              e("span",{className:MONO+" font-bold "+(Math.abs(acordoSoma-faltaAtual)<=0.01?"text-amber-200":"text-amber-200")}, BK(acordoSoma)+" / "+BK(faltaAtual))),
            e("button",{onClick:function(){
                var validas = acertoForm.acordoParcelas.filter(function(p){return p.data && p.valor>0;});
                var soma = validas.reduce(function(t,p){return t+p.valor;},0);
                setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:validas, acordoSalvo:validas.length>0}));
                if(validas.length && Math.abs(soma-faltaAtual)<=0.01) setBlocoAberto(4);   // negociação fechou o valor: abre os brindes
              }, className:"h-9 w-full rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#3F3F46"}}, "Salvar acordo"),
            acertoForm.acordoSalvo && e("p",{className:"text-[11.5px] text-white"}, "Acordo salvo com "+acertoForm.acordoParcelas.length+" parcela(s). As parcelas precisam fechar exatamente o valor que falta para liberar brinde."),
            acertoForm.acordoSalvo && e("p",{className:"text-[11px] text-[#8E8E93]"}, "Sem conta a receber."),
            e("button",{onClick:function(){ setNegociarAberto(false); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[], acordoSalvo:false})); },
              className:"h-8 w-full rounded-lg text-[11.5px] font-semibold text-amber-200"}, "Remover acordo")),
          quitado && acordoExistente && e("p",{key:"avisoQuitado", className:"text-[12.5px] font-semibold text-amber-200"},
            "O acerto já está quitado, mas ainda existe um acordo salvo. Remova o acordo para não gerar cobrança indevida."),
          acordoValido && e("p",{key:"acordoOk", className:"text-[12px] text-amber-200"}, "Acordo cobre o valor que falta: libera o kit novo, não o brinde."))]),
    blocoAcordeao(4, "presente", "#DB2777", "Brindes",
      !previaAcerto ? "Disponível a partir de "+BK(faixaMinBrinde===Infinity?500:faixaMinBrinde)
        : brindeBloqueio ? brindeBloqueio.curto
        : acertoForm.brindes.length ? acertoForm.brindes.length+" peça(s) · "+(excedenteBrinde>0 ? "Excedente "+BK(excedenteBrinde) : "Normal "+BK(confBrinde.restanteNormal))
        : "Normal "+BK(libN)+" · Select "+BK(libS),
      !previaAcerto ? badgeTxt("—","#374151") : brindeBloqueio ? badgeTxt("Bloqueado","#DC2626") : excedenteBrinde>0 ? badgeTxt("Excedente","#F59E0B") : pagamentoParcial ? badgeTxt(N1(previaAcerto.fatorPagamento*100)+"%","#D97706") : checkOk,
      [!previaAcerto ? e("p",{key:"b0", className:"text-[13px] text-[#8E8E93]"},"Preencha as vendas e os pagamentos para ver os brindes.")
        : brindeBloqueio && brindeBloqueio.porPagamento ? e(React.Fragment,{key:"bp"},
            e("div",{className:"flex flex-col gap-0.5 text-[12px] font-semibold text-amber-200"},
              e("p",null,"Pode lançar os brindes, o sistema identifica o que é BB automático."),
              e("p",null,"Só libere os brindes com o pagamento do acerto."+(faltaAtual>0.009 ? " Falta "+BK(faltaAtual) : ""))),
            blocoBrindesNovo(),
            e("button",{key:"bokp", disabled:true, className:"h-9 w-full cursor-not-allowed rounded-lg text-[13px] font-bold opacity-50 "+BR2, style:{background:"#C9A13B"}}, "Confirmar brindes depois do pagamento"))
        : brindeBloqueio ? e("div",{key:"bl", className:"flex flex-col gap-1.5 rounded-xl bg-white/5 p-2.5 ring-1 ring-white/10"},
            e("p",{className:"text-[13px] font-bold text-amber-200"},"Brinde bloqueado."),
            e("p",{className:"text-[12.5px] text-amber-200"}, brindeBloqueio.frase),
            faltaAtual>0.009 && e("div",{className:"mt-1 flex flex-col gap-0.5 border-t border-white/10 pt-1.5 text-[12.5px] font-semibold text-amber-200"},
              e("p",null,"Falta do acerto: "+BK(faltaAtual)), e("p",null,"Em aberto: "+N1(previaAcerto.pctFaltante)+"%")))
        : e(React.Fragment,{key:"br"},
            (previaAcerto.descontoRemarcacao.brindePct>0 || previaAcerto.fatorPagamento<1) && e("p",{key:"bdesc", className:"text-[11.5px] text-amber-200"},
              "Valores já com desconto, proporcional em Normal e Select"+(previaAcerto.descontoRemarcacao.brindePct>0 ? " · remarcação −"+previaAcerto.descontoRemarcacao.brindePct+"%" : "")
              +(previaAcerto.fatorPagamento<1 ? " · faltou "+N1(previaAcerto.pctFaltante)+"% do pagamento ("+N1(previaAcerto.fatorPagamento*100)+"% do brinde)" : "")+"."),
            blocoBrindesNovo(),
            excedenteBrinde>0 && e("p",{key:"bexc", className:"text-[12.5px] font-bold text-amber-200"}, "Excedente de brinde de "+BK(excedenteBrinde)+" entrou no total a pagar."),
            travaExcedente && e("p",{key:"btrava", className:"text-[13px] font-bold text-amber-200"}, "Pague a diferença do brinde para continuar."),
            e("button",{key:"bok", onClick:function(){ if(travaExcedente){ irPagar(); return; } setAcertoForm(Object.assign({}, acertoForm, {brindesOk:true})); setBlocoAberto(5); },
              className:"h-9 w-full rounded-lg text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}}, travaExcedente ? "OK, pagar a diferença" : acertoForm.brindesOk ? "✓ Brindes confirmados" : "OK, escolhi os brindes"),
            e("div",{key:"bnota", className:"flex flex-col gap-1 rounded-xl bg-amber-400/15 p-2.5 text-[12px] leading-snug"},
              e("b",null,"Atenção ao brinde"),
              e("p",null,"• Existem dois brindes: o Normal e o Select (BB)."),
              e("p",{className:"font-bold"},"• "+AVISO_BB),
              e("p",null,"• O brinde só é entregue depois do pagamento e precisa ser retirado com a representante, NA HORA DO ACERTO."),
              e("p",null,"• Qualquer peça que não estiver na hora do acerto é considerada VENDIDA, mesmo que a revendedora diga que pegou de brinde."),
              e("p",null,"• Quem ficar com kit novo pode pegar o brinde do kit antigo ou do kit novo; quem sai do programa pega da maleta que está com ela.")))]),
    blocoAcordeao(5, "novas", "#16A34A", "Próximo Kit Liberado",
      !previaBase || !acertoForm.pagamentos.length ? "Aguardando pagamento" : kitNovoLiberado ? (acertoForm.kitNovoOk ? "Liberado · confirmado" : "Liberado") : "Não liberado",
      !previaBase || !acertoForm.pagamentos.length ? badgeTxt("—","#374151") : badgeTxt(kitNovoLiberado ? (acertoForm.kitNovoOk ? "OK" : "Liberado") : "Não liberado", kitNovoLiberado ? "#CA8A04" : "#64748B"),
      [!previaBase || !acertoForm.pagamentos.length
        ? e("p",{key:"k0", className:"text-[13px] text-[#8E8E93]"},"Preencha as vendas e os pagamentos para saber se o próximo kit está liberado.")
        : e("p",{key:"k1", className:"text-[13px] font-semibold "+(kitNovoLiberado?"text-amber-200":"text-amber-200")},
            dv.blocoDivida ? dv.blocoDivida
            : dv.novas && dv.kitNovoRegra && !dv.kitNovoRegra.liberado ? dv.kitNovoRegra.texto+" ("+N1(pctPagoAcerto)+"% pago)."
            : kitNovoLiberado ? "Próximo Kit Liberado — "+N1(pctPagoAcerto)+"% do acerto pago."
              : previaBase && !previaBase.podeRenovar ? "Próximo kit NÃO fornecido — vendas abaixo de "+BK(versaoSel.gerais.minRenovar)+" (mínimo para renovar o Kit 100% Prata). Cobra só as peças vendidas."
              : "Próximo kit não liberado — "+N1(pctPagoAcerto)+"% pago. Precisa de autorização do financeiro (mínimo "+kitNovoMin+"%)."),
      dv.novas && previaBase && dv.minimo.regra && e("div",{key:"kmed", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-1.5"},
        e("p",{className:"text-[12px] font-semibold text-white"},"Média das últimas 4 vendas"),
        [["Antepenúltima venda",0],["Penúltima venda",1],["Última venda",2]].map(function(r){ var ant = acertoForm.vendasAnteriores||[];   // ordem (Marcus, 26/11/2026): antepenúltima, penúltima, última e a venda de hoje em outra cor; depois a média
          return e("div",{key:"ka"+r[1], className:"flex min-h-8 items-center justify-between gap-2 border-t border-white/10 px-1 text-[13px]"}, e("span",null,r[0]), e("b",{className:MONO+" whitespace-nowrap"}, ant[r[1]]>0 ? BK(ant[r[1]]) : "—")); }),
        e("div",{key:"kh", className:"flex min-h-8 items-center justify-between gap-2 rounded-lg bg-[#2D5190] px-2 text-[13px] font-bold"}, e("span",null,"Venda de hoje"), e("b",{className:MONO+" whitespace-nowrap"}, BK(dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta))),
        e("div",{className:"flex min-h-8 items-center justify-between gap-2 rounded-lg bg-[#C9A13B]/20 px-2 text-[13px] font-bold"},
          e("span",null,"Média · mínimo "+BK(dv.minimo.ref)),
          e("b",{className:MONO+" whitespace-nowrap text-[15px]"}, BK(dv.minimo.media)))),
      kitNovoLiberado && previaBase && acertoForm.pagamentos.length>0 && !kitAbertoConf && e("button",{key:"kab", onClick:function(){ setKitAbertoConf(true); }, className:"h-11 rounded-xl text-[13.5px] font-bold "+BR2, style:{background:"#C9A13B"}}, "Próximo Kit Liberado"),
      kitNovoLiberado && previaBase && acertoForm.pagamentos.length>0 && kitAbertoConf && e("div",{key:"kc", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-1.5"},
        e("p",{className:"text-[12px] font-semibold text-white"},"Condicionais e expositores em aberto — ela continua com:"),
        condAbertasFicam.length+expFicam.length===0 ? e("p",{className:"text-[12.5px] text-[#8E8E93]"},"Nada em aberto: tudo foi conferido neste acerto.")
          : e("div",{className:"flex flex-col gap-1"}, condAbertasFicam.map(function(c){ return e("div",{key:c.numero, className:"flex justify-between rounded-lg bg-black/30 px-2.5 py-1.5 text-[12.5px]"}, e("span",null,"Condicional "+c.numero), e("span",{className:MONO+" text-[#8E8E93]"}, c.pecas+" peças")); }),
              expFicam.map(function(x){ return e("div",{key:x.id, className:"rounded-lg bg-black/30 px-2.5 py-1.5 text-[12.5px]"}, x.qtd+" "+x.nome.toLowerCase()); })),
        // 26/11/2026 (Marcus): só um alerta para contar as peças do próximo kit e assinar; a conferência é pela câmera ou só por contagem (tela "Conferir as peças")
        e("p",{key:"kalerta", role:"alert", className:"rounded-xl bg-[#FEF3C7] px-3 py-2 text-[13px] font-bold text-[#92400E]"}, "⚠ Conte as peças do próximo kit e peça a assinatura da revendedora."),
        ((s.confBip||{})[kitSel.id]||{}).fim
          ? e("button",{onClick:function(){ setConfVolta("calcacerto"); setTela("confkit"); }, className:"h-10 rounded-xl text-[13px] font-bold "+BR2, style:{background:"#3F3F46"}}, "✓ Próximo kit confirmado e conferido (ver)")
          : e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {kitNovoOk:true})); setConfVolta("calcacerto"); setTela("confkit"); }, className:"h-11 rounded-xl text-[13.5px] font-bold "+BR2, style:{background:"#C9A13B"}}, "Confirmar próximo kit"))]),
    blocoAcordeao(6, "caixa", "#0891B2", "Peças próximo mês",
      dv.pecasProx ? "Liberadas: "+dv.pecasProx.liberadas+" peças" : "Preencha as vendas",
      dv.pecasProx ? checkOk : badgeTxt("","#64748B"),
      !dv.pecasProx ? [e("p",{key:"p0", className:"text-[13px] text-[#8E8E93]"},"Preencha o valor vendido para ver quantas peças ela pode pegar no próximo mês.")]
      : [[["Valor da venda", BK(previaBase.vendaLiquida)],["Quantidade base", dv.pecasProx.base+" peças"],["Valor em aberto", BK(faltaAtual)],["% em aberto", N1(dv.pecasProx.pctAberto)+"%"],["% de liberação", Math.round(dv.pecasProx.fator*100)+"%"]].map(function(l,k){
          return e("div",{key:"pl"+k, className:"flex min-h-8 items-center justify-between gap-2 border-t border-white/10 px-1 text-[13px]"}, e("span",null,l[0]), e("b",{className:MONO+" whitespace-nowrap"}, l[1])); }),
        e("div",{key:"pfim", className:"flex min-h-8 items-center justify-between gap-2 rounded-lg bg-[#C9A13B]/20 px-2 text-[13px] font-bold"}, e("span",null,"Liberadas"), e("b",{className:MONO+" whitespace-nowrap text-[15px]"}, dv.pecasProx.liberadas+" peças")),
        dv.pecasProx.liberadas>0 && e("div",{key:"p3", className:"flex flex-col gap-2"},
          acertoForm.pecasProxCodigos.length<dv.pecasProx.liberadas && e("div",{className:"flex gap-1.5"},
            e("input",{value:codProx, placeholder:"Código da peça", autoCapitalize:"characters", "aria-label":"Código da peça", onChange:function(ev){ setCodProx(limitarCodigo(ev.target.value)); },
              className:"h-8 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-[13px] uppercase text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("button",{disabled:!codigoPecaValido(codProx), onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {pecasProxCodigos:acertoForm.pecasProxCodigos.concat([codProx])})); setCodProx(""); },
              className:"h-8 shrink-0 rounded-lg px-3 text-[13px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}}, "Adicionar")),
          (acertoForm.pecasProxCodigos||[]).map(function(c,i){
            return e("div",{key:"pc"+i, className:"flex min-h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[.07] px-2.5 text-[13px]"},
              e("b",{className:MONO+" flex-1"}, c),
              e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {pecasProxCodigos:acertoForm.pecasProxCodigos.filter(function(x,j){return j!==i;})})); }, "aria-label":"Remover "+c, className:"grid size-6 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70"}, "×")); }),
          e("div",{className:"flex min-h-8 items-center justify-between gap-2 border-t border-white/10 px-1 text-[13px]"}, e("span",null,"Escolhidas"), e("b",{className:MONO}, acertoForm.pecasProxCodigos.length+" de "+dv.pecasProx.liberadas))),
        dv.pecasProx.liberadas===0 && e("p",{key:"p4", className:"text-[13px] font-semibold text-amber-200"},"Nenhuma peça liberada")]),
    blocoAcordeao(7, "caixa", "#CA8A04", "Devolução de peças",
      pecasADevolver===null ? "Bipe as peças que voltaram nas condicionais" : pecasADevolver+" peças pra devolver",
      pecasADevolver===null ? badgeTxt("Pendente","#64748B") : badgeTxt(pecasADevolver+" peças","#CA8A04"),
      [e("div",{key:"dalerta", role:"alert", className:"flex flex-col gap-0.5 rounded-xl bg-amber-400/15 p-2.5 text-[13px] leading-snug"}, e("b",null,"⚠ Atenção: conte as peças"), e("span",null,"Conte quantas peças estão voltando para a empresa. Confira o número abaixo com a revendedora antes de levar.")),
       [["Peças das condicionais", pecasCondSelecionadas],["Total de vendidas", acertoForm.pecasVendidas||0],["Total de brindes", acertoForm.brindes.length],["Trocas deste kit (ficaram com ela)", dv.nTrocasMes]].map(function(c){
        return e("div",{key:c[0], className:"flex items-center justify-between gap-2 text-[12.5px] text-[#8E8E93]"}, e("span",null,c[0]), e("b",{className:MONO+" text-white"}, c[1])); }),
      (dv.nTrocasMes+dv.nTrocasAnt)>0 && e("p",{key:"dq", className:"text-[11.5px] text-[#8E8E93]"}, (dv.nTrocasMes+dv.nTrocasAnt)+" peça(s) quebrada(s) voltam junto para a empresa."),
      e("div",{key:"dtot", className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[13px] font-bold"},
        e("span",{className:"text-amber-200"},"Peças a devolver pra empresa"),
        e("span",{className:MONO+" text-amber-200"}, pecasADevolver===null ? "—" : pecasADevolver))]),
    jaAcertado
      ? e("div",{className:"flex flex-col gap-2"}, e("p",{className:"rounded-2xl bg-white/5 px-3 py-2 text-center text-[12.5px] font-bold text-amber-200"},"Acerto já registrado e assinado — só consulta."),
          e("button",{onClick:function(){ setTela("fechamento"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro},"Ver mensagens de fechamento"))
      : [
        // venda abaixo do mínimo (R$ 500): a representante justifica antes de confirmar (Marcus, 29/10/2026)
        vendaBaixa && e("div",{key:"vb", className:"flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5"},
          e("p",{className:"text-[12.5px] font-semibold text-amber-200"}, "Venda abaixo de "+BK(minVendaGeral)+": informe o motivo"),
          e("div",{className:"flex flex-wrap gap-1.5"}, motivosVB.map(function(m){ var on = acertoForm.motivoVendaBaixa===m;
            return e("button",{key:m, onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {motivoVendaBaixa:on ? "" : m})); }, "aria-pressed":on,
              className:"rounded-full px-3 py-1.5 text-[12.5px] font-semibold "+(on ? "text-[#1B1409]" : "bg-white/10 text-white"), style:on ? {background:"#E8B84B"} : null}, m); })),
          acertoForm.motivoVendaBaixa==="Outro" && e("input",{value:acertoForm.motivoVendaBaixaTexto||"", placeholder:"Escreva o motivo", maxLength:140,
            onChange:function(ev){ setAcertoForm(Object.assign({}, acertoForm, {motivoVendaBaixaTexto:ev.target.value})); },
            className:"h-10 rounded-lg bg-black/50 px-3 text-[14px] text-white outline-none ring-1 ring-white/10"})),
        e("button",{key:"cf", disabled:acertoForm.vendaBruta==null || faltaMotivoVB || travaExcedente || aguardaContaN>0 || semCompN>0, onClick:function(){ reenviarComp(); setTela("assinaracerto"); },
          className:"h-11 rounded-2xl text-[14px] font-bold disabled:opacity-40 "+ouro}, faltaMotivoVB ? "Informe o motivo da venda baixa" : travaExcedente ? "Pague a diferença do brinde" : aguardaContaN>0 ? "Anexe o comprovante do pagamento" : semCompN>0 ? "Anexe o comprovante do pagamento" : "Confirmar acerto")]);

  // Assinatura da revendedora ao finalizar o acerto (deixou o kit): resumo, check de "li e entendi as regras" e assinatura digital.
  var telaAssinarAcerto = kitSel && previaAcerto && e(TelaAssinatura,{titulo:"Assinatura do acerto", nome:sel.rev, modo:"unico",
    regras: versaoBaseSel ? textoRegras(versaoBaseSel, modalidadeKit) : [], rotuloBotao:"Finalizar acerto", semAssinatura:{permitido:!acertoForm.kitNovoOk && ((s.cfg||{}).minAcertosSemAssinatura||0)<=(s.acertosConsignado||[]).filter(function(r0){ return r0.rev===sel.rev && r0.tipo==="acerto"; }).length, bloqueio: acertoForm.kitNovoOk ? "Sem assinatura não leva kit novo: o kit novo só sai com a assinatura dela." : "Só para revendedora com pelo menos "+((s.cfg||{}).minAcertosSemAssinatura||0)+" acertos anteriores."},
    resumo:[["Vendas", BK(acertoForm.vendaBruta)], ["Comissão", previaAcerto.comissaoPct+"%"], ["Valor de Acerto", BK(previaAcerto.valorAcerto), "text-[#A67C12]"],
      ["Pago", BK(totalPagoAtual)], ["Valor restante", restanteTotal>0.009 ? BK(restanteTotal) : "R$ 0,00 · quitado", restanteTotal>0.009 ? "text-[#B91C1C]" : "text-[#15803D]"],
      ["Brindes", brindeBloqueio ? "Sem brinde" : acertoForm.brindes.length+" peça(s) lançada(s)"],
      ["Próximo kit", !acertoForm.pagamentos.length ? "—" : kitNovoLiberado ? "Liberado" : "Não liberado"]],
    onVoltar:function(){ setTela("calcacerto"); },
    onAbrirRegras:function(){ setRegrasDaAssinatura("assinaracerto"); setTela("regrascom"); },
    onConcluir:function(r){ d(payloadAcerto({assinatura:r.assinatura, regrasLidas:r.regrasLidas!==false, semAssinatura:r.semAssinatura||null})); if(kitSel){ if(apiAtiva()) chamar("DELETE", "/representante/rascunho?rep="+encodeURIComponent(l.rep)+"&kitId="+encodeURIComponent(kitSel.id)+"&final=1").catch(function(){}); } d({type:"GR", op:"credito_usar", revendedora:sel.rev, kitId:kitSel.id, por:"Acerto"}); setTela("fechamento"); }});
  // Assinatura da reposição (03/11/2026): mesmo desenho do acerto: botão das regras, check de leitura e assinatura da revendedora
  var telaAssinarRepos = kitSel && kitSel.tipoKit==="reposicao" && (function(){ var tk = totaisKit(condicionaisDoKit(kitSel)), kcR = kitConfDe(kitSel.id);
    return e(TelaAssinatura,{titulo:"Assinatura da reposição", nome:sel.rev, modo:"unico", regras:[], rotuloBotao:"Concluir reposição",
      resumo:[["Condicionais", String(tk.condicionais)], ["Peças", String(tk.pecas)], ["Valor total", BK(tk.valor)], ["Peças conferidas", kcR ? kcR.lidas+" de "+kcR.esperadas : "—"]],
      onVoltar:function(){ setTela("reposicao"); },
      onAbrirRegras:function(){ setRegrasDaAssinatura("assinarrepos"); setTela("regrascom"); },
      onConcluir:function(r){ d({type:"REPOSICAO_ENTREGAR", id:kitSel.id, assinatura:r.assinatura, regrasLidas:true}); setReposAss(true); setTela("resumokn"); }}); })();
  // Fechar atendimento: mensagem pronta para a revendedora e para o grupo da empresa
  var msgs = kitSel && previaAcerto ? mensagemFechamento({nome:sel.rev, rep:l.rep, data:isoDia(new Date()), dv:dv, form:acertoForm, condFicam:condAbertasFicam, expFicam:expFicam, kitConf:kitConfDe(kitSel.id),
    remarcacoes:(kitSel.remarcacoesLista||[]).length ? kitSel.remarcacoesLista.length+" ("+vezCobravel(kitSel.remarcacoesLista)+" com multa)" : ""}) : null;
  var copiarMsg = function(chave, txt){ try{ navigator.clipboard.writeText(txt); }catch(x){} setMsgCopiada(chave); setTimeout(function(){ setMsgCopiada(null); }, 1600); };
  var telaFechamento = msgs && e("div",{className:"flex flex-col gap-3 pb-4"},
    e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Fechar atendimento")),
    e("p",{className:"rounded-2xl bg-[#1C1C1E] px-3 py-2.5 text-center text-[13px] font-semibold"}, e("span",{className:"text-[#C9A13B]"}, "✓ "), "Acerto de "+sel.rev+" registrado e assinado. Envie as mensagens abaixo."),
    [["cliente","Mensagem para a revendedora", msgs.cliente],["grupo","Mensagem para o grupo da empresa", msgs.grupo]].map(function(m){
      var BTN2 = "grid h-10 flex-1 place-items-center rounded-xl text-[13px] font-semibold "+BR2, ST2 = {background:"#3F3F46"};
      return e("div",{key:m[0], className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
        e("b",{className:"text-center text-[13.5px]"}, m[1]),
        e("textarea",{readOnly:true, value:m[2], rows:Math.min(16, m[2].split("\n").length+1), className:"w-full resize-none rounded-xl bg-black/40 p-2.5 text-[12px] leading-snug text-white outline-none ring-1 ring-white/10"}),
        e("button",{onClick:function(){ copiarMsg(m[0], m[2]); }, className:"h-10 w-full rounded-xl text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}}, msgCopiada===m[0] ? "✓ Copiado" : "Copiar mensagem"),
        m[0]==="cliente" && e("div",{className:"flex gap-2"},
          e("button",{onClick:function(){ abrirPdfAcerto("Acerto de "+sel.rev, m[2]); }, className:BTN2, style:ST2}, "Baixar PDF"),
          sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(m[2]), target:"_blank", rel:"noreferrer", className:BTN2, style:ST2}, "Abrir no WhatsApp"))); }),
    e("button",{onClick:function(){ setTela("rev"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro}, "Concluir"));
  var blocoClaro = "rounded-2xl border "+LINHA_CARD+" bg-white p-3 text-[13px] text-[#111827]";
  var perfilAtual = sel ? (s.perfisRev[sel.rev] || {}) : {};
  var fone1 = perfilAtual.fone1!==undefined ? perfilAtual.fone1 : (sel && sel.fone) || "";
  var fone2 = perfilAtual.fone2 || "";
  var refsBase = [];
  var refsAtuais = (perfilAtual.refs || refsBase).slice(0,3);
  var salvarPerfil = function(patch){ if(sel) d({type:"SALVAR_PERFIL_REV", chave:sel.rev, patch:Object.assign({}, patch, (sel.cod || sel.codRev) ? {revCod:String(sel.cod || sel.codRev)} : {})}); };
  var setRef = function(i, campo, valor){ var novo = [0,1,2].map(function(j){ return Object.assign({nome:"",rel:"",fone:""}, refsAtuais[j]); });
    novo[i][campo] = valor; salvarPerfil({refs:novo}); };
  var enderecoCasa = perfilAtual.enderecoCasa!==undefined ? perfilAtual.enderecoCasa : (sel && sel.bairro) || "";
  var enderecoTrabalho = perfilAtual.enderecoTrabalho || "";
  var profissao = perfilAtual.profissao || "";
  var formatarFone = function(v){
    var d = (v||"").replace(/\D/g,"").slice(0,11);
    if(d.length<=2) return d.length ? "("+d : d;
    if(d.length<=6) return "("+d.slice(0,2)+") "+d.slice(2);
    if(d.length<=10) return "("+d.slice(0,2)+") "+d.slice(2,6)+"-"+d.slice(6);
    return "("+d.slice(0,2)+") "+d.slice(2,7)+"-"+d.slice(7);
  };
  var campoEdit = function(label, chave, placeholder, defaultVal, formatador){
    var val = perfilAtual[chave]!==undefined ? perfilAtual[chave] : (defaultVal||"");
    return e("div",{key:chave, className:"py-1.5"},
      e("p",{className:"mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-[#9A8B63]"}, label),
      e("input",{value:val, placeholder:placeholder||"", inputMode: formatador?"tel":undefined,
        onChange:function(ev){ var o={}; o[chave]= formatador ? formatador(ev.target.value) : ev.target.value; salvarPerfil(o); },
        className:"h-9 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}));
  };
  var linhaInfo = function(label, valor, opts){ opts = opts||{};
    return e("div",{key:label, className:"flex items-start justify-between gap-2 py-1.5"+(opts.primeiro?"":" border-t "+LINHA_CARD)},
      e("div",{className:"min-w-0 flex-1"},
        e("p",{className:"text-[10px] font-bold uppercase tracking-wide", style:{color:opts.cor||"#9A8B63"}}, label),
        valor ? e("p",{className:"mt-0.5 text-[13.5px] font-semibold leading-snug text-[#111827]"}, valor)
              : e("p",{className:"mt-0.5 text-[12.5px] font-semibold text-amber-700"}, "Pendente")),
      e("div",{className:"flex shrink-0 items-center gap-1.5"},
        opts.favKey && valor && e("button",{onClick:function(){ salvarPerfil({enderecoFavorito: opts.favAtivo ? null : opts.favKey}); },
          "aria-label": opts.favAtivo ? "Tirar "+label+" dos favoritos" : "Marcar "+label+" como favorito", title: opts.favAtivo ? "Favorito (aparece na lista)" : "Marcar como favorito",
          className:"grid size-7 shrink-0 place-items-center rounded-full "+(opts.favAtivo ? "bg-amber-400 text-white" : "bg-black/5 text-[#9CA3AF]")},
          e(Icon,{n:"star", s:13, peso: opts.favAtivo ? "fill" : undefined})),
        opts.copiar && valor && e("button",{onClick:function(){ copiarEndereco(opts.id, valor); }, "aria-label":"Copiar "+label,
          className:"grid size-7 shrink-0 place-items-center rounded-full "+(copiadoId===opts.id ? "bg-emerald-500 text-white" : "bg-black/5 text-[#4B5563]")},
          e(Icon,{n: copiadoId===opts.id ? "check" : "copiar", s:13}))));
  };
  var vdSel = sel ? vendMes(sel) : 0;
  var acertoSel = sel ? Math.round(vdSel*(1-((comissaoRev(vdSel, s.cfg)||{pct:0}).pct/100))) : 0;
  var comissaoRepSel = Math.round(acertoSel*PCT_COMISSAO_REP_CARD);
  var linhaFone = function(fone, id, label){ return e("div",{className:"flex items-center justify-between gap-2"},
    e("span",{className:MONO+" text-[13px] font-bold text-[#4B3B14]"}, fone),
    e("div",{className:"flex shrink-0 items-center gap-1.5"},
      e("button",{onClick:function(){ copiarEndereco(id, fone); }, "aria-label":"Copiar "+label,
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(copiadoId===id ? "bg-emerald-500 text-white" : "bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: copiadoId===id ? "check" : "copiar", s:13})),
      e("button",{type:"button", onClick:function(){ abrirChat(sel.rev); }, "aria-label":"Conversar no chat", title:"Conversar no chat", className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14})))); };
  var blocoNome = sel && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
    e("div",{className:"flex items-center justify-between gap-2 px-3 py-1"},
      e("b",{className:"min-w-0 text-[13px] font-extrabold text-[#111827]"}, sel.rev),
      e("button",{onClick:function(){ setEditandoPerfil(!editandoPerfil); }, "aria-label":editandoPerfil?"Concluir edição":"Editar dados",
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(editandoPerfil?"bg-emerald-500 text-white":"bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: editandoPerfil?"check":"pencil", s:14}))),
    e("div",{className:"flex flex-col gap-1 border-t "+LINHA_CARD+" px-3 py-1"},
      editandoPerfil
        ? e(React.Fragment,null,
            campoEdit("Telefone (WhatsApp)","fone1","(41) 90000-0000", sel.fone, formatarFone),
            campoEdit("2º telefone (opcional)","fone2","(41) 90000-0000", null, formatarFone))
        : e(React.Fragment,null,
            fone1 && linhaFone(fone1, "fone1-"+sel.id, "WhatsApp de "+sel.rev),
            fone2 && e("div",{className:"border-t "+LINHA_CARD+" pt-1.5"}, linhaFone(fone2, "fone2-"+sel.id, "2º WhatsApp de "+sel.rev)))),
    e("div",{className:"grid grid-cols-3 divide-x divide-[#E9DDBB] border-t "+LINHA_CARD+" py-1 text-center"},
      col("VENDIDO", BK(vdSel), "#15803D"), col("ACERTO", BK(acertoSel), "#2563EB"), col("COMISSÃO", BK(comissaoRepSel), "#A67C12")));
  var GRAD_OURO = "linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)";
  var CorEnd = "#A67C12";
  var blocoEnderecos = sel && e("div",{className:"rounded-2xl border "+LINHA_CARD+" p-3", style:{background:GRAD_OURO}},
    editandoPerfil
      ? e(React.Fragment,null,
          campoEdit("Endereço residencial","enderecoCasa","Rua, número - bairro, cidade - UF", sel.bairro),
          campoEdit("Endereço de trabalho","enderecoTrabalho","Rua, número - bairro, cidade - UF"),
          campoEdit("Profissão","profissao","Ex.: Cabeleireira"))
      : e(React.Fragment,null,
          linhaInfo("Endereço residencial", enderecoCasa, {copiar:true, id:"end-"+sel.id, primeiro:true, cor:CorEnd, favKey:"casa", favAtivo:perfilAtual.enderecoFavorito==="casa"}),
          linhaInfo("Endereço de trabalho", enderecoTrabalho, {copiar:true, id:"endtrab-"+sel.id, cor:CorEnd, favKey:"trabalho", favAtivo:perfilAtual.enderecoFavorito==="trabalho"}),
          linhaInfo("Profissão", profissao, {cor:CorEnd})));
  var CorRef = "#A67C12";
  var blocoRefs = sel && e("div",{className:"flex flex-col gap-2 rounded-2xl border "+LINHA_CARD+" p-3", style:{background:GRAD_OURO}},
    e("p",{className:"text-[11px] font-bold uppercase tracking-wide", style:{color:CorRef}},"Contatos de referência"),
    [0,1,2].map(function(i){
      var r = Object.assign({nome:"",rel:"",fone:""}, refsAtuais[i]); var vazio = !r.nome && !r.rel && !r.fone;
      if(editandoPerfil) return e("div",{key:i, className:"flex flex-col gap-1.5 rounded-xl bg-white p-2.5"},
        e("div",{className:"flex gap-1.5"},
          e("input",{value:r.nome, placeholder:"Nome", onChange:function(ev){setRef(i,"nome",ev.target.value);},
            className:"h-9 flex-1 rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}),
          e("input",{value:r.rel, placeholder:"Relação", onChange:function(ev){setRef(i,"rel",ev.target.value);},
            className:"h-9 w-24 rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"})),
        e("input",{value:r.fone, placeholder:"Telefone", onChange:function(ev){setRef(i,"fone",ev.target.value);},
          className:"h-9 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] text-[#111827] outline-none ring-1 ring-black/10"}));
      return e("div",{key:i, className:"flex items-center gap-2 rounded-xl bg-white px-2.5 py-2"},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-full text-white", style:{background:CorRef}}, e(Icon,{n:"user", s:14})),
        e("div",{className:"min-w-0 flex-1"},
          vazio
            ? e("p",{className:"text-[12.5px] font-semibold text-amber-700"},"Pendente")
            : e(React.Fragment,null,
                e("p",{className:"truncate text-[13px] font-semibold text-[#111827]"}, r.nome+(r.rel?" · "+r.rel:"")),
                e("p",{className:"text-[12px] text-[#6B7280]"}, r.fone||"—"))),
        !vazio && r.fone && e("a",{href:"https://wa.me/55"+r.fone.replace(/\D/g,""), target:"_blank", rel:"noreferrer", "aria-label":"WhatsApp de "+r.nome,
          className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14}))); }));
  var botaoCondicionais = e("button",{className:"flex w-full items-center gap-3 "+blocoClaro+" text-left"},
    e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:"#0891B21F", color:"#0891B2"}}, e(Icon,{n:"lock", s:16})),
    e("b",{className:"text-[14px] text-[#111827]"},"Condicionais"));
  var blocoStatusHoje = sel && sel.hoje && e("div",{className:"flex flex-col gap-2"},
    // 05/11/2026 (Marcus): bloco compacto, uma linha só (listagem de hoje · tipo do kit · situação)
    e("div",{className:"flex min-h-8 items-center justify-between gap-2 rounded-2xl border "+LINHA_CARD+" bg-white px-3 py-1"},
      e("span",{className:"min-w-0 flex-1 text-[13px] leading-tight text-[#111827]"}, e("b",null,"Hoje"), " · "+(TIPO_KIT[sel.tipoKit]||TIPO_KIT.acerto_kit)[0]),
      badge(STATUS_REP[sel.status]||STATUS_LB[sel.status]||"", STATUS_TP[sel.status])),
    jaAcertado && kitSel.acerto && e("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px]"},
      e("b",{className:"text-emerald-700"},"Acerto registrado"),
      e("p",{className:"text-[11.5px] text-emerald-900/70"}, "Venda líquida "+BK(kitSel.acerto.vendaLiquida)+" · comissão "+BK(kitSel.acerto.comissao)+" ("+kitSel.acerto.comissaoPct+"%) · valor do acerto "+BK(kitSel.acerto.valorAcerto)),
      (kitSel.acerto.brindeNormal>0 || kitSel.acerto.brindeSelect>0) && e("p",{className:"text-[11.5px] text-emerald-900/70"}, "Brinde: normal "+BK(kitSel.acerto.brindeNormal)+" · select "+BK(kitSel.acerto.brindeSelect))),
    jaAcertado && kitSel.acertoAssinado && e("p",{className:"px-1 text-[11.5px] font-semibold text-emerald-700"},"✓ Acerto assinado pela revendedora"),
    jaAcertado && kitSel.kitNovoEntregue && e("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px]"},
      e("b",{className:"text-emerald-700"},"Kit novo entregue e assinado"),
      e("p",{className:"text-[11.5px] text-emerald-900/70"}, "Condicionais "+kitSel.kitNovoEntregue.condicionais.join(", ")+" · "+kitSel.kitNovoEntregue.pecasTotal+" peças"
        +(kitSel.kitNovoEntregue.pecasFaltaram ? " · "+kitSel.kitNovoEntregue.pecasFaltaram+" em falta" : " · conferido, sem divergência"))),
    jaAcertado && kitSel.reposicaoEntregue && e("div",{className:"rounded-2xl border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px]"},
      e("b",{className:"text-emerald-700"},"Reposição entregue"), kitSel.comissaoFixa ? e("p",{className:"text-[11.5px] text-emerald-900/70"},"Comissão "+BK(kitSel.comissaoFixa)) : null));
  // Marcus, 24/11/2026: quando a representante já agendou o atendimento, o botão vira "Atendimento agendado · Mudar data" (leva ao pedido de mudança de data, que pergunta o motivo); o botão "Alterar data do acerto" saiu.
  var hojeAg = isoDia(new Date());
  var kitAgendado = sel && !sel.realizado && (sel.hoje || s.kits.some(function(k){ return k.rev===sel.rev && k.status!=="retirado" && minhasL.some(function(x){ return x.id===k.lid && (x.data||"")>=hojeAg; }); }));
  var botaoAgendar = sel && (kitAgendado
    ? e("button",{onClick:function(){ setTela("pedidodata"); setMenuAberto(false); }, className:"flex min-h-8 w-full flex-col items-center justify-center rounded-xl px-2 py-1 text-center text-[13px] font-extrabold leading-tight "+ouro}, e("span",null,"Atendimento agendado"), e("span",{className:"text-[13px] font-semibold underline"},"Mudar data"))
    : e("button",{onClick:function(){ setAgendarAberto(!agendarAberto); setMenuAberto(false); }, className:"flex min-h-8 w-full items-center justify-center rounded-xl px-2 py-1 text-center text-[13px] font-extrabold leading-tight "+ouro},
    "Agendar atendimento"));
  // limite de reposições por semana da representante (Encomendas e reposições → Regras, padrão 10; semana de segunda a domingo)
  var limiteReposSemana = ((((s.er||{}).config||{}).reposicao||{}).repPorSemana) || 10;
  var semanaAgenda = inicioSemana(agendaForm.data || isoDia(new Date()));
  var reposSemana = s.kits.filter(function(k){ if(k.tipoKit!=="reposicao") return false; var lk = s.listagens.find(function(x){ return x.id===k.lid; }); return !!lk && lk.rep===l.rep && inicioSemana(lk.data || isoDia(new Date()))===semanaAgenda; }).length;
  var reposCheia = reposSemana>=limiteReposSemana;
  var listagensNaData = sel && agendaForm.data ?s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada && x.data===agendaForm.data;}) : [];
  useEffect(function(){ if(!autoAg) return; if(listagensNaData.length>0){ setAutoAg(false); if(!(tipoAgenda==="reposicao" && reposCheia)){ pedir(tipoAgenda, {lid:listagensNaData[0].id, hora:agendaForm.hora||null, ficarNaTela:true}); setAgendarAberto(false); } return; } var tm = setTimeout(function(){ setAutoAg(false); }, 4000); return function(){ clearTimeout(tm); }; }, [autoAg, listagensNaData.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function(){ if(!semAg) return; var hojeI = isoDia(new Date()), lh = s.listagens.find(function(x){ return x.rep===l.rep && x.data===hojeI && !x.fechada; });
    if(lh){ setSemAg(false); setAbrirSemAg(true); pedir("acerto_kit", {lid:lh.id, hora:new Date().toTimeString().slice(0,5), ficarNaTela:true, semAgendamento:true}); return; }
    var tm = setTimeout(function(){ setSemAg(false); }, 4000); return function(){ clearTimeout(tm); }; }, [semAg, s.listagens.length]);   // eslint-disable-line react-hooks/exhaustive-deps
  var blocoAgendaForm = sel && agendarAberto && e("div",{className:"flex flex-col gap-2 rounded-2xl border "+LINHA_CARD+" bg-white p-3 shadow-sm"},
      e("div",{className:"flex gap-2"},
        e("input",{type:"date", value:agendaForm.data, onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {data:ev.target.value}));},
          className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
        e("input",{type:"time", value:agendaForm.hora, placeholder:"Horário", onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {hora:ev.target.value}));},
          className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
      e("select",{value:tipoAgenda, "aria-label":"Tipo do atendimento", onChange:function(ev){ setTipoAgenda(ev.target.value); }, className:"h-8 w-full rounded-lg bg-[#F4F5F7] px-2 text-[13px] font-bold text-[#111827] outline-none ring-1 ring-black/10"},
        [["acerto_kit","Acerto + kit"],["saiu","Acerto + retirada (saída)"],["kit_novo","Kit novo"],["reposicao","Reposição"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })),   // tipos do Agendar (Marcus, 24/11/2026: faltavam acerto + retirada e kit novo)
      tipoAgenda==="reposicao" && e("p",{className:"text-[13px] text-[#111827]"}, "Reposições na semana: "+reposSemana+" de "+limiteReposSemana),
      !agendaForm.data
        ? e("p",{className:"text-[12px] text-[#6B7280]"},"Escolha o dia do atendimento com a revendedora.")
        : listagensNaData.length>0
          ? e("div",{className:"flex flex-col gap-2"}, listagensNaData.map(function(x){
              var kitsX = s.kits.filter(function(k){return k.lid===x.id;});
              var cheiaX = listagemCheia(s, x.id), foraX = passouPrazo(x, Date.now(), s.cfg) && !SEM_KIT[tipoAgenda];
              return e("div",{key:x.id, className:"flex flex-col gap-1.5 rounded-xl border "+LINHA_CARD+" bg-[#F4F5F7] p-2.5"},
                e("div",{className:"flex items-center justify-between gap-2"},
                  e("div",null,
                    e("b",{className:"text-[13px] text-[#111827]"}, "Retirada "+x.horario+(x.horario2 ? " e "+x.horario2 : "")+" · "+x.destino),
                    e("p",{className:"text-[11px] text-[#6B7280]"}, x.viagem?"Viagem":"")),
                  e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    style: cheiaX ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
                    kitsNaListagem(s,x.id)+"/"+(x.viagem?"∞":capacidadeListagem(x)))),
                kitsX.length>0 && e("div",{className:"flex flex-col gap-0.5 border-t "+LINHA_CARD+" pt-1.5"},
                  kitsX.map(function(k){ return e("p",{key:k.id, className:"truncate text-[11px] text-[#6B7280]"},
                    (k.horaAtend?k.horaAtend+" · ":"")+k.rev+(k.bairro?" · "+k.bairro:"")); })),
                foraX && e("p",{className:"text-[11px] font-semibold text-rose-600"},"Prazo encerrado ("+prazoDaListagem(x, s.cfg).texto+"). Só a Deysiane libera."),
                e("button",{disabled:cheiaX || foraX || x.fechada || (tipoAgenda==="reposicao" && reposCheia), onClick:function(){ pedir(tipoAgenda, {lid:x.id, hora:agendaForm.hora||null, ficarNaTela:true}); setAgendarAberto(false); },
                  className:"h-8 rounded-lg text-[13px] font-bold disabled:opacity-40 "+ouro}, cheiaX ? "Listagem cheia" : tipoAgenda==="reposicao" ? (reposCheia ? "Limite de reposições da semana" : "Agendar reposição") : tipoAgenda==="saiu" ? "Agendar acerto e retirada" : tipoAgenda==="kit_novo" ? "Agendar kit novo" : "Agendar nessa listagem"));
            }))
          : e(React.Fragment,null,
              e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta para esse dia ainda. Crie uma:"),
              e(NovaListagemRep,{key:"nl"+agendaForm.data, s:s, d:d, rep:l.rep, data:agendaForm.data, ouro:ouro, semKit:!!SEM_KIT[tipoAgenda], aoCriar:function(){ setAutoAg(true); }})));
  var blocoSolicitar = sel && !sel.hoje && mostrarSolicitar && e("div",{className:"flex flex-col gap-2 "+blocoClaro},
    e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-[#6B7280]"},"Solicitar kit pra retirada"),
    minhasL.length===0
      ? e("div",{className:"flex flex-col gap-2"},
          e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta ainda. Crie uma para continuar."),
          e(NovaListagemRep,{s:s, d:d, rep:l.rep, ouro:ouro}))
      : e(React.Fragment,null,
          novaListagemAberta && e(NovaListagemRep,{s:s, d:d, rep:l.rep, ouro:ouro, aoCancelar:function(){ setNovaListagemAberta(false); }, aoCriar:function(){ setNovaListagemAberta(false); }}),
          !novaListagemAberta && e("button",{type:"button", onClick:function(){ setNovaListagemAberta(true); }, className:"flex h-8 items-center justify-center gap-1.5 rounded-xl bg-[#F3F4F6] text-[13px] font-semibold text-[#111827]"}, e(Icon,{n:"plus", s:14}), "Nova listagem"),
          e("select",{value:lPed.id, onChange:function(ev){setLidPed(ev.target.value);}, "aria-label":"Listagem",
            className:"h-10 rounded-xl bg-[#F4F5F7] px-3 text-sm font-semibold text-[#111827] outline-none ring-1 ring-black/10"},
            minhasL.map(function(x){ var cheiaX = listagemCheia(s, x.id);
              return e("option",{key:x.id, value:x.id, disabled:cheiaX}, "Retirada "+x.horario+" · "+x.destino+" ("+kitsNaListagem(s,x.id)+"/"+capacidadeListagem(x)+")"+(cheiaX?" · Lotada":"")); })),
          passouPrazo(lPed, Date.now(), s.cfg) && e("p",{className:"text-[12px] font-semibold text-rose-600"},"Prazo encerrado ("+prazoDaListagem(lPed, s.cfg).texto+"). Só a Deysiane libera."),
          listagemCheia(s, lPed.id) && e("p",{className:"text-[12px] font-semibold text-rose-600"},"Essa listagem já está cheia. Escolha outra."),
          e("button",{disabled:listagemCheia(s, lPed.id) || passouPrazo(lPed, Date.now(), s.cfg), onClick:function(){pedir("acerto_kit"); setMostrarSolicitar(false);},
            className:"h-10 rounded-xl text-[13px] font-bold disabled:opacity-40 "+ouro},"Confirmar: acerto + kit")));
  var abrirAcertoNovo = function(){
    // Andrielle Taborda vem com o exemplo que o Marcus pediu já preenchido (condicionais + venda + 1 remarcação), pra testar o resto.
    var demoAndrielle = sel.rev==="Andrielle Taborda", demoMarcia = sel.rev==="Márcia Camargo";   // Márcia: acerto normal de R$ 12.268,00, sem kit novo
    var pgsPedidos = pagamentosDoPedido(s.lancFin, kitSel.id, s);   // pagamentos que ela já lançou e pediu conta antes de sair da tela
    if(apiAtiva()){ var kidB = kitSel.id; chamar("GET", "/representante/rascunho?rep="+encodeURIComponent(l.rep)+"&kitId="+encodeURIComponent(kidB)).then(function(j){ var x = j && j.rascunho; if(!x) return; var c = maisCompleto(x.dados, x.melhor); if(!c || pontosAcerto(c.acertoForm)<=0) return;
      setAcertoForm(function(f0){ if(pontosAcerto(f0)>=pontosAcerto(c.acertoForm)) return f0; var f = Object.assign({}, FORM_ACERTO_VAZIO, c.acertoForm||{}); var ps = f.pagamentos||[]; (f0.pagamentos||[]).forEach(function(z){ if(!ps.some(function(y){ return y.pid===z.pid; })) ps = ps.concat([z]); }); f.pagamentos = ps; d({type:"AVISO", txt:"Acerto recuperado do servidor: continua de onde parou.", tom:"ok"}); return f; }); }).catch(function(){}); }
    setAcertoForm(Object.assign({}, FORM_ACERTO_VAZIO, demoAndrielle ? {vendaBruta:3000, condicionaisSelecionadas:["091719","092240"]} : demoMarcia ? {vendaBruta:12268, condicionaisSelecionadas:["093801","093802"]} : {}, {vendasAnteriores:vendasAntSistema()}, pgsPedidos.length ? {pagamentos:pgsPedidos} : {}));
    if(demoAndrielle && !(kitSel.remarcacoesLista||[]).length) d({type:"KIT_REMARCAR", id:kitSel.id, isenta:false, motivo:""});
    setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(0); setTela("calcacerto"); };
  var previstaTxt = ((l && l.data) || isoDia(new Date())).split("-").reverse().join("/");
  var opcoesAtendimento = [
    {lb: jaAcertado ? "Ver acerto (já registrado)" : "Realizar acerto + kit novo", icone:"calc", cor:"#16A34A", ativo:true, onClick:function(){ setMenuAberto(false);
      if(sel.hoje && jaAcertado && kitSel){
        var regVer = (s.acertosConsignado||[]).find(function(r){ return r.kitId===kitSel.id && r.tipo==="acerto"; });
        setAcertoForm(Object.assign({}, FORM_ACERTO_VAZIO, regVer && regVer.formSnapshot ? regVer.formSnapshot : {}));
        setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(3); setTela("calcacerto"); return; }
      if(sel.hoje){ if(!jaAcertado && kitSel) abrirAcertoNovo(); }   // 26/11/2026 (Marcus): sem a pergunta "atualizar remarcações e multas?"; as multas já vêm calculadas no topo do acerto
      else { setMostrarSolicitar(true); } }}];
  // 05/11/2026 (Marcus): o botão é sempre "Realizar atendimento". Ao tocar, o app já sabe a situação da revendedora (pelo tipo do kit que o sistema trouxe) e deixa SÓ a opção dela ligada; as outras ficam cinza.
  var soRepos = !!kitSel && kitSel.tipoKit==="reposicao" && !kitSel.reposicaoEntregue;   // reposição: o atendimento é só a entrega (contar as peças + condicional assinada)
  var soKitNovo = !!kitSel && (ehKitNovoHoje || !!kitSel.demoKitNovo) && !kitSel.kitNovoEntregue;   // revendedora de kit novo: o atendimento é só a entrega do kit novo
  var situacaoAtend = soRepos ? "repos" : soKitNovo ? "kitnovo" : "acerto";
  var opcoesAtend = [
    {id:"acerto", lb: jaAcertado ? "Ver acerto (já registrado)" : "Realizar acerto + kit", icone:"calc", cor:"#16A34A", onClick:function(){ opcoesAtendimento[0].onClick(); }},
    {id:"kitnovo", lb: kitSel && kitSel.kitNovoEntregue ? "Kit novo (já entregue)" : "Entregar kit novo", icone:"novas", cor:"#DB2777", onClick:function(){ setMenuAberto(false); setTela("entregakit"); }},
    {id:"repos", lb: kitSel && kitSel.reposicaoEntregue ? "Reposição (já entregue)" : "Entregar reposição", icone:"caixa", cor:"#0891B2", onClick:function(){ setMenuAberto(false); setTela("reposicao"); }}];
  var botaoRealizar = sel && e("button",{onClick:function(){ if(!sel.hoje && !sel.realizado){ acertoSemAgenda(); return; } setMenuAberto(!menuAberto); setAgendarAberto(false); }, className:"relative flex min-h-8 w-full items-center justify-center rounded-xl px-6 py-1 text-center text-[13px] font-extrabold leading-tight "+ouro},   // revendedora sem atendimento hoje: "Realizar atendimento" já faz o acerto sem agendamento (o botão "Acerto sem agendamento" saiu)
    e(Icon,{n: menuAberto?"chevrondown":"chevron", s:11, className:"absolute right-1.5 top-1/2 -translate-y-1/2 opacity-80"}), "Realizar atendimento");
  var painelRealizar = sel && menuAberto && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD+" bg-white shadow-sm"},
    opcoesAtend.map(function(op, i){ var on = op.id===situacaoAtend;
      return e("button",{key:op.id, disabled:!on, onClick:op.onClick,
        className:"flex min-h-8 w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-semibold text-[#111827] disabled:opacity-50 "+(i>0?"border-t "+LINHA_CARD:"")+(on?" bg-[#FBF5E3]":"")},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-xl", style:{background:op.cor+"1F", color:op.cor}}, e(Icon,{n:op.icone, s:15})),
        e("span",{className:"min-w-0 flex-1 leading-tight"}, op.lb),
        e("span",{className:"shrink-0 text-[11px] font-bold "+(on?"text-[#8A6A12]":"text-[#6B7280]")}, on ? "Situação dela" : "Não se aplica")); }));
  var acertoSemAgenda = function(){ var hojeI = isoDia(new Date()), lh = s.listagens.find(function(x){ return x.rep===l.rep && x.data===hojeI && !x.fechada; });
    if(!lh){ var m = new Date(); var hh = String(m.getHours()).padStart(2,"0")+":"+(m.getMinutes()<30 ? "00" : "30"); d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:"Curitiba", viagem:false, horario:hh, data:hojeI, porRep:true, semKit:true, semAgendamento:true}); }
    setSemAg(true); };
  useEffect(function(){ if(!abrirSemAg || !sel || !sel.hoje || !kitSel || !kitSel.semAgendamento) return; setAbrirSemAg(false); opcoesAtendimento[0].onClick(); }, [abrirSemAg, sel && sel.hoje, kitSel && kitSel.id]);   // eslint-disable-line react-hooks/exhaustive-deps
  var linhaAtendimento = sel && e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-2 gap-2"}, botaoAgendar, botaoRealizar),
    blocoAgendaForm, painelRealizar);
  // Pré-acerto: a representante preenche antes (remarcações e dias de atraso); no acerto chegam travados
  var MOSTRAR_PRE_ACERTO = false;   // 26/11/2026 (Marcus): a representante não preenche mais multa na mão; o sistema calcula (blocoMultas, no acerto)
  // BLOCO DE MULTAS no topo do acerto (26/11/2026, Marcus): o sistema já trouxe o atraso e as remarcações; ela só confirma. Depois de confirmar, fica fixo, sem botão à vista.
  // Toque duplo no bloco abre a edição escondida: só dá para ZERAR os dias de atraso ou as remarcações (sem motivo); cada edição fica anotada em preAcerto.edicoes.
  var blocoMultas = (function(){
    if(!kitSel || jaAcertado || !maAuto || !maAuto.achou || tela!=="calcacerto") return null;
    var N = versaoSel && versaoSel.novas, escM = (versaoSel && versaoSel.remarcacao) || [], dias = paK.atrasoDias||0, lista = kitSel.remarcacoesLista||[], cobM = vezCobravel(lista);
    var at = N ? atrasoAcerto(dias, N) : {comissaoPct:0, brindePct:0, tudo:false}, rm = cobM>0 && escM.length ? escM[Math.min(cobM, escM.length)-1] : {comissaoPct:0, brindePct:0};
    var perda = function(c, b){ return "Comissão −"+c+"% · Brinde −"+b+"%"; };
    var atTxt = dias<=0 ? "No prazo" : at.tudo ? dias+" dias úteis · Perde tudo" : dias+(dias===1 ? " dia útil" : " dias úteis")+(at.comissaoPct>0 ? " · "+perda(at.comissaoPct, at.brindePct) : " · sem perda");
    var rmTxt = cobM<=0 ? "Nenhuma" : cobM+(cobM===1 ? " com multa · " : " com multas · ")+perda(rm.comissaoPct, rm.brindePct);
    var grava = function(extra){ d(Object.assign({type:"KIT_MULTAS", id:kitSel.id, atrasoDias:dias, cobraveis:cobM, isentas:lista.length-cobM, confirmada:true}, extra||{})); };
    var toque = function(){ var t0 = Date.now(); if(t0-toqueMulta.current<400){ toqueMulta.current = 0; setMultaEdita(function(v){ return !v; }); } else toqueMulta.current = t0; };
    var linhaM = function(k, rot, txt){ return e("div",{key:k, className:"flex min-h-8 items-center justify-between gap-3"}, e("span",{className:"text-[13px]"}, rot), e("b",{className:"text-right text-[13px]"}, txt)); };
    return e("div",{key:"multas", className:"flex flex-col gap-1 rounded-xl bg-[#1C1C1E] px-3 py-1.5 ring-1 ring-amber-200/25", onClick:toque},
      e("p",{className:"text-[13px] font-extrabold text-amber-200"}, "Multas"),
      linhaM("a", "Atraso do acerto", atTxt), linhaM("r", "Remarcações", rmTxt),
      !paK.confirmada && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); grava(); }, className:"mt-1 h-8 w-full rounded-xl text-[13px] font-bold "+ouro}, "Confirmar multas"),
      multaEdita && e("div",{className:"mt-1 flex flex-col gap-1.5 border-t border-white/10 pt-1.5", onClick:function(ev){ ev.stopPropagation(); }},
        e("button",{type:"button", disabled:dias<=0, onClick:function(){ grava({atrasoDias:0, editada:true, por:l.rep, edicao:{campo:"atraso", de:dias, para:0}}); }, className:"h-8 rounded-xl bg-white/10 text-[13px] font-semibold text-white disabled:opacity-40"}, "Zerar dias de atraso"),
        e("button",{type:"button", disabled:lista.length<=0, onClick:function(){ grava({cobraveis:0, isentas:0, editada:true, por:l.rep, edicao:{campo:"remarcacoes", de:cobM, para:0}}); }, className:"h-8 rounded-xl bg-white/10 text-[13px] font-semibold text-white disabled:opacity-40"}, "Zerar remarcações"),
        e("button",{type:"button", onClick:function(){ setMultaEdita(false); }, className:"h-8 rounded-xl text-[13px] font-semibold text-white"}, "Fechar")));
  })();
  var botaoPreAcerto = MOSTRAR_PRE_ACERTO && sel && sel.hoje && kitSel && !jaAcertado && !soRepos && !soKitNovo && e("button",{onClick:function(){ setTela("preacerto"); }, className:"flex h-8 w-full items-center justify-center gap-2 rounded-xl border border-[#C9A13B]/50 bg-white text-[13px] font-extrabold text-[#8A6A12]"},
    e(Icon,{n:"calendario", s:13}), "Pré-acerto", (kitSel.remarcacoesLista||[]).length>0 || (kitSel.preAcerto && kitSel.preAcerto.atrasoDias>0) ? e("span",{className:"rounded-full bg-[#C9A13B] px-2 text-[11px] font-bold txt-branco"}, "Preenchido") : null);
  var janelaPergunta = sel && perguntaPre && e("div",{role:"dialog", "aria-label":"Atualizar remarcações e multas", className:"absolute inset-0 z-30 grid place-items-center bg-black/60 p-4"},   // absolute, não fixed: a janela fica DENTRO do celular (05/11/2026)
    e("div",{className:"flex w-full max-w-[300px] flex-col gap-3 rounded-2xl bg-[#1C1C1E] p-4"},
      e("p",{className:"text-center text-[13px] font-bold"}, "Você gostaria de atualizar remarcações e multas?"),
      e("p",{className:"text-center text-[11px]"}, "Depois que o acerto começa, esses dados ficam travados."),
      e("button",{onClick:function(){ setPerguntaPre(false); setTela("preacerto"); }, className:"h-8 rounded-xl text-[13px] font-bold "+ouro}, "Sim, atualizar"),
      e("button",{onClick:function(){ setPerguntaPre(false); abrirAcertoNovo(); }, className:"h-8 rounded-xl bg-white/10 text-[13px] font-semibold text-white"}, "Não, seguir para o acerto")));
  var telaRev = sel && e("div",{className:"mt-3 flex flex-col gap-2"},
    janelaPergunta, blocoNome, blocoStatusHoje, linhaAtendimento, botaoPreAcerto, blocoEnderecos, blocoRefs, botaoCondicionais, blocoSolicitar);
  var ponto = function(k){ return e("span",{className:"size-2 shrink-0 rounded-full "+PONTO_CEL[STATUS_TP[k.status]]}); };
  var fmtDataISO = function(iso){ if(!iso) return ""; var p = iso.split("-"); return p[2]+"/"+p[1]; };
  var hojeISOStr = isoDia(new Date());
  var minhasLOrdenadas = minhasL.slice().sort(function(a,b){ return (a.data||"").localeCompare(b.data||"") || a.horario.localeCompare(b.horario); });
  var listagemVista = minhasLOrdenadas.find(function(x){return x.id===lidVista;}) || minhasLOrdenadas.find(function(x){return x.data===hojeISOStr;}) || minhasLOrdenadas[0];
  var kitsVista = listagemVista ? s.kits.filter(function(k){return k.lid===listagemVista.id;}).sort(function(a,b){return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem;}) : [];
  var buscaLNorm = buscaListagem.trim().toLowerCase();
  var kitsVistaFiltrados = buscaLNorm ? kitsVista.filter(function(k){return k.rev.toLowerCase().indexOf(buscaLNorm)>=0;}) : kitsVista;
  var resultadosForaDaVista = buscaLNorm ? s.kits.filter(function(k){ return (!listagemVista || k.lid!==listagemVista.id) && minhasL.some(function(x){return x.id===k.lid;}) && k.rev.toLowerCase().indexOf(buscaLNorm)>=0; }) : [];
  // 09/11/2026 (Marcus): Listagens em Lista/Calendário, toca no dia e abre a tela do dia (mobile/listagens-rep.js). Seta ‹ da barra preta volta uma tela por vez (lgSub).
  var telaListagens = e("div",{className:"mt-3"}, e(ListagensRep,{s:s, d:d, rep:l.rep, ouro:ouro, minhas:minhasL, sub:lgSub, setSub:setLgSub,
    irAdicionar:function(lid){ if(lid) setLidPed(lid); setTela("revs"); },
    abrirRev:function(k){ var alvo = cart.find(function(r){return r.rev===k.rev;}); if(alvo){ setSel(alvo.id); setTela("rev"); } }}));
  var estrelas = function(k){ var n = (notas[k.id]||{}).nota || 0;
    return e("div",{className:"flex gap-0.5"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":i+" estrelas",
      onClick:function(){ var o = Object.assign({}, notas); o[k.id] = Object.assign({faltas:0}, o[k.id], {nota:i}); setNotas(o); },
      className:"text-lg leading-none "+(i<=n?"text-amber-300":"text-white/25")}, "★"); })); };
  var faltasDe = function(k){ return (notas[k.id]||{}).faltas || 0; };
  var mudaFalta = function(k, dlt){ var o = Object.assign({}, notas); var at = Object.assign({nota:0, faltas:0}, o[k.id]); at.faltas = Math.max(0, at.faltas+dlt); o[k.id] = at; setNotas(o); };
  var dataChave = function(r){ var p = (r.data||"").split("/"); return p.length===2 ? (+p[1])*100+(+p[0]) : 0; };
  var nrmBusca = function(t){ return String(t||"").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); };   // busca sem acento e sem maiúscula: nome, telefone e cidade/endereço (Marcus, 24/11/2026)
  var filtradas = cart.filter(function(r){
    if(!busca) return true;
    var q = nrmBusca(busca), dq = busca.replace(/\D/g, ""), pf = s.perfisRev[r.rev] || {};
    return nrmBusca(r.rev).indexOf(q)>=0 || nrmBusca(r.bairro).indexOf(q)>=0 || nrmBusca(pf.enderecoCasa).indexOf(q)>=0 || nrmBusca(pf.enderecoTrabalho).indexOf(q)>=0 || (dq.length>=3 && String(r.fone||"").replace(/\D/g, "").indexOf(dq)>=0);
  }).sort(function(a,b){
    if(sortBy==="vendasMais") return vendMes(b)-vendMes(a);
    if(sortBy==="vendasMenos") return vendMes(a)-vendMes(b);
    var ph = (a.hoje?0:1)-(b.hoje?0:1); if(ph) return ph;
    var pd = dataChave(a)-dataChave(b); if(pd) return pd;
    return (a.hora||"").localeCompare(b.hora||""); });
  var flameLogo = e("svg",{viewBox:"0 0 24 30", width:13, height:16, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"repFlame", x1:"0%", y1:"0%", x2:"0%", y2:"100%"},
      e("stop",{offset:"0%", stopColor:"#F1E4C6"}), e("stop",{offset:"55%", stopColor:"#E8B84B"}), e("stop",{offset:"100%", stopColor:"#B8862B"}))),
    e("path",{fill:"url(#repFlame)", d:"M12 0c2 4-3 6-3 10a3 3 0 0 0 6 0c0-1-.4-2-.4-2 2 1.5 3.4 4.2 3.4 7a6 6 0 1 1-12 0c0-6 4-8 6-15Z"}));
  var headerInicio = e("div",{className:"relative -mx-4 -mt-2 rounded-b-[34px] bg-[#0B0B0D] px-5 pb-5 pt-4"},
    e("div",{className:"pointer-events-none absolute inset-0 overflow-hidden rounded-b-[34px]", "aria-hidden":true},
    e("svg",{viewBox:"0 0 380 190", preserveAspectRatio:"none", className:"absolute inset-0 h-full w-full", style:{transform:"scaleX(-1)"}, "aria-hidden":true},   // ondas douradas viradas para o lado esquerdo (Marcus, 23/11/2026)
      e("defs",null, e("linearGradient",{id:"repGoldA", x1:"0%", y1:"0%", x2:"100%", y2:"100%"},
        e("stop",{offset:"0%", stopColor:"#B8862B", stopOpacity:0.9}),
        e("stop",{offset:"55%", stopColor:"#E8B84B", stopOpacity:0.5}),
        e("stop",{offset:"100%", stopColor:"#F1E4C6", stopOpacity:0}))),
      e("path",{d:"M80 -30 C 200 15 250 65 410 35 L 410 -30 Z", fill:"url(#repGoldA)"}),
      e("path",{d:"M-30 140 C 90 95 220 175 410 105 L 410 210 L -30 210 Z", fill:"url(#repGoldA)", opacity:.35}))),
    e("div",{className:"relative z-10 flex items-center justify-between gap-2"},
      e("button",{type:"button", onClick:function(){ setMenuConta(!menuConta); }, "aria-label":"Abrir o menu da conta", "aria-expanded":menuConta, className:"flex min-w-0 cursor-pointer items-center gap-2 text-left outline-none"},
        fotoRep ? e("span",{className:"block size-[5.75rem] shrink-0 rounded-full bg-cover bg-center", style:{backgroundImage:"url("+fotoRep+")"}}) : e(Avatar,{nome:l.rep, i:0, className:"size-[5.75rem] shrink-0 text-5xl"}),   // avatar grande: vai ser a foto da representante (Marcus, 23/11/2026)
        e("span",{className:"flex min-w-0 items-center gap-1"},
          e("b",{className:"whitespace-nowrap text-[16px] font-bold leading-tight "+BR}, nomeBonito(l.rep)),
          e(Icon,{n:"chevrondown", s:12, className:"shrink-0 text-white/50"}))),
      menuConta && e("div",{className:"fixed inset-0 z-40 cursor-default", onClick:function(){ setMenuConta(false); }}),
      e("img",{src:"/logo-sorelly.png", alt:"Sorelly", draggable:false, className:"mr-4 h-20 w-auto shrink-0 select-none"})),   // a logo da Sorelly de verdade, no lado direito (Marcus, 23/11/2026)
      menuConta && e("div",{className:"absolute left-[7.5rem] top-[4.9rem] z-50 flex w-44 flex-col gap-0.5 rounded-xl bg-white p-1 text-[#111827] shadow-[0_12px_32px_rgba(0,0,0,.45)] ring-1 ring-[#C9A13B]/40"},
        repCodDaConta() && e("button",{type:"button", onClick:function(){ var inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = function(){ var fl = inp.files && inp.files[0]; if(!fl) return; setMsgFoto("Enviando foto");
            reduzirFoto(fl).then(function(url){ return chamar("PATCH", "/perfil/eu", {foto:url}).then(function(r){ setFotoRep((r.pessoa && r.pessoa.foto) || url); setMsgFoto(""); setMenuConta(false); }); }).catch(function(x){ setMsgFoto(x.message || "Não consegui trocar a foto."); }); }; inp.click(); }, className:"flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left text-[13px] font-semibold hover:bg-[#FBF5E3]"},
          e("span",{className:"grid size-6 place-items-center rounded-md bg-[#F6EBCB] text-[#8A6A12]"}, e(Icon,{n:"pencil", s:14})), "Trocar foto"),
        repCodDaConta() && e("button",{type:"button", onClick:function(){ sairDaConta(); }, className:"flex h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-1.5 text-left text-[13px] font-semibold hover:bg-[#FEE2E2]"},
          e("span",{className:"grid size-6 place-items-center rounded-md bg-[#FEE2E2] text-[#B91C1C]"}, e(Icon,{n:"logout", s:14})), "Sair da conta"),
        !repCodDaConta() && e("p",{className:"px-2 pb-1 text-[12px] text-[#6B7280]"}, "Visualização da Diretoria: a foto e a saída são da conta dela."),
        msgFoto && e("p",{className:"px-2 pb-1 text-[12px] font-semibold text-[#B45309]"}, msgFoto)),
    e("div",{className:"relative mt-3 flex flex-col gap-1.5"},
      [{lb:"Vendido Total", v:carregandoCarteira ? "…" : BK(painelApp && painelApp.vendido!=null ? painelApp.vendido : usaCarteira ? somaCarteiraV : vendidoTotal), ic:"grafico", cor:"#F3D8A0"},
        {lb:"Acerto Total", v:carregandoCarteira ? "…" : BK(painelApp && painelApp.valorAcerto!=null ? painelApp.valorAcerto : usaCarteira ? somaCarteiraA : acertoTotal), ic:"wallet", cor:"#C6DFF8"},
        {lb:"Comissão Rep.", v:carregandoCarteira ? "…" : BK(painelApp && painelApp.valorAcerto!=null ? painelApp.valorAcerto*PCT_COMISSAO_REP_CARD : usaCarteira ? Math.round(somaCarteiraA*PCT_COMISSAO_REP_CARD) : comissaoRepTotal), ic:"coins", cor:"#C1EDD1"}].map(function(m){
        return e("div",{key:m.lb, className:"flex items-center justify-between gap-2 rounded-2xl bg-white/8 px-3 py-2.5"},
          e("span",{className:"flex min-w-0 items-center gap-2"},
            e("span",{className:"grid size-10 shrink-0 place-items-center rounded-xl", style:{color:m.cor, background:m.cor+"26", boxShadow:"inset 0 0 0 1px "+m.cor+"55"}}, e(Icon,{n:m.ic, s:22, peso:"duotone"})),
            e("b",{className:"text-[15px] font-semibold "+BR}, m.lb)),
          e("span",{className:MONO+" shrink-0 whitespace-nowrap text-[20px] font-extrabold text-amber-200"}, m.v));
      })));
  // lista da tela inicial no MESMO desenho do app da revendedora (cartão compacto, ícone 32 px, título 13 px e legenda 11 px) — padronização de 29/10/2026
  var listaInicio = e("div",{className:"mt-4 flex flex-col gap-3"}, LISTA_INICIO.map(function(m){
    var conteudo = [
      e("span",{key:"ic", className:"grid size-10 shrink-0 place-items-center rounded-xl", style:m.logo ? {background:"#24180a"} : {background:m.cor+"1F", color:m.cor}}, m.logo ? e(LogoChat,{s:22}) : e(Icon,{n:m.icone, s:20, peso:"fill"})),
      e("div",{key:"tx", className:"min-w-0 flex-1"}, e("b",{className:"block text-[16px] leading-tight text-[#111827]"}, m.titulo), e("span",{className:"block text-[13px] leading-tight text-[#6B7280]"}, m.sub)),
      m.ativo ? e(Icon,{key:"ch", n:"chevron", s:16, className:"shrink-0 text-[#9CA3AF]"})
        : e("span",{key:"ch", className:"shrink-0 rounded-full bg-[#F3F4F6] px-1.5 py-px text-[10px] font-semibold text-[#9CA3AF]"}, "Em breve")];
    return m.ativo
      ? e("button",{key:m.tela, onClick:function(){ if(m.tela==="mensagens") efem({conversaSel:null}); setTela(m.tela); }, style:{background:FUNDO_BARRA}, className:"flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left shadow-sm active:scale-[.99]"}, conteudo)
      : e("div",{key:m.tela, style:{background:FUNDO_BARRA}, className:"flex w-full items-center gap-3 rounded-2xl px-3 py-3 opacity-70"}, conteudo); }));
  // ── Tela de regras: as mesmas regras da calculadora, lidas da versão do kit (ou da vigente). Quem edita é o admin (Regras do consignado). ──
  var vr = versaoVigente(s) || versaoSel;
  var kitComRegraAntiga = versaoSel && vr && versaoSel.id!==vr.id;
  var headerRegras = e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
    e("button",{onClick:function(){ setTela(telaAntes||"inicio"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
    e("b",{className:douradoTitulo}, "Regras"));
  var cartaoRegra = function(chave, titulo, cor, icone, filhos){
    return e("div",{key:chave, className:"overflow-hidden rounded-2xl border shadow-sm "+LINHA_CARD, style:{background:claro(cor,.12)}},
      e("div",{className:"flex items-center gap-2 px-3 py-2", style:{background:cor+"1F"}},
        e("span",{className:"grid size-7 shrink-0 place-items-center rounded-lg", style:{background:cor+"33", color:cor}}, e(Icon,{n:icone, s:15})),
        e("b",{className:"text-[13.5px] text-[#111827]"}, titulo)),
      e("div",{className:"flex flex-col gap-1.5 p-3 text-[12.5px] leading-snug text-[#374151]"}, filhos));
  };
  var linhaRegra = function(k, a, b, cor){ return e("div",{key:k, className:"flex items-center justify-between gap-2 rounded-lg bg-[#F4F5F7] px-2.5 py-1.5"},
    e("span",null,a), e("b",{style:cor?{color:cor}:null}, b)); };
  var BK0 = function(n){ return "R$ "+Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:2, maximumFractionDigits:2}); };
  var telaRegras = vr && e("div",{className:"mt-3 flex flex-col gap-3 pb-4"},
    kitComRegraAntiga && e("div",{key:"aviso", className:"rounded-2xl border border-amber-300 bg-amber-50 p-3 text-[12px] leading-snug text-amber-900"},
      e("b",null,"Este acerto usa as regras de "+versaoSel.vigenciaDesde.split("-").reverse().join("/")+"."),
      " As regras abaixo foram atualizadas depois e valem a partir do próximo kit."),
    cartaoRegra("regua","Régua de comissão e brinde","#16A34A","grafico",(function(){
      var asc = vr.faixas.slice().sort(function(a,b){return a.min-b.min;});
      var linha = function(k, a, c, n, sl){ return e("div",{key:k, className:"grid grid-cols-[2.1fr_.6fr_.7fr_.7fr] items-center gap-1 rounded-lg bg-[#F4F5F7] px-2 py-1.5 text-[10.5px] leading-tight"},
        e("span",{className:"font-semibold"}, a), e("b",{className:"text-[#15803D]"}, c), e("span",{className:MONO}, n), e("span",{className:MONO}, sl)); };
      return [e("div",{key:"cab", className:"grid grid-cols-[2.1fr_.6fr_.7fr_.7fr] gap-1 px-2 text-[9px] font-bold uppercase tracking-wide text-[#9A8B63]"},
          e("span",null,"Venda líquida"), e("span",null,"Comissão"), e("span",null,"Normal"), e("span",null,"Select")),
        linha("zero","Abaixo de "+BK0(vr.gerais.minRenovar).replace(",00",""),"0%","R$ 0","R$ 0")]
        .concat(asc.map(function(f,i){ var prox = asc[i+1];
          return linha("f"+i, prox ? BK0(f.min).replace(",00","")+" a "+BK0(prox.min-0.01) : BK0(f.min).replace(",00","")+" ou mais", f.pct+"%", "R$ "+f.bn, "R$ "+f.bb); }))
        .concat([e("p",{key:"nota"},"Abaixo de "+BK0(vr.gerais.minRenovar).replace(",00","")+" de venda líquida não existe faixa: a comissão é zero. O teto de cada faixa inclui o centavo.")]);
    })()),
    cartaoRegra("taxa","Taxa de deslocamento","#F59E0B","caminhao",(function(){
      var asc = (vr.taxaBaixa||[]).slice().sort(function(a,b){return a.min-b.min;}), teto = vr.gerais.taxaAbaixoDe;
      return [e("p",{key:"t0"},"Venda líquida abaixo de "+BK0(teto).replace(",00","")+" paga uma taxa fixa, que soma no valor que ela paga:")]
        .concat(asc.map(function(t,i){ var prox = asc[i+1], fim = (prox ? prox.min : teto)-0.01;
          return linhaRegra("t"+i, (t.min<=0 ? "Até " : BK0(t.min)+" a ")+BK0(fim), BK0(t.taxa), "#B45309"); }));
    })()),
    cartaoRegra("remarc","Remarcação","#7C3AED","calendario",
      vr.remarcacao.map(function(t,i,arr){ return e("div",{key:"r"+i, className:"flex flex-col gap-0.5 rounded-lg bg-[#F4F5F7] px-2.5 py-1.5"}, e("span",{className:"whitespace-nowrap font-semibold"}, (i+1)+"ª remarcação"+(i===arr.length-1?" em diante":"")), e("b",{className:"whitespace-nowrap text-[#B91C1C]"}, "comissão −"+t.comissaoPct+"% · brinde −"+t.brindePct+"%")); })
        .concat([e("p",{key:"rn"},"Remarcação isenta (motivo justificado, como falecimento na família) não conta. O desconto no brinde vale proporcional em cada categoria, Normal e Select.")])),
    cartaoRegra("pag","Pagamento e brindes","#DB2777","banco",
      (vr.pagamentoBrinde||[]).map(function(t,i,arr){ var ant = i>0 ? arr[i-1].max : null;
          return linhaRegra("p"+i, t.max===0 ? "Pagou tudo" : "Faltou "+(ant ? "de "+ant+"% até " : "até ")+t.max+"%", Math.round(t.fator*100)+"% dos brindes", t.fator<1 ? "#B45309" : "#15803D"); })
        .concat([linhaRegra("pz", "Faltou mais de "+((vr.pagamentoBrinde||[]).slice(-1)[0]||{max:10}).max+"%", "sem brindes", "#B91C1C"),
          e("p",{key:"pn1"},"O pagamento tem que ser integral e o brinde só é entregue depois do pagamento. Negociar o que falta com parcelas que fechem o valor exato também libera o brinde."),
          vr.novas ? e("p",{key:"pn2"},"Qualquer valor pendente tem multa de "+vr.novas.multaPendentePct+"% sobre o pendente. "+textoNegociacao(vr.novas)+" Parcela atrasada soma "+vr.novas.atrasoQuitacaoPctDia+"% ao dia, até "+vr.novas.atrasoQuitacaoTetoPct+"%. O próximo kit só sai depois de quitar.")
            : e("p",{key:"pn2"},"Se a revendedora não quiser negociar o que falta: sem brinde. O jurídico entra em contato; sem negociação em 48 horas depois do aviso final, a nota promissória vai para execução no valor pendente.")])),
    vr.novas && cartaoRegra("atraso","Acerto atrasado","#DC2626","calendario",
      linhasAtraso(vr.novas).map(function(l,i){ return linhaRegra("ar"+i, l[0], l[1], i===0 ? "#15803D" : "#B91C1C"); })
        .concat([e("p",{key:"arn"},"O desconto vale sobre o total da venda. Acerto no dia não perde nada.")])),
    vr.novas && cartaoRegra("media","Venda mínima","#0891B2","grafico",[
      e("p",{key:"m1"},"Média das últimas "+MEDIA_N+" vendas (3 anteriores e a de hoje): mínimo de "+BK0(vr.novas.minimoRepresentante)+" no acerto com a representante e "+BK0(vr.novas.minimoInterno)+" no acerto na Sorelly."),
      e("p",{key:"m2"},"Média abaixo: o kit novo não é liberado e o cadastro fica bloqueado. A representante pode dar uma nova chance na data do acerto.")]),
    cartaoRegra("brinde","Como lançar os brindes","#A855F7","presente",[
      e("p",{key:"b1"},e("b",null,"Normal: "),"peças comuns do kit. Aceita código normal ou BB."),
      e("p",{key:"b2"},e("b",null,"Select (BB): "),AVISO_BB+" O código só pode começar com BB: BB ou BB + 1 ou 2 letras (BBA, BBCL, BBP, BBT) e sempre 4 números no final. Ex.: BB0001, BBA0001."),
      e("p",{key:"b3"},"Cada peça é lançada com o código e o valor. Passou do Select: o que sobrar abate do saldo do Normal. Passou de tudo: o excedente entra no total a pagar.")]),
    cartaoRegra("kit","Kit novo","#16A34A","novas",[
      e("p",{key:"k1"},"Com "+(vr.gerais.kitNovoMinPct||80)+"% ou mais do acerto pago"+(vr.novas ? " e média de vendas acima do mínimo" : "")+", o kit novo é liberado sem autorização do financeiro."),
      e("p",{key:"k2"},"Abaixo disso, a liberação exige autorização do financeiro.")]),
    vr.prata && cartaoRegra("prata","Kit 100% Prata","#475569","star",(function(){
      var pr = vr.prata, asc = pr.faixas.slice().sort(function(a,b){return a.min-b.min;});
      var linha = function(k, a, c, n, sl){ return e("div",{key:k, className:"grid grid-cols-[2.1fr_.6fr_.7fr_.7fr] items-center gap-1 rounded-lg bg-[#F4F5F7] px-2 py-1.5 text-[10.5px] leading-tight"},
        e("span",{className:"font-semibold"}, a), e("b",{className:"text-[#15803D]"}, c), e("span",{className:MONO}, n), e("span",{className:MONO}, sl)); };
      return [e("div",{key:"cab", className:"grid grid-cols-[2.1fr_.6fr_.7fr_.7fr] gap-1 px-2 text-[9px] font-bold uppercase tracking-wide text-[#9A8B63]"},
          e("span",null,"Venda líquida"), e("span",null,"Comissão"), e("span",null,"Normal"), e("span",null,"Select"))]
        .concat(asc.map(function(f,i){ var prox = asc[i+1];
          return linha("pf"+i, prox ? BK0(f.min).replace(",00","")+" a "+BK0(prox.min-0.01) : BK0(f.min).replace(",00","")+" ou mais", f.pct+"%", "R$ "+f.bn, "R$ "+f.bb); }))
        .concat(textoRegrasPrata(vr).map(function(r,i){ return e("p",{key:"pr"+i}, e("b",null,r.t+": "), r.x); }));
    })()));
  var telaPropria = ["pedidodata","preacerto","calcacerto","regras","assinaracerto","entregakit","confkit","confdev","assinarrepos","fechamento","resumokn","reposicao","mensagens","regrascom"].indexOf(tela)>=0;   // telas com cabeçalho e conteúdo próprios
  return e(IPhone17ProMax,{semMoldura:p.semMoldura || false},
    tela==="preacerto" && kitSel && e(PreAcertoRep,{key:"pre"+kitSel.id, kit:kitSel, versao:versaoSel || versaoVigente(s), rev:sel.rev, prevista:previstaTxt, d:d,
      onVoltar:function(){ setTela("rev"); }, onSalvar:function(){ abrirAcertoNovo(); }, textoSalvar:"Salvar e ir para o acerto"}),
    tela==="calcacerto" && headerCalc,
    blocoMultas,
    tela==="calcacerto" && avisoConta && e("button",{key:"avisoConta", type:"button", role:"alert", onClick:function(){ setAvisoConta(null); },
      className:"absolute inset-x-3 top-16 z-50 flex items-center gap-2 rounded-xl bg-[#16A34A] px-3 py-2 text-left text-white shadow-xl ring-1 ring-black/30"},
      e("span",{className:"text-[18px]"}, "💳"), e("span",{className:"min-w-0 flex-1 text-[12px] leading-tight"}, e("b",{className:"block"}, "Conta recebida: "+BK(avisoConta.valor)), e("span",{className:"block truncate"}, avisoConta.conta))),
    tela==="calcacerto" && calcAcertoScreen,
    tela==="assinaracerto" && telaAssinarAcerto,
    tela==="assinarrepos" && telaAssinarRepos,
    tela==="fechamento" && telaFechamento,
    tela==="entregakit" && kitSel && e(EntregaKNRep,{key:kitSel.id, s:s, d:d, k:kitSel, versao:versaoSel || versaoVigente(s),
      onVoltar:function(){ setTela("rev"); }, onConcluido:function(){ setTela("resumokn"); }, onConferir:function(){ setConfVolta("entregakit"); setTela("confkit"); }, onAbrirRegras:function(){ setRegrasDaAssinatura("entregakit"); setTela("regrascom"); }}),
    tela==="reposicao" && kitSel && (function(){
      // 03/11/2026 (Marcus): igual à calculadora de acertos: cabeçalho escuro em cima e cartões claros embaixo (cabeçalho e corpo são blocos separados)
      var kc = kitConfDe(kitSel.id), valorRep = (s.comis||{}).reposicao!=null ? s.comis.reposicao : 15, tkR = totaisKit(condicionaisDoKit(kitSel));
      var cartao = function(chave, icone, titulo, ok, filhos){ return e("div",{key:chave, className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"},
        e("div",{className:"flex w-full items-center gap-3 p-3"},
          e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:"#CA8A0426", color:"#CA8A04"}}, e(Icon,{n:icone, s:18})),
          e("b",{className:"block min-w-0 flex-1 text-[14px]"}, titulo), ok ? checkOk : badgeTxt("—","#374151")),
        e("div",{className:"flex flex-col gap-2.5 border-t border-white/5 p-3"}, filhos)); };
      return e(React.Fragment,{key:"rep"},
        e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1.5 bg-[#0B0B0D] px-4 pb-3 pt-3 shadow-[0_6px_10px_rgba(0,0,0,.35)]"},
          e("div",{className:"flex items-center gap-2"},
            e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
            e("b",{className:douradoTitulo+" min-w-0 flex-1"}, "Entregar reposição")),
          e("div",{className:"flex flex-col gap-0.5 rounded-2xl bg-[#1C1C1E] px-3 py-2 ring-1 ring-amber-200/25"},
            e("p",{className:"text-[13.5px] font-extrabold "+BR}, kitSel.rev),
            e("div",{className:"mt-1 flex flex-col"},
              [["Condicionais", String(tkR.condicionais)], ["Peças", String(tkR.pecas)], ["Comissão da entrega", BK(valorRep)]].map(function(l, n){
                return e("div",{key:l[0], className:"flex min-h-8 items-center justify-between gap-3 "+(n ? "border-t border-white/10" : "")}, e("span",{className:"text-[13px] "+BR}, l[0]), e("b",{className:MONO+" text-[13px] "+BR}, l[1])); })))),
        e("div",{className:"-mx-3 flex flex-col gap-2.5 pb-10"},
          cartao("c1", "caixa", "Contar as peças", !!kc, (kitSel.condsReais||[]).length ? [e(ContagemTotal,{key:"ct", s:s, d:d, k:kitSel})]
            : buscaRepos.est==="semcpf" ? [
                e("p",{key:"t", className:"text-[13px]"},"Informe o CPF da revendedora para buscar as peças na DevMaster."),
                e("input",{key:"i", value:cpfReposIn, inputMode:"numeric", placeholder:"CPF (só números)", "aria-label":"CPF da revendedora", onChange:function(ev){ setCpfReposIn(ev.target.value.replace(/\D/g,"").slice(0,11)); }, className:"h-8 rounded-lg bg-white px-3 text-center text-[13px] text-[#111827] outline-none ring-1 ring-[#E5E7EB]"}),
                e("button",{key:"b", disabled:cpfReposIn.length!==11, onClick:function(){ d({type:"SALVAR_PERFIL_REV", chave:kitSel.rev, patch:{cpf:cpfReposIn}}); }, className:"h-8 rounded-xl text-[13px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}},"Buscar as peças")]
            : [e("p",{key:"t", className:"text-[13px]"}, buscaRepos.est==="carregando" ? "Buscando as condicionais na DevMaster..." : (buscaRepos.aviso || "Sem condicional da DevMaster para esta reposição.")),
               buscaRepos.est!=="carregando" && e("button",{key:"b", onClick:function(){ setCpfReposIn(""); d({type:"SALVAR_PERFIL_REV", chave:kitSel.rev, patch:{cpf:""}}); }, className:"h-8 rounded-xl bg-[#3F3F46] text-[13px] font-bold "+BR2},"Trocar o CPF")]),
          cartao("c2", "cadastro", "Condicional assinada", !!reposAss || !!kitSel.reposicaoEntregue, [
            e("p",{key:"t", className:"text-[13px]"},"A revendedora assina a condicional. Ela sobe nas condicionais em aberto dela."),
            e("button",{key:"b", disabled:!kc, onClick:function(){ setTela("assinarrepos"); }, className:"h-10 rounded-xl text-[13px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}}, kc ? "Assinar e concluir a reposição" : "Primeiro conte as peças")]),
          e("p",{className:"px-3 text-center text-[13px]"}, "A comissão aparece no Consolidado e em Comissões."))); })(),
    tela==="resumokn" && kitSel && (function(){
      var txt = mensagemEntrega({tipo:(kitSel.tipoKit||"").indexOf("repos")===0 ? "reposicao" : "kit_novo", nome:sel.rev, rep:l.rep, data:isoDia(new Date()), kitConf:kitConfDe(kitSel.id), condicionaisAssinadas:kitSel.tipoKit==="reposicao" ? !!kitSel.reposicaoEntregue : !!(s.entregasKN||{})[kitSel.id], comissao:kitSel.tipoKit==="reposicao" ? (kitSel.comissaoFixa||0) : 0});
      return e("div",{key:"rkn", className:"flex flex-col gap-3 pb-4"},
        e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"}, e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})), e("b",{className:douradoTitulo},"Resumo da entrega")),
        e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
          e("textarea",{readOnly:true, value:txt, rows:Math.min(18, txt.split("\n").length+1), className:"w-full resize-none rounded-xl bg-black/50 p-2.5 text-[12px] leading-snug text-white outline-none ring-1 ring-white/10"}),
          e("button",{onClick:function(){ copiarMsg("kn", txt); }, className:"h-10 w-full rounded-xl text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}}, msgCopiada==="kn" ? "✓ Copiado" : "Copiar mensagem"),
          e("button",{onClick:function(){ abrirPdfAcerto((kitSel.tipoKit==="reposicao" ? "Reposição de " : "Kit novo de ")+sel.rev, txt); }, className:"grid h-10 w-full place-items-center rounded-xl text-[13px] font-semibold "+BR2, style:{background:"#3F3F46"}}, "Baixar PDF")),
        e("button",{onClick:function(){ setTela("rev"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro}, "Concluir")); })(),
    tela==="confkit" && kitSel && e(React.Fragment,{key:"ck"},
      e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1 bg-[#0B0B0D] px-4 pb-3 pt-4"},
        e("div",{className:"flex items-center gap-2"}, e("button",{onClick:function(){ setTela(confVolta); }, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
          e("b",{className:"min-w-0 flex-1 text-[13px] font-black uppercase tracking-[.18em] text-amber-200"},"Conferir as peças")),
        e("p",{className:"text-[17px] font-extrabold txt-branco"}, kitSel.rev)),
      e("div",{className:"mt-3 pb-4"}, e(ConfPecas,{s:s, d:d, k:kitSel, onContinuar:function(){ setTela(confVolta); }}))),
    tela==="confdev" && kitSel && e("div",{key:"cdv", className:"!static !-mx-4 !-mt-2 !-mb-10 !flex !h-[calc(100%+3rem)] min-h-0 !flex-col gap-1.5 !rounded-none !bg-[#F0F1F3] !px-2 [&_*:focus:not(:focus-visible)]:!outline-none !pb-3 !pt-2 !text-[#111827]"},
      e("div",{className:"flex shrink-0 flex-col rounded-2xl bg-[#0B0B0D] px-3 py-2"},
        e("div",{className:"flex items-center gap-2"}, e("button",{onClick:function(){ setTela("calcacerto"); }, "aria-label":"Voltar ao acerto", className:"grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
          e("b",{className:"min-w-0 flex-1 text-[13px] font-black uppercase tracking-[.18em] text-amber-200"},"Peças que voltaram"))),
      e("div",{className:"min-h-0 flex-1"}, e(ConfDevolucao,{key:kitSel.id, rev:kitSel.rev, cod:codDm, numeros:acertoForm.condicionaisSelecionadas, disponiveis:condicionaisRev, inicial:acertoForm.devolucaoBip||{},
        aoAlternar:function(n){ setAcertoForm(function(f){ var o = (f.condicionaisSelecionadas||[]).slice(), i = o.indexOf(n); if(i>=0) o.splice(i, 1); else o.push(n); return Object.assign({}, f, {condicionaisSelecionadas:o}); }); },
        aoAdicionar:function(n, q){ d({type:"REV_COND_ADD", rev:sel.rev, numero:n, pecas:q}); setAcertoForm(function(f){ var o = (f.condicionaisSelecionadas||[]).filter(function(x){ return x!==n; }); return Object.assign({}, f, {condicionaisSelecionadas:o.concat([n])}); }); },
        aoSalvar:function(dados){ setAcertoForm(function(f){ return Object.assign({}, f, {devolucaoBip:Object.assign({}, f.devolucaoBip||{}, dados)}, dados.resumo ? {pecasVendidas:dados.resumo.vendidas, vendaBruta:dados.resumo.valorVendido, materiaisValor:dados.resumo.materiais||0} : {}); }); }, aoVoltar:function(){ setTela("calcacerto"); }}))),
    tela==="pedidodata" && sel && e(PedidoDataRep,{key:"pd"+sel.id, s:s, d:d, l:l, rev:sel, onVoltar:function(){ setTela("rev"); }}),
    tela==="mensagens" && e(MensagensRep,{rep:l.rep, revendedoras:cart.map(function(r){ return r.rev; }), onInicio:function(){ setTela("inicio"); }}),
    tela==="regrascom" && e(TelaRegrasComissoes,{key:"rc", publico:"representante", inicio:regrasDaAssinatura ? "revendedora" : undefined, onVoltar:function(){ var volta = regrasDaAssinatura; setRegrasDaAssinatura(""); setTela(volta || "inicio"); }}),
    tela==="regras" && headerRegras,
    tela==="regras" && telaRegras,
    tela==="inicio" && headerInicio,
    !telaPropria && tela!=="inicio" && tela!=="revs" && tela!=="rev" && tela!=="novos" && tela!=="listagens" && tela!=="comissoes" && e("div",null,
      e("div",{className:"flex items-center gap-3"},
        e(Avatar,{nome:l.rep, i:0}),
        e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Olá, representante"), e("p",{className:"truncate text-xl font-bold"}, nomeBonito(l.rep))),
        e("span",{className:"rounded-full bg-[#1C1C1E] px-2.5 py-1 text-[11px] font-semibold text-amber-200"}, "Retirada "+l.horario)),
      e("div",{className:"mt-3 flex gap-1.5"}, meses.map(function(m,i){ return e("button",{key:m, onClick:function(){setMes(i);},
        className:"flex-1 rounded-full py-1.5 text-[12px] font-bold "+(mes===i ? ouro : "bg-[#1C1C1E] text-[#8E8E93]")}, m+(i===0?" (atual)":"")); })),
      e("div",{className:"mt-2.5 grid grid-cols-2 gap-2"},
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Total vendido"), e("p",{className:MONO+" text-lg font-bold"}, BK(tot))),
        e("div",{className:"rounded-xl bg-[#1C1C1E] px-3 py-2"}, e("p",{className:"text-[11px] text-[#8E8E93]"},"Comissão prevista"), e("p",{className:MONO+" text-lg font-bold text-amber-200"}, BK(tot*PCT_REPRESENTANTE))))),
    tela==="revs" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-3 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("div",{className:"flex items-center gap-2"},
        e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:douradoArrow},
          e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
        e("b",{className:douradoTitulo}, "Revendedoras"),
        e("span",{className:"ml-auto whitespace-nowrap text-[13px] font-semibold tabular-nums text-amber-200"}, reais===null ? "Carregando…" : (busca && filtradas.length!==cart.length ? filtradas.length+" de "+cart.length : String(cart.length))+(cart.length===1 && !busca ? " revendedora" : " revendedoras"))),
      e("div",{className:"flex items-center gap-2"},
        e("input",{value:busca, onChange:function(ev){setBusca(ev.target.value);}, placeholder:"Buscar revendedora",
          className:"h-10 flex-1 rounded-xl bg-white px-3 text-sm text-[#111827] outline-none ring-1 ring-black/5 placeholder:text-[#9CA3AF]"}),
        e("button",{onClick:function(){setFiltrosAbertos(!filtrosAbertos);}, "aria-label":"Filtros",
          className:"grid size-10 shrink-0 place-items-center rounded-xl "+(filtrosAbertos ? "bg-amber-200 text-[#1B1409]" : "bg-white/10 "+BR)},
          e(Icon,{n:"settings", s:16}))),
      filtrosAbertos && e("div",{className:"flex items-center gap-1.5"}, [
        {k:"data", lb:"Data"}, {k:"vendasMais", lb:"+ Vendas"}, {k:"vendasMenos", lb:"− Vendas"}].map(function(o){
        return e("button",{key:o.k, onClick:function(){setSortBy(o.k);},
          className:"rounded-full px-2.5 py-1 text-[11px] font-semibold "+(sortBy===o.k ? "bg-amber-200 text-[#1B1409]" : "bg-white/8 "+BR)}, o.lb); }))),
    tela==="rev" && sel && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("revs");}, "aria-label":"Voltar pra Revendedoras", className:douradoArrow},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Revendedora")),
    tela==="novos" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:douradoArrow},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Kits novos")),
    tela==="listagens" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){ if(lgSub.t==="excluir") setLgSub(Object.assign({}, lgSub, {t:"dia"})); else if(lgSub.t==="nova") setLgSub(Object.assign({}, lgSub, {t:lgSub.dia ? "dia" : "lista"})); else setTela("inicio"); }, "aria-label":lgSub.t==="lista" || lgSub.t==="dia" ? "Voltar ao início" : "Voltar", className:douradoArrow},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Listagens")),
    tela==="comissoes" && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:douradoArrow},
        e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Comissões")),
    !telaPropria && e(RecebimentoRep,{l:l}),
    !telaPropria && tela!=="inicio" && tela!=="revs" && tela!=="rev" && tela!=="novos" && tela!=="listagens" && tela!=="comissoes" && e("div",{className:"mb-3"}, voltar),
    tela==="inicio" && listaInicio,
    tela==="revs" && e("div",{className:"mt-3 flex flex-col gap-2.5"},
      filtradas.map(cartao)),
    tela==="rev" && telaRev,
    tela==="novos" && e("div",{className:"mt-3"}, e(KitsNovosRep,{l:l, onAceitou:aceitouKitNovo})),
    tela==="comissoes" && e(ComissoesRep,{s:s, d:d, l:l}),    tela==="listagens" && telaListagens,
    tela==="retirada" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"flex flex-col items-center rounded-2xl p-4 text-center "+ouro},
        e("p",{className:"text-[12px] font-semibold opacity-80"},"Código de retirada"),
        e("p",{className:"font-mono text-4xl font-bold tracking-[.35em]"}, codigoRetirada(l)),
        e("p",{className:"mt-1 text-[12px]"},"Informe este código no balcão e assine na tela. Ele muda a cada retirada.")),
      e("p",{className:"px-1 text-[13px] font-semibold"}, bip.length ? bip.length+(bip.length>1?" kits prontos para retirar":" kit pronto para retirar") : "Nenhum kit pronto ainda"),
      bip.length>0 && e("div",{className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"}, bip.map(function(k){ return e("div",{key:k.id, className:"flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[13px] last:border-0"},
        ponto(k), e("span",{className:"flex-1 truncate"}, k.rev), e("span",{className:MONO+" text-amber-200"}, BK(k.valor))); })),
      l.retiradas.length>0 && e("div",{className:"rounded-2xl bg-[#1C1C1E] p-3"},
        e("p",{className:"mb-1 text-[12px] font-semibold text-[#8E8E93]"},"Comprovantes"),
        l.retiradas.map(function(r,i){ return e("p",{key:i, className:"text-[13px]"}, "✓ "+hora(r.em)+" · "+r.qtd+(r.qtd>1?" kits":" kit")+" · entregue por "+nomeDe(r.por)+(r.sozinha?" · retirou sozinha":"")+(r.codigo?" · código e assinatura":"")); }))),
    tela==="avaliar" && e("div",{className:"flex flex-col gap-2.5"},
      e("p",{className:"px-1 text-[12px] text-[#8E8E93]"},"Avalie cada kit depois de conferir com a revendedora. Peça faltando desconta de quem bipou."),
      ret.length===0 ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhum kit retirado ainda.")
      : ret.map(function(k){
          if(k.aval) return e("div",{key:k.id, className:"flex items-center gap-2 rounded-2xl bg-[#1C1C1E] px-3 py-2.5 text-[13px]"},
            e("span",{className:"flex-1 truncate"}, k.rev), e("span",{className:"text-amber-300"}, "★".repeat(k.aval.nota)),
            k.aval.faltas>0 && e("span",{className:"text-[11px] text-rose-300"}, k.aval.faltas+" faltando"), e("span",{className:"text-[11px] text-emerald-300"},"enviada"));
          var nt = (notas[k.id]||{}).nota || 0;
          return e("div",{key:k.id, className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
            e("div",{className:"flex items-center justify-between gap-2"}, e("b",{className:"truncate text-[14px]"}, k.rev), estrelas(k)),
            ((s.confBip||{})[k.id]||{}).fim ? e("p",{className:"text-[13px]"}, "Peças faltando: "+(k.errosBip||0)+" (já registrado na conferência das peças)")
            : e("div",{className:"flex items-center justify-between gap-2 text-[13px]"},
              e("span",{className:"text-[#8E8E93]"},"Peças faltando"),
              e("div",{className:"flex items-center gap-2"},
                e("button",{onClick:function(){mudaFalta(k,-1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"−"),
                e("b",{className:MONO+" w-5 text-center"}, faltasDe(k)),
                e("button",{onClick:function(){mudaFalta(k,1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"+"))),
            e("button",{disabled:!nt, onClick:function(){ d({type:"AVALIAR", id:k.id, nota:nt, faltas:faltasDe(k)}); },
              className:"h-9 rounded-xl text-[13px] font-semibold disabled:opacity-40 "+ouro},"Enviar avaliação"));
        })));
}

export { MESES_ABR, mesesApp, PCT_REVENDEDORA, CARTEIRA_DEMO, carteiraRep, AppRepresentante };

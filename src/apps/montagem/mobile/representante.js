// Sorelly Admin · montagem e bipagem — mobile/representante.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { LogoChat } from "@/apps/montagem/components/chat/chat-ui";
import { MensagensRep } from "@/apps/montagem/mobile/mensagens-rep";
import { api, efem, totalNaoLidas, useChat } from "@/apps/montagem/domain/chat-store";
import { contatoDaRepresentante, registrarRevendedora } from "@/apps/montagem/domain/chat-contatos";
import { codigoRetirada } from "@/apps/montagem/components/dialogos";
import { ETAPA } from "@/apps/montagem/components/fila";
import { KitsNovosRep, foraDoPrazo } from "@/apps/montagem/components/kits-novos-rep";
import { derivarAcerto, FORM_ACERTO_VAZIO } from "@/apps/montagem/domain/acerto-derivado";
import { totalDividaAnterior } from "@/apps/montagem/domain/comissoes";
import { mensagemFechamento, mensagemEntrega, abrirPdfAcerto } from "@/apps/montagem/domain/mensagem-fechamento";
import { condicionaisDoKit, totaisDe, totaisKit } from "@/apps/montagem/domain/conferencia-pecas";
import { vezCobravel, versaoDoKit, versaoVigente, PARCELAS_CARTAO,
  AVISO_BB, codigoBrindeValido, normalizarCodigo, limitarCodigo, codigoPecaValido, formasPagamentoPadrao, textoRegras, textoRegrasPrata, versaoEfetiva, modalidadeDe, MODALIDADE_LB } from "@/apps/montagem/domain/consignado";
import { ComissoesRep } from "@/apps/montagem/mobile/comissoes-rep";
import { PedidoDataRep } from "@/apps/montagem/mobile/pedido-data-rep";
import { TelaAssinatura } from "@/apps/montagem/mobile/assinatura";
import { CampoDinheiro, CampoReais, rotuloPagamento } from "@/apps/montagem/mobile/campos";
import { LinksDoAcerto } from "@/apps/montagem/mobile/links-pagamento-app";
import { EntregaKNRep } from "@/apps/montagem/mobile/kn-entrega-rep";
import { ConfPecas } from "@/apps/montagem/mobile/conf-pecas";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { capacidadeListagem, kitsNaListagem, listagemCheia } from "@/apps/montagem/domain/regras";
import { SEM_KIT, STATUS_LB, STATUS_TP, TIPO_KIT } from "@/apps/montagem/domain/status";
import { badge } from "@/apps/montagem/ui/badge";
import { comissaoRev, sugerido } from "@/apps/montagem/domain/vendas";
import { N1, hoje, hora, isoDia } from "@/apps/montagem/lib/format";
import { infNaoLidos } from "@/apps/montagem/domain/informativos";
import { FolderAoAbrir, TelaInformativos } from "@/apps/montagem/mobile/informativos-app";
import { TelaRegrasComissoes } from "@/apps/montagem/mobile/regras-comissoes-app";
import { IPhone17ProMax } from "@/apps/montagem/mobile/iphone";
import { plim } from "@/apps/montagem/components/aviso-pagamentos";
import { pedeConta, estadoPagRep, pagamentosDoPedido } from "@/apps/montagem/domain/pagamento-rep";
import { RecebimentoRep } from "@/apps/montagem/mobile/revendedora";
import { Avatar, PONTO_CEL } from "@/apps/montagem/mobile/theme";
import { use } from "@/apps/montagem/state/context";
import { Icon } from "@/apps/montagem/ui/icon";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useEffect, useRef, useState } from "@/shared/react";
import React from "react";

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
var CARTEIRA_DEMO = {
  Dayanne:[
    revDemo("Amanda Ribeiro","(41) 00000-0001","Avenida Nossa Senhora da Luz, 725 - Jardim Social, Curitiba - PR","Curitiba/PR",2500,1,"09:00"),
    revDemo("Daniela Moreira","(41) 00000-0004","Avenida Brasil, 1480 - Eucaliptos, Fazenda Rio Grande - PR","Curitiba/PR",1900,4,null),
    revDemo("Patrícia Nunes","(41) 00000-0021","Rua Fictícia L, 121","Curitiba/PR",3000,3,"11:00"),
    revDemo("Luciana Prado","(41) 00000-0022","Rua Fictícia L, 222","Curitiba/PR",1300,5,"14:30"),
    revDemo("Aline Souza","(41) 00000-0025","Rua Fictícia O, 125","Curitiba/PR",1700,6,"09:30")],
  Lysie:[
    revDemo("Fernanda Azevedo","(41) 00000-0006","Rua Fictícia C, 206","Curitiba/PR",1700,1,"09:30"),
    revDemo("Gabriela Mendes","(41) 00000-0007","Rua Fictícia D, 107","Curitiba/PR",1600,2,"10:30"),
    revDemo("Helena Barros","(41) 00000-0023","Rua Fictícia M, 123","Curitiba/PR",900,3,"15:00"),
    revDemo("Bruna Teixeira","(41) 00000-0026","Rua Fictícia P, 126","Curitiba/PR",1400,4,"10:00"),
    revDemo("Mirela Santos","(41) 00000-0028","Rua Fictícia R, 128","Curitiba/PR",800,5,"11:30"),
    // 1 agendada (data e hora no cadastro dela, ver store.js) e 2 a agendar (sem data ainda)
    revDemo("Simone Prestes","(41) 00000-0041","Rua Fictícia AA, 141 - Portão, Curitiba - PR","Curitiba/PR",1800,2,"10:00"),
    revDemo("Taís Fontoura","(41) 00000-0042","Rua Fictícia AB, 242 - Cabral, Curitiba - PR","Curitiba/PR",1500,3,null),
    revDemo("Rosana Linhares","(41) 00000-0043","Rua Fictícia AC, 343 - Boa Vista, Curitiba - PR","Curitiba/PR",2100,5,null)],
  Jessica:[
    revDemo("Larissa Almeida","(41) 00000-0011","Rua Fictícia F, 111","São José dos Pinhais/PR",2200,1,"09:00"),
    revDemo("Mariana Costa","(41) 00000-0012","Rua Fictícia F, 212","São José dos Pinhais/PR",1900,2,"10:15"),
    revDemo("Natália Freitas","(41) 00000-0024","Rua Fictícia N, 124","São José dos Pinhais/PR",2000,4,"13:00"),
    revDemo("Carla Vidal","(41) 00000-0027","Rua Fictícia Q, 127","São José dos Pinhais/PR",2100,5,"11:00"),
    revDemo("Nádia Pires","(41) 00000-0029","Rua Fictícia S, 129","São José dos Pinhais/PR",600,6,"14:00")],
  Thalita:[
    revDemo("Fabiana Moura","(41) 00000-0030","Rua Fictícia T, 130","Curitiba/PR",3000,1,"09:30"),
    revDemo("Jaqueline Neves","(41) 00000-0031","Rua Fictícia T, 231","Curitiba/PR",2400,2,"10:30"),
    revDemo("Karina Lopes","(41) 00000-0032","Rua Fictícia U, 132","Curitiba/PR",1200,3,"13:30"),
    revDemo("Letícia Barros","(41) 00000-0033","Rua Fictícia U, 233","Curitiba/PR",3800,4,"15:00"),
    revDemo("Rúbia Falcão","(41) 00000-0034","Rua Fictícia V, 134","Curitiba/PR",9000,5,"16:00")]
};
var REF_NOMES = ["Maria Aparecida","João Carlos","Rosângela Silva","Marcos Paulo","Cleusa Pereira","Adriana Santos","Sueli Ramos","Edson Luiz"];
var REF_REL = ["Mãe","Irmã","Vizinha","Esposo","Amiga","Prima","Tia","Cunhado"];
function refsDe(nome){ var h = 0; for(var i=0;i<nome.length;i++) h = (h*31 + nome.charCodeAt(i)) % 9973;
  return [0,1,2].slice(0, 2 + h%2).map(function(j){ var x = (h + j*7) % REF_NOMES.length;
    return {nome:REF_NOMES[x], rel:REF_REL[(h + j*3) % REF_REL.length], fone:"(41) 9"+String(8100 + (h*(j+3))%1800)+"-"+String(1000 + (h*(j+5))%9000).slice(-4)}; }); }
function carteiraRep(s, rep){
  var dm = function(dt){ return dt.toLocaleDateString("pt-BR",{day:"2-digit", month:"2-digit"}); };
  var dmISO = function(iso){ var p = (iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1] : ""; };
  var perfis = s.perfisRev||{};
  var lids = s.listagens.filter(function(x){return x.rep===rep;}).map(function(x){return x.id;});
  var hojeK = s.kits.filter(function(k){return lids.indexOf(k.lid)>=0;}).map(function(k){
    return {id:k.id, rev:k.rev, fone:k.fone||"", bairro:k.endereco||k.bairro, vendas:k.vendas||[], cond:k.valor, hora:k.horaAtend, hoje:true, data:dm(new Date()), nova:(k.tipoKit||"").indexOf("kit_novo")===0, tipoKit:k.tipoKit, status:k.status, lid:k.lid}; });
  // Revendedora que já fez o acerto neste mês: o card mostra "Acerto realizado · mês" e o vendido/acerto reais do acerto
  var mesAtual = isoDia(new Date()).slice(0,7);
  var feito = function(rev){ return (s.acertosConsignado||[]).find(function(a){ return a.tipo==="acerto" && a.rev===rev && (a.data||"").slice(0,7)===mesAtual; }); };
  var comFeito = function(c){ var a = feito(c.rev); return a ? Object.assign({}, c, {vendas:[a.vendaBruta].concat((c.vendas||[]).slice(1)), realizado:{data:dmISO(a.data), mes:MESES_CHEIOS[+a.data.slice(5,7)-1]}}) : c; };
  var peds = (s.p45 && s.p45.pedidos) || [];
  var comPedido = function(c){ if(c.hoje) return c; var pd = peds.filter(function(x){ return (x.status==="registrada" || x.status==="aprovada") && x.nome.toLowerCase()===c.rev.toLowerCase(); }).slice(-1)[0]; return pd ? Object.assign({}, c, {data:dmISO(pd.novaData)}) : c; };
  return hojeK.map(comFeito).concat((CARTEIRA_DEMO[rep]||[]).map(function(c,i){ var dt = new Date(); dt.setDate(dt.getDate()+c.dias);
    var ag = (perfis[c.rev]||{}).agendado;
    return comPedido(comFeito(Object.assign({id:"C"+i, hoje:false, data: ag && ag.data ? dmISO(ag.data) : dm(dt), hora: ag ? (ag.hora||null) : c.hora}, c))); }));
}
function AppRepresentante(p){
  var cx = use(), s = cx.state, d = cx.dispatch, l = p.l;
  var chatSt = useChat(), chatCid = contatoDaRepresentante(l.rep), chatNaoLidas = chatCid && chatSt.config.representantes ? totalNaoLidas(chatCid) : 0;
  var tb = useState("inicio"), tela = tb[0], setTela = tb[1];
  var cvv = useState("calcacerto"), confVolta = cvv[0], setConfVolta = cvv[1];   // para onde a conferência das peças volta (entrega do kit novo ou acerto)
  var ms = useState(0), mes = ms[0], setMes = ms[1];
  var bs = useState(""), busca = bs[0], setBusca = bs[1];
  var sr = useState(null), selId = sr[0], setSel = sr[1];
  var af = useState(FORM_ACERTO_VAZIO), acertoForm = af[0], setAcertoForm = af[1];
  var BRINDE_IN_VAZIO = {normal:{codigo:"", valor:null}, bb:{codigo:"", valor:null}};
  var bi = useState(BRINDE_IN_VAZIO), brindeIn = bi[0], setBrindeIn = bi[1];
  var ta = useState("inicio"), telaAntes = ta[0], setTelaAntes = ta[1];
  var LANC_VAZIO = {forma:"", descricao:"", parcelas:1, data:isoDia(new Date()), valor:null, anexo:null};
  var mc = useState(null), msgCopiada = mc[0], setMsgCopiada = mc[1];
  var cpx = useState(""), codProx = cpx[0], setCodProx = cpx[1];
  var lf = useState(false), lancAberto = lf[0], setLancAberto = lf[1];
  var lv = useState(LANC_VAZIO), lancForm = lv[0], setLancForm = lv[1];
  var ngA = useState(false), negociarAberto = ngA[0], setNegociarAberto = ngA[1];
  var rf = useState({comExpositor:false, especial:false, valorEspecial:0}), reposForm = rf[0], setReposForm = rf[1];
  var mc = useState("acerto"), modoCalc = mc[0], setModoCalc = mc[1];
  var ab = useState(1), blocoAberto = ab[0], setBlocoAberto = ab[1];
  var TROCA_VAZIA = {tipo:null, antigaCod:"", antigaValor:null, novaCod:"", novaValor:null};
  var tr0 = useState(TROCA_VAZIA), trocaIn = tr0[0], setTrocaIn = tr0[1];
  var lsel = useState(l.id), lidPed = lsel[0], setLidPed = lsel[1];
  var so = useState("data"), sortBy = so[0], setSortBy = so[1];
  var fa = useState(false), filtrosAbertos = fa[0], setFiltrosAbertos = fa[1];
  var me = useState(false), menuAberto = me[0], setMenuAberto = me[1];
  var mso = useState(false), mostrarSolicitar = mso[0], setMostrarSolicitar = mso[1];
  var flForm = useState({destino:"Curitiba", horario:"10:00"}), formListagem = flForm[0], setFormListagem = flForm[1];
  var agA = useState(false), agendarAberto = agA[0], setAgendarAberto = agA[1];
  var agF = useState({data:"", hora:""}), agendaForm = agF[0], setAgendaForm = agF[1];
  var lvA = useState(""), lidVista = lvA[0], setLidVista = lvA[1];
  var lvB = useState(""), buscaListagem = lvB[0], setBuscaListagem = lvB[1];
  var ep = useState(false), editandoPerfil = ep[0], setEditandoPerfil = ep[1];
  var re = useState(null), regEscolha = re[0], setRegEscolha = re[1]; // null = fechado, "multa"/"isenta" = caixinha aberta nessa escolha
  var meses = mesesApp(), cart = carteiraRep(s, l.rep);
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
  // Tela inicial (dashboard): totais somados da carteira, no mesmo critério dos cards de revendedora (vendido/acerto/comissão 8%).
  var vendidoTotal = tot, acertoTotal = cart.reduce(function(t,r){ var vd = vendMes(r); return t + Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100))); }, 0),
    comissaoRepTotal = Math.round(acertoTotal*0.08);
  if(l.rep==="Dayanne"){ vendidoTotal = 125215; acertoTotal = 70120.40; comissaoRepTotal = 5609.63; } // valores fictícios de demonstração pedidos pro perfil da Dayanne
  var nPagNI = (s.acertosConsignado||[]).reduce(function(t,r){ return r.origem==='interno' || r.rep!==l.rep ? t : t+Object.keys(r.divs||{}).filter(function(i){ return r.divs[i].tipo==='nao_ident' && !(r.fin && r.fin[i]); }).length; }, 0);
  var minhasL = s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada;});
  // conversa com a revendedora no próprio chat do app (em vez de abrir o WhatsApp)
  var abrirChat = function(nome){ var cr = contatoDaRepresentante(l.rep), rv = registrarRevendedora(nome); if(!cr) return; efem({conversaSel:api.openChannel(rv, "r_rep", [cr])}); setTela("mensagens"); };
  // aceitou o kit novo: abre a conversa com a revendedora no SorellyChat já com a mensagem de apresentação enviada
  var aceitouKitNovo = function(n, texto){ var cr = contatoDaRepresentante(l.rep), rv = registrarRevendedora(n.nome); if(!cr) return; var conv = api.openChannel(rv, "r_rep", [cr]); api.sendMessage({conv:conv, eu:cr, texto:texto}); efem({conversaSel:conv}); setTela("mensagens"); };
  var nInfoNovos = infNaoLidos(s, "representante", l.rep);   // informativos que ela ainda não abriu
  var LISTA_INICIO = [
    {tela:"mensagens", titulo:"SorellyChat", sub: chatNaoLidas ? chatNaoLidas+(chatNaoLidas===1 ? " mensagem não lida" : " mensagens não lidas") : "Fale com os setores da Sorelly", icone:"whats", cor:"#C9A13B", logo:true, ativo:true},
    {tela:"revs", titulo:"Revendedoras", sub:"Veja e acompanhe sua rede", icone:"users", cor:"#EA580C", ativo:true},
    {tela:"novos", titulo:"Kits Novos", sub: nNovos ? nNovos+" aguardando" : "Revendedoras novas direcionadas", icone:"novas", cor:"#DB2777", ativo:true},
    {tela:"listagens", titulo:"Listagens", sub: minhasL.length+(minhasL.length===1?" listagem aberta":" listagens abertas"), icone:"lista", cor:"#7C3AED", ativo:true},
    {tela:"comissoes", titulo:"Comissões", sub: nPagNI ? "⚠ "+nPagNI+(nPagNI===1 ? " pagamento não identificado" : " pagamentos não identificados") : "Minhas comissões e quilometragem", icone:"coins", cor:"#CA8A04", ativo:true},
    {tela:"regrascom", titulo:"Regras e comissões", sub:"Tabela, brindes, taxas e multas", icone:"book", cor:"#B8862B", ativo:true},
    {tela:"informativos", titulo:"Informativos", sub: nInfoNovos ? nInfoNovos+(nInfoNovos===1 ? " novo" : " novos")+" para ler" : "Regras, avisos e novidades", icone:"book", cor:"#9A7424", ativo:true},
    {tela:"desempenho", titulo:"Desempenho", sub:"Em breve", icone:"trofeu", cor:"#16A34A", ativo:false},
    {tela:"indique", titulo:"Indique & Ganhe", sub:"Em breve", icone:"presente", cor:"#CA8A04", ativo:false}];
  var voltar = e("div",{className:"flex items-center gap-2"},
    e("button",{onClick:function(){setTela("inicio");}, className:"flex h-8 items-center gap-1 rounded-full bg-[#1C1C1E] px-3 text-[12px] font-semibold text-amber-200"}, "‹ Início"),
    e("b",{className:"text-[16px]"}, TITULO[tela]));
  var PCT_COMISSAO_REP_CARD = 0.08; // comissão da representante exibida no card: 8% do valor do acerto
  var LINHA_CARD = "border-[#E9DDBB]";
  var col = function(lb, v, cor){ return e("div",{className:"px-1"}, e("p",{className:"text-[9px] font-bold leading-tight tracking-wide text-[#9A8B63]"}, lb), e("p",{className:MONO+" mt-0.5 text-[13px] font-bold", style:cor?{color:cor}:null}, v)); };
  var cartao = function(r){
    var vd = vendMes(r), acerto = Math.round(vd*(1-((comissaoRev(vd, s.cfg)||{pct:0}).pct/100))), comissaoRep = Math.round(acerto*PCT_COMISSAO_REP_CARD);
    var estado = r.realizado ? {lb:"✓ Acerto realizado · "+r.realizado.mes, cor:"#15803D"} : r.hoje ? {lb:"Acerto hoje", cor:"#B45309"} : r.hora ? {lb:"Acerto previsto", cor:"#1D4ED8"} : {lb:"Acerto previsto", cor:"#9CA3AF"};
    // endereço favorito (estrela na ficha da revendedora): é onde ela prefere ser atendida no acerto, e é o que aparece na lista
    var pf = s.perfisRev[r.rev] || {}, fav = pf.enderecoFavorito;
    var endCard = fav==="trabalho" ? (pf.enderecoTrabalho || r.bairro) : fav==="casa" ? (pf.enderecoCasa!==undefined ? pf.enderecoCasa : r.bairro) : r.bairro;
    return e("div",{key:r.id, onClick:function(){ setSel(r.id); setTela("rev"); }, role:"button", tabIndex:0,
        className:"block w-full cursor-pointer overflow-hidden rounded-2xl border "+LINHA_CARD+" text-left shadow-sm transition-transform active:scale-[.99]",
        style:{background:"#F6EBCB"}},
      e("div",{className:"flex items-center justify-between gap-2 px-2.5 py-2"},
        e("div",{className:"flex min-w-0 items-center gap-1.5"},
          e("b",{className:"min-w-0 truncate text-[14px] text-[#111827]"}, r.rev),
          modalidadeDe(s, r.rev)==="prata" && e("span",{className:"shrink-0 rounded-full bg-slate-700 px-1.5 py-px text-[9px] font-black tracking-wider "+BR}, "100% PRATA")),
        e("div",{className:"flex shrink-0 items-center gap-1.5"},
          e("span",{className:"text-[13px] font-medium text-[#4B5563]"}, r.fone||"—"),
          r.fone && e("button",{type:"button", onClick:function(ev){ ev.stopPropagation(); abrirChat(r.rev); }, "aria-label":"Conversar com "+r.rev+" no chat", title:"Conversar no chat", className:"grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:12})))),
      e("div",{className:"grid grid-cols-3 divide-x divide-[#E9DDBB] border-t "+LINHA_CARD+" py-2 text-center"},
        col("VENDIDO", BK(vd), "#15803D"), col("ACERTO", BK(acerto), "#2563EB"), col("COMISSÃO", BK(comissaoRep), "#A67C12")),
      e("div",{className:"flex items-start justify-between gap-2 border-t "+LINHA_CARD+" px-2.5 py-1.5"},
        e("p",{className:"min-w-0 flex-1 text-[11px] leading-snug text-[#6B7280]"},
          fav && e("span",{className:"mr-1 inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-px align-middle text-[9.5px] font-bold text-amber-800"},
            e(Icon,{n:"star", s:9, peso:"fill"}), fav==="trabalho" ? "Trabalho" : "Casa"),
          endCard||"—"),
        endCard && e("button",{onClick:function(ev){ ev.stopPropagation(); copiarEndereco(r.id, endCard); }, "aria-label":"Copiar endereço de "+r.rev,
          className:"flex shrink-0 items-center gap-1 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[#4B5563]"},
          e(Icon,{n:"copiar", s:11}), copiadoId===r.id ? "Copiado" : "Copiar")),
      e("div",{className:"flex items-center justify-between border-t "+LINHA_CARD+" px-2.5 py-1.5 text-[11.5px] font-semibold", style:{color:estado.cor}},
        e("span",null, estado.lb), e("span",null, r.realizado ? r.realizado.data : r.data+(r.hora ? " · "+r.hora : ""))));
  };
  // Revendedora aberta: contatos de referência e pedidos (kit, reposição, saiu = só retirar a condicional)
  var sel = cart.find(function(r){return r.id===selId;});
  var lPed = minhasL.find(function(x){return x.id===lidPed;}) || minhasL[0];
  var pedir = function(tipo, opts){ opts = opts || {};
    var lidUse = opts.lid || (lPed && lPed.id), lUse = s.listagens.find(function(x){return x.id===lidUse;});
    if(!lUse || !sel) return;
    var conds = SEM_KIT[tipo] ? [String(13000 + sel.rev.length*97 + sel.rev.charCodeAt(0)).padStart(6,"0")] : [];
    d({type:"ADD_KIT", lid:lUse.id, rev:sel.rev, bairro:sel.bairro||"", vendas: tipo==="reposicao" ? [] : sel.vendas, prio:false, atrasado:foraDoPrazo(lUse, s), tipoKit:tipo, conds:conds, fone:sel.fone, hora:(opts.hora!==undefined?opts.hora:sel.hora)||null, porApp:true});
    if(!opts.ficarNaTela) setTela("revs"); };
  var kitSel = sel && sel.hoje ? s.kits.find(function(k){return k.id===sel.id;}) : null;
  // resumo do kit entregue e conferido (condicionais, peças, valor, faltas e peças de outro kit): entra no PDF do acerto + kit novo e no resumo do kit novo
  var kitConfDe = function(kid){ var cf = (s.confBip||{})[kid], kk = s.kits.find(function(x){ return x.id===kid; }); if(!cf || !cf.fim || !kk) return null;
    var cs = condicionaisDoKit(kk), tk = totaisKit(cs), r = cf.resultado || {};
    return {conds:cs.map(function(c){ var x = totaisDe(c); return {numero:c.numero, modelos:x.modelos, pecas:x.pecas, valor:x.valor}; }), pecas:tk.pecas, valor:tk.valor, lidas:r.lidas||0, esperadas:r.esperadas||0, faltas:r.faltas||[], sobras:r.sobras||[]}; };
  var raS = useState(false), reposAss = raS[0], setReposAss = raS[1];   // reposição: a revendedora assinou a condicional?
  var cmS = useState({numero:"", pecas:""}), condManual = cmS[0], setCondManual = cmS[1];   // condicional adicionada à mão (quando não está cadastrada)
  var paS = useState(null), pendAbrir = paS[0], setPendAbrir = paS[1];                      // pedido para abrir direto um acerto já preenchido (botão do admin ou ?acerto=1)
  var jaAcertado = kitSel && (kitSel.status==="acertado" || kitSel.acerto || kitSel.reposicaoEntregue);
  var ehKitNovoHoje = !!kitSel && (kitSel.tipoKit||"").indexOf("kit_novo")===0;
  var modalidadeKit = sel ? modalidadeDe(s, sel.rev) : "padrao", ehPrata = modalidadeKit==="prata";
  var versaoBaseSel = kitSel ? versaoDoKit(s, kitSel) : null;
  var versaoSel = versaoBaseSel ? versaoEfetiva(versaoBaseSel, modalidadeKit) : null;
  var formas = s.formasPagamento || formasPagamentoPadrao();
  var formaDe = function(k){ return formas.find(function(f){return f.k===k;}) || {k:k, label:k, parcelas:false, descricoes:[]}; };
  // Pagamento: soma de todos os lançamentos (cada um entra inteiro, sem dividir por parcela). Se faltar algo e existir
  // um acordo salvo cuja soma das parcelas fecha exatamente a diferença (folga de 1 centavo), libera o brinde do mesmo jeito.
  // Toda a conta do acerto vem de domain/acerto-derivado.js (a mesma da Calculadora de acertos do atendimento interno).
  var vezAtual = kitSel ? vezCobravel(kitSel.remarcacoesLista) : 0;
  var condicionaisRev = sel ? ((s.perfisRev[sel.rev]||{}).condicionaisAbertas || []) : [];
  var dv = derivarAcerto({versaoBase:versaoBaseSel, modalidade:modalidadeKit, vez:vezAtual, form:acertoForm, condicionais:condicionaisRev, autoPecas:true, dividaAnterior:sel ? totalDividaAnterior(s.acertosConsignado, sel.rev) : 0});
  var totalPagoAtual = dv.totalPagoAtual, acordoSoma = dv.acordoSoma, previaBase = dv.previaBase, faltaAtual = dv.faltaAtual, quitado = dv.quitado,
    acordoExistente = dv.acordoExistente, acordoValido = dv.acordoValido, previaAcerto = dv.previaAcerto, pecasCondSelecionadas = dv.pecasCondSelecionadas, pecasADevolver = dv.pecasADevolver;
  // Pagamento: a representante só informa FORMA + VALOR e o pedido de conta segue em segundo plano (Controle de pagamentos); o app nunca espera.
  var estPag = function(pg){ return pg.pid && kitSel ? estadoPagRep(s.lancFin, kitSel.id, pg.pid) : null; };
  var rotPag = function(pg){ var es = estPag(pg); return es && es.aguardando ? formaDe(pg.forma).label+(pg.forma==="credito" && pg.parcelas>1 ? " "+pg.parcelas+"x" : "") : rotuloPagamento(es ? Object.assign({}, pg, {descricao:es.conta}) : pg); };
  var avc = useState(null), avisoConta = avc[0], setAvisoConta = avc[1], esperandoConta = useRef({});
  useEffect(function(){   // conta que estava aguardando e chegou: aviso com som no app dela
    var chegou = null;
    acertoForm.pagamentos.forEach(function(pg){ var es = estPag(pg); if(!es) return;
      if(es.aguardando) esperandoConta.current[pg.pid] = true;
      else if(esperandoConta.current[pg.pid]){ delete esperandoConta.current[pg.pid]; chegou = {valor:pg.valor, conta:es.conta}; } });
    if(chegou){ plim(); setAvisoConta(chegou); }
  }, [s.lancFin, acertoForm.pagamentos]);
  useEffect(function(){ if(!avisoConta) return; var tm = setTimeout(function(){ setAvisoConta(null); }, 12000); return function(){ clearTimeout(tm); }; }, [avisoConta]);
  useEffect(function(){ if(!p.abrir) return; var alvo = cart.find(function(r){ return r.rev===p.abrir.rev && r.hoje; }); if(alvo){ setSel(alvo.id); setPendAbrir(p.abrir.n); } }, [p.abrir && p.abrir.n]);
  useEffect(function(){
    if(!pendAbrir || !p.abrir || !kitSel || !sel || sel.rev!==p.abrir.rev || !versaoBaseSel) return;
    var conds = condicionaisRev.slice(0,2).map(function(c){ return c.numero; }), hoje = isoDia(new Date());
    var conta = function(form){ return derivarAcerto({versaoBase:versaoBaseSel, modalidade:modalidadeKit, vez:vezAtual, form:form, condicionais:condicionaisRev, autoPecas:true, dividaAnterior:totalDividaAnterior(s.acertosConsignado, sel.rev)}); };
    var base = Object.assign({}, FORM_ACERTO_VAZIO, {vendaBruta:3000, condicionaisSelecionadas:conds});
    var valor = conta(base).previaBase ? conta(base).previaBase.valorDevido : 0;
    var comPag = Object.assign({}, base, {pagamentos:[{forma:"pix", descricao:"PIX - POINT", parcelas:1, data:hoje, valor:valor, anexo:null}]});
    var d1 = conta(comPag), brindes = [];
    if(d1.libN>0) brindes.push({cat:"normal", codigo:"N1287", valor:d1.libN, origem:"nova"});
    if(d1.libS>0) brindes.push({cat:"bb", codigo:"BB0001", valor:d1.libS, origem:"nova"});
    var prox = []; for(var q=0; q<Math.min(3, d1.pecasProx ? d1.pecasProx.liberadas : 0); q++) prox.push("P"+(2001+q));
    setAcertoForm(Object.assign({}, comPag, {pecasVendidas:40, brindes:brindes, pecasProxCodigos:prox}));
    setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(5); setTela("calcacerto"); setPendAbrir(null);
  }, [pendAbrir, selId]);
  var toggleCondicional = function(numero){ var o = acertoForm.condicionaisSelecionadas.slice(), i = o.indexOf(numero);
    if(i>=0) o.splice(i,1); else o.push(numero); setAcertoForm(Object.assign({}, acertoForm, {condicionaisSelecionadas:o})); };
  var expositoresRev = sel ? ((s.perfisRev[sel.rev]||{}).expositores || []) : [];
  var condAbertasFicam = condicionaisRev.filter(function(c){ return acertoForm.condicionaisSelecionadas.indexOf(c.numero)<0; });
  var expFicam = expositoresRev.filter(function(x){ return (acertoForm.expositoresMarcados||[]).indexOf(x.id)<0; });
  var kitNovoSugerido = kitSel ? sugerido(sel.vendas, s.cfg) : null;
  // Acordeão da Calculadora de acertos: aparece direto dentro da tela da revendedora (não é uma tela separada).
  var BR2 = BR;
  var checkOk = e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500/20 text-emerald-400"}, e(Icon,{n:"check", s:13}));
  var badgeTxt = function(txt, cor){ return e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold "+BR2, style:{background:cor}}, txt); };
  var blocoAcordeao = function(idx, icone, cor, titulo, subtitulo, status, conteudo){
    var aberto = blocoAberto===idx;
    return e("div",{key:idx, className:"overflow-hidden rounded-2xl bg-[#1C1C1E]"},
      e("button",{onClick:function(){ setBlocoAberto(aberto?null:idx); }, className:"flex w-full items-center gap-3 p-3 text-left"},
        e("span",{className:"grid size-9 shrink-0 place-items-center rounded-xl", style:{background:cor+"26", color:cor}}, e(Icon,{n:icone, s:18})),
        e("div",{className:"min-w-0 flex-1"}, e("b",{className:"block text-[14px]"}, titulo), e("span",{className:"block truncate text-[11.5px] text-[#8E8E93]"}, subtitulo)),
        status,
        e(Icon,{n: aberto?"chevrondown":"chevron", s:15, className:"text-[#8E8E93]"})),
      aberto && e("div",{className:"flex flex-col gap-2.5 border-t border-white/5 p-3"+(jaAcertado ? " pointer-events-none select-text" : "")}, conteudo));
  };
  var gerais = versaoSel ? versaoSel.gerais : {};
  var campo = "h-9 rounded-lg bg-black/50 px-2 text-[13px] text-white outline-none ring-1 ring-white/10";
  var campoGrande = "h-11 w-full rounded-xl bg-black/50 px-3 text-left text-[15px] font-semibold text-white outline-none ring-1 ring-white/10";
  var kitNovoMin = dv.kitNovoMin, pctPagoAcerto = dv.pctPagoAcerto, kitNovoLiberado = dv.kitNovoLiberado, pagamentoParcial = dv.pagamentoParcial;
  var tetoFalta = dv.tetoFalta, faixaMinBrinde = dv.faixaMinBrinde, brindeBloqueio = dv.brindeBloqueio, brindeLiberado = dv.brindeLiberado,
    libN = dv.libN, libS = dv.libS, confBrinde = dv.confBrinde, excedenteBrinde = dv.excedenteBrinde, totalAPagar = dv.totalAPagar, restanteTotal = dv.restanteTotal;
  var lancarBrinde = function(cat){
    var f = brindeIn[cat];
    if(!(codigoBrindeValido(cat, f.codigo) && f.valor>0 && f.origem)) return;
    var o = {}; o[cat] = {codigo:"", valor:null, origem:null};
    setAcertoForm(Object.assign({}, acertoForm, {brindes:acertoForm.brindes.concat([{cat:cat, codigo:normalizarCodigo(f.codigo), valor:f.valor, origem:f.origem}])}));
    setBrindeIn(Object.assign({}, brindeIn, o));
  };
  var cartaoBrinde = function(cat, titulo, rotulo, liberado, resumo, cor, ph){
    var f = brindeIn[cat], itens = acertoForm.brindes.map(function(b,i){ return {b:b, i:i}; }).filter(function(x){return x.b.cat===cat;});
    var codOk = codigoBrindeValido(cat, f.codigo), pronto = codOk && f.valor>0 && !!f.origem, origem = f.origem || null;
    var setF = function(patch){ var o = {}; o[cat] = Object.assign({}, f, patch); setBrindeIn(Object.assign({}, brindeIn, o)); };
    return e("div",{key:cat, className:"flex flex-col gap-2 rounded-xl p-2.5 ring-1", style:{background:cor+"14", "--tw-ring-color":cor+"55"}},
      e("div",{className:"flex items-start justify-between gap-2"},
        e("div",{className:"min-w-0"}, e("b",{className:"block text-[13.5px]"}, titulo), e("p",{className:"text-[11px] leading-snug text-[#8E8E93]"}, rotulo)),
        e("span",{className:MONO+" shrink-0 text-[14px] font-extrabold", style:{color:cor}}, BK(liberado))),
      itens.map(function(x){ return e("div",{key:x.i, className:"flex items-center justify-between gap-2 rounded-lg bg-black/30 px-2.5 py-1.5"},
        e("span",{className:"flex min-w-0 items-center gap-1.5"}, e("span",{className:MONO+" text-[12.5px] font-semibold"}, x.b.codigo),
          e("span",{className:"rounded-full px-1.5 py-px text-[9.5px] font-bold "+(x.b.origem==="antiga" ? "bg-amber-400/25 text-amber-200" : "bg-emerald-400/25 text-emerald-200")}, x.b.origem==="antiga" ? "KIT ANTIGO" : "KIT NOVO")),
        e("span",{className:"flex items-center gap-2"},
          e("span",{className:MONO+" text-[12.5px]"}, BK(x.b.valor)),
          e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {brindes:acertoForm.brindes.filter(function(y,j){return j!==x.i;})})); },
            "aria-label":"Remover peça "+x.b.codigo, className:"grid size-6 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70"}, "×"))); }),
      e("div",{className:"grid grid-cols-2 gap-1.5"}, [["antiga","Kit antigo","devolvendo","bg-[#F59E0B] txt-branco ring-transparent"],["nova","Kit novo","recebendo","bg-[#16A34A] txt-branco ring-transparent"]].map(function(o){ var on = origem===o[0];
        return e("button",{key:o[0], onClick:function(){ setF({origem:o[0]}); }, "aria-pressed":on,
          className:"flex h-10 flex-col items-center justify-center rounded-lg text-[12px] font-bold leading-tight ring-1 "+(on ? o[3] : "bg-[#F1F2F4] ring-[#E5E7EB] text-[#6B7280]")},
          e("span",null,(on?"✓ ":"")+o[1]), e("span",{className:"text-[9.5px] font-medium opacity-80"}, o[2])); })),
      e("div",{className:"flex gap-1.5"},
        e("input",{value:f.codigo, placeholder:ph, autoCapitalize:"characters", "aria-label":"Código da peça",
          onChange:function(ev){ setF({codigo:limitarCodigo(ev.target.value)}); },
          className:"h-10 w-[6.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-[14px] font-semibold tracking-wide text-white outline-none ring-1 ring-white/10 "+MONO+" uppercase"}),
        e(CampoReais,{value:f.valor, label:"Valor da peça", onChange:function(v){ setF({valor:v}); }, className:"h-10 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-right text-[14px] text-white outline-none ring-1 ring-white/10 "+MONO}),
        e("button",{disabled:!pronto, onClick:function(){ lancarBrinde(cat); }, className:"h-10 shrink-0 rounded-lg px-2.5 text-[12px] font-bold disabled:opacity-40 "+BR2, style:{background:cor}}, "Lançar")),
      f.codigo && !codOk && e("p",{className:"text-[11.5px] font-semibold text-red-400"},
        cat==="bb" ? "Código BB: começa com BB (ou BB + 1 ou 2 letras) e termina com até 7 números. Ex.: BB0001, BBA0001 (anel). BB não é só brinco." : "Código: até 4 letras e até 7 números. Ex.: N1287."),
      e("p",{className:"text-[13px] font-bold text-white"}, resumo));
  };

  // ── Cabeçalho fixo: título, ícone das regras, nome da revendedora e o consolidado padronizado (aparece quando preenche a venda) ──
  var linhaCons = function(k, rot, val, o){ o = o || {};
    return e("div",{key:k, className:"flex items-baseline justify-between gap-3"+(o.topo ? " border-t border-white/10 pt-1.5" : "")},
      e("span",{className:(o.peq ? "text-[10.5px] " : "text-[12px] ")+(o.rotCor || "text-[#B5B5BA]")}, rot),
      e("span",{className:MONO+" whitespace-nowrap font-bold "+(o.grande ? "text-[23px] font-black leading-none" : o.peq ? "text-[11px]" : "text-[13px]")+" "+(o.cor || BR)}, val)); };
  var pagsTopo = acertoForm.pagamentos.map(function(p,i){ return {p:p, n:i+1}; }).slice(-3);
  var headerCalc = kitSel && e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1.5 bg-[#0B0B0D] px-4 pb-1.5 pt-3 shadow-[0_6px_10px_rgba(0,0,0,.35)]"},
    e("div",{className:"flex items-center gap-2"},
      e("button",{onClick:function(){setTela("rev");}, "aria-label":"Voltar pra Revendedora", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo+" min-w-0 flex-1 truncate"}, "Calculadora de Acertos"),
      e("button",{onClick:function(){ setTelaAntes("calcacerto"); setTela("regras"); }, "aria-label":"Ver as regras", title:"Regras",
        className:"grid size-8 shrink-0 place-items-center rounded-full bg-amber-200 text-[#1B1409]"}, e(Icon,{n:"book", s:16}))),
    e("div",{className:"flex flex-col gap-0.5 rounded-2xl bg-[#1C1C1E] px-3 py-2 ring-1 ring-amber-200/25"},
      e("div",{className:"flex items-center gap-2"},
        e("p",{className:"min-w-0 flex-1 truncate text-[13.5px] font-extrabold "+BR}, sel.rev),
        ehPrata && e("span",{className:"shrink-0 rounded-full bg-slate-300 px-2 py-0.5 text-[10.5px] font-black tracking-wider text-slate-900"}, "100% PRATA")),
      !previaAcerto && e("p",{className:"text-[11px] text-[#8E8E93]"},"Preencha as vendas para ver a conta do acerto."),
      previaAcerto && e(React.Fragment,null,
      linhaCons("v", dv.trocasAjuste!==0 ? "Vendas (com trocas):" : "Vendas:", BK(dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta)),
      linhaCons("c", "Comissão:", e("span",null, e("span",{className:"mr-1.5 text-[10px] font-normal text-[#8E8E93]"}, previaAcerto.semFaixa ? "sem faixa — comissão zero"
          : (previaAcerto.descontoRemarcacao.comissaoPct>0 || previaAcerto.atrasoPct>0) ? previaAcerto.faixa.pct+"% da faixa"+(previaAcerto.descontoRemarcacao.comissaoPct>0 ? " − "+previaAcerto.descontoRemarcacao.comissaoPct+"% de remarcação" : "")+(previaAcerto.atrasoPct>0 ? " − "+previaAcerto.atrasoPct+"% de atraso" : "") : previaAcerto.faixa.pct+"% da faixa, sem desconto"), previaAcerto.comissaoPct+"%")),
      previaAcerto.taxaDeslocamento>0 && linhaCons("t", "Taxa de deslocamento:", BK(previaAcerto.taxaDeslocamento), {cor:"text-amber-300"}),
      linhaCons("a", "Valor de Acerto:", BK(previaAcerto.valorAcerto), {cor:"text-amber-200", rotCor:"text-amber-200/80"}),
      excedenteBrinde>0 && linhaCons("x", "Excedente de brinde:", BK(excedenteBrinde), {cor:"text-red-400"}),
      dv.dividaAnterior>0 && linhaCons("dv", "Dívida anterior:", BK(dv.dividaAnterior), {cor:"text-red-400"}),
      dv.novas && previaAcerto.multas>0 && linhaCons("mu", "Multa do valor pendente:", BK(previaAcerto.multas), {cor:"text-red-400"}),
      dv.tagsValor>0 && linhaCons("tg", "Tags danificadas:", BK(dv.tagsValor), {cor:"text-red-400"}),
      acertoForm.pagamentos.length>pagsTopo.length && e("p",{key:"mais", className:"text-[10.5px] text-[#8E8E93]"}, "+ "+(acertoForm.pagamentos.length-pagsTopo.length)+" pagamento(s) anterior(es)"),
      pagsTopo.map(function(x){ return linhaCons("p"+x.n, "Pag. "+x.n+":", BK(x.p.valor)+" "+rotPag(x.p), {cor:"text-red-400", rotCor:"text-red-400/80", peq:true}); }),
      linhaCons("r", e("span",null,"Valor restante:", restanteTotal<=0.009 && e("span",{className:"ml-1.5 text-[10.5px] font-semibold text-emerald-300"},"✓ acerto quitado")), restanteTotal>0.009 ? BK(restanteTotal) : "R$ 0,00", {topo:true, cor:restanteTotal>0.009 ? "text-amber-200" : "text-emerald-300", rotCor:"text-[#E5E5EA]"}))));

  // Payload único do acerto (usado na assinatura)
  var payloadAcerto = function(extra){
    return Object.assign({type:"ACERTO_REGISTRAR", id:kitSel.id, vendaBruta:dv.vendaEfetiva!=null ? dv.vendaEfetiva : acertoForm.vendaBruta, vendaDigitada:acertoForm.vendaBruta, trocas:acertoForm.trocas||[], tagsDanificadas:acertoForm.tagsDanificadas||0, tagsValor:dv.tagsValor, devolvida:0, garantia:acertoForm.garantia||0,
      valorPago: acordoValido ? previaBase.valorDevido : totalPagoAtual, pagamentos:acertoForm.pagamentos, acordo: acordoExistente ? acertoForm.acordoParcelas : null,
      recusouNegociar:acertoForm.recusouNegociar, brindesLancados:acertoForm.brindes, excedenteBrinde:excedenteBrinde,
      pecasVendidas:acertoForm.pecasVendidas, pecasBrinde:acertoForm.brindes.length, pecasTrocas:(acertoForm.trocas||[]).length,
      pecasADevolver:pecasADevolver, condicionaisSelecionadas:acertoForm.condicionaisSelecionadas,
      modalidade:modalidadeKit, atrasoDias:(ehPrata || dv.novas) ? (acertoForm.atrasoDias||0) : 0, diasQuitacao:acertoForm.diasQuitacao||0,
      pecasProxCodigos:acertoForm.pecasProxCodigos||[], pecasProxLiberadas:dv.pecasProx ? dv.pecasProx.liberadas : 0, kitNovoOk:!!acertoForm.kitNovoOk, expositoresMarcados:acertoForm.expositoresMarcados||[],
      pecasCond:pecasCondSelecionadas, formSnapshot:acertoForm}, extra||{});
  };

  var calcAcertoScreen = kitSel && e("div",{className:"flex flex-col gap-2.5"},
    blocoAcordeao(0, "lista", "#CA8A04", "Condicionais",
      acertoForm.condicionaisSelecionadas.length ? acertoForm.condicionaisSelecionadas.length+" marcada(s) · "+pecasCondSelecionadas+" peças" : "Marque as condicionais em aberto conferidas",
      acertoForm.condicionaisSelecionadas.length ? badgeTxt(pecasCondSelecionadas+" peças","#CA8A04") : badgeTxt("Pendente","#64748B"),
      [condicionaisRev.length===0
        ? e("p",{key:"c0", className:"text-[13px] text-[#8E8E93]"},"Nenhuma condicional em aberto cadastrada para essa revendedora.")
        : e("div",{key:"c1", className:"flex flex-col gap-1.5"}, condicionaisRev.map(function(c){ var on = acertoForm.condicionaisSelecionadas.indexOf(c.numero)>=0;
            return e("label",{key:c.numero, className:"flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 "+(on?"bg-amber-200/15":"bg-white/5")},
              e("span",{className:"flex items-center gap-2 text-[13px]"},
                e("input",{type:"checkbox", checked:on, onChange:function(){ toggleCondicional(c.numero); }}),
                "Condicional "+c.numero),
              e("span",{className:MONO+" text-[12.5px] text-[#8E8E93]"}, c.pecas+" peças")); })),
        e("div",{key:"cm", className:"flex flex-col gap-1.5 rounded-xl bg-white/5 p-2.5"},
          e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]"}, condicionaisRev.length===0 ? "Não tem condicional cadastrada? Adicione à mão" : "Adicionar outra condicional à mão"),
          e("div",{className:"flex items-center gap-1.5"},
            e("input",{value:condManual.numero, inputMode:"numeric", placeholder:"Nº da condicional", "aria-label":"Número da condicional", onChange:function(ev){ setCondManual(Object.assign({}, condManual, {numero:ev.target.value.replace(/[^0-9]/g,"").slice(0,8)})); },
              className:"h-10 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-[14px] text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("input",{value:condManual.pecas, inputMode:"numeric", placeholder:"Peças", "aria-label":"Quantidade de peças", onChange:function(ev){ setCondManual(Object.assign({}, condManual, {pecas:ev.target.value.replace(/[^0-9]/g,"").slice(0,4)})); },
              className:"h-10 w-[4.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-center text-[14px] text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("button",{disabled:!condManual.numero || !(+condManual.pecas>0), onClick:function(){ d({type:"REV_COND_ADD", rev:sel.rev, numero:condManual.numero, pecas:+condManual.pecas});
              setAcertoForm(Object.assign({}, acertoForm, {condicionaisSelecionadas:acertoForm.condicionaisSelecionadas.concat([condManual.numero])})); setCondManual({numero:"", pecas:""}); },
              className:"h-10 shrink-0 rounded-lg px-3 text-[12px] font-bold disabled:opacity-40 "+BR2, style:{background:"#C9A13B"}}, "Adicionar"))),
        expositoresRev.length>0 && e("div",{key:"cx", className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"},
          e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Expositores com a revendedora"),
          expositoresRev.map(function(x){ var on = (acertoForm.expositoresMarcados||[]).indexOf(x.id)>=0;
            return e("label",{key:x.id, className:"flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 "+(on?"bg-amber-200/15":"bg-white/5")},
              e("span",{className:"flex items-center gap-2 text-[13px]"}, e("input",{type:"checkbox", checked:on, onChange:function(){
                var m = acertoForm.expositoresMarcados||[]; setAcertoForm(Object.assign({}, acertoForm, {expositoresMarcados: on ? m.filter(function(i){return i!==x.id;}) : m.concat([x.id])})); }}), x.qtd+" "+x.nome.toLowerCase()),
              e("span",{className:"text-[11px] text-[#8E8E93]"}, on ? "conferido" : "com ela")); })),
        e("p",{key:"c2", className:"border-t border-white/10 pt-2 text-[13px] font-semibold text-amber-200"},"Total conferido: "+pecasCondSelecionadas+" peças"),
        e("div",{key:"c3", className:"flex items-center justify-between gap-2 text-[13px]"},
          e("span",{className:"font-semibold"},"Total de peças vendidas"),
          e("input",{inputMode:"numeric", value:acertoForm.pecasVendidas==null ? "" : acertoForm.pecasVendidas, placeholder:"0", "aria-label":"Total de peças vendidas",
            onChange:function(ev){ var n = ev.target.value.replace(/D/g,""); setAcertoForm(Object.assign({}, acertoForm, {pecasVendidas:n ? Number(n) : null})); },
            className:"h-9 w-24 rounded-lg bg-black/50 px-2 text-right text-[14px] font-bold text-white outline-none ring-1 ring-white/10"}))]),
    blocoAcordeao(1, "calendario", "#7C3AED", "Multa por remarcação",
      (kitSel.remarcacoesLista||[]).length ? (kitSel.remarcacoesLista.length)+" remarcação(ões) · "+vezCobravel(kitSel.remarcacoesLista)+" com multa" : "Nenhuma remarcação neste kit",
      badgeTxt((kitSel.remarcacoesLista||[]).length ? String(kitSel.remarcacoesLista.length) : "—", (kitSel.remarcacoesLista||[]).length ? "#7C3AED" : "#374151"),
      [(ehPrata || dv.novas) && e("div",{key:"atraso", className:"flex items-center justify-between gap-2 rounded-xl bg-red-500/10 px-2.5 py-2 ring-1 ring-red-500/20"},
        e("span",{className:"text-[12.5px] font-semibold text-red-300"}, dv.novas ? "Dias de atraso do acerto" : "Dias de atraso (−"+(versaoSel.gerais.atrasoPctDia||1)+"% de comissão por dia)"),
        e("div",{className:"flex items-center gap-2"},
          e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {atrasoDias:Math.max(0,(acertoForm.atrasoDias||0)-1)})); }, "aria-label":"Menos um dia", className:"size-8 rounded-lg bg-white/10 font-bold"},"−"),
          e("b",{className:MONO+" w-6 text-center text-[15px]"}, acertoForm.atrasoDias||0),
          e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {atrasoDias:(acertoForm.atrasoDias||0)+1})); }, "aria-label":"Mais um dia", className:"size-8 rounded-lg bg-white/10 font-bold"},"+"))),
      dv.novas && previaAcerto && (acertoForm.atrasoDias||0)>0 && e("p",{key:"atraso2", className:"text-[12px] "+(previaAcerto.juridico ? "font-bold text-red-400" : "text-[#C4B5FD]")},
        previaAcerto.juridico ? "60 dias ou mais: perde toda a comissão e todo o brinde. Vai para o jurídico (nota promissória)."
          : "Atraso de "+acertoForm.atrasoDias+" dia(s): perde "+previaAcerto.atrasoPct+"% da comissão e "+(previaAcerto.atrasoBrindePct||0)+"% do brinde."),
      dv.novas && previaAcerto && dv.faltaAtual>0.009 && e("div",{key:"quit", className:"flex flex-col gap-1.5 rounded-xl bg-amber-400/10 px-2.5 py-2 ring-1 ring-amber-400/20"},
        e("div",{className:"flex items-center justify-between gap-2"},
          e("span",{className:"text-[12.5px] font-semibold text-amber-200"},"Dias com valor pendente (prazo "+((dv.versao.novas||{}).prazoQuitarDias||15)+")"),
          e("div",{className:"flex items-center gap-2"},
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {diasQuitacao:Math.max(0,(acertoForm.diasQuitacao||0)-1)})); }, "aria-label":"Menos um dia", className:"size-8 rounded-lg bg-white/10 font-bold"},"−"),
            e("b",{className:MONO+" w-6 text-center text-[15px]"}, acertoForm.diasQuitacao||0),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {diasQuitacao:(acertoForm.diasQuitacao||0)+1})); }, "aria-label":"Mais um dia", className:"size-8 rounded-lg bg-white/10 font-bold"},"+"))),
        e("p",{className:"text-[11.5px] leading-snug text-[#B5B5BA]"}, "Pendente de "+BK(previaAcerto.pendente)+": multa de "+BK(previaAcerto.multaPendente)+(previaAcerto.multaAtrasoQuitacao>0 ? " + "+BK(previaAcerto.multaAtrasoQuitacao)+" de atraso" : "")+". Próximo kit só depois de quitar.")),
      regEscolha===null && e("button",{key:"r1", onClick:function(){ setRegEscolha("escolher"); }, className:"h-9 w-full rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#7C3AED"}},
        "+ Registrar remarcação"),
      regEscolha==="escolher" && e("div",{key:"r1a", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
        e("p",{className:"text-center text-[12px] font-semibold text-[#C4B5FD]"},"Essa remarcação é isenta de multa?"),
        e("div",{className:"flex gap-2"},
          e("button",{onClick:function(){ d({type:"KIT_REMARCAR", id:kitSel.id, isenta:false}); setRegEscolha(null); },
            className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#DC2626"}}, "Com multa"),
          e("button",{onClick:function(){ setRegEscolha("isenta"); }, className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#16A34A"}}, "Isenta de multa")),
        e("button",{onClick:function(){ setRegEscolha(null); }, className:"h-7 w-full rounded-lg text-[11.5px] font-semibold text-[#8E8E93]"}, "‹ Cancelar")),
      regEscolha==="isenta" && e("div",{key:"r1b", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
          e("p",{className:"text-[12px] font-semibold text-[#C4B5FD]"},"Motivo da isenção"),
          e("input",{autoFocus:true, value:acertoForm.motivoProxRemarcacao, placeholder:"Ex.: falecimento na família",
            onChange:function(ev){ setAcertoForm(Object.assign({}, acertoForm, {motivoProxRemarcacao:ev.target.value})); },
            className:campo+" w-full"}),
          e("div",{className:"flex gap-2"},
            e("button",{onClick:function(){ setRegEscolha("escolher"); setAcertoForm(Object.assign({}, acertoForm, {motivoProxRemarcacao:""})); },
              className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#374151"}}, "‹ Voltar"),
            e("button",{disabled:!acertoForm.motivoProxRemarcacao.trim(), onClick:function(){
                d({type:"KIT_REMARCAR", id:kitSel.id, isenta:true, motivo:acertoForm.motivoProxRemarcacao.trim()});
                setAcertoForm(Object.assign({}, acertoForm, {motivoProxRemarcacao:""})); setRegEscolha(null); },
              className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold disabled:opacity-40 "+BR2, style:{background:"#7C3AED"}}, "Confirmar isenção"))),
      (kitSel.remarcacoesLista||[]).length>0 && e("div",{key:"rlist", className:"flex flex-col gap-1.5 border-t border-white/10 pt-2"},
        kitSel.remarcacoesLista.map(function(r,i){ return e("div",{key:i,
            className:"flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 "+(r.isenta?"bg-emerald-500/10":"bg-red-500/10")},
          e("span",{className:"text-[12.5px] font-semibold "+(r.isenta?"text-emerald-300":"text-red-400")},
            (i+1)+"ª remarcação: "+(r.isenta ? "isenta"+(r.motivo?" ("+r.motivo+")":"") : "com multa")),
          e("button",{onClick:function(){ d({type:"KIT_REMARCAR_REMOVER", id:kitSel.id, indice:i}); }, "aria-label":"Remover "+(i+1)+"ª remarcação",
            className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70 hover:bg-white/20"}, "×")); })),
      previaAcerto && (previaAcerto.descontoRemarcacao.comissaoPct>0 || previaAcerto.descontoRemarcacao.brindePct>0) && e("p",{key:"r2", className:"border-t border-white/10 pt-2 text-[12.5px] font-bold text-red-400"},
        "Resultado: comissão −"+previaAcerto.descontoRemarcacao.comissaoPct+"%"+(previaAcerto.descontoRemarcacao.brindePct>0 ? " · brinde −"+previaAcerto.descontoRemarcacao.brindePct+"%" : ""))]),
    blocoAcordeao(2, "star", "#D97706", "Crédito de garantia",
      acertoForm.garantia>0 ? "Desconto de "+BK(acertoForm.garantia)+" na venda" : "Sem desconto de garantia",
      acertoForm.garantia>0 ? checkOk : badgeTxt("—","#374151"),
      [e("div",{key:"g1"},
        e("p",{className:"mb-1 text-[12px] text-[#8E8E93]"},"Valor de garantia a descontar da venda"),
        e(CampoDinheiro,{value:acertoForm.garantia, label:"Crédito de garantia", onChange:function(v){ setAcertoForm(Object.assign({}, acertoForm, {garantia:v||0})); }, className:campoGrande}))]),
    blocoAcordeao(8, "undo", "#EA580C", "Trocas",
      (acertoForm.trocas||[]).length ? acertoForm.trocas.length+" troca(s) · "+(dv.trocasAjuste>=0 ? "soma " : "desconta ")+BK(Math.abs(dv.trocasAjuste))+" na venda" : "Peça quebrada trocada por outra",
      (acertoForm.trocas||[]).length ? badgeTxt(String(acertoForm.trocas.length),"#EA580C") : badgeTxt("—","#374151"),
      [(acertoForm.trocas||[]).map(function(t,i){ var aj = t.tipo==="anterior" ? (t.novaValor||0)-(t.antigaValor||0) : (t.novaValor||0);
        return e("div",{key:"t"+i, className:"flex flex-col gap-1 rounded-xl bg-white/5 px-2.5 py-2"},
          e("div",{className:"flex items-center justify-between gap-2"},
            e("span",{className:"rounded-full px-2 py-px text-[10px] font-bold uppercase "+(t.tipo==="anterior" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#FFEDD5] text-[#C2410C]")}, t.tipo==="anterior" ? "Outro mês · já paga" : "Deste kit"),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {trocas:acertoForm.trocas.filter(function(y,j){return j!==i;})})); }, "aria-label":"Remover troca", className:"grid size-6 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70"}, "×")),
          e("p",{className:"text-[12.5px]"}, "Volta quebrada ", e("b",{className:MONO}, t.antigaCod), " "+BK(t.antigaValor)+" → ficou ", e("b",{className:MONO}, t.novaCod), " "+BK(t.novaValor)),
          e("p",{className:"text-[12px] font-bold "+(aj>=0 ? "text-amber-200" : "text-emerald-300")}, (aj>=0 ? "Soma " : "Desconta ")+BK(Math.abs(aj))+" na venda")); }),
      e("div",{key:"tf", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
        e("div",{className:"grid grid-cols-2 gap-1.5"}, [["mes","Peça deste kit","quebrou neste mês","bg-[#EA580C] txt-branco ring-transparent"],["anterior","Peça de outro mês","já foi paga","bg-[#2563EB] txt-branco ring-transparent"]].map(function(o){ var on = trocaIn.tipo===o[0];
          return e("button",{key:o[0], onClick:function(){ setTrocaIn(Object.assign({}, trocaIn, {tipo:o[0]})); }, "aria-pressed":on,
            className:"flex h-10 flex-col items-center justify-center rounded-lg text-[12px] font-bold leading-tight ring-1 "+(on ? o[3] : "bg-[#F1F2F4] ring-[#E5E7EB] text-[#6B7280]")},
            e("span",null,(on?"✓ ":"")+o[1]), e("span",{className:"text-[9.5px] font-medium opacity-80"}, o[2])); })),
        e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Peça que voltou quebrada"),
        e("div",{className:"flex gap-1.5"},
          e("input",{value:trocaIn.antigaCod, placeholder:"AB123", autoCapitalize:"characters", "aria-label":"Código da peça quebrada", onChange:function(ev){ setTrocaIn(Object.assign({}, trocaIn, {antigaCod:limitarCodigo(ev.target.value)})); },
            className:"h-10 w-[6.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-[14px] font-semibold text-white outline-none ring-1 ring-white/10 "+MONO+" uppercase"}),
          e(CampoReais,{value:trocaIn.antigaValor, label:"Valor da peça quebrada", onChange:function(v){ setTrocaIn(Object.assign({}, trocaIn, {antigaValor:v})); }, className:"h-10 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-right text-[14px] text-white outline-none ring-1 ring-white/10 "+MONO})),
        e("p",{className:"text-[11px] font-bold uppercase tracking-wide text-[#8E8E93]"},"Peça nova que ela ficou"),
        e("div",{className:"flex gap-1.5"},
          e("input",{value:trocaIn.novaCod, placeholder:"AB123", autoCapitalize:"characters", "aria-label":"Código da peça nova", onChange:function(ev){ setTrocaIn(Object.assign({}, trocaIn, {novaCod:limitarCodigo(ev.target.value)})); },
            className:"h-10 w-[6.2rem] shrink-0 rounded-lg bg-black/50 px-2 text-[14px] font-semibold text-white outline-none ring-1 ring-white/10 "+MONO+" uppercase"}),
          e(CampoReais,{value:trocaIn.novaValor, label:"Valor da peça nova", onChange:function(v){ setTrocaIn(Object.assign({}, trocaIn, {novaValor:v})); }, className:"h-10 min-w-0 flex-1 rounded-lg bg-black/50 px-2 text-right text-[14px] text-white outline-none ring-1 ring-white/10 "+MONO}),
          e("button",{disabled:!(trocaIn.tipo && codigoPecaValido(trocaIn.antigaCod) && codigoPecaValido(trocaIn.novaCod) && trocaIn.antigaValor>0 && trocaIn.novaValor>0),
            onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {trocas:(acertoForm.trocas||[]).concat([trocaIn])})); setTrocaIn(TROCA_VAZIA); },
            className:"h-10 shrink-0 rounded-lg px-2.5 text-[12px] font-bold disabled:opacity-40 "+BR2, style:{background:"#EA580C"}}, "Lançar")),
        e("p",{className:"text-[11.5px] text-[#8E8E93]"}, trocaIn.tipo==="anterior" ? "Peça de outro mês já foi paga: entra na venda só a diferença (nova − quebrada). Se a nova for mais barata, desconta." : "Peça deste kit: a peça nova entra na venda pelo valor cheio e a quebrada volta para a empresa."))]),
    blocoAcordeao(3, "grafico", "#2563EB", "Vendas e pagamentos",
      !previaBase ? "Preencha o valor vendido" : quitado ? BK(acertoForm.vendaBruta)+" · quitado" : BK(acertoForm.vendaBruta)+" · restante "+BK(restanteTotal),
      !previaBase ? badgeTxt("Pendente","#64748B") : quitado ? checkOk : acertoForm.recusouNegociar ? badgeTxt("Sem acordo","#DC2626") : acordoValido ? badgeTxt("Acordo","#7C3AED") : badgeTxt(BK(restanteTotal),"#D97706"),
      [e("div",{key:"v1"},
        e("p",{className:"mb-1 text-[12px] text-[#8E8E93]"},"Valor total vendido"),
        e(CampoDinheiro,{value:acertoForm.vendaBruta, mostraZero:true, label:"Valor total vendido", onChange:function(v){ setAcertoForm(Object.assign({}, acertoForm, {vendaBruta:v})); }, className:campoGrande})),
      dv.trocasAjuste!==0 && e("p",{key:"vtr", className:"text-[12.5px] font-semibold "+(dv.trocasAjuste>0 ? "text-amber-200" : "text-emerald-300")}, "Trocas "+(dv.trocasAjuste>0 ? "somam " : "descontam ")+BK(Math.abs(dv.trocasAjuste))+" na venda · venda com trocas "+BK(dv.vendaEfetiva||0)),
      e("div",{key:"tags", className:"flex items-center justify-between gap-2 rounded-xl bg-white/5 px-2.5 py-1.5"},
        e("span",{className:"min-w-0 text-[12.5px]"}, "Tags riscadas ou perdidas ", e("span",{className:"text-[#8E8E93]"}, "("+BK(dv.valorTag)+" cada · soma no pagamento)")),
        e("div",{className:"flex shrink-0 items-center gap-1.5"},
          e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {tagsDanificadas:Math.max(0,(acertoForm.tagsDanificadas||0)-1)})); }, "aria-label":"Menos uma tag", className:"size-7 rounded-lg bg-white/10 font-bold"},"−"),
          e("b",{className:MONO+" w-5 text-center text-[14px]"}, acertoForm.tagsDanificadas||0),
          e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {tagsDanificadas:(acertoForm.tagsDanificadas||0)+1})); }, "aria-label":"Mais uma tag", className:"size-7 rounded-lg bg-white/10 font-bold"},"+"))),
      previaAcerto && previaAcerto.semFaixa && e("p",{key:"v4", className:"text-[12.5px] font-semibold text-amber-200"},
        "Abaixo de "+BK(versaoSel.gerais.minRenovar)+" de venda líquida não existe faixa: a comissão é zero."),
      previaAcerto && previaAcerto.taxaDeslocamento>0 && e("p",{key:"v5", className:"text-[12.5px] text-[#8E8E93]"},
        "Venda abaixo de "+BK(versaoSel.gerais.taxaAbaixoDe)+": taxa de deslocamento de "+BK(previaAcerto.taxaDeslocamento)+" soma no que ela paga."),
      !previaBase ? null : e(React.Fragment,{key:"pg"},
          // 3 colunas que somam no total: valor do acerto + taxa de deslocamento + excedente de brinde ("—" quando não tem)
          e("div",{key:"dev3", className:"grid grid-cols-4 gap-1 border-t border-white/10 pt-2"},
            [["Acerto", previaAcerto.valorAcerto, "text-amber-200"], ["Taxa", previaAcerto.taxaDeslocamento, "text-amber-300"], ["Brinde a mais", excedenteBrinde, "text-red-400"], ["Tags", dv.tagsValor, "text-red-400"]].map(function(c){
              return e("div",{key:c[0], className:"flex flex-col items-center gap-0.5 rounded-xl bg-white/5 px-1 py-1.5"},
                e("span",{className:"text-[9.5px] font-semibold uppercase tracking-wide text-[#8E8E93]"}, c[0]),
                e("b",{className:MONO+" text-[11.5px] "+(c[1]>0 ? c[2] : "text-[#8E8E93]")}, c[1]>0 ? BK(c[1]) : "—")); })),
          e("div",{key:"dev", className:"flex items-center justify-between gap-2 pt-1 text-[13px] font-bold"},
            e("span",null,"Total a pagar"), e("span",{className:MONO}, BK(totalAPagar))),
          e(LinksDoAcerto,{key:"lkacerto", rev:sel.rev, pagamentos:acertoForm.pagamentos, falta:faltaAtual, formasLink:formaDe("link").descricoes, onUsar:function(lin){ setAcertoForm(Object.assign({}, acertoForm, {pagamentos:acertoForm.pagamentos.concat([lin])})); }}),
          acertoForm.pagamentos.length>0 && e("div",{key:"lanc0", className:"flex flex-col gap-1.5"},
            acertoForm.pagamentos.map(function(p,i){ return e("div",{key:i,
                className:"flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5"},
              e("div",{className:"min-w-0 flex-1"},
                e("p",{className:"truncate text-[12.5px] font-semibold "+BR}, "Pag. "+(i+1)+" · "+rotPag(p)),
                e("p",{className:"text-[11px] text-[#8E8E93]"}, formaDe(p.forma).label+" · "+p.data.split("-").reverse().join("/")+(p.jaPagoLink ? " · já pago por link" : "")+(p.anexo ? " · 📎 "+p.anexo.nome : "")),
                estPag(p) && (estPag(p).aguardando
                  ? e("p",{className:"text-[11px] font-semibold text-amber-300"}, "⏳ Conta solicitada, aguardando (pode seguir)")
                  : e("p",{className:"text-[11px] font-semibold text-emerald-300"}, (estPag(p).pago ? "✓ Já pago · " : "✓ Conta: ")+estPag(p).conta))),
              e("span",{className:MONO+" shrink-0 text-[13px] font-bold text-emerald-300"}, BK(p.valor)),
              e("button",{onClick:function(){ if(p.pid && kitSel) d({type:"REP_PAG", op:"remover", kitId:kitSel.id, pid:p.pid});
                  setAcertoForm(Object.assign({}, acertoForm, {pagamentos:acertoForm.pagamentos.filter(function(x,j){return j!==i;})})); },
                "aria-label":"Remover lançamento", className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70 hover:bg-white/20"}, "×")); })),
          !lancAberto ? e("button",{key:"lanc1", onClick:function(){ setLancAberto(true); }, className:"h-9 w-full rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#DB2777"}}, "+ Lançar pagamento")
            : e("div",{key:"lanc2", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
                e("select",{value:lancForm.forma, onChange:function(ev){ setLancForm(Object.assign({}, LANC_VAZIO, {forma:ev.target.value, valor:lancForm.valor})); },
                    className:campo+" w-full"},
                  e("option",{value:""},"Selecione..."),
                  formas.map(function(f){ return e("option",{key:f.k, value:f.k}, f.label); })),
                lancForm.forma && pedeConta(lancForm.forma) && e("p",{className:"rounded-lg bg-white/5 px-2.5 py-1.5 text-[11.5px] leading-snug text-[#B5B5BA]"},
                  "Informe só o valor. A conta é solicitada ao financeiro em seguida; você não precisa esperar, siga com os brindes e o resto do acerto."),
                lancForm.forma && formaDe(lancForm.forma).parcelas && e("div",{className:"flex items-center justify-between gap-2 text-[12px] text-[#8E8E93]"},
                  e("span",null,"Parcelas"),
                  e("select",{value:lancForm.parcelas, onChange:function(ev){ setLancForm(Object.assign({}, lancForm, {parcelas:Number(ev.target.value)})); },
                      className:campo+" w-20"},
                    PARCELAS_CARTAO.filter(function(n){ var pm = versaoSel && versaoSel.gerais.parcelaMinimaCredito; return !pm || n===1 || !(lancForm.valor>0) || lancForm.valor/n>=pm-0.001; })
                      .map(function(n){ return e("option",{key:n, value:n}, n+"x"); }))),
                lancForm.forma && formaDe(lancForm.forma).parcelas && versaoSel && versaoSel.gerais.parcelaMinimaCredito>0 && e("p",{className:"-mt-1 text-[11px] text-slate-300"},
                  "Kit 100% Prata: crédito em até 6x sem juros, parcela mínima de "+BK(versaoSel.gerais.parcelaMinimaCredito)+"."),
                e("div",{className:"flex items-center justify-between gap-2 text-[12px] text-[#8E8E93]"},
                  e("span",null,"Data do pagamento"),
                  e("input",{type:"date", value:lancForm.data, onChange:function(ev){ setLancForm(Object.assign({}, lancForm, {data:ev.target.value})); },
                    className:campo+" [color-scheme:dark]"})),
                e("div",{className:"flex items-center gap-2"},
                e(CampoDinheiro,{value:lancForm.valor, label:"Valor do pagamento", onChange:function(v){ setLancForm(Object.assign({}, lancForm, {valor:v})); }, className:"h-11 min-w-0 flex-1 rounded-xl bg-black/50 px-3 text-left text-[15px] font-semibold text-white outline-none ring-1 ring-white/10"}),
                e("label",{className:"flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-between gap-1.5 rounded-xl bg-black/40 px-2.5 text-[12px] text-[#8E8E93] ring-1 ring-white/10"},
                  e("span",{className:"min-w-0 truncate"}, lancForm.anexo ? "📎 "+lancForm.anexo.nome : "Comprovante"),
                  e("span",{className:"shrink-0 rounded-md bg-white/10 px-2 py-1 font-bold text-white"}, lancForm.anexo ? "Trocar" : "Anexar"),
                  e("input",{type:"file", accept:"application/pdf,image/*", className:"hidden", onChange:function(ev){ var fl = ev.target.files && ev.target.files[0]; if(!fl) return;
                    if(fl.size>400000){ setLancForm(Object.assign({}, lancForm, {anexo:{nome:fl.name, tipo:fl.type, dados:null, tamanho:fl.size}})); return; }
                    var rd = new FileReader(); rd.onload = function(){ setLancForm(function(f0){ return Object.assign({}, f0, {anexo:{nome:fl.name, tipo:fl.type, dados:rd.result, tamanho:fl.size}}); }); }; rd.readAsDataURL(fl); }}))),
                e("div",{className:"flex gap-2"},
                  e("button",{onClick:function(){ setLancAberto(false); setLancForm(LANC_VAZIO); },
                    className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#374151"}}, "‹ Cancelar"),
                  e("button",{disabled:!(lancForm.forma && lancForm.data && lancForm.valor>0), onClick:function(){
                      var pedir = pedeConta(lancForm.forma), pid = pedir ? "p"+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36) : null;
                      var novoPag = Object.assign({}, lancForm, pedir ? {descricao:"", pid:pid} : {descricao:(formaDe(lancForm.forma).descricoes||[])[0] || formaDe(lancForm.forma).label});   // dinheiro, loja e Pix representante não pedem conta
                      if(pedir && kitSel) d({type:"REP_PAG", op:"pedir", kitId:kitSel.id, rev:sel.rev, rep:l.rep, pid:pid, forma:lancForm.forma, valor:lancForm.valor, parcelas:lancForm.parcelas||1, data:lancForm.data, anexo:lancForm.anexo});
                      setAcertoForm(Object.assign({}, acertoForm, {pagamentos:acertoForm.pagamentos.concat([novoPag])}));
                      if(totalPagoAtual+lancForm.valor >= previaBase.valorDevido-0.009) setBlocoAberto(4);   // acerto quitado: abre os brindes
                      setLancAberto(false); setLancForm(LANC_VAZIO); },
                    className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold disabled:opacity-40 "+BR2, style:{background:"#DB2777"}}, "Lançar pagamento"))),
          e("div",{key:"tot", className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[13px] font-bold"},
            e("span",null,"Total pago"), e("span",{className:MONO}, BK(totalPagoAtual))),
          !quitado && e("div",{key:"falta", className:"flex items-center justify-between gap-2 text-[13px] font-bold"},
            e("span",{className:"text-amber-200"},"Falta do acerto · em aberto "+N1(previaBase.pctFaltante)+"%"), e("span",{className:MONO+" text-amber-200"}, BK(faltaAtual))),
          !quitado && !acordoExistente && !negociarAberto && !acertoForm.recusouNegociar && e("div",{key:"neg0", className:"flex gap-2"},
            e("button",{onClick:function(){ setNegociarAberto(true);
                if(!acertoForm.acordoParcelas.length) setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[{data:isoDia(new Date()), valor:null}]})); },
                className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#7C3AED"}}, "Negociar o que falta"),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {recusouNegociar:true})); setBlocoAberto(4); },
                className:"h-9 flex-1 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#DC2626"}}, "Não quis negociar")),
          acertoForm.recusouNegociar && e("div",{key:"recusou", className:"flex flex-col gap-1.5 rounded-xl bg-red-500/10 p-2.5 ring-1 ring-red-500/30"},
            e("p",{className:"text-[13px] font-bold text-red-400"},"Brinde bloqueado. Revendedora não quis negociar o valor em aberto."),
            e("p",{className:"text-[12px] text-red-400/90"},"Sem brinde. Nota promissória será executada em 48h úteis."),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {recusouNegociar:false})); },
              className:"h-7 w-full rounded-lg text-[11.5px] font-semibold text-[#8E8E93]"}, "Desfazer")),
          (negociarAberto || acordoExistente) && e("div",{key:"neg1", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
            e("div",{className:"flex items-center justify-between gap-2"},
              e("p",{className:"text-[12px] font-semibold text-[#C4B5FD]"},"Parcelas negociadas"),
              e("button",{onClick:function(){ setNegociarAberto(false); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[], acordoSalvo:false})); },
                "aria-label":"Fechar negociação", className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-bold text-white/70"}, "×")),
            acertoForm.acordoParcelas.map(function(p,i){ return e("div",{key:i, className:"flex items-center gap-2"},
              e("span",{className:"w-16 shrink-0 text-[11.5px] text-[#8E8E93]"}, "Parcela "+(i+1)),
              e("input",{type:"date", value:p.data, onChange:function(ev){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {data:ev.target.value}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); },
                className:"h-8 flex-1 rounded-lg bg-black/50 px-2 text-[12.5px] text-white outline-none ring-1 ring-white/10 [color-scheme:dark]"}),
              e(CampoDinheiro,{value:p.valor, label:"Valor da parcela", onChange:function(v){ var o = acertoForm.acordoParcelas.slice(); o[i] = Object.assign({}, o[i], {valor:v}); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:o, acordoSalvo:false})); },
                className:"h-8 w-28 rounded-lg bg-black/50 px-2 text-right text-[12.5px] text-white outline-none ring-1 ring-white/10"})); }),
            e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:acertoForm.acordoParcelas.concat([{data:isoDia(new Date()), valor:null}])})); },
              className:"h-8 w-full rounded-lg text-[12px] font-semibold text-[#C4B5FD]"}, "+ Adicionar parcela"),
            e("div",{className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[12.5px]"},
              e("span",null,"Soma das parcelas / Falta cobrir"),
              e("span",{className:MONO+" font-bold "+(Math.abs(acordoSoma-faltaAtual)<=0.01?"text-emerald-300":"text-rose-300")}, BK(acordoSoma)+" / "+BK(faltaAtual))),
            e("button",{onClick:function(){
                var validas = acertoForm.acordoParcelas.filter(function(p){return p.data && p.valor>0;});
                var soma = validas.reduce(function(t,p){return t+p.valor;},0);
                setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:validas, acordoSalvo:validas.length>0}));
                if(validas.length && Math.abs(soma-faltaAtual)<=0.01) setBlocoAberto(4);   // negociação fechou o valor: abre os brindes
              }, className:"h-9 w-full rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#7C3AED"}}, "Salvar acordo"),
            acertoForm.acordoSalvo && e("p",{className:"text-[11.5px] text-[#C4B5FD]"}, "Acordo salvo com "+acertoForm.acordoParcelas.length+" parcela(s). As parcelas precisam fechar exatamente o valor que falta para liberar brinde."),
            acertoForm.acordoSalvo && e("p",{className:"text-[11px] text-[#8E8E93]"}, "Sem conta a receber."),
            e("button",{onClick:function(){ setNegociarAberto(false); setAcertoForm(Object.assign({}, acertoForm, {acordoParcelas:[], acordoSalvo:false})); },
              className:"h-8 w-full rounded-lg text-[11.5px] font-semibold text-rose-300"}, "Remover acordo")),
          quitado && acordoExistente && e("p",{key:"avisoQuitado", className:"text-[12.5px] font-semibold text-rose-400"},
            "O acerto já está quitado, mas ainda existe um acordo salvo. Remova o acordo para não gerar cobrança indevida."),
          acordoValido && e("p",{key:"acordoOk", className:"text-[12px] text-emerald-300"}, "Acordo cobre o valor que falta: brinde liberado."))]),
    blocoAcordeao(4, "presente", "#DB2777", "Brindes",
      !previaAcerto ? "Disponível a partir de "+BK(faixaMinBrinde===Infinity?500:faixaMinBrinde)
        : brindeBloqueio ? brindeBloqueio.curto
        : acertoForm.brindes.length ? acertoForm.brindes.length+" peça(s) · "+(excedenteBrinde>0 ? "Excedente "+BK(excedenteBrinde) : "Normal "+BK(confBrinde.restanteNormal))
        : "Normal "+BK(libN)+" · Select "+BK(libS),
      !previaAcerto ? badgeTxt("—","#374151") : brindeBloqueio ? badgeTxt("Bloqueado","#DC2626") : excedenteBrinde>0 ? badgeTxt("Excedente","#F59E0B") : pagamentoParcial ? badgeTxt(N1(previaAcerto.fatorPagamento*100)+"%","#D97706") : checkOk,
      [!previaAcerto ? e("p",{key:"b0", className:"text-[13px] text-[#8E8E93]"},"Preencha as vendas e os pagamentos para ver os brindes.")
        : brindeBloqueio ? e("div",{key:"bl", className:"flex flex-col gap-1.5 rounded-xl bg-red-500/10 p-2.5 ring-1 ring-red-500/30"},
            e("p",{className:"text-[13px] font-bold text-red-400"},"Brinde bloqueado."),
            e("p",{className:"text-[12.5px] text-red-400/90"}, brindeBloqueio.frase),
            faltaAtual>0.009 && e("div",{className:"mt-1 flex flex-col gap-0.5 border-t border-red-500/20 pt-1.5 text-[12.5px] font-semibold text-red-300"},
              e("p",null,"Falta do acerto: "+BK(faltaAtual)), e("p",null,"Em aberto: "+N1(previaAcerto.pctFaltante)+"%")))
        : e(React.Fragment,{key:"br"},
            (previaAcerto.descontoRemarcacao.brindePct>0 || previaAcerto.fatorPagamento<1) && e("p",{key:"bdesc", className:"text-[11.5px] text-amber-200"},
              "Valores já com desconto, proporcional em Normal e Select"+(previaAcerto.descontoRemarcacao.brindePct>0 ? " · remarcação −"+previaAcerto.descontoRemarcacao.brindePct+"%" : "")
              +(previaAcerto.fatorPagamento<1 ? " · faltou "+N1(previaAcerto.pctFaltante)+"% do pagamento ("+N1(previaAcerto.fatorPagamento*100)+"% do brinde)" : "")+"."),
            cartaoBrinde("normal", "Brinde Normal", "Peças comuns do kit", libN,
              "Lançado "+BK(confBrinde.lancadoNormal)+" · Restante "+BK(confBrinde.restanteNormal), "#DB2777", "AB123"),
            cartaoBrinde("bb", "Brinde Select (BB)", "Select da faixa "+BK(libS)+" + saldo do Normal "+BK(confBrinde.saldoNormal), libS,
              "Lançado "+BK(confBrinde.lancadoSelect)+" · Restante "+BK(confBrinde.restanteSelect)+" (o que passar do Select usa o saldo do Normal)", "#A855F7", "BB0001"),
            excedenteBrinde>0 && e("p",{key:"bexc", className:"text-[12.5px] font-bold text-red-400"}, "Excedente de brinde de "+BK(excedenteBrinde)+" entrou no total a pagar."),
            excedenteBrinde>0 && restanteTotal>0.009 && e("button",{key:"bpag", onClick:function(){ setLancAberto(true); setBlocoAberto(3); }, className:"h-9 w-full rounded-lg text-[12.5px] font-bold "+BR2, style:{background:"#DB2777"}}, "+ Lançar pagamento"),
            e("div",{key:"bnota", className:"flex flex-col gap-1 rounded-xl bg-amber-400/15 p-2.5 text-[12px] leading-snug"},
              e("b",null,"Atenção ao brinde"),
              e("p",null,"• Existem dois brindes: o Normal e o Select (BB)."),
              e("p",{className:"font-bold"},"• "+AVISO_BB),
              e("p",null,"• O brinde só é entregue depois do pagamento e precisa ser retirado com a representante, NA HORA DO ACERTO."),
              e("p",null,"• Qualquer peça que não estiver na hora do acerto é considerada VENDIDA, mesmo que a revendedora diga que pegou de brinde."),
              e("p",null,"• Quem ficar com kit novo pode pegar o brinde do kit antigo ou do kit novo; quem sai do programa pega da maleta que está com ela.")))]),
    blocoAcordeao(5, "novas", "#16A34A", "Kit novo",
      !previaBase || !acertoForm.pagamentos.length ? "Aguardando pagamento" : kitNovoLiberado ? (acertoForm.kitNovoOk ? "Liberado · confirmado" : "Liberado") : "Não liberado",
      !previaBase || !acertoForm.pagamentos.length ? badgeTxt("—","#374151") : badgeTxt(kitNovoLiberado ? (acertoForm.kitNovoOk ? "OK" : "Liberado") : "Não liberado", kitNovoLiberado ? "#16A34A" : "#DC2626"),
      [!previaBase || !acertoForm.pagamentos.length
        ? e("p",{key:"k0", className:"text-[13px] text-[#8E8E93]"},"Preencha as vendas e os pagamentos para saber se o kit novo está liberado.")
        : e("p",{key:"k1", className:"text-[13px] font-semibold "+(kitNovoLiberado?"text-emerald-300":"text-red-400")},
            dv.blocoDivida ? dv.blocoDivida
            : dv.novas && dv.kitNovoRegra && !dv.kitNovoRegra.liberado ? dv.kitNovoRegra.texto+" ("+N1(pctPagoAcerto)+"% pago)."
            : kitNovoLiberado ? "Kit novo liberado — "+N1(pctPagoAcerto)+"% do acerto pago."
              : previaBase && !previaBase.podeRenovar ? "Kit novo NÃO fornecido — vendas abaixo de "+BK(versaoSel.gerais.minRenovar)+" (mínimo para renovar o Kit 100% Prata). Cobra só as peças vendidas."
              : "Kit novo não liberado — "+N1(pctPagoAcerto)+"% pago. Precisa de autorização do financeiro (mínimo "+kitNovoMin+"%)."),
      dv.novas && previaBase && dv.minimo.regra && e("div",{key:"kmed", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
        e("p",{className:"text-[12px] font-semibold text-[#C4B5FD]"},"Média das últimas 3 vendas (2 anteriores + a de hoje)"),
        e("div",{className:"grid grid-cols-2 gap-1.5"}, [0,1].map(function(i){ var ant = acertoForm.vendasAnteriores||[];
          return e(CampoDinheiro,{key:i, value:ant[i]==null ? null : ant[i], mostraZero:true, label:(i===0 ? "Venda de 2 acertos atrás" : "Venda do último acerto"),
            onChange:function(v){ var n = [ant[0], ant[1]]; n[i] = v; setAcertoForm(Object.assign({}, acertoForm, {vendasAnteriores:n})); }, className:campo+" text-right"}); })),
        e("div",{className:"flex items-baseline justify-between gap-2 text-[12.5px]"},
          e("span",{className:"text-[#B5B5BA]"},"Média · mínimo "+BK(dv.minimo.ref)),
          e("b",{className:MONO+" "+(dv.minimo.abaixo ? "text-red-400" : "text-emerald-300")}, BK(dv.minimo.media))),
        dv.minimo.abaixo && e("p",{className:"text-[11.5px] leading-snug text-[#B5B5BA]"}, "Média abaixo do mínimo: o kit novo não é liberado e o cadastro fica bloqueado. A representante pode dar uma nova chance."),
        dv.minimo.abaixo && e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {novaChance:!acertoForm.novaChance})); }, "aria-pressed":!!acertoForm.novaChance,
          className:"h-9 rounded-lg text-[12.5px] font-bold "+BR2, style:{background:acertoForm.novaChance ? "#16A34A" : "#7C3AED"}}, acertoForm.novaChance ? "✓ Nova chance dada (toque para desfazer)" : "Dar nova chance")),
      kitNovoLiberado && previaBase && acertoForm.pagamentos.length>0 && e("div",{key:"kc", className:"flex flex-col gap-2 rounded-xl bg-white/5 p-2.5"},
        e("p",{className:"text-[12px] font-semibold text-[#C4B5FD]"},"Condicionais e expositores em aberto — ela continua com:"),
        condAbertasFicam.length+expFicam.length===0 ? e("p",{className:"text-[12.5px] text-[#8E8E93]"},"Nada em aberto: tudo foi conferido neste acerto.")
          : e("div",{className:"flex flex-col gap-1"}, condAbertasFicam.map(function(c){ return e("div",{key:c.numero, className:"flex justify-between rounded-lg bg-black/30 px-2.5 py-1.5 text-[12.5px]"}, e("span",null,"Condicional "+c.numero), e("span",{className:MONO+" text-[#8E8E93]"}, c.pecas+" peças")); }),
              expFicam.map(function(x){ return e("div",{key:x.id, className:"rounded-lg bg-black/30 px-2.5 py-1.5 text-[12.5px]"}, x.qtd+" "+x.nome.toLowerCase()); })),
        // 1) confirma o kit novo (o que ela leva e o que continua com a revendedora) 2) sai desta tela e vai para a de ENTREGAR o kit e CONFERIR as peças
        ((s.confBip||{})[kitSel.id]||{}).fim
          ? e("button",{onClick:function(){ setConfVolta("calcacerto"); setTela("confkit"); }, className:"h-10 rounded-xl text-[13px] font-bold "+BR2, style:{background:"#16A34A"}}, "✓ Kit novo confirmado e conferido (ver)")
          : e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {kitNovoOk:true})); setConfVolta("calcacerto"); setTela("confkit"); }, className:"h-11 rounded-xl text-[13.5px] font-bold "+BR2, style:{background:"#C9A13B"}}, "Confirmar kit novo"))]),
    blocoAcordeao(6, "caixa", "#0891B2", "Peças próximo mês",
      dv.pecasProx ? "Liberadas: "+dv.pecasProx.liberadas+" peças" : "Preencha as vendas",
      badgeTxt(dv.pecasProx ? String(dv.pecasProx.liberadas) : "—", "#0891B2"),
      !dv.pecasProx ? [e("p",{key:"p0", className:"text-[13px] text-[#8E8E93]"},"Preencha o valor vendido para ver quantas peças ela pode pegar no próximo mês.")]
      : [e("p",{key:"p1", className:"text-center text-[15px] font-extrabold text-[#0E7490]"},"Peças liberadas para o próximo mês: "+dv.pecasProx.liberadas),
        e("div",{key:"p2", className:"flex flex-col gap-1 rounded-xl bg-white/5 p-2.5 text-[12.5px]"},
          [["Valor da venda", BK(previaBase.vendaLiquida)],["Quantidade base", dv.pecasProx.base+" peças"],["Valor em aberto", BK(faltaAtual)],["% em aberto", N1(dv.pecasProx.pctAberto)+"%"],
            ["% de liberação aplicado", Math.round(dv.pecasProx.fator*100)+"%"]].map(function(l,i){ return e("div",{key:i, className:"flex justify-between gap-2"}, e("span",{className:"text-[#8E8E93]"}, l[0]), e("b",{className:MONO}, l[1])); })),
        dv.pecasProx.liberadas>0 && e("div",{key:"p3", className:"flex flex-col gap-2"},
          e("p",{className:"text-[12px] text-[#8E8E93]"},"Se ela quiser, escreva só o código das peças (máximo "+dv.pecasProx.liberadas+"). O valor da peça não conta."),
          (acertoForm.pecasProxCodigos||[]).length>0 && e("div",{className:"flex flex-wrap gap-1.5"}, acertoForm.pecasProxCodigos.map(function(c,i){
            return e("span",{key:i, className:MONO+" inline-flex items-center gap-1.5 rounded-lg bg-[#CFFAFE] px-2 py-1 text-[12.5px] font-semibold text-[#0E7490]"}, c,
              e("button",{onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {pecasProxCodigos:acertoForm.pecasProxCodigos.filter(function(x,j){return j!==i;})})); }, "aria-label":"Remover "+c, className:"text-white/60"},"×")); })),
          acertoForm.pecasProxCodigos.length<dv.pecasProx.liberadas && e("div",{className:"flex gap-1.5"},
            e("input",{value:codProx, placeholder:"Código da peça", autoCapitalize:"characters", onChange:function(ev){ setCodProx(limitarCodigo(ev.target.value)); },
              className:"h-10 min-w-0 flex-1 rounded-lg bg-black/50 px-3 text-[15px] uppercase text-white outline-none ring-1 ring-white/10 "+MONO}),
            e("button",{disabled:!codigoPecaValido(codProx), onClick:function(){ setAcertoForm(Object.assign({}, acertoForm, {pecasProxCodigos:acertoForm.pecasProxCodigos.concat([codProx])})); setCodProx(""); },
              className:"h-10 shrink-0 rounded-lg px-3 text-[12.5px] font-bold disabled:opacity-40 "+BR2, style:{background:"#0891B2"}}, "Adicionar")),
          e("p",{className:"text-[11.5px] text-[#8E8E93]"}, acertoForm.pecasProxCodigos.length+" de "+dv.pecasProx.liberadas+" escolhidas")),
        dv.pecasProx.liberadas===0 && e("p",{key:"p4", className:"text-[12.5px] font-semibold text-amber-200"},"Nenhuma peça liberada"+(dv.pecasProx.base===0 ? " (venda abaixo da primeira faixa)." : " — acerto com mais de 10% em aberto."))]),
    blocoAcordeao(7, "caixa", "#CA8A04", "Devolução de peças",
      pecasADevolver===null ? "Informe o total de vendidas nas condicionais" : pecasADevolver+" peças pra devolver",
      pecasADevolver===null ? badgeTxt("Pendente","#64748B") : badgeTxt(pecasADevolver+" peças","#CA8A04"),
      [[["Peças das condicionais", pecasCondSelecionadas],["Total de vendidas", acertoForm.pecasVendidas||0],["Total de brindes", acertoForm.brindes.length],["Trocas deste kit (ficaram com ela)", dv.nTrocasMes]].map(function(c){
        return e("div",{key:c[0], className:"flex items-center justify-between gap-2 text-[12.5px] text-[#8E8E93]"}, e("span",null,c[0]), e("b",{className:MONO+" text-white"}, c[1])); }),
      (dv.nTrocasMes+dv.nTrocasAnt)>0 && e("p",{key:"dq", className:"text-[11.5px] text-[#8E8E93]"}, (dv.nTrocasMes+dv.nTrocasAnt)+" peça(s) quebrada(s) voltam junto para a empresa."),
      e("div",{key:"dtot", className:"flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[13px] font-bold"},
        e("span",{className:"text-amber-200"},"Peças a devolver pra empresa"),
        e("span",{className:MONO+" text-amber-200"}, pecasADevolver===null ? "—" : pecasADevolver))]),
    jaAcertado
      ? e("div",{className:"flex flex-col gap-2"}, e("p",{className:"rounded-2xl bg-emerald-500/15 px-3 py-2 text-center text-[12.5px] font-bold text-emerald-300"},"Acerto já registrado e assinado — só consulta."),
          e("button",{onClick:function(){ setTela("fechamento"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro},"Ver mensagens de fechamento"))
      : e("button",{disabled:acertoForm.vendaBruta==null, onClick:function(){ setTela("assinaracerto"); },
      className:"h-11 rounded-2xl text-[14px] font-bold disabled:opacity-40 "+ouro},"Confirmar acerto"));

  // Assinatura da revendedora ao finalizar o acerto (deixou o kit): resumo, check de "li e entendi as regras" e assinatura digital.
  var telaAssinarAcerto = kitSel && previaAcerto && e(TelaAssinatura,{titulo:"Assinatura do acerto", nome:sel.rev, modo:"unico",
    regras: versaoBaseSel ? textoRegras(versaoBaseSel, modalidadeKit) : [], rotuloBotao:"Finalizar acerto",
    resumo:[["Vendas", BK(acertoForm.vendaBruta)], ["Comissão", previaAcerto.comissaoPct+"%"], ["Valor de Acerto", BK(previaAcerto.valorAcerto), "text-[#A67C12]"],
      ["Pago", BK(totalPagoAtual)], ["Valor restante", restanteTotal>0.009 ? BK(restanteTotal) : "R$ 0,00 · quitado", restanteTotal>0.009 ? "text-[#B91C1C]" : "text-[#15803D]"],
      ["Brindes", brindeBloqueio ? "Sem brinde" : acertoForm.brindes.length+" peça(s) lançada(s)"],
      ["Kit novo", !acertoForm.pagamentos.length ? "—" : kitNovoLiberado ? "Liberado" : "Não liberado"]],
    onVoltar:function(){ setTela("calcacerto"); },
    onConcluir:function(r){ d(payloadAcerto({assinatura:r.assinatura, regrasLidas:true})); setTela("fechamento"); }});
  // Fechar atendimento: mensagem pronta para a revendedora e para o grupo da empresa
  var msgs = kitSel && previaAcerto ? mensagemFechamento({nome:sel.rev, rep:l.rep, data:isoDia(new Date()), dv:dv, form:acertoForm, condFicam:condAbertasFicam, expFicam:expFicam, kitConf:kitConfDe(kitSel.id),
    remarcacoes:(kitSel.remarcacoesLista||[]).length ? kitSel.remarcacoesLista.length+" ("+vezCobravel(kitSel.remarcacoesLista)+" com multa)" : ""}) : null;
  var copiarMsg = function(chave, txt){ try{ navigator.clipboard.writeText(txt); }catch(x){} setMsgCopiada(chave); setTimeout(function(){ setMsgCopiada(null); }, 1600); };
  var telaFechamento = msgs && e("div",{className:"flex flex-col gap-3 pb-4"},
    e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"},
      e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
      e("b",{className:douradoTitulo}, "Fechar atendimento")),
    e("p",{className:"rounded-2xl bg-emerald-500/15 px-3 py-2 text-[13px] font-bold text-emerald-300"},"✓ Acerto de "+sel.rev+" registrado e assinado. Envie as mensagens abaixo."),
    [["cliente","Mensagem para a revendedora", msgs.cliente, "#16A34A"],["grupo","Mensagem para o grupo da empresa", msgs.grupo, "#2563EB"]].map(function(m){
      return e("div",{key:m[0], className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
        e("b",{className:"text-[13.5px]"}, m[1]),
        e("textarea",{readOnly:true, value:m[2], rows:Math.min(16, m[2].split("\n").length+1), className:"w-full resize-none rounded-xl bg-black/50 p-2.5 text-[12px] leading-snug text-white outline-none ring-1 ring-white/10"}),
        e("div",{className:"flex gap-2"},
          e("button",{onClick:function(){ copiarMsg(m[0], m[2]); }, className:"h-10 flex-1 rounded-xl text-[13px] font-bold "+BR2, style:{background:m[3]}}, msgCopiada===m[0] ? "✓ Copiado" : "Copiar mensagem"),
          m[0]==="cliente" && e("button",{onClick:function(){ abrirPdfAcerto("Acerto de "+sel.rev, m[2]); }, className:"h-10 flex-1 rounded-xl bg-[#C9A13B] text-[13px] font-bold "+BR2}, "Baixar PDF"),
          m[0]==="cliente" && sel.fone && e("a",{href:"https://wa.me/55"+sel.fone.replace(/\D/g,"")+"?text="+encodeURIComponent(m[2]), target:"_blank", rel:"noreferrer",
            className:"grid h-10 flex-1 place-items-center rounded-xl bg-emerald-500 text-[13px] font-bold "+BR2}, "Abrir no WhatsApp"))); }),
    e("button",{onClick:function(){ setTela("rev"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro}, "Concluir"));
  var blocoClaro = "rounded-2xl border "+LINHA_CARD+" bg-white p-3 text-[13px] text-[#111827]";
  var perfilAtual = sel ? (s.perfisRev[sel.rev] || {}) : {};
  var fone1 = perfilAtual.fone1!==undefined ? perfilAtual.fone1 : (sel && sel.fone) || "";
  var fone2 = perfilAtual.fone2 || "";
  var refsBase = sel ? refsDe(sel.rev) : [];
  var refsAtuais = (perfilAtual.refs || refsBase).slice(0,3);
  var salvarPerfil = function(patch){ if(sel) d({type:"SALVAR_PERFIL_REV", chave:sel.rev, patch:patch}); };
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
    e("span",{className:MONO+" text-[15px] font-bold text-[#4B3B14]"}, fone),
    e("div",{className:"flex shrink-0 items-center gap-1.5"},
      e("button",{onClick:function(){ copiarEndereco(id, fone); }, "aria-label":"Copiar "+label,
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(copiadoId===id ? "bg-emerald-500 text-white" : "bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: copiadoId===id ? "check" : "copiar", s:13})),
      e("button",{type:"button", onClick:function(){ abrirChat(sel.rev); }, "aria-label":"Conversar no chat", title:"Conversar no chat", className:"grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"}, e(Icon,{n:"whats", s:14})))); };
  var blocoNome = sel && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
    e("div",{className:"flex items-center justify-between gap-2 px-3.5 py-3"},
      e("b",{className:"min-w-0 truncate text-[19px] font-extrabold tracking-tight text-[#111827]"}, sel.rev),
      e("button",{onClick:function(){ setEditandoPerfil(!editandoPerfil); }, "aria-label":editandoPerfil?"Concluir edição":"Editar dados",
        className:"grid size-8 shrink-0 place-items-center rounded-full "+(editandoPerfil?"bg-emerald-500 text-white":"bg-black/10 text-[#6B5A2E]")},
        e(Icon,{n: editandoPerfil?"check":"pencil", s:14}))),
    e("div",{className:"flex flex-col gap-1.5 border-t "+LINHA_CARD+" px-3.5 py-2"},
      editandoPerfil
        ? e(React.Fragment,null,
            campoEdit("Telefone (WhatsApp)","fone1","(41) 90000-0000", sel.fone, formatarFone),
            campoEdit("2º telefone (opcional)","fone2","(41) 90000-0000", null, formatarFone))
        : e(React.Fragment,null,
            fone1 && linhaFone(fone1, "fone1-"+sel.id, "WhatsApp de "+sel.rev),
            fone2 && e("div",{className:"border-t "+LINHA_CARD+" pt-1.5"}, linhaFone(fone2, "fone2-"+sel.id, "2º WhatsApp de "+sel.rev)))),
    e("div",{className:"grid grid-cols-3 divide-x divide-[#E9DDBB] border-t "+LINHA_CARD+" py-1.5 text-center"},
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
    e("div",{className:"flex items-center justify-between gap-2 rounded-2xl border "+LINHA_CARD+" bg-white px-3 py-2"},
      e("div",{className:"min-w-0 flex-1"},
        e("b",{className:"text-[13px] text-[#111827]"}, "Está na listagem de hoje"),
        e("p",{className:"truncate text-[11.5px] text-[#6B7280]"}, (TIPO_KIT[sel.tipoKit]||TIPO_KIT.acerto_kit)[0])),
      badge(STATUS_LB[sel.status]||"", STATUS_TP[sel.status])),
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
  var botaoAgendar = sel && e("button",{onClick:function(){ setAgendarAberto(!agendarAberto); setMenuAberto(false); }, className:"flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[12px] font-extrabold leading-none "+ouro},
    e("span",null,"Agendar"), e("span",null,"atendimento"));
  var listagensNaData = sel && agendaForm.data ? s.listagens.filter(function(x){return x.rep===l.rep && !x.fechada && x.data===agendaForm.data;}) : [];
  var blocoAgendaForm = sel && agendarAberto && e("div",{className:"flex flex-col gap-2 rounded-2xl border "+LINHA_CARD+" bg-white p-3 shadow-sm"},
      e("div",{className:"flex gap-2"},
        e("input",{type:"date", value:agendaForm.data, onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {data:ev.target.value}));},
          className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
        e("input",{type:"time", value:agendaForm.hora, placeholder:"Horário", onChange:function(ev){setAgendaForm(Object.assign({}, agendaForm, {hora:ev.target.value}));},
          className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
      !agendaForm.data
        ? e("p",{className:"text-[12px] text-[#6B7280]"},"Escolha o dia do atendimento com a revendedora.")
        : listagensNaData.length>0
          ? e("div",{className:"flex flex-col gap-2"}, listagensNaData.map(function(x){
              var kitsX = s.kits.filter(function(k){return k.lid===x.id;});
              var cheiaX = listagemCheia(s, x.id), foraX = foraDoPrazo(x, s);
              return e("div",{key:x.id, className:"flex flex-col gap-1.5 rounded-xl border "+LINHA_CARD+" bg-[#F4F5F7] p-2.5"},
                e("div",{className:"flex items-center justify-between gap-2"},
                  e("div",null,
                    e("b",{className:"text-[13px] text-[#111827]"}, "Retirada "+x.horario+" · "+x.destino),
                    e("p",{className:"text-[11px] text-[#6B7280]"}, x.viagem?"Viagem":"")),
                  e("span",{className:"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                    style: cheiaX ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
                    kitsNaListagem(s,x.id)+"/"+(x.viagem?"∞":capacidadeListagem(x)))),
                kitsX.length>0 && e("div",{className:"flex flex-col gap-0.5 border-t "+LINHA_CARD+" pt-1.5"},
                  kitsX.map(function(k){ return e("p",{key:k.id, className:"truncate text-[11px] text-[#6B7280]"},
                    (k.horaAtend?k.horaAtend+" · ":"")+k.rev+(k.bairro?" · "+k.bairro:"")); })),
                foraX && e("p",{className:"text-[11px] text-amber-700"},"Menos de "+s.cfg.prazoPedidoHoras+" h: entra como atrasado."),
                e("button",{disabled:cheiaX || x.fechada, onClick:function(){ pedir("acerto_kit", {lid:x.id, hora:agendaForm.hora||null, ficarNaTela:true}); setAgendarAberto(false); },
                  className:"h-9 rounded-lg text-[12.5px] font-bold disabled:opacity-40 "+ouro}, cheiaX ? "Listagem cheia" : "Agendar nessa listagem"));
            }))
          : e(React.Fragment,null,
              e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta para esse dia ainda."),
              e("div",{className:"flex gap-2"},
                e("input",{value:formListagem.destino, placeholder:"Destino", onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {destino:ev.target.value}));},
                  className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
                e("input",{type:"time", value:formListagem.horario, onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {horario:ev.target.value}));},
                  className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
              e("button",{onClick:function(){ d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:formListagem.destino, horario:formListagem.horario, data:agendaForm.data}); },
                className:"h-10 rounded-xl text-[13px] font-bold "+ouro}, "Criar listagem para esse dia")));
  var blocoSolicitar = sel && !sel.hoje && mostrarSolicitar && e("div",{className:"flex flex-col gap-2 "+blocoClaro},
    e("p",{className:"text-[12px] font-bold uppercase tracking-wide text-[#6B7280]"},"Solicitar kit pra retirada"),
    minhasL.length===0
      ? e("div",{className:"flex flex-col gap-2"},
          e("p",{className:"text-[12px] text-[#6B7280]"},"Nenhuma listagem aberta ainda. Crie uma para continuar."),
          e("div",{className:"flex gap-2"},
            e("input",{value:formListagem.destino, placeholder:"Destino", onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {destino:ev.target.value}));},
              className:"h-10 flex-1 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"}),
            e("input",{type:"time", value:formListagem.horario, onChange:function(ev){setFormListagem(Object.assign({}, formListagem, {horario:ev.target.value}));},
              className:"h-10 w-24 rounded-xl bg-[#F4F5F7] px-2 text-sm text-[#111827] outline-none ring-1 ring-black/10"})),
          e("button",{onClick:function(){ d({type:"CRIAR_LISTAGEM", rep:l.rep, destino:formListagem.destino, horario:formListagem.horario}); },
            className:"h-10 rounded-xl text-[13px] font-bold "+ouro},"Criar listagem"))
      : e(React.Fragment,null,
          e("select",{value:lPed.id, onChange:function(ev){setLidPed(ev.target.value);}, "aria-label":"Listagem",
            className:"h-10 rounded-xl bg-[#F4F5F7] px-3 text-sm font-semibold text-[#111827] outline-none ring-1 ring-black/10"},
            minhasL.map(function(x){ var cheiaX = listagemCheia(s, x.id);
              return e("option",{key:x.id, value:x.id, disabled:cheiaX}, "Retirada "+x.horario+" · "+x.destino+" ("+kitsNaListagem(s,x.id)+"/"+capacidadeListagem(x)+")"+(cheiaX?" · Lotada":"")); })),
          foraDoPrazo(lPed, s) && e("p",{className:"text-[12px] text-amber-700"},"Menos de "+s.cfg.prazoPedidoHoras+" h para a retirada: entra como atrasado."),
          listagemCheia(s, lPed.id) && e("p",{className:"text-[12px] font-semibold text-rose-600"},"Essa listagem já está cheia. Escolha outra."),
          e("button",{disabled:listagemCheia(s, lPed.id), onClick:function(){pedir("acerto_kit"); setMostrarSolicitar(false);},
            className:"h-10 rounded-xl text-[13px] font-bold disabled:opacity-40 "+ouro},"Confirmar: acerto + kit")));
  // Modalidade do kit: fica no cadastro da revendedora (não é escolhida a cada acerto); cada troca vai pro histórico.
  var modalidadeSel = sel ? modalidadeDe(s, sel.rev) : "padrao", histModalidade = sel ? ((s.perfisRev[sel.rev]||{}).modalidadeHist || []) : [];
  var trocarModalidade = function(m){ if(sel && m!==modalidadeSel) d({type:"SET_MODALIDADE", chave:sel.rev, modalidade:m, por:l.rep, origem:"representante"}); };
  // compacto: uma linha só, rótulo pequeno e dois botões baixos (a regra de cada kit fica em Regras)
  var blocoModalidade = sel && e("div",{className:"flex items-center gap-2 rounded-xl border "+LINHA_CARD+" bg-white px-2.5 py-1.5"},
    e("p",{className:"shrink-0 text-[10.5px] font-bold uppercase tracking-wide text-[#A67C12]"},"Kit"),
    e("div",{className:"grid flex-1 grid-cols-2 gap-1.5"}, [["padrao","Ouro"],["prata","100% Prata"]].map(function(o){ var ativo = modalidadeSel===o[0];
      return e("button",{key:o[0], onClick:function(){ trocarModalidade(o[0]); }, "aria-pressed":ativo, title:"Troca de modalidade: avisar com no mínimo 10 dias",
        className:"h-7 rounded-lg text-[11.5px] font-bold ring-1 "+(ativo ? (o[0]==="prata" ? "bg-slate-700 ring-slate-700 " : "bg-[#C9A13B] ring-[#C9A13B] ")+BR : "bg-white text-[#6B7280] ring-black/10")}, (ativo ? "✓ " : "")+o[1]); })),
    histModalidade.length>0 && e("span",{className:"shrink-0 text-[9.5px] text-[#9A8B63]", title:"Última troca"}, histModalidade[0].em.slice(0,10).split("-").reverse().slice(0,2).join("/")));
  var opcoesAtendimento = [
    {lb: jaAcertado ? "Ver acerto (já registrado)" : "Realizar Acerto", icone:"calc", cor:"#16A34A", ativo:true, onClick:function(){ setMenuAberto(false);
      if(sel.hoje && jaAcertado && kitSel){
        var regVer = (s.acertosConsignado||[]).find(function(r){ return r.kitId===kitSel.id && r.tipo==="acerto"; });
        setAcertoForm(Object.assign({}, FORM_ACERTO_VAZIO, regVer && regVer.formSnapshot ? regVer.formSnapshot : {}));
        setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(3); setTela("calcacerto"); return; }
      if(sel.hoje){ if(!jaAcertado && kitSel){
          // Andrielle Taborda vem com o exemplo que o Marcus pediu já preenchido (condicionais + venda + 1 remarcação), pra testar o resto.
          var demoAndrielle = sel.rev==="Andrielle Taborda", demoMarcia = sel.rev==="Márcia Camargo";   // Márcia: acerto normal de R$ 12.268,00, sem kit novo
          var pgsPedidos = pagamentosDoPedido(s.lancFin, kitSel.id);   // pagamentos que ela já lançou e pediu conta antes de sair da tela
          setAcertoForm(Object.assign({}, FORM_ACERTO_VAZIO, demoAndrielle ? {vendaBruta:3000, condicionaisSelecionadas:["091719","092240"]} : demoMarcia ? {vendaBruta:12268, condicionaisSelecionadas:["093801","093802"]} : {}, pgsPedidos.length ? {pagamentos:pgsPedidos} : {}));
          if(demoAndrielle && !(kitSel.remarcacoesLista||[]).length) d({type:"KIT_REMARCAR", id:kitSel.id, isenta:false, motivo:""});
          setRegEscolha(null); setBrindeIn(BRINDE_IN_VAZIO); setLancAberto(false); setNegociarAberto(false); setBlocoAberto(0); setTela("calcacerto"); } }
      else { setMostrarSolicitar(true); } }},
    {lb: kitSel && kitSel.kitNovoEntregue ? "Kit novo (já entregue)" : "Entregar Kit Novo", icone:"novas", cor:"#DB2777", ativo:(ehKitNovoHoje || !!(kitSel && kitSel.demoKitNovo)) && !(kitSel && kitSel.kitNovoEntregue),
      onClick:function(){ setMenuAberto(false); setTela("entregakit"); }},
    {lb: kitSel && kitSel.reposicaoEntregue ? "Reposição (já entregue)" : "Entregar Reposição", icone:"caixa", cor:"#0891B2", ativo:!!kitSel && kitSel.tipoKit==="reposicao" && !kitSel.reposicaoEntregue,
      onClick:function(){ setMenuAberto(false); setConfVolta("reposicao"); setTela("confkit"); }}];
  var soRepos = !!kitSel && kitSel.tipoKit==="reposicao" && !kitSel.reposicaoEntregue;   // reposição: o atendimento é só a entrega (contar as peças + condicional assinada)
  var soKitNovo = !!kitSel && (ehKitNovoHoje || !!kitSel.demoKitNovo) && !kitSel.kitNovoEntregue;   // revendedora de kit novo: o atendimento é só a entrega do kit novo
  var botaoRealizar = sel && e("button",{onClick:function(){ if(soRepos){ setMenuAberto(false); setConfVolta("reposicao"); setTela("confkit"); return; } if(soKitNovo){ setMenuAberto(false); setTela("entregakit"); return; } setMenuAberto(!menuAberto); setAgendarAberto(false); }, className:"relative flex h-12 w-full flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[12px] font-extrabold leading-none "+ouro},
    e(Icon,{n: menuAberto?"chevrondown":"chevron", s:12, className:"absolute right-2 top-1/2 -translate-y-1/2 opacity-80"}),
    soRepos ? [e("span",{key:"a"},"Entregar"), e("span",{key:"b"},"reposição")] : soKitNovo ? [e("span",{key:"a"},"Entregar"), e("span",{key:"b"},"kit novo")] : [e("span",{key:"a"},"Realizar"), e("span",{key:"b"},"atendimento")]);
  var painelRealizar = sel && menuAberto && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD+" bg-white shadow-sm"},
    opcoesAtendimento.map(function(op, i){
      return e("button",{key:i, disabled:!op.ativo, onClick:op.onClick,
        className:"flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-semibold text-[#111827] disabled:opacity-50 "+(i>0?"border-t "+LINHA_CARD:"")},
        e("span",{className:"grid size-8 shrink-0 place-items-center rounded-xl", style:{background:op.cor+"1F", color:op.cor}}, e(Icon,{n:op.icone, s:15})),
        e("span",{className:"min-w-0 flex-1 leading-tight"}, op.lb),
        !op.ativo && e("span",{className:"shrink-0 text-[10.5px] font-semibold text-[#9CA3AF]"},"Em breve")); }));
  var linhaAtendimento = sel && e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"grid grid-cols-2 gap-2"}, botaoAgendar, botaoRealizar),
    blocoAgendaForm, painelRealizar);
  var botaoPedidoData = sel && !sel.realizado && e("button",{onClick:function(){ setTela("pedidodata"); }, className:"h-10 w-full rounded-2xl border border-[#C9A13B]/50 bg-white text-[12.5px] font-extrabold text-[#8A6A12]"}, "Alterar data do acerto");
  var telaRev = sel && e("div",{className:"mt-3 flex flex-col gap-2"},
    blocoNome, blocoStatusHoje, blocoModalidade, linhaAtendimento, botaoPedidoData, blocoEnderecos, blocoRefs, botaoCondicionais, blocoSolicitar);
  var ponto = function(k){ return e("span",{className:"size-2 shrink-0 rounded-full "+PONTO_CEL[STATUS_TP[k.status]]}); };
  var fmtDataISO = function(iso){ if(!iso) return ""; var p = iso.split("-"); return p[2]+"/"+p[1]; };
  var hojeISOStr = isoDia(new Date());
  var minhasLOrdenadas = minhasL.slice().sort(function(a,b){ return (a.data||"").localeCompare(b.data||"") || a.horario.localeCompare(b.horario); });
  var listagemVista = minhasLOrdenadas.find(function(x){return x.id===lidVista;}) || minhasLOrdenadas.find(function(x){return x.data===hojeISOStr;}) || minhasLOrdenadas[0];
  var kitsVista = listagemVista ? s.kits.filter(function(k){return k.lid===listagemVista.id;}).sort(function(a,b){return ETAPA[a.status]-ETAPA[b.status] || a.ordem-b.ordem;}) : [];
  var buscaLNorm = buscaListagem.trim().toLowerCase();
  var kitsVistaFiltrados = buscaLNorm ? kitsVista.filter(function(k){return k.rev.toLowerCase().indexOf(buscaLNorm)>=0;}) : kitsVista;
  var resultadosForaDaVista = buscaLNorm ? s.kits.filter(function(k){ return (!listagemVista || k.lid!==listagemVista.id) && minhasL.some(function(x){return x.id===k.lid;}) && k.rev.toLowerCase().indexOf(buscaLNorm)>=0; }) : [];
  var telaListagens = e("div",{className:"mt-3 flex flex-col gap-2.5"},
    minhasL.length>0 && e("input",{value:buscaListagem, onChange:function(ev){setBuscaListagem(ev.target.value);}, placeholder:"Buscar revendedora nas listagens",
      className:"h-10 rounded-xl bg-white px-3 text-sm text-[#111827] outline-none ring-1 ring-black/5 placeholder:text-[#9CA3AF]"}),
    minhasLOrdenadas.length===0
      ? e("div",{className:"rounded-2xl bg-[#1C1C1E] p-4 text-center text-[13px] text-[#8E8E93]"},"Nenhuma listagem aberta no momento.")
      : e(React.Fragment,null,
          e("div",{className:"flex gap-1.5 overflow-x-auto pb-1"}, minhasLOrdenadas.map(function(x){ var ativo = listagemVista && listagemVista.id===x.id;
            return e("button",{key:x.id, onClick:function(){setLidVista(x.id);}, className:"shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold whitespace-nowrap "+(ativo?ouro:"bg-[#1C1C1E] text-[#8E8E93]")},
              fmtDataISO(x.data)+(x.data===hojeISOStr?" · Hoje":"")+" · "+x.horario); })),
          listagemVista && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD, style:{background:"linear-gradient(135deg,#FFFFFF 0%,#F5E6BE 100%)"}},
            e("div",{className:"flex items-center justify-between gap-2 px-3.5 py-3"},
              e("div",null,
                e("b",{className:"text-[15px] text-[#111827]"}, "Retirada "+listagemVista.horario+" · "+listagemVista.destino),
                e("p",{className:"text-[12px] text-[#6B7280]"}, fmtDataISO(listagemVista.data)+(listagemVista.data===hojeISOStr?" (hoje)":"")+(listagemVista.viagem?" · Viagem":""))),
              e("span",{className:"shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold",
                style: listagemCheia(s,listagemVista.id) ? {background:"#DC26261F", color:"#DC2626"} : {background:"#16A34A1F", color:"#16A34A"}},
                kitsNaListagem(s,listagemVista.id)+"/"+(listagemVista.viagem?"∞":capacidadeListagem(listagemVista))))),
          listagemVista && kitsVistaFiltrados.length===0 && e("p",{className:"rounded-2xl bg-[#1C1C1E] p-3 text-center text-[12px] text-[#8E8E93]"},
            buscaLNorm ? "Ninguém com esse nome nessa listagem." : "Nenhuma revendedora nessa listagem ainda."),
          listagemVista && kitsVistaFiltrados.length>0 && e("div",{className:"overflow-hidden rounded-2xl border "+LINHA_CARD+" bg-white"}, kitsVistaFiltrados.map(function(k){
            return e("button",{key:k.id, onClick:function(){ var alvo = cart.find(function(r){return r.rev===k.rev;}); if(alvo){ setSel(alvo.id); setTela("rev"); } },
                className:"flex w-full flex-col gap-1 border-b "+LINHA_CARD+" px-3 py-2 text-left last:border-0"},
              e("div",{className:"flex items-center gap-2"},
                e("div",{className:"min-w-0 flex-1"},
                  e("p",{className:"truncate text-[13px] text-[#111827]"}, k.rev, modalidadeDe(s, k.rev)==="prata" && e("span",{className:"ml-1.5 rounded-full bg-slate-700 px-1.5 py-px align-middle text-[9px] font-black tracking-wider "+BR}, "100% PRATA")),
                  k.bairro && e("p",{className:"truncate text-[11px] text-[#9A8B63]"}, k.bairro)),
                e("div",{className:"shrink-0 text-right"},
                  k.horaAtend && e("p",{className:MONO+" text-[11.5px] text-[#6B7280]"}, k.horaAtend),
                  e("p",{className:MONO+" text-[12px] font-semibold text-[#A67C12]"}, k.valor?BK(k.valor):"—"))),
              e("div",{className:"flex items-center gap-1.5 pl-0"}, ponto(k), badge(STATUS_LB[k.status]||k.status, STATUS_TP[k.status]))); })),
          resultadosForaDaVista.length>0 && e("div",{className:"flex flex-col gap-1.5"},
            resultadosForaDaVista.map(function(k){ var lk = minhasL.find(function(x){return x.id===k.lid;});
              return e("button",{key:k.id, onClick:function(){setLidVista(k.lid); setBuscaListagem("");},
                  className:"flex items-center justify-between gap-2 rounded-xl border "+LINHA_CARD+" bg-white px-3 py-2 text-left text-[12.5px]"},
                e("span",{className:"min-w-0 flex-1 truncate text-[#111827]"}, k.rev+" está em outra listagem"),
                e("span",{className:MONO+" shrink-0 text-[#A67C12]"}, lk ? fmtDataISO(lk.data)+" · "+lk.horario : "")); }))),
    e("button",{onClick:function(){setTela("revs");}, className:"h-11 rounded-2xl border "+LINHA_CARD+" bg-white text-[13px] font-bold text-[#111827]"},"+ Adicionar revendedora numa listagem"));
  var estrelas = function(k){ var n = (notas[k.id]||{}).nota || 0;
    return e("div",{className:"flex gap-0.5"}, [1,2,3,4,5].map(function(i){ return e("button",{key:i, "aria-label":i+" estrelas",
      onClick:function(){ var o = Object.assign({}, notas); o[k.id] = Object.assign({faltas:0}, o[k.id], {nota:i}); setNotas(o); },
      className:"text-lg leading-none "+(i<=n?"text-amber-300":"text-white/25")}, "★"); })); };
  var faltasDe = function(k){ return (notas[k.id]||{}).faltas || 0; };
  var mudaFalta = function(k, dlt){ var o = Object.assign({}, notas); var at = Object.assign({nota:0, faltas:0}, o[k.id]); at.faltas = Math.max(0, at.faltas+dlt); o[k.id] = at; setNotas(o); };
  var dataChave = function(r){ var p = (r.data||"").split("/"); return p.length===2 ? (+p[1])*100+(+p[0]) : 0; };
  var filtradas = cart.filter(function(r){ return !busca || r.rev.toLowerCase().indexOf(busca.toLowerCase())>=0; }).sort(function(a,b){
    if(sortBy==="vendasMais") return vendMes(b)-vendMes(a);
    if(sortBy==="vendasMenos") return vendMes(a)-vendMes(b);
    var ph = (a.hoje?0:1)-(b.hoje?0:1); if(ph) return ph;
    var pd = dataChave(a)-dataChave(b); if(pd) return pd;
    return (a.hora||"").localeCompare(b.hora||""); });
  var flameLogo = e("svg",{viewBox:"0 0 24 30", width:13, height:16, "aria-hidden":true},
    e("defs",null, e("linearGradient",{id:"repFlame", x1:"0%", y1:"0%", x2:"0%", y2:"100%"},
      e("stop",{offset:"0%", stopColor:"#F1E4C6"}), e("stop",{offset:"55%", stopColor:"#E8B84B"}), e("stop",{offset:"100%", stopColor:"#B8862B"}))),
    e("path",{fill:"url(#repFlame)", d:"M12 0c2 4-3 6-3 10a3 3 0 0 0 6 0c0-1-.4-2-.4-2 2 1.5 3.4 4.2 3.4 7a6 6 0 1 1-12 0c0-6 4-8 6-15Z"}));
  var headerInicio = e("div",{className:"relative -mx-4 -mt-2 overflow-hidden rounded-b-[34px] bg-[#0B0B0D] px-5 pb-5 pt-4"},
    e("svg",{viewBox:"0 0 380 190", preserveAspectRatio:"none", className:"pointer-events-none absolute inset-0 h-full w-full", "aria-hidden":true},
      e("defs",null, e("linearGradient",{id:"repGoldA", x1:"0%", y1:"0%", x2:"100%", y2:"100%"},
        e("stop",{offset:"0%", stopColor:"#B8862B", stopOpacity:0.9}),
        e("stop",{offset:"55%", stopColor:"#E8B84B", stopOpacity:0.5}),
        e("stop",{offset:"100%", stopColor:"#F1E4C6", stopOpacity:0}))),
      e("path",{d:"M80 -30 C 200 15 250 65 410 35 L 410 -30 Z", fill:"url(#repGoldA)"}),
      e("path",{d:"M-30 140 C 90 95 220 175 410 105 L 410 210 L -30 210 Z", fill:"url(#repGoldA)", opacity:.35})),
    e("div",{className:"relative flex items-center justify-between gap-2"},
      e("div",{className:"flex min-w-0 items-center gap-2"},
        e(Avatar,{nome:l.rep, i:0, className:"size-10 shrink-0 text-base"}),
        e("span",{className:"flex min-w-0 items-center gap-1"},
          e("b",{className:"max-w-[6.5rem] truncate text-[15px] font-bold "+BR}, l.rep),
          e(Icon,{n:"chevrondown", s:12, className:"shrink-0 text-white/50"}))),
      e("span",{className:"flex shrink-0 items-center gap-1.5"}, flameLogo, e("b",{className:"text-[12.5px] font-black tracking-[.25em] text-amber-200"},"SORELLY")),
      e("button",{className:"relative grid size-9 shrink-0 place-items-center rounded-full bg-white/10"},
        e(Icon,{n:"sino", s:15, className:BR}),
        nAval>0 && e("span",{className:"absolute -right-1 -top-1 grid min-w-[1.1rem] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold "+BR}, nAval))),
    e("div",{className:"relative mt-3 flex items-center gap-1.5"}, [
      e(Icon,{key:"ic", n:"calendario", s:12, className:"shrink-0 text-white/40"}),
      meses.map(function(m,i){ return e("button",{key:m, onClick:function(){setMes(i);},
        className:"rounded-full px-2.5 py-1 text-[11px] font-semibold "+(mes===i ? "bg-amber-200 text-[#1B1409]" : "bg-white/8 "+BR)}, m+(i===0?" (atual)":"")); })]),
    e("div",{className:"relative mt-3 flex flex-col gap-1.5"},
      [{lb:"Vendido Total", v:BK(vendidoTotal), ic:"grafico", cor:"#F3D8A0"},
        {lb:"Acerto Total", v:BK(acertoTotal), ic:"wallet", cor:"#C6DFF8"},
        {lb:"Comissão Rep.", v:BK(comissaoRepTotal), ic:"coins", cor:"#C1EDD1"}].map(function(m){
        return e("div",{key:m.lb, className:"flex items-center justify-between gap-2 rounded-xl bg-white/8 px-3 py-2"},
          e("span",{className:"flex min-w-0 items-center gap-2"},
            e("span",{className:"grid size-6 shrink-0 place-items-center rounded-full bg-white/10", style:{color:m.cor}}, e(Icon,{n:m.ic, s:13, peso:"fill"})),
            e("b",{className:"truncate text-[12.5px] font-semibold "+BR}, m.lb)),
          e("span",{className:MONO+" shrink-0 whitespace-nowrap text-[13.5px] font-extrabold text-amber-200"}, m.v));
      })));
  var listaInicio = e("div",{className:"mt-3.5 flex flex-col gap-2.5"}, LISTA_INICIO.map(function(m){
    var conteudo = [
      e("span",{key:"ic", className:"grid size-11 shrink-0 place-items-center rounded-2xl", style:m.logo ? {background:"#24180a"} : {background:m.cor+"1F", color:m.cor}}, m.logo ? e(LogoChat,{s:28}) : e(Icon,{n:m.icone, s:20, peso:"fill"})),
      e("div",{key:"tx", className:"min-w-0 flex-1"}, e("b",{className:"block text-[15px] text-[#111827]"}, m.titulo), e("span",{className:"block truncate text-[12.5px] text-[#6B7280]"}, m.sub)),
      m.ativo ? e(Icon,{key:"ch", n:"chevron", s:16, className:"shrink-0 text-[#9CA3AF]"})
        : e("span",{key:"ch", className:"shrink-0 rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10.5px] font-semibold text-[#9CA3AF]"}, "Em breve")];
    return m.ativo
      ? e("button",{key:m.tela, onClick:function(){ if(m.tela==="mensagens") efem({conversaSel:null}); setTela(m.tela); }, style:{background:claro(m.cor,.2)}, className:"flex w-full items-center gap-3 rounded-2xl p-3 text-left shadow-sm active:scale-[.99]"}, conteudo)
      : e("div",{key:m.tela, style:{background:claro(m.cor,.12)}, className:"flex w-full items-center gap-3 rounded-2xl p-3 opacity-70"}, conteudo); }));
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
          vr.novas ? e("p",{key:"pn2"},"Qualquer valor pendente tem multa de "+vr.novas.multaPendentePct+"% sobre o pendente. Prazo para quitar: "+vr.novas.prazoQuitarDias+" dias; depois soma "+vr.novas.atrasoQuitacaoPctDia+"% ao dia, até "+vr.novas.atrasoQuitacaoTetoPct+"%. O próximo kit só sai depois de quitar.")
            : e("p",{key:"pn2"},"Se a revendedora não quiser negociar o que falta: sem brinde e a nota promissória será executada em 48h úteis.")])),
    vr.novas && cartaoRegra("atraso","Acerto atrasado","#DC2626","calendario",
      vr.novas.atrasoAcerto.slice().sort(function(a,b){return a.ate-b.ate;}).map(function(x,i,arr){ return linhaRegra("ar"+i, (i>0 ? arr[i-1].ate+1 : 1)+" a "+x.ate+" dias", "comissão −"+x.comissaoPct+"% · brinde −"+x.brindePct+"%", "#B91C1C"); })
        .concat([linhaRegra("ar60", vr.novas.juridicoDias+" dias ou mais", "perde tudo · jurídico", "#B91C1C"), e("p",{key:"arn"},"O desconto vale sobre o total da venda. Acerto no dia não perde nada.")])),
    vr.novas && cartaoRegra("media","Venda mínima","#0891B2","grafico",[
      e("p",{key:"m1"},"Média das últimas "+vr.novas.mediaVendas+" vendas (2 anteriores e a do dia do acerto): mínimo de "+BK0(vr.novas.minimoRepresentante)+" no acerto com a representante e "+BK0(vr.novas.minimoInterno)+" no acerto na Sorelly."),
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
  var telaPropria = ["calcacerto","regras","assinaracerto","entregakit","confkit","fechamento","resumokn","reposicao","mensagens","informativos","regrascom"].indexOf(tela)>=0;   // telas com cabeçalho e conteúdo próprios
  return e(IPhone17ProMax,null,
    tela==="calcacerto" && headerCalc,
    tela==="calcacerto" && avisoConta && e("button",{key:"avisoConta", type:"button", role:"alert", onClick:function(){ setAvisoConta(null); },
      className:"absolute inset-x-3 top-16 z-50 flex items-center gap-2 rounded-xl bg-[#16A34A] px-3 py-2 text-left text-white shadow-xl ring-1 ring-black/30"},
      e("span",{className:"text-[18px]"}, "💳"), e("span",{className:"min-w-0 flex-1 text-[12px] leading-tight"}, e("b",{className:"block"}, "Conta recebida: "+BK(avisoConta.valor)), e("span",{className:"block truncate"}, avisoConta.conta))),
    tela==="calcacerto" && calcAcertoScreen,
    tela==="assinaracerto" && telaAssinarAcerto,
    tela==="fechamento" && telaFechamento,
    tela==="entregakit" && kitSel && e(EntregaKNRep,{key:kitSel.id, s:s, d:d, k:kitSel, versao:versaoSel || versaoVigente(s),
      onVoltar:function(){ setTela("rev"); }, onConcluido:function(){ setTela("resumokn"); }, onConferir:function(){ setConfVolta("entregakit"); setTela("confkit"); }}),
    tela==="reposicao" && kitSel && (function(){
      var kc = kitConfDe(kitSel.id), pronto = !!kc && reposAss, valorRep = (s.comis||{}).reposicao!=null ? s.comis.reposicao : 20;
      return e("div",{key:"rep", className:"flex flex-col gap-3 pb-4"},
        e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"}, e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})), e("b",{className:douradoTitulo},"Entregar reposição")),
        e("p",{className:"truncate text-[17px] font-extrabold "+BR}, kitSel.rev),
        e("div",{className:"flex flex-col gap-1.5 rounded-2xl bg-[#1C1C1E] p-3"},
          e("b",{className:"text-[13px]"},"1 · Contar as peças"),
          kc ? e("p",{className:"text-[12.5px] text-emerald-300"},"✓ Peças conferidas: "+kc.lidas+" de "+kc.esperadas+(kc.faltas.length ? " · faltaram "+kc.faltas.length : ""))
             : e("button",{onClick:function(){ setConfVolta("reposicao"); setTela("confkit"); }, className:"h-10 rounded-xl text-[13px] font-bold "+BR2, style:{background:"#C9A13B"}}, "Contar e conferir as peças")),
        e("label",{className:"flex items-center gap-2 rounded-2xl bg-[#1C1C1E] p-3 text-[13px]"}, e("input",{type:"checkbox", checked:reposAss, onChange:function(){ setReposAss(!reposAss); }}),
          e("span",null,e("b",null,"2 · Condicional assinada pela revendedora"), e("span",{className:"block text-[11.5px] text-[#8E8E93]"},"Ela sobe nas condicionais em aberto da revendedora."))),
        e("p",{className:"rounded-2xl bg-amber-200/10 px-3 py-2 text-[12px] text-amber-200"},"Comissão da entrega: "+BK(valorRep)+" (aparece no Consolidado e em Comissões, descrita como comissão de reposição)."),
        e("button",{disabled:!pronto, onClick:function(){ d({type:"REPOSICAO_ENTREGAR", id:kitSel.id}); setReposAss(false); setTela("resumokn"); }, className:"h-11 rounded-2xl text-[14px] font-bold disabled:opacity-40 "+ouro}, "Concluir reposição")); })(),
    tela==="resumokn" && kitSel && (function(){
      var txt = mensagemEntrega({tipo:(kitSel.tipoKit||"").indexOf("repos")===0 ? "reposicao" : "kit_novo", nome:sel.rev, rep:l.rep, data:isoDia(new Date()), kitConf:kitConfDe(kitSel.id), condicionaisAssinadas:kitSel.tipoKit==="reposicao" ? !!kitSel.reposicaoEntregue : !!(s.entregasKN||{})[kitSel.id], comissao:kitSel.tipoKit==="reposicao" ? (kitSel.comissaoFixa||0) : 0});
      return e("div",{key:"rkn", className:"flex flex-col gap-3 pb-4"},
        e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex items-center gap-2 bg-[#0B0B0D] px-4 pb-3 pt-4"}, e("button",{onClick:function(){ setTela("rev"); }, "aria-label":"Voltar", className:douradoArrow}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})), e("b",{className:douradoTitulo},"Resumo da entrega")),
        e("div",{className:"flex flex-col gap-2 rounded-2xl bg-[#1C1C1E] p-3"},
          e("textarea",{readOnly:true, value:txt, rows:Math.min(18, txt.split("\n").length+1), className:"w-full resize-none rounded-xl bg-black/50 p-2.5 text-[12px] leading-snug text-white outline-none ring-1 ring-white/10"}),
          e("div",{className:"flex gap-2"}, e("button",{onClick:function(){ copiarMsg("kn", txt); }, className:"h-10 flex-1 rounded-xl text-[13px] font-bold "+BR2, style:{background:"#16A34A"}}, msgCopiada==="kn" ? "✓ Copiado" : "Copiar"),
            e("button",{onClick:function(){ abrirPdfAcerto("Kit novo de "+sel.rev, txt); }, className:"h-10 flex-1 rounded-xl bg-[#C9A13B] text-[13px] font-bold "+BR2}, "Baixar PDF"))),
        e("button",{onClick:function(){ setTela("rev"); }, className:"h-11 rounded-2xl text-[14px] font-bold "+ouro}, "Concluir")); })(),
    tela==="confkit" && kitSel && e("div",{key:"ck"},
      e("div",{className:"sticky -top-2 z-20 -mx-4 -mt-2 flex flex-col gap-1 bg-[#0B0B0D] px-4 pb-3 pt-4"},
        e("div",{className:"flex items-center gap-2"}, e("button",{onClick:function(){ setTela(confVolta); }, "aria-label":"Voltar", className:"grid size-8 shrink-0 place-items-center rounded-full bg-amber-200/10 text-amber-200"}, e(Icon,{n:"chevron", s:15, className:"rotate-180"})),
          e("b",{className:"min-w-0 flex-1 truncate text-[13px] font-black uppercase tracking-[.18em] text-amber-200"},"Entregar o kit e conferir as peças")),
        e("p",{className:"truncate text-[17px] font-extrabold txt-branco"}, kitSel.rev)),
      e("div",{className:"mt-3 pb-4"}, e(ConfPecas,{s:s, d:d, k:kitSel, onContinuar:function(){ setTela(confVolta); }}))),
    tela==="pedidodata" && sel && e("div",{className:"mt-3 flex flex-col gap-2"}, e("button",{onClick:function(){ setTela("rev"); }, className:"self-start rounded-full bg-amber-200/10 px-3 py-1.5 text-[12px] font-bold text-[#E8B84B]"}, "‹ Voltar"), e(PedidoDataRep,{s:s, d:d, l:l, rev:sel})),
    tela==="mensagens" && e(MensagensRep,{rep:l.rep, revendedoras:cart.map(function(r){ return r.rev; }), onInicio:function(){ setTela("inicio"); }}),
    tela==="regrascom" && e(TelaRegrasComissoes,{key:"rc", publico:"representante", onVoltar:function(){ setTela("inicio"); }}),
    tela==="informativos" && e(TelaInformativos,{key:"inf", publico:"representante", quem:l.rep, onVoltar:function(){ setTela("inicio"); }}),
    tela==="regras" && headerRegras,
    tela==="regras" && telaRegras,
    tela==="inicio" && headerInicio,
    !telaPropria && tela!=="inicio" && tela!=="revs" && tela!=="rev" && tela!=="novos" && tela!=="listagens" && tela!=="comissoes" && e("div",null,
      e("div",{className:"flex items-center gap-3"},
        e(Avatar,{nome:l.rep, i:0}),
        e("div",{className:"min-w-0 flex-1"}, e("p",{className:"text-[12px] text-[#8E8E93]"},"Olá, representante"), e("p",{className:"truncate text-xl font-bold"}, l.rep)),
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
        e("b",{className:douradoTitulo}, "Revendedoras")),
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
      e("button",{onClick:function(){setTela("inicio");}, "aria-label":"Voltar ao início", className:douradoArrow},
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
    tela==="comissoes" && e(ComissoesRep,{s:s, d:d, l:l}),
    tela==="listagens" && telaListagens,
    tela==="retirada" && e("div",{className:"flex flex-col gap-2.5"},
      e("div",{className:"flex flex-col items-center rounded-2xl p-4 text-center "+ouro},
        e("p",{className:"text-[12px] font-semibold opacity-80"},"Código de retirada"),
        e("p",{className:"font-mono text-4xl font-bold tracking-[.35em]"}, codigoRetirada(l)),
        e("p",{className:"mt-1 text-[12px]"},"Informe este código no balcão e assine na tela. No sistema real ele muda a cada retirada.")),
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
            e("div",{className:"flex items-center justify-between gap-2 text-[13px]"},
              e("span",{className:"text-[#8E8E93]"},"Peças faltando"),
              e("div",{className:"flex items-center gap-2"},
                e("button",{onClick:function(){mudaFalta(k,-1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"−"),
                e("b",{className:MONO+" w-5 text-center"}, faltasDe(k)),
                e("button",{onClick:function(){mudaFalta(k,1);}, className:"size-7 rounded-lg bg-white/10 font-bold"},"+"))),
            e("button",{disabled:!nt, onClick:function(){ d({type:"AVALIAR", id:k.id, nota:nt, faltas:faltasDe(k)}); },
              className:"h-9 rounded-xl text-[13px] font-semibold disabled:opacity-40 "+ouro},"Enviar avaliação"));
        })),
    e(FolderAoAbrir,{key:"folder", publico:"representante", quem:l.rep}));
}

export { MESES_ABR, mesesApp, PCT_REVENDEDORA, CARTEIRA_DEMO, REF_NOMES, REF_REL, refsDe, carteiraRep, AppRepresentante };

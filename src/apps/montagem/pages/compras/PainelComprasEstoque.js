// Sorelly Admin · montagem — pages/compras/PainelComprasEstoque.js
// PRIMEIRA TELA de Materiais e estoque, no MESMO jeito do Encomendas › Funil de pedidos (Marcus, 17/11/2026: "observe o Funil de pedidos, faça a primeira tela nesse padrão"):
// um bloco só (BlocoPainel, barra azul "FUNIL DE COMPRAS") e UMA faixa azul no alto com tudo junto: visão (Quadro | Planilha | Estoque), filtros em menus suspensos,
// números à direita e o botão principal. Sem faixa de totais, sem bloco "Filtros" e sem busca no topo (a busca é o Ctrl+F do sistema; o filtro da planilha fica no título das colunas).
// Quadro = uma coluna por etapa (só as que têm compra), todas no mesmo azul; o cartão NÃO tem botão: clica no cartão e a ficha abre (aprovar, liberar, comprar, receber, entregar... ficam nela).
// Planilha = TabelaPlanilha das compras. Estoque = TabelaPlanilha do estoque de material com a coluna Contar (contagem na própria linha) e a coluna Compra (botão Solicitar).
// Regras e estado em domain/compras-estoque.js (s.ce, ações CE). Aqui só desenho e chamo as ações que já existiam (estoque_contagem, sol_add, aprovar...).
import { Pagina } from "@/apps/montagem/components/padrao";
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { CAMPO } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ETAPA_ANALISE, PAGAVEL_STATUS, ROTULO_SITUACAO, agruparPorStatus, formatarDia, formatarReais, hojeSP, pendenciasAnalise } from "@/apps/montagem/domain/compras-estoque";
import { BTN, SEL } from "@/apps/montagem/components/faixa-azul";
import { COLUNAS, colunaDe, FINAIS, baseLista, baixarCsv, csvDe, ultimoEm } from "@/apps/montagem/pages/compras/Compras";
import { JanelaPedir } from "@/apps/montagem/pages/compras/EstoqueMaterial";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { cnpjCurto, diasNaEtapa, normal, textoDias, useCompras } from "@/apps/montagem/pages/compras/pecas";
import { Vazio, useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { e, useEffect, useState } from "@/shared/react";

// tudo que o antigo Quadro de compras filtrava em cima (indicadores clicáveis) agora é a opção Situação do menu suspenso (Marcus, 17/11/2026: "não perder nada")
var SITUACOES = [["aberto", "Em aberto"], ["ajustes", "Novo orçamento / ajustes"], ["aguard", "Aguardando aprovação"], ["aprovadas", "Na análise financeira"], ["liberadas", "Liberadas para comprar"], ["areceber", "A receber"], ["atrasadas", "Atrasadas"], ["mes", "Compras do mês"], ["finalizados", "Finalizadas"]];
function passaSituacao(p, sit, mes){
  var fim = FINAIS.indexOf(p.status)>=0;
  return sit==="ajustes" ? p.status==="AGUARDANDO_ORCAMENTO" : sit==="aberto" ? !fim : sit==="finalizados" ? fim : sit==="aguard" ? (p.status==="NAO_VERIFICADA" || p.status==="AGUARDANDO_AUTORIZACAO") : sit==="autoriz" ? p.status==="AGUARDANDO_AUTORIZACAO" : sit==="aprovadas" ? ETAPA_ANALISE.indexOf(p.status)>=0 : sit==="liberadas" ? p.status==="LIBERADA" : sit==="areceber" ? ["COMPRADA", "EM_TRANSITO", "RECEBIDA_PARCIAL"].indexOf(p.status)>=0 : sit==="atrasadas" ? !!p.atrasado : sit==="mes" ? (String(p.solicitadoEm).slice(0, 7)===mes && p.status!=="NEGADA" && p.status!=="CANCELADA") : true;
}
// o que a Visão geral manda ao abrir uma compra filtrada ({ind, setor, cls, sol, urg, atr}) vira o filtro daqui
function filtroDe(o){ o = o || {}; return {setor:o.setor!=null ? String(o.setor) : "", sol:o.sol || "", urg:o.urg || "", cls:o.cls || "", sit:o.ind || (o.atr ? "atrasadas" : "")}; }

var LIMITE_COLUNA = 30, LIMITE_FIM = 8, PASSO = 10;   // coluna aberta mostra 30 cartões; Entregue, Reprovada e Cancelada mostram 8 (têm centenas) e o botão Ver mais
var COR_STATUS = {CRITICO:"text-destructive", ATENCAO:"text-warning", OK:"text-success"};
var ROT_STATUS = {CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"};
var EM_ANDAMENTO = ["SOLICITADO", "AGUARDANDO_APROVACAO", "AGUARDANDO_ENTREGA"];   // situações da compra de material que já estão a caminho
var VAZIO_F = {setor:"", sol:"", urg:"", sit:"", cls:""};
var num = function(n){ return Number(n || 0).toLocaleString("pt-BR"); };
function plural(n, um, varios){ return n+" "+(n===1 ? um : varios); }

// contagem na própria linha: digita a quantidade contada e confirma (a data é hoje e quem contou é quem está logado)
function CelulaContar(p){
  var st = useState(""), v = st[0], m = p.m, x = p.x;
  var salvar = function(){
    var n = Number(v);
    if(v==="" || isNaN(n) || n<0) return p.c.aviso("Informe a quantidade contada (número de 0 em diante).");
    if(x.exec("estoque_contagem", {id:m.id, valor:Math.round(n), quem:x.por, data:hojeSP(), motivo:""})) st[1]("");
  };
  return e("span",{className:"flex items-center justify-center gap-1.5", onClick:function(ev){ ev.stopPropagation(); }},
    e("input",{type:"number", min:0, value:v, placeholder:String(m.estoqueAtual), disabled:!p.pode, "aria-label":"Quantidade contada de "+m.material, onChange:function(ev){ st[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvar(); }, className:CAMPO+" w-20 text-center tabular-nums"}),
    e("button",{type:"button", disabled:!p.pode || v==="", onClick:salvar, title:p.pode ? "Registrar a contagem" : "Sem autorização para contar", className:"h-8 rounded-md border border-border bg-card px-2.5 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40"}, "OK"));
}

// COR FIXA DO FORNECEDOR (Marcus, 17/11/2026, versão D1: "o entorno inteiro com a cor"): cada fornecedor tem sempre a mesma cor, tirada do nome (a parte depois de " - ", então "Edson - Office Graff" e "Office Graff" são a mesma).
// Sem fornecedor = cinza. Nenhuma cor de fornecedor é verde, amarela nem vermelha: essas três ficam só para o estado (tempo na etapa e atraso).
var CORES_FORNECEDOR = ["#38bdf8", "#a78bfa", "#2dd4bf", "#f472b6", "#fb923c", "#818cf8", "#e879f9", "#22d3ee"];
function corFornecedor(nome){
  var n = String(nome || "").toLowerCase().split(" - ").pop().trim(); if(!n || n==="sem fornecedor") return "#94a3b8";
  var h = 0; for(var i = 0; i<n.length; i++) h = (h*31+n.charCodeAt(i))%9973;
  return CORES_FORNECEDOR[h%CORES_FORNECEDOR.length];
}
// tempo na etapa em semáforo: 1 a 2 dias verde, 3 a 4 amarelo, 5 ou mais vermelho
var corDoTempo = function(d){ return d>=5 ? "text-destructive" : d>=3 ? "text-warning" : "text-success"; };

// cartão do quadro, versão D1 (sem botão): borda inteira na cor do fornecedor; fornecedor em cima, compra no meio, rodapé com valor, solicitante e tempo. O cartão inteiro abre a ficha.
function CartaoC(p){
  var pd = p.p, final = FINAIS.indexOf(pd.status)>=0, dias = diasNaEtapa(pd, p.hoje), atras = !final && pd.atrasado, cor = corFornecedor(pd.fornecedor);
  var naoFecha = !final && pd.plano.length>0 && !pd.planoInfo.fecha, urgente = !final && pd.urgencia==="ALTA";
  var fina = ["AGUARDANDO", "AGUARDANDO_AUTORIZACAO", "RECEBIDA_PARCIAL"].indexOf(pd.status)>=0;
  var dev = pd.status==="AGUARDANDO_ORCAMENTO" ? (pd.devolucao || {por:"", detalhe:pd.orcamentoDetalhe || ""}) : null;   // pendência de ajuste (18/11/2026): quem devolveu e o resumo   // só mostra a situação quando a coluna não a diz (Aguardando autorização, Parcial...)
  var pend = pendenciasAnalise(pd), pronto = pend[0]==="Pronto para liberar";   // Análise financeira (18/11/2026): Falta definir CNPJ / Falta definir pagamento / Pronto para liberar
  // NADA QUEBRA LINHA (Marcus, 17/11/2026): cada linha do cartão fica em uma linha só e a coluna cresce para a direita até caber o maior cartão (mínimo 270 px)
  return e("button",{type:"button", title:"Abrir a compra", onClick:p.abrir, style:{borderColor:cor+"73"}, className:"flex w-full cursor-pointer flex-col gap-0 whitespace-nowrap rounded-md border bg-card px-2 py-1 text-left hover:bg-white/5"},
    e("span",{className:"flex items-baseline justify-between gap-3 text-[11px] leading-tight"},
      e("span",{className:"font-semibold", style:{color:cor}}, normal(pd.fornecedor) || "Sem fornecedor"),
      e("span",{className:"flex gap-2 font-bold"}, urgente && e("span",{className:"text-destructive"}, "Urgente"), naoFecha && e("span",{className:"text-warning", title:pd.planoInfo.aviso}, "Plano não fecha"), fina && e("span",{className:"text-warning"}, pd.rotuloStatus), pend.length>0 && e("span",{className:pronto ? "text-success" : "text-warning"}, pend.join(" · ")))),
    e("b",{className:"my-0.5 text-[11px] leading-tight"}, normal(pd.titulo)),
    dev && e("span",{className:"mb-0.5 flex flex-col gap-0 rounded border border-[var(--alerta,#FBBF24)]/60 px-1.5 py-0.5 text-[11px] leading-tight text-warning", style:{whiteSpace:"normal", maxWidth:320}},
      e("b",null, "Ajuste pedido"+(dev.por ? " por "+dev.por : "")), dev.detalhe && e("span",null, dev.detalhe)),
    e("span",{className:"grid grid-cols-[auto_1fr_auto] items-baseline gap-3 border-t border-white/10 pt-0.5 text-[11px]"},
      e("span",{className:"font-bold tabular-nums"}, formatarReais(pd.valorFinal)),
      e("span",{className:"text-center"}, pd.solicitante || "Sem solicitante"),
      e("span",{className:"font-bold tabular-nums "+(final ? "" : atras ? "text-destructive" : corDoTempo(dias))}, final ? "" : atras ? "Atrasada · "+textoDias(dias) : textoDias(dias))));
}

function PainelComprasEstoque(props){
  var x = useCe(), c = useCompras(), ac = useAcoes(c), s = x.s, cfg = x.cfg, tipos = cfg.tipos, hoje = hojeSP();
  // link "Abrir solicitação" dos avisos do SorellyChat (18/11/2026): ?compra=<id> abre a ficha do pedido; a tela continua respeitando o acesso de quem abriu
  useEffect(function(){ try { var q = new URLSearchParams(window.location.search).get("compra"); if(q) ac.abrir(q); } catch(x0){} }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var mo = useState(props.modo || "quadro"), modo = mo[0], ft = useState(props.filtroInicial ? filtroDe(props.filtroInicial) : VAZIO_F), f = ft[0], svm = useState({}), vermais = svm[0];
  var sT = useState(tipos[0].id), sC = useState(""), sJ = useState(null), jan = sJ[0];
  var set = function(k, v){ ft[1](function(o){ var n = Object.assign({}, o); n[k] = v; return n; }); };
  var ativo = !!(f.setor || f.sol || f.urg || f.sit || f.cls), mes = hoje.slice(0, 7);
  var podeContar = x.pode("CONTAGEM"), podeComprar = x.pode("COMPRA");

  // ── compras
  var todas = baseLista(c);
  var lista = baseLista(c, {setorId:f.setor || undefined, urgencia:f.urg || undefined, classificacao:f.cls || undefined})
    .filter(function(p){ return (!f.sol || p.solicitante===f.sol) && passaSituacao(p, f.sit, mes); });
  var solicitantes = Object.keys(todas.reduce(function(o, p){ if(p.solicitante) o[p.solicitante] = 1; return o; }, {})).sort();
  var colunas = COLUNAS.filter(function(col){ return lista.some(function(p){ return colunaDe(p)===col.k; }); }).map(function(col, i){
    var it = lista.filter(function(p){ return colunaDe(p)===col.k; }), final = col.k==="entregue" || col.k==="reprovada" || col.k==="cancelada", lim = final ? LIMITE_FIM : LIMITE_COLUNA;
    it.sort(final ? function(a, b){ return String(ultimoEm(b)).localeCompare(String(ultimoEm(a))); } : function(a, b){ return String(ultimoEm(a)).localeCompare(String(ultimoEm(b))); });
    var atrC = it.filter(function(p){ return p.atrasado && FINAIS.indexOf(p.status)<0; }).length;
    return e("section",{key:col.k, className:"flex w-max min-w-[270px] shrink-0 flex-col gap-1.5 overflow-hidden rounded-md bg-black/20 pb-1.5"},
      e("div",{className:"flex h-7 items-center justify-between gap-2 bg-[var(--bloco-colunas)] px-2 text-[11px] font-bold uppercase"},
        e("span",{className:"whitespace-nowrap"}, (col.n ? col.n+" · " : "")+col.titulo),
        e("span",{className:"flex items-center gap-2 whitespace-nowrap tabular-nums"}, atrC>0 && e("span",{className:"text-destructive"}, plural(atrC, "atrasada", "atrasadas")), e("span",null, String(it.length)))),
      e("div",{className:"flex flex-col gap-1.5 px-1.5"},
        it.slice(0, lim+(vermais[col.k] || 0)).map(function(p){ return e(CartaoC,{key:p.id, p:p, hoje:hoje, abrir:function(){ ac.abrir(p.id); }}); }),
        (it.length>lim+(vermais[col.k] || 0) || vermais[col.k]>0) && e("div",{className:"flex gap-1"},
          it.length>lim+(vermais[col.k] || 0) && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, vermais); n[col.k] = (n[col.k] || 0)+PASSO; svm[1](n); }, className:"h-8 flex-1 rounded-md border border-dashed border-white/30 text-[13px] hover:bg-white/10"}, "Ver mais "+Math.min(PASSO, it.length-lim-(vermais[col.k] || 0))+" · faltam "+(it.length-lim-(vermais[col.k] || 0))),
          vermais[col.k]>0 && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, vermais); n[col.k] = 0; svm[1](n); }, className:"h-8 rounded-md border border-dashed border-white/30 px-3 text-[13px] hover:bg-white/10"}, "Ver menos"))));
  });
  var quadro = lista.length ? e("div",{className:"overflow-x-auto p-1"}, e("div",{className:"flex items-start gap-1", style:{width:"max-content"}}, colunas))
    : e(Vazio,{ic:"clipboard-text"}, todas.length ? "Nenhuma compra encontrada." : "Nenhuma compra registrada. Use \"Nova solicitação\" para começar.");

  // ── planilha das compras: filtro e ordem no título de cada coluna
  var linhasC = lista.slice().sort(function(a, b){ var fa = FINAIS.indexOf(a.status)>=0 ? 1 : 0, fb = FINAIS.indexOf(b.status)>=0 ? 1 : 0; return fa-fb || String(b.solicitadoEm).localeCompare(String(a.solicitadoEm)) || Number(b.id)-Number(a.id); }).map(function(p){
    return {id:p.id, _p:p, nr:"#"+p.id, cnpj:cnpjCurto(p) || "—", pago:p.pago ? "Sim" : "Não", data:String(p.solicitadoEm).slice(0, 10), compra:normal(p.titulo), forn:normal(p.fornecedor) || "—", sol:p.solicitante || "—", cls:normal(p.classificacoesTxt) || "—", valor:formatarReais(p.valorFinal), etapa:p.rotuloStatus, venc:p.proximoVencimento ? String(p.proximoVencimento).slice(0, 10) : "", atras:!!p.atrasado, vencido:!!p.vencido}; });
  var colsC = [{k:"nr", t:"Número"}, {k:"data", t:"Pedido", fmt:formatarDia}, {k:"compra", t:"Compra"}, {k:"forn", t:"Fornecedor"}, {k:"sol", t:"Solicitante"}, {k:"cls", t:"Classificação"}, {k:"cnpj", t:"CNPJ pagador"}, {k:"valor", t:"Valor"},
    {k:"etapa", t:"Etapa", cor:function(l){ return l.atras ? "text-destructive" : ""; }}, {k:"venc", t:"Vencimento", fmt:formatarDia, cor:function(l){ return l.vencido ? "text-destructive" : ""; }}, {k:"pago", t:"Pago", cor:function(l){ return l.pago==="Sim" ? "text-success" : ""; }}];
  var planilha = e(TabelaPlanilha,{key:"planC", cols:colsC, linhas:linhasC, chave:"id", grade:true, semContagem:true, limite:300, aoClicar:function(l){ ac.abrir(l._p.id); }, vazio:"Nenhuma compra encontrada.",
    totalRodape:function(ls){ var tot = ls.reduce(function(t, l){ return t+l._p.valorFinal; }, 0), pagar = ls.filter(function(l){ return PAGAVEL_STATUS.indexOf(l._p.status)>=0 && !l._p.pago; }).reduce(function(t, l){ return t+l._p.valorFinal; }, 0); return ["Total", "", ls.length+(ls.length===1 ? " compra" : " compras"), "", "", "", "", formatarReais(tot), "", "", "A pagar "+formatarReais(pagar)]; }});

  // ── estoque de material: um tipo por vez (Materiais e Embalagens, Limpeza, Materiais de Produção) e a categoria
  var tipo = tipos.some(function(t){ return t.id===sT[0]; }) ? sT[0] : tipos[0].id;
  var grupos = agruparPorStatus(s, tipo, {q:""}), catOps = grupos.filter(function(g){ return g.ativos.length; }).map(function(g){ return [String(g.categoria.id), g.categoria.nome]; }), cat = catOps.some(function(o){ return o[0]===sC[0]; }) ? sC[0] : "";
  var mats = [].concat.apply([], grupos.filter(function(g){ return !cat || String(g.categoria.id)===cat; }).map(function(g){ return g.ativos.map(function(m){ return {m:m, cat:g.categoria.nome}; }); }));
  var linhasE = mats.map(function(o){ var m = o.m, andamento = EM_ANDAMENTO.indexOf(m.situacao)>=0;
    return {id:m.id, _m:m, material:normal(m.material), cat:normal(o.cat), atual:num(m.estoqueAtual), min:num(m.estoqueMinimo), estoque:ROT_STATUS[m.status], st:m.status, compra:andamento ? (ROTULO_SITUACAO[m.situacao] || m.situacao) : m.status==="OK" ? "—" : "Solicitar", andamento:andamento, contar:""}; });
  var colsE = [{k:"material", t:"Material"}, {k:"cat", t:"Categoria"}, {k:"atual", t:"Atual", cor:function(l){ return COR_STATUS[l.st]; }}, {k:"min", t:"Mínimo"}, {k:"estoque", t:"Estoque", cor:function(l){ return COR_STATUS[l.st]; }},
    {k:"compra", t:"Compra", render:function(v, l){ return l.andamento || l.compra==="—" ? v : e("button",{type:"button", disabled:!podeComprar, onClick:function(ev){ ev.stopPropagation(); sJ[1](l._m.id); }, title:podeComprar ? "Pedir a compra deste material" : "Sem autorização para pedir compra", className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40"}, "Solicitar"); }},
    {k:"contar", t:"Contar", render:function(v, l){ return e(CelulaContar,{key:l.id+"|"+l._m.estoqueAtual, m:l._m, x:x, c:c, pode:podeContar}); }}];
  var estoque = e(TabelaPlanilha,{key:"planE"+tipo+cat, cols:colsE, linhas:linhasE, chave:"id", grade:true, semContagem:true, limite:300, vazio:"Nenhum material cadastrado nesta aba."});
  var mJan = jan ? mats.map(function(o){ return o.m; }).filter(function(m){ return String(m.id)===String(jan); })[0] : null;

  // faixa azul única, UMA linha só e compacta (Marcus, 17/11/2026): visão em menu suspenso, filtros estreitos, números curtos à direita e o botão principal
  var noEstoque = modo==="estoque";
  var sel = function(rotulo, valor, aoMudar, opcoes, semTodos){ return e("select",{"aria-label":rotulo, value:valor, onChange:function(ev){ aoMudar(ev.target.value); }, className:SEL+" w-auto max-w-[9.5rem] shrink-0"}, !semTodos && e("option",{value:""}, rotulo), opcoes.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })); };
  var faixa = e("div",{className:"flex flex-nowrap items-center gap-2 overflow-x-auto border-b-2 border-[var(--bloco-titulo)] bg-[var(--bloco-titulo)] px-2 py-1 text-white"},
    sel("Visão", modo, mo[1], [["quadro", "Quadro"], ["planilha", "Planilha"], ["estoque", "Estoque"]], true),
    !noEstoque && sel("Todos os setores", f.setor, function(v){ set("setor", v); }, s.ce.setores.map(function(t){ return [String(t.id), t.nome]; })),
    !noEstoque && sel("Todos os solicitantes", f.sol, function(v){ set("sol", v); }, solicitantes.map(function(n){ return [n, n]; })),
    !noEstoque && sel("Toda urgência", f.urg, function(v){ set("urg", v); }, [["ALTA", "Alta"], ["MEDIA", "Média"], ["BAIXA", "Baixa"]]),
    !noEstoque && sel("Toda classificação", f.cls, function(v){ set("cls", v); }, cfg.classificacoes.map(function(t){ return [t.id, t.nome]; })),
    !noEstoque && sel("Todas as situações", f.sit, function(v){ set("sit", v); }, SITUACOES),
    !noEstoque && ativo && e("button",{type:"button", onClick:function(){ ft[1](VAZIO_F); }, className:BTN}, "Limpar"),
    noEstoque && sel("Tipo", tipo, function(k){ sT[1](k); sC[1](""); }, tipos.map(function(t){ return [t.id, t.nome]; }), true),
    noEstoque && sel("Categoria", cat, function(v){ sC[1](v); }, catOps),
    modo==="planilha" && e("button",{type:"button", disabled:!lista.length, onClick:function(){ baixarCsv("compras-"+hojeSP()+".csv", csvDe(lista)); c.aviso("Planilha exportada.", "ok"); }, className:BTN+" ml-auto shrink-0"}, "Exportar CSV"),
    e("button",{type:"button", onClick:ac.nova, className:BTN+" !bg-white !text-[#14233f] shrink-0"+(modo==="planilha" ? "" : " ml-auto")}, "Nova solicitação"));
  return e(Pagina,{className:PADRAO_BLOCOS+" -mx-2 -mb-2 -mt-5 md:-mx-3 md:-mb-3"},
    e(BlocoPainel,{titulo:"Funil de compras", compacto:true}, faixa, modo==="planilha" ? planilha : noEstoque ? estoque : quadro),
    mJan && e(JanelaPedir,{m:mJan, x:x, pode:{compra:podeComprar}, fechar:function(){ sJ[1](null); }, verCompra:function(cp){ if(cp && cp.tipo==="pedido") ac.abrir(cp.id); }}),
    ac.janelas());
}

export { PainelComprasEstoque };

// Sorelly Admin · montagem — pages/compras/PainelComprasEstoque.js
// PAINEL "Compras e estoque" (layout D1, escolhido pelo Marcus em 09/11/2026): o estoque fica EM CIMA, o quadro de Compras EMBAIXO, na largura toda.
//   Em cima, lado a lado: a planilha do estoque com a coluna Contar (contagem na própria linha) e a lista "Precisa de compra" (crítico e atenção, botão Solicitar).
//   Embaixo: o quadro das compras (o mesmo das telas antigas: aprovar, liberar, comprar, receber, entregar), sem a faixa de números.
// Regras e estado em domain/compras-estoque.js (s.ce, ações CE). Aqui só desenho e chamo as ações que já existiam (estoque_contagem, sol_add, aprovar...).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ESTADO } from "@/apps/montagem/components/padrao";
import { Botao, CAMPO, FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { ROTULO_SITUACAO, agruparPorStatus, hojeSP } from "@/apps/montagem/domain/compras-estoque";
import { COLUNAS, COL_DE, CartaoCompra, FINAIS, baseLista, mover, ultimoEm } from "@/apps/montagem/pages/compras/Compras";
import { JanelaPedir } from "@/apps/montagem/pages/compras/EstoqueMaterial";
import { useAcoes } from "@/apps/montagem/pages/compras/janelas";
import { useCompras } from "@/apps/montagem/pages/compras/pecas";
import { useCe } from "@/apps/montagem/pages/compras/visualCompras";
import { Kanban } from "@/shared/kanban";
import { e, useState } from "@/shared/react";

var COR_STATUS = {CRITICO:ESTADO.ruim, ATENCAO:ESTADO.alerta, OK:ESTADO.ok};
var ROT_STATUS = {CRITICO:"Crítico", ATENCAO:"Atenção", OK:"OK"};
var LIM = 12;   // linhas mostradas de cada tabela do estoque antes do "Ver mais" (nada de rolagem dentro do bloco; o quadro de Compras tem que continuar perto)
var EM_ANDAMENTO = ["SOLICITADO", "AGUARDANDO_APROVACAO", "AGUARDANDO_ENTREGA"];   // situações da compra de material que já estão a caminho
var num = function(n){ return Number(n || 0).toLocaleString("pt-BR"); };
var estadoInicial = function(){ return {q:"", setor:"", sit:"aberto", urg:"", oculta:true}; };   // abre só com o que está em aberto: as compras já entregues (100 ou mais) alongariam o quadro; "Todos os itens" mostra tudo

// contagem na própria linha: digita a quantidade contada e confirma (a data é hoje e quem contou é quem está logado)
function CelulaContar(p){
  var st = useState(""), v = st[0], m = p.m, x = p.x;
  var salvar = function(){
    var n = Number(v);
    if(v==="" || isNaN(n) || n<0) return p.c.aviso("Informe a quantidade contada (número de 0 em diante).");
    if(x.exec("estoque_contagem", {id:m.id, valor:Math.round(n), quem:x.por, data:hojeSP(), motivo:""})) st[1]("");
  };
  return e("span",{className:"flex items-center gap-1.5"},
    e("input",{type:"number", min:0, value:v, placeholder:String(m.estoqueAtual), disabled:!p.pode, "aria-label":"Quantidade contada de "+m.material, onChange:function(ev){ st[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") salvar(); }, className:CAMPO+" w-20 text-center tabular-nums"}),
    e("button",{type:"button", disabled:!p.pode || v==="", onClick:salvar, title:p.pode ? "Registrar a contagem" : "Sem autorização para contar", className:"h-8 rounded-md border border-border bg-card px-2.5 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40"}, "OK"));
}

function PainelComprasEstoque(){
  var x = useCe(), c = useCompras(), ac = useAcoes(c), s = x.s, cfg = x.cfg, tipos = cfg.tipos, hoje = hojeSP();
  var sf = useState(estadoInicial()), f = sf[0], sT = useState(tipos[0].id), sJ = useState(null), jan = sJ[0], sC = useState(""), sV = useState({plan:false, prec:false});
  var tipo = tipos.some(function(t){ return t.id===sT[0]; }) ? sT[0] : tipos[0].id;
  var set = function(k, v){ var n = Object.assign({}, f); n[k] = v; sf[1](n); };
  var podeContar = x.pode("CONTAGEM"), podeComprar = x.pode("COMPRA");

  // ── estoque (em cima)
  var grupos = agruparPorStatus(s, tipo, {q:f.q}), catOps = grupos.filter(function(g){ return g.ativos.length; }).map(function(g){ return [String(g.categoria.id), g.categoria.nome]; }), cat = catOps.some(function(o){ return o[0]===sC[0]; }) ? sC[0] : "";
  var mats = [].concat.apply([], grupos.filter(function(g){ return !cat || String(g.categoria.id)===cat; }).map(function(g){ return g.ativos; }));
  var precisa = mats.filter(function(m){ return m.status!=="OK"; });
  var mJan = jan ? mats.filter(function(m){ return String(m.id)===String(jan); })[0] : null;
  var estado = function(m){ return {v:"● "+ROT_STATUS[m.status], cor:COR_STATUS[m.status]}; };
  var nome = function(m){ return e("b",null, m.material); };
  var maisBt = function(chave, total){ return total>LIM && e("button",{type:"button", onClick:function(){ var n = Object.assign({}, sV[0]); n[chave] = !n[chave]; sV[1](n); }, className:"mt-2 h-8 w-full rounded-md border border-border bg-card text-[13px] font-semibold hover:bg-white/10"}, sV[0][chave] ? "Ver menos" : "Ver mais "+(total-LIM)); };
  var matsVis = sV[0].plan ? mats : mats.slice(0, LIM), precisaVis = sV[0].prec ? precisa : precisa.slice(0, LIM);
  var tabPlanilha = mats.length ? e(TabelaCampos,{cols:[{t:"Material", w:"1.8fr"}, {t:"Atual", w:"4.5rem"}, {t:"Mín.", w:"4.5rem"}, {t:"Estoque", w:"6.5rem"}, {t:"Contar", w:"9.5rem"}], minW:"52rem"},
      matsVis.map(function(m){ return e(FileiraCampos,{key:m.id, cells:[nome(m), {v:num(m.estoqueAtual), cor:COR_STATUS[m.status]}, num(m.estoqueMinimo), estado(m), e(CelulaContar,{key:m.id+"|"+m.estoqueAtual, m:m, x:x, c:c, pode:podeContar})]}); }))
    : e("p",{className:"py-3 text-center text-[13px]"}, f.q ? "Nenhum material encontrado com a busca." : "Nenhum material cadastrado nesta aba.");
  var tabPrecisa = precisa.length ? e(TabelaCampos,{cols:[{t:"Material", w:"1.8fr"}, {t:"Atual", w:"4.5rem"}, {t:"Mín.", w:"4.5rem"}, {t:"Estoque", w:"6.5rem"}, {t:"Compra", w:"9.5rem"}], minW:"52rem"},
      precisaVis.map(function(m){ var andamento = EM_ANDAMENTO.indexOf(m.situacao)>=0;
        return e(FileiraCampos,{key:m.id, cells:[nome(m), {v:num(m.estoqueAtual), cor:COR_STATUS[m.status]}, num(m.estoqueMinimo), estado(m),
          andamento ? (ROTULO_SITUACAO[m.situacao] || m.situacao) : e("button",{type:"button", disabled:!podeComprar, onClick:function(){ sJ[1](m.id); }, title:podeComprar ? "Pedir a compra deste material" : "Sem autorização para pedir compra", className:"h-8 rounded-md border border-border bg-card px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-40"}, "Solicitar")]}); }))
    : e("p",{className:"py-3 text-center text-[13px]"}, "Nada crítico nem em atenção nesta aba.");

  // ── compras (embaixo)
  var todas = baseLista(c);
  var lista = baseLista(c, {q:f.q, setorId:f.setor || undefined, urgencia:f.urg || undefined, atrasada:f.sit==="atrasadas" || undefined})
    .filter(function(p){ var fim = FINAIS.indexOf(p.status)>=0; return f.sit==="aberto" ? !fim : f.sit==="finalizados" ? fim : true; });
  var cols = COLUNAS.map(function(col){
    var itens = lista.filter(function(p){ return COL_DE[p.status]===col.k; }).map(function(p){ return Object.assign({}, p, {arrastavel:FINAIS.indexOf(p.status)<0}); });
    if(["solicitada", "aprovada", "liberada", "efetuada", "transito"].indexOf(col.k)>=0) itens.sort(function(a, b){ return String(ultimoEm(a)).localeCompare(String(ultimoEm(b))); });
    else itens.sort(function(a, b){ return (a.status==="ENTREGUE" ? 1 : 0)-(b.status==="ENTREGUE" ? 1 : 0) || String(ultimoEm(b)).localeCompare(String(ultimoEm(a))); });
    return Object.assign({}, col, {itens:itens, aceita:true});
  });
  var vazias = cols.filter(function(col){ return !col.itens.length; }).length;
  var visiveis = f.oculta ? cols.filter(function(col){ return col.itens.length; }) : cols;
  var ativo = !!(f.q || f.setor || f.urg || f.sit!=="aberto");

  var selFiltro = function(k, rot, ops){ return e("div",{className:"w-48 shrink-0"}, e("select",{value:f[k], "aria-label":rot, onChange:function(ev){ set(k, ev.target.value); }, className:CAMPO+" cursor-pointer text-center"}, e("option",{value:""}, rot), ops.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e("div",{className:"flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/60 p-2"},
      e("div",{className:"min-w-56 flex-1"}, e("input",{type:"search", value:f.q, placeholder:"Buscar item, solicitante ou fornecedor", "aria-label":"Buscar", onChange:function(ev){ set("q", ev.target.value); }, className:CAMPO+" text-center"})),
      selFiltro("setor", "Todos os setores", s.ce.setores.map(function(t){ return [String(t.id), t.nome]; })),
      selFiltro("sit", "Todos os itens", [["aberto", "Em aberto"], ["atrasadas", "Atrasadas"], ["finalizados", "Finalizados"]]),
      selFiltro("urg", "Toda urgência", [["ALTA", "Alta"], ["MEDIA", "Média"], ["BAIXA", "Baixa"]]),
      ativo && e(Botao,{onClick:function(){ sf[1](Object.assign(estadoInicial(), {oculta:f.oculta})); }}, "Limpar"),
      e(Botao,{principal:f.oculta, onClick:function(){ set("oculta", !f.oculta); }}, "Ocultar vazias ("+vazias+")"),
      e(Botao,{principal:true, onClick:ac.nova}, "+ Nova solicitação")),
    e("div",{className:"flex flex-wrap items-center gap-2"}, e("b",{className:"text-[13px]"}, "Estoque de material"),
      e(Segmentado,{opcoes:tipos.map(function(t){ return [t.id, t.nome]; }), atual:tipo, onMudar:function(k){ sT[1](k); sC[1](""); sV[1]({plan:false, prec:false}); }}),
      e("div",{className:"w-64 shrink-0"}, e("select",{value:cat, "aria-label":"Categoria", onChange:function(ev){ sC[1](ev.target.value); sV[1]({plan:false, prec:false}); }, className:CAMPO+" cursor-pointer text-center"}, e("option",{value:""}, "Todas as categorias"), catOps.map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); })))),
    e("div",{className:"grid grid-cols-1 items-start gap-2.5 min-[1800px]:grid-cols-2"},
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Planilha com contagem", dir:mats.length+(mats.length===1 ? " item" : " itens")}, e("div",{className:"p-2"}, tabPlanilha, maisBt("plan", mats.length))),
      e(BlocoBarra,{cor:"azul", compacto:true, t:"Precisa de compra", dir:precisa.length+(precisa.length===1 ? " item" : " itens")}, e("div",{className:"p-2"}, tabPrecisa, maisBt("prec", precisa.length)))),
    todas.length===0 && e("p",{className:"rounded-xl bg-black/20 px-3 py-2 text-center text-[13px]"}, "Nenhuma compra registrada. Use \"Nova solicitação\" para começar."),
    e(BlocoBarra,{cor:"azul", compacto:true, t:"Compras · quadro", dir:lista.length+(lista.length===1 ? " compra" : " compras")},
      e("div",{className:"p-2"}, e(Kanban,{colunas:visiveis, unidade:["compra", "compras"], vazio:"Nenhuma compra nesta etapa.",
        card:function(it){ return e(CartaoCompra,{p:it, c:c, ac:ac, hoje:hoje}); },
        onMover:function(it, de, para){ mover(c, ac, it, de, para); },
        onAbrir:function(it){ ac.abrir(it.id); }}))),
    mJan && e(JanelaPedir,{m:mJan, x:x, pode:{compra:podeComprar}, fechar:function(){ sJ[1](null); }}),
    ac.janelas());
}

export { PainelComprasEstoque };

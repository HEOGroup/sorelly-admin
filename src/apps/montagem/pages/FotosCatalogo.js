// Sorelly Admin · montagem — pages/FotosCatalogo.js
// Marketing › Fotos de catálogo (10/11/2026, pedido do Marcus): controle das fotos das peças NOVAS (fotografar → editar → subir na DevMaster). Substitui a planilha "Fotos App Sorelly".
// LAYOUT 3 escolhido pelo Marcus (docs/ideias/marketing-fotos-planilha-4-layouts.html): jeito da planilha antiga, sem quadro de cartões.
//   Uma linha com os totais em cima; abas Listagem | Progresso por categoria | Produção diária; a Listagem tem TODOS os códigos (17 mil da planilha antiga + os novos),
//   colunas Código, Categoria, Foto, Quem fotografou, Editada, Quem editou, Sistema, Quem subiu e Observações, filtro no título de cada coluna, 300 linhas por vez.
// Regras e contas em domain/fotos-catalogo.js (estado s.fc, ação FC).
import { ESTADO, Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, Botao, CAMPO, CampoSel, FileiraCampos, Rotulo, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDia, hojeSP, linhasFotos, lerCodigos, parteDia, porCategoria, producaoDias, resumoGeral, temposMedios } from "@/apps/montagem/domain/fotos-catalogo";
import { CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var ETAPAS_LOTE = [["foto", "Fotografada"], ["ed", "Editada"], ["sub", "Na DevMaster"]];
var N = function(v){ return v==null ? "—" : Number(v).toLocaleString("pt-BR"); };
var PCT = function(n, tot){ return tot ? (n/tot*100).toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%" : "—"; };
var COR = {foto:"#5B8DEF", ed:"#A78BFA", sub:"#2DD4BF"};   // as três etapas (mesmas cores das fases de Cadastro de peças › Pedidos)
var ABAS = [["lista", "Listagem"], ["cat", "Progresso por categoria"], ["dia", "Produção diária"]];
var BTN_ICONE = "h-[30px] w-8 rounded-md border border-border bg-card text-[13px] hover:bg-white/10";
var BTN_MARCAR = "h-[30px] rounded-md border border-primary bg-primary/20 px-3 text-[13px] font-semibold text-primary hover:bg-primary/30";

// painel de lançamento: colar códigos novos ou marcar uma etapa em vários códigos de uma vez
function Lancar(){
  var cx = use(), s = cx.state, d = cx.dispatch, hoje = hojeSP();
  var sm = useState("cad"), modo = sm[0], st = useState(""), texto = st[0], sd = useState(hoje), dia = sd[0], se = useState("foto"), etapa = se[0];
  var lido = lerCodigos(texto);
  var enviar = function(){
    if(modo==="cad") d({type:"FC", op:"cod_add", texto:texto, dia:dia, por:porDe(s)});
    else d({type:"FC", op:"etapa_lote", texto:texto, etapa:etapa, por:porDe(s)});
    st[1]("");
  };
  return e(Bloco,{t:modo==="cad" ? "Lançar códigos novos" : "Marcar etapa em vários códigos", dir:e(Segmentado,{opcoes:[["cad", "Lançar códigos"], ["lote", "Marcar etapa"]], atual:modo, onMudar:sm[1]})},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      modo==="cad" ? e(CampoTexto,{t:"Data do cadastro", id:"fc-dia", tipo:"date", value:dia, max:hoje, onChange:function(v){ if(v) sd[1](v); }})
        : e(CampoSel,{t:"Etapa concluída", id:"fc-etapa", value:etapa, onChange:se[1], opcoes:ETAPAS_LOTE}),
      e("div",{className:"col-span-2 md:col-span-3"}, e(Rotulo,{t:"Códigos (um por linha, ou separados por espaço ou vírgula)", id:"fc-cods"}),
        e("textarea",{id:"fc-cods", value:texto, onChange:function(ev){ st[1](ev.target.value); }, placeholder:"BB1620\nCL2551\nP2210", rows:3, className:CAMPO+" h-[76px] py-1.5"})),
      e("div",{className:"col-span-2 flex items-center justify-between gap-2 md:col-span-4"},
        e("span",{className:"text-[13px]"}, lido.validos.length ? lido.validos.length+(lido.validos.length===1 ? " código válido" : " códigos válidos")+(lido.invalidos.length ? " · "+lido.invalidos.length+" ignorados" : "") : "Cole os códigos aqui."),
        e(Botao,{principal:true, desabilitado:!lido.validos.length, onClick:enviar}, modo==="cad" ? "Lançar" : "Marcar"))));
}

// PAINEL DO ALTO (Marcus, 10/11/2026: "lá no topo colocar um negócio assim", foto do alto da planilha antiga): título, total e fotos restantes à esquerda e quatro células
// coloridas (Diversas, Foto, Editada, Sistema) com o número e a porcentagem. EXCEÇÃO pedida pelo Marcus à regra de "sem faixa de totais no topo" (padrao-ok).
var PCT2 = function(n, tot){ return tot ? (n/tot*100).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})+"%" : "—"; };
function Painel(p){
  var g = useMemo(function(){ return resumoGeral(p.fc); }, [p.fc]), restantes = g.semFoto+g.aguardando;
  var celulas = [["Foto", "📷", g.foto, "#36A854"], ["Editada", "✏️", g.ed, "#FF9A00"], ["Sistema", "💾", g.sub, "#1E1EE6"]];
  var rotulo = "flex h-9 items-center justify-center gap-2 text-[13px] font-bold uppercase tracking-[.05em] text-white";   // padrao-ok
  var grande = "flex h-12 items-center justify-center text-[20px] font-bold tabular-nums text-white";   // padrao-ok
  var escuro = "bg-[#131a2b]";
  return e("section",{className:"overflow-hidden rounded-lg border-2 border-white/60"},
    e("div",{className:"flex h-9 items-center justify-center border-b-2 border-white/60 text-[13px] font-bold uppercase tracking-[.05em] "+escuro}, "Sorelly Group — Controle de fotos SKU"),
    e("div",{className:"grid gap-0.5 bg-white/60 grid-cols-[minmax(160px,1fr)_repeat(3,minmax(0,1.6fr))]"},   // fio de 2 px entre todas as células, como na planilha
      e("div",{className:"flex flex-col items-center justify-center gap-1 [grid-row:span_2] "+escuro}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Total de códigos"), e("b",{className:"text-[20px] tabular-nums"}, N(g.total))),
      celulas.map(function(c){ return e("div",{key:"r"+c[0], className:rotulo, style:{background:c[3]}}, e("span",{"aria-hidden":true}, c[1]), c[0]); }),
      celulas.map(function(c){ return e("div",{key:"n"+c[0], className:grande, style:{background:c[3]}}, N(c[2])); }),
      e("div",{className:"flex flex-col items-center justify-center "+escuro}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em] text-[#F87171]"}, "Fotos restantes"), e("b",{className:"text-[20px] tabular-nums text-[#F87171]"}, N(restantes))),
      celulas.map(function(c){ return e("div",{key:"p"+c[0], className:"flex h-14 flex-col items-center justify-center gap-1.5 px-4 text-white", style:{background:c[3]}},
        e("b",{className:"text-[20px] italic tabular-nums"}, PCT2(c[2], g.total)),
        e("span",{className:"block h-1.5 w-full overflow-hidden rounded bg-black/30"}, e("i",{className:"block h-full bg-white", style:{width:Math.max(1, Math.round(c[2]/g.total*100))+"%"}}))); })));
}

function Categorias(p){
  var g = useMemo(function(){ return resumoGeral(p.fc); }, [p.fc]), cats = useMemo(function(){ return porCategoria(p.fc); }, [p.fc]);
  var linhas = cats.map(function(c){ return e(FileiraCampos,{key:c.cat, cells:[c.cat, N(c.total), N(c.foto), PCT(c.foto, c.total), N(c.ed), PCT(c.ed, c.total), N(c.sub), PCT(c.sub, c.total)]}); });
  linhas.push(e(FileiraCampos,{key:"total", total:true, cells:["Todas as categorias", N(g.total), N(g.foto), PCT(g.foto, g.total), N(g.ed), PCT(g.ed, g.total), N(g.sub), PCT(g.sub, g.total)]}));
  return e(Bloco,{t:"Progresso por categoria"},
    e(TabelaCampos,{minW:"760px", cols:[{t:"Categoria", w:"200px"}, {t:"Total", w:"90px"}, {t:"Foto", w:"90px"}, {t:"% foto", w:"90px"}, {t:"Editada", w:"90px"}, {t:"% editada", w:"100px"}, {t:"Sistema", w:"90px"}, {t:"% sistema", w:"1fr"}]}, linhas));
}

function Producao(p){
  var fc = p.fc, hoje = hojeSP(), dias = producaoDias(fc, 30);
  var soma = function(k){ return dias.reduce(function(t, x){ return t+x[k]; }, 0); }, med = function(k){ return dias.length ? Math.round(soma(k)/dias.length) : null; };
  var tHoje = temposMedios(fc, function(iso){ return parteDia(iso)===hoje; }), tMes = temposMedios(fc, function(iso){ return String(iso||"").slice(0, 7)===hoje.slice(0, 7); });
  var linhas = dias.map(function(x){ return e(FileiraCampos,{key:x.dia, cells:[formatarDia(x.dia), N(x.fotos), N(x.editadas), N(x.sistema)]}); });
  if(dias.length) linhas.push(e(FileiraCampos,{key:"med", total:true, cells:["Média por dia (últimos "+dias.length+" dias)", N(med("fotos")), N(med("editadas")), N(med("sistema"))]}));
  return e("div",{className:"grid items-start gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]"},
    e(Bloco,{t:"Produção diária"},
      e(TabelaCampos,{minW:"420px", cols:[{t:"Data", w:"34%"}, {t:"Fotos tiradas", w:"22%"}, {t:"Fotos editadas", w:"22%"}, {t:"Fotos no sistema", w:"1fr"}]}, dias.length ? linhas : [e(FileiraCampos,{key:"v", cells:["Nenhum dia com produção", "", "", ""]})])),
    e(Bloco,{t:"Tempo médio (códigos novos)"},
      e(TabelaCampos,{minW:"420px", cols:[{t:"Etapa", w:"52%"}, {t:"Hoje", w:"22%"}, {t:"Mês", w:"1fr"}]}, [
        ["Do cadastro à foto", tHoje.aFoto, tMes.aFoto], ["Da foto à edição", tHoje.aEdicao, tMes.aEdicao], ["Da edição à DevMaster", tHoje.aDevmaster, tMes.aDevmaster]
      ].map(function(l){ return e(FileiraCampos,{key:l[0], cells:l}); }).concat([e(FileiraCampos,{key:"tt", total:true, cells:["Do cadastro à DevMaster", tHoje.total, tMes.total]})]))));
}

// coluna de etapa (Foto, Editada ou Sistema): "Ok" quando feita; botão para marcar quando a etapa anterior está feita; "—" quando ainda não dá
function colEtapa(cfg, acao){
  return {k:cfg.k, t:cfg.t, corTopo:COR[cfg.etapa], fmt:function(v){ return v; }, render:function(v, l){
    var icone = function(txt, titulo, onClick){ return e("button",{type:"button", title:titulo, "aria-label":titulo+" "+l.cod, onClick:onClick, className:BTN_ICONE}, txt); };
    if(l[cfg.ok]) return e("span",{className:"inline-flex items-center gap-1.5", title:l[cfg.data] || "Feito antes do sistema ou confirmado pela DevMaster"},
      e("span",{style:{color:ESTADO.ok}}, "Ok"), !l.antigo && cfg.ultima(l) ? icone("↶", "Desfazer a última etapa de", function(){ acao("desfazer", l.cod); }) : null);
    if(cfg.antes && !l[cfg.antes]) return "—";
    return e("span",{className:"inline-flex items-center gap-1.5"},
      l.esp && cfg.etapa==="foto" ? e("span",{style:{color:ESTADO.alerta}}, l.esp) : null,
      e("button",{type:"button", title:cfg.titulo+" "+l.cod, onClick:function(){ acao("etapa", l.cod, cfg.etapa); }, className:BTN_MARCAR}, cfg.botao),
      cfg.etapa==="foto" && !l.antigo ? icone("✕", "Excluir o código", function(){ if(window.confirm("Excluir o código "+l.cod+"?")) acao("cod_del", l.cod); }) : null);
  }};
}
function colunas(acao){
  var t = function(v){ return v==null || v==="" ? "—" : String(v); };
  return [
    {k:"cod", t:"Código", fmt:t},
    {k:"cat", t:"Categoria", fmt:t},
    colEtapa({k:"fotoTxt", t:"Foto", etapa:"foto", ok:"fOk", data:"fotoData", botao:"Marcar ›", titulo:"Marcar a foto de", ultima:function(l){ return !l.eOk; }}, acao),
    {k:"fotoQuem", t:"Quem fotografou", corTopo:COR.foto, fmt:t},
    colEtapa({k:"edTxt", t:"Editada", etapa:"ed", ok:"eOk", data:"edData", antes:"fOk", botao:"Marcar ›", titulo:"Marcar a edição de", ultima:function(l){ return !l.sOk; }}, acao),
    {k:"edQuem", t:"Quem editou", corTopo:COR.ed, fmt:t},
    colEtapa({k:"subTxt", t:"Sistema", etapa:"sub", ok:"sOk", data:"subData", antes:"eOk", botao:"Subir ›", titulo:"Subir na DevMaster o código", ultima:function(){ return true; }}, acao),
    {k:"subQuem", t:"Quem subiu", corTopo:COR.sub, fmt:t},
    {k:"obs", t:"Observações", fmt:t}];
}

function AbaFotosCatalogo(){
  var cx = use(), s = cx.state, d = cx.dispatch, fc = s.fc, sl = useState(false), lancar = sl[0], sa = useState("lista"), aba = sa[0];
  var linhas = useMemo(function(){ return fc ? linhasFotos(fc).map(function(l){ return Object.assign({}, l, {fotoTxt:l.fOk ? "Ok" : (l.esp || "Falta"), edTxt:l.eOk ? "Ok" : "Falta", subTxt:l.sOk ? "Ok" : "Falta"}); }) : []; }, [fc]);
  var cols = useMemo(function(){ return colunas(function(op, cod, etapa){ d({type:"FC", op:op, cod:cod, etapa:etapa, por:porDe(s)}); }); }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  // código novo cadastrado na DevMaster (Rayssa) entra sozinho aqui: consulta a cada 2 minutos enquanto a tela está aberta; foto já subida na DevMaster marca o Sistema
  useEffect(function(){
    if(!apiAtiva() || !token()) return undefined;
    var vivo = true, rodar = function(){ chamar("GET", "/fotos/dm?dias=60").then(function(r){ if(vivo && r && Array.isArray(r.itens)) d({type:"FC", op:"dm_sync", itens:r.itens, por:"DevMaster"}); }).catch(function(){}); };
    rodar(); var iv = setInterval(rodar, 120000); return function(){ vivo = false; clearInterval(iv); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var cab = e(PageHead,{t:"Fotos de catálogo", sub:"Fotografar, editar e subir na DevMaster cada peça."+(fc && fc.dmEm ? " Códigos novos vêm da DevMaster sozinhos (última leitura às "+String(fc.dmEm).slice(11, 16)+")." : "")}, e(Botao,{principal:!lancar, onClick:function(){ sl[1](!lancar); }}, lancar ? "Fechar" : "Lançar ou marcar"));
  if(!fc) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados das fotos de catálogo indisponíveis."));
  return e(Pagina,null, cab,
    lancar && e(Lancar),
    e(Painel,{fc:fc}),
    e(AbasTela,{abas:ABAS, atual:aba, onMudar:sa[1]}),
    aba==="lista" ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, vazio:"Nenhum código lançado. Use \"Lançar ou marcar\" para colar os códigos novos."})
      : aba==="cat" ? e(Categorias,{fc:fc}) : e(Producao,{fc:fc}));
}

export { AbaFotosCatalogo };

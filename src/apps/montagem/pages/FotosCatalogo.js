// Sorelly Admin · montagem — pages/FotosCatalogo.js
// Marketing › Fotos de catálogo (10/11/2026, pedido do Marcus): controle das fotos das peças NOVAS (fotografar → editar → subir na DevMaster). Substitui a planilha "Fotos App Sorelly".
// LAYOUT 3 escolhido pelo Marcus (docs/ideias/marketing-fotos-planilha-4-layouts.html): jeito da planilha antiga, sem quadro de cartões.
//   Uma linha com os totais em cima; abas Listagem | Progresso por categoria | Produção diária; a Listagem tem TODOS os códigos (17 mil da planilha antiga + os novos),
//   colunas Código, Categoria, Foto, Quem fotografou, Editada, Quem editou, Sistema, Quem subiu e Observações, filtro no título de cada coluna, 300 linhas por vez.
// Regras e contas em domain/fotos-catalogo.js (estado s.fc, ação FC).
import { BKC } from "@/apps/montagem/lib/format";
import { ESTADO, Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, Botao, CAMPO, CampoSel, FileiraCampos, Rotulo, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { formatarDia, hojeSP, linhasFotos, METAS, metaProgresso, lerCodigos, parteDia, porCategoria, producaoDias, resumoDoDia, resumoGeral, temposMedios } from "@/apps/montagem/domain/fotos-catalogo";
import { CampoTexto, porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var ORDEM = new Intl.Collator("pt-BR", {numeric:true, sensitivity:"base"});   // A2039 antes de A2040, 2B0001 antes de 2B0072

var ETAPAS_LOTE = [["foto", "Fotografada"], ["ed", "Editada"], ["sub", "Na DevMaster"]];
var N = function(v){ return v==null ? "—" : Number(v).toLocaleString("pt-BR"); };
var PCT = function(n, tot){ return tot ? (n/tot*100).toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%" : "—"; };
var COR = {foto:"#5B8DEF", ed:"#A78BFA", sub:"#2DD4BF"};   // as três etapas (mesmas cores das fases de Cadastro de peças › Pedidos)
var ABAS = [["lista", "Listagem"],["cat", "Progresso por categoria"], ["dia", "Produção diária"], ["proc", "Processos"], ["meta", "Meta"]];
// botões pequenos dentro da linha (Marcus, 10/11/2026: "esse botão marcar está uma merda, diminui ele"): 22 px de altura, texto 11 px
var BTN_ICONE = "h-[22px] w-6 rounded border border-border bg-card text-[11px] leading-none hover:bg-white/10"; // padrao-ok
var BTN_MARCAR = "h-[22px] rounded border border-primary/60 px-2 text-[11px] font-semibold leading-none text-primary hover:bg-primary/20"; // padrao-ok

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
  var hoje = hojeSP(), mt = METAS.filter(function(x){ return x.fim>=hoje; })[0] || METAS[METAS.length-1], mr = metaProgresso(p.fc, mt, hoje);
  var corMeta = mr.situacao==="Batida" ? ESTADO.ok : mr.situacao==="Não batida" ? ESTADO.erro : ESTADO.alerta;
  var celulas = [["Foto", "📷", g.foto, "#36A854"], ["Editada", "✏️", g.ed, "#FF9A00"], ["Sistema", "💾", g.sub, "#1E1EE6"]];
  var rotulo = "flex h-7 items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[.05em] text-white";   // padrao-ok
  var grande = "flex h-9 items-center justify-center text-[16px] font-bold tabular-nums text-white";   // padrao-ok
  var escuro = "bg-[#131a2b]";
  return e("section",{className:"overflow-hidden rounded-lg border-2 border-white/60"},   // sem a faixa de título "Sorelly Group" (Marcus, 10/11/2026: "não precisa ter isso")
    e("div",{className:"grid gap-0.5 bg-white/60 grid-cols-[minmax(160px,1fr)_repeat(3,minmax(0,1.6fr))]"},   // fio de 2 px entre todas as células, como na planilha
      e("div",{className:"flex flex-col items-center justify-center gap-0.5 [grid-row:span_2] "+escuro}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Total de códigos"), e("b",{className:"text-[16px] tabular-nums"}, N(g.total))),
      celulas.map(function(c){ return e("div",{key:"r"+c[0], className:rotulo, style:{background:c[3]}}, e("span",{"aria-hidden":true}, c[1]), c[0]); }),
      celulas.map(function(c){ return e("div",{key:"n"+c[0], className:grande, style:{background:c[3]}}, N(c[2])); }),
      e("div",{className:"flex flex-col items-center justify-center "+escuro}, e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em] text-[#F87171]"}, "Fotos restantes"), e("b",{className:"text-[16px] tabular-nums text-[#F87171]"}, N(restantes))),
      celulas.map(function(c){ return e("div",{key:"p"+c[0], className:"flex h-10 flex-col items-center justify-center gap-1 px-4 text-white", style:{background:c[3]}},
        e("b",{className:"text-[14px] italic tabular-nums"}, PCT2(c[2], g.total)),
        e("span",{className:"block h-1 w-full overflow-hidden rounded bg-black/30"}, e("i",{className:"block h-full bg-white", style:{width:Math.max(1, Math.round(c[2]/g.total*100))+"%"}}))); })),
    // status da meta sempre à vista (Marcus, 10/11/2026: "tem que ficar lá aparecendo o status da meta")
    e("div",{className:"flex flex-wrap items-center gap-x-5 gap-y-1 border-t-2 border-white/60 px-3 py-1.5 "+escuro},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Meta · até "+formatarDia(mt.fim)),
      e("b",{className:"text-[14px] tabular-nums"}, N(mr.feitas)+" de "+N(mt.alvo)+" fotos"),
      e("span",{className:"text-[13px] tabular-nums"}, "Falta "+N(mr.falta)+(mr.restam && mr.falta ? " · "+N(mr.porDia)+" por dia" : "")),
      e("span",{className:"block h-1.5 min-w-[140px] flex-1 overflow-hidden rounded bg-black/30"}, e("i",{className:"block h-full", style:{width:Math.max(1, Math.round(mr.pct))+"%", background:corMeta}})),
      e("b",{className:"text-[14px] tabular-nums"}, PCT(mr.feitas, mt.alvo)),
      e("b",{className:"text-[13px]", style:{color:corMeta}}, mr.situacao),
      e("span",{className:"text-[13px] tabular-nums"}, "Bônus "+BKC(mt.bonus))));
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
    colEtapa({k:"fotoTxt", t:"Foto", etapa:"foto", ok:"fOk", data:"fotoData", botao:"Marcar", titulo:"Marcar a foto de", ultima:function(l){ return !l.eOk; }}, acao),
    {k:"fotoQuem", t:"Quem fotografou", corTopo:COR.foto, fmt:t},
    colEtapa({k:"edTxt", t:"Editada", etapa:"ed", ok:"eOk", data:"edData", antes:"fOk", botao:"Marcar", titulo:"Marcar a edição de", ultima:function(l){ return !l.sOk; }}, acao),
    {k:"edQuem", t:"Quem editou", corTopo:COR.ed, fmt:t},
    colEtapa({k:"subTxt", t:"Sistema", etapa:"sub", ok:"sOk", data:"subData", antes:"eOk", botao:"Subir", titulo:"Subir na DevMaster o código", ultima:function(){ return true; }}, acao),
    {k:"subQuem", t:"Quem subiu", corTopo:COR.sub, fmt:t},
    {k:"obs", t:"Observações", fmt:t}];
}

// colunas da tabela do dia: Código, Descrição (vem da DevMaster) e as três etapas
function colunasDia(acao){
  var t = function(v){ return v==null || v==="" ? "—" : String(v); };
  return [{k:"cod", t:"Código", fmt:t}, {k:"diaTxt", t:"Data do cadastro", fmt:t}, {k:"desc", t:"Descrição", fmt:t}].concat(colunas(acao).filter(function(c){ return c.k!=="cod" && c.k!=="cat" && c.k!=="obs"; }));
}

// CADASTRADAS NO MÊS (Marcus, 10/11/2026): tudo que a Rayssa cadastra na DevMaster entra aqui sozinho e o setor vai preenchendo Foto, Editada e Sistema.
// Em cima, o progresso de cada dia desde o dia 1 (cadastradas, fotografadas, editadas, no sistema, sem foto); embaixo, os códigos com a DATA do cadastro.
// Clicar num dia mostra só os códigos dele; clicar de novo volta para o mês todo.
function CadastradasHoje(p){
  var hoje = hojeSP(), ini = hoje.slice(0, 8)+"01", sd = useState("mes"), dia = sd[0], fc = p.fc;
  var dias = useMemo(function(){ var m = {}; m[hoje] = 1; (fc.codigos || []).forEach(function(c){ if(c.dia && c.dia>=ini) m[c.dia] = 1; }); return Object.keys(m).sort().reverse(); }, [fc, hoje, ini]);
  var linhas = useMemo(function(){ return p.linhas.filter(function(l){ return dia==="mes" ? (l.dia && l.dia>=ini) : l.dia===dia; }).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : ORDEM.compare(a.cod, b.cod); }); }, [p.linhas, dia, ini]);
  var tot = {cad:0, foto:0, ed:0, sub:0};
  var fileiras = dias.map(function(d){
    var r = resumoDoDia(fc, d); tot.cad += r.cadastrados; tot.foto += r.fotografados; tot.ed += r.editados; tot.sub += r.naDevmaster;
    return e(FileiraCampos,{key:d, title:d===dia ? "Voltar para o mês todo" : "Ver só os códigos cadastrados em "+formatarDia(d), onClick:function(){ sd[1](d===dia ? "mes" : d); }, cells:[(d===dia ? "▸ " : "")+formatarDia(d)+(d===hoje ? " · hoje" : ""), N(r.cadastrados), N(r.fotografados), N(r.editados), N(r.naDevmaster), N(r.cadastrados-r.fotografados), PCT(r.naDevmaster, r.cadastrados)]});
  });
  fileiras.push(e(FileiraCampos,{key:"tot", total:true, cells:["Desde "+formatarDia(ini), N(tot.cad), N(tot.foto), N(tot.ed), N(tot.sub), N(tot.cad-tot.foto), PCT(tot.sub, tot.cad)]}));
  return e(Bloco,{t:"Cadastradas "+(dia==="mes" ? "desde "+formatarDia(ini) : dia===hoje ? "hoje" : "em "+formatarDia(dia))+" · "+N(linhas.length)+(linhas.length===1 ? " código" : " códigos")},
    e("div",{className:"flex flex-col gap-2"},
      e(TabelaCampos,{minW:"620px", cols:[{t:"Dia", w:"1.4fr"}, {t:"Cadastradas", w:"1fr"}, {t:"Fotografadas", w:"1fr"}, {t:"Editadas", w:"1fr"}, {t:"No sistema", w:"1fr"}, {t:"Sem foto", w:"1fr"}, {t:"% no sistema", w:"1fr"}]}, fileiras),
      e(TabelaPlanilha,{cols:p.cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, vazio:"Nenhum código cadastrado neste período na DevMaster."})));
}

// PROCESSOS (Marcus, 10/11/2026): o caminho de cada peça nova, de quem faz e de quando
var PROCESSO = [
  ["1", "Cadastro", "Meninas do cadastro", "Todo dia", "Cadastram as peças e separam 1 peça de cada código", "Entra sozinho em Listagem"],
  ["2", "Entrega", "Meninas do cadastro", "11h e 15h", "Levam as peças ao Marketing, em um ziplock com a data e o horário", "—"],
  ["3", "Foto", "Equipe do Marketing", "Ao receber as peças", "Tiram as fotos das peças", "—"],
  ["4", "Marcação", "Castilho", "Depois de tirar as fotos", "Marca o campo de foto na DevMaster nas peças que já têm foto", "Foto (lido da DevMaster)"],
  ["5", "Edição", "Editora do Marketing", "Depois da marcação", "Edita as fotos e coloca na DevMaster", "Editada e Sistema (botões Marcar e Subir)"]
];
function Processos(){
  var linhas = PROCESSO.map(function(l){ return e(FileiraCampos,{key:l[0], cells:l}); });
  return e(Bloco,{t:"Processo das fotos de catálogo"},
    e(TabelaCampos,{minW:"1010px", cols:[{t:"Passo", w:"60px"}, {t:"Etapa", w:"110px"}, {t:"Quem", w:"190px"}, {t:"Quando", w:"190px"}, {t:"O que faz", w:"1fr"}, {t:"Onde marca", w:"190px"}]}, linhas));
}

// META (Marcus, 10/11/2026): 500 fotos até sexta = bônus de R$ 250,00; a próxima meta entra em METAS (domain/fotos-catalogo.js)
function Meta(p){
  var hoje = hojeSP();
  return e("div",{className:"flex flex-col gap-2.5"}, e("p",{className:"text-[13px] text-foreground"}, "Foto conta quando o Castilho marca o campo de foto na DevMaster ou quando ela é marcada nesta tela, no período da meta. O bônus só vale para quem trabalhar no período."), METAS.map(function(m){
    var r = metaProgresso(p.fc, m, hoje), cor = r.situacao==="Batida" ? ESTADO.ok : r.situacao==="Não batida" ? ESTADO.erro : ESTADO.alerta;
    var linhas = r.linhas.map(function(x){ return e(FileiraCampos,{key:x.dia, cells:[formatarDia(x.dia)+(x.dia===hoje ? " · hoje" : ""), N(x.fotos), N(x.acum), PCT(x.acum, m.alvo)]}); });
    return e("div",{key:m.id, className:"flex flex-col gap-2"},
      e(Bloco,{t:m.nome+" · até "+formatarDia(m.fim)},
        e(TabelaCampos,{minW:"900px", cols:[{t:"Início", w:"1fr"}, {t:"Prazo", w:"1fr"}, {t:"Meta", w:"1fr"}, {t:"Feitas", w:"1fr"}, {t:"Falta", w:"1fr"}, {t:"%", w:"1fr"}, {t:"Por dia", w:"1fr"}, {t:"Bônus", w:"1fr"}, {t:"Situação", w:"1fr"}]},
          [e(FileiraCampos,{key:"m", cells:[formatarDia(m.ini), formatarDia(m.fim), N(m.alvo)+" fotos", N(r.feitas), N(r.falta), PCT(r.feitas, m.alvo), r.restam ? N(r.porDia)+" por dia" : "—", BKC(m.bonus), {v:r.situacao, cor:cor}]})])),
      e(Bloco,{t:"Fotos por dia"},
        e(TabelaCampos,{minW:"520px", cols:[{t:"Dia", w:"1.4fr"}, {t:"Fotos no dia", w:"1fr"}, {t:"Acumulado", w:"1fr"}, {t:"% da meta", w:"1fr"}]}, linhas)));
  }));
}

function AbaFotosCatalogo(){
  var cx = use(), s = cx.state, d = cx.dispatch, fc = s.fc, sl = useState(false), lancar = sl[0], sa = useState("lista"), aba = sa[0], sg = useState({}), abertos = sg[0];
  // listagem em ORDEM: por categoria e, dentro dela, pelo código (Marcus, 10/11/2026); cada categoria é um grupo que começa FECHADO
  var linhas = useMemo(function(){ return fc ? linhasFotos(fc).map(function(l){ return Object.assign({}, l, {fotoTxt:l.fOk ? "Ok" : (l.esp || "Falta"), edTxt:l.eOk ? "Ok" : "Falta", subTxt:l.sOk ? "Ok" : "Falta"}); }).sort(function(a, b){ return ORDEM.compare(a.cat, b.cat) || ORDEM.compare(a.cod, b.cod); }) : []; }, [fc]);
  var porCat = useMemo(function(){ var m = {}; if(fc) porCategoria(fc).forEach(function(c){ m[c.cat] = c; }); return m; }, [fc]);
  var cats = Object.keys(porCat);
  var abreTodos = function(v){ var o = {}; if(v) cats.forEach(function(c){ o[c] = true; }); sg[1](o); };
  var alterna = function(c){ var o = Object.assign({}, abertos); if(o[c]) delete o[c]; else o[c] = true; sg[1](o); };
  // faixa da categoria em COLUNAS que ficam alinhadas com a tabela (Marcus, 10/11/2026: "código embaixo de código, % embaixo de %"): nome | total | foto e % | editada e % | sistema e % | em branco
  var grupo = function(c){ var x = porCat[c] || {total:0, foto:0, ed:0, sub:0}; return {span:1, rotulo:(abertos[c] ? "▾ " : "▸ ")+c, resto:[N(x.total)+" códigos", N(x.foto), PCT(x.foto, x.total), N(x.ed), PCT(x.ed, x.total), N(x.sub), PCT(x.sub, x.total), ""]}; };
  var colsDia = useMemo(function(){ return colunasDia(function(op, cod, etapa){ d({type:"FC", op:op, cod:cod, etapa:etapa, por:porDe(s)}); }); }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cols = useMemo(function(){ return colunas(function(op, cod, etapa){ d({type:"FC", op:op, cod:cod, etapa:etapa, por:porDe(s)}); }); }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  // código novo cadastrado na DevMaster (Rayssa) entra sozinho aqui: consulta a cada 2 minutos enquanto a tela está aberta; foto já subida na DevMaster marca o Sistema
  useEffect(function(){
    if(!apiAtiva() || !token()) return undefined;
    var vivo = true, rodar = function(){ chamar("GET", "/fotos/dm?dias=60").then(function(r){ if(vivo && r && Array.isArray(r.itens)) d({type:"FC", op:"dm_sync", itens:r.itens, por:"DevMaster"}); }).catch(function(){}); };
    rodar(); var iv = setInterval(rodar, 120000); return function(){ vivo = false; clearInterval(iv); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var cab = e(PageHead,{t:"Fotos de catálogo", sub:"Última atualização: "+(fc && fc.dmEm ? String(fc.dmEm).slice(8, 10)+"/"+String(fc.dmEm).slice(5, 7)+" às "+String(fc.dmEm).slice(11, 16) : "ainda não lida")}, e(Botao,{principal:!lancar, onClick:function(){ sl[1](!lancar); }}, lancar ? "Fechar" : "Lançar ou marcar"));
  if(!fc) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados das fotos de catálogo indisponíveis."));
  return e(Pagina,null, cab,
    lancar && e(Lancar),
    e(Painel,{fc:fc}),
    e("div",{className:"flex flex-wrap items-end gap-0 border-b border-border"}, e(AbasTela,{abas:ABAS, atual:aba, onMudar:sa[1]}),
      aba==="cat" && e("div",{role:"group", className:"mb-1 ml-2 inline-flex overflow-hidden rounded-md border border-border"},   // Abrir/Fechar todos só vale na listagem por categoria
        e("button",{type:"button", onClick:function(){ abreTodos(true); }, className:"h-8 whitespace-nowrap px-3 text-[13px] hover:bg-white/10"}, "Abrir todos"),
        e("button",{type:"button", onClick:function(){ abreTodos(false); }, className:"h-8 whitespace-nowrap border-l border-border px-3 text-[13px] hover:bg-white/10"}, "Fechar todos"))),
    aba==="lista" ? e(CadastradasHoje,{fc:fc, linhas:linhas, cols:colsDia})
      : aba==="cat" ? e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, agrupar:"cat", grupoEsquerda:true, cabSoAberto:true, grupoAberto:function(c){ return !!abertos[c]; }, aoGrupo:alterna, linhaGrupo:function(c){ return grupo(c); }, vazio:"Nenhum código lançado. Use \"Lançar ou marcar\" para colar os códigos novos."})
      : aba==="dia" ? e(Producao,{fc:fc})
      : aba==="proc" ? e(Processos)
      : e(Meta,{fc:fc}));
}

export { AbaFotosCatalogo };

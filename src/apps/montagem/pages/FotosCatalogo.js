// Sorelly Admin · montagem — pages/FotosCatalogo.js
// Marketing › Fotos de catálogo (10/11/2026, pedido do Marcus): controle das fotos das peças NOVAS (fotografar → editar → subir na DevMaster). Substitui a planilha "Fotos App Sorelly".
// LAYOUT 3 escolhido pelo Marcus (docs/ideias/marketing-fotos-planilha-4-layouts.html): jeito da planilha antiga, sem quadro de cartões.
//   Uma linha com os totais em cima; abas Listagem | Progresso por categoria | Produção diária; a Listagem tem TODOS os códigos (17 mil da planilha antiga + os novos),
//   colunas Código, Categoria, Foto, Quem fotografou, Editada, Quem editou, Sistema, Quem subiu e Observações, filtro no título de cada coluna, 300 linhas por vez.
// Regras e contas em domain/fotos-catalogo.js (estado s.fc, ação FC).
import { BKC } from "@/apps/montagem/lib/format";
import { ESTADO, Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, Botao, FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { diasEntre, formatarDia, hojeSP, INICIO_PECAS, linhasFotos, METAS, metaProgresso, parteDia, porCategoria, producaoDias, resumoDoDia, resumoGeral, temposMedios } from "@/apps/montagem/domain/fotos-catalogo";
import { porDe } from "@/apps/montagem/pages/trafego/comum";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
import { e, useEffect, useMemo, useState } from "@/shared/react";

var ORDEM = new Intl.Collator("pt-BR", {numeric:true, sensitivity:"base"});   // A2039 antes de A2040, 2B0001 antes de 2B0072

var N = function(v){ return v==null ? "—" : Number(v).toLocaleString("pt-BR"); };
var PCT = function(n, tot){ return tot ? (n/tot*100).toLocaleString("pt-BR", {minimumFractionDigits:1, maximumFractionDigits:1})+"%" : "—"; };
var COR = {foto:"#5B8DEF", ed:"#A78BFA", sub:"#2DD4BF"};   // as três etapas (mesmas cores das fases de Cadastro de peças › Pedidos)
var ABAS = [["lista", "Hoje"], ["cat", "Progresso por categoria"], ["ant", "Meses anteriores"], ["dia", "Produção diária"], ["proc", "Processos"], ["meta", "Meta"]];
// botões pequenos dentro da linha (Marcus, 10/11/2026: "esse botão marcar está uma merda, diminui ele"): 22 px de altura, texto 11 px
var BTN_ICONE = "h-[22px] w-[22px] rounded-full text-[11px] leading-none text-foreground hover:bg-white/15"; // padrao-ok
var BTN_MARCAR = "h-[22px] rounded-full border border-primary/60 px-3 text-[11px] font-medium leading-none text-primary transition-colors hover:bg-primary hover:text-black"; // padrao-ok

// PAINEL DO ALTO (Marcus, 10/11/2026: "lá no topo colocar um negócio assim", foto do alto da planilha antiga): título, total e fotos restantes à esquerda e quatro células
// coloridas (Diversas, Foto, Editada, Sistema) com o número e a porcentagem. EXCEÇÃO pedida pelo Marcus à regra de "sem faixa de totais no topo" (padrao-ok).
var PCT2 = function(n, tot){ return tot ? (n/tot*100).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2})+"%" : "—"; };
function Painel(p){
  var g = useMemo(function(){ return resumoGeral(p.fc); }, [p.fc]), restantes = g.semFoto+g.aguardando;
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
        e("span",{className:"block h-1 w-full overflow-hidden rounded bg-black/30"}, e("i",{className:"block h-full bg-white", style:{width:Math.max(1, Math.round(c[2]/g.total*100))+"%"}}))); })));

}

// STATUS DA META (Marcus, 10/11/2026: "tem que ficar lá aparecendo"): fica no alto de TODAS as abas; o painel colorido com os totais foi para a aba Progresso por categoria (11/11/2026)
function BarraMeta(p){
  var hoje = hojeSP(), mt = METAS.filter(function(x){ return x.fim>=hoje; })[0] || METAS[METAS.length-1], mr = metaProgresso(p.fc, mt, hoje);
  var corMeta = mr.situacao==="Batida" ? ESTADO.ok : mr.situacao==="Não batida" ? ESTADO.ruim : ESTADO.alerta, escuro = "bg-[#131a2b]";
  return e("section",{className:"overflow-hidden rounded-lg border-2 border-white/60"},
    e("div",{className:"flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-1.5 "+escuro},
      e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Meta · até "+formatarDia(mt.fim)),
      e("b",{className:"text-[14px] tabular-nums"}, N(mr.feitas)+" de "+N(mt.alvo)+" fotos"),
      e("span",{className:"text-[13px] tabular-nums"}, "Falta "+N(mr.falta)+(mr.restam && mr.falta ? " · "+N(mr.porDia)+" por dia" : "")),
      e("span",{className:"block h-1.5 min-w-[140px] flex-1 overflow-hidden rounded bg-black/30"}, e("i",{className:"block h-full", style:{width:Math.max(1, Math.round(mr.pct))+"%", background:corMeta}})),
      e("b",{className:"text-[14px] tabular-nums"}, PCT(mr.feitas, mt.alvo)),
      e("b",{className:"text-[13px]", style:{color:corMeta}}, mr.situacao),
      e("span",{className:"text-[13px] tabular-nums"}, "Bônus "+BKC(mt.bonus))));
}

// MESES ANTERIORES (Marcus, 11/11/2026): peças cadastradas antes de 01/11 que ainda não têm foto. Começa por OUTUBRO; o mês seguinte só aparece quando o anterior termina.
// O cadastro de peças separa as peças; o Marketing marca TEM ou NÃO TEM a peça; só as que têm são fotografadas.
var MESES_NOME = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
var nomeMes = function(m){ return MESES_NOME[Number(m.slice(5, 7))-1]+"/"+m.slice(0, 4); };
var BTN_TEM = "h-[22px] rounded border px-2 text-[11px] font-semibold leading-none";   // padrao-ok
function colTem(acao){
  return {k:"tem", t:"Tem a peça?", fmt:function(v){ return v==="sim" ? "Tem" : v==="nao" ? "Não tem" : "—"; }, render:function(v, l){
    var b = function(valor, txt){ var on = l.tem===valor; return e("button",{type:"button", key:valor, onClick:function(){ acao("tem", l.cod, on ? "" : valor); }, title:on ? "Tirar a marcação de "+l.cod : txt+" · "+l.cod,
      className:BTN_TEM+" "+(on ? (valor==="sim" ? "border-success bg-success/20 text-success" : "border-destructive bg-destructive/20 text-destructive") : "border-border text-foreground hover:bg-white/10")}, txt); };
    return e("span",{className:"inline-flex items-center gap-1.5"}, b("sim", "Tem"), b("nao", "Não tem")); }};
}
function MesesAnteriores(p){
  var hoje = hojeSP(), sv = useState("todas"), vis = sv[0], sc = useState(false), copiou = sc[0];
  var base = useMemo(function(){ return p.linhas.filter(function(l){ return l.dia && l.dia<INICIO_PECAS && !l.sOk && !/CANCELAD/i.test(l.desc); }).map(function(l){ return Object.assign({}, l, {espera:diasEntre(l.dia, hoje), atrasada:true}); }); }, [p.linhas, hoje]);
  var meses = useMemo(function(){ var m = {}; base.forEach(function(l){ if(l.tem!=="nao"){ var k = l.dia.slice(0, 7); m[k] = (m[k] || 0)+1; } }); return Object.keys(m).sort().reverse().map(function(k){ return {mes:k, n:m[k]}; }); }, [base]);
  var atual = meses[0] || null, prox = meses[1] || null;
  var doMes = atual ? base.filter(function(l){ return l.dia.slice(0, 7)===atual.mes; }).sort(function(a, b){ return a.dia<b.dia ? -1 : a.dia>b.dia ? 1 : ORDEM.compare(a.cod, b.cod); }) : [];
  var pend = doMes.filter(function(l){ return l.tem!=="nao"; }), sem = pend.filter(function(l){ return !l.tem; }), tem = pend.filter(function(l){ return l.tem==="sim"; }), nao = doMes.filter(function(l){ return l.tem==="nao"; });
  var linhas = vis==="sem" ? sem : vis==="tem" ? tem : vis==="nao" ? nao : pend;
  var dias = useMemo(function(){ var m = {}; pend.forEach(function(l){ var x = m[l.dia] = m[l.dia] || {dia:l.dia, n:0, tem:0, sem:0}; x.n++; if(l.tem==="sim") x.tem++; else x.sem++; }); return Object.keys(m).sort().map(function(k){ return m[k]; }); }, [pend]);
  var copiar = function(){ var txt = sem.map(function(l){ return l.cod+" - "+(l.desc || ""); }).join("\n"); try{ navigator.clipboard.writeText(txt); sc[1](true); setTimeout(function(){ sc[1](false); }, 2500); }catch(x){} };
  if(!atual) return e("section",{className:"rounded-lg border-2 px-4 py-3 text-[13px]", style:{borderColor:ESTADO.ok}}, "Nenhuma peça de meses anteriores sem foto. Tudo em dia!");
  var fileiras = dias.map(function(d){ return e(FileiraCampos,{key:d.dia, cells:[formatarDia(d.dia), N(d.n), N(d.tem), N(d.sem)]}); });
  fileiras.push(e(FileiraCampos,{key:"tot", total:true, cells:["Mês todo", N(pend.length), N(tem.length), N(sem.length)]}));
  return e("div",{className:"flex flex-col gap-2.5"},
    e("section",{className:"flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border-2 px-4 py-3", style:{borderColor:ESTADO.alerta}},
      e("div",{className:"flex flex-wrap items-baseline gap-x-3 gap-y-1"},
        e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Atraso dos meses anteriores · comece por"),
        e("b",{className:"text-[13px]"}, nomeMes(atual.mes)),
        e("span",{className:"text-[13px] tabular-nums"}, N(atual.n)+(atual.n===1 ? " peça sem foto" : " peças sem foto"))),
      e("span",{className:"text-[13px]"}, prox ? "Depois: "+nomeMes(prox.mes)+" ("+N(prox.n)+" peças), liberado quando este mês terminar" : "Este é o último mês com peça sem foto")),
    e(Bloco,{t:"Como fazer"},
      e("p",{className:"text-[13px] text-foreground"}, "1. O cadastro de peças separa as peças da lista (botão \"Copiar lista para o cadastro\"). 2. O Marketing marca Tem ou Não tem a peça. 3. O Castilho fotografa as que têm. A peça sai da lista quando a foto chega na DevMaster.")),
    e(Bloco,{t:"Por dia de cadastro · "+nomeMes(atual.mes)},
      e(TabelaCampos,{minW:"520px", cols:[{t:"Dia de cadastro", w:"1.4fr"}, {t:"Peças sem foto", w:"1fr"}, {t:"Tem a peça", w:"1fr"}, {t:"Sem marcar", w:"1fr"}]}, fileiras)),
    e(Bloco,{t:"Peças de "+nomeMes(atual.mes)+" · "+N(linhas.length)+(linhas.length===1 ? " peça" : " peças"), dir:e("span",{className:"flex flex-wrap items-center gap-2"},
        e(Botao,{onClick:copiar, desabilitado:!sem.length}, copiou ? "Copiado!" : "Copiar lista para o cadastro · "+N(sem.length)),
        e(Segmentado,{opcoes:[["todas", "Todas · "+N(pend.length)], ["sem", "Sem marcar · "+N(sem.length)], ["tem", "Tem · "+N(tem.length)], ["nao", "Não tem · "+N(nao.length)]], atual:vis, onMudar:sv[1]}))},
      e(TabelaPlanilha,{cols:p.cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, vazio:"Nenhuma peça nesta lista."})));
}

function Producao(p){
  var fc = p.fc, hoje = hojeSP(), dias = producaoDias(fc, 30);
  var soma = function(k){ return dias.reduce(function(t, x){ return t+x[k]; }, 0); }, med = function(k){ return dias.length ? Math.round(soma(k)/dias.length) : null; };
  var tHoje = temposMedios(fc, function(iso){ return parteDia(iso)===hoje; }), tMes = temposMedios(fc, function(iso){ return String(iso||"").slice(0, 7)===hoje.slice(0, 7); });
  var linhas = dias.map(function(x){ return e(FileiraCampos,{key:x.dia, cells:[formatarDia(x.dia), N(x.fotos), N(x.editadas), N(x.sistema)]}); });
  if(dias.length) linhas.push(e(FileiraCampos,{key:"med", total:true, cells:["Média por dia (últimos "+dias.length+" dias)", N(med("fotos")), N(med("editadas")), N(med("sistema"))]}));
  return e("div",{className:"flex flex-col gap-2.5"}, e(ProgressoDias,{fc:fc}), e("div",{className:"grid items-start gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(420px,1fr))]"},
    e(Bloco,{t:"Produção diária"},
      e(TabelaCampos,{minW:"420px", cols:[{t:"Data", w:"34%"}, {t:"Fotos tiradas", w:"22%"}, {t:"Fotos editadas", w:"22%"}, {t:"Fotos no sistema", w:"1fr"}]}, dias.length ? linhas : [e(FileiraCampos,{key:"v", cells:["Nenhum dia com produção", "", "", ""]})])),
    e(Bloco,{t:"Tempo médio (códigos novos)"},
      e(TabelaCampos,{minW:"420px", cols:[{t:"Etapa", w:"52%"}, {t:"Hoje", w:"22%"}, {t:"Mês", w:"1fr"}]}, [
        ["Do cadastro à foto", tHoje.aFoto, tMes.aFoto], ["Da foto à edição", tHoje.aEdicao, tMes.aEdicao], ["Da edição à DevMaster", tHoje.aDevmaster, tMes.aDevmaster]
      ].map(function(l){ return e(FileiraCampos,{key:l[0], cells:l}); }).concat([e(FileiraCampos,{key:"tt", total:true, cells:["Do cadastro à DevMaster", tHoje.total, tMes.total]})])))));
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
      e("button",{type:"button", title:cfg.titulo+" "+l.cod, onClick:function(){ acao("etapa", l.cod, cfg.etapa); }, className:BTN_MARCAR}, cfg.botao));
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

// colunas da tabela da aba Hoje: Código, data, espera (dias sem a foto na DevMaster), descrição e as três etapas
function colunasDia(acao){
  var t = function(v){ return v==null || v==="" ? "—" : String(v); };
  var fora = ["cod", "cat", "obs", "fotoQuem", "edQuem", "subQuem"];
  return [{k:"cod", t:"Código", fmt:t}, {k:"diaTxt", t:"Data do cadastro", fmt:t},
    {k:"espera", t:"Espera", fmt:function(v){ return v==null ? "—" : v===0 ? "hoje" : v+(v===1 ? " dia" : " dias"); }, cor:function(l){ return l.atrasada ? "font-semibold text-destructive" : ""; }},
    {k:"desc", t:"Descrição", fmt:t}].concat(colunas(acao).filter(function(c){ return fora.indexOf(c.k)<0; }));
}

// ABA HOJE (Marcus, 11/11/2026: "eles têm que chegar e saber por onde começar todos os dias").
// Quem: Castilho tira as fotos; a Ana edita e coloca na DevMaster; o sistema só enxerga a foto quando ela chega na DevMaster e a peça sai da fila sozinha.
// Fila = peças cadastradas na DevMaster que ainda não têm foto lá, a mais antiga primeiro. Vermelho = 3 dias ou mais esperando.
var PRAZO_DIAS = 3;
var INICIO_FILA = INICIO_PECAS;   // a fila vale para as peças cadastradas desde 01/11/2026 (as de antes ficam para trás) e não leva peça cancelada
function proximaEntrega(){
  var sp = new Date(new Date().toLocaleString("en-US", {timeZone:"America/Sao_Paulo"})), h = sp.getHours(), d = sp.getDay(), util = d>=1 && d<=5;
  if(util && h<11) return "hoje às 11h";
  if(util && h<15) return "hoje às 15h";
  return d===5 || d===6 || d===0 ? "segunda às 11h" : "amanhã às 11h";
}
function Hoje(p){
  var hoje = hojeSP(), ini = hoje.slice(0, 8)+"01", sv = useState("dia"), vis = sv[0], ss = useState(""), sel = ss[0];
  var todas = useMemo(function(){ return p.linhas.filter(function(l){ return l.dia && l.dia>=INICIO_FILA && !/CANCELAD/i.test(l.desc); }).map(function(l){ var esp = l.sOk ? null : diasEntre(l.dia, hoje); return Object.assign({}, l, {espera:esp, atrasada:esp!=null && esp>=PRAZO_DIAS}); }); }, [p.linhas, hoje]);
  var fila = useMemo(function(){ return todas.filter(function(l){ return !l.sOk; }).sort(function(a, b){ return a.dia<b.dia ? -1 : a.dia>b.dia ? 1 : ORDEM.compare(a.cod, b.cod); }); }, [todas]);
  var mes = useMemo(function(){ return todas.filter(function(l){ return l.dia>=ini; }).sort(function(a, b){ return a.dia<b.dia ? 1 : a.dia>b.dia ? -1 : ORDEM.compare(a.cod, b.cod); }); }, [todas, ini]);
  // dias da fila: de cada dia, quantas peças foram cadastradas, quantas ainda estão sem foto na DevMaster e quantas já passaram por Foto, Editada e Sistema
  var dias = useMemo(function(){ var m = {}; todas.forEach(function(l){ var x = m[l.dia] = m[l.dia] || {dia:l.dia, cad:0, n:0, foto:0, ed:0, sub:0, esp:diasEntre(l.dia, hoje)}; x.cad++; if(!l.sOk) x.n++; if(l.fOk) x.foto++; if(l.eOk) x.ed++; if(l.sOk) x.sub++; }); return Object.keys(m).sort().filter(function(k){ return m[k].n>0; }).map(function(k){ return m[k]; }); }, [todas, hoje]);
  var atras = fila.filter(function(l){ return l.atrasada; }).length;
  var comeco = dias[0] || null, diaAtual = sel || (comeco ? comeco.dia : "");
  var doDia = fila.filter(function(l){ return l.dia===diaAtual; });
  var linhas = vis==="fila" ? fila : vis==="mes" ? mes : doDia;
  var vermelho = comeco && comeco.esp>=PRAZO_DIAS;
  var barra = comeco
    ? e("section",{className:"fc-pulso flex flex-wrap items-center justify-between gap-x-6 gap-y-1 rounded-lg border-2 px-4 py-3", style:{borderColor:vermelho ? ESTADO.ruim : ESTADO.alerta}},
        e("div",{className:"flex flex-wrap items-baseline gap-x-3 gap-y-1"},
          e("span",{className:"text-[11px] font-bold uppercase tracking-[.05em]"}, "Comece por aqui · dia"),
          e("b",{className:"text-[20px] tabular-nums"}, formatarDia(comeco.dia)),
          e("span",{className:"text-[13px] tabular-nums"}, N(comeco.n)+(comeco.n===1 ? " peça sem foto" : " peças sem foto")+" · esperando há "+comeco.esp+(comeco.esp===1 ? " dia" : " dias")+(vermelho ? " · atrasado" : ""))),
        e("span",{className:"text-[13px]"}, "Próxima entrega do cadastro: "+proximaEntrega()))
    : e("section",{className:"rounded-lg border-2 px-4 py-3 text-[13px]", style:{borderColor:ESTADO.ok}}, "Fila zerada: todas as peças cadastradas desde 01/11 já têm foto na DevMaster.");
  var fileiras = dias.map(function(d){
    var late = d.esp>=PRAZO_DIAS;
    var linha = e(FileiraCampos,{key:d.dia, title:"Ver as peças sem foto do dia "+formatarDia(d.dia), onClick:function(){ ss[1](d.dia); sv[1]("dia"); }, cells:[(d.dia===diaAtual && vis==="dia" ? "▸ " : "")+formatarDia(d.dia)+(d===comeco ? " · comece aqui" : ""), N(d.cad), N(d.n), N(d.foto), N(d.ed), N(d.sub), d.esp===0 ? "hoje" : d.esp+(d.esp===1 ? " dia" : " dias"), {v:late ? "Atrasado" : "No prazo", cor:late ? ESTADO.ruim : ESTADO.ok}]});
    return d===comeco ? e("div",{key:d.dia, className:"fc-pulso"}, linha) : linha;   // o dia de começar brilha de leve, sempre
  });
  if(dias.length) fileiras.push(e(FileiraCampos,{key:"tot", total:true, cells:["Fila toda", N(dias.reduce(function(s, x){ return s+x.cad; }, 0)), N(fila.length), N(dias.reduce(function(s, x){ return s+x.foto; }, 0)), N(dias.reduce(function(s, x){ return s+x.ed; }, 0)), N(dias.reduce(function(s, x){ return s+x.sub; }, 0)), "—", atras ? N(atras)+" atrasadas" : "Em dia"]}));
  var titulo = vis==="dia" ? "Peças sem foto do dia "+(diaAtual ? formatarDia(diaAtual) : "—") : vis==="fila" ? "Fila toda · da mais antiga para a mais nova" : "Cadastradas desde "+formatarDia(ini)+" (com e sem foto)";
  return e("div",{className:"flex flex-col gap-2.5"},
    e("style",null, "@keyframes fcPulso{0%,100%{background-color:rgba(232,184,75,.04)}50%{background-color:rgba(232,184,75,.22)}} .fc-pulso{animation:fcPulso 2.6s ease-in-out infinite} @media (prefers-reduced-motion:reduce){.fc-pulso{animation:none;background-color:rgba(232,184,75,.12)}}"),
    barra,
    dias.length ? e(Bloco,{t:"Fila por dia · clique no dia para ver as peças"},
      e(TabelaCampos,{minW:"900px", cols:[{t:"Dia de cadastro", w:"1.7fr"}, {t:"Cadastradas", w:"1fr"}, {t:"Sem foto", w:"1fr"}, {t:"Foto", w:"1fr", cor:COR.foto}, {t:"Editada", w:"1fr", cor:COR.ed}, {t:"Sistema", w:"1fr", cor:COR.sub}, {t:"Esperando", w:"1fr"}, {t:"Situação", w:"1fr"}]}, fileiras)) : null,
    e(Bloco,{t:titulo+" · "+N(linhas.length)+(linhas.length===1 ? " peça" : " peças"), dir:e("span",{className:"flex items-center"}, e(Segmentado,{opcoes:[["dia", "Dia "+(diaAtual ? formatarDia(diaAtual).slice(0, 5) : "—")+" · "+N(doDia.length)], ["fila", "Fila toda · "+N(fila.length)], ["mes", "Mês · "+N(mes.length)]], atual:vis, onMudar:sv[1]}))},
      e(TabelaPlanilha,{cols:p.cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, vazio:"Nenhuma peça nesta lista."})));
}

// progresso de cada dia (cadastradas, fotografadas, editadas, no sistema, sem foto): fica em Produção diária (Marcus, 11/11/2026: "não precisa estar direto ali")
function ProgressoDias(p){
  var hoje = hojeSP(), ini = hoje.slice(0, 8)+"01", fc = p.fc;
  var dias = useMemo(function(){ var m = {}; m[hoje] = 1; (fc.codigos || []).forEach(function(c){ if(c.dia && c.dia>=ini) m[c.dia] = 1; }); return Object.keys(m).sort().reverse(); }, [fc, hoje, ini]);
  var tot = {cad:0, foto:0, ed:0, sub:0};
  var fileiras = dias.map(function(d){
    var r = resumoDoDia(fc, d); tot.cad += r.cadastrados; tot.foto += r.fotografados; tot.ed += r.editados; tot.sub += r.naDevmaster;
    return e(FileiraCampos,{key:d, cells:[formatarDia(d)+(d===hoje ? " · hoje" : ""), N(r.cadastrados), N(r.fotografados), N(r.editados), N(r.naDevmaster), N(r.cadastrados-r.fotografados), PCT(r.naDevmaster, r.cadastrados)]});
  });
  fileiras.push(e(FileiraCampos,{key:"tot", total:true, cells:["Desde "+formatarDia(ini), N(tot.cad), N(tot.foto), N(tot.ed), N(tot.sub), N(tot.cad-tot.foto), PCT(tot.sub, tot.cad)]}));
  return e(Bloco,{t:"Progresso por dia · peças cadastradas e fotos na DevMaster"},
    e(TabelaCampos,{minW:"620px", cols:[{t:"Dia de cadastro", w:"1.4fr"}, {t:"Cadastradas", w:"1fr"}, {t:"Fotografadas", w:"1fr"}, {t:"Editadas", w:"1fr"}, {t:"No sistema", w:"1fr"}, {t:"Sem foto", w:"1fr"}, {t:"% no sistema", w:"1fr"}]}, fileiras));
}

// PROCESSOS (Marcus, 10/11/2026): o caminho de cada peça nova, de quem faz e de quando
var PROCESSO = [
  ["1", "Cadastro", "Meninas do cadastro", "Todo dia", "Cadastram as peças e separam 1 peça de cada código", "Entra sozinho em Hoje"],
  ["2", "Entrega", "Meninas do cadastro", "11h e 15h", "Levam as peças ao Marketing, em um ziplock com a data e o horário", "—"],
  ["3", "Foto", "Castilho", "Ao receber as peças", "Tira as fotos das peças", "—"],
  ["4", "Edição e envio", "Ana (RH, ajuda no Marketing)", "Depois das fotos", "Edita as fotos e coloca na DevMaster", "Automático: o sistema lê a DevMaster"]
];
function Processos(){
  var linhas = PROCESSO.map(function(l){ return e(FileiraCampos,{key:l[0], cells:l}); });
  return e(Bloco,{t:"Processo das fotos de catálogo"},
    e(TabelaCampos,{minW:"1010px", cols:[{t:"Passo", w:"60px"}, {t:"Etapa", w:"110px"}, {t:"Quem", w:"190px"}, {t:"Quando", w:"190px"}, {t:"O que faz", w:"1fr"}, {t:"Onde marca", w:"190px"}]}, linhas));
}

// META (Marcus, 10/11/2026): 500 fotos até sexta = bônus de R$ 250,00; a próxima meta entra em METAS (domain/fotos-catalogo.js)
function Meta(p){
  var hoje = hojeSP();
  return e("div",{className:"flex flex-col gap-2.5"}, e("p",{className:"text-[13px] text-foreground"}, "Foto conta quando chega na DevMaster (a Ana coloca lá e o sistema lê sozinho) ou quando é marcada nesta tela, no período da meta. O bônus só vale para quem trabalhar no período."), METAS.map(function(m){
    var r = metaProgresso(p.fc, m, hoje), cor = r.situacao==="Batida" ? ESTADO.ok : r.situacao==="Não batida" ? ESTADO.ruim : ESTADO.alerta;
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
  var cx = use(), s = cx.state, d = cx.dispatch, fc = s.fc, sa = useState("lista"), aba = sa[0], sg = useState({}), abertos = sg[0];
  // listagem em ORDEM: por categoria e, dentro dela, pelo código (Marcus, 10/11/2026); cada categoria é um grupo que começa FECHADO
  var linhas = useMemo(function(){ return fc ? linhasFotos(fc).map(function(l){ return Object.assign({}, l, {fotoTxt:l.fOk ? "Ok" : (l.esp || "Falta"), edTxt:l.eOk ? "Ok" : "Falta", subTxt:l.sOk ? "Ok" : "Falta"}); }).sort(function(a, b){ return ORDEM.compare(a.cat, b.cat) || ORDEM.compare(a.cod, b.cod); }) : []; }, [fc]);
  var porCat = useMemo(function(){ var m = {}; if(fc) porCategoria(fc).forEach(function(c){ m[c.cat] = c; }); return m; }, [fc]);
  var cats = Object.keys(porCat);
  var abreTodos = function(v){ var o = {}; if(v) cats.forEach(function(c){ o[c] = true; }); sg[1](o); };
  var alterna = function(c){ var o = Object.assign({}, abertos); if(o[c]) delete o[c]; else o[c] = true; sg[1](o); };
  // faixa da categoria em COLUNAS que ficam alinhadas com a tabela (Marcus, 10/11/2026: "código embaixo de código, % embaixo de %"): nome | total | foto e % | editada e % | sistema e % | em branco
  var grupo = function(c){ var x = porCat[c] || {total:0, foto:0, ed:0, sub:0}; return {span:1, rotulo:(abertos[c] ? "▾ " : "▸ ")+c, resto:[N(x.total)+" códigos", N(x.foto), PCT(x.foto, x.total), N(x.ed), PCT(x.ed, x.total), N(x.sub), PCT(x.sub, x.total), ""]}; };
  var colsDia = useMemo(function(){ return colunasDia(function(op, cod, etapa){ d({type:"FC", op:op, cod:cod, etapa:etapa, valor:etapa, por:porDe(s)}); }); }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  var colsAnt = useMemo(function(){ var acaoTem = function(op, cod, valor){ d({type:"FC", op:op, cod:cod, etapa:valor, valor:valor, por:porDe(s)}); }; var c = colunasDia(acaoTem); c.splice(4, 0, colTem(acaoTem)); return c; }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  var cols = useMemo(function(){ return colunas(function(op, cod, etapa){ d({type:"FC", op:op, cod:cod, etapa:etapa, valor:etapa, por:porDe(s)}); }); }, [s.usuario, d]);   // eslint-disable-line react-hooks/exhaustive-deps
  // código novo cadastrado na DevMaster (Rayssa) entra sozinho aqui: consulta a cada 2 minutos enquanto a tela está aberta; foto já subida na DevMaster marca o Sistema
  useEffect(function(){
    if(!apiAtiva() || !token()) return undefined;
    var vivo = true, rodar = function(){ chamar("GET", "/fotos/dm?dias=120").then(function(r){ if(vivo && r && Array.isArray(r.itens)) d({type:"FC", op:"dm_sync", itens:r.itens, por:"DevMaster"}); }).catch(function(){}); };
    rodar(); var iv = setInterval(rodar, 120000); return function(){ vivo = false; clearInterval(iv); };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  var cab = e(PageHead,{t:"Fotos de catálogo", sub:"Última atualização: "+(fc && fc.dmEm ? String(fc.dmEm).slice(8, 10)+"/"+String(fc.dmEm).slice(5, 7)+" às "+String(fc.dmEm).slice(11, 16) : "ainda não lida")});
  if(!fc) return e(Pagina,null, cab, e("p",{className:"py-6 text-center text-[13px] text-foreground"}, "Dados das fotos de catálogo indisponíveis."));
  return e(Pagina,null, cab,
    e(BarraMeta,{fc:fc}),
    e("div",{className:"flex flex-wrap items-end gap-0 border-b border-border"}, e(AbasTela,{abas:ABAS, atual:aba, onMudar:sa[1]}),
      aba==="cat" && e("div",{role:"group", className:"mb-1 ml-2 inline-flex overflow-hidden rounded-md border border-border"},   // Abrir/Fechar todos só vale na listagem por categoria
        e("button",{type:"button", onClick:function(){ abreTodos(true); }, className:"h-8 whitespace-nowrap px-3 text-[13px] hover:bg-white/10"}, "Abrir todos"),
        e("button",{type:"button", onClick:function(){ abreTodos(false); }, className:"h-8 whitespace-nowrap border-l border-border px-3 text-[13px] hover:bg-white/10"}, "Fechar todos"))),
    aba==="lista" ? e(Hoje,{fc:fc, linhas:linhas, cols:colsDia})
      : aba==="cat" ? e("div",{className:"flex flex-col gap-2.5"}, e(Painel,{fc:fc}), e(TabelaPlanilha,{cols:cols, linhas:linhas, chave:"cod", limite:300, grade:true, escura:true, agrupar:"cat", grupoEsquerda:true, cabSoAberto:true, grupoAberto:function(c){ return !!abertos[c]; }, aoGrupo:alterna, linhaGrupo:function(c){ return grupo(c); }, vazio:"Nenhum código lançado."}))
      : aba==="ant" ? e(MesesAnteriores,{linhas:linhas, cols:colsAnt})
      : aba==="dia" ? e(Producao,{fc:fc})
      : aba==="proc" ? e(Processos)
      : e(Meta,{fc:fc}));
}

export { AbaFotosCatalogo };

// Sorelly Admin · montagem — pages/cadastro/MetricasOrigemRegistros.js
// Aprovação de cadastros: três abas de leitura (Métricas, Origem e Registros). Cada uma é só o CORPO da aba (sem PageHead).
// Todos os números vêm de domain/cadastro-leads.js (estado s.cl); aqui só se desenha. Dados nascem vazios (CRM ainda não ligado).
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { ESTADO, Faixa, Indicador, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { formatarValorKit, hojeSP, janela, mensagemKit, metricas, origemPorTag, registros, rotuloKit, tagsDisponiveis } from "@/apps/montagem/domain/cadastro-leads";
import { podeDecidirCadastro } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { INPUT, MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var COR_AP = ESTADO.ok, COR_RP = ESTADO.ruim;
var VAZIO = "Ainda não há decisões registradas neste período.";
var dataBR = function(d){ return d ? String(d).slice(0,10).split("-").reverse().join("/") : ""; };
var horaDe = function(iso){ return iso && String(iso).length>=16 ? String(iso).slice(11,16) : ""; };
var pctTxt = function(n){ return String(n).replace(".", ",")+"%"; };

// botão pequeno padrão desta tela
var BTN = "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[12.5px] font-bold transition ";
function Botao(p){
  return e("button",{type:"button", onClick:p.onClick, disabled:p.disabled, title:p.titulo, className:BTN+(p.ativo ? "bg-[#F97316] text-black" : p.perigo ? "bg-destructive/20 text-destructive hover:bg-destructive/30" : "bg-muted/50 text-white hover:bg-white/15")+(p.disabled ? " opacity-40" : "")},
    p.ic && e(Ph,{n:p.ic, s:14}), p.children);
}
function Vazio(p){ return e("div",{className:"flex flex-col items-center gap-1.5 px-3 py-6 text-center text-[13px] text-white/75"}, e(Ph,{n:p.ic||"magnifying-glass", s:26}), e("span",null, p.txt||VAZIO)); }

// ---------- filtro de período: mês (padrão), período específico (de/até) ou tudo ----------
function usePeriodo(inicial){ var st = useState({modo:inicial||"mes", mes:hojeSP().slice(0,7), from:"", to:""}); return {f:st[0], set:st[1]}; }
function paramsMetricas(f){ if(f.modo==="tudo") return {dias:0}; if(f.modo==="periodo" && f.from && f.to) return {from:f.from, to:f.to}; return {mes:f.mes||hojeSP().slice(0,7)}; }
function FiltroPeriodo(p){
  var f = p.f, set = function(k, v){ var n = Object.assign({}, f); n[k] = v; p.set(n); };
  var modos = [["mes","Mês"],["periodo","Período"]].concat(p.tudo ? [["tudo","Tudo"]] : []);
  return e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
    modos.map(function(m){ return e(Botao,{key:m[0], ativo:f.modo===m[0], onClick:function(){ set("modo", m[0]); }}, m[1]); }),
    f.modo==="mes" && e("input",{type:"month", value:f.mes, "aria-label":"Mês", className:INPUT+" h-9! w-40 text-center text-[13px]!", onChange:function(ev){ if(ev.target.value) set("mes", ev.target.value); }}),
    f.modo==="periodo" && e("label",{className:"flex items-center gap-1 text-[12px] font-semibold"}, "De", e("input",{type:"date", value:f.from, max:f.to||undefined, "aria-label":"Data inicial", className:INPUT+" h-9! w-36 text-[13px]!", onChange:function(ev){ set("from", ev.target.value); }})),
    f.modo==="periodo" && e("label",{className:"flex items-center gap-1 text-[12px] font-semibold"}, "Até", e("input",{type:"date", value:f.to, min:f.from||undefined, "aria-label":"Data final", className:INPUT+" h-9! w-36 text-[13px]!", onChange:function(ev){ set("to", ev.target.value); }})),
    f.modo==="periodo" && !(f.from && f.to) && e("span",{className:"text-[11.5px] text-white/60"}, "Informe as duas datas."));
}
function textoPeriodo(per){ return per.tudo && !per.from ? "Todo o período" : dataBR(per.from)+" a "+dataBR(per.to); }
function Legenda(){
  return e("div",{className:"flex items-center justify-center gap-4 text-[11.5px] font-semibold"},
    [["Aprovados", COR_AP],["Reprovados", COR_RP]].map(function(x){ return e("span",{key:x[0], className:"flex items-center gap-1.5"}, e("i",{className:"block size-2.5 rounded-sm", style:{background:x[1]}}), x[0]); }));
}

// ---------- gráfico diário: colunas lado a lado (aprovados × reprovados), cabem sempre na largura ----------
function GraficoDiario(p){
  var serie = p.serie, n = serie.length, mx = 1, hv = useState(null), sel = hv[0], setSel = hv[1];
  serie.forEach(function(x){ mx = Math.max(mx, x.aprovados, x.reprovados); });
  var passo = n<=16 ? 1 : n<=40 ? 2 : Math.ceil(n/20), H = 150;
  var pt = sel!=null ? serie[sel] : null;
  return e("div",{className:"flex flex-col gap-2"},
    e("div",{className:"h-5 text-center text-[12px] font-semibold", "aria-live":"polite"}, pt ? e("span",null, dataBR(pt.data)+" · ", e("b",{style:{color:COR_AP}}, pt.aprovados+" aprovados"), " · ", e("b",{style:{color:COR_RP}}, pt.reprovados+" reprovados")) : e("span",{className:"text-white/55"}, "Passe o mouse ou toque em um dia")),
    e("div",{className:"flex items-end gap-px border-b border-white/15", style:{height:H}, onMouseLeave:function(){ setSel(null); }},
      serie.map(function(x, i){
        var ha = Math.round(x.aprovados/mx*(H-6)), hr = Math.round(x.reprovados/mx*(H-6));
        return e("div",{key:x.data, title:dataBR(x.data)+": "+x.aprovados+" aprovados, "+x.reprovados+" reprovados", onMouseEnter:function(){ setSel(i); }, onClick:function(){ setSel(i); },
          className:"flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-px rounded-t "+(sel===i ? "bg-white/10" : "hover:bg-white/5")},
          e("i",{className:"block w-1/2 max-w-3 rounded-t-sm", style:{height:x.aprovados>0 ? Math.max(3, ha) : 0, background:COR_AP}}),
          e("i",{className:"block w-1/2 max-w-3 rounded-t-sm", style:{height:x.reprovados>0 ? Math.max(3, hr) : 0, background:COR_RP}}));
      })),
    e("div",{className:"flex gap-px"}, serie.map(function(x, i){ return e("span",{key:x.data, className:"min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[9.5px] text-white/65"}, i%passo===0 ? x.data.slice(8,10) : ""); })),
    e(Legenda));
}

// =====================================================================================================
// MÉTRICAS
// =====================================================================================================
function AbaCadMetricas(){
  var s = use().state, per = usePeriodo("mes"), m = metricas(s.cl, paramsMetricas(per.f)), k = m.kpis;
  var temDados = k.decididos>0, taxaCor = k.decididos===0 ? "neutro" : k.taxaAprovacao>=60 ? "ok" : k.taxaAprovacao>=40 ? "alerta" : "ruim";
  return e(Pagina,null,
    e(Faixa,{n:5},
      e(Indicador,{t:"Aprovadas", v:k.aprovados, cor:"ok"}),
      e(Indicador,{t:"Reprovadas", v:k.reprovados, cor:"ruim"}),
      e(Indicador,{t:"Taxa de aprovação", v:pctTxt(k.taxaAprovacao), cor:taxaCor, sub:k.decididos+" decididas"}),
      e(Indicador,{t:"Pendentes agora", v:k.pendentes, cor:"alerta"}),
      e(Indicador,{t:"Decisões de hoje", v:k.decisoesHoje, cor:"info", sub:k.aprovadosHoje+" aprovadas · "+k.reprovadosHoje+" reprovadas"})),
    e(BlocoBarra,{cor:"laranja", t:"Decisões por dia", compacto:true, dir:textoPeriodo(m.periodo)},
      e("div",{className:"flex flex-col gap-3 p-3"},
        e(FiltroPeriodo,{f:per.f, set:per.set, tudo:true}),
        temDados ? e(GraficoDiario,{serie:m.serie}) : e(Vazio,{ic:"chart-bar"}))));
}

// =====================================================================================================
// ORIGEM
// =====================================================================================================
function BarraOrigem(p){
  var o = p.o, mx = Math.max(1, p.mx);
  return e("div",{className:"flex flex-col gap-1 rounded-lg bg-black/25 px-3 py-2"},
    e("div",{className:"flex items-center justify-between gap-2 text-[13px]"},
      e("span",{className:"flex min-w-0 items-center gap-1.5 font-bold"}, e("i",{className:"block size-2.5 shrink-0 rounded-full", style:{background:o.cor||ESTADO.neutro}}), e("span",{className:"truncate", title:o.nome}, o.nome)),
      e("span",{className:MONO+" shrink-0 text-[12px] text-white/80"}, o.volume+" · "+pctTxt(o.taxaAprovacao))),
    e("div",{className:"flex h-3 w-full overflow-hidden rounded-full bg-black/35", title:o.aprovados+" aprovados, "+o.reprovados+" reprovados"},
      e("i",{className:"block h-full", style:{width:(o.aprovados/mx*100)+"%", background:COR_AP}}),
      e("i",{className:"block h-full", style:{width:(o.reprovados/mx*100)+"%", background:COR_RP}})));
}
function AbaCadOrigem(){
  var s = use().state, per = usePeriodo("mes"), ft = useState([]), tags = ft[0], setTags = ft[1];
  var disp = tagsDisponiveis(s.cl), o = origemPorTag(s.cl, paramsMetricas(per.f), tags), k = o.kpis;
  var alterna = function(nome){ setTags(tags.indexOf(nome)>=0 ? tags.filter(function(x){ return x!==nome; }) : tags.concat([nome])); };
  var mx = o.origens.reduce(function(t, x){ return Math.max(t, x.volume); }, 1);
  return e(Pagina,null,
    e(Faixa,{n:4},
      e(Indicador,{t:"Decididas", v:k.decididos, cor:"info"}),
      e(Indicador,{t:"Origens", v:k.origens, cor:"total"}),
      e(Indicador,{t:"Taxa de aprovação", v:pctTxt(k.taxaAprovacao), cor:k.decididos===0 ? "neutro" : k.taxaAprovacao>=60 ? "ok" : k.taxaAprovacao>=40 ? "alerta" : "ruim"}),
      e(Indicador,{t:"Origem líder", v:k.topOrigem || "—", cor:"cian", sub:k.topOrigem ? k.topVolume+" decididas" : undefined})),
    e(BlocoBarra,{cor:"laranja", t:"Volume por origem", compacto:true, dir:textoPeriodo(o.periodo)},
      e("div",{className:"flex flex-col gap-3 p-3"},
        e(FiltroPeriodo,{f:per.f, set:per.set, tudo:true}),
        disp.length>0 && e("div",{className:"flex flex-wrap items-center justify-center gap-1.5"},
          e("span",{className:"text-[11.5px] font-bold uppercase tracking-wide text-white/75"}, "Tags"),
          disp.map(function(t){ var on = tags.indexOf(t.name)>=0;
            return e("button",{key:t.name, type:"button", onClick:function(){ alterna(t.name); }, title:t.qtd+" cadastro(s) com esta tag", className:"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold transition "+(on ? "bg-[#F97316] text-black" : "bg-muted/50 text-white hover:bg-white/15")},
              e("i",{className:"block size-2 rounded-full", style:{background:t.color||ESTADO.neutro}}), t.name); }),
          tags.length>0 && e(Botao,{ic:"x", onClick:function(){ setTags([]); }}, "Limpar")),
        o.origens.length>0 ? e("div",{className:"flex flex-col gap-2"}, e(Legenda), o.origens.map(function(x){ return e(BarraOrigem,{key:x.nome, o:x, mx:mx}); })) : e(Vazio,{ic:"chart-bar"}))),
    o.origens.length>0 && e(BlocoBarra,{cor:"laranja", t:"Aprovação por origem", compacto:true},
      e(Tab,{cols:["Origem","Aprovadas","Reprovadas","Total","Taxa"]},
        o.origens.map(function(x){ return e("tr",{key:x.nome, className:LINHA},
          e(Td,{forte:true}, x.nome), e(Td,{dinheiro:true, cor:"ok"}, x.aprovados), e(Td,{dinheiro:true, cor:"ruim"}, x.reprovados), e(Td,{dinheiro:true}, x.volume), e(Td,{dinheiro:true}, pctTxt(x.taxaAprovacao))); }))));
}

// =====================================================================================================
// REGISTROS
// =====================================================================================================
function copiarTexto(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(ok){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); ok(); });
}
var LIMITE = 20;
function AbaCadRegistros(){
  var cx = use(), s = cx.state, d = cx.dispatch, per = usePeriodo("tudo"), qs = useState(""), q = qs[0], setQ = qs[1], pg = useState(1), pagina = pg[0], setPagina = pg[1];
  var pf = per.f, diretoria = podeDecidirCadastro(s.usuario);
  var de = "", ate = "";
  if(pf.modo==="mes"){ var jm = janela({mes:pf.mes}); de = jm.from; ate = jm.to; } else if(pf.modo==="periodo"){ de = pf.from; ate = pf.to; }
  var r = registros(s.cl, {q:q, from:de||undefined, to:ate||undefined, page:pagina, limit:LIMITE}), meta = r.meta;
  var mudaPer = function(n){ setPagina(1); per.set(n); };
  var copiar = function(l){ copiarTexto(mensagemKit(l.kitOpcao, l.kitValorCasa, l.kitValorEmpresa)).then(function(){ d({type:"AVISO", txt:"Mensagem do kit copiada.", tom:"ok"}); }); };
  var desfazer = function(l){ if(!window.confirm("Desfazer a decisão de "+l.nome+"? O cadastro volta para a fila de aprovação.")) return; d({type:"CL", op:"desfazer", id:l.id}); };
  var cols = ["Decisão","Data","Nome","Cidade","Telefone","Resultado","Kit","Decidido por"].concat(diretoria ? ["Ação"] : []);
  return e(Pagina,null,
    e(Faixa,{n:3},
      e(Indicador,{t:"Registros", v:meta.total, cor:"info", sub:"no filtro atual"}),
      e(Indicador,{t:"Pendentes agora", v:meta.pendentes, cor:"alerta"}),
      e(Indicador,{t:"Decisões de hoje", v:meta.aprovadosHoje+meta.reprovadosHoje, cor:"total", sub:meta.aprovadosHoje+" aprovadas · "+meta.reprovadosHoje+" reprovadas"})),
    e(BlocoBarra,{cor:"laranja", t:"Cadastros revisados", compacto:true, dir:meta.total+" registro(s)"},
      e("div",{className:"flex flex-col gap-3 p-3"},
        e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
          e("input",{type:"search", value:q, placeholder:"Buscar por nome, empresa, cidade, telefone ou número", "aria-label":"Buscar registros", className:INPUT+" h-9! w-full max-w-md text-center text-[13px]!", onChange:function(ev){ setQ(ev.target.value); setPagina(1); }})),
        e(FiltroPeriodo,{f:pf, set:mudaPer, tudo:true}),
        r.itens.length===0 ? e(Vazio,{ic:"magnifying-glass", txt:(q || pf.modo!=="tudo") ? "Nenhum registro encontrado para este filtro." : VAZIO}) :
        e(Tab,{cols:cols}, r.itens.map(function(l){
          var ap = l.reviewStatus==="APPROVED";
          return e("tr",{key:l.id, className:LINHA},
            e(Td,{dinheiro:true}, "#"+l.id),
            e(Td,null, e("div",{className:"flex flex-col items-center leading-tight"}, e("span",null, dataBR(l.reviewedAt)), e("span",{className:"text-[11px] text-white/60"}, horaDe(l.reviewedAt)))),
            e(Td,{forte:true}, l.nome),
            e(Td,null, l.cidade || "—"),
            e(Td,{dinheiro:true}, l.telefone || "—"),
            e(Td,{forte:true, cor:ap ? "ok" : "ruim"}, ap ? "Aprovada" : "Reprovada"),
            e(Td,null, ap && l.kitOpcao ? e("div",{className:"flex flex-col items-center gap-1 leading-tight"},
              e("b",{className:"text-[12.5px]"}, rotuloKit(l.kitOpcao)),
              e("span",{className:MONO+" text-[11px] text-white/70"}, "Casa "+formatarValorKit(l.kitValorCasa||0)+" · Empresa "+formatarValorKit(l.kitValorEmpresa||0)),
              e(Botao,{ic:"copy", onClick:function(){ copiar(l); }, titulo:"Copiar a mensagem do kit para enviar de novo"}, "Copiar mensagem")) : "—"),
            e(Td,null, l.reviewedBy || "—"),
            diretoria && e(Td,null, e(Botao,{ic:"arrow-counter-clockwise", perigo:true, onClick:function(){ desfazer(l); }, titulo:"Voltar este cadastro para a fila"}, "Desfazer decisão")));
        })),
        meta.total>0 && e("div",{className:"flex items-center justify-center gap-3"},
          e(Botao,{ic:"caret-left", disabled:meta.page<=1, onClick:function(){ setPagina(meta.page-1); }}, "Anterior"),
          e("span",{className:"text-[12.5px] font-semibold"}, "Página "+meta.page+" de "+meta.paginas),
          e(Botao,{ic:"caret-right", disabled:meta.page>=meta.paginas, onClick:function(){ setPagina(meta.page+1); }}, "Próxima")))));
}

export { AbaCadMetricas, AbaCadOrigem, AbaCadRegistros };

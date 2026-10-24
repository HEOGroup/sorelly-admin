// Sorelly Admin · montagem — pages/Plano4560.js
// Agendamento → Plano 45/60 dias (23/10/2026), FASE 1: Indicações, Aprovação e Painel. Regras e contas em domain/plano45-60.js (estado s.p45).
// Padrão do Financeiro: título → faixa de totais → filtros → tabela de layout fixo; abas visíveis; cor só no estado. Aprovada e mudando de mês ajusta a meta do Agendamento (remarcação).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbasTela, Bloco, BlocoFiltros, Botao, CAMPO, CampoBusca, CampoSel, FaixaTotais, Rotulo, TabelaP, Td, Tr, brl, inteiro } from "@/apps/montagem/components/padrao-fin";
import { nomeDe } from "@/apps/montagem/domain/equipe";
import { tipoDe } from "@/apps/montagem/domain/agendamento";
import { CONTATOS, DECISOES, MOTIVOS, ORIGENS, cicloDe, crescimento, decisaoDe, decisaoFinal, diasEntre, hojeIsoLocal, ORDEM_SIT, SITUACOES, efeitoMeta, fmtData, minimoSugerido, naMeta, norm, novaCalculada, origemLocal, p45Reduz, pendencias, podeAprovar, podeLancar, repCurto, resumoPlano, rotuloMes, temLocal } from "@/apps/montagem/domain/plano45-60";
import { Selo, Vazio } from "@/apps/montagem/pages/compras/visualCompras";
import { use } from "@/apps/montagem/state/context";
import { lerFilaKitsNovos } from "@/apps/montagem/lib/fila-kits-novos";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var POR_PAGINA = 80;
var BTN_MINI = "h-6 rounded border border-border px-2 text-[12px] hover:bg-white/10 disabled:opacity-40";
var chaveMesHoje = function(){ var d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };

// estado, pessoa logada e ações do plano; exec devolve true se o domínio aceitou (a recusa aparece no aviso do sistema)
function useP45(){
  var cx = use(), s = cx.state, por = nomeDe(s.usuario);
  var exec = function(op, extra){ var a = Object.assign({type:"P45", op:op, por:por}, extra||{}); var r = p45Reduz(s, a); cx.dispatch(a); return !!(r.patch && r.patch.p45); };
  return {s:s, p:s.p45, ag:s.agend, cfg:s.p45.config, aprova:podeAprovar(s.usuario), lanca:podeLancar(s.usuario), por:por, exec:exec, d:cx.dispatch};
}

// ---------- peças pequenas ----------
function SelSit(p){ var x = SITUACOES[p.s]; return e(Selo,{cor:x.cor}, x.lb); }
// campo de valor inteiro em reais (R$ 1.500): só números, sempre 32 px
function CampoReais(p){
  var n = Number(String(p.value||"").replace(/\D/g, "")) || 0;
  return e("div",{className:"min-w-0 "+(p.cls||"")}, e(Rotulo,{t:p.t, id:p.id}),
    e("input",{id:p.id, inputMode:"numeric", value:n ? "R$ "+n.toLocaleString("pt-BR") : "", placeholder:p.placeholder||"R$ 0", disabled:p.disabled, onChange:function(ev){ p.onChange(ev.target.value.replace(/\D/g, "").slice(0, 7)); }, className:CAMPO+" text-right tabular-nums"}));
}
function CampoTexto(p){
  return e("div",{className:"min-w-0 "+(p.cls||"")}, e(Rotulo,{t:p.t, id:p.id}), e("input",{id:p.id, type:p.type||"text", value:p.value||"", placeholder:p.placeholder||"", disabled:p.disabled, onChange:function(ev){ p.onChange(ev.target.value); }, className:CAMPO}));
}
// primeira pendência que importa (grave primeiro); todas aparecem ao passar o mouse
function Pend(p){
  var l = p.l, pe = pendencias(l, chaveMesHoje(), p.cfg), uteis = pe.filter(function(x){ return !x.info; }), a = uteis[0];
  return e(Td,{title:pe.map(function(x){ return x.txt; }).join(" · "), cor:a ? (a.grave ? "text-destructive" : "text-warning") : ""}, a ? a.txt+(uteis.length>1 ? " +"+(uteis.length-1) : "") : "—");
}
function Meta(p){
  var l = p.l, f = efeitoMeta(l, p.ag, chaveMesHoje());
  if(l.situacao!=="aprovada" || f.tipo==="incompleta") return e(Td,null, "—");
  if(f.tipo==="mesmo") return e(Td,{title:"Continua na meta de "+rotuloMes(f.origem)}, "Mesmo mês");
  var txt = rotuloMes(f.origem).slice(0, 3)+" → "+rotuloMes(f.destino).slice(0, 3);
  if(f.tipo==="atrasada") return e(Td,{cor:"text-warning", title:"Acerto de mês anterior: a meta não é mexida sozinha (confirmar com o Agendamento)"}, txt+" · confirmar");
  return naMeta(l, p.ag) ? e(Td,{cor:"text-success", title:"Já saiu da meta de "+rotuloMes(f.origem)+" e entrou em "+rotuloMes(f.destino)}, txt+" · ajustada") : e(Td,{cor:"text-warning", title:"Aprovada, mas ainda não ajustada na meta do Agendamento"}, txt+" · falta ajustar");
}
var COLS_LINHA = [{t:"Situação", w:110}, {t:"Representante", w:130}, {t:"Revendedora"}, {t:"Prazo", w:60, n:true}, {t:"Acerto", w:76}, {t:"Nova data", w:76}, {t:"Média", w:96, n:true}, {t:"Mínimo", w:96, n:true}, {t:"Pendência", w:170}, {t:"Meta", w:150}];

// aplica na meta do Agendamento as aprovadas que mudam de mês e ainda não estão lá (ex.: vindas da planilha). Pede confirmação e avisa do risco de contar duas vezes.
function ajustarMeta(c, n){
  var ja = (c.ag.remarc||[]).filter(function(r){ return !r.planoId && tipoDe(r.tipo).proposito; }).reduce(function(t, r){ return t+(r.qtd||1); }, 0);
  var msg = "Vai tirar "+n+" revendedora"+(n===1 ? "" : "s")+" da meta do mês de origem e colocar no mês de destino (Agendamento e previsão do Financeiro).\n\n"+
    (ja>0 ? "ATENÇÃO: o Agendamento já tem "+ja+" adiada"+(ja===1 ? "" : "s")+" de 45/60 dias lançada"+(ja===1 ? "" : "s")+" à mão em Remarcações. Se forem as mesmas revendedoras, os números serão contados duas vezes. Confira antes.\n\n" : "")+"Continuar?";
  if(window.confirm(msg)) c.exec("aplicar_meta");
}

// ---------- formulário de indicação (nova e edição) ----------
function FormLinha(p){
  var c = p.c, l = p.l, reps = ((c.ag.config && c.ag.config.representantes) || []).filter(function(r){ return r.ativo; }).map(function(r){ return r.nome; });
  var st = useState(function(){ return l ? {rep:l.rep, nome:l.nome, codigo:l.codigo||"", tel:l.tel||"", orig:l.orig||"", prazo:l.prazo ? String(l.prazo) : "", nova:l.nova||"", media:l.media ? String(l.media) : "", motivo:l.motivo||"", origem:l.origem||"representante", obs:l.obs||"", canal:l.canal||"representante", fixo:l.fixo ? "sim" : "nao"}
    : {rep:"", nome:"", codigo:"", tel:"", orig:"", prazo:"", nova:"", media:"", motivo:"", origem:"representante", obs:"", canal:"representante", fixo:"nao"}; }), f = st[0];
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  if(l && l.rep && reps.indexOf(l.rep)<0) reps = reps.concat([l.rep]);
  var trava = !!l && l.situacao==="aprovada" && naMeta(l, c.ag);   // já está na meta: prazo e datas só mudam desfazendo a aprovação
  var prazoNum = Number(f.prazo) || null, sugestao = novaCalculada(f.orig, prazoNum);
  var salvar = function(){
    var dados = {rep:f.rep, nome:f.nome, codigo:f.codigo, tel:f.tel, orig:f.orig, prazo:prazoNum, nova:f.nova, media:Number(f.media) || null, motivo:f.motivo, origem:f.origem, obs:f.obs, canal:f.canal, fixo:f.fixo==="sim"};
    if(l && trava){ delete dados.orig; delete dados.prazo; delete dados.nova; }
    var ok = l ? c.exec("edit", {id:l.id, dados:dados}) : c.exec("add", {dados:dados}); if(ok) p.onFechar();
  };
  return e(Bloco,{t:l ? "Editar indicação" : "Nova indicação", dir:e(Botao,{onClick:p.onFechar}, "Fechar")},
    trava && e("p",{className:"mb-2 text-[12px] text-warning"}, "Esta linha já está na meta do Agendamento. Para mudar prazo ou datas, volte a linha para análise em Aprovação."),
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoSel,{t:"Representante", id:"p45rep", value:f.rep, onChange:function(v){ set("rep", v); }, opcoes:[["", "Escolher"]].concat(reps.map(function(n){ return [n, n]; }))}),
      e(CampoTexto,{t:"Revendedora (nome completo)", id:"p45nome", value:f.nome, onChange:function(v){ set("nome", v); }, cls:"col-span-2"}),
      e(CampoTexto,{t:"Código Devmaster", id:"p45cod", value:f.codigo, onChange:function(v){ set("codigo", v); }}),
      e(CampoTexto,{t:"Telefone", id:"p45tel", value:f.tel, onChange:function(v){ set("tel", v); }}),
      e(CampoTexto,{t:"Acerto original", id:"p45orig", type:"date", value:f.orig, disabled:trava, onChange:function(v){ set("orig", v); }}),
      e(CampoSel,{t:"Prazo", id:"p45prazo", value:f.prazo, onChange:function(v){ set("prazo", v); }, opcoes:[["", "Escolher"], ["45", "45 dias"], ["60", "60 dias"]]}),
      e(CampoTexto,{t:"Nova data", id:"p45nova", type:"date", value:f.nova || "", disabled:trava, onChange:function(v){ set("nova", v); }, placeholder:sugestao||""}),
      e(CampoReais,{t:"Média das 3 últimas", id:"p45media", value:f.media, onChange:function(v){ set("media", v); }}),
      e(CampoSel,{t:"Motivo", id:"p45mot", value:f.motivo, onChange:function(v){ set("motivo", v); }, opcoes:[["", "Não informado"]].concat(MOTIVOS)}),
      e(CampoSel,{t:"Origem", id:"p45ori", value:f.origem, onChange:function(v){ set("origem", v); }, opcoes:ORIGENS}),
      e(CampoSel,{t:"Canal", id:"p45canal", value:f.canal, onChange:function(v){ set("canal", v); }, opcoes:[["representante", "Representante"], ["sorelly", "Sorelly"]]}),
      e(CampoSel,{t:"Prazo fixo", id:"p45fixo", value:f.fixo, onChange:function(v){ set("fixo", v); }, opcoes:[["nao", "Não"], ["sim", "Sim, sempre"]]}),
      e(CampoTexto,{t:"Observação", id:"p45obs", value:f.obs, onChange:function(v){ set("obs", v); }, cls:"col-span-2"}),
      e("div",{className:"col-span-2 flex items-end justify-end gap-2 md:col-span-4"},
        sugestao && !f.nova && !trava && e("span",{className:"mr-auto text-[12px] text-foreground/80"}, "Nova data sugerida: "+fmtData(sugestao)+" (acerto + "+(prazoNum===45 ? 15 : 30)+" dias)"),
        e(Botao,{onClick:p.onFechar}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, l ? "Salvar" : "Lançar indicação"))));
}

// ---------- Indicações ----------
function filtrar(ls, f){
  var q = norm(f.busca);
  return ls.filter(function(l){ return (!f.rep || l.rep===f.rep) && (!f.sit || l.situacao===f.sit) && (!f.prazo || String(l.prazo)===f.prazo) && (!q || norm(l.nome).indexOf(q)>=0 || norm(l.codigo).indexOf(q)>=0); });
}
function useFiltros(){ var st = useState({busca:"", rep:"", sit:"", prazo:""}), f = st[0]; return {f:f, set:function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); }, limpar:function(){ st[1]({busca:"", rep:"", sit:"", prazo:""}); }}; }
function BlocoFiltrosP45(p){
  var f = p.F.f, reps = {}; p.ls.forEach(function(l){ reps[l.rep] = 1; });
  return e(BlocoFiltros,{onLimpar:(f.busca || f.rep || f.sit || f.prazo) ? p.F.limpar : null},
    e(CampoBusca,{t:"Buscar", id:"p45busca", value:f.busca, placeholder:"Nome ou código", onChange:function(v){ p.F.set("busca", v); }}),
    e(CampoSel,{t:"Representante", id:"p45frep", value:f.rep, onChange:function(v){ p.F.set("rep", v); }, opcoes:[["", "Todas"]].concat(Object.keys(reps).sort().map(function(n){ return [n, repCurto(n)]; }))}),
    p.semSit ? e(CampoSel,{t:"Prazo", id:"p45fprazo", value:f.prazo, onChange:function(v){ p.F.set("prazo", v); }, opcoes:[["", "Todos"], ["45", "45 dias"], ["60", "60 dias"]]})
      : e(CampoSel,{t:"Situação", id:"p45fsit", value:f.sit, onChange:function(v){ p.F.set("sit", v); }, opcoes:[["", "Todas"]].concat(ORDEM_SIT.map(function(k){ return [k, SITUACOES[k].lb]; }))}));
}

function AbaP45Ind(){
  var c = useP45(), p = c.p, F = useFiltros(), fm = useState(null), form = fm[0], lm = useState(POR_PAGINA), lim = lm[0];
  var r = resumoPlano(c.s), lista = filtrar(p.linhas, F.f), vis = lista.slice(0, lim);
  var comPend = p.linhas.filter(function(l){ return pendencias(l, chaveMesHoje(), c.cfg).some(function(x){ return !x.info && (l.situacao==="analise" || l.situacao==="aprovada"); }); }).length;
  var abaixo = r.reps.filter(function(x){ return x.total>0 && x.total<c.cfg.minimoPorRep; }).length;
  var importar = function(){ if(window.confirm("Importar as linhas da planilha ("+origemLocal()+")? Linhas já existentes (mesmo nome) só recebem os números novos (média, mínimo e RH). Nada é mexido na meta do Agendamento agora.")) c.exec("importar"); };
  return e(Pagina,null,
    e(PageHead,{t:"Indicações do plano 45/60", sub:"Revendedoras indicadas para 45 ou 60 dias. Nome completo e nova data são obrigatórios."},
      c.aprova && temLocal() && e(Botao,{onClick:importar}, "Importar planilha"),
      c.lanca && e(Botao,{principal:true, onClick:function(){ fm[1]({l:null}); }}, "Nova indicação")),
    e(FaixaTotais,{itens:[{t:"No plano", v:inteiro(p.linhas.length)}, {t:"Em análise", v:inteiro(r.porSit.analise)}, {t:"Aprovadas", v:inteiro(r.porSit.aprovada), cor:"text-success"},
      {t:"Encerradas", v:inteiro(r.porSit.reprovada+r.porSit.sem_interesse+r.porSit.saiu)}, {t:"Com pendência", v:inteiro(comPend), cor:comPend>0 ? "text-warning" : ""},
      {t:"Abaixo do mínimo", v:inteiro(abaixo), cor:abaixo>0 ? "text-warning" : ""}]}),
    form && e(FormLinha,{key:form.l ? form.l.id : "nova", c:c, l:form.l, onFechar:function(){ fm[1](null); }}),
    e(BlocoFiltrosP45,{F:F, ls:p.linhas}),
    lista.length ? e(TabelaP,{minW:1200, cols:COLS_LINHA}, vis.map(function(l){
      return e(Tr,{key:l.id, onClick:c.lanca ? function(){ fm[1]({l:l}); } : undefined, title:c.lanca ? "Clique para editar" : undefined},
        e(Td,null, e(SelSit,{s:l.situacao})), e(Td,{title:l.rep}, repCurto(l.rep)), e(Td,{forte:true}, l.nome), e(Td,{n:true}, l.prazo ? l.prazo+" dias" : "—"),
        e(Td,null, fmtData(l.orig)), e(Td,null, fmtData(l.nova)), e(Td,{n:true}, l.media ? brl(l.media) : "—"), e(Td,{n:true}, l.minimo ? brl(l.minimo) : "—"),
        e(Pend,{l:l, cfg:c.cfg}), e(Meta,{l:l, ag:c.ag})); })) : e(Vazio,{ic:"calendar-check"}, p.linhas.length ? "Nenhuma linha com este filtro." : "Nenhuma indicação ainda."+(temLocal() && c.aprova ? " Use Importar planilha para trazer as linhas." : "")),
    lista.length>lim && e("div",{className:"flex items-center justify-center gap-3 text-[13px]"}, e("span",null, "Mostrando "+vis.length+" de "+lista.length), e(Botao,{onClick:function(){ lm[1](lim+POR_PAGINA); }}, "Ver mais")));
}

// ---------- Aprovação ----------
function Decisao(p){
  var c = p.c, l = p.l;
  var st = useState({prazo:l.prazo ? String(l.prazo) : "", nova:l.nova||"", media:l.media ? String(l.media) : "", minimo:l.minimo ? String(l.minimo) : ""}), f = st[0];
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var prazoNum = Number(f.prazo) || null, media = Number(f.media) || null, sug = minimoSugerido(prazoNum, l.canal, c.cfg), nv = f.nova || novaCalculada(l.orig, prazoNum);
  var efeito = efeitoMeta(Object.assign({}, l, {nova:nv}), c.ag, chaveMesHoje());
  var dados = function(){ return {prazo:prazoNum, nova:f.nova || "", media:media, minimo:Number(f.minimo) || null}; };
  var decidir = function(sit){ if(c.exec("situacao", {id:l.id, sit:sit})) p.onFim(); };
  return e(Bloco,{t:"Decisão · "+l.nome, dir:e("span",{className:"text-[12px] text-foreground/80"}, repCurto(l.rep)+" · acerto original "+fmtData(l.orig))},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoSel,{t:"Prazo", id:"p45dprazo", value:f.prazo, onChange:function(v){ set("prazo", v); }, opcoes:[["", "Escolher"], ["45", "45 dias"], ["60", "60 dias"]]}),
      e(CampoTexto,{t:"Nova data", id:"p45dnova", type:"date", value:f.nova || nv || "", onChange:function(v){ set("nova", v); }}),
      e(CampoReais,{t:"Média das 3 últimas", id:"p45dmedia", value:f.media, onChange:function(v){ set("media", v); }}),
      e(CampoReais,{t:"Mínimo do ciclo", id:"p45dmin", value:f.minimo, onChange:function(v){ set("minimo", v); }}),
      e("div",{className:"col-span-2 flex flex-col justify-center gap-0.5 text-[12px] text-foreground/80 md:col-span-4"},
        e("span",null, sug ? "Sugestão: "+brl(sug)+" ("+prazoNum+" dias, "+(l.canal==="sorelly" ? "Sorelly" : "representante")+")." : "Escolha o prazo para ver a sugestão de mínimo."),
        e("span",null, efeito.tipo==="sai" ? "Efeito: sai da meta de "+rotuloMes(efeito.origem)+" e entra em "+rotuloMes(efeito.destino)+"." : efeito.tipo==="mesmo" ? "Efeito: continua na meta de "+rotuloMes(efeito.origem)+"." : efeito.tipo==="atrasada" ? "Efeito: acerto de mês anterior; a meta não é mexida sozinha." : "Efeito: informe prazo e datas.")),
      e("div",{className:"col-span-2 flex flex-wrap items-end justify-end gap-2 md:col-span-4"},
        e(Botao,{onClick:function(){ decidir("saiu"); }}, "Saiu"), e(Botao,{onClick:function(){ decidir("sem_interesse"); }}, "Sem interesse"), e(Botao,{onClick:function(){ decidir("reprovada"); }}, "Reprovar"),
        e(Botao,{principal:true, onClick:function(){ if(c.exec("aprovar", {id:l.id, dados:dados()})) p.onFim(); }}, "Aprovar"))));
}

// pedidos de mudança de data feitos pela representante no app: até N dias depois do acerto vale na hora (fica registrado aqui); além disso a Diretoria decide
var ST_PEDIDO = {analise:{lb:"Em análise", cor:"#FBBF24"}, registrada:{lb:"Registrada", cor:"#4ADE80"}, aprovada:{lb:"Aprovada", cor:"#4ADE80"}, reprovada:{lb:"Reprovada", cor:"#F87171"}};
function PedidosApp(p){
  var c = p.c, ls = (c.p.pedidos||[]).slice().sort(function(x, y){ return (x.status==="analise" ? 0 : 1)-(y.status==="analise" ? 0 : 1) || (x.criadoEm<y.criadoEm ? 1 : -1); });
  if(!ls.length) return e(Vazio,{ic:"check-circle"}, "Nenhum pedido das representantes ainda.");
  return e(TabelaP,{minW:1250, cols:[{t:"Situação", w:110}, {t:"Representante", w:120}, {t:"Revendedora"}, {t:"Acerto atual", w:84}, {t:"Nova data", w:84}, {t:"Dias", w:50, n:true}, {t:"Prazo", w:90}, {t:"Motivo"}, {t:"Mínimo sugerido", w:110, n:true}, {t:"", w:170}]}, ls.map(function(x){
    var st = ST_PEDIDO[x.status], sug = x.prazo ? minimoSugerido(x.prazo, "representante", c.cfg) : null;
    return e(Tr,{key:x.id, apagado:x.status==="reprovada"},
      e(Td,null, e(Selo,{cor:st.cor}, st.lb)), e(Td,{title:x.rep}, repCurto(x.rep)), e(Td,{forte:true}, x.nome), e(Td,null, fmtData(x.dataAtual)), e(Td,null, fmtData(x.novaData)), e(Td,{n:true}, String(x.dias)),
      e(Td,null, x.prazo ? x.prazo+" dias"+(x.fixo ? " fixo" : "") : "Só a data"), e(Td,{title:x.motivo+(x.obs ? " · "+x.obs : "")}, x.motivo+(x.obs ? " · "+x.obs : "")), e(Td,{n:true}, sug ? brl(sug) : "—"),
      e(Td,null, x.status==="analise" && c.aprova ? e("span",{className:"flex gap-1"}, e("button",{type:"button", className:BTN_MINI, onClick:function(){ c.exec("pedido_decidir", {id:x.id, valor:"aprovada"}); }}, "Aprovar"), e("button",{type:"button", className:BTN_MINI, onClick:function(){ c.exec("pedido_decidir", {id:x.id, valor:"reprovada"}); }}, "Reprovar"))
        : x.decididoPor ? x.decididoPor : "—")); }));
}

function AbaP45Apr(){
  var c = useP45(), p = c.p, F = useFiltros(), ab = useState("analise"), aba = ab[0], sl = useState(null), sel = sl[0], lm = useState(POR_PAGINA), lim = lm[0];
  var r = resumoPlano(c.s), analise = p.linhas.filter(function(l){ return l.situacao==="analise"; }), aprovadas = p.linhas.filter(function(l){ return l.situacao==="aprovada"; }), outras = p.linhas.filter(function(l){ return l.situacao!=="analise" && l.situacao!=="aprovada"; });
  var base = aba==="analise" ? analise : aba==="aprovada" ? aprovadas : outras, lista = filtrar(base, F.f), vis = lista.slice(0, lim);
  var atual = sel && p.linhas.filter(function(l){ return l.id===sel; })[0];
  var cols = aba==="aprovada" ? COLS_LINHA.concat([{t:"", w:90}]) : aba==="outras" ? COLS_LINHA.concat([{t:"", w:130}]) : COLS_LINHA;
  return e(Pagina,null,
    e(PageHead,{t:"Aprovação do plano 45/60", sub:"A Diretoria decide e fixa o mínimo de vendas. Aprovada e mudando de mês, sai da meta de um mês e entra no outro."}),
    e(FaixaTotais,{itens:[{t:"Em análise", v:inteiro(analise.length), cor:analise.length>0 ? "text-warning" : ""}, {t:"Aprovadas", v:inteiro(aprovadas.length), cor:"text-success"}, {t:"Mínimos somados", v:brl(r.minimoTotal)},
      {t:"Saem de "+rotuloMes(r.ym), v:inteiro(r.saiMes)}, {t:"Fora da meta ainda", v:inteiro(r.pend.fora_meta), cor:r.pend.fora_meta>0 ? "text-warning" : ""}, {t:"Pedidos do app", v:inteiro(r.pedAnalise), cor:r.pedAnalise>0 ? "text-warning" : ""}]}),
    !c.aprova && e("p",{className:"rounded-lg border border-border bg-card/60 px-3 py-2 text-[13px]"}, "Só a Diretoria aprova. Você pode consultar a fila."),
    e(AbasTela,{abas:[["analise", "Em análise ("+analise.length+")"], ["aprovada", "Aprovadas ("+aprovadas.length+")"], ["pedidos", "Pedidos do app ("+r.pedAnalise+")"], ["outras", "Reprovadas e saídas ("+outras.length+")"]], atual:aba, onMudar:function(k){ ab[1](k); sl[1](null); lm[1](POR_PAGINA); }}),
    aba==="aprovada" && c.aprova && r.pend.fora_meta>0 && e("div",{className:"flex flex-wrap items-center justify-between gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-[13px]"},
      e("span",null, r.pend.fora_meta+" aprovada"+(r.pend.fora_meta===1 ? "" : "s")+" mudam de mês e ainda não estão na meta do Agendamento."), e(Botao,{principal:true, onClick:function(){ ajustarMeta(c, r.pend.fora_meta); }}, "Ajustar a meta")),
    atual && aba==="analise" && c.aprova && e(Decisao,{key:atual.id, c:c, l:atual, onFim:function(){ sl[1](null); }}),
    aba==="pedidos" && e(PedidosApp,{c:c}),
    aba!=="pedidos" && e(BlocoFiltrosP45,{F:F, ls:base, semSit:true}),
    aba==="pedidos" ? null : lista.length ? e(TabelaP,{minW:aba==="analise" ? 1200 : 1330, cols:cols}, vis.map(function(l){
      return e(Tr,{key:l.id, onClick:aba==="analise" && c.aprova ? function(){ sl[1](l.id); } : undefined, title:aba==="analise" && c.aprova ? "Clique para decidir" : undefined, apagado:aba==="outras"},
        e(Td,null, e(SelSit,{s:l.situacao})), e(Td,{title:l.rep}, repCurto(l.rep)), e(Td,{forte:true}, l.nome), e(Td,{n:true}, l.prazo ? l.prazo+" dias" : "—"),
        e(Td,null, fmtData(l.orig)), e(Td,null, fmtData(l.nova)), e(Td,{n:true}, l.media ? brl(l.media) : "—"), e(Td,{n:true}, l.minimo ? brl(l.minimo) : "—"), e(Pend,{l:l, cfg:c.cfg}), e(Meta,{l:l, ag:c.ag}),
        aba!=="analise" && e(Td,null, c.aprova && e("button",{type:"button", className:BTN_MINI, onClick:function(ev){ ev.stopPropagation(); if(aba==="aprovada" && !window.confirm("Voltar "+l.nome+" para análise? Se ela já saiu da meta, o ajuste é desfeito.")) return; c.exec("situacao", {id:l.id, sit:"analise"}); }}, aba==="aprovada" ? "Desfazer" : "Voltar para análise")));
    })) : e(Vazio,{ic:"check-circle"}, aba==="analise" ? "Nenhuma linha em análise." : "Nenhuma linha com este filtro."),
    aba!=="pedidos" && lista.length>lim && e("div",{className:"flex items-center justify-center gap-3 text-[13px]"}, e("span",null, "Mostrando "+vis.length+" de "+lista.length), e(Botao,{onClick:function(){ lm[1](lim+POR_PAGINA); }}, "Ver mais")));
}

// ---------- Acompanhamento do ciclo (Fase 2) ----------
var CICLO = {avaliada:{lb:"Avaliada", cor:"#4ADE80"}, vencido:{lb:"Venda a lançar", cor:"#F87171"}, aguardando:{lb:"Aguardando", cor:"#94A3B8"}};
var pc1 = function(v){ return v===null || v===undefined ? "—" : (v>0 ? "+" : "")+v.toLocaleString("pt-BR", {maximumFractionDigits:0})+"%"; };
var rotContato = function(x){ return x ? x.charAt(0)+x.slice(1).toLowerCase() : "—"; };
function FormAcomp(p){
  var c = p.c, l = p.l;
  var st = useState({contato:l.contato||"", contatoEm:l.contatoEm||"", rh:l.rh===true ? "sim" : l.rh===false ? "nao" : "", entrega:l.entrega||"", venda:l.vendaCiclo!=null ? String(l.vendaCiclo) : ""}), f = st[0];
  var set = function(k, v){ var o = Object.assign({}, f); o[k] = v; st[1](o); };
  var vivo = Object.assign({}, l, {vendaCiclo:f.venda==="" ? null : Number(f.venda)}), cr = crescimento(vivo), sug = decisaoDe(vivo, c.cfg), tempo = diasEntre(f.entrega, l.nova);
  var salvar = function(){ if(c.exec("acomp", {id:l.id, dados:{contato:f.contato, contatoEm:f.contatoEm, rh:f.rh==="sim" ? true : f.rh==="nao" ? false : null, entrega:f.entrega, venda:f.venda==="" ? null : Number(f.venda)}})) p.onFechar(); };
  var atual = decisaoFinal(l, c.cfg);
  return e(Bloco,{t:"Acompanhamento · "+l.nome, dir:e(Botao,{onClick:p.onFechar}, "Fechar")},
    e("div",{className:"grid grid-cols-2 gap-x-3 gap-y-2 md:grid-cols-4"},
      e(CampoSel,{t:"Contato", id:"p45ac", value:f.contato, onChange:function(v){ set("contato", v); }, opcoes:[["", "Não registrado"]].concat(CONTATOS.map(function(x){ return [x, rotContato(x)]; }))}),
      e(CampoTexto,{t:"Data do contato", id:"p45acd", type:"date", value:f.contatoEm, onChange:function(v){ set("contatoEm", v); }}),
      e(CampoSel,{t:"RH chamou", id:"p45arh", value:f.rh, onChange:function(v){ set("rh", v); }, opcoes:[["", "Não informado"], ["sim", "Sim"], ["nao", "Não"]]}),
      e(CampoTexto,{t:"Entrega do kit", id:"p45aen", type:"date", value:f.entrega, onChange:function(v){ set("entrega", v); }}),
      e(CampoReais,{t:"Venda no ciclo", id:"p45ave", value:f.venda, onChange:function(v){ set("venda", v); }}),
      e("div",{className:"col-span-2 flex flex-wrap items-end gap-x-4 gap-y-1 pb-1 text-[12px] md:col-span-3"},
        e("span",null, "Média: "+(l.media ? brl(l.media) : "—")), e("span",null, "Mínimo: "+(l.minimo ? brl(l.minimo) : "—")), e("span",null, "Crescimento: "+pc1(cr)),
        tempo!==null && e("span",null, "Tempo total: "+tempo+" dias"),
        e("span",{className:sug==="mantem" ? "text-success" : sug ? "text-destructive" : ""}, sug ? "Resultado: "+DECISOES[sug].lb : "Resultado: lance a venda")),
      e("div",{className:"col-span-2 flex flex-wrap items-end justify-end gap-2 md:col-span-4"},
        c.aprova && l.vendaCiclo!=null && e(CampoSel,{t:"Decisão do ciclo", id:"p45adec", value:l.decisaoManual ? l.decisao : "", cls:"w-56", onChange:function(v){ c.exec("decisao", {id:l.id, valor:v}); }, opcoes:[["", "Automática"+(atual ? " ("+DECISOES[atual].lb+")" : "")], ["mantem", "Mantém"], ["volta30", "Volta a 30 dias"]]}),
        e(Botao,{onClick:p.onFechar}, "Cancelar"), e(Botao,{principal:true, onClick:salvar}, "Salvar"))));
}
function AbaP45Acomp(){
  var c = useP45(), F = useFiltros(), cs = useState(""), cf = cs[0], fm = useState(null), form = fm[0], lm = useState(POR_PAGINA), lim = lm[0];
  var r = resumoPlano(c.s), ci = r.ciclo, hj = hojeIsoLocal(), aprovadas = c.p.linhas.filter(function(l){ return l.situacao==="aprovada"; });
  var lista = filtrar(aprovadas, F.f).filter(function(l){ return !cf || (cf==="sem_contato" ? !l.contato : cicloDe(l, hj)===cf); }).sort(function(x, y){ return (x.nova||"9")<(y.nova||"9") ? -1 : 1; }), vis = lista.slice(0, lim);
  var atual = form && c.p.linhas.filter(function(l){ return l.id===form; })[0], reps = {}; aprovadas.forEach(function(l){ reps[l.rep] = 1; });
  return e(Pagina,null,
    e(PageHead,{t:"Acompanhamento do plano 45/60", sub:"Contato, entrega do kit e venda de cada aprovada. A venda do ciclo decide: mantém o prazo ou volta a 30 dias."}),
    e(FaixaTotais,{itens:[{t:"Aprovadas", v:inteiro(ci.aprovadas)}, {t:"Aguardando", v:inteiro(ci.aguardando)}, {t:"A lançar", v:inteiro(ci.vencidas), cor:ci.vencidas>0 ? "text-warning" : ""}, {t:"Avaliadas", v:inteiro(ci.avaliadas)},
      {t:"Mantêm", v:inteiro(ci.mantem), cor:"text-success"}, {t:"Voltam a 30", v:inteiro(ci.volta30), cor:ci.volta30>0 ? "text-destructive" : ""}, {t:"Manutenção", v:ci.taxa===null ? "—" : ci.taxa.toLocaleString("pt-BR", {maximumFractionDigits:0})+"%"}]}),
    atual && c.lanca && e(FormAcomp,{key:atual.id, c:c, l:atual, onFechar:function(){ fm[1](null); }}),
    e(BlocoFiltros,{onLimpar:(F.f.busca || F.f.rep || cf) ? function(){ F.limpar(); cs[1](""); } : null},
      e(CampoBusca,{t:"Buscar", id:"p45abusca", value:F.f.busca, placeholder:"Nome ou código", onChange:function(v){ F.set("busca", v); }}),
      e(CampoSel,{t:"Representante", id:"p45arep", value:F.f.rep, onChange:function(v){ F.set("rep", v); }, opcoes:[["", "Todas"]].concat(Object.keys(reps).sort().map(function(n){ return [n, repCurto(n)]; }))}),
      e(CampoSel,{t:"Ciclo", id:"p45aciclo", value:cf, onChange:function(v){ cs[1](v); }, opcoes:[["", "Todos"], ["aguardando", "Aguardando"], ["vencido", "Venda a lançar"], ["avaliada", "Avaliadas"], ["sem_contato", "Sem contato"]]})),
    lista.length ? e(TabelaP,{minW:1300, cols:[{t:"Ciclo", w:120}, {t:"Representante", w:130}, {t:"Revendedora"}, {t:"Nova data", w:76}, {t:"Contato", w:110}, {t:"RH", w:50}, {t:"Entrega", w:76}, {t:"Mínimo", w:96, n:true}, {t:"Venda", w:96, n:true}, {t:"Cresc.", w:70, n:true}, {t:"Decisão", w:130}]}, vis.map(function(l){
      var ciclo = cicloDe(l, hj), dec = decisaoFinal(l, c.cfg), cr = crescimento(l);
      return e(Tr,{key:l.id, onClick:c.lanca ? function(){ fm[1](l.id); } : undefined, title:c.lanca ? "Clique para registrar" : undefined},
        e(Td,null, e(Selo,{cor:CICLO[ciclo].cor}, CICLO[ciclo].lb)), e(Td,{title:l.rep}, repCurto(l.rep)), e(Td,{forte:true}, l.nome), e(Td,null, fmtData(l.nova)),
        e(Td,{cor:l.contato==="SEM RETORNO" ? "text-warning" : ""}, rotContato(l.contato)), e(Td,null, l.rh===true ? "Sim" : l.rh===false ? "Não" : "—"), e(Td,null, fmtData(l.entrega)),
        e(Td,{n:true}, l.minimo ? brl(l.minimo) : "—"), e(Td,{n:true}, l.vendaCiclo!=null ? brl(l.vendaCiclo) : "—"), e(Td,{n:true, cor:cr===null ? "" : cr>0 ? "text-success" : cr<0 ? "text-destructive" : ""}, pc1(cr)),
        e(Td,{cor:dec==="mantem" ? "text-success" : dec ? "text-destructive" : "", title:l.decisaoManual ? "Decidido à mão pela Diretoria" : ""}, dec ? DECISOES[dec].lb+(l.decisaoManual ? " *" : "") : "—")); })) : e(Vazio,{ic:"check-circle"}, aprovadas.length ? "Nenhuma aprovada com este filtro." : "Nenhuma aprovada ainda. Aprove em Aprovação."),
    lista.length>lim && e("div",{className:"flex items-center justify-center gap-3 text-[13px]"}, e("span",null, "Mostrando "+vis.length+" de "+lista.length), e(Botao,{onClick:function(){ lm[1](lim+POR_PAGINA); }}, "Ver mais")));
}

// ---------- Painel do plano ----------
// fila dos Kits novos (lida do app Kits novos): o espaço aberto nas rotas pelas saídas do mês deve virar entrega de kit novo
function BlocoKitsNovos(p){
  var k = lerFilaKitsNovos();
  if(!k) return e(Bloco,{t:"Kits novos em fila"}, e(Vazio,{ic:"calendar-check"}, "Sem dados dos Kits novos neste computador. Abra Cadastro de revendedoras → Kits novos para atualizar."));
  var reps = Object.keys(k.porRep).sort(function(a, b){ return k.porRep[b]-k.porRep[a]; }).slice(0, 6);
  return e(Bloco,{t:"Kits novos em fila", dir:e("span",{className:"text-[12px] text-foreground/80"}, "lido do app Kits novos")},
    e(TabelaP,{cols:[{t:"Etapa dos Kits novos"}, {t:"Kits", w:90, n:true}]},
      e(Tr,null, e(Td,null, "Na fila, sem representante aceitar"), e(Td,{n:true, cor:k.fila>0 ? "text-warning" : ""}, inteiro(k.fila))),
      e(Tr,null, e(Td,null, "  desses, sem representante indicada"), e(Td,{n:true, cor:k.semRep>0 ? "text-warning" : ""}, inteiro(k.semRep))),
      e(Tr,null, e(Td,null, "Com a representante (aceito, contato, agendado)"), e(Td,{n:true}, inteiro(k.comRep))),
      e(Tr,null, e(Td,null, "Na empresa (montando, bipado, retirado)"), e(Td,{n:true}, inteiro(k.naEmpresa))),
      e(Tr,null, e(Td,null, "Entregues"), e(Td,{n:true, cor:"text-success"}, inteiro(k.entregues))),
      e(Tr,{total:true}, e(Td,null, "Rotas abertas pelo plano em "+rotuloMes(p.ym)), e(Td,{n:true}, inteiro(p.saidas)))),
    reps.length>0 && e("p",{className:"mt-2 text-[12px] text-foreground/80"}, "Mais kits novos em andamento: "+reps.map(function(n){ return repCurto(n)+" ("+k.porRep[n]+")"; }).join(", ")+"."),
    e("p",{className:"mt-1 text-[12px] text-foreground/80"}, "Cada acerto que sai da meta libera tempo na rota. Compare com a fila: "+inteiro(k.fila)+" kits ainda esperam uma representante."));
}

function AbaP45Pnl(){
  var c = useP45(), p = c.p, r = resumoPlano(c.s), pe = r.pend, cfg = c.cfg;
  var linhaPend = function(t, n, grave){ return e(Tr,{key:t}, e(Td,null, t), e(Td,{n:true, cor:n>0 ? (grave ? "text-destructive" : "text-warning") : "", forte:n>0}, inteiro(n))); };
  var minimo = cfg.minimoPorRep;
  return e(Pagina,null,
    e(PageHead,{t:"Painel do plano 45/60", sub:"Quem entrou, quem saiu da meta e a previsão de "+rotuloMes(r.ym)+" já sem as adiadas."}),
    e(FaixaTotais,{itens:[{t:"No plano", v:inteiro(r.total)}, {t:"Aprovadas", v:inteiro(r.porSit.aprovada), cor:"text-success"}, {t:"Em análise", v:inteiro(r.porSit.analise), cor:r.porSit.analise>0 ? "text-warning" : ""},
      {t:"Encerradas", v:inteiro(r.porSit.reprovada+r.porSit.sem_interesse+r.porSit.saiu)}, {t:"Saem de "+rotuloMes(r.ym), v:inteiro(r.saiMes)}, {t:"Mínimos somados", v:brl(r.minimoTotal)}]}),
    !p.linhas.length && e(Vazio,{ic:"calendar-check"}, "O plano ainda está vazio. Lance as indicações ou importe a planilha em Indicações."),
    p.linhas.length>0 && e("div",{className:"grid grid-cols-1 gap-2.5 xl:grid-cols-2"},
      e(Bloco,{t:"Meta de "+rotuloMes(r.ym)+" e previsão"},
        r.mesAberto ? e("div",{className:"flex flex-col gap-2"},
          e(TabelaP,{cols:[{t:"Como a meta se forma"}, {t:"Revendedoras", w:120, n:true}]},
            e(Tr,null, e(Td,null, "Previstos na abertura do mês"), e(Td,{n:true}, inteiro(r.base))),
            e(Tr,null, e(Td,null, "Saídas pelo plano 45/60"), e(Td,{n:true, cor:r.saemPlano>0 ? "text-destructive" : ""}, r.saemPlano ? "−"+inteiro(r.saemPlano) : "0")),
            e(Tr,null, e(Td,null, "Outras remarcações (saem)"), e(Td,{n:true, cor:r.outrasSaidas>0 ? "text-destructive" : ""}, r.outrasSaidas ? "−"+inteiro(r.outrasSaidas) : "0")),
            e(Tr,null, e(Td,null, "Chegadas de outros meses"), e(Td,{n:true, cor:r.entramPlano+r.outrasChegadas>0 ? "text-success" : ""}, r.entramPlano+r.outrasChegadas ? "+"+inteiro(r.entramPlano+r.outrasChegadas) : "0")),
            e(Tr,{total:true}, e(Td,null, "Previstos ajustados"), e(Td,{n:true}, inteiro(r.ajustados))),
            e(Tr,null, e(Td,null, "Sem o plano seriam"), e(Td,{n:true}, inteiro(r.semPlano)))),
          e(TabelaP,{cols:[{t:"Meta do Agendamento"}, {t:"Acertos", w:90, n:true}, {t:"Faturamento", w:130, n:true}]}, r.cenarios.map(function(x){ return e(Tr,{key:x.pct}, e(Td,null, x.pct+"%"), e(Td,{n:true}, inteiro(x.acertos)), e(Td,{n:true}, brl(x.valor))); })),
          e("p",{className:"text-[12px] text-foreground/80"}, "Previsão = previstos ajustados × % da meta × média por acerto de "+brl(cfg.mediaAcerto)+" (parâmetro do plano). O adiamento não cria faturamento: o valor das saídas entra no mês de destino."))
          : e(Vazio,{ic:"calendar-check"}, "Nenhum mês aberto no Agendamento. Abra o mês em Gestão do mês → Abertura do mês.")),
      e(Bloco,{t:"Para onde vão as aprovadas", dir:c.aprova && pe.fora_meta>0 ? e(Botao,{principal:true, onClick:function(){ ajustarMeta(c, pe.fora_meta); }}, "Ajustar a meta ("+pe.fora_meta+")") : null},
        r.fluxo.length ? e(TabelaP,{cols:[{t:"Acerto original"}, {t:"Nova data"}, {t:"Aprovadas", w:90, n:true}, {t:"Na meta", w:80, n:true}, {t:"Situação", w:170}]}, r.fluxo.map(function(x){
          return e(Tr,{key:x.origem+x.destino}, e(Td,null, rotuloMes(x.origem)), e(Td,null, rotuloMes(x.destino)), e(Td,{n:true}, inteiro(x.aprovadas)), e(Td,{n:true}, x.tipo==="sai" ? inteiro(x.naMeta) : "—"),
            e(Td,{cor:x.tipo==="atrasada" ? "text-warning" : x.tipo==="sai" && x.naMeta<x.aprovadas ? "text-warning" : "", title:x.tipo==="atrasada" ? "Acerto de mês que já passou: confirmar com o Agendamento se conta na meta do mês de destino" : ""},
              x.tipo==="mesmo" ? "Continua na meta do mês" : x.tipo==="atrasada" ? "Mês anterior · confirmar" : x.naMeta===x.aprovadas ? "Meta ajustada" : "Falta ajustar a meta")); }))
          : e(Vazio,{ic:"check-circle"}, "Nenhuma aprovada ainda.")),
      e(Bloco,{t:"Pendências"},
        e(TabelaP,{cols:[{t:"O que falta"}, {t:"Linhas", w:90, n:true}]},
          linhaPend("Prazo inválido", pe.prazo, true), linhaPend("Sem nova data", pe.nova, true), linhaPend("Sem média de venda", pe.sem_media), linhaPend("Aprovadas sem mínimo de vendas", pe.sem_minimo),
          linhaPend("Aprovadas sem contato registrado", pe.sem_contato), linhaPend("Aprovadas sem retorno da revendedora", pe.sem_retorno), linhaPend("Aprovadas de mês anterior (confirmar na meta)", pe.atrasada),
          linhaPend("Nova data fora dos dias "+cfg.janelaIni+" a "+cfg.janelaFim+" (aviso)", pe.janela)),
        r.foraCadastro.length>0 && e("p",{className:"mt-2 text-[12px] text-warning"}, "Representante fora do cadastro do Agendamento: "+r.foraCadastro.map(repCurto).join(", ")+".")),
      e(BlocoKitsNovos,{saidas:r.saiMes, ym:r.ym}),
      e(Bloco,{t:"Ciclo estendido", dir:e("span",{className:"text-[12px] text-foreground/80"}, "mantém se atingir o mínimo")},
        e(TabelaP,{cols:[{t:"Das aprovadas"}, {t:"Revendedoras", w:110, n:true}]},
          e(Tr,null, e(Td,null, "Aguardando a nova data"), e(Td,{n:true}, inteiro(r.ciclo.aguardando))),
          e(Tr,null, e(Td,null, "Nova data chegou, falta lançar a venda"), e(Td,{n:true, cor:r.ciclo.vencidas>0 ? "text-warning" : ""}, inteiro(r.ciclo.vencidas))),
          e(Tr,null, e(Td,null, "Avaliadas"), e(Td,{n:true}, inteiro(r.ciclo.avaliadas))),
          e(Tr,null, e(Td,null, "Mantêm o prazo"), e(Td,{n:true, cor:r.ciclo.mantem>0 ? "text-success" : ""}, inteiro(r.ciclo.mantem))),
          e(Tr,null, e(Td,null, "Voltam a 30 dias"), e(Td,{n:true, cor:r.ciclo.volta30>0 ? "text-destructive" : ""}, inteiro(r.ciclo.volta30))),
          e(Tr,{total:true}, e(Td,null, "Taxa de manutenção"), e(Td,{n:true}, r.ciclo.taxa===null ? "—" : r.ciclo.taxa.toLocaleString("pt-BR", {maximumFractionDigits:0})+"%")),
          e(Tr,null, e(Td,null, "Crescimento médio das avaliadas"), e(Td,{n:true}, pc1(r.ciclo.crescMedio))))),
      e(Bloco,{t:"Indicações por representante", dir:e("span",{className:"text-[12px] text-foreground/80"}, "mínimo de "+minimo+" cada")},
        e(TabelaP,{cols:[{t:"Representante"}, {t:"Indicadas", w:80, n:true}, {t:"Aprovadas", w:80, n:true}, {t:"Em análise", w:80, n:true}, {t:"Mínimo", w:110}]}, r.reps.map(function(x){
          var falta = Math.max(0, minimo-x.total);
          return e(Tr,{key:x.rep}, e(Td,{title:x.rep}, repCurto(x.rep)), e(Td,{n:true}, inteiro(x.total)), e(Td,{n:true}, inteiro(x.aprovada)), e(Td,{n:true}, inteiro(x.analise)),
            e(Td,{cor:x.total===0 ? "" : falta>0 ? "text-warning" : "text-success"}, x.total===0 ? "Sem lista" : falta>0 ? "Falta "+falta : "Cumprido")); })))));
}

export { AbaP45Ind, AbaP45Apr, AbaP45Acomp, AbaP45Pnl };

// Sorelly Admin · montagem — pages/avaliacoes/Funcionarios.js
// Avaliações → Funcionários (pelos supervisores): pendentes do mês, nota por critério, médias por funcionária e por setor, histórico com gráfico.
// Cada supervisor vê só o seu setor; a diretoria vê todos (regra em domain/avaliacoes.js: avFuncPodeSetor).
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Mosaico, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { avFuncAvaliacoes, avFuncCriterios, avFuncHistorico, avFuncPendentes, avFuncPorFuncionaria, avFuncPorSetor, avFuncResumo, avFuncSetoresVisiveis, formatarMes, formatarNota, hojeSP, notaFinalFunc } from "@/apps/montagem/domain/avaliacoes";
import { funcionarios } from "@/apps/montagem/domain/pessoas";
import { Bt, BtMini, Busca, Chip, Colunas, Janela, Painel, BarraFiltros } from "@/apps/montagem/pages/indicacoes/visual";
import { COR, Area, Campo, ErroAv, Escolha, Serie, Texto, Vazio, cap, corFunc, nomeCurto, useAv } from "@/apps/montagem/pages/avaliacoes/visual";
import { MONO } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

// quem pode ser avaliado: funcionários CLT de domain/pessoas.js (a identidade é o nome; o setor vem do quadro de pessoas)
function quadro(){ return funcionarios().filter(function(f){ return f.vinculo==="clt"; }).map(function(f){ return {id:f.nome, nome:f.nome, setor:f.setor}; }); }
var mesAtual = function(){ return hojeSP().slice(0, 7); };

// ---------- lançar a nota do mês ----------
function NotaJanela(p){
  var a = useAv(), f = a.av.config.func, crits = avFuncCriterios(a.s, true), st0 = useState(p.mes || mesAtual()), mes = st0[0];
  var existente = avFuncAvaliacoes(a.s, a.quem, {funcId:p.func.id, mes:mes})[0];
  var ini = existente ? {notas:existente.notas, comentario:existente.comentario} : {notas:{}, comentario:""};
  var st1 = useState(ini.notas), st2 = useState(ini.comentario), notas = st1[0], coment = st2[0];
  var pesos = {}; crits.forEach(function(c){ pesos[c.id] = c.peso; });
  var feitas = crits.filter(function(c){ return notas[c.id]!=null; }).length, final = feitas ? notaFinalFunc(notas, pesos) : null;
  var trocaMes = function(m){ st0[1](m); var ex = avFuncAvaliacoes(a.s, a.quem, {funcId:p.func.id, mes:m})[0]; st1[1](ex ? ex.notas : {}); st2[1](ex ? ex.comentario : ""); };
  var salvar = function(){ if(a.agir({op:"func_nota", funcId:p.func.id, funcNome:p.func.nome, setor:p.func.setor, mes:mes, notas:notas, comentario:coment, usuarioId:a.quem.usuarioId, diretoria:a.quem.diretoria})) p.fechar(); };
  var escala = []; for(var i = 1; i<=f.escalaMax; i++) escala.push(i);
  return e(Janela,{t:cap(nomeCurto(p.func.nome)), sub:p.func.setor+" · avaliação de "+formatarMes(mes)+(existente ? " (refazer)" : ""), fechar:p.fechar, tam:"xl"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Colunas,{n:3},
      e(Painel,{t:"Funcionária", ic:"identification-badge", estado:"feito"},
        e("b",{className:"text-[14px]"}, p.func.nome), e("span",{className:"text-[12.5px] text-white/75"}, p.func.setor),
        e(Campo,{r:"Mês avaliado"}, e(Texto,{tipo:"month", v:mes, set:trocaMes, ph:"Mês"})),
        existente && e("span",{className:"text-[12px] text-white/70"}, "Já avaliada em "+formatarMes(mes)+" (nota "+formatarNota(existente.notaFinal)+"). Salvar substitui e guarda a versão anterior.")),
      e(Painel,{t:"Critérios (nota de 1 a "+f.escalaMax+")", ic:"list-checks", estado:feitas===crits.length && crits.length ? "feito" : "atual"},
        crits.length ? crits.map(function(c){ return e("div",{key:c.id, className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 ring-1 ring-white/10"},
          e("b",{className:"text-[12.5px]"}, cap(c.nome)+(c.peso!==1 ? " · peso "+String(c.peso).replace(".", ",") : "")),
          e("div",{className:"flex flex-wrap justify-center gap-1"}, escala.map(function(n){ return e(Escolha,{key:n, on:notas[c.id]===n, onClick:function(){ var x = Object.assign({}, notas); x[c.id] = n; st1[1](x); }}, n); }))); })
          : e(Vazio,{ic:"list-checks"}, "Nenhum critério ativo. Cadastre no Configurador.")),
      e(Painel,{t:"Comentário e nota final", ic:"chat-circle-text"},
        e(Area,{v:coment, set:st2[1], max:f.comentarioMax, linhas:5, ph:"Comentário do supervisor (opcional)"}),
        e("span",{className:"text-[11px] text-white/60"}, coment.length+" / "+f.comentarioMax),
        e("div",{className:"flex flex-col items-center rounded-xl py-2 ring-1 ring-white/10"}, e("b",{className:MONO+" text-[22px]", style:{color:corFunc(final, f)}}, formatarNota(final)),
          e("span",{className:"text-[10.5px] font-bold uppercase tracking-wide text-white/70"}, "Nota final ("+feitas+" de "+crits.length+" critérios)")))),
    e("div",{className:"flex justify-center"}, e(Bt,{tipo:"forte", ic:"check-circle", onClick:salvar}, existente ? "Refazer avaliação" : "Salvar avaliação")));
}

// ---------- histórico de uma funcionária ----------
function HistoricoJanela(p){
  var a = useAv(), h = avFuncHistorico(a.s, a.quem, p.func.id), f = a.av.config.func, pf = avFuncPorFuncionaria(a.s, a.quem, {funcId:p.func.id})[0], st = useState(null);
  return e(Janela,{t:cap(nomeCurto(p.func.nome)), sub:p.func.setor+" · média "+formatarNota(h.media)+" · "+h.avaliacoes.length+(h.avaliacoes.length===1 ? " avaliação" : " avaliações"), fechar:p.fechar, tam:"xl"},
    e(ErroAv,{erro:a.erro, limpar:function(){ a.setErro(null); }}),
    e(Colunas,{n:3},
      e(Painel,{t:"Evolução da nota", ic:"chart-line-up"}, h.serie.length ? e(Serie,{pontos:h.serie.map(function(x){ return {r:formatarMes(x.mes), v:x.nota}; }).slice(-8), max:f.escalaMax}) : e(Vazio,{ic:"chart-line-up"}, "Sem avaliações ainda.")),
      e(Painel,{t:"Média por critério", ic:"list-checks"}, pf && pf.porCriterio.length ? e(Tab,{cols:["Critério", "Média"]}, pf.porCriterio.map(function(c){
        return e("tr",{key:c.id, className:LINHA}, e(Td,{forte:true}, cap(c.nome)), e(Td,{dinheiro:true, forte:true, cor:corFunc(c.media, f)}, formatarNota(c.media))); })) : e(Vazio,{ic:"list-checks"}, "Sem notas por critério.")),
      e(Painel,{t:"Avaliações", ic:"clock-counter-clockwise"}, h.avaliacoes.length ? h.avaliacoes.map(function(x){
        return e("div",{key:x.id, className:"flex flex-col items-center gap-1 rounded-xl bg-black/20 p-2 text-center ring-1 ring-white/10"},
          e("div",{className:"flex flex-wrap items-center justify-center gap-x-2 text-[12.5px]"}, e("b",null, formatarMes(x.mes)), e("b",{className:MONO, style:{color:corFunc(x.notaFinal, f)}}, formatarNota(x.notaFinal)), e("span",{className:"text-white/60"}, "por "+x.por)),
          x.comentario && e("span",{className:"text-[12px] italic"}, "“"+x.comentario+"”"),
          x.historico && x.historico.length>0 && e("span",{className:"text-[11px] text-white/55"}, "Refeita "+x.historico.length+(x.historico.length===1 ? " vez" : " vezes")),
          e("div",{className:"flex flex-wrap justify-center gap-1"},
            e(BtMini,{titulo:"Refazer a avaliação do mês", onClick:function(){ p.refazer(x.mes); }}, e(Ph,{n:"pencil-simple", s:12}), "Refazer"),
            st[0]===x.id ? e(BtMini,{titulo:"Confirmar a exclusão", onClick:function(){ a.agir({op:"func_nota_del", id:x.id, usuarioId:a.quem.usuarioId, diretoria:a.quem.diretoria}); st[1](null); }}, e(Ph,{n:"trash", s:12}), "Confirmar exclusão")
              : e(BtMini,{titulo:"Excluir", onClick:function(){ st[1](x.id); }}, e(Ph,{n:"trash", s:12}), "Excluir"))); }) : e(Vazio,{ic:"star"}, "Nenhuma avaliação lançada."))));
}

// ---------- aba ----------
function AbaAvFunc(){
  var a = useAv(), cfg = a.av.config.func, st = useState(""), busca = st[0], sf = useState(""), filtroSetor = sf[0], sj = useState(null), jan = sj[0];
  var todos = quadro(), setoresPessoas = todos.map(function(f){ return f.setor; }).filter(function(x, i, v){ return v.indexOf(x)===i; });
  var visiveis = avFuncSetoresVisiveis(a.s, a.quem, setoresPessoas), mes = mesAtual();
  if(!visiveis.length) return e(BlocoBarra,{cor:"laranja", t:"Avaliação de funcionários", compacto:true}, e(Vazio,{ic:"lock-key"}, "Nenhum setor sob a sua supervisão. A diretoria define os supervisores no Configurador."));
  var b = busca.trim().toLowerCase(), setorOk = function(s){ return visiveis.indexOf(s)>=0 && (!filtroSetor || s===filtroSetor); };
  var pend = avFuncPendentes(a.s, a.quem, todos, mes).filter(function(x){ return setorOk(x.setor) && (!b || x.nome.toLowerCase().indexOf(b)>=0); });
  var resumo = avFuncResumo(a.s, a.quem, mes), pessoas = avFuncPorFuncionaria(a.s, a.quem).filter(function(x){ return setorOk(x.setor) && (!b || x.funcNome.toLowerCase().indexOf(b)>=0); });
  var porSetor = avFuncPorSetor(a.s, a.quem).filter(function(x){ return setorOk(x.setor); });
  var elegiveis = todos.filter(function(x){ return setorOk(x.setor); }).length;
  var pendPorSetor = {}; pend.forEach(function(x){ (pendPorSetor[x.setor] = pendPorSetor[x.setor] || []).push(x); });
  var abre = function(tipo, func, mesX){ sj[1]({t:tipo, func:func, mes:mesX}); };
  var limpar = busca || filtroSetor ? function(){ st[1](""); sf[1](""); } : null;
  var fecha = function(){ sj[1](null); };
  return e("div",{className:"flex flex-col gap-2.5"},
    e(Faixa,{n:4},
      e(Indicador,{t:"Pendentes em "+formatarMes(mes), v:pend.length, cor:pend.length ? "alerta" : "ok", sub:"De "+elegiveis+" funcionárias"}),
      e(Indicador,{t:"Avaliadas no mês", v:resumo.avaliacoes, cor:"info"}),
      e(Indicador,{t:"Média do mês", v:formatarNota(resumo.media), cor:corFunc(resumo.media, cfg), sub:"Escala de 1 a "+cfg.escalaMax}),
      e(Indicador,{t:"Setores visíveis", v:visiveis.length, cor:"total"})),
    e(BarraFiltros,{limpar:limpar}, e(Busca,{v:busca, set:st[1], ph:"Buscar funcionária"}),
      visiveis.length>1 && visiveis.map(function(s){ return e(Chip,{key:s, on:filtroSetor===s, onClick:function(){ sf[1](filtroSetor===s ? "" : s); }}, s); })),
    e(Mosaico,{min:"23rem"},
      e(BlocoBarra,{cor:"laranja", t:"Pendentes do mês", compacto:true, dir:pend.length || undefined},
        pend.length ? e("div",{className:"flex flex-col gap-2 p-2.5"}, Object.keys(pendPorSetor).sort().map(function(s){
          return e("div",{key:s, className:"flex flex-col items-center gap-1"}, e("span",{className:"text-[11px] font-bold uppercase tracking-wide text-white/70"}, s),
            e("div",{className:"flex flex-wrap justify-center gap-1"}, pendPorSetor[s].map(function(x){ return e("button",{key:x.id, type:"button", title:"Avaliar "+x.nome, onClick:function(){ abre("nota", x); }, className:"inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[12px] font-bold hover:bg-[#F97316]/40"}, e(Ph,{n:"plus-circle", s:12}), nomeCurto(x.nome)); }))); }))
          : e(Vazio,{ic:"check-circle"}, elegiveis ? "Todas as funcionárias foram avaliadas neste mês." : "Nenhuma funcionária encontrada.")),
      e(BlocoBarra,{cor:"laranja", t:"Média por funcionária", compacto:true}, pessoas.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:["Funcionária", "Setor", "Avaliações", "Média", "Último mês"]}, pessoas.map(function(x){
        return e("tr",{key:x.funcId, onClick:function(){ abre("hist", {id:x.funcId, nome:x.funcNome, setor:x.setor}); }, className:LINHA+" cursor-pointer hover:bg-white/5", title:"Abrir o histórico"},
          e(Td,{forte:true}, nomeCurto(x.funcNome)), e(Td,null, x.setor), e(Td,{dinheiro:true}, x.n), e(Td,{dinheiro:true, forte:true, cor:corFunc(x.media, cfg)}, formatarNota(x.media)), e(Td,null, formatarMes(x.ultima.mes))); }))) : e(Vazio,{ic:"users"}, "Nenhuma avaliação lançada até o momento.")),
      e(BlocoBarra,{cor:"laranja", t:"Média por setor", compacto:true}, porSetor.length ? e("div",{className:"p-1.5"}, e(Tab,{cols:["Setor", "Funcionárias", "Média", "Boas", "Ruins"]}, porSetor.map(function(x){
        return e("tr",{key:x.setor, className:LINHA}, e(Td,{forte:true}, x.setor), e(Td,{dinheiro:true}, x.funcionarias), e(Td,{dinheiro:true, forte:true, cor:corFunc(x.media, cfg)}, formatarNota(x.media)), e(Td,{dinheiro:true, cor:"ok"}, x.bons), e(Td,{dinheiro:true, cor:x.ruins ? "ruim" : undefined}, x.ruins)); }))) : e(Vazio,{ic:"buildings"}, "Nenhum setor avaliado até o momento."))),
    jan && jan.t==="nota" && e(NotaJanela,{key:jan.func.id+(jan.mes||""), func:jan.func, mes:jan.mes, fechar:fecha}),
    jan && jan.t==="hist" && e(HistoricoJanela,{func:jan.func, fechar:fecha, refazer:function(m){ abre("nota", jan.func, m); }}));
}

export { AbaAvFunc, NotaJanela, HistoricoJanela };

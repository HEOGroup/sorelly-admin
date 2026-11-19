// Sorelly Admin · montagem — pages/producao/ProdConfig.js
// Produção › FUNCIONÁRIAS e CÓDIGOS E CATEGORIAS (só diretoria): duas abas no topo do setor (Marcus, 16/11/2026), cada uma com seu endereço; p.visao diz qual ("func" ou "cod").
// Os dois são editáveis (adicionar fica na faixa azul; editar e excluir na última coluna; a edição abre numa janela). As FAIXAS DO BÔNUS ficam na tela Premiação (blocos, só consulta) e fixas no código (domain/producao.js › FAIXAS_BONUS).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { Janela } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { comparativoCasa, estatisticasDoMes, formatarInteiro, formatarReais, hojeSP, nomeMes, semProducaoRecente } from "@/apps/montagem/domain/producao";
import { mapaPadronizar } from "@/apps/montagem/domain/producao-nomes";
import { Campo, Painel } from "@/apps/montagem/pages/compras/visualCompras";
import { Aviso, BtFaixa, CAMPO_FAIXA, FaixaAzul, casca, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var IN = INPUT+" w-full text-center";
var LINK = "h-8 text-[13px] font-semibold underline hover:text-primary";
var TITULO = {func:"Funcionárias", cod:"Códigos e categorias"};

function AbaProdConfig(p){
  p = p || {};
  var x = usePr(), pr = x.pr, visao = p.visao || "func";
  var sMes = useState(hojeSP().slice(0, 7)), sFn = useState(""), sCod = useState({codigo:"", rotulo:""}), sJ = useState(null), sConf = useState("");
  if(!x.admin && !x.leitura) return casca(p.semRaiz, e(BlocoPainel,{titulo:TITULO[visao], compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var j = sJ[0], setJ = function(c){ sJ[1](Object.assign({}, j, c)); }, fechar = function(){ sJ[1](null); };
  var pede = function(chave, fazer){ if(sConf[0]!==chave){ sConf[1](chave); return; } sConf[1](""); fazer(); };
  var funcs = pr.funcionarias.slice().sort(function(a, b){ return a.posicao-b.posicao; });
  var cods = pr.codigos.slice().sort(function(a, b){ return a.codigo<b.codigo ? -1 : 1; });

  var addFunc = function(){ if(x.exec("func_add", {nome:sFn[0]})) sFn[1](""); };
  var addCod = function(){ if(x.exec("cod_add", {codigo:sCod[0].codigo, rotulo:sCod[0].rotulo})) sCod[1]({codigo:"", rotulo:""}); };
  var salvarFunc = function(propagar){ if(x.exec("func_edit", {id:j.id, nome:j.nome, propagar:propagar})) fechar(); };
  var salvarCod = function(){ if(x.exec("cod_edit", {id:j.id, codigo:j.codigo, rotulo:j.rotulo})) fechar(); };
  // botão Excluir: o primeiro clique pede confirmação (vira "Confirmar"), o segundo exclui
  var botExcluir = function(ch, fazer, dica){ return e("button",{type:"button", onClick:function(){ pede(ch, fazer); }, title:dica, className:LINK+(sConf[0]===ch ? " text-destructive" : "")}, sConf[0]===ch ? "Confirmar exclusão" : "Excluir"); };
  var acoes = function(editar, ch, excluir, dicaExcluir){ return function(v, r){ return x.leitura ? "—" : e("span",{className:"inline-flex gap-3"}, e("button",{type:"button", onClick:function(){ editar(r); }, className:LINK}, "Editar"), botExcluir(ch(r), function(){ excluir(r); }, dicaExcluir)); }; };

  var cols, linhas, vazio, totalFuncs, comparativo;
  if(visao==="func"){
    var ymF = sMes[0].split("-").map(Number), est = estatisticasDoMes(pr, ymF[0], ymF[1]), estDe = {}; est.forEach(function(q){ estDe[q.nome] = q; });
    linhas = funcs.map(function(f){ var q = estDe[f.nome] || {dias:0, pecas:0, media:0, melhor:0}; return {id:"f"+f.id, f:f, nome:f.nome, sit:f.ativa ? "Ativa" : "Inativa", dias:q.dias, pecas:q.pecas, media:q.media, melhor:q.melhor}; });
    var inteiroOuTraco = function(v){ return v>0 ? formatarInteiro(v) : "—"; };
    cols = [{k:"nome", t:"Funcionária"}, {k:"sit", t:"Situação", cor:function(r){ return r.f.ativa ? "text-success" : "text-warning"; }, render:function(v, r){ return x.leitura ? v : e("button",{type:"button", onClick:function(){ x.exec("func_edit", {id:r.f.id, ativa:!r.f.ativa}); }, title:r.f.ativa ? "Marcar como inativa" : "Marcar como ativa", className:LINK}, v); }},
      {k:"dias", t:"Dias", fmt:inteiroOuTraco}, {k:"pecas", t:"Peças", fmt:inteiroOuTraco}, {k:"media", t:"Média por dia", fmt:inteiroOuTraco}, {k:"melhor", t:"Melhor dia", fmt:inteiroOuTraco},
      {k:"ac", t:"Ações", render:acoes(function(r){ sJ[1]({tipo:"func", id:r.f.id, orig:r.f.nome, nome:r.f.nome, perg:false}); }, function(r){ return "f"+r.f.id; }, function(r){ x.exec("func_del", {id:r.f.id}); }, "Os lançamentos antigos ficam")}];
    vazio = "Nenhuma funcionária cadastrada.";
    totalFuncs = function(ls){ var d = ls.reduce(function(a, r){ return a+r.dias; }, 0), pc = ls.reduce(function(a, r){ return a+r.pecas; }, 0);
      return cols.map(function(c, i){ return i===0 ? "TOTAL · "+ls.length : c.k==="dias" ? inteiroOuTraco(d) : c.k==="pecas" ? inteiroOuTraco(pc) : c.k==="media" ? (d ? formatarInteiro(Math.round(pc/d)) : "—") : c.k==="melhor" ? inteiroOuTraco(ls.reduce(function(a, r){ return Math.max(a, r.melhor); }, 0)) : ""; }); };
    // comparativo: produção em casa contra a média das funcionárias e a melhor delas
    var cmp = comparativoCasa(est), semDado = !cmp[0].dias;
    comparativo = e(BlocoPainel,{titulo:"Comparativo · Externa × funcionárias", dir:nomeMes(ymF[0], ymF[1]), compacto:true},
      e(FaixaAzul,null, e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:sMes[0], "aria-label":"Mês do comparativo", onChange:function(ev){ if(ev.target.value) sMes[1](ev.target.value); }, className:CAMPO_FAIXA}))),
      e(TabelaPlanilha,{key:"cmp"+sMes[0], chave:"id", grade:true, semContagem:true, semLimpar:true, semFiltro:true, vazio:"Sem produção neste mês.",
        cols:[{k:"quem", t:"Quem"}, {k:"dias", t:"Dias", fmt:formatarInteiro}, {k:"pecas", t:"Peças", fmt:formatarInteiro}, {k:"media", t:"Média por dia", fmt:formatarInteiro}, {k:"melhor", t:"Melhor dia", fmt:formatarInteiro}, {k:"custoDia", t:"Custo por dia", fmt:formatarReais}, {k:"custoPeca", t:"Custo por peça", fmt:formatarReais, cor:function(r){ return r.id==="0" ? "text-success" : ""; }}],
        linhas:cmp.filter(function(l){ return l.dias>0 || l.quem==="Externa"; }).map(function(l, i){ return Object.assign({id:String(i)}, l, {dias:l.dias, pecas:l.pecas}); }),
        totalRodape:semDado || cmp.diferenca===null ? undefined : function(){ return ["Externa contra a média das funcionárias", "", "", (cmp.diferenca>0 ? "+" : "")+cmp.diferenca+"%", "", "", ""]; }}));
  } else {
    linhas = cods.map(function(c){ return {id:"c"+c.id, c:c, codigo:c.codigo, rotulo:c.rotulo}; });
    cols = [{k:"codigo", t:"Prefixo"}, {k:"rotulo", t:"Categoria"}];
    vazio = "Nenhum código cadastrado.";
  }

  var janela = null;
  if(j && j.tipo==="func"){
    var mudou = j.nome.trim()!==j.orig;
    janela = e(Janela,{t:"Funcionária", sub:j.orig, fechar:fechar, colunas:[
      e(Painel,{key:"n", t:"Nome", ic:"pencil-simple"}, e(Campo,{rot:"Nome"}, e("input",{value:j.nome, autoFocus:true, onChange:function(ev){ setJ({nome:ev.target.value, perg:false}); }, className:IN}))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"},
        e("div",{className:"flex flex-col gap-2"},
          j.perg ? [e("p",{key:"p", className:"text-[13px] font-semibold"}, "Propagar o novo nome para os lançamentos antigos?"),
            e(Botao,{key:"s", principal:true, onClick:function(){ salvarFunc(true); }}, "Sim, propagar"), e(Botao,{key:"n", onClick:function(){ salvarFunc(false); }}, "Não, manter o histórico")]
          : e(Botao,{principal:true, onClick:function(){ if(mudou) setJ({perg:true}); else fechar(); }}, "Salvar"),
          e(Botao,{onClick:fechar}, "Cancelar")))]});
  } else if(j && j.tipo==="cod"){
    janela = e(Janela,{t:"Código", sub:j.orig, fechar:fechar, colunas:[
      e(Painel,{key:"n", t:"Código e categoria", ic:"pencil-simple"}, e(Campo,{rot:"Prefixo do código"}, e("input",{value:j.codigo, onChange:function(ev){ setJ({codigo:ev.target.value.toUpperCase()}); }, className:IN+" tabular-nums"})), e(Campo,{rot:"Categoria"}, e("input",{value:j.rotulo, onChange:function(ev){ setJ({rotulo:ev.target.value}); }, className:IN}))),
      e(Painel,{key:"a", t:"Ações", ic:"gear"}, e("div",{className:"flex flex-col gap-2"}, e(Botao,{principal:true, onClick:salvarCod}, "Salvar"), e(Botao,{onClick:function(){ if(window.confirm("Excluir o código "+j.orig+"? Os lançamentos antigos continuam e aparecem como código desconhecido.")){ x.exec("cod_del", {id:j.id}); fechar(); } }}, "Excluir"), e(Botao,{onClick:fechar}, "Cancelar")))]});
  }

  // controles de cada aba, na faixa azul (Faixas do bônus não tem: é só consulta)
  var controles = x.leitura ? [e("span",{key:"l", className:"text-[13px] font-semibold text-white"}, "Somente consulta")]
    : visao==="func" ? [
      e("label",{key:"m", className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:sMes[0], "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sMes[1](ev.target.value); }, className:CAMPO_FAIXA})),
      e("input",{key:"i", value:sFn[0], placeholder:"Nome da funcionária", "aria-label":"Nome da funcionária", onChange:function(ev){ sFn[1](ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") addFunc(); }, className:CAMPO_FAIXA+" w-56"}),
      e(BtFaixa,{key:"b", onClick:addFunc}, "Adicionar"),
      // PADRONIZAR NOMES pelo RH (Marcus, 16/11/2026): troca AMANDA, crisbele, Helen... pelo nome do RH (Nome Sobrenome) em todos os lançamentos e no cadastro; só aparece quando há algum nome para trocar
      Object.keys(mapaPadronizar(x.s, pr)).length>0 && e(BtFaixa,{key:"n", titulo:"Troca os nomes soltos (maiúscula, minúscula, só o primeiro nome) pelo nome do RH, em todos os lançamentos e no cadastro. Os números não mudam.", onClick:function(){ var mp = mapaPadronizar(x.s, pr), ks = Object.keys(mp); if(window.confirm("Padronizar "+ks.length+" nomes pelo RH?\n\n"+ks.slice(0, 25).map(function(k){ return k+" → "+mp[k]; }).join("\n")+(ks.length>25 ? "\n(e mais "+(ks.length-25)+")" : "")+"\n\nOs números lançados não mudam, só o nome.")) x.exec("nomes_padronizar", {mapa:mp}); }}, "Padronizar nomes ("+Object.keys(mapaPadronizar(x.s, pr)).length+")"),
      // limpeza do cadastro (Marcus, 16/11/2026): só aparece quando há funcionária sem produção nos últimos 30 dias; some sozinho depois de usado
      semProducaoRecente(pr, 30).length>0 && e(BtFaixa,{key:"l", titulo:"Tira do cadastro quem não produziu nos últimos 30 dias. Os lançamentos não mudam e dá para cadastrar de novo.", onClick:function(){ var n = semProducaoRecente(pr, 30).length; if(window.confirm("Remover "+n+" funcionárias que não produziram nos últimos 30 dias da lista? Os lançamentos continuam como estão e dá para cadastrar de novo.")) x.exec("func_limpar"); }}, "Remover quem não produziu em 30 dias ("+semProducaoRecente(pr, 30).length+")")]
    : [
      e("input",{key:"p", value:sCod[0].codigo, placeholder:"Prefixo", "aria-label":"Prefixo do código", onChange:function(ev){ sCod[1](Object.assign({}, sCod[0], {codigo:ev.target.value.toUpperCase()})); }, className:CAMPO_FAIXA+" w-24"}),
      e("input",{key:"c", value:sCod[0].rotulo, placeholder:"Categoria", "aria-label":"Categoria", onChange:function(ev){ sCod[1](Object.assign({}, sCod[0], {rotulo:ev.target.value})); }, onKeyDown:function(ev){ if(ev.key==="Enter") addCod(); }, className:CAMPO_FAIXA+" w-44"}),
      e(BtFaixa,{key:"a", onClick:addCod}, "Adicionar"),
      e(BtFaixa,{key:"d", onClick:function(){ x.exec("cod_padrao"); }}, "Carregar códigos padrão")];

  // CADASTRO reorganizado (Marcus, 16/11/2026): linha de cima = Funcionárias | Comparativo lado a lado (lado); embaixo, Códigos e categorias em 3 colunas (colunas) para não virar uma lista comprida
  var nCol = p.colunas || 2, gradeCod = nCol===3 ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid grid-cols-1 md:grid-cols-2";
  var lista = e(BlocoPainel,{titulo:TITULO[visao], dir:linhas.length+(linhas.length===1 ? " registro" : " registros"), compacto:true},
    e(FaixaAzul,null, controles),
    visao==="cod" ? e("div",{className:gradeCod},
      Array.apply(null, {length:nCol}).map(function(_, i){ var tam = Math.ceil(linhas.length/nCol), parte = linhas.slice(i*tam, (i+1)*tam); return e("div",{key:i, className:"min-w-0"+(i ? " md:border-l-2 md:border-[var(--bloco-titulo)]" : "")}, e(TabelaPlanilha,{key:"cod"+i, cols:cols, linhas:parte, chave:"id", grade:true, semContagem:true, semLimpar:true, vazio:vazio, aoClicar:x.leitura ? undefined : function(r){ sJ[1]({tipo:"cod", id:r.c.id, orig:r.c.codigo, codigo:r.c.codigo, rotulo:r.c.rotulo}); }})); }))
    : e(TabelaPlanilha,{key:visao+sMes[0], cols:cols, linhas:linhas, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalFuncs, vazio:vazio}));
  return casca(p.semRaiz,
    p.parte==="comparativo" ? comparativo : lista,
    janela);
}
export { AbaProdConfig };

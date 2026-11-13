// Sorelly Admin · montagem — pages/Acessos.js
// RH → Acessos por setor: marca quais telas cada setor abre e, dentro de algumas telas (Consolidado, Comissões), quais partes cada um vê.
// Vale na hora (state.acessos e state.acessosBlocos sobre o padrão de navigation/perfis.js e domain/equipe.js). Só os sócios e o Nickolas mexem.
// Visual de 12/11/2026 (Marcus: "igual às abas do Financeiro, meio planilha, tudo azul"): blocos azuis (BlocoPainel) com TabelaPlanilha; filtro e ordem no título de cada coluna.
import { BlocoPainel, PADRAO_BLOCOS } from "@/apps/montagem/components/bloco-painel";
import { ContasLogin } from "@/apps/montagem/components/contas-login";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { ACESSO_TOTAL, AGENDAMENTO, AMANDA_M, ATENDENTE_PECAS, BIPADORAS, BLOCOS, CADASTRO_PECAS, DIRECAO_FAMILIA, DIRETORIA, FAMILIA, FINANCEIRO, KITNOVO, LISTAGENS_RESP, MONTADORAS, SUPERVISORA } from "@/apps/montagem/domain/equipe";
import { ABAS } from "@/apps/montagem/navigation/abas";
import { GRUPOS_EDITAVEIS, PAPEL_LB, abasDoPapel } from "@/apps/montagem/navigation/perfis";
import { SETORES, ondeEsta } from "@/apps/montagem/navigation/setores";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var EDITORES = [16,17,28,29,32,44];   // Marcus, Nickolas, Lucas, Anamaria, Amanda de Miranda (01/11/2026)
var nomes = function(l){ return l.map(function(x){ return x.nome; }); };
var QUEM = {
  supervisao: ["Marcus","Anamaria","Lucas"],
  familia: nomes(DIRECAO_FAMILIA).concat(nomes(FAMILIA)), supervisora: [SUPERVISORA.nome], agendamento: nomes(AGENDAMENTO), financeiro: nomes(FINANCEIRO),
  inadimplencia: [AMANDA_M.nome], bipadora: nomes(BIPADORAS).concat([ATENDENTE_PECAS.nome]), montadora: nomes(MONTADORAS), listagens: [LISTAGENS_RESP.nome], kitnovo: [KITNOVO.nome], cadastropecas: nomes(CADASTRO_PECAS),
  representante: ["24 representantes (ainda sem login)"], linkcadastro: ["Helen"], garantia: ["Setor Garantia"], encomendas: ["Agatha", "Elen", "Eduarda Gabriela"], basico: ["Demais funcionários"]};   // faltavam: a tela quebrava ao abrir (04/11/2026)

function AbaAcessos(){
  var cx = use(), s = cx.state, d = cx.dispatch, edita = EDITORES.indexOf(s.usuario)>=0;
  // cada bloco minimiza clicando na barra azul; Quem está em cada setor e Contas de acesso começam fechados (Marcus, 12/11/2026: "dá uma minimizada")
  var fe = useState({pessoas:true, contas:true}), fechados = fe[0], setFechados = fe[1];
  var alterna = function(k){ return function(){ setFechados(Object.assign({}, fechados, {[k]:!fechados[k]})); }; };
  var colunas = ["supervisao"].concat(GRUPOS_EDITAVEIS);
  // linhas agrupadas pelo setor do menu
  var setorDe = function(k){ var o = ondeEsta(k); return o ? o.setor.nome : "Apps de celular e outros"; };
  var ordem = SETORES.map(function(st){ return st.nome; }).concat(["Apps de celular e outros"]);
  var grupos = ordem.map(function(nm){ return {nome:nm, abas:ABAS.filter(function(a){ return setorDe(a[0])===nm; })}; }).filter(function(g){ return g.abas.length; });
  var marcar = function(papel, k, ligar){
    var atual = (abasDoPapel(papel, s.acessos) || []).slice();
    d({type:"ACESSO_SET", papel:papel, abas:ligar ? atual.concat([k]) : atual.filter(function(x){ return x!==k; })}); };
  var lista = function(chave){ return (s.acessosBlocos && s.acessosBlocos[chave]) || BLOCOS[chave].padrao; };
  var marcarBloco = function(chave, g, ligar){ var l = lista(chave).slice(); d({type:"ACESSO_BLOCO", chave:chave, grupos:ligar ? l.concat([g]) : l.filter(function(x){ return x!==g; })}); };
  var blocoMudou = function(g){ return Object.keys(BLOCOS).some(function(c){ return lista(c).indexOf(g)>=0 !== (BLOCOS[c].padrao.indexOf(g)>=0); }); };
  var restaurar = function(g){ d({type:"ACESSO_SET", papel:g, abas:null});
    Object.keys(BLOCOS).forEach(function(c){ if(lista(c).indexOf(g)>=0 === (BLOCOS[c].padrao.indexOf(g)>=0)) return; marcarBloco(c, g, BLOCOS[c].padrao.indexOf(g)>=0); }); };
  var mudou = function(g){ return g!=="supervisao" && !!((s.acessos && s.acessos[g]) || blocoMudou(g)); };
  var caixa = function(on, bloqueado, rotulo, aoMudar){ return e("input",{type:"checkbox", checked:on, disabled:bloqueado || !edita, "aria-label":rotulo,
    className:"size-4 cursor-pointer accent-[var(--bloco-titulo)] disabled:cursor-not-allowed", onChange:function(ev){ aoMudar(ev.target.checked); }}); };

  // uma linha por tela e, logo abaixo dela, uma linha por parte interna (Consolidado, Comissões...); o valor "Sim"/"Não" é o que o filtro da coluna enxerga
  var linhas = [];
  grupos.forEach(function(gr){ gr.abas.forEach(function(a){ var k = a[0], lin = {id:"t_"+k, setor:gr.nome, tela:a[1], tipo:"tela", k:k};
    colunas.forEach(function(g){ lin[g] = (g==="supervisao" || (abasDoPapel(g, s.acessos)||[]).indexOf(k)>=0) ? "Sim" : "Não"; });
    linhas.push(lin);
    Object.keys(BLOCOS).filter(function(c){ return BLOCOS[c].tela===k; }).forEach(function(c){ var lb = {id:"b_"+k+"_"+c, setor:gr.nome, tela:"↳ dentro: "+BLOCOS[c].nome, tipo:"bloco", c:c};
      colunas.forEach(function(g){ lb[g] = (g==="supervisao" || lista(c).indexOf(g)>=0) ? "Sim" : "Não"; });
      linhas.push(lb); }); }); });
  var cols = [{k:"setor", t:"Setor", fixa:true, w:"11rem"}, {k:"tela", t:"Tela", fixa:"11rem", w:"18rem"}].concat(colunas.map(function(g){
    return {k:g, t:PAPEL_LB[g], w:Math.max(8, PAPEL_LB[g].length*0.62+4).toFixed(1)+"rem", render:function(v, r){ return caixa(v==="Sim", g==="supervisao", r.tela+" para "+PAPEL_LB[g], function(x){ if(r.tipo==="tela") marcar(g, r.k, x); else marcarBloco(r.c, g, x); }); }}; }));

  // quem está em cada setor (e o botão de voltar ao padrão do setor que foi alterado)
  var pessoas = colunas.map(function(g){ return {id:"p_"+g, setor:PAPEL_LB[g], quem:(QUEM[g] || []).join(", "), padrao:(edita && mudou(g)) ? g : "", g:g}; });
  var colsPessoas = [{k:"setor", t:"Setor"}, {k:"quem", t:"Quem"},
    {k:"padrao", t:"Padrão", render:function(v){ return v ? e(Botao,{onClick:function(){ restaurar(v); }, title:"Volta as telas deste setor para o padrão do sistema"}, "Voltar ao padrão") : "—"; }}];

  return e("div",{className:PADRAO_BLOCOS+" flex flex-col gap-1.5"},
    !edita && e("p",{className:"text-center text-[13px] font-semibold text-warning"}, "Só os sócios e o Nickolas alteram os acessos. Você está só vendo."),
    e(BlocoPainel,{titulo:"Quem abre o quê", compacto:true, fechado:fechados.matriz, aoTitulo:alterna("matriz")},
      e(TabelaPlanilha,{semContagem:true, grade:true, compacta:true, chave:"id", linhas:linhas, cols:cols, alturaMax:"calc(100vh - 12rem)", vazio:"Nenhuma tela"})),
    e(BlocoPainel,{titulo:"Quem está em cada setor", compacto:true, fechado:fechados.pessoas, aoTitulo:alterna("pessoas")},
      e(TabelaPlanilha,{semContagem:true, grade:true, chave:"id", linhas:pessoas, cols:colsPessoas, vazio:"Nenhum setor"})),
    e(ContasLogin,{fechado:fechados.contas, aoTitulo:alterna("contas")}));
}

export { AbaAcessos };

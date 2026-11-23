// Sorelly Admin · montagem — pages/producao/ProdControleCasa.js
// Produção › CONTROLE DA CASA (refeita em 16/11/2026, Marcus: "as peças enviadas as funcionárias colocam, e os erros depois eu que coloco").
// QUEM FAZ O QUÊ: as FUNCIONÁRIAS lançam direto na planilha as ENVIADAS (o que o Igor levou) e a SOBRA (só marcar); a linha de HOJE já vem pronta.
// O MARCUS (diretoria) lança os ERROS: quantas peças e QUEM errou (janela "Erros"). DEVOLVIDAS vêm da grade (filial Casa). DIFERENÇA = enviadas - devolvidas - sobra (zero = Bateu).
// Regras em domain/producao.js (controleDaCasa, casa_salvar: cada campo é gravado sozinho, quem lança enviadas não apaga os erros).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { Botao } from "@/apps/montagem/components/padrao-fin";
import { Janela } from "@/apps/montagem/components/padrao";
import { TabelaPlanilha } from "@/apps/montagem/components/tabela-planilha";
import { controleDaCasa, diaDaSemana, formatarDia, formatarInteiro, hojeSP, nomeMes } from "@/apps/montagem/domain/producao";
import { nomesProducaoRh, padronizarNome } from "@/apps/montagem/domain/producao-nomes";
import { Campo, Painel } from "@/apps/montagem/pages/compras/visualCompras";
import { CAMPO_FAIXA, FaixaAzul, GRADE_LIMPA, casca, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { INPUT } from "@/apps/montagem/ui/input";
import { e, useState } from "@/shared/react";

var IN = INPUT+" w-full text-center";
var CEL = "h-8 w-24 rounded-md border border-white/30 bg-transparent px-2 text-center text-[13px] tabular-nums hover:border-white/60 focus:border-white";
var n0 = function(v){ return formatarInteiro(v); };
var tracoZero = function(v){ return v ? n0(v) : "—"; };

function AbaProdControleCasa(props){
  var x = usePr(), sMes = useState(hojeSP().slice(0, 7)), sJ = useState(null), hoje = hojeSP();
  var ym = sMes[0].split("-").map(Number), linhas = controleDaCasa(x.pr, ym[0], ym[1]), j = sJ[0], editaNum = !x.leitura;
  // a linha de HOJE sempre existe (a funcionária só digita)
  if(sMes[0]===hoje.slice(0, 7) && !linhas.some(function(l){ return l.dia===hoje; })){ linhas = linhas.concat([{dia:hoje, enviadas:0, devolvidas:0, sobra:0, dif:0, erros:0, quem:"", obs:"", temEnvio:false, por:""}]); }
  var grava = function(dia, campo, valor){ var o = {dia:dia}; o[campo] = valor; x.exec("casa_salvar", o); };
  var abrirErros = function(l){ sJ[1]({dia:l.dia, erros:l.erros ? String(l.erros) : "", quem:l.quem||"", obs:l.obs||""}); };
  var setJ = function(c){ sJ[1](Object.assign({}, j, c)); };
  var salvarErros = function(){ if(x.exec("casa_salvar", {dia:j.dia, erros:j.erros, quem:j.quem, obs:j.obs})) sJ[1](null); };

  // campo de número direto na célula: grava ao sair do campo ou ao dar Enter
  var celNum = function(campo, rot){ return function(v, r){ var atual = r[campo]===0 && campo==="enviadas" && !r.temEnvio ? "" : (r[campo] ? String(r[campo]) : "");
    return e("input",{key:r.dia+campo+atual, type:"number", min:0, defaultValue:atual, placeholder:"—", "aria-label":rot+" de "+formatarDia(r.dia), onBlur:function(ev){ if(ev.target.value!==atual) grava(r.dia, campo, ev.target.value); }, onKeyDown:function(ev){ if(ev.key==="Enter") ev.target.blur(); }, className:CEL}); }; };
  var cols = [{k:"dia", t:"Dia", fmt:function(v){ return formatarDia(v)+" · "+diaDaSemana(v); }},
    {k:"enviadas", t:"Enviadas", fmt:function(v, r){ return r && !r.temEnvio ? "—" : n0(v); }, render:editaNum ? celNum("enviadas", "Enviadas") : undefined},
    {k:"devolvidas", t:"Devolvidas", fmt:tracoZero},
    {k:"sobra", t:"Sobra", fmt:tracoZero, render:editaNum ? celNum("sobra", "Sobra") : undefined},
    {k:"dif", t:"Diferença", fmt:function(v, r){ return r && !r.temEnvio ? "—" : v===0 ? "Bateu" : (v>0 ? "Faltam " : "A mais ")+n0(Math.abs(v)); }, cor:function(r){ return !r.temEnvio ? "" : r.dif>0 ? "text-danger" : r.dif<0 ? "text-warning" : "text-success"; }},
    {k:"erros", t:"Erros", fmt:tracoZero, cor:function(r){ return r.erros>0 ? "text-danger" : ""; }}, {k:"quem", t:"Quem errou", fmt:function(v){ return v || "—"; }}, {k:"obs", t:"Observação", fmt:function(v){ return v || "—"; }},
    {k:"por", t:"Lançou", fmt:function(v){ return v || "—"; }}];
  if(x.admin) cols.push({k:"ac", t:"Erros", render:function(v, r){ return e("button",{type:"button", onClick:function(){ abrirErros(r); }, className:"h-8 text-[13px] font-semibold underline hover:text-primary"}, r.erros ? "Editar erros" : "Marcar erros"); }});
  var rows = linhas.map(function(l){ return Object.assign({id:l.dia, por:l.por||""}, l); }).sort(function(a, b){ return a.dia<b.dia ? 1 : -1; });
  var totalRodape = function(ls){
    var s = function(k){ return ls.reduce(function(t, r){ return t+(r[k]||0); }, 0); }, dif = ls.filter(function(r){ return r.temEnvio; }).reduce(function(t, r){ return t+r.dif; }, 0);
    return cols.map(function(c, i){ return i===0 ? "TOTAL · "+ls.length+(ls.length===1 ? " dia" : " dias") : c.k==="enviadas" ? n0(s("enviadas")) : c.k==="devolvidas" ? n0(s("devolvidas")) : c.k==="sobra" ? tracoZero(s("sobra")) : c.k==="dif" ? (dif===0 ? "Bateu" : (dif>0 ? "Faltam " : "A mais ")+n0(Math.abs(dif))) : c.k==="erros" ? tracoZero(s("erros")) : ""; }); };

  var nomes = nomesProducaoRh(x.s).concat((x.pr.funcionarias||[]).map(function(f){ return f.nome; })), vistos = {}; nomes = nomes.filter(function(n){ if(vistos[n]) return false; vistos[n] = 1; return true; });
  var janela = j && x.admin && e(Janela,{t:"Erros do dia", sub:formatarDia(j.dia)+" · "+diaDaSemana(j.dia), fechar:function(){ sJ[1](null); }, colunas:[
    e(Painel,{key:"e", t:"Erros", ic:"warning"},
      e(Campo,{rot:"Peças com erro"}, e("input",{type:"number", min:0, value:j.erros, "aria-label":"Peças com erro", autoFocus:true, onChange:function(ev){ setJ({erros:ev.target.value}); }, className:IN+" tabular-nums"})),
      e(Campo,{rot:"Quem errou"}, e("input",{list:"casa-nomes", value:j.quem, "aria-label":"Quem errou", placeholder:"Nome da funcionária", onChange:function(ev){ setJ({quem:ev.target.value}); }, onBlur:function(ev){ if(ev.target.value.trim()) setJ({quem:padronizarNome(x.s, ev.target.value)}); }, className:IN}), e("datalist",{id:"casa-nomes"}, nomes.map(function(n){ return e("option",{key:n, value:n}); }))),
      e(Campo,{rot:"Observação"}, e("input",{value:j.obs, "aria-label":"Observação", onChange:function(ev){ setJ({obs:ev.target.value}); }, className:IN}))),
    e(Painel,{key:"a", t:"Ações", ic:"gear"}, e("div",{className:"flex flex-col gap-2"}, e(Botao,{principal:true, onClick:salvarErros}, "Salvar"), e(Botao,{onClick:function(){ sJ[1](null); }}, "Cancelar")))]});

  return casca(props && props.semRaiz,
    e("div",{className:GRADE_LIMPA},
      e(BlocoPainel,{titulo:"Produção externa · "+nomeMes(ym[0], ym[1]), compacto:true},
        e(FaixaAzul,null,
          e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Mês", e("input",{type:"month", value:sMes[0], "aria-label":"Mês", onChange:function(ev){ if(ev.target.value) sMes[1](ev.target.value); }, className:CAMPO_FAIXA}))),
        e(TabelaPlanilha,{key:"cc"+sMes[0], fina:true, cols:cols, linhas:rows, chave:"id", grade:true, semContagem:true, semLimpar:true, totalRodape:totalRodape, vazio:"Nenhum dia de produção externa neste mês."}))),
    janela);
}
export { AbaProdControleCasa };

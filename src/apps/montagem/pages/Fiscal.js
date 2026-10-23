// Sorelly Admin · montagem — pages/Fiscal.js
// Fiscal: controle fiscal dos CNPJs do grupo no Simples Nacional. UMA tela com abas (Visão geral, Entradas, Saídas, Contas a pagar, Dashboard anual, Configuração) e seletor de ano.
// Corpos em pages/fiscal/; regras e contas em domain/fiscal.js (estado s.fx, ações "FX"). Cor do setor: ciano #06B6D4 (BlocoBarra "turquesa").
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { anoPadrao, anosDisponiveis } from "@/apps/montagem/domain/fiscal";
import { AbaFxAnual, AbaFxContas } from "@/apps/montagem/pages/fiscal/ContasAnual";
import { AbaFxConfig } from "@/apps/montagem/pages/fiscal/Configuracao";
import { AbaFxEntradas, AbaFxSaidas } from "@/apps/montagem/pages/fiscal/EntradasSaidas";
import { AbaFxPainel } from "@/apps/montagem/pages/fiscal/Painel";
import { COR, Chip, useFx } from "@/apps/montagem/pages/fiscal/visual";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["visao","Painel"], ["entradas","Entradas"], ["saidas","Saídas"], ["contas","Contas a pagar"], ["anual","Dashboard anual"], ["config","Configuração"]];

function AbaFiscal(){
  var f = useFx(), st = useState({aba:"visao", ano:null}), v = st[0], ano = v.ano || anoPadrao(f.s);
  var ir = function(aba){ st[1](Object.assign({}, v, {aba:aba})); };
  var props = {ano:ano, ir:ir};
  var corpo = v.aba==="entradas" ? e(AbaFxEntradas,props) : v.aba==="saidas" ? e(AbaFxSaidas,props) : v.aba==="contas" ? e(AbaFxContas,props) : v.aba==="anual" ? e(AbaFxAnual,props) : v.aba==="config" ? e(AbaFxConfig,props) : e(AbaFxPainel,props);
  return e(Pagina,null,
    e(PageHead,{t:"Fiscal", sub:"Controle fiscal dos CNPJs do grupo no Simples Nacional: ILF, sublimite anual e contas a pagar."},
      e("div",{className:"flex flex-wrap items-center justify-center gap-1.5", role:"group", "aria-label":"Ano"}, anosDisponiveis(f.s).map(function(a){ return e(Chip,{key:a, on:a===ano, ic:"calendar-blank", onClick:function(){ st[1](Object.assign({}, v, {ano:a})); }}, String(a)); }))),
    e(Abas,{abas:ABAS, atual:v.aba, onMudar:ir, cor:COR}),
    e("div",{key:v.aba+ano}, corpo));
}
export { AbaFiscal };

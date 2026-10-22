// Sorelly Admin · montagem — pages/Versoes.js
// Tecnologia → Versões: registro do que mudou no sistema (domain/versoes.js). Padrão visual: components/padrao.js.
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { Faixa, Indicador, Pagina, Tab, Td, LINHA } from "@/apps/montagem/components/padrao";
import { VERSOES } from "@/apps/montagem/domain/versoes";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

var COR_TIPO = {novo:"ok", melhoria:"info", "correção":"alerta"};
var dbr = function(d){ return d.split("-").reverse().join("/"); };

function AbaVersoes(){
  var total = VERSOES.reduce(function(t, v){ return t+v.itens.length; }, 0), ult = VERSOES[0];
  return e(Pagina,null,
    e(PageHead,{t:"Versões do sistema", sub:"Registro de tudo o que mudou, com data e tela."}),
    e(Faixa,{n:3}, e(Indicador,{t:"Versão atual", v:ult.v, cor:"total"}), e(Indicador,{t:"Última atualização", v:dbr(ult.data), cor:"info"}), e(Indicador,{t:"Mudanças registradas", v:String(total), cor:"ok"})),
    VERSOES.map(function(v, i){
      return e(BlocoBarra,{key:v.v, cor:"ouro", t:"Versão "+v.v+" · "+v.titulo, sub:dbr(v.data), compacto:true, dir:v.itens.length+(v.itens.length===1 ? " mudança" : " mudanças")},
        e("div",{className:"p-2"}, e(Tab,{cols:["Tipo","Tela","O que mudou"]}, v.itens.map(function(x, j){
          return e("tr",{key:j, className:LINHA}, e(Td,{cor:COR_TIPO[x.tipo], forte:true}, x.tipo.charAt(0).toUpperCase()+x.tipo.slice(1)), e(Td,null, x.area), e(Td,{className:"whitespace-normal!"}, x.txt)); }))));
    }));
}
export { AbaVersoes };

// Sorelly Admin · kits novos Curitiba — components/entregues.js
// Listagem dos kits novos entregues, do mais recente para o mais antigo (padrão do Financeiro: faixa de totais + tabela de linhas de 32 px).
import { FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { atrasado, diasNaEtapa, entregou } from "@/apps/kits-novos/domain/etapas";
import { dataBR, diasEntre, tsDe } from "@/apps/kits-novos/lib/datas";
import { N1 } from "@/apps/kits-novos/lib/format";
import { use } from "@/apps/kits-novos/state/context";
import { Vazio } from "@/apps/kits-novos/ui/card";
import { e, useState } from "@/shared/react";

function Entregues(p){
  var cx = use(), s = cx.state, d = cx.dispatch, vm = useState(100), lim = vm[0];
  var cs = p.dados.filter(entregou).sort(function(a,b){ return (tsDe(b.ret)||0)-(tsDe(a.ret)||0); });
  if(!cs.length) return e(Vazio,{txt:"Nenhum kit entregue neste filtro."});
  var dias = cs.map(function(c){ return diasEntre(c.cad, c.ret); }).filter(function(x){ return x!=null && x>=0; });
  var media = dias.length ? dias.reduce(function(a,b){return a+b;},0)/dias.length : null, noPrazo = dias.length ? dias.filter(function(x){ return x<=s.cfg.metaDias; }).length/dias.length*100 : null;
  return e("div",{className:"flex flex-col gap-3"},
    e(FaixaTotais,{itens:[{t:"Kits entregues", v:String(cs.length), cor:"text-success"}, {t:"Dias do cadastro à entrega", v:media==null ? "—" : N1(media)+" d"}, {t:"Meta "+s.cfg.metaDias+" dias", v:noPrazo==null ? "—" : N1(noPrazo)+"%", cor:"text-success"}]}),
    e(TabelaP,{minW:1130, cols:[{t:"Revendedora", w:220}, {t:"Representante", w:150}, {t:"Bairro", w:140}, {t:"Cidade", w:150}, {t:"Profissão", w:150}, {t:"Cadastro", w:84, n:1}, {t:"Entrega", w:84, n:1}, {t:"Dias", w:60, n:1}, {t:"Condicional", w:170}]},
      cs.slice(0, lim).map(function(c){ var n = diasEntre(c.cad, c.ret);
        return e(Tr,{key:c.id, onClick:function(){ d({type:"DIALOGO", d:{tipo:"detalhe", id:c.id}}); }},
          e(Td,{forte:true}, c.nome), e(Td,{cor:c.rep ? "" : "text-warning"}, c.rep || "sem representante"), e(Td,null, c.bai || "—"), e(Td,null, c.cid || "—"), e(Td,null, c.prof || "—"),
          e(Td,{n:true}, dataBR(c.cad).slice(0, 5)), e(Td,{n:true}, dataBR(c.ret).slice(0, 5)), e(Td,{n:true, cor:n!=null && n<=s.cfg.metaDias ? "text-success" : "text-warning"}, n==null ? "—" : String(n)),
          e(Td,{cor:c.st==="devolvido" ? "text-success" : atrasado(c, s.cfg) ? "text-destructive" : ""}, c.st==="devolvido" ? "Devolvida em "+dataBR(c.dev).slice(0, 5) : "Pendente há "+diasNaEtapa(c)+(diasNaEtapa(c)===1 ? " dia" : " dias")));
      })),
    cs.length>lim && e("button",{type:"button", onClick:function(){ vm[1](lim+200); }, className:"mx-auto h-8 rounded-md border border-border px-4 text-[13px] hover:bg-white/10"}, "Ver mais "+Math.min(200, cs.length-lim)));
}

export { Entregues };

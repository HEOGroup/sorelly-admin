// Sorelly Admin · montagem — pages/producao/ProdExterna.js
// Produção › PRODUÇÃO EXTERNA (Dávila, Leci, Didi): só o CONTROLE DAS PEÇAS — Estoque com ela e Movimentações lado a lado (o botão "+ Estoque enviado" lança o que a Sorelly mandou).
// Marcus, 22/11/2026: "Dinheiro de novembro, Peças de novembro e Com ela agora ficam em Pagamento por produção; aqui fica o estoque e as movimentações"; os Pagamentos por quinta-feira também saíram daqui (moram em Pagamento por produção).
import { BlocoPainel } from "@/apps/montagem/components/bloco-painel";
import { listaExternas } from "@/apps/montagem/domain/producao";
import { AbaProdPecasCasa } from "@/apps/montagem/pages/producao/ProdPecasCasa";
import { Aviso, CAMPO_FAIXA, FaixaAzul, MIUDA, Raiz, usePr } from "@/apps/montagem/pages/producao/visualProd";
import { e, useState } from "@/shared/react";

function AbaProdExterna(){
  var x = usePr(), sP = useState("Davila Aline");
  if(!x.admin && !x.leitura) return e(Raiz,null, e(BlocoPainel,{titulo:"Produção externa", compacto:true}, e(Aviso,null, "Somente a diretoria acessa.")));
  var pessoas = listaExternas(x.pr), func = pessoas.indexOf(sP[0])>=0 ? sP[0] : pessoas[0];   // Dávila, Leci, Didi: cada uma com o seu estoque e as suas peças
  return e(Raiz,{cls:MIUDA},
    e(BlocoPainel,{titulo:"Produção externa", dir:func, compacto:true}, e(FaixaAzul,null,
      e("label",{className:"flex items-center gap-2 text-[13px] font-semibold text-white"}, "Pessoa", e("select",{value:func, "aria-label":"Pessoa", onChange:function(ev){ sP[1](ev.target.value); }, className:CAMPO_FAIXA+" w-48 cursor-pointer"}, pessoas.map(function(n){ return e("option",{key:n, value:n}, n); }))))),
    e(AbaProdPecasCasa,{key:"k"+func, func:func, semRaiz:true}));
}
export { AbaProdExterna };

// Sorelly Admin · montagem — pages/Encomendas.js
// Encomendas e reposições: uma tela só, com abas (Quadro de pedidos, Calculadora de direito, Regras e configuração). ESBOÇO com as regras que temos por enquanto.
// Corpos em pages/encomendas/. Regras e contas em domain/encomendas.js (estado s.er). Contexto em docs/negocio/ENCOMENDAS-REPOSICOES.md. Controle INTERNO (reposição não é oferecida às revendedoras por ora).
import { Pagina } from "@/apps/montagem/components/padrao";
import { AbaErCalculadora } from "@/apps/montagem/pages/encomendas/Calculadora";
import { AbaErQuadro } from "@/apps/montagem/pages/encomendas/Quadro";
import { AbaErRegras } from "@/apps/montagem/pages/encomendas/Regras";
import { Abas } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["quadro", "Quadro de pedidos"], ["calculadora", "Calculadora de direito"], ["regras", "Regras e configuração"]];
var COR = "#14B8A6";   // cor do setor Encomendas e reposições (turquesa)

function AbaEncomendas(){
  var st = useState("quadro"), aba = st[0];
  var corpo = aba==="quadro" ? e(AbaErQuadro,null) : aba==="calculadora" ? e(AbaErCalculadora,null) : e(AbaErRegras,null);
  return e(Pagina,null,
    e(PageHead,{t:"Encomendas e reposições", sub:"Fila organizada de pedidos de reposição, expositor e encomenda, com o direito calculado pelas regras do setor."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR}),
    corpo);
}
export { AbaEncomendas };

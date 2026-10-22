// Sorelly Admin · montagem — pages/Equipes.js
// RH → Equipes: organograma de departamentos, uma tela só com abas (Organograma, Departamentos, Pessoas, Histórico). Corpos em pages/equipes/.
// Estar num departamento NÃO dá acesso a nada (mapa da empresa); o acesso de verdade fica em RH → Acessos por setor. Lógica em domain/equipes.js.
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { AbaDepartamentos } from "@/apps/montagem/pages/equipes/Departamentos";
import { AbaHistorico } from "@/apps/montagem/pages/equipes/Historico";
import { JanelaDepto, JanelaNovo } from "@/apps/montagem/pages/equipes/JanelaDepto";
import { AbaOrganograma } from "@/apps/montagem/pages/equipes/Organograma";
import { AbaPessoas } from "@/apps/montagem/pages/equipes/Pessoas";
import { ROXO } from "@/apps/montagem/pages/equipes/pecas";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["organograma","Organograma"], ["departamentos","Departamentos"], ["pessoas","Pessoas"], ["historico","Histórico"]];

function AbaEquipes(){
  var st = useState("organograma"), aba = st[0], jan = useState(null), j = jan[0];
  var abrir = function(id){ jan[1]({tipo:"depto", id:id}); }, novo = function(){ jan[1]({tipo:"novo"}); }, fechar = function(){ jan[1](null); };
  var corpo = aba==="organograma" ? e(AbaOrganograma,{abrir:abrir, novo:novo})
    : aba==="departamentos" ? e(AbaDepartamentos,{abrir:abrir, novo:novo})
    : aba==="pessoas" ? e(AbaPessoas,null)
    : e(AbaHistorico,null);
  return e(Pagina,null,
    e(PageHead,{t:"Equipes", sub:"Organograma de departamentos, supervisões e pessoas da empresa."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:ROXO}),
    corpo,
    j && j.tipo==="depto" && e(JanelaDepto,{key:j.id, id:j.id, abrir:abrir, fechar:fechar}),
    j && j.tipo==="novo" && e(JanelaNovo,{fechar:fechar}));
}

export { AbaEquipes };

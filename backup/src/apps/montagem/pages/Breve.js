// Sorelly Admin · montagem e bipagem — pages/Breve.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { EmEspera } from "@/apps/montagem/components/em-espera";
import { telaPorNome } from "@/apps/montagem/navigation/setores";
import { use } from "@/apps/montagem/state/context";
import { e } from "@/shared/react";

function AbaBreve(){
  var s = use().state, nome = s.breveNome || "Em breve", t = telaPorNome(nome);
  if(t && t.enviar) return e(EmEspera,{t:nome, cor:"azul", sub:"Este sistema já existe avulso no admin. Quando o Marcus enviar, ele entra aqui integrado aos outros setores.",
    resumo:"telas do admin atual que vão virar esta tela", itens:t.origem,
    falta:["Prints ou HTML das telas atuais (o Marcus vai enviar).","Juntar as telas repetidas e tirar os configuradores separados (fica um configurador geral)."]});
  return e(EmEspera,{t:nome, sub:"Módulo registrado na estrutura da Sorelly. Ainda vai ser desenhado com o setor responsável.",
    resumo:"o que esta tela vai fazer será definido com o setor", itens:["Levantar com o setor como o trabalho é feito hoje.","Definir o que entra na tela e quem usa.","Desenhar a tela no padrão do sistema.","Ligar com os outros setores (listagens, financeiro, estoque)."],
    falta:["Conversa com o setor responsável.","Confirmação da estrutura de setores pelo Marcus."]});
}

export { AbaBreve };

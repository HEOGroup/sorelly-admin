// Sorelly Admin · montagem — domain/entrada-kits-novos.js
// CAMINHO CADASTRO → KITS NOVOS (23/10/2026): quando o cadastro APROVA uma candidata em Aprovação de cadastros, ela entra sozinha em Kits novos como "Cadastrada",
// já com o jeito de receber o kit e o valor (igual ao sistema que está rodando, onde a aprovação cria o registro). Sem servidor ainda, a ponte é uma fila no navegador:
// aqui a aprovada entra na fila; o app Kits novos lê a fila ao abrir (apps/kits-novos/lib/entrada-cadastro.js) e cria o registro, uma vez só (pelo id "L<número>").
import { valorDoKit, kitNaEmpresa } from "@/apps/montagem/domain/cadastro-leads";

var CHAVE_ENTRADA = "sorelly_kn_entrada";

// "Rua X, 12 - Cajuru" → "Cajuru" (texto depois do último " - "; sem isso, vazio)
function bairroDe(endereco){ var p = String(endereco||"").split(" - "); return p.length>1 ? p[p.length-1].trim() : ""; }

function enviarParaKitsNovos(lead){
  try {
    if(typeof localStorage==="undefined" || !lead || lead.reviewStatus!=="APPROVED") return false;
    var fila = []; try { fila = JSON.parse(localStorage.getItem(CHAVE_ENTRADA)||"[]") || []; } catch(x){ fila = []; }
    var id = "L"+lead.id; if(fila.some(function(i){ return i.id===id; })) return true;
    fila.push({id:id, leadId:lead.id, nome:lead.nome, cid:lead.cidade||"", bai:bairroDe(lead.endereco), prof:lead.profissao||"", trab:lead.empresa||"", tel:lead.telefone||"",
      opcao:lead.kitOpcao, naEmpresa:kitNaEmpresa(lead.kitOpcao), expositor:/expositor$/.test(lead.kitOpcao||""), val:valorDoKit(lead.kitOpcao, lead.kitValorCasa, lead.kitValorEmpresa),
      por:lead.reviewedBy||"Cadastro", em:lead.reviewedAt||""});
    localStorage.setItem(CHAVE_ENTRADA, JSON.stringify(fila));
    return true;
  } catch(x){ return false; }
}

export { CHAVE_ENTRADA, bairroDe, enviarParaKitsNovos };

// Sorelly Admin · montagem — lib/chave-da-parte.js
// Chave Pix da conta que o Direcionar devolveu ao Atendimento Sorelly (17/11/2026, pedido do Marcus: "quando direcionar a conta, vai com a chave Pix para a funcionária passar para a revendedora").
// A parte do pagamento guarda só o texto "Destino · conta" (lancFin.linhas[i].partes[j].descricao). A chave é lida NA HORA do cadastro (Financeiro › Chaves Pix e Controle de pagamentos › Destinos): nada é copiado para o pedido.
// Devolve {chave, dados} ou null (conta sem chave cadastrada). dados = o que o botão Copiar usa para montar a mensagem (conta da empresa sai com banco, empresa e CNPJ; pessoa/fornecedor com nome e banco).
import { chavesDoDestino } from "@/apps/montagem/lib/chave-do-destino";
import { dadosPixDaConta } from "@/apps/montagem/lib/mensagem-pix";

export function chaveDaParte(s, descricao){
  var txt = String(descricao||"").trim(); if(!txt || txt==="—") return null;
  var emp = dadosPixDaConta(s, txt);
  if(emp && emp.chave) return {chave:emp.chave, tipo:emp.tipo, dados:null, empresa:true};
  var destNome = txt.split(" · ")[0].trim().toLowerCase();
  var d = ((s.cp && s.cp.destinos) || []).find(function(x){ return String(x.nome||"").trim().toLowerCase()===destNome; });
  if(!d) return null;
  var ch = chavesDoDestino(s, d)[0]; if(!ch || !ch.chave) return null;
  return {chave:ch.chave, tipo:ch.tipo, dados:{nome:d.nome, banco:ch.banco||"", favorecido:ch.fav||"", tipo:ch.tipo}, empresa:false};
}

// Sorelly Admin · montagem — lib/chave-da-parte.js
// Chave Pix da conta que o Direcionar devolveu ao Atendimento Sorelly (17/11/2026, pedido do Marcus: "quando direcionar a conta, vai com a chave Pix para a funcionária passar para a revendedora").
// A parte do pagamento guarda só o texto "Destino · conta" (lancFin.linhas[i].partes[j].descricao). A chave é lida NA HORA do cadastro (Financeiro › Chaves Pix e Controle de pagamentos › Destinos): nada é copiado para o pedido.
// 26/11/2026 (Marcus): UMA peça só para o app da representante e para o Atendimento interno. Devolve também o NUMERÁRIO (o que se escreve na folha), para a mensagem padrão (lib/mensagem-pix.js, mensagemPixPadrao).
// dadosDaConta devolve {chave, tipo, empresa (favorecido), numerario, ehEmpresa}, ou {semChave:true, numerario} (destino sem chave), ou null (conta não achada).
import { chavesDoDestino } from "@/apps/montagem/lib/chave-do-destino";
import { dadosPixDaConta } from "@/apps/montagem/lib/mensagem-pix";

var semAc = function(x){ return String(x||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };

// destino do cadastro (Controle de pagamentos › Destinos) que abre o rótulo "Destino · conta": vale o nome mais longo que casa
function destinoDoRotulo(s, rotulo){
  var r = semAc(rotulo), alvo = null;
  ((s && s.cp && s.cp.destinos) || []).forEach(function(x){ var n = semAc(x.nome); if(n && (r===n || r.indexOf(n+" · ")===0 || r.indexOf(" · "+n)>=0) && (!alvo || n.length>semAc(alvo.nome).length)) alvo = x; });
  return alvo;
}

export function dadosDaConta(s, rotulo){
  var txt = String(rotulo||"").trim(); if(!txt || txt==="—") return null;
  var emp = dadosPixDaConta(s, txt);
  if(emp && emp.chave) return {chave:emp.chave, tipo:emp.tipo, empresa:emp.empresa, numerario:emp.numerario || "", ehEmpresa:true, banco:emp.banco || ""};
  var d = destinoDoRotulo(s, txt); if(!d) return null;
  var num = d.numerarioNome || d.numerario || "";
  var ch = chavesDoDestino(s, d)[0]; if(!ch || !ch.chave) return {semChave:true, numerario:num, empresa:d.nome};
  return {chave:ch.chave, tipo:ch.tipo, empresa:ch.fav || d.nome, numerario:num, ehEmpresa:false, banco:ch.banco || "", nome:d.nome};
}

export function chaveDaParte(s, descricao){
  var x = dadosDaConta(s, descricao); if(!x || x.semChave) return null;
  return {chave:x.chave, tipo:x.tipo, dados:x.ehEmpresa ? null : {nome:x.nome, banco:x.banco, favorecido:x.empresa, tipo:x.tipo}, empresa:x.ehEmpresa, numerario:x.numerario, favorecido:x.empresa};
}

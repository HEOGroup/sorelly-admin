// Sorelly Admin · montagem — lib/mensagem-pix.js
// Mensagem de Pix das CONTAS DA EMPRESA (formato escolhido pelo Marcus em 04/11/2026), pronta para colar no WhatsApp. Sem valor: o valor é combinado na conversa.
//   CHAVE PIX
//
//   - Banco: Bradesco
//   - Empresa: Serenity
//   - CNPJ: 59.146.403/0001-96
//
//   🔑 Chave (E-mail): ...
//
//   Envie o comprovante após o pagamento.
// O botão "Copiar" (components/copiar-chave.js) copia esta mensagem quando a chave foi registrada aqui pela tela Chaves Pix.
var BANCOS = ["Sicredi", "Itaú", "Caixa", "Safra", "Unicred", "Stone", "Bradesco", "Santander", "Nubank", "Inter"];
var TIPO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var MENSAGENS = {};

// "Sicredi Sorelly 34" → "Sicredi"; "Caixa Econômica 34" → "Caixa Econômica"
function bancoDaConta(nome){
  var n = String(nome||"").trim(), b = BANCOS.find(function(x){ return n.toLowerCase().indexOf(x.toLowerCase())===0; });
  return b==="Caixa" ? "Caixa Econômica" : (b || n.split(" ")[0]);
}
// 14 dígitos → 00.000.000/0000-00
function cnpjFormatado(txt){
  var d = String(txt||"").replace(/\D/g, "");
  return d.length===14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : "";
}
function mensagemPixEmpresa(d){
  var linhas = ["CHAVE PIX", ""];
  if(d.banco) linhas.push("- Banco: "+d.banco);
  if(d.empresa) linhas.push("- Empresa: "+d.empresa);
  if(d.cnpj) linhas.push("- CNPJ: "+d.cnpj);
  linhas.push("", "🔑 Chave ("+(TIPO[d.tipo] || "Pix")+"): "+d.chave, "", "Envie o comprovante após o pagamento.");
  return linhas.join("\n");
}
var registrarMensagemPix = function(chave, msg){ if(chave && msg) MENSAGENS[String(chave)] = msg; };
var mensagemDaChave = function(chave){ return MENSAGENS[String(chave)] || ""; };

export { bancoDaConta, cnpjFormatado, mensagemPixEmpresa, registrarMensagemPix, mensagemDaChave };

// Sorelly Admin · montagem — lib/mensagem-pix.js
// Mensagem de Pix das CONTAS DA EMPRESA (formato escolhido pelo Marcus em 04/11/2026), pronta para colar no WhatsApp. Sem valor: o valor é combinado na conversa.
//   *CHAVE PIX*
//
//   - *Banco:* Bradesco
//   - *Empresa:* Serenity
//   - *CNPJ:* 59.146.403/0001-96
//
//   🔑 *Chave (E-mail):*
//   marcooliveira070864@gmail.com   ← a chave fica sempre na linha de baixo
//
//   Envie o comprovante após o pagamento.
// O botão "Copiar" (components/copiar-chave.js) copia esta mensagem sempre que a chave é de uma conta da empresa (mensagemPixDaChave).
var BANCOS = ["Sicredi", "Itaú", "Caixa", "Safra", "Unicred", "Stone", "Bradesco", "Santander", "Nubank", "Inter"];
var TIPO = {CNPJ:"CNPJ", CPF:"CPF", EMAIL:"E-mail", TELEFONE:"Telefone", ALEATORIA:"Aleatória"};
var EMPRESA_CURTA = {"34":"Sorelly Atacadista", "46":"Mayz Comércio de Moda", "59":"Serenity", "67":"Axis", "HO":"H&O Apps", "ho":"H&O Apps"};

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
  var linhas = ["*CHAVE PIX*", ""];   // negrito do WhatsApp: texto entre asteriscos (Marcus, 04/11/2026)
  if(d.banco) linhas.push("- *Banco:* "+d.banco);
  if(d.empresa) linhas.push("- *Empresa:* "+d.empresa);
  if(d.cnpj) linhas.push("- *CNPJ:* "+d.cnpj);
  linhas.push("", "🔑 *Chave ("+(TIPO[d.tipo] || "Pix")+"):*", d.chave, "", "Envie o comprovante após o pagamento.");   // a chave SEMPRE na linha de baixo (Marcus, 04/11/2026)
  return linhas.join("\n");
}
// Copiar uma chave Pix de CONTA DA EMPRESA já sai nesta mensagem, em qualquer tela (Marcus, 04/11/2026). Chave de outra pessoa: devolve "" e o botão copia só a chave.
function tipoDaChave(chave){ var s = String(chave||"").trim(), n = s.replace(/D/g, ""); if(s.indexOf("@")>=0) return "EMAIL"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if(n.length===14) return "CNPJ"; return ""; }
function mensagemPixDaChave(s, chave){
  var sc = (s && s.saldosContas) || {}, px = (s && s.px) || {}, ch = String(chave||"").trim(); if(!ch) return "";
  var k = (px.contas||[]).find(function(x){ return x.caixaId && String(x.chave||"").trim()===ch; }); if(!k) return "";
  var conta = (sc.contas||[]).find(function(c){ return c.id===k.caixaId; }); if(!conta || !EMPRESA_CURTA[conta.bloco]) return "";
  var cnpj = ""; (sc.contas||[]).filter(function(c){ return c.bloco===conta.bloco; }).forEach(function(c){ if(cnpj) return; var kk = (px.contas||[]).find(function(x){ return x.caixaId===c.id && x.chave; }); if(kk && (kk.chaveTipo==="CNPJ" || tipoDaChave(kk.chave)==="CNPJ")) cnpj = cnpjFormatado(kk.chave); });
  return mensagemPixEmpresa({banco:bancoDaConta(conta.nome), empresa:EMPRESA_CURTA[conta.bloco], cnpj:cnpj, tipo:k.chaveTipo || tipoDaChave(ch), chave:ch});
}

export { bancoDaConta, cnpjFormatado, mensagemPixEmpresa, mensagemPixDaChave };

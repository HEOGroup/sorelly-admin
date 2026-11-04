import { chaveAdminDaConta } from "@/apps/montagem/domain/pix-regras";
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
// Pix de PESSOA (funcionária, sócio, prestador, fornecedor, representante): mesma mensagem, com o nome no lugar da empresa (Marcus, 04/11/2026: "de todo mundo tem que ser")
function mensagemPixPessoa(d){
  var linhas = ["*CHAVE PIX*", ""];
  if(d.nome) linhas.push("- *Nome:* "+d.nome);
  if(d.banco) linhas.push("- *Banco:* "+d.banco);
  if(d.favorecido && d.favorecido!==d.nome) linhas.push("- *Favorecido:* "+d.favorecido);
  linhas.push("", "🔑 *Chave ("+(TIPO[d.tipo] || "Pix")+"):*", d.chave, "", "Envie o comprovante após o pagamento.");
  return linhas.join("\n");
}
// Copiar uma chave Pix de CONTA DA EMPRESA já sai nesta mensagem, em qualquer tela (Marcus, 04/11/2026). Chave de outra pessoa: devolve "" e o botão copia só a chave.
function tipoDaChave(chave){ var s = String(chave||"").trim(), n = s.replace(/\D/g, ""); if(s.indexOf("@")>=0) return "EMAIL"; if(/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)) return "ALEATORIA"; if(n.length===14) return "CNPJ"; return ""; }
// empresa do bloco: pelo id ("34") ou pelo nome do bloco ("Sorelly Atac · 34", "Serenity · 59", "H&O"); assim funciona mesmo em dados salvos com outro nome
function empresaDoBloco(sc, blocoId){
  if(EMPRESA_CURTA[blocoId]) return EMPRESA_CURTA[blocoId];
  var b = (sc.blocos||[]).find(function(x){ return x.id===blocoId; }), txt = String(blocoId)+" "+String((b && b.nome) || "");
  if(/h&o|\bho\b/i.test(txt)) return EMPRESA_CURTA["HO"]; if(/\b34\b|atac/i.test(txt)) return EMPRESA_CURTA["34"]; if(/\b46\b|mayz|shopping/i.test(txt)) return EMPRESA_CURTA["46"];
  if(/\b59\b|serenity/i.test(txt)) return EMPRESA_CURTA["59"]; if(/\b67\b|axis/i.test(txt)) return EMPRESA_CURTA["67"]; return "";
}
// dados da conta da empresa dona da chave (banco, empresa, CNPJ, tipo e chave); null se a chave não é de conta da empresa
function dadosPixDaChave(s, chave){
  var sc = (s && s.saldosContas) || {}, px = (s && s.px) || {}, ch = String(chave||"").trim(); if(!ch) return null;
  // chave salva no Caixa ou, se o estado ainda não a tem, a do arquivo local (pela conta)
  var k = (px.contas||[]).find(function(x){ return x.caixaId && String(x.chave||"").trim()===ch; }), conta = k ? (sc.contas||[]).find(function(c){ return c.id===k.caixaId; }) : null;
  if(!conta){ conta = (sc.contas||[]).find(function(c){ var a = chaveAdminDaConta(c.nome); return a && String(a.chave).trim()===ch; }); if(conta) k = chaveAdminDaConta(conta.nome); }
  if(!conta || !k) return null;
  var empresa = empresaDoBloco(sc, conta.bloco); if(!empresa) return null;
  var cnpj = ""; (sc.contas||[]).filter(function(c){ return c.bloco===conta.bloco; }).forEach(function(c){ if(cnpj) return; var kk = (px.contas||[]).find(function(x){ return x.caixaId===c.id && x.chave; }) || chaveAdminDaConta(c.nome); if(kk && (kk.chaveTipo==="CNPJ" || tipoDaChave(kk.chave)==="CNPJ")) cnpj = cnpjFormatado(kk.chave); });
  return {banco:bancoDaConta(conta.nome), empresa:empresa, cnpj:cnpj, tipo:k.chaveTipo || tipoDaChave(ch), chave:ch};
}
function mensagemPixDaChave(s, chave){ var d = dadosPixDaChave(s, chave); return d ? mensagemPixEmpresa(d) : ""; }
// a conta escolhida pelo financeiro chega ao app como o rótulo do cadastro (ex.: "PIX - SICREDI - SERENITY - 59"): devolve os dados da chave dela
function dadosPixDaConta(s, rotulo){
  var px = (s && s.px) || {}, sc = (s && s.saldosContas) || {}, n = function(x){ return String(x||"").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase(); };
  var ultimo = String(rotulo||"").split(" · ").pop();   // o Direcionar grava "Destino · conta": vale o que vem depois do último " · "
  var k = (px.contas||[]).find(function(c){ return c.label===rotulo || c.label===ultimo || c.label==="PIX - "+ultimo; });
  var conta = k ? (sc.contas||[]).find(function(c){ return c.id===k.caixaId; }) : (sc.contas||[]).find(function(c){ return n(c.nome)===n(ultimo); });
  if(!k && conta) k = (px.contas||[]).find(function(c){ return c.caixaId===conta.id; });
  var ch = k ? String(k.chave||"").trim() : "";
  if(!ch && conta){ var a = chaveAdminDaConta(conta.nome); ch = a ? String(a.chave).trim() : ""; }   // estado salvo sem a chave: vale a do arquivo local
  return ch ? dadosPixDaChave(s, ch) : null;
}

export { bancoDaConta, cnpjFormatado, mensagemPixEmpresa, mensagemPixPessoa, mensagemPixDaChave, dadosPixDaChave, dadosPixDaConta };

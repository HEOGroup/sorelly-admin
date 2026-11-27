import { chaveAdminDaConta } from "@/apps/montagem/domain/pix-regras";
import { BKC } from "@/apps/montagem/lib/format";
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
// PADRÃO DO NOME DA CONTA (Marcus, 27/11/2026): "Banco Empresa 59", sem palavra repetida e sem "Pix"/"CNPJ" soltos. Ex.: "Pix · CNPJ 59 · Serenity · Sicredi Serenity" → "Sicredi Serenity 59".
function contaPadrao(rotulo){
  var sem = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var vistos = {}, banco = "", num = "", resto = [];
  String(rotulo||"").split(/\s+[·-]\s+|\s+/).forEach(function(w){ var k = sem(w); w = w.charAt(0).toUpperCase()+w.slice(1).toLowerCase(); if(!k || k==="pix" || k==="cnpj" || vistos[k]) return; vistos[k] = 1;
    if(/^\d{2}$/.test(k)) num = w; else if(!banco && BANCOS.some(function(b){ return sem(b)===k; })) banco = w; else resto.push(w); });
  return [banco].concat(resto, [num]).filter(Boolean).join(" ");
}
function mensagemPixEmpresa(d){ return mensagemPixPadrao({conta:["Pix", d.banco, d.empresa].filter(Boolean).join(" · "), tipo:d.tipo, chave:d.chave}); }
function mensagemPixPessoa(d){ return mensagemPixPadrao({conta:["Pix", d.banco, d.nome || d.favorecido].filter(Boolean).join(" · "), tipo:d.tipo, chave:d.chave}); }
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
  return {banco:bancoDaConta(conta.nome), empresa:empresa, cnpj:cnpj, tipo:k.chaveTipo || tipoDaChave(ch), chave:ch, numerario:conta.numerarioNome || ""};   // numerário = o que se escreve na folha e na DevMaster (R3)
}
// MENSAGEM PADRÃO DE ENVIO (Marcus, 26/11/2026): a MESMA em todo lugar que manda Pix (Contas a receber/Lucas, Atendimento interno, app da representante). Cada tela só escolhe como mostrar.
// d = {numerario, valor, favorecido, tipo, chave}. Aviso do comprovante no início; a chave na última linha. O nome do numerário vem da tela Numerários, nunca digitado.
//   Comprovante: enviar assim que fizer o Pix.
//   (linha vazia)
//   Escrever na folha/Sistema:
//   Pix - Marcus Hess - PF
//   (linha vazia)
//   Valor a pagar: R$ 1.250,00
//   (linha vazia)
//   Chave Pix:
//   68 Gang Performance
//   CNPJ
//   49886705000147
var AVISO_COMPROVANTE = "Comprovante: enviar assim que fizer o Pix.";
// FORMATO ÚNICO (Marcus, 27/11/2026): toda chave Pix copiada sai assim. d.conta tem prioridade sobre o numerário.
//   Por favor, envie o comprovante após o pagamento.
//   (vazia) *Conta:* Pix · Sicredi · Serenity · 59 / *Valor:* R$ 2.515,00 / *Tipo de chave:* CNPJ (vazia) *Chave Pix:* / 59146403000196
function mensagemPixPadrao(d){
  var l = ["Por favor, envie o comprovante após o pagamento.", ""], conta = d.conta ? "Pix · "+contaPadrao(d.conta) : d.numerario;
  if(conta) l.push("*Conta:* "+conta);
  if(Number(d.valor)>0) l.push("*Valor:* "+BKC(d.valor));
  if(d.tipo) l.push("*Tipo de chave:* "+(TIPO[d.tipo] || d.tipo));
  l.push("", "*Chave Pix:*", d.chave);
  return l.join("\n");
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

export { contaPadrao, AVISO_COMPROVANTE, bancoDaConta, cnpjFormatado, mensagemPixPadrao, mensagemPixEmpresa, mensagemPixPessoa, mensagemPixDaChave, dadosPixDaChave, dadosPixDaConta };

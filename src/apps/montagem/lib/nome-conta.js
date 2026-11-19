// Sorelly Admin · montagem — lib/nome-conta.js
// ESCRITA PADRÃO DAS CONTAS EM TODO O FINANCEIRO (Marcus, 12/11/2026: "padroniza isso em todas as telas do Financeiro"). Cada informação aparece UMA vez (nunca repetir o 59).
//   Empresa ................ CNPJ 34 · Sorelly · Sicredi        (CNPJ nº · Nome curto · Banco)
//   Sócio .................. PF · Marcus · Nubank
//   Prestador da família ... Marcus · Higor · Santander         (Sócio que paga · Prestador · Banco)
//   Prestador/fornecedor ... Sorelly · Higor · Santander        (Sorelly paga · Nome · Banco)
//   Funcionário/representante  Nome · Banco
// Sem banco cadastrado a linha termina no nome (nada de "‹banco›" nas telas). Nomes de pessoa nunca ficam em maiúscula.
// Uso: rotuloDestino(destino, contaEscolhida) · rotuloCnpj(num, nomeCadastrado) · bancoDeConta(textoDaConta) · rotuloPrestadorFamilia(socio, prestador, conta)

/** Nome curto de cada CNPJ (Marcus, 12/11/2026: "34 só Sorelly, 46 só Mayz"). Quem não está aqui usa o nome cadastrado. */
var NOME_CURTO_CNPJ = {"34":"Sorelly", "46":"Mayz", "59":"Serenity", "67":"Axis", "HO":"Apps", "ho":"Apps", "ITM":"Marco PJ", "itm":"Marco PJ"};

var BANCOS = ["Sicredi", "Itaú", "Bradesco", "Safra", "Stone", "Caixa", "Unicred", "Nubank", "Santander", "Sicoob", "Inter", "C6", "PicPay", "Mercado Pago", "InfinitePay", "RecargaPay", "PagSeguro", "Banco do Brasil", "Cora", "BTG"];
var ALIAS_BANCO = {"caixa econômica":"Caixa", "caixa economica":"Caixa", "c6 bank":"C6", "itau":"Itaú", "itaú empresas":"Itaú", "itaú black":"Itaú"};
var sem = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };

/** Banco de um texto de conta: "Sicredi Sorelly 34" → "Sicredi"; "Caixa Econômica 34" → "Caixa"; "Itaú Marco PJ" → "Itaú"; "PIX - SICREDI - SERENITY - 59" → "Sicredi". Sem banco conhecido devolve "". */
function bancoDeConta(texto){
  var t = sem(texto);
  if(!t) return "";
  var al = Object.keys(ALIAS_BANCO).filter(function(k){ return t.indexOf(sem(k))>=0; })[0];
  if(al) return ALIAS_BANCO[al];
  for(var i = 0; i<BANCOS.length; i++){ if(new RegExp("(^|[^a-z])"+sem(BANCOS[i]).replace(/\s+/g, "\\s+")+"([^a-z]|$)").test(t)) return BANCOS[i]; }
  return "";
}

/** Palavra TODA EM MAIÚSCULA vira Nome Próprio; siglas e números ficam; de/da/do/e ficam minúsculas. */
var MIN = {de:1, da:1, do:1, dos:1, das:1, e:1};
var SIGLAS = /^(CNPJ|CPF|PF|PJ|ITM|ME|MEI|LTDA|EPP|HO|H&O|PIX|DM|SC|TI|RH|SA|NF|II|III|IV)$/;
function nomePropio(txt){ return String(txt==null ? "" : txt).split(" ").map(function(w){ if(!w || /\d|[$]/.test(w) || !/^[A-Za-zÀ-ÿ]/.test(w) || SIGLAS.test(w) || w!==w.toUpperCase() || w===w.toLowerCase()) return w; var l = w.toLowerCase(); return MIN[l] ? l : l.charAt(0).toUpperCase()+l.slice(1); }).join(" "); }

/** Número do CNPJ a partir do cnpjId ("34", "46", "HO", "ITM") ou do nome do destino ("CNPJ 34 · Sorelly Atacadista"). */
function numeroCnpj(d){
  var id = d && d.cnpjId ? String(d.cnpjId) : "";
  if(id) return id.toUpperCase()==="HO" ? "H&O" : id;
  var m = /CNPJ\s+([0-9]{2,3}|H&O|HO)/i.exec(d && d.nome || "");
  return m ? m[1].toUpperCase().replace(/^HO$/, "H&O") : "";
}

/** "CNPJ 34 · Sorelly": o nome curto do mapa; se o CNPJ não está no mapa usa o nome cadastrado (sem o número repetido). */
function rotuloCnpj(num, nomeCadastrado){
  var n = String(num || ""), chave = n.replace(/&/g, "").toUpperCase();
  if(chave==="ITM") return "Marco PJ";
  var curto = NOME_CURTO_CNPJ[n] || NOME_CURTO_CNPJ[chave];
  var resto = String(nomeCadastrado || "").replace(/^CNPJ\s+(\d{2,3}|H&O|HO)\s*[·\-–—]?\s*/i, "").replace(/^H&O\s+/, "").trim();
  var nome = curto || nomePropio(resto);
  return ("CNPJ "+n+(nome ? " · "+nome : "")).trim();
}

/** Junta as partes que existem, uma vez cada, separadas por " · " (some parte vazia ou repetida). */
function junta(partes){
  var vistas = {}, out = [];
  partes.forEach(function(p){ var t = String(p==null ? "" : p).trim(); if(!t) return; var k = sem(t); if(vistas[k]) return; vistas[k] = 1; out.push(t); });
  return out.join(" · ");
}

/** Linha de um destino de pagamento (cp.destinos[]): destino = {nome, tipo, cnpjId, banco}; conta = texto da conta escolhida (opcional). */
function rotuloDestino(d, conta){
  if(!d) return "";
  var banco = bancoDeConta(conta) || bancoDeConta(d.banco) || nomePropio(d.banco || "");
  if(d.tipo==="CNPJ"){
    var num = numeroCnpj(d);
    if(String(d.cnpjId).toUpperCase()==="ITM") return junta(["Marco PJ", banco || "Itaú"]);
    return junta([rotuloCnpj(num, d.nome), banco]);
  }
  var nome = nomePropio(d.nome);
  if(d.tipo==="FAMILIA") return junta(["PF", nome, banco]);
  if(d.tipo==="FORNECEDOR" || d.tipo==="PRESTADOR") return junta(["Sorelly", nome, banco]);
  return junta([nome, banco]);   // representante e funcionário
}

/** Prestador da família: "Marcus · Higor · Santander". socio = nome do sócio que paga. */
function rotuloPrestadorFamilia(socio, prestador, conta){ return junta([nomePropio(socio), nomePropio(prestador), bancoDeConta(conta)]); }

/** Nome curto de pessoa: primeiro e último nome, sem de/da/do ("Ana Claudia Adriano" → "Ana Adriano"). */
function nomeCurto(n){ var w = nomePropio(String(n||"").replace(/\s+/g, " ").trim()).split(" ").filter(function(x){ return x && !MIN[x.toLowerCase()]; }); return w.length<=2 ? w.join(" ") : w[0]+" "+w[w.length-1]; }

/** Maquininha ou link (lp.meios[]): "Link · Sicredi", "Maquininha · Serenity", "Maquininha · Getnet". O adquirente "Outro" não é nome: usa o nome do meio. */
function rotuloMeio(m){ if(!m) return ""; var adq = m.adq && m.adq!=="Outro" ? m.adq : (m.tipo==="LINK" ? "" : m.nome); return junta([m.tipo==="LINK" ? "Link" : "Maquininha", nomePropio(adq)]); }

/** Nome de pessoa para tabela e lista: nome próprio, sem maiúsculas gritando. */
function nomePessoa(n){ return nomePropio(n); }

export { NOME_CURTO_CNPJ, bancoDeConta, nomeCurto, nomePropio, nomePessoa, rotuloMeio, numeroCnpj, rotuloCnpj, rotuloDestino, rotuloPrestadorFamilia, junta };

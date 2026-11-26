// Sorelly Admin · kits novos Curitiba — domain/padroniza.js
// PADRONIZAÇÃO DOS TEXTOS DA PLANILHA (Marcus, 26/11/2026: "nomes errados: STÚDIO ELEGANCE, girassol caferteria; Autônoma no local de trabalho; endereço de trabalho escrito Cielog").
// Só muda o que aparece na tela. O dado guardado no servidor NÃO muda (nada se perde). Funções puras, sem tela.
//
//   titulo("STÚDIO ELEGANCE")      -> "Estúdio Elegance"  (nome próprio: cada palavra com a primeira letra grande, de/da/do/dos/e em letra pequena, siglas em maiúscula)
//   frase("nail designer")         -> "Nail designer"     (profissão: só a primeira letra grande)
//   trabalhoDe({prof, trab, trabEnd}) -> {prof, local, end}
//     - "Autônoma" nunca fica no local de trabalho: vira parte da profissão ("Manicure · Autônoma")
//     - "Desempregada" e "Não trabalha" viram a profissão "Sem trabalho"; "Funcionária Sorelly" vira o local "Sorelly"
//     - profissão e local que vieram trocados voltam para o lugar; "Hospital X - Enfermeira" repetindo a profissão perde a repetição
//     - endereço que é só nome de lugar (sem rua e sem número, ex.: Cielog) sai do endereço e entra no local: "Expresso 3300 - Cielog"
//   enderecoDe("R. Álvaro Andrade, 225 - Água Verde") -> "Rua Álvaro Andrade, 225 - Água Verde"

var PEQUENAS = {de:1, da:1, do:1, dos:1, das:1, e:1, em:1, na:1, no:1, nas:1, nos:1, a:1, o:1, com:1, para:1, por:1, y:1};
var SIGLAS = {crm:1, cnpj:1, cpf:1, pf:1, pj:1, mei:1, ltda:1, epp:1, eireli:1, rh:1, ti:1, sac:1, uti:1, upa:1, apae:1, fiep:1, ccm:1, cd:1, pr:1, sc:1, sp:1, rs:1, bb:1, jm:1, kpm:1, wg:1, fj:1, ep:1, cm:1, lvm:1, sejuc:1, seju:1, trc:1, mdf:1};

function sem(s){ return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); }
function limpa(v){
  var s = String(v == null ? "" : v).replace(/[⁠​‌‍﻿ ]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^[\s\-–—,;:.]+/, "").replace(/[\s\-–—,;:.]+$/, "");
  return s;
}
function maiuscula(w){ return w.charAt(0).toUpperCase()+w.slice(1); }

// Nome próprio: Studio Elegance, Girassol Cafeteria, Hospital São Vicente, Banco do Brasil
function titulo(v){
  var s = limpa(v); if(!s) return "";
  return s.split(" ").map(function(w, i){
    if(!w) return w;
    if(/\d/.test(w) || /^[#@&]/.test(w)) return w;
    if(w.indexOf("/")>0 && i>=0 && !/^s\/n/i.test(w)) return w.split("/").map(function(x){ return titulo(x); }).join("/");
    if(/[a-zà-ú][A-ZÀ-Ú]/.test(w)) return w;   // já veio com letra grande no meio (NeoLens, iFood): fica como está
    var l = w.toLowerCase(), cru = l.replace(/[^a-zà-ú]/g, "");
    if(SIGLAS[cru]) return w.replace(/[a-zà-ú]+/i, function(m){ return m.toUpperCase(); });
    if(w.length<=3 && w===w.toUpperCase() && /[A-ZÀ-Ú]{2}/.test(w) && !PEQUENAS[cru]) return w;   // sigla curta que já veio em maiúscula (LVM, CM)
    if(i>0 && PEQUENAS[l]) return l;
    return l.split("-").map(function(p){ return p.split("/").map(maiuscula).join("/"); }).join("-").replace(/'([a-zà-ú])/g, function(m, c){ return "'"+(l.indexOf("'")===1 ? c.toUpperCase() : c); });
  }).join(" ");
}

// Frase (profissão, atividade): só a primeira letra grande; o que veio TODO em maiúscula ou TODO em minúscula é refeito; "E" solto vira "e"
function frase(v){
  var s = limpa(v); if(!s) return "";
  if(s===s.toUpperCase() || s===s.toLowerCase() || (s.indexOf(" ")>0 && s.split(" ").every(function(w){ return PEQUENAS[w.toLowerCase()] || /^[A-ZÀ-Ú][a-zà-ú]*$/.test(w); }))) s = s.toLowerCase().replace(/\b[a-zà-ú]+\b/g, function(m){ return SIGLAS[m] ? m.toUpperCase() : m; });
  s = s.replace(/^aux\.?\s/i, "Auxiliar ").replace(/^ass\.?\s/i, "Assistente ").replace(/\b[a-zà-ú]+\b/gi, function(m){ return SIGLAS[m.toLowerCase()] ? m.toUpperCase() : m; });
  s = s.replace(/ E /g, " e ").replace(/ De /g, " de ").replace(/ Da /g, " da ").replace(/ Do /g, " do ");
  return maiuscula(s);
}

var PROFISSAO = /^(aux|assist|analist|atend|vended|vendas|revend|vendo|venda|profess|enfermeir|t[eé]cnic|gerent|recepcion|secret|manicur|nail|lash|cabeleir|esteticis|estetica|maquiad|diarist|bab[aá]|cuidador|motorist|motorista|promotor|supervis|coordenad|operador|caixa|frentista|porteir|farmac|psic[oó]log|advogad|nutricion|fisioter|radiolog|estagi|aprendiz|administr|projetist|consultor|executiv|agente|telefonist|preceptor|monitor|escrevent|dentist|auxiliar|empres[aá]ri|propriet|dona|s[oó]cia|diretor|gestor|representante|educador|montador|ajudante|publicit|cozinheir|limpeza|servi[cç]os gerais|autonom|confeit|doceir|costureir|lojista|depilad|extensionista|personal|taxista|protetic|bilheter|teleatend|dono\b|body|negociador|cobran|extens[aã]o|sem trabalho|aposentad|desempregad|estudante|do lar|dona de casa|balconist|compras|trancist|laboratorist|sargento|cabo|soldad|coronel|agronom|engenheir[oa] (agr|civil|eletr|mecan|quim|amb|de)|tec.|funcionari|cantor|promoter|influencer|massoterap|assessor|lojista|corretor|tatuad|piercer|micropig|designer|sobrancelh|lash|nail|salgad|vende|vendo|revende|revenda|loja online|loja de|locac|produtos|perfumaria|recrutamento|alisamento|servicos|na area|digital|encomendas|especialista|cabelere|estagiari|zelador|vigilante|pedagog|orientador|dire[cç]ao|operadora|sociais|contador|contabil|financeir)/i;
function ehProfissao(s){ return PROFISSAO.test(sem(s)); }
// nome de empresa, loja ou lugar (e não profissão): serve para mandar o texto para o Local de trabalho
var EMP_INICIO = /^(studio|estudio|salao|salon|espaco|loja|boutique|store|clinica|hospital|escola|colegio|centro|instituto|prefeitura|restaurante|comercio|universidade|igreja|fundacao|unidade|empresa|industria|supermercado|padaria|panificadora|confeitaria|lanchonete|hotel|rede|grupo|laboratorio|cartorio|banco|cooperativa|associacao|comando|secretaria (municipal|estadual|estado|de|do|da)|tabelionato|consultorio|farmacia|distribuidora|hamburgueria|construtora|transportes|imobiliaria|pref\.)/;
var EMP_ONDE = /\b(studio|estudio|salao|boutique|store|ltda|eireli|clinica|hospital|escola|prefeitura|restaurante|comercio|transportes|tecnologia|engenharia|imobiliaria|consultorio|universidade|tabelionato|farmacia|igreja|instituto|distribuidora|panificadora|hamburgueria|construtora|contabilidade|advogados|associados|fundacao|industria|supermercado|padaria|lanchonete|hotel|laboratorio|odontologia|cartorio|funilaria|oficina|spa|lounge|beauty|brasil|outlet|pizza|cafe|cafeteria|moda|park|nails|embalagens|eletromotores|equipamentos|autopecas|terceirizados|loterica|farmacias|farma|solucoes|investimentos|propaganda|barbearia|brecho|otica|automotivo|cacau show|latam|samu|apae|opcao|descontao)\b/;
var ERROS = [[/\bcabelere(ir[ao]s?)\b/gi, "cabeleire$1"], [/\blangerie(s?)\b/gi, "lingerie$1"], [/\best[áa]giaria\b/gi, "estagiária"], [/\btecnologica\b/gi, "tecnológica"], [/\bdesiwgner\b/gi, "designer"], [/\bbeuty\b/gi, "beauty"], [/\bsosia\b/gi, "sócia"], [/\blaboratoralista\b/gi, "laboratorista"], [/\bacessoria\b/gi, "assessoria"], [/\bsaude\b/gi, "saúde"], [/\bpublica\b/gi, "pública"], [/\bpref\.?\s/gi, "Prefeitura "], [/\baux\.?\s/gi, "auxiliar "], [/\btec\.\s*/gi, "técnica "], [/\brev\.\s*/gi, "revendedora "], [/\bde eng\.?\s/gi, "de engenharia "], [/\bstúdio\b/gi, "estúdio"], [/\bauxíliar\b/gi, "auxiliar"], [/\bdesigner de inferiores\b/gi, "designer de interiores"]];
function arruma(s){ var t = String(s || ""); ERROS.forEach(function(e2){ t = t.replace(e2[0], e2[1]); }); return t.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")").replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", "); }
function ehEmpresa(x){ var t = sem(x).replace(/^[\s(]+/, ""); if(EMP_INICIO.test(t) && t.indexOf(" ")>0) return true; if(ehProfissao(x)) return false; if(EMP_ONDE.test(t)) return true; return false; }

var AUTONOMA = /^aut[oô]nom[oa]s?$/i;
function ehAutonoma(s){ return AUTONOMA.test(sem(s).replace(/[,.\s]+$/, "")); }

// Profissão curta (Marcus, 26/11/2026): "Streaming para plataformas da beleza" vira "Streaming"; "Agente de carga somente" vira "Agente de carga"
function curta(p){
  var s = p;
  if(/^streaming\b/i.test(s)) return "Streaming";
  s = s.replace(/\s+(somente|apenas|exclusivamente)\.?$/i, "").replace(/\s+(para|que|onde|com foco|focad[oa]s?)\s+.+$/i, "");
  if(s.length>30){ var primeiro = limpa(s.split(/\s+e\s+|,\s*|\s*[\/|;]\s*|\s*\(/)[0]); if(primeiro.length>=4) s = primeiro; }
  s = s.replace(/^(vende|vendo|revende)\s+(.+)$/i, "Vendedora de $2").replace(/^revenda\s+de\s+/i, "Vendedora de ").replace(/^(vendedora de .{20,})$/i, function(x){ return limpa(x.split(/\s+e\s+|,\s*/)[0]); }).replace(/^revendedora\b.{8,}$/i, "Revendedora");
  return limpa(s) || p;
}

function trabalhoDe(c){
  var P = limpa(arruma(c && c.prof)), L = limpa(arruma(c && c.trab)), E = limpa(c && c.trabEnd), aut = false, sem2 = "";
  var SEP = /\s+[-–—]\s*|\s*[-–—]\s+|\s*\|\s*|(?<=[a-zà-ú]{4})\.\s+/i;
  // 0) "· Autônoma" no fim da profissão (dado já padronizado) e "Autônoma:" no começo
  if(/\s*[·|]\s*aut[oô]nom[oa]s?$/i.test(P)){ aut = true; P = limpa(P.replace(/\s*[·|]\s*aut[oô]nom[oa]s?$/i, "")); }
  L = limpa(L.replace(/^aut[oô]nom[oa]s?\s*:\s*/i, function(){ aut = true; return ""; }));
  P = limpa(P.replace(/^aut[oô]nom[oa]s?\s*:\s*/i, function(){ aut = true; return ""; }));
  // 0b) texto todo entre parênteses: "( vendas de semijoias )" -> sem parênteses
  var emb = /s*[/|]s*aut[oô]nom[oa]s?(?:s*([^)]*))?/i;
  if(emb.test(P)){ aut = true; P = limpa(P.replace(emb, "")); } if(emb.test(L)){ aut = true; L = limpa(L.replace(emb, "")); }
  var un = function(x){ var m = /^\((.*)\)$/.exec(x); return m ? limpa(m[1]) : x; };
  // 0c) lixo de cadastro: "Kit Novo - Voltando a Vender (funcionária)"
  if(/kit novo|voltando a vender|^(kit )?retornando$/i.test(L)) L = "";
  if(/^(kit )?retornando$/i.test(P)) P = "";
  var partes = L ? L.split(SEP).map(limpa).filter(Boolean) : [];
  // 1) "Autônoma" sai do local (e da profissão) e vira marca da profissão
  partes = partes.filter(function(x){ if(ehAutonoma(x)){ aut = true; return false; } return true; });
  var m = /^aut[oô]nom[oa]s?[,]?\s+(.+)$/i.exec(P);
  if(ehAutonoma(P)){ aut = true; P = ""; } else if(m){ aut = true; P = limpa(m[1]); }
  partes = partes.map(function(x){ var q = /^aut[oô]nom[oa]s?[,]?\s+(.+)$/i.exec(x); if(q){ aut = true; return limpa(q[1]); } return x; });
  P = un(P); partes = partes.map(un).filter(Boolean);
  // 1a) "Empresa (cargo)" na profissão ou no local: o que está entre parênteses e é profissão vira a profissão
  var par = function(x){ var q = /^(.*?)\s*\(([^()]+)\)\s*(.*)$/.exec(x); return q ? {fora:limpa(q[1]+" "+q[3]), dentro:limpa(q[2])} : null; };
  var pp0 = par(P);
  if(pp0 && ehProfissao(pp0.dentro) && pp0.fora){ pp0.fora.split(SEP).map(limpa).filter(Boolean).forEach(function(x){ if(ehEmpresa(x)) partes.push(x); }); P = pp0.dentro; }
  else if(pp0 && ehProfissao(pp0.fora) && pp0.dentro && ehEmpresa(pp0.dentro) && !/^tem\b/i.test(pp0.dentro)){ partes.push(pp0.dentro); P = pp0.fora; }
  partes = partes.map(function(x){ var q = par(x); if(q && ehProfissao(q.dentro)){ if(!P) P = q.dentro; return q.fora; } return x; }).filter(Boolean);
  // 1b) profissão que veio como "Empresa - Profissão" na própria coluna: a última parte é a profissão, o resto é o local
  var pp = P.split(SEP).map(limpa).filter(Boolean);
  if(pp.length>=2){ partes = partes.filter(function(x){ return !pp.some(function(y){ return sem(y)===sem(x); }); }).concat(pp.slice(0, -1)); P = pp[pp.length-1]; }
  // 1c) o local veio escrito como endereço (rua e número) e o endereço está vazio: passa para o endereço
  if(!E && /^(rua|r\.?|av\.?|avenida|rod\.?|rodovia|estrada|travessa)\s/i.test(L) && /\d/.test(L)){ E = L; partes = []; }
  // 1d) "Proprietária da Clínica: Jady Garcia" -> profissão antes dos dois pontos, nome depois
  var dp = /^([^:]{3,40}?)\s*:\s*(.+)$/.exec(P);
  if(dp && ehProfissao(dp[1])){ P = limpa(dp[1].replace(/\s+d[aoe]s?\s+(cl[ií]nica|loja|studio|est[uú]dio|sal[aã]o)$/i, "")); partes.unshift(limpa(dp[2])); }
  // 1e) profissão com mais de uma parte ("Lash designer / studio Laís"): o que é profissão fica, o que é empresa vai para o local
  var ps = P.split(/\s*[\/|]\s*/).map(limpa).filter(Boolean);
  if(ps.length>=2){ var profs = [], emps = []; ps.forEach(function(x){ (ehEmpresa(x) ? emps : profs).push(x); }); if(emps.length){ P = profs.join(" / "); emps.forEach(function(x){ partes.push(x); }); } }
  // 1f) profissão que é, na verdade, uma empresa ou um lugar: vai para o local (sem local ainda, ou com o local sendo a profissão)
  if(P && ehEmpresa(P) && !ehProfissao(P.split(" ")[0]) ){
    if(!partes.length){ partes = [P]; P = ""; }
    else if(partes.length===1 && ehProfissao(partes[0]) && !ehEmpresa(partes[0])){ var t0 = P; P = partes[0]; partes = [t0]; }
  }
  // 2) sem trabalho / funcionária da Sorelly / aposentada
  var todas = [P].concat(partes).map(sem).join(" | ");
  if(/desempregad|nao trabalha/.test(todas) && partes.length<2){ sem2 = "Sem trabalho"; }
  var fs = partes.some(function(x){ return /funcionaria sorelly/.test(sem(x)); });
  if(fs){ partes = ["Sorelly"]; }
  if(P && ehEmpresa(P) && partes.length===1 && sem(partes[0])===sem(P)) P = "";
  // 3) repetição: parte do local igual (ou contida) na profissão, ou o contrário; profissão e local trocados
  if(P){ partes = partes.filter(function(x){ var a = sem(x), b = sem(P); return a!==b && !(a.length>4 && b.indexOf(a)>=0) && !(b.length>4 && a===b); }); }
  if(partes.length>=2){
    var iguais = partes.map(function(x){ return P && sem(x)===sem(P); }), k = iguais.indexOf(true);
    if(k>=0){ partes = partes.filter(function(x, i){ return i!==k; }); }
  }
  // partes repetidas ou contidas em outra ("Clínica Odontológica - Clínica Odontológica")
  var vistos = [];
  partes.forEach(function(x){ var a = sem(x); if(vistos.some(function(y){ return sem(y)===a; })) return; vistos.push(x); });
  partes = vistos.filter(function(x, i){ var a = sem(x); return !vistos.some(function(y, j){ var b = sem(y); return j!==i && b.length>a.length && b.indexOf(a)>=0 && a.length>5; }); });
  // parte que é só a profissão (Técnica em enfermagem) some se a profissão já existe; se não existe, vira a profissão
  if(partes.length>=2){ var so = partes.filter(function(x){ return ehProfissao(x) && !ehEmpresa(x); }); if(so.length && so.length<partes.length){ if(!P) P = so[0]; partes = partes.filter(function(x){ return so.indexOf(x)<0; }); } }
  if(P && !partes.length && ehEmpresa(P)){ partes = [P]; P = ""; }
  L = partes.join(" - ");
  if(P && L && sem(P)===sem(L)) L = "";
  // 4) profissão e local trocados sem traço ("Engenheiros do bolo" / "Confeiteira")
  if(P && L && !ehProfissao(P) && ehProfissao(L) && !ehEmpresa(L) && !/^(proprietar|dona|socia)/.test(sem(P))){ var tmp = P; P = L; L = tmp; }
  // 4b) só havia o local e ele é, na verdade, uma profissão ("Proprietária loja de roupa"): passa para a profissão
  if(!P && partes.length===1 && L && ehProfissao(L) && !ehEmpresa(L) && !/^sorelly|^representante/i.test(L)){ P = L; L = ""; }
  // 5) autônoma sem profissão escrita: a atividade estava no local ("Vendas romance e o boticário")
  if(aut && !P && L && !ehEmpresa(L)){ P = L; L = ""; }
  if(sem2){ P = sem2; L = ""; }
  // 6) aposentada da prefeitura...
  var ap = /^aposentad[ao]s?\s+(?:da|do|de)\s+(.+)$/i.exec(L); if(ap){ if(!P) P = "Aposentada"; L = limpa(ap[1]); }
  // 7) endereço que é só nome de lugar entra no local
  if(E && !/\d/.test(E) && !/\b(rua|r\.|av\.?|avenida|rod\.?|rodovia|estrada|travessa|tv\.|alameda|pra[cç]a)\b/i.test(sem(E))){ L = L ? L+" - "+E : E; E = ""; }
  // 8) "Araucária Acqua Park fica no Capela Velha": o lugar é o local, o bairro vai para o endereço
  var fi = /^(.+?)\s+(?:que\s+)?(?:fica|localizad[oa]|situad[oa])\s+(?:no|na|em|nos|nas)\s+(.+)$/i.exec(L);
  if(fi){ L = limpa(fi[1]); if(!E) E = limpa(fi[2]); }
  var prof = P ? curta(frase(P)) : "";
  if(aut) prof = prof ? prof+" · Autônoma" : "Autônoma";
  return {prof:prof, local:titulo(L), end:enderecoDe(E)};
}

var TIPO = {r:"Rua", "r.":"Rua", av:"Avenida", "av.":"Avenida", rod:"Rodovia", "rod.":"Rodovia", tv:"Travessa", "tv.":"Travessa", al:"Alameda", "al.":"Alameda", est:"Estrada", "est.":"Estrada", pc:"Praça", "pç":"Praça", "pç.":"Praça"};
// Endereço: tipo da via por extenso (R. -> Rua), vírgula antes do número, letra de nome próprio, sem " - PR" (o estado não muda nada aqui)
function enderecoDe(v){
  var s = limpa(v); if(!s) return "";
  s = s.replace(/\s*[-–—,]\s*PR\b/gi, "").replace(/\bn[º°o]?\.?\s+(?=\d)/gi, "");
  s = s.split(" ").map(function(w, i){ var k = w.toLowerCase().replace(/,$/, ""); return i===0 && TIPO[k] ? TIPO[k]+(/,$/.test(w) ? "," : "") : w; }).join(" ");
  s = s.replace(/\s+,/g, ",").replace(/,(?=\S)/g, ", ").replace(/\bs\/\s*n[úu]mero\b|\bsem n[úu]mero\b/gi, "s/nº")
    .replace(/\bprof\.?(?=\s+[A-ZÀ-Úa-zà-ú])/gi, "Professor").replace(/\bdep\.?(?=\s+[A-ZÀ-Úa-zà-ú])/gi, "Deputado").replace(/\beng\.?(?=\s+[A-ZÀ-Úa-zà-ú])/gi, "Engenheiro");
  // vírgula antes do número da casa ("Rua Henrique Mehl 373" -> "Rua Henrique Mehl, 373"); "Rua 402, 1513" fica como está
  s = s.replace(/^([^,\d]*[A-Za-zÀ-ú])\s+(\d+[A-Za-z]?)\b/, function(m, a, n){ return /^(rua|avenida|rodovia|travessa|alameda|estrada|pra[cç]a)$/i.test(a.trim()) ? m : a+", "+n; });
  return titulo(s).replace(/\bNº\b/g, "nº").replace(/S\/Nº/g, "s/nº").replace(/(\w)-\s/g, "$1 - ");
}

// Telefone de contato só com dígitos, com o 9 na frente do número do celular (Marcus, 26/11/2026: "falta um 9 na frente do numero").
// 10 dígitos (DDD + 8) e o número começa com 6 a 9 = celular antigo: entra o 9 depois do DDD. Tira o 0 do começo e o 55 do país.
// Fixo (começa com 2 a 5) fica como está. Número do exterior (+) não muda.
function foneContato(v){
  var t = String(v == null ? "" : v).trim();
  if(!t) return "";
  if(t.charAt(0)==="+") return "+" + t.replace(/D/g, "");
  var d = t.replace(/D/g, "").replace(/^0+/, "");
  if((d.length===12 || d.length===13) && d.slice(0, 2)==="55") d = d.slice(2);
  if(d.length===10 && /[6-9]/.test(d.charAt(2))) d = d.slice(0, 2) + "9" + d.slice(2);
  return d;
}
// Só o primeiro nome (o app da representante recebe o primeiro nome do contato de referência).
function primeiroNome(v){ var t = titulo(String(v || "").trim()); return t.split(/s+/)[0] || ""; }
export { titulo, frase, trabalhoDe, enderecoDe, limpa, foneContato, primeiroNome };

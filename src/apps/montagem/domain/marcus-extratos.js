// Sorelly Admin · montagem — domain/marcus-extratos.js
// Sistema pessoal do Marcus → Extratos (22/10/2026). Lê o CSV do extrato do banco (por ora o da Nubank: Data, Valor, Identificador, Descrição),
// separa ENTRADAS e SAÍDAS, junta tudo por pessoa/estabelecimento e soma (ex.: quanto foi enviado a cada pessoa no mês).
// Os extratos ficam SÓ neste navegador (localStorage), nunca no GitHub nem no Admin da empresa. Subir o mesmo mês de novo substitui (sem duplicar).
var CHAVE = "marcus_extratos_v1";
// extratos que já vieram do Marcus (arquivo local, gitignored): entram sozinhos; um mês só é preenchido se ainda não existir
var SEMENTE = (function(){ try { var m = import.meta.glob("./marcus-extratos.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var norm = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim(); };
// quem é família/próprio e quem é a empresa (entradas): a lista dá para ajustar na tela
var FAMILIA_PADRAO = ["ANAMARIA HESS", "ANA BEATRIZ HESS", "MARCO ANTONIO DE OLIVEIRA", "MARCUS VINICIUS HESS", "NICKOLAS GABRIEL"], EMPRESA_PADRAO = ["SORELLY COMERCIO"];

function carregar(){ var o = null; try{ o = JSON.parse(localStorage.getItem(CHAVE)||"null"); }catch(x){} if(!o || !o.meses) o = {meses:{}, familia:FAMILIA_PADRAO, empresa:EMPRESA_PADRAO};
  if(SEMENTE && SEMENTE.nubank){ var mudou = false; SEMENTE.nubank.forEach(function(csv){ var r = lerCsvNubank(csv), por = {}; r.linhas.forEach(function(l){ (por[l.d.slice(0, 7)] = por[l.d.slice(0, 7)]||[]).push(l); });
    Object.keys(por).forEach(function(m){ o.meses[m] = o.meses[m] || {}; if(!o.meses[m].Nubank){ o.meses[m].Nubank = por[m]; mudou = true; } }); }); if(mudou) salvar(o); }
  return o; }
function salvar(o){ try{ localStorage.setItem(CHAVE, JSON.stringify(o)); return true; }catch(x){ return false; } }

// Nome Organizado: primeira letra maiúscula em cada palavra (de, da, do, dos, das, e ficam minúsculas); siglas como H&O e LTDA ficam como estão
var titulo = function(s){ return String(s||"").toLowerCase().replace(/(^|[\s\-\/(])([a-zà-ú])/g, function(_, a, b){ return a+b.toUpperCase(); }).replace(/\b(De|Da|Do|Dos|Das|E)\b/g, function(w, x, i){ return i===0 ? w : w.toLowerCase(); }).replace(/\bLtda\b/, "Ltda").replace(/\bH&o\b/, "H&O").replace(/\bMei\b/, "MEI").replace(/\bS A\b/i, "S/A").replace(/\bTim\b/, "TIM"); };
// tira do nome o que o banco acrescenta: "(Transferência enviada)" e o CNPJ/CPF que vem na frente (ex.: "66.657.839 JESSICA ...")
var limpa = function(n){ return String(n||"").replace(/\s*\((Transfer[êe]ncia|Pix)[^)]*\)\s*$/i, "").replace(/^\d[\d.\/\-]{5,}\s+(?=\D)/, "").replace(/\s+/g, " ").trim(); };
// tipo e nome de cada linha do extrato
function classificar(v, desc){
  var d = String(desc||""), nome = function(){ var m = d.match(/ - (.+?) - [•\d.\-*]+ - /) || d.match(/ - (.+?) - [•\d.\-*]/) || d.match(/ - (.+)$/); return m ? titulo(limpa(m[1])) : ""; };
  if(v>0){
    if(/Transfer[êe]ncia [Rr]ecebida/.test(d)) return {t:"recebido", n:nome()};
    if(/Estorno/i.test(d)) return {t:"estorno", n:"Estornos"};
    if(/cart[ãa]o de cr[ée]dito/i.test(d)) return {t:"cartao_adicionado", n:"Dinheiro adicionado por cartão de crédito"};
    return {t:"outra_entrada", n:d.split(" - ")[0].slice(0, 50)};
  }
  if(/Transfer[êe]ncia enviada pelo Pix/i.test(d)) return {t:"pix_enviado", n:nome()};
  if(/Compra no d[ée]bito/i.test(d)) return {t:"compra", n:titulo((d.match(/Compra no d[ée]bito(?: via NuPay)? - (.+)$/) || [])[1] || "Compra no débito")};
  if(/Pagamento de boleto/i.test(d)) return {t:"boleto", n:titulo((d.match(/boleto efetuado - (.+)$/i) || [])[1] || "Boleto")};
  if(/Pagamento de fatura/i.test(d)) return {t:"fatura", n:"Fatura do cartão"};
  if(/empr[ée]stimo/i.test(d)) return {t:"emprestimo", n:"Empréstimo"};
  return {t:"outra_saida", n:titulo(d.split(" - ")[0].slice(0, 50))};
}

// lê o CSV da Nubank e devolve {linhas:[{id,d,v,t,n,x}], erro}
function lerCsvNubank(texto){
  var ls = String(texto||"").replace(/^﻿/, "").split(/\r?\n/).filter(Boolean);
  if(!ls.length || !/^Data,Valor,Identificador,Descri/i.test(ls[0])) return {linhas:[], erro:"Não reconheci o formato. Por enquanto leio o CSV da Nubank (Data, Valor, Identificador, Descrição)."};
  var out = [];
  ls.slice(1).forEach(function(l){ var m = l.match(/^(\d\d)\/(\d\d)\/(\d{4}),(-?[\d.]+),([^,]*),(.*)$/); if(!m) return; var v = Number(m[4]), c = classificar(v, m[6]);
    out.push({id:m[5], d:m[3]+"-"+m[2]+"-"+m[1], v:v, t:c.t, n:c.n, x:m[6].slice(0, 90)}); });
  return {linhas:out, erro:out.length ? "" : "O arquivo não tem lançamentos."};
}

// guarda as linhas: cada mês que veio no arquivo substitui o mês que já existia daquele banco
function incluir(o, banco, linhas){
  var porMes = {}; linhas.forEach(function(l){ var m = l.d.slice(0, 7); (porMes[m] = porMes[m]||[]).push(l); });
  Object.keys(porMes).forEach(function(m){ o.meses[m] = o.meses[m] || {}; o.meses[m][banco] = porMes[m]; });
  return Object.keys(porMes).sort();
}

// agrupa linhas por nome: {nome: {v, n, itens:[...]}} ordenado do maior para o menor
function agrupar(linhas){ var g = {}; linhas.forEach(function(l){ var k = norm(l.n)||"SEM NOME", a = g[k] = g[k] || {nome:l.n||"Sem nome", v:0, n:0, itens:[]}; a.v = r2(a.v+l.v); a.n++; a.itens.push(l); });
  return Object.keys(g).map(function(k){ return g[k]; }).sort(function(a, b){ return Math.abs(b.v)-Math.abs(a.v); }); }

function ehDe(lista, nome){ var n = norm(nome); return lista.some(function(f){ return n.indexOf(norm(f))>=0; }); }

export { FAMILIA_PADRAO, EMPRESA_PADRAO, agrupar, carregar, classificar, ehDe, incluir, lerCsvNubank, norm, r2, salvar };

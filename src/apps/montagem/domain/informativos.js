// Sorelly Admin · montagem — domain/informativos.js
// Folders e informativos do app da REVENDEDORA e do app da REPRESENTANTE (folder virtual, no lugar do papel).
// Estado s.inf = {v, seq, lista:[informativo], vistas:[{id, quem, publico, tipo, em}]}.
// Informativo = {id, titulo, publico:["revendedora","representante"], ativo, inicio, fim, limite:{dia, semana, mes}, abas:[{id, nome, blocos:[bloco]}]}.
// Bloco = {id, tipo:"faixas"|"linhas"|"texto", titulo, valor, texto, linhas:[{a, b}], aberto}.
//   · "faixas" = tabela de comissão e brindes LIDA das regras vigentes (Configurador): muda sozinha quando a regra muda.
//   · "linhas" = rótulo e valor (ex.: 1ª vez / −5% comissão). "texto" = só o texto. Todos são editados em Kits → Folders e informativos.
// Aparição: ao abrir o app, o folder sobe por cima da tela no máximo `limite.dia` vez(es) por dia, `limite.semana` por semana e `limite.mes` por mês, por pessoa.
// "Entendi" e a abertura pela tela Informativos ficam registrados em `vistas` (alimenta os números da tela do admin).
import { FAIXAS_OFICIAIS, REMARCACAO, FATOR_BRINDE_PAGAMENTO, TAXA_BAIXA_VENDA } from "@/apps/montagem/domain/consignado";
import { agoraSP, hojeSP } from "@/apps/montagem/domain/cadastro-leads";
import { BKC } from "@/apps/montagem/lib/format";

var PUBLICOS = [["revendedora","Revendedoras"], ["representante","Representantes"]];
var LIMITE_PADRAO = {dia:1, semana:2, mes:8};
var VISTAS_MAX = 3000;

function clone(x){ return JSON.parse(JSON.stringify(x)); }
function proximoId(s, prefixo){ s.seq = (s.seq||0)+1; return prefixo+s.seq; }
function idNovo(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
function pct(n){ return String(n).replace(".", ",")+"%"; }

function blocoNovo(s, d){
  return Object.assign({id:proximoId(s, "b"), tipo:"texto", titulo:"Novo bloco", valor:"", texto:"", linhas:[], aberto:false}, d||{});
}
function abaNova(s, nome, blocos){ return {id:proximoId(s, "a"), nome:nome, blocos:blocos||[]}; }

// ---------- folder inicial: regras do acerto (aprovado pelo Marcus em 23/10/2026) ----------
function folderRegras(s){
  var rem = REMARCACAO.map(function(r, i){ return {a:i===0 ? "1ª vez" : i===1 ? "2ª vez" : "3ª vez ou mais", b:"−"+r.comissaoPct+"% comissão · "+(r.brindePct>=100 ? "sem brinde" : "−"+r.brindePct+"% brinde")}; });
  var pag = FATOR_BRINDE_PAGAMENTO.map(function(f, i, t){ var antes = i ? t[i-1].max : null; return {a:f.max===0 ? "Pagou tudo" : (antes ? "Faltou de "+antes+"% a "+f.max+"%" : "Faltou até "+f.max+"%"), b:Math.round(f.fator*100)+"% do brinde"}; });
  var ultimo = FATOR_BRINDE_PAGAMENTO[FATOR_BRINDE_PAGAMENTO.length-1];
  pag.push({a:"Faltou mais de "+ultimo.max+"%", b:"sem brinde"});
  var taxa = BKC((TAXA_BAIXA_VENDA[0]||{taxa:35}).taxa);
  return {id:proximoId(s, "i"), titulo:"Regras do acerto", publico:["revendedora","representante"], ativo:true, inicio:"", fim:"", limite:clone(LIMITE_PADRAO),
    abas:[
      abaNova(s, "Comissões", [blocoNovo(s, {tipo:"faixas", titulo:"Comissão e brindes"})]),
      abaNova(s, "Regras", [
        blocoNovo(s, {tipo:"linhas", titulo:"Venda mínima", linhas:[{a:"Acerto com a representante", b:BKC(500)}, {a:"Acerto na Sorelly", b:BKC(700)}]}),
        blocoNovo(s, {titulo:"Taxa de deslocamento", valor:taxa, texto:"Vendeu menos de R$ 300? Paga a taxa, somada no acerto."}),
        blocoNovo(s, {titulo:"Cancelar o kit", valor:taxa, texto:"Quer cancelar o kit e vendeu menos de R$ 300? Não importa: paga a taxa do mesmo jeito."}),
        blocoNovo(s, {tipo:"linhas", titulo:"Remarcação do acerto", linhas:rem, texto:"Motivo justificado não conta. A contagem recomeça a cada kit novo."}),
        blocoNovo(s, {tipo:"linhas", titulo:"Falta de pagamento", linhas:pag}),
        blocoNovo(s, {titulo:"Kit novo", texto:"Liberado com pelo menos 80% do acerto pago."})])]};
}

// informativo em branco para o editor do admin (ids únicos por data/sorteio; só entra na lista quando salvar)
function informativoNovo(){
  return {id:idNovo("i"), titulo:"Novo informativo", publico:["revendedora","representante"], ativo:false, inicio:"", fim:"", limite:clone(LIMITE_PADRAO),
    abas:[{id:idNovo("a"), nome:"Geral", blocos:[{id:idNovo("b"), tipo:"texto", titulo:"Primeiro bloco", valor:"", texto:"", linhas:[], aberto:false}]}]};
}
function infDemo(){
  var s = {v:1, seq:0, lista:[], vistas:[]};
  s.lista.push(folderRegras(s));
  return s;
}
function infMigrar(inf){
  if(!inf || !Array.isArray(inf.lista)) return infDemo();
  if(!Array.isArray(inf.vistas)) inf.vistas = [];
  if(!inf.seq) inf.seq = 0;
  inf.lista.forEach(function(i){ if(!i.limite) i.limite = clone(LIMITE_PADRAO); if(!i.publico) i.publico = ["revendedora","representante"]; if(!i.abas) i.abas = []; });
  inf.v = 1; return inf;
}

// ---------- consultas ----------
function dentroDoPeriodo(i, hoje){ return (!i.inicio || hoje>=i.inicio) && (!i.fim || hoje<=i.fim); }
function infDoPublico(s, publico, hoje){
  hoje = hoje || hojeSP();
  return ((s.inf && s.inf.lista) || []).filter(function(i){ return i.ativo && i.publico.indexOf(publico)>=0 && dentroDoPeriodo(i, hoje); });
}
function dias(a, b){ return Math.round((Date.UTC(+b.slice(0,4), +b.slice(5,7)-1, +b.slice(8,10))-Date.UTC(+a.slice(0,4), +a.slice(5,7)-1, +a.slice(8,10)))/86400000); }
// quantas vezes o folder JÁ SUBIU sozinho para a pessoa: hoje, nos últimos 7 dias e neste mês
function infContagem(s, id, quem, agora){
  agora = agora || agoraSP(); var hoje = agora.slice(0,10), mes = agora.slice(0,7), r = {dia:0, semana:0, mes:0};
  ((s.inf && s.inf.vistas) || []).forEach(function(v){
    if(v.id!==id || v.quem!==quem || v.tipo!=="popup") return;
    var d = v.em.slice(0,10);
    if(d===hoje) r.dia++;
    if(dias(d, hoje)>=0 && dias(d, hoje)<7) r.semana++;
    if(v.em.slice(0,7)===mes) r.mes++; });
  return r;
}
function dentroDoLimite(i, c){
  var l = i.limite || {};
  return (l.dia==null || l.dia==="" || c.dia<l.dia) && (l.semana==null || l.semana==="" || c.semana<l.semana) && (l.mes==null || l.mes==="" || c.mes<l.mes);
}
// o folder que deve subir agora ao abrir o app (ou null)
function infParaAbrir(s, publico, quem, agora){
  agora = agora || agoraSP();
  return infDoPublico(s, publico, agora.slice(0,10)).find(function(i){ return dentroDoLimite(i, infContagem(s, i.id, quem, agora)); }) || null;
}
// quantos informativos ela ainda não abriu
function infNaoLidos(s, publico, quem){
  var vistas = (s.inf && s.inf.vistas) || [];
  return infDoPublico(s, publico).filter(function(i){ return !vistas.some(function(v){ return v.id===i.id && v.quem===quem && (v.tipo==="aberto" || v.tipo==="entendi"); }); }).length;
}
function infLido(s, id, quem){ return ((s.inf && s.inf.vistas) || []).some(function(v){ return v.id===id && v.quem===quem && (v.tipo==="aberto" || v.tipo==="entendi"); }); }
// números do admin: subidas, pessoas que viram e pessoas que tocaram em "Entendi"
function infEstatistica(s, id){
  var r = {subidas:0, viram:{}, entenderam:{}};
  ((s.inf && s.inf.vistas) || []).forEach(function(v){ if(v.id!==id) return;
    if(v.tipo==="popup") r.subidas++;
    r.viram[v.quem] = 1; if(v.tipo==="entendi") r.entenderam[v.quem] = 1; });
  return {subidas:r.subidas, viram:Object.keys(r.viram).length, entenderam:Object.keys(r.entenderam).length};
}

// ---------- tabela de comissão e brindes lida das regras vigentes ----------
function linhasFaixas(faixas){
  var lista = faixas.slice().sort(function(a, b){ return a.min-b.min; });
  return lista.map(function(f, i){
    var prox = lista[i+1], inteiro = function(n){ return Math.round(n).toLocaleString("pt-BR"); };
    return {venda:prox ? "R$ "+inteiro(f.min)+" a "+inteiro(prox.min-1) : "R$ "+inteiro(f.min)+" ou mais", comissao:pct(f.pct), normal:f.bn>0 ? "R$ "+inteiro(f.bn) : null, select:f.bb>0 ? "R$ "+inteiro(f.bb) : null};
  });
}

// ---------- ações (admin e apps) ----------
function infReduz(s, a){
  var inf = clone(s.inf), agora = a.agora || agoraSP();
  var com = function(msg){ return {patch:{inf:inf}, msg:msg}; };
  var achar = function(id){ return inf.lista.findIndex(function(i){ return i.id===id; }); };
  if(a.op==="salvar"){
    var i = achar(a.item.id); if(i<0) inf.lista.push(a.item); else inf.lista[i] = a.item;   // não achou = informativo novo
    return com("Informativo salvo.");
  }
  if(a.op==="excluir"){ inf.lista = inf.lista.filter(function(x){ return x.id!==a.id; }); inf.vistas = inf.vistas.filter(function(v){ return v.id!==a.id; }); return com("Informativo excluído."); }
  if(a.op==="ativo"){ var j = achar(a.id); if(j<0) return {patch:{}, msg:null}; inf.lista[j].ativo = !inf.lista[j].ativo; return com(inf.lista[j].ativo ? "Informativo publicado." : "Informativo pausado."); }
  if(a.op==="visto"){
    var ult = inf.vistas.slice(-8).some(function(v){ return v.id===a.id && v.quem===a.quem && v.tipo===a.tipo && Math.abs(Date.parse(agora)-Date.parse(v.em))<60000; });
    if(ult) return {patch:{}, msg:null};   // mesma ação repetida em menos de 1 minuto (tela que remonta): conta uma vez só
    inf.vistas.push({id:a.id, quem:a.quem, publico:a.publico, tipo:a.tipo, em:agora});
    if(inf.vistas.length>VISTAS_MAX) inf.vistas = inf.vistas.slice(-VISTAS_MAX);
    return com(null);
  }
  return {patch:{}, msg:null};
}

export { informativoNovo, PUBLICOS, LIMITE_PADRAO, infDemo, infMigrar, infReduz, infDoPublico, infContagem, infParaAbrir, infNaoLidos, infLido, infEstatistica, linhasFaixas, blocoNovo, abaNova, proximoId, idNovo, hojeSP, agoraSP };

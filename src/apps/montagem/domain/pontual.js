// Sorelly Admin · montagem — domain/pontual.js
// PONTUAL (06/11/2026, pedido do Marcus): admin da Pontual, empresa de banho (galvanoplastia) do Valdir, que atende a Sorelly. O Valdir usa o sistema ABAS, que libera uma API.
// Por enquanto TUDO é DEMONSTRAÇÃO: 250 clientes e preços INVENTADOS (nomes e telefones falsos), gerados sempre iguais (semente fixa). O Valdir não tem acesso; depois o sistema vai para outro lugar
// e os clientes reais entram pela API do ABAS no lugar de gerarClientes().
// O que o Valdir pediu: separar clientes (grande, médio, pequeno), maior inadimplência, negociação particular por cliente, cliente 2 meses sem banhar (pós-venda),
// tabela de preço inicial + tabela individual por cliente.
// Cortes das classes e dias de alerta são SUPOSIÇÃO (o Valdir define); ficam aqui em CORTES e DIAS_*, e a tela Regras os mostra.
// O que o usuário muda (preço da tabela inicial, tabela do cliente, negociação, status do pós-venda e da cobrança) fica só neste navegador (localStorage "sorelly_pontual_v1").
import { useEffect, useMemo, useState } from "@/shared/react";

var CHAVE = "sorelly_pontual_v1";
var SERVICOS = [
  {id:"ouro", nome:"Ouro 18k", preco:2.4}, {id:"rose", nome:"Ouro rosé", preco:2.6}, {id:"rodio", nome:"Ródio branco", preco:1.9},
  {id:"negro", nome:"Ródio negro", preco:2.3}, {id:"prata", nome:"Prata", preco:1.6}, {id:"verniz", nome:"Verniz", preco:0.4}
];   // preço por grama banhada, em reais (valores inventados)
var CORTES = {grande:8000, medio:2500};   // média mensal dos últimos 6 meses
var DIAS_RISCO = 30, DIAS_SEM = 60;       // dias sem banhar: em risco a partir de 30, entra no pós-venda a partir de 60
var STATUS_POS = ["A contatar", "Contatado", "Voltou", "Perdido"];
var STATUS_COB = ["A cobrar", "Cobrado", "Prometeu pagar", "Negociando"];
var CONDICOES = ["À vista", "15 dias", "30 dias", "15/30 dias", "30/60 dias"];

var classeDe = function(media){ return media >= CORTES.grande ? "Grande" : media >= CORTES.medio ? "Médio" : "Pequeno"; };
var situacaoDe = function(dias){ return dias >= DIAS_SEM ? "Sem banhar" : dias >= DIAS_RISCO ? "Em risco" : "Em dia"; };

// gerador de números sempre igual (mulberry32)
function rng(semente){
  var a = semente >>> 0;
  return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

var PRE = ["Bella", "Ouro", "Luna", "Maria", "Dona", "Brilho", "Aurora", "Joia", "Pérola", "Estrela", "Mix", "Charme", "Glamour", "Real", "Nobre", "Divina", "Encanto", "Vitória", "Sol", "Cristal", "Magia", "Fina", "Luxo", "Rosa", "Alma"];
var SUF = ["Semijoias", "Acessórios", "Bijuterias", "Folheados", "Joias", "Design", "Atelier", "Modas", "Bijoux", "Joalheria"];
var NOMES = ["Ana", "Carlos", "Marta", "João", "Paula", "Rafael", "Luciana", "Pedro", "Sandra", "Bruno", "Camila", "Roberto", "Fernanda", "Tiago", "Patrícia", "Marcelo"];
var SOBRES = ["Silva", "Souza", "Lima", "Costa", "Pereira", "Alves", "Rocha", "Martins"];
var CIDADES = [["Limeira", "SP", "19"], ["Guaporé", "RS", "54"], ["Rio Claro", "SP", "19"], ["Curitiba", "PR", "41"], ["Belo Horizonte", "MG", "31"], ["Goiânia", "GO", "62"],
  ["Birigui", "SP", "18"], ["São José dos Pinhais", "PR", "41"], ["Juiz de Fora", "MG", "32"], ["Fortaleza", "CE", "85"], ["Salvador", "BA", "71"], ["Porto Alegre", "RS", "51"],
  ["Campinas", "SP", "19"], ["Nova Friburgo", "RJ", "22"]];
var NOTAS = [
  function(p, c){ return "Desconto de " + p + "% combinado pelo volume mensal. Pagamento em " + c + "."; },
  function(p, c){ return "Preço fixo por 12 meses, com " + p + "% abaixo da tabela inicial. Prazo de " + c + "."; },
  function(p, c){ return "Acordo particular com o Valdir: " + p + "% de desconto e prazo de " + c + ". Reajuste só em janeiro."; },
  function(p, c){ return "Tabela própria desde a entrada do cliente (" + p + "% abaixo da inicial). Prazo de " + c + "."; }
];

var base = null;
function gerarClientes(){
  var r = rng(20261106), pick = function(l){ return l[Math.floor(r() * l.length)]; }, inteiro = function(n){ return Math.floor(r() * n); };
  var normal = function(){ return Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r()); };
  var combos = [], i, j, t;
  PRE.forEach(function(p){ SUF.forEach(function(s){ combos.push(p + " " + s); }); });
  for(i = combos.length - 1; i > 0; i--){ j = Math.floor(r() * (i + 1)); t = combos[i]; combos[i] = combos[j]; combos[j] = t; }
  var lista = [];
  for(i = 0; i < 250; i++){
    var mediaBase = Math.min(45000, Math.max(300, Math.exp(normal() * 0.9) * 3200));
    var ciclo0 = mediaBase >= CORTES.grande ? 7 + inteiro(8) : mediaBase >= CORTES.medio ? 10 + inteiro(16) : 15 + inteiro(31);
    var x = r(), dias = x < 0.12 ? 60 + inteiro(90) : x < 0.25 ? 30 + inteiro(30) : 1 + inteiro(Math.round(Math.min(ciclo0 * 1.2, 28)));
    var meses = [0, 1, 2, 3, 4, 5].map(function(){ return Math.round(mediaBase * (0.8 + r() * 0.4) / 10) * 10; });
    if(dias >= DIAS_SEM){ meses[5] = 0; meses[4] = dias >= 90 ? 0 : Math.round(meses[4] * 0.4 / 10) * 10; }
    var media = Math.round(meses.reduce(function(a, b){ return a + b; }, 0) / 6 / 10) * 10, classe = classeDe(media);
    var temVencido = r() < 0.24, atraso = temVencido ? 3 + Math.floor(r() * r() * 118) : 0;
    var vencido = temVencido ? Math.round(media * (0.3 + r() * 1.6) / 10) * 10 : 0;
    var aVencer = r() < 0.6 ? Math.round(media * (0.2 + r()) / 10) * 10 : 0;
    var cid = pick(CIDADES), cond = pick(CONDICOES), contato = pick(NOMES) + " " + pick(SOBRES);
    var probInd = classe === "Grande" ? 0.9 : classe === "Médio" ? 0.55 : 0.15, individual = r() < probInd;
    var descMax = classe === "Grande" ? 8 + r() * 7 : classe === "Médio" ? 4 + r() * 5 : 2 + r() * 3;
    var precosInd = null, nota = "";
    if(individual){
      precosInd = {};
      SERVICOS.forEach(function(s){ precosInd[s.id] = Math.round(s.preco * (1 - descMax / 100 * (0.8 + r() * 0.4)) * 100) / 100; });
      nota = NOTAS[inteiro(NOTAS.length)](Math.round(descMax), cond);
    }
    lista.push({id:"C" + String(i + 1).padStart(3, "0"), nome:combos[i], cidade:cid[0] + " " + cid[1], contato:contato,
      fone:"(" + cid[2] + ") 90000-" + String((i * 37 + 1234) % 10000).padStart(4, "0"), desde:2018 + inteiro(8), cond:cond, media:media, meses:meses, ciclo:ciclo0,
      dias:dias, vencido:vencido, maiorAtraso:atraso, titulos:temVencido ? 1 + inteiro(3) : 0, aVencer:aVencer, modoBase:individual ? "Individual" : "Inicial", precosInd:precosInd, notaBase:nota});
  }
  return lista;
}

// edições do usuário (guardadas no navegador)
var ed = null, ouvintes = [];
function carrega(){
  if(ed) return ed;
  try{ var t = JSON.parse(localStorage.getItem(CHAVE) || "null"); if(t && t.inicial) ed = t; }catch(x){ ed = null; }
  if(!ed) ed = {inicial:{}, modo:{}, precos:{}, nota:{}, pos:{}, cob:{}};
  return ed;
}
function grava(){
  try{ localStorage.setItem(CHAVE, JSON.stringify(ed)); }catch(x){ /* sem armazenamento: a tela segue funcionando */ }
  ouvintes.forEach(function(f){ f(function(v){ return v + 1; }); });
}

var inicialAtual = function(){ var o = {}; SERVICOS.forEach(function(s){ o[s.id] = carrega().inicial[s.id] !== undefined ? carrega().inicial[s.id] : s.preco; }); return o; };
var ACOES = {
  setInicial:function(sid, v){ carrega().inicial[sid] = v; grava(); },
  setModo:function(id, modo){
    var d = carrega(), c = base.filter(function(k){ return k.id === id; })[0];
    d.modo[id] = modo;
    if(modo === "Individual" && !d.precos[id]) d.precos[id] = Object.assign({}, c.precosInd || inicialAtual());   // nasce igual à tabela inicial de hoje
    grava();
  },
  setPreco:function(id, sid, v){ var d = carrega(); if(!d.precos[id]) d.precos[id] = Object.assign({}, inicialAtual()); d.precos[id][sid] = v; grava(); },
  setNota:function(id, v){ carrega().nota[id] = v; grava(); },
  setPos:function(id, v){ carrega().pos[id] = v; grava(); },
  setCob:function(id, v){ carrega().cob[id] = v; grava(); }
};

// Hook das telas: devolve os clientes já com classe, situação, tabela de preço e edições aplicadas.
function usePontual(){
  var s = useState(0), versao = s[0], setV = s[1];
  useEffect(function(){ ouvintes.push(setV); return function(){ ouvintes = ouvintes.filter(function(f){ return f !== setV; }); }; }, [setV]);
  return useMemo(function(){
    if(!base) base = gerarClientes();
    var d = carrega(), ini = inicialAtual();
    var clientes = base.map(function(c){
      var modo = d.modo[c.id] || c.modoBase, precos = modo === "Individual" ? (d.precos[c.id] || c.precosInd || ini) : ini;
      var desc = modo === "Individual" ? SERVICOS.reduce(function(t, sv){ return t + (1 - precos[sv.id] / ini[sv.id]) * 100; }, 0) / SERVICOS.length : 0;
      return Object.assign({}, c, {modo:modo, precos:precos, desconto:Math.round(desc * 10) / 10, nota:d.nota[c.id] !== undefined ? d.nota[c.id] : c.notaBase,
        pos:d.pos[c.id] || "A contatar", cob:d.cob[c.id] || "A cobrar", classe:classeDe(c.media), situacao:situacaoDe(c.dias)});
    });
    return {clientes:clientes, inicial:ini, acoes:ACOES};
  }, [versao]);   // eslint-disable-line react-hooks/exhaustive-deps
}

var dataBr = function(diasAtras){ var d = new Date(); d.setDate(d.getDate() - diasAtras); return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear(); };
var MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
// os 6 últimos meses fechados, do mais antigo para o mais novo
function rotulosMeses(){
  var h = new Date(), r = [];
  for(var k = 6; k >= 1; k--){ var d = new Date(h.getFullYear(), h.getMonth() - k, 1); r.push(MESES[d.getMonth()] + " " + d.getFullYear()); }
  return r;
}
var mensagemPos = function(c){
  return "Olá, " + c.contato.split(" ")[0] + "! Aqui é da Pontual. Notamos que a " + c.nome + " não banha com a gente há " + c.dias + " dias. Aconteceu algo? Podemos ajudar com prazo, preço ou qualquer outro ponto. Estamos à disposição.";
};

export { SERVICOS, CORTES, DIAS_RISCO, DIAS_SEM, STATUS_POS, STATUS_COB, usePontual, classeDe, situacaoDe, dataBr, rotulosMeses, mensagemPos };

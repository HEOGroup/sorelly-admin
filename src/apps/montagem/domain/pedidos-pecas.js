// Sorelly Admin · montagem — domain/pedidos-pecas.js
// Pedidos de peças da produção ao Cadastro de peças (23/10/2026). Origem: "Pedido Diário — Montagem → Cadastro" (HTML do primo do Marcus).
// Quem pede: Deysiane, Milene (aba "Pedir peças" em Kits) e as montadoras (app da montadora). Quem responde: Rayssa e Graziella (aba "Solicitações" do Cadastro de peças).
// Pedido = tipo (lista) + banho + público + quantos modelos + urgência + texto livre. Cadastro responde: OK (vai produzir) → Pronto, ou "Não temos" (com motivo curto).
// Quem pediu recebe aviso (alerta com som + marca na tela) em OK, Pronto e Não temos. Fornecedor NÃO entra. Estado s.pp (só neste navegador).
import { CONFIG_PADRAO, podeFazer } from "./cadastro-pecas";
import { hojeSP } from "./cadastro-leads";
import { CADASTRO_PECAS } from "./equipe";

var TIPOS_PECA = ["Anéis", "Brincos", "Colares", "Colar de letras", "Conjuntos", "Pulseiras", "Tornozeleiras", "Pingentes", "Choker", "Piercing", "Outro"];
var BANHOS = [["ouro", "Ouro 18k"], ["prata", "Prata / Ródio"], ["tanto", "Tanto faz"]];
var PUBLICOS = [["fem", "Feminino"], ["inf", "Infantil"], ["masc", "Masculino"]];
var MODELOS = [1, 2, 3, 5, 10];
var URGENCIAS = [["critico", "Crítico"], ["alta", "Alta"], ["normal", "Normal"]];
var RANK = {critico:0, alta:1, normal:2};
var STATUS = {aberto:"Pedido", ok:"Vai produzir", pronto:"Pronto", sem:"Não temos"};
var ATIV = "pedidos_producao";
var QUEM_PADRAO = ["Rayssa", "Graziella"];

var trim = function(v){ return String(v==null ? "" : v).trim(); };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var rot = function(lista, k){ var x = lista.find(function(i){ return i[0]===k; }); return x ? x[1] : ""; };

function novoPp(){ return {seq:0, pedidos:[], historico:[]}; }
function ppDemo(){ return novoPp(); }
function ppMigrar(p){
  if(!p || typeof p!=="object") return novoPp();
  var b = novoPp(); Object.keys(b).forEach(function(k){ if(p[k]===undefined) p[k] = b[k]; });
  return p;
}

// quem responde: diretoria, ou os nomes marcados na atividade "Pedidos da produção" (Cadastro de peças → Configurações)
function podeResponder(s, nome, admin){
  var c = s.cpc || {config:CONFIG_PADRAO};
  var q = c.config && c.config.quem && c.config.quem[ATIV];
  if(!q) return admin || QUEM_PADRAO.some(function(n){ return n.toLowerCase()===trim(nome).split(" ")[0].toLowerCase(); });
  return podeFazer(c, ATIV, nome, admin);
}

// resumo curto do pedido: "Pulseira · Ouro 18k · Infantil · 3 modelos"
function resumoPedido(p){
  var partes = [p.tipo || "Peça", rot(BANHOS, p.banho), rot(PUBLICOS, p.publico), p.modelos ? p.modelos+(p.modelos===1 ? " modelo" : " modelos") : ""];
  return partes.filter(Boolean).join(" · ");
}

// fila do cadastro: críticos primeiro, depois o pedido mais antigo
function filaCadastro(pp, abertos){
  var l = (pp && pp.pedidos || []).filter(function(p){ return abertos ? (p.status==="aberto" || p.status==="ok") : true; });
  return l.slice().sort(function(a, b){ return (RANK[a.urg]-RANK[b.urg]) || (a.ts-b.ts); });
}
// avisos de quem pediu: respostas que ainda não foram vistas
function avisosDe(pp, quemId){
  return (pp && pp.pedidos || []).filter(function(p){ return p.porId===quemId && p.status!=="aberto" && !p.visto; });
}
function contagem(pp){
  var l = (pp && pp.pedidos) || [];
  var n = function(st){ return l.filter(function(p){ return p.status===st; }).length; };
  return {aberto:n("aberto"), ok:n("ok"), pronto:n("pronto"), sem:n("sem"), criticos:l.filter(function(p){ return (p.status==="aberto" || p.status==="ok") && p.urg==="critico"; }).length};
}

function ppReduz(s, a){
  var pp = clone(s.pp || novoPp()), por = a.por || "—", dia = a.dia || hojeSP(), ts = a.ts || Date.now();
  var recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg, extra){ return {patch:Object.assign({pp:pp}, extra||{}), msg:msg}; };
  var log = function(op, nota){ pp.historico.push({em:dia, por:por, op:op, nota:nota||""}); if(pp.historico.length>500) pp.historico = pp.historico.slice(-500); };
  var achar = function(id){ return pp.pedidos.find(function(x){ return x.id===id; }); };
  switch(a.op){
    case "add": {
      var tipo = trim(a.tipo), texto = trim(a.texto);
      if(!tipo && !texto) return recusa("Escolha a peça ou escreva o que precisa.");
      if(TIPOS_PECA.indexOf(tipo)<0 && tipo) return recusa("Tipo de peça inválido.");
      var urg = RANK[a.urg]!=null ? a.urg : "normal", modelos = Math.max(0, Math.min(99, Math.round(Number(a.modelos)||0)));
      pp.seq += 1;
      var ped = {id:"pp"+pp.seq, tipo:tipo, banho:a.banho || "tanto", publico:a.publico || "", modelos:modelos, urg:urg, texto:texto, status:"aberto",
        por:por, porId:a.porId==null ? null : a.porId, origem:a.origem || "admin", em:dia, ts:ts, resposta:"", respondidoPor:"", respondidoEm:"", visto:true};
      pp.pedidos.unshift(ped); log("add", resumoPedido(ped));
      // alerta com som para Rayssa e Graziella (quem pediu não recebe o próprio aviso)
      var para = CADASTRO_PECAS.map(function(x){ return x.id; }).filter(function(i){ return i!==ped.porId; });
      var novo = {alertas:[{id:"AL"+ts+ped.id, tipo:"pedido_peca_novo", chave:"pp-novo-"+ped.id, ref:null, titulo:"Pedido de peça"+(urg==="critico" ? " (crítico)" : ""), texto:ped.por+" pediu: "+resumoPedido(ped)+(ped.texto ? " · "+ped.texto : ""), para:para, aba:"cadpecas", cor:urg==="critico" ? "#EF4444" : "#3B82F6", ts:ts, lidoPor:[]}].concat(s.alertas||[]).slice(0, 200)};
      return ok("Pedido enviado ao cadastro.", novo);
    }
    case "responder": {
      var p = achar(a.id); if(!p) return recusa("Pedido não encontrado.");
      if(!podeResponder(s, por, !!a.admin)) return recusa("Só quem cuida do cadastro de peças responde.");
      if(["ok", "pronto", "sem"].indexOf(a.status)<0) return recusa("Resposta inválida.");
      if(a.status==="ok" && p.status!=="aberto") return recusa("Este pedido já foi respondido.");
      if(a.status==="pronto" && p.status!=="ok" && p.status!=="aberto") return recusa("Este pedido já foi encerrado.");
      if(a.status==="sem" && (p.status==="pronto" || p.status==="sem")) return recusa("Este pedido já foi encerrado.");
      var motivo = trim(a.resposta);
      p.status = a.status; p.respondidoPor = por; p.respondidoEm = dia; p.respondidoTs = ts; p.visto = false;
      if(a.status==="sem") p.resposta = motivo || "Não temos esta peça no momento.";
      else if(motivo) p.resposta = motivo;
      log("responder", resumoPedido(p)+" → "+STATUS[a.status]);
      // alerta com som na tela de quem pediu (mesmo formato do ALERTA_ADD do reducer)
      var extra = {};
      if(p.porId!=null){
        var tx = a.status==="pronto" ? "Pronto. Pode buscar com o cadastro." : a.status==="ok" ? "O cadastro vai produzir." : "O cadastro não tem esta peça.";
        extra.alertas = [{id:"AL"+ts+p.id, tipo:"pedido_peca", chave:"pp-"+p.id+"-"+a.status, ref:p.id, titulo:resumoPedido(p), texto:tx+(a.status==="sem" ? " "+p.resposta : ""), para:[p.porId], aba:null, cor:a.status==="sem" ? "#EF4444" : a.status==="pronto" ? "#22C55E" : "#3B82F6", ts:ts, lidoPor:[]}].concat(s.alertas||[]).slice(0, 200);
      }
      return ok(a.status==="pronto" ? "Marcado como pronto. Quem pediu foi avisado." : a.status==="ok" ? "Marcado: vai produzir. Quem pediu foi avisado." : "Marcado: não temos. Quem pediu foi avisado.", extra);
    }
    case "visto": {
      var v = achar(a.id); if(!v) return recusa("Pedido não encontrado.");
      v.visto = true; return ok("");
    }
    case "visto_todos": {
      pp.pedidos.forEach(function(x){ if(x.porId===a.porId) x.visto = true; }); return ok("");
    }
    case "del": {
      var d = achar(a.id); if(!d) return recusa("Pedido não encontrado.");
      if(!a.admin && !(d.por===por && d.status==="aberto")) return recusa("Só quem pediu apaga, e só antes de o cadastro responder.");
      pp.pedidos = pp.pedidos.filter(function(x){ return x.id!==a.id; }); log("del", resumoPedido(d)); return ok("Pedido removido.");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { TIPOS_PECA, BANHOS, PUBLICOS, MODELOS, URGENCIAS, STATUS, ATIV, QUEM_PADRAO, ppDemo, ppMigrar, ppReduz, podeResponder, resumoPedido, filaCadastro, avisosDe, contagem, rot };

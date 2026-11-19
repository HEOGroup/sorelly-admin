// Sorelly Admin · montagem — domain/prazos-forn.js (17/11/2026, pedido do Marcus)
// Pedidos Banho/Bruto › bloco "Prazos dos fornecedores": no topo uma aba por fornecedor (Pontual, Ellos, Point, Mega Sul...); ao clicar, UMA LINHA POR ETAPA com o prazo em dias (que se muda ali),
// os pedidos que estão naquela etapa e quantos estão atrasados; e a mensagem de cobrança para copiar.
// Etapas de cada aba: fornecedor de BRUTO = Escolha das peças, Em separação, Fechado e Em trânsito (pedidos com `forn` igual ao nome); galvânica (Pontual e Ellos) = Chegou no banho, Enviaram fotos,
// Marcus confirmou preços, Banho e Enviado para Sorelly (pedidos cuja galvânica é aquela). Atrasado = dias na etapa maior que o prazo da linha. Pontual e Ellos ainda têm a linha "Total no banho":
// o prazo de sempre (config.prazoBanho), contado da chegada na galvânica até sair, com o mesmo cálculo que já marca os cartões em vermelho (atrasadoPed).
// Onde ficam os números: config.prazoForn[fornecedor][etapa] = dias. Sem número: Em separação e Fechado valem o prazo geral de antes (config.prazoEtapa); as outras etapas ficam sem prazo (nunca atrasam).
import { ETAPAS_PED, atrasadoPed, banhoPed, diasNaEtapa, diasNaGalvanica, etapaPed, naGalvanica, numPonto, prazoPed } from "@/apps/montagem/domain/cadastro-pecas";

var ETAPAS_BRUTO = ["escolha", "separacao", "fechado", "enviado"];
var ETAPAS_GALV = ["nobanho", "fotos", "precos", "banho", "paraSorelly"];
var GALVANICAS = ["Pontual", "Ellos"];
var FORNS_BASE = ["Point", "Mega Sul", "Art Ello", "Linda", "Xangai"];

function nomeEtapa(k){ var x = ETAPAS_PED.find(function(o){ return o[0]===k; }); return x ? x[1] : k; }
function dBR(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || "")); return m ? m[3]+"/"+m[2]+"/"+m[1] : String(iso || ""); }
function plural(n, a, b){ return n===1 ? a : b; }

// as abas: Pontual e Ellos primeiro, depois os fornecedores de bruto (os da lista base e qualquer outro que apareça nos pedidos em andamento)
function abasPrazos(c){
  var nomes = FORNS_BASE.slice();
  (c.pedidos || []).forEach(function(p){ if(p.forn && nomes.indexOf(p.forn)<0 && ETAPAS_BRUTO.indexOf(etapaPed(p))>=0) nomes.push(p.forn); });
  return GALVANICAS.map(function(g){ return {k:"g:"+g, nome:g, tipo:"banho", galv:g.toLowerCase()}; }).concat(nomes.map(function(f){ return {k:"f:"+f, nome:f, tipo:"bruto"}; }));
}

// prazo (dias) de uma etapa para uma aba: {dias, padrao}. padrao = veio do prazo geral de antes (nada digitado para este fornecedor).
function prazoDaLinha(cfg, aba, etapa){
  var tab = ((cfg || {}).prazoForn || {})[aba.nome], v = tab && typeof tab==="object" ? numPonto(tab[etapa]) : 0;
  if(v>0) return {dias:v, padrao:false};
  var g = numPonto(((cfg || {}).prazoEtapa || {})[etapa]);
  return {dias:aba.tipo==="bruto" && g>0 ? g : 0, padrao:true};
}

function pedidosDaAba(c, aba){
  var lista = aba.tipo==="banho" ? ETAPAS_GALV : ETAPAS_BRUTO;
  return (c.pedidos || []).filter(function(p){ return lista.indexOf(etapaPed(p))>=0 && (aba.tipo==="banho" ? banhoPed(p)===aba.nome : p.forn===aba.nome); });
}

// detalhe de uma aba: {linhas:[{etapa, nome, prazo, padrao, pedidos:[{id, rotulo, dias, atrasado}], atrasados}], total:{prazo, pedidos:[...], atrasados} | null, andando, atrasados}
function detalheAba(c, aba, hoje){
  var cfg = c.config || {}, ps = pedidosDaAba(c, aba), lista = aba.tipo==="banho" ? ETAPAS_GALV : ETAPAS_BRUTO;
  var rot = function(p){ return (p.romaneio ? p.romaneio : "sem número")+(aba.tipo==="banho" && p.forn ? " · "+p.forn : ""); };
  var linhas = lista.map(function(k){
    var pz = prazoDaLinha(cfg, aba, k);
    var pedidos = ps.filter(function(p){ return etapaPed(p)===k; }).map(function(p){ var d = diasNaEtapa(p, hoje); return {id:p.id, rotulo:rot(p), data:p.data, dias:d, prazo:pz.dias, atrasado:pz.dias>0 && d>pz.dias}; });
    return {etapa:k, nome:nomeEtapa(k), prazo:pz.dias, padrao:pz.padrao, pedidos:pedidos, atrasados:pedidos.filter(function(x){ return x.atrasado; }).length};
  });
  var total = null;
  if(aba.tipo==="banho"){
    var emBanho = ps.filter(function(p){ return naGalvanica(p); }), pedidos = emBanho.map(function(p){ var pz = prazoPed(cfg, p); return {id:p.id, rotulo:rot(p), dias:diasNaGalvanica(p, hoje), prazo:pz, atrasado:atrasadoPed(p, hoje, cfg)}; });
    total = {prazo:numPonto((cfg.prazoBanho || {})[aba.galv]), pedidos:pedidos, atrasados:pedidos.filter(function(x){ return x.atrasado; }).length};
  }
  var ids = {}; linhas.forEach(function(l){ l.pedidos.forEach(function(x){ if(x.atrasado) ids[x.id] = 1; }); }); if(total) total.pedidos.forEach(function(x){ if(x.atrasado) ids[x.id] = 1; });
  return {linhas:linhas, total:total, andando:ps.length, atrasados:Object.keys(ids).length};
}

// números de todas as abas (para o botão da aba e para o seletor da cobrança)
function resumoAbas(c, hoje){ return abasPrazos(c).map(function(a){ var d = detalheAba(c, a, hoje); return Object.assign({}, a, {andando:d.andando, atrasados:d.atrasados, det:d}); }); }

// mensagem de cobrança para copiar (WhatsApp, *negrito*). so = chave de uma aba (só aquele fornecedor) ou "" (todos). Vazio se não há nada atrasado.
function mensagemCobranca(abas, hoje, so){
  var out = ["*Cobrança de prazos · Sorelly Joias*", "Data: "+dBR(hoje), ""], n = 0;
  abas.filter(function(a){ return a.atrasados>0 && (!so || a.k===so); }).forEach(function(a){
    out.push("*"+a.nome+"*"); n++;
    var visto = {};
    if(a.det.total) a.det.total.pedidos.filter(function(x){ return x.atrasado; }).forEach(function(x){ visto[x.id] = 1; out.push("• Romaneio "+x.rotulo+" · "+x.dias+plural(x.dias, " dia", " dias")+" no banho (prazo "+x.prazo+")"); });
    a.det.linhas.forEach(function(l){ l.pedidos.filter(function(x){ return x.atrasado && !visto[x.id]; }).forEach(function(x){ out.push("• Romaneio "+x.rotulo+" · "+x.dias+plural(x.dias, " dia", " dias")+" em \""+l.nome+"\" (prazo "+x.prazo+")"); }); });
    out.push("");
  });
  if(!n) return "";
  out.push("Pode nos passar a previsão de entrega de cada um? Obrigado!");
  return out.join("\n");
}

export { ETAPAS_BRUTO, ETAPAS_GALV, abasPrazos, prazoDaLinha, detalheAba, resumoAbas, mensagemCobranca };

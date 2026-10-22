// Sorelly Admin · montagem e bipagem — domain/regras.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { tempoMedioB } from "@/apps/montagem/components/barra-bipadora";
import { kit } from "@/apps/montagem/domain/seed";
import { textoPeca } from "@/apps/montagem/domain/config";
import { montadorValido, nomeDe, podeLiberarExcecao } from "@/apps/montagem/domain/equipe";
import { hoje, minutos } from "@/apps/montagem/lib/format";
import { e } from "@/shared/react";

function ehEspecial(v,c){ return v > c.limiteEspecial; }
function ehAtencao(v,c){ return v > c.limiteAtencao; }
function soMelhores(v,c){ return v > (c.limiteMelhores!==undefined ? c.limiteMelhores : c.limiteAtencao); }
// Kit grande (19/10/2026): se a venda atual (app, `vendas[0]`) OU o valor calculado do kit (`valor`, a média) passar do limite de Encomendas
// (`cfg.limiteEncomendas`, Configurador), só montam as montadoras marcadas como Encomendas. Marcus e Deysiane liberam exceção.
function valorRefEncomendas(k){ return Math.max(k.valor||0, (k.vendas && k.vendas[0]) || 0); }
function soEncomendas(k, c){ var lim = c.limiteEncomendas; return lim>0 && valorRefEncomendas(k) > lim; }
// Mesa maior (20/10/2026): kit com venda/média acima de `cfg.limiteMesaMaior` é montado só na mesa da Agatha (aviso, não trava)
function mesaMaior(k, c){ var lim = c.limiteMesaMaior; return lim>0 && valorRefEncomendas(k) > lim; }
function ehEncomendas(s, id){ var m = (s.montadoras||[]).find(function(x){ return x.id===id; }); return !!(m && m.encomendas); }
function nomesEncomendas(s){ return (s.montadoras||[]).filter(function(x){ return x.encomendas; }).map(function(x){ return x.nome; }).join(", "); }
// Quem monta é obrigatório: kit sem montador válido (de etapa montando em diante) é "sem montador" e não conta para a comissão da bipadora
var ETAPAS_COM_MONT = ["montando","supervisao","montado","bipando","bipado","retirado"];
function semMontador(k){ return ETAPAS_COM_MONT.indexOf(k.status)>=0 && !montadorValido(k.montId); }
// Texto do motivo se a pessoa NÃO pode montar este kit (vazio = pode). excecao = Marcus/Deysiane liberando.
function motivoNaoMonta(s, k, id, excecao){
  if(!montadorValido(id)) return "Informe quem vai montar este kit";
  if(soEncomendas(k, s.cfg) && !ehEncomendas(s, id) && !(excecao && podeLiberarExcecao(s.usuario)))
    return "Kit acima de R$ "+s.cfg.limiteEncomendas.toLocaleString("pt-BR",{minimumFractionDigits:2})+": só o setor Encomendas monta ("+nomesEncomendas(s)+")";
  return "";
}
function pecasPara(valor, c){
  if(!c.pecasKit || !valor) return null;
  var l = c.pecasKit.slice().sort(function(a,b){return b.kit-a.kit;}).find(function(x){return valor>=x.kit;});
  if(!l) return null;
  var itens = c.categorias.map(function(nome,i){ var mx = l.qmax && l.qmax[i]; return {nome:nome, q:l.q[i], max:(mx>l.q[i] ? mx : l.q[i]), txt:textoPeca(l, i)}; }).filter(function(x){return x.q!==null && x.q!==undefined && x.q!=="";});
  var tMin = itens.reduce(function(t,x){return t+x.q;},0), tMax = itens.reduce(function(t,x){return t+x.max;},0);
  return itens.length ? {kit:l.kit, itens:itens, total:tMin, totalTxt: tMax>tMin ? tMin+" a "+tMax : String(tMin)} : null;
}
function tempoMont(k, agora){
  if(!k.iniM) return 0; if(k.fimM && k.tempoM!==null) return k.tempoM;
  var p = k.pausaMs + (k.pausadoEm ? (agora - k.pausadoEm) : 0);
  return Math.max(0, (k.fimM || agora) - k.iniM - p);
}
function conta(k){ return k.fimM && ["montado","bipando","bipado","retirado"].indexOf(k.status)>=0; }
function listagemDe(s, k){ return s.listagens.find(function(l){return l.id===k.lid;}); }
// Capacidade de uma listagem: máximo de 15 revendedoras, exceto listagens de viagem (sem limite).
var MAX_LISTAGEM = 15;
function capacidadeListagem(l){ return l && l.viagem ? Infinity : MAX_LISTAGEM; }
function kitsNaListagem(s, lid){ return s.kits.filter(function(k){ return k.lid===lid; }).length; }
function listagemCheia(s, lid){ var l = s.listagens.find(function(x){return x.id===lid;}); if(!l) return false; return kitsNaListagem(s, lid) >= capacidadeListagem(l); }
function resumoMontadora(m, s){
  var c = s.cfg, hojeK = s.kits.filter(function(k){return k.montId===m.id && conta(k);});
  var n = m.mes.n, en = m.mes.e;
  hojeK.forEach(function(k){ if(ehEspecial(k.valor,c)) en++; else n++; });
  var media = m.mes.aval ? m.mes.soma/m.mes.aval : 0;
  var faixa = c.faixas.slice().sort(function(a,b){return b.min-a.min;}).find(function(f){return media>=f.min;}) || {pct:100};
  var fator = m.mes.aval ? faixa.pct : 100;
  var perda = Math.min(100, Math.floor(m.mes.div / c.divBloco) * c.divPerda);
  var bruto = n*c.valorNormal + en*c.valorEspecial;
  var alerta = !m.mes.aval ? "sem" : media < c.alertaVermelho ? "vermelho" : media < c.alertaAmarelo ? "amarelo" : "ok";
  return {m:m, n:n, e:en, total:n+en, hoje:hojeK.length, hojeK:hojeK, media:media, fator:fator,
    div:m.mes.div, perda:perda, bruto:bruto, liquido:bruto*(fator/100)*(1-perda/100), alerta:alerta,
    atual: s.kits.find(function(k){return k.montId===m.id && k.status==="montando";}),
    faltamBloco: c.divBloco - (m.mes.div % c.divBloco)};
}
function resumoBipadora(b, s){
  // bipadora só ganha por kit com montador informado (kit "sem montador" não conta)
  var c = s.cfg, hojeK = s.kits.filter(function(k){return k.bipId===b.id && k.fimB && !semMontador(k);});
  var n = b.mes.n, en = b.mes.e;
  hojeK.forEach(function(k){ if(k.valor > c.limiteBipEspecial) en++; else n++; });
  // peças faltando: as do mês até ontem + as apontadas hoje pelas representantes nos kits que ela bipou
  var faltas = b.mes.faltas + hojeK.reduce(function(t,k){return t+(k.aval ? k.aval.faltas : 0)+(k.errosBip||0);},0);   // + erros achados na conferência com a câmera (faltou ou veio peça errada)
  var bruto = n*c.valorBipNormal + en*c.valorBipEspecial, perda = faltas*c.perdaFalta;
  return {b:b, n:n, e:en, total:n+en, hoje:hojeK.length, hojeK:hojeK, bruto:bruto, faltas:faltas, perda:perda,
    liquido:Math.max(0, bruto-perda), tempo:tempoMedioB(hojeK), divs:hojeK.filter(function(k){return k.divReg;}).length,
    esp:hojeK.reduce(function(t,k){return t+k.valor;},0), real:hojeK.reduce(function(t,k){return t+(k.valorReal||0);},0),
    atual:s.kits.find(function(k){return k.bipId===b.id && k.status==="bipando";})};
}
function rankingNota(s){
  return s.montadoras.filter(function(m){return m.mes.aval >= s.cfg.minAvalRanking;})
    .sort(function(a,b){return (b.mes.soma/b.mes.aval)-(a.mes.soma/a.mes.aval);});
}
function podeAtencao(id, s){
  var tot = s.montadoras.reduce(function(t,m){return t+m.mes.n+m.mes.e;},0);
  if(tot < s.cfg.minKitsRestricao) return true;
  return rankingNota(s).slice(0, s.cfg.topN).some(function(m){return m.id===id;});
}
function filaMontagem(s){
  var itens = [];
  s.listagens.filter(function(l){return !l.fechada;}).forEach(function(l){
    var pi=0, ni=0;
    s.kits.filter(function(k){return k.lid===l.id && k.status==="pendente" && !k.designada;})
      .sort(function(a,b){return a.ordem-b.ordem;})
      .forEach(function(k){ itens.push({k:k, c:[minutos(l.horario), k.prio?0:1, k.prio?pi++:ni++, l.id]}); });
  });
  itens.sort(function(a,b){ for(var i=0;i<4;i++){ if(a.c[i]<b.c[i]) return -1; if(a.c[i]>b.c[i]) return 1; } return 0; });
  return itens.map(function(x){return x.k;});
}
function proximoPara(id, s){
  var aj = s.kits.find(function(k){return k.status==="ajuste" && k.montId===id;});
  if(aj) return {kit:aj, tipo:"ajuste"};
  var ped = s.kits.find(function(k){return k.status==="pendente" && k.designada===id && !listagemDe(s,k).fechada;});
  if(ped) return {kit:ped, tipo:"pedido"};
  var fila = filaMontagem(s), pulou = false;
  for(var i=0;i<fila.length;i++){
    // regra nova primeiro: kit acima do limite de Encomendas só para elas; senão vale a antiga (acima de 12 mil, só as melhores)
    if(soEncomendas(fila[i], s.cfg)){ if(!ehEncomendas(s, id)){ pulou = true; continue; } }
    else if(soMelhores(fila[i].valor, s.cfg) && !podeAtencao(id, s)){ pulou = true; continue; }
    return {kit:fila[i], tipo:"fila", posicao:i+1, pulou:pulou};
  }
  return {kit:null, pulou:pulou};
}
function filaBipagem(s){
  return s.kits.filter(function(k){return k.status==="montado";}).sort(function(a,b){
    return minutos(listagemDe(s,a).horario)-minutos(listagemDe(s,b).horario) || (a.prio===b.prio?0:(a.prio?-1:1)) || a.fimM-b.fimM;
  });
}
function dataPagamento(c){
  var d = new Date(); d = new Date(d.getFullYear(), d.getMonth()+1, c.diaPagamento);
  return String(d.getDate()).padStart(2,"0")+"/"+String(d.getMonth()+1).padStart(2,"0")+"/"+d.getFullYear();
}
function nomeMes(){ var s = new Date().toLocaleDateString("pt-BR",{month:"long", year:"numeric"});
  return s.charAt(0).toUpperCase()+s.slice(1); }

export { soEncomendas, mesaMaior, ehEncomendas, semMontador, motivoNaoMonta, valorRefEncomendas, nomesEncomendas, ehEspecial, ehAtencao, soMelhores, pecasPara, tempoMont, conta, listagemDe, MAX_LISTAGEM, capacidadeListagem, kitsNaListagem, listagemCheia, resumoMontadora, resumoBipadora, rankingNota, podeAtencao, filaMontagem, proximoPara, filaBipagem, dataPagamento, nomeMes };

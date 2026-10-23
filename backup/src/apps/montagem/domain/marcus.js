// Sorelly Admin · montagem — domain/marcus.js
// Sistema PARTICULAR do Marcus: estado próprio (não mistura com o do admin), guardado no navegador em "sorelly_marcus_v1".
// Os dados reais (senhas, CPF, patrimônio) ficam SÓ em marcus.local.js (gitignored: o repositório é público); sem esse arquivo o sistema abre vazio.
import { useSyncExternalStore } from "react";

var CHAVE = "sorelly_marcus_v1";
var LOCAL = (function(){ try { var m = import.meta.glob("./marcus.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();
var VAZIO = {recebimentos:{}, bens:[], dividas:[], contas:[], pagos:{}, acessos:[], planilhas:[], credito:[], atividades:[], empresas:[], carros:[], pessoais:[]};

function inicial(){
  try { var t = localStorage.getItem(CHAVE); if(t){
    var salvo = Object.assign({}, VAZIO, JSON.parse(t));
    // correção do arquivo local (campo versao maior que a salva): reaplica só o "recebido" dos meses listados, sem mexer no resto do que foi digitado
    if(LOCAL && (LOCAL.versao||0) > (salvo.versao||0)){ var r = Object.assign({}, salvo.recebimentos); (LOCAL.corrigirRecebido||[]).forEach(function(k){ r[k] = Object.assign({fat:0}, r[k], {rec:LOCAL.recebimentos[k].rec}); }); salvo.recebimentos = r; salvo.versao = LOCAL.versao; }
    return salvo; } } catch(x){}
  return Object.assign({}, VAZIO, JSON.parse(JSON.stringify(LOCAL || {})));
}
var estado = inicial(), ouvintes = [];
function salvar(){ try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch(x){} }
function mudar(fn){ var novo = Object.assign({}, estado); fn(novo); estado = novo; salvar(); ouvintes.forEach(function(f){ f(); }); }
function useMarcus(){ return useSyncExternalStore(function(f){ ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }, function(){ return estado; }); }
function novoId(p){ return p+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
// lista de objetos com id: salva (novo ou existente) / remove
function gravar(lista, item, pref){ mudar(function(s){ var l = s[lista].slice(); var i = l.findIndex(function(x){ return x.id===item.id; }); if(i<0){ item = Object.assign({id:novoId(pref)}, item); l.push(item); } else l[i] = item; s[lista] = l; }); }
function remover(lista, id){ mudar(function(s){ s[lista] = s[lista].filter(function(x){ return x.id!==id; }); }); }
function lancarRecebimento(mes, rec, fat){ mudar(function(s){ var r = Object.assign({}, s.recebimentos); if(!rec && !fat) delete r[mes]; else { var a = r[mes], igual = a && a.auto && Math.round((a.fat||0)*100)===Math.round((fat||0)*100); r[mes] = igual ? {rec:rec||0, fat:a.fat, auto:true, parcial:a.parcial} : {rec:rec||0, fat:fat||0}; } s.recebimentos = r; }); }
// Faturado automático (vem do admin): linhas = [{mes:"2026-10", fat, parcial}]. Só mexe em mês sem valor digitado à mão (ou que já era automático);
// quem digita o faturado de um mês à mão tira o automático desse mês. Mês atual (parcial) sempre acompanha o admin.
function sincronizarFaturado(linhas, quando){
  var mudou = false, r = Object.assign({}, estado.recebimentos);
  linhas.forEach(function(l){
    var a = r[l.mes];
    if(a && a.fat && !a.auto) return;
    if(!l.fat) return;
    if(a && a.auto && Math.round(a.fat*100)===Math.round(l.fat*100) && !!a.parcial===!!l.parcial) return;
    r[l.mes] = {rec:a ? a.rec : 0, fat:l.fat, auto:true, parcial:!!l.parcial}; mudou = true;
  });
  if(mudou || quando){ mudar(function(s){ if(mudou) s.recebimentos = r; s.fatSync = quando; }); }
}
function marcarPago(id, mes, v){ mudar(function(s){ var p = Object.assign({}, s.pagos); if(v) p[id+"|"+mes] = true; else delete p[id+"|"+mes]; s.pagos = p; }); }
function zerarTudo(){ try { localStorage.removeItem(CHAVE); } catch(x){} estado = inicial(); ouvintes.forEach(function(f){ f(); }); }

// ---- contas de um mês ("2026-10"): fixas (mensal) de meses anteriores repetem; avulsas só no mês em que foram lançadas
function contasDoMes(s, mes){
  return s.contas.filter(function(c){ return c.mensal ? c.mes<=mes : c.mes===mes; })
    .map(function(c){ return Object.assign({}, c, {pago:!!s.pagos[c.id+"|"+mes]}); })
    .sort(function(a, b){ return a.dia-b.dia || a.desc.localeCompare(b.desc); });
}
function somaContas(l){ var t = 0, pg = 0; l.forEach(function(c){ t += c.valor; if(c.pago) pg += c.valor; }); return {total:t, pago:pg, falta:t-pg}; }
function hojeMes(){ return new Date().toISOString().slice(0,7); }
function mesMais(mes, n){ var a = mes.split("-"), d = new Date(+a[0], +a[1]-1+n, 1); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
var MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
function nomeMes(mes){ var a = mes.split("-"); return MESES[+a[1]-1]+" de "+a[0]; }

// ---- recebimentos por ano
function resumoAno(s, ano){
  var linhas = MESES.map(function(n, i){ var k = ano+"-"+String(i+1).padStart(2,"0"), r = s.recebimentos[k]; return {mes:k, nome:n, rec:r ? r.rec : null, fat:r ? r.fat : null, pct:r && r.fat ? r.rec/r.fat*100 : null}; });
  var com = linhas.filter(function(l){ return l.rec!=null; }), rec = 0, fat = 0;
  com.forEach(function(l){ rec += l.rec; fat += l.fat; });
  return {linhas:linhas, rec:rec, fat:fat, pct:fat ? rec/fat*100 : 0, mediaRec:com.length ? rec/com.length : 0, mediaFat:com.length ? fat/com.length : 0, meses:com.length};
}
function anosComDados(s){ var a = {}; Object.keys(s.recebimentos).forEach(function(k){ a[k.slice(0,4)] = 1; }); a[hojeMes().slice(0,4)] = 1; return Object.keys(a).sort(); }

// ---- patrimônio
function patrimonio(s){
  var bens = 0, financ = 0, parcBens = 0, divs = 0, parcDiv = 0, semSaldo = 0;
  s.bens.forEach(function(b){ bens += b.valor||0; financ += b.saldo||0; parcBens += b.parcela||0; });
  s.dividas.forEach(function(d){ divs += d.saldo||0; parcDiv += d.parcela||0; if(d.saldo==null) semSaldo++; });
  return {bens:bens, dividas:divs+financ, liquido:bens-divs-financ, parcelas:parcBens+parcDiv, semSaldo:semSaldo};
}

export { useMarcus, sincronizarFaturado, gravar, remover, lancarRecebimento, marcarPago, zerarTudo, contasDoMes, somaContas, hojeMes, mesMais, nomeMes, resumoAno, anosComDados, patrimonio, MESES };

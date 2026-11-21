// Sorelly Admin · montagem — domain/pix-adiantados.js
// PIX ADIANTADO (Marcus, 19/11/2026): a revendedora (ex.: Karine) manda Pix direto a um prestador da família ANTES do acerto, que sai dias depois no Atendimento interno.
// O Pix já está em ff.pix (Financeiro familiar) e já virou repasse (syncRepasse). Quando o acerto sai, o mesmo valor NÃO pode entrar de novo (Direcionar, segundo repasse).
// Regra: o acerto CONSOME o Pix: ele entra como pagamento já resolvido e o Pix fica marcado em `ff.pixUsados[idDoPix]` ("usado no acerto X"). Marcar duas vezes não existe.
// Quem faz o acerto não lê o módulo ff (só sócios): a lista e a marca passam pelo servidor (src/server/pix-adiantados.js, rota /api/pix-adiantados), que usa estas funções puras.
// A marca fica num MAPA à parte (ff.pixUsados), NÃO dentro do item do Pix: a gravação por diferença troca o item inteiro de uma lista, e um sócio com a tela desatualizada que editasse o Pix apagaria a marca. No mapa, só quem mexe na chave dele muda.
// Nada aqui mexe em repasse: o repasse automático do Pix continua UM só.

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var semAcento = function(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, ""); };
var norm = function(t){ return semAcento(t).toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); };
var PEQUENAS = {da:1, de:1, do:1, das:1, dos:1, e:1};
var palavras = function(t){ return norm(t).split(" ").filter(function(w){ return w && !PEQUENAS[w]; }); };
// "Karine Thauany" = "Karine Thauany Batista de Souza": todas as palavras do nome mais curto (2 ou mais) estão no mais longo. Nome com 1 palavra só NÃO casa (evita juntar duas Karines).
function nomeParecido(a, b){
  var wa = palavras(a), wb = palavras(b); if(!wa.length || !wb.length) return false;
  if(norm(a)===norm(b)) return true;
  var menor = wa.length<=wb.length ? wa : wb, maior = menor===wa ? wb : wa;
  return menor.length>=2 && menor.every(function(w){ return maior.indexOf(w)>=0; });
}
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0, 10); };
var JANELA_SEM_ACERTO = 45;   // revendedora sem acerto registrado no sistema: só Pix dos últimos 45 dias
// Pix que o acerto pode consumir: da revendedora (nome parecido), depois do último acerto, ainda não usado, não rejeitado, não "não identificado", e não é do próprio acerto (internoId) quando já marcado por ele.
// opcoes = {desde: "AAAA-MM-DD" do último acerto (opcional), hoje, internoId}. Devolve [{id, data, valor, origem, conta, auditoria, compKey, compNome, meu}] do mais antigo para o mais novo.
function pixAdiantadosDe(ff, nome, opcoes){
  var o = opcoes || {}, hoje = o.hoje || new Date().toISOString().slice(0, 10), desde = o.desde || somaDias(hoje, -JANELA_SEM_ACERTO);
  if(!ff || !Array.isArray(ff.pix) || !palavras(nome).length) return [];
  var usos = ff.pixUsados || {};
  var conta = function(id){ var c = (ff.contasBanc || []).find(function(z){ return z.id===id; }); return c ? c.nome : ""; };
  return ff.pix.filter(function(x){
    if(!x || !(x.valor>0) || !x.origem || !x.data) return false;
    if(x.auditoria==="REJEITADO" || x.auditoria==="NAOIDENT") return false;
    if(x.personaId==="familia" || x.semAcerto) return false;   // transferência entre contas da casa não é pagamento de revendedora
    if(!(x.data>desde)) return false;
    var u = usos[x.id]; if(u && u.internoId!==o.internoId) return false;   // já consumido por outro acerto
    return nomeParecido(x.origem, nome);
  }).sort(function(a, b){ return a.data<b.data ? -1 : a.data>b.data ? 1 : 0; }).map(function(x){
    return {id:x.id, data:x.data, valor:r2(x.valor), origem:x.origem, conta:conta(x.contaId) || "PIX DIRETO", auditoria:x.auditoria || "PENDENTE", compKey:x.compKey || "", compNome:x.compNome || "", meu:!!(usos[x.id] && usos[x.id].internoId===o.internoId)};
  });
}
// Marca (ou solta) os Pix de UM atendimento. Idempotente: repetir a mesma chamada não muda nada. ids = os Pix que o atendimento está usando AGORA.
// - Pix livre da revendedora (ou já marcado por este atendimento) => marcado com {internoId, rev, em, por, valor}.
// - Pix marcado por este atendimento que saiu da lista => solto (a funcionária tirou a linha antes de terminar).
// - Pix de outra pessoa/outro acerto ou que não casa com a revendedora => recusado (nunca marca duas vezes).
// Devolve {ff (cópia nova), marcados:[ids], soltos:[ids], recusados:[{id, motivo}]}.
function sincronizarUso(ff0, args){
  var ff = JSON.parse(JSON.stringify(ff0)), a = args || {}, usos = ff.pixUsados = ff.pixUsados || {}, ids = (a.ids || []).filter(Boolean), marcados = [], soltos = [], recusados = [];
  if(!a.internoId) return {ff:ff, marcados:marcados, soltos:soltos, recusados:[{id:"", motivo:"Sem atendimento."}]};
  ids.forEach(function(id){
    var x = (ff.pix || []).find(function(y){ return y.id===id; });
    if(!x){ recusados.push({id:id, motivo:"Pix não encontrado."}); return; }
    if(usos[id] && usos[id].internoId!==a.internoId){ recusados.push({id:id, motivo:"Esse Pix já foi usado em outro acerto."}); return; }
    if(x.semAcerto){ recusados.push({id:id, motivo:"Esse lançamento é outro recebimento, não Pix antes do acerto."}); return; }
    if(!nomeParecido(x.origem, a.rev)){ recusados.push({id:id, motivo:"Esse Pix não é desta revendedora."}); return; }
    if(!usos[id]){ usos[id] = {internoId:a.internoId, rev:a.rev, em:a.em || new Date().toISOString(), por:a.por || "", valor:r2(x.valor)}; marcados.push(id); }
  });
  Object.keys(usos).forEach(function(id){ if(usos[id] && usos[id].internoId===a.internoId && ids.indexOf(id)<0){ delete usos[id]; soltos.push(id); } });
  return {ff:ff, marcados:marcados, soltos:soltos, recusados:recusados};
}
export { nomeParecido, pixAdiantadosDe, sincronizarUso, JANELA_SEM_ACERTO };

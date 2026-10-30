// Sorelly Admin · montagem — domain/melhorias.js
// Solicitações de melhorias (28/10/2026): todo funcionário pede uma mudança no sistema; Diretoria e Desenvolvimento respondem.
// Estado s.mel = {s_<id>: pedido}. CADA PEDIDO É UMA CHAVE: o servidor (módulo "mel", lib/sync-modulos.js) junta por chave, então duas pessoas enviando ao mesmo tempo não se apagam.
// Pedido = {id, titulo, desc, url, img (JPEG pequeno em texto ou ""), porId, por, setor, em (ISO), situacao, mudouEm}
// CONVERSA: cada mensagem é outra chave, c_<idDoPedido>_<idDaMensagem> = {porId, por, em, txt, img}. Quem pediu e quem gerencia escrevem sem se atropelar.
// Quem responde (muda situação e comenta): SÓ Marcus 16 e Leonardo 44 (Marcus, 29/10/2026). Os outros pedem e acompanham os próprios pedidos.

var SITUACOES = ["Em análise", "Mudança feita, testar", "Precisa de melhoria", "Concluída", "Recusada"];
// o menu mostra em dois grupos: o que ainda anda e o que já terminou (Marcus, 29/10/2026: mais opções de situação)
// FLUXO (Marcus, 29/10/2026): Marcus/Leonardo executam e marcam "Mudança feita, testar"; quem pediu testa e responde "Testei e aprovei" (Concluída) ou "Testei, precisa melhorar" (Precisa de melhoria); aí quem gerencia continua.
var SIT_ANDAMENTO = ["Em análise", "Mudança feita, testar", "Precisa de melhoria"];
var SIT_FIM = ["Concluída", "Recusada"];
var melAberta = function(z){ return SIT_ANDAMENTO.indexOf(z)>=0; };   // pedido novo já nasce Em análise (Marcus, 29/10/2026); o resto se conversa no chat. Excluir é outra ação (apaga da lista).
var SIT_ANTIGA = {"Nova":"Em análise", "Feita":"Mudança feita, testar", "Cancelada":"Recusada", "Precisa de mais informação":"Em análise", "Aprovada":"Em análise", "Em andamento":"Em análise", "Para depois":"Recusada"};   // nomes antigos já gravados
var sitNova = function(z){ return SIT_ANTIGA[z] || z; };   // Recusada = não vai ser feita; Cancelada = o Marcus ou o Leonardo cancelou (29/10/2026)
var GERENTES = [16, 44];
// TIPO do chamado (Marcus, 30/10/2026): quem abre escolhe o que é, antes de enviar. Pedidos antigos não têm tipo.
var TIPOS = [["duvida", "Não sei como fazer"], ["layout", "Melhoria do layout"], ["falta", "Algo que falta"]];
var melTipoNome = function(t){ var x = TIPOS.find(function(i){ return i[0]===t; }); return x ? x[1] : ""; };
var trim = function(v){ return String(v==null ? "" : v).trim(); };

// PRIMEIRO PEDIDO REAL (Michele, 28/10/2026): entra sozinho na lista e só vira chave do módulo quando alguém responde ou muda a situação.
var SEMENTE = {michele1:{id:"michele1", titulo:"Kits novos: só 1 de 9 revendedoras aparece para a Jessica Tobias", url:"/projetos/kits-novos", img:"/melhorias/michele-kit-novo.jpg", porId:18, por:"Michele", setor:"Kits novos",
  desc:"Oi, estou solicitando os kits novos para a Jessica Tobias. Apareceu apenas 1 revendedora de 9. (Print da janela Avançar para Solicitado, na tela de Kits novos.)", em:"2026-10-28T18:00:00.000Z", situacao:"Em análise", mudouEm:"2026-10-28T18:00:00.000Z"}};

// SEGUNDO PEDIDO REAL (Nickolas, 29/10/2026, lançado pelo Marcus em nome dele): vencimento das parcelas das Negociações. A resposta do Marcus também vem daqui.
SEMENTE.nickolas1 = {id:"nickolas1", titulo:"Negociações: vencimento das parcelas mês a mês", url:"/financeiro/pf-negociacoes", img:"/melhorias/nickolas-vencimentos.webp", porId:17, por:"Nickolas", setor:"Diretoria",
  desc:"Pagamentos a fornecedores, aba Negociações (Pix revendedora e boleto): quando divido o saldo em parcelas, o vencimento de cada mês não vem certo. Estou digitando à mão o último dia de cada mês (31/12, 31/01, 28/02, 31/03...) e já apareceu data que não existe (31/04/2027). Também o valor das parcelas não aparece inteiro no campo. Precisa verificar a regra do mês: a parcela deve cair no mês seguinte, no mesmo dia ou no último dia do mês quando ele é mais curto.",
  em:"2026-10-29T14:00:00.000Z", situacao:"Mudança feita, testar", mudouEm:"2026-10-29T15:00:00.000Z"};
var SEMENTE_MSGS = {nickolas1:[{k:"resp1", m:{porId:16, por:"Marcus", em:"2026-10-29T15:00:00.000Z", img:"",
  txt:"Nickolas, resolvido! Melhoria: o vencimento das parcelas agora cai no mês seguinte, no mesmo dia, ou no último dia do mês quando ele é mais curto (31/12, 31/01, 28/02, 31/03, 30/04, 31/05). E o sistema não deixa mais salvar data que não existe, como 31/04. Nova melhoria: nas parcelas a fonte ficou um pouco menor e a coluna do valor maior, para o número aparecer inteiro. Teste e me diga se ficou bom."}}]};

function melPodeGerir(id){ return GERENTES.indexOf(id)>=0; }
function melLista(s){
  var m = (s && s.mel) || {};
  var reais = Object.keys(m).filter(function(k){ return k.indexOf("s_")===0 && m[k] && m[k].id; }).map(function(k){ return m[k]; });
  Object.keys(SEMENTE).forEach(function(id){ if(!m["s_"+id]) reais.push(SEMENTE[id]); });
  return reais.filter(function(x){ return !x.excluido; }).map(function(x){ return SIT_ANTIGA[x.situacao] ? Object.assign({}, x, {situacao:sitNova(x.situacao)}) : x; })
    .sort(function(a, b){ return a.em < b.em ? 1 : -1; });
}
// caminho da tela (sem o endereço do site): "https://x.com/financeiro/resultado?a=1" vira "/financeiro/resultado"
function melCaminho(t){
  var v = trim(t); if(!v) return "";
  try { var u = new URL(v, "http://x"); return (u.pathname || "/") + (u.hash||""); } catch(x){ return v; }
}
function melMsgs(s, id){
  var m = (s && s.mel) || {}, pre = "c_"+id+"_";
  var lista = Object.keys(m).filter(function(k){ return k.indexOf(pre)===0 && m[k]; }).map(function(k){ return m[k]; });
  (SEMENTE_MSGS[id]||[]).forEach(function(x){ if(!m[pre+x.k]) lista.push(x.m); });
  return lista.sort(function(a, b){ return a.em < b.em ? -1 : 1; });
}
// dias que o pedido espera resposta de quem gerencia (Marcus e Leonardo): só os abertos (Nova, Em análise) cuja última mensagem NÃO é de quem gerencia; null = não espera
function melEspera(s, x, agora){
  var sz = sitNova(x.situacao); if(sz!=="Em análise" && sz!=="Precisa de melhoria") return null;   // só esses esperam a resposta de quem gerencia
  var ms = melMsgs(s, x.id), ult = ms.length ? ms[ms.length-1] : {porId:x.porId, em:x.em};
  if(melPodeGerir(ult.porId) && ult.porId!==x.porId) return null;
  return Math.max(0, Math.floor(((agora||Date.now()) - new Date(ult.em).getTime())/86400000));
}
// todas as fotos do pedido, em ordem (img = a primeira; imgs = as outras)
function melFotos(x){ var l = []; [x.img].concat(x.imgs||[]).forEach(function(i){ if(i && l.indexOf(i)<0) l.push(i); }); return l; }
function melResumo(lista){
  var r = {total:lista.length}; SITUACOES.forEach(function(x){ r[x] = lista.filter(function(p){ return p.situacao===x; }).length; });
  return r;
}

function melReduz(s, a){
  var m = Object.assign({}, s.mel);
  if(a.op==="enviar"){
    var desc = trim(a.desc), titulo = trim(a.titulo);
    if(!melTipoNome(a.tipo)) return {patch:{}, msg:"Marque o tipo: não sei como fazer, melhoria do layout ou algo que falta."};
    if(!desc) return {patch:{}, msg:"Escreva o que precisa mudar."};
    if(!titulo){ titulo = desc.split(/\n|(?<=[.!?])\s/)[0].trim(); if(titulo.length>120) titulo = titulo.slice(0, 117).trim()+"..."; }   // sem campo de título: vem do começo da mensagem
    var id = a.id || Date.now().toString(36)+Math.random().toString(36).slice(2, 5), agora = new Date().toISOString();
    m["s_"+id] = {id:id, titulo:titulo.slice(0, 120), desc:desc.slice(0, 3000), tipo:a.tipo, url:melCaminho(a.url).slice(0, 300), img:(a.imgs && a.imgs[0]) || a.img || "", imgs:(a.imgs||[]).slice(1, 4), porId:a.porId, por:a.por, setor:a.setor||"", em:agora, situacao:"Em análise", mudouEm:agora};
    return {patch:{mel:m}, msg:"Solicitação enviada. Obrigado!"};
  }
  if(a.id && SEMENTE[a.id] && !m["s_"+a.id]) m["s_"+a.id] = SEMENTE[a.id];
  var k = "s_"+a.id, p = m[k]; if(!p) return {patch:{}};
  var agora2 = new Date().toISOString();
  if(a.op==="msg"){
    if(!trim(a.txt) && !a.img) return {patch:{}};
    if(p.porId!==a.porId && !melPodeGerir(a.porId)) return {patch:{}, msg:"Só quem pediu, o Marcus e o Leonardo escrevem aqui."};
    var mid = Date.now().toString(36)+Math.random().toString(36).slice(2, 4);
    m["c_"+a.id+"_"+mid] = {porId:a.porId, por:a.por, em:agora2, txt:trim(a.txt).slice(0, 2000), img:a.img||""};
    return {patch:{mel:m}};
  }
  if(a.op==="teste"){   // quem pediu testou: ok = Concluída; senão Precisa de melhoria (com o que falta, que vai para o chat)
    if(p.porId!==a.porId && !melPodeGerir(a.porId)) return {patch:{}, msg:"Só quem pediu testa."};
    if(sitNova(p.situacao)!=="Mudança feita, testar") return {patch:{}};
    m[k] = Object.assign({}, p, {situacao:a.ok ? "Concluída" : "Precisa de melhoria", mudouEm:agora2});
    if(trim(a.txt)){ var mt = Date.now().toString(36)+Math.random().toString(36).slice(2, 4); m["c_"+a.id+"_"+mt] = {porId:a.porId, por:a.por, em:agora2, txt:trim(a.txt).slice(0, 2000), img:""}; }
    return {patch:{mel:m}, msg:a.ok ? "Obrigado! Pedido concluído." : "Anotado: o pedido volta para melhoria."};
  }
  if(!melPodeGerir(a.porId)) return {patch:{}, msg:"Só o Marcus e o Leonardo mudam a situação."};
  if(a.op==="excluir"){ m[k] = Object.assign({}, p, {excluido:true, excluidoPor:a.porId, excluidoEm:agora2}); return {patch:{mel:m}, msg:"Pedido excluído."}; }   // exclusão só marca (o servidor junta por chave e não apaga chaves)
  if(a.op==="claude"){ m[k] = Object.assign({}, p, {claude:trim(a.claude).slice(0, 300)}); return {patch:{mel:m}, msg:"Conversa do Claude salva."}; }   // conversa do Claude (link ou nome) anexada por quem gerencia
  if(a.op==="situacao" && SITUACOES.indexOf(a.situacao)>=0){ m[k] = Object.assign({}, p, {situacao:a.situacao, mudouEm:agora2}); return {patch:{mel:m}, msg:"Situação salva: "+a.situacao+"."}; }
  return {patch:{}};
}

function melMigrar(mel){ return mel && typeof mel==="object" ? mel : {}; }

export { TIPOS, melTipoNome, SITUACOES,SIT_ANDAMENTO, SIT_FIM, melAberta, GERENTES, melPodeGerir, melLista, melMsgs, melResumo, melEspera, melFotos, melCaminho, melReduz, melMigrar };

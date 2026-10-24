// Sorelly Admin · montagem — domain/rotina.js
// ROTINA DO DIA (pedido do Marcus, 21/10/2026): o que cada pessoa tem que lançar/fazer por dia, com horário e check de "feito".
//  · A Diretoria vê todo mundo e edita os combinados; cada pessoa vê só os dela (e marca como feito).
//  · Quando chega o horário e o item não foi marcado, a pessoa recebe o alerta com som no canto da tela (mesmo sistema dos Avisos) e um botão para abrir a tela certa.
//  · O feito fica guardado com quem marcou e a hora (reg[dia][itemId]). Itens e horários são combinados editáveis, nunca fixos dentro de tela.
// Estado s.rot = {v, itens:[{id, nome, setor, quem:[ids], hora:"HH:MM", dias:[0..6], rota, ativo}], reg:{"2026-10-21":{itemId:{em, por, porId}}}}
// Ligação futura: a tabela rotina_item / rotina_registro do banco novo tem as mesmas colunas.

var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
var SEG_SAB = [1, 2, 3, 4, 5, 6], SEG_SEX = [1, 2, 3, 4, 5];

// Combinados de partida (o Marcus ajusta na própria tela). quem = ids de pessoas de domain/equipe.js; rota = chave da tela.
var SEMENTE = [
  {id:"r_fat", nome:"Faturamento do dia e acertos acumulados", setor:"Financeiro", quem:[36], hora:"09:30", dias:SEG_SAB, rota:"previsaofat"},
  {id:"r_rev", nome:"Total de revendedoras", setor:"Direção", quem:[16], hora:"10:00", dias:SEG_SAB, rota:"visaogeral"},
  {id:"r_saldos", nome:"Saldos das contas", setor:"Financeiro", quem:[27], hora:"10:30", dias:SEG_SEX, rota:"caixa"},
  {id:"r_valor_kits", nome:"Definir o valor dos kits do dia", setor:"Montagem", quem:[11], hora:"08:30", dias:SEG_SEX, rota:"calc"},
  {id:"r_presenca", nome:"Presença do RH", setor:"RH", quem:[38], hora:"09:00", dias:SEG_SEX, rota:"rhpresenca"},
  {id:"r_pag_conf", nome:"Conferir pagamentos e definir as contas", setor:"Financeiro", quem:[27, 28], hora:"15:00", dias:SEG_SEX, rota:"cpagamentos"},
  {id:"r_compras", nome:"Decidir pedidos de compra", setor:"Financeiro", quem:[27], hora:"14:00", dias:SEG_SEX, rota:"compras"},
  {id:"r_passadas", nome:"Passadas para o próximo mês (Agendamento)", setor:"Agendamento", quem:[24], hora:"17:00", dias:SEG_SAB, rota:"visaogeral"},
  {id:"r_contas", nome:"Contas pagas do dia por CNPJ", setor:"Financeiro", quem:[27], hora:"17:30", dias:SEG_SEX, rota:"contaspagar"},
  {id:"r_inad", nome:"Registrar inadimplência recuperada", setor:"Inadimplência", quem:[32], hora:"16:30", dias:SEG_SEX, rota:"inadimp"},
  {id:"r_enc_lista", nome:"Enviar a listagem de horários da ida na empresa ao Agendamento", setor:"Encomendas", quem:[40], hora:"08:30", dias:SEG_SAB, rota:"encida"}
];

function rotDemo(){ return {v:1, itens:clone(SEMENTE), reg:{}}; }
function rotMigrar(r){
  if(!r || typeof r!=="object") return rotDemo();
  if(!Array.isArray(r.itens)) r.itens = clone(SEMENTE);
  if(!r.reg || typeof r.reg!=="object") r.reg = {};
  if(!r.encLista){ if(!r.itens.some(function(i){ return i.id==="r_enc_lista"; })) r.itens.push(clone(SEMENTE.find(function(i){ return i.id==="r_enc_lista"; }))); r.encLista = true; }   // 23/10/2026: entra uma vez nos dados já salvos
  return r;
}
var diaDaSemana = function(iso){ return new Date(iso+"T12:00:00").getDay(); };
// itens que valem naquele dia (ativos e no dia da semana certo), cada um com o feito ({em, por, porId} ou null)
function rotDoDia(r, iso){
  var dow = diaDaSemana(iso), reg = (r.reg||{})[iso] || {};
  return (r.itens||[]).filter(function(i){ return i.ativo!==false && (i.dias||SEG_SAB).indexOf(dow)>=0; })
    .map(function(i){ return Object.assign({}, i, {feito:reg[i.id] || null}); })
    .sort(function(a, b){ return (a.hora||"99:99").localeCompare(b.hora||"99:99") || a.nome.localeCompare(b.nome, "pt-BR"); });
}
var daPessoa = function(lista, id){ return lista.filter(function(i){ return (i.quem||[]).indexOf(id)>=0; }); };
// atrasado = tem horário, não foi feito e o horário já passou (dia anterior inteiro conta como passou)
function rotAtrasado(i, iso, hojeIso, agoraHM){
  if(i.feito || !i.hora) return false;
  return iso<hojeIso || (iso===hojeIso && i.hora<=agoraHM);
}
// resumo de uma lista do dia: total, feitos, pendentes, atrasados
function rotResumo(lista, iso, hojeIso, agoraHM){
  var feitos = lista.filter(function(i){ return !!i.feito; }).length, atras = lista.filter(function(i){ return rotAtrasado(i, iso, hojeIso, agoraHM); }).length;
  return {total:lista.length, feitos:feitos, pendentes:lista.length-feitos, atrasados:atras, pct:lista.length ? Math.round(feitos/lista.length*100) : 0};
}
// alertas que a pessoa deve receber agora: itens dela com horário já passado e ainda sem check (um alerta por item por dia: a chave evita repetir)
function rotAlertas(r, userId, iso, agoraHM){
  return daPessoa(rotDoDia(r, iso), userId).filter(function(i){ return !i.feito && i.hora && i.hora<=agoraHM; }).map(function(i){
    return {tipo:"rotina", chave:"rot:"+i.id+":"+iso+":"+userId, aba:i.rota||null, para:[userId], cor:"#E8B84B", titulo:"Hora de: "+i.nome,
      texto:"Combinado até as "+i.hora+". Abra a tela, faça e marque como feito na Rotina do dia."};
  });
}
// ações. a.porId = quem está logado; a.diretoria = pode tudo. Devolve {patch, msg}; patch vazio = recusado.
function rotReduz(s, a){
  var r = rotMigrar(clone(s.rot||null)), recusa = function(t){ return {patch:{}, msg:t}; };
  var item = function(id){ return r.itens.find(function(i){ return i.id===id; }); };
  switch(a.op){
    case "marcar": {
      var it = item(a.id); if(!it) return recusa("Item não encontrado.");
      if(!a.diretoria && (it.quem||[]).indexOf(a.porId)<0) return recusa("Esse item é de outra pessoa.");
      if(!/^\d{4}-\d{2}-\d{2}$/.test(a.data||"")) return recusa("Dia inválido.");
      r.reg[a.data] = r.reg[a.data] || {};
      if(a.feito===false) delete r.reg[a.data][a.id]; else r.reg[a.data][a.id] = {em:a.em||Date.now(), por:a.por||"", porId:a.porId};
      return {patch:{rot:r}, msg:a.feito===false ? "Marcação desfeita" : "Feito: "+it.nome};
    }
    case "sync": {   // veio do servidor: troca a lista de combinados e/ou os checks de um dia
      if(Array.isArray(a.itens)) r.itens = a.itens;
      if(a.dia) r.reg[a.dia] = a.reg || {};
      return {patch:{rot:r}, msg:""};
    }
    case "item_add": {
      if(!a.diretoria) return recusa("Só a Diretoria muda os combinados.");
      var nome = String(a.nome||"").trim(); if(!nome) return recusa("Escreva o nome do combinado.");
      if(!(a.quem||[]).length) return recusa("Escolha quem faz.");
      r.itens.push({id:"r"+Date.now(), nome:nome, setor:String(a.setor||"").trim(), quem:a.quem.slice(), hora:/^\d{2}:\d{2}$/.test(a.hora||"") ? a.hora : "", dias:(a.dias&&a.dias.length ? a.dias : SEG_SAB).slice(), rota:a.rota||"", ativo:true});
      return {patch:{rot:r}, msg:"Combinado criado"};
    }
    case "item_set": {
      if(!a.diretoria) return recusa("Só a Diretoria muda os combinados.");
      var ex = item(a.id); if(!ex) return recusa("Item não encontrado.");
      ["nome", "setor", "quem", "hora", "dias", "rota", "ativo"].forEach(function(k){ if(a.patch && a.patch[k]!==undefined) ex[k] = a.patch[k]; });
      return {patch:{rot:r}, msg:"Combinado atualizado"};
    }
    case "item_del": {
      if(!a.diretoria) return recusa("Só a Diretoria muda os combinados.");
      r.itens = r.itens.filter(function(i){ return i.id!==a.id; });
      return {patch:{rot:r}, msg:"Combinado removido"};
    }
    default: return recusa("Ação desconhecida.");
  }
}
export { DIAS_SEMANA, SEG_SAB, SEG_SEX, rotDemo, rotMigrar, rotDoDia, daPessoa, rotAtrasado, rotResumo, rotAlertas, rotReduz };

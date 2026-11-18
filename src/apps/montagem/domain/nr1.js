// Sorelly Admin · montagem — domain/nr1.js
// RH › Segurança do trabalho: acompanhamento do plano de ação da NR-1 (17/11/2026, plano que a Maria alinhou com o técnico de Segurança do Trabalho).
// Uma linha por ação, com responsável, prazo, situação, documentos anexados e histórico. Fica dentro do estado do RH (s.rh.nr1) e segue a mesma gravação dele.
// Este arquivo só guarda a regra. Não é aconselhamento jurídico: o que a NR-1 exige da Sorelly quem confirma é o técnico de Segurança do Trabalho e o contador.

var SITUACOES = [["nao_iniciada", "Não iniciada"], ["andamento", "Em andamento"], ["concluida", "Concluída"]];
var CNPJS_NR1 = ["34", "46", "59", "67"];   // os 4 CNPJs da empresa
var PRAZO_PADRAO = "2026-12-18";   // dezembro: prazo sugerido para as ações que já dá para começar (aprovado pelo Marcus em 17/11/2026)
var hojeIso = function(){ var d = new Date(), z = function(n){ return (n<10 ? "0" : "")+n; }; return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate()); };

function nr1Padrao(){
  var a = function(n, titulo, fazer, prazo, situacao, porCnpj){ return {id:"nr1-"+n, n:n, titulo:titulo, fazer:fazer, prazo:prazo, resp:"", situacao:situacao || "nao_iniciada", porCnpj:!!porCnpj, obs:"", anexos:[], hist:[]}; };
  return {v:1,
    acoes:[
      a(1, "PGR e PCMSO", "Deixar os documentos em local de acesso a todos os colaboradores", "2026-11-20", "andamento"),
      a(2, "EPIs", "Validar os equipamentos necessários, os certificados de aprovação (CA) e quem precisa usar", PRAZO_PADRAO),
      a(3, "Canal de denúncias", "Estudar o melhor formato de um canal anônimo de denúncias de assédio moral e sexual", "2026-11-30"),
      a(4, "Pesquisa de clima", "Fazer a primeira pesquisa e depois instituir a aplicação a cada trimestre", "2026-12-31"),
      a(5, "Ordem de serviço", "Elaborar os documentos por função e coletar a assinatura de cada colaborador", PRAZO_PADRAO),
      a(6, "CIPA", "Levantar os cursos disponíveis e os custos; um responsável por CNPJ", PRAZO_PADRAO, "nao_iniciada", true),
      a(7, "Prevenção de incêndios", "Verificar as sinalizações necessárias e o custo do treinamento; um responsável por CNPJ", PRAZO_PADRAO, "nao_iniciada", true),
      a(8, "Ergonomia", "Decidir se a empresa faz avaliação especializada (ergonomista) e levantar o custo de adequar móveis e estrutura", "")],
    cnpjs:CNPJS_NR1.map(function(c){ return {cnpj:c, cipa:"", incendio:""}; }),
    atividades:atividadesPadrao()};
}

// Atividades: tarefas pequenas de cada ação, que o RH passa para as pessoas fazerem (Marcus, 17/11/2026). Começa com os passos da ação 1 (PGR e PCMSO).
var SITUACOES_AT = [["pendente", "Pendente"], ["feita", "Feita"]];
function atividadesPadrao(){
  var t = function(i, txt){ return {id:"nr1-at-"+i, acaoId:"nr1-1", txt:txt, resp:"", prazo:"2026-11-20", situacao:"pendente", por:"", criadoEm:0}; };
  return [t(1, "Receber o PGR do técnico de Segurança do Trabalho"), t(2, "Receber o PCMSO"), t(3, "Confirmar com o técnico se há um documento por CNPJ ou um só"),
    t(4, "Anexar os arquivos na ação 1 desta tela"), t(5, "Definir o local de acesso a todos os colaboradores e avisar a equipe")];
}
function nr1EstadoAt(x, hoje){
  if(x.situacao==="feita") return {t:"Feita", cor:"ok"};
  if(x.prazo && x.prazo < (hoje || hojeIso())) return {t:"Atrasada", cor:"ruim"};
  return {t:"Pendente", cor:"alerta"};
}

// situação que aparece na tela: concluída, atrasada (prazo passou) ou a que foi marcada
function nr1Estado(a, hoje){
  if(a.situacao==="concluida") return {k:"concluida", t:"Concluída", cor:"ok"};
  if(a.prazo && a.prazo < (hoje || hojeIso())) return {k:"atrasada", t:"Atrasada", cor:"ruim"};
  if(a.situacao==="andamento") return {k:"andamento", t:"Em andamento", cor:"alerta"};
  return {k:"nao_iniciada", t:"Não iniciada", cor:"neutro"};
}
var diaBr = function(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? m[3]+"/"+m[2]+"/"+m[1] : "A definir"; };

// reducer: mexe em rh.nr1 (já copiado pelo rhReduz). Devolve {erro} ou {msg}.
function nr1Op(rh, a, por, novoId){
  rh.nr1 = rh.nr1 || nr1Padrao();
  if(!rh.nr1.atividades) rh.nr1.atividades = atividadesPadrao();   // estado salvo antes das atividades existirem
  var n = rh.nr1, ac = n.acoes.find(function(x){ return x.id===a.id; });
  var nota = function(x, txt){ x.hist.push({em:Date.now(), por:por, txt:txt}); };
  switch(a.op){
    case "nr1_set": {
      if(!ac) return {erro:"Ação não encontrada."};
      var p = a.patch || {}, antes = nr1Estado(ac).t;
      if(p.situacao!==undefined && !SITUACOES.some(function(s){ return s[0]===p.situacao; })) return {erro:"Situação inválida."};
      if(p.prazo!==undefined && p.prazo!=="" && !/^\d{4}-\d{2}-\d{2}$/.test(p.prazo)) return {erro:"Prazo inválido."};
      var mudou = [];
      if(p.situacao!==undefined && p.situacao!==ac.situacao) mudou.push("situação para "+SITUACOES.filter(function(s){ return s[0]===p.situacao; })[0][1]);
      if(p.prazo!==undefined && p.prazo!==ac.prazo) mudou.push("prazo para "+diaBr(p.prazo));
      if(p.resp!==undefined && String(p.resp).trim()!==ac.resp) mudou.push("responsável para "+(String(p.resp).trim() || "ninguém"));
      Object.keys(p).forEach(function(k){ if(["situacao", "prazo", "resp", "fazer", "obs"].indexOf(k)>=0) ac[k] = typeof p[k]==="string" ? p[k].trim() : p[k]; });
      if(mudou.length) nota(ac, "Mudou "+mudou.join("; "));
      return {msg:antes===nr1Estado(ac).t && !mudou.length ? "" : "Ação salva"}; }
    case "nr1_nota": {
      if(!ac) return {erro:"Ação não encontrada."};
      var t = String(a.txt || "").trim(); if(!t) return {erro:"Escreva o que foi feito."};
      nota(ac, t); return {msg:"Anotação registrada"}; }
    case "nr1_anexo_add": {
      if(!ac) return {erro:"Ação não encontrada."};
      if(!a.anexo || !a.anexo.key) return {erro:"Arquivo inválido."};
      ac.anexos.push({key:a.anexo.key, nome:a.anexo.nome, mime:a.anexo.mime, tam:a.anexo.tam, em:Date.now(), por:por});
      nota(ac, "Anexou "+a.anexo.nome); return {msg:"Documento anexado"}; }
    case "nr1_anexo_del": {
      if(!ac) return {erro:"Ação não encontrada."};
      var an = ac.anexos.find(function(x){ return x.key===a.key; }); if(!an) return {erro:"Documento não encontrado."};
      ac.anexos = ac.anexos.filter(function(x){ return x.key!==a.key; }); nota(ac, "Tirou "+an.nome); return {msg:"Documento removido"}; }
    case "nr1_cnpj": {
      var c = n.cnpjs.find(function(x){ return x.cnpj===a.cnpj; }); if(!c) return {erro:"CNPJ não encontrado."};
      if(["cipa", "incendio"].indexOf(a.campo)<0) return {erro:"Campo inválido."};
      c[a.campo] = String(a.valor || "").trim();
      var alvo = n.acoes.find(function(x){ return x.n===(a.campo==="cipa" ? 6 : 7); }); if(alvo) nota(alvo, "CNPJ "+a.cnpj+": responsável "+(c[a.campo] || "removido"));
      return {msg:"Responsável salvo"}; }
    case "nr1_at_add": {
      var pai = n.acoes.find(function(x){ return x.id===a.acaoId; }), tx = String(a.txt || "").trim();
      if(!pai) return {erro:"Escolha a ação."}; if(!tx) return {erro:"Escreva a atividade."};
      n.atividades.push({id:(novoId ? novoId("nr1-at-") : "nr1-at-"+Date.now()), acaoId:pai.id, txt:tx, resp:"", prazo:pai.prazo || "", situacao:"pendente", por:por, criadoEm:Date.now()});
      nota(pai, "Nova atividade: "+tx); return {msg:"Atividade adicionada"}; }
    case "nr1_at_set": {
      var at = n.atividades.find(function(x){ return x.id===a.idAt; }); if(!at) return {erro:"Atividade não encontrada."};
      var q = a.patch || {}, pa = n.acoes.find(function(x){ return x.id===at.acaoId; });
      if(q.situacao!==undefined && !SITUACOES_AT.some(function(s){ return s[0]===q.situacao; })) return {erro:"Situação inválida."};
      if(q.prazo!==undefined && q.prazo!=="" && !/^\d{4}-\d{2}-\d{2}$/.test(q.prazo)) return {erro:"Prazo inválido."};
      var antesSit = at.situacao, antesResp = at.resp;
      Object.keys(q).forEach(function(k){ if(["resp", "prazo", "situacao", "txt"].indexOf(k)>=0) at[k] = typeof q[k]==="string" ? q[k].trim() : q[k]; });
      if(pa && q.situacao!==undefined && q.situacao!==antesSit) nota(pa, (q.situacao==="feita" ? "Atividade feita: " : "Atividade reaberta: ")+at.txt);
      if(pa && q.resp!==undefined && q.resp!==antesResp) nota(pa, "Atividade passada para "+(at.resp || "ninguém")+": "+at.txt);
      return {msg:"Atividade salva"}; }
    case "nr1_at_del": {
      var ad = n.atividades.find(function(x){ return x.id===a.idAt; }); if(!ad) return {erro:"Atividade não encontrada."};
      n.atividades = n.atividades.filter(function(x){ return x.id!==a.idAt; });
      var pd = n.acoes.find(function(x){ return x.id===ad.acaoId; }); if(pd) nota(pd, "Atividade removida: "+ad.txt); return {msg:"Atividade removida"}; }
    default: return {erro:"Ação desconhecida."};
  }
}

// quem abre o Canal de denúncias (pessoaId): Marcus (lê as gerais) e Maria Claudia, RH, 38 (lê as que envolvem a direção), decisão de 18/11/2026. O servidor confere a mesma lista (src/server/denuncias.js); aqui só esconde a tela.
var PESSOAS_DENUNCIAS = [16, 38];

export { PESSOAS_DENUNCIAS, SITUACOES, SITUACOES_AT, CNPJS_NR1, nr1Padrao, nr1Estado, nr1EstadoAt, nr1Op, diaBr, hojeIso as hojeNr1 };

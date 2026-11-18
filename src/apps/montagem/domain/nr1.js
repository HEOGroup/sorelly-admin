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
    atV:ATV, atividades:atividadesPadrao(), pessoas:{}};
}

// Atividades: tarefas pequenas de cada ação, que o RH passa para as pessoas fazerem (Marcus, 17/11/2026). Começa com os passos da ação 1 (PGR e PCMSO).
var SITUACOES_AT = [["pendente", "Pendente"], ["feita", "Feita"]];
// ATV = versão da lista de atividades de partida: v1 = ação 1 (PGR e PCMSO), v2 = ação 2 (EPIs, 18/11/2026), v3 = ações 3 a 8 (18/11/2026). Estado salvo mais antigo ganha só as atividades novas, sem repetir nem trazer de volta as que foram tiradas.
var ATV = 3;
function atividadesPadrao(){
  var t = function(i, acao, v, txt, prazo){ return {id:"nr1-at-"+i, acaoId:acao, v:v, txt:txt, resp:"", prazo:prazo, situacao:"pendente", por:"", criadoEm:0}; };
  return [
    t(1, "nr1-1", 1, "Receber o PGR do técnico de Segurança do Trabalho", "2026-11-20"), t(2, "nr1-1", 1, "Receber o PCMSO", "2026-11-20"),
    t(3, "nr1-1", 1, "Confirmar com o técnico se há um documento por CNPJ ou um só", "2026-11-20"), t(4, "nr1-1", 1, "Anexar os arquivos na ação 1 desta tela", "2026-11-20"),
    t(5, "nr1-1", 1, "Definir o local de acesso a todos os colaboradores e avisar a equipe", "2026-11-20"),
    t(6, "nr1-2", 2, "Pedir ao técnico a lista de EPIs exigidos no PGR, por função e por CNPJ", "2026-11-25"),
    t(7, "nr1-2", 2, "Levantar quem precisa usar cada EPI (função e setor de cada colaborador)", "2026-11-27"),
    t(8, "nr1-2", 2, "Conferir o CA (certificado de aprovação) de cada EPI no cadastro oficial e a validade", "2026-12-04"),
    t(9, "nr1-2", 2, "Cotar e comprar os EPIs pelo Compras e estoque de material", "2026-12-08"),
    t(10, "nr1-2", 2, "Entregar os EPIs e recolher a assinatura de recebimento de cada pessoa", "2026-12-15"),
    t(11, "nr1-2", 2, "Orientar o uso e a guarda dos EPIs e arquivar as fichas assinadas", "2026-12-18"),
    t(12, "nr1-3", 3, "Divulgar o link do canal para todos os colaboradores (WhatsApp e cartaz)", "2026-11-30"),
    t(13, "nr1-3", 3, "Confirmar com o técnico e o contador se o formato do canal atende a NR-1", "2026-11-30"),
    t(14, "nr1-4", 3, "Escolher as perguntas e o formato da primeira pesquisa de clima", "2026-12-04"),
    t(15, "nr1-4", 3, "Aplicar a primeira pesquisa a todos os colaboradores", "2026-12-15"),
    t(16, "nr1-4", 3, "Analisar o resultado por setor e definir o que melhorar", "2026-12-22"),
    t(17, "nr1-4", 3, "Marcar a data da próxima aplicação (a cada 3 meses)", "2026-12-31"),
    t(18, "nr1-5", 3, "Listar as funções da empresa por CNPJ", "2026-12-04"),
    t(19, "nr1-5", 3, "Pedir ao técnico o modelo da ordem de serviço de cada função", "2026-12-08"),
    t(20, "nr1-5", 3, "Gerar a ordem de serviço de cada função", "2026-12-12"),
    t(21, "nr1-5", 3, "Colher a assinatura de cada colaborador (marcar na Ficha por pessoa)", "2026-12-18"),
    t(22, "nr1-6", 3, "Levantar os cursos de CIPA disponíveis e os custos", "2026-12-08"),
    t(23, "nr1-6", 3, "Confirmar com o técnico o que cada CNPJ precisa (CIPA ou designado)", "2026-12-12"),
    t(24, "nr1-6", 3, "Definir um responsável por CNPJ (preencher na tabela Responsável por CNPJ)", "2026-12-12"),
    t(25, "nr1-6", 3, "Matricular os responsáveis no curso", "2026-12-18"),
    t(26, "nr1-7", 3, "Verificar as sinalizações necessárias em cada unidade", "2026-12-08"),
    t(27, "nr1-7", 3, "Cotar o treinamento e a sinalização", "2026-12-12"),
    t(28, "nr1-7", 3, "Definir um responsável por CNPJ (preencher na tabela Responsável por CNPJ)", "2026-12-12"),
    t(29, "nr1-7", 3, "Contratar o treinamento e instalar a sinalização", "2026-12-18"),
    t(30, "nr1-8", 3, "Decidir com a diretoria se a empresa contrata avaliação especializada (ergonomista)", "2026-12-12"),
    t(31, "nr1-8", 3, "Pedir orçamento do ergonomista", ""),
    t(32, "nr1-8", 3, "Levantar o custo de adequar móveis e estrutura", "")];
}
// lista que a tela mostra: o que está salvo (ou a de partida) mais as atividades de partida de versões novas que ainda não entraram
function nr1Atividades(n){
  var base = Array.isArray(n.atividades) ? n.atividades : null, padrao = atividadesPadrao();
  if(!base) return padrao;
  var atV = n.atV || 1, ids = {}; base.forEach(function(x){ ids[x.id] = 1; });
  return base.concat(padrao.filter(function(x){ return (x.v || 1) > atV && !ids[x.id]; }));
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
  rh.nr1.atividades = nr1Atividades(rh.nr1); rh.nr1.atV = ATV; rh.nr1.pessoas = rh.nr1.pessoas || {};   // estado salvo antes das atividades (ou das novas) existirem
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
    // Ficha por pessoa (18/11/2026): EPI entregue e ordem de serviço assinada, uma data por pessoa. a.id = id do colaborador no cadastro do RH; a.campo = "epi" | "os"; a.data vazia = volta para Pendente.
    case "nr1_pessoa": {
      var pid = String(a.id || "").trim().slice(0, 80); if(!pid) return {erro:"Escolha a pessoa."};
      if(["epi", "os"].indexOf(a.campo)<0) return {erro:"Campo inválido."};
      var dt = String(a.data || ""); if(dt!=="" && !/^\d{4}-\d{2}-\d{2}$/.test(dt)) return {erro:"Data inválida."};
      var fp = Object.assign({}, n.pessoas[pid]); if(dt) fp[a.campo] = {data:dt, por:por, em:Date.now()}; else delete fp[a.campo];
      if(Object.keys(fp).length) n.pessoas[pid] = fp; else delete n.pessoas[pid];
      return {msg:dt ? (a.campo==="epi" ? "EPI registrado" : "Ordem de serviço registrada") : "Registro retirado"}; }
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

export { PESSOAS_DENUNCIAS, SITUACOES, SITUACOES_AT, CNPJS_NR1, nr1Padrao, nr1Atividades, nr1Estado, nr1EstadoAt, nr1Op, diaBr, hojeIso as hojeNr1 };

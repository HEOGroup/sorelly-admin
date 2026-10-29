// Sorelly Admin · montagem — domain/chat-store.js
// SorellyChat: estado central + camada de dados isolada no objeto `api`.
// Hoje tudo vive neste navegador (localStorage) com dados de demonstração e respostas simuladas.
// Quando o servidor existir, só o corpo das funções de `api` troca (HTTP + WebSocket); as telas não mudam.
// Tabelas previstas no banco: users, conversations, conversation_members, messages, attachments, reactions, pins, mentions, work_sessions.
import { React } from "@/shared/react";
import { CONTATOS, contato, contatoDoLogin, pessoaDoContato, ehDirecaoCid, idPorNome, hash, presenca, registrarRevendedora, sem } from "@/apps/montagem/domain/chat-contatos";
import { enviarFotoPessoa, fotoDoServidor, minhaSituacao } from "@/apps/montagem/lib/perfil";
import { horariosParaChat } from "@/apps/montagem/domain/rh";
import { tocar } from "@/apps/montagem/lib/sons";
import { ler as notifLer } from "@/apps/montagem/lib/notificacoes";
import { canal, membrosDoCanal, RESPOSTAS_CANAL } from "@/apps/montagem/domain/chat-canais";
import { MARKUP_ALVO, markup, precoSugerido, BRL } from "@/apps/montagem/domain/preco-pecas";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";

var CHAVE = "whatssorelly_v1", CHAVE_MIDIA = "whatssorelly_midia_v1";
// Com o servidor ligado (27/10/2026) o chat é DE VERDADE: começa vazio (sem as conversas de demonstração), guarda em outra chave e troca mensagens pelo servidor.
var SERVIDOR = apiAtiva(), CHAVE_SRV = "whatssorelly_srv_v1";
// A conversa com o Marcus (pessoa 16) fica SEMPRE no alto da lista de todo mundo, não sai (nem arquivando) e toda mensagem dele vira o aviso grande (27/10/2026).
var MARCUS_CID = contatoDoLogin(16);
var ehConvMarcus = function(c, cid){ return !!MARCUS_CID && cid!==MARCUS_CID && c.tipo==="dm" && c.membros.indexOf(MARCUS_CID)>=0 && c.membros.indexOf(cid)>=0; };
var seqServidor = 0, aplicando = false, fila = [], enviando = false, timerSync = null;
var MIN = 60000, HORA = 3600000, DIA = 86400000;
var uid = function(p){ return p + Date.now().toString(36) + Math.random().toString(36).slice(2,6); };

// ---------- mídia (fotos, áudios, arquivos): ficam à parte para não pesar o resto ----------
var midiasMem = {};
var midiasSalvas = (function(){ try{ return JSON.parse(localStorage.getItem(CHAVE_MIDIA)||"{}"); }catch(x){ return {}; } })();
function guardarMidia(url){
  var k = uid("md_"); midiasMem[k] = url;
  try{ midiasSalvas[k] = url; localStorage.setItem(CHAVE_MIDIA, JSON.stringify(midiasSalvas)); }catch(x){ delete midiasSalvas[k]; }   // cheio: fica só até recarregar
  return k;
}
// Mídia de OUTRA pessoa (ou de outro navegador): não está aqui; busca no servidor pela chave (md_...) e avisa a tela quando chegar. 404 = o envio ainda não terminou: tenta de novo (até 8 vezes).
var buscandoMidia = {}, tentativasMidia = {};
function buscarMidia(k){
  if(buscandoMidia[k] || (tentativasMidia[k]||0)>=8) return;
  buscandoMidia[k] = true; tentativasMidia[k] = (tentativasMidia[k]||0)+1;
  chamar("GET", "/chat/midia/"+encodeURIComponent(k)).then(function(r){
    buscandoMidia[k] = false;
    if(r && r.url){ midiasMem[k] = r.url; ouvintes.slice().forEach(function(f){ f(); }); }
  }).catch(function(){ setTimeout(function(){ buscandoMidia[k] = false; ouvintes.slice().forEach(function(f){ f(); }); }, 3000); });
}
function lerMidia(k){
  if(k && String(k).indexOf("fotos/")===0) return ("/"||"/")+k;
  var v = midiasMem[k] || midiasSalvas[k] || null;
  if(!v && k && SERVIDOR && /^md_/.test(k) && token()) buscarMidia(k);
  return v;
}

// ---------- dados de demonstração ----------
function semear(){
  var agora = Date.now(), I = idPorNome, marcus = I("Marcus"), nick = I("Nickolas"), lucas = I("Lucas"), ana = I("Anamaria");
  var todos = CONTATOS.filter(function(c){ return c.tipo==="func"; }).map(function(c){ return c.id; });
  var porSetor = function(s){ return CONTATOS.filter(function(c){ return c.setor===s; }).map(function(c){ return c.id; }); };
  var convs = [], msgs = {}, lido = {};
  var C = function(id, tipo, nome, membros, admins, extra){ convs.push(Object.assign({id:id, tipo:tipo, nome:nome, membros:membros, admins:admins||[], criada:agora-40*DIA, base:agora-2*MIN, fixaPor:{}}, extra||{})); msgs[id] = []; };
  var M = function(conv, de, minAtras, texto, extra){ msgs[conv].push(Object.assign({id:uid("m"), de:de, t:agora-minAtras*MIN, tipo:"texto", texto:texto, status:"lido", reacoes:{}, mencoes:[]}, extra||{})); };
  var Mr = function(conv, de, minAtras, texto, quem){ M(conv, de, minAtras, texto, {mencoes:quem}); };

  C("c_geral","grupo","Geral Sorelly", todos, [marcus,nick,lucas,ana], {descr:"Avisos e informações gerais da empresa. Aqui só vai o que interessa a todo mundo."});
  M("c_geral", marcus, 60*26, "Bom dia, pessoal! ☀️ Lembrando que hoje começa a campanha de outubro. Qualquer dúvida é só chamar aqui.");
  M("c_geral", nick, 60*25, "Reunião de alinhamento amanhã às 9h na sala de cima. Quem puder, chega 5 minutos antes.");
  M("c_geral", I("Deysiane"), 60*24, "Pessoal da montagem: hoje temos 38 kits para sair até as 16h. Vamos nessa! 💪");
  M("c_geral", I("Leci"), 60*23.5, "Boa, Deysi! 👏", {reacoes:{}});
  M("c_geral", ana, 60*5, "Gente, o ar-condicionado do corredor vai ser consertado hoje à tarde. Desculpem o barulho!");
  M("c_geral", marcus, 95, "Atenção: a partir de hoje o SorellyChat é o canal oficial interno. Podem passar a usar por aqui 🙌", {fixa:true});
  M("c_geral", I("Michele"), 80, "Show! Já testei por aqui, ficou igualzinho ao WhatsApp 😍");

  C("c_mkt","grupo","Marketing", grupoMkt().membros, [marcus], Object.assign({descr:"Artes e conteúdo. Cada pessoa do setor tem a sua conversa com a Direção."}, grupoMkt()));
  M("c_mkt", I("Beatriz Mascencio"), 300, "Subi as artes da campanha de indicação no drive. Podem dar uma olhada?");
  M("c_mkt", marcus, 240, "Beleza, Beatriz! Vou ver ainda hoje.");

  C("c_cad","grupo","Cadastro de Revendedoras", porSetor("Cadastro de revendedoras").concat([I("Michele"), marcus, nick]), [I("Michele")], {descr:"Entrada de novas revendedoras, kits novos e distribuição."});
  M("c_cad", I("Camilly"), 200, "Entraram 14 cadastros novos hoje. 9 já foram aprovados.");
  M("c_cad", I("Thaylianny"), 190, "Ficaram 2 pendentes: documento ilegível. Já pedi outro pelo WhatsApp da cliente.");
  M("c_cad", I("Michele"), 100, "Vou direcionar 6 para representantes e 3 vêm retirar aqui na Sorelly.");
  Mr("c_cad", I("Michele"), 12, "@Marcus Hess pode liberar o kit da Beatriz Nogueira? O pagamento já caiu.", [marcus]);

  C("dm_"+[marcus,nick].sort().join("_"), "dm", "", [marcus,nick]);
  var dMN = "dm_"+[marcus,nick].sort().join("_");
  M(dMN, nick, 180, "Marcus, fechei a conversa com o fornecedor de banho. Consegui 8% de desconto.");
  M(dMN, marcus, 170, "Excelente! Manda a proposta por escrito pra gente guardar.");
  M(dMN, nick, 45, "Mandei no e-mail. Dá uma olhada quando puder 👍");

  var dMi = "dm_"+[marcus,I("Michele")].sort().join("_"); C(dMi,"dm","",[marcus,I("Michele")]);
  M(dMi, I("Michele"), 600, "Bom dia, Marcus! Temos 22 kits novos para distribuir hoje.");
  M(dMi, marcus, 590, "Bom dia! Prioriza as que estão esperando há mais de 3 dias.");
  M(dMi, I("Michele"), 585, "Combinado ✅", {reacoes:{}});

  var dMR = "dm_"+[marcus,I("Rayssa")].sort().join("_"); C(dMR,"dm","",[marcus,I("Rayssa")]);
  M(dMR, I("Rayssa"), 400, "Marcus, chegaram 120 peças novas do fornecedor de Limeira. Já fotografei, mando o modelo e o custo?");
  M(dMR, marcus, 380, "Manda sim. Cadastra por modelo e me passa o markup que você sugere.");
  M(dMR, I("Rayssa"), 35, "Mandei 14 modelos. O anel solitário está com markup de 3,2 😊", {});

  var dMC = "dm_"+[I("Michele"),I("Camilly")].sort().join("_"); C(dMC,"dm","",[I("Michele"),I("Camilly")]);
  M(dMC, I("Camilly"), 130, "Michele, a Joice não atende o telefone. Posso passar para a próxima da fila?");
  M(dMC, I("Michele"), 125, "Pode sim. Anota no cadastro que tentou duas vezes.");

  var dDL = "dm_"+[I("Deysiane"),I("Leci")].sort().join("_"); C(dDL,"dm","",[I("Deysiane"),I("Leci")]);
  M(dDL, I("Deysiane"), 70, "Leci, tem uma revendedora chegando às 14h para atendimento. Pode acompanhar?");
  M(dDL, I("Leci"), 66, "Posso sim! Já separei as peças que ela pediu da última vez.");

  var dNB = "dm_"+[I("Nayale"),I("Bruna")].sort().join("_"); C(dNB,"dm","",[I("Nayale"),I("Bruna")]);
  M(dNB, I("Nayale"), 90, "Bruna, conferi o caixa de ontem. Fechou certinho.");
  M(dNB, I("Bruna"), 85, "Obrigada, Nay! Vou lançar no sistema agora.");

  var dML = "dm_"+[marcus,I("Leonardo")].sort().join("_"); C(dML,"dm","",[marcus,I("Leonardo")]);
  M(dML, I("Leonardo"), 900, "Marcus, subi a versão nova do app da representante em homologação.");
  M(dML, marcus, 880, "Beleza, vou testar hoje à noite e te falo.");

  var reps = ["Dayanne","Lysie","Jessica","Thalita","Vanessa","Fabila"].map(function(n){ return I(n); }).filter(Boolean);
  C("c_reps","grupo","Representantes Sorelly", reps.concat([marcus, I("Michele"), I("Camilly"), nick]), [marcus, nick], {descr:"Avisos para as representantes da rua."});
  M("c_reps", marcus, 1500, "Bom dia, meninas! Acertos da semana: parabéns a todas que bateram a meta 💛");
  M("c_reps", I("Dayanne"), 1480, "Obrigada, Marcus! Semana puxada mas deu certo 😊");
  var dMD = "dm_"+[I("Michele"),I("Dayanne")].sort().join("_"); C(dMD,"dm","",[I("Michele"),I("Dayanne")]);
  M(dMD, I("Dayanne"), 500, "Michele, posso retirar mais 5 kits novos amanhã?");
  M(dMD, I("Michele"), 495, "Pode! Separo para você.");

  var D = function(a, b, falas){ var id = "dm_"+[a,b].sort().join("_"); C(id, "dm", "", [a,b]); falas.forEach(function(f){ M(id, f[0], f[1], f[2]); }); return id; };
  var nay = I("Nayale"), dey = I("Deysiane"), amM = I("Amanda de Miranda"), lci = I("Leci");
  D(marcus, lucas, [[lucas, 330, "Marcus, fechei o orçamento da reforma do estoque. Te mando o resumo à tarde."], [marcus, 320, "Beleza, Lucas. Confere se inclui a parte elétrica."]]);
  var dMNy = D(marcus, nay, [[nay, 220, "Marcus, o faturamento de ontem fechou em R$ 207 mil. Contas a pagar de hoje: R$ 18 mil."], [marcus, 210, "Obrigado, Nay! Pode pagar a do fornecedor de banho primeiro."], [nay, 55, "Paguei! Já lancei no Caixa 👍"]]);
  var dMDe = D(marcus, dey, [[dey, 500, "Bom dia, Marcus! Temos 38 kits na fila de montagem hoje."], [marcus, 490, "Bom dia! Prioriza os da Dayanne e da Lysie."], [dey, 25, "Combinado. A equipe já está nessa 💪"]]);
  D(marcus, amM, [[amM, 700, "Marcus, a inadimplência de setembro ficou em 4,1%. Mando o relatório hoje."], [marcus, 690, "Ótimo, Amanda. Quero ver as 10 maiores."]]);
  D(dey, I("Edna"), [[dey, 150, "Edna, hoje você fica no treinamento das novas bipadoras, tudo bem?"], [I("Edna"), 140, "Tudo certo, Deysi! Já separei o material."]]);
  D(I("Ana Maria Divino"), nay, [[I("Ana Maria Divino"), 100, "Nay, o recebimento da Thalita já foi conferido. Pode dar o OK."], [nay, 95, "Dou agora."]]);
  D(I("Rayssa"), I("Graziella"), [[I("Graziella"), 210, "Rayssa, lancei os 14 modelos novos. Falta só o preço da diretoria."], [I("Rayssa"), 205, "Perfeito, o Marcus já está vendo."]]);
  D(I("Camilly"), I("Thaylianny"), [[I("Camilly"), 260, "Thay, assume os cadastros da tarde? Preciso sair mais cedo."], [I("Thaylianny"), 255, "Assumo sim!"]]);
  var rep1 = I("Dayanne"), rep2 = I("Lysie"), cam = I("Camilly");
  var cId = "cn_cadastro_"+rep1; C(cId, "setor", "Cadastro de Revendedoras", [rep1].concat(membrosDoCanal("cadastro")), [], {canal:"cadastro", repId:rep1, atendente:cam});
  M(cId, rep1, 190, "Oi! A Beatriz Nogueira mudou de endereço. Posso mandar o novo por aqui?");
  M(cId, "sistema", 187, "Camilly assumiu a conversa", {tipo:"sistema"});
  M(cId, cam, 186, "Pode sim! Me passa a rua, o número e o bairro que eu atualizo.");
  var fId = "cn_financeiro_"+rep2; C(fId, "setor", "Financeiro", [rep2].concat(membrosDoCanal("financeiro")), [], {canal:"financeiro", repId:rep2, atendente:null});
  M(fId, rep2, 22, "Boa tarde! Meu pagamento do dia 11 veio menor que o esperado. Como confiro?");
  var mariaRH = I("Maria Claudia"), sth = I("Sthafany"), ana2 = I("Anamaria");
  var dMRH = D(marcus, mariaRH, [[mariaRH, 30, "Podemos efetivar essa colaboradora?"]]);
  msgs[dMRH].unshift({id:uid("m"), de:mariaRH, t:agora-150*MIN, tipo:"decisao", texto:"", status:"lido", reacoes:{}, mencoes:[],
    dec:{tipo:"efetivacao", titulo:"Efetivação de experiência", pessoa:sth, decisores:[marcus, ana2, lucas], estado:"pendente", pergunta:"Seguiremos com a efetivação?",
      campos:[["Setor","Atendimento"], ["Empresa","Axis"], ["Admissão","01/09/2026"], ["Fim da experiência","15/10/2026"]],
      historico:[["Faltas",0], ["Atrasos",0], ["Advertências",0]],
      feedback:"Feedback da gestora Deysiane: realiza suas atividades de atendimento de forma satisfatória, mas tem pontos de melhoria na comunicação com as clientes e na agilidade dos atendimentos. A gestora já orientou sobre esses pontos e, até agora, não recebeu reclamações sobre a colaboradora."}});
  var pr = semearPreco(); convs.push(pr.conv); msgs.c_preco = pr.msgs;
  var at = semearAtendimento(); convs.push(at.conv); msgs.c_atend = at.msgs;
  var ag = semearAgendamento(); convs.push(ag.conv); msgs.c_agend = ag.msgs;
  // não lidas do Marcus (demonstração)
  lido[marcus] = {};
  convs.forEach(function(c){ if(c.membros.indexOf(marcus)<0) return; var u = msgs[c.id].filter(function(m){ return m.de!==marcus; }); lido[marcus][c.id] = u.length ? u[u.length-1].t : agora; });
  lido[marcus]["c_geral"] = agora - 85*MIN - 1;      // vê 1 não lida (a da Michele)
  lido[marcus]["c_cad"] = agora - 13*MIN;             // a menção da Michele ainda não foi vista
  lido[marcus][dMR] =agora - 36*MIN - 1;             // 1 não lida da Rayssa
  lido[marcus][dMN] = agora - 46*MIN - 1;             // 1 não lida do Nickolas
  lido[marcus].c_preco = agora - 15*MIN;               // cartão de preço + pergunta: 2 não lidas
  lido[marcus][dMRH] = agora - 151*MIN;               // cartão de efetivação + pergunta: 2 não lidas
  lido[marcus][dMNy] = agora - 56*MIN - 1;            // 1 não lida da Nayale
  lido[marcus][dMDe] = agora - 26*MIN - 1;            // 1 não lida da Deysiane
  Object.keys(msgs).forEach(function(k){ msgs[k].sort(function(a,b){ return a.t-b.t; }); });
  return {convs:convs, msgs:msgs, lido:lido, dm:{marcus:marcus}};
}

// menções antigas para o painel de tempo de resposta ter o que mostrar (30 dias)
function mencoesDemo(){
  var gente = CONTATOS.filter(function(c){ return c.tipo==="func" && c.setor!=="Sócios e família" && c.setor!=="PJ · prestadores"; });
  var chefes = ["Marcus","Nickolas","Lucas","Deysiane","Michele","Nayale","Rayssa"].map(function(n){ return idPorNome(n); }).filter(Boolean);
  var r = [], agora = Date.now();
  for(var i=0;i<90;i++){
    var para = gente[(hash("p"+i)*7+i*13)%gente.length], de = chefes[hash("d"+i)%chefes.length];
    if(para.id===de) continue;
    var dia = (hash("t"+i)%29), em = agora - dia*DIA - (hash("h"+i)%8)*HORA - 3*HORA;
    var base = hash(para.id)%28;                                         // cada pessoa tem seu ritmo
    var sem = hash("s"+i)%100 < 7 && dia>0;                              // ~7% nunca respondeu
    var dur = (3 + base + hash("r"+i)%20) * MIN;
    r.push({id:"mh"+i, conv:null, msg:null, de:de, para:para.id, setor:para.setor, em:em, prazo:30, resp:sem?null:em+dur, tempoMs:sem?null:dur, alertado:true});
  }
  return r;
}

// Grupos com conversas paralelas (uma aba por funcionária): Atendimento Interno e Agendamento de Acertos
function grupoAtendimento(){
  var I = idPorNome, func = ["Natasha","Edna","Renata","Sthafany","Kawany","Nataly","Natalia"].map(function(n){ return I(n); }).filter(Boolean), dir = ["Marcus","Anamaria","Lucas","Nickolas"].map(function(n){ return I(n); }).filter(Boolean);
  return {paralelas:true, funcionarias:func, supervisores:[], membros:func.concat(dir), admins:[I("Marcus"), I("Anamaria")].filter(Boolean)};
}
function grupoAgendamento(){
  var I = idPorNome, func = ["Mariana","Tamara","Ana Maria Divino"].map(function(n){ return I(n); }).filter(Boolean), dir = ["Marcus","Anamaria","Lucas","Nickolas"].map(function(n){ return I(n); }).filter(Boolean);
  return {paralelas:true, funcionarias:func, supervisores:[I("Ana Maria Divino")].filter(Boolean), membros:func.concat(dir), admins:[I("Marcus"), I("Ana Maria Divino")].filter(Boolean)};
}
// grupos com conversas paralelas: Marketing, Encomendas & Reposição, Financeiro Representantes; e o grupo Interno (todos os funcionários)
var DIRECAO4 = ["Marcus","Anamaria","Lucas","Nickolas"];
function dir4(){ return DIRECAO4.map(function(n){ return idPorNome(n); }).filter(Boolean); }
function grupoMkt(){ var f = CONTATOS.filter(function(c){ return c.setor==="Marketing"; }).map(function(c){ return c.id; }); return {paralelas:true, funcionarias:f, supervisores:[], membros:f.concat(dir4()), admins:[idPorNome("Marcus")].filter(Boolean)}; }
function grupoEnc(){ var f = ["Agatha","Elen","Eduarda Gabriela"].map(function(n){ return idPorNome(n); }).filter(Boolean), ag = idPorNome("Agatha"); return {paralelas:true, funcionarias:f, supervisores:[ag].filter(Boolean), membros:f.concat(dir4()), admins:[idPorNome("Marcus"), ag].filter(Boolean)}; }
function grupoFinRep(){ var f = ["Dayanne","Lysie","Jessica","Thalita"].map(function(n){ return idPorNome(n); }).filter(Boolean), fin = ["Lucas","Nayale","Bruna"].map(function(n){ return idPorNome(n); }).filter(Boolean);
  return {paralelas:true, funcionarias:f, supervisores:fin, membros:f.concat(fin, dir4().filter(function(x){ return fin.indexOf(x)<0; })), admins:[idPorNome("Marcus"), idPorNome("Lucas")].filter(Boolean)}; }
function semearGrupoExtra(id){
  var agora = Date.now(), I = idPorNome, marcus = I("Marcus"), base = {tipo:"grupo", criada:agora-30*DIA, base:agora, fixaPor:{}}, msg = function(de, min, txt){ return {id:uid("m"), de:de, t:agora-min*MIN, tipo:"texto", texto:txt, status:"lido", reacoes:{}, mencoes:[]}; };
  if(id==="c_enc"){ var g = grupoEnc(); return {conv:Object.assign({id:"c_enc", nome:"Encomendas & Reposição", descr:"Separação das encomendas, reposições e rotas de entrega. A Agatha é a supervisora; cada pessoa tem a sua conversa."}, base, g), msgs:[msg(I("Agatha"), 120, "Bom dia, meninas! Hoje temos reposições para separar e a rota de entrega sai às 14h.")]}; }
  if(id==="c_interno"){ var todos = CONTATOS.filter(function(c){ return c.tipo==="func"; }).map(function(c){ return c.id; });
    return {conv:Object.assign({id:"c_interno", nome:"Interno", descr:"Avisos e solicitações em geral para todos os funcionários internos da empresa."}, base, {membros:todos, admins:[marcus, I("Anamaria")].filter(Boolean)}), msgs:[msg(marcus, 180, "Este é o grupo Interno: avisos e solicitações que valem para todo mundo da empresa.")]}; }
  if(id==="c_finrep"){ var gf = grupoFinRep(); return {conv:Object.assign({id:"c_finrep", nome:"Financeiro Representantes", descr:"Os pagamentos dos acertos das representantes vêm da calculadora de acertos para cá. Cada representante tem a sua conversa; o financeiro direciona as contas e confere."}, base, gf), msgs:[msg(I("Lucas"), 90, "Pessoal, os pagamentos dos acertos aparecem aqui sozinhos. Cada representante vê só a conversa dela.")]}; }
  return null;
}
function semearAtendimento(){
  var agora = Date.now(), I = idPorNome, conv = Object.assign({id:"c_atend", tipo:"grupo", nome:"Atendimento Interno", descr:"Revendedoras que vêm à Sorelly: bipagem, acertos e pagamentos. Cada funcionária tem a sua conversa.", criada:agora-30*DIA, base:agora, fixaPor:{}}, grupoAtendimento());
  var msgs = [{id:uid("m"), de:I("Marcus"), t:agora-90*MIN, tipo:"texto", texto:"Bom dia, pessoal! Hoje temos 14 revendedoras no atendimento interno. Cada uma de vocês tem a sua conversa aqui em cima; usem ela para as solicitações de pagamento.", status:"lido", reacoes:{}, mencoes:[]}];
  return {conv:conv, msgs:msgs};
}
function semearAgendamento(){
  var agora = Date.now(), I = idPorNome, conv = Object.assign({id:"c_agend", tipo:"grupo", nome:"Agendamento de Acertos", descr:"Agenda dos acertos: horários, atrasos e remarcações. Ana Maria é a supervisora.", reps:true, repCanal:"agendamento", criada:agora-30*DIA, base:agora, fixaPor:{}}, grupoAgendamento());
  var msgs = [{id:uid("m"), de:I("Ana Maria Divino"), t:agora-80*MIN, tipo:"texto", texto:"Bom dia, meninas! Hoje são 14 acertos na agenda. Quem tiver atraso ou remarcação me avisa por aqui.", status:"lido", reacoes:{}, mencoes:[]}];
  return {conv:conv, msgs:msgs};
}
// Grupo "Agendamento": equipe do agendamento + as 7 do atendimento interno + direção. Aqui cai o aviso diário automático e, no botão Representantes,
// a diretoria e o agendamento puxam a conversa de agendamento com cada representante (essas conversas não aparecem na barra lateral).
var EXTRAS_AGEND = ["Anamaria","Marcus","Nickolas","Lucas","Priscila","Maria Claudia"];
function extrasAgend(){ return EXTRAS_AGEND.map(function(n){ return idPorNome(n); }).filter(Boolean); }
function membrosAgend(rep){ return [rep].concat(membrosDoCanal("agendamento"), extrasAgend().filter(function(x){ return membrosDoCanal("agendamento").indexOf(x)<0 && x!==rep; })); }
function semearAgendamentoAt(){
  var agora = Date.now(), I = idPorNome, marcus = I("Marcus"), ana = I("Ana Maria Divino");
  var equipe = ["Ana Maria Divino","Mariana","Tamara"].map(function(n){ return I(n); }), meninas = ["Natasha","Edna","Renata","Sthafany","Kawany","Nataly","Natalia"].map(function(n){ return I(n); }), dir = ["Marcus","Anamaria","Lucas","Nickolas"].map(function(n){ return I(n); });
  var conv = {id:"c_agend_at", tipo:"grupo", nome:"Agendamento", descr:"Agendamento e atendimento interno juntos: aviso diário de quantos atendimentos há no dia e dos cancelamentos. Em Representantes (no topo) você puxa a conversa de agendamento com cada representante.", reps:true,
    membros:equipe.concat(meninas, dir).filter(Boolean), admins:[marcus, ana].filter(Boolean), criada:agora-30*DIA, base:agora, fixaPor:{}};
  return {conv:conv, msgs:[]};
}
function semearRepAgend(){   // conversa de demonstração de uma representante com o agendamento
  var I = idPorNome, rep = I("Dayanne"); if(!rep) return null; var id = "cn_agendamento_"+rep, t = Date.now(), mar = I("Mariana");
  var c = canal("agendamento"), m = function(de, min, txt){ return {id:uid("m"), de:de, t:t-min*MIN, tipo:"texto", texto:txt, status:"lido", reacoes:{}, mencoes:[]}; };
  return {conv:{id:id, tipo:"setor", canal:"agendamento", repId:rep, nome:c.nome, membros:membrosAgend(rep), admins:[], atendente:mar, criada:t-DIA, base:t, fixaPor:{}}, msgs:[m(rep, 95, "Oi! Consigo trazer os kits só amanhã de manhã. Tudo bem?"), m(mar, 90, "Tudo bem! Deixei anotado, amanhã a partir das 8h.")]};
}
function semearRepRev(){
  var I = idPorNome, rep = I("Dayanne"); if(!rep) return null; var rv = registrarRevendedora("Beatriz Nogueira"), id = "cn_r_rep_"+rv, t = Date.now(), c = canal("r_rep");
  var m = function(de, min, txt){ return {id:uid("m"), de:de, t:t-min*MIN, tipo:"texto", texto:txt, status:"lido", reacoes:{}, mencoes:[]}; };
  return {conv:{id:id, tipo:"setor", canal:"r_rep", repId:rv, nome:c.nome, membros:[rv, rep], admins:[], atendente:rep, criada:t-DIA, base:t, fixaPor:{}}, msgs:[m(rv, 140, "Oi Dayanne! Posso fazer meu acerto na quinta?"), m(rep, 132, "Pode sim! Prefere de manhã ou à tarde?"), m(rv, 120, "De manhã, por volta das 9h.")]};
}
function semearPreco(){
  var agora = Date.now(), I = idPorNome, marcus = I("Marcus"), nick = I("Nickolas"), lucas = I("Lucas"), ray = I("Rayssa"), gra = I("Graziella");
  var custo = 24.55, preco = precoSugerido(custo, MARKUP_ALVO);
  var conv = {id:"c_preco", tipo:"grupo", nome:"Cadastro de Peças", foto:"fotos/grupo-cadastro-pecas.jpg", descr:"Cadastro de peças: a equipe manda a foto e os dados, a diretoria define o preço.", membros:[ray, gra, marcus, nick, lucas].filter(Boolean), admins:[marcus], criada:agora-30*DIA, base:agora, fixaPor:{}};
  var msgs = [
    {id:uid("m"), de:ray, t:agora-14*MIN, tipo:"decisao", texto:"", status:"lido", reacoes:{}, mencoes:[],
      dec:{tipo:"preco", titulo:"Preço de peça nova", modelo:"Conjunto", foto:"fotos/peca-conjunto-coracao.jpg", custo:custo, qtd:20, fornecedor:"Point", preco:preco, decisores:[marcus, nick, lucas], estado:"pendente"}},
    {id:uid("m"), de:ray, t:agora-13*MIN, tipo:"texto", texto:"Marcus, pode ver o preço desse conjunto? Chegaram 20 hoje.", status:"lido", reacoes:{}, mencoes:[]}];
  return {conv:conv, msgs:msgs};
}
function inicial(){
  var s = semear();
  var st = {v:1, convs:s.convs, msgs:s.msgs, lido:s.lido, mencoes:mencoesDemo(), usuarios:{}, ocupado:{},
    config:{representantes:true, prazoPadrao:30, prazos:{}, expediente:{ini:"08:00", fim:"18:00", dias:[1,2,3,4,5]}}};
  // menção de hoje: Michele marcou o Marcus há 12 minutos (o relógio está rodando)
  var m = s.msgs["c_cad"][s.msgs["c_cad"].length-1];
  st.mencoes.push({id:uid("mn"), conv:"c_cad", msg:m.id, de:m.de, para:m.mencoes[0], setor:contato(m.mencoes[0]).setor, em:m.t, prazo:30, resp:null, tempoMs:null, alertado:false});
  return st;
}
var base = (function(){ try{ var o = JSON.parse(localStorage.getItem(CHAVE)||"null"); if(o && o.v===1) return o; }catch(x){} return inicial(); })();
var GRUPO_PADRAO = {c_agend_at:{foto:"fotos/grupo-agendamento.jpg"}, c_cad:{foto:"fotos/grupo-cadastro.jpg", nome:"Cadastro de Revendedoras"}, c_mkt:{foto:"fotos/grupo-marketing.jpg"}, c_preco:{foto:"fotos/grupo-cadastro-pecas.jpg", nome:"Cadastro de Peças", antigo:"Preço das Peças"}};
base.convs = base.convs.map(function(c){ var g = GRUPO_PADRAO[c.id]; if(!g) return c; var o = Object.assign({}, c); if(o.foto===undefined) o.foto = g.foto; if(g.nome && (o.nome==="Cadastro de revendedoras" || o.nome===g.antigo)) o.nome = g.nome; return o; });
// o grupo Cadastro de Revendedoras também tem o seletor de representante no topo (qualquer pessoa do setor fala com a representante)
base.convs = base.convs.map(function(c){ return c.id==="c_cad" && c.reps===undefined ? Object.assign({}, c, {reps:true, repCanal:"cadastro"}) : c; });
base.decisoes = base.decisoes || {};
base.pagamentosPostados = base.pagamentosPostados || {};
if(!base.convs.some(function(c){ return c.id==="c_atend"; })){ var semAt = semearAtendimento(); base.convs = base.convs.concat([semAt.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs.c_atend = semAt.msgs; }
// quem já tinha dados salvos: o Atendimento Interno vira grupo com conversas paralelas (uma vez) e o Agendamento de Acertos é criado
base.convs = base.convs.map(function(c){ return c.id==="c_atend" && c.paralelas===undefined ? Object.assign({}, c, grupoAtendimento()) : c; });
if(!base.convs.some(function(c){ return c.id==="c_agend"; })){ var semAg = semearAgendamento(); base.convs = base.convs.concat([semAg.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs.c_agend = semAg.msgs; }
if(!base.convs.some(function(c){ return c.id==="c_agend_at"; })){ var semAA = semearAgendamentoAt(); base.convs = base.convs.concat([semAA.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs.c_agend_at = semAA.msgs; }
if(base.agendExtrasV!==1){ base.agendExtrasV = 1; base.convs = base.convs.map(function(c){ return c.tipo==="setor" && c.canal==="agendamento" ? Object.assign({}, c, {membros:c.membros.concat(extrasAgend().filter(function(x){ return c.membros.indexOf(x)<0; }))}) : c; }); }
if(base.repRevV!==1){ base.repRevV = 1; var rRv = semearRepRev(); if(rRv && !base.convs.some(function(c){ return c.id===rRv.conv.id; })){ base.convs = base.convs.concat([rRv.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs[rRv.conv.id] = rRv.msgs; } }
if(base.repAgendV!==1){ base.repAgendV = 1; var rAg = semearRepAgend(); if(rAg && !base.convs.some(function(c){ return c.id===rAg.conv.id; })){ base.convs = base.convs.concat([rAg.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs[rAg.conv.id] = rAg.msgs; } }
["c_enc","c_interno","c_finrep"].forEach(function(gid){ if(base.convs.some(function(c){ return c.id===gid; })) return; var g = semearGrupoExtra(gid); if(!g) return; base.convs = base.convs.concat([g.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs[gid] = g.msgs; });
base.convs = base.convs.map(function(c){ return c.id==="c_agend" && c.reps===undefined ? Object.assign({}, c, {reps:true, repCanal:"agendamento"}) : c; });
base.convs = base.convs.map(function(c){ return c.id==="c_mkt" && c.paralelas===undefined ? Object.assign({}, c, grupoMkt()) : c; });
base.pecas = base.pecas || [];
base.horarios = base.horarios || {};
// horários do setor de Agendamento (14/10/2026): segunda a quinta de um jeito, sexta de outro (sexIni/sexFim), cada uma com o seu almoço
if(base.horarioAgendV!==1){ base.horarioAgendV = 1; base.horarios = Object.assign({}, base.horarios);
  [["Ana Maria Divino",{ini:"07:00", fim:"17:00", sexIni:"08:00", sexFim:"17:00", almIni:"11:30", almFim:"12:30"}], ["Mariana",{ini:"08:00", fim:"18:00", sexIni:"08:00", sexFim:"17:00", almIni:"13:30", almFim:"14:30"}], ["Tamara",{ini:"07:30", fim:"17:30", sexIni:"08:00", sexFim:"17:00", almIni:"12:30", almFim:"13:30"}]]
    .forEach(function(x){ var cid = idPorNome(x[0]); if(cid) base.horarios[cid] = x[1]; }); }
// horário do RH ao vivo (20/10/2026): o horário que a planilha tinha gravado aqui (19/10) sai, porque agora vale direto o cadastro do RH (definirHorariosRh);
// ajuste feito à mão pela Direção e horários do Agendamento ficam
if(base.horarioRhV!==2){ var antesRh = base.horarioRhV; base.horarioRhV = 2;
  if(antesRh===1){ base.horarios = Object.assign({}, base.horarios);
    horariosParaChat().forEach(function(x){ var ct = CONTATOS.find(function(c){ return sem(c.completo)===sem(x.nome); }), h = ct && base.horarios[ct.id];
      if(h && h.ini===x.ini && h.fim===x.fim && h.sexIni===x.ini && h.sexFim===x.fim && !h.almIni && !h.almFim && String(h.dias)===String(x.dias)) delete base.horarios[ct.id]; }); } }
// grupo "Preço das Peças" (peça nova + cartão de preço) também para quem já tem dados salvos
if(!base.convs.some(function(c){ return c.id==="c_preco"; })){ var semente = semearPreco(); base.convs = base.convs.concat([semente.conv]); base.msgs = Object.assign({}, base.msgs); base.msgs.c_preco = semente.msgs; base.lido = Object.assign({}, base.lido); }
if(SERVIDOR){   // chat de verdade: sem as conversas de demonstração; o que veio do servidor fica guardado neste navegador só para abrir rápido
  var salvoSrv = null; try{ salvoSrv = JSON.parse(localStorage.getItem(CHAVE_SRV)||"null"); }catch(x){}
  base = (salvoSrv && salvoSrv.v===1) ? salvoSrv : {v:1, convs:[], msgs:{}, lido:{}, mencoes:[], usuarios:{}, ocupado:{}, decisoes:{}, pagamentosPostados:{}, pecas:[], horarios:base.horarios||{}, config:base.config};
}
var estado = Object.assign({}, base, {efem:{digitando:{}, aberta:null, toasts:[], conversaSel:null, mini:false}});
var ouvintes = [], eu = null, timerSalvar = null;

function salvar(){
  clearTimeout(timerSalvar);
  timerSalvar = setTimeout(function(){ try{ var o = Object.assign({}, estado); delete o.efem; localStorage.setItem(SERVIDOR ? CHAVE_SRV : CHAVE, JSON.stringify(o)); }catch(x){} }, 250);
}
function mudar(fn, persistir){ var antes = estado; estado = fn(estado); if(persistir!==false) salvar(); if(SERVIDOR && !aplicando) diferencas(antes, estado); ouvintes.slice().forEach(function(f){ f(); }); }
function efem(p){ mudar(function(s){ return Object.assign({}, s, {efem:Object.assign({}, s.efem, p)}); }, false); }
function assinar(f){ ouvintes.push(f); return function(){ ouvintes = ouvintes.filter(function(x){ return x!==f; }); }; }
function useChat(){ return React.useSyncExternalStore(assinar, function(){ return estado; }); }
function definirEu(cid){ eu = cid; }
function euAgora(){ return eu; }

// ---------- tempo útil (expediente e "ocupado") ----------
function sobreposicao(a1,a2,b1,b2){ return Math.max(0, Math.min(a2,b2) - Math.max(a1,b1)); }
function ocupadoEm(cid, a, b){
  var o = estado.ocupado[cid]; if(!o) return 0; var t = 0;
  (o.periodos||[]).forEach(function(p){ t += sobreposicao(a,b,p[0],p[1]); });
  if(o.desde) t += sobreposicao(a,b,o.desde,Date.now());
  return t;
}
function tempoUtil(ini, fim, cid){
  var ex = estado.config.expediente, h1 = ex.ini.split(":"), h2 = ex.fim.split(":"), total = 0;
  var d = new Date(ini); d.setHours(0,0,0,0);
  for(var n=0; n<400 && d.getTime()<=fim; n++){
    if(ex.dias.indexOf(d.getDay())>=0){
      var a = new Date(d); a.setHours(+h1[0], +h1[1]||0, 0, 0); var b = new Date(d); b.setHours(+h2[0], +h2[1]||0, 0, 0);
      var x = Math.max(ini, a.getTime()), y = Math.min(fim, b.getTime());
      if(y>x) total += (y-x) - Math.min(y-x, ocupadoEm(cid, x, y));
    }
    d.setDate(d.getDate()+1);
  }
  return total;
}
// horário de trabalho de cada pessoa: o padrão do Configurador (expediente + almoço) ou o que a Direção ajustou para ela
var ALMOCO_PADRAO = {ini:"12:00", fim:"13:00"};
// horário que vem do cadastro do RH (entrada e escala de cada colaborador); App.js atualiza a cada mudança do RH. Vale para quem não tem ajuste próprio.
var HOR_RH = {}, HOR_RH_LISTA = null;
function definirHorariosRh(lista){
  if(lista===HOR_RH_LISTA) return; HOR_RH_LISTA = lista; var m = {}, porNome = {};
  CONTATOS.forEach(function(c){ porNome[sem(c.completo)] = c.id; });
  (lista||[]).forEach(function(x){ var cid = porNome[sem(x.nome)]; if(cid) m[cid] = {ini:x.ini, fim:x.fim, dias:x.dias}; });
  HOR_RH = m;
}
// quem trabalha 24 horas, todos os dias (sem almoço): o Marcus (pedido dele, 29/10/2026). Vale quando não há ajuste próprio.
var TRABALHA_24H = ["Marcus Vinicius Hess de Oliveira"];
var H24 = {ini:"00:00", fim:"23:59", sexIni:"00:00", sexFim:"23:59", almIni:"00:00", almFim:"00:00", dias:[0,1,2,3,4,5,6], proprio:false, temRh:false, h24:true};
function horarioDe(cid){
  if(!(estado.horarios||{})[cid] && TRABALHA_24H.some(function(n){ var c = CONTATOS.find(function(x){ return x.id===cid; }); return !!c && c.completo===n; })) return H24;
  var ex = estado.config.expediente, al = ex.almoco || ALMOCO_PADRAO, proprio = (estado.horarios||{})[cid], h = proprio || HOR_RH[cid] || {};
  return {ini:h.ini||ex.ini, fim:h.fim||ex.fim, sexIni:h.sexIni||h.ini||ex.ini, sexFim:h.sexFim||h.fim||ex.fim, almIni:h.almIni||al.ini, almFim:h.almFim||al.fim, dias:h.dias||ex.dias, proprio:!!proprio, temRh:!!HOR_RH[cid]};
}
function minDe(t){ var p = String(t).split(":"); return (+p[0])*60 + (+p[1]||0); }
/** como a pessoa está agora: trabalhando, em almoço, fora do expediente ou de folga (domingo/dia sem expediente) */
function situacaoAgora(cid){
  var h = horarioDe(cid), d = new Date(), agora = d.getHours()*60 + d.getMinutes();
  if(h.dias.indexOf(d.getDay())<0) return {tipo:"folga", texto:"Hoje não trabalha"};
  if(d.getDay()===5) h = Object.assign({}, h, {ini:h.sexIni, fim:h.sexFim});   // sexta tem horário próprio
  if(agora>=minDe(h.almIni) && agora<minDe(h.almFim)) return {tipo:"almoco", texto:"Em horário de almoço", volta:h.almFim};
  if(agora<minDe(h.ini)) return {tipo:"fora", texto:"Ainda não começou o expediente", volta:h.ini};
  if(agora>=minDe(h.fim)) return {tipo:"fora", texto:"Expediente encerrado"};
  return {tipo:"trabalhando", texto:"Em horário de trabalho"};
}
function setHorario(cid, patch){ mudar(function(s){ var o = Object.assign({}, s.horarios); o[cid] = Object.assign({}, o[cid] || HOR_RH[cid], patch); return Object.assign({}, s, {horarios:o}); }); }
function limparHorario(cid){ mudar(function(s){ var o = Object.assign({}, s.horarios); delete o[cid]; return Object.assign({}, s, {horarios:o}); }); }
function prazoDe(cid){ var c = estado.config, st = contato(cid).setor; return (c.prazos[st]!=null ? c.prazos[st] : c.prazoPadrao); }

// ---------- auxiliares de conversa ----------
function convPorId(id){ return estado.convs.find(function(c){ return c.id===id; }); }
// Conversas paralelas: um grupo (conv.paralelas) tem a aba "geral" e uma aba por funcionária (m.aba = id da funcionária; sem m.aba = geral).
// A funcionária vê o Geral e a dela; supervisor(a) e direção veem todas. Cada aba tem seu histórico e seu contador de não lidas.
function abaDaMsg(m){ return m.aba || "geral"; }
function abasDe(conv, cid){
  if(!conv || !conv.paralelas) return null;
  var f = conv.funcionarias || [], sup = (conv.supervisores||[]).indexOf(cid)>=0;
  if(ehDirecaoCid(cid) || sup) return ["geral"].concat(f);
  if(f.indexOf(cid)>=0) return ["geral", cid];
  return ["geral"];
}
function chaveLido(conv, aba){ return aba && aba!=="geral" ? conv.id+"|"+aba : conv.id; }
function lidoEm(cid, conv, aba){ var m = estado.lido[cid], k = chaveLido(conv, aba); return m && m[k]!==undefined ? m[k] : (conv.base!=null ? conv.base : conv.criada); }
function naoLidasAba(convId, cid, aba){ var c = convPorId(convId); if(!c) return 0; var ld = lidoEm(cid, c, aba); return (estado.msgs[convId]||[]).filter(function(m){ return abaDaMsg(m)===aba && m.t>ld && m.de!==cid && m.apag!=="todos" && visivelPara(m, cid); }).length; }
function pendentesAba(convId, cid, aba){ return (estado.msgs[convId]||[]).filter(function(m){ return abaDaMsg(m)===aba && m.tipo==="decisao" && m.dec && m.dec.estado==="pendente" && m.apag!=="todos" && m.dec.decisores.indexOf(cid)>=0; }).length; }
function visivelPara(m, cid){ return !(m.apagPara && m.apagPara[cid]); }
function tituloDe(conv, cid){ if(conv.tipo==="grupo") return conv.nome;
  if(conv.tipo==="setor") return cid===conv.repId ? conv.nome : contato(conv.repId).completo.split(" ")[0]+" · "+conv.nome; var o = conv.membros.find(function(x){ return x!==cid; }) || conv.membros[0]; return contato(o).titulo; }
function temRep(conv){ return conv.membros.some(function(id){ return contato(id).tipo==="rep"; }); }
function textoPrevia(m){
  if(!m) return ""; if(m.apag==="todos") return "🚫 Mensagem apagada";
  if(m.tipo==="audio") return "🎤 Mensagem de voz"; if(m.tipo==="imagem") return "📷 "+(m.texto||"Foto");
  if(m.tipo==="arquivo") return "📎 "+((m.midia&&m.midia.nome)||"Arquivo"); if(m.tipo==="decisao") return m.dec.tipo==="pagamento" ? "💰 Pagamento: "+m.dec.nome : m.dec.tipo==="preco" ? "📋 Preço: "+m.dec.modelo : "📋 "+m.dec.titulo+": "+contato(m.dec.pessoa).nome; return m.texto;
}

// ---------- respostas simuladas dos colegas (só demonstração; depois vem do servidor) ----------
var RESPOSTAS = ["Oi! Já vi aqui 👍","Pode deixar, já resolvo.","Certo, obrigada!","Vou verificar e te aviso.","Ok! 😊","Combinado.","Um minutinho que já te respondo.","Perfeito, pode seguir.","Entendi! Vou cuidar disso agora.","Show, valeu!","Já estou vendo isso."];
var RESP_PERG = ["Sim, pode ser.","Acho que sim, vou confirmar e te falo.","Pode, sim! 😊","Ainda não, mas já estou vendo."];
function simular(convId, textoOriginal, tipo, de, aba){
  if(SERVIDOR) return;   // respostas de mentira só existem na demonstração
  var conv = convPorId(convId); if(!conv || !de) return;
  var quem, texto, ehSetor = conv.tipo==="setor", abaFunc = conv.paralelas && aba && aba!=="geral";
  if(ehSetor){
    if(de!==conv.repId) return;                                  // só responde à representante
    var at = conv.atendente;
    // o atendente ficou ausente: a conversa volta para a fila do setor
    if(at && estaOcupado(at)){ atualizarGrupo(convId, {atendente:null}); avisoSistema(convId, contato(at).nome+" está ausente. A conversa voltou para a fila do setor."); at = null; }
    var extrasA = conv.canal==="agendamento" ? extrasAgend() : [], disp = conv.membros.filter(function(x){ return x!==conv.repId && extrasA.indexOf(x)<0 && !estaOcupado(x); });
    if(at) quem = at; else if(disp.length) quem = disp[Math.floor(Math.random()*disp.length)];
    else { setTimeout(function(){ avisoSistema(convId, "Ninguém do setor está disponível agora. Sua mensagem ficou na fila e será respondida assim que possível."); }, 700); return; }
    var lista = RESPOSTAS_CANAL[conv.canal] || RESPOSTAS, n = (estado.msgs[convId]||[]).filter(function(x){ return x.de===quem; }).length;
    texto = lista[Math.min(n, lista.length-1)];
    if(/oi chata/i.test(textoOriginal||"")) texto = "Chata é você, vá fazer acertos 😂";   // resposta combinada para a gravação de tela do Marcus (24/10/2026)
  } else if(abaFunc){
    // aba de uma funcionária: se ela escreve, quem decide responde; se escreve a direção/supervisão, ela responde
    if(de===aba){ var dec = ["Marcus","Anamaria","Lucas"].map(function(n){ return idPorNome(n); }).filter(function(x){ return x && x!==de && conv.membros.indexOf(x)>=0; }); if(!dec.length) return; quem = dec[Math.floor(Math.random()*dec.length)]; }
    else quem = aba;
    texto = tipo==="audio" ? "Ouvi o áudio! Já te respondo por aqui." : tipo==="imagem" ? "Recebi a foto, obrigada!" : tipo==="arquivo" ? "Recebi o arquivo, vou dar uma olhada." : RESPOSTAS[Math.floor(Math.random()*RESPOSTAS.length)];
  } else {
    var outros = conv.membros.filter(function(x){ return x!==de && contato(x).tipo==="func" || (x!==de && estado.config.representantes); });
    if(!outros.length) return;
    if(conv.tipo==="dm") quem = outros[0];
    else { if(Math.random()<0.35) return; quem = outros[Math.floor(Math.random()*outros.length)]; }
    texto = tipo==="audio" ? "Ouvi o áudio! Já te respondo por aqui." : tipo==="imagem" ? "Recebi a foto, obrigada!" : tipo==="arquivo" ? "Recebi o arquivo, vou dar uma olhada." :
      (/\?\s*$/.test(textoOriginal||"") ? RESP_PERG[Math.floor(Math.random()*RESP_PERG.length)] : RESPOSTAS[Math.floor(Math.random()*RESPOSTAS.length)]);
  }
  var espera = 1200 + Math.random()*1500, digita = 1500 + Math.min(4000, texto.length*60);
  setTimeout(function(){ marcarDigitando(convId, quem, true); }, espera);
  setTimeout(function(){
    marcarDigitando(convId, quem, false);
    // quem responde primeiro pega a conversa
    if(ehSetor && !convPorId(convId).atendente){ atualizarGrupo(convId, {atendente:quem}); avisoSistema(convId, contato(quem).nome+" assumiu a conversa"); }
    var resp = {id:uid("m"), de:quem, t:Date.now(), tipo:"texto", texto:texto, status:"lido", reacoes:{}, mencoes:[]}; if(abaFunc) resp.aba = aba;
    inserir(convId, resp);
    // a resposta deixa a mensagem original como lida
    mudar(function(s){ var l = (s.msgs[convId]||[]).map(function(m){ return m.de===de && m.status!=="lido" ? Object.assign({}, m, {status:"lido"}) : m; }); return Object.assign({}, s, {msgs:Object.assign({}, s.msgs, (function(){ var o = {}; o[convId] = l; return o; })())}); });
  }, espera + digita);
}
function marcarDigitando(convId, cid, ligado){
  var d = Object.assign({}, estado.efem.digitando), l = (d[convId]||[]).filter(function(x){ return x!==cid; });
  if(ligado) l.push(cid); d[convId] = l; efem({digitando:d});
}

// põe a mensagem no estado, fecha menções respondidas, toca som e avisa quem não está olhando
function inserir(convId, msg){
  var conv = convPorId(convId); if(!conv) return;
  mudar(function(s){ var o = {}; o[convId] = (s.msgs[convId]||[]).concat([msg]); return Object.assign({}, s, {msgs:Object.assign({}, s.msgs, o)}); });
  // menção respondida: a pessoa marcada escreveu na conversa
  var fecharQuem = msg.de, t = msg.t;
  var abertas = estado.mencoes.filter(function(m){ return m.conv===convId && m.para===fecharQuem && !m.resp && m.em<=t; });
  if(abertas.length){
    mudar(function(s){ return Object.assign({}, s, {mencoes:s.mencoes.map(function(m){ return abertas.indexOf(m)>=0 ? Object.assign({}, m, {resp:t, tempoMs:tempoUtil(m.em, t, m.para)}) : m; })}); });
    if(fecharQuem===eu) tocar("concluir");
  }
  var abasEu = abasDe(conv, eu);
  if(msg.de!==eu && eu && conv.membros.indexOf(eu)>=0 && (!abasEu || abasEu.indexOf(abaDaMsg(msg))>=0)){
    var meMarcou = (msg.mencoes||[]).indexOf(eu)>=0, aberta = estado.efem.aberta===convId && (!conv.paralelas || (estado.efem.abaAberta||"geral")===abaDaMsg(msg)) && !document.hidden;
    if(notifLer().chat){ if(meMarcou) tocar("mencao"); else tocar("receber"); }   // som só com as notificações do chat ligadas
    if(!aberta){
      var toast = {id:uid("t"), conv:convId, titulo:tituloDe(conv, eu), sub:(conv.tipo==="grupo" ? contato(msg.de).nome+": " : "")+textoPrevia(msg), mencao:meMarcou};
      efem({toasts:estado.efem.toasts.concat([toast]).slice(-3)});
      setTimeout(function(){ efem({toasts:estado.efem.toasts.filter(function(x){ return x.id!==toast.id; })}); }, 6000);
    } else markRead(eu, convId, msg.aba);
  }
}

// ---------- API (o que o servidor vai substituir) ----------
function listaConversas(cid, opc){
  opc = opc || {}; var s = estado, dir = !!opc.todas, rep = s.config.representantes;
  var r = s.convs.filter(function(c){
    if(!dir && c.membros.indexOf(cid)<0) return false;
    if(!dir && c.tipo==="setor" && (c.canal==="agendamento" || c.canal==="cadastro") && cid!==c.repId) return false;
    if(!rep && temRep(c)) return false;
    if(c.tipo==="setor" && !(s.msgs[c.id]||[]).length) return false;
    return (s.msgs[c.id]||[]).length>0 || c.criada>Date.now()-DIA || ehConvMarcus(c, cid);
  }).map(function(c){
    var abasV = abasDe(c, cid), ld = lidoEm(cid, c);
    var ms = (s.msgs[c.id]||[]).filter(function(m){ return visivelPara(m, cid) && (!abasV || abasV.indexOf(abaDaMsg(m))>=0); }), ult = ms[ms.length-1];
    var nl = abasV ? ms.filter(function(m){ return m.t>lidoEm(cid, c, abaDaMsg(m)) && m.de!==cid && m.apag!=="todos"; }) : ms.filter(function(m){ return m.t>ld && m.de!==cid && m.apag!=="todos"; });
    var nlRep = c.reps ? s.convs.reduce(function(t, cc){ return t + (cc.tipo==="setor" && cc.canal===(c.repCanal||"agendamento") && cc.membros.indexOf(cid)>=0 ? (s.msgs[cc.id]||[]).filter(function(m){ return m.t>lidoEm(cid, cc) && m.de!==cid && m.apag!=="todos"; }).length : 0); }, 0) : 0;
    return {conv:c, titulo:tituloDe(c, cid), ultima:ult||null, naoLidas:nl.length+nlRep, marcado:nl.some(function(m){ return (m.mencoes||[]).indexOf(cid)>=0; }),
      marcus:ehConvMarcus(c, cid), fixa:ehConvMarcus(c, cid) || !!(c.fixaPor && c.fixaPor[cid]), arq:!ehConvMarcus(c, cid) && !!(c.arqPor && c.arqPor[cid]), pendencia:pendenciaDe(cid, c.id), membro:c.membros.indexOf(cid)>=0,
      pendentes:ms.filter(function(m){ return m.tipo==="decisao" && m.dec && m.dec.estado==="pendente" && m.apag!=="todos" && m.dec.decisores.indexOf(cid)>=0; }).length};
  });
  r.sort(function(a,b){ return (b.marcus?1:0)-(a.marcus?1:0) || (b.pendentes>0?1:0)-(a.pendentes>0?1:0) || (b.fixa?1:0)-(a.fixa?1:0) || ((b.ultima?b.ultima.t:b.conv.criada) - (a.ultima?a.ultima.t:a.conv.criada)); });
  return r;
}
function totalNaoLidas(cid){ return listaConversas(cid).reduce(function(t,x){ return t + x.naoLidas; }, 0); }
function mensagens(convId, cid){ return (estado.msgs[convId]||[]).filter(function(m){ return visivelPara(m, cid); }); }

function sendMessage(p){
  var conv = convPorId(p.conv); if(!conv) return null;
  if(SERVIDOR && p.midia){ var dm = lerMidia(p.midia.key); if(dm && dm.length>3600000){ if(typeof window!=="undefined") window.alert("Esse arquivo é grande demais para o chat (máximo uns 2,5 MB). Reduza e envie de novo."); return null; } }
  var msg = {id:uid("m"), de:p.eu, t:Date.now(), tipo:p.tipo||"texto", texto:p.texto||"", midia:p.midia||null, resp:p.resp||null, enc:!!p.enc, dec:p.dec||null, status:"enviado", reacoes:{}, mencoes:p.mencoes||[]};
  if(p.aba && p.aba!=="geral") msg.aba = p.aba;
  if(p.porDir) msg.porDir = p.porDir;   // a Direção respondeu no lugar da representante (marcado com quem respondeu)
  inserir(p.conv, msg); tocar("enviar");
  mudar(function(s){ return Object.assign({}, s, {lido:Object.assign({}, s.lido, (function(){ var o = {}; o[p.eu] = Object.assign({}, s.lido[p.eu], (function(){ var q = {}; q[chaveLido(convPorId(p.conv), p.aba)] = msg.t; return q; })()); return o; })())}); });
  (p.mencoes||[]).forEach(function(para){ if(para!==p.eu) startMention({conv:p.conv, msg:msg.id, de:p.eu, para:para, em:msg.t}); });
  setTimeout(function(){ alterarMsg(p.conv, msg.id, function(m){ return m.status==="enviado" ? Object.assign({}, m, {status:"entregue"}) : m; }); }, 800);
  // setor: quem da equipe responde primeiro pega a conversa
  var cv = convPorId(p.conv);
  if(cv.tipo==="setor" && p.eu!==cv.repId && !cv.atendente){ atualizarGrupo(cv.id, {atendente:p.eu}); avisoSistema(cv.id, contato(p.eu).nome+" assumiu a conversa"); }
  simular(p.conv, p.texto, msg.tipo, p.eu, p.aba);
  return msg;
}
function alterarMsg(convId, msgId, fn){
  mudar(function(s){ var o = {}; o[convId] = (s.msgs[convId]||[]).map(function(m){ return m.id===msgId ? fn(m) : m; }); return Object.assign({}, s, {msgs:Object.assign({}, s.msgs, o)}); });
}
function markRead(cid, convId, aba){
  var conv = convPorId(convId); if(!conv) return; aba = conv.paralelas ? (aba || "geral") : null;
  var ms = (estado.msgs[convId]||[]).filter(function(m){ return !aba || abaDaMsg(m)===aba; }), ult = ms.length ? ms[ms.length-1].t : Date.now(), k = chaveLido(conv, aba);
  var atual = estado.lido[cid] && estado.lido[cid][k]; if(atual!==undefined && atual>=ult) return;
  mudar(function(s){ var o = {}; o[cid] = Object.assign({}, s.lido[cid], (function(){ var q = {}; q[k] = ult; return q; })()); return Object.assign({}, s, {lido:Object.assign({}, s.lido, o)}); });
}
function react(convId, msgId, cid, emoji){
  alterarMsg(convId, msgId, function(m){ var r = Object.assign({}, m.reacoes); if(r[cid]===emoji) delete r[cid]; else r[cid] = emoji; return Object.assign({}, m, {reacoes:r}); });
}
function pinMessage(convId, msgId){ alterarMsg(convId, msgId, function(m){ return Object.assign({}, m, {fixa:!m.fixa}); }); }
function pinConversation(cid, convId){
  mudar(function(s){ return Object.assign({}, s, {convs:s.convs.map(function(c){ if(c.id!==convId) return c; var f = Object.assign({}, c.fixaPor); if(f[cid]) delete f[cid]; else f[cid] = true; return Object.assign({}, c, {fixaPor:f}); })}); });
}
function arquivarConversa(cid, convId){
  var c0 = convPorId(convId); if(!c0) return false;
  if(!(c0.arqPor && c0.arqPor[cid]) && pendenciaDe(cid, convId)) return false;   // com pendência não arquiva: resolva primeiro
  mudar(function(s){ return Object.assign({}, s, {convs:s.convs.map(function(c){ if(c.id!==convId) return c; var f = Object.assign({}, c.arqPor); if(f[cid]) delete f[cid]; else f[cid] = true; return Object.assign({}, c, {arqPor:f}); })}); });
  return true;
}
function editMessage(convId, msgId, texto){ alterarMsg(convId, msgId, function(m){ return Object.assign({}, m, {texto:texto, ed:true}); }); }
function deleteMessage(convId, msgId, cid, paraTodos){
  alterarMsg(convId, msgId, function(m){
    if(paraTodos) return Object.assign({}, m, {apag:"todos", texto:"", midia:null, fixa:false});
    return Object.assign({}, m, {apagPara:Object.assign({}, m.apagPara, (function(){ var o = {}; o[cid] = true; return o; })())});
  });
}
function abrirDm(cid, outro){
  var id = "dm_"+[cid,outro].sort().join("_");
  if(!convPorId(id)) mudar(function(s){ return Object.assign({}, s, {convs:s.convs.concat([{id:id, tipo:"dm", nome:"", membros:[cid,outro], admins:[], criada:Date.now(), base:Date.now(), fixaPor:{}}]), msgs:Object.assign({}, s.msgs, (function(){ var o = {}; o[id] = []; return o; })())}); });
  return id;
}
// Pagamentos do atendimento interno: cada pedido (s.lancFin, um registro só) vira um cartão na aba da funcionária, no grupo "Atendimento Interno".
// O cartão lê o registro ao vivo (definir contas, comprovante, conferência); aqui só guardamos a mensagem e o estado (pendente/confirmada/cancelada) para o contador de urgentes.
function sincronizarPagamento(lf){
  if(lf.origem==="func") return;   // pagamento de funcionária fica só no Controle de pagamentos
  var gid = lf.origem==="rep" ? "c_finrep" : "c_atend", conv = convPorId(gid); if(!conv) return;
  var id = estado.pagamentosPostados[lf.id], novo = lf.cancelado ? "cancelada" : lf.conferido ? "confirmada" : "pendente";
  if(!id){
    var por = idPorNome(String(lf.por||"").split(" ")[0]);
    if(!por || (conv.funcionarias||[]).indexOf(por)<0) por = null;
    var marca = function(v){ mudar(function(s){ var o = Object.assign({}, s.pagamentosPostados); o[lf.id] = v; return Object.assign({}, s, {pagamentosPostados:o}); }); };
    if(novo!=="pendente"){ marca("-"); return; }                       // já nasceu resolvido: não precisa de cartão
    var msg = {id:uid("m"), de:por || (conv.funcionarias||[])[0] || conv.membros[0], t:lf.enviadoTs || Date.now(), tipo:"decisao", texto:"", status:"lido", reacoes:{}, mencoes:[],
      dec:{tipo:"pagamento", titulo:"Solicitação de pagamento", refId:lf.id, nome:lf.nome, decisores:(lf.origem==="rep" ? ["Lucas","Nayale","Bruna","Anamaria","Marcus"] : ["Marcus","Anamaria","Lucas"]).map(function(n){ return idPorNome(n); }).filter(Boolean), estado:"pendente"}};
    if(por) msg.aba = por;
    marca(msg.id); inserir(gid, msg); return;
  }
  if(id==="-") return;
  var m0 = (estado.msgs.c_atend||[]).find(function(x){ return x.id===id; });
  if(m0 && m0.dec.estado!==novo){
    alterarMsg(gid, id, function(x){ return Object.assign({}, x, {dec:Object.assign({}, x.dec, {estado:novo})}); });
    avisoSistema(gid, "Pagamento de "+lf.nome+": "+(novo==="confirmada" ? "confirmado" : novo==="cancelada" ? "cancelado" : "reaberto"), m0.aba);
  }
}
function pendencias(cid){   // visão consolidada: tudo que espera a decisão desta pessoa, em todos os grupos
  var r = [];
  Object.keys(estado.msgs).forEach(function(cv){ (estado.msgs[cv]||[]).forEach(function(m){
    if(m.tipo==="decisao" && m.dec && m.dec.estado==="pendente" && m.apag!=="todos" && m.dec.decisores.indexOf(cid)>=0) r.push({conv:cv, msg:m}); }); });
  return r.sort(function(a,b){ return a.msg.t-b.msg.t; });
}
// cartão de decisão: o RH (ou qualquer setor) manda uma situação pronta e quem decide confirma ou pede mais informações.
// extra: no cartão de preço, {preco, tag}. Cada peça aprovada entra em state.pecas com código em sequência (P-0001…) — base do futuro Cadastro de peças.
function decidir(convId, msgId, cid, acao, extra){
  var msg = (estado.msgs[convId]||[]).find(function(x){ return x.id===msgId; });
  if(!msg || !msg.dec || msg.dec.estado!=="pendente" || msg.dec.decisores.indexOf(cid)<0) return;
  var d = msg.dec, ehPreco = d.tipo==="preco", ehPag = false, assunto = ehPreco ? "o "+d.modelo : ehPag ? "o pagamento de "+d.nome : contato(d.pessoa).nome;
  if(acao==="confirmar"){
    var agora = Date.now(), patch = {estado:"confirmada", por:cid, em:agora}, aviso;
    if(ehPreco){
      var codigo = "P-"+String((estado.pecas||[]).length+1).padStart(4,"0"), preco = (extra&&extra.preco) || d.preco, tag = (extra&&extra.tag) || "Sem tag", mk = markup(preco, d.custo);
      patch = Object.assign(patch, {precoFinal:preco, tag:tag, codigo:codigo, markupFinal:mk});
      mudar(function(s){ return Object.assign({}, s, {pecas:(s.pecas||[]).concat([{codigo:codigo, modelo:d.modelo, custo:d.custo, qtd:d.qtd, fornecedor:d.fornecedor, preco:preco, markup:mk, tag:tag, foto:d.foto, por:cid, em:agora, msg:msgId}])}); });
      aviso = contato(cid).nome+" aprovou o preço do "+d.modelo+": "+BRL(preco)+" · "+tag+" · código "+codigo;
    } else {
      mudar(function(s){ var o = Object.assign({}, s.decisoes); o[d.pessoa+"|"+d.tipo] = {por:cid, em:agora, msg:msgId}; return Object.assign({}, s, {decisoes:o}); });
      aviso = contato(cid).nome+" confirmou: "+d.titulo+" de "+contato(d.pessoa).nome;
    }
    alterarMsg(convId, msgId, function(x){ return Object.assign({}, x, {dec:Object.assign({}, x.dec, patch)}); });
    tocar("concluir"); avisoSistema(convId, aviso);
  } else {
    alterarMsg(convId, msgId, function(x){ return Object.assign({}, x, {dec:Object.assign({}, x.dec, {infoPedida:true})}); });
    sendMessage({conv:convId, eu:cid, texto:ehPreco ? "Preciso de mais informações sobre "+assunto+" antes de definir o preço. Pode detalhar?" : ehPag ? "Preciso de mais informações sobre "+assunto+" antes de conferir. Pode detalhar?" : "Preciso de mais informações sobre "+assunto+" antes de decidir. Pode detalhar?", resp:msgId});
  }
}
function abrirCanal(repCid, canalId, extra){
  var id = "cn_"+canalId+"_"+repCid, c = canal(canalId);
  if(!convPorId(id)) mudar(function(s){ var o = {}; o[id] = [];
    return Object.assign({}, s, {convs:s.convs.concat([{id:id, tipo:"setor", canal:canalId, repId:repCid, nome:c.nome, membros:canalId==="agendamento" ? membrosAgend(repCid) : canalId==="r_rep" ? [repCid].concat(extra||[]) : [repCid].concat(membrosDoCanal(canalId)), admins:[], atendente:null, criada:Date.now(), base:Date.now(), fixaPor:{}}]), msgs:Object.assign({}, s.msgs, o)}); });
  return id;
}
function criarGrupo(p){
  var id = uid("g_");
  mudar(function(s){ var o = {}; o[id] = [];
    return Object.assign({}, s, {convs:s.convs.concat([{id:id, tipo:"grupo", nome:p.nome, descr:p.descr||"", foto:p.foto||null, membros:[p.eu].concat(p.membros.filter(function(x){ return x!==p.eu; })), admins:[p.eu], criada:Date.now(), base:Date.now(), fixaPor:{}}]), msgs:Object.assign({}, s.msgs, o)}); });
  inserir(id, {id:uid("m"), de:p.eu, t:Date.now(), tipo:"sistema", texto:contato(p.eu).nome+" criou o grupo \""+p.nome+"\"", status:"lido", reacoes:{}, mencoes:[]});
  return id;
}
function atualizarGrupo(convId, patch){ mudar(function(s){ return Object.assign({}, s, {convs:s.convs.map(function(c){ return c.id===convId ? Object.assign({}, c, patch) : c; })}); }); }
// Aviso automático no grupo Agendamento: uma vez por dia (quantos atendimentos há) e a cada cancelamento novo
function avisoAgenda(dia, lista){
  if(!convPorId("c_agend_at")) return;
  var ativos = lista.filter(function(x){ return x.data===dia; }), canc = ativos.filter(function(x){ return x.status==="cancelado"; }), a = estado.avisoAgend || {dia:null, canc:[]};
  var primeiraVez = a.dia!==dia, novos = canc.filter(function(x){ return (primeiraVez ? [] : a.canc).indexOf(x.id)<0; });
  if(!primeiraVez && !novos.length) return;
  var n = ativos.length - canc.length;
  if(primeiraVez) avisoSistema("c_agend_at", "☀️ Bom dia! Hoje temos "+n+(n===1 ? " atendimento" : " atendimentos")+" no atendimento interno.");
  novos.forEach(function(x){ avisoSistema("c_agend_at", "⚠️ Cancelamento: "+x.nome+" ("+(x.hora||"sem hora")+") não vem mais hoje. Ficam "+n+(n===1 ? " atendimento." : " atendimentos.")); });
  mudar(function(s){ return Object.assign({}, s, {avisoAgend:{dia:dia, canc:canc.map(function(x){ return x.id; })}}); });
}
function avisoSistema(convId, texto, aba){ var msg = {id:uid("m"), de:"sistema", t:Date.now(), tipo:"sistema", texto:texto, status:"lido", reacoes:{}, mencoes:[]}; if(aba && aba!=="geral") msg.aba = aba; inserir(convId, msg); }
function membroAdd(convId, quem, por){ var c = convPorId(convId); if(c.membros.indexOf(quem)>=0) return; atualizarGrupo(convId, {membros:c.membros.concat([quem])}); avisoSistema(convId, contato(por).nome+" adicionou "+contato(quem).nome); }
function membroRemover(convId, quem, por){ var c = convPorId(convId); atualizarGrupo(convId, {membros:c.membros.filter(function(x){ return x!==quem; }), admins:c.admins.filter(function(x){ return x!==quem; })}); avisoSistema(convId, quem===por ? contato(quem).nome+" saiu do grupo" : contato(por).nome+" removeu "+contato(quem).nome); }
function adminAlternar(convId, quem){ var c = convPorId(convId); atualizarGrupo(convId, {admins:c.admins.indexOf(quem)>=0 ? c.admins.filter(function(x){ return x!==quem; }) : c.admins.concat([quem])}); }

// ---------- cobrança de resposta ----------
function startMention(p){
  var m = {id:uid("mn"), conv:p.conv, msg:p.msg, de:p.de, para:p.para, setor:contato(p.para).setor, em:p.em||Date.now(), prazo:prazoDe(p.para), resp:null, tempoMs:null, alertado:false};
  mudar(function(s){ return Object.assign({}, s, {mencoes:s.mencoes.concat([m])}); }); return m;
}
function answerMention(mencaoId){
  var t = Date.now();
  mudar(function(s){ return Object.assign({}, s, {mencoes:s.mencoes.map(function(m){ return m.id===mencaoId && !m.resp ? Object.assign({}, m, {resp:t, tempoMs:tempoUtil(m.em, t, m.para)}) : m; })}); });
}
function marcarAlertada(id){ mudar(function(s){ return Object.assign({}, s, {mencoes:s.mencoes.map(function(m){ return m.id===id ? Object.assign({}, m, {alertado:true}) : m; })}); }); }
function mencaoAtraso(m){ return !m.resp && tempoUtil(m.em, Date.now(), m.para) > m.prazo*MIN; }
function inicioPeriodo(filtro){
  var d = new Date(); d.setHours(0,0,0,0);
  if(filtro==="hoje") return d.getTime(); if(filtro==="7d") return d.getTime()-6*DIA;
  if(filtro==="mes"){ d.setDate(1); return d.getTime(); } if(filtro==="ano"){ d.setMonth(0,1); return d.getTime(); } return 0;
}
function getResponseStats(filtro){
  var ini = inicioPeriodo(filtro||"7d"), lista = estado.mencoes.filter(function(m){ return m.em>=ini; }), agora = Date.now();
  var porPessoa = {}, porSetor = {};
  var somar = function(mapa, chave, rot, m, tempo){
    var o = mapa[chave] || (mapa[chave] = {chave:chave, rotulo:rot, n:0, resp:0, semResp:0, soma:0, min:null, max:null, estourou:0});
    o.n++;
    if(m.resp){ o.resp++; o.soma += tempo; o.min = o.min==null ? tempo : Math.min(o.min, tempo); o.max = o.max==null ? tempo : Math.max(o.max, tempo); if(tempo>m.prazo*MIN) o.estourou++; }
    else { o.semResp++; if(tempoUtil(m.em, agora, m.para)>m.prazo*MIN) o.estourou++; }
  };
  lista.forEach(function(m){ var t = m.resp ? (m.tempoMs!=null ? m.tempoMs : m.resp-m.em) : 0; somar(porPessoa, m.para, contato(m.para).nome, m, t); somar(porSetor, m.setor||"—", m.setor||"—", m, t); });
  var fim = function(mapa){ return Object.keys(mapa).map(function(k){ var o = mapa[k]; o.media = o.resp ? o.soma/o.resp : null; return o; }); };
  var pessoas = fim(porPessoa), setores = fim(porSetor), resp = pessoas.filter(function(o){ return o.resp>0; });
  var geralSoma = 0, geralN = 0; lista.forEach(function(m){ if(m.resp){ geralSoma += (m.tempoMs!=null?m.tempoMs:m.resp-m.em); geralN++; } });
  var ord = resp.slice().sort(function(a,b){ return a.media-b.media; });
  return {total:lista.length, respondidas:geralN, semResposta:lista.filter(function(m){ return !m.resp; }).length, media:geralN?geralSoma/geralN:null,
    maisRapido:ord[0]||null, maisLento:ord[ord.length-1]||null, pessoas:pessoas.sort(function(a,b){ return (a.media==null)-(b.media==null) || a.media-b.media; }), setores:setores.sort(function(a,b){ return (a.media==null)-(b.media==null) || a.media-b.media; })};
}

// ---------- perfil, presença, configurações ----------
function setFundo(cid, id){ mudar(function(s){ var u = Object.assign({}, s.usuarios); u[cid] = Object.assign({}, u[cid], {fundo:id}); return Object.assign({}, s, {usuarios:u}); }); }
function fundoDe(cid){ var u = estado.usuarios[cid]; return (u && u.fundo && u.fundo!=="joias-ouro" && u.fundo) || "whatsapp-claro"; }   // "joias-ouro" era o padrão antigo (escuro): vira o WhatsApp claro
function setFoto(cid, url){
  // também vai para o servidor, para todos verem a foto (a cópia local fica de reserva)
  var pid = pessoaDoContato(cid); if(pid!=null && apiAtiva() && token() && (!url || String(url).indexOf("data:")===0)) enviarFotoPessoa(pid, url || null, cid===eu).catch(function(){});
  mudar(function(s){ var u = Object.assign({}, s.usuarios); u[cid] = Object.assign({}, u[cid], {foto:url}); return Object.assign({}, s, {usuarios:u}); }); }
// fotos oficiais já salvas no projeto (public/fotos); a troca feita na tela vale por cima delas
var FOTOS_PADRAO = {f_marianacardosodealmeida:"fotos/mariana-cardoso.jpg", f_tamaramarquesdegouveia:"fotos/tamara-gouveia.jpg", f_anamariadivinodasilva:"fotos/ana-maria-agendamento.jpg", f_rayssaalessandraingatain:"fotos/rayssa.jpg", f_camillydesousamaciel:"fotos/camilly.jpg", f_lucasoliveiradarocha:"fotos/lucas.jpg", f_nickolasgabriellealneves:"fotos/nickolas.jpg", f_michelebritolimacassemiro:"fotos/michele.jpg", f_leonardo:"fotos/leonardo.jpg", f_sthafanymarquesdeaquinocorrea:"fotos/sthefany.jpg", f_amandademirandagoncalves:"fotos/amanda-miranda.jpg", f_deysianeportuguesdasilva:"fotos/deysiane.jpg", f_anabeatrizhessdeoliveira:"fotos/ana-beatriz.jpg"};
function fotoDe(cid){ var pid = pessoaDoContato(cid), srv = pid!=null ? fotoDoServidor(pid) : null; if(srv) return srv;   // foto do perfil (servidor): todos veem a de todos
  var u = estado.usuarios[cid]; if(u && u.foto) return lerMidia(u.foto) || (u.foto.indexOf("data:")===0 ? u.foto : null); if(u && u.foto===null) return null; return FOTOS_PADRAO[cid] ? ("/"||"/")+FOTOS_PADRAO[cid] : null; }
// motivo "almoco" expira sozinho 1h depois (Marcus, 27/10/2026): "Ficar ocupado" (sem motivo) fica até a pessoa voltar na mão
function setOcupado(cid, ligado, motivo){
  mudar(function(s){ var o = Object.assign({}, s.ocupado), a = o[cid] || {desde:null, motivo:null, ate:null, periodos:[]}, agora = Date.now();
    if(ligado && !a.desde) a = {desde:agora, motivo:motivo||null, ate:motivo==="almoco" ? agora+HORA : null, periodos:a.periodos};
    if(!ligado && a.desde) a = {desde:null, motivo:null, ate:null, periodos:a.periodos.concat([[a.desde, agora]])};
    o[cid] = a; return Object.assign({}, s, {ocupado:o}); });
}
function estaOcupado(cid){
  var o = estado.ocupado[cid]; if(!o || !o.desde) return false;
  if(o.ate && Date.now()>=o.ate){ setTimeout(function(){ setOcupado(cid, false); }, 0); return false; }   // o almoço venceu: fecha sozinho na próxima leitura
  return true;
}
function motivoOcupado(cid){ return estaOcupado(cid) ? (estado.ocupado[cid].motivo || "ocupado") : null; }
function setConfig(p){ mudar(function(s){ return Object.assign({}, s, {config:Object.assign({}, s.config, p)}); }); }
function online(cid){ return cid===eu || (presenca(cid).online && !estaOcupado(cid)); }
function restaurarDemo(){ try{ localStorage.removeItem(CHAVE); localStorage.removeItem(CHAVE_MIDIA); }catch(x){} location.reload(); }

// ---------- acompanhamento: status, espera e alertas das conversas (representantes e conversas diretas) ----------
// Estados: aberta = a última palavra foi de quem espera resposta · aguardando = a equipe respondeu, falta a representante · resolvida = alguém deu OK.
// A espera conta só o horário de expediente (tempoUtil). Faixas de alerta: 2h, 4h, 8h e 24h sem resposta.
var FAIXAS_H = [2,4,8,24];
function faixaDe(ms){ var n = 0; FAIXAS_H.forEach(function(h, i){ if(ms>=h*HORA) n = i+1; }); return n; }
function msgsReais(convId){ return (estado.msgs[convId]||[]).filter(function(x){ return x.tipo!=="sistema" && x.apag!=="todos"; }); }
function acompanhar(c, agora){
  agora = agora || Date.now();
  if(c.tipo!=="setor" && c.tipo!=="dm") return null;
  var ms = msgsReais(c.id); if(!ms.length) return null;
  var ult = ms[ms.length-1], res = c.resolvidaEm || 0, extras = c.canal==="agendamento" ? extrasAgend() : [], resp, desde = null, pend = 0, estadoC, setor;
  if(c.tipo==="setor"){
    var equipe = c.membros.filter(function(x){ return x!==c.repId && extras.indexOf(x)<0; });
    resp = c.atendente ? [c.atendente] : equipe; setor = (canal(c.canal)||{}).nome || "Setor";
    if(ult.de===c.repId && ult.t>res){ estadoC = "aberta"; for(var i=ms.length-1; i>=0 && ms[i].de===c.repId && ms[i].t>res; i--){ pend++; desde = ms[i].t; } }
    else estadoC = res && res>=ult.t ? "resolvida" : "aguardando";
  } else {
    var outro = c.membros.find(function(x){ return x!==ult.de; }); if(!outro) return null;
    resp = [outro]; setor = contato(outro).setor || "—";
    estadoC = "aberta"; for(var j=ms.length-1; j>=0 && ms[j].de===ult.de; j--){ pend++; desde = ms[j].t; }
    if(res && res>=ult.t) estadoC = "resolvida";
  }
  var espera = estadoC==="aberta" ? tempoUtil(desde, agora, resp[0]) : 0;
  return {conv:c, tipo:c.tipo, estado:estadoC, pend:pend, desde:desde, espera:espera, nivel:estadoC==="aberta" ? faixaDe(espera) : 0, resp:resp, setor:setor};
}
function statusConv(convId){ var c = convPorId(convId); return c ? acompanhar(c) : null; }
function resolverConversa(convId, cid, nota){
  var c = convPorId(convId); if(!c) return;
  atualizarGrupo(convId, {resolvidaEm:Date.now(), resolvidaPor:cid, resolucao:nota||"", pendenteManual:null});
  avisoSistema(convId, "✓ "+contato(cid).nome+" deu OK e resolveu a conversa"+(nota ? ": "+nota : ""));
  tocar("concluir");
}
// Pendência da conversa para uma pessoa: decisão esperando, marcada como pendente à mão, ou mensagem esperando a resposta dela. Devolve o motivo ("" = sem pendência).
function pendenciaDe(cid, convId){
  var c = convPorId(convId); if(!c) return "";
  var dec = (estado.msgs[convId]||[]).filter(function(m){ return m.tipo==="decisao" && m.dec && m.dec.estado==="pendente" && m.apag!=="todos" && m.dec.decisores.indexOf(cid)>=0; }).length;
  if(dec) return "tem "+dec+(dec===1 ? " decisão esperando você" : " decisões esperando você");
  if(c.pendenteManual) return "foi marcada como pendente por "+contato(c.pendenteManual.por).nome.split(" ")[0];
  var t = acompanhar(c); if(t && t.estado==="aberta" && t.resp.indexOf(cid)>=0) return "tem mensagem esperando a sua resposta";
  return "";
}
function marcarPendente(convId, cid){
  var c = convPorId(convId); if(!c) return;
  atualizarGrupo(convId, {pendenteManual:{por:cid, em:Date.now()}, resolvidaEm:0, resolucao:""});
  avisoSistema(convId, "⏳ "+contato(cid).nome+" marcou a conversa como pendente");
}
// alertas novos para quem é o responsável (faixas 1 e 2) e também para a Direção (faixas 3 e 4); cada faixa avisa uma vez por espera
function verificarAlertas(cid){
  var agora = Date.now(), feitas = estado.alertadasConv || {}, novos = [], marcar = {};
  estado.convs.forEach(function(c){ var t = acompanhar(c, agora); if(!t || t.estado!=="aberta" || t.nivel<1) return;
    var meu = t.resp.indexOf(cid)>=0, dir = ehDirecaoCid(cid) && t.nivel>=3; if(!meu && !dir) return;
    var chave = c.id+"|"+t.desde+"|"+cid+"|"+t.nivel; if(feitas[chave]) return;
    marcar[chave] = 1; novos.push(t); });
  if(novos.length) mudar(function(s){ return Object.assign({}, s, {alertadasConv:Object.assign({}, s.alertadasConv||{}, marcar)}); });
  return novos;
}
// consolidado dos setores: conversas em aberto, alertas por faixa, resolvidas e tempo médio de resposta (só expediente)
function ciclosDe(c){
  var ms = msgsReais(c.id), out = [], ini = null, run = null;
  if(c.tipo==="setor"){
    var extras = c.canal==="agendamento" ? extrasAgend() : [];
    ms.forEach(function(x){ if(x.de===c.repId){ if(ini===null) ini = x.t; } else if(ini!==null){ out.push({ini:ini, fim:x.t, quem:x.de}); ini = null; } });
    if(ini!==null) out.push({ini:ini, fim:null, quem:c.atendente || c.membros.find(function(x){ return x!==c.repId && extras.indexOf(x)<0; })});
  } else {
    ms.forEach(function(x){ if(x.de!==run){ if(run!==null && ini!==null) out.push({ini:ini, fim:x.t, quem:x.de}); ini = x.t; run = x.de; } });
    if(ini!==null){ var outro = c.membros.find(function(x){ return x!==run; }); if(outro) out.push({ini:ini, fim:null, quem:outro}); }
  }
  return out;
}
function consolidadoSetores(filtro){
  var ini = inicioPeriodo(filtro||"7d"), agora = Date.now(), mapa = {};
  var no = function(nome){ var k = String(nome).toLowerCase(); return mapa[k] || (mapa[k] = {setor:nome, abertas:0, aguardando:0, resolvidas:0, faixas:[0,0,0,0], maisAntiga:0, ciclos:0, respondidos:0, soma:0, sem:0}); };
  estado.convs.forEach(function(c){
    var t = acompanhar(c, agora); if(!t) return;
    var o = no(t.setor);
    if(t.estado==="aberta"){ o.abertas++; if(t.nivel>0) for(var k=0;k<t.nivel;k++) o.faixas[k]++; o.maisAntiga = Math.max(o.maisAntiga, t.espera); }
    else if(t.estado==="aguardando") o.aguardando++;
    if(c.tipo==="setor" && c.resolvidaEm && c.resolvidaEm>=ini) o.resolvidas++;
    ciclosDe(c).forEach(function(y){ if(y.ini<ini) return; o.ciclos++; if(y.fim){ o.respondidos++; o.soma += tempoUtil(y.ini, y.fim, y.quem); } else o.sem++; });
  });
  return Object.keys(mapa).map(function(k){ var o = mapa[k]; o.media = o.respondidos ? o.soma/o.respondidos : null; return o; })
    .sort(function(a,b){ return b.abertas-a.abertas || (b.maisAntiga-a.maisAntiga); });
}

var api = {statusConv:statusConv, resolveConv:resolverConversa, checkAlerts:verificarAlertas, sectorSummary:consolidadoSetores, getConversations:listaConversas, getMessages:mensagens, sendMessage:sendMessage, markRead:markRead, react:react, pin:{mensagem:pinMessage, conversa:pinConversation}, arquivar:arquivarConversa, pendencia:pendenciaDe, markPending:marcarPendente,
  startMention:startMention, answerMention:answerMention, getResponseStats:getResponseStats, openDm:abrirDm, decide:decidir, syncPayment:sincronizarPagamento, avisoAgenda:avisoAgenda, pendencias:pendencias, openChannel:abrirCanal, createGroup:criarGrupo, updateGroup:atualizarGrupo,
  addMember:membroAdd, removeMember:membroRemover, toggleAdmin:adminAlternar, editMessage:editMessage, deleteMessage:deleteMessage, setConfig:setConfig, setFoto:setFoto, setFundo:setFundo, setSchedule:setHorario, clearSchedule:limparHorario, setBusy:setOcupado};
if(typeof window!=="undefined" && (process.env.NODE_ENV !== "production")) window.__chatApi = api;   // só no desenvolvimento: ajuda a testar pelo console

// ---------- SERVIDOR (27/10/2026): conversas e mensagens guardadas no banco, para as pessoas conversarem de verdade ----------
// Cada mudança local (mensagem nova, reação, edição, conversa nova) vai para uma fila e é enviada ao servidor; a cada 4 segundos a tela pergunta o que veio de novo (seq = número de ordem).
var midiasEnviadas = {};   // chaves de mídia que já subiram para o servidor nesta sessão
function diferencas(antes, depois){
  if(antes===depois || !eu) return;
  var cvAntes = {}; antes.convs.forEach(function(c){ cvAntes[c.id] = c; });
  depois.convs.forEach(function(c){ if(cvAntes[c.id]!==c && (c.membros||[]).indexOf(eu)>=0) fila.push({t:"conv", conv:c}); });   // conversa vai antes das mensagens dela
  Object.keys(depois.msgs).forEach(function(cid){
    var nova = depois.msgs[cid], velha = antes.msgs[cid]; if(nova===velha) return;
    var mapa = {}; (velha||[]).forEach(function(m){ mapa[m.id] = m; });
    nova.forEach(function(m){ var o = mapa[m.id]; if(o===m) return; if(!o){ if(m.de===eu){ if(m.midia && m.midia.key && /^md_/.test(m.midia.key) && !midiasEnviadas[m.midia.key]) fila.push({t:"midia", conv:cid, key:m.midia.key}); fila.push({t:"msg", conv:cid, msg:m}); } } else fila.push({t:"patch", conv:cid, msg:m}); });
  });
  if(fila.length) setTimeout(esvaziar, 60);
}
function esvaziar(){
  if(enviando || !fila.length || !token()) return;
  enviando = true;
  var it = fila[0];
  var req = it.t==="midia" ? (function(){ var u = lerMidia(it.key); return u ? chamar("POST", "/chat/midia", {key:it.key, url:u}).then(function(){ midiasEnviadas[it.key] = true; }) : Promise.resolve(); })() : it.t==="conv" ? chamar("POST", "/chat/conv", {conv:it.conv}) : it.t==="msg" ? chamar("POST", "/chat/msg", {conv:it.conv, msg:it.msg}) : chamar("PATCH", "/chat/msg/"+encodeURIComponent(it.msg.id), {dados:it.msg});
  req.then(function(){ fila.shift(); enviando = false; esvaziar(); })
    .catch(function(x){ enviando = false; if(/Sem conexão|Algo deu errado/.test(x.message||"")) setTimeout(esvaziar, 4000); else { fila.shift(); esvaziar(); } });   // sem rede: tenta de novo; recusa do servidor: descarta
}
// aviso do próprio navegador/Windows quando a aba do sistema está escondida (precisa da permissão, pedida na primeira vez que a pessoa clica para escrever)
function avisoDoNavegador(titulo, texto){
  try { if(!document.hidden || !notifLer().chat || typeof Notification==="undefined" || Notification.permission!=="granted") return;
    var n = new Notification(titulo, {body:texto, tag:"sorellychat"}); n.onclick = function(){ window.focus(); n.close(); }; } catch(x){}
}
function pedirPermissaoAviso(){ try { if(typeof Notification!=="undefined" && Notification.permission==="default") Notification.requestPermission(); } catch(x){} }
function notificarRecebida(convId, msg){
  var conv = convPorId(convId); if(!conv) return;
  if(minhaSituacao()!=="disponivel") return;   // em reunião ou ausente (só Marcus, Nickolas e Lucas): silêncio total
  var meMarcou = (msg.mencoes||[]).indexOf(eu)>=0, deMarcus = !!MARCUS_CID && msg.de===MARCUS_CID && eu!==MARCUS_CID, grande = meMarcou || deMarcus;
  var aberta = estado.efem.aberta===convId && !document.hidden;
  if(aberta){ markRead(eu, convId, msg.aba); return; }
  if(notifLer().chat){ if(grande) tocar("mencao"); else tocar("receber"); }   // mensagem comum também toca o som normal e mostra o aviso (Marcus, 29/10/2026: funcionários precisam perceber a mensagem)
  if(!grande) efem({pulso:Date.now()});
  avisoDoNavegador(tituloDe(conv, eu), (conv.tipo==="grupo" ? contato(msg.de).nome+": " : "")+textoPrevia(msg));
  var toast = {id:uid("t"), conv:convId, titulo:tituloDe(conv, eu), sub:(conv.tipo==="grupo" ? contato(msg.de).nome+": " : "")+textoPrevia(msg), mencao:meMarcou, grande:grande, de:msg.de, nome:contato(msg.de).nome, texto:msg.texto||textoPrevia(msg), deMarcus:deMarcus};
  efem({toasts:estado.efem.toasts.concat([toast]).slice(-3)});
  setTimeout(function(){ efem({toasts:estado.efem.toasts.filter(function(x){ return x.id!==toast.id; })}); }, grande ? 9000 : 7000);   // todos os avisos são o modelo 1 (Marcus, 29/10/2026) e somem sozinhos
}
function aplicarServidor(r, primeira){
  var novas = [];
  aplicando = true;
  try {
    mudar(function(s){
      var convs = s.convs.slice(), idx = {}; convs.forEach(function(c, i){ idx[c.id] = i; });
      (r.convs||[]).forEach(function(c){ if(idx[c.id]!==undefined) convs[idx[c.id]] = c; else { idx[c.id] = convs.length; convs.push(c); } });
      var msgs = Object.assign({}, s.msgs), lido = s.lido;
      (r.msgs||[]).forEach(function(x){
        var l = (msgs[x.conv]||[]).slice(), i = l.findIndex(function(m){ return m.id===x.dados.id; });
        if(i>=0) l[i] = x.dados; else { l.push(x.dados); if(x.dados.de!==eu) novas.push({conv:x.conv, msg:x.dados}); }
        msgs[x.conv] = l.sort(function(a, b){ return a.t-b.t; });
      });
      if(primeira){ var o = Object.assign({}, lido[eu]), agora = Date.now(); convs.forEach(function(c){ o[c.id] = agora; }); lido = Object.assign({}, lido); lido[eu] = o; }   // primeira vez neste navegador: o que já existia conta como lido
      return Object.assign({}, s, {convs:convs, msgs:msgs, lido:lido, seqSrv:r.seq});
    });
  } finally { aplicando = false; }
  if(!primeira) novas.forEach(function(n){ notificarRecebida(n.conv, n.msg); });
}
function sincronizar(){
  if(!SERVIDOR || !token() || !eu) return Promise.resolve();
  esvaziar();
  return chamar("GET", "/chat/sync?desde="+seqServidor).then(function(r){
    if(r.semContato) return;
    var primeira = seqServidor===0;
    aplicarServidor(r, primeira); seqServidor = r.seq;
  }).catch(function(){});
}
// Liga a troca com o servidor (uma vez). Se outra pessoa entrou neste navegador, o chat começa do zero para ela.
function iniciarServidor(){
  if(!SERVIDOR || !token() || !eu) return function(){};
  if(estado.contaChat && estado.contaChat!==eu){
    aplicando = true; try{ mudar(function(s){ return Object.assign({}, s, {convs:[], msgs:{}, lido:{}, mencoes:[], seqSrv:0}); }); } finally { aplicando = false; }
  }
  aplicando = true; try{ mudar(function(s){ return Object.assign({}, s, {contaChat:eu}); }); } finally { aplicando = false; }
  seqServidor = estado.seqSrv || 0;
  if(MARCUS_CID && eu!==MARCUS_CID) abrirDm(eu, MARCUS_CID);   // todo mundo já tem a conversa com o Marcus
  if(timerSync) return function(){};
  timerSync = setInterval(sincronizar, 4000); sincronizar();
  return function(){ clearInterval(timerSync); timerSync = null; };
}

export { pedirPermissaoAviso, iniciarServidor, FAIXAS_H, faixaDe, acompanhar, abaDaMsg, abasDe, naoLidasAba, pendentesAba, api, fundoDe, horarioDe, definirHorariosRh, situacaoAgora, useChat, definirEu, euAgora, efem, convPorId, tituloDe, lidoEm, textoPrevia, tempoUtil, prazoDe, mencaoAtraso, marcarAlertada, guardarMidia, lerMidia, fotoDe, estaOcupado, motivoOcupado, online, totalNaoLidas, restaurarDemo, listaConversas, mensagens, temRep, MIN, HORA, DIA, uid };

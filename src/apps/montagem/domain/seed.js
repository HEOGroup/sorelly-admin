// Sorelly Admin · montagem e bipagem — domain/seed.js
// Extraído de sorelly_admin_montagem_bipagem.html sem alterar o corpo das funções.
import { BIPADORAS, KITNOVO, MONTADORAS } from "@/apps/montagem/domain/equipe";
import { SEM_KIT } from "@/apps/montagem/domain/status";
import { vendasPara } from "@/apps/montagem/domain/vendas";
import { hoje, isoDia } from "@/apps/montagem/lib/format";

var AROS = ["14 a 17","16 a 19","17 a 20","15 a 18","12 a 16"];
var OURO = [30,50,60,70,80,20];
var EVITAR = ["Sem pe\u00e7as religiosas","Sem infantil","Sem pe\u00e7as pesadas",null,null,"Prefere pe\u00e7as de luxo"];
var seq = 0;
function kit(lid, rev, bairro, alvo, prio, ex){
  seq++; ex = ex || {};
  var nv = ex.nv===undefined ? 3 : ex.nv;
  var k = {
    id:"K"+seq, lid:lid, rev:rev, bairro:bairro, endereco:ex.endereco||null, prio:!!prio, tipo:ex.tipo||"ac_kit",
    vendas: vendasPara(alvo, nv, seq),
    valor: ex.sem ? null : (ex.manual || alvo), manual: !!ex.manual,
    defPor: ex.sem ? null : 11, defEm: ex.sem ? null : hoje(7, 30+(seq%25)),
    pref:{aro:AROS[seq%5], ouro:OURO[seq%6], evitar:EVITAR[seq%6], enc:seq%4},
    status: ex.sem ? "semvalor" : "pendente", designada:null, motivo:null, ajustes:0,
    montId:null, iniM:null, fimM:null, pausaMs:0, pausadoEm:null, tempoM:null, supId:null, supEm:null,
    bipId:null, iniB:null, fimB:null, valorReal:null, divReg:false, corrigido:false,
    retEm:null, retPor:null, ultimaHora:false, atrasado:!!ex.atrasado, aval:null
  };
  if(ex.st){ Object.assign(k, ex.st); if(k.fimM && k.iniM) k.tempoM = k.fimM - k.iniM; }
  return k;
}
// Márcia Camargo (Dayanne): acerto normal ("Acerto + kit", não é visita de kit novo), para testar a calculadora com venda de R$ 12.268,00
function kitNormalDayanne(l){
  var k = kit(l.id, "Márcia Camargo", "Batel", 14000, 0, {endereco:"Rua Fictícia T, 77 - Batel, Curitiba - PR", tipo:"ac_kit"}); k.id = "KDAY1"; l.n = (l.n||0)+1;
  Object.assign(k, {montId:MONTADORAS[0].id, bipId:BIPADORAS[0].id, cond:{nums:["093801","093802"], pegas:true, chkB:{"093801":true, "093802":true}, impressas:{}, novas:[]}, tipoKit:"acerto_kit", status:"retirado", ordem:l.n, retEm:Date.now()-3000000, retPor:11, horaAtend:"10:30", fone:"(41) 00000-0077", vendas:[]});
  return k;
}
var PERFIL_MARCIA = {profissao:"Lojista", enderecoTrabalho:"Loja Márcia Acessórios · Rua XV de Novembro, 640 - Centro, Curitiba - PR", condicionaisAbertas:[{numero:"093801", pecas:140}, {numero:"093802", pecas:90}]};
function novoDia(){
  seq = 0;
  var dataHoje = isoDia(new Date());
  // Base de demonstração (08/10/2026, pedido do Marcus): 4 representantes reais (Dayanne, Lysie, Jessica e Thalita), 1 listagem de hoje cada,
  // com 3 acertos A REALIZAR por representante (12 no total). Nada montado nem bipado, pra testar o fluxo do zero.
  // Cada representante fecha 10 revendedoras de demonstração: 5 acertos feitos + 3 a realizar + 2 kits novos (acertos-demo.js).
  var REPS = [["Dayanne","10:00"],["Lysie","10:00"],["Jessica","15:00"],["Thalita","11:00"]];
  var BAIRROS = ["Tatuquara","Cabral","Cristo Rei","Uberaba","Boa Vista","Portão","Água Verde","Xaxim","Boqueirão","Batel","Santa Felicidade","Bacacheri"];
  // as revendedoras a realizar de cada representante (nome, bairro, valor do kit, prioridade, endereço) — as da Dayanne têm perfil/endereço nos apps de demonstração
  var FIXOS = {
    Dayanne:[["Andrielle Taborda","Tatuquara",12000,1,"Rua Enette Dubard, 1150 - Tatuquara, Curitiba - PR"],["Silvana Ramos","Sítio Cercado",8000,1,"Rua Padre Anchieta, 1785 - Bigorrilho, Curitiba - PR"]],   // a 3ª da Dayanne é a Beatriz Nogueira (kit novo, mais abaixo)
    Lysie:[["Ronice Kaminski","Portão",10000,1,"Rua Fictícia W, 140 - Portão, Curitiba - PR"],["Cláudia Wosniak","Água Verde",12000,1,"Rua Fictícia W, 260 - Água Verde, Curitiba - PR"]],   // 2 acertos a realizar; os kits novos e a reposição da Lysie vêm mais abaixo
    Jessica:[["Elisângela Faria","Boqueirão",12000,1,null],["Rosângela Pinto","Xaxim",8000,1,null],["Tânia Brandão","Uberaba",7000,0,null],["Priscila Menezes","Cristo Rei",11000,0,null]],
    Thalita:[["Alana Couto","Batel",8000,1,null],["Bárbara Siqueira","Bacacheri",10000,0,null],["Dalila Vieira","Santa Felicidade",9000,0,null]]
  };
  var L = [], K = [], g = 0;
  REPS.forEach(function(r, ri){
    var id = "L"+(ri+1);
    L.push({id:id, rep:r[0], destino:"Curitiba", viagem:false, horario:r[1], data:dataHoje, fechada:false, retiradas:[]});
    FIXOS[r[0]].forEach(function(fx){
      K.push(kit(id, fx[0], fx[1] || BAIRROS[g%12], fx[2], fx[3], fx[4] ? {endereco:fx[4]} : {})); g++;
    });
  });
  K.forEach(function(k){ var l=L.find(function(x){return x.id===k.lid;}); l.n=(l.n||0)+1; k.ordem=l.n; });
  // Metade dos kits do dia já vem com o valor calculado (simula quem a Deysiane já processou hoje,
  // incluindo condicional já conferida); a outra metade fica pendente de verdade, pra testar o "Definir".
  K.forEach(function(k, i){ if(k.status==="pendente" && i%2!==0){ k.valor = null; k.manual = false; k.defPor = null; k.defEm = null; k.status = "semvalor"; } });
  // Desligado por pedido do Marcus (2026-09-28): antes, essa parte "adiantava" boa parte dos kits do
  // dia pra "bipado" sozinha, pulando a Calculadora. Agora só ficam com valor pronto os que já vêm
  // com etapa avançada escrita explicitamente ali em cima (ex.st) — o resto fica pendente de verdade,
  // pra testar o "Definir" em quase todas as revendedoras do dia.
  // var bipsD = [9,10,12,13,14,15], nb = 0, hm2 = function(t){ return hoje(Math.floor(t/60), t%60); };
  // K.forEach(function(k, i){ if((k.status==="pendente" || k.status==="semvalor") && i%2===0 && i%7!==6){ var mi = 6*60+30+nb*4, bi = mi+32;
  //   if(!k.valor){ k.valor = 6000 + (i%4)*2000; k.defPor = 11; k.defEm = hm2(mi-10); }
  //   Object.assign(k, {status:"bipado", montId:1+(nb%8), iniM:hm2(mi), fimM:hm2(mi+28), bipId:bipsD[nb%6], iniB:hm2(bi), fimB:hm2(bi+5), valorReal:k.valor+((i%3)-1)*150});
  //   k.tempoM = k.fimM - k.iniM; nb++; } });
  K.forEach(function(k, i){ if(k.status==="montando"){ k.iniM = Date.now() - (6 + i%14)*60000; } if(k.status==="bipando"){ k.iniB = Date.now() - (2 + i%5)*60000; } });
  // Tipo de cada item da listagem e condicionais (números vêm da DevMaster; por enquanto digitados)
  var CICLO = ["acerto_kit","acerto_kit","acerto_kit","acerto_kit_exp","acerto_kit","acerto_kit"];   // só acertos a realizar (os kits novos têm a lista deles em acertos-demo.js)
  K.forEach(function(k, i){
    var livre = k.status==="pendente" || k.status==="semvalor";
    k.tipoKit = CICLO[i % CICLO.length];
    if(SEM_KIT[k.tipoKit] && !livre) k.tipoKit = "acerto_kit";
    if(k.tipoKit.indexOf("kit_novo")===0){
      k.vendas = [];            // revendedora nova: sem vendas, valor já vem do setor Kit novo
      // Não passa pela Calculadora: o valor já chegou pronto do Kit novo (NOVA_INCLUIR faz isso de verdade; aqui é só simular)
      if(k.status==="semvalor"){ k.valor = 6000 + (i%4)*2000; k.status = "pendente"; k.manual = false; k.defPor = KITNOVO.id; k.defEm = hoje(7, 30+(i%25)); }
    }
    var nc = k.tipoKit.indexOf("acerto")===0 ? (i===4 ? 5 : 1+(i%3)) : SEM_KIT[k.tipoKit] ? 1+(i%2) : 0;   // às vezes são 5 condicionais
    var nums = []; for(var j=0;j<nc;j++) nums.push(String(12000 + i*137 + j*29).padStart(6,"0"));
    // previsão de devolução: das peças, sempre pertinho (a DevMaster só traz o que vence nos próximos 90 dias);
    // a do expositor é marcada anos pra frente, de propósito, pra não aparecer misturada num acerto comum
    var prev = {}; nums.forEach(function(n, j){ prev[n] = new Date(Date.now() + (10 + j*20)*86400000).toISOString(); });
    var temExp = k.tipoKit.indexOf("_exp")>=0;
    if(temExp){ var numExp = String(19000 + i*89).padStart(6,"0"); nums.push(numExp); prev[numExp] = new Date(Date.now() + 1100*86400000).toISOString(); }
    var pronto = ["montado","bipando","bipado","retirado","supervisao"].indexOf(k.status)>=0;
    var fechado = ["bipado","retirado"].indexOf(k.status)>=0, chkB = {};
    if(fechado) nums.forEach(function(n){ chkB[n] = true; });
    // nova condicional: normalmente uma, às vezes várias
    var novas = fechado ? [String(12500 + i*211).padStart(6,"0")].concat(i%4===0 ? [String(12520 + i*211).padStart(6,"0")] : []) : [];
    k.cond = {nums:nums, prev:prev, pegas: pronto && nc>0, chkM:{}, chkB:chkB, chkP: fechado ? nums.reduce(function(o,n){o[n]=true; return o;},{}) : {}, faltas:{}, impressas:{}, novas:novas};
    // ainda não começou e tem condicional pra conferir: fica esperando a funcionária de condicionais liberar
    // (quem já tem valor calculado — metade par — já passou por tudo isso hoje, não gate de novo)
    if(!SEM_KIT[k.tipoKit] && livre && nc>0) k.status = "precond";
    if(SEM_KIT[k.tipoKit]){ k.status = "condicional"; k.valor = null; k.prio = false; k.vendas = []; }
    // horário de atendimento da revendedora (a representante organiza pelo app): a partir das 13:00, de 30 em 30 min
    var min = 13*60 + (k.ordem-1)*30; k.horaAtend = String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0");
    // dados da revendedora que aparecem no app da representante (demonstração)
    k.fone = "(41) 9"+String(8800+i*37).slice(0,4)+"-"+String(1000+i*271).slice(-4);
  });
  // Já deixa 2 revendedoras pendentes de análise de vendas na demonstração (pra não abrir a tela vazia)
  var precisamAnalise = 2;
  K.forEach(function(k){ if(precisamAnalise>0 && k.status==="pendente" && k.valor>2500 && (k.tipoKit||"").indexOf("kit_novo")!==0){
    k.analiseVendas = {obrigatoria:true, enviada:false, media:k.valor}; precisamAnalise--; } });
  // A 3ª da Dayanne é uma revendedora NOVA (Beatriz Nogueira), com o kit novo liberado para entregar: serve para testar a entrega feita junto com a revendedora
  var l1 = L.find(function(x){ return x.id==="L1"; });
  if(l1){ var kn = kit("L1", "Beatriz Nogueira", "Centro", 7000, 0, {endereco:"Rua Fictícia S, 210 - Centro, Curitiba - PR", tipo:"ac_kit"});
    l1.n = (l1.n||0)+1;
    Object.assign(kn, {montId:MONTADORAS[0].id, bipId:BIPADORAS[0].id, cond:{nums:["094501","094502"], pegas:true, chkB:{"094501":true, "094502":true}, impressas:{}, novas:[]}, tipoKit:"kit_novo", status:"retirado", ordem:l1.n, retEm:Date.now()-3600000, retPor:11, horaAtend:"11:30", fone:"(41) 00000-0088", vendas:[]});
    K.push(kn);
    // Vanessa Prado: REPOSIÇÃO pronta (montada, bipada e retirada) para a Dayanne entregar pelo app: conta as peças, a condicional assinada sobe nas condicionais da revendedora e a comissão é de R$ 20,00
    var kr = kit("L1", "Vanessa Prado", "Portão", 2500, 0, {endereco:"Rua Fictícia R, 88 - Portão, Curitiba - PR", tipo:"ac_kit"});
    l1.n = (l1.n||0)+1;
    Object.assign(kr, {montId:MONTADORAS[0].id, bipId:BIPADORAS[0].id, cond:{nums:["094601"], pegas:true, chkB:{"094601":true}, impressas:{}, novas:[]}, tipoKit:"reposicao", status:"retirado", ordem:l1.n, retEm:Date.now()-3000000, retPor:11, horaAtend:"12:00", fone:"(41) 00000-0099", vendas:[]});
    K.push(kr);
    K.push(kitNormalDayanne(l1)); }
  // Maria Eduarda de Almeida: kit novo de teste da CONFERÊNCIA DAS PEÇAS COM A CÂMERA (condicional 00558 real + 2 inventadas; ver domain/conferencia-pecas.js).
  // Bipado na empresa pela Sthefany (id 14) e montado pela Jenifer (id 5), como no impresso.
  if(l1){ var km = kit("L1", "Maria Eduarda de Almeida", "Cajuru", 7000, 0, {endereco:"Rua Major Antonio Ribeiro Vidal, 34 - Cajuru, Curitiba - PR", tipo:"ac_kit"});
    l1.n = (l1.n||0)+1;
    Object.assign(km, {montId:5, bipId:14, iniB:"11:05", fimB:"11:20", cond:{nums:["00558"], pegas:true, chkB:{"00558":true}, impressas:{}, novas:[]}, tipoKit:"kit_novo", status:"retirado", ordem:l1.n, retEm:Date.now()-3600000, retPor:11, horaAtend:"13:00", fone:"(41) 00000-0099", vendas:[]});
    K.push(km); }
  // Lysie (L2): 2 KITS NOVOS e 1 REPOSIÇÃO já retirados da empresa, prontos para ela entregar pelo app (mesmo caminho da Beatriz e da Vanessa, da Dayanne)
  var l2 = L.find(function(x){ return x.id==="L2"; });
  if(l2){
    [["Sabrina Lopes","Portão",7000,"Rua Fictícia X, 310 - Portão, Curitiba - PR","kit_novo","11:00",["094701","094702"],"(41) 00000-0101"],
     ["Kátia Moreira","Água Verde",7000,"Rua Fictícia Y, 55 - Água Verde, Curitiba - PR","kit_novo_exp","11:30",["094711","094712"],"(41) 00000-0102"],
     ["Vera Lúcia Moraes","Cabral",2500,"Rua Fictícia Z, 88 - Cabral, Curitiba - PR","reposicao","12:00",["094721"],"(41) 00000-0103"]].forEach(function(x){
      var kk = kit("L2", x[0], x[1], x[2], 0, {endereco:x[3], tipo:"ac_kit"}); l2.n = (l2.n||0)+1;
      Object.assign(kk, {montId:MONTADORAS[1].id, bipId:BIPADORAS[1].id, cond:{nums:x[6], pegas:true, chkB:x[6].reduce(function(o, n){ o[n] = true; return o; }, {}), impressas:{}, novas:[]}, tipoKit:x[4], status:"retirado", ordem:l2.n, retEm:Date.now()-3000000, retPor:11, horaAtend:x[5], fone:x[7], vendas:[]});
      K.push(kk); }); }
  return {listagens:L, kits:K};
}
var REGISTROS0 = [
  {tipo:"aval", montId:8, rev:"Valdirene Lemke", nota:1, obs:"Mandaram um monte de anel do 7 ao 12, serve pra quem? Minha maleta t\u00e1 muito inferior.", dia:"22/09"},
  {tipo:"aval", montId:4, rev:"Nat\u00e1lia Prestes", nota:2, obs:"N\u00e3o veio nada do que pedi nas encomendas.", dia:"21/09"},
  {tipo:"aval", montId:7, rev:"Gisele Andrade", nota:2, obs:"Pedi 80% prata e veio quase tudo dourado.", dia:"20/09"},
  {tipo:"aval", montId:8, rev:"Tain\u00e1 Rocha", nota:2, obs:"Marquei sem religioso no app e vieram 5 pe\u00e7as religiosas.", dia:"19/09"},
  {tipo:"aval", montId:2, rev:"Patrícia Martins", nota:3, obs:"Pedi pe\u00e7as de luxo e s\u00f3 veio ponto de luz.", dia:"18/09"},
  {tipo:"div", montId:8, rev:"Luciana Ribeiro", esperado:8000, real:11400, pct:42.5, dia:"23/09"},
  {tipo:"div", montId:4, rev:"Aline Castro", esperado:10000, real:12600, pct:26, dia:"23/09"},
  {tipo:"div", montId:7, rev:"Cleide Barros", esperado:12000, real:9100, pct:-24.2, dia:"22/09"},
  {tipo:"div", montId:8, rev:"Regina Matos", esperado:10000, real:12900, pct:29, dia:"22/09"}
];
var CONSOLIDADO_REPS = [
  {rep:"Dayanne", kits:142, nota:4.3, top:"Pamela"},
  {rep:"Lysie", kits:128, nota:4.1, top:"Paula"},
  {rep:"Jessica", kits:118, nota:3.9, top:"Ivanete"},
  {rep:"Thalita", kits:104, nota:4.2, top:"Paula"},
  {rep:"Demais 21 representantes", kits:462, nota:4.0, top:"Pamela"}
];
var HISTORICO0 = [
  {mes:"Agosto de 2026", total:2984.40, pagoEm:"15/09/2026", situacao:"Pago"},
  {mes:"Julho de 2026", total:2810.20, pagoEm:"15/08/2026", situacao:"Pago"}
];
function histDemo(){
  var reps = [["Dayanne","Curitiba",false,"10:00",5],["Lysie","Curitiba",false,"10:00",4],
              ["Jessica","Curitiba",false,"15:00",5],["Thalita","Curitiba",false,"11:00",4]];
  var nomes = ["Ana Paula Ribeiro","Bianca Moraes","Cristiane Lopes","Daiane Freitas","Edna Carvalho","Fabiana Rocha","Gislaine Prado","Helena Duarte",
    "Ingrid Macedo","Joana Pires","Kelly Andrade","Luciane Brito","Marta Siqueira","Neide Fontes","Olga Teles","Patrícia Nunes","Raquel Viana","Sandra Melo",
    "Tatiana Rezende","Valéria Goulart","Pietra Amaral","Roberta Cunha","Simone Dias","Larissa Queiroz"];
  var tamanhos = [5,7,8,12], valores = [5000,6000,8000,10000,12000,15000,17000,20000];
  var out = [], hoje0 = new Date(); hoje0.setHours(0,0,0,0);
  var hm = function(ts){ var d = new Date(ts); return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0"); };
  reps.forEach(function(r, i){
    for(var n=0; n<r[4]; n++){
      var dias = 2 + n*4 + i;                     // uma listagem a cada ~4 dias
      var dt = new Date(hoje0.getTime() - dias*86400000); if(dt.getDay()===0) dt = new Date(dt.getTime() - 86400000);
      var qtd = tamanhos[(n+i)%tamanhos.length], hh = +r[3].split(":")[0], base = dt.getTime() + (hh-3)*3600000, ks = [];
      for(var j=0;j<qtd;j++){
        var v = valores[(n*3+i*2+j*5)%valores.length], tm = (22 + (n+j*3)%25)*60000, tb = (3 + (i+j)%6)*60000;
        var fimM = base + j*18*60000 + tm, fimB = fimM + 10*60000 + tb, div = (n+i+j)%13===0;
        var tp = ["acerto_kit","acerto_kit","kit_novo","acerto_kit_exp","acerto_kit","kit_novo_exp","acerto_kit","condicional","reposicao","acerto_kit","saiu"][(n+i*3+j)%11];
        var nc = tp.indexOf("acerto")===0 ? 1+(j%3) : SEM_KIT[tp] ? 1 : 0, nums = [];
        for(var q=0;q<nc;q++) nums.push(String(11000 + i*977 + n*131 + j*37 + q*7).padStart(6,"0"));
        var semKit = !!SEM_KIT[tp], chkB = {}, imps = {};
        nums.forEach(function(x, q){ chkB[x] = true; if((i+n+j+q)%17===0) imps[x] = {por:11}; });
        if(tp==="reposicao") v = 1500 + (j%3)*500;
        ks.push({rev:nomes[(i*7+n*5+j)%nomes.length], prio:!semKit && j<1+(n+i)%2, valor:semKit?null:v, real: semKit?null: div ? Math.round(v*1.24) : v + ((j%3)-1)*200, div:!semKit && div,
          tipoKit:tp, media: tp.indexOf("kit_novo")===0||semKit||tp==="reposicao" ? null : Math.round(v*0.115/10)*10,
          cond:{nums:nums, pegas:nc>0, chkB:chkB, impressas:imps, novas: semKit ? [] : [String(12800 + i*613 + n*97 + j*11).padStart(6,"0")].concat(j%5===0 ? [String(12840 + i*613 + n*97 + j*11).padStart(6,"0")] : [])},
          aval: semKit ? null : {nota: 3 + ((i+n+j)%3), faltas: (i+n+j)%9===0 ? 1 : 0},
          atrasado:(i+n+j)%7===3, mont:MONTADORAS[(n+i+j)%MONTADORAS.length].nome, tempoM:tm, fimM:hm(fimM), bip:BIPADORAS[(n+j+i)%BIPADORAS.length].nome,
          tempoB:tb, fimB:hm(fimB), ret:String(hh).padStart(2,"0")+":"+String((n*7+i*11+j)%60).padStart(2,"0")});
      }
      out.push({id:"H"+i+"-"+n, lid:null, hoje:false, ts:dt.getTime()+hh*3600000, data:dt.toLocaleDateString("pt-BR"), rep:r[0], destino:r[1], viagem:r[2], horario:r[3],
        concluida:String(hh+1).padStart(2,"0")+":"+String((n*11+i*7)%60).padStart(2,"0"), qtd:qtd, total:ks.reduce(function(t,k){return t+k.valor;},0),
        divs:ks.filter(function(k){return k.div;}).length, atrasados:ks.filter(function(k){return k.atrasado;}).length, retiradas:1+((n+i)%2), kits:ks});
    }
  });
  return out;
}

export { kitNormalDayanne, PERFIL_MARCIA, AROS, OURO, EVITAR, seq, kit, novoDia, REGISTROS0, CONSOLIDADO_REPS, HISTORICO0, histDemo };

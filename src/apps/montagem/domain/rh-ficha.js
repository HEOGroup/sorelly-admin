// Sorelly Admin · montagem — domain/rh-ficha.js
// FICHA DE EXPERIÊNCIA (pedido da Maria/RH, 03/11/2026): a pessoa tem 100 pontos e perde pontos a cada ocorrência no período de experiência.
// 4 categorias perdem pontos por ocorrência (assiduidade, pontualidade, comportamento, qualidade); 2 recebem nota de 0 a 10 do gestor (produtividade e adaptação),
// que vale pelo peso da categoria (nota 8 em produtividade de 15 pontos = 12 pontos). O RH lança as ocorrências; gestor e Direção veem; a pessoa nunca vê.
// Os valores abaixo são o PADRÃO: o RH muda em Configurador do RH › Ficha de experiência (fica em rh.config.ficha). Nunca valor fixo dentro de tela.

var FICHA_PADRAO = {
  categorias:[
    {id:"assiduidade", nome:"Assiduidade", sub:"Faltas", max:20, nota:false},
    {id:"pontualidade", nome:"Pontualidade", sub:"Atrasos e saídas antecipadas", max:15, nota:false},
    {id:"comportamento", nome:"Comportamento", sub:"Postura profissional", max:20, nota:false},
    {id:"qualidade", nome:"Qualidade de execução", sub:"Erros e procedimentos", max:20, nota:false},
    {id:"produtividade", nome:"Produtividade", sub:"Nota do gestor, de 0 a 10", max:15, nota:true},
    {id:"adaptacao", nome:"Adaptação", sub:"Nota do gestor, de 0 a 10", max:10, nota:true}],
  tipos:[
    {id:"falta", nome:"Falta sem justificativa", cat:"assiduidade", desc:10, auto:"F"},
    {id:"falta_aviso", nome:"Falta com aviso, sem abono", cat:"assiduidade", desc:4, auto:"AJ"},
    {id:"atestado", nome:"Falta com atestado", cat:"assiduidade", desc:1, auto:"AT"},
    {id:"atraso_curto", nome:"Atraso até 15 minutos", cat:"pontualidade", desc:2, auto:"atraso"},
    {id:"atraso_longo", nome:"Atraso acima de 15 minutos", cat:"pontualidade", desc:4, auto:"atraso"},
    {id:"saida", nome:"Saída antecipada sem justificativa", cat:"pontualidade", desc:4, auto:""},
    {id:"comp_leve", nome:"Comportamento inadequado (leve)", cat:"comportamento", desc:5, auto:""},
    {id:"comp_medio", nome:"Comportamento inadequado (moderado)", cat:"comportamento", desc:10, auto:""},
    {id:"comp_grave", nome:"Comportamento inadequado (grave)", cat:"comportamento", desc:20, auto:""},
    {id:"erro_leve", nome:"Erro de execução (leve)", cat:"qualidade", desc:2, auto:""},
    {id:"erro_medio", nome:"Erro de execução (moderado)", cat:"qualidade", desc:5, auto:""},
    {id:"erro_grave", nome:"Erro de execução (grave)", cat:"qualidade", desc:10, auto:""},
    {id:"procedimento", nome:"Descumprimento de procedimento", cat:"qualidade", desc:5, auto:""}],
  // gestor de cada setor (confirmado pelo Marcus em 03/11/2026): dá a nota só das pessoas do próprio setor. Setor sem nome: só Direção e RH. Editável no Configurador.
  supervisores:{"Montagem de kits":["Deysiane Portugues da Silva"], "Atendimento de kits":["Deysiane Portugues da Silva"], "Bipagem":["Deysiane Portugues da Silva"], "Condicionais":["Deysiane Portugues da Silva"],
    "Kits novos e indicação":["Nickolas Gabriel Leal Neves"], "Cadastro de revendedoras":["Nickolas Gabriel Leal Neves"], "Cadastro de peças":["Rayssa Alessandra Ingatain"],
    "Agendamento":["Ana Maria Divino da Silva"], "Financeiro":["Anamaria Hess de Oliveira"], "Inadimplência":["Amanda de Miranda Gonçalves"], "RH":["Maria Claudia Stresser de Faria"], "Marketing":["Maria Claudia Stresser de Faria"]},
  atrasoLimite:15,   // minutos: até aqui é atraso curto
  faixaAprovar:85, faixaAcompanhar:70   // 85 a 100 recomenda efetivar · 70 a 84 acompanhar · abaixo disso não recomenda
};

var DECISOES = [["", "Não definida"], ["aprovar", "Efetivar"], ["acompanhar", "Acompanhar e reavaliar"], ["nao", "Não efetivar"]];
var ORIGENS = {manual:"RH", presenca:"Presença diária"};

function fichaCfg(rh){ return (rh.config && rh.config.ficha) || FICHA_PADRAO; }
function fichaDe(rh, id){ var f = (rh.fichas||{})[id]; return f || {ocorrencias:[], notas:{produtividade:null, adaptacao:null}, decisao:"", parecer:"", dataAvaliacao:"", ignoradas:[]}; }
var arred = function(n){ return Math.round(n*10)/10; };

// pontos de cada categoria + total. Total só sai com as duas notas do gestor (antes disso fica "pendente").
function resultadoFicha(cfg, ficha){
  var tipos = {}; cfg.tipos.forEach(function(t){ tipos[t.id] = t; });
  var porCat = {}, descontado = 0;
  cfg.categorias.forEach(function(c){
    if(c.nota){ var n = ficha.notas ? ficha.notas[c.id] : null; porCat[c.id] = {max:c.max, nota:(n===null || n===undefined) ? null : n, pontos:(n===null || n===undefined) ? null : arred(c.max*n/10), desc:0}; }
    else { var d = (ficha.ocorrencias||[]).reduce(function(t, o){ var tp = tipos[o.tipoId]; return t + (tp && tp.cat===c.id ? tp.desc : 0); }, 0); porCat[c.id] = {max:c.max, pontos:Math.max(0, c.max-d), desc:Math.min(c.max, d)}; descontado += Math.min(c.max, d); }
  });
  var pronto = cfg.categorias.every(function(c){ return porCat[c.id].pontos!==null; });
  var total = pronto ? arred(cfg.categorias.reduce(function(t, c){ return t+porCat[c.id].pontos; }, 0)) : null;
  var rec = total===null ? "pendente" : total>=cfg.faixaAprovar ? "aprovar" : total>=cfg.faixaAcompanhar ? "acompanhar" : "nao";
  return {porCat:porCat, descontado:descontado, pronto:pronto, total:total, recomendacao:rec};
}
var ROTULO_REC = {pendente:"Aguardando notas do gestor", aprovar:"Recomenda efetivar", acompanhar:"Acompanhar e reavaliar", nao:"Não recomenda efetivar"};

// quanto cada tipo de ocorrência da lista vale hoje (a ocorrência guarda só o tipo; o desconto vem do Configurador)
function descontoDe(cfg, tipoId){ var t = cfg.tipos.find(function(x){ return x.id===tipoId; }); return t ? t.desc : 0; }

// o usuário é gestor do setor? Compara o nome sem acento e sem diferença de maiúscula.
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/\s+/g," ").trim(); };
function supervisoresDe(cfg){ return cfg.supervisores || FICHA_PADRAO.supervisores; }
function ehGestorDe(cfg, nomeUsuario, setor){ var l = supervisoresDe(cfg)[setor] || []; return l.some(function(n){ return norm(n)===norm(nomeUsuario); }); }
function ehGestorAlgum(cfg, nomeUsuario){ var m = supervisoresDe(cfg); return Object.keys(m).some(function(k){ return m[k].some(function(n){ return norm(n)===norm(nomeUsuario); }); }); }

export { supervisoresDe, ehGestorDe, ehGestorAlgum, FICHA_PADRAO, DECISOES, ORIGENS, ROTULO_REC, fichaCfg, fichaDe, resultadoFicha, descontoDe };

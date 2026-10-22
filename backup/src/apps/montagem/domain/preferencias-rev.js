// Sorelly Admin · montagem — domain/preferencias-rev.js
// Preferências do kit feitas NO APP da revendedora: o formulário do app (13 blocos + observações) é o MESMO do admin (Kits → Preferências do kit, s.pk).
// Os blocos nascem aqui (uma vez, se faltarem) e a tela do app lê a estrutura de s.pk: mudou o bloco no admin, muda no app. Grava com fonte "app" (PK op "app_salvar").
import { pkReduz, pkMigrar, pkBlocos } from "./preferencias-kit";

var AVISO_PREFS = "Atenção: Estas são preferências, não um pedido garantido. As peças entram no kit conforme o estoque na data da montagem!";
var METAIS_APP = ["Ouro", "Prata", "Ouro + Prata"];
var TAM_ANEL = ["10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25"];
var AMARELO = "#FFF3D6", VERDE = "#E3F5EA", ROSA = "#FDE8EF", AZUL = "#E8EEFF", LILAS = "#EEE9FF";
var METAL_Q = {label:"Qual metal"};
// Os blocos do formulário, COPIADOS do admin de produção (tabela kit_block, 19/10/2026): mesma ordem, opções e liga/desliga. Observações é do sistema.
// Ligados (13): Anéis, Conjunto, Colares, Colar Filhos, Colar de Letras, Pulseira, Bracelete, Tornozeleira, Infantil, Masculino, Flanela, Material de Apoio e Pingentes Avulsos.
// Desligados em produção (menos coisas para a revendedora pedir): Brincos, Conjuntos, Choker (malha lisa, cordão baiano...), Pulseiras (cores), Braceletes e Identificação. Ficam aqui prontos para ligar no admin.
var BLOCOS_APP = [
  {key:"identificacao", tipo:"id", title:"Identificação", accent:VERDE, enabled:false, colorField:{key:"cores", label:"Cores preferidas", options:[{value:"Cristal", hex:"#E8E8E8"}, {value:"Rosa Claro", hex:"#f396e2"}, {value:"Vermelho", hex:"#e57373"}, {value:"Verde Claro", hex:"#a5d6a7"}, {value:"Verde Escuro", hex:"#388e3c"}, {value:"Azul Escuro", hex:"#1565c0"}, {value:"Azul Claro", hex:"#64b5f6"}, {value:"Preto", hex:"#292929"}, {value:"Roxo", hex:"#8d06cb"}, {value:"Rosa Escuro", hex:"#ff00dd"}, {value:"Lilás", hex:"#df9cf7"}]}},
  {key:"aneis", tipo:"slider", title:"Anéis", accent:AMARELO, fields:[{key:"tamanhos-que-voce-mais-vende-selecione-3-opcoes", label:"Tamanhos que você mais vende (selecione 3 opções)", kind:"multi", options:TAM_ANEL}]},
  {key:"conjunto", tipo:"vend", title:"Conjunto", accent:AMARELO, metalField:METAL_Q},
  {key:"brincos", tipo:"slider", title:"Brincos", accent:LILAS, enabled:false, allowImages:true, fields:[{key:"estilos-preferidos", label:"Estilos preferidos", kind:"multi", options:["Trio argola","Trio ponto de luz","Argola lisa","Argola cravejada","Ponto de luz","Duo de brincos","Brinco gancho","Flor","Laços","Borboleta","Earcuff","Trevo","Nossa senhora","Piercing fake","Argolas com pingentes"]}]},
  {key:"conjuntos", tipo:"slider", title:"Conjuntos", accent:ROSA, enabled:false, allowImages:true, fields:[{key:"estilos", label:"Estilos", kind:"multi", options:["Luxo","Delicado","Pontos de luz"]}]},
  {key:"colares", tipo:"slider", title:"Colares", accent:VERDE, fields:[]},
  {key:"colar-filhos", tipo:"filhos", title:"Colar Filhos", accent:VERDE, allowImages:true, options:["1 menino","1 menina","1 menino + 1 menina","2 meninos","2 meninas","2 meninos + 1 menina","2 meninas + 1 menino","3 meninos","3 meninas"]},
  {key:"colar-de-letras", tipo:"letras", title:"Colar de Letras", accent:ROSA, allowImages:true, maxLetters:5},
  {key:"choker", tipo:"slider", title:"Choker", accent:LILAS, enabled:false, allowImages:true, fields:[{key:"modelos-preferidos", label:"Modelos preferidos", kind:"multi", options:["Malha lisa","Cordão baiano","Riviera","Navetes","Estrelas","Pingentes cristal","Pingentes coloridos","Luxo","Pérolas","Elos"]}]},
  {key:"pulseira", tipo:"slider", title:"Pulseira", accent:ROSA, fields:[]},
  {key:"pulseiras", tipo:"id", title:"Pulseiras", accent:LILAS, enabled:false, colorField:{key:"cores", label:"Cores preferidas", options:[{value:"OURO", hex:"#ffbb00"}, {value:"PRATA", hex:"#8f8f8f"}, {value:"OURO + PRATA", hex:"#E8E8E8"}]}},
  {key:"braceletes", tipo:"vendmetal", title:"Braceletes", accent:LILAS, enabled:false, allowImages:true, items:["Liso","Cravejado","Luxo"]},
  {key:"bracelete", tipo:"vend", title:"Bracelete", accent:VERDE, metalField:METAL_Q},
  {key:"tornozeleira", tipo:"vend", title:"Tornozeleira", accent:ROSA, allowImages:true, metalField:METAL_Q},
  {key:"infantil", tipo:"vend", title:"Infantil", accent:ROSA, allowImages:true, metalField:METAL_Q, fields:[{key:"modelos-preferidos", label:"Modelos preferidos", kind:"multi", options:["Brincos","Colares","Pulseiras","Conjuntos"]}]},
  {key:"masculino", tipo:"vend", title:"Masculino", accent:LILAS, allowImages:true, metalField:METAL_Q, fields:[{key:"modelos-preferidos", label:"Modelos preferidos", kind:"multi", options:["Pulseiras","Correntes","Brincos"]}]},
  {key:"flanela", tipo:"vend", title:"Flanela", accent:ROSA},
  {key:"kit-apoio", tipo:"vend", title:"Material de Apoio as Vendas (Sacolas e envelope presente)", accent:AZUL},
  {key:"pingentes-avulsos", tipo:"vend", title:"Pingentes Avulsos", accent:LILAS}
];
var ANTIGOS = ["metal", "tamanho-do-anel", "brincos", "cores"];   // as 5 perguntas básicas da primeira versão do app: ficam desligadas
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var achaRev = function(pk, nome){ return (pk.revendedoras||[]).find(function(r){ return norm(r.nome)===norm(nome); }) || null; };

// s.pk com os blocos do app garantidos (e na ordem do app: Observações primeiro). Não mexe no estado: devolve {pk}.
function pkComBlocosApp(s){
  var tmp = {pk:pkMigrar(JSON.parse(JSON.stringify(s.pk||null)))};
  var passo = function(x){ var r = pkReduz(tmp, Object.assign({por:"app da revendedora"}, x)); if(r.patch && r.patch.pk) tmp = {pk:r.patch.pk}; return r; };
  var faltou = false, tinha = tmp.pk.blocos.length;
  // blocos que o app criou antes de copiar a produção: renomeia "material-de-apoio" e acerta as opções uma vez
  if(tmp.pk.appBlocosV!==2){
    var antigo = tmp.pk.blocos.find(function(x){ return x.key==="material-de-apoio"; });
    if(antigo){ antigo.key = "kit-apoio"; tmp.pk.revendedoras.forEach(function(r){ var rs = r.preferencias && r.preferencias.respostas; if(rs && rs["material-de-apoio"]){ rs["kit-apoio"] = rs["material-de-apoio"]; delete rs["material-de-apoio"]; } }); }
    BLOCOS_APP.forEach(function(b){ var ex = tmp.pk.blocos.find(function(x){ return x.key===b.key; }); if(ex && ex.criadoPor==="app da revendedora"){ var o = Object.assign({op:"bloco_edit"}, b); delete o.tipo; delete o.key; o.key = b.key; passo(o); } });
    tmp.pk.appBlocosV = 2; faltou = true;
  }
  BLOCOS_APP.forEach(function(b){ if(!tmp.pk.blocos.some(function(x){ return x.key===b.key; })){ passo(Object.assign({op:"bloco_add"}, b)); faltou = true; } });
  if(faltou){
    var chaves = BLOCOS_APP.map(function(b){ return b.key; });
    ANTIGOS.forEach(function(k){ var bl = tmp.pk.blocos.find(function(x){ return x.key===k; }); if(bl && bl.enabled && !(tmp.pk.revendedoras||[]).some(function(r){ return r.preferencias && r.preferencias.respostas && r.preferencias.respostas[k]; })) passo({op:"bloco_enabled", key:k, enabled:false}); });
    var outros = tmp.pk.blocos.filter(function(x){ return chaves.indexOf(x.key)<0; }).sort(function(a, b){ return a.position-b.position; }).map(function(x){ return x.key; });
    if(!tinha || outros.every(function(k){ return ANTIGOS.indexOf(k)>=0; })) passo({op:"reordenar", keys:chaves.slice(0, 1).concat(["observacoes"], chaves.slice(1), outros)});
  }
  return tmp;
}
// blocos que o app mostra (ativos, na ordem, com Observações)
function blocosDoApp(s){ return pkBlocos(pkComBlocosApp(s), {apenasAtivos:true}); }
// o que a revendedora já marcou (abre a tela preenchida)
function pkLerDoApp(s, nome){
  var pk = s && s.pk, rv = pk && achaRev(pk, nome), p = rv && rv.preferencias;
  return {respostas:p && p.respostas ? JSON.parse(JSON.stringify(p.respostas)) : {}, observacoes:p ? (p.observacoes||"") : "", salvo:!!p};
}
// ação PK "app_salvar" {nome, respostas:{chave:resposta}, observacoes, por?} → {patch, msg}
function pkSalvarDoApp(s, a){
  var tmp = pkComBlocosApp(s), por = a.por || (a.nome+" (app)");
  var passo = function(x){ var r = pkReduz(tmp, Object.assign({por:por}, x)); if(r.patch && r.patch.pk) tmp = {pk:r.patch.pk}; return r; };
  var rv = achaRev(tmp.pk, a.nome);
  if(!rv){ passo({op:"rev_add", nome:a.nome}); rv = achaRev(tmp.pk, a.nome); }
  if(!rv) return {patch:{}, msg:"Não foi possível salvar."};
  var r = passo({op:"prefs_set", revendedoraId:rv.id, respostas:a.respostas||{}, observacoes:String(a.observacoes||"").trim(), modo:"substituir", fonte:"app"});
  return {patch:r.patch && r.patch.pk ? {pk:tmp.pk} : {}, msg:r.patch && r.patch.pk ? "Preferências salvas" : (r.msg || "Não foi possível salvar.")};
}
// 19/10/2026 (pedido do Marcus): 10 revendedoras do app com as preferências JÁ preenchidas, para ver a tela e o relatório. Respostas variadas, na ordem dos blocos do app.
function respostasDemo(blocos, i){
  var out = {}, G = [70, 30, 50, 100, 0, 60, 40], M = ["Ouro", "Prata", "Ouro + Prata"];
  blocos.forEach(function(b, bi){
    if(b.type==="observacoes" || (i*7+bi)%13===0) return;   // alguns blocos ficam sem resposta
    var r = {}, rot = function(l, n){ var o = l.slice(), k = (i+bi)%o.length; return o.slice(k).concat(o.slice(0, k)).slice(0, n); };
    if(b.type==="slider"){ r.goldPercent = G[(i+bi)%G.length]; (b.fields||[]).forEach(function(f){ r[f.key] = rot(f.options, /seleciones+3/i.test(f.label) ? 3 : 2); }); }
    if(b.type==="vend"){ r.selling = (i+bi)%4!==0; if(r.selling){ if(b.hasSlider) r.goldPercent = G[(i+bi)%G.length]; if(b.metalField) r.metal = M[(i+bi)%3]; (b.fields||[]).forEach(function(f){ r[f.key] = rot(f.options, 2); }); } }
    if(b.type==="filhos"){ rot(b.options, 2).forEach(function(o, j){ r[o] = M[(i+j)%3]; }); }
    if(b.type==="letras"){ rot("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""), 3+(i%3)).forEach(function(L, j){ r[L] = M[(i+j)%3]; }); }
    out[b.key] = r;
  });
  return out;
}
var OBS_DEMO = ["", "Prefiro peças delicadas", "", "Clientes pedem muito brinco grande", "", "Gosto de peças com pedra", "", "", "Pouca saída de tornozeleira", ""];
// Preenche (de demonstração) cerca de 65% das revendedoras do sistema (kits + atendimento interno), sempre as mesmas pelo nome; quem já tem preferência não é mexida.
var hashNome = function(n){ var h = 0; String(n).split("").forEach(function(c){ h = (h*31+c.charCodeAt(0))>>>0; }); return h; };
function pkSemearDemo(s){
  var tmp = pkComBlocosApp(s), pk = tmp.pk, blocos = pkBlocos(tmp, {apenasAtivos:true}), nomes = [], vistos = {}, feitos = 0;
  var poe = function(n){ var k = norm(n); if(k && !vistos[k]){ vistos[k] = 1; nomes.push(n); } };
  (s.kits||[]).forEach(function(k){ poe(k.rev); }); (s.revInternas||[]).forEach(function(r){ poe(r.nome); });
  var z = function(n){ return String(n).padStart(2, "0"); };
  nomes.forEach(function(nome){
    var h = hashNome(nome); if(h%100>=65) return;
    var rv = achaRev(pk, nome); if(rv && rv.preferencias) return;
    if(!rv){ rv = {id:"app-"+(++pk.seq), nome:nome, telefone:"", email:"", cidade:"", estado:"", idExterno:null, criadoEm:"2026-10-19", preferencias:null}; pk.revendedoras.push(rv); }
    var i = h%24, d = new Date(2026, 9, 19-(h%18), 8+(h%10), (h*7)%60);
    rv.preferencias = {atualizadoEm:d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())+"T"+z(d.getHours())+":"+z(d.getMinutes())+":00", atualizadoPor:nome+" (app)", fonte:"app", versaoConfig:pk.config.versao, observacoes:OBS_DEMO[i%OBS_DEMO.length]||"", respostas:respostasDemo(blocos, i)};
    feitos++;
  });
  return {pk:pk, feitos:feitos};
}
export { pkSemearDemo, AVISO_PREFS, METAIS_APP, BLOCOS_APP, blocosDoApp, pkLerDoApp, pkSalvarDoApp };

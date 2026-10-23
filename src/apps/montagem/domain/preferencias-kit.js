import { globLocal } from "@/lib/glob-local";
// Sorelly Admin · montagem — domain/preferencias-kit.js
// Preferências do Kit (trazido do SorellyAdmin, docs/modulos/preferencias-kit.md).
// DUAS coisas: (1) a ESTRUTURA do formulário que a revendedora preenche no app (blocos: Anéis, Brincos, Cores, Letras...) e
// (2) as RESPOSTAS das revendedoras (preferências), que a montagem usa para montar o kit e que a Análise soma.
// O app da revendedora NÃO está ligado: respostas entram à mão (op "prefs_set"/"resposta_set") ou por importação de tabela/JSON colado (op "importar").
// Estado s.pk (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, só em domain/preferencias-kit.local.js (gitignored):
//   export default {blocos:[], revendedoras:[], registros:[]}   (formato igual ao de s.pk; ver pkDemo)
//
// AVISO (CLAUDE.md das páginas): as preferências de revendedoras que existiam vieram ALEATÓRIAS. NÃO confiar nelas na Análise de vendas
// nem para decidir o kit até virem do app de verdade. Toda resposta guarda a fonte ("app" | "manual" | "importacao"), a Análise mostra as fontes e AVISO_CONFIANCA.
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"); dinheiro em reais. Números e limites moram em s.pk.config.

import { hojeSP, agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = globLocal("apps/montagem/domain/preferencias-kit.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r1 = function(n){ return Math.round((n||0)*10)/10; };
var r2 = function(n){ return Math.round((n||0)*100)/100; };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var apenasDigitos = function(v){ return String(v==null ? "" : v).replace(/\D/g, ""); };
var ehObj = function(v){ return typeof v==="object" && v!==null && !Array.isArray(v); };
// minutos de um ISO local (só para comparar datas/horas)
function minutosDe(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(String(iso||"")); if(!m) return null; return Date.UTC(+m[1], +m[2]-1, +m[3], +(m[4]||0), +(m[5]||0), +(m[6]||0))/60000; }
var semDdi = function(t){ var d = apenasDigitos(t); return (d.length===12 || d.length===13) && d.slice(0,2)==="55" ? d.slice(2) : d; };
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }
function formatarPct(v){ return r1(v).toFixed(1).replace(".", ",")+"%"; }

// ---------- vocabulário ----------
var AVISO_CONFIANCA = "Atenção: as preferências das revendedoras que já existiam vieram aleatórias. Não confie nelas para decidir kit ou análise de vendas até virem do app da revendedora (ou conferidas à mão).";
var METAIS = ["Ouro", "Prata", "Ouro + Prata"];
var OBS_KEY = "observacoes", OBS_TITULO = "Observações", OBS_COR = "#FFF3D6";
var IMAGENS_MAX = 3;                       // máximo de fotos por bloco (fixo no app)
var PRESETS_COR = ["#E8EEFF", "#EEE9FF", "#FDE8EF", "#FFF3D6", "#E3F5EA"];
var FONTES = ["app", "manual", "importacao"];
var ROTULO_FONTE = {app:"App da revendedora", manual:"Lançada à mão", importacao:"Importada de tabela"};
// tipos que aparecem ao criar bloco (vendsimple é legado: só existente; observacoes é do sistema)
var TIPOS = [
  {valor:"slider", rotulo:"Preferências", dica:"Seleção de opções e proporção ouro/prata."},
  {valor:"id", rotulo:"Cores", dica:"Paleta de cores para a revendedora escolher."},
  {valor:"filhos", rotulo:"Composições", dica:"Lista de opções; cada uma pede o metal."},
  {valor:"vend", rotulo:"Disponibilidade", dica:"Pergunta se vende. Detalhes extras são opcionais."},
  {valor:"vendmetal", rotulo:"Variações", dica:"Cada variação com disponibilidade e metal."},
  {valor:"letras", rotulo:"Letras", dica:"Alfabeto A–Z; cada letra pede o metal."}
];
var ROTULO_TIPO = {slider:"Preferências", id:"Cores", filhos:"Composições", vend:"Disponibilidade", vendsimple:"Disponibilidade", vendmetal:"Variações", letras:"Letras", observacoes:"Observações"};
var DICA_TIPO = {slider:"Seleção de opções e proporção ouro/prata.", id:"Paleta de cores para a revendedora escolher.", filhos:"Lista de opções; cada uma pede o metal.", vend:"Pergunta se vende. Detalhes extras são opcionais.", vendsimple:"Pergunta se vende, sem campos adicionais.", vendmetal:"Cada variação com disponibilidade e metal.", letras:"Alfabeto A–Z; cada letra pede o metal.", observacoes:"Campo livre para a revendedora registrar observações gerais."};
var ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var CONFIG_PADRAO = {versao:1, maxImagens:IMAGENS_MAX, maxLetrasPadrao:10, rotuloCores:"Cores preferidas"};

// ---------- chaves e cores ----------
// Key = título sem acento, minúsculo, com "-" (gerada na criação; depois é IMUTÁVEL)
function slugify(v){ return String(v==null ? "" : v).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
// key de um campo/pergunta a partir do rótulo; repetida ganha -2, -3...
function keyDeRotulo(rotulo, indice, irmaos){
  var base = slugify(rotulo) || ("pergunta-"+(indice+1)), usadas = {};
  (irmaos||[]).forEach(function(x, i){ if(i!==indice && x && x.key) usadas[x.key] = 1; });
  if(!usadas[base]) return base; var n = 2; while(usadas[base+"-"+n]) n++; return base+"-"+n;
}
// cor do bloco na criação: hash da key sobre 5 presets (igual ao original)
function corDaChave(key){ var h = 0; for(var i=0; i<key.length; i++) h = (h*31 + key.charCodeAt(i)) >>> 0; return PRESETS_COR[h % PRESETS_COR.length]; }
var ehHex = function(v){ return /^#[0-9a-fA-F]{6}$/.test(String(v||"")); };
function listaTextos(v){ var out = [], vistos = {}; (Array.isArray(v) ? v : String(v==null ? "" : v).split(/\r?\n/)).forEach(function(x){ var t = trim(x); if(t && !vistos[norm(t)]){ vistos[norm(t)] = 1; out.push(t); } }); return out; }

// ---------- montagem/validação de bloco ----------
// Recebe o tipo e os dados vindos da tela e devolve {bloco} (sem position) ou {erro}. Aplica os padrões e as regras de imagem.
function pkMontarBloco(tipo, d){
  d = d || {}; var title = trim(d.title);
  if(!title) return {erro:"Dê um nome ao bloco."};
  if(!ROTULO_TIPO[tipo] || tipo==="observacoes") return {erro:"Tipo de bloco inválido."};
  var accent = d.accent ? String(d.accent) : corDaChave(d.key || slugify(title));
  if(!ehHex(accent)) return {erro:"Cor inválida (use #RRGGBB)."};
  var b = {key:d.key || slugify(title), title:title, accent:accent, type:tipo, enabled:d.enabled!==false};
  var campos = function(lista){
    var out = [], erro = null;
    (Array.isArray(lista) ? lista : []).forEach(function(f, i){
      if(erro) return; var rot = trim(f && f.label); if(!rot){ erro = "Toda pergunta precisa de um nome."; return; }
      var kind = f.kind==="grade" ? "grade" : "multi";
      out.push({key:(f.key && !out.some(function(o){ return o.key===f.key; })) ? f.key : keyDeRotulo(rot, i, out.concat([{key:""}])), label:rot, kind:kind, options:listaTextos(f.options)});
    });
    return erro ? {erro:erro} : {lista:out};
  };
  if(tipo==="id"){
    var cf = d.colorField || {}, opc = [], vistos = {};
    for(var i=0; i<(cf.options||[]).length; i++){ var o = cf.options[i], v = trim(o && o.value); if(!v) continue; if(!ehHex(o.hex)) return {erro:"Cor \""+v+"\" com código inválido (use #RRGGBB)."}; if(!vistos[norm(v)]){ vistos[norm(v)] = 1; opc.push({value:v, hex:String(o.hex)}); } }
    var rotCor = trim(cf.label) || CONFIG_PADRAO.rotuloCores;
    b.colorField = {key:cf.key || "cores", label:rotCor, options:opc};
    return {bloco:b};   // "Cores" nunca tem anexo de imagem
  }
  b.allowImages = d.allowImages===true; b.maxImages = IMAGENS_MAX;   // padrão false; máximo fixo de 3 fotos
  if(tipo==="slider"){ var c1 = campos(d.fields); if(c1.erro) return c1; b.fields = c1.lista; }
  else if(tipo==="filhos") b.options = listaTextos(d.options);
  else if(tipo==="letras"){ var ml = Math.round(num(d.maxLetters)); b.maxLetters = ml>=1 && ml<=26 ? ml : CONFIG_PADRAO.maxLetrasPadrao; }
  else if(tipo==="vend"){
    b.hasSlider = d.hasSlider===true; var mf = d.metalField && trim(d.metalField.label); b.metalField = mf ? {label:mf} : null;
    var c2 = campos(d.fields); if(c2.erro) return c2; b.fields = c2.lista;
  }
  else if(tipo==="vendmetal") b.items = listaTextos(d.items);
  return {bloco:b};
}
// dados de um bloco existente, no formato que pkMontarBloco aceita (para editar sem perder nada)
function dadosDoBloco(b){ var o = clone(b); delete o.position; delete o.type; return o; }

// ---------- leitura da estrutura ----------
// Blocos na ordem (por position; empate mantém a ordem de criação), com "Observações" (sistema) sempre incluído:
// sem linha própria ela fica no fim e ativa. Cada item ganha numero (1,2,3...) pela ordem da lista.
function pkBlocos(s, opc){
  var pk = (s && s.pk) || pkDemo(); opc = opc || {};
  var lista = pk.blocos.map(function(b, i){ return {p:b.position, i:i, b:b}; });
  var maxPos = pk.blocos.reduce(function(m, b){ return Math.max(m, b.position); }, -1);
  var obs = pk.obs || {enabled:true, position:maxPos+1};
  var bo = {key:OBS_KEY, title:OBS_TITULO, accent:OBS_COR, type:"observacoes", enabled:obs.enabled!==false, position:obs.position, sistema:true};
  lista.push({p:obs.position, i:1e9, b:bo});
  lista.sort(function(a, b){ return a.p-b.p || a.i-b.i; });
  var out = lista.map(function(x){ return x.b; });
  if(opc.apenasAtivos) out = out.filter(function(b){ return b.enabled; });
  return out.map(function(b, i){ return Object.assign({}, b, {numero:i+1}); });
}
var pkBloco = function(s, key){ return pkBlocos(s).find(function(b){ return b.key===key; }) || null; };
var pkRotuloTipo = function(t){ return ROTULO_TIPO[t] || t; };
// config PÚBLICA (o que o app lê): só blocos ativos, na ordem, sem o campo enabled
function pkConfigPublica(s){
  var pk = (s && s.pk) || pkDemo();
  return {version:pk.config.versao, blocks:pkBlocos(s, {apenasAtivos:true}).map(function(b){ var o = clone(b); delete o.enabled; delete o.position; delete o.numero; delete o.sistema; return o; })};
}
// quantas revendedoras têm resposta num bloco (para avisar antes de excluir; o original não avisava)
function pkAvisoExcluir(s, key){
  var n = ((s.pk||{}).revendedoras||[]).filter(function(r){ var p = r.preferencias; return p && p.respostas && p.respostas[key]!=null; }).length;
  return {respostas:n, texto:n>0 ? n+(n===1 ? " revendedora já respondeu" : " revendedoras já responderam")+" neste bloco. Excluir desliga essas respostas no app (elas ficam guardadas como órfãs aqui)." : ""};
}
// respostas guardadas cuja key não existe mais na estrutura
function pkRespostasOrfas(s){
  var keys = {}; pkBlocos(s).forEach(function(b){ keys[b.key] = 1; }); var cont = {};
  ((s.pk||{}).revendedoras||[]).forEach(function(r){ var rs = r.preferencias && r.preferencias.respostas || {}; Object.keys(rs).forEach(function(k){ if(!keys[k]) cont[k] = (cont[k]||0)+1; }); });
  return Object.keys(cont).map(function(k){ return {key:k, revendedoras:cont[k]}; }).sort(function(a, b){ return b.revendedoras-a.revendedoras; });
}
// a estrutura que o app conhece está alinhada? (versão da config em cada preferência = versão atual e nenhuma resposta órfã)
function pkConfigSync(s){
  var pk = s.pk || pkDemo(); var fora = pk.revendedoras.filter(function(r){ return r.preferencias && r.preferencias.versaoConfig!=null && r.preferencias.versaoConfig!==pk.config.versao; }).length;
  return {sincronizado:fora===0 && pkRespostasOrfas(s).length===0, foraDeVersao:fora, orfas:pkRespostasOrfas(s).length};
}

// ---------- respostas ----------
var asMetal = function(v){ var t = norm(v); if(!t) return null; if(t==="ouro") return "Ouro"; if(t==="prata") return "Prata"; if(/^(ouro\s*(\+|e|&|\/)\s*prata|prata\s*(\+|e|&|\/)\s*ouro|ambos|ambas|misto|mista|os dois|as duas|mix)$/.test(t)) return "Ouro + Prata"; return null; };
var asBool = function(v){ if(typeof v==="boolean") return v; var t = norm(v); if(["sim","s","true","1","vende","yes"].indexOf(t)>=0) return true; if(["nao","n","false","0","nao vende","no"].indexOf(t)>=0) return false; return null; };
var asLista = function(v){ if(Array.isArray(v)) return v.filter(function(x){ return typeof x==="string" && trim(x); }).map(trim); return typeof v==="string" ? v.split("|").map(trim).filter(Boolean) : []; };
var asPct = function(v){ if(v===null || v===undefined || v==="") return null; var n = Number(String(v).replace(",", ".").replace("%", "")); return isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null; };
var imagens = function(v){ return asLista(v).slice(0, IMAGENS_MAX); };

// Limpa a resposta de um bloco no formato do app e devolve {resposta|null, avisos[]}. Chaves que não são do bloco são descartadas; fotos até 3.
// Formatos: id {[colorField.key]:[cores]} · slider {goldPercent, [field.key]:[opções]} · filhos {[opção]:metal} · letras {[letra]:metal}
//  · vend {selling, goldPercent?, metal?, [field.key]:[...]} · vendsimple {selling} · vendmetal {[item]:{selling, metal}}   (+ images:[url] em quem permite)
function pkNormalizarResposta(b, r){
  var avisos = [], out = {}; if(!ehObj(r)) return {resposta:null, avisos:[]};
  var avisa = function(t){ avisos.push(t); };
  if(b.type==="id"){ var vs = asLista(r[b.colorField.key]); if(vs.length) out[b.colorField.key] = vs; }
  else if(b.type==="slider"){
    var g = asPct(r.goldPercent); if(g!==null) out.goldPercent = g;
    b.fields.forEach(function(f){ var v = asLista(r[f.key]); if(v.length) out[f.key] = v; });
  }
  else if(b.type==="filhos" || b.type==="letras"){
    var validas = b.type==="letras" ? ALFABETO.slice(0, b.maxLetters || 26) : b.options;
    Object.keys(r).forEach(function(k){ if(k==="images") return; var m = asMetal(r[k]); if(!m){ avisa("\""+k+"\": metal inválido, ignorado."); return; }
      var ch = b.type==="letras" ? k.toUpperCase() : (b.options.find(function(o){ return norm(o)===norm(k); }) || k);
      if(validas.indexOf(ch)<0) avisa("\""+k+"\" não está na lista do bloco (mantido mesmo assim).");
      out[ch] = m; });
  }
  else if(b.type==="vend" || b.type==="vendsimple"){
    var sel = asBool(r.selling); if(sel===null) return {resposta:null, avisos:["Falta dizer se vende (selling)."]};
    out.selling = sel;
    if(sel && b.type==="vend"){
      var g2 = asPct(r.goldPercent); if(b.hasSlider && g2!==null) out.goldPercent = g2;
      var m2 = asMetal(r.metal); if(b.metalField && m2) out.metal = m2;
      b.fields.forEach(function(f){ var v = asLista(r[f.key]); if(v.length) out[f.key] = v; });
    }
  }
  else if(b.type==="vendmetal"){
    Object.keys(r).forEach(function(k){ if(k==="images" || !ehObj(r[k])) return; var it = b.items.find(function(x){ return norm(x)===norm(k); }) || k, sl = asBool(r[k].selling); if(sl===null){ avisa("\""+k+"\": falta dizer se vende."); return; }
      if(b.items.indexOf(it)<0) avisa("\""+k+"\" não está na lista do bloco (mantido mesmo assim)."); var o = {selling:sl}; var m = asMetal(r[k].metal); if(sl && m) o.metal = m; out[it] = o; });
  }
  else return {resposta:null, avisos:[]};
  if(b.allowImages){ var im = imagens(r.images); if(im.length) out.images = im; }
  return {resposta:Object.keys(out).filter(function(k){ return k!=="images"; }).length ? out : null, avisos:avisos};
}
// a revendedora respondeu de verdade este bloco? (a tela mostra "Sem resposta" quando não)
function pkRespondido(b, r){
  if(!ehObj(r)) return false; var n = pkNormalizarResposta(b, r); return !!n.resposta;
}
// metal -> {ouro, prata} em % (Ouro + Prata conta metade para cada)
var pesoMetal = {"Ouro":[1,0], "Prata":[0,1], "Ouro + Prata":[0.5,0.5]};
function splitDeMetais(lista){ if(!lista.length) return null; var o = 0, p = 0; lista.forEach(function(m){ o += pesoMetal[m][0]; p += pesoMetal[m][1]; }); var t = o+p; return {ouro:r1(o/t*100), prata:r1(p/t*100)}; }
// proporção ouro/prata de UMA resposta: slider/vend com goldPercent usam a barra; filhos/letras/vendmetal/vend contam os metais escolhidos. null se não houver metal.
function pkSplitBloco(b, r){
  if(!ehObj(r)) return null;
  if(b.type==="slider"){ var g = asPct(r.goldPercent); return g===null ? null : {ouro:g, prata:100-g}; }
  if(b.type==="vend"){ if(r.selling!==true) return null; var g2 = asPct(r.goldPercent); if(b.hasSlider && g2!==null) return {ouro:g2, prata:100-g2}; var m = asMetal(r.metal); return m ? splitDeMetais([m]) : null; }
  if(b.type==="filhos" || b.type==="letras") return splitDeMetais(Object.keys(r).map(function(k){ return asMetal(r[k]); }).filter(Boolean));
  if(b.type==="vendmetal") return splitDeMetais(Object.keys(r).filter(function(k){ return ehObj(r[k]) && r[k].selling===true; }).map(function(k){ return asMetal(r[k].metal); }).filter(Boolean));
  return null;
}
function mediaSplits(lista){ lista = lista.filter(Boolean); if(!lista.length) return null; var o = lista.reduce(function(a, x){ return a+x.ouro; }, 0)/lista.length; return {ouro:r1(o), prata:r1(100-o)}; }
// resumo ouro/prata de uma revendedora (média das categorias que têm proporção) e quantas categorias ela respondeu
function pkResumoRevendedora(s, rev){
  var rs = (rev.preferencias && rev.preferencias.respostas) || {}, bl = pkBlocos(s).filter(function(b){ return b.type!=="observacoes"; }), splits = [], n = 0;
  bl.forEach(function(b){ if(pkRespondido(b, rs[b.key])){ n++; splits.push(pkSplitBloco(b, rs[b.key])); } });
  if(rev.preferencias && trim(rev.preferencias.observacoes)) n++;   // Observações também conta como categoria respondida
  return {categoriasRespondidas:n, resumoGeral:mediaSplits(splits)};
}
// resposta de um bloco pronta para mostrar: {vazio, vende:true|false|null, ouroPct|null, linhas:[{rotulo, valores[], metal|null, vende|null}], imagens[]}
function pkExibirResposta(b, r){
  var n = pkNormalizarResposta(b, r), x = n.resposta, o = {vazio:!x, vende:null, ouroPct:null, linhas:[], imagens:ehObj(r) ? imagens(r.images) : []};
  if(!x) return o;
  if(b.type==="id"){ var hex = {}; b.colorField.options.forEach(function(c){ hex[c.value] = c.hex; }); o.linhas.push({rotulo:b.colorField.label, valores:x[b.colorField.key]||[], hex:(x[b.colorField.key]||[]).map(function(v){ return hex[v]||null; }), metal:null}); }
  if(b.type==="slider"){ if(x.goldPercent!=null) o.ouroPct = x.goldPercent; b.fields.forEach(function(f){ if(x[f.key]) o.linhas.push({rotulo:f.label, valores:x[f.key], metal:null, grade:f.kind==="grade"}); }); }
  if(b.type==="filhos") Object.keys(x).forEach(function(k){ if(k!=="images") o.linhas.push({rotulo:k, valores:[], metal:x[k]}); });
  if(b.type==="letras") Object.keys(x).filter(function(k){ return k!=="images"; }).sort().forEach(function(k){ o.linhas.push({rotulo:k, valores:[], metal:x[k]}); });
  if(b.type==="vend" || b.type==="vendsimple"){ o.vende = x.selling; if(x.selling){ if(b.type==="vend"){ if(x.goldPercent!=null) o.ouroPct = x.goldPercent; if(b.metalField && x.metal) o.linhas.push({rotulo:b.metalField.label, valores:[], metal:x.metal}); b.fields.forEach(function(f){ if(x[f.key]) o.linhas.push({rotulo:f.label, valores:x[f.key], metal:null, grade:f.kind==="grade"}); }); } } }
  if(b.type==="vendmetal") b.items.concat(Object.keys(x).filter(function(k){ return k!=="images" && b.items.indexOf(k)<0; })).forEach(function(k){ if(x[k]) o.linhas.push({rotulo:k, valores:[], metal:x[k].selling ? (x[k].metal||null) : null, vende:x[k].selling}); });
  return o;
}

// ---------- revendedoras, situação e filtros ----------
var cmpIso = function(a, b){ var x = minutosDe(a), y = minutosDe(b); return (x==null || y==null) ? 0 : x-y; };
var temPrefs = function(r){ var p = r.preferencias; return !!(p && ((p.respostas && Object.keys(p.respostas).length) || trim(p.observacoes))); };
// "já montado": existe registro de montagem concluído DEPOIS da última atualização das preferências (atualizar de novo volta a pendente)
function pkJaMontado(s, rev){
  var p = rev.preferencias; if(!p || !p.atualizadoEm) return false;
  return ((s.pk||{}).registros||[]).some(function(g){ return String(g.revendedoraId)===String(rev.id) && g.concluidoEm && cmpIso(g.concluidoEm, p.atualizadoEm)>=0; });
}
// situação para a lista: "sem" (sem preferências) | "pendente" (tem e falta montar) | "montado"
function pkSituacao(s, rev){ if(!temPrefs(rev)) return "sem"; return pkJaMontado(s, rev) ? "montado" : "pendente"; }
var ROTULO_SITUACAO = {sem:"Sem preferências", pendente:"Pendente de montagem", montado:"Já montado"};
// filtros f: {busca, estado, cidade, situacao:"todas|com|sem|pendente|montado", fonte, desde, ate (data de atualização), ids:[]}
function pkFiltrar(s, f){
  f = f || {}; var pk = s.pk || pkDemo(), q = norm(f.busca), dq = apenasDigitos(f.busca);
  return pk.revendedoras.filter(function(r){
    if(q && !(norm(r.nome).indexOf(q)>=0 || (dq.length>=3 && apenasDigitos(r.telefone).indexOf(dq)>=0) || norm(r.cidade).indexOf(q)>=0)) return false;
    if(f.estado && norm(r.estado)!==norm(f.estado)) return false;
    if(f.cidade && norm(r.cidade)!==norm(f.cidade)) return false;
    if(f.ids && f.ids.length && f.ids.map(String).indexOf(String(r.id))<0) return false;
    var sit = pkSituacao(s, r);
    if(f.situacao==="com" && sit==="sem") return false; if(f.situacao && ["sem","pendente","montado"].indexOf(f.situacao)>=0 && sit!==f.situacao) return false;
    if(f.fonte && !(r.preferencias && r.preferencias.fonte===f.fonte)) return false;
    var dia = r.preferencias && diaDe(r.preferencias.atualizadoEm); if(f.desde && !(dia && dia>=f.desde)) return false; if(f.ate && !(dia && dia<=f.ate)) return false;
    return true;
  });
}
// lista paginada (como a da Montagem): pendentes primeiro, depois o resto; dentro de cada grupo vale a ordem pedida.
// f.orderBy: nome | criadoEm | atualizadoEm · f.order: asc|desc · f.page (1...) · f.pageSize (1–100, padrão 20). Retorna {data:[resumo], total, page, pageSize, totalPages, configSync}
function pkListar(s, f){
  f = f || {}; var ob = ["nome","criadoEm","atualizadoEm"].indexOf(f.orderBy)>=0 ? f.orderBy : "nome", dir = f.order==="desc" ? -1 : 1;
  var ps = Math.max(1, Math.min(100, Math.round(num(f.pageSize)) || 20)), pg = Math.max(1, Math.round(num(f.page)) || 1);
  var itens = pkFiltrar(s, f).map(function(r){ var sit = pkSituacao(s, r), rs = pkResumoRevendedora(s, r); return {id:r.id, nome:r.nome, telefone:r.telefone||"", regiao:{cidade:r.cidade||"", estado:r.estado||""}, preferencias:{temPreferencias:sit!=="sem", categoriasRespondidas:rs.categoriasRespondidas, resumoGeral:rs.resumoGeral, atualizadoEm:r.preferencias ? r.preferencias.atualizadoEm : null, fonte:r.preferencias ? r.preferencias.fonte : null}, jaMontado:sit==="montado", situacao:sit, criadoEm:r.criadoEm}; });
  var chave = function(x){ return ob==="nome" ? norm(x.nome) : ob==="criadoEm" ? (x.criadoEm||"") : (x.preferencias.atualizadoEm||""); };
  itens.sort(function(a, b){ var pa = a.situacao==="pendente" ? 0 : 1, pb = b.situacao==="pendente" ? 0 : 1; if(pa!==pb) return pa-pb; var ka = chave(a), kb = chave(b); return (ka<kb ? -1 : ka>kb ? 1 : 0)*dir || (norm(a.nome)<norm(b.nome) ? -1 : 1); });
  var tp = Math.max(1, Math.ceil(itens.length/ps)); if(pg>tp) pg = tp;
  return {data:itens.slice((pg-1)*ps, pg*ps), total:itens.length, page:pg, pageSize:ps, totalPages:tp, configSync:pkConfigSync(s).sincronizado};
}
// detalhe de uma revendedora: dados + bloco a bloco (só ativos por padrão; opc.todos mostra todos), respostas prontas para mostrar
function pkDetalhe(s, id, opc){
  var pk = s.pk || pkDemo(), r = pk.revendedoras.find(function(x){ return String(x.id)===String(id); }); if(!r) return null; opc = opc || {};
  var p = r.preferencias, blocos = pkBlocos(s, {apenasAtivos:!opc.todos}).filter(function(b){ return b.type!=="observacoes"; }), rs = (p && p.respostas) || {};
  var res = pkResumoRevendedora(s, r), sit = pkSituacao(s, r);
  return {id:r.id, nome:r.nome, telefone:r.telefone||"", email:r.email||"", regiao:{cidade:r.cidade||"", estado:r.estado||""}, situacao:sit, rotuloSituacao:ROTULO_SITUACAO[sit], jaMontado:sit==="montado",
    preferencias:{temPreferencias:sit!=="sem", categoriasRespondidas:res.categoriasRespondidas, resumoGeral:res.resumoGeral, atualizadoEm:p ? p.atualizadoEm : null, atualizadoPor:p ? p.atualizadoPor : null, fonte:p ? p.fonte : null, observacoes:p ? (p.observacoes||"") : ""},
    blocos:blocos.map(function(b){ return {numero:b.numero, bloco:b, resposta:rs[b.key]==null ? null : rs[b.key], exibir:pkExibirResposta(b, rs[b.key])}; }),
    orfas:Object.keys(rs).filter(function(k){ return !pkBloco(s, k); }),
    registros:pk.registros.filter(function(g){ return String(g.revendedoraId)===String(r.id); }).sort(function(a, b){ return cmpIso(b.concluidoEm, a.concluidoEm); }),
    aviso:AVISO_CONFIANCA};
}

// ---------- análise ----------
// Soma as respostas das revendedoras (já filtradas por f; mesmos filtros de pkListar, sem paginação) por categoria (= bloco) e por opção.
// Retorna {totalRevendedoras, totalComPreferencias, totalSemPreferencias, taxaPreenchimento(%), totalCategoriasRespondidas, mediaCategoriasPorRevendedora,
//   resumoGeral:{ouro,prata}|null, categorias:[{key,title,type,enabled,total,pctRespondida,resumoGeral,campos:[{key,label,kind,opcoes:[{value,total,pct,metais?:[{value,total,pct}],naoVende?}]}]}] (mais respondidas primeiro),
//   fontes:{app,manual,importacao}, ultimaAtualizacao, configSync, orfas, avisos[]}
// pct da opção = quantas dessas revendedoras escolheram ÷ quantas responderam a categoria; pct do metal = fatia dentro da opção. (Definição nossa: a do app não está documentada.)
function pkAnalise(s, f){
  var revs = pkFiltrar(s, f), com = revs.filter(temPrefs), blocos = pkBlocos(s).filter(function(b){ return b.type!=="observacoes"; });
  var resumos = com.map(function(r){ return pkResumoRevendedora(s, r); }), totCat = resumos.reduce(function(a, x){ return a+x.categoriasRespondidas; }, 0);
  var cats = blocos.map(function(b){ return analiseCategoria(b, com, com.length); });
  var obsN = com.filter(function(r){ return trim(r.preferencias.observacoes); }).length;
  var obsB = pkBlocos(s).find(function(b){ return b.type==="observacoes"; });
  cats.push({key:OBS_KEY, title:OBS_TITULO, type:"observacoes", enabled:obsB.enabled, total:obsN, pctRespondida:com.length ? r1(obsN/com.length*100) : 0, resumoGeral:null, campos:[]});
  cats.sort(function(a, b){ return b.total-a.total; });
  var fontes = {app:0, manual:0, importacao:0}; com.forEach(function(r){ var fo = r.preferencias.fonte; if(fontes[fo]!=null) fontes[fo]++; });
  var ult = com.reduce(function(m, r){ var a = r.preferencias.atualizadoEm; return a && (!m || cmpIso(a, m)>0) ? a : m; }, null);
  var sync = pkConfigSync(s), avisos = [];
  if(com.length) avisos.push(AVISO_CONFIANCA);
  if(!sync.sincronizado) avisos.push("Configuração de blocos fora de sincronia com o app"+(sync.orfas ? " ("+sync.orfas+" bloco(s) com respostas que não existem mais)." : "."));
  return {totalRevendedoras:revs.length, totalComPreferencias:com.length, totalSemPreferencias:revs.length-com.length, taxaPreenchimento:revs.length ? r1(com.length/revs.length*100) : 0,
    totalCategoriasRespondidas:totCat, mediaCategoriasPorRevendedora:com.length ? r1(totCat/com.length) : 0, resumoGeral:mediaSplits(resumos.map(function(x){ return x.resumoGeral; })),
    categorias:cats, fontes:fontes, ultimaAtualizacao:ult, configSync:sync.sincronizado, orfas:pkRespostasOrfas(s), avisos:avisos};
}
// contador de opções que mantém a ordem da configuração e depois as demais
function Acum(ordem){ this.m = {}; this.ordem = ordem.slice(); this.nao = {}; }
Acum.prototype.add = function(v, metal){ var o = this.m[v] || (this.m[v] = {total:0, metais:{}}); o.total++; if(metal) o.metais[metal] = (o.metais[metal]||0)+1; if(this.ordem.indexOf(v)<0) this.ordem.push(v); };
Acum.prototype.nega = function(v){ this.nao[v] = (this.nao[v]||0)+1; if(this.ordem.indexOf(v)<0) this.ordem.push(v); };
Acum.prototype.opcoes = function(base){
  var self = this, lista = this.ordem.map(function(v, i){ var o = self.m[v] || {total:0, metais:{}}, x = {value:v, total:o.total, pct:base ? r1(o.total/base*100) : 0, _i:i}, ms = Object.keys(o.metais);
    if(ms.length) x.metais = METAIS.filter(function(m){ return o.metais[m]; }).map(function(m){ return {value:m, total:o.metais[m], pct:r1(o.metais[m]/o.total*100)}; });
    if(self.nao[v]) x.naoVende = self.nao[v]; return x; });
  lista.sort(function(a, b){ return b.total-a.total || a._i-b._i; }); lista.forEach(function(x){ delete x._i; }); return lista;
};
function analiseCategoria(b, revs, totalCom){
  var resp = []; revs.forEach(function(r){ var x = r.preferencias.respostas && r.preferencias.respostas[b.key]; if(pkRespondido(b, x)) resp.push(pkNormalizarResposta(b, x).resposta); });
  var n = resp.length, campos = [], conta = function(chave, rotulo, kind, ordem, cb){ var a = new Acum(ordem); resp.forEach(function(x){ cb(a, x); }); campos.push({key:chave, label:rotulo, kind:kind, opcoes:a.opcoes(n)}); };
  var porLista = function(f, ordem){ conta(f.key, f.label, f.kind||"multi", ordem, function(a, x){ (x[f.key]||[]).forEach(function(v){ a.add(v); }); }); };
  if(b.type==="id") porLista({key:b.colorField.key, label:b.colorField.label, kind:"multi"}, b.colorField.options.map(function(o){ return o.value; }));
  if(b.type==="slider") b.fields.forEach(function(f){ porLista(f, f.options); });
  if(b.type==="filhos") conta("composicoes", "Composições", "metal", b.options, function(a, x){ Object.keys(x).forEach(function(k){ if(k!=="images") a.add(k, x[k]); }); });
  if(b.type==="letras") conta("letras", "Letras", "metal", ALFABETO.slice(0, b.maxLetters||26), function(a, x){ Object.keys(x).forEach(function(k){ if(k!=="images") a.add(k, x[k]); }); });
  if(b.type==="vend" || b.type==="vendsimple"){
    conta("vende", "Vende?", "multi", ["Vende", "Não vende"], function(a, x){ a.add(x.selling ? "Vende" : "Não vende"); });
    if(b.type==="vend"){
      if(b.metalField) conta("metal", b.metalField.label, "multi", METAIS, function(a, x){ if(x.selling && x.metal) a.add(x.metal); });
      b.fields.forEach(function(f){ conta(f.key, f.label, f.kind, f.options, function(a, x){ if(x.selling) (x[f.key]||[]).forEach(function(v){ a.add(v); }); }); });
    }
  }
  if(b.type==="vendmetal") conta("variacoes", "Variações", "metal", b.items, function(a, x){ Object.keys(x).forEach(function(k){ if(k==="images" || !ehObj(x[k])) return; if(x[k].selling) a.add(k, x[k].metal); else a.nega(k); }); });
  return {key:b.key, title:b.title, type:b.type, enabled:b.enabled, total:n, pctRespondida:totalCom ? r1(n/totalCom*100) : 0, resumoGeral:mediaSplits(resp.map(function(x){ return pkSplitBloco(b, x); })), campos:campos};
}
// ranking das opções mais pedidas em todas as categorias (para "peças mais pedidas"): [{categoria, campo, value, total, pct}] desc
function pkRanking(s, f, limite){
  var an = pkAnalise(s, f), out = [];
  an.categorias.forEach(function(c){ c.campos.forEach(function(cp){ if(cp.key==="vende") return; cp.opcoes.forEach(function(o){ if(o.total>0) out.push({categoria:c.title, categoriaKey:c.key, campo:cp.label, value:o.value, total:o.total, pct:o.pct}); }); }); });
  out.sort(function(a, b){ return b.total-a.total || (a.value<b.value ? -1 : 1); }); return out.slice(0, limite||10);
}
// análise de um bloco só (ex.: "Anéis"), mesmos filtros
var pkAnaliseCategoria = function(s, key, f){ var a = pkAnalise(s, f); return a.categorias.find(function(c){ return c.key===key; }) || null; };
// cidades e estados que existem (para os seletores de filtro)
function pkRegioes(s){ var es = {}, ci = {}; ((s.pk||{}).revendedoras||[]).forEach(function(r){ if(r.estado) es[r.estado] = 1; if(r.cidade) ci[r.cidade] = 1; }); return {estados:Object.keys(es).sort(), cidades:Object.keys(ci).sort()}; }
// totais para os indicadores da tela principal
function pkTotais(s){ var pk = s.pk || pkDemo(), c = {sem:0, pendente:0, montado:0}; pk.revendedoras.forEach(function(r){ c[pkSituacao(s, r)]++; }); var b = pkBlocos(s); return {revendedoras:pk.revendedoras.length, sem:c.sem, pendentes:c.pendente, montados:c.montado, blocos:b.length-1, blocosAtivos:b.filter(function(x){ return x.enabled && x.type!=="observacoes"; }).length, registros:pk.registros.length}; }

// ---------- importação (tabela colada ou JSON) ----------
// Tabela: 1ª linha = cabeçalho. Colunas fixas: nome, telefone, cidade, estado, email, atualizado em, observações, id. As demais seguem o MODELO (pkModeloTabela):
//   "bloco" ou "bloco/campo". Cores/listas: valores separados por "|". slider: "bloco/ouro" = % de ouro. vend: "bloco/vende" (sim/não), "bloco/metal", "bloco/ouro", "bloco/<pergunta>".
//   filhos e letras: "bloco/<opção ou letra>" = Ouro | Prata | Ouro + Prata. vendmetal: "bloco/<item>" = Não vende | Vende | Ouro | Prata | Ouro + Prata. Fotos: "bloco/imagens" (links com |).
function pkModeloTabela(s){
  var cols = ["nome", "telefone", "cidade", "estado", "email", "atualizado em", "observações"];
  pkBlocos(s).forEach(function(b){
    if(b.type==="observacoes") return;
    if(b.type==="id") cols.push(b.key+"/"+b.colorField.key);
    if(b.type==="slider"){ cols.push(b.key+"/ouro"); b.fields.forEach(function(f){ cols.push(b.key+"/"+f.key); }); }
    if(b.type==="filhos") b.options.forEach(function(o){ cols.push(b.key+"/"+o); });
    if(b.type==="letras") ALFABETO.slice(0, b.maxLetters||26).forEach(function(l){ cols.push(b.key+"/"+l); });
    if(b.type==="vend"){ cols.push(b.key+"/vende"); if(b.hasSlider) cols.push(b.key+"/ouro"); if(b.metalField) cols.push(b.key+"/metal"); b.fields.forEach(function(f){ cols.push(b.key+"/"+f.key); }); }
    if(b.type==="vendsimple") cols.push(b.key+"/vende");
    if(b.type==="vendmetal") b.items.forEach(function(it){ cols.push(b.key+"/"+it); });
    if(b.allowImages) cols.push(b.key+"/imagens");
  });
  return cols.join("\t");
}
// separa texto em linhas/colunas (delimitador: tab, ; ou , — o que mais aparece na 1ª linha; aspas duplas protegem o delimitador)
function pkParseTabela(texto){
  var t = String(texto||"").replace(/^﻿/, ""), prim = t.split(/\r?\n/)[0] || "";
  var cont = {"\t":prim.split("\t").length, ";":prim.split(";").length, ",":prim.split(",").length}, del = cont["\t"]>1 ? "\t" : (cont[";"]>=cont[","] && cont[";"]>1 ? ";" : ",");
  var rows = [], row = [], cel = "", asp = false;
  for(var i=0; i<t.length; i++){ var c = t[i];
    if(asp){ if(c==='"'){ if(t[i+1]==='"'){ cel += '"'; i++; } else asp = false; } else cel += c; }
    else if(c==='"') asp = true;
    else if(c===del){ row.push(cel); cel = ""; }
    else if(c==="\n" || c==="\r"){ if(c==="\r" && t[i+1]==="\n") i++; row.push(cel); cel = ""; if(row.some(function(x){ return trim(x); })) rows.push(row); row = []; }
    else cel += c; }
  row.push(cel); if(row.some(function(x){ return trim(x); })) rows.push(row);
  return rows;
}
var FIXAS = {nome:"nome", telefone:"telefone", celular:"telefone", whatsapp:"telefone", cidade:"cidade", estado:"estado", uf:"estado", email:"email", "e-mail":"email", id:"idExterno", "atualizado em":"atualizadoEm", atualizado:"atualizadoEm", atualizadoem:"atualizadoEm", data:"atualizadoEm", "observacoes":"observacoes", obs:"observacoes"};
// entende um valor de célula para o bloco+campo e grava em resp[b.key]; devolve aviso (texto) ou null
function celula(b, campo, valor, resp){
  var v = trim(valor); if(!v) return null; var nc = norm(campo), R = resp[b.key] = resp[b.key] || {};
  if(campo==="imagens"){ if(b.allowImages) R.images = asLista(v); return null; }
  if(b.type==="id"){ R[b.colorField.key] = asLista(v); return null; }
  if(b.type==="slider"){ if(nc==="ouro"){ var g = asPct(v); if(g===null) return "ouro inválido: "+v; R.goldPercent = g; return null; }
    var f = b.fields.find(function(x){ return norm(x.key)===nc || norm(x.label)===nc || slugify(x.label)===slugify(campo); }); if(!f) return "pergunta desconhecida: "+campo; R[f.key] = asLista(v); return null; }
  if(b.type==="filhos" || b.type==="letras"){ var m = asMetal(v); if(!m) return "metal inválido em "+campo+": "+v; R[b.type==="letras" ? campo.toUpperCase() : (b.options.find(function(o){ return norm(o)===nc; }) || campo)] = m; return null; }
  if(b.type==="vend" || b.type==="vendsimple"){
    if(nc==="vende"){ var sl = asBool(v); if(sl===null) return "vende inválido: "+v; R.selling = sl; return null; }
    if(nc==="ouro"){ var g2 = asPct(v); if(g2===null) return "ouro inválido: "+v; R.goldPercent = g2; return null; }
    if(nc==="metal"){ var m2 = asMetal(v); if(!m2) return "metal inválido: "+v; R.metal = m2; return null; }
    var f2 = (b.fields||[]).find(function(x){ return norm(x.key)===nc || norm(x.label)===nc || slugify(x.label)===slugify(campo); }); if(!f2) return "pergunta desconhecida: "+campo; R[f2.key] = asLista(v); return null; }
  if(b.type==="vendmetal"){ var it = b.items.find(function(o){ return norm(o)===nc; }) || campo, t = norm(v), mm = asMetal(v), sv = (t==="vende" || t==="sim") ? true : asBool(v);
    if(mm) R[it] = {selling:true, metal:mm}; else if(sv===false) R[it] = {selling:false}; else if(sv===true) R[it] = {selling:true}; else return "valor inválido em "+campo+": "+v; return null; }
  return null;
}
// acha o bloco de um cabeçalho: "chave-do-bloco" ou "Título do bloco" antes da barra
function blocoDoCabecalho(blocos, nome){ var k = slugify(nome); return blocos.find(function(b){ return b.key===nome || slugify(b.key)===k || slugify(b.title)===k; }); }
// Lê o texto (tabela ou JSON) e monta o PLANO sem gravar nada: {linhas:[{indice,nome,acao:"criar"|"atualizar"|"erro",id,dados,avisos,erros}], avisosGlobais, resumo:{criar,atualizar,erros}}.
// JSON aceito: [{nome, telefone, cidade, estado, email, atualizadoEm, observacoes, respostas:{chave:resposta}}] ou o formato da API do app ({regiao:{cidade,estado}, preferencias:{answers, observations, atualizadoEm}}).
function pkPlanejarImportacao(s, texto, opc){
  opc = opc || {}; var pk = s.pk || pkDemo(), blocos = pkBlocos(s).filter(function(b){ return b.type!=="observacoes"; }), plano = {linhas:[], avisosGlobais:[], resumo:{criar:0, atualizar:0, erros:0}}, brutos = [], t = trim(texto);
  if(!t){ plano.avisosGlobais.push("Cole a tabela ou o JSON."); return plano; }
  if(t[0]==="[" || t[0]==="{"){
    var js; try { js = JSON.parse(t); } catch(e){ plano.avisosGlobais.push("JSON inválido: "+e.message); return plano; }
    (Array.isArray(js) ? js : (Array.isArray(js.data) ? js.data : [js])).forEach(function(o){ var p = ehObj(o.preferencias) ? o.preferencias : {}, rg = ehObj(o.regiao) ? o.regiao : {};
      brutos.push({nome:o.nome||o.displayName||p.displayName, telefone:o.telefone, cidade:o.cidade||rg.cidade, estado:o.estado||rg.estado, email:o.email, idExterno:o.id!=null ? o.id : null, atualizadoEm:o.atualizadoEm||p.atualizadoEm||null, observacoes:o.observacoes!=null ? o.observacoes : p.observations, respostas:ehObj(o.respostas) ? o.respostas : (ehObj(p.answers) ? p.answers : (ehObj(o.answers) ? o.answers : {})), avisos:[]}); });
  } else {
    var rows = pkParseTabela(t); if(rows.length<2){ plano.avisosGlobais.push("A tabela precisa do cabeçalho e de pelo menos uma linha."); return plano; }
    var cab = rows[0].map(function(h){ return trim(h); }), mapa = cab.map(function(h){
      var n = norm(h); if(FIXAS[n]) return {fixa:FIXAS[n]}; var i = h.indexOf("/"), nb = i>=0 ? h.slice(0, i) : h, b = blocoDoCabecalho(blocos, nb);
      if(!b){ if(h) plano.avisosGlobais.push("Coluna ignorada (não é campo nem bloco): "+h); return null; }
      return {bloco:b, campo:i>=0 ? trim(h.slice(i+1)) : (b.type==="id" ? b.colorField.key : (b.type==="vendsimple" || b.type==="vend" ? "vende" : "ouro"))}; });
    if(!mapa.some(function(m){ return m && m.fixa==="nome"; })){ plano.avisosGlobais.push("Falta a coluna \"nome\"."); return plano; }
    rows.slice(1).forEach(function(rw){ var o = {respostas:{}, avisos:[]}; mapa.forEach(function(m, i){ if(!m) return; var v = rw[i]; if(m.fixa) o[m.fixa] = trim(v); else { var av = celula(m.bloco, m.campo, v, o.respostas); if(av) o.avisos.push(m.bloco.title+": "+av); } }); brutos.push(o); });
  }
  brutos.forEach(function(o, i){
    var erros = [], avisos = (o.avisos||[]).slice(), nome = trim(o.nome), resp = {};
    if(!nome) erros.push("Falta o nome.");
    Object.keys(o.respostas||{}).forEach(function(k){ var b = blocos.find(function(x){ return x.key===k; });
      if(!b){ avisos.push("Bloco \""+k+"\" não existe (ignorado)."); return; }
      var nr = pkNormalizarResposta(b, o.respostas[k]); nr.avisos.forEach(function(a){ avisos.push(b.title+": "+a); }); if(nr.resposta) resp[k] = nr.resposta; else if(ehObj(o.respostas[k]) && Object.keys(o.respostas[k]).length) avisos.push(b.title+": resposta vazia ou incompleta (ignorada)."); });
    var dig = semDdi(o.telefone), ex = null;
    if(o.idExterno!=null && o.idExterno!=="") ex = pk.revendedoras.find(function(r){ return String(r.idExterno)===String(o.idExterno); });
    if(!ex && dig.length>=8) ex = pk.revendedoras.find(function(r){ return semDdi(r.telefone)===dig; });
    if(!ex && nome) ex = pk.revendedoras.find(function(r){ return norm(r.nome)===norm(nome); });
    var obs = o.observacoes!=null ? trim(o.observacoes) : null, atu = o.atualizadoEm ? String(o.atualizadoEm) : null;
    if(atu && minutosDe(atu)==null){ avisos.push("Data \""+atu+"\" inválida: vale agora."); atu = null; }
    if(!erros.length && !Object.keys(resp).length && !obs) avisos.push("Sem nenhuma resposta: só o cadastro será salvo.");
    var linha = {indice:i+1, nome:nome, acao:erros.length ? "erro" : (ex ? "atualizar" : "criar"), id:ex ? ex.id : null, avisos:avisos, erros:erros, dados:{nome:nome, telefone:trim(o.telefone), cidade:trim(o.cidade), estado:trim(o.estado), email:trim(o.email), idExterno:o.idExterno!=null && o.idExterno!=="" ? o.idExterno : null, respostas:resp, observacoes:obs, atualizadoEm:atu}};
    plano.linhas.push(linha); plano.resumo[linha.acao==="erro" ? "erros" : linha.acao==="criar" ? "criar" : "atualizar"]++;
  });
  return plano;
}

// ---------- estado ----------
function pkVazio(){ return {v:1, seq:0, config:Object.assign({}, CONFIG_PADRAO), blocos:[], obs:null, revendedoras:[], registros:[], importacoes:[], log:[]}; }
function novaRev(pk, d){
  var id = d.id!=null ? d.id : (++pk.seq); if(typeof id==="number" && id>pk.seq) pk.seq = id;
  var r = {id:id, nome:trim(d.nome), telefone:trim(d.telefone), email:trim(d.email), cidade:trim(d.cidade), estado:trim(d.estado).toUpperCase(), idExterno:d.idExterno!=null ? d.idExterno : null, criadoEm:d.criadoEm||hojeSP(), preferencias:null};
  if(d.preferencias) r.preferencias = {atualizadoEm:d.preferencias.atualizadoEm||agoraSP(), atualizadoPor:d.preferencias.atualizadoPor||"arquivo", fonte:FONTES.indexOf(d.preferencias.fonte)>=0 ? d.preferencias.fonte : "app", versaoConfig:d.preferencias.versaoConfig!=null ? d.preferencias.versaoConfig : pk.config.versao, observacoes:trim(d.preferencias.observacoes), respostas:clone(d.preferencias.respostas||{})};
  return r;
}
// estado novo: VAZIO. Se existir domain/preferencias-kit.local.js (gitignored), carrega dali (blocos já no formato final, revendedoras com preferencias, registros).
function pkDemo(){
  var pk = pkVazio();
  if(LOCAL){
    if(LOCAL.config) Object.assign(pk.config, LOCAL.config);
    (LOCAL.blocos||[]).forEach(function(b, i){ var m = pkMontarBloco(b.type, b); if(m.bloco) pk.blocos.push(Object.assign(m.bloco, {position:b.position!=null ? b.position : i})); });
    if(LOCAL.obs) pk.obs = {enabled:LOCAL.obs.enabled!==false, position:LOCAL.obs.position!=null ? LOCAL.obs.position : pk.blocos.length};
    (LOCAL.revendedoras||[]).forEach(function(r){ pk.revendedoras.push(novaRev(pk, r)); });
    (LOCAL.registros||[]).forEach(function(g){ pk.registros.push(Object.assign({id:"g"+(++pk.seq), por:"arquivo"}, g)); });
  }
  return pk;
}
// cria vazio ou completa campos que faltarem (chamar ao carregar o estado salvo)
function pkMigrar(pk){
  if(!pk || typeof pk!=="object") return pkDemo(); var v = pkVazio();
  Object.keys(v).forEach(function(k){ if(pk[k]===undefined) pk[k] = v[k]; }); pk.config = Object.assign({}, CONFIG_PADRAO, pk.config);
  pk.revendedoras.forEach(function(r){ if(r.preferencias && !r.preferencias.respostas) r.preferencias.respostas = {}; });
  return pk;
}

// ---------- ações ----------
// s.pk + ação {op, ..., por, agora?} → {patch, msg}. Recusas devolvem patch vazio com o motivo em msg. Cada ação guarda quem fez (por) e quando (em).
// bloco_add {tipo, title, key?, accent?, enabled?, + dados do tipo (fields | colorField | options | items | maxLetters | hasSlider | metalField | allowImages)} · bloco_edit {key, title?, accent?, enabled?, + dados}
// bloco_enabled {key, enabled} · bloco_del {key} · reordenar {keys:[...na nova ordem]} · versao_subir {}
// rev_add {nome, telefone?, cidade?, estado?, email?} · rev_edit {id, ...} · rev_del {id}
// prefs_set {revendedoraId, respostas:{chave:resposta}, observacoes?, atualizadoEm?, fonte?, modo?:"mesclar"|"substituir"} · resposta_set {revendedoraId, key, resposta|null} · obs_set {revendedoraId, observacoes} · prefs_limpar {revendedoraId}
// montagem_add {revendedoraId, staffNome, iniciadoEm, concluidoEm, valorKit, usouPreferencias} · montagem_del {id}
// importar {texto, modo?:"mesclar"|"substituir"}
function pkReduz(s, a){
  var pk = pkMigrar(clone(s.pk||null)), por = a.por||"—", agora = a.agora||agoraSP();
  var recusa = function(t){ return {patch:{}, msg:t}; };
  var ok = function(msg, ref){ pk.log.push({em:agora, por:por, op:a.op, ref:ref!=null ? String(ref) : null, texto:msg}); if(pk.log.length>200) pk.log = pk.log.slice(-200); return {patch:{pk:pk}, msg:msg}; };
  var rev = function(id){ return pk.revendedoras.find(function(r){ return String(r.id)===String(id!=null ? id : a.id); }); };
  var linha = function(key){ return pk.blocos.find(function(b){ return b.key===key; }); };
  var maxPos = function(){ var m = pk.blocos.reduce(function(x, b){ return Math.max(x, b.position); }, -1); return pk.obs ? Math.max(m, pk.obs.position) : m; };
  // grava resposta(s) numa revendedora; devolve nota com o que foi ignorado
  var grava = function(r, respostas, modo, obs, fonte, quando){
    var nota = [], novo = modo==="substituir" ? {} : Object.assign({}, r.preferencias && r.preferencias.respostas);
    Object.keys(respostas||{}).forEach(function(k){ var b = pkBloco(s2(), k);
      if(!b || b.type==="observacoes"){ nota.push("\""+k+"\" não é um bloco"); return; }
      if(respostas[k]===null){ delete novo[k]; return; }
      var n = pkNormalizarResposta(b, respostas[k]); if(n.resposta) novo[k] = n.resposta; else nota.push(b.title+": resposta vazia/incompleta"); });
    var antiga = r.preferencias || {};
    r.preferencias = {atualizadoEm:quando||agora, atualizadoPor:por, fonte:FONTES.indexOf(fonte)>=0 ? fonte : "manual", versaoConfig:pk.config.versao, observacoes:obs!=null ? trim(obs) : (modo==="substituir" ? "" : trim(antiga.observacoes)), respostas:novo};
    return nota;
  };
  var s2 = function(){ return {pk:pk}; };
  switch(a.op){
    case "bloco_add": {
      var tipo = a.tipo || a.type; if(tipo==="vendsimple" && a.legado!==true) return recusa("Esse tipo é antigo e não pode mais ser criado.");
      var m = pkMontarBloco(tipo, a); if(m.erro) return recusa(m.erro); var b = m.bloco;
      if(b.key===OBS_KEY) return recusa("\"Observações\" é um bloco do sistema e não pode ser criado.");
      if(!b.key) return recusa("Dê um nome ao bloco."); if(linha(b.key)) return recusa("Já existe um bloco com esse nome.");
      b.position = maxPos()+1; b.criadoPor = por; b.atualizadoPor = por; b.atualizadoEm = agora; pk.blocos.push(b);
      return ok("Bloco \""+b.title+"\" criado.", b.key);
    }
    case "bloco_edit": {
      if(a.key===OBS_KEY) return recusa("\"Observações\" é um bloco do sistema: só dá para ligar, desligar e mudar de lugar.");
      var ex = linha(a.key); if(!ex) return recusa("Bloco não encontrado.");
      var tp = a.tipo || a.type; if(tp && tp!==ex.type) return recusa("O tipo do bloco não pode ser mudado depois de criado.");
      var d = Object.assign(dadosDoBloco(ex), {key:ex.key}); ["title","accent","enabled","allowImages","fields","colorField","options","items","maxLetters","hasSlider","metalField"].forEach(function(c){ if(a[c]!==undefined) d[c] = a[c]; });
      var m2 = pkMontarBloco(ex.type, d); if(m2.erro) return recusa(m2.erro);
      var i = pk.blocos.indexOf(ex); pk.blocos[i] = Object.assign(m2.bloco, {key:ex.key, position:ex.position, criadoPor:ex.criadoPor, atualizadoPor:por, atualizadoEm:agora});   // key NUNCA muda
      return ok("Bloco \""+m2.bloco.title+"\" salvo.", ex.key);
    }
    case "bloco_enabled": {
      var lig = a.enabled!==false;
      if(a.key===OBS_KEY){ if(pk.obs) pk.obs.enabled = lig; else pk.obs = {enabled:lig, position:maxPos()+1}; return ok("Observações "+(lig ? "ligado" : "desligado")+".", OBS_KEY); }   // primeira vez cria a linha (como no original)
      var bl = linha(a.key); if(!bl) return recusa("Bloco não encontrado."); bl.enabled = lig; bl.atualizadoPor = por; bl.atualizadoEm = agora;
      return ok("\""+bl.title+"\" "+(lig ? "ligado" : "desligado")+".", a.key);
    }
    case "bloco_del": {
      if(a.key===OBS_KEY) return recusa("\"Observações\" é um bloco do sistema e não pode ser excluído.");
      var bd = linha(a.key); if(!bd) return recusa("Bloco não encontrado."); var av = pkAvisoExcluir({pk:pk}, a.key);
      pk.blocos = pk.blocos.filter(function(x){ return x!==bd; });   // definitivo; não renumera (a ordem segue certa por position)
      return ok("Bloco \""+bd.title+"\" excluído."+(av.respostas ? " "+av.respostas+" resposta(s) ficaram guardadas como órfãs." : ""), a.key);
    }
    case "reordenar": {
      var ks = Array.isArray(a.keys) ? a.keys : []; if(!ks.length) return recusa("Nada para reordenar.");
      for(var j=0; j<ks.length; j++) if(ks[j]!==OBS_KEY && !linha(ks[j])) return recusa("Bloco \""+ks[j]+"\" não encontrado.");
      ks.forEach(function(k, ix){ if(k===OBS_KEY){ if(pk.obs) pk.obs.position = ix; else pk.obs = {enabled:true, position:ix}; } else linha(k).position = ix; });
      return ok("Ordem dos blocos salva.");
    }
    case "versao_subir": { pk.config.versao = (pk.config.versao||1)+1; return ok("Versão da configuração subiu para "+pk.config.versao+". Combine com o app da revendedora."); }
    case "rev_add": {
      var nome = trim(a.nome); if(!nome) return recusa("Informe o nome da revendedora."); var dg = semDdi(a.telefone);
      if(dg.length>=8){ var dup = pk.revendedoras.find(function(r){ return semDdi(r.telefone)===dg; }); if(dup) return recusa("Já existe uma revendedora com esse telefone: "+dup.nome+"."); }
      var nr = novaRev(pk, {id:a.id, nome:nome, telefone:a.telefone, email:a.email, cidade:a.cidade, estado:a.estado, idExterno:a.idExterno, criadoEm:hojeSP()}); pk.revendedoras.push(nr); return ok(nome+" cadastrada.", nr.id);
    }
    case "rev_edit": {
      var re = rev(); if(!re) return recusa("Revendedora não encontrada."); var n2 = a.nome!==undefined ? trim(a.nome) : re.nome; if(!n2) return recusa("O nome não pode ficar vazio.");
      var dg2 = a.telefone!==undefined ? semDdi(a.telefone) : ""; if(dg2.length>=8){ var dup2 = pk.revendedoras.find(function(r){ return r!==re && semDdi(r.telefone)===dg2; }); if(dup2) return recusa("Esse telefone já é de "+dup2.nome+"."); }
      re.nome = n2; ["telefone","email","cidade"].forEach(function(c){ if(a[c]!==undefined) re[c] = trim(a[c]); }); if(a.estado!==undefined) re.estado = trim(a.estado).toUpperCase(); return ok(re.nome+" atualizada.", re.id);
    }
    case "rev_del": {
      var rd = rev(); if(!rd) return recusa("Revendedora não encontrada."); pk.revendedoras = pk.revendedoras.filter(function(r){ return r!==rd; }); pk.registros = pk.registros.filter(function(g){ return String(g.revendedoraId)!==String(rd.id); });
      return ok(rd.nome+" excluída (com as preferências e os registros de montagem dela).", rd.id);
    }
    case "prefs_set": {
      var rp = rev(a.revendedoraId); if(!rp) return recusa("Revendedora não encontrada."); if(!ehObj(a.respostas) && a.observacoes==null) return recusa("Nada para salvar.");
      if(a.atualizadoEm && minutosDe(a.atualizadoEm)==null) return recusa("Data de atualização inválida.");
      var nota = grava(rp, a.respostas, a.modo, a.observacoes, a.fonte, a.atualizadoEm);
      return ok("Preferências de "+rp.nome+" salvas"+(nota.length ? " (ignorado: "+nota.join("; ")+")" : "")+".", rp.id);
    }
    case "resposta_set": {
      var rr = rev(a.revendedoraId); if(!rr) return recusa("Revendedora não encontrada."); var bq = pkBloco(s2(), a.key); if(!bq || bq.type==="observacoes") return recusa("Bloco não encontrado.");
      if(a.resposta!==null && !pkNormalizarResposta(bq, a.resposta).resposta) return recusa("Resposta vazia ou incompleta.");
      var o2 = {}; o2[a.key] = a.resposta; grava(rr, o2, "mesclar", null, a.fonte, null); return ok((a.resposta===null ? "Resposta removida" : "Resposta salva")+" em \""+bq.title+"\" ("+rr.nome+").", rr.id);
    }
    case "obs_set": {
      var ro = rev(a.revendedoraId); if(!ro) return recusa("Revendedora não encontrada."); grava(ro, {}, "mesclar", a.observacoes, a.fonte, null); return ok("Observações de "+ro.nome+" salvas.", ro.id);
    }
    case "prefs_limpar": {
      var rl = rev(a.revendedoraId); if(!rl) return recusa("Revendedora não encontrada."); rl.preferencias = null; return ok("Preferências de "+rl.nome+" apagadas.", rl.id);
    }
    case "montagem_add": {
      var rm = rev(a.revendedoraId); if(!rm) return recusa("Revendedora não encontrada."); var ini = a.iniciadoEm, fim = a.concluidoEm || agora;
      if(!ini || minutosDe(ini)==null || minutosDe(fim)==null) return recusa("Informe o início e o fim da montagem."); if(cmpIso(fim, ini)<0) return recusa("O fim da montagem não pode ser antes do início.");
      var vk = num(a.valorKit); if(vk<0) return recusa("O valor do kit não pode ser negativo."); if(!trim(a.staffNome)) return recusa("Informe quem montou.");
      var g = {id:"g"+(++pk.seq), revendedoraId:rm.id, resellerNome:rm.nome, staffNome:trim(a.staffNome), iniciadoEm:ini, concluidoEm:fim, valorKit:r2(vk), usouPreferencias:a.usouPreferencias===true, por:por, criadoEm:agora};
      pk.registros.push(g); return ok("Montagem de "+rm.nome+" registrada.", g.id);
    }
    case "montagem_del": {
      var gx = pk.registros.find(function(x){ return String(x.id)===String(a.id); }); if(!gx) return recusa("Registro não encontrado."); pk.registros = pk.registros.filter(function(x){ return x!==gx; }); return ok("Registro de montagem excluído.", a.id);
    }
    case "importar": {
      var plano = pkPlanejarImportacao({pk:pk}, a.texto, a); if(plano.avisosGlobais.length && !plano.linhas.length) return recusa(plano.avisosGlobais[0]);
      var criadas = 0, atualizadas = 0;
      plano.linhas.forEach(function(ln){
        if(ln.acao==="erro") return; var d = ln.dados, alvo = ln.id!=null ? rev(ln.id) : null;
        if(!alvo){ alvo = novaRev(pk, {nome:d.nome, telefone:d.telefone, email:d.email, cidade:d.cidade, estado:d.estado, idExterno:d.idExterno, criadoEm:hojeSP()}); pk.revendedoras.push(alvo); criadas++; }
        else { atualizadas++; ["telefone","email","cidade"].forEach(function(c){ if(d[c]) alvo[c] = d[c]; }); if(d.estado) alvo.estado = d.estado.toUpperCase(); if(d.idExterno!=null && alvo.idExterno==null) alvo.idExterno = d.idExterno; }
        if(Object.keys(d.respostas).length || d.observacoes) grava(alvo, d.respostas, a.modo, d.observacoes, "importacao", d.atualizadoEm);
      });
      pk.importacoes.push({id:"i"+(++pk.seq), em:agora, por:por, linhas:plano.linhas.length, criadas:criadas, atualizadas:atualizadas, erros:plano.resumo.erros}); if(pk.importacoes.length>50) pk.importacoes = pk.importacoes.slice(-50);
      return ok("Importação: "+criadas+" nova(s), "+atualizadas+" atualizada(s)"+(plano.resumo.erros ? ", "+plano.resumo.erros+" linha(s) com erro (não importadas)" : "")+".");
    }
    default: return recusa("Ação desconhecida.");
  }
}

export { pkDemo, pkReduz, pkMigrar, pkMontarBloco, hojeSP, agoraSP,
  AVISO_CONFIANCA, METAIS, TIPOS, ROTULO_TIPO, DICA_TIPO, PRESETS_COR, OBS_KEY, IMAGENS_MAX, FONTES, ROTULO_FONTE, ROTULO_SITUACAO, CONFIG_PADRAO, ALFABETO,
  slugify, keyDeRotulo, corDaChave, formatarDataHora, formatarPct,
  pkBlocos, pkBloco, pkRotuloTipo, pkConfigPublica, pkAvisoExcluir, pkRespostasOrfas, pkConfigSync,
  pkNormalizarResposta, pkRespondido, pkSplitBloco, pkResumoRevendedora, pkExibirResposta,
  pkJaMontado, pkSituacao, pkFiltrar, pkListar, pkDetalhe, pkAnalise, pkAnaliseCategoria, pkRanking, pkRegioes, pkTotais,
  pkModeloTabela, pkParseTabela, pkPlanejarImportacao };

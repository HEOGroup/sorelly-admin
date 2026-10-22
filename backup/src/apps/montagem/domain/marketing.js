// Sorelly Admin · montagem — domain/marketing.js
// Marketing (setor Marketing), trazido do SorellyAdmin (docs/modulos/marketing.md): Mural de Criativos, Divulgação e Erros em Produtos.
// Mural de Novidades e Notificações têm doc própria e NÃO estão aqui.
// Estado s.mk (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/marketing.local.js (gitignored):
//   export default {grupos:[], artes:[], erros:[]}   (mesmos formatos do estado abaixo)
// IMAGENS E ARQUIVOS: aqui só se guarda a REFERÊNCIA (url + nome + chave de texto). Não há upload nem S3/CDN: a tela só avisa o que o original fazia.
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00").
// Formato de s.mk:
//   {v, seq, config, grupos:[{id,nome,slug,capaUrl,badges[],criadoPor,criadoEm,atualizadoEm, imagens:[{id,url,nome,origem:"UPLOADED"|"EXTERNAL",objectKey,formato,criadoEm}]}],
//    artes:[{id,nome,data,tipo,canais[],status,videoLink,criadoEm,atualizadoEm, anexos:[{id,url,objectKey,mime,ordem,criadoEm}]}],
//    erros:[{id,codigo,nome,tipos[],revendedora,em,encerrado:null|{desfecho,em,por}}]}

import { hojeSP, agoraSP } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = import.meta.glob("./marketing.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")) && !isNaN(Date.parse(v+"T00:00:00Z")); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase(); };
var p2 = function(n){ return String(n).padStart(2,"0"); };

// ---------- vocabulário ----------
var BADGES = [{valor:"FERIADO", rotulo:"Feriado", tom:"info"}, {valor:"CAMPANHA", rotulo:"Campanha", tom:"primary"}, {valor:"PROMOCAO", rotulo:"Promoção", tom:"warning"},
  {valor:"SAZONAL", rotulo:"Sazonal", tom:"success"}, {valor:"LANCAMENTO", rotulo:"Lançamento", tom:"info"}, {valor:"DATA_COMEMORATIVA", rotulo:"Data comemorativa", tom:"muted"}];
var TIPOS = [{valor:"STORY", rotulo:"Story", tom:"purple"}, {valor:"FEED", rotulo:"Feed", tom:"warning"}, {valor:"REELS", rotulo:"Reels", tom:"success"}];
var CANAIS = [{valor:"INSTAGRAM", rotulo:"Instagram"}, {valor:"FACEBOOK", rotulo:"Facebook"}, {valor:"WHATSAPP", rotulo:"WhatsApp"}, {valor:"TIKTOK", rotulo:"TikTok"}];
var STATUS = [{valor:"EM_PRODUCAO", rotulo:"Em produção", tom:"neutral"}, {valor:"AGENDADO", rotulo:"Agendado", tom:"warning"}, {valor:"POSTADO", rotulo:"Postado", tom:"success"}];   // sem fluxo obrigatório: muda livremente
var DESFECHOS = [{valor:"nao_identificado", rotulo:"Não identificamos problema"}, {valor:"corrigido", rotulo:"Problemas identificados e corrigidos"}];
var TIPOS_ERRO = [{valor:"foto", rotulo:"Foto incorreta"}, {valor:"nome", rotulo:"Nome incorreto"}, {valor:"preco", rotulo:"Preço incorreto"}];
var MESES = [["JAN","Janeiro"],["FEV","Fevereiro"],["MAR","Março"],["ABR","Abril"],["MAI","Maio"],["JUN","Junho"],["JUL","Julho"],["AGO","Agosto"],["SET","Setembro"],["OUT","Outubro"],["NOV","Novembro"],["DEZ","Dezembro"]];
var rot = function(lista, v){ var x = lista.find(function(i){ return i.valor===v; }); return x ? x.rotulo : String(v||""); };
var rotuloBadge = function(v){ return rot(BADGES, v); }, rotuloTipo = function(v){ return rot(TIPOS, v); }, rotuloCanal = function(v){ return rot(CANAIS, v); }, rotuloStatus = function(v){ return rot(STATUS, v); }, rotuloDesfecho = function(v){ return rot(DESFECHOS, v); }, rotuloTipoErro = function(v){ return rot(TIPOS_ERRO, v); };
var mesesDoAno = MESES.map(function(m, i){ return {valor:i+1, curto:m[0], longo:m[1]}; });
function formatarDiaCurto(iso){ var a = String(iso||"").split("-"); return a.length>=3 ? a[2].slice(0,2)+"/"+a[1] : ""; }   // "2026-10-16" → "16/10"
function formatarDia(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function pluralImagens(n){ return n===1 ? "imagem" : "imagens"; }

// ---------- números e limites (mk.config; nada fixo na tela) ----------
var CONFIG_PADRAO = {
  pastaRaiz:"marketing",                                              // S3_ROOT_FOLDER do original (só para montar a chave de texto)
  imagemMaxMB:10, loteImagens:20, tiposImagem:["image/jpeg", "image/png", "image/gif", "image/webp"],
  anexoMaxMB:150, loteAnexos:10, tiposAnexo:["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/quicktime", "video/webm"],
  nomeArteMax:200, videoLinkMax:500,
  paginaGrupos:20, tamanhosPagina:[10, 20, 50, 100], badgeErrosTeto:99};

// ---------- utilidades puras (testáveis) ----------
// nome → slug: sem acento, minúsculo, espaço vira hífen, só [a-z0-9-]; "" se não sobrar nada
function slugify(nome){ return String(nome==null ? "" : nome).normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, ""); }
// "pasta/foto.png" → "foto.png" · comparação sem caixa
function normalizarNomeImagem(nome){ var t = String(nome==null ? "" : nome), i = t.lastIndexOf("/"); return (i===-1 ? t : t.slice(i+1)).trim().toLowerCase(); }
function nomeDuplicado(nome, usados){ var alvo = normalizarNomeImagem(nome); return (usados||[]).some(function(u){ return normalizarNomeImagem(u)===alvo; }); }
// "foto.final.png" → {base:"foto.final", ext:".png"} (arquivo oculto ".x" não tem extensão)
function dividirNome(valor){ var t = String(valor==null ? "" : valor), i = t.lastIndexOf("/"), f = i===-1 ? t : t.slice(i+1), d = f.lastIndexOf("."); return d<=0 ? {base:f, ext:""} : {base:f.slice(0, d), ext:f.slice(d)}; }
function nomeFinalWebp(nome, converteu){ if(!converteu) return nome; var d = String(nome).lastIndexOf("."); return (d===-1 ? nome : String(nome).slice(0, d))+".webp"; }
function renomeValido(base){ return trim(base).length>0; }
// chave de texto (determinística, sem UUID): <raiz>/<slug>/<arquivo>
function chaveObjeto(cfg, slug, arquivo){ return trim(cfg.pastaRaiz)+"/"+slug+"/"+arquivo; }
function chaveAnexo(cfg, arteId, arquivo, uuid){ return trim(cfg.pastaRaiz)+"/divulgacao/"+arteId+"/"+uuid+"-"+arquivo; }
// valida arquivo de imagem do Mural: {nome, tipo(mime), tamanho(bytes)} → texto de erro ou null
function validarImagem(cfg, f){
  if(cfg.tiposImagem.indexOf(f.tipo)===-1) return "Formato não suportado: "+f.nome;
  if(num(f.tamanho) > cfg.imagemMaxMB*1048576) return "Arquivo acima de "+cfg.imagemMaxMB+" MB: "+f.nome;
  return null;
}
function validarAnexo(cfg, f){
  if(cfg.tiposAnexo.indexOf(f.mime)===-1) return "Formato não suportado: "+f.nome;
  if(num(f.tamanho) > cfg.anexoMaxMB*1048576) return "Arquivo acima de "+cfg.anexoMaxMB+" MB: "+f.nome;
  return null;
}
function cabeNoLote(atuais, novos, max){ return atuais+novos <= max; }
function anexoEhVideo(mime){ return /^video\//i.test(String(mime||"")); }   // decide foto × vídeo no carrossel
// navegação do overlay: trava nas pontas, sem dar a volta
function limitarIndice(i, tam){ return tam<=0 ? 0 : Math.min(Math.max(i, 0), tam-1); }
function indiceSeguinte(i, tam){ return limitarIndice(i+1, tam); }
function indiceAnterior(i, tam){ return limitarIndice(i-1, tam); }
// compara nomes (PT-BR, sem acento/caixa, número natural: foto2 antes de foto10); vazio = "imagem"
var COLLATOR = (function(){ try { return new Intl.Collator("pt-BR", {sensitivity:"base", numeric:true}); } catch(e){ return null; } })();
function compararNomes(a, b, dir){ var x = a||"imagem", y = b||"imagem", r = COLLATOR ? COLLATOR.compare(x, y) : (norm(x)<norm(y) ? -1 : norm(x)>norm(y) ? 1 : 0); return dir==="desc" ? -r : r; }
function nomeContem(nome, busca){ var q = trim(busca); return !q || norm(nome||"imagem").indexOf(norm(q))!==-1; }
// o grupo tem ao menos uma das marcas escolhidas (OU); nenhuma escolhida = passa tudo
function temAlgumaMarca(marcasGrupo, escolhidas){ return !escolhidas || escolhidas.length===0 || escolhidas.some(function(b){ return (marcasGrupo||[]).indexOf(b)!==-1; }); }
// preferências guardadas (podem estar velhas): descarta marcas desconhecidas e tamanho de página inválido
function normalizarPreferencias(p, cfg){
  p = p||{}; var c = cfg||CONFIG_PADRAO, validas = BADGES.map(function(b){ return b.valor; });
  return {visao:p.visao==="lista" ? "lista" : "grade", ordem:"nome", dir:p.dir==="desc" ? "desc" : "asc", tamanho:c.tamanhosPagina.indexOf(p.tamanho)!==-1 ? p.tamanho : c.paginaGrupos, badges:(p.badges||[]).filter(function(b){ return validas.indexOf(b)!==-1; })};
}
// "99+" acima do teto (o espaço do menu é curto)
function textoBadge(total, cfg){ var t = (cfg||CONFIG_PADRAO).badgeErrosTeto; return total>t ? t+"+" : String(total); }

// ---------- estado ----------
function mkDemo(){
  var s = {v:1, seq:0, config:clone(CONFIG_PADRAO), grupos:[], artes:[], erros:[]};
  if(LOCAL){
    (LOCAL.grupos||[]).forEach(function(g){ s.grupos.push(clone(g)); });
    (LOCAL.artes||[]).forEach(function(x){ s.artes.push(clone(x)); });
    (LOCAL.erros||[]).forEach(function(x){ s.erros.push(clone(x)); });
    [s.grupos, s.artes, s.erros].forEach(function(l){ l.forEach(function(x){ if(typeof x.id==="number" && x.id>s.seq) s.seq = x.id; }); });
  }
  return s;
}
function mkMigrar(mk){
  if(!mk) return mkDemo(); var base = mkDemo();
  Object.keys(base).forEach(function(k){ if(mk[k]===undefined) mk[k] = clone(base[k]); });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(mk.config[k]===undefined) mk.config[k] = clone(CONFIG_PADRAO[k]); });
  mk.grupos.forEach(function(g){ if(!g.imagens) g.imagens = []; if(!g.badges) g.badges = []; });
  mk.artes.forEach(function(x){ if(!x.anexos) x.anexos = []; if(!x.canais) x.canais = []; });
  return mk;
}
var proxId = function(mk, prefixo){ return prefixo+(++mk.seq); };

// ---------- leitura (para as telas) ----------
// Mural de Criativos: lista com busca (nome), marcas, ordem por nome e página. p = {busca, badges, dir, pagina(1..), tamanho}
// → {itens:[{id,nome,slug,capaUrl,badges,qtdImagens,atualizadoEm}], total, paginas, pagina, tamanho}
function gruposListar(s, p){
  p = p||{}; var cfg = s.mk.config, tam = cfg.tamanhosPagina.indexOf(p.tamanho)!==-1 ? p.tamanho : cfg.paginaGrupos;
  var lista = s.mk.grupos.filter(function(g){ return nomeContem(g.nome, p.busca) && temAlgumaMarca(g.badges, p.badges); }).sort(function(a, b){ return compararNomes(a.nome, b.nome, p.dir) || String(a.id).localeCompare(String(b.id)); });
  var paginas = Math.max(1, Math.ceil(lista.length/tam)), pag = Math.min(Math.max(1, Math.round(num(p.pagina)||1)), paginas);
  return {itens:lista.slice((pag-1)*tam, pag*tam).map(function(g){ return {id:g.id, nome:g.nome, slug:g.slug, capaUrl:g.capaUrl||null, badges:g.badges.slice(), qtdImagens:g.imagens.length, atualizadoEm:g.atualizadoEm}; }), total:lista.length, paginas:paginas, pagina:pag, tamanho:tam};
}
function grupoPorId(s, id){ return s.mk.grupos.find(function(g){ return String(g.id)===String(id); })||null; }
// Detalhe do grupo: galeria ordenada por nome, com busca e página. p = {busca, dir, pagina, tamanho}
// → {grupo:{id,nome,slug,capaUrl,badges}, imagens:[...], total, totalGeral, paginas, pagina} | null
function grupoDetalhe(s, id, p){
  var g = grupoPorId(s, id); if(!g) return null; p = p||{}; var cfg = s.mk.config, tam = cfg.tamanhosPagina.indexOf(p.tamanho)!==-1 ? p.tamanho : cfg.paginaGrupos;
  var imgs = g.imagens.filter(function(i){ return nomeContem(i.nome, p.busca); }).sort(function(a, b){ return compararNomes(a.nome, b.nome, p.dir) || String(a.id).localeCompare(String(b.id)); });
  var paginas = Math.max(1, Math.ceil(imgs.length/tam)), pag = Math.min(Math.max(1, Math.round(num(p.pagina)||1)), paginas);
  return {grupo:{id:g.id, nome:g.nome, slug:g.slug, capaUrl:g.capaUrl||null, badges:g.badges.slice()}, imagens:imgs.slice((pag-1)*tam, pag*tam).map(function(i){ return Object.assign({ehCapa:!!g.capaUrl && g.capaUrl===i.url, podeRenomear:i.origem==="UPLOADED"}, i); }), total:imgs.length, totalGeral:g.imagens.length, paginas:paginas, pagina:pag};
}
// biblioteca que o app das revendedoras lê (sem login): TODOS os grupos, do mais recente para o mais antigo (atualizadoEm), sem rascunho
function bibliotecaPublica(s){
  return s.mk.grupos.slice().sort(function(a, b){ return String(b.atualizadoEm).localeCompare(String(a.atualizadoEm)); }).map(function(g){ return {id:g.id, nome:g.nome, slug:g.slug, capaUrl:g.capaUrl||null, badges:g.badges.slice(), imageCount:g.imagens.length, atualizadoEm:g.atualizadoEm}; });
}
// grupo da biblioteca pelo slug (com as imagens)
function bibliotecaGrupo(s, slug){ var g = s.mk.grupos.find(function(x){ return x.slug===slug; }); return g ? clone(g) : null; }
// o nome vira um slug livre? → {ok, slug, erro}  (ignoraId = o próprio grupo ao renomear)
function slugDisponivel(s, nome, ignoraId){
  var sl = slugify(nome); if(!sl) return {ok:false, slug:"", erro:"O nome precisa ter letras ou números."};
  var dup = s.mk.grupos.find(function(g){ return g.slug===sl && String(g.id)!==String(ignoraId); }); return dup ? {ok:false, slug:sl, erro:"Já existe um grupo com esse nome."} : {ok:true, slug:sl, erro:null};
}
// Divulgação: as artes de um mês (ano, mes 1..12), por data. → [{...arte, anexos}]
function artesDoMes(s, ano, mes){
  var pre = ano+"-"+p2(mes)+"-";
  return s.mk.artes.filter(function(x){ return String(x.data).indexOf(pre)===0; }).sort(function(a, b){ return String(a.data).localeCompare(String(b.data)) || String(a.criadoEm).localeCompare(String(b.criadoEm)); }).map(function(x){ return Object.assign({}, x, {anexos:x.anexos.slice().sort(function(a, b){ return a.ordem-b.ordem; })}); });
}
// resumo do mês: {total, porTipo:{STORY,FEED,REELS}, porStatus:{EM_PRODUCAO,AGENDADO,POSTADO}, porCanal:{...}}
function resumoDivulgacao(s, ano, mes){
  var l = artesDoMes(s, ano, mes), r = {total:l.length, porTipo:{}, porStatus:{}, porCanal:{}};
  TIPOS.forEach(function(t){ r.porTipo[t.valor] = 0; }); STATUS.forEach(function(t){ r.porStatus[t.valor] = 0; }); CANAIS.forEach(function(t){ r.porCanal[t.valor] = 0; });
  l.forEach(function(x){ r.porTipo[x.tipo]++; r.porStatus[x.status]++; x.canais.forEach(function(c){ r.porCanal[c]++; }); }); return r;
}
// {ano, mes} de hoje (para abrir o seletor)
function mesAtual(hoje){ var h = hoje||hojeSP(); return {ano:+h.slice(0,4), mes:+h.slice(5,7)}; }
// Erros em Produtos: fila por produto (código), do primeiro reporte mais antigo para o mais novo; só os não encerrados.
// → [{codigo, nome, qtdReportes, tipos:[...sem repetir], primeiroEm, revendedoras:[...]}]
function errosFila(s){
  var por = {}, ordem = [];
  s.mk.erros.filter(function(e){ return !e.encerrado; }).forEach(function(e){
    var p = por[e.codigo]; if(!p){ p = por[e.codigo] = {codigo:e.codigo, nome:e.nome||"", qtdReportes:0, tipos:[], primeiroEm:e.em, revendedoras:[]}; ordem.push(p); }
    p.qtdReportes++; if(!p.nome && e.nome) p.nome = e.nome; (e.tipos||[]).forEach(function(t){ if(p.tipos.indexOf(t)===-1) p.tipos.push(t); }); if(String(e.em)<String(p.primeiroEm)) p.primeiroEm = e.em; if(e.revendedora && p.revendedoras.indexOf(e.revendedora)===-1) p.revendedoras.push(e.revendedora);
  });
  return ordem.sort(function(a, b){ return String(a.primeiroEm).localeCompare(String(b.primeiroEm)) || String(a.codigo).localeCompare(String(b.codigo)); });
}
// número do menu = produtos pendentes (NÃO a soma dos reportes); texto "99+" acima do teto
function errosPendentes(s){ return errosFila(s).length; }
function errosBadge(s){ return textoBadge(errosPendentes(s), s.mk.config); }
// encerrados (histórico), mais novos primeiro, por produto
function errosEncerrados(s){
  var por = {}, ordem = [];
  s.mk.erros.filter(function(e){ return e.encerrado; }).forEach(function(e){ var k = e.codigo+"|"+e.encerrado.em; var p = por[k]; if(!p){ p = por[k] = {codigo:e.codigo, nome:e.nome||"", qtdReportes:0, desfecho:e.encerrado.desfecho, em:e.encerrado.em, por:e.encerrado.por}; ordem.push(p); } p.qtdReportes++; });
  return ordem.sort(function(a, b){ return String(b.em).localeCompare(String(a.em)); });
}
// painel simples para a Visão geral do setor
function resumoMarketing(s){ var h = mesAtual(); return {grupos:s.mk.grupos.length, imagens:s.mk.grupos.reduce(function(t, g){ return t+g.imagens.length; }, 0), artesNoMes:resumoDivulgacao(s, h.ano, h.mes), errosPendentes:errosPendentes(s)}; }

// ---------- operações ----------
// a.op:
//  "grupo_add" {nome, badges[], capaUrl?}                     · "grupo_edit" {id, nome?, badges?}  (renomear muda o slug e move as imagens enviadas)
//  "grupo_capa" {id, imagemId|null}                           · "grupo_del" {id}
//  "imagem_add" {grupoId, imagens:[{url, nome, origem:"UPLOADED"|"EXTERNAL", tipo(mime), tamanho(bytes), formato?}]}
//  "imagem_renomear" {grupoId, id, base}                      · "imagem_del" {grupoId, id}
//  "arte_add" {nome, data, tipo, canais[], status?, videoLink?} · "arte_edit" {id, ...campos}  · "arte_status" {id, status} · "arte_del" {id}
//  "anexo_add" {arteId, anexos:[{url, nome, mime, tamanho}]}  · "anexo_del" {arteId, id}
//  "erro_add" {codigo, nome?, tipos[], revendedora?, em?}      · "erro_encerrar" {codigo, desfecho}
//  "config_set" {campo: valor numérico}
function mkReduz(s, a){
  var mk = clone(mkMigrar(s.mk)), cfg = mk.config, por = a.por||"—", agora = a.agora||agoraSP(), recusa = function(t){ return {patch:{}, msg:t}; }, ok = function(msg){ return {patch:{mk:mk}, msg:msg}; };
  var grupo = function(id){ return mk.grupos.find(function(g){ return String(g.id)===String(id!=null ? id : a.id); }); };
  var arte = function(id){ return mk.artes.find(function(x){ return String(x.id)===String(id!=null ? id : a.id); }); };
  var limpaMarcas = function(l){ var v = BADGES.map(function(b){ return b.valor; }), out = []; (l||[]).forEach(function(b){ if(v.indexOf(b)!==-1 && out.indexOf(b)===-1) out.push(b); }); return out; };
  var limpaLista = function(l, lista){ var v = lista.map(function(b){ return b.valor; }), out = []; (l||[]).forEach(function(b){ if(v.indexOf(b)!==-1 && out.indexOf(b)===-1) out.push(b); }); return out; };
  var validaArte = function(d, atual){
    var nome = trim(d.nome!==undefined ? d.nome : atual.nome); if(!nome) return "Informe o nome da arte."; if(nome.length>cfg.nomeArteMax) return "O nome passou de "+cfg.nomeArteMax+" caracteres.";
    var dia = d.data!==undefined ? d.data : atual.data; if(!ehDia(dia)) return "Data inválida.";
    var tipo = d.tipo!==undefined ? d.tipo : atual.tipo; if(!TIPOS.some(function(t){ return t.valor===tipo; })) return "Escolha o tipo (Story, Feed ou Reels).";
    var canais = d.canais!==undefined ? limpaLista(d.canais, CANAIS) : atual.canais; if(canais.length<1) return "Escolha ao menos um canal.";
    var st = d.status!==undefined ? d.status : atual.status; if(!STATUS.some(function(t){ return t.valor===st; })) return "Status inválido.";
    var vl = d.videoLink!==undefined ? trim(d.videoLink) : (atual.videoLink||""); if(vl.length>cfg.videoLinkMax) return "O link do vídeo passou de "+cfg.videoLinkMax+" caracteres.";
    return null;
  };
  switch(a.op){
    // ----- Mural de Criativos -----
    case "grupo_add": {
      var sd = slugDisponivel({mk:mk}, a.nome); if(!sd.ok) return recusa(sd.erro);
      var g = {id:proxId(mk, "g"), nome:trim(a.nome), slug:sd.slug, capaUrl:trim(a.capaUrl)||null, badges:limpaMarcas(a.badges), criadoPor:por, criadoEm:agora, atualizadoEm:agora, imagens:[]};
      mk.grupos.push(g); return ok("Grupo criado (já aparece no app das revendedoras)");   // não há rascunho
    }
    case "grupo_edit": {
      var g1 = grupo(); if(!g1) return recusa("Grupo não encontrado.");
      if(a.badges!==undefined) g1.badges = limpaMarcas(a.badges);
      if(a.nome!==undefined && trim(a.nome)!==g1.nome){
        var sd2 = slugDisponivel({mk:mk}, a.nome, g1.id); if(!sd2.ok) return recusa(sd2.erro);
        var velho = g1.slug, novo = sd2.slug;
        if(novo!==velho){   // move todas as imagens ENVIADAS para a pasta nova e reaponta a capa se ela era uma delas
          g1.imagens.forEach(function(i){ if(i.origem!=="UPLOADED") return; var capaEra = g1.capaUrl && g1.capaUrl===i.url; i.objectKey = chaveObjeto(cfg, novo, dividirNome(i.objectKey||i.nome).base+dividirNome(i.objectKey||i.nome).ext); i.url = String(i.url).split("/"+velho+"/").join("/"+novo+"/"); if(capaEra) g1.capaUrl = i.url; });
          g1.slug = novo;
        }
        g1.nome = trim(a.nome);
      }
      g1.atualizadoEm = agora; return ok("Grupo atualizado");
    }
    case "grupo_capa": {
      var g2 = grupo(); if(!g2) return recusa("Grupo não encontrado.");
      if(a.imagemId==null || a.imagemId===""){ g2.capaUrl = null; g2.atualizadoEm = agora; return ok("Capa removida"); }
      var im = g2.imagens.find(function(i){ return String(i.id)===String(a.imagemId); }); if(!im) return recusa("Imagem não encontrada.");
      g2.capaUrl = im.url; g2.atualizadoEm = agora; return ok("Capa definida");
    }
    case "grupo_del": {
      var g3 = grupo(); if(!g3) return recusa("Grupo não encontrado.");
      mk.grupos = mk.grupos.filter(function(x){ return x!==g3; }); return ok("Grupo excluído com as imagens (sem lixeira)");
    }
    case "imagem_add": {
      var g4 = grupo(a.grupoId); if(!g4) return recusa("Grupo não encontrado.");
      var lote = a.imagens||[]; if(!lote.length) return recusa("Escolha ao menos uma imagem.");
      if(!cabeNoLote(0, lote.length, cfg.loteImagens)) return recusa("No máximo "+cfg.loteImagens+" imagens por vez.");
      var usados = g4.imagens.map(function(i){ return i.nome; }), entrou = 0, pulou = [];
      lote.forEach(function(f){
        var origem = f.origem==="EXTERNAL" ? "EXTERNAL" : "UPLOADED", nome = trim(f.nome), url = trim(f.url);
        if(!url){ pulou.push((nome||"sem nome")+": sem link"); return; }
        if(origem==="UPLOADED"){ var er = validarImagem(cfg, {nome:nome, tipo:f.tipo, tamanho:f.tamanho}); if(er){ pulou.push(er); return; } }
        if(!nome) nome = origem==="EXTERNAL" ? "imagem" : ""; if(!nome){ pulou.push("Imagem sem nome"); return; }
        if(nomeDuplicado(nome, usados)){ pulou.push("Já existe uma imagem com esse nome: "+nome); return; }
        usados.push(nome);
        g4.imagens.push({id:proxId(mk, "i"), url:url, nome:nome, origem:origem, objectKey:origem==="UPLOADED" ? chaveObjeto(cfg, g4.slug, nome) : null, formato:trim(f.formato)||(f.tipo ? String(f.tipo).split("/")[1] : null)||null, criadoEm:agora});
        entrou++;
      });
      if(!entrou) return recusa(pulou[0]||"Nenhuma imagem entrou.");
      return ok(entrou+" "+pluralImagens(entrou)+" adicionada"+(entrou===1 ? "" : "s")+(pulou.length ? " · "+pulou.length+" pulada"+(pulou.length===1 ? "" : "s")+": "+pulou.join("; ") : ""));
    }
    case "imagem_renomear": {
      var g5 = grupo(a.grupoId); if(!g5) return recusa("Grupo não encontrado.");
      var i5 = g5.imagens.find(function(i){ return String(i.id)===String(a.id); }); if(!i5) return recusa("Imagem não encontrada.");
      if(i5.origem!=="UPLOADED") return recusa("Só imagens enviadas podem ser renomeadas (as de link externo não).");
      if(!renomeValido(a.base)) return recusa("Informe o novo nome.");
      var ext = dividirNome(i5.objectKey||i5.nome).ext, baseSlug = slugify(a.base); if(!baseSlug) return recusa("O nome precisa ter letras ou números.");
      var nomeNovo = baseSlug+ext, chaveNova = chaveObjeto(cfg, g5.slug, nomeNovo);
      if(chaveNova===i5.objectKey){ i5.nome = trim(a.base)+ext; return ok("Nome atualizado"); }   // mesma chave: só o rótulo muda
      if(g5.imagens.some(function(o){ return o!==i5 && (o.objectKey===chaveNova || normalizarNomeImagem(o.nome)===normalizarNomeImagem(nomeNovo)); })) return recusa("Já existe uma imagem com esse nome neste grupo.");
      var capaEra2 = g5.capaUrl && g5.capaUrl===i5.url; i5.url = String(i5.url).replace(/[^/]*$/, nomeNovo); i5.objectKey = chaveNova; i5.nome = nomeNovo; if(capaEra2) g5.capaUrl = i5.url;
      return ok("Imagem renomeada");
    }
    case "imagem_del": {
      var g6 = grupo(a.grupoId); if(!g6) return recusa("Grupo não encontrado.");
      var i6 = g6.imagens.find(function(i){ return String(i.id)===String(a.id); }); if(!i6) return recusa("Imagem não encontrada.");
      if(g6.capaUrl && g6.capaUrl===i6.url) g6.capaUrl = null;   // era a capa: limpa
      g6.imagens = g6.imagens.filter(function(i){ return i!==i6; }); return ok("Imagem removida");
    }
    // ----- Divulgação -----
    case "arte_add": {
      var vazia = {nome:"", data:"", tipo:"", canais:[], status:"EM_PRODUCAO", videoLink:""}, er2 = validaArte(a, vazia); if(er2) return recusa(er2);
      mk.artes.push({id:proxId(mk, "a"), nome:trim(a.nome), data:a.data, tipo:a.tipo, canais:limpaLista(a.canais, CANAIS), status:a.status||"EM_PRODUCAO", videoLink:trim(a.videoLink)||null, criadoPor:por, criadoEm:agora, atualizadoEm:agora, anexos:[]});
      return ok("Arte adicionada ao plano");
    }
    case "arte_edit": {
      var x = arte(); if(!x) return recusa("Arte não encontrada."); var er3 = validaArte(a, x); if(er3) return recusa(er3);
      if(a.nome!==undefined) x.nome = trim(a.nome); if(a.data!==undefined) x.data = a.data; if(a.tipo!==undefined) x.tipo = a.tipo; if(a.canais!==undefined) x.canais = limpaLista(a.canais, CANAIS); if(a.status!==undefined) x.status = a.status; if(a.videoLink!==undefined) x.videoLink = trim(a.videoLink)||null;
      x.atualizadoEm = agora; return ok("Arte atualizada");
    }
    case "arte_status": {
      var x2 = arte(); if(!x2) return recusa("Arte não encontrada."); if(!STATUS.some(function(t){ return t.valor===a.status; })) return recusa("Status inválido.");
      x2.status = a.status; x2.atualizadoEm = agora; return ok("Status: "+rotuloStatus(a.status));   // livre: não há ordem obrigatória
    }
    case "arte_del": {
      var x3 = arte(); if(!x3) return recusa("Arte não encontrada.");
      mk.artes = mk.artes.filter(function(y){ return y!==x3; }); return ok("Arte excluída"+(x3.anexos.length ? " (no original os arquivos ficavam órfãos no armazenamento)" : ""));
    }
    case "anexo_add": {
      var x4 = arte(a.arteId); if(!x4) return recusa("Arte não encontrada.");
      var lt = a.anexos||[]; if(!lt.length) return recusa("Escolha ao menos um arquivo.");
      if(!cabeNoLote(0, lt.length, cfg.loteAnexos)) return recusa("No máximo "+cfg.loteAnexos+" arquivos por envio.");
      var ent = 0, pul = [];
      lt.forEach(function(f){
        var er4 = validarAnexo(cfg, {nome:f.nome, mime:f.mime, tamanho:f.tamanho}); if(er4){ pul.push(er4); return; }
        if(!trim(f.url)){ pul.push((f.nome||"arquivo")+": sem link"); return; }
        var ordem = x4.anexos.reduce(function(m, n){ return Math.max(m, n.ordem); }, 0)+1, idn = proxId(mk, "n");
        x4.anexos.push({id:idn, url:trim(f.url), objectKey:chaveAnexo(cfg, x4.id, trim(f.nome)||"arquivo", idn), mime:f.mime, ordem:ordem, criadoEm:agora}); ent++;
      });
      if(!ent) return recusa(pul[0]||"Nenhum arquivo entrou."); x4.atualizadoEm = agora;
      return ok(ent+" arquivo"+(ent===1 ? "" : "s")+" anexado"+(ent===1 ? "" : "s")+(pul.length ? " · "+pul.length+" pulado"+(pul.length===1 ? "" : "s")+": "+pul.join("; ") : ""));
    }
    case "anexo_del": {
      var x5 = arte(a.arteId); if(!x5) return recusa("Arte não encontrada.");
      var n5 = x5.anexos.find(function(n){ return String(n.id)===String(a.id); }); if(!n5) return recusa("Anexo não encontrado.");
      x5.anexos = x5.anexos.filter(function(n){ return n!==n5; }); x5.atualizadoEm = agora; return ok("Anexo removido");
    }
    // ----- Erros em Produtos (no original os reportes vivem na mobile-api; aqui entram por lançamento manual) -----
    case "erro_add": {
      var cod = trim(a.codigo).toUpperCase(); if(!cod) return recusa("Informe o código do produto.");
      var tp = limpaLista(a.tipos, TIPOS_ERRO); if(!tp.length) return recusa("Escolha o que está errado (foto, nome ou preço).");
      mk.erros.push({id:proxId(mk, "e"), codigo:cod, nome:trim(a.nome), tipos:tp, revendedora:trim(a.revendedora), em:a.em||agora, encerrado:null}); return ok("Reporte registrado");
    }
    case "erro_encerrar": {
      var cod2 = trim(a.codigo).toUpperCase(); if(!DESFECHOS.some(function(d){ return d.valor===a.desfecho; })) return recusa("Escolha o desfecho.");
      var abertos = mk.erros.filter(function(e){ return e.codigo===cod2 && !e.encerrado; }); if(!abertos.length) return recusa("Não há reportes pendentes desse produto.");
      abertos.forEach(function(e){ e.encerrado = {desfecho:a.desfecho, em:agora, por:por}; });
      return ok(abertos.length+" reporte"+(abertos.length===1 ? "" : "s")+" encerrado"+(abertos.length===1 ? "" : "s")+" (o aviso às revendedoras é feito pelo app, não por aqui)");
    }
    case "config_set": {
      var NUMS = ["imagemMaxMB", "loteImagens", "anexoMaxMB", "loteAnexos", "nomeArteMax", "videoLinkMax", "paginaGrupos", "badgeErrosTeto"];
      var mudou = false; for(var ci=0; ci<NUMS.length; ci++){ var kn = NUMS[ci]; if(a[kn]===undefined || a[kn]==="") continue; var v = Math.round(num(a[kn])); if(v<1) return recusa("O valor precisa ser maior que zero."); cfg[kn] = v; mudou = true; }
      if(a.pastaRaiz!==undefined){ var pr = slugify(a.pastaRaiz); if(!pr) return recusa("Pasta inválida."); cfg.pastaRaiz = pr; mudou = true; }
      return mudou ? ok("Configuração do Marketing salva") : recusa("Nada para salvar.");
    }
    default: return recusa("Operação de Marketing desconhecida.");
  }
}

export { mkDemo, mkMigrar, mkReduz, BADGES, TIPOS, CANAIS, STATUS, DESFECHOS, TIPOS_ERRO, CONFIG_PADRAO, mesesDoAno,
  slugify, normalizarNomeImagem, nomeDuplicado, dividirNome, nomeFinalWebp, renomeValido, chaveObjeto, chaveAnexo, validarImagem, validarAnexo, cabeNoLote, anexoEhVideo,
  limitarIndice, indiceSeguinte, indiceAnterior, compararNomes, nomeContem, temAlgumaMarca, normalizarPreferencias, textoBadge,
  rotuloBadge, rotuloTipo, rotuloCanal, rotuloStatus, rotuloDesfecho, rotuloTipoErro, formatarDiaCurto, formatarDia, pluralImagens,
  gruposListar, grupoPorId, grupoDetalhe, bibliotecaPublica, bibliotecaGrupo, slugDisponivel, artesDoMes, resumoDivulgacao, mesAtual,
  errosFila, errosPendentes, errosBadge, errosEncerrados, resumoMarketing };

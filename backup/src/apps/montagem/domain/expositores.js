// Sorelly Admin · montagem — domain/expositores.js
// Expositores (Kits & Produção → Expositores), trazido do SorellyAdmin (docs/modulos/expositores.md).
// "Condicional" aqui NÃO é a condicional do consignado: é o EXPOSITOR (peça de exposição) que a Sorelly empresta a uma cliente/revendedora,
// com estoque próprio (s.ex.estoque). Fluxo: fila de espera → montar (baixa o estoque) → saiu para a cliente → pedido de devolução → devolução com avaliação do estado → danificados.
// Estado s.ex (só neste navegador). Nasce VAZIO (repositório é público). Dados reais, se existirem, vêm só de domain/expositores.local.js (gitignored):
//   export default {estoque:[], fila:[], clientes:[], condicionais:[]}   (mesmos campos do estado; ids e numero são refeitos se faltarem)
// Fotos: guardadas como TEXTO dentro do registro: link (http/https ou "/caminho") ou imagem pequena em "data:image/..." (limite em config.fotoMaxChars). Quando houver servidor, vira link.
// Datas ISO no fuso America/Sao_Paulo ("2026-10-16" ou "2026-10-16T14:30:00"). Dinheiro em reais (número).
// Cada operação (ação "EX" com a.op) devolve {patch, msg}; msg é o aviso (erro ou sucesso); recusa devolve patch vazio. Todas guardam a.por.
// Além do s.ex, as fotos de expositor tiradas na ENTREGA DO KIT NOVO continuam em s.entregasKN[kitId].fotoExpositor (exFotosKitNovo lê de lá).

import { hojeSP, agoraSP, diasEntre } from "./cadastro-leads";

var LOCAL = (function(){ try { var m = import.meta.glob("./expositores.local.js", {eager:true}); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(e){ return null; } })();

var r2 = function(n){ return Math.round((n||0)*100)/100; };
var num = function(v){ var n = Number(v); return isFinite(n) ? n : 0; };
var clone = function(o){ return JSON.parse(JSON.stringify(o)); };
var trim = function(v){ return String(v==null ? "" : v).trim(); };
var vazioParaNull = function(v){ var t = trim(v); return t ? t : null; };
var diaDe = function(iso){ return iso ? String(iso).slice(0,10) : ""; };
var ehDia = function(v){ return /^\d{4}-\d{2}-\d{2}$/.test(String(v||"")); };
var apenasDigitos = function(v){ return String(v==null ? "" : v).replace(/\D/g, ""); };
var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var inteiroPos = function(v){ var n = Number(v); return isFinite(n) && n>=1 && Math.floor(n)===n; };

// ---------- vocabulário ----------
var STATUS = ["BIPADO", "ESTA_COM_CLIENTE", "DEVOLVIDO"];
var ROTULO_STATUS = {BIPADO:"Bipado", ESTA_COM_CLIENTE:"Está com a cliente", DEVOLVIDO:"Devolvido"};
var TOM_STATUS = {BIPADO:"info", ESTA_COM_CLIENTE:"gold", DEVOLVIDO:"success"};
var STATUS_EDITAVEIS = ["BIPADO", "ESTA_COM_CLIENTE"];   // devolver tem fluxo próprio
var CONDICOES = ["NOVO", "BOM", "COM_MARCAS_DE_USO", "DANIFICADO", "NAO_DEVOLVIDO"];
var ROTULO_CONDICAO = {NOVO:"Novo", BOM:"Bom", COM_MARCAS_DE_USO:"Com marcas de uso", DANIFICADO:"Danificado", NAO_DEVOLVIDO:"Não devolvido"};
var TOM_CONDICAO = {NOVO:"success", BOM:"success", COM_MARCAS_DE_USO:"warning", DANIFICADO:"destructive", NAO_DEVOLVIDO:"destructive"};
var CONDICOES_QUE_VOLTAM = ["NOVO", "BOM"];   // só estas devolvem as peças ao estoque
var TIPOS_AVARIA = ["QUEBRADO", "RISCADO", "PECA_FALTANTE", "AMASSADO", "OUTRO"];
var ROTULO_AVARIA = {QUEBRADO:"Quebrado", RISCADO:"Riscado", PECA_FALTANTE:"Peça faltante", AMASSADO:"Amassado", OUTRO:"Outro"};
var STATUS_AVARIA = ["ABERTO", "EM_REPARO", "RESOLVIDO"];
var ROTULO_STATUS_AVARIA = {ABERTO:"Aberto", EM_REPARO:"Em reparo", RESOLVIDO:"Resolvido"};
var TOM_STATUS_AVARIA = {ABERTO:"destructive", EM_REPARO:"warning", RESOLVIDO:"success"};
var SLOTS_FOTO = ["endereco", "expositor", "avaria", "avaria2"];
var ROTULO_SLOT = {endereco:"Endereço", expositor:"Expositor", avaria:"Avaria", avaria2:"Avaria 2"};
var TIPOS_VINCULO = ["revendedora", "representante", "kit_novo"];
var ROTULO_VINCULO = {revendedora:"Revendedora", representante:"Representante", kit_novo:"Kit novo"};

var CONFIG_PADRAO = {
  estoqueMinimoPadrao:3,      // alerta quando quantidade ≤ estoque mínimo do item (original: 3)
  fotoMaxChars:600000,        // tamanho máximo do texto de uma foto guardada no navegador (~450 KB)
  diasAvisoDevolucao:30,      // "com a cliente há N dias" vira aviso na lista (suposição; o original não tem prazo)
  reprecificarAoEditar:false  // false = peças que já estavam na condicional mantêm o preço congelado ao editar; true = repete o original (usa o preço atual do estoque)
};
var rotuloStatus = function(x){ return ROTULO_STATUS[x]||x; }, tomStatus = function(x){ return TOM_STATUS[x]||"muted"; };
var rotuloCondicao = function(x){ return ROTULO_CONDICAO[x]||x||""; }, tomCondicao = function(x){ return TOM_CONDICAO[x]||"muted"; };
var rotuloAvaria = function(x){ return ROTULO_AVARIA[x]||x||""; }, rotuloStatusAvaria = function(x){ return ROTULO_STATUS_AVARIA[x]||x||""; }, tomStatusAvaria = function(x){ return TOM_STATUS_AVARIA[x]||"muted"; };

// ---------- formatação ----------
function formatarReais(v){ return "R$ "+Number(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); }
function formatarDia(d){ var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(d||"")); return m ? m[3]+"/"+m[2]+"/"+m[1] : ""; }
function formatarDataHora(iso){ var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(String(iso||"")); return m ? m[3]+"/"+m[2]+"/"+m[1]+(m[4] ? " "+m[4]+":"+m[5] : "") : ""; }
// só os dígitos do telefone: chave de identidade da cliente na base
function telefoneKey(t){ return apenasDigitos(t); }
// número da condicional na lista: código da Devmaster com 6 dígitos, ou o número interno com 4
function rotuloNumero(c){ return c.codigoDevmaster!=null ? String(c.codigoDevmaster).padStart(6, "0") : String(c.numero).padStart(4, "0"); }
// texto da busca: número interno, código cru e código com zeros
function textoBuscaNumero(c){ var p = [String(c.numero), rotuloNumero(c)]; if(c.codigoDevmaster!=null) p.push(String(c.codigoDevmaster)); return p.join(" "); }

// ---------- estado ----------
function exVazio(){ return {v:1, seq:0, seqNumero:0, config:clone(CONFIG_PADRAO), estoque:[], fila:[], clientes:[], condicionais:[], log:[]}; }
function proximoId(ex, prefixo, dado){ var id = dado && dado.id ? String(dado.id) : (prefixo+(++ex.seq)); var n = Number(String(id).replace(/\D/g, "")); if(n>ex.seq && String(id).indexOf(prefixo)===0) ex.seq = n; return id; }
function novoEstoque(ex, d, agora, por){
  return {id:proximoId(ex, "ei", d), codigo:trim(d.codigo), nome:trim(d.nome), valorUnitario:Math.max(0, r2(num(d.valorUnitario))), quantidade:Math.max(0, Math.floor(num(d.quantidade))),
    estoqueMinimo:d.estoqueMinimo==null || d.estoqueMinimo==="" ? ex.config.estoqueMinimoPadrao : Math.max(0, Math.floor(num(d.estoqueMinimo))), foto:d.foto||null, criadoEm:d.criadoEm||agora, criadoPor:d.criadoPor||por, atualizadoEm:d.atualizadoEm||agora};
}
function novoVinculo(v){
  if(!v) return null; var o = {tipo:TIPOS_VINCULO.indexOf(v.tipo)>=0 ? v.tipo : null, revendedoraId:v.revendedoraId!=null && v.revendedoraId!=="" ? v.revendedoraId : null, revendedoraNome:vazioParaNull(v.revendedoraNome),
    representante:vazioParaNull(v.representante), kitNovoId:v.kitNovoId!=null && v.kitNovoId!=="" ? v.kitNovoId : null};
  return o.tipo || o.revendedoraId!=null || o.revendedoraNome || o.representante || o.kitNovoId!=null ? o : null;
}
function novaFila(ex, d, agora, por){
  return {id:proximoId(ex, "fl", d), nome:trim(d.nome), telefone:trim(d.telefone), observacao:vazioParaNull(d.observacao), dataAcerto:ehDia(d.dataAcerto) ? d.dataAcerto : null, vinculo:novoVinculo(d.vinculo), criadoEm:d.criadoEm||agora, criadoPor:d.criadoPor||por};
}
function novoCliente(ex, d){ return {id:proximoId(ex, "cl", d), nome:trim(d.nome), telefone:trim(d.telefone), telefoneKey:telefoneKey(d.telefone), endereco:vazioParaNull(d.endereco)}; }
function novaCondicional(ex, d, agora, por){
  var itens = (d.itens||[]).map(function(i){ return {estoqueItemId:i.estoqueItemId, codigo:i.codigo||"", nome:i.nome||"", quantidade:Math.floor(num(i.quantidade)), valorUnitario:r2(num(i.valorUnitario))}; });
  var numero = d.numero!=null && d.numero!=="" ? Math.floor(num(d.numero)) : proximoNumero(ex); if(numero>ex.seqNumero) ex.seqNumero = numero;
  var c = {id:proximoId(ex, "cd", d), numero:numero, codigoDevmaster:d.codigoDevmaster!=null && d.codigoDevmaster!=="" ? Math.floor(num(d.codigoDevmaster)) : null,
    status:STATUS.indexOf(d.status)>=0 ? d.status : "BIPADO", nome:trim(d.nome), telefone:trim(d.telefone), endereco:vazioParaNull(d.endereco), observacoes:vazioParaNull(d.observacoes),
    dataSaida:d.dataSaida||null, retiradoPorNome:vazioParaNull(d.retiradoPorNome), fotos:{endereco:null, expositor:null, avaria:null, avaria2:null},
    itens:itens, quantidadeTotalPecas:d.quantidadeTotalPecas!=null ? Math.floor(num(d.quantidadeTotalPecas)) : somaPecas(itens), valorTotal:d.valorTotal!=null ? r2(num(d.valorTotal)) : somaValor(itens),
    pedirDeVolta:!!d.pedirDeVolta, pedirDeVoltaMotivo:d.pedirDeVoltaMotivo||null, pedirDeVoltaData:d.pedirDeVoltaData||null,
    dataDevolucao:d.dataDevolucao||null, condicaoDevolucao:d.condicaoDevolucao||null, observacaoDevolucao:d.observacaoDevolucao||null,
    motivoDevolucao:d.motivoDevolucao||null, responsavelDevolucao:d.responsavelDevolucao||null, tipoAvaria:d.tipoAvaria||null, descricaoAvaria:d.descricaoAvaria||null,
    valorEstimadoReparo:d.valorEstimadoReparo!=null ? r2(num(d.valorEstimadoReparo)) : null, statusAvaria:d.statusAvaria||null,
    vinculo:novoVinculo(d.vinculo), criadoEm:d.criadoEm||agora, criadoPor:d.criadoPor||por, atualizadoEm:d.atualizadoEm||agora, atualizadoPor:d.atualizadoPor||por};
  if(d.fotos) SLOTS_FOTO.forEach(function(sl){ if(d.fotos[sl]) c.fotos[sl] = d.fotos[sl]; });
  return c;
}
function exDemo(){
  var ex = exVazio(), agora = agoraSP();
  if(LOCAL){
    (LOCAL.estoque||[]).forEach(function(d){ ex.estoque.push(novoEstoque(ex, d, agora, "arquivo")); });
    (LOCAL.fila||[]).forEach(function(d){ ex.fila.push(novaFila(ex, d, agora, "arquivo")); });
    (LOCAL.clientes||[]).forEach(function(d){ ex.clientes.push(novoCliente(ex, d)); });
    (LOCAL.condicionais||[]).forEach(function(d){ ex.condicionais.push(novaCondicional(ex, d, agora, "arquivo")); });
  }
  return ex;
}
// cria vazio ou completa campos que faltarem (estado salvo de versão antiga)
function exMigrar(ex){
  if(!ex) return exDemo(); var base = exVazio();
  Object.keys(base).forEach(function(k){ if(ex[k]===undefined) ex[k] = clone(base[k]); });
  Object.keys(CONFIG_PADRAO).forEach(function(k){ if(ex.config[k]===undefined) ex.config[k] = CONFIG_PADRAO[k]; });
  ex.condicionais.forEach(function(c){ if(!c.fotos) c.fotos = {endereco:null, expositor:null, avaria:null, avaria2:null}; if(!c.itens) c.itens = []; });
  return ex;
}

// ---------- cálculos puros ----------
function somaPecas(itens){ return (itens||[]).reduce(function(t, i){ return t+num(i.quantidade); }, 0); }
function somaValor(itens){ return r2((itens||[]).reduce(function(t, i){ return t+num(i.valorUnitario)*num(i.quantidade); }, 0)); }
function proximoNumero(ex){ var mx = ex.seqNumero||0; ex.condicionais.forEach(function(c){ if(c.numero>mx) mx = c.numero; }); return mx+1; }
function achaEstoque(ex, id){ return ex.estoque.find(function(i){ return i.id===id; }); }
function achaCond(ex, id){ return ex.condicionais.find(function(c){ return c.id===id; }); }
// alerta de estoque baixo (quantidade ≤ mínimo)
function estoqueBaixo(i){ return i.quantidade<=i.estoqueMinimo; }
// o item já foi usado em alguma condicional (mesmo devolvida): então não pode ser excluído
function itemUsado(ex, id){ return ex.condicionais.some(function(c){ return c.itens.some(function(i){ return i.estoqueItemId===id; }); }); }
// só as condicionais que ainda estão com as peças fora do estoque
function pecasFora(c){ return c.status!=="DEVOLVIDO"; }

// junta itens repetidos e valida (devolve {itens, erro}); NÃO confere saldo
function juntaItens(ex, lista){
  var por = {}, ordem = [];
  for(var k=0; k<(lista||[]).length; k++){
    var i = lista[k]; if(!inteiroPos(i.quantidade)) return {erro:"A quantidade de cada item precisa ser um número inteiro de 1 em diante."};
    if(!achaEstoque(ex, i.estoqueItemId)) return {erro:"Um ou mais itens do estoque não foram encontrados."};
    if(!por[i.estoqueItemId]){ por[i.estoqueItemId] = {estoqueItemId:i.estoqueItemId, quantidade:0}; ordem.push(i.estoqueItemId); }
    por[i.estoqueItemId].quantidade += Number(i.quantidade);
  }
  return {itens:ordem.map(function(id){ return por[id]; })};
}
// confere o saldo (no ex já com estorno aplicado, se for edição) e dá baixa. Devolve texto de erro ou null. precos = {id: valor congelado}
function baixaEstoque(ex, itens, precos){
  for(var k=0; k<itens.length; k++){ var e = achaEstoque(ex, itens[k].estoqueItemId); if(e.quantidade<itens[k].quantidade) return "Estoque insuficiente de \""+e.nome+"\" (disponível: "+e.quantidade+", pedido: "+itens[k].quantidade+")."; }
  return null;
}
function aplicaBaixa(ex, itens, precos, agora){
  return itens.map(function(i){ var e = achaEstoque(ex, i.estoqueItemId); e.quantidade -= i.quantidade; e.atualizadoEm = agora;
    return {estoqueItemId:e.id, codigo:e.codigo, nome:e.nome, quantidade:i.quantidade, valorUnitario:precos && precos[e.id]!=null ? precos[e.id] : e.valorUnitario}; });
}
function estorna(ex, itens, agora){ itens.forEach(function(i){ var e = achaEstoque(ex, i.estoqueItemId); if(e){ e.quantidade += i.quantidade; e.atualizadoEm = agora; } }); }

// Pré-visualização do formulário "Montar expositor": total de peças, valor e o que falta de saldo (sem gravar nada)
function exPreviaMontagem(s, itens, condId){
  var ex = clone(s.ex), c = condId ? achaCond(ex, condId) : null; if(c && pecasFora(c)) estorna(ex, c.itens, "");
  var j = juntaItens(ex, itens); if(j.erro) return {ok:false, erros:[j.erro], totalPecas:0, valorTotal:0, faltas:[]};
  var faltas = [], valor = 0, pecas = 0;
  j.itens.forEach(function(i){ var e = achaEstoque(ex, i.estoqueItemId), preco = c && !ex.config.reprecificarAoEditar && c.itens.some(function(o){ return o.estoqueItemId===e.id; }) ? c.itens.find(function(o){ return o.estoqueItemId===e.id; }).valorUnitario : e.valorUnitario;
    if(e.quantidade<i.quantidade) faltas.push({estoqueItemId:e.id, nome:e.nome, disponivel:e.quantidade, pedido:i.quantidade}); valor += preco*i.quantidade; pecas += i.quantidade; });
  return {ok:faltas.length===0, erros:faltas.map(function(f){ return "Estoque insuficiente de \""+f.nome+"\" (disponível: "+f.disponivel+", pedido: "+f.pedido+")."; }), totalPecas:pecas, valorTotal:r2(valor), faltas:faltas};
}

// Base de clientes: chave = dígitos do telefone. Sem dígitos não grava. Nome vira o mais recente não vazio; endereço só sobrescreve se vier preenchido.
function upsertCliente(ex, d){
  var key = telefoneKey(d.telefone); if(!key) return;
  var nome = trim(d.nome), end = trim(d.endereco), c = ex.clientes.find(function(x){ return x.telefoneKey===key; });
  if(!c){ ex.clientes.push(novoCliente(ex, {nome:nome||trim(d.telefone), telefone:d.telefone, endereco:end||null})); return; }
  if(nome) c.nome = nome; c.telefone = trim(d.telefone); if(end) c.endereco = end;
}
// foto aceita: vazia (limpa), link http/https, caminho "/..." ou imagem pequena em data:image. Devolve {foto} ou {erro}
function validaFoto(ex, foto){
  var f = trim(foto); if(!f) return {foto:null};
  if(!/^(https?:\/\/|\/|data:image\/)/i.test(f)) return {erro:"A foto precisa ser um link (http/https) ou uma imagem."};
  if(f.length>ex.config.fotoMaxChars) return {erro:"A imagem é grande demais para guardar no navegador. Use uma foto menor ou um link."};
  return {foto:f};
}

// ---------- leitura (para as telas) ----------
// KPIs da tela principal: na fila, bipados, com cliente, devolvidos, pedir de volta, valor na rua (soma das ESTA_COM_CLIENTE) + extras
function exResumo(s){
  var ex = s.ex, r = {naFila:ex.fila.length, bipados:0, comCliente:0, devolvidos:0, pedirDeVolta:0, valorNaRua:0, pecasNaRua:0, danificadosAbertos:0, estoqueBaixo:0};
  ex.condicionais.forEach(function(c){
    if(c.status==="BIPADO") r.bipados++; else if(c.status==="ESTA_COM_CLIENTE"){ r.comCliente++; r.valorNaRua += num(c.valorTotal); r.pecasNaRua += num(c.quantidadeTotalPecas); } else r.devolvidos++;
    if(c.pedirDeVolta) r.pedirDeVolta++; if(c.condicaoDevolucao==="DANIFICADO" && c.statusAvaria!=="RESOLVIDO") r.danificadosAbertos++;
  });
  ex.estoque.forEach(function(i){ if(estoqueBaixo(i)) r.estoqueBaixo++; }); r.valorNaRua = r2(r.valorNaRua); return r;
}
// Fila de espera por ordem de entrada. f = {busca}
function exFila(s, f){
  f = f||{}; var q = norm(f.busca), dq = apenasDigitos(f.busca);
  return s.ex.fila.filter(function(x){ return !q || norm(x.nome).indexOf(q)>=0 || (dq && telefoneKey(x.telefone).indexOf(dq)>=0) || norm(x.observacao).indexOf(q)>=0; });
}
// Condicionais com filtros: f = {status, condicao, pedirDeVolta:true, busca, de, ate (sobre dataSaida), vinculo:{tipo|revendedoraId|representante}, ordem:"recentes"|"numero"|"nome"}
function exCondicionais(s, f){
  f = f||{}; var q = norm(f.busca), dq = apenasDigitos(f.busca), v = f.vinculo||null;
  var l = s.ex.condicionais.filter(function(c){
    if(f.status && c.status!==f.status) return false; if(f.condicao && c.condicaoDevolucao!==f.condicao) return false; if(f.pedirDeVolta && !c.pedirDeVolta) return false;
    if(f.de && (!c.dataSaida || diaDe(c.dataSaida)<f.de)) return false; if(f.ate && (!c.dataSaida || diaDe(c.dataSaida)>f.ate)) return false;
    if(v){ var cv = c.vinculo||{}; if(v.tipo && cv.tipo!==v.tipo) return false; if(v.revendedoraId!=null && String(cv.revendedoraId)!==String(v.revendedoraId)) return false; if(v.representante && norm(cv.representante)!==norm(v.representante)) return false; }
    if(q){ var tx = norm(c.nome+" "+(c.endereco||"")+" "+textoBuscaNumero(c)+" "+(c.retiradoPorNome||"")); if(tx.indexOf(q)<0 && !(dq && telefoneKey(c.telefone).indexOf(dq)>=0)) return false; }
    return true;
  });
  var ord = f.ordem||"recentes";
  l.sort(function(a, b){ if(ord==="numero") return a.numero-b.numero; if(ord==="nome") return norm(a.nome)<norm(b.nome) ? -1 : 1; return String(b.criadoEm).localeCompare(String(a.criadoEm)) || b.numero-a.numero; });
  return l;
}
function exCondicional(s, id){ return achaCond(s.ex, id)||null; }
// há quantos dias a condicional está com a cliente (null se não saiu) e se já passou do aviso
function exDiasComCliente(c, hoje){ if(c.status!=="ESTA_COM_CLIENTE" || !c.dataSaida) return null; return Math.max(0, diasEntre(diaDe(c.dataSaida), hoje||hojeSP())); }
function exPassouDoAviso(s, c, hoje){ var d = exDiasComCliente(c, hoje); return d!=null && d>=s.ex.config.diasAvisoDevolucao; }
// Tela Danificados: condicionais devolvidas como DANIFICADO. f = {statusAvaria, tipoAvaria, busca}. Traz também totais
function exDanificados(s, f){
  f = f||{}; var q = norm(f.busca), lista = s.ex.condicionais.filter(function(c){
    if(c.condicaoDevolucao!=="DANIFICADO") return false; if(f.statusAvaria && c.statusAvaria!==f.statusAvaria) return false; if(f.tipoAvaria && c.tipoAvaria!==f.tipoAvaria) return false;
    return !q || norm(c.nome+" "+textoBuscaNumero(c)+" "+(c.responsavelDevolucao||"")+" "+(c.descricaoAvaria||"")).indexOf(q)>=0; });
  lista.sort(function(a, b){ return String(b.dataDevolucao||"").localeCompare(String(a.dataDevolucao||"")); });
  var t = {total:lista.length, aberto:0, emReparo:0, resolvido:0, valorEstimadoAberto:0};
  lista.forEach(function(c){ if(c.statusAvaria==="ABERTO") t.aberto++; else if(c.statusAvaria==="EM_REPARO") t.emReparo++; else if(c.statusAvaria==="RESOLVIDO") t.resolvido++;
    if(c.statusAvaria!=="RESOLVIDO") t.valorEstimadoAberto += num(c.valorEstimadoReparo); });
  t.valorEstimadoAberto = r2(t.valorEstimadoAberto); return {lista:lista, totais:t};
}
// Estoque de expositores por nome. f = {busca, soBaixo:true}. Traz totais (produtos, peças, valor em estoque, itens em alerta) e a marca "usado"
function exEstoque(s, f){
  f = f||{}; var q = norm(f.busca);
  var lista = s.ex.estoque.filter(function(i){ return (!q || norm(i.nome+" "+i.codigo).indexOf(q)>=0) && (!f.soBaixo || estoqueBaixo(i)); })
    .sort(function(a, b){ return norm(a.nome)<norm(b.nome) ? -1 : 1; }).map(function(i){ return Object.assign({}, i, {baixo:estoqueBaixo(i), usado:itemUsado(s.ex, i.id), valorTotal:r2(i.valorUnitario*i.quantidade)}); });
  var tot = {totalProdutos:s.ex.estoque.length, totalPecas:0, valorEmEstoque:0, emAlerta:0};
  s.ex.estoque.forEach(function(i){ tot.totalPecas += i.quantidade; tot.valorEmEstoque += i.valorUnitario*i.quantidade; if(estoqueBaixo(i)) tot.emAlerta++; }); tot.valorEmEstoque = r2(tot.valorEmEstoque);
  return {lista:lista, totais:tot};
}
// Base de clientes (busca por nome, telefone ou endereço) e busca rápida do formulário de montagem (máx n resultados)
function exClientes(s, busca){ var q = norm(busca), dq = apenasDigitos(busca); return s.ex.clientes.filter(function(c){ return !q || norm(c.nome+" "+(c.endereco||"")).indexOf(q)>=0 || (dq && c.telefoneKey.indexOf(dq)>=0); }).sort(function(a, b){ return norm(a.nome)<norm(b.nome) ? -1 : 1; }); }
function exClientesBusca(s, texto, n){ return exClientes(s, texto).slice(0, n||8); }
// Condicionais de uma pessoa (revendedora por id ou nome, representante por nome, kit novo por id)
function exDaPessoa(s, p){
  p = p||{}; return s.ex.condicionais.filter(function(c){ var v = c.vinculo||{};
    return (p.revendedoraId!=null && String(v.revendedoraId)===String(p.revendedoraId)) || (p.revendedora && norm(v.revendedoraNome)===norm(p.revendedora)) || (p.representante && norm(v.representante)===norm(p.representante)) || (p.kitNovoId!=null && String(v.kitNovoId)===String(p.kitNovoId)); });
}
// Fotos de expositor tiradas na entrega do kit novo (s.entregasKN): [{kitId, rev, rep, foto, nome, em, temCondicional}]
function exFotosKitNovo(s){
  var e = s.entregasKN||{}, usados = {}; s.ex.condicionais.forEach(function(c){ if(c.vinculo && c.vinculo.kitNovoId!=null) usados[String(c.vinculo.kitNovoId)] = c.id; });
  return Object.keys(e).map(function(id){ return e[id]; }).filter(function(x){ return x && x.fotoExpositor; })
    .map(function(x){ return {kitId:x.kitId, rev:x.rev, rep:x.rep, foto:x.fotoExpositor, nome:x.fotoNome||"", em:x.fotoEm||null, condicionalId:usados[String(x.kitId)]||null}; })
    .sort(function(a, b){ return String(b.em||"").localeCompare(String(a.em||"")); });
}
// Entrada na fila de um kit novo "com expositor": devolve se já existe (para a tela esconder o botão)
function exFilaDoKitNovo(s, kitId){ return s.ex.fila.find(function(x){ return x.vinculo && x.vinculo.kitNovoId!=null && String(x.vinculo.kitNovoId)===String(kitId); })||s.ex.condicionais.find(function(c){ return c.vinculo && c.vinculo.kitNovoId!=null && String(c.vinculo.kitNovoId)===String(kitId); })||null; }
// Preenchimento padrão do formulário ao escolher o status (data = hoje, retirado por = usuário logado; BIPADO fica sem)
function exPadraoSaida(status, por, hoje){ return status==="ESTA_COM_CLIENTE" ? {dataSaida:hoje||hojeSP(), retiradoPorNome:por||""} : {dataSaida:null, retiradoPorNome:null}; }

// ---------- operações ----------
function exReduz(s, a){
  var ex = clone(s.ex), cfg = ex.config, por = a.por||"—", agora = a.agora||agoraSP(), hoje = diaDe(agora), recusa = function(t){ return {patch:{}, msg:t}; };
  var gravaLog = function(txt){ ex.log.unshift({em:agora, por:por, op:a.op, txt:txt}); if(ex.log.length>500) ex.log.length = 500; };
  var ok = function(msg){ gravaLog(msg); return {patch:{ex:ex}, msg:msg}; };
  var cond = function(){ return achaCond(ex, a.id); };
  var NAO_ACHOU = "Condicional não encontrada.";
  var nomeFone = function(){ if(!trim(a.nome)) return "Informe o nome da cliente."; if(!trim(a.telefone)) return "Informe o telefone."; return null; };
  var numeroLivre = function(n, ignorarId){ return !ex.condicionais.some(function(c){ return c.numero===n && c.id!==ignorarId; }); };
  // número digitado: inteiro ≥ 1 (devolve {n} ou {erro}); vazio = automático (n null)
  var lerNumero = function(){ if(a.numero==null || a.numero==="") return {n:null}; var n = Number(a.numero); if(!inteiroPos(n)) return {erro:"O número da condicional precisa ser um inteiro de 1 em diante."}; return {n:n}; };
  var validaStatus = function(st){ return STATUS_EDITAVEIS.indexOf(st)>=0; };
  var dataOk = function(d){ return !d || ehDia(diaDe(d)); };
  switch(a.op){
    case "config_set": {
      var NUMS = ["estoqueMinimoPadrao", "fotoMaxChars", "diasAvisoDevolucao"], mudou = [];
      NUMS.forEach(function(k){ if(a[k]!==undefined && a[k]!==""){ var v = Math.floor(num(a[k])); if(v<0) return; cfg[k] = v; mudou.push(k); } });
      if(a.reprecificarAoEditar!==undefined){ cfg.reprecificarAoEditar = !!a.reprecificarAoEditar; mudou.push("reprecificarAoEditar"); }
      return mudou.length ? ok("Configuração dos expositores salva.") : recusa("Nada para salvar.");
    }

    // ----- estoque de expositores -----
    case "estoque_add": {
      var cod = trim(a.codigo), nm = trim(a.nome); if(!cod) return recusa("Informe o código do item."); if(!nm) return recusa("Informe o nome do item.");
      if(ex.estoque.some(function(i){ return i.codigo===cod; })) return recusa("Já existe um item com o código \""+cod+"\".");
      if(num(a.valorUnitario)<0 || num(a.quantidade)<0) return recusa("Valor e quantidade não podem ser negativos.");
      var fe = validaFoto(ex, a.foto); if(fe.erro) return recusa(fe.erro);
      ex.estoque.push(novoEstoque(ex, {codigo:cod, nome:nm, valorUnitario:a.valorUnitario, quantidade:a.quantidade, estoqueMinimo:a.estoqueMinimo, foto:fe.foto}, agora, por));
      return ok("Item "+cod+" cadastrado no estoque de expositores.");
    }
    case "estoque_edit": {
      var it = achaEstoque(ex, a.id); if(!it) return recusa("Item não encontrado.");
      if(a.codigo!==undefined && trim(a.codigo)!==it.codigo){ var cn = trim(a.codigo); if(!cn) return recusa("Informe o código do item."); if(ex.estoque.some(function(i){ return i.codigo===cn && i.id!==it.id; })) return recusa("Já existe um item com o código \""+cn+"\"."); it.codigo = cn; }
      if(a.nome!==undefined){ if(!trim(a.nome)) return recusa("Informe o nome do item."); it.nome = trim(a.nome); }
      if(a.valorUnitario!==undefined){ if(num(a.valorUnitario)<0) return recusa("O valor não pode ser negativo."); it.valorUnitario = r2(num(a.valorUnitario)); }   // não mexe nas condicionais já montadas (preço congelado)
      if(a.quantidade!==undefined){ if(num(a.quantidade)<0) return recusa("A quantidade não pode ser negativa."); it.quantidade = Math.floor(num(a.quantidade)); }
      if(a.estoqueMinimo!==undefined){ if(num(a.estoqueMinimo)<0) return recusa("O estoque mínimo não pode ser negativo."); it.estoqueMinimo = Math.floor(num(a.estoqueMinimo)); }
      if(a.foto!==undefined){ var f2 = validaFoto(ex, a.foto); if(f2.erro) return recusa(f2.erro); it.foto = f2.foto; }
      it.atualizadoEm = agora; return ok("Item "+it.codigo+" atualizado.");
    }
    case "estoque_del": {
      var id0 = a.id, i0 = achaEstoque(ex, id0); if(!i0) return recusa("Item não encontrado.");
      if(itemUsado(ex, id0)) return recusa("Este item já foi usado em condicionais e não pode ser excluído.");
      ex.estoque = ex.estoque.filter(function(i){ return i.id!==id0; }); return ok("Item "+i0.codigo+" excluído.");
    }

    // ----- fila de espera -----
    case "fila_add": {
      if(!trim(a.nome)) return recusa("Informe o nome."); if(!trim(a.telefone)) return recusa("Informe o telefone.");
      if(a.dataAcerto && !ehDia(a.dataAcerto)) return recusa("Data de acerto inválida.");
      var vk = novoVinculo(a.vinculo);   // kit novo com expositor não entra duas vezes na fila (nem se já virou condicional)
      if(vk && vk.kitNovoId!=null && exFilaDoKitNovo({ex:ex}, vk.kitNovoId)) return recusa("Este kit novo já está na fila de expositores.");
      ex.fila.push(novaFila(ex, {nome:a.nome, telefone:a.telefone, observacao:a.observacao, dataAcerto:a.dataAcerto, vinculo:vk}, agora, por));
      return ok(trim(a.nome)+" entrou na fila de expositores.");
    }
    case "fila_edit": {
      var fl = ex.fila.find(function(x){ return x.id===a.id; }); if(!fl) return recusa("Entrada da fila não encontrada.");
      if(a.nome!==undefined){ if(!trim(a.nome)) return recusa("Informe o nome."); fl.nome = trim(a.nome); }
      if(a.telefone!==undefined){ if(!trim(a.telefone)) return recusa("Informe o telefone."); fl.telefone = trim(a.telefone); }
      if(a.observacao!==undefined) fl.observacao = vazioParaNull(a.observacao);
      if(a.dataAcerto!==undefined){ if(a.dataAcerto && !ehDia(a.dataAcerto)) return recusa("Data de acerto inválida."); fl.dataAcerto = a.dataAcerto||null; }
      if(a.vinculo!==undefined) fl.vinculo = novoVinculo(a.vinculo);
      return ok("Entrada de "+fl.nome+" atualizada na fila.");
    }
    case "fila_del": {
      var fx = ex.fila.find(function(x){ return x.id===a.id; }); if(!fx) return recusa("Entrada da fila não encontrada.");
      ex.fila = ex.fila.filter(function(x){ return x.id!==a.id; }); return ok(fx.nome+" saiu da fila.");
    }

    // ----- montar / editar / excluir condicional -----
    case "cond_montar": {
      var er = nomeFone(); if(er) return recusa(er);
      var st = a.status||"BIPADO"; if(!validaStatus(st)) return recusa("O status precisa ser Bipado ou Está com a cliente.");
      var ln = lerNumero(); if(ln.erro) return recusa(ln.erro); if(ln.n!=null && !numeroLivre(ln.n)) return recusa("Já existe a condicional nº "+ln.n+".");
      if(!dataOk(a.dataSaida)) return recusa("Data de saída inválida.");
      var j = juntaItens(ex, a.itens); if(j.erro) return recusa(j.erro);
      var eb = baixaEstoque(ex, j.itens); if(eb) return recusa(eb);   // se algum item não tem saldo, nada é gravado
      var itens = aplicaBaixa(ex, j.itens, null, agora);
      var saida = st==="ESTA_COM_CLIENTE" ? {dataSaida:diaDe(a.dataSaida)||hoje, retiradoPorNome:trim(a.retiradoPorNome)||por} : {dataSaida:null, retiradoPorNome:null};
      var vc = novoVinculo(a.vinculo);
      var c = novaCondicional(ex, {numero:ln.n, status:st, nome:a.nome, telefone:a.telefone, endereco:a.endereco, observacoes:a.observacoes, dataSaida:saida.dataSaida, retiradoPorNome:saida.retiradoPorNome, itens:itens, vinculo:vc}, agora, por);
      ex.condicionais.push(c);
      if(a.filaId) ex.fila = ex.fila.filter(function(x){ return x.id!==a.filaId; });   // sai da fila (se já tinha sumido, segue sem erro)
      upsertCliente(ex, {nome:a.nome, telefone:a.telefone, endereco:a.endereco});
      return ok("Expositor nº "+rotuloNumero(c)+" montado para "+c.nome+" ("+c.quantidadeTotalPecas+" peças, "+formatarReais(c.valorTotal)+").");
    }
    case "cond_edit": {
      var ce = cond(); if(!ce) return recusa(NAO_ACHOU);
      if(ce.status==="DEVOLVIDO") return recusa("Condicional já devolvida não pode ser editada.");
      var er2 = nomeFone(); if(er2) return recusa(er2);
      if(a.status!==undefined && !validaStatus(a.status)) return recusa("O status precisa ser Bipado ou Está com a cliente.");
      var ln2 = lerNumero(); if(ln2.erro) return recusa(ln2.erro); if(ln2.n!=null && ln2.n!==ce.numero && !numeroLivre(ln2.n, ce.id)) return recusa("Já existe a condicional nº "+ln2.n+".");
      if(a.dataSaida!==undefined && !dataOk(a.dataSaida)) return recusa("Data de saída inválida.");
      var antigos = ce.itens, congelados = {};
      if(!cfg.reprecificarAoEditar) antigos.forEach(function(i){ congelados[i.estoqueItemId] = i.valorUnitario; });
      estorna(ex, antigos, agora);   // estorna os itens antigos antes de conferir o saldo dos novos
      var j2 = juntaItens(ex, a.itens||[]); if(j2.erro) return recusa(j2.erro);
      var eb2 = baixaEstoque(ex, j2.itens); if(eb2) return recusa(eb2);   // recusa = nada muda (o estorno só existia na cópia)
      var novos = aplicaBaixa(ex, j2.itens, congelados, agora);
      var semItens = antigos.length===0 && novos.length===0;   // importada da Devmaster (sem itens): salvar sem itens mantém peças e valor
      ce.itens = novos; if(!semItens){ ce.quantidadeTotalPecas = somaPecas(novos); ce.valorTotal = somaValor(novos); }
      if(ln2.n!=null){ ce.numero = ln2.n; if(ln2.n>ex.seqNumero) ex.seqNumero = ln2.n; }
      ce.nome = trim(a.nome); ce.telefone = trim(a.telefone); ce.endereco = vazioParaNull(a.endereco); ce.observacoes = vazioParaNull(a.observacoes);
      var stNovo = a.status||ce.status;
      if(stNovo==="BIPADO"){ ce.dataSaida = null; ce.retiradoPorNome = null; }
      else { ce.dataSaida = a.dataSaida!==undefined ? (diaDe(a.dataSaida)||ce.dataSaida||hoje) : (ce.dataSaida||hoje); ce.retiradoPorNome = a.retiradoPorNome!==undefined ? (trim(a.retiradoPorNome)||ce.retiradoPorNome||por) : (ce.retiradoPorNome||por); }
      ce.status = stNovo; if(a.vinculo!==undefined) ce.vinculo = novoVinculo(a.vinculo);
      ce.atualizadoEm = agora; ce.atualizadoPor = por;
      upsertCliente(ex, {nome:a.nome, telefone:a.telefone, endereco:a.endereco});
      return ok("Expositor nº "+rotuloNumero(ce)+" atualizado.");
    }
    case "cond_del": {
      var cd = cond(); if(!cd) return recusa(NAO_ACHOU);
      if(pecasFora(cd)) estorna(ex, cd.itens, agora);   // não devolvida: estorna o estoque; devolvida: não mexe (já passou pela devolução)
      ex.condicionais = ex.condicionais.filter(function(x){ return x.id!==cd.id; });
      return ok("Expositor nº "+rotuloNumero(cd)+" excluído"+(pecasFora(cd) && cd.itens.length ? " (peças voltaram ao estoque)." : "."));
    }

    // ----- pedir de volta / devolução / avaria -----
    case "cond_pedir_volta": {
      var cp = cond(); if(!cp) return recusa(NAO_ACHOU);
      if(a.pedirDeVolta && cp.status==="DEVOLVIDO") return recusa("Este expositor já foi devolvido.");   // acréscimo: o original não trava, mas devolução já limpa o pedido
      cp.pedirDeVolta = !!a.pedirDeVolta; cp.pedirDeVoltaMotivo = a.pedirDeVolta ? vazioParaNull(a.motivo) : null; cp.pedirDeVoltaData = a.pedirDeVolta ? agora : null;
      cp.atualizadoEm = agora; cp.atualizadoPor = por;
      return ok(a.pedirDeVolta ? "Pedido de devolução marcado para "+cp.nome+"." : "Pedido de devolução desmarcado.");
    }
    case "cond_devolver": {
      var cv = cond(); if(!cv) return recusa(NAO_ACHOU);
      if(cv.status!=="ESTA_COM_CLIENTE") return recusa("Só é possível devolver uma condicional que está com a cliente.");
      if(CONDICOES.indexOf(a.condicaoDevolucao)<0) return recusa("Escolha a condição em que o expositor voltou.");
      if(a.dataDevolucao && !dataOk(a.dataDevolucao)) return recusa("Data de devolução inválida.");
      var dan = a.condicaoDevolucao==="DANIFICADO";
      if(dan && a.tipoAvaria && TIPOS_AVARIA.indexOf(a.tipoAvaria)<0) return recusa("Tipo de avaria inválido.");
      if(dan && a.valorEstimadoReparo!=null && a.valorEstimadoReparo!=="" && num(a.valorEstimadoReparo)<0) return recusa("O valor estimado de reparo não pode ser negativo.");
      if(CONDICOES_QUE_VOLTAM.indexOf(a.condicaoDevolucao)>=0) estorna(ex, cv.itens, agora);   // Novo/Bom: peças voltam; as outras não voltam nunca
      cv.status = "DEVOLVIDO"; cv.dataDevolucao = a.dataDevolucao ? String(a.dataDevolucao) : agora; cv.condicaoDevolucao = a.condicaoDevolucao; cv.observacaoDevolucao = vazioParaNull(a.observacaoDevolucao);
      cv.pedirDeVolta = false; cv.pedirDeVoltaMotivo = null; cv.pedirDeVoltaData = null;   // devolver limpa o "pedir de volta"
      cv.motivoDevolucao = dan ? vazioParaNull(a.motivoDevolucao) : null; cv.responsavelDevolucao = dan ? vazioParaNull(a.responsavelDevolucao) : null;
      cv.tipoAvaria = dan ? (a.tipoAvaria||null) : null; cv.descricaoAvaria = dan ? vazioParaNull(a.descricaoAvaria) : null;
      cv.valorEstimadoReparo = dan && a.valorEstimadoReparo!=null && a.valorEstimadoReparo!=="" ? r2(num(a.valorEstimadoReparo)) : null; cv.statusAvaria = dan ? "ABERTO" : null;
      cv.atualizadoEm = agora; cv.atualizadoPor = por;
      return ok("Expositor nº "+rotuloNumero(cv)+" devolvido ("+rotuloCondicao(cv.condicaoDevolucao).toLowerCase()+")"+(CONDICOES_QUE_VOLTAM.indexOf(cv.condicaoDevolucao)>=0 && cv.itens.length ? ", peças de volta ao estoque." : "."));
    }
    case "cond_avaria": {
      var ca = cond(); if(!ca) return recusa(NAO_ACHOU);
      if(ca.condicaoDevolucao!=="DANIFICADO") return recusa("Só é possível editar avaria de condicionais devolvidas como danificadas.");
      if(a.tipoAvaria!==undefined && a.tipoAvaria!==null && TIPOS_AVARIA.indexOf(a.tipoAvaria)<0) return recusa("Tipo de avaria inválido.");
      if(a.statusAvaria!==undefined && STATUS_AVARIA.indexOf(a.statusAvaria)<0) return recusa("Status do reparo inválido.");
      if(a.valorEstimadoReparo!==undefined && a.valorEstimadoReparo!==null && a.valorEstimadoReparo!=="" && num(a.valorEstimadoReparo)<0) return recusa("O valor estimado de reparo não pode ser negativo.");
      ["motivoDevolucao", "responsavelDevolucao", "descricaoAvaria"].forEach(function(k){ if(a[k]!==undefined) ca[k] = vazioParaNull(a[k]); });
      if(a.tipoAvaria!==undefined) ca.tipoAvaria = a.tipoAvaria||null;
      if(a.valorEstimadoReparo!==undefined) ca.valorEstimadoReparo = a.valorEstimadoReparo===null || a.valorEstimadoReparo==="" ? null : r2(num(a.valorEstimadoReparo));
      if(a.statusAvaria!==undefined) ca.statusAvaria = a.statusAvaria;
      ca.atualizadoEm = agora; ca.atualizadoPor = por;
      return ok("Avaria do expositor nº "+rotuloNumero(ca)+" atualizada"+(a.statusAvaria ? " ("+rotuloStatusAvaria(ca.statusAvaria).toLowerCase()+")." : "."));
    }

    // ----- fotos -----
    case "cond_foto": {
      var cf = cond(); if(!cf) return recusa(NAO_ACHOU); if(SLOTS_FOTO.indexOf(a.slot)<0) return recusa("Lugar de foto inválido.");
      var ff = validaFoto(ex, a.foto); if(ff.erro) return recusa(ff.erro); if(!ff.foto) return recusa("Escolha a foto.");
      cf.fotos[a.slot] = ff.foto; cf.atualizadoEm = agora; cf.atualizadoPor = por; return ok("Foto ("+ROTULO_SLOT[a.slot].toLowerCase()+") anexada ao expositor nº "+rotuloNumero(cf)+".");
    }
    case "cond_foto_del": {
      var cx = cond(); if(!cx) return recusa(NAO_ACHOU); if(SLOTS_FOTO.indexOf(a.slot)<0) return recusa("Lugar de foto inválido.");
      cx.fotos[a.slot] = null; cx.atualizadoEm = agora; cx.atualizadoPor = por; return ok("Foto removida do expositor nº "+rotuloNumero(cx)+".");
    }

    // ----- base de clientes -----
    case "cliente_edit": {
      var cl = ex.clientes.find(function(x){ return x.id===a.id; }); if(!cl) return recusa("Cliente não encontrada.");
      var tel = a.telefone!==undefined ? trim(a.telefone) : cl.telefone, key = telefoneKey(tel); if(!key) return recusa("Telefone precisa ter ao menos um dígito.");
      if(ex.clientes.some(function(x){ return x.id!==cl.id && x.telefoneKey===key; })) return recusa("Já existe uma cliente com esse telefone na base.");
      if(a.nome!==undefined) cl.nome = trim(a.nome); if(a.endereco!==undefined) cl.endereco = vazioParaNull(a.endereco); cl.telefone = tel; cl.telefoneKey = key;
      return ok("Cliente "+cl.nome+" atualizada na base.");
    }
    case "cliente_del": {
      var cz = ex.clientes.find(function(x){ return x.id===a.id; }); if(!cz) return recusa("Cliente não encontrada.");
      ex.clientes = ex.clientes.filter(function(x){ return x.id!==a.id; }); return ok("Cliente "+cz.nome+" saiu da base (as condicionais não mudam).");   // sem vínculo com as condicionais
    }

    // ----- carga das condicionais abertas da Devmaster (sem itens, sem baixar estoque) -----
    // a.linhas = [{codigoDevmaster, nome, telefone, endereco, dataSaida, quantidadeTotalPecas, valorTotal}]
    case "cond_importar": {
      var linhas = a.linhas||[], novasN = 0, vinc = 0, pul = 0;
      linhas.forEach(function(l){
        var cod2 = Math.floor(num(l.codigoDevmaster)); if(!inteiroPos(cod2) || !trim(l.nome)){ pul++; return; }
        if(ex.condicionais.some(function(c){ return c.codigoDevmaster===cod2; })){ pul++; return; }
        var igual = ex.condicionais.find(function(c){ return c.numero===cod2 && c.codigoDevmaster==null; });
        if(igual){ igual.codigoDevmaster = cod2; vinc++; return; }   // número interno já era o código da Devmaster: só vincula, não duplica
        ex.condicionais.push(novaCondicional(ex, {numero:cod2, codigoDevmaster:cod2, status:"ESTA_COM_CLIENTE", nome:l.nome, telefone:l.telefone, endereco:l.endereco, dataSaida:l.dataSaida||null, retiradoPorNome:null,
          itens:[], quantidadeTotalPecas:l.quantidadeTotalPecas||0, valorTotal:l.valorTotal||0}, agora, por));
        upsertCliente(ex, {nome:l.nome, telefone:l.telefone, endereco:l.endereco});   // "Não informado" não tem dígito: não entra na base
        novasN++;
      });
      return novasN || vinc ? ok("Importação: "+novasN+" nova(s), "+vinc+" vinculada(s), "+pul+" ignorada(s).") : recusa("Nada novo para importar.");
    }
  }
  return recusa("Ação de expositores desconhecida.");
}

export { exDemo, exMigrar, exReduz, exVazio,
  exResumo, exFila, exCondicionais, exCondicional, exDiasComCliente, exPassouDoAviso, exDanificados, exEstoque, exClientes, exClientesBusca, exDaPessoa, exFotosKitNovo, exFilaDoKitNovo, exPadraoSaida, exPreviaMontagem,
  estoqueBaixo, itemUsado, telefoneKey, rotuloNumero, textoBuscaNumero, formatarReais, formatarDia, formatarDataHora, validaFoto,
  STATUS, STATUS_EDITAVEIS, CONDICOES, CONDICOES_QUE_VOLTAM, TIPOS_AVARIA, STATUS_AVARIA, SLOTS_FOTO, TIPOS_VINCULO, CONFIG_PADRAO,
  ROTULO_STATUS, TOM_STATUS, ROTULO_CONDICAO, TOM_CONDICAO, ROTULO_AVARIA, ROTULO_STATUS_AVARIA, TOM_STATUS_AVARIA, ROTULO_SLOT, ROTULO_VINCULO,
  rotuloStatus, tomStatus, rotuloCondicao, tomCondicao, rotuloAvaria, rotuloStatusAvaria, tomStatusAvaria };

// Sorelly Admin · montagem — domain/recebimentos-antecipados.js
// PIX ANTES DO ACERTO, lançado em CONTAS A RECEBER (Marcus, 20/11/2026: "isso é pagamento da revendedora para a Sorelly; é lançado no Contas a receber e, por ser do Marcus, aí sim cai na Família").
// O dinheiro já entrou, mas o acerto só acontece dias depois e a DevMaster ainda não tem a baixa. Este arquivo guarda o que a tela de Contas a receber mostra e o acerto consome.
// Lugar dos dados: módulo `contasreceber` (só Financeiro e Diretoria), chave `antecipados` (lista) + `usados` (mapa: id → acerto que consumiu) + `adotados` (ids de Pix que já estavam no Financeiro familiar).
//  - destino "empresa": o Pix fica SÓ aqui (conta da empresa). O acerto o consome pelo mapa `usados` deste módulo.
//  - destino "socio": o Pix também nasce no Financeiro familiar (ff.pix, mesma conta e mesma regra de repasse do prestador): UM lançamento só, a Família recebe a cópia. A marca de uso fica em ff.pixUsados.
//  - adotados: os Pix que já estavam na Família antes desta tela (ex.: os 4 da Karine) passam a aparecer aqui sem lançar de novo.
// Funções puras (sem banco), testadas em scripts/testar-recebimento-antecipado.mjs. A gravação está em src/server/recebimentos-antecipados.js.
import { nomeParecido, JANELA_SEM_ACERTO } from "./pix-adiantados.js";

var r2 = function(v){ return Math.round((Number(v)||0)*100)/100; };
var DATA_OK = /^\d{4}-\d{2}-\d{2}$/;
var somaDias = function(iso, n){ var d = new Date(iso+"T12:00:00Z"); d.setUTCDate(d.getUTCDate()+n); return d.toISOString().slice(0, 10); };
var novoId = function(){ return "ra"+Date.now().toString(36)+Math.random().toString(36).slice(2, 7); };
var limpa = function(t){ return String(t==null ? "" : t).replace(/\s+/g, " ").trim(); };
var qtdPalavras = function(t){ return limpa(t).split(" ").filter(function(w){ return w.length>0 && ["da", "de", "do", "das", "dos", "e"].indexOf(w.toLowerCase())<0; }).length; };

function vazio(){ return {antecipados:[], usados:{}, adotados:[]}; }
function garantir(rcb){ var o = Object.assign({}, rcb || {}); if(!Array.isArray(o.antecipados)) o.antecipados = []; if(!o.usados || typeof o.usados!=="object") o.usados = {}; if(!Array.isArray(o.adotados)) o.adotados = []; return o; }

// Confere o que a pessoa digitou. Devolve {erro} ou {item}. Nada é gravado aqui.
function validarLancamento(b, hoje, jaLancados){
  var x = b || {}, data = limpa(x.data), valor = r2(x.valor), rev = limpa(x.rev), destino = x.destino==="socio" ? "socio" : "empresa", tipo = x.tipo==="outro" ? "outro" : "antes";
  if(!DATA_OK.test(data)) return {erro:"Informe a data do Pix."};
  if(data>(hoje || new Date().toISOString().slice(0, 10))) return {erro:"A data do Pix não pode ser futura."};
  if(!(valor>0) || valor>1000000) return {erro:"Informe o valor do Pix."};
  if(rev.length<5 || qtdPalavras(rev)<2 || rev.length>120) return {erro:"Escreva o nome completo da revendedora (nome e sobrenome), como está no comprovante."};
  if(destino==="socio" && !limpa(x.personaId)) return {erro:"Escolha a conta que recebeu."};
  var dup = (jaLancados || []).some(function(y){ return y.data===data && r2(y.valor)===valor && nomeParecido(y.rev, rev); });
  if(dup) return {erro:"Esse Pix já está lançado (mesma revendedora, data e valor)."};
  return {item:{id:novoId(), data:data, valor:valor, rev:rev, destino:destino, tipo:tipo, destinoId:limpa(x.destinoId), destinoNome:limpa(x.destinoNome).slice(0, 120), personaId:destino==="socio" ? limpa(x.personaId) : "", contaId:destino==="socio" ? limpa(x.contaId) : "", contaTxt:destino==="empresa" ? limpa(x.contaTxt).slice(0, 60) : "",
    compKey:"", compNome:"", compTipo:"", ffPixId:"", por:"", em:""}};
}

// Pix da EMPRESA que o acerto desta revendedora pode consumir (os de sócio já saem de ff.pix, por pixAdiantadosDe). Mesma regra: nome parecido, depois do último acerto, ainda livre.
function antecipadosDe(rcb0, nome, opcoes){
  var rcb = garantir(rcb0), o = opcoes || {}, hoje = o.hoje || new Date().toISOString().slice(0, 10), desde = o.desde || somaDias(hoje, -JANELA_SEM_ACERTO);
  return rcb.antecipados.filter(function(x){
    if(!x || x.destino!=="empresa" || x.tipo==="outro" || !(x.valor>0) || !x.data || !(x.data>desde)) return false;
    var u = rcb.usados[x.id]; if(u && u.internoId!==o.internoId) return false;
    return nomeParecido(x.rev, nome);
  }).sort(function(a, b){ return a.data<b.data ? -1 : a.data>b.data ? 1 : 0; }).map(function(x){
    return {id:x.id, data:x.data, valor:r2(x.valor), origem:x.rev, conta:x.contaTxt || "PIX DIRETO", auditoria:"PENDENTE", compKey:x.compKey || "", compNome:x.compNome || "", meu:!!(rcb.usados[x.id] && rcb.usados[x.id].internoId===o.internoId)};
  });
}

// Marca (ou solta) os Pix da EMPRESA de UM atendimento. Idempotente. ids = os ids do módulo contasreceber que o atendimento usa AGORA (os de sócio vão por sincronizarUso, do ff).
function sincronizarUsoRcb(rcb0, args){
  var rcb = JSON.parse(JSON.stringify(garantir(rcb0))), a = args || {}, usos = rcb.usados, ids = (a.ids || []).filter(Boolean), marcados = [], soltos = [], recusados = [];
  if(!a.internoId) return {rcb:rcb, marcados:marcados, soltos:soltos, recusados:[{id:"", motivo:"Sem atendimento."}]};
  ids.forEach(function(id){
    var x = rcb.antecipados.find(function(y){ return y.id===id && y.destino==="empresa" && y.tipo!=="outro"; });
    if(!x){ recusados.push({id:id, motivo:"Pix não encontrado."}); return; }
    if(usos[id] && usos[id].internoId!==a.internoId){ recusados.push({id:id, motivo:"Esse Pix já foi usado em outro acerto."}); return; }
    if(!nomeParecido(x.rev, a.rev)){ recusados.push({id:id, motivo:"Esse Pix não é desta revendedora."}); return; }
    if(!usos[id]){ usos[id] = {internoId:a.internoId, rev:a.rev, em:a.em || new Date().toISOString(), por:a.por || "", valor:r2(x.valor)}; marcados.push(id); }
  });
  Object.keys(usos).forEach(function(id){ if(usos[id] && usos[id].internoId===a.internoId && ids.indexOf(id)<0){ delete usos[id]; soltos.push(id); } });
  return {rcb:rcb, marcados:marcados, soltos:soltos, recusados:recusados};
}

// Linhas que a tela Contas a receber mostra. verFf = a pessoa abre o Financeiro familiar (só ela vê o nome da conta de prestador e o comprovante guardado lá).
// Cada linha: {id, fonte:"rcb"|"ff", data, valor, rev, destino:"empresa"|"socio", conta, compKey, compModulo, uso:{rev, em}|null, ffPixId}. Do mais novo para o mais antigo.
function linhasAntecipados(rcb0, ff, opcoes){
  var rcb = garantir(rcb0), verFf = !!(opcoes && opcoes.verFf), usosFf = (ff && ff.pixUsados) || {}, out = [];
  var contaDe = function(id){ var c = ((ff && ff.contasBanc) || []).find(function(z){ return z.id===id; }); return c ? c.nome : ""; };
  var nomePersona = function(id){ var p = ((ff && ff.personas) || []).find(function(z){ return z.id===id; }); return p ? p.nome : ""; };
  var usoDe = function(u){ return u ? {rev:u.rev || "", em:u.em || "", internoId:u.internoId || ""} : null; };
  rcb.antecipados.forEach(function(x){
    if(!x) return;
    var uso = x.destino==="socio" ? usosFf[x.ffPixId] : rcb.usados[x.id];
    var conta = x.destinoNome ? x.destinoNome : x.destino==="socio" ? (verFf ? (contaDe(x.contaId) || "Conta da família")+(nomePersona(x.personaId) ? " · "+nomePersona(x.personaId) : "") : "Pix direto") : (x.contaTxt || "Pix direto");
    out.push({id:x.id, fonte:"rcb", tipo:x.tipo || "antes", pagador:x.pagador || "", repNome:x.repNome || "", data:x.data, valor:r2(x.valor), rev:x.rev, destino:x.destino, conta:conta, compKey:x.compKey || "", compModulo:"contasreceber", uso:usoDe(uso), ffPixId:x.ffPixId || "", por:x.por || "", em:x.em || ""});
  });
  rcb.adotados.forEach(function(id){
    var x = ((ff && ff.pix) || []).find(function(y){ return y.id===id; });
    if(!x || rcb.antecipados.some(function(z){ return z.ffPixId===id; })) return;
    out.push({id:id, fonte:"ff", tipo:"antes", pagador:"", repNome:"", data:x.data, valor:r2(x.valor), rev:x.origem || "", destino:"socio", conta:verFf ? (contaDe(x.contaId) || "Conta da família")+(nomePersona(x.personaId) ? " · "+nomePersona(x.personaId) : "") : "Pix direto",
      compKey:verFf ? (x.compKey || "") : "", compModulo:"ff", uso:usoDe(usosFf[id]), ffPixId:id, por:"", em:""});
  });
  return out.sort(function(a, b){ return a.data<b.data ? 1 : a.data>b.data ? -1 : 0; });
}

// CÓPIA na Família: faz o MESMO que a ação pix_add de domain/financeiro-familiar.js (o Pix entra em ff.pix como "Aguardando" e, se a conta é de prestador, gera UM repasse) e a pix_comp (comprovante).
// Fica aqui, e não importando o reducer da Família, para o servidor não carregar os dados reais da Família. scripts/testar-recebimento-antecipado.mjs compara os dois resultados.
// Devolve {ff (cópia nova), pixId} ou {erro}.
function espelharNaFamilia(ff0, a){
  var ff = JSON.parse(JSON.stringify(ff0 || {})), v = r2(a.valor);
  if(!Array.isArray(ff.pix) || !Array.isArray(ff.repasses) || !Array.isArray(ff.contasBanc) || !Array.isArray(ff.personas)) return {erro:"O Financeiro familiar ainda não está no servidor."};
  if(!ff.personas.some(function(p){ return p.id===a.personaId; })) return {erro:"Pessoa não encontrada no Financeiro familiar."};
  var cb = ff.contasBanc.find(function(c){ return c.id===a.contaId; });
  if(a.contaId && !cb) return {erro:"Conta não encontrada no Financeiro familiar."};   // sem conta (Pix para o sócio) também vale
  var id = "px"+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36);
  var l = {id:id, personaId:a.personaId, data:a.data, valor:v, origem:limpa(a.origem), contaId:a.contaId, forma:"PIX", auditoria:"PENDENTE", auditadoPor:""};
  if(a.semAcerto) l.semAcerto = true;   // outro recebimento: o acerto nunca usa este Pix
  if(a.compKey){ l.compKey = a.compKey; l.compNome = String(a.compNome || "").slice(0, 120); l.compTipo = String(a.compTipo || "").slice(0, 60); }
  ff.pix.push(l);
  var repasse = null, divida = null;
  if(cb && cb.prestadorId){
    repasse = {id:"rp"+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36), prestId:cb.prestadorId, valor:l.valor, data:l.data, origem:"PIX revendedora", forma:"PIX", conta:cb.nome, chavePixDestino:cb.chavePix || "", origemPixPersonaId:l.personaId, origemPixLancId:l.id};
    if(limpa(a.divida)){   // a dívida do mesmo valor nasce junto e o pagamento já aponta para ela (Enviado → Dívida)
      if(!Array.isArray(ff.dividas)) ff.dividas = [];
      divida = {id:"dv"+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36), prestId:cb.prestadorId, valor:l.valor, data:l.data, prazo:"", descricao:limpa(a.divida).slice(0, 120), obs:""};
      ff.dividas.push(divida); repasse.divId = divida.id;
    }
    ff.repasses.push(repasse);
  }
  ff.hist = Array.isArray(ff.hist) ? ff.hist : [];
  ff.hist.unshift({id:"h"+Date.now().toString(36)+Math.floor(Math.random()*46656).toString(36), em:Date.now(), por:a.por || "—", area:"PIX revendedoras", acao:"Lançou PIX (Contas a receber)", alvo:(l.origem || "sem nome")+" · "+(((ff.personas.find(function(p){ return p.id===a.personaId; })) || {}).nome || "—"), detalhe:Number(v).toLocaleString("pt-BR", {style:"currency", currency:"BRL"})});
  if(ff.hist.length>2000) ff.hist.length = 2000;
  return {ff:ff, pixId:id, dividaId:divida ? divida.id : ""};
}
// Põe (ou tira, com key vazia) o comprovante de um Pix da Família: o mesmo que a ação pix_comp. Devolve {ff} ou {erro}.
function comprovanteNaFamilia(ff0, a){
  var ff = JSON.parse(JSON.stringify(ff0 || {})), x = (ff.pix || []).find(function(y){ return y.id===a.pixId; });
  if(!x) return {erro:"Pix não encontrado no Financeiro familiar."};
  if(a.key && !/^an_[a-z0-9]{6,40}$/.test(String(a.key))) return {erro:"Comprovante inválido."};
  if(a.key){ x.compKey = String(a.key); x.compNome = String(a.nome || "").slice(0, 120); x.compTipo = String(a.tipo || "").slice(0, 60); } else { delete x.compKey; delete x.compNome; delete x.compTipo; }
  return {ff:ff};
}

// LISTA DE CONTAS da janela Lançar pagamento (Marcus, 20/11/2026): só o NOME (sem a palavra "Conta"), na ordem que ele usa e sem as contas que ele mandou tirar da lista.
var OCULTAR_CONTA = [/^conta \+55$/i, /amanda bonus/i, /fhc tenda/i, /^pix rev/i, /julia marketing/i, /^conta breno$/i];   // Julia Marketing e Breno: acabaram as contas deles (20/11/2026)
var ORDEM_CONTA = [/marcus\s*[—-]\s*nubank/i, /higor/i, /g8 gang|68 gang/i, /rebel mode/i, /^conta greicy$/i];   // 1º Nubank Marcus, 2º Higor, 3º 68 Gang, 4º Rebel Mode, 5º Greicy
function rotuloConta(nome){
  var t = limpa(nome);
  if(/marcus\s*[—-]\s*nubank/i.test(t)) return "Nubank Marcus";
  if(/higor/i.test(t)) return "Higor";
  if(/g8 gang|68 gang/i.test(t)) return "68 Gang";
  return limpa(t.replace(/\bconta\b/ig, "").replace(/^\s*[—-]\s*/, "").replace(/\s+[—-]\s*$/, "")) || t;
}
function contasParaLista(contas){
  var posicao = function(c){ for(var i = 0; i<ORDEM_CONTA.length; i++) if(ORDEM_CONTA[i].test(c.nome || "")) return i; return 99; };
  return (contas || []).filter(function(c){ return c && c.nome && !OCULTAR_CONTA.some(function(re){ return re.test(limpa(c.nome)); }); })
    .map(function(c){ return {id:c.id, nome:rotuloConta(c.nome), personaId:c.personaId || "", banco:c.banco || "", _pos:posicao(c)}; })
    .sort(function(a, b){ return a._pos-b._pos || a.nome.localeCompare(b.nome, "pt-BR"); })
    .map(function(c){ return {id:c.id, nome:c.nome, personaId:c.personaId, banco:c.banco}; });
}

// Do destino escolhido no menu do Direcionar (cp.destinos[]) para onde o Pix vai: {destino:"empresa"|"socio", personaId, contaId, contaTxt, nome}.
// rotulo = rotuloDestino de lib/nome-conta.js (o mesmo texto do Direcionar). ff = módulo da Família (pode faltar).
var semAc2 = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
function resolverDestino(d, ff, rotulo){
  if(!d) return {erro:"Escolha a conta que recebeu na lista."};
  var nome = rotulo(d, ""), F = ff || {}, persona = d.personaId && (F.personas || []).some(function(p){ return p.id===d.personaId; }) ? d.personaId : "";
  if(d.tipo==="FAMILIA" && persona) return {destino:"socio", personaId:persona, contaId:"", contaTxt:"", nome:nome};
  if(d.tipo==="PRESTADOR"){
    var pf = d.prestFamId && (F.prest || []).find(function(p){ return p.id===d.prestFamId; });
    if(!pf){ var nn = semAc2(d.nome); pf = (F.prest || []).find(function(p){ return semAc2(p.nome)===nn; }); }   // Direcionar sem vínculo: procura o prestador da Família com o mesmo nome
    if(pf){
      var cs = (F.contasBanc || []).filter(function(c){ return c.prestadorId===pf.id && c.ativo!==false; });
      var cb = cs.find(function(c){ return persona && c.personaId===persona; }) || cs[0];
      if(cb && (persona || cb.personaId)) return {destino:"socio", personaId:persona || cb.personaId, contaId:cb.id, contaTxt:"", nome:nome};
    }
  }
  return {destino:"empresa", personaId:"", contaId:"", contaTxt:nome, nome:nome};
}

// Nome do destino na lista e na tabela (Marcus, 21/11/2026): prestador da EMPRESA = "Sorelly · Higor (Segurança)"; prestador da FAMÍLIA (ligado a um sócio no Direcionar) = "Marcus · Higor (Segurança)"; bolinha no lugar do traço.
// lib = {rotuloDestino, rotuloPrestadorFamilia, nomePropio} (lib/nome-conta.js). "todos" = cp.destinos. Prestador sem o serviço no nome ("Higor") pega o serviço do homônimo que tem ("Higor (segurança)").
var normNome = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); };
var maiusParen = function(n){ return String(n).replace(/\(([^)]*)\)/g, function(m, s){ return "("+s.charAt(0).toUpperCase()+s.slice(1)+")"; }); };
function nomeComServico(d, todos, nomePropio){
  var nome = maiusParen(nomePropio(d.nome));
  if(/\(/.test(nome)) return nome;
  var base = normNome(nome), irma = (todos || []).filter(function(x){ return x!==d && /\(/.test(x.nome || "") && normNome(String(x.nome).replace(/\s*\(.*\)\s*$/, ""))===base; })[0];
  return irma ? nome+" ("+/\(([^)]*)\)/.exec(irma.nome)[1].replace(/^./, function(c){ return c.toUpperCase(); })+")" : nome;
}
// tira do fim do nome o nome do sócio dono ("Greicy Marcus" → "Greicy")
var semDono = function(nome, socio){ var fim = " "+String(socio || "").toLowerCase(); return socio && String(nome).toLowerCase().slice(-fim.length)===fim && String(nome).length>fim.length ? String(nome).slice(0, String(nome).length-fim.length) : nome; };
// Nome CURTO para a lista do menu (o nome inteiro com o dono aparece no campo depois de escolher): prestador = nome com o serviço, sem o dono; sócio = "Conta pessoal"; os outros, o nome com bolinha no lugar do traço.
function nomeCurtoLeaf(d, todos, lib){
  if(d.tipo==="PRESTADOR"){ var n = nomeComServico(d, todos, lib.nomePropio), s = d.personaId ? (todos || []).filter(function(x){ return x.tipo==="FAMILIA" && x.personaId===d.personaId; })[0] : null; return s ? semDono(n, lib.nomePropio(s.nome)) : n; }
  if(d.tipo==="FAMILIA") return "Conta pessoal";
  return lib.nomePropio(d.nome).replace(/\s[-–—]\s/g, " · ");
}
function rotuloLeaf(d, todos, lib, contaNome){
  var r;
  if(d.tipo==="PRESTADOR"){
    var nome = nomeComServico(d, todos, lib.nomePropio);
    var socio = d.personaId ? (todos || []).filter(function(x){ return x.tipo==="FAMILIA" && x.personaId===d.personaId; })[0] : null;
    if(socio) nome = semDono(nome, lib.nomePropio(socio.nome));   // "Greicy Marcus" dentro do Marcus fica só "Greicy"
    r = d.personaId ? lib.rotuloPrestadorFamilia(socio ? socio.nome : d.personaId, nome, "") : "Sorelly · "+nome;
  } else r = lib.rotuloDestino(d, contaNome || "");
  return String(r).replace(/\s[-–—]\s/g, " · ");
}

export { nomeCurtoLeaf, rotuloLeaf, vazio, garantir, validarLancamento, resolverDestino, antecipadosDe, sincronizarUsoRcb, linhasAntecipados, espelharNaFamilia, comprovanteNaFamilia, rotuloConta, contasParaLista };

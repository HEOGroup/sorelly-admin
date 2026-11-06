// Sorelly Admin — domain/app-rep.js
// Ligação com o APP REAL da representante (05/11/2026; contrato em sorelly-app/docs/app-representante/CONTRATOS.md).
// O app grava pelo servidor (rotas /api/consignado/ingest/* e /api/listagens/app*) e a equipe grava pelo navegador. Os dois ficam nos módulos
// "por item" rpo (operação) e rpf (financeiro), uma linha por chave (src/server/estado-itens.js). Cada chave tem um DONO pelo prefixo:
//   app   (só o servidor grava): l_ listagem · k_ kit · ke_ eventos do app no kit · en_ entrega do kit novo · cb_ conferência · eb_ erro de bipagem
//                                pa_ pré-acerto por revendedora · a_ acerto/entrega/reposição · ar_ confirmações da representante · km_ km · gv_ gasolina vista
//   admin (o navegador grava): lx_ listagem · kx_ kit · ax_ acerto
// A tela junta: listagem = l_ + lx_ · kit = k_ + kx_ + ke_ (o que o app registrou vence) · acerto = a_ + ax_ (+ ar_ em recebimento.rep).
// Kit criado PELA EQUIPE numa listagem do app (ex.: kit novo da Michele) vai inteiro em kx_ com _full:true.
// Este arquivo é PURO (sem React, sem navegador): o servidor e o reducer usam as mesmas funções.

var ITENS_MODULOS = ["rpo", "rpf"];
var DONO = {l:"app", k:"app", ke:"app", en:"app", cb:"app", eb:"app", pa:"app", pr:"app", ks:"app", a:"app", ar:"app", km:"app", gv:"app",
  lx:"admin", kx:"admin", ax:"admin", cf:"admin"};
// pr_ (rpo): ficha da revendedora preenchida no app (2º telefone, endereços, profissão, referências), server/app-rep/perfil.js
// ks_ (rpo): estado da sincronização com o backend do app (kits novos enviados, cursor das respostas, avisos de kit pronto) — só o servidor grava
var MODULO_DO_PREFIXO = {l:"rpo", lx:"rpo", k:"rpo", kx:"rpo", ke:"rpo", en:"rpo", cb:"rpo", eb:"rpo", pa:"rpo", pr:"rpo", ks:"rpo",
  a:"rpf", ax:"rpf", ar:"rpf", km:"rpf", gv:"rpf", cf:"rpf"};
// cf_comis (rpf, dono admin): a configuração de comissões (s.comis, sem km) espelhada do navegador do financeiro, para o servidor calcular
// "só as minhas comissões" para o app (régua, % e grupo de cada representante, datas, gasolina, pagamentos lançados).
function prefixo(chave){ return String(chave||"").split("_")[0]; }
function donoDaChave(chave){ return DONO[prefixo(chave)] || null; }
function moduloDaChave(chave){ return MODULO_DO_PREFIXO[prefixo(chave)] || null; }
function idDaChave(chave){ var c = String(chave||""); var i = c.indexOf("_"); return i<0 ? "" : c.slice(i+1); }
function vivo(v){ return !!v && typeof v==="object" && !v._apagado; }
var LAPIDE = function(motivo){ return {_apagado:true, em:new Date().toISOString(), motivo:motivo||""}; };

// Regras da listagem (iguais ao protótipo: domain/regras.js MAX_LISTAGEM, kits-novos-rep.js prazo, encomendas.js repPorSemana)
var MAX_LISTAGEM = 15, REPOSICOES_SEMANA = 10, PRAZO_PEDIDO_HORAS = 48;
var SEM_KIT = {condicional:true, saiu:true};
var TIPOS_KIT_APP = ["acerto_kit", "acerto_kit_exp", "kit_novo", "kit_novo_exp", "reposicao", "condicional", "saiu"];
// status que ainda deixam tirar a revendedora da listagem (a montagem não começou)
var STATUS_TIRAR = {semvalor:true, pendente:true, condicional:true, precond:true};

function semAcento(t){ return String(t||"").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
function ehViagem(destino, viagem){ return viagem===true || (!!destino && semAcento(destino)!=="curitiba"); }
function capacidade(l){ return l && l.viagem ? Infinity : MAX_LISTAGEM; }
// segunda-feira da semana de uma data AAAA-MM-DD (semana de segunda a domingo, encomendas.js inicioSemana)
function inicioSemana(iso){ var d = new Date(String(iso).slice(0,10)+"T12:00:00Z"); var dw = d.getUTCDay(); d.setUTCDate(d.getUTCDate() - (dw===0 ? 6 : dw-1)); return d.toISOString().slice(0,10); }
// horas até a retirada (data + horário da listagem, horário de Brasília = UTC−3)
function horasAteRetirada(l, agoraMs){ var t = Date.parse(String(l.data).slice(0,10)+"T"+(l.horario||"10:00")+":00-03:00"); return (t - (agoraMs||Date.now()))/3600000; }
// Código de retirada: mesmo cálculo de domain/retornos.js (4 dígitos, muda a cada retirada e a cada dia)
function isoDiaSP(ms){ return new Date((ms||Date.now()) - 3*3600000).toISOString().slice(0,10); }
function codigoRetirada(l, agoraMs){
  if(!l) return "";
  var t = String(l.id)+"|"+(l.retiradas||[]).length+"|"+isoDiaSP(agoraMs), h = 7;
  for(var i=0;i<t.length;i++) h = (h*31 + t.charCodeAt(i)) % 1000003;
  return String(1000 + h % 9000);
}

// ── montar as listas das telas a partir das chaves ─────────────────────────────
function idsPorPrefixo(mod, prefixos){
  var ids = {}; Object.keys(mod||{}).forEach(function(c){ if(prefixos.indexOf(prefixo(c))>=0) ids[idDaChave(c)] = 1; }); return Object.keys(ids);
}
function semMeta(o){ var x = Object.assign({}, o); delete x._full; delete x._montNome; delete x._bipNome; return x; }

function montarListagens(rpo){
  rpo = rpo || {}; var out = [];
  idsPorPrefixo(rpo, ["l"]).forEach(function(id){
    var base = rpo["l_"+id]; if(!vivo(base)) return;
    var lx = rpo["lx_"+id];
    out.push(Object.assign({}, base, vivo(lx) ? lx : {}, {id:id, origem:"app"}));
  });
  return out;
}
function montarKits(rpo){
  rpo = rpo || {}; var out = [];
  idsPorPrefixo(rpo, ["k", "kx"]).forEach(function(id){
    var base = rpo["k_"+id], kx = rpo["kx_"+id], ke = rpo["ke_"+id];
    if(base && !vivo(base)) return;
    if(kx && kx._apagado) return;
    if(!base && !(kx && kx._full)) return;
    var item = Object.assign({}, base||{}, kx ? semMeta(kx) : {}, vivo(ke) ? ke : {}, {id:id});
    if(base) item.origem = "app";
    if(kx && kx._montNome) item._montNome = kx._montNome;
    if(kx && kx._bipNome) item._bipNome = kx._bipNome;
    out.push(item);
  });
  return out;
}
function montarAcertos(rpf){
  rpf = rpf || {}; var out = [];
  idsPorPrefixo(rpf, ["a"]).forEach(function(id){
    var base = rpf["a_"+id]; if(!vivo(base) || base.cancelado) return;
    var ax = rpf["ax_"+id], ar = rpf["ar_"+id];
    var item = Object.assign({}, base, vivo(ax) ? ax : {}, {id:id, origem:"app"});
    var rec = vivo(ax) && ax.recebimento!==undefined ? ax.recebimento : (base.recebimento || null);
    if(vivo(ar)) rec = Object.assign({}, rec || {}, {rep:{din:ar.din||null, cond:ar.cond||null}});
    item.recebimento = rec || null;
    out.push(item);
  });
  out.sort(function(a, b){ return String((b.data||"")+(b.hora||"")).localeCompare(String((a.data||"")+(a.hora||""))); });
  return out;
}
// entregas do kit novo (s.entregasKN[kitId]) vindas do app
function montarEntregas(rpo){
  var o = {}; Object.keys(rpo||{}).forEach(function(c){ if(prefixo(c)!=="en") return; var v = rpo[c]; if(vivo(v)) o[idDaChave(c)] = v; }); return o;
}
function montarErrosBipagem(rpo){
  var out = []; Object.keys(rpo||{}).forEach(function(c){ if(prefixo(c)!=="eb") return; var v = rpo[c]; if(vivo(v)) out.push(v); }); return out;
}

// Junta o que veio do servidor com o que é só deste navegador. Itens do app (origem "app") e itens espelhados (mesmo id) vêm do servidor.
function porId(lista){ var o = {}; (lista||[]).forEach(function(x){ o[x.id] = 1; }); return o; }
function juntar(locais, doServidor, origemApp){
  var ids = porId(doServidor);
  return doServidor.concat((locais||[]).filter(function(x){ return x && !ids[x.id] && x.origem!==origemApp; }));
}
// devolve o patch do estado montado a partir de s.rpo e s.rpf (chamado no SYNC_MODULO)
function aplicarAppNoEstado(s){
  var p = {};
  if(s.rpo){
    p.listagens = juntar(s.listagens, montarListagens(s.rpo), "app");
    p.kits = juntar(s.kits, montarKits(s.rpo), "app");
    var en = montarEntregas(s.rpo); if(Object.keys(en).length) p.entregasKN = Object.assign({}, s.entregasKN, en);
    var eb = montarErrosBipagem(s.rpo); if(eb.length) p.errosBipagem = juntar(s.errosBipagem, eb, "app");
  }
  if(s.rpf){
    p.acertosConsignado = juntar(s.acertosConsignado, montarAcertos(s.rpf), "app");
    // km enviado pela representante entra em comis.fech[data|rep].km (os pagamentos continuam do financeiro)
    var kms = Object.keys(s.rpf).filter(function(c){ return prefixo(c)==="km" && vivo(s.rpf[c]); });
    var gvs = Object.keys(s.rpf).filter(function(c){ return prefixo(c)==="gv" && vivo(s.rpf[c]); });
    if((kms.length || gvs.length) && s.comis){
      var fech = Object.assign({}, s.comis.fech), visto = Object.assign({}, s.comis.gasolinaVisto);
      kms.forEach(function(c){ var v = s.rpf[c]; var ch = v.data+"|"+v.rep; fech[ch] = Object.assign({}, fech[ch], {km:v.km, kmPor:"rep", kmTs:v.kmTs, kmModo:"total"}); });
      gvs.forEach(function(c){ var v = s.rpf[c]; if(v.rep) visto[v.rep] = v.em; });   // aviso "Combustível atualizado" visto no app
      p.comis = Object.assign({}, s.comis, {fech:fech, gasolinaVisto:visto});
    }
  }
  return p;
}

// ── o que a EQUIPE mudou em itens do app vira chave do admin (kx_, lx_, ax_) ────
function j(v){ try { return JSON.stringify(v===undefined ? null : v); } catch(x){ return ""; } }
function diferenca(atual, base, ignorar){
  var o = {}, n = 0;
  Object.keys(atual||{}).forEach(function(k){ if(k==="id" || k==="origem" || (ignorar && ignorar[k])) return; if(j(atual[k])!==j((base||{})[k])){ o[k] = atual[k]; n++; } });
  return n ? o : null;
}
// s = estado depois da ação; nomes = function(pessoaId) → nome (para mandar "montado por / bipado por" ao app)
function espelharAdmin(s, nomes){
  var rpo = s.rpo, rpf = s.rpf, novasRpo = null, novasRpf = null;
  var pRpo = function(k, v){ if(j((rpo||{})[k])===j(v)) return; novasRpo = novasRpo || {}; novasRpo[k] = v; };
  var pRpf = function(k, v){ if(j((rpf||{})[k])===j(v)) return; novasRpf = novasRpf || {}; novasRpf[k] = v; };
  if(rpo && s._rpoPronto){
    var lApp = {}; Object.keys(rpo).forEach(function(c){ if(prefixo(c)==="l" && vivo(rpo[c])) lApp[idDaChave(c)] = 1; });
    (s.listagens||[]).forEach(function(l){
      if(l.origem!=="app" || !rpo["l_"+l.id]) return;
      var d = diferenca(l, rpo["l_"+l.id]); if(d || rpo["lx_"+l.id]) pRpo("lx_"+l.id, d || {});
    });
    var vistos = {};
    (s.kits||[]).forEach(function(k){
      vistos[k.id] = 1;
      var ex = {}; if(nomes){ var mn = k.montId!=null ? nomes(k.montId) : null, bn = k.bipId!=null ? nomes(k.bipId) : null; if(mn) ex._montNome = mn; if(bn) ex._bipNome = bn; }
      if(k.origem==="app" && rpo["k_"+k.id]){
        var ke = vivo(rpo["ke_"+k.id]) ? rpo["ke_"+k.id] : {}, ign = Object.assign({_montNome:1, _bipNome:1}, ke);
        var dk = diferenca(k, Object.assign({}, rpo["k_"+k.id], ke), ign);
        if(dk || rpo["kx_"+k.id]) pRpo("kx_"+k.id, Object.assign(dk || {}, ex));
      } else if(lApp[k.lid]){
        var inteiro = Object.assign({}, k, ex, {_full:true}); delete inteiro.origem; pRpo("kx_"+k.id, inteiro);
      }
    });
    // kit da equipe que estava numa listagem do app e foi apagado: lápide
    Object.keys(rpo).forEach(function(c){ if(prefixo(c)!=="kx") return; var v = rpo[c]; if(v && v._full && !v._apagado && !vistos[idDaChave(c)]) pRpo(c, {_full:true, _apagado:true}); });
  }
  if(rpf && s._rpfPronto){
    (s.acertosConsignado||[]).forEach(function(r){
      if(r.origem!=="app" || !rpf["a_"+r.id]) return;
      var base = rpf["a_"+r.id], rec = r.recebimento ? Object.assign({}, r.recebimento) : r.recebimento;
      if(rec) delete rec.rep;   // a parte da representante é dela (ar_)
      var semRec = Object.assign({}, r); delete semRec.recebimento;
      var d = diferenca(semRec, base, {recebimento:1}) || {};
      if(j(rec || null)!==j(base.recebimento || null)) d.recebimento = rec || null;
      if(Object.keys(d).length || rpf["ax_"+r.id]) pRpf("ax_"+r.id, d);
    });
  }
  return novasRpo || novasRpf ? {rpo:novasRpo, rpf:novasRpf} : null;
}

// ── formato que o app recebe (contrato 1.5) ─────────────────────────────────────
function kitParaApp(k){
  var st = k.status==="precond" ? "pendente" : k.status==="acertado" ? "retirado" : k.status;
  return {id:k.id, revendedoraId:k.revendedoraId!=null ? Number(k.revendedoraId) : null, nome:k.rev||"", bairro:k.bairro && k.bairro!=="—" ? k.bairro : null,
    tipoKit:k.tipoKit||"acerto_kit", status:st||"semvalor", valor:k.valor!=null ? Number(k.valor) : null, horaAtendimento:k.horaAtend||null, atrasado:!!k.atrasado,
    montadora:k._montNome||null, bipadora:k._bipNome||null, acertado:k.status==="acertado" || !!k.acertoId, acertoId:k.acertoId||null,
    kitNovoEntregue:!!k.kitNovoEntregue, reposicaoEntregue:!!k.reposicaoEntregue, modalidade:k.modalidade==="prata" ? "prata" : "padrao"};
}
function listagemParaApp(l, kits, agoraMs){
  var ks = (kits||[]).filter(function(k){ return k.lid===l.id; }).sort(function(a, b){ return (a.ordem||0)-(b.ordem||0); });
  var pronto = ks.some(function(k){ return k.status==="bipado"; });
  return {id:l.id, data:l.data, horario:l.horario, destino:l.destino||"Curitiba", viagem:!!l.viagem, fechada:!!l.fechada,
    concluidaEm:l.concluidaEm ? new Date(l.concluidaEm).toISOString() : null, codigoRetirada:pronto ? codigoRetirada(l, agoraMs) : null,
    kits:ks.map(kitParaApp)};
}

export { ITENS_MODULOS, LAPIDE, MAX_LISTAGEM, REPOSICOES_SEMANA, PRAZO_PEDIDO_HORAS, SEM_KIT, TIPOS_KIT_APP, STATUS_TIRAR,
  prefixo, donoDaChave, moduloDaChave, idDaChave, vivo, ehViagem, capacidade, inicioSemana, horasAteRetirada, codigoRetirada, semAcento,
  montarListagens, montarKits, montarAcertos, aplicarAppNoEstado, espelharAdmin, kitParaApp, listagemParaApp };

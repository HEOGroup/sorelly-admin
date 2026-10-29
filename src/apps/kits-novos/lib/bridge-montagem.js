// Sorelly Admin · kits novos Curitiba — lib/bridge-montagem.js
//
// Ponte de protótipo entre os dois apps: ainda não existe backend, cada um
// guarda seu próprio estado no localStorage do navegador. Direcionar um kit
// novo pra representante aqui escreve direto na lista `novas` que o admin de
// montagem (Kits → Kits novos, e o app da representante) já lê e sabe tratar
// (aceitar, recusar, colocar na listagem). Quando existir uma API de verdade
// ligando cadastro e montagem, isso vira uma chamada normal em vez de mexer
// no localStorage do outro app.
//
// Precisa bater com a chave e o formato de `novas` em
// @/apps/montagem/state/store.js (CHAVE) e domain/representantes.js (NOVAS0).
import { MESES } from "@/apps/kits-novos/lib/datas";
import { apiAtiva, chamar, token } from "@/apps/montagem/lib/api";
const CHAVE_MONTAGEM = "sorelly_montagem_v9";

/** Com servidor ligado, o kit vai para o módulo "kn" (uma chave por kit): assim chega no app da representante em qualquer aparelho, não só neste navegador. */
function enviarKitAoServidor(item) {
  try {
    if (!apiAtiva() || !token()) return;
    var chaves = {}; chaves["k_" + item.id] = item;
    chamar("PUT", "/estado/kn", { chaves: chaves }).catch(function () { /* sem rede: o kit continua salvo neste navegador */ });
  } catch (x) { /* sem servidor */ }
}

function hojeCurto() {
  var d = new Date();
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

/** Direciona um kit novo (já liberado) pra uma representante no app de montagem. */
export function direcionarParaRepresentante(c, rep) {
  var id = "KN" + c.id;
  var item = { id: id, nome: c.nome, cidade: c.cid || "", bairro: c.bai || "", valor: c.val || 0, expositor: false, rep: rep, status: "direcionada", cadastro: hojeCurto() };
  enviarKitAoServidor(item);
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM);
    if (!raw) return apiAtiva();
    var s = JSON.parse(raw);
    if (!s || s.v !== 4) return apiAtiva();
    var novas = (s.novas || []).filter(function (n) { return n.id !== id; });
    novas.unshift(item);
    s.novas = novas;
    var kn = Object.assign({}, s.kn); kn["k_" + id] = item; s.kn = kn;
    localStorage.setItem(CHAVE_MONTAGEM, JSON.stringify(s));
    return true;
  } catch (x) {
    return apiAtiva();
  }
}

/** Nome da opção "Sorelly" na lista de representantes: o kit vai para a lista da Tamara (Atendimento interno › Revendedoras). */
export const REP_SORELLY = "Sorelly (atendimento interno)";

/** Kit novo direcionado para a Sorelly: entra na lista de Revendedoras internas como "A contatar", com a marca Kit novo. */
export function direcionarParaSorelly(c) {
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM);
    if (!raw) return false;
    var s = JSON.parse(raw);
    if (!s || s.v !== 4) return false;
    var chave = function (t) { return String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
    var marca = { id: "KN" + c.id, valor: c.val || 0, desde: new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }) };
    var lista = s.revInternas || [], ja = lista.find(function (r) { return chave(r.nome) === chave(c.nome); });
    if (ja) { ja.kitNovo = marca; }
    else {
      var h = { data: null, venda: null, acerto: null };
      lista.unshift({ id: "KN" + c.id, nome: c.nome, ciclo: 30, proximoManual: null, proximoDm: null, situacao: "contatar", agend: null, internoId: null, hist: [h, h, h],
        contatos: c.tel ? [{ nome: "WhatsApp da revendedora", fone: c.tel }] : [], prata: false, devmaster: "", cidade: c.cid || "", obs: "", registro: [], conds: [], kitNovo: marca });
    }
    s.revInternas = lista;
    localStorage.setItem(CHAVE_MONTAGEM, JSON.stringify(s));
    return true;
  } catch (x) { return false; }
}

/** true se o app de montagem já tem estado salvo neste navegador (pra avisar quando a ponte não vai funcionar). */
export function montagemDisponivel() {
  try { return !!localStorage.getItem(CHAVE_MONTAGEM); } catch (x) { return false; }
}

export { CHAVE_MONTAGEM };

/** Revendedoras de cada representante, lidas do AGENDAMENTO do app de montagem (a cota do mês atual; sem ela, a do último mês que tiver). {nomeCompleto: quantidade}; vazio se não der para ler. */
export function revendedorasPorRep() {
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM); if (!raw) return {};
    var s = JSON.parse(raw), ag = s && s.agend; if (!ag || !ag.config) return {};
    var h = new Date(), ym = h.getFullYear() + "-" + String(h.getMonth() + 1).padStart(2, "0"), meses = Object.keys(ag.cotas || {}).sort();
    var cotas = (ag.cotas || {})[ym] || (ag.cotas || {})[meses[meses.length - 1]] || {}, out = {};
    (ag.config.representantes || []).forEach(function (r) { if (cotas[r.id] > 0) out[r.nome] = cotas[r.id]; });
    return out;
  } catch (x) { return {}; }
}

/** Hoje no fuso de São Paulo, "YYYY-MM-DD". */
function hojeIsoSP() { return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" }); }

/** Recusas lidas do app de montagem (lista crua, mais nova primeiro); vazio se não houver. */
export function listaRecusas() {
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM); if (!raw) return [];
    var s = JSON.parse(raw);
    return ((s && s.recusas) || []).filter(function (r) { return r && r.rep; });
  } catch (x) { return []; }
}

/** Recusa por WhatsApp: mesmos efeitos do reducer do montagem (RECUSAR_NOVA). Devolve {bloqueou, total, limite} ou null se a ponte não funcionar. */
export function registrarRecusa(o) {
  try {
    var raw = localStorage.getItem(CHAVE_MONTAGEM);
    if (!raw) return null;
    var s = JSON.parse(raw);
    if (!s || s.v !== 4) return null;
    var id = o.id ? "KN" + o.id : null;
    var d = new Date();
    var rec = [{ rep: o.rep, rev: o.rev, data: String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0"), iso: hojeIsoSP(), motivo: o.motivo || "Recusou" }].concat(s.recusas || []);
    var total = rec.filter(function (x) { return x.rep === o.rep; }).length;
    var limite = (s.cfg && s.cfg.recusasBloqueio) || 2;
    var bl = Object.assign({}, s.bloqueioNovas);
    var bloqueou = total >= limite && !bl[o.rep];
    if (bloqueou) bl[o.rep] = true;
    s.recusas = rec;
    s.bloqueioNovas = bl;
    s.novas = (s.novas || []).map(function (n) {
      if (!((id && n.id === id) || (!id && n.nome === o.rev))) return n;
      return Object.assign({}, n, { status: "aguardando", rep: null, recusadaPor: (n.recusadaPor || []).concat([o.rep]) });
    });
    if (id) { var kr = s.novas.find(function (n) { return n.id === id; }); if (kr) { enviarKitAoServidor(kr); var kn2 = Object.assign({}, s.kn); kn2["k_" + id] = kr; s.kn = kn2; } }
    localStorage.setItem(CHAVE_MONTAGEM, JSON.stringify(s));
    return { bloqueou: bloqueou, total: total, limite: limite };
  } catch (x) {
    return null;
  }
}

/** Mês (nome, como no filtro) de uma recusa; "" se for antiga, sem `iso`. */
function mesDaRecusa(r) { return r.iso ? MESES[+r.iso.split("-")[1] - 1] : ""; }

/** Recusas por representante ({nome: quantidade}). Com `mes`, só conta as que têm `iso` daquele mês; sem `mes` conta todas. */
export function recusasPorRep(mes) {
  var o = {};
  listaRecusas().forEach(function (r) {
    if (mes && mesDaRecusa(r) !== mes) return;
    o[r.rep] = (o[r.rep] || 0) + 1;
  });
  return o;
}

/** Lista das recusas de uma representante, respeitando o mês (mesma regra de recusasPorRep). */
export function recusasDaRep(rep, mes) {
  return listaRecusas().filter(function (r) { return r.rep === rep && (!mes || mesDaRecusa(r) === mes); });
}

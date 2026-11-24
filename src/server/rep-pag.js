// PEDIDO DE CONTA DA REPRESENTANTE (23/11/2026, Marcus: "peça pix para o Direcionar"): no acerto ela informa forma e valor e pede a conta;
// o pedido entra na fila do Direcionar Pix (Financeiro) e a resposta volta para o app dela. O pedido mora no módulo "pag", uma chave por pedido:
//   lf_LFR_P<kitId> = lançamento do Controle de pagamentos (s.lancFin, origem "rep")      dp_<id> = item da fila do Direcionar (s.dp.pix, origem "rep")
// A conta de representante LÊ só os pedidos dos kits dela e GRAVA só neles. O que o Financeiro já definiu (conta, OK, divisão) nunca é trocado pela tela dela.
import { consulta } from "./db.js";
import { lerPrefixos } from "./estado-itens.js";
import { gravarModulo } from "./estado-modulo.js";
import { nomeDaRep } from "./rep-filtro.js";
import { vivo } from "../apps/montagem/domain/app-rep.js";

const obj = (v) => v && typeof v === "object" && !Array.isArray(v);
const KIT = /^[A-Za-z0-9_-]{1,64}$/;

// ids dos kits dela (kit do app com o código dela, ou kit da equipe numa listagem dela)
async function kitsDaRep(codigos) {
  const cods = [].concat(codigos).map(String);   // conta com mais de um cadastro: kit de qualquer um deles
  const rpo = await lerPrefixos("rpo", ["l_", "k_", "kx_"]);
  const minhas = {}; Object.keys(rpo).forEach((c) => { if (c.startsWith("l_") && vivo(rpo[c]) && cods.includes(String(rpo[c].repCod || ""))) minhas[c.slice(2)] = 1; });
  const ids = {};
  Object.keys(rpo).forEach((c) => {
    const v = rpo[c]; if (!vivo(v)) return;
    if (c.startsWith("k_") && (cods.includes(String(v.repCod || "")) || minhas[v.lid])) ids[c.slice(2)] = 1;
    if (c.startsWith("kx_") && v._full && minhas[v.lid]) ids[c.slice(3)] = 1;
  });
  return ids;
}
const kitDaChave = (k, v) => (k.startsWith("lf_LFR_P") ? k.slice(8) : k.startsWith("dp_") && obj(v) ? String(v.kitId || "") : "");
const ehDela = (k, v, kits) => obj(v) && v.origem === "rep" && !!kits[kitDaChave(k, v)];

// leitura: só os pedidos dos kits dela
export async function respostaPagRep(desde, repCod) {
  const cod = [].concat(repCod).map(String);
  const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'pag'");
  const l = r.rows[0], versao = l ? Number(l.versao) : 0;
  if (desde !== undefined && versao > 0 && versao === desde) return { modulo: "pag", versao, igual: true };
  const kits = await kitsDaRep(cod), conteudo = {};
  Object.entries((l && l.conteudo) || {}).forEach(([k, v]) => { if (ehDela(k, v, kits)) conteudo[k] = v; });
  return { modulo: "pag", versao, conteudo };
}

const definida = (linha) => (linha.partes || []).some((q) => q && (q.descricao || q.ok));   // o Financeiro já mexeu nesta linha
// gravação: {versao, aceitas, devolver, avisos}
export async function gravarPagRep(chaves, eu) {
  const cod = String(eu.repCod || "").trim();   // principal (carimbo e nome)
  const nome = (await nomeDaRep(cod)) || String(eu.nome || "").trim().split(/ +/)[0] || cod;
  const kits = await kitsDaRep(eu.repCods && eu.repCods.length ? eu.repCods : cod);
  const r = await consulta("select conteudo, versao from sorelly.estado_modulo where modulo = 'pag'");
  const at = (r.rows[0] && r.rows[0].conteudo) || {};
  const gravar = {}, devolver = {}, avisos = [];
  const nega = (k) => { devolver[k] = at[k] !== undefined && ehDela(k, at[k], kits) ? at[k] : null; };
  for (const [k, v] of Object.entries(chaves)) {
    const existe = at[k];
    if (!k.startsWith("lf_LFR_P") && !k.startsWith("dp_")) { nega(k); continue; }
    if (v === null) {   // apagar: só pedido dela que o Financeiro ainda não resolveu
      if (existe === undefined || existe === null) continue;
      if (!ehDela(k, existe, kits)) { nega(k); continue; }
      const mexido = k.startsWith("dp_") ? existe.status !== "fila" : (existe.linhas || []).some(definida);
      if (mexido) { nega(k); avisos.push("O Financeiro já respondeu esse pedido de conta. Ele não pode mais ser apagado."); continue; }
      gravar[k] = null; continue;
    }
    if (!obj(v) || JSON.stringify(v).length > 6 * 1024 * 1024) { nega(k); continue; }
    const kitId = kitDaChave(k, v);
    if (!KIT.test(kitId) || !kits[kitId] || v.origem !== "rep") { nega(k); continue; }
    if (existe !== undefined && existe !== null && !ehDela(k, existe, kits)) { nega(k); continue; }
    if (k.startsWith("dp_")) {
      if (existe && existe.status !== "fila") {   // o Financeiro já direcionou: vale o dele; da tela dela só entra o comprovante
        const novo = existe.comprovante || !v.comprovante ? existe : Object.assign({}, existe, { comprovante: v.comprovante });
        if (novo !== existe) gravar[k] = novo; else devolver[k] = existe; continue;
      }
      if (!(Number(v.valor) > 0) || !v.pid) { nega(k); continue; }
      gravar[k] = Object.assign({}, v, { origem: "rep", repOrigem: nome, quem: "Representante " + nome, status: "fila", divisoes: [], kitId });
    } else {
      const antigas = (existe && existe.linhas) || [], porPid = {}; antigas.forEach((l) => { if (l && l.pid) porPid[l.pid] = l; });
      const linhas = (Array.isArray(v.linhas) ? v.linhas : []).filter((l) => obj(l) && l.pid && Number(l.valor) > 0).map((l) => {
        const a = porPid[l.pid];
        if (a && definida(a)) {   // conta já definida pelo Financeiro: vale a do servidor; da tela dela só entra o comprovante que faltava
          const c = ((l.partes || [])[0] || {}).comprovante;
          return c && a.partes && a.partes[0] && !a.partes[0].comprovante ? Object.assign({}, a, { partes: a.partes.map((q, i) => (i ? q : Object.assign({}, q, { comprovante: c }))) }) : a;
        }
        const c0 = ((l.partes || [])[0] || {}).comprovante || null;
        return { tipo: "pagamento", forma: String(l.forma || "pix"), valor: Number(l.valor), isento: false, pid: String(l.pid), parcelas: Math.max(1, Math.floor(Number(l.parcelas) || 1)), data: String(l.data || ""), pedidoTs: l.pedidoTs || Date.now(), enviada: false,
          partes: [{ descricao: "", valor: Number(l.valor), comprovante: c0, ok: false }] };
      });
      antigas.forEach((a) => { if (a && a.pid && definida(a) && (a.partes || []).some((q) => q && q.ok) && !linhas.some((l) => l.pid === a.pid)) linhas.push(a); });   // pagamento que o Financeiro já confirmou não some
      if (!linhas.length) { if (existe) gravar[k] = null; else devolver[k] = null; continue; }
      gravar[k] = { id: "LFR_P" + kitId, origem: "rep", pedidoRep: kitId, repAcertoId: (existe && existe.repAcertoId) || v.repAcertoId || null, nome: String(v.nome || (existe && existe.nome) || "").slice(0, 200), por: nome,
        enviadoTs: (existe && existe.enviadoTs) || v.enviadoTs || Date.now(), etapaComprovantes: true, finalizado: true, conferido: !!(existe && existe.conferido) && linhas.every((l) => (l.partes || []).every((q) => q.ok)), linhas };
    }
  }
  let versao = r.rows[0] ? Number(r.rows[0].versao) : 0;
  if (Object.keys(gravar).length) versao = await gravarModulo("pag", gravar, "chaves", "rep:" + cod);
  Object.keys(gravar).forEach((k) => { if (JSON.stringify(gravar[k]) !== JSON.stringify(chaves[k])) devolver[k] = gravar[k]; });
  return { versao, aceitas: Object.keys(gravar), devolver, avisos };
}

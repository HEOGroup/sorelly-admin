// GRAVAÇÃO DA CONTA DE REPRESENTANTE (23/11/2026, Marcus: a representante usa o app DENTRO do Admin, no celular, e tudo fica ligado à Montagem e ao Consolidado).
// O navegador dela manda as mesmas chaves que o app da loja grava (dono "app"): l_ listagem, k_ kit, ke_ eventos do kit, en_ entrega do kit novo (rpo);
// a_ acerto / kit novo entregue / reposição, ar_ "entreguei na empresa", km_ km do período, gv_ aviso de gasolina visto (rpf).
// Aqui o servidor confere, uma a uma, se a chave é DELA (código do vendedor da conta) e carimba o dono. O que não passa é devolvido para a tela desfazer.
// Nunca aceita chave da equipe (lx_, kx_, ax_, cf_) nem mexe em item de outra representante.
import { emTransacao, gravarItens, lerPrefixosCli, versaoItens } from "./estado-itens.js";
import { nomeDaRep } from "./rep-filtro.js";
import { gravarModulo, lerModulo } from "./app-rep/base.js";
import { LAPIDE, STATUS_TIRAR, idDaChave, prefixo, vivo } from "../apps/montagem/domain/app-rep.js";

const PREFIXOS = { rpo: ["l", "k", "ke", "en"], rpf: ["a", "ar", "km", "gv"] };
const LER = { rpo: ["l_", "lx_", "k_", "kx_", "ke_", "en_"], rpf: ["a_", "ax_", "ar_", "km_", "gv_"] };
const ORDEM = ["l", "k", "ke", "en", "a", "ar", "km", "gv"];
const ID = /^[A-Za-z0-9_-]{1,64}$/;
// campos do kit que são da EQUIPE (montagem, bipagem, valor): a representante nunca muda pelo ke_
const CAMPOS_EQUIPE = ["id", "lid", "rev", "rep", "repCod", "origem", "valor", "valorReal", "manual", "defPor", "defEm", "prio", "designada", "montId", "iniM", "fimM", "pausaMs", "pausadoEm", "tempoM",
  "supId", "supEm", "bipId", "iniB", "fimB", "divReg", "corrigido", "retEm", "retPor", "ordem", "atrasado", "ultimaHora", "_full", "_apagado", "_montNome", "_bipNome"];
const obj = (v) => v && typeof v === "object" && !Array.isArray(v);

// créditos da Garantia usados no acerto: marca "Usado no acerto" (mesma regra do app da loja, app-rep/consignado.js)
async function usarCreditos(ids, acertoId, kitId) {
  if (!ids.length) return;
  const gr = await lerModulo("gr"), creditos = Array.isArray(gr.creditos) ? gr.creditos : [];
  let mudou = false;
  const novos = creditos.map((c) => { if (!ids.includes(String(c.id)) || c.usado) return c; mudou = true; return Object.assign({}, c, { usado: { em: Date.now(), kitId: kitId || null, acertoId, por: "Acerto (representante)" } }); });
  if (mudou) await gravarModulo("gr", { creditos: novos });
}

// {versao, aceitas:[chaves], devolver:{chave: valor que vale no servidor}, avisos:[frases]}
export async function gravarItensRep(modulo, chaves, eu) {
  const cod = String(eu.repCod || "").trim();
  if (!cod || !PREFIXOS[modulo]) return { versao: await versaoItens(modulo), aceitas: [], devolver: {}, avisos: [] };
  const nome = (await nomeDaRep(cod)) || String(eu.nome || "").trim().split(/ +/)[0] || cod;
  const pedidas = Object.keys(chaves).filter((k) => PREFIXOS[modulo].includes(prefixo(k)) && ID.test(idDaChave(k)))
    .sort((a, b) => ORDEM.indexOf(prefixo(a)) - ORDEM.indexOf(prefixo(b)));
  const fora = Object.keys(chaves).filter((k) => !pedidas.includes(k));   // chave da equipe ou desconhecida: ignora em silêncio (cópia local da tela)
  const creditos = [];
  const r = await emTransacao(modulo, async (cli) => {
    const at = await lerPrefixosCli(cli, modulo, LER[modulo]);
    const gravar = {}, devolver = {}, avisos = [];
    const vale = (k) => (k in gravar ? gravar[k] : at[k]);
    const minha = (v) => vivo(v) && String(v.repCod || "") === cod;
    const listagemMinha = (lid) => minha(vale("l_" + lid));
    const kitMeu = (id) => { const k = vale("k_" + id); if (k) return minha(k); const kx = at["kx_" + id]; return !!(kx && kx._full && !kx._apagado && listagemMinha(kx.lid)); };
    const nega = (k, frase) => { devolver[k] = at[k] === undefined ? LAPIDE("recusado") : at[k]; if (frase && !avisos.includes(frase)) avisos.push(frase); };
    for (const k of pedidas) {
      const p = prefixo(k), id = idDaChave(k), v = chaves[k], existe = at[k];
      if (!obj(v)) { nega(k); continue; }
      if (JSON.stringify(v).length > 3 * 1024 * 1024) { nega(k, "Registro grande demais para gravar. Diminua a foto."); continue; }
      if (p === "l") {
        if (existe !== undefined && !minha(existe)) { nega(k); continue; }
        if (v._apagado) { if (!existe) { nega(k); continue; } gravar[k] = LAPIDE("apagada pela representante"); continue; }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v.data || "")) || !/^\d{2}:\d{2}$/.test(String(v.horario || ""))) { nega(k, "Listagem sem data ou horário válido."); continue; }
        gravar[k] = Object.assign({}, v, { repCod: cod, rep: nome, origem: "app", fechada: existe ? !!existe.fechada : false, retiradas: existe ? existe.retiradas || [] : [], criadoEm: (existe && existe.criadoEm) || v.criadoEm || new Date().toISOString() });
      } else if (p === "k") {
        if (existe !== undefined && !minha(existe)) { nega(k); continue; }
        if (v._apagado) {
          if (!existe) { nega(k); continue; }
          const kx = vivo(at["kx_" + id]) ? at["kx_" + id] : {}, st = kx.status || existe.status;
          if (!STATUS_TIRAR[st]) { nega(k, "A montagem desse kit já começou. Fale com a montagem para tirar da listagem."); continue; }
          gravar[k] = LAPIDE("tirado pela representante"); continue;
        }
        if (existe) { nega(k); continue; }   // kit que já existe muda só por ke_ (eventos); o corpo do kit não é regravado
        if (!listagemMinha(v.lid)) { nega(k, "Essa listagem não é sua ou já não existe."); continue; }
        const l = vale("l_" + v.lid), lx = vivo(at["lx_" + v.lid]) ? at["lx_" + v.lid] : {};
        if (l.fechada || lx.fechada) { nega(k, "Essa listagem já foi concluída."); continue; }
        if (!String(v.rev || "").trim()) { nega(k); continue; }
        gravar[k] = Object.assign({}, v, { repCod: cod, rep: nome, origem: "app", porApp: true, criadoEm: v.criadoEm || new Date().toISOString(),
          // o que é da equipe nasce zerado, venha o que vier da tela
          valor: null, valorReal: null, manual: false, defPor: null, defEm: null, montId: null, iniM: null, fimM: null, tempoM: null, bipId: null, iniB: null, fimB: null, retEm: null, retPor: null, divReg: false, corrigido: false,
          status: v.status === "condicional" ? "condicional" : "semvalor" });
      } else if (p === "ke" || p === "en") {
        if (!kitMeu(id)) { nega(k); continue; }
        if (p === "en") { gravar[k] = v; continue; }
        const limpo = Object.assign({}, v); CAMPOS_EQUIPE.forEach((c) => { delete limpo[c]; });
        if ("status" in limpo && limpo.status !== "acertado") delete limpo.status;
        gravar[k] = Object.assign({}, vivo(existe) ? existe : {}, limpo);
      } else if (p === "a") {
        if (existe !== undefined && !minha(existe)) { nega(k); continue; }
        const ax = at["ax_" + id];
        if (existe && ax && ax.recebimento && ax.recebimento.ok) { nega(k, "Esse atendimento já foi conferido pelo agendamento e não muda mais."); continue; }
        if (v._apagado) { nega(k); continue; }
        if (!String(v.rev || "").trim() || !/^\d{4}-\d{2}-\d{2}$/.test(String(v.data || ""))) { nega(k); continue; }
        gravar[k] = Object.assign({}, v, { repCod: cod, rep: nome, origem: "app", recebimento: existe ? existe.recebimento || null : null, fin: existe ? existe.fin : undefined, recebidoEm: (existe && existe.recebidoEm) || new Date().toISOString() });
        if (!existe && Array.isArray(v.creditosGarantiaUsados) && v.creditosGarantiaUsados.length) creditos.push({ ids: v.creditosGarantiaUsados.map(String), acertoId: id, kitId: v.kitId || null });
      } else if (p === "ar") {
        if (!minha(vale("a_" + id))) { nega(k); continue; }
        const ax = at["ax_" + id];
        if (ax && ax.recebimento && ax.recebimento.ok) { nega(k, "O agendamento já conferiu esse atendimento."); continue; }
        gravar[k] = { din: v.din || null, cond: v.cond || null };
      } else if (p === "km") {
        const m = /^(\d{4}-\d{2}-\d{2})_(.+)$/.exec(id), km = Number(v.km);
        if (!m || m[2] !== cod || !(km >= 0 && km <= 20000)) { nega(k, "Km inválido."); continue; }
        gravar[k] = { data: m[1], rep: nome, repCod: cod, km: Math.round(km * 100) / 100, kmPor: "rep", kmTs: new Date().toISOString(), kmModo: "total" };   // a hora que vale é a do servidor
      } else if (p === "gv") {
        if (id !== cod) { nega(k); continue; }
        gravar[k] = { em: v.em || null, rep: nome, ts: Date.now() };
      }
    }
    const versao = Object.keys(gravar).length ? await gravarItens(modulo, gravar, "app", "rep:" + cod, cli) : null;
    // devolve também o que foi gravado com o carimbo do servidor (dono, nome, hora): a tela fica igual ao que vale
    Object.keys(gravar).forEach((k) => { if (JSON.stringify(gravar[k]) !== JSON.stringify(chaves[k])) devolver[k] = gravar[k]; });
    return { versao, aceitas: Object.keys(gravar), devolver, avisos };
  });
  for (const c of creditos) await usarCreditos(c.ids, c.acertoId, c.kitId).catch((e) => console.error("[rep-gravar] créditos de garantia", e));
  if (r.versao == null) r.versao = await versaoItens(modulo);
  if (fora.length) r.ignoradas = fora.length;
  return r;
}

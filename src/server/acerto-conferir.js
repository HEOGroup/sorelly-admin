// CONFERÊNCIA DO ACERTO NO SERVIDOR (Marcus, 28/11/2026: "o servidor não deve confiar cegamente nos valores calculados pelo navegador").
// Antes de gravar um acerto que chega do admin das representantes (src/server/rep-gravar.js, chave a_), o servidor refaz a conta com as regras OFICIAIS
// (as mesmas funções da tela: domain/acerto-derivado.js e domain/consignado.js) e compara com os números que o navegador mandou.
// O resultado fica no próprio registro (conferenciaServidor). Divergência NÃO apaga nem recusa o acerto (ele já foi feito na casa da revendedora): fica marcada para a auditoria.
// O carimbo não tem data nem hora de propósito: refazer a conta do mesmo registro dá sempre o mesmo carimbo, então a sincronização não regrava o acerto sem parar.
import { conferirRegistro } from "../apps/montagem/domain/acerto-derivado.js";
import { ID_CONDICOES_2, condicoes2Ativas, novaVersaoRegras, versaoCondicoes2 } from "../apps/montagem/domain/consignado.js";
import { lerPrefixos } from "./estado-itens.js";

const ID_REGRAS_1 = "rv20261027", VIGENCIA_REGRAS_1 = "2026-10-27";   // igual a state/store.js e domain/regras-acerto.js

export function conferirAcertoNoServidor(v) {
  if (!v || v.tipo !== "acerto") return null;
  const data = (v.memoria && v.memoria.dataAcerto) || v.data;
  const esperada = condicoes2Ativas(data) ? 2 : 1;   // a versão vem da DATA do acerto, decidida aqui, não do que o navegador disse
  const base = esperada === 2 ? versaoCondicoes2() : novaVersaoRegras({ id: ID_REGRAS_1, vigenciaDesde: VIGENCIA_REGRAS_1 });
  const r = conferirRegistro(v, base);
  if (r.semMemoria) return { ok: true, semMemoria: true, regras: base.id, divergencias: [] };   // acerto antigo ou de versão sem a conta única: não é recalculado
  const div = (r.divergencias || []).map((x) => ({ campo: x.campo, gravado: x.gravado, conta: x.conta }));
  const disse = v.regrasCondicoes === 2 || v.regrasVersaoId === ID_CONDICOES_2 ? 2 : 1;
  if (disse !== esperada) div.unshift({ campo: "regras", gravado: disse, conta: esperada });
  return { ok: !div.length, semMemoria: false, regras: base.id, divergencias: div.slice(0, 12) };
}
// nunca derruba a gravação: erro na conferência vira aviso no log e o acerto é gravado sem carimbo
export function conferirSemDerrubar(v) {
  try { return conferirAcertoNoServidor(v); } catch (e) { console.error("[acerto-conferir]", e && e.message); return null; }
}

// AUDITORIA, só leitura: refaz a conta de todos os acertos a partir de uma data e devolve o resumo e os que divergem. Não grava nada.
export async function auditarAcertos(desde) {
  // rpf = acertos do admin das representantes · aci = acertos do Atendimento Sorelly (atendimento interno)
  const [rpf, aci] = await Promise.all([lerPrefixos("rpf", ["a_"]), lerPrefixos("aci", ["a_"]).catch(() => ({}))]);
  const out = { desde, total: 0, conferidos: 0, semMemoria: 0, divergentes: [] };
  [["rpf", rpf], ["aci", aci]].forEach(([modulo, itens]) => Object.keys(itens).forEach((k) => {
    const v = itens[k]; if (!v || v._apagado || v.cancelado || v.tipo !== "acerto" || String(v.data || "") < desde) return;
    out.total++;
    const c = conferirSemDerrubar(v); if (!c) return;
    if (c.semMemoria) { out.semMemoria++; return; }
    out.conferidos++;
    if (!c.ok) out.divergentes.push({ modulo, chave: k, data: v.data, rep: v.rep || "", regras: c.regras, divergencias: c.divergencias });
  }));
  return out;
}

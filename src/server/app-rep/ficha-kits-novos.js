// Profissão, local/endereço de trabalho e contatos de referência que a Michele levantou em Kits novos, entregues na ficha da revendedora
// (26/11/2026, Marcus): a ficha do app (perfil.js) usa isto quando a representante ainda não preencheu. A ligação é pelo código da DevMaster (dm.cod).
import { lerModulo } from "./base.js";
import { foneContato, primeiroNome, trabalhoDe } from "../../apps/kits-novos/domain/padroniza.js";

const G = globalThis;
const TTL = 5 * 60 * 1000;
const norm = (v) => String(v || "").replace(/\D/g, "").replace(/^0+/, "");

async function indice() {
  const c = G.__sorellyFichaKn;
  if (c && Date.now() - c.em < TTL) return c.mapa;
  const dados = await lerModulo("kndados").catch(() => ({}));
  const mapa = new Map();
  for (const k of Object.keys(dados || {})) {
    if (!k.startsWith("r_")) continue;
    const d = dados[k], cod = norm(d && d.dm && d.dm.cod);
    if (cod) mapa.set(cod, d);
  }
  G.__sorellyFichaKn = { mapa, em: Date.now() };
  return mapa;
}

export async function fichaDoKitNovo(revCod) {
  const d = (await indice()).get(norm(revCod));
  if (!d) return null;
  const tr = trabalhoDe({ prof: d.prof, trab: d.trab, trabEnd: d.trabEnd });
  const refs = [1, 2, 3].map((n) => ({ nome: primeiroNome(d["c" + n + "n"]), relacao: String(d["c" + n + "r"] || "").trim(), telefone: String(foneContato(d["c" + n + "t"]) || "").replace(/\D/g, "").slice(0, 13) || null }))
    .filter((r) => r.nome || r.telefone);
  return { profissao: tr.prof || null, enderecoTrabalho: [tr.local, tr.end].filter(Boolean).join(" · ") || null, referencias: refs };
}

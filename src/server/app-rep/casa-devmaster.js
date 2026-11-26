// Endereço da casa da revendedora vindo do cadastro da DevMaster (26/11/2026, Marcus: "puxar de todas as revendedoras ativas da devmaster
// com condicional em aberto para subir no admin das representantes"). O app lê a ficha em GET /api/consignado/ingest/perfil (perfil.js):
// quando a representante ainda não preencheu o endereço da casa, a ficha mostra o do cadastro. O que a representante digitou sempre vale mais.
import { consultarTabela } from "../devmaster2.js";
import { titulo } from "../../apps/kits-novos/domain/padroniza.js";

const TTL = 6 * 3600 * 1000;
const G = globalThis;
const cache = (G.__sorellyCasaDm = G.__sorellyCasaDm || new Map());

export function formatarCasa(c) {
  const rua = String(c.aam_endereco || "").trim(), num = String(c.aam_numero || "").trim(), comp = String(c.aam_complemento || "").trim();
  const cep = String(c.aam_cep || "").replace(/\D/g, "");
  const partes = [rua && titulo(rua.toLowerCase()) + (num ? ", " + num : ""), comp && titulo(comp.toLowerCase()), titulo(String(c.aam_bairro || "").toLowerCase()), cep.length === 8 ? cep.slice(0, 5) + "-" + cep.slice(5) : cep];
  return partes.filter(Boolean).join(" · ") || null;
}

export async function casaDevMaster(revCod) {
  const cod = String(revCod || "").trim();
  if (!cod) return null;
  const c = cache.get(cod);
  if (c && Date.now() - c.em < TTL) return c.v;
  try {
    const r = await consultarTabela("dmaam", { registros: 1, filtro: { aam_codigo: cod }, campos: ["aam_codigo", "aam_endereco", "aam_numero", "aam_complemento", "aam_bairro", "aam_cep", "aam_municipio", "aam_estado"] });
    const v = r.itens[0] ? formatarCasa(r.itens[0]) : null;
    cache.set(cod, { v, em: Date.now() });
    return v;
  } catch (e) { return null; }   // DevMaster fora do ar: a ficha sai sem o endereço, sem erro
}

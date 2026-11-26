// Ficha das revendedoras no ADMIN DAS REPRESENTANTES (26/11/2026, Marcus: endereço da casa, profissão, trabalho e contatos de referência
// têm que aparecer para as representantes). A tela da representante lê as fichas do módulo rpo, chaves pr_<código da revendedora>
// (domain/app-rep.js, fichasDoServidor). Aqui o servidor GRAVA essas chaves sozinho para toda revendedora que a representante enxerga:
//   - quem tem kit no admin das representantes (k_<id> com codRev e rev);
//   - toda revendedora com condicional em aberto na DevMaster (representante = afi_vendedor).
// Conteúdo: endereço da casa (DevMaster) + profissão, trabalho e referências (Kits novos). O que a representante digitar vale mais:
// a ficha só é regravada se ainda está como o servidor deixou (campo "auto").
import { gravarItens, lerPrefixos } from "../estado-itens.js";
import { revendedorasComKitAtivo } from "../devmaster2.js";
import { casaDevMaster } from "./casa-devmaster.js";
import { fichaDoKitNovo } from "./ficha-kits-novos.js";
import { titulo } from "../../apps/kits-novos/domain/padroniza.js";

const POR_RODADA = 400;
const cod6 = (v) => String(v || "").replace(/\D/g, "").padStart(6, "0");
const campos = (f) => JSON.stringify([f.telefone2 || null, f.enderecoResidencial || "", f.enderecoTrabalho || "", f.profissao || "", f.referencias || []]);

export async function publicarFichas() {
  const r = { gravadas: 0, faltam: 0, erros: [] };
  const rpo = await lerPrefixos("rpo", ["k_", "pr_"]);
  const alvos = new Map();   // código -> {rev, repCod, rep}
  for (const [c, k] of Object.entries(rpo)) {
    if (!c.startsWith("k_") || !k || k._apagado || !k.rev || !k.codRev || !k.repCod) continue;
    alvos.set(cod6(k.codRev), { rev: String(k.rev), repCod: String(k.repCod), rep: k.rep || "" });
  }
  try {
    const d = await revendedorasComKitAtivo({});
    for (const x of d.itens) { const c = cod6(x.codigo); if (!alvos.has(c) && x.representante) alvos.set(c, { rev: titulo(String(x.nome || "").toLowerCase()), repCod: String(x.representante), rep: "" }); }
  } catch (e) { r.erros.push("DevMaster: " + e.message); }
  const pendentes = [];
  for (const [c, a] of alvos) {
    const ex = rpo["pr_" + c];
    if (ex && !ex._apagado && ex.auto === undefined) continue;   // criada pela representante: não mexer
    if (ex && ex.auto !== undefined && ex.auto !== campos(ex)) continue;   // a representante mexeu depois do servidor
    pendentes.push([c, a, ex]);
  }
  r.faltam = pendentes.length;
  const lote = pendentes.slice(0, POR_RODADA), itens = {};
  for (let i = 0; i < lote.length; i += 6) {
    await Promise.all(lote.slice(i, i + 6).map(async ([c, a, ex]) => {
      const casa = await casaDevMaster(c), kn = await fichaDoKitNovo(c).catch(() => null);
      const f = { telefone2: null, enderecoResidencial: casa || "", enderecoTrabalho: (kn && kn.enderecoTrabalho) || "", profissao: (kn && kn.profissao) || "", referencias: (kn && kn.referencias) || [] };
      if (ex && ex.auto === campos(f)) return;   // nada mudou
      if (!f.enderecoResidencial && !f.enderecoTrabalho && !f.profissao && !f.referencias.length) return;
      itens["pr_" + c] = Object.assign({}, f, { rev: a.rev, revCod: c, repCod: a.repCod, rep: a.rep, em: new Date().toISOString(), auto: campos(f) });
    }));
  }
  if (Object.keys(itens).length) { await gravarItens("rpo", itens, "app", "fichas-admin-rep"); r.gravadas = Object.keys(itens).length; }
  return r;
}

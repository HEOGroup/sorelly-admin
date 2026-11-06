// Ficha da revendedora preenchida pela representante no app real (06/11/2026, Leonardo): os dados que o cadastro não traz.
// No protótipo eles viviam só no navegador (s.perfisRev[rev]: fone2, enderecoCasa, enderecoTrabalho, profissao, refs); aqui ficam
// no servidor, numa chave por revendedora: rpo pr_<revCod> (dono app), gravada pelas rotas de serviço do app.
//   GET /api/consignado/ingest/perfil?rep=<cod>&revCod=<000123>  -> {perfil}
//   PUT /api/consignado/ingest/perfil {rep, revCod, telefone2, enderecoResidencial, enderecoTrabalho, profissao, referencias:[{nome, relacao, telefone}]} -> {perfil}
import { gravarItens, lerChaves } from "../estado-itens.js";
import { recusa, texto } from "../servico.js";
import { revCodDe } from "./base.js";
import { vivo } from "../../apps/montagem/domain/app-rep.js";

export const MAX_REFERENCIAS = 3;

const digitos = (v) => (typeof v === "string" ? v.replace(/\D/g, "").slice(0, 13) : "");
const ouNulo = (v) => v || null;

function revCodValido(revCod) {
  const c = revCodDe(null, revCod);
  if (!/^\d{6,10}$/.test(c)) throw recusa("Revendedora inválida.", 400);
  return c;
}

function telefoneOuNulo(v, rotulo) {
  const d = digitos(v);
  if (!d) return null;
  if (d.length < 10) throw recusa(rotulo + ": telefone incompleto.", 422);
  return d;
}

// o que o app recebe: sempre os mesmos campos, vazios como null
function paraApp(p) {
  const v = vivo(p) ? p : {};
  return {
    telefone2: ouNulo(v.telefone2),
    enderecoResidencial: ouNulo(v.enderecoResidencial),
    enderecoTrabalho: ouNulo(v.enderecoTrabalho),
    profissao: ouNulo(v.profissao),
    referencias: (Array.isArray(v.referencias) ? v.referencias : []).slice(0, MAX_REFERENCIAS).map((r) => ({
      nome: (r && r.nome) || "", relacao: (r && r.relacao) || "", telefone: ouNulo(r && r.telefone),
    })),
    atualizadoEm: v.em || null,
    atualizadoPor: v.rep || null,
  };
}

export async function lerPerfil(revCod) {
  const c = revCodValido(revCod);
  const r = await lerChaves("rpo", ["pr_" + c]);
  return { perfil: paraApp(r["pr_" + c]) };
}

export async function salvarPerfil(rep, b) {
  const c = revCodValido(b.revCod);
  const refs = (Array.isArray(b.referencias) ? b.referencias : []).slice(0, MAX_REFERENCIAS)
    .map((r, i) => ({
      nome: texto(r && r.nome, 80),
      relacao: texto(r && r.relacao, 40),
      telefone: telefoneOuNulo(r && r.telefone, "Referência " + (i + 1)),
    }))
    .filter((r) => r.nome || r.relacao || r.telefone);   // linha toda vazia não conta
  refs.forEach((r, i) => { if (!r.nome) throw recusa("Referência " + (i + 1) + ": informe o nome.", 422); });
  const pr = {
    revCod: c, repCod: rep.cod, rep: rep.nome,
    telefone2: telefoneOuNulo(b.telefone2, "2º telefone"),
    enderecoResidencial: texto(b.enderecoResidencial, 200),
    enderecoTrabalho: texto(b.enderecoTrabalho, 200),
    profissao: texto(b.profissao, 80),
    referencias: refs,
    em: new Date().toISOString(),
  };
  await gravarItens("rpo", { ["pr_" + c]: pr }, "app", "app:" + rep.cod);
  return { perfil: paraApp(pr) };
}

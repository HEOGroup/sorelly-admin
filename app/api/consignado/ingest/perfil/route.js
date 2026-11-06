export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Ficha da revendedora preenchida pela representante no app (serviço, x-ingest-key). Contrato 1.9.
//   GET /api/consignado/ingest/perfil?rep=<cod>&revCod=<000123> -> {perfil}
//   PUT /api/consignado/ingest/perfil {rep, revCod, telefone2, enderecoResidencial, enderecoTrabalho, profissao, referencias} -> {perfil}
// Grava pr_<revCod> no módulo rpo (dono app).
import { corpoServico, ok, recusa, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { lerPerfil, salvarPerfil } from "@/server/app-rep/perfil";

export const GET = rotaServico(async (req, { url }) => {
  const cod = (url.searchParams.get("rep") || "").trim();
  if (!cod) throw recusa("Informe a representante (?rep=código).", 400);
  return ok(await lerPerfil(url.searchParams.get("revCod")));
});

export const PUT = rotaServico(async (req) => {
  const b = await corpoServico(req, 32 * 1024);
  const rep = await representante(b.rep, b.repNome);
  return ok(await salvarPerfil(rep, b));
});

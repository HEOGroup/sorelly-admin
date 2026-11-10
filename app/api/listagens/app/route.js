export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Listagens do APP REAL da representante (serviço: o backend do app chama com x-ingest-key). Contrato 1.5 de sorelly-app/docs/app-representante/CONTRATOS.md.
//   GET  /api/listagens/app?rep=<cod>                         -> {listagens:[ListagemApp], retiradaPendente:null}
//   POST /api/listagens/app {rep, repNome, data, horario, viagem, destino?} -> 201 ListagemApp
import { corpoServico, ok, recusa, rotaServico } from "@/server/servico";
import { representante } from "@/server/app-rep/base";
import { criarListagem, listagensDaRep } from "@/server/app-rep/listagens";

export const GET = rotaServico(async (req, { url }) => {
  const cod = (url.searchParams.get("rep") || "").trim();
  if (!cod) throw recusa("Informe a representante (?rep=código).", 400);
  const rep = await representante(cod, url.searchParams.get("repNome"));
  return ok({ listagens: await listagensDaRep(rep), retiradaPendente: null });
});

export const POST = rotaServico(async (req) => {
  const b = await corpoServico(req, 64 * 1024);
  const rep = await representante(b.rep, b.repNome);
  return ok(await criarListagem(rep, b), 201);
});

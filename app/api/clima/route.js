export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Pesquisa de clima (18/11/2026), parte RESTRITA (só quem está em LEITORES_CLIMA, conferido pelo pessoaId da conta).
//   GET  /api/clima?rodada=ID   lista as rodadas e devolve o resultado da escolhida (a mais recente, se não vier ID).
//   POST /api/clima             {acao:"abrir", nome} abre uma rodada nova (encerra a aberta) | {acao:"encerrar", id} encerra uma rodada.
import { json, erro, rota, corpo } from "@/server/http";
import { abrirRodada, encerrarRodada, listarRodadas, podeVerClima, resultadoRodada } from "@/server/clima";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeVerClima(eu)) return erro("Só quem foi liberado abre a pesquisa de clima.", 403);
  const rodadas = await listarRodadas();
  const pedida = Number(url.searchParams.get("rodada")), alvo = rodadas.find((r) => r.id == pedida) || rodadas[0] || null;
  return json({ rodadas, rodada: alvo ? alvo.id : null, resultado: alvo ? await resultadoRodada(alvo.id) : null });
});

export const POST = rota(async (req, { eu }) => {
  if (!podeVerClima(eu)) return erro("Só quem foi liberado abre a pesquisa de clima.", 403);
  const b = await corpo(req, 8 * 1024);
  if (b.acao === "abrir") return json({ ok: true, id: await abrirRodada(b.nome) });
  if (b.acao === "encerrar") { const id = Number(b.id); return Number.isInteger(id) && (await encerrarRodada(id)) ? json({ ok: true }) : erro("Rodada não encontrada ou já encerrada.", 404); }
  return erro("Ação desconhecida.", 400);
});

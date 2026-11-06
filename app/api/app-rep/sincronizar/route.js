export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Sincronização com o app da representante (kits novos, respostas, aviso de kit pronto): o servidor roda sozinho a cada 60 s
// (instrumentation.js, com APP_REP_SINCRONIZAR=1). Aqui a Diretoria vê a última rodada e pede uma agora.
//   GET  /api/app-rep/sincronizar -> {ligada, ultima}
//   POST /api/app-rep/sincronizar -> resultado da rodada {enviados, retirados, respostas, avisos, erros}
import { json, rota } from "@/server/http";
import { podeGravar } from "@/server/app-rep/cliente-app";
import { sincronizarApp, ultimaSincronizacao } from "@/server/app-rep/sincronizar";

export const GET = rota(async () => json({ ligada: podeGravar(), ultima: ultimaSincronizacao() }));
export const POST = rota(async () => json(await sincronizarApp()), { diretoria: true });

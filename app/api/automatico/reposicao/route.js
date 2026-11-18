export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;
// Cadastro de peças › Pedidos › Peças: lê da DevMaster (só leitura) o estoque e as saídas e grava o resumo por categoria no módulo cpc (ver src/server/reposicao.js).
// Quem pode chamar: o agendador da Vercel (Authorization: Bearer CRON_SECRET, uma vez por dia) ou qualquer pessoa logada (botão "Atualizar" da tela; se já foi lido há menos de 10 minutos, não lê de novo).
// `?forcar=1` ignora a espera (só a Diretoria ou o agendador).
import { erro, json, rota, usuarioDe } from "@/server/http";
import { rodarReposicao } from "@/server/reposicao";

const executar = rota(async (req, { url }) => {
  const h = req.headers.get("authorization") || "", segredo = process.env.CRON_SECRET || "";
  const ehCron = !!segredo && h === "Bearer " + segredo;
  const eu = ehCron ? null : await usuarioDe(req);
  if (!ehCron && !eu) return erro("Entre no sistema para continuar.", 401);
  const forcar = url.searchParams.get("forcar") === "1" && (ehCron || (eu && eu.perfil === "ADMIN"));
  return json(await rodarReposicao({ forcar, cron: ehCron }));
}, { publica: true });

export const GET = executar;
export const POST = executar;

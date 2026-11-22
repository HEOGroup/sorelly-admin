export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Indicações ao vivo (19/11/2026): o estado das telas (funil, pedidos de prêmio, revendedoras e moedas, planilha antiga), lido do app e do banco deste sistema.
//   GET /api/indicacoes/estado?atualizar=1&arquivo=<versão que a tela já tem>
// Setores cadastro e kitsnovos (e a Diretoria) leem tudo; o Agendamento (Atendimento Sorelly › Brinde de indicação) recebe só os pedidos em aberto.
import { erro, json, rota } from "@/server/http";
import { montarEstado, podeIndicacoes, podeLer } from "@/server/indicacoes";

export const GET = rota(async (req, { eu, url }) => {
  if (!podeLer(eu)) return erro("Seu acesso não abre as Indicações.", 403);
  const q = url.searchParams;
  return json(await montarEstado({ forcar: q.get("atualizar") === "1", arquivoVersao: q.get("arquivo") || "", soAbertos: !podeIndicacoes(eu) }));
});

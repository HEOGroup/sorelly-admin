// Link PÚBLICO e somente leitura do relatório por pedido dos Pagamentos a fornecedores (19/11/2026).
// O código do link (pf.linksPedido[token] = {fornId, pedidos}) define o ESCOPO: só aqueles pedidos e só os comprovantes dos pagamentos ligados a eles.
// Não dá acesso ao fechamento completo, a outros pedidos nem a nada do sistema. O link completo antigo (tokensAcerto) não muda.
import { consulta } from "@/server/db";
import { garantirTabelaAnexo } from "@/server/anexos";
import { pfVazio, pagosDoPedido } from "@/apps/montagem/domain/pf";

export const tokenValido = (t) => typeof t === "string" && /^[a-z0-9]{16,40}$/.test(t);

// {pf, escopo} ou null (código desconhecido ou fornecedor com a opção desligada continua valendo: o link é só leitura do que já foi enviado)
export async function lerEscopo(token) {
  if (!tokenValido(token)) return null;
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'pf'");
  const pf = Object.assign(pfVazio(), (r.rows[0] && r.rows[0].conteudo) || {});
  const escopo = (pf.linksPedido || {})[token];
  if (!escopo || !Array.isArray(escopo.pedidos) || !escopo.pedidos.length) return null;
  return { pf, escopo };
}

// comprovante de um pagamento SÓ se ele estiver ligado a um pedido do escopo
export async function comprovanteDoEscopo(pf, escopo, lancId) {
  const ok = escopo.pedidos.some((pid) => pagosDoPedido(pf, pid).some((x) => x.l.id === lancId));
  if (!ok) return null;
  const l = pf.lancamentos.find((x) => x.id === lancId);
  if (!l || !l.arqKey) return null;
  await garantirTabelaAnexo();
  const a = (await consulta("select nome, mime, url from sorelly.anexo_modulo where id = $1 and modulo = 'pf'", [l.arqKey])).rows[0];
  return a || null;
}

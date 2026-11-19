// Pix adiantado da revendedora (Marcus, 19/11/2026). Quem faz o acerto no Atendimento interno NÃO lê o módulo ff (Financeiro familiar, só sócios),
// mas precisa saber que a revendedora já pagou um prestador por Pix. Este arquivo lê e grava o ff SÓ para isso, devolvendo o mínimo (valor, data, conta).
// A regra em si (nome parecido, depois do último acerto, nunca marcar duas vezes) está em domain/pix-adiantados.js e é a mesma testada em scripts/testar-pix-adiantado.mjs.
import { consulta } from "./db.js";
import { gravarModulo } from "./estado-modulo.js";
import { pixAdiantadosDe, sincronizarUso } from "../apps/montagem/domain/pix-adiantados.js";

async function lerFf() {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'");
  return r.rowCount ? r.rows[0].conteudo : null;
}

const DATA_OK = /^\d{4}-\d{2}-\d{2}$/;
const reais = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Pix livres desta revendedora. Sem ff no servidor ainda: lista vazia.
export async function listarPixAdiantados({ nome, desde, internoId }) {
  const ff = await lerFf();
  if (!ff) return [];
  return pixAdiantadosDe(ff, String(nome || ""), { desde: DATA_OK.test(String(desde || "")) ? desde : "", internoId: String(internoId || "") });
}

// Marca como usados (e solta os que saíram) os Pix de um atendimento. Só grava se algo mudou. A gravação trava o módulo (gravarModulo): dois acertos juntos não marcam o mesmo Pix.
export async function marcarPixAdiantados({ internoId, rev, ids }, por) {
  const ff0 = await lerFf();
  const vazio = { marcados: [], soltos: [], recusados: [] };
  if (!ff0 || !Array.isArray(ff0.pix)) return Object.assign({}, vazio, { recusados: [{ id: "", motivo: "Financeiro familiar ainda não está no servidor." }] });
  const previa = sincronizarUso(ff0, { internoId, rev, ids, por });
  if (!previa.marcados.length && !previa.soltos.length) return { marcados: [], soltos: [], recusados: previa.recusados };
  let resultado = null;
  await gravarModulo("ff", {}, "patch", por, (guardado, novo) => {   // refaz a conta dentro da transação, em cima do que está guardado agora
    const r = sincronizarUso(guardado, { internoId, rev, ids, por, em: new Date().toISOString() });
    resultado = { marcados: r.marcados, soltos: r.soltos, recusados: r.recusados };
    const hist = (guardado.hist || []).slice();
    const cada = (lista, acao) => lista.forEach((id) => { const x = (guardado.pix || []).find((y) => y.id === id); hist.unshift({ id: "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), em: Date.now(), por: por || "", area: "PIX revendedoras", acao, alvo: (x && x.origem) || "", detalhe: x ? reais(x.valor) : "" }); });
    cada(r.marcados, "Usado no acerto (Atendimento interno)"); cada(r.soltos, "Soltou do acerto (Atendimento interno)");
    if (hist.length > 2000) hist.length = 2000;
    return Object.assign({}, novo, { pixUsados: r.ff.pixUsados || {}, hist });   // só o mapa de marcas e o histórico: a lista de Pix não é regravada
  });
  return resultado || vazio;
}

// Pix adiantado da revendedora (Marcus, 19/11/2026). Quem faz o acerto no Atendimento interno NÃO lê o módulo ff (Financeiro familiar, só sócios),
// mas precisa saber que a revendedora já pagou um prestador por Pix. Este arquivo lê e grava o ff SÓ para isso, devolvendo o mínimo (valor, data, conta).
// A regra em si (nome parecido, depois do último acerto, nunca marcar duas vezes) está em domain/pix-adiantados.js e é a mesma testada em scripts/testar-pix-adiantado.mjs.
import { consulta } from "./db.js";
import { gravarModulo } from "./estado-modulo.js";
import { pixAdiantadosDe, sincronizarUso } from "../apps/montagem/domain/pix-adiantados.js";
import { antecipadosDe, sincronizarUsoRcb, garantir } from "../apps/montagem/domain/recebimentos-antecipados.js";   // Pix da EMPRESA lançado em Contas a receber (20/11/2026): o acerto também o consome

async function lerFf() {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'ff'");
  return r.rowCount ? r.rows[0].conteudo : null;
}

const DATA_OK = /^\d{4}-\d{2}-\d{2}$/;
const reais = (v) => Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

async function lerRcb() {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'contasreceber'");
  return r.rowCount ? r.rows[0].conteudo : null;
}

// Pix livres desta revendedora: os que estão no Financeiro familiar (fonte "ff") e os da empresa lançados em Contas a receber (fonte "rcb"). Sem nada no servidor ainda: lista vazia.
export async function listarPixAdiantados({ nome, desde, internoId }) {
  const [ff, rcb] = await Promise.all([lerFf(), lerRcb()]);
  const o = { desde: DATA_OK.test(String(desde || "")) ? desde : "", internoId: String(internoId || "") };
  const a = ff ? pixAdiantadosDe(ff, String(nome || ""), o).map((x) => Object.assign({}, x, { fonte: "ff" })) : [];
  const b = rcb ? antecipadosDe(rcb, String(nome || ""), o).map((x) => Object.assign({}, x, { fonte: "rcb" })) : [];
  return a.concat(b).sort((x, y) => (x.data < y.data ? -1 : x.data > y.data ? 1 : 0));
}

// Marca como usados (e solta os que saíram) os Pix de um atendimento. Só grava se algo mudou. A gravação trava o módulo (gravarModulo): dois acertos juntos não marcam o mesmo Pix.
// Os ids se dividem: os da empresa (módulo contasreceber) e os da Família (módulo ff); cada lado marca e solta só os dele.
export async function marcarPixAdiantados({ internoId, rev, ids }, por) {
  const [ff0, rcb0] = await Promise.all([lerFf(), lerRcb()]);
  const total = { marcados: [], soltos: [], recusados: [] };
  const daEmpresa = new Set(garantir(rcb0).antecipados.filter((x) => x.destino === "empresa").map((x) => x.id));
  const idsRcb = ids.filter((i) => daEmpresa.has(i)), idsFf = ids.filter((i) => !daEmpresa.has(i));
  const juntar = (r) => { total.marcados.push(...r.marcados); total.soltos.push(...r.soltos); total.recusados.push(...r.recusados); };
  // lado da Família
  if (!ff0 || !Array.isArray(ff0.pix)) { if (idsFf.length) total.recusados.push({ id: "", motivo: "Financeiro familiar ainda não está no servidor." }); }
  else {
    const previa = sincronizarUso(ff0, { internoId, rev, ids: idsFf, por });
    if (!previa.marcados.length && !previa.soltos.length) juntar({ marcados: [], soltos: [], recusados: previa.recusados });
    else {
      let resultado = null;
      await gravarModulo("ff", {}, "patch", por, (guardado, novo) => {   // refaz a conta dentro da transação, em cima do que está guardado agora
        const r = sincronizarUso(guardado, { internoId, rev, ids: idsFf, por, em: new Date().toISOString() });
        resultado = { marcados: r.marcados, soltos: r.soltos, recusados: r.recusados };
        const hist = (guardado.hist || []).slice();
        const cada = (lista, acao) => lista.forEach((id) => { const x = (guardado.pix || []).find((y) => y.id === id); hist.unshift({ id: "h" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), em: Date.now(), por: por || "", area: "PIX revendedoras", acao, alvo: (x && x.origem) || "", detalhe: x ? reais(x.valor) : "" }); });
        cada(r.marcados, "Usado no acerto (Atendimento interno)"); cada(r.soltos, "Soltou do acerto (Atendimento interno)");
        if (hist.length > 2000) hist.length = 2000;
        return Object.assign({}, novo, { pixUsados: r.ff.pixUsados || {}, hist });   // só o mapa de marcas e o histórico: a lista de Pix não é regravada
      });
      if (resultado) juntar(resultado);
    }
  }
  // lado da empresa (Contas a receber)
  if (rcb0 || idsRcb.length) {
    const previa = sincronizarUsoRcb(rcb0, { internoId, rev, ids: idsRcb, por });
    if (!previa.marcados.length && !previa.soltos.length) juntar({ marcados: [], soltos: [], recusados: previa.recusados });
    else {
      let resultado = null;
      await gravarModulo("contasreceber", {}, "patch", por, (guardado, novo) => {
        const r = sincronizarUsoRcb(guardado, { internoId, rev, ids: idsRcb, por, em: new Date().toISOString() });
        resultado = { marcados: r.marcados, soltos: r.soltos, recusados: r.recusados };
        return Object.assign({}, novo, { usados: r.rcb.usados });   // só o mapa de marcas
      });
      if (resultado) juntar(resultado);
    }
  }
  return total;
}

// Respostas aprovadas pelo Marcus (02/11/2026) aos pedidos do Financeiro em Melhorias: Nayale (trocar CNPJ), Resultado do mês (filtro) e Negociações (parcelas).
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/responder-melhorias-financeiro-02-11.mjs
import { consulta, pool } from "../../src/server/db.js";
const R = [
  ["mvtvnbly3q5", "Mudança feita, testar", "Nayale, agora dá para trocar o CNPJ de uma conta, mesmo já paga. Abra a conta (clique na linha), mude o campo \"CNPJ da conta\" e clique em \"Trocar CNPJ\". Se errar, use \"Voltar ao original\". Atualize a tela para ver."],
  ["mvt6zjuz7qs", "Mudança feita, testar", "O filtro de mês já existe no alto da tela, de janeiro até o mês atual. Tirei uma opção repetida da lista."],
  ["mvt7d6u4yid", "Mudança feita, testar", "A regra já está corrigida: a parcela cai no mesmo dia do mês seguinte, ou no último dia quando o mês é mais curto. Testei de 31/12 em diante e não deu data inexistente."]
];
const atual = (await consulta("select conteudo from sorelly.estado_modulo where modulo='mel'")).rows[0].conteudo;
const novo = {}; const agora = new Date().toISOString();
R.forEach(([id, sit, txt], i) => {
  const s = atual["s_" + id]; if (!s) { console.log("NÃO ACHEI s_" + id); return; }
  novo["c_" + id + "_mfi" + (Date.now() + i).toString(36)] = { em: new Date(Date.now() + i * 1000).toISOString(), img: "", por: "Marcus", txt, porId: 16 };
  novo["s_" + id] = Object.assign({}, s, { situacao: sit, mudouEm: agora });
});
const r = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_em = now() where modulo='mel' returning versao", [JSON.stringify(novo)]);
console.log("gravados:", Object.keys(novo).length, "| versão", r.rows[0].versao);
await pool().end();

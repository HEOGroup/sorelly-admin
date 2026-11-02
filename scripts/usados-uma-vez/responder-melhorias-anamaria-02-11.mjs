// Respostas do Marcus (aprovadas por ele em 02/11/2026) aos dois pedidos da Anamaria em Melhorias. Cada resposta é um comentário (chave c_<pedido>_<id>).
//   node --env-file-if-exists=.env.local scripts/usados-uma-vez/responder-melhorias-anamaria-02-11.mjs
import { consulta, pool } from "../../src/server/db.js";
const R = [
  ["mvva6zi015c", "Mudança feita, testar", "Anamaria, liberei a tela Pagas por dia na sua conta. Atualize a tela e vá em Financeiro → Contas → Pagas por dia. Também gravei uma aula que mostra como ver o que foi pago em cada dia. Ela está em Aulas do setor → Financeiro."],
  ["mvvccrablyp", null, "Anamaria, gravei uma aula que mostra como excluir um lançamento: Aulas do setor → Financeiro → Excluir um lançamento feito à mão. Esse R$ 1.000,00 é o bônus do Nickolas do dia 23/10 e faz parte de um combinado, por isso não tem o botão Excluir. Se ele já foi pago, clique na linha e use Registrar pagamento. Se não foi pago, deixe como está."]
];
const atual = (await consulta("select conteudo from sorelly.estado_modulo where modulo='mel'")).rows[0].conteudo;
const novo = {}; const agora = new Date().toISOString();
R.forEach(([id, sit, txt], i) => {
  const s = atual["s_" + id]; if (!s) { console.log("NÃO ACHEI s_" + id); return; }
  novo["c_" + id + "_man" + (Date.now() + i).toString(36)] = { em: new Date(Date.now() + i * 1000).toISOString(), img: "", por: "Marcus", txt, porId: 16 };
  if (sit) novo["s_" + id] = Object.assign({}, s, { situacao: sit, mudouEm: agora });
});
const r = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_em = now() where modulo='mel' returning versao", [JSON.stringify(novo)]);
console.log("gravados:", Object.keys(novo).length, "| versão", r.rows[0].versao);
await pool().end();

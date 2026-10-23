// Cria os combinados de partida da Rotina do dia, SÓ se a tabela estiver vazia. Uso: DATABASE_URL=... npm run semear-rotina
// Pessoas = ids do sistema novo (src/apps/montagem/domain/equipe.js). Os horários são suposição: a Diretoria ajusta na tela.
import { consulta, pool } from "../src/server/db.js";

const SEG_SAB = [1, 2, 3, 4, 5, 6], SEG_SEX = [1, 2, 3, 4, 5];
const ITENS = [
  ["Definir o valor dos kits do dia", "Montagem", [11], "08:30", SEG_SEX, "calc"],
  ["Presença do RH", "RH", [38], "09:00", SEG_SEX, "rhpresenca"],
  ["Faturamento do dia e acertos acumulados", "Financeiro", [36], "09:30", SEG_SAB, "previsaofat"],
  ["Total de revendedoras", "Direção", [16], "10:00", SEG_SAB, "visaogeral"],
  ["Saldos das contas", "Financeiro", [27], "10:30", SEG_SEX, "caixa"],
  ["Decidir pedidos de compra", "Financeiro", [27], "14:00", SEG_SEX, "compras"],
  ["Conferir pagamentos e definir as contas", "Financeiro", [27, 28], "15:00", SEG_SEX, "cpagamentos"],
  ["Registrar inadimplência recuperada", "Inadimplência", [32], "16:30", SEG_SEX, "inadimp"],
  ["Passadas para o próximo mês (Agendamento)", "Agendamento", [24], "17:00", SEG_SAB, "visaogeral"],
  ["Contas pagas do dia por CNPJ", "Financeiro", [27], "17:30", SEG_SEX, "contaspagar"]
];
const ja = (await consulta("select count(*)::int n from sorelly.rotina_item")).rows[0].n;
if (ja) console.log(`Já existem ${ja} combinados: nada feito.`);
else {
  for (const [i, [nome, setor, quem, hora, dias, rota]] of ITENS.entries())
    await consulta("insert into sorelly.rotina_item (nome, setor, pessoas, horario_limite, dias, rota, ordem) values ($1, $2, $3::jsonb, $4::time, $5, $6, $7)", [nome, setor, JSON.stringify(quem), hora, dias, rota, i]);
  console.log(`${ITENS.length} combinados criados.`);
}
await pool().end();

// Respostas do Marcus às solicitações de RH e da Deysiane em Melhorias (01/11/2026). Cada resposta é um comentário (chave c_<pedido>_<id>) e o pedido passa para a situação indicada.
//   node --env-file-if-exists=.env.local scripts/responder-melhorias-rh-01-11.mjs
import { consulta, pool } from "../../src/server/db.js";
const LINK = "https://sorelly-admin.vercel.app/tutoriais/index.html";
const R = [
  ["mvteoruhvkj", "Mudança feita, testar", "Feito, Maria! Em RH → Presença diária agora existe a Visão do dia: lista de quem está escalada, em ordem alfabética, com busca por nome, filtro por empresa (CNPJ, na barra de cima), filtro por ocorrência (P, F, AJ, AT, FE, FO, AF e Sem lançamento) e o botão Marcar todos como presentes. Depois é só marcar quem faltou. O FJ que você pediu no sistema se chama AJ (falta com aviso). Pode testar e me dizer se está bom."],
  ["mvtnxzmuz21", "Mudança feita, testar", "Maria, puxei tudo do admin antigo para o novo: 75 colaboradores (admissão, salário, entrada, plano, função, desligamentos e afastamentos), presença de 01/09 a 30/10, advertências e horas extras. O que você já tinha lançado ficou como estava, só acrescentei o que faltava. CPF, telefone, cidade e vale-transporte não existiam no antigo, então esses o RH completa na ficha. Pode conferir e me dizer o que ainda falta."],
  ["mvtuqrlaoo2", "Mudança feita, testar", "Feito, Maria! Em RH → Colaboradores há o bloco Filtros: setor, função, empresa, situação, escala, entrada e vale-transporte, com o botão Limpar filtros. Pode testar."],
  ["mvtvqpyr2ft", "Mudança feita, testar", "Corrigido, Maria! Quando chega mensagem nova numa conversa arquivada, ela volta para a lista sozinha. Também dá para arquivar mesmo com mensagem sem resposta. Pode testar."],
  ["mvts21h7wv9", "Mudança feita, testar", "Feito, Deysiane! Os feriados do RH agora aparecem no calendário do atendimento interno (Revendedoras internas) como Feriado, ficam sem vagas e não deixam marcar cliente, igual ao domingo. Se algum feriado estiver faltando, peça para a Maria incluir no RH. Pode testar."],
  ["mvtscxozujc", "Em análise", "Deysiane, para mudar colaboradora de setor, função, escala ou horário agora existe o pedido ao RH: Recursos Humanos → Solicitações. Você escolhe a colaboradora, o que muda e o motivo, e clica em Enviar ao RH; a Maria confirma e o cadastro muda. O passo a passo está aqui: " + LINK + " (o vídeo entra na mesma página). Sua lista (montagem: Jordana, Milena e Maria V. Krefta; bipagem: Geisimara e Paula Dias; sair da bipagem: Renata e Nataly) já está anotada. Faça os pedidos pela aba Solicitações para a Maria confirmar; a Equipe de Montagem e Bipagem eu atualizo em seguida."]
];
const atual = (await consulta("select conteudo from sorelly.estado_modulo where modulo='mel'")).rows[0].conteudo;
const novo = {}; const agora = new Date().toISOString();
R.forEach(([id, sit, txt], i) => {
  const s = atual["s_" + id]; if (!s) { console.log("NÃO ACHEI s_" + id); return; }
  novo["c_" + id + "_mrh" + (Date.now() + i).toString(36)] = { em: new Date(Date.now() + i * 1000).toISOString(), img: "", por: "Marcus", txt, porId: 16 };
  novo["s_" + id] = Object.assign({}, s, { situacao: sit, mudouEm: agora });
});
const r = await consulta("update sorelly.estado_modulo set conteudo = conteudo || $1::jsonb, versao = versao + 1, atualizado_em = now() where modulo='mel' returning versao", [JSON.stringify(novo)]);
console.log("comentários e situações gravados:", Object.keys(novo).length, "| versão", r.rows[0].versao);
await pool().end();

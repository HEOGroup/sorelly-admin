// SorellyChat no servidor (27/10/2026): conversas e mensagens guardadas no banco, para as pessoas conversarem de verdade entre computadores.
// Quem é quem: a conta logada (pessoa_id) vira o contato do chat (ex.: "f_nickolasneves") pela mesma regra da tela (domain/chat-contatos.js).
// Só quem é MEMBRO de uma conversa lê e escreve nela. Cada mudança ganha um número de ordem (seq): a tela pede só o que veio depois do último que viu.
import { contatoDoLogin } from "@/apps/montagem/domain/chat-contatos";
import { erro, invalido } from "./http.js";

// o contato do chat vem da própria conta (cid); sem ele, pela lista de pessoas do sistema
export const contatoDaConta = (eu) => (eu && eu.cid) || (eu && eu.pessoaId != null ? contatoDoLogin(eu.pessoaId) : null);

// devolve o contato (cid) de quem pediu, ou joga erro 403 se a conta não está ligada a um contato do chat
export function exigirContato(eu) {
  const cid = contatoDaConta(eu);
  if (!cid) throw Object.assign(new Error("Sua conta ainda não está ligada a uma pessoa do chat. Fale com a Diretoria."), { statusCode: 400 });
  return cid;
}

export function validarMembros(membros) {
  if (!Array.isArray(membros) || membros.length < 1 || membros.length > 300 || !membros.every((x) => typeof x === "string" && x.length <= 80)) throw invalido("membros");
  return [...new Set(membros)];
}
export const idValido = (x) => typeof x === "string" && /^[A-Za-z0-9_.:-]{1,120}$/.test(x);
export { erro };

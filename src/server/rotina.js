// Conversão e validação dos itens da Rotina do dia (usado pelas rotas em app/api/rotina).
import { invalido } from "./http.js";

export const DIA = /^\d{4}-\d{2}-\d{2}$/;
const HORA = /^(\d{2}:\d{2})?$/;

export const paraItem = (r) => ({ id: r.id, nome: r.nome, setor: r.setor, quem: r.pessoas || [], hora: r.horario_limite ? String(r.horario_limite).slice(0, 5) : "", dias: r.dias || [], rota: r.rota || "", ativo: r.ativo, ordem: r.ordem });

export function validarItem(b, { criar }) {
  const txt = (v) => typeof v === "string";
  if (criar && (!txt(b.nome) || !b.nome.length)) throw invalido("nome");
  if (b.nome !== undefined && (!txt(b.nome) || !b.nome.length)) throw invalido("nome");
  if (b.setor !== undefined && !txt(b.setor)) throw invalido("setor");
  if (criar && (!Array.isArray(b.quem) || !b.quem.length)) throw invalido("quem");
  if (b.quem !== undefined && (!Array.isArray(b.quem) || !b.quem.length || !b.quem.every(Number.isInteger))) throw invalido("quem");
  if (b.hora !== undefined && (!txt(b.hora) || !HORA.test(b.hora))) throw invalido("hora");
  if (b.dias !== undefined && (!Array.isArray(b.dias) || !b.dias.every((d) => Number.isInteger(d) && d >= 0 && d <= 6))) throw invalido("dias");
  if (b.rota !== undefined && !txt(b.rota)) throw invalido("rota");
  if (b.ativo !== undefined && typeof b.ativo !== "boolean") throw invalido("ativo");
  return b;
}

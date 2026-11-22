// Testa a conta PF própria do sócio no "Lançar recebimento" (Marcus, 21/11/2026): Nubank e Caixa primeiro, o Pix grava a conta e cai na caixa dela.
// Só lógica pura, com DADOS DE MENTIRA (nenhum banco, nenhum Pix real). Rodar: node scripts/testar-conta-propria-socio.mjs
import { contasProprias, resolverDestino, espelharNaFamilia, validarLancamento } from "../src/apps/montagem/domain/recebimentos-antecipados.js";
import { rotuloDestino, rotuloPrestadorFamilia, nomePropio } from "../src/apps/montagem/lib/nome-conta.js";
import { rotuloLeaf } from "../src/apps/montagem/domain/recebimentos-antecipados.js";

let ok = 0, falhou = 0;
const confere = (nome, cond, extra) => { if (cond) { ok++; console.log("  ok  " + nome); } else { falhou++; console.log("FALHOU  " + nome + (extra ? "  → " + extra : "")); } };

const ff = {
  personas: [{ id: "socioa", nome: "Fulano", tipo: "SOCIO", ativo: true }, { id: "sociob", nome: "Beltrana", tipo: "SOCIO", ativo: true }, { id: "familia", nome: "Casa/Família", tipo: "FAMILIAR", ativo: true }],
  contasBanc: [
    { id: "c1", nome: "Conta Fulano — Sicredi", tipo: "PF", ativo: true, banco: "Sicredi", personaId: "socioa", prestadorId: "" },
    { id: "c2", nome: "Conta Fulano — Caixa", tipo: "PF", ativo: true, banco: "Caixa", personaId: "socioa", prestadorId: "" },
    { id: "c3", nome: "Conta Fulano — Nubank", tipo: "PF", ativo: true, banco: "Nubank", personaId: "socioa", prestadorId: "" },
    { id: "c4", nome: "Conta Prestador X", tipo: "PF", ativo: true, banco: "Bradesco", personaId: "socioa", prestadorId: "p1" },
    { id: "c5", nome: "Cartão de Créd. Fulano", tipo: "PF", ativo: true, banco: "Itaú", personaId: "socioa", prestadorId: "" },
    { id: "c6", nome: "Pix rev. Fulano", tipo: "PF", ativo: true, banco: "Nubank", personaId: "socioa", prestadorId: "" },
    { id: "c7", nome: "Conta Fulano — Inter", tipo: "PF", ativo: false, banco: "Inter", personaId: "socioa", prestadorId: "" },
    { id: "c8", nome: "Conta Beltrana - Santander", tipo: "PF", ativo: true, banco: "Santander", personaId: "sociob", prestadorId: "" },
    { id: "c9", nome: "Conta Fulano Empresa", tipo: "PJ", ativo: true, banco: "Safra", personaId: "socioa", prestadorId: "" },
    { id: "c10", nome: "Conta de Outra Pessoa", tipo: "PF", ativo: true, banco: "Nubank", personaId: "socioa", prestadorId: "" },
  ],
  pix: [], repasses: [], hist: [],
};

console.log("1. Contas próprias do sócio");
const cs = contasProprias(ff, "socioa");
confere("ordem: Nubank, Caixa, depois as outras", cs.map((c) => c.id).join(",") === "c3,c2,c1", cs.map((c) => c.id).join(","));
confere("não entram: prestador, cartão, Pix rev., inativa, PJ, sem o nome do sócio", !cs.some((c) => ["c4", "c5", "c6", "c7", "c9", "c10"].includes(c.id)));
confere("não mistura sócio: a conta de outro sócio fica de fora", !cs.some((c) => c.id === "c8"));
confere("sem sócio: devolve as contas de todos", contasProprias(ff).length === 4);

console.log("2. Escolher a conta no destino do sócio");
const cpd = [{ id: "d1", nome: "Fulano", tipo: "FAMILIA", ativo: true, personaId: "socioa", banco: "" }, { id: "d2", nome: "Beltrana", tipo: "FAMILIA", ativo: true, personaId: "sociob", banco: "" }];
const lib = { rotuloDestino, rotuloPrestadorFamilia, nomePropio };
const rot = (d, c) => rotuloLeaf(d, cpd, lib, c || "");
const rd = resolverDestino(cpd[0], ff, rot, "c3");
confere("grava o sócio e a conta Nubank", rd.destino === "socio" && rd.personaId === "socioa" && rd.contaId === "c3", JSON.stringify(rd));
confere("nome no padrão: PF · Fulano · Nubank", rd.nome === "PF · Fulano · Nubank", rd.nome);
confere("Caixa também: PF · Fulano · Caixa", resolverDestino(cpd[0], ff, rot, "c2").nome === "PF · Fulano · Caixa");
confere("conta de outro sócio é recusada", !!resolverDestino(cpd[0], ff, rot, "c8").erro);
confere("conta de prestador é recusada", !!resolverDestino(cpd[0], ff, rot, "c4").erro);
confere("sem conta escolhida continua como antes (sem conta)", resolverDestino(cpd[0], ff, rot).contaId === "");

console.log("3. O Pix cai na caixa da conta (Família)");
const v = validarLancamento({ data: "2026-11-10", valor: 250, rev: "Maria da Silva", destino: rd.destino, personaId: rd.personaId, contaId: rd.contaId, destinoId: "d1", destinoNome: rd.nome }, "2026-11-21", []);
confere("o lançamento guarda a conta", v.item && v.item.contaId === "c3", JSON.stringify(v));
const r = espelharNaFamilia(ff, { personaId: rd.personaId, contaId: rd.contaId, data: "2026-11-10", valor: 250, origem: "Maria da Silva", por: "teste" });
confere("o Pix entra em ff.pix com a conta Nubank", r.ff && r.ff.pix.length === 1 && r.ff.pix[0].contaId === "c3" && r.ff.pix[0].personaId === "socioa", JSON.stringify(r.erro || r.ff.pix));
confere("conta própria não gera repasse a prestador", r.ff.repasses.length === 0);
confere("o original não foi alterado (cópia)", ff.pix.length === 0);

console.log(falhou ? "\n" + falhou + " FALHOU, " + ok + " ok" : "\nTUDO OK (" + ok + " verificações)");
process.exit(falhou ? 1 : 0);

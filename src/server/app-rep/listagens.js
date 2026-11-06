// Listagens do app da representante (05/11/2026; contrato 1.5 de sorelly-app/docs/app-representante/CONTRATOS.md).
// A listagem e o kit nascem no app (chaves l_ e k_ do módulo rpo); a equipe da montagem vê na tela Montagem › Listagens e grava o andamento (lx_, kx_).
// Regras iguais ao protótipo: 15 revendedoras por listagem em Curitiba, viagem sem limite (destino diferente de Curitiba), dia não pode ser passado,
// não repete representante + dia + horário + destino aberta, menos de 48 h para a retirada = "atrasado", no máximo 10 reposições por semana (segunda a domingo).
import { emTransacao, gravarItens, lerPrefixos, lerPrefixosCli } from "../estado-itens.js";
import { recusa, ehData, ehHora, ehId, texto, novoId, hojeSP } from "../servico.js";
import {
  LAPIDE, MAX_LISTAGEM, PRAZO_PEDIDO_HORAS, REPOSICOES_SEMANA, SEM_KIT, STATUS_TIRAR, TIPOS_KIT_APP,
  capacidade, ehViagem, horasAteRetirada, inicioSemana, listagemParaApp, montarKits, montarListagens, vivo,
} from "../../apps/montagem/domain/app-rep.js";

const PREFIXOS = ["l_", "lx_", "k_", "kx_", "ke_"];
const DIAS_CONCLUIDAS = 60;

function montar(rpo) { return { listagens: montarListagens(rpo), kits: montarKits(rpo) }; }
const daRep = (l, cod) => String(l.repCod || "") === String(cod);
const aberta = (l) => !l.fechada;

// GET: abertas + concluídas dos últimos 60 dias, com os kits
export async function listagensDaRep(rep) {
  const { listagens, kits } = montar(await lerPrefixos("rpo", PREFIXOS));
  const limite = Date.now() - DIAS_CONCLUIDAS * 86400000;
  return listagens
    .filter((l) => daRep(l, rep.cod) && (aberta(l) || (l.concluidaEm && new Date(l.concluidaEm).getTime() >= limite)))
    .sort((a, b) => String(a.data + a.horario).localeCompare(String(b.data + b.horario)))
    .map((l) => listagemParaApp(l, kits));
}

export async function criarListagem(rep, b) {
  const data = String(b.data || ""), horario = String(b.horario || "");
  if (!ehData(data)) throw recusa("Data inválida.", 422);
  if (!ehHora(horario)) throw recusa("Horário inválido.", 422);
  if (data < hojeSP()) throw recusa("Não dá para criar listagem em dia que já passou.", 422);
  const destino = texto(b.destino, 80) || "Curitiba";
  const viagem = ehViagem(destino, b.viagem === true);
  return emTransacao("rpo", async (cli) => {
    const { listagens } = montar(await lerPrefixosCli(cli, "rpo", PREFIXOS));
    const repetida = listagens.find((l) => daRep(l, rep.cod) && aberta(l) && l.data === data && l.horario === horario && String(l.destino || "Curitiba").toLowerCase() === destino.toLowerCase());
    if (repetida) throw recusa("Já existe uma listagem aberta neste dia, horário e destino.", 422);
    const id = novoId("LA");
    const l = { id, rep: rep.nome, repCod: rep.cod, destino, viagem, horario, data, fechada: false, retiradas: [], criadoEm: new Date().toISOString(), origem: "app" };
    await gravarItens("rpo", { ["l_" + id]: l }, "app", "app:" + rep.cod, cli);
    return listagemParaApp(l, []);
  });
}

export async function incluirRevendedora(rep, lid, b) {
  if (!ehId(lid)) throw recusa("Listagem não encontrada.", 404);
  const revendedoraId = Number(b.revendedoraId);
  if (!Number.isInteger(revendedoraId) || revendedoraId <= 0) throw recusa("Revendedora inválida.", 422);
  const nome = texto(b.nome, 120);
  if (!nome) throw recusa("Nome da revendedora obrigatório.", 422);
  const tipoKit = TIPOS_KIT_APP.includes(b.tipoKit) ? b.tipoKit : "acerto_kit";
  const horaAtend = b.horaAtendimento == null || b.horaAtendimento === "" ? null : String(b.horaAtendimento);
  if (horaAtend !== null && !ehHora(horaAtend)) throw recusa("Horário do atendimento inválido.", 422);
  return emTransacao("rpo", async (cli) => {
    const rpo = await lerPrefixosCli(cli, "rpo", PREFIXOS);
    const { listagens, kits } = montar(rpo);
    const l = listagens.find((x) => x.id === lid);
    if (!l || !daRep(l, rep.cod)) throw recusa("Listagem não encontrada.", 404);
    if (l.fechada) throw recusa("Essa listagem já foi concluída.", 422);
    const naLista = kits.filter((k) => k.lid === lid);
    if (naLista.length >= capacidade(l)) throw recusa(`Essa listagem já está cheia (${MAX_LISTAGEM} revendedoras).`, 422);
    const mesma = (k) => Number(k.revendedoraId) === revendedoraId;
    if (naLista.some(mesma)) throw recusa("Essa revendedora já está nesta listagem.", 422);
    const abertasRep = listagens.filter((x) => daRep(x, rep.cod) && aberta(x) && x.id !== lid).map((x) => x.id);
    if (kits.some((k) => mesma(k) && abertasRep.includes(k.lid) && !["retirado", "acertado"].includes(k.status))) throw recusa("Essa revendedora já está em outra listagem aberta.", 422);
    if (tipoKit === "reposicao") {
      const semana = inicioSemana(l.data);
      const lids = listagens.filter((x) => daRep(x, rep.cod) && inicioSemana(x.data) === semana).map((x) => x.id);
      const n = kits.filter((k) => k.tipoKit === "reposicao" && lids.includes(k.lid)).length;
      if (n >= REPOSICOES_SEMANA) throw recusa(`Limite de reposições da semana (${REPOSICOES_SEMANA}).`, 422);
    }
    const id = novoId("UA");
    const semKit = !!SEM_KIT[tipoKit];
    const k = {
      id, lid, rev: nome, bairro: texto(b.bairro, 120) || "—", endereco: null, prio: false, tipo: "ac_kit",
      vendas: [], valor: null, manual: false, defPor: null, defEm: null, pref: { aro: "", ouro: 0, evitar: null, enc: 0 },
      status: semKit ? "condicional" : "semvalor", designada: null, motivo: null, ajustes: 0,
      montId: null, iniM: null, fimM: null, pausaMs: 0, pausadoEm: null, tempoM: null, supId: null, supEm: null,
      bipId: null, iniB: null, fimB: null, valorReal: null, divReg: false, corrigido: false, retEm: null, retPor: null,
      ultimaHora: true, atrasado: horasAteRetirada(l) < PRAZO_PEDIDO_HORAS, aval: null,
      ordem: naLista.length + 1, tipoKit, fone: "", porApp: true, codRev: String(revendedoraId).padStart(6, "0"), revendedoraId,
      cond: { nums: [], pegas: false, chkM: {}, chkB: {}, faltas: {}, impressas: {}, novas: [] },
      horaAtend, regrasVersaoId: null, remarcacoes: 0, remarcacoesLista: [],
      origem: "app", repCod: rep.cod, rep: rep.nome, criadoEm: new Date().toISOString(),
    };
    await gravarItens("rpo", { ["k_" + id]: k }, "app", "app:" + rep.cod, cli);
    return listagemParaApp(l, kits.concat([k]));
  });
}

export async function tirarRevendedora(rep, lid, itemId) {
  if (!ehId(lid) || !ehId(itemId)) throw recusa("Kit não encontrado.", 404);
  return emTransacao("rpo", async (cli) => {
    const rpo = await lerPrefixosCli(cli, "rpo", PREFIXOS);
    const { listagens, kits } = montar(rpo);
    const l = listagens.find((x) => x.id === lid);
    if (!l || !daRep(l, rep.cod)) throw recusa("Listagem não encontrada.", 404);
    if (l.fechada) throw recusa("Essa listagem já foi concluída.", 422);
    const k = kits.find((x) => x.id === itemId && x.lid === lid);
    if (!k || !vivo(rpo["k_" + itemId])) throw recusa("Kit não encontrado.", 404);
    if (!STATUS_TIRAR[k.status]) throw recusa("A montagem desse kit já começou. Fale com a montagem para tirar.", 422);
    await gravarItens("rpo", { ["k_" + itemId]: LAPIDE("tirado pela representante") }, "app", "app:" + rep.cod, cli);
    return listagemParaApp(l, kits.filter((x) => x.id !== itemId));
  });
}

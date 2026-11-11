// Funcionárias da Sorelly que também são clientes (revendedoras) na DevMaster. Só leitura. Cache de 30 minutos.
// Fonte da verdade = RH (colaboradora ativa, de férias ou afastada; desligada NÃO conta). O cadastro da DevMaster não é alterado: a ligação é pelo CPF.
// Não usa o grupo "Funcionários" (0002) da DevMaster: em 11/11/2026 ele tinha 208 pessoas e só 63 estavam no RH (sócios, família, ex-funcionárias, "Consumidor Final").
// Devolve só código e nome da cliente; o CPF nunca sai do servidor.
import { consulta } from "@/server/db";
import * as dm from "@/server/devmaster2";

const TTL = 30 * 60 * 1000, G = globalThis;
const dig = (t) => String(t == null ? "" : t).replace(/\D/g, "");
const norm = (t) => String(t == null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const ATIVA = { ATIVO: 1, FERIAS: 1, AFASTADO: 1 };

async function montar() {
  const r = await consulta("select conteudo from sorelly.estado_modulo where modulo = 'rh'");
  const colab = (r.rows[0] && r.rows[0].conteudo && r.rows[0].conteudo.colab) || {};
  const ativas = Object.values(colab).filter((c) => c && ATIVA[c.status] && !c.deslig);
  const cpfs = [...new Set(ativas.map((c) => dig(c.cpf)).filter((d) => d.length === 11))];
  let achados = [];
  for (let i = 0; i < cpfs.length; i += 40) {
    const lote = cpfs.slice(i, i + 40);
    const x = await dm.consultarTabela("dmaam", { registros: 500, filtro: { aam_cpfcnpj: { in: lote } }, campos: ["aam_codigo", "aam_nome", "aam_cpfcnpj", "aam_situacao"] });
    achados = achados.concat(x.itens);
  }
  const codigos = {}, nomes = {}, lista = [];
  achados.forEach((c) => {
    const cod = String(c.aam_codigo || "").replace(/^0+/, "");
    if (!cod || codigos[cod]) return;
    codigos[cod] = true; const nome = String(c.aam_nome || "").trim(); if (norm(nome).split(" ").length >= 2) nomes[norm(nome)] = true;
    lista.push({ cod, nome });
  });
  lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  return { geradoEm: new Date().toISOString(), ativasNoRh: ativas.length, comCpf: cpfs.length, achadas: lista.length, codigos, nomes, lista };
}

export async function funcionariasAtivas({ forcar = false } = {}) {
  const c = (G.__sorellyFuncionarias = G.__sorellyFuncionarias || {});
  if (!forcar && c.dados && Date.now() - c.em < TTL) return c.dados;
  if (!c.lendo) c.lendo = montar().then((d) => { c.dados = d; c.em = Date.now(); return d; }).finally(() => { c.lendo = null; });
  return c.lendo;
}

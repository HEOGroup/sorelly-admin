// DevMaster → Kits novos (26/11/2026, pedido do Marcus): se a revendedora de um kit novo já tem condicional ABERTO na DevMaster (o kit foi montado e bipado),
// o Admin anexa o código da DevMaster e passa o kit para BIPADO sozinho. SÓ LÊ a DevMaster (API 2: dmaam clientes, dmafi condicionais).
// Regra do "kit ativo" (docs/DECISOES.md, 26/10/2026): condicional com afi_status "A". Para não confundir com kit antigo, só vale condicional emitido
// a partir de 3 dias antes da liberação (ou do cadastro) do kit novo. Casa a revendedora pelo NOME inteiro (sem acento); nome repetido = não mexe e lista.
// Só mexe em kit que ainda está em Cadastrada, Liberado ou Solicitado (nunca volta etapa, nunca mexe em Bipado, Entregue, Devolvido ou Cancelado).
// Grava no kndados com gravarModulo (travado) e refaz a conta com o que está guardado na hora. Liga o relógio com KITS_NOVOS_DEVMASTER=1.
import { todasAsPaginas } from "./devmaster2.js";
import { lerModulo } from "./app-rep/base.js";
import { gravarModulo } from "./estado-modulo.js";

const ANTES = ["cadastrada", "liberado", "solicitado"];
const norm = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
const ms = (t) => { const m = String(t || "").match(/(\d{4})-(\d{2})-(\d{2})/); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null; };
const iso = (t) => { const m = String(t || "").match(/(\d{4}-\d{2}-\d{2})/); return m ? m[1] : null; };

// Regra pura (testável): dado o kit, os clientes da DevMaster com o mesmo nome e os condicionais abertos de cada um, diz o que fazer.
export function decidir(kit, clientesDoNome, condicionaisPorCliente) {
  if (!ANTES.includes(kit.st)) return { acao: "ignora" };
  let cli = clientesDoNome;
  if (kit.dm && kit.dm.cod) cli = cli.filter((c) => String(c.aam_codigo) === String(kit.dm.cod)).length ? cli.filter((c) => String(c.aam_codigo) === String(kit.dm.cod)) : cli;
  if (!cli.length) return { acao: "sem-cadastro" };
  const ref = ms(kit.lib) || ms(kit.cad);
  const achados = [];
  for (const c of cli) for (const k of condicionaisPorCliente[String(c.aam_codigo)] || []) {
    const d = ms(k.afi_data);
    if (d && (!ref || d >= ref - 3 * 864e5)) achados.push({ cod: String(c.aam_codigo), cond: k.afi_codigo, data: iso(k.afi_data) });
  }
  if (!achados.length) return { acao: "sem-kit" };
  if (new Set(achados.map((a) => a.cod)).size > 1) return { acao: "duvida" };
  achados.sort((a, b) => (a.data < b.data ? -1 : 1));
  return { acao: "bipar", ...achados[0] };
}

let clientesCache = null;
async function clientesPorNome() {
  if (clientesCache && Date.now() - clientesCache.em < 3600000) return clientesCache.v;
  const todos = await todasAsPaginas("dmaam", { campos: ["aam_codigo", "aam_nome"] }, 400);
  const v = new Map();
  for (const c of todos) { const n = norm(c.aam_nome); if (!n) continue; if (!v.has(n)) v.set(n, []); v.get(n).push(c); }
  clientesCache = { v, em: Date.now() };
  return v;
}

async function condicionaisAbertos(codigos) {
  const por = {};
  for (let i = 0; i < codigos.length; i += 100) {
    const ls = await todasAsPaginas("dmafi", { filtro: { afi_status: "A", afi_cliente: { in: codigos.slice(i, i + 100) } }, campos: ["afi_codigo", "afi_cliente", "afi_data"] });
    for (const k of ls) (por[String(k.afi_cliente)] = por[String(k.afi_cliente)] || []).push(k);
  }
  return por;
}

// monta o que mudar em cada kit (só os campos novos); usado na simulação e dentro da trava de gravação
function plano(kn, porNome, condicionais, ate) {
  const chaves = {}, r = { bipados: 0, semCadastro: [], semKit: 0, duvida: [], exemplos: [] };
  for (const [chave, k] of Object.entries(kn)) {
    if (!chave.startsWith("r_") || !k || k.excluido) continue;
    const d = decidir(k, porNome.get(norm(k.nome)) || [], condicionais);
    if (d.acao === "sem-cadastro") r.semCadastro.push(k.nome);
    else if (d.acao === "sem-kit") r.semKit++;
    else if (d.acao === "duvida") r.duvida.push(k.nome);
    else if (d.acao === "bipar") {
      chaves[chave] = Object.assign({}, k, { st: "bipado", bip: d.data || ate, dm: Object.assign({}, k.dm || {}, { cod: d.cod, cond: d.cond }), bipAuto: "devmaster" });
      r.bipados++;
      if (r.exemplos.length < 12) r.exemplos.push({ nome: k.nome, de: k.st, cod: d.cod, cond: d.cond, data: d.data });
    }
  }
  return { chaves, resumo: r };
}

let rodando = false;
export async function sincronizarBipadoDevMaster({ simular = false } = {}) {
  const r = { em: new Date().toISOString(), bipados: 0, gravados: 0, erros: [] };
  if (rodando) { r.erros.push("Já está rodando."); return r; }
  rodando = true;
  try {
    const kn = await lerModulo("kndados");
    const candidatos = Object.values(kn).filter((k) => k && typeof k === "object" && k.nome && ANTES.includes(k.st) && !k.excluido);
    if (!candidatos.length) return r;
    const porNome = await clientesPorNome();
    const codigos = [...new Set(candidatos.flatMap((k) => (porNome.get(norm(k.nome)) || []).map((c) => String(c.aam_codigo))))];
    const cond = await condicionaisAbertos(codigos);
    const hoje = new Date().toISOString().slice(0, 10);
    const p = plano(kn, porNome, cond, hoje);
    Object.assign(r, p.resumo);
    if (simular || !Object.keys(p.chaves).length) return r;
    r.versao = await gravarModulo("kndados", p.chaves, "chaves", "devmaster", (guardado) => {
      const de2 = plano(guardado, porNome, cond, hoje);
      r.gravados = Object.keys(de2.chaves).length;
      return Object.assign({}, guardado, de2.chaves);
    });
  } catch (e) {
    r.erros.push(e.message);
  } finally {
    rodando = false;
  }
  globalThis.__kitsDmUltima = r;
  return r;
}

// relógio do servidor: a cada 10 minutos, só com KITS_NOVOS_DEVMASTER=1
export function agendarBipadoDevMaster() {
  if (process.env.KITS_NOVOS_DEVMASTER !== "1" || globalThis.__kitsDmRelogio) return;
  globalThis.__kitsDmRelogio = setInterval(() => { sincronizarBipadoDevMaster().catch((e) => console.error("[kits-devmaster]", e)); }, 600000);
  setTimeout(() => sincronizarBipadoDevMaster().catch(() => {}), 15000);
}

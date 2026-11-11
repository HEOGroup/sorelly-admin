export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Busca de CLIENTES cadastradas na DevMaster (tabela dmaam), por nome ou por código. Leitura somente.
// Usada pelo botão "Incluir cliente" do Atendimento interno (Tamara, 09/11/2026): o nome da cliente tem que vir do cadastro, não de texto livre.
//   GET /api/clientes-busca?q=bruna leticia   (mínimo 3 letras)   ou   ?q=9472 (só números = código)
// Quem pode: a Diretoria e o setor Agendamento. Devolve no máximo 15 clientes (ativas primeiro), com código, nome, cidade, celular e situação.
import { erro, json, rota } from "@/server/http";
import { consultarTabela } from "@/server/devmaster2";
import { municipios, nomeNormal } from "@/server/revendedoras";

const CAMPOS = ["aam_codigo", "aam_nome", "aam_municipio", "aam_estado", "aam_celular", "aam_whatsapp", "aam_situacao"];
const semAcento = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "");

export const GET = rota(async (req, { eu, url }) => {
  if (eu.perfil !== "ADMIN" && !(eu.setores || []).some((x) => x === "agendamento" || x === "montagem")) return erro("Só a Diretoria, o Agendamento e a Montagem podem fazer isso.", 403);   // a Montagem inclui as meninas do atendimento (11/11/2026)
  const q = String(url.searchParams.get("q") || "").trim().slice(0, 80);
  if (!q) return json({ itens: [] });
  const soNumeros = /^\d+$/.test(q);
  if (!soNumeros && q.length < 3) return json({ itens: [] });
  // A DevMaster guarda o nome em MAIÚSCULAS e o "like" diferencia maiúscula de minúscula
  const filtro = soNumeros ? { aam_codigo: q.padStart(6, "0") } : { aam_nome: { like: "%" + semAcento(q).toUpperCase().replace(/[%_]/g, "") + "%" } };
  const r = await consultarTabela("dmaam", { registros: 30, campos: CAMPOS, ordem: "aam_nome", filtro });
  // Quem está ativa vem primeiro; inativa e bloqueada também aparecem (a cliente pode voltar depois de um tempo), com a situação escrita
  const ordem = { A: 0, B: 1, I: 2 };
  const lista = r.itens.slice().sort((a, b) => (ordem[a.aam_situacao] ?? 3) - (ordem[b.aam_situacao] ?? 3)).slice(0, 15);
  const mun = await municipios(lista.map((p) => String(p.aam_municipio || "")));
  return json({
    itens: lista.map((p) => {
      const m = mun.get(String(p.aam_municipio || "")) || {};
      return { cod: p.aam_codigo, nome: nomeNormal(p.aam_nome), cidade: m.nome || "", uf: m.uf || String(p.aam_estado || "").toUpperCase(), celular: p.aam_celular || p.aam_whatsapp || "", situacao: p.aam_situacao === "A" ? "Ativa" : p.aam_situacao === "B" ? "Bloqueada" : "Inativa" };
    }),
  });
});

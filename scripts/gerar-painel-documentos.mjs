// Sorelly Admin · scripts/gerar-painel-documentos.mjs
// Gera docs/Painel de documentos.html: abas por setor, leitura do documento já formatado e busca em todos os documentos.
// Rodar de novo sempre que os documentos mudarem: node scripts/gerar-painel-documentos.mjs
// SEGURANÇA: o painel vai para o Git (repositório público). Arquivos .local NUNCA entram no conteúdo: aparecem só como link.
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
const DOCS = path.join(RAIZ, "docs");
const ler = (p) => fs.readFileSync(p, "utf8");
const existe = (p) => fs.existsSync(p);
const rel = (abs) => path.relative(DOCS, abs).split(path.sep).join("/");
const ehLocal = (p) => /\.local\./.test(path.basename(p));

const BONITO = {
  "RESULTADO-DO-MES": "Resultado do mês", "FLUXO-DE-PAGAMENTOS": "Fluxo de pagamentos", "RELATORIO-DE-CUSTOS": "Relatório de custos",
  "CAIXA-FINANCEIRO": "Caixa do financeiro", "LINK-DE-PAGAMENTO": "Link de pagamento", "REGRAS-DE-PIX": "Regras do Pix",
  "FATURAMENTO-DIARIO": "Faturamento diário", "ALINHAMENTOS-FINANCEIRO-28-10-2026": "Alinhamentos do financeiro (28/10)",
  "JURIDICO-COBRANCA": "Jurídico e cobrança", "REVENDEDORAS-E-PREVISAO": "Revendedoras e previsão", "MEDIA-DE-VENDAS": "Média de vendas",
  "CONTEXTO-REPRESENTANTES": "Contexto das representantes", "ANALISE-FLUXO-REPRESENTANTE-01-11-2026": "Análise do fluxo da representante (01/11)",
  "REGISTRO-DE-CONTATOS-ANALISE": "Análise do registro de contatos", "KIT-PERFEITO": "Kit perfeito", "CONDICIONAL-TERMO-E-NOTA": "Condicional: termo e nota",
  "FLUXO-DE-COMPRA-DE-BRUTO": "Fluxo de compra de bruto", "ENCOMENDAS-REPOSICOES": "Encomendas e reposições",
  "ACESSOS-E-CONTAS-28-10-2026": "Acessos e contas (28/10)", "CONTAS-E-SENHAS-28-10-2026": "Contas e senhas (28/10)",
  "FLUXO-DA-EMPRESA": "Fluxo da empresa", "SORELLY-CONTEXTO": "Contexto geral da Sorelly", "INTEGRACAO-ENTRE-SETORES": "Integração entre setores",
  "CONTEXTO-29-10-2026-CONTAS-AGENDAMENTO-CHAT": "Contexto de 29/10: contas, agendamento e chat",
  "CONTEXTO-28-10-2026-ACESSOS-E-FINANCEIRO": "Contexto de 28/10: acessos e financeiro",
  "PADRAO-VISUAL": "Padrão visual", "GUIA-DE-ESCRITA-E-TIPOGRAFIA": "Guia de escrita e fontes", "DESIGN-SYSTEM-ESTUDO": "Estudo do design system (resumo)",
  "DESIGN-SYSTEM-ESTUDO-COMPLETO": "Estudo do design system (completo)", "DECISOES": "Diário de decisões (completo)", "ARQUITETURA": "Como o sistema é montado",
  "COMO-LER-OS-NOMES": "Como ler os nomes dos arquivos", "README": "Índice dos documentos", "PLANO-DE-ORGANIZACAO": "Plano de organização",
  "API-LEITURA": "API do app Sorelly (leitura)", "PROMPT-MESTRE": "Prompt mestre", "SUBIR-O-SISTEMA": "Como subir o sistema",
  "tirar-financeiro-da-devmaster": "Tirar o financeiro da DevMaster", "sistema-completo-custos-e-dre": "Sistema completo: custos, markup e DRE",
  "substituir-o-admin-antigo": "Substituir o admin antigo", "kit-perfeito": "Kit perfeito (ideia e situação)", "visual-e-design-system": "Visual e design system",
  "entregas-por-motoboy": "Entregas por motoboy", "sistema-pessoal-do-marcus": "Sistema pessoal do Marcus", "crm-ademicon": "CRM da Ademicon", "zenity-app": "Zenity App",
};
function nome(p) {
  const b = path.basename(p).replace(/\.local\.md$|\.md$|\.html$|\.pdf$/i, "");
  const fim = ehLocal(p) ? " (dados reais)" : "";
  if (BONITO[b]) return BONITO[b] + fim;
  const t = b.replace(/[-_]+/g, " ").toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1) + fim;
}
const SETOR_NEGOCIO = {
  financeiro: /RESULTADO-DO-MES|FLUXO-DE-PAGAMENTOS|RELATORIO-DE-CUSTOS|CAIXA-FINANCEIRO|LINK-DE-PAGAMENTO|REGRAS-DE-PIX|FATURAMENTO-DIARIO|ALINHAMENTOS-FINANCEIRO|JURIDICO-COBRANCA/,
  agendamento: /REVENDEDORAS-E-PREVISAO|MEDIA-DE-VENDAS/, representantes: /CONTEXTO-REPRESENTANTES|ANALISE-FLUXO-REPRESENTANTE|REGISTRO-DE-CONTATOS/,
  "montagem-e-kits": /KIT-PERFEITO|CONDICIONAL/, "materiais-e-estoque": /FLUXO-DE-COMPRA-DE-BRUTO/, "encomendas-e-reposicoes": /ENCOMENDAS-REPOSICOES/,
  rh: /ACESSOS-E-CONTAS|CONTAS-E-SENHAS/, sorellychat: /CONTEXTO-29-10/, diretoria: /FLUXO-DA-EMPRESA|SORELLY-CONTEXTO|INTEGRACAO-ENTRE-SETORES/,
  juridico: /JURIDICO-COBRANCA/, revendedoras: /REVENDEDORAS-E-PREVISAO/, "cadastro-de-revendedoras": /REGISTRO-DE-CONTATOS/,
};
const IDEIAS_SETOR = { financeiro: ["tirar-financeiro-da-devmaster", "sistema-completo-custos-e-dre"], "montagem-e-kits": ["kit-perfeito"], tecnologia: ["visual-e-design-system", "substituir-o-admin-antigo"], diretoria: ["sistema-pessoal-do-marcus"] };
const NOME_SETOR = { financeiro: "Financeiro", agendamento: "Agendamento", representantes: "Representantes", "montagem-e-kits": "Montagem e Kits", "materiais-e-estoque": "Materiais e estoque", "encomendas-e-reposicoes": "Encomendas e reposições", rh: "RH", sorellychat: "SorellyChat", diretoria: "Diretoria", "atendimento-interno": "Atendimento interno", "cadastro-de-revendedoras": "Cadastro de revendedoras", revendedoras: "Revendedoras", tecnologia: "Tecnologia", geral: "Geral", marketing: "Marketing", garantia: "Garantia", juridico: "Jurídico", "seguranca-e-limpeza": "Segurança e limpeza" };
const ORDEM = ["financeiro", "agendamento", "representantes", "montagem-e-kits", "atendimento-interno", "cadastro-de-revendedoras", "revendedoras", "materiais-e-estoque", "encomendas-e-reposicoes", "rh", "sorellychat", "diretoria", "tecnologia", "marketing", "garantia", "juridico", "seguranca-e-limpeza", "geral"];

const conteudo = {}; // caminho relativo a docs -> texto (só arquivos que NÃO são .local)
function item(abs, tipo, titulo) {
  if (!existe(abs)) return null;
  const p = rel(abs), local = ehLocal(abs), md = /\.md$/i.test(abs);
  if (md && !local) conteudo[p] = ler(abs);
  return { t: titulo || nome(abs), p, k: tipo, l: local, md: md && !local };
}
const contar = (abs, re) => (existe(abs) ? (ler(abs).match(re) || []).length : 0);

const abas = [];
// Início
const inicio = [
  item(path.join(DOCS, "PLANO-DE-ORGANIZACAO.md"), "Comece aqui"), item(path.join(DOCS, "negocio", "INTEGRACAO-ENTRE-SETORES.md"), "Comece aqui"),
  item(path.join(DOCS, "COMO-LER-OS-NOMES.md"), "Comece aqui"), item(path.join(DOCS, "ideias", "README.md"), "Ideias", "Ideias e projetos"),
  item(path.join(RAIZ, "CLAUDE.md"), "Regras do projeto", "Regras para o Claude (CLAUDE.md)"), item(path.join(RAIZ, "README.md"), "Regras do projeto", "Mapa do projeto (README)"),
  item(path.join(DOCS, "DECISOES.md"), "Decisões"), item(path.join(DOCS, "README.md"), "Guia"), item(path.join(DOCS, "ARQUITETURA.md"), "Guia"),
  item(path.join(DOCS, "historico", "LEIA-ME.md"), "Guia", "Histórico (fotos de um dia)"), item(path.join(DOCS, "rascunhos", "LEIA-ME.md"), "Guia", "Rascunhos por assunto"),
].filter(Boolean);
abas.push({ id: "inicio", nome: "Início", itens: inicio });
// Setores
const resumo = [];
for (const id of ORDEM) {
  const dir = path.join(DOCS, "setores", id); if (!existe(dir)) continue;
  const its = [];
  const le = item(path.join(dir, "LEIA-ME.md"), "Resumo", "Resumo do setor"); if (le) its.push(le);
  // dois formatos: os setores gerados usam "## data" e "- [ ]"; Representantes (pasta piloto) usa "- **data**" e tabela "| 1 |"
  const nd = contar(path.join(dir, "decisoes.md"), /^## |^- \*\*\d/gm), np = contar(path.join(dir, "pendencias.md"), /^- \[ \]|^\| \d+ \|/gm);
  const de = item(path.join(dir, "decisoes.md"), "Decisões", `Decisões do setor (${nd})`); if (de) its.push(de);
  const pe = item(path.join(dir, "pendencias.md"), "Pendências", `O que falta fazer (${np})`); if (pe) its.push(pe);
  for (const f of fs.readdirSync(dir)) { if (/^(LEIA-ME|decisoes|pendencias)\.md$/.test(f)) continue; const x = item(path.join(dir, f), /pessoas/.test(f) ? "Pessoas" : "Regras do negócio", /pessoas/.test(f) ? "Pessoas do setor" : null); if (x) its.push(x); }
  if (SETOR_NEGOCIO[id]) for (const f of fs.readdirSync(path.join(DOCS, "negocio")).sort()) if (SETOR_NEGOCIO[id].test(f)) { const x = item(path.join(DOCS, "negocio", f), "Regras do negócio"); if (x) its.push(x); }
  if (id === "tecnologia") for (const f of ["design/PADRAO-VISUAL.md", "design/GUIA-DE-ESCRITA-E-TIPOGRAFIA.md", "design/DESIGN-SYSTEM-ESTUDO.md", "ARQUITETURA.md", "operacao/SUBIR-O-SISTEMA.md", "app-sorelly/API-LEITURA.md", "prompts/PROMPT-MESTRE.md"]) { const x = item(path.join(DOCS, f), "Regras do negócio"); if (x) its.push(x); }
  for (const i of IDEIAS_SETOR[id] || []) { const x = item(path.join(DOCS, "ideias", i + ".md"), "Ideias"); if (x) its.push(x); }
  abas.push({ id, nome: NOME_SETOR[id] || id, itens: its, nd, np });
  resumo.push({ id, nome: NOME_SETOR[id] || id, nd, np });
}
// Ideias
const ideias = fs.readdirSync(path.join(DOCS, "ideias")).filter((f) => f.endsWith(".md") && f !== "README.md").map((f) => item(path.join(DOCS, "ideias", f), "Ideias")).filter(Boolean);
abas.push({ id: "ideias", nome: "Ideias", itens: [item(path.join(DOCS, "ideias", "README.md"), "Ideias", "Lista das ideias e situação"), ...ideias].filter(Boolean) });

const DADOS = { abas, conteudo, resumo, gerado: new Date().toLocaleString("pt-BR") };
const json = JSON.stringify(DADOS).replace(/</g, "\\u003c");
const html = fs.readFileSync(path.join(RAIZ, "scripts", "painel-documentos.modelo.html"), "utf8").replace("/*__DADOS__*/null", () => json); // função: o texto dos documentos tem "$" e não pode virar padrão de troca
fs.writeFileSync(path.join(DOCS, "Painel de documentos.html"), html, "utf8");
const locais = Object.keys(conteudo).filter((p) => /\.local\./.test(p));
console.log(`Painel gerado: ${abas.length} abas, ${abas.reduce((s, a) => s + a.itens.length, 0)} itens, ${Object.keys(conteudo).length} documentos para leitura, ${(html.length / 1024).toFixed(0)} KB. Arquivos .local no conteúdo: ${locais.length}.`);

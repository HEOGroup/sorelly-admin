# Documentação

Tudo o que explica o negócio, o padrão visual e as decisões do sistema. O código explica o *como*; aqui fica o *porquê*.

**Para olhar tudo de uma vez:** abra [`Painel de documentos.html`](Painel%20de%20documentos.html) (setores na lateral, leitura do documento já formatado e busca em todos os documentos). Mudou algum documento? Rode `node scripts/gerar-painel-documentos.mjs` para atualizar o painel. O que falta organizar e em que ordem: [`PLANO-DE-ORGANIZACAO.md`](PLANO-DE-ORGANIZACAO.md). Como ler os nomes dos arquivos: [`COMO-LER-OS-NOMES.md`](COMO-LER-OS-NOMES.md).

| Pasta / arquivo | O que tem |
|---|---|
| [`DECISOES.md`](DECISOES.md) | Diário de decisões (mais recente no topo). Toda decisão nova entra aqui E na pasta do setor, no mesmo dia. |
| [`setores/`](setores/) | **Uma pasta por setor (17 + Geral)**: `LEIA-ME.md` (o que é, quem, telas, recebe de, entrega para, regras), `decisoes.md`, `pendencias.md` e, no RH e em Representantes, `pessoas.local.md` (fora do Git). Leia o `LEIA-ME.md` do setor primeiro. |
| [`ideias/`](ideias/) | Uma ideia por arquivo, com a situação (só ideia, planejado, em andamento, pausado). |
| [`negocio/`](negocio/) | Regras e fluxos da empresa, um arquivo por assunto. Comece por `INTEGRACAO-ENTRE-SETORES.md` (quem recebe o quê de quem). |
| [`historico/`](historico/) | "Fotos de um dia": contextos e investigações que já não valem como regra atual. |
| [`dados-locais/`](dados-locais/) | Dados reais só deste PC (financeiro, revendedoras, acessos, pessoal). Fora do Git. |
| [`rascunhos/`](rascunhos/) | Desenhos feitos nas conversas, separados por assunto. Não são telas do sistema. |
| [`negocio/arquivos/`](negocio/arquivos/) | PDFs de referência (apresentação da empresa, guia do app da representante, comissões e brindes). |
| [`design/`](design/) | Padrão visual obrigatório, estudo de design system, guia de escrita e diagramas. |
| [`prompts/`](prompts/) | Prompts usados para gerar sistemas e módulos (o `PROMPT-MESTRE.md` aparece na tela Tecnologia → Padrão visual). |
| [`operacao/`](operacao/) | Como subir o sistema para a equipe (servidor, banco, pessoas, fases). |
| [`devmaster/`](devmaster/) | Spec OpenAPI da API 2 do DevMaster (ERP): tabelas, fotos e relatórios (`DEVMASTER_API_URL_V2`). |
| [`app-sorelly/`](app-sorelly/) | Guia da API de leitura do backend do app Sorelly (revendedora/representante): login, rotas GET, respostas e variáveis de ambiente. |

## Negócio (`negocio/`)

| Arquivo | Assunto |
|---|---|
| `SORELLY-CONTEXTO.md` | Visão geral da empresa e do modelo de consignação. |
| `FLUXO-DA-EMPRESA.md` | Setores, pessoas, acessos e o caminho da revendedora (fonte da verdade). |
| `CONTEXTO-REPRESENTANTES.md` | Como funcionam as representantes e os acertos. |
| `FLUXO-DE-PAGAMENTOS.md` | Para onde vai cada Pix; controle de pagamentos. |
| `REGRAS-DE-PIX.md` | Regras das chaves Pix. |
| `CAIXA-FINANCEIRO.md` | Saldos e caixa. |
| `REVENDEDORAS-E-PREVISAO.md` | Lógica de quantas revendedoras fazem acerto em cada mês (data prevista na DevMaster, ciclo 30/45/60, meta 98%, janeiro), previsão de entrada e o bug dos previstos (27/10/2026). Onde achar cada assunto do dinheiro. |
| `RESULTADO-DO-MES.md` | Contas a receber, resultado efetivo do mês, regras de acerto - loja e funcionárias, fontes do DevMaster e do admin antigo, função de cada aba do Financeiro (27/10/2026). Os números reais ficam em `RESULTADO-DO-MES.local.md` (fora do Git). |
| `FATURAMENTO-DIARIO.md` | Registro diário do faturamento passado pelo Marcus. |
| `RELATORIO-DE-CUSTOS.md` | Regras travadas da Análise de custos. |
| `LINK-DE-PAGAMENTO.md` | Link de pagamento e maquininhas. |
| `ENCOMENDAS-REPOSICOES.md` | Encomendas e reposições. |
| `JURIDICO-COBRANCA.md` | Jurídico e cobrança. |

## Design (`design/`)

| Arquivo | Assunto |
|---|---|
| `PADRAO-VISUAL.md` | **Obrigatório** antes de criar ou mexer em tela. |
| `GUIA-DE-ESCRITA-E-TIPOGRAFIA.md` | Como escrever títulos, botões e avisos; fontes. |
| `DESIGN-SYSTEM-ESTUDO.md` / `DESIGN-SYSTEM-ESTUDO-COMPLETO.md` | Estudo de design system (regras propostas). |
| `testes-de-layout/` | Desenhos HTML para escolher layout (versões A, B, C...). |
| `diagramas-guia/` | Diagramas SVG usados no guia do app da representante. |

- `negocio/REGRA-CANCELAMENTO-E-REMARCACAO.md`: regra de cancelamento e remarcação com prazo de 5 dias úteis (10/11/2026, ainda não construída).
- `negocio/PENDENCIAS-REGRAS-E-COMISSOES.md`: lista única do que falta definir em regras e comissões.

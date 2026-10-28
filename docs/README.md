# Documentação

Tudo o que explica o negócio, o padrão visual e as decisões do sistema. O código explica o *como*; aqui fica o *porquê*.

| Pasta / arquivo | O que tem |
|---|---|
| [`DECISOES.md`](DECISOES.md) | Diário de decisões (mais recente no topo). Toda decisão nova entra aqui no mesmo dia. |
| [`negocio/`](negocio/) | Regras e fluxos da empresa, um arquivo por assunto. |
| [`negocio/arquivos/`](negocio/arquivos/) | PDFs de referência (apresentação da empresa, guia do app da representante, comissões e brindes). |
| [`design/`](design/) | Padrão visual obrigatório, estudo de design system, guia de escrita e diagramas. |
| [`prompts/`](prompts/) | Prompts usados para gerar sistemas e módulos (o `PROMPT-MESTRE.md` aparece na tela Tecnologia → Padrão visual). |
| [`operacao/`](operacao/) | Como subir o sistema para a equipe (servidor, banco, pessoas, fases). |
| [`devmaster/`](devmaster/) | Spec OpenAPI da API 2 do DevMaster (ERP): tabelas, fotos e relatórios (`DEVMASTER_API_URL_V2`). |

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
| `diagramas-guia/` | Diagramas SVG usados no guia do app da representante. |

# docs/: roteador (25/11/2026). Leia SÓ a linha do assunto em que você trabalha.

Regra: assunto de fornecedor NÃO lê regra de comissão. Cada assunto tem 3 arquivos: REGRA (vale hoje), PENDÊNCIAS (aberto, não alinhado, duplicado) e FICHAS (pessoas/fornecedores).
Pendências e fichas terminam em `.local.md` (dados reais, fora do Git). Regras não têm dado real.

| Assunto | REGRA (ler primeiro) | PENDÊNCIAS | FICHAS |
|---|---|---|---|
| Acerto, comissão, brinde, Kit Padrão e Prata, atraso | `regras/REPRESENTANTES-E-COMISSOES.md` | `pendencias/representantes.local.md` | `pessoas/` |
| Inadimplência, Jurídico, nota promissória | `regras/INADIMPLENCIA-E-JURIDICO.md` | `pendencias/representantes.local.md` | |
| Listagens, montagem, bipagem, condicionais | `regras/LISTAGENS-E-MONTAGEM.md` | `pendencias/representantes.local.md` | |
| Fornecedores, bruto, banho, negociações, limite mensal | `regras/FORNECEDORES-E-COMPRAS.md` | `pendencias/fornecedores.local.md` | `fornecedores/<nome>.local.md` |
| Contas a pagar e a receber, Direcionar, caixa, DevMaster, maquininha, link | `regras/FINANCEIRO-CONTAS-E-DIRECIONAR.md` | `pendencias/financeiro.local.md` | |
| Conta, chave Pix, destino, "Escrever na folha", numerário da DevMaster, Pix prestador ou representante (LER SEMPRE ao mexer em conta ou pagamento) | `regras/NUMERARIOS-ADMIN-X-DEVMASTER.md` | `pendencias/financeiro.local.md` | |
| Fiscal, ILF, CNPJs do grupo | `regras/FISCAL-E-CNPJS.md` | `pendencias/financeiro.local.md` | |
| Faturamento diário e previsão | `regras/FATURAMENTO-E-PREVISAO.md` | `pendencias/financeiro.local.md` | |
| Família, sócios, casas, cartões | `regras/FINANCEIRO-FAMILIAR.md` | `pendencias/familia.local.md` | `pessoas/` |
| RH, folha, horas extras, bônus, acessos, NR-1 | `regras/RH-E-FUNCIONARIOS.md` | `pendencias/rh.local.md` | `pessoas/<nome>.local.md` |
| Cadastro de peças, produção, premiação, material gráfico, estoque | `regras/PRODUCAO-E-CADASTRO-DE-PECAS.md` | `pendencias/producao-e-pecas.local.md` | |
| Encomendas, expositores, Top 100 | `regras/ENCOMENDAS-EXPOSITORES-TOP100.md` | `pendencias/encomendas-e-kits-novos.local.md` | |
| Metas das revendedoras | `regras/METAS-REVENDEDORAS.md` | `pendencias/encomendas-e-kits-novos.local.md` | |
| Kits novos, indicações | `regras/KITS-NOVOS-E-INDICACOES.md` | `pendencias/encomendas-e-kits-novos.local.md` | |
| Marketing, cadastro de revendedoras, Kommo, chamados | `regras/MARKETING-E-CADASTRO-REVENDEDORAS.md` | `pendencias/marketing-e-cadastro.local.md` | |
| Apps da representante e da revendedora (celular) | `regras/REPRESENTANTES-E-COMISSOES.md` (seção 6.1) · `app-sorelly/` (API e integração) · `MAPA-DE-DEPENDENCIAS.md` (linhas dos apps) | `pendencias/representantes.local.md` | Estoque compartilhado entre revendedoras = IDEIA não aprovada (`ESTRATEGIA.local.md`) |
| Padrão visual das telas | `design/PADRAO-VISUAL.md` | | |
| Decisões por data (diário) | `DECISOES.md` (só buscar com Grep) | | |
| Achar uma tela ou saber se já existe | `MAPA-DE-TELAS.md` | | |
| O que mais é afetado por uma mudança | `MAPA-DE-DEPENDENCIAS.md` | | |
| **O que importa agora (P0 a P4) e decisões do Marcus** | | `pendencias/PRIORIDADES.local.md` | |
| Estratégia, objetivo central, recuperação financeira | `ESTRATEGIA.local.md` · `regras/FINANCEIRO-MAPA-DE-CONTROLE.md` | `pendencias/recuperacao-financeira.local.md` | |
| DevMaster, app Sorelly, Kommo: tabelas, campos, cruzamento, armadilhas | `regras/DEVMASTER-E-INTEGRACOES.md` | `pendencias/devmaster-e-integracoes.local.md` | |
| Peças oficiais, trava e pendências de visual | `design/PADRAO-VISUAL.md` | `pendencias/design-system.local.md` | |
| Decisão antiga que não está na regra | Grep em `C:\Sorelly\historico-conversas` (índice `INDICE.md`; atualizar: `node scripts/historico-extrair.mjs`) | | |
| Quem está mexendo em quê (outras conversas) | `EM-ANDAMENTO.local.md` | | |
| Hooks, skills, memória, custo de contexto | `operacao/INFRA-DE-IA.md` | | |

## Aviso sobre as marcações
As regras foram escritas em 25/11/2026 a partir das mensagens do Marcus e conferidas no código da PASTA LOCAL, que nesse dia estava 124 commits atrás da master em parte dos arquivos. [FEITO] quer dizer "existe no código lido", sem teste. Em regra de dinheiro, confira no código atual antes de afirmar. Correções já conferidas contra a master estão em `pendencias/PRIORIDADES.local.md` (seções "Resolvido" e "Agente anterior errou").

## Pastas
- `regras/` regra vigente por assunto (fonte única).
- `pendencias/` o que está aberto, o que não bate, o que está duplicado.
- `fornecedores/`, `pessoas/` uma ficha por fornecedor e por pessoa.
- `setores/<setor>/` LEIA-ME, decisões e pendências antigas do setor (ainda valem para histórico; a regra nova vence).
- `negocio/` documentos de negócio antigos e detalhados (ler só se a REGRA mandar).
- `arquivo/` passado. NUNCA ler, salvo pedido.
- `operacao/` servidor, publicação e incidentes.

## Como manter
1. Marcus decidiu algo? Mude o arquivo REGRA do assunto no mesmo dia e acrescente a data em `DECISOES.md`.
2. Pendência nova? Entra no arquivo de PENDÊNCIAS do assunto.
3. Achou regra diferente em dois lugares? Registre em "Não alinhado" do assunto. O código mostra o que o sistema faz e pode estar errado: regra e código divergem? Não escolha um lado sozinho: registre em "Não alinhado" e, em dinheiro, jurídico, fiscal, trabalhista ou acesso, pergunte ao Marcus.
4. Conversa nova: leia só a linha do seu assunto.

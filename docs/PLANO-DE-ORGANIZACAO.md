# Plano de organização (análise de 02/11/2026)

Pedido do Marcus: "organizar de uma vez tudo: todos os setores, ideias, tudo". Esta é a análise completa do que existe, do que está bagunçado e da ordem para resolver. Cada item diz **quem faz** e **o risco**.

## 1. O que já foi feito (01 e 02/11/2026)
| Item | Onde |
|---|---|
| PC organizado: projetos, fotos, segurança | `C:\Projetos`, `C:\Fotos Marcus`, `C:\Arquivos` (mapa em `C:\Projetos\LEIA-ME.md`) |
| Pasta de entrada do admin com nomes claros | `C:\Projetos\Sorelly Admin` |
| Painel de documentos com abas por setor | `docs/Painel de documentos.html` |
| 17 pastas de setor com decisões e pendências | `docs/setores/` |
| RH com uma linha por funcionário (70, só neste PC) | `docs/setores/rh/pessoas.local.md` |
| Mapa de integração entre setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |
| Dados reais soltos tirados da raiz | `docs/dados-locais/` |
| Testes de layout separados | `docs/design/testes-de-layout/` |
| Guia dos nomes de arquivo | `docs/COMO-LER-OS-NOMES.md` |

## 2. O que ainda está bagunçado (achados)

### A. Documentos
| # | Achado | Número | Efeito |
|---|---|---|---|
| A1 | **`CLAUDE.md` gigante**: a seção "Setores do menu" sozinha tem 16.500 letras | 38 KB, 136 linhas | O Claude lê isso em TODA conversa. Gasta mais e mistura assuntos |
| A2 | **Diário único enorme** | `DECISOES.md` com 353 KB e 1.500 linhas | Difícil de achar decisão; já tem cópia por setor |
| A3 | **Resumo dos setores (LEIA-ME) é só um esqueleto** | 17 setores | O texto bom está no `CLAUDE.md`, não na pasta do setor |
| A4 | **Pendências com ruído** | 209 itens | Parte já foi feita; o diário não marca o que terminou |
| A5 | **"Fotos de um dia" em negócio** | 9 documentos com data no nome (28/10, 29/10, 01/11) | Viraram história; o assunto atual está em outro lugar |
| A6 | **Rascunhos sem dono** | 67 arquivos (53 HTML) em `docs/rascunhos`: revendedoras 15, login 9, card 5, melhorias 5, apps 4... | Não se sabe o que foi aprovado e o que foi descartado |
| A7 | **Índice dos documentos desatualizado** | `docs/README.md` não cita o Painel, a integração nem os dados locais | Quem chega se perde |
| A8 | Pastas de setor x menu do sistema não batem | Menu tem Link de pagamento e Cadastro de peças; docs têm SorellyChat, Tecnologia, Diretoria | Dois jeitos de dividir a empresa |

### B. Ideias e projetos soltos
| # | Ideia | Onde está hoje | Situação |
|---|---|---|---|
| B1 | Entregas por motoboy (1.400 revendedoras em Curitiba) | Só na memória do Claude + 2 rascunhos | Só visão |
| B2 | Sistema completo com custos, markup, CMV e DRE | Só na memória do Claude | Meta de 3 a 4 meses |
| B3 | Tirar o financeiro da DevMaster | Só na memória do Claude | Objetivo |
| B4 | Kit perfeito | `docs/negocio/KIT-PERFEITO.md` | Desenho escolhido (layout A) |
| B5 | Substituir o admin antigo (o que falta para ir ao ar) | Só na memória do Claude | Em andamento |
| B6 | CRM para consórcio (Ademicon) | Memória + `C:\Projetos\ademicon-gestao` | Protótipo, sem continuação |
| B7 | Zenity App | `C:\Projetos\zenity-app` | Projeto próprio, organizado |
**Problema:** se não estiver num arquivo do projeto, a ideia só existe na memória deste PC.

### C. Código e ferramentas
| # | Achado | Número |
|---|---|---|
| C1 | Scripts usados uma vez só, misturados com os do dia a dia | 25 de 42 (criar conta 12, liberar acesso 8, migrar 4, corrigir 1) |
| C2 | Área pessoal do Marcus dentro do sistema da empresa | 8 telas `marcus*` no menu | A memória diz: assuntos pessoais ficam no sistema "Marcus", nunca no Admin |
| C3 | Regras detalhadas grandes dentro do código | `domain/CLAUDE.md` 33 KB, `pages/CLAUDE.md` 24 KB | Mesma situação do A1 |

### D. Git (segurança do trabalho)
| # | Achado | Risco |
|---|---|---|
| D1 | **A reorganização não está salva no Git**: 58 arquivos movidos ou renomeados (pasta `folders`, testes de layout, mapa das representantes) + 18 novos | Se alguém salvar só as mudanças "apagadas" (`git commit -a`), o GitHub perde esses arquivos (no PC eles continuam) |
| D2 | Outras conversas estão commitando no mesmo branch (`alteracoes-27-10`) | Mudanças de duas conversas podem se misturar |

### E. Computador
| # | Achado |
|---|---|
| E1 | Fotos sem segunda cópia fora do PC (sem pen drive; Google Fotos deu erro) |
| E2 | O admin real ainda mora em `Downloads` |
| E3 | Lixeira do Windows com 43 itens, inclusive o protótipo `zelity_iphone17_funcional.html` (não apagar) |

## 3. Ordem para resolver

### Fase 1: eu faço sozinho, sem risco (nada do sistema muda)
**Fase 1 feita em 02/11/2026:** resumo (LEIA-ME) dos 17 setores no modelo padrão; `docs/ideias` com 9 ideias; 3 documentos parados em `docs/historico` (os outros 5 com data no nome continuam em uso: um é citado pelo código `instrumentation.js`); 53 rascunhos em 13 subpastas (2 ficaram porque o código cita); 24 scripts de uso único em `scripts/usados-uma-vez` (imports ajustados); índice `docs/README.md` e Painel atualizados.

1. **A3** Preencher o LEIA-ME de cada setor com o modelo padrão (o que é, líder, pessoas, telas, recebe de, entrega para, regras, números, em aberto), copiando do `CLAUDE.md`, do `FLUXO-DA-EMPRESA.md` e da integração. O que não estiver escrito fica "(a confirmar)".
2. **B** Criar `docs/ideias/`: um arquivo por ideia, com situação (ideia, planejado, em construção, descartado).
3. **A5** Mover as "fotos de um dia" para `docs/historico/` e deixar no setor um link.
4. **A6** Separar `docs/rascunhos` por assunto (subpastas) e marcar o que virou tela.
5. **C1** Mover os scripts de uso único para `scripts/usados-uma-vez/` (depois de conferir que nenhum comando os chama).
6. **A7** Atualizar `docs/README.md` e o Painel.

### Fase 2: precisa de você
1. **D1** OK para salvar a reorganização no Git (e avisar o Leonardo).
2. **A4** Revisar as pendências: eu leio setor por setor e pergunto o que já foi feito.
3. **C2** Decidir: a área pessoal do Marcus sai do sistema da empresa ou fica?
4. **A8** Decidir a lista oficial de setores (a do menu ou a dos documentos).
5. Contar o que falta de cada setor (começando pelo que você escolher).

### Fase 3: conversa própria, com cuidado
1. **A1/C3** Enxugar o `CLAUDE.md`: os detalhes de cada setor vão para o LEIA-ME do setor; o `CLAUDE.md` fica com regras gerais e o índice. Muda como TODAS as conversas trabalham: fazer depois da Fase 1 e avisar o Leonardo.
2. **A2** Arquivar o diário por mês (`DECISOES-2026-10.md`), mantendo o atual leve.
3. **E2** Mover o admin para `C:\Projetos` (copiando a memória do Claude).

## 4. Regra para não bagunçar de novo
- Decisão nova: diário geral **e** pasta do setor, no mesmo dia.
- Ideia nova: arquivo em `docs/ideias/`.
- Dado real de pessoa: só em arquivo `.local`.
- Desenho de tela para escolher: `docs/design/testes-de-layout/` (ou `docs/rascunhos/<assunto>/`).
- Documento com data no nome é "foto do dia": depois de usado, vai para `docs/historico/`.

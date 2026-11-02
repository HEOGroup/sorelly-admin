# Como ler os nomes dos arquivos (Sorelly Admin)

Escrito em 01/11/2026 para o Marcus. Os nomes parecem aleatórios, mas seguem 3 regras. Cada regra existe por um motivo.

## 1. Arquivos da raiz que o programa EXIGE (nunca renomear)
Esses nomes são fixos: cada ferramenta procura o arquivo pelo nome exato, em minúsculas. Se mudar o nome, a ferramenta não acha e o sistema para.

| Arquivo | Para que serve (em palavras simples) |
|---|---|
| `package.json` | Lista de peças que o sistema usa e os comandos (ligar, conferir) |
| `package-lock.json` | Versão exata de cada peça (garante que todos usem a mesma) |
| `next.config.mjs` | Configuração do Next (o motor do sistema) |
| `playwright.config.mjs` | Configuração das fotos de teste das telas |
| `jsconfig.json` | Ensina o atalho `@` (aponta para a pasta `src`) |
| `postcss.config.mjs` | Liga o estilo (cores e tamanhos) |
| `.eslintrc.json` | Conferidor automático do código |
| `instrumentation.js` | Arranque do servidor |
| `.env.local` | CHAVES secretas (só neste PC, nunca vai para o Git) |
| `.env.exemplo` | Modelo do `.env.local`, sem segredo |
| `.gitignore`, `.gitattributes` | Regras do Git (o que não sobe e como tratar texto) |
| `.nvmrc`, `.editorconfig` | Versão do Node e formato do texto |

## 2. Documentos (os que você lê)
- Documento oficial: **MAIÚSCULAS-COM-HIFEN.md** (ex.: `CLAUDE.md`, `README.md`, `DECISOES.md`, `PADRAO-VISUAL.md`).
- Testes de layout e desenhos: **minusculas-com-hifen.html** (ex.: `atendimento-6-estruturas.html`).
- Dados reais só deste PC: terminam em **`.local`** (ex.: `CAIXA-FINANCEIRO.local.md`). Ficam em `docs\dados-locais`.

## 3. Código (dentro de `src`)
| Pasta | Regra do nome | Exemplo | Por quê |
|---|---|---|---|
| `pages` | **Começa com Maiúscula** | `VisaoGeral.js` | Cada arquivo é uma TELA |
| `domain` | minúscula com hífen | `agendamento.js` | Cada arquivo é uma REGRA ou número |
| `components` | minúscula com hífen | `padrao.js` | Cada arquivo é uma PEÇA reutilizável |
| pastas em geral | minúscula | `src`, `docs`, `scripts` | Evita erro entre Windows e servidor |

Resumo: **Maiúscula = tela. Minúscula = regra ou peça. MAIÚSCULA TODA = documento oficial.**

## 4. O que NÃO renomear
- Arquivos da seção 1 (o sistema para).
- Arquivos de código: cada nome é citado em centenas de lugares do sistema. Trocar quebra tudo e o histórico do Git.

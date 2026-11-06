# Setor Marketing

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu, 0 itens), `pendencias.md` (o que está aberto, 0 itens) e `pessoas.local.md` (ficha de cada pessoa, fora do Git). "(a confirmar)" = falta confirmar com o Marcus.

## 1. O que o setor faz
Artes, conteúdo e tráfego pago. Gera os leads que vão para o Cadastro de revendedoras.

```
Nada (é a origem)
      │
      ▼
Marketing
      │
      ▼
Cadastro de revendedoras (leads)
```

## 2. Quem
| Quem | Papel |
|---|---|
| Julia (líder citada em 08/10/2026; a confirmar, a planilha mostra saída em 15/10); tráfego pago com o Diego | Líder do setor |
| Beatriz | Social media (1) |
| Rebeca | Assistente de marketing digital (1) |

## 3. Regras que valem
| # | Regra |
|---|---|
| — | Nenhuma regra própria registrada ainda (a confirmar) |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Marketing | `/marketing/painel` |
| Campanhas | Em breve |
| Tráfego pago | Em breve |
| Pessoas (dados reais) | `docs/setores/marketing/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Marketing.js`.

## 5. Em aberto (principais)
- Tela do setor (em breve).
- Líder atual (a confirmar).
- Lista completa: `pendencias.md` desta pasta (0 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.

## Arquivos dos criativos (06/11/2026)
O Diego guarda o vídeo, a imagem ou as telas do carrossel dentro de cada criativo (Marketing › Criativos › Novo criativo ou Editar). Até 12 arquivos de 600 MB. O arquivo vai direto do navegador para o Vercel Blob (rota `app/api/criativos/upload/route.js`, peça `lib/enviar-arquivo.js`); o criativo guarda só o endereço (`arquivos` em `s.tp`). Precisa de uma loja Blob PÚBLICA ligada ao projeto na Vercel (variável `BLOB_READ_WRITE_TOKEN`). Apagar o criativo não apaga o arquivo do Blob (fica órfão).

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
| Lucas Castilho | Foto e edição (prestador dentro da empresa) |
| Funcionária nova (10/11/2026) | Foto e edição |
| Beatriz | Social media (de atestado em 10/11/2026) |
| Diego | Tráfego pago |
| Julia e Rebeca | Saíram em 15/10/2026 |

## 3. Regras que valem
| # | Regra |
|---|---|
| 1 | Tráfego pago: o investimento se digita SEM imposto; Meta com imposto = × (1 + 12,15%); total das plataformas = Google + Meta com imposto |
| 2 | Custo por cadastrada = investimento ÷ cadastradas. Aprovadas zero com cadastradas = não lançadas (mostra "—") |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Marketing | `/marketing/painel` |
| Campanhas | Em breve |
| Fotos de catálogo | `/marketing/fotos-de-catalogo` (planilha das fotos das peças novas: foto, edição, DevMaster) |
| Tráfego pago | `/marketing/trafego-pago` (Investimento, Mês a mês, Dia a dia, Criativos) |
| Pessoas (dados reais) | `docs/setores/marketing/pessoas.local.md` (só neste PC) |
| Integração com os outros setores | `docs/negocio/INTEGRACAO-ENTRE-SETORES.md` |

Código das telas: `pages/Marketing.js` e `pages/Trafego.js` (`pages/trafego/*`, domínio `domain/trafego.js`, estado `s.tp`).

## 5. Em aberto (principais)
- Tela do setor (em breve).
- Líder atual (a confirmar).
- Lista completa: `pendencias.md` desta pasta (0 itens, a revisar com o Marcus).

## 6. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) `decisoes.md` desta pasta e o diário geral, no mesmo dia, (3) o painel: `node scripts/gerar-painel-documentos.mjs`.

## Arquivos dos criativos (06/11/2026)
O Diego guarda o vídeo, a imagem ou as telas do carrossel dentro de cada criativo (Marketing › Criativos › Novo criativo ou Editar). Até 12 arquivos de 600 MB. O arquivo vai direto do navegador para o Vercel Blob (rota `app/api/criativos/upload/route.js`, peça `lib/enviar-arquivo.js`); o criativo guarda só o endereço (`arquivos` em `s.tp`). Precisa de uma loja Blob PÚBLICA ligada ao projeto na Vercel (variável `BLOB_READ_WRITE_TOKEN`). Apagar o criativo não apaga o arquivo do Blob (fica órfão).

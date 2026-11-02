# Setor Representantes

Resumo para ler primeiro. Para o detalhe: `decisoes.md` (o que o Marcus decidiu), `pendencias.md` (o que está aberto) e `pessoas.local.md` (ficha de cada representante, fora do Git).

## 1. O que o setor faz
A representante leva o kit à revendedora, faz o acerto na rua pelo app, entrega kit novo e reposição, e traz o retorno à empresa. A Sorelly paga comissão pelo que a revendedora pagou.

```
Michele distribui o kit novo ─► representante entrega e faz o acerto (app)
      │
      ▼
Agendamento confere dinheiro e condicional ─► Financeiro confirma ─► Comissões paga
```

## 2. Quem
| Quem | Papel |
|---|---|
| 23 representantes | Lista de RH (`domain/pessoas.js`): 19 só representantes e 4 que também são funcionárias (Ana Maria, Nayale, Rayssa, Thalita). Sabrina e Julia G. saíram em 19/10/2026. |
| Agendamento | Tem as representantes com cota (29 reais em 29/10; conferir). |
| Michele (Kits novos) | Distribui o kit novo. Supervisor: Nickolas. |
| Ana Maria (Agendamento) | Confere recebimento e condicional. |
| Nayale e Ana Maria (Financeiro) | Confirmam e pagam a comissão. |
| Marcus, Ana Maria e Nayale | Mudam as regras em "Configurar comissões". |

## 3. Regras de pagamento da representante
| Item | Regra |
|---|---|
| Comissão | 8% do valor do acerto que a revendedora pagou. O que ficou em aberto fica retido. |
| Percentual de cada uma | Existe um padrão (8%) e um percentual por representante, em "Configurar comissões". Algumas recebem 10%. **As representantes veem sempre 8%** (manual, Regras, telas). |
| Liberação | Agendamento confere, nota promissória assinada, financeiro confirma. |
| Datas | Grupo A: dias 1, 11 e 21. Grupo B: dias 6, 16 e 26. Corte às 13h do dia anterior. |
| Kit novo | R$ 20,00 (R$ 35,00 com expositor). Provisório. Só com termo e condicional assinados. |
| Reposição | R$ 15,00 por entrega, com condicional assinada. |
| Combustível | km total ÷ 11 × preço do litro (gasolina comum, Paraná). Sem km no prazo: R$ 200,00. |
| Pix direto | É só uma forma de pagar a representante. Não muda a comissão. |
| Bônus | Representante não tem bônus. |
| Acerto com loja | Não é pagamento. Sem comissão, fica em aberto. |

## 4. Onde ficam as coisas
| O quê | Onde |
|---|---|
| Regras (leitura) | `/representantes-kits/regras-representantes` |
| Mudar percentual, datas, reposição, kit novo | Comissões → botão "Configurar comissões" |
| App da representante | `/app-representante` (cartão "Regras e comissões" = manual) |
| Manual da representante | `materiais-do-app/folder-representantes.html` (origem), `materiais-do-app/Regras & Comissões Representante 28-10.pdf`, `public/regras/rep-1..12.png` |
| Regiões, horários e viagens | `docs/setores/representantes/Mapa das representantes.md` |
| Contexto antigo (comissão, Consolidado, placar) | `docs/negocio/CONTEXTO-REPRESENTANTES.md` |
| Regras de Pix | `docs/negocio/REGRAS-DE-PIX.md` |

Código principal: `src/apps/montagem/domain/comissoes.js`, `representantes.js`, `pessoas.js`; telas `pages/RegrasRepresentantes.js`, `ConfigComissoes.js`, `Comissoes.js`, `AvalRep.js`; apps `mobile/representante.js` e `mobile/regras-comissoes-app.js`; kits novos em `src/apps/kits-novos/domain/regioes-rep.js` e `viagens-rep.js`. Regras de cálculo: `src/apps/montagem/domain/CLAUDE.md`.

## 5. Regra de trabalho
Mudou uma regra? Atualize (1) o sistema, (2) o manual (HTML, PDF e imagens), (3) `decisoes.md` e o diário geral, no mesmo dia.

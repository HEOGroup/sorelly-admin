# Setor Inadimplência

Resumo para ler primeiro (04/11/2026). Tela: `/representantes-kits/inadimplencia` (código em `pages/Inadimplencia.js`; regras de prazo em `domain/comissoes.js`, função `prazoPendente`). Cobrança jurídica: `docs/negocio/JURIDICO-COBRANCA.md`.

## 1. O que o setor faz
Cuida do acerto em que a revendedora pagou menos do que devia. O que falta fica aberto aqui, um bloco por representante. Nada é descontado da representante: só a comissão sobre o valor em aberto fica retida até a revendedora pagar.

```
Acerto fechado com pagamento incompleto
      │
      ▼
Inadimplência (valor que falta + multa por atraso)
      │  negociação (promessa de data e valor) ──► pagamento depois ──► OK do financeiro ──► comissão liberada
      ▼
No prazo → Atrasado → Jurídico (60 dias) → Retirar kit → Executar nota
```

## 1b. Fluxo que o Marcus definiu em 04/11/2026 (vale no lugar do fluxo acima; o código ainda usa o antigo)
```
Inadimplência (negocia primeiro)
      │
      ├─ acordo cumprido ──────────────► quitada
      │
      └─ sem acordo, OU acordo não cumprido (faltou o pagamento da 1ª negociação)
                │
                ▼
             Jurídico (inclui retirar o kit e executar a nota)
```
- "Retirar kit" deixa de ser etapa da Inadimplência e passa para dentro do Jurídico.
- A Inadimplência só negocia. Falhou a 1ª negociação, vai direto ao Jurídico.
- Acordo: 1 chance só (Marcus, 04/11/2026). Faltou o pagamento combinado, vai ao Jurídico.
- As outras regras de cada etapa ainda serão alinhadas com o Marcus.

## 2. Regras que valem hoje (lidas do código)
| # | Regra |
|---|---|
| 1 | Prazo para quitar: 15 dias depois do acerto. |
| 2 | Atraso: multa de 1% ao dia sobre o que falta, teto de 10%. |
| 3 | A multa de 10% do pendente já entra no acerto. |
| 4 | Etapas: No prazo, Atrasado, Jurídico (60 dias), Retirar kit (veio o próximo acerto e não pagou), Executar nota (promessa vencida). |
| 5 | Duas pendências da mesma revendedora ficam juntas, com o total somado. |
| 6 | Pagamento feito depois vira linha extra do acerto. O financeiro confirma a conta e a comissão retida sai. |
| 7 | Quem registra: agendamento e diretoria. Valores em dinheiro: só quem vê totais. |
| 8 | Venda do app só conta na média do kit se for de R$ 500 ou mais (04/11/2026). |

## 3. Falta definir com o Marcus
Ver `pendencias.md`.

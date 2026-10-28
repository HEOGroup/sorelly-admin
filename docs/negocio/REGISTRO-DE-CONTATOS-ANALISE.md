# Registro de contatos da Tamara: análise das anotações da DevMaster (28/10/2026)

Objetivo (Marcus): a Tamara não escreve mais; escolhe opções. Texto livre só em caso raro.

## Base analisada
- Condicionais dos vendedores Sorelly (02, FE e BY) desde 01/01/2025, campo Obs. Gerais (`afi_obs`) da DevMaster.
- 5.061 condicionais, 4.678 com anotação, 798 revendedoras.
- 7.445 linhas, 6.329 únicas (a mesma frase escrita em várias condicionais da cliente conta uma vez).
- Autoras: Tamara 2.984, Ana 2.261, Mariana 159, sem nome 732, outras (Renata, Fabrícia, Isabelly…) poucas.
- Script de leitura e classificação: refazer a partir de `parseObs` (domain/revendedoras-internas.js) e das expressões desta análise.

## O que as anotações dizem (uma linha pode ter mais de um item)
| Tipo | Linhas | Exemplo |
|---|---|---|
| Acerto marcado (data e hora) | 4.038 | "O acerto ficou agendado para o dia 28/11 às 14h" |
| Entrei em contato | 2.541 | "Entrei em contato" |
| Quer vir na empresa (sem data) | 478 | "Cliente quer vir na empresa" |
| Remarcado | 415 | "Reagendou - vem na empresa 20/02 às 08 horas - multa de 5%" |
| Representante pediu o kit | 209 | "Rep solicitou kit para dia 12/08" |
| Cliente com marca (funcionária, outras) | 177 | "(FUNCIONÁRIA) - vem na empresa 07/02" |
| Mudou o ciclo / mais prazo | 143 | "45 dias (autorizado Anamaria)" |
| Não veio / faltou | 141 | "Não compareceu ao atendimento no dia 30" |
| Multa citada no texto | 198 | "+5%", "multa de 5%" |
| Troca pendente | 123 | "Tem trocas (Pâmela) - vem na empresa 04/02" |
| Sem retorno | 27 | "Não dá retorno" |
| Desmarcou | 6 | "Cliente desmarcou hoje" |
| Sem categoria (texto livre de verdade) | 222 (3,5%) | passou a cliente para outra representante, "kit pronto", equipamento |

96% das linhas cabem numa opção. O que sobra é raro.

## Motivo das remarcações
- 451 linhas de remarcação, não veio ou desmarcou; só **29%** dizem o motivo.
- Motivos que aparecem: saúde 51, esqueceu/imprevisto 27, filho/família 23, viagem 21, trabalho 21, transporte 7, sem dinheiro 2, clima 1.
- Conclusão: o motivo tem que ser campo obrigatório em caixa suspensa (como "desmarcado porque?" no direcionamento de Pix).

## Multa que já é usada na prática
- Citada 198 vezes: 5% em 173, 10% em 12, 3% em 10, 15% em 1.
- A regra do sistema (domain/consignado.js, REMARCACAO) é 1ª remarcação −5 pontos, 2ª −8, 3ª ou mais −15 (comissão) e brinde −15% / −50% / −100%. A prática de 10% (12 vezes) não bate com os 8% da regra: confirmar com o Marcus.

## Autorização
Autorizações citadas: Marcus 78, Anamaria 9, Lucas 7, Nickolas 1.

## Ciclos citados
45 dias 55, 60 dias 36, 30 dias 2, 90 dias 2.

## Horários dos agendamentos
10h 619 · 09h 618 · 14h 555 · 08h 404 · 13h 392 · 15h 354 · 11h 312 · 12h 217 · 16h 205 · 17h 95 · 18h 24 · 19h 7. Sábado citado 109 vezes.

## Opções propostas para o card
- **Tipo** (caixa suspensa): Entrei em contato · 1ª, 2ª e 3ª tentativa · Acerto marcado (dia e hora) · Remarcado · Não veio · Desmarcado · Quer vir (sem data) · Representante pediu o kit · Mudou o ciclo (30/45/60/90) · Troca pendente · Passou para outra pessoa · Outro (texto).
- **Motivo** (obrigatório em remarcado, não veio e desmarcado): Saúde · Família/filho · Viagem · Trabalho · Transporte · Esqueceu/imprevisto · Sem dinheiro · Clima · Mudança · Outro.
- **Autorizado por** (Marcus, Lucas, Nickolas, Ana Maria) e **Isenta de multa** (sim/não).
- **Quem falou com ela** e **registrado por** (conta logada).
- Os 6.329 registros antigos podem ser convertidos nessas opções automaticamente; a Tamara só confirma os duvidosos.

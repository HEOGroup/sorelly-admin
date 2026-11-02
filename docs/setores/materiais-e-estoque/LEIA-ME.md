# Materiais e estoque (com Cadastro de peças e Compras)

> Resumo do setor, atualizado em 02/11/2026. Fontes: `CLAUDE.md`, `docs/negocio/FLUXO-DA-EMPRESA.md` e `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`. "(a confirmar)" = falta confirmar com o Marcus. Ao falar deste setor, o Claude lê este arquivo primeiro.

## 1. O que o setor faz
Compra material, controla o estoque de material e cadastra as peças com preço sugerido, que a diretoria aprova.

## 2. Quem
- **Líder:** Rayssa (cadastro de peças); Nickolas (compras; Hellen no link de pagamento)
- **Pessoas:** 3 na planilha do RH (Cadastro de Peças, Compras). Nomes e dados de cada uma: `docs/setores/rh/pessoas.local.md` (só neste PC).

## 3. Telas no sistema
- Compras e estoque de material (`pages/ComprasEstoque.js`)
- Cadastro de peças: calculadora, fornecedores, DevMaster, configurações (`pages/CadastroPecas.js`)

## 4. Integração com outros setores
- **Recebe de:** Fornecedores (bruto e banho)
- **Entrega para:** Produção (peças liberadas); Financeiro (dados para pagar)
- Mapa completo: `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`

## 5. Regras que valem
- A diretoria define o preço das peças. Cadastro por modelo.
- Aprovação de compra por pessoa (autorização compra_aprova).
- Estoque geral de peças mês a mês fica no Financeiro, não aqui.

## 6. Documentos do setor
- `docs/negocio/FLUXO-DE-COMPRA-DE-BRUTO.md`

## 7. Em aberto (principais)
- Pedidos de bruto e de banho.
- Retirar ouro.
- O que é peça "de luxo" e como se calcula o markup.
- Lista completa tirada do diário: `pendencias.md` desta pasta (8 itens, a conferir).

## 8. Arquivos desta pasta
- `decisoes.md`: 8 decisões copiadas do diário geral.
- `pendencias.md`: o que o diário diz que falta.

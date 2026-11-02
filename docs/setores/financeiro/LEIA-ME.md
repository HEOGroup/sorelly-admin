# Financeiro

> Resumo do setor, atualizado em 02/11/2026. Fontes: `CLAUDE.md`, `docs/negocio/FLUXO-DA-EMPRESA.md` e `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`. "(a confirmar)" = falta confirmar com o Marcus. Ao falar deste setor, o Claude lê este arquivo primeiro.

## 1. O que o setor faz
Fatura as condicionais, concilia pagamentos, controla contas a pagar e a receber, paga comissões e fornecedores, acompanha o resultado do mês. Desde 29/10/2026 a equipe usa só o sistema novo (o admin antigo virou consulta).

## 2. Quem
- **Líder:** A definir (equipe: Nayale no financeiro, Bruna no faturamento, Amanda na inadimplência; Anamaria acompanha)
- **Pessoas:** 4 na planilha do RH (Financeiro, Inadimplência). Nomes e dados de cada uma: `docs/setores/rh/pessoas.local.md` (só neste PC).

## 3. Telas no sistema
- Previsão de faturamento e Faturamento (`pages/Faturamento.js`, tela de referência do padrão)
- Contas a pagar e Análise de custos
- Contas a receber e Resultado do mês (`pages/ContasReceber.js`)
- Controle de pagamentos (`pages/ControlePagamentos.js`)
- Pagamentos a fornecedores (`pages/pf/*`)
- Comissões (uma aba por setor; Datas de pagamento)
- Financeiro familiar (só os sócios)
- Cobrança de funcionárias
- Link de pagamento e maquininhas
- Dinheiro (confirmação dupla com código)

## 4. Integração com outros setores
- **Recebe de:** Bipagem e Atendimento interno (condicional para faturar); Agendamento (dinheiro com código); Compras (dados para pagar fornecedores)
- **Entrega para:** Condicionais (devolve depois de faturar); comissões a todos os setores; Inadimplência (o que ficou em aberto)
- Mapa completo: `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`

## 5. Regras que valem
- Padrão do Financeiro: filtros no topo, 32 px, R$ em todo valor, números à direita, faixa de totais, abas visíveis (`docs/design/PADRAO-VISUAL.md`).
- Termos curtos nas telas: Dívida, Enviado, Falta, Quitada.
- Cor do setor: azul. Verde entra, vermelho sai.
- Acerto - loja = não pagou: vale o saldo em aberto. Funcionárias = grupo 0002 do cadastro da DevMaster.
- Valores de comissão: só a diretoria e o financeiro veem.

## 6. Documentos do setor
- `docs/negocio/RESULTADO-DO-MES.md`
- `docs/negocio/FLUXO-DE-PAGAMENTOS.md`
- `docs/negocio/RELATORIO-DE-CUSTOS.md`
- `docs/negocio/CAIXA-FINANCEIRO.md`
- `docs/negocio/LINK-DE-PAGAMENTO.md`
- `docs/negocio/REGRAS-DE-PIX.md`
- `docs/negocio/FATURAMENTO-DIARIO.md`
- `docs/negocio/JURIDICO-COBRANCA.md`
- `docs/ideias/tirar-financeiro-da-devmaster.md`
- `docs/ideias/sistema-completo-custos-e-dre.md`

## 7. Em aberto (principais)
- Tirar o financeiro 100% da DevMaster (backup, nuvem e auditoria dependem do Leonardo).
- Saldos bancários, saldo das contas (Pix), fiscal e histórico de contas: "a trazer".
- Lançamentos "por fora" ainda passam por planilha.
- Lista completa tirada do diário: `pendencias.md` desta pasta (98 itens, a conferir).

## 8. Arquivos desta pasta
- `decisoes.md`: 159 decisões copiadas do diário geral.
- `pendencias.md`: o que o diário diz que falta.

# Tirar o financeiro da DevMaster (controle total)

**Situação:** em andamento (pedido de 27/10/2026: "em poucos dias").

## O que é
O financeiro sai 100% da DevMaster e fica só no sistema da Sorelly. A Nayale (financeiro) passa a usar direto o Sorelly Admin.

## Por quê
Controle total e parar de operar no negativo. A medida do mês passa a ser o **resultado efetivo** (o que entrou de verdade), e não só a nota fiscal. Detalhes e regras: `docs/negocio/RESULTADO-DO-MES.md`.

## Pedidos de segurança do Marcus
- Backup diário.
- Sistema na nuvem.
- Registro de quem fez o quê (auditoria).
- Poder ver o sistema como estava em dias anteriores.

## Dados lidos da DevMaster (API 2, só leitura)
Contas a pagar (`dmabe`), movimentos bancários e baixas (`dmabf`), empresas (`dmzzz`). Detalhes: `docs/devmaster/openapi.yaml`.

## Em aberto
- "Por fora": hoje o Lucas lança numa planilha e a Nayale repete à mão. Ideal: o Lucas lançar direto em Pagamentos a fornecedores.
- Créditos bancários estão num Google Drive do Marcus.
- Nuvem, backup e auditoria dependem do Leonardo.

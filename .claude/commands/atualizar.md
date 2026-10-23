---
description: Atualiza o sistema com o que está no admin antigo (saldos das contas, contas pagas por dia, contas a pagar) e com o que o Marcus mandou no chat
---

Atualização diária do Sorelly Admin enquanto o servidor não existe. Faça TUDO de uma vez e sem perguntar o que já se sabe; pergunte só o que muda o resultado.

1. **Ler o admin antigo** (ferramentas `mcp__...__consultar`, só SELECT):
   - Saldos: `finance_balance` + `finance_account` (todas as datas depois da última que já está em `src/apps/montagem/domain/saldos-atualizacao.local.js`). Use `jsonb_object_agg(a.name, b.amount)` por data para vir compacto.
   - Contas pagas por dia: `faturamento_contas_diario` (`valores` com `cnpj-34`, `cnpj-46`, `cnpj-59`, `cnpj-67`, `contas-por-fora`).
   - Totais do mês: `faturamento_contas_mes`.
2. **Gravar**: regenerar `saldos-atualizacao.local.js` (script modelo: `atualiza.mjs` do histórico, mapeando nome da conta → id por nome normalizado; gitignored). Se faltar dia ou conta, avisar.
3. **O que o Marcus mandou no chat** (faturamento acumulado, previstos, percentuais, "carregar", a realizar): gravar FIXO no código (função `aplicaFat20` em `state/store.js` ou uma nova no mesmo padrão, que roda no estado novo e no salvo) E no `docs/negocio/FATURAMENTO-DIARIO.md` E em `domain/versoes.js` E em `docs/DECISOES.md`. Nunca deixar algo só na memória da conversa ou só no navegador dele.
4. **Conferir no navegador** com estado limpo: Visão geral (faturamento, acertos, média, previstos) e Caixa (saldos e recebido nas contas) devem mostrar o mesmo faturamento. Limpar o localStorage (`sorelly_montagem_v9`) no fim.
5. Responder curto: o que foi atualizado, as datas e as diferenças encontradas.

## Outras leituras diárias
- **RH (3h30, tarefa `atualizar-rh-sorelly-admin`)**: presença diária (`rh_presenca` + `rh_colaborador`) → `domain/rh-atualizacao.local.js`; o sistema casa os nomes sozinho (`rhAplicarAdmin`).
- **Setores do admin antigo que ainda podem ser lidos** (tabelas): Cadastro de revendedoras (`cadastro_*`, `kommo_lead`), Kits novos (`kit_novo*`), Agendamento (`acertos_*`), Consignado/representantes (`consignado_*`, `listagem*`), Atendimento interno (`atendimento*`), Compras (`compras_*`), Estoque interno (`estoque_*`), Produção/Montagem (`producao_*`, `montagem_*`), Fiscal (`fiscal_*`), Financeiro familiar (`finance_familiar_*`), Cobrança de funcionárias (`credito_peca_*`), Expositores (`expositor_*`), Marketing (`marketing_*`), Avaliações (`avaliacao*`). Descartados: Leilão, Chamados, Metas das revendedoras.

# Substituir o admin antigo

**Situação:** em andamento.

## O que é
O admin antigo (SorellyAdmin, com banco de produção) é considerado ruim. Este sistema novo vai substituí-lo, módulo por módulo.

## Decisões até agora
- 20/10/2026: o Marcus demitiu o Juan (desenvolvedor, H&O Apps). O Leonardo continua.
- 29/10/2026: CORTE do Financeiro: a equipe só usa o sistema novo; o admin antigo vira consulta (ver `docs/setores/financeiro/decisoes.md`).
- O admin antigo continua como referência: `C:\Projetos\Outros\_antigos\SorellyAdmin-main`.

## Cuidados
- Os dados reais (`*.local.*`) não vão para o GitHub (repositório público). Nunca publicar a pasta de build feita no PC do Marcus (leva salários e CPFs).
- Revogar os acessos do Juan (GitHub, hospedagem, servidor do admin antigo, senhas e chaves): **a confirmar se já foi feito**.

## O que falta (a confirmar com o Marcus e o Leonardo)
- Lista de módulos que ainda só existem no admin antigo.
- Logins dos funcionários: faltam 23 (Produção 16 + 7), ver `docs/negocio/CONTEXTO-29-10-2026-CONTAS-AGENDAMENTO-CHAT.md`.

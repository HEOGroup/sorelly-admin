# RH (Recursos Humanos)

> Resumo do setor, atualizado em 02/11/2026. Fontes: `CLAUDE.md`, `docs/negocio/FLUXO-DA-EMPRESA.md` e `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`. "(a confirmar)" = falta confirmar com o Marcus. Ao falar deste setor, o Claude lê este arquivo primeiro.

## 1. O que o setor faz
Cuida do quadro de pessoas, presença diária, horas extras, advertências, experiência, contratos e dos acessos e autorizações de cada setor.

## 2. Quem
- **Líder:** Maria Claudia
- **Pessoas:** 2 na planilha do RH (RH). Nomes e dados de cada uma: `docs/setores/rh/pessoas.local.md` (só neste PC).

## 3. Telas no sistema
- Funcionários e representantes (só leitura)
- Controle de RH: visão geral, presença diária, relatório para o WhatsApp, colaboradores, advertências, experiência, horas extras, configurador (`pages/RH.js`)
- Contratos (representantes, CLT, terceiros, particulares do Marcus, modelos)
- Acessos e autorizações (quem vê o quê, quem pode fazer o quê)
- Equipes

## 4. Integração com outros setores
- **Recebe de:** Todos os setores (pessoas, presença)
- **Entrega para:** Todos (acessos por setor); Financeiro (comissões e folha)
- Mapa completo: `docs/negocio/INTEGRACAO-ENTRE-SETORES.md`

## 5. Regras que valem
- Acesso é por setor, nunca por pessoa.
- CPF e salário: só a diretoria (e quem tem acesso total).
- Dados reais só em arquivos .local (repositório público).
- O sistema novo é a fonte dos horários (29/10/2026).

## 6. Documentos do setor
- `docs/setores/rh/pessoas.local.md`  (uma linha por funcionário, só neste PC)
- `docs/negocio/ACESSOS-E-CONTAS-28-10-2026.md`
- `docs/negocio/FLUXO-DA-EMPRESA.md`

## 7. Em aberto (principais)
- Faltam 23 logins (Produção 16 + 7).
- Trazer os dados reais do admin antigo (presença, advertências, contratos).
- Banco de cada funcionário não existe nos dados.
- Lista completa tirada do diário: `pendencias.md` desta pasta (2 itens, a conferir).

## 8. Arquivos desta pasta
- `decisoes.md`: 11 decisões copiadas do diário geral.
- `pendencias.md`: o que o diário diz que falta.
- `pessoas.local.md`: uma linha por funcionário (só neste PC).

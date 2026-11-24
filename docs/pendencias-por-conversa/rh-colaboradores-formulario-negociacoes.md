# Pendências · RH › Colaboradores, Formulário dos funcionários e Negociações

Levantamento de 23/11/2026, feito antes de arquivar a conversa. Só leitura. Sem dados pessoais.
Arquivo da conversa inteira: `docs/historico/CONTEXTO-17-19-11-2026-RH-COLABORADORES-FORMULARIO.md` (na master).

## 1. O que foi feito
- RH › Colaboradores virou uma tela só, com menu **Visão** (Cadastro, Advertências, Experiência, Horas extras, Negociações, Escala 42h, Salário e bônus). Escolhas da faixa azul em menu suspenso. Em Negociações, o menu ao lado é Dinheiro, Joias e Dinheiro + joias.
- Nova colaboradora com ficha completa. Ficha com 4 blocos de dados a mais. Coluna Empresa com CNPJ inteiro e cor.
- Salário e bônus com adiantamento (dia 20) e salário (5º dia útil, sábado conta). "Puxar do Financeiro" lê as contas pagas da DevMaster e grava com `pag_lote`.
- Formulário dos funcionários: um link por pessoa (`/meus-dados/<código>`), telefone e mensagem para copiar, mensagem pronta para a Maria, revisão antes de aplicar no cadastro.
- Negociações: campo Forma de pagamento por pessoa e bloco **Combinados avulsos** (dia, início, fim, combinado, dinheiro, joias, bate ponto, situação, total). Publicado na master até `51af134`.

## 2. Alterações sem commit ou fora da master
| Onde | Situação |
|---|---|
| `C:\Users\marcu\Downloads\sorelly-pub` (worktree solta) | Limpa, em `51af134` = master. Nada pendente. Pode ser removida. |
| Pasta de trabalho `...\sorelly-admin\sorelly-admin` (branch `alteracoes-27-10`) | `RH.js`, `rh/JoiasVisao.js` e `scripts/testar-tela-colaboradores.mjs` sem alteração pendente na última conferência. As alterações sem commit que existem nela são de outras conversas. |
| Pasta temporária da conversa (scratchpad) | Scripts de remendo `patch-*.mjs`, `resolver-versoes.mjs`, `achar-quebra.mjs`. Descartáveis. |
| Este arquivo | Novo, sem commit, a pedido. |

Aviso: o `CLAUDE.md` novo diz que a pasta oficial do projeto é `C:\Sorelly\sorelly-admin`. Esta conversa trabalhou na pasta antiga em Downloads. Conferir se essa pasta ainda recebe o que sobe na master.

## 3. Pendências (procurei além da lista oficial)
Do Marcus:
1. Clicar em **Gravar os meses** no Puxar do Financeiro, no site publicado.
2. Mandar para a Maria a mensagem do formulário (está no arquivo da conversa).
3. Gerar e enviar os links só no site publicado, nunca no localhost.
4. Decidir se libera o Canal de denúncias para o pai (não foi liberado).
5. Conferir no site publicado: Ana Paula em Joias, Combinados avulsos da Camille com Início, Fim e Bate ponto, Tecnologia › Versões abrindo.

Coisas combinadas ou ditas "depois":
6. Valor em joias por faixa de hora extra. O Marcus deu o exemplo "R$ 122,00 em joias por 2 horas extras". A tabela padrão (1h, 2h, 3h, sábado) só tem dinheiro. Hoje isso só entra à mão em Combinados avulsos.
7. Combinados avulsos não alimentam nada: não entram em Salário e bônus, nem no pagamento de joias, nem na Presença diária. **Bate ponto é só uma marca**; a Presença diária não lê esse campo.
8. Decisões não registradas: `docs/DECISOES.md` tem só o Formulário. Faltam Negociações (menu por forma, Forma de pagamento, Combinados avulsos) e a pasta `docs/setores/rh/decisoes.md` (regra: no mesmo dia).
9. Puxar do Financeiro lê só o ano corrente. O Marcus não respondeu se quer 2022 a 2025.
10. Maria precisa do login ligado ao setor RH no servidor (`setores` com `rh`). Não conferi com o login dela.
11. Texto de consentimento (LGPD) do formulário precisa de revisão do contador ou advogado.
12. Funcionários sem telefone no cadastro não têm botão de copiar telefone. Falta preencher.

Testes que não fiz:
13. Não testei Combinados avulsos apertando botões com dados reais (só teste de código e a foto do Marcus). Num teste local apertei Novo combinado numa pessoa real e removi. Pode ter ficado `acordos: []` nessa pessoa. Não aparece em tela.
14. Nunca vi o site publicado depois do Vercel (envios e correções da master).
15. A tabela de Negociações em visão estreita (Combinados avulsos usa 9 colunas): não conferi em tela pequena.

Outros:
16. `versoes.js` na master estava quebrado por entradas de outras conversas. Corrigi duas. Existem números de versão repetidos antigos (0.21.4, 0.21.5, 0.21.6). Alguém precisa renumerar.
17. A trava do Claude Code barrou o `git push` três vezes. Sem regra de permissão, cada envio exige o Marcus.

## 4. Perguntas prontas para o Marcus
1. **Libero o Canal de denúncias para o seu pai?** Recomendo **não**: o canal é anônimo e pode citar sócio. Se sim, preciso acrescentar o código dele em dois lugares (servidor e tela) e ele passa a ler tudo. Se não, nada muda.
2. **Combinados avulsos devem entrar sozinhos em Salário e bônus e em Joias pagamentos quando virarem Pago?** Recomendo **sim, em uma segunda etapa**. Se sim, o dinheiro soma em Salário e as joias viram um pagamento de joias. Se não, o RH lança duas vezes.
3. **Bate ponto deve mudar a Presença diária?** Recomendo **sim**: quem tem "Não" naquele dia não conta como falta. Se não, a marca fica só como lembrete.
4. **A tabela padrão de hora extra ganha colunas de valor em joias (1h, 2h, 3h, sábado)?** Recomendo **sim**, se você paga em joias com frequência. Se não, só usa Combinados avulsos.
5. **O Puxar do Financeiro deve ler 2022 a 2025?** Recomendo **ano por ano**, a partir de 2025. Ler tudo de uma vez é pesado e traz muita gente que já saiu.

## 5. Pode arquivar?
**Sim, com duas ressalvas.** Todo o código está na master e a worktree está limpa. Antes de arquivar: (a) registrar as decisões de Negociações em `docs/DECISOES.md` e em `docs/setores/rh/decisoes.md`; (b) o Marcus conferir o site publicado (pendência 5). O resto são decisões e ações do Marcus, que estão listadas acima.

# Acessos, contas e chat: o que foi combinado (27 e 28/10/2026)

Pedido do Marcus: abrir o sistema novo para os funcionários em 28/10/2026, setor por setor. Regra dele: "Só vou liberar para outros funcionários quando acertar bem com esses".
Este documento junta tudo o que ficou decidido. Decisões curtas também estão em `docs/DECISOES.md`.

## 1. Grupos de acesso (menu)

| Grupo | Quem | Configuradores |
|---|---|---|
| Acesso total | Marcus e Leonardo | Vê |
| Direção | Anamaria, Lucas, Priscila, Maria Claudia, Amanda de Miranda, Nickolas, Marco Antonio, Ana Beatriz | Não vê |
| Supervisão da montagem | Deysiane | Como antes |
| Demais setores | Agendamento, Financeiro, Bipagem, Montagem, Listagens, Kit novo, Cadastro de peças | Cada um abre só o que é do setor |

- Só o **grupo do menu** mudou. As ações de cada pessoa (papel em `papelDe`) seguem como antes.
- O Marcus ajusta o acesso de cada pessoa da Direção em RH → Acessos.
- Código: `grupoDe` em `domain/equipe.js`; rótulos em `navigation/perfis.js` e `domain/equipes.js`; lista "Atuar como outra pessoa" em `components/seletor-acesso.js`.
- Cada conta pode ter **grupo de acesso**, **contato do chat** e **nome** próprios (funcionário fora da lista de 43 nomes). Colunas `grupo` e `cid` em `sorelly.conta` (`scripts/migrar-grupo.mjs`).
- Conta ligada a pessoa que não está em `EQUIPE` recebe só o básico (Início e Chat).

## 2. Quem vê dinheiro

| Pessoa | Valores da linha no Consolidado | Totais e placar | Comissão própria |
|---|---|---|---|
| Bipadora (envio e acerto) | Vê, para conferir o acerto | Não | Só no último dia do mês |
| Agendamento | Vê | Não | n/a |
| Montadora | Não | Não | Não |
| Direção e financeiro | Vê | Vê | Vê |

## 3. Contas e senhas das equipes

- 23 contas criadas: Bipagem (10), Montagem (10) e Encomendas (3). Login simples e senha provisória (`scripts/criar-contas-setor.mjs`).
- Tela **Senhas para enviar** em RH → Acessos e autorizações → Contas (só Diretoria): usuário, senha, botão "Copiar mensagem" e "Nova senha". A senha provisória some quando a pessoa troca a própria senha.
- A lista de senhas NÃO fica no Git.

## 4. O que cada grupo vê ao entrar

- Montadora e bipadora **abrem direto no SorellyChat**. Não veem Condicionais, Rotina nem o "Admin antigo".
- A montadora tem lista própria de telas: Listagens sem valor, app, Produção e Preferências do kit.
- "Admin antigo" só aparece para quem tem perfil ADMIN.
- As abas abertas não passam de uma conta para outra (limpam ao entrar e ao sair).
- "Atuar como outra pessoa" e a página Apps: só Marcus, Nickolas e Lucas.

## 5. Chat

- Conversas e mensagens ficam no banco (`sorelly.chat_conv`, `sorelly.chat_msg`). A equipe conversa entre si.
- A conversa com o Marcus fica sempre no alto da lista de todos.
- Mensagem comum: aviso discreto (som baixo, pulso e contador). Cartão grande só para o Marcus e para quem for marcado com @.
- O Marcus quer poder consultar as conversas depois. **Nenhuma tela de rastreio foi criada.** Recomendação: avisar a equipe (LGPD) em termo de uso ou contrato.

## 6. Testes feitos

- Chat entre duas contas (Pamela → Natasha) com contador de não lida: funcionou. A mensagem de teste foi apagada do banco.
- Celular (375 px): chat e Listagens sem rolagem para o lado.

## 7. O que falta

| Item | Estado |
|---|---|
| Testar em produção: chat, tela de senhas, entrada direto no chat | Pendente |
| Limitar quem as funcionárias veem no chat (hoje veem a Diretoria) | Pendente, perguntar ao Marcus |
| Regras de permissão no servidor (aprovar, retornar kit, definir valor, retirar) | Pendente (Fase C) |
| Topo no celular: nome e setor cortados | Pendente |
| Tirar "condicionais" da lista da bipadora | Pendente |
| Celular simulado: Gabrielly e Maria Eduarda (bipagem) sem acesso (`BIP7` em `mobile/app-funcionarias.js`) | Pendente |
| Endereço `/whatssorelly`: Marcus disse que "não muda nada" | Sem diagnóstico; perguntar login e endereço |
| Apps da representante e da revendedora | São esboço para o Leonardo copiar; não corrigir detalhes |

## 8. Atualização de 28/10/2026 (tarde)

- **Nickolas passou para Acesso total**, igual ao Marcus (conta com `grupo = supervisao`; `grupoDe(17)` em `domain/equipe.js`). Acesso total agora: Marcus, Nickolas e Leonardo.
- **Agendamento: contas** Ana Maria, Mariana e Tamara (pessoas 24, 25 e 26). Marcus começou **só pela Tamara**. O menu dela é individual (coluna `abas` da conta): Atendimento interno (4 telas), Painel, Plano 45/60, Remarcações, Representantes (cotas), Análises, Histórico, Consolidado Representante, Controle de kits e Inadimplência. Sem Dinheiro, Abertura do mês nem Configurador.
- **O menu da conta só restringe** o menu do grupo; não acrescenta telas. Por isso as 4 telas do Atendimento interno entraram na lista do grupo Agendamento (`ABAS_PERFIL.agendamento`).
- **Atendimento interno · Revendedoras agora é compartilhado** (módulo `ri` = `s.revInternas`, sincronizado pelo servidor; permissão do setor Agendamento). Antes, ficava só no navegador de cada pessoa.
- A leitura das revendedoras do vendedor Sorelly (`/api/revendedoras?rep=02`) está liberada ao Agendamento. A lista geral continua só da Diretoria.
- Ao abrir a tela, o sistema busca sozinho na DevMaster: **203 revendedoras**, das quais **60 já vêm com agenda** preenchida pelas anotações escritas nas condicionais. As demais não têm data escrita nas anotações.
- Limitação: o módulo grava a lista inteira. Duas pessoas editando ao mesmo tempo, a última gravação vale.

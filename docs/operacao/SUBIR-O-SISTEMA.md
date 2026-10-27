# Subir o sistema novo para a equipe usar (plano, 22/10/2026)

Objetivo do Marcus: a equipe passa a usar ESTE sistema logo (dias, não meses), sem parar a operação, e as mudanças feitas aqui chegam lá todo dia.
Como: o front já salva tudo no servidor pelo atalho do **estado dos módulos** (cada módulo = um bloco guardado no banco). O admin antigo NÃO é desligado nem alterado: continua cuidando do que ainda não foi trocado (Meta, Kommo, DevMaster, o que a equipe ainda lança lá). Só leitura nele, sempre.

## Subir por fases: o menu mostra só o que está pronto (22/10/2026)
- Variável `NEXT_PUBLIC_SETORES_LIGADOS` (ex.: `whats,rotina,rh,estoque`) escolhe quais setores aparecem no menu da equipe; os ids estão em `navigation/setores.js`. Vazia = tudo aparece. Para testar sem gerar de novo: `localStorage.setItem("sorelly_setores", "whats,rotina,rh,estoque")`.
- Variável `NEXT_PUBLIC_ADMIN_ANTIGO_URL` coloca no fim do menu o atalho "↗ Admin antigo" (abre em outra aba): o que ainda não foi trocado a equipe faz lá, sem parar.
- Esconder um setor é só visual (não é bloqueio): o bloqueio de verdade é a permissão por setor no servidor.
- Módulos que se conectam (Financeiro, Contas a pagar, Financeiro familiar, Faturamento, Caixa, Cobrança e a Visão geral) entram JUNTOS numa mesma fase, porque um lê o outro. Módulos mais soltos para a 1ª fase: Rotina do dia, Recursos Humanos, Materiais & Estoque (Compras) e Cadastro de peças.

## O que precisa existir (nesta ordem)
1. **Banco** (Postgres): o schema `sorelly` já existe no banco de teste (`banco/schema.sql`). Em produção: criar o mesmo schema, ligar backup automático diário.
2. **Servidor + tela** (desde 22/10/2026 são UM projeto só, Next.js: a API fica em `app/api/*`, código em `src/server/`) na AWS, com HTTPS e endereço fixo. `npm run build` e `npm run start` (ou contêiner). Variáveis do servidor: `DATABASE_URL`, `JWT_SECRET` (texto longo e aleatório), `DEVMASTER_API_URL`/`DEVMASTER_API_KEY` (opcional). Não existe mais `ORIGENS`: tela e API têm o mesmo endereço.
3. **Hospedagem** do Next (AWS Amplify Hosting, contêiner ou servidor Node) ligada ao GitHub: a cada `git push` ele se atualiza sozinho. Na geração: `NEXT_PUBLIC_API_URL=/api` (liga o login e a gravação no servidor).
4. **Contas (desde 26/10/2026):** rodar `npm run migrar-contas` uma vez e criar a primeira conta da Diretoria com `npm run criar-admin -- email "senha (8 ou mais)" "Nome" 16`. Depois cada pessoa cria a própria conta na tela de entrada (fica Aguardando) e a Diretoria libera em RH → Acessos e autorizações → Contas, escolhendo a pessoa do sistema e os setores. Liberar, bloquear e trocar setor valem na hora. O jeito antigo (tabela `user` + `definir-senha`) continua funcionando.
   (jeito antigo, opcional) **Pessoas**: para cada funcionário, existir na tabela `user` e rodar `npm run definir-senha -- email "senha" <idDaPessoaNoSistema> <setor1,setor2>`. O id da pessoa está em `src/apps/montagem/domain/equipe.js`; os setores válidos estão em `src/server/permissoes.js` (`rh, cobranca, socios, financeiro, linkpag, agendamento, cadastro, kitsnovos, montagem, producao, encomendas, pecas, marketing, garantia`). Diretoria = perfil ADMIN na tabela `user`.
5. **Carga inicial** (só a Diretoria): o Marcus abre o sistema NO COMPUTADOR DELE (onde estão os dados reais dos arquivos `.local`) já ligado ao servidor; cada módulo sobe sozinho na primeira vez. O servidor recusa a primeira gravação de qualquer outra pessoa (para um navegador com dados de demonstração nunca subir por cima). Conferir módulo por módulo (totais) antes de a equipe entrar.
6. **Equipe entra por setor**, um setor por vez, começando por quem não depende do admin antigo.

## Atualizar todo dia
- O Marcus pede a mudança aqui, o Claude altera e testa, depois `git push` (só quando o Marcus mandar). A hospedagem publica sozinha.
- Os dados ficam no banco, não no código: publicar não apaga nada. Se o formato de um módulo mudar, o código migra o que já está salvo (como `rotMigrar`, `ceMigrar`).
- Mudou algo que quebra? Voltar para a versão anterior na hospedagem (um clique).

## Limites conhecidos deste atalho (resolver antes de crescer)
- Permissão é por MÓDULO inteiro (ex.: quem abre Compras vê todos os pedidos; "só os próprios" é regra da tela). Dado sensível fica em módulo de setor restrito (RH, Cobrança, Financeiro familiar).
- Duas pessoas mexendo na MESMA chave do mesmo módulo ao mesmo tempo: vale a última gravação. Chaves grandes (ex.: presença do mês inteiro) devem ser divididas por dia/pessoa quando isso incomodar.
- Atualização entre pessoas a cada 20 segundos (não é instantâneo).
- Notificação só com o sistema aberto no navegador.
- Rotinas que hoje rodam no computador do Marcus (atualização diária do admin antigo, presença do RH às 3h30) precisam ir para o servidor.
- Anexos (PDF, fotos, assinatura) ainda ficam no navegador de quem anexou; precisam de um local de arquivos (S3).
- Depois: desmembrar cada módulo nas tabelas finais (as 168 do schema), um por vez, sem parar ninguém.

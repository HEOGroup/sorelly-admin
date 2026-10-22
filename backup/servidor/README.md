# Servidor do Sorelly Admin

Node + Fastify + Postgres. Primeira parte: **login** e **Rotina do dia**. O resto dos módulos entra um por vez.

## Rodar
```
cd servidor
npm install
cp .env.exemplo .env      # preencha DATABASE_URL e JWT_SECRET
npm run dev               # http://localhost:3333
```
Variáveis: `DATABASE_URL`, `JWT_SECRET`, `PORT` (3333), `ORIGENS` (endereços do front liberados, separados por vírgula).

## Banco
Estrutura em `../banco/schema.sql` (schema `sorelly`, 168 tabelas vazias, mesmos nomes do admin antigo). O login usa a tabela `public."user"`.
Com pooler do Neon não dá para usar `search_path` na conexão: os comandos já escrevem `sorelly.tabela`.

## Login
- `POST /auth/login` `{email, senha}` → `{token, usuario}` (JWT de 12 h; mandar `Authorization: Bearer <token>`).
- `GET /auth/eu` → quem está logado.
- Definir a senha de alguém que já existe em `user`:
  `node scripts/definir-senha.js email@dela.com "senha" 16` (o último número liga a pessoa ao id dela no sistema novo, ex. 16 = Marcus).
- Perfil `ADMIN` = Diretoria (vê e muda tudo). `MEMBER` = vê e marca só o que é dele.

## Rotina do dia
- `GET /rotina/itens` · `POST /rotina/itens` (Diretoria) · `PATCH /rotina/itens/:id` (Diretoria) · `DELETE /rotina/itens/:id` (Diretoria)
- `GET /rotina/registros?data=AAAA-MM-DD` → quem já marcou como feito naquele dia
- `PUT /rotina/registros` `{itemId, data, feito}` → marca ou desmarca (só quem faz o item, ou a Diretoria; quem não é Diretoria só marca o dia de hoje)

## Estado dos módulos (atalho para ligar vários módulos já)
- `GET /estado/:modulo` → `{versao, conteudo}` · `PUT /estado/:modulo` `{chaves:{...}}` (junta só as chaves enviadas; versão sobe a cada gravação). Tabela `sorelly.estado_modulo`.
- O front (`src/apps/montagem/lib/sync-modulos.js`) busca a cada 20 s e envia 1 s depois de mexer, só as chaves que mudaram. Módulo vazio no servidor: o navegador de quem abrir primeiro sobe como ponto de partida.
- Quais módulos: `VITE_MODULOS_SERVIDOR=rh,cf` (padrão: só `rh`). Chaves são as do estado do front (`rh`, `cf` cobrança, `ce` compras, `ff` financeiro familiar, `pf` fornecedores...).
- É provisório: depois cada módulo é desmembrado nas tabelas finais do schema `sorelly`, uma de cada vez. Atenção: quem abrir primeiro leva os dados que tem no navegador para o servidor (no RH, isso inclui dados de folha: só ligar com o Marcus/Leonardo cientes).
- Permissão por módulo ainda não existe (qualquer pessoa logada lê e grava): é o próximo ajuste antes de produção.

## DevMaster (lista de revendedoras)
- Contrato copiado do admin antigo (`apps/backend/src/lib/indicacoes/devmaster*.ts`): `GET {DEVMASTER_API_URL}/appsorelly/revendedoras` com o cabeçalho `token: <chave>`; devolve `[{id, nome, cpfcnpj, email, celular, municipio, uf, vendedor, nome_fantasia}]`. Só leitura; nada é escrito na DevMaster.
- Variáveis no `.env`: `DEVMASTER_API_URL` (a do antigo é `https://app.sorelly.indepcloud.com.br:28576`) e `DEVMASTER_API_KEY` (mesma chave do `.env` do backend antigo; NUNCA no Git nem no front).
- Rotas: `GET /devmaster/revendedoras?vendedor=02&busca=&atualizar=1` · `GET /devmaster/vendedores` (mostra como cada representante aparece no campo `vendedor`) · `POST /devmaster/sincronizar-internas {vendedor:"02"}` (Diretoria; grava em `sorelly.atendimento_revendedora` pelo `codigoExterno`: cria as novas, atualiza nome e telefone). Cache de 10 min.
- Front: botão "Buscar da DevMaster" em Atendimento interno → Revendedoras (chama `/devmaster/revendedoras?vendedor=02` e cadastra aqui as que faltam, como "A contatar", ciclo de 30 dias).
- Testado contra uma DevMaster FALSA (dados inventados) e contra o banco de teste; falta testar com a chave de verdade. A confirmar com a DevMaster: como o "Sorelly 02" aparece em `vendedor` e se existe indicação de revendedora ativa/inativa (a lista não traz esse campo).

## Combinados de partida
`DATABASE_URL=... node scripts/semear-rotina.js` cria os 10 combinados da Rotina do dia (só se a tabela estiver vazia).

## Ligar o front (já feito para Login e Rotina do dia)
- Na pasta do front, crie `.env.local` com `VITE_API_URL=http://localhost:3333` (ou o endereço do servidor) e rode `npm run dev`. Sem essa variável o front funciona como antes (dados no navegador, sem login).
- Para testar sem reiniciar: no navegador, `localStorage.setItem("sorelly_api_url", "http://localhost:3333")`.
- O servidor precisa ter o endereço do front em `ORIGENS`.
- Código do front: `src/apps/montagem/lib/api.js` (pedidos), `components/tela-entrar.js` (entrada), `pages/Rotina.js` e `App.js` (sincronização a cada minuto).

## O que falta
Ligar o front a estas rotas (hoje ele guarda no navegador), notificação com o sistema fechado, e os demais módulos (RH, Financeiro familiar, Cobrança, Compras...). Antes de ir para a AWS: trocar `JWT_SECRET`, usar a `DATABASE_URL` de produção e limitar `ORIGENS`.

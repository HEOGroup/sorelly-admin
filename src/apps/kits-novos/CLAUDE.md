# Kits novos (Curitiba)

Elo entre o cadastro de revendedoras e a montagem de kits. Setor responsável: Kits novos e Indicação (hoje Michele; supervisor Nickolas).

## Fluxo do setor
1. Recebe do Cadastro as revendedoras novas (sem vendas), já com o valor do kit definido.
2. Contato com a novata, define rota e representante responsável por localização e km.
3. Solicita o kit na DevMaster e envia a listagem.
4. Acompanha bipagem e condicional no prazo; atualiza o status até a entrega.
- Direciona para a representante (que coloca na listagem dela pelo app) ou coloca direto na listagem. A Sorelly conta como uma representante também, com listagem própria.
- Fora do prazo de 48 h: só com autorização de Marcus ou Nickolas, e a representante entra como atrasado.
- Kit novo pode ser marcado para 4 ou 5 dias depois, porque se encaixa na listagem/rota da representante. Isso NÃO é bug.
- Pode ir com expositor.
- Marcar quem **recusa** kits novos e quantos cada representante aceitou ou recusou. O envio é "aleatório" por enquanto, a acompanhar (rodízio/aceite: a definir).
- Indicação: Kommo → confere dados e localização → análise → documentos → Cadastro → acompanha → após a entrega, atualiza planilhas e libera os coins da indicadora. Brindes: agenda retirada com a indicadora e dá baixa.

## Entrada pela Kommo (25/11/2026; substitui o admin antigo)
- A aprovada na Kommo (lead entra no funil Aprovadas, ou 142 no Cadastro) vira kit em **Cadastrada**, id `LK<lead>`, sozinha, a cada 2 min (`src/server/kits-novos-kommo.js`, regras puras em `kits-novos-kommo-regras.js`, teste `scripts/testar-kits-novos-kommo.mjs`). Lead em "kit liberado" no funil Aprovadas leva o kit para **Liberado**. Só LÊ a Kommo. Liga com `KITS_NOVOS_KOMMO=1`.
- Não duplica quem veio da planilha (telefone, ou nome com cadastro até 120 dias): o kit antigo só ganha `kId`. Carga de período: `scripts/kits-novos-kommo-carga.mjs --desde=AAAA-MM-DD [--aplicar]`.
- Campos novos no kit: `kId`, `kEt`/`kEm` (etapa na Kommo), `end`, `tel`, `app` (resposta do app gravada pelo servidor), `recs` (recusas: contam no bloqueio), `excluido` (marca de exclusão da Diretoria). Configurador no servidor (chave `cfg` do kndados), com `recusasBloqueio` e `repBloq`.

## Telas e dados
- 5 abas (Kits, Pendências, Consolidado, Regras, Configurador). Dados: planilha da Michele (importada até 23/11/2026) e, desde 25/11/2026, a Kommo, no módulo `kndados` do servidor, lido por `data/dados.js` ao abrir; NUNCA no Git (dados pessoais, repositório público). Etapas: Cadastrada, Liberado, Solicitado, Bipado, Entregue (mais Devolvido e Cancelado).
- Regiões Litoral, Ponta Grossa, Maringá, Joinville e Santa Catarina: "em breve".
- App da representante mostra 3 contatos de referência (quem é + botão de WhatsApp) e endereço de casa e trabalho. Tela de Revendedoras tem filtro para kits novos.

## Acesso
O setor vê só a tela de Kit novo, com os valores dos kits. Não vê comissões nem as demais telas.

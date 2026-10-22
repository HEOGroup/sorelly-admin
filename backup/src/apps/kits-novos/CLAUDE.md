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

## Telas e dados
- 5 abas (Kits, Pendências, Consolidado, Regras, Configurador). Dados: `public/dados/kits-novos-curitiba.json` (~2.005 registros), carregado só quando o app abre. NÃO abra esse arquivo.
- Regiões Litoral, Ponta Grossa, Maringá, Joinville e Santa Catarina: "em breve".
- App da representante mostra 3 contatos de referência (quem é + botão de WhatsApp) e endereço de casa e trabalho. Tela de Revendedoras tem filtro para kits novos.

## Acesso
O setor vê só a tela de Kit novo, com os valores dos kits. Não vê comissões nem as demais telas.

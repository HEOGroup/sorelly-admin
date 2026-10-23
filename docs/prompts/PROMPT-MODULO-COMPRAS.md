MÓDULO A CRIAR: COMPRAS E ESTOQUE DE MATERIAL (com fornecedores)

Siga o PROMPT MESTRE acima em tudo. Abaixo está o que é específico deste módulo. Cor do setor: azul #3B82F6 (Financeiro/Compras). Setor no menu: "Materiais e estoque" (compras e estoque de material). O ESTOQUE SORELLY (estoque geral de joias mês a mês) NÃO faz parte: fica no Financeiro, é outro módulo.

A. NEGÓCIO: COMPRAS

Para que serve: registrar, aprovar, efetuar, receber e pagar qualquer compra da empresa: cadeiras, equipamentos, material de escritório, embalagens, etiquetas, insumos, serviços etc. Não é compra de joias para revenda (isso é outro processo).

Quem faz o quê é CONFIGURÁVEL POR PESSOA (não fixo): vários funcionários negociam compras, então qualquer pessoa marcada pode criar solicitações. O dono (ou quem ele autorizar) define as autorizações numa tela própria (item D abaixo). Ex.: um sócio negocia cadeiras, um supervisor de montagem negocia embalagens, o financeiro aprova e efetua.

3.1 Cadastros
- Pessoas: nome, setor, ativo/inativo. (O sistema principal tem a lista real; aqui é um cadastro simples.)
- Fornecedores: nome, CNPJ/CPF (opcional, com máscara e validação de dígitos), telefone/WhatsApp, e-mail, cidade, observações, ativo. Edição em Janela em colunas. Busca por nome/CNPJ. Indicadores por fornecedor: total comprado no ano, nº de compras, última compra.
- Classificações (lista editável em Configurações), cada uma com a regra "entra no estoque?": *Material (entra)*, *Insumo/consumo (entra)*, *Patrimônio/equipamento (não entra)*, *Serviço (não entra)*, *Outros (não entra)*.
- CNPJs pagadores (lista editável): 34, 46, 59, 67, H&O (nome + final do CNPJ; não grave CNPJ completo real no código: o dono cadastra na tela).
- Materiais (para estoque): nome, unidade (un, cx, pct, m, kg...), estoque mínimo, categoria, ativo.
- Centros de custo/setor solicitante (lista editável: Montagem, Bipagem, Marketing, RH, Escritório...).

3.2 A compra (modelo de dados)
```
compra: {
  id (sequencial legível, ex.: C-0001), criadaEm, criadaPor (pessoaId),
  fornecedorId, setorSolicitante, classificacao,
  itens: [{ id, descricao, materialId?, quantidade, unidade, valorUnitario }],   // total = soma
  valorTotal (calculado), desconto?, frete?,
  cnpjPagadorId, prazoEntrega (data), condicoes (texto), observacoes,
  anexos: [{ nome, tipo, dataUrl }]  // foto/PDF do orçamento, nota, comprovantes (limite ~3MB cada, guardado no navegador)
  status: "solicitada" | "aprovada" | "reprovada" | "efetuada" | "recebida_parcial" | "recebida" | "cancelada",
  plano: [{ id, forma, valor, vencimento, observacao }],
  aprovacao: { por, em, nota }, reprovacao: { por, em, motivo },
  efetuadaPor, efetuadaEm, numeroPedidoFornecedor?, notaFiscal?,
  recebimentos: [{ id, em, por, itens:[{itemId, quantidade}], nota }],
  enviadaPagamentos: { em, por } | null,
  historico: [{ em, por, de, para, nota }]      // toda mudança de etapa
}
```
Formas de pagamento (lista editável): Pix de revendedora, Pix da empresa, boleto, cartão (com nº de parcelas), dinheiro, transferência, outro.

3.3 Máquina de estados (kanban)
Colunas: Solicitada → Aprovada → Efetuada → Recebida e as saídas Reprovada e Cancelada (+ "Recebida parcial" como coluna intermediária ou selo na coluna Efetuada, escolha a que ficar mais clara e explique).

| De | Para | Quem pode (autorização) | Regra |
|---|---|---|---|
| (nova) | Solicitada | criar solicitação | exige fornecedor, ao menos 1 item, classificação e CNPJ pagador; plano de pagamento pode ficar para depois |
| Solicitada | Aprovada | aprovar compras | grava quem aprovou, quando e nota; quem criou não aprova a própria compra acima do limite configurado (limite em R$, padrão: sem limite; ligar/desligar em Configurações) |
| Solicitada | Reprovada | aprovar compras | motivo obrigatório |
| Reprovada | Solicitada | criar solicitação (dono da compra) ou aprovar | "Reabrir", com nota |
| Aprovada | Efetuada | efetuar compras | plano de pagamento fechado (soma = total, tolerância R$ 0,01); pede nº do pedido/NF (opcional) |
| Efetuada | Recebida parcial / Recebida | receber mercadoria | registra o que chegou por item; recebido total quando todos os itens chegaram |
| Qualquer antes de Recebida | Cancelada | cancelar compras | motivo obrigatório; se já enviada para pagamentos, avisar que o financeiro precisa estornar |
| Efetuada/Recebida | Enviada para pagamentos (marca, não é coluna) | enviar para pagamentos | ver 3.5 |
Movimentos fora da tabela (pular etapa, voltar sem permissão) são recusados com mensagem formal ("Aprove a compra antes de efetuar"). Arrastar, "Mover para…" e "Concluir etapa ›" usam as mesmas regras. Voltar etapa só com autorização e nota obrigatória.

3.4 Plano de pagamento
Dentro da compra, partes com forma, valor (campo de dinheiro padrão) e vencimento. Botão "Dividir o restante" cria a próxima parte com o que falta. Mostra Soma / Total / Diferença (diferença em vermelho; bloqueia "Efetuar" enquanto não fechar). Exemplo real: cadeiras de R$ 10.000,00 = R$ 4.000,00 em Pix de revendedora + R$ 3.000,00 em Pix da empresa + R$ 3.000,00 em boleto. Cartão aceita nº de parcelas e gera as parcelas mensais.

3.5 Envio para pagamentos (integração futura, deixe pronta)
Depois de Efetuada, quem tem autorização usa "Enviar para pagamentos". O módulo não paga nada; abre uma janela de conferência (em colunas) e gera/guarda dois objetos, usando uma função pura `compraParaPagamentos(compra)`:
```
pedidoPagamentos: { fornecedor:{nome,cnpj}, numero, data, total, cnpjPagador,
                    parcelas:[{ forma, vencimento, valor }] }
orientacoesPix:   [{ destino:{ tipo:"FORNECEDOR", nome }, valor, ate: vencimento,
                    observacao:"Compra C-0001 · cadeiras" }]   // uma por parte em "Pix de revendedora"
```
Marca `enviadaPagamentos:{em,por}` e impede enviar duas vezes (permite "ver o que foi enviado"). Um botão "Copiar JSON" para o dono colar no sistema principal enquanto a integração não existe.

3.6 Estoque de material (no mesmo módulo; NÃO é o estoque de joias)
- Entra por recebimento de compra cuja classificação "entra no estoque" (usa `materialId` dos itens; item sem material vincula/cria na hora, com aviso).
- Movimentações: entrada (compra/ajuste), saída (retirada: quem retirou, setor, motivo), ajuste (inventário, com motivo obrigatório). Toda movimentação guarda quem/quando e não pode ficar negativa (recusar com mensagem).
- Saldo atual por material, estoque mínimo e alerta de estoque baixo (cartão âmbar/vermelho) + indicador no topo; sugestão "Comprar" que abre uma nova solicitação já com o material.
- Custo: guarde o último custo e o custo médio por material (mostre os dois).
- Histórico por material (linha do tempo) e planilha de movimentações com filtros (período, material, tipo, pessoa) e total do filtro.

3.7 Alertas e relatórios
- Indicadores clicáveis no topo (cada um abre a lista filtrada): Solicitadas (âmbar), Aguardando aprovação (âmbar, mostrando há quantos dias o mais antigo espera), Aprovadas a efetuar, A receber, Atrasadas (prazo de entrega vencido, vermelho), Total do mês (azul).
- Aviso de atraso da aprovação (configurável, padrão 2 dias) e da entrega.
- Relatório mensal: total por classificação, por fornecedor, por CNPJ pagador, por setor solicitante e por forma de pagamento; exportar CSV (separador `;`, vírgula decimal, BOM para Excel) e imprimir.
- Busca global (Ctrl+F do sistema) e busca por nome/nº/fornecedor.

---

B. TELAS (abas dentro de UMA tela "Compras e estoque")
1. Quadro de compras (kanban): faixa de indicadores + barra de filtros + colunas. Cartão compacto: nº, fornecedor, valor total, solicitante (iniciais em bolinha), CNPJ pagador, selo de tempo na etapa (até 2 dias verde, até 6 âmbar, 7+ vermelho), selo "Parcial" se for o caso, ícone de anexo. Clique abre o detalhe.
2. Planilha de compras: tabela centralizada com filtros (período, fornecedor, CNPJ, classificação, situação, solicitante), total do filtro, exportar CSV; arrastar para o lado.
3. Fornecedores: mosaico de cartões + janela em colunas.
4. Estoque de material: mosaico de cartões com saldo, mínimo, barra de nível e alerta.
5. Movimentações: planilha com filtros.
6. Configurações: classificações (com "entra no estoque"), CNPJs pagadores, formas de pagamento, setores, prazos de alerta, limite de aprovação; tudo em blocos lado a lado (mosaico).
7. Autorizações (item D abaixo).
8. Versões e Padrão visual (página de exemplo das peças).
Detalhe da compra (janela em 3 colunas): esquerda = fornecedor, classificação, CNPJ pagador, prazos, itens (tabela editável compacta) e anexos; meio = linha do tempo das etapas (Solicitada → Aprovada → Efetuada → Recebida) com quem/quando/nota, etapa atual em destaque, e o plano de pagamento; direita = ações permitidas ao usuário atual (Aprovar, Reprovar, Efetuar, Receber, Enviar para pagamentos, Cancelar, Editar), observações e histórico. Botões que a pessoa não tem autorização aparecem desabilitados com a dica "Sem autorização".

---

C. REGRAS DE INTEGRIDADE E BORDAS
- Valores sempre em centavos inteiros internamente (evita erro de ponto flutuante); formatar só na tela.
- Editar compra depois de aprovada exige autorização e volta para "Solicitada" ou exige nota e registra no histórico (escolha uma e explique).
- Excluir compra só se "Solicitada" e do próprio criador; senão, só cancelar.
- Recebimento maior que o pedido: recusar com aviso, ou aceitar com nota (configurável).
- Anexos: limitar tamanho, comprimir foto para JPEG ~900px; avisar se estourar o limite do navegador.
- Dados por navegador: avisar de forma discreta e formal que, enquanto não houver servidor, os dados ficam só neste computador; oferecer exportar/importar backup (JSON).

---

D. AUTORIZAÇÕES (por pessoa, configurável)
Tela "Quem pode fazer o quê": uma lista de autorizações, cada uma como cartão com as pessoas marcadas (chips com "×") e um seletor "+ Adicionar pessoa". Quem altera: só quem tiver a autorização "Gerenciar autorizações" (padrão: o dono). Efeito imediato.
Autorizações mínimas (cada uma separada): Criar solicitação de compra; Ver todas as compras (senão vê só as próprias); Aprovar ou reprovar; Efetuar compra; Receber mercadoria; Enviar para pagamentos; Cancelar compra; Movimentar estoque; Gerenciar cadastros e configurações; Gerenciar autorizações. Opcional por faixa: limite de aprovação por pessoa (R$) — acima dele só outra pessoa aprova.
Sem tela de login: o usuário atual vem do seletor no topo (e as ações respeitam as autorizações dele).

---

E. CRITÉRIOS DE ACEITE ESPECÍFICOS
- [ ] Nasce vazio; botão de exemplo funciona e some com os dados.
- [ ] Qualquer pessoa autorizada cria solicitação; sem autorização, o botão fica desabilitado com dica.
- [ ] Kanban: arrastar, "Mover para…" e "Concluir etapa ›" respeitam a tabela de transições e mostram mensagens formais.
- [ ] Reprovar e cancelar exigem motivo. Voltar etapa exige nota.
- [ ] Efetuar só com plano de pagamento fechado (R$ 0,01 de tolerância).
- [ ] Recebimento parcial e total; entrada no estoque conforme a classificação; saldo nunca negativo.
- [ ] "Enviar para pagamentos" gera os dois objetos corretos (pedido e orientações de Pix só das partes em Pix de revendedora) e não permite duplicar.
- [ ] Estoque: mínimo, alerta, último custo e custo médio.
- [ ] Indicadores sobem com som baixo; respeitam reduzir movimento.
- [ ] Padrão visual: tudo centralizado, compacto, sem barra de rolagem em bloco, sem buracos (tetris), degradê claro, textos formais, filtros alinhados, janela em colunas, Ctrl+F, arrastar tabela, Voltar.
- [ ] Testado em 500px e 1500px; sem erro no console.
- [ ] Testes automatizados das regras passando; dados de teste limpos.


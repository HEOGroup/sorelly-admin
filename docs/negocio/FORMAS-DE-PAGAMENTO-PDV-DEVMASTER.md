# Formas de pagamento do PDV da DevMaster (foto de 20/11/2026)

Lista tirada do "Painel Pagamento" que abre quando se fecha uma venda no PDV (5 fotos que o Marcus mandou em 20/11/2026). O traço "-" é uma linha de separação que a própria DevMaster usa. Entre uma foto e outra pode haver linhas que não apareceram.

## 1. A lista, na ordem da tela

| Bloco (como aparece na tela) | Formas |
|---|---|
| Início da lista | DÉBITO - CIELO - P · PIX SICREDI H&O · VENDA CARREGAR · ACERTO - LOJA · ACERTO - LOJA INTERNO · DINHEIRO |
| Fornecedores e caixas | PIX - POINT · PIX MEGA SUL · PIX XANGAI · PIX - DEVMASTER · PIX - BANHO · PIX - TUCANO · PIX - 3D ACRILICOS · PIX CHARME · PIX ELLOS BRUTOS · PIX ART ELLO · PIX - MADEIRA COR · PIX PRESTADORES DE SERVIÇOS · PIX LINDA · PIX - OFFICE GRAF LTDA · PIX PRODUÇÃO DE PEÇAS · PIX REPRESENTANTES |
| CNPJ 59 (Serenity) | LINK - SICREDI - SERENITY - 59 · PIX - SICREDI - SERENITY - 59 · CRÉDITO - SICREDI - SERENITY - 59 · CRÉDITO - BRADESCO CIELO - SERENITY - 59 · CRÉDITO - SAFRA - SERENITY 59 · PIX - ITAÚ - 59 · PIX - SAFRA - SERENITY - 59 · DÉBITO - SICREDI - SERENITY - 59 · CRÉDITO - ITAÚ - SERENITY · DÉBITO - BRADESCO CIELO - SERENITY - 59 · DÉBITO - ITAÚ - SERENITY · DÉBITO - SAFRA - SERENITY 59 |
| CNPJ 46 (Mayz) | CRÉDITO - SAFRA - 46 · DÉBITO - SAFRA - 46 · LINK - SICREDI - SORELLY - 46 · PIX BRADESCO - SHOPPING 46 · PIX - CAIXA - 46 · PIX - SAFRA - SHOPPING - 46 · PIX - STONE - 46 · PIX - UNICRED - 46 · PIX - SICREDI - SHOPPING 46 |
| Pessoas | PIX - CAIXA ECONÔMICA - ANAMARIA · PIX - SANTANDER - ANAMARIA · PIX - LUCAS - PF · PIX - ANA BEATRIZ - PF · PIX - MARCUS HESS - PF · PIX - ITAÚ PJ - MARCO · PIX - ITAÚ PF - MARCO ANTÔNIO |
| Maquininhas P (Pontual) | CRÉDITO - GETNET - P · DÉBITO - GETNET- P · CRÉDITO - CIELO - P |
| CNPJ 34 (Sorelly) | CRÉDITO - SICREDI - SORELLY - 34 · DÉBITO - SICREDI - SORELLY - 34 · CRÉDITO - SAFRA - SORELLY - 34 · DÉBITO - SAFRA - SORELLY - 34 · LINK - SICREDI - SORELLY - 34 · PIX SAFRA 34 · PIX ITAÚ 34 · PIX - SICREDI - SORELLY - 34 |
| CNPJ 67 (Axis, do Lucas) | CRÉDITO - SICREDI - AXIS · DÉBITO - SICREDI - AXIS · PIX - SICREDI - AXIS |
| Fim da lista | NOTA DE CRÉDITO · PIX ESTORNO |

## 2. O que o Marcus disse (20/11/2026)
- A DevMaster e o Admin precisam falar a mesma língua. Onde a DevMaster estiver errada, corrige-se lá também (anotar em Financeiro › Arrumar na DevMaster).
- Quando fecha a venda, o PDV só deixa escolher UMA forma da lista. Não cabe o nome de cada representante, então a venda é lançada como "PIX REPRESENTANTES" e depois alguém altera para o nome da pessoa. Ele acha confuso.
- Prestador de serviço: o Pix cai numa conta só ("PIX PRESTADORES DE SERVIÇOS") e depois o pessoal lança o destino. Para prestador com vários pagamentos, o Marcus quer a conta normal dele, para evitar erro depois.
- Pix de uma conta com CNPJ (ex.: Sicredi 34) vai para essa conta mesmo. O de prestador não.
- Regra de nome na tela Contas a receber (decidida no mesmo dia): a coluna CNPJ mostra o PRIMEIRO NOME da empresa (Sorelly 34, Mayz 46, Serenity 59, Axis 67); pessoa com o nome exato (Marco PJ, Marco PF, Marcus, Anamaria, Lucas, Ana Beatriz); fornecedor com o nome dele (Pontual, Point, Mega Sul, Madeira Cor...). Nunca "Família e sócios" nem "Caixas internos". Maquininhas P = Pontual. Axis = CNPJ do Lucas.

## 3. O que eu observei (a confirmar com o Marcus)
1. **Três regras diferentes dizem "de quem é a conta" no Admin:** o servidor (`src/server/contas-receber.js`, função `titular`, por palavra no nome), o Consolidado das representantes (`domain/contas-grupos.js`, tabela `CONTA_GRUPO`, 55 contas) e a tela Contas a receber (função `donoDe`, de 20/11). Elas podem discordar.
2. **Nomes que misturam o jeito de escrever:** o CNPJ 46 aparece como "SHOPPING 46", como "SORELLY - 46" (LINK - SICREDI - SORELLY - 46) e só "46"; o 59 como "SERENITY - 59", "SERENITY" e só "59" (PIX - ITAÚ - 59); o 34 como "SORELLY - 34" e só "34" (PIX SAFRA 34, PIX ITAÚ 34). O Admin chama o 46 de Mayz.
3. **Marco aparece em duas contas:** "ITAÚ PJ - MARCO" (a conta Itaú do pai que a empresa usa) e "ITAÚ PF - MARCO ANTÔNIO" (a pessoal do pai). Os nomes não deixam isso claro.
4. **Grupos que não são conta bancária:** VENDA CARREGAR, PIX - DEVMASTER, PIX - BANHO, PIX PRESTADORES DE SERVIÇOS, PIX PRODUÇÃO DE PEÇAS, PIX REPRESENTANTES, DINHEIRO, NOTA DE CRÉDITO e PIX ESTORNO. O dinheiro entra em lugares diferentes, e a escolha é do funcionário.
5. **PIX - BANHO não diz quem recebe:** Pontual ou Ellos (o Admin mostra "Ellos" por suposição do Marcus). Já existe "PIX ELLOS BRUTOS" e "PIX ART ELLO" separados.
6. **Digitação:** "GETNET- P" sem espaço, "SAFRA - SERENITY 59" sem o traço, "PIX SICREDI H&O" sem traço.
7. **Existem na lista e não apareceram em novembro:** PIX SICREDI H&O, MEGA SUL, TUCANO, 3D ACRILICOS, CHARME, LINDA, ART ELLO, ELLOS BRUTOS, ANA BEATRIZ PF, ITAÚ PF MARCO ANTÔNIO, CAIXA ECONÔMICA ANAMARIA, STONE 46, UNICRED 46, CAIXA 46, CRÉDITO/DÉBITO SAFRA 46, VENDA CARREGAR, NOTA DE CRÉDITO e PIX ESTORNO.

## 4. Perguntas abertas (levadas ao Marcus)
1. Quem escolhe a forma no PDV: a funcionária que fecha a venda ou a pessoa que recebeu o Pix? E quem corrige "PIX REPRESENTANTES" depois, e quando?
2. Prestador de serviço: o Pix entra na conta da empresa e vira "PIX PRESTADORES DE SERVIÇOS". Quem lança o destino, e onde (DevMaster, Admin ou planilha)?
3. Padronizar os nomes na DevMaster: topa renomear tudo no formato `FORMA - BANCO - EMPRESA`, sempre com o primeiro nome (Sorelly, Mayz, Serenity, Axis)? Isso é feito pelo pessoal da DevMaster, depois do feriado.
4. "PIX - BANHO": dá para separar em "PIX - BANHO PONTUAL" e "PIX - BANHO ELLOS"?
5. Representantes: em vez de "PIX REPRESENTANTES", o Admin pode ligar o Pix à pessoa pelo Direcionar. O Marcus aceita que o PDV continue com a forma genérica e o Admin mostre o nome?
6. Contas de pessoa (Anamaria, Lucas, Ana Beatriz, Marcus, Marco): a empresa não deve receber nelas (decisão de 18/11 de parar de usar contas pessoais para a empresa). O que o PDV deve oferecer no lugar?

## 5. Onde isso vale no sistema
- Tela Contas a receber (`pages/ContasReceberLista.js`): função `donoDe`.
- Consolidado das representantes: `domain/contas-grupos.js`.
- Servidor: `src/server/contas-receber.js` (`grupo` e `titular`).
- Quando as 6 perguntas forem respondidas, juntar as 3 regras numa só (um arquivo só, usado pelo servidor e pelas telas).

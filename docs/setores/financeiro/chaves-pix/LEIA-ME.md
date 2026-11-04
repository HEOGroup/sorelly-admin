# Financeiro › Chaves Pix

Resumo para ler primeiro. Decisões: `decisoes.md`. O que falta: `pendencias.md`. Mensagens prontas para pedir chave: `mensagens-pedir-chave.local.md` (fora do Git).

## 1. O que é
UM lugar só para TODAS as chaves Pix da Sorelly (empresa, fornecedor, sócio, prestador, representante, funcionário). Regra do Marcus (04/11/2026): chave Pix mora só no Financeiro, nunca em outra tela.

Menu: Financeiro › Contas › Chaves Pix. Rota: `/financeiro/chaves-pix-dos-bancos`. Código: `pages/ChavesPixBancos.js`.

```
Chaves Pix (cadastro único)
      │
      ├─► Direcionar Pix (Financeiro): mostra a chave de quem vai receber
      ├─► App da representante: Pix representante mostra a chave dela
      └─► Botão Pix em cada linha: copia a mensagem pronta para o WhatsApp
```

## 2. As abas (ordem fixa)
| Aba | Quem entra |
|---|---|
| CNPJs | Contas da empresa: 34, 46, 59, 67, H&O e Itaú Marco PJ. Uma tabela por CNPJ. |
| Fornecedores | Pontual, Ellos Galvânica, MegaSul, Art Ello, Xangai, Point, Office Graf, Devmaster, Ello Print, Madeira Cor |
| Sócios | Marcus, Anamaria, Marco Antonio, Ana Beatriz, Lucas, com os prestadores particulares de cada um (Greice, Show Banca, Rebel Mode, 68 Gang) |
| Prestadores de serviço | Lucas Castilho, Higor, Priscila |
| Representantes | As 22 da lista do RH (`domain/pessoas.js`) |
| Funcionários | Todos do RH, agrupados por CNPJ |

## 3. Colunas e regras da tabela
| Regra | Valor |
|---|---|
| Padrão visual | Topo dourado, tudo centralizado, nada abreviado, nenhuma linha quebrada |
| Nomes | No máximo 3 palavras (o completo fica ao passar o mouse); favorecido resumido a 2 palavras |
| Data de alteração | Só o dia. Toda chave mostra 04/11/2026 (data da carga) até alguém alterar |
| Editar | Botão Editar: tipo e chave viram campos; grava data e quem alterou |
| Chave de exemplo | `@exemplo.com` nunca vale (é sobra de teste) |

## 4. Mensagem do botão Pix
O botão copia a mensagem pronta (negrito do WhatsApp, chave SEMPRE na linha de baixo, pede o comprovante).

| Tipo de linha | Mensagem |
|---|---|
| Conta da empresa | Banco, Empresa, CNPJ, chave e "Envie o comprovante após o pagamento." |
| Pessoa (funcionário, sócio, prestador, fornecedor, representante) | Nome, Banco, Favorecido (se for outro nome), chave e o mesmo pedido de comprovante |

Código: `lib/mensagem-pix.js` e `components/copiar-chave.js`.

## 5. De onde vêm os dados
| Fonte | O quê |
|---|---|
| `domain/pix-chaves-admin.local.js` (fora do Git, repositório é público) | Chaves das contas, extras (sócios, prestadores, fornecedores, representantes) e 70 funcionários |
| Estado salvo no sistema | O que o Marcus edita na tela vale sobre o arquivo, só para a chave |
| Nome, banco, serviço, favorecido | O arquivo vale sobre o estado salvo (o Marcus acerta os textos aqui) |
| Planilha `CONTROLE PIX.xlsx` (04/11/2026) | Veio das funcionárias e das representantes. Casamento de nome só quando o nome bate de verdade. |

**Importante:** o sistema publicado NÃO tem as chaves. O arquivo `.local.js` precisa ir para o servidor (Leonardo).

## 6. Regras do Itaú
Só existe UMA conta: **Itaú Marco PJ** (cheque especial R$ 68.604,00). Itaú Black é a mesma conta. Sicredi Rotativo é cheque especial dentro do Sicredi 34 e não tem chave.

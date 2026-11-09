# Fluxo do kit: da listagem à retirada

Data: 05/11/2026. Para: Leonardo (app iPhone e servidor).
Fonte: leitura do código do protótipo. Nada foi executado. Onde eu não li, está escrito "não verifiquei".
Caminhos abaixo são relativos a `src/apps/montagem/`, salvo quando indicado.

## 0. Resumo em 5 linhas

1. Todo o estado do kit mora só no navegador (`localStorage`, chave `sorelly_montagem_v9`). Não há módulo de servidor para kits, listagens, retirada ou conferência.
2. As condicionais da DevMaster chegam ao kit em `kit.condsReais`. A montagem e a bipagem leem `kit.cond.nums`. São dois campos diferentes e nada liga um ao outro.
3. O status `precond` (conferir condicional antes de montar) só nasce no seed de demonstração. O `ADD_KIT` nunca cria esse status.
4. Muita regra só vale na tela (quem aprova, quem define valor, teto de reposição, liberar condicional).
5. A retirada tem 3 caminhos. Dois deles pulam o código (`app` e `sozinha`) e o reducer confia no que a tela manda.

## A. Diagrama do fluxo e dos status

Status do kit (`kit.status`). Rótulos em `domain/status.js:5-7`.

```
(1) Representante / Agendamento
    CRIAR_LISTAGEM  -> listagem {id, rep, destino, viagem, horario, data}      [sem kit ainda]
    ADD_KIT         -> kit nasce:
         acerto_kit / reposicao / kit_novo ..... status "semvalor"   (valor = null)
         condicional / saiu (SEM_KIT) .......... status "condicional" (valor = null)
         (seed de demo, com condicional ........ status "precond")   <- ADD_KIT NÃO faz isso

(2) Condicionais (DevMaster)
    GET /api/representante/condicionais  -> KIT_CONDS_REAIS -> kit.condsReais  (só leitura)
    Fila de conferência prévia: precond --LIBERAR_COND--> "semvalor" (se valor null) ou "pendente"

(3) Valor do kit
    semvalor --DEFINIR_VALOR / CONFIRMAR_SUGERIDOS--> pendente   (quem: supervisão, Calculadora de kits)

(4) Montagem
    pendente --INICIAR_M--> montando --CONCLUIR_M--> montado                 (valor <= limiteAtencao)
                                              \----> supervisao --APROVAR--> montado
                                                          \-----REPROVAR--> ajuste --INICIAR_M--> montando
    montando --DEVOLVER--> pendente (ou ajuste, se já era ajuste)

(5) Bipagem
    montado --INICIAR_B--> bipando --CONCLUIR_B--> bipado      (CORRIGIR_B só muda valor real)

(6) Pronto para retirar = status "bipado"
    "condicional" --PEGAR_COND ou COND_CHK (todas marcadas)--> bipado   (pula montagem e bipagem)

(7) Retirada
    bipado --RETIRAR / RETIRAR_KIT--> retirado
    Caminho do app: SOLICITAR_RET (bipadora) -> retPend -> RESP_RET aceita -> RETIRAR {app:true}
    Quando todos os kits da listagem estão retirados: listagem.fechada = true + histListagens (Consolidado)

(8) Só reposição, depois da retirada (app da representante)
    REPOSICAO_ENTREGAR -> status "acertado" + linha em acertosConsignado + condicional em perfisRev
```

Quem muda o status (resumo): representante/agendamento (criar), funcionária de condicionais (precond para fila), supervisão (valor, aprovar, reprovar), montadora (montar), bipadora (bipar, solicitar retirada), representante (aceitar retirada, entregar reposição), funcionária da retirada (RETIRAR no desktop).

Rótulo que a representante vê (`mobile/representante.js:83`): Aguardando bipagem, Bipando, Pronto para retirar (bipado), Retirado, Condicional para retirar, Conferindo a condicional.

## B. Tabela por passo

Limites vêm de `domain/config.js` (Configurador). Valores atuais: `limiteEspecial` 12000, `limiteAtencao` 15000, `limiteMelhores` 12000, `limiteEncomendas` 3000, `limiteMesaMaior` 4000 (`config.js:7`), `divPct` 20 (`config.js:29`), `limiteAnaliseVendas` 2500 (`config.js:49`), `limiteMarcus` 4000 (`config.js:47`), `kitInicial` 7000, `minVendaApp` 500, `reposicaoMax` 2500 (`config.js:33`).
Atenção: `pages/CLAUDE.md:20` diz "acima de R$ 12 mil só as 2 melhores"; o código usa `limiteEncomendas` (3000) como regra nova e deixa os 12 mil como regra antiga (`regras.js:106-108`).

| # | Passo | Quem | Tela / app | Ação do reducer | Dado gravado | Regra |
|---|-------|------|------------|-----------------|--------------|-------|
| 1 | Criar listagem | Representante (app) ou Agendamento | `mobile/nova-listagem-rep.js:31`, `pages/Apps.js:103`, `components/escolher-real.js:18` | `CRIAR_LISTAGEM` (`reducer.js:538`) | `s.listagens[]`: id `L`+hora, rep, destino, viagem, horario, data, fechada, retiradas | Dia não pode ser no passado. Não repete mesmo dia, horário e destino da mesma representante. Fora de Curitiba = viagem. |
| 2 | Incluir revendedora na listagem | Representante (app, `pedir`), supervisão (`DlgNovoKit`) | `mobile/representante.js:243-248`, `components/dialogos.js:26` | `ADD_KIT` (`reducer.js:505`) | Kit novo: `lid, rev, tipoKit, vendas, vendasAnt, codRev, fone, horaAtend, cond{nums,...}, regrasVersaoId, atrasado, porApp` | Máximo 15 revendedoras por listagem, sem limite em viagem (`regras.js:47-50`). Atrasado = fora do prazo de 48 h (`foraDoPrazo`). Carimba a versão de regras de comissão do kit. Tipos: `acerto_kit`, `reposicao`, `kit_novo`, `condicional`, `saiu` (`status.js:8-12`). |
| 3 | Pegar condicionais | Sistema (leitura) | `mobile/conds-reais.js:17`, `mobile/representante.js:270`, `mobile/kn-entrega-rep.js`, `mobile/conf-pecas.js` | `KIT_CONDS_REAIS` (`reducer.js:1136`) | `kit.condsReais[]` (número, emissão, previsão, peças, valor, grupos>itens) e `condsReaisEm` | Rota `app/api/representante/condicionais/route.js`. Busca por `?cod=` ou `?cpf=`. Só `dmafi` com `afi_status = "A"`. Exclui vendedor 04 (expositor), 91 (encomenda) e previsão em 2100 ou depois. `?recente=1` devolve só o kit mais novo. Representante só vê revendedora da própria carteira (403). |
| 4 | Conferir condicional antes da fila (funcionária de condicionais) | Marjory (condicionais) | `pages/Condicionais.js`, `mobile/condicionais.js` | `COND_CHK_PRE`, `COND_ADD_NUM`, `COND_FALTA`, `COND_IMPRESSA`, `LIBERAR_COND` (`reducer.js:586-612`) | `kit.cond.chkP`, `nums`, `prev`, `faltas`, `impressas`, `liberadoPor`, `liberadoEm` | Só age em kit `precond`. Na conferência, expositor fica de fora por previsão acima de 90 dias (`domain/condicionais.js:12-16`). Saída (`saiu`) mostra todas. |
| 5 | Definir valor | Supervisão (Deysiane) | `components/kit-valor.js:17`, `pages/Calculadora.js:133`, `components/menu-acoes.js:69` | `DEFINIR_VALOR` (`reducer.js:348`), `CONFIRMAR_SUGERIDOS` (`:365`) | `valor, manual, defPor, defEm, status "pendente"`, `analiseVendas{obrigatoria,enviada,media}` | Só em `semvalor` ou `pendente`. Média acima de `limiteAnaliseVendas` obriga análise de vendas (`ANALISE_VENDAS_ENVIADA`). Média acima de `limiteMarcus` só avisa na tela (`Calculadora.js:74,127`). |
| 6 | Designar (opcional) | Supervisão | `components/menu-acoes.js` (não verifiquei linha) | `DESIGNAR` (`reducer.js:371`) | `kit.designada` | Só em `pendente`. Valida quem pode montar (`motivoNaoMonta`). |
| 7 | Iniciar montagem | Montadora (só como ela mesma) ou supervisão | `components/janela-montar.js:52,103`, `mobile/montadora.js` (não verifiquei) | `INICIAR_M` (`reducer.js:378`) | `status "montando", montId, iniM, ajustes, excecaoEnc` | Quem monta é obrigatório. Montadora só monta como ela mesma. Uma montadora só monta 1 kit por vez. Quem apertou primeiro fica com o kit. Kit acima de `limiteEncomendas` (venda atual ou média, `valorRefEncomendas`): só montadoras do setor Encomendas, salvo exceção de Marcus ou Deysiane (`podeLiberarExcecao`). Acima de `limiteMesaMaior`: só aviso (mesa da Agatha). Ajuste volta para quem montou. |
| 8 | Separar peças e marcar condicionais | Montadora | `components/janela-montar.js:88-107`, `components/condicionais.js` | `COND_CHK` papel "m" (`reducer.js:565`), `PAUSAR`, `RETOMAR` | `kit.cond.chkM`, `pausaMs` | A janela mostra "O que enviar" (`pecasPara`, tabela por valor do kit). Preferências da revendedora vêm do módulo `pk`, por nome. |
| 9 | Concluir montagem | Montadora | `janela-montar.js:107` | `CONCLUIR_M` (`reducer.js:403`) | `status "montado"` ou `"supervisao"`, `fimM, tempoM, cond.pegas` | Exige condicionais marcadas (`condOk "m"`), a não ser que a ação traga `condPegas`. Valor acima de `limiteAtencao`: vai para `supervisao`. |
| 10 | Conferência da supervisão | Deysiane | `pages/Painel.js:62` (aviso) | `APROVAR` (`reducer.js:421`), `REPROVAR` (`:435`) | `status "montado"` ou `"ajuste"`, `supId, supEm, motivo` | Só em kit `supervisao` (aprovar). Exige montador válido. |
| 11 | Bipagem: iniciar | Bipadora | `components/fila.js:174`, `components/menu-acoes.js:59`, `components/barra-bipadora.js:58` | `INICIAR_B` (`reducer.js:441`) | `status "bipando", bipId, iniB` | Só kit `montado`. Quem bipa tem de ser bipadora ou supervisão. Uma bipadora bipa 1 kit por vez (se já tem, a ação é ignorada em silêncio). |
| 12 | Bipagem: concluir | Bipadora | `components/barra-bipadora.js:54`, `components/condicionais.js:93` | `CONCLUIR_B` (`reducer.js:449`), `CORRIGIR_B` | `status "bipado", valorReal, divReg, fimB, cond.novas`; em divergência: `registros[]` e `montadoras[].mes.div` | Exige condicionais conferidas (`condOk "b"`) e o número da nova condicional (tela). Divergência = `abs(real - valor) / valor` acima de `divPct` (20%). Divergência conta contra a montadora (a cada `divBloco` perde `divPerda` %). |
| 13 | Pronto para retirar | Sistema | Celular da bipagem (`mobile/bipagem.js`), Painel | Estado `bipado` | — | Kit só-condicional vira `bipado` por `PEGAR_COND` (`reducer.js:559`) ou por `COND_CHK` completo (`:565`). |
| 14a | Solicitar retirada (celular) | Bipadora | `mobile/bipagem.js:55` | `SOLICITAR_RET` (`reducer.js:614`) | `s.retPend[]` {id, lid, ids, por, em} | Uma pendência por listagem (a nova substitui a anterior). |
| 14b | Representante aceita | Representante | `mobile/revendedora.js:38-49` (bloco "Confirmar recebimento", usado no app da representante) | `RESP_RET` (`reducer.js:620`) -> `RETIRAR {app:true}` | `status "retirado", retEm, retPor, retConf "confirmação no app da representante"` | Recusar só apaga a pendência e mostra aviso. |
| 14c | Retirada no balcão com código | Funcionária | `components/dialogos.js:53-90` (`DlgRetirada`) | `RETIRAR` / `RETIRAR_KIT` (`reducer.js:476`) | Igual a 14b, com `retConf "código e assinatura"` e `listagem.retiradas[]` | O reducer confere o código (`codigoRetirada`, `retornos.js:47`) e exige assinatura. O código tem 4 dígitos e muda por listagem, por nº de retiradas e por dia. A representante vê o código em `mobile/representante.js:1203` e `:1471`. |
| 14d | Retirou sozinha na empresa | Funcionária | `dialogos.js:63,78` | `RETIRAR {sozinha:true}` | `retSozinha true` | Dispensa código e assinatura. Marca todos os kits prontos. |
| 15 | Fechar listagem | Sistema | Consolidado | dentro de `RETIRAR` (`reducer.js:490-495`) | `listagem.fechada, concluidaEm`, `histListagens[]` | Fecha quando todos os kits da listagem estão `retirado`. `REABRIR` desfaz. |

### B.1 Desvio: kit novo (sem condicionais no começo)

| Item | O que o código faz |
|------|--------------------|
| Entrada | `ADD_KIT` com `tipoKit "kit_novo"` ou `"kit_novo_exp"`. Mesmo caminho: `semvalor` -> valor -> montagem -> bipagem -> bipado -> retirado. |
| Valor | Fica fora da Calculadora de kits (`pages/Calculadora.js:56`). A regra escrita diz que o valor vem do setor Kit novo (`pages/Regras.js:81`). Quem grava esse valor: não verifiquei. |
| Condicionais | Revendedora nova não tem código na DevMaster: a rota aceita `?cpf=` (`route.js:15-23`). O CPF é digitado na etapa 1 da entrega (`conds-reais.js:10-11`). |
| Entrega | Fluxo próprio de 15 etapas em `mobile/kn-entrega-rep.js` e `KN_ENT_CONCLUIR` (`reducer.js:1177`). Conferência das peças: `CONF_LIBERAR`, `CONF_INICIAR`, `CONF_BIPAR`, `CONF_QTD`, `CONF_FINALIZAR` (`reducer.js:1128-1176`). |
| Erros | Peça que falta vira erro de bipagem da bipadora que bipou o kit (`gravaConferencia`, `reducer.js:1151`). |
| Comissão | Só com a condicional assinada (`domain/comissoes.js:190`). |

### B.2 Desvio: reposição

| Item | O que o código faz |
|------|--------------------|
| Entrada | `ADD_KIT` com `tipoKit "reposicao"`, `vendas []` (`representante.js:247`). Pelo agendamento: `DlgNovoKit` (`dialogos.js:26`). |
| Valor | Mesmo `semvalor` -> `DEFINIR_VALOR`. A mensagem diz "até o máximo liberado" (`reducer.js:521`) e `fila.js:159` mostra `reposicaoMax` (2500). O teto não é checado em nenhum reducer. |
| Condicionais | Busca por CPF (`representante.js:265-276`). |
| Entrega | `REPOSICAO_ENTREGAR` (`reducer.js:1064`): comissão fixa R$ 15 (`s.comis.reposicao`), linha em `acertosConsignado`, condicional sobe em `perfisRev[rev].condicionaisAbertas`, kit vira `acertado`. |
| Duplicidade | Bloqueia segunda entrega (`reposicaoEntregue`). |

### B.3 Desvio: só condicional e saída

| Item | O que o código faz |
|------|--------------------|
| Entrada | `ADD_KIT` com `tipoKit "condicional"` ou `"saiu"`: status `condicional`, valor null (`reducer.js:520`). |
| Fluxo | `PEGAR_COND` ou `COND_CHK` completo move para `bipado` sem passar por montagem e bipagem. Depois, retirada normal. |

## C. Onde o fluxo está quebrado ou só na tela

Ordem: do mais grave para o menos grave.

| # | Problema | Onde | Efeito |
|---|----------|------|--------|
| 1 | Condicionais da DevMaster não entram na montagem nem na bipagem. A montagem e a bipagem leem `kit.cond.nums`; a DevMaster grava `kit.condsReais`. | `domain/condicionais.js:4` (lê `cond.nums`), `reducer.js:1136-1138` (grava `condsReais`), `representante.js:246` | `ADD_KIT` de acerto, reposição e kit novo grava `conds: []`. `condOk` com lista vazia dá "verdadeiro". Montadora e bipadora nunca conferem as condicionais reais. |
| 2 | `ADD_KIT` nunca cria `precond`. Só o seed de demonstração cria. | `reducer.js:505-522` (sem `precond`), `domain/seed.js:100` | A fila da funcionária de condicionais (`Condicionais.js:93`, `mobile/condicionais.js:63`) fica vazia para kits reais. O passo "pegar condicionais antes da fila" não existe no fluxo real. |
| 3 | Número de condicional inventado a partir do nome da revendedora (kit só-condicional e saída). | `mobile/representante.js:246` (`13000 + rev.length*97 + charCodeAt(0)`) | Contradiz a regra "sem dado falso" de 05/11/2026. |
| 4 | Estado do kit só no navegador. Não há módulo de servidor para `kits`, `listagens`, `retPend`, `confBip`, `acertosConsignado`. | `state/store.js:71` (`CHAVE`), `:306`; `src/server/permissoes.js:5-30` (lista de módulos sem kits) | Montadora, bipadora e representante em aparelhos diferentes não veem o mesmo kit. Não verifiquei se existe outro caminho de sincronização fora de `state/` e `src/server/`. |
| 5 | Retirada: `app` e `sozinha` pulam o código. O reducer só confere se a ação traz a flag, não quem a mandou. | `reducer.js:487`, `:624` (`RESP_RET` sempre manda `app:true`), `dialogos.js:63` | Qualquer cliente que mande `RETIRAR {sozinha:true}` ou `{app:true}` retira sem código e sem assinatura. `RESP_RET` não confere se quem responde é a representante da listagem. |
| 6 | Código de retirada é uma conta pública e repetível: hash de `listagem.id + nº de retiradas + dia`. | `domain/retornos.js:47-52` | Quem conhece a fórmula calcula o código. O comentário do próprio arquivo diz que o servidor deve gerar e guardar a validade. Sem validade nem tentativas máximas. |
| 7 | Kit só-condicional (`condicional`/`saiu`) vira `bipado` sem `montId`, e `RETIRAR` exige `montadorValido(montId)`. | `reducer.js:520` e `:559-563` (sem `montId`), `:481-483` (exige montador) | Pela leitura, esses kits ficam travados com a mensagem "Informe quem montou este kit antes da retirada". Só `INFORMAR_MONT` (supervisão) destrava. Não executei para confirmar. |
| 8 | Sem teto de valor em `DEFINIR_VALOR`. `reposicaoMax` (2500) só aparece em texto. `defPor` é sempre a supervisão, mesmo quando outra pessoa grava. | `reducer.js:348-358`, `components/fila.js:159`, `domain/config.js:33` | Reposição e kit de qualquer valor entram na fila. A regra "até o máximo liberado" não existe no código. |
| 9 | `APROVAR`, `REPROVAR`, `DESIGNAR`, `DEFINIR_VALOR`, `LIBERAR_COND` e `SOLICITAR_RET` não conferem o papel de quem chama. | `reducer.js:421-440`, `:371`, `:348`, `:602`, `:614` | Só `INICIAR_M`, `CONCLUIR_M` (parcial), `INICIAR_B` e `INFORMAR_MONT` conferem papel. Os outros dependem de a tela esconder o botão. |
| 10 | `CONCLUIR_M` aceita `a.condPegas` e pula a marcação das condicionais. | `reducer.js:406` | Não achei quem manda `condPegas`. Não verifiquei fora de `reducer.js`. |
| 11 | A "bipagem" da bipadora é digitar o valor real do kit, não bipar peça por peça. A divergência de 20% usa esse valor digitado. | `components/barra-bipadora.js:54`, `reducer.js:455` | Sem lista de peças esperadas na bipagem de envio. A leitura por peça (`CONF_BIPAR`) existe só na conferência da representante, e usa `condsReais`. |
| 12 | `SOLICITAR_RET` não confere se os `ids` são bipados e da listagem. Também quebra se a listagem não existe (`lr.rep` com `lr` indefinido). | `reducer.js:614-619` | `RETIRAR` depois filtra por `bipado` e por listagem, então o dano é pequeno. O erro de `lr` é um possível travamento. |
| 13 | Status `acertado` (reposição entregue) não existe nos rótulos nem nas situações. | `reducer.js:1075`, `domain/status.js:5-7,14-18` | O kit some das cinco situações da listagem e o selo de status fica sem texto. Se o app da representante trata `acertado`: não verifiquei. |
| 14 | `ADD_KIT` não impede a mesma revendedora duas vezes na mesma listagem. | `reducer.js:505-523` | Só o limite de 15 vale. |
| 15 | Listagem nasce só no navegador. A lista vem de `pages/Apps.js`, `escolher-real.js` ou da aba da representante, não de uma rota do servidor. | `reducer.js:538` | Sem listagem real da DevMaster ou do agendamento no servidor. Regra de 48 h só gera a marca `atrasado`. |
| 16 | `INICIAR_B` ignora em silêncio quando a bipadora já tem kit. | `reducer.js:442` | A tela não recebe aviso. |

Itens que eu não li (não verifiquei): `mobile/montadora.js` (141 linhas), `mobile/bipagem.js` linhas 1-24, `pages/AtendimentoInternoListagens.js`, `components/fila.js` (só 159 e 174 por busca), `pages/Condicionais.js` e `mobile/condicionais.js` (só linhas achadas por busca; não vi se o botão Liberar confere `condOkPre`), `docs/negocio/FLUXO-DA-EMPRESA.md`. A regra sobre a lista de valores por tipo vem de `pages/CLAUDE.md` (lido por busca de trechos).

## D. O que o servidor precisa ler e gravar em cada passo

| Passo | Ler | Gravar | Regras que o servidor deve impor |
|-------|-----|--------|----------------------------------|
| 1 Criar listagem | Carteira da representante (`app/api/representante/revendedoras`) | `listagem` (id, representante, data, horário, destino, viagem, estado) | Data não pode ser passada. Sem duplicata (representante + data + horário + destino). Só a dona ou o agendamento cria. |
| 2 Incluir revendedora | Vendas anteriores (`vendasAnt`), perfil, CPF, código DevMaster | `kit` (listagem, revendedora, tipo, vendas, horário, atrasado, versão das regras) | Máx. 15 por listagem (sem limite em viagem). Sem a mesma revendedora duas vezes. Marca `atrasado` pelo prazo de 48 h. |
| 3 Condicionais | DevMaster `dmafi` e `dmafj` (já existe a rota) | Cópia congelada das condicionais no kit (número, peças, valor, itens) e a hora da leitura | Gravar no mesmo campo que a montagem e a bipagem leem. Hoje são dois campos. Representante só vê a própria carteira. |
| 4 Conferência prévia | Condicionais do kit | Check por número, faltas, impressas, quem liberou e quando | Só libera com todas conferidas. O servidor confere o papel da funcionária. |
| 5 Valor | Vendas do kit, `cfg` (tabela, `kitInicial`, `limiteAnaliseVendas`, `reposicaoMax`) | Valor, se foi manual, quem definiu (usuário real), data, análise de vendas | Teto de reposição. Análise obrigatória acima do limite. Só supervisão grava. |
| 6-7 Montagem: iniciar | Kit, montadoras, `limiteEncomendas`, `limiteMesaMaior` | `status`, `montId`, `iniM` | Montadora só monta como ela mesma. Setor Encomendas acima do limite, exceção só de Marcus ou Deysiane. 1 kit por vez por montadora. Gravação atômica (quem chegou primeiro leva). |
| 8-9 Marcar e concluir | Condicionais do kit | Checks "m", `fimM`, `tempoM`, pausas | Concluir só com tudo marcado. Valor acima de `limiteAtencao` vai para supervisão. |
| 10 Supervisão | Kit em `supervisao` | `status`, `supId`, `supEm`, motivo | Só supervisão. Motivo obrigatório ao reprovar. |
| 11-12 Bipagem | Kit `montado`, valor esperado, lista de peças | `bipId`, `iniB`, `fimB`, `valorReal`, `divReg`, números das condicionais novas; registro de divergência e contador da montadora | Divergência acima de `divPct` grava registro e soma no mês da montadora. Bipadora nunca vê o valor esperado. Ideal: servidor receber as peças lidas e calcular o valor. |
| 13 Pronto | Kits `bipado` por listagem | — | — |
| 14a Solicitar | Kits `bipado` da listagem | `retPend` (listagem, ids, quem, quando, validade) | Ids precisam ser `bipado` e da mesma listagem. Uma pendência por listagem. |
| 14b Aceite | `retPend`, identidade da representante logada | `retirado`, `retEm`, `retPor`, forma da confirmação | Só a representante dona da listagem aceita. Registrar o usuário real. |
| 14c Código | Código vigente da listagem | Retirada (kits, quem entregou, assinatura, código usado) | O servidor gera o código, guarda validade e limita tentativas. Ele não pode ser uma conta feita no app. |
| 14d Sozinha | Perfil da funcionária | Retirada com marca "sozinha" e quem acompanhou | Só funcionária com permissão. Registrar quem. |
| 15 Fechar | Todos os kits da listagem | `fechada`, `concluidaEm`, retrato em `histListagens` | Fecha só com todos `retirado`. Alimenta o Consolidado. |
| Kit novo | CPF, DevMaster, entrega (15 etapas) | `entregasKN`, `confBip`, erros de bipagem, carimbo da entrega | Comissão só com a condicional assinada. |
| Reposição | CPF, DevMaster, `s.comis.reposicao` | Registro em `acertosConsignado`, condicional em `condicionaisAbertas`, `reposicaoEntregue` | Uma entrega por kit. Teto de valor da reposição. Comissão só com condicional assinada. |

Permissões de módulo hoje: `src/server/permissoes.js:5-30`. Módulos de montagem existentes: `pk` (montagem, cadastro), `pr` (producao, montagem), `ex` (encomendas, montagem), `kn` (todos logados). Não existe módulo para o estado do kit. O servidor precisa de um.

Acesso do Marcus: montadora e bipadora nunca veem valor em dinheiro. Isso hoje só vale na tela (`janela-montar.js:67`, `papelDe`). No servidor, a resposta precisa omitir `valor` para esses perfis.

## E. Decisões do Marcus sobre a criação da listagem (09/11/2026)
Valem para o app da representante e para o servidor. Ainda NÃO estão no código.
1. A representante tem **UMA listagem por dia**, com **até 2 horários de retirada**.
2. Uma revendedora **não pode estar em duas listagens no mesmo dia** (fecha o problema C.14).
3. A regra das **48 horas de antecedência TRAVA** (hoje só marca `atrasado`).
4. Limite de **15 kits** (Curitiba); viagem sem limite. Em aberto: o 15 vale por listagem (dia) ou por horário.
5. A representante **não vê o valor do kit**. Ela vê só as suas revendedoras e a situação do kit (montado, bipado).
6. Ela pode **retirar 1 ou 2 kits** se já estiverem prontos (retirada parcial).
7. Duas portas, mesma regra: de dentro da listagem (adicionar revendedoras da carteira) e de dentro da revendedora (agendar; cria a listagem se faltar). O tipo do kit é escolhido ao entrar.
8. **Viagem:** a retirada dos kits na empresa já está em `docs/setores/representantes/Mapa das representantes.md` (seção 5: ex.: viagem de 10 a 12/11 retira na segunda 09/11 às 18:00). **Em aberto, pergunta para a Deysiane:** até quando a representante precisa pedir os kits da viagem para dar tempo de montar (prazo dos kits para a retirada).

### E.1 Respostas de 09/11/2026 (Marcus, com a resposta da Deysiane)
- **Limite:** são **15 kits para o dia inteiro** (uma listagem por dia). Os 2 horários de retirada dividem esses 15. Fecha a dúvida do item E.4.
- **Retirada** = o dia em que a representante vem à empresa buscar os kits da listagem. As **48 horas contam desse dia**.
- **Quem libera fora das 48 horas:** só a Deysiane.
- **Quando começa a montagem:** as listagens começam a ser montadas **2 dias antes** da retirada (a Deysiane). Isso combina com a trava de 48 horas.
- **Exclusão de revendedora pela representante (nova no app):** pela Deysiane, as representantes geralmente avisam 1 dia antes (quando a cliente avisa); algumas só avisam no dia da retirada. Como o kit pode já estar montado, a exclusão dentro de 48 horas da retirada precisa gerar **alerta para a montagem**. Quem recebe, o motivo e o que fazer com o kit já montado: em definição.

### E.2 Prazo da viagem (resposta da Deysiane, 09/11/2026)
Exemplo dado: viagem a Ponta Grossa de 10 a 12/11, retirada na segunda 09/11 às 18:00. **Prazo para a representante pedir os kits: quinta-feira 05/11 até 07:30** (4 dias antes da retirada, de manhã cedo). Em definição: se vale para toda viagem (por dia da semana), e a regra para as viagens com retirada na sexta ou no sábado.

### E.3 Prazo da viagem, segunda resposta da Deysiane (09/11/2026)
- O prazo de envio **depende da data de retirada**.
- Viagem a Joinville, retirada sexta 13/11: prazo **quarta 11/11 até 07:30**.
- **Passou do prazo:** só a Deysiane libera, **conforme o motivo informado** (o motivo é obrigatório).
- **Leitura (a confirmar):** os dois exemplos batem com "**2 dias úteis antes da retirada, até 07:30**" (retirada segunda -> quinta; retirada sexta -> quarta). Isso troca as "48 horas" corridas por 2 dias úteis. Falta confirmar se vale também para a listagem normal (sem viagem).

### E.4 Respostas de 09/11/2026: prazo geral e kit excluído
- **Prazo geral:** vale para **todas as listagens**, com viagem ou sem: **2 dias úteis antes da retirada, até 07:30**.
- **Fim de semana:** resposta "sim, contam para as solicitações". Ficou ambíguo (pelos exemplos, retirada na segunda -> prazo na quinta, o sábado e o domingo ficam de fora da conta). A confirmar.
- **Representante exclui revendedora com o kit já feito (Deysiane):**
  - **A. Kit já BIPADO no sistema:** volta para o estoque pelo sistema primeiro; só depois da bipagem de devolução as peças são distribuídas para a montagem dos outros kits.
  - **B. Kit MONTADO mas NÃO bipado:** as peças são distribuídas direto para a montagem de outros kits.
  - Antes de montar (na fila ou montando): só cancela o kit.
- **Alerta ao excluir:** a mensagem precisa dizer a situação do kit (na fila, montando, montado, bipado) e a ação (cancelar, distribuir as peças ou devolver ao estoque). Quem recebe e o motivo: em definição.

### E.5 Exclusão de revendedora da listagem (Marcus, 09/11/2026)
1. A representante **pode excluir** (ela já combinou o cancelamento com a revendedora), mesmo com o kit já montado.
2. Ao excluir ela **marca quem desmarcou**: **a revendedora** (escolhe um motivo da lista e, se for o caso, **a multa já sobe**) ou **a própria representante** (também com motivo).
3. **Alerta para a Deysiane: sempre.** Para a **montadora**: só se ela estiver **no meio do kit** (status montando).
4. O alerta diz a situação do kit e a ação: na fila ou montando = cancelar; montado sem bipar = distribuir as peças; bipado = devolver ao estoque pelo sistema.
5. Em aberto: lista de motivos; qual regra de multa vale quando a revendedora desmarca; fim de semana na contagem do prazo.

## F. Onde cada parte fica no sistema (proposta, 09/11/2026)
| Parte do processo | Onde | Situação |
|---|---|---|
| Criar listagem, adicionar e excluir revendedora (com motivo e quem desmarcou) | App da representante › Listagens (`mobile/representante.js`, `mobile/nova-listagem-rep.js`) | Criar e adicionar existem; excluir com motivo, trava de 1 listagem por dia e trava do prazo: a fazer |
| Ver os kits do dia, alertas de exclusão e liberar fora do prazo | Admin › Representantes & Kits › Listagens (Deysiane) | Tela existe; alerta e liberação: a fazer |
| Alerta de kit excluído (para quem vai) | Tecnologia › Avisos (`domain/avisos.js`, novo tipo) | A fazer |
| Prazo (2 dias úteis, 07:30), limite de 15 kits, lista de motivos | Configurador geral (números fora das telas) | A fazer (hoje só existe `prazoPedidoHoras` = 48 h) |
| Multa quando a revendedora desmarca | Representantes › Regras dos acertos e coluna Multa do Consolidado | Regra a confirmar |
| Devolver ao estoque e distribuir peças | Bipagem e Montagem (admin e app da montadora) | A fazer |
| Regras escritas deste fluxo | `docs/negocio/FLUXO-LISTAGEM-A-RETIRADA.md` (seções E e F) | Gravado |

### E.6 Layout escolhido (Marcus, 09/11/2026)
- Opção 1 "Semana em blocos", no desenho da Calculadora de acertos. **Sem a barra preta do alto** (só a palavra "Listagens"). Botão no alto troca entre **Lista** e **Calendário**. Toda escolha é **menu suspenso** (nunca botões de escolha em fileira). Desenho: `docs/design/testes-de-layout/listagem-representante-opcao1.html`. Ainda NÃO está no código.
- **Ajuste de 09/11/2026 (Marcus):** a barra preta do alto FICA, igual às outras telas do app, escrito só "Listagens" (o cartão escuro de resumo saiu). A listagem **expande no mesmo lugar** (sanfona); não abre outra tela. Excluir é a única ação com tela própria. Desenho interativo: `docs/design/testes-de-layout/listagem-representante-opcao1-v2.html`.
- **Correção de 09/11/2026 (Marcus), substitui o "expande no mesmo lugar" acima:** ao tocar num dia, ele **abre OUTRA TELA** (a tela do dia), e o nome do dia aparece **por extenso** ("Quinta-feira, 12/11", nunca "Qui"). Na tela do dia: resumo escuro (retirada, kits, incluir até), tabela das revendedoras e menu "Ações da listagem" (adicionar da carteira, excluir, mudar o horário, retirar 1 ou 2 kits). Seta ‹ da barra preta volta. Desenho clicável: `docs/design/testes-de-layout/listagem-representante-opcao1-v3.html`.

## G. Versão 1 construída no app da representante (09/11/2026)
**Pronto e testado no navegador (app da Dayanne):** Lista e Calendário com botão; nome do dia por extenso; tela do dia (abre ao tocar); criar listagem só com menus (dia, 2 horários, destino); uma listagem por dia; uma revendedora por dia; prazo de 2 dias úteis até 07:30 trava a representante (o dia aparece apagado); excluir com "quem desmarcou" e "motivo"; aviso para a Deysiane (tipo `listagem_excluida`, configurável em Tecnologia › Avisos) e para a montadora só quando o kit está montando; o que fazer com o kit (cancelar, distribuir as peças, devolver ao estoque). Código: `mobile/listagens-rep.js`, `mobile/nova-listagem-rep.js`, `domain/listagem-regras.js`, `state/reducer.js` (`CRIAR_LISTAGEM`, `ADD_KIT`, `REMOVER_KIT`).
**Ainda NÃO feito (próximas etapas):** (1) "Mudar o horário" e "Retirar 1 ou 2 kits prontos" no menu Ações; (2) cobrança da multa quando a revendedora desmarca (hoje só registra "conforme as regras"; regra a confirmar); (3) tela da Deysiane para liberar depois do prazo (hoje a supervisão ainda inclui pelas telas do admin); (4) tela do admin para ver os kits excluídos e fazer "devolver ao estoque / distribuir peças" (hoje só o aviso); (5) os 2 números do prazo no Configurador geral (existem em `cfg.listagemPrazoDiasUteis` e `cfg.listagemPrazoHora`, sem tela); (6) confirmar se sábado e domingo ficam fora da conta (hoje ficam fora); (7) ligar ao servidor (o estado das listagens ainda mora só no navegador, como em C.4).

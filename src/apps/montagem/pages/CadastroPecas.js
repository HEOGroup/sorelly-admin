// Sorelly Admin · montagem — pages/CadastroPecas.js
// Setor "Cadastro de peças" (responsável Rayssa; Financeiro e diretoria também acessam). Desde 29/10/2026 cada tela é uma ABA DO MENU do topo (igual ao Financeiro: navigation/setores.js, MENU_CADPECAS),
// e não mais abas dentro de uma tela só. Este arquivo só entrega cada tela com o seu título. Corpos em pages/cadpecas/. Regras em domain/cadastro-pecas.js (estado s.cpc).
// Preços sugeridos seguem para aprovação no SorellyChat (grupo "Cadastro de Peças"). Estilo das telas de Pagamentos a fornecedores (azul, tabelas pequenas, sem blocos coloridos).
import { AbaCalculadora } from "@/apps/montagem/pages/cadpecas/Calculadora";
import { AbaBanho } from "@/apps/montagem/pages/cadpecas/Banho";
import { AbaControle } from "@/apps/montagem/pages/cadpecas/Controle";
import { AbaFaturas, AbaRetirarOuro } from "@/apps/montagem/pages/cadpecas/Faturas";
import { AbaLotes } from "@/apps/montagem/pages/cadpecas/Lotes";
import { AbaConfigCad, AbaDevMaster, AbaFornecedores } from "@/apps/montagem/pages/cadpecas/Outras";
import { AbaPedidos } from "@/apps/montagem/pages/cadpecas/Pedidos";
import { AbaSolicitacoes } from "@/apps/montagem/pages/cadpecas/Solicitacoes";
import { contagem } from "@/apps/montagem/domain/pedidos-pecas";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

// planilha aberta na Calculadora: a tela Planilhas de cadastro escolhe e abre a Calculadora, que está em outra tela do menu
var LOTE = {id:""};

function Tela(t, sub, corpo){ return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:t, sub:sub}), corpo); }

// Pedidos de bruto = tela mãe do setor (tem o próprio título, quadro e planilha)
function AbaCadastroPecas(){ return e(AbaPedidos,null); }
function AbaPecasSolicitacoes(){ var n = contagem(use().state.pp).aberto; return Tela("Solicitações", n ? n+" pedido"+(n===1 ? "" : "s")+" de peças da produção em aberto." : "Pedidos de peças da produção para o cadastro.", e(AbaSolicitacoes,null)); }
function AbaPecasControle(){ return Tela("Controle do mês", "Quanto foi comprado de bruto em cada mês e o banho faturado.", e(AbaControle,null)); }
function AbaPecasFaturasPontual(){ return Tela("Faturas Pontual", "Faturas de banho da Pontual ligadas aos pedidos de bruto.", e(AbaFaturas,{galv:"pontual"})); }
function AbaPecasFaturasEllos(){ return Tela("Faturas Ellos", "Faturas de banho da Ellos ligadas aos pedidos de bruto.", e(AbaFaturas,{galv:"ellos"})); }
function AbaPecasOuro(){ return Tela("Retirar ouro", "Ouro e prata enviados ao banho e o que já foi descontado em fatura.", e(AbaRetirarOuro,null)); }
function AbaPecasBanho(){ return Tela("Tabela do banho", "Preços do banho: Ellos e Pontual lado a lado.", e(AbaBanho,null)); }
function AbaPecasLotes(){ var cx = use(); return Tela("Planilhas de cadastro", "Uma planilha por volta do banho: custo, preço e markup. Clique para abrir na Calculadora.", e(AbaLotes,{onAbrir:function(id){ LOTE.id = id; cx.dispatch({type:"ABA", aba:"cpcalc"}); }})); }
function AbaPecasCalculadora(){ var st = useState(LOTE.id); return Tela("Calculadora", "Custo, preço sugerido e markup de cada peça da planilha.", e(AbaCalculadora,{loteId:st[0], onLote:function(id){ LOTE.id = id; st[1](id); }})); }
function AbaPecasFornecedores(){ return Tela("Fornecedores", "Quanto cada fornecedor custa por peça, com o banho.", e(AbaFornecedores,null)); }
function AbaPecasDevMaster(){ return Tela("DevMaster", "Pedidos de alteração para a DevMaster.", e(AbaDevMaster,null)); }
function AbaPecasConfig(){ return Tela("Configurações", "Regras do cadastro de peças e quem lança cada atividade.", e(AbaConfigCad,null)); }

export { AbaCadastroPecas, AbaPecasSolicitacoes, AbaPecasControle, AbaPecasFaturasPontual, AbaPecasFaturasEllos, AbaPecasOuro, AbaPecasBanho, AbaPecasLotes, AbaPecasCalculadora, AbaPecasFornecedores, AbaPecasDevMaster, AbaPecasConfig };

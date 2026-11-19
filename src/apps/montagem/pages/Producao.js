// Sorelly Admin · montagem — pages/Producao.js
// Setor PRODUÇÃO (fábrica de peças), refeito em 16/11/2026 no padrão do Financeiro. QUATRO abas no topo do setor: Produção, Premiação, Funcionárias e Códigos e categorias (as Faixas do bônus ficam em blocos dentro da Premiação).
// PRODUÇÃO = a GRADE DO MÊS (ProdGrade.js): uma linha por funcionária, uma coluna por dia, o número é quantas peças ela fez; clicar num número abre a janela de lançamento (ProdEditorDia.js).
// PREMIAÇÃO (só diretoria) = ranking do mês com metas pelos dias trabalhados e bônus por % da meta (ProdPremiacao.js). FUNCIONÁRIAS e CÓDIGOS E CATEGORIAS (só diretoria) = ProdConfig.js, uma visão por aba;
// as faixas do bônus são só consulta (blocos na Premiação, fixas no código). Regras em domain/producao.js (estado s.pr). NÃO é a Montagem de kits.
import { AbaProdConfig } from "@/apps/montagem/pages/producao/ProdConfig";
import { AbaProdGrade } from "@/apps/montagem/pages/producao/ProdGrade";
import { AbaProdControleCasa } from "@/apps/montagem/pages/producao/ProdControleCasa";
import { AbaProdPagamentos } from "@/apps/montagem/pages/producao/ProdPagamentos";
import { AbaProdExterna as AbaProdExternaTela } from "@/apps/montagem/pages/producao/ProdExterna";
import { AbaProdPremiacao } from "@/apps/montagem/pages/producao/ProdPremiacao";
import { Raiz } from "@/apps/montagem/pages/producao/visualProd";
import { e } from "@/shared/react";

function AbaProducao(){ return e(AbaProdGrade,null); }
function AbaPremiacao(){ return e(AbaProdPremiacao,null); }
function AbaProdPagamentosTela(){ return e(AbaProdPagamentos,null); }
function AbaProdControleCasaTela(){ return e(AbaProdControleCasa,null); }
// PRODUÇÃO EXTERNA = controle diário + pagamentos da quarta numa tela só; CADASTRO = funcionárias e códigos lado a lado (Marcus, 16/11/2026: "muitas abas e muito espaço sobrando")
function AbaProdExterna(){ return e(AbaProdExternaTela,null); }
function AbaProdCadastro(){ return e(Raiz,null, e(AbaProdConfig,{key:"f", visao:"func", semRaiz:true}), e(AbaProdConfig,{key:"c", visao:"cod", colunas:2, semRaiz:true})); }
function AbaProdFuncionarias(){ return e(AbaProdConfig,{visao:"func"}); }
function AbaProdCodigos(){ return e(AbaProdConfig,{visao:"cod"}); }
export { AbaProducao, AbaPremiacao, AbaProdPagamentosTela as AbaProdPagamentos, AbaProdControleCasaTela as AbaProdControleCasa, AbaProdFuncionarias, AbaProdCodigos, AbaProdExterna, AbaProdCadastro };

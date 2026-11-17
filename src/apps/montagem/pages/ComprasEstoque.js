// Sorelly Admin · montagem — pages/ComprasEstoque.js
// Materiais e estoque → Compras e estoque de material. Desde 17/11/2026 (pedido do Marcus: "igual ao Financeiro") cada tela é um ITEM DO MENU do topo
// (navigation/setores.js, MENU_ESTOQUE), e não mais abas dentro de uma tela só. Este arquivo só entrega cada tela. Corpos em pages/compras/.
// Estoque Sorelly (estoque geral de peças, mês a mês) NÃO é esta tela: mora no Financeiro.
import { AbaCompraVisao } from "@/apps/montagem/pages/compras/VisaoCompras";
import { AbaCompraCadastros, AbaCompraConfig, AbaEstoqueMaterial, AbaEstoqueMovimentos, AbaEstoqueSolicitacoes } from "@/apps/montagem/pages/compras/EstoqueCadastros";
import { PainelComprasEstoque } from "@/apps/montagem/pages/compras/PainelComprasEstoque";
import { AbaTabelaPrecos } from "@/apps/montagem/pages/compras/TabelaPrecos";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e } from "@/shared/react";

// filtro pedido pela Visão geral ao abrir o Funil de compras (outra tela do menu)
var FILTRO = {valor:null};

function Tela(t, sub, corpo){ return e("div",{className:"flex flex-col gap-2.5"}, e(PageHead,{t:t, sub:sub}), corpo); }

// primeira tela = Funil de compras, no padrão do Funil de pedidos (tem o próprio título no bloco azul, sem PageHead)
function AbaComprasEstoque(){ return e(PainelComprasEstoque,null); }
// Quadro e Planilha saíram do menu (17/11/2026): o Funil de compras faz os dois. Os endereços antigos e os links da Visão geral abrem o Funil já filtrado.
function AbaComprasQuadro(){ var f = FILTRO.valor; return e(PainelComprasEstoque,{key:"q"+JSON.stringify(f), modo:"quadro", filtroInicial:f}); }
function AbaComprasPlanilha(){ return e(PainelComprasEstoque,{key:"p", modo:"planilha"}); }
function AbaComprasVisao(){ var cx = use(); return e(AbaCompraVisao,{onIrQuadro:function(f){ FILTRO.valor = f || null; cx.dispatch({type:"ABA", aba:"cequadro"}); }}); }
function AbaEstoqueMateriais(){ return Tela("Estoque de material", "Saldo de cada material e alertas.", e(AbaEstoqueMaterial,null)); }
function AbaEstoqueMovs(){ return Tela("Movimentos", "Entradas e saídas do estoque de material.", e(AbaEstoqueMovimentos,null)); }
function AbaEstoquePedidos(){ return Tela("Pedidos de material", "Retiradas de material do estoque pelos setores.", e(AbaEstoqueSolicitacoes,null)); }
function AbaComprasPrecos(){ return e(AbaTabelaPrecos,null); }   // tela do Nickolas (16/11/2026), sem mudança
function AbaComprasCadastros(){ return e(AbaCompraCadastros,null); }
function AbaComprasConfig(){ return e(AbaCompraConfig,null); }

export { AbaComprasEstoque, AbaComprasQuadro, AbaComprasPlanilha, AbaComprasVisao, AbaEstoqueMateriais, AbaEstoqueMovs, AbaEstoquePedidos, AbaComprasPrecos, AbaComprasCadastros, AbaComprasConfig };

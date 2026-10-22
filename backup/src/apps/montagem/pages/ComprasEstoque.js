// Sorelly Admin · montagem — pages/ComprasEstoque.js
// Materiais e estoque → Compras e estoque de material: uma tela só, com abas. Os corpos ficam em pages/compras/ (Compras.js e EstoqueCadastros.js).
// Estoque Sorelly (estoque geral de peças, mês a mês) NÃO é esta tela: mora no Financeiro.
import { AbaCompraPlanilha, AbaCompraQuadro, AbaCompraVisao } from "@/apps/montagem/pages/compras/Compras";
import { AbaCompraCadastros, AbaCompraConfig, AbaEstoqueMaterial, AbaEstoqueMovimentos, AbaEstoqueSolicitacoes } from "@/apps/montagem/pages/compras/EstoqueCadastros";
import { Abas } from "@/apps/montagem/components/padrao";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["quadro","Quadro de compras"], ["planilha","Planilha de compras"], ["visao","Visão geral"], ["estoque","Estoque de material"], ["movimentos","Movimentos"], ["solicitacoes","Pedidos de material"], ["cadastros","Cadastros"], ["config","Configurações"]];
var COR = "#3B82F6";   // cor do setor (azul, igual ao Financeiro)

function AbaComprasEstoque(){
  var st = useState({aba:"quadro", filtro:null}), v = st[0];
  var ir = function(aba, filtro){ st[1]({aba:aba, filtro:filtro||null}); };
  var corpo = v.aba==="quadro" ? e(AbaCompraQuadro,{key:"q"+JSON.stringify(v.filtro), filtroInicial:v.filtro})
    : v.aba==="planilha" ? e(AbaCompraPlanilha,null)
    : v.aba==="visao" ? e(AbaCompraVisao,{onIrQuadro:function(f){ ir("quadro", f); }})
    : v.aba==="estoque" ? e(AbaEstoqueMaterial,null)
    : v.aba==="movimentos" ? e(AbaEstoqueMovimentos,null)
    : v.aba==="solicitacoes" ? e(AbaEstoqueSolicitacoes,null)
    : v.aba==="cadastros" ? e(AbaCompraCadastros,null)
    : e(AbaCompraConfig,null);
  return e("div",{className:"flex flex-col gap-2.5"},
    e(PageHead,{t:"Compras e estoque de material", sub:"Solicitações, aprovação, compra, recebimento e estoque de material."}),
    e(Abas,{abas:ABAS, atual:v.aba, onMudar:function(a){ ir(a, null); }, cor:COR}),
    corpo);
}
export { AbaComprasEstoque };

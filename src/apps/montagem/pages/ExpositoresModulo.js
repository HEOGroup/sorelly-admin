// Sorelly Admin · montagem — pages/ExpositoresModulo.js
// Expositores: uma tela só, com abas (Quadro, Fila de espera, Danificados, Estoque de expositores, Clientes, Fotos dos kits novos). Os corpos ficam em pages/expositores/.
// "Condicional" aqui é o EXPOSITOR emprestado à cliente (não a condicional do consignado). Regras em domain/expositores.js; estado s.ex.
// Cor do módulo: laranja do Cadastro de revendedoras / Kits novos.
import { Abas, Pagina } from "@/apps/montagem/components/padrao";
import { AbaExClientes } from "@/apps/montagem/pages/expositores/Clientes";
import { AbaExDanificados } from "@/apps/montagem/pages/expositores/Danificados";
import { AbaExEstoque } from "@/apps/montagem/pages/expositores/EstoqueEx";
import { AbaExFila } from "@/apps/montagem/pages/expositores/Fila";
import { AbaExFotosKN } from "@/apps/montagem/pages/expositores/FotosKitNovo";
import { AbaExQuadro } from "@/apps/montagem/pages/expositores/Quadro";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var ABAS = [["quadro", "Quadro"], ["fila", "Fila de espera"], ["danificados", "Danificados"], ["estoque", "Estoque de expositores"], ["clientes", "Clientes"], ["fotos", "Fotos dos kits novos"]];
var CORPOS = {quadro:AbaExQuadro, fila:AbaExFila, danificados:AbaExDanificados, estoque:AbaExEstoque, clientes:AbaExClientes, fotos:AbaExFotosKN};
var COR = "#F97316";   // laranja (setor Cadastro de revendedoras)

function AbaExpositoresModulo(){
  var st = useState("quadro"), aba = st[0], Corpo = CORPOS[aba] || AbaExQuadro;
  return e(Pagina, null,
    e(PageHead,{t:"Expositores", sub:"Montagem, saída, devolução e controle dos expositores emprestados às clientes."}),
    e(Abas,{abas:ABAS, atual:aba, onMudar:st[1], cor:COR}),
    e(Corpo,{key:aba}));
}
export { AbaExpositoresModulo };

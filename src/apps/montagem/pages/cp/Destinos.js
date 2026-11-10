// Sorelly Admin · montagem — pages/cp/Destinos.js
// Financeiro › Pagamentos › Controle de pagamentos › aba Destinos (10/11/2026, pedido do Marcus: o Lucas precisa ver banco, favorecido e chave Pix de cada destino).
// Tabela em layout D (TabelaCampos). Nada é digitado de novo: banco, favorecido, chave e "Escrever na folha" vêm de Financeiro › Bancos › Chaves Pix (lib/chave-do-destino.js).
// Destino sem chave cadastrada mostra "Sem chave Pix" em amarelo. O botão Copiar gera a mensagem de Pix (a mesma de Chaves Pix).
import { CopiarChave } from "@/apps/montagem/components/copiar-chave";
import { BlocoFiltros, Botao, CAMPO, CampoSel, FileiraCampos, Rotulo, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { TIPOS_DESTINO } from "@/apps/montagem/domain/controle-pagamentos";
import { chavesDoDestino } from "@/apps/montagem/lib/chave-do-destino";
import { e, useEffect, useState } from "@/shared/react";

var tipoNome = function(t){ return (TIPOS_DESTINO[t] || ["—"])[0]; };
var norm = function(t){ return String(t||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
// larguras pelo MAIOR texto de cada coluna (nada quebra e nada é cortado): o favorecido mais longo é "Mayz Comércio de Moda Praia, Lingeries e Acessórios Ltda"
var COLUNAS = [{t:"Destino", w:"18rem"}, {t:"Tipo", w:"11rem"}, {t:"Escrever na folha", w:"17rem"}, {t:"Banco", w:"10rem"}, {t:"Favorecido", w:"28rem"}, {t:"Chave Pix", w:"19rem"}, {t:"Copiar", w:"6rem"}, {t:"Ativo", w:"5rem"}];

// p.c = {s (estado), cp, d (dispatch), por, edita}, o mesmo objeto de ControlePagamentos.js
function AbaDestinos(p){
  var c = p.c, cp = c.cp, sq = useState(""), q = sq[0], setQ = sq[1], st = useState(""), tipo = st[0], setTipo = st[1], sn = useState({nome:"", tipo:"FORNECEDOR"}), nd = sn[0], setNd = function(x){ sn[1](Object.assign({}, nd, x)); };
  // o estado vem do servidor e passa por cima da migração do navegador: quem edita cria o destino da conta "PIX - ITAÚ PJ - MARCO" (cnpjId ITM) uma vez, se ele ainda não existe
  var falta = !cp.destinos.some(function(d){ return d.cnpjId==="ITM"; });
  var dispatch = c.d, por = c.por, edita = c.edita;
  useEffect(function(){ if(falta && edita) dispatch({type:"CP", op:"destino_add", por:por, nome:"Itaú Marco PJ", tipo:"CNPJ", cnpjId:"ITM"}); }, [falta, edita, dispatch, por]);
  var lista = cp.destinos.filter(function(d){ return d.tipo!=="PRESTADOR" && (!tipo || d.tipo===tipo) && (!q || norm(d.nome).indexOf(norm(q))>=0); });
  var acao = function(op, extra){ c.d(Object.assign({type:"CP", op:op, por:c.por}, extra)); };
  var linhas = [];
  lista.forEach(function(d){
    var chs = chavesDoDestino(c.s, d), itens = chs.length ? chs : [null];
    itens.forEach(function(k, i){
      linhas.push(e(FileiraCampos,{key:d.id+"|"+i, cells:[
        d.nome, tipoNome(d.tipo), k && k.folha ? k.folha : "—", k && k.banco ? k.banco : "—", k && k.fav ? k.fav : "—",
        k ? k.chave : {v:"Sem chave Pix", cor:"#FBBF24"},
        k ? e(CopiarChave,{texto:k.chave, rot:"Copiar", dados:{nome:d.nome, banco:k.banco, favorecido:k.fav, tipo:k.tipo}}) : "—",
        i===0 ? e("input",{type:"checkbox", checked:!!d.ativo, disabled:!c.edita, "aria-label":"Ativo: "+d.nome, className:"h-4 w-4 cursor-pointer accent-[#d4af37]", onChange:function(ev){ acao("destino_set", {id:d.id, patch:{ativo:ev.target.checked}}); }}) : ""]}));
    });
  });
  return e("div",{className:"flex flex-col gap-3"},
    e(BlocoFiltros,{titulo:"Destinos", onLimpar:(q || tipo) ? function(){ setQ(""); setTipo(""); } : null},
      e(CampoSel,{t:"Tipo", id:"cd-t", value:tipo, onChange:setTipo, opcoes:[["", "Todos"]].concat(Object.keys(TIPOS_DESTINO).filter(function(t){ return t!=="PRESTADOR"; }).map(function(t){ return [t, tipoNome(t)]; }))}),
      e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Buscar", id:"cd-q"}), e("input",{id:"cd-q", type:"search", value:q, onChange:function(ev){ setQ(ev.target.value); }, placeholder:"Nome do destino", className:CAMPO}))),
    c.edita && e(BlocoFiltros,{titulo:"Novo destino"},
      e("div",{className:"col-span-2 min-w-0"}, e(Rotulo,{t:"Nome", id:"cd-n"}), e("input",{id:"cd-n", type:"text", value:nd.nome, onChange:function(ev){ setNd({nome:ev.target.value}); }, className:CAMPO})),
      e(CampoSel,{t:"Tipo", id:"cd-nt", value:nd.tipo, onChange:function(v){ setNd({tipo:v}); }, opcoes:Object.keys(TIPOS_DESTINO).map(function(t){ return [t, tipoNome(t)]; })}),
      e("div",{className:"flex items-end"}, e(Botao,{principal:true, desabilitado:!nd.nome.trim(), onClick:function(){ acao("destino_add", {nome:nd.nome.trim(), tipo:nd.tipo, banco:"", chavePix:""}); setNd({nome:""}); }}, "Adicionar"))),
    linhas.length ? e(TabelaCampos,{minW:"114rem", cols:COLUNAS}, linhas)
    : e("p",{className:"rounded-lg border border-border px-4 py-6 text-center text-[13px] text-foreground"}, "Nenhum destino neste filtro."));
}
export { AbaDestinos };

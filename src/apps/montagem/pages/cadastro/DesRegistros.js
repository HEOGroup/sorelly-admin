// Sorelly Admin · montagem — pages/cadastro/DesRegistros.js
// Desempenho do cadastro › Registros: histórico das decisões (aprovadas e reprovadas). Busca e período no bloco Filtros; copiar a mensagem do kit e (só diretoria) desfazer a decisão.
import { Bloco, Botao, CampoBusca, FaixaTotais, TabelaP, Td, Tr } from "@/apps/montagem/components/padrao-fin";
import { FiltrosDesempenho, dbr, hora, nInt, paramsDe } from "@/apps/montagem/pages/cadastro/des-comum";
import { formatarValorKit, janela, mensagemKit, registros, rotuloKit } from "@/apps/montagem/domain/cadastro-leads";
import { podeDecidirCadastro } from "@/apps/montagem/domain/equipe";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

var LIMITE = 20;
function copiarTexto(txt){
  if(navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt);
  return new Promise(function(ok){ var ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); ok(); });
}
var MINI = "inline-flex h-6 items-center rounded-md border border-border px-2 text-[12px] hover:bg-white/10";

function DesRegistros(p){
  var cx = use(), s = cx.state, d = cx.dispatch, qs = useState(""), q = qs[0], pg = useState(1), pagina = pg[0], diretoria = podeDecidirCadastro(s.usuario);
  var j = p.f.modo==="tudo" ? {from:null, to:null} : janela(paramsDe(p.f));
  var r = registros(s.cl, {q:q, from:j.from||undefined, to:j.to||undefined, page:pagina, limit:LIMITE}), meta = r.meta;
  var copiar = function(l){ copiarTexto(mensagemKit(l.kitOpcao, l.kitValorCasa, l.kitValorEmpresa)).then(function(){ d({type:"AVISO", txt:"Mensagem do kit copiada.", tom:"ok"}); }); };
  var desfazer = function(l){ if(!window.confirm("Desfazer a decisão de "+l.nome+"? O cadastro volta para a fila de aprovação.")) return; d({type:"CL", op:"desfazer", id:l.id}); };
  var cols = [{t:"Nº", w:60, c:1}, {t:"Data", w:110, c:1}, {t:"Nome", w:210, c:1}, {t:"Cidade", w:150, c:1}, {t:"Telefone", w:130, c:1}, {t:"Resultado", w:100, c:1}, {t:"Kit", w:240, c:1}, {t:"Decidido por", w:120, c:1}].concat(diretoria ? [{t:"", w:210, c:1}] : [{t:"", w:130, c:1}]);
  return e("div",{className:"flex flex-col gap-3"},
    e(FiltrosDesempenho,{f:p.f, set:function(n){ pg[1](1); p.set(n); }}, e(CampoBusca,{key:"q", t:"Buscar", id:"des-q", value:q, placeholder:"Nome, empresa, cidade, telefone ou número", onChange:function(v){ qs[1](v); pg[1](1); }})),
    e(FaixaTotais,{itens:[{t:"Registros", v:nInt(meta.total)}, {t:"Pendentes agora", v:nInt(meta.pendentes), cor:meta.pendentes ? "text-warning" : ""}, {t:"Aprovadas hoje", v:nInt(meta.aprovadosHoje), cor:meta.aprovadosHoje ? "text-success" : ""}, {t:"Reprovadas hoje", v:nInt(meta.reprovadosHoje), cor:meta.reprovadosHoje ? "text-destructive" : ""}]}),
    e(Bloco,{t:"Cadastros revisados", dir:e("div",{className:"flex items-center gap-2"},
        e(Botao,{desabilitado:meta.page<=1, onClick:function(){ pg[1](meta.page-1); }}, "Anterior"),
        e("span",{className:"text-[12px] tabular-nums"}, meta.page+" / "+meta.paginas),
        e(Botao,{desabilitado:meta.page>=meta.paginas, onClick:function(){ pg[1](meta.page+1); }}, "Próxima"))},
      e(TabelaP,{cols:cols, minW:1180},
        r.itens.length ? r.itens.map(function(l){ var ap = l.reviewStatus==="APPROVED", kit = ap && l.kitOpcao ? rotuloKit(l.kitOpcao)+" · "+formatarValorKit(l.kitOpcao.indexOf("vir_empresa")===0 ? (l.kitValorEmpresa||0) : (l.kitValorCasa||0)) : "—";
          return e(Tr,{key:l.id},
            e(Td,{c:true}, "#"+l.id), e(Td,{c:true, title:dbr(l.reviewedAt)+" "+hora(l.reviewedAt)}, dbr(l.reviewedAt).slice(0, 5)+" "+hora(l.reviewedAt)), e(Td,{c:true, forte:true}, l.nome), e(Td,{c:true}, l.cidade || "—"), e(Td,{c:true}, l.telefone || "—"),
            e(Td,{c:true, forte:true, cor:ap ? "text-success" : "text-destructive"}, ap ? "Aprovada" : "Reprovada"), e(Td,{c:true}, kit), e(Td,{c:true}, l.reviewedBy || "—"),
            e(Td,{c:true}, e("span",{className:"flex justify-center gap-1"},
              ap && l.kitOpcao && e("button",{key:"c", type:"button", className:MINI, title:"Copiar a mensagem do kit para enviar de novo", onClick:function(){ copiar(l); }}, "Copiar mensagem"),
              diretoria && e("button",{key:"d", type:"button", className:MINI+" text-destructive", title:"Voltar este cadastro para a fila", onClick:function(){ desfazer(l); }}, "Desfazer"))));
        }) : e(Tr,{key:"vazio"}, e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "Nenhum registro neste filtro"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "—"), e(Td,{c:true}, "")))));
}

export { DesRegistros };

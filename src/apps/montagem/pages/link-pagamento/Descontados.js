// Sorelly Admin · montagem — pages/link-pagamento/Descontados.js
// Aba Descontados no acerto (Helen, 03/11/2026): os links pagos que já abateram um acerto, para conferir como na planilha dela. Cada coluna filtra pelo título (como no Agendamento).
import { GradeFiltro } from "@/apps/montagem/components/grade-filtro";
import { Pagina } from "@/apps/montagem/components/padrao";
import { formatarDia, formatarReais, meioDe, nomeMeio } from "@/apps/montagem/domain/link-pagamento";
import { useLp } from "@/apps/montagem/pages/link-pagamento/visual";
import { e } from "@/shared/react";

function AbaLpDescontados(){
  var L = useLp(), s = L.s, linhas = L.lp.solicitacoes.filter(function(x){ return x.acertoId; }).sort(function(a, b){ return String(b.usadoEm || "") < String(a.usadoEm || "") ? -1 : 1; });
  var dia = function(v){ return String(v || "").slice(0, 10); };
  var cols = [
    {k:"usado", t:"Descontado em", tipo:"data", v:function(x){ return dia(x.usadoEm); }, exib:function(x){ return formatarDia(x.usadoEm) || "—"; }},
    {k:"rev", t:"Revendedora", forte:true, v:function(x){ return x.revendedora; }},
    {k:"rep", t:"Representante", v:function(x){ return x.representante || "Sem representante"; }},
    {k:"link", t:"Link", v:function(x){ return nomeMeio(meioDe(s, x.meioId)); }},
    {k:"valor", t:"Valor do link", tipo:"num", v:function(x){ return Number(x.valor) || 0; }, exib:function(x){ return formatarReais(x.valor); }},
    {k:"parc", t:"Parcelas", tipo:"num", v:function(x){ return x.parcelas || 1; }, exib:function(x){ return (x.parcelas || 1) + "x"; }},
    {k:"pago", t:"Pago em", tipo:"data", v:function(x){ return dia(x.pagoEm); }, exib:function(x){ return formatarDia(x.pagoEm) || "—"; }},
    {k:"sobrou", t:"Sobrou", tipo:"num", v:function(x){ return Number(x.excedente) || 0; }, exib:function(x){ return formatarReais(x.excedente || 0); }},
    {k:"acerto", t:"Data do acerto", tipo:"data", v:function(x){ return dia(x.dataAcerto); }, exib:function(x){ return formatarDia(x.dataAcerto) || "—"; }}
  ];
  return e(Pagina,null, e(GradeFiltro,{chave:"descontados", rows:linhas, cols:cols, vazio:"Nenhum link foi descontado em acerto ainda."}));
}
export { AbaLpDescontados };

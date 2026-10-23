// Sorelly Admin · montagem — domain/artes-rev.js
// Artes que a revendedora baixa no app (tela "Artes & Criativos"). A fonte é o Marketing (s.mk.artes, s.mk.grupos); sem dados reais,
// mostra artes de DEMONSTRAÇÃO (marcadas demo:true, sem pessoas) com as fotos do catálogo, só para testar a tela.
// Cada item: {id, nome, tipo:"FEED"|"STORY"|"REELS", data, url (imagem para baixar), videoLink, legenda, demo}
var FOTO = function(c){ return "/fotos/catalogo/"+c+".jpg"; };
var ARTES_DEMO = [
  {id:"demo1", nome:"Brincos delicados", tipo:"FEED", data:"2026-10-15", url:FOTO("A2080"), legenda:"Brincos delicados para completar o seu look. Semijoias Sorelly, banho de qualidade.", demo:true},
  {id:"demo2", nome:"Novidades", tipo:"FEED", data:"2026-10-12", url:FOTO("A2072"), legenda:"Chegaram as novidades da semana! Fale comigo e escolha as suas.", demo:true},
  {id:"demo3", nome:"Presente especial", tipo:"STORY", data:"2026-10-10", url:FOTO("A2051"), legenda:"Um presente que encanta: semijoias com 1 ano de garantia.", demo:true},
  {id:"demo4", nome:"Brilho diário", tipo:"STORY", data:"2026-10-08", url:FOTO("A2089"), legenda:"Brilho para o dia a dia. Peça o seu link de pagamento em até 6x sem juros.", demo:true},
  {id:"demo5", nome:"Conheça o kit", tipo:"REELS", data:"2026-10-05", url:FOTO("A2112"), legenda:"Veja como é lindo receber o kit Sorelly em casa.", demo:true},
  {id:"demo6", nome:"Detalhes em ouro", tipo:"FEED", data:"2026-10-02", url:FOTO("A2114"), legenda:"Detalhes que fazem a diferença. Semijoias Sorelly.", demo:true}
];
var FILTROS_ARTE = [{v:"TODAS", r:"Todas"}, {v:"FEED", r:"Feed"}, {v:"STORY", r:"Story"}, {v:"REELS", r:"Reels"}];
var ehImg = function(a){ return a && /^image\//.test(a.mime||"") ; };
// artes disponíveis: do Marketing as que já estão agendadas/postadas e têm imagem ou vídeo; se não houver nenhuma, as de demonstração
function artesDisponiveis(s){
  var mk = (s && s.mk) || {artes:[], grupos:[]}, reais = [];
  (mk.artes||[]).forEach(function(x){
    if(x.status==="EM_PRODUCAO") return;
    var img = (x.anexos||[]).find(ehImg);
    if(!img && !x.videoLink) return;
    reais.push({id:"a"+x.id, nome:x.nome, tipo:x.tipo, data:x.data, url:img ? img.url : "", videoLink:x.videoLink||"", legenda:x.nome, demo:false});
  });
  (mk.grupos||[]).forEach(function(g){ (g.imagens||[]).forEach(function(i){ reais.push({id:"g"+g.id+"_"+i.id, nome:g.nome, tipo:"FEED", data:String(g.atualizadoEm||"").slice(0,10), url:i.url, videoLink:"", legenda:g.nome, demo:false}); }); });
  var lista = reais.length ? reais : ARTES_DEMO;
  return lista.slice().sort(function(a, b){ return String(b.data).localeCompare(String(a.data)); });
}
var rotuloTipoArte = function(t){ return t==="STORY" ? "Story" : t==="REELS" ? "Reels" : "Feed"; };
export { ARTES_DEMO, FILTROS_ARTE, artesDisponiveis, rotuloTipoArte };

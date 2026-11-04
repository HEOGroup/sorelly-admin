// Sorelly Admin · montagem — lib/ficha-impressao.js
// Folha A4 da ficha de experiência (03/11/2026, a partir do modelo da Maria/RH): abre numa janela própria, fundo branco, e chama a impressão (dá para salvar em PDF).
// Só leitura: monta o texto com o que já está na ficha. Linhas de assinatura: Gestor, RH e Direção (a colaboradora não assina nem vê a ficha).
import { ORIGENS, ROTULO_REC } from "@/apps/montagem/domain/rh-ficha";

var esc = function(v){ return String(v==null ? "" : v).replace(/[&<>"']/g, function(x){ return {"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[x]; }); };
var num = function(n){ return n===null || n===undefined ? "—" : String(n).replace(".", ","); };
var br = function(iso){ return iso ? iso.split("-").reverse().join("/") : "—"; };

var CSS = "@page{size:A4;margin:12mm}*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;font-size:11pt;line-height:1.4;color:#2b2118;background:#fff}"
  + ".cab{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #c8952e;padding-bottom:10px;margin-bottom:12px}.marca b{display:block;font-size:20pt;letter-spacing:5px;color:#1b1309}.marca small{color:#8a7a62;font-size:8pt;letter-spacing:1px;text-transform:uppercase}"
  + ".tit{text-align:right}.tit h1{font-size:14pt;margin:0;color:#1b1309}.tit p{margin:2px 0 0;color:#8a7a62;font-size:9pt}"
  + "h2{font-size:9pt;text-transform:uppercase;letter-spacing:1px;color:#9c7226;margin:12px 0 5px}"
  + ".id{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #e6dccb;border-radius:6px}.id div{padding:5px 8px;border-right:1px solid #eee5d6;border-bottom:1px solid #eee5d6}.id span{display:block;font-size:7.5pt;text-transform:uppercase;letter-spacing:.5px;color:#8a7a62;font-weight:700}.id b{font-size:10pt}.id .l{grid-column:span 2}"
  + ".res{display:grid;grid-template-columns:140px 1fr;gap:10px}.nota{background:#1b1309;color:#f4e2bb;border-radius:6px;padding:10px;text-align:center}.nota span{font-size:8pt;letter-spacing:1px;text-transform:uppercase;color:#e3b04b;font-weight:700}.nota b{display:block;font-size:28pt;line-height:1.1}.nota small{color:#c9b890;font-size:9pt}"
  + ".ver{border:1px solid #e6dccb;border-radius:6px;padding:8px 10px}.ver p{margin:0 0 4px}"
  + "table{width:100%;border-collapse:collapse}*{-webkit-print-color-adjust:exact;print-color-adjust:exact}thead{background:linear-gradient(90deg,#9A6F1E,#E8B84B 48%,#F5E7BE)}th{background:transparent;color:#1a1306;font-size:8pt;text-transform:uppercase;letter-spacing:.5px;padding:5px 7px;text-align:center}td{padding:5px 7px;border-bottom:1px solid #eee5d6;font-size:10pt;text-align:center}td.e,th.e{text-align:left}.neg{color:#9c3a30;font-weight:700}"
  + ".par{border:1px solid #e6dccb;border-radius:6px;padding:8px 10px;min-height:55px;white-space:pre-wrap}"
  + ".ass{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:46px}.ass div{border-top:1px solid #6c6254;padding-top:5px;text-align:center;font-size:9pt;color:#4a3f33}"
  + ".rod{margin-top:16px;border-top:1px solid #eee5d6;padding-top:6px;font-size:8pt;color:#8a7a62}tr,.id,.res{break-inside:avoid}";

function htmlFicha(p){
  var colab = p.colab, cfg = p.cfg, f = p.ficha, r = p.res, tipos = {}; cfg.tipos.forEach(function(t){ tipos[t.id] = t; });
  var ocs = (f.ocorrencias||[]).slice().sort(function(a, b){ return a.data.localeCompare(b.data); });
  var perdidos = ocs.reduce(function(t, o){ return t + (tipos[o.tipoId] ? tipos[o.tipoId].desc : 0); }, 0);
  var dec = {aprovar:"Efetivar", acompanhar:"Acompanhar e reavaliar", nao:"Não efetivar"}[f.decisao] || "Não definida";
  var d = p.datas || {};
  return "<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>Ficha de experiência · "+esc(colab.nome)+"</title><style>"+CSS+"</style></head><body>"
    + "<div class='cab'><div class='marca'><b>SORELLY</b><small>Recursos Humanos</small></div><div class='tit'><h1>Ficha de avaliação de experiência</h1><p>Emitida em "+br(p.hoje)+" · uso interno</p></div></div>"
    + "<h2>Identificação</h2><div class='id'><div class='l'><span>Colaboradora</span><b>"+esc(colab.nome)+"</b></div><div><span>Setor</span><b>"+esc(colab.setor)+"</b></div><div><span>Admissão</span><b>"+br(colab.admissao)+"</b></div>"
    + "<div><span>1ª avaliação</span><b>"+br(d.a1)+"</b></div><div><span>2ª avaliação</span><b>"+br(d.a2)+"</b></div><div><span>Efetivação</span><b>"+br(d.ef)+"</b></div><div><span>Data desta avaliação</span><b>"+br(f.dataAvaliacao)+"</b></div></div>"
    + "<h2>Resultado</h2><div class='res'><div class='nota'><span>Pontuação final</span><b>"+(r.total===null ? "—" : num(r.total))+"</b><small>de 100 pontos</small></div>"
    + "<div class='ver'><p><b>Recomendação:</b> "+esc(ROTULO_REC[r.recomendacao])+"</p><p><b>Decisão registrada:</b> "+esc(dec)+"</p><p><b>Ocorrências:</b> "+ocs.length+" · −"+num(perdidos)+" ponto(s)</p></div></div>"
    + "<h2>Composição da pontuação</h2><table><thead><tr><th class='e'>Categoria</th><th>Pontos</th><th>Máximo</th><th>Origem</th></tr></thead><tbody>"
    + cfg.categorias.map(function(c){ var x = r.porCat[c.id]; return "<tr><td class='e'>"+esc(c.nome)+"</td><td><b>"+num(x.pontos)+"</b></td><td>"+c.max+"</td><td>"+(c.nota ? "Nota do gestor: "+num(x.nota)+" de 10" : (x.desc ? "−"+num(x.desc)+" por ocorrências" : "Sem ocorrências"))+"</td></tr>"; }).join("")
    + "</tbody></table>"
    + "<h2>Ocorrências no período</h2>" + (ocs.length ? "<table><thead><tr><th>Data</th><th class='e'>Ocorrência</th><th>Origem</th><th>Pontos</th></tr></thead><tbody>"
      + ocs.map(function(o){ var t = tipos[o.tipoId]; return "<tr><td>"+br(o.data)+"</td><td class='e'>"+esc(t ? t.nome : "Tipo removido")+(o.obs ? " — "+esc(o.obs) : "")+"</td><td>"+esc(ORIGENS[o.origem] || "RH")+"</td><td class='neg'>−"+num(t ? t.desc : 0)+"</td></tr>"; }).join("") + "</tbody></table>" : "<p>Nenhuma ocorrência lançada.</p>")
    + "<h2>Parecer</h2><div class='par'>"+esc(f.parecer || "")+"</div>"
    + "<div class='ass'><div>Gestor do setor</div><div>Recursos Humanos</div><div>Direção</div></div>"
    + "<div class='rod'>Uso interno. A pontuação ajuda na decisão, mas não substitui a análise do RH. Não registrar diagnóstico nem CID.</div>"
    + "</body></html>";
}

// abre a folha numa janela nova e chama a impressão (se o navegador bloquear a janela, avisa)
function imprimirFicha(p){
  var w = window.open("", "_blank", "width=900,height=1000");
  if(!w){ window.alert("O navegador bloqueou a janela da ficha. Libere pop-ups para este site e tente de novo."); return; }
  w.document.open(); w.document.write(htmlFicha(p)); w.document.close();
  w.focus(); setTimeout(function(){ w.print(); }, 400);
}

export { imprimirFicha, htmlFicha };

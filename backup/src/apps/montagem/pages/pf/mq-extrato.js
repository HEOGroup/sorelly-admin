// Sorelly Admin · montagem — pages/pf/mq-extrato.js
// Listagem de cartão da Maquininha Banho para enviar ao fornecedor (HTML original: htmlListagemMq, mqeGrupos, mqeMsg, tokenMq).
// Só apresentação: os dados vêm de domain/pf.js. O endereço-base do link é um EXEMPLO (igual ao do HTML original): trocar quando o sistema estiver online.
import { MQ_MAQUINAS, dbr, forn, hojeIso, mesLabel, mqPassadasDoMes } from "@/apps/montagem/domain/pf";
import { BKC } from "@/apps/montagem/lib/format";

var BASE_LINK = "https://acertos.sorelly.com.br/f/";
var tokens = {};   // um código por (conta|mês|maquininha), só nesta sessão (igual ao HTML)
function tokenMq(k){ if(!tokens[k]) tokens[k] = Math.random().toString(36).slice(2,8)+Math.random().toString(36).slice(2,8); return tokens[k]; }
function esc(t){ return String(t==null ? "" : t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
function slug(t){ return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function nomeForn(pf){ var f = forn(pf, pf.mqFornId); return f ? f.nome : "Fornecedor"; }

// passadas do mês agrupadas por maquininha (as da lista oficial primeiro)
function mqeGrupos(pf, mes, maq){
  var ps = mqPassadasDoMes(pf, mes).filter(function(p){ return !maq || p.maq===maq; }), g = {};
  ps.forEach(function(p){ (g[p.maq] = g[p.maq]||[]).push(p); });
  var ordem = MQ_MAQUINAS.filter(function(m){ return g[m]; }).concat(Object.keys(g).filter(function(m){ return MQ_MAQUINAS.indexOf(m)<0; }));
  return ordem.map(function(m){ return {maq:m, itens:g[m], total:g[m].reduce(function(s,p){ return s+p.valor; }, 0)}; });
}
function mqeLink(pf, mes, maq){ return BASE_LINK+"cartao/"+tokenMq(pf.mqFornId+"|"+mes+"|"+(maq||"")); }
function mqeNomeArq(pf, mes, maq){ return "cartao-"+slug(nomeForn(pf))+"-"+mes+(maq ? "-"+slug(maq) : "")+".html"; }

// o arquivo que o fornecedor recebe (página única, só leitura)
function htmlListagemMq(pf, mes, maq){
  var nome = nomeForn(pf), gs = mqeGrupos(pf, mes, maq);
  var tot = gs.reduce(function(s,g){ return s+g.total; }, 0), n = gs.reduce(function(s,g){ return s+g.itens.length; }, 0);
  var titulo = maq ? maq : "Todas as maquininhas";
  var blocos = gs.map(function(g){
    return '<section class="grp"><div class="grp-h"><h2>'+esc(g.maq)+'</h2><span class="grp-t">'+g.itens.length+' passada(s) · <b>'+BKC(g.total)+'</b></span></div>'+
      '<div class="tw"><table><thead><tr><th>Data</th><th>Revendedora</th><th>Bandeira</th><th>Parcela</th><th class="n">Valor</th></tr></thead><tbody>'+
      g.itens.map(function(p){ return '<tr><td>'+dbr(p.data)+'</td><td>'+esc(p.rev)+'</td><td>'+esc(p.band)+'</td><td>'+esc(p.parc)+'</td><td class="n">'+BKC(p.valor)+'</td></tr>'; }).join("")+
      '<tr class="st"><td colspan="4">Subtotal '+esc(g.maq)+'</td><td class="n">'+BKC(g.total)+'</td></tr></tbody></table></div></section>';
  }).join("");
  var resumo = gs.length>1 ? '<div class="res">'+gs.map(function(g){ return '<div><span>'+esc(g.maq)+'</span><b>'+BKC(g.total)+'</b></div>'; }).join("")+'</div>' : "";
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">'+
    '<title>Cartão '+esc(nome)+' — '+mesLabel(mes+"-01")+(maq ? " — "+esc(maq) : "")+'</title><style>'+
    '*{box-sizing:border-box}body{margin:0;background:#0f1012;color:#f2f2f0;'+
    "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;line-height:1.5;padding:18px}"+
    '.wrap{max-width:760px;margin:0 auto}'+
    'header{border-bottom:2px solid #2a2c31;padding-bottom:16px;margin-bottom:18px}'+
    '.emp{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ffd633;font-weight:700}'+
    'h1{font-size:23px;margin:6px 0 2px}.per{font-size:14.5px;opacity:.8}'+
    '.tot{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px}'+
    '.tot div,.res div{background:#17181c;border:1px solid #2a2c31;border-radius:10px;padding:12px}'+
    '.tot span,.res span{display:block;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;opacity:.7;font-weight:600}'+
    '.tot b{display:block;font-size:18px;margin-top:3px;font-variant-numeric:tabular-nums}'+
    '.res{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:22px}'+
    '.res b{display:block;font-size:15px;margin-top:3px;color:#4dd4d4;font-variant-numeric:tabular-nums}'+
    '.grp{margin-bottom:26px}.grp-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px;border-left:3px solid #ffd633;padding-left:10px}'+
    'h2{font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#ffd633;margin:0}.grp-t{font-size:13.5px;opacity:.85}'+
    '.tw{overflow-x:auto;border:1px solid #2a2c31;border-radius:10px}'+
    'table{width:100%;border-collapse:collapse;font-size:14px}th,td{padding:9px 11px;text-align:left;border-bottom:1px solid #22242a;white-space:nowrap}'+
    'td:nth-child(2){white-space:normal}th{background:#17181c;font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;opacity:.8}'+
    '.n{text-align:right;font-variant-numeric:tabular-nums}.st td{background:#17181c;font-weight:800;color:#3ecf8e;border-bottom:0}'+
    '.vazio{background:#17181c;border:1px dashed #2a2c31;border-radius:10px;padding:20px;text-align:center;opacity:.8}'+
    'footer{margin-top:26px;padding-top:15px;border-top:1px solid #2a2c31;font-size:12.5px;opacity:.65}'+
    '@media print{body{background:#fff;color:#000}.tot div,.res div,th,.st td{background:#fff}.grp{break-inside:avoid}}'+
    '</style></head><body><div class="wrap">'+
    '<header><div class="emp">Grupo Sorelly</div><h1>'+esc(nome)+'</h1>'+
    '<div class="per">Passadas no cartão · '+mesLabel(mes+"-01")+' · '+esc(titulo)+'</div></header>'+
    '<div class="tot"><div><span>Total passado</span><b>'+BKC(tot)+'</b></div><div><span>Passadas</span><b>'+n+'</b></div></div>'+
    resumo+
    (gs.length ? blocos : '<div class="vazio">Nenhuma passada lançada neste mês.</div>')+
    '<footer>Listagem gerada em '+dbr(hojeIso())+' pelo Grupo Sorelly. Documento somente para conferência — em caso de divergência, responda no mesmo contato.</footer>'+
    '</div></body></html>';
}

// mensagem pronta de WhatsApp
function mqeMensagem(pf, mes, maq){
  var gs = mqeGrupos(pf, mes, maq), nome = nomeForn(pf);
  var tot = gs.reduce(function(s,g){ return s+g.total; }, 0), n = gs.reduce(function(s,g){ return s+g.itens.length; }, 0);
  return "Olá, *"+nome+"*! 👋\n\n"+
    "Segue a listagem das *passadas no cartão* de *"+mesLabel(mes+"-01")+"*"+(maq ? " na maquininha *"+maq+"*" : "")+":\n\n"+
    gs.map(function(g){ return "💳 *"+g.maq+"*: "+g.itens.length+" passada(s) — *"+BKC(g.total)+"*"; }).join("\n")+"\n\n"+
    "💰 Total passado: *"+BKC(tot)+"*\n"+
    "📄 Passadas: *"+n+"*\n\n"+
    "Confira a listagem completa aqui:\n"+mqeLink(pf, mes, maq)+"\n\n"+
    "Qualquer divergência, é só responder por aqui. Obrigado! 🙏";
}

// baixa/abre o arquivo (Blob). Devolve o endereço temporário.
function blobUrl(html){ return URL.createObjectURL(new Blob([html], {type:"text/html"})); }
function baixarHtml(html, nomeArq){
  var url = blobUrl(html), a = document.createElement("a"); a.href = url; a.download = nomeArq; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function(){ URL.revokeObjectURL(url); }, 4000);
}
function abrirHtml(html){ window.open(blobUrl(html), "_blank"); }
function copiar(texto, ok){
  var fim = function(){ if(ok) ok(); };
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(texto).then(fim, function(){}); return; }
  var ta = document.createElement("textarea"); ta.value = texto; document.body.appendChild(ta); ta.select(); try{ document.execCommand("copy"); }catch(x){} ta.remove(); fim();
}

export { BASE_LINK, mqeGrupos, mqeLink, mqeNomeArq, htmlListagemMq, mqeMensagem, baixarHtml, abrirHtml, copiar };

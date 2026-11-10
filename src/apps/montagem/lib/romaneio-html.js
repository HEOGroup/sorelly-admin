// Sorelly Admin · montagem — lib/romaneio-html.js
// Página impressa do romaneio de uma compra de bruto (06/11/2026). Duas versões, as duas SEM preço, valor, desconto ou total em R$:
//   "pontual" → foto, ref., descrição, quantidade, banho e uma coluna em branco "Qtd. recebida" (a Pontual preenche à mão)
//   "rayssa"  → foto, ref., descrição, quantidade recebida (se vazia vale a do pedido) e banho
// htmlRomaneio(compra, modo, urls) devolve o HTML pronto para o window.print() (foto grande de 5,2 cm, cabeçalho que repete, linha que não quebra entre páginas). urls = {fotoId: dataURL}.
import { recebidoDe, rotuloBanho } from "@/apps/montagem/domain/compra-bruto";

function esc(t){ return String(t==null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function dmy(iso){ var p = String(iso||"").split("-"); return p.length===3 ? p[2]+"/"+p[1]+"/"+p[0] : ""; }

export function htmlRomaneio(cp, modo, urls, fotoDa){
  var rayssa = modo==="rayssa", u = urls || {}, pecas = 0;
  var linhas = cp.linhas.map(function(l){
    var fid = fotoDa ? fotoDa[l.id] : "", img = fid && u[fid] ? '<img src="'+u[fid]+'" alt="">' : '<span class="sem">Sem foto</span>', q = rayssa ? recebidoDe(l) : l.qtd;
    pecas += q;
    return "<tr><td class=\"f\">"+img+"</td><td>"+esc(l.ref)+"</td><td>"+esc(l.desc)+"</td><td class=\"n\">"+q+"</td><td>"+esc(rotuloBanho(l.banho, l.verniz) || "—")+"</td>"+(rayssa ? "" : "<td class=\"v\"></td>")+"</tr>";
  }).join("");
  var titulo = rayssa ? "Romaneio para a Rayssa" : "Romaneio para a Pontual";
  var cab = "<tr><th>Foto</th><th>Ref.</th><th>Descrição</th><th>"+(rayssa ? "Qtd. recebida" : "Quantidade")+"</th><th>Banho</th>"+(rayssa ? "" : "<th>Qtd. recebida</th>")+"</tr>";
  return "<!doctype html><html lang=\"pt-BR\"><head><meta charset=\"utf-8\"><title>"+esc(titulo)+" "+esc(cp.controle)+"</title><style>"+
    "@page{size:A4;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:13px}"+
    "h1{font-size:18px;margin:0 0 4px}p{margin:0 0 10px}table{width:100%;border-collapse:collapse}thead{display:table-header-group}"+
    "th{background:#222;color:#fff;text-transform:uppercase;font-size:11px;padding:6px;border:1px solid #222}td{border:1px solid #bbb;padding:6px;text-align:center;vertical-align:middle}"+
    "tr{page-break-inside:avoid}td.f{width:5.6cm}td.f img{width:5.2cm;height:5.2cm;object-fit:contain}.sem{border:1px dashed #888;display:inline-block;padding:18px 10px}td.n{font-size:16px;font-weight:bold}td.v{width:3.2cm}"+
    "tfoot td{font-weight:bold;background:#eee}</style></head><body><h1>"+esc(titulo)+"</h1><p>Fornecedor: "+esc(cp.forn)+" · Controle: "+esc(cp.controle || "—")+" · Emissão: "+esc(dmy(cp.emissao) || "—")+" · Banho: "+esc(cp.galv || "Pontual")+"</p>"+
    "<table><thead>"+cab+"</thead><tbody>"+linhas+"</tbody><tfoot><tr><td colspan=\"3\">Total de peças</td><td class=\"n\">"+pecas+"</td><td colspan=\""+(rayssa ? 1 : 2)+"\"></td></tr></tfoot></table></body></html>";
}

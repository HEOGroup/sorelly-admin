// Sorelly Admin · montagem — pages/ResumoGrupo.js
// RESUMO DO GRUPO (Marcus, 09/11/2026): o quadro que o Lucas mandava todo dia no grupo dos sócios, agora sai do sistema.
// Abas no topo: Geral e cada sócio (e a Casa). Cada aba tem a tabela, a mensagem copiável do WhatsApp e a imagem para baixar.
// Os números vêm do Pagamentos a fornecedores (s.pf) e do Financeiro familiar (s.ff); a conta fica em domain/resumo-grupo.js.
import { Bloco, Botao, CAMPO, FileiraCampos, Segmentado, TabelaCampos } from "@/apps/montagem/components/padrao-fin";
import { Pagina } from "@/apps/montagem/components/padrao";
import { temAutorizacao } from "@/apps/montagem/domain/autorizacoes";
import { hojeIso, hojeYm, janela, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";
import { SOCIOS, brlGrupo as brl, mensagem, resumoGrupo, visaoSocio } from "@/apps/montagem/domain/resumo-grupo";
import { use } from "@/apps/montagem/state/context";
import { PageHead } from "@/apps/montagem/ui/page";
import { e, useState } from "@/shared/react";

var OK = "#4CC38A", RUIM = "#F26D6D", AVISO = "#F0B429";
var COLS = [{t:"Nome", w:"34%"}, {t:"A pagar", w:"16%"}, {t:"Pago", w:"16%"}, {t:"Falta", w:"18%"}, {t:"Prazo"}];
var COLS_P = [{t:"Prestador", w:"50%"}, {t:"Falta", w:"26%"}, {t:"Prazo"}];

// célula de saldo: ✕ vermelho quando venceu e não foi pago, verde quando quitado, amarelo em aberto
var celFalta = function(x){ return {v:(x.atrasado ? "✕ " : "")+brl(x.falta), cor:x.atrasado ? RUIM : x.falta<=0.005 ? OK : AVISO}; };
var celPrazo = function(x){ return {v:x.prazo+(x.atrasado ? " · venceu" : ""), cor:x.atrasado ? RUIM : undefined}; };
var linha = function(x, i){ return e(FileiraCampos,{key:i, cells:[x.nome, brl(x.aPagar), {v:brl(x.pago), cor:x.pago>0.005 ? OK : undefined}, celFalta(x), celPrazo(x)]}); };
var linhaP = function(x, i){ return e(FileiraCampos,{key:i, cells:[x.nome, {v:(x.atrasado ? "✕ " : "")+brl(x.falta), cor:x.atrasado ? RUIM : AVISO}, celPrazo(x)]}); };
var soma = function(l, k){ return l.reduce(function(t, x){ return t+(x[k]||0); }, 0); };
var temAtraso = function(l){ return l.some(function(x){ return x.atrasado; }); };

function tabela(titulo, lista){
  var dir = brl(soma(lista, "aPagar"))+" a pagar"+(temAtraso(lista) ? " · ✕ atraso" : "");
  return e(Bloco,{key:titulo, t:titulo, dir:dir}, !lista.length ? e("p",{className:"py-3 text-center text-[13px]"}, "Nada neste filtro.") :
    e(TabelaCampos,{cols:COLS, minW:"46rem"}, lista.map(linha),
      e(FileiraCampos,{total:true, cells:["Total", brl(soma(lista, "aPagar")), brl(soma(lista, "pago")), brl(soma(lista, "falta")), ""]})));
}
function tabelaP(titulo, lista){
  return e(Bloco,{key:titulo, t:titulo, dir:brl(soma(lista, "falta"))+" em aberto"+(temAtraso(lista) ? " · ✕ atraso" : "")}, !lista.length ? e("p",{className:"py-3 text-center text-[13px]"}, "Nada em aberto.") :
    e(TabelaCampos,{cols:COLS_P, minW:"34rem"}, lista.map(linhaP), e(FileiraCampos,{total:true, cells:["Total", brl(soma(lista, "falta")), ""]})));
}

// Mostrar: tudo, só em aberto ou só atrasados
function filtrarR(R, modo){
  if(!modo) return R;
  var ok = function(x){ return modo==="atraso" ? x.atrasado : x.falta>0.005; }, f = function(l){ return l.filter(ok); }, part = {};
  Object.keys(R.particulares).forEach(function(k){ part[k] = f(R.particulares[k]); });
  return Object.assign({}, R, {fornecedores:f(R.fornecedores), prestadores:f(R.prestadores), socios:f(R.socios), particulares:part});
}

// imagem do resumo (PNG), desenhada à mão no canvas: letra grande para ler no celular, sem biblioteca
function desenhar(R, socioId){
  var blocos = [], V = socioId ? visaoSocio(R, socioId) : null;
  var tab = function(t, l){ blocos.push({t:t, cab:["Nome", "A pagar", "Pago", "Falta", "Prazo"], w:[.34, .16, .16, .18, .16], l:l.map(function(x){ return {c:[x.nome, brl(x.aPagar), brl(x.pago), (x.atrasado ? "✕ " : "")+brl(x.falta), x.prazo], cor:x.atrasado ? RUIM : x.falta<=0.005 ? OK : AVISO}; })}); };
  var tabP = function(t, l){ blocos.push({t:t, cab:["Prestador", "Falta", "Prazo"], w:[.55, .25, .2], l:l.map(function(x){ return {c:[x.nome, (x.atrasado ? "✕ " : "")+brl(x.falta), x.prazo], cor:x.atrasado ? RUIM : AVISO}; })}); };
  if(!socioId){
    tab("Fornecedores", R.fornecedores); tab("Prestadores da empresa", R.prestadores); tab("Sócios e Casa", R.socios);
    SOCIOS.forEach(function(s){ if((R.particulares[s[0]]||[]).length) tabP("Particulares · "+s[1], R.particulares[s[0]]); });
    blocos.push({t:"Totais", cab:["Total", "A pagar", "Pago", "Falta", ""], w:[.34, .16, .16, .18, .16], l:[
      {c:["Sem sócios", brl(R.totais.semSocios.aPagar), brl(R.totais.semSocios.pago), brl(R.totais.semSocios.falta), ""]}, {c:["Geral", brl(R.totais.geral.aPagar), brl(R.totais.geral.pago), brl(R.totais.geral.falta), ""], negrito:true}]});
  } else { tab("Sócio", V.socio); tabP("Prestadores da empresa em aberto", V.prestadores); tabP("Prestadores particulares em aberto", V.particulares); }
  var W = 1200, LH = 44, topo = 110, linhas = blocos.reduce(function(t, b){ return t+2+Math.max(1, b.l.length); }, 0), H = topo+linhas*LH+blocos.length*18+40;
  var cv = document.createElement("canvas"); cv.width = W; cv.height = H; var g = cv.getContext("2d");
  g.fillStyle = "#0f1012"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff"; g.textBaseline = "middle"; g.textAlign = "left";
  var nome = socioId ? (SOCIOS.filter(function(s){ return s[0]===socioId; })[0]||[])[1] : "Geral";
  g.font = "bold 34px Arial"; g.fillText("Resumo · "+nome+" · "+nomeMes(R.ym), 30, 42); g.font = "22px Arial"; g.fillText("Posição em "+R.hoje.split("-").reverse().join("/"), 30, 80);
  var y = topo;
  blocos.forEach(function(b){
    g.fillStyle = "#1c1d21"; g.fillRect(20, y, W-40, LH); g.fillStyle = "#fff"; g.font = "bold 24px Arial"; g.textAlign = "left"; g.fillText(b.t, 34, y+LH/2); y += LH;
    var x0 = 20, pos = b.w.map(function(w){ var p = x0; x0 += w*(W-40); return p; });
    g.fillStyle = "#17181b"; g.fillRect(20, y, W-40, LH); g.font = "bold 18px Arial"; g.fillStyle = "#cfcfd4";
    b.cab.forEach(function(c, i){ g.textAlign = "center"; g.fillText(c.toUpperCase(), pos[i]+b.w[i]*(W-40)/2, y+LH/2); }); y += LH;
    (b.l.length ? b.l : [{c:["Nada em aberto", "", "", "", ""].slice(0, b.cab.length)}]).forEach(function(r){
      g.strokeStyle = "#2a2b30"; g.beginPath(); g.moveTo(20, y); g.lineTo(W-20, y); g.stroke(); g.font = (r.negrito ? "bold " : "")+"22px Arial";
      r.c.forEach(function(c, i){ g.fillStyle = (i===3 || (b.cab.length===3 && i===1)) && r.cor ? r.cor : "#fff"; g.textAlign = "center"; g.fillText(c, pos[i]+b.w[i]*(W-40)/2, y+LH/2); }); y += LH; });
    y += 18;
  });
  return cv;
}
function baixar(R, socioId){
  var cv = desenhar(R, socioId), nome = "resumo-"+(socioId || "geral")+"-"+R.ym+".png";
  cv.toBlob(function(b){ var u = URL.createObjectURL(b), a = document.createElement("a"); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 2000); }, "image/png");
}

function AbaResumoGrupo(){
  var cx = use(), s = cx.state, ymS = useState(hojeYm()), ym = ymS[0], setYm = ymS[1], abaS = useState("geral"), aba = abaS[0], setAba = abaS[1], moS = useState(""), modo = moS[0], setModo = moS[1], cpS = useState("");
  if(!temAutorizacao("financeiro_familia", s.usuario)) return e(Pagina,null, e(PageHead,{t:"Resumo do grupo", sub:""}), e("p",{className:"py-6 text-center text-[13px]"}, "Só os sócios abrem esta tela."));
  var R = filtrarR(resumoGrupo(s.pf, s.ff, ym, hojeIso()), modo), socioId = aba==="geral" ? "" : aba, V = socioId ? visaoSocio(R, socioId) : null;
  var texto = mensagem(R, socioId), copiado = cpS[0], setCopiado = cpS[1];
  var copiar = function(){ try { navigator.clipboard.writeText(texto).then(function(){ setCopiado(true); setTimeout(function(){ setCopiado(false); }, 2500); }); } catch(x){ window.prompt("Copie a mensagem:", texto); } };
  var abas = [["geral", "Geral"]].concat(SOCIOS.map(function(x){ return [x[0], x[1]]; }));
  return e(Pagina,null,
    e(PageHead,{t:"Resumo do grupo", sub:""}, e(Botao,{onClick:function(){ baixar(R, socioId); }}, "Baixar imagem"), e(Botao,{principal:true, onClick:copiar}, copiado ? "Copiado ✓" : "Copiar mensagem")),
    // topo compacto (Marcus, 09/11/2026): abas, mês e filtro na MESMA linha, sem o bloco "Filtros" e sem rótulos em cima
    e("div",{className:"flex flex-wrap items-center gap-2"},
      e("div",{className:"min-w-0 overflow-x-auto"}, e(Segmentado,{opcoes:abas, atual:aba, onMudar:setAba})),
      e("select",{value:ym, "aria-label":"Mês", title:"Mês", className:CAMPO+" w-40!", onChange:function(ev){ setYm(ev.target.value); }}, janela().map(function(k){ return e("option",{key:k, value:k}, nomeMes(k)); })),
      e("select",{value:modo, "aria-label":"Mostrar", title:"Mostrar", className:CAMPO+" w-36!", onChange:function(ev){ setModo(ev.target.value); }}, [["", "Tudo"], ["aberto", "Só em aberto"], ["atraso", "Só atrasados ✕"]].map(function(o){ return e("option",{key:o[0], value:o[0]}, o[1]); }))),
    e("div",{className:"grid grid-cols-1 items-start gap-2.5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]"},
      e("div",{className:"flex flex-col gap-2.5"},
        !socioId ? [tabela("Fornecedores", R.fornecedores), tabela("Prestadores da empresa", R.prestadores), tabela("Sócios e Casa", R.socios),
            SOCIOS.filter(function(x){ return (R.particulares[x[0]]||[]).length; }).map(function(x){ return tabelaP("Particulares · "+x[1], R.particulares[x[0]]); }),
            e(Bloco,{key:"tot", t:"Totais do mês"}, e(TabelaCampos,{cols:COLS, minW:"46rem"},
              e(FileiraCampos,{cells:["Sem sócios", brl(R.totais.semSocios.aPagar), brl(R.totais.semSocios.pago), {v:brl(R.totais.semSocios.falta), cor:AVISO}, ""]}),
              e(FileiraCampos,{total:true, cells:["Geral (com sócios)", brl(R.totais.geral.aPagar), brl(R.totais.geral.pago), brl(R.totais.geral.falta), ""]})))]
        : [tabela("Sócio · "+nomeMes(ym), V.socio), tabelaP("Prestadores da empresa em aberto", V.prestadores), tabelaP("Prestadores particulares em aberto", V.particulares)],
        e("p",{className:"text-[13px]"}, "✕ = venceu e não foi pago. Verde = quitado. Amarelo = em aberto.")),
      e(Bloco,{t:"Mensagem para o grupo", dir:"texto do WhatsApp"}, e("pre",{className:"max-h-[640px] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-black/30 p-3 text-[13px]"}, texto))));
}

export { AbaResumoGrupo };

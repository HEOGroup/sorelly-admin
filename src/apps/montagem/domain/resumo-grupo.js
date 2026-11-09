// Sorelly Admin · montagem — domain/resumo-grupo.js
// RESUMO DO GRUPO (Marcus, 09/11/2026): o quadro que o Lucas mandava no grupo dos sócios, montado à mão na planilha, agora sai do sistema.
// Junta o Pagamentos a fornecedores (s.pf) e o Financeiro familiar (s.ff): fornecedores, prestadores da empresa, sócios e Casa, e os prestadores particulares de cada sócio.
// Atrasado = venceu e não foi pago: leva ✕. Nada é digitado aqui; tudo vem dos dois módulos.
import { contaForn, ehPrestador, hojeIso, janelasDoForn } from "@/apps/montagem/domain/pf";
import { totaisPersona, saldoPrestador, baixaDividas, ultimoDia, r2, nomeMes } from "@/apps/montagem/domain/financeiro-familiar";

var SOCIOS = [["marcus", "Marcus"], ["anamaria", "Anamaria"], ["marco", "Marco Antonio"], ["anabeatriz", "Ana Beatriz"], ["lucas", "Lucas"], ["familia", "Casa"]];
var dm = function(iso){ return iso ? iso.slice(8, 10)+"/"+iso.slice(5, 7) : ""; };
var brl = function(v){ return (v<0 ? "−" : "")+"R$ "+Math.abs(v||0).toLocaleString("pt-BR", {minimumFractionDigits:2, maximumFractionDigits:2}); };
var soma = function(l, k){ return r2(l.reduce(function(t, x){ return t+(x[k]||0); }, 0)); };
var mesAntes = function(m, n){ var a = m.split("-").map(Number), d = new Date(a[0], a[1]-1-n, 1); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2, "0"); };

// linha de fornecedor ou prestador da empresa. Prestador: o que ficou em aberto dos meses anteriores passa para este mês e fica em atraso (Marcus, 09/11/2026).
// Fornecedor: entra só o saldo do mês anterior, como na planilha ("Pontual saldo aberto de outubro").
function linhasDaEmpresa(pf, ym, hoje){
  var fornecedores = [], prestadores = [];
  pf.fornecedores.forEach(function(f){
    var prest = ehPrestador(f), c = contaForn(pf, f.id, ym), linhas = [];
    var janelas = (c.datas||[]);
    janelas.forEach(function(d){ linhas.push({nome:f.nome+(janelas.length>1 ? " · até "+dm(d.venc) : ""), aPagar:d.valor, pago:r2(d.valor-d.aberto), prazo:dm(d.venc), venc:d.venc}); });
    var meses = {}; janelasDoForn(pf, f.id).forEach(function(j){ if(j.mes<ym && (prest || j.mes===mesAntes(ym, 1))) meses[j.mes] = 1; });
    var ab = 0, venc = null; Object.keys(meses).forEach(function(mm){ contaForn(pf, f.id, mm).datas.forEach(function(d){ if(d.aberto>0.005){ ab += d.aberto; if(!venc || d.venc<venc) venc = d.venc; } }); });
    if(ab>0.005){
      if(prest && linhas.length){ linhas[0].aPagar = r2(linhas[0].aPagar+ab); linhas[0].venc = linhas[0].venc<venc ? linhas[0].venc : venc; linhas[0].prazo = dm(linhas[0].venc); linhas[0].anterior = ab; }
      else linhas.push({nome:f.nome+" · saldo anterior", aPagar:r2(ab), pago:0, prazo:dm(venc), venc:venc});
    }
    linhas.forEach(function(x){ x.falta = r2(x.aPagar-x.pago); x.atrasado = x.falta>0.005 && x.venc<hoje; (prest ? prestadores : fornecedores).push(x); });
  });
  return {fornecedores:fornecedores, prestadores:prestadores};
}

// sócios e Casa: a meta de Pix do mês contra o que já entrou (mesma conta da tela PIX revendedoras)
function linhasDosSocios(ff, ym, hoje){
  var fim = ym+"-"+String(ultimoDia(ym)).padStart(2, "0");
  return SOCIOS.map(function(s){
    var p = ff.personas.find(function(x){ return x.id===s[0]; }); if(!p) return null;
    var t = totaisPersona(ff, s[0], ym).pix, falta = r2(Math.max(0, t.meta-t.recebido));
    return {id:s[0], nome:s[1], aPagar:t.meta, pago:t.recebido, falta:falta, prazo:dm(fim), venc:fim, atrasado:falta>0.005 && fim<hoje};
  }).filter(function(x){ return x && (x.aPagar>0.005 || x.pago>0.005); });
}

// prestadores particulares de cada sócio (68 Gang, Rebel Mode, Show Banca, Greicy...): só os ativos com saldo em aberto
function particularesDe(ff, socioId, hoje){
  return ff.prest.filter(function(p){ return p.ativo && p.responsavelId===socioId; }).map(function(p){
    var b = baixaDividas(ff, p.id), falta = saldoPrestador(ff, p.id); if(falta<=0.005) return null;
    var abertas = b.lista.filter(function(d){ return b.porId[d.id] && b.porId[d.id].falta>0.005; });
    var partes = abertas.length<=2 ? abertas.map(function(d){ return ((d.titulo ? d.titulo+" " : "")+(d.codigo||"")).trim(); }).filter(Boolean) : [], rot = partes.length ? " ("+partes.join(" · ")+")" : "";
    var venc = abertas.filter(function(d){ return d.prazo; }).map(function(d){ return d.prazo; }).sort()[0] || "";
    return {nome:p.nome+rot, falta:falta, prazo:venc ? dm(venc) : "—", atrasado:!!venc && venc<hoje};
  }).filter(Boolean).sort(function(a, b){ return b.falta-a.falta; });
}

function resumoGrupo(pf, ff, ym, hoje){
  hoje = hoje || hojeIso();
  var emp = linhasDaEmpresa(pf, ym, hoje), socios = linhasDosSocios(ff, ym, hoje), part = {};
  SOCIOS.forEach(function(s){ part[s[0]] = particularesDe(ff, s[0], hoje); });
  var semSocios = emp.fornecedores.concat(emp.prestadores), geral = semSocios.concat(socios);
  var tot = function(l){ return {aPagar:soma(l, "aPagar"), pago:soma(l, "pago"), falta:soma(l, "falta")}; };
  return {ym:ym, hoje:hoje, fornecedores:emp.fornecedores, prestadores:emp.prestadores, socios:socios, particulares:part, totais:{semSocios:tot(semSocios), geral:tot(geral)}};
}

// visão de um sócio: a linha dele + os prestadores da empresa em aberto + os particulares dele
function visaoSocio(R, socioId){
  return {socio:R.socios.filter(function(x){ return x.id===socioId; }), prestadores:R.prestadores.filter(function(x){ return x.falta>0.005; }), particulares:R.particulares[socioId]||[]};
}

// mensagem do WhatsApp (negrito com asteriscos). socioId vazio = resumo geral
var marca = function(x){ return x.atrasado ? "✕ " : ""; };
var linhaMsg = function(x){ var f = x.falta; return "• "+x.nome+": "+marca(x)+(f<=0.005 ? "✅ pago" : "falta "+brl(f)+(x.atrasado ? " (venceu "+x.prazo+")" : (x.prazo && x.prazo!=="—" ? " ("+x.prazo+")" : ""))); };
function mensagem(R, socioId){
  var mes = nomeMes(R.ym).toUpperCase().replace(" DE ", "/").replace(/\s+/g, "/"), L = [];
  var ttl = function(t){ L.push(""); L.push("*"+t+"*"); };
  if(!socioId){
    L.push("*RESUMO DE PAGAMENTOS · "+mes+"*"); L.push("Posição: "+dm(R.hoje)+"/"+R.hoje.slice(0, 4));
    ttl("FORNECEDORES"); R.fornecedores.forEach(function(x){ L.push(linhaMsg(x)); });
    ttl("PRESTADORES DA EMPRESA"); R.prestadores.forEach(function(x){ L.push(linhaMsg(x)); });
    ttl("SÓCIOS E CASA"); R.socios.forEach(function(x){ L.push(linhaMsg(x)); });
    SOCIOS.forEach(function(s){ var l = R.particulares[s[0]]; if(!l.length) return; ttl("PARTICULARES · "+s[1].toUpperCase()); l.forEach(function(x){ L.push("• "+x.nome+": "+marca(x)+"falta "+brl(x.falta)); }); L.push("• Total: falta "+brl(soma(l, "falta"))); });
    ttl("TOTAIS"); L.push("• Sem sócios: a pagar "+brl(R.totais.semSocios.aPagar)+" · falta "+brl(R.totais.semSocios.falta));
    L.push("• Geral: a pagar "+brl(R.totais.geral.aPagar)+" · pago "+brl(R.totais.geral.pago)+" · *falta "+brl(R.totais.geral.falta)+"*");
  } else {
    var V = visaoSocio(R, socioId), nome = (SOCIOS.filter(function(s){ return s[0]===socioId; })[0]||[])[1] || socioId;
    L.push("*RESUMO · "+nome.toUpperCase()+" · "+mes+"*"); L.push("Posição: "+dm(R.hoje)+"/"+R.hoje.slice(0, 4));
    ttl(nome.toUpperCase()+" ("+nomeMes(R.ym).toLowerCase()+")");
    V.socio.forEach(function(x){ L.push("• A pagar: "+brl(x.aPagar)+" · pago "+brl(x.pago)); L.push("• "+marca(x)+"*Falta "+brl(x.falta)+"* (prazo "+x.prazo+")"); });
    if(V.prestadores.length){ ttl("PRESTADORES DA EMPRESA EM ABERTO"); V.prestadores.forEach(function(x){ L.push(linhaMsg(x)); }); L.push("• Total: falta "+brl(soma(V.prestadores, "falta"))); }
    if(V.particulares.length){ ttl("PRESTADORES PARTICULARES EM ABERTO"); V.particulares.forEach(function(x){ L.push("• "+x.nome+": "+marca(x)+"falta "+brl(x.falta)); }); L.push("• Total: falta "+brl(soma(V.particulares, "falta"))); }
  }
  return L.join("\n");
}

export { SOCIOS, resumoGrupo, visaoSocio, mensagem, brl as brlGrupo };

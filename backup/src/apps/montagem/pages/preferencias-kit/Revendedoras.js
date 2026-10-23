// Sorelly Admin · montagem — pages/preferencias-kit/Revendedoras.js
// Aba "Revendedoras": indicadores, filtros, lista paginada (pendentes primeiro) e a janela de detalhe em colunas (dados | respostas | ações).
import { BarraFiltros, Dinheiro, Faixa, Indicador, Janela, LINHA, Pagina, Tab, Td } from "@/apps/montagem/components/padrao";
import { AVISO_CONFIANCA, ROTULO_FONTE, ROTULO_SITUACAO, FONTES, agoraSP, formatarDataHora, hojeSP, pkDetalhe, pkTotais } from "@/apps/montagem/domain/preferencias-kit";
import { EditorResposta, RespostaView } from "@/apps/montagem/pages/preferencias-kit/resposta";
import { Area, Aviso, Avatar, BarraMetal, Bolinha, Bt, Busca, Campo, Data, Ic, Painel, Paginar, Sel, SITCOR, Selo, Txt, grad, pct1, usePk } from "@/apps/montagem/pages/preferencias-kit/visual";
import { Ph } from "@/apps/montagem/components/chat/chat-ui";
import { BlocoBarra } from "@/apps/montagem/components/equipe-blocos";
import { pkLinhasSistema, pkPorRepresentante, pkRelatorioCSV } from "@/apps/montagem/domain/preferencias-relatorio";
import { BK } from "@/apps/montagem/lib/format";
import { Fragment, e, useState } from "@/shared/react";

var norm = function(t){ return String(t==null ? "" : t).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); };
var ICONE_SIT = {sem:"circle-dashed", pendente:"hourglass", montado:"check-circle"};
var digitos = function(t){ var d = String(t||"").replace(/\D/g, ""); return (d.length===12 || d.length===13) && d.slice(0, 2)==="55" ? d.slice(2) : d; };

// ---------- cadastro / edição da revendedora ----------
function JanelaRev(p){
  var ctx = usePk(), pk = ctx.pk, s = ctx.s, r = p.rev;
  var st = useState({nome:r ? r.nome : "", telefone:r ? r.telefone : "", email:r ? r.email : "", cidade:r ? r.regiao.cidade : "", estado:r ? r.regiao.estado : ""}), v = st[0];
  var et = useState(""), erro = et[0];
  var set = function(k){ return function(x){ var c = Object.assign({}, v); c[k] = x; st[1](c); }; };
  var salvar = function(){
    if(!v.nome.trim()){ et[1]("Informe o nome da revendedora."); return; }
    var dg = digitos(v.telefone);
    if(dg.length>=8){ var dup = s.pk.revendedoras.find(function(x){ return (!r || String(x.id)!==String(r.id)) && digitos(x.telefone)===dg; }); if(dup){ et[1]("Esse telefone já é de "+dup.nome+"."); return; } }
    if(r) pk("rev_edit", Object.assign({id:r.id}, v)); else pk("rev_add", v);
    p.fechar();
  };
  return e(Janela,{t:r ? "Editar revendedora" : "Nova revendedora", fechar:p.fechar,
    colunas:[
      e(Painel,{key:"a", t:"Identificação", ic:"user-plus"}, e(Campo,{rot:"Nome"}, e(Txt,{v:v.nome, set:set("nome"), rot:"Nome"})), e(Campo,{rot:"Telefone"}, e(Txt,{v:v.telefone, set:set("telefone"), rot:"Telefone", tipo:"tel"})), e(Campo,{rot:"E-mail"}, e(Txt,{v:v.email, set:set("email"), rot:"E-mail", tipo:"email"}))),
      e(Painel,{key:"b", t:"Região", ic:"map-pin"}, e(Campo,{rot:"Cidade"}, e(Txt,{v:v.cidade, set:set("cidade"), rot:"Cidade"})), e(Campo,{rot:"Estado (UF)"}, e(Txt,{v:v.estado, set:set("estado"), rot:"Estado", max:2})))],
    rodape:[erro && e("p",{key:"e", className:"w-full text-center text-[12.5px] font-bold text-[#F87171]"}, erro), e(Bt,{key:"s", tipo:"forte", ic:"floppy-disk", onClick:salvar}, "Salvar"), e(Bt,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

// ---------- janela de detalhe ----------
function JanelaDetalhe(p){
  var ctx = usePk(), s = ctx.s, pk = ctx.pk, det = pkDetalhe(s, p.id);
  var sEdit = useState(null), editKey = sEdit[0];          // bloco em edição ({bloco, resposta})
  var sRev = useState(false), editRev = sRev[0];
  var sObs = useState(null), obs = sObs[0];                // texto das observações em edição
  var sConf = useState(""), conf = sConf[0];               // "limpar" | "excluir" (confirmação em dois cliques)
  var agora = agoraSP().slice(0, 16);
  var sM = useState({staff:"", ini:agora, fim:agora, valor:0, usou:true}), m = sM[0];
  var sErr = useState(""), erro = sErr[0];
  if(!det) return null;
  var setM = function(k, x){ var c = Object.assign({}, m); c[k] = x; sM[1](c); };
  var prefs = det.preferencias, cor = SITCOR[det.situacao];
  var marcar = function(){
    if(!m.staff.trim()){ sErr[1]("Informe quem montou."); return; }
    if(!m.ini || !m.fim){ sErr[1]("Informe o início e o fim da montagem."); return; }
    if(m.fim<m.ini){ sErr[1]("O fim da montagem não pode ser antes do início."); return; }
    sErr[1]("");
    pk("montagem_add", {revendedoraId:det.id, staffNome:m.staff.trim(), iniciadoEm:m.ini, concluidoEm:m.fim, valorKit:m.valor, usouPreferencias:m.usou});
    sM[1]({staff:"", ini:agora, fim:agora, valor:0, usou:true});
  };
  var dado = function(ic, t){ return t ? e("div",{className:"flex items-center justify-center gap-1.5 text-[12.5px]"}, e(Ph,{n:ic, s:14, className:"text-white/60"}), t) : null; };
  var colDados = e(Painel,{key:"d", t:"Dados", ic:"user"},
    e("div",{className:"flex flex-col items-center gap-1"}, e(Avatar,{nome:det.nome, s:40}), e("b",{className:"text-[15px]"}, det.nome),
      e(Selo,{cor:cor, ic:ICONE_SIT[det.situacao]}, det.rotuloSituacao)),
    dado("phone", det.telefone), dado("envelope", det.email), dado("map-pin", [det.regiao.cidade, det.regiao.estado].filter(Boolean).join(" · ")),
    e("div",{className:"flex flex-col items-center gap-1 rounded-lg bg-white/5 p-2 text-[12px]"},
      e("span",null, e("b",null, prefs.categoriasRespondidas), prefs.categoriasRespondidas===1 ? " categoria respondida" : " categorias respondidas"),
      prefs.resumoGeral ? e(BarraMetal,{ouro:prefs.resumoGeral.ouro, prata:prefs.resumoGeral.prata}) : e("span",{className:"text-white/55"}, "Sem proporção ouro e prata."),
      prefs.atualizadoEm && e("span",{className:"text-white/65"}, "Atualizado em "+formatarDataHora(prefs.atualizadoEm)+(prefs.atualizadoPor ? " por "+prefs.atualizadoPor : "")),
      prefs.fonte && e("span",{className:"text-white/65"}, ROTULO_FONTE[prefs.fonte])),
    e("div",{className:"flex flex-wrap justify-center gap-2"}, e(Bt,{ic:"pencil-simple", onClick:function(){ sRev[1](true); }}, "Editar dados"),
      conf==="excluir" ? e(Bt,{tipo:"perigo", ic:"trash", onClick:function(){ pk("rev_del", {id:det.id}); p.fechar(); }}, "Confirmar exclusão") : e(Bt,{tipo:"perigo", ic:"trash", onClick:function(){ sConf[1]("excluir"); }}, "Excluir")),
    conf==="excluir" && e("p",{className:"text-[11.5px] text-[#FCA5A5]"}, "Exclui também as preferências e os registros de montagem desta revendedora."));
  var colResp = e(Painel,{key:"r", t:"Respostas", ic:"list-checks"},
    det.blocos.length===0 && e("p",{className:"text-[12.5px] text-white/60"}, "Nenhum bloco ativo no formulário."),
    det.blocos.map(function(x){ var b = x.bloco;
      return e("div",{key:b.key, className:"flex flex-col items-center gap-1.5 rounded-lg p-2", style:{background:"linear-gradient(135deg,"+b.accent+"26,rgba(0,0,0,.18))", boxShadow:"inset 3px 0 0 "+b.accent+", inset 0 0 0 1px rgba(255,255,255,.08)"}},
        e("div",{className:"flex w-full items-center justify-center gap-1.5"}, e("span",{className:"text-[12.5px] font-bold"}, x.numero+". "+b.title), e(Ic,{ic:"pencil-simple", titulo:"Editar a resposta de "+b.title, onClick:function(){ sEdit[1]({bloco:b, resposta:x.resposta}); }})),
        e(RespostaView,{exibir:x.exibir})); }),
    e("div",{className:"flex flex-col items-center gap-1.5 rounded-lg bg-white/5 p-2"},
      e("div",{className:"flex w-full items-center justify-center gap-1.5"}, e("span",{className:"text-[12.5px] font-bold"}, "Observações"), obs==null && e(Ic,{ic:"pencil-simple", titulo:"Editar as observações", onClick:function(){ sObs[1](prefs.observacoes); }})),
      obs==null ? e("p",{className:"whitespace-pre-wrap text-[12.5px] text-white/85"}, prefs.observacoes || "Sem observações.")
        : e("div",{className:"flex w-full flex-col gap-1.5"}, e(Area,{v:obs, rot:"Observações", rows:3, set:function(x){ sObs[1](x); }}), e("div",{className:"flex justify-center gap-2"}, e(Bt,{tipo:"forte", onClick:function(){ pk("obs_set", {revendedoraId:det.id, observacoes:obs, fonte:"manual"}); sObs[1](null); }}, "Salvar"), e(Bt,{onClick:function(){ sObs[1](null); }}, "Cancelar")))),
    det.orfas.length>0 && e("p",{className:"text-[11.5px] text-white/55"}, "Respostas guardadas de blocos que não existem mais: "+det.orfas.join(", ")+"."));
  var colAcoes = e(Painel,{key:"a", t:"Ações", ic:"hammer"},
    e("div",{className:"flex flex-col gap-2 rounded-lg bg-white/5 p-2"}, e("b",{className:"text-[12.5px]"}, "Marcar montagem"),
      e(Campo,{rot:"Quem montou"}, e(Txt,{v:m.staff, set:function(x){ setM("staff", x); }, rot:"Quem montou"})),
      e("div",{className:"grid grid-cols-1 gap-2 sm:grid-cols-2"}, e(Campo,{rot:"Início"}, e(Txt,{tipo:"datetime-local", v:m.ini, set:function(x){ setM("ini", x); }, rot:"Início"})), e(Campo,{rot:"Fim"}, e(Txt,{tipo:"datetime-local", v:m.fim, set:function(x){ setM("fim", x); }, rot:"Fim"}))),
      e(Campo,{rot:"Valor do kit"}, e(Dinheiro,{value:m.valor, label:"Valor do kit", onChange:function(x){ setM("valor", x); }})),
      e("label",{className:"flex cursor-pointer items-center justify-center gap-1.5 text-[12.5px] font-bold"}, e("input",{type:"checkbox", checked:m.usou, onChange:function(ev){ setM("usou", ev.target.checked); }, className:"size-4 accent-[#E8B84B]"}), "Usou as preferências"),
      erro && e("p",{className:"text-[12px] font-bold text-[#F87171]"}, erro),
      e(Bt,{tipo:"forte", ic:"check", onClick:marcar}, "Registrar montagem")),
    e("div",{className:"flex flex-col gap-1 rounded-lg bg-white/5 p-2"}, e("b",{className:"text-[12.5px]"}, "Montagens registradas"),
      det.registros.length===0 && e("p",{className:"text-[12px] text-white/55"}, "Nenhuma montagem registrada."),
      det.registros.map(function(g){ return e("div",{key:g.id, className:"flex items-center justify-center gap-1.5 text-[12px]"},
        e("span",null, formatarDataHora(g.concluidoEm)+" · "+g.staffNome+(g.usouPreferencias ? " · com preferências" : "")), e(Ic,{ic:"trash", perigo:true, titulo:"Excluir o registro de montagem", onClick:function(){ pk("montagem_del", {id:g.id}); }})); })),
    prefs.temPreferencias && (conf==="limpar" ? e(Bt,{tipo:"perigo", ic:"eraser", onClick:function(){ pk("prefs_limpar", {revendedoraId:det.id}); sConf[1](""); }}, "Confirmar limpeza das preferências") : e(Bt,{tipo:"perigo", ic:"eraser", onClick:function(){ sConf[1]("limpar"); }}, "Limpar preferências")));
  return e(Fragment,null, e(Janela,{t:det.nome, sub:"Preferências do kit", fechar:p.fechar, colunas:[colDados, colResp, colAcoes]}),
    editKey && e(EditorResposta,{key:editKey.bloco.key, bloco:editKey.bloco, resposta:editKey.resposta, rev:det, fechar:function(){ sEdit[1](null); }}),
    editRev && e(JanelaRev,{rev:det, fechar:function(){ sRev[1](false); }}));
}

// ---------- todas as revendedoras do sistema, separadas por representante ----------
var F0 = {busca:"", rep:"", situacao:""};
function baixar(nome, texto){ try { var u = URL.createObjectURL(new Blob([texto], {type:"text/csv;charset=utf-8"})), a = document.createElement("a"); a.href = u; a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1000); } catch(x){} }
function AbaPkRevendedoras(){
  var ctx = usePk(), s = ctx.s;
  var sf = useState(F0), f = sf[0];
  var sj = useState(null), jan = sj[0];                    // id da revendedora aberta
  var todas = pkLinhasSistema(s), tot = pkTotais(s);
  var q = norm(f.busca);
  var lista = todas.filter(function(l){
    if(q && norm(l.nome).indexOf(q)<0) return false; if(f.rep && l.rep!==f.rep) return false;
    if(f.situacao==="sim" && !l.preenchido) return false; if(f.situacao==="nao" && l.preenchido) return false;
    if(f.situacao==="pendente" && l.situacao!=="pendente") return false; if(f.situacao==="montado" && l.situacao!=="montado") return false; return true; });
  var pesoRep = function(r){ return r==="Atendimento Sorelly" ? 1 : r==="Sem representante" ? 2 : 0; }, reps = pkPorRepresentante(todas).map(function(g){ return [g.rep, g.rep]; });
  var set = function(k){ return function(v){ var c = Object.assign({}, f); c[k] = v; sf[1](c); }; };
  var ativo = !!(f.busca || f.rep || f.situacao);
  var n = function(fn){ return todas.filter(fn).length; };
  var relatorio = function(){ baixar("preferencias-do-kit-"+hojeSP()+".csv", pkRelatorioCSV(s, lista)); };
  return e(Pagina,null,
    e(Aviso,null, AVISO_CONFIANCA),
    e(Faixa,{n:5},
      e(Indicador,{t:"Revendedoras", v:todas.length, cor:"total"}),
      e(Indicador,{t:"Preencheram", v:n(function(l){ return l.preenchido; }), cor:"ok"}),
      e(Indicador,{t:"Não preencheram", v:n(function(l){ return !l.preenchido; }), cor:"neutro"}),
      e(Indicador,{t:"Pendentes de montagem", v:n(function(l){ return l.situacao==="pendente"; }), cor:"alerta"}),
      e(Indicador,{t:"Blocos ativos", v:tot.blocosAtivos, cor:"info"})),
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ sf[1](F0); }},
      e(Busca,{v:f.busca, set:set("busca"), ph:"Buscar revendedora"}),
      e(Sel,{v:f.rep, set:set("rep"), rot:"Representante", opcoes:reps}),
      e(Sel,{v:f.situacao, set:set("situacao"), rot:"Preferências", opcoes:[["sim", "Preencheram"], ["nao", "Não preencheram"], ["pendente", ROTULO_SITUACAO.pendente], ["montado", ROTULO_SITUACAO.montado]]}),
      e("span",{className:"text-[12px] font-bold text-white/70"}, lista.length+(lista.length===1 ? " revendedora" : " revendedoras")),
      e(Bt,{tipo:"forte", ic:"download-simple", className:"h-9 py-0!", onClick:relatorio}, "Baixar relatório")),
    lista.length===0 ? e("div",{className:"rounded-xl bg-black/20 px-4 py-6 text-center text-[13px] text-white/70 ring-1 ring-white/10"}, "Nenhuma revendedora encontrada.")
      : e(Tab,{cols:["Representante", "Revendedora", "Venda do mês", "Preferências", "Categorias", "Ouro / Prata", "Atualizado"]},
          lista.slice().sort(function(a1, b1){ return pesoRep(a1.rep)-pesoRep(b1.rep) || a1.rep.localeCompare(b1.rep, "pt-BR") || a1.nome.localeCompare(b1.nome, "pt-BR"); }).map(function(l){
            var abre = l.rev && l.preenchido ? function(){ sj[1](l.rev.id); } : undefined;
            return e("tr",{key:l.nome, className:LINHA+(abre ? " cursor-pointer hover:bg-white/5" : ""), onClick:abre},
              e(Td,{className:"max-w-[8rem] truncate text-left! text-white/80"}, l.rep),
              e(Td,{forte:true, className:"max-w-[11.5rem] truncate text-left!"}, l.nome),
              e(Td,{dinheiro:true}, l.venda ? BK(l.venda) : "—"),
              e(Td,null, l.preenchido ? e(Selo,{cor:"#22C55E", ic:"check-circle"}, l.situacao==="montado" ? "Montado" : "Preencheu") : e(Selo,{cor:"#EF4444", ic:"circle-dashed"}, "Não preencheu")),
              e(Td,null, l.preenchido ? l.categorias : "—"),
              e(Td,null, l.ouro!=null ? Math.round(l.ouro)+"% / "+Math.round(l.prata)+"%" : "—"),
              e(Td,null, l.atualizadoEm ? formatarDataHora(l.atualizadoEm).slice(0, 10) : "—")); })),
    jan && e(JanelaDetalhe,{key:jan, id:jan, fechar:function(){ sj[1](null); }}));
}

export { AbaPkRevendedoras, JanelaDetalhe, JanelaRev };

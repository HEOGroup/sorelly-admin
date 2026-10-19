// Sorelly Admin · montagem — pages/marketing/Mural.js
// Marketing → Mural de criativos: grade de grupos (busca e marcas), grupo em Janela (galeria | adicionar imagem | dados).
// Imagens entram por LINK externo (upload real não existe aqui).
import { BarraFiltros, Janela, Pagina } from "@/apps/montagem/components/padrao";
import { BADGES, dividirNome, formatarDia, gruposListar, grupoDetalhe, pluralImagens, rotuloBadge } from "@/apps/montagem/domain/marketing";
import { Botao, CAMPO, COR, Campo, Chip, Vazio, alternar, nomeDoLink, porDe } from "@/apps/montagem/pages/marketing/comum";
import { use } from "@/apps/montagem/state/context";
import { e, useState } from "@/shared/react";

function Capa(p){
  var st = useState(false);
  return p.url && !st[0] ? e("img",{src:p.url, alt:p.alt||"", loading:"lazy", onError:function(){ st[1](true); }, className:"h-full w-full object-cover"})
    : e("div",{className:"grid h-full w-full place-items-center text-[11px] text-white/40"}, "Sem imagem");
}
function Marcas(p){ return e("div",{className:"flex flex-wrap justify-center gap-1"}, (p.lista||[]).map(function(b){ return e("span",{key:b, className:"rounded-md px-1.5 py-0.5 text-[10.5px] font-bold text-white/85", style:{background:COR+"33"}}, rotuloBadge(b)); })); }

function RenomearCampo(p){
  var st = useState(dividirNome(p.img.nome).base);
  return e("div",{className:"flex w-full gap-1"},
    e("input",{value:st[0], autoFocus:true, onChange:function(ev){ st[1](ev.target.value); }, className:CAMPO+" h-7! min-w-0 flex-1 px-1! text-[11.5px]!"}),
    e("button",{type:"button", onClick:function(){ p.ok(st[0]); }, className:"rounded-md bg-white/15 px-1.5 text-[11px] font-bold"}, "OK"),
    e("button",{type:"button", onClick:p.cancelar, className:"rounded-md bg-white/10 px-1.5 text-[11px]"}, "×"));
}

// criar / editar grupo
function JanelaGrupo(p){
  var cx = use(), s = cx.state, g = p.grupo, st = useState({nome:g ? g.nome : "", badges:g ? g.badges : [], capaUrl:""}), f = st[0];
  var set = function(c){ st[1](Object.assign({}, f, c)); };
  var salvar = function(){
    if(g) cx.dispatch({type:"MK", op:"grupo_edit", id:g.id, nome:f.nome, badges:f.badges, por:porDe(s)});
    else cx.dispatch({type:"MK", op:"grupo_add", nome:f.nome, badges:f.badges, capaUrl:f.capaUrl, por:porDe(s)});
    p.fechar();
  };
  return e(Janela,{t:g ? "Editar grupo" : "Novo grupo", fechar:p.fechar, colunas:[
    e("div",{key:"a", className:"flex flex-col gap-2.5"},
      e(Campo,{t:"Nome"}, e("input",{value:f.nome, autoFocus:true, onChange:function(ev){ set({nome:ev.target.value}); }, className:CAMPO+" text-center"})),
      !g && e(Campo,{t:"Link da capa (opcional)"}, e("input",{value:f.capaUrl, placeholder:"https://", onChange:function(ev){ set({capaUrl:ev.target.value}); }, className:CAMPO+" text-center"}))),
    e("div",{key:"b", className:"flex flex-col gap-1.5"}, e("span",{className:"text-center text-[10.5px] font-bold uppercase tracking-wide text-white/75"}, "Marcas"),
      e("div",{className:"flex flex-wrap justify-center gap-1.5"}, BADGES.map(function(b){ return e(Chip,{key:b.valor, on:f.badges.indexOf(b.valor)!==-1, onClick:function(){ set({badges:alternar(f.badges, b.valor)}); }}, b.rotulo); })))],
    rodape:[e(Botao,{key:"s", principal:true, desativado:!f.nome.trim(), onClick:salvar}, "Salvar"), e(Botao,{key:"c", onClick:p.fechar}, "Cancelar")]});
}

// detalhe do grupo
function JanelaDetalhe(p){
  var cx = use(), s = cx.state, por = porDe(s);
  var sb = useState(""), sp = useState(1), si = useState({nome:"", url:""}), sr = useState(null), sx = useState(false), se = useState(false);
  var d = grupoDetalhe(s, p.id, {busca:sb[0], pagina:sp[0], tamanho:20});
  if(!d){ return null; }
  var g = d.grupo, add = si[0];
  var envia = function(op, extra){ cx.dispatch(Object.assign({type:"MK", op:op, por:por}, extra)); };
  var adicionar = function(){ if(!add.url.trim()) return; envia("imagem_add", {grupoId:g.id, imagens:[{url:add.url.trim(), nome:add.nome.trim() || nomeDoLink(add.url), origem:"EXTERNAL"}]}); si[1]({nome:"", url:""}); };
  var bt = "rounded-md bg-white/10 px-1.5 py-0.5 text-[10.5px] font-bold hover:bg-white/20";
  var galeria = e("div",{key:"gal", className:"flex flex-col gap-2 md:col-span-2"},
    e("div",{className:"flex flex-wrap items-center justify-center gap-2"},
      e("input",{value:sb[0], placeholder:"Buscar imagem", "aria-label":"Buscar imagem", onChange:function(ev){ sb[1](ev.target.value); sp[1](1); }, className:CAMPO+" w-48 text-center"}),
      e("span",{className:"font-mono text-[12px] text-white/70"}, d.total+" "+pluralImagens(d.total))),
    d.imagens.length ? e("div",{className:"grid gap-2", style:{gridTemplateColumns:"repeat(auto-fill, minmax(8.5rem, 1fr))"}}, d.imagens.map(function(i){
      return e("div",{key:i.id, className:"flex flex-col gap-1 rounded-lg bg-black/25 p-1.5 text-center ring-1 "+(i.ehCapa ? "" : "ring-white/10"), style:i.ehCapa ? {boxShadow:"0 0 0 2px "+COR} : undefined},
        e("a",{href:i.url, target:"_blank", rel:"noreferrer", title:"Abrir a imagem", className:"block aspect-square overflow-hidden rounded-md bg-black/40"}, e(Capa,{url:i.url, alt:i.nome})),
        sr[0]===i.id ? e(RenomearCampo,{img:i, ok:function(base){ envia("imagem_renomear", {grupoId:g.id, id:i.id, base:base}); sr[1](null); }, cancelar:function(){ sr[1](null); }})
          : e("span",{className:"truncate px-0.5 text-[11.5px] font-bold", title:i.nome}, i.nome),
        e("div",{className:"flex flex-wrap justify-center gap-1"},
          !i.ehCapa && e("button",{type:"button", onClick:function(){ envia("grupo_capa", {id:g.id, imagemId:i.id}); }, className:bt}, "Definir capa"),
          i.ehCapa && e("button",{type:"button", title:"Tirar a capa", onClick:function(){ envia("grupo_capa", {id:g.id, imagemId:null}); }, className:"rounded-md px-1.5 py-0.5 text-[10.5px] font-bold", style:{background:COR+"55"}}, "Capa ✓"),
          i.podeRenomear && e("button",{type:"button", onClick:function(){ sr[1](i.id); }, className:bt}, "Renomear"),
          e("button",{type:"button", onClick:function(){ envia("imagem_del", {grupoId:g.id, id:i.id}); }, className:"rounded-md bg-red-500/20 px-1.5 py-0.5 text-[10.5px] font-bold text-red-300 hover:bg-red-500/35"}, "Remover")));
    })) : e(Vazio,null, d.totalGeral ? "Nenhuma imagem encontrada." : "Este grupo ainda não tem imagens."),
    d.paginas>1 && e("div",{className:"flex items-center justify-center gap-2"},
      e(Botao,{desativado:d.pagina<=1, onClick:function(){ sp[1](d.pagina-1); }}, "‹"), e("span",{className:"font-mono text-[12px]"}, d.pagina+" / "+d.paginas), e(Botao,{desativado:d.pagina>=d.paginas, onClick:function(){ sp[1](d.pagina+1); }}, "›")));
  var lateral = e("div",{key:"lat", className:"flex flex-col gap-3"},
    e("div",{className:"flex flex-col gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"},
      e("b",{className:"text-center text-[13px]"}, "Adicionar imagem por link"),
      e(Campo,{t:"Link da imagem"}, e("input",{value:add.url, placeholder:"https://", onChange:function(ev){ si[1](Object.assign({}, add, {url:ev.target.value})); }, className:CAMPO+" text-center"})),
      e(Campo,{t:"Nome (opcional)"}, e("input",{value:add.nome, onChange:function(ev){ si[1](Object.assign({}, add, {nome:ev.target.value})); }, className:CAMPO+" text-center"})),
      e(Botao,{principal:true, desativado:!add.url.trim(), onClick:adicionar}, "Adicionar"),
      e("p",{className:"text-center text-[11px] text-white/55"}, "O envio de arquivos ainda não existe: use o link da imagem.")),
    e("div",{className:"flex flex-col items-center gap-2 rounded-xl bg-black/20 p-3 ring-1 ring-white/10"},
      e(Marcas,{lista:g.badges}), e("span",{className:"font-mono text-[11.5px] text-white/60"}, g.slug),
      e("div",{className:"flex flex-wrap justify-center gap-2"},
        e(Botao,{onClick:function(){ sx[1](true); }}, "Editar grupo"),
        e(Botao,{className:se[0] ? "bg-red-500/40!" : "", onClick:function(){ if(se[0]){ envia("grupo_del", {id:g.id}); p.fechar(); } else se[1](true); }}, se[0] ? "Confirmar exclusão" : "Excluir grupo"))));
  return e("div",null,
    e(Janela,{t:g.nome, sub:d.totalGeral+" "+pluralImagens(d.totalGeral), fechar:p.fechar, colunas:[galeria, lateral]}),
    sx[0] && e(JanelaGrupo,{grupo:g, fechar:function(){ sx[1](false); }}));
}

function AbaMkMural(){
  var s = use().state, sb = useState(""), sm = useState([]), sp = useState(1), sd = useState(null), sn = useState(false);
  var r = gruposListar(s, {busca:sb[0], badges:sm[0], dir:"asc", pagina:sp[0], tamanho:20});
  var ativo = !!sb[0] || sm[0].length>0;
  return e(Pagina,null,
    e(BarraFiltros,{ativo:ativo, onLimpar:function(){ sb[1](""); sm[1]([]); sp[1](1); }},
      e("input",{value:sb[0], placeholder:"Buscar grupo", "aria-label":"Buscar grupo", onChange:function(ev){ sb[1](ev.target.value); sp[1](1); }, className:CAMPO+" w-48 text-center"}),
      BADGES.map(function(b){ return e(Chip,{key:b.valor, on:sm[0].indexOf(b.valor)!==-1, onClick:function(){ sm[1](alternar(sm[0], b.valor)); sp[1](1); }}, b.rotulo); }),
      e(Botao,{principal:true, onClick:function(){ sn[1](true); }}, "+ Novo grupo")),
    r.itens.length ? e("div",{className:"grid gap-2.5", style:{gridTemplateColumns:"repeat(auto-fill, minmax(11rem, 1fr))"}}, r.itens.map(function(g){
      return e("button",{key:g.id, type:"button", onClick:function(){ sd[1](g.id); }, title:"Abrir o grupo", className:"flex min-w-0 flex-col gap-1.5 rounded-xl bg-card p-2 text-center ring-1 ring-white/10 transition hover:ring-white/30"},
        e("div",{className:"aspect-[4/3] overflow-hidden rounded-lg bg-black/40"}, e(Capa,{url:g.capaUrl, alt:g.nome})),
        e("b",{className:"truncate text-[13px]", title:g.nome}, g.nome),
        e("span",{className:"font-mono text-[11.5px] text-white/65"}, g.qtdImagens+" "+pluralImagens(g.qtdImagens)+(g.atualizadoEm ? " · "+formatarDia(String(g.atualizadoEm).slice(0, 10)) : "")),
        e(Marcas,{lista:g.badges}));
    })) : e(Vazio,null, ativo ? "Nenhum grupo encontrado." : "Nenhum grupo criado."),
    r.paginas>1 && e("div",{className:"flex items-center justify-center gap-2"},
      e(Botao,{desativado:r.pagina<=1, onClick:function(){ sp[1](r.pagina-1); }}, "‹"), e("span",{className:"font-mono text-[12px]"}, r.pagina+" / "+r.paginas), e(Botao,{desativado:r.pagina>=r.paginas, onClick:function(){ sp[1](r.pagina+1); }}, "›")),
    sd[0] && e(JanelaDetalhe,{id:sd[0], fechar:function(){ sd[1](null); }}),
    sn[0] && e(JanelaGrupo,{grupo:null, fechar:function(){ sn[1](false); }}));
}
export { AbaMkMural };

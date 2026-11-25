// Kommo → Kits novos: REGRAS (25/11/2026, pedido do Leonardo: "tem que vir da Kommo para os kits novos do admin do protótipo").
// Só funções puras (sem rede e sem banco): testadas em scripts/testar-kits-novos-kommo.mjs. Quem lê a Kommo e grava é src/server/kits-novos-kommo.js.
//
// Como era no admin antigo (sorelly-admin, ReviewKommoLead + CriarKitNovoDeLead): aprovou o lead → kit novo "Cadastrada", com o valor e a opção do kit
// (casa/empresa, expositor) escolhidos na aprovação. Aqui a fonte é a própria Kommo, então vale para aprovação feita em qualquer lugar:
//   1. APROVOU   = o lead entrou no funil "Aprovadas" (a automação da Kommo leva o aprovado para lá) ou ganhou o status 142 no funil "Cadastro".
//                  → kit novo em Cadastrada, id LK<número do lead>, data = a da aprovação.
//   2. LIBEROU   = no funil Aprovadas, o lead chegou em "kit liberado" (ou passou dela: aguardando entrega, kit entregue).
//                  → o kit em Cadastrada passa para Liberado (o Cadastro liberou na Kommo). Lead que não tinha kit aqui entra direto em Liberado.
//   3. ETAPA     = qualquer mudança no funil Aprovadas: o cartão mostra a etapa da Kommo (kEt), sem mudar a etapa do kit.
//   4. DESFEZ    = o lead saiu do Aprovadas de volta para o Cadastro (aprovação desfeita): kit ainda em Cadastrada e que ninguém mexeu é cancelado.
// Nada é apagado. Kit que alguém já mexeu no sistema nunca muda de etapa por causa da Kommo (só a etiqueta kEt).
// A mesma revendedora já cadastrada pela planilha (mesmo telefone, ou mesmo nome com cadastro nos últimos 120 dias) NÃO ganha outro kit: o kit dela
// recebe só o número do lead (kId) e passa a acompanhar a Kommo.

export const KOMMO = {
  FUNIL_CADASTRO: 14137091,
  FUNIL_APROVADAS: 14137559,
  GANHO: 142,
  PERDIDO: 143,
  // funil Aprovadas
  KIT_LIBERADO: 109141067,
  AGUARDANDO_ENTREGA: 109141923,
  KIT_ENTREGUE_INDICACAO: 111115531,
  // campos do lead (os mesmos do admin antigo: sorelly-admin/apps/backend/src/config/kommo-lead-review.ts)
  CAMPOS: {
    nome: 2073620, cidade: 2073622, endereco: 2073624, cep: 2073626, profissao: 2073628, empresa: 2073636, empresaEnd: 2073634, obs: 2075024,
    kitNovo: 2075060, kitOpcao: 2104504, kitCasa: 2104506, kitEmpresa: 2104508, respAnalise: 2091084, anuncio: 2121697,
    indicadoraId: 2083841, indicadoraNome: 2083843,
  },
};
// etapas do funil Aprovadas que querem dizer "o kit já foi liberado"
const LIBERA = new Set([KOMMO.KIT_LIBERADO, KOMMO.AGUARDANDO_ENTREGA, KOMMO.KIT_ENTREGUE_INDICACAO, KOMMO.GANHO]);
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export const sem = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
// dia "AAAA-MM-DD" no fuso de São Paulo a partir de segundos (Kommo) ou milissegundos
export function diaSP(t) {
  const ms = t > 1e12 ? t : t * 1000;
  return new Date(ms).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}
// telefone só com dígitos, sem o 55 do Brasil (como a planilha grava: 41999998888)
export function soDigitos(t) {
  let d = String(t || "").replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2);
  return d;
}
const ultimos8 = (t) => { const d = soDigitos(t); return d.length >= 8 ? d.slice(-8) : ""; };

// ── eventos ──────────────────────────────────────────────────────────────
const statusDe = (lista) => { const x = Array.isArray(lista) && lista[0] && lista[0].lead_status; return x ? { p: Number(x.pipeline_id), s: Number(x.id) } : null; };
/** Evento "lead_status_changed" da Kommo → {lead, em, para, tipo} (tipo null = não interessa aos kits novos). */
export function classificarEvento(ev) {
  if (!ev || ev.type !== "lead_status_changed" || ev.entity_type !== "lead") return null;
  const de = statusDe(ev.value_before), para = statusDe(ev.value_after);
  if (!para) return null;
  const A = KOMMO.FUNIL_APROVADAS, C = KOMMO.FUNIL_CADASTRO;
  let tipo = null;
  if (para.p === A && LIBERA.has(para.s)) tipo = "liberou";
  else if ((para.p === A && (!de || de.p !== A)) || (para.p === C && para.s === KOMMO.GANHO)) tipo = "aprovou";
  else if (para.p === A) tipo = "etapa";
  else if (de && ((de.p === A && para.p === C && para.s !== KOMMO.GANHO) || (de.p === C && de.s === KOMMO.GANHO && para.p === C))) tipo = "desfez";
  return tipo ? { lead: Number(ev.entity_id), em: Number(ev.created_at), para, tipo } : null;
}

// ── dados do lead ────────────────────────────────────────────────────────
export function campo(lead, id) {
  const f = ((lead && lead.custom_fields_values) || []).find((x) => Number(x.field_id) === id);
  const v = f && f.values && f.values[0] ? f.values[0].value : null;
  return v == null ? "" : String(v).trim();
}
/** "R$ 5.000" / "R$ 5.000,50" / "5000" → 5000 (0 se não der). */
export function reais(t) {
  const s = String(t || "").replace(/[^\d,.]/g, "");
  if (!s) return 0;
  const n = s.includes(",") ? Number(s.replace(/\./g, "").replace(",", ".")) : Number(s.replace(/\.(?=\d{3}(\D|$))/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}
/** Opção e valor do kit gravados na aprovação: "Kit normal", "Kit normal + expositor", "Vir na empresa", "Vir na empresa + expositor". */
export function kitDoLead(lead, padrao) {
  const op = sem(campo(lead, KOMMO.CAMPOS.kitOpcao));
  const empresa = /empresa/.test(op), expositor = /expositor/.test(op);
  const casa = reais(campo(lead, KOMMO.CAMPOS.kitCasa)), naEmpresa = reais(campo(lead, KOMMO.CAMPOS.kitEmpresa)), kitNovo = reais(campo(lead, KOMMO.CAMPOS.kitNovo));
  const escolhido = empresa ? (naEmpresa || casa) : (casa || naEmpresa);
  return { valor: escolhido || kitNovo || padrao || 7000, empresa, expositor, opcao: campo(lead, KOMMO.CAMPOS.kitOpcao) };
}
const tags = (lead) => (((lead && lead._embedded && lead._embedded.tags) || []).map((t) => sem(t.name)));
/** Entrada no mesmo vocabulário da planilha: ID do anúncio do Meta, Indicação, Google, Formulário, Facebook ou Kommo. */
export function entradaDoLead(lead) {
  const anuncio = campo(lead, KOMMO.CAMPOS.anuncio).replace(/\D/g, ""), tg = tags(lead);
  const indNome = campo(lead, KOMMO.CAMPOS.indicadoraNome), indId = campo(lead, KOMMO.CAMPOS.indicadoraId);
  const obs2 = indNome || indId ? "Indicada por " + [indNome, indId ? "#" + indId : ""].filter(Boolean).join(" ") : "";
  if (tg.includes("indicacao") || obs2) return { ent: "Indicação", entId: "", obs2 };
  if (anuncio.length >= 12) return { ent: anuncio, entId: anuncio, obs2 };
  if (tg.includes("google ads")) return { ent: "Google", entId: "", obs2 };
  if (tg.includes("forms")) return { ent: "Formulário", entId: "", obs2 };
  if (tg.includes("facebook ads")) return { ent: "Facebook", entId: "", obs2 };
  return { ent: "Kommo", entId: "", obs2 };
}
/** "Curitiba, PR" / "curitiba - pr" → "Curitiba"; o resto como veio. */
export function cidadeLimpa(t) {
  const c = String(t || "").replace(/\s*[,/-]\s*(pr|sc|paran[aá]|santa catarina)\s*$/i, "").replace(/\s+/g, " ").trim();
  return c && c === c.toLowerCase() ? c.replace(/(^|\s)(\p{L})/gu, (m, a, b) => a + b.toUpperCase()).replace(/\b(Do|Da|Dos|Das|De)\b/g, (m) => m.toLowerCase()) : c;
}
const REGIOES = [
  ["Ponta Grossa", ["ponta grossa"]],
  ["Joinville", ["joinville"]],
  ["Maringá", ["maringa", "sarandi", "mandaguacu", "paicandu"]],
  ["Litoral do Paraná", ["paranagua", "matinhos", "guaratuba", "pontal do parana", "antonina", "morretes"]],
  ["Santa Catarina", ["itajai", "balneario camboriu", "camboriu", "itapema", "navegantes", "blumenau", "florianopolis", "sao jose", "palhoca", "brusque"]],
];
export function regiaoDaCidade(cid) {
  const c = sem(cid);
  const r = REGIOES.find(([, cidades]) => cidades.includes(c));
  return r ? r[0] : "Curitiba e região";
}
/** Telefone do contato principal do lead (campo PHONE; prefere o marcado como celular/WhatsApp). */
export function telefoneDoContato(contato) {
  const fs = ((contato && contato.custom_fields_values) || []).filter((f) => String(f.field_code || "").toUpperCase() === "PHONE" || /whats|telefone|celular|phone/i.test(String(f.field_name || "")));
  const vs = fs.flatMap((f) => (f.values || []).map((v) => ({ t: soDigitos(v.value), cod: String(v.enum_code || "").toUpperCase() }))).filter((v) => v.t.length >= 10);
  const peso = (v) => (/WHATS/.test(v.cod) ? 3 : /MOB|CEL/.test(v.cod) ? 2 : 1);
  vs.sort((a, b) => peso(b) - peso(a));
  return vs[0] ? vs[0].t : "";
}

/** Kit novo no formato do módulo kndados (mesmos campos da planilha) a partir do lead da Kommo. */
export function montarKit({ lead, contato, dia, st, padrao, etapaNome }) {
  const C = KOMMO.CAMPOS, kit = kitDoLead(lead, padrao), en = entradaDoLead(lead);
  const end = [campo(lead, C.endereco), campo(lead, C.cep) ? "CEP " + campo(lead, C.cep) : ""].filter(Boolean).join(" · ");
  const cid = cidadeLimpa(campo(lead, C.cidade)) || "Curitiba";
  const resp = campo(lead, C.respAnalise);
  const obs = [campo(lead, C.obs), kit.expositor ? "EXPOSITOR" : ""].filter(Boolean).join(" | ");
  const bai = (campo(lead, C.endereco).split(" - ").length > 1 ? campo(lead, C.endereco).split(" - ").pop().trim() : "");
  return {
    id: "LK" + lead.id, kId: Number(lead.id), kEt: etapaNome || "", kEm: dia,
    reg: regiaoDaCidade(cid), mes: MESES[Number(dia.slice(5, 7)) - 1], st,
    cad: dia, lib: st === "liberado" ? dia : null, sol: null, bip: null, ret: null,
    nome: (campo(lead, C.nome) || String(lead.name || "") || "Lead Kommo " + lead.id).replace(/\s+/g, " ").trim(),
    cid, bai, end, tel: telefoneDoContato(contato), prof: campo(lead, C.profissao),
    rep: kit.empresa ? "Sorelly" : "", mod: "Normal", val: kit.valor, retirada: "",
    trab: campo(lead, C.empresa), trabEnd: campo(lead, C.empresaEnd), disp: "", obs,
    c1: false, c2: false, c3: false, c1n: "", c1t: "", c1r: "", c2n: "", c2t: "", c2r: "", c3n: "", c3t: "", c3r: "",
    tipo: "Vendedora", op: resp || "Kommo", ent: en.ent, entId: en.entId, obs2: en.obs2, desm: 0,
    hist: [{ em: Date.now(), quem: "Kommo", txt: (st === "liberado" ? "Chegou da Kommo já com o kit liberado" : "Aprovada na Kommo" + (resp ? " por " + resp : "")) + " (lead " + lead.id + (kit.opcao ? ", " + kit.opcao : "") + ")" }],
  };
}

// ── juntar com o que já existe ─────────────────────────────────────────────
const registros = (conteudo) => Object.keys(conteudo || {}).filter((k) => k.startsWith("r_") && conteudo[k] && conteudo[k].id).map((k) => conteudo[k]);
/** Kit que já é desta revendedora: pelo número do lead; senão mesmo telefone ou mesmo nome com cadastro até 120 dias antes. */
export function acharExistente(conteudo, { leadId, tel, nome, dia }) {
  const lista = registros(conteudo);
  const porLead = lista.find((r) => Number(r.kId) === Number(leadId) || r.id === "LK" + leadId);
  if (porLead) return porLead;
  const t8 = ultimos8(tel), n = sem(nome), limite = new Date(Date.parse(dia + "T12:00:00Z") - 120 * 86400000).toISOString().slice(0, 10);
  const vivos = lista.filter((r) => !r.excluido && !r.kId && String(r.cad || "") >= limite);
  return (t8 && vivos.find((r) => ultimos8(r.tel) === t8)) || (n && vivos.find((r) => sem(r.nome) === n)) || null;
}
const soDaKommo = (r) => (r.hist || []).every((h) => h.quem === "Kommo");

/**
 * Aplica os eventos (já classificados, em ordem) no conteúdo do kndados. Devolve {chaves, resumo}: chaves = só os kits que mudaram.
 * dados = {leads:{id:lead}, contatos:{id:contato}, etapas:{statusId:nome}, padrao}
 */
export function aplicarEventos(conteudo, eventos, dados) {
  const atual = Object.assign({}, conteudo), chaves = {}, resumo = { criados: 0, liberados: 0, vinculados: 0, desfeitos: 0, etiquetas: 0, semDados: [] };
  const grava = (r) => { atual["r_" + r.id] = r; chaves["r_" + r.id] = r; };
  const novosAgora = new Set();   // kits criados nesta mesma leitura (aprovado e desfeito na mesma leitura = nem entra)
  const agora = Date.now();
  for (const ev of eventos) {
    const lead = dados.leads[ev.lead], dia = diaSP(ev.em), etapaNome = ev.para.p === KOMMO.FUNIL_APROVADAS ? (dados.etapas[ev.para.s] || "") : "";
    const contato = lead && lead._embedded && lead._embedded.contacts && lead._embedded.contacts[0] ? dados.contatos[lead._embedded.contacts[0].id] : null;
    let r = acharExistente(atual, { leadId: ev.lead, tel: lead ? telefoneDoContato(contato) : "", nome: lead ? campo(lead, KOMMO.CAMPOS.nome) || lead.name : "", dia });
    if (r && r.excluido) continue;   // excluído pela Diretoria: não volta
    if (ev.tipo === "aprovou" || ev.tipo === "liberou") {
      if (!r) {
        if (!lead) { resumo.semDados.push(ev.lead); continue; }
        const k = montarKit({ lead, contato, dia, st: ev.tipo === "liberou" ? "liberado" : "cadastrada", padrao: dados.padrao, etapaNome });
        grava(k); novosAgora.add(k.id);
        resumo.criados++;
        continue;
      }
      let n = Object.assign({}, r);
      if (!n.kId) { n.kId = Number(ev.lead); n.hist = (n.hist || []).concat([{ em: agora, quem: "Kommo", txt: "Ligado ao lead " + ev.lead + " da Kommo" }]); resumo.vinculados++; }
      if (ev.tipo === "liberou" && n.st === "cadastrada") {
        n = Object.assign(n, { st: "liberado", lib: dia, hist: (n.hist || []).concat([{ em: agora, quem: "Kommo", txt: "Liberado na Kommo (" + (etapaNome || "kit liberado") + ")" }]) });
        resumo.liberados++;
      }
      if (etapaNome) { n.kEt = etapaNome; n.kEm = dia; }
      if (JSON.stringify(n) !== JSON.stringify(r)) grava(n);
      continue;
    }
    if (!r) continue;
    if (ev.tipo === "etapa") {
      if (r.kEt !== etapaNome) { grava(Object.assign({}, r, { kEt: etapaNome, kEm: dia })); resumo.etiquetas++; }
      continue;
    }
    if (ev.tipo === "desfez") {
      if (novosAgora.has(r.id) && r.st === "cadastrada") { delete atual["r_" + r.id]; delete chaves["r_" + r.id]; novosAgora.delete(r.id); resumo.criados--; continue; }
      const n = Object.assign({}, r, { kEt: "Aprovação desfeita", kEm: dia });
      if (r.st === "cadastrada" && soDaKommo(r)) {
        Object.assign(n, { st: "cancelado", stAnterior: "cadastrada", ret: dia, obs: (r.obs ? r.obs + " | " : "") + "Cancelado: aprovação desfeita na Kommo",
          hist: (r.hist || []).concat([{ em: agora, quem: "Kommo", txt: "Cancelado: a aprovação foi desfeita na Kommo" }]) });
        resumo.desfeitos++;
      }
      grava(n);
    }
  }
  return { chaves, resumo };
}

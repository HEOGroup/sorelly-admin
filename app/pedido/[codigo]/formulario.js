/* eslint-disable @next/next/no-img-element -- fotos vêm de rota própria e de dados locais; a otimização do Next não serve aqui */
"use client";
// Formulário do pedido por link (Marcus, 17/11/2026). Feito para o celular e em PASSOS: só anda para a frente quando a revendedora aceita as condições e preenche o que é pedido.
//   Passo 1 · Condições: escolhe reposição ou encomenda, lê as regras (taxa, prazo, outro estado) e marca que aceita.
//   Passo 2 · Entrega (só reposição): endereço e horário para receber.
//   Passo 3 · Peças: fotos e/ou descrições (dourado, prata ou os dois) e enviar.
// A foto é reduzida no próprio aparelho (JPEG até 1600 px) e sobe uma por vez; o pedido só é enviado quando ela toca em "Enviar pedido".
import { useEffect, useRef, useState } from "react";

const CORES = [["dourado", "Dourado"], ["prata", "Prata"], ["os dois", "Os dois"]];
const HORARIOS = [["manhã (8h às 12h)", "Manhã", "8h às 12h"], ["tarde (13h às 18h)", "Tarde", "13h às 18h"], ["qualquer horário", "Qualquer", "no horário comercial"]];
const MAX = 10;   // regra do Marcus (18/11/2026): no máximo 10 peças por pedido
const frasePeca = (t) => { const x = String(t || "").toLowerCase().replace(/(^|[^a-zà-ú])(folhead[oa]s?|banhad[oa]s?)(?![a-zà-ú])/g, "$1").replace(/[ ]+/g, " ").trim(); return x.charAt(0).toUpperCase() + x.slice(1); };
const reais = (n) => "R$ " + Number(n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quando = (iso) => { try { return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch (x) { return ""; } };

function reduzir(arquivo) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(arquivo), img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.82, d = c.toDataURL("image/jpeg", q);
      while (d.length > 3.6 * 1024 * 1024 && q > 0.4) { q -= 0.12; d = c.toDataURL("image/jpeg", q); }
      res(d);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Não consegui abrir essa foto.")); };
    img.src = url;
  });
}

async function chamar(metodo, caminho, corpo) {
  const ctl = typeof AbortController !== "undefined" ? new AbortController() : null, relogio = ctl ? setTimeout(() => ctl.abort(), 45000) : null;
  let r;
  try { r = await fetch(caminho, { method: metodo, headers: { "content-type": "application/json" }, body: corpo === undefined ? undefined : JSON.stringify(corpo), signal: ctl ? ctl.signal : undefined }); }
  catch (x) { throw Object.assign(new Error("A internet demorou demais. Toque de novo para tentar."), { status: 0 }); }
  finally { if (relogio) clearTimeout(relogio); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.erro || "Algo deu errado. Tente de novo."), { status: r.status });
  return j;
}

const Tela = ({ passo, total, etapa, children }) => (
  <main className="min-h-screen overflow-x-hidden px-3 pb-6 pt-[max(2.25rem,env(safe-area-inset-top))] text-white sm:px-4 sm:pt-10" style={{ background: "#000" }}>
    <div className="mx-auto flex w-full min-w-0 max-w-[560px] flex-col gap-2.5 sm:gap-4">
      <header className="text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-sorelly.png" alt="Sorelly Joias" className="mx-auto mb-1 h-16 w-auto sm:h-24" />
        <h1 className="bg-gradient-to-r from-[#F5E7BE] via-[#E8B84B] to-[#F5E7BE] bg-clip-text text-[24px] font-extrabold leading-tight tracking-wide text-transparent">Pedido de peças</h1>
        <div className="mx-auto mt-1 h-px w-24 bg-gradient-to-r from-transparent via-[#E8B84B] to-transparent" aria-hidden />
        <p className="mt-1.5 text-[15px] font-semibold">{passo ? "Passo " + passo + " de " + total + (etapa ? " · " + etapa : "") : etapa || "Reposição e encomenda"}</p>
        {passo ? <div className="mx-auto mt-2 flex w-40 gap-1" aria-hidden>{Array.from({ length: total }).map((_, i) => <span key={i} className={"h-1 flex-1 rounded-full " + (i < passo ? "bg-[#E8B84B]" : "bg-white/25")} />)}</div> : null}
      </header>
      {children}
    </div>
  </main>
);
const Aviso = ({ titulo, texto }) => (
  <section className="rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-5 text-center">
    <h2 className="text-[16px] font-bold">{titulo}</h2>
    <p className="mt-2 text-[13px] leading-snug">{texto}</p>
  </section>
);
const Regra = ({ icone, titulo, children, lido, aoMarcar, semOk }) => (
  <div className={"rounded-lg border p-2.5 sm:p-3 " + (lido ? "border-[#E8B84B] bg-[#E8B84B]/[.10]" : "border-[#E8B84B]/35 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.20),rgba(0,0,0,0)_80%)]")}>
    <div className="flex gap-2.5">
      <span className="mt-0.5 text-[16px] leading-none" aria-hidden>{icone}</span>
      <div className="min-w-0 flex-1 break-words"><p className="text-[14px] font-bold">{titulo}</p><p className="mt-0.5 text-[13px] leading-snug">{children}</p></div>
    </div>
    {semOk ? null : (
      <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-md bg-black/25 px-2.5 py-2 text-[13px] font-bold">
        <input type="checkbox" checked={!!lido} onChange={(ev) => aoMarcar(ev.target.checked)} className="size-5 shrink-0" />
        <span>{lido ? "Li e estou de acordo ✓" : "Li e estou de acordo"}</span>
      </label>
    )}
  </div>
);
const Campo = ({ rotulo, children }) => (<label className="flex flex-col gap-1"><span className="text-[13px] font-bold">{rotulo}</span>{children}</label>);
const ENTRADA = "h-11 w-full rounded-lg border border-[#E8B84B]/40 bg-black/70 px-3 text-[16px] text-white placeholder:text-white/60 [&:-webkit-autofill]:shadow-[inset_0_0_0_100px_#1a1a1a] [&:-webkit-autofill]:[-webkit-text-fill-color:#fff]";
const BTN = "h-11 rounded-xl bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[16px] font-bold text-[#14233f] disabled:opacity-40";
const VOLTAR = "h-11 rounded-xl border border-[#E8B84B]/60 bg-gradient-to-br from-[#6b5214] to-[#2b2208] text-[15px] font-bold text-[#F5E7BE]";

// PEÇAS QUE O SETOR ENCONTROU (18/11/2026, Marcus): a revendedora volta ao MESMO link, vê a foto de cada peça e marca se quer ou não
// ordem fixa das peças (Marcus, 18/11/2026: "sempre por ordem, anéis, brincos, pulseiras, nunca aleatório")
const GRUPOS_PECA = [["aneis", "Anéis"], ["brincos", "Brincos"], ["pulseiras", "Pulseiras"], ["colares", "Colares"], ["chokers", "Chokers"], ["conjuntos", "Conjuntos"], ["tornozeleiras", "Tornozeleiras"], ["outras", "Outras peças"]];
const grupoDaPeca = (desc) => {
  const w = String(desc || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z]+/)[0] || "";
  if (/^anel|^anei/.test(w)) return "aneis";
  if (/^brinc|^trio|^duo|^argola/.test(w)) return "brincos";
  if (/^pulseir/.test(w)) return "pulseiras";
  if (/^colar|^pingente|^gargantilha/.test(w)) return "colares";
  if (/^choker/.test(w)) return "chokers";
  if (/^conjunto/.test(w)) return "conjuntos";
  if (/^tornozel/.test(w)) return "tornozeleiras";
  return "outras";
};

// PEÇAS QUE O SETOR ENCONTROU (18/11/2026, Marcus): a revendedora volta ao MESMO link, vê a foto de cada peça e marca se quer ou não
// Pedido extra (regra do Marcus, 18/11/2026): depois de responder, ela pode pedir MAIS peças, no máximo 2 vezes. Abre em TELA CHEIA (19/11/2026).
function MaisPecas({ info, codigo, n, aoEnviar, aoFechar }) {
  const max = info.extrasMax || 2;
  const [itens, setItens] = useState([]), [obs, setObs] = useState(""), [enviando, setEnviando] = useState(false), [erro, setErro] = useState(""), [feito, setFeito] = useState(false);
  const campo = useRef(null);
  const mudar = (id, parte) => setItens((l) => l.map((i) => (i.id === id ? { ...i, ...parte } : i)));
  const novoId = () => Math.random().toString(36).slice(2, 9);
  const adicionar = async (arquivos) => {
    const lista = Array.from(arquivos || []).filter((f) => /^image\//.test(f.type || "")).slice(0, MAX - itens.length);
    for (const f of lista) {
      const id = novoId();
      try {
        const url = await reduzir(f);
        setItens((l) => [...l, { id, url, key: "", cor: "", obs: "", subindo: true, erro: "" }]);
        chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/foto", { nome: f.name || "foto", url }).then((j) => mudar(id, { key: j.key, subindo: false }), (x) => mudar(id, { subindo: false, erro: x.message }));
      } catch (x) { setErro(x.message); }
    }
    if (campo.current) campo.current.value = "";
  };
  const semFoto = () => setItens((l) => (l.length >= MAX ? l : [...l, { id: novoId(), url: "", key: "", cor: "", obs: "", subindo: false, erro: "", texto: true }]));
  const valem = itens.filter((i) => (i.texto ? i.obs.trim() : i.key && !i.erro));
  const falta = !valem.length ? "Coloque ao menos uma foto ou descreva uma peça." : itens.some((i) => i.texto && !i.obs.trim()) ? "Descreva a peça que está sem foto (ou tire o cartão)." : valem.some((i) => !i.cor) ? "Escolha dourado, prata ou os dois em cada peça." : itens.some((i) => i.subindo) ? "Aguarde as fotos terminarem de subir." : "";
  const enviar = async () => {
    setErro(""); setEnviando(true);
    try {
      await chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/mais", { obs, fotos: valem.filter((i) => !i.texto).map((i) => ({ key: i.key, cor: i.cor, obs: i.obs })), textos: valem.filter((i) => i.texto).map((i) => ({ cor: i.cor, obs: i.obs })) });
      aoEnviar(); setFeito(true);
    } catch (x) { setErro(x.message); } finally { setEnviando(false); }
  };
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black px-3 pb-8 pt-[max(1rem,env(safe-area-inset-top))] text-white" role="dialog" aria-modal="true">
      <div className="mx-auto flex w-full max-w-[560px] flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[17px] font-bold text-[#F5E7BE]">Pedir mais peças {feito ? "" : "(" + (n + 1) + " de " + max + ")"}</p>
          <button type="button" onClick={aoFechar} className="h-10 rounded-xl border border-[#E8B84B]/60 px-4 text-[14px] font-bold text-[#F5E7BE]">Fechar</button>
        </div>
        {feito ? (
          <div className="flex flex-col gap-3 rounded-xl border border-[#4ade80]/50 bg-[#4ade80]/10 p-4 text-center">
            <p className="text-[17px] font-bold text-[#bbf7d0]">Pedido enviado ✓</p>
            <p className="text-[14px] leading-snug">A equipe vai procurar essas peças e avisa por mensagem.</p>
            <button type="button" onClick={aoFechar} className={BTN}>Voltar às minhas peças</button>
          </div>
        ) : (
          <>
            <p className="text-[13px] leading-snug">Até {MAX} peças. Mande a foto ou descreva a peça.</p>
            {itens.map((i) => (
              <div key={i.id} className="flex flex-col gap-1.5 rounded-lg border border-[#E8B84B]/40 bg-black/50 p-2">
                <div className="flex items-start gap-2">
                  {!i.texto && i.url && <img src={i.url} alt="Foto da peça" className="size-16 shrink-0 rounded-lg border-2 border-[#E8B84B] object-cover" />}
                  <input className={ENTRADA} value={i.obs} maxLength={160} placeholder={i.texto ? "Descreva a peça" : "Observação (opcional)"} onChange={(ev) => mudar(i.id, { obs: ev.target.value })} />
                  <button type="button" aria-label="Tirar" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))} className="h-11 shrink-0 px-2 text-[18px] font-bold">×</button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {CORES.map(([v, nome]) => <button key={v} type="button" onClick={() => mudar(i.id, { cor: v })} className={"h-9 rounded-lg text-[13px] font-bold " + (i.cor === v ? "bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f]" : "border border-[#E8B84B]/40 text-white")}>{nome}</button>)}
                </div>
                {i.subindo && <p className="text-[12px]">Enviando a foto…</p>}
                {i.erro && <p className="text-[12px] font-bold text-[#fecaca]">⚠ {i.erro}</p>}
              </div>
            ))}
            {itens.length < MAX && (
              <div className="grid grid-cols-2 gap-2">
                <label className={VOLTAR + " grid cursor-pointer place-items-center"}>Adicionar foto<input ref={campo} type="file" accept="image/*" multiple className="hidden" onChange={(ev) => adicionar(ev.target.files)} /></label>
                <button type="button" onClick={semFoto} className={VOLTAR}>Só descrever</button>
              </div>
            )}
            <textarea value={obs} maxLength={300} onChange={(ev) => setObs(ev.target.value)} placeholder="Recado para a equipe (opcional)" className={ENTRADA + " h-20 py-2"} />
            {(erro || (itens.length > 0 && falta)) && <p className="text-center text-[12px] font-bold leading-snug text-[#fecaca]">⚠ {erro || falta}</p>}
            <button type="button" disabled={enviando || !!falta} onClick={enviar} className={BTN + " w-full"}>{enviando ? "Enviando" : "Enviar pedido"}</button>
          </>
        )}
      </div>
    </div>
  );
}

// Taxa de entrega (18/11/2026, Marcus): depois que o setor separa as peças, o MESMO link pede o Pix da taxa; sem pagar, o pedido não é liberado para envio
function Pagamento({ info, codigo }) {
  const sep = info.separado, [pago, setPago] = useState(!!sep.pago), [copiado, setCopiado] = useState(false), [enviando, setEnviando] = useState(false), [erro, setErro] = useState("");
  const campo = useRef(null);
  const BLOCO = "flex flex-col gap-2.5 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3";
  const copiar = () => { try { navigator.clipboard.writeText(sep.pix.chave).then(() => setCopiado(true), () => setErro("Não consegui copiar. Copie a chave à mão.")); } catch (x) { setErro("Não consegui copiar. Copie a chave à mão."); } };
  const mandar = async (arquivos) => {
    const f = Array.from(arquivos || []).filter((a) => /^image\//.test(a.type || ""))[0]; if (!f) return;
    setErro(""); setEnviando(true);
    try {
      const url = await reduzir(f);
      const j = await chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/foto", { nome: "comprovante", url });
      await chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/comprovante", { key: j.key });
      setPago(true);
    } catch (x) { setErro(x.message); } finally { setEnviando(false); if (campo.current) campo.current.value = ""; }
  };
  if (!(sep.taxa > 0)) return <section className={BLOCO}><p className="text-[15px] font-bold text-[#F5E7BE]">Peças separadas ✓</p>{sep.pecas && sep.pecas.length > 0 && <p className="text-[13px] leading-snug">Foram separadas {sep.pecas.length} peças, no total de <b>{reais(sep.total)}</b>.</p>}<p className="text-[13px] leading-snug">As suas peças foram separadas e o pedido está <b>sem taxa de entrega</b>. A equipe combina o envio com você por mensagem.</p></section>;
  return (
    <section className={BLOCO}>
      <p className="text-[15px] font-bold text-[#F5E7BE]">Suas peças foram separadas ✓</p>
      {sep.pecas && sep.pecas.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-[#E8B84B]/40 bg-black/50 p-2">
          <p className="text-[13px] font-bold text-[#F5E7BE]">Peças separadas para você ({sep.pecas.length})</p>
          {sep.pecas.map((p) => (
            <div key={p.cod} className="flex items-center gap-2 border-b border-white/10 pb-1.5 last:border-b-0 last:pb-0">
              <img src={"/api/pedido-link/" + encodeURIComponent(codigo) + "/peca?cod=" + encodeURIComponent(p.cod)} alt={frasePeca(p.desc) || "Peça"} className="size-14 shrink-0 rounded-lg border-2 border-[#4ade80] object-cover" onError={(ev) => { ev.currentTarget.style.visibility = "hidden"; }} />
              <p className="min-w-0 flex-1 break-words text-[12px] leading-snug"><b>{p.cod}</b> · {frasePeca(p.desc)}</p>
              {p.preco != null && <p className="shrink-0 text-[12px] font-bold">{reais(p.preco)}</p>}
            </div>
          ))}
          <p className="text-right text-[13px]">Total das peças: <b className="text-[#F5E7BE]">{reais(sep.total)}</b></p>
        </div>
      )}
      <p className="text-[13px] leading-snug">Para <b>liberar o pedido para envio</b>, pague a taxa de entrega de <b>{reais(sep.taxa)}</b> por Pix. Depois mande o comprovante aqui.</p>
      {sep.pix ? (
        <div className="flex flex-col gap-1.5 rounded-lg border border-[#E8B84B]/40 bg-black/50 p-3 text-[13px] leading-snug">
          <p><b>Valor:</b> {reais(sep.taxa)}</p>
          <p><b>Chave Pix{sep.pix.tipo ? " (" + sep.pix.tipo.toLowerCase() + ")" : ""}:</b></p>
          <p className="break-all text-[16px] font-bold text-[#F5E7BE]">{sep.pix.chave}</p>
          {sep.pix.titular && <p><b>Nome no Pix:</b> {sep.pix.titular}</p>}
          <button type="button" onClick={copiar} className={VOLTAR}>{copiado ? "Chave copiada ✓" : "Copiar chave Pix"}</button>
        </div>
      ) : <p className="text-[13px] font-bold leading-snug">A equipe vai te mandar a chave Pix por mensagem.</p>}
      {pago ? <p className="rounded-lg border border-[#4ade80]/50 bg-[#4ade80]/10 p-3 text-center text-[13px] font-bold leading-snug text-[#bbf7d0]">Comprovante enviado ✓ A equipe confere o pagamento e libera o seu pedido para envio.</p> : (
        <>
          <label className={BTN + " grid cursor-pointer place-items-center " + (enviando ? "opacity-40" : "")}>{enviando ? "Enviando" : "Enviar comprovante"}<input ref={campo} disabled={enviando} type="file" accept="image/*" className="hidden" onChange={(ev) => mandar(ev.target.files)} /></label>
          {erro && <p className="text-center text-[12px] font-bold leading-snug text-[#fecaca]">⚠ {erro}</p>}
        </>
      )}
    </section>
  );
}

function Acompanhar({ info, codigo }) {
  const ret = info.acompanhar.retorno, lim = info.limite && info.limite.max > 0 ? info.limite : null;
  // peças em ordem fixa: anéis, brincos, pulseiras, colares, chokers, conjuntos, tornozeleiras, outras (dentro de cada grupo, a ordem do setor)
  const pecas = info.acompanhar.pecas.map((p, i) => ({ ...p, _i: i })).sort((x, y) => GRUPOS_PECA.findIndex((g) => g[0] === grupoDaPeca(x.desc)) - GRUPOS_PECA.findIndex((g) => g[0] === grupoDaPeca(y.desc)) || x._i - y._i);
  const [escolha, setEscolha] = useState(() => { const o = {}; if (ret) { (ret.quer || []).forEach((c) => { o[c] = "sim"; }); (ret.nao || []).forEach((c) => { o[c] = "nao"; }); } return o; });
  const [obs, setObs] = useState(ret ? ret.obs || "" : ""), [enviando, setEnviando] = useState(false), [feito, setFeito] = useState(!!ret), [erro, setErro] = useState("");
  const [semFoto, setSemFoto] = useState({}), [piscar, setPiscar] = useState(""), [aba, setAba] = useState(info.separado && !info.separado.pago ? "pagamento" : "pecas"), [pronto, setPronto] = useState(false), [maisAberto, setMaisAberto] = useState(false), [extrasFeitos, setExtrasFeitos] = useState(info.extras ? info.extras.length : 0);
  const extrasMax = info.extrasMax || 2, extrasRestam = Math.max(0, extrasMax - extrasFeitos);
  const ped = info.pedido;
  const [notas, setNotas] = useState(() => ({ ...((ret && ret.notas) || {}) }));
  const faltam = pecas.filter((p) => !escolha[p.cod]).length, querN = pecas.filter((p) => escolha[p.cod] === "sim").length, naoN = pecas.filter((p) => escolha[p.cod] === "nao").length;
  const querTotal = pecas.reduce((t, p) => t + (escolha[p.cod] === "sim" ? Number(p.preco) || 0 : 0), 0);
  const passou = !!lim && querTotal > lim.max + 0.001;
  const enviar = async () => {
    setErro("");
    // ainda tem peça sem resposta: volta sozinho para a primeira que falta
    const primeira = pecas.find((p) => !escolha[p.cod]);
    if (primeira) {
      const el = document.getElementById("peca-" + primeira.cod);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      setPiscar(primeira.cod); setTimeout(() => setPiscar(""), 2200);
      setErro("Falta responder esta peça (faltam " + faltam + "). Toque em Quero ou Não quero.");
      return;
    }
    if (passou) { setErro("As peças que você quer passam do seu limite de " + reais(lim.max) + ". Tire alguma para enviar."); return; }
    setEnviando(true);
    try { await chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/ok", { quer: pecas.filter((p) => escolha[p.cod] === "sim").map((p) => p.cod), obs, notas }); setFeito(true); setPronto(true); }
    catch (x) { setErro(x.message); } finally { setEnviando(false); }
  };
  // tocar de novo no mesmo botão tira a marca (e o campo de observação volta)
  const marca = (cod, v) => { setEscolha((o) => { const n = { ...o }; if (n[cod] === v) delete n[cod]; else n[cod] = v; return n; }); setFeito(false); setErro(""); };
  const cartao = (p) => {
    const sim = escolha[p.cod] === "sim", nao = escolha[p.cod] === "nao", marcado = sim || nao, nota = (notas[p.cod] || "").trim();
    return (
      <div key={p.cod} id={"peca-" + p.cod} className={"rounded-2xl p-[1.5px] transition " + (piscar === p.cod ? "animate-pulse bg-[#f87171] " : sim ? "bg-gradient-to-br from-[#bbf7d0] via-[#4ade80] to-[#15803d] " : nao ? "bg-gradient-to-br from-[#fecaca] via-[#f87171] to-[#991b1b] " : "bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#7a5a14] ")}>
        <section className={"flex h-full flex-col overflow-hidden rounded-[15px] bg-black " + (sim ? "bg-[linear-gradient(to_top,rgba(74,222,128,.30),rgba(74,222,128,.08)_50%,rgba(0,0,0,0)_88%)]" : nao ? "bg-[linear-gradient(to_top,rgba(248,113,113,.30),rgba(248,113,113,.08)_50%,rgba(0,0,0,0)_88%)]" : "bg-[linear-gradient(to_top,rgba(232,184,75,.30),rgba(232,184,75,.08)_45%,rgba(0,0,0,0)_80%)]")}>
          <div className="p-1.5 pb-0">
            {/* a foto tem uma borda fina da cor do cartão: dourada, verde (quero) ou vermelha (não quero) */}
            <div className={"overflow-hidden rounded-xl border-2 " + (sim ? "border-[#4ade80]" : nao ? "border-[#f87171]" : "border-[#E8B84B]")}>
            {semFoto[p.cod] ? <div className="grid aspect-square w-full place-items-center text-center text-[12px]">Foto em breve</div>
              : <img src={"/api/pedido-link/" + encodeURIComponent(codigo) + "/peca?cod=" + encodeURIComponent(p.cod)} alt={frasePeca(p.desc) || "Peça"} className={"mx-auto block aspect-square w-full object-contain " + (nao ? "opacity-70" : "")} onError={() => setSemFoto((o) => ({ ...o, [p.cod]: true }))} />}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 p-2.5">
            <p className="break-words text-[12px] font-bold leading-snug">{frasePeca(p.desc) || "Peça"}</p>
            {p.preco != null && <p className="bg-gradient-to-r from-[#F5E7BE] to-[#E8B84B] bg-clip-text text-[14px] font-bold text-transparent">{reais(p.preco)}</p>}
            {/* sem resposta: campo de observação. Com resposta: o campo sai e fica só o texto dela */}
            {!marcado
              ? <input type="text" value={notas[p.cod] || ""} maxLength={160} onChange={(ev) => { setNotas({ ...notas, [p.cod]: ev.target.value }); setFeito(false); }} placeholder="Observação (opcional)" aria-label={"Observação: " + (frasePeca(p.desc) || "peça")} className="h-9 w-full rounded-lg border border-[#E8B84B]/40 bg-black/70 px-2.5 text-[13px] placeholder:text-white/50" />
              : nota ? <p className="break-words rounded-lg bg-black/50 px-2 py-1 text-[12px] italic leading-snug">“{nota}”</p> : null}
            <div className="mt-auto flex flex-col gap-1.5 pt-1" role="radiogroup" aria-label={frasePeca(p.desc) || "Peça"}>
              <button type="button" role="radio" aria-checked={sim} onClick={() => marca(p.cod, "sim")} className={"h-10 rounded-xl text-[13px] font-bold shadow-md transition " + (sim ? "bg-gradient-to-br from-[#bbf7d0] via-[#4ade80] to-[#16a34a] text-[#052e16] ring-2 ring-white" : "bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f] " + (nao ? "opacity-60" : "opacity-90"))}>{sim ? "✓ Quero · voltar" : "Quero"}</button>
              <button type="button" role="radio" aria-checked={nao} onClick={() => marca(p.cod, "nao")} className={"h-9 rounded-xl border text-[12px] font-bold transition " + (nao ? "border-[#fecaca] bg-gradient-to-br from-[#f87171] to-[#b91c1c] text-white ring-2 ring-white/80" : "border-[#E8B84B]/50 bg-black/60")}>{nao ? "✕ Não quero · voltar" : "Não quero"}</button>
            </div>
          </div>
        </section>
      </div>
    );
  };
  return (
    <Tela etapa="Peças que encontramos">
      <section className="rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3">
        <h2 className="text-[16px] font-bold">Oi, {info.primeiroNome}! 💛</h2>
        <p className="mt-1 text-[13px] leading-snug">A equipe encontrou estas peças para o seu pedido. Veja cada foto e marque <b>Quero</b> ou <b>Não quero</b>. Depois toque em <b>Enviar resposta</b>.</p>
        {lim && <p className="mt-1.5 text-[13px] leading-snug">Seu limite: <b className="text-[#F5E7BE]">{reais(lim.max)}</b> por reposição. <a href={"/pedido/" + encodeURIComponent(codigo) + "/tabela"} target="_blank" rel="noopener" className="font-bold text-[#F5E7BE] underline">Ver a tabela de valores</a></p>}
      </section>
      <div className={"grid gap-1.5 rounded-xl border border-[#E8B84B]/50 bg-black p-1 " + (info.separado ? "grid-cols-3" : "grid-cols-2")} role="tablist">
        {[...(info.separado ? [["pagamento", "Pagamento"]] : []), ["pecas", "Peças que encontramos"], ["pedido", "O que eu pedi"]].map(([id, nome]) => (
          <button key={id} type="button" role="tab" aria-selected={aba === id} onClick={() => { setAba(id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={"h-10 rounded-lg text-[13px] font-bold " + (aba === id ? "bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f]" : "text-white")}>{nome}</button>
        ))}
      </div>
      {aba === "pagamento" && info.separado && <Pagamento info={info} codigo={codigo} />}
      {aba === "pedido" && (
        <section className="flex flex-col gap-2.5 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3">
          {!ped || (!ped.fotos.length && !ped.textos.length) ? <p className="text-[13px] leading-snug">O seu pedido não ficou guardado neste link. Se precisar, fale com o setor.</p> : (
            <>
              <p className="text-[13px] leading-snug">Este foi o seu pedido{ped.tipo ? " (" + (ped.tipo === "encomenda" ? "encomenda" : "reposição") + ")" : ""}{ped.em ? ", enviado em " + quando(ped.em) : ""}:</p>
              {ped.fotos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {ped.fotos.map((f, i) => (
                    <div key={f.key} className="flex flex-col gap-1">
                      <div className="overflow-hidden rounded-xl border-2 border-[#E8B84B]">
                        <img src={"/api/pedido-link/" + encodeURIComponent(codigo) + "/foto-pedido?key=" + encodeURIComponent(f.key)} alt={"Foto " + (i + 1) + " do seu pedido"} className="block aspect-square w-full object-cover" />
                      </div>
                      <p className="break-words text-[12px] leading-snug"><b>{f.cor ? f.cor.charAt(0).toUpperCase() + f.cor.slice(1) : "Foto " + (i + 1)}</b>{f.obs ? " · " + f.obs : ""}</p>
                    </div>
                  ))}
                </div>
              )}
              {ped.textos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-[13px] font-bold text-[#F5E7BE]">Peças que você só descreveu</p>
                  {ped.textos.map((t, i) => <p key={i} className="rounded-lg border border-[#E8B84B]/40 bg-black/50 px-3 py-2 text-[13px] leading-snug"><b>{t.cor ? t.cor.charAt(0).toUpperCase() + t.cor.slice(1) : "Peça"}</b>{t.obs ? " · " + t.obs : ""}</p>)}
                </div>
              )}
              {ped.obs && <p className="text-[13px] leading-snug"><b className="text-[#F5E7BE]">Recado que você deixou: </b>{ped.obs}</p>}
            </>
          )}
        </section>
      )}
      {aba === "pecas" && GRUPOS_PECA.map(([id, nome]) => {
        const lista = pecas.filter((p) => grupoDaPeca(p.desc) === id);
        if (!lista.length) return null;
        return (
          <div key={id} className="flex flex-col gap-2">
            <h3 className="text-[14px] font-bold text-[#F5E7BE]">{nome} <span className="text-[12px] font-normal text-white">· {lista.length} {lista.length === 1 ? "peça" : "peças"}</span></h3>
            <div className="grid grid-cols-2 gap-2.5">{lista.map(cartao)}</div>
          </div>
        );
      })}
      {aba === "pecas" && <section className="flex flex-col gap-2.5 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3">
        <textarea value={obs} maxLength={300} rows={2} onChange={(ev) => { setObs(ev.target.value); setFeito(false); }} placeholder="Quer avisar algo? (opcional)" className="w-full rounded-lg border border-[#E8B84B]/40 bg-black/70 px-3 py-2 text-[13px] placeholder:text-white/60" />
        {feito && !erro && <p className="text-center text-[14px] font-bold text-[#F5E7BE]">Resposta enviada ✓ Você marcou {querN} de {pecas.length}. Pode mudar e enviar de novo.</p>}
      </section>}
      {aba === "pecas" && (
        <section className="flex flex-col gap-2 rounded-xl border border-[#E8B84B]/55 bg-black p-3">
          {extrasRestam > 0
            ? <button type="button" onClick={() => setMaisAberto(true)} className={VOLTAR}>Pedir mais peças ({extrasRestam} {extrasRestam === 1 ? "vez restante" : "vezes restantes"})</button>
            : <p className="text-center text-[13px] leading-snug">Você já fez os {extrasMax} pedidos extras deste link. ✓</p>}
        </section>
      )}
      {maisAberto && <MaisPecas info={info} codigo={codigo} n={extrasFeitos} aoEnviar={() => setExtrasFeitos((v) => v + 1)} aoFechar={() => setMaisAberto(false)} />}
      {pronto && !maisAberto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black px-4 pb-8 pt-[max(2rem,env(safe-area-inset-top))] text-white" role="dialog" aria-modal="true">
          <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 text-center">
            <p className="text-[22px] font-bold text-[#bbf7d0]">Resposta enviada ✓</p>
            <p className="text-[15px] leading-snug">Você escolheu <b>{querN} {querN === 1 ? "peça" : "peças"}</b>, no total de <b className="text-[#F5E7BE]">{reais(querTotal)}</b>.</p>
            <p className="text-[14px] leading-snug">A equipe vai separar as suas peças. Quando estiverem prontas, a aba <b>Pagamento</b> aparece neste mesmo link.</p>
            {extrasRestam > 0 && <button type="button" onClick={() => setMaisAberto(true)} className={BTN + " w-full"}>Pedir mais peças ({extrasRestam} {extrasRestam === 1 ? "vez restante" : "vezes restantes"})</button>}
            <button type="button" onClick={() => setPronto(false)} className={VOLTAR + " w-full"}>Ver as minhas escolhas</button>
          </div>
        </div>
      )}
      {aba === "pecas" && <div className="h-44" aria-hidden />}
      {/* barra fixa de baixo: resumo, medidor do limite e o botão, em três linhas bem alinhadas */}
      {aba === "pecas" && <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl border-t border-[#E8B84B]/70 bg-black/95 px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,.7)]">
        <div className="mx-auto flex w-full max-w-[560px] flex-col gap-2">
          {erro && <p className="rounded-lg border border-[#f87171]/60 bg-[#f87171]/15 px-3 py-1.5 text-center text-[12px] font-bold leading-snug text-[#fecaca]">⚠ {erro}</p>}
          <div className="grid grid-cols-3 gap-2 text-center text-[11px] leading-tight">
            <p className="rounded-lg border border-[#4ade80]/40 bg-[#4ade80]/10 py-1"><b className="block text-[15px] text-[#bbf7d0]">{querN}</b>quero</p>
            <p className="rounded-lg border border-[#f87171]/40 bg-[#f87171]/10 py-1"><b className="block text-[15px] text-[#fecaca]">{naoN}</b>não quero</p>
            <p className="rounded-lg border border-[#E8B84B]/40 bg-[#E8B84B]/10 py-1"><b className="block text-[15px] text-[#F5E7BE]">{faltam}</b>faltam</p>
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between text-[12px]">
              <span>Total que você quer: <b className={passou ? "text-[#fecaca]" : "text-[#F5E7BE]"}>{reais(querTotal)}</b></span>
              {lim && <span>Limite: <b>{reais(lim.max)}</b></span>}
            </div>
            {lim && <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={lim.max} aria-valuenow={Math.round(querTotal)}><div className={"h-full rounded-full " + (passou ? "bg-[#f87171]" : "bg-gradient-to-r from-[#F5E7BE] via-[#E8B84B] to-[#B8892A]")} style={{ width: Math.min(100, (querTotal / lim.max) * 100) + "%" }} /></div>}
          </div>
          <button type="button" disabled={enviando} onClick={enviar} className={BTN + " w-full"}>{enviando ? "Enviando" : feito ? "Enviar de novo" : "Enviar resposta"}</button>
        </div>
      </div>}
    </Tela>
  );
}

export default function Formulario({ codigo }) {
  const [info, setInfo] = useState(null), [falha, setFalha] = useState(""), [passo, setPasso] = useState(1);
  const [tipo, setTipo] = useState("reposicao"), [forma, setForma] = useState("entrega"), [lidos, setLidos] = useState({});
  const [ret, setRet] = useState({ dia: "", hora: "" });
  const [ent, setEnt] = useState({ rua: "", bairro: "", cidade: "", complemento: "", horario: "", horarioObs: "" });
  const [itens, setItens] = useState([]), [obs, setObs] = useState("");
  const [enviando, setEnviando] = useState(false), [feito, setFeito] = useState(false), [erro, setErro] = useState("");
  const campo = useRef(null);

  useEffect(() => {
    let vivo = true;
    chamar("GET", "/api/pedido-link/" + encodeURIComponent(codigo)).then((j) => { if (vivo) { setInfo(j); if (j.forcaEncomenda) setTipo("encomenda"); } }, (x) => { if (vivo) setFalha(x.status === 404 ? "naoachou" : "erro"); });
    return () => { vivo = false; };
  }, [codigo]);

  const rep = tipo === "reposicao", total = rep ? 3 : 2, empresa = rep && forma === "empresa" && !!(info && info.podeEmpresa);
  const hoje = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const mudar = (id, parte) => setItens((l) => l.map((i) => (i.id === id ? { ...i, ...parte } : i)));
  const novoId = () => Math.random().toString(36).slice(2, 9);
  const adicionar = async (arquivos) => {
    const lista = Array.from(arquivos || []).filter((f) => /^image\//.test(f.type || "")).slice(0, MAX - itens.length);
    for (const f of lista) {
      const id = novoId();
      try {
        const url = await reduzir(f);
        setItens((l) => [...l, { id, url, key: "", cor: "", obs: "", subindo: true, erro: "" }]);
        chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/foto", { nome: f.name || "foto", url }).then((j) => mudar(id, { key: j.key, subindo: false }), (x) => mudar(id, { subindo: false, erro: x.message }));
      } catch (x) { setErro(x.message); }
    }
    if (campo.current) campo.current.value = "";
  };
  const semFoto = () => setItens((l) => (l.length >= MAX ? l : [...l, { id: novoId(), url: "", key: "", cor: "", obs: "", subindo: false, erro: "", texto: true }]));

  const entregaOk = empresa ? (/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(ret.dia) && ret.dia >= hoje && !!ret.hora) : (ent.rua.trim().length >= 3 && ent.cidade.trim().length >= 2 && !!ent.horario);
  const valem = itens.filter((i) => (i.texto ? i.obs.trim() : i.key && !i.erro));
  const falta = !valem.length ? "Coloque ao menos uma foto ou descreva uma peça."
    : itens.some((i) => i.texto && !i.obs.trim()) ? "Descreva a peça que está sem foto (ou tire o cartão)."
    : valem.some((i) => !i.cor) ? "Escolha dourado, prata ou os dois em cada peça."
    : itens.some((i) => i.subindo) ? "Aguarde as fotos terminarem de subir." : "";
  const enviar = async () => {
    setErro(""); setEnviando(true);
    try {
      await chamar("POST", "/api/pedido-link/" + encodeURIComponent(codigo) + "/enviar", {
        tipo, obs, aceite: true, forma: empresa ? "empresa" : "entrega", entrega: rep && !empresa ? ent : null, retirada: empresa ? ret : null,
        fotos: valem.filter((i) => !i.texto).map((i) => ({ key: i.key, cor: i.cor, obs: i.obs })),
        textos: valem.filter((i) => i.texto).map((i) => ({ cor: i.cor, obs: i.obs })),
      });
      setFeito(true);
    } catch (x) { setErro(x.message); } finally { setEnviando(false); }
  };

  if (falha === "naoachou") return <Tela><Aviso titulo="Link não encontrado" texto="Confira se o link está completo ou peça um novo ao setor de Reposições e Encomendas." /></Tela>;
  if (falha) return <Tela><Aviso titulo="Não consegui abrir" texto="Tente de novo em instantes." /></Tela>;
  if (!info) return <Tela><Aviso titulo="Carregando" texto="Um instante." /></Tela>;
  if (feito) return <Tela><Aviso titulo={"Pedido enviado, " + info.primeiroNome + "! 💛"} texto={empresa ? "Recebemos o seu pedido. A equipe separa as peças e confirma o seu horário por mensagem escrita. Você retira na empresa, sem taxa de entrega." : rep ? "Recebemos o seu pedido. A equipe separa as peças e te avisa por mensagem escrita para você fazer o Pix da taxa. Depois do Pix, o pedido sai para entrega." : "Recebemos a sua encomenda. As peças vão junto com o seu próximo kit. A equipe retorna por mensagem escrita."} /></Tela>;
  if (info.estado === "acompanhar") return <Acompanhar info={info} codigo={codigo} />;
  if (info.estado === "enviado") return <Tela><Aviso titulo="Este pedido já foi enviado" texto="A equipe já recebeu e está procurando as peças. Quando encontrar, a gente te avisa por mensagem e as peças aparecem neste mesmo link, para você ver e dar o OK." /></Tela>;
  if (info.estado === "expirado") return <Tela><Aviso titulo="Este link expirou" texto="O link vale por 48 horas. Peça um novo link ao setor de Reposições e Encomendas." /></Tela>;

  // ---------- PASSO 1: condições (cada uma pede o OK da revendedora) ----------
  const NAO_GARANTE = { id: "naogarante", icone: "🤝", titulo: "As peças pedidas não são garantidas", texto: <>Somos <b>só 3 funcionárias</b> no setor e a procura é <b>muito grande</b>, então tenha <b>paciência</b>. Peças <b>100% iguais</b> à foto são <b>muito difíceis de achar</b>, mas nós vamos tentar o máximo para te atender.</> };
  const limiteRegra = info.limite && info.limite.max > 0 ? [{ id: "limite", icone: "🧾", titulo: "Seu limite para pedir", texto: <>Valor máximo por reposição: <b>{reais(info.limite.max)}</b>.{info.limite.qtd > 0 ? <> Você pode fazer <b>{info.limite.qtd} {info.limite.qtd === 1 ? "reposição" : "reposições"} por mês</b>.</> : null}{" "}<a href={"/pedido/" + encodeURIComponent(codigo) + "/tabela"} target="_blank" rel="noopener" className="font-bold text-[#F5E7BE] underline">Ver a tabela de valores</a></> }] : [];
  const regrasBase = empresa ? [
    { id: "repo", icone: "🏢", titulo: "Reposição: você retira na empresa", texto: <>Você vem até a nossa empresa, <b>com horário marcado</b>, e escolhe as peças. Você tem até <b>30 minutos</b> para escolher. <b>Todas as reposições são pagas.</b></> },
    { id: "semtaxa", icone: "💰", titulo: "Sem taxa de entrega", texto: <>Como você mesma retira, <b>não paga a taxa do entregador</b>. Só vale com o <b>horário confirmado</b> pela equipe.</> },
    { id: "quinze", icone: "🗓️", titulo: "Pediu 15 dias antes do seu acerto?", texto: <>O pedido fica como <b>encomenda para o próximo kit</b>, e aí <b>não tem taxa</b>. Se preferir, escolha encomenda acima.</> },
    NAO_GARANTE,
  ] : rep ? [
    { id: "repo", icone: "🛵", titulo: "Reposição: no meio do seu kit", texto: <>Você pede, nós separamos e entregamos no seu endereço.{info.taxa === 0 ? null : <> <b>Todas as reposições são pagas.</b></>}</> },
    ...(info.taxa === 0 ? [{ id: "taxa", icone: "💰", titulo: "Sem taxa de entrega", texto: <>O seu pedido está <b>isento da taxa de entrega</b>: você não paga nada pela entrega. O pedido sai no dia seguinte ou no outro, depois de separado.</> }] : [{ id: "taxa", icone: "💰", titulo: "Taxa de " + reais(info.taxa || 15) + " (entrega)", texto: <>É o valor do <b>rapaz da entrega</b>, que sai só para o nosso setor. Ela é paga por <b>Pix no dia em que o seu pedido for fechado</b>, quando as peças estiverem separadas. Assim o pedido <b>sai no dia seguinte ou no outro</b>. Sem o Pix, o pedido não sai.</> }]),
    { id: "quinze", icone: "🗓️", titulo: "Pediu 15 dias antes do seu acerto?", texto: <>O pedido fica como <b>encomenda para o próximo kit</b>, e aí <b>não tem taxa</b>. Se preferir, escolha encomenda acima.</> },
    NAO_GARANTE,
  ] : [
    { id: "enc", icone: "📦", titulo: "Encomenda: para o seu próximo kit", texto: <>As peças vão junto com o seu próximo kit e <b>não tem taxa de entrega</b>. A equipe avisa por mensagem escrita quando estiver tudo certo.</> },
    { id: "quando", icone: "🗓️", titulo: "Quando é encomenda?", texto: <>Quando o pedido é feito <b>15 dias ou mais antes do seu acerto</b>, ou quando você <b>mora em outro estado</b>.</> },
    NAO_GARANTE,
  ];
  const regras = (rep ? limiteRegra : []).concat(regrasBase);   // o limite dela aparece primeiro, só na reposição
  // em TODO link (com ou sem taxa) há um só "Li e estou de acordo", no fim (Marcus, 18/11/2026); os itens são só para ler
  const todosLidos = !!lidos.geral;

  if (passo === 1) return (
    <Tela passo={1} total={total} etapa="Condições">
      <section className="rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3 sm:p-4">
        <h2 className="text-[16px] font-bold">Oi, {info.primeiroNome}! 💛</h2>
        <p className="mt-2 text-[13px] leading-snug">Este setor foi criado <b>para ajudar você, revendedora</b>: para você nunca ficar sem a peça que a sua cliente quer, na hora em que ela quer comprar. Peça por aqui que a gente separa para você.</p>
      </section>

      <section className="rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3">
        {info.forcaEncomenda ? (
          <p className="text-[13px] leading-snug"><b>Seu pedido é uma encomenda</b> para o próximo kit (sem taxa), porque você é de outro estado.</p>
        ) : (
          <>
            <p className="mb-2 text-[13px] font-bold">O que você quer pedir?</p>
            <div className={"grid gap-2 " + (info.podeEmpresa ? "grid-cols-1 min-[460px]:grid-cols-3" : "grid-cols-2")} role="radiogroup" aria-label="Tipo do pedido">
              {[["reposicao", "entrega", "Reposição", (info.taxa === 0 ? "entrega · sem taxa (isento)" : "entrega · taxa " + reais(info.taxa || 15))], ...(info.podeEmpresa ? [["reposicao", "empresa", "Reposição", "eu retiro na empresa · sem taxa"]] : []), ["encomenda", "entrega", "Encomenda", "próximo kit · sem taxa"]].map(([v, fm, t, sub]) => {
                const on = tipo === v && (v === "encomenda" || forma === fm);
                return (
                  <button key={v + fm} type="button" role="radio" aria-checked={on} onClick={() => { setTipo(v); setForma(fm); setLidos({}); }}
                    className={"rounded-lg border px-2 py-2 text-center " + (on ? "border-transparent bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f]" : "border-[#E8B84B]/50 bg-black")}>
                    <span className="block text-[15px] font-bold">{t}</span><span className="block text-[12px]">{sub}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="flex flex-col gap-2.5">
        {regras.map((r) => <Regra key={r.id} semOk icone={r.icone} titulo={r.titulo} lido={!!lidos[r.id]} aoMarcar={(v) => setLidos({ ...lidos, [r.id]: v })}>{r.texto}</Regra>)}
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-[#E8B84B]/50 bg-[#E8B84B]/10 p-3">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md bg-black/25 px-2.5 py-2.5 text-[14px] font-bold">
          <input type="checkbox" checked={!!lidos.geral} onChange={(ev) => setLidos({ ...lidos, geral: ev.target.checked })} className="size-5 shrink-0" />
          <span>{lidos.geral ? "Li e estou de acordo ✓" : "Li e estou de acordo"}</span>
        </label>
        <button type="button" disabled={!todosLidos} onClick={() => setPasso(2)} className={BTN}>Assinar e continuar</button>
        {!todosLidos && <p className="text-center text-[12px]">Só dá para assinar se você estiver de acordo com tudo.</p>}
        <p className="text-center text-[12px]">Este link é só seu e vale até <b>{quando(info.expiraEm)}</b>.</p>
      </section>
    </Tela>
  );

  // ---------- PASSO 2 (retirada na empresa): dia e hora ----------
  if (empresa && passo === 2) return (
    <Tela passo={2} total={3} etapa="Retirada na empresa">
      <section className="flex flex-col gap-3 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3 sm:p-4">
        <h2 className="text-[15px] font-bold">Quando você vem retirar?</h2>
        <p className="text-[13px] leading-snug">Escolha o dia e a hora. A equipe <b>confirma o seu horário por mensagem escrita</b>.</p>
        <Campo rotulo="Dia *"><input type="date" min={hoje} value={ret.dia} onChange={(ev) => setRet({ ...ret, dia: ev.target.value })} className={ENTRADA} /></Campo>
        <Campo rotulo="Hora *">
          <select value={ret.hora} onChange={(ev) => setRet({ ...ret, hora: ev.target.value })} className={ENTRADA}>
            <option value="">Escolha a hora</option>
            {Array.from({ length: 20 }).map((_, i) => { const m = 8 * 60 + i * 30, h = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); return <option key={h} value={h}>{h}</option>; })}
          </select>
        </Campo>
        {!entregaOk && <p className="text-[13px]">Escolha o dia e a hora para continuar.</p>}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" onClick={() => setPasso(1)} className={VOLTAR}>Voltar</button>
          <button type="button" disabled={!entregaOk} onClick={() => setPasso(3)} className={BTN}>Continuar</button>
        </div>
      </section>
    </Tela>
  );

  // ---------- PASSO 2: entrega (só reposição) ----------
  if (rep && passo === 2) return (
    <Tela passo={2} total={3} etapa="Entrega">
      <section className="flex flex-col gap-3 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3 sm:p-4">
        <h2 className="text-[15px] font-bold">Onde e quando entregar?</h2>
        <p className="text-[13px] leading-snug">Informe o endereço e os melhores horários para o entregador te encontrar.</p>
        <Campo rotulo="Rua e número *"><input type="text" autoComplete="street-address" value={ent.rua} maxLength={120} onChange={(ev) => setEnt({ ...ent, rua: ev.target.value })} placeholder="Ex.: Rua das Flores, 123" className={ENTRADA} /></Campo>
        <div className="grid grid-cols-2 gap-2">
          <Campo rotulo="Bairro"><input type="text" value={ent.bairro} maxLength={80} onChange={(ev) => setEnt({ ...ent, bairro: ev.target.value })} className={ENTRADA} /></Campo>
          <Campo rotulo="Cidade *"><input type="text" value={ent.cidade} maxLength={80} onChange={(ev) => setEnt({ ...ent, cidade: ev.target.value })} className={ENTRADA} /></Campo>
        </div>
        <Campo rotulo="Complemento ou ponto de referência"><input type="text" value={ent.complemento} maxLength={120} onChange={(ev) => setEnt({ ...ent, complemento: ev.target.value })} placeholder="Ex.: apto 12, portão azul" className={ENTRADA} /></Campo>
        <div>
          <p className="mb-1 text-[13px] font-bold">Melhor horário para receber *</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Horário">
            {HORARIOS.map(([v, t, s]) => (
              <button key={v} type="button" role="radio" aria-checked={ent.horario === v} onClick={() => setEnt({ ...ent, horario: v })}
                className={"rounded-lg border px-1 py-2 text-center " + (ent.horario === v ? "border-transparent bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f]" : "border-[#E8B84B]/50 bg-black")}>
                <span className="block text-[14px] font-bold">{t}</span><span className="block text-[11px]">{s}</span>
              </button>
            ))}
          </div>
        </div>
        <Campo rotulo="Dias ou horários que não pode (opcional)"><input type="text" value={ent.horarioObs} maxLength={120} onChange={(ev) => setEnt({ ...ent, horarioObs: ev.target.value })} placeholder="Ex.: às quartas só depois das 15h" className={ENTRADA} /></Campo>
        {!entregaOk && <p className="text-[13px]">Preencha rua e número, cidade e o melhor horário para continuar.</p>}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" onClick={() => setPasso(1)} className={VOLTAR}>Voltar</button>
          <button type="button" disabled={!entregaOk} onClick={() => setPasso(3)} className={BTN}>Continuar</button>
        </div>
      </section>
    </Tela>
  );

  // ---------- PASSO FINAL: as peças ----------
  return (
    <Tela passo={total} total={total} etapa="Peças">
      <section className="rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3 sm:p-4">
        <h2 className="text-[15px] font-bold">Quais peças você quer?</h2>
        <p className="mt-1 text-[13px] leading-snug">Coloque a foto de cada peça, ou descreva a peça. Em cada uma, toque em <b>dourado</b>, <b>prata</b> ou <b>os dois</b>. Cada pedido tem no <b>máximo {MAX} peças</b> ({itens.length} de {MAX}).</p>
      </section>

      <div className="flex flex-col gap-3">
        {itens.map((i, n) => {
          const pronta = !!i.cor && (i.texto ? !!i.obs.trim() : !!i.key && !i.erro && !i.subindo);
          const rotuloCor = (CORES.find(([v]) => v === i.cor) || ["", ""])[1];
          // peça já confirmada com OK: linha curta (foto pequena, cor, descrição), com Editar e ×
          if (i.ok) {
            return (
              <section key={i.id} className="flex items-center gap-3 rounded-xl border border-[#E8B84B] bg-[#E8B84B]/[.14] p-2.5">
                {i.texto ? <span className="grid size-14 shrink-0 place-items-center rounded-lg border border-[#E8B84B]/50 bg-black text-[20px]" aria-hidden>✎</span> : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={i.url} alt={"Foto " + (n + 1)} className="size-14 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">Peça {n + 1} · {rotuloCor} ✓</p>
                  <p className="break-words text-[13px] leading-snug">{i.obs.trim() || "Sem descrição"}</p>
                </div>
                <button type="button" onClick={() => mudar(i.id, { ok: false })} className="h-9 shrink-0 rounded-lg border border-[#E8B84B]/60 bg-black px-3 text-[13px] font-bold">Editar</button>
                <button type="button" aria-label="Tirar esta peça" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))} className="grid size-9 shrink-0 place-items-center rounded-lg text-[16px] font-bold">×</button>
              </section>
            );
          }
          // peça aberta: fundo claro, foto menor, cor, descrição e o OK
          return (
            <section key={i.id} className="overflow-hidden rounded-xl border-2 border-[#E8B84B]/70 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)]">
              <div className="flex items-center justify-between bg-black/40 px-3 py-1.5">
                <span className="text-[13px] font-bold">{i.texto ? "Peça " + (n + 1) + " · só descrição" : "Peça " + (n + 1) + " · foto"}</span>
                <button type="button" aria-label="Tirar esta peça" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))} className="grid size-9 place-items-center rounded text-[16px] font-bold">×</button>
              </div>
              {!i.texto && (
                <div className="bg-black p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.url} alt={"Foto " + (n + 1)} className="mx-auto block max-h-[200px] w-auto max-w-full rounded-lg object-contain" />
                </div>
              )}
              <div className="flex flex-col gap-2 p-3">
                {i.subindo && <p className="text-[13px]">Enviando a foto</p>}
                {i.erro && <p className="text-[13px] font-bold text-[#fecaca]">{i.erro} Tire a foto e coloque de novo.</p>}
                <p className="text-[13px] font-bold">Qual cor?</p>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cor">
                  {CORES.map(([v, t]) => (
                    <button key={v} type="button" role="radio" aria-checked={i.cor === v} onClick={() => mudar(i.id, { cor: v })}
                      className={"h-10 rounded-lg border text-[14px] font-bold " + (i.cor === v ? "border-transparent bg-gradient-to-br from-[#F5E7BE] via-[#E8B84B] to-[#B8892A] text-[#14233f]" : "border-[#E8B84B]/50 bg-black")}>{t}</button>
                  ))}
                </div>
                <textarea value={i.obs} maxLength={160} rows={2} onChange={(ev) => mudar(i.id, { obs: ev.target.value })}
                  placeholder={i.texto ? "Descreva a peça. Ex.: cordão baiano de prata mais grosso" : "Descreva o que você quer (opcional). Ex.: mais largo, tamanho 18, 2 unidades"}
                  className="w-full rounded-lg border border-[#E8B84B]/40 bg-black/70 px-3 py-2 text-[16px] leading-snug placeholder:text-white/60" />
                <button type="button" disabled={!pronta} onClick={() => mudar(i.id, { ok: true })} className={BTN}>OK, peça pronta</button>
                {!pronta && <p className="text-center text-[12px]">{i.texto && !i.obs.trim() ? "Descreva a peça e escolha a cor para dar o OK." : "Escolha a cor para dar o OK."}</p>}
              </div>
            </section>
          );
        })}
      </div>

      {/* nenhuma peça aberta: nova peça ou fechar a solicitação */}
      {!itens.some((i) => !i.ok) && itens.length < MAX && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex h-14 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#E8B84B]/70 bg-[#E8B84B]/10 px-2 text-center text-[14px] font-bold text-[#F5E7BE]">
            + {itens.length ? "Nova peça (foto)" : "Adicionar fotos"}
            <input ref={campo} type="file" accept="image/*" multiple className="hidden" onChange={(ev) => adicionar(ev.target.files)} />
          </label>
          <button type="button" onClick={semFoto} className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-[#E8B84B]/60 bg-black px-2 text-center text-[14px] font-bold">+ Nova peça sem foto</button>
        </div>
      )}

      {itens.length > 0 && !itens.some((i) => !i.ok) && (
        <section className="flex flex-col gap-3 rounded-xl border border-[#E8B84B]/55 bg-black bg-[linear-gradient(to_top,rgba(232,184,75,.32),rgba(0,0,0,0)_78%)] p-3">
          <textarea value={obs} maxLength={300} rows={2} onChange={(ev) => setObs(ev.target.value)} placeholder="Algo mais que a gente precisa saber? (opcional)" className="w-full rounded-lg border border-[#E8B84B]/40 bg-black/70 px-3 py-2 text-[16px] placeholder:text-white/60" />
          {erro && <p className="text-[14px] font-bold text-[#fecaca]">{erro}</p>}
          {falta && <p className="text-[13px]">{falta}</p>}
          <button type="button" disabled={!!falta || enviando} onClick={enviar} className={BTN}>{enviando ? "Enviando" : "Fechar solicitação"}</button>
        </section>
      )}
      {itens.some((i) => !i.ok) && <p className="text-center text-[13px]">Dê o OK na peça aberta para continuar.</p>}
      {!itens.length && <button type="button" onClick={() => setPasso(rep ? 2 : 1)} className={VOLTAR}>Voltar</button>}
    </Tela>
  );
}

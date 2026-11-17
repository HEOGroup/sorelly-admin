"use client";
// Formulário do pedido por link (Marcus, 17/11/2026). Feito para o celular e em PASSOS: só anda para a frente quando a revendedora aceita as condições e preenche o que é pedido.
//   Passo 1 · Condições: escolhe reposição ou encomenda, lê as regras (taxa, prazo, outro estado) e marca que aceita.
//   Passo 2 · Entrega (só reposição): endereço e horário para receber.
//   Passo 3 · Peças: fotos e/ou descrições (dourado, prata ou os dois) e enviar.
// A foto é reduzida no próprio aparelho (JPEG até 1600 px) e sobe uma por vez; o pedido só é enviado quando ela toca em "Enviar pedido".
import { useEffect, useRef, useState } from "react";

const CORES = [["dourado", "Dourado"], ["prata", "Prata"], ["os dois", "Os dois"]];
const HORARIOS = [["manhã (8h às 12h)", "Manhã", "8h às 12h"], ["tarde (13h às 18h)", "Tarde", "13h às 18h"], ["qualquer horário", "Qualquer", "no horário comercial"]];
const MAX = 12;
const reais = (n) => "R$ " + Number(n || 0).toFixed(2).replace(".", ",");
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
  const r = await fetch(caminho, { method: metodo, headers: { "content-type": "application/json" }, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.erro || "Algo deu errado. Tente de novo."), { status: r.status });
  return j;
}

const Tela = ({ passo, total, children }) => (
  <main className="min-h-screen px-4 py-6 text-white" style={{ background: "linear-gradient(180deg,#1d2c4d 0%,#0f1117 45%)" }}>
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <header className="text-center">
        <p className="text-[13px] font-bold tracking-[.2em] text-[#E8B84B]">SORELLY JOIAS</p>
        <p className="text-[13px]">Reposições e Encomendas{passo ? " · passo " + passo + " de " + total : ""}</p>
        {passo ? <div className="mx-auto mt-2 flex w-40 gap-1" aria-hidden>{Array.from({ length: total }).map((_, i) => <span key={i} className={"h-1 flex-1 rounded-full " + (i < passo ? "bg-[#E8B84B]" : "bg-white/25")} />)}</div> : null}
      </header>
      {children}
    </div>
  </main>
);
const Aviso = ({ titulo, texto }) => (
  <section className="rounded-xl border border-white/25 bg-black/30 p-5 text-center">
    <h1 className="text-[16px] font-bold">{titulo}</h1>
    <p className="mt-2 text-[13px] leading-snug">{texto}</p>
  </section>
);
const Regra = ({ icone, titulo, children, lido, aoMarcar }) => (
  <div className={"rounded-lg border p-3 " + (lido ? "border-[#4ade80]/60 bg-[#4ade80]/[.07]" : "border-white/15 bg-white/[.04]")}>
    <div className="flex gap-3">
      <span className="mt-0.5 text-[16px] leading-none" aria-hidden>{icone}</span>
      <div><p className="text-[14px] font-bold">{titulo}</p><p className="mt-0.5 text-[13px] leading-snug">{children}</p></div>
    </div>
    <label className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-md bg-black/25 px-2.5 py-2 text-[13px] font-bold">
      <input type="checkbox" checked={!!lido} onChange={(ev) => aoMarcar(ev.target.checked)} className="size-5 shrink-0" />
      <span>{lido ? "OK, li e entendi" : "Li e entendi"}</span>
    </label>
  </div>
);
const Campo = ({ rotulo, children }) => (<label className="flex flex-col gap-1"><span className="text-[13px] font-bold">{rotulo}</span>{children}</label>);
const ENTRADA = "h-11 w-full rounded-lg border border-white/30 bg-black/40 px-3 text-[16px] placeholder:text-white/50";
const BTN = "h-12 rounded-xl bg-[#E8B84B] text-[16px] font-bold text-[#14233f] disabled:opacity-40";
const VOLTAR = "h-12 rounded-xl border border-white/30 bg-white/5 text-[15px] font-bold";

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
  if (info.estado === "enviado") return <Tela><Aviso titulo="Este pedido já foi enviado" texto="A equipe já recebeu. Se precisar pedir de novo, peça um novo link ao setor." /></Tela>;
  if (info.estado === "expirado") return <Tela><Aviso titulo="Este link expirou" texto="O link vale por 48 horas. Peça um novo link ao setor de Reposições e Encomendas." /></Tela>;

  // ---------- PASSO 1: condições (cada uma pede o OK da revendedora) ----------
  const NAO_GARANTE = { id: "naogarante", icone: "🤝", titulo: "As peças pedidas não são garantidas", texto: <>Somos <b>só 3 funcionárias</b> no setor e a procura é <b>muito grande</b>, então tenha <b>paciência</b>. Peças <b>100% iguais</b> à foto são <b>muito difíceis de achar</b>, mas nós vamos tentar o máximo para te atender.</> };
  const regras = empresa ? [
    { id: "repo", icone: "🏢", titulo: "Reposição: você retira na empresa", texto: <>Você vem até a nossa empresa, <b>com horário marcado</b>, e escolhe as peças. Você tem até <b>30 minutos</b> para escolher. <b>Todas as reposições são pagas.</b></> },
    { id: "semtaxa", icone: "💰", titulo: "Sem taxa de entrega", texto: <>Como você mesma retira, <b>não paga a taxa do entregador</b>. Só vale com o <b>horário confirmado</b> pela equipe.</> },
    { id: "quinze", icone: "🗓️", titulo: "Pediu 15 dias antes do seu acerto?", texto: <>O pedido fica como <b>encomenda para o próximo kit</b>, e aí <b>não tem taxa</b>. Se preferir, escolha encomenda acima.</> },
    NAO_GARANTE,
  ] : rep ? [
    { id: "repo", icone: "🛵", titulo: "Reposição: no meio do seu kit", texto: <>Você pede, nós separamos e entregamos no seu endereço. <b>Todas as reposições são pagas.</b></> },
    { id: "taxa", icone: "💰", titulo: "Taxa de " + reais(info.taxa || 15) + " (entrega)", texto: <>É o valor do <b>rapaz da entrega</b>, que sai só para o nosso setor. Ela é paga por <b>Pix no dia em que o seu pedido for fechado</b>, quando as peças estiverem separadas. Assim o pedido <b>sai no dia seguinte ou no outro</b>. Sem o Pix, o pedido não sai.</> },
    { id: "quinze", icone: "🗓️", titulo: "Pediu 15 dias antes do seu acerto?", texto: <>O pedido fica como <b>encomenda para o próximo kit</b>, e aí <b>não tem taxa</b>. Se preferir, escolha encomenda acima.</> },
    NAO_GARANTE,
  ] : [
    { id: "enc", icone: "📦", titulo: "Encomenda: para o seu próximo kit", texto: <>As peças vão junto com o seu próximo kit e <b>não tem taxa de entrega</b>. A equipe avisa por mensagem escrita quando estiver tudo certo.</> },
    { id: "quando", icone: "🗓️", titulo: "Quando é encomenda?", texto: <>Quando o pedido é feito <b>15 dias ou mais antes do seu acerto</b>, ou quando você <b>mora em outro estado</b>.</> },
    NAO_GARANTE,
  ];
  const todosLidos = regras.every((r) => lidos[r.id]);

  if (passo === 1) return (
    <Tela passo={1} total={total}>
      <section className="rounded-xl border border-white/25 bg-black/30 p-4">
        <h1 className="text-[16px] font-bold">Oi, {info.primeiroNome}! 💛</h1>
        <p className="mt-2 text-[13px] leading-snug">Este setor foi criado <b>para ajudar você, revendedora</b>: para você nunca ficar sem a peça que a sua cliente quer, na hora em que ela quer comprar. Peça por aqui que a gente separa para você.</p>
      </section>

      <section className="rounded-xl border border-white/25 bg-black/30 p-3">
        {info.forcaEncomenda ? (
          <p className="text-[13px] leading-snug"><b>Seu pedido é uma encomenda</b> para o próximo kit (sem taxa), porque você é de outro estado.</p>
        ) : (
          <>
            <p className="mb-2 text-[13px] font-bold">O que você quer pedir?</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(" + (info.podeEmpresa ? 3 : 2) + ", minmax(0, 1fr))" }} role="radiogroup" aria-label="Tipo do pedido">
              {[["reposicao", "entrega", "Reposição", "entrega · taxa " + reais(info.taxa || 15)], ...(info.podeEmpresa ? [["reposicao", "empresa", "Reposição", "eu retiro na empresa · sem taxa"]] : []), ["encomenda", "entrega", "Encomenda", "próximo kit · sem taxa"]].map(([v, fm, t, sub]) => {
                const on = tipo === v && (v === "encomenda" || forma === fm);
                return (
                  <button key={v + fm} type="button" role="radio" aria-checked={on} onClick={() => { setTipo(v); setForma(fm); setLidos({}); }}
                    className={"rounded-lg border px-2 py-2 text-center " + (on ? "border-[#E8B84B] bg-[#E8B84B] text-[#14233f]" : "border-white/30 bg-white/5")}>
                    <span className="block text-[15px] font-bold">{t}</span><span className="block text-[12px]">{sub}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <div className="flex flex-col gap-2.5">
        {regras.map((r) => <Regra key={r.id} icone={r.icone} titulo={r.titulo} lido={!!lidos[r.id]} aoMarcar={(v) => setLidos({ ...lidos, [r.id]: v })}>{r.texto}</Regra>)}
      </div>

      <section className="flex flex-col gap-2 rounded-xl border border-[#E8B84B]/50 bg-[#E8B84B]/10 p-3">
        <button type="button" disabled={!todosLidos} onClick={() => setPasso(2)} className={BTN}>Aceito as condições e continuo</button>
        {!todosLidos && <p className="text-center text-[12px]">Dê o OK em cada item acima ({regras.filter((r) => lidos[r.id]).length} de {regras.length}) para continuar.</p>}
        <p className="text-center text-[12px]">Este link é só seu e vale até <b>{quando(info.expiraEm)}</b>.</p>
      </section>
    </Tela>
  );

  // ---------- PASSO 2 (retirada na empresa): dia e hora ----------
  if (empresa && passo === 2) return (
    <Tela passo={2} total={3}>
      <section className="flex flex-col gap-3 rounded-xl border border-white/25 bg-black/30 p-4">
        <h1 className="text-[15px] font-bold">Quando você vem retirar?</h1>
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
    <Tela passo={2} total={3}>
      <section className="flex flex-col gap-3 rounded-xl border border-white/25 bg-black/30 p-4">
        <h1 className="text-[15px] font-bold">Onde e quando entregar?</h1>
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
                className={"rounded-lg border px-1 py-2 text-center " + (ent.horario === v ? "border-[#E8B84B] bg-[#E8B84B] text-[#14233f]" : "border-white/30 bg-white/5")}>
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
    <Tela passo={total} total={total}>
      <section className="rounded-xl border border-white/25 bg-black/30 p-4">
        <h1 className="text-[15px] font-bold">Quais peças você quer?</h1>
        <p className="mt-1 text-[13px] leading-snug">Coloque a foto de cada peça, ou descreva a peça. Em cada uma, toque em <b>dourado</b>, <b>prata</b> ou <b>os dois</b>.</p>
      </section>

      <div className="flex flex-col gap-3">
        {itens.map((i, n) => (
          <section key={i.id} className="overflow-hidden rounded-xl border border-white/25 bg-black/30">
            {i.texto ? (
              <div className="flex items-center justify-between bg-white/[.07] px-3 py-2">
                <span className="text-[13px] font-bold">Peça {n + 1} (só descrição)</span>
                <button type="button" aria-label="Tirar esta peça" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))} className="grid size-9 place-items-center rounded text-[16px] font-bold">×</button>
              </div>
            ) : (
              <div className="relative bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.url} alt={"Foto " + (n + 1)} className="mx-auto block max-h-[320px] w-auto max-w-full object-contain" />
                <span className="absolute left-2 top-2 rounded bg-black/75 px-1.5 py-0.5 text-[12px] font-bold">Foto {n + 1}</span>
                <button type="button" aria-label="Tirar esta foto" onClick={() => setItens((l) => l.filter((x) => x.id !== i.id))} className="absolute right-2 top-2 grid size-9 place-items-center rounded bg-black/80 text-[16px] font-bold">×</button>
              </div>
            )}
            <div className="flex flex-col gap-2 p-3">
              {i.subindo && <p className="text-[13px]">Enviando a foto</p>}
              {i.erro && <p className="text-[13px] font-bold text-[#fecaca]">{i.erro} Tire a foto e coloque de novo.</p>}
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Cor">
                {CORES.map(([v, t]) => (
                  <button key={v} type="button" role="radio" aria-checked={i.cor === v} onClick={() => mudar(i.id, { cor: v })}
                    className={"h-11 rounded-lg border text-[14px] font-bold " + (i.cor === v ? "border-[#E8B84B] bg-[#E8B84B] text-[#14233f]" : "border-white/30 bg-white/5")}>{t}</button>
                ))}
              </div>
              <textarea value={i.obs} maxLength={160} rows={2} onChange={(ev) => mudar(i.id, { obs: ev.target.value })}
                placeholder={i.texto ? "Descreva a peça. Ex.: cordão baiano de prata mais grosso" : "Descreva o que você quer (opcional). Ex.: mais largo, tamanho 18, 2 unidades"}
                className="w-full rounded-lg border border-white/30 bg-black/40 px-3 py-2 text-[16px] leading-snug placeholder:text-white/50" />
            </div>
          </section>
        ))}
      </div>

      {itens.length < MAX && (
        <div className="grid grid-cols-2 gap-2">
          <label className="flex h-14 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#E8B84B]/70 bg-[#E8B84B]/10 px-2 text-center text-[14px] font-bold text-[#F5E7BE]">
            + {itens.some((i) => !i.texto) ? "Outra foto" : "Adicionar fotos"}
            <input ref={campo} type="file" accept="image/*" multiple className="hidden" onChange={(ev) => adicionar(ev.target.files)} />
          </label>
          <button type="button" onClick={semFoto} className="flex h-14 items-center justify-center rounded-xl border-2 border-dashed border-white/40 bg-white/5 px-2 text-center text-[14px] font-bold">+ Descrever peça sem foto</button>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-white/25 bg-black/30 p-3">
        <textarea value={obs} maxLength={300} rows={2} onChange={(ev) => setObs(ev.target.value)} placeholder="Algo mais que a gente precisa saber? (opcional)" className="w-full rounded-lg border border-white/30 bg-black/40 px-3 py-2 text-[16px] placeholder:text-white/50" />
        {erro && <p className="text-[14px] font-bold text-[#fecaca]">{erro}</p>}
        {falta && <p className="text-[13px]">{falta}</p>}
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <button type="button" onClick={() => setPasso(rep ? 2 : 1)} className={VOLTAR}>Voltar</button>
          <button type="button" disabled={!!falta || enviando} onClick={enviar} className={BTN}>{enviando ? "Enviando" : "Enviar pedido"}</button>
        </div>
      </section>
    </Tela>
  );
}

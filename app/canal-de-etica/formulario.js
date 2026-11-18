"use client";
// Canal de Ética e Denúncias (17/11/2026, Maria (RH) e Marcus): formulário a partir do protótipo aprovado (canal_denuncias_sorelly.html), agora enviando de verdade.
// Anônimo por padrão: a identificação é opcional. A denúncia vai para o Admin (RH › Canal de denúncias), com acesso restrito aos sócios e à Maria. Não guarda IP nem aparelho.
import { useState } from "react";

const CATEGORIAS = ["Assédio moral", "Assédio sexual", "Discriminação ou preconceito", "Abuso de autoridade", "Agressão verbal ou física", "Constrangimento ou humilhação", "Sobrecarga ou pressão excessiva", "Condições inadequadas de trabalho", "Conduta antiética", "Outros"];
const SETORES = ["Atendimento", "Montagem de kits", "Produção", "Estoque", "Agendamento", "Pós-venda", "Inadimplência", "Financeiro", "Marketing", "Jurídico", "RH", "Direção", "Outros", "Prefiro não informar"];
const RELACOES = ["Aconteceu comigo", "Presenciei a situação", "Tenho conhecimento da situação", "Prefiro não informar"];
const FREQUENCIAS = ["Uma única vez", "Algumas vezes", "Frequentemente", "Continua acontecendo", "Não sei informar"];
const EVIDENCIAS = ["Sim", "Não", "Prefiro não informar"];
const RISCOS = ["Sim", "Não", "Não sei informar"];
const DIRECAO = ["Sim", "Não", "Prefiro não informar"];
const IDENT = ["Não, desejo permanecer anônimo(a)", "Sim, autorizo o contato da equipe responsável"];

const CSS = `
.ce{--bg:#f6efe6;--soft:#eddccd;--ink:#6b4a2b;--dark:#3a2a1b;--gold:#b49756;--line:#d8b87e;--btn:#d6c19a;--white:#fffcf8;position:fixed;inset:0;overflow:auto;background:var(--bg);color:var(--dark);font:15px/1.6 'Segoe UI',Arial,sans-serif}
.ce *{box-sizing:border-box}
.ce header{padding:30px 20px 32px;background:var(--dark);color:var(--bg);text-align:center;border-bottom:4px solid var(--gold)}
.ce .brand{font:40px Georgia,serif;letter-spacing:.24em;margin-left:.24em}
.ce .tag{font-size:10px;letter-spacing:.23em;color:var(--btn);text-transform:uppercase;margin-top:7px}
.ce main{max-width:760px;padding:28px 18px 45px;margin:auto}
.ce article{background:var(--white);border:1px solid #e3d3bd;border-radius:16px;overflow:hidden;box-shadow:0 12px 35px #6b4a2b0b}
.ce .intro{padding:32px 32px 25px;background:linear-gradient(130deg,#fffaf3,#f6efe6);border-bottom:1px solid #e3d3bd}
.ce .eyebrow{color:var(--ink);font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:700}
.ce h1{font:normal clamp(30px,5vw,42px)/1.12 Georgia,serif;color:var(--ink);margin:10px 0 15px}
.ce p{margin:9px 0}
.ce .features{display:flex;gap:8px;flex-wrap:wrap;margin-top:20px}
.ce .features span{font-size:12px;border:1px solid var(--line);padding:5px 10px;border-radius:30px;color:var(--ink);background:#fffaf3}
.ce .form{padding:8px 32px 30px}
.ce fieldset{border:0;border-bottom:1px solid #eadfce;padding:22px 0;margin:0;min-width:0}
.ce legend{float:left;width:100%;font-size:15px;font-weight:650;color:var(--ink);margin:0 0 10px;padding:0}
.ce legend+*{clear:both}
.ce .num{color:var(--gold);font-variant-numeric:tabular-nums;margin-right:9px;font-size:12px}
.ce .required{color:#936326}
.ce .help{display:block;font-size:12px;color:#806b55;margin:3px 0 10px}
.ce .choice{display:flex;align-items:flex-start;gap:10px;padding:9px 11px;border:1px solid #e8ddce;border-radius:8px;margin:6px 0;cursor:pointer;background:#fffdf9}
.ce .choice:hover,.ce .choice.on{border-color:var(--gold);background:var(--bg)}
.ce input[type=radio]{accent-color:var(--ink);width:17px;height:17px;flex:none;margin:3px 0 0}
.ce input[type=text],.ce textarea,.ce select{font:inherit;color:var(--dark);width:100%;padding:12px 13px;border-radius:8px;border:1px solid #d9c9ae;background:#fffdf9}
.ce textarea{resize:vertical;min-height:90px}
.ce input:focus,.ce textarea:focus,.ce select:focus,.ce button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.ce button{font:inherit;font-weight:700;border:0;border-radius:8px;padding:13px 20px;cursor:pointer;color:var(--dark);background:var(--btn)}
.ce button:hover{background:#cdb380}
.ce button:disabled{opacity:.6;cursor:default}
.ce .actions{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:22px}
.ce .actions button{min-width:190px}
.ce .quiet{font-size:12px;color:#806b55}
.ce footer{text-align:center;color:#806b55;font-size:12px;margin-top:20px}
.ce .success{padding:45px 30px;text-align:center}
.ce .success h2{font:normal 32px Georgia,serif;color:var(--ink)}
.ce .success .mark{width:55px;height:55px;display:grid;place-items:center;border-radius:50%;background:var(--soft);color:var(--ink);margin:auto;font-size:28px}
.ce .protocolo{display:inline-block;margin:10px 0;padding:10px 18px;border:1px solid var(--line);border-radius:8px;background:#fffaf3;font:700 22px/1.2 Consolas,monospace;letter-spacing:.12em;color:var(--ink)}
.ce .warning{color:#87561f;border:1px solid var(--line);background:#fff5e6;border-radius:8px;padding:12px;font-size:13px;margin-top:10px}
.ce .erro{color:#8a2a1b;border:1px solid #d9a99f;background:#fdeeea;border-radius:8px;padding:12px;font-size:13px;margin-top:14px}
@media print{.ce{position:static;overflow:visible;background:#fff}.ce header{background:#fff;color:var(--ink)}.ce main{padding:0;max-width:none}.ce article{box-shadow:none}.ce fieldset{break-inside:avoid}.ce .actions,.ce button{display:none}}
@media(max-width:520px){.ce .intro{padding:25px 20px}.ce .form{padding:5px 20px 24px}.ce .brand{font-size:32px}.ce .actions{flex-direction:column;align-items:stretch}.ce .actions button{width:100%}}
`;

const VAZIO = { categoria: "", setor: "", relacao: "", frequencia: "", periodo: "", envolvidos: "", relato: "", testemunhas: "", evidencia: "", risco: "", envolveDirecao: "", identificacao: IDENT[0], contato: "", site: "" };

function Opcoes({ nome, itens, valor, aoMudar, obrigatorio }) {
  return itens.map((item) => (
    <label key={item} className={"choice" + (valor === item ? " on" : "")}>
      <input type="radio" name={nome} value={item} checked={valor === item} required={!!obrigatorio} onChange={() => aoMudar(nome, item)} />
      {item}
    </label>
  ));
}

function Consulta() {
  const [codigo, setCodigo] = useState("");
  const [r, setR] = useState(null);
  const [falha, setFalha] = useState("");
  const [busy, setBusy] = useState(false);
  const dia = (iso) => { try { return new Date(iso).toLocaleDateString("pt-BR"); } catch (x) { return ""; } };
  async function consultar(ev) {
    ev.preventDefault();
    if (busy || !codigo.trim()) return;
    setBusy(true); setFalha(""); setR(null);
    try {
      const x = await fetch("/api/denuncias/consulta", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ protocolo: codigo }) });
      const j = await x.json().catch(() => ({}));
      if (!x.ok) throw new Error(j.erro || "Não foi possível consultar agora.");
      setR(j);
    } catch (e) { setFalha(e.message || "Não foi possível consultar agora."); }
    setBusy(false);
  }
  return (
    <article style={{ marginTop: 20 }}>
      <form className="form" autoComplete="off" onSubmit={consultar} style={{ paddingTop: 24 }}>
        <div className="eyebrow">Já enviou uma denúncia?</div>
        <p style={{ margin: "6px 0 12px" }}>Digite o código que você recebeu para ver o andamento e a resposta do RH. A consulta não pede nome nem outro dado.</p>
        <input type="text" value={codigo} maxLength={20} aria-label="Código da denúncia" placeholder="DEN-XXXXXXXX" onChange={(e) => setCodigo(e.target.value)} />
        <div className="actions"><span className="quiet">Só o código, nada mais.</span><button type="submit" disabled={busy}>{busy ? "Consultando..." : "Consultar andamento"}</button></div>
        {falha && <div className="erro" role="alert">{falha}</div>}
        {r && (
          <div className="warning" style={{ background: "#fffaf3" }} aria-live="polite">
            <strong>Situação: {r.situacao}</strong> · recebida em {dia(r.recebida_em)}
            <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{r.resposta ? <><strong>Resposta do RH{r.respondida_em ? " (" + dia(r.respondida_em) + ")" : ""}:</strong><br />{r.resposta}</> : "Ainda não há resposta. Volte a consultar mais tarde."}</div>
          </div>
        )}
      </form>
    </article>
  );
}

export default function Formulario() {
  const [v, setV] = useState(VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState("");
  const [protocolo, setProtocolo] = useState("");
  const muda = (campo, valor) => setV((x) => ({ ...x, [campo]: valor }));
  const identificada = v.identificacao.startsWith("Sim");

  async function enviar(ev) {
    ev.preventDefault();
    if (enviando) return;
    setEnviando(true); setFalha("");
    try {
      const r = await fetch("/api/denuncias", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(v) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível enviar agora. Tente de novo.");
      setProtocolo(j.protocolo || ""); setV(VAZIO);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } catch (e) { setFalha(e.message || "Não foi possível enviar agora. Tente de novo."); }
    setEnviando(false);
  }

  return (
    <div className="ce">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header><div className="brand">SORELLY</div><div className="tag">Ética &nbsp;·&nbsp; Respeito &nbsp;·&nbsp; Segurança</div></header>
      <main>
        <article>
          <div className="intro">
            <div className="eyebrow">Recursos Humanos · Prevenção de riscos psicossociais</div>
            <h1>Canal de Ética e Denúncias</h1>
            <p>Este espaço foi criado para promover um ambiente de trabalho seguro, ético e respeitoso. Utilize o canal para relatar situações de assédio, discriminação, violência ou outras condutas inadequadas.</p>
            <p>Sua identificação é opcional. Os relatos são lidos somente pelos sócios e pelo RH, com acesso restrito, e este formulário não guarda o seu nome, o seu endereço de internet nem o seu aparelho.</p>
            <div className="features"><span>🔒 Confidencialidade</span><span>◉ Identificação opcional</span><span>✓ Respeito e proteção</span></div>
          </div>

          {protocolo ? (
            <section className="success" aria-live="polite">
              <div className="mark">✓</div>
              <h2>Denúncia enviada</h2>
              <p>Recebemos o seu relato. Ele será lido somente pelos sócios e pelo RH.</p>
              <div className="protocolo">{protocolo}</div>
              <p className="quiet">Guarde este código. Ele é o único registro que você recebe, e não identifica você.</p>
              <button type="button" onClick={() => setProtocolo("")}>Enviar outro relato</button>
            </section>
          ) : (
            <form className="form" autoComplete="off" onSubmit={enviar}>
              <fieldset><legend><span className="num">01</span>Qual o motivo da sua denúncia? <span className="required">*</span></legend><Opcoes nome="categoria" itens={CATEGORIAS} valor={v.categoria} aoMudar={muda} obrigatorio /></fieldset>
              <fieldset><legend><span className="num">02</span>Em qual setor ocorreu a situação?</legend>
                <select value={v.setor} aria-label="Setor" onChange={(e) => muda("setor", e.target.value)}><option value="">Selecione o setor (opcional)</option>{SETORES.map((s) => <option key={s}>{s}</option>)}</select></fieldset>
              <fieldset><legend><span className="num">03</span>Qual a sua relação com o ocorrido?</legend><Opcoes nome="relacao" itens={RELACOES} valor={v.relacao} aoMudar={muda} /></fieldset>
              <fieldset><legend><span className="num">04</span>A situação ocorreu com qual frequência?</legend><Opcoes nome="frequencia" itens={FREQUENCIAS} valor={v.frequencia} aoMudar={muda} /></fieldset>
              <fieldset><legend><span className="num">05</span>Quando ocorreu a situação?</legend><input type="text" value={v.periodo} aria-label="Data ou período" maxLength={200} placeholder="Data ou período aproximado (opcional)" onChange={(e) => muda("periodo", e.target.value)} /></fieldset>
              <fieldset><legend><span className="num">06</span>Quem são as pessoas envolvidas?</legend><span className="help">Se possível, informe nomes, cargos ou funções.</span><textarea rows={2} value={v.envolvidos} maxLength={2000} aria-label="Pessoas envolvidas" placeholder="Resposta opcional" onChange={(e) => muda("envolvidos", e.target.value)} />
                <span className="help" style={{ marginTop: 14 }}>A situação envolve algum sócio ou a direção da empresa? Isso ajuda a encaminhar o seu relato para quem não tem conflito.</span>
                <Opcoes nome="envolveDirecao" itens={DIRECAO} valor={v.envolveDirecao} aoMudar={muda} /></fieldset>
              <fieldset><legend><span className="num">07</span>Descreva detalhadamente o ocorrido. <span className="required">*</span></legend><span className="help">Explique o que aconteceu, onde e em quais circunstâncias.</span><textarea required rows={5} minLength={10} maxLength={6000} value={v.relato} aria-label="Descrição do ocorrido" placeholder="Escreva seu relato aqui..." onChange={(e) => muda("relato", e.target.value)} /></fieldset>
              <fieldset><legend><span className="num">08</span>Existem testemunhas?</legend><textarea rows={2} value={v.testemunhas} maxLength={2000} aria-label="Testemunhas" placeholder="Resposta opcional" onChange={(e) => muda("testemunhas", e.target.value)} /></fieldset>
              <fieldset><legend><span className="num">09</span>Você possui algum tipo de evidência?</legend><Opcoes nome="evidencia" itens={EVIDENCIAS} valor={v.evidencia} aoMudar={muda} /><span className="help">Não é necessário apresentar provas para registrar uma denúncia. O RH combina com você a forma segura de enviar evidências, se você se identificar.</span></fieldset>
              <fieldset><legend><span className="num">10</span>Existe risco imediato à sua segurança ou à de outra pessoa?</legend><Opcoes nome="risco" itens={RISCOS} valor={v.risco} aoMudar={muda} />
                {v.risco === "Sim" && <div className="warning">Em caso de perigo imediato, procure um local seguro e acione os serviços de emergência (190 ou 192). Este canal não é monitorado em tempo real.</div>}</fieldset>
              <fieldset><legend><span className="num">11</span>Você deseja se identificar?</legend><Opcoes nome="identificacao" itens={IDENT} valor={v.identificacao} aoMudar={muda} />
                {identificada && <div style={{ marginTop: 16 }}><label htmlFor="ce-contato">Nome e contato (opcional)</label><input id="ce-contato" type="text" value={v.contato} maxLength={300} placeholder="Nome, telefone ou e-mail" onChange={(e) => muda("contato", e.target.value)} /><span className="help">Informe apenas se desejar receber contato da equipe responsável.</span></div>}</fieldset>
              <input type="text" name="site" value={v.site} onChange={(e) => muda("site", e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
              {falha && <div className="erro" role="alert">{falha}</div>}
              <div className="actions"><span className="quiet">* Campos obrigatórios</span><button type="submit" disabled={enviando}>{enviando ? "Enviando..." : "Enviar denúncia"}</button></div>
            </form>
          )}
        </article>
        <Consulta />
        <footer>Sorelly · Recursos Humanos<br />Canal de Ética e Denúncias · NR-1</footer>
      </main>
    </div>
  );
}

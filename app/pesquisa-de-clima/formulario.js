"use client";
// Pesquisa de clima (18/11/2026, plano da NR-1): 10 afirmações de 1 a 5, 2 perguntas abertas e o setor (opcional). Anônima: não pede nome e não guarda IP nem aparelho.
// Só abre quando há uma rodada aberta (RH › Pesquisa de clima). Mesmo visual do Canal de Ética.
import { useEffect, useState } from "react";

const ESCALA = [[1, "Discordo totalmente"], [2, "Discordo"], [3, "Neutro"], [4, "Concordo"], [5, "Concordo totalmente"]];

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
.ce .escala{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.ce .nota{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 4px;border:1px solid #e8ddce;border-radius:8px;cursor:pointer;background:#fffdf9;font-size:11px;text-align:center;line-height:1.25}
.ce .nota b{font-size:16px;color:var(--ink)}
.ce .nota:hover,.ce .nota.on{border-color:var(--gold);background:var(--bg)}
.ce input[type=radio]{accent-color:var(--ink);width:17px;height:17px;margin:0}
.ce select,.ce textarea{font:inherit;color:var(--dark);width:100%;padding:12px 13px;border-radius:8px;border:1px solid #d9c9ae;background:#fffdf9}
.ce textarea{resize:vertical;min-height:90px}
.ce select:focus,.ce textarea:focus,.ce button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
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
.ce .erro{color:#8a2a1b;border:1px solid #d9a99f;background:#fdeeea;border-radius:8px;padding:12px;font-size:13px;margin-top:14px}
@media(max-width:520px){.ce .intro{padding:25px 20px}.ce .form{padding:5px 14px 24px}.ce .brand{font-size:32px}.ce .actions{flex-direction:column;align-items:stretch}.ce .actions button{width:100%}.ce .nota{font-size:10px;padding:8px 2px}}
`;

export default function Formulario() {
  const [info, setInfo] = useState(null);
  const [notas, setNotas] = useState({});
  const [setor, setSetor] = useState("");
  const [bom, setBom] = useState("");
  const [melhorar, setMelhorar] = useState("");
  const [site, setSite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    fetch("/api/clima/publico").then((r) => r.json()).then(setInfo).catch(() => setInfo({ aberta: false, erro: true }));
  }, []);

  async function enviar(ev) {
    ev.preventDefault();
    if (enviando) return;
    setEnviando(true); setFalha("");
    try {
      const r = await fetch("/api/clima/publico", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ notas, setor, bom, melhorar, site }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.erro || "Não foi possível enviar agora. Tente de novo.");
      setEnviado(true);
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } catch (e) { setFalha(e.message || "Não foi possível enviar agora. Tente de novo."); }
    setEnviando(false);
  }

  const faltam = info && info.perguntas ? info.perguntas.filter((p) => !notas[p.k]).length : 0;

  return (
    <div className="ce">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header><div className="brand">SORELLY</div><div className="tag">Ética &nbsp;·&nbsp; Respeito &nbsp;·&nbsp; Segurança</div></header>
      <main>
        <article>
          <div className="intro">
            <div className="eyebrow">Recursos Humanos · Pesquisa de clima</div>
            <h1>Como é trabalhar na Sorelly?</h1>
            <p>Sua opinião ajuda a melhorar o ambiente de trabalho. Leva cerca de 3 minutos.</p>
            <p>A pesquisa é <strong>anônima</strong>: não pedimos o seu nome e não guardamos o seu endereço de internet nem o seu aparelho. O resultado é lido só em grupo.</p>
            <div className="features"><span>🔒 Anônima</span><span>◉ 10 afirmações de 1 a 5</span><span>✓ Sem resposta certa ou errada</span></div>
          </div>

          {!info ? (
            <section className="success"><p>Carregando…</p></section>
          ) : enviado ? (
            <section className="success" aria-live="polite">
              <div className="mark">✓</div>
              <h2>Obrigado!</h2>
              <p>Sua resposta foi registrada. Ela ajuda a Sorelly a melhorar.</p>
            </section>
          ) : !info.aberta ? (
            <section className="success"><h2>Pesquisa encerrada</h2><p>No momento não há pesquisa aberta. O RH avisa quando a próxima começar.</p></section>
          ) : (
            <form className="form" autoComplete="off" onSubmit={enviar}>
              {info.perguntas.map((p, i) => (
                <fieldset key={p.k}>
                  <legend><span className="num">{String(i + 1).padStart(2, "0")}</span>{p.t} <span className="required">*</span></legend>
                  <div className="escala" role="radiogroup" aria-label={p.t}>
                    {ESCALA.map(([n, rotulo]) => (
                      <label key={n} className={"nota" + (notas[p.k] === n ? " on" : "")}>
                        <input type="radio" name={p.k} value={n} checked={notas[p.k] === n} onChange={() => setNotas((x) => ({ ...x, [p.k]: n }))} />
                        <b>{n}</b>{rotulo}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <fieldset><legend><span className="num">11</span>Em qual setor você trabalha?</legend>
                <select value={setor} aria-label="Setor" onChange={(e) => setSetor(e.target.value)}><option value="">Prefiro não informar</option>{info.setores.map((s) => <option key={s}>{s}</option>)}</select></fieldset>
              <fieldset><legend><span className="num">12</span>O que funciona bem na Sorelly?</legend><textarea rows={3} maxLength={2000} value={bom} aria-label="O que funciona bem" placeholder="Resposta opcional" onChange={(e) => setBom(e.target.value)} /></fieldset>
              <fieldset><legend><span className="num">13</span>O que precisa melhorar?</legend><textarea rows={3} maxLength={2000} value={melhorar} aria-label="O que precisa melhorar" placeholder="Resposta opcional. Não escreva o seu nome nem o de outras pessoas." onChange={(e) => setMelhorar(e.target.value)} /></fieldset>
              <input type="text" name="site" value={site} onChange={(e) => setSite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
              {falha && <div className="erro" role="alert">{falha}</div>}
              <div className="actions"><span className="quiet">{faltam > 0 ? "Faltam " + faltam + " afirmações." : "* Todas as afirmações são obrigatórias"}</span><button type="submit" disabled={enviando || faltam > 0}>{enviando ? "Enviando..." : "Enviar respostas"}</button></div>
            </form>
          )}
        </article>
        <footer>Sorelly · Recursos Humanos<br />Pesquisa de clima · NR-1</footer>
      </main>
    </div>
  );
}

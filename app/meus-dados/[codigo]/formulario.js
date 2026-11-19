"use client";
// Formulário dos funcionários (18/11/2026, pedido do Marcus): cada funcionária abre o PRÓPRIO link (/meus-dados/<código>), sem login, e preenche os dados pessoais pelo celular.
// A resposta vai para o RH (Admin › RH › Colaboradores › Formulário dos funcionários), que confere e aplica no cadastro. Nada muda no cadastro sozinho.
// Não pergunta o que a pessoa não sabe (CBO, PIS/NIS, tipo de contrato, jornada, exame admissional): esses o RH preenche.
import { useEffect, useState } from "react";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const ESTADOS_CIVIS = ["Solteira(o)", "Casada(o)", "União estável", "Divorciada(o)", "Viúva(o)"];
const ESCOLARIDADES = ["Fundamental incompleto", "Fundamental completo", "Médio incompleto", "Médio completo", "Superior incompleto", "Superior completo", "Pós-graduação"];
const TIPOS_CONTA = ["Corrente", "Poupança", "Salário"];

// grupos do formulário: [título, ajuda, campos]; campo = [chave, rótulo, tipo ("text"|"tel"|"email"|"date"|"num"|"sel"), opções/placeholder]
const GRUPOS = [
  ["Contato", "", [["telefone", "Telefone com DDD", "tel"], ["email", "E-mail", "email"]]],
  ["Endereço", "", [["cep", "CEP (só números)", "num"], ["rua", "Rua", "text"], ["numero", "Número", "text"], ["complemento", "Complemento", "text"], ["bairro", "Bairro", "text"], ["cidade", "Cidade", "text"], ["uf", "Estado", "sel", UFS]]],
  ["Contato de emergência", "Alguém que podemos avisar se acontecer algo.", [["emergNome", "Nome", "text"], ["emergFone", "Telefone com DDD", "tel"], ["emergParentesco", "Parentesco (mãe, marido, amiga...)", "text"]]],
  ["Sobre você", "", [["nascimento", "Data de nascimento", "date"], ["estadoCivil", "Estado civil", "sel", ESTADOS_CIVIS], ["escolaridade", "Escolaridade", "sel", ESCOLARIDADES], ["nomeMae", "Nome da mãe", "text"], ["naturalidade", "Cidade onde nasceu", "text"], ["dependentes", "Quantos dependentes (filhos)?", "num"]]],
  ["Documentos", "Preencha só o que você tiver à mão. Pode deixar em branco o que não souber.", [["cpf", "CPF (só números)", "num"], ["rg", "RG", "text"], ["rgOrgao", "Órgão que emitiu o RG", "text"], ["ctpsNumero", "Carteira de trabalho (número)", "text"], ["ctpsSerie", "Carteira de trabalho (série)", "text"], ["tituloEleitor", "Título de eleitor", "text"], ["cnh", "CNH (se tiver)", "text"], ["cnhCategoria", "Categoria da CNH", "text"]]],
  ["Dados para receber", "Conta onde você recebe o salário.", [["banco", "Banco", "text"], ["agencia", "Agência", "text"], ["conta", "Conta (com o dígito)", "text"], ["tipoConta", "Tipo de conta", "sel", TIPOS_CONTA], ["pix", "Chave Pix", "text"]]],
];

const CSS = `
.md{position:fixed;inset:0;overflow:auto;background:#f6efe6;color:#3a2a1b;font:16px/1.55 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.md *{box-sizing:border-box}
.md header{padding:26px 18px;background:#3a2a1b;color:#f6efe6;text-align:center;border-bottom:4px solid #b49756}
.md .brand{font:34px Georgia,serif;letter-spacing:.22em;margin-left:.22em}
.md .tag{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#d6c19a;margin-top:6px}
.md main{max-width:640px;margin:auto;padding:22px 14px 50px}
.md article{background:#fffcf8;border:1px solid #e3d3bd;border-radius:16px;padding:22px 20px}
.md h1{font:normal 28px/1.2 Georgia,serif;color:#6b4a2b;margin:0 0 10px}
.md p{margin:8px 0}
.md .aviso{font-size:13px;color:#6b4a2b;background:#fffaf3;border:1px solid #e3d3bd;border-radius:10px;padding:10px 12px;margin-top:14px}
.md fieldset{border:0;border-top:1px solid #eadfce;margin:20px 0 0;padding:16px 0 0;min-width:0}
.md legend{font-weight:700;color:#6b4a2b;font-size:17px;padding:0 0 4px}
.md .ajuda{font-size:13px;color:#806b55;margin:0 0 8px}
.md label{display:block;font-size:14px;font-weight:600;margin:12px 0 4px}
.md input,.md select{width:100%;font:inherit;color:#3a2a1b;padding:12px;border-radius:8px;border:1px solid #d9c9ae;background:#fffdf9;min-height:46px}
.md input:focus,.md select:focus,.md button:focus-visible{outline:2px solid #b49756;outline-offset:2px}
.md .site{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.md button{font:inherit;font-weight:700;border:0;border-radius:10px;padding:14px 22px;cursor:pointer;color:#3a2a1b;background:#d6c19a;width:100%;margin-top:24px}
.md button:disabled{opacity:.6}
.md .erro{color:#9b2c2c;font-size:14px;margin-top:12px}
.md .ok{background:#f0f7ec;border:1px solid #bcd9b0;color:#2f5d22;border-radius:10px;padding:14px 14px;margin-top:6px}
`;

export default function Formulario({ codigo }) {
  const [fase, setFase] = useState("carregando");   // carregando | pronto | invalido | usado | enviado
  const [nome, setNome] = useState("");
  const [v, setV] = useState({});
  const [site, setSite] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/meus-dados/" + encodeURIComponent(codigo)).then(async (r) => {
      if (!vivo) return;
      if (!r.ok) { setFase("invalido"); return; }
      const d = await r.json();
      setNome(d.nome || "");
      setFase(d.situacao === "aplicada" ? "usado" : "pronto");
    }).catch(() => { if (vivo) setFase("invalido"); });
    return () => { vivo = false; };
  }, [codigo]);

  const set = (k, x) => setV((o) => ({ ...o, [k]: x }));
  const enviar = async (ev) => {
    ev.preventDefault();
    setErro(""); setEnviando(true);
    try {
      const r = await fetch("/api/meus-dados/" + encodeURIComponent(codigo), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...v, site }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d.erro || d.error || d.mensagem || "Não deu para enviar. Tente de novo."); setEnviando(false); return; }
      setFase("enviado");
    } catch (x) { setErro("Sem conexão. Tente de novo."); }
    setEnviando(false);
  };

  return (
    <div className="md">
      <style>{CSS}</style>
      <header><div className="brand">SORELLY</div><div className="tag">Meus dados</div></header>
      <main>
        <article>
          {fase === "carregando" && <p>Carregando…</p>}
          {fase === "invalido" && (<><h1>Link não encontrado</h1><p>Confira se o link está completo. Se continuar assim, fale com o RH.</p></>)}
          {fase === "usado" && (<><h1>Seus dados já foram conferidos</h1><p>O RH já recebeu e conferiu o que você mandou. Se precisar mudar algo, fale com o RH.</p></>)}
          {fase === "enviado" && (<><h1>Recebemos, obrigada!</h1><div className="ok">Seus dados foram enviados para o RH. Eles vão conferir e colocar no seu cadastro. Se errou algo, pode abrir este mesmo link e enviar de novo.</div></>)}
          {fase === "pronto" && (
            <form onSubmit={enviar} noValidate>
              <h1>Olá{nome ? ", " + nome : ""}!</h1>
              <p>Preencha seus dados para o cadastro da empresa. Leva uns 5 minutos. Pode deixar em branco o que você não souber.</p>
              <div className="aviso">Seus dados ficam só com o RH e a diretoria da Sorelly e servem para o cadastro de funcionários, o registro em carteira, a folha de pagamento e a segurança do trabalho. Este link é só seu: não compartilhe.</div>
              {GRUPOS.map(([titulo, ajuda, campos]) => (
                <fieldset key={titulo}>
                  <legend>{titulo}</legend>
                  {ajuda && <p className="ajuda">{ajuda}</p>}
                  {campos.map(([k, rot, tipo, op]) => (
                    <div key={k}>
                      <label htmlFor={"f-" + k}>{rot}</label>
                      {tipo === "sel"
                        ? <select id={"f-" + k} value={v[k] || ""} onChange={(e) => set(k, e.target.value)}><option value="">Escolha</option>{op.map((o) => <option key={o} value={o}>{o}</option>)}</select>
                        : <input id={"f-" + k} type={tipo === "num" ? "text" : tipo} inputMode={tipo === "num" ? "numeric" : undefined} autoComplete="off" value={v[k] || ""} onChange={(e) => set(k, tipo === "num" ? e.target.value.replace(/\D/g, "") : e.target.value)} />}
                    </div>
                  ))}
                </fieldset>
              ))}
              <div className="site" aria-hidden="true"><label htmlFor="f-site">Não preencha</label><input id="f-site" type="text" tabIndex={-1} autoComplete="off" value={site} onChange={(e) => setSite(e.target.value)} /></div>
              {erro && <div className="erro" role="alert">{erro}</div>}
              <button type="submit" disabled={enviando}>{enviando ? "Enviando…" : "Enviar meus dados"}</button>
            </form>
          )}
        </article>
      </main>
    </div>
  );
}

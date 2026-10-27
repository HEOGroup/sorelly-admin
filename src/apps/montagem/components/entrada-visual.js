// Sorelly Admin · montagem — components/entrada-visual.js
// Visual da tela de entrada (aprovado pelo Marcus em 27/10/2026): entrada com linhas, poeira e logo; clique abre um mosaico de diamantes a partir do ponto clicado;
// atrás do bloco de login ficam estrelas cintilantes que fogem do mouse e deixam rastro; o bloco tem uma gravura fina (guilhoché) só nas bordas.
// Tudo é desenhado por código (canvas e SVG), sem imagem nem biblioteca.
const R = Math.random;
const PARADO = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Estrela de 4 pontas fina: halo dourado, raios longos, raios curtos na diagonal e núcleo branco.
function estrela(g, x, y, r, a) {
  const L = r * 3.3, w = r * 0.2;
  const h = g.createRadialGradient(x, y, 0, x, y, r * 2.6);
  h.addColorStop(0, "rgba(255,215,120," + (a * 0.5).toFixed(3) + ")"); h.addColorStop(1, "rgba(232,184,75,0)");
  g.fillStyle = h; g.beginPath(); g.arc(x, y, r * 2.6, 0, 6.283); g.fill();
  g.save(); g.translate(x, y);
  const ponta = (len, larg, alfa) => {
    const gr = g.createLinearGradient(-len, 0, len, 0);
    gr.addColorStop(0, "rgba(255,225,150,0)"); gr.addColorStop(0.5, "rgba(255,250,225," + alfa.toFixed(3) + ")"); gr.addColorStop(1, "rgba(255,225,150,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(-len, 0);
    g.quadraticCurveTo(-larg, -larg, 0, -larg * 1.1); g.quadraticCurveTo(larg, -larg, len, 0);
    g.quadraticCurveTo(larg, larg, 0, larg * 1.1); g.quadraticCurveTo(-larg, larg, -len, 0); g.fill();
  };
  ponta(L, w, a); g.rotate(1.5708); ponta(L, w, a);
  g.rotate(-1.5708 + 0.7854); ponta(L * 0.42, w * 0.9, a * 0.7); g.rotate(1.5708); ponta(L * 0.42, w * 0.9, a * 0.7);
  g.restore();
  g.fillStyle = "rgba(255,255,255," + Math.min(1, a).toFixed(3) + ")"; g.beginPath(); g.arc(x, y, Math.max(0.6, r * 0.34), 0, 6.283); g.fill();
}

// Poeira dourada que sobe devagar (tela fechada). Devolve a função que para o desenho.
export function iniciarPoeira(canvas, raiz) {
  const g = canvas.getContext("2d"), P = [];
  let id = 0, parado = false;
  const tam = () => { canvas.width = raiz.clientWidth; canvas.height = raiz.clientHeight; };
  tam(); window.addEventListener("resize", tam);
  for (let i = 0; i < 70; i++) P.push({ x: R(), y: R(), r: R() * 1.8 + 0.4, v: R() * 0.0007 + 0.0002, a: R() * 0.6 + 0.2, f: R() * 6 });
  const quadro = (t) => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    P.forEach((p) => {
      p.y -= p.v * 16; if (p.y < -0.02) { p.y = 1.02; p.x = R(); }
      g.fillStyle = "rgba(232,184,75," + (p.a * (0.6 + 0.4 * Math.sin(t / 600 + p.f))).toFixed(2) + ")";
      g.beginPath(); g.arc(p.x * canvas.width, p.y * canvas.height, p.r, 0, 6.283); g.fill();
    });
    if (!parado && !PARADO()) id = requestAnimationFrame(quadro);
  };
  id = requestAnimationFrame(quadro);
  return () => { parado = true; cancelAnimationFrame(id); window.removeEventListener("resize", tam); };
}

// Estrelas cintilantes: fogem do mouse e voltam; o mouse deixa um rastro de faíscas. mouse = {x, y} (x < -900 = fora da tela).
export function iniciarBrilhos(canvas, raiz, mouse) {
  const g = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 2), A = [], rastro = [], ult = { x: -999, y: -999 };
  let W = 0, H = 0, id = 0, parado = false;
  const tam = () => { W = raiz.clientWidth; H = raiz.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  tam(); window.addEventListener("resize", tam);
  for (let i = 0; i < 110; i++) { const grande = R() < 0.14; A.push({ hx: R(), hy: R(), ox: 0, oy: 0, vx: 0, vy: 0, r: grande ? 6 + R() * 5 : 1.2 + R() * 4.2, f: R() * 6, v: 0.5 + R() * 1.3, flash: R() * 20 }); }
  const quadro = (now) => {
    g.clearRect(0, 0, W, H);
    const t = now / 1000, mx = mouse.x, my = mouse.y, tem = mx > -900;
    if (tem) { const d = Math.hypot(mx - ult.x, my - ult.y); if (d > 16 && rastro.length < 60) { rastro.push({ x: mx, y: my, vx: (R() - 0.5) * 1.2, vy: R() * 0.8 + 0.2, vida: 1, r: 2 + R() * 3.5 }); ult.x = mx; ult.y = my; } }
    for (let i = 0; i < A.length; i++) {
      const p = A[i]; let x = p.hx * W + p.ox, y = p.hy * H + p.oy;
      if (tem) { const dx = x - mx, dy = y - my, d = Math.hypot(dx, dy); if (d < 150 && d > 0.1) { const f = (1 - d / 150) * 3.2; p.vx += dx / d * f; p.vy += dy / d * f; } }
      p.vx += -p.ox * 0.03; p.vy += -p.oy * 0.03; p.vx *= 0.88; p.vy *= 0.88; p.ox += p.vx; p.oy += p.vy;
      x = p.hx * W + p.ox; y = p.hy * H + p.oy;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * p.v + p.f)), clar = Math.max(0, Math.sin(t * 0.35 + p.flash) - 0.93) * 14;
      estrela(g, x, y, p.r * (0.78 + 0.22 * tw) * (1 + clar * 0.9), Math.min(1, tw * 0.9 + clar * 0.4));
    }
    for (let i = rastro.length - 1; i >= 0; i--) {
      const q = rastro[i]; q.x += q.vx; q.y += q.vy; q.vida -= 0.02;
      if (q.vida <= 0) { rastro.splice(i, 1); continue; }
      estrela(g, q.x, q.y, q.r * q.vida + 0.8, q.vida);
    }
    if (!parado && !PARADO()) id = requestAnimationFrame(quadro);
  };
  id = requestAnimationFrame(quadro);
  return () => { parado = true; cancelAnimationFrame(id); window.removeEventListener("resize", tam); };
}

// Mosaico de diamantes que pipoca a partir do ponto clicado (px, py em pixels dentro da raiz).
export function montarMosaico(el, W, H, px, py) {
  el.innerHTML = "";
  const esp = 64, lado = Math.round(esp / 1.4142) + 2, maxD = Math.hypot(Math.max(px, W - px), Math.max(py, H - py)), frag = document.createDocumentFragment();
  for (let j = -1; j < H / (esp / 2) + 2; j++) {
    for (let i = -1; i < W / esp + 2; i++) {
      const cx = i * esp + (j % 2 ? esp / 2 : 0), cy = j * (esp / 2), d = Math.hypot(cx - px, cy - py) / maxD * 0.8, d2 = document.createElement("i");
      d2.style.cssText = "left:" + (cx - lado / 2) + "px;top:" + (cy - lado / 2) + "px;width:" + lado + "px;height:" + lado + "px;--d:" + d.toFixed(3) + "s";
      frag.appendChild(d2);
    }
  }
  el.appendChild(frag);
}

// Gravura fina (guilhoché): fios dourados entrelaçados, bem apagados.
export const GRAVURA = "url(\"data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='24'><g fill='none' stroke='#E8B84B' stroke-width='.8' stroke-opacity='.16'><path d='M0 12 C 20 -2, 40 -2, 60 12 S 100 26, 120 12'/><path d='M0 12 C 20 26, 40 26, 60 12 S 100 -2, 120 12'/></g></svg>") + "\")";

export const CSS_ENTRADA = [
  ".ent-raiz{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:#0b0b0d;isolation:isolate;cursor:pointer;outline:none}",
  ".ent-raiz.ent-aberto{cursor:default}",
  ".ent-fundo{position:absolute;inset:0;background:repeating-linear-gradient(45deg,transparent 0 46px,rgba(232,184,75,.07) 46px 47px),repeating-linear-gradient(-45deg,transparent 0 46px,rgba(232,184,75,.07) 46px 47px);animation:ent-desliza 18s linear infinite}",
  "@keyframes ent-desliza{to{background-position:94px 0,-94px 0}}",
  ".ent-spot{position:absolute;inset:0;background:radial-gradient(150px circle at var(--mx,50%) var(--my,50%),rgba(232,184,75,.15),transparent 70%);pointer-events:none}",
  ".ent-tela{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
  ".ent-marca{position:absolute;inset:0;z-index:1;display:grid;place-content:center;justify-items:center;gap:22px;pointer-events:none}",
  ".ent-logo{width:min(250px,60vw);height:auto;animation:ent-respira 4s ease-in-out infinite;transition:transform .9s cubic-bezier(.6,0,.2,1),opacity .7s}",
  "@keyframes ent-respira{0%,100%{filter:drop-shadow(0 0 10px rgba(232,184,75,.25))}50%{filter:drop-shadow(0 0 28px rgba(232,184,75,.65))}}",
  ".ent-aberto .ent-logo{transform:scale(2.4);opacity:0}",
  ".ent-dica{padding:6px 16px;border:1px solid #E8B84B;border-radius:999px;color:#E8B84B;font-size:13px;animation:ent-pulsa 2s ease-in-out infinite;transition:opacity .3s}",
  ".ent-aberto .ent-dica{opacity:0}",
  "@keyframes ent-pulsa{0%,100%{box-shadow:0 0 0 0 rgba(232,184,75,.45)}50%{box-shadow:0 0 0 10px rgba(232,184,75,0)}}",
  ".ent-mosaico{position:absolute;inset:0;z-index:5;pointer-events:none;overflow:hidden}",
  ".ent-mosaico i{position:absolute;background:#111114;border:1px solid rgba(232,184,75,.55);transform:rotate(45deg) scale(0);opacity:0}",
  ".ent-aberto .ent-mosaico i{animation:ent-pipoca .55s cubic-bezier(.2,.9,.3,1.2) var(--d) forwards,ent-some .55s ease 1.45s forwards}",
  "@keyframes ent-pipoca{0%{transform:rotate(45deg) scale(0);opacity:1;background:#E8B84B}55%{background:#3a2c0c}100%{transform:rotate(45deg) scale(1.03);opacity:1;background:#111114}}",
  "@keyframes ent-some{to{opacity:0}}",
  ".ent-revela{position:absolute;inset:0;z-index:4;opacity:0;pointer-events:none;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#1a1307 0%,#0b0907 55%,#050507 100%)}",
  ".ent-aberto .ent-revela{opacity:1;transition:opacity .01s 1.4s}",
  ".ent-vinheta{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%)}",
  ".ent-centro{position:absolute;inset:0;z-index:8;display:grid;place-items:center;overflow:auto;padding:16px;visibility:hidden}",
  ".ent-aberto .ent-centro{visibility:visible;transition:visibility 0s 1.75s}",
  ".ent-painel{position:relative;width:min(440px,100%);padding:28px 36px 30px;border-radius:18px;background:#16161a;border:1px solid rgba(232,184,75,.28);overflow:hidden;",
  "box-shadow:0 0 0 1px rgba(0,0,0,.55),0 24px 60px rgba(0,0,0,.6);opacity:0;transform:translateY(8px) scale(.94);transition:opacity .4s,transform .5s}",
  ".ent-aberto .ent-painel{opacity:1;transform:none;transition:opacity .5s 1.75s,transform .6s 1.75s cubic-bezier(.2,.9,.25,1.1)}",
  ".ent-gravura{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background-repeat:repeat;opacity:.8;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,transparent 28%,#000 95%);mask-image:radial-gradient(ellipse at 50% 50%,transparent 28%,#000 95%)}",
  ".ent-luz{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(120% 70% at 50% -15%,rgba(255,255,255,.04),transparent 60%)}",
  ".ent-conteudo{position:relative;z-index:2}",
  "@media (prefers-reduced-motion:reduce){.ent-fundo,.ent-logo,.ent-dica{animation:none}.ent-mosaico i{animation:none!important;opacity:0}.ent-revela{transition:none}.ent-painel{transition:none!important}.ent-aberto .ent-centro{transition:none}}",
].join("");

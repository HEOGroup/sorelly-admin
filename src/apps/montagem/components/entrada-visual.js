// Sorelly Admin · montagem — components/entrada-visual.js
// Visual da tela de entrada (aprovado pelo Marcus em 27/10/2026, simplificado no mesmo dia porque a tela inicial com clique e mosaico demorava e travava):
// o bloco de login já abre na hora, sobre estrelas cintilantes que fogem do mouse e deixam rastro; o bloco tem uma gravura fina (guilhoché) só nas bordas.
// Leve de propósito: a estrela é desenhada UMA vez numa imagem pequena e só reaproveitada; nada de animação de fundo em CSS.
const R = Math.random;
const PARADO = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Estrela de 4 pontas fina (halo dourado, raios longos, raios curtos na diagonal, núcleo branco), desenhada uma vez em 128 x 128.
function criarEstrela() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 128;
  const g = c.getContext("2d"), x = 64, y = 64, r = 16, L = r * 3.3, w = r * 0.2;
  const h = g.createRadialGradient(x, y, 0, x, y, r * 2.6);
  h.addColorStop(0, "rgba(255,215,120,.5)"); h.addColorStop(1, "rgba(232,184,75,0)");
  g.fillStyle = h; g.beginPath(); g.arc(x, y, r * 2.6, 0, 6.283); g.fill();
  g.translate(x, y);
  const ponta = (len, larg, alfa) => {
    const gr = g.createLinearGradient(-len, 0, len, 0);
    gr.addColorStop(0, "rgba(255,225,150,0)"); gr.addColorStop(0.5, "rgba(255,250,225," + alfa + ")"); gr.addColorStop(1, "rgba(255,225,150,0)");
    g.fillStyle = gr; g.beginPath(); g.moveTo(-len, 0);
    g.quadraticCurveTo(-larg, -larg, 0, -larg * 1.1); g.quadraticCurveTo(larg, -larg, len, 0);
    g.quadraticCurveTo(larg, larg, 0, larg * 1.1); g.quadraticCurveTo(-larg, larg, -len, 0); g.fill();
  };
  ponta(L, w, 1); g.rotate(1.5708); ponta(L, w, 1);
  g.rotate(-1.5708 + 0.7854); ponta(L * 0.42, w * 0.9, 0.7); g.rotate(1.5708); ponta(L * 0.42, w * 0.9, 0.7);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r * 0.34, 0, 6.283); g.fill();
  return c;
}

// Estrelas cintilantes: fogem do mouse e voltam; o mouse deixa um rastro de faíscas. mouse = {x, y} (x < -900 = fora da tela).
// Devolve a função que para o desenho.
export function iniciarBrilhos(canvas, raiz, mouse) {
  const g = canvas.getContext("2d"), dpr = Math.min(window.devicePixelRatio || 1, 1.5), A = [], rastro = [], ult = { x: -999, y: -999 }, sprite = criarEstrela();
  let W = 0, H = 0, id = 0, parado = false;
  const tam = () => { W = raiz.clientWidth; H = raiz.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  tam(); window.addEventListener("resize", tam);
  const desenha = (x, y, r, a) => { const s = r / 16, t = 128 * s; g.globalAlpha = Math.min(1, Math.max(0, a)); g.drawImage(sprite, x - t / 2, y - t / 2, t, t); };
  for (let i = 0; i < 80; i++) { const grande = R() < 0.14; A.push({ hx: R(), hy: R(), ox: 0, oy: 0, vx: 0, vy: 0, r: grande ? 6 + R() * 5 : 1.2 + R() * 4.2, f: R() * 6, v: 0.5 + R() * 1.3, flash: R() * 20 }); }
  const quadro = (now) => {
    g.globalAlpha = 1; g.clearRect(0, 0, W, H);
    const t = now / 1000, mx = mouse.x, my = mouse.y, tem = mx > -900;
    if (tem) { const d = Math.hypot(mx - ult.x, my - ult.y); if (d > 18 && rastro.length < 36) { rastro.push({ x: mx, y: my, vx: (R() - 0.5) * 1.2, vy: R() * 0.8 + 0.2, vida: 1, r: 2 + R() * 3.5 }); ult.x = mx; ult.y = my; } }
    for (let i = 0; i < A.length; i++) {
      const p = A[i];
      if (tem) { const dx = p.hx * W + p.ox - mx, dy = p.hy * H + p.oy - my, d = Math.hypot(dx, dy); if (d < 150 && d > 0.1) { const f = (1 - d / 150) * 3.2; p.vx += dx / d * f; p.vy += dy / d * f; } }
      p.vx += -p.ox * 0.03; p.vy += -p.oy * 0.03; p.vx *= 0.88; p.vy *= 0.88; p.ox += p.vx; p.oy += p.vy;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * p.v + p.f)), clar = Math.max(0, Math.sin(t * 0.35 + p.flash) - 0.93) * 14;
      desenha(p.hx * W + p.ox, p.hy * H + p.oy, p.r * (0.78 + 0.22 * tw) * (1 + clar * 0.9), tw * 0.9 + clar * 0.4);
    }
    for (let i = rastro.length - 1; i >= 0; i--) {
      const q = rastro[i]; q.x += q.vx; q.y += q.vy; q.vida -= 0.025;
      if (q.vida <= 0) { rastro.splice(i, 1); continue; }
      desenha(q.x, q.y, q.r * q.vida + 0.8, q.vida);
    }
    if (!parado && !PARADO()) id = requestAnimationFrame(quadro);
  };
  id = requestAnimationFrame(quadro);
  return () => { parado = true; cancelAnimationFrame(id); window.removeEventListener("resize", tam); };
}

// Gravura fina (guilhoché): fios dourados entrelaçados, bem apagados.
export const GRAVURA = "url(\"data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='120' height='24'><g fill='none' stroke='#E8B84B' stroke-width='.8' stroke-opacity='.16'><path d='M0 12 C 20 -2, 40 -2, 60 12 S 100 26, 120 12'/><path d='M0 12 C 20 26, 40 26, 60 12 S 100 -2, 120 12'/></g></svg>") + "\")";

export const CSS_ENTRADA = [
  ".ent-raiz{position:relative;min-height:100vh;min-height:100dvh;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#1a1307 0%,#0b0907 55%,#050507 100%);isolation:isolate}",
  ".ent-tela{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
  ".ent-vinheta{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,.6) 100%);pointer-events:none}",
  ".ent-centro{position:absolute;inset:0;z-index:8;display:grid;place-items:center;overflow:auto;padding:16px}",
  ".ent-painel{position:relative;width:min(440px,100%);padding:28px 36px 30px;border-radius:18px;background:#16161a;border:1px solid rgba(232,184,75,.28);overflow:hidden;",
  "box-shadow:0 0 0 1px rgba(0,0,0,.55),0 24px 60px rgba(0,0,0,.6);animation:ent-entra .3s ease-out}",
  "@keyframes ent-entra{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}",
  ".ent-gravura{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background-repeat:repeat;opacity:.8;-webkit-mask-image:radial-gradient(ellipse at 50% 50%,transparent 28%,#000 95%);mask-image:radial-gradient(ellipse at 50% 50%,transparent 28%,#000 95%)}",
  ".ent-luz{position:absolute;inset:0;pointer-events:none;border-radius:inherit;background:radial-gradient(120% 70% at 50% -15%,rgba(255,255,255,.04),transparent 60%)}",
  ".ent-conteudo{position:relative;z-index:2}",
  "@media (prefers-reduced-motion:reduce){.ent-painel{animation:none}}",
].join("");

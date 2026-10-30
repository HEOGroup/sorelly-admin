// Sorelly Admin · tests/fotos/telas.spec.mjs
// As telas de referência do padrão visual (docs/design/PADRAO-VISUAL.md). Para proteger outra tela: acrescente uma linha em TELAS
// (endereço antigo da rota, em router/rotas.js; o novo /setor/tela abre por redirecionamento) e rode `npm run fotos:aprovar` depois que o Marcus aprovar.
// A data é fixa (15/10/2026) para a foto não mudar com o dia; os números que "correm" terminam antes da foto.
import { expect, test } from "@playwright/test";

var TELAS = [
  ["visao-geral", "Visão geral (modelo do padrão)"],
  ["previsao-de-faturamento", "Faturamento (referência do Financeiro)"],
  ["contas-a-pagar", "Contas a pagar (segunda referência do Financeiro)"],
  ["padrao-visual", "Padrão visual (peças ao vivo)"],
];
var DATA_FIXA = new Date("2026-10-15T10:00:00-03:00");

// Entra no sistema quando o servidor tem login (PC do Marcus). No CI não há servidor de dados: abre direto.
async function entrar(page, request, baseURL){
  var email = process.env.FOTOS_EMAIL, senha = process.env.FOTOS_SENHA;
  if(!email || !senha) return;
  var r = await request.post(baseURL + "/api/auth/login", { data: { email: email, senha: senha } });
  if(!r.ok()) throw new Error("Login das fotos falhou (" + r.status() + "): confira FOTOS_EMAIL e FOTOS_SENHA no .env.local");
  var j = await r.json(), u = j.usuario || {};
  var conta = { perfil: u.perfil, pessoa: u.pessoaId == null ? "" : String(u.pessoaId), abas: u.abas || null, ocultar: u.ocultar || null, grupo: u.grupo || null, cid: u.cid || null, nome: u.nome || "" };
  await page.addInitScript(function(d){ localStorage.setItem("sorelly_token", d.token); localStorage.setItem("sorelly_conta", JSON.stringify(d.conta)); }, { token: j.token, conta: conta });
}

test.describe("Fotos de referência do padrão visual", function(){
  test.beforeEach(async function({ page, request, baseURL }){
    await page.clock.setFixedTime(DATA_FIXA);
    await page.addInitScript(function(){ try{ localStorage.setItem("sorelly_blocos_fechados", "[]"); }catch(x){} });
    await entrar(page, request, baseURL);
  });

  TELAS.forEach(function(t){
    test(t[1], async function({ page }){
      await page.goto("/" + t[0], { waitUntil: "networkidle" });
      // servidor com login e sem conta das fotos: não tira foto da tela de entrada (seria uma referência errada)
      if(await page.getByText("Entre com o seu usuário").count()) test.skip(true, "Servidor com login: informe FOTOS_EMAIL e FOTOS_SENHA no .env.local para tirar as fotos no PC.");
      await page.waitForTimeout(3000);   // os números correm de zero até o valor (lib/contagem-tela.js); espera terminar
      // avisos do SorellyChat (cartões no canto) cobrem a tela: fecha todos antes da foto
      for(var i = 0; i < 5 && await page.getByText("Fechar todas").count(); i++){ await page.getByText("Fechar todas").first().click(); await page.waitForTimeout(300); }
      await expect(page).toHaveScreenshot(t[0] + ".png", { fullPage: true });
    });
  });
});

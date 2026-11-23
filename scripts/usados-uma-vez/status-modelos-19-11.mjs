// SÓ LEITURA: modelos cadastrados desde 16/11 e quantos têm foto na DevMaster (anel = 1 modelo, tamanhos não contam)
import { todasAsPaginas } from "../../src/server/devmaster2.js";
const modeloDe = (c) => /^A\d{4}\d{3}$/.test(c) ? c.slice(0, 5) : c;
const dm = await todasAsPaginas("dmaaa", { filtro: { aaa_datacadastro: { gte: "2026-11-16T00:00:00" } } }, 10);
const mods = {};
dm.forEach(x => { const m = modeloDe(String(x.aaa_codigo).trim().toUpperCase()), dia = String(x.aaa_datacadastro).slice(0, 10); const o = mods[m] = mods[m] || { dia, foto: false }; if (String(x.aaa_foto || "").trim()) o.foto = true; if (dia < o.dia) o.dia = dia; });
const l = Object.values(mods), dias = {};
l.forEach(x => { const o = dias[x.dia] = dias[x.dia] || [0, 0]; o[0]++; if (x.foto) o[1]++; });
console.log("HORA", new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", timeStyle: "short" }).format(new Date()));
console.log("TOTAL", l.length, "| com foto", l.filter(x => x.foto).length, "| faltam", l.filter(x => !x.foto).length);
Object.keys(dias).sort().forEach(d => console.log("DIA", d, dias[d][0], dias[d][1], dias[d][0] - dias[d][1]));

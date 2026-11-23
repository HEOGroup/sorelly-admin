// SÓ LEITURA: quantos modelos da semana (cadastro desde 16/11) já tinham foto às 08h de 19/11, pelo horário em que o sistema viu a foto
import { pool } from "../../src/server/db.js";
const modeloDe = (c) => /^A\d{4}\d{3}$/.test(c) ? c.slice(0, 5) : c;
const p = pool();
const c = (await p.query("select conteudo from sorelly.estado_modulo where modulo='fc'")).rows[0].conteudo;
const un = {};
Object.keys(c).filter(k => k.startsWith("c_")).forEach(k => { const x = c[k]; if (!x || !x.dia || x.dia < "2026-11-16") return; const m = modeloDe(x.cod); const u = un[m] = un[m] || { dia: x.dia, t: "" }; if (x.dia < u.dia) u.dia = x.dia; const ts = [x.fotoEm, x.dmFoto, x.subEm].filter(v => /^\d{4}-\d{2}-\d{2}T/.test(String(v || ""))).sort()[0] || (x.subEm ? "?" : ""); if (ts && (!u.t || (ts !== "?" && ts < u.t))) u.t = ts; });
const l = Object.values(un), corte = "2026-11-19T08:00:00";
const ate8 = l.filter(x => x.t && (x.t === "?" || x.t <= corte)), com = l.filter(x => x.t);
console.log("modelos da semana no sistema:", l.length, "| com foto agora:", com.length, "| com foto até 08h de 19/11:", ate8.length, "| sem horário (?):", l.filter(x => x.t === "?").length);
const d = {}; l.forEach(x => { const o = d[x.dia] = d[x.dia] || { cad: 0, ate8: 0 }; o.cad++; if (x.t && (x.t === "?" || x.t <= corte)) o.ate8++; }); console.log(JSON.stringify(d));
await p.end();

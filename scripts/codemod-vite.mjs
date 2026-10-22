// Troca as peças do Vite por equivalentes do Next, uma vez só (migração).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(raiz, "src");
let tocados = 0;
(function andar(dir) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name !== "generated") andar(p); continue; }
    if (!/\.js$/.test(f.name) || /\.local\.js$/.test(f.name)) continue;
    let t = fs.readFileSync(p, "utf8"), o = t;
    const dirRel = path.relative(src, path.dirname(p)).split(path.sep).join("/");
    let usaGlob = false;
    t = t.replace(/import\.meta\.glob\(\s*"\.\/([^"]+)"\s*,\s*\{\s*eager:\s*true\s*\}\s*\)/g, (_, nome) => { usaGlob = true; return `globLocal("${dirRel}/${nome}")`; });
    t = t.replace(/import\.meta\.env && /g, "");
    t = t.replace(/import\.meta\.env\.VITE_(\w+)/g, "process.env.NEXT_PUBLIC_$1");
    t = t.replace(/import\.meta\.env\.BASE_URL/g, '"/"');
    t = t.replace(/import\.meta\.env\.DEV/g, '(process.env.NODE_ENV !== "production")');
    if (usaGlob) t = `import { globLocal } from "@/lib/glob-local";\n` + t;
    if (t !== o) { fs.writeFileSync(p, t); tocados++; }
  }
})(src);
console.log(tocados, "arquivos");

// Sorelly Admin · montagem — domain/bonus-montagem-local.js
// Dados reais do bônus da montagem que existem só neste computador (domain/bonus-montagem.local.js, fora do Git). Sem o arquivo = null.
// Fica separado de bonus-montagem.js para aquele arquivo continuar sem import (o teste scripts/testar-bonus-montagem.mjs roda no Node).
import { globLocal } from "@/lib/glob-local";

var LOCAL_BM = (function(){ try { var m = globLocal("apps/montagem/domain/bonus-montagem.local.js"); var k = Object.keys(m)[0]; return k ? m[k].default : null; } catch(x){ return null; } })();

export { LOCAL_BM };

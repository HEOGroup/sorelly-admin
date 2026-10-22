// Senha com scrypt do próprio Node (sem biblioteca). Formato guardado: "scrypt:sal:hash" (hexadecimal).
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt);
const normaliza = (s) => String(s).normalize("NFKC");

export async function criarHash(senha) {
  const sal = randomBytes(16).toString("hex");
  const chave = await derivar(normaliza(senha), sal, 64);
  return `scrypt:${sal}:${chave.toString("hex")}`;
}

export async function conferirSenha(senha, guardado) {
  const [tipo, sal, hash] = String(guardado || "").split(":");
  if (tipo !== "scrypt" || !sal || !hash) return false;
  const chave = await derivar(normaliza(senha), sal, 64);
  const esperado = Buffer.from(hash, "hex");
  return esperado.length === chave.length && timingSafeEqual(esperado, chave);
}

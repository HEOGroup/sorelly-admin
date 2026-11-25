# Lê a planilha de kits novos da Michele (Kits Novos 2026.xlsx) no formato do módulo kndados. Usado por scripts/importar-kits-novos-planilha.mjs.
# Uso: python -I scripts/ler-planilha-kits-novos.py "Kits Novos 2026.xlsx" saida.json   (precisa do openpyxl: pip install openpyxl)
import sys, json, datetime, unicodedata, openpyxl
src, out = sys.argv[1], sys.argv[2]
PREF = {"CURITIBA": ("K", "Curitiba e região"), "MARINGA": ("KM", "Maringá"), "LITORAL DO PARANA": ("KP", "Litoral do Paraná"),
        "PONTA GROSSA": ("KG", "Ponta Grossa"), "JOINVILLE": ("KJ", "Joinville"), "SANTA CATARINA": ("KS", "Santa Catarina")}
MESES = ["JANEIRO","FEVEREIRO","MARCO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"]
MES_BONITO = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"]
def sem_acento(t): return "".join(c for c in unicodedata.normalize("NFD", str(t or "")) if unicodedata.category(c) != "Mn").upper().strip()
def dia(v):
    if isinstance(v, datetime.datetime): return v.date().isoformat()
    if isinstance(v, datetime.date): return v.isoformat()
    return None
def txt(v):
    if v is None: return ""
    if isinstance(v, float) and v.is_integer(): v = int(v)
    if isinstance(v, (datetime.datetime, datetime.date)): return v.strftime("%d/%m/%Y")
    return " ".join(str(v).split())
def valor(v):
    if isinstance(v, (int, float)): return int(round(v))
    d = "".join(ch for ch in str(v or "").split(",")[0] if ch.isdigit())
    return int(d) if d else None
wb = openpyxl.load_workbook(src, read_only=True, data_only=True)
kits, resumo = [], {}
for ws in wb.worksheets:
    chave = sem_acento(ws.title)
    if chave not in PREF: continue
    pre, reg = PREF[chave]
    cur = chave == "CURITIBA"
    # colunas (Curitiba tem MODELO KIT e DISPONIBILIDADE a mais)
    C = dict(qnt=0, cad=1, lib=2, sol=3, bip=4, ret=5, st=6, nome=7, cid=8, bai=9, rep=10)
    C.update(dict(mod=11, val=12, retirada=13, trab=14, disp=15, obs=16, c1=17, c2=18, c3=19, tipo=20, op=21, ent=22, obs2=23) if cur else
             dict(val=11, retirada=12, trab=13, obs=14, c1=15, c2=16, c3=17, tipo=18, op=19, ent=20, obs2=21))
    mes, vistos, n = None, set(), 0
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0: continue
        row = list(row) + [None] * 30
        cab = sem_acento(row[7])
        if cab in MESES and not isinstance(row[0], (int, float)): mes = MESES.index(cab); continue
        if not isinstance(row[0], (int, float)) or mes is None: continue
        if not txt(row[C["nome"]]): continue
        base = "%s%02d-%d" % (pre, mes + 1, int(row[0])); kid = base; k = 2
        while kid in vistos: kid = "%s_%d" % (base, k); k += 1
        vistos.add(kid); n += 1
        g = lambda c: row[C[c]] if c in C else None
        kits.append(dict(id=kid, reg=reg, mes=MES_BONITO[mes], stPlan=txt(g("st")), cad=dia(g("cad")), lib=dia(g("lib")), sol=dia(g("sol")), bip=dia(g("bip")), ret=dia(g("ret")),
                         nome=txt(g("nome")), cid=txt(g("cid")), bai=txt(g("bai")), rep=txt(g("rep")), mod=txt(g("mod")) or "Normal", val=valor(g("val")),
                         retirada=txt(g("retirada")), trab=txt(g("trab")), disp=txt(g("disp")), obs=txt(g("obs")), c1=g("c1") is True, c2=g("c2") is True, c3=g("c3") is True,
                         tipo=txt(g("tipo")), op=txt(g("op")), ent=txt(g("ent")), obs2=txt(g("obs2"))))
    resumo[reg] = n
json.dump(kits, open(out, "w", encoding="utf-8"), ensure_ascii=False)
print(json.dumps(resumo, ensure_ascii=False), "total", len(kits))

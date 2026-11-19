#!/usr/bin/env python3
"""
Gera src/data/snapshot.json (Relatório de Desempenho · Meta 2026 do Hospital Santa Izabel)
a partir dos JSON crus de data/meta-raw/ (baixados por scripts/pull-meta.py) e copia os
criativos escolhidos de data/criativos-raw/ para public/criativos/.

Uso:
  python3 scripts/pull-meta.py          # baixa data/meta-raw/ e data/criativos-raw/
  python3 scripts/build-snapshot.py     # gera src/data/snapshot.json + public/criativos/

Regras:
  - Investimento = spend exatamente como vem da API (valor do Gerenciador). Sem margem, sem ajuste.
  - Alcance total vem de conta_total.json (único no período); nunca é somado entre meses.
    O alcance de uma estratégia com várias campanhas é a soma do alcance de cada campanha
    (marcado com alcanceSomado=true; a interface diz isso).
  - Engajamento = action post_engagement. Cliques no link = inline_link_clicks.
  - Período 01/01 → 31/10/2026; só entram os meses com veiculação.
  - Público: idade/gênero desconhecidos ficam de fora; % sobre o informado.
"""

import hashlib
import json
import os
import shutil
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(RAIZ, "data", "meta-raw")
IMG_RAW = os.path.join(RAIZ, "data", "criativos-raw")
IMG_PUB = os.path.join(RAIZ, "public", "criativos")
SAIDA = os.path.join(RAIZ, "src", "data", "snapshot.json")

PERIODO = {"inicio": "2026-01-01", "fim": "2026-10-31"}
MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"]
FAIXAS = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+"]
CRIATIVOS_POR_ESTRATEGIA = 8
# Anúncios cuja imagem disponível não mostra a peça (ex.: quadro inicial do vídeo todo em cor sólida).
EXCLUIR_CRIATIVOS = {"120242263793020251": "miniatura do vídeo é só um fundo verde, sem a peça"}

# Ordem fixa das estratégias e o grupo de cada uma.
ESTRATEGIAS = [
    ("Alcance", "Always On"),
    ("Engajamento", "Always On"),
    ("Tráfego", "Always On"),
    ("Posts de oportunidade", "Always On"),
    ("Curativos Especiais", "Campanha especial"),
    ("Faz Bem", "Campanha especial"),
]
GRUPO = dict(ESTRATEGIAS)

# Métrica principal de cada estratégia: impressões + CPM, engajamentos + custo por engajamento, cliques no link + CPC.
PRINCIPAL = {
    "Alcance": "impressoes",
    "Posts de oportunidade": "impressoes",
    "Curativos Especiais": "impressoes",
    "Engajamento": "engajamento",
    "Faz Bem": "engajamento",
    "Tráfego": "cliquesLink",
}


def estrategia_da_campanha(nome):
    n = nome.lower()
    if "curativos" in n:
        return "Curativos Especiais"
    if "faz bem" in n:
        return "Faz Bem"
    if "oportunidade" in n:
        return "Posts de oportunidade"
    if "tráfego" in n or "trafego" in n:
        return "Tráfego"
    if "engajamento" in n or "engj" in n:
        return "Engajamento"
    if "alcance" in n:
        return "Alcance"
    return None


def nome_curto(nome, estrategia):
    """'HSI | Always On 2026 | Janeiro | Alcance' → 'Always On · Janeiro · Alcance'."""
    if estrategia == "Curativos Especiais":
        return "Curativos Especiais"
    if estrategia == "Faz Bem":
        return "Faz Bem"
    n = nome.lower()
    mes = next((MESES_LONGOS[i] for i in range(12) if MESES_LONGOS[i] in n), None)
    if estrategia == "Posts de oportunidade":
        return "Posts de oportunidade · Outubro" if mes == "outubro" else "Posts de oportunidade · jan a mar"
    rot = f"Always On · {mes.capitalize() if mes else ''} · {estrategia}"
    if "cortes" in n:
        rot += " (Cortes)"
    return rot


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def acao(row, tipo):
    for a in row.get("actions") or []:
        if a.get("action_type") == tipo:
            return num(a.get("value"))
    return 0.0


def ld(nome):
    with open(os.path.join(RAW, nome), encoding="utf-8") as f:
        return json.load(f)


def metricas(r):
    return {
        "investimento": num(r.get("spend")),
        "impressoes": num(r.get("impressions")),
        "alcance": num(r.get("reach")),
        "cliques": num(r.get("clicks")),
        "cliquesLink": num(r.get("inline_link_clicks")),
        "engajamento": acao(r, "post_engagement"),
    }


def zero():
    return {"investimento": 0.0, "impressoes": 0.0, "alcance": 0.0, "cliques": 0.0, "cliquesLink": 0.0, "engajamento": 0.0}


def soma(a, b):
    for k in a:
        a[k] += b.get(k, 0.0)
    return a


def fecha(m, extra=None):
    """Arredonda e calcula CPM, CTR (cliques ÷ impressões), CPC (por clique no link), custo por engajamento, frequência."""
    inv, imp, alc = m["investimento"], m["impressoes"], m["alcance"]
    out = {k: (round(v, 2) if k == "investimento" else round(v)) for k, v in m.items()}
    out["cpm"] = round(inv / imp * 1000, 2) if imp else 0
    out["ctr"] = round(m["cliques"] / imp, 6) if imp else 0
    out["ctrLink"] = round(m["cliquesLink"] / imp, 6) if imp else 0
    out["cpc"] = round(inv / m["cliquesLink"], 2) if m["cliquesLink"] else 0
    out["custoEngajamento"] = round(inv / m["engajamento"], 4) if m["engajamento"] else 0
    out["frequencia"] = round(imp / alc, 2) if alc else 0
    if extra:
        out.update(extra)
    return out


def rotulo_mes(mes):
    i = int(mes[5:7]) - 1
    return MESES[i], MESES_LONGOS[i]


# ------------------------------------------------------------------ criativos

def md5(caminho):
    h = hashlib.md5()
    with open(caminho, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def copia_reduzida(origem, destino, largura=720):
    """Copia o JPEG reduzindo para no máximo `largura` px (sips, macOS); sem sips, copia como está."""
    if shutil.which("sips"):
        r = subprocess.run(["sips", "--resampleWidth", str(largura), "-s", "format", "jpeg", "-s", "formatOptions", "82", origem, "--out", destino],
                           capture_output=True)
        w = subprocess.run(["sips", "-g", "pixelWidth", origem], capture_output=True, text=True).stdout
        larg = int(w.strip().split()[-1]) if w.strip() else 0
        if r.returncode == 0 and larg and larg < largura:
            shutil.copyfile(origem, destino)  # não amplia
        if r.returncode == 0:
            return
    shutil.copyfile(origem, destino)


def main():
    avisos = []
    total = ld("conta_total.json")[0]
    conta_mensal = ld("conta_mensal.json")
    camp_total = ld("campanhas_total.json")
    camp_mensal = ld("campanhas_mensal.json")
    camp_info = {c["id"]: c for c in ld("campanhas_info.json")}
    publico_raw = ld("publico_idade_genero.json")
    anuncios = ld("anuncios.json")
    criativos_raw = {c["ad_id"]: c for c in ld("criativos.json")}

    # ---------------------------------------------------- campanhas
    campanhas = []
    estr_de = {}
    for c in camp_total:
        m = metricas(c)
        if m["investimento"] == 0 and m["impressoes"] == 0:
            continue
        e = estrategia_da_campanha(c["campaign_name"])
        if not e:
            avisos.append(f"Campanha sem estratégia: {c['campaign_name']}")
            continue
        estr_de[c["campaign_id"]] = e
        info = camp_info.get(c["campaign_id"], {})
        inicio = (info.get("start_time") or "")[:10]
        meses_veic = sorted(r["date_start"][:7] for r in camp_mensal
                            if r["campaign_id"] == c["campaign_id"] and (num(r.get("spend")) > 0 or num(r.get("impressions")) > 0))
        campanhas.append(fecha(m, {
            "id": c["campaign_id"],
            "nome": c["campaign_name"],
            "nomeCurto": nome_curto(c["campaign_name"], e),
            "estrategia": e,
            "grupo": GRUPO[e],
            "objetivo": c.get("objective", ""),
            "inicioConfig": inicio,
            "fimConfig": (info.get("stop_time") or "")[:10],
            "meses": meses_veic,
            "comecouAntes": bool(inicio and inicio < PERIODO["inicio"]),
        }))
    campanhas.sort(key=lambda c: -c["investimento"])

    # ---------------------------------------------------- totais
    t = metricas(total)
    meses_ok = sorted(r["date_start"][:7] for r in conta_mensal if num(r.get("spend")) > 0 or num(r.get("impressions")) > 0)
    totais = fecha(t, {"campanhas": len(campanhas), "anuncios": len([a for a in anuncios if num(a.get("impressions")) > 0]),
                       "meses": len(meses_ok)})
    soma_camp = round(sum(c["investimento"] for c in campanhas), 2)
    if abs(soma_camp - totais["investimento"]) > 0.05:
        avisos.append(f"Soma das campanhas ({soma_camp}) ≠ total da conta ({totais['investimento']})")

    # ---------------------------------------------------- grade estratégia × mês (+ estratégias ativas por mês)
    celulas = defaultdict(lambda: {"m": zero(), "campanhas": set()})
    for r in camp_mensal:
        e = estr_de.get(r["campaign_id"])
        if not e:
            continue
        m = metricas(r)
        if m["investimento"] == 0 and m["impressoes"] == 0:
            continue
        k = (e, r["date_start"][:7])
        soma(celulas[k]["m"], m)
        celulas[k]["campanhas"].add(nome_curto(r["campaign_name"], e))

    # ---------------------------------------------------- meses (só os com veiculação)
    meses = []
    for r in sorted(conta_mensal, key=lambda r: r["date_start"]):
        mes = r["date_start"][:7]
        if mes not in meses_ok:
            continue
        rot, nome = rotulo_mes(mes)
        ativas = sorted({e for (e, mm) in celulas if mm == mes}, key=[x for x, _ in ESTRATEGIAS].index)
        meses.append(fecha(metricas(r), {"mes": mes, "rotulo": rot, "nome": nome, "estrategias": ativas}))

    linhas = [e for e, _ in ESTRATEGIAS if any(k[0] == e for k in celulas)]
    grade = {
        "meses": meses_ok,
        "linhas": linhas,
        "celulas": [fecha(v["m"], {"estrategia": e, "mes": mes, "campanhas": sorted(v["campanhas"])})
                    for (e, mes), v in sorted(celulas.items(), key=lambda kv: (linhas.index(kv[0][0]), kv[0][1]))],
    }

    # ---------------------------------------------------- estratégias
    estrategias = []
    for e, grupo in ESTRATEGIAS:
        cs = [c for c in campanhas if c["estrategia"] == e]
        if not cs:
            continue
        m = zero()
        for c in camp_total:
            if estr_de.get(c["campaign_id"]) == e:
                soma(m, metricas(c))
        estrategias.append(fecha(m, {
            "estrategia": e,
            "grupo": grupo,
            "principal": PRINCIPAL[e],
            "campanhas": len(cs),
            "alcanceSomado": len(cs) > 1,
            "meses": sorted({mm for c in cs for mm in c["meses"]}),
            "comecouAntes": any(c["comecouAntes"] for c in cs),
        }))

    # ---------------------------------------------------- público (idade × gênero), só informado
    pub = defaultdict(zero)
    ignorado = 0.0
    for r in publico_raw:
        if r.get("age") not in FAIXAS or r.get("gender") not in ("female", "male"):
            ignorado += num(r.get("impressions"))
            continue
        soma(pub[(r["age"], r["gender"])], metricas(r))
    publico = [{"idade": a, "genero": g, **{k: (round(v, 2) if k == "investimento" else round(v)) for k, v in pub[(a, g)].items()}}
               for a in FAIXAS for g in ("female", "male") if (a, g) in pub]
    tot_pub_imp = sum(p["impressoes"] for p in publico) + ignorado
    publico_nota = {"impressoesNaoInformadas": round(ignorado), "pctNaoInformado": round(ignorado / tot_pub_imp, 4) if tot_pub_imp else 0}

    # ---------------------------------------------------- criativos
    os.makedirs(IMG_PUB, exist_ok=True)
    for f in os.listdir(IMG_PUB):
        if f.endswith(".jpg"):
            os.remove(os.path.join(IMG_PUB, f))
    candidatos = []
    for a in anuncios:
        cr = criativos_raw.get(a["ad_id"])
        if a["ad_id"] in EXCLUIR_CRIATIVOS or not cr or not cr.get("arquivo"):
            continue
        e = estr_de.get(a.get("campaign_id"))
        if not e:
            continue
        origem = os.path.join(RAIZ, cr["arquivo"])
        if not os.path.exists(origem):
            continue
        c = cr.get("creative") or {}
        story = c.get("effective_object_story_id") or ""
        candidatos.append(fecha(metricas(a), {
            "id": a["ad_id"],
            "nome": a.get("ad_name", ""),
            "titulo": c.get("title") or "",
            "estrategia": e,
            "campanha": nome_curto(a.get("campaign_name", ""), e),
            "formato": "video" if (c.get("object_type") == "VIDEO" or c.get("video_id")) else "imagem",
            "link": f"https://www.facebook.com/{story}" if story else "",
            "imagem": f"/criativos/{a['ad_id']}.jpg",
            "_origem": origem,
            "_md5": md5(origem),
        }))
    candidatos.sort(key=lambda c: -c["impressoes"])
    escolhidos, vistos = [], defaultdict(set)
    por_estr = defaultdict(int)
    for c in candidatos:
        if c["_md5"] in vistos[c["estrategia"]] or por_estr[c["estrategia"]] >= CRIATIVOS_POR_ESTRATEGIA:
            continue
        vistos[c["estrategia"]].add(c["_md5"])
        por_estr[c["estrategia"]] += 1
        escolhidos.append(c)
    criativos = []
    for c in escolhidos:
        copia_reduzida(c.pop("_origem"), os.path.join(IMG_PUB, f"{c['id']}.jpg"))
        criativos.append(c)  # _md5 fica para a deduplicação global no front
    print(f"criativos: {len(criativos)} copiados para public/criativos/ " + str(dict(por_estr)))

    snapshot = {
        "cliente": "Hospital Santa Izabel",
        "titulo": "Relatório de Desempenho · Meta 2026",
        "periodo": PERIODO,
        "atualizadoEm": datetime.fromtimestamp(os.path.getmtime(os.path.join(RAW, "conta_total.json")), tz=timezone.utc).isoformat(),
        "totais": totais,
        "meses": meses,
        "estrategias": estrategias,
        "grade": grade,
        "campanhas": campanhas,
        "publico": publico,
        "publicoNota": publico_nota,
        "criativos": [{**{k: v for k, v in c.items() if k != "_md5"}, "chaveImagem": c["_md5"][:12]} for c in criativos],
        "avisos": avisos,
    }
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, ensure_ascii=False, indent=1)
    print(f"✓ {os.path.relpath(SAIDA, RAIZ)} · investimento R$ {totais['investimento']:,.2f} · {len(campanhas)} campanhas · meses {meses_ok}")
    for a in avisos:
        print("⚠", a, file=sys.stderr)


if __name__ == "__main__":
    main()

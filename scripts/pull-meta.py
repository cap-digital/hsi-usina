#!/usr/bin/env python3
"""
Puxa os dados crus da Meta (Graph API) do Hospital Santa Izabel / USINA para data/meta-raw/.

Conta act_471445560502098, período 2026-01-01 → 2026-10-31. Só biblioteca padrão.

Uso:
  python3 scripts/pull-meta.py              # puxa tudo + baixa criativos + imprime resumo
  python3 scripts/pull-meta.py --resumo     # só imprime o resumo a partir de data/meta-raw/

Token: META_TOKEN no .env.local (ou variável de ambiente). Nunca commitar.

Saídas (data/meta-raw/):
  campanhas_mensal.json     level=campaign, time_increment=monthly
  conta_mensal.json         level=account,  time_increment=monthly
  conta_total.json          level=account,  período todo (alcance único)
  campanhas_total.json      level=campaign, período todo (alcance único por campanha)
  publico_idade_genero.json level=campaign, breakdowns=age,gender
  anuncios.json             level=ad, período todo
  campanhas_info.json       objetivo/status/start_time/stop_time das campanhas (para o "período")
  criativos.json            creative dos 40 anúncios com mais impressões + URL/arquivo baixado
Imagens: data/criativos-raw/<ad_id>.jpg
"""

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

API_VERSION = os.environ.get("META_API_VERSION", "v27.0")
BASE = f"https://graph.facebook.com/{API_VERSION}"
CONTA = "act_471445560502098"
TIME_RANGE = {"since": "2026-01-01", "until": "2026-10-31"}
TOP_CRIATIVOS = 40

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_RAW = os.path.join(RAIZ, "data", "meta-raw")
DIR_IMG = os.path.join(RAIZ, "data", "criativos-raw")

F_CAMPANHA_MENSAL = [
    "campaign_id", "campaign_name", "objective", "spend", "impressions", "reach", "frequency",
    "clicks", "inline_link_clicks", "cpm", "ctr", "actions", "video_thruplay_watched_actions",
    "video_p25_watched_actions", "video_p50_watched_actions", "video_p75_watched_actions",
    "video_p100_watched_actions",
]
F_CONTA = ["spend", "impressions", "reach", "clicks", "inline_link_clicks", "actions"]
F_PUBLICO = ["campaign_id", "campaign_name", "spend", "impressions", "reach", "clicks", "inline_link_clicks", "actions"]
F_ANUNCIO = ["ad_id", "ad_name", "adset_name", "campaign_id", "campaign_name", "spend", "impressions", "reach",
             "clicks", "inline_link_clicks", "cpm", "actions"]
F_CREATIVE = "id,title,body,object_type,image_url,image_hash,thumbnail_url,video_id,effective_object_story_id,object_story_spec,asset_feed_spec"


# ---------------------------------------------------------------- HTTP

def token():
    t = os.environ.get("META_TOKEN")
    if t:
        return t.strip()
    env = os.path.join(RAIZ, ".env.local")
    if os.path.exists(env):
        for linha in open(env, encoding="utf-8"):
            if linha.strip().startswith("META_TOKEN="):
                return linha.split("=", 1)[1].strip().strip('"').strip("'")
    sys.exit("META_TOKEN não encontrado (.env.local ou ambiente).")


TOKEN = None


def get(url_ou_path, params=None, tentativas=6):
    """GET com retry para limite de taxa / erros transitórios. Aceita path relativo ou URL completa (paging.next)."""
    if url_ou_path.startswith("http"):
        url = url_ou_path
    else:
        p = dict(params or {})
        p["access_token"] = TOKEN
        url = f"{BASE}/{url_ou_path.lstrip('/')}?{urllib.parse.urlencode(p)}"
    espera = 5
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            corpo = e.read().decode("utf-8", "replace")
            try:
                err = json.loads(corpo).get("error", {})
            except ValueError:
                err = {"message": corpo[:300]}
            codigo = err.get("code")
            transitorio = (e.code >= 500 and codigo != 100) or codigo in (1, 2, 4, 17, 32, 613, 80000, 80004) or err.get("is_transient")
            if transitorio and i < tentativas - 1:
                print(f"  ! {codigo} {err.get('message', '')[:120]} — nova tentativa em {espera}s", file=sys.stderr)
                time.sleep(espera)
                espera = min(espera * 2, 120)
                continue
            raise RuntimeError(f"Graph API {e.code} code={codigo}: {err.get('message')}") from None
        except (urllib.error.URLError, TimeoutError) as e:
            if i < tentativas - 1:
                time.sleep(espera)
                espera = min(espera * 2, 120)
                continue
            raise


def todas_paginas(path, params):
    linhas, resp = [], get(path, params)
    while True:
        linhas.extend(resp.get("data", []))
        nxt = resp.get("paging", {}).get("next")
        if not nxt:
            return linhas
        resp = get(nxt)


def insights(level, fields, time_increment=None, breakdowns=None):
    params = {
        "level": level,
        "fields": ",".join(fields),
        "time_range": json.dumps(TIME_RANGE),
        "limit": 500,
        "use_unified_attribution_setting": "true",
    }
    if time_increment:
        params["time_increment"] = time_increment
    if breakdowns:
        params["breakdowns"] = breakdowns
    return todas_paginas(f"{CONTA}/insights", params)


def salvar(nome, dados):
    os.makedirs(DIR_RAW, exist_ok=True)
    with open(os.path.join(DIR_RAW, nome), "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=1)
    n = len(dados) if isinstance(dados, list) else 1
    print(f"  ✓ {nome} ({n} linhas)")


def baixar(url, destino):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        dados = r.read()
    with open(destino, "wb") as f:
        f.write(dados)
    return len(dados)


# ---------------------------------------------------------------- criativos

def hashes_do_creative(c):
    """image_hash direto ou dentro de object_story_spec / asset_feed_spec (carrossel/dinâmico)."""
    hs = []
    if c.get("image_hash"):
        hs.append(c["image_hash"])
    oss = c.get("object_story_spec") or {}
    ld = oss.get("link_data") or {}
    if ld.get("image_hash"):
        hs.append(ld["image_hash"])
    for ch in ld.get("child_attachments") or []:
        if ch.get("image_hash"):
            hs.append(ch["image_hash"])
    pd = oss.get("photo_data") or {}
    if pd.get("image_hash"):
        hs.append(pd["image_hash"])
    for im in (c.get("asset_feed_spec") or {}).get("images") or []:
        if im.get("hash"):
            hs.append(im["hash"])
    return list(dict.fromkeys(hs))


def video_do_creative(c):
    if c.get("video_id"):
        return c["video_id"]
    vd = (c.get("object_story_spec") or {}).get("video_data") or {}
    if vd.get("video_id"):
        return vd["video_id"]
    for v in (c.get("asset_feed_spec") or {}).get("videos") or []:
        if v.get("video_id"):
            return v["video_id"]
    return None


def maior_thumb_video(video_id):
    try:
        th = get(f"{video_id}/thumbnails", {"fields": "uri,width,height,is_preferred"}).get("data", [])
        if th:
            melhor = max(th, key=lambda t: (t.get("width", 0) * t.get("height", 0), t.get("is_preferred", False)))
            return melhor.get("uri"), f"video_thumbnail {melhor.get('width')}x{melhor.get('height')}"
    except RuntimeError as e:
        print(f"  ! thumbnails do vídeo {video_id}: {e}", file=sys.stderr)
    try:
        v = get(video_id, {"fields": "picture"})
        if v.get("picture"):
            return v["picture"], "video_picture"
    except RuntimeError:
        pass
    return None, None


def thumb_creative_grande(creative_id):
    """thumbnail_url do creative pedida em 1080 px — funciona mesmo sem permissão no vídeo/post da página."""
    try:
        c = get(creative_id, {"fields": "thumbnail_url", "thumbnail_width": 1080, "thumbnail_height": 1920})
        if c.get("thumbnail_url"):
            return c["thumbnail_url"], "creative.thumbnail_url 1080px"
    except RuntimeError as e:
        print(f"  ! thumbnail grande do creative {creative_id}: {e}", file=sys.stderr)
    return None, None


def para_jpeg(caminho):
    """O fbcdn às vezes entrega PNG/AVIF; converte para JPEG de verdade com o sips (macOS), se houver."""
    with open(caminho, "rb") as f:
        cab = f.read(3)
    if cab == b"\xff\xd8\xff":
        return
    import shutil
    import subprocess
    if shutil.which("sips"):
        tmp = caminho + ".tmp.jpg"
        r = subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "92", caminho, "--out", tmp],
                           capture_output=True)
        if r.returncode == 0 and os.path.exists(tmp):
            os.replace(tmp, caminho)
            return
    print(f"  ! {os.path.basename(caminho)} não é JPEG e não foi convertido", file=sys.stderr)


def puxar_criativos(anuncios):
    top = sorted(anuncios, key=lambda a: float(a.get("impressions") or 0), reverse=True)[:TOP_CRIATIVOS]
    os.makedirs(DIR_IMG, exist_ok=True)

    # 1) creative de cada anúncio
    regs = []
    for a in top:
        ad = get(a["ad_id"], {"fields": f"id,name,creative{{{F_CREATIVE}}}"})
        regs.append({"ad_id": a["ad_id"], "ad_name": a.get("ad_name"), "campaign_name": a.get("campaign_name"),
                     "impressions": a.get("impressions"), "creative": ad.get("creative", {})})

    # 2) URLs em tamanho cheio pelos hashes (uma chamada só)
    todos_hashes = sorted({h for r in regs for h in hashes_do_creative(r["creative"])})
    url_por_hash = {}
    for i in range(0, len(todos_hashes), 50):
        lote = todos_hashes[i:i + 50]
        for im in todas_paginas(f"{CONTA}/adimages", {"hashes": json.dumps(lote), "fields": "hash,url,width,height"}):
            url_por_hash[im["hash"]] = im

    # 3) escolher a melhor fonte e baixar
    ok = 0
    for r in regs:
        c = r["creative"]
        url, fonte = None, None
        vid = video_do_creative(c)
        if vid:
            url, fonte = maior_thumb_video(vid)
        if not url:
            for h in hashes_do_creative(c):
                if h in url_por_hash and url_por_hash[h].get("url"):
                    im = url_por_hash[h]
                    url, fonte = im["url"], f"adimages {im.get('width')}x{im.get('height')}"
                    break
        if not url and c.get("id"):
            url, fonte = thumb_creative_grande(c["id"])
        if not url and c.get("image_url"):
            url, fonte = c["image_url"], "creative.image_url"
        if not url and c.get("thumbnail_url"):
            url, fonte = c["thumbnail_url"], "creative.thumbnail_url (baixa resolução)"
        r["imagem_fonte"], r["imagem_url"], r["arquivo"] = fonte, url, None
        if url:
            destino = os.path.join(DIR_IMG, f"{r['ad_id']}.jpg")
            try:
                baixar(url, destino)
                para_jpeg(destino)
                r["arquivo"] = os.path.relpath(destino, RAIZ)
                ok += 1
            except Exception as e:  # noqa: BLE001
                r["erro_download"] = str(e)
        print(f"  {'✓' if r['arquivo'] else '✗'} {r['ad_id']} {fonte or 'sem imagem'}")
    salvar("criativos.json", regs)
    print(f"  → {ok}/{len(regs)} criativos baixados em data/criativos-raw/")


# ---------------------------------------------------------------- pull

def puxar():
    global TOKEN
    TOKEN = token()
    print(f"Graph API {API_VERSION} · {CONTA} · {TIME_RANGE['since']} → {TIME_RANGE['until']}")
    salvar("campanhas_mensal.json", insights("campaign", F_CAMPANHA_MENSAL, "monthly"))
    salvar("conta_mensal.json", insights("account", F_CONTA, "monthly"))
    salvar("conta_total.json", insights("account", F_CONTA))
    salvar("campanhas_total.json", insights("campaign", F_CAMPANHA_MENSAL))
    salvar("publico_idade_genero.json", insights("campaign", F_PUBLICO, breakdowns="age,gender"))
    anuncios = insights("ad", F_ANUNCIO)
    salvar("anuncios.json", anuncios)

    # metadados das campanhas (start/stop para o "período")
    ids = sorted({a["campaign_id"] for a in anuncios} | {
        c["campaign_id"] for c in json.load(open(os.path.join(DIR_RAW, "campanhas_total.json")))})
    info = []
    for cid in ids:  # o parâmetro ?ids= foi descontinuado na v26+
        info.append(get(cid, {"fields": "id,name,objective,status,effective_status,start_time,stop_time,created_time"}))
    salvar("campanhas_info.json", info)

    puxar_criativos(anuncios)


# ---------------------------------------------------------------- resumo

def acao(row, tipo):
    for a in row.get("actions") or []:
        if a.get("action_type") == tipo:
            return float(a.get("value") or 0)
    return 0.0


def brl(v):
    return "R$ " + f"{v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def inteiro(v):
    return f"{int(round(v)):,}".replace(",", ".")


def resumo():
    ld = lambda n: json.load(open(os.path.join(DIR_RAW, n), encoding="utf-8"))  # noqa: E731
    total = ld("conta_total.json")
    mensal = ld("conta_mensal.json")
    camp_tot = ld("campanhas_total.json")
    camp_mes = ld("campanhas_mensal.json")
    info = {c["id"]: c for c in ld("campanhas_info.json")} if os.path.exists(os.path.join(DIR_RAW, "campanhas_info.json")) else {}

    t = total[0] if total else {}
    print("\n=== TOTAL DA CONTA (conta_total.json) ===")
    print(f"Investimento        {brl(float(t.get('spend', 0)))}")
    print(f"Impressões          {inteiro(float(t.get('impressions', 0)))}")
    print(f"Alcance (único)     {inteiro(float(t.get('reach', 0)))}")
    print(f"Cliques (todos)     {inteiro(float(t.get('clicks', 0)))}")
    print(f"Cliques no link     {inteiro(float(t.get('inline_link_clicks', 0)))}")
    print(f"Engajamento c/ post {inteiro(acao(t, 'post_engagement'))}")
    soma_mensal = sum(float(m.get("spend", 0)) for m in mensal)
    print(f"(conferência: soma dos meses = {brl(soma_mensal)})")

    print("\n=== MÊS A MÊS (conta_mensal.json) ===")
    print(f"{'Mês':<9}{'Investimento':>16}{'Impressões':>14}{'Alcance':>12}")
    por_mes = {m["date_start"][:7]: m for m in mensal}
    sem = []
    for mes in range(1, 11):
        k = f"2026-{mes:02d}"
        m = por_mes.get(k)
        if not m or float(m.get("spend", 0)) == 0 and float(m.get("impressions", 0)) == 0:
            sem.append(k)
            print(f"{k:<9}{'—':>16}{'—':>14}{'—':>12}")
        else:
            print(f"{k:<9}{brl(float(m['spend'])):>16}{inteiro(float(m['impressions'])):>14}{inteiro(float(m.get('reach', 0))):>12}")
    print(f"\nMeses sem veiculação: {', '.join(sem) if sem else 'nenhum'}")

    meses_por_camp = {}
    for r in camp_mes:
        if float(r.get("spend", 0)) > 0 or float(r.get("impressions", 0)) > 0:
            meses_por_camp.setdefault(r["campaign_id"], []).append(r["date_start"][:7])

    print("\n=== CAMPANHAS (campanhas_total.json, por investimento) ===")
    for c in sorted(camp_tot, key=lambda c: float(c.get("spend", 0)), reverse=True):
        meses = sorted(meses_por_camp.get(c["campaign_id"], []))
        veic = f"{meses[0]}→{meses[-1]}" if meses else "—"
        i = info.get(c["campaign_id"], {})
        cfg = f"{(i.get('start_time') or '')[:10]}→{(i.get('stop_time') or 'aberta')[:10]}" if i else ""
        print(f"{brl(float(c.get('spend', 0))):>14}  {c.get('objective', ''):<22} veic. {veic:<17} config {cfg:<23} {c['campaign_name']}")
    print(f"({len(camp_tot)} campanhas)")

    cri = os.path.join(DIR_RAW, "criativos.json")
    if os.path.exists(cri):
        regs = json.load(open(cri, encoding="utf-8"))
        ok = sum(1 for r in regs if r.get("arquivo"))
        print(f"\nCriativos baixados: {ok}/{len(regs)}")
        fontes = {}
        for r in regs:
            fontes[(r.get("imagem_fonte") or "sem imagem").split(" ")[0]] = fontes.get((r.get("imagem_fonte") or "sem imagem").split(" ")[0], 0) + 1
        print("  por fonte: " + ", ".join(f"{k}={v}" for k, v in fontes.items()))


if __name__ == "__main__":
    if "--resumo" not in sys.argv:
        puxar()
    resumo()

#!/usr/bin/env python3
"""루트 4페이지 → dist/index.html 단일 파일로 합친다.
   드래그 배포용 / 아티팩트용. 깃 배포에는 필요 없다."""
import re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
S = ROOT
OUT = ROOT / "dist" / "index.html"

def slice_between(text, start, end):
    i = text.index(start) + len(start)
    j = text.index(end, i)
    return text[i:j]

css      = (S / "assets/base.css").read_text(encoding="utf-8")
channels = (S / "assets/channels.js").read_text(encoding="utf-8")

PAGES = [
    ("calc",     "계산기",    "index.html"),
    ("rates",    "요금표",    "rates.html"),
    ("measured", "실측 기록", "measured.html"),
    ("status",   "현재 설정", "status.html"),
]

bodies, scripts = [], []
for key, label, fname in PAGES:
    src = (S / fname).read_text(encoding="utf-8")

    # <body> 안에서 shell.js 로드 뒤 ~ 마지막 <script> 앞까지가 마크업
    after_shell = src.index('<script src="assets/shell.js"></script>') + len('<script src="assets/shell.js"></script>')
    last_script = src.rindex("<script>")
    markup = src[after_shell:last_script].strip()

    # 마지막 <script> 블록이 그 페이지의 로직
    logic = slice_between(src[last_script:], "<script>", "</script>").strip()
    if logic.startswith('"use strict";'):
        logic = logic[len('"use strict";'):].strip()

    # 계산기는 스크립트가 두 개(본체 + 채널 전환) → 둘 다 가져온다
    if key == "calc":
        first = src.index("<script>", after_shell)
        logic = slice_between(src[first:], "<script>", "</script>").strip()
        if logic.startswith('"use strict";'):
            logic = logic[len('"use strict";'):].strip()
        second = src.index("<script>", src.index("</script>", first))
        logic += "\n\n" + slice_between(src[second:], "<script>", "</script>").strip()

    # 마운트 id 충돌 방지
    markup = markup.replace('id="chtabs"', f'id="chtabs-{key}"')
    markup = markup.replace('id="chBody"', f'id="chBody-{key}"')
    logic  = logic.replace('"chtabs"', f'"chtabs-{key}"').replace('"chBody"', f'"chBody-{key}"')

    # 페이지 간 링크 → 탭 전환
    for k, _, f in PAGES:
        markup = markup.replace(f'href="{f}#', f'href="#{k}--').replace(f'href="{f}"', f'href="#{k}"')
        logic  = logic.replace(f'{f}#', f'#{k}--').replace(f'href=\\"{f}\\"', f'href=\\"#{k}\\"')

    bodies.append(f'<div class="page" id="pg-{key}" {"" if key=="calc" else "hidden"}>\n{markup}\n</div>')
    scripts.append(f"/* ── {label} ── */\n(function(){{\n{logic}\n}})();")

nav = "".join(
    f'<button class="pgtab" data-pg="{k}" aria-pressed="{str(k=="calc").lower()}">{l}</button>'
    for k, l, _ in PAGES
)

html = f"""<title>OTA 요금 콘솔</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap">
<style>
{css}
/* 단일 파일 전용 — 페이지 탭 */
.pgtab{{font:inherit;font-size:13px;color:var(--text-dim);padding:7px 12px;border-radius:7px;
  border:0;background:transparent;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap}}
.pgtab:hover{{background:var(--sunk);color:var(--text)}}
.pgtab[aria-pressed="true"]{{background:var(--brass-soft);color:var(--brass);font-weight:600}}
.pgtab:focus-visible{{outline:2px solid var(--brass);outline-offset:2px}}
.page[hidden]{{display:none}}
</style>

<div class="topbar"><div class="topbar-in">
  <span class="brand">평택 스테이 호텔 <em>OTA 요금 콘솔</em></span>
  <nav class="nav">{nav}</nav>
</div></div>

{chr(10).join(bodies)}

<script>
{channels}
</script>

<script>
const STATUS_LABEL = {{ live: "검증 완료", partial: "일부 검증", planned: "예정" }};
function statusBadge(s) {{ return `<span class="badge ${{s}}">${{STATUS_LABEL[s]}}</span>`; }}
const WON = n => (n === null || n === undefined) ? "—" : Math.round(n).toLocaleString("ko-KR");

function renderChannelTabs(mountId, current, onPick, opts) {{
  const allowPlanned = !!(opts && opts.allowPlanned);
  const el = document.getElementById(mountId);
  if (!el) return;
  el.className = "chtabs";
  el.innerHTML = CHANNEL_ORDER.map(k => {{
    const c = CHANNELS[k];
    const off = !allowPlanned && c.status === "planned";
    return `<button class="chtab" data-k="${{k}}" data-status="${{c.status}}"
      aria-pressed="${{k === current}}" ${{off ? "disabled" : ""}}
      title="${{off ? "아직 계산 검증 전입니다" : c.en}}"><i class="dot"></i>${{c.name}}</button>`;
  }}).join("");
  el.querySelectorAll(".chtab").forEach(b => {{ b.onclick = () => onPick(b.dataset.k); }});
}}
</script>

{chr(10).join(f"<script>{chr(10)}{s}{chr(10)}</script>" for s in scripts)}

<script>
/* ── 페이지 라우터 ── */
(function () {{
  const tabs = [...document.querySelectorAll(".pgtab")];
  function show(key, push) {{
    if (!document.getElementById("pg-" + key)) key = "calc";
    tabs.forEach(t => t.setAttribute("aria-pressed", String(t.dataset.pg === key)));
    document.querySelectorAll(".page").forEach(p => {{ p.hidden = p.id !== "pg-" + key; }});
    window.scrollTo(0, 0);
    if (push) history.replaceState(null, "", "#" + key);
  }}
  tabs.forEach(t => t.onclick = () => show(t.dataset.pg, true));
  document.addEventListener("click", e => {{
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const key = a.getAttribute("href").slice(1).split("--")[0];
    if (document.getElementById("pg-" + key)) {{ e.preventDefault(); show(key, true); }}
  }});
  const initial = (location.hash || "#calc").slice(1).split("--")[0];
  show(initial, false);
}})();
</script>
"""
OUT.parent.mkdir(exist_ok=True)

# ── ① 아티팩트용 조각 (claude.ai Artifact 는 head/body 를 알아서 감싼다)
ART = OUT.parent / "artifact.html"
ART.write_text(html, encoding="utf-8")

# ── ② 일반 웹서버용 완전한 문서 (드래그 배포·아무 호스팅이나)
import base64
svg = (S / "assets/favicon.svg").read_text(encoding="utf-8")
fav = base64.b64encode(svg.encode("utf-8")).decode("ascii")
i = html.index("</title>") + len("</title>")
j = html.index("<style>")
doc = (
    '<!doctype html>\n<html lang="ko">\n<head>\n'
    '<meta charset="utf-8">\n'
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
    '<meta name="theme-color" content="#ECEFEA" media="(prefers-color-scheme:light)">\n'
    '<meta name="theme-color" content="#0C1214" media="(prefers-color-scheme:dark)">\n'
    '<meta name="description" content="\ud3c9\ud0dd \uc2a4\ud14c\uc774 \ud638\ud154 OTA \uc694\uae08 \ucf58\uc194">\n'
    '<meta name="robots" content="noindex, nofollow">\n'
    f'<link rel="icon" href="data:image/svg+xml;base64,{fav}">\n'
    + html[:i] + html[i:j].strip() + "\n</head>\n<body>\n"
    + html[j:].strip() + "\n</body>\n</html>\n"
)
OUT.write_text(doc, encoding="utf-8")

print(f"{ART}  {len(html):,} chars  (\uc544\ud2f0\ud329\ud2b8\uc6a9 \uc870\uac01)")
print(f"{OUT}  {len(doc):,} chars  (\ub2e8\uc77c \ud30c\uc77c \ubc30\ud3ec\uc6a9)")

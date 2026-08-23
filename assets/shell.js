/* 공용 셸 — 상단바를 그린다. 각 페이지는 <body data-page="..."> 만 지정하면 된다. */
(function () {
  const PAGES = [
    ["index.html",    "계산기"],
    ["rates.html",    "요금표"],
    ["measured.html", "실측 기록"],
    ["status.html",   "현재 설정"],
  ];
  const here = (location.pathname.split("/").pop() || "index.html");
  const nav = PAGES.map(([href, label]) => {
    const cur = href === here || (here === "" && href === "index.html");
    return `<a href="${href}"${cur ? ' aria-current="page"' : ""}>${label}</a>`;
  }).join("");

  document.body.insertAdjacentHTML("afterbegin", `
    <div class="topbar"><div class="topbar-in">
      <span class="brand">평택 스테이 호텔 <em>OTA 요금 콘솔</em></span>
      <nav class="nav">${nav}</nav>
    </div></div>`);
})();

/* 채널 탭 — onPick(key) 을 주면 클릭 시 호출한다. planned 채널은 비활성. */
function renderChannelTabs(mountId, current, onPick, opts) {
  const allowPlanned = !!(opts && opts.allowPlanned);
  const el = document.getElementById(mountId);
  if (!el) return;
  el.className = "chtabs";
  el.innerHTML = CHANNEL_ORDER.map(k => {
    const c = CHANNELS[k];
    const off = !allowPlanned && c.status === "planned";
    return `<button class="chtab" data-k="${k}" data-status="${c.status}"
      aria-pressed="${k === current}" ${off ? "disabled" : ""}
      title="${off ? "아직 계산 검증 전입니다" : c.en}"><i class="dot"></i>${c.name}</button>`;
  }).join("");
  el.querySelectorAll(".chtab").forEach(b => {
    b.onclick = () => onPick(b.dataset.k);
  });
}

const STATUS_LABEL = { live: "검증 완료", partial: "일부 검증", planned: "예정" };
function statusBadge(s) { return `<span class="badge ${s}">${STATUS_LABEL[s]}</span>`; }
const WON = n => (n === null || n === undefined) ? "—" : Math.round(n).toLocaleString("ko-KR");

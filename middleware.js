/* ══════════════════════════════════════════════════════════════
   접근 보호 — Vercel Edge Middleware

   이 사이트에는 호텔의 요금 전략이 그대로 들어 있다. 프로모션 ID와
   적용 상태, 보수 구성, 채널별 CMS, 입금가 하한, 실제 예약 건까지.
   URL만 알면 누구나 볼 수 있는 상태로 두면 안 되는 내용이다.

   브라우저에서 자바스크립트로 비밀번호를 검사하는 방식은 소용이 없다.
   파일이 이미 내려간 뒤에 가리는 것뿐이라 소스 보기 한 번이면 뚫린다.
   그래서 파일을 주기 전에, Edge 에서 막는다.

   ── 켜는 법 ──────────────────────────────────────────────
   Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
     SITE_USER   아이디
     SITE_PASS   비밀번호
   둘 다 Production 에 넣고 저장한 뒤 재배포한다.
   환경변수는 배포 시점에 주입되므로 저장만 하면 반영되지 않는다.

   두 값이 하나라도 비어 있으면 사이트를 열어두지 않고 503 으로 막는다.
   설정을 빠뜨린 채 요금 전략이 공개되는 것보다, 잠깐 안 열리는 편이 낫다.
   ══════════════════════════════════════════════════════════════ */

export const config = {
  // _vercel 내부 경로만 빼고 전부 보호한다. favicon 도 예외로 두지 않는다.
  matcher: ["/((?!_vercel/).*)"],
};

/* 비교에 걸리는 시간으로 값을 추측당하지 않도록 전체를 끝까지 훑는다.
   길이가 다르면 어차피 틀린 값이라 바로 돌려보낸다. */
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized(message) {
  return new Response(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="OTA 요금 콘솔", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export default function middleware(request) {
  const user = process.env.SITE_USER;
  const pass = process.env.SITE_PASS;

  // 자격 정보가 없으면 열지 않는다 — 잠긴 채로 두는 쪽이 안전하다
  if (!user || !pass) {
    console.error("[auth] SITE_USER / SITE_PASS 가 설정되지 않아 사이트를 잠급니다.");
    return new Response(
      "접근 설정이 아직 끝나지 않았습니다.\n" +
        "Vercel 환경변수 SITE_USER / SITE_PASS 를 넣고 재배포해 주세요.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } }
    );
  }

  const header = request.headers.get("authorization");
  if (!header) return unauthorized("인증이 필요합니다.");

  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return unauthorized("인증 형식이 올바르지 않습니다.");

  let decoded;
  try {
    decoded = atob(encoded);
  } catch (e) {
    // 깨진 헤더를 보낸 것뿐이니 401 로 돌려보내되, 무슨 일이 있었는지는 남긴다
    console.warn("[auth] 인증 헤더를 해독하지 못했습니다:", e && e.message);
    return unauthorized("인증 정보를 읽지 못했습니다.");
  }

  // 비밀번호에 콜론이 들어갈 수 있으므로 첫 콜론에서만 자른다
  const sep = decoded.indexOf(":");
  if (sep < 1) return unauthorized("인증 정보를 읽지 못했습니다.");

  const okUser = safeEqual(decoded.slice(0, sep), user);
  const okPass = safeEqual(decoded.slice(sep + 1), pass);
  if (!(okUser && okPass)) return unauthorized("아이디 또는 비밀번호가 올바르지 않습니다.");

  // 통과 — 아무것도 반환하지 않으면 원래 요청이 그대로 진행된다
}

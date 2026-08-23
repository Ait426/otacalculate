# 평택 스테이 호텔 — OTA 요금 콘솔

정적 사이트. 빌드 과정 없음. Vercel이 이 저장소를 그대로 서빙합니다.

```
index.html      입금가 역산기 (채널 선택)
rates.html      요금표 — 채널별 CMS 비교, 요금세트, 아고다 기준요금 실측
measured.html   실측 기록 — 노출가 3점 테스트, 지역 타겟팅 확인, 검증 경로
status.html     현재 설정 — 프로모션·보수·점검 결과·채널 로드맵
assets/
  channels.js   ★ 채널 데이터. 채널을 늘릴 때 여기만 고친다
  base.css      디자인 시스템 + 계산기 스타일
  shell.js      상단바·채널 탭 공용 셸
  favicon.svg
tools/
  build_single.py   4페이지 → dist/ 단일 파일 2종 생성
dist/
  index.html    단일 파일 (드래그 배포용 · 완전한 문서)
  artifact.html 단일 파일 (claude.ai Artifact 용 조각)
vercel.json
```

## 배포

### 최초 1회

```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin main
```

그다음 [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → 이 저장소 선택.
Framework Preset은 **Other**, Build Command와 Output Directory는 **비워둔다**.

### 이후

```bash
git add -A && git commit -m "무엇을 바꿨는지" && git push
```

푸시할 때마다 Vercel이 자동 재배포합니다.

> ⚠️ **드래그 배포는 쓰지 마세요.** 대시보드 드래그는 `assets/` 하위 폴더를 빠뜨려서
> CSS·JS가 전부 404가 납니다(실제로 한 번 겪음). 꼭 드래그로 올려야 하면
> `python3 tools/build_single.py` 로 만든 **`dist/index.html` 한 파일만** 올리세요.

## 채널을 추가하려면

`assets/channels.js` 한 파일만 고칩니다.

```js
booking: {
  status: "live",     // "planned" → "live" 로 바꾸면 계산기 탭이 열린다
  tax: 1.1,           // 세금 배수. 모르면 null
  commission: { total: 15, parts: [...] },
  sigmaTheory: 0,
  ...
}
```

**모르는 값은 반드시 `null`로 두세요.** 추정치를 넣으면 틀린 답이 그대로 나갑니다.
각 채널의 `todo` 배열이 "무엇을 확인해야 하는지" 목록이고, status.html 로드맵에 그대로 나옵니다.

현재 상태: 아고다 `live` / 부킹닷컴·익스피디아·트립닷컴·국내 OTA `planned`.

## 검증 원칙

- 숫자는 화면에서 읽은 것만. 출처와 조회일을 같이 적는다.
- **설정 가능 범위**와 **현재 우리 설정**을 섞지 않는다.
- 결론이 뒤집히면 조용히 지우지 말고 무엇이 왜 바뀌었는지 남긴다.

마지막 갱신 2026-08-23.

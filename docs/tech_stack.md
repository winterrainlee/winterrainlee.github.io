---
created: 2026-04-27
updated: 2026-04-27
---

# 블로그 기술 스택

이 문서는 겨울비 블로그 운영에 사용되는 공개 가능한 기술 스택을 정리한다.

## 사이트 생성

- Astro 5
- MDX
- Astro Content Collections
- Markdown remark plugin: `src/lib/remark-wikilinks.mjs`

## 스타일

- Tailwind CSS
- 전역 스타일: `src/styles/global.css`
- 폰트: Google Fonts의 PT Sans, Source Code Pro

## 검색과 피드

- Pagefind
- RSS: `@astrojs/rss`
- Sitemap: `@astrojs/sitemap`

## 배포

- 정적 사이트 빌드 결과물: `dist`
- 공개 사이트: GitHub Pages
- 사이트 URL: `https://winterrainlee.github.io`

## 방명록

- 공개 페이지: `src/pages/guestbook.astro`
- 관리자 페이지: `src/pages/admin/guestbook.astro`
- 데이터 저장과 관리자 작업: Supabase
- 알림: Discord Incoming Webhook과 Supabase Edge Functions

운영 절차, secret, project ref, webhook 헤더, 수동 테스트 명령은 공개 문서에 두지 않고 `docs/private/`에 둔다.

## 기본 명령

```sh
npm run dev
npm run build
npm run preview
```

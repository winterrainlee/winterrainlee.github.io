# kciter.so 웹 구성 분석 및 도입 검토

작성일: 2026-04-26  
대상: https://kciter.so

## 요약

kciter.so는 서버 애플리케이션을 상시 구동하는 블로그라기보다, Astro 기반으로 빌드한 정적 사이트를 GitHub Pages/Fastly 계층에서 서비스하는 구성으로 보인다. 따라서 비슷한 블로그를 운영하기 위해 우리 서버에 데이터베이스, 백엔드 API 서버, 검색 서버, CMS 서버를 추가로 올릴 필요는 없다.

우리 서버가 이미 Nginx, Caddy, Apache 같은 정적 파일 서빙을 할 수 있다면 추가 런타임 서비스는 거의 없다. 필요한 것은 빌드 환경(Node.js), 정적 파일 배포 경로, 도메인/TLS 설정, 선택 사항으로 분석 도구와 CI 정도다.

## 관찰 근거

| 항목 | 관찰 내용 | 추정 |
| --- | --- | --- |
| HTML 자산 경로 | `/_astro/_slug_.BQuZgbvG.css`, `/_astro/index.DXdBhS_Z.css` | Astro 빌드 산출물 |
| CSS 클래스 | `mx-auto`, `w-[715px]`, `max-md:w-[90vw]`, `backdrop-blur-[44px]` 등 | Tailwind CSS 또는 Tailwind 호환 유틸리티 사용 |
| 검색 | `/pagefind/pagefind.js`를 동적 import하고 `pagefind.init()`, `pagefind.search()` 호출 | Pagefind 기반 정적 검색 |
| 피드 | `/feed.xml` 제공 | RSS 생성 |
| PWA 일부 | `/manifest.webmanifest`, favicon 제공 | 기본 웹 앱 메타 구성 |
| 분석 | `googletagmanager.com/gtag/js?id=G-7M8K7EBEDX` | Google Analytics 4 |
| 서버 헤더 | `server: GitHub.com`, `via: varnish`, `x-served-by: cache-...`, `x-cache` | GitHub Pages + Fastly 캐시 계층 |
| 응답 특성 | 정적 HTML, 정적 이미지, 정적 CSS 중심 | SSR/DB/API 없이 운영 가능 |

## 사이트 구조

첫 화면은 개인 프로필과 최신 글을 강조하는 좁은 폭의 매거진형 블로그다.

- 상단: 사이트명, `Timeline`, `Posts` 드롭다운, `Talks`, `About`, 검색, 소셜 링크
- 홈: 프로필, 최신 글 큰 카드, 최근 글 보조 카드, 추가 글 목록
- 섹션: `Articles`, `Bookshelf`, `Thoughts`, `Timeline`, `Talks`, `About`
- 글 상세: 제목, 작성일, 대표 이미지, 목차, 본문, 코드 블록, 이미지 캡션
- 배포 자산: 이미지가 `/images/...` 아래에 날짜/슬러그별로 구성됨

## 사용 기술 추정

### 확실도가 높은 기술

- Astro: `/_astro/` 빌드 자산과 `data-astro-cid-*` scoped style 속성이 HTML에 남아 있다.
- Tailwind CSS: HTML에 Tailwind 유틸리티 클래스가 직접 포함되어 있다.
- Pagefind: 검색 모달에서 `/pagefind/pagefind.js`를 불러와 정적 인덱스를 검색한다.
- GitHub Pages: HTTP 헤더의 `server: GitHub.com`이 이를 가리킨다.
- Fastly 캐시: GitHub Pages 앞단 캐시로 보이는 `via: varnish`, `x-served-by`, `x-fastly-request-id` 헤더가 있다.
- Google Analytics 4: `gtag.js`와 측정 ID가 포함되어 있다.

### 가능성이 높은 기술

- Markdown 또는 MDX 기반 콘텐츠: Astro 블로그 구조와 글 페이지 구성상 가능성이 높다.
- Astro Content Collections: 글, 책, 생각, 타임라인 같은 유형별 콘텐츠를 다루기에 적합하다.
- GitHub Actions: GitHub Pages 배포 사이트라면 정적 빌드 자동화에 사용했을 가능성이 높다. 단, 공개 HTML만으로 확정할 수는 없다.

## 우리 블로그에 차용할 수 있는 설계

### 정보 구조

- `Articles`: 긴 기술 글
- `Thoughts`: 짧은 메모나 로그
- `Bookshelf`: 책, 번역, 리뷰, 읽은 기록
- `Timeline`: 활동 내역, 발표, 프로젝트 업데이트
- `Talks`: 발표 자료와 영상 링크
- `About`: 프로필과 연락처

### 화면 패턴

- 본문 폭은 약 715px로 제한해 긴 글 가독성을 우선한다.
- 홈은 “최신 글 1개 + 보조 글 2개 + 섹션별 목록” 구조를 사용한다.
- 검색은 별도 페이지가 아니라 모달로 제공한다.
- 모바일에서는 Posts 하위 탭을 별도로 펼치며, 소셜 아이콘 일부를 숨긴다.

### 콘텐츠 운영

- 글마다 `title`, `description`, `date`, `category`, `thumbnail`, `tags`, `draft` 같은 frontmatter를 둔다.
- 이미지 폴더는 `public/images/YYYY-MM-DD-slug/`처럼 글 단위로 분리한다.
- 빌드 시 RSS, 사이트맵, Pagefind 검색 인덱스를 생성한다.

## 서버 도입 필요성

### 필수로 새로 도입할 서비스

없음. 정적 사이트로 구현하면 런타임에는 HTML, CSS, JS, 이미지 파일만 서빙하면 된다.

### 서버에 필요한 최소 조건

- 정적 파일 서빙: Nginx/Caddy/Apache 또는 S3 호환 스토리지 + CDN
- TLS 인증서: Let's Encrypt, Cloudflare, 또는 호스팅 제공 인증서
- 도메인 DNS: 블로그 도메인의 A/CNAME 설정
- 빌드 산출물 배포 경로: 예를 들어 `/var/www/blog` 또는 GitHub Pages

### 빌드 환경에 필요한 것

- Node.js LTS
- 패키지 매니저: pnpm, npm, yarn 중 하나
- Astro 프로젝트
- Tailwind CSS
- Pagefind
- RSS/사이트맵 생성 패키지

Node.js는 빌드 시점에만 필요하다. 서버가 빌드까지 담당하지 않고 CI에서 빌드한 `dist/`만 받아서 서비스한다면 운영 서버에 Node.js를 설치하지 않아도 된다.

## 선택 도입 항목

| 목적 | 후보 | 도입 여부 |
| --- | --- | --- |
| 정적 검색 | Pagefind | 권장. 별도 서버 없이 검색 가능 |
| 방문 분석 | Google Analytics, Plausible, Umami | 선택. 개인정보/운영 철학에 따라 결정 |
| 댓글 | Giscus, Utterances, 자체 댓글 API | 선택. kciter.so에는 뚜렷한 댓글 기능이 보이지 않음 |
| 배포 자동화 | GitHub Actions, Forgejo Actions, Woodpecker CI | 권장 |
| CDN | Cloudflare, Fastly, GitHub Pages 기본 CDN | 트래픽이 크거나 해외 접속을 고려하면 권장 |
| 이미지 최적화 | Astro Image, Sharp, CDN 이미지 변환 | 권장. 썸네일 많은 홈 화면에 유리 |
| CMS | Decap CMS, TinaCMS, Sanity, Contentful | 선택. Markdown 직접 관리가 불편할 때만 |

## 권장 구현안

### 가장 단순한 구성

```text
Git repository
  -> GitHub Actions 또는 로컬 빌드
  -> Astro build
  -> dist/
  -> GitHub Pages 또는 기존 서버의 정적 디렉터리
```

이 구성은 kciter.so와 가장 유사하며 운영 부담이 낮다.

### 우리 서버에서 직접 운영하는 구성

```text
Git repository
  -> CI 또는 서버 내 빌드
  -> /var/www/blog/dist
  -> Nginx/Caddy
  -> HTTPS
  -> CDN(optional)
```

운영 서버에 추가로 필요한 상시 프로세스는 없다. 배포 자동화를 위해 webhook receiver를 둘 수는 있지만 필수는 아니다.

## 구현 시 주의할 점

- 디자인은 참고하되, 레이아웃/색/타이포그래피를 그대로 복제하기보다 우리 블로그 정체성에 맞게 변형한다.
- Pagefind는 `astro build` 후 인덱스를 생성해야 하므로 빌드 스크립트에 포함한다.
- GitHub Pages를 쓰지 않고 자체 서버에 올릴 경우 캐시 헤더를 직접 설정한다.
- 글 이미지가 많아질 가능성이 높으므로 썸네일 크기와 lazy loading 정책을 초기에 정한다.
- 검색 모달, RSS, OG 이미지, canonical URL은 초기에 골격을 잡아두는 편이 이후 글 이전 비용을 줄인다.

## 1차 작업 범위 제안

1. Astro + Tailwind 프로젝트 생성
2. 콘텐츠 컬렉션 설계: `articles`, `thoughts`, `bookshelf`, `timeline`, `talks`
3. 홈/목록/상세/검색 모달 레이아웃 구현
4. RSS, sitemap, SEO meta, OG 이미지 기본값 구성
5. Pagefind 빌드 파이프라인 연결
6. 정적 배포 방식 결정: GitHub Pages 또는 기존 서버

## 결론

kciter.so 스타일의 블로그를 만들기 위해 우리 서버에 데이터베이스나 백엔드 서비스를 추가할 필요는 없다. Astro 정적 사이트 생성, Tailwind 기반 UI, Pagefind 정적 검색, RSS/SEO 메타 구성만으로 대부분 재현 가능하다.

운영 관점에서 가장 좋은 선택은 빌드는 CI에서 수행하고, 서버는 `dist/` 정적 파일만 제공하는 방식이다. 이렇게 하면 장애 지점이 적고, 블로그가 글과 이미지 중심으로 커져도 운영 복잡도가 낮게 유지된다.

## 참고 링크

- https://kciter.so
- https://kciter.so/posts/how-to-build-an-agent/
- https://kciter.so/timeline/
- https://kciter.so/feed.xml
- https://kciter.so/manifest.webmanifest

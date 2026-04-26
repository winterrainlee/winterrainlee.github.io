# winterrainlee.github.io

Astro 기반 개인 블로그입니다. GitHub Pages 메인 저장소(`winterrainlee.github.io`)에 배포하도록 구성되어 있습니다.

카테고리는 세 가지입니다.

- `memo`: 짧게 남긴 단상
- `articles`: 여러 사안에 대한 생각을 정리해서 쓴 글
- `self-practice`: AI agent, automation, blog 등 이것저것 연습하며 남긴 기록

## 개발

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

빌드 결과는 `dist/`에 생성됩니다. `pagefind` 검색 인덱스도 함께 생성됩니다.

## 배포

1. GitHub에서 `winterrainlee.github.io` 저장소를 준비합니다.
2. 이 프로젝트를 해당 저장소의 `main` 브랜치로 push합니다.
3. 저장소의 `Settings > Pages`에서 Source를 `GitHub Actions`로 설정합니다.
4. `.github/workflows/deploy.yml` 워크플로가 `dist/`를 GitHub Pages에 배포합니다.

배포 주소는 다음과 같습니다.

https://winterrainlee.github.io/

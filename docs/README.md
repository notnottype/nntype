# 📚 nntype Documentation

nntype 무한 캔버스 타이프라이터 프로젝트 문서 모음

## 📋 문서 구조

### 1. 프로젝트 계획 (`planning/`)
- **[ROADMAP_v2.0_2025-08.md](planning/ROADMAP_v2.0_2025-08.md)** - nntype v2.0 구현 계획서 (메인 로드맵)
  - 제품 비전, 시스템 아키텍처, 구현 로드맵  
  - 채널 시스템, 멀티미디어, 그리기 기능 통합 설계
  - Phase별 개발 계획 (Phase 0-9, 13-18주)

### 2. 기술 문서 (`technical/`)
- **[data-architecture-analysis.md](technical/data-architecture-analysis.md)** - 데이터 아키텍처 & 통합 분석
  - 현재 구현 vs A-claude 계획 비교
  - ERD 및 이벤트 플로우 다이어그램
  - 네이밍 컨벤션 개선 권장사항
  - 마이그레이션 전략

- **[naming-convention-summary.md](technical/naming-convention-summary.md)** - 네이밍 컨벤션 요약
  - 완료된 네이밍 개선 작업
  - 실제 코드베이스 적용 체크리스트
  - Breaking Change 주의사항

- **[COORDINATE_SYSTEM_ANALYSIS.md](technical/COORDINATE_SYSTEM_ANALYSIS.md)** - 좌표 시스템 분석
  - 월드 좌표 vs 스크린 좌표
  - 변환 함수 설명

### 3. 개발 가이드
- **[CLAUDE.md](../CLAUDE.md)** - Claude Code 개발 가이드
  - 개발 명령어
  - 아키텍처 개요
  - 주요 시스템 설명

### 4. API & 프로젝트 구조
- **[API.md](API.md)** - API 문서
  - 컴포넌트 API
  - Hook API
  - 유틸리티 함수

- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - 프로젝트 구조
  - 디렉토리 구조
  - 파일 설명

- **[DATA_MODEL_AND_FLOW.md](DATA_MODEL_AND_FLOW.md)** - 데이터 모델 & 플로우
  - 현재 데이터 구조
  - 이벤트 흐름

### 5. 기여 가이드
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - 기여 가이드라인

## 🏗️ 프로젝트 상태

### 현재 구현 완료
- ✅ 무한 캔버스 기본 기능
- ✅ 텍스트 객체 시스템 (`TextObjectType`)
- ✅ A4 가이드 시스템 (`A4GuideObjectType`)
- ✅ 링크 시스템 (`LinkObjectType`)
- ✅ 포인터 이벤트 정규화
- ✅ 세션 저장 (localStorage)
- ✅ PNG/SVG/JSON 내보내기

### 계획 중 (A-claude.md)
- 🔄 채널 시스템 (Logseq 스타일)
- 🔄 작업공간 관리
- 🔄 멀티미디어 통합 (YouTube, Audio, Image)
- 🔄 그리기 시스템 (Apple Pencil 지원)
- 🔄 모바일/터치 최적화
- 🔄 Zustand 상태 관리
- 🔄 IndexedDB 저장소

## 🔄 마이그레이션 계획

### Phase 0-1: 기반 시스템 (2주)
- Zustand 상태 관리 도입
- IndexedDB 초기화
- 데이터 구조 확장

### Phase 2-3: 채널 시스템 (1.5주)
- 채널 패널 UI
- 태깅 시스템
- 캔버스-채널 연동

### Phase 4-5: 문서 & 작업공간 (3.5-5주)
- 문서 시스템
- 백링크
- 다중 작업공간

### Phase 6: 커맨드 시스템 (2-3주)
- 통합 커맨드 파서
- 자연어 처리

### Phase 7-8: 최적화 & 품질 (3주)
- 성능 최적화
- PWA 구현
- 테스트 & 보안

### Phase 9: 멀티미디어 & 그리기 (2-3주)
- 그리기 엔진
- 멀티미디어 통합
- 터치 인터페이스

## 📊 데이터 타입 마이그레이션

### 네이밍 개선 (Breaking Changes)
| 현재 | 계획 | 상태 |
|------|------|------|
| `TextObjectType` | `TextObject` | 📝 계획 |
| `A4GuideObjectType` | `GuideObject` | 📝 계획 |
| `LinkObjectType` | `LinkObject` | 📝 계획 |
| `CanvasModeType` | `CanvasMode` (enum) | 📝 계획 |

### 새로운 객체 타입
- `DrawingObject` - 그리기 객체
- `YouTubeObject` - YouTube 임베드
- `AudioObject` - 오디오 파일
- `ImageObject` - 이미지 파일
- `Channel` - 채널 시스템
- `Workspace` - 작업공간

## 🛠️ 개발 환경

### 기술 스택
- **Frontend**: React 18, TypeScript
- **Build**: Vite
- **Styling**: TailwindCSS
- **Canvas**: HTML5 Canvas API
- **상태 관리**: React Hooks → Zustand (계획)
- **저장소**: localStorage → IndexedDB (계획)

### 개발 명령어
```bash
npm install      # 의존성 설치
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 미리보기
```

## 📝 문서 관리 가이드

### 문서 업데이트 시
1. 변경 사항을 해당 문서에 반영
2. 이 README.md의 상태 업데이트
3. Breaking Change가 있으면 마이그레이션 가이드 추가

### 새 문서 추가 시
1. 적절한 카테고리에 문서 추가
2. README.md에 링크 추가
3. 문서 목적과 범위 명시

## 🔗 관련 링크
- [GitHub Repository](https://github.com/notnottype/nntype)
- [Issue #23 - 채널 시스템](https://github.com/notnottype/nntype/issues/23)

---

*© 2025 notnottype | Original Author: Hyeonsong Kim*  
*최종 업데이트: 2025-08-06*

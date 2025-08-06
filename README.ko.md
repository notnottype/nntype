

<p align="center">
  <img src="public/nntype.png" alt="nntype Logo" width="220"/>
</p>

<p align="center">
  <img src="public/nntype-demo.gif" alt="Infinite Canvas Typewriter 데모" width="800"/>
</p>

# nntype - Infinite Canvas Typewriter

> 이 문서는 한국어 설명입니다. 영어 안내는 [README.md](./README.md)를 참고하세요.

nntype는 한글/영문 모노스페이스 폰트, 벡터/이미지/JSON 내보내기, 무한 줌&패닝을 지원하는 현대적인 타입라이터 캔버스입니다.

## ✨ 주요 기능
- **한글/영문 모노스페이스 타이프라이터** - Noto Sans Mono KR로 아름다운 타이포그래피
- **무한 캔버스** - 그리드와 가이드 시스템이 있는 무제한 공간
- **멀티 모드 시스템** - 타이포그래피, 링크, 선택 모드
- **내보내기/가져오기** - PNG, SVG, JSON 형식 지원
- **다크 모드** - 눈에 편한 어두운 테마
- **키보드 단축키** - 포괄적인 단축키 시스템
- **AI 통합** - GPT 기반 텍스트 응답
- **자동 저장** - localStorage를 사용한 세션 관리

## 🚀 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 📁 프로젝트 구조

```
nntype/
├── src/
│   ├── main.tsx                         # 앱 진입점
│   ├── components/
│   │   ├── InfiniteTypewriterCanvas.tsx # 메인 캔버스 컴포넌트
│   │   ├── Header.tsx                   # 네비게이션
│   │   └── ui/                          # UI 컴포넌트
│   ├── hooks/                           # 커스텀 React 훅
│   ├── utils/                           # 유틸리티 함수
│   ├── types/                           # TypeScript 정의
│   └── constants/                       # 앱 상수
├── docs/
│   ├── README.md                        # 문서 인덱스
│   ├── planning/                        # 프로젝트 계획
│   │   └── ROADMAP_v2.0_2025-08.md      # v2.0 구현 계획
│   ├── technical/                       # 기술 문서
│   │   ├── data-architecture-analysis.md # ERD & 통합 분석
│   │   ├── naming-convention-summary.md  # 네이밍 표준
│   │   └── COORDINATE_SYSTEM_ANALYSIS.md # 캔버스 좌표 시스템
│   └── archive/                         # 아카이브 문서
├── CLAUDE.md                            # Claude Code 가이드
└── README.md                            # 메인 README
```

## 🎮 사용 방법

### 기본 사용법
- **텍스트 입력**: 입력창에 타이핑 후 Enter
- **폭 조절**: 입력창 아래 40-60-80 버튼 클릭
- **캔버스 네비게이션**: 클릭 후 드래그하여 이동
- **모드 전환**: 툴바 버튼으로 모드 변경

### 키보드 단축키
- **캔버스 줌**: `Option/Alt + +/-`
- **UI 크기**: `Ctrl/Cmd + +/-`
- **그리드 토글**: `G`
- **다크 모드 토글**: `D`
- **캔버스 지우기**: `Cmd/Ctrl + K`

## 📚 문서

- **[문서 허브](docs/README.md)** - 완전한 문서 인덱스
- **[v2.0 로드맵](docs/planning/ROADMAP_v2.0_2025-08.md)** - 완전한 구현 계획
- **[기술 아키텍처](docs/technical/data-architecture-analysis.md)** - 데이터 모델 및 통합
- **[API 레퍼런스](docs/API.md)** - 컴포넌트 및 유틸리티 API
- **[프로젝트 구조](docs/PROJECT_STRUCTURE.md)** - 상세 아키텍처

## 🛠️ 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: TailwindCSS
- **캔버스**: HTML5 Canvas API
- **아이콘**: Lucide React
- **폰트**: Noto Sans Mono KR

## 🔄 로드맵

### 현재 버전 (v1.0)
✅ 텍스트 객체가 있는 무한 캔버스  
✅ 멀티 모드 시스템 (타이포그래피/링크/선택)  
✅ 내보내기/가져오기 (PNG/SVG/JSON)  
✅ 다크 모드 및 세션 관리

### 계획된 기능 (v2.0)
🔄 **채널 시스템** - Logseq 스타일 태깅 및 조직화  
🔄 **그리기 시스템** - 압력 감지가 있는 Apple Pencil 지원  
🔄 **가이드 시스템** - A4, Letter, Legal, Screen, Mobile 형식  
🔄 **멀티미디어** - YouTube 임베드, 오디오, 이미지 객체  
🔄 **모바일/터치** - 제스처가 있는 iPad 최적화 인터페이스  
🔄 **명령 시스템** - 자연어 처리  
🔄 **상태 관리** - Zustand + IndexedDB 저장소  
🔄 **데이터 아키텍처** - 통합 객체 시스템 마이그레이션

자세한 v2.0 구현 계획은 [ROADMAP_v2.0_2025-08.md](docs/planning/ROADMAP_v2.0_2025-08.md)를 참고하세요.

## 🤝 기여하기

기여를 환영합니다! 가이드라인은 [CONTRIBUTING.md](docs/CONTRIBUTING.md)를 읽어주세요.

## 📄 라이선스

이 프로젝트는 GNU General Public License v3.0 하에 라이선스됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

- © 2025 notnottype
- Original Author: Hyeonsong Kim (kimhxsong@gmail.com)
- GitHub: https://github.com/notnottype/nntype 

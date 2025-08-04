

<p align="center">
  <img src="public/nntype.png" alt="nntype Logo" width="220"/>
</p>

<p align="center">
  <img src="public/nntype-demo.gif" alt="Infinite Canvas Typewriter 데모" width="800"/>
</p>

# NNType - Infinite Canvas Typewriter

> 이 문서는 한국어 설명입니다. 영어 안내는 [README.md](./README.md)를 참고하세요.

nntype는 한글/영문 모노스페이스 폰트, 벡터/이미지/JSON 내보내기, 무한 줌&패닝을 지원하는 현대적인 타입라이터 캔버스입니다.

- React 기반
- 주요 컴포넌트: `src/components/InfiniteTypewriterCanvas.tsx`
- 진입점: `src/main.tsx`
- Tailwind CSS, Lucide 아이콘 사용

## 실행 방법

```bash
npm install
npm run dev
```

## 폴더 구조

```
nntype/
├── src/
│   ├── main.tsx                # 앱 진입점
│   ├── components/
│   │   └── InfiniteTypewriterCanvas.tsx  # 메인 캔버스 컴포넌트
│   ├── index.css
│   └── ...
├── public/
│   └── nntype.png
├── README.md
└── ...
```

## 주요 기능
- 한글/영문 모노스페이스 타입라이터
- 무한 캔버스, 그리드, A4 가이드
- PNG, SVG, JSON 내보내기/가져오기
- 단축키 안내, 다크모드, UI/Zoom/Scale 조절

## 사용법
- 텍스트 입력: 입력창에 타이핑 후 Enter
- 폭 조절: 입력창 아래 40-60-80 버튼 클릭
- 줌: Option/Alt + +/-, UI 크기: Ctrl/Cmd + +/-
- 내보내기/가져오기: 헤더 메뉴 사용

## 라이선스
이 프로젝트는 GNU General Public License v3.0 하에 라이선스됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

- © 2025 Hyeonsong Kim (kimhxsong@gmail.com)
- GitHub: https://github.com/kimhxsong 

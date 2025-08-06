# 🎯 nntype 채널 시스템 구현 계획

**프로젝트**: nntype 무한 캔버스 타이프라이터  
**기능**: Logseq 스타일 채널링 + Slack 스타일 타임라인 + 커맨드 기반 인터페이스  
**GitHub Issue**: #23  
**상태**: 설계 완료, 구현 준비 중 📋

---

## 🎨 제품 비전

### 핵심 개념
- **무한 캔버스**: 기존의 자유로운 텍스트 배치 시스템 유지
- **채널 시스템**: 텍스트를 주제별로 분류하고 관리하는 Logseq 스타일 태깅
- **타임라인 뷰**: Slack 스타일의 메시지 히스토리와 무한 스크롤
- **문서 생성**: 타임라인 선택을 통한 드래그&드롭 문서 편집
- **작업공간**: 하나의 캔버스에 여러 문서, 여러 캔버스를 작업공간으로 관리
- **커맨드 센터**: 타이프라이터를 통한 모든 기능의 텍스트 명령어 제어
- **실시간 오디오**: 음성 녹음과 실시간 캔버스 연동, 시스템 오디오 캡처
- **멀티미디어**: 유튜브, 오디오, 이미지를 캔버스에 임베드하고 크기 편집

### 사용자 시나리오
```
1. 캔버스에서 자유롭게 텍스트 작성 (+#work +#urgent 태깅)
2. 🎙️ 음성 녹음 시작 → 실시간으로 타이핑하면서 오디오 싱크
3. 로고 클릭 → 채널 패널 열기 → 타임라인으로 작업 히스토리 확인
4. Create Document → 메시지 선택 → 드래그&드롭으로 문서 구성
5. !!export pdf → 문서를 PDF로 내보내기 (오디오 타임라인 포함)
6. !!ws switch personal → 개인 작업공간으로 전환
7. 🖥️ 데스크톱: 시스템 오디오 + 마이크 동시 녹음으로 화면 공유 세션 캡처
8. 📺 !!youtube https://youtu.be/abc123 → 유튜브 플레이어가 타이프라이터 하단에 플로팅
9. 🖼️ 이미지 드래그&드롭으로 캔버스에 추가 → 자유롭게 위치 및 크기 조절

### 추가 시나리오 (그리기 & 모바일)
10. 🎨 >draw start pen red 3 → 펜 모드로 전환 → Apple Pencil로 압력 감지 드로잉
11. 📝 iPad: 두 손가락 팬으로 캔버스 이동 → 핀치 줌 → 한 손가락 드로잉
12. 📱 모바일: >channel write #work → 전체화면 채널 메시지 작성 모드
13. 🖊️ 하이라이터 모드 → 텍스트 위에 반투명 마킹 → 자동으로 백링크 생성
14. 🎵 !!audio record → 회의 중 마이크 + 시스템 오디오 녹음 → 실시간 메모와 동기화
15. 🎬 화상회의 중 YouTube 자료 공유 → 플로팅 플레이어로 동시 시청하며 노트 작성
```

---

## 📊 시스템 아키텍처

### 데이터 모델

```typescript
// 기존 TextObject 확장 (하위 호환)
interface TextObjectType {
  // === 기존 필드들 (100% 보존) ===
  id: number;
  type: 'text';
  content: string;
  x: number;
  y: number;
  scale: number;
  fontSize: number;
  isAIResponse?: boolean;
  color?: string;
  
  // === 새 메타데이터 (선택적) ===
  _metadata?: {
    createdAt: string;     // ISO timestamp
    updatedAt: string;     // 수정 시간
    channelIds: string[];  // 소속 채널들 (["inbox", "work", "urgent"])
  };
}

// 채널 시스템
interface Channel {
  id: string;              // "inbox", "work", "project-a"
  name: string;            // "Inbox", "Work", "Project A"
  messageCount: number;    // 소속 메시지 개수
  lastActivity: string;    // 마지막 활동 시간
  type: 'default' | 'personal'; // 기본/개인 채널
}

interface ChannelMessage {
  id: string;              // UUID
  textObjectId: number;    // 연결된 TextObject ID
  channelIds: string[];    // 포함된 채널들 (다중 채널 지원)
  content: string;         // 텍스트 내용 스냅샷
  timestamp: string;       // 생성 시간
  isFromCanvas: boolean;   // 캔버스에서 생성된 메시지인지
}

// 작업공간 시스템
interface Workspace {
  id: string;              // Workspace UUID
  name: string;            // "프로젝트 A", "개인 메모"
  canvasId: string;        // 연결된 캔버스 ID
  createdAt: string;       // 생성 시간
  lastAccessed: string;    // 마지막 접근 시간
  documentIds: string[];   // 소속 문서들
  metadata: {
    description?: string;  // 작업공간 설명
    color?: string;        // 색상 테마
    isDefault: boolean;    // 기본 작업공간 여부
  };
}

// 문서 시스템
interface Document {
  id: string;              // UUID
  workspaceId: string;     // 소속 작업공간 ID
  canvasId: string;        // 연결된 캔버스 ID
  title: string;           // 문서 제목
  createdAt: string;       // 생성 시간
  updatedAt: string;       // 수정 시간
  sourceMessageIds: string[];  // 원본 메시지 ID들
  content: DocumentBlock[];    // 문서 블록들
  metadata: {
    channelIds: string[];      // 연관 채널들
    tags: string[];            // 해시태그들
    wordCount: number;         // 단어 수
    parentCanvas: string;      // 부모 캔버스 참조
  };
}

interface DocumentBlock {
  id: string;              // 블록 UUID
  type: 'text' | 'heading' | 'divider' | 'quote';
  content: string;         // 블록 내용
  sourceMessageId?: string;  // 원본 메시지 (있는 경우)
  order: number;           // 블록 순서
  isEditable: boolean;     // 편집 가능 여부
}

// 백링크 시스템
interface BackLink {
  id: string;              // 백링크 UUID
  type: 'canvas-to-doc' | 'doc-to-canvas' | 'doc-to-doc';
  sourceId: string;        // 소스 ID
  targetId: string;        // 타겟 ID
  sourceType: 'text' | 'document' | 'message';
  targetType: 'text' | 'document' | 'message';
  context?: string;        // 연결 컨텍스트
  createdAt: string;       // 생성 시간
  relationship: 'source' | 'reference' | 'mention';
}

// 오디오 시스템
interface AudioRecording {
  id: string;              // 녹음 UUID
  workspaceId: string;     // 소속 작업공간
  startTime: string;       // 녹음 시작 시간 (ISO)
  duration: number;        // 녹음 길이 (초)
  audioBlob?: Blob;        // 오디오 데이터 (웹)
  audioPath?: string;      // 오디오 파일 경로 (데스크톱)
  metadata: {
    sampleRate: number;    // 샘플링 레이트 (44100, 48000)
    channels: number;      // 채널 수 (1=모노, 2=스테레오)
    format: string;        // 오디오 포맷 (webm, mp3, wav)
    hasSystemAudio: boolean; // 시스템 오디오 포함 여부
    hasMicrophone: boolean;  // 마이크 오디오 포함 여부
  };
  syncEvents: AudioSyncEvent[]; // 캔버스 동기화 이벤트들
}

interface AudioSyncEvent {
  id: string;              // 이벤트 UUID
  recordingId: string;     // 소속 녹음 ID
  timestamp: number;       // 녹음 시작 기준 시간 (초)
  eventType: 'text_create' | 'text_edit' | 'focus_change' | 'channel_switch';
  relatedObjectId?: number | string; // 연관된 객체 ID
  snapshot?: {
    textContent?: string;  // 텍스트 내용 스냅샷
    position?: { x: number; y: number }; // 캔버스 위치
    channelId?: string;    // 활성 채널
  };
}

interface AudioPlaybackState {
  recordingId: string;
  currentTime: number;     // 현재 재생 시간 (초)
  isPlaying: boolean;      // 재생 중 여부
  playbackRate: number;    // 재생 속도 (0.5, 1.0, 1.5, 2.0)
  syncedEvents: AudioSyncEvent[]; // 현재 시간의 동기화 이벤트들
}

// 멀티미디어 객체 시스템
interface MediaObject extends CanvasObject {
  id: number;              // 객체 ID
  type: 'youtube' | 'audio' | 'image';
  x: number;               // 캔버스 위치 (월드 좌표)
  y: number;
  width: number;           // 크기
  height: number;
  scale: number;           // 스케일
  metadata: {
    createdAt: string;     // 생성 시간
    channelIds: string[];  // 소속 채널들
  };
}

interface YouTubeObject extends MediaObject {
  type: 'youtube';
  videoId: string;         // 유튜브 비디오 ID
  startTime?: number;      // 시작 시간 (초)
  endTime?: number;        // 종료 시간 (초)
  isFloating: boolean;     // 플로팅 모드 (타이프라이터 하단 고정)
  playbackState?: {
    currentTime: number;   // 현재 재생 시간
    isPlaying: boolean;    // 재생 중 여부
    volume: number;        // 볼륨 (0-1)
  };
}

interface AudioObject extends MediaObject {
  type: 'audio';
  audioBlob?: Blob;        // 오디오 데이터 (웹)
  audioPath?: string;      // 오디오 파일 경로 (데스크톱)
  fileName: string;        // 원본 파일명
  duration: number;        // 길이 (초)
  format: string;          // 파일 포맷 (mp3, wav, etc.)
}

interface ImageObject extends MediaObject {
  type: 'image';
  imageBlob?: Blob;        // 이미지 데이터 (웹)
  imagePath?: string;      // 이미지 파일 경로 (데스크톱)
  fileName: string;        // 원본 파일명
  naturalWidth: number;    // 원본 이미지 크기
  naturalHeight: number;
  format: string;          // 이미지 포맷 (jpg, png, webp, etc.)
}

// 그리기 기능을 위한 객체
interface DrawingObject extends CanvasObject {
  type: 'drawing';
  id: string;
  strokes: DrawingStroke[];
  bounds: { x: number; y: number; width: number; height: number };
  style: DrawingStyle;
  createdAt: string;
  lastModified: string;
}

interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  style: StrokeStyle;
  timestamp: number;
}

interface DrawingPoint {
  x: number;
  y: number;
  pressure?: number; // iPad 펜 압력 지원
  timestamp: number;
}

interface StrokeStyle {
  color: string;
  width: number;
  opacity: number;
  tool: 'pen' | 'marker' | 'eraser' | 'highlighter';
}

interface DrawingStyle {
  backgroundColor?: string;
  opacity: number;
  blendMode: 'normal' | 'multiply' | 'overlay';
}

// 플로팅 미디어 상태
interface FloatingMediaState {
  activeMedia: YouTubeObject | AudioObject | null;
  position: 'bottom-left' | 'bottom-right' | 'bottom-center';
  isMinimized: boolean;
  isDocked: boolean;       // 타이프라이터에 도킹 여부
}

// 터치 인터페이스 지원 (iPad/모바일)
interface TouchState {
  isTouch: boolean;        // 터치 디바이스 여부
  currentTouches: Map<number, TouchPoint>;  // 현재 터치 포인트들
  gestureState: GestureState | null;        // 제스처 인식 상태
  virtualKeyboard: VirtualKeyboardState;    // 가상 키보드 상태
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  pressure?: number;       // 펜 압력 (Apple Pencil)
  timestamp: number;
  type: 'finger' | 'pencil' | 'stylus';
}

interface GestureState {
  type: 'pan' | 'pinch' | 'draw' | 'select' | 'text-input';
  startTime: number;
  lastUpdateTime: number;
  data: any;              // 제스처별 특화 데이터
}

interface VirtualKeyboardState {
  isVisible: boolean;
  height: number;         // 키보드 높이 (픽셀)
  adjustedViewport: boolean;  // 뷰포트 조정 완료 여부
}

// 모바일 전용 채널 메시지 작성 인터페이스
interface MobileChannelWriter {
  isActive: boolean;
  channelId: string;
  draftMessage: string;
  position: { x: number; y: number };  // 화면 좌표
  isFullscreen: boolean;   // 전체화면 편집 모드
  suggestions: string[];   // 자동완성 제안
}

// 캔버스 모드 확장 (그리기 모드 추가)
enum CanvasMode {
  Typography = 'typography',
  Link = 'link',
  Select = 'select',
  Drawing = 'drawing',
  ChannelWrite = 'channel-write'
}

// 세션 스토리지 확장
interface SessionData {
  // === 기존 필드들 유지 ===
  version: string;
  timestamp: number;
  canvasObjects: CanvasObjectType[];
  // ... 기존 필드들 ...
  
  // === 새 시스템 데이터 ===
  workspaces?: Workspace[];
  currentWorkspaceId?: string;
  channels?: Channel[];
  channelMessages?: ChannelMessage[];
  activeChannel?: string;
  documents?: Document[];
  backlinks?: BackLink[];
  
  // === 오디오 시스템 ===
  audioRecordings?: AudioRecording[];
  currentRecording?: string;           // 현재 활성 녹음 ID
  audioPlaybackState?: AudioPlaybackState;
}
```

---

## 🎮 통합 커맨드 시스템

### 핵심 철학: 타이프라이터 = 커맨드 센터
모든 애플리케이션 기능을 타이프라이터 입력박스를 통한 텍스트 커맨드로 제어. Vim 스타일 커맨드 모드 + Obsidian 커맨드 팔레트의 결합.

### 커맨드 접두사

| 접두사 | 카테고리 | 예시 | 설명 |
|--------|----------|------|------|
| `!!` | 시스템 제어 | `!!doc create`, `!!ws switch` | 문서, 작업공간, 내보내기 |
| `>` | 캔버스 조작 | `>select all`, `>move right` | 객체 선택, 이동, 크기조절 |
| `+#` | 채널 추가 | `+#work +#urgent` | 현재 텍스트를 채널에 추가 |
| `-#` | 채널 제거 | `-#work`, `-#all` | 채널에서 제거 |
| `@` | 컨텍스트 작업 | `@find keyword`, `@filter` | 검색, 필터링, 정렬 |

### 주요 커맨드 예시

```bash
# 시스템 커맨드
!!doc create [title] [template]     # 새 문서 생성
!!doc list [workspace] [filter]     # 문서 목록 조회
!!ws create [name] [description]    # 작업공간 생성
!!ws switch [name|id]               # 작업공간 전환
!!export [format] [selection]       # 내보내기

# 캔버스 커맨드  
>select [type] [filter]             # 객체 선택
>move [direction] [distance]        # 객체 이동
>focus [target]                     # 객체로 포커스 이동
>zoom [level|fit|selection]         # 줌 조작

# 채널 커맨드
+#inbox                            # Inbox 채널에 추가
+#work +#urgent                    # 여러 채널 동시 추가
-#all                              # 모든 채널에서 제거

# 컨텍스트 커맨드
@find [query] [scope]              # 검색
@filter [criteria]                 # 필터링
@sort [field] [order]              # 정렬

# 그리기 커맨드
>draw start [tool] [color] [size]  # 그리기 모드 시작
>draw pen [color] [size]           # 펜 도구로 전환
>draw marker [color] [opacity]     # 마커 도구로 전환  
>draw eraser [size]                # 지우개 도구로 전환
>draw clear [selection|all]        # 그림 지우기
>draw save [name]                  # 그림 저장

# 멀티미디어 커맨드
!!youtube [url]                    # YouTube 영상 임베드
!!youtube play|pause|stop          # YouTube 제어
!!audio upload [file]              # 오디오 파일 업로드
!!audio record start|stop          # 오디오 녹음
!!image upload [file]              # 이미지 업로드
!!image resize [scale] [selection] # 이미지 크기 조정

# 모바일 전용 커맨드
>touch enable [gestures]           # 터치 제스처 활성화
>keyboard show|hide                # 가상 키보드 제어
>channel write [channel]           # 채널 메시지 작성 모드
>fullscreen toggle                 # 전체화면 토글
```

---

## 🏗️ 구현 계획

### Phase 0: 기반 시스템 구축 (1주)

**목표**: 고급 아키텍처의 기반 시스템 설정

**작업 내용**:
1. **Zustand 상태 관리 설정**
   ```typescript
   // src/stores/useAppStore.ts
   const useAppStore = create<AppStore>()(
     devtools(persist(immer(/* store implementation */)))
   );
   ```

2. **IndexedDB 초기화**
   ```typescript
   // src/services/database.ts
   import Dexie from 'dexie';
   
   class nntypeDB extends Dexie {
     canvas!: Table<TextObjectType>;
     channels!: Table<Channel>;
     documents!: Table<Document>;
   }
   ```

3. **동기화 서비스 구현**
   - SyncService 클래스 (옵티미스틱 업데이트)
   - 온라인/오프라인 상태 감지
   - 동기화 큐 관리

4. **성능 최적화 기반**
   - Web Worker 설정 (커맨드 파싱용)
   - 가상화 훅 (useVirtualizedList)
   - 메모이제이션 헬퍼 함수들

**완료 기준**:
- [ ] Zustand 스토어 초기화 및 devtools 연결
- [ ] IndexedDB 스키마 정의 및 마이그레이션 로직
- [ ] 기본 동기화 서비스 동작 확인
- [ ] Web Worker 통신 테스트
- [ ] 기존 기능 정상 작동

### Phase 1: 데이터 구조 확장 (1주)

**목표**: 채널 시스템을 위한 기본 데이터 타입과 저장소 로직 구현

**작업 내용**:
1. **`src/types/index.ts` 확장**
   - TextObjectType에 `_metadata` 필드 추가 (하위 호환)
   - Channel, ChannelMessage, Workspace, Document 인터페이스 정의

2. **`src/utils/sessionStorage.ts` 확장**  
   - SessionData 확장 및 새 유틸리티 함수들
   - saveChannelData, loadChannelData, addChannelMessage 등

3. **`src/utils/migrationUtils.ts` (신규)**
   - 기존 데이터 자동 마이그레이션 함수
   - 기본 #Inbox 채널 생성
   - 버전 호환성 검사

**완료 기준**:
- [ ] 모든 새 인터페이스 정의 완료
- [ ] 기존 데이터 자동 마이그레이션 동작
- [ ] 기본 채널 자동 생성 확인
- [ ] 모든 기존 기능 정상 작동

### Phase 2: 채널 패널 UI (1주)

**목표**: 채널과 상호작용할 수 있는 UI 패널과 상태 관리 구현

**작업 내용**:
1. **`src/components/ChannelPanel.tsx`** - 사이드 패널 컴포넌트
2. **`src/components/FloatingPanel.tsx`** - 플로팅 패널 옵션
3. **`src/hooks/useChannels.ts`** - 채널 상태 관리
4. **`src/utils/channelUtils.ts`** - `+#`, `-#` 태그 파싱 로직
5. **`src/components/Header.tsx` 수정** - 패널 토글 버튼

**UI 설계**:
```
┌─[Logo]──────[Toolbar]──────[Info]─┐
│                                   │
├─Channel Badges─────────────────────┤
│ [All:45] [#Inbox:12] [#work:8] ... │ 
├─[Side Panel]─┬─[Canvas Area]──────┤
│ ┌─Messages──┐ │                   │
│ │ 15:30     │ │  ○ Text Object 1  │
│ │ Hello     │ │     ○ Text Object │
│ │ world     │ │                   │
│ └───────────┘ │                   │
└───────────────┴───────────────────┘
```

**완료 기준**:
- [ ] 로고 클릭으로 패널 토글
- [ ] 채널 목록 표시
- [ ] 메시지 타임라인 표시  
- [ ] +#, -# 태깅 시스템 작동

### Phase 3: 캔버스-채널 연동 (0.5-1주)

**목표**: 캔버스 텍스트 객체와 채널 시스템 완전 연결

**작업 내용**:
1. InfiniteTypewriterCanvas와 useChannels 훅 연동
2. 텍스트 생성/수정 시 ChannelMessage 자동 생성
3. 메시지 클릭 → 캔버스 객체 포커싱 기능
4. 실시간 양방향 동기화

**완료 기준**:
- [ ] 캔버스 텍스트 → 채널 메시지 자동 추가
- [ ] 메시지 클릭 → 텍스트 객체 강조
- [ ] 부드러운 포커스 애니메이션
- [ ] 실시간 양방향 동기화

### Phase 4: 문서 시스템 & 백링크 (1.5-2주)

**목표**: 타임라인 기반 문서 생성 및 드래그&드롭 편집 시스템

**작업 내용**:
1. **`src/components/DocumentView.tsx`** - 듀얼 패널 문서 편집
2. **`src/components/DocumentEditor.tsx`** - 블록 기반 편집기
3. **`src/hooks/useDocumentEditor.ts`** - 문서 상태 관리
4. **`src/hooks/useBacklinks.ts`** - 백링크 시스템
5. **`src/utils/documentUtils.ts`** - 문서 관련 유틸리티

**문서 생성 UI**:
```
┌─[Create Document]─────────────────────────────────┐
│ ┌─Message History─┬─Document Editor──────────────┐ │
│ │ ☑15:30 API완료  │ # Work Session (2024-01-15)  │ │
│ │ ☑15:25 DB연결   │                              │ │
│ │ ☑15:20 요구사항 │ ## 완료된 작업               │ │
│ │ □15:15 프로토타입│ [Drop Zone: Drag blocks here]│ │
│ │                │                              │ │
│ │ [Drag Blocks]  │ ## 진행 중인 작업            │ │
│ │ ──────────────→│ [Drop Zone: Active tasks]    │ │
│ └────────────────┴──────────────────────────────┘ │
│ [💾 Save] [📤 Export] [🔗 Backlinks]             │
└─────────────────────────────────────────────────────┘
```

**백링크 자동 생성**:
- 드래그&드롭 시 TextObject ↔ Document 백링크 자동 생성
- 캔버스에서 연관 문서 목록 표시
- 문서에서 원본 위치로 점프 기능

**완료 기준**:
- [ ] 타임라인 선택 기반 문서 생성
- [ ] 드래그&드롭 블록 편집 시스템  
- [ ] 자동 백링크 생성 및 관리
- [ ] 마크다운/PDF 내보내기
- [ ] 문서-캔버스 양방향 네비게이션

### Phase 5: 다중 작업공간 시스템 (2-3주) - 중기 목표

**목표**: 여러 캔버스/작업공간 관리 시스템

**작업 내용**:
1. **`src/components/WorkspaceSelector.tsx`** - 작업공간 관리 UI
2. **`src/hooks/useWorkspaces.ts`** - 작업공간 상태 관리  
3. **`src/utils/workspaceUtils.ts`** - 작업공간별 데이터 격리
4. 기존 컴포넌트들의 작업공간 컨텍스트 통합

**완료 기준**:
- [ ] 다중 작업공간 생성/관리/전환
- [ ] 작업공간별 데이터 완전 격리
- [ ] 작업공간별 백업/복원 시스템

### Phase 6: 통합 커맨드 시스템 (2-3주) - 장기 목표

**목표**: 타이프라이터 기반 모든 기능 제어 시스템

**작업 내용**:
1. **`src/components/CommandInput.tsx`** - 확장된 타이프라이터
2. **`src/hooks/useCommandSystem.ts`** - 커맨드 파싱 엔진
3. **`src/components/CommandAutocomplete.tsx`** - 자동완성 시스템
4. **`src/utils/commandParser.ts`** - 커맨드 파싱 로직
5. 모든 기능의 커맨드 인터페이스 구현

**MCP 통합 로드맵**:
- **Phase A**: 자연어 → 커맨드 변환 (MCP Sequential)
- **Phase B**: 컨텍스트 인식 자동완성 (MCP Context7)  
- **Phase C**: 워크플로우 자동화 (MCP Magic + Sequential)
- **Phase D**: AI 어시스턴트 모드 (전체 MCP 통합)

**완료 기준**:
- [ ] 모든 기능의 커맨드 인터페이스
- [ ] 컨텍스트 인식 자동완성
- [ ] 실시간 커맨드 제안 및 오류 복구
- [ ] MCP 통합을 통한 자연어 커맨드 지원

---

## 🏛️ 고급 아키텍처 설계

### 상태 관리: Zustand 중앙화

```typescript
// 중앙 상태 관리 스토어
interface AppStore {
  // 캔버스 상태
  canvasObjects: Map<number, CanvasObject>; // TextObject | DrawingObject | MediaObject
  selectedObjects: Set<number>;
  focusedObjectId: number | null;
  canvasViewport: { x: number; y: number; zoom: number; };
  currentMode: CanvasMode;
  
  // 채널 상태
  channels: Map<string, Channel>;
  activeChannelId: string | null;
  channelMessages: Map<string, ChannelMessage[]>;
  unreadCounts: Map<string, number>;
  
  // 문서 & 작업공간 상태
  documents: Map<string, Document>;
  workspaces: Map<string, Workspace>;
  currentWorkspaceId: string;
  
  // 그리기 상태
  drawingState: {
    isDrawing: boolean;
    currentTool: 'pen' | 'marker' | 'eraser' | 'highlighter';
    currentColor: string;
    currentWidth: number;
    currentOpacity: number;
    activeDrawingId: string | null;
  };
  
  // 멀티미디어 상태
  mediaState: {
    floatingMedia: FloatingMediaState;
    audioRecordings: Map<string, AudioRecording>;
    currentRecording: string | null;
  };
  
  // 터치/모바일 상태
  touchState: TouchState;
  mobileChannelWriter: MobileChannelWriter;
  
  // 액션들 (canvas, channel, document, workspace, drawing, media, touch)
  actions: { 
    canvas: CanvasActions;
    channel: ChannelActions;
    document: DocumentActions;
    workspace: WorkspaceActions;
    drawing: DrawingActions;
    media: MediaActions;
    touch: TouchActions;
  };
}
```

### 실시간 동기화: 옵티미스틱 업데이트

```typescript
// IndexedDB + 옵티미스틱 업데이트 패턴
class SyncService {
  async saveWithOptimisticUpdate<T>(
    data: T,
    optimisticUpdate: () => void,
    rollback: () => void
  ) {
    // 1. 즉시 UI 업데이트
    optimisticUpdate();
    
    try {
      // 2. IndexedDB 저장
      await this.saveToIndexedDB(data);
      
      // 3. 온라인이면 서버 동기화, 오프라인이면 큐잉
      this.isOnline ? await this.syncToServer(data) : this.queueForSync(data);
    } catch (error) {
      rollback(); // 실패시 롤백
    }
  }
}
```

### 성능 최적화 전략

**가상화 & 메모이제이션**:
- `@tanstack/react-virtual`로 메시지 목록 가상화
- 웹 워커에서 CPU 집약적인 커맨드 파싱 처리
- React.memo와 useMemo로 불필요한 재렌더링 방지

**오프라인 우선 전략**:
- Service Worker로 캐시 우선, 네트워크 폴백
- 백그라운드 동기화로 연결 복구시 자동 동기화
- Progressive Web App으로 네이티브 앱 경험

---

## 🔧 기술 스택 & 구현 세부사항

### 핵심 기술 스택
- **프론트엔드**: React 18 + TypeScript + Vite
- **상태 관리**: Zustand (devtools, persist, immer)
- **UI**: Tailwind CSS + Lucide Icons + Headless UI
- **캔버스**: HTML5 Canvas API (HiDPI 지원)
- **데이터베이스**: IndexedDB (Dexie.js)
- **동기화**: Service Worker + Background Sync

### 새로 도입
- **가상화**: @tanstack/react-virtual (메시지 목록)
- **성능**: Web Workers (커맨드 파싱)
- **오프라인**: Service Worker + IndexedDB
- **테스팅**: Vitest + Playwright + Testing Library
- **보안**: Crypto-JS (데이터 암호화)

### 성능 최적화
- **가상 스크롤링**: 대용량 메시지 목록 (10,000+ 아이템)
- **메모이제이션**: React.memo, useMemo, useCallback 적극 활용
- **코드 분할**: React.lazy + Suspense로 지연 로딩
- **웹 워커**: CPU 집약적 작업 오프로드
- **디바운싱**: 검색, 커맨드 입력 최적화

---

---

## 🛡️ 보안 & 접근성

### 보안 고려사항

**데이터 보호**:
```typescript
// 민감한 데이터 암호화
class SecurityManager {
  encryptSensitiveData(data: any): string {
    return encrypt(JSON.stringify(data), this.userKey).toString();
  }
  
  validateCommand(command: string): boolean {
    // XSS 방지 패턴 검사
    const dangerousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i];
    return !dangerousPatterns.some(pattern => pattern.test(command));
  }
}
```

**CSP 헤더**: `default-src 'self'; script-src 'self' 'unsafe-inline'`

### 접근성 (WCAG 2.1 AA)

**키보드 네비게이션**:
- Tab/Shift+Tab: 패널 간 이동
- Arrow Keys: 채널/메시지 목록 내 이동
- Enter: 선택, Escape: 취소
- 커맨드 입력창: 언제나 접근 가능

**스크린 리더 지원**:
```typescript
<div
  role="navigation"
  aria-label="채널 목록"
  aria-live="polite"
>
  <ul role="list">
    {channels.map(channel => (
      <li
        aria-label={`${channel.name}, ${channel.messageCount}개 메시지`}
        aria-selected={channel.id === activeChannelId}
      >
        {channel.name}
      </li>
    ))}
  </ul>
</div>
```

**고대비 모드**: 다크/라이트 테마에서 4.5:1 명암비 보장

---

## 📅 일정 & 마일스톤

| Phase | 기간 | 핵심 기능 | 완료 조건 |
|-------|------|----------|----------|
| **Phase 0** | 1주 | 기반 시스템 | Zustand + IndexedDB + 동기화 |
| **Phase 1** | 1주 | 데이터 구조 확장 | 마이그레이션 + 기본 채널 |
| **Phase 2** | 1주 | 채널 패널 UI | 패널 토글 + 태깅 시스템 |
| **Phase 3** | 0.5-1주 | 캔버스-채널 연동 | 실시간 동기화 |
| **Phase 4** | 1.5-2주 | 문서 + 백링크 | 드래그&드롭 + 내보내기 |
| **Phase 5** | 2-3주 | 다중 작업공간 | 작업공간 격리 |
| **Phase 6** | 2-3주 | 커맨드 시스템 | 전체 기능 커맨드화 |
| **Phase 7** | 2주 | 최적화 & 확장 | 성능 + 플러그인 + PWA |
| **Phase 8** | 1주 | 품질 보증 | 테스트 + 보안 + 사용성 |
| **Phase 9** | 2-3주 | 멀티미디어 & 그리기 | 그리기 도구 + 오디오/영상 + 터치UI |

**총 예상 기간**: 13-18주 (점진적 배포)

---

## 🎯 프로덕션 배포 전략

### 점진적 롤아웃
1. **Phase 0-1**: 기반 시스템 (내부 테스트)
2. **Phase 2-3**: 기본 채널 시스템 (알파)
3. **Phase 4**: 문서 시스템 추가 (베타)  
4. **Phase 5-6**: 고급 기능 (RC)
5. **Phase 7-8**: 최적화 및 품질보증 (정식 릴리스)

### 품질 보증 강화
**자동화된 테스팅**:
- 단위 테스트: 80% 커버리지 (Vitest)
- 통합 테스트: 핵심 워크플로우 (Testing Library)
- E2E 테스트: 사용자 시나리오 (Playwright)
- 성능 테스트: Lighthouse CI (90+ 점수)

**CI/CD 파이프라인**:
```yaml
# 자동화된 품질 검사
- Linting (ESLint) + Type Checking (TSC)
- Unit Tests (Vitest) + Integration Tests
- Bundle Size Analysis (< 500KB initial)
- E2E Tests (Playwright) + Visual Regression
- Security Audit (npm audit + Snyk)
```

### 성능 벤치마킹
**목표 지표**:
- 초기 로딩: < 3초 (3G 네트워크)
- First Contentful Paint: < 1.8초
- 메시지 10,000개: 가상화로 60fps 유지
- 오프라인 모드: < 500ms 캐시 응답
- PWA 설치: < 2MB 다운로드

### 데이터 마이그레이션 & 보안
**하위 호환성 보장**:
- 자동 마이그레이션 (v1.0 → v2.0)
- 점진적 업그레이드 (백그라운드 처리)
- 실패시 안전한 롤백
- 데이터 무결성 검증

**보안 강화**:
- CSP 헤더 적용
- 입력 데이터 검증
- 민감 데이터 암호화 (Crypto-JS)
- 정기 보안 감사

---

## 📈 Phase 7-8 상세 계획

### Phase 7: 최적화 & 확장 (2주)

**성능 최적화**:
- 가상화 구현 (`@tanstack/react-virtual`)
- 웹 워커 활용 (커맨드 파싱, 검색)
- 코드 분할 (React.lazy + Suspense)
- Service Worker (오프라인 우선)

**플러그인 시스템**:
```typescript
interface Plugin {
  id: string;
  commands?: CommandDefinition[];
  hooks?: PluginHooks;
  ui?: PluginUIComponents;
}

// 플러그인 예시
const markdownExportPlugin: Plugin = {
  id: 'markdown-export',
  commands: [{
    prefix: '!!md-export',
    handler: async (args) => { /* export logic */ }
  }]
};
```

**PWA 기능**:
- 오프라인 지원
- 백그라운드 동기화
- 푸시 알림 (선택적)
- 네이티브 앱 경험

### Phase 8: 품질 보증 (1주)

**전체 테스트 커버리지**:
- [ ] 단위 테스트 80% 이상
- [ ] 통합 테스트 주요 워크플로우 100%
- [ ] E2E 테스트 사용자 시나리오 완료
- [ ] 성능 벤치마킹 목표치 달성

**보안 & 접근성**:
- [ ] 보안 감사 통과 (Snyk + 수동 검토)
- [ ] WCAG 2.1 AA 준수 확인
- [ ] 크로스 브라우저 테스트 완료

**사용성 테스트**:
- [ ] 실제 사용자 5명 이상 테스트
- [ ] 피드백 반영 및 개선
- [ ] 문서화 완료 (사용자 가이드)

### Phase 9: 멀티미디어 & 그리기 시스템 (2-3주)

**그리기 시스템 구현**:
- [ ] **DrawingObjectType** 및 관련 인터페이스 구현
- [ ] **캔버스 그리기 엔진**: Stroke 렌더링, 압력 감지 지원
- [ ] **그리기 도구**: 펜, 마커, 지우개, 하이라이터
- [ ] **iPad/Apple Pencil 최적화**: 압력 감지, 틸트 각도, 팜 리젝션
- [ ] **그리기 모드 UI**: 도구 팔레트, 색상 선택기, 크기 조절

**멀티미디어 통합**:
- [ ] **YouTube 임베드**: iframe 플레이어, 플로팅 컨트롤
- [ ] **오디오 시스템**: 업로드, 재생, 녹음 (마이크 + 시스템 오디오)
- [ ] **이미지 처리**: 업로드, 크기 조정, 드래그&드롭
- [ ] **플로팅 미디어 플레이어**: 타이프라이터 하단 고정

**모바일/터치 최적화**:
- [ ] **터치 제스처**: 팬, 핀치 줌, 두 손가락 스크롤
- [ ] **가상 키보드 처리**: 뷰포트 조정, 포커스 관리
- [ ] **모바일 채널 작성 UI**: 전체화면 편집 모드
- [ ] **iPad 미니 특화**: 적절한 UI 크기, 터치 영역

**데스크톱 특화 기능**:
- [ ] **시스템 오디오 캡처** (macOS): Audio Hijack API 또는 CoreAudio
- [ ] **고급 그리기 도구**: 레이어, 블렌딩 모드
- [ ] **키보드 단축키**: 그리기 도구 빠른 전환
- [ ] **성능 최적화**: WebGL 기반 렌더링 (선택적)

---

*본 계획서는 nntype 채널 시스템의 완전한 구현 로드맵입니다. 각 Phase는 독립적으로 작동하며, 필요에 따라 우선순위를 조정할 수 있습니다.*

**🔄 최종 업데이트**: 2025-08-06  
**📋 상태**: 설계 완료 (그리기/멀티미디어/터치 UI 통합), Phase 1 구현 준비 중

### 주요 개선 사항 (최종)
- ✅ **그리기 시스템**: DrawingObjectType + 압력 감지 + 4가지 도구
- ✅ **멀티미디어 통합**: YouTube 플로팅 + 오디오 녹음/재생 + 이미지 편집  
- ✅ **터치 최적화**: iPad/모바일 제스처 + 가상 키보드 + Apple Pencil 지원
- ✅ **모바일 특화**: 채널 메시지 작성 전용 UI + 전체화면 편집 모드
- ✅ **데스크톱 고급**: macOS 시스템 오디오 캡처 + WebGL 렌더링 최적화

# nntype 네이밍 컨벤션 정리 요약

## ✅ 완료된 네이밍 개선 작업

### 1. 타입/인터페이스 네이밍 통일

#### 기존 → 개선
| 기존 | 개선 | 상태 |
|------|------|------|
| `TextObjectType` | `TextObject` | ✅ A-claude.md 반영 |
| `A4GuideObjectType` | `GuideObject` | ✅ A-claude.md 반영 |
| `LinkObjectType` | `LinkObject` | ✅ data-architecture-analysis.md 반영 |
| `CanvasModeType` | `CanvasMode` (enum) | ✅ A-claude.md 반영 |
| `MediaObjectType` | `MediaObject` | ✅ A-claude.md 반영 |
| `YouTubeObjectType` | `YouTubeObject` | ✅ A-claude.md 반영 |
| `AudioObjectType` | `AudioObject` | ✅ A-claude.md 반영 |
| `ImageObjectType` | `ImageObject` | ✅ A-claude.md 반영 |
| `DrawingObjectType` | `DrawingObject` | ✅ A-claude.md 반영 |

### 2. GuideObject 확장 (A4 → 범용)

```typescript
// 개선된 GuideObject
interface GuideObject {
  id: number;
  type: 'guide';
  x: number; 
  y: number;
  width: number; 
  height: number;
  guideType: GuideType;  // A4, Letter, Screen 등
  label?: string;
}

enum GuideType {
  A4 = 'A4',
  A3 = 'A3',
  Letter = 'Letter',
  Legal = 'Legal',
  Screen_16_9 = 'Screen_16_9',
  Screen_4_3 = 'Screen_4_3',
  iPhone = 'iPhone',
  iPad = 'iPad',
  Custom = 'Custom'
}
```

### 3. Enum 도입

```typescript
// String Union → Enum 전환
enum CanvasMode {
  Typography = 'typography',
  Link = 'link',
  Select = 'select',
  Drawing = 'drawing',
  ChannelWrite = 'channel-write'
}
```

## 📁 문서 정리 상태

### 완료된 문서
1. **A-claude.md** ✅
   - 모든 `*ObjectType` → `*Object` 변경 완료
   - `CanvasModeType` → `CanvasMode` enum 변경 완료
   - AppStore의 타입 참조 업데이트 완료

2. **data-architecture-analysis.md** ✅
   - 네이밍 컨벤션 개선 권장사항 섹션 추가
   - GuideObject 확장 계획 추가
   - 마이그레이션 전략 및 체크리스트 추가
   - Breaking Change 위험도 분석 완료

3. **naming-convention-summary.md** ✅ (현재 문서)
   - 전체 네이밍 개선 작업 요약

## 🚀 실제 코드베이스 적용 시 체크리스트

### Phase 1: 타입 정의 (우선순위: High)
- [ ] `src/types/index.ts`에서 기본 타입 변경
  - [ ] `TextObjectType` → `TextObject` 
  - [ ] `A4GuideObjectType` → `GuideObject`
  - [ ] `LinkObjectType` → `LinkObject`
- [ ] 하위 호환성을 위한 type alias 추가
- [ ] `PointerEvent` → `NNPointerEvent` 변경 (네임스페이스 충돌 방지)

### Phase 2: Enum 도입 (우선순위: Medium)
- [ ] `CanvasModeType` → `CanvasMode` enum
- [ ] `GuideType` enum 추가
- [ ] 기존 string literal 사용처 enum으로 변경

### Phase 3: 파일 구조 개선 (우선순위: Low)
- [ ] `types/index.ts` → 도메인별 파일 분리
  - [ ] `types/canvas.types.ts`
  - [ ] `types/channel.types.ts`
  - [ ] `types/workspace.types.ts`
- [ ] Re-export를 통한 import 경로 호환성 유지

### Phase 4: 함수 네이밍 일관성 (우선순위: Low)
- [ ] `utils/*` 함수 prefix 일관화
- [ ] `calculate*`, `validate*`, `create*` 패턴 적용

## ⚠️ 주의사항

### Breaking Changes
1. **`A4GuideObjectType` → `GuideObject`**: 타입 구조가 변경되므로 마이그레이션 헬퍼 필요
2. **`PointerEvent` → `NNPointerEvent`**: 이벤트 시스템 전체 영향

### 하위 호환성 전략
```typescript
// 점진적 마이그레이션을 위한 type alias
type TextObjectType = TextObject;      // @deprecated
type A4GuideObjectType = GuideObject;  // @deprecated  
type LinkObjectType = LinkObject;      // @deprecated
```

## 📝 결론

모든 계획 문서(A-claude.md, data-architecture-analysis.md)에서 네이밍 컨벤션이 일관되게 적용되었습니다. 실제 코드베이스 적용 시 위의 체크리스트를 따라 점진적으로 마이그레이션하면 됩니다.

**핵심 개선 사항**:
- ✅ 불필요한 `Type` 접미사 제거
- ✅ A4Guide → Guide로 확장하여 범용성 확보
- ✅ String Union → Enum 전환으로 타입 안전성 향상
- ✅ 네임스페이스 충돌 방지 (PointerEvent → NNPointerEvent)

/**
 * 채널 시스템 유틸리티 함수들
 * +#work +#urgent -#old 같은 태그 파싱 및 처리
 */

// 채널 태그 파싱 결과 인터페이스
export interface ChannelTagsResult {
  addChannels: string[];    // +#work +#urgent
  removeChannels: string[]; // -#old -#temp
  cleanContent: string;     // 태그가 제거된 순수 텍스트
}

// 채널 스위칭 명령어 파싱 결과 인터페이스
export interface ChannelSwitchResult {
  isChannelCommand: boolean;  // 채널 전환 명령어인지 여부
  addChannels: string[];      // +#work +#urgent  
  removeChannels: string[];   // -#old -#temp
  enterInputMode: boolean;    // 즉시 입력 모드로 전환할지 여부
}

/**
 * 텍스트에서 +#/-# 채널 태그를 파싱합니다
 * @param text 입력 텍스트 (예: "Hello world +#work +#urgent -#old")
 * @returns 파싱된 채널 태그와 정리된 텍스트
 */
export function parseChannelTags(text: string): ChannelTagsResult {
  const addChannelRegex = /\+#([a-zA-Z0-9-_가-힣]+)/g;
  const removeChannelRegex = /-#([a-zA-Z0-9-_가-힣]+)/g;
  
  const addChannels: string[] = [];
  const removeChannels: string[] = [];
  
  let match;
  
  // +# 태그 추출
  while ((match = addChannelRegex.exec(text)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!addChannels.includes(channelName)) {
      addChannels.push(channelName);
    }
  }
  
  // -# 태그 추출  
  while ((match = removeChannelRegex.exec(text)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!removeChannels.includes(channelName)) {
      removeChannels.push(channelName);
    }
  }
  
  // 태그를 제거한 깨끗한 텍스트
  const cleanContent = text
    .replace(/\+#[a-zA-Z0-9-_가-힣]+/g, '')
    .replace(/-#[a-zA-Z0-9-_가-힣]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    addChannels,
    removeChannels,
    cleanContent
  };
}

/**
 * 채널 ID로부터 표시 이름을 생성합니다
 * @param channelId 채널 ID (예: "work", "urgent")
 * @returns 표시 이름 (그대로 반환, 대문자화 안함)
 */
export function getChannelDisplayName(channelId: string): string {
  // 특별한 채널들도 소문자 그대로 반환
  const specialChannels: Record<string, string> = {
    'inbox': 'inbox',
    'general': 'general',
    'random': 'random'
  };
  
  if (specialChannels[channelId]) {
    return specialChannels[channelId];
  }
  
  // 일반 채널: 그대로 반환 (대문자화 안함)
  return channelId;
}

/**
 * 채널별 색상을 생성합니다 (해시 기반)
 * @param channelId 채널 ID
 * @returns HSL 색상 문자열
 */
export function getChannelColor(channelId: string): string {
  // 채널 ID를 해시하여 색상 생성
  let hash = 0;
  for (let i = 0; i < channelId.length; i++) {
    hash = channelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // HSL 색상 생성 (채도 60%, 밝기 50%)
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 50%)`;
}

/**
 * 기본 채널들을 생성합니다
 * 이제 보이는 기본 채널은 없습니다. 'default' 태그는 내부적으로만 사용됩니다.
 */
export function createDefaultChannels() {
  return [];
}

/**
 * 채널 ID가 유효한지 검사합니다
 * @param channelId 채널 ID
 * @returns 유효성 여부
 */
export function isValidChannelId(channelId: string): boolean {
  // 영문, 숫자, 하이픈, 언더스코어, 한글만 허용
  // 1-50자 제한
  const regex = /^[a-zA-Z0-9-_가-힣]{1,50}$/;
  return regex.test(channelId);
}

/**
 * 채널 스위칭 명령어를 파싱합니다 (+#channel_name 또는 -#channel_name만 있는 경우)
 * @param text 입력 텍스트 (예: "+#work", "+#work +#urgent", "-#old", "+#channel ")
 * @returns 채널 스위칭 파싱 결과
 */
export function parseChannelSwitch(text: string): ChannelSwitchResult {
  const trimmedText = text.trim();
  
  // 채널 태그만 있는지 확인 (공백 + Enter는 허용)
  const channelOnlyRegex = /^([+-]#[a-zA-Z0-9-_가-힣]+(\s+|$))+$/;
  const isChannelCommand = channelOnlyRegex.test(trimmedText);
  
  if (!isChannelCommand) {
    return {
      isChannelCommand: false,
      addChannels: [],
      removeChannels: [],
      enterInputMode: false
    };
  }
  
  // 채널 태그 파싱
  const addChannelRegex = /\+#([a-zA-Z0-9-_가-힣]+)/g;
  const removeChannelRegex = /-#([a-zA-Z0-9-_가-힣]+)/g;
  
  const addChannels: string[] = [];
  const removeChannels: string[] = [];
  
  let match;
  
  // +# 태그 추출
  while ((match = addChannelRegex.exec(trimmedText)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!addChannels.includes(channelName)) {
      addChannels.push(channelName);
    }
  }
  
  // -# 태그 추출  
  while ((match = removeChannelRegex.exec(trimmedText)) !== null) {
    const channelName = match[1].toLowerCase();
    if (!removeChannels.includes(channelName)) {
      removeChannels.push(channelName);
    }
  }
  
  // 공백이나 Enter로 끝나면 즉시 입력 모드로 전환
  const enterInputMode = /\s+$/.test(text) || text.endsWith('\n');
  
  return {
    isChannelCommand: true,
    addChannels,
    removeChannels,
    enterInputMode
  };
}

/**
 * 텍스트에 채널 태그가 있는지 확인합니다
 * @param text 검사할 텍스트
 * @returns 채널 태그 포함 여부
 */
export function hasChannelTags(text: string): boolean {
  const channelTagRegex = /[+-]#[a-zA-Z0-9-_가-힣]+/;
  return channelTagRegex.test(text);
}

/**
 * 채널 목록을 마지막 활동 시간순으로 정렬합니다
 * @param channels 채널 배열
 * @returns 정렬된 채널 배열
 */
export function sortChannelsByActivity<T extends { lastActivity: string }>(channels: T[]): T[] {
  return [...channels].sort((a, b) => 
    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
  );
}
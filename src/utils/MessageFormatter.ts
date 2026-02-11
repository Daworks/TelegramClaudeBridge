const TELEGRAM_MAX_LENGTH = 4096;

// MarkdownV2 특수문자 이스케이프
const ESCAPE_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;

export function escapeMarkdownV2(text: string): string {
  return text.replace(ESCAPE_CHARS, "\\$1");
}

// 코드 블록 내부는 `, \만 이스케이프
function escapeCodeBlock(text: string): string {
  return text.replace(/([`\\])/g, "\\$1");
}

/**
 * Claude 응답(Markdown)을 Telegram MarkdownV2로 변환.
 * 코드 블록은 보존하고, 그 외 텍스트만 이스케이프.
 */
export function formatForTelegram(text: string): string {
  const parts: string[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;

  for (const match of text.matchAll(codeBlockRegex)) {
    // 코드 블록 이전의 일반 텍스트
    if (match.index! > lastIndex) {
      parts.push(escapeMarkdownV2(text.slice(lastIndex, match.index)));
    }
    // 코드 블록 보존 (내부만 이스케이프)
    const lang = match[1] ?? "";
    const code = escapeCodeBlock(match[2] ?? "");
    parts.push(`\`\`\`${lang}\n${code}\`\`\``);
    lastIndex = match.index! + match[0].length;
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push(escapeMarkdownV2(text.slice(lastIndex)));
  }

  return parts.join("");
}

/**
 * 긴 메시지를 Telegram 제한(4096자)에 맞게 분할.
 * 코드 블록이 잘리지 않도록 줄바꿈 기준으로 분할.
 */
export function splitMessage(text: string): string[] {
  if (text.length <= TELEGRAM_MAX_LENGTH) return [text];

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    if (remaining.length <= TELEGRAM_MAX_LENGTH) {
      chunks.push(remaining);
      break;
    }

    // 제한 내 마지막 줄바꿈 찾기
    let splitAt = remaining.lastIndexOf("\n", TELEGRAM_MAX_LENGTH);
    if (splitAt <= 0) splitAt = TELEGRAM_MAX_LENGTH;

    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trimStart();
  }

  return chunks;
}

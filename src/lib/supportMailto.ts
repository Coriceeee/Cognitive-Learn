/** Compose a mailto request without collecting or persisting student contact data. */
export const SUPPORT_EMAIL = "cognitivelearn.ai@gmail.com";
export function buildSupportMailto(topic: string, details: string, name: string): string {
  const subject = `[Cognitive Learn AI] ${topic}`;
  const body = [
    `Chủ đề: ${topic}`,
    `Tên gọi: ${name.trim() || "Không cung cấp"}`,
    "",
    details.trim(),
    "",
    "(Vui lòng không gửi mật khẩu, mã xác thực, học bạ đầy đủ hoặc thông tin nhạy cảm.)",
  ].join("\n");
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

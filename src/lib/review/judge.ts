// 全角英数字を半角に揃え、前後の空白を除き、連続する空白を 1 つにまとめる
function normalize(text: string): string {
  return text.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function isCorrectAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalized = normalize(userAnswer);
  return normalized !== "" && normalized === normalize(correctAnswer);
}

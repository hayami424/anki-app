export const questionMaxLength = 1000;
export const categoryNameMaxLength = 50;

export type QuestionInput = {
  categoryId: string;
  question: string;
  answer: string;
  url: string | null;
};

export type QuestionFormValues = {
  categoryId: string;
  question: string;
  answer: string;
  url: string;
};

export type QuestionFieldErrors = Partial<Record<keyof QuestionInput, string>>;

export type QuestionValidationResult =
  | { ok: true; value: QuestionInput }
  | { ok: false; errors: QuestionFieldErrors; values: QuestionFormValues };

function getString(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isHttpUrl(text: string): boolean {
  try {
    const { protocol } = new URL(text);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function validateRequiredText(
  text: string,
  label: string,
  maxLength: number,
): string | undefined {
  if (text === "") return `${label}を入力してください`;
  if (text.length > maxLength) return `${label}は${maxLength}文字以内で入力してください`;
  return undefined;
}

export function validateQuestionInput(formData: FormData): QuestionValidationResult {
  const values: QuestionFormValues = {
    categoryId: getString(formData, "categoryId"),
    question: getString(formData, "question"),
    answer: getString(formData, "answer"),
    url: getString(formData, "url"),
  };
  const question = values.question.trim();
  const answer = values.answer.trim();
  const url = values.url.trim();

  const errors: QuestionFieldErrors = {
    categoryId: values.categoryId === "" ? "カテゴリーを選択してください" : undefined,
    question: validateRequiredText(question, "問題", questionMaxLength),
    answer: validateRequiredText(answer, "解答", questionMaxLength),
    url:
      url !== "" && !isHttpUrl(url)
        ? "URLは http:// または https:// で始まる形式で入力してください"
        : undefined,
  };

  if (Object.values(errors).some((error) => error !== undefined)) {
    return { ok: false, errors, values };
  }
  return {
    ok: true,
    value: { categoryId: values.categoryId, question, answer, url: url === "" ? null : url },
  };
}

export function validateCategoryName(
  formData: FormData,
): { ok: true; value: string } | { ok: false; error: string } {
  const name = getString(formData, "name").trim();
  const error = validateRequiredText(name, "カテゴリー名", categoryNameMaxLength);
  return error === undefined ? { ok: true, value: name } : { ok: false, error };
}

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

export const displayNameMaxLength = 50;
export const passwordMinLength = 8;

export type AuthFormValues = {
  name: string;
  email: string;
};

export type AuthFieldErrors = Partial<Record<"name" | "email" | "password", string>>;

export type AuthValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: AuthFieldErrors; values: AuthFormValues };

// 「@ の前後に文字があり、ドメインに . を含む」程度の確認にとどめ、厳密な判定は Supabase に任せる
function isEmail(text: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function validateEmail(email: string): string | undefined {
  if (email === "") return "メールアドレスを入力してください";
  if (!isEmail(email)) return "メールアドレスの形式が正しくありません";
  return undefined;
}

// 要件: 英小文字・英大文字・数字・記号をすべて含み、8 文字以上
export function validatePassword(password: string): string | undefined {
  if (password === "") return "パスワードを入力してください";
  if (
    password.length < passwordMinLength ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^a-zA-Z0-9]/.test(password)
  ) {
    return `パスワードは英小文字・英大文字・数字・記号をすべて含む${passwordMinLength}文字以上で入力してください`;
  }
  return undefined;
}

function hasErrors(errors: AuthFieldErrors): boolean {
  return Object.values(errors).some((error) => error !== undefined);
}

export function validateSignUp(
  formData: FormData,
): AuthValidationResult<{ name: string; email: string; password: string }> {
  const values: AuthFormValues = {
    name: getString(formData, "name"),
    email: getString(formData, "email"),
  };
  const name = values.name.trim();
  const email = values.email.trim();
  const password = getString(formData, "password");

  const errors: AuthFieldErrors = {
    name: validateRequiredText(name, "名前", displayNameMaxLength),
    email: validateEmail(email),
    password: validatePassword(password),
  };
  if (hasErrors(errors)) return { ok: false, errors, values };
  return { ok: true, value: { name, email, password } };
}

// ログイン時はパスワードの形式を問わない（形式の条件を変えても既存の利用者がログインできるように）
export function validateLogin(
  formData: FormData,
): AuthValidationResult<{ email: string; password: string }> {
  const values: AuthFormValues = { name: "", email: getString(formData, "email") };
  const email = values.email.trim();
  const password = getString(formData, "password");

  const errors: AuthFieldErrors = {
    email: validateEmail(email),
    password: password === "" ? "パスワードを入力してください" : undefined,
  };
  if (hasErrors(errors)) return { ok: false, errors, values };
  return { ok: true, value: { email, password } };
}

export function validateEmailInput(formData: FormData): AuthValidationResult<{ email: string }> {
  const values: AuthFormValues = { name: "", email: getString(formData, "email") };
  const email = values.email.trim();
  const error = validateEmail(email);
  if (error) return { ok: false, errors: { email: error }, values };
  return { ok: true, value: { email } };
}

export function validateNewPassword(
  formData: FormData,
): AuthValidationResult<{ password: string }> {
  const password = getString(formData, "password");
  const error = validatePassword(password);
  if (error) return { ok: false, errors: { password: error }, values: { name: "", email: "" } };
  return { ok: true, value: { password } };
}

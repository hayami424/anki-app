import { describe, expect, test } from "vitest";
import { addDays, isDue, nextSchedule, toTokyoDate } from "./schedule";

describe("addDays", () => {
  test("指定した日数だけ後ろの日付を返す", () => {
    expect(addDays("2026-01-01", 7)).toBe("2026-01-08");
  });

  test("月末・年末をまたいでも正しい日付を返す", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  test("うるう年の 2 月 29 日を扱える", () => {
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});

describe("toTokyoDate", () => {
  test("UTC で前日 15:00 以降の時刻は日本時間の翌日として扱う", () => {
    expect(toTokyoDate(new Date("2026-01-01T15:00:00Z"))).toBe("2026-01-02");
  });

  test("UTC で 14:59 の時刻は日本時間の同じ日として扱う", () => {
    expect(toTokyoDate(new Date("2026-01-01T14:59:59Z"))).toBe("2026-01-01");
  });
});

describe("isDue", () => {
  test("出題日が今日なら出題対象になる", () => {
    expect(isDue({ nextReviewOn: "2026-01-02" }, "2026-01-02")).toBe(true);
  });

  test("出題日を過ぎていれば出題対象になる", () => {
    expect(isDue({ nextReviewOn: "2026-01-01" }, "2026-01-02")).toBe(true);
  });

  test("出題日が明日なら出題対象にならない", () => {
    expect(isDue({ nextReviewOn: "2026-01-03" }, "2026-01-02")).toBe(false);
  });

  test("復習完了（出題日なし）の問題は出題対象にならない", () => {
    expect(isDue({ nextReviewOn: null }, "2026-01-02")).toBe(false);
  });
});

describe("nextSchedule", () => {
  const createdOn = "2026-01-01";

  describe("正解した場合", () => {
    test("フェーズ1で正解すると、フェーズ2になり作成日から 7 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 1, createdOn }, true, "2026-01-02"),
      ).toEqual({ reviewPhase: 2, nextReviewOn: "2026-01-08" });
    });

    test("フェーズ2で正解すると、フェーズ3になり作成日から 30 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 2, createdOn }, true, "2026-01-08"),
      ).toEqual({ reviewPhase: 3, nextReviewOn: "2026-01-31" });
    });

    test("フェーズ3で正解すると、フェーズ4（復習完了）になり出題日がなくなる", () => {
      expect(
        nextSchedule({ reviewPhase: 3, createdOn }, true, "2026-01-31"),
      ).toEqual({ reviewPhase: 4, nextReviewOn: null });
    });

    test("作成日から 7 日以上経ってからフェーズ1で正解しても、同じ日に再出題せず翌日以降に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 1, createdOn }, true, "2026-01-10"),
      ).toEqual({ reviewPhase: 2, nextReviewOn: "2026-01-11" });
    });

    test("作成日から 7 日後ちょうどの前日にフェーズ1で正解すると、作成日から 7 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 1, createdOn }, true, "2026-01-07"),
      ).toEqual({ reviewPhase: 2, nextReviewOn: "2026-01-08" });
    });
  });

  describe("間違えた場合", () => {
    test("フェーズ1で間違えると、フェーズはそのままで回答日の 1 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 1, createdOn }, false, "2026-01-02"),
      ).toEqual({ reviewPhase: 1, nextReviewOn: "2026-01-03" });
    });

    test("フェーズ2で間違えると、フェーズはそのままで回答日の 7 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 2, createdOn }, false, "2026-01-08"),
      ).toEqual({ reviewPhase: 2, nextReviewOn: "2026-01-15" });
    });

    test("フェーズ3で間違えると、フェーズはそのままで回答日の 30 日後に出題する", () => {
      expect(
        nextSchedule({ reviewPhase: 3, createdOn }, false, "2026-01-31"),
      ).toEqual({ reviewPhase: 3, nextReviewOn: "2026-03-02" });
    });
  });

  test("復習完了（フェーズ4）の問題はスケジュールが変わらない", () => {
    expect(
      nextSchedule({ reviewPhase: 4, createdOn }, false, "2026-02-01"),
    ).toEqual({ reviewPhase: 4, nextReviewOn: null });
  });
});

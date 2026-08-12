type DeliveryDateResult = {
  value: string | null;
  error: string | null;
};
export function parseDeliveryDate(year: string, month: string, day: string): DeliveryDateResult {
  if (!year && !month && !day) {
    return {
      value: null,
      error: null
    };
  }
  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);
  const candidate = new Date(Date.UTC(numericYear, numericMonth - 1, numericDay));
  const valid = year.length === 4 && numericMonth >= 1 && numericMonth <= 12 && numericDay >= 1 && candidate.getUTCFullYear() === numericYear && candidate.getUTCMonth() === numericMonth - 1 && candidate.getUTCDate() === numericDay;
  if (!valid) {
    return {
      value: null,
      error: "납기일을 올바른 YYYY, MM, DD 형식으로 입력해 주세요."
    };
  }
  const today = new Date();
  const todayAt = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (candidate.getTime() < todayAt) {
    return {
      value: null,
      error: "납기일은 오늘보다 이전 날짜로 설정할 수 없습니다."
    };
  }
  return {
    value: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    error: null
  };
}

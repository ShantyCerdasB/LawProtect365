export const fixedNow = (iso = '2024-01-01T00:00:00.000Z') => {
  const d = new Date(iso);
  jest.useFakeTimers().setSystemTime(d);
  return d;
};

export const resetTime = () => jest.useRealTimers();

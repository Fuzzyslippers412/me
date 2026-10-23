export const activityCheckLabels = {
  it: "Ultimo controllo:",
  en: "Last checked:",
  fr: "Derni\u00e8re v\u00e9rification :",
  pt: "\u00daltima verifica\u00e7\u00e3o:"
};

// Legacy snapshots have only generated_at. Never substitute an article date or
// the reader's current clock for the time the collector actually ran.
export function activityCheckedAt(snapshot) {
  return [snapshot.checked_at, snapshot.generated_at].find(
    (value) => typeof value === "string" && Number.isFinite(Date.parse(value))
  );
}

export function formatActivityCheck(snapshot, locale) {
  const value = activityCheckedAt(snapshot);
  if (!value) return "\u2014";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    timeZone: "UTC", timeZoneName: "short"
  }).format(new Date(value));
}

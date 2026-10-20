import { createContext, useContext } from "react";
export const Ctx = createContext(),
  useApp = () => useContext(Ctx);
export const api = async (u, m = "GET", b) => {
  const r = await fetch("/api" + u, {
      method: m,
      headers: b ? { "Content-Type": "application/json" } : {},
      body: b && JSON.stringify(b),
    }),
    j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Something went wrong");
  return j;
};
export const WD = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  ref = (n) => "APP-" + String(n).padStart(5, "0");
export const mm = (s) => {
    const [a, b] = s.split(":");
    return +a * 60 + +b;
  },
  f12 = (m) => {
    const h = Math.floor(m / 60);
    return `${((h + 11) % 12) + 1}:${String(m % 60).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };
export const offs = (c) =>
  String(c.off_days)
    .split(",")
    .map((s) => s.trim());
export const wa = (p, t) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d[0] == "0") d = "92" + d.slice(1);
  return "https://wa.me/" + d + (t ? "?text=" + encodeURIComponent(t) : "");
};
export const now = (c) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: c.tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((x) => [x.type, x.value]),
  );
  return {
    d: `${p.year}-${p.month}-${p.day}`,
    wd: p.weekday,
    m: +p.hour * 60 + +p.minute,
  };
};
export const status = (c, ev, t) => {
  const n = now(c),
    o = mm(c.open_time),
    cl = mm(c.close_time),
    h = ev.find((x) => x.day == n.d && x.kind == "Holiday");
  if (h) return ["x", t("Holiday") + ": " + h.title];
  if (offs(c).includes(n.wd)) return ["x", `${t("Closed today")} (${t(n.wd)})`];
  return n.m >= o && n.m < cl
    ? ["o", `${t("Open now")} - ${t("closes at")} ${f12(cl)}`]
    : ["x", n.m < o ? `${t("Opens at")} ${f12(o)}` : t("Closed now")];
};
export const hrs = (c, t) =>
  `${f12(mm(c.open_time))} - ${f12(mm(c.close_time))} | ${t("Holiday")}: ${offs(
    c,
  )
    .map((x) => t(x))
    .join(", ")}`;

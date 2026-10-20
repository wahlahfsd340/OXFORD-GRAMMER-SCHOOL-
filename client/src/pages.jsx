import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp, api, ref, WD, mm, f12, offs, now, status } from "./lib.js";
const FEAT = [
  [
    "👩‍🏫",
    "Qualified teachers",
    "Experienced, caring staff who know every child by name.",
  ],
  [
    "🔬",
    "Science and computer labs",
    "Hands-on learning with modern, well-kept labs.",
  ],
  [
    "🔒",
    "Safe campus",
    "CCTV, trained guards and supervised pick-up and drop-off.",
  ],
  [
    "⚽",
    "Sports and activities",
    "Cricket, football, debates, art and annual functions.",
  ],
  [
    "📜",
    "Strong moral values",
    "Character building alongside academic results.",
  ],
  [
    "🚌",
    "School transport",
    "Safe, reliable van and bus routes across the city.",
  ],
];
const useF = () => {
  const [v, s] = useState({});
  return [v, (e) => s((o) => ({ ...o, [e.target.name]: e.target.value }))];
};
const Fld = ({ l, n, v, on, ...p }) => (
  <div>
    <label>
      {l}
      <input name={n} value={v[n] || ""} onChange={on} {...p} />
    </label>
  </div>
);
const Hp = ({ v, on }) => (
  <input
    name="fax_no"
    value={v.fax_no || ""}
    onChange={on}
    tabIndex={-1}
    autoComplete="off"
    aria-hidden="true"
    style={{ position: "absolute", left: -9999 }}
  />
);
function Hero({ title, sub }) {
  const { site } = useApp();
  useEffect(() => {
    document.title = title + " | " + site.name;
  }, [title, site.name]);
  return (
    <div className="page">
      <div className="wrap">
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}
const Card = ({ n }) => (
  <div className="card">
    <small>{n.createdAt.slice(0, 10)}</small>
    <h3>{n.title}</h3>
    <p>{n.body}</p>
  </div>
);
export function Home() {
  const { site: c, t } = useApp(),
    [nw, setNw] = useState([]),
    y = new Date().getFullYear();
  useEffect(() => {
    api("/news").then((r) => setNw(r.slice(0, 3)));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1>
            {t("Welcome to")} {c.name}
          </h1>
          <p>{c.tagline}</p>
          <Link className="btn gold" to="/admission">
            {t("Apply for admission")}
          </Link>{" "}
          <Link className="btn out" to="/contact">
            {t("Contact us")}
          </Link>
        </div>
      </section>
      <div className="wrap grid stats">
        {[
          [c.students, "Students"],
          [c.teachers, "Teachers"],
          [c.years, "Years of excellence"],
          [c.classes.length, "Classes"],
        ].map(([a, b]) => (
          <div key={b}>
            <b>{a}</b>
            <span>{t(b)}</span>
          </div>
        ))}
      </div>
      <section>
        <div className="wrap">
          <h2>{t("Why parents choose us")}</h2>
          <div className="grid">
            {FEAT.map((x) => (
              <div className="card" key={x[1]}>
                <i>{x[0]}</i>
                <h3>{x[1]}</h3>
                <p>{x[2]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {nw.length > 0 && (
        <section>
          <div className="wrap">
            <h2>{t("Latest news")}</h2>
            <div className="grid">
              {nw.map((n) => (
                <Card key={n._id} n={{ ...n, body: n.body.slice(0, 110) }} />
              ))}
            </div>
            <p>
              <Link className="btn" to="/news">
                {t("All news")}
              </Link>
            </p>
          </div>
        </section>
      )}
      <section className="cta">
        <div className="wrap">
          <h2>
            Admissions open {y}-{y + 1}
          </h2>
          <p>Seats are limited. Apply online in two minutes.</p>
          <Link className="btn gold" to="/admission">
            {t("Apply now")}
          </Link>
        </div>
      </section>
    </>
  );
}
export function About() {
  const { site: c } = useApp();
  return (
    <>
      <Hero title={"About " + c.name} />
      <section>
        <div className="wrap two">
          <div>
            <h2>Our story</h2>
            <p>
              We started with one classroom and one belief: every child can
              excel with the right guidance. Today, {c.name} is a trusted school
              where students grow in knowledge, confidence and character.
            </p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="card">
              <h3>Our mission</h3>
              <p>
                To give every student a strong academic base and good manners.
              </p>
            </div>
            <div className="card">
              <h3>Our vision</h3>
              <p>
                To raise responsible leaders who serve their families and
                country.
              </p>
            </div>
            <div className="card">
              <h3>Our values</h3>
              <p>Honesty, discipline, respect and hard work.</p>
            </div>
            <div className="card">
              <h3>Principal's message</h3>
              <p>
                "We work with parents so every child succeeds." - {c.principal}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
export function News() {
  const [r, setR] = useState(null);
  useEffect(() => {
    api("/news").then(setR);
  }, []);
  return (
    <>
      <Hero title="News & notices" />
      <section>
        <div className="wrap">
          {r &&
            r.map((n) => (
              <div key={n._id} style={{ marginBottom: 18 }}>
                <Card n={n} />
              </div>
            ))}
          {r && !r.length && <p>No news yet. Please check back soon.</p>}
        </div>
      </section>
    </>
  );
}
export function Calendar() {
  const { site: c, t, lang, events } = useApp(),
    n = now(c),
    [m, setM] = useState(n.d.slice(0, 7)),
    [y, mo] = m.split("-").map(Number);
  const first = new Date(Date.UTC(y, mo - 1, 1)),
    len = new Date(Date.UTC(y, mo, 0)).getUTCDate(),
    pad = (first.getUTCDay() + 6) % 7,
    mv = (k) => {
      const d = new Date(Date.UTC(y, mo - 1 + k, 1));
      setM(
        d.getUTCFullYear() + "-" + String(d.getUTCMonth() + 1).padStart(2, "0"),
      );
    },
    days = [];
  for (let d = 1; d <= len; d++) {
    const ds = `${m}-${String(d).padStart(2, "0")}`,
      es = events.filter((x) => x.day == ds),
      off =
        offs(c).includes(WD[(pad + d - 1) % 7]) ||
        es.some((x) => x.kind == "Holiday");
    days.push(
      <div
        key={d}
        className={"day" + (off ? " off" : "") + (ds == n.d ? " today" : "")}
      >
        <span>{d}</span>
        {es.map((x) => (
          <em key={x._id} className={"k" + x.kind}>
            {x.title}
          </em>
        ))}
      </div>,
    );
  }
  const up = events.filter((x) => x.day >= n.d).slice(0, 8);
  return (
    <>
      <Hero title={t("School calendar")} sub={status(c, events, t)[1]} />
      <section>
        <div className="wrap two cw">
          <div>
            <p className="mnav">
              <button className="btn mini" onClick={() => mv(-1)}>
                ‹
              </button>
              <b>
                {first.toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </b>
              <button className="btn mini" onClick={() => mv(1)}>
                ›
              </button>
            </p>
            <div className="cal">
              {WD.map((w) => (
                <b key={w}>{lang == "ur" ? t(w) : w.slice(0, 3)}</b>
              ))}
              {Array.from({ length: pad }, (_, i) => (
                <i key={"p" + i} />
              ))}
              {days}
            </div>
          </div>
          <div>
            <div className="card">
              <h3>{t("Weekly timings")}</h3>
              <table>
                <tbody>
                  {WD.map((w) => (
                    <tr key={w}>
                      <td>{t(w)}</td>
                      <td>
                        {offs(c).includes(w) ? (
                          <b>{t("Holiday")}</b>
                        ) : (
                          f12(mm(c.open_time)) + " - " + f12(mm(c.close_time))
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="card" style={{ marginTop: 18 }}>
              <h3>{t("Upcoming events")}</h3>
              {up.map((x) => (
                <p key={x._id}>
                  <b>{x.day.slice(5)}</b> - {x.title} <small>({x.kind})</small>
                </p>
              ))}
              {!up.length && <p>-</p>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
export function Admission() {
  const { site: c, t } = useApp(),
    [v, on] = useF(),
    [m, setM] = useState(null);
  const go = async (e) => {
    e.preventDefault();
    try {
      setM({ ok: (await api("/admission", "POST", v)).ref });
    } catch (x) {
      setM({ er: x.message });
    }
  };
  return (
    <>
      <Hero title={t("Admission form")} />
      <section>
        <div className="wrap">
          {m?.ok && (
            <div className="alert ok">
              Thank you! Your application number is <b>{m.ok}</b>. Save it and
              use{" "}
              <Link to="/track">
                <u>{t("Track application")}</u>
              </Link>{" "}
              to check status.
            </div>
          )}
          {m?.er && <div className="alert er">{m.er}</div>}
          <form onSubmit={go}>
            <Fld l="Student name *" n="student" v={v} on={on} required />
            <Fld l="Father's name *" n="father" v={v} on={on} required />
            <div>
              <label>
                Class *
                <select
                  name="class"
                  value={v.class || ""}
                  onChange={on}
                  required
                >
                  <option value="">Select class</option>
                  {c.classes.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            </div>
            <Fld l="Date of birth" n="dob" type="date" v={v} on={on} />
            <Fld l="Phone *" n="phone" type="tel" v={v} on={on} required />
            <Fld l="Email" n="email" type="email" v={v} on={on} />
            <div className="full">
              <label>
                Address
                <textarea
                  name="address"
                  rows="3"
                  value={v.address || ""}
                  onChange={on}
                />
              </label>
            </div>
            <Hp v={v} on={on} />
            <button className="btn">Submit application</button>
          </form>
        </div>
      </section>
    </>
  );
}
export function Track() {
  const [v, on] = useF(),
    [r, setR] = useState(null),
    [er, setEr] = useState("");
  const go = async (e) => {
    e.preventDefault();
    setEr("");
    setR(null);
    try {
      setR(await api("/track", "POST", v));
    } catch (x) {
      setEr(x.message);
    }
  };
  return (
    <>
      <Hero title="Track your application" />
      <section>
        <div className="wrap" style={{ maxWidth: 560 }}>
          {er && <div className="alert er">{er}</div>}
          {r && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3>{r.ref}</h3>
              <p>
                Student: <b>{r.student}</b>
                <br />
                Class: {r.class}
                <br />
                Status: <b>{r.status}</b>
              </p>
            </div>
          )}
          <form onSubmit={go} style={{ gridTemplateColumns: "1fr" }}>
            <Fld
              l="Application number"
              n="ref"
              placeholder="APP-00012"
              v={v}
              on={on}
              required
            />
            <Fld
              l="Phone number used in the form"
              n="phone"
              type="tel"
              v={v}
              on={on}
              required
            />
            <button className="btn">Check status</button>
          </form>
        </div>
      </section>
    </>
  );
}
export function Contact() {
  const { site: c, t, lang } = useApp(),
    [v, on] = useF(),
    [m, setM] = useState(null);
  const go = async (e) => {
    e.preventDefault();
    try {
      await api("/contact", "POST", v);
      setM({ ok: 1 });
    } catch (x) {
      setM({ er: x.message });
    }
  };
  return (
    <>
      <Hero title={t("Contact us")} />
      <section>
        <div className="wrap two">
          <div className="card">
            <h3>Get in touch</h3>
            <p>📍 {c.address}</p>
            <p>☎ {c.phone}</p>
            <p>✉ {c.email}</p>
            <iframe
              title="Map"
              style={{ border: 0, width: "100%", height: 220, borderRadius: 6 }}
              loading="lazy"
              src={
                "https://maps.google.com/maps?q=" +
                encodeURIComponent(c.address) +
                "&output=embed"
              }
            />
          </div>
          <div>
            {m?.ok && (
              <div className="alert ok">Message sent. We will reply soon.</div>
            )}
            {m?.er && <div className="alert er">{m.er}</div>}
            <form onSubmit={go}>
              <Fld l="Name *" n="name" v={v} on={on} required />
              <Fld l="Phone" n="phone" type="tel" v={v} on={on} />
              <div className="full">
                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={v.email || ""}
                    onChange={on}
                  />
                </label>
              </div>
              <div className="full">
                <label>
                  Message *
                  <textarea
                    name="message"
                    rows="5"
                    value={v.message || ""}
                    onChange={on}
                    required
                  />
                </label>
              </div>
              <Hp v={v} on={on} />
              <button className="btn">Send message</button>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
export function Login() {
  const { t, setUser } = useApp(),
    [v, on] = useF(),
    [er, setEr] = useState(""),
    nav = useNavigate();
  const go = async (e) => {
    e.preventDefault();
    try {
      const u = await api("/login", "POST", v);
      setUser(u);
      nav("/admin");
    } catch (x) {
      setEr(x.message);
    }
  };
  return (
    <>
      <Hero title={t("Login")} />
      <section>
        <div className="wrap" style={{ maxWidth: 460 }}>
          {er && <div className="alert er">{er}</div>}
          <form onSubmit={go} style={{ gridTemplateColumns: "1fr" }}>
            <Fld l="Username" n="username" v={v} on={on} required autoFocus />
            <Fld
              l="Password"
              n="password"
              type="password"
              v={v}
              on={on}
              required
            />
            <button className="btn">Login</button>
          </form>
        </div>
      </section>
    </>
  );
}
export const NotFound = () => (
  <section>
    <div className="wrap">
      <h2>404 - Page not found</h2>
      <p>
        <Link className="btn" to="/">
          Home
        </Link>
      </p>
    </div>
  </section>
);

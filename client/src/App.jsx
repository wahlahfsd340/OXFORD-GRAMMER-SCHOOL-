import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import UR from "./lang_ur.json";
import { Ctx, api, status, hrs } from "./lib.js";
import {
  Home,
  About,
  News,
  Calendar,
  Admission,
  Track,
  Contact,
  Login,
  NotFound,
} from "./pages.jsx";
import Admin from "./Admin.jsx";
import Chat from "./Chat.jsx";
import whatsappIcon from "../../svg/whatsapp-brands-solid.svg";
export default function App() {
  const [site, setSite] = useState(null),
    [loadError, setLoadError] = useState(""),
    [user, setUser] = useState(null),
    [events, setEvents] = useState([]),
    [, tick] = useState(0),
    loc = useLocation(),
    [lang, setLang] = useState(localStorage.lang || "en"),
    [theme, setTheme] = useState(
      localStorage.th ||
        (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"),
    );
  useEffect(() => {
    api("/site")
      .then(setSite)
      .catch((e) => setLoadError(e.message));
    api("/me")
      .then(setUser)
      .catch((e) => console.error("Failed to load login status:", e));
    api("/events")
      .then(setEvents)
      .catch((e) => console.error("Failed to load events:", e));
    const i = setInterval(() => tick((x) => x + 1), 6e4);
    return () => clearInterval(i);
  }, []);
  useEffect(() => {
    const d = document.documentElement;
    d.dataset.theme = theme;
    d.lang = lang;
    d.dir = lang == "ur" ? "rtl" : "ltr";
    localStorage.th = theme;
    localStorage.lang = lang;
  }, [theme, lang]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  if (!site)
    return loadError ? (
      <main style={{ maxWidth: 640, margin: "80px auto", padding: 24 }}>
        <h1>Website could not connect to the server</h1>
        <p>
          Make sure the backend and MongoDB are running, then reload this page.
        </p>
        <p role="alert">Error: {loadError}</p>
        <button className="btn" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </main>
    ) : (
      <p style={{ padding: 40 }}>Loading...</p>
    );
  const t = (s) => (lang == "ur" && UR[s]) || s,
    st = status(site, events, t),
    ctx = { site, setSite, user, setUser, events, setEvents, lang, t };
  return (
    <Ctx.Provider value={ctx}>
      <div className="top">
        <span className={"st " + st[0]}>{st[1]}</span>
        <span>☎ {site.phone}</span>
        <span>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setLang(lang == "ur" ? "en" : "ur");
            }}
          >
            {lang == "ur" ? "English" : "اردو"}
          </a>{" "}
          <button
            type="button"
            aria-label="Dark or light mode"
            onClick={() => setTheme(theme == "dark" ? "light" : "dark")}
          >
            ☼
          </button>
        </span>
      </div>
      <header>
        <Link className="logo" to="/">
          🎓 {site.name}
        </Link>
        <input type="checkbox" id="m" />
        <label htmlFor="m" className="burger">
          ☰
        </label>
        <nav
          onClick={() => {
            document.getElementById("m").checked = false;
          }}
        >
          {[
            ["/", "Home"],
            ["/about", "About"],
            ["/news", "News"],
            ["/calendar", "Calendar"],
            ["/admission", "Admission"],
            ["/contact", "Contact"],
          ].map(([u, n]) => (
            <NavLink
              key={u}
              to={u}
              end
              className={({ isActive }) => (isActive ? "on" : "")}
            >
              {t(n)}
            </NavLink>
          ))}
          <Link className="btn" to={user ? "/admin" : "/login"}>
            {t(user ? "Dashboard" : "Login")}
          </Link>
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/news" element={<News />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/admission" element={<Admission />} />
        <Route path="/track" element={<Track />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <footer>
        <div className="wrap grid">
          <div>
            <h3>{site.name}</h3>
            <p>{site.tagline}</p>
          </div>
          <div>
            <h3>{t("Quick links")}</h3>
            <Link to="/about">{t("About")}</Link>
            <Link to="/admission">{t("Admission")}</Link>
            <Link to="/calendar">{t("Calendar")}</Link>
            <Link to="/contact">{t("Contact")}</Link>
            <Link to="/track">{t("Track application")}</Link>
          </div>
          <div>
            <h3>{t("Visit us")}</h3>
            <p>{site.address}</p>
            <p>{site.phone}</p>
            <p>{hrs(site, t)}</p>
          </div>
        </div>
        <p className="copy">
          © {new Date().getFullYear()} {site.name}. {t("All rights reserved")}.
        </p>
      </footer>
      <a
        className="wa"
        href={"https://wa.me/" + site.whatsapp}
        target="_blank"
        rel="noopener"
        aria-label="Chat on WhatsApp"
      >
        <img src={whatsappIcon} alt="" />
      </a>
      <Chat />
    </Ctx.Provider>
  );
}

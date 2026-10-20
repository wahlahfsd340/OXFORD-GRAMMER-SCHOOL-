require("dotenv").config();
const express = require("express"),
  mongoose = require("mongoose"),
  jwt = require("jsonwebtoken"),
  bcrypt = require("bcryptjs"),
  cookies = require("cookie-parser"),
  helmet = require("helmet"),
  rate = require("express-rate-limit"),
  path = require("path");
const D = require("./defaults"),
  SECRET = process.env.JWT_SECRET || "change-this-secret",
  ST = ["New", "Contacted", "Admitted", "Rejected"];
const M = (n, s) =>
  mongoose.model(n, new mongoose.Schema(s, { timestamps: true }));
const User = M("User", {
    username: { type: String, unique: true },
    password: String,
    role: String,
    name: String,
  }),
  Admission = M("Admission", {
    no: Number,
    student: String,
    father: String,
    class: String,
    dob: String,
    phone: String,
    email: String,
    address: String,
    status: { type: String, default: "New" },
  }),
  Message = M("Message", {
    name: String,
    phone: String,
    email: String,
    message: String,
  }),
  News = M("News", { title: String, body: String }),
  Event = M("Event", {
    title: String,
    day: String,
    kind: { type: String, default: "Event" },
  }),
  Setting = M("Setting", { _id: String, v: String }),
  Counter = M("Counter", { _id: String, n: Number });
const h = (f) => (q, r, n) => Promise.resolve(f(q, r)).catch(n),
  pick = (o, k) =>
    Object.fromEntries(
      k.map((x) => [
        x,
        String(o[x] ?? "")
          .trim()
          .slice(0, 2000),
      ]),
    ),
  ref = (n) => "APP-" + String(n).padStart(5, "0");
const EDIT = [
  "name",
  "tagline",
  "phone",
  "whatsapp",
  "email",
  "address",
  "principal",
  "students",
  "teachers",
  "years",
  "open_time",
  "close_time",
  "off_days",
  "ai_notes",
];
const cfg = async () => {
  const c = { ...D };
  for (const s of await Setting.find()) if (s.v) c[s._id] = s.v;
  return c;
};
const auth = (role) => (q, r, n) => {
  try {
    const u = jwt.verify(q.cookies.token, SECRET);
    if (role && u.role != role) throw 0;
    q.u = u;
    n();
  } catch {
    r.status(401).json({ error: "Login required" });
  }
};
const app = express(),
  api = express.Router(),
  A = express.Router();
let dbConnection;
app.set("trust proxy", 1);
app.use(
  helmet({ contentSecurityPolicy: false }),
  express.json({ limit: "100kb" }),
  cookies(),
);
const connectDatabase = () => {
  if (process.env.NODE_ENV === "production") {
    const missing = ["MONGODB_URI", "JWT_SECRET", "ADMIN_PASS"].filter(
      (key) => !process.env[key],
    );
    if (missing.length)
      throw new Error(
        `Missing required production environment variables: ${missing.join(", ")}`,
      );
  }
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (mongoose.connection.readyState !== 2) dbConnection = null;
  if (!dbConnection) {
    dbConnection = mongoose
      .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/oxford_school")
      .then(async () => {
        if (!(await User.exists({ role: "admin" })))
          await User.create({
            username: D.admin_user,
            password: await bcrypt.hash(
              process.env.ADMIN_PASS || "Change@123",
              10,
            ),
            role: "admin",
            name: "Admin",
          });
      })
      .catch((error) => {
        dbConnection = null;
        throw error;
      });
  }
  return dbConnection;
};
app.use("/api", (q, r, n) => {
  Promise.resolve()
    .then(connectDatabase)
    .then(() => n(), n);
});
api.get(
  "/site",
  h(async (q, r) => {
    const c = await cfg();
    r.json(
      Object.fromEntries(
        [...EDIT.filter((k) => k != "ai_notes"), "classes", "tz"].map((k) => [
          k,
          c[k],
        ]),
      ),
    );
  }),
);
api.get(
  "/news",
  h(async (q, r) => r.json(await News.find().sort("-createdAt").limit(50))),
);
api.get(
  "/events",
  h(async (q, r) => r.json(await Event.find().sort("day").limit(500))),
);
api.post(
  "/admission",
  h(async (q, r) => {
    const b = q.body,
      c = await cfg(),
      d = pick(b, [
        "student",
        "father",
        "class",
        "dob",
        "phone",
        "email",
        "address",
      ]);
    if (b.fax_no) return r.json({ ref: "APP-00000" });
    if (!d.student || !d.father || !d.phone || !c.classes.includes(d.class))
      return r
        .status(400)
        .json({
          error: "Please fill student name, father name, phone and class.",
        });
    const n = (
      await Counter.findByIdAndUpdate(
        "adm",
        { $inc: { n: 1 } },
        { upsert: true, new: true },
      )
    ).n;
    await Admission.create({ ...d, no: n });
    r.json({ ref: ref(n) });
  }),
);
api.post(
  "/track",
  h(async (q, r) => {
    const a = await Admission.findOne({
        no: parseInt(String(q.body.ref || "").replace(/\D/g, "")) || 0,
      }),
      p = String(q.body.phone || "").replace(/\D/g, "");
    if (
      !a ||
      p.length < 7 ||
      a.phone.replace(/\D/g, "").slice(-7) != p.slice(-7)
    )
      return r
        .status(404)
        .json({
          error: "No match. Check the application number and phone number.",
        });
    r.json({
      ref: ref(a.no),
      student: a.student,
      class: a.class,
      status: a.status,
    });
  }),
);
api.post(
  "/contact",
  h(async (q, r) => {
    const d = pick(q.body, ["name", "phone", "email", "message"]);
    if (q.body.fax_no) return r.json({ ok: 1 });
    if (!d.name || !d.message)
      return r
        .status(400)
        .json({ error: "Please enter your name and message." });
    await Message.create(d);
    r.json({ ok: 1 });
  }),
);
api.post(
  "/login",
  rate({
    windowMs: 6e5,
    limit: 10,
    message: { error: "Too many attempts. Try again in 10 minutes." },
  }),
  h(async (q, r) => {
    const u = await User.findOne({
      username: String(q.body.username || "").trim(),
    });
    if (
      !u ||
      !(await bcrypt.compare(String(q.body.password || ""), u.password))
    )
      return r.status(401).json({ error: "Wrong username or password." });
    r.cookie(
      "token",
      jwt.sign({ id: u._id, role: u.role, name: u.name }, SECRET, {
        expiresIn: "7d",
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV == "production",
        maxAge: 6048e5,
      },
    );
    r.json({ role: u.role, name: u.name });
  }),
);
api.get("/me", (q, r) => {
  try {
    r.json(jwt.verify(q.cookies.token, SECRET));
  } catch {
    r.json(null);
  }
});
api.post("/logout", (q, r) => r.clearCookie("token").json({ ok: 1 }));
let cday = "",
  ccount = 0;
api.post(
  "/chat",
  rate({
    windowMs: 6e5,
    limit: 15,
    message: {
      reply:
        "Too many questions. Please wait a few minutes. / براہ کرم چند منٹ انتظار کریں۔",
    },
  }),
  h(async (q, r) => {
    const c = await cfg(),
      off = `Sorry, the assistant is resting. Please call or WhatsApp ${c.phone} / برائے مہربانی فون یا واٹس ایپ کریں: ${c.phone}`,
      msg = String(q.body.m || "")
        .trim()
        .slice(0, 600),
      key = process.env.ANTHROPIC_API_KEY;
    if (!msg) return r.json({ reply: "Please type your question." });
    if (!key || (new Date().toDateString() == cday && ccount >= c.ai_daily))
      return r.json({ reply: off });
    if (new Date().toDateString() != cday) {
      cday = new Date().toDateString();
      ccount = 0;
    }
    ccount++;
    const ms = [];
    for (const x of (Array.isArray(q.body.h) ? q.body.h : []).slice(-8)) {
      const role = x.r == "a" ? "assistant" : "user",
        t = String(x.c || "")
          .trim()
          .slice(0, 600);
      if (t && !(ms.length && ms.at(-1).role == role))
        ms.push({ role, content: t });
    }
    while (ms.length && ms[0].role != "user") ms.shift();
    if (ms.length && ms.at(-1).role == "user") ms.pop();
    ms.push({ role: "user", content: msg });
    const today = new Date().toISOString().slice(0, 10),
      J = (a, f) => (a.length ? a.map(f).join("\n") : "none"),
      ev = await Event.find({ day: { $gte: today } })
        .sort("day")
        .limit(10),
      nw = await News.find().sort("-createdAt").limit(5);
    const system = `You are the friendly AI assistant on the official website of ${c.name}. Now: ${new Date().toLocaleString("en-GB", { timeZone: c.tz })}.
RULES: Reply in the SAME language and script the visitor writes in (Urdu script, Roman Urdu, English, Arabic, Punjabi, Pashto, Sindhi, or any other). Be warm and short (max 6 lines), plain text only, no markdown. Use only the facts below. Never invent fees, dates, names or policies. If a fact is missing, say so and give the school phone/WhatsApp/email. Never ask for or reveal passwords or private data of students, teachers or applicants. Chat politely about other things, but gently bring the talk back to the school.
SCHOOL: ${c.name} - ${c.tagline}. Principal: ${c.principal}. Address: ${c.address}. Phone: ${c.phone}. WhatsApp: ${c.whatsapp}. Email: ${c.email}. Students: ${c.students}, teachers: ${c.teachers}, years: ${c.years}. Classes: ${c.classes.join(", ")}. Timings: ${c.open_time} to ${c.close_time} (24h); weekly holiday: ${c.off_days}.
UPCOMING EVENTS:\n${J(ev, (x) => `${x.day} ${x.title} (${x.kind})`)}
LATEST NEWS:\n${J(nw, (x) => x.title + ": " + x.body.slice(0, 200))}
EXTRA NOTES FROM THE SCHOOL (fees, rules, etc.):\n${c.ai_notes || "none"}
WEBSITE GUIDE: Home: overview and news. About: story and mission. Admission page: fill the form (student name, father name, class, phone required) and you get an application number like APP-00012; the school calls you. Track application page: application number + same phone shows status (New, Contacted, Admitted, Rejected). Calendar page: holidays, exams, events, weekly timings. News page: notices. Contact page: message form and phone. Admin panel is for staff only. Top bar shows if the school is open now; language button switches Urdu/English; sun button switches dark/light mode.`;
    try {
      const j = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: c.ai_model,
          max_tokens: 500,
          system,
          messages: ms,
        }),
      }).then((x) => x.json());
      if (j.content?.[0]?.text) return r.json({ reply: j.content[0].text });
      console.error("AI error", j.error);
    } catch (e) {
      console.error(e);
    }
    r.json({ reply: off });
  }),
);
A.use(auth("admin"));
for (const [n, Mo] of Object.entries({
  admissions: Admission,
  messages: Message,
  news: News,
  events: Event,
})) {
  A.get(
    "/" + n,
    h(async (q, r) =>
      r.json(
        await Mo.find()
          .sort(n == "events" ? "-day" : "-createdAt")
          .limit(500),
      ),
    ),
  );
  A.delete(
    "/" + n + "/:id",
    h(async (q, r) => {
      await Mo.findByIdAndDelete(q.params.id);
      r.json({ ok: 1 });
    }),
  );
}
A.patch(
  "/admissions/:id",
  h(async (q, r) => {
    if (!ST.includes(q.body.status))
      return r.status(400).json({ error: "Bad status" });
    await Admission.findByIdAndUpdate(q.params.id, { status: q.body.status });
    r.json({ ok: 1 });
  }),
);
A.post(
  "/news",
  h(async (q, r) => {
    const d = pick(q.body, ["title", "body"]);
    if (!d.title) return r.status(400).json({ error: "Title is required" });
    r.json(await News.create(d));
  }),
);
A.post(
  "/events",
  h(async (q, r) => {
    const d = pick(q.body, ["title", "day", "kind"]);
    if (!d.title || !/^\d{4}-\d\d-\d\d$/.test(d.day))
      return r.status(400).json({ error: "Title and date are required" });
    r.json(
      await Event.create({
        ...d,
        kind: ["Holiday", "Exam"].includes(d.kind) ? d.kind : "Event",
      }),
    );
  }),
);
A.get(
  "/settings",
  h(async (q, r) => {
    const c = await cfg();
    r.json(Object.fromEntries(EDIT.map((k) => [k, c[k] || ""])));
  }),
);
A.put(
  "/settings",
  h(async (q, r) => {
    for (const k of EDIT)
      await Setting.findByIdAndUpdate(
        k,
        { v: String(q.body[k] ?? "").trim() },
        { upsert: true },
      );
    r.json({ ok: 1 });
  }),
);
A.post(
  "/password",
  h(async (q, r) => {
    const u = await User.findById(q.u.id),
      n = String(q.body.new || "");
    if (!(await bcrypt.compare(String(q.body.old || ""), u.password)))
      return r.status(400).json({ error: "Current password is wrong." });
    if (n.length < 8 || n !== q.body.new2)
      return r
        .status(400)
        .json({
          error:
            "New password must be 8+ characters and both fields must match.",
        });
    u.password = await bcrypt.hash(n, 10);
    await u.save();
    r.json({ ok: 1 });
  }),
);
A.get(
  "/export",
  h(async (q, r) => {
    const cell = (s) => {
      s = String(s ?? "");
      if (/^[=@]|^[+-]\D/.test(s)) s = "'" + s;
      return '"' + s.replace(/"/g, '""') + '"';
    };
    r.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=admissions.csv",
    });
    r.send(
      "\uFEFF" +
        [
          [
            "No",
            "Date",
            "Student",
            "Father",
            "Class",
            "DOB",
            "Phone",
            "Email",
            "Address",
            "Status",
          ],
          ...(await Admission.find().sort("no")).map((a) => [
            ref(a.no),
            a.createdAt.toISOString().slice(0, 10),
            a.student,
            a.father,
            a.class,
            a.dob,
            a.phone,
            a.email,
            a.address,
            a.status,
          ]),
        ]
          .map((x) => x.map(cell).join(","))
          .join("\n"),
    );
  }),
);
api.use("/admin", A);
app.use("/api", api);
app.use("/api", (q, r) => r.status(404).json({ error: "Not found" }));
const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));
app.get("*", (q, r) =>
  r.sendFile(
    path.join(publicDir, "index.html"),
    (e) => e && r.status(404).send("Run: cd client && npm run build"),
  ),
);
app.use((e, q, r, n) => {
  console.error(e);
  r.status(500).json({ error: "Server error" });
});
if (require.main === module) {
  connectDatabase()
    .then(() => {
    app.listen(process.env.PORT || 5000, () =>
      console.log("Server on http://localhost:" + (process.env.PORT || 5000)),
    );
    })
    .catch((e) => {
      console.error("MongoDB connect failed:", e.message);
      process.exit(1);
    });
}
module.exports = app;

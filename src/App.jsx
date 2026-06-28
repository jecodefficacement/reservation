import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import {
  EMAILJS_SERVICE_ID,
  EMAILJS_TEMPLATE_ID,
  EMAILJS_PUBLIC_KEY,
  GOOGLE_SHEET_URL,
  ADMIN_PASSWORD,
} from "./config.js";

// ─────────────────────────────────────────
//  GOOGLE SHEETS — API centrale
// ─────────────────────────────────────────
async function gsGet() {
  try {
    const res = await fetch(GOOGLE_SHEET_URL);
    const data = await res.json();
    return Array.isArray(data) ? data.reverse() : [];
  } catch (e) {
    console.error("Erreur lecture Google Sheets:", e);
    return [];
  }
}

async function gsPost(payload) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("Erreur écriture Google Sheets:", e);
  }
}

async function sendEmailNotification(entry) {
  if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY.startsWith("REMPLACE")) return;
  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        nom:       entry.nom,
        telephone: entry.telephone,
        email:     entry.email || "Non fourni",
        niveau:    entry.niveau,
        question:  entry.question || "Aucune",
        date:      entry.date,
      },
      EMAILJS_PUBLIC_KEY
    );
  } catch (e) {
    console.warn("EmailJS:", e.message);
  }
}

// ─────────────────────────────────────────
//  DESIGN TOKENS
// ─────────────────────────────────────────
const C = {
  violet:   "#46008C",
  violetMid:"#6B00CC",
  rose:     "#CC0066",
  yellow:   "#FFD700",
  green:    "#25D366",
  white:    "#FFFFFF",
  bg:       "#F3F0FA",
  card:     "#FFFFFF",
  muted:    "#888",
  border:   "#E5E0F0",
  text:     "#1A1A2E",
  textSoft: "#555",
};

const gradBg  = `linear-gradient(145deg, ${C.violet} 0%, ${C.violetMid} 50%, ${C.rose} 100%)`;
const gradBtn = `linear-gradient(135deg, ${C.violet}, ${C.rose})`;

const statusMeta = {
  "En attente": { color: "#D97706", bg: "#FEF3C7" },
  "Confirmé":   { color: "#16A34A", bg: "#F0FDF4" },
  "Annulé":     { color: "#DC2626", bg: "#FEF2F2" },
};

// ─────────────────────────────────────────
//  COMPOSANTS UI
// ─────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <div style={{ background: C.card, borderRadius: 20, padding: "2rem", boxShadow: "0 8px 32px rgba(70,0,140,0.12)", ...style }}>
      {children}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontWeight: 700, color: C.text, fontSize: "0.88rem", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: C.rose, fontSize: "0.78rem", marginTop: 5 }}>⚠ {error}</p>}
    </div>
  );
}

function inputSx(hasError = false) {
  return {
    width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
    border: `2px solid ${hasError ? C.rose : C.border}`,
    background: hasError ? "#FFF0F5" : C.white,
    fontSize: "0.95rem", color: C.text, outline: "none",
  };
}

function Badge({ children, bg = "rgba(255,255,255,0.18)", color = C.white, style = {} }) {
  return (
    <span style={{ display: "inline-block", background: bg, color, borderRadius: 20, padding: "0.3rem 0.9rem", fontSize: "0.82rem", fontWeight: 600, ...style }}>
      {children}
    </span>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ background: C.white, borderRadius: 9, padding: "4px 10px", fontFamily: "monospace", fontWeight: 700, color: C.violet, fontSize: "1rem" }}>
        &lt;/&gt;
      </div>
      <span style={{ color: C.white, fontWeight: 900, fontSize: "1.2rem" }}>JeCode</span>
    </div>
  );
}

// ─────────────────────────────────────────
//  PAGE PUBLIQUE
// ─────────────────────────────────────────
function PublicPage({ onAdmin }) {
  const [form, setForm]     = useState({ nom: "", telephone: "", email: "", niveau: "", question: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })); };

  const validate = () => {
    const e = {};
    if (!form.nom.trim())       e.nom       = "Ton nom complet est requis";
    if (!form.telephone.trim()) e.telephone = "Ton numéro de téléphone est requis";
    if (!form.niveau)           e.niveau    = "Choisis ton niveau d'études";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const entry = {
      id:        Date.now(),
      nom:       form.nom.trim(),
      telephone: form.telephone.trim(),
      email:     form.email.trim(),
      niveau:    form.niveau,
      question:  form.question.trim(),
      date:      new Date().toLocaleString("fr-FR"),
      status:    "En attente",
    };
    await Promise.allSettled([
      gsPost(entry),
      sendEmailNotification(entry),
    ]);
    setLoading(false);
    setDone(true);
  };

  if (done) return (
    <div style={{ background: gradBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <Card style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h2 style={{ color: C.violet, fontWeight: 900, fontSize: "1.7rem", marginBottom: 10 }}>Place réservée !</h2>
        <p style={{ color: C.textSoft, lineHeight: 1.7, marginBottom: 20 }}>
          Merci <strong style={{ color: C.rose }}>{form.nom}</strong> !<br />
          Nous te contacterons au <strong>{form.telephone}</strong> pour confirmer ta place.
        </p>
        <div style={{ background: "#F8F4FF", borderLeft: `4px solid ${C.violet}`, borderRadius: 12, padding: "1rem", textAlign: "left", marginBottom: 20, fontSize: "0.88rem", color: C.textSoft }}>
          💡 <strong>Rappel :</strong> le paiement de <strong>500 000 GNF</strong> se fait en présentiel le jour de l'inscription à Kountia OAS.
        </div>
        <a href="https://wa.me/224624144006" target="_blank" rel="noreferrer"
          style={{ display: "block", background: C.green, color: C.white, borderRadius: 12, padding: "0.85rem", fontWeight: 700, textDecoration: "none", fontSize: "0.95rem", marginBottom: 12 }}>
          💬 Une question ? WhatsApp : +224 624 144 006
        </a>
        <button onClick={() => { setDone(false); setForm({ nom:"",telephone:"",email:"",niveau:"",question:"" }); }}
          style={{ background: "none", border: `2px solid ${C.violet}`, color: C.violet, borderRadius: 10, padding: "0.6rem 1.5rem", cursor: "pointer", fontWeight: 700 }}>
          Nouvelle réservation
        </button>
      </Card>
    </div>
  );

  return (
    <div style={{ background: gradBg, minHeight: "100vh" }}>
      <div style={{ padding: "1.2rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
        <button onClick={onAdmin}
          style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: C.white, borderRadius: 20, padding: "0.4rem 1.1rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
          Admin
        </button>
      </div>
      <div style={{ textAlign: "center", padding: "0.5rem 1.5rem 1.5rem" }}>
        <Badge style={{ marginBottom: 14, letterSpacing: 2, fontSize: "0.75rem", fontWeight: 700 }}>
          COURS DE VACANCES · CONAKRY 2026
        </Badge>
        <h1 style={{ color: C.white, fontSize: "clamp(1.9rem, 5vw, 3rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: 10 }}>
          Maîtrise le{" "}
          <span style={{ background: C.yellow, color: C.violet, borderRadius: 8, padding: "0 10px" }}>CODE</span>{" "}
          ces vacances
        </h1>
        <p style={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", marginBottom: 14 }}>
          Algorithmique · Langage C · C++ (POO) — 1 mois intensif
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 10 }}>
          {["📅 3 Août – 3 Sept 2026", "📍 Kountia OAS · Conakry", "💰 500 000 GNF"].map(t => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>
        <p style={{ color: "rgba(255,230,180,0.9)", fontSize: "0.82rem" }}>
          ✅ Réservation gratuite — paiement en présentiel le jour de l'inscription
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", padding: "0 1rem 3rem" }}>
        <Card style={{ maxWidth: 520, width: "100%" }}>
          <h2 style={{ color: C.violet, fontWeight: 900, fontSize: "1.25rem", marginBottom: 22 }}>Formulaire de réservation</h2>

          <Field label="Nom complet *" error={errors.nom}>
            <input value={form.nom} onChange={e => set("nom", e.target.value)} placeholder="Ex : Mamadou Diallo" style={inputSx(!!errors.nom)} />
          </Field>
          <Field label="Numéro de téléphone *" error={errors.telephone}>
            <input value={form.telephone} onChange={e => set("telephone", e.target.value)} placeholder="Ex : +224 6XX XXX XXX" style={inputSx(!!errors.telephone)} />
          </Field>
          <Field label="Adresse email (optionnel)">
            <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="Ex : mamadou@email.com" style={inputSx()} />
          </Field>
          <Field label="Niveau d'études *" error={errors.niveau}>
            <select value={form.niveau} onChange={e => set("niveau", e.target.value)} style={{ ...inputSx(!!errors.niveau), cursor: "pointer" }}>
              <option value="">— Choisis ton niveau —</option>
              <option value="Terminale (Bac)">Terminale (Bac)</option>
              <option value="L1 Informatique">L1 Informatique</option>
              <option value="L2 Informatique">L2 Informatique</option>
              <option value="Autre">Autre</option>
            </select>
          </Field>
          <Field label="Question ou demande particulière (optionnel)">
            <textarea value={form.question} onChange={e => set("question", e.target.value)}
              placeholder="Tu as une question ? Quelque chose à éclaircir ?"
              rows={3} style={{ ...inputSx(), resize: "vertical" }} />
          </Field>

          <button onClick={submit} disabled={loading}
            style={{ width: "100%", background: loading ? "#ccc" : gradBtn, color: C.white, border: "none", borderRadius: 14, padding: "1rem", fontSize: "1.05rem", fontWeight: 900, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Envoi en cours…" : "Réserver ma place →"}
          </button>
          <p style={{ textAlign: "center", color: C.muted, fontSize: "0.78rem", marginTop: 12 }}>
            Aucun paiement maintenant · Places limitées
          </p>
        </Card>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  ADMIN LOGIN
// ─────────────────────────────────────────
function AdminLogin({ onLogin, onBack }) {
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState(false);
  const login = () => { if (pwd === ADMIN_PASSWORD) onLogin(); else { setErr(true); setPwd(""); } };
  return (
    <div style={{ background: gradBg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Card style={{ maxWidth: 360, width: "90%", textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 10 }}>🔐</div>
        <h2 style={{ color: C.violet, fontWeight: 900, marginBottom: 6 }}>Espace Admin</h2>
        <p style={{ color: C.muted, fontSize: "0.88rem", marginBottom: 20 }}>Réservé à JeCode</p>
        <input type="password" value={pwd} placeholder="Mot de passe"
          onChange={e => { setPwd(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && login()}
          style={{ ...inputSx(err), textAlign: "center", letterSpacing: 4, marginBottom: 8 }} />
        {err && <p style={{ color: C.rose, fontSize: "0.82rem", marginBottom: 8 }}>⚠ Mot de passe incorrect</p>}
        <button onClick={login}
          style={{ width: "100%", background: gradBtn, color: C.white, border: "none", borderRadius: 12, padding: "0.85rem", fontWeight: 800, cursor: "pointer", marginBottom: 10 }}>
          Accéder →
        </button>
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: "0.85rem" }}>
          ← Retour au site
        </button>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────
//  ADMIN DASHBOARD
// ─────────────────────────────────────────
function AdminDashboard({ onLogout }) {
  const [list, setList]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterN, setFilterN]   = useState("Tous");
  const [selected, setSelected] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const data = await gsGet();
    setList(data);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = list.filter(r => {
    const q = search.toLowerCase();
    const matchQ = r.nom.toLowerCase().includes(q) || r.telephone.includes(q) || (r.email||"").toLowerCase().includes(q);
    const matchN = filterN === "Tous" || r.niveau === filterN;
    return matchQ && matchN;
  });

  const setStatus = async (id, status) => {
    await gsPost({ action: "updateStatus", id, status });
    await load();
    setSelected(sel => sel?.id === id ? { ...sel, status } : sel);
  };

  const remove = async (id) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    await gsPost({ action: "delete", id });
    setSelected(null);
    await load();
  };

  const exportCSV = () => {
    const headers = ["Nom","Téléphone","Email","Niveau","Question","Date","Statut"];
    const rows = list.map(r => [r.nom,r.telephone,r.email||"",r.niveau,r.question||"",r.date,r.status]);
    const csv = [headers,...rows].map(r => r.map(v=>`"${v}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    a.download = "jecode_reservations.csv";
    a.click();
  };

  const stats = {
    total:    list.length,
    attente:  list.filter(r => r.status === "En attente").length,
    confirme: list.filter(r => r.status === "Confirmé").length,
    annule:   list.filter(r => r.status === "Annulé").length,
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg }}>
      <div style={{ background: gradBg, padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Logo />
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} disabled={refreshing}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: C.white, borderRadius: 20, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            {refreshing ? "…" : "🔄 Actualiser"}
          </button>
          <button onClick={exportCSV}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: C.white, borderRadius: 20, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            ⬇ CSV
          </button>
          <button onClick={onLogout}
            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", color: C.white, borderRadius: 20, padding: "0.4rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600 }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "1.5rem 1rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          {[
            { label:"Total",      value:stats.total,    color:C.violet,  bg:"#EDE9F7" },
            { label:"En attente", value:stats.attente,  color:"#D97706", bg:"#FEF3C7" },
            { label:"Confirmés",  value:stats.confirme, color:"#16A34A", bg:"#F0FDF4" },
            { label:"Annulés",    value:stats.annule,   color:"#DC2626", bg:"#FEF2F2" },
          ].map(s => (
            <div key={s.label} style={{ background:s.bg, border:`1.5px solid ${s.color}30`, borderRadius:16, padding:"1.1rem", textAlign:"center" }}>
              <div style={{ fontSize:"2rem", fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"0.75rem", color:s.color, fontWeight:700, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filtres */}
        <div style={{ background:C.white, borderRadius:14, padding:"0.9rem 1.1rem", marginBottom:14, display:"flex", gap:10, flexWrap:"wrap", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍  Rechercher par nom, téléphone ou email…"
            style={{ flex:1, minWidth:200, padding:"0.6rem 0.9rem", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:"0.9rem", outline:"none" }} />
          <select value={filterN} onChange={e => setFilterN(e.target.value)}
            style={{ padding:"0.6rem 0.9rem", borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:"0.9rem", cursor:"pointer" }}>
            {["Tous","Terminale (Bac)","L1 Informatique","L2 Informatique","Autre"].map(n=>(
              <option key={n}>{n}</option>
            ))}
          </select>
          <span style={{ color:C.muted, fontSize:"0.82rem" }}>{filtered.length} résultat(s)</span>
        </div>

        {/* Liste + Détail */}
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
            {loading && <div style={{ textAlign:"center", color:C.muted, padding:"3rem" }}>Chargement depuis Google Sheets…</div>}
            {!loading && filtered.length === 0 && (
              <div style={{ background:C.white, borderRadius:16, padding:"3rem", textAlign:"center", color:C.muted }}>
                <div style={{ fontSize:40, marginBottom:8 }}>📭</div>
                <p>Aucune réservation pour l'instant.</p>
              </div>
            )}
            {filtered.map(r => {
              const sm = statusMeta[r.status] || statusMeta["En attente"];
              const isSel = selected?.id === r.id;
              return (
                <div key={r.id} onClick={() => setSelected(isSel ? null : r)}
                  style={{ background:isSel?"#EDE9F7":C.white, border:`2px solid ${isSel?C.violet:"transparent"}`, borderRadius:14, padding:"0.9rem 1.1rem", cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
                  <div>
                    <div style={{ fontWeight:700, color:C.text, fontSize:"0.95rem" }}>{r.nom}</div>
                    <div style={{ color:C.textSoft, fontSize:"0.82rem", marginTop:2 }}>{r.telephone}{r.email?` · ${r.email}`:""}</div>
                    <div style={{ color:C.muted, fontSize:"0.76rem", marginTop:2 }}>{r.niveau} · {r.date}</div>
                  </div>
                  <span style={{ background:sm.bg, color:sm.color, borderRadius:20, padding:"0.25rem 0.8rem", fontSize:"0.75rem", fontWeight:700, whiteSpace:"nowrap" }}>
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>

          {selected && (
            <div style={{ width:290, background:C.white, borderRadius:18, padding:"1.4rem", boxShadow:"0 4px 20px rgba(70,0,140,0.1)", position:"sticky", top:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:16 }}>
                <span style={{ fontWeight:800, color:C.violet, fontSize:"0.95rem" }}>Détails</span>
                <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.muted, fontSize:"1.1rem" }}>✕</button>
              </div>
              {[["Nom",selected.nom],["Téléphone",selected.telephone],selected.email?["Email",selected.email]:null,["Niveau",selected.niveau],["Réservé le",selected.date]].filter(Boolean).map(([lbl,val])=>(
                <div key={lbl} style={{ marginBottom:10 }}>
                  <div style={{ fontSize:"0.7rem", color:C.muted, fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>{lbl}</div>
                  <div style={{ fontSize:"0.9rem", color:C.text, fontWeight:600 }}>{val}</div>
                </div>
              ))}
              {selected.question && (
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:"0.7rem", color:C.muted, fontWeight:700, textTransform:"uppercase", marginBottom:5 }}>Question</div>
                  <div style={{ background:"#F8F4FF", borderRadius:10, padding:"0.7rem", fontSize:"0.84rem", color:C.textSoft, lineHeight:1.5 }}>{selected.question}</div>
                </div>
              )}
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:"0.7rem", color:C.muted, fontWeight:700, textTransform:"uppercase", marginBottom:8 }}>Statut</div>
                <div style={{ display:"flex", gap:5 }}>
                  {["En attente","Confirmé","Annulé"].map(s => {
                    const sm2 = statusMeta[s];
                    const active = selected.status === s;
                    return (
                      <button key={s} onClick={() => setStatus(selected.id, s)}
                        style={{ flex:1, padding:"0.4rem 0.2rem", borderRadius:8, border:"none", cursor:"pointer", background:active?sm2.color:sm2.bg, color:active?C.white:sm2.color, fontSize:"0.7rem", fontWeight:700 }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
              <a href={`https://wa.me/${selected.telephone.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
                style={{ display:"block", textAlign:"center", background:C.green, color:C.white, borderRadius:10, padding:"0.7rem", fontSize:"0.88rem", fontWeight:700, textDecoration:"none", marginBottom:8 }}>
                💬 Contacter sur WhatsApp
              </a>
              <button onClick={() => remove(selected.id)}
                style={{ width:"100%", background:"none", border:"1.5px solid #EF4444", color:"#EF4444", borderRadius:10, padding:"0.6rem", fontSize:"0.82rem", cursor:"pointer", fontWeight:600 }}>
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
//  APP ROOT
// ─────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState(() => {
    return sessionStorage.getItem("jecode_admin") === "1" ? "admin" : "public";
  });

  const goAdmin = () => { sessionStorage.setItem("jecode_admin", "1"); setPage("admin"); };
  const goOut   = () => { sessionStorage.removeItem("jecode_admin"); setPage("public"); };

  return (
    page === "public" ? <PublicPage onAdmin={() => setPage("login")} /> :
    page === "login"  ? <AdminLogin onLogin={goAdmin} onBack={() => setPage("public")} /> :
    page === "admin"  ? <AdminDashboard onLogout={goOut} /> : null
  );
}

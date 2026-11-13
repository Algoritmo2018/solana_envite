import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock, MapPin, Users, Sparkles, CheckCircle2, Heart, Phone, User, MessageSquareText, Star, Building2, LogIn, LogOut, Trash2, ShieldCheck, X } from "lucide-react";
import logoUrl from "./assets/ec946d8ccc9b35b9-WhatsApp_Image_2026-11-13_at_10_36_39.jpeg";

type RsvpValue = {
  nome: string;
  telefone: string;
  tipo: string;
  comparecer: string;
  acompanhantes: string;
  mensagem: string;
  createdAt: string;
};

type RecordItem = { id: string; value: RsvpValue };

const COLLECTION = "rsvp_solana_6anos";

async function callApi(action: string, args: Record<string, unknown>) {
  // Versão GitHub Pages / Local: guarda no navegador (localStorage)
  // No Meta AI usava fetch("actions"), aqui não há backend, por isso usamos localStorage.
  const KEY = "rsvp_solana_6anos";
  const read = (): RecordItem[] => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  };
  const write = (list: RecordItem[]) => localStorage.setItem(KEY, JSON.stringify(list));
  if (action === "records.list") return { records: read() };
  if (action === "records.create") {
    const list = read();
    const id = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    list.push({ id, value: args.value as RsvpValue });
    write(list);
    return { id };
  }
  if (action === "records.delete") {
    write(read().filter((r) => r.id !== args.id));
    return {};
  }
  throw new Error("Ação não suportada");
}

function companionsNumber(value: string) {
  if (value === "3+") return 3;
  return Number(value) || 0;
}

const CONFETTI = [
  { left: "3%", top: "9%", size: 7, delay: "0s", color: "#f6d873" },
  { left: "10%", top: "22%", size: 5, delay: ".4s", color: "#ffffff" },
  { left: "18%", top: "7%", size: 9, delay: ".8s", color: "#ffd700" },
  { left: "27%", top: "28%", size: 5, delay: "1.1s", color: "#f6d873" },
  { left: "78%", top: "8%", size: 8, delay: ".2s", color: "#ffffff" },
  { left: "88%", top: "18%", size: 6, delay: ".7s", color: "#f6d873" },
  { left: "95%", top: "6%", size: 10, delay: "1.3s", color: "#ffd700" },
  { left: "67%", top: "20%", size: 5, delay: ".5s", color: "#fff3a6" },
  { left: "5%", top: "42%", size: 5, delay: "1s", color: "#f6d873" },
  { left: "94%", top: "42%", size: 7, delay: ".3s", color: "#ffffff" },
  { left: "13%", top: "58%", size: 6, delay: ".9s", color: "#ffd700" },
  { left: "87%", top: "58%", size: 5, delay: "1.4s", color: "#f6d873" },
  { left: "45%", top: "4%", size: 6, delay: ".6s", color: "#ffffff" },
  { left: "56%", top: "34%", size: 5, delay: "1.2s", color: "#f6d873" },
];

export default function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [tipo, setTipo] = useState("");
  const [comparecer, setComparecer] = useState("Sim");
  const [acompanhantes, setAcompanhantes] = useState("0");
  const [mensagem, setMensagem] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [savedChoice, setSavedChoice] = useState<string | null>(null);
  const [saveInfo, setSaveInfo] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function reloadRecords() {
    const data = await callApi("records.list", { collection: COLLECTION });
    const list = Array.isArray(data?.records) ? data.records : [];
    setRecords(list as RecordItem[]);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await reloadRecords();
        if (active) setLoadError(null);
      } catch {
        if (active) setLoadError("O contador ainda não pôde ser carregado. A tua confirmação pode ser enviada na mesma.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const stats = useMemo(() => {
    const sim = records.filter((r) => r.value.comparecer === "Sim");
    const talvez = records.filter((r) => r.value.comparecer === "Talvez");
    const people = sim.reduce((sum, r) => sum + 1 + companionsNumber(r.value.acompanhantes), 0);
    return { confirmations: sim.length, people, maybe: talvez.length };
  }, [records]);

  const confirmedList = useMemo(() => {
    return [...records].sort((a, b) => String(b.value.createdAt || "").localeCompare(String(a.value.createdAt || "")));
  }, [records]);

  function companionsLabel(value: string) {
    if (value === "0") return "Sem acompanhantes";
    if (value === "1") return "1 acompanhante";
    if (value === "2") return "2 acompanhantes";
    return "3 ou mais acompanhantes";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaveInfo(null);
    if (!nome.trim() || !telefone.trim() || !tipo) {
      setFormError("Preenche o nome completo, o telefone / WhatsApp e o tipo de convidado.");
      return;
    }
    if (telefone.replace(/\D/g, "").length < 9) {
      setFormError("Verifica o número de telefone / WhatsApp. Precisa de pelo menos 9 dígitos.");
      return;
    }
    const value: RsvpValue = {
      nome: nome.trim(),
      telefone: telefone.trim(),
      tipo,
      comparecer,
      acompanhantes,
      mensagem: mensagem.trim(),
      createdAt: new Date().toISOString(),
    };
    const idempotencyKey = `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setBusy(true);
    let saved = 0;
    let error: string | null = null;
    try {
      await callApi("records.create", { collection: COLLECTION, value, idempotency_key: idempotencyKey });
      saved = 1;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
    let reloadError: string | null = null;
    try {
      await reloadRecords();
    } catch (e) {
      reloadError = e instanceof Error ? e.message : String(e);
    }
    setBusy(false);
    if (error) {
      setFormError(`A confirmação não foi guardada. ${error}`);
      setSaveInfo(`Guardadas: ${saved} • Por guardar: 1${reloadError ? ` • Erro ao atualizar o contador: ${reloadError}` : ""}`);
      return;
    }
    setSavedName(value.nome);
    setSavedChoice(value.comparecer);
    setSaveInfo(`Guardadas: ${saved} • Por guardar: 0${reloadError ? ` • Erro ao atualizar o contador: ${reloadError}` : ""}`);
    setNome(""); setTelefone(""); setTipo(""); setComparecer("Sim"); setAcompanhantes("0"); setMensagem("");
  }

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setLoginError(null);
    if (loginEmail.trim().toLowerCase() === "alexandranneto@gmail.com" && loginPassword === "ale123@#$") {
      setIsAdmin(true);
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
      setDeleteConfirmId(null);
      setDeleteError(null);
    } else {
      setLoginError("Email ou senha incorretos");
    }
  }

  function handleLogout() {
    setIsAdmin(false);
    setShowLogin(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError(null);
    setDeleteConfirmId(null);
    setDeleteError(null);
  }

  async function handleDelete(id: string, nomeConfirmado: string) {
    setDeleteError(null);
    setDeletingId(id);
    try {
      await callApi("records.delete", { collection: COLLECTION, id });
      await reloadRecords();
      setDeleteConfirmId(null);
    } catch (e) {
      setDeleteError(`Não foi possível eliminar a confirmação de ${nomeConfirmado}. ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)", minHeight: "100vh", background: "linear-gradient(180deg,#f7faff 0%,#d9e7ff 9%,#0b2a6b 28%,#071c4d 58%,#030a24 100%)", overflowX: "clip" }}>
      <main className="mx-auto w-full max-w-[980px] px-3 pb-0 sm:px-5">
        {/* ADMIN — DISCREET TOP BAR */}
        <div id="admin" className="mb-3 flex items-center justify-end">
          {isAdmin ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <p className="flex items-center gap-1.5 text-xs font-bold text-[#ffe27a] sm:text-sm"><ShieldCheck size={16} className="text-[#f6d873]" /> Olá, Alexandra - Sessão iniciada</p>
              <button type="button" onClick={handleLogout} className="flex items-center gap-1.5 rounded-full border border-[#d4af37]/60 bg-[#071c4d] px-3 py-1.5 text-xs font-bold text-[#f6d873] transition hover:bg-[#0a235f]"><LogOut size={14} /> Terminar Sessão</button>
            </div>
          ) : (
            <button type="button" onClick={() => { setShowLogin((v) => !v); setLoginError(null); }} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-[#071c4d]/60 px-3 py-1.5 text-xs font-semibold text-[#cbd8f5] transition hover:border-[#d4af37]/60 hover:text-white" aria-expanded={showLogin}>Área Admin</button>
          )}
        </div>
        {showLogin && !isAdmin ? (
          <section aria-labelledby="titulo-login" className="mb-4 overflow-hidden rounded-2xl border border-[#d4af37]/70 bg-[#071c4d] p-5 text-[#fffaf0] shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f6d873]">Área Admin</p>
                <h2 id="titulo-login" className="font-display mt-1 text-2xl font-semibold leading-tight sm:text-3xl">Iniciar Sessão</h2>
              </div>
              <button type="button" onClick={() => { setShowLogin(false); setLoginError(null); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/50 text-[#f6d873]" aria-label="Fechar iniciar sessão"><X size={17} /></button>
            </div>
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-2 block text-sm font-bold">Email</label>
                <input id="login-email" className="field" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="O teu email" autoComplete="email" required />
              </div>
              <div>
                <label htmlFor="login-senha" className="mb-2 block text-sm font-bold">Senha</label>
                <input id="login-senha" className="field" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="A tua senha" autoComplete="current-password" required />
              </div>
              {loginError && <p role="alert" className="rounded-xl bg-[#2a0f0f] px-3 py-3 text-sm font-semibold text-[#ffb3b3]">{loginError}</p>}
              <button type="submit" className="w-full rounded-full bg-gradient-to-b from-[#fff3a6] via-[#f6d873] to-[#d4af37] px-5 py-3.5 text-base font-black text-[#120c00] shadow-[0_6px_24px_rgba(212,175,55,.45)] transition hover:brightness-110">Iniciar Sessão</button>
            </form>
          </section>
        ) : null}
        {/* INVITE — OFFICIAL BLUE / GOLD LOOK */}
        <section className="relative overflow-hidden border border-[#d4af37]/70 shadow-[0_0_70px_rgba(212,175,55,.28)]" style={{ background: "linear-gradient(180deg,#ffffff 0%,#f2f7ff 12%,#cfe0ff 20%,#0b2a6b 38%,#071c4d 66%,#030a24 100%)" }}>
          {/* gold ribbons */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="drift absolute -left-8 top-[22%] h-[10px] w-44 rotate-[-18deg] rounded-full bg-gradient-to-r from-transparent via-[#f6d873] to-[#d4af37] opacity-80" />
            <span className="drift absolute -right-10 top-[34%] h-[10px] w-48 rotate-[16deg] rounded-full bg-gradient-to-l from-transparent via-[#f6d873] to-[#d4af37] opacity-80" style={{ animationDelay: ".8s" }} />
            <span className="drift absolute left-[8%] top-[64%] h-[7px] w-32 rotate-[10deg] rounded-full bg-[#f6d873]/70" style={{ animationDelay: "1.2s" }} />
            <span className="drift absolute right-[6%] top-[70%] h-[7px] w-36 rotate-[-10deg] rounded-full bg-[#f6d873]/70" style={{ animationDelay: ".4s" }} />
          </div>
          {/* confetti */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {CONFETTI.map((c, i) => (
              <span key={i} className="twinkle absolute rounded-full" style={{ left: c.left, top: c.top, width: c.size, height: c.size, animationDelay: c.delay, background: c.color, boxShadow: `0 0 10px ${c.color}` }} />
            ))}
            <span className="spark absolute left-[8%] top-[38%] text-[#f6d873]"><Star size={14} fill="currentColor" /></span>
            <span className="spark absolute right-[8%] top-[38%] text-[#f6d873]" style={{ animationDelay: ".6s" }}><Star size={18} fill="currentColor" /></span>
            <span className="spark absolute left-[16%] top-[30%] text-[#ffd700]"><Sparkles size={16} /></span>
            <span className="spark absolute right-[16%] top-[30%] text-[#ffd700]" style={{ animationDelay: "1s" }}><Sparkles size={14} /></span>
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[5px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="pointer-events-none absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-[#f6d873] to-transparent" />

          {/* TOPO — LOGOTIPO */}
          <div className="relative px-4 pt-6 text-center sm:px-8 sm:pt-8">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-white p-1.5 shadow-[0_8px_24px_rgba(11,47,158,.35)] ring-2 ring-[#d4af37]/60 sm:h-[86px] sm:w-[86px] sm:p-2">
                <img src={logoUrl} alt="Logotipo oficial SOLANA MCIP" className="h-full w-full object-contain" />
              </span>
              <div className="text-center sm:text-left">
                <p className="text-[clamp(2.6rem,11vw,4.4rem)] font-black leading-[0.85] tracking-[0.08em] text-[#0b2f9e]">SOLANA</p>
                <p className="mt-1 text-[clamp(1.15rem,5vw,1.7rem)] font-black leading-none tracking-[0.62em] text-[#0b2f9e] pl-1">MCIP</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="h-[2px] w-10 bg-[#d4af37] sm:w-20" />
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#071c4d] sm:text-[13px] sm:tracking-[0.28em]">Juntos, vamos mais longe!</p>
              <span className="h-[2px] w-10 bg-[#d4af37] sm:w-20" />
            </div>
          </div>

          {/* HERO — 6 ANOS + CONVITE ESPECIAL */}
          <div className="relative mx-auto mt-6 grid max-w-[820px] grid-cols-1 items-center gap-2 px-4 sm:px-8 md:grid-cols-[1.35fr_1fr] md:gap-6">
            <div className="text-center md:text-left">
              <p className="font-display metallic-gold text-[clamp(4.4rem,20vw,8.6rem)] font-bold leading-[0.82] tracking-tight">6 ANOS</p>
              <p className="mt-3 text-[15px] font-extrabold uppercase leading-6 tracking-[0.14em] text-white sm:text-[19px] sm:leading-7">De História, Conquistas<br />e Visão de Futuro</p>
              <div className="mt-3 flex items-center justify-center gap-2 text-[#f6d873] md:justify-start">
                <Sparkles size={15} /><span className="text-[11px] tracking-[0.3em]">✦</span><Sparkles size={15} />
              </div>
            </div>
            <div className="pb-1 text-center md:pb-6 md:text-right">
              <p className="font-script text-[clamp(2.6rem,10vw,4.2rem)] leading-[1.05] text-[#f6d873] drop-shadow-[0_4px_12px_rgba(0,0,0,.5)]">Convite<br />Especial</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.28em] text-[#ffe9a8]">Celebração • 2026</p>
            </div>
          </div>

          {/* wavy gold divider */}
          <svg aria-hidden="true" viewBox="0 0 640 22" className="mx-auto mt-2 w-full max-w-[560px] px-4 text-[#d4af37]" preserveAspectRatio="none">
            <path d="M0 11 Q40 1 80 11 T160 11 T240 11 T320 11 T400 11 T480 11 T560 11 T640 11" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M0 16 Q40 7 80 16 T160 16 T240 16 T320 16 T400 16 T480 16 T560 16 T640 16" fill="none" stroke="#f6d873" strokeWidth="0.8" opacity="0.6" />
          </svg>

          {/* MESSAGE */}
          <div className="relative mx-auto mt-5 max-w-[700px] space-y-4 px-4 text-left text-[15px] leading-7 text-[#eaf0ff] sm:px-6 sm:text-center sm:text-base sm:leading-8">
            <p className="text-center text-[15px] font-bold leading-7 text-[#ffe27a] sm:text-[17px] sm:leading-8">
              Começar exige coragem.<br />Permanecer exige determinação.<br />Crescer exige visão.
            </p>
            <p>Ao longo destes seis anos, aprendemos, enfrentámos desafios, ultrapassámos obstáculos e transformámos oportunidades em conquistas.</p>
            <p>Cada passo deixou uma marca. Cada desafio fortaleceu a nossa identidade. Cada conquista confirmou que vale a pena continuar.</p>
            <p><span className="font-bold text-[#ffe27a]">Hoje, celebramos seis anos de uma história construída com trabalho, resiliência e propósito.</span></p>
            <p><span className="font-bold text-[#ffe27a]">É com enorme prazer que temos a honra de o(a) convidar</span> a juntar-se a nós para <span className="font-bold text-[#ffe27a]">celebrar esta data tão marcante e especial</span>, fazendo parte de um momento que representa não apenas o caminho percorrido, mas também tudo aquilo que ainda está por construir.</p>
          </div>

          {/* DETAILS — 3 COLUMNS */}
          <div className="relative mx-auto mt-7 grid max-w-[760px] grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-[#d4af37]/70 bg-[#071c4d]/80 shadow-[0_10px_30px_rgba(0,0,0,.35)] sm:grid-cols-3">
            <div className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
              <CalendarDays className="text-[#f6d873]" size={28} />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#f6d873]">Data</p>
              <p className="text-[15px] font-extrabold leading-5 text-white">4 DE DEZEMBRO<br />DE 2026</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 border-y border-[#d4af37]/40 px-4 py-5 text-center sm:border-x sm:border-y-0">
              <Clock className="text-[#f6d873]" size={28} />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#f6d873]">Horário</p>
              <p className="text-[15px] font-extrabold leading-5 text-white">DAS 08H<br />ÀS 20H</p>
            </div>
            <div className="flex flex-col items-center gap-1.5 px-4 py-5 text-center">
              <MapPin className="text-[#f6d873]" size={28} />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#f6d873]">Local</p>
              <p className="text-[15px] font-extrabold leading-5 text-white">ZANGO 2</p>
              <p className="mt-1 text-[15px] font-extrabold leading-5 text-[#f6d873]">RESORT VILA ROSA</p>
              <p className="mt-1.5 text-xs font-semibold leading-4 text-[#cbd8f5]">Referência: Zango 2, paragem da antena, atrás das bombas de gasolina da Sonangol.</p>
            </div>
          </div>

          <div className="relative mx-auto mt-5 max-w-[760px] rounded-2xl border border-[#d4af37]/60 bg-[#071c4d]/80 px-4 py-5 text-center shadow-[0_10px_30px_rgba(0,0,0,.35)] sm:px-6">
            <p className="text-lg font-black uppercase leading-6 tracking-[0.32em] text-[#f6d873] sm:text-xl">Dress Code</p>
            <div className="mx-auto mt-4 flex items-start justify-center gap-4 sm:gap-8">
              <figure className="flex w-20 flex-col items-center gap-2 sm:w-24">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25 sm:h-[76px] sm:w-[76px]">
                  <svg aria-hidden="true" viewBox="0 0 64 64" className="h-11 w-11 sm:h-12 sm:w-12" fill="#ffffff">
                    <path d="M24 10 11 18l5.5 11L23 25v31a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V25l6.5 4L53 18 40 10l-4 7a5 5 0 0 1-8 0l-4-7Z" />
                    <path d="M28 17a5 5 0 0 0 8 0" fill="none" stroke="#071c4d" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="32" cy="29" r="1.4" fill="#071c4d" />
                    <circle cx="32" cy="38" r="1.4" fill="#071c4d" />
                    <circle cx="32" cy="47" r="1.4" fill="#071c4d" />
                  </svg>
                </span>
                <figcaption className="text-xs font-bold leading-4 text-white">Camisa branca</figcaption>
              </figure>
            </div>
            <p className="mt-4 inline-block rounded-full border border-[#d4af37]/60 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.28em] text-[#f6d873]">Tudo Branco</p>
          </div>

          <div className="relative mx-auto mt-5 flex max-w-[760px] items-start gap-3 rounded-xl border border-[#d4af37]/40 bg-[#030a24]/60 px-4 py-3 text-left">
            <Users className="mt-0.5 shrink-0 text-[#f6d873]" size={22} />
            <p className="text-sm font-semibold leading-5 text-[#eaf0ff]">Para os nossos clientes, colaboradores e funcionários.</p>
          </div>

          <p className="font-script relative mt-6 px-4 text-center text-[clamp(2.2rem,9vw,3.4rem)] leading-tight text-[#ffe27a] drop-shadow-[0_4px_14px_rgba(0,0,0,.5)]">Contamos com a sua presença!</p>

          {/* COUNTER + CTA */}
          <div className="relative mx-auto mb-7 mt-5 max-w-[760px] rounded-2xl border border-[#d4af37]/40 bg-black/30 px-4 py-4 text-center">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f6d873]">Quem já confirmou</p>
            {loading ? <p className="mt-2 text-sm text-[#cbd8f5]">A carregar confirmações…</p> : (
              <div className="mt-2 flex flex-wrap items-end justify-center gap-x-6 gap-y-1">
                <p className="text-4xl font-extrabold leading-none text-white">{stats.confirmations} <span className="text-base font-semibold text-[#d9e2ff]">confirmações</span></p>
                <p className="text-sm font-bold text-[#f6d873]">{stats.people} pessoas esperadas • {stats.maybe} talvez</p>
              </div>
            )}
            {loadError && <p className="mt-2 text-xs text-[#f6d873]">{loadError}</p>}
            <a href="#confirmar" className="mt-4 inline-block rounded-full bg-gradient-to-b from-[#fff3a6] via-[#f6d873] to-[#d4af37] px-7 py-3 text-sm font-black text-[#120c00] shadow-[0_6px_24px_rgba(212,175,55,.5)] transition hover:brightness-110">Confirmar a minha presença</a>
          </div>
        </section>

        {/* FORM */}
        <section id="confirmar" className="relative mt-4 overflow-hidden border border-[#d4af37]/70 bg-[#071c4d] p-5 text-[#fffaf0] shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[4px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f6d873]">Confirmação de presença</p>
              <h2 className="font-display mt-1 text-3xl font-semibold leading-tight sm:text-4xl">A tua presença faz<br className="hidden sm:block" /> parte da história.</h2>
            </div>
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#f6d873] to-[#d4af37] text-[#120c00] sm:flex"><Heart size={22} /></span>
          </div>
          <p className="mt-2 text-sm leading-5 text-[#cbd8f5]">Preenche o formulário. A tua resposta fica guardada e conta para o total de confirmações.</p>

          {savedName ? (
            <div className="mt-6 rounded-2xl border border-[#d4af37] bg-[#0a235f] p-5" role="status">
              <div className="flex gap-3"><CheckCircle2 className="shrink-0 text-[#f6d873]" size={26} /><div>
                <h3 className="text-lg font-extrabold">Obrigado, {savedName}!</h3>
                {savedChoice === "Sim" ? <p className="mt-1 leading-6 text-[#eaf0ff]">Obrigado {savedName}! A tua presença foi confirmada. Vemo-nos dia 4 de Dezembro de 2026 no Zango 2!</p>
                : savedChoice === "Talvez" ? <p className="mt-1 leading-6 text-[#eaf0ff]">Obrigado {savedName}! Registámos que talvez possas comparecer. Esperamos ver-te dia 4 de Dezembro de 2026 no Zango 2!</p>
                : <p className="mt-1 leading-6 text-[#eaf0ff]">Obrigado {savedName}! A tua resposta foi registada. Sentiremos a tua falta na celebração de 4 de Dezembro de 2026.</p>}
                <button onClick={() => { setSavedName(null); setSavedChoice(null); }} className="mt-3 text-sm font-bold text-[#f6d873] underline">Adicionar outra confirmação</button>
              </div></div>
            </div>
          ) : null}
          {saveInfo && <p className="mt-4 rounded-xl bg-[#0a235f] px-3 py-2 text-xs font-semibold text-[#e8dcb8]">{saveInfo}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="nome" className="mb-2 flex items-center gap-2 text-sm font-bold"><User size={16} className="text-[#f6d873]" /> Nome completo <span className="text-[#f6d873]">*</span></label>
              <input id="nome" className="field" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria dos Santos" autoComplete="name" required />
            </div>
            <div>
              <label htmlFor="telefone" className="mb-2 flex items-center gap-2 text-sm font-bold"><Phone size={16} className="text-[#f6d873]" /> Telefone / WhatsApp <span className="text-[#f6d873]">*</span></label>
              <input id="telefone" className="field" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Ex.: 923 000 000" inputMode="tel" autoComplete="tel" required />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-bold">Tipo de convidado <span className="text-[#f6d873]">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {["Cliente", "Colaborador", "Funcionário"].map((item) => <button key={item} type="button" className="choice" aria-pressed={tipo === item} onClick={() => setTipo(item)}>{item}</button>)}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-2 text-sm font-bold">Vai comparecer?</legend>
              <div className="flex flex-wrap gap-2">
                {["Sim", "Não", "Talvez"].map((item) => <button key={item} type="button" className="choice" aria-pressed={comparecer === item} onClick={() => setComparecer(item)}>{item}</button>)}
              </div>
            </fieldset>

            <div>
              <label htmlFor="acompanhantes" className="mb-2 block text-sm font-bold">Quantos acompanhantes?</label>
              <select id="acompanhantes" className="field" value={acompanhantes} onChange={(e) => setAcompanhantes(e.target.value)}>
                <option value="0">0 acompanhantes</option><option value="1">1 acompanhante</option><option value="2">2 acompanhantes</option><option value="3+">3 ou mais acompanhantes</option>
              </select>
            </div>

            <div>
              <label htmlFor="mensagem" className="mb-2 flex items-center gap-2 text-sm font-bold"><MessageSquareText size={16} className="text-[#f6d873]" /> Mensagem para a SOLANA MCIP <span className="font-medium text-[#cbd8f5]">(opcional)</span></label>
              <textarea id="mensagem" className="field min-h-[96px] resize-y" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Parabéns, SOLANA MCIP! Que venham muitos mais anos…" />
            </div>

            {formError && <p role="alert" className="rounded-xl bg-[#2a0f0f] px-3 py-3 text-sm font-semibold text-[#ffb3b3]">{formError}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-gradient-to-b from-[#fff3a6] via-[#f6d873] to-[#d4af37] px-5 py-4 text-base font-black text-[#120c00] shadow-[0_6px_24px_rgba(212,175,55,.45)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? "A guardar a tua confirmação…" : "Confirmar presença"}</button>
            <p className="text-center text-xs leading-4 text-[#cbd8f5]">Ao confirmar, a tua resposta é guardada para a organização do evento. O número de telefone não é apresentado publicamente.</p>
          </form>
        </section>

        {/* CONFIRMED LIST */}
        <section aria-labelledby="quem-confirmou" className="relative mt-4 overflow-hidden border border-[#d4af37]/70 bg-[#071c4d] p-5 text-[#fffaf0] shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[4px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[4px] bg-gradient-to-b from-[#fff3a6] via-[#d4af37] to-[#8a6d00]" />
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[#f6d873]">Lista atualizada</p>
              <h2 id="quem-confirmou" className="font-display mt-1 text-3xl font-semibold leading-tight sm:text-4xl">Quem já confirmou</h2>
            </div>
            <span className="rounded-full bg-gradient-to-b from-[#f6d873] to-[#d4af37] px-3 py-2 text-xs font-black text-[#120c00]">{loading ? "A carregar…" : `${confirmedList.length} respostas guardadas`}</span>
          </div>
          <p className="mt-2 text-sm leading-5 text-[#cbd8f5]">Esta lista é carregada a partir dos dados guardados e atualiza logo após cada nova confirmação. O número de telefone não é apresentado.</p>

          {loading ? (
            <p className="mt-6 text-sm font-semibold text-[#cbd8f5]">A carregar as confirmações guardadas…</p>
          ) : confirmedList.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#d4af37]/50 bg-[#0a235f] px-4 py-6 text-center">
              <p className="font-bold">Ainda não há confirmações nesta lista.</p>
              <p className="mt-1 text-sm text-[#cbd8f5]">Sê a primeira pessoa a confirmar a tua presença acima.</p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {confirmedList.map((record) => (
                <li key={record.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl border border-[#d4af37]/40 bg-[#0a235f] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-extrabold text-white">{record.value.nome}</p>
                    <p className="mt-0.5 text-sm text-[#cbd8f5]">{record.value.tipo} • {companionsLabel(record.value.acompanhantes)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-extrabold ${record.value.comparecer === "Sim" ? "bg-[#f6d873] text-[#120c00]" : record.value.comparecer === "Talvez" ? "bg-[#3a2d00] text-[#f6d873] border border-[#d4af37]" : "bg-[#2a0f0f] text-[#ffb3b3]"}`}>
                      {record.value.comparecer === "Sim" ? "Vai comparecer" : record.value.comparecer === "Talvez" ? "Talvez compareça" : "Não vai comparecer"}
                    </span>
                    {isAdmin ? (
                      deleteConfirmId === record.id ? (
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-[#ffe27a]">Eliminar?</span>
                          <button type="button" disabled={deletingId === record.id} onClick={() => handleDelete(record.id, record.value.nome)} className="rounded-full bg-[#f6d873] px-3 py-1.5 text-xs font-black text-[#120c00] disabled:opacity-60">{deletingId === record.id ? "A eliminar…" : "Confirmar"}</button>
                          <button type="button" disabled={deletingId === record.id} onClick={() => setDeleteConfirmId(null)} className="rounded-full border border-[#d4af37]/60 px-3 py-1.5 text-xs font-bold text-[#f6d873]">Cancelar</button>
                        </span>
                      ) : (
                        <button type="button" onClick={() => { setDeleteConfirmId(record.id); setDeleteError(null); }} className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#ffb3b3]/60 px-3 py-1.5 text-xs font-extrabold text-[#ffb3b3] transition hover:bg-[#2a0f0f]"><Trash2 size={14} /> Eliminar</button>
                      )
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {deleteError && <p role="alert" className="mt-4 rounded-xl bg-[#2a0f0f] px-3 py-2 text-xs font-semibold text-[#ffb3b3]">{deleteError}</p>}
          {loadError && <p className="mt-4 text-xs font-semibold text-[#ffb3b3]">{loadError}</p>}
        </section>

        {/* GOLD FOOTER BAND */}
        <footer className="mt-4 mb-4 overflow-hidden border border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,.3)]">
          <svg aria-hidden="true" viewBox="0 0 980 22" className="block w-full bg-[#071c4d] text-[#d4af37]" preserveAspectRatio="none" style={{ height: 22 }}>
            <path d="M0 14 Q61 2 122 14 T245 14 T367 14 T490 14 T612 14 T735 14 T857 14 T980 14 V22 H0 Z" fill="currentColor" />
          </svg>
          <div className="bg-gradient-to-r from-[#8a6d00] via-[#f6d873] to-[#8a6d00] px-4 py-5 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1 shadow-md ring-2 ring-white/60 sm:h-14 sm:w-14"><img src={logoUrl} alt="Logotipo oficial SOLANA MCIP" className="h-full w-full object-contain" /></span>
                <span className="text-left leading-tight">
                  <span className="block text-[11px] font-black uppercase tracking-[0.2em] text-[#2a1f00]">Resort Vila Rosa</span>
                  <span className="block text-xs font-bold text-[#3a2d00]">Zango 2 • Luanda</span>
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-bold leading-tight text-[#120c00] sm:text-[22px]">SOLANA MCIP — JUNTOS, VAMOS MAIS LONGE!</p>
                <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#2a1f00]">6 Anos • 4 de Dezembro de 2026 • Zango 2, Luanda</p>
              </div>
              <p className="font-script shrink-0 text-[26px] leading-tight text-[#120c00] sm:text-[28px]">6 anos. Uma história<br className="hidden sm:block" /> que nos inspira.</p>
            </div>
          </div>
          <div className="bg-[#071c4d] px-4 py-2 text-center"><a href="#admin" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#cbd8f5] hover:text-[#f6d873]"><LogIn size={12} /> Iniciar Sessão · Área Admin</a></div>
        </footer>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { t, Lang } from "@/lib/i18n";
import { maskEmployeeId, formatDuration, formatDateTime } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import {
  FiKey, FiCornerDownLeft, FiSearch, FiLock, FiClock, FiBarChart2,
  FiHome, FiUser, FiCheckCircle, FiXCircle, FiDownload, FiRefreshCw,
  FiFilter, FiChevronLeft, FiChevronRight, FiFileText, FiLogOut,
} from "react-icons/fi";

type View =
  | "dashboard"
  | "checkout"
  | "return"
  | "active"
  | "search"
  | "history"
  | "daily"
  | "weekly";

interface Transaction {
  id: number;
  truckNumber: string;
  employeeNumber: string;
  routeNumber: string;
  checkOutTime: string;
  returnTime: string | null;
  status: string;
}

interface Stats {
  activeKeys: number;
  freeTrucks: number;
  totalTrucks: number;
  totalTransactions: number;
}

// ─── LIVE CLOCK ─────────────────────────────────────────────────────
function LiveClock({ lang }: { lang: Lang }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dateLocale = lang === "fr" ? "fr-CA" : "en-CA";
  return (
    <div className="text-right">
      <div className="text-3xl font-bold font-mono tracking-wider">
        {now.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
      </div>
      <div className="text-sm opacity-80">
        {now.toLocaleDateString(dateLocale, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
      </div>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [lang, setLang] = useState<Lang>("en");
  const [searchQuery, setSearchQuery] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState(false);

  function handleLogin() {
    if (loginUser === "admin" && loginPass === "admin") {
      setLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#eceff1] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-10 w-full max-w-md mx-4">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4">
              <img src="/truck-logo.png" alt="Truck" className="h-20 w-auto" />
            </div>
            <h1 className="text-lg md:text-2xl font-bold text-[var(--navy)] tracking-wide text-center">{t(lang, "title")}</h1>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[var(--navy)] mb-1">{lang === "fr" ? "Utilisateur" : "Username"}</label>
              <input
                type="text"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
                value={loginUser}
                onChange={(e) => { setLoginUser(e.target.value); setLoginError(false); }}
                placeholder={lang === "fr" ? "Utilisateur" : "Username"}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--navy)] mb-1">{lang === "fr" ? "Mot de passe" : "Password"}</label>
              <input
                type="password"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
                value={loginPass}
                onChange={(e) => { setLoginPass(e.target.value); setLoginError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="********"
              />
            </div>
            {loginError && (
              <div className="text-[var(--red)] text-sm font-semibold text-center">
                {lang === "fr" ? "Identifiants invalides" : "Invalid credentials"}
              </div>
            )}
            <button
              onClick={handleLogin}
              className="w-full py-3.5 rounded-xl text-white text-lg font-bold shadow-md hover:opacity-90 transition"
              style={{ background: "var(--navy)" }}
            >
              <FiLock className="inline mr-2" size={20} />
              {lang === "fr" ? "Connexion" : "Login"}
            </button>
          </div>
          <div className="flex justify-center mt-6">
            <div className="flex rounded-xl overflow-hidden border border-gray-300">
              <button
                onClick={() => setLang("en")}
                className={`px-4 py-2 text-sm font-medium transition ${lang === "en" ? "bg-[var(--navy)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                English
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`px-4 py-2 text-sm font-medium transition ${lang === "fr" ? "bg-[var(--navy)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                Fran&ccedil;ais
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eceff1]">
      {/* Header */}
      <header className="bg-[var(--navy)] text-white px-4 md:px-8 py-3 md:py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setView("dashboard")}
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/truck-logo.png" alt="Truck" className="h-8 md:h-10 w-auto" />
            </button>
            <h1 className="text-sm md:text-2xl font-bold tracking-wide">{t(lang, "title")}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-6">
            <div className="flex rounded-xl overflow-hidden border border-white/30">
              <button
                onClick={() => setLang("en")}
                className={`px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-base font-medium transition ${lang === "en" ? "bg-[var(--navy-light)] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("fr")}
                className={`px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-base font-medium transition ${lang === "fr" ? "bg-[var(--navy-light)] text-white" : "bg-white/10 text-white/70 hover:bg-white/20"}`}
              >
                FR
              </button>
            </div>
            <div className="hidden md:block">
              <LiveClock lang={lang} />
            </div>
            <button
              onClick={() => { setLoggedIn(false); setLoginUser(""); setLoginPass(""); setView("dashboard"); }}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              title={lang === "fr" ? "Déconnexion" : "Logout"}
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Gold accent bar under header */}
      <div className="h-1.5 bg-[var(--red)]" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-3 md:p-6">
        {view === "dashboard" && <Dashboard lang={lang} setView={setView} setSearchQuery={setSearchQuery} />}
        {view === "checkout" && <CheckOutKey lang={lang} setView={setView} />}
        {view === "return" && <ReturnKey lang={lang} setView={setView} />}
        {view === "active" && <ActiveKeys lang={lang} setView={setView} />}
        {view === "search" && <SearchTruck lang={lang} setView={setView} initialQuery={searchQuery} onQueryConsumed={() => setSearchQuery("")} />}
        {view === "history" && <History lang={lang} setView={setView} />}
        {view === "daily" && <DailyReport lang={lang} setView={setView} />}
        {view === "weekly" && <WeeklyReport lang={lang} setView={setView} />}
      </main>
    </div>
  );
}

// ─── DASHBOARD ──────────────────────────────────────────────────────
function Dashboard({ lang, setView, setSearchQuery }: { lang: Lang; setView: (v: View) => void; setSearchQuery: (q: string) => void }) {
  const [stats, setStats] = useState<Stats>({ activeKeys: 0, freeTrucks: 0, totalTrucks: 0, totalTransactions: 0 });
  const [quickSearch, setQuickSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Transaction[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  async function handleQuickSearch(value: string) {
    setQuickSearch(value);
    if (value.trim().length >= 2) {
      const res = await fetch(`/api/search?type=truck&q=${encodeURIComponent(value.trim())}`);
      const truckResults = await res.json();
      if (truckResults.length === 0) {
        const res2 = await fetch(`/api/search?type=employee&q=${encodeURIComponent(value.trim())}`);
        const empResults = await res2.json();
        setSearchResults(empResults);
      } else {
        setSearchResults(truckResults);
      }
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }

  const navButtons: { view: View; icon: React.ReactNode; label: string; bg: string }[] = [
    { view: "checkout", icon: <FiKey size={30} />, label: t(lang, "checkOutKey"), bg: "#2E7D32" },
    { view: "return", icon: <FiCornerDownLeft size={30} />, label: t(lang, "returnKey"), bg: "#C62828" },
    { view: "search", icon: <FiSearch size={30} />, label: t(lang, "search"), bg: "#1565C0" },
    { view: "active", icon: <FiLock size={30} />, label: t(lang, "activeKeys"), bg: "#6A1B9A" },
    { view: "history", icon: <FiClock size={30} />, label: t(lang, "history"), bg: "#E65100" },
    { view: "daily", icon: <FiBarChart2 size={30} />, label: t(lang, "reports"), bg: "#00796B" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Navigation Buttons */}
      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {navButtons.map((btn) => (
            <button
              key={btn.view}
              onClick={() => setView(btn.view)}
              className="rounded-xl px-3 md:px-6 py-4 md:py-7 text-left text-white shadow-md hover:shadow-lg transition-all hover:brightness-110 cursor-pointer flex items-center gap-3 md:gap-5"
              style={{ background: btn.bg }}
            >
              <span className="shrink-0">{btn.icon}</span>
              <div className="font-bold text-sm md:text-lg tracking-wide">{btn.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Right: Summary + Quick Search */}
      <div className="lg:col-span-2 space-y-5">
        {/* Summary Box */}
        <div className="card">
          <h3 className="font-bold text-[var(--navy)] text-base uppercase tracking-wide mb-4 pb-3 border-b-2 border-[var(--red)]">
            {lang === "en" ? "Summary" : "Sommaire"}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <span className="text-base text-gray-700">{t(lang, "totalTrucks")}</span>
              <span className="px-4 py-1.5 rounded-lg text-base font-bold text-white" style={{ background: "var(--navy)" }}>
                {stats.totalTrucks}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <span className="text-base text-gray-700">{t(lang, "available")}</span>
              <span className="px-4 py-1.5 rounded-lg text-base font-bold text-white" style={{ background: "var(--green)" }}>
                {stats.freeTrucks}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
              <span className="text-base text-gray-700">{t(lang, "outCount")}</span>
              <span className="px-4 py-1.5 rounded-lg text-base font-bold text-white" style={{ background: "var(--red)" }}>
                {stats.activeKeys}
              </span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-base text-gray-700">{t(lang, "totalTransactions")}</span>
              <span className="px-4 py-1.5 rounded-lg text-base font-bold text-white" style={{ background: "var(--navy)" }}>
                {stats.totalTransactions.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="card relative">
          <h3 className="font-bold text-[var(--navy)] text-base uppercase tracking-wide mb-3">
            {t(lang, "quickSearchLabel")}
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 px-4 py-3.5 border-2 border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
              placeholder={t(lang, "quickSearch")}
              value={quickSearch}
              onChange={(e) => handleQuickSearch(e.target.value)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              onFocus={() => quickSearch.trim().length >= 2 && setShowResults(true)}
            />
            <button className="px-4 py-3.5 rounded-xl text-white" style={{ background: "var(--navy)" }}>
              <FiSearch size={22} />
            </button>
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border-2 border-[var(--navy)] rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
              {searchResults.map((tx) => (
                <div
                  key={tx.id}
                  className="px-4 py-3 hover:bg-[var(--blue-light)] border-b last:border-b-0 cursor-pointer"
                  onClick={() => { setShowResults(false); setSearchQuery(tx.truckNumber); setView("search"); }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-[var(--navy)]">{t(lang, "truckNumber")}: {tx.truckNumber}</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold text-white ${
                      tx.status === "OUT" ? "bg-[var(--red)]" : "bg-[var(--green)]"
                    }`}>
                      {tx.status === "OUT" ? t(lang, "out") : t(lang, "returnedStatus")}
                    </span>
                  </div>
                  <div className="text-sm text-[var(--gray)]">
                    {t(lang, "employeeNumber")}: {maskEmployeeId(tx.employeeNumber)} | {formatDateTime(tx.checkOutTime)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CHECK OUT KEY ──────────────────────────────────────────────────
function CheckOutKey({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [truckNumber, setTruckNumber] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string; data?: Transaction } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!employeeNumber.trim() || !truckNumber.trim()) return;
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ truckNumber, employeeNumber }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
      return;
    }

    setMessage({
      type: "success",
      text: `${t(lang, "truck")} ${data.truckNumber} ${t(lang, "checkedOutBy")} ${maskEmployeeId(data.employeeNumber)}`,
      data,
    });
  }

  function handleClear() {
    setEmployeeNumber("");
    setTruckNumber("");
    setMessage(null);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="section-header flex items-center gap-3">
        <FiKey size={26} /> {t(lang, "checkOutKey")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Steps */}
        <div className="space-y-6">
          {/* Step 1 */}
          <div className="card border-l-4 border-l-[var(--navy)]">
            <div className="flex items-start gap-3 md:gap-5">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full text-white flex items-center justify-center text-xl md:text-3xl font-bold shrink-0 shadow-md" style={{ background: "var(--navy)" }}>
                1
              </div>
              <div className="flex-1">
                <label className="block text-base md:text-xl font-bold text-[var(--navy)] mb-2 md:mb-3">
                  {t(lang, "scanEmployeeBadge")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 md:px-5 py-3 md:py-6 border-2 border-[var(--navy)] rounded-xl text-xl md:text-3xl focus:outline-none focus:ring-3 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="12345678"
                  autoFocus
                />
                {employeeNumber.length > 8 && (
                  <div className="text-base text-[var(--gray)] mt-2 font-mono">
                    Showing: {maskEmployeeId(employeeNumber)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card border-l-4 border-l-[var(--green)]">
            <div className="flex items-start gap-3 md:gap-5">
              <div className="w-10 h-10 md:w-16 md:h-16 rounded-full text-white flex items-center justify-center text-xl md:text-3xl font-bold shrink-0 shadow-md" style={{ background: "var(--green)" }}>
                2
              </div>
              <div className="flex-1">
                <label className="block text-base md:text-xl font-bold text-[var(--navy)] mb-2 md:mb-3">
                  {t(lang, "scanTruckKey")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 md:px-5 py-3 md:py-6 border-2 border-[var(--navy)] rounded-xl text-xl md:text-3xl focus:outline-none focus:ring-3 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
                  value={truckNumber}
                  onChange={(e) => setTruckNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckout()}
                  placeholder="15010"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCheckout}
            disabled={loading || !employeeNumber.trim() || !truckNumber.trim()}
            className="btn w-full py-4 md:py-5 text-lg md:text-xl text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            style={{ background: "var(--navy)" }}
          >
            {loading ? "..." : <><FiKey size={24} /> {t(lang, "checkOut")}</>}
          </button>
        </div>

        {/* Right: Checkout Info + Success/Error */}
        <div className="space-y-6">
          {/* Checkout Information Panel */}
          <div className="card">
            <h3 className="font-bold text-[var(--navy)] text-lg uppercase tracking-wide mb-4 pb-3 border-b-2 border-[var(--red)]">
              {t(lang, "departureInfo")}
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "truckNumber")}</span>
                <span className="font-mono font-bold text-xl text-[var(--navy)]">{truckNumber || "\u2014"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "employeeNumber")}</span>
                <span className="font-mono font-bold text-xl text-[var(--navy)]">{employeeNumber ? maskEmployeeId(employeeNumber) : "\u2014"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "routeNumber")}</span>
                <span className="font-mono font-bold text-xl text-[var(--navy)]">{message?.data?.routeNumber || "\u2014"}</span>
              </div>
              {message?.data && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-base text-gray-600">{t(lang, "checkOutTime")}</span>
                  <span className="font-bold text-lg">{formatDateTime(message.data.checkOutTime)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Success / Error */}
          {message && (
            <div
              className={`p-6 rounded-xl flex items-center gap-5 shadow-md text-white`}
              style={{ background: message.type === "success" ? "var(--green)" : "var(--red)" }}
            >
              {message.type === "success" ? <FiCheckCircle size={40} /> : <FiXCircle size={40} />}
              <div>
                <div className="text-2xl font-bold">
                  {message.type === "success" ? t(lang, "success") : t(lang, "error")}
                </div>
                <div className="text-base mt-1 opacity-95">{message.text}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-wrap gap-3 mt-6 md:mt-8">
        <button onClick={() => setView("dashboard")} className="btn btn-navy px-5 md:px-8 py-3 md:py-4 text-base md:text-lg">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
        <button onClick={handleClear} className="btn btn-navy px-5 md:px-8 py-3 md:py-4 text-base md:text-lg">
          {t(lang, "clear")}
        </button>
      </div>
    </div>
  );
}

// ─── RETURN KEY ─────────────────────────────────────────────────────
function ReturnKey({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [truckNumber, setTruckNumber] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [returnedTx, setReturnedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleReturn() {
    if (!truckNumber.trim()) return;
    setMessage(null);
    setReturnedTx(null);
    setLoading(true);

    const res = await fetch("/api/return", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ truckNumber }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
      return;
    }

    setReturnedTx(data);
    setMessage({
      type: "success",
      text: `${t(lang, "truck")} ${data.truckNumber} ${t(lang, "returned")}`,
    });
    setTruckNumber("");
  }

  function handleClear() {
    setTruckNumber("");
    setMessage(null);
    setReturnedTx(null);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="section-header flex items-center gap-3" style={{ borderColor: "var(--green)" }}>
        <FiCornerDownLeft size={26} /> {t(lang, "returnKey")}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Scan Input + Success/Error */}
        <div className="space-y-6">
          <div className="card border-l-4 border-l-[var(--green)]">
            <label className="block text-base md:text-xl font-bold text-[var(--navy)] mb-2 md:mb-3">
              {t(lang, "scanTruckToReturn")}
            </label>
            <input
              type="text"
              className="w-full px-3 md:px-5 py-3 md:py-6 border-2 border-[var(--navy)] rounded-xl text-xl md:text-3xl focus:outline-none focus:ring-3 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
              value={truckNumber}
              onChange={(e) => setTruckNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleReturn()}
              placeholder="15010"
              autoFocus
            />
            <button
              onClick={handleReturn}
              disabled={loading || !truckNumber.trim()}
              className="btn w-full py-4 md:py-5 text-lg md:text-xl text-white mt-4 md:mt-5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              style={{ background: "var(--green)" }}
            >
              {loading ? "..." : <><FiCornerDownLeft size={24} /> {t(lang, "returnKeyBtn")}</>}
            </button>
          </div>

          {/* Success / Error */}
          {message && (
            <div
              className={`p-6 rounded-xl flex items-center gap-5 shadow-md ${message.type === "success" ? "bg-[var(--green-light)] border-2 border-[var(--green)]" : "text-white"}`}
              style={message.type === "error" ? { background: "var(--red)" } : {}}
            >
              {message.type === "success"
                ? <FiCheckCircle size={40} className="text-[var(--green)] shrink-0" />
                : <FiXCircle size={40} className="shrink-0" />}
              <div>
                <div className={`text-2xl font-bold ${message.type === "success" ? "text-[var(--green)]" : ""}`}>
                  {message.type === "success" ? t(lang, "success") : t(lang, "error")}
                </div>
                <div className={`text-base mt-1 ${message.type === "success" ? "text-[var(--navy)]" : "opacity-95"}`}>
                  {message.text}
                </div>
                {returnedTx?.returnTime && message.type === "success" && (
                  <div className="text-base text-[var(--gray)] mt-1">
                    {t(lang, "returnTime")}: {formatDateTime(returnedTx.returnTime)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Return Information */}
        <div className="card h-fit">
          <h3 className="font-bold text-[var(--navy)] text-lg uppercase tracking-wide mb-4 pb-3 border-b-2 border-[var(--red)]">
            {t(lang, "returnDetails")}
          </h3>
          {returnedTx ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "truckNumber")}</span>
                <span className="font-mono font-bold text-xl text-[var(--navy)]">{returnedTx.truckNumber}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "employeeNumber")}</span>
                <span className="font-mono font-bold text-xl text-[var(--navy)]">{maskEmployeeId(returnedTx.employeeNumber)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "checkOutTime")}</span>
                <span className="font-bold text-lg">{formatDateTime(returnedTx.checkOutTime)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-base text-gray-600">{t(lang, "returnTime")}</span>
                <span className="font-bold text-lg">{returnedTx.returnTime ? formatDateTime(returnedTx.returnTime) : "\u2014"}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-base text-gray-600">{t(lang, "duration")}</span>
                <span className="font-bold text-xl text-[var(--navy)]">
                  {returnedTx.returnTime
                    ? formatDuration(new Date(returnedTx.returnTime).getTime() - new Date(returnedTx.checkOutTime).getTime())
                    : "\u2014"}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-[var(--gray)] text-lg">
              {t(lang, "scanTruckToReturn")}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex flex-wrap gap-3 mt-6 md:mt-8">
        <button onClick={() => setView("dashboard")} className="btn btn-navy px-5 md:px-8 py-3 md:py-4 text-base md:text-lg">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
        <button onClick={handleClear} className="btn btn-navy px-5 md:px-8 py-3 md:py-4 text-base md:text-lg">
          {t(lang, "clear")}
        </button>
      </div>
    </div>
  );
}

// ─── ACTIVE KEYS ────────────────────────────────────────────────────
function ActiveKeys({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = useCallback(() => {
    setLoading(true);
    fetch("/api/active")
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchActive();
    const interval = setInterval(fetchActive, 15000);
    return () => clearInterval(interval);
  }, [fetchActive]);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-[var(--navy)]">{t(lang, "activeKeys")}</h2>
        </div>
        <span className="text-2xl font-bold" style={{ color: "var(--red)" }}>
          Total: {transactions.length}
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-[var(--gray)]">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-[var(--gray)]">{t(lang, "noResults")}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full text-base">
            <thead>
              <tr style={{ background: "var(--navy)" }} className="text-white">
                <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "truckNumber")}</th>
                <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "employeeNumber")}</th>
                <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "checkOutTime")}</th>
                <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "duration")}</th>
                <th className="px-4 py-3.5 text-center font-semibold">{t(lang, "status")}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, i) => {
                const durationMs = Date.now() - new Date(tx.checkOutTime).getTime();
                return (
                  <tr key={tx.id} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-4 py-3.5 font-mono font-bold">{tx.truckNumber}</td>
                    <td className="px-4 py-3.5 font-mono">{maskEmployeeId(tx.employeeNumber)}</td>
                    <td className="px-4 py-3.5">{formatDateTime(tx.checkOutTime)}</td>
                    <td className="px-4 py-3.5">{formatDuration(durationMs)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-4 py-1.5 rounded text-sm font-bold text-white" style={{ background: "var(--red)" }}>
                        OUT
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={fetchActive} className="btn btn-navy flex items-center gap-2">
          <FiRefreshCw size={20} /> {t(lang, "refresh")}
        </button>
        <button onClick={() => setView("dashboard")} className="btn btn-navy flex items-center gap-2">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
      </div>
    </div>
  );
}

// ─── SEARCH ─────────────────────────────────────────────────────────
function SearchTruck({ lang, setView, initialQuery, onQueryConsumed }: { lang: Lang; setView: (v: View) => void; initialQuery?: string; onQueryConsumed?: () => void }) {
  const [searchType, setSearchType] = useState<"truck" | "employee" | "transaction">("truck");
  const [query, setQuery] = useState(initialQuery || "");
  const [results, setResults] = useState<Transaction[]>([]);
  const [searched, setSearched] = useState(false);

  // Find the current OUT transaction and the last returned transaction for display
  const currentOut = results.find((tx) => tx.status === "OUT");
  const lastReturn = results.find((tx) => tx.status === "RETURNED");

  async function handleSearch(q?: string) {
    const searchVal = q || query;
    if (!searchVal.trim()) return;
    const res = await fetch(`/api/search?type=${searchType}&q=${encodeURIComponent(searchVal)}`);
    const data = await res.json();
    setResults(data);
    setSearched(true);
  }

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
      onQueryConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const searchTypeOptions: { value: "truck" | "employee" | "transaction"; labelKey: "truckNumberLabel" | "employeeNumberLabel" | "transactionId" }[] = [
    { value: "truck", labelKey: "truckNumberLabel" },
    { value: "employee", labelKey: "employeeNumberLabel" },
    { value: "transaction", labelKey: "transactionId" },
  ];

  return (
    <div className="card">
      {/* Search Controls - two column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Left: Search By */}
        <div className="border border-gray-300 rounded-lg p-4 md:p-5">
          <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-3 md:mb-4">{t(lang, "searchBy")}</h3>
          <div className="space-y-3">
            {searchTypeOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer text-base">
                <input
                  type="radio"
                  name="searchType"
                  checked={searchType === opt.value}
                  onChange={() => setSearchType(opt.value)}
                  className="w-5 h-5 accent-[var(--navy)]"
                />
                <span className={searchType === opt.value ? "font-semibold text-[var(--navy)]" : "text-gray-600"}>
                  {t(lang, opt.labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Right: Enter Value */}
        <div className="border border-gray-300 rounded-lg p-4 md:p-5">
          <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-3 md:mb-4">{t(lang, "enterValue")}</h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input
              type="text"
              className="flex-1 px-3 md:px-4 py-3 md:py-3.5 border-2 border-gray-300 rounded-lg text-lg md:text-xl focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
            />
            <button onClick={() => handleSearch()} className="btn btn-navy px-4 md:px-6 text-base flex items-center justify-center gap-2">
              <FiSearch size={20} /> {t(lang, "searchBtn")}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {searched && (
        <div className="border border-gray-300 rounded-lg p-5">
          <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "results")}</h3>

          {results.length === 0 ? (
            <div className="text-center py-8 text-[var(--gray)]">{t(lang, "noResults")}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: Current Status */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                {currentOut ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "truckNumber")}:</span>
                      <span className="font-bold text-[var(--navy)] text-lg">{currentOut.truckNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "status")}:</span>
                      <span className="font-bold text-[var(--red)] text-lg">{t(lang, "out")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "currentEmployee")}:</span>
                      <span>{maskEmployeeId(currentOut.employeeNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "checkOutTime")}:</span>
                      <span>{formatDateTime(currentOut.checkOutTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "duration")}:</span>
                      <span>{formatDuration(Date.now() - new Date(currentOut.checkOutTime).getTime())}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "truckNumber")}:</span>
                      <span className="font-bold text-[var(--navy)] text-lg">{results[0].truckNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "status")}:</span>
                      <span className="font-bold text-[var(--green)] text-lg">{t(lang, "available")}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Right: Last Return */}
              <div className="border border-gray-200 rounded-lg p-5 space-y-3">
                <h4 className="font-bold text-[var(--navy)] text-base uppercase">{t(lang, "lastReturn")}</h4>
                {lastReturn ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "returnTime")}:</span>
                      <span>{lastReturn.returnTime ? formatDateTime(lastReturn.returnTime) : "\u2014"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "employeeNumber")}:</span>
                      <span>{maskEmployeeId(lastReturn.employeeNumber)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--gray)] font-semibold">{t(lang, "duration")}:</span>
                      <span>
                        {lastReturn.returnTime
                          ? formatDuration(new Date(lastReturn.returnTime).getTime() - new Date(lastReturn.checkOutTime).getTime())
                          : "\u2014"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-[var(--gray)] py-4">{t(lang, "noResults")}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom button */}
      <div className="flex justify-end mt-6">
        <button onClick={() => setView("dashboard")} className="btn btn-navy flex items-center gap-2">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
      </div>
    </div>
  );
}

// ─── HISTORY ────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

function History({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<"week" | "month">("week");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchHistory = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);

    const now = new Date();
    const from = new Date(now);
    if (dateRange === "week") {
      from.setDate(from.getDate() - 7);
    } else {
      from.setMonth(from.getMonth() - 1);
    }
    params.set("from", from.toISOString().split("T")[0]);
    params.set("limit", "500");

    fetch(`/api/transactions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setTransactions(data);
        setLoading(false);
        setCurrentPage(1);
      });
  }, [statusFilter, dateRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const paginatedTx = transactions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function exportToExcel() {
    const data = transactions.map((tx) => ({
      ID: tx.id,
      [t(lang, "truckNumber")]: tx.truckNumber,
      [t(lang, "employeeNumber")]: maskEmployeeId(tx.employeeNumber),
      [t(lang, "routeNumber")]: tx.routeNumber || "",
      [t(lang, "checkOutTime")]: formatDateTime(tx.checkOutTime),
      [t(lang, "returnTime")]: tx.returnTime ? formatDateTime(tx.returnTime) : "",
      [t(lang, "duration")]: tx.returnTime
        ? formatDuration(new Date(tx.returnTime).getTime() - new Date(tx.checkOutTime).getTime())
        : "",
      [t(lang, "status")]: tx.status === "OUT" ? t(lang, "out") : t(lang, "returnedStatus"),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t(lang, "history"));
    XLSX.writeFile(wb, `truck_keys_history_${new Date().toISOString().split("T")[0]}.xlsx`);
  }

  return (
    <div className="card">
      {/* Filters (toggled) */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 items-end">
          <div>
            <label className="block text-xs text-[var(--gray)] mb-1 uppercase font-bold">{t(lang, "status")}</label>
            <select
              className="input w-auto"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t(lang, "all")}</option>
              <option value="OUT">{t(lang, "out")}</option>
              <option value="RETURNED">{t(lang, "returnedStatus")}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[var(--gray)] mb-1 uppercase font-bold">{t(lang, "selectDateRange")}</label>
            <div className="flex">
              <button
                onClick={() => setDateRange("week")}
                className={`px-4 py-2.5 rounded-l-lg text-sm font-bold border-2 ${
                  dateRange === "week" ? "text-white border-[var(--navy)]" : "bg-white text-[var(--navy)] border-gray-300"
                }`}
                style={dateRange === "week" ? { background: "var(--navy)" } : {}}
              >
                {t(lang, "oneWeek")}
              </button>
              <button
                onClick={() => setDateRange("month")}
                className={`px-4 py-2.5 rounded-r-lg text-sm font-bold border-2 border-l-0 ${
                  dateRange === "month" ? "text-white border-[var(--navy)]" : "bg-white text-[var(--navy)] border-gray-300"
                }`}
                style={dateRange === "month" ? { background: "var(--navy)" } : {}}
              >
                {t(lang, "oneMonth")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-8 text-[var(--gray)]">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-[var(--gray)]">{t(lang, "noResults")}</div>
      ) : (
        <>
          <div className="overflow-x-auto border border-gray-300 rounded-lg">
            <table className="w-full text-base">
              <thead>
                <tr style={{ background: "var(--navy)" }} className="text-white">
                  <th className="px-4 py-3.5 text-left font-semibold">ID</th>
                  <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "truckNumber")}</th>
                  <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "employeeNumber")}</th>
                  <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "checkOutTime")}</th>
                  <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "returnTime")}</th>
                  <th className="px-4 py-3.5 text-center font-semibold">{t(lang, "status")}</th>
                  <th className="px-4 py-3.5 text-left font-semibold">{t(lang, "duration")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTx.map((tx, i) => {
                  const duration = tx.returnTime
                    ? formatDuration(new Date(tx.returnTime).getTime() - new Date(tx.checkOutTime).getTime())
                    : tx.status === "OUT"
                      ? formatDuration(Date.now() - new Date(tx.checkOutTime).getTime())
                      : "\u2014";
                  return (
                    <tr key={tx.id} className={`border-b border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                      <td className="px-4 py-3.5 font-mono text-[var(--gray)]">{tx.id}</td>
                      <td className="px-4 py-3.5 font-mono font-bold">{tx.truckNumber}</td>
                      <td className="px-4 py-3.5 font-mono">{maskEmployeeId(tx.employeeNumber)}</td>
                      <td className="px-4 py-3.5">{formatDateTime(tx.checkOutTime)}</td>
                      <td className="px-4 py-3.5">{tx.returnTime ? formatDateTime(tx.returnTime) : "\u2014"}</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`px-4 py-1.5 rounded text-sm font-bold text-white ${
                          tx.status === "OUT" ? "bg-[var(--red)]" : "bg-[var(--green)]"
                        }`}>
                          {tx.status === "OUT" ? t(lang, "out") : t(lang, "returnedStatus")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{duration}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-navy disabled:opacity-50"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="text-base font-semibold text-[var(--navy)]">
                {t(lang, "page")} {currentPage} {t(lang, "of")} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-navy disabled:opacity-50"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Bottom buttons */}
      <div className="flex flex-wrap gap-2 md:gap-3 mt-6">
        <button onClick={exportToExcel} className="btn btn-navy flex items-center gap-2 text-sm md:text-base">
          <FiDownload size={18} /> {t(lang, "exportExcel")}
        </button>
        <button onClick={() => setShowFilters(!showFilters)} className="btn btn-navy flex items-center gap-2 text-sm md:text-base">
          <FiFilter size={18} /> {t(lang, "filter")}
        </button>
        <button onClick={() => setView("dashboard")} className="btn btn-navy flex items-center gap-2 text-sm md:text-base">
          <FiHome size={18} /> {t(lang, "backToDashboard")}
        </button>
      </div>
    </div>
  );
}

// ─── DAILY REPORT ───────────────────────────────────────────────────
function DailyReport({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<{
    totalCheckouts: number;
    totalReturns: number;
    stillOut: number;
    totalTransactions: number;
    uniqueTrucks: number;
    uniqueEmployees: number;
    hourlyActivity: { hour: number; checkouts: number; returns: number }[];
    transactions: Transaction[];
  } | null>(null);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    const res = await fetch(`/api/reports/daily?date=${date}`);
    const data = await res.json();
    setReport(data);
    setGenerated(true);
  }

  function exportToExcel() {
    if (!report) return;
    const data = report.transactions.map((tx) => ({
      [t(lang, "truckNumber")]: tx.truckNumber,
      [t(lang, "employeeNumber")]: maskEmployeeId(tx.employeeNumber),
      [t(lang, "checkOutTime")]: formatDateTime(tx.checkOutTime),
      [t(lang, "returnTime")]: tx.returnTime ? formatDateTime(tx.returnTime) : "",
      [t(lang, "status")]: tx.status === "OUT" ? t(lang, "out") : t(lang, "returnedStatus"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t(lang, "dailyReport"));
    XLSX.writeFile(wb, `daily_report_${date}.xlsx`);
  }

  return (
    <div className="card">
      {/* Top: Date + Generate */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <label className="block text-sm font-bold text-[var(--navy)] uppercase mb-2">{t(lang, "date")}</label>
          <input
            type="date"
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
            value={date}
            onChange={(e) => { setDate(e.target.value); setGenerated(false); }}
          />
        </div>
        <button onClick={handleGenerate} className="btn btn-navy flex items-center gap-2 text-base">
          <FiBarChart2 size={20} /> {t(lang, "generate")}
        </button>
      </div>

      {generated && report && (
        <>
          {/* Daily Summary */}
          <div className="border border-gray-300 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "dailySummary")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--navy)]">{t(lang, "totalCheckouts")}</div>
                <div className="text-4xl font-bold text-[var(--navy)]">{report.totalCheckouts}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--navy)]">{t(lang, "totalReturns")}</div>
                <div className="text-4xl font-bold text-[var(--navy)]">{report.totalReturns}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--red)]">{t(lang, "stillOut")}</div>
                <div className="text-4xl font-bold text-[var(--red)]">{report.stillOut}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--green)]">{t(lang, "totalTransactions")}</div>
                <div className="text-4xl font-bold text-[var(--green)]">{report.totalTransactions}</div>
              </div>
            </div>
          </div>

          {/* Hourly Chart */}
          <div className="border border-gray-300 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "activityByHour")}</h3>
            {report.hourlyActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={report.hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h: number) => {
                    if (h === 0) return "12 AM";
                    if (h < 12) return `${h} AM`;
                    if (h === 12) return "12 PM";
                    return `${h - 12} PM`;
                  }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Legend />
                  <Bar dataKey="checkouts" name={t(lang, "checkouts")} fill="#4A90D9" />
                  <Bar dataKey="returns" name={t(lang, "returns")} fill="#66BB6A" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-[var(--gray)]">{t(lang, "noResults")}</div>
            )}
          </div>
        </>
      )}

      {/* Bottom buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={exportToExcel} disabled={!generated || !report} className="btn btn-navy flex items-center gap-2 disabled:opacity-50">
          <FiDownload size={20} /> {t(lang, "exportExcel")}
        </button>
        <button onClick={() => setView("dashboard")} className="btn btn-navy flex items-center gap-2">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
      </div>
    </div>
  );
}

// ─── WEEKLY REPORT ──────────────────────────────────────────────────
function WeeklyReport({ lang, setView }: { lang: Lang; setView: (v: View) => void }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<{
    startDate: string;
    endDate: string;
    totalCheckouts: number;
    totalReturns: number;
    stillOut: number;
    uniqueTrucks: number;
    uniqueEmployees: number;
    mostUsedTrucks: { truck: string; count: number }[];
    dailyBreakdown: { date: string; checkouts: number; returns: number }[];
    avgDurationMs: number;
  } | null>(null);
  const [generated, setGenerated] = useState(false);

  async function handleGenerate() {
    const res = await fetch(`/api/reports/weekly?date=${date}`);
    const data = await res.json();
    setReport(data);
    setGenerated(true);
  }

  function exportToExcel() {
    if (!report) return;
    const summaryData = [{
      [t(lang, "totalTransactions")]: report.totalCheckouts + report.totalReturns,
      [t(lang, "totalCheckouts")]: report.totalCheckouts,
      [t(lang, "totalReturns")]: report.totalReturns,
      [t(lang, "stillOut")]: report.stillOut,
      [t(lang, "avgDuration")]: report.avgDurationMs > 0 ? formatDuration(report.avgDurationMs) : "\u2014",
    }];
    const ws = XLSX.utils.json_to_sheet(summaryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t(lang, "weeklyReport"));
    XLSX.writeFile(wb, `weekly_report_${date}.xlsx`);
  }

  return (
    <div className="card">
      {/* Top: Week Starting + Generate */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <label className="block text-sm font-bold text-[var(--navy)] uppercase mb-2">{t(lang, "weekStarting")}</label>
          <input
            type="date"
            className="px-4 py-3 border-2 border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[var(--navy)] focus:border-[var(--navy)]"
            value={date}
            onChange={(e) => { setDate(e.target.value); setGenerated(false); }}
          />
        </div>
        <button onClick={handleGenerate} className="btn btn-navy flex items-center gap-2 text-base">
          <FiBarChart2 size={20} /> {t(lang, "generate")}
        </button>
      </div>

      {generated && report && (
        <>
          {/* Weekly Summary */}
          <div className="border border-gray-300 rounded-lg p-5 mb-6">
            <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "weeklySummary")}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--navy)]">{t(lang, "totalTransactions")}</div>
                <div className="text-4xl font-bold text-[var(--navy)]">{report.totalCheckouts + report.totalReturns}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--navy)]">{t(lang, "totalCheckouts")}</div>
                <div className="text-4xl font-bold text-[var(--navy)]">{report.totalCheckouts}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--green)]">{t(lang, "totalReturns")}</div>
                <div className="text-4xl font-bold text-[var(--green)]">{report.totalReturns}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-[var(--red)]">{t(lang, "stillOut")}</div>
                <div className="text-4xl font-bold text-[var(--red)]">{report.stillOut}</div>
              </div>
            </div>
          </div>

          {/* Two-column: Most Used Trucks + Average Duration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Most Used Trucks */}
            <div className="border border-gray-300 rounded-lg p-5">
              <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "mostUsedTrucks")}</h3>
              {report.mostUsedTrucks.length > 0 ? (
                <div className="space-y-3">
                  {report.mostUsedTrucks.map((item) => {
                    const maxCount = report.mostUsedTrucks[0].count;
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div key={item.truck} className="flex items-center gap-3">
                        <span className="font-mono font-bold w-20 text-base text-[var(--navy)]">{item.truck}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-7 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${Math.max(pct, 10)}%`, background: "var(--green)" }}
                          />
                        </div>
                        <span className="text-base font-bold text-[var(--navy)] w-8 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[var(--gray)] text-sm">{t(lang, "noResults")}</div>
              )}
            </div>

            {/* Average Duration */}
            <div className="border border-gray-300 rounded-lg p-5 flex flex-col items-center justify-center">
              <h3 className="text-sm font-bold text-[var(--navy)] uppercase tracking-wide mb-4">{t(lang, "avgDuration")}</h3>
              <div className="flex items-center gap-3">
                <FiClock size={36} className="text-[var(--navy)]" />
                <span className="text-4xl font-bold text-[var(--navy)]">
                  {report.avgDurationMs > 0 ? formatDuration(report.avgDurationMs) : "\u2014"}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bottom buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={exportToExcel} disabled={!generated || !report} className="btn btn-navy flex items-center gap-2 disabled:opacity-50">
          <FiDownload size={20} /> {t(lang, "exportExcel")}
        </button>
        <button onClick={() => setView("dashboard")} className="btn btn-navy flex items-center gap-2">
          <FiHome size={20} /> {t(lang, "backToDashboard")}
        </button>
      </div>
    </div>
  );
}

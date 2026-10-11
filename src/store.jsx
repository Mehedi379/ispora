import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { api, getToken, setToken, clearToken } from "./api";

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [ent, setEnt] = useState(null); // SaaS entitlements (plan/seat/trial/lock)
  const toastTimer = useRef(null);

  // Global toast — API fail hole chup chap thakbe na, user ke dekhabo
  const notify = useCallback((msg, kind = "error") => {
    setToast({ msg, kind, id: Date.now() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // App chalu hole token thakle user load koro
  useEffect(() => {
    let alive = true;
    (async () => {
      if (getToken()) {
        try {
          const me = await api.me();
          if (alive) setUser(me);
        } catch { clearToken(); }
      }
      if (alive) setAuthReady(true);
    })();
    const onLogout = () => setUser(null);
    window.addEventListener("ispora:logout", onLogout);
    return () => {
      alive = false;
      window.removeEventListener("ispora:logout", onLogout);
      clearTimeout(toastTimer.current);
    };
  }, []);

  const refreshClients = useCallback(async () => {
    if (!getToken()) return;
    setLoading(true);
    try {
      setClients(await api.listClients());
    } catch (e) {
      console.error("refreshClients failed:", e);
      notify(e?.message || "Client load fail holo");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // Login hole clients + entitlements load koro
  const refreshEntitlements = useCallback(async () => {
    if (!getToken()) return;
    try { setEnt(await api.entitlements()); } catch { /* ignore */ }
  }, []);
  // Plan-e kono feature khola kina (ent load na hoyle default khola — block kori na)
  const hasFeature = useCallback((key) => {
    if (user?.isPlatformOwner) return true;
    const f = ent?.features;
    if (f == null) return true;
    return f === "*" || String(f).split(",").map((s) => s.trim()).filter(Boolean).includes(key);
  }, [ent, user]);
  useEffect(() => {
    if (user) {
      refreshEntitlements();
      if (!user.isPlatformOwner) refreshClients();
      else setClients([]);
    } else { setClients([]); setEnt(null); }
  }, [user, refreshClients, refreshEntitlements]);

  const login = useCallback(async (email, password) => {
    const { token, user: u } = await api.login(email, password);
    setToken(token);
    setUser(u);
    return u;
  }, []);
  // Self-serve signup — notun ISP + 7-din trial, shonge shonge login
  const signup = useCallback(async (body) => {
    const { token, user: u } = await api.signup(body);
    setToken(token);
    setUser(u);
    return u;
  }, []);
  const logout = useCallback(() => { clearToken(); setUser(null); }, []);
  // Profile update er por topbar/menu-te notun info reflect korte
  const refreshUser = useCallback(async () => { try { setUser(await api.me()); } catch { /* ignore */ } }, []);

  // Mutation gula ekhane-i catch kori — pages promise await/na kore fail holeo toast ashbe
  const addClient = useCallback(async (c) => {
    try { await api.createClient(c); await refreshClients(); }
    catch (e) { notify(e?.message || "Client create fail"); throw e; }
  }, [refreshClients, notify]);
  const updateClient = useCallback(async (c) => {
    try { await api.updateClient(c.id, c); await refreshClients(); }
    catch (e) { notify(e?.message || "Client update fail"); throw e; }
  }, [refreshClients, notify]);
  const deleteClient = useCallback(async (id) => {
    try { await api.deleteClient(id); await refreshClients(); }
    catch (e) { notify(e?.message || "Delete fail"); throw e; }
  }, [refreshClients, notify]);
  const toggleLine = useCallback(async (id) => {
    try {
      const updated = await api.toggleClient(id);
      setClients((list) => list.map((x) => (x.id === id ? updated : x)));
    } catch (e) {
      notify(e?.message || "Line change fail holo");
      throw e;
    }
  }, [notify]);

  // Memoized — toast/loading change-eo baki consumer (pura table) re-render hoto na
  const value = useMemo(() => ({
      user, authReady, login, logout, signup, refreshUser,
      clients, loading, refreshClients,
      addClient, updateClient, deleteClient, toggleLine,
      toast, notify,
      ent, refreshEntitlements, hasFeature,
    }), [user, authReady, login, logout, signup, refreshUser, clients, loading, refreshClients,
         addClient, updateClient, deleteClient, toggleLine, toast, notify, ent, refreshEntitlements, hasFeature]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

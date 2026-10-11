import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";

// Menu body-er upor portal kori (position: fixed) — age absolute chilo, tai
// kono opekkhito `overflow-hidden` container (Clients-er "More" panel, modal-er
// scroll body, card overflow-hidden) menu-ke clip kore felto — dropdown open
// hoto kintu dekha jay na.
//
// options: string[]  (value === label)  OR  {value,label}[]  (id-based select)
// placeholder: value khali/null hole ei text dekhabe; ekta clear-option o jog hobe.
// onChange(value): string option hole string, object option hole tar `value` (number o hote pare)
export default function Dropdown({ label, value, options = [], onChange, className = "", disabled = false, placeholder }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  // string ba {value,label} — duitai eki shape e normalize kori
  const items = useMemo(() => {
    const norm = options.map((o) =>
      o != null && typeof o === "object" ? { value: o.value, label: o.label ?? String(o.value) } : { value: o, label: String(o) }
    );
    // placeholder dile ekta "khali/clear" option samne jog kori (native select-er moto)
    return placeholder != null ? [{ value: "", label: `— ${placeholder} —`, _clear: true }, ...norm] : norm;
  }, [options, placeholder]);

  const selected = items.find((it) => it.value === value && !it._clear);
  const display = selected ? selected.label : (placeholder != null ? `— ${placeholder} —` : value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      // wrapper ba portal menu er bhitore na holei bondho
      if (wrapRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    // scroll/resize e trigger-er position change hoye jay — menu bandho (stalwarta rokte na)
    const dismiss = () => setOpen(false);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, true);
    window.addEventListener("resize", dismiss);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
      window.removeEventListener("resize", dismiss);
    };
  }, [open]);

  const toggle = () => {
    if (disabled) return;
    if (!open && wrapRef.current) {
      const r = wrapRef.current.getBoundingClientRect();
      const menuH = Math.min(items.length * 40 + 16, 256);
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      // Niche jayga na thakle upore; viewport-er baire kabhu na jay
      const up = spaceBelow < menuH + 16 && spaceAbove > spaceBelow;
      let top = up ? r.top - menuH - 8 : r.bottom + 8;
      top = Math.min(Math.max(top, 8), Math.max(8, window.innerHeight - menuH - 8));
      const left = Math.min(Math.max(r.left, 8), Math.max(8, window.innerWidth - r.width - 8));
      setPos({ top, left, width: r.width });
    }
    setOpen((o) => !o);
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 px-3.5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:border-gold-400 disabled:opacity-60"
      >
        <span className={`truncate ${!selected && placeholder != null ? "text-slate-400" : ""}`}>
          {label && <span className="text-slate-400">{label}: </span>}
          {display}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-gold-500" />
        </motion.span>
      </button>

      {open && pos &&
        createPortal(
          <motion.ul
            ref={menuRef}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            className="z-[70] max-h-64 overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-navy-800 p-1.5 shadow-premium"
          >
            {items.map((it) => {
              const active = it.value === value && !it._clear;
              return (
                <li key={String(it.value)}>
                  <button
                    type="button"
                    onClick={() => { onChange(it._clear ? null : it.value); setOpen(false); }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-gold-500/10 ${
                      active ? "text-gold-600 font-semibold" : it._clear ? "text-slate-400" : "text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {it.label}
                    {active && <Check size={15} className="text-gold-500" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>,
          document.body
        )}
    </div>
  );
}

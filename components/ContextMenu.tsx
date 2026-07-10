"use client";

import { useEffect, useRef, useState } from "react";

export interface ContextMenuAction {
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuAction[];
  children: React.ReactNode;
  className?: string;
}

export default function ContextMenu({ items, children, className = "" }: ContextMenuProps) {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = () => setMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setMenu(null); };
    if (menu) {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menu]);

  useEffect(() => {
    if (!menu || !menuRef.current) return;
    const el = menuRef.current;
    const rect = el.getBoundingClientRect();
    const overflowRight = rect.right > window.innerWidth;
    const overflowBottom = rect.bottom > window.innerHeight;
    if (overflowRight) el.style.left = `${menu.x - rect.width}px`;
    if (overflowBottom) el.style.top = `${menu.y - rect.height}px`;
  }, [menu]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[100] min-w-[180px] py-1.5 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl shadow-black/30 backdrop-blur-xl"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item, i) => (
            item.divider ? (
              <div key={i} className="my-1 border-t border-slate-700/50" />
            ) : (
              <button
                key={i}
                onClick={() => { item.onClick?.(); setMenu(null); }}
                disabled={item.disabled}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                  item.danger
                    ? "text-red-400 hover:bg-red-500/10"
                    : "text-slate-200 hover:bg-slate-700/50"
                } ${item.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                {item.icon && <span className="w-4 h-4 flex items-center justify-center">{item.icon}</span>}
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/shorturl", label: "短链接" },
  { href: "/qrcode", label: "二维码" },
  { href: "/pages-to-word", label: "Pages转Word" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const activeLink = navRef.current.querySelector(`a[href="${pathname}"]`) as HTMLElement;
      if (activeLink) {
        const navRect = navRef.current.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();
        setIndicatorStyle({
          left: linkRect.left - navRect.left,
          width: linkRect.width,
          opacity: 1,
        });
      } else {
        setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [pathname]);

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo.png" alt="Logo" width={120} height={32} className="h-8 w-auto object-contain" />
            <span className="w-px h-5 bg-slate-300" />
            <span className="text-sm font-medium text-slate-600">Tools</span>
          </Link>

          {/* Desktop Nav */}
          <div ref={navRef} className="hidden md:flex items-center space-x-1 relative">
            {/* Liquid Glass Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 h-9 rounded-full bg-white/70 backdrop-blur-2xl shadow-lg shadow-black/[0.08] border border-white/60 pointer-events-none transition-all duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
              style={{
                left: indicatorStyle.left,
                width: indicatorStyle.width,
                opacity: indicatorStyle.opacity,
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                backdropFilter: 'blur(40px) saturate(200%)',
              }}
            />
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative z-10 px-5 py-2 text-sm font-medium rounded-full transition-colors duration-300 ${
                    isActive
                      ? "text-slate-900"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 text-sm rounded-xl mx-2 my-1 transition-all duration-300 ${
                    isActive
                      ? "text-slate-900 bg-white/70 backdrop-blur-xl shadow-lg shadow-black/5 border border-white/50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}


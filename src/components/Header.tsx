import { useState, useEffect } from 'react';
import { ShoppingBasket, Menu, X, Snowflake, Phone, Lock } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cart: CartItem[];
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  settings?: any;
}

export default function Header({ cart, onOpenCart, onOpenAdmin, settings }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const waNum = settings?.waNumber || '6281234567890';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header
      id="header-nav"
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/70 backdrop-blur-md border-b border-slate-200/40 shadow-sm py-3'
          : 'bg-white/40 backdrop-blur-md border-b border-white/20 py-5'
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#id-hero" className="flex items-center gap-2 group">
          <div className="bg-emerald-600 text-white p-2.5 rounded-2xl shadow-lg group-hover:bg-emerald-700 transition duration-300">
            <Snowflake className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
              HAYLOFRESS
            </span>
            <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase block mt-1">
              NGAWI • FRESH & FROZEN
            </span>
          </div>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 font-medium text-slate-600">
          <a href="#id-hero" className="hover:text-emerald-600 transition">Beranda</a>
          <a href="#id-problem" className="hover:text-emerald-600 transition">Solusi</a>
          <a href="#id-keunggulan" className="hover:text-emerald-600 transition">Keunggulan</a>
          <a href="#id-profil" className="hover:text-emerald-600 transition">Mitra Kami</a>
          <a href="#id-katalog" className="hover:text-emerald-600 transition">Katalog</a>
          <a href="#id-testimoni" className="hover:text-emerald-600 transition">Testimoni</a>
          <a href="#id-kontak" className="hover:text-emerald-600 transition">Hubungi Kami</a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Basket Button with Dynamic Badge Count */}
          <button
            id="cart-trigger-btn"
            onClick={onOpenCart}
            className="relative p-3 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition duration-300 focus:outline-none"
            aria-label="Buka Keranjang Belanjaan"
          >
            <ShoppingBasket className="w-6 h-6 sm:w-7 h-7" />
            {totalItems > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[11px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white animate-scale-in">
                {totalItems}
              </span>
            )}
          </button>

          {/* Admin Dashboard Panel Lock */}
          <button
            onClick={onOpenAdmin}
            className="p-3 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition duration-300 focus:outline-none cursor-pointer"
            title="Buka Panel Pengelola Admin"
          >
            <Lock className="w-5.5 h-5.5" />
          </button>

          {/* Quick WA Button - Desktop */}
          <a
            href={`https://wa.me/${waNum}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20tertarik%20tanya-tanya%20produk%20frozen%20food%20atau%20ingin%20gabung%20reseller.`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">Hubungi Chat</span>
          </a>

          {/* Mobile Menu Open Hamburger Button */}
          <button
            id="hamburger-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition focus:outline-none"
            aria-label="Menu Utama"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Links */}
      {isMobileMenuOpen && (
        <div id="mobile-nav-panel" className="lg:hidden bg-white border-t border-slate-100 shadow-xl absolute w-full left-0 z-50 animate-fade-in">
          <div className="flex flex-col p-4 space-y-3 font-medium text-slate-700">
            <a
              href="#id-hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Beranda
            </a>
            <a
              href="#id-problem"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Mengapa Kami
            </a>
            <a
              href="#id-keunggulan"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Keunggulan
            </a>
            <a
              href="#id-profil"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Mitra Kami
            </a>
            <a
              href="#id-katalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Katalog Produk
            </a>
            <a
              href="#id-testimoni"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Testimoni
            </a>
            <a
              href="#id-kontak"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition"
            >
              Kontak & Lokasi
            </a>
            <a
              href={`https://wa.me/${waNum}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20tertarik%20tanya-tanya%20produk%20atau%20gabung%20reseller.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/15 transition-all w-full"
            >
              <Phone className="w-5 h-5" />
              <span>Hubungi via WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}

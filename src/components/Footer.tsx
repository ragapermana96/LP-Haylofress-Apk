import { MapPin, Phone, Clock, Mail, Snowflake, Send, ShieldAlert, Heart } from 'lucide-react';

interface FooterProps {
  settings?: any;
}

export default function Footer({ settings }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const waNum = settings?.waNumber || '6281234567890';

  return (
    <footer id="id-kontak" className="bg-slate-900 text-white mt-1 relative overflow-hidden pt-16 pb-8 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          
          {/* Logo & Narrative Branding Column */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">
                <Snowflake className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight block leading-none text-white">
                  HAYLOFRESS
                </span>
                <span className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase block mt-1">
                  NGAWI - Frozen & Fresh
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed font-light">
              Supplier andalan tangan pertama penyediaan karkas ayam segar, paha, fillet dada, daging sapi wagyu/semur, fillet dori, dan aneka kentang impor & sayur beku higienis di Kabupaten Ngawi, Jawa Timur.
            </p>

            {/* Quick Contacts List */}
            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4.5 h-4.5 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  {settings?.footerAddress || 'Jl. Ketonggo II Gg. Jalak No.21 RT 23 RW 05, Ketanggi, Ngawi, Jawa Timur 63211'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{settings?.waNumber || '0812-3456-7890'} (WhatsApp Pemesanan)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{settings?.footerHours || 'Buka Setiap Hari: 06:00 - 18:00 WIB'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                <span>{settings?.footerEmail || 'haylofress.ngawi@gmail.com'}</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-3 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2">
              Menu Navigasi
            </h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs sm:text-sm text-slate-400">
              <li>
                <a href="#id-hero" className="hover:text-emerald-400 transition">Beranda</a>
              </li>
              <li>
                <a href="#id-problem" className="hover:text-emerald-400 transition">Mengapa Kami</a>
              </li>
              <li>
                <a href="#id-keunggulan" className="hover:text-emerald-400 transition">Keunggulan</a>
              </li>
              <li>
                <a href="#id-profil" className="hover:text-emerald-400 transition">Mitra Kami</a>
              </li>
              <li>
                <a href="#id-katalog" className="hover:text-emerald-400 transition">Katalog</a>
              </li>
              <li>
                <a href="#id-testimoni" className="hover:text-emerald-400 transition">Testimoni</a>
              </li>
              <li>
                <a href="#id-kontak" className="hover:text-emerald-400 transition">Kontak Lokasi</a>
              </li>
              <li>
                <a
                  href={`https://wa.me/${waNum}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20tertarik%20tanya%20harga%20grosir%20untuk%20agen.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition"
                >
                  Daftar Reseller
                </a>
              </li>
            </ul>

            {/* Quality Seal */}
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-800/80 space-y-2 pt-3">
              <span className="text-[11px] font-extrabold uppercase text-amber-500 flex items-center gap-1">
                🛡️ JAMINAN LAYANAN COLD STORAGE:
              </span>
              <p className="text-[10px] text-slate-400 leading-normal">
                Jika kualitas daging yang diterima tidak fresh akibat kelalaian kurir, hubungi kami dalam 1x24 jam untuk klaim retur atau pergantian baru!
              </p>
            </div>
          </div>

          {/* Google Maps Iframe Location Column */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Lokasi Fisik Ngawi</span>
            </h3>

            {/* MAP IFRAME CONTAINER */}
            <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-800 shadow-inner relative">
              <iframe
                title="Google Maps Haylofress Ngawi"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3957.5147854651336!2d111.45063071534346!3d-7.408107874052026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e79920b7878d227%3A0xe54d9136e053fed!2sKetanggi%2C%20Ngawi%2C%20Ngawi%20Regency%2C%20East%20Java!5e0!3m2!1sen!2sid!4v1625000000000!5m2!1sen!2sid"
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

        </div>

        {/* Bottom credits & Copyright bar */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Haylofress Ngawi. Hak Cipta Dilindungi Undang-Undang.</p>
          <div className="flex gap-4">
            <span className="hover:text-white transition">Halal Indonesia Certified</span>
            <span>•</span>
            <span className="hover:text-white transition">HACCP Approved Frozen Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

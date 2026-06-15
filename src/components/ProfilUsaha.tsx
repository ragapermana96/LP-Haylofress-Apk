import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface ProfilUsahaProps {
  settings: any;
}

export default function ProfilUsaha({ settings }: ProfilUsahaProps) {
  const imageLeft = settings?.profilImageLeft || 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400';
  const imageRight = settings?.profilImageRight || 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400';

  return (
    <section id="id-profil" className="py-20 bg-gradient-to-b from-white to-[#f0f9ff] relative overflow-hidden border-t border-slate-200">
      {/* Subtle details */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-emerald-100/20 rounded-full blur-3xl pointer-events-none -translate-x-12"></div>
      <div className="absolute top-12 right-12 w-80 h-80 bg-blue-100/20 rounded-full blur-[110px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Mockup / Trust Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4 relative">
            <div className="space-y-4">
              <div className="rounded-[2rem] overflow-hidden shadow-md aspect-[4/5] border-4 border-white/60">
                <img
                  src={imageLeft}
                  alt="Ayam Segar Sehat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="bg-emerald-600 text-white p-6 rounded-[2rem] space-y-2 shadow-lg">
                <span className="text-xl font-extrabold block">100%</span>
                <span className="text-xs font-semibold uppercase tracking-wider block">Penyembelihan Halal</span>
                <p className="text-[11px] text-emerald-100 leading-normal">
                  Sesuai prinsip syariat Islam demi rasa kenyang, aman, & ketentraman rohani.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <div className="bg-white/40 backdrop-blur-xl border border-white/60 text-slate-800 p-6 rounded-[2rem] space-y-2 shadow-md">
                <span className="text-xl font-black text-emerald-700 block">Puluhan</span>
                <span className="text-xs font-bold uppercase tracking-wider block text-slate-700">Pengikut & Pelanggan Aktif</span>
                <p className="text-[11px] text-slate-600 leading-normal">
                  Ibu rumah tangga, pengusaha warung, mie ayam, katering hajatan di Ngawi.
                </p>
              </div>
              <div className="rounded-[2rem] overflow-hidden shadow-md aspect-[4/5] border-4 border-white/60">
                <img
                  src={imageRight}
                  alt="Sayuran Beku"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
              — SAHABAT DAPUR ANDALAN —
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-tight">
              {settings?.profilTitle || "Haylofress Ngawi: Sahabat Sehat Keluarga & Mitra Sukses Bisnis Anda"}
            </h2>
            
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {settings?.profilDescription || (
                <>Berawal dari sebuah komitmen sederhana untuk menghadirkan kemudahan menyajikan makanan segar bergizi tinggi di Kabupaten Ngawi, <strong className="font-semibold text-slate-800">Haylofress Ngawi</strong> tumbuh menjadi mitra andalan harian ribuan dapur sehat.</>
              )}
            </p>

            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {settings?.profilDescriptionSec || (
                <>Kami sangat mengerti bahwa waktu harian Anda teramat berharga. Baik Anda seorang Ibu Rumah Tangga yang berdedikasi menjaga pertumbuhan putra-putri tercinta, pemilik warung mie ayam/katering yang memerlukan pasokan stabil berbiaya efisien, maupun pebisnis <strong className="text-emerald-750 font-semibold text-emerald-700">Reseller</strong> mandiri—kami mengambil alih seluruh tugas merepotkan pembersihan bahan memasak untuk Anda.</>
              )}
            </p>

            {/* Core Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex gap-3 items-center bg-white/40 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-sm block">100% Halal</span>
                  <span className="text-[11px] text-slate-500">Prinsip syar'i</span>
                </div>
              </div>

              <div className="flex gap-3 items-center bg-white/40 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-sm block">Garansi Fresh</span>
                  <span className="text-[11px] text-slate-500">Tanpa pengawet</span>
                </div>
              </div>

              <div className="flex gap-3 items-center bg-white/40 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
                <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl shrink-0">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-sm block">Hemat Pasti</span>
                  <span className="text-[11px] text-slate-500">Skema grosir</span>
                </div>
              </div>
            </div>

            <div className="pt-4 text-emerald-800 text-sm font-medium flex items-center gap-2">
              <span>★ Siap memberikan pelayanan terbaik, tercepat, dan penuh senyum untuk Anda!</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

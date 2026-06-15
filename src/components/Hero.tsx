import { CircleCheck, Sparkles, ShoppingBag, Users, ShieldCheck } from 'lucide-react';

interface HeroProps {
  settings: any;
}

export default function Hero({ settings }: HeroProps) {
  const waNum = settings?.waNumber || '6281234567890';
  const heroImgUrl = settings?.heroImageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=700';

  return (
    <section
      id="id-hero"
      className="relative bg-[#f0f9ff] pt-12 pb-20 md:py-24 overflow-hidden"
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute top-10 right-[-100px] w-96 h-96 bg-emerald-300 rounded-full blur-[100px] opacity-35 pointer-events-none"></div>
      <div className="absolute bottom-10 left-[-100px] w-96 h-96 bg-blue-300 rounded-full blur-[100px] opacity-30 pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Left Content Column */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-7">
            
            {/* Tagline / Small trust badge */}
            <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md uppercase tracking-wider">
              100% HALAL & HIGIENIS • GARANSI SEGAR
            </span>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-black text-slate-800 tracking-tight leading-tight">
              {settings?.heroTitle || (
                <>Daging Segar & <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Siap Olah</span> Langsung Ke Dapur Anda.</>
              )}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {settings?.heroSubtitle || (
                <>Kini masak enak jauh lebih praktis dan hemat! <strong className="font-bold text-slate-800">Haylofress Ngawi</strong> menyediakan ayam segar, daging sapi, fillet dori, dan sayuran higienis, bersih siap olah, dikemas khusus agar kesegaran terkunci sempurna hingga ke dapur Anda.</>
              )}
            </p>

            {/* Key Advantages Bullet Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg mx-auto lg:mx-0 text-left pt-2">
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/50 shadow-sm">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 font-bold">✓</div>
                <span className="text-xs sm:text-sm">
                  Ceker bersih tanpa kuku, siap cemplung
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/50 shadow-sm">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 font-bold">✓</div>
                <span className="text-xs sm:text-sm">
                  Kemasan vacuum pack food grade
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/50 shadow-sm">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 font-bold">✓</div>
                <span className="text-xs sm:text-sm">
                  Harga grosir untuk UMKM & Reseller
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white/40 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/50 shadow-sm">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] shrink-0 font-bold">✓</div>
                <span className="text-xs sm:text-sm">
                  Kirim area Ngawi & sekitarnya
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <a
                href="#id-katalog"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-xl shadow-emerald-200 hover:scale-105 transition"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>PESAN SEKARANG</span>
              </a>
              <a
                href={`https://wa.me/${waNum}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20tertarik%20bertanya%20mengenai%20peluang%20kemitraan%20Reseller%20atau%20Agen.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-emerald-100 text-emerald-700 font-bold text-base px-8 py-4 rounded-2xl shadow-md hover:bg-emerald-50 transition"
              >
                <Users className="w-5 h-5 text-emerald-600" />
                <span>DAFTAR RESELLER</span>
              </a>
            </div>

            {/* Social Proof / Trust Indicators */}
            <div className="pt-6 border-t border-slate-200/60 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-500 font-medium font-sans">
              <span className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/40">
                <Sparkles className="w-4 h-4 text-amber-500" /> Dipercaya oleh banyak dapur, ibu rumah tangga, dan pelaku UMKM di wilayah Ngawi
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                ● Layanan Same-day Delivery Siap Antar
              </span>
            </div>
          </div>

          {/* Hero Right Column - High converting illustrative mockup */}
          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2.5rem] p-6 shadow-xl w-full max-w-[420px]">
              <div className="relative aspect-square rounded-[1.8rem] bg-gradient-to-tr from-emerald-600 to-amber-500 p-1 shadow-2xl overflow-hidden">
                <img
                  src={heroImgUrl}
                  alt="Haylofress Frozen Food Ngawi"
                  className="w-full h-full object-cover rounded-[1.6rem] filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Float Badge 1 */}
                <div className="absolute -top-1 -left-1 bg-amber-500 text-white px-4 py-2 rounded-2xl shadow-lg font-bold text-xs animate-bounce z-25">
                  🔥 TERENAK & TERLARIS
                </div>

                {/* Bottom Tag */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100 text-emerald-700 p-2 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">Garansi Fresh Air-Lock</h3>
                      <p className="text-[11px] text-slate-600">Aman disimpan lama dan gizi tetap terkunci.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

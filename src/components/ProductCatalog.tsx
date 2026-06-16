import React, { useState } from 'react';
import { Search, Sparkles, AlertCircle, Gift, Check, ShoppingBag } from 'lucide-react';
import { Category, Product, DynamicCategory, Bundle } from '../types';
import ProductCard from './ProductCard';

interface ProductCatalogProps {
  onAddToCart: (product: Product, quantity: number) => void;
  products: Product[];
  categories: DynamicCategory[];
  bundles?: Bundle[];
  settings: any;
}

export default function ProductCatalog({ onAddToCart, products, categories, bundles = [], settings }: ProductCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('semua');
  const [searchQuery, setSearchQuery] = useState('');

  const catalogLayout = settings?.catalogLayout || 'tabs'; // 'tabs' | 'sections'
  const catalogColumns = settings?.catalogColumns || '4'; // '3' | '4'

  // Map category display names
  const productsWithNames = products.map((prod) => {
    const parentCat = categories.find((c) => c.id === prod.category);
    return {
      ...prod,
      categoryName: parentCat ? parentCat.name : prod.category,
    };
  });

  // Calculate dynamic options for filters
  const filterTabs = [
    { id: 'semua', name: '🔥 Semua Produk' },
    ...categories,
  ];

  // Filtering Logic (for tab layout)
  const filteredProducts = productsWithNames.filter((product) => {
    // Only display visible products to customer
    if (product.visible === false) return false;

    const matchesCategory = selectedCategory === 'semua' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const columnClasses = catalogColumns === '3'
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';

  // Count products across sections to determine if there is search result
  const totalSectionProductsCount = categories.reduce((sum, cat) => {
    const count = productsWithNames.filter((prod) => {
      if (prod.visible === false) return false;
      if (prod.category !== cat.id) return false;
      const matchesSearch =
        prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prod.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    }).length;
    return sum + count;
  }, 0);

  // Render individual sections for sections layout
  const renderSectionsLayout = () => {
    return (
      <div className="space-y-12">
        {categories.map((cat) => {
          const sectionProducts = productsWithNames.filter((prod) => {
            if (prod.visible === false) return false;
            if (prod.category !== cat.id) return false;
            
            const matchesSearch =
              prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              prod.description.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesSearch;
          });

          if (sectionProducts.length === 0) return null;

          return (
            <div key={cat.id} className="space-y-6 pt-8 border-t border-slate-100 first:border-t-0" id={`cat-sec-${cat.id}`}>
              <div className="flex items-center gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  {cat.name}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-mono">
                  {sectionProducts.length} Produk
                </span>
              </div>
              <div className={columnClasses}>
                {sectionProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section id="id-katalog" className="py-20 bg-gradient-to-b from-[#f0f9ff] to-white relative overflow-hidden border-t border-slate-200">
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-blue-200/20 rounded-full blur-[115px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-0 w-80 h-80 bg-emerald-200/20 rounded-full blur-[115px] pointer-events-none"></div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <span className="text-emerald-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
            — KATALOG PRODUK PILIHAN —
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800 leading-tight">
            Pesan Praktis Hanya Dari Ujung Jari
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Pilih bahan pangan higienis bernutrisi tinggi pilihan Anda di bawah ini. Gabungkan eceran & harga grosir (otomatis aktif eceran beralih ke grosir jika memesan minimal 5 Kg per item)!
          </p>
        </div>

        {/* Promo Bundling Section */}
        {bundles.filter(b => b.visible !== false).length > 0 && (
          <div className="mb-16 max-w-6xl mx-auto space-y-8" id="promo-bundling-section">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-rose-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-rose-500 to-amber-500 p-2.5 rounded-2xl text-white shadow-lg animate-pulse">
                  <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    🎁 Promo Bundling Hemat
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                      Terbatas
                    </span>
                  </h3>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Kombinasi bahan pangan sehat, satu harga lebih hemat & praktis!
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                🚀 Ditambahkan Langsung sebagai Paket
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {bundles
                .filter((b) => b.visible !== false)
                .map((bundle) => {
                  const saveAmount = bundle.originalPrice - bundle.promoPrice;
                  const discountPercent = Math.round((saveAmount / bundle.originalPrice) * 100);

                  return (
                    <div
                      key={bundle.id}
                      className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1"
                    >
                      {/* Image header with discount ribbon */}
                      <div className="h-48 sm:h-52 relative overflow-hidden bg-slate-100 shrink-0">
                        {bundle.imageUrl ? (
                          <img
                            src={bundle.imageUrl}
                            alt={bundle.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <Gift className="w-12 h-12 text-slate-400" />
                          </div>
                        )}
                        <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-rose-600 to-amber-500 text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg">
                          Hemat Rp {saveAmount.toLocaleString('id-ID')}
                        </div>
                        <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-amber-300 text-[10px] font-black px-2.5 py-1.5 rounded-lg border border-white/20">
                          {discountPercent}% OFF
                        </div>
                      </div>

                      {/* Info & Items Content */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-lg leading-snug group-hover:text-emerald-700 transition">
                              {bundle.title}
                            </h4>
                            <p className="text-slate-500 text-[11px] leading-relaxed mt-1">
                              {bundle.description}
                            </p>
                          </div>

                          {/* Items Checklist inside bundle */}
                          <div className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-50/50 via-amber-50/20 to-transparent border border-amber-100/50 rounded-2xl p-4.5 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 block">
                              📦 Isi Paket Bundling:
                            </span>
                            <div className="space-y-1.5 text-xs text-slate-700">
                              {bundle.items.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                  <span className="leading-tight font-medium">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Price footer and button */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-end">
                            <div>
                              <span className="text-slate-400 line-through text-xs block">
                                Rp {bundle.originalPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="text-2xl font-black text-rose-600 tracking-tight block">
                                Rp {bundle.promoPrice.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                              per 1 Paket
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              const bundleProduct: Product = {
                                id: bundle.id,
                                name: bundle.title,
                                category: 'bundling',
                                unit: 'Paket',
                                priceNormal: bundle.originalPrice,
                                priceDiscount: bundle.promoPrice,
                                priceGrosir1: bundle.promoPrice,
                                priceGrosir2: bundle.promoPrice,
                                priceGrosir3: bundle.promoPrice,
                                imageUrl: bundle.imageUrl,
                                description: bundle.description,
                                visible: bundle.visible,
                                order: bundle.order || 0,
                                isBundle: true,
                              };
                              onAddToCart(bundleProduct, 1);
                            }}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-4 px-6 rounded-2xl transition shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-350 focus:outline-none flex items-center justify-center gap-2 group-hover:scale-102 cursor-pointer active:scale-98"
                          >
                            <ShoppingBag className="w-4 h-4 text-white" />
                            <span>Pesan Paket Bundling</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filter Controls Bar (Search + Tabs) */}
        <div className="space-y-6 max-w-5xl mx-auto mb-12">
          {/* Search bar inside container */}
          <div className="relative max-w-xl mx-auto bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/60 shadow-lg flex items-center">
            <Search className="w-5 h-5 text-slate-500 ml-3 shrink-0" />
            <input
              type="text"
              placeholder="Cari bagian daging ayam, sapi, fillet dori, kentang wedges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none text-slate-800 text-sm py-2 px-3 focus:outline-none placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold mr-2 shrink-0 bg-rose-50 px-2 py-1 rounded-md"
              >
                Reset
              </button>
            )}
          </div>

          {/* Categories Tab Pill slider (Only rendering in Tabs layout mode) */}
          {catalogLayout === 'tabs' && (
            <div className="flex justify-start md:justify-center items-center gap-2 overflow-x-auto pb-3 pt-1 no-scrollbar select-none">
              {filterTabs.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`py-2.5 px-5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-300 focus:outline-none ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-250 transform scale-102'
                      : 'bg-white/40 backdrop-blur-md border border-white/50 text-slate-700 hover:bg-white/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info promo wholesale notice */}
        <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-xl border border-emerald-200/60 p-5 rounded-3xl mb-12 flex gap-4 text-emerald-950 text-xs sm:text-sm leading-relaxed items-start shadow-xl">
          <Sparkles className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <strong className="font-extrabold text-emerald-900 block mb-0.5">💡 Cara Dapatkan Harga Grosir Terbaik:</strong>
            Atur kuantitas item dalam ranjang belanja Anda hingga <strong className="font-bold underline text-emerald-800">5 Kg</strong> atau lebih untuk memicu pemotongan harga otomatis. Sangat efisien bagi keluarga besar, arisan, reseller, maupun warung makan/catering!
          </div>
        </div>

        {/* Results Counter / Grid Rendering */}
        {catalogLayout === 'tabs' ? (
          filteredProducts.length > 0 ? (
            <div className={columnClasses}>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-100 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Produk Tidak Ditemukan</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Maaf, kata kunci atau filter produk "<span className="font-semibold text-emerald-700">{searchQuery}</span>" tidak sesuai dengan produk terdaftar kami. Cobalah kata kunci lainnya!
              </p>
            </div>
          )
        ) : (
          /* Sections Layout */
          totalSectionProductsCount > 0 ? (
            renderSectionsLayout()
          ) : (
            <div className="bg-slate-50 rounded-3xl p-12 text-center max-w-md mx-auto border border-slate-100 space-y-3">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Produk Tidak Ditemukan</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                Maaf, pencarian produk "<span className="font-semibold text-emerald-700">{searchQuery}</span>" tidak ditemukan di kategori mana pun.
              </p>
            </div>
          )
        )}

      </div>
    </section>
  );
}

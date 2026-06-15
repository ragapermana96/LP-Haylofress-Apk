import { useState, useEffect } from 'react';
import { ShoppingBag, ArrowUpRight, HelpCircle, Sparkles, Phone } from 'lucide-react';
import Header from './components/Header';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import Keunggulan from './components/Keunggulan';
import ProfilUsaha from './components/ProfilUsaha';
import ProductCatalog from './components/ProductCatalog';
import Testimonials from './components/Testimonials';
import CartDrawer from './components/CartDrawer';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import { CartItem, Product, DynamicCategory } from './types';
import { PRODUCTS } from './data/products';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';
import { initializeMetaPixel, trackPixelEvent } from './lib/pixel';

const DEFAULT_CATEGORIES: DynamicCategory[] = [
  { id: 'ayam', name: '🍗 Daging Ayam', order: 1 },
  { id: 'sapi', name: '🥩 Daging Sapi', order: 2 },
  { id: 'ikan', name: '🐟 Ikan & Seafood', order: 3 },
  { id: 'sayuran', name: '🥦 Sayuran Frozen', order: 4 },
];

const defaultSettings = {
  waNumber: '6281234567890',
  metaPixelId: '2285655152241198',
  heroTitle: '',
  heroSubtitle: '',
  heroImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=700',
  profilTitle: 'Haylofress Ngawi: Sahabat Sehat Keluarga & Mitra Sukses Bisnis Anda',
  profilDescription: 'Berawal dari sebuah komitmen sederhana untuk menghadirkan kemudahan menyajikan makanan segar bergizi tinggi di Kabupaten Ngawi, Haylofress Ngawi tumbuh menjadi mitra andalan harian ribuan dapur sehat.',
  profilDescriptionSec: 'Kami sangat mengerti bahwa waktu harian Anda teramat berharga. Baik Anda seorang Ibu Rumah Tangga yang berdedikasi menjaga pertumbuhan putra-putri tercinta, pemilik warung mie ayam/katering yang memerlukan pasokan stabil berbiaya efisien, maupun pebisnis Reseller mandiri—kami mengambil alih seluruh tugas merepotkan pembersihan bahan memasak untuk Anda.',
  profilImageLeft: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400',
  profilImageRight: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400',
  problemTitle: 'Sering Mengalami Kendala Ini Saat Menyiapkan Sajian Makanan?',
  problemSubtitle: 'Menyiapkan masakan bergizi tidak seharusnya menyiksa fisik dan memakan waktu berharga Anda. Mari bandingkan keruwetan dapur lama vs kepraktisan era baru.',
  solutionTitle: 'Keribetan Tradisional & Dapur Lama',
  solutionSubtitle: 'Solusi Instan Haylofress Ngawi'
};

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic products & settings
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<DynamicCategory[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      // 1. Fetch settings from Firestore
      const settingsRef = doc(db, 'settings', 'global');
      const settingsSnap = await getDoc(settingsRef);
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data());
      } else {
        setSettings(defaultSettings);
        // Only attempt to seed if signed-in as Admin to avoid Permission Denied crashes on launch
        if (auth.currentUser) {
          try {
            await setDoc(settingsRef, defaultSettings);
          } catch (e) {
            console.warn("Failed to seed default settings (minor):", e);
          }
        }
      }

      // 1.5 Fetch categories from Firestore
      const categoriesCol = collection(db, 'categories');
      const categoriesSnap = await getDocs(categoriesCol);
      if (!categoriesSnap.empty) {
        const loadedCategories: DynamicCategory[] = [];
        categoriesSnap.forEach((doc) => {
          loadedCategories.push({ id: doc.id, ...doc.data() } as DynamicCategory);
        });
        loadedCategories.sort((a, b) => (a.order || 0) - (b.order || 0));
        setCategories(loadedCategories);
      } else {
        setCategories(DEFAULT_CATEGORIES);
        if (auth.currentUser) {
          try {
            for (const cat of DEFAULT_CATEGORIES) {
              await setDoc(doc(db, 'categories', cat.id), cat);
            }
          } catch (e) {
            console.warn("Failed to seed default categories:", e);
          }
        }
      }

      // 2. Fetch products from Firestore
      const productsCol = collection(db, 'products');
      const productsSnap = await getDocs(productsCol);
      if (!productsSnap.empty) {
        const loadedProducts: Product[] = [];
        productsSnap.forEach((doc) => {
          loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
        });

        // Local dynamic upgrade of stale/unsplash images & merge missing standard items
        let hasChanges = false;
        const upgradedProducts = [...loadedProducts];

        const loadedIds = new Set(loadedProducts.map(p => p.id));
        const missingProducts = PRODUCTS.filter(p => !loadedIds.has(p.id));
        if (missingProducts.length > 0) {
          upgradedProducts.push(...missingProducts);
          hasChanges = true;
        }

        // Sort products by position/order, then alphabetically by name
        upgradedProducts.sort((a, b) => {
          const orderA = typeof a.order === 'number' ? a.order : 9999;
          const orderB = typeof b.order === 'number' ? b.order : 9999;
          if (orderA !== orderB) return orderA - orderB;
          return a.name.localeCompare(b.name);
        });
        setProducts(upgradedProducts);

        // Background Cloud DB sync if signed in as Admin
        if (hasChanges && auth.currentUser) {
          const normEmail = auth.currentUser.email?.toLowerCase() || '';
          const isUserAdmin = normEmail === 'ragapermana96@gmail.com' || normEmail.includes('admin');
          if (isUserAdmin) {
            (async () => {
              try {
                for (const p of missingProducts) {
                  await setDoc(doc(db, 'products', p.id), p);
                }
                console.log("Background cloud database synchronization completed successfully");
              } catch (se) {
                console.warn("Background cloud database sync skipped or denied:", se);
              }
            })();
          }
        }
      } else {
        setProducts(PRODUCTS);
        // Only attempt to seed if signed-in, otherwise let it fall back
        if (auth.currentUser) {
          try {
            for (const prod of PRODUCTS) {
              const prodDocRef = doc(db, 'products', prod.id);
              await setDoc(prodDocRef, prod);
            }
            // After successful seed loop, retrieve verified documents to sync React state
            const freshSnap = await getDocs(productsCol);
            const loadedProducts: Product[] = [];
            freshSnap.forEach((doc) => {
              loadedProducts.push({ id: doc.id, ...doc.data() } as Product);
            });
            if (loadedProducts.length > 0) {
              loadedProducts.sort((a, b) => {
                const orderA = typeof a.order === 'number' ? a.order : 9999;
                const orderB = typeof b.order === 'number' ? b.order : 9999;
                if (orderA !== orderB) return orderA - orderB;
                return a.name.localeCompare(b.name);
              });
              setProducts(loadedProducts);
              console.log("Newly seeded products loaded successfully from Firestore in App.tsx");
            }
          } catch (e) {
            console.warn("Failed to seed products (minor):", e);
          }
        }
      }
    } catch (err) {
      console.warn("Firestore error, loading static fallbacks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth state changes so we reload when admin logs in/out
    const unsub = auth.onAuthStateChanged(async (user) => {
      console.log("Auth state resolved in App.tsx:", user?.email);
      if (user) {
        const isMaster = user.email === 'ragapermana96@gmail.com';
        const isSomeAdmin = user.email?.toLowerCase().includes('admin');
        if (isMaster || isSomeAdmin) {
          try {
            const adminDocRef = doc(db, 'admins', user.uid);
            await setDoc(adminDocRef, {
              email: user.email,
              lastLogin: new Date().toISOString(),
              role: isMaster ? 'master' : 'admin',
              createdAt: new Date().toISOString()
            }, { merge: true });
            console.log("Admin auto-provisioned successfully in App.tsx");
          } catch (e) {
            console.warn("Auto-provisioning admin doc failed (minor):", e);
          }
        }
      }
      loadData();
    });
    return unsub;
  }, []);

  // Initialize Facebook Meta Pixel dynamically on load/settings update
  useEffect(() => {
    if (settings?.metaPixelId) {
      initializeMetaPixel(settings.metaPixelId);
      // Log PageView to Meta Pixel and our Customer Analytics Firestore DB
      trackPixelEvent('PageView');
    } else {
      // Still log PageView to our analytics DB even if Meta Pixel ID is not configured yet
      trackPixelEvent('PageView');
    }
  }, [settings?.metaPixelId]);

  // Cart operations
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });

    // Track Add-To-Cart event for Meta Pixel
    trackPixelEvent('AddToCart', {
      content_name: product.name,
      content_category: product.category,
      content_ids: [product.id],
      content_type: 'product',
      value: product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal,
      currency: 'IDR',
      quantity: quantity
    });

    // Run custom toast feedback
    setToastMessage(`✓ Berhasil menambahkan ${quantity} ${product.unit} ${product.name} ke keranjang!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <div className="bg-white text-slate-800 font-sans min-h-screen flex flex-col justify-between selection:bg-emerald-600 selection:text-white relative">
      
      {/* 1. Header Navigation Bar */}
      <Header 
        cart={cart} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenAdmin={() => setIsAdminOpen(true)}
        settings={settings}
      />

      {/* 2. Interactive Toast Feedback Box */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 max-w-sm bg-slate-900 text-white py-3.5 px-5 rounded-2xl shadow-2xl border border-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-between gap-4 animate-slide-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 underline shrink-0 flex items-center gap-0.5"
          >
            <span>Lihat</span>
            <ArrowUpRight className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* 3. Main Sections */}
      <main className="flex-1">
        {/* Banner Quick Informative Alert */}
        <div className="bg-amber-100/50 border-b border-amber-200 py-3 px-4 text-center text-xs md:text-sm font-medium text-amber-900">
          📍 Melayani Pengiriman Segar & Beku langsung ke rumah & tempat usaha Anda di seluruh wilayah <strong className="font-extrabold text-amber-950">Karesidenan Madiun!</strong>
        </div>

        <Hero settings={settings} />
        <ProblemSolution settings={settings} />
        <Keunggulan settings={settings} />
        <ProfilUsaha settings={settings} />
        <ProductCatalog onAddToCart={handleAddToCart} products={products} categories={categories} settings={settings} />
        <Testimonials />

        {/* Closing conversion CTA banner */}
        <section className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white py-16 md:py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
          <div className="container mx-auto px-4 max-w-3xl space-y-6 relative z-10">
            <span className="text-amber-300 text-xs sm:text-sm font-extrabold uppercase tracking-widest block font-mono">
              — SIAP UNTUK HIDANGAN SEHAT? —
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Sajikan Bahan Makanan Higienis Untuk Dapur Keluarga Sekarang!
            </h2>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
              Hemat tenaga Anda, lewati macetnya pasar tradisional, dan nikmati kepraktisan masak bersama Haylofress Ngawi. Dapatkan harga grosir otomatis untuk agen, warung, & reseller.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <a
                href="#id-katalog"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-base px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/20 transition-all duration-300 transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Pesan Sekarang Melalui Katalog</span>
              </a>
              <a
                href={`https://wa.me/${settings?.waNumber || '6281234567890'}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20tertarik%20tanya-tanya%20syarat%20kemitraan%20reseller%20frozen%20food.`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-transparent hover:bg-white/10 border border-white/30 text-white font-bold text-base px-8 py-4 rounded-2xl transition duration-300 inline-flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                <span>Hubungi Admin Kemitraan</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 4. Sliding Interactive Cart Drawer Screen */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        settings={settings}
      />

      {/* 5. Custom Dynamic Admin Settings Control Panel Drawer */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={loadData}
        currentSettings={settings || defaultSettings}
        currentProducts={products}
        currentCategories={categories}
      />

      {/* 6. Footer and Maps Section */}
      <Footer settings={settings} />

      {/* 7. Floating Pulsing WhatsApp Quick Chat Button */}
      <a
        href={`https://wa.me/${settings?.waNumber || '6281234567890'}?text=Halo%20Haylofress%20Ngawi%2C%20saya%20ingin%20bertanya%20mengenai%20produk%20di%20katalog.`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackPixelEvent('Contact', { type: 'floating_wa_button' })}
        className="fixed bottom-6 right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 sm:p-4 rounded-full shadow-2.5xl flex items-center justify-center transition-all duration-300 hover:scale-108 active:scale-95 group"
        aria-label="Hubungi WhatsApp Admin"
      >
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out whitespace-nowrap text-xs font-black font-sans pr-0 group-hover:pr-2 block">
          Chat Admin
        </span>
        <Phone className="w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0" />
      </a>
    </div>
  );
}

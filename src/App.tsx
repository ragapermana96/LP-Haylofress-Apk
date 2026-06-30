import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowUpRight, HelpCircle, Sparkles, Phone, User, Users, Home, Store, Check, MapPin, X } from 'lucide-react';
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
import { CartItem, Product, DynamicCategory, Bundle, CustomerInfo, getProductPriceDetail } from './types';
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

const DEFAULT_BUNDLES: Bundle[] = [
  {
    id: 'bundle_sop',
    title: 'Paket Sop Ayam Spesial',
    description: 'Satu paket komplit praktis untuk 4-6 porsi sop ayam lezat bergizi tinggi tanpa repot mengupas!',
    originalPrice: 38000,
    promoPrice: 32500,
    imageUrl: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&q=80&w=400',
    items: ['Daging Fillet Dada Ayam 500g', 'Buncis Kupas Segar 200g', 'Wortel Potong Segar 200g', 'Bumbu Sop Instan Racik'],
    visible: true,
    order: 1
  },
  {
    id: 'bundle_bakso',
    title: 'Paket Bakso Kuah Hangat',
    description: 'Sajian bakso sapi hangat praktis kualitas restoran. Cukup rebus 10 menit, siap saji!',
    originalPrice: 52000,
    promoPrice: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1598515214211-89d3e73ae83b?auto=format&fit=crop&q=80&w=400',
    items: ['Bakso Sapi Premium 1 Pack (25 pcs)', 'Bumbu Kuah Bakso Racik', 'Bawang Goreng Gurih Segar', 'Sambal Cabai Asli 50g'],
    visible: true,
    order: 2
  },
  {
    id: 'bundle_sayur',
    title: 'Paket Tumis Sayur Sehat',
    description: 'Pilihan sayuran segar higienis siap masak untuk mencukupi kebutuhan gizi harian.',
    originalPrice: 30000,
    promoPrice: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=400',
    items: ['Brokoli Frozen Sehat 250g', 'Jagung Manis Pipil 250g', 'Kol & Sawi Bersih Potong 200g'],
    visible: true,
    order: 3
  }
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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    const cached = localStorage.getItem('haylofress_customer_info');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    return {
      name: '',
      phone: '',
      address: '',
      notes: '',
      buyerType: 'rumah_tangga',
      mapsLink: '',
    };
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('haylofress_cart');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isIdentityModalOpen, setIsIdentityModalOpen] = useState(false);
  const [pendingAddToCart, setPendingAddToCart] = useState<{ product: Product; quantity: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('haylofress_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem('haylofress_cart', JSON.stringify(cart));
  }, [cart]);

  const [modalName, setModalName] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalBuyerType, setModalBuyerType] = useState<'rumah_tangga' | 'umkm' | 'reseller'>('rumah_tangga');
  const [modalError, setModalError] = useState('');

  // Sync modal states whenever customerInfo is loaded or modal is opened
  useEffect(() => {
    if (customerInfo.name) setModalName(customerInfo.name);
    if (customerInfo.phone) setModalPhone(customerInfo.phone);
    if (customerInfo.buyerType) setModalBuyerType(customerInfo.buyerType);
  }, [customerInfo, isIdentityModalOpen]);

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim()) {
      setModalError('Mohon isi nama lengkap Anda.');
      return;
    }
    if (!modalPhone.trim()) {
      setModalError('Mohon isi nomor WhatsApp Anda.');
      return;
    }

    const updatedInfo = {
      ...customerInfo,
      name: modalName.trim(),
      phone: modalPhone.trim(),
      buyerType: modalBuyerType,
    };

    setCustomerInfo(updatedInfo);
    setIsIdentityModalOpen(false);
    setModalError('');

    // Trigger CartUpdate with new details so existing items in cart are retroactively tagged
    if (cart.length > 0) {
      trackPixelEvent('CartUpdate', {
        customer_name: updatedInfo.name,
        customer_phone: updatedInfo.phone,
        buyer_type: updatedInfo.buyerType,
        cart_items: cart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.priceDiscount > 0 ? item.product.priceDiscount : item.product.priceNormal
        }))
      });
    }

    // Playback pending add to cart action if any
    if (pendingAddToCart) {
      const { product, quantity } = pendingAddToCart;
      setPendingAddToCart(null);
      
      // We must explicitly trigger handleAddToCart WITH the updated name
      setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.product.id === product.id);
        let newCart;
        if (existingItem) {
          newCart = prevCart.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newCart = [...prevCart, { product, quantity }];
        }

        const itemPrice = product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal;
        trackPixelEvent('AddToCart', {
          content_name: product.name,
          content_category: product.category,
          content_ids: [product.id],
          content_type: 'product',
          value: itemPrice * quantity,
          currency: 'IDR',
          quantity: quantity,
          customer_name: updatedInfo.name,
          customer_phone: updatedInfo.phone,
          buyer_type: updatedInfo.buyerType,
          cart_items: newCart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.priceDiscount > 0 ? item.product.priceDiscount : item.product.priceNormal
          }))
        });

        return newCart;
      });

      // Run custom toast feedback
      setToastMessage(`✓ Berhasil menambahkan ${quantity} ${product.unit} ${product.name} ke keranjang!`);
      setTimeout(() => {
        setToastMessage(null);
      }, 4500);
    }
  };

  // Dynamic products & settings
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<DynamicCategory[]>(DEFAULT_CATEGORIES);
  const [bundles, setBundles] = useState<Bundle[]>(DEFAULT_BUNDLES);
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

      // 1.2 Fetch bundles from Firestore
      const bundlesCol = collection(db, 'bundles');
      const bundlesSnap = await getDocs(bundlesCol);
      if (!bundlesSnap.empty) {
        const loadedBundles: Bundle[] = [];
        bundlesSnap.forEach((doc) => {
          loadedBundles.push({ id: doc.id, ...doc.data() } as Bundle);
        });
        loadedBundles.sort((a, b) => (a.order || 0) - (b.order || 0));
        setBundles(loadedBundles);
      } else {
        setBundles(DEFAULT_BUNDLES);
        if (auth.currentUser) {
          try {
            for (const bundle of DEFAULT_BUNDLES) {
              await setDoc(doc(db, 'bundles', bundle.id), bundle);
            }
          } catch (e) {
            console.warn("Failed to seed default bundles:", e);
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
    // If name is not set yet, ask them to identify first so we can track who adds products!
    if (!customerInfo.name.trim()) {
      setPendingAddToCart({ product, quantity });
      setIsIdentityModalOpen(true);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        newCart = [...prevCart, { product, quantity }];
      }

      // Track Add-To-Cart event for Meta Pixel and Firestore admin view (with customer info!)
      const itemPrice = product.priceDiscount > 0 ? product.priceDiscount : product.priceNormal;
      trackPixelEvent('AddToCart', {
        content_name: product.name,
        content_category: product.category,
        content_ids: [product.id],
        content_type: 'product',
        value: itemPrice * quantity,
        currency: 'IDR',
        quantity: quantity,
        // Enriched Customer Metadata
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone || '-',
        buyer_type: customerInfo.buyerType,
        cart_items: newCart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.priceDiscount > 0 ? item.product.priceDiscount : item.product.priceNormal
        }))
      });

      return newCart;
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
    setCart((prevCart) => {
      const newCart = prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );

      // Log cart update
      if (customerInfo.name) {
        trackPixelEvent('CartUpdate', {
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone || '-',
          buyer_type: customerInfo.buyerType,
          cart_items: newCart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.priceDiscount > 0 ? item.product.priceDiscount : item.product.priceNormal
          }))
        });
      }

      return newCart;
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId);

      // Log cart update
      if (customerInfo.name) {
        trackPixelEvent('CartUpdate', {
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone || '-',
          buyer_type: customerInfo.buyerType,
          cart_items: newCart.map(item => ({
            id: item.product.id,
            name: item.product.name,
            quantity: item.quantity,
            price: item.product.priceDiscount > 0 ? item.product.priceDiscount : item.product.priceNormal
          }))
        });
      }

      return newCart;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    if (customerInfo.name) {
      trackPixelEvent('CartUpdate', {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone || '-',
        buyer_type: customerInfo.buyerType,
        cart_items: []
      });
    }
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

      {/* Customer Identity Configuration Banner */}
      <div className="bg-emerald-50 border-b border-emerald-100 py-2.5 px-4 shadow-inner flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs md:text-sm animate-fade-in">
        {customerInfo.name.trim() ? (
          <div className="flex flex-wrap items-center justify-center gap-1.5 font-medium text-slate-700">
            <span className="flex items-center gap-1 text-emerald-800 font-bold shrink-0">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
              👤 Belanja sebagai:
            </span>
            <strong className="text-slate-900 font-black">{customerInfo.name}</strong> 
            {customerInfo.phone && <span className="text-slate-500 font-mono font-bold">({customerInfo.phone})</span>}
            <span className="text-[10px] uppercase font-black tracking-wide text-white bg-emerald-600 px-1.5 py-0.5 rounded ml-1 scale-95 shrink-0">
              {customerInfo.buyerType === 'umkm' ? 'UMKM' : customerInfo.buyerType === 'reseller' ? 'Reseller / Agen' : 'Rumah Tangga'}
            </span>
            <button
              onClick={() => setIsIdentityModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-900 underline font-black text-xs ml-2 cursor-pointer inline-flex items-center gap-0.5"
            >
              (Ubah Identitas)
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-slate-700">
            <span className="font-semibold flex items-center gap-1 flex-wrap justify-center">
              👋 <strong className="font-bold text-slate-800">Baru berkunjung?</strong> Bagikan nama Anda agar sistem kami dapat mencatat keranjang belanja Anda secara personal.
            </span>
            <button
              onClick={() => setIsIdentityModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1 rounded-lg text-xs tracking-wide transition shadow-sm cursor-pointer"
            >
              Set Nama & WA Belanja Anda
            </button>
          </div>
        )}
      </div>

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
        <ProductCatalog onAddToCart={handleAddToCart} products={products} categories={categories} bundles={bundles} settings={settings} />
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
        customerInfo={customerInfo}
        onCustomerInfoChange={setCustomerInfo}
      />

      {/* 5. Custom Dynamic Admin Settings Control Panel Drawer */}
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={loadData}
        currentSettings={settings || defaultSettings}
        currentProducts={products}
        currentCategories={categories}
        currentBundles={bundles}
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

      {/* 8. Identity Modal Pop-up */}
      {isIdentityModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-slide-in relative">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-5">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-base flex items-center gap-1.5">
                  <User className="w-5 h-5 text-amber-300" />
                  <span>Identitas Belanja Anda</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsIdentityModalOpen(false);
                    setPendingAddToCart(null);
                  }}
                  className="bg-emerald-750 hover:bg-emerald-850 p-1.5 rounded-full transition cursor-pointer"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-[11px] text-emerald-100 mt-1">
                Lengkapi identitas Anda untuk memesan secara personal & mengaktifkan harga grosir otomatis.
              </p>
            </div>

            <form onSubmit={handleSaveIdentity} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-1.5 font-bold">
                  <span>⚠️</span>
                  <span>{modalError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nama Lengkap Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="Contoh: Ibu Ani Rahmawati"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nomor WhatsApp Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={modalPhone}
                  onChange={(e) => setModalPhone(e.target.value)}
                  placeholder="Contoh: 0812345678"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Kategori Pembeli / Keperluan <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalBuyerType('rumah_tangga')}
                    className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1.5 transition ${
                      modalBuyerType === 'rumah_tangga'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Rumah Tangga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBuyerType('umkm')}
                    className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1.5 transition ${
                      modalBuyerType === 'umkm'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>UMKM Kuliner</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalBuyerType('reseller')}
                    className={`p-2 rounded-xl border text-[10px] font-bold flex flex-col items-center gap-1.5 transition ${
                      modalBuyerType === 'reseller'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Reseller/Mitra</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsIdentityModalOpen(false);
                    setPendingAddToCart(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Identitas</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

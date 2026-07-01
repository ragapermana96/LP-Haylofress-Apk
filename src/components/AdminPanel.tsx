import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Lock, LogIn, LogOut, CheckCircle, Save, Plus, Edit2, Trash2, 
  Settings, ShoppingBag, Phone, AlertCircle, RefreshCw, Key, Image, HelpCircle, UserPlus,
  Sparkles, Users, Home, Upload, Layers, ArrowUp, ArrowDown, FileSpreadsheet, Gift, Eye, EyeOff,
  ShoppingCart, MessageSquare, TrendingUp, Clipboard, Package, Star, BarChart2, Tag, Truck, Printer, 
  Clock, Check, Calendar, AlertTriangle, UserCheck, Menu
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, getDoc, writeBatch 
} from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { Product, DynamicCategory, Bundle } from '../types';
import { PRODUCTS } from '../data/products';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
  currentSettings: any;
  currentProducts: Product[];
  currentCategories: DynamicCategory[];
  currentBundles?: Bundle[];
  isFullScreen?: boolean;
}

export default function AdminPanel({
  isOpen,
  onClose,
  onRefreshData,
  currentSettings,
  currentProducts,
  currentCategories,
  currentBundles = [],
  isFullScreen = false
}: AdminPanelProps) {
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('admin_login_attempts');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'landing' | 'products' | 'whatsapp' | 'admins' | 'layout-order' | 'bundles' | 'carts'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeDashboardSubTab, setActiveDashboardSubTab] = useState<'sales' | 'orders' | 'products' | 'performance' | 'analytics' | 'promotions' | 'shipping'>('sales');
  
  // Dashboard Interactive States
  const [dashboardOrders, setDashboardOrders] = useState<any[]>([]);
  const [selectedOrderForShipping, setSelectedOrderForShipping] = useState<any | null>(null);
  const [shippingWaybill, setShippingWaybill] = useState('');
  
  // Promotions States
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [newVoucherCode, setNewVoucherCode] = useState('');
  const [newVoucherType, setNewVoucherType] = useState<'percentage' | 'fixed'>('percentage');
  const [newVoucherValue, setNewVoucherValue] = useState(0);
  const [newVoucherMin, setNewVoucherMin] = useState(0);
  
  // Campaigns States
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignBudget, setNewCampaignBudget] = useState(0);
  const [newCampaignStatus, setNewCampaignStatus] = useState<'active' | 'paused' | 'ended'>('active');

  // Product Override Statuses (Visible, Stok Habis, Ditolak)
  const [productStatuses, setProductStatuses] = useState<{ [id: string]: 'active' | 'out_of_stock' | 'rejected' }>({});

  // Shop Performance Simulated Reviews
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);

  // Shipping Pickup scheduling
  const [shippingPickups, setShippingPickups] = useState<any[]>([]);
  const [selectedPickupOrder, setSelectedPickupOrder] = useState<any | null>(null);
  const [pickupCourier, setPickupCourier] = useState('J&T');

  const [cartFilter, setCartFilter] = useState<'all' | 'active' | 'checkout' | 'completed'>('all');
  const [cartSearch, setCartSearch] = useState('');

  // Dynamic Layout & Sorting Manager States
  const [catalogLayout, setCatalogLayout] = useState(currentSettings?.catalogLayout || 'tabs');
  const [catalogColumns, setCatalogColumns] = useState(currentSettings?.catalogColumns || '4');
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  // States for Category Management
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Filter category selection for sorting products
  const [activeSortCategory, setActiveSortCategory] = useState<string>('');

  // Filter category selection for products list in active products tab
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('all');
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Sync settings when they load
  useEffect(() => {
    if (currentSettings) {
      setCatalogLayout(currentSettings.catalogLayout || 'tabs');
      setCatalogColumns(currentSettings.catalogColumns || '4');
    }
  }, [currentSettings]);

  // Set initial active sort category once categories load
  useEffect(() => {
    if (currentCategories && currentCategories.length > 0 && !activeSortCategory) {
      setActiveSortCategory(currentCategories[0].id);
    }
  }, [currentCategories]);

  // Ad-hoc Admin Delegation States
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [adminRegisterSuccess, setAdminRegisterSuccess] = useState<string | null>(null);
  const [adminRegisterError, setAdminRegisterError] = useState<string | null>(null);
  const [isAdminCreating, setIsAdminCreating] = useState(false);
  const [adminsList, setAdminsList] = useState<any[]>([]);

  // Customer Analytics Logs & Stats
  const [analyticsLogs, setAnalyticsLogs] = useState<any[]>([]);
  const [analyticsStats, setAnalyticsStats] = useState({
    pageViews: 0,
    addToCartCount: 0,
    checkoutCount: 0,
    purchaseCount: 0,
    totalSales: 0
  });

  // Consolidate logs into distinct customer carts
  const visitorCarts = React.useMemo(() => {
    // Sort chronological: oldest to newest
    const logsChronological = [...analyticsLogs].reverse();
    const cartsMap: { [key: string]: any } = {};

    logsChronological.forEach((log) => {
      const name = (log.params?.customer_name || '').trim();
      const phone = (log.params?.customer_phone || '').trim();
      
      // We must have at least a Name or Phone to catalog a visitor cart
      if (!name && !phone) return;

      // Unique composite key matching name or phone
      const key = (phone && phone !== '-') ? phone : name;
      if (!key) return;

      if (!cartsMap[key]) {
        cartsMap[key] = {
          id: key,
          customerName: name || 'Tanpa Nama',
          customerPhone: phone || '-',
          buyerType: log.params?.buyer_type || 'household',
          lastActivity: log.timestamp,
          items: [],
          hasPurchased: false,
          status: 'Active', // Empty, Active, Checkout, Completed
          purchaseTotal: 0,
          notes: '',
          address: '',
          mapsLink: '',
          lastUpdateTime: log.timestamp,
        };
      }

      // Capture metadata if present in any of the events
      if (log.params?.customer_address) {
        cartsMap[key].address = log.params.customer_address;
      }
      if (log.params?.customer_notes) {
        cartsMap[key].notes = log.params.customer_notes;
      }
      if (log.params?.customer_maps_link) {
        cartsMap[key].mapsLink = log.params.customer_maps_link;
      }

      // Chronological state machine updates
      if (log.eventName === 'AddToCart' || log.eventName === 'CartUpdate') {
        const rawItems = log.params?.cart_items || log.params?.items || [];
        cartsMap[key].items = Array.isArray(rawItems) ? rawItems : [];
        cartsMap[key].lastActivity = log.timestamp;
        cartsMap[key].lastUpdateTime = log.timestamp;
        cartsMap[key].buyerType = log.params?.buyer_type || cartsMap[key].buyerType;
        
        if (cartsMap[key].status !== 'Completed') {
          cartsMap[key].status = cartsMap[key].items.length > 0 ? 'Active' : 'Empty';
        }
      } else if (log.eventName === 'InitiateCheckout') {
        cartsMap[key].lastActivity = log.timestamp;
        cartsMap[key].lastUpdateTime = log.timestamp;
        if (cartsMap[key].status !== 'Completed') {
          cartsMap[key].status = 'Checkout';
        }
      } else if (log.eventName === 'Purchase') {
        cartsMap[key].lastActivity = log.timestamp;
        cartsMap[key].lastUpdateTime = log.timestamp;
        cartsMap[key].hasPurchased = true;
        cartsMap[key].status = 'Completed';
        cartsMap[key].purchaseTotal = Number(log.params?.value || 0);
        cartsMap[key].address = log.params?.customer_address || cartsMap[key].address;
        cartsMap[key].notes = log.params?.customer_notes || cartsMap[key].notes;
        cartsMap[key].mapsLink = log.params?.customer_maps_link || cartsMap[key].mapsLink;
        
        const rawItems = log.params?.items || log.params?.cart_items || [];
        if (Array.isArray(rawItems) && rawItems.length > 0) {
          cartsMap[key].items = rawItems;
        }
      }
    });

    return Object.values(cartsMap).filter((c: any) => {
      // Keep completed purchases, or active/checkout carts with at least one item
      return c.status === 'Completed' || (c.status !== 'Empty' && c.items && c.items.length > 0);
    });
  }, [analyticsLogs]);

  const cartStats = React.useMemo(() => {
    let activeCartsVal = 0;
    let completedCartsVal = 0;
    let activeCount = 0;
    let checkoutCount = 0;
    let completedCount = 0;

    visitorCarts.forEach((c: any) => {
      const subtotal = c.items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
      if (c.status === 'Completed') {
        completedCount++;
        completedCartsVal += c.purchaseTotal || subtotal;
      } else if (c.status === 'Checkout') {
        checkoutCount++;
        activeCartsVal += subtotal;
      } else if (c.status === 'Active') {
        activeCount++;
        activeCartsVal += subtotal;
      }
    });

    return {
      activeCount,
      checkoutCount,
      completedCount,
      abandonedTotalValue: activeCartsVal,
      completedTotalValue: completedCartsVal,
      totalCount: visitorCarts.length
    };
  }, [visitorCarts]);

  // Default Data for ERP Dashboard
  const defaultMockOrders = [
    {
      id: "TRX-2026-001",
      customerName: "Raga Permana",
      customerPhone: "6281234567890",
      buyerType: "reseller",
      address: "Jl. Pemuda No. 45, Karangtengah, Ngawi",
      notes: "Kirim agak pagi sebelum jam 8",
      status: "baru",
      waybill: "",
      items: [
        { name: "Ayam Broiler Utuh Segar", quantity: 10, unit: "Kg", price: 32000, subtotal: 320000 },
        { name: "Daging Sapi Sirloin Segar", quantity: 5, unit: "Kg", price: 120000, subtotal: 600000 }
      ],
      total: 920000,
      createdAt: new Date().toISOString()
    },
    {
      id: "TRX-2026-002",
      customerName: "Siti Rahma",
      customerPhone: "6289987654321",
      buyerType: "umkm",
      address: "Warung Bakso Pak No, Alun-alun Ngawi",
      notes: "Minta potongan kecil-kecil untuk bakso",
      status: "diproses",
      waybill: "",
      items: [
        { name: "Daging Sapi Giling Spesial", quantity: 8, unit: "Kg", price: 115000, subtotal: 920000 }
      ],
      total: 920000,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "TRX-2026-003",
      customerName: "Ibu Hartini",
      customerPhone: "6281357924680",
      buyerType: "household",
      address: "Perumahan Grha Ketanggi Blok C-12, Ngawi",
      notes: "Tolong pastikan sayur beneran fresh",
      status: "dikirim",
      waybill: "JN-20260628001",
      items: [
        { name: "Sayur Pakcoy Hidroponik", quantity: 3, unit: "Pack", price: 12000, subtotal: 36000 },
        { name: "Ayam Kampung Utuh", quantity: 2, unit: "Ekor", price: 75000, subtotal: 150000 }
      ],
      total: 186000,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "TRX-2026-004",
      customerName: "Bapak Suparjo",
      customerPhone: "6281246801357",
      buyerType: "reseller",
      address: "Kios Pasar Besar Ngawi Los B-14",
      notes: "Langganan rutin mingguan",
      status: "selesai",
      waybill: "JN-20260625002",
      items: [
        { name: "Ikan Nila Segar Ukuran Sedang", quantity: 25, unit: "Kg", price: 28000, subtotal: 700000 }
      ],
      total: 700000,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "TRX-2026-005",
      customerName: "Warung Bu Joko",
      customerPhone: "6287755443322",
      buyerType: "umkm",
      address: "Jl. Sukowati No. 89, Ngawi",
      notes: "Ikan kurang segar, minta retur sebagian",
      status: "retur",
      waybill: "",
      items: [
        { name: "Ikan Gurame Hidup", quantity: 4, unit: "Kg", price: 45000, subtotal: 180000 }
      ],
      total: 180000,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const defaultMockVouchers = [
    { code: "FRESHHAYLO", type: "percentage", value: 10, minPurchase: 50000, active: true },
    { code: "MITRAHEMAT", type: "fixed", value: 15000, minPurchase: 150000, active: true },
    { code: "JUMATBERKAH", type: "fixed", value: 5000, minPurchase: 30000, active: true }
  ];

  const defaultMockCampaigns = [
    { id: "c1", name: "Promo Gizi Sehat Keluarga Ngawi", budget: 500000, spend: 320000, clicks: 1240, impressions: 24500, status: "active" },
    { id: "c2", name: "Mega Sale 7.7 Haylofress", budget: 1500000, spend: 1450000, clicks: 4200, impressions: 89000, status: "ended" },
    { id: "c3", name: "Mitra Kuliner UMKM Ngawi", budget: 800000, spend: 150000, clicks: 350, impressions: 7200, status: "active" }
  ];

  const defaultMockReviews = [
    { id: "r1", author: "Dewi Lestari", text: "Ayam potongnya bersih banget dan masih segar, langsung dimasak soto. Mantap!", rating: 5, date: "2026-06-29" },
    { id: "r2", author: "Budi Santoso", text: "Pengiriman cepat sekali ke Ngawi Kota, sayuran hidroponiknya kriuk segar abis.", rating: 5, date: "2026-06-28" },
    { id: "r3", author: "Susanti Ngawi", text: "Sangat puas belanja daging sirloin di sini. Harganya bersahabat untuk reseller.", rating: 4, date: "2026-06-25" }
  ];

  // Initialize and Sync Dashboard data
  useEffect(() => {
    try {
      // 1. Orders
      const savedOrdersRaw = localStorage.getItem('erp_dashboard_orders');
      let orders = savedOrdersRaw ? JSON.parse(savedOrdersRaw) : [];
      if (orders.length === 0) {
        orders = [...defaultMockOrders];
      }
      
      // Sync completed carts from visitorCarts
      visitorCarts.forEach((cart: any) => {
        if (cart.status === 'Completed') {
          const orderExists = orders.some((o: any) => o.id === cart.id || (o.customerPhone === cart.customerPhone && Math.abs(new Date(o.createdAt).getTime() - new Date(cart.lastActivity?.seconds ? cart.lastActivity.seconds * 1000 : cart.lastActivity).getTime()) < 300000));
          
          if (!orderExists) {
            const dateStr = cart.lastActivity?.seconds 
              ? new Date(cart.lastActivity.seconds * 1000).toISOString()
              : new Date().toISOString();
            
            orders.unshift({
              id: `TRX-FB-${cart.id?.slice(-4) || Math.floor(Math.random() * 10000)}`,
              customerName: cart.customerName,
              customerPhone: cart.customerPhone,
              buyerType: cart.buyerType || 'household',
              address: cart.address || 'Ngawi',
              notes: cart.notes || '',
              status: 'selesai',
              waybill: 'JN-AUTO-FB',
              items: cart.items.map((it: any) => ({
                name: it.name,
                quantity: it.quantity || 1,
                unit: it.unit || 'Kg',
                price: it.price || 0,
                subtotal: (it.price || 0) * (it.quantity || 1)
              })),
              total: cart.purchaseTotal || cart.items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0),
              createdAt: dateStr
            });
          }
        }
      });
      setDashboardOrders(orders);
      localStorage.setItem('erp_dashboard_orders', JSON.stringify(orders));

      // 2. Vouchers
      const savedVouchersRaw = localStorage.getItem('erp_dashboard_vouchers');
      if (savedVouchersRaw) {
        setVouchers(JSON.parse(savedVouchersRaw));
      } else {
        setVouchers(defaultMockVouchers);
        localStorage.setItem('erp_dashboard_vouchers', JSON.stringify(defaultMockVouchers));
      }

      // 3. Campaigns
      const savedCampaignsRaw = localStorage.getItem('erp_dashboard_campaigns');
      if (savedCampaignsRaw) {
        setCampaigns(JSON.parse(savedCampaignsRaw));
      } else {
        setCampaigns(defaultMockCampaigns);
        localStorage.setItem('erp_dashboard_campaigns', JSON.stringify(defaultMockCampaigns));
      }

      // 4. Reviews
      const savedReviewsRaw = localStorage.getItem('erp_dashboard_reviews');
      if (savedReviewsRaw) {
        setRecentReviews(JSON.parse(savedReviewsRaw));
      } else {
        setRecentReviews(defaultMockReviews);
        localStorage.setItem('erp_dashboard_reviews', JSON.stringify(defaultMockReviews));
      }

      // 5. Product statuses
      const savedStatusesRaw = localStorage.getItem('erp_dashboard_product_statuses');
      if (savedStatusesRaw) {
        setProductStatuses(JSON.parse(savedStatusesRaw));
      }
    } catch (e) {
      console.warn("Error during erp dashboard synchronization:", e);
    }
  }, [visitorCarts]);

  // Compute stats on the fly
  const salesSummary = React.useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7DaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const startOf30DaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;
    
    let today = 0;
    let yesterday = 0;
    let last7Days = 0;
    let last30Days = 0;
    
    dashboardOrders.forEach((o: any) => {
      if (o.status === 'retur') return;
      
      const orderTime = new Date(o.createdAt).getTime();
      const amount = Number(o.total || 0);
      
      if (orderTime >= startOfToday) {
        today += amount;
      }
      if (orderTime >= startOfYesterday && orderTime < startOfToday) {
        yesterday += amount;
      }
      if (orderTime >= startOf7DaysAgo) {
        last7Days += amount;
      }
      if (orderTime >= startOf30DaysAgo) {
        last30Days += amount;
      }
    });
    
    return { today, yesterday, last7Days, last30Days };
  }, [dashboardOrders]);

  const productStats = React.useMemo(() => {
    let activeCount = 0;
    let outOfStockCount = 0;
    let rejectedCount = 0;
    
    currentProducts.forEach((p) => {
      const status = productStatuses[p.id] || 'active';
      if (status === 'active') activeCount++;
      else if (status === 'out_of_stock') outOfStockCount++;
      else if (status === 'rejected') rejectedCount++;
    });
    
    return { activeCount, outOfStockCount, rejectedCount };
  }, [currentProducts, productStatuses]);

  const orderStats = React.useMemo(() => {
    let baru = 0;
    let diproses = 0;
    let dikirim = 0;
    let selesai = 0;
    let retur = 0;
    
    dashboardOrders.forEach((o: any) => {
      if (o.status === 'baru') baru++;
      else if (o.status === 'diproses') diproses++;
      else if (o.status === 'dikirim') dikirim++;
      else if (o.status === 'selesai') selesai++;
      else if (o.status === 'retur') retur++;
    });
    
    return { baru, diproses, dikirim, selesai, retur };
  }, [dashboardOrders]);

  // Operations handlers
  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    const updated = dashboardOrders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    setDashboardOrders(updated);
    localStorage.setItem('erp_dashboard_orders', JSON.stringify(updated));
  };

  const handleSetOrderWaybill = (orderId: string, waybill: string) => {
    const updated = dashboardOrders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: 'dikirim', waybill };
      }
      return o;
    });
    setDashboardOrders(updated);
    localStorage.setItem('erp_dashboard_orders', JSON.stringify(updated));
    setSelectedOrderForShipping(null);
    setShippingWaybill('');
  };

  const handleUpdateProductStatus = (prodId: string, newStatus: 'active' | 'out_of_stock' | 'rejected') => {
    const updated = { ...productStatuses, [prodId]: newStatus };
    setProductStatuses(updated);
    localStorage.setItem('erp_dashboard_product_statuses', JSON.stringify(updated));
  };

  const handleAddVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoucherCode) return;
    const codeUpper = newVoucherCode.toUpperCase().replace(/\s+/g, '');
    const newV = {
      code: codeUpper,
      type: newVoucherType,
      value: Number(newVoucherValue),
      minPurchase: Number(newVoucherMin),
      active: true
    };
    const updated = [...vouchers, newV];
    setVouchers(updated);
    localStorage.setItem('erp_dashboard_vouchers', JSON.stringify(updated));
    setNewVoucherCode('');
    setNewVoucherValue(0);
    setNewVoucherMin(0);
  };

  const handleDeleteVoucher = (code: string) => {
    const updated = vouchers.filter((v) => v.code !== code);
    setVouchers(updated);
    localStorage.setItem('erp_dashboard_vouchers', JSON.stringify(updated));
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaignName) return;
    const newC = {
      id: `c-${Date.now()}`,
      name: newCampaignName,
      budget: Number(newCampaignBudget),
      spend: 0,
      clicks: 0,
      impressions: 0,
      status: newCampaignStatus
    };
    const updated = [...campaigns, newC];
    setCampaigns(updated);
    localStorage.setItem('erp_dashboard_campaigns', JSON.stringify(updated));
    setNewCampaignName('');
    setNewCampaignBudget(0);
  };

  const handleToggleCampaignStatus = (campaignId: string) => {
    const updated = campaigns.map((c) => {
      if (c.id === campaignId) {
        const nextStatus = c.status === 'active' ? 'paused' : c.status === 'paused' ? 'ended' : 'active';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    setCampaigns(updated);
    localStorage.setItem('erp_dashboard_campaigns', JSON.stringify(updated));
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewText) return;
    const newR = {
      id: `r-${Date.now()}`,
      author: newReviewAuthor,
      text: newReviewText,
      rating: Number(newReviewRating),
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newR, ...recentReviews];
    setRecentReviews(updated);
    localStorage.setItem('erp_dashboard_reviews', JSON.stringify(updated));
    setNewReviewAuthor('');
    setNewReviewText('');
    setNewReviewRating(5);
  };

  const handleRequestPickup = (order: any) => {
    if (!order) return;
    const newPickup = {
      id: `PKP-${Date.now().toString().slice(-6)}`,
      orderId: order.id,
      customerName: order.customerName,
      courier: pickupCourier,
      status: 'scheduled',
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    };
    const updated = [newPickup, ...shippingPickups];
    setShippingPickups(updated);
    
    if (order.status === 'baru') {
      handleUpdateOrderStatus(order.id, 'diproses');
    }
    
    setSelectedPickupOrder(null);
    alert(`Pickup Berhasil Dijadwalkan!\nKurir ${pickupCourier} akan menjemput paket untuk ${order.customerName} hari ini.`);
  };

  const filteredVisitorCarts = React.useMemo(() => {
    return visitorCarts.filter((cart) => {
      // 1. Filter by Status
      if (cartFilter !== 'all') {
        if (cartFilter === 'active' && cart.status !== 'Active') return false;
        if (cartFilter === 'checkout' && cart.status !== 'Checkout') return false;
        if (cartFilter === 'completed' && cart.status !== 'Completed') return false;
      }

      // 2. Search query matching
      if (cartSearch.trim()) {
        const query = cartSearch.toLowerCase().trim();
        const nameMatch = cart.customerName.toLowerCase().includes(query);
        const phoneMatch = cart.customerPhone.toLowerCase().includes(query);
        const itemMatch = cart.items.some((it: any) => (it.name || '').toLowerCase().includes(query));
        return nameMatch || phoneMatch || itemMatch;
      }

      return true;
    }).sort((a: any, b: any) => {
      const timeA = a.lastActivity?.seconds ? a.lastActivity.seconds * 1000 : new Date(a.lastActivity || 0).getTime();
      const timeB = b.lastActivity?.seconds ? b.lastActivity.seconds * 1000 : new Date(b.lastActivity || 0).getTime();
      return timeB - timeA;
    });
  }, [visitorCarts, cartFilter, cartSearch]);

  // Loading indicator states
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [expandedSection, setExpandedSection] = useState<'beranda' | 'solusi' | 'keunggulan' | 'mitra' | 'katalog' | 'kontak' | 'admin'>('beranda');

  // States for Promo Bundling Management
  const [isBundleFormOpen, setIsBundleFormOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [bundleId, setBundleId] = useState('');
  const [bundleTitle, setBundleTitle] = useState('');
  const [bundleDescription, setBundleDescription] = useState('');
  const [bundleOriginalPrice, setBundleOriginalPrice] = useState(0);
  const [bundlePromoPrice, setBundlePromoPrice] = useState(0);
  const [bundleImageUrl, setBundleImageUrl] = useState('');
  const [bundleItemsText, setBundleItemsText] = useState('');
  const [bundleVisible, setBundleVisible] = useState(true);
  const [bundleOrder, setBundleOrder] = useState(1);

  // Form states for Settings (Struktur Landing Page & WA & Pixels)
  const [settingsForm, setSettingsForm] = useState({
    waNumber: '6281234567890',
    metaPixelId: '',
    heroTitle: '',
    heroSubtitle: '',
    heroImageUrl: '',
    profilTitle: '',
    profilDescription: '',
    profilDescriptionSec: '',
    profilImageLeft: '',
    profilImageRight: '',
    problemTitle: '',
    problemSubtitle: '',
    solutionTitle: '',
    solutionSubtitle: '',
    keunggulanTitle: '4 Pilar Utama Keunggulan Haylofress Ngawi',
    keunggulanSubtitle: 'Kami menjaga kualitas produk sejak awal rantai distribusi hingga sampai di tangan Anda demi memberikan kenyamanan dan kesehatan konsumsi keluarga.',
    footerAddress: 'Jl. Ketonggo II Gg. Jalak No.21 RT 23 RW 05, Ketanggi, Ngawi, Jawa Timur 63211',
    footerHours: 'Buka Setiap Hari: 06:00 - 18:00 WIB',
    footerEmail: 'haylofress.ngawi@gmail.com'
  });

  // Form states for Product Catalog
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [productImgMode, setProductImgMode] = useState<'url' | 'upload'>('url');
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    category: 'ayam' as 'ayam' | 'sapi' | 'ikan' | 'sayuran',
    unit: 'Kg',
    priceNormal: 0,
    priceDiscount: 0,
    priceGrosir1: 0,
    priceGrosir2: 0,
    priceGrosir3: 0,
    imageUrl: '',
    description: '',
    visible: true
  });

  // Sync state with current authenticated user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        let isUserAdmin = false;
        const normEmail = user.email?.toLowerCase() || '';
        if (normEmail === 'ragapermana96@gmail.com' || normEmail.includes('admin')) {
          isUserAdmin = true;
        } else {
          try {
            const adminDocRef = doc(db, 'admins', user.uid);
            const adminDocSnap = await getDoc(adminDocRef);
            if (adminDocSnap.exists()) {
              isUserAdmin = true;
            }
          } catch (err) {
            console.warn("Firestore admin check failed:", err);
          }
        }

        if (isUserAdmin) {
          setIsAdminLoggedIn(true);
        } else {
          setIsAdminLoggedIn(false);
          // Customers/non-admins are signed out immediately
          await signOut(auth);
          console.warn("Signed out non-admin user on init detection.");
        }
      } else {
        setIsAdminLoggedIn(false);
      }
    });
    return unsub;
  }, []);

  // Sync settingsForm state when currentSettings changes
  useEffect(() => {
    if (currentSettings) {
      setSettingsForm({
        waNumber: currentSettings.waNumber || '6281234567890',
        metaPixelId: currentSettings.metaPixelId || '',
        heroTitle: currentSettings.heroTitle || '',
        heroSubtitle: currentSettings.heroSubtitle || '',
        heroImageUrl: currentSettings.heroImageUrl || '',
        profilTitle: currentSettings.profilTitle || '',
        profilDescription: currentSettings.profilDescription || '',
        profilDescriptionSec: currentSettings.profilDescriptionSec || '',
        profilImageLeft: currentSettings.profilImageLeft || '',
        profilImageRight: currentSettings.profilImageRight || '',
        problemTitle: currentSettings.problemTitle || '',
        problemSubtitle: currentSettings.problemSubtitle || '',
        solutionTitle: currentSettings.solutionTitle || '',
        solutionSubtitle: currentSettings.solutionSubtitle || '',
        keunggulanTitle: currentSettings.keunggulanTitle || '4 Pilar Utama Keunggulan Haylofress Ngawi',
        keunggulanSubtitle: currentSettings.keunggulanSubtitle || 'Kami menjaga kualitas produk sejak awal rantai distribusi hingga sampai di tangan Anda demi memberikan kenyamanan dan kesehatan konsumsi keluarga.',
        footerAddress: currentSettings.footerAddress || 'Jl. Ketonggo II Gg. Jalak No.21 RT 23 RW 05, Ketanggi, Ngawi, Jawa Timur 63211',
        footerHours: currentSettings.footerHours || 'Buka Setiap Hari: 06:00 - 18:00 WIB',
        footerEmail: currentSettings.footerEmail || 'haylofress.ngawi@gmail.com'
      });
    }
  }, [currentSettings, isOpen]);

  // Fetch registered administrators list
  const fetchAdminsList = async () => {
    try {
      const querySnap = await getDocs(collection(db, 'admins'));
      const list: any[] = [];
      querySnap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort by creation date
      list.sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });
      setAdminsList(list);
    } catch (err) {
      console.warn("Failed to fetch admins list:", err);
    }
  };

  // Fetch Meta Pixel traffic logs and trigger customer conversion computations
  const fetchAnalytics = async () => {
    try {
      const querySnap = await getDocs(collection(db, 'pixel_analytics'));
      const logs: any[] = [];
      let pViews = 0;
      let cAdds = 0;
      let cCheckouts = 0;
      let cPurchases = 0;
      let sales = 0;

      querySnap.forEach((doc) => {
        const data = doc.data();
        logs.push({ id: doc.id, ...data });

        if (data.eventName === 'PageView') {
          pViews++;
        } else if (data.eventName === 'AddToCart') {
          cAdds++;
        } else if (data.eventName === 'InitiateCheckout') {
          cCheckouts++;
        } else if (data.eventName === 'Purchase') {
          cPurchases++;
          sales += Number(data.params?.value || 0);
        }
      });

      // Avoid Division by Zero
      if (pViews === 0) pViews = 1;

      // Sort logs descending by timestamp
      logs.sort((a, b) => {
        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp || 0).getTime();
        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });

      setAnalyticsLogs(logs);
      setAnalyticsStats({
        pageViews: pViews,
        addToCartCount: cAdds,
        checkoutCount: cCheckouts,
        purchaseCount: cPurchases,
        totalSales: sales
      });
    } catch (err) {
      console.warn("Failed to load customer analytics logs:", err);
    }
  };

  // Export transaction logs to Microsoft Excel compatible CSV file
  const handleExportToExcel = () => {
    const purchaseLogs = analyticsLogs.filter(log => log.eventName === 'Purchase');
    if (purchaseLogs.length === 0) {
      alert("Tidak ada data transaksi pembelian untuk diekspor!");
      return;
    }

    // Delimited header definition matching standard Indonesian Excel context (semicolon ;)
    const headers = [
      "Tanggal Pembelian",
      "Nama Pembeli",
      "Nomor WhatsApp",
      "Jenis Pelanggan (Mitra)",
      "Alamat Pengiriman Lengkap",
      "Barang yang Dibeli",
      "Total Belanja bersih (IDR)",
      "Catatan Keperluan Khusus"
    ];

    const rows = purchaseLogs.map(log => {
      const dateStr = log.timestamp?.seconds 
        ? new Date(log.timestamp.seconds * 1000).toLocaleString('id-ID')
        : new Date().toLocaleString('id-ID');

      const name = log.params?.customer_name || 'Pelanggan';
      const phone = log.params?.customer_phone || '-';
      
      let buyerTypeLabel = 'Rumah Tangga';
      if (log.params?.buyer_type === 'reseller') buyerTypeLabel = 'Reseller';
      else if (log.params?.buyer_type === 'umkm') buyerTypeLabel = 'UMKM Kuliner';

      const address = log.params?.customer_address || '-';
      
      const itemsList = log.params?.items || [];
      const itemsStr = itemsList.length > 0 
        ? itemsList.map((item: any) => `${item.name} (${item.quantity} ${item.unit}) [Harga: Rp ${item.price}, Sub: Rp ${item.subtotal}]`).join(', ')
        : `Detail lama (${log.params?.num_items || 1} item)`;

      const totalValue = log.params?.value || 0;
      const notes = log.params?.customer_notes || '-';

      // Secure quoting to comply with CSV specification & avoid comma/quote breakages
      const clean = (val: any) => {
        let str = String(val);
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      return [
        clean(dateStr),
        clean(name),
        clean(phone),
        clean(buyerTypeLabel),
        clean(address),
        clean(itemsStr),
        totalValue,
        clean(notes)
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');

    // Add UTF-8 BOM byte order mark to force excel to read dynamic Indonesian characters properly
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `daftar-transaksi-haylofress-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh directories whenever tabs move or logged-in state confirmed
  useEffect(() => {
    if (isAdminLoggedIn && isOpen) {
      fetchAdminsList();
      fetchAnalytics();
    }
  }, [isAdminLoggedIn, isOpen, activeTab]);

  // Admin Delegation: Register a supplementary admin account safely
  const handleRegisterNewAdminByAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminRegisterSuccess(null);
    setAdminRegisterError(null);

    const targetEmail = newAdminEmail.trim();
    const targetPassword = newAdminPassword.trim();

    if (!targetEmail || !targetPassword) {
      setAdminRegisterError('Email dan password wajib diisi.');
      return;
    }
    if (targetPassword.length < 6) {
      setAdminRegisterError('Katasandi minimal 6 karakter.');
      return;
    }

    try {
      setIsAdminCreating(true);

      // Dynamically initialize secondary app so we register new users without logging ourselves out
      const { initializeApp, deleteApp } = await import('firebase/app');
      const { getAuth, createUserWithEmailAndPassword, signOut: secondarySignOut } = await import('firebase/auth');
      const firebaseConfig = await import('../../firebase-applet-config.json').then(m => m.default || m);

      const appName = "SecondaryAdminApp-" + Date.now();
      const secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, targetEmail, targetPassword);
      const user = userCredential.user;

      if (user) {
        // Log authorized admin metadata records securely
        await setDoc(doc(db, 'admins', user.uid), {
          email: user.email,
          createdAt: new Date().toISOString(),
          createdBy: auth.currentUser?.email || 'System'
        });
      }

      await secondarySignOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setAdminRegisterSuccess(`Sukses mendaftarkan pengelola baru: ${targetEmail}`);
      setNewAdminEmail('');
      setNewAdminPassword('');
      fetchAdminsList();
    } catch (err: any) {
      console.error(err);
      setAdminRegisterError(err.message || 'Gagal mendaftarkan pengelola baru.');
    } finally {
      setIsAdminCreating(false);
    }
  };

  // Admin Revocation: Revoke admin status on Firestore database access check
  const handleDeleteAdminDoc = async (adminId: string, adminEmail: string) => {
    if (adminEmail === 'ragapermana96@gmail.com') {
      alert('Sandi Super Admin Utama tidak boleh dihapus demi keamanan sistem!');
      return;
    }
    if (!window.confirm(`Apakah Anda yakin ingin mematikan status pengelola untuk ${adminEmail}? Sesi login tidak akan valid lagi.`)) {
      return;
    }

    try {
      setStatusMsg('Mencabut izin hak pengelola...');
      await deleteDoc(doc(db, 'admins', adminId));
      setStatusMsg('Izin akses berhasil dicabut sepenuhnya!');
      fetchAdminsList();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Akses gagal dicabut.');
    }
  };

  // Helper to determine if an email is patterned as admin/master
  const isEmailAdminPattern = (emailStr: string) => {
    const norm = emailStr.trim().toLowerCase();
    return norm === 'ragapermana96@gmail.com' || norm.includes('admin');
  };

  // Auth Submit Action (Login or Register)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    // If already more than 2 attempts, hard block
    if (loginAttempts >= 2) {
      setAuthError('Akses masuk dinonaktifkan secara permanen karena terdeteksi sebagai akun pelanggan.');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setAuthError('Email dan password wajib diisi.');
      return;
    }

    const normEmail = email.trim().toLowerCase();

    // 1. Pre-login validation: Prevent customers from logging in on client-side entirely
    if (!isEmailAdminPattern(normEmail)) {
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      try {
        localStorage.setItem('admin_login_attempts', nextAttempts.toString());
      } catch (e) {
        console.warn("Storage write failed:", e);
      }
      setAuthError('Akses ditolak. Layanan pengelola ini tertutup untuk akun pelanggan!');
      return;
    }

    try {
      setIsLoading(true);
      if (isRegisterMode) {
        await createUserWithEmailAndPassword(auth, email, password);
        // Create an admin document
        const user = auth.currentUser;
        if (user) {
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            createdAt: new Date()
          });
        }
        setAuthSuccess('Registrasi Admin berhasil! Silakan login jika diperlukan.');
        setIsRegisterMode(false);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        
        // 2. Post-login validation: Extra safeguard
        const user = auth.currentUser;
        if (user && user.email && !isEmailAdminPattern(user.email)) {
          // Immediately log out unauthorized user
          await signOut(auth);
          setIsAdminLoggedIn(false);
          
          const nextAttempts = loginAttempts + 1;
          setLoginAttempts(nextAttempts);
          try {
            localStorage.setItem('admin_login_attempts', nextAttempts.toString());
          } catch (e) {
            console.warn("Storage write failed:", e);
          }
          setAuthError('Akses ditolak. Anda login sebagai akun pelanggan, bukan pengelola.');
          return;
        }

        setIsAdminLoggedIn(true);
        setAuthSuccess('Berhasil masuk sebagai Admin!');
      }
    } catch (err: any) {
      console.error(err);
      
      // Increment login attempt counter (customer guessing password or failed config)
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      try {
        localStorage.setItem('admin_login_attempts', nextAttempts.toString());
      } catch (e) {
        console.warn("Storage write failed:", e);
      }

      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Email atau password salah.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Email ini sudah terdaftar sebagai Admin.');
      } else {
        setAuthError(err.message || 'Gagal memproses autentikasi.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAdminLoggedIn(false);
      setAuthSuccess('Berhasil keluar dari sesi Admin.');
    } catch (err) {
      console.error(err);
    }
  };

  // Seeding button for default products and configuration
  const handleSeedDefaults = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menyetel ulang data ke data bawaan (seeding)? Ini hanya direkomendasikan jika database masih kosong.')) {
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Memproses seeding database...');

      // Seed App Settings
      const defaultSettingsDoc = {
        waNumber: '6281234567890',
        metaPixelId: '',
        heroTitle: 'Daging Segar & Siap Olah Langsung Ke Dapur Anda.',
        heroSubtitle: 'Kini masak enak jauh lebih praktis dan hemat! Haylofress Ngawi menyediakan ayam segar, daging sapi, fillet dori, dan sayuran higienis, bersih siap olah, dikemas khusus agar kesegaran terkunci sempurna hingga ke dapur Anda.',
        heroImageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=700',
        profilTitle: 'Haylofress Ngawi — Pelopor Frozen Food & Bahan Hidangan Higienis di Ngawi',
        profilDescription: 'Kami berdiri untuk memberikan kenyamanan utama bagi para ibu rumah tangga, pelaku usaha kuliner, katering, dan pelaku UMKM di seluruh Kabupaten Ngawi. Melewati repotnya belanja ke pasar tradisional yang becek, mengupas ceker ayam yang kotor, atau mencari daging sapi minim lemak kini tidak lagi menjadi masalah.',
        profilDescriptionSec: 'Dengan standarisasi kebersihan tinggi, proses penanganan produk halal murni, pengemasan kedap udara (vacuum pack), dan pengiriman rantai dingin terpadu (cold chain), kami memastikan nutrisi dan keaslian rasa bahan makanan premium tetap terjaga utuh sampai di tangan Anda.',
        profilImageLeft: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&q=80&w=500',
        profilImageRight: 'https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=500',
        problemTitle: 'Mengapa Belanja Bahan Makanan Tradisional Masih Sering Menyulitkan?',
        problemSubtitle: '3 Kendala Utama yang Sering Dihadapi Ibu Rumah Tangga & Pengusaha Katering',
        solutionTitle: 'Haylofress Ngawi Hadir sebagai Solusi Praktis & Higienis Anda',
        solutionSubtitle: 'Belanja Cerdas Tanpa Repot, Kualitas Restoran Bintang Lima untuk Dapur Anda',
        keunggulanTitle: '4 Pilar Utama Keunggulan Haylofress Ngawi',
        keunggulanSubtitle: 'Kami menjaga kualitas produk sejak awal rantai distribusi hingga sampai di tangan Anda demi memberikan kenyamanan dan kesehatan konsumsi keluarga.',
        footerAddress: 'Jl. Ketonggo II Gg. Jalak No.21 RT 23 RW 05, Ketanggi, Ngawi, Jawa Timur 63211',
        footerHours: 'Buka Setiap Hari: 06:00 - 18:00 WIB',
        footerEmail: 'haylofress.ngawi@gmail.com'
      };

      await setDoc(doc(db, 'settings', 'global'), defaultSettingsDoc);

      // Seed all products from static array structure in batches
      for (const prod of PRODUCTS) {
        await setDoc(doc(db, 'products', prod.id), prod);
      }

      setStatusMsg('Data bawaan berhasil dimuat ke database!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'seed');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync catalog updates from PRODUCTS array into Firestore (force update)
  const handleSyncProductsFromCode = async () => {
    if (!window.confirm('Sinkronkan Katalog Produk? Fitur ini akan memperbarui Nama dan Gambar produk di database sesuai dengan kode sumber terbaru (PRODUCTS.ts). Data harga dan stok tetap terjaga jika Anda sudah mengubahnya di admin.')) {
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Mensinkronkan katalog produk...');
      
      let updateCount = 0;
      for (const prod of PRODUCTS) {
        // We only update name and imageUrl to respect user-edited prices/descriptions in DB if possible
        const prodRef = doc(db, 'products', prod.id);
        const snap = await getDoc(prodRef);
        
        if (snap.exists()) {
          // Update existing
          await updateDoc(prodRef, {
            name: prod.name,
            imageUrl: prod.imageUrl,
            category: prod.category // Also sync category in case it moved
          });
        } else {
          // Create new if missing
          await setDoc(prodRef, prod);
        }
        updateCount++;
      }

      setStatusMsg(`${updateCount} produk berhasil disinkronkan!`);
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (err: any) {
      console.error("Sync failed:", err);
      alert("Gagal sinkron: " + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Save Settings forms (Landing Page structure & WhatsApp number)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setStatusMsg('Menyimpan perubahan struktur...');
      await setDoc(doc(db, 'settings', 'global'), settingsForm);
      setStatusMsg('Struktur landing page berhasil disimpan!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal menyimpan pengaturan: ", err);
      const isSizeError = err && (err.message?.includes('too large') || String(err).includes('too large') || err.code === 'resource-exhausted');
      if (isSizeError) {
        alert("Gagal Menyimpan! Ukuran file foto yang diunggah untuk banner/profil gabungan terlalu besar (melebihi batas database Firestore 1MB). Silakan kompres foto Anda atau gunakan link/URL eksternal.");
      } else {
        alert("Gagal menyimpan pengaturan! Harap pastikan koneksi lancar dan Anda masuk sebagai admin. Detail: " + (err.message || String(err)));
      }
      handleFirestoreError(err, OperationType.WRITE, '/settings/global');
    } finally {
      setIsLoading(false);
    }
  };

  // Product Form Action: Add or Edit
  const openProductFormForAdd = () => {
    setEditingProduct(null);
    setProductImgMode('url');
    setProductForm({
      id: 'prod-' + Date.now().toString().slice(-6),
      name: '',
      category: currentCategories[0]?.id || 'ayam',
      unit: 'Kg',
      priceNormal: 0,
      priceDiscount: 0,
      priceGrosir1: 0,
      priceGrosir2: 0,
      priceGrosir3: 0,
      imageUrl: '',
      description: '',
      visible: true
    });
    setIsProductFormOpen(true);
  };

  const openProductFormForEdit = (prod: Product) => {
    setEditingProduct(prod);
    const isLocalUpload = prod.imageUrl && prod.imageUrl.startsWith('data:image');
    setProductImgMode(isLocalUpload ? 'upload' : 'url');
    setProductForm({
      id: prod.id,
      name: prod.name || '',
      category: prod.category || 'ayam',
      unit: prod.unit || 'Kg',
      priceNormal: prod.priceNormal || 0,
      priceDiscount: prod.priceDiscount || 0,
      priceGrosir1: prod.priceGrosir1 || 0,
      priceGrosir2: prod.priceGrosir2 || 0,
      priceGrosir3: prod.priceGrosir3 || 0,
      imageUrl: prod.imageUrl || '',
      description: prod.description || '',
      visible: prod.visible !== false
    });
    setIsProductFormOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameStr = (productForm.name || '').trim();
    const imgUrlStr = (productForm.imageUrl || '').trim();
    const descStr = (productForm.description || '').trim();

    if (!nameStr || !imgUrlStr) {
      alert('Mohon lengkapi data produk yang wajib diisi (Nama Produk dan Url/Foto Gambar).');
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg(editingProduct ? 'Memperbarui produk...' : 'Menambahkan produk...');
      
      const existingProductObj = currentProducts.find(p => p.id === productForm.id);
      const existingOrder = existingProductObj && typeof existingProductObj.order === 'number' ? existingProductObj.order : 9999;

      const payload = {
        ...productForm,
        priceNormal: Number(productForm.priceNormal),
        priceDiscount: Number(productForm.priceDiscount),
        priceGrosir1: Number(productForm.priceGrosir1),
        priceGrosir2: Number(productForm.priceGrosir2),
        priceGrosir3: Number(productForm.priceGrosir3),
        visible: productForm.visible !== false,
        order: existingOrder
      };

      await setDoc(doc(db, 'products', payload.id), payload);
      
      setStatusMsg(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!');
      setIsProductFormOpen(false);
      setEditingProduct(null);
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal menyimpan produk: ", err);
      const isSizeError = err && (err.message?.includes('too large') || String(err).includes('too large') || err.code === 'resource-exhausted');
      if (isSizeError) {
        alert("Gagal Menyimpan! Ukuran foto produk terlalu besar (melebihi batas database Firestore 1MB). Silakan kompres foto lebih lanjut atau gunakan link/URL foto eksternal.");
      } else {
        alert("Gagal menyimpan produk! Detail: " + (err.message || String(err)));
      }
      handleFirestoreError(err, OperationType.WRITE, `/products/${productForm.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Menghapus produk...');
      await deleteDoc(doc(db, 'products', id));
      setStatusMsg('Produk berhasil dihapus!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `/products/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- BUNDLE MANAGEMENT HANDLERS ---
  
  const handleOpenAddBundle = () => {
    setEditingBundle(null);
    setBundleId('bundle_' + Math.random().toString(36).substr(2, 9));
    setBundleTitle('');
    setBundleDescription('');
    setBundleOriginalPrice(0);
    setBundlePromoPrice(0);
    setBundleImageUrl('');
    setBundleItemsText('');
    setBundleVisible(true);
    setBundleOrder(currentBundles.length + 1);
    setIsBundleFormOpen(true);
  };

  const handleOpenEditBundle = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setBundleId(bundle.id);
    setBundleTitle(bundle.title);
    setBundleDescription(bundle.description);
    setBundleOriginalPrice(bundle.originalPrice);
    setBundlePromoPrice(bundle.promoPrice);
    setBundleImageUrl(bundle.imageUrl || '');
    setBundleItemsText((bundle.items || []).join('\n'));
    setBundleVisible(bundle.visible !== false);
    setBundleOrder(bundle.order || 1);
    setIsBundleFormOpen(true);
  };

  const handleSaveBundle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bundleId.trim() || !bundleTitle.trim() || !bundleItemsText.trim() || bundleOriginalPrice <= 0 || bundlePromoPrice <= 0) {
      alert("Harap lengkapi ID, Nama Paket, Isi Paket (min 1 item), serta Harga Normal & Promo.");
      return;
    }

    const cleanId = bundleId.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '');
    if (!cleanId) {
      alert("ID Paket tidak valid. Gunakan huruf, angka, underscore, atau tanda hubung.");
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Menyimpan bundle...');

      const cleanItems = bundleItemsText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const payload: Bundle = {
        id: cleanId,
        title: bundleTitle.trim(),
        description: bundleDescription.trim(),
        originalPrice: Number(bundleOriginalPrice),
        promoPrice: Number(bundlePromoPrice),
        imageUrl: bundleImageUrl.trim(),
        items: cleanItems,
        visible: bundleVisible,
        order: Number(bundleOrder)
      };

      await setDoc(doc(db, 'bundles', payload.id), payload);

      setStatusMsg(editingBundle ? 'Paket Bundling berhasil diperbarui!' : 'Paket Bundling berhasil ditambahkan!');
      setIsBundleFormOpen(false);
      setEditingBundle(null);
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal menyimpan bundle: ", err);
      alert("Gagal menyimpan paket bundling! Detail: " + (err.message || String(err)));
      handleFirestoreError(err, OperationType.WRITE, `/bundles/${bundleId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBundle = async (id: string, title: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus paket bundling "${title}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Menghapus paket bundling...');
      await deleteDoc(doc(db, 'bundles', id));
      setStatusMsg('Paket bundling berhasil dihapus!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `/bundles/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBundleVisibility = async (bundle: Bundle) => {
    try {
      setIsLoading(true);
      const updatedVisible = bundle.visible === false ? true : false;
      setStatusMsg(updatedVisible ? 'Mengaktifkan paket...' : 'Menyembunyikan paket...');
      
      const updatedBundle = {
        ...bundle,
        visible: updatedVisible
      };

      await setDoc(doc(db, 'bundles', bundle.id), updatedBundle);
      
      setStatusMsg(updatedVisible ? 'Paket Bundling berhasil diaktifkan!' : 'Paket Bundling berhasil disembunyikan!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal mengubah status bundle: ", err);
      alert("Gagal mengubah status paket bundling! Detail: " + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProductVisibility = async (product: Product) => {
    try {
      setIsLoading(true);
      const updatedVisible = product.visible === false ? true : false;
      setStatusMsg(updatedVisible ? 'Mengaktifkan produk...' : 'Menyembunyikan produk...');
      
      const updatedProduct = {
        ...product,
        visible: updatedVisible
      };

      await setDoc(doc(db, 'products', product.id), updatedProduct);
      
      setStatusMsg(updatedVisible ? 'Produk berhasil ditampilkan!' : 'Produk berhasil disembunyikan!');
      onRefreshData();
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error("Gagal mengubah status produk: ", err);
      alert("Gagal mengubah status produk! Detail: " + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Handler to Save Catalog Layout Settings
  const handleSaveCatalogLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingLayout(true);
      const settingsRef = doc(db, 'settings', 'global');
      await updateDoc(settingsRef, {
        catalogLayout,
        catalogColumns,
      });
      onRefreshData();
      alert('Pengaturan layout katalog berhasil disimpan!');
    } catch (err: any) {
      console.error('Gagal menyimpan layout katalog:', err);
      alert('Gagal menyimpan settings: ' + (err.message || String(err)));
    } finally {
      setIsSavingLayout(false);
    }
  };

  // Handler to Add or Edit Categories
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryId.trim() || !newCategoryName.trim()) {
      alert('Mohon lengkapi ID Kategori dan Nama Kategori.');
      return;
    }

    const cleanId = newCategoryId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanId) {
      alert('ID Kategori tidak valid. Karakter diperbolehkan: huruf kecil, angka, garis mendatar.');
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg(editingCategory ? 'Memperbarui kategori...' : 'Menambahkan kategori...');
      
      const newOrder = editingCategory 
        ? editingCategory.order 
        : (currentCategories.length > 0 ? Math.max(...currentCategories.map(c => c.order || 0)) + 1 : 1);

      const categoryData = {
        id: cleanId,
        name: newCategoryName.trim(),
        order: newOrder
      };

      await setDoc(doc(db, 'categories', cleanId), categoryData);
      
      setIsCategoryFormOpen(false);
      setEditingCategory(null);
      setNewCategoryId('');
      setNewCategoryName('');
      onRefreshData();
      setStatusMsg(editingCategory ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Gagal menyimpan kategori:', err);
      alert('Gagal menyimpan kategori: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setNewCategoryId(cat.id);
    setNewCategoryName(cat.name);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (catId: string, catName: string) => {
    const hasProducts = currentProducts.some(p => p.category === catId);
    if (hasProducts) {
      alert(`Kategori "${catName}" tidak dapat dihapus karena masih digunakan oleh produk aktif. Hubungkan produk-produk tersebut ke kategori lain terlebih dahulu.`);
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus kategori "${catName}"?`)) {
      return;
    }

    try {
      setIsLoading(true);
      setStatusMsg('Menghapus kategori...');
      await deleteDoc(doc(db, 'categories', catId));
      onRefreshData();
      setStatusMsg('Kategori berhasil dihapus!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Gagal menghapus kategori:', err);
      alert('Gagal menghapus kategori: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder Categories Swapping Orders
  const moveCategoryOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentCategories.length) return;

    try {
      setIsLoading(true);
      setStatusMsg('Menata ulang kategori...');
      
      const cat1 = currentCategories[index];
      const cat2 = currentCategories[targetIdx];

      const order1 = typeof cat1.order === 'number' ? cat1.order : index + 1;
      const order2 = typeof cat2.order === 'number' ? cat2.order : targetIdx + 1;

      const batch = writeBatch(db);
      batch.set(doc(db, 'categories', cat1.id), { order: order2 }, { merge: true });
      batch.set(doc(db, 'categories', cat2.id), { order: order1 }, { merge: true });

      await batch.commit();
      onRefreshData();
      setStatusMsg('Urutan kategori berhasil disimpan!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Gagal menata kategori:', err);
      alert('Gagal menata: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  // Reorder Products inside Category Swapping Positions
  const moveProductOrderByCat = async (productIndexInCategory: number, productsInCategory: Product[], direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? productIndexInCategory - 1 : productIndexInCategory + 1;
    if (targetIdx < 0 || targetIdx >= productsInCategory.length) return;

    try {
      setIsLoading(true);
      setStatusMsg('Menata ulang produk...');

      const prod1 = productsInCategory[productIndexInCategory];
      const prod2 = productsInCategory[targetIdx];

      const order1 = typeof prod1.order === 'number' ? prod1.order : productIndexInCategory + 1;
      const order2 = typeof prod2.order === 'number' ? prod2.order : targetIdx + 1;

      const finalOrder1 = order2;
      const finalOrder2 = order1 === order2 ? order1 + 1 : order1;

      const batch = writeBatch(db);
      batch.set(doc(db, 'products', prod1.id), { order: finalOrder1 }, { merge: true });
      batch.set(doc(db, 'products', prod2.id), { order: finalOrder2 }, { merge: true });

      await batch.commit();
      onRefreshData();
      setStatusMsg('Urutan produk berhasil disimpan!');
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err: any) {
      console.error('Gagal menata produk:', err);
      alert('Gagal menata produk: ' + (err.message || String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualOrderUpdate = async (productId: string, newOrder: number) => {
    try {
      setIsLoading(true);
      setStatusMsg('Memperbarui urutan...');
      await updateDoc(doc(db, 'products', productId), { order: newOrder });
      onRefreshData();
      setStatusMsg('Urutan diperbarui!');
      setTimeout(() => setStatusMsg(null), 2000);
    } catch (err: any) {
      console.error('Gagal update urutan:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProductForm = () => (
    <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">ID Unik Produk (*)</label>
        <input
          type="text"
          name="id"
          disabled={!!editingProduct}
          value={productForm.id}
          onChange={handleProductInputChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Nama Produk (*)</label>
        <input
          type="text"
          name="name"
          value={productForm.name}
          onChange={handleProductInputChange}
          placeholder="Sayap Ayam Segar"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Kategori (*)</label>
        <select
          name="category"
          value={productForm.category}
          onChange={handleProductInputChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
        >
          {currentCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.id})
            </option>
          ))}
        </select>
        {editingProduct && productForm.category !== editingProduct.category && (
          <p className="text-[9px] text-emerald-600 font-bold mt-1 animate-pulse">
            ✨ Produk akan berpindah kategori setelah disimpan.
          </p>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Satuan Jual (*)</label>
        <input
          type="text"
          name="unit"
          value={productForm.unit}
          onChange={handleProductInputChange}
          placeholder="Kg atau Pack"
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Harga Eceran Normal (Rp) (*)</label>
        <input
          type="number"
          name="priceNormal"
          value={productForm.priceNormal}
          onChange={handleProductInputChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-mono font-bold"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Harga Diskon / Promo (Rp)</label>
        <input
          type="number"
          name="priceDiscount"
          value={productForm.priceDiscount}
          onChange={handleProductInputChange}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-mono font-bold text-rose-600"
        />
      </div>

      <div className="bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100 flex flex-col gap-3">
        <h6 className="text-[10px] font-black text-emerald-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-emerald-100 pb-1.5 mb-1">
          <Sparkles className="w-3 h-3" />
          <span>Skema Harga Grosir</span>
        </h6>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-[9px] font-bold text-emerald-700 mb-1">G1 (Min. 10 {productForm.unit})</label>
            <input
              type="number"
              name="priceGrosir1"
              value={productForm.priceGrosir1}
              onChange={handleProductInputChange}
              className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs focus:outline-emerald-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-emerald-700 mb-1">G2 (Min. 100 {productForm.unit})</label>
            <input
              type="number"
              name="priceGrosir2"
              value={productForm.priceGrosir2}
              onChange={handleProductInputChange}
              className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs focus:outline-emerald-600 font-mono"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold text-emerald-700 mb-1">G3 (Min. 500 {productForm.unit})</label>
            <input
              type="number"
              name="priceGrosir3"
              value={productForm.priceGrosir3}
              onChange={handleProductInputChange}
              className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs focus:outline-emerald-600 font-mono"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Gambar Ilustrasi Produk (*)</label>
        
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 px-1 py-1 bg-slate-100 rounded-xl mb-2 border border-slate-200/50">
          <button
            type="button"
            onClick={() => setProductImgMode('url')}
            className={`py-1 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
              productImgMode === 'url'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <span>🔗 LINK</span>
          </button>
          <button
            type="button"
            onClick={() => setProductImgMode('upload')}
            className={`py-1 rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer ${
              productImgMode === 'upload'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-emerald-700'
            }`}
          >
            <span>📷 UPLOAD</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="space-y-3 bg-slate-50 border border-slate-150 p-2.5 rounded-xl">
          {/* Live Preview Card */}
          {productForm.imageUrl ? (
            <div className="flex items-center gap-2.5">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-white relative group shrink-0 shadow-3xs">
                <img
                  src={productForm.imageUrl}
                  alt="Pratinjau"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=150';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                  className="absolute inset-0 bg-red-600/90 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[8px] font-black transition duration-200 rounded-xl"
                >
                  HAPUS
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black text-emerald-700 uppercase tracking-tight font-mono">Foto Sinkron</div>
                <p className="text-[8px] text-slate-500 truncate" title={productForm.imageUrl}>
                  {productForm.imageUrl.startsWith('data:') ? 'LOKAL (BASE64)' : productForm.imageUrl}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 py-1">
              <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center text-slate-400 shrink-0">
                <Image className="w-4 h-4 text-slate-300" />
              </div>
              <div>
                <div className="text-[9px] font-black text-rose-500 uppercase tracking-tight font-mono">TIDAK ADA FOTO</div>
                <p className="text-[8px] text-slate-400 leading-tight">Wajib diisi agar tampil.</p>
              </div>
            </div>
          )}

          {productImgMode === 'url' ? (
            <input
              type="text"
              name="imageUrl"
              value={productForm.imageUrl.startsWith('data:image') ? '' : productForm.imageUrl}
              onChange={handleProductInputChange}
              placeholder="Tempel link foto..."
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px] focus:outline-emerald-600 shadow-3xs font-medium"
            />
          ) : (
            <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-xl cursor-pointer border border-emerald-200 transition w-full">
              <Upload className="w-3 h-3" />
              <span>PILIH BERKAS</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'productForm', 'imageUrl')}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="sm:col-span-2">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 font-mono">Deskripsi Tambahan (*)</label>
        <textarea
          name="description"
          rows={2}
          value={productForm.description}
          onChange={handleProductInputChange}
          placeholder="Cita rasa, kegunaan serta kualitas kemasan..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-medium"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="inline-flex items-center gap-3 cursor-pointer mt-1 bg-slate-50 border border-slate-200/80 hover:bg-slate-100/50 w-full p-3.5 rounded-2xl transition select-none">
          <input
            type="checkbox"
            name="visible"
            checked={productForm.visible !== false}
            onChange={handleProductInputChange}
            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350 cursor-pointer"
          />
          <div className="text-left">
            <span className="block text-[11px] font-black text-slate-800 uppercase tracking-tight font-sans">Tampilkan di Katalog</span>
            <span className="block text-[9px] text-slate-500 leading-tight font-medium mt-0.5">
              Jika aktif, produk akan terlihat oleh pengunjung website.
            </span>
          </div>
        </label>
      </div>

      <div className="sm:col-span-2 flex justify-end gap-2.5 pt-3 border-t border-slate-100 mt-2">
        <button
          type="button"
          onClick={() => {
            setIsProductFormOpen(false);
            setEditingProduct(null);
          }}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black px-5 py-2.5 rounded-xl cursor-pointer transition uppercase tracking-wider"
        >
          BATAL
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-8 py-2.5 rounded-xl cursor-pointer shadow-lg shadow-emerald-600/30 transition uppercase tracking-widest disabled:opacity-50"
        >
          <span>{editingProduct ? 'SIMPAN PERUBAHAN' : 'TAMBAH PRODUK SEKARANG'}</span>
        </button>
      </div>
    </form>
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSettingsForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProductForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setProductForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: 'productForm' | 'settingsForm',
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("Ukuran berkas terlalu besar. Maksimal 15MB sebelum kompresi.");
      return;
    }

    // Reset input value so user can upload the same file again if desired
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Smarter dimension & quality constraints depending on target document
        // Products are stored as individual documents (safe up to 1MB)
        // Settings are stored together in a single 'global' document (easily hits 1MB if too big)
        const maxDim = setter === 'productForm' ? 700 : 500;
        const quality = setter === 'productForm' ? 0.72 : 0.55;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          if (setter === 'productForm') {
            setProductForm(prev => ({ ...prev, [fieldName]: compressedBase64 }));
          } else {
            setSettingsForm(prev => ({ ...prev, [fieldName]: compressedBase64 }));
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className={isFullScreen ? "fixed inset-0 z-50 overflow-hidden bg-slate-50 flex flex-col justify-between" : "fixed inset-0 z-50 overflow-hidden flex justify-end"}>
      {/* Background Dim Backdrop */}
      {!isFullScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900"
        />
      )}

      {/* Main Admin Sidebar Area */}
      <motion.div
        initial={isFullScreen ? { opacity: 0, scale: 0.99 } : { x: '100%' }}
        animate={isFullScreen ? { opacity: 1, scale: 1 } : { x: 0 }}
        exit={isFullScreen ? { opacity: 0, scale: 0.99 } : { x: '100%' }}
        transition={isFullScreen ? { duration: 0.25, ease: 'easeOut' } : { type: 'spring', damping: 26, stiffness: 180 }}
        className={isFullScreen
          ? "relative h-full w-full bg-slate-50 flex flex-col justify-between overflow-hidden z-10"
          : "relative h-full w-full max-w-full md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-slate-50 shadow-2xl flex flex-col justify-between overflow-hidden z-10"
        }
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {isAdminLoggedIn && (
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(prev => !prev)}
                className="md:hidden bg-slate-900 hover:bg-slate-800 text-white p-2.5 rounded-xl cursor-pointer transition focus:outline-none flex items-center justify-center shadow-sm animate-pulse"
                title="Buka Menu"
              >
                <Menu className="w-5 h-5 text-emerald-400" />
              </button>
            )}
            <div className={`${isAdminLoggedIn ? 'hidden md:flex' : 'flex'} bg-slate-900 text-white p-2.5 rounded-xl`}>
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>Panel Pengelola Landing Page</span>
                <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-md uppercase font-mono tracking-wider border border-slate-200">
                  Admin ONLY
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Sesuaikan teks, visual, struktur penawaran, dan daftar katalog produk.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={isFullScreen
              ? "px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-slate-200 shadow-sm"
              : "p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
            }
            title={isFullScreen ? "Keluar ke Beranda" : "Tutup Panel"}
          >
            {isFullScreen ? (
              <>
                <Home className="w-4 h-4 text-slate-500" />
                <span>Keluar ke Beranda</span>
              </>
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
          
          {/* AUTH GATE */}
          {!isAdminLoggedIn ? (
            <div className="flex-1 overflow-y-auto p-5 flex items-center justify-center bg-slate-50 w-full h-full">
              {/* Diagnostic status line */}
              {statusMsg && (
                <div className="absolute top-4 right-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-2 px-3 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-pulse z-20">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMsg}</span>
                </div>
              )}
              <div className="max-w-md w-full py-12 px-6 bg-white border border-slate-200/80 rounded-3xl shadow-xl space-y-6 relative">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100 shadow-sm">
                  <Key className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-slate-800">Autentikasi Pengelola</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Silakan masukkan akun email pengelola yang terdaftar untuk melanjutkan konfigurasi harian.
                </p>
              </div>

              {loginAttempts >= 2 && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="font-extrabold text-rose-900 text-xs uppercase tracking-wider">Akses Terkunci Sementara</h4>
                    <p className="text-slate-650 text-xs mt-1 font-medium leading-relaxed">
                      Hubungi pengelola utama demi alasan keamanan. Tombol masuk telah dinonaktifkan secara permanen pada perangkat ini karena terdeteksi percobaan masuk pelanggan.
                    </p>
                  </div>
                </div>
              )}

              {authError && loginAttempts < 2 && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                    Email Pengelola
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@supplier.com"
                    disabled={isLoading || loginAttempts >= 2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 font-mono">
                    Password Sesi
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    disabled={isLoading || loginAttempts >= 2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner disabled:opacity-50"
                  />
                </div>


                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || loginAttempts >= 2}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-emerald-600/35 hover:scale-[1.01] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:bg-emerald-600 disabled:scale-100 disabled:cursor-not-allowed"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Masuk Sesi Pengelola</span>
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-100 pt-4 flex flex-col items-center gap-2">
                <div className="text-[10px] text-slate-400 font-mono text-center">
                  💡 Autentikasi Pengelola Terenkripsi Ke Database Firebase.
                </div>
              </div>

              </div>
            </div>
          ) : (
            /* CONTROL PANEL CONTENT (LOGGED IN) */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full relative">
              
              {/* BACKDROP OVERLAY FOR MOBILE SIDEBAR */}
              {isMobileSidebarOpen && (
                <div 
                  className="fixed inset-0 bg-slate-950/70 z-30 md:hidden transition-opacity duration-300"
                  onClick={() => setIsMobileSidebarOpen(false)}
                />
              )}

              {/* LEFT SIDEBAR (SLIDING DRAWER ON MOBILE, FIXED ON DESKTOP) */}
              <div className={`
                fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out md:static md:translate-x-0
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
              `}>
                {/* Brand / Title section */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white p-2 rounded-xl">
                      <Home className="w-4 h-4 text-emerald-100" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-white tracking-tight uppercase">Haylofress ERP</h3>
                      <p className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-wider">Control Hub</p>
                    </div>
                  </div>
                  {/* Close button inside sidebar on mobile */}
                  <button
                    type="button"
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="md:hidden p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Vertical menu tabs */}
                <div className="p-4 flex-1 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => { setActiveTab('dashboard'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'dashboard'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>📊 Dashboard Utama</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('whatsapp'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Clipboard className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Pesanan ({orderStats.baru + orderStats.diproses + orderStats.dikirim})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('carts'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'carts'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Keranjang ({cartStats.activeCount + cartStats.checkoutCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('products'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'products'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Katalog Produk ({currentProducts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('layout-order'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'layout-order'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Layout & Kategori</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('bundles'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'bundles'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Gift className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Promo & Bundling ({currentBundles.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('landing'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'landing'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Settings className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Struktur Landing Page</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setActiveTab('admins'); setIsMobileSidebarOpen(false); }}
                    className={`w-full py-3 px-4 text-xs font-black rounded-xl transition cursor-pointer flex items-center gap-3 text-left ${
                      activeTab === 'admins'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-450 hover:text-slate-100 hover:bg-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0 text-slate-450" />
                    <span>Kelola Admin ({adminsList.length})</span>
                  </button>
                </div>

                {/* Session & Action Area inside Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3 shrink-0">
                  <div className="space-y-0.5">
                    <span className="text-[9px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider truncate block w-fit max-w-full">
                      Sesi: {auth.currentUser?.email?.split('@')[0]}
                    </span>
                    <p className="text-[10px] text-slate-500 font-mono truncate">
                      {auth.currentUser?.email}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSeedDefaults}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] font-bold px-1.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition text-slate-200"
                      title="Seeding data catalog default"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-400" />
                      <span>Default</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-rose-600/90 hover:bg-rose-700 text-white text-[10px] font-extrabold px-1.5 py-1.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT CONTENT WORKSPACE */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative">
                {/* Diagnostic status line */}
                {statusMsg && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs py-2 px-3 rounded-lg font-bold flex items-center gap-2 shadow-sm animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{statusMsg}</span>
                  </div>
                )}

              {/* TAB 0: ERP DASHBOARD UTAMA */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6 animate-fade-in font-sans">
                  
                  {/* Dashboard Header Summary Info */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-extrabold uppercase font-mono tracking-wider">
                          Haylofress ERP Suite
                        </span>
                        <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
                      </div>
                      <h2 className="text-xl font-black text-slate-100 tracking-tight mt-1.5">
                        Dasbor Kontrol Pengelola & Akuntansi Toko
                      </h2>
                      <p className="text-xs text-slate-400 mt-1 max-w-xl">
                        Akses real-time data penjualan, pemantauan status pesanan, analitik lalu lintas, kontrol promosi voucher, serta pelacakan resi pengiriman dalam satu pintu terintegrasi.
                      </p>
                    </div>
                    <div className="flex gap-3 bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 shrink-0">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Status Sinkronisasi</span>
                        <span className="text-xs font-black text-emerald-400 font-mono flex items-center justify-end gap-1 mt-0.5">
                          <Check className="w-3.5 h-3.5" /> Terhubung Cloud
                        </span>
                      </div>
                    </div>
                  </div>

                   {/* SUB-TAB CONTENT RENDERING */}
                  
                  {/* SUB-TAB 1: RINGKASAN PENJUALAN */}
                  {true && (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* Bento 4 Metrics Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* Omzet Hari Ini */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
                          <div className="absolute top-0 right-0 h-20 w-20 bg-emerald-50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition duration-300" />
                          <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2.5 py-0.8 rounded-md font-mono tracking-wider">
                            Hari Ini
                          </span>
                          <p className="text-xs text-slate-400 font-bold mt-2.5">Omzet Penjualan</p>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                            Rp {salesSummary.today.toLocaleString('id-ID')}
                          </h3>
                          <span className="text-[10px] text-emerald-600 font-extrabold mt-1.5 inline-block font-mono bg-emerald-50 px-1.5 py-0.2 rounded">
                            ↑ Real-Time Sync
                          </span>
                        </div>

                        {/* Omzet Kemarin */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
                          <div className="absolute top-0 right-0 h-20 w-20 bg-slate-50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition duration-300" />
                          <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2.5 py-0.8 rounded-md font-mono tracking-wider">
                            Kemarin
                          </span>
                          <p className="text-xs text-slate-400 font-bold mt-2.5">Omzet Penjualan</p>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                            Rp {salesSummary.yesterday.toLocaleString('id-ID')}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-bold mt-1.5 inline-block font-mono bg-slate-50 px-1.5 py-0.2 rounded">
                            Tutup Buku Harian
                          </span>
                        </div>

                        {/* Omzet 7 Hari Terakhir */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
                          <div className="absolute top-0 right-0 h-20 w-20 bg-indigo-50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition duration-300" />
                          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.8 rounded-md font-mono tracking-wider">
                            7 Hari Terakhir
                          </span>
                          <p className="text-xs text-slate-400 font-bold mt-2.5">Omzet Penjualan</p>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                            Rp {salesSummary.last7Days.toLocaleString('id-ID')}
                          </h3>
                          <span className="text-[10px] text-indigo-600 font-extrabold mt-1.5 inline-block font-mono bg-indigo-50 px-1.5 py-0.2 rounded">
                            Rerata: Rp {Math.round(salesSummary.last7Days / 7).toLocaleString('id-ID')}/hari
                          </span>
                        </div>

                        {/* Omzet 30 Hari Terakhir */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition relative overflow-hidden group">
                          <div className="absolute top-0 right-0 h-20 w-20 bg-amber-50 rounded-full translate-x-6 -translate-y-6 group-hover:scale-110 transition duration-300" />
                          <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-0.8 rounded-md font-mono tracking-wider">
                            30 Hari Terakhir
                          </span>
                          <p className="text-xs text-slate-400 font-bold mt-2.5">Omzet Penjualan</p>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-0.5">
                            Rp {salesSummary.last30Days.toLocaleString('id-ID')}
                          </h3>
                          <span className="text-[10px] text-amber-600 font-extrabold mt-1.5 inline-block font-mono bg-amber-50 px-1.5 py-0.2 rounded">
                            Akumulasi Omzet Bulanan
                          </span>
                        </div>

                      </div>

                      {/* Interactive Sales Chart (Pure Custom SVG for Bulletproof Execution) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5 font-sans">
                              <span>Grafik Tren Penjualan Harian (7 Hari Terakhir)</span>
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Visualisasi fluktuasi omset harian toko bahan pokok segar Haylofress Ngawi.
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">
                            Mata Uang: IDR (Rupiah)
                          </span>
                        </div>

                        {/* Render beautiful interactive SVG bar chart */}
                        {(() => {
                          const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - i);
                            const dateString = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
                            
                            // Sum total for that specific day
                            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
                            const dayEnd = dayStart + 24 * 60 * 60 * 1000;
                            
                            let total = 0;
                            dashboardOrders.forEach((o: any) => {
                              if (o.status === 'retur') return;
                              const orderTime = new Date(o.createdAt).getTime();
                              if (orderTime >= dayStart && orderTime < dayEnd) {
                                total += Number(o.total || 0);
                              }
                            });
                            
                            return { dateString, total };
                          }).reverse();

                          const maxVal = Math.max(...last7DaysData.map(d => d.total), 100000);
                          
                          return (
                            <div className="space-y-4">
                              <div className="h-64 w-full flex items-end gap-3.5 pt-6 pb-2 px-4 border-b border-slate-100 relative">
                                {/* Grid background lines */}
                                <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-100" />
                                <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-100" />
                                <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-100" />
                                
                                {last7DaysData.map((d, index) => {
                                  // Compute height percentage
                                  const heightPercent = Math.min((d.total / maxVal) * 100, 100);
                                  
                                  return (
                                    <div key={index} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                                      {/* Bar value tooltip */}
                                      <div className="absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition duration-200 z-10 font-mono shadow-md font-extrabold">
                                        Rp {d.total.toLocaleString('id-ID')}
                                      </div>
                                      
                                      {/* Bar shape */}
                                      <div 
                                        style={{ height: `${heightPercent || 5}%` }}
                                        className={`w-full rounded-t-lg transition-all duration-500 hover:scale-x-105 ${
                                          d.total > 0 
                                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-700 group-hover:to-emerald-500 shadow-sm'
                                            : 'bg-slate-100 border border-slate-200 border-dashed'
                                        }`}
                                      />
                                      
                                      {/* Bar Label */}
                                      <span className="text-[10px] text-slate-500 font-extrabold mt-2 font-sans truncate max-w-full block">
                                        {d.dateString}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Top Selling Products List */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                        <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-mono">
                          🏆 Produk Terlaris Teratas (Best Sellers)
                        </h4>
                        
                        <div className="overflow-x-auto rounded-xl border border-slate-150">
                          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9.5px] font-mono tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Nama Produk Segar</th>
                                <th className="px-4 py-3 text-center">Jumlah Terjual</th>
                                <th className="px-4 py-3 text-right">Pemasukan Kotor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                              {(() => {
                                // Calculate product sales counts from dashboardOrders
                                const salesCounts: { [name: string]: { qty: number, total: number } } = {};
                                dashboardOrders.forEach((o: any) => {
                                  if (o.status === 'retur') return;
                                  o.items.forEach((it: any) => {
                                    if (!salesCounts[it.name]) {
                                      salesCounts[it.name] = { qty: 0, total: 0 };
                                    }
                                    salesCounts[it.name].qty += Number(it.quantity || 0);
                                    salesCounts[it.name].total += Number(it.subtotal || 0);
                                  });
                                });

                                const salesList = Object.entries(salesCounts)
                                  .map(([name, stat]) => ({ name, qty: stat.qty, total: stat.total }))
                                  .sort((a, b) => b.qty - a.qty)
                                  .slice(0, 3);

                                if (salesList.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan={3} className="px-4 py-6 text-center text-slate-400 font-medium">
                                        Belum ada data penjualan tercatat.
                                      </td>
                                    </tr>
                                  );
                                }

                                return salesList.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-slate-55/50 transition">
                                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-1.5">
                                      <span className="text-amber-500">🏆 {idx + 1}</span>
                                      <span>{p.name}</span>
                                    </td>
                                    <td className="px-4 py-3 text-center font-extrabold font-mono text-slate-600">
                                      {p.qty}x
                                    </td>
                                    <td className="px-4 py-3 text-right font-black font-mono text-emerald-600">
                                      Rp {p.total.toLocaleString('id-ID')}
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: PESANAN */}
                  {false && (
                    <div className="space-y-6 animate-fade-in text-left">
                      
                      {/* Search & Status Filters */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              Manajemen Alur Kerja Pesanan Pelanggan
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Lacak status pengerjaan, ubah status, masukkan nomor resi waybill, atau cetak slip pengiriman.
                            </p>
                          </div>
                        </div>

                        {/* Order status badges filter row */}
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {['semua', 'baru', 'diproses', 'dikirim', 'selesai', 'retur'].map((cat) => {
                            let count = 0;
                            if (cat === 'semua') count = dashboardOrders.length;
                            else count = dashboardOrders.filter(o => o.status === cat).length;

                            let color = 'bg-slate-100 text-slate-600';
                            if (cat === 'baru') color = 'bg-red-50 text-red-700 border-red-100 border';
                            else if (cat === 'diproses') color = 'bg-blue-50 text-blue-700 border-blue-100 border';
                            else if (cat === 'dikirim') color = 'bg-amber-50 text-amber-700 border-amber-100 border';
                            else if (cat === 'selesai') color = 'bg-emerald-50 text-emerald-700 border-emerald-100 border';
                            else if (cat === 'retur') color = 'bg-purple-50 text-purple-700 border-purple-100 border';

                            return (
                              <button
                                key={cat}
                                type="button"
                                className="px-3 py-1.5 rounded-lg text-xs font-extrabold capitalize flex items-center gap-1.5 transition whitespace-nowrap border cursor-pointer border-transparent"
                              >
                                <span className={color}>{cat}</span>
                                <span className="bg-white px-1.5 py-0.2 rounded font-mono font-black border border-slate-200 text-slate-700 text-[10px]">
                                  {count}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Active Orders List */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {dashboardOrders.map((o) => {
                          
                          // WA prefilled template text
                          let waMessage = '';
                          const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '');
                          
                          if (o.status === 'baru') {
                            waMessage = `Halo Kak *${o.customerName}*,\n\nTerima kasih, pesanan bahan pokok segar Kakak senilai *Rp ${o.total.toLocaleString('id-ID')}* telah kami terima di *Haylofress Ngawi*! 😊\n\nSedang kami jadwalkan untuk dipersiapkan oleh tim pengemas. Mohon ditunggu ya! 🌿`;
                          } else if (o.status === 'diproses') {
                            waMessage = `Halo Kak *${o.customerName}*,\n\nKabar gembira! Pesanan Kakak di *Haylofress Ngawi* sedang dikemas dengan rapi oleh tim kami untuk memastikan kesegarannya terjaga sampai ke rumah Kakak. 🥦🥩`;
                          } else if (o.status === 'dikirim') {
                            waMessage = `Halo Kak *${o.customerName}*,\n\nPesanan Kakak telah dikirim dari toko kami! 🚚💨\n\nNo. Resi Pelacakan: *${o.waybill || '-'}*\n\nTerima kasih banyak telah mempercayakan kebutuhan konsumsi keluarga kepada kami. Have a fresh day! 🌿`;
                          } else if (o.status === 'selesai') {
                            waMessage = `Halo Kak *${o.customerName}*,\n\nTerima kasih banyak telah berbelanja di *Haylofress Ngawi*! 😊\n\nSemoga seluruh bahan segar yang dikirim memuaskan ya Kak. Ditunggu pesanan berikutnya! Have a wonderful day! 🌿`;
                          } else {
                            waMessage = `Halo Kak *${o.customerName}*,\n\nTerkait permintaan pengembalian (retur) pesanan Kakak, kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan yang terjadi. Admin kami akan segera membantu proses verifikasi dan refund. Terima kasih atas pengertiannya. 🙏`;
                          }

                          const waLink = `https://wa.me/${cleanPhone(o.customerPhone)}?text=${encodeURIComponent(waMessage)}`;

                          return (
                            <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-wider">{o.id}</span>
                                    <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{o.customerName}</h4>
                                  </div>
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                    o.status === 'baru' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    o.status === 'diproses' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                    o.status === 'dikirim' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    o.status === 'selesai' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                    'bg-purple-100 text-purple-700 border border-purple-200'
                                  }`}>
                                    {o.status}
                                  </span>
                                </div>

                                <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                                  <p>📞 No WA: <strong className="text-slate-800">{o.customerPhone}</strong></p>
                                  <p>📍 Alamat: <span className="text-slate-700 font-medium">{o.address}</span></p>
                                  {o.notes && <p>📝 Catatan: <span className="text-slate-700 italic">"{o.notes}"</span></p>}
                                  {o.waybill && <p>🚚 No. Resi: <strong className="text-indigo-600">{o.waybill}</strong></p>}
                                </div>

                                {/* Items purchased list */}
                                <div className="space-y-1.5">
                                  <span className="text-[10px] uppercase font-black tracking-wide text-slate-400 font-mono">Daftar Belanja:</span>
                                  <div className="space-y-1 max-h-24 overflow-y-auto pl-1">
                                    {o.items.map((it: any, i: number) => (
                                      <div key={i} className="text-xs text-slate-600 flex justify-between">
                                        <span>• {it.name} ({it.quantity} {it.unit || 'Kg'})</span>
                                        <span className="font-mono text-slate-800 font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-450 uppercase font-black font-mono">Total Transaksi:</span>
                                  <span className="text-base font-black text-emerald-600 font-mono">Rp {o.total.toLocaleString('id-ID')}</span>
                                </div>

                                {/* Actions row */}
                                <div className="grid grid-cols-2 gap-2">
                                  {o.status === 'baru' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, 'diproses')}
                                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                      <span>Proses Pesanan</span>
                                    </button>
                                  )}

                                  {o.status === 'diproses' && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedOrderForShipping(o)}
                                      className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Truck className="w-3.5 h-3.5" />
                                      <span>Kirim (Input Resi)</span>
                                    </button>
                                  )}

                                  {o.status === 'dikirim' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, 'selesai')}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Selesai Belanja</span>
                                    </button>
                                  )}

                                  {o.status !== 'retur' && o.status !== 'selesai' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateOrderStatus(o.id, 'retur')}
                                      className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-[11px] py-2 rounded-lg transition text-center cursor-pointer"
                                    >
                                      Simulasi Retur
                                    </button>
                                  )}

                                  {/* WhatsApp Follow-up */}
                                  <a
                                    href={waLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Follow Up WA</span>
                                  </a>

                                  {/* Print label button */}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedPickupOrder(o)} // Trigger print label modal
                                    className="col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Cetak Label Pengiriman (MOCK UP)</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 3: PRODUK */}
                  {false && (
                    <div className="space-y-6 animate-fade-in text-left">
                      {/* Products Status Overview cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Produk Aktif</span>
                            <h4 className="text-xl font-black text-slate-900 font-mono mt-0.5">{productStats.activeCount} Item</h4>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3.5 bg-red-100 text-red-700 rounded-xl">
                            <AlertCircle className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Stok Habis</span>
                            <h4 className="text-xl font-black text-slate-900 font-mono mt-0.5">{productStats.outOfStockCount} Item</h4>
                          </div>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex items-center gap-4">
                          <div className="p-3.5 bg-purple-100 text-purple-700 rounded-xl">
                            <AlertTriangle className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block tracking-wider">Produk Ditolak (Compliance)</span>
                            <h4 className="text-xl font-black text-slate-900 font-mono mt-0.5">{productStats.rejectedCount} Item</h4>
                          </div>
                        </div>

                      </div>

                      {/* Products Interactive status switcher table */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Kontrol Ketersediaan & Kepatuhan Produk
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Simulasikan perubahan status stok toko real-time atau simulasikan penangguhan produk untuk memverifikasi tata kelola kepatuhan regulatory.
                          </p>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-150">
                          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9.5px] font-mono tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Nama Produk</th>
                                <th className="px-4 py-3">Harga Base</th>
                                <th className="px-4 py-3">Status ERP</th>
                                <th className="px-4 py-3 text-right">Ubah Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {currentProducts.map((p) => {
                                const status = productStatuses[p.id] || 'active';
                                
                                return (
                                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                      <span>{p.name}</span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-600 font-bold">
                                      Rp {p.priceNormal.toLocaleString('id-ID')}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                        status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        status === 'out_of_stock' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        'bg-purple-50 text-purple-700 border border-purple-200'
                                      }`}>
                                        {status === 'active' ? 'Aktif' : status === 'out_of_stock' ? 'Stok Habis' : 'Compliance Rejected'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right">
                                      <div className="inline-flex gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateProductStatus(p.id, 'active')}
                                          className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer"
                                        >
                                          Aktifkan
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleUpdateProductStatus(p.id, 'out_of_stock')}
                                          className="text-[10px] font-bold px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200 transition cursor-pointer"
                                        >
                                          Set Habis
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateProductStatus(p.id, 'rejected');
                                            alert(`[SIMULASI REGULATOR] Produk "${p.name}" ditangguhkan penayangannya karena belum memenuhi standar dokumen BPOM/Sertifikasi Halal.`);
                                          }}
                                          className="text-[10px] font-bold px-2 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded border border-purple-200 transition cursor-pointer"
                                        >
                                          Simulasi Ditolak
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 4: PERFORMA TOKO */}
                  {true && (
                    <div className="space-y-6 text-left animate-fade-in border-t border-slate-200 pt-10 mt-10">
                      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <span>⭐ Performa Toko & Kepuasan Pelanggan</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Umpan balik pembeli, rating rata-rata kepuasan pelanggan, serta simulasi ulasan produk baru.
                        </p>
                      </div>
                      
                      {/* Store KPI meters */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        
                        {/* Rating Card */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Rating Toko</span>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-2xl font-black text-slate-900 font-mono">
                              {(recentReviews.reduce((sum, r) => sum + r.rating, 0) / (recentReviews.length || 1)).toFixed(1)}
                            </h4>
                            <div className="flex text-amber-500">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Berdasarkan {recentReviews.length} ulasan pembeli</p>
                        </div>

                        {/* Chat Response SLA */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Respons Chat</span>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-2xl font-black text-slate-900 font-mono">99.4%</h4>
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Sangat Baik</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Rerata Kecepatan Balas: 4 menit</p>
                        </div>

                        {/* Shipment SLA */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">SLA Pengiriman</span>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-2xl font-black text-slate-900 font-mono">98.7%</h4>
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide">On-Time</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Rerata packing & pick up: 1.2 jam</p>
                        </div>

                        {/* Cancellation Rate */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Tingkat Pembatalan</span>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-2xl font-black text-slate-900 font-mono">0.4%</h4>
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wide">Sangat Aman</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">Melampaui target standar ERP (&lt;1%)</p>
                        </div>

                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Simulation: Receive Review */}
                        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-mono">
                            ✍️ Simulasi Umpan Balik / Review Baru
                          </h4>
                          
                          <form onSubmit={handleAddReview} className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Nama Pembeli</label>
                              <input
                                type="text"
                                value={newReviewAuthor}
                                onChange={(e) => setNewReviewAuthor(e.target.value)}
                                placeholder="Contoh: Ibu Rina Ngawi"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Nilai Bintang (Rating)</label>
                              <select
                                value={newReviewRating}
                                onChange={(e) => setNewReviewRating(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-bold text-slate-800"
                              >
                                <option value="5">⭐⭐⭐⭐⭐ (5 - Sangat Puas)</option>
                                <option value="4">⭐⭐⭐⭐ (4 - Puas)</option>
                                <option value="3">⭐⭐⭐ (3 - Cukup)</option>
                                <option value="2">⭐⭐ (2 - Kurang)</option>
                                <option value="1">⭐ (1 - Buruk)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Catatan Ulasan</label>
                              <textarea
                                value={newReviewText}
                                onChange={(e) => setNewReviewText(e.target.value)}
                                placeholder="Tulis testimoni pembeli..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition h-16 resize-none"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                            >
                              Kirim Simulasi Ulasan
                            </button>
                          </form>
                        </div>

                        {/* Recent Reviews Stream */}
                        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">
                            📜 Riwayat Testimoni & Ulasan Terakhir
                          </h4>

                          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                            {recentReviews.map((r, i) => (
                              <div key={r.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-1 flex flex-col">
                                <div className="flex items-center justify-between">
                                  <strong className="text-xs text-slate-900 font-bold">{r.author}</strong>
                                  <span className="text-[10px] font-mono text-slate-450">{r.date}</span>
                                </div>
                                <div className="flex text-amber-500">
                                  {Array.from({ length: r.rating }).map((_, st) => (
                                    <Star key={st} className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  ))}
                                </div>
                                <p className="text-xs text-slate-600 leading-normal italic">
                                  "{r.text}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 5: ANALITIK */}
                  {true && (
                    <div className="space-y-6 text-left animate-fade-in border-t border-slate-200 pt-10 mt-10">
                      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <span>📊 Analitik Trafik Pengunjung</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Statistik kunjungan halaman harian serta visualisasi corong konversi (conversion funnel).
                        </p>
                      </div>
                      {/* Traffic stats widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Total Trafik</span>
                          <h4 className="text-2xl font-black text-slate-900 font-mono">
                            {analyticsStats.pageViews} <span className="text-xs font-normal text-slate-500">Kunjungan</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">Berdasarkan log server Meta Pixel</p>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Rasio Konversi (CVR)</span>
                          <h4 className="text-2xl font-black text-slate-900 font-mono">
                            {((analyticsStats.purchaseCount / (analyticsStats.pageViews || 1)) * 100).toFixed(1)}%
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">Pengunjung menjadi Pembeli</p>
                        </div>

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono tracking-wider">Estimasi GMV</span>
                          <h4 className="text-2xl font-black text-emerald-600 font-mono">
                            Rp {analyticsStats.totalSales.toLocaleString('id-ID')}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium">Dari checkout WhatsApp sukses</p>
                        </div>

                      </div>

                      {/* Conversion Funnel visualizer */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Corong Konversi Pembelian (Conversion Funnel)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Visualisasi persentase penurunan konversi pelanggan sejak membuka Landing Page hingga menekan tombol Pesan via WhatsApp.
                          </p>
                        </div>

                        {/* Funnel bars */}
                        {(() => {
                          const steps = [
                            { name: "Kunjungan Landing Page (PageView)", value: analyticsStats.pageViews, color: "bg-slate-800" },
                            { name: "Tambah Produk Ke Troli (AddToCart)", value: analyticsStats.addToCartCount, color: "bg-blue-600" },
                            { name: "Mengisi Formulir Alamat (InitiateCheckout)", value: analyticsStats.checkoutCount, color: "bg-amber-600" },
                            { name: "Kirim Transaksi Selesai (Purchase)", value: analyticsStats.purchaseCount, color: "bg-emerald-600" }
                          ];

                          const maxVal = Math.max(analyticsStats.pageViews, 1);

                          return (
                            <div className="space-y-4">
                              {steps.map((st, i) => {
                                const percent = (st.value / maxVal) * 100;
                                return (
                                  <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-700">
                                      <span>{st.name}</span>
                                      <span className="font-mono">{st.value} ({percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 h-6 rounded-lg overflow-hidden relative border border-slate-150">
                                      <div 
                                        style={{ width: `${percent || 1}%` }}
                                        className={`${st.color} h-full rounded-r-lg transition-all duration-1000 shadow-inner`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 6: PROMOSI */}
                  {false && (
                    <div className="space-y-6 text-left animate-fade-in">
                      
                      {/* Vouchers Manager block */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* Form: Add Voucher */}
                        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-mono">
                            🎫 Buat Kode Voucher Toko Baru
                          </h4>
                          
                          <form onSubmit={handleAddVoucher} className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Kode Voucher</label>
                              <input
                                type="text"
                                value={newVoucherCode}
                                onChange={(e) => setNewVoucherCode(e.target.value)}
                                placeholder="Contoh: HAYLOHEMAT77"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-mono uppercase font-black tracking-wide"
                                required
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Tipe Potongan</label>
                                <select
                                  value={newVoucherType}
                                  onChange={(e) => setNewVoucherType(e.target.value as 'percentage' | 'fixed')}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-bold"
                                >
                                  <option value="percentage">Persen (%)</option>
                                  <option value="fixed">Rupiah (Rp)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Besaran Diskon</label>
                                <input
                                  type="number"
                                  value={newVoucherValue}
                                  onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                                  placeholder="Contoh: 10 atau 15000"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-mono font-bold"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Minimum Pembelian (IDR)</label>
                              <input
                                type="number"
                                value={newVoucherMin}
                                onChange={(e) => setNewVoucherMin(Number(e.target.value))}
                                placeholder="Contoh: 50000"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-mono font-bold"
                                required
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                            >
                              Buat Voucher
                            </button>
                          </form>
                        </div>

                        {/* Active Vouchers list */}
                        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">
                            🎟️ Voucher Aktif Toko saat ini
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {vouchers.map((v, i) => (
                              <div key={v.code || i} className="p-4 bg-emerald-50/55 rounded-xl border border-emerald-150 relative flex flex-col justify-between overflow-hidden group">
                                <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-100 rounded-full translate-x-4 -translate-y-4" />
                                <div>
                                  <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded font-black font-mono tracking-wide">
                                    {v.code}
                                  </span>
                                  <p className="text-xs text-slate-700 font-bold mt-2.5">
                                    Potongan {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value.toLocaleString('id-ID')}`}
                                  </p>
                                  <p className="text-[10.5px] text-slate-500 mt-1 font-mono">
                                    Min. Belanja: Rp {v.minPurchase.toLocaleString('id-ID')}
                                  </p>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVoucher(v.code)}
                                  className="self-end mt-4 text-[10px] font-black text-red-600 hover:text-red-800 transition bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded cursor-pointer"
                                >
                                  Hapus Voucher
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Advertising Campaigns (Facebook Ads ROI Spend Tracker) */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                              Kampanye Iklan & Pelacak Anggaran (Facebook/Instagram Ads Tracker)
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Lacak Return on Ad Spend (ROAS) dan total anggaran pengeluaran iklan Meta Pixel Anda.
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-150">
                          <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9.5px] font-mono tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Nama Kampanye Iklan</th>
                                <th className="px-4 py-3">Anggaran</th>
                                <th className="px-4 py-3">Terpakai</th>
                                <th className="px-4 py-3">Klik (CPC)</th>
                                <th className="px-4 py-3">Impressions</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Aksi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {campaigns.map((c) => (
                                  <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                                    <td className="px-4 py-3 font-mono">Rp {c.budget.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 font-mono text-slate-550">Rp {c.spend.toLocaleString('id-ID')}</td>
                                    <td className="px-4 py-3 font-mono">{c.clicks}</td>
                                    <td className="px-4 py-3 font-mono">{c.impressions}</td>
                                    <td className="px-4 py-3">
                                      <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                        c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                        c.status === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        'bg-slate-100 text-slate-650'
                                      }`}>
                                        {c.status}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleCampaignStatus(c.id)}
                                        className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-300 transition cursor-pointer"
                                      >
                                        Ubah Status
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 7: PENGIRIMAN */}
                  {true && (
                    <div className="space-y-6 text-left animate-fade-in border-t border-slate-200 pt-10 mt-10">
                      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                        <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                          <span>🚚 Penjadwalan & Pengiriman Paket Kurir</span>
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Layanan pickup instan kurir, pencetakan slip waybill fisik, dan log jadwal kurir aktif harian.
                        </p>
                      </div>
                      
                      {/* Courier Request Pickup scheduling form */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-mono flex items-center gap-1.5">
                            <Truck className="w-4 h-4" />
                            <span>Jadwalkan Pickup Kurir Ekspedisi</span>
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Simulasikan penjemputan paket massal oleh kurir rekanan untuk pesanan baru atau yang sedang diproses.
                          </p>
                          
                          <div className="space-y-3.5">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono">Pilih Kurir Ekspedisi</label>
                              <select
                                value={pickupCourier}
                                onChange={(e) => setPickupCourier(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 transition font-bold"
                              >
                                <option value="J&T Express">J&T Express ⚡</option>
                                <option value="Sicepat">SiCepat Ekspres 🚀</option>
                                <option value="JNE Express">JNE Express Standard</option>
                                <option value="Sameday GoSend">Sameday / Instant GoSend 🏍️</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-550 mb-1 font-mono font-mono">Pilih Pesanan Siap Kirim</label>
                              <div className="space-y-1.5 max-h-40 overflow-y-auto border border-slate-200 p-2 rounded-xl">
                                {dashboardOrders.filter(o => o.status === 'baru' || o.status === 'diproses').map((o) => (
                                  <button
                                    key={o.id}
                                    type="button"
                                    onClick={() => setSelectedPickupOrder(o)}
                                    className={`w-full text-left text-xs p-2 rounded-lg flex justify-between items-center transition cursor-pointer border ${
                                      selectedPickupOrder?.id === o.id
                                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <div>
                                      <p>{o.customerName}</p>
                                      <span className="text-[10px] font-mono text-slate-400 font-normal">{o.id}</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-600">Rp {o.total.toLocaleString('id-ID')}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (!selectedPickupOrder) return alert("Pilih satu pesanan untuk pickup kurir!");
                                handleRequestPickup(selectedPickupOrder);
                              }}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
                            >
                              Jadwalkan Penjemputan Paket
                            </button>
                          </div>
                        </div>

                        {/* Scheduled Pickups feed */}
                        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                          <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">
                            🗓️ Penjadwalan Pickup Aktif Hari Ini
                          </h4>

                          <div className="space-y-3">
                            {shippingPickups.length === 0 ? (
                              <div className="text-center text-slate-400 text-xs py-10 font-medium">
                                Belum ada kurir dijadwalkan menjemput hari ini.
                              </div>
                            ) : (
                              shippingPickups.map((p) => (
                                <div key={p.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-150 flex justify-between items-center">
                                  <div>
                                    <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.2 rounded font-mono font-black uppercase">
                                      {p.courier}
                                    </span>
                                    <h5 className="text-xs font-black text-slate-900 mt-1.5">{p.customerName}</h5>
                                    <p className="text-[10.5px] text-slate-450 font-mono mt-0.5">Order ID: {p.orderId}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase font-mono tracking-wider animate-pulse">
                                      Dijadwalkan
                                    </span>
                                    <p className="text-[10.5px] text-slate-500 font-mono mt-1">{p.scheduledAt}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* MODAL / POPUP: WAYBILL ENTRY FIELD */}
                  {selectedOrderForShipping && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-left font-sans space-y-4 relative">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForShipping(null)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase">Input Resi Pengiriman</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ketik resi ekspedisi untuk menandai pesanan {selectedOrderForShipping.customerName} telah terkirim.
                          </p>
                        </div>

                        <hr className="border-slate-100" />

                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 font-mono">Pilih Format Resi</label>
                            <div className="flex gap-1.5">
                              {["JN-202607-00", "SI-7788-XP", "JT-7799-OK"].map((pre) => (
                                <button
                                  key={pre}
                                  type="button"
                                  onClick={() => setShippingWaybill(pre + Math.floor(100 + Math.random() * 900))}
                                  className="text-[10px] bg-slate-50 border border-slate-200 px-2 py-1 rounded font-mono font-bold hover:bg-slate-100 cursor-pointer"
                                >
                                  {pre}xxx
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 font-mono">Nomor Resi Waybill</label>
                            <input
                              type="text"
                              value={shippingWaybill}
                              onChange={(e) => setShippingWaybill(e.target.value)}
                              placeholder="Masukkan resi ekspedisi..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-emerald-600 transition"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderForShipping(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold py-3 rounded-xl transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!shippingWaybill) return alert("Masukkan resi ekspedisi!");
                              handleSetOrderWaybill(selectedOrderForShipping.id, shippingWaybill);
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-3 rounded-xl shadow-lg transition cursor-pointer"
                          >
                            Simpan Resi
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MODAL / POPUP: PRINT SHIPPING LABEL (REPLY TO MEMO OF PRINTING LABELS EXCELLENTLY) */}
                  {selectedPickupOrder && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
                      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-left font-sans flex flex-col relative">
                        <button
                          type="button"
                          onClick={() => setSelectedPickupOrder(null)}
                          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition"
                        >
                          <X className="w-5 h-5" />
                        </button>

                        <div className="mb-4">
                          <h4 className="text-sm font-black text-slate-900 uppercase">Cetak Label Pengiriman</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Slip resmi pengiriman paket standard untuk ditempel pada box kemasan produk segar.
                          </p>
                        </div>

                        {/* Slip Printable Shape Layout */}
                        <div id="shipping-label-printable" className="p-5 border-4 border-slate-900 rounded-xl bg-white space-y-4">
                          <div className="flex justify-between items-center border-b-4 border-slate-900 pb-3">
                            <div>
                              <h2 className="text-base font-black text-slate-900 tracking-tight leading-none uppercase">HAYLOFRESS NGAWI</h2>
                              <p className="text-[9px] text-slate-500 font-semibold font-mono mt-0.5">Fresh Food & Groceries Delivery</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black font-mono border-2 border-slate-900 px-2 py-0.5 uppercase tracking-wide">
                                J&T REGULER
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-[11px] leading-tight border-b-2 border-slate-900 pb-3">
                            <div className="space-y-1 text-slate-700">
                              <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Pengirim:</span>
                              <strong className="text-slate-900">Haylofress Ngawi Office</strong>
                              <p>Jl. Ketonggo II Gg. Jalak No.21, Ketanggi, Kec. Ngawi, Jawa Timur</p>
                              <p>📞 6281234567890</p>
                            </div>
                            <div className="space-y-1 text-slate-700">
                              <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Penerima:</span>
                              <strong className="text-slate-900 text-sm">{selectedPickupOrder.customerName}</strong>
                              <p className="font-semibold text-slate-800">{selectedPickupOrder.address}</p>
                              <p>📞 {selectedPickupOrder.customerPhone}</p>
                            </div>
                          </div>

                          {/* Barcode Mock & QR codes block */}
                          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 text-slate-900">
                            <div className="space-y-1">
                              <span className="text-[9px] font-black text-slate-400 uppercase font-mono block">Nomor Resi / Invoice:</span>
                              <strong className="text-sm font-mono tracking-wider font-black">{selectedPickupOrder.waybill || 'JN-MOCK-PENDING'}</strong>
                              
                              {/* Simple Simulated Barcode */}
                              <div className="h-7 bg-slate-900 flex gap-0.5 items-stretch p-0.5 w-44 rounded">
                                {Array.from({ length: 30 }).map((_, bIdx) => (
                                  <div key={bIdx} style={{ width: `${(bIdx % 3 === 0) ? '3px' : '1px'}` }} className="bg-white" />
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col items-center">
                              {/* QR code block */}
                              <div className="h-14 w-14 border-2 border-slate-900 p-0.5 rounded flex flex-wrap gap-0.5">
                                {Array.from({ length: 16 }).map((_, qIdx) => (
                                  <div key={qIdx} className={`h-2.5 w-2.5 ${(qIdx * 7) % 3 === 0 ? 'bg-slate-900' : 'bg-white'}`} />
                                ))}
                              </div>
                              <span className="text-[8px] font-mono mt-1 font-bold">QR CODE</span>
                            </div>
                          </div>

                          {/* Items and totals list */}
                          <div className="space-y-2 text-[10.5px]">
                            <span className="text-[9px] font-black text-slate-450 uppercase font-mono block">Rincian Paket Belanja Segar:</span>
                            <div className="space-y-1">
                              {selectedPickupOrder.items.map((it: any, i: number) => (
                                <div key={i} className="flex justify-between font-bold text-slate-850">
                                  <span>🌱 {it.name} ({it.quantity} {it.unit || 'Kg'})</span>
                                </div>
                              ))}
                            </div>
                            {selectedPickupOrder.notes && (
                              <p className="p-2 bg-slate-50 border border-dashed border-slate-300 rounded font-semibold italic text-slate-700 text-[10px]">
                                Catatan Kurir: "{selectedPickupOrder.notes}"
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Controls for printing label */}
                        <div className="flex gap-2.5 pt-4">
                          <button
                            type="button"
                            onClick={() => setSelectedPickupOrder(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold py-3 rounded-xl transition cursor-pointer"
                          >
                            Tutup
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              window.print();
                            }}
                            className="flex-1 bg-slate-900 hover:bg-slate-850 text-white text-xs font-extrabold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                            <span>Cetak Slip Fisik</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 1: LANDING PAGE COPY */}
              {activeTab === 'landing' && (
                <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Form Editors for each section using Accordion style */}
                  <div className="lg:col-span-6 space-y-4">
                    <p className="text-xs text-slate-500 font-medium bg-white border border-slate-200/60 p-3 rounded-xl">
                      💡 Silakan pilih bagian komponen di bawah untuk menyesuaikan data teks & visual. Pratinjau (Preview) akan diperbarui secara instan pada kolom kanan. Jangan lupa klik <strong>Simpan Perubahan</strong> di bawah setelah selesai.
                    </p>

                    {/* SECTION 1: BERANDA / HERO */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('beranda')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'beranda' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Home className={`w-4 h-4 ${expandedSection === 'beranda' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Beranda (Hero & Banner)</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Judul, sub-judul, dan banner latar halaman depan</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'beranda' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'beranda' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Judul Utama Hero (Heading)
                                </label>
                                <input
                                  type="text"
                                  name="heroTitle"
                                  value={settingsForm.heroTitle}
                                  onChange={handleInputChange}
                                  placeholder="Daging Segar & Siap Olah Langsung Ke Dapur Anda."
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Paragraf Subtitle Hero (Deskripsi)
                                </label>
                                <textarea
                                  name="heroSubtitle"
                                  rows={3}
                                  value={settingsForm.heroSubtitle}
                                  onChange={handleInputChange}
                                  placeholder="Kini masak enak jauh lebih praktis dan hemat! Haylofress Ngawi menyediakan ayam segar..."
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                  Foto Ilustrasi Hero Banner
                                </label>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-3 mt-1.5">
                                    {settingsForm.heroImageUrl ? (
                                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group flex-shrink-0">
                                        <img
                                          src={settingsForm.heroImageUrl}
                                          alt="Hero preview"
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => setSettingsForm((prev) => ({ ...prev, heroImageUrl: '' }))}
                                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition duration-200"
                                        >
                                          Hapus
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-dashed flex items-center justify-center text-slate-400 bg-slate-50 flex-shrink-0">
                                        <Image className="w-5 h-5 text-slate-450" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-bold rounded-xl cursor-pointer border border-emerald-150 transition w-full">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Unggah Foto Banner</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => handleImageUpload(e, 'settingsForm', 'heroImageUrl')}
                                          className="hidden"
                                        />
                                      </label>
                                      <p className="text-[9px] text-slate-400 mt-1 leading-tight font-medium">
                                        Rasio lanskap disarankan. Foto akan dikompresi otomatis agar website super ringan.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-3 top-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">ATAU URL</span>
                                    <input
                                      type="text"
                                      name="heroImageUrl"
                                      value={settingsForm.heroImageUrl}
                                      onChange={handleInputChange}
                                      placeholder="Tempel link foto banner di sini..."
                                      className="w-full bg-white border border-slate-200 rounded-xl pl-20 pr-4 py-1.5 text-xs focus:outline-emerald-600"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 2: SOLUSI */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('solusi')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'solusi' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <HelpCircle className={`w-4 h-4 ${expandedSection === 'solusi' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Solusi & Kendala Dapur</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Bandingkan kerumitan lama VS solusi pintar Haylofress</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'solusi' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'solusi' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Sesi Masalah</label>
                                  <input
                                    type="text"
                                    name="problemTitle"
                                    value={settingsForm.problemTitle}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sub-judul Sesi Masalah</label>
                                  <input
                                    type="text"
                                    name="problemSubtitle"
                                    value={settingsForm.problemSubtitle}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Sesi Solusi</label>
                                  <input
                                    type="text"
                                    name="solutionTitle"
                                    value={settingsForm.solutionTitle}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Sub-judul Sesi Solusi</label>
                                  <input
                                    type="text"
                                    name="solutionSubtitle"
                                    value={settingsForm.solutionSubtitle}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 3: KEUNGGULAN */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('keunggulan')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'keunggulan' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${expandedSection === 'keunggulan' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Keunggulan Utama Toko</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Beban pilar standar kelayakan higienis toko</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'keunggulan' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'keunggulan' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Sesi Keunggulan</label>
                                <input
                                  type="text"
                                  name="keunggulanTitle"
                                  value={settingsForm.keunggulanTitle}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Deskripsi Sesi Keunggulan</label>
                                <textarea
                                  name="keunggulanSubtitle"
                                  rows={2}
                                  value={settingsForm.keunggulanSubtitle}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 4: MITRA KAMI (PROFIL USAHA) */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('mitra')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'mitra' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className={`w-4 h-4 ${expandedSection === 'mitra' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Mitra Kami & Profil Usaha</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Latar belakang, foto kelolaan, katering & reseller</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'mitra' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'mitra' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Judul Profil Usaha</label>
                                <input
                                  type="text"
                                  name="profilTitle"
                                  value={settingsForm.profilTitle}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Paragraf Deskripsi Utama</label>
                                <textarea
                                  name="profilDescription"
                                  rows={3}
                                  value={settingsForm.profilDescription}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Paragraf Deskripsi Sekunder</label>
                                <textarea
                                  name="profilDescriptionSec"
                                  rows={3}
                                  value={settingsForm.profilDescriptionSec}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Foto Profil Kiri</label>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      {settingsForm.profilImageLeft ? (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group flex-shrink-0">
                                          <img
                                            src={settingsForm.profilImageLeft}
                                            alt="Pratinjau Kiri"
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setSettingsForm((prev) => ({ ...prev, profilImageLeft: '' }))}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition duration-200"
                                          >
                                            Hapus
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 bg-dashed flex items-center justify-center text-slate-400 bg-slate-50 flex-shrink-0">
                                          <Image className="w-5 h-5 text-slate-450" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-bold rounded-lg cursor-pointer border border-emerald-150 transition w-full">
                                          <Upload className="w-3 h-3" />
                                          <span>Upload Foto</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'settingsForm', 'profilImageLeft')}
                                            className="hidden"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      name="profilImageLeft"
                                      value={settingsForm.profilImageLeft}
                                      onChange={handleInputChange}
                                      placeholder="Atau masukkan URL Foto Kiri"
                                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-xs focus:outline-emerald-600 truncate"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Foto Profil Kanan</label>
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                      {settingsForm.profilImageRight ? (
                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group flex-shrink-0">
                                          <img
                                            src={settingsForm.profilImageRight}
                                            alt="Pratinjau Kanan"
                                            className="w-full h-full object-cover"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => setSettingsForm((prev) => ({ ...prev, profilImageRight: '' }))}
                                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition duration-200"
                                          >
                                            Hapus
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 rounded-xl border border-dashed border-slate-300 bg-dashed flex items-center justify-center text-slate-400 bg-slate-50 flex-shrink-0">
                                          <Image className="w-5 h-5 text-slate-450" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-xs font-bold rounded-lg cursor-pointer border border-emerald-150 transition w-full">
                                          <Upload className="w-3 h-3" />
                                          <span>Upload Foto</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'settingsForm', 'profilImageRight')}
                                            className="hidden"
                                          />
                                        </label>
                                      </div>
                                    </div>
                                    <input
                                      type="text"
                                      name="profilImageRight"
                                      value={settingsForm.profilImageRight}
                                      onChange={handleInputChange}
                                      placeholder="Atau masukkan URL Foto Kanan"
                                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-1.5 text-xs focus:outline-emerald-600 truncate"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 5: KATALOG */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('katalog')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'katalog' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <ShoppingBag className={`w-4 h-4 ${expandedSection === 'katalog' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Katalog Produk & Harga</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Lihat dan atur sediaan stok eceran & harga grosir</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'katalog' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'katalog' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-2 text-center py-2">
                              <p className="text-xs text-slate-600">
                                Menu penambahan produk baru, diskon grosir, deskripsi kemasan, dan hapus stok dikelola secara terpisah pada Tab <strong>Katalog Produk</strong> di atas.
                              </p>
                              <button
                                type="button"
                                onClick={() => setActiveTab('products')}
                                className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition cursor-pointer mt-2"
                              >
                                <span>Pergi ke Tab Katalog Produk</span>
                                <span>→</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 6: HUBUNGI KAMI */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('kontak')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'kontak' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Phone className={`w-4 h-4 ${expandedSection === 'kontak' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Hubungi Kami (Footer & Maps)</h4>
                            <p className="text-[10px] text-slate-500 font-medium">WhatsApp, alamat fisik, jam buka, dan titik maps</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'kontak' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'kontak' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nomor WhatsApp Toko</label>
                                <input
                                  type="text"
                                  name="waNumber"
                                  value={settingsForm.waNumber}
                                  onChange={handleInputChange}
                                  placeholder="Contoh: 6281234567890"
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-mono focus:outline-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-600 mb-1">Alamat Fisik Lengkap</label>
                                <textarea
                                  name="footerAddress"
                                  rows={2}
                                  value={settingsForm.footerAddress}
                                  onChange={handleInputChange}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Jam Operasional</label>
                                  <input
                                    type="text"
                                    name="footerHours"
                                    value={settingsForm.footerHours}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Toko</label>
                                  <input
                                    type="text"
                                    name="footerEmail"
                                    value={settingsForm.footerEmail}
                                    onChange={handleInputChange}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-emerald-600"
                                  />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SECTION 7: PENGATURAN ADMIN */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedSection('admin')}
                        className={`w-full p-4 flex items-center justify-between text-left transition ${expandedSection === 'admin' ? 'bg-emerald-50/50 text-emerald-800' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className={`w-4 h-4 ${expandedSection === 'admin' ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider">Pengaturan Admin & Keamanan</h4>
                            <p className="text-[10px] text-slate-500 font-medium">Setel ulang data bawaan database (seeding) & lisensi</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                          {expandedSection === 'admin' ? 'Tutup' : 'Atur'}
                        </span>
                      </button>

                      <AnimatePresence initial={false}>
                        {expandedSection === 'admin' && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-slate-100 p-4 space-y-4 bg-slate-50/20"
                          >
                            <div className="space-y-3.5 bg-amber-50/70 border border-amber-200/60 p-4 rounded-xl">
                              <h5 className="text-xs font-black text-amber-900 uppercase">⚠️ Area Bahaya / Reset Database</h5>
                              <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                                Gunakan tombol seeding di bawah untuk menyetel ulang seluruh data di Firestore ke kondisi bawaan awal (default). Semua data kustomisasi teks dan katalog produk Anda saat ini akan ditimpa!
                              </p>
                              <button
                                type="button"
                                onClick={handleSeedDefaults}
                                disabled={isLoading}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/35"
                              >
                                <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                                <span>Muat Ulang Seluruh Data Bawaan (Seed Defaults)</span>
                              </button>

                              <button
                                type="button"
                                onClick={handleSyncProductsFromCode}
                                disabled={isLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/35"
                              >
                                <FileSpreadsheet className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Sinkronkan Katalog (Update Nama & Foto)</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* SAVE BUTTON FOR LEFT COLUMN */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer mt-6"
                    >
                      <Save className="w-5 h-5" />
                      <span>{isLoading ? 'Menyimpan...' : 'Simpan Seluruh Struktur Web'}</span>
                    </button>
                  </div>

                  {/* Right Column: Live Mockup Viewport */}
                  <div className="lg:col-span-6 bg-slate-100 border border-slate-200 rounded-3xl p-4 lg:sticky lg:top-5 space-y-4 select-none">
                    <div className="flex justify-between items-center bg-white border border-slate-200 rounded-full px-4 py-1.5 shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute"></span>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider font-mono">Live Preview Viewport</span>
                      </div>
                      <div className="text-[9px] bg-slate-100 border-slate-200 text-slate-500 px-2 py-0.5 rounded font-bold uppercase font-mono">
                        Bagian: {expandedSection}
                      </div>
                    </div>

                    {/* RENDER DYNAMIC MOCK CORRESPONDING TO ACTIVE EXPANDED SECTION */}
                    <div className="border border-slate-200/80 rounded-2xl bg-white shadow-xs p-3 min-h-[300px] flex flex-col justify-center">
                      
                      {expandedSection === 'beranda' && (
                        <div className="bg-sky-50/50 p-4 rounded-xl border border-sky-100/80 text-left space-y-4 relative overflow-hidden">
                          <div className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                            100% HALAL & HIGIENIS • GARANSI SEGAR
                          </div>
                          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-tight">
                            {settingsForm.heroTitle || 'Daging Segar & Siap Olah Langsung Ke Dapur Anda.'}
                          </h1>
                          <p className="text-[11px] leading-relaxed text-slate-600 font-light">
                            {settingsForm.heroSubtitle || 'Kini masak enak jauh lebih praktis dan hemat! Haylofress Ngawi menyediakan ayam...'}
                          </p>
                          <div className="flex gap-2 text-[10px] font-black pt-1">
                            <span className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px]">PESAN SEKARANG</span>
                            <span className="bg-white border border-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg">DAFTAR RESELLER</span>
                          </div>
                          <div className="pt-3 border-t border-slate-200/50">
                            <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shadow-inner">
                              <img
                                src={settingsForm.heroImageUrl || "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=700"}
                                alt="Preview Hero"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-amber-500 text-white font-bold text-[8px] px-2 py-0.5 rounded">
                                🔥 TERENAK & TERLARIS
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedSection === 'solusi' && (
                        <div className="text-left space-y-4">
                          <div className="text-center space-y-1">
                            <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider font-mono block">— PENAWARAN KAMI —</span>
                            <h3 className="text-xs font-black text-slate-800 leading-tight">
                              {settingsForm.problemTitle || 'Sering Mengalami Kendala Ini Saat Menyiapkan Sajian Makanan?'}
                            </h3>
                            <p className="text-[10px] text-slate-500 leading-normal max-w-sm mx-auto">
                              {settingsForm.problemSubtitle || 'Perbandingan keruwetan dapur lama vs kepraktisan era baru.'}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div className="bg-rose-50/55 border border-rose-100 p-3 rounded-xl space-y-1.5 text-xs text-rose-900 font-medium">
                              <h4 className="text-[10px] font-black uppercase text-rose-800 tracking-wider font-mono border-b border-rose-100/80 pb-1">
                                {settingsForm.solutionTitle || 'Dapur Tradisional'}
                              </h4>
                              <p className="text-[9px] leading-relaxed text-slate-500">❌ Menghabiskan waktu berjam-jam membersihkan sisa ceker, memilah tetelan lemak, becek, kotor dan repot harian.</p>
                            </div>
                            <div className="bg-emerald-50/55 border border-emerald-100 p-3 rounded-xl space-y-1.5 text-xs text-emerald-900 font-bold">
                              <h4 className="text-[10px] font-black uppercase text-emerald-800 tracking-wider font-mono border-b border-emerald-100/80 pb-1">
                                {settingsForm.solutionSubtitle || 'Haylofress Ngawi'}
                              </h4>
                              <p className="text-[9px] leading-relaxed text-emerald-800">✅ Cukup pilih kebutuhan via HP, tinggal cemplung, steril gizi terkunci vacuum pack, bebas becek & hemat waktu!</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedSection === 'keunggulan' && (
                        <div className="text-left space-y-4">
                          <div className="text-center space-y-1">
                            <span className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider font-mono block">— KEUNGGULAN KAMI —</span>
                            <h3 className="text-xs font-black text-slate-800">
                              {settingsForm.keunggulanTitle || '4 Pilar Utama Keunggulan Haylofress Ngawi'}
                            </h3>
                            <p className="text-[10px] text-slate-500 leading-normal max-w-sm mx-auto">
                              {settingsForm.keunggulanSubtitle}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 pt-2">
                            {[
                              { title: 'Higenis & Steril Total', desc: 'Pencucian steril berulang dengan air bersih terfiltrasi.' },
                              { title: 'Suhu Cold Storage', desc: 'Suhu dingin terjaga di bawah -18 derajat Celsius mengunci nutrisi.' },
                              { title: 'Harga Terbaik', desc: 'Supplier tangan pertama! Menyediakan opsi eceran & grosir.' },
                              { title: 'Siap Kirim Cepat', desc: 'Bekerjasama dengan kurir lokal penahan dingin (cold chain).' }
                            ].map((item, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-xl space-y-1">
                                <h5 className="text-[10px] font-black text-slate-800 leading-tight">★ {item.title}</h5>
                                <p className="text-[9px] text-slate-500 leading-normal font-light">{item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedSection === 'mitra' && (
                        <div className="text-left space-y-3">
                          <h3 className="text-[10px] font-bold uppercase text-slate-400 font-mono tracking-wider border-b border-slate-100 pb-1 flex items-center justify-between">
                            <span>🤝 MITRA KAMI & PROFIL USAHA</span>
                            <span className="bg-emerald-50 text-emerald-750 px-1.5 rounded text-[8px] font-bold border border-emerald-100">Live</span>
                          </h3>
                          <h4 className="text-xs font-black text-slate-800 leading-snug">
                            {settingsForm.profilTitle || 'Haylofress Ngawi: Sahabat Sehat Keluarga'}
                          </h4>
                          <p className="text-[9px] leading-relaxed text-slate-500">
                            {settingsForm.profilDescription || 'Berawal dari sebuah komitmen sederhana untuk menghadirkan...'}
                          </p>
                          <p className="text-[9px] leading-relaxed text-slate-500 italic block mt-1">
                            {settingsForm.profilDescriptionSec || 'Kami sangat mengerti bahwa waktu harian Anda teramat berharga...'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2">
                            <div className="rounded-xl overflow-hidden h-20 bg-slate-100 border border-slate-200 shadow-sm relative">
                              <img src={settingsForm.profilImageLeft || "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400"} alt="Kiri" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-bold font-sans">Ayam & Daging</span>
                            </div>
                            <div className="rounded-xl overflow-hidden h-20 bg-slate-100 border border-slate-200 shadow-sm relative">
                              <img src={settingsForm.profilImageRight || "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&q=80&w=400"} alt="Kanan" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] px-1 rounded font-bold font-sans">Sayuran Segar</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {expandedSection === 'katalog' && (
                        <div className="text-left space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-150 pb-1.5">
                            <h5 className="text-[9px] font-black uppercase text-slate-500 font-mono tracking-wider">📦 KATALOG PRODUK AKTIF ({currentProducts.length} Item)</h5>
                            <span className="text-[8px] text-emerald-700 bg-emerald-50 border border-emerald-150 px-1 rounded font-bold">READY STOCK</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {currentProducts.slice(0, 4).map((prod) => (
                              <div key={prod.id} className="border border-slate-150 rounded-xl overflow-hidden bg-slate-100/50 flex flex-col justify-between shadow-xs">
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-16 object-cover" />
                                <div className="p-1.5 space-y-0.5">
                                  <h6 className="font-extrabold text-[9px] text-slate-800 truncate">{prod.name}</h6>
                                  <div className="text-[8px] text-slate-500">Rp {(prod.priceNormal || 0).toLocaleString('id-ID')} / {prod.unit}</div>
                                  <div className="text-[8px] text-emerald-700 font-black bg-emerald-50 px-1 rounded inline-block truncate max-w-full">
                                    Grosir 1: Rp {(prod.priceGrosir1 || 0).toLocaleString('id-ID')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {expandedSection === 'kontak' && (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl text-left space-y-3">
                          <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
                            <div className="bg-emerald-600 text-white p-1 rounded text-[8px] font-bold">❆</div>
                            <div>
                              <span className="text-xs font-black tracking-tight block">HAYLOFRESS</span>
                              <span className="text-[7px] text-emerald-400 font-bold uppercase block tracking-wider mt-0.5">Ngawi - Frozen & Fresh</span>
                            </div>
                          </div>
                          <div className="space-y-1.5 text-[9px] text-slate-300 font-sans">
                            <div className="flex items-start gap-1">
                              <span className="text-emerald-400">📍</span>
                              <span className="leading-snug">{settingsForm.footerAddress || 'Jl. Ketonggo II Gg. Jalak...'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-400">📞</span>
                              <span>{settingsForm.waNumber || '6281234567890'}</span>
                            </div>
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-emerald-400">🕒</span>
                              <span>{settingsForm.footerHours || 'Buka Setiap Hari: 06:00 - 18:00'}</span>
                            </div>
                            <div className="flex items-center gap-1 font-mono">
                              <span className="text-emerald-400">✉</span>
                              <span>{settingsForm.footerEmail || 'haylofress.ngawi@gmail.com'}</span>
                            </div>
                          </div>
                          <div className="h-16 rounded-xl bg-slate-800 border border-slate-700 font-mono text-[8.5px] uppercase font-bold text-slate-500 flex items-center justify-center relative">
                            <span>Google Maps Node Mock</span>
                            <div className="absolute inset-0 bg-radial from-slate-700/20 to-transparent"></div>
                          </div>
                        </div>
                      )}

                      {expandedSection === 'admin' && (
                        <div className="text-center space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                          <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full border border-emerald-250 flex items-center justify-center mx-auto text-xs font-bold shadow-sm">
                            ⚙
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800">Panel Pengelola Admin</h4>
                            <p className="text-[9px] text-slate-500 max-w-xs mx-auto leading-normal">
                              Hak Akses Administrator dilindungi oleh aturan ketat Cloud Firestore Rules. Perubahan tersimpan global dan langsung memengaruhi tampilan ribuan pengunjung website.
                            </p>
                          </div>
                          <div className="bg-white border border-slate-200 p-2 rounded-lg text-left text-[8.5px] font-mono text-slate-650 space-y-1 flex flex-col">
                            <span className="text-slate-400 font-bold font-sans uppercase">Status Diagnostik:</span>
                            <span>• Autentikasi: Firebase Auth (Aktif)</span>
                            <span>• Tipe Dokumen: global_settings</span>
                            <span>• Domain Host: localhost:3000</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* Viewport footer */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 text-center text-[9px] font-mono text-slate-400 flex items-center justify-between shadow-xs">
                      <span>Metrik Refresh: Realtime Link</span>
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-1 rounded">CONNECTED</span>
                    </div>
                  </div>
                </form>
              )}

              {/* TAB 2: PRODUCT CATALOG MANAGEMENT */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  {/* Product Form Dialog block (STILL USED FOR ADD NEW) */}
                  <AnimatePresence>
                    {isProductFormOpen && !editingProduct && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white border border-emerald-100 rounded-2xl p-5 space-y-4 shadow-md overflow-hidden"
                      >
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <h4 className="text-sm font-black text-slate-800">
                            Tambah Produk Baru
                          </h4>
                          <button
                            type="button"
                            onClick={() => setIsProductFormOpen(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {renderProductForm()}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono pl-1.5 mr-1">Filter Kategori:</span>
                    <button
                      type="button"
                      onClick={() => setAdminCategoryFilter('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                        adminCategoryFilter === 'all'
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Semua ({currentProducts.length})
                    </button>
                    {currentCategories.map((cat) => {
                      const count = currentProducts.filter(p => p.category === cat.id).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setAdminCategoryFilter(cat.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer select-none ${
                            adminCategoryFilter === cat.id
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {cat.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Bar (Admin) - New Filter by Name */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShoppingBag className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={adminSearchQuery}
                      onChange={(e) => setAdminSearchQuery(e.target.value)}
                      placeholder="Cari nama produk di sini..."
                      className="block w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-2xl bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition shadow-sm"
                    />
                    {adminSearchQuery && (
                      <button
                        onClick={() => setAdminSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-rose-500 transition"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Top Listing filter & add button bar */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs text-slate-500 font-mono font-medium">
                          Ditemukan {adminCategoryFilter === 'all' ? currentProducts.length : currentProducts.filter(p => p.category === adminCategoryFilter).length} produk di katalog saat ini.
                        </p>
                        {adminCategoryFilter === 'all' && (
                          <p className="text-[10px] text-amber-600 font-sans font-extrabold mt-0.5 animate-pulse">
                            💡 Tips: Filter ke salah satu Kategori di atas untuk mengaktifkan tombol panah pengatur letak urutan produk!
                          </p>
                        )}
                      </div>
                      <button
                        onClick={onRefreshData}
                        className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition shadow-xs text-slate-400 hover:text-emerald-600 cursor-pointer"
                        title="Segarkan Data dari Database"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {!isProductFormOpen && (
                      <button
                        onClick={openProductFormForAdd}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Produk Baru</span>
                      </button>
                    )}
                  </div>

                  {/* Main Table/Grid list of products */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs text-slate-600">
                        <thead>
                          <tr className="bg-slate-100/60 text-slate-700 font-mono font-bold border-b border-slate-200">
                            <th className="p-3.5">Produk</th>
                            <th className="p-3.5 text-center">Urutan Letak</th>
                            <th className="p-3.5">Kategori</th>
                            <th className="p-3.5 text-right">Ecer / Grosir</th>
                            <th className="p-3.5 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(() => {
                            let filteredList = [...currentProducts].sort((a, b) => (a.order || 0) - (b.order || 0));
                            
                            if (adminCategoryFilter !== 'all') {
                              filteredList = filteredList.filter(p => p.category === adminCategoryFilter);
                            }

                            if (adminSearchQuery.trim()) {
                              const q = adminSearchQuery.toLowerCase().trim();
                              filteredList = filteredList.filter(p => 
                                (p.name || '').toLowerCase().includes(q) || 
                                (p.id || '').toLowerCase().includes(q)
                              );
                            }

                            if (filteredList.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="p-8 text-center text-slate-400 font-mono font-bold">
                                    Belum ada produk dalam kategori ini.
                                  </td>
                                </tr>
                              );
                            }

                            return filteredList.map((prod, idx) => (
                              <React.Fragment key={prod.id}>
                                <tr className={`hover:bg-slate-100/30 transition ${editingProduct?.id === prod.id ? 'bg-emerald-50/40 ring-2 ring-emerald-500/20 z-10' : ''}`}>
                                  <td className="p-3.5 flex items-center gap-2.5 min-w-[200px]">
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      onClick={() => openProductFormForEdit(prod)}
                                      className="w-9 h-9 object-cover rounded-lg flex-shrink-0 cursor-pointer border border-slate-100 hover:opacity-80 transition"
                                      title="Klik gambar untuk Edit"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                      <h5 
                                        onClick={() => openProductFormForEdit(prod)}
                                        className="font-extrabold text-slate-800 truncate cursor-pointer hover:text-emerald-700 hover:underline transition flex items-center gap-1"
                                        title="Klik nama untuk Edit Produk"
                                      >
                                        {prod.name}
                                      </h5>
                                      <div className="flex flex-wrap items-center gap-1.5 leading-none">
                                        <span className="text-[10px] text-slate-400 font-mono">ID: {prod.id} • / {prod.unit}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleProductVisibility(prod)}
                                          className={`px-1 rounded text-[8px] font-bold tracking-tight uppercase font-mono border cursor-pointer hover:opacity-85 select-none transition ${
                                            prod.visible === false
                                              ? 'bg-rose-50 text-rose-750 border-rose-150 hover:bg-rose-100'
                                              : 'bg-emerald-50 text-emerald-750 border-emerald-100 hover:bg-emerald-100'
                                          }`}
                                          title="Klik untuk mengubah visibilitas"
                                        >
                                          {prod.visible === false ? 'Sembunyi' : 'Tampil'}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-center align-middle">
                                    <div className="flex items-center gap-1 justify-center">
                                      <button
                                        type="button"
                                        onClick={() => moveProductOrderByCat(idx, filteredList, 'up')}
                                        disabled={adminCategoryFilter === 'all' || idx === 0}
                                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                                        title={adminCategoryFilter === 'all' ? "Pilih filter kategori untuk mengurutkan letak" : "Naikkan posisi"}
                                      >
                                        <ArrowUp className="w-4 h-4" />
                                      </button>
                                      
                                      <input 
                                        type="number"
                                        defaultValue={typeof prod.order === 'number' ? prod.order : idx + 1}
                                        onBlur={(e) => {
                                          const val = parseInt(e.target.value);
                                          if (!isNaN(val) && val !== prod.order) {
                                            handleManualOrderUpdate(prod.id, val);
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            (e.target as HTMLInputElement).blur();
                                          }
                                        }}
                                        className="w-12 text-center text-[10px] font-black font-mono bg-white border border-slate-200 rounded-lg py-1 text-slate-700 focus:outline-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                                        title="Masukkan nomor urut yang diinginkan"
                                      />

                                      <button
                                        type="button"
                                        onClick={() => moveProductOrderByCat(idx, filteredList, 'down')}
                                        disabled={adminCategoryFilter === 'all' || idx === filteredList.length - 1}
                                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                                        title={adminCategoryFilter === 'all' ? "Pilih filter kategori untuk mengurutkan letak" : "Turunkan posisi"}
                                      >
                                        <ArrowDown className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                  <td className="p-3.5 align-middle">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-650 uppercase font-mono border border-slate-250">
                                      {prod.category}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right align-middle font-semibold text-slate-800 font-mono">
                                    <div>Rp {(prod.priceNormal || 0).toLocaleString('id-ID')}</div>
                                    {prod.priceDiscount > 0 && (
                                      <div className="text-[9px] text-rose-650 font-extrabold bg-rose-50 px-1 rounded inline-block mt-0.5">Promo: Rp {prod.priceDiscount.toLocaleString('id-ID')}</div>
                                    )}
                                    <div className="text-[9px] text-emerald-805 font-semibold mt-1 space-y-0.5 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100 leading-normal font-sans">
                                      <div>G1 (≥10): Rp {(prod.priceGrosir1 || 0).toLocaleString('id-ID')}</div>
                                      <div>G2 (≥100): Rp {(prod.priceGrosir2 || 0).toLocaleString('id-ID')}</div>
                                      <div>G3 (≥500): Rp {(prod.priceGrosir3 || 0).toLocaleString('id-ID')}</div>
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-center align-middle">
                                    <div className="flex gap-1.5 justify-center">
                                      <button
                                        onClick={() => openProductFormForEdit(prod)}
                                        className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition cursor-pointer"
                                        title="Edit Produk"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                                        title="Hapus Produk"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {/* INLINE EDIT FORM */}
                                {editingProduct?.id === prod.id && isProductFormOpen && (
                                  <tr className="bg-emerald-50/20">
                                    <td colSpan={5} className="p-4 border-l-4 border-emerald-500 shadow-inner">
                                      <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-lg">
                                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                                          <h4 className="text-sm font-black text-emerald-800 flex items-center gap-2">
                                            <Edit2 className="w-4 h-4" />
                                            <span>Sedang Mengedit: {prod.name}</span>
                                          </h4>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setIsProductFormOpen(false);
                                              setEditingProduct(null);
                                            }}
                                            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-full transition"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                        {renderProductForm()}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: CATALOG LAYOUT & ORDER MANAGER */}
              {activeTab === 'layout-order' && (
                <div className="space-y-8 animate-fade-in text-slate-800">
                  
                  {/* Top: Layout settings bar */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Catalog Display Options Card */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <h4 className="text-sm font-black uppercase text-emerald-700 font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        <span>Pengaturan Layout Katalog</span>
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium">
                        Atur bagaimana katalog produk dikelompokkan dan ditampilkan ke pengunjung online Anda.
                      </p>

                      <form onSubmit={handleSaveCatalogLayout} className="space-y-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Gaya Pengelompokan Kategori (*)
                          </label>
                          <select
                            value={catalogLayout}
                            onChange={(e) => setCatalogLayout(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
                          >
                            <option value="tabs">Pill Tabs (Filter Kategori Aktif Melalui Slider Tombol)</option>
                            <option value="sections">Vertical Sections (Menampilkan Semua Kategori Sekaligus Sebagai Baris Judul)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">
                            Jumlah Kolom Grid Produk (Desktop) (*)
                          </label>
                          <select
                            value={catalogColumns}
                            onChange={(e) => setCatalogColumns(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
                          >
                            <option value="4">4 Kolom Grid (Lebih Padat, Cocok bagi Banyak Macam Produk)</option>
                            <option value="3">3 Kolom Grid (Lebih Besar, Gambar Lebih Jelas Maksimal)</option>
                          </select>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={isSavingLayout}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>{isSavingLayout ? "Menyimpan..." : "Simpan Layout"}</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Quick Explanation Card */}
                    <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200/50 shadow-sm flex gap-4 text-slate-700 text-xs sm:text-sm leading-relaxed items-start">
                      <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div className="space-y-2">
                        <strong className="font-extrabold text-amber-905 text-xs uppercase tracking-wider block">💡 Rekomendasi Pengaturan:</strong>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                          Gunakan tipe <strong className="font-extrabold">Vertical Sections</strong> jika Anda memiliki ketersediaan ragam produk yang berlimpah di tiap-tiap kategori, karena pembeli dapat melihat semua isi toko Anda hanya melalui scrolling vertikal tanpa perlu menekan tombol tab yang lain.
                        </p>
                        <p className="text-slate-600 text-xs leading-relaxed font-semibold">
                          Urutkan susunan kategori serta produk agar promo diskon coret unggulan Anda diposisikan di paling atas paling awal agar cepat memicu ketertarikan pembeli pertama kali!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Category Management Block */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
                      <div>
                        <h4 className="text-sm font-black uppercase text-emerald-700 font-mono tracking-wider flex items-center gap-1.5">
                          <Settings className="w-4 h-4 text-emerald-600" />
                          <span>Daftar Kategori Katalog ({currentCategories.length})</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium mt-0.5">
                          Kelola nama, kode identitas, dan susunan urutan/posisi tampil kategori di menu utama.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setNewCategoryId('');
                          setNewCategoryName('');
                          setIsCategoryFormOpen(!isCategoryFormOpen);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 align-middle"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Kategori Baru</span>
                      </button>
                    </div>

                    {isCategoryFormOpen && (
                      <form onSubmit={handleCategorySubmit} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-4 max-w-lg">
                        <h5 className="text-xs font-extrabold text-slate-700">
                          {editingCategory ? "✏️ Edit Kategori" : "➕ Tambah Kategori Baru"}
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                              ID Kategori (Slug Huruf Kecil) (*)
                            </label>
                            <input
                              type="text"
                              required
                              value={newCategoryId}
                              onChange={(e) => setNewCategoryId(e.target.value)}
                              disabled={!!editingCategory}
                              placeholder="e.g. snack, daging-olahan"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
                              Nama Kategori (*)
                            </label>
                            <input
                              type="text"
                              required
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              placeholder="e.g. 🍟 Kentang & Olahan"
                              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:bg-white focus:outline-emerald-600 font-semibold"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCategoryFormOpen(false);
                              setEditingCategory(null);
                            }}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-1.5 rounded-lg shadow-md transition"
                          >
                            {editingCategory ? "Perbarui" : "Tambahkan"}
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Categories Table representation */}
                    <div className="overflow-x-auto rounded-xl border border-slate-100 font-sans">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-extrabold font-mono uppercase tracking-wider">
                            <th className="p-3">Urutan</th>
                            <th className="p-3">ID Kategori</th>
                            <th className="p-3">Nama Kategori</th>
                            <th className="p-3 text-center">Tindakan urutan</th>
                            <th className="p-3 text-center">Sunting / Hapus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentCategories.map((cat, idx) => (
                            <tr key={cat.id} className="hover:bg-slate-50/50 font-medium">
                              <td className="p-3 text-slate-500 font-mono font-bold">
                                #{idx + 1} <span className="text-[10px] text-slate-400">({cat.order || 0})</span>
                              </td>
                              <td className="p-3 font-mono text-emerald-800 font-bold">
                                {cat.id}
                              </td>
                              <td className="p-3 font-semibold text-slate-800">
                                {cat.name}
                              </td>
                              <td className="p-3 text-center align-middle">
                                <div className="flex items-center gap-1.5 justify-center">
                                  <button
                                    type="button"
                                    onClick={() => moveCategoryOrder(idx, 'up')}
                                    disabled={idx === 0}
                                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Pindahkan Urutan Naik"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveCategoryOrder(idx, 'down')}
                                    disabled={idx === currentCategories.length - 1}
                                    className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Pindahkan Urutan Turun"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-center align-middle">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditCategory(cat)}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg"
                                    title="Edit Kategori"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg"
                                    title="Hapus Kategori"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Product Ordering inside dynamic categories card */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="border-b border-slate-150 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-black uppercase text-emerald-700 font-mono tracking-wider flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                          <span>Penyusunan Posisi dan Urutan Produk</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-medium mt-0.5">
                          Pilih kelompok kategori, lalu ubah urutan tayang produk dengan tombol panah naik / turun.
                        </p>
                      </div>

                      {/* Dropdown to pick category */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Kategori Produk:</span>
                        <select
                          value={activeSortCategory}
                          onChange={(e) => setActiveSortCategory(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:bg-white focus:outline-emerald-600 font-bold text-emerald-800"
                        >
                          {currentCategories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Products assigned list */}
                    {(() => {
                      const activeCatDetails = currentCategories.find(c => c.id === activeSortCategory);
                      const productsInActiveCat = currentProducts.filter(p => p.category === activeSortCategory);

                      if (productsInActiveCat.length === 0) {
                        return (
                          <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-250 rounded-2xl">
                            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-xs font-bold text-slate-500">Belum ada produk aktif di kategori "{activeCatDetails?.name || activeSortCategory}"</p>
                            <p className="text-[10px] text-slate-400 mt-1">Ubah atau tambahkan produk baru dan setel kategorinya ke kelompok ini.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-bold font-mono uppercase tracking-wider">
                                <th className="p-3">Urutan</th>
                                <th className="p-3">Gambar</th>
                                <th className="p-3">Nama Produk</th>
                                <th className="p-3">Harga Normal / Promo</th>
                                <th className="p-3 text-center">Status</th>
                                <th className="p-3 text-center">Urutkan Posisi</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {productsInActiveCat.map((prod, idx) => (
                                <tr key={prod.id} className="hover:bg-slate-50/50 font-medium">
                                  <td className="p-3 text-slate-500 font-mono font-bold">
                                    #{idx + 1} <span className="text-[10px] text-slate-400">({prod.order || 0})</span>
                                  </td>
                                  <td className="p-3">
                                    <img
                                      src={prod.imageUrl}
                                      alt={prod.name}
                                      className="w-10 h-10 object-cover rounded-lg border border-slate-200 animate-fade-in"
                                      referrerPolicy="no-referrer"
                                    />
                                  </td>
                                  <td className="p-3">
                                    <div className="font-extrabold text-slate-800">{prod.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</div>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-700">
                                    <div>Rp {(prod.priceNormal || 0).toLocaleString('id-ID')}</div>
                                    {prod.priceDiscount > 0 && (
                                      <div className="text-[9px] text-rose-600 font-bold">Promo: Rp {prod.priceDiscount.toLocaleString('id-ID')}</div>
                                    )}
                                  </td>
                                  <td className="p-3 text-center align-middle">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleProductVisibility(prod)}
                                      className={`px-2 py-0.5 rounded-lg border font-bold uppercase text-[8px] tracking-wider font-mono cursor-pointer transition hover:opacity-85 active:scale-95 duration-100 ${
                                        prod.visible !== false
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                          : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                      }`}
                                      title="Klik untuk Toggle Tampil/Sembunyi"
                                    >
                                      {prod.visible !== false ? 'Tampil' : 'Sembunyi'}
                                    </button>
                                  </td>
                                  <td className="p-3 text-center align-middle">
                                    <div className="flex items-center gap-1.5 justify-center">
                                      <button
                                        type="button"
                                        onClick={() => moveProductOrderByCat(idx, productsInActiveCat, 'up')}
                                        disabled={idx === 0}
                                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                        title="Naikkan Posisi Tayang"
                                      >
                                        <ArrowUp className="w-4.5 h-4.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => moveProductOrderByCat(idx, productsInActiveCat, 'down')}
                                        disabled={idx === productsInActiveCat.length - 1}
                                        className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                        title="Turunkan Posisi Tayang"
                                      >
                                        <ArrowDown className="w-4.5 h-4.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}

              {/* TAB: PROMO BUNDLING CODES & CONFIG */}
              {activeTab === 'bundles' && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                        <span>🎁 Kelola Paket Promo Bundling</span>
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Konfigurasikan paket bundling makanan bersuhu khusus & bahan masakan segar dengan satu harga spesial hemat.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenAddBundle}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wide px-4.5 py-3 rounded-xl flex items-center gap-2 shadow-md hover:scale-102 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Paket Bundling</span>
                    </button>
                  </div>

                  {/* Bundles Grid */}
                  {currentBundles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentBundles.map((bundle) => {
                        const saveAmount = bundle.originalPrice - bundle.promoPrice;
                        return (
                          <div
                            key={bundle.id}
                            className={`bg-white rounded-2xl border ${
                              bundle.visible !== false ? 'border-slate-200 shadow-sm' : 'border-slate-200 opacity-60 bg-slate-50/50'
                            } overflow-hidden flex flex-col justify-between`}
                          >
                            <div className="p-5 space-y-4">
                              {/* Header info */}
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                                    ID: {bundle.id}
                                  </span>
                                  <h4 className="font-black text-base text-slate-800 line-clamp-1 mt-0.5">
                                    {bundle.title}
                                  </h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleToggleBundleVisibility(bundle)}
                                  className={`text-[9.5px] px-2 py-1 rounded-lg font-black uppercase tracking-wider cursor-pointer hover:opacity-85 active:scale-95 transition-all duration-150 flex items-center gap-1 ${
                                    bundle.visible !== false
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                                  }`}
                                  title="Klik untuk mengubah status aktif"
                                >
                                  {bundle.visible !== false ? (
                                    <>
                                      <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse shrink-0"></span>
                                      <span>Aktif</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="h-1.5 w-1.5 bg-rose-500 rounded-full shrink-0"></span>
                                      <span>Draf / Sembunyi</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Image and item summary review */}
                              <div className="flex gap-4">
                                <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                  {bundle.imageUrl ? (
                                    <img
                                      src={bundle.imageUrl}
                                      alt={bundle.title}
                                      referrerPolicy="no-referrer"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Gift className="w-8 h-8 text-slate-350" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                    {bundle.description || 'Tidak ada deskripsi.'}
                                  </p>
                                  <div className="text-[11px] font-bold text-slate-700">
                                    💰 Paket: <span className="text-emerald-700 font-black">Rp {bundle.promoPrice.toLocaleString('id-ID')}</span>{' '}
                                    <span className="text-slate-400 line-through text-[10px]">Rp {bundle.originalPrice.toLocaleString('id-ID')}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Items checklist preview inside admin */}
                              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 space-y-1.5">
                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 block">
                                  📦 Komponen Terdaftar ({bundle.items?.length || 0}):
                                </span>
                                <div className="text-[11px] text-slate-600 space-y-1">
                                  {bundle.items?.slice(0, 3).map((item, id) => (
                                    <div key={id} className="flex items-center gap-1.5 truncate">
                                      <span className="text-amber-500 shrink-0">✓</span>
                                      <span className="truncate leading-none">{item}</span>
                                    </div>
                                  ))}
                                  {bundle.items?.length > 3 && (
                                    <span className="text-[10px] text-slate-400 italic block pl-4">
                                      +{bundle.items.length - 3} item lainnya...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions footer */}
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center gap-4 text-xs">
                              <span className="font-bold text-slate-500 font-mono text-[10px]">
                                Urutan: {bundle.order || 1}
                              </span>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleBundleVisibility(bundle)}
                                  className={`p-1.5 rounded-lg border flex items-center justify-center cursor-pointer transition text-[11px] font-extrabold gap-1 ${
                                    bundle.visible !== false
                                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-250'
                                  }`}
                                  title={bundle.visible !== false ? 'Sembunyikan dari katalog' : 'Tampilkan di katalog'}
                                >
                                  {bundle.visible !== false ? (
                                    <>
                                      <EyeOff className="w-3.5 h-3.5" />
                                      <span>Arsipkan</span>
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Aktifkan</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBundle(bundle)}
                                  className="bg-sky-50 text-sky-700 hover:bg-sky-100 p-1.5 rounded-lg border border-sky-150 flex items-center justify-center cursor-pointer transition text-[11px] font-extrabold gap-1"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBundle(bundle.id, bundle.title)}
                                  className="bg-rose-50 text-rose-700 hover:bg-rose-100 p-1.5 rounded-lg border border-rose-150 flex items-center justify-center cursor-pointer transition text-[11px] font-extrabold gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                        <Gift className="w-8 h-8" />
                      </div>
                      <div className="max-w-md mx-auto space-y-2">
                        <h4 className="font-extrabold text-slate-800 text-lg">Belum Ada Paket Bundling</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Anda belum mengonfigurasikan produk bundling khusus. Buat kombinasi barang pertama Anda sekarang dan tawarkan harga grosir praktis satu paket!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenAddBundle}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase px-5 py-3 rounded-xl transition cursor-pointer"
                      >
                        Buat Paket Pertama
                      </button>
                    </div>
                  )}

                  {/* Dynamic Form Modal Block */}
                  {isBundleFormOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-slide-in relative">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-5 flex justify-between items-center">
                          <div>
                            <h3 className="font-black text-base flex items-center gap-1.5">
                              <Gift className="w-5 h-5 text-amber-300" />
                              <span>{editingBundle ? 'Edit Detail Paket Bundling' : 'Tambah Paket Bundling Baru'}</span>
                            </h3>
                            <p className="text-[10px] text-emerald-100 mt-0.5">
                              {editingBundle ? 'Edit properti paket bundling yang sudah disimpan.' : 'Tentukan properti paket bundling yang dapat dibeli.'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsBundleFormOpen(false)}
                            className="bg-emerald-700/50 hover:bg-emerald-800 p-1.5 rounded-full transition cursor-pointer"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleSaveBundle} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                          {/* Row 1: ID & Order */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-extrabold text-slate-600 mb-1">
                                ID Paket (Unik)*
                              </label>
                              <input
                                type="text"
                                value={bundleId}
                                onChange={(e) => setBundleId(e.target.value.toLowerCase().replace(/[^a-z0-9_\-]/g, ''))}
                                placeholder="misal: bundle_sop_lengkap"
                                disabled={!!editingBundle}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 disabled:opacity-50 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-600 mb-1">
                                Urutan Tampil
                              </label>
                              <input
                                type="number"
                                value={bundleOrder}
                                onChange={(e) => setBundleOrder(Math.max(1, Number(e.target.value)))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono"
                              />
                            </div>
                          </div>

                          {/* Row 2: Title / Nama Paket */}
                          <div>
                            <label className="block text-xs font-extrabold text-slate-600 mb-1">
                              Nama Paket Bundling*
                            </label>
                            <input
                              type="text"
                              value={bundleTitle}
                              onChange={(e) => setBundleTitle(e.target.value)}
                              placeholder="misal: Paket Sop Sapi Kenyang"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-bold"
                            />
                          </div>

                          {/* Row 3: Description */}
                          <div>
                            <label className="block text-xs font-extrabold text-slate-600 mb-1">
                              Deskripsi Singkat Paket
                            </label>
                            <textarea
                              rows={2}
                              value={bundleDescription}
                              onChange={(e) => setBundleDescription(e.target.value)}
                              placeholder="Fasilitasi deskripsi paket untuk memikat pembeli online..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 resize-none leading-relaxed"
                            />
                          </div>

                          {/* Row 4: Image URL */}
                          <div>
                            <label className="block text-xs font-extrabold text-slate-600 mb-1">
                              Link/URL Foto Paket Bundling (Opsional)
                            </label>
                            <input
                              type="text"
                              value={bundleImageUrl}
                              onChange={(e) => setBundleImageUrl(e.target.value)}
                              placeholder="https://images.unsplash.com/... atau kosongkan"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono"
                            />
                          </div>

                          {/* Row 5: Normal & Promo Price */}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-extrabold text-slate-600 mb-1">
                                Harga Normal (Rp)*
                              </label>
                              <input
                                type="number"
                                value={bundleOriginalPrice || ''}
                                onChange={(e) => setBundleOriginalPrice(Number(e.target.value))}
                                placeholder="misal: 45000"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-extrabold text-slate-600 mb-1">
                                Harga Promo Paket (Rp)*
                              </label>
                              <input
                                type="number"
                                value={bundlePromoPrice || ''}
                                onChange={(e) => setBundlePromoPrice(Number(e.target.value))}
                                placeholder="misal: 38000"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono font-bold text-rose-600"
                              />
                            </div>
                          </div>

                          {/* Row 6: Items list */}
                          <div>
                            <label className="block text-xs font-extrabold text-slate-600 mb-1 flex justify-between items-center">
                              <span>Daftar Isi Paket (Satu item per baris)*</span>
                              <span className="text-[10px] text-slate-400 font-normal">Min. 1 item</span>
                            </label>
                            <textarea
                              rows={4}
                              value={bundleItemsText}
                              onChange={(e) => setBundleItemsText(e.target.value)}
                              placeholder="misal:&#10;Daging Ayam Cincang 500g&#10;Bumbu Sop Instan Racik&#10;Kol Segar Kupas 200g"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 font-mono leading-relaxed"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                              💡 Tuliskan setiap komponen penyusun paket, pisahkan dengan menekan <strong>Enter</strong> ke baris baru.
                            </p>
                          </div>

                          {/* Row 7: Visible Switch */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="checkbox"
                              id="bundleVisible"
                              checked={bundleVisible}
                              onChange={(e) => setBundleVisible(e.target.checked)}
                              className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                            />
                            <label htmlFor="bundleVisible" className="text-xs font-extrabold text-slate-700 cursor-pointer selection:bg-transparent">
                              Aktifkan & Tampilkan Paket Bundling di Katalog Online
                            </label>
                          </div>

                          {/* Form Footer */}
                          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setIsBundleFormOpen(false)}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition text-xs cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-5 py-2.5 rounded-xl transition text-xs cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-250 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              <span>{editingBundle ? 'Simpan Perubahan' : 'Simpan Paket'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* VOUCHER & CAMPAIGN WORKSPACE MERGED DIRECTLY IN PROMO & BUNDLING */}
                  <div className="border-t border-slate-200/80 pt-10 mt-10 space-y-8 text-left">
                    <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                      <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                        <span>📢 Kelola Kode Voucher Toko & Promosi</span>
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Rancang kode kupon diskon toko (nominal / persentase) untuk diaktifkan di checkout pembeli.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left: Voucher Form */}
                      <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider font-mono flex items-center gap-1.5">
                          <Plus className="w-4 h-4" />
                          <span>Buat Kode Voucher Toko Baru</span>
                        </h4>
                        
                        <form onSubmit={handleAddVoucher} className="space-y-3.5">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-450 mb-1 font-mono">Kode Voucher (Kapital, tanpa spasi)</label>
                            <input
                              type="text"
                              value={newVoucherCode}
                              onChange={(e) => setNewVoucherCode(e.target.value.toUpperCase().replace(/\s/g, ''))}
                              placeholder="misal: SEGARHEMAT"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-emerald-600 transition"
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-450 mb-1 font-mono">Tipe Potongan</label>
                              <select
                                value={newVoucherType}
                                onChange={(e: any) => setNewVoucherType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:bg-white focus:outline-emerald-600 transition font-bold"
                              >
                                <option value="percentage">Persentase (%)</option>
                                <option value="fixed">Nominal Tetap (Rupiah)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-450 mb-1 font-mono">Nilai Diskon</label>
                              <input
                                type="number"
                                value={newVoucherValue || ''}
                                onChange={(e) => setNewVoucherValue(Number(e.target.value))}
                                placeholder="misal: 10 atau 15000"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-emerald-600 transition"
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-450 mb-1 font-mono">Minimal Belanja (Rupiah)</label>
                            <input
                              type="number"
                              value={newVoucherMin || ''}
                              onChange={(e) => setNewVoucherMin(Number(e.target.value))}
                              placeholder="misal: 50000"
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold focus:bg-white focus:outline-emerald-600 transition"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition cursor-pointer shadow-md shadow-emerald-600/10"
                          >
                            Buat & Publikasikan Voucher
                          </button>
                        </form>
                      </div>

                      {/* Right: Voucher List */}
                      <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider font-mono">
                          🎟️ Voucher Aktif Toko Saat Ini
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {vouchers.map((v, i) => (
                            <div key={v.code || i} className="p-4 bg-emerald-50/55 rounded-xl border border-emerald-150 relative flex flex-col justify-between overflow-hidden group">
                              <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-100 rounded-full translate-x-4 -translate-y-4" />
                              <div>
                                <span className="text-[10px] bg-emerald-600 text-white px-2.5 py-0.5 rounded font-black font-mono tracking-wide">
                                  {v.code}
                                </span>
                                <p className="text-xs text-slate-700 font-bold mt-2.5">
                                  Potongan {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value.toLocaleString('id-ID')}`}
                                </p>
                                <p className="text-[10.5px] text-slate-500 mt-1 font-mono">
                                  Min. Belanja: Rp {v.minPurchase.toLocaleString('id-ID')}
                                </p>
                              </div>
                              
                              <button
                                type="button"
                                onClick={() => handleDeleteVoucher(v.code)}
                                className="self-end mt-4 text-[10px] font-black text-red-600 hover:text-red-800 transition bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded cursor-pointer"
                              >
                                Hapus Voucher
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Advertising Campaigns (Facebook Ads ROI Spend Tracker) */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            Kampanye Iklan & Pelacak Anggaran (Facebook/Instagram Ads Tracker)
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Lacak Return on Ad Spend (ROAS) dan total anggaran pengeluaran iklan Meta Pixel Anda.
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-150">
                        <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[9.5px] font-mono tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Nama Kampanye Iklan</th>
                              <th className="px-4 py-3">Anggaran</th>
                              <th className="px-4 py-3">Terpakai</th>
                              <th className="px-4 py-3">Klik (CPC)</th>
                              <th className="px-4 py-3">Impressions</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {campaigns.map((c) => (
                              <tr key={c.id} className="hover:bg-slate-50/50 transition">
                                <td className="px-4 py-3 font-bold text-slate-900">{c.name}</td>
                                <td className="px-4 py-3 font-mono">Rp {c.budget.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 font-mono text-slate-550">Rp {c.spend.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 font-mono">{c.clicks}</td>
                                <td className="px-4 py-3 font-mono">{c.impressions}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                    c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    c.status === 'paused' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-slate-100 text-slate-650'
                                  }`}>
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleToggleCampaignStatus(c.id)}
                                    className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded border border-slate-300 transition cursor-pointer"
                                  >
                                    Ubah Status
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: SHOPPING CARTS VISITOR LIST */}
              {activeTab === 'carts' && (
                <div className="space-y-6 animate-fade-in text-slate-800">
                  {/* Top Header Card */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-emerald-600" />
                        <span>🛒 Daftar Keranjang Belanja Pengunjung</span>
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                        Pantau aktivitas troli belanja pengunjung, calon pembeli potensial, serta transaksi yang belum terselesaikan untuk follow up.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchAnalytics}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wide px-4.5 py-2.5 rounded-xl flex items-center gap-2 border border-slate-200 cursor-pointer active:scale-95 transition-all"
                      title="Sinkronisasi log troli terbaru dari server"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin-slow" />
                      <span>Refresh Data</span>
                    </button>
                  </div>

                  {/* Analytics Stats Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {/* Active Carts Value card */}
                    <div className="bg-amber-50/50 border border-amber-200/60 rounded-2xl p-4.5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider font-mono">Troli Aktif / Ditinggal</span>
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-black text-slate-900 font-mono">
                          Rp {cartStats.abandonedTotalValue.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-slate-500 font-bold mt-1">
                          Dari <span className="text-amber-700 font-extrabold">{cartStats.activeCount + cartStats.checkoutCount} keranjang</span> pengunjung belum checkout.
                        </p>
                      </div>
                    </div>

                    {/* Completed Carts Value card */}
                    <div className="bg-emerald-50/50 border border-emerald-200/60 rounded-2xl p-4.5 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider font-mono">Transaksi Sukses</span>
                        <span className="text-[9px] bg-emerald-100/80 text-emerald-700 font-black px-1.5 py-0.5 rounded font-mono uppercase">Done</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-black text-slate-900 font-mono">
                          Rp {cartStats.completedTotalValue.toLocaleString('id-ID')}
                        </p>
                        <p className="text-[11px] text-slate-500 font-bold mt-1">
                          Akumulasi dari <span className="text-emerald-700 font-extrabold">{cartStats.completedCount} pesanan</span> terkonfirmasi di WhatsApp.
                        </p>
                      </div>
                    </div>

                    {/* Conversion Rate Card */}
                    <div className="bg-sky-50/50 border border-sky-200/60 rounded-2xl p-4.5 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-black uppercase text-sky-800 tracking-wider font-mono">Asumsi Rasio Konversi Resmi</span>
                        <span className="text-[12px]">📊</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-2xl font-black text-slate-900 font-mono">
                          {((cartStats.completedCount / (cartStats.totalCount || 1)) * 100).toFixed(1)}%
                        </p>
                        <p className="text-[11px] text-slate-500 font-bold mt-1">
                          Dari total <span className="text-sky-700 font-extrabold">{cartStats.totalCount} interaksi</span> berbelanja teridentifikasi sistem.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
                    {/* Pills Filter selection */}
                    <div className="flex flex-wrap gap-1.5 self-start md:self-auto">
                      <button
                        type="button"
                        onClick={() => setCartFilter('all')}
                        className={`text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                          cartFilter === 'all'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Semua ({visitorCarts.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartFilter('active')}
                        className={`text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                          cartFilter === 'active'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/45'
                        }`}
                      >
                        Aktif di Troli ({cartStats.activeCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartFilter('checkout')}
                        className={`text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                          cartFilter === 'checkout'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200/45'
                        }`}
                      >
                        Proses Checkout ({cartStats.checkoutCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCartFilter('completed')}
                        className={`text-xs font-black px-4 py-2 rounded-lg transition-all cursor-pointer ${
                          cartFilter === 'completed'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/45'
                        }`}
                      >
                        Selesai Belanja ({cartStats.completedCount})
                      </button>
                    </div>

                    {/* Search Field */}
                    <div className="w-full md:w-72 relative">
                      <input
                        type="text"
                        value={cartSearch}
                        onChange={(e) => setCartSearch(e.target.value)}
                        placeholder="Cari pelanggan, WA, atau isi barang..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-4 py-2 text-xs font-bold leading-normal focus:bg-white focus:outline-emerald-600 text-slate-800"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                      {cartSearch && (
                        <button
                          type="button"
                          onClick={() => setCartSearch('')}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-extrabold text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Carts Records View Grid */}
                  {filteredVisitorCarts.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-slate-200 rounded-2.5xl space-y-3 shadow-inner">
                      <span className="text-4xl text-slate-350 block">🛒</span>
                      <h4 className="font-extrabold text-slate-700">Tidak ada keranjang teridentifikasi</h4>
                      <p className="text-xs text-slate-450 max-w-md mx-auto leading-relaxed">
                        Kami tidak menemukan catatan troli belanja yang cocok dengan kriteria filter "{cartFilter}" atau pencarian Anda. Pastikan pixel log berisi peristiwa AddToCart.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {filteredVisitorCarts.map((cart, idx) => {
                        const itemsSubtotal = cart.items.reduce((sum: number, it: any) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
                        const finalCartValue = cart.status === 'Completed' ? (cart.purchaseTotal || itemsSubtotal) : itemsSubtotal;
                        
                        const dateFormatted = cart.lastActivity?.seconds 
                          ? new Date(cart.lastActivity.seconds * 1000).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
                          : new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

                        // Buyer type badge color
                        let buyerBadgeColor = 'bg-slate-100 text-slate-650';
                        let buyerBadgeLabel = 'Personal / Retail';
                        if (cart.buyerType === 'reseller') {
                          buyerBadgeColor = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                          buyerBadgeLabel = 'Reseller / Mitra';
                        } else if (cart.buyerType === 'umkm') {
                          buyerBadgeColor = 'bg-sky-100 text-sky-800 border border-sky-200';
                          buyerBadgeLabel = 'Mitra UMKM';
                        } else if (cart.buyerType === 'household') {
                          buyerBadgeColor = 'bg-amber-100 text-amber-800 border border-amber-200';
                          buyerBadgeLabel = 'Rumah Tangga';
                        }

                        // Status definitions
                        let statusColor = 'bg-slate-100 text-slate-700';
                        let statusLabel = 'Offline';
                        if (cart.status === 'Active') {
                          statusColor = 'bg-blue-50 text-blue-700 border border-blue-200';
                          statusLabel = 'Aktif di Troli';
                        } else if (cart.status === 'Checkout') {
                          statusColor = 'bg-amber-50 text-amber-700 border border-amber-250';
                          statusLabel = 'Proses Checkout';
                        } else if (cart.status === 'Completed') {
                          statusColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                          statusLabel = 'Selesai Belanja';
                        }

                        // Generate WA Message Link
                        const cleanPhone = (phone: string) => {
                          let p = phone.replace(/[^0-9]/g, '');
                          if (p.startsWith('0')) {
                            p = '62' + p.slice(1);
                          }
                          return p;
                        };

                        const bulletListStr = cart.items.map((it: any) => `• ${it.name} (${it.quantity}x) @ Rp ${Number(it.price || 0).toLocaleString('id-ID')}`).join('\n');
                        
                        let waMessage = '';
                        if (cart.status === 'Completed') {
                          waMessage = `Halo Kak *${cart.customerName}*,\n\nTerima kasih banyak telah berbelanja senilai *Rp ${finalCartValue.toLocaleString('id-ID')}* di *Haylofress Ngawi*! 😊\n\nSeluruh bahan makanan segar pilihan Kakak telah kami catat dengan rincian:\n${bulletListStr}\n\nApabila ada saran atau masukan terkait pesanan Kakak, silakan beri tahu kami ya. Have a fresh day! 🌿`;
                        } else {
                          waMessage = `Halo Kak *${cart.customerName}*,\n\nSaya Admin dari *Haylofress Ngawi* 🌿. Kami melihat Kakak baru saja memasukkan beberapa item segar berikut ke troli belanja:\n\n${bulletListStr}\n\n*Total Nilai Troli: Rp ${finalCartValue.toLocaleString('id-ID')}*\n\nApakah ada kendala yang dihadapi saat pemesanan? Kakak bisa langsung membalas pesan ini untuk konfirmasi pesanan agar dapat segera kami siapkan dan kirim ya. Terima kasih banyak! 😊`;
                        }

                        const targetWaUrl = `https://wa.me/${cleanPhone(cart.customerPhone)}?text=${encodeURIComponent(waMessage)}`;

                        return (
                          <div key={cart.id || idx} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200 relative">
                            {/* Card Header information */}
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-center gap-2.5">
                                  {/* Avatar Initials */}
                                  <div className="h-9 w-9 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-700 text-xs border border-slate-200 uppercase">
                                    {cart.customerName.slice(0, 2)}
                                  </div>
                                  <div>
                                    <h4 className="font-extrabold text-slate-900 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                                      <span>{cart.customerName}</span>
                                      <span className={`text-[8.5px] px-1.5 py-0.2 rounded font-extrabold tracking-wide font-mono uppercase ${buyerBadgeColor}`}>
                                        {buyerBadgeLabel}
                                      </span>
                                    </h4>
                                    <p className="text-xs text-slate-450 font-mono mt-0.5">
                                      📞 {cart.customerPhone !== '-' ? cart.customerPhone : 'Tanpa Nomer WA'}
                                    </p>
                                  </div>
                                </div>

                                <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-black uppercase tracking-wider flex items-center gap-1 ${statusColor}`}>
                                  {cart.status === 'Active' && <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />}
                                  {cart.status === 'Checkout' && <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />}
                                  {cart.status === 'Completed' && <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />}
                                  <span>{statusLabel}</span>
                                </span>
                              </div>

                              {/* Timestamp details */}
                              <div className="text-[10.5px] text-slate-400 font-mono flex items-center gap-1 border-b border-slate-150 pb-2.5 leading-none">
                                <span>⏱️ Aktivitas Terakhir:</span>
                                <span className="text-slate-500 font-extrabold uppercase">{dateFormatted} WIB</span>
                              </div>

                              {/* Cart Items List Render */}
                              <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                                  Daftar Produk di Troli ({cart.items.length} item):
                                </p>
                                <div className="bg-slate-50 rounded-xl border border-slate-150 p-3 space-y-2 max-h-36 overflow-y-auto">
                                  {cart.items.map((item: any, i: number) => {
                                    const priceVal = Number(item.price || 0);
                                    const qtyVal = Number(item.quantity || 1);
                                    const itemTot = priceVal * qtyVal;
                                    return (
                                      <div key={i} className="flex justify-between items-center text-xs text-slate-700 last:border-0 pb-1.5 border-b border-slate-150/40 last:pb-0 font-mono">
                                        <div className="font-bold flex items-center gap-1 leading-normal text-left truncate">
                                          <span className="text-emerald-600 font-black">🌱</span>
                                          <span className="truncate max-w-[200px]">{item.name}</span>
                                        </div>
                                        <div className="shrink-0 text-slate-500 font-semibold ml-2 text-right">
                                          <span>{qtyVal}x</span>
                                          <span className="mx-1 text-slate-300">•</span>
                                          <span className="text-slate-800 font-bold">Rp {itemTot.toLocaleString('id-ID')}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Delivery info extracted from complete checkpoint if exists */}
                              {(cart.address || cart.notes || cart.mapsLink) && (
                                <div className="p-2.5 bg-slate-50 border border-slate-200 border-dashed rounded-xl space-y-1.5 text-[11px] text-slate-600 leading-relaxed text-left">
                                  {cart.address && (
                                    <p>
                                      📍 <strong className="text-slate-700">Alamat:</strong> {cart.address}
                                    </p>
                                  )}
                                  {cart.mapsLink && (
                                    <p>
                                      🗺️ <strong className="text-slate-700">Google Maps:</strong>{' '}
                                      <a
                                        href={cart.mapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 font-black hover:underline break-all"
                                      >
                                        {cart.mapsLink}
                                      </a>
                                    </p>
                                  )}
                                  {cart.notes && (
                                    <p>
                                      📝 <strong className="text-slate-700">Catatan Khusus:</strong> "{cart.notes}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Cart value & quick conversion buttons */}
                            <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 -mx-5 -mb-5 p-5 rounded-b-2xl">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-450 font-mono">
                                  {cart.status === 'Completed' ? 'Total Nilai Belanjaan:' : 'Total Potensi Pendapatan:'}
                                </span>
                                <p className="text-base font-black text-slate-900 font-mono leading-none mt-0.5">
                                  Rp {finalCartValue.toLocaleString('id-ID')}
                                </p>
                              </div>

                              <div className="flex gap-2">
                                {cart.customerPhone !== '-' ? (
                                  <a
                                    href={targetWaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`text-xs font-black uppercase tracking-wide px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all text-center justify-center cursor-pointer ${
                                      cart.status === 'Completed'
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-705'
                                    }`}
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>
                                      {cart.status === 'Completed' ? 'Follow Up / Tq WA' : 'Chat Follow Up WA'}
                                    </span>
                                  </a>
                                ) : (
                                  <div className="text-[10px] text-slate-400 italic flex items-center">
                                    No WA Tidak Tersedia
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: CONTACTS, WHATSAPP & FACEBOOK METAPIXEL SETTINGS */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Search & Status Filters */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight text-left">
                          Manajemen Alur Kerja Pesanan Pelanggan
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 text-left">
                          Lacak status pengerjaan, ubah status, masukkan nomor resi waybill, atau cetak slip pengiriman.
                        </p>
                      </div>
                    </div>

                    {/* Order status badges filter row */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {['semua', 'baru', 'diproses', 'dikirim', 'selesai', 'retur'].map((cat) => {
                        let count = 0;
                        if (cat === 'semua') count = dashboardOrders.length;
                        else count = dashboardOrders.filter(o => o.status === cat).length;

                        let color = 'bg-slate-100 text-slate-600';
                        if (cat === 'baru') color = 'bg-red-50 text-red-700 border-red-100 border';
                        else if (cat === 'diproses') color = 'bg-blue-50 text-blue-700 border-blue-100 border';
                        else if (cat === 'dikirim') color = 'bg-amber-50 text-amber-700 border-amber-100 border';
                        else if (cat === 'selesai') color = 'bg-emerald-50 text-emerald-700 border-emerald-100 border';
                        else if (cat === 'retur') color = 'bg-purple-50 text-purple-700 border-purple-100 border';

                        return (
                          <button
                            key={cat}
                            type="button"
                            className="px-3 py-1.5 rounded-lg text-xs font-extrabold capitalize flex items-center gap-1.5 transition whitespace-nowrap border cursor-pointer border-transparent"
                          >
                            <span className={color}>{cat}</span>
                            <span className="bg-white px-1.5 py-0.2 rounded font-mono font-black border border-slate-200 text-slate-700 text-[10px]">
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Orders List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {dashboardOrders.map((o) => {
                      
                      // WA prefilled template text
                      let waMessage = '';
                      const cleanPhone = (p: string) => p.replace(/[^0-9]/g, '');
                      
                      if (o.status === 'baru') {
                        waMessage = `Halo Kak *${o.customerName}*,\n\nTerima kasih, pesanan bahan pokok segar Kakak senilai *Rp ${o.total.toLocaleString('id-ID')}* telah kami terima di *Haylofress Ngawi*! 😊\n\nSedang kami jadwalkan untuk dipersiapkan oleh tim pengemas. Mohon ditunggu ya! 🌿`;
                      } else if (o.status === 'diproses') {
                        waMessage = `Halo Kak *${o.customerName}*,\n\nKabar gembira! Pesanan Kakak di *Haylofress Ngawi* sedang dikemas dengan rapi oleh tim kami untuk memastikan kesegarannya terjaga sampai ke rumah Kakak. 🥦🥩`;
                      } else if (o.status === 'dikirim') {
                        waMessage = `Halo Kak *${o.customerName}*,\n\nPesanan Kakak telah dikirim dari toko kami! 🚚💨\n\nNo. Resi Pelacakan: *${o.waybill || '-'}*\n\nTerima kasih banyak telah mempercayakan kebutuhan konsumsi keluarga kepada kami. Have a fresh day! 🌿`;
                      } else if (o.status === 'selesai') {
                        waMessage = `Halo Kak *${o.customerName}*,\n\nTerima kasih banyak telah berbelanja di *Haylofress Ngawi*! 😊\n\nSemoga seluruh bahan segar yang dikirim memuaskan ya Kak. Ditunggu pesanan berikutnya! Have a wonderful day! 🌿`;
                      } else {
                        waMessage = `Halo Kak *${o.customerName}*,\n\nTerkait permintaan pengembalian (retur) pesanan Kakak, kami memohon maaf yang sebesar-besarnya atas ketidaknyamanan yang terjadi. Admin kami akan segera membantu proses verifikasi dan refund. Terima kasih atas pengertiannya. 🙏`;
                      }

                      const waLink = `https://wa.me/${cleanPhone(o.customerPhone)}?text=${encodeURIComponent(waMessage)}`;

                      return (
                        <div key={o.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between text-left">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-black text-slate-400 font-mono tracking-wider">{o.id}</span>
                                <h4 className="font-extrabold text-slate-900 text-sm mt-0.5">{o.customerName}</h4>
                              </div>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                                o.status === 'baru' ? 'bg-red-100 text-red-700 border border-red-200' :
                                o.status === 'diproses' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                o.status === 'dikirim' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                o.status === 'selesai' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-purple-100 text-purple-700 border border-purple-200'
                              }`}>
                                {o.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                              <p>📞 No WA: <strong className="text-slate-800">{o.customerPhone}</strong></p>
                              <p>📍 Alamat: <span className="text-slate-700 font-medium">{o.address}</span></p>
                              {o.notes && <p>📝 Catatan: <span className="text-slate-700 italic">"{o.notes}"</span></p>}
                              {o.waybill && <p>🚚 No. Resi: <strong className="text-indigo-600">{o.waybill}</strong></p>}
                            </div>

                            {/* Items purchased list */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-black tracking-wide text-slate-400 font-mono">Daftar Belanja:</span>
                              <div className="space-y-1 max-h-24 overflow-y-auto pl-1">
                                {o.items.map((it: any, i: number) => (
                                  <div key={i} className="text-xs text-slate-600 flex justify-between">
                                    <span>• {it.name} ({it.quantity} {it.unit || 'Kg'})</span>
                                    <span className="font-mono text-slate-800 font-bold">Rp {it.subtotal.toLocaleString('id-ID')}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-slate-450 uppercase font-black font-mono">Total Transaksi:</span>
                              <span className="text-base font-black text-emerald-600 font-mono">Rp {o.total.toLocaleString('id-ID')}</span>
                            </div>

                            {/* Actions row */}
                            <div className="grid grid-cols-2 gap-2">
                              {o.status === 'baru' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'diproses')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Proses Pesanan</span>
                                </button>
                              )}

                              {o.status === 'diproses' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForShipping(o)}
                                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Kirim (Input Resi)</span>
                                </button>
                              )}

                              {o.status === 'dikirim' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'selesai')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selesai Belanja</span>
                                </button>
                              )}

                              {o.status !== 'retur' && o.status !== 'selesai' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateOrderStatus(o.id, 'retur')}
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-extrabold text-[11px] py-2 rounded-lg transition text-center cursor-pointer"
                                >
                                  Simulasi Retur
                                </button>
                              )}

                              {/* WhatsApp Follow-up */}
                              <a
                                href={waLink}
                                target="_blank"
                                rel="noreferrer"
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Follow Up WA</span>
                              </a>

                              {/* Print label button */}
                              <button
                                type="button"
                                onClick={() => setSelectedPickupOrder(o)} // Trigger print label modal
                                className="col-span-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] py-2 rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Cetak Label Pengiriman</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Section Title Divider */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left mt-8">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-600" />
                      <span>Konfigurasi Integrasi WhatsApp & Pelacak Facebook Meta Pixel</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Atur nomor penerima checkout WhatsApp serta masukkan Pixel ID untuk sinkronisasi otomatis kode standar piksel.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
                  
                  {/* Left Column: Config Forms */}
                  <div className="lg:col-span-5 space-y-6">
                    <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
                      <h4 className="text-xs font-black uppercase text-emerald-700 font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Phone className="w-4 h-4 text-emerald-600 animate-pulse" />
                        <span>Nomor WhatsApp Terkait</span>
                      </h4>
                      
                      <div className="space-y-3.5">
                        <div className="bg-emerald-50 border border-emerald-100 text-emerald-850 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start">
                          <HelpCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                          <div>
                            <strong className="font-extrabold text-emerald-900">Format WhatsApp:</strong>
                            <p className="text-slate-650 mt-0.5">
                              Tulis dengan kode negara di awal, tanpa tanda + atau - (Contoh: <strong className="font-mono font-bold">6281234567890</strong>). Nomor ini dipakai di seluruh tombol check-out produk.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                            Nomor WhatsApp Utama
                          </label>
                          <input
                            type="text"
                            name="waNumber"
                            value={settingsForm.waNumber}
                            onChange={handleInputChange}
                            placeholder="Contoh: 6281234567890"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Nomor WA</span>
                        </button>
                      </div>
                    </form>

                    <form onSubmit={handleSaveSettings} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
                      <h4 className="text-xs font-black uppercase text-blue-700 font-mono tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                        <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                        <span>Koneksi Facebook / Meta Pixel</span>
                      </h4>

                      <div className="space-y-3.5">
                        <div className="bg-blue-50 border border-blue-100 text-blue-800 p-3.5 rounded-2xl text-xs flex gap-2.5 items-start">
                          <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <div>
                            <strong className="font-extrabold text-blue-900">Pixel ID Tracking:</strong>
                            <p className="text-slate-650 mt-0.5">
                              Masukkan ID unik Meta Pixel Facebook Anda. Kode standard tracking (Page View, Add to Cart, Initiate Checkout, Purchase) akan otomatis diinjeksi secara real-time.
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-1.5 font-mono">
                            Meta Pixel ID
                          </label>
                          <input
                            type="text"
                            name="metaPixelId"
                            value={settingsForm.metaPixelId || ''}
                            onChange={handleInputChange}
                            placeholder="Contoh: 123456789012345"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-blue-600 focus:border-blue-600 transition shadow-inner font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Meta Pixel ID</span>
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Customer Google/Meta Analytics Dashboard */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-xl space-y-5">
                      
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">
                            Real-Time Analytics
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-100 tracking-tight mt-1">
                            Dasbor Analitik Trafik Pelanggan (Meta Pixel)
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={fetchAnalytics}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
                          title="Refresh Analitik"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Trafik Kunjungan</span>
                          <p className="text-xl font-black font-mono text-emerald-400">
                            {analyticsStats.pageViews} <span className="text-xs font-normal text-slate-500">kali</span>
                          </p>
                        </div>
                        
                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Tambah Keranjang</span>
                          <p className="text-xl font-black font-mono text-blue-400">
                            {analyticsStats.addToCartCount} <span className="text-xs font-normal text-slate-500">item</span>
                          </p>
                        </div>

                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Mulai Checkout</span>
                          <p className="text-xl font-black font-mono text-amber-400">
                            {analyticsStats.checkoutCount} <span className="text-xs font-normal text-slate-500">kali</span>
                          </p>
                        </div>

                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pesanan Terkirim</span>
                          <p className="text-xl font-black font-mono text-pink-400">
                            {analyticsStats.purchaseCount} <span className="text-xs font-normal text-slate-500">kali</span>
                          </p>
                        </div>

                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1 col-span-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Konversi Pelanggan</span>
                          <p className="text-xl font-black font-mono text-cyan-400">
                            {((analyticsStats.purchaseCount / analyticsStats.pageViews) * 100).toFixed(1)}%
                          </p>
                        </div>

                        <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 space-y-1 col-span-2 sm:col-span-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Pemasukan (Est. Omset)</span>
                          <p className="text-sm font-extrabold font-mono text-white leading-normal truncate">
                            Rp {analyticsStats.totalSales.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Events List Stream */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                          Live Event Stream (Maks. 15 Histori)
                        </span>
                        
                        <div className="bg-slate-950 border border-slate-850 rounded-xl max-h-56 overflow-y-auto p-2.5 space-y-2 font-mono text-[11px]">
                          {analyticsLogs.length === 0 ? (
                            <div className="text-center text-slate-600 py-6">
                              Belum ada interaksi terekam dari pengunjung.
                            </div>
                          ) : (
                            analyticsLogs.slice(0, 15).map((log, index) => {
                              const date = log.timestamp?.seconds 
                                ? new Date(log.timestamp.seconds * 1000).toLocaleTimeString('id-ID')
                                : new Date().toLocaleTimeString('id-ID');
                              
                              let badgeColor = 'bg-slate-850 text-slate-300 border-slate-800';
                              if (log.eventName === 'AddToCart') badgeColor = 'bg-blue-950 text-blue-300 border-blue-900 border';
                              if (log.eventName === 'CartUpdate') badgeColor = 'bg-indigo-950 text-indigo-300 border-indigo-900 border';
                              if (log.eventName === 'InitiateCheckout') badgeColor = 'bg-amber-950 text-amber-300 border-amber-900 border';
                              if (log.eventName === 'Purchase') badgeColor = 'bg-pink-950 text-pink-300 border-pink-900 border';
                              if (log.eventName === 'PageView') badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-900 border';

                              return (
                                <div key={log.id || index} className="flex flex-col border-b border-slate-900 pb-2.5 mb-2.5 last:border-0 last:pb-0 last:mb-0 gap-1 text-left">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2 flex-wrap animate-fade-in">
                                      <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wide inline-block ${badgeColor}`}>
                                        {log.eventName}
                                      </span>
                                      <span className="text-slate-300 font-bold text-[12px]">
                                        {log.eventName === 'Purchase' 
                                          ? `Transaksi: Rp ${(log.params?.value || 0).toLocaleString('id-ID')}` 
                                          : log.eventName === 'AddToCart'
                                          ? `Tambah Troli: ${log.params?.content_name || 'barang'} (${log.params?.quantity || 1}x)`
                                          : log.eventName === 'CartUpdate'
                                          ? `Mengubah Belanjaan`
                                          : log.eventName === 'InitiateCheckout'
                                          ? `Checkout: Rp ${(log.params?.value || 0).toLocaleString('id-ID')}`
                                          : `Kunjungan Landing Page`}
                                      </span>
                                    </div>
                                    <span className="text-slate-500 text-[10px] flex items-center gap-1 self-start sm:self-auto font-mono">
                                      ⏱️ {date}
                                    </span>
                                  </div>

                                  {/* Capture and display detailed customer context on completed Purchase, AddToCart, or CartUpdate */}
                                  {(log.eventName === 'Purchase' || log.eventName === 'AddToCart' || log.eventName === 'CartUpdate') && (log.params?.customer_name || log.params?.customer_phone) && (
                                    <div className="mt-1.5 p-2 px-2.5 bg-slate-950/65 border border-slate-900 rounded-lg space-y-1 text-slate-300 text-[11px] leading-relaxed select-all animate-fade-in">
                                      <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-slate-400 font-semibold">{log.eventName === 'Purchase' ? 'Pembeli:' : 'Calon Pembeli:'}</span>
                                        <span className="text-white font-extrabold">{log.params?.customer_name || '-'}</span>
                                        <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-900 px-1 py-0.2 rounded font-black uppercase tracking-wider">
                                          {log.params?.buyer_type === 'reseller' ? 'Reseller / Mitra' : log.params?.buyer_type === 'umkm' ? 'UMKM' : 'Rumah Tangga'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1 flex-wrap font-mono">
                                        <span className="text-slate-500 font-semibold">WhatsApp:</span>
                                        {log.params?.customer_phone && log.params?.customer_phone !== '-' ? (
                                          <a
                                            href={`https://wa.me/${log.params?.customer_phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-400 hover:underline font-bold flex items-center gap-0.5"
                                          >
                                            +{log.params?.customer_phone} 🔗
                                          </a>
                                        ) : (
                                          <span className="text-slate-600 font-bold">-</span>
                                        )}
                                      </div>

                                      {/* Highlight items inside cart for AddToCart or CartUpdate */}
                                      {log.params?.cart_items && Array.isArray(log.params.cart_items) && log.params.cart_items.length > 0 && (
                                        <div className="pt-1 mt-1 border-t border-slate-900/60 space-y-0.5">
                                          <span className="text-slate-500 font-semibold block text-[9.5px] uppercase font-mono tracking-wide">Troli Saat Ini ({log.params.cart_items.length}):</span>
                                          <div className="space-y-0.5 pl-1">
                                            {log.params.cart_items.map((it: any, itIdx: number) => (
                                              <div key={itIdx} className="text-slate-300 flex justify-between gap-1 max-w-xs text-[10px]">
                                                <span className="truncate font-medium text-emerald-300">🌿 {it.name}</span>
                                                <span className="font-bold text-slate-400">({it.quantity}x)</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      
                                      {log.eventName === 'Purchase' && log.params?.customer_address && (
                                        <div className="flex items-start gap-1">
                                          <span className="text-slate-400 font-semibold flex-shrink-0">Lokasi:</span>
                                          <span className="text-slate-300 font-medium text-left">{log.params?.customer_address}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* SECTION FOR EXCEL EXPORT & DETAILED TRANSACTION LOGS */}
                <div id="order-transaction-table" className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/85 shadow-md space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-150 pb-4">
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        <span>Daftar Transaksi & Pesanan Masuk (Analitik Checkout)</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rekaman data lengkap pembeli, alamat, nomor WhatsApp, rincian produk, dan total belanja dari tombol checkout WhatsApp.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportToExcel}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Ekspor ke Excel (.CSV)</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200/65 font-sans">
                    <table className="min-w-full divide-y divide-slate-100 text-xs text-slate-700 text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Tanggal & Waktu</th>
                          <th className="px-4 py-3">Nama Pembeli</th>
                          <th className="px-4 py-3">No. WhatsApp</th>
                          <th className="px-4 py-3">Alamat Pengiriman</th>
                          <th className="px-4 py-3">Rincian Barang yg Dibeli</th>
                          <th className="px-4 py-3 text-right">Total Belanja</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {(() => {
                          const purchaseLogs = analyticsLogs.filter(log => log.eventName === 'Purchase');
                          if (purchaseLogs.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                                  Belum ada transaksi pembelian atau pesanan masuk yang tercatat di sistem.
                                </td>
                              </tr>
                            );
                          }
                          return purchaseLogs.map((log, index) => {
                            const dateStr = log.timestamp?.seconds 
                              ? new Date(log.timestamp.seconds * 1000).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })
                              : new Date().toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                });

                            const itemsList = log.params?.items || [];
                            
                            return (
                              <tr key={log.id || index} className="hover:bg-slate-50/50 transition">
                                {/* Date column */}
                                <td className="px-4 py-3.5 align-top whitespace-nowrap font-mono text-[11px] text-slate-500">
                                  {dateStr}
                                </td>
                                {/* Name column */}
                                <td className="px-4 py-3.5 align-top font-bold text-slate-900 font-sans">
                                  <div className="flex flex-col gap-0.5">
                                    <span>{log.params?.customer_name || 'Tanpa Nama'}</span>
                                    <span className="text-[10px] text-slate-550 capitalize bg-slate-50 px-1.5 py-0.5 rounded w-fit border border-slate-150 mt-1 font-mono">
                                      {log.params?.buyer_type === 'reseller' 
                                        ? 'Reseller' 
                                        : log.params?.buyer_type === 'umkm' 
                                        ? 'UMKM Kuliner' 
                                        : 'Rumah Tangga'}
                                    </span>
                                  </div>
                                </td>
                                {/* Whatsapp column */}
                                <td className="px-4 py-3.5 align-top">
                                  {log.params?.customer_phone ? (
                                    <a
                                      href={`https://wa.me/${log.params.customer_phone.replace(/^0/, '62')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 font-mono"
                                    >
                                      <span>{log.params.customer_phone}</span>
                                      <span>📱</span>
                                    </a>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                {/* Address column */}
                                <td className="px-4 py-3.5 align-top max-w-xs break-words leading-relaxed text-slate-600">
                                  <div>{log.params?.customer_address || 'Ngawi'}</div>
                                  {log.params?.customer_notes && (
                                    <div className="text-[10px] text-amber-805 font-semibold italic mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                      Catatan: {log.params.customer_notes}
                                    </div>
                                  )}
                                </td>
                                {/* Items column */}
                                <td className="px-4 py-3.5 align-top leading-relaxed text-slate-650 text-[11px]">
                                  {itemsList.length > 0 ? (
                                    <div className="space-y-1.5">
                                      {itemsList.map((item: any, itemIdx: number) => (
                                        <div key={itemIdx} className="flex justify-between items-start gap-3">
                                          <span className="font-semibold text-slate-800">
                                            • {item.name} <span className="text-slate-500 font-normal">({item.quantity} {item.unit})</span>
                                          </span>
                                          <span className="text-[10px] font-mono whitespace-nowrap text-slate-500">
                                            Rp {item.subtotal?.toLocaleString('id-ID')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic">
                                      Detail barang tidak terekam ({log.params?.num_items || 1} item)
                                    </span>
                                  )}
                                </td>
                                {/* Total column */}
                                <td className="px-4 py-3.5 align-top text-right font-black font-mono text-emerald-600 text-sm whitespace-nowrap">
                                  Rp {(log.params?.value || 0).toLocaleString('id-ID')}
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

              {/* TAB 4: ADMIN MANAGEMENT AND DELEGATION */}
              {activeTab === 'admins' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left Column: Register New Admin */}
                  <div className="lg:col-span-5">
                    <form onSubmit={handleRegisterNewAdminByAdmin} className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-sm">
                      <div className="space-y-1">
                        <h4 className="text-xs font-black uppercase text-emerald-700 font-mono tracking-wider flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span>Daftarkan Admin Baru</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Sesi ini memungkinkan Anda untuk mendaftarkan akun pengelola tambahan ke database tanpa menginterupsi/mengeluarkan login sesi saat ini.
                        </p>
                      </div>

                      <hr className="border-slate-100" />

                      {adminRegisterSuccess && (
                        <div className="bg-emerald-50 border border-emerald-150 p-3 rounded-xl text-xs font-bold text-emerald-800 animate-fade-in">
                          {adminRegisterSuccess}
                        </div>
                      )}

                      {adminRegisterError && (
                        <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl text-xs font-bold text-rose-800 animate-fade-in flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <span>{adminRegisterError}</span>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-mono">
                            Email Admin Baru
                          </label>
                          <input
                            type="email"
                            value={newAdminEmail}
                            onChange={(e) => setNewAdminEmail(e.target.value)}
                            placeholder="nama.admin@haylofress.com"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner font-mono font-medium text-slate-900"
                            disabled={isAdminCreating}
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-650 mb-1.5 font-mono">
                            Katasandi Akun Baru
                          </label>
                          <input
                            type="password"
                            value={newAdminPassword}
                            onChange={(e) => setNewAdminPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:outline-emerald-600 focus:border-emerald-600 transition shadow-inner"
                            disabled={isAdminCreating}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isAdminCreating}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                        >
                          {isAdminCreating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Mendaftarkan Akun...</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-5 h-5" />
                              <span>Daftarkan Hak Akses Admin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Right Column: Active Admins List */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-black uppercase text-slate-700 font-mono tracking-wider">
                            Administrator Aktif ({adminsList.length + 1})
                          </h4>
                          <p className="text-[10px] text-slate-400">
                            Izin modifikasi katalog produk dan pengaturan landing page.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={fetchAdminsList}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
                          title="Refresh Daftar"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <hr className="border-slate-100" />

                      <div className="space-y-2.5">
                        {/* 1. Super Admin (Always Pinned) */}
                        <div className="bg-emerald-50/50 border border-emerald-100/80 p-3.5 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                          <div className="min-w-0">
                            <span className="text-[9px] bg-emerald-600 text-white px-2 py-0.5 rounded-md font-bold font-mono tracking-widest uppercase inline-block mb-1">
                              👑 Super Admin
                            </span>
                            <h5 className="text-xs font-black font-mono text-slate-800 truncate">
                              ragapermana96@gmail.com
                            </h5>
                            <p className="text-[10px] text-emerald-700 font-medium">
                              Sesi email pendiri & penandatangan Firestore Rules.
                            </p>
                          </div>
                          <span className="text-xs text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-black text-[10px] tracking-wide shrink-0">
                            Utama
                          </span>
                        </div>

                        {/* 2. Dynamically Loaded Admins */}
                        {adminsList.map((adm) => {
                          if (adm.email === 'ragapermana96@gmail.com') return null; // skip duplicate

                          return (
                            <div key={adm.id} className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 p-3.5 rounded-xl flex items-center justify-between gap-3 transition">
                              <div className="min-w-0">
                                <span className="text-[9px] bg-slate-600 text-white px-2 py-0.5 rounded-md font-bold font-mono tracking-wider uppercase inline-block mb-1">
                                  ✓ Associate Admin
                                </span>
                                <h5 className="text-xs font-black font-mono text-slate-800 truncate">
                                  {adm.email}
                                </h5>
                                <p className="text-[10px] text-slate-400">
                                  Ditambahkan oleh: <span className="font-semibold text-slate-600">{adm.createdBy || 'System'}</span>
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminDoc(adm.id, adm.email)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition shrink-0 cursor-pointer"
                                title="Cabut Akses Admin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                </div>
              )}
              </div>
            </div>
          )}
        </div>

        {/* Panel Footer */}
        <div className="p-4 bg-slate-150 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Database Terkoneksi: Cloud Firestore</span>
          <span>© Haylofress Ngawi</span>
        </div>
      </motion.div>
    </div>
  );
}

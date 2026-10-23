/**
 * ShopNova - Main JavaScript Module
 * Handles Global State, LocalStorage Storage Manager, Seed Data,
 * Header Counter Badges, Live Search, Mobile Navigation, and Toast Notifications.
 */

// ==========================================================================
// 1. Initial Mock / Seed Product Data
// ==========================================================================
const DEFAULT_PRODUCTS = [
  {
    id: "sn-101",
    name: "Aura Pro Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    price: 199.99,
    originalPrice: 279.99,
    discount: 28,
    rating: 4.8,
    reviewCount: 142,
    stock: 25,
    badge: "Trending",
    featured: true,
    bestSeller: true,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80"
    ],
    colors: ["#1e293b", "#e2e8f0", "#1e3a8a"],
    sizes: [],
    shortDesc: "Experience pure audio immersion with industry-leading Active Noise Cancellation and 40-hour battery life.",
    description: "The Aura Pro Wireless headphones deliver transcendent acoustics, ultra-plush memory foam earcups, multi-point Bluetooth 5.3 connectivity, and high-fidelity 40mm titanium drivers. Perfect for travel, work, and gaming.",
    specs: {
      "Battery Life": "40 Hours with ANC On",
      "Connectivity": "Bluetooth 5.3 / 3.5mm Aux",
      "Weight": "250g",
      "Charging": "USB-C Fast Charging (10m = 5h playback)",
      "Warranty": "2 Years International"
    }
  },
  {
    id: "sn-102",
    name: "Vanguard Chrono Smartwatch Series 9",
    category: "Watches",
    price: 249.00,
    originalPrice: 320.00,
    discount: 22,
    rating: 4.9,
    reviewCount: 98,
    stock: 18,
    badge: "Hot",
    featured: true,
    bestSeller: true,
    newArrival: true,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80"
    ],
    colors: ["#0f172a", "#d97706", "#94a3b8"],
    sizes: ["41mm", "45mm"],
    shortDesc: "Always-on Retina OLED display, heart rate monitor, ECG, GPS, and water-resistance up to 50 meters.",
    description: "Crafted from aerospace-grade aluminum with sapphire crystal glass. Features advanced workout telemetry, blood oxygen sensors, sleep coaching, and seamless smartphone notifications.",
    specs: {
      "Display": "1.92-inch AMOLED Always-On",
      "Water Resistance": "50m (5 ATM)",
      "Battery": "Up to 3 Days Normal Use",
      "Sensors": "Optical Heart, SpO2, ECG, Accelerometer",
      "Compatibility": "iOS & Android"
    }
  },
  {
    id: "sn-103",
    name: "Apex Aero Performance Running Sneakers",
    category: "Footwear",
    price: 129.50,
    originalPrice: 160.00,
    discount: 19,
    rating: 4.7,
    reviewCount: 84,
    stock: 32,
    badge: "Popular",
    featured: true,
    bestSeller: false,
    newArrival: true,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80"
    ],
    colors: ["#dc2626", "#2563eb", "#0f172a"],
    sizes: ["US 8", "US 9", "US 10", "US 11", "US 12"],
    shortDesc: "Engineered responsive cushioning with breathable mesh upper for marathon runners and casual athletes.",
    description: "Equipped with carbon-fiber infused propulsion plates and cloud-cushion EVA midsoles for energy return with every stride. Breathable knit upper ensures your feet stay cool and dry.",
    specs: {
      "Upper": "Engineered Primeknit Mesh",
      "Midsole": "EnergyBounce EVA Foam",
      "Drop": "8mm",
      "Weight": "210g",
      "Terrain": "Road & Track"
    }
  },
  {
    id: "sn-104",
    name: "Urban Minimalist Waterproof Commuter Backpack",
    category: "Fashion",
    price: 79.99,
    originalPrice: 110.00,
    discount: 27,
    rating: 4.6,
    reviewCount: 67,
    stock: 45,
    badge: "Sale",
    featured: true,
    bestSeller: false,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&q=80"
    ],
    colors: ["#334155", "#0284c7", "#475569"],
    sizes: ["20L", "28L"],
    shortDesc: "Weatherproof 1000D Cordura fabric with padded 16-inch laptop compartment and hidden anti-theft pockets.",
    description: "Designed for modern commuters and digital nomads. Includes an integrated USB pass-through port, ergonomic memory foam back support, and luggage pass-through strap.",
    specs: {
      "Capacity": "24 Liters",
      "Material": "Waterproof 1000D Oxford Ballistic",
      "Laptop Sleeve": "Fits up to 16-inch MacBook Pro",
      "Dimensions": "48 x 30 x 15 cm",
      "Weight": "850g"
    }
  },
  {
    id: "sn-105",
    name: "Lumix Artisan Espresso & Cappuccino Maker",
    category: "Home & Kitchen",
    price: 349.00,
    originalPrice: 450.00,
    discount: 22,
    rating: 4.9,
    reviewCount: 115,
    stock: 12,
    badge: "Best Seller",
    featured: true,
    bestSeller: true,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80"
    ],
    colors: ["#e2e8f0", "#0f172a"],
    sizes: [],
    shortDesc: "20-bar Italian precision pump with commercial steam wand for velvety microfoam and rich golden crema.",
    description: "Bring café-quality espresso into your kitchen. Features PID temperature control, dual thermoblock heating, and a solid brushed stainless steel chassis.",
    specs: {
      "Pump Pressure": "20 Bar Italian Ulka",
      "Water Tank": "1.8 Liters Removable",
      "Heating System": "Dual Thermoblock Rapid Heat",
      "Power": "1450 Watts",
      "Material": "Stainless Steel"
    }
  },
  {
    id: "sn-106",
    name: "Classic Aviator Polarized Sunglasses",
    category: "Fashion",
    price: 49.99,
    originalPrice: 85.00,
    discount: 41,
    rating: 4.5,
    reviewCount: 52,
    stock: 60,
    badge: "Discount",
    featured: false,
    bestSeller: false,
    newArrival: true,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80"
    ],
    colors: ["#eab308", "#0f172a", "#94a3b8"],
    sizes: ["Standard"],
    shortDesc: "UV400 anti-glare polarized lenses with durable lightweight metal alloy frame and silicone nose pads.",
    description: "Timeless style meets modern optical clarity. Reduces 99% of reflected glare from water and pavement, offering 100% UVA/UVB ray shielding.",
    specs: {
      "Lens Material": "TAC Triacetate Polarized",
      "UV Protection": "100% UV400",
      "Frame": "Nickel-Free Metal Alloy",
      "Bridge Width": "14mm",
      "Lens Width": "58mm"
    }
  },
  {
    id: "sn-107",
    name: "SonicPulse Studio Bluetooth Speaker",
    category: "Electronics",
    price: 119.00,
    originalPrice: 159.00,
    discount: 25,
    rating: 4.8,
    reviewCount: 76,
    stock: 22,
    badge: "Trending",
    featured: true,
    bestSeller: false,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"
    ],
    colors: ["#1e293b", "#0284c7"],
    sizes: [],
    shortDesc: "360-degree room-filling acoustic sound with deep bass subwoofer and IPX7 waterproof rating.",
    description: "Engineered with dual passive radiators and DSP audio algorithms for crystal clear highs and punchy bass. Up to 24 hours of non-stop playback on a single charge.",
    specs: {
      "Battery": "24 Hours Playtime (6600mAh)",
      "Output": "40W RMS Peak",
      "Waterproof": "IPX7 Submersible",
      "Wireless": "Bluetooth 5.3 + TWS Stereo Pairing"
    }
  },
  {
    id: "sn-108",
    name: "Everest Vintage Leather Travel Duffel",
    category: "Fashion",
    price: 159.99,
    originalPrice: 220.00,
    discount: 27,
    rating: 4.9,
    reviewCount: 39,
    stock: 14,
    badge: "New",
    featured: false,
    bestSeller: true,
    newArrival: true,
    image: "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&q=80"
    ],
    colors: ["#78350f", "#451a03"],
    sizes: ["45L"],
    shortDesc: "Full-grain genuine vintage leather with heavy-duty YKK brass zippers and detachable padded strap.",
    description: "Handcrafted to age with a rich patina over time. Ample storage for weekend getaways, business trips, or gym sessions with dedicated ventilated shoe compartment.",
    specs: {
      "Material": "100% Full Grain Buffalo Leather",
      "Hardware": "Solid Brass & YKK Zippers",
      "Lining": "Heavy Duty Duck Cotton Canvas",
      "Dimensions": "52 x 28 x 26 cm"
    }
  },
  {
    id: "sn-109",
    name: "Nordic Minimalist Ceramic Pour-Over Kettle",
    category: "Home & Kitchen",
    price: 64.00,
    originalPrice: 80.00,
    discount: 20,
    rating: 4.7,
    reviewCount: 44,
    stock: 28,
    badge: "Sale",
    featured: false,
    bestSeller: false,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80"
    ],
    colors: ["#f8fafc", "#1e293b"],
    sizes: ["800ml"],
    shortDesc: "Precision gooseneck spout for optimal water flow rate, built-in thermometer, and walnut wood handle.",
    description: "Achieve the ultimate slow pour extraction. Ergonomic counterbalanced real walnut handle ensures smooth pouring with zero wrist strain.",
    specs: {
      "Capacity": "800ml (27 fl oz)",
      "Spout": "Precision 6.5mm Gooseneck",
      "Material": "Food-grade 304 Stainless Steel + Ceramic Coating",
      "Thermometer": "Analog Dial in Lid"
    }
  },
  {
    id: "sn-110",
    name: "Zenith Pro Wireless Mechanical Keyboard",
    category: "Electronics",
    price: 139.99,
    originalPrice: 180.00,
    discount: 22,
    rating: 4.9,
    reviewCount: 168,
    stock: 20,
    badge: "Hot",
    featured: true,
    bestSeller: true,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80"
    ],
    colors: ["#1e293b", "#f1f5f9"],
    sizes: ["75% Layout"],
    shortDesc: "Hot-swappable tactile switches, RGB per-key backlighting, aluminum body, and multi-device Bluetooth.",
    description: "Engineered for speed, durability, and satisfying acoustics. Supports wired USB-C, 2.4G dongle, and 3-device Bluetooth switching compatible with Mac and Windows.",
    specs: {
      "Switch Type": "Gateron Brown Pro (Hot-swappable)",
      "Keycaps": "Double-shot PBT OEM profile",
      "Battery": "4000mAh (Up to 200h without RGB)",
      "Connectivity": "Tri-mode (Bluetooth 5.1 / 2.4GHz / Type-C)"
    }
  },
  {
    id: "sn-111",
    name: "BreezeTech Ultrasonic Cool Mist Humidifier",
    category: "Home & Kitchen",
    price: 59.99,
    originalPrice: 89.99,
    discount: 33,
    rating: 4.6,
    reviewCount: 57,
    stock: 35,
    badge: "Popular",
    featured: false,
    bestSeller: false,
    newArrival: true,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80"
    ],
    colors: ["#ffffff"],
    sizes: ["4.5L"],
    shortDesc: "Ultra-quiet 24dB operation, essential oil aroma diffuser tray, and smart humidity sensor with auto shutoff.",
    description: "Keeps dry indoor air fresh and comfortably moisturized for up to 36 continuous hours. Features a top-fill design for effortless refilling and cleaning.",
    specs: {
      "Tank Size": "4.5 Liters",
      "Coverage": "Up to 450 sq ft",
      "Noise Level": "Less than 24dB",
      "Special Feature": "Aromatherapy Essential Oil Tray"
    }
  },
  {
    id: "sn-112",
    name: "Heritage Chronograph Automatic Watch",
    category: "Watches",
    price: 389.00,
    originalPrice: 499.00,
    discount: 22,
    rating: 4.9,
    reviewCount: 63,
    stock: 9,
    badge: "Limited",
    featured: true,
    bestSeller: false,
    newArrival: false,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
    thumbnails: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80"
    ],
    colors: ["#1e293b", "#78350f"],
    sizes: ["42mm"],
    shortDesc: "Japanese Miyota 24-jewel automatic movement, exhibition caseback, and Italian calfskin strap.",
    description: "A testament to traditional horology. Never needs a battery; winds automatically with your natural movement. Water-resistant to 100 meters with anti-reflective sapphire glass.",
    specs: {
      "Movement": "Miyota 9015 Automatic (28,800 bph)",
      "Power Reserve": "42 Hours",
      "Glass": "Domed Sapphire Crystal with AR Coating",
      "Case": "316L Surgical Stainless Steel",
      "Strap": "Genuine Italian Horween Leather"
    }
  }
];

// Seed Categories
const DEFAULT_CATEGORIES = [
  { name: "Electronics", count: 4, icon: "fa-laptop", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&q=80" },
  { name: "Watches", count: 2, icon: "fa-clock", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80" },
  { name: "Fashion", count: 3, icon: "fa-shirt", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80" },
  { name: "Footwear", count: 1, icon: "fa-shoe-prints", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80" },
  { name: "Home & Kitchen", count: 3, icon: "fa-mug-hot", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=300&q=80" },
  { name: "Accessories", count: 2, icon: "fa-glasses", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&q=80" }
];

// Seed Coupons
const DEFAULT_COUPONS = {
  "RJ20": { discount: 20, type: "percent", desc: "20% off entire order" },
  "NOVA20": { discount: 20, type: "percent", desc: "20% off entire order" },
  "SAVE10": { discount: 10, type: "fixed", desc: "$10 flat discount" },
  "FREESHIP": { discount: 0, type: "shipping", desc: "Free standard shipping" }
};

// ==========================================================================
// 2. Storage Manager (LocalStorage wrapper)
// ==========================================================================
const ShopNovaStorage = {
  KEYS: {
    PRODUCTS: "shopnova_products",
    CART: "shopnova_cart",
    WISHLIST: "shopnova_wishlist",
    USERS: "shopnova_users",
    CURRENT_USER: "shopnova_current_user",
    ORDERS: "shopnova_orders",
    COUPONS: "shopnova_coupons",
    APPLIED_COUPON: "shopnova_applied_coupon",
    REVIEWS: "shopnova_reviews"
  },

  init() {
    if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
      localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(this.KEYS.CART)) {
      localStorage.setItem(this.KEYS.CART, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.KEYS.WISHLIST)) {
      localStorage.setItem(this.KEYS.WISHLIST, JSON.stringify([]));
    }
    // Always ensure RJ20 coupon is present
    const existingCoupons = JSON.parse(localStorage.getItem(this.KEYS.COUPONS) || "{}");
    localStorage.setItem(this.KEYS.COUPONS, JSON.stringify({ ...DEFAULT_COUPONS, ...existingCoupons, RJ20: DEFAULT_COUPONS.RJ20 }));

    if (!localStorage.getItem(this.KEYS.USERS)) {
      const demoUsers = [
        {
          name: "Demo Customer",
          email: "customer@rjfashion.com",
          phone: "+1 555-0199",
          password: "Password123!",
          role: "customer",
          address: "742 Evergreen Terrace, Springfield, OR"
        },
        {
          name: "RJ Fashion Admin",
          email: "admin@rjfashion.com",
          phone: "+1 555-0100",
          password: "AdminPassword123!",
          role: "admin",
          address: "100 Fashion Tower, New York, NY"
        },
        {
          name: "ShopNova Customer",
          email: "customer@shopnova.com",
          phone: "+1 555-0199",
          password: "Password123!",
          role: "customer",
          address: "742 Evergreen Terrace, Springfield, OR"
        },
        {
          name: "ShopNova Admin",
          email: "admin@shopnova.com",
          phone: "+1 555-0100",
          password: "AdminPassword123!",
          role: "admin",
          address: "100 Fashion Tower, New York, NY"
        }
      ];
      localStorage.setItem(this.KEYS.USERS, JSON.stringify(demoUsers));
    }
    if (!localStorage.getItem(this.KEYS.ORDERS)) {
      localStorage.setItem(this.KEYS.ORDERS, JSON.stringify([]));
    }
  },

  // Products
  getProducts() {
    try {
      const data = localStorage.getItem(this.KEYS.PRODUCTS);
      return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
    } catch (e) {
      return DEFAULT_PRODUCTS;
    }
  },

  getProductById(id) {
    const list = this.getProducts();
    return list.find(p => p.id === id) || null;
  },

  saveProducts(products) {
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent("shopnova-products-updated", { detail: { products } }));
  },

  // Cart
  getCart() {
    try {
      const data = localStorage.getItem(this.KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.KEYS.CART, JSON.stringify(cart));
    ShopNovaApp.updateCounters();
  },

  addToCart(productId, quantity = 1, options = {}) {
    const product = this.getProductById(productId);
    if (!product) {
      ShopNovaToast.show("Product not found!", "error");
      return false;
    }

    if (product.stock <= 0) {
      ShopNovaToast.show("Sorry, this product is currently out of stock.", "warning");
      return false;
    }

    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId &&
      item.color === (options.color || (product.colors && product.colors[0])) &&
      item.size === (options.size || (product.sizes && product.sizes[0])));

    const chosenColor = options.color || (product.colors && product.colors.length ? product.colors[0] : null);
    const chosenSize = options.size || (product.sizes && product.sizes.length ? product.sizes[0] : null);

    if (existingIndex > -1) {
      const newQty = cart[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        cart[existingIndex].quantity = product.stock;
        this.saveCart(cart);
        ShopNovaToast.show(`Max available stock reached (${product.stock} units)`, "warning");
        return false;
      }
      cart[existingIndex].quantity = newQty;
    } else {
      const addQty = Math.min(quantity, product.stock);
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock,
        color: chosenColor,
        size: chosenSize,
        quantity: addQty
      });
    }

    this.saveCart(cart);
    ShopNovaToast.show(`"${product.name}" added to cart!`, "success");
    return true;
  },

  removeFromCart(index) {
    const cart = this.getCart();
    if (index >= 0 && index < cart.length) {
      const removed = cart.splice(index, 1);
      this.saveCart(cart);
      ShopNovaToast.show(`Removed "${removed[0].name}" from cart.`, "info");
    }
  },

  updateCartQty(index, qty) {
    const cart = this.getCart();
    if (index >= 0 && index < cart.length) {
      const item = cart[index];
      const product = this.getProductById(item.id);
      const maxStock = product ? product.stock : 99;

      if (qty <= 0) {
        this.removeFromCart(index);
        return;
      }
      if (qty > maxStock) {
        item.quantity = maxStock;
        ShopNovaToast.show(`Stock limit reached (${maxStock} units)`, "warning");
      } else {
        item.quantity = qty;
      }
      this.saveCart(cart);
    }
  },

  clearCart() {
    this.saveCart([]);
  },

  // Wishlist
  getWishlist() {
    try {
      const data = localStorage.getItem(this.KEYS.WISHLIST);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveWishlist(list) {
    localStorage.setItem(this.KEYS.WISHLIST, JSON.stringify(list));
    ShopNovaApp.updateCounters();
  },

  isInWishlist(productId) {
    const list = this.getWishlist();
    return list.some(item => item.id === productId || item === productId);
  },

  toggleWishlist(productId) {
    const list = this.getWishlist();
    const index = list.findIndex(item => (item.id === productId || item === productId));
    const product = this.getProductById(productId);

    if (index > -1) {
      list.splice(index, 1);
      this.saveWishlist(list);
      ShopNovaToast.show(`Removed from wishlist.`, "info");
      return false;
    } else {
      if (product) {
        list.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
          stock: product.stock
        });
      } else {
        list.push(productId);
      }
      this.saveWishlist(list);
      ShopNovaToast.show(`Added to wishlist! ❤️`, "success");
      return true;
    }
  },

  // Auth & Session
  getCurrentUser() {
    try {
      const data = localStorage.getItem(this.KEYS.CURRENT_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.KEYS.CURRENT_USER);
    }
    ShopNovaApp.renderUserNav();
  },

  getUsers() {
    try {
      const data = localStorage.getItem(this.KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveUsers(users) {
    localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));
  },

  // Orders
  getOrders() {
    try {
      const data = localStorage.getItem(this.KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent("shopnova-orders-updated", { detail: { orders } }));
    if (window.RJFirebase && window.RJFirebase.isConfigured()) {
      window.RJFirebase.saveOrder(order).catch(err => {
        console.warn("🔥 [Firestore] Notice: Order saved locally, cloud sync pending:", err.message);
      });
    }
  },

  updateOrderStatus(orderId, status) {
    const orders = this.getOrders();
    const target = orders.find(o => o.id === orderId);
    if (target) {
      target.status = status;
      localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent("shopnova-orders-updated", { detail: { orders } }));
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        window.RJFirebase.updateOrderStatus(orderId, status).catch(err => {
          console.warn("🔥 [Firestore] Order status cloud sync notice:", err.message);
        });
      }
      return true;
    }
    return false;
  },

  // Coupons
  getCoupons() {
    try {
      const data = localStorage.getItem(this.KEYS.COUPONS);
      return data ? JSON.parse(data) : DEFAULT_COUPONS;
    } catch (e) {
      return DEFAULT_COUPONS;
    }
  },

  getAppliedCoupon() {
    try {
      const data = localStorage.getItem(this.KEYS.APPLIED_COUPON);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  applyCoupon(code) {
    const coupons = this.getCoupons();
    const upper = (code || "").trim().toUpperCase();
    if (coupons[upper]) {
      const couponObj = { code: upper, ...coupons[upper] };
      localStorage.setItem(this.KEYS.APPLIED_COUPON, JSON.stringify(couponObj));
      return { success: true, coupon: couponObj };
    }
    return { success: false, message: "Invalid coupon code." };
  },

  removeAppliedCoupon() {
    localStorage.removeItem(this.KEYS.APPLIED_COUPON);
  }
};

// ==========================================================================
// 3. Toast Notifications
// ==========================================================================
const ShopNovaToast = {
  getContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  },

  show(message, type = "info", duration = 3500) {
    const container = this.getContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-circle-info";
    if (type === "success") iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-exclamation";
    if (type === "warning") iconClass = "fa-triangle-exclamation";

    toast.innerHTML = `
      <div class="toast-icon"><i class="fa-solid ${iconClass}"></i></div>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close Notification"><i class="fa-solid fa-xmark"></i></button>
    `;

    toast.querySelector(".toast-close").addEventListener("click", () => {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(100%)";
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ==========================================================================
// 4. Main Application Engine
// ==========================================================================
const ShopNovaApp = {
  init() {
    ShopNovaStorage.init();
    this.updateCounters();
    this.renderUserNav();
    this.toggleAdminBadge(); // Show Admin Portal link only for admin users
    this.setupMobileNav();
    this.setupLiveSearch();
    this.setupDealCountdown();
    this.setupNewsletterForm();
    this.setupQuickViewModal();
    this.highlightActiveNavLink();
  },

  // Show/hide Admin Portal badge in the nav bar based on user role
  toggleAdminBadge() {
    const user = ShopNovaStorage.getCurrentUser();
    const isAdmin = user && user.role === "admin";
    // All .admin-badge-link elements in nav (desktop + mobile)
    document.querySelectorAll(".admin-badge-link").forEach(el => {
      el.style.display = isAdmin ? "inline-flex" : "none";
    });
  },

  formatCurrency(num) {
    return "$" + Number(num || 0).toFixed(2);
  },

  updateCounters() {
    const cart = ShopNovaStorage.getCart();
    const cartTotalQty = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartBadges = document.querySelectorAll(".cart-badge");
    cartBadges.forEach(b => {
      b.textContent = cartTotalQty;
      b.style.display = cartTotalQty > 0 ? "flex" : "none";
    });

    const wishlist = ShopNovaStorage.getWishlist();
    const wishlistBadges = document.querySelectorAll(".wishlist-badge");
    wishlistBadges.forEach(b => {
      b.textContent = wishlist.length;
      b.style.display = wishlist.length > 0 ? "flex" : "none";
    });
  },

  renderUserNav() {
    const userWrap = document.getElementById("userMenuWrap");
    if (!userWrap) return;

    const user = ShopNovaStorage.getCurrentUser();
    const isAdmin = user && user.role === "admin";
    if (user) {
      // Admin Dashboard link only shown when user is admin
      const adminMenuLink = isAdmin
        ? `<a href="admin-login.html"><i class="fa-solid fa-shield-halved" style="color:#6366f1;"></i> Admin Dashboard</a>`
        : "";

      userWrap.innerHTML = `
        <button class="header-action-btn" id="userMenuBtn" aria-label="Account Menu">
          <div class="header-icon-wrap"><i class="fa-regular fa-user"></i></div>
          <div class="header-action-text">
            <span class="header-action-sub">Welcome,</span>
            <span class="header-action-label">${user.name.split(" ")[0]} <i class="fa-solid fa-angle-down" style="font-size:0.75rem;"></i></span>
          </div>
        </button>
        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">${user.name}</div>
            <div class="user-dropdown-email">${user.email}</div>
          </div>
          <a href="account.html"><i class="fa-regular fa-id-card"></i> My Profile</a>
          <a href="orders.html"><i class="fa-solid fa-box-open"></i> Order History</a>
          <a href="wishlist.html"><i class="fa-regular fa-heart"></i> My Wishlist</a>
          ${adminMenuLink}
          <button type="button" class="logout-btn" id="navLogoutBtn"><i class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</button>
        </div>
      `;

      const menuBtn = document.getElementById("userMenuBtn");
      const dropdown = document.getElementById("userDropdown");
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });

      document.addEventListener("click", () => {
        dropdown.classList.remove("active");
      });

      const logoutBtn = document.getElementById("navLogoutBtn");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
          ShopNovaStorage.setCurrentUser(null);
          ShopNovaToast.show("Logged out successfully.", "info");
          setTimeout(() => {
            window.location.href = "login.html";
          }, 600);
        });
      }
    } else {
      userWrap.innerHTML = `
        <a href="login.html" class="header-action-btn" aria-label="Sign In">
          <div class="header-icon-wrap"><i class="fa-regular fa-user"></i></div>
          <div class="header-action-text">
            <span class="header-action-sub">Account</span>
            <span class="header-action-label">Sign In</span>
          </div>
        </a>
      `;
    }
  },

  setupMobileNav() {
    const toggleBtn = document.getElementById("mobileNavToggle");
    const drawer = document.getElementById("mobileDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    const closeBtn = document.getElementById("closeDrawerBtn");

    if (!toggleBtn || !drawer || !backdrop) return;

    const openDrawer = () => {
      drawer.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    const closeDrawer = () => {
      drawer.classList.remove("open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    };

    toggleBtn.addEventListener("click", openDrawer);
    backdrop.addEventListener("click", closeDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  },

  setupLiveSearch() {
    const searchInputs = document.querySelectorAll(".search-input");
    const searchForms = document.querySelectorAll(".search-form");

    searchInputs.forEach(input => {
      const container = input.closest(".search-container");
      if (!container) return;

      let dropdown = container.querySelector(".search-results-dropdown");
      if (!dropdown) {
        dropdown = document.createElement("div");
        dropdown.className = "search-results-dropdown";
        container.appendChild(dropdown);
      }

      input.addEventListener("input", (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
          dropdown.classList.remove("active");
          dropdown.innerHTML = "";
          return;
        }

        const products = ShopNovaStorage.getProducts();
        const matches = products.filter(p =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          (p.shortDesc && p.shortDesc.toLowerCase().includes(query))
        ).slice(0, 5);

        if (matches.length === 0) {
          dropdown.innerHTML = `
            <div style="padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.9rem;">
              No products found matching "<strong>${query}</strong>"
            </div>
          `;
        } else {
          dropdown.innerHTML = matches.map(p => `
            <a href="product-details.html?id=${p.id}" class="search-item">
              <img src="${p.image}" alt="${p.name}" class="search-item-img">
              <div class="search-item-info">
                <div class="search-item-title">${p.name}</div>
                <div class="search-item-category">${p.category}</div>
              </div>
              <div class="search-item-price">${ShopNovaApp.formatCurrency(p.price)}</div>
            </a>
          `).join("") + `
            <div style="padding: 0.75rem 1rem; background: var(--bg-alt); text-align: center;">
              <a href="products.html?search=${encodeURIComponent(query)}" style="font-size: 0.85rem; font-weight: 700; color: var(--primary);">
                View all results for "${query}" <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          `;
        }
        dropdown.classList.add("active");
      });

      // Close dropdown when clicking outside
      document.addEventListener("click", (e) => {
        if (!container.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    });

    searchForms.forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector(".search-input");
        const q = input ? input.value.trim() : "";
        if (q) {
          window.location.href = `products.html?search=${encodeURIComponent(q)}`;
        }
      });
    });
  },

  setupDealCountdown() {
    const countdownEl = document.getElementById("dealCountdown");
    if (!countdownEl) return;

    // Set countdown target to 5 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 5);

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) return;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      const daysEl = document.getElementById("countDays");
      const hoursEl = document.getElementById("countHours");
      const minsEl = document.getElementById("countMinutes");
      const secsEl = document.getElementById("countSeconds");

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(minutes).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(seconds).padStart(2, "0");
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  },

  setupNewsletterForm() {
    const newsletterForms = document.querySelectorAll(".newsletter-form");
    newsletterForms.forEach(form => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = form.querySelector(".newsletter-input");
        const email = input ? input.value.trim() : "";

        if (!email || !email.includes("@")) {
          ShopNovaToast.show("Please enter a valid email address.", "error");
          return;
        }

        ShopNovaToast.show("🎉 Thank you for subscribing! Check your email for your 15% discount code.", "success");
        form.reset();
      });
    });
  },

  setupQuickViewModal() {
    let modal = document.getElementById("quickViewModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "quickViewModal";
      modal.className = "modal-backdrop";
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 850px;">
          <button class="modal-close-btn" id="closeQuickView"><i class="fa-solid fa-xmark"></i></button>
          <div id="quickViewBody"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#closeQuickView").addEventListener("click", () => {
        modal.classList.remove("active");
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("active");
      });
    }

    // Attach global click delegate for [data-quick-view]
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quick-view]");
      if (btn) {
        e.preventDefault();
        const productId = btn.getAttribute("data-quick-view");
        this.openQuickView(productId);
      }
    });
  },

  openQuickView(productId) {
    const product = ShopNovaStorage.getProductById(productId);
    if (!product) return;

    const modal = document.getElementById("quickViewModal");
    const body = document.getElementById("quickViewBody");
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="quickview-container">
        <div>
          <div class="gallery-main-wrap" style="aspect-ratio: 1/1;">
            <img src="${product.image}" alt="${product.name}" class="gallery-main-img" id="qvMainImg">
          </div>
        </div>
        <div class="detail-info">
          <div class="detail-sku-row">
            <span class="badge badge-primary">${product.category}</span>
            <span class="product-stock-status ${product.stock < 5 ? 'low' : ''}">
              <i class="fa-solid fa-circle-check"></i> ${product.stock} in stock
            </span>
          </div>
          <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">${product.name}</h2>
          <div class="product-rating" style="margin-bottom: 1rem;">
            <div class="stars">
              ${'<i class="fa-solid fa-star"></i>'.repeat(Math.floor(product.rating))}
            </div>
            <span class="rating-count">(${product.rating} / 5.0 · ${product.reviewCount || 20} reviews)</span>
          </div>
          <div class="detail-price-box" style="margin-bottom: 1rem;">
            <span class="detail-current-price">${ShopNovaApp.formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span class="detail-original-price">${ShopNovaApp.formatCurrency(product.originalPrice)}</span>` : ''}
            ${product.discount ? `<span class="badge badge-danger">-${product.discount}%</span>` : ''}
          </div>
          <p class="detail-desc-short" style="margin-bottom: 1.5rem;">${product.shortDesc || product.description}</p>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
            <div class="quantity-stepper">
              <button class="qty-btn" id="qvMinus"><i class="fa-solid fa-minus"></i></button>
              <input type="text" class="qty-input" id="qvQty" value="1" readonly>
              <button class="qty-btn" id="qvPlus"><i class="fa-solid fa-plus"></i></button>
            </div>
            <button class="btn btn-primary" id="qvAddToCartBtn" style="flex:1;">
              <i class="fa-solid fa-cart-shopping"></i> Add to Cart
            </button>
          </div>
          <div style="display: flex; gap: 1rem;">
            <a href="product-details.html?id=${product.id}" class="btn btn-outline" style="flex: 1;">
              View Full Product Page <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    `;

    const qtyInput = body.querySelector("#qvQty");
    body.querySelector("#qvMinus").addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    body.querySelector("#qvPlus").addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < product.stock) qtyInput.value = val + 1;
    });

    body.querySelector("#qvAddToCartBtn").addEventListener("click", () => {
      const qty = parseInt(qtyInput.value) || 1;
      ShopNovaStorage.addToCart(product.id, qty);
      modal.classList.remove("active");
    });

    modal.classList.add("active");
  },

  highlightActiveNavLink() {
    const currentPath = window.location.pathname.split("/").pop() || "index.html";
    const links = document.querySelectorAll(".nav-link, .mobile-nav-link");
    links.forEach(link => {
      const href = link.getAttribute("href");
      if (href === currentPath || (currentPath === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }
};

// Global aliases for RJ Fashion branding
const RJFashionStorage = ShopNovaStorage;
const RJFashionApp = ShopNovaApp;
const RJFashionToast = ShopNovaToast;
window.RJFashionStorage = ShopNovaStorage;
window.RJFashionApp = ShopNovaApp;
window.RJFashionToast = ShopNovaToast;

// Initialize when DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  ShopNovaApp.init();
});


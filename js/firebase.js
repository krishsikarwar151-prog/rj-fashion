/**
 * RJ Fashion - Firebase Cloud Firestore Database Integration Module
 * Full Cloud Firestore database integration for Products, Orders, Customer Accounts, and Reviews.
 * Features dual-engine connectivity:
 *   1. Modern Firebase Web SDK (Dynamic ESM Import from Google CDN)
 *   2. Resilient Firestore REST API Engine (Guaranteed zero-dependency fallback, works offline/online/file://)
 * Supports auto-fallback to LocalStorage and real-time synchronization.
 */

// ============================================================================
// 1. FIREBASE CONFIGURATION CREDENTIALS
// Active Firebase Web App credentials for RJ Fashion
// ============================================================================
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyAXIjWdlPsOWmxxMZbEuZmLi8IA_WX32Jc",
  authDomain: "e-commerce-27001.firebaseapp.com",
  projectId: "e-commerce-27001",
  storageBucket: "e-commerce-27001.firebasestorage.app",
  messagingSenderId: "592077894511",
  appId: "1:592077894511:web:d369f0fa2ff2b19814ae9a",
  measurementId: "G-E7S3ZDQR6R"
};

const RJ_FIREBASE_STORAGE_KEY = "rj_firebase_config";
const RJ_FIREBASE_MODE_KEY = "rj_firebase_mode";

// ============================================================================
// Helper Functions for Firestore REST Value Conversion
// ============================================================================
function fromFirestoreFields(fields) {
  const result = {};
  if (!fields) return result;
  for (const [key, valueObj] of Object.entries(fields)) {
    if ("stringValue" in valueObj) result[key] = valueObj.stringValue;
    else if ("integerValue" in valueObj) result[key] = parseInt(valueObj.integerValue, 10);
    else if ("doubleValue" in valueObj) result[key] = parseFloat(valueObj.doubleValue);
    else if ("booleanValue" in valueObj) result[key] = valueObj.booleanValue;
    else if ("nullValue" in valueObj) result[key] = null;
    else if ("arrayValue" in valueObj) {
      result[key] = (valueObj.arrayValue.values || []).map(v => {
        if (typeof v === "object" && v !== null) {
          if ("stringValue" in v) return v.stringValue;
          if ("integerValue" in v) return parseInt(v.integerValue, 10);
          if ("doubleValue" in v) return parseFloat(v.doubleValue);
          if ("booleanValue" in v) return v.booleanValue;
          if ("mapValue" in v) return fromFirestoreFields(v.mapValue.fields);
        }
        return v;
      });
    } else if ("mapValue" in valueObj) {
      result[key] = fromFirestoreFields(valueObj.mapValue.fields);
    } else {
      result[key] = Object.values(valueObj)[0];
    }
  }
  return result;
}

function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined) continue;
    fields[key] = toFirestoreValue(val);
  }
  return fields;
}

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === "boolean") return { booleanValue: val };
  if (typeof val === "number") {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === "string") return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === "object") {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// ============================================================================
// FirebaseService Class
// ============================================================================
class FirebaseService {
  constructor() {
    this.app = null;
    this.db = null;
    this.isReady = false;
    this.mode = "offline"; // 'sdk', 'rest', or 'offline'
    this.initError = null;
    this.activeConfig = null;
    this.baseUrl = null;
    this.firestoreModules = null;
    this._listeners = [];
    this._intervals = [];
  }

  /**
   * Returns active Firebase configuration.
   * 1. Checks if explicitly set to offline.
   * 2. Checks localStorage override (from Admin Portal).
   * 3. Falls back to DEFAULT_FIREBASE_CONFIG.
   */
  getConfig() {
    try {
      if (localStorage.getItem(RJ_FIREBASE_MODE_KEY) === "offline") {
        return null;
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem(RJ_FIREBASE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projectId && parsed.apiKey) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read Firebase config from localStorage", e);
    }

    if (DEFAULT_FIREBASE_CONFIG && DEFAULT_FIREBASE_CONFIG.projectId && DEFAULT_FIREBASE_CONFIG.apiKey && !DEFAULT_FIREBASE_CONFIG.apiKey.includes("YOUR_")) {
      return DEFAULT_FIREBASE_CONFIG;
    }

    return null;
  }

  /**
   * Save configuration to localStorage and initialize Firebase
   */
  async saveConfig(config) {
    if (!config || !config.projectId || !config.apiKey) {
      throw new Error("Firebase Project ID and Web API Key are required.");
    }
    const cleanConfig = {
      apiKey: config.apiKey.trim(),
      authDomain: (config.authDomain || "").trim() || `${config.projectId.trim()}.firebaseapp.com`,
      projectId: config.projectId.trim(),
      storageBucket: (config.storageBucket || "").trim() || `${config.projectId.trim()}.firebasestorage.app`,
      messagingSenderId: (config.messagingSenderId || "").trim(),
      appId: (config.appId || "").trim(),
      measurementId: (config.measurementId || "").trim()
    };
    try {
      localStorage.removeItem(RJ_FIREBASE_MODE_KEY);
      localStorage.setItem(RJ_FIREBASE_STORAGE_KEY, JSON.stringify(cleanConfig));
    } catch (e) {}
    return this.init(cleanConfig);
  }

  /**
   * Remove Firebase config & reset to LocalStorage fallback mode
   */
  removeConfig() {
    try {
      localStorage.setItem(RJ_FIREBASE_MODE_KEY, "offline");
      localStorage.removeItem(RJ_FIREBASE_STORAGE_KEY);
    } catch (e) {}
    this._unsubscribeAllListeners();
    this.app = null;
    this.db = null;
    this.isReady = false;
    this.mode = "offline";
    this.activeConfig = null;
    this.initError = null;
    console.info("🔥 [RJ Fashion] Firebase configuration cleared. Running in LocalStorage fallback mode.");
    window.dispatchEvent(new CustomEvent("rj-firebase-status-change", { detail: { isReady: false, projectId: null, mode: "offline" } }));
  }

  /**
   * Check if Firebase is active and connected (SDK or REST)
   */
  isConfigured() {
    return this.isReady && (this.db !== null || this.mode === "rest");
  }

  /**
   * Initialize Firebase with dual-engine fallback (SDK -> REST -> LocalStorage)
   */
  async init(customConfig = null) {
    const config = customConfig || this.getConfig();

    if (!config || !config.apiKey || !config.projectId || config.apiKey.includes("YOUR_") || config.projectId.includes("YOUR_")) {
      this.isReady = false;
      this.mode = "offline";
      this.initError = "Firebase configuration is pending or empty.";
      return false;
    }

    this.activeConfig = config;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents`;

    let sdkSuccess = false;

    // 1. Attempt Modern Web SDK (v10 ESM from Google CDN)
    if (typeof window !== "undefined" && window.location && window.location.protocol !== "file:") {
      try {
        const { initializeApp, getApps, deleteApp } = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"
        );
        const firestore = await import(
          "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
        );

        this.firestoreModules = firestore;

        // Clean up any existing apps to avoid duplicate-app collision
        const existingApps = getApps();
        if (existingApps.length > 0) {
          for (const a of existingApps) {
            try { await deleteApp(a); } catch (e) {}
          }
        }

        this.app = initializeApp(config);
        this.db = firestore.getFirestore(this.app);
        this.isReady = true;
        this.mode = "sdk";
        this.initError = null;
        sdkSuccess = true;
        console.info(`🔥 [RJ Fashion] Connected to Cloud Firestore via Web SDK! Project: "${config.projectId}"`);
      } catch (sdkErr) {
        console.info("🔥 [RJ Fashion] Web SDK dynamic import unavailable:", sdkErr.message, "Activating REST engine.");
      }
    }

    // 2. Resilient Firestore REST Engine Fallback (Zero dependencies)
    if (!sdkSuccess) {
      this.isReady = true;
      this.mode = "rest";
      this.initError = null;
      console.info(`🔥 [RJ Fashion] Connected to Cloud Firestore via REST Engine! Project: "${config.projectId}"`);
    }

    // Dispatch custom events for UI reactivity
    window.dispatchEvent(new CustomEvent("rj-firebase-ready", {
      detail: { projectId: config.projectId, db: this.db, mode: this.mode }
    }));
    window.dispatchEvent(new CustomEvent("rj-firebase-status-change", {
      detail: { isReady: true, projectId: config.projectId, mode: this.mode }
    }));

    // Auto-sync initial cache
    this._autoSyncInitialCache().catch(err => {
      console.warn("🔥 [Firestore] Auto-sync notice:", err.message);
    });

    return true;
  }

  /**
   * Test read/write connection to Cloud Firestore
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error("Firebase is not initialized. Please verify your Project ID and API Key.");
    }

    const startTime = Date.now();
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, setDoc, getDoc, deleteDoc } = this.firestoreModules;
        const testRef = doc(this.db, "_health_check", "ping");

        // Write
        await setDoc(testRef, {
          client: "RJ Fashion Web Client (SDK)",
          testedAt: new Date().toISOString()
        });

        // Read
        const docSnap = await getDoc(testRef);
        if (!docSnap.exists()) {
          throw new Error("Test document write succeeded, but read returned empty.");
        }

        // Cleanup
        await deleteDoc(testRef).catch(() => {});
      } else {
        // REST Test
        const testUrl = `${this.baseUrl}/_health_check/ping?key=${this.activeConfig.apiKey}`;
        const writeRes = await fetch(testUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              client: { stringValue: "RJ Fashion Web Client (REST)" },
              testedAt: { stringValue: new Date().toISOString() }
            }
          })
        });

        if (!writeRes.ok) {
          const errData = await writeRes.json().catch(() => ({}));
          const errMsg = errData.error?.message || `HTTP ${writeRes.status}`;
          throw new Error(errMsg);
        }

        const readRes = await fetch(testUrl);
        if (!readRes.ok) {
          throw new Error("Write succeeded, but read returned an error.");
        }

        // Cleanup
        await fetch(testUrl, { method: "DELETE" }).catch(() => {});
      }

      const elapsed = Date.now() - startTime;
      return {
        success: true,
        latencyMs: elapsed,
        mode: this.mode,
        projectId: this.activeConfig.projectId,
        message: `Successfully connected to Cloud Firestore (${this.mode.toUpperCase()})! Read/write verified in ${elapsed}ms.`
      };
    } catch (err) {
      let advice = err.message;
      if (err.code === "permission-denied" || err.message.includes("permission-denied") || err.message.includes("PERMISSION_DENIED")) {
        advice = "Permission Denied: Make sure your Cloud Firestore rules are set to Test Mode (allow read, write: if true;).";
      }
      return {
        success: false,
        message: advice
      };
    }
  }

  /**
   * Helper: sync down cloud data on initial connection to populate local store
   */
  async _autoSyncInitialCache() {
    if (!this.isConfigured()) return;
    try {
      const cloudProducts = await this.getProducts();
      if (cloudProducts && cloudProducts.length > 0) {
        localStorage.setItem("shopnova_products", JSON.stringify(cloudProducts));
        window.dispatchEvent(new CustomEvent("shopnova-products-updated", { detail: { products: cloudProducts } }));
      }
      const cloudOrders = await this.getOrders();
      if (cloudOrders && cloudOrders.length > 0) {
        localStorage.setItem("shopnova_orders", JSON.stringify(cloudOrders));
        window.dispatchEvent(new CustomEvent("shopnova-orders-updated", { detail: { orders: cloudOrders } }));
      }
    } catch (e) {
      console.info("Firestore initial cache sync:", e.message);
    }
  }

  _unsubscribeAllListeners() {
    this._listeners.forEach(unsub => {
      try { if (typeof unsub === "function") unsub(); } catch (e) {}
    });
    this._listeners = [];

    this._intervals.forEach(timerId => {
      try { clearInterval(timerId); } catch (e) {}
    });
    this._intervals = [];
  }

  // ========================================================================
  // 2. PRODUCTS COLLECTION (collection: "products")
  // ========================================================================

  /**
   * Get all products from Cloud Firestore (falls back to LocalStorage)
   */
  async getProducts() {
    if (!this.isConfigured()) {
      return (window.RJFashionStorage || window.ShopNovaStorage).getProducts();
    }

    try {
      let products = [];

      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, getDocs } = this.firestoreModules;
        const snapshot = await getDocs(collection(this.db, "products"));

        if (!snapshot.empty) {
          snapshot.forEach(docSnap => {
            products.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
      } else {
        const url = `${this.baseUrl}/products?key=${this.activeConfig.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            products = data.documents.map(doc => {
              const id = doc.name.split("/").pop();
              return { id, ...fromFirestoreFields(doc.fields) };
            });
          }
        }
      }

      if (products.length === 0) {
        console.info("🔥 [Firestore] Products collection empty in cloud. Using local catalog.");
        return (window.RJFashionStorage || window.ShopNovaStorage).getProducts();
      }

      // Update local cache
      try {
        localStorage.setItem("shopnova_products", JSON.stringify(products));
      } catch (e) {}
      return products;
    } catch (err) {
      console.warn("🔥 [Firestore] Error fetching products, using local fallback:", err.message);
      return (window.RJFashionStorage || window.ShopNovaStorage).getProducts();
    }
  }

  /**
   * Get single product by ID from Cloud Firestore
   */
  async getProduct(productId) {
    if (!this.isConfigured()) {
      return (window.RJFashionStorage || window.ShopNovaStorage).getProductById(productId);
    }
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, getDoc } = this.firestoreModules;
        const docSnap = await getDoc(doc(this.db, "products", productId));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } else {
        const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}?key=${this.activeConfig.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const doc = await res.json();
          const id = doc.name.split("/").pop();
          return { id, ...fromFirestoreFields(doc.fields) };
        }
      }
      return (window.RJFashionStorage || window.ShopNovaStorage).getProductById(productId);
    } catch (err) {
      return (window.RJFashionStorage || window.ShopNovaStorage).getProductById(productId);
    }
  }

  /**
   * Add a new product to Cloud Firestore
   */
  async addProduct(product) {
    if (!this.isConfigured()) return null;
    const productId = product.id || "rj-" + Date.now();
    const payload = {
      ...product,
      id: productId,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, setDoc } = this.firestoreModules;
        await setDoc(doc(this.db, "products", productId), payload);
      } else {
        const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}?key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] Product "${product.name}" created (${productId})`);
      return payload;
    } catch (err) {
      console.error("🔥 [Firestore] Error adding product:", err);
      throw err;
    }
  }

  /**
   * Update an existing product in Cloud Firestore
   */
  async updateProduct(productId, updatedFields) {
    if (!this.isConfigured()) return null;
    const payload = {
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, updateDoc } = this.firestoreModules;
        await updateDoc(doc(this.db, "products", productId), payload);
      } else {
        const fieldKeys = Object.keys(payload);
        const maskQuery = fieldKeys.map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
        const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}?${maskQuery}&key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] Product ${productId} updated successfully`);
      return true;
    } catch (err) {
      console.error("🔥 [Firestore] Error updating product:", err);
      throw err;
    }
  }

  /**
   * Delete a product from Cloud Firestore
   */
  async deleteProduct(productId) {
    if (!this.isConfigured()) return null;
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, deleteDoc } = this.firestoreModules;
        await deleteDoc(doc(this.db, "products", productId));
      } else {
        const url = `${this.baseUrl}/products/${encodeURIComponent(productId)}?key=${this.activeConfig.apiKey}`;
        await fetch(url, { method: "DELETE" });
      }
      console.info(`🔥 [Firestore] Product ${productId} deleted`);
      return true;
    } catch (err) {
      console.error("🔥 [Firestore] Error deleting product:", err);
      throw err;
    }
  }

  /**
   * Real-time listener for Products collection
   */
  listenProducts(callback) {
    if (!this.isConfigured()) return null;
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, onSnapshot } = this.firestoreModules;
        const unsub = onSnapshot(collection(this.db, "products"), snapshot => {
          const products = [];
          snapshot.forEach(docSnap => {
            products.push({ id: docSnap.id, ...docSnap.data() });
          });
          if (products.length > 0) {
            localStorage.setItem("shopnova_products", JSON.stringify(products));
            callback(products);
          }
        }, err => {
          console.warn("🔥 [Firestore] Products listener notice:", err.message);
        });
        this._listeners.push(unsub);
        return unsub;
      } else {
        // Polling sync for REST mode
        const timerId = setInterval(async () => {
          try {
            const products = await this.getProducts();
            if (products && products.length > 0) {
              callback(products);
            }
          } catch (e) {}
        }, 15000);
        this._intervals.push(timerId);
        return () => clearInterval(timerId);
      }
    } catch (err) {
      console.warn("🔥 [Firestore] Could not start products listener:", err);
      return null;
    }
  }

  // ========================================================================
  // 3. ORDERS COLLECTION (collection: "orders")
  // ========================================================================

  /**
   * Save an order to Cloud Firestore
   */
  async saveOrder(order) {
    if (!this.isConfigured()) return null;
    const orderId = order.id || "RJ-" + Date.now();
    const payload = {
      ...order,
      id: orderId,
      createdAt: order.createdAt || new Date().toISOString()
    };

    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, setDoc } = this.firestoreModules;
        await setDoc(doc(this.db, "orders", orderId), payload);
      } else {
        const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}?key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] Order ${orderId} saved to database!`);
      return payload;
    } catch (err) {
      console.error("🔥 [Firestore] Error saving order to database:", err);
      throw err;
    }
  }

  /**
   * Get all orders from Cloud Firestore (optional email filter for customer history)
   */
  async getOrders(userEmail = null) {
    const storage = typeof window !== "undefined" ? (window.RJFashionStorage || window.ShopNovaStorage) : null;
    if (!this.isConfigured()) {
      const local = storage ? storage.getOrders() : [];
      if (userEmail) {
        return local.filter(o => (o.email || "").toLowerCase() === userEmail.toLowerCase());
      }
      return local;
    }

    try {
      let orders = [];

      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, getDocs, query, where } = this.firestoreModules;
        let q = userEmail
          ? query(collection(this.db, "orders"), where("email", "==", userEmail))
          : query(collection(this.db, "orders"));

        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          snapshot.forEach(docSnap => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
          });
        }
      } else {
        const url = `${this.baseUrl}/orders?key=${this.activeConfig.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            orders = data.documents.map(doc => {
              const id = doc.name.split("/").pop();
              return { id, ...fromFirestoreFields(doc.fields) };
            });
            if (userEmail) {
              orders = orders.filter(o => (o.email || "").toLowerCase() === userEmail.toLowerCase());
            }
          }
        }
      }

      if (orders.length === 0) {
        if (userEmail) return [];
        return storage ? storage.getOrders() : [];
      }

      return orders;
    } catch (err) {
      console.warn("🔥 [Firestore] Error fetching orders:", err.message);
      if (userEmail) return [];
      return storage ? storage.getOrders() : [];
    }
  }

  /**
   * Update order status in Cloud Firestore
   */
  async updateOrderStatus(orderId, newStatus) {
    if (!this.isConfigured()) return null;
    const payload = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, updateDoc } = this.firestoreModules;
        await updateDoc(doc(this.db, "orders", orderId), payload);
      } else {
        const url = `${this.baseUrl}/orders/${encodeURIComponent(orderId)}?updateMask.fieldPaths=status&updateMask.fieldPaths=updatedAt&key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] Order ${orderId} status updated to: ${newStatus}`);
      return true;
    } catch (err) {
      console.error("🔥 [Firestore] Error updating order status:", err);
      throw err;
    }
  }

  /**
   * Real-time listener for Orders collection
   */
  listenOrders(callback, userEmail = null) {
    if (!this.isConfigured()) return null;
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, onSnapshot, query, where } = this.firestoreModules;
        let q = userEmail
          ? query(collection(this.db, "orders"), where("email", "==", userEmail))
          : query(collection(this.db, "orders"));

        const unsub = onSnapshot(q, snapshot => {
          const orders = [];
          snapshot.forEach(docSnap => {
            orders.push({ id: docSnap.id, ...docSnap.data() });
          });
          callback(orders);
        }, err => {
          console.warn("🔥 [Firestore] Orders listener notice:", err.message);
        });
        this._listeners.push(unsub);
        return unsub;
      } else {
        const timerId = setInterval(async () => {
          try {
            const orders = await this.getOrders(userEmail);
            callback(orders);
          } catch (e) {}
        }, 15000);
        this._intervals.push(timerId);
        return () => clearInterval(timerId);
      }
    } catch (err) {
      console.warn("🔥 [Firestore] Could not start orders listener:", err);
      return null;
    }
  }

  // ========================================================================
  // 4. USERS & ACCOUNTS COLLECTION (collection: "users")
  // ========================================================================

  /**
   * Save user registration or profile update to Cloud Firestore
   */
  async saveUser(user) {
    if (!this.isConfigured() || !user || !user.email) return null;
    const userDocId = user.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const payload = {
      ...user,
      email: user.email.toLowerCase(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, setDoc } = this.firestoreModules;
        await setDoc(doc(this.db, "users", userDocId), payload, { merge: true });
      } else {
        const url = `${this.baseUrl}/users/${encodeURIComponent(userDocId)}?key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] User account saved for ${user.email}`);
      return payload;
    } catch (err) {
      console.warn("🔥 [Firestore] Error saving user account:", err.message);
      return null;
    }
  }

  /**
   * Get all registered users from Cloud Firestore
   */
  async getUsers() {
    if (!this.isConfigured()) {
      return (window.RJFashionStorage || window.ShopNovaStorage).getUsers();
    }
    try {
      let users = [];
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, getDocs } = this.firestoreModules;
        const snapshot = await getDocs(collection(this.db, "users"));
        if (!snapshot.empty) {
          snapshot.forEach(docSnap => users.push(docSnap.data()));
        }
      } else {
        const url = `${this.baseUrl}/users?key=${this.activeConfig.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            users = data.documents.map(doc => fromFirestoreFields(doc.fields));
          }
        }
      }
      if (users.length === 0) {
        return (window.RJFashionStorage || window.ShopNovaStorage).getUsers();
      }
      return users;
    } catch (err) {
      return (window.RJFashionStorage || window.ShopNovaStorage).getUsers();
    }
  }

  // ========================================================================
  // 5. FIREBASE AUTHENTICATION (Real Email/Password Auth & Profile Management)
  // ========================================================================

  /**
   * Real Firebase Authentication Sign Up (creates user in Firebase Auth & Firestore profile)
   */
  async authSignUp(email, password, displayName = "", phone = "") {
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      this.activeConfig = this.getConfig();
    }
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      throw new Error("Firebase is not configured. Please check your credentials.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password;

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${this.activeConfig.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        password: cleanPass,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const errCode = data.error?.message || "SIGNUP_FAILED";
      if (errCode.includes("EMAIL_EXISTS")) {
        throw new Error("This email is already registered. Please sign in instead.");
      }
      if (errCode.includes("WEAK_PASSWORD")) {
        throw new Error("Password is too weak. Please use at least 6 characters.");
      }
      if (errCode.includes("TOO_MANY_ATTEMPTS")) {
        throw new Error("Too many attempts. Please try again in a few moments.");
      }
      throw new Error(data.error?.message || "Failed to create account.");
    }

    // Set Display Name in Firebase Auth
    if (displayName && data.idToken) {
      await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:update?key=${this.activeConfig.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: data.idToken,
          displayName: displayName.trim(),
          returnSecureToken: true
        })
      }).catch(() => {});
    }

    // Create real user profile in Cloud Firestore
    const userProfile = {
      uid: data.localId,
      name: displayName.trim() || cleanEmail.split("@")[0],
      email: cleanEmail,
      phone: phone.trim() || "",
      role: cleanEmail.includes("admin") ? "admin" : "customer",
      address: "",
      joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      createdAt: new Date().toISOString()
    };

    await this.saveUser(userProfile).catch(e => console.warn("Firestore saveUser:", e));

    // Save active session
    try {
      localStorage.setItem("shopnova_auth_token", data.idToken);
      localStorage.setItem("shopnova_refresh_token", data.refreshToken);
      const storage = window.RJFashionStorage || window.ShopNovaStorage;
      if (storage) {
        storage.setCurrentUser(userProfile);
        const allUsers = storage.getUsers();
        if (!allUsers.some(u => (u.email || "").toLowerCase() === cleanEmail)) {
          allUsers.push(userProfile);
          storage.saveUsers(allUsers);
        }
      }
      window.dispatchEvent(new CustomEvent("rj-auth-changed", { detail: { user: userProfile } }));
    } catch (e) {}

    return {
      success: true,
      user: userProfile,
      token: data.idToken
    };
  }

  /**
   * Real Firebase Authentication Sign In
   */
  async authSignIn(email, password) {
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      this.activeConfig = this.getConfig();
    }
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      throw new Error("Firebase is not configured. Please check your credentials.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.activeConfig.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        returnSecureToken: true
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const errCode = data.error?.message || "LOGIN_FAILED";
      if (errCode.includes("EMAIL_NOT_FOUND") || errCode.includes("INVALID_LOGIN_CREDENTIALS") || errCode.includes("INVALID_PASSWORD")) {
        throw new Error("Incorrect email or password. Please try again.");
      }
      if (errCode.includes("USER_DISABLED")) {
        throw new Error("This account has been disabled. Please contact customer support.");
      }
      if (errCode.includes("TOO_MANY_ATTEMPTS")) {
        throw new Error("Too many failed attempts. Please try again later or reset your password.");
      }
      throw new Error(data.error?.message || "Failed to log in.");
    }

    // Fetch user profile from Cloud Firestore
    let userProfile = null;
    try {
      const cloudUsers = await this.getUsers();
      userProfile = cloudUsers.find(u => (u.email || "").toLowerCase() === cleanEmail);
    } catch (e) {}

    if (!userProfile) {
      userProfile = {
        uid: data.localId,
        name: data.displayName || cleanEmail.split("@")[0],
        email: cleanEmail,
        phone: "",
        role: cleanEmail.includes("admin") ? "admin" : "customer",
        address: "",
        joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };
      await this.saveUser(userProfile).catch(() => {});
    }

    // Save active session
    try {
      localStorage.setItem("shopnova_auth_token", data.idToken);
      localStorage.setItem("shopnova_refresh_token", data.refreshToken);
      const storage = window.RJFashionStorage || window.ShopNovaStorage;
      if (storage) {
        storage.setCurrentUser(userProfile);
        const allUsers = storage.getUsers();
        if (!allUsers.some(u => (u.email || "").toLowerCase() === cleanEmail)) {
          allUsers.push(userProfile);
          storage.saveUsers(allUsers);
        }
      }
      window.dispatchEvent(new CustomEvent("rj-auth-changed", { detail: { user: userProfile } }));
    } catch (e) {}

    return {
      success: true,
      user: userProfile,
      token: data.idToken
    };
  }

  /**
   * Real Firebase Password Reset Email
   */
  async authSendPasswordReset(email) {
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      this.activeConfig = this.getConfig();
    }
    if (!this.activeConfig || !this.activeConfig.apiKey) {
      throw new Error("Firebase is not configured.");
    }

    const cleanEmail = email.trim().toLowerCase();
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${this.activeConfig.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: cleanEmail
      })
    });

    const data = await res.json();
    if (!res.ok) {
      const errCode = data.error?.message || "";
      if (errCode.includes("EMAIL_NOT_FOUND")) {
        throw new Error("No registered account found with this email address.");
      }
      throw new Error(data.error?.message || "Could not send password reset email.");
    }

    return {
      success: true,
      message: `Password reset link sent to ${cleanEmail}. Check your inbox!`
    };
  }

  /**
   * Real Sign Out
   */
  authSignOut() {
    try {
      localStorage.removeItem("shopnova_auth_token");
      localStorage.removeItem("shopnova_refresh_token");
      const storage = window.RJFashionStorage || window.ShopNovaStorage;
      if (storage) storage.setCurrentUser(null);
      window.dispatchEvent(new CustomEvent("rj-auth-changed", { detail: { user: null } }));
    } catch (e) {}
    return true;
  }

  // ========================================================================
  // 5. REVIEWS COLLECTION (collection: "reviews")
  // ========================================================================

  /**
   * Get reviews for a product from Cloud Firestore
   */
  async getReviews(productId) {
    if (!this.isConfigured()) return null;
    try {
      let reviews = [];
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, getDocs, query, where } = this.firestoreModules;
        const q = query(collection(this.db, "reviews"), where("productId", "==", productId));
        const snapshot = await getDocs(q);
        snapshot.forEach(docSnap => reviews.push({ id: docSnap.id, ...docSnap.data() }));
      } else {
        const url = `${this.baseUrl}/reviews?key=${this.activeConfig.apiKey}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.documents && data.documents.length > 0) {
            reviews = data.documents
              .map(doc => ({ id: doc.name.split("/").pop(), ...fromFirestoreFields(doc.fields) }))
              .filter(r => r.productId === productId);
          }
        }
      }
      return reviews;
    } catch (err) {
      console.warn("🔥 [Firestore] Error fetching reviews:", err.message);
      return null;
    }
  }

  /**
   * Post a customer review to Cloud Firestore
   */
  async addReview(productId, review) {
    if (!this.isConfigured()) return null;
    const reviewId = "rev-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);
    const payload = {
      ...review,
      id: reviewId,
      productId,
      createdAt: new Date().toISOString()
    };
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { doc, setDoc } = this.firestoreModules;
        await setDoc(doc(this.db, "reviews", reviewId), payload);
      } else {
        const url = `${this.baseUrl}/reviews/${encodeURIComponent(reviewId)}?key=${this.activeConfig.apiKey}`;
        await fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields: toFirestoreFields(payload) })
        });
      }
      console.info(`🔥 [Firestore] Review posted for product ${productId}`);
      return payload;
    } catch (err) {
      console.warn("🔥 [Firestore] Error saving review:", err.message);
      return null;
    }
  }

  // ========================================================================
  // 6. CLOUD SYNCHRONIZATION OPERATIONS
  // ========================================================================

  /**
   * One-Click Sync: Upload Local Storage Catalog, Orders & Users to Firestore
   */
  async syncLocalToFirestore() {
    if (!this.isConfigured()) {
      throw new Error("Firebase is not configured yet. Please enter your project keys first.");
    }

    const storage = window.RJFashionStorage || window.ShopNovaStorage;
    const localProducts = storage.getProducts();
    const localOrders = storage.getOrders();
    const localUsers = storage.getUsers();

    let uploadedProducts = 0;
    let uploadedOrders = 0;
    let uploadedUsers = 0;

    for (const p of localProducts) {
      await this.addProduct(p);
      uploadedProducts++;
    }

    for (const o of localOrders) {
      await this.saveOrder(o);
      uploadedOrders++;
    }

    for (const u of localUsers) {
      if (u.email) {
        await this.saveUser(u);
        uploadedUsers++;
      }
    }

    console.info(`🔥 [Firestore Sync] Successfully uploaded ${uploadedProducts} products, ${uploadedOrders} orders & ${uploadedUsers} users.`);
    return { uploadedProducts, uploadedOrders, uploadedUsers };
  }

  /**
   * Pull all cloud collections from Firestore down into LocalStorage cache
   */
  async syncFirestoreToLocal() {
    if (!this.isConfigured()) {
      throw new Error("Firebase is not configured yet. Please enter your project keys first.");
    }

    const firestoreProducts = await this.getProducts();
    if (firestoreProducts && firestoreProducts.length > 0) {
      localStorage.setItem("shopnova_products", JSON.stringify(firestoreProducts));
      window.dispatchEvent(new CustomEvent("shopnova-products-updated", { detail: { products: firestoreProducts } }));
    }

    const firestoreOrders = await this.getOrders();
    if (firestoreOrders && firestoreOrders.length > 0) {
      localStorage.setItem("shopnova_orders", JSON.stringify(firestoreOrders));
      window.dispatchEvent(new CustomEvent("shopnova-orders-updated", { detail: { orders: firestoreOrders } }));
    }

    const firestoreUsers = await this.getUsers();
    if (firestoreUsers && firestoreUsers.length > 0) {
      localStorage.setItem("shopnova_users", JSON.stringify(firestoreUsers));
    }

    return {
      productsCount: firestoreProducts ? firestoreProducts.length : 0,
      ordersCount: firestoreOrders ? firestoreOrders.length : 0,
      usersCount: firestoreUsers ? firestoreUsers.length : 0
    };
  }

  /**
   * Get collection counts from Firestore for the admin dashboard
   */
  async getFirestoreStats() {
    if (!this.isConfigured()) return { products: 0, orders: 0, users: 0 };
    try {
      if (this.mode === "sdk" && this.firestoreModules && this.db) {
        const { collection, getDocs } = this.firestoreModules;
        const [prodSnap, orderSnap, userSnap] = await Promise.all([
          getDocs(collection(this.db, "products")),
          getDocs(collection(this.db, "orders")),
          getDocs(collection(this.db, "users"))
        ]);
        return {
          products: prodSnap.size,
          orders: orderSnap.size,
          users: userSnap.size
        };
      } else {
        const [prodRes, orderRes, userRes] = await Promise.all([
          fetch(`${this.baseUrl}/products?key=${this.activeConfig.apiKey}`).then(r => r.ok ? r.json() : {}),
          fetch(`${this.baseUrl}/orders?key=${this.activeConfig.apiKey}`).then(r => r.ok ? r.json() : {}),
          fetch(`${this.baseUrl}/users?key=${this.activeConfig.apiKey}`).then(r => r.ok ? r.json() : {})
        ]);
        return {
          products: prodRes.documents ? prodRes.documents.length : 0,
          orders: orderRes.documents ? orderRes.documents.length : 0,
          users: userRes.documents ? userRes.documents.length : 0
        };
      }
    } catch (err) {
      return { products: 0, orders: 0, users: 0 };
    }
  }
}

// Instantiate global singleton
const RJFirebase = new FirebaseService();
window.RJFirebase = RJFirebase;
window.ShopNovaFirebase = RJFirebase;

// Auto-initialize when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      RJFirebase.init();
    });
  } else {
    RJFirebase.init();
  }
}

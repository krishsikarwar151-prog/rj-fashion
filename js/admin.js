/**
 * RJ Fashion - Admin Dashboard Module
 * Handles inventory CRUD operations (Add, Edit, Delete),
 * Order management & real-time status updates,
 * Store performance KPIs, product filtering, and data reset tools.
 *
 * ADMIN GUARD: Access is restricted to authenticated admin users only.
 * Non-admin visitors are redirected to admin-login.html.
 */

// ============================================================================
// ADMIN AUTHENTICATION GUARD
// Runs immediately (before DOMContentLoaded) to prevent unauthorized access
// ============================================================================
(function adminGuard() {
  try {
    const storage = window.RJFashionStorage || window.ShopNovaStorage;
    if (!storage) return; // storage not ready yet, will re-check on DOMContentLoaded

    const user = storage.getCurrentUser();
    if (!user || user.role !== "admin") {
      window.location.replace("admin-login.html");
    }
  } catch (e) {
    // If storage is unavailable, redirect to be safe
    window.location.replace("admin-login.html");
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Double-check auth on DOM ready (in case storage was not ready above)
  const _storage = window.RJFashionStorage || window.ShopNovaStorage;
  if (_storage) {
    const _user = _storage.getCurrentUser();
    if (!_user || _user.role !== "admin") {
      window.location.replace("admin-login.html");
      return;
    }
  }

  initAdminDashboard();
});

function initAdminDashboard() {
  const adminWrapper = document.getElementById("adminDashboardWrap");
  if (!adminWrapper) return;

  // Tab switching (Overview, Products, Orders, Data Tools)
  const navTabs = document.querySelectorAll(".admin-tab-btn");
  const tabPanels = document.querySelectorAll(".admin-panel");

  navTabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-panel");
      navTabs.forEach(b => b.classList.remove("active"));
      tabPanels.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Render metrics and tables
  renderMetrics();
  renderProductsTable();
  renderOrdersTable();

  // Search Products Table
  const searchInput = document.getElementById("adminProductSearch");
  const catFilter = document.getElementById("adminCategoryFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => renderProductsTable());
  }
  if (catFilter) {
    catFilter.addEventListener("change", () => renderProductsTable());
  }

  // Setup Add Product Modal
  setupProductModals();

  // Setup Firebase Cloud Firestore Controls
  initFirebaseAdminSection();

  // Reset Store Data Action
  const resetBtn = document.getElementById("btnResetStoreData");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      if (confirm("Reset all products, orders, and demo users to default sample data?")) {
        localStorage.removeItem(ShopNovaStorage.KEYS.PRODUCTS);
        localStorage.removeItem(ShopNovaStorage.KEYS.ORDERS);
        localStorage.removeItem(ShopNovaStorage.KEYS.CART);
        localStorage.removeItem(ShopNovaStorage.KEYS.WISHLIST);
        ShopNovaStorage.init();
        ShopNovaToast.show("Store data reset to initial seed state!", "success");
        renderMetrics();
        renderProductsTable();
        renderOrdersTable();
      }
    });
  }

  // Admin Logout Button
  const logoutBtn = document.getElementById("btnAdminLogout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to sign out of the admin portal?")) {
        // Sign out of Firebase Auth if active
        if (window.RJFirebase) {
          window.RJFirebase.authSignOut().catch(() => {});
        }
        // Clear session from local storage
        const storage = window.RJFashionStorage || window.ShopNovaStorage;
        if (storage) storage.setCurrentUser(null);

        ShopNovaToast.show("Signed out. Redirecting to admin login...", "info");
        setTimeout(() => {
          window.location.replace("admin-login.html");
        }, 600);
      }
    });
  }
}

// 1. KPI Statistics
function renderMetrics() {
  const products = ShopNovaStorage.getProducts();
  const orders = ShopNovaStorage.getOrders();

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const revEl = document.getElementById("adminStatRevenue");
  const ordersEl = document.getElementById("adminStatOrders");
  const prodEl = document.getElementById("adminStatProducts");
  const stockEl = document.getElementById("adminStatStock");

  if (revEl) revEl.textContent = ShopNovaApp.formatCurrency(totalRevenue);
  if (ordersEl) ordersEl.textContent = totalOrders;
  if (prodEl) prodEl.textContent = totalProducts;
  if (stockEl) stockEl.textContent = `${products.length - outOfStockCount} / ${totalProducts} In Stock`;
}

// 2. Product Management Table
function renderProductsTable() {
  const tableBody = document.getElementById("adminProductsTbody");
  if (!tableBody) return;

  const searchVal = (document.getElementById("adminProductSearch")?.value || "").trim().toLowerCase();
  const catVal = document.getElementById("adminCategoryFilter")?.value || "all";

  let products = ShopNovaStorage.getProducts();

  if (catVal !== "all") {
    products = products.filter(p => p.category.toLowerCase() === catVal.toLowerCase());
  }

  if (searchVal) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchVal) ||
      p.category.toLowerCase().includes(searchVal) ||
      p.id.toLowerCase().includes(searchVal)
    );
  }

  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No products found. Click "Add Product" to create one.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${p.image}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: var(--radius-sm); object-fit: cover;">
          <div>
            <div style="font-weight: 700; font-size: 0.9rem; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">SKU: ${p.id.toUpperCase()}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-primary">${p.category}</span></td>
      <td class="font-bold">${ShopNovaApp.formatCurrency(p.price)}</td>
      <td>
        <span class="badge ${p.stock <= 0 ? 'badge-danger' : (p.stock <= 5 ? 'badge-warning' : 'badge-success')}">
          ${p.stock} units
        </span>
      </td>
      <td>${p.rating}★ (${p.reviewCount || 12})</td>
      <td>
        <span class="badge badge-dark">${p.badge || 'Standard'}</span>
      </td>
      <td>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-sm btn-outline btn-edit-product" data-id="${p.id}" title="Edit product">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn btn-sm btn-outline btn-delete-product" data-id="${p.id}" style="color: var(--danger); border-color: #fecaca;" title="Delete product">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach Edit and Delete buttons
  tableBody.querySelectorAll(".btn-edit-product").forEach(b => {
    b.addEventListener("click", () => openEditProductModal(b.getAttribute("data-id")));
  });

  tableBody.querySelectorAll(".btn-delete-product").forEach(b => {
    b.addEventListener("click", () => deleteProduct(b.getAttribute("data-id")));
  });
}

// 3. Product Add / Edit Modal Logic
function setupProductModals() {
  const addBtn = document.getElementById("btnOpenAddProductModal");
  const modal = document.getElementById("productFormModal");
  const closeBtn = document.getElementById("btnCloseProductModal");
  const form = document.getElementById("productForm");

  if (!modal || !form) return;

  if (addBtn) {
    addBtn.addEventListener("click", () => {
      form.reset();
      document.getElementById("prodFormId").value = "";
      document.getElementById("prodModalTitle").textContent = "Add New Product";
      modal.classList.add("active");
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  }

  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.remove("active");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("prodFormId").value;
    const name = document.getElementById("prodFormName").value.trim();
    const category = document.getElementById("prodFormCategory").value;
    const price = parseFloat(document.getElementById("prodFormPrice").value);
    const originalPrice = parseFloat(document.getElementById("prodFormOrigPrice").value) || null;
    const stock = parseInt(document.getElementById("prodFormStock").value) || 0;
    const badge = document.getElementById("prodFormBadge").value.trim() || null;
    const image = document.getElementById("prodFormImage").value.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
    const desc = document.getElementById("prodFormDesc").value.trim();

    if (!name || isNaN(price) || price < 0) {
      ShopNovaToast.show("Please enter a valid product name and price.", "error");
      return;
    }

    const products = ShopNovaStorage.getProducts();

    if (id) {
      // Editing existing product
      const target = products.find(p => p.id === id);
      if (target) {
        target.name = name;
        target.category = category;
        target.price = price;
        target.originalPrice = originalPrice;
        target.stock = stock;
        target.badge = badge;
        target.image = image;
        target.shortDesc = desc;
        target.description = desc;
        ShopNovaStorage.saveProducts(products);
        if (window.RJFirebase && window.RJFirebase.isConfigured()) {
          window.RJFirebase.updateProduct(id, target).catch(err => console.warn(err));
        }
        ShopNovaToast.show("Product updated successfully!", "success");
      }
    } else {
      // Creating new product
      const newId = "rj-" + (Math.floor(100 + Math.random() * 900));
      const newProduct = {
        id: newId,
        name,
        category,
        price,
        originalPrice,
        discount: originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
        stock,
        badge,
        image,
        thumbnails: [image],
        rating: 5.0,
        reviewCount: 1,
        featured: true,
        bestSeller: false,
        newArrival: true,
        shortDesc: desc,
        description: desc,
        specs: { "Category": category, "Status": "In Stock" }
      };

      products.unshift(newProduct);
      ShopNovaStorage.saveProducts(products);
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        window.RJFirebase.addProduct(newProduct).catch(err => console.warn(err));
      }
      ShopNovaToast.show(`Product "${name}" added to catalog!`, "success");
    }

    modal.classList.remove("active");
    renderMetrics();
    renderProductsTable();
  });
}

function openEditProductModal(productId) {
  const product = ShopNovaStorage.getProductById(productId);
  if (!product) return;

  const modal = document.getElementById("productFormModal");
  if (!modal) return;

  document.getElementById("prodModalTitle").textContent = "Edit Product";
  document.getElementById("prodFormId").value = product.id;
  document.getElementById("prodFormName").value = product.name;
  document.getElementById("prodFormCategory").value = product.category;
  document.getElementById("prodFormPrice").value = product.price;
  document.getElementById("prodFormOrigPrice").value = product.originalPrice || "";
  document.getElementById("prodFormStock").value = product.stock;
  document.getElementById("prodFormBadge").value = product.badge || "";
  document.getElementById("prodFormImage").value = product.image;
  document.getElementById("prodFormDesc").value = product.shortDesc || product.description || "";

  modal.classList.add("active");
}

function deleteProduct(productId) {
  const product = ShopNovaStorage.getProductById(productId);
  if (!product) return;

  if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
    let products = ShopNovaStorage.getProducts();
    products = products.filter(p => p.id !== productId);
    ShopNovaStorage.saveProducts(products);
    if (window.RJFirebase && window.RJFirebase.isConfigured()) {
      window.RJFirebase.deleteProduct(productId).catch(err => console.warn(err));
    }
    ShopNovaToast.show(`Product "${product.name}" deleted.`, "info");
    renderMetrics();
    renderProductsTable();
  }
}

// 4. Order Management Table
function renderOrdersTable() {
  const tableBody = document.getElementById("adminOrdersTbody");
  if (!tableBody) return;

  const orders = ShopNovaStorage.getOrders();

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          No customer orders placed yet.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>#${order.id}</strong></td>
      <td>${order.date}</td>
      <td>
        <div style="font-weight: 600;">${order.customerName}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);">${order.email}</div>
      </td>
      <td>
        <span style="font-size: 0.85rem;">${order.items.length} item(s)</span>
      </td>
      <td class="font-bold text-primary">${ShopNovaApp.formatCurrency(order.total)}</td>
      <td>
        <select class="sort-select admin-order-status-select" data-order-id="${order.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">
          <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
          <option value="Processing" ${order.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
          <option value="Delivered" ${order.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-outline btn-view-order-details" data-order-id="${order.id}">
          <i class="fa-regular fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join("");

  // Status Change Dropdown Listeners
  tableBody.querySelectorAll(".admin-order-status-select").forEach(select => {
    select.addEventListener("change", (e) => {
      const orderId = select.getAttribute("data-order-id");
      const newStatus = select.value;
      ShopNovaStorage.updateOrderStatus(orderId, newStatus);
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        window.RJFirebase.updateOrderStatus(orderId, newStatus).catch(err => console.warn(err));
      }
      ShopNovaToast.show(`Order #${orderId} status changed to "${newStatus}"`, "success");
    });
  });

  // View Details Modal
  tableBody.querySelectorAll(".btn-view-order-details").forEach(btn => {
    btn.addEventListener("click", () => {
      const orderId = btn.getAttribute("data-order-id");
      showAdminOrderModal(orderId);
    });
  });
}

function showAdminOrderModal(orderId) {
  const orders = ShopNovaStorage.getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  let modal = document.getElementById("adminOrderModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "adminOrderModal";
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; padding: 2rem;">
        <button class="modal-close-btn" id="closeAdminOrderModal">&times;</button>
        <div id="adminOrderModalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector("#closeAdminOrderModal").addEventListener("click", () => modal.classList.remove("active"));
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("active");
    });
  }

  const body = document.getElementById("adminOrderModalBody");
  body.innerHTML = `
    <h3 style="margin-bottom: 1rem;">Order #${order.id} Details</h3>
    <div style="background: var(--bg-alt); padding: 1rem; border-radius: var(--radius-md); font-size: 0.9rem; margin-bottom: 1.5rem;">
      <p><strong>Customer:</strong> ${order.customerName} (${order.email})</p>
      <p><strong>Phone:</strong> ${order.phone}</p>
      <p><strong>Delivery Address:</strong> ${order.address}</p>
      <p><strong>Date Placed:</strong> ${order.date}</p>
      <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
      <p><strong>Status:</strong> <span class="badge badge-primary">${order.status}</span></p>
    </div>

    <h4 style="margin-bottom: 0.75rem;">Purchased Items</h4>
    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem;">
      ${order.items.map(item => `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); padding-bottom: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${item.image}" alt="${item.name}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${item.name}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">Qty: ${item.quantity} · ${ShopNovaApp.formatCurrency(item.price)}</div>
            </div>
          </div>
          <strong class="text-primary">${ShopNovaApp.formatCurrency(item.price * item.quantity)}</strong>
        </div>
      `).join("")}
    </div>

    <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; border-top: 2px solid var(--border); padding-top: 0.75rem;">
      <span>Total Paid:</span>
      <span class="text-primary">${ShopNovaApp.formatCurrency(order.total)}</span>
    </div>
  `;

  modal.classList.add("active");
}

// 5. Firebase Cloud Firestore Administration Section
function initFirebaseAdminSection() {
  const form = document.getElementById("firebaseConfigForm");
  const statusBadge = document.getElementById("firebaseLiveStatusBadge");
  const disconnectBtn = document.getElementById("btnDisconnectFirebase");
  const testConnBtn = document.getElementById("btnTestFirebaseConn");
  const syncToFirestoreBtn = document.getElementById("btnSyncToFirestore");
  const pullFromFirestoreBtn = document.getElementById("btnPullFromFirestore");
  const autoParseBtn = document.getElementById("btnAutoParseSnippet");
  const clearSnippetBtn = document.getElementById("btnClearSnippet");
  const snippetArea = document.getElementById("fbPasteSnippet");
  const refreshStatsBtn = document.getElementById("btnRefreshFirebaseStats");
  const copyRulesBtn = document.getElementById("btnCopyFirestoreRules");

  if (!form) return;

  function updateStatusUI() {
    const isConfigured = window.RJFirebase && window.RJFirebase.isConfigured();
    const config = window.RJFirebase ? window.RJFirebase.getConfig() : null;

    if (isConfigured && config && config.projectId) {
      if (statusBadge) {
        statusBadge.className = "badge badge-success";
        const modeLabel = window.RJFirebase.mode ? ` (${window.RJFirebase.mode.toUpperCase()})` : '';
        statusBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected: ${config.projectId}${modeLabel}`;
      }
      refreshCloudStats();
    } else {
      if (statusBadge) {
        statusBadge.className = "badge badge-warning";
        statusBadge.innerHTML = `<i class="fa-solid fa-circle-dot"></i> Local Storage Mode (Offline)`;
      }
      if (document.getElementById("fbStatProducts")) document.getElementById("fbStatProducts").textContent = "--";
      if (document.getElementById("fbStatOrders")) document.getElementById("fbStatOrders").textContent = "--";
      if (document.getElementById("fbStatUsers")) document.getElementById("fbStatUsers").textContent = "--";
    }
  }

  async function refreshCloudStats() {
    if (!window.RJFirebase || !window.RJFirebase.isConfigured()) return;
    try {
      const stats = await window.RJFirebase.getFirestoreStats();
      if (document.getElementById("fbStatProducts")) document.getElementById("fbStatProducts").textContent = stats.products;
      if (document.getElementById("fbStatOrders")) document.getElementById("fbStatOrders").textContent = stats.orders;
      if (document.getElementById("fbStatUsers")) document.getElementById("fbStatUsers").textContent = stats.users;
    } catch (e) {
      console.info("Stats notice:", e);
    }
  }

  // Auto-Detect & Parse pasted Firebase snippet
  function extractFirebaseKeys(raw) {
    const config = {};
    const keyPatterns = {
      apiKey: /(?:apiKey|api_key)["']?\s*:\s*["']([^"']+)["']/i,
      authDomain: /(?:authDomain|auth_domain)["']?\s*:\s*["']([^"']+)["']/i,
      projectId: /(?:projectId|project_id)["']?\s*:\s*["']([^"']+)["']/i,
      storageBucket: /(?:storageBucket|storage_bucket)["']?\s*:\s*["']([^"']+)["']/i,
      messagingSenderId: /(?:messagingSenderId|messaging_sender_id)["']?\s*:\s*["']([^"']+)["']/i,
      appId: /(?:appId|app_id)["']?\s*:\s*["']([^"']+)["']/i
    };
    for (const [k, pat] of Object.entries(keyPatterns)) {
      const match = raw.match(pat);
      if (match && match[1]) config[k] = match[1].trim();
    }
    return config;
  }

  if (autoParseBtn && snippetArea) {
    autoParseBtn.addEventListener("click", () => {
      const text = snippetArea.value.trim();
      if (!text) {
        ShopNovaToast.show("Please paste your firebaseConfig snippet first.", "warning");
        return;
      }
      const parsed = extractFirebaseKeys(text);
      if (parsed.projectId || parsed.apiKey) {
        if (parsed.projectId) document.getElementById("fbProjectId").value = parsed.projectId;
        if (parsed.apiKey) document.getElementById("fbApiKey").value = parsed.apiKey;
        if (parsed.authDomain) document.getElementById("fbAuthDomain").value = parsed.authDomain;
        if (parsed.storageBucket) document.getElementById("fbStorageBucket").value = parsed.storageBucket;
        if (parsed.messagingSenderId) document.getElementById("fbSenderId").value = parsed.messagingSenderId;
        if (parsed.appId) document.getElementById("fbAppId").value = parsed.appId;
        ShopNovaToast.show("✨ Extracted Firebase credentials successfully!", "success");
      } else {
        ShopNovaToast.show("Could not find apiKey or projectId in pasted text.", "error");
      }
    });
  }

  if (clearSnippetBtn && snippetArea) {
    clearSnippetBtn.addEventListener("click", () => {
      snippetArea.value = "";
    });
  }

  // Copy Security Rules
  if (copyRulesBtn) {
    copyRulesBtn.addEventListener("click", () => {
      const snippet = document.getElementById("firestoreRulesSnippet");
      if (snippet) {
        navigator.clipboard.writeText(snippet.textContent.trim()).then(() => {
          ShopNovaToast.show("📋 Security rules copied to clipboard!", "success");
        }).catch(() => {
          ShopNovaToast.show("Copied rules to clipboard.", "info");
        });
      }
    });
  }

  if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener("click", () => {
      refreshCloudStats();
      ShopNovaToast.show("Updated collection counts.", "info");
    });
  }

  // Pre-fill existing config if stored
  if (window.RJFirebase) {
    const saved = window.RJFirebase.getConfig();
    if (saved) {
      if (document.getElementById("fbProjectId")) document.getElementById("fbProjectId").value = saved.projectId || "";
      if (document.getElementById("fbApiKey")) document.getElementById("fbApiKey").value = saved.apiKey || "";
      if (document.getElementById("fbAuthDomain")) document.getElementById("fbAuthDomain").value = saved.authDomain || "";
      if (document.getElementById("fbStorageBucket")) document.getElementById("fbStorageBucket").value = saved.storageBucket || "";
      if (document.getElementById("fbSenderId")) document.getElementById("fbSenderId").value = saved.messagingSenderId || "";
      if (document.getElementById("fbAppId")) document.getElementById("fbAppId").value = saved.appId || "";
    }
  }

  updateStatusUI();

  // Listen for background ready event
  window.addEventListener("rj-firebase-ready", () => {
    updateStatusUI();
  });
  window.addEventListener("rj-firebase-status-change", () => {
    updateStatusUI();
  });

  // Handle Save & Connect
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const projectId = document.getElementById("fbProjectId").value.trim();
    const apiKey = document.getElementById("fbApiKey").value.trim();
    const authDomain = document.getElementById("fbAuthDomain").value.trim();
    const storageBucket = document.getElementById("fbStorageBucket").value.trim();
    const messagingSenderId = document.getElementById("fbSenderId").value.trim();
    const appId = document.getElementById("fbAppId").value.trim();

    const submitBtn = document.getElementById("btnSaveFirebaseConfig");
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Connecting...`;

    try {
      if (!window.RJFirebase) throw new Error("Firebase module not loaded.");
      const success = await window.RJFirebase.saveConfig({
        projectId,
        apiKey,
        authDomain,
        storageBucket,
        messagingSenderId,
        appId
      });

      if (success) {
        ShopNovaToast.show(`🔥 Connected to Firebase project "${projectId}"!`, "success");
        refreshCloudStats();
      } else {
        ShopNovaToast.show(`⚠️ Config saved, but connection error: ${window.RJFirebase.initError || "Check network/keys"}`, "warning");
      }
    } catch (err) {
      ShopNovaToast.show(`Error: ${err.message}`, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      updateStatusUI();
    }
  });

  // Handle Test Connection
  if (testConnBtn) {
    testConnBtn.addEventListener("click", async () => {
      if (!window.RJFirebase) {
        ShopNovaToast.show("Firebase module not loaded.", "error");
        return;
      }
      if (!window.RJFirebase.isConfigured()) {
        const config = window.RJFirebase.getConfig();
        if (config) {
          await window.RJFirebase.init();
        }
      }
      if (!window.RJFirebase.isConfigured()) {
        ShopNovaToast.show("Please connect your Firebase project first.", "warning");
        return;
      }
      const orig = testConnBtn.innerHTML;
      testConnBtn.disabled = true;
      testConnBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Testing Read/Write...`;
      try {
        const result = await window.RJFirebase.testConnection();
        if (result.success) {
          ShopNovaToast.show(result.message || "🟢 Connection verified! Read/write to Cloud Firestore is working.", "success");
          refreshCloudStats();
        } else {
          ShopNovaToast.show(`⚠️ ${result.message}`, "warning");
        }
      } catch (err) {
        ShopNovaToast.show(`Test failed: ${err.message}`, "error");
      } finally {
        testConnBtn.disabled = false;
        testConnBtn.innerHTML = orig;
        updateStatusUI();
      }
    });
  }

  // Handle Disconnect
  if (disconnectBtn) {
    disconnectBtn.addEventListener("click", () => {
      if (window.RJFirebase) {
        window.RJFirebase.removeConfig();
        document.getElementById("fbProjectId").value = "";
        document.getElementById("fbApiKey").value = "";
        document.getElementById("fbAuthDomain").value = "";
        document.getElementById("fbStorageBucket").value = "";
        document.getElementById("fbSenderId").value = "";
        document.getElementById("fbAppId").value = "";
        updateStatusUI();
        ShopNovaToast.show("Disconnected from Firebase. Reverted to Local Storage.", "info");
      }
    });
  }

  // Handle Sync to Firestore
  if (syncToFirestoreBtn) {
    syncToFirestoreBtn.addEventListener("click", async () => {
      if (!window.RJFirebase || !window.RJFirebase.isConfigured()) {
        ShopNovaToast.show("Please connect your Firebase project first.", "warning");
        return;
      }
      const origText = syncToFirestoreBtn.innerHTML;
      syncToFirestoreBtn.disabled = true;
      syncToFirestoreBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Uploading to Cloud...`;
      try {
        const res = await window.RJFirebase.syncLocalToFirestore();
        refreshCloudStats();
        ShopNovaToast.show(`🚀 Synced ${res.uploadedProducts} products, ${res.uploadedOrders} orders & ${res.uploadedUsers} users to Cloud Firestore!`, "success");
      } catch (err) {
        ShopNovaToast.show(`Sync failed: ${err.message}`, "error");
      } finally {
        syncToFirestoreBtn.disabled = false;
        syncToFirestoreBtn.innerHTML = origText;
      }
    });
  }

  // Handle Pull from Firestore
  if (pullFromFirestoreBtn) {
    pullFromFirestoreBtn.addEventListener("click", async () => {
      if (!window.RJFirebase || !window.RJFirebase.isConfigured()) {
        ShopNovaToast.show("Please connect your Firebase project first.", "warning");
        return;
      }
      const origText = pullFromFirestoreBtn.innerHTML;
      pullFromFirestoreBtn.disabled = true;
      pullFromFirestoreBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Downloading from Cloud...`;
      try {
        const stats = await window.RJFirebase.syncFirestoreToLocal();
        renderMetrics();
        renderProductsTable();
        renderOrdersTable();
        refreshCloudStats();
        ShopNovaToast.show(`✅ Pulled ${stats.productsCount} products & ${stats.ordersCount} orders from Cloud Firestore!`, "success");
      } catch (err) {
        ShopNovaToast.show(`Download failed: ${err.message}`, "error");
      } finally {
        pullFromFirestoreBtn.disabled = false;
        pullFromFirestoreBtn.innerHTML = origText;
      }
    });
  }
}


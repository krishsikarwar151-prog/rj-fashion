/**
 * ShopNova - Products Catalog & Product Details Module
 * Handles catalog filtering, sorting, pagination, search,
 * product details gallery, options selection, reviews, and home showcases.
 */

document.addEventListener("DOMContentLoaded", () => {
  initCatalogPage();
  initProductDetailsPage();
  initHomePageShowcases();
});

// ==========================================================================
// 1. Catalog Page (products.html)
// ==========================================================================
function initCatalogPage() {
  const catalogGrid = document.getElementById("catalogProductsGrid");
  if (!catalogGrid) return;

  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category");
  const initialSearch = urlParams.get("search");

  // State object for catalog filtering
  const state = {
    category: initialCategory || "all",
    search: initialSearch || "",
    maxPrice: 500,
    minRating: 0,
    inStockOnly: false,
    sortBy: "featured",
    viewMode: "grid",
    currentPage: 1,
    itemsPerPage: 8
  };

  // Sync initial search input if present
  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  if (sidebarSearchInput && state.search) {
    sidebarSearchInput.value = state.search;
  }

  // Price Range Slider
  const priceRange = document.getElementById("priceRangeSlider");
  const priceDisplay = document.getElementById("maxPriceDisplay");
  if (priceRange && priceDisplay) {
    priceRange.addEventListener("input", (e) => {
      state.maxPrice = Number(e.target.value);
      priceDisplay.textContent = "$" + state.maxPrice;
      state.currentPage = 1;
      render();
    });
  }

  // Category Filter Radio / Checkbox listeners
  const categoryInputs = document.querySelectorAll("input[name='categoryFilter']");
  categoryInputs.forEach(input => {
    if (initialCategory && input.value.toLowerCase() === initialCategory.toLowerCase()) {
      input.checked = true;
    }
    input.addEventListener("change", (e) => {
      state.category = e.target.value;
      state.currentPage = 1;
      render();
    });
  });

  // In-stock only toggle
  const inStockCheckbox = document.getElementById("inStockOnlyFilter");
  if (inStockCheckbox) {
    inStockCheckbox.addEventListener("change", (e) => {
      state.inStockOnly = e.target.checked;
      state.currentPage = 1;
      render();
    });
  }

  // Rating Filter Radios
  const ratingInputs = document.querySelectorAll("input[name='ratingFilter']");
  ratingInputs.forEach(input => {
    input.addEventListener("change", (e) => {
      state.minRating = Number(e.target.value);
      state.currentPage = 1;
      render();
    });
  });

  // Sidebar Search
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener("input", (e) => {
      state.search = e.target.value.trim().toLowerCase();
      state.currentPage = 1;
      render();
    });
  }

  // Sort Dropdown
  const sortSelect = document.getElementById("catalogSortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      render();
    });
  }

  // View Mode Buttons (Grid vs List)
  const gridViewBtn = document.getElementById("btnGridView");
  const listViewBtn = document.getElementById("btnListView");

  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener("click", () => {
      state.viewMode = "grid";
      gridViewBtn.classList.add("active");
      listViewBtn.classList.remove("active");
      catalogGrid.classList.remove("list-view");
      render();
    });

    listViewBtn.addEventListener("click", () => {
      state.viewMode = "list";
      listViewBtn.classList.add("active");
      gridViewBtn.classList.remove("active");
      catalogGrid.classList.add("list-view");
      render();
    });
  }

  // Reset Filters Button
  const resetBtn = document.getElementById("resetFiltersBtn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      state.category = "all";
      state.search = "";
      state.maxPrice = 500;
      state.minRating = 0;
      state.inStockOnly = false;
      state.sortBy = "featured";
      state.currentPage = 1;

      if (priceRange) priceRange.value = 500;
      if (priceDisplay) priceDisplay.textContent = "$500";
      if (sidebarSearchInput) sidebarSearchInput.value = "";
      if (inStockCheckbox) inStockCheckbox.checked = false;

      const allCat = document.querySelector("input[name='categoryFilter'][value='all']");
      if (allCat) allCat.checked = true;

      const allRating = document.querySelector("input[name='ratingFilter'][value='0']");
      if (allRating) allRating.checked = true;

      render();
      ShopNovaToast.show("Filters reset to default.", "info");
    });
  }

  function getFilteredProducts() {
    let products = ShopNovaStorage.getProducts();

    // Category
    if (state.category && state.category !== "all") {
      products = products.filter(p => p.category.toLowerCase() === state.category.toLowerCase());
    }

    // Search
    if (state.search) {
      const q = state.search.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shortDesc && p.shortDesc.toLowerCase().includes(q))
      );
    }

    // Price
    products = products.filter(p => p.price <= state.maxPrice);

    // Rating
    if (state.minRating > 0) {
      products = products.filter(p => p.rating >= state.minRating);
    }

    // In Stock
    if (state.inStockOnly) {
      products = products.filter(p => p.stock > 0);
    }

    // Sorting
    if (state.sortBy === "price-low") {
      products.sort((a, b) => a.price - b.price);
    } else if (state.sortBy === "price-high") {
      products.sort((a, b) => b.price - a.price);
    } else if (state.sortBy === "rating") {
      products.sort((a, b) => b.rating - a.rating);
    } else if (state.sortBy === "newest") {
      products.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0));
    } else if (state.sortBy === "discount") {
      products.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    }

    return products;
  }

  function render() {
    const filtered = getFilteredProducts();
    const countEl = document.getElementById("resultsCountDisplay");
    if (countEl) {
      countEl.innerHTML = `Showing <strong>${filtered.length}</strong> products`;
    }

    renderActiveFilterTags();

    if (filtered.length === 0) {
      catalogGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <h3>No products match your criteria</h3>
          <p>Try broadening your filters, adjusting the price range, or searching with another keyword.</p>
          <button class="btn btn-primary" id="emptyResetBtn">Clear All Filters</button>
        </div>
      `;
      const emptyReset = document.getElementById("emptyResetBtn");
      if (emptyReset && resetBtn) emptyReset.addEventListener("click", () => resetBtn.click());
      renderPagination(0);
      return;
    }

    // Pagination
    const totalPages = Math.ceil(filtered.length / state.itemsPerPage);
    if (state.currentPage > totalPages) state.currentPage = totalPages || 1;
    const startIndex = (state.currentPage - 1) * state.itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, startIndex + state.itemsPerPage);

    catalogGrid.innerHTML = paginatedItems.map(p => createProductCardHTML(p)).join("");
    attachCardEventListeners(catalogGrid);
    renderPagination(totalPages);
  }

  function renderActiveFilterTags() {
    const wrap = document.getElementById("activeFiltersWrap");
    if (!wrap) return;

    const tags = [];
    if (state.category !== "all") {
      tags.push({ label: `Category: ${state.category}`, clear: () => {
        state.category = "all";
        const el = document.querySelector("input[name='categoryFilter'][value='all']");
        if (el) el.checked = true;
      }});
    }
    if (state.search) {
      tags.push({ label: `Search: "${state.search}"`, clear: () => {
        state.search = "";
        if (sidebarSearchInput) sidebarSearchInput.value = "";
      }});
    }
    if (state.maxPrice < 500) {
      tags.push({ label: `Under $${state.maxPrice}`, clear: () => {
        state.maxPrice = 500;
        if (priceRange) priceRange.value = 500;
        if (priceDisplay) priceDisplay.textContent = "$500";
      }});
    }
    if (state.minRating > 0) {
      tags.push({ label: `${state.minRating}★ & above`, clear: () => {
        state.minRating = 0;
        const el = document.querySelector("input[name='ratingFilter'][value='0']");
        if (el) el.checked = true;
      }});
    }
    if (state.inStockOnly) {
      tags.push({ label: "In Stock Only", clear: () => {
        state.inStockOnly = false;
        if (inStockCheckbox) inStockCheckbox.checked = false;
      }});
    }

    if (tags.length === 0) {
      wrap.innerHTML = "";
      return;
    }

    wrap.innerHTML = tags.map((t, i) => `
      <span class="filter-tag">
        ${t.label}
        <button type="button" data-tag-index="${i}" aria-label="Remove filter">&times;</button>
      </span>
    `).join("");

    wrap.querySelectorAll("button").forEach(b => {
      b.addEventListener("click", () => {
        const idx = Number(b.getAttribute("data-tag-index"));
        if (tags[idx]) {
          tags[idx].clear();
          render();
        }
      });
    });
  }

  function renderPagination(totalPages) {
    const paginationEl = document.getElementById("catalogPagination");
    if (!paginationEl) return;

    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }

    let html = `
      <button class="page-btn" id="prevPageBtn" ${state.currentPage === 1 ? 'disabled' : ''}>
        <i class="fa-solid fa-angle-left"></i>
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn" id="nextPageBtn" ${state.currentPage === totalPages ? 'disabled' : ''}>
        <i class="fa-solid fa-angle-right"></i>
      </button>
    `;

    paginationEl.innerHTML = html;

    const prevBtn = paginationEl.querySelector("#prevPageBtn");
    const nextBtn = paginationEl.querySelector("#nextPageBtn");

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          render();
          window.scrollTo({ top: 300, behavior: "smooth" });
        }
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        if (state.currentPage < totalPages) {
          state.currentPage++;
          render();
          window.scrollTo({ top: 300, behavior: "smooth" });
        }
      });
    }

    paginationEl.querySelectorAll("[data-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.currentPage = Number(btn.getAttribute("data-page"));
        render();
        window.scrollTo({ top: 300, behavior: "smooth" });
      });
    });
  }

  // Initial render
  render();

  // Re-render when Cloud Firestore syncs updated products
  window.addEventListener("shopnova-products-updated", () => render());

  // Listen for real-time Firestore updates
  function attachFirestoreProductListener() {
    if (window.RJFirebase && window.RJFirebase.isConfigured()) {
      window.RJFirebase.listenProducts(() => render());
    }
  }
  attachFirestoreProductListener();
  window.addEventListener("rj-firebase-ready", () => attachFirestoreProductListener());
}

// ==========================================================================
// 2. Product Details Page (product-details.html)
// ==========================================================================
function initProductDetailsPage() {
  const detailWrap = document.getElementById("productDetailPageWrap");
  if (!detailWrap) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id") || "sn-101";

  const product = ShopNovaStorage.getProductById(productId) || ShopNovaStorage.getProducts()[0];
  if (!product) return;

  // Update Breadcrumb & Page Title
  document.title = `${product.name} | ShopNova`;
  const breadcrumbCategory = document.getElementById("breadcrumbCategory");
  const breadcrumbProduct = document.getElementById("breadcrumbProduct");
  if (breadcrumbCategory) {
    breadcrumbCategory.textContent = product.category;
    breadcrumbCategory.href = `products.html?category=${encodeURIComponent(product.category)}`;
  }
  if (breadcrumbProduct) breadcrumbProduct.textContent = product.name;

  // Main Gallery Image & Thumbnails
  const mainImg = document.getElementById("detailMainImg");
  const thumbWrap = document.getElementById("detailThumbnails");

  if (mainImg) mainImg.src = product.image;

  if (thumbWrap) {
    const thumbs = product.thumbnails && product.thumbnails.length ? product.thumbnails : [product.image];
    thumbWrap.innerHTML = thumbs.map((src, i) => `
      <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-thumb-src="${src}">
        <img src="${src}" alt="Thumbnail ${i + 1}">
      </div>
    `).join("");

    thumbWrap.querySelectorAll(".gallery-thumb").forEach(t => {
      t.addEventListener("click", () => {
        thumbWrap.querySelectorAll(".gallery-thumb").forEach(el => el.classList.remove("active"));
        t.classList.add("active");
        if (mainImg) mainImg.src = t.getAttribute("data-thumb-src");
      });
    });
  }

  // Populate Meta Info
  setText("detailCategory", product.category);
  setText("detailTitle", product.name);
  setText("detailSku", `SKU: ${product.id.toUpperCase()}`);
  setText("detailPrice", ShopNovaApp.formatCurrency(product.price));
  setText("detailShortDesc", product.shortDesc || product.description);

  const origPriceEl = document.getElementById("detailOriginalPrice");
  if (origPriceEl) {
    if (product.originalPrice) {
      origPriceEl.textContent = ShopNovaApp.formatCurrency(product.originalPrice);
      origPriceEl.style.display = "inline";
    } else {
      origPriceEl.style.display = "none";
    }
  }

  const discountEl = document.getElementById("detailDiscountBadge");
  if (discountEl) {
    if (product.discount) {
      discountEl.textContent = `-${product.discount}% OFF`;
      discountEl.style.display = "inline-flex";
    } else {
      discountEl.style.display = "none";
    }
  }

  const stockBadge = document.getElementById("detailStockBadge");
  if (stockBadge) {
    if (product.stock > 0) {
      stockBadge.className = `product-stock-status ${product.stock <= 5 ? 'low' : ''}`;
      stockBadge.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${product.stock > 5 ? 'In Stock' : 'Only ' + product.stock + ' Left!'}`;
    } else {
      stockBadge.className = "product-stock-status out";
      stockBadge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Out of Stock`;
    }
  }

  // Color options
  const colorWrap = document.getElementById("detailColorOptions");
  let selectedColor = product.colors && product.colors.length ? product.colors[0] : null;
  if (colorWrap && product.colors && product.colors.length) {
    colorWrap.innerHTML = product.colors.map((c, idx) => `
      <div class="color-pill ${idx === 0 ? 'active' : ''}" style="background-color: ${c};" data-color="${c}"></div>
    `).join("");

    colorWrap.querySelectorAll(".color-pill").forEach(p => {
      p.addEventListener("click", () => {
        colorWrap.querySelectorAll(".color-pill").forEach(el => el.classList.remove("active"));
        p.classList.add("active");
        selectedColor = p.getAttribute("data-color");
      });
    });
  }

  // Size options
  const sizeWrap = document.getElementById("detailSizeOptions");
  const sizeContainer = document.getElementById("detailSizeGroup");
  let selectedSize = product.sizes && product.sizes.length ? product.sizes[0] : null;
  if (sizeWrap) {
    if (product.sizes && product.sizes.length) {
      sizeWrap.innerHTML = product.sizes.map((s, idx) => `
        <button type="button" class="size-pill ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
      `).join("");

      sizeWrap.querySelectorAll(".size-pill").forEach(b => {
        b.addEventListener("click", () => {
          sizeWrap.querySelectorAll(".size-pill").forEach(el => el.classList.remove("active"));
          b.classList.add("active");
          selectedSize = b.getAttribute("data-size");
        });
      });
    } else if (sizeContainer) {
      sizeContainer.style.display = "none";
    }
  }

  // Quantity Stepper
  const qtyInput = document.getElementById("detailQtyInput");
  const qtyMinus = document.getElementById("detailQtyMinus");
  const qtyPlus = document.getElementById("detailQtyPlus");

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) qtyInput.value = val - 1;
    });

    qtyPlus.addEventListener("click", () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < product.stock) qtyInput.value = val + 1;
      else ShopNovaToast.show(`Max available stock is ${product.stock}`, "warning");
    });
  }

  // Add to Cart Action
  const addToCartBtn = document.getElementById("detailAddToCartBtn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
      ShopNovaStorage.addToCart(product.id, qty, { color: selectedColor, size: selectedSize });
    });
  }

  // Buy Now Action
  const buyNowBtn = document.getElementById("detailBuyNowBtn");
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", () => {
      const qty = parseInt(qtyInput ? qtyInput.value : 1) || 1;
      const added = ShopNovaStorage.addToCart(product.id, qty, { color: selectedColor, size: selectedSize });
      if (added) {
        window.location.href = "checkout.html";
      }
    });
  }

  // Wishlist Action
  const wishBtn = document.getElementById("detailWishlistBtn");
  if (wishBtn) {
    const isWished = ShopNovaStorage.isInWishlist(product.id);
    if (isWished) wishBtn.classList.add("active");

    wishBtn.addEventListener("click", () => {
      const nowWished = ShopNovaStorage.toggleWishlist(product.id);
      wishBtn.classList.toggle("active", nowWished);
    });
  }

  // Tab Navigation
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));

      btn.classList.add("active");
      const target = document.getElementById(tabId);
      if (target) target.classList.add("active");
    });
  });

  // Populate Tab 1: Full Description
  const fullDesc = document.getElementById("detailFullDesc");
  if (fullDesc) fullDesc.textContent = product.description;

  // Populate Tab 2: Specifications Table
  const specsTable = document.getElementById("detailSpecsTable");
  if (specsTable && product.specs) {
    specsTable.innerHTML = Object.entries(product.specs).map(([key, val]) => `
      <tr>
        <th>${key}</th>
        <td>${val}</td>
      </tr>
    `).join("");
  }

  // Populate Tab 3: Reviews
  renderProductReviews(product);
  window.addEventListener("rj-firebase-ready", () => renderProductReviews(product));

  // Render Related Products
  renderRelatedProducts(product);
}

async function renderProductReviews(product) {
  const reviewsList = document.getElementById("detailReviewsList");
  const reviewForm = document.getElementById("newReviewForm");
  if (!reviewsList) return;

  // Retrieve reviews from storage or defaults
  let storedReviews = [];
  try {
    const allReviews = JSON.parse(localStorage.getItem(ShopNovaStorage.KEYS.REVIEWS) || "{}");
    storedReviews = allReviews[product.id] || [];
  } catch (e) {
    storedReviews = [];
  }

  // Fetch reviews from Cloud Firestore
  if (window.RJFirebase && window.RJFirebase.isConfigured()) {
    try {
      const cloudReviews = await window.RJFirebase.getReviews(product.id);
      if (cloudReviews && cloudReviews.length > 0) {
        const existingIds = new Set(storedReviews.map(r => r.id || `${r.author}-${r.date}`));
        for (const cr of cloudReviews) {
          const key = cr.id || `${cr.author}-${cr.date}`;
          if (!existingIds.has(key)) {
            storedReviews.unshift(cr);
            existingIds.add(key);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch cloud reviews:", e);
    }
  }

  const defaultReviews = [
    {
      author: "Marcus Vance",
      date: "Oct 12, 2026",
      rating: 5,
      comment: "Absolutely top tier quality. The build and materials exceeded my expectations, and shipping was remarkably fast!"
    },
    {
      author: "Elena Rostova",
      date: "Sep 29, 2026",
      rating: 5,
      comment: "Very premium feel. Performs exactly as advertised. Would 100% recommend to anyone on the fence."
    }
  ];

  const displayReviews = [...storedReviews, ...defaultReviews];

  reviewsList.innerHTML = displayReviews.map(r => `
    <div class="review-item">
      <div class="review-header">
        <div class="review-author">${r.author}</div>
        <div class="review-date">${r.date}</div>
      </div>
      <div class="product-rating" style="margin-bottom: 0.4rem;">
        <div class="stars">
          ${'<i class="fa-solid fa-star"></i>'.repeat(r.rating)}
        </div>
      </div>
      <div class="review-comment">${r.comment}</div>
    </div>
  `).join("");

  // Review Form Star Picker
  let selectedRating = 5;
  const starIcons = document.querySelectorAll(".rating-select-stars i");
  starIcons.forEach(star => {
    star.addEventListener("click", () => {
      selectedRating = Number(star.getAttribute("data-val"));
      starIcons.forEach((s, idx) => {
        s.classList.toggle("active", idx < selectedRating);
      });
    });
  });

  if (reviewForm) {
    reviewForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const author = document.getElementById("reviewAuthorName").value.trim();
      const comment = document.getElementById("reviewCommentText").value.trim();

      if (!author || !comment) {
        ShopNovaToast.show("Please enter your name and comment.", "error");
        return;
      }

      const newReview = {
        author,
        comment,
        rating: selectedRating,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      };

      try {
        const allReviews = JSON.parse(localStorage.getItem(ShopNovaStorage.KEYS.REVIEWS) || "{}");
        if (!allReviews[product.id]) allReviews[product.id] = [];
        allReviews[product.id].unshift(newReview);
        localStorage.setItem(ShopNovaStorage.KEYS.REVIEWS, JSON.stringify(allReviews));
      } catch (err) {}

      // Save to Cloud Firestore reviews collection
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        window.RJFirebase.addReview(product.id, newReview).catch(err => console.warn("Firestore review save:", err));
      }

      ShopNovaToast.show("Thank you! Your review has been posted.", "success");
      reviewForm.reset();
      renderProductReviews(product);
    });
  }
}

function renderRelatedProducts(currentProduct) {
  const relatedWrap = document.getElementById("relatedProductsGrid");
  if (!relatedWrap) return;

  const all = ShopNovaStorage.getProducts();
  const related = all
    .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
    .slice(0, 4);

  // If not enough in same category, grab other featured items
  if (related.length < 4) {
    const others = all.filter(p => p.id !== currentProduct.id && !related.includes(p));
    related.push(...others.slice(0, 4 - related.length));
  }

  relatedWrap.innerHTML = related.map(p => createProductCardHTML(p)).join("");
  attachCardEventListeners(relatedWrap);
}

// ==========================================================================
// 3. Homepage Showcases (index.html)
// ==========================================================================
function initHomePageShowcases() {
  const featuredWrap = document.getElementById("homeFeaturedGrid");
  const bestSellersWrap = document.getElementById("homeBestSellersGrid");
  const newArrivalsWrap = document.getElementById("homeNewArrivalsGrid");
  const categoryGrid = document.getElementById("homeCategoryGrid");

  function renderShowcases() {
    const products = ShopNovaStorage.getProducts();

    if (featuredWrap) {
      const featured = products.filter(p => p.featured).slice(0, 8);
      featuredWrap.innerHTML = featured.map(p => createProductCardHTML(p)).join("");
      attachCardEventListeners(featuredWrap);
    }

    if (bestSellersWrap) {
      const best = products.filter(p => p.bestSeller || p.rating >= 4.8).slice(0, 4);
      bestSellersWrap.innerHTML = best.map(p => createProductCardHTML(p)).join("");
      attachCardEventListeners(bestSellersWrap);
    }

    if (newArrivalsWrap) {
      const newItems = products.filter(p => p.newArrival).slice(0, 4);
      newArrivalsWrap.innerHTML = newItems.map(p => createProductCardHTML(p)).join("");
      attachCardEventListeners(newArrivalsWrap);
    }
  }

  renderShowcases();
  window.addEventListener("shopnova-products-updated", () => renderShowcases());
  window.addEventListener("rj-firebase-ready", () => renderShowcases());

  if (categoryGrid) {
    categoryGrid.innerHTML = DEFAULT_CATEGORIES.map(cat => `
      <a href="products.html?category=${encodeURIComponent(cat.name)}" class="category-card">
        <div class="category-img-wrap">
          <img src="${cat.image}" alt="${cat.name}">
        </div>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count} Items</div>
      </a>
    `).join("");
  }
}

// ==========================================================================
// 4. Shared Reusable Product Card HTML Generator & Event Binder
// ==========================================================================
function createProductCardHTML(product) {
  const isWished = ShopNovaStorage.isInWishlist(product.id);
  const starsCount = Math.floor(product.rating || 5);

  return `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-media">
        <a href="product-details.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        </a>
        <div class="product-badges">
          ${product.badge ? `<span class="badge badge-primary">${product.badge}</span>` : ''}
          ${product.discount ? `<span class="badge badge-danger">-${product.discount}%</span>` : ''}
        </div>
        <div class="product-actions-top">
          <button class="btn-action-icon ${isWished ? 'active' : ''}" data-wishlist-id="${product.id}" aria-label="Add to Wishlist">
            <i class="fa-${isWished ? 'solid' : 'regular'} fa-heart"></i>
          </button>
        </div>
        <div class="product-quick-view-overlay">
          <button class="btn-quick-view" data-quick-view="${product.id}">
            <i class="fa-regular fa-eye"></i> Quick View
          </button>
        </div>
      </div>
      <div class="product-content">
        <div class="product-category-row">
          <span class="product-category">${product.category}</span>
          <span class="product-stock-status ${product.stock <= 5 ? (product.stock === 0 ? 'out' : 'low') : ''}">
            <i class="fa-solid ${product.stock === 0 ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
            ${product.stock > 0 ? (product.stock <= 5 ? 'Only ' + product.stock + ' left' : 'In Stock') : 'Out of Stock'}
          </span>
        </div>
        <h4 class="product-title">
          <a href="product-details.html?id=${product.id}">${product.name}</a>
        </h4>
        <div class="product-rating">
          <div class="stars">
            ${'<i class="fa-solid fa-star"></i>'.repeat(starsCount)}
          </div>
          <span class="rating-count">(${product.rating} · ${product.reviewCount || 10})</span>
        </div>
        <div class="product-bottom-row">
          <div class="product-price-wrap">
            <span class="current-price">${ShopNovaApp.formatCurrency(product.price)}</span>
            ${product.originalPrice ? `<span class="original-price">${ShopNovaApp.formatCurrency(product.originalPrice)}</span>` : ''}
          </div>
          <button class="btn-add-cart" data-cart-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-bag-shopping"></i> <span>Add</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachCardEventListeners(container) {
  // Wishlist buttons
  container.querySelectorAll("[data-wishlist-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-wishlist-id");
      const isNowWished = ShopNovaStorage.toggleWishlist(id);
      btn.classList.toggle("active", isNowWished);
      const icon = btn.querySelector("i");
      if (icon) {
        icon.className = `fa-${isNowWished ? 'solid' : 'regular'} fa-heart`;
      }
    });
  });

  // Add to cart buttons
  container.querySelectorAll("[data-cart-id]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-cart-id");
      ShopNovaStorage.addToCart(id, 1);
    });
  });
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

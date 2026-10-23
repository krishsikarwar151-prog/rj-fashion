/**
 * ShopNova - Wishlist Module
 * Handles displaying wishlist items, removing from wishlist,
 * moving items to cart, moving all to cart, and empty state.
 */

document.addEventListener("DOMContentLoaded", () => {
  initWishlistPage();
});

function initWishlistPage() {
  const wishlistGrid = document.getElementById("wishlistProductsGrid");
  const emptyWishlistState = document.getElementById("emptyWishlistState");
  const wishlistActionsBar = document.getElementById("wishlistActionsBar");
  if (!wishlistGrid) return;

  function renderWishlist() {
    const list = ShopNovaStorage.getWishlist();

    if (list.length === 0) {
      if (wishlistGrid) wishlistGrid.innerHTML = "";
      if (wishlistActionsBar) wishlistActionsBar.style.display = "none";
      if (emptyWishlistState) emptyWishlistState.style.display = "block";
      return;
    }

    if (emptyWishlistState) emptyWishlistState.style.display = "none";
    if (wishlistActionsBar) wishlistActionsBar.style.display = "flex";

    // Normalize items to full product objects
    const items = list.map(item => {
      if (typeof item === "string") {
        return ShopNovaStorage.getProductById(item);
      }
      return item;
    }).filter(Boolean);

    wishlistGrid.innerHTML = items.map((product, index) => `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-media">
          <a href="product-details.html?id=${product.id}">
            <img src="${product.image}" alt="${product.name}" class="product-img">
          </a>
          <div class="product-actions-top">
            <button class="btn-action-icon active btn-remove-wishlist" data-product-id="${product.id}" title="Remove from wishlist" aria-label="Remove from Wishlist">
              <i class="fa-solid fa-trash-can" style="color: var(--danger);"></i>
            </button>
          </div>
        </div>
        <div class="product-content">
          <div class="product-category-row">
            <span class="product-category">${product.category}</span>
            <span class="product-stock-status ${product.stock <= 5 ? (product.stock === 0 ? 'out' : 'low') : ''}">
              <i class="fa-solid ${product.stock === 0 ? 'fa-circle-xmark' : 'fa-circle-check'}"></i>
              ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
          <h4 class="product-title">
            <a href="product-details.html?id=${product.id}">${product.name}</a>
          </h4>
          <div class="product-bottom-row" style="margin-top: 1rem;">
            <div class="product-price-wrap">
              <span class="current-price">${ShopNovaApp.formatCurrency(product.price)}</span>
            </div>
            <button class="btn btn-primary btn-sm btn-move-cart" data-product-id="${product.id}" ${product.stock <= 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-bag-shopping"></i> Move to Cart
            </button>
          </div>
        </div>
      </div>
    `).join("");

    // Attach button listeners
    wishlistGrid.querySelectorAll(".btn-remove-wishlist").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-product-id");
        ShopNovaStorage.toggleWishlist(id);
        renderWishlist();
      });
    });

    wishlistGrid.querySelectorAll(".btn-move-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute("data-product-id");
        const added = ShopNovaStorage.addToCart(id, 1);
        if (added) {
          ShopNovaStorage.toggleWishlist(id);
          renderWishlist();
        }
      });
    });
  }

  // Move All to Cart Action
  const moveAllBtn = document.getElementById("moveAllWishlistToCartBtn");
  if (moveAllBtn) {
    moveAllBtn.addEventListener("click", () => {
      const list = ShopNovaStorage.getWishlist();
      if (list.length === 0) return;

      let movedCount = 0;
      list.forEach(item => {
        const id = typeof item === "string" ? item : item.id;
        const p = ShopNovaStorage.getProductById(id);
        if (p && p.stock > 0) {
          ShopNovaStorage.addToCart(id, 1);
          movedCount++;
        }
      });

      ShopNovaStorage.saveWishlist([]);
      ShopNovaToast.show(`Moved ${movedCount} items to your shopping cart!`, "success");
      renderWishlist();
    });
  }

  // Clear Wishlist Action
  const clearWishlistBtn = document.getElementById("clearWishlistBtn");
  if (clearWishlistBtn) {
    clearWishlistBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to clear your wishlist?")) {
        ShopNovaStorage.saveWishlist([]);
        ShopNovaToast.show("Wishlist cleared.", "info");
        renderWishlist();
      }
    });
  }

  renderWishlist();
}

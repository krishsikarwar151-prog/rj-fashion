/**
 * ShopNova - Shopping Cart Module
 * Handles cart table rendering, quantity controls bounded by stock,
 * item removal, subtotal / shipping / tax calculations, coupon applications,
 * and empty state handling.
 */

document.addEventListener("DOMContentLoaded", () => {
  initCartPage();
});

function initCartPage() {
  const cartTableBody = document.getElementById("cartItemsTbody");
  const cartLayout = document.getElementById("cartLayoutWrap");
  const emptyCartState = document.getElementById("emptyCartState");
  if (!cartLayout) return;

  function renderCart() {
    const cart = ShopNovaStorage.getCart();

    if (cart.length === 0) {
      if (cartLayout) cartLayout.style.display = "none";
      if (emptyCartState) emptyCartState.style.display = "block";
      return;
    }

    if (cartLayout) cartLayout.style.display = "grid";
    if (emptyCartState) emptyCartState.style.display = "none";

    let subtotal = 0;

    cartTableBody.innerHTML = cart.map((item, index) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      return `
        <tr data-cart-index="${index}">
          <td>
            <div class="cart-item-desc">
              <img src="${item.image}" alt="${item.name}" class="cart-item-img">
              <div>
                <a href="product-details.html?id=${item.id}" class="cart-item-name">${item.name}</a>
                <div class="cart-item-meta">
                  ${item.color ? `<span>Color: <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${item.color};vertical-align:middle;border:1px solid #ccc;"></span></span> · ` : ''}
                  ${item.size ? `<span>Size: ${item.size}</span> · ` : ''}
                  <span>${item.category || 'Product'}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="font-semibold">${ShopNovaApp.formatCurrency(item.price)}</td>
          <td>
            <div class="quantity-stepper" style="height: 38px; width: 110px;">
              <button class="qty-btn btn-cart-minus" data-index="${index}"><i class="fa-solid fa-minus" style="font-size:0.75rem;"></i></button>
              <input type="text" class="qty-input" value="${item.quantity}" readonly style="width: 36px; font-size: 0.9rem;">
              <button class="qty-btn btn-cart-plus" data-index="${index}"><i class="fa-solid fa-plus" style="font-size:0.75rem;"></i></button>
            </div>
          </td>
          <td class="font-bold text-primary">${ShopNovaApp.formatCurrency(lineTotal)}</td>
          <td style="text-align: right;">
            <button class="btn-action-icon btn-cart-remove" data-index="${index}" title="Remove item" aria-label="Remove item">
              <i class="fa-regular fa-trash-can" style="color: var(--danger);"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Calculate totals
    updateCartSummary(subtotal);

    // Attach row events
    cartTableBody.querySelectorAll(".btn-cart-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-index"));
        const currentQty = cart[idx].quantity;
        ShopNovaStorage.updateCartQty(idx, currentQty - 1);
        renderCart();
      });
    });

    cartTableBody.querySelectorAll(".btn-cart-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-index"));
        const currentQty = cart[idx].quantity;
        ShopNovaStorage.updateCartQty(idx, currentQty + 1);
        renderCart();
      });
    });

    cartTableBody.querySelectorAll(".btn-cart-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-index"));
        ShopNovaStorage.removeFromCart(idx);
        renderCart();
      });
    });
  }

  function updateCartSummary(subtotal) {
    const subtotalEl = document.getElementById("cartSubtotalDisplay");
    const shippingEl = document.getElementById("cartShippingDisplay");
    const taxEl = document.getElementById("cartTaxDisplay");
    const discountEl = document.getElementById("cartDiscountDisplay");
    const discountRow = document.getElementById("cartDiscountRow");
    const totalEl = document.getElementById("cartTotalDisplay");
    const appliedCouponContainer = document.getElementById("appliedCouponContainer");

    const appliedCoupon = ShopNovaStorage.getAppliedCoupon();

    let discountAmount = 0;
    let shippingCost = subtotal > 50 ? 0 : 10;

    if (appliedCoupon) {
      if (appliedCoupon.type === "percent") {
        discountAmount = (subtotal * appliedCoupon.discount) / 100;
      } else if (appliedCoupon.type === "fixed") {
        discountAmount = Math.min(subtotal, appliedCoupon.discount);
      } else if (appliedCoupon.type === "shipping") {
        shippingCost = 0;
      }

      if (appliedCouponContainer) {
        appliedCouponContainer.innerHTML = `
          <div class="applied-coupon-tag">
            <span><i class="fa-solid fa-tag"></i> <strong>${appliedCoupon.code}</strong> (${appliedCoupon.desc})</span>
            <button type="button" id="removeCouponBtn" style="color: var(--danger); font-size: 0.9rem;" title="Remove Coupon">&times;</button>
          </div>
        `;

        document.getElementById("removeCouponBtn").addEventListener("click", () => {
          ShopNovaStorage.removeAppliedCoupon();
          ShopNovaToast.show("Coupon removed.", "info");
          renderCart();
        });
      }
    } else {
      if (appliedCouponContainer) appliedCouponContainer.innerHTML = "";
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = taxableAmount * 0.08; // 8% sales tax
    const total = taxableAmount + shippingCost + tax;

    if (subtotalEl) subtotalEl.textContent = ShopNovaApp.formatCurrency(subtotal);
    if (shippingEl) shippingEl.textContent = shippingCost === 0 ? "FREE" : ShopNovaApp.formatCurrency(shippingCost);
    if (taxEl) taxEl.textContent = ShopNovaApp.formatCurrency(tax);

    if (discountRow) {
      if (discountAmount > 0) {
        discountRow.style.display = "flex";
        if (discountEl) discountEl.textContent = `-${ShopNovaApp.formatCurrency(discountAmount)}`;
      } else {
        discountRow.style.display = "none";
      }
    }

    if (totalEl) totalEl.textContent = ShopNovaApp.formatCurrency(total);
  }

  // Coupon Code Form Submit
  const couponForm = document.getElementById("cartCouponForm");
  if (couponForm) {
    couponForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const codeInput = document.getElementById("cartCouponInput");
      const code = codeInput ? codeInput.value.trim() : "";

      if (!code) {
        ShopNovaToast.show("Please enter a coupon code.", "warning");
        return;
      }

      const res = ShopNovaStorage.applyCoupon(code);
      if (res.success) {
        ShopNovaToast.show(`Coupon "${res.coupon.code}" applied successfully!`, "success");
        if (codeInput) codeInput.value = "";
        renderCart();
      } else {
        ShopNovaToast.show(res.message || "Invalid coupon code.", "error");
      }
    });
  }

  // Clear Cart Action
  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      if (confirm("Are you sure you want to empty your shopping cart?")) {
        ShopNovaStorage.clearCart();
        ShopNovaStorage.removeAppliedCoupon();
        ShopNovaToast.show("Shopping cart cleared.", "info");
        renderCart();
      }
    });
  }

  // Initial cart render
  renderCart();
}

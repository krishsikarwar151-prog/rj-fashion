/**
 * ShopNova - Checkout Module
 * Handles customer shipping form validation, order summary breakdown,
 * payment method selection (Card, UPI, COD), coupon codes, order creation,
 * stock deduction, and order confirmation receipt generation.
 */

document.addEventListener("DOMContentLoaded", () => {
  initCheckoutPage();
});

function initCheckoutPage() {
  const checkoutForm = document.getElementById("checkoutForm");
  const checkoutSummaryItems = document.getElementById("checkoutSummaryItems");
  if (!checkoutForm || !checkoutSummaryItems) return;

  const cart = ShopNovaStorage.getCart();
  if (cart.length === 0) {
    ShopNovaToast.show("Your cart is empty. Please add items before checking out.", "warning");
    setTimeout(() => {
      window.location.href = "products.html";
    }, 1000);
    return;
  }

  // Pre-fill user data if logged in
  const currentUser = ShopNovaStorage.getCurrentUser();
  if (currentUser) {
    const nameParts = (currentUser.name || "").split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const fNameInput = document.getElementById("checkoutFirstName");
    const lNameInput = document.getElementById("checkoutLastName");
    const emailInput = document.getElementById("checkoutEmail");
    const phoneInput = document.getElementById("checkoutPhone");
    const addressInput = document.getElementById("checkoutAddress");

    if (fNameInput) fNameInput.value = firstName;
    if (lNameInput) lNameInput.value = lastName;
    if (emailInput) emailInput.value = currentUser.email || "";
    if (phoneInput && currentUser.phone && currentUser.phone !== "Not provided") {
      phoneInput.value = currentUser.phone;
    }
    if (addressInput && currentUser.address && currentUser.address !== "Not set yet") {
      addressInput.value = currentUser.address;
    }
  }

  // Render Order Items Preview & Totals
  function renderOrderSummary() {
    let subtotal = 0;

    checkoutSummaryItems.innerHTML = cart.map(item => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      return `
        <div class="order-item-row">
          <img src="${item.image}" alt="${item.name}" class="order-item-img">
          <div class="order-item-info">
            <div class="order-item-title">${item.name}</div>
            <div class="order-item-sub">Qty: ${item.quantity} · ${ShopNovaApp.formatCurrency(item.price)} each</div>
          </div>
          <div class="font-bold">${ShopNovaApp.formatCurrency(lineTotal)}</div>
        </div>
      `;
    }).join("");

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
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const tax = taxableAmount * 0.08;
    const finalTotal = taxableAmount + shippingCost + tax;

    const subtotalEl = document.getElementById("checkoutSubtotal");
    const shippingEl = document.getElementById("checkoutShipping");
    const taxEl = document.getElementById("checkoutTax");
    const discountRow = document.getElementById("checkoutDiscountRow");
    const discountEl = document.getElementById("checkoutDiscount");
    const totalEl = document.getElementById("checkoutTotal");

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

    if (totalEl) totalEl.textContent = ShopNovaApp.formatCurrency(finalTotal);

    return { subtotal, discountAmount, shippingCost, tax, finalTotal };
  }

  const totals = renderOrderSummary();

  // Payment Method Tabs
  const paymentCards = document.querySelectorAll(".payment-method-card");
  const cardDetailsSection = document.getElementById("cardDetailsSection");
  const upiDetailsSection = document.getElementById("upiDetailsSection");
  const codDetailsSection = document.getElementById("codDetailsSection");
  let selectedPaymentMethod = "card";

  paymentCards.forEach(card => {
    card.addEventListener("click", () => {
      paymentCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      selectedPaymentMethod = card.getAttribute("data-method");

      if (cardDetailsSection) cardDetailsSection.style.display = selectedPaymentMethod === "card" ? "block" : "none";
      if (upiDetailsSection) upiDetailsSection.style.display = selectedPaymentMethod === "upi" ? "block" : "none";
      if (codDetailsSection) codDetailsSection.style.display = selectedPaymentMethod === "cod" ? "block" : "none";
    });
  });

  // Card Number Auto-formatting helper
  const cardNumberInput = document.getElementById("cardNumber");
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 16);
      val = val.match(/.{1,4}/g)?.join(" ") || val;
      e.target.value = val;
    });
  }

  // Card Expiry Auto-formatting helper
  const cardExpiryInput = document.getElementById("cardExpiry");
  if (cardExpiryInput) {
    cardExpiryInput.addEventListener("input", (e) => {
      let val = e.target.value.replace(/\D/g, "").substring(0, 4);
      if (val.length >= 2) {
        val = val.substring(0, 2) + "/" + val.substring(2);
      }
      e.target.value = val;
    });
  }

  // Checkout Form Submission
  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Required Field Validation
    const fName = document.getElementById("checkoutFirstName").value.trim();
    const lName = document.getElementById("checkoutLastName").value.trim();
    const email = document.getElementById("checkoutEmail").value.trim();
    const phone = document.getElementById("checkoutPhone").value.trim();
    const address = document.getElementById("checkoutAddress").value.trim();
    const city = document.getElementById("checkoutCity").value.trim();
    const state = document.getElementById("checkoutState").value.trim();
    const zip = document.getElementById("checkoutZip").value.trim();

    if (!fName || !lName || !email || !phone || !address || !city || !state || !zip) {
      ShopNovaToast.show("Please fill in all required shipping fields.", "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      ShopNovaToast.show("Please provide a valid email address.", "error");
      return;
    }

    // Payment validation if card
    let paymentDesc = "Credit / Debit Card";
    if (selectedPaymentMethod === "card") {
      const cardNum = (document.getElementById("cardNumber")?.value || "").replace(/\s/g, "");
      const cardExp = document.getElementById("cardExpiry")?.value || "";
      const cardCvv = document.getElementById("cardCvv")?.value || "";

      if (cardNum.length < 15 || !cardExp.includes("/") || cardCvv.length < 3) {
        ShopNovaToast.show("Please enter complete card details (16 digits, MM/YY, CVV).", "warning");
        return;
      }
      paymentDesc = `Card ending in ${cardNum.slice(-4)}`;
    } else if (selectedPaymentMethod === "upi") {
      paymentDesc = "UPI / QR Payment";
    } else if (selectedPaymentMethod === "cod") {
      paymentDesc = "Cash on Delivery";
    }

    // Disable button to prevent double-submit and show processing loader
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Order...`;
    }

    setTimeout(() => {
      // Generate Order
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderId = `SN-2026-${randomNum}`;
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      const newOrder = {
        id: orderId,
        date: dateStr,
        status: "Processing",
        customerName: `${fName} ${lName}`,
        email: email,
        phone: phone,
        address: `${address}, ${city}, ${state} ${zip}`,
        items: [...cart],
        subtotal: totals.subtotal,
        discount: totals.discountAmount,
        shipping: totals.shippingCost,
        tax: totals.tax,
        total: totals.finalTotal,
        paymentMethod: paymentDesc
      };

      // Deduct stock from inventory in LocalStorage
      const products = ShopNovaStorage.getProducts();
      cart.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if (p) {
          p.stock = Math.max(0, p.stock - item.quantity);
        }
      });
      ShopNovaStorage.saveProducts(products);

      // Save Order & Clear Cart
      ShopNovaStorage.addOrder(newOrder);
      ShopNovaStorage.clearCart();
      ShopNovaStorage.removeAppliedCoupon();

      // Cloud Firestore real-time sync for order & inventory
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        window.RJFirebase.saveOrder(newOrder).catch(err => console.warn("Firestore saveOrder:", err));
        cart.forEach(item => {
          const updatedP = products.find(prod => prod.id === item.id);
          if (updatedP) {
            window.RJFirebase.updateProduct(item.id, { stock: updatedP.stock }).catch(() => {});
          }
        });
      }

      // Show Order Confirmation Receipt Modal
      showOrderSuccessModal(newOrder);
    }, 1200);
  });
}

function showOrderSuccessModal(order) {
  let modal = document.getElementById("orderConfirmedModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "orderConfirmedModal";
    modal.className = "modal-backdrop active";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 640px;">
      <div class="order-confirmed-box">
        <div class="confirm-check-icon">
          <i class="fa-solid fa-check"></i>
        </div>
        <h2 style="font-size: 1.85rem; margin-bottom: 0.5rem;">Thank You For Your Order!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
          Your order <strong>#${order.id}</strong> has been placed successfully. A confirmation receipt has been sent to <strong>${order.email}</strong>.
        </p>

        <div style="background: var(--bg-alt); padding: 1.25rem; border-radius: var(--radius-md); text-align: left; margin-bottom: 1.5rem; font-size: 0.9rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-muted);">Order Number:</span>
            <strong>#${order.id}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-muted);">Payment:</span>
            <span>${order.paymentMethod}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="color: var(--text-muted);">Shipping To:</span>
            <span>${order.address}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border); padding-top: 0.5rem; margin-top: 0.5rem;">
            <span class="font-bold">Total Amount Paid:</span>
            <strong class="text-primary font-bold" style="font-size: 1.1rem;">${ShopNovaApp.formatCurrency(order.total)}</strong>
          </div>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <a href="orders.html" class="btn btn-primary">
            <i class="fa-solid fa-box-open"></i> View All Orders
          </a>
          <a href="products.html" class="btn btn-outline">
            Continue Shopping
          </a>
          <button type="button" class="btn btn-secondary" onclick="window.print()">
            <i class="fa-solid fa-print"></i> Print Receipt
          </button>
        </div>
      </div>
    </div>
  `;
  modal.classList.add("active");
}

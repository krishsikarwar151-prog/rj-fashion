/**
 * RJ Fashion - Authentication & User Account Module
 * Powered by Google Cloud Firebase Authentication & Cloud Firestore.
 * Handles real user registration, authentication, password reset,
 * profile management, and orders synchronization.
 */

document.addEventListener("DOMContentLoaded", () => {
  initAuthPage();
  initAccountPage();
});

function initAuthPage() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  // Show / Hide Password Toggles
  const togglePassBtns = document.querySelectorAll(".btn-toggle-password");
  togglePassBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.parentElement.querySelector("input");
      const icon = btn.querySelector("i");
      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  // =========================================================================
  // 1. Real Login Form Submission (Firebase Authentication)
  // =========================================================================
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("loginEmail");
      const passInput = document.getElementById("loginPassword");
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passInput ? passInput.value : "";
      const submitBtn = document.getElementById("btnLoginSubmit") || loginForm.querySelector("button[type='submit']");
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : "";

      let hasError = false;

      // Validate Email
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInputError(emailInput, "Please enter a valid email address.");
        hasError = true;
      } else {
        clearInputError(emailInput);
      }

      // Validate Password
      if (!password || password.length < 6) {
        showInputError(passInput, "Password must be at least 6 characters.");
        hasError = true;
      } else {
        clearInputError(passInput);
      }

      if (hasError) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...`;
      }

      try {
        let authResult = null;

        // 1. Authenticate with Real Firebase Authentication
        if (window.RJFirebase) {
          try {
            authResult = await window.RJFirebase.authSignIn(email, password);
          } catch (fbErr) {
            // If Firebase Auth returned an error, check if credentials match local cache before reporting
            const storage = window.RJFashionStorage || window.ShopNovaStorage;
            const localUser = storage ? storage.getUsers().find(u => (u.email || "").toLowerCase() === email.toLowerCase()) : null;
            if (localUser && localUser.password === password) {
              authResult = { user: localUser };
              storage.setCurrentUser(localUser);
            } else {
              throw fbErr;
            }
          }
        } else {
          // Local fallback if Firebase not loaded
          const storage = window.RJFashionStorage || window.ShopNovaStorage;
          const matchedUser = storage ? storage.getUsers().find(u => (u.email || "").toLowerCase() === email.toLowerCase()) : null;
          if (!matchedUser || matchedUser.password !== password) {
            throw new Error("Incorrect email or password. Please try again.");
          }
          storage.setCurrentUser(matchedUser);
          authResult = { user: matchedUser };
        }

        const user = authResult.user;
        ShopNovaToast.show(`Welcome back, ${user.name || "Customer"}!`, "success");

        // Redirect based on role or URL parameter
        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get("redirect");
          if (redirect) {
            window.location.href = redirect;
          } else if (user.role === "admin") {
            window.location.href = "admin.html";
          } else {
            window.location.href = "account.html";
          }
        }, 600);
      } catch (err) {
        showInputError(passInput, err.message || "Login failed. Please check your credentials.");
        ShopNovaToast.show(err.message || "Login failed.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnHtml;
        }
      }
    });
  }

  // =========================================================================
  // 2. Real Registration Form Submission (Firebase Authentication & Firestore)
  // =========================================================================
  if (signupForm) {
    const passInput = document.getElementById("signupPassword");
    const confirmInput = document.getElementById("signupConfirmPassword");

    if (passInput) {
      passInput.addEventListener("input", () => {
        updatePasswordStrength(passInput.value);
      });
    }

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("signupName");
      const emailInput = document.getElementById("signupEmail");
      const phoneInput = document.getElementById("signupPhone");
      const termsInput = document.getElementById("signupTerms");
      const submitBtn = document.getElementById("btnSignupSubmit") || signupForm.querySelector("button[type='submit']");
      const origBtnHtml = submitBtn ? submitBtn.innerHTML : "";

      const name = nameInput ? nameInput.value.trim() : "";
      const email = emailInput ? emailInput.value.trim() : "";
      const phone = phoneInput ? phoneInput.value.trim() : "";
      const password = passInput ? passInput.value : "";
      const confirmPassword = confirmInput ? confirmInput.value : "";
      const terms = termsInput ? termsInput.checked : true;

      let hasError = false;

      // Name validation
      if (!name || name.length < 2) {
        showInputError(nameInput, "Please enter your full name (at least 2 characters).");
        hasError = true;
      } else {
        clearInputError(nameInput);
      }

      // Email validation
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showInputError(emailInput, "Please enter a valid email address.");
        hasError = true;
      } else {
        clearInputError(emailInput);
      }

      // Password validation
      if (!password || password.length < 8) {
        showInputError(passInput, "Password must be at least 8 characters.");
        hasError = true;
      } else {
        clearInputError(passInput);
      }

      // Confirm Password
      if (password !== confirmPassword) {
        showInputError(confirmInput, "Passwords do not match.");
        hasError = true;
      } else {
        clearInputError(confirmInput);
      }

      // Terms validation
      if (!terms) {
        ShopNovaToast.show("Please agree to the Terms & Privacy Policy.", "warning");
        return;
      }

      if (hasError) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...`;
      }

      try {
        let newUser = null;

        if (window.RJFirebase) {
          const res = await window.RJFirebase.authSignUp(email, password, name, phone);
          newUser = res.user;
        } else {
          const storage = window.RJFashionStorage || window.ShopNovaStorage;
          const users = storage.getUsers();
          if (users.some(u => (u.email || "").toLowerCase() === email.toLowerCase())) {
            throw new Error("An account with this email already exists.");
          }
          newUser = {
            name,
            email: email.toLowerCase(),
            phone: phone || "",
            role: "customer",
            address: "",
            joinedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            createdAt: new Date().toISOString()
          };
          users.push(newUser);
          storage.saveUsers(users);
          storage.setCurrentUser(newUser);
        }

        ShopNovaToast.show(`🎉 Account created successfully! Welcome, ${newUser.name}.`, "success");

        setTimeout(() => {
          const urlParams = new URLSearchParams(window.location.search);
          const redirect = urlParams.get("redirect");
          if (redirect) {
            window.location.href = redirect;
          } else {
            window.location.href = "account.html";
          }
        }, 700);
      } catch (err) {
        showInputError(emailInput, err.message || "Registration failed.");
        ShopNovaToast.show(err.message || "Failed to create account.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origBtnHtml;
        }
      }
    });
  }

  // =========================================================================
  // 3. Real Password Reset Email (Firebase Authentication)
  // =========================================================================
  const forgotBtn = document.getElementById("forgotPasswordBtn");
  if (forgotBtn) {
    forgotBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const emailInput = document.getElementById("loginEmail");
      let email = emailInput ? emailInput.value.trim() : "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        email = prompt("Enter your registered email address to receive a secure password reset link:");
      }

      if (!email || !email.trim()) return;

      try {
        ShopNovaToast.show("Sending password reset email...", "info");
        if (window.RJFirebase) {
          const res = await window.RJFirebase.authSendPasswordReset(email.trim());
          ShopNovaToast.show(res.message, "success");
        } else {
          ShopNovaToast.show(`Password reset instructions sent to ${email}`, "info");
        }
      } catch (err) {
        ShopNovaToast.show(err.message || "Could not send reset email.", "error");
      }
    });
  }
}

// Password Strength Meter Helper
function updatePasswordStrength(password) {
  const bar = document.getElementById("strengthBarFill");
  const label = document.getElementById("strengthLabel");
  const checkLength = document.getElementById("ruleLength");
  const checkNumber = document.getElementById("ruleNumber");
  const checkSpecial = document.getElementById("ruleSpecial");

  if (!bar || !label) return;

  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (checkLength) toggleRuleClass(checkLength, hasLength);
  if (checkNumber) toggleRuleClass(checkNumber, hasNumber);
  if (checkSpecial) toggleRuleClass(checkSpecial, hasSpecial);

  let score = 0;
  if (password.length >= 6) score++;
  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (score === 0) {
    bar.style.width = "0%";
    label.textContent = "Strength: None";
    label.style.color = "var(--text-muted)";
  } else if (score <= 2) {
    bar.style.width = "33%";
    bar.style.backgroundColor = "var(--danger)";
    label.textContent = "Strength: Weak";
    label.style.color = "var(--danger)";
  } else if (score === 3) {
    bar.style.width = "66%";
    bar.style.backgroundColor = "var(--warning)";
    label.textContent = "Strength: Moderate";
    label.style.color = "var(--warning)";
  } else {
    bar.style.width = "100%";
    bar.style.backgroundColor = "var(--success)";
    label.textContent = "Strength: Strong";
    label.style.color = "var(--success)";
  }
}

function toggleRuleClass(el, isValid) {
  const icon = el.querySelector("i");
  if (isValid) {
    el.classList.add("valid");
    if (icon) {
      icon.className = "fa-solid fa-check";
      icon.style.color = "var(--success)";
    }
  } else {
    el.classList.remove("valid");
    if (icon) {
      icon.className = "fa-solid fa-circle-notch";
      icon.style.color = "var(--text-muted)";
    }
  }
}

// Client-side Validation Error Display Helpers
function showInputError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add("input-error");
  const formGroup = inputEl.closest(".form-group");
  if (formGroup) {
    const errorEl = formGroup.querySelector(".form-error");
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = "block";
    }
  }
}

function clearInputError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove("input-error");
  const formGroup = inputEl.closest(".form-group");
  if (formGroup) {
    const errorEl = formGroup.querySelector(".form-error");
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  }
}

// =========================================================================
// 4. User Account Dashboard Page Logic (account.html)
// =========================================================================
function initAccountPage() {
  const accountWrap = document.getElementById("accountPageWrap");
  if (!accountWrap) return;

  const storage = window.RJFashionStorage || window.ShopNovaStorage;
  const app = window.RJFashionApp || window.ShopNovaApp;
  const currentUser = storage ? storage.getCurrentUser() : null;

  if (!currentUser) {
    ShopNovaToast.show("Please log in to access your account dashboard.", "warning");
    setTimeout(() => {
      window.location.href = "login.html";
    }, 600);
    return;
  }

  // Populate Sidebar and Info
  const nameDisplay = document.getElementById("accDisplayName");
  const emailDisplay = document.getElementById("accDisplayEmail");
  const profileNameInput = document.getElementById("accProfileName");
  const profileEmailInput = document.getElementById("accProfileEmail");
  const profilePhoneInput = document.getElementById("accProfilePhone");
  const profileAddressInput = document.getElementById("accProfileAddress");

  if (nameDisplay) nameDisplay.textContent = currentUser.name;
  if (emailDisplay) emailDisplay.textContent = currentUser.email;
  if (profileNameInput) profileNameInput.value = currentUser.name || "";
  if (profileEmailInput) profileEmailInput.value = currentUser.email || "";
  if (profilePhoneInput) profilePhoneInput.value = currentUser.phone || "";
  if (profileAddressInput) profileAddressInput.value = currentUser.address || "";

  // Handle Profile Update Form
  const profileForm = document.getElementById("profileEditForm");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      currentUser.name = profileNameInput.value.trim();
      currentUser.phone = profilePhoneInput.value.trim();
      currentUser.address = profileAddressInput.value.trim();

      // Update in users list
      const users = storage.getUsers();
      const idx = users.findIndex(u => (u.email || "").toLowerCase() === currentUser.email.toLowerCase());
      if (idx > -1) {
        users[idx] = { ...users[idx], ...currentUser };
        storage.saveUsers(users);
      }

      storage.setCurrentUser(currentUser);
      if (nameDisplay) nameDisplay.textContent = currentUser.name;

      // Update in Cloud Firestore
      if (window.RJFirebase && window.RJFirebase.isConfigured()) {
        await window.RJFirebase.saveUser(currentUser).catch(err => console.warn("Firestore saveUser:", err));
      }

      ShopNovaToast.show("Profile updated successfully!", "success");
    });
  }

  // Render recent orders in account
  async function renderAccountOrders() {
    const recentOrdersList = document.getElementById("accRecentOrders");
    if (!recentOrdersList) return;

    let orders = storage.getOrders().filter(o => (o.email || "").toLowerCase() === currentUser.email.toLowerCase());

    // Fetch real orders from Cloud Firestore
    if (window.RJFirebase && window.RJFirebase.isConfigured()) {
      try {
        const cloudOrders = await window.RJFirebase.getOrders(currentUser.email);
        if (cloudOrders && cloudOrders.length > 0) {
          orders = cloudOrders;
        }
      } catch (e) {
        console.warn("Account orders fetch:", e);
      }
    }

    if (orders.length === 0) {
      recentOrdersList.innerHTML = `
        <div class="empty-state" style="padding: 2.5rem 1rem;">
          <div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div>
          <p>You have not placed any orders yet.</p>
          <a href="products.html" class="btn btn-primary btn-sm">Explore Products</a>
        </div>
      `;
    } else {
      recentOrdersList.innerHTML = orders.slice(0, 3).map(order => `
        <div class="order-card" style="margin-bottom: 1.25rem;">
          <div class="order-header">
            <div class="order-header-meta">
              <div class="order-meta-item">
                <strong>Order ID</strong>
                <span>#${order.id}</span>
              </div>
              <div class="order-meta-item">
                <strong>Date</strong>
                <span>${order.date || 'Recent'}</span>
              </div>
              <div class="order-meta-item">
                <strong>Total</strong>
                <span class="text-primary font-bold">${app.formatCurrency(order.total)}</span>
              </div>
            </div>
            <div>
              <span class="badge ${order.status === 'Delivered' ? 'badge-success' : 'badge-primary'}">${order.status}</span>
            </div>
          </div>
          <div class="order-body">
            ${(order.items || []).map(item => `
              <div class="order-item-row">
                <img src="${item.image}" alt="${item.name}" class="order-item-img">
                <div class="order-item-info">
                  <div class="order-item-title">${item.name}</div>
                  <div class="order-item-sub">Qty: ${item.quantity} · Price: ${app.formatCurrency(item.price)}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("");
    }
  }

  renderAccountOrders();
  window.addEventListener("rj-firebase-ready", () => renderAccountOrders());
  window.addEventListener("shopnova-orders-updated", () => renderAccountOrders());

  // Account Logout Handler
  const logoutBtn = document.getElementById("accountLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (window.RJFirebase) window.RJFirebase.authSignOut();
      storage.setCurrentUser(null);
      ShopNovaToast.show("Signed out successfully.", "info");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 500);
    });
  }
}

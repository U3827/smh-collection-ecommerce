document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================================================
  // SMH COLLECTION — CHECKOUT
  // =========================================================

  let currentUser = null;
  let currentProfile = null;
  let currentCart = null;
  let checkoutItems = [];
  let isSubmitting = false;

  // ---------------------------------------------------------
  // DOM HELPERS
  // ---------------------------------------------------------

  const $ = (id) => document.getElementById(id);

  const checkoutForm = $("checkoutForm");
  const placeOrderButton = $("placeOrderButton");

  const checkoutLayout = $("checkoutLayout");
  const emptyCheckout = $("emptyCheckout");

  const checkoutLoading = $("checkoutLoading");
  const checkoutMessage = $("checkoutMessage");

  const checkoutError = $("checkoutError");
  const checkoutErrorMessage = $("checkoutErrorMessage");
  const retryButton = $("retryButton");

  const checkoutItemsContainer = $("checkoutItems");

  const subtotalElement = $("subtotal");
  const totalElement = $("totalAmount");

  const shippingNameInput = $("shippingName");
  const shippingPhoneInput = $("shippingPhone");
  const shippingAddressInput = $("shippingAddress");
  const shippingCityInput = $("shippingCity");
  const shippingStateInput = $("shippingState");
  const shippingCountryInput = $("shippingCountry");
  const orderNotesInput = $("orderNotes");

  // ---------------------------------------------------------
  // MONEY
  // ---------------------------------------------------------

  function formatMoney(amount) {
    const value = Number(amount || 0);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // ---------------------------------------------------------
  // UI HELPERS
  // ---------------------------------------------------------

  function showLoading() {
    if (checkoutLoading) {
      checkoutLoading.hidden = false;
    }

    if (checkoutLayout) {
      checkoutLayout.hidden = true;
    }

    if (emptyCheckout) {
      emptyCheckout.hidden = true;
    }

    if (checkoutError) {
      checkoutError.hidden = true;
    }
  }

  function hideLoading() {
    if (checkoutLoading) {
      checkoutLoading.hidden = true;
    }
  }

  function showCheckout() {
    hideLoading();

    if (checkoutLayout) {
      checkoutLayout.hidden = false;
    }

    if (emptyCheckout) {
      emptyCheckout.hidden = true;
    }

    if (checkoutError) {
      checkoutError.hidden = true;
    }
  }

  function showEmptyCheckout() {
    hideLoading();

    if (checkoutLayout) {
      checkoutLayout.hidden = true;
    }

    if (emptyCheckout) {
      emptyCheckout.hidden = false;
    }

    if (checkoutError) {
      checkoutError.hidden = true;
    }
  }

  function showError(message) {
    hideLoading();

    if (checkoutLayout) {
      checkoutLayout.hidden = true;
    }

    if (emptyCheckout) {
      emptyCheckout.hidden = true;
    }

    if (checkoutError) {
      checkoutError.hidden = false;
    }

    if (checkoutErrorMessage) {
      checkoutErrorMessage.textContent =
        message || "Something went wrong. Please try again.";
    }
  }

  function showMessage(message, type = "info") {
    if (!checkoutMessage) {
      return;
    }

    checkoutMessage.textContent = message || "";
    checkoutMessage.hidden = !message;

    checkoutMessage.className = "checkout-message";

    if (message) {
      checkoutMessage.classList.add(`is-${type}`);
    }
  }

  function clearMessage() {
    showMessage("");
  }

  function setSubmittingState(submitting) {
    isSubmitting = submitting;

    if (!placeOrderButton) {
      return;
    }

    placeOrderButton.disabled = submitting;

    if (submitting) {
      placeOrderButton.dataset.originalText =
        placeOrderButton.textContent || "Place Order";

      placeOrderButton.textContent = "Placing Order...";
    } else {
      placeOrderButton.textContent =
        placeOrderButton.dataset.originalText || "Place Order";
    }
  }

  // ---------------------------------------------------------
  // AUTHENTICATION
  // ---------------------------------------------------------

  async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      throw error;
    }

    const session = data?.session;

    if (!session || !session.user) {
      window.location.href = "login.html";
      return null;
    }

    return session.user;
  }

  // ---------------------------------------------------------
  // PROFILE
  // ---------------------------------------------------------

  async function loadProfile() {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        avatar_url,
        is_active
      `)
      .eq("id", currentUser.id)
      .single();

    if (error) {
      throw new Error(
        `Unable to load your profile: ${error.message}`
      );
    }

    if (!data) {
      throw new Error("Your profile could not be found.");
    }

    if (data.is_active === false) {
      await supabaseClient.auth.signOut();

      window.location.href = "login.html";
      return null;
    }

    currentProfile = data;

    if (data.role !== "buyer") {
      if (data.role === "admin") {
        window.location.href = "admin-dashboard.html";
        return null;
      }

      if (data.role === "seller" || data.role === "staff") {
        window.location.href = "seller-dashboard.html";
        return null;
      }

      throw new Error(
        "Your account does not have permission to place buyer orders."
      );
    }

    updateProfileUI();

    return data;
  }

  function updateProfileUI() {
    if (!currentProfile) {
      return;
    }

    const possibleNameElements = [
      "profileName",
      "userName",
      "accountName",
      "headerUserName"
    ];

    possibleNameElements.forEach((id) => {
      const element = $(id);

      if (element) {
        element.textContent =
          currentProfile.full_name ||
          currentProfile.email ||
          "Account";
      }
    });

    const possibleEmailElements = [
      "profileEmail",
      "userEmail",
      "accountEmail"
    ];

    possibleEmailElements.forEach((id) => {
      const element = $(id);

      if (element) {
        element.textContent = currentProfile.email || "";
      }
    });

    const avatarElements = [
      "profileAvatar",
      "userAvatar",
      "accountAvatar"
    ];

    avatarElements.forEach((id) => {
      const element = $(id);

      if (
        element &&
        element.tagName === "IMG" &&
        currentProfile.avatar_url
      ) {
        element.src = currentProfile.avatar_url;
      }
    });
  }

  // ---------------------------------------------------------
  // CART
  // ---------------------------------------------------------

  async function getOrCreateCart() {
    const { data, error } = await supabaseClient
      .from("carts")
      .select("id, buyer_id")
      .eq("buyer_id", currentUser.id)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load your cart: ${error.message}`
      );
    }

    if (data) {
      currentCart = data;
      return data;
    }

    const { data: newCart, error: createError } =
      await supabaseClient
        .from("carts")
        .insert({
          buyer_id: currentUser.id
        })
        .select("id, buyer_id")
        .single();

    if (createError) {
      throw new Error(
        `Unable to create your cart: ${createError.message}`
      );
    }

    currentCart = newCart;

    return newCart;
  }

  async function loadCheckoutItems() {
    if (!currentCart) {
      throw new Error("Your cart could not be loaded.");
    }

    const { data, error } = await supabaseClient
      .from("cart_items")
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        product:products (
          id,
          seller_id,
          name,
          slug,
          description,
          price,
          stock,
          image_url,
          is_active
        )
      `)
      .eq("cart_id", currentCart.id);

    if (error) {
      throw new Error(
        `Unable to load your cart items: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      checkoutItems = [];
      return [];
    }

    const validItems = [];

    for (const item of data) {
      const product = item.product;

      if (!product) {
        continue;
      }

      if (product.is_active !== true) {
        continue;
      }

      const quantity = Number(item.quantity || 0);
      const stock = Number(product.stock || 0);

      if (quantity <= 0) {
        continue;
      }

      if (stock <= 0) {
        continue;
      }

      validItems.push({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity,
        product
      });
    }

    checkoutItems = validItems;

    return validItems;
  }

  // ---------------------------------------------------------
  // RENDER CART ITEMS
  // ---------------------------------------------------------

  function renderCheckoutItems() {
    if (!checkoutItemsContainer) {
      return;
    }

    if (checkoutItems.length === 0) {
      checkoutItemsContainer.innerHTML = "";
      return;
    }

    checkoutItemsContainer.innerHTML = checkoutItems
      .map((item) => {
        const product = item.product;

        const name = escapeHTML(product.name || "Product");
        const image = escapeAttribute(
          product.image_url || "assets/images/placeholder.png"
        );

        const quantity = Number(item.quantity);
        const price = Number(product.price || 0);
        const itemTotal = price * quantity;

        return `
          <div class="checkout-item" data-item-id="${escapeAttribute(
            item.id
          )}">
            <div class="checkout-item-image">
              <img
                src="${image}"
                alt="${escapeAttribute(product.name || "Product")}"
                loading="lazy"
                onerror="this.src='assets/images/placeholder.png'"
              >
            </div>

            <div class="checkout-item-info">
              <h3>${name}</h3>

              <div class="checkout-item-meta">
                <span>Qty: ${quantity}</span>
                <span>${formatMoney(price)} each</span>
              </div>
            </div>

            <div class="checkout-item-total">
              ${formatMoney(itemTotal)}
            </div>
          </div>
        `;
      })
      .join("");
  }

  // ---------------------------------------------------------
  // TOTALS
  // ---------------------------------------------------------

  function calculateSubtotal() {
    return checkoutItems.reduce((total, item) => {
      const price = Number(item.product?.price || 0);
      const quantity = Number(item.quantity || 0);

      return total + price * quantity;
    }, 0);
  }

  function renderTotals() {
    const subtotal = calculateSubtotal();

    // SMH Collection currently uses free delivery.
    const deliveryFee = 0;

    const total = subtotal + deliveryFee;

    if (subtotalElement) {
      subtotalElement.textContent = formatMoney(subtotal);
    }

    const deliveryElement =
      $("deliveryFee") ||
      $("shippingFee") ||
      $("deliveryAmount");

    if (deliveryElement) {
      deliveryElement.textContent = formatMoney(deliveryFee);
    }

    if (totalElement) {
      totalElement.textContent = formatMoney(total);
    }

    return {
      subtotal,
      deliveryFee,
      total
    };
  }

  // ---------------------------------------------------------
  // VALIDATION
  // ---------------------------------------------------------

  function getShippingData() {
    return {
      shipping_name: cleanValue(
        shippingNameInput?.value
      ),

      shipping_phone: cleanValue(
        shippingPhoneInput?.value
      ),

      shipping_address: cleanValue(
        shippingAddressInput?.value
      ),

      shipping_city: cleanValue(
        shippingCityInput?.value
      ),

      shipping_state: cleanValue(
        shippingStateInput?.value
      ),

      shipping_country: cleanValue(
        shippingCountryInput?.value
      ),

      notes: cleanValue(
        orderNotesInput?.value
      )
    };
  }

  function validateShippingData(shipping) {
    if (!shipping.shipping_name) {
      return "Please enter the recipient's full name.";
    }

    if (shipping.shipping_name.length < 2) {
      return "Please enter a valid recipient name.";
    }

    if (!shipping.shipping_phone) {
      return "Please enter your phone number.";
    }

    if (shipping.shipping_phone.length < 7) {
      return "Please enter a valid phone number.";
    }

    if (!shipping.shipping_address) {
      return "Please enter your delivery address.";
    }

    if (shipping.shipping_address.length < 5) {
      return "Please enter a complete delivery address.";
    }

    if (!shipping.shipping_city) {
      return "Please enter your city.";
    }

    if (!shipping.shipping_state) {
      return "Please enter your state.";
    }

    if (!shipping.shipping_country) {
      return "Please enter your country.";
    }

    return null;
  }

  async function validateCartBeforeOrder() {
    if (!currentCart) {
      throw new Error("Your cart is not available.");
    }

    /*
     * We reload the cart immediately before checkout.
     * This prevents submitting stale product prices or stock values.
     */

    const { data, error } = await supabaseClient
      .from("cart_items")
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        product:products (
          id,
          seller_id,
          name,
          slug,
          price,
          stock,
          image_url,
          is_active
        )
      `)
      .eq("cart_id", currentCart.id);

    if (error) {
      throw new Error(
        `Unable to verify your cart: ${error.message}`
      );
    }

    if (!data || data.length === 0) {
      throw new Error(
        "Your cart is empty. Please add a product before checkout."
      );
    }

    const freshItems = [];

    for (const item of data) {
      const product = item.product;

      if (!product) {
        throw new Error(
          "One of the products in your cart is no longer available."
        );
      }

      if (product.is_active !== true) {
        throw new Error(
          `"${product.name}" is no longer available. Please remove it from your cart.`
        );
      }

      const quantity = Number(item.quantity || 0);
      const stock = Number(product.stock || 0);

      if (quantity <= 0) {
        throw new Error(
          `"${product.name}" has an invalid quantity in your cart.`
        );
      }

      if (stock < quantity) {
        throw new Error(
          `"${product.name}" does not have enough stock. Available: ${stock}.`
        );
      }

      freshItems.push({
        id: item.id,
        cart_id: item.cart_id,
        product_id: item.product_id,
        quantity,
        product
      });
    }

    return freshItems;
  }

  // ---------------------------------------------------------
  // ORDER NUMBER
  // ---------------------------------------------------------

  function generateOrderNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();

    const randomPart = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();

    return `SMH-${timestamp}-${randomPart}`;
  }

  // ---------------------------------------------------------
  // CREATE ORDER
  // ---------------------------------------------------------

  async function createOrder(shipping, freshItems) {
    if (!currentUser) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    if (!currentCart) {
      throw new Error("Your cart could not be found.");
    }

    if (!freshItems || freshItems.length === 0) {
      throw new Error("Your cart is empty.");
    }

    /*
     * Recalculate the subtotal from the current database prices.
     * We do not trust totals supplied by the browser.
     */
    const subtotal = freshItems.reduce((sum, item) => {
      const price = Number(item.product.price || 0);
      const quantity = Number(item.quantity || 0);

      return sum + price * quantity;
    }, 0);

    // Free delivery.
    const deliveryFee = 0;
    const totalAmount = subtotal + deliveryFee;

    const orderNumber = generateOrderNumber();

    const orderData = {
      buyer_id: currentUser.id,

      order_number: orderNumber,

      status: "pending",

      payment_method: "cash_on_delivery",

      payment_status: "unpaid",

      subtotal,

      delivery_fee: deliveryFee,

      total_amount: totalAmount,

      shipping_name: shipping.shipping_name,

      shipping_phone: shipping.shipping_phone,

      shipping_address: shipping.shipping_address,

      shipping_city: shipping.shipping_city,

      shipping_state: shipping.shipping_state,

      shipping_country: shipping.shipping_country,

      notes: shipping.notes || null
    };

    // -------------------------------------------------------
    // STEP 1 — CREATE ORDER
    // -------------------------------------------------------

    const {
      data: order,
      error: orderError
    } = await supabaseClient
      .from("orders")
      .insert(orderData)
      .select("id, order_number")
      .single();

    if (orderError) {
      throw new Error(
        `Unable to create your order: ${orderError.message}`
      );
    }

    if (!order) {
      throw new Error(
        "The order was not created successfully."
      );
    }

    // -------------------------------------------------------
    // STEP 2 — CREATE ORDER ITEMS
    // -------------------------------------------------------

    const orderItems = freshItems.map((item) => {
      const product = item.product;

      const price = Number(product.price || 0);
      const quantity = Number(item.quantity || 0);

      return {
        order_id: order.id,

        product_id: product.id,

        seller_id: product.seller_id,

        product_name: product.name,

        product_price: price,

        quantity,

        item_total: price * quantity
      };
    });

    const {
      error: orderItemsError
    } = await supabaseClient
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      /*
       * We do not clear the cart here.
       *
       * This is intentional: if order_items creation fails,
       * the customer should not lose the cart contents.
       *
       * We will later move the complete checkout operation
       * into a database transaction/RPC for production-level
       * atomicity.
       */
      throw new Error(
        `The order was created, but its items could not be saved: ${orderItemsError.message}`
      );
    }

    // -------------------------------------------------------
    // STEP 3 — CLEAR CART
    // -------------------------------------------------------

    const {
      error: clearCartError
    } = await supabaseClient
      .from("cart_items")
      .delete()
      .eq("cart_id", currentCart.id);

    if (clearCartError) {
      /*
       * The order already exists, so we do not report the
       * checkout as completely failed.
       *
       * The customer can still see the order in Orders.
       */
      console.error(
        "Order created but cart could not be cleared:",
        clearCartError
      );
    }

    return order;
  }

   // ---------------------------------------------------------
  // SUBMIT CHECKOUT
  // ---------------------------------------------------------

  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    clearMessage();

    try {
      setSubmittingState(true);

      const shipping = getShippingData();

      const validationError =
        validateShippingData(shipping);

      if (validationError) {
        showMessage(validationError, "error");
        setSubmittingState(false);
        return;
      }

      // Verify authentication again before creating the order.
      const {
        data: sessionData,
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!sessionData?.session?.user) {
        window.location.href = "login.html";
        return;
      }

      currentUser = sessionData.session.user;

      // Verify the latest cart contents, prices and stock.
      const freshItems =
        await validateCartBeforeOrder();

      showMessage(
        "Creating your order...",
        "info"
      );

      const order =
        await createOrder(
          shipping,
          freshItems
        );

      if (!order || !order.id) {
        throw new Error(
          "Your order could not be completed."
        );
      }

      showMessage(
        "Order placed successfully. Redirecting...",
        "success"
      );

      setTimeout(() => {
        const orderParam =
          encodeURIComponent(order.order_number);

        window.location.href =
          `orders.html?order=${orderParam}`;
      }, 700);

    } catch (error) {
      console.error(
        "Checkout error:",
        error
      );

      showMessage(
        error?.message ||
          "Unable to place your order. Please try again.",
        "error"
      );

      setSubmittingState(false);
    }
  }

  // ---------------------------------------------------------
  // RETRY
  // ---------------------------------------------------------

  async function retryCheckout() {
    try {
      clearMessage();

      showLoading();

      await initializeCheckout();

    } catch (error) {
      console.error(
        "Checkout retry error:",
        error
      );

      showError(
        error?.message ||
          "Unable to reload checkout."
      );
    }
  }

  // ---------------------------------------------------------
  // NAVIGATION
  // ---------------------------------------------------------

  function setupNavigation() {
    const cartLinks =
      document.querySelectorAll(
        '[href="cart.html"]'
      );

    cartLinks.forEach((link) => {
      link.addEventListener("click", () => {
        window.location.href =
          "cart.html";
      });
    });

    const ordersLinks =
      document.querySelectorAll(
        '[href="orders.html"]'
      );

    ordersLinks.forEach((link) => {
      link.addEventListener("click", () => {
        window.location.href =
          "orders.html";
      });
    });

    const dashboardLinks =
      document.querySelectorAll(
        '[href="buyer-dashboard.html"]'
      );

    dashboardLinks.forEach((link) => {
      link.addEventListener("click", () => {
        window.location.href =
          "buyer-dashboard.html";
      });
    });
  }

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  function setupLogout() {
    const logoutButtons = [
      $("logoutButton"),
      $("logoutBtn"),
      $("signOutButton"),
      $("signOutBtn")
    ].filter(Boolean);

    logoutButtons.forEach((button) => {
      button.addEventListener(
        "click",
        async (event) => {
          event.preventDefault();

          try {
            button.disabled = true;

            const {
              error
            } = await supabaseClient.auth.signOut();

            if (error) {
              throw error;
            }

            window.location.href =
              "login.html";

          } catch (error) {
            console.error(
              "Logout error:",
              error
            );

            button.disabled = false;

            alert(
              "Unable to log out right now. Please try again."
            );
          }
        }
      );
    });
  }

  // ---------------------------------------------------------
  // CART COUNT
  // ---------------------------------------------------------

  async function updateCartCount() {
    const cartCountElements =
      document.querySelectorAll(
        "#cartCount, .cart-count, [data-cart-count]"
      );

    if (!cartCountElements.length) {
      return;
    }

    if (!currentCart) {
      cartCountElements.forEach(
        (element) => {
          element.textContent = "0";
        }
      );

      return;
    }

    const {
      data,
      error
    } = await supabaseClient
      .from("cart_items")
      .select("quantity")
      .eq("cart_id", currentCart.id);

    if (error) {
      console.warn(
        "Unable to update cart count:",
        error
      );

      return;
    }

    const count = (data || []).reduce(
      (total, item) =>
        total + Number(item.quantity || 0),
      0
    );

    cartCountElements.forEach(
      (element) => {
        element.textContent =
          String(count);
      }
    );
  }

  // ---------------------------------------------------------
  // ESCAPE HTML
  // ---------------------------------------------------------

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHTML(value);
  }

  // ---------------------------------------------------------
  // CLEAN INPUT
  // ---------------------------------------------------------

  function cleanValue(value) {
    return String(value ?? "").trim();
  }

  // ---------------------------------------------------------
  // FORM EVENTS
  // ---------------------------------------------------------

  function setupForm() {
    if (!checkoutForm) {
      console.warn(
        "Checkout form #checkoutForm was not found."
      );

      return;
    }

    checkoutForm.addEventListener(
      "submit",
      handleCheckoutSubmit
    );
  }

  // ---------------------------------------------------------
  // AUTH STATE
  // ---------------------------------------------------------

  function setupAuthListener() {
    supabaseClient.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_OUT") {
          window.location.href =
            "login.html";
        }
      }
    );
  }

  // ---------------------------------------------------------
  // INITIALIZE
  // ---------------------------------------------------------

  async function initializeCheckout() {
    try {
      showLoading();

      clearMessage();

      // -----------------------------------------------
      // AUTH
      // -----------------------------------------------

      currentUser =
        await getCurrentUser();

      if (!currentUser) {
        return;
      }

      // -----------------------------------------------
      // PROFILE / ROLE
      // -----------------------------------------------

      currentProfile =
        await loadProfile();

      if (!currentProfile) {
        return;
      }

      // -----------------------------------------------
      // CART
      // -----------------------------------------------

      await getOrCreateCart();

      // -----------------------------------------------
      // CART ITEMS
      // -----------------------------------------------

      await loadCheckoutItems();

      if (
        !checkoutItems ||
        checkoutItems.length === 0
      ) {
        showEmptyCheckout();

        await updateCartCount();

        return;
      }

      // -----------------------------------------------
      // RENDER
      // -----------------------------------------------

      renderCheckoutItems();

      renderTotals();

      await updateCartCount();

      // -----------------------------------------------
      // SHOW CHECKOUT
      // -----------------------------------------------

      showCheckout();

    } catch (error) {
      console.error(
        "Checkout initialization error:",
        error
      );

      showError(
        error?.message ||
          "Unable to load checkout. Please try again."
      );
    }
  }

  // ---------------------------------------------------------
  // START
  // ---------------------------------------------------------

  setupForm();
  setupNavigation();
  setupLogout();
  setupAuthListener();

  if (retryButton) {
    retryButton.addEventListener(
      "click",
      retryCheckout
    );
  }

  initializeCheckout();
});
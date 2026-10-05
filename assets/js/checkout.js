// =========================================
// SMH COLLECTION
// REAL CHECKOUT + CASH ON DELIVERY
// FIXED CHECKOUT FLOW
// PART 1 OF 4
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("SMH Collection Checkout loaded.");

  // =========================================
  // BASIC ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  const loadingState =
    document.getElementById("checkoutLoading");

  const checkoutLayout =
    document.getElementById("checkoutLayout");

  const emptyCheckout =
    document.getElementById("emptyCheckout");

  const checkoutError =
    document.getElementById("checkoutError");

  const checkoutErrorMessage =
    document.getElementById(
      "checkoutErrorMessage"
    );

  const retryButton =
    document.getElementById("retryButton");

  const checkoutForm =
    document.getElementById("checkoutForm");

  const placeOrderButton =
    document.getElementById(
      "placeOrderButton"
    );

  const checkoutMessage =
    document.getElementById(
      "checkoutMessage"
    );

  const checkoutItems =
    document.getElementById("checkoutItems");

  const subtotalElement =
    document.getElementById("subtotal");

  const totalElement =
    document.getElementById(
      "totalAmount"
    );

  const shippingName =
    document.getElementById(
      "shippingName"
    );

  const shippingPhone =
    document.getElementById(
      "shippingPhone"
    );

  const shippingAddress =
    document.getElementById(
      "shippingAddress"
    );

  const shippingCity =
    document.getElementById(
      "shippingCity"
    );

  const shippingState =
    document.getElementById(
      "shippingState"
    );

  const shippingCountry =
    document.getElementById(
      "shippingCountry"
    );

  const orderNotes =
    document.getElementById(
      "orderNotes"
    );


  // =========================================
  // YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // APPLICATION STATE
  // =========================================

  let currentUser = null;
  let currentProfile = null;
  let currentCart = null;
  let currentCartItems = [];
  let currentSubtotal = 0;


  // =========================================
  // HELPERS
  // =========================================

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  function formatCurrency(amount) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(
      Number(amount) || 0
    );
  }


  function showMessage(
    message,
    type = "error"
  ) {

    if (!checkoutMessage) {
      return;
    }

    checkoutMessage.textContent =
      message || "";

    checkoutMessage.className =
      "checkout-message";

    if (message) {
      checkoutMessage.classList.add(
        type
      );
    }
  }


  // =========================================
  // UI STATES
  // =========================================

  function showLoading() {

    if (loadingState) {
      loadingState.hidden = false;
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


  function showCheckout() {

    if (loadingState) {
      loadingState.hidden = true;
    }

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

    if (loadingState) {
      loadingState.hidden = true;
    }

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

    if (loadingState) {
      loadingState.hidden = true;
    }

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
        message ||
        "Unable to load checkout.";
    }
  }


  function setButtonLoading(
    loading
  ) {

    if (!placeOrderButton) {
      return;
    }

    placeOrderButton.disabled =
      loading;

    placeOrderButton.textContent =
      loading
        ? "Placing Order..."
        : "Place Order";
  }


  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (
    typeof window.supabase ===
    "undefined"
  ) {

    console.error(
      "Supabase library is missing."
    );

    showError(
      "Checkout service could not load. Please refresh the page."
    );

    return;
  }


  if (
    typeof supabaseClient ===
    "undefined"
  ) {

    console.error(
      "supabaseClient is missing."
    );

    showError(
      "Supabase connection could not be initialized."
    );

    return;
  }


  // =========================================
  // PROFILE MENU
  // =========================================

  const profileButton =
    document.getElementById(
      "profileButton"
    );

  const profileMenu =
    document.getElementById(
      "profileMenu"
    );

  const profileAvatar =
    document.getElementById(
      "profileAvatar"
    );

  const profileName =
    document.getElementById(
      "profileName"
    );

  const menuAvatar =
    document.getElementById(
      "menuAvatar"
    );

  const menuName =
    document.getElementById(
      "menuName"
    );

  const menuEmail =
    document.getElementById(
      "menuEmail"
    );

  const myOrdersButton =
    document.getElementById(
      "myOrdersButton"
    );

  const wishlistButton =
    document.getElementById(
      "wishlistButton"
    );

  const settingsButton =
    document.getElementById(
      "settingsButton"
    );

  const logoutButton =
    document.getElementById(
      "logoutButton"
    );


  function getInitial(name) {

    const cleanName =
      String(name || "").trim();

    if (!cleanName) {
      return "U";
    }

    return cleanName
      .charAt(0)
      .toUpperCase();
  }


  function openProfileMenu() {

    if (
      !profileMenu ||
      !profileButton
    ) {
      return;
    }

    profileMenu.classList.add(
      "open"
    );

    profileButton.setAttribute(
      "aria-expanded",
      "true"
    );

    profileMenu.setAttribute(
      "aria-hidden",
      "false"
    );
  }


  function closeProfileMenu() {

    if (
      !profileMenu ||
      !profileButton
    ) {
      return;
    }

    profileMenu.classList.remove(
      "open"
    );

    profileButton.setAttribute(
      "aria-expanded",
      "false"
    );

    profileMenu.setAttribute(
      "aria-hidden",
      "true"
    );
  }


  function toggleProfileMenu() {

    if (!profileMenu) {
      return;
    }

    const isOpen =
      profileMenu.classList.contains(
        "open"
      );

    if (isOpen) {
      closeProfileMenu();
    } else {
      openProfileMenu();
    }
  }


  function populateProfileMenu(
    profile
  ) {

    if (!profile) {
      return;
    }

    const name =
      profile.full_name ||
      "Account";

    const email =
      profile.email ||
      currentUser?.email ||
      "";

    if (profileAvatar) {
      profileAvatar.textContent =
        getInitial(name);
    }

    if (profileName) {
      profileName.textContent =
        name;
    }

    if (menuAvatar) {
      menuAvatar.textContent =
        getInitial(name);
    }

    if (menuName) {
      menuName.textContent =
        name;
    }

    if (menuEmail) {
      menuEmail.textContent =
        email;
    }
  }


  if (profileButton) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        toggleProfileMenu();
      }
    );
  }


  document.addEventListener(
    "click",
    (event) => {

      if (
        profileMenu &&
        profileButton &&
        !profileMenu.contains(
          event.target
        ) &&
        !profileButton.contains(
          event.target
        )
      ) {

        closeProfileMenu();
      }
    }
  );


  // =========================================
  // PROFILE LOADING
  // =========================================

  async function loadProfile() {

    const {
      data: { user },
      error: userError
    } =
      await supabaseClient.auth.getUser();


    if (userError) {
      throw userError;
    }


    if (!user) {

      window.location.href =
        "login.html";

      return false;
    }


    currentUser =
      user;


    const {
      data: profile,
      error: profileError
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active, avatar_url"
        )
        .eq(
          "id",
          user.id
        )
        .single();


    if (profileError) {
      throw profileError;
    }


    if (!profile) {

      throw new Error(
        "Your account profile could not be found."
      );
    }


    currentProfile =
      profile;


    if (!profile.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return false;
    }


    if (
      profile.role === "admin"
    ) {

      window.location.href =
        "admin-dashboard.html";

      return false;
    }


    if (
      profile.role === "seller"
    ) {

      window.location.href =
        "seller-dashboard.html";

      return false;
    }


    if (
      profile.role !== "buyer"
    ) {

      throw new Error(
        "Your account has an invalid account role."
      );
    }


    populateProfileMenu(
      profile
    );


    return true;
  }


  // =========================================
  // CART
  // =========================================

  async function getOrCreateCart() {

    if (!currentUser) {

      throw new Error(
        "Your session has expired. Please sign in again."
      );
    }


    const {
      data: existingCart,
      error: cartError
    } =
      await supabaseClient
        .from("carts")
        .select(
          "id, buyer_id, created_at, updated_at"
        )
        .eq(
          "buyer_id",
          currentUser.id
        )
        .maybeSingle();


    if (cartError) {
      throw cartError;
    }


    if (existingCart) {
      return existingCart;
    }


    const {
      data: newCart,
      error: createError
    } =
      await supabaseClient
        .from("carts")
        .insert({
          buyer_id:
            currentUser.id
        })
        .select(
          "id, buyer_id, created_at, updated_at"
        )
        .single();


    if (createError) {
      throw createError;
    }


    return newCart;
  }


  // =========================================
  // LOAD CART ITEMS
  // =========================================

  async function loadCartItems() {

    currentCart =
      await getOrCreateCart();


    const {
      data,
      error
    } =
      await supabaseClient
        .from("cart_items")
        .select(`
          id,
          cart_id,
          product_id,
          quantity,
          created_at,
          products (
            id,
            seller_id,
            category_id,
            name,
            slug,
            description,
            price,
            stock,
            image_url,
            is_active,
            categories (
              id,
              name,
              slug
            )
          )
        `)
        .eq(
          "cart_id",
          currentCart.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    currentCartItems =
      (data || []).filter(
        (item) =>
          item.products &&
          item.products.is_active === true
      );


    return currentCartItems;
  }
  async function refreshCartProducts() {
    if (!currentCart) {
      await getOrCreateCart();
    }

    const { data, error } = await supabaseClient
      .from("cart_items")
      .select(`
        id,
        cart_id,
        product_id,
        quantity,
        created_at,
        products (
          id,
          seller_id,
          category_id,
          name,
          slug,
          description,
          price,
          stock,
          image_url,
          is_active,
          categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq("cart_id", currentCart.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Refresh cart error:", error);
      throw new Error(error.message || "Unable to refresh your cart.");
    }

    currentCartItems = data || [];

    return currentCartItems;
  }


  function validateCartStock(items) {
    if (!items || items.length === 0) {
      return {
        valid: false,
        message: "Your cart is empty. Please add a product before checkout."
      };
    }

    for (const item of items) {
      const product = item.products;

      if (!product) {
        return {
          valid: false,
          message: "One of the products in your cart is no longer available."
        };
      }

      if (!product.is_active) {
        return {
          valid: false,
          message: `"${product.name}" is no longer available. Please remove it from your cart.`
        };
      }

      if (product.stock <= 0) {
        return {
          valid: false,
          message: `"${product.name}" is out of stock.`
        };
      }

      if (item.quantity > product.stock) {
        return {
          valid: false,
          message:
            `"${product.name}" only has ${product.stock} item(s) available, ` +
            `but your cart contains ${item.quantity}.`
        };
      }
    }

    return {
      valid: true,
      message: ""
    };
  }


  function calculateSubtotal(items) {
    return items.reduce((total, item) => {
      const product = item.products;

      if (!product) {
        return total;
      }

      const price = Number(product.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return total + (price * quantity);
    }, 0);
  }


  function formatMoney(amount) {
    return `$${Number(amount || 0).toFixed(2)}`;
  }


  function renderCheckoutItems(items) {
    if (!checkoutItems) {
      return;
    }

    checkoutItems.innerHTML = "";

    if (!items || items.length === 0) {
      checkoutItems.innerHTML = `
        <div class="checkout-empty-message">
          <p>Your cart is empty.</p>
        </div>
      `;

      return;
    }

    items.forEach((item) => {
      const product = item.products;

      if (!product) {
        return;
      }

      const price = Number(product.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const itemTotal = price * quantity;

      const itemElement = document.createElement("div");

      itemElement.className = "checkout-item";

      itemElement.innerHTML = `
        <div class="checkout-item-image">
          ${
            product.image_url
              ? `<img
                  src="${escapeHtml(product.image_url)}"
                  alt="${escapeHtml(product.name)}"
                >`
              : `
                <div class="checkout-item-placeholder">
                  SMH
                </div>
              `
          }
        </div>

        <div class="checkout-item-details">
          <h3>${escapeHtml(product.name)}</h3>

          ${
            product.categories?.name
              ? `<p class="checkout-item-category">
                  ${escapeHtml(product.categories.name)}
                </p>`
              : ""
          }

          <p class="checkout-item-price">
            ${formatMoney(price)} × ${quantity}
          </p>
        </div>

        <div class="checkout-item-total">
          ${formatMoney(itemTotal)}
        </div>
      `;

      checkoutItems.appendChild(itemElement);
    });
  }


  function renderTotals(items) {
    const subtotal = calculateSubtotal(items);
    const deliveryFee = 0;
    const total = subtotal + deliveryFee;

    if (subtotalElement) {
      subtotalElement.textContent = formatMoney(subtotal);
    }

    if (totalAmountElement) {
      totalAmountElement.textContent = formatMoney(total);
    }

    return {
      subtotal,
      deliveryFee,
      total
    };
  }


  async function prefillShippingInformation() {
    if (!currentUser) {
      return;
    }

    try {
      const { data: profile, error } = await supabaseClient
        .from("profiles")
        .select(`
          id,
          full_name,
          email
        `)
        .eq("id", currentUser.id)
        .single();

      if (error) {
        console.warn("Unable to load profile for checkout:", error);
        return;
      }

      if (profile?.full_name && shippingName && !shippingName.value) {
        shippingName.value = profile.full_name;
      }
    } catch (error) {
      console.warn("Shipping prefill error:", error);
    }
  }


  function generateOrderNumber() {
    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const randomPart = Math.floor(
      100000 + Math.random() * 900000
    );

    return `SMH-${year}${month}${day}-${randomPart}`;
  }


  function validateShippingForm() {
    const fields = [
      {
        element: shippingName,
        name: "Full name"
      },
      {
        element: shippingPhone,
        name: "Phone number"
      },
      {
        element: shippingAddress,
        name: "Delivery address"
      },
      {
        element: shippingCity,
        name: "City"
      },
      {
        element: shippingState,
        name: "State"
      },
      {
        element: shippingCountry,
        name: "Country"
      }
    ];

    for (const field of fields) {
      if (!field.element || !field.element.value.trim()) {
        return {
          valid: false,
          message: `${field.name} is required.`
        };
      }
    }

    const phone = shippingPhone.value.trim();

    if (phone.length < 7) {
      return {
        valid: false,
        message: "Please enter a valid phone number."
      };
    }

    return {
      valid: true,
      message: ""
    };
  }
  async function createOrder() {
    if (!currentUser) {
      throw new Error("You must be logged in to place an order.");
    }

    const shippingValidation = validateShippingForm();

    if (!shippingValidation.valid) {
      throw new Error(shippingValidation.message);
    }

    const freshItems = await refreshCartProducts();

    const stockValidation = validateCartStock(freshItems);

    if (!stockValidation.valid) {
      throw new Error(stockValidation.message);
    }

    const subtotal = calculateSubtotal(freshItems);

    if (subtotal <= 0) {
      throw new Error("Your order total must be greater than zero.");
    }

    const orderNumber = generateOrderNumber();

    const orderData = {
      buyer_id: currentUser.id,
      order_number: orderNumber,
      status: "pending",
      payment_method: "cash_on_delivery",
      payment_status: "unpaid",

      subtotal: subtotal,
      delivery_fee: 0,
      total_amount: subtotal,

      shipping_name: shippingName.value.trim(),
      shipping_phone: shippingPhone.value.trim(),
      shipping_address: shippingAddress.value.trim(),
      shipping_city: shippingCity.value.trim(),
      shipping_state: shippingState.value.trim(),
      shipping_country: shippingCountry.value.trim(),

      notes: orderNotes
        ? (orderNotes.value.trim() || null)
        : null
    };


    /*
     * STEP 1
     * Create the actual order.
     *
     * This was missing from the old checkout.js.
     */
    const {
      data: order,
      error: orderError
    } = await supabaseClient
      .from("orders")
      .insert(orderData)
      .select("id, order_number")
      .single();


    if (orderError) {
      console.error("Create order error:", orderError);

      throw new Error(
        orderError.message || "Unable to create your order."
      );
    }


    if (!order || !order.id) {
      throw new Error(
        "The order was created, but no order ID was returned."
      );
    }


    /*
     * STEP 2
     * Create the order items.
     */
    const orderItems = freshItems.map((item) => {
      const product = item.products;

      const price = Number(product.price) || 0;
      const quantity = Number(item.quantity) || 0;

      return {
        order_id: order.id,
        product_id: product.id,
        seller_id: product.seller_id,

        product_name: product.name,
        product_price: price,

        quantity: quantity,
        item_total: price * quantity
      };
    });


    if (orderItems.length === 0) {
      throw new Error(
        "No products were found for this order."
      );
    }


    const {
      error: orderItemsError
    } = await supabaseClient
      .from("order_items")
      .insert(orderItems);


    if (orderItemsError) {
      console.error(
        "Create order items error:",
        orderItemsError
      );

      throw new Error(
        orderItemsError.message ||
        "Unable to save the products in your order."
      );
    }


    /*
     * STEP 3
     * Clear the cart only AFTER the order and
     * all order items have been successfully created.
     */
    const {
      error: clearCartError
    } = await supabaseClient
      .from("cart_items")
      .delete()
      .eq("cart_id", currentCart.id);


    if (clearCartError) {
      /*
       * The order already exists, so we do NOT delete it here.
       * The user has a valid order even if cart cleanup fails.
       */
      console.error(
        "Cart cleanup error:",
        clearCartError
      );
    }


    /*
     * STEP 4
     * Send the customer to Orders.
     */
    window.location.href =
      `orders.html?order=${encodeURIComponent(
        order.order_number
      )}`;
  }
  async function handleCheckoutSubmit(event) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    isSubmitting = true;

    clearError();

    if (placeOrderButton) {
      placeOrderButton.disabled = true;

      placeOrderButton.dataset.originalText =
        placeOrderButton.textContent;

      placeOrderButton.textContent =
        "Placing Order...";
    }

    try {
      const validation = validateShippingForm();

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      await createOrder();

    } catch (error) {
      console.error("Checkout submission error:", error);

      showError(
        error.message ||
        "Something went wrong while placing your order."
      );

      if (placeOrderButton) {
        placeOrderButton.disabled = false;

        placeOrderButton.textContent =
          placeOrderButton.dataset.originalText ||
          "Place Order";
      }

      isSubmitting = false;

      return;
    }

    /*
     * createOrder() redirects after success.
     * This is only a safety fallback.
     */
    isSubmitting = false;
  }


  async function initializeCheckout() {
    showLoading();

    try {
      /*
       * Make sure there is a valid authenticated buyer.
       */
      const {
        data: {
          session
        },
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError) {
        throw new Error(
          sessionError.message ||
          "Unable to verify your login session."
        );
      }

      if (!session || !session.user) {
        window.location.href = "login.html";
        return;
      }

      currentUser = session.user;


      /*
       * Make sure the user has a cart.
       */
      await getOrCreateCart();


      /*
       * Load the latest products and quantities.
       */
      const items = await loadCartItems();


      /*
       * If the cart is empty, show the empty state.
       */
      if (!items || items.length === 0) {
        showEmpty();

        return;
      }


      /*
       * Check current product availability and stock.
       */
      const stockValidation = validateCartStock(items);

      if (!stockValidation.valid) {
        throw new Error(stockValidation.message);
      }


      /*
       * Display products and totals.
       */
      renderCheckoutItems(items);

      renderTotals(items);


      /*
       * Pre-fill the customer's name when available.
       */
      await prefillShippingInformation();


      /*
       * Everything is ready.
       */
      showContent();

    } catch (error) {
      console.error(
        "Checkout initialization error:",
        error
      );

      showError(
        error.message ||
        "Unable to load your checkout."
      );
    }
  }


  /*
   * Checkout form submission.
   */
  if (checkoutForm) {
    checkoutForm.addEventListener(
      "submit",
      handleCheckoutSubmit
    );
  }


  /*
   * Retry button.
   */
  if (retryButton) {
    retryButton.addEventListener(
      "click",
      () => {
        initializeCheckout();
      }
    );
  }


  /*
   * Continue shopping.
   */
  if (continueShoppingButton) {
    continueShoppingButton.addEventListener(
      "click",
      () => {
        window.location.href = "index.html";
      }
    );
  }


  /*
   * My Orders navigation.
   */
  if (myOrdersButton) {
    myOrdersButton.addEventListener(
      "click",
      () => {
        window.location.href = "orders.html";
      }
    );
  }


  /*
   * Wishlist navigation.
   */
  if (wishlistButton) {
    wishlistButton.addEventListener(
      "click",
      () => {
        window.location.href = "wishlist.html";
      }
    );
  }


  /*
   * Settings navigation.
   */
  if (settingsButton) {
    settingsButton.addEventListener(
      "click",
      () => {
        window.location.href = "settings.html";
      }
    );
  }


  /*
   * Logout.
   */
  if (logoutButton) {
    logoutButton.addEventListener(
      "click",
      async () => {
        try {
          const {
            error
          } = await supabaseClient.auth.signOut();

          if (error) {
            throw error;
          }

          window.location.href = "login.html";

        } catch (error) {
          console.error(
            "Logout error:",
            error
          );

          showError(
            error.message ||
            "Unable to log out."
          );
        }
      }
    );
  }


  /*
   * Start checkout.
   */
  initializeCheckout();

});
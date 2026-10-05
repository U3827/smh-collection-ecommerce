// =========================================
// SMH COLLECTION
// REAL CHECKOUT + CASH ON DELIVERY
// PART 1 OF 4
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("SMH Collection Checkout loaded.");

  // -----------------------------------------
  // BASIC ELEMENTS
  // -----------------------------------------

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }

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

  // -----------------------------------------
  // STATE
  // -----------------------------------------

  let currentUser = null;
  let currentProfile = null;
  let currentCart = null;
  let currentCartItems = [];
  let currentSubtotal = 0;

  // -----------------------------------------
  // HELPERS
  // -----------------------------------------

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(amount) || 0);
  }

  function showMessage(
    message,
    type = "error"
  ) {
    if (!checkoutMessage) {
      return;
    }

    checkoutMessage.textContent =
      message;

    checkoutMessage.className =
      "checkout-message";

    if (message) {
      checkoutMessage.classList.add(
        type
      );
    }
  }

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

  function setButtonLoading(loading) {
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

  // -----------------------------------------
  // SUPABASE CHECK
  // -----------------------------------------

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

  // -----------------------------------------
  // PROFILE MENU
  // -----------------------------------------

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

    profileMenu.classList.add("open");

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
// -----------------------------------------
// PROFILE LOADING
// -----------------------------------------

async function loadProfile() {
  const {
    data: { user },
    error: userError
  } = await supabaseClient.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    window.location.href = "login.html";
    return false;
  }

  currentUser = user;

  const {
    data: profile,
    error: profileError
  } = await supabaseClient
    .from("profiles")
    .select(
      "id, full_name, email, role, is_active, avatar_url"
    )
    .eq("id", user.id)
    .single();

  if (profileError) {
    throw profileError;
  }

  currentProfile = profile;

  if (!profile.is_active) {
    await supabaseClient.auth.signOut();

    window.location.href =
      "login.html";

    return false;
  }

  if (profile.role === "admin") {
    window.location.href =
      "admin-dashboard.html";

    return false;
  }

  if (profile.role === "seller") {
    window.location.href =
      "seller-dashboard.html";

    return false;
  }

  if (profile.role !== "buyer") {
    throw new Error(
      "Your account has an invalid account role."
    );
  }

  populateProfileMenu(profile);

  return true;
}

// -----------------------------------------
// CART
// -----------------------------------------

async function getOrCreateCart() {
  if (!currentUser) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  const {
    data: existingCart,
    error: cartError
  } = await supabaseClient
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
  } = await supabaseClient
    .from("carts")
    .insert({
      buyer_id: currentUser.id
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

async function loadCartItems() {
  currentCart =
    await getOrCreateCart();

  const {
    data,
    error
  } = await supabaseClient
    .from("cart_items")
    .select(`
      id,
      cart_id,
      product_id,
      quantity,
      created_at,
      updated_at,
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
    .order("created_at", {
      ascending: true
    });

  if (error) {
    throw error;
  }

  const validItems =
    (data || []).filter(
      (item) =>
        item.products &&
        item.products.is_active === true
    );

  currentCartItems =
    validItems;

  return validItems;
}

// -----------------------------------------
// STOCK VALIDATION
// -----------------------------------------

async function refreshCartProducts() {
  if (
    !currentCart ||
    !currentCart.id
  ) {
    throw new Error(
      "Your shopping cart could not be found."
    );
  }

  const {
    data,
    error
  } = await supabaseClient
    .from("cart_items")
    .select(`
      id,
      cart_id,
      product_id,
      quantity,
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

function validateCartStock(items) {
  if (
    !items ||
    items.length === 0
  ) {
    return {
      valid: false,
      message: "Your cart is empty."
    };
  }

  for (const item of items) {
    const product =
      item.products;

    if (!product) {
      return {
        valid: false,
        message:
          "One of the products in your cart is no longer available."
      };
    }

    if (!product.is_active) {
      return {
        valid: false,
        message:
          `"${product.name}" is no longer available.`
      };
    }

    if (
      Number(product.stock) <= 0
    ) {
      return {
        valid: false,
        message:
          `"${product.name}" is currently out of stock.`
      };
    }

    if (
      Number(item.quantity) >
      Number(product.stock)
    ) {
      return {
        valid: false,
        message:
          `Only ${product.stock} unit(s) of "${product.name}" are currently available. Please update your cart.`
      };
    }
  }

  return {
    valid: true
  };
}
// -----------------------------------------
// CHECKOUT DISPLAY
// -----------------------------------------

function calculateSubtotal(items) {
  return (items || []).reduce(
    (total, item) => {
      const product =
        item.products;

      if (!product) {
        return total;
      }

      const price =
        Number(product.price) || 0;

      const quantity =
        Number(item.quantity) || 0;

      return (
        total +
        price * quantity
      );
    },
    0
  );
}

function renderCheckoutItems(items) {
  if (!checkoutItems) {
    return;
  }

  if (
    !items ||
    items.length === 0
  ) {
    checkoutItems.innerHTML = "";
    return;
  }

  checkoutItems.innerHTML =
    items
      .map((item) => {
        const product =
          item.products;

        const name =
          product?.name ||
          "Product";

        const image =
          product?.image_url ||
          "";

        const price =
          Number(product?.price) ||
          0;

        const quantity =
          Number(item.quantity) ||
          0;

        const itemTotal =
          price * quantity;

        const imageHTML = image
          ? `
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(name)}"
              class="checkout-item-image"
              loading="lazy"
            >
          `
          : `
            <div class="checkout-item-placeholder">
              SMH
            </div>
          `;

        return `
          <article class="checkout-item">
            ${imageHTML}

            <div class="checkout-item-info">
              <h3>${escapeHTML(name)}</h3>

              <p>
                ${formatCurrency(price)}
                × ${quantity}
              </p>
            </div>

            <strong class="checkout-item-total">
              ${formatCurrency(itemTotal)}
            </strong>
          </article>
        `;
      })
      .join("");
}

function renderTotals(items) {
  currentSubtotal =
    calculateSubtotal(items);

  if (subtotalElement) {
    subtotalElement.textContent =
      formatCurrency(
        currentSubtotal
      );
  }

  if (totalElement) {
    totalElement.textContent =
      formatCurrency(
        currentSubtotal
      );
  }
}

// -----------------------------------------
// PREFILL SHIPPING INFORMATION
// -----------------------------------------

function prefillShippingInformation() {
  if (
    shippingName &&
    !shippingName.value.trim() &&
    currentProfile?.full_name
  ) {
    shippingName.value =
      currentProfile.full_name;
  }

  if (
    shippingCountry &&
    !shippingCountry.value.trim()
  ) {
    shippingCountry.value =
      "Nigeria";
  }
}

// -----------------------------------------
// ORDER NUMBER
// -----------------------------------------

function generateOrderNumber() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  const randomPart =
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  return `SMH-${year}${month}${day}-${randomPart}`;
}

// -----------------------------------------
// FORM VALIDATION
// -----------------------------------------

function validateShippingForm() {
  const name =
    shippingName?.value.trim() ||
    "";

  const phone =
    shippingPhone?.value.trim() ||
    "";

  const address =
    shippingAddress?.value.trim() ||
    "";

  const city =
    shippingCity?.value.trim() ||
    "";

  const state =
    shippingState?.value.trim() ||
    "";

  const country =
    shippingCountry?.value.trim() ||
    "";

  if (!name) {
    return "Please enter the recipient's full name.";
  }

  if (name.length < 2) {
    return "Please enter a valid recipient name.";
  }

  if (!phone) {
    return "Please enter a phone number.";
  }

  if (phone.length < 7) {
    return "Please enter a valid phone number.";
  }

  if (!address) {
    return "Please enter your delivery address.";
  }

  if (address.length < 5) {
    return "Please enter a more complete delivery address.";
  }

  if (!city) {
    return "Please enter your city.";
  }

  if (!state) {
    return "Please enter your state.";
  }

  if (!country) {
    return "Please enter your country.";
  }

  return null;
}

// -----------------------------------------
// CREATE ORDER
// -----------------------------------------

async function createOrder() {
  if (!currentUser) {
    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  // Refresh cart immediately before ordering.
  const freshItems =
    await refreshCartProducts();

  const stockValidation =
    validateCartStock(
      freshItems
    );

  if (!stockValidation.valid) {
    throw new Error(
      stockValidation.message
    );
  }

  const subtotal =
    calculateSubtotal(
      freshItems
    );

  if (subtotal <= 0) {
    throw new Error(
      "Your order total must be greater than zero."
    );
  }

  const orderNumber =
    generateOrderNumber();

  // IMPORTANT:
  // These names MUST match the
  // actual columns in public.orders.
  const orderData = {
    buyer_id:
      currentUser.id,

    order_number:
      orderNumber,

    status:
      "pending",

    payment_method:
      "cash_on_delivery",

    payment_status:
      "unpaid",

    subtotal:
      subtotal,

    delivery_fee:
      0,

    total_amount:
      subtotal,

    shipping_name:
      shippingName.value.trim(),

    shipping_phone:
      shippingPhone.value.trim(),

    shipping_address:
      shippingAddress.value.trim(),

    shipping_city:
      shippingCity.value.trim(),

    shipping_state:
      shippingState.value.trim(),

    shipping_country:
      shippingCountry.value.trim(),

    notes:
      orderNotes?.value.trim() ||
      null
  };

  // -----------------------------------------
  // CREATE ORDER
  // -----------------------------------------

  const {
    data: order,
    error: orderError
  } = await supabaseClient
    .from("orders")
    .insert(orderData)
    .select(`
      id,
      order_number,
      status,
      payment_method,
      payment_status,
      subtotal,
      delivery_fee,
      total_amount,
      shipping_name,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_country,
      notes,
      created_at
    `)
    .single();

  if (orderError) {
    console.error(
      "Create order error:",
      orderError
    );

    throw orderError;
  }

  if (!order) {
    throw new Error(
      "The order was not created."
    );
  }
  // -----------------------------------------
  // CREATE ORDER ITEMS
  // -----------------------------------------

  const orderItems =
    freshItems.map((item) => {
      const product =
        item.products;

      const price =
        Number(product.price) || 0;

      const quantity =
        Number(item.quantity) || 0;

      return {
        order_id:
          order.id,

        product_id:
          product.id,

        seller_id:
          product.seller_id,

        product_name:
          product.name,

        product_price:
          price,

        quantity:
          quantity,

        item_total:
          price * quantity
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

    // Remove the order if its items
    // could not be created.
    await supabaseClient
      .from("orders")
      .delete()
      .eq("id", order.id);

    throw orderItemsError;
  }

  // -----------------------------------------
  // CLEAR CART
  // -----------------------------------------

  const {
    error: clearCartError
  } = await supabaseClient
    .from("cart_items")
    .delete()
    .eq(
      "cart_id",
      currentCart.id
    );

  if (clearCartError) {
    console.error(
      "Clear cart error:",
      clearCartError
    );

    // The order already exists, so we
    // don't cancel it here.
    console.warn(
      "Order was created, but the cart could not be cleared."
    );
  }

  return order;
}

// -----------------------------------------
// PLACE ORDER
// -----------------------------------------

async function handlePlaceOrder() {
  showMessage("");

  const validationError =
    validateShippingForm();

  if (validationError) {
    showMessage(
      validationError,
      "error"
    );

    return;
  }

  setButtonLoading(true);

  try {
    const order =
      await createOrder();

    showMessage(
      `Order ${order.order_number} placed successfully.`,
      "success"
    );

    if (placeOrderButton) {
      placeOrderButton.disabled =
        true;

      placeOrderButton.textContent =
        "Order Placed";
    }

    // Give the success message a moment
    // before moving to the orders page.
    setTimeout(() => {
      window.location.href =
        `orders.html?order=${encodeURIComponent(
          order.id
        )}`;
    }, 1200);

  } catch (error) {
    console.error(
      "Place order error:",
      error
    );

    showMessage(
      error?.message ||
        "Unable to place your order. Please try again.",
      "error"
    );

    setButtonLoading(false);
  }
}

// -----------------------------------------
// PROFILE MENU ACTIONS
// -----------------------------------------

if (myOrdersButton) {
  myOrdersButton.addEventListener(
    "click",
    () => {
      window.location.href =
        "orders.html";
    }
  );
}

if (wishlistButton) {
  wishlistButton.addEventListener(
    "click",
    () => {
      window.location.href =
        "wishlist.html";
    }
  );
}

if (settingsButton) {
  settingsButton.addEventListener(
    "click",
    () => {
      window.location.href =
        "account-settings.html";
    }
  );
}

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.error(
          "Logout error:",
          error
        );
      }

      window.location.href =
        "login.html";
    }
  );
}

// -----------------------------------------
// FORM SUBMISSION
// -----------------------------------------

if (checkoutForm) {
  checkoutForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      await handlePlaceOrder();
    }
  );
}

if (placeOrderButton) {
  placeOrderButton.addEventListener(
    "click",
    async (event) => {
      if (
        checkoutForm &&
        event.target ===
          placeOrderButton
      ) {
        return;
      }

      await handlePlaceOrder();
    }
  );
}

// -----------------------------------------
// RETRY
// -----------------------------------------

if (retryButton) {
  retryButton.addEventListener(
    "click",
    () => {
      window.location.reload();
    }
  );
}

// -----------------------------------------
// INITIALIZE CHECKOUT
// -----------------------------------------

async function initializeCheckout() {
  try {
    showLoading();

    const authenticated =
      await loadProfile();

    if (!authenticated) {
      return;
    }

    const items =
      await loadCartItems();

    if (
      !items ||
      items.length === 0
    ) {
      showEmptyCheckout();
      return;
    }

    renderCheckoutItems(
      items
    );

    renderTotals(
      items
    );

    prefillShippingInformation();

    showCheckout();

  } catch (error) {
    console.error(
      "Checkout initialization error:",
      error
    );

    showError(
      error?.message ||
        "Unable to load checkout."
    );
  }
}

// -----------------------------------------
// AUTH STATE
// -----------------------------------------

supabaseClient.auth.onAuthStateChange(
  (event, session) => {
    if (
      event === "SIGNED_OUT" ||
      !session
    ) {
      window.location.href =
        "login.html";
    }
  }
);

// -----------------------------------------
// START CHECKOUT
// -----------------------------------------

initializeCheckout();

});
// =========================================
// SMH COLLECTION
// REAL SHOPPING CART
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("SMH Collection Cart loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  const cartLoading =
    document.getElementById("cartLoading");

  const cartLayout =
    document.getElementById("cartLayout");

  const cartItems =
    document.getElementById("cartItems");

  const emptyCart =
    document.getElementById("emptyCart");

  const cartError =
    document.getElementById("cartError");

  const cartErrorMessage =
    document.getElementById("cartErrorMessage");

  const retryButton =
    document.getElementById("retryButton");

  const itemCount =
    document.getElementById("itemCount");

  const subtotalElement =
    document.getElementById("subtotal");

  const totalAmountElement =
    document.getElementById("totalAmount");

  const checkoutButton =
    document.getElementById("checkoutButton");

  // =========================================
  // YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (
    typeof window.supabase === "undefined" ||
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase is not available."
    );

    showError(
      "The shopping service could not load. Please refresh the page."
    );

    return;
  }


  // =========================================
  // STATE
  // =========================================

  let currentUser = null;
  let currentProfile = null;
  let currentCart = null;
  let cartData = [];


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


  function formatMoney(value) {

    const amount =
      Number(value) || 0;

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }
    ).format(amount);

  }


  function getInitials(name) {

    if (!name) {
      return "U";
    }

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .charAt(0)
        .toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();

  }


  function showLoading() {

    if (cartLoading) {
      cartLoading.hidden = false;
    }

    if (cartLayout) {
      cartLayout.hidden = true;
    }

    if (emptyCart) {
      emptyCart.hidden = true;
    }

    if (cartError) {
      cartError.hidden = true;
    }

  }


  function showCart() {

    if (cartLoading) {
      cartLoading.hidden = true;
    }

    if (cartLayout) {
      cartLayout.hidden = false;
    }

    if (emptyCart) {
      emptyCart.hidden = true;
    }

    if (cartError) {
      cartError.hidden = true;
    }

  }


  function showEmptyCart() {

    if (cartLoading) {
      cartLoading.hidden = true;
    }

    if (cartLayout) {
      cartLayout.hidden = true;
    }

    if (emptyCart) {
      emptyCart.hidden = false;
    }

    if (cartError) {
      cartError.hidden = true;
    }

  }


  function showError(message) {

    if (cartLoading) {
      cartLoading.hidden = true;
    }

    if (cartLayout) {
      cartLayout.hidden = true;
    }

    if (emptyCart) {
      emptyCart.hidden = true;
    }

    if (cartError) {
      cartError.hidden = false;
    }

    if (cartErrorMessage) {
      cartErrorMessage.textContent =
        message ||
        "We couldn't load your cart.";
    }

  }


  // =========================================
  // AUTHENTICATION
  // =========================================

  async function loadCurrentUser() {

    const {
      data,
      error
    } =
      await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {

      window.location.href =
        "login.html";

      return false;
    }

    currentUser =
      data.user;

    return true;

  }


  // =========================================
  // LOAD PROFILE
  // =========================================

  async function loadProfile() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active, avatar_url"
        )
        .eq(
          "id",
          currentUser.id
        )
        .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(
        "Your account profile could not be found."
      );
    }

    if (!data.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }

    if (data.role !== "buyer") {

      if (data.role === "admin") {
        window.location.href =
          "admin-dashboard.html";
        return;
      }

      if (data.role === "seller") {
        window.location.href =
          "seller-dashboard.html";
        return;
      }

      throw new Error(
        "Your account does not have permission to use the shopping cart."
      );
    }

    currentProfile =
      data;

    updateProfileUI();

  }


  // =========================================
  // PROFILE UI
  // =========================================

  function updateProfileUI() {

    const name =
      currentProfile.full_name ||
      "Account";

    const email =
      currentProfile.email ||
      currentUser.email ||
      "";

    const initials =
      getInitials(name);

    const profileName =
      document.getElementById("profileName");

    const profileAvatar =
      document.getElementById("profileAvatar");

    const menuName =
      document.getElementById("menuName");

    const menuEmail =
      document.getElementById("menuEmail");

    const menuAvatar =
      document.getElementById("menuAvatar");

    if (profileName) {
      profileName.textContent =
        name;
    }

    if (profileAvatar) {
      profileAvatar.textContent =
        initials;
    }

    if (menuName) {
      menuName.textContent =
        name;
    }

    if (menuEmail) {
      menuEmail.textContent =
        email;
    }

    if (menuAvatar) {
      menuAvatar.textContent =
        initials;
    }

  }


  // =========================================
  // GET OR CREATE CART
  // =========================================

  async function getOrCreateCart() {

    let {
      data: cart,
      error
    } =
      await supabaseClient
        .from("carts")
        .select("id, buyer_id")
        .eq(
          "buyer_id",
          currentUser.id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (cart) {
      return cart;
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
          "id, buyer_id"
        )
        .single();

    if (createError) {
      throw createError;
    }

    return newCart;

  }


  // =========================================
  // LOAD CART
  // =========================================

  async function loadCart() {

    showLoading();

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
            name,
            slug,
            description,
            price,
            stock,
            image_url,
            is_active,
            category_id,
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
            ascending: false
          }
        );

    if (error) {
      throw error;
    }

    cartData =
      (data || [])
        .filter(
          item =>
            item.products &&
            item.products.is_active !== false
        );

    if (cartData.length === 0) {

      updateSummary();

      showEmptyCart();

      return;
    }

    renderCart();

    showCart();

  }


  // =========================================
  // RENDER CART
  // =========================================

  function renderCart() {

    if (!cartItems) {
      return;
    }

    cartItems.innerHTML =
      cartData
        .map(
          item => {

            const product =
              item.products;

            const quantity =
              Number(item.quantity) || 1;

            const price =
              Number(product.price) || 0;

            const stock =
              Number(product.stock) || 0;

            const total =
              price * quantity;

            const categoryName =
              product.categories?.name ||
              "Marketplace";

            const imageHTML =
              product.image_url
                ? `
                  <img
                    src="${escapeHTML(product.image_url)}"
                    alt="${escapeHTML(product.name)}"
                    loading="lazy"
                  >
                `
                : `
                  <div class="cart-item-image no-image">
                    ◇
                  </div>
                `;

            return `
              <article
                class="cart-item"
                data-cart-item-id="${escapeHTML(item.id)}"
              >

                <div class="cart-item-image ${
                  product.image_url
                    ? ""
                    : "no-image"
                }">

                  ${
                    product.image_url
                      ? `
                        <img
                          src="${escapeHTML(product.image_url)}"
                          alt="${escapeHTML(product.name)}"
                          loading="lazy"
                        >
                      `
                      : "◇"
                  }

                </div>


                <div class="cart-item-info">

                  <p class="cart-item-category">
                    ${escapeHTML(categoryName)}
                  </p>

                  <h3 class="cart-item-name">
                    ${escapeHTML(product.name)}
                  </h3>

                  <p class="cart-item-price">
                    ${formatMoney(price)}
                    each
                  </p>

                  ${
                    stock > 0
                      ? `
                        <p class="cart-item-stock">
                          ${stock} available
                        </p>
                      `
                      : `
                        <p
                          class="cart-item-stock"
                          style="color:#ff7777;"
                        >
                          Out of stock
                        </p>
                      `
                  }

                </div>


                <div class="cart-item-actions">

                  <strong class="cart-item-total">
                    ${formatMoney(total)}
                  </strong>


                  <div
                    class="quantity-control"
                    aria-label="Quantity controls"
                  >

                    <button
                      type="button"
                      class="quantity-button"
                      data-action="decrease"
                      data-cart-item-id="${escapeHTML(item.id)}"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>

                    <span class="quantity-value">
                      ${quantity}
                    </span>

                    <button
                      type="button"
                      class="quantity-button"
                      data-action="increase"
                      data-cart-item-id="${escapeHTML(item.id)}"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>

                  </div>


                  <button
                    type="button"
                    class="remove-item-button"
                    data-action="remove"
                    data-cart-item-id="${escapeHTML(item.id)}"
                  >
                    Remove
                  </button>

                </div>

              </article>
            `;

          }
        )
        .join("");

    updateSummary();

  }


  // =========================================
  // UPDATE SUMMARY
  // =========================================

  function updateSummary() {

    let totalItems = 0;
    let subtotal = 0;

    cartData.forEach(
      item => {

        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(item.products?.price) || 0;

        totalItems +=
          quantity;

        subtotal +=
          quantity * price;

      }
    );

    if (itemCount) {

      itemCount.textContent =
        `${totalItems} ${
          totalItems === 1
            ? "item"
            : "items"
        }`;

    }

    if (subtotalElement) {

      subtotalElement.textContent =
        formatMoney(subtotal);

    }

    if (totalAmountElement) {

      totalAmountElement.textContent =
        formatMoney(subtotal);

    }

    if (checkoutButton) {

      checkoutButton.disabled =
        cartData.length === 0;

    }

  }


  // =========================================
  // UPDATE QUANTITY
  // =========================================

  async function updateQuantity(
    cartItemId,
    newQuantity
  ) {

    const item =
      cartData.find(
        cartItem =>
          cartItem.id === cartItemId
      );

    if (!item) {
      return;
    }

    const stock =
      Number(item.products?.stock) || 0;

    if (newQuantity <= 0) {

      await removeCartItem(
        cartItemId
      );

      return;
    }

    if (
      stock > 0 &&
      newQuantity > stock
    ) {

      alert(
        `Only ${stock} item${
          stock === 1 ? "" : "s"
        } available in stock.`
      );

      return;
    }

    if (stock === 0) {

      alert(
        "This product is currently out of stock."
      );

      return;
    }

    const {
      error
    } =
      await supabaseClient
        .from("cart_items")
        .update({
          quantity:
            newQuantity
        })
        .eq(
          "id",
          cartItemId
        )
        .eq(
          "cart_id",
          currentCart.id
        );

    if (error) {
      throw error;
    }

    await loadCart();

  }


  // =========================================
  // REMOVE CART ITEM
  // =========================================

  async function removeCartItem(
    cartItemId
  ) {

    const {
      error
    } =
      await supabaseClient
        .from("cart_items")
        .delete()
        .eq(
          "id",
          cartItemId
        )
        .eq(
          "cart_id",
          currentCart.id
        );

    if (error) {
      throw error;
    }

    await loadCart();

  }


  // =========================================
  // CART CLICK EVENTS
  // =========================================

  if (cartItems) {

    cartItems.addEventListener(
      "click",
      async event => {

        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) {
          return;
        }

        const action =
          button.dataset.action;

        const cartItemId =
          button.dataset.cartItemId;

        if (!cartItemId) {
          return;
        }

        button.disabled = true;

        try {

          const item =
            cartData.find(
              cartItem =>
                cartItem.id === cartItemId
            );

          if (!item) {
            return;
          }

          const currentQuantity =
            Number(item.quantity) || 1;

          if (action === "increase") {

            await updateQuantity(
              cartItemId,
              currentQuantity + 1
            );

          }

          if (action === "decrease") {

            await updateQuantity(
              cartItemId,
              currentQuantity - 1
            );

          }

          if (action === "remove") {

            await removeCartItem(
              cartItemId
            );

          }

        } catch (error) {

          console.error(
            "Cart action error:",
            error
          );

          alert(
            error.message ||
            "Unable to update your cart."
          );

        } finally {

          button.disabled = false;

        }

      }
    );

  }


  // =========================================
  // CHECKOUT
  // =========================================

  if (checkoutButton) {

    checkoutButton.addEventListener(
      "click",
      () => {

        if (!cartData.length) {
          return;
        }

        window.location.href =
          "checkout.html";

      }
    );

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


  function closeProfileMenu() {

    if (!profileButton || !profileMenu) {
      return;
    }

    profileButton.setAttribute(
      "aria-expanded",
      "false"
    );

    profileMenu.setAttribute(
      "aria-hidden",
      "true"
    );

    profileMenu.classList.remove(
      "open"
    );

  }


  function toggleProfileMenu() {

    if (!profileButton || !profileMenu) {
      return;
    }

    const isOpen =
      profileMenu.classList.contains(
        "open"
      );

    if (isOpen) {

      closeProfileMenu();

    } else {

      profileButton.setAttribute(
        "aria-expanded",
        "true"
      );

      profileMenu.setAttribute(
        "aria-hidden",
        "false"
      );

      profileMenu.classList.add(
        "open"
      );

    }

  }


  if (profileButton) {

    profileButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        toggleProfileMenu();

      }
    );

  }


  if (profileMenu) {

    profileMenu.addEventListener(
      "click",
      event => {
        event.stopPropagation();
      }
    );

  }


  document.addEventListener(
    "click",
    () => {
      closeProfileMenu();
    }
  );


  // =========================================
  // PROFILE NAVIGATION
  // =========================================

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


  if (myOrdersButton) {

    myOrdersButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "orders.html";

      }
    );

  }


  if 
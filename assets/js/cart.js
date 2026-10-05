// =========================================
// SMH COLLECTION
// REAL SHOPPING CART
// CART.JS — PART 1 OF 4
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("SMH Collection Cart loaded.");

  // =========================================
  // DOM ELEMENTS
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
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase client is unavailable."
    );

    if (cartError) {
      cartError.hidden = false;
    }

    if (cartErrorMessage) {
      cartErrorMessage.textContent =
        "The shopping service could not load.";
    }

    return;
  }


  // =========================================
  // APPLICATION STATE
  // =========================================

  let currentUser = null;

  let currentProfile = null;

  let currentCart = null;

  let cartData = [];


  // =========================================
  // HELPER: ESCAPE HTML
  // =========================================

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }


  // =========================================
  // HELPER: FORMAT MONEY
  // =========================================

  function formatMoney(value) {

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }
    ).format(Number(value) || 0);
  }


  // =========================================
  // HELPER: GET INITIALS
  // =========================================

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
        .substring(0, 2)
        .toUpperCase();
    }


    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }


  // =========================================
  // UI: LOADING
  // =========================================

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


  // =========================================
  // UI: CART
  // =========================================

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


  // =========================================
  // UI: EMPTY CART
  // =========================================

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


  // =========================================
  // UI: ERROR
  // =========================================

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

      return false;
    }


    if (data.role !== "buyer") {

      if (data.role === "admin") {

        window.location.href =
          "admin-dashboard.html";

        return false;
      }


      if (data.role === "seller") {

        window.location.href =
          "seller-dashboard.html";

        return false;
      }


      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return false;
    }


    currentProfile =
      data;

    updateProfileUI();

    return true;
  }
  // =========================================
  // UPDATE PROFILE UI
  // =========================================

  function updateProfileUI() {

    if (!currentProfile) {
      return;
    }


    const name =
      currentProfile.full_name ||
      "Account";

    const email =
      currentProfile.email ||
      currentUser?.email ||
      "";

    const initials =
      getInitials(name);


    const profileName =
      document.getElementById(
        "profileName"
      );

    const profileAvatar =
      document.getElementById(
        "profileAvatar"
      );

    const menuName =
      document.getElementById(
        "menuName"
      );

    const menuEmail =
      document.getElementById(
        "menuEmail"
      );

    const menuAvatar =
      document.getElementById(
        "menuAvatar"
      );


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

    const {
      data: cart,
      error
    } =
      await supabaseClient
        .from("carts")
        .select(
          "id, buyer_id"
        )
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
      (data || []).filter(
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
  // UPDATE CART SUMMARY
  // =========================================

  function updateSummary() {

    let totalItems = 0;

    let subtotal = 0;


    cartData.forEach(item => {

      const quantity =
        Number(item.quantity) || 0;

      const price =
        Number(item.products?.price) || 0;


      totalItems += quantity;

      subtotal +=
        quantity * price;
    });


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
  // RENDER CART
  // =========================================

  function renderCart() {

    if (!cartItems) {
      return;
    }


    cartItems.innerHTML =
      cartData.map(item => {

        const product =
          item.products;


        const quantity =
          Number(item.quantity) || 1;


        const price =
          Number(product.price) || 0;


        const stock =
          Number(product.stock) || 0;


        const itemTotal =
          price * quantity;


        const image =
          product.image_url ||
          "assets/images/placeholder-product.png";


        const category =
          product.categories?.name ||
          "Product";


        const productName =
          escapeHTML(
            product.name
          );


        const safeImage =
          escapeHTML(
            image
          );


        const safeCategory =
          escapeHTML(
            category
          );


        return `
          <article
            class="cart-item"
            data-cart-item-id="${item.id}"
          >

            <div class="cart-item-image">

              <a
                href="product.html?id=${encodeURIComponent(product.id)}"
              >

                <img
                  src="${safeImage}"
                  alt="${productName}"
                  loading="lazy"
                >

              </a>

            </div>


            <div class="cart-item-details">

              <div class="cart-item-category">
                ${safeCategory}
              </div>


              <h3 class="cart-item-name">

                <a
                  href="product.html?id=${encodeURIComponent(product.id)}"
                >
                  ${productName}
                </a>

              </h3>


              <div class="cart-item-price">
                ${formatMoney(price)}
              </div>


              ${
                stock > 0
                  ? `
                    <div class="cart-item-stock">
                      ${stock} available
                    </div>
                  `
                  : `
                    <div class="cart-item-stock out">
                      Out of stock
                    </div>
                  `
              }

            </div>


            <div class="cart-item-controls">

              <div class="quantity-control">

                <button
                  type="button"
                  class="quantity-button"
                  data-action="decrease"
                  data-cart-item-id="${item.id}"
                  ${
                    quantity <= 1
                      ? "disabled"
                      : ""
                  }
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
                  data-cart-item-id="${item.id}"
                  ${
                    quantity >= stock
                      ? "disabled"
                      : ""
                  }
                >
                  +
                </button>

              </div>


              <div class="cart-item-total">
                ${formatMoney(itemTotal)}
              </div>


              <button
                type="button"
                class="remove-item-button"
                data-action="remove"
                data-cart-item-id="${item.id}"
              >
                Remove
              </button>

            </div>

          </article>
        `;

      }).join("");


    updateSummary();
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

      throw new Error(
        "Cart item could not be found."
      );
    }


    const stock =
      Number(
        item.products?.stock
      ) || 0;


    if (newQuantity < 1) {

      await removeCartItem(
        cartItemId
      );

      return;
    }


    if (stock <= 0) {

      throw new Error(
        "This product is currently out of stock."
      );
    }


    if (newQuantity > stock) {

      throw new Error(
        `Only ${stock} item${
          stock === 1
            ? ""
            : "s"
        } available in stock.`
      );
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


    const index =
      cartData.findIndex(
        cartItem =>
          cartItem.id === cartItemId
      );


    if (index !== -1) {

      cartData[index].quantity =
        newQuantity;
    }


    renderCart();
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


    cartData =
      cartData.filter(
        item =>
          item.id !== cartItemId
      );


    if (
      cartData.length === 0
    ) {

      updateSummary();

      showEmptyCart();

      return;
    }


    renderCart();
  }


  // =========================================
  // CART BUTTON EVENTS
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
                cartItem.id ===
                cartItemId
            );


          if (!item) {

            throw new Error(
              "This cart item is no longer available."
            );
          }


          const currentQuantity =
            Number(
              item.quantity
            ) || 1;


          if (
            action ===
            "increase"
          ) {

            await updateQuantity(
              cartItemId,
              currentQuantity + 1
            );

          }


          else if (
            action ===
            "decrease"
          ) {

            await updateQuantity(
              cartItemId,
              currentQuantity - 1
            );

          }


          else if (
            action ===
            "remove"
          ) {

            await removeCartItem(
              cartItemId
            );
          }

        }


        catch (error) {

          console.error(
            "Cart action error:",
            error
          );


          alert(
            error.message ||
            "Unable to update your cart."
          );
        }


        finally {

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

        if (
          cartData.length === 0
        ) {
          return;
        }


        window.location.href =
          "checkout.html";
      }
    );
  }


  // =========================================
  // PROFILE MENU ELEMENTS
  // =========================================

  const profileButton =
    document.getElementById(
      "profileButton"
    );


  const profileMenu =
    document.getElementById(
      "profileMenu"
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


  // =========================================
  // PROFILE MENU TOGGLE
  // =========================================

  function closeProfileMenu() {

    if (!profileMenu) {
      return;
    }


    profileMenu.hidden = true;


    if (profileButton) {

      profileButton.setAttribute(
        "aria-expanded",
        "false"
      );
    }
  }


  function toggleProfileMenu() {

    if (!profileMenu) {
      return;
    }


    const isOpen =
      profileMenu.hidden === false;


    profileMenu.hidden =
      isOpen;


    if (profileButton) {

      profileButton.setAttribute(
        "aria-expanded",
        String(!isOpen)
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
  // MY ORDERS
  // =========================================

  if (myOrdersButton) {

    myOrdersButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "orders.html";
      }
    );
  }


  // =========================================
  // WISHLIST
  // =========================================

  if (wishlistButton) {

    wishlistButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "wishlist.html";
      }
    );
  }


  // =========================================
  // SETTINGS
  // =========================================

  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "account-settings.html";
      }
    );
  }
  // =========================================
  // LOGOUT
  // =========================================

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        logoutButton.disabled = true;

        try {

          const {
            error
          } =
            await supabaseClient.auth.signOut();


          if (error) {
            throw error;
          }


          window.location.href =
            "login.html";

        }

        catch (error) {

          console.error(
            "Logout error:",
            error
          );


          alert(
            error.message ||
            "Unable to log out."
          );


          logoutButton.disabled =
            false;
        }
      }
    );
  }


  // =========================================
  // RETRY BUTTON
  // =========================================

  if (retryButton) {

    retryButton.addEventListener(
      "click",
      async () => {

        try {

          await loadCart();

        }

        catch (error) {

          console.error(
            "Retry cart error:",
            error
          );


          showError(
            error.message ||
            "Unable to reload your cart."
          );
        }
      }
    );
  }


  // =========================================
  // INITIALIZE CART
  // =========================================

  async function initializeCart() {

    try {

      showLoading();


      const userLoaded =
        await loadCurrentUser();


      if (!userLoaded) {
        return;
      }


      const profileLoaded =
        await loadProfile();


      if (!profileLoaded) {
        return;
      }


      await loadCart();

    }

    catch (error) {

      console.error(
        "Cart initialization error:",
        error
      );


      showError(
        error.message ||
        "Unable to load your shopping cart."
      );
    }
  }


  // =========================================
  // AUTH STATE LISTENER
  // =========================================

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      if (
        event === "SIGNED_OUT"
      ) {

        window.location.href =
          "login.html";

        return;
      }


      if (
        event === "TOKEN_REFRESHED" &&
        !session
      ) {

        window.location.href =
          "login.html";
      }
    }
  );


  // =========================================
  // START CART APPLICATION
  // =========================================

  initializeCart();

});
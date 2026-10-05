// =========================================
// SMH COLLECTION
// REAL BUYER WISHLIST
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("SMH Collection Wishlist loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  const loadingState =
    document.getElementById("loadingState");

  const wishlistGrid =
    document.getElementById("wishlistGrid");

  const emptyState =
    document.getElementById("emptyState");

  const errorState =
    document.getElementById("errorState");

  const errorMessage =
    document.getElementById("errorMessage");

  const retryButton =
    document.getElementById("retryButton");

  const wishlistCount =
    document.getElementById("wishlistCount");

  // =========================================
  // PROFILE
  // =========================================

  const profileButton =
    document.getElementById("profileButton");

  const profileMenu =
    document.getElementById("profileMenu");

  const profileAvatar =
    document.getElementById("profileAvatar");

  const profileName =
    document.getElementById("profileName");

  const menuAvatar =
    document.getElementById("menuAvatar");

  const menuName =
    document.getElementById("menuName");

  const menuEmail =
    document.getElementById("menuEmail");

  const myOrdersButton =
    document.getElementById("myOrdersButton");

  const wishlistButton =
    document.getElementById("wishlistButton");

  const settingsButton =
    document.getElementById("settingsButton");

  const logoutButton =
    document.getElementById("logoutButton");

  // =========================================
  // STATE
  // =========================================

  let currentUser = null;
  let wishlistItems = [];

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
    console.error("Supabase client is unavailable.");

    showError(
      "The connection to SMH Collection could not be initialized."
    );

    return;
  }

  // =========================================
  // HELPERS
  // =========================================

  function escapeHTML(value) {
    if (
      value === null ||
      value === undefined
    ) {
      return "";
    }

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatPrice(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function getInitials(name) {
    if (!name) {
      return "U";
    }

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }

  // =========================================
  // UI STATES
  // =========================================

  function showLoading() {
    if (loadingState) {
      loadingState.hidden = false;
    }

    if (wishlistGrid) {
      wishlistGrid.hidden = true;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
    }
  }

  function showEmpty() {
    if (loadingState) {
      loadingState.hidden = true;
    }

    if (wishlistGrid) {
      wishlistGrid.hidden = true;
    }

    if (emptyState) {
      emptyState.hidden = false;
    }

    if (errorState) {
      errorState.hidden = true;
    }

    if (wishlistCount) {
      wishlistCount.textContent =
        "No saved products";
    }
  }

  function showProducts() {
    if (loadingState) {
      loadingState.hidden = true;
    }

    if (wishlistGrid) {
      wishlistGrid.hidden = false;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
    }
  }

  function showError(message) {
    if (loadingState) {
      loadingState.hidden = true;
    }

    if (wishlistGrid) {
      wishlistGrid.hidden = true;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = false;
    }

    if (errorMessage) {
      errorMessage.textContent =
        message ||
        "Something went wrong while loading your wishlist.";
    }

    if (wishlistCount) {
      wishlistCount.textContent =
        "Unable to load wishlist";
    }
  }

  // =========================================
  // AUTHENTICATION
  // =========================================

  async function loadCurrentUser() {
    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      window.location.href = "login.html";
      return false;
    }

    currentUser = data.user;

    return true;
  }

  // =========================================
  // LOAD PROFILE
  // =========================================

  async function loadProfile() {
    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, avatar_url"
      )
      .eq("id", currentUser.id)
      .single();

    if (error) {
      throw error;
    }

    if (!profile) {
      throw new Error(
        "Your account profile could not be found."
      );
    }

    if (!profile.is_active) {
      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }

    // =======================================
    // ROLE PROTECTION
    // =======================================

    if (profile.role !== "buyer") {

      if (profile.role === "admin") {
        window.location.href =
          "admin-dashboard.html";
        return;
      }

      if (profile.role === "seller") {
        window.location.href =
          "seller-dashboard.html";
        return;
      }

      throw new Error(
        "This page is only available to buyer accounts."
      );
    }

    const name =
      profile.full_name ||
      currentUser.email ||
      "Account";

    const initials =
      getInitials(name);

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

    if (menuAvatar) {
      menuAvatar.textContent =
        initials;
    }

    if (menuEmail) {
      menuEmail.textContent =
        profile.email ||
        currentUser.email ||
        "";
    }
  }

  // =========================================
  // LOAD WISHLIST
  // =========================================

  async function loadWishlist() {

    showLoading();

    const {
      data,
      error
    } = await supabaseClient
      .from("wishlist")
      .select(`
        id,
        buyer_id,
        product_id,
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
          categories (
            id,
            name,
            slug
          )
        )
      `)
      .eq(
        "buyer_id",
        currentUser.id
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

    wishlistItems =
      Array.isArray(data)
        ? data
        : [];

    renderWishlist();
  }

  // =========================================
  // RENDER WISHLIST
  // =========================================

  function renderWishlist() {

    if (!wishlistGrid) {
      return;
    }

    if (!wishlistItems.length) {
      showEmpty();
      return;
    }

    showProducts();

    if (wishlistCount) {
      wishlistCount.textContent =
        `${wishlistItems.length} ${
          wishlistItems.length === 1
            ? "saved product"
            : "saved products"
        }`;
    }

    wishlistGrid.innerHTML =
      wishlistItems
        .map(createWishlistCard)
        .join("");

    attachWishlistEvents();
  }

  // =========================================
  // CREATE CARD
  // =========================================

  function createWishlistCard(item) {

    const product =
      item.products;

    // Product deleted from database
    if (!product) {

      return `
        <article
          class="wishlist-card"
          data-wishlist-id="${escapeHTML(item.id)}"
        >

          <div class="wishlist-image">

            <div class="wishlist-placeholder">
              ◇
            </div>

            <button
              type="button"
              class="remove-wishlist-button"
              data-remove-id="${escapeHTML(item.id)}"
              aria-label="Remove unavailable product"
            >
              ×
            </button>

          </div>

          <div class="wishlist-info">

            <div class="wishlist-category">
              UNAVAILABLE
            </div>

            <h3 class="wishlist-name">
              Product no longer available
            </h3>

            <div class="wishlist-actions">

              <button
                type="button"
                class="view-product-button"
                disabled
              >
                Unavailable
              </button>

            </div>

          </div>

        </article>
      `;
    }

    const productId =
      product.id;

    const productName =
      escapeHTML(
        product.name ||
        "Product"
      );

    const categoryName =
      product.categories?.name ||
      "General";

    const image =
      product.image_url ||
      "";

    const price =
      formatPrice(product.price);

    const stock =
      Number(product.stock || 0);

    const unavailable =
      !product.is_active ||
      stock <= 0;

    return `
      <article
        class="wishlist-card"
        data-wishlist-id="${escapeHTML(item.id)}"
      >

        <div class="wishlist-image">

          ${
            image
              ? `
                <img
                  src="${escapeHTML(image)}"
                  alt="${productName}"
                  loading="lazy"
                >
              `
              : `
                <div class="wishlist-placeholder">
                  ◇
                </div>
              `
          }

          <button
            type="button"
            class="remove-wishlist-button"
            data-remove-id="${escapeHTML(item.id)}"
            aria-label="Remove ${productName} from wishlist"
          >
            ×
          </button>

        </div>

        <div class="wishlist-info">

          <div class="wishlist-category">
            ${escapeHTML(categoryName)}
          </div>

          <h3 class="wishlist-name">
            ${productName}
          </h3>

          <div class="wishlist-price">
            ${price}
          </div>

          <div class="wishlist-actions">

            <button
              type="button"
              class="view-product-button"
              data-product-id="${escapeHTML(productId)}"
              ${unavailable ? "disabled" : ""}
            >
              ${
                unavailable
                  ? "Unavailable"
                  : "View Product"
              }
            </button>

            <button
              type="button"
              class="add-cart-button"
              data-cart-product-id="${escapeHTML(productId)}"
              aria-label="Add ${productName} to cart"
              ${unavailable ? "disabled" : ""}
            >
              🛒
            </button>

          </div>

        </div>

      </article>
    `;
  }

  // =========================================
  // ATTACH WISHLIST EVENTS
  // =========================================

  function attachWishlistEvents() {

    // REMOVE
    document
      .querySelectorAll("[data-remove-id]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            const wishlistId =
              button.dataset.removeId;

            if (!wishlistId) {
              return;
            }

            await removeFromWishlist(
              wishlistId
            );
          }
        );
      });

    // VIEW PRODUCT
    document
      .querySelectorAll("[data-product-id]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          () => {

            if (button.disabled) {
              return;
            }

            const productId =
              button.dataset.productId;

            if (!productId) {
              return;
            }

            window.location.href =
              `product.html?id=${encodeURIComponent(productId)}`;
          }
        );
      });

    // ADD TO CART
    document
      .querySelectorAll("[data-cart-product-id]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async () => {

            if (button.disabled) {
              return;
            }

            const productId =
              button.dataset.cartProductId;

            if (!productId) {
              return;
            }

            await addToCart(
              productId,
              button
            );
          }
        );
      });
  }

  // =========================================
  // REMOVE FROM WISHLIST
  // =========================================

  async function removeFromWishlist(
    wishlistId
  ) {

    try {

      const {
        error
      } = await supabaseClient
        .from("wishlist")
        .delete()
        .eq(
          "id",
          wishlistId
        )
        .eq(
          "buyer_id",
          currentUser.id
        );

      if (error) {
        throw error;
      }

      wishlistItems =
        wishlistItems.filter(
          (item) =>
            item.id !== wishlistId
        );

      renderWishlist();

    } catch (error) {

      console.error(
        "Remove wishlist error:",
        error
      );

      alert(
        error.message ||
        "Unable to remove this product from your wishlist."
      );
    }
  }

  // =========================================
  // GET OR CREATE CART
  // =========================================

  async function getOrCreateCart() {

    const {
      data: cart,
      error
    } = await supabaseClient
      .from("carts")
      .select("id")
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
    } = await supabaseClient
      .from("carts")
      .insert({
        buyer_id:
          currentUser.id
      })
      .select("id")
      .single();

    if (createError) {
      throw createError;
    }

    return newCart;
  }

  // =========================================
  // ADD TO CART
  // =========================================

  async function addToCart(
    productId,
    button
  ) {

    const originalText =
      button.innerHTML;

    try {

      button.disabled = true;
      button.innerHTML = "…";

      const cart =
        await getOrCreateCart();

      const {
        data: existingItem,
        error: existingError
      } = await supabaseClient
        .from("cart_items")
        .select(
          "id, quantity"
        )
        .eq(
          "cart_id",
          cart.id
        )
        .eq(
          "product_id",
          productId
        )
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingItem) {

        const {
          error
        } = await supabaseClient
          .from("cart_items")
          .update({
            quantity:
              Number(
                existingItem.quantity
              ) + 1
          })
          .eq(
            "id",
            existingItem.id
          );

        if (error) {
          throw error;
        }

      } else {

        const {
          error
        } = await supabaseClient
          .from("cart_items")
          .insert({
            cart_id:
              cart.id,
            product_id:
              productId,
            quantity: 1
          });

        if (error) {
          throw error;
        }
      }

      button.innerHTML = "✓";

      alert(
        "Product added to your cart."
      );

      setTimeout(() => {

        if (
          document.body.contains(button)
        ) {
          button.innerHTML =
            originalText;

          button.disabled = false;
        }

      }, 900);

    } catch (error) {

      console.error(
        "Add to cart error:",
        error
      );

      button.innerHTML =
        originalText;

      button.disabled = false;

      alert(
        error.message ||
        "Unable to add this product to your cart."
      );
    }
  }

  // =========================================
  // PROFILE MENU
  // =========================================

  if (
    profileButton &&
    profileMenu
  ) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        const isOpen =
          profileMenu.classList.contains(
            "open"
          );

        profileMenu.classList.toggle(
          "open",
          !isOpen
        );

        profileButton.setAttribute(
          "aria-expanded",
          String(!isOpen)
        );

        profileMenu.setAttribute(
          "aria-hidden",
          String(isOpen)
        );
      }
    );
  }

  document.addEventListener(
    "click",
    (event) => {

      if (
        profileMenu &&
        profileButton &&
        !profileMenu.contains(event.target) &&
        !profileButton.contains(event.target)
      ) {

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
    }
  );

  // =========================================
  // PROFILE NAVIGATION
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

  // =========================================
  // LOGOUT
  // =========================================

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        logoutButton.disabled =
          true;

        logoutButton.innerHTML =
          "<span>↪</span> Signing out...";

        try {

          const {
            error
          } =
            await supabaseClient.auth
              .signOut();

          if (error) {
            throw error;
          }

          window.location.href =
            "login.html";

 
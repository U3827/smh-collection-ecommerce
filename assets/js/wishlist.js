/* =========================================================
   SMH COLLECTION — WISHLIST
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================================================
  // DOM ELEMENTS
  // =========================================================

  const wishlistLoading =
    document.getElementById("wishlistLoading");

  const wishlistLogin =
    document.getElementById("wishlistLogin");

  const wishlistError =
    document.getElementById("wishlistError");

  const wishlistErrorMessage =
    document.getElementById("wishlistErrorMessage");

  const wishlistEmpty =
    document.getElementById("wishlistEmpty");

  const wishlistContent =
    document.getElementById("wishlistContent");

  const wishlistGrid =
    document.getElementById("wishlistGrid");

  const wishlistCount =
    document.getElementById("wishlistCount");

  const cartCount =
    document.getElementById("cartCount");

  const retryButton =
    document.getElementById("retryButton");

  const backButton =
    document.getElementById("backButton");


  // =========================================================
  // STATE
  // =========================================================

  let currentUser = null;
  let wishlistItems = [];
  let currentCart = null;


  // =========================================================
  // SUPABASE CHECK
  // =========================================================

  if (
    typeof supabaseClient === "undefined" ||
    !supabaseClient
  ) {

    console.error(
      "Supabase client is not available."
    );

    showError(
      "The connection to SMH Collection could not be established."
    );

    return;
  }


  // =========================================================
  // PAGE STATE
  // =========================================================

  function hideAllStates() {

    wishlistLoading.classList.add("hidden");
    wishlistLogin.classList.add("hidden");
    wishlistError.classList.add("hidden");
    wishlistEmpty.classList.add("hidden");
    wishlistContent.classList.add("hidden");

  }


  function showLoading() {

    hideAllStates();

    wishlistLoading.classList.remove("hidden");

  }


  function showLogin() {

    hideAllStates();

    wishlistLogin.classList.remove("hidden");

  }


  function showError(message) {

    hideAllStates();

    wishlistErrorMessage.textContent =
      message ||
      "Something went wrong while loading your wishlist.";

    wishlistError.classList.remove("hidden");

  }


  function showEmpty() {

    hideAllStates();

    wishlistEmpty.classList.remove("hidden");

  }


  function showContent() {

    hideAllStates();

    wishlistContent.classList.remove("hidden");

  }


  // =========================================================
  // MESSAGE
  // =========================================================

  let messageTimer = null;

  function showMessage(
    message,
    type = "success"
  ) {

    let messageElement =
      document.getElementById("wishlistMessage");

    if (!messageElement) {

      messageElement =
        document.createElement("div");

      messageElement.id =
        "wishlistMessage";

      document.body.appendChild(
        messageElement
      );
    }

    messageElement.textContent = message;

    messageElement.className =
      `show ${type}`;

    clearTimeout(messageTimer);

    messageTimer = setTimeout(() => {

      messageElement.classList.remove(
        "show"
      );

    }, 2500);

  }


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  async function loadCurrentUser() {

    try {

      const {
        data,
        error
      } = await supabaseClient.auth.getUser();

      if (error) {

        console.error(
          "User authentication error:",
          error
        );

        currentUser = null;

        return null;
      }

      currentUser =
        data?.user || null;

      return currentUser;

    } catch (error) {

      console.error(
        "Unexpected authentication error:",
        error
      );

      currentUser = null;

      return null;
    }
  }


  // =========================================================
  // UPDATE CART COUNT
  // =========================================================

  async function updateCartCount() {

    if (!cartCount) {
      return;
    }

    await loadCurrentUser();

    if (!currentUser) {

      cartCount.textContent = "0";

      return;
    }

    try {

      const {
        data,
        error
      } = await supabaseClient
        .from("carts")
        .select(`
          id,
          cart_items (
            quantity
          )
        `)
        .eq(
          "buyer_id",
          currentUser.id
        )
        .maybeSingle();

      if (error) {

        console.error(
          "Cart count error:",
          error
        );

        cartCount.textContent = "0";

        return;
      }

      currentCart = data || null;

      if (
        !currentCart ||
        !currentCart.cart_items
      ) {

        cartCount.textContent = "0";

        return;
      }

      const totalItems =
        currentCart.cart_items.reduce(
          (total, item) =>
            total +
            Number(item.quantity || 0),
          0
        );

      cartCount.textContent =
        String(totalItems);

    } catch (error) {

      console.error(
        "Unexpected cart count error:",
        error
      );

      cartCount.textContent = "0";
    }
  }


  // =========================================================
  // LOAD WISHLIST
  // =========================================================

  async function loadWishlist() {

    showLoading();

    const user =
      await loadCurrentUser();

    if (!user) {

      wishlistCount.textContent =
        "0 items";

      showLogin();

      return;
    }

    try {

      const {
        data,
        error
      } = await supabaseClient
        .from("wishlists")
        .select(`
          id,
          product_id,
          created_at,
          products (
            id,
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
              name
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

        console.error(
          "Wishlist loading error:",
          error
        );

        showError(
          "Unable to load your wishlist. Please try again."
        );

        return;
      }

      wishlistItems =
        Array.isArray(data)
          ? data
          : [];

      updateWishlistCount();

      if (
        wishlistItems.length === 0
      ) {

        showEmpty();

        return;
      }

      renderWishlist();

      showContent();

    } catch (error) {

      console.error(
        "Unexpected wishlist loading error:",
        error
      );

      showError(
        "Something went wrong while loading your wishlist."
      );
    }
  }


  // =========================================================
  // UPDATE WISHLIST COUNT
  // =========================================================

  function updateWishlistCount() {

    const count =
      wishlistItems.length;

    wishlistCount.textContent =
      count === 1
        ? "1 item"
        : `${count} items`;

  }


  // =========================================================
  // FORMAT PRICE
  // =========================================================

  function formatPrice(price) {

    const numericPrice =
      Number(price);

    if (
      !Number.isFinite(
        numericPrice
      )
    ) {

      return "$0.00";
    }

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(
      numericPrice
    );
  }


  // =========================================================
  // ESCAPE HTML
  // =========================================================

  function escapeHtml(value) {

    return String(value ?? "")
      .replace(
        /&/g,
        "&amp;"
      )
      .replace(
        /</g,
        "&lt;"
      )
      .replace(
        />/g,
        "&gt;"
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#039;"
      );
  }


  // =========================================================
  // PRODUCT IMAGE
  // =========================================================

  function getProductImage(product) {

    if (
      product &&
      product.image_url
    ) {

      return product.image_url;
    }

    return "assets/images/product-placeholder.png";
  }


  // =========================================================
  // RENDER WISHLIST
  // =========================================================

  function renderWishlist() {

    wishlistGrid.innerHTML = "";

    wishlistItems.forEach(
      (wishlistItem) => {

        const product =
          wishlistItem.products;

        if (!product) {
          return;
        }

        const card =
          createWishlistCard(
            wishlistItem,
            product
          );

        wishlistGrid.appendChild(
          card
        );

      }
    );

    if (
      wishlistGrid.children.length === 0
    ) {

      showEmpty();
    }
  }


  // =========================================================
  // CREATE WISHLIST CARD
  // =========================================================

  function createWishlistCard(
    wishlistItem,
    product
  ) {

    const card =
      document.createElement("article");

    card.className =
      "wishlist-card";

    const categoryName =
      product.categories?.name ||
      "Product";

    const stock =
      Number(product.stock || 0);

    const isInStock =
      product.is_active === true &&
      stock > 0;

    const imageUrl =
      getProductImage(product);

    card.innerHTML = `
      <div class="wishlist-image-wrapper">

        <img
          src="${escapeHtml(imageUrl)}"
          alt="${escapeHtml(product.name)}"
          loading="lazy"
        >

        <span
          class="stock-badge ${
            isInStock
              ? "in-stock"
              : "out-of-stock"
          }"
        >
          ${
            isInStock
              ? `${stock} in stock`
              : "Out of stock"
          }
        </span>

      </div>

      <div class="wishlist-card-body">

        <div class="product-category">
          ${escapeHtml(categoryName)}
        </div>

        <h2 class="product-name">
          ${escapeHtml(product.name)}
        </h2>

        <div class="product-price">
          ${formatPrice(product.price)}
        </div>

        <div class="wishlist-actions">

          <a
            href="product.html?id=${encodeURIComponent(product.id)}"
            class="view-product-button"
          >
            View Product
          </a>

          <button
            type="button"
            class="add-cart-button"
            data-product-id="${escapeHtml(product.id)}"
            ${
              isInStock
                ? ""
                : "disabled"
            }
          >
            ${
              isInStock
                ? "Add to Cart"
                : "Unavailable"
            }
          </button>

          <button
            type="button"
            class="remove-wishlist-button"
            data-wishlist-id="${escapeHtml(wishlistItem.id)}"
            data-product-id="${escapeHtml(product.id)}"
          >
            ♡ Remove from Wishlist
          </button>

        </div>

      </div>
    `;


    // =======================================================
    // IMAGE ERROR FALLBACK
    // =======================================================

    const image =
      card.querySelector("img");

    image.addEventListener(
      "error",
      () => {

        image.src =
          "assets/images/product-placeholder.png";

      },
      {
        once: true
      }
    );


    // =======================================================
    // ADD TO CART
    // =======================================================

    const addCartButton =
      card.querySelector(
        ".add-cart-button"
      );

    if (addCartButton) {

      addCartButton.addEventListener(
        "click",
        () => {

          addToCart(
            product,
            addCartButton
          );

        }
      );
    }


    // =======================================================
    // REMOVE FROM WISHLIST
    // =======================================================

    const removeButton =
      card.querySelector(
        ".remove-wishlist-button"
      );

    if (removeButton) {

      removeButton.addEventListener(
        "click",
        () => {

          removeFromWishlist(
            wishlistItem.id,
            product.id,
            removeButton
          );

        }
      );
    }


    return card;
  }


  // =========================================================
  // REMOVE FROM WISHLIST
  // =========================================================

  async function removeFromWishlist(
    wishlistId,
    productId,
    button
  ) {

    if (!currentUser) {

      showLogin();

      return;
    }

    if (button) {

      button.disabled = true;

      button.textContent =
        "Removing...";

    }

    try {

      const {
        error
      } = await supabaseClient
        .from("wishlists")
        .delete()
        .eq(
          "id",
          wishlistId
        )
        .eq(
          "buyer_id",
          currentUser.id
        )
        .eq(
          "product_id",
          productId
        );

      if (error) {

        console.error(
          "Wishlist removal error:",
          error
        );

        throw new Error(
          "Unable to remove this product."
        );
      }

      wishlistItems =
        wishlistItems.filter(
          (item) =>
            item.id !== wishlistId
        );

      updateWishlistCount();

      showMessage(
        "Removed from your wishlist.",
        "success"
      );

      if (
        wishlistItems.length === 0
      ) {

        showEmpty();

        return;
      }

      renderWishlist();

    } catch (error) {

      console.error(
        "Remove wishlist error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to remove this product.",
        "error"
      );

      if (button) {

        button.disabled = false;

        button.textContent =
          "♡ Remove from Wishlist";
      }
    }
  }


  // =========================================================
  // GET OR CREATE CART
  // =========================================================

  async function getOrCreateCart() {

    if (!currentUser) {

      throw new Error(
        "Please log in before adding products to your cart."
      );
    }

    const {
      data: existingCart,
      error: cartError
    } = await supabaseClient
      .from("carts")
      .select("id, buyer_id")
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
        buyer_id:
          currentUser.id
      })
      .select("id, buyer_id")
      .single();

    if (createError) {

      throw createError;
    }

    return newCart;
  }


  // =========================================================
  // ADD TO CART
  // =========================================================

  async function addToCart(
    product,
    button
  ) {

    if (!currentUser) {

      showMessage(
        "Please log in to add products to your cart.",
        "error"
      );

      return;
    }

    if (
      !product ||
      !product.id
    ) {

      showMessage(
        "Product information is unavailable.",
        "error"
      );

      return;
    }

    const stock =
      Number(product.stock || 0);

    if (
      product.is_active !== true ||
      stock <= 0
    ) {

      showMessage(
        "This product is currently unavailable.",
        "error"
      );

      return;
    }

    if (button) {

      button.disabled = true;

      button.textContent =
        "Adding...";
    }

    try {

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
          product.id
        )
        .maybeSingle();

      if (existingError) {

        throw existingError;
      }

      if (existingItem) {

        const newQuantity =
          Number(
            existingItem.quantity
          ) + 1;

        if (
          newQuantity > stock
        ) {

          throw new Error(
            `Only ${stock} item${stock === 1 ? "" : "s"} available in stock.`
          );
        }

        const {
          error: updateError
        } = await supabaseClient
          .from("cart_items")
          .update({
            quantity:
              newQuantity
          })
          .eq(
            "id",
            existingItem.id
          );

        if (updateError) {

          throw updateError;
        }

      } else {

        const {
          error: insertError
        } = await supabaseClient
          .from("cart_items")
          .insert({
            cart_id:
              cart.id,

            product_id:
              product.id,

            quantity: 1
          });

        if (insertError) {

          throw insertError;
        }
      }

      showMessage(
        "Product added to your cart.",
        "success"
      );

      await updateCartCount();

    } catch (error) {

      console.error(
        "Add to cart error:",
        error
      );

      showMessage(
        error.message ||
          "Unable to add this product to your cart.",
        "error"
      );

    } finally {

      if (button) {

        button.disabled = false;

        button.textContent =
          "Add to Cart";
      }
    }
  }


  // =========================================================
  // BACK BUTTON
  // =========================================================

  function goBack() {

    if (document.referrer) {

      try {

        const referrerUrl =
          new URL(
            document.referrer
          );

        if (
          referrerUrl.origin ===
          window.location.origin
        ) {

          window.history.back();

          return;
        }

      } catch (error) {

        console.warn(
          "Could not inspect referrer."
        );
      }
    }

    window.location.href =
      "buyer-dashboard.html";
  }


  // =========================================================
  // EVENTS
  // =========================================================

  if (retryButton) {

    retryButton.addEventListener(
      "click",
      loadWishlist
    );
  }

  if (backButton) {

    backButton.addEventListener(
      "click",
      goBack
    );
  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  async function initialize() {

    await updateCartCount();

    await loadWishlist();

  }

  initialize();


 });
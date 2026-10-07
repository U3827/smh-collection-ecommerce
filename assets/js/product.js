/* =========================================================
   SMH COLLECTION — PRODUCT DETAILS PAGE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================================================
  // ELEMENTS
  // =========================================================

  const loadingState = document.getElementById("productLoading");
  const errorState = document.getElementById("productError");
  const notFoundState = document.getElementById("productNotFound");
  const productContent = document.getElementById("productContent");

  const errorMessage = document.getElementById("productErrorMessage");
  const retryButton = document.getElementById("retryButton");

  const backButton = document.getElementById("backButton");
  const cartCount = document.getElementById("cartCount");

  const productImage = document.getElementById("productImage");
  const productCategory = document.getElementById("productCategory");
  const productName = document.getElementById("productName");
  const productPrice = document.getElementById("productPrice");
  const stockStatus = document.getElementById("stockStatus");
  const productDescription = document.getElementById("productDescription");

  const decreaseQuantity = document.getElementById("decreaseQuantity");
  const increaseQuantity = document.getElementById("increaseQuantity");
  const quantityInput = document.getElementById("quantity");

  const addToCartButton = document.getElementById("addToCartButton");
  const buyNowButton = document.getElementById("buyNowButton");

  const productMessage = document.getElementById("productMessage");

  // =========================================================
  // STATE
  // =========================================================

  let currentProduct = null;
  let currentUser = null;
  let currentCart = null;

  // =========================================================
  // SUPABASE CHECK
  // =========================================================

  if (typeof supabaseClient === "undefined") {
    showError(
      "Supabase could not be initialized. Please refresh the page and try again."
    );
    return;
  }

  // =========================================================
  // PRODUCT ID
  // =========================================================

  function getProductId() {
    const params = new URLSearchParams(window.location.search);

    return (
      params.get("id") ||
      params.get("product_id") ||
      params.get("productId")
    );
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function showLoading() {
    loadingState.classList.remove("hidden");
    errorState.classList.add("hidden");
    notFoundState.classList.add("hidden");
    productContent.classList.add("hidden");
  }

  function showError(message) {
    loadingState.classList.add("hidden");
    errorState.classList.remove("hidden");
    notFoundState.classList.add("hidden");
    productContent.classList.add("hidden");

    errorMessage.textContent =
      message || "Something went wrong while loading this product.";
  }

  function showNotFound() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    notFoundState.classList.remove("hidden");
    productContent.classList.add("hidden");
  }

  function showProduct() {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    notFoundState.classList.add("hidden");
    productContent.classList.remove("hidden");
  }

  function showMessage(message, type = "") {
    productMessage.textContent = message;
    productMessage.className = "product-message";

    if (type) {
      productMessage.classList.add(type);
    }
  }

  function clearMessage() {
    productMessage.textContent = "";
    productMessage.className = "product-message";
  }

  function formatPrice(price) {
    const amount = Number(price);

    if (!Number.isFinite(amount)) {
      return "$0.00";
    }

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  function getStock(product) {
    const stock = Number(product?.stock);

    if (!Number.isFinite(stock) || stock < 0) {
      return 0;
    }

    return Math.floor(stock);
  }

  function getQuantity() {
    let quantity = parseInt(quantityInput.value, 10);

    if (!Number.isFinite(quantity) || quantity < 1) {
      quantity = 1;
    }

    const stock = getStock(currentProduct);

    if (stock > 0 && quantity > stock) {
      quantity = stock;
    }

    quantityInput.value = quantity;

    return quantity;
  }

  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  async function loadCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {
      console.warn("Could not get current user:", error.message);
      currentUser = null;
      return null;
    }

    currentUser = data?.user || null;

    return currentUser;
  }

  // =========================================================
  // LOAD PRODUCT
  // =========================================================

  async function loadProduct() {
    const productId = getProductId();

    if (!productId) {
      showNotFound();
      return;
    }

    showLoading();
    clearMessage();

    try {
      const { data, error } = await supabaseClient
        .from("products")
        .select(`
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
        `)
        .eq("id", productId)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Product loading error:", error);
        showError("We could not load this product. Please try again.");
        return;
      }

      if (!data) {
        showNotFound();
        return;
      }

      currentProduct = data;

      renderProduct(data);
      updateCartCount();

      showProduct();
    } catch (error) {
      console.error("Unexpected product error:", error);
      showError("Something went wrong while loading this product.");
    }
  }

  // =========================================================
  // RENDER PRODUCT
  // =========================================================

  function renderProduct(product) {
    const stock = getStock(product);

    productName.textContent =
      product.name || "Unnamed Product";

    productCategory.textContent =
      product.categories?.name ||
      "General";

    productPrice.textContent =
      formatPrice(product.price);

    productDescription.textContent =
      product.description ||
      "No description available.";

    // -----------------------------------------
    // IMAGE
    // -----------------------------------------

    if (product.image_url) {
      productImage.src = product.image_url;
      productImage.alt = product.name || "Product image";
    } else {
      productImage.removeAttribute("src");
      productImage.alt = "No product image available";
    }

    productImage.onerror = () => {
      productImage.removeAttribute("src");
      productImage.alt = "Image unavailable";
    };

    // -----------------------------------------
    // STOCK
    // -----------------------------------------

    if (stock > 0) {
      stockStatus.textContent =
        stock === 1
          ? "1 item available"
          : `${stock} items available`;

      stockStatus.classList.remove("out-of-stock");

      addToCartButton.disabled = false;
      buyNowButton.disabled = false;

      quantityInput.disabled = false;
      decreaseQuantity.disabled = false;
      increaseQuantity.disabled = false;

      quantityInput.max = stock;
    } else {
      stockStatus.textContent = "Out of stock";

      stockStatus.classList.add("out-of-stock");

      addToCartButton.disabled = true;
      buyNowButton.disabled = true;

      quantityInput.disabled = true;
      decreaseQuantity.disabled = true;
      increaseQuantity.disabled = true;

      quantityInput.value = 1;
      quantityInput.removeAttribute("max");
    }
  }

  // =========================================================
  // QUANTITY
  // =========================================================

  function decreaseQty() {
    if (!currentProduct) return;

    let quantity = getQuantity();

    quantity--;

    if (quantity < 1) {
      quantity = 1;
    }

    quantityInput.value = quantity;

    clearMessage();
  }

  function increaseQty() {
    if (!currentProduct) return;

    let quantity = getQuantity();
    const stock = getStock(currentProduct);

    quantity++;

    if (stock > 0 && quantity > stock) {
      quantity = stock;

      showMessage(
        `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
        "error"
      );
    } else {
      clearMessage();
    }

    quantityInput.value = quantity;
  }

  function validateQuantity() {
    if (!currentProduct) {
      return false;
    }

    const stock = getStock(currentProduct);

    if (stock <= 0) {
      showMessage("This product is out of stock.", "error");
      return false;
    }

    let quantity = parseInt(quantityInput.value, 10);

    if (!Number.isFinite(quantity) || quantity < 1) {
      quantity = 1;
    }

    if (quantity > stock) {
      quantity = stock;

      showMessage(
        `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
        "error"
      );
    }

    quantityInput.value = quantity;

    return true;
  }

  // =========================================================
  // GET / CREATE CART
  // =========================================================

  async function getOrCreateCart() {
    if (!currentUser) {
      return null;
    }

    // -----------------------------------------
    // Find existing cart
    // -----------------------------------------

    const { data: existingCart, error: findError } =
      await supabaseClient
        .from("carts")
        .select("id, buyer_id")
        .eq("buyer_id", currentUser.id)
        .maybeSingle();

    if (findError) {
      console.error("Cart lookup error:", findError);
      throw new Error("Unable to access your cart.");
    }

    if (existingCart) {
      currentCart = existingCart;
      return existingCart;
    }

    // -----------------------------------------
    // Create cart
    // -----------------------------------------

    const { data: newCart, error: createError } =
      await supabaseClient
        .from("carts")
        .insert({
          buyer_id: currentUser.id
        })
        .select("id, buyer_id")
        .single();

    if (createError) {
      console.error("Cart creation error:", createError);
      throw new Error("Unable to create your cart.");
    }

    currentCart = newCart;

    return newCart;
  }

  // =========================================================
  // ADD PRODUCT TO CART
  // =========================================================

  async function addToCart(quantity = 1) {
    if (!currentProduct) {
      return false;
    }

    // -----------------------------------------
    // Authentication
    // -----------------------------------------

    await loadCurrentUser();

    if (!currentUser) {
      showMessage(
        "Please log in before adding products to your cart.",
        "error"
      );

      setTimeout(() => {
        window.location.href =
          "login.html?redirect=" +
          encodeURIComponent(window.location.href);
      }, 900);

      return false;
    }

    // -----------------------------------------
    // Stock
    // -----------------------------------------

    const stock = getStock(currentProduct);

    if (stock <= 0) {
      showMessage("This product is out of stock.", "error");
      return false;
    }

    if (quantity > stock) {
      showMessage(
        `Only ${stock} item${stock === 1 ? "" : "s"} available.`,
        "error"
      );
      return false;
    }

    // -----------------------------------------
    // Cart
    // -----------------------------------------

    const cart = await getOrCreateCart();

    if (!cart) {
      throw new Error("Unable to access your cart.");
    }

    // -----------------------------------------
    // Check existing cart item
    // -----------------------------------------

    const { data: existingItem, error: itemError } =
      await supabaseClient
        .from("cart_items")
        .select("id, cart_id, product_id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", currentProduct.id)
        .maybeSingle();

    if (itemError) {
      console.error("Cart item lookup error:", itemError);
      throw new Error("Unable to check your cart.");
    }

    // -----------------------------------------
    // Existing item → increase quantity
    // -----------------------------------------

    if (existingItem) {
      const newQuantity =
        Number(existingItem.quantity) + quantity;

      if (newQuantity > stock) {
        showMessage(
          `You can only add up to ${stock} item${stock === 1 ? "" : "s"} of this product.`,
          "error"
        );

        return false;
      }

      const { error: updateError } =
        await supabaseClient
          .from("cart_items")
          .update({
            quantity: newQuantity
          })
          .eq("id", existingItem.id);

      if (updateError) {
        console.error("Cart item update error:", updateError);
        throw new Error("Unable to update your cart.");
      }
    }

    // -----------------------------------------
    // New item
    // -----------------------------------------

    else {
      const { error: insertError } =
        await supabaseClient
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            product_id: currentProduct.id,
            quantity: quantity
          });

      if (insertError) {
        console.error("Cart item insert error:", insertError);
        throw new Error("Unable to add this product to your cart.");
      }
    }

    await updateCartCount();

    return true;
  }

  // =========================================================
  // ADD TO CART BUTTON
  // =========================================================

  async function handleAddToCart() {
    if (!validateQuantity()) {
      return;
    }

    const quantity = getQuantity();

    const originalText = addToCartButton.textContent;

    addToCartButton.disabled = true;
    buyNowButton.disabled = true;

    addToCartButton.textContent = "Adding...";

    clearMessage();

    try {
      const success = await addToCart(quantity);

      if (!success) {
        return;
      }

      showMessage(
        `${quantity} item${quantity === 1 ? "" : "s"} added to your cart.`,
        "success"
      );

      addToCartButton.textContent = "✓ Added to Cart";

      setTimeout(() => {
        addToCartButton.textContent = originalText;

        if (getStock(currentProduct) > 0) {
          addToCartButton.disabled = false;
          buyNowButton.disabled = false;
        }
      }, 1200);
    } catch (error) {
      console.error("Add to cart error:", error);

      showMessage(
        error.message || "Unable to add this product to your cart.",
        "error"
      );

      addToCartButton.textContent = originalText;

      if (getStock(currentProduct) > 0) {
        addToCartButton.disabled = false;
        buyNowButton.disabled = false;
      }
    }
  }

  // =========================================================
  // BUY NOW
  // =========================================================

  async function handleBuyNow() {
    if (!validateQuantity()) {
      return;
    }

    const quantity = getQuantity();

    const originalText = buyNowButton.textContent;

    buyNowButton.disabled = true;
    addToCartButton.disabled = true;

    buyNowButton.textContent = "Preparing...";

    clearMessage();

    try {
      const success = await addToCart(quantity);

      if (!success) {
        buyNowButton.textContent = originalText;

        if (getStock(currentProduct) > 0) {
          buyNowButton.disabled = false;
          addToCartButton.disabled = false;
        }

        return;
      }

      window.location.href = "checkout.html";
    } catch (error) {
      console.error("Buy now error:", error);

      showMessage(
        error.message || "Unable to continue to checkout.",
        "error"
      );

      buyNowButton.textContent = originalText;

      if (getStock(currentProduct) > 0) {
        buyNowButton.disabled = false;
        addToCartButton.disabled = false;
      }
    }
  }

  // =========================================================
  // CART COUNT
  // =========================================================

  async function updateCartCount() {
    try {
      await loadCurrentUser();

      if (!currentUser) {
        cartCount.textContent = "0";
        return;
      }

      const cart = await getOrCreateCart();

      if (!cart) {
        cartCount.textContent = "0";
        return;
      }

      const { data, error } = await supabaseClient
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);

      if (error) {
        console.warn("Cart count error:", error);
        cartCount.textContent = "0";
        return;
      }

      const totalItems = (data || []).reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      cartCount.textContent =
        totalItems > 99
          ? "99+"
          : String(totalItems);
    } catch (error) {
      console.warn("Unable to update cart count:", error);
      cartCount.textContent = "0";
    }
  }

  // =========================================================
  // BACK BUTTON
  // =========================================================

  function goBack() {
    if (document.referrer) {
      try {
        const referrerUrl = new URL(document.referrer);

        if (referrerUrl.origin === window.location.origin) {
          window.history.back();
          return;
        }
      } catch (error) {
        console.warn("Could not inspect referrer.");
      }
    }

    window.location.href = "buyer-dashboard.html";
  }

  // =========================================================
  // EVENTS
  // =========================================================

  decreaseQuantity.addEventListener(
    "click",
    decreaseQty
  );

  increaseQuantity.addEventListener(
    "click",
    increaseQty
  );

  quantityInput.addEventListener(
    "input",
    () => {
      clearMessage();
    }
  );

  quantityInput.addEventListener(
    "blur",
    () => {
      validateQuantity();
    }
  );

  addToCartButton.addEventListener(
    "click",
    handleAddToCart
  );

  buyNowButton.addEventListener(
    "click",
    handleBuyNow
  );

  backButton.addEventListener(
    "click",
    goBack
  );

  retryButton.addEventListener(
    "click",
    loadProduct
  );

  // =========================================================
  // INITIALIZE
  // =========================================================

  loadProduct();
});
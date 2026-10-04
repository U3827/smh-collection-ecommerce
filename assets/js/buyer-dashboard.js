// =========================================
// SMH COLLECTION
// BUYER DASHBOARD
// REAL SUPABASE DATA + PROFILE + CART
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("SMH Collection Buyer Dashboard loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const currentYear = document.getElementById("currentYear");

  const profileButton = document.getElementById("profileButton");
  const profileMenu = document.getElementById("profileMenu");
  const profileAvatar = document.getElementById("profileAvatar");

  const profileName = document.getElementById("profileName");
  const menuAvatar = document.getElementById("menuAvatar");
  const menuName = document.getElementById("menuName");
  const menuEmail = document.getElementById("menuEmail");

  const logoutButton = document.getElementById("logoutButton");
  const myOrdersButton = document.getElementById("myOrdersButton");
  const wishlistButton = document.getElementById("wishlistButton");
  const settingsButton = document.getElementById("settingsButton");
  const cartButton = document.getElementById("cartButton");
  const cartCount = document.getElementById("cartCount");

  const welcomeName = document.getElementById("welcomeName");

  const productSearch = document.getElementById("productSearch");
  const searchButton = document.getElementById("searchButton");

  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");

  const viewProductsButton =
    document.getElementById("viewProductsButton");

  // =========================================
  // YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }

  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (typeof window.supabase === "undefined") {
    console.error("Supabase library is missing.");
    return;
  }

  if (typeof supabaseClient === "undefined") {
    console.error("supabaseClient is missing.");
    return;
  }

  // =========================================
  // STATE
  // =========================================

  let currentUser = null;
  let currentProfile = null;
  let allProducts = [];

  // =========================================
  // HELPERS
  // =========================================

  function escapeHTML(value) {
    if (value === null || value === undefined) {
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
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  }

  function getInitials(name) {
    if (!name) {
      return "SM";
    }

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }

  function showEmptyState(show) {
    if (emptyState) {
      emptyState.style.display = show ? "block" : "none";
    }
  }

  // =========================================
  // LOAD CURRENT USER
  // =========================================

  async function loadCurrentUser() {
    const {
      data: { user },
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      throw error;
    }

    if (!user) {
      window.location.href = "login.html";
      return false;
    }

    currentUser = user;
    return true;
  }

  // =========================================
  // LOAD PROFILE
  // =========================================

  async function loadProfile() {
    if (!currentUser) {
      return;
    }

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
      throw new Error("Your profile could not be found.");
    }

    if (!profile.is_active) {
      await supabaseClient.auth.signOut();

      window.location.href = "login.html";
      return;
    }

    // =========================================
    // ROLE PROTECTION
    // =========================================

    if (profile.role === "admin") {
      window.location.href = "admin-dashboard.html";
      return;
    }

    if (profile.role === "seller") {
      window.location.href = "seller-dashboard.html";
      return;
    }

    if (profile.role !== "buyer") {
      throw new Error(
        "Your account has an invalid account role."
      );
    }

    currentProfile = profile;

    // =========================================
    // PROFILE DISPLAY
    // =========================================

    const name =
      profile.full_name ||
      currentUser.user_metadata?.full_name ||
      "SMH Customer";

    const email =
      profile.email ||
      currentUser.email ||
      "";

    const initials = getInitials(name);

    if (profileName) {
      profileName.textContent = name;
    }

    if (menuName) {
      menuName.textContent = name;
    }

    if (menuEmail) {
      menuEmail.textContent = email;
    }

    if (welcomeName) {
      welcomeName.textContent = name;
    }

    if (profileAvatar) {
      if (profile.avatar_url) {
        profileAvatar.src = profile.avatar_url;
        profileAvatar.alt = name;
      } else {
        profileAvatar.textContent = initials;
      }
    }

    if (menuAvatar) {
      if (profile.avatar_url) {
        menuAvatar.src = profile.avatar_url;
        menuAvatar.alt = name;
      } else {
        menuAvatar.textContent = initials;
      }
    }
  }

  // =========================================
  // PROFILE MENU
  // =========================================

  function closeProfileMenu() {
    if (!profileMenu) {
      return;
    }

    profileMenu.classList.remove("open");

    if (profileButton) {
      profileButton.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    profileMenu.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function openProfileMenu() {
    if (!profileMenu) {
      return;
    }

    profileMenu.classList.add("open");

    if (profileButton) {
      profileButton.setAttribute(
        "aria-expanded",
        "true"
      );
    }

    profileMenu.setAttribute(
      "aria-hidden",
      "false"
    );

    console.log("SMH: Profile menu opened.");
  }

  function toggleProfileMenu(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!profileMenu) {
      console.error(
        "SMH ERROR: profileMenu element was not found."
      );
      return;
    }

    const isOpen =
      profileMenu.classList.contains("open");

    if (isOpen) {
      closeProfileMenu();
    } else {
      openProfileMenu();
    }
  }

  if (profileButton && profileMenu) {
    profileButton.addEventListener(
      "click",
      toggleProfileMenu
    );

    profileMenu.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();
      }
    );

    console.log(
      "SMH: Profile button and menu connected successfully."
    );
  } else {
    console.error(
      "SMH ERROR: Profile button or profile menu was not found.",
      {
        profileButton,
        profileMenu
      }
    );
  }

  // =========================================
  // CLOSE PROFILE MENU OUTSIDE
  // =========================================

  document.addEventListener(
    "click",
    (event) => {
      if (!profileMenu || !profileButton) {
        return;
      }

      if (
        !profileMenu.contains(event.target) &&
        !profileButton.contains(event.target)
      ) {
        closeProfileMenu();
      }
    }
  );

  // =========================================
  // GET / CREATE CART
  // =========================================

  async function getOrCreateCart() {
    if (!currentUser) {
      return null;
    }

    let {
      data: cart,
      error
    } = await supabaseClient
      .from("carts")
      .select("id, buyer_id")
      .eq("buyer_id", currentUser.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (cart) {
      return cart;
    }

    const result = await supabaseClient
      .from("carts")
      .insert({
        buyer_id: currentUser.id
      })
      .select("id, buyer_id")
      .single();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  // =========================================
  // UPDATE CART COUNT
  // =========================================

  async function updateCartCount() {
    if (!cartCount || !currentUser) {
      return;
    }

    try {
      const cart = await getOrCreateCart();

      if (!cart) {
        cartCount.textContent = "0";
        return;
      }

      const {
        data: items,
        error
      } = await supabaseClient
        .from("cart_items")
        .select("quantity")
        .eq("cart_id", cart.id);

      if (error) {
        throw error;
      }

      const totalQuantity = (items || []).reduce(
        (total, item) =>
          total + Number(item.quantity || 0),
        0
      );

      cartCount.textContent = totalQuantity;
    } catch (error) {
      console.error(
        "Unable to update cart count:",
        error
      );

      cartCount.textContent = "0";
    }
  }

  // =========================================
  // ADD TO CART
  // =========================================

  async function addToCart(productId) {
    try {
      const cart = await getOrCreateCart();

      if (!cart) {
        throw new Error("Your cart could not be created.");
      }

      const {
        data: existingItem,
        error: existingError
      } = await supabaseClient
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", productId)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existingItem) {
        const {
          error: updateError
        } = await supabaseClient
          .from("cart_items")
          .update({
            quantity: Number(existingItem.quantity) + 1,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingItem.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const {
          error: insertError
        } = await supabaseClient
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity: 1
          });

        if (insertError) {
          throw insertError;
        }
      }

      await updateCartCount();

      alert("Product added to your cart.");
    } catch (error) {
      console.error(
        "Add to cart error:",
        error
      );

      alert(
        error.message ||
        "Unable to add this product to your cart."
      );
    }
  }

  // =========================================
  // LOAD PRODUCTS
  // =========================================

  async function loadProducts() {
    if (!productGrid) {
      return;
    }

    productGrid.innerHTML = `
      <div class="loading-state">
        Loading products...
      </div>
    `;

    const {
      data: products,
      error
    } = await supabaseClient
      .from("products")
      .select(`
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
        created_at
      `)
      .eq("is_active", true)
      .order("created_at", {
        ascending: false
      });

    if (error) {
      throw error;
    }

    allProducts = products || [];

    renderProducts(allProducts);
  }

  // =========================================
  // RENDER PRODUCTS
  // =========================================

  function renderProducts(products) {
    if (!productGrid) {
      return;
    }

    if (!products || products.length === 0) {
      productGrid.innerHTML = "";
      showEmptyState(true);
      return;
    }

    showEmptyState(false);

    productGrid.innerHTML = products
      .map((product) => {

        const image = product.image_url
          ? `
            <img
              src="${escapeHTML(product.image_url)}"
              alt="${escapeHTML(product.name)}"
              loading="lazy"
            >
          `
          : `
            <div class="product-image-placeholder">
              SMH
            </div>
          `;

        const stockText =
          Number(product.stock) > 0
            ? `${product.stock} available`
            : "Out of stock";

        const disabled =
          Number(product.stock) <= 0
            ? "disabled"
            : "";

        return `
          <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
          >

            <a
              href="product.html?id=${encodeURIComponent(product.id)}"
              class="product-image"
              aria-label="View ${escapeHTML(product.name)}"
            >
              ${image}
            </a>

            <div class="product-content">

              <h3 class="product-name">
                ${escapeHTML(product.name)}
              </h3>

              <p class="product-description">
                ${escapeHTML(
                  product.description ||
                  "Quality product from SMH Collection."
                )}
              </p>

              <div class="product-meta">

                <strong class="product-price">
                  ${formatPrice(product.price)}
                </strong>

                <span class="product-stock">
                  ${escapeHTML(stockText)}
                </span>

              </div>

              <button
                type="button"
                class="add-to-cart-button"
                data-add-cart="${escapeHTML(product.id)}"
                ${disabled}
              >
                ${
                  Number(product.stock) > 0
                    ? "Add to Cart"
                    : "Out of Stock"
                }
              </button>

            </div>

          </article>
        `;
      })
      .join("");

    // Add-to-cart buttons
    productGrid
      .querySelectorAll("[data-add-cart]")
      .forEach((button) => {

        button.addEventListener(
          "click",
          async (event) => {

            event.preventDefault();
            event.stopPropagation();

            const productId =
              button.getAttribute("data-add-cart");

            if (!productId) {
              return;
            }

            button.disabled = true;
            button.textContent = "Adding...";

            try {
              await addToCart(productId);

              button.textContent = "Added ✓";

              setTimeout(() => {
                if (Number(
                  allProducts.find(
                    (product) =>
                      product.id === productId
                  )?.stock || 0
                ) > 0) {
                  button.disabled = false;
                  button.textContent = "Add to Cart";
                }
              }, 1200);

            } catch (error) {
              button.disabled = false;
              button.textContent = "Add to Cart";
            }
          }
        );
      });
  }

  // =========================================
  // PRODUCT SEARCH
  // =========================================

  function performProductSearch() {
    if (!productSearch) {
      return;
    }

    const searchTerm =
      productSearch.value
        .trim()
        .toLowerCase();

    if (!searchTerm) {
      renderProducts(allProducts);
      return;
    }

    const filteredProducts =
      allProducts.filter((product) => {

        const name =
          String(product.name || "")
            .toLowerCase();

        const description =
          String(product.description || "")
            .toLowerCase();

        const slug =
          String(product.slug || "")
            .toLowerCase();

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          slug.includes(searchTerm)
        );
      });

    renderProducts(filteredProducts);
  }

  if (searchButton) {
    searchButton.addEventListener(
      "click",
      performProductSearch
    );
  }

  if (productSearch) {
    productSearch.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          performProductSearch();
        }
      }
    );

    productSearch.addEventListener(
      "input",
      () => {
        if (
          productSearch.value.trim() === ""
        ) {
          renderProducts(allProducts);
        }
      }
    );
  }

  // =========================================
  // NAVIGATION
  // =========================================

  if (myOrdersButton) {
    myOrdersButton.addEventListener(
      "click",
      () => {
        window.location.href = "orders.html";
      }
    );
  }

  if (wishlistButton) {
    wishlistButton.addEventListener(
      "click",
      () => {
        window.location.href = "wishlist.html";
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

  if (cartButton) {
    cartButton.addEventListener(
      "click",
      () => {
        window.location.href = "cart.html";
      }
    );
  }

  if (viewProductsButton) {
    viewProductsButton.addEventListener(
      "click",
      () => {

        const productsSection =
          document.getElementById("productsSection");

        if (productsSection) {
          productsSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
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
        logoutButton.textContent = "Signing out...";

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

          logoutButton.disabled = false;
          logoutButton.textContent = "Sign Out";

          alert(
            error.message ||
            "Unable to sign out."
          );
        }
      }
    );
  }

  // =========================================
  // INITIALIZE DASHBOARD
  // =========================================

  async function initializeDashboard() {

    try {

      console.log(
        "SMH: Starting buyer dashboard..."
      );

      const authenticated =
        await loadCurrentUser();

      if (!authenticated) {
        return;
      }

      await loadProfile();

      if (!currentProfile) {
        return;
      }

      await loadProducts();

      await updateCartCount();

      console.log(
        "SMH: Buyer dashboard initialized successfully."
      );

    } catch (error) {

      console.error(
        "SMH Buyer Dashboard Error:",
        error
      );

      if (productGrid) {
// =========================================
// SMH COLLECTION
// BUYER DASHBOARD
// REAL SUPABASE MARKETPLACE
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("SMH Buyer Dashboard loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const profileButton = document.getElementById("profileButton");
  const profileMenu = document.getElementById("profileMenu");

  const myOrdersButton = document.getElementById("myOrdersButton");
  const wishlistButton = document.getElementById("wishlistButton");
  const settingsButton = document.getElementById("settingsButton");
  const logoutButton = document.getElementById("logoutButton");

  const profileName = document.getElementById("profileName");
  const welcomeName = document.getElementById("welcomeName");
  const profileAvatar = document.getElementById("profileAvatar");
  const menuAvatar = document.getElementById("menuAvatar");
  const menuName = document.getElementById("menuName");
  const menuEmail = document.getElementById("menuEmail");

  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");

  const productSearch = document.getElementById("productSearch");
  const searchButton = document.getElementById("searchButton");

  const cartCount = document.getElementById("cartCount");
  const cartButton = document.getElementById("cartButton");

  const currentYear = document.getElementById("currentYear");


  // =========================================
  // YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (typeof supabaseClient === "undefined") {

    console.error("Supabase client is unavailable.");

    if (productGrid) {
      productGrid.innerHTML = `
        <div class="loading-card">
          Unable to connect to the marketplace.
          Please refresh the page.
        </div>
      `;
    }

    return;
  }


  // =========================================
  // STATE
  // =========================================

  let currentUser = null;
  let currentProfile = null;
  let allProducts = [];
  let currentSearch = "";


  // =========================================
  // HELPERS
  // =========================================

  function getInitials(name) {

    if (!name) {
      return "U";
    }

    const parts = name.trim().split(/\s+/);

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

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(Number(value) || 0);
  }


  function showEmptyState(show) {

    if (emptyState) {
      emptyState.hidden = !show;
    }
  }


  // =========================================
  // AUTHENTICATED USER
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
  // PROFILE
  // =========================================

  async function loadProfile() {

    const {
      data,
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

    if (!data.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href = "login.html";

      return;
    }


    if (data.role !== "buyer") {

      if (data.role === "admin") {
        window.location.href = "admin-dashboard.html";
        return;
      }

      if (data.role === "seller") {
        window.location.href = "seller-dashboard.html";
        return;
      }

      await supabaseClient.auth.signOut();

      window.location.href = "login.html";

      return;
    }


    currentProfile = data;

    const name = data.full_name || "Shopper";
    const initials = getInitials(name);


    if (profileName) {
      profileName.textContent = name;
    }

    if (welcomeName) {
      welcomeName.textContent = name.split(" ")[0];
    }

    if (menuName) {
      menuName.textContent = name;
    }

    if (menuEmail) {
      menuEmail.textContent =
        data.email || currentUser.email || "";
    }

    if (profileAvatar) {
      profileAvatar.textContent = initials;
    }

    if (menuAvatar) {
      menuAvatar.textContent = initials;
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
      <div class="loading-card">
        Loading products...
      </div>
    `;

    const {
      data,
      error
    } = await supabaseClient
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
        created_at,
        categories (
          id,
          name,
          slug
        )
      `)
      .eq("is_active", true)
      .gt("stock", 0)
      .order("created_at", {
        ascending: false
      });


    if (error) {
      throw error;
    }


    allProducts = data || [];

    renderProducts(allProducts);
  }


  // =========================================
  // RENDER PRODUCTS
  // =========================================

  function renderProducts(products) {

    if (!productGrid) {
      return;
    }


    if (!products || !products.length) {

      showEmptyState(true);

      productGrid.innerHTML = `
        <div class="loading-card">
          No products yet.
        </div>
      `;

      return;
    }


    showEmptyState(false);


    productGrid.innerHTML = products
      .map((product) => {

        const categoryName =
          product.categories?.name || "General";

        const image = product.image_url;

        const productName =
          escapeHTML(product.name);


        return `
          <article
            class="product-card"
            data-product-id="${escapeHTML(product.id)}"
          >

            <div class="product-image">

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
                    <div class="product-placeholder">
                      ◇
                    </div>
                  `
              }

            </div>


            <div class="product-info">

              <div class="product-category">
                ${escapeHTML(categoryName)}
              </div>

              <h3 class="product-name">
                ${productName}
              </h3>

              <div class="product-price">
                ${formatPrice(product.price)}
              </div>

              <div class="product-stock">
                ${Number(product.stock)}
                available
              </div>


              <div class="product-actions">

                <button
                  type="button"
                  class="product-buy-button"
                  data-buy-id="${escapeHTML(product.id)}"
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  class="product-cart-button"
                  data-cart-id="${escapeHTML(product.id)}"
                  aria-label="Add to cart"
                >
                  🛒
                </button>

              </div>

            </div>

          </article>
        `;

      })
      .join("");


    attachProductEvents();
  }


  // =========================================
  // PRODUCT EVENTS
  // =========================================

  function attachProductEvents() {

    document
      .querySelectorAll("[data-buy-id]")
      .forEach((button) => {

        button.addEventListener("click", () => {

          const productId = button.dataset.buyId;

          window.location.href =
            `product.html?id=${encodeURIComponent(productId)}`;

        });

      });


    document
      .querySelectorAll("[data-cart-id]")
      .forEach((button) => {

        button.addEventListener("click", async () => {

          const productId = button.dataset.cartId;

          await addToCart(productId);

        });

      });
  }


  // =========================================
  // CART
  // =========================================

  async function getOrCreateCart() {

    let {
      data: cart,
      error
    } = await supabaseClient
      .from("carts")
      .select("id")
      .eq("buyer_id", currentUser.id)
      .maybeSingle();


    if (error) {
      throw error;
    }


    if (cart) {
      return cart;
    }


    const result =
      await supabaseClient
        .from("carts")
        .insert({
          buyer_id: currentUser.id
        })
        .select("id")
        .single();


    if (result.error) {
      throw result.error;
    }


    return result.data;
  }


  async function addToCart(productId) {

    try {

      const cart = await getOrCreateCart();


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
          error
        } = await supabaseClient
          .from("cart_items")
          .update({
            quantity: existingItem.quantity + 1
          })
          .eq("id", existingItem.id);


        if (error) {
          throw error;
        }

      } else {

        const {
          error
        } = await supabaseClient
          .from("cart_items")
          .insert({
            cart_id: cart.id,
            product_id: productId,
            quantity: 1
          });


        if (error) {
          throw error;
        }
      }


      await loadCartCount();

      alert("Product added to your cart.");


    } catch (error) {

      console.error("Add to cart error:", error);

      alert(
        error.message ||
        "Unable to add this product to your cart."
      );
    }
  }


  async function loadCartCount() {

    if (!cartCount) {
      return;
    }


    const {
      data: cart,
      error: cartError
    } = await supabaseClient
      .from("carts")
      .select("id")
      .eq("buyer_id", currentUser.id)
      .maybeSingle();


    if (cartError) {
      console.error(cartError);
      return;
    }


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
      console.error(error);
      return;
    }


    const total =
      (items || []).reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      );


    cartCount.textContent =
      total > 99
        ? "99+"
        : String(total);
  }


  // =========================================
  // SEARCH
  // =========================================

  function performSearch() {

    currentSearch =
      productSearch?.value
        .trim()
        .toLowerCase() || "";


    if (!currentSearch) {

      renderProducts(allProducts);

      return;
    }


    const results =
      allProducts.filter((product) => {

        const name =
          String(product.name || "").toLowerCase();

        const description =
          String(product.description || "").toLowerCase();

        const category =
          String(
            product.categories?.name || ""
          ).toLowerCase();


        return (
          name.includes(currentSearch) ||
          description.includes(currentSearch) ||
          category.includes(currentSearch)
        );
      });


    renderProducts(results);
  }


  if (searchButton) {

    searchButton.addEventListener(
      "click",
      performSearch
    );

  }


  if (productSearch) {

    productSearch.addEventListener(
      "keydown",
      (event) => {

        if (event.key === "Enter") {
          performSearch();
        }

      }
    );

  }


  // =========================================
  // PROFILE MENU
  // =========================================

  if (profileButton && profileMenu) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        const isOpen =
          profileMenu.classList.contains("open");

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


  // =========================================
  // CLOSE PROFILE MENU
  // =========================================

  document.addEventListener(
    "click",
    (event) => {

      if (
        profileMenu &&
        profileButton &&
        !profileMenu.contains(event.target) &&
        !profileButton.contains(event.target)
      ) {

        profileMenu.classList.remove("open");

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
  // ACCOUNT SETTINGS
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


        } catch (error) {

          console.error(
            "Logout error:",
            error
          );

          logoutButton.disabled = false;

          alert(
            error.message ||
            "Unable to sign out."
          );
        }
      }
    );
  }


  // =========================================
  // CART BUTTON
  // =========================================

  if (cartButton) {

    cartButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "cart.html";

      }
    );
  }


  // =========================================
  // INITIALIZE
  // =========================================

  try {

    const authenticated =
      await loadCurrentUser();


    if (!authenticated) {
      return;
    }


    await loadProfile();


    await Promise.all([
      loadProducts(),
      loadCartCount()
    ]);


    console.log(
      "Buyer dashboard initialized successfully."
    );


  } catch (error) {

    console.error(
      "Buyer dashboard initialization error:",
      error
    );


    if (productGrid) {

      productGrid.innerHTML = `
        <div class="loading-card">
          Unable to load marketplace data.
          Please refresh the page.
        </div>
      `;

    }

  }

});
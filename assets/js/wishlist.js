/* =========================================================
   SMH COLLECTION — WISHLIST
   Handles:
   - Authentication
   - Profile menu
   - Loading wishlist records
   - Loading products separately
   - Rendering wishlist cards
   - Remove from wishlist
   - Add to cart
   - Cart count
   - Empty/error states
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  // =========================================================
  // ELEMENTS
  // =========================================================

  const loadingState = document.getElementById("loadingState");
  const wishlistGrid = document.getElementById("wishlistGrid");
  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const errorMessage = document.getElementById("errorMessage");
  const retryButton = document.getElementById("retryButton");
  const wishlistCount = document.getElementById("wishlistCount");
  const currentYear = document.getElementById("currentYear");

  const profileButton = document.getElementById("profileButton");
  const profileMenu = document.getElementById("profileMenu");

  const profileAvatar = document.getElementById("profileAvatar");
  const profileName = document.getElementById("profileName");

  const menuAvatar = document.getElementById("menuAvatar");
  const menuName = document.getElementById("menuName");
  const menuEmail = document.getElementById("menuEmail");

  const myOrdersButton = document.getElementById("myOrdersButton");
  const wishlistButton = document.getElementById("wishlistButton");
  const settingsButton = document.getElementById("settingsButton");
  const logoutButton = document.getElementById("logoutButton");


  // =========================================================
  // YEAR
  // =========================================================

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // =========================================================
  // SUPABASE CHECK
  // =========================================================

  if (typeof supabaseClient === "undefined") {
    showError("Supabase could not be initialized. Please refresh the page.");
    return;
  }


  // =========================================================
  // HELPERS
  // =========================================================

  function showLoading() {
    if (loadingState) loadingState.hidden = false;
    if (wishlistGrid) wishlistGrid.hidden = true;
    if (emptyState) emptyState.hidden = true;
    if (errorState) errorState.hidden = true;
  }


  function showGrid() {
    if (loadingState) loadingState.hidden = true;
    if (wishlistGrid) wishlistGrid.hidden = false;
    if (emptyState) emptyState.hidden = true;
    if (errorState) errorState.hidden = true;
  }


  function showEmpty() {
    if (loadingState) loadingState.hidden = true;
    if (wishlistGrid) wishlistGrid.hidden = true;
    if (emptyState) emptyState.hidden = false;
    if (errorState) errorState.hidden = true;
  }


  function showError(message) {
    if (loadingState) loadingState.hidden = true;
    if (wishlistGrid) wishlistGrid.hidden = true;
    if (emptyState) emptyState.hidden = true;
    if (errorState) errorState.hidden = false;

    if (errorMessage) {
      errorMessage.textContent =
        message || "We could not load your saved products.";
    }
  }


  function escapeHtml(value) {
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
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "₦0";
    }

    return `₦${number.toLocaleString("en-NG")}`;
  }


  function getInitials(name) {
    if (!name) {
      return "U";
    }

    const words = String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[words.length - 1].charAt(0)
    ).toUpperCase();
  }


  // =========================================================
  // PROFILE
  // =========================================================

  async function loadProfile(user) {
    if (!user) {
      return;
    }

    let fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      "Account";

    let avatarUrl =
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      "";

    try {
      const { data, error } = await supabaseClient
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (!error && data) {
        if (data.full_name) {
          fullName = data.full_name;
        }

        if (data.avatar_url) {
          avatarUrl = data.avatar_url;
        }
      }
    } catch (error) {
      console.warn("Profile lookup failed:", error);
    }

    const initials = getInitials(fullName);

    if (profileName) {
      profileName.textContent = fullName;
    }

    if (menuName) {
      menuName.textContent = fullName;
    }

    if (menuEmail) {
      menuEmail.textContent = user.email || "";
    }

    if (profileAvatar) {
      if (avatarUrl) {
        profileAvatar.innerHTML =
          `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(fullName)}">`;
      } else {
        profileAvatar.textContent = initials;
      }
    }

    if (menuAvatar) {
      if (avatarUrl) {
        menuAvatar.innerHTML =
          `<img src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(fullName)}">`;
      } else {
        menuAvatar.textContent = initials;
      }
    }
  }


  // =========================================================
  // PROFILE MENU
  // =========================================================

  function closeProfileMenu() {
    if (!profileMenu || !profileButton) {
      return;
    }

    profileMenu.classList.remove("open");
    profileMenu.setAttribute("aria-hidden", "true");
    profileButton.setAttribute("aria-expanded", "false");
  }


  function toggleProfileMenu() {
    if (!profileMenu || !profileButton) {
      return;
    }

    const isOpen = profileMenu.classList.contains("open");

    if (isOpen) {
      closeProfileMenu();
    } else {
      profileMenu.classList.add("open");
      profileMenu.setAttribute("aria-hidden", "false");
      profileButton.setAttribute("aria-expanded", "true");
    }
  }


  if (profileButton) {
    profileButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleProfileMenu();
    });
  }


  if (profileMenu) {
    profileMenu.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }


  document.addEventListener("click", () => {
    closeProfileMenu();
  });


  // =========================================================
  // ACCOUNT NAVIGATION
  // =========================================================

  if (myOrdersButton) {
    myOrdersButton.addEventListener("click", () => {
      window.location.href = "orders.html";
    });
  }


  if (wishlistButton) {
    wishlistButton.addEventListener("click", () => {
      window.location.href = "wishlist.html";
    });
  }


  if (settingsButton) {
    settingsButton.addEventListener("click", () => {
      window.location.href = "account-settings.html";
    });
  }


  // =========================================================
  // LOGOUT
  // =========================================================

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      logoutButton.disabled = true;
      logoutButton.textContent = "Signing Out...";

      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        console.error("Logout error:", error);

        logoutButton.disabled = false;
        logoutButton.innerHTML = "<span>↪</span> Sign Out";

        alert("Unable to sign out. Please try again.");
        return;
      }

      window.location.href = "login.html";
    });
  }


  // =========================================================
  // ADD TO CART
  // =========================================================

  async function addToCart(product) {
    if (!product) {
      return;
    }

    try {
      const {
        data: {
          user
        }
      } = await supabaseClient.auth.getUser();

      if (!user) {
        window.location.href = "login.html";
        return;
      }

      /*
        This stores cart data in localStorage.

        If your existing buyer dashboard already uses
        another cart structure, we will connect this to
        that structure after testing the wishlist itself.
      */

      let cart = [];

      try {
        cart = JSON.parse(
          localStorage.getItem("smh_cart") || "[]"
        );
      } catch {
        cart = [];
      }

      const existingIndex = cart.findIndex(
        item => item.product_id === product.id
      );

      if (existingIndex !== -1) {
        cart[existingIndex].quantity =
          Number(cart[existingIndex].quantity || 1) + 1;
      } else {
        cart.push({
          product_id: product.id,
          name: product.name,
          price: Number(product.price || 0),
          image_url: product.image_url || "",
          quantity: 1
        });
      }

      localStorage.setItem(
        "smh_cart",
        JSON.stringify(cart)
      );

      updateCartCount();

      alert("Product added to cart.");
    } catch (error) {
      console.error("Add to cart error:", error);
      alert("Unable to add this product to cart.");
    }
  }


  // =========================================================
  // CART COUNT
  // =========================================================

  function updateCartCount() {
    let cart = [];

    try {
      cart = JSON.parse(
        localStorage.getItem("smh_cart") || "[]"
      );
    } catch {
      cart = [];
    }

    const count = cart.reduce(
      (total, item) =>
        total + Number(item.quantity || 1),
      0
    );

    document
      .querySelectorAll("[data-cart-count]")
      .forEach(element => {
        element.textContent = count;
      });
  }


  // =========================================================
  // REMOVE FROM WISHLIST
  // =========================================================

  async function removeFromWishlist(wishlistId, button) {
    if (!wishlistId) {
      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Removing...";
    }

    const {
      error
    } = await supabaseClient
      .from("wishlists")
      .delete()
      .eq("id", wishlistId);

    if (error) {
      console.error("Remove wishlist error:", error);

      if (button) {
        button.disabled = false;
        button.textContent = "Remove";
      }

      alert("Unable to remove this product from your wishlist.");
      return;
    }

    await loadWishlist();
  }


  // =========================================================
  // RENDER WISHLIST
  // =========================================================

  function renderWishlist(items) {
    if (!wishlistGrid) {
      return;
    }

    wishlistGrid.innerHTML = "";

    if (!items || items.length === 0) {
      showEmpty();

      if (wishlistCount) {
        wishlistCount.textContent = "0 saved products";
      }

      return;
    }

    if (wishlistCount) {
      wishlistCount.textContent =
        `${items.length} saved product${items.length === 1 ? "" : "s"}`;
    }

    items.forEach(item => {
      const product = item.product;

      if (!product) {
        return;
      }

      const card = document.createElement("article");

      card.className = "wishlist-card";

      const imageUrl =
        product.image_url ||
        "assets/images/product-placeholder.png";

      const categoryName =
        product.category?.name ||
        "Product";

      const stock = Number(product.stock || 0);

      let stockBadge = "";

      if (stock <= 0) {
        stockBadge =
          `<span class="stock-badge out-of-stock">Out of Stock</span>`;
      } else if (stock <= 5) {
        stockBadge =
          `<span class="stock-badge low-stock">Only ${stock} left</span>`;
      } else {
        stockBadge =
          `<span class="stock-badge in-stock">In Stock</span>`;
      }

      card.innerHTML = `
        <div class="wishlist-image-wrapper">

          <img
            src="${escapeHtml(imageUrl)}"
            alt="${escapeHtml(product.name || "Product")}"
            class="wishlist-product-image"
            loading="lazy"
            onerror="this.src='assets/images/product-placeholder.png'"
          >

          ${stockBadge}

        </div>

        <div class="wishlist-card-body">

          <p class="product-category">
            ${escapeHtml(categoryName)}
          </p>

          <h2 class="product-name">
            ${escapeHtml(product.name || "Unnamed Product")}
          </h2>

          <p class="product-price">
            ${formatPrice(product.price)}
          </p>

          <div class="wishlist-actions">

            <button
              type="button"
              class="view-product-button"
              data-product-id="${escapeHtml(product.id)}"
            >
              View Product
            </button>

            <button
              type="button"
              class="add-cart-button"
              data-product-id="${escapeHtml(product.id)}"
              ${stock <= 0 ? "disabled" : ""}
            >
              Add to Cart
            </button>

            <button
              type="button"
              class="remove-wishlist-button"
              data-wishlist-id="${escapeHtml(item.id)}"
            >
              Remove
            </button>

          </div>

        </div>
      `;

      // View product
      const viewButton =
        card.querySelector(".view-product-button");

      if (viewButton) {
        viewButton.addEventListener("click", () => {
          const productId = product.id;

          const slug = product.slug;

          if (slug) {
            window.location.href =
              `product.html?slug=${encodeURIComponent(slug)}`;
          } else {
            window.location.href =
              `product.html?id=${encodeURIComponent(productId)}`;
          }
        });
      }


      // Add to cart
      const cartButton =
        card.querySelector(".add-cart-button");

      if (cartButton) {
        cartButton.addEventListener("click", async () => {
          await addToCart(product);
        });
      }


      // Remove
      const removeButton =
        card.querySelector(".remove-wishlist-button");

      if (removeButton) {
        removeButton.addEventListener("click", async () => {
          await removeFromWishlist(
            item.id,
            removeButton
          );
        });
      }


      wishlistGrid.appendChild(card);
    });

    showGrid();
  }


  // =========================================================
  // LOAD WISHLIST
  // =========================================================

  async function loadWishlist() {
    showLoading();

    if (wishlistCount) {
      wishlistCount.textContent =
        "Loading wishlist...";
    }

    try {
      // -----------------------------------------------------
      // 1. GET CURRENT USER
      // -----------------------------------------------------

      const {
        data: {
          user
        },
        error: userError
      } = await supabaseClient.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        window.location.href = "login.html";
        return;
      }


      // -----------------------------------------------------
      // 2. LOAD PROFILE
      // -----------------------------------------------------

      await loadProfile(user);


      // -----------------------------------------------------
      // 3. LOAD WISHLIST RECORDS
      //
      // IMPORTANT:
      // We do NOT use a nested products() relationship here.
      // We first get the wishlist rows directly.
      // -----------------------------------------------------

      const {
        data: wishlistRows,
        error: wishlistError
      } = await supabaseClient
        .from("wishlists")
        .select(
          "id, buyer_id, product_id, created_at"
        )
        .eq("buyer_id", user.id)
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (wishlistError) {
        throw wishlistError;
      }


      // -----------------------------------------------------
      // 4. EMPTY WISHLIST
      // -----------------------------------------------------

      if (!wishlistRows || wishlistRows.length === 0) {
        renderWishlist([]);
        return;
      }


      // -----------------------------------------------------
      // 5. GET PRODUCT IDs
      // -----------------------------------------------------

      const productIds = [
        ...new Set(
          wishlistRows
            .map(row => row.product_id)
            .filter(Boolean)
        )
      ];

      if (productIds.length === 0) {
        renderWishlist([]);
        return;
      }


      // -----------------------------------------------------
      // 6. LOAD PRODUCTS DIRECTLY
      // -----------------------------------------------------

      const {
        data: products,
        error: productsError
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
          is_active
        `)
        .in("id", productIds);

      if (productsError) {
        throw productsError;
      }


      // -----------------------------------------------------
      // 7. LOAD CATEGORIES
      // -----------------------------------------------------

      const categoryIds = [
        ...new Set(
          (products || [])
            .map(product => product.category_id)
            .filter(Boolean)
        )
      ];

      let categories = [];

      if (categoryIds.length > 0) {
        const {
          data: categoryData,
          error: categoryError
        } = await supabaseClient
          .from("categories")
          .select("id, name")
          .in("id", categoryIds);

        if (categoryError) {
          console.warn(
            "Category loading failed:",
            categoryError
          );
        } else {
          categories = categoryData || [];
        }
      }


      // -----------------------------------------------------
      // 8. CREATE LOOKUP MAPS
      // -----------------------------------------------------

      const productMap = new Map(
        (products || []).map(product => [
          product.id,
          product
        ])
      );

      const categoryMap = new Map(
        categories.map(category => [
          category.id,
          category
        ])
      );


      // -----------------------------------------------------
      // 9. COMBINE WISHLIST + PRODUCT DATA
      // -----------------------------------------------------

      const combinedItems = wishlistRows
        .map(row => {
          const product = productMap.get(
            row.product_id
          );

                    if (!product) {
            return null;
          }

          return {
            ...row,

            product: {
              ...product,

              category:
                categoryMap.get(
                  product.category_id
                ) || null
            }
          };
        })
        .filter(Boolean);


      // -----------------------------------------------------
      // 10. RENDER
      // -----------------------------------------------------

      renderWishlist(combinedItems);

    } catch (error) {
      console.error(
        "Wishlist loading error:",
        error
      );

      showError(
        error?.message ||
        "We could not load your saved products."
      );
    }
  }


  // =========================================================
  // RETRY
  // =========================================================

  if (retryButton) {
    retryButton.addEventListener(
      "click",
      loadWishlist
    );
  }


  // =========================================================
  // INITIALIZE
  // =========================================================

  updateCartCount();

  await loadWishlist();

});
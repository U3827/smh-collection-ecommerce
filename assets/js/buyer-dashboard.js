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

  const profileButton =
    document.getElementById("profileButton");

  const profileMenu =
    document.getElementById("profileMenu");

  const logoutButton =
    document.getElementById("logoutButton");

  const myOrdersButton =
    document.getElementById("myOrdersButton");

  const wishlistButton =
    document.getElementById("wishlistButton");

  const settingsButton =
    document.getElementById("settingsButton");

  const profileName =
    document.getElementById("profileName");

  const welcomeName =
    document.getElementById("welcomeName");

  const profileAvatar =
    document.getElementById("profileAvatar");

  const menuAvatar =
    document.getElementById("menuAvatar");

  const menuName =
    document.getElementById("menuName");

  const menuEmail =
    document.getElementById("menuEmail");

  const productGrid =
    document.getElementById("productGrid");

  const emptyState =
    document.getElementById("emptyState");

  const productSearch =
    document.getElementById("productSearch");

  const searchButton =
    document.getElementById("searchButton");

  const cartCount =
    document.getElementById("cartCount");

  const cartButton =
    document.getElementById("cartButton");

  const viewProductsButton =
    document.getElementById("viewProductsButton");

  const currentYear =
    document.getElementById("currentYear");


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

  if (typeof supabaseClient === "undefined") {

    console.error(
      "SMH ERROR: Supabase client is unavailable."
    );

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

  function getInitials(name) {

    if (!name) {
      return "U";
    }

    const parts =
      name.trim().split(/\s+/);

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

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(Number(value) || 0);
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

    currentUser = data.user;

    return true;
  }


  // =========================================
  // PROFILE
  // =========================================

  async function loadProfile() {

    if (!currentUser) {
      return;
    }

    const {
      data,
      error
    } =
      await supabaseClient
        .from("profiles")
        .select(
          "id, full_name, email, role, is_active, avatar_url"
        )
        .eq("id", currentUser.id)
        .single();

    if (error) {
      throw error;
    }

    if (!data) {

      throw new Error(
        "Your profile could not be found."
      );
    }


    // =========================================
    // ACTIVE ACCOUNT CHECK
    // =========================================

    if (!data.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }


    // =========================================
    // ROLE ROUTING
    // =========================================

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

    if (data.role !== "buyer") {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }


    currentProfile = data;


    // =========================================
    // PROFILE INFORMATION
    // =========================================

    const name =
      data.full_name ||
      currentUser.user_metadata?.full_name ||
      "Shopper";

    const email =
      data.email ||
      currentUser.email ||
      "";

    const initials =
      getInitials(name);


    if (profileName) {

      profileName.textContent =
        name;
    }


    if (welcomeName) {

      welcomeName.textContent =
        name.split(" ")[0];
    }


    if (menuName) {

      menuName.textContent =
        name;
    }


    if (menuEmail) {

      menuEmail.textContent =
        email;
    }


    if (profileAvatar) {

      profileAvatar.textContent =
        initials;
    }


    if (menuAvatar) {

      menuAvatar.textContent =
        initials;
    }
  }


  // =========================================
  // PROFILE MENU
  // =========================================

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

    console.log(
      "SMH: Profile menu opened."
    );
  }


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


  function toggleProfileMenu(event) {

    event.preventDefault();
    event.stopPropagation();

    if (!profileMenu) {

      console.error(
        "SMH ERROR: profileMenu was not found."
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


  if (
    profileButton &&
    profileMenu
  ) {

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
      "SMH: Profile menu connected."
    );

  } else {

    console.error(
      "SMH ERROR: Profile button/menu missing.",
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
  // MY ORDERS
  // =========================================

  if (myOrdersButton) {

    myOrdersButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();
        event.stopPropagation();

        console.log(
          "SMH: Opening My Orders..."
        );

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
      (event) => {

        event.preventDefault();
        event.stopPropagation();

        console.log(
          "SMH: Opening Wishlist..."
        );

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
      (event) => {

        event.preventDefault();
        event.stopPropagation();

        console.log(
          "SMH: Opening Account Settings..."
        );

        window.location.href =
          "account-settings.html";
      }
    );
  }


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

    const result =
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

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }


  // =========================================
  // CART COUNT
  // =========================================

  async function loadCartCount() {

    if (
      !cartCount ||
      !currentUser
    ) {
      return;
    }

    try {

      const cart =
        await getOrCreateCart();

      if (!cart) {

        cartCount.textContent =
          "0";

        return;
      }

      const {
        data: items,
        error
      } =
        await supabaseClient
          .from("cart_items")
          .select("quantity")
          .eq(
            "cart_id",
            cart.id
          );

      if (error) {
        throw error;
      }

      const total =
        (items || [])
          .reduce(
            (sum, item) =>
              sum +
              Number(
                item.quantity || 0
              ),
            0
          );

      cartCount.textContent =
        total > 99
          ? "99+"
          : String(total);

    } catch (error) {

      console.error(
        "Cart count error:",
        error
      );

      cartCount.textContent =
        "0";
    }
  }


  // =========================================
  // ADD TO CART
  // =========================================

  async function addToCart(productId) {

    try {

      const cart =
        await getOrCreateCart();

      if (!cart) {
        throw new Error(
          "Your cart could not be created."
        );
      }


      const {
        data: existingItem,
        error: existingError
      } =
        await supabaseClient
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
        } =
          await supabaseClient
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
        } =
          await supabaseClient
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


      await loadCartCount();

      alert(
        "Product added to your cart."
      );

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
      <div class="loading-card">
        Loading products...
      </div>
    `;


    const {
      data,
      error
    } =
      await supabaseClient
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
        .eq(
          "is_active",
          true
        )
        .gt(
          "stock",
          0
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

    allProducts =
      data || [];

    renderProducts(
      allProducts
    );
  }


  // =========================================
  // RENDER PRODUCTS
  // =========================================

  function renderProducts(
    products
  ) {

    if (!productGrid) {
      return;
    }


    if (
      !products ||
      products.length === 0
    ) {

      productGrid.innerHTML = "";

      showEmptyState(true);

      return;
    }


    showEmptyState(false);


    productGrid.innerHTML =
      products
        .map(
          (product) => {

            const categoryName =
              product.categories?.name ||
              "General";

            const image =
              product.image_url;

            const productName =
              escapeHTML(
                product.name
              );


            return `
              <article
                class="product-card"
                data-product-id="${escapeHTML(
                  product.id
                )}"
              >

                <div class="product-image">

                  ${
                    image
                      ? `
                        <img
                          src="${escapeHTML(
                            image
                          )}"
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
                    ${escapeHTML(
                      categoryName
                    )}
                  </div>

                  <h3 class="product-name">
                    ${productName}
                  </h3>

                  <div class="product-price">
                    ${formatPrice(
                      product.price
                    )}
                  </div>

                  <div class="product-stock">
                    ${Number(
                      product.stock
                    )}
                    available
                  </div>


                  <div class="product-actions">

                    <button
                      type="button"
                      class="product-buy-button"
                      data-buy-id="${escapeHTML(
                        product.id
                      )}"
                    >
                      Buy Now
                    </button>

                    <button
                      type="button"
                      class="product-cart-button"
                      data-cart-id="${escapeHTML(
                        product.id
                      )}"
                      aria-label="Add to cart"
                    >
                      🛒
                    </button>

                  </div>

                </div>

              </article>
            `;
          }
        )
        .join("");


    attachProductEvents();
  }


  // =========================================
  // PRODUCT EVENTS
  // =========================================

  function attachProductEvents() {

    document
      .querySelectorAll(
        "[data-buy-id]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            (event) => {

              event.preventDefault();

              const productId =
                button.dataset.buyId;

              if (!productId) {
                return;
              }

              window.location.href =
                `product.html?id=${encodeURIComponent(
                  productId
                )}`;
            }
          );
        }
      );


    document
      .querySelectorAll(
        "[data-cart-id]"
      )
      .forEach(
        (button) => {

          button.addEventListener(
            "click",
            async (event) => {

              event.preventDefault();

              const productId =
                button.dataset.cartId;

              if (!productId) {
                return;
              }

              button.disabled = true;

              const originalText =
                button.textContent;

              button.textContent =
                "Adding...";

              try {

                await addToCart(
                  productId
                );

                button.textContent =
                  "✓";

                setTimeout(
                  () => {

                    button.disabled =
                      false;

                    button.textContent =
                      originalText;

                  },
                  1200
                );

              } catch (error) {

                button.disabled =
                  false;

                button.textContent =
                  originalText;
              }
            }
          );
        }
      );
  }


  // =========================================
  // SEARCH
  // =========================================

  function performSearch() {

    if (!productSearch) {
      return;
    }

    const searchTerm =
      productSearch.value
        .trim()
        .toLowerCase();


    if (!searchTerm) {

      renderProducts(
        allProducts
      );

      return;
    }


    const results =
      allProducts.filter(
        (product) => {

          const name =
            String(
              product.name || ""
            ).toLowerCase();

          const description =
            String(
              product.description || ""
            ).toLowerCase();

          const category =
            String(
              pro
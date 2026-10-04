// =========================================
// SMH COLLECTION
// BUYER DASHBOARD
// REAL SUPABASE MARKETPLACE
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("SMH Collection Buyer Dashboard loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

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

  const logoutButton =
    document.getElementById("logoutButton");

  const myOrdersButton =
    document.getElementById("myOrdersButton");

  const wishlistButton =
    document.getElementById("wishlistButton");

  const settingsButton =
    document.getElementById("settingsButton");

  const cartButton =
    document.getElementById("cartButton");

  const cartCount =
    document.getElementById("cartCount");

  const welcomeName =
    document.getElementById("welcomeName");

  const categoryGrid =
    document.getElementById("categoryGrid");

  const productGrid =
    document.getElementById("productGrid");

  const emptyState =
    document.getElementById("emptyState");

  const productSearch =
    document.getElementById("productSearch");

  const searchButton =
    document.getElementById("searchButton");

  const viewCategoriesButton =
    document.getElementById(
      "viewCategoriesButton"
    );

  const viewProductsButton =
    document.getElementById(
      "viewProductsButton"
    );


  // =========================================
  // YEAR
  // =========================================

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // CHECK SUPABASE
  // =========================================

  if (
    typeof window.supabase === "undefined" ||
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase is not available."
    );

    return;
  }


  // =========================================
  // STATE
  // =========================================

  let currentUser = null;

  let currentProfile = null;

  let allProducts = [];

  let allCategories = [];


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

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }
    ).format(
      Number(value) || 0
    );
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
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  }


  // =========================================
  // LOAD CURRENT USER
  // =========================================

  async function loadCurrentUser() {

    const {
      data: {
        user
      },
      error
    } =
      await supabaseClient.auth
        .getUser();

    if (error) {
      throw error;
    }

    if (!user) {

      window.location.href =
        "login.html";

      return false;
    }

    currentUser =
      user;

    return true;
  }


  // =========================================
  // LOAD PROFILE
  // =========================================

  async function loadProfile() {

    const {
      data: profile,
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

    if (!profile) {

      throw new Error(
        "Your account profile could not be found."
      );
    }

    if (!profile.is_active) {

      await supabaseClient.auth
        .signOut();

      window.location.href =
        "login.html";

      return false;
    }


    currentProfile =
      profile;


    // =======================================
    // ROLE ROUTING
    // =======================================

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
        "Your account has an invalid role."
      );
    }


    // =======================================
    // PROFILE DISPLAY
    // =======================================

    const name =
      profile.full_name ||
      currentUser.email ||
      "Shopper";

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


    if (menuEmail) {
      menuEmail.textContent =
        profile.email ||
        currentUser.email ||
        "";
    }


    if (menuAvatar) {
      menuAvatar.textContent =
        initials;
    }


    if (welcomeName) {

      const firstName =
        name
          .trim()
          .split(/\s+/)[0];

      welcomeName.textContent =
        firstName ||
        "Shopper";
    }


    return true;
  }


  // =========================================
  // LOAD CATEGORIES
  // =========================================

  async function loadCategories() {

    if (!categoryGrid) {
      return;
    }

    categoryGrid.innerHTML = `
      <div class="loading-card">
        Loading categories...
      </div>
    `;


    const {
      data: categories,
      error
    } =
      await supabaseClient
        .from("categories")
        .select(
          "id, name, slug, description, image_url"
        )
        .eq(
          "is_active",
          true
        )
        .order(
          "name",
          {
            ascending: true
          }
        );


    if (error) {
      throw error;
    }


    allCategories =
      categories || [];


    renderCategories(
      allCategories
    );
  }


  // =========================================
  // RENDER CATEGORIES
  // =========================================

  function renderCategories(
    categories
  ) {

    if (!categoryGrid) {
      return;
    }


    if (
      !categories ||
      categories.length === 0
    ) {

      categoryGrid.innerHTML = `
        <div class="loading-card">
          No categories available yet.
        </div>
      `;

      return;
    }


    categoryGrid.innerHTML =
      categories
        .map(
          (category) => {

            const image =
              category.image_url;

            return `
              <button
                type="button"
                class="category-card"
                data-category-id="${escapeHTML(
                  category.id
                )}"
              >

                <div class="category-image">

                  ${
                    image
                      ? `
                        <img
                          src="${escapeHTML(
                            image
                          )}"
                          alt="${escapeHTML(
                            category.name
                          )}"
                          loading="lazy"
                        >
                      `
                      : `
                        <span>
                          ◇
                        </span>
                      `
                  }

                </div>

                <div class="category-info">

                  <strong>
                    ${escapeHTML(
                      category.name
                    )}
                  </strong>

                  <small>
                    Explore products
                  </small>

                </div>

              </button>
            `;
          }
        )
        .join("");
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
      data: products,
      error
    } =
      await supabaseClient
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
      products || [];


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

      productGrid.innerHTML = `
        <div class="loading-card">
          No products available yet.
        </div>
      `;

      if (emptyState) {
        emptyState.hidden = false;
      }

      return;
    }


    if (emptyState) {
      emptyState.hidden = true;
    }


    productGrid.innerHTML =
      products
        .map(
          (product) => {

            const image =
              product.image_url;

            const category =
              product.categories?.name ||
              "General";


            return `
              <article
                class="product-card"
                data-product-id="${escapeHTML(
                  product.id
                )}"
              >

                <button
                  type="button"
                  class="product-image-button"
                  data-product-id="${escapeHTML(
                    product.id
                  )}"
                  aria-label="View ${
                    escapeHTML(
                      product.name
                    )
                  }"
                >

                  <div class="product-image">

                    ${
                      image
                        ? `
                          <img
                            src="${escapeHTML(
                              image
                            )}"
                            alt="${escapeHTML(
                              product.name
                            )}"
                            loading="lazy"
                          >
                        `
                        : `
                          <span>
                            ◇
                          </span>
                        `
                    }

                  </div>

                </button>


                <div class="product-info">

                  <span class="product-category">
                    ${escapeHTML(
                      category
                    )}
                  </span>


                  <h3>
                    ${escapeHTML(
                      product.name
                    )}
                  </h3>


                  <p class="product-description">

                    ${escapeHTML(
                      product.description ||
                      "Quality product available on SMH Collection."
                    )}

                  </p>


                  <div class="product-bottom">

                    <strong class="product-price">

                      ${formatPrice(
                        product.price
                      )}

                    </strong>


                    <button
                      type="button"
                      class="add-cart-button"
                      data-product-id="${escapeHTML(
                        product.id
                      )}"
                    >
                      Add to Cart
                    </button>

                  </div>

                </div>

              </article>
            `;
          }
        )
        .join("");
  }


  // =========================================
  // GET OR CREATE CART
  // =========================================

  async function getOrCreateCart() {

    const {
      data: existingCart,
      error: selectError
    } =
      await supabaseClient
        .from("carts")
        .select("id")
        .eq(
          "buyer_id",
          currentUser.id
        )
        .maybeSingle();


    if (selectError) {
      throw selectError;
    }


    if (existingCart) {
      return existingCart.id;
    }


    const {
      data: newCart,
      error: insertError
    } =
      await supabaseClient
        .from("carts")
        .insert({
          buyer_id:
            currentUser.id
        })
        .select("id")
        .single();


    if (insertError) {
      throw insertError;
    }


    return newCart.id;
  }


  // =========================================
  // ADD TO CART
  // =========================================

  async function addToCart(
    productId
  ) {

    try {

      const cartId =
        await getOrCreateCart();


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
            cartId
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
                existingItem.quantity + 1
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
                cartId,
              product_id:
                productId,
              quantity:
                1
            });


        if (error) {
          throw error;
        }
      }


      await updateCartCount();


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
  // UPDATE CART COUNT
  // =========================================

  async function updateCartCount() {

    if (!cartCount) {
      return;
    }


    try {

      const {
        data: cart,
        error: cartError
      } =
        await supabaseClient
          .from("carts")
          .select("id")
          .eq(
            "buyer_id",
            currentUser.id
          )
          .maybeSingle();


      if (cartError) {
        throw cartError;
      }


      if (!cart) {

        cartCount.textContent =
          "0";

        return;
      }


      const {
        data: items,
        error: itemsError
      } =
        await supabaseClient
          .from("cart_items")
          .select(
            "quantity"
          )
          .eq(
            "cart_id",
            cart.id
          );


      if (itemsError) {
        throw itemsError;
      }


      const totalQuantity =
        (items || [])
          .reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.quantity
              ),
            0
          );


      cartCount.textContent =
        totalQuantity > 99
          ? "99+"
          : String(
              totalQuantity
            );

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
  // PROFILE MENU
  // =========================================

  if (profileButton) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        if (profileMenu) {

          profileMenu.classList.toggle(
            "open"
          );
        }
      }
    );
  }


  document.addEventListener(
    "click",
    (event) => {

      if (
        profileMenu &&
        !profileMenu.contains(
          event.target
        ) &&
        !profileButton?.contains(
          event.target
        )
      ) {

        profileMenu.classList.remove(
          "open"
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
  // CART
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

        } catch (error) {

          console.error(
            "Logout error:",
            error
          );


          logoutButton.disabled =
            false;

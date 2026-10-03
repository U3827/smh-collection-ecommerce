/* =========================================================
   SMH COLLECTION
   Main Application
   ========================================================= */

"use strict";


/* =========================================================
   1. APPLICATION CONFIG
   ========================================================= */

const SMH = {
  name: "SMH Collection",

  cartKey: "smh_cart",

  wishlistKey: "smh_wishlist",

  currency: "USD"
};


/* =========================================================
   2. DOM HELPERS
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   3. APPLICATION STATE
   ========================================================= */

let cart = loadStorage(SMH.cartKey, []);

let wishlist = loadStorage(SMH.wishlistKey, []);


/* =========================================================
   4. LOCAL STORAGE
   ========================================================= */

function loadStorage(key, fallback) {

  try {

    const saved = localStorage.getItem(key);

    if (!saved) {
      return fallback;
    }

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      `Unable to load ${key}:`,
      error
    );

    return fallback;
  }
}


function saveStorage(key, value) {

  try {

    localStorage.setItem(
      key,
      JSON.stringify(value)
    );

  } catch (error) {

    console.error(
      `Unable to save ${key}:`,
      error
    );
  }
}


/* =========================================================
   5. CART
   ========================================================= */

function updateCartCount() {

  const cartCount = $("#cartCount");

  if (!cartCount) {
    return;
  }

  const totalItems = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  cartCount.textContent = totalItems;
}


function addToCart(product) {

  const existingItem = cart.find(
    item => item.id === product.id
  );

  if (existingItem) {

    existingItem.quantity += 1;

  } else {

    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveStorage(
    SMH.cartKey,
    cart
  );

  updateCartCount();

  showToast(
    `${product.name} added to cart`
  );
}


function removeFromCart(productId) {

  cart = cart.filter(
    item => item.id !== productId
  );

  saveStorage(
    SMH.cartKey,
    cart
  );

  updateCartCount();
}


/* =========================================================
   6. WISHLIST
   ========================================================= */

function toggleWishlist(productId) {

  const exists = wishlist.includes(productId);

  if (exists) {

    wishlist = wishlist.filter(
      id => id !== productId
    );

    showToast(
      "Removed from wishlist"
    );

  } else {

    wishlist.push(productId);

    showToast(
      "Added to wishlist"
    );
  }

  saveStorage(
    SMH.wishlistKey,
    wishlist
  );
}


/* =========================================================
   7. SEARCH
   ========================================================= */

function setupSearch() {

  const searchForm = $("#searchForm");

  const searchInput = $("#searchInput");

  if (!searchForm || !searchInput) {
    return;
  }

  searchForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const query =
        searchInput.value.trim();

      if (!query) {

        showToast(
          "Enter a product to search"
        );

        searchInput.focus();

        return;
      }

      /*
       * Product search will later connect
       * to the Supabase product database.
       */

      showToast(
        `Searching for "${query}"...`
      );

      console.log(
        "Search query:",
        query
      );
    }
  );
}


/* =========================================================
   8. HEADER ACTIONS
   ========================================================= */

function setupHeaderActions() {

  const cartButton =
    $("#cartButton");

  const wishlistButton =
    $("#wishlistButton");


  if (cartButton) {

    cartButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (cart.length === 0) {

          showToast(
            "Your cart is empty"
          );

          return;
        }

        showToast(
          `${cart.length} item(s) in your cart`
        );

        console.log(
          "Cart:",
          cart
        );
      }
    );
  }


  if (wishlistButton) {

    wishlistButton.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (wishlist.length === 0) {

          showToast(
            "Your wishlist is empty"
          );

          return;
        }

        showToast(
          `${wishlist.length} item(s) in wishlist`
        );

        console.log(
          "Wishlist:",
          wishlist
        );
      }
    );
  }
}


/* =========================================================
   9. CATEGORY ACTIONS
   ========================================================= */

function setupCategories() {

  const categoryCards =
    $$(".category-card");

  categoryCards.forEach(
    card => {

      card.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const category =
            card.querySelector("h3");

          if (!category) {
            return;
          }

          showToast(
            `${category.textContent} products coming soon`
          );

          /*
           * Later this will navigate to:
           *
           * shop.html?category=fashion
           *
           * and load products from Supabase.
           */
        }
      );
    }
  );
}


/* =========================================================
   10. VIEW ALL LINKS
   ========================================================= */

function setupViewAllLinks() {

  const links =
    $$(".view-all");

  links.forEach(
    link => {

      link.addEventListener(
        "click",
        event => {

          event.preventDefault();

          const products =
            $("#products");

          if (products) {

            products.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }
        }
      );
    }
  );
}


/* =========================================================
   11. TOAST NOTIFICATION
   ========================================================= */

function showToast(message) {

  let toast =
    $("#smhToast");

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "smhToast";

    Object.assign(
      toast.style,
      {
        position: "fixed",
        left: "50%",
        bottom: "28px",
        transform:
          "translate(-50%, 20px)",
        zIndex: "9999",
        padding:
          "12px 18px",
        border:
          "1px solid rgba(216,173,85,.35)",
        borderRadius:
          "999px",
        background:
          "#121824",
        color:
          "#f5f7fb",
        fontSize:
          "12px",
        fontWeight:
          "700",
        boxShadow:
          "0 15px 40px rgba(0,0,0,.35)",
        opacity: "0",
        transition:
          "all .25s ease",
        pointerEvents:
          "none"
      }
    );

    document.body.appendChild(toast);
  }

  toast.textContent = message;

  requestAnimationFrame(() => {

    toast.style.opacity = "1";

    toast.style.transform =
      "translate(-50%, 0)";
  });


  clearTimeout(
    toast._timeout
  );


  toast._timeout =
    setTimeout(() => {

      toast.style.opacity = "0";

      toast.style.transform =
        "translate(-50%, 20px)";

    }, 2600);
}


/* =========================================================
   12. CURRENT YEAR
   ========================================================= */

function setCurrentYear() {

  const year =
    $("#currentYear");

  if (year) {

    year.textContent =
      new Date().getFullYear();
  }
}


/* =========================================================
   13. SMOOTH ANCHOR LINKS
   ========================================================= */

function setupAnchorLinks() {

  $$('a[href^="#"]').forEach(
    link => {

      link.addEventListener(
        "click",
        event => {

          const targetId =
            link.getAttribute("href");

          if (
            !targetId ||
            targetId === "#"
          ) {
            return;
          }

          const target =
            document.querySelector(
              targetId
            );

          if (!target) {
            return;
          }

          event.preventDefault();

          target.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      );
    }
  );
}


/* =========================================================
   14. KEYBOARD SHORTCUT
   ========================================================= */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      /*
       * "/" focuses the search box.
       */

      if (
        event.key === "/" &&
        ![
          "INPUT",
          "TEXTAREA"
        ].includes(
          document.activeElement.tagName
        )
      ) {

        event.preventDefault();

        const search =
          $("#searchInput");

        if (search) {
          search.focus();
        }
      }
    }
  );
}


/* =========================================================
   15. APPLICATION INITIALIZATION
   ========================================================= */

function initializeApp() {

  updateCartCount();

  setCurrentYear();

  setupSearch();

  setupHeaderActions();

  setupCategories();

  setupViewAllLinks();

  setupAnchorLinks();

  setupKeyboardShortcuts();

  console.log(
    `${SMH.name} initialized successfully.`
  );
}


/* =========================================================
   16. START APPLICATION
   ========================================================= */

if (
  document.readyState === "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initializeApp
  );

} else {

  initializeApp();
}
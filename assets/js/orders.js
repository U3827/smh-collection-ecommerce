// =========================================
// SMH COLLECTION
// REAL BUYER ORDER HISTORY
// PART 1 OF 3
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  console.log("SMH Collection Orders loaded.");

  // =========================================
  // BASIC ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent =
      new Date().getFullYear();
  }


  // =========================================
  // ORDER ELEMENTS
  // =========================================

  const ordersList =
    document.getElementById("ordersList");

  const emptyState =
    document.getElementById("emptyState");

  const errorState =
    document.getElementById("errorState");

  const errorMessage =
    document.getElementById("errorMessage");

  const retryButton =
    document.getElementById("retryButton");

  const startShoppingButton =
    document.getElementById("startShoppingButton");

  const backToShop =
    document.getElementById("backToShop");

  const statusFilter =
    document.getElementById("statusFilter");

  const orderCount =
    document.getElementById("orderCount");


  // =========================================
  // PROFILE ELEMENTS
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

  let currentProfile = null;

  let allOrders = [];


  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (
    typeof window.supabase === "undefined" ||
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase is not available."
    );

    showError(
      "The authentication service could not be loaded."
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

    const amount =
      Number(value) || 0;

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2
      }
    ).format(amount);
  }


  function formatDate(dateValue) {

    if (!dateValue) {
      return "Date unavailable";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date unavailable";
    }

    return new Intl.DateTimeFormat(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    ).format(date);
  }


  function getInitials(name) {

    if (!name) {
      return "U";
    }

    const parts =
      String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) {
      return "U";
    }

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


  function formatStatus(status) {

    if (!status) {
      return "Unknown";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }


  function getStatusClass(status) {

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (
      allowedStatuses.includes(status)
    ) {
      return `status-${status}`;
    }

    return "status-pending";
  }


  // =========================================
  // UI STATES
  // =========================================

  function showLoading() {

    if (ordersList) {

      ordersList.hidden = false;

      ordersList.innerHTML = `
        <div class="loading-state">

          <div class="loading-spinner"></div>

          <p>
            Loading your orders...
          </p>

        </div>
      `;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
    }
  }


  function showEmpty() {

    if (ordersList) {
      ordersList.hidden = true;
    }

    if (emptyState) {
      emptyState.hidden = false;
    }

    if (errorState) {
      errorState.hidden = true;
    }

    if (orderCount) {
      orderCount.textContent =
        "No orders";
    }
  }


  function showError(message) {

    if (ordersList) {
      ordersList.hidden = true;
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
        "Something went wrong.";
    }

    if (orderCount) {
      orderCount.textContent =
        "Unable to load orders";
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


  function toggleProfileMenu() {

    if (!profileMenu) {
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


  // =========================================
  // PROFILE BUTTON EVENTS
  // =========================================

  if (profileButton) {

    profileButton.addEventListener(
      "click",
      (event) => {

        event.stopPropagation();

        toggleProfileMenu();
      }
    );
  }


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
  // LOAD PROFILE
  // =========================================

  async function loadProfile(user) {

    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select(
        "id, full_name, email, role, is_active, avatar_url"
      )
      .eq("id", user.id)
      .single();

    if (error) {
      throw error;
    }

    if (!profile) {
      throw new Error(
        "Your account profile could not be found."
      );
    }

    currentProfile = profile;

    // ---------------------------------------
    // ACCOUNT STATUS
    // ---------------------------------------

    if (!profile.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return false;
    }


    // ---------------------------------------
    // ROLE ROUTING
    // ---------------------------------------

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
        "This page is only available to buyer accounts."
      );
    }


    // ---------------------------------------
    // PROFILE DISPLAY
    // ---------------------------------------

    const name =
      profile.full_name ||
      user.email ||
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
        user.email ||
        "";
    }

    return true;
  }


  // =========================================
  // END OF PART 1
  // =========================================
  // =========================================
  // LOAD ORDERS
  // =========================================

  async function loadOrders() {

    showLoading();

    try {

      const {
        data: orders,
        error
      } = await supabaseClient
        .from("orders")
        .select(`
          id,
          order_number,
          status,
          payment_method,
          payment_status,
          subtotal,
          delivery_fee,
          total_amount,
          shipping_name,
          phone,
          address,
          city,
          state,
          country,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            product_id,
            seller_id,
            product_name,
            product_price,
            quantity,
            item_total
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

      allOrders =
        Array.isArray(orders)
          ? orders
          : [];

      renderOrders(
        getFilteredOrders()
      );

    } catch (error) {

      console.error(
        "Orders loading error:",
        error
      );

      showError(
        error.message ||
        "Unable to load your orders."
      );
    }
  }


  // =========================================
  // FILTER ORDERS
  // =========================================

  function getFilteredOrders() {

    const selectedStatus =
      statusFilter
        ? statusFilter.value
        : "all";

    if (
      selectedStatus === "all"
    ) {
      return allOrders;
    }

    return allOrders.filter(
      (order) =>
        order.status ===
        selectedStatus
    );
  }


  // =========================================
  // RENDER ORDERS
  // =========================================

  function renderOrders(orders) {

    if (
      !orders ||
      orders.length === 0
    ) {

      if (
        allOrders.length === 0
      ) {

        showEmpty();

      } else {

        if (ordersList) {

          ordersList.hidden = false;

          ordersList.innerHTML = `
            <div class="empty-state">

              <div class="empty-icon">
                📦
              </div>

              <h2>
                No matching orders
              </h2>

              <p>
                There are no orders with the
                selected status.
              </p>

            </div>
          `;
        }

        if (emptyState) {
          emptyState.hidden = true;
        }

        if (errorState) {
          errorState.hidden = true;
        }

        if (orderCount) {
          orderCount.textContent =
            "0 matching orders";
        }
      }

      return;
    }


    if (ordersList) {
      ordersList.hidden = false;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
    }


    if (orderCount) {

      orderCount.textContent =
        `${orders.length} ${
          orders.length === 1
            ? "order"
            : "orders"
        }`;
    }


    if (!ordersList) {
      return;
    }


    ordersList.innerHTML =
      orders
        .map(
          (order) =>
            createOrderCard(order)
        )
        .join("");
  }


  // =========================================
  // CREATE ORDER CARD
  // =========================================

  function createOrderCard(order) {

    const items =
      Array.isArray(
        order.order_items
      )
        ? order.order_items
        : [];


    const visibleItems =
      items.slice(0, 4);


    const extraItemCount =
      Math.max(
        items.length - 4,
        0
      );


    // ---------------------------------------
    // ORDER ITEMS
    // ---------------------------------------

    const itemHTML =
      visibleItems.length > 0

        ? visibleItems
            .map(
              (item) => {

                const quantity =
                  Number(
                    item.quantity
                  ) || 0;

                const price =
                  Number(
                    item.product_price
                  ) || 0;

                return `
                  <div class="order-item">

                    <div class="order-item-image">

                      <div class="no-image">
                        ◇
                      </div>

                    </div>

                    <div class="order-item-info">

                      <div class="order-item-name">
                        ${escapeHTML(
                          item.product_name ||
                          "Product"
                        )}
                      </div>

                      <div class="order-item-meta">

                        ${quantity} ×
                        ${formatPrice(price)}

                      </div>

                    </div>

                  </div>
                `;
              }
            )
            .join("")

        : `
          <div class="order-item">

            <div class="order-item-info">

              <div class="order-item-name">
                No product information
              </div>

            </div>

          </div>
        `;


    // ---------------------------------------
    // EXTRA ITEMS
    // ---------------------------------------

    const extraHTML =
      extraItemCount > 0

        ? `
          <div class="order-item-meta">

            + ${extraItemCount}
            more ${
              extraItemCount === 1
                ? "item"
                : "items"
            }

          </div>
        `

        : "";


    // ---------------------------------------
    // TOTALS
    // ---------------------------------------

    const subtotal =
      Number(
        order.subtotal
      ) || 0;

    const deliveryFee =
      Number(
        order.delivery_fee
      ) || 0;

    const total =
      Number(
        order.total_amount
      ) ||
      subtotal +
      deliveryFee;


    // ---------------------------------------
    // STATUS
    // ---------------------------------------

    const status =
      order.status ||
      "pending";


    // ---------------------------------------
    // SHIPPING LOCATION
    // ---------------------------------------

    const shippingLocation =
      [
        order.city,
        order.state,
        order.country
      ]
        .filter(Boolean)
        .join(", ");


    // ---------------------------------------
    // ORDER CARD
    // ---------------------------------------

    return `
      <article
        class="order-card"
        data-order-id="${escapeHTML(
          order.id
        )}"
      >

        <div class="order-card-header">

          <div>

            <div class="order-number">
              Order #${escapeHTML(
                order.order_number ||
                order.id
              )}
            </div>

            <div class="order-date">
              ${formatDate(
                order.created_at
              )}
            </div>

          </div>


          <span
            class="order-status ${getStatusClass(
              status
            )}"
          >
            ${formatStatus(status)}
          </span>

        </div>


        <div class="order-card-body">

          <div class="order-items-preview">

            ${itemHTML}

            ${extraHTML}

          </div>


          <div class="order-summary">

            <div class="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ${formatPrice(
                  subtotal
                )}
              </strong>

            </div>


            <div class="summary-row">

              <span>
                Delivery
              </span>

              <strong>
                ${
                  deliveryFee === 0
                    ? "FREE"
                    : formatPrice(
                        deliveryFee
                      )
                }
              </strong>

            </div>


            <div class="summary-row total">

              <span>
                Total
              </span>

              <strong>
                ${formatPrice(
                  total
                )}
              </strong>

            </div>


            <div class="payment-method">

              Payment:

              <strong>
                Cash on Delivery
              </strong>

            </div>

          </div>

        </div>


        <div class="order-card-footer">

          <div class="delivery-info">

            Deliver to:

            <strong>
              ${escapeHTML(
                shippingLocation ||
                order.address ||
                "Address not provided"
              )}
            </strong>

          </div>


          <button
            type="button"
            class="view-order-button"
            data-order-id="${escapeHTML(
              order.id
            )}"
          >
            View Order
          </button>

        </div>

      </article>
    `;
  }


  // =========================================
  // STATUS FILTER EVENT
  // =========================================

  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      () => {

        renderOrders(
          getFilteredOrders()
        );
      }
    );
  }


  // =========================================
  // END OF PART 2
  // =========================================
  // =========================================
  // NAVIGATION
  // =========================================

  if (backToShop) {

    backToShop.addEventListener(
      "click",
      () => {

        window.location.href =
          "buyer-dashboard.html";
      }
    );
  }


  if (startShoppingButton) {

    startShoppingButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "buyer-dashboard.html";
      }
    );
  }


  // =========================================
  // PROFILE MENU ACTIONS
  // =========================================

  if (myOrdersButton) {

    myOrdersButton.addEventListener(
      "click",
      () => {

        closeProfileMenu();

        window.location.href =
          "orders.html";
      }
    );
  }


  if (wishlistButton) {

    wishlistButton.addEventListener(
      "click",
      () => {

        closeProfileMenu();

        window.location.href =
          "wishlist.html";
      }
    );
  }


  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      () => {

        closeProfileMenu();

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

        } catch (error) {

          console.error(
            "Logout error:",
            error
          );

          logoutButton.disabled =
            false;

          logoutButton.innerHTML =
            "<span>↪</span> Sign Out";

          alert(
            "Unable to sign out. Please try again."
          );
        }
      }
    );
  }


  // =========================================
  // VIEW ORDER
  // =========================================

  if (ordersList) {

    ordersList.addEventListener(
      "click",
      (event) => {

        const button =
          event.target.closest(
            ".view-order-button"
          );

        if (!button) {
          return;
        }

        const orderId =
          button.dataset.orderId;

        if (!orderId) {
          console.error(
            "Order ID is missing."
          );

          return;
        }

        window.location.href =
          `order-details.html?id=${encodeURIComponent(
            orderId
          )}`;
      }
    );
  }


  // =========================================
  // RETRY
  // =========================================

  if (retryButton) {

    retryButton.addEventListener(
      "click",
      async () => {

        await loadOrders();
      }
    );
  }


  // =========================================
  // INITIALIZE ORDERS PAGE
  // =========================================

  async function initializeOrders() {

    showLoading();

    try {

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


      // -------------------------------------
      // NOT LOGGED IN
      // -------------------------------------

      if (!user) {

        window.location.href =
          "login.html";

        return;
      }


      // -------------------------------------
      // SAVE CURRENT USER
      // -------------------------------------

      currentUser =
        user;


      // -------------------------------------
      // LOAD PROFILE
      // -------------------------------------

      const profileLoaded =
        await loadProfile(user);

      if (!profileLoaded) {
        return;
      }


      // -------------------------------------
      // LOAD ORDERS
      // -------------------------------------

      await loadOrders();

    } catch (error) {

      console.error(
        "Orders initialization error:",
        error
      );

      showError(
        error.message ||
        "Unable to load your orders. Please try again."
      );
    }
  }


  // =========================================
  // AUTH STATE LISTENER
  // =========================================

  supabaseClient.auth.onAuthStateChange(
    (event, session) => {

      console.log(
        "Orders auth event:",
        event
      );

      if (
        event === "SIGNED_OUT"
      ) {

        window.location.href =
          "login.html";
      }
    }
  );


  // =========================================
  // START
  // =========================================

  initializeOrders();

});
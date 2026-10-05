// =========================================
// SMH COLLECTION
// REAL BUYER ORDER HISTORY
// PART 1 OF 3
// =========================================

document.addEventListener("DOMContentLoaded", () => {

  // =========================================
  // BASIC INITIALIZATION
  // =========================================

  const currentYear = document.getElementById("currentYear");

  if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
  }


  // =========================================
  // DOM ELEMENTS
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

  const orderCount =
    document.getElementById("orderCount");

  const statusFilter =
    document.getElementById("statusFilter");

  const ordersList =
    document.getElementById("ordersList");

  const emptyState =
    document.getElementById("emptyState");

  const startShoppingButton =
    document.getElementById("startShoppingButton");

  const errorState =
    document.getElementById("errorState");

  const errorMessage =
    document.getElementById("errorMessage");

  const retryButton =
    document.getElementById("retryButton");


  // =========================================
  // PAGE STATE
  // =========================================

  let currentUser = null;
  let currentProfile = null;

  let allOrders = [];
  let filteredOrders = [];


  // =========================================
  // SUPABASE CHECK
  // =========================================

  if (typeof window.supabase === "undefined") {

    console.error(
      "Supabase library is missing."
    );

    showError(
      "Authentication service could not load. Please refresh the page."
    );

    return;
  }


  if (
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "supabaseClient is missing."
    );

    showError(
      "Supabase connection could not be initialized."
    );

    return;
  }


  // =========================================
  // HELPER FUNCTIONS
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


  function formatCurrency(amount) {

    const number =
      Number(amount) || 0;

    return new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: "USD"
      }
    ).format(number);
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
        day: "numeric"
      }
    ).format(date);
  }


  function formatDateTime(dateValue) {

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


  function formatStatus(status) {

    if (!status) {
      return "Pending";
    }

    return String(status)
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        letter => letter.toUpperCase()
      );
  }


  function getStatusClass(status) {

    const validStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (
      validStatuses.includes(status)
    ) {
      return status;
    }

    return "pending";
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
  }


  function showOrders() {

    if (ordersList) {
      ordersList.hidden = false;
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
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
        "Something went wrong while loading your orders.";
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

    if (
      !profileMenu ||
      !profileButton
    ) {
      return;
    }

    profileMenu.classList.add("open");

    profileMenu.setAttribute(
      "aria-hidden",
      "false"
    );

    profileButton.setAttribute(
      "aria-expanded",
      "true"
    );
  }


  function closeProfileMenu() {

    if (
      !profileMenu ||
      !profileButton
    ) {
      return;
    }

    profileMenu.classList.remove("open");

    profileMenu.setAttribute(
      "aria-hidden",
      "true"
    );

    profileButton.setAttribute(
      "aria-expanded",
      "false"
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
        !profileMenu ||
        !profileButton
      ) {
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
  // LOAD BUYER PROFILE
  // =========================================

  async function loadProfile(user) {

    const {
      data: profile,
      error
    } = await supabaseClient
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        avatar_url
      `)
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


    if (!profile.is_active) {

      await supabaseClient.auth.signOut();

      throw new Error(
        "Your account has been deactivated. Please contact SMH Collection support."
      );
    }


    // =========================================
    // ROLE PROTECTION
    // =========================================

    if (profile.role !== "buyer") {

      if (profile.role === "admin") {

        window.location.href =
          "admin-dashboard.html";

        return null;
      }


      if (profile.role === "seller") {

        window.location.href =
          "seller-dashboard.html";

        return null;
      }


      throw new Error(
        "Only buyer accounts can access the order history."
      );
    }


    currentProfile = profile;


    // =========================================
    // PROFILE DISPLAY
    // =========================================

    const name =
      profile.full_name ||
      user.email?.split("@")[0] ||
      "Account";

    const email =
      profile.email ||
      user.email ||
      "";

    const firstLetter =
      name.trim().charAt(0).toUpperCase() ||
      "U";


    if (profileName) {
      profileName.textContent = name;
    }

    if (profileAvatar) {
      profileAvatar.textContent =
        firstLetter;
    }

    if (menuName) {
      menuName.textContent = name;
    }

    if (menuEmail) {
      menuEmail.textContent = email;
    }

    if (menuAvatar) {
      menuAvatar.textContent =
        firstLetter;
    }


    return profile;
  }
// =========================================
// LOAD ORDERS FROM SUPABASE
// PART 2 OF 3
// =========================================

  async function loadOrders() {

    showLoading();

    try {

      if (!currentUser) {
        throw new Error(
          "You are not signed in."
        );
      }


      // =========================================
      // FETCH BUYER ORDERS
      // =========================================

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
          shipping_phone,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_country,
          notes,
          created_at,
          updated_at,
          order_items (
            id,
            product_id,
            product_name,
            product_price,
            quantity,
            item_total,
            seller_id
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


      // =========================================
      // UPDATE ORDER COUNT
      // =========================================

      updateOrderCount();


      // =========================================
      // APPLY FILTER
      // =========================================

      applyOrderFilter();


    } catch (error) {

      console.error(
        "Load orders error:",
        error
      );

      showError(
        error.message ||
        "Unable to load your orders. Please try again."
      );
    }
  }


  // =========================================
  // UPDATE ORDER COUNT
  // =========================================

  function updateOrderCount() {

    if (!orderCount) {
      return;
    }


    const count =
      allOrders.length;


    if (count === 0) {

      orderCount.textContent =
        "No orders yet";

      return;
    }


    orderCount.textContent =
      `${count} ${
        count === 1
          ? "order"
          : "orders"
      }`;
  }


  // =========================================
  // APPLY STATUS FILTER
  // =========================================

  function applyOrderFilter() {

    const selectedStatus =
      statusFilter
        ? statusFilter.value
        : "all";


    if (
      selectedStatus === "all" ||
      !selectedStatus
    ) {

      filteredOrders =
        [...allOrders];

    } else {

      filteredOrders =
        allOrders.filter(
          (order) =>
            order.status === selectedStatus
        );
    }


    renderOrders();
  }


  // =========================================
  // STATUS FILTER
  // =========================================

  if (statusFilter) {

    statusFilter.addEventListener(
      "change",
      () => {

        applyOrderFilter();

      }
    );
  }


  // =========================================
  // RENDER ORDERS
  // =========================================

  function renderOrders() {

    if (!ordersList) {
      return;
    }


    // =========================================
    // NO ORDERS
    // =========================================

    if (allOrders.length === 0) {

      showEmpty();

      return;
    }


    // =========================================
    // FILTER HAS NO RESULTS
    // =========================================

    if (filteredOrders.length === 0) {

      showOrders();

      ordersList.innerHTML = `
        <div class="empty-filter-state">

          <div class="empty-icon">
            🔎
          </div>

          <h2>
            No matching orders
          </h2>

          <p>
            There are no orders with the selected status.
          </p>

        </div>
      `;

      return;
    }


    // =========================================
    // DISPLAY ORDERS
    // =========================================

    showOrders();

    ordersList.innerHTML =
      filteredOrders
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
      Array.isArray(order.order_items)
        ? order.order_items
        : [];


    const itemCount =
      items.reduce(
        (total, item) => {

          return (
            total +
            (
              Number(item.quantity) ||
              0
            )
          );

        },
        0
      );


    const status =
      order.status ||
      "pending";


    const statusLabel =
      formatStatus(status);


    const statusClass =
      getStatusClass(status);


    const paymentMethod =
      order.payment_method ===
      "cash_on_delivery"
        ? "Cash on Delivery"
        : formatStatus(
            order.payment_method
          );


    const paymentStatus =
      order.payment_status ||
      "unpaid";


    const paymentLabel =
      formatStatus(
        paymentStatus
      );


    const total =
      Number(
        order.total_amount
      ) || 0;


    const subtotal =
      Number(
        order.subtotal
      ) || 0;


    const deliveryFee =
      Number(
        order.delivery_fee
      ) || 0;


    const orderNumber =
      order.order_number ||
      `SMH-${String(order.id)
        .slice(0, 8)
        .toUpperCase()}`;


    const createdDate =
      formatDate(
        order.created_at
      );


    const createdDateTime =
      formatDateTime(
        order.created_at
      );


    const firstItem =
      items.length > 0
        ? items[0]
        : null;


    const remainingItems =
      Math.max(
        items.length - 1,
        0
      );


    const firstProductName =
      firstItem?.product_name ||
      "Product";


    const firstProductQuantity =
      Number(
        firstItem?.quantity
      ) || 1;


    const firstProductPrice =
      Number(
        firstItem?.product_price
      ) || 0;


    const productInitial =
      firstProductName
        .trim()
        .charAt(0)
        .toUpperCase() ||
      "P";


    return `
      <article
        class="order-card"
        data-order-id="${escapeHTML(order.id)}"
      >

        <!-- =================================
             ORDER HEADER
        ================================== -->

        <div class="order-card-header">

          <div class="order-card-heading">

            <span class="order-label">
              ORDER
            </span>

            <strong class="order-number">
              ${escapeHTML(orderNumber)}
            </strong>

            <span
              class="order-date"
              title="${escapeHTML(createdDateTime)}"
            >
              ${escapeHTML(createdDate)}
            </span>

          </div>


          <span
            class="status-badge status-${escapeHTML(statusClass)}"
          >
            ${escapeHTML(statusLabel)}
          </span>

        </div>


        <!-- =================================
             ORDER BODY
        ================================== -->

        <div class="order-card-body">


          <!-- PRODUCT -->

          <div class="order-product-summary">

            <div class="product-placeholder">
              ${escapeHTML(productInitial)}
            </div>


            <div class="product-summary-content">

              <strong>
                ${escapeHTML(
                  firstProductName
                )}
              </strong>

              <span>

                ${firstProductQuantity}

                ${
                  firstProductQuantity === 1
                    ? "item"
                    : "items"
                }

                ×

                ${formatCurrency(
                  firstProductPrice
                )}

              </span>


              ${
                remainingItems > 0
                  ? `
                    <small>
                      + ${remainingItems}
                      ${
                        remainingItems === 1
                          ? "more product"
                          : "more products"
                      }
                    </small>
                  `
                  : ""
              }

            </div>

          </div>


          <!-- ORDER INFORMATION -->

          <div class="order-information">

            <div class="order-info-item">

              <span>
                Items
              </span>

              <strong>
                ${itemCount}
              </strong>

            </div>


            <div class="order-info-item">

              <span>
                Payment
              </span>

              <strong>
                ${escapeHTML(
                  paymentMethod
                )}
              </strong>

            </div>


            <div class="order-info-item">

              <span>
                Payment Status
              </span>

              <strong
                class="payment-status payment-${escapeHTML(paymentStatus)}"
              >
                ${escapeHTML(
                  paymentLabel
                )}
              </strong>

            </div>


            <div class="order-info-item total-item">

              <span>
                Total
              </span>

              <strong>
                ${formatCurrency(total)}
              </strong>

            </div>

          </div>

        </div>


        <!-- =================================
             ORDER FOOTER
        ================================== -->

        <div class="order-card-footer">

          <div class="order-total-breakdown">

            <span>
              Subtotal:
              ${formatCurrency(subtotal)}
            </span>


            <span>
              Delivery:

              ${
                deliveryFee > 0
                  ? formatCurrency(
                      deliveryFee
                    )
                  : "FREE"
              }

            </span>

          </div>


          <button
            type="button"
            class="view-order-button"
            data-order-id="${escapeHTML(order.id)}"
          >

            View Order

            <span aria-hidden="true">
              →
            </span>

          </button>

        </div>

      </article>
    `;
  }


  // =========================================
  // VIEW ORDER
  // =========================================

  if (ordersList) {

    ordersList.addEventListener(
      "click",
      (event) => {

        const viewButton =
          event.target.closest(
            ".view-order-button"
          );


        if (!viewButton) {
          return;
        }


        const orderId =
          viewButton.dataset.orderId;


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
// ACCOUNT NAVIGATION + INITIALIZATION
// PART 3 OF 3
// =========================================


  // =========================================
  // START SHOPPING
  // =========================================

  if (startShoppingButton) {

    startShoppingButton.addEventListener(
      "click",
      (event) => {

        event.preventDefault();

        window.location.href =
          "buyer-dashboard.html";
      }
    );
  }


  // =========================================
  // MY ORDERS
  // =========================================

  if (myOrdersButton) {

    myOrdersButton.addEventListener(
      "click",
      () => {

        closeProfileMenu();

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
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

        closeProfileMenu();

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

        closeProfileMenu();

        window.location.href =
          "account-settings.html";
      }
    );
  }


  // =========================================
  // SIGN OUT
  // =========================================

  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      async () => {

        closeProfileMenu();

        const originalContent =
          logoutButton.innerHTML;


        logoutButton.disabled = true;

        logoutButton.innerHTML =
          "<span>↪</span> Signing Out...";


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

          logoutButton.innerHTML =
            originalContent;


          alert(
            "Unable to sign out. Please try again."
          );
        }
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

    try {

      showLoading();


      // =========================================
      // GET CURRENT USER
      // =========================================

      const {
        data: {
          user
        },
        error: sessionError
      } =
        await supabaseClient.auth.getUser();


      if (sessionError) {
        throw sessionError;
      }


      // =========================================
      // USER NOT SIGNED IN
      // =========================================

      if (!user) {

        window.location.href =
          "login.html";

        return;
      }


      currentUser = user;


      // =========================================
      // LOAD PROFILE
      // =========================================

      const profile =
        await loadProfile(user);


      if (!profile) {
        return;
      }


      // =========================================
      // LOAD REAL ORDERS
      // =========================================

      await loadOrders();


    } catch (error) {

      console.error(
        "Orders initialization error:",
        error
      );


      showError(
        error.message ||
        "Unable to load your order history."
      );
    }
  }


  // =========================================
  // AUTH STATE LISTENER
  // =========================================

  supabaseClient.auth.onAuthStateChange(
    async (event, session) => {

      console.log(
        "Orders auth event:",
        event
      );


      if (event === "SIGNED_OUT") {

        window.location.href =
          "login.html";

        return;
      }


      if (
        !session &&
        event !== "INITIAL_SESSION"
      ) {

        window.location.href =
          "login.html";

        return;
      }
    }
  );


  // =========================================
  // START ORDERS PAGE
  // =========================================

  initializeOrders();

});
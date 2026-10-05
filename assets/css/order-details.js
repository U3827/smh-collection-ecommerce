// =========================================
// SMH COLLECTION
// ORDER DETAILS
// REAL SUPABASE ORDER DATA
// =========================================

document.addEventListener("DOMContentLoaded", async () => {

  console.log("SMH Order Details loaded.");

  // =========================================
  // ELEMENTS
  // =========================================

  const currentYear =
    document.getElementById("currentYear");

  const loadingState =
    document.getElementById("loadingState");

  const errorState =
    document.getElementById("errorState");

  const errorMessage =
    document.getElementById("errorMessage");

  const orderContent =
    document.getElementById("orderContent");

  const profileButton =
    document.getElementById("profileButton");

  const profileMenu =
    document.getElementById("profileMenu");

  const profileName =
    document.getElementById("profileName");

  const profileAvatar =
    document.getElementById("profileAvatar");

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

  const orderNumber =
    document.getElementById("orderNumber");

  const orderDate =
    document.getElementById("orderDate");

  const orderStatus =
    document.getElementById("orderStatus");

  const orderTimeline =
    document.getElementById("orderTimeline");

  const orderItems =
    document.getElementById("orderItems");

  const itemCount =
    document.getElementById("itemCount");

  const orderSubtotal =
    document.getElementById("orderSubtotal");

  const orderDelivery =
    document.getElementById("orderDelivery");

  const orderTotal =
    document.getElementById("orderTotal");

  const paymentStatus =
    document.getElementById("paymentStatus");

  const shippingName =
    document.getElementById("shippingName");

  const shippingPhone =
    document.getElementById("shippingPhone");

  const shippingAddress =
    document.getElementById("shippingAddress");

  const shippingCity =
    document.getElementById("shippingCity");

  const shippingState =
    document.getElementById("shippingState");

  const shippingCountry =
    document.getElementById("shippingCountry");

  const notesCard =
    document.getElementById("notesCard");

  const orderNotes =
    document.getElementById("orderNotes");


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

  if (
    typeof supabaseClient === "undefined"
  ) {

    console.error(
      "Supabase client is unavailable."
    );

    showError(
      "The connection to SMH Collection could not be initialized."
    );

    return;
  }


  // =========================================
  // HELPERS
  // =========================================

  let currentUser = null;
  let currentProfile = null;
  let currentOrder = null;

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
    ).format(
      Number(value) || 0
    );
  }


  function formatDate(value) {

    if (!value) {
      return "Date unavailable";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Date unavailable";
    }

    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric"
      }
    );
  }


  function formatDateTime(value) {

    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString(
      "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }
    );
  }


  function getInitials(name) {

    if (!name) {
      return "U";
    }

    const parts =
      name
        .trim()
        .split(/\s+/);

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


  function showError(message) {

    if (loadingState) {
      loadingState.hidden = true;
    }

    if (orderContent) {
      orderContent.hidden = true;
    }

    if (errorState) {
      errorState.hidden = false;
    }

    if (errorMessage) {
      errorMessage.textContent =
        message ||
        "Something went wrong while loading this order.";
    }
  }


  function hideLoading() {

    if (loadingState) {
      loadingState.hidden = true;
    }
  }


  // =========================================
  // GET ORDER ID
  // =========================================

  const params =
    new URLSearchParams(
      window.location.search
    );

  const orderId =
    params.get("id");


  if (!orderId) {

    showError(
      "No order was selected. Please return to My Orders and choose an order."
    );

    return;
  }


  // =========================================
  // LOAD CURRENT USER
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

    currentUser =
      data.user;

    return true;
  }


  // =========================================
  // LOAD PROFILE
  // =========================================

  async function loadProfile() {

    const {
      data,
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

    if (!data.is_active) {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }

    if (data.role !== "buyer") {

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

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

      return;
    }

    currentProfile =
      data;

    const name =
      data.full_name ||
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

    if (menuAvatar) {
      menuAvatar.textContent =
        initials;
    }

    if (menuName) {
      menuName.textContent =
        name;
    }

    if (menuEmail) {
      menuEmail.textContent =
        data.email ||
        currentUser.email ||
        "";
    }
  }


  // =========================================
  // LOAD ORDER
  // =========================================

  async function loadOrder() {

    /*
      RLS already protects buyer orders.

      We also explicitly filter by buyer_id
      so this page only requests the current
      buyer's order.
    */

    const {
      data,
      error
    } =
      await supabaseClient
        .from("orders")
        .select(`
          id,
          buyer_id,
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
          updated_at
        `)
        .eq(
          "id",
          orderId
        )
        .eq(
          "buyer_id",
          currentUser.id
        )
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {

      throw new Error(
        "This order could not be found or you do not have permission to view it."
      );
    }

    currentOrder =
      data;

    await loadOrderItems();
  }


  // =========================================
  // LOAD ORDER ITEMS
  // =========================================

  async function loadOrderItems() {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("order_items")
        .select(`
          id,
          order_id,
          product_id,
          seller_id,
          product_name,
          product_price,
          quantity,
          item_total,
          created_at
        `)
        .eq(
          "order_id",
          currentOrder.id
        )
        .order(
          "created_at",
          {
            ascending: true
          }
        );

    if (error) {
      throw error;
    }

    const items =
      data || [];

    await renderOrderItems(items);
  }


  // =========================================
  // LOAD PRODUCT IMAGES
  // =========================================

  async function getProductImages(items) {

    const productIds =
      items
        .map(
          item => item.product_id
        )
        .filter(Boolean);

    if (!productIds.length) {
      return {};
    }

    const {
      data,
      error
    } =
      await supabaseClient
        .from("products")
        .select(
          "id, image_url"
        )
        .in(
          "id",
          productIds
        );

    if (error) {

      console.warn(
        "Product image lookup failed:",
        error
      );

      return {};
    }

    const imageMap = {};

    (data || []).forEach(
      product => {

        imageMap[
          product.id
        ] =
          product.image_url || "";
      }
    );

    return imageMap;
  }


  // =========================================
  // RENDER ORDER ITEMS
  // =========================================

  async function renderOrderItems(items) {

    if (!orderItems) {
      return;
    }

    const imageMap =
      await getProductImages(items);

    if (!items.length) {

      orderItems.innerHTML = `
        <div class="order-notes">
          No items were found for this order.
        </div>
      `;

      if (itemCount) {
        itemCount.textContent =
          "0 items";
      }

      return;
    }


    const totalQuantity =
      items.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );


    if (itemCount) {

      itemCount.textContent =
        `${totalQuantity} ${
          totalQuantity === 1
            ? "item"
            : "items"
        }`;
    }


    orderItems.innerHTML =
      items
        .map(item => {

          const image =
            imageMap[
              item.product_id
            ] || "";

          const name =
            escapeHTML(
              item.product_name ||
              "Product"
            );

          const quantity =
            Number(
              item.quantity || 0
            );

          const price =
            formatPrice(
              item.product_price
            );

          const itemTotal =
            formatPrice(
              item.item_total
            );


          return `
            <article class="order-item">

              <div class="order-item-image">

                ${
                  image
                    ? `
                      <img
                        src="${escapeHTML(image)}"
                        alt="${name}"
                        loading="lazy"
                      >
                    `
                    : `
                      <div class="order-item-placeholder">
                        ◇
                      </div>
                    `
                }

              </div>


              <div>

                <h3 class="order-item-name">
                  ${name}
                </h3>

                <p class="order-item-meta">
                  ${price} × ${quantity}
                </p>

              </div>


              <div class="order-item-price">

                <strong>
                  ${itemTotal}
                </strong>

                <small>
                  Item total
                </small>

              </div>

            </article>
          `;
        })
        .join("");
  }


  // =========================================
  // STATUS
  // =========================================

  const statusOrder = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered"
  ];


  function getStatusLabel(status) {

    const labels = {

      pending: "Pending",

      confirmed: "Confirmed",

      processing: "Processing",

      shipped: "Shipped",

      delivered: "Delivered",

      cancelled: "Cancelled"
    };

    return (
      labels[status] ||
      "Unknown"
    );
  }


  function renderStatus() {

    if (!currentOrder) {
      return;
    }

    const status =
      String(
        currentOrder.status ||
        "pending"
      ).toLowerCase();


    // -----------------------------------------
    // BADGE
    // -----------------------------------------

    if (orderStatus) {

      orderStatus.textContent =
        getStatusLabel(status);

      orderStatus.className =
        "status-badge";

      orderStatus.classList.add(
        `status-${status}`
      );
    }


    // -----------------------------------------
    // TIMELINE
    // -----------------------------------------

    if (!orderTimeline) {
      return;
    }

    const steps =
      orderTimeline.querySelectorAll(
        ".timeline-step"
      );


    if (status === "cancelled") {

      steps.forEach(step => {

        step.classList.remove(
          "active",
          "completed"
        );
      });

      return;
    }


    const currentIndex =
      statusOrder.indexOf(status);


    steps.forEach(
      (step, index) => {

        step.classList.remove(
          "active",
          "completed"
        );

        if (
          currentIndex >= 0 &&
          index < currentIndex
        ) {

          step.classList.add(
            "completed"
          );
        }

        if (
          currentIndex >= 0 &&
          index === currentIndex
        ) {

          step.classList.add(
            "active"
          );
        }
      }
    );
  }


  // =========================================
  // RENDER ORDER INFORMATION
  // =========================================

  function renderOrder() {

    if (!currentOrder) {
      return;
    }


    if (orderNumber) {

      orderNumber.textContent =
        currentOrder.order_number ||
        "Order";
    }


    if (orderDate) {

      const created =
        formatDateTime(
          currentOrder.created_at
        );

      orderDate.textContent =
        created
          ? `Placed ${created}`
          : "Date unavailable";
    }


    if (orderSubtotal) {

      orderSubtotal.textContent =
        formatPrice(
          currentOrder.subtotal
        );
    }


    if (orderDelivery) {

      const deliveryFee =
        Number(
          currentOrder.delivery_fee || 0
        );

      orderDelivery.textContent =
        deliveryFee <= 0
          ? "FREE"
          : formatPrice(
              deliveryFee
            );
    }


    if (orderTotal) {

      orderTotal.textContent =
        formatPrice(
          currentOrder.total_amount
        );
    }


    // -----------------------------------------
    // DELIVERY INFORMATION
    // -----------------------------------------

    if (shippingName) {

      shippingName.textContent =
        currentOrder.shipping_name ||
        "Not provided";
    }


    if (shippingPhone) {

      shippingPhone.textContent =
        currentOrder.phone ||
        "Not provided";
    }


    if (shippingAddress) {

      shippingAddress.textContent =
        currentOrder.address ||
        "Not provided";
    }


    if (shippingCity) {

      shippingCity.textContent =
        currentOrder.city ||
        "Not provided";
    }


    if (shippingState) {

      shippingState.textContent =
        currentOrder.state ||
        "Not provided";
    }


    if (shippingCountry) {

      shippingCountry.textContent =
        currentOrder.country ||
        "Nigeria";
    }


    // -----------------------------------------
    // PAYMENT
    // -----------------------------------------

    if (paymentStatus) {

      if (
        currentOrder.payment_status ===
        "paid"
      ) {

        paymentStatus.textContent =
          "Payment received.";
      } else {

        paymentStatus.textContent =
          "Payment due when your order is delivered.";
      }
    }


    // -----------------------------------------
    // NOTES
    // -----------------------------------------

    const notes =
      String(
        currentOrder.notes ||
        ""
      ).trim();

    if (
      notes &&
      notesCard &&
      orderNotes
    ) {

      notesCard.hidden = false;

      orderNotes.textContent =
        notes;

    } else if (notesCard) {

      notesCard.hidden = true;
    }


    renderStatus();
  }


  // =========================================
  // PROFILE MENU
  // =========================================

  if (
    profileButton &&
    profileMenu
  ) {

    profileButton.addEventListener(
      "click",
      event => {

        event.stopPropagation();

        const isOpen =
          profileMenu.classList.contains(
            "open"
          );

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


  document.addEventListener(
    "click",
    event => {

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

        profileMenu.classList.remove(
          "open"
        );

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
  // PROFILE NAVIGATION
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


  if (wishlistButton) {

    wishlistButton.addEventListener(
      "click",
      () => {

        window.location.href =
          "wishlist.html";
      }
    );
  }


  if (settingsButton) {

    settingsButton.addEventListener(
      "click",
      () => {

       
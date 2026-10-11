
(() => {
  "use strict";

  const STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ];

  const $ = (id) => document.getElementById(id);

  const state = {
    orders: [],
    buyers: {},
    items: {},
    sellers: {},
    selectedOrder: null,
    busy: false
  };

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  const money = (value) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);

  const dateTime = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const titleCase = (value) =>
    String(value || "pending")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  function showMessage(message, type = "") {
    const box = $("pageMessage");
    box.textContent = message;
    box.className = `message ${type}`.trim();
  }

  function getBuyer(order) {
    return state.buyers[order.buyer_id] || {};
  }

  function getBuyerName(order) {
    const buyer = getBuyer(order);
    return order.shipping_name || buyer.full_name || "Customer";
  }

  function getBuyerEmail(order) {
    return getBuyer(order).email || "Not available";
  }

  function statusBadge(status) {
    const safeStatus = STATUSES.includes(String(status).toLowerCase())
      ? String(status).toLowerCase()
      : "pending";

    return `<span class="status-badge ${safeStatus}">
      ${escapeHTML(titleCase(safeStatus))}
    </span>`;
  }

  function renderStats() {
    $("totalOrders").textContent = state.orders.length;

    $("pendingOrders").textContent =
      state.orders.filter(o => o.status === "pending").length;

    $("activeOrders").textContent =
      state.orders.filter(o =>
        ["confirmed", "processing", "shipped"].includes(o.status)
      ).length;

    $("deliveredOrders").textContent =
      state.orders.filter(o => o.status === "delivered").length;
  }

  function filteredOrders() {
    const term = $("searchInput").value.trim().toLowerCase();
    const selectedStatus = $("statusFilter").value;

    return state.orders.filter(order => {
      const buyer = getBuyer(order);
      const searchable = [
        order.order_number,
        order.id,
        order.shipping_name,
        order.shipping_phone,
        buyer.full_name,
        buyer.email
      ].join(" ").toLowerCase();

      const matchesSearch = !term || searchable.includes(term);
      const matchesStatus =
        !selectedStatus || order.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  function renderOrders() {
    const orders = filteredOrders();
    $("resultCount").textContent =
      `${orders.length} order${orders.length === 1 ? "" : "s"}`;

    if (!orders.length) {
      $("ordersContainer").innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">▤</span>
          <h3>No orders found</h3>
          <p>Try changing your search or status filter.</p>
        </div>`;
      return;
    }

    $("ordersContainer").innerHTML = orders.map(order => {
      const itemCount = (state.items[order.id] || []).reduce(
        (sum, item) => sum + (Number(item.quantity) || 0), 0
      );

      return `
        <article class="order-card">
          <div class="order-card-top">
            <div>
              <div class="order-number">
                ${escapeHTML(order.order_number || order.id)}
              </div>
              <div class="order-date">${escapeHTML(dateTime(order.created_at))}</div>
            </div>
            ${statusBadge(order.status)}
          </div>

          <div class="order-card-middle">
            <div>
              <span class="detail-label">Customer</span>
              <span class="detail-value">${escapeHTML(getBuyerName(order))}</span>
            </div>
            <div>
              <span class="detail-label">Phone</span>
              <span class="detail-value">${escapeHTML(order.shipping_phone || "Not available")}</span>
            </div>
            <div>
              <span class="detail-label">Items</span>
              <span class="detail-value">${itemCount}</span>
            </div>
            <div>
              <span class="detail-label">Payment</span>
              <span class="detail-value">${escapeHTML(titleCase(order.payment_method || "Cash on Delivery"))}</span>
            </div>
            <div>
              <span class="detail-label">Payment status</span>
              <span class="detail-value">${escapeHTML(titleCase(order.payment_status || "pending"))}</span>
            </div>
            <div>
              <span class="detail-label">Order total</span>
              <span class="detail-value order-total">${escapeHTML(money(order.total_amount))}</span>
            </div>
          </div>

          <div class="order-card-bottom">
            <span class="detail-label">Order ID: ${escapeHTML(order.id)}</span>
            <button class="button primary" type="button"
              data-view-order="${escapeHTML(order.id)}">
              View details →
            </button>
          </div>
        </article>`;
    }).join("");
  }

  async function loadOrders() {
    if (state.busy) return;
    state.busy = true;
    $("refreshButton").disabled = true;
    showMessage("Loading orders from Supabase...");

    try {
      if (typeof supabaseClient === "undefined" || !supabaseClient) {
        throw new Error(
          "Supabase connection not found. Check assets/js/supabase.js."
        );
      }

      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;

      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("id, role, is_active")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || profile.role !== "admin" || profile.is_active !== true) {
        showMessage(
          "Access denied. This page is available only to active administrators.",
          "error"
        );
        return;
      }

      const { data: orders, error: ordersError } =
        await supabaseClient
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      state.orders = (orders || []).map(order => ({
        ...order,
        status: String(order.status || "pending").toLowerCase()
      }));

      state.buyers = {};
      state.items = {};
      state.sellers = {};

      const buyerIds = [...new Set(
        state.orders.map(order => order.buyer_id).filter(Boolean)
      )];

      if (buyerIds.length) {
        const { data: buyers, error: buyersError } =
          await supabaseClient
            .from("profiles")
            .select("id, full_name, email")
            .in("id", buyerIds);

        if (buyersError) throw buyersError;

        (buyers || []).forEach(buyer => {
          state.buyers[buyer.id] = buyer;
        });
      }

      const orderIds = state.orders.map(order => order.id);

      if (orderIds.length) {
        const { data: items, error: itemsError } =
          await supabaseClient
            .from("order_items")
            .select(
              "id, order_id, product_id, seller_id, product_name, product_price, quantity, item_total, created_at"
            )
            .in("order_id", orderIds);

        if (itemsError) throw itemsError;

        (items || []).forEach(item => {
          if (!state.items[item.order_id]) {
            state.items[item.order_id] = [];
          }
          state.items[item.order_id].push(item);
        });

        const sellerIds = [...new Set(
          (items || []).map(item => item.seller_id).filter(Boolean)
        )];

        if (sellerIds.length) {
          const { data: sellers, error: sellersError } =
            await supabaseClient
              .from("profiles")
              .select("id, full_name, email")
              .in("id", sellerIds);

          if (sellersError) throw sellersError;

          (sellers || []).forEach(seller => {
            state.sellers[seller.id] = seller;
          });
        }
      }

      renderStats();
      renderOrders();

      showMessage(
        `Orders loaded successfully. ${state.orders.length} order(s) found.`,
        "success"
      );
    } catch (error) {
      console.error("Admin orders error:", error);
      showMessage(
        error.message ||
        "Unable to load orders. Check your Supabase permissions.",
        "error"
      );
    } finally {
      state.busy = false;
      $("refreshButton").disabled = false;
    }
  }

  function infoItem(label, value) {
    return `
      <div class="info-item">
        <span class="detail-label">${escapeHTML(label)}</span>
        <span class="detail-value">${escapeHTML(value || "Not available")}</span>
      </div>`;
  }

  function renderOrderDetails(order) {
    const items = state.items[order.id] || [];
    const buyer = getBuyer(order);
    const dialog = $("orderDialog");

    $("dialogOrderNumber").textContent =
      order.order_number || order.id;

    const itemHTML = items.length
      ? items.map(item => {
          const seller = state.sellers[item.seller_id] || {};

          return `
            <div class="item-row">
              <div>
                <p><strong>${escapeHTML(item.product_name || "Product")}</strong></p>
                <small>
                  Quantity: ${Number(item.quantity) || 0}
                  · Unit price: ${escapeHTML(money(item.product_price))}
                </small>
                <br>
                <small>Seller: ${escapeHTML(seller.full_name || "Seller")}</small>
              </div>
              <strong>${escapeHTML(money(item.item_total))}</strong>
            </div>`;
        }).join("")
      : `<p class="subtitle">No order items were found for this order.</p>`;

    $("orderDetails").innerHTML = `
      <section class="detail-section">
        <h3>Customer information</h3>
        <div class="info-grid">
          ${infoItem("Customer name", order.shipping_name || buyer.full_name)}
          ${infoItem("Email", buyer.email)}
          ${infoItem("Phone number", order.shipping_phone)}
          ${infoItem("Order date", dateTime(order.created_at))}
        </div>
      </section>

      <section class="detail-section">
        <h3>Delivery information</h3>
        <div class="info-grid">
          ${infoItem("Address", order.shipping_address)}
          ${infoItem("City", order.shipping_city)}
          ${infoItem("State", order.shipping_state)}
          ${infoItem("Country", order.shipping_country)}
        </div>
        ${order.notes ? `<p><span class="detail-label">Customer notes</span>${escapeHTML(order.notes)}</p>` : ""}
      </section>

      <section class="detail-section">
        <h3>Products in this order</h3>
        ${itemHTML}
        <div class="totals">
          <div class="total-line">
            <span>Subtotal</span><strong>${escapeHTML(money(order.subtotal))}</strong>
          </div>
          <div class="total-line">
            <span>Delivery fee</span><strong>${escapeHTML(money(order.delivery_fee))}</strong>
          </div>
          <div class="total-line final">
            <span>Total</span><strong>${escapeHTML(money(order.total_amount))}</strong>
          </div>
        </div>
      </section>

      <section class="detail-section">
        <h3>Payment information</h3>
        <div class="info-grid">
          ${infoItem("Payment method", titleCase(order.payment_method || "Cash on Delivery"))}
          ${infoItem("Payment status", titleCase(order.payment_status || "pending"))}
        </div>
      </section>

      <section class="detail-section">
        <h3>Update order status</h3>
        <div class="status-editor">
          <label for="newOrderStatus">Choose the new status</label>
          <select id="newOrderStatus">
            ${STATUSES.map(status => `
              <option value="${status}" ${order.status === status ? "selected" : ""}>
                ${titleCase(status)}
              </option>`).join("")}
          </select>
          <button id="saveOrderStatus" class="button primary" type="button">
            Save status
          </button>
          <p id="statusSaveMessage" class="subtitle" role="status"></p>
        </div>
      </section>`;

    $("saveOrderStatus").addEventListener("click", () =>
      saveOrderStatus(order)
    );

    if (!dialog.open) dialog.showModal();
  }

  async function saveOrderStatus(order) {
    const button = $("saveOrderStatus");
    const message = $("statusSaveMessage");
    const nextStatus = $("newOrderStatus").value;

    if (!STATUSES.includes(nextStatus)) {
      message.textContent = "Please choose a valid status.";
      return;
    }

    if (nextStatus === order.status) {
      message.textContent = "This order already has that status.";
      return;
    }

    button.disabled = true;
    button.textContent = "Saving...";

    try {
      const { data: sessionData } =
        await supabaseClient.auth.getSession();

      const user = sessionData?.session?.user;

      if (!user) throw new Error("Your session has expired. Please log in again.");

      const { data: profile, error: profileError } =
        await supabaseClient
          .from("profiles")
          .select("role, is_active")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (profile?.role !== "admin" || profile?.is_active !== true) {
        throw new Error("Only active administrators can update order status.");
      }

      const { data, error } = await supabaseClient
        .from("orders")
        .update({
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", order.id)
        .select("*")
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error(
          "No order was updated. Check the orders table UPDATE policy and permissions."
        );
      }

      Object.assign(order, data, {
        status: String(data.status || nextStatus).toLowerCase()
      });

      message.textContent = "Status saved successfully.";
      showMessage(
        `Order ${order.order_number || order.id} updated to ${titleCase(nextStatus)}.`,
        "success"
      );

      renderStats();
      renderOrders();

      window.setTimeout(() => {
        if ($("orderDialog").open) $("orderDialog").close();
      }, 700);
    } catch (error) {
      console.error("Order status update error:", error);
      message.textContent = error.message || "Could not save the status.";
    } finally {
      button.disabled = false;
      button.textContent = "Save status";
    }
  }

  $("ordersContainer").addEventListener("click", event => {
    const button = event.target.closest("[data-view-order]");
    if (!button) return;

    const order = state.orders.find(
      item => item.id === button.dataset.viewOrder
    );

    if (order) renderOrderDetails(order);
  });

  $("searchInput").addEventListener("input", renderOrders);
  $("statusFilter").addEventListener("change", renderOrders);

  $("clearFilters").addEventListener("click", () => {
    $("searchInput").value = "";
    $("statusFilter").value = "";
    renderOrders();
  });

  $("refreshButton").addEventListener("click", loadOrders);
  $("closeDialog").addEventListener("click", () => {
    $("orderDialog").close();
  });

  $("orderDialog").addEventListener("click", event => {
    if (event.target === $("orderDialog")) {
      $("orderDialog").close();
    }
  });

  loadOrders();
})();

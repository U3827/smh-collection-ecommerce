
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    customers: [],
    orders: [],
    selectedCustomerId: null,
    loading: false
  };

  const elements = {
    pageMessage: $("pageMessage"),
    refreshButton: $("refreshButton"),
    totalCustomers: $("totalCustomers"),
    activeCustomers: $("activeCustomers"),
    totalCustomerOrders: $("totalCustomerOrders"),
    totalCustomerSpending: $("totalCustomerSpending"),
    resultCount: $("resultCount"),
    searchInput: $("searchInput"),
    statusFilter: $("statusFilter"),
    ordersFilter: $("ordersFilter"),
    customersTableBody: $("customersTableBody"),
    mobileCustomers: $("mobileCustomers"),
    customerDetails: $("customerDetails"),
    detailsCustomerName: $("detailsCustomerName"),
    customerProfileSummary: $("customerProfileSummary"),
    customerOrdersBody: $("customerOrdersBody"),
    closeDetailsButton: $("closeDetailsButton")
  };

  const REQUEST_TIMEOUT = 15000;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function showMessage(message, type = "info") {
    if (!elements.pageMessage) return;

    elements.pageMessage.textContent = message;
    elements.pageMessage.dataset.type = type;
    elements.pageMessage.classList.toggle("error", type === "error");
    elements.pageMessage.classList.toggle("success", type === "success");
    elements.pageMessage.hidden = false;
  }

  function setLoading(loading) {
    state.loading = loading;

    if (elements.refreshButton) {
      elements.refreshButton.disabled = loading;
      elements.refreshButton.textContent = loading
        ? "↻ Loading..."
        : "↻ Refresh";
    }
  }

  function withTimeout(promise, label) {
    let timer;

    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(
          `${label} took too long. Please refresh and try again.`
        ));
      }, REQUEST_TIMEOUT);
    });

    return Promise.race([promise, timeout]).finally(() => {
      clearTimeout(timer);
    });
  }

  function friendlyError(error) {
    const message = error?.message || "Unknown error";

    if (/permission denied|row.level security|rls/i.test(message)) {
      return `${message} Check the Supabase administrator read permissions.`;
    }

    if (/failed to fetch|network|fetch/i.test(message)) {
      return "A network error occurred. Check your internet connection and try again.";
    }

    return message;
  }

  function getCustomerOrders(customerId) {
    return state.orders.filter(
      (order) => order.buyer_id === customerId
    );
  }

  function getCustomerSpending(customerId) {
    return getCustomerOrders(customerId).reduce(
      (sum, order) => sum + (Number(order.total_amount) || 0),
      0
    );
  }

  function getCustomerName(customer) {
    return customer.full_name || "Unnamed customer";
  }

  function getAccountStatus(customer) {
    return customer.is_active === false ? "Inactive" : "Active";
  }

  function renderStats() {
    const activeCount = state.customers.filter(
      (customer) => customer.is_active !== false
    ).length;

    const spending = state.orders.reduce(
      (sum, order) => sum + (Number(order.total_amount) || 0),
      0
    );

    elements.totalCustomers.textContent = state.customers.length;
    elements.activeCustomers.textContent = activeCount;
    elements.totalCustomerOrders.textContent = state.orders.length;
    elements.totalCustomerSpending.textContent = formatMoney(spending);
  }

  function getFilteredCustomers() {
    const search = elements.searchInput.value.trim().toLowerCase();
    const status = elements.statusFilter.value;
    const orderFilter = elements.ordersFilter.value;

    return state.customers.filter((customer) => {
      const name = getCustomerName(customer).toLowerCase();
      const email = String(customer.email || "").toLowerCase();
      const orders = getCustomerOrders(customer.id);

      const matchesSearch =
        !search || name.includes(search) || email.includes(search);

      const matchesStatus =
        !status ||
        (status === "active" && customer.is_active !== false) ||
        (status === "inactive" && customer.is_active === false);

      const matchesOrders =
        !orderFilter ||
        (orderFilter === "ordered" && orders.length > 0) ||
        (orderFilter === "never" && orders.length === 0);

      return matchesSearch && matchesStatus && matchesOrders;
    });
  }

  function renderCustomers() {
    const customers = getFilteredCustomers();

    elements.resultCount.textContent =
      `${customers.length} customer${customers.length === 1 ? "" : "s"}`;

    if (!customers.length) {
      const message = state.customers.length
        ? "No customers match your search or filters."
        : "No buyer accounts were found.";

      elements.customersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-message">
            ${escapeHTML(message)}
          </td>
        </tr>
      `;

      elements.mobileCustomers.innerHTML = `
        <p class="table-message">${escapeHTML(message)}</p>
      `;

      return;
    }

    elements.customersTableBody.innerHTML = customers.map((customer) => {
      const orders = getCustomerOrders(customer.id);
      const spent = getCustomerSpending(customer.id);
      const active = customer.is_active !== false;

      return `
        <tr>
          <td>${escapeHTML(getCustomerName(customer))}</td>
          <td>${escapeHTML(customer.email || "No email")}</td>
          <td>${escapeHTML(formatDate(customer.created_at))}</td>
          <td>${orders.length}</td>
          <td>${escapeHTML(formatMoney(spent))}</td>
          <td>
            <span class="status-badge ${active ? "active" : "inactive"}">
              ${active ? "Active" : "Inactive"}
            </span>
          </td>
          <td>
            <button
              type="button"
              class="button secondary view-customer"
              data-customer-id="${escapeHTML(customer.id)}"
            >View</button>
          </td>
        </tr>
      `;
    }).join("");

    elements.mobileCustomers.innerHTML = customers.map((customer) => {
      const orders = getCustomerOrders(customer.id);
      const spent = getCustomerSpending(customer.id);
      const active = customer.is_active !== false;

      return `
        <article class="customer-card">
          <h3>${escapeHTML(getCustomerName(customer))}</h3>
          <p>${escapeHTML(customer.email || "No email")}</p>
          <p>Joined: ${escapeHTML(formatDate(customer.created_at))}</p>
          <p>Orders: ${orders.length}</p>
          <p>Total spent: ${escapeHTML(formatMoney(spent))}</p>
          <p>
            Status:
            <span class="status-badge ${active ? "active" : "inactive"}">
              ${active ? "Active" : "Inactive"}
            </span>
          </p>
          <button
            type="button"
            class="button secondary view-customer"
            data-customer-id="${escapeHTML(customer.id)}"
          >View customer</button>
        </article>
      `;
    }).join("");
  }

  function renderCustomerDetails(customerId) {
    const customer = state.customers.find(
      (item) => item.id === customerId
    );

    if (!customer) {
      showMessage("That customer could not be found. Refresh the page.", "error");
      return;
    }

    state.selectedCustomerId = customerId;

    const orders = getCustomerOrders(customerId);
    const active = customer.is_active !== false;

    elements.customerDetails.hidden = false;
    elements.detailsCustomerName.textContent = getCustomerName(customer);

    elements.customerProfileSummary.innerHTML = `
      <p><strong>Name:</strong> ${escapeHTML(getCustomerName(customer))}</p>
      <p><strong>Email:</strong> ${escapeHTML(customer.email || "No email")}</p>
      <p><strong>Joined:</strong> ${escapeHTML(formatDate(customer.created_at))}</p>
      <p><strong>Account status:</strong> ${active ? "Active" : "Inactive"}</p>
      <p><strong>Total orders:</strong> ${orders.length}</p>
      <p><strong>Total spent:</strong> ${escapeHTML(formatMoney(getCustomerSpending(customerId)))}</p>
    `;

    if (!orders.length) {
      elements.customerOrdersBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-message">
            This customer has no recorded orders.
          </td>
        </tr>
      `;
    } else {
      elements.customerOrdersBody.innerHTML = orders.map((order) => `
        <tr>
          <td>${escapeHTML(order.order_number || order.id)}</td>
          <td>${escapeHTML(formatDate(order.created_at))}</td>
          <td>${escapeHTML(order.status || "Pending")}</td>
          <td>${escapeHTML(order.payment_method || "—")} · ${escapeHTML(order.payment_status || "—")}</td>
          <td>${escapeHTML(formatMoney(order.total_amount))}</td>
        </tr>
      `).join("");
    }

    elements.customerDetails.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  async function loadCustomers() {
    const { data, error } = await withTimeout(
      supabaseClient
        .from("profiles")
        .select("id,full_name,email,is_active,created_at,role")
        .eq("role", "buyer")
        .order("created_at", { ascending: false }),
      "Loading customer profiles"
    );

    if (error) {
      console.error("Loading customers failed:", error);
      throw new Error(`Could not load buyers: ${error.message}`);
    }

    state.customers = data || [];
  }

  async function loadOrders() {
    state.orders = [];

    if (!state.customers.length) return;

    const customerIds = state.customers.map((customer) => customer.id);
    const chunkSize = 100;

    for (let index = 0; index < customerIds.length; index += chunkSize) {
      const ids = customerIds.slice(index, index + chunkSize);

      const { data, error } = await withTimeout(
        supabaseClient
          .from("orders")
          .select(
            "id,buyer_id,order_number,status,payment_method,payment_status,total_amount,created_at"
          )
          .in("buyer_id", ids)
          .order("created_at", { ascending: false }),
        "Loading customer orders"
      );

      if (error) {
        console.error("Loading customer orders failed:", error);
        throw new Error(`Could not load order history: ${error.message}`);
      }

      state.orders.push(...(data || []));
    }
  }

  async function loadPage() {
    if (state.loading) return;

    setLoading(true);
    showMessage("Loading customer profiles...", "info");
    elements.resultCount.textContent = "Loading customers...";

    try {
      await loadCustomers();

      try {
        await loadOrders();
      } catch (orderError) {
        console.error("Order history unavailable:", orderError);
        state.orders = [];
        renderStats();
        renderCustomers();

        showMessage(
          `Customer profiles loaded, but order history failed: ${friendlyError(orderError)}. Customer spending and order counts may be incomplete.`,
          "error"
        );

        if (state.selectedCustomerId) {
          renderCustomerDetails(state.selectedCustomerId);
        }

        return;
      }

      renderStats();
      renderCustomers();

      if (
        state.selectedCustomerId &&
        state.customers.some(
          (customer) => customer.id === state.selectedCustomerId
        )
      ) {
        renderCustomerDetails(state.selectedCustomerId);
      } else {
        state.selectedCustomerId = null;
        elements.customerDetails.hidden = true;
      }

      showMessage(
        `Customer records loaded successfully. ${state.customers.length} buyer account(s) found.`,
        "success"
      );
    } catch (error) {
      console.error("Admin customer page failed:", error);

      elements.resultCount.textContent = "Unable to load customers";

      elements.customersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-message">
            ${escapeHTML(friendlyError(error))}
          </td>
        </tr>
      `;

      elements.mobileCustomers.innerHTML = `
        <p class="table-message">${escapeHTML(friendlyError(error))}</p>
      `;

      showMessage(
        `Customer page error: ${friendlyError(error)}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  async function start() {
    try {
      if (typeof window.supabaseClient === "undefined" || !window.supabaseClient) {
        throw new Error(
          "Supabase client not found. Check assets/js/supabase.js and its script order."
        );
      }

      showMessage("Checking administrator access...", "info");

      const { data: sessionData, error: sessionError } = await withTimeout(
        supabaseClient.auth.getSession(),
        "Checking your login session"
      );

      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;

      if (!user) {
        window.location.href = "login.html";
        return;
      }

      const { data: profile, error: profileError } = await withTimeout(
        supabaseClient
          .from("profiles")
          .select("id,role,is_active")
          .eq("id", user.id)
          .maybeSingle(),
        "Verifying administrator permissions"
      );

      if (profileError) {
        throw new Error(
          `Could not verify your administrator profile: ${profileError.message}`
        );
      }

      if (!profile || profile.role !== "admin" || profile.is_active === false) {
        showMessage(
          "Access denied. An active administrator account is required.",
          "error"
        );

        window.setTimeout(() => {
          window.location.href = "buyer-dashboard.html";
        }, 1800);

        return;
      }

      await loadPage();
    } catch (error) {
      console.error("Admin customer page initialization failed:", error);

      showMessage(
        `Unable to open the customer page: ${friendlyError(error)}`,
        "error"
      );

      elements.resultCount.textContent = "Page failed to load";

      elements.customersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="table-message">
            ${escapeHTML(friendlyError(error))}
          </td>
        </tr>
      `;
    }
  }

  elements.searchInput.addEventListener("input", renderCustomers);
  elements.statusFilter.addEventListener("change", renderCustomers);
  elements.ordersFilter.addEventListener("change", renderCustomers);

  elements.refreshButton.addEventListener("click", () => {
    loadPage();
  });

  elements.closeDetailsButton.addEventListener("click", () => {
    elements.customerDetails.hidden = true;
    state.selectedCustomerId = null;
  });

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".view-customer");
    if (!button) return;

    renderCustomerDetails(button.dataset.customerId);
  });

  start();
})();

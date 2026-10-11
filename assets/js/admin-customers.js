/* SMH Collection — Admin Customer Management */

(() => {
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
customers: [],
orders: [],
selectedCustomerId: null
};

const money = (value) =>
new Intl.NumberFormat("en-NG", {
style: "currency",
currency: "NGN",
maximumFractionDigits: 2
}).format(Number(value) || 0);

const escapeHTML = (value) =>
String(value ?? "").replace(/[&<>"']/g, (char) => ({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
})[char]);

const formatDate = (value) => {
if (!value) return "—";

const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";

return new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric"
}).format(date);

};

function setMessage(text, type = "info") {
const element = $("pageMessage");
if (!element) return;

element.textContent = text;
element.dataset.type = type;
element.hidden = !text;

}

function initials(name) {
return String(name || "Buyer")
.trim()
.split(/\s+/)
.filter(Boolean)
.slice(0, 2)
.map((part) => part.charAt(0))
.join("")
.toUpperCase();
}

function customerOrders(customerId) {
return state.orders.filter((order) =>
order.buyer_id === customerId
);
}

function orderTotal(order) {
return Number(order.total_amount) || 0;
}

function customerSpending(customerId) {
return customerOrders(customerId)
.filter((order) =>
String(order.status || "").toLowerCase() !== "cancelled"
)
.reduce((sum, order) => sum + orderTotal(order), 0);
}

function statusBadge(customer) {
return customer.is_active === true
? '<span class="status-badge status-active">Active</span>'
: '<span class="status-badge status-inactive">Inactive</span>';
}

function renderStats() {
$("totalCustomers").textContent = state.customers.length;

$("activeCustomers").textContent =
  state.customers.filter((customer) =>
    customer.is_active === true
  ).length;

$("totalCustomerOrders").textContent = state.orders.length;

const total = state.customers.reduce(
  (sum, customer) => sum + customerSpending(customer.id),
  0
);

$("totalCustomerSpending").textContent = money(total);

}

function filteredCustomers() {
const query = ($("searchInput")?.value || "")
.trim()
.toLowerCase();

const status = $("statusFilter")?.value || "";
const orderFilter = $("ordersFilter")?.value || "";

return state.customers.filter((customer) => {
  const name = String(customer.full_name || "").toLowerCase();
  const email = String(customer.email || "").toLowerCase();
  const count = customerOrders(customer.id).length;

  const matchesSearch =
    !query || name.includes(query) || email.includes(query);

  const matchesStatus =
    !status ||
    (status === "active" && customer.is_active === true) ||
    (status === "inactive" && customer.is_active !== true);

  const matchesOrders =
    !orderFilter ||
    (orderFilter === "ordered" && count > 0) ||
    (orderFilter === "never" && count === 0);

  return matchesSearch && matchesStatus && matchesOrders;
});

}

function renderCustomerRow(customer) {
const orders = customerOrders(customer.id);

return `
  <tr>
    <td>
      <div class="customer-cell">
        <span class="customer-avatar">
          ${escapeHTML(initials(customer.full_name))}
        </span>
        <div>
          <strong>${escapeHTML(customer.full_name || "Unnamed buyer")}</strong>
          <small>Buyer account</small>
        </div>
      </div>
    </td>
    <td>${escapeHTML(customer.email || "No email recorded")}</td>
    <td>${formatDate(customer.created_at)}</td>
    <td>${orders.length}</td>
    <td>${money(customerSpending(customer.id))}</td>
    <td>${statusBadge(customer)}</td>
    <td>
      <div class="row-actions">
        <button class="action-button" type="button"
          data-action="view" data-id="${escapeHTML(customer.id)}">
          View details
        </button>
      </div>
    </td>
  </tr>
`;

}

function renderMobileCustomer(customer) {
const orders = customerOrders(customer.id);

return `
  <article class="mobile-customer-card">
    <div class="customer-cell">
      <span class="customer-avatar">
        ${escapeHTML(initials(customer.full_name))}
      </span>
      <div>
        <strong>${escapeHTML(customer.full_name || "Unnamed buyer")}</strong>
        <small>${escapeHTML(customer.email || "No email recorded")}</small>
      </div>
    </div>

    <div class="customer-info">
      <div>Joined: <strong>${formatDate(customer.created_at)}</strong></div>
      <div>Orders: <strong>${orders.length}</strong></div>
      <div>Total spent: <strong>${money(customerSpending(customer.id))}</strong></div>
      <div>Account: ${statusBadge(customer)}</div>
    </div>

    <div class="row-actions">
      <button class="action-button" type="button"
        data-action="view" data-id="${escapeHTML(customer.id)}">
        View customer &amp; orders
      </button>
    </div>
  </article>
`;

}

function renderCustomers() {
const customers = filteredCustomers();

$("resultCount").textContent =
  `${customers.length} buyer${customers.length === 1 ? "" : "s"} found`;

$("customersTableBody").innerHTML = customers.length
  ? customers.map(renderCustomerRow).join("")
  : `<tr><td colspan="7" class="empty-state">
      No buyers match your search or filters.
    </td></tr>`;

$("mobileCustomers").innerHTML = customers.length
  ? customers.map(renderMobileCustomer).join("")
  : `<p class="empty-state">No buyers match your search or filters.</p>`;

}

function renderProfile(customer) {
$("detailsCustomerName").textContent =
customer.full_name || "Unnamed buyer";

$("customerProfileSummary").innerHTML = `
  <div class="profile-item">
    <span>Full name</span>
    <strong>${escapeHTML(customer.full_name || "Not provided")}</strong>
  </div>
  <div class="profile-item">
    <span>Email address</span>
    <strong>${escapeHTML(customer.email || "Not recorded")}</strong>
  </div>
  <div class="profile-item">
    <span>Registration date</span>
    <strong>${formatDate(customer.created_at)}</strong>
  </div>
  <div class="profile-item">
    <span>Account status</span>
    <strong>${customer.is_active === true ? "Active" : "Inactive"}</strong>
  </div>
  <div class="profile-item">
    <span>Total orders</span>
    <strong>${customerOrders(customer.id).length}</strong>
  </div>
  <div class="profile-item">
    <span>Total order value</span>
    <strong>${money(customerSpending(customer.id))}</strong>
  </div>
`;

}

function renderCustomerOrderRow(order) {
const status = String(order.status || "Pending");
const safeStatus = escapeHTML(status);

return `
  <tr>
    <td>${escapeHTML(order.order_number || order.id || "—")}</td>
    <td>${formatDate(order.created_at)}</td>
    <td><span class="order-status">${safeStatus}</span></td>
    <td>${escapeHTML(order.payment_method || "—")}</td>
    <td>${money(orderTotal(order))}</td>
  </tr>
`;

}

function showCustomerDetails(customerId) {
const customer = state.customers.find((item) =>
item.id === customerId
);

if (!customer) return;

state.selectedCustomerId = customerId;
renderProfile(customer);

const orders = customerOrders(customerId).slice().sort(
  (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
);

$("customerOrdersBody").innerHTML = orders.length
  ? orders.map(renderCustomerOrderRow).join("")
  : `<tr><td colspan="5" class="empty-state">
      This buyer has not placed any orders yet.
    </td></tr>`;

const details = $("customerDetails");
details.hidden = false;
details.scrollIntoView({ behavior: "smooth", block: "start" });

}

async function loadCustomers() {
const { data, error } = await supabaseClient
.from("profiles")
.select("id,full_name,email,is_active,created_at,role")
.eq("role", "buyer")
.order("created_at", { ascending: false });

if (error) {
  console.error("Loading customers failed:", error);
  throw new Error(
    "Could not load buyers. Check your profiles table and administrator read permissions."
  );
}

state.customers = data || [];

}

async function loadOrders() {
if (!state.customers.length) {
state.orders = [];
return;
}

const buyerIds = state.customers.map((customer) => customer.id);
const chunkSize = 100;
const collected = [];

for (let i = 0; i < buyerIds.length; i += chunkSize) {
  const ids = buyerIds.slice(i, i + chunkSize);

  const { data, error } = await supabaseClient
    .from("orders")
    .select("id,buyer_id,order_number,status,payment_method,payment_status,total_amount,created_at")
    .in("buyer_id", ids);

  if (error) {
    console.error("Loading customer orders failed:", error);
    throw new Error(
      "Buyer profiles loaded, but order history could not be loaded. Check order read permissions."
    );
  }

  collected.push(...(data || []));
}

state.orders = collected;

}

async function loadPage() {
setMessage("Loading customer records…");

await loadCustomers();
await loadOrders();

renderStats();
renderCustomers();

if (state.selectedCustomerId) {
  const customer = state.customers.find(
    (item) => item.id === state.selectedCustomerId
  );

  if (customer) {
    renderProfile(customer);

    const orders = customerOrders(customer.id).slice().sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    );

    $("customerOrdersBody").innerHTML = orders.length
      ? orders.map(renderCustomerOrderRow).join("")
      : `<tr><td colspan="5" class="empty-state">
          This buyer has not placed any orders yet.
        </td></tr>`;
  } else {
    $("customerDetails").hidden = true;
    state.selectedCustomerId = null;
  }
}

setMessage(
  `Customer directory updated. ${state.customers.length} buyer account(s) found.`,
  "success"
);

}

async function start() {
try {
if (typeof supabaseClient === "undefined") {
throw new Error(
"Supabase is not loaded. Check the script tags in admin-customers.html."
);
}

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) throw sessionError;

  const user = sessionData.session?.user;

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const { data: profile, error: profileError } =
    await supabaseClient
      .from("profiles")
      .select("id,role,is_active")
      .eq("id", user.id)
      .maybeSingle();

  if (profileError) throw profileError;

  if (
    !profile ||
    profile.role !== "admin" ||
    profile.is_active !== true
  ) {
    setMessage(
      "Access denied. An active administrator account is required.",
      "error"
    );
    return;
  }

  await loadPage();
} catch (error) {
  console.error("Admin customer page failed:", error);
  setMessage(
    error.message || "Could not load the customer management page.",
    "error"
  );
}

}

$("searchInput")?.addEventListener("input", renderCustomers);
$("statusFilter")?.addEventListener("change", renderCustomers);
$("ordersFilter")?.addEventListener("change", renderCustomers);

$("refreshButton")?.addEventListener("click", async () => {
try {
await loadPage();
} catch (error) {
console.error(error);
setMessage(error.message, "error");
}
});

$("closeDetailsButton")?.addEventListener("click", () => {
$("customerDetails").hidden = true;
state.selectedCustomerId = null;
});

document.addEventListener("click", (event) => {
const button = event.target.closest('[data-action="view"][data-id]');
if (!button) return;

showCustomerDetails(button.dataset.id);

});

start();
})();
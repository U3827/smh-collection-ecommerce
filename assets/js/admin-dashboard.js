
/* =========================================
   SMH COLLECTION
   ADMIN DASHBOARD
   Authentication, role protection,
   statistics, recent orders and mobile menu
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const notice = $("dashboardNotice");
  const sidebar = $("sidebar");
  const menuBtn = $("menuBtn");
  const logoutBtn = $("logoutBtn");

  let currentUser = null;
  let currentProfile = null;

  // -----------------------------------------
  // GENERAL HELPERS
  // -----------------------------------------

  function showNotice(message, type = "") {
    if (!notice) return;

    notice.textContent = message;
    notice.className = "notice";

    if (type) notice.classList.add(type);
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 2
    }).format(Number(value) || 0);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getInitial(name) {
    return String(name || "A").trim().charAt(0).toUpperCase() || "A";
  }

  function goTo(page) {
    const basePath = "/smh-collection-ecommerce/";
    window.location.assign(
      new URL(page, window.location.origin + basePath).href
    );
  }

  // -----------------------------------------
  // MOBILE MENU
  // Set up BEFORE checking Supabase so the
  // menu can still respond if auth fails.
  // -----------------------------------------

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove("open");

    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", "false");
    }
  }

  if (menuBtn && sidebar) {
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();

      const opened = sidebar.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(opened));
    });

    sidebar.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        closeSidebar();
      });
    });

    document.addEventListener("click", (event) => {
      if (
        window.innerWidth <= 760 &&
        sidebar.classList.contains("open") &&
        !sidebar.contains(event.target) &&
        !menuBtn.contains(event.target)
      ) {
        closeSidebar();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeSidebar();
    });
  }

  // -----------------------------------------
  // FOOTER YEAR
  // -----------------------------------------

  setText("currentYear", String(new Date().getFullYear()));

  // -----------------------------------------
  // SUPABASE CLIENT CHECK
  // Your root supabase.js must initialize
  // a client named supabaseClient.
  // -----------------------------------------

  if (
    typeof window.supabase === "undefined" ||
    typeof supabaseClient === "undefined"
  ) {
    showNotice(
      "Supabase could not load. Check the root supabase.js file and ensure it loads before assets/js/admin-dashboard.js.",
      "error"
    );

    console.error(
      "Supabase is unavailable. Check the script paths and the client initialization in supabase.js."
    );

    return;
  }

  // -----------------------------------------
  // AUTHENTICATION AND ADMIN PERMISSIONS
  // -----------------------------------------

  try {
    showNotice("Verifying your administrator account...");

    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError) throw userError;

    if (!user) {
      goTo("login.html");
      return;
    }

    currentUser = user;

    const {
      data: profile,
      error: profileError
    } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, role, is_active, avatar_url")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!profile) {
      showNotice(
        "Your account profile could not be found. Please contact the store administrator.",
        "error"
      );
      return;
    }

    if (profile.is_active === false) {
      await supabaseClient.auth.signOut();
      goTo("login.html");
      return;
    }

    if (profile.role !== "admin") {
      if (profile.role === "buyer") {
        goTo("buyer-dashboard.html");
      } else if (profile.role === "seller") {
        goTo("seller-dashboard.html");
      } else {
        await supabaseClient.auth.signOut();
        goTo("login.html");
      }

      return;
    }

    currentProfile = profile;

    const name = profile.full_name || "Administrator";
    const initial = getInitial(name);

    setText("adminName", name);
    setText("adminEmail", profile.email || user.email || "");
    setText(
      "welcomeMessage",
      `Welcome back, ${name}. Here's your store overview.`
    );

    document.querySelectorAll(".avatar").forEach((avatar) => {
      avatar.textContent = initial;
    });

    showNotice(
      "Administrator verified. Loading store information...",
      "success"
    );

  } catch (error) {
    console.error("Admin authentication error:", error);

    showNotice(
      error.message || "Could not verify administrator access.",
      "error"
    );

    return;
  }

  // -----------------------------------------
  // DATABASE COUNTS
  // -----------------------------------------

  async function countRows(table, configure) {
    let query = supabaseClient
      .from(table)
      .select("*", { count: "exact", head: true });

    if (configure) query = configure(query);

    const { count, error } = await query;

    if (error) {
      console.warn(
        `Could not count ${table}:`,
        error.message
      );
      return null;
    }

    return count ?? 0;
  }

  async function loadStatistics() {
    const [productCount, buyerCount, orderCount] =
      await Promise.all([
        countRows("products"),
        countRows("profiles", (query) =>
          query.eq("role", "buyer")
        ),
        countRows("orders")
      ]);

    if (productCount !== null) {
      setText("totalProducts", String(productCount));
    }

    if (buyerCount !== null) {
      setText("totalCustomers", String(buyerCount));
    }

    if (orderCount !== null) {
      setText("totalOrders", String(orderCount));
    }

    // Revenue will be calculated after the actual
    // orders schema and payment rules are verified.
    setText("totalRevenue", "Pending");
  }

  // -----------------------------------------
  // RECENT ORDERS
  // -----------------------------------------

  async function loadRecentOrders() {
    const tbody = $("recentOrders");
    if (!tbody) return;

    const { data, error } = await supabaseClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.warn(
        "Orders could not be loaded:",
        error.message
      );

      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            Orders could not be loaded. Check the orders
            table and administrator access permissions.
          </td>
        </tr>
      `;

      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            No orders have been recorded yet.
          </td>
        </tr>
      `;

      return;
    }

    tbody.innerHTML = data.map((order) => {
      const orderId = order.id ?? "—";
      const shortId = String(orderId).slice(0, 8);

      const customer =
        order.customer_name ||
        order.full_name ||
        order.buyer_name ||
        order.email ||
        "Customer";

      const amount =
        order.total_amount ??
        order.total ??
        order.amount ??
        0;

      const status = order.status || "Pending";

      return `
        <tr>
          <td>#${escapeHTML(shortId)}</td>
          <td>${escapeHTML(customer)}</td>
          <td>${escapeHTML(formatMoney(amount))}</td>
          <td>${escapeHTML(status)}</td>
        </tr>
      `;
    }).join("");
  }

  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Signing out...";

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        goTo("login.html");

      } catch (error) {
        console.error("Admin logout error:", error);

        logoutBtn.disabled = false;
        logoutBtn.textContent = "↪ Sign out";

        showNotice(
          "Unable to sign out. Please try again.",
          "error"
        );
      }
    });
  }

  // -----------------------------------------
  // INITIALIZE DASHBOARD
  // -----------------------------------------

  try {
    await Promise.all([
      loadStatistics(),
      loadRecentOrders()
    ]);

    showNotice(
      "Administrator verified. Store data has been refreshed where available.",
      "success"
    );

    console.log("SMH admin dashboard initialized.", {
      userId: currentUser.id,
      role: currentProfile.role
    });

  } catch (error) {
    console.error("Admin dashboard data error:", error);

    showNotice(
      "Your admin session is active, but some store data could not be loaded. Check your database tables and access policies.",
      "error"
    );
  }
});

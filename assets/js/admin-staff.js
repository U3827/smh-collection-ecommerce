
/* =========================================================
   SMH COLLECTION
   STAFF, SELLERS & USER MANAGEMENT
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const notice = $("staffNotice");
  const tableBody = $("staffTableBody");
  const searchInput = $("userSearch");
  const roleFilter = $("roleFilter");
  const statusFilter = $("statusFilter");

  let allUsers = [];
  let currentAdmin = null;

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);

  function showNotice(message, type = "info") {
    if (!notice) return;
    notice.textContent = message;
    notice.dataset.type = type;
    notice.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function roleLabel(role) {
    const labels = {
      admin: "Administrator",
      staff: "Staff",
      seller: "Seller",
      buyer: "Buyer"
    };

    return labels[String(role || "").toLowerCase()] || "Unknown";
  }

  function renderUsers() {
    if (!tableBody) return;

    const search = (searchInput?.value || "").trim().toLowerCase();
    const selectedRole = roleFilter?.value || "all";
    const selectedStatus = statusFilter?.value || "all";

    const filteredUsers = allUsers.filter((user) => {
      const name = String(user.full_name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const role = String(user.role || "buyer").toLowerCase();
      const active = user.is_active !== false;

      const matchesSearch =
        !search || name.includes(search) || email.includes(search);

      const matchesRole =
        selectedRole === "all" || role === selectedRole;

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && active) ||
        (selectedStatus === "inactive" && !active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    setText(
      "userResultsCount",
      `${filteredUsers.length} of ${allUsers.length} account(s)`
    );

    if (!filteredUsers.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No accounts match your filters.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filteredUsers.map((user) => {
      const role = String(user.role || "buyer").toLowerCase();
      const active = user.is_active !== false;
      const name = user.full_name || "Unnamed user";
      const email = user.email || "No email available";
      const joined = formatDate(user.created_at);

      // Role changes and account controls will be enabled only
      // after a properly authorized server-side workflow exists.
      const isSelf = currentAdmin && user.id === currentAdmin.id;

      return `
        <tr>
          <td>
            <strong>${escapeHTML(name)}</strong>
            ${isSelf ? '<br><small>Current account</small>' : ""}
          </td>
          <td>${escapeHTML(email)}</td>
          <td>
            <span class="account-role">${escapeHTML(roleLabel(role))}</span>
          </td>
          <td>
            <span class="account-status ${active ? "is-active" : "is-inactive"}">
              ${active ? "Active" : "Inactive"}
            </span>
          </td>
          <td>${escapeHTML(joined)}</td>
          <td>
            <button
              class="text-link user-view-button"
              type="button"
              data-user-id="${escapeHTML(user.id)}"
            >
              View
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadUsers() {
    showNotice("Loading account directory...");

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Could not load profiles:", error);
      showNotice(
        "Unable to load accounts. Check the profiles table and its Row Level Security policies.",
        "error"
      );
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">
              Account data could not be loaded.
            </td>
          </tr>
        `;
      }
      return;
    }

    allUsers = data || [];

    setText("totalUsers", allUsers.length);
    setText(
      "totalSellers",
      allUsers.filter((user) =>
        String(user.role || "").toLowerCase() === "seller"
      ).length
    );
    setText(
      "totalStaff",
      allUsers.filter((user) =>
        String(user.role || "").toLowerCase() === "staff"
      ).length
    );
    setText(
      "inactiveUsers",
      allUsers.filter((user) => user.is_active === false).length
    );

    renderUsers();
    showNotice("Account directory loaded.", "success");
  }

  function showUserDetails(userId) {
    const user = allUsers.find((item) => item.id === userId);
    if (!user) return;

    const details = [
      `Name: ${user.full_name || "Not provided"}`,
      `Email: ${user.email || "Not available"}`,
      `Role: ${roleLabel(user.role || "buyer")}`,
      `Status: ${user.is_active === false ? "Inactive" : "Active"}`,
      `Joined: ${formatDate(user.created_at)}`
    ].join("\n");

    window.alert(details);
  }

  function setupSidebar() {
    const sidebar = $("sidebar");
    const menuButton = $("menuBtn");

    menuButton?.addEventListener("click", () => {
      if (!sidebar) return;

      const isOpen = sidebar.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!sidebar || !menuButton) return;

      if (
        window.innerWidth <= 900 &&
        !sidebar.contains(event.target) &&
        !menuButton.contains(event.target)
      ) {
        sidebar.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
      }
    });
  }

  async function initialize() {
    setText("currentYear", new Date().getFullYear());
    setupSidebar();

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function" ||
      typeof supabaseClient === "undefined"
    ) {
      showNotice(
        "Supabase could not initialize. Check the Supabase script paths.",
        "error"
      );
      return;
    }

    try {
      const { data, error } = await supabaseClient.auth.getUser();

      if (error || !data?.user) {
        window.location.replace("login.html");
        return;
      }

      const authUser = data.user;

      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("id, full_name, email, role, is_active")
        .eq("id", authUser.id)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("Could not verify administrator profile:", profileError);
        showNotice(
          "Your account profile could not be verified. Contact the store administrator.",
          "error"
        );
        return;
      }

      if (profile.is_active === false) {
        await supabaseClient.auth.signOut();
        window.location.replace("login.html");
        return;
      }

      if (String(profile.role || "").toLowerCase() !== "admin") {
        window.location.replace(
          profile.role === "seller"
            ? "seller-dashboard.html"
            : profile.role === "buyer"
              ? "buyer-dashboard.html"
              : "login.html"
        );
        return;
      }

      currentAdmin = authUser;

      setText("adminName", profile.full_name || "Administrator");
      setText("adminEmail", profile.email || authUser.email || "");

      await loadUsers();
    } catch (error) {
      console.error("Staff management initialization failed:", error);
      showNotice(
        "An unexpected error occurred while opening user management.",
        "error"
      );
    }
  }

  searchInput?.addEventListener("input", renderUsers);
  roleFilter?.addEventListener("change", renderUsers);
  statusFilter?.addEventListener("change", renderUsers);

  tableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-user-id]");
    if (button) showUserDetails(button.dataset.userId);
  });

  $("logoutBtn")?.addEventListener("click", async () => {
    const button = $("logoutBtn");
    if (button) button.disabled = true;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      console.error("Sign-out failed:", error);
      showNotice("Could not sign out. Please try again.", "error");
      if (button) button.disabled = false;
      return;
    }

    window.location.replace("login.html");
  });

  await initialize();
});

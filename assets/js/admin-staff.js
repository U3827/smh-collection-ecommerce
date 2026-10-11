
/* =========================================================
   SMH COLLECTION
   STAFF, SELLERS & USER MANAGEMENT
   Supabase-connected administration
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  let allUsers = [];
  let currentAdmin = null;
  let selectedUser = null;

  const accountDialog = $("accountDialog");
  const manageDialog = $("manageUserDialog");
  const accountForm = $("accountForm");
  const manageForm = $("manageUserForm");

  const notice = $("staffNotice");
  const tableBody = $("staffTableBody");

  const searchInput = $("userSearch");
  const roleFilter = $("roleFilter");
  const statusFilter = $("statusFilter");

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = String(value ?? "");
  }

  function showNotice(message, type = "info") {
    if (!notice) return;

    notice.textContent = message;
    notice.dataset.type = type;
    notice.setAttribute(
      "role",
      type === "error" ? "alert" : "status"
    );
  }

  function setFormMessage(id, message, type = "info") {
    const element = $(id);
    if (!element) return;

    element.textContent = message;
    element.dataset.type = type;
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function normalizedRole(user) {
    return String(user.role || "buyer").toLowerCase();
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

  function isActive(user) {
    return user.is_active !== false;
  }

  function openDialog(dialog) {
    if (!dialog) return;

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      showNotice(
        "Your browser does not support this dialog. Please update your browser.",
        "error"
      );
    }
  }

  function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
  }

  function setButtonLoading(button, loading, loadingText = "Please wait...") {
    if (!button) return;

    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = loadingText;
      button.disabled = true;
    } else {
      button.textContent =
        button.dataset.originalText || button.textContent;
      button.disabled = false;
      delete button.dataset.originalText;
    }
  }

  function updateStatistics() {
    setText("totalUsers", allUsers.length);

    setText(
      "totalSellers",
      allUsers.filter((user) => normalizedRole(user) === "seller").length
    );

    setText(
      "totalStaff",
      allUsers.filter((user) => normalizedRole(user) === "staff").length
    );

    setText(
      "inactiveUsers",
      allUsers.filter((user) => !isActive(user)).length
    );
  }

  function renderUsers() {
    if (!tableBody) return;

    const search = (searchInput?.value || "").trim().toLowerCase();
    const chosenRole = roleFilter?.value || "all";
    const chosenStatus = statusFilter?.value || "all";

    const filteredUsers = allUsers.filter((user) => {
      const name = String(user.full_name || "").toLowerCase();
      const email = String(user.email || "").toLowerCase();
      const role = normalizedRole(user);
      const active = isActive(user);

      const matchesSearch =
        !search || name.includes(search) || email.includes(search);

      const matchesRole =
        chosenRole === "all" || role === chosenRole;

      const matchesStatus =
        chosenStatus === "all" ||
        (chosenStatus === "active" && active) ||
        (chosenStatus === "inactive" && !active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    setText(
      "userResultsCount",
      `${filteredUsers.length} of ${allUsers.length} account(s)`
    );

    if (filteredUsers.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">
            No accounts match your search or filters.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filteredUsers.map((user) => {
      const role = normalizedRole(user);
      const active = isActive(user);
      const name = user.full_name || "Unnamed user";
      const email = user.email || "Email unavailable";

      // Conservatively protect administrator accounts in the UI.
      // Permanent-admin protection must also be enforced server-side.
      const protectedAdmin = role === "admin";

      return `
        <tr>
          <td>
            <strong>${escapeHTML(name)}</strong>
            ${user.id === currentAdmin?.id
              ? '<br><small>Current account</small>'
              : ""}
          </td>

          <td>${escapeHTML(email)}</td>

          <td>
            <span class="account-role">
              ${escapeHTML(roleLabel(role))}
            </span>
          </td>

          <td>
            <span class="account-status ${active ? "is-active" : "is-inactive"}">
              ${active ? "Active" : "Inactive"}
            </span>
          </td>

          <td>${escapeHTML(formatDate(user.created_at))}</td>

          <td>
            ${
              protectedAdmin
                ? '<span class="staff-protected-label">Protected admin</span>'
                : `
                  <button
                    class="text-link user-manage-button"
                    type="button"
                    data-manage-user="${escapeHTML(user.id)}"
                  >Manage</button>
                `
            }
          </td>
        </tr>
      `;
    }).join("");
  }

  async function loadUsers() {
    showNotice("Loading account directory...");

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-state">Loading accounts...</td>
        </tr>
      `;
    }

    const { data, error } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load profiles:", error);

      showNotice(
        "Could not load accounts. Check the profiles table and its Row Level Security policies.",
        "error"
      );

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">
              Accounts could not be loaded.
            </td>
          </tr>
        `;
      }

      return;
    }

    allUsers = data || [];

    updateStatistics();
    renderUsers();

    showNotice(
      `Account directory loaded: ${allUsers.length} account(s).`,
      "success"
    );
  }

  async function verifyAdministrator() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data?.user) {
      window.location.replace("login.html");
      return false;
    }

    const authUser = data.user;

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, full_name, email, role, is_active")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Administrator profile verification failed:", profileError);

      showNotice(
        "Your account profile could not be verified. Contact the store administrator.",
        "error"
      );

      return false;
    }

    if (profile.is_active === false) {
      await supabaseClient.auth.signOut();
      window.location.replace("login.html");
      return false;
    }

    if (String(profile.role || "").toLowerCase() !== "admin") {
      const destinations = {
        buyer: "buyer-dashboard.html",
        seller: "seller-dashboard.html"
      };

      window.location.replace(destinations[profile.role] || "login.html");
      return false;
    }

    currentAdmin = authUser;

    setText("adminName", profile.full_name || "Administrator");
    setText("adminEmail", profile.email || authUser.email || "");

    return true;
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

  function openCreateAccount(role) {
    if (!accountForm) return;

    accountForm.reset();

    setText(
      "accountDialogTitle",
      role === "seller" ? "Add New Seller" : "Add New Staff"
    );

    setText(
      "accountDialogDescription",
      role === "seller"
        ? "Enter the details for the new seller account."
        : "Enter the details for the new staff account."
    );

    const roleSelect = $("newUserRole");
    if (roleSelect) roleSelect.value = role;

    setFormMessage("accountFormMessage", "");
    openDialog(accountDialog);
  }

  function openManageUser(userId) {
    const user = allUsers.find((item) => item.id === userId);

    if (!user) {
      showNotice("That account could not be found. Refresh and try again.", "error");
      return;
    }

    // Never allow an administrator account to be edited from this UI.
    // A server-side permanent-admin rule is still required.
    if (normalizedRole(user) === "admin") {
      showNotice(
        "Administrator accounts are protected from changes in this interface.",
        "error"
      );
      return;
    }

    selectedUser = user;

    setText(
      "manageUserTitle",
      `Manage ${user.full_name || "User"}`
    );

    setText(
      "manageUserSummary",
      user.email || "Email unavailable"
    );

    $("manageUserId").value = user.id;
    $("manageUserRole").value = normalizedRole(user);
    $("manageUserStatus").value = String(isActive(user));

    $("manageUserRole").disabled = false;
    $("manageUserStatus").disabled = false;
    $("saveUserChangesBtn").disabled = false;

    $("protectedAdminMessage").hidden = true;
    setFormMessage("manageFormMessage", "");

    openDialog(manageDialog);
  }

  async function invokeSecureFunction(functionName, payload) {
    const { data, error } = await supabaseClient.functions.invoke(
      functionName,
      { body: payload }
    );

    if (error) {
      console.error(`${functionName} failed:`, error);
      throw new Error(
        "The secure account-management service is not available or rejected this request. No changes were confirmed."
      );
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }

  async function handleCreateAccount(event) {
    event.preventDefault();

    const submitButton = $("submitAccountBtn");

    const fullName = $("newUserName").value.trim();
    const email = $("newUserEmail").value.trim().toLowerCase();
    const role = $("newUserRole").value;

    if (!fullName || !email || !["seller", "staff"].includes(role)) {
      setFormMessage(
        "accountFormMessage",
        "Please enter a name, valid email and permitted role.",
        "error"
      );
      return;
    }

    setButtonLoading(submitButton, true, "Creating account...");
    setFormMessage("accountFormMessage", "Contacting secure account service...");

    try {
      await invokeSecureFunction("admin-create-user", {
        full_name: fullName,
        email,
        role
      });

      setFormMessage(
        "accountFormMessage",
        "The account service accepted the request.",
        "success"
      );

      showNotice(
        "Account creation request completed. Refreshing the directory...",
        "success"
      );

      accountForm.reset();
      closeDialog(accountDialog);
      await loadUsers();
    } catch (error) {
      console.error("Account creation error:", error);

      setFormMessage(
        "accountFormMessage",
        error.message || "Could not create the account.",
        "error"
      );
    } finally {
      setButtonLoading(submitButton, false);
    }
  }

  async function handleSaveUser(event) {
    event.preventDefault();

    if (!selectedUser) return;

    if (normalizedRole(selectedUser) === "admin") {
      setFormMessage(
        "manageFormMessage",
        "Administrator accounts cannot be changed from this interface.",
        "error"
      );
      return;
    }

    const newRole = $("manageUserRole").value;
    const newActiveValue = $("manageUserStatus").value;

    if (!["buyer", "seller", "staff"].includes(newRole)) {
      setFormMessage("manageFormMessage", "Invalid role selected.", "error");
      return;
    }

    if (!["true", "false"].includes(newActiveValue)) {
      setFormMessage("manageFormMessage", "Invalid account status.", "error");
      return;
    }

    const saveButton = $("saveUserChangesBtn");

    setButtonLoading(saveButton, true, "Saving changes...");
    setFormMessage(
      "manageFormMessage",
      "Submitting changes to the secure account service..."
    );

    try {
      await invokeSecureFunction("admin-manage-user", {
        action: "update_user",
        user_id: selectedUser.id,
        role: newRole,
        is_active: newActiveValue === "true"
      });

      showNotice(
        "The secure service accepted the account update. Refreshing the directory...",
        "success"
      );

      closeDialog(manageDialog);
      selectedUser = null;

      await loadUsers();
    } catch (error) {
      console.error("Account update error:", error);

      setFormMessage(
        "manageFormMessage",
        error.message || "Could not update this account.",
        "error"
      );
    } finally {
      setButtonLoading(saveButton, false);
    }
  }

  function setupEvents() {
    searchInput?.addEventListener("input", renderUsers);
    roleFilter?.addEventListener("change", renderUsers);
    statusFilter?.addEventListener("change", renderUsers);

    $("addSellerBtn")?.addEventListener("click", () => {
      openCreateAccount("seller");
    });

    $("addStaffBtn")?.addEventListener("click", () => {
      openCreateAccount("staff");
    });

    $("refreshUsersBtn")?.addEventListener("click", loadUsers);

    tableBody?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-manage-user]");
      if (button) openManageUser(button.dataset.manageUser);
    });

    accountForm?.addEventListener("submit", handleCreateAccount);
    manageForm?.addEventListener("submit", handleSaveUser);

    $("closeAccountDialog")?.addEventListener("click", () => {
      closeDialog(accountDialog);
    });

    $("cancelAccountBtn")?.addEventListener("click", () => {
      closeDialog(accountDialog);
    });

    $("closeManageDialog")?.addEventListener("click", () => {
      closeDialog(manageDialog);
    });

    $("cancelManageBtn")?.addEventListener("click", () => {
      closeDialog(manageDialog);
    });

    $("logoutBtn")?.addEventListener("click", async () => {
      const button = $("logoutBtn");
      if (button) button.disabled = true;

      try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        window.location.replace("login.html");
      } catch (error) {
        console.error("Sign out failed:", error);
        showNotice("Could not sign out. Please try again.", "error");

        if (button) button.disabled = false;
      }
    });
  }

  async function initialize() {
    setText("currentYear", new Date().getFullYear());
    setupSidebar();

    if (
      typeof window.supabase === "undefined" ||
      typeof window.supabase.createClient !== "function" ||
      typeof supabaseClient === "undefined"
    ) {
      showNotice(
        "Supabase could not initialize. Check the Supabase script paths.",
        "error"
      );
      return;
    }

    setupEvents();

    try {
      const isAdmin = await verifyAdministrator();

      if (!isAdmin) return;

      await loadUsers();
    } catch (error) {
      console.error("Staff management initialization failed:", error);

      showNotice(
        "An unexpected error occurred while opening staff management.",
        "error"
      );
    }
  }

  initialize();
});

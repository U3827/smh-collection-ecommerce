/* =========================================
   SMH COLLECTION
   ADMIN INVENTORY MANAGEMENT
========================================= */

"use strict";

(() => {
    const $ = (id) => document.getElementById(id);

    const LOW_STOCK_LIMIT = 5;

    let products = [];
    let categories = [];
    let currentUser = null;
    let busyProducts = new Set();

    const elements = {
        message: $("pageMessage"),
        totalProducts: $("totalProducts"),
        totalUnits: $("totalUnits"),
        lowStockProducts: $("lowStockProducts"),
        outOfStockProducts: $("outOfStockProducts"),
        search: $("searchInput"),
        category: $("categoryFilter"),
        stock: $("stockFilter"),
        visibility: $("visibilityFilter"),
        table: $("inventoryTableBody"),
        mobile: $("mobileInventory"),
        resultCount: $("resultCount"),
        refresh: $("refreshButton"),
        logout: $("logoutButton"),
        menu: $("menuButton"),
        sidebar: $("sidebar"),
        backToTop: $("backToTopButton")
    };

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function formatNumber(value) {
        return new Intl.NumberFormat("en-NG").format(Number(value) || 0);
    }

    function formatMoney(value) {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function showMessage(message, type = "info") {
        if (!elements.message) return;

        elements.message.textContent = message;
        elements.message.hidden = !message;
        elements.message.dataset.type = type;
    }

    function getCategoryName(product) {
        const category = categories.find(
            (item) => item.id === product.category_id
        );

        return category?.name || "Uncategorised";
    }

    function getStockStatus(stock) {
        const quantity = Number(stock) || 0;

        if (quantity <= 0) {
            return {
                label: "Out of stock",
                className: "stock-out",
                filter: "out-of-stock"
            };
        }

        if (quantity <= LOW_STOCK_LIMIT) {
            return {
                label: "Low stock",
                className: "stock-low",
                filter: "low-stock"
            };
        }

        return {
            label: "In stock",
            className: "stock-in",
            filter: "in-stock"
        };
    }

    function getVisibility(product) {
        return product.is_active
            ? '<span class="status-badge status-active">Active</span>'
            : '<span class="status-badge status-inactive">Inactive</span>';
    }

    function productImage(product) {
        const name = escapeHTML(product.name || "Product");
        const imageURL = String(product.image_url || "").trim();

        if (
            imageURL &&
            /^https?:\/\/\S+$/i.test(imageURL)
        ) {
            return `
                <div class="product-thumb">
                    <img
                        src="${escapeHTML(imageURL)}"
                        alt="${name}"
                        loading="lazy"
                        referrerpolicy="no-referrer"
                        onerror="this.style.display='none'"
                    >
                </div>
            `;
        }

        return `
            <div class="product-thumb" aria-label="${name}">
                ◇
            </div>
        `;
    }

    function stockUpdateControl(product) {
        const id = escapeHTML(product.id);
        const stock = Math.max(0, Number(product.stock) || 0);
        const disabled = busyProducts.has(String(product.id));

        return `
            <div class="stock-update">
                <input
                    type="number"
                    min="0"
                    step="1"
                    max="100000000"
                    value="${stock}"
                    aria-label="New stock quantity for ${escapeHTML(product.name)}"
                    data-stock-input="${id}"
                    ${disabled ? "disabled" : ""}
                >
                <button
                    type="button"
                    data-update-stock="${id}"
                    ${disabled ? "disabled" : ""}
                >
                    ${disabled ? "Saving…" : "Save"}
                </button>
            </div>
        `;
    }

    function renderDesktopRow(product) {
        const status = getStockStatus(product.stock);

        return `
            <tr>
                <td>
                    <div class="product-cell">
                        ${productImage(product)}
                        <div class="product-info">
                            <strong>${escapeHTML(product.name)}</strong>
                            <small>${escapeHTML(product.slug || "")}</small>
                        </div>
                    </div>
                </td>
                <td>${escapeHTML(getCategoryName(product))}</td>
                <td>${formatMoney(product.price)}</td>
                <td>
                    <span class="stock-number">
                        ${formatNumber(product.stock)}
                    </span>
                </td>
                <td>
                    <span class="stock-status ${status.className}">
                        ${status.label}
                    </span>
                </td>
                <td>${getVisibility(product)}</td>
                <td>${stockUpdateControl(product)}</td>
            </tr>
        `;
    }

    function renderMobileCard(product) {
        const status = getStockStatus(product.stock);

        return `
            <article class="inventory-mobile-card">
                <div class="mobile-product-heading">
                    ${productImage(product)}
                    <div class="product-info">
                        <strong>${escapeHTML(product.name)}</strong>
                        <small>${escapeHTML(product.slug || "")}</small>
                        <small>${escapeHTML(getCategoryName(product))}</small>
                    </div>
                </div>

                <div class="mobile-stock-grid">
                    <div class="mobile-stock-item">
                        <span>Price</span>
                        <strong>${formatMoney(product.price)}</strong>
                    </div>

                    <div class="mobile-stock-item">
                        <span>Current stock</span>
                        <strong>${formatNumber(product.stock)} units</strong>
                    </div>

                    <div class="mobile-stock-item">
                        <span>Stock status</span>
                        <strong>
                            <span class="stock-status ${status.className}">
                                ${status.label}
                            </span>
                        </strong>
                    </div>

                    <div class="mobile-stock-item">
                        <span>Visibility</span>
                        <strong>${product.is_active ? "Active" : "Inactive"}</strong>
                    </div>
                </div>

                <label class="mobile-update-label"
                    for="mobile-stock-${escapeHTML(product.id)}">
                    Update stock quantity
                </label>

                <div class="mobile-stock-update">
                    <input
                        id="mobile-stock-${escapeHTML(product.id)}"
                        type="number"
                        min="0"
                        step="1"
                        max="100000000"
                        value="${Math.max(0, Number(product.stock) || 0)}"
                        aria-label="New stock quantity for ${escapeHTML(product.name)}"
                        data-stock-input="${escapeHTML(product.id)}"
                        ${busyProducts.has(String(product.id)) ? "disabled" : ""}
                    >
                    <button
                        type="button"
                        data-update-stock="${escapeHTML(product.id)}"
                        ${busyProducts.has(String(product.id)) ? "disabled" : ""}
                    >
                        ${busyProducts.has(String(product.id)) ? "Saving…" : "Save stock"}
                    </button>
                </div>
            </article>
        `;
    }

    function populateCategories() {
        const selectedValue = elements.category.value || "all";

        elements.category.innerHTML = `
            <option value="all">All categories</option>
            ${categories.map((category) => `
                <option value="${escapeHTML(category.id)}">
                    ${escapeHTML(category.name)}
                </option>
            `).join("")}
        `;

        const optionExists = Array.from(elements.category.options)
            .some((option) => option.value === selectedValue);

        elements.category.value = optionExists ? selectedValue : "all";
    }

    function updateStatistics() {
        elements.totalProducts.textContent = formatNumber(products.length);

        const totalUnits = products.reduce(
            (sum, product) => sum + Math.max(0, Number(product.stock) || 0),
            0
        );

        const lowStock = products.filter((product) => {
            const stock = Number(product.stock) || 0;
            return stock > 0 && stock <= LOW_STOCK_LIMIT;
        }).length;

        const outOfStock = products.filter(
            (product) => (Number(product.stock) || 0) <= 0
        ).length;

        elements.totalUnits.textContent = formatNumber(totalUnits);
        elements.lowStockProducts.textContent = formatNumber(lowStock);
        elements.outOfStockProducts.textContent = formatNumber(outOfStock);
    }

    function getFilteredProducts() {
        const searchTerm = elements.search.value.trim().toLowerCase();
        const categoryValue = elements.category.value;
        const stockValue = elements.stock.value;
        const visibilityValue = elements.visibility.value;

        return products.filter((product) => {
            const name = String(product.name || "").toLowerCase();
            const slug = String(product.slug || "").toLowerCase();

            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                slug.includes(searchTerm);

            const matchesCategory =
                categoryValue === "all" ||
                String(product.category_id || "") === categoryValue;

            const stock = Number(product.stock) || 0;
            const status = getStockStatus(stock);

            const matchesStock =
                stockValue === "all" ||
                status.filter === stockValue;

            const matchesVisibility =
                visibilityValue === "all" ||
                (visibilityValue === "active" && product.is_active) ||
                (visibilityValue === "inactive" && !product.is_active);

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStock &&
                matchesVisibility
            );
        });
    }

    function renderInventory() {
        const filtered = getFilteredProducts();

        elements.resultCount.textContent =
            `${formatNumber(filtered.length)} of ${formatNumber(products.length)} products`;

        if (filtered.length === 0) {
            elements.table.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        No products match your search or filters.
                    </td>
                </tr>
            `;

            elements.mobile.innerHTML = `
                <div class="empty-state">
                    No products match your search or filters.
                </div>
            `;

            return;
        }

        elements.table.innerHTML = filtered.map(renderDesktopRow).join("");
        elements.mobile.innerHTML = filtered.map(renderMobileCard).join("");
    }

    async function requireAdmin() {
        const client = window.supabaseClient;

        if (!client) {
            throw new Error(
                "Supabase client was not found. Check assets/js/supabase.js."
            );
        }

        const { data, error } = await client.auth.getUser();

        if (error || !data?.user) {
            window.location.replace("login.html");
            return false;
        }

        currentUser = data.user;

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("id,role,is_active")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (profileError) {
            throw new Error(
                "Unable to verify your admin profile: " + profileError.message
            );
        }

        if (
            !profile ||
            profile.role !== "admin" ||
            profile.is_active !== true
        ) {
            window.location.replace("login.html");
            return false;
        }

        return true;
    }

    async function loadInventory() {
        showMessage("");

        elements.table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    Loading inventory...
                </td>
            </tr>
        `;

        elements.mobile.innerHTML = `
            <div class="empty-state">Loading inventory...</div>
        `;

        const client = window.supabaseClient;

        const [productResult, categoryResult] = await Promise.all([
            client
                .from("products")
                .select("id,category_id,name,slug,price,stock,image_url,is_active")
                .order("created_at", { ascending: false }),

            client
                .from("categories")
                .select("id,name")
                .order("name", { ascending: true })
        ]);

        if (productResult.error) {
            throw new Error(
                "Could not load products: " + productResult.error.message
            );
        }

        if (categoryResult.error) {
            throw new Error(
                "Could not load categories: " + categoryResult.error.message
            );
        }

        products = (productResult.data || []).map((product) => ({
            ...product,
            stock: Math.max(0, Number(product.stock) || 0)
        }));

        categories = categoryResult.data || [];

        populateCategories();
        updateStatistics();
        renderInventory();
    }

    async function saveStock(productId, input) {
        if (busyProducts.has(String(productId))) return;

        const product = products.find(
            (item) => String(item.id) === String(productId)
        );

        if (!product) {
            showMessage("This product could not be found. Refresh and try again.", "error");
            return;
        }

        const rawValue = input.value.trim();
        const newStock = Number(rawValue);

        if (
            rawValue === "" ||
            !Number.isSafeInteger(newStock) ||
            newStock < 0 ||
            newStock > 100000000
        ) {
            showMessage(
                "Enter a valid whole-number stock quantity from 0 to 100,000,000.",
                "error"
            );
            input.focus();
            return;
        }

        if (newStock === Number(product.stock)) {
            showMessage("The stock quantity has not changed.", "info");
            return;
        }

        busyProducts.add(String(productId));
        renderInventory();
        showMessage("Saving stock quantity…", "info");

        try {
            const { data, error } = await window.supabaseClient
                .from("products")
                .update({ stock: newStock })
                .eq("id", productId)
                .select("id,stock")
                .maybeSingle();

            if (error) {
                throw new Error(error.message);
            }

            if (!data) {
                throw new Error(
                    "The stock update was not confirmed. Your admin account may not have permission to update this product."
                );
            }

            product.stock = Number(data.stock);
            showMessage(
                `Stock updated successfully for ${product.name}.`,
                "success"
            );

            updateStatistics();
        } catch (error) {
            showMessage(
                "Stock was not updated: " + error.message,
                "error"
            );
        } finally {
            busyProducts.delete(String(productId));
            renderInventory();
        }
    }

    function handleStockUpdate(event) {
        const button = event.target.closest("[data-update-stock]");

        if (!button) return;

        const productId = button.dataset.updateStock;
        const input = document.querySelector(
            `[data-stock-input="${CSS.escape(productId)}"]`
        );

        if (input) {
            saveStock(productId, input);
        }
    }

    async function logout() {
        if (!window.supabaseClient) {
            window.location.href = "login.html";
            return;
        }

        const { error } = await window.supabaseClient.auth.signOut();

        if (error) {
            showMessage("Unable to log out: " + error.message, "error");
            return;
        }

        window.location.replace("login.html");
    }

    function attachEvents() {
        elements.search.addEventListener("input", renderInventory);
        elements.category.addEventListener("change", renderInventory);
        elements.stock.addEventListener("change", renderInventory);
        elements.visibility.addEventListener("change", renderInventory);

        elements.table.addEventListener("click", handleStockUpdate);
        elements.mobile.addEventListener("click", handleStockUpdate);

        elements.refresh.addEventListener("click", async () => {
            elements.refresh.disabled = true;
            elements.refresh.textContent = "Refreshing…";

            try {
                await loadInventory();
                showMessage("Inventory refreshed successfully.", "success");
            } catch (error) {
                showMessage(error.message, "error");
            } finally {
                elements.refresh.disabled = false;
                elements.refresh.textContent = "↻ Refresh inventory";
            }
        });

        elements.logout.addEventListener("click", logout);

        elements.menu.addEventListener("click", () => {
            elements.sidebar.classList.toggle("open");
        });

        elements.backToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });

        document.addEventListener("click", (event) => {
            if (
                window.innerWidth <= 850 &&
                elements.sidebar.classList.contains("open") &&
                !elements.sidebar.contains(event.target) &&
                !elements.menu.contains(event.target)
            ) {
                elements.sidebar.classList.remove("open");
            }
        });
    }

    async function init() {
        try {
            attachEvents();

            const allowed = await requireAdmin();

            if (!allowed) return;

            await loadInventory();
        } catch (error) {
            console.error("Admin inventory error:", error);
            showMessage(error.message || "An unexpected error occurred.", "error");

            elements.table.innerHTML = `
         <tr>
                <td colspan="6" class="empty-state">
                    <strong>Unable to load inventory</strong>
                    <p>Please refresh the page and try again.</p>
                </td>
            </tr>
        `;
        elements.mobileCards.innerHTML = `
            <div class="empty-state">
                <strong>Unable to load inventory</strong>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
    }
}

async function updateStock(productId, inputElement) {
    const newStock = Number(inputElement.value);

    if (!Number.isInteger(newStock) || newStock < 0) {
        showMessage("Stock must be a whole number and cannot be negative.", "error");
        await loadInventory();
        return;
    }

    inputElement.disabled = true;

    const { data, error } = await window.supabaseClient
        .from("products")
        .update({ stock: newStock })
        .eq("id", productId)
        .select("id, stock")
        .maybeSingle();

    inputElement.disabled = false;

    if (error) {
        console.error("Stock update error:", error);
        showMessage(error.message || "Could not update stock.", "error");
        await loadInventory();
        return;
    }

    if (!data) {
        showMessage(
            "Stock was not confirmed as updated. Check your admin permissions and product policies.",
            "error"
        );
        await loadInventory();
        return;
    }

    showMessage("Product stock updated successfully.", "success");
    await loadInventory();
}

function bindEvents() {
    if (elements.search) {
        elements.search.addEventListener("input", renderInventory);
    }

    if (elements.categoryFilter) {
        elements.categoryFilter.addEventListener("change", renderInventory);
    }

    if (elements.stockFilter) {
        elements.stockFilter.addEventListener("change", renderInventory);
    }

    if (elements.statusFilter) {
        elements.statusFilter.addEventListener("change", renderInventory);
    }

    if (elements.refreshButton) {
        elements.refreshButton.addEventListener("click", loadInventory);
    }

    if (elements.table) {
        elements.table.addEventListener("change", event => {
            const input = event.target.closest("[data-stock-input]");

            if (!input) return;

            updateStock(input.dataset.productId, input);
        });
    }

    if (elements.mobileCards) {
        elements.mobileCards.addEventListener("change", event => {
            const input = event.target.closest("[data-stock-input]");

            if (!input) return;

            updateStock(input.dataset.productId, input);
        });
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener("click", async () => {
            await window.supabaseClient.auth.signOut();
            window.location.href = "login.html";
        });
    }

    if (elements.menuButton && elements.sidebar) {
        elements.menuButton.addEventListener("click", () => {
            elements.sidebar.classList.toggle("open");
        });
    }

    if (elements.sidebarOverlay && elements.sidebar) {
        elements.sidebarOverlay.addEventListener("click", () => {
            elements.sidebar.classList.remove("open");
        });
    }
}

async function init() {
    if (!window.supabaseClient) {
        showMessage("Supabase has not loaded. Please refresh the page.", "error");
        return;
    }

    bindEvents();

    const isAdmin = await requireAdmin();

    if (!isAdmin) return;

    await loadInventory();
}

init();

})();
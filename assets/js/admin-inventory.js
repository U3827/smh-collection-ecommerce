
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
    let isSaving = false;

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

    // Support the existing Supabase file without modifying it.
    function getSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        try {
            if (
                typeof supabaseClient !== "undefined" &&
                supabaseClient
            ) {
                window.supabaseClient = supabaseClient;
                return supabaseClient;
            }
        } catch (error) {
            console.warn("Supabase client lookup failed:", error);
        }

        return null;
    }

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
        return Number(value || 0).toLocaleString("en-NG");
    }

    function formatMoney(value) {
        return "₦" + Number(value || 0).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function showMessage(message, type = "info") {
        if (!elements.message) return;

        elements.message.textContent = message || "";
        elements.message.className = message
            ? `page-message ${type}`
            : "page-message";

        elements.message.hidden = !message;
    }

    function getStockStatus(stock) {
        const quantity = Number(stock || 0);

        if (quantity <= 0) {
            return {
                label: "Out of stock",
                className: "out-of-stock"
            };
        }

        if (quantity <= LOW_STOCK_LIMIT) {
            return {
                label: "Low stock",
                className: "low-stock"
            };
        }

        return {
            label: "In stock",
            className: "in-stock"
        };
    }

    function getCategoryName(categoryId) {
        const category = categories.find(
            (item) => String(item.id) === String(categoryId)
        );

        return category ? category.name : "Uncategorized";
    }

    function getProductImage(product) {
        const imageURL = String(product.image_url || "").trim();

        if (/^https?:\/\/[^\s"'<>]+$/i.test(imageURL)) {
            return imageURL;
        }

        return "";
    }

    function productImageHTML(product) {
        const imageURL = getProductImage(product);
        const name = escapeHTML(product.name || "Product");

        if (!imageURL) {
            return '<div class="inventory-image-placeholder">No image</div>';
        }

        return `
            <img
                class="inventory-product-image"
                src="${escapeHTML(imageURL)}"
                alt="${name}"
                loading="lazy"
                onerror="this.style.display='none'"
            >
        `;
    }

    function stockInputHTML(product, mobile = false) {
        const productId = escapeHTML(product.id);
        const stock = Math.max(0, Number(product.stock || 0));

        return `
            <div class="${mobile ? "mobile-stock-update" : "stock-update"}">
                <input
                    type="number"
                    min="0"
                    step="1"
                    value="${stock}"
                    data-stock-input
                    data-product-id="${productId}"
                    aria-label="Stock quantity for ${escapeHTML(product.name)}"
                >
                <button
                    type="button"
                    class="stock-update-button"
                    data-update-stock="${productId}"
                >
                    Save
                </button>
            </div>
        `;
    }

    function renderTableRow(product) {
        const stockStatus = getStockStatus(product.stock);
        const visibility = product.is_active ? "Active" : "Hidden";

        return `
            <tr>
                <td>
                    <div class="inventory-product">
                        ${productImageHTML(product)}
                        <div>
                            <strong>${escapeHTML(product.name)}</strong>
                            <small>${escapeHTML(product.slug || "")}</small>
                        </div>
                    </div>
                </td>

                <td>${escapeHTML(getCategoryName(product.category_id))}</td>

                <td>${formatMoney(product.price)}</td>

                <td>
                    <span class="stock-badge ${stockStatus.className}">
                        ${stockStatus.label}
                    </span>
                    <small>${formatNumber(product.stock)} units</small>
                </td>

                <td>
                    <span class="visibility-badge">
                        ${visibility}
                    </span>
                </td>

                <td>${stockInputHTML(product)}</td>
            </tr>
        `;
    }

    function renderMobileCard(product) {
        const stockStatus = getStockStatus(product.stock);

        return `
            <article class="inventory-mobile-card">
                <div class="inventory-mobile-product">
                    ${productImageHTML(product)}
                    <div>
                        <h3>${escapeHTML(product.name)}</h3>
                        <p>${escapeHTML(getCategoryName(product.category_id))}</p>
                        <strong>${formatMoney(product.price)}</strong>
                    </div>
                </div>

                <div class="inventory-mobile-details">
                    <span>Available units</span>
                    <strong>${formatNumber(product.stock)}</strong>
                </div>

                <div class="inventory-mobile-details">
                    <span>Stock status</span>
                    <span class="stock-badge ${stockStatus.className}">
                        ${stockStatus.label}
                    </span>
                </div>

                <div class="inventory-mobile-details">
                    <span>Visibility</span>
                    <strong>${product.is_active ? "Active" : "Hidden"}</strong>
                </div>

                ${stockInputHTML(product, true)}
            </article>
        `;
    }

    function getFilteredProducts() {
        const searchTerm = (elements.search?.value || "")
            .trim()
            .toLowerCase();

        const categoryValue = elements.category?.value || "";
        const stockValue = elements.stock?.value || "";
        const visibilityValue = elements.visibility?.value || "";

        return products.filter((product) => {
            const name = String(product.name || "").toLowerCase();
            const slug = String(product.slug || "").toLowerCase();
            const categoryName = getCategoryName(
                product.category_id
            ).toLowerCase();

            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                slug.includes(searchTerm) ||
                categoryName.includes(searchTerm);

            const matchesCategory =
                !categoryValue ||
                String(product.category_id || "") === categoryValue;

            const quantity = Number(product.stock || 0);

            let matchesStock = true;

            if (stockValue === "in-stock") {
                matchesStock = quantity > LOW_STOCK_LIMIT;
            } else if (stockValue === "low-stock") {
                matchesStock =
                    quantity > 0 && quantity <= LOW_STOCK_LIMIT;
            } else if (stockValue === "out-of-stock") {
                matchesStock = quantity <= 0;
            }

            let matchesVisibility = true;

            if (visibilityValue === "active") {
                matchesVisibility = product.is_active === true;
            } else if (visibilityValue === "hidden") {
                matchesVisibility = product.is_active === false;
            }

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStock &&
                matchesVisibility
            );
        });
    }

    function renderInventory() {
        const filteredProducts = getFilteredProducts();

        if (elements.resultCount) {
            elements.resultCount.textContent =
                `${formatNumber(filteredProducts.length)} products`;
        }

        if (elements.table) {
            elements.table.innerHTML = filteredProducts.length
                ? filteredProducts.map(renderTableRow).join("")
                : `
                    <tr>
                        <td colspan="6" class="empty-state">
                            No products match your filters.
                        </td>
                    </tr>
                `;
        }

        if (elements.mobile) {
            elements.mobile.innerHTML = filteredProducts.length
                ? filteredProducts.map(renderMobileCard).join("")
                : `
                    <div class="empty-state">
                        No products match your filters.
                    </div>
                `;
        }
    }

    function updateStatistics() {
        const totalUnits = products.reduce(
            (sum, product) => sum + Math.max(0, Number(product.stock || 0)),
            0
        );

        const lowStockCount = products.filter((product) => {
            const quantity = Number(product.stock || 0);
            return quantity > 0 && quantity <= LOW_STOCK_LIMIT;
        }).length;

        const outOfStockCount = products.filter(
            (product) => Number(product.stock || 0) <= 0
        ).length;

        if (elements.totalProducts) {
            elements.totalProducts.textContent = formatNumber(products.length);
        }

        if (elements.totalUnits) {
            elements.totalUnits.textContent = formatNumber(totalUnits);
        }

        if (elements.lowStockProducts) {
            elements.lowStockProducts.textContent =
                formatNumber(lowStockCount);
        }

        if (elements.outOfStockProducts) {
            elements.outOfStockProducts.textContent =
                formatNumber(outOfStockCount);
        }
    }

    function populateCategoryFilter() {
        if (!elements.category) return;

        const previousValue = elements.category.value;

        elements.category.innerHTML = `
            <option value="">All categories</option>
            ${categories.map((category) => `
                <option value="${escapeHTML(category.id)}">
                    ${escapeHTML(category.name)}
                </option>
            `).join("")}
        `;

        if (
            previousValue &&
            categories.some(
                (category) => String(category.id) === previousValue
            )
        ) {
            elements.category.value = previousValue;
        }
    }

    async function requireAdmin() {
        const client = getSupabaseClient();

        if (!client) {
            showMessage(
                "Supabase has not loaded. Check the Supabase script and refresh the page.",
                "error"
            );
            return false;
        }

        const { data: authData, error: authError } =
            await client.auth.getUser();

        if (authError || !authData?.user) {
            window.location.href = "login.html";
            return false;
        }

        currentUser = authData.user;

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("id, role, is_active")
            .eq("id", currentUser.id)
            .maybeSingle();

        if (profileError) {
            console.error("Admin profile check failed:", profileError);
            showMessage(
                "Unable to verify your admin account. Please check your profile permissions.",
                "error"
            );
            return false;
        }

        if (!profile || profile.role !== "admin" || profile.is_active === false) {
            showMessage(
                "Access denied. An active administrator account is required.",
                "error"
            );

            window.setTimeout(() => {
                window.location.href = "login.html";
            }, 1800);

            return false;
        }

        return true;
    }

    async function loadInventory() {
        const client = getSupabaseClient();

        if (!client) {
            showMessage(
                "Supabase has not loaded. Check the Supabase script and refresh the page.",
                "error"
            );
            return;
        }

        if (elements.refresh) {
            elements.refresh.disabled = true;
        }

        showMessage("Loading inventory...", "info");

        try {
            const [productResult, categoryResult] = await Promise.all([
                client
                    .from("products")
                    .select(
                        "id, category_id, name, slug, price, stock, image_url, is_active, created_at"
                    )
                    .order("created_at", { ascending: false }),

                client
                    .from("categories")
                    .select("id, name")
                    .order("name", { ascending: true })
            ]);

            if (productResult.error) {
                throw productResult.error;
            }

            if (categoryResult.error) {
                throw categoryResult.error;
            }

            products = productResult.data || [];
            categories = categoryResult.data || [];

            populateCategoryFilter();
            updateStatistics();
            renderInventory();

            showMessage(
                `Inventory loaded successfully. ${formatNumber(products.length)} products found.`,
                "success"
            );
        } catch (error) {
            console.error("Inventory loading error:", error);

            showMessage(
                error.message || "Unable to load inventory. Please try again.",
                "error"
            );

            if (elements.table) {
                elements.table.innerHTML = `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <strong>Unable to load inventory</strong>
                            <p>Check your connection and administrator permissions.</p>
                        </td>
                    </tr>
                `;
            }

            if (elements.mobile) {
                elements.mobile.innerHTML = `
                    <div class="empty-state">
                        <strong>Unable to load inventory</strong>
                        <p>Check your connection and administrator permissions.</p>
                    </div>
                `;
            }
        } finally {
            if (elements.refresh) {
                elements.refresh.disabled = false;
            }
        }
    }

    async function saveStock(productId, input) {
        const client = getSupabaseClient();

        if (!client || isSaving) return;

        const newStock = Number(input?.value);

        if (
            input?.value.trim() === "" ||
            !Number.isInteger(newStock) ||
            newStock < 0
        ) {
            showMessage(
                "Stock must be a whole number and cannot be negative.",
                "error"
            );
            return;
        }

        const product = products.find(
            (item) => String(item.id) === String(productId)
        );

        if (!product) {
            showMessage("Product not found. Refresh and try again.", "error");
            return;
        }

        if (newStock === Number(product.stock || 0)) {
            showMessage("Stock quantity has not changed.", "info");
            return;
        }

        isSaving = true;

        document.querySelectorAll(
            `[data-update-stock="${CSS.escape(String(productId))}"]`
        ).forEach((button) => {
            button.disabled = true;
        });

        showMessage("Updating product stock...", "info");

        try {
            const { data, error } = await client
                .from("products")
                .update({ stock: newStock })
                .eq("id", productId)
                .select("id, stock")
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error(
                    "Stock update was not confirmed. Check your administrator permissions."
                );
            }

            product.stock = data.stock;

            updateStatistics();
            renderInventory();

            showMessage(
                "Product stock updated successfully.",
                "success"
            );
        } catch (error) {
            console.error("Stock update error:", error);

            showMessage(
                error.message || "Could not update product stock.",
                "error"
            );
        } finally {
            isSaving = false;

            document.querySelectorAll(
                `[data-update-stock="${CSS.escape(String(productId))}"]`
            ).forEach((button) => {
                button.disabled = false;
            });
        }
    }

    function handleStockSave(event) {
        const button = event.target.closest("[data-update-stock]");

        if (!button) return;

        const productId = button.dataset.updateStock;
        const wrapper = button.closest(
            ".stock-update, .mobile-stock-update"
        );
        const input = wrapper?.querySelector("[data-stock-input]");

        if (!input) {
            showMessage("Unable to find the stock input.", "error");
            return;
        }

        saveStock(productId, input);
    }

    function attachEvents() {
        elements.search?.addEventListener("input", renderInventory);
        elements.category?.addEventListener("change", renderInventory);
        elements.stock?.addEventListener("change", renderInventory);
        elements.visibility?.addEventListener("change", renderInventory);

        elements.refresh?.addEventListener("click", loadInventory);

        elements.table?.addEventListener("click", handleStockSave);
        elements.mobile?.addEventListener("click", handleStockSave);

        elements.logout?.addEventListener("click", async () => {
            const client = getSupabaseClient();

            if (!client) {
                window.location.href = "login.html";
                return;
            }

            const { error } = await client.auth.signOut();

            if (error) {
                
                console.error("Logout error:", error);
                showMessage(
                    "Unable to log out. Please try again.",
                    "error"
                );
                return;
            }

            window.location.href = "login.html";
        });

        elements.menu?.addEventListener("click", () => {
            elements.sidebar?.classList.toggle("open");
        });

        elements.backToTop?.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    async function init() {
        attachEvents();

        const allowed = await requireAdmin();

        if (!allowed) return;

        await loadInventory();
    }

    init().catch((error) => {
        console.error(
            "Admin inventory initialization error:",
            error
        );

        showMessage(
            error.message || "An unexpected error occurred.",
            "error"
        );
    });
})();

       
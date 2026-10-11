/* SMH Collection — Admin Product Management */

(() => {
"use strict";

const $ = (id) => document.getElementById(id);

const state = {
    admin: null,
    products: [],
    categories: [],
    sellers: [],
    editingId: null
};

const money = (amount) =>
    new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2
    }).format(Number(amount) || 0);

const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);

const safeImageURL = (value) => {
    if (!value) return "";
    try {
        const url = new URL(value, window.location.href);
        return ["https:", "http:"].includes(url.protocol)
            ? url.href
            : "";
    } catch {
        return "";
    }
};

const message = (text, type = "info") => {
    const element = $("pageMessage");
    if (!element) return;
    element.textContent = text;
    element.dataset.type = type;
    element.hidden = !text;
};

const formMessage = (text, type = "error") => {
    const element = $("formMessage");
    if (!element) return;
    element.textContent = text;
    element.dataset.type = type;
    element.hidden = !text;
};

const setBusy = (busy) => {
    const button = $("saveProduct");
    if (button) {
        button.disabled = busy;
        button.textContent = busy ? "Saving…" : "Save Product";
    }
};

function categoryName(id) {
    return state.categories.find((category) =>
        category.id === id
    )?.name || "Uncategorised";
}

function sellerName(id) {
    return state.sellers.find((seller) =>
        seller.id === id
    )?.full_name || "Unknown seller";
}

function renderCategoryOptions(selected = "") {
    const select = $("productCategory");
    if (!select) return;

    select.innerHTML =
        '<option value="">Choose a category</option>' +
        state.categories.map((category) => `
            <option value="${escapeHTML(category.id)}"
                ${category.id === selected ? "selected" : ""}>
                ${escapeHTML(category.name)}
            </option>
        `).join("");

    const filter = $("categoryFilter");
    if (filter) {
        const previous = filter.value;
        filter.innerHTML =
            '<option value="">All categories</option>' +
            state.categories.map((category) => `
                <option value="${escapeHTML(category.id)}">
                    ${escapeHTML(category.name)}
                </option>
            `).join("");

        if (state.categories.some((c) => c.id === previous)) {
            filter.value = previous;
        }
    }
}

function renderSellerOptions(selected = "") {
    const select = $("productSeller");
    if (!select) return;

    select.innerHTML =
        '<option value="">Choose a seller</option>' +
        state.sellers.map((seller) => `
            <option value="${escapeHTML(seller.id)}"
                ${seller.id === selected ? "selected" : ""}>
                ${escapeHTML(seller.full_name || seller.email || "Seller")}
                ${seller.email ? ` — ${escapeHTML(seller.email)}` : ""}
            </option>
        `).join("");
}

function renderStats() {
    $("totalProducts").textContent = state.products.length;
    $("activeProducts").textContent =
        state.products.filter((p) => p.is_active === true).length;
    $("lowStockProducts").textContent =
        state.products.filter((p) => Number(p.stock) > 0 &&
            Number(p.stock) <= 5).length;
    $("outOfStockProducts").textContent =
        state.products.filter((p) => Number(p.stock) <= 0).length;
}

function productStatus(product) {
    if (Number(product.stock) <= 0) {
        return '<span class="status-badge status-out">Out of stock</span>';
    }
    if (product.is_active !== true) {
        return '<span class="status-badge status-inactive">Inactive</span>';
    }
    if (Number(product.stock) <= 5) {
        return '<span class="status-badge status-low">Low stock</span>';
    }
    return '<span class="status-badge status-active">Active</span>';
}

function productImage(product) {
    const url = safeImageURL(product.image_url);
    return url
        ? `<img class="product-thumb" src="${escapeHTML(url)}"
            alt="${escapeHTML(product.name)}" loading="lazy">`
        : '<div class="product-thumb product-thumb-placeholder">SMH</div>';
}

function filteredProducts() {
    const search = ($("searchInput")?.value || "")
        .trim().toLowerCase();
    const category = $("categoryFilter")?.value || "";
    const availability = $("availabilityFilter")?.value || "";

    return state.products.filter((product) => {
        const seller = sellerName(product.seller_id).toLowerCase();
        const cat = categoryName(product.category_id).toLowerCase();

        const matchesSearch = !search ||
            [product.name, product.description, seller, cat]
                .some((value) =>
                    String(value || "").toLowerCase().includes(search));

        const matchesCategory = !category ||
            product.category_id === category;

        let matchesAvailability = true;
        if (availability === "active") {
            matchesAvailability = product.is_active === true &&
                Number(product.stock) > 0;
        } else if (availability === "inactive") {
            matchesAvailability = product.is_active !== true;
        } else if (availability === "low") {
            matchesAvailability = Number(product.stock) > 0 &&
                Number(product.stock) <= 5;
        } else if (availability === "out") {
            matchesAvailability = Number(product.stock) <= 0;
        }

        return matchesSearch && matchesCategory &&
            matchesAvailability;
    });
}

function renderProducts() {
    const products = filteredProducts();

    const tableBody = $("productsTableBody");
    const mobile = $("mobileProducts");

    if ($("resultCount")) {
        $("resultCount").textContent =
            `${products.length} product${products.length === 1 ? "" : "s"}`;
    }

    if (tableBody) {
        tableBody.innerHTML = products.length
            ? products.map((product) => `
                <tr>
                    <td>
                        <div class="product-cell">
                            ${productImage(product)}
                            <div>
                                <strong>${escapeHTML(product.name)}</strong>
                                <small>${escapeHTML(product.slug || "")}</small>
                            </div>
                        </div>
                    </td>
                    <td>${escapeHTML(categoryName(product.category_id))}</td>
                    <td>${escapeHTML(sellerName(product.seller_id))}</td>
                    <td>${money(product.price)}</td>
                    <td>${Number(product.stock) || 0}</td>
                    <td>${productStatus(product)}</td>
                    <td>
                        <div class="product-actions">
                            <button type="button" class="action-button"
                                data-action="edit"
                                data-id="${escapeHTML(product.id)}">
                                Edit
                            </button>
                            <button type="button" class="action-button"
                                data-action="toggle"
                                data-id="${escapeHTML(product.id)}">
                                ${product.is_active ? "Deactivate" : "Activate"}
                            </button>
                        </div>
                    </td>
                </tr>
            `).join("")
            : '<tr><td colspan="7" class="empty-state">No products match your filters.</td></tr>';
    }

    if (mobile) {
        mobile.innerHTML = products.length
            ? products.map((product) => `
                <article class="mobile-product-card">
                    <div class="mobile-product-heading">
                        ${productImage(product)}
                        <div>
                            <strong>${escapeHTML(product.name)}</strong>
                            <p>${escapeHTML(categoryName(product.category_id))}</p>
                            <strong>${money(product.price)}</strong>
                        </div>
                    </div>
                    <p>Seller: ${escapeHTML(sellerName(product.seller_id))}</p>
                    <p>Stock: ${Number(product.stock) || 0}</p>
                    <p>${productStatus(product)}</p>
                    <div class="product-actions">
                        <button type="button" class="action-button"
                            data-action="edit"
                            data-id="${escapeHTML(product.id)}">Edit</button>
                        <button type="button" class="action-button"
                            data-action="toggle"
                            data-id="${escapeHTML(product.id)}">
                            ${product.is_active ? "Deactivate" : "Activate"}
                        </button>
                    </div>
                </article>
            `).join("")
            : '<p class="empty-state">No products match your filters.</p>';
    }
}

async function loadProducts() {
    message("Loading products…");

    const { data, error } = await supabaseClient
        .from("products")
        .select("id,seller_id,category_id,name,slug,description,price,stock,image_url,is_active,created_at,updated_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Products query failed:", error);
        message("Could not load products. Check the products table permissions and database columns, then refresh.", "error");
        return;
    }

    state.products = data || [];
    renderStats();
    renderProducts();
    message(`Loaded ${state.products.length} product(s).`, "success");
}

async function loadCategories() {
    const { data, error } = await supabaseClient
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("Categories query failed:", error);
        throw new Error("Could not load categories. Check the categories table and its read permissions.");
    }

    state.categories = (data || []).filter((item) =>
        item.id && item.name
    );
    renderCategoryOptions();
}

async function loadSellers() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id,full_name,email,role,is_active")
        .eq("role", "seller")
        .eq("is_active", true)
        .order("full_name", { ascending: true });

    if (error) {
        console.error("Sellers query failed:", error);
        throw new Error("Could not load sellers. Check profile read permissions.");
    }

    state.sellers = data || [];
    renderSellerOptions();
}

function openNewProductDialog() {
    state.editingId = null;
    $("productForm").reset();
    $("productId").value = "";
    $("productActive").checked = true;
    $("productSeller").disabled = false;
    $("productName").disabled = false;
    $("productCategory").disabled = false;
    $("productDialog").querySelector("h2").textContent = "Add Product";
    formMessage("");
    renderCategoryOptions();
    renderSellerOptions();

    if (!state.sellers.length) {
        formMessage("Create or activate a seller account before adding a product.");
    }

    $("productDialog").showModal();
}

function openEditProductDialog(product) {
    state.editingId = product.id;
    $("productForm").reset();

    $("productId").value = product.id;
    $("productName").value = product.name || "";
    $("productDescription").value = product.description || "";
    $("productPrice").value = product.price ?? "";
    $("productStock").value = product.stock ?? 0;
    $("productImage").value = product.image_url || "";
    $("productActive").checked = product.is_active === true;

    renderCategoryOptions(product.category_id || "");
    renderSellerOptions(product.seller_id || "");

    // Ownership is not editable on existing products.
    $("productSeller").disabled = true;
    $("productDialog").querySelector("h2").textContent = "Edit Product";
    formMessage("");
    $("productDialog").showModal();
}

function makeSlug(name) {
    const base = String(name)
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 70) || "product";

    return `${base}-${Date.now().toString(36)}`;
}

async function saveProduct(event) {
    event.preventDefault();
    formMessage("");

    const name = $("productName").value.trim();
    const categoryId = $("productCategory").value;
    const sellerId = $("productSeller").value;
    const price = Number($("productPrice").value);
    const stock = Number($("productStock").value);
    const description = $("productDescription").value.trim();
    const rawImage = $("productImage").value.trim();
    const imageURL = rawImage ? safeImageURL(rawImage) : "";

    if (!name || !categoryId) {
        formMessage("Enter a product name and choose a category.");
        return;
    }

    if (!state.editingId && !sellerId) {
        formMessage("Choose a seller for this product.");
        return;
    }

    if (!Number.isFinite(price) || price <= 0) {
        formMessage("Enter a valid price greater than zero.");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        formMessage("Stock must be a whole number of zero or more.");
        return;
    }

    if (rawImage && !imageURL) {
        formMessage("Enter a valid image URL starting with http:// or https://.");
        return;
    }

    const values = {
        name,
        category_id: categoryId,
        description: description || null,
        price,
        stock,
        image_url: imageURL || null,
        is_active: $("productActive").checked
    };

    if (!state.editingId) {
        values.seller_id = sellerId;
        values.slug = makeSlug(name);
    }

    setBusy(true);

    try {
        let result;

        if (state.editingId) {
            result = await supabaseClient
                .from("products")
                .update(values)
                .eq("id", state.editingId)
                .select("id")
                .maybeSingle();
        } else {
            result = await supabaseClient
                .from("products")
                .insert(values)
                .select("id")
                .single();
        }

        if (result.error) throw result.error;
        if (!result.data) {
            throw new Error("No product was saved. Check your admin permissions.");
        }

        $("productDialog").close();
        message(state.editingId
            ? "Product updated successfully."
            : "Product created successfully.", "success");

        await loadProducts();
    } catch (error) {
        console.error("Saving product failed:", error);
        formMessage(error.message || "Could not save this product. Check database permissions and required fields.");
    } finally {
        setBusy(false);
    }
}

async function toggleProduct(id) {
    const product = state.products.find((item) => item.id === id);
    if (!product) return;

    const action = product.is_active ? "deactivate" : "activate";
    if (!window.confirm(`Are you sure you want to ${action} "${product.name}"?`)) {
        return;
    }

    message(`${action === "activate" ? "Activating" : "Deactivating"} product…`);

    const { data, error } = await supabaseClient
        .from("products")
        .update({
            is_active: !product.is_active,
            updated_at: new Date().toISOString()
        })
        .eq("id", product.id)
        .select("id")
        .maybeSingle();

    if (error || !data) {
        console.error("Product status update failed:", error);
        message(error?.message || "The product was not updated. Check your permissions.", "error");
        return;
    }

    message(`Product ${action}d successfully.`, "success");
    await loadProducts();
}

async function start() {
    try {
        if (typeof supabaseClient === "undefined") {
            throw new Error("Supabase is not loaded. Check the script tags in admin-products.html.");
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

        if (!profile || profile.role !== "admin" ||
            profile.is_active !== true) {
            message("Access denied. An active administrator account is required.", "error");
            return;
        }

        state.admin = profile;

        await Promise.all([loadCategories(), loadSellers()]);
        await loadProducts();

    } catch (error) {
        console.error("Admin products initialization failed:", error);
        message(error.message || "Could not initialise product management.", "error");
    }
}

$("addProductButton")?.addEventListener("click", openNewProductDialog);
$("refreshButton")?.addEventListener("click", async () => {
    try {
        await Promise.all([loadCategories(), loadSellers()]);
        await loadProducts();
    } catch (error) {
        message(error.message, "error");
    }
});

$("searchInput")?.addEventListener("input", renderProducts);
$("categoryFilter")?.addEventListener("change", renderProducts);
$("availabilityFilter")?.addEventListener("change", renderProducts);
$("productForm")?.addEventListener("submit", saveProduct);

$("cancelProduct")?.addEventListener("click", () =>
    $("productDialog").close());
$("closeDialog")?.addEventListener("click", () =>
    $("productDialog").close());

document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action][data-id]");
    if (!button) return;

    const { action, id } = button.dataset;

    if (action === "edit") {
        const product = state.products.find((item) => item.id === id);
        if (product) openEditProductDialog(product);
    } else if (action === "toggle") {
        toggleProduct(id);
    }
});

start();

})();
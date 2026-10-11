
/* =========================================
   SMH COLLECTION
   ADMIN ANALYTICS
========================================= */

"use strict";

(() => {
    const $ = (id) => document.getElementById(id);

    let revenueChart = null;
    let orderStatusChart = null;
    let isLoading = false;

    let elements = {
        message: $("pageMessage"),
        dateRange: $("dateRange"),
        refresh: $("refreshButton"),
        logout: $("logoutButton"),
        menu: $("menuButton"),
        sidebar: $("sidebar"),
        backToTop: $("backToTopButton"),
        totalRevenue: $("totalRevenue"),
        totalOrders: $("totalOrders"),
        averageOrderValue: $("averageOrderValue"),
        totalProducts: $("totalProducts"),
        recentOrders: $("recentOrdersBody"),
        revenueCanvas: $("revenueChart"),
        statusCanvas: $("orderStatusChart"),
        revenueEmpty: $("revenueChartEmpty"),
        statusEmpty: $("statusChartEmpty")
    };

    // Use the existing Supabase client without changing supabase.js.
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

    function normalizeStatus(value) {
        return String(value || "unknown")
            .trim()
            .toLowerCase()
            .replace(/[_-]+/g, " ");
    }

    function statusClass(value) {
        const status = normalizeStatus(value);

        if (
            status === "paid" ||
            status === "delivered" ||
            status === "completed"
        ) {
            return status.replace(/\s+/g, "-");
        }

        if (
            status === "pending" ||
            status === "processing"
        ) {
            return status;
        }

        if (
            status === "cancelled" ||
            status === "canceled" ||
            status === "failed" ||
            status === "refunded"
        ) {
            return status === "canceled" ? "cancelled" : status;
        }

        return "";
    }

    function formatStatus(value) {
        const normalized = normalizeStatus(value);

        return normalized.replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
    }

    function formatDate(value) {
        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-NG", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    function getDateRange() {
        const selected = elements.dateRange?.value || "30";

        if (selected === "all") {
            return {
                start: null,
                days: null,
                selected
            };
        }

        const days = Math.max(1, Number(selected) || 30);
        const now = new Date();
        const start = new Date(now);

        start.setDate(start.getDate() - days);
        start.setHours(0, 0, 0, 0);

        return {
            start,
            days,
            selected
        };
    }

    function isWithinRange(value, range) {
        if (!range.start) return true;

        const date = new Date(value);

        return (
            !Number.isNaN(date.getTime()) &&
            date >= range.start
        );
    }

    function isPaidOrder(order) {
        return normalizeStatus(order.payment_status) === "paid";
    }

    function getOrderAmount(order) {
        const amount = Number(order.total_amount || 0);

        return Number.isFinite(amount) ? amount : 0;
    }

    function updateMetricCards(orders, products) {
        const paidOrders = orders.filter(isPaidOrder);

        const revenue = paidOrders.reduce(
            (sum, order) => sum + getOrderAmount(order),
            0
        );

        const average = paidOrders.length
            ? revenue / paidOrders.length
            : 0;

        if (elements.totalRevenue) {
            elements.totalRevenue.textContent = formatMoney(revenue);
        }

        if (elements.totalOrders) {
            elements.totalOrders.textContent = formatNumber(orders.length);
        }

        if (elements.averageOrderValue) {
            elements.averageOrderValue.textContent = formatMoney(average);
        }

        if (elements.totalProducts) {
            elements.totalProducts.textContent = formatNumber(products.length);
        }
    }

    function groupRevenueByDate(paidOrders, range) {
        const groups = new Map();

        paidOrders.forEach((order) => {
            const date = new Date(order.created_at);

            if (Number.isNaN(date.getTime())) return;

            let key;
            let label;

            if (range.days !== null && range.days <= 90) {
                key = [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, "0"),
                    String(date.getDate()).padStart(2, "0")
                ].join("-");

                label = date.toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short"
                });
            } else {
                key = [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, "0")
                ].join("-");

                label = date.toLocaleDateString("en-NG", {
                    month: "short",
                    year: "numeric"
                });
            }

            if (!groups.has(key)) {
                groups.set(key, {
                    label,
                    revenue: 0
                });
            }

            groups.get(key).revenue += getOrderAmount(order);
        });

        return Array.from(groups.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map((entry) => entry[1]);
    }

    function renderRevenueChart(orders, range) {
        if (!elements.revenueCanvas) return;

        const paidOrders = orders.filter(isPaidOrder);
        const grouped = groupRevenueByDate(paidOrders, range);

        if (revenueChart) {
            revenueChart.destroy();
            revenueChart = null;
        }

        const hasRevenue = paidOrders.length > 0;

        if (elements.revenueEmpty) {
            elements.revenueEmpty.hidden = hasRevenue;
        }

        elements.revenueCanvas.style.display = hasRevenue ? "block" : "none";

        if (!hasRevenue || typeof Chart === "undefined") {
            if (typeof Chart === "undefined") {
                showMessage(
                    "The chart library could not load. The summary figures can still be displayed.",
                    "error"
                );
            }
            return;
        }

        revenueChart = new Chart(elements.revenueCanvas, {
            type: "line",
            data: {
                labels: grouped.map((item) => item.label),
                datasets: [{
                    label: "Revenue",
                    data: grouped.map((item) => item.revenue),
                    borderColor: "#123c2d",
                    backgroundColor: "rgba(18, 60, 45, 0.10)",
                    borderWidth: 3,
                    pointRadius: grouped.length > 35 ? 0 : 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: "#d7b56d",
                    fill: true,
                    tension: 0.32
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index"
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) =>
                                "Revenue: " + formatMoney(context.parsed.y)
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxTicksLimit: 8,
                            maxRotation: 0
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                const amount = Number(value);

                                if (amount >= 1000000) {
                                    return "₦" + (amount / 1000000) + "m";
                                }

                                if (amount >= 1000) {
                                    return "₦" + (amount / 1000) + "k";
                                }

                                return "₦" + amount;
                            }
                        }
                    }
                }
            }
        });
    }

    function renderOrderStatusChart(orders) {
        if (!elements.statusCanvas) return;

        const counts = new Map();

        orders.forEach((order) => {
            const status = formatStatus(order.status || "Unknown");

            counts.set(status, (counts.get(status) || 0) + 1);
        });

        const labels = Array.from(counts.keys());
        const values = Array.from(counts.values());

        if (orderStatusChart) {
            orderStatusChart.destroy();
            orderStatusChart = null;
        }

        const hasOrders = orders.length > 0;

        if (elements.statusEmpty) {
            elements.statusEmpty.hidden = hasOrders;
        }

        elements.statusCanvas.style.display = hasOrders ? "block" : "none";

        if (!hasOrders || typeof Chart === "undefined") {
            return;
        }

        const colors = [
            "#123c2d",
            "#d7b56d",
            "#5a8f72",
            "#6c83a0",
            "#c7774b",
            "#9b7db3",
            "#8d9a92"
        ];

        orderStatusChart = new Chart(elements.statusCanvas, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(
                        (_, index) => colors[index % colors.length]
                    ),
                    borderColor: "#ffffff",
                    borderWidth: 3,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "66%",
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            usePointStyle: true,
                            pointStyle: "circle",
                            padding: 16,
                            boxWidth: 8,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) =>
                                `${context.label}: ${formatNumber(context.parsed)}`
                        }
                    }
                }
            }
        });
    }

    function renderRecentOrders(orders) {
        if (!elements.recentOrders) return;

        const recent = [...orders]
            .sort((a, b) =>
                new Date(b.created_at) - new Date(a.created_at)
            )
            .slice(0, 10);

        if (!recent.length) {
            elements.recentOrders.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        No orders found for this period.
                    </td>
                </tr>
            `;
            return;
        }

        elements.recentOrders.innerHTML = recent.map((order) => {
            const orderNumber = escapeHTML(
                order.order_number || order.id || "—"
            );

            const orderStatus = formatStatus(order.status);
            const paymentStatus = formatStatus(order.payment_status);

            return `
                <tr>
                    <td><strong>${orderNumber}</strong></td>
                    <td>${formatDate(order.created_at)}</td>
                    <td>
                        <span class="status-pill ${statusClass(order.status)}">
                            ${escapeHTML(orderStatus)}
                        </span>
                    </td>
                    <td>
                        <span class="status-pill ${statusClass(order.payment_status)}">
                            ${escapeHTML(paymentStatus)}
                        </span>
                    </td>
                    <td><strong>${formatMoney(getOrderAmount(order))}</strong></td>
                </tr>
            `;
        }).join("");
    }

    async function requireAdmin() {
        const client = getSupabaseClient();

        if (!client) {
            showMessage(
                "Supabase has not loaded. Check assets/js/supabase.js and refresh the page.",
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

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("id, role, is_active")
            .eq("id", authData.user.id)
            .maybeSingle();

        if (profileError) {
            console.error("Admin verification error:", profileError);

            showMessage(
                "Could not verify administrator access. Please check your profile permissions.",
                "error"
            );
            return false;
        }

        if (
            !profile ||
            profile.role !== "admin" ||
            profile.is_active === false
        ) {
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

    async function loadAnalytics() {
        const client = getSupabaseClient();

        if (!client || isLoading) return;

        isLoading = true;

        if (elements.refresh) {
            elements.refresh.disabled = true;
        }

        showMessage("Loading store analytics...", "info");

        try {
            const range = getDateRange();

            let ordersQuery = client
                .from("orders")
                .select(
                    "id, order_number, status, payment_status, total_amount, created_at"
                )
                .order("created_at", { ascending: false });

            if (range.start) {
                ordersQuery = ordersQuery.gte(
                    "created_at",
                    range.start.toISOString()
                );
            }

            const [ordersResult, productsResult] = await Promise.all([
                ordersQuery,

                client
                    .from("products")
                    .select("id")
            ]);

            if (ordersResult.error) {
                throw ordersResult.error;
            }

            if (productsResult.error) {
                throw productsResult.error;
            }

            const orders = ordersResult.data || [];
            const products = productsResult.data || [];

            updateMetricCards(orders, products);
            renderRevenueChart(orders, range);
            renderOrderStatusChart(orders);
            renderRecentOrders(orders);

            if (orders.length === 0) {
                showMessage(
                    "Analytics loaded. No orders were found for the selected period.",
                    "info"
                );
            } else {
                showMessage(
                    `Analytics updated successfully. ${formatNumber(orders.length)} orders found.`,
                    "success"
                );
            }
        } catch (error) {
            console.error("Analytics loading error:", error);

            showMessage(
                error.message ||
                    "Unable to load analytics. Check your connection and database permissions.",
                "error"
            );

            if (elements.recentOrders) {
                elements.recentOrders.innerHTML = `
                    <tr>
                        <td colspan="5" class="empty-state">
                            Unable to load recent orders.
                        </td>
                    </tr>
                `;
            }
        } finally {
            isLoading = false;

            if (elements.refresh) {
                elements.refresh.disabled = false;
            }
        }
    }

    function attachEvents() {
        elements.dateRange?.addEventListener("change", loadAnalytics);
        elements.refresh?.addEventListener("click", loadAnalytics);

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
            const isOpen = elements.sidebar?.classList.toggle("open");

            elements.menu.setAttribute(
                "aria-expanded",
                String(Boolean(isOpen))
            );
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

        
        
        await loadAnalytics();
    }

    init().catch((error) => {
        console.error("Analytics initialization error:", error);

        showMessage(
            error.message || "An unexpected error occurred.",
            "error"
        );
    });
})();

    
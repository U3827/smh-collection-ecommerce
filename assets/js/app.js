/* =========================================================
   SMH COLLECTION
   Application Shell
   ========================================================= */

const app = document.querySelector("#app");
const announcementBar = document.querySelector("#announcement-bar");
const header = document.querySelector("#site-header");
const mainContent = document.querySelector("#main-content");
const footer = document.querySelector("#site-footer");


/* =========================================================
   STORE CONFIGURATION
   ========================================================= */

const STORE = {
    name: "SMH Collection",
    currency: "USD",
    delivery: "Free Delivery",
    payment: "Cash on Delivery"
};


/* =========================================================
   ANNOUNCEMENT
   ========================================================= */

function renderAnnouncement() {
    announcementBar.innerHTML = `
        <div class="container">
            Free delivery • Cash on Delivery • Shop SMH Collection
        </div>
    `;
}


/* =========================================================
   HEADER
   ========================================================= */

function renderHeader() {

    header.innerHTML = `
        <div class="container">
            <div class="header-inner">

                <a
                    href="#"
                    class="smh-brand"
                    aria-label="SMH Collection Home"
                >

                    <span class="smh-brand-mark">
                        SMH
                    </span>

                    <span class="smh-brand-name">
                        SMH <span>Collection</span>
                    </span>

                </a>


                <nav
                    class="main-nav"
                    aria-label="Main navigation"
                >

                    <a href="#home">
                        Home
                    </a>

                    <a href="#shop">
                        Shop
                    </a>

                    <a href="#categories">
                        Categories
                    </a>

                    <a href="#new-arrivals">
                        New Arrivals
                    </a>

                </nav>


                <div class="header-actions">

                    <button
                        class="icon-button"
                        type="button"
                        aria-label="Search"
                        title="Search"
                    >
                        🔍
                    </button>

                    <button
                        class="icon-button"
                        type="button"
                        aria-label="Wishlist"
                        title="Wishlist"
                    >
                        ♡
                    </button>

                    <button
                        class="icon-button"
                        type="button"
                        aria-label="Shopping Cart"
                        title="Shopping Cart"
                    >
                        🛒
                    </button>

                    <button
                        class="btn btn-primary"
                        type="button"
                        id="account-button"
                    >
                        Account
                    </button>

                </div>

            </div>
        </div>
    `;
}


/* =========================================================
   HERO
   ========================================================= */

function renderHero() {

    return `
        <section
            class="hero"
            id="home"
        >

            <div class="container">

                <div class="hero-content">

                    <div class="hero-eyebrow">
                        Welcome to SMH Collection
                    </div>

                    <h1>
                        Everything you love,
                        <span>all in one place.</span>
                    </h1>

                    <p>
                        Discover products for your lifestyle,
                        explore new collections and enjoy a
                        simple shopping experience with
                        free delivery and Cash on Delivery.
                    </p>

                    <div class="hero-actions">

                        <a
                            href="#shop"
                            class="btn btn-primary"
                        >
                            Shop Now
                        </a>

                        <a
                            href="#categories"
                            class="btn btn-outline"
                        >
                            Explore Categories
                        </a>

                    </div>

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   CATEGORIES
   ========================================================= */

const categories = [
    {
        name: "Fashion",
        icon: "👕"
    },
    {
        name: "Electronics",
        icon: "📱"
    },
    {
        name: "Shoes",
        icon: "👟"
    },
    {
        name: "Accessories",
        icon: "⌚"
    }
];


function renderCategories() {

    const categoryCards = categories
        .map(category => {

            return `
                <a
                    href="#shop"
                    class="category-card"
                >

                    <div>

                        <div
                            style="
                                font-size: 32px;
                                margin-bottom: 8px;
                            "
                        >
                            ${category.icon}
                        </div>

                        <h3>
                            ${category.name}
                        </h3>

                    </div>

                </a>
            `;
        })
        .join("");


    return `
        <section
            class="section"
            id="categories"
        >

            <div class="container">

                <div class="section-header">

                    <div>

                        <h2 class="section-title">
                            Shop by Category
                        </h2>

                        <p class="section-subtitle">
                            Explore popular product categories.
                        </p>

                    </div>

                    <a
                        href="#shop"
                        class="btn btn-outline"
                    >
                        View All
                    </a>

                </div>


                <div class="category-grid">

                    ${categoryCards}

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   PRODUCT PLACEHOLDER
   ========================================================= */

const featuredProducts = [
    {
        name: "Featured Product",
        category: "New Collection",
        price: "$49.99"
    },
    {
        name: "Premium Selection",
        category: "Popular",
        price: "$79.99"
    },
    {
        name: "Everyday Essential",
        category: "Lifestyle",
        price: "$29.99"
    },
    {
        name: "SMH Exclusive",
        category: "Exclusive",
        price: "$99.99"
    }
];


function renderProducts() {

    const products = featuredProducts
        .map(product => {

            return `
                <article
                    class="product-card"
                >

                    <div
                        class="product-image"
                        aria-label="Product image"
                    >
                        <span
                            style="
                                font-size: 42px;
                                opacity: .45;
                            "
                        >
                            🛍️
                        </span>
                    </div>

                    <div class="product-info">

                        <div class="product-category">
                            ${product.category}
                        </div>

                        <h3 class="product-name">
                            ${product.name}
                        </h3>

                        <div class="product-price">
                            ${product.price}
                        </div>

                    </div>

                </article>
            `;
        })
        .join("");


    return `
        <section
            class="section"
            id="shop"
        >

            <div class="container">

                <div class="section-header">

                    <div>

                        <h2 class="section-title">
                            Featured Products
                        </h2>

                        <p class="section-subtitle">
                            Carefully selected products
                            from SMH Collection.
                        </p>

                    </div>

                    <a
                        href="#shop"
                        class="btn btn-outline"
                    >
                        Shop All
                    </a>

                </div>


                <div class="product-grid">

                    ${products}

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   NEW ARRIVALS
   ========================================================= */

function renderNewArrivals() {

    return `
        <section
            class="section"
            id="new-arrivals"
        >

            <div class="container">

                <div
                    style="
                        padding: 50px 30px;
                        border-radius: 22px;
                        background: #111827;
                        color: white;
                        text-align: center;
                    "
                >

                    <div
                        style="
                            color: #d4af37;
                            font-weight: 800;
                            font-size: 12px;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        "
                    >
                        Coming Soon
                    </div>

                    <h2
                        style="
                            margin-top: 10px;
                            font-size: clamp(
                                28px,
                                5vw,
                                42px
                            );
                        "
                    >
                        New Arrivals
                    </h2>

                    <p
                        style="
                            max-width: 550px;
                            margin: 12px auto 24px;
                            color: #cbd5e1;
                        "
                    >
                        Fresh products and new collections
                        will appear here as the SMH Collection
                        marketplace grows.
                    </p>

                    <a
                        href="#shop"
                        class="btn btn-accent"
                    >
                        Explore Store
                    </a>

                </div>

            </div>

        </section>
    `;
}


/* =========================================================
   FOOTER
   ========================================================= */

function renderFooter() {

    footer.innerHTML = `
        <div class="container">

            <div class="footer-inner">

                <div class="footer-brand">

                    <div class="smh-brand">

                        <span class="smh-brand-mark">
                            SMH
                        </span>

                        <span class="smh-brand-name"
                            style="color:white;"
                        >
                            SMH
                            <span>Collection</span>
                        </span>

                    </div>

                    <p>
                        A modern global marketplace built
                        to make shopping simple, convenient
                        and enjoyable.
                    </p>

                </div>


                <div class="footer-column">

                    <h4>
                        Shop
                    </h4>

                    <a href="#shop">
                        All Products
                    </a>

                    <a href="#categories">
                        Categories
                    </a>

                    <a href="#new-arrivals">
                        New Arrivals
                    </a>

                </div>


                <div class="footer-column">

                    <h4>
                        Customer
                    </h4>

                    <a href="#">
                        My Account
                    </a>

                    <a href="#">
                        Orders
                    </a>

                    <a href="#">
                        Wishlist
                    </a>

                </div>


                <div class="footer-column">

                    <h4>
                        SMH Collection
                    </h4>

                    <a href="#">
                        About Us
                    </a>

                    <a href="#">
                        Contact
                    </a>

                    <a href="#">
                        Privacy Policy
                    </a>

                </div>

            </div>


            <div class="footer-bottom">

                © ${new Date().getFullYear()}
                SMH Collection.
                All rights reserved.

            </div>

        </div>
    `;
}


/* =========================================================
   RENDER APPLICATION
   ========================================================= */

function renderApp() {

    renderAnnouncement();

    renderHeader();

    mainContent.innerHTML = `
        ${renderHero()}
        ${renderCategories()}
        ${renderProducts()}
        ${renderNewArrivals()}
    `;

    renderFooter();
}


/* =========================================================
   APPLICATION START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderApp();

        console.log(
            "SMH Collection application started."
        );

    }
);
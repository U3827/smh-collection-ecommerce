/**
 * SMH COLLECTION
 * Main Application
 */

const app = document.getElementById("app");

function renderApp() {
    app.innerHTML = `
        <div class="app-shell">

            <!-- HEADER -->
            <header class="site-header">
                <div class="container header-inner">

                    <a href="index.html" class="brand">
                        <span class="brand-mark">SMH</span>
                        <span class="brand-name">Collection</span>
                    </a>

                    <nav class="main-nav" aria-label="Main navigation">
                        <a href="index.html" class="nav-link active">
                            Home
                        </a>

                        <a href="#" class="nav-link">
                            Shop
                        </a>

                        <a href="#" class="nav-link">
                            Categories
                        </a>

                        <a href="#" class="nav-link">
                            About
                        </a>

                        <a href="#" class="nav-link">
                            Contact
                        </a>
                    </nav>

                    <div class="header-actions">

                        <button
                            class="icon-button"
                            type="button"
                            aria-label="Search"
                        >
                            Search
                        </button>

                        <button
                            class="icon-button"
                            type="button"
                            aria-label="Wishlist"
                        >
                            Wishlist
                        </button>

                        <button
                            class="cart-button"
                            type="button"
                            aria-label="Shopping cart"
                        >
                            Cart
                            <span class="cart-count">0</span>
                        </button>

                        <button
                            class="account-button"
                            type="button"
                        >
                            Account
                        </button>

                    </div>

                </div>
            </header>


            <!-- MAIN APPLICATION -->
            <main>

                <!-- HERO -->
                <section class="hero-section">
                    <div class="container hero-content">

                        <div class="hero-copy">

                            <span class="eyebrow">
                                SMH COLLECTION
                            </span>

                            <h1>
                                Discover products
                                made for your lifestyle.
                            </h1>

                            <p>
                                Explore a carefully selected collection
                                of products with a simple and modern
                                shopping experience.
                            </p>

                            <div class="hero-actions">

                                <a
                                    href="#shop"
                                    class="primary-button"
                                >
                                    Shop Now
                                </a>

                                <a
                                    href="#featured"
                                    class="secondary-button"
                                >
                                    Explore Collection
                                </a>

                            </div>

                        </div>

                    </div>
                </section>


                <!-- CATEGORIES -->
                <section class="categories-section">
                    <div class="container">

                        <div class="section-heading">
                            <span class="eyebrow">
                                SHOP BY CATEGORY
                            </span>

                            <h2>
                                Find what you need
                            </h2>

                            <p>
                                Browse our product categories.
                            </p>
                        </div>

                        <div class="category-grid">

                            <button class="category-card">
                                <span class="category-icon">
                                    Fashion
                                </span>

                                <strong>
                                    Fashion
                                </strong>

                                <span>
                                    Explore collection
                                </span>
                            </button>

                            <button class="category-card">
                                <span class="category-icon">
                                    Electronics
                                </span>

                                <strong>
                                    Electronics
                                </strong>

                                <span>
                                    Explore collection
                                </span>
                            </button>

                            <button class="category-card">
                                <span class="category-icon">
                                    Beauty
                                </span>

                                <strong>
                                    Beauty
                                </strong>

                                <span>
                                    Explore collection
                                </span>
                            </button>

                            <button class="category-card">
                                <span class="category-icon">
                                    Lifestyle
                                </span>

                                <strong>
                                    Lifestyle
                                </strong>

                                <span>
                                    Explore collection
                                </span>
                            </button>

                        </div>

                    </div>
                </section>


                <!-- FEATURED PRODUCTS -->
                <section
                    class="products-section"
                    id="featured"
                >

                    <div class="container">

                        <div class="section-heading">
                            <span class="eyebrow">
                                FEATURED
                            </span>

                            <h2>
                                Featured products
                            </h2>

                            <p>
                                Discover products selected for you.
                            </p>
                        </div>

                        <div
                            class="product-grid"
                            id="featured-products"
                        >
                            <!-- Products will be rendered here -->
                        </div>

                    </div>

                </section>


                <!-- NEWSLETTER -->
                <section class="newsletter-section">

                    <div class="container newsletter-card">

                        <div>
                            <span class="eyebrow">
                                STAY CONNECTED
                            </span>

                            <h2>
                                Get updates from SMH Collection
                            </h2>

                            <p>
                                Receive product updates and special offers.
                            </p>
                        </div>

                        <form class="newsletter-form">

                            <label
                                for="newsletter-email"
                                class="sr-only"
                            >
                                Email address
                            </label>

                            <input
                                id="newsletter-email"
                                type="email"
                                placeholder="Enter your email"
                                required
                            >

                            <button
                                type="submit"
                                class="primary-button"
                            >
                                Subscribe
                            </button>

                        </form>

                    </div>

                </section>

            </main>


            <!-- FOOTER -->
            <footer class="site-footer">

                <div class="container footer-grid">

                    <div>
                        <a
                            href="index.html"
                            class="brand footer-brand"
                        >
                            <span class="brand-mark">SMH</span>
                            <span class="brand-name">
                                Collection
                            </span>
                        </a>

                        <p>
                            A modern shopping experience
                            built for SMH Collection.
                        </p>
                    </div>

                    <div>
                        <h3>Shop</h3>

                        <a href="#">
                            All Products
                        </a>

                        <a href="#">
                            New Arrivals
                        </a>

                        <a href="#">
                            Featured
                        </a>
                    </div>

                    <div>
                        <h3>Company</h3>

                        <a href="#">
                            About
                        </a>

                        <a href="#">
                            Contact
                        </a>

                        <a href="#">
                            Privacy
                        </a>
                    </div>

                    <div>
                        <h3>Account</h3>

                        <a href="#">
                            Sign In
                        </a>

                        <a href="#">
                            Create Account
                        </a>

                        <a href="#">
                            Orders
                        </a>
                    </div>

                </div>

                <div class="container footer-bottom">
                    <p>
                        © ${new Date().getFullYear()}
                        SMH Collection.
                        All rights reserved.
                    </p>
                </div>

            </footer>

        </div>
    `;
}

renderApp();
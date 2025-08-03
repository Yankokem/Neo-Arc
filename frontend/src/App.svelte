<script>
    import Footer from './components/Footer.svelte';
    import Navbar from './components/Navbar.svelte';
    import AllProducts from './pages/AllProducts.svelte';
    import Cart from './pages/Cart.svelte';
    import ComputerHardware from './pages/ComputerHardware.svelte';
    import Gadgets from './pages/Gadgets.svelte';
    import Home from './pages/Home.svelte';
    import ProductDetail from './pages/ProductDetail.svelte';

    // Track current page and product ID
    let currentPage = 'home';
    let productId = null;

    // Update when URL hash changes
    function updateRoute() {
        const hash = window.location.hash.substring(1) || 'home';
        const productMatch = hash.match(/^product\/(\d+)$/);
        if (productMatch) {
            currentPage = 'product';
            productId = productMatch[1];
        } else {
            currentPage = hash;
            productId = null;
        }
    }

    updateRoute();
    window.addEventListener('hashchange', updateRoute);
</script>

<Navbar />
<div class="app-container">
    <main>
        {#if currentPage === 'home'}
            <Home />
        {:else if currentPage === 'gadgets'}
            <Gadgets />
        {:else if currentPage === 'computer-hardware'}
            <ComputerHardware />
        {:else if currentPage === 'all-products'}
            <AllProducts />
        {:else if currentPage === 'cart'}
            <Cart />
        {:else if currentPage === 'product'}
            <ProductDetail {productId} />
        {/if}
    </main>
    <Footer />
</div>

<style>
    .app-container {
        max-width: 1440px;
        margin: 20px auto 0 auto;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }
    
    main {
        flex-grow: 1;
    }
</style>
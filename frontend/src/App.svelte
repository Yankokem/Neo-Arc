<script>
    import Footer from './components/Footer.svelte';
    import Navbar from './components/Navbar.svelte';
    import AllProducts from './pages/AllProducts.svelte';
    import Cart from './pages/Cart.svelte';
    import ComputerHardware from './pages/ComputerHardware.svelte';
    import Gadgets from './pages/Gadgets.svelte';
    import Home from './pages/Home.svelte';
    
    // Track current page
    let currentPage = window.location.hash.substring(1) || 'home';
    
    // Update when URL hash changes
    window.addEventListener('hashchange', () => {
        currentPage = window.location.hash.substring(1) || 'home';
    });
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
        {/if}
    </main>
    <Footer />
</div>

<style>
    .app-container {
        /* border: 2px solid red; */
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

<script>
    import Navbar from './components/Navbar.svelte';
    import Footer from './components/Footer.svelte';
    import Home from './pages/Home.svelte';
    import Gadgets from './pages/Gadgets.svelte';
    import ComputerHardware from './pages/ComputerHardware.svelte';
    import AllProducts from './pages/AllProducts.svelte';
    
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

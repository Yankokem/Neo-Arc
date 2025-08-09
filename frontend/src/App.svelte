<script>
  import Footer from './components/Footer.svelte';
  import Navbar from './components/Navbar.svelte';
  import AllProducts from './pages/AllProducts.svelte';
  import Cart from './pages/Cart.svelte';
  import ComputerHardware from './pages/ComputerHardware.svelte';
  import Gadgets from './pages/Gadgets.svelte';
  import Home from './pages/Home.svelte';
  import ProductDetail from './pages/ProductDetail.svelte';
  import Login from './pages/Login.svelte';
  import Register from './pages/Register.svelte';
  import Profile from './pages/Profile.svelte';
  import Checkout from './pages/Checkout.svelte';

  let currentPage = 'home';
  let productId = null;
  let previousPage = 'home';

  function updateRoute() {
    const hash = window.location.hash.substring(1) || 'home';
    const productMatch = hash.match(/^product\/(\d+)$/);
    const loginMatch = hash.match(/^login\?returnTo=(.+)$/);
    if (productMatch) {
      if (currentPage !== 'product') {
        previousPage = currentPage;
      }
      currentPage = 'product';
      productId = productMatch[1];
    } else if (loginMatch) {
      previousPage = loginMatch[1];
      currentPage = 'login';
      productId = null;
    } else {
      if (currentPage !== 'cart' && hash !== 'cart') {
        previousPage = currentPage;
      }
      currentPage = hash;
      productId = null;
    }
    history.replaceState({ previousPage }, '', window.location.hash || '#home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (history.state && history.state.previousPage) {
    previousPage = history.state.previousPage;
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
      <Cart {previousPage} />
    {:else if currentPage === 'product'}
      <ProductDetail {productId} {previousPage} />
    {:else if currentPage === 'login'}
      <Login {previousPage} />
    {:else if currentPage === 'register'}
      <Register {previousPage} />
    {:else if currentPage === 'profile'}
      <Profile {previousPage} />
    {:else if currentPage === 'checkout'}
      <Checkout {previousPage} />
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
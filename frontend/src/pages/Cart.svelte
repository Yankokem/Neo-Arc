<script>
  import { onMount } from 'svelte';

  export let previousPage;

  let cartItems = [];
  let isLoading = true;
  let error = null;
  let isAuthenticated = false;
  let user = null;
  let guestId = null;
  let csrfToken = null;

  async function fetchCsrfToken() {
    try {
      const response = await fetch('http://localhost:3001/api/csrf-token', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch CSRF token');
      const data = await response.json();
      csrfToken = data.csrfToken;
    } catch (err) {
      console.error('CSRF token fetch error:', err);
      error = 'Failed to initialize security token';
    }
  }

  async function checkAuth() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        isAuthenticated = true;
        user = data.user;
        guestId = null;
        localStorage.removeItem('guestId');
      } else {
        isAuthenticated = false;
        user = null;
        guestId = localStorage.getItem('guestId') || crypto.randomUUID();
        localStorage.setItem('guestId', guestId);
      }
    } catch (err) {
      isAuthenticated = false;
      user = null;
      guestId = localStorage.getItem('guestId') || crypto.randomUUID();
      localStorage.setItem('guestId', guestId);
    }
  }

  async function fetchCart() {
    try {
      let url = isAuthenticated ? 'http://localhost:3001/api/cart/checkout' : `http://localhost:3001/api/cart?guestId=${guestId}`;
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }
      cartItems = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function updateQuantity(cartId, newQuantity) {
    try {
      const body = { cartId, quantity: newQuantity, _csrf: csrfToken };
      if (isAuthenticated) {
        body.userId = user.id;
      } else {
        body.guestId = guestId;
      }
      const response = await fetch('http://localhost:3001/api/cart/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to update quantity');
      }
      await fetchCart();
    } catch (err) {
      error = err.message;
    }
  }

  async function removeItem(cartId) {
    try {
      const body = { cartId, _csrf: csrfToken };
      if (isAuthenticated) {
        body.userId = user.id;
      } else {
        body.guestId = guestId;
      }
      const response = await fetch('http://localhost:3001/api/cart/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to remove item');
      }
      await fetchCart();
    } catch (err) {
      error = err.message;
    }
  }

  function handleCheckout() {
    if (!isAuthenticated) {
      // Store cart as the previous page for back navigation
      localStorage.setItem('originalPreviousPage', 'cart');
      // Push current route to history
      history.pushState({ page: 'cart' }, '', '#cart');
      window.location.hash = `login?returnTo=checkout`;
    } else {
      window.location.hash = 'checkout';
    }
  }

  async function handleUserLoggedIn() {
    isLoading = true;
    await checkAuth();
    await fetchCart();
  }

  function handleHashChange() {
    if (window.location.hash === '#cart') {
      isLoading = true;
      fetchCart();
    }
  }

  $: subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  onMount(() => {
    async function initialize() {
      await fetchCsrfToken();
      await checkAuth();
      await fetchCart();
    }
    initialize();

    document.addEventListener('userLoggedIn', handleUserLoggedIn);
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      document.removeEventListener('userLoggedIn', handleUserLoggedIn);
      window.removeEventListener('hashchange', handleHashChange);
    };
  });
</script>

<div class="page flex flex-col p-4 flex-grow">
  <div class="top flex flex-row justify-between items-center p-4 mb-6">
    <a href="#{previousPage}" class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
      <span class="material-icons-outlined">keyboard_backspace</span> Back
    </a>
    <h1 class="text-4xl text-[#CA9335] font-bold">SHOPPING CART</h1>
  </div>

  <div class="cart-table w-full">
    <div class="table-header grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 pb-2 mb-4">
      <div class="text-lg text-[#CA9335] font-semibold">Product</div>
      <div class="text-lg text-[#CA9335] font-semibold text-center">Quantity</div>
      <div class="text-lg text-[#CA9335] font-semibold text-right">Total</div>
      <div class="text-lg text-[#CA9335] font-semibold text-center"></div>
    </div>

    <hr class="text-[#CA9335] border-1">

    <div class="table-body flex flex-col gap-6">
      {#if isLoading}
        <div class="p-4 text-center text-gray-600">Loading cart...</div>
      {:else if error}
        <div class="p-4 text-red-500">Error: {error}</div>
      {:else if cartItems.length === 0}
        <div class="p-4 text-center text-gray-600">Your cart is empty</div>
      {:else}
        {#each cartItems as item}
          <div class="table-row grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 items-center">
            <div class="product flex flex-row gap-4">
              <a href="#product/{item.product_id}" class="image-container w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                {#if item.image_url}
                  <img src={`http://localhost:3001${item.image_url}`} alt={item.name} class="w-full h-full object-cover rounded-md" />
                {:else}
                  <span class="text-gray-400 text-sm">Product Image</span>
                {/if}
              </a>
              <div class="product-details flex flex-col gap-1">
                <a href="#product/{item.product_id}" class="text-lg text-gray-600 font-semibold hover:underline">{item.name}</a>
                <p class="text-[#CA9335] font-semibold">₱{item.price.toFixed(2)}</p>
                <p class="text-sm text-gray-600">{item.description || 'No description available.'}</p>
              </div>
            </div>
            <div class="quantity flex flex-row items-center justify-center gap-2">
              <button 
                class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
                on:click={() => updateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >-</button>
              <input
                type="number"
                bind:value={item.quantity}
                min="1"
                max={item.stock}
                class="w-12 text-center border border-gray-600 text-gray-600 font-semibold rounded-md py-1 px-2"
                on:change={() => updateQuantity(item.id, item.quantity)}
              >
              <button 
                class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
                on:click={() => updateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.stock}
              >+</button>
            </div>
            <div class="total text-right text-[#CA9335] font-semibold">₱{(item.price * item.quantity).toFixed(2)}</div>
            <div class="delete text-center">
              <button 
                class="text-[#CA9335] hover:text-red-500 transition-colors"
                on:click={() => removeItem(item.id)}
              >
                <span class="material-icons-outlined">delete</span>
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>

  {#if cartItems.length > 0}
    <div class="checkout-container ml-auto w-80 p-4 mt-6">
      <div class="subtotal flex justify-between items-center mb-4">
        <span class="text-lg text-[#CA9335] font-semibold">Subtotal</span>
        <span class="text-lg text-[#CA9335] font-semibold">₱{subtotal.toFixed(2)}</span>
      </div>
      <p class="text-sm text-gray-600 mb-4 text-center">Taxes and shipping calculated at checkout</p>
      <button 
        on:click={handleCheckout}
        class="w-full bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
      >
        Checkout
      </button>
    </div>
  {/if}
</div>

<style>
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"] {
    -moz-appearance: textfield;
  }

  .cart-table {
    max-width: 100%;
  }

  .table-header {
    display: grid;
    align-items: center;
  }

  .table-row {
    display: grid;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid #e5e7eb;
  }

  .product-details {
    max-width: 300px;
  }

  .quantity button {
    transition: all 0.3s ease;
  }

  .quantity input {
    appearance: textfield;
  }

  .delete button {
    transition: all 0.3s ease;
  }

  .material-icons-outlined {
    font-size: 24px;
    vertical-align: middle;
  }

  .checkout-container {
    max-width: 20rem;
  }
</style>
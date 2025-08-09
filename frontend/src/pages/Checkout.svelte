<script>
  import { onMount } from 'svelte';

  export let previousPage = 'cart';

  let cartItems = [];
  let isLoading = true;
  let error = null;
  let isAuthenticated = false;

  async function checkAuthAndFetchCart() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        window.location.hash = `login?returnTo=checkout`;
        return;
      }
      isAuthenticated = true;
      const cartResponse = await fetch('http://localhost:3001/api/checkout', {
        method: 'GET',
        credentials: 'include'
      });
      if (!cartResponse.ok) {
        throw new Error('Failed to fetch checkout data');
      }
      cartItems = await cartResponse.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  onMount(() => {
    checkAuthAndFetchCart();
  });

  $: subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
</script>

<div class="page flex flex-col p-4 flex-grow">
  <div class="top flex flex-row justify-between items-center p-4 mb-6">
    <a href="#{previousPage}" class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
      <span class="material-icons-outlined">keyboard_backspace</span> Back
    </a>
    <h1 class="text-4xl text-[#CA9335] font-bold">CHECKOUT</h1>
  </div>

  {#if !isAuthenticated}
    <div class="p-4 text-center text-gray-600">Redirecting to login...</div>
  {:else}
    <div class="checkout-table w-full">
      <div class="table-header grid grid-cols-[2fr_1fr_1fr] gap-4 pb-2 mb-4">
        <div class="text-lg text-[#CA9335] font-semibold">Product</div>
        <div class="text-lg text-[#CA9335] font-semibold text-center">Quantity</div>
        <div class="text-lg text-[#CA9335] font-semibold text-right">Total</div>
      </div>

      <hr class="text-[#CA9335] border-1">

      <div class="table-body flex flex-col gap-6">
        {#if isLoading}
          <div class="p-4 text-center text-gray-600">Loading checkout...</div>
        {:else if error}
          <div class="p-4 text-red-500">Error: {error}</div>
        {:else if cartItems.length === 0}
          <div class="p-4 text-center text-gray-600">Your cart is empty</div>
        {:else}
          {#each cartItems as item}
            <div class="table-row grid grid-cols-[2fr_1fr_1fr] gap-4 items-center">
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
              <div class="quantity text-center text-[#CA9335] font-semibold">{item.quantity}</div>
              <div class="total text-right text-[#CA9335] font-semibold">₱{(item.price * item.quantity).toFixed(2)}</div>
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
          class="w-full bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
        >
          Place Order
        </button>
      </div>
    {/if}
  {/if}
</div>

<style>
  .checkout-table {
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

  .material-icons-outlined {
    font-size: 24px;
    vertical-align: middle;
  }

  .checkout-container {
    max-width: 20rem;
  }
</style>
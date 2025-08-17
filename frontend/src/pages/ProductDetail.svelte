<script>
  import { onMount } from 'svelte';
  export let productId;
  export let previousPage;

  let product = null;
  let isLoading = true;
  let error = null;
  let quantity = 1;
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

  async function fetchProduct() {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Product not found' : 'Failed to fetch product');
      }
      product = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function addToCart() {
    try {
      const body = { productId: Number(productId), quantity: Number(quantity), _csrf: csrfToken };
      if (isAuthenticated) {
        body.userId = user.id;
      } else {
        body.guestId = guestId;
      }
      const response = await fetch('http://localhost:3001/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to add to cart');
      }
      const result = await response.json();
      alert(result.message);
    } catch (err) {
      error = err.message;
    }
  }

  function updateQuantity(delta) {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && (!product || newQuantity <= product.stock)) {
      quantity = newQuantity;
    }
  }

  onMount(async () => {
    await fetchCsrfToken();
    await checkAuth();
    await fetchProduct();
  });
</script>

<!-- Your existing ProductDetail.svelte HTML remains unchanged -->

<div class="product-detail flex flex-col p-8 max-w-4xl mx-auto">
    <div class="top flex flex-row justify-between items-center mb-6">
        <a href="#{previousPage}" class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
            <span class="material-icons-outlined">keyboard_backspace</span> Back
        </a>
        <h1 class="text-4xl text-[#CA9335] font-bold">PRODUCT DETAILS</h1>
    </div>

    {#if isLoading}
        <div class="p-4 text-center text-gray-600">Loading product...</div>
    {:else if error}
        <div class="p-4 text-red-500">Error: {error}</div>
    {:else if product}
        <div class="content flex flex-row gap-8">
            <div class="image-container w-96 h-96 bg-gray-100 rounded-md flex items-center justify-center">
                {#if product.image_url}
                    <img src={`http://localhost:3001${product.image_url}`} alt={product.name} class="w-full h-full object-cover rounded-md" />
                {:else}
                    <span class="text-gray-400 text-sm">Product Image</span>
                {/if}
            </div>
            <div class="details flex flex-col gap-4 flex-1">
                <div>
                    <h2 class="text-2xl text-gray-600 font-semibold">{product.name}</h2>
                    {#if product.brand_name}
                        <p class="text-base text-gray-600">Brand: {product.brand_name}</p>
                    {/if}
                </div>
                <p class="text-[#CA9335] font-semibold text-xl">₱{product.price.toFixed(2)}</p>
                <p class="text-base text-gray-600">{product.description || 'No description available.'}</p>
                {#if product.stock > 0}
                    <div class="quantity flex flex-row items-center gap-2">
                        <button 
                            class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
                            on:click={() => updateQuantity(-1)}
                            disabled={quantity <= 1}
                        >-</button>
                        <input
                            type="number"
                            bind:value={quantity}
                            min="1"
                            max={product.stock}
                            class="w-12 text-center border border-gray-600 text-gray-600 font-semibold rounded-md py-1 px-2"
                        >
                        <button 
                            class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
                            on:click={() => updateQuantity(1)}
                            disabled={quantity >= product.stock}
                        >+</button>
                    </div>
                {/if}
                <button 
                    class="w-full max-w-xs bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors mt-4"
                    on:click={addToCart}
                    disabled={product.stock === 0}
                >
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    .product-detail {
        max-width: 100%;
    }

    .material-icons-outlined {
        font-size: 24px;
        vertical-align: middle;
    }

    .details {
        max-width: 500px;
    }

    button:disabled {
        background-color: #d1d5db;
        color: #6b7280;
        cursor: not-allowed;
        border: none;
    }

    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }

    .quantity button {
        transition: all 0.3s ease;
    }

    .quantity input {
        appearance: textfield;
    }
</style>
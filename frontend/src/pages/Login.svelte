<script>
  import { onMount } from 'svelte';

  export let previousPage = 'home';

  let email = '';
  let password = '';
  let error = null;
  let isLoading = false;
  let isAuthenticated = false;
  let user = null;
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
        const returnTo = new URLSearchParams(window.location.hash.split('?')[1]).get('returnTo') || previousPage;
        window.location.hash = returnTo === 'checkout' ? 'checkout' : returnTo;
      }
    } catch (err) {
      isAuthenticated = false;
      user = null;
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    isLoading = true;
    error = null;

    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, _csrf: csrfToken }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      isAuthenticated = true;
      user = data.user;

      // Clear guest cart
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        await fetch('http://localhost:3001/api/cart/clear-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guestId, _csrf: csrfToken }),
          credentials: 'include'
        });
        localStorage.removeItem('guestId');
      }

      // Dispatch event to update Navbar
      document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));

      // Redirect based on returnTo or previousPage
      const returnTo = new URLSearchParams(window.location.hash.split('?')[1]).get('returnTo') || previousPage;
      window.location.hash = returnTo === 'checkout' ? 'checkout' : returnTo;
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleRegisterRedirect() {
    // Store original previousPage in localStorage
    localStorage.setItem('originalPreviousPage', previousPage);
    history.pushState({ page: 'login' }, '', '#login');
    window.location.hash = 'register';
  }

  function handleBack() {
    history.back();
  }

  onMount(() => {
    async function initialize() {
      await fetchCsrfToken();
      await checkAuth();
    }
    initialize();
  });
</script>

<div class="login-page flex flex-col p-8 max-w-md mx-auto">
  <div class="top flex flex-row justify-between items-center mb-6">
    <button on:click={handleBack} class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
      <span class="material-icons-outlined">keyboard_backspace</span> Back
    </button>
    <h1 class="text-4xl text-[#CA9335] font-bold">LOGIN</h1>
  </div>
  {#if error}
    <div class="text-red-500 mb-4">{error}</div>
  {/if}
  {#if !isAuthenticated}
    <form on:submit={handleLogin} class="w-full flex flex-col gap-4">
      <div class="flex flex-col">
        <label for="email" class="text-[#CA9335] font-semibold mb-1">Email</label>
        <input
          id="email"
          type="email"
          bind:value={email}
          required
          class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
        />
      </div>
      <div class="flex flex-col">
        <label for="password" class="text-[#CA9335] font-semibold mb-1">Password</label>
        <input
          id="password"
          type="password"
          bind:value={password}
          required
          class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        class="bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
      >
        {#if isLoading}Logging in...{:else}Login{/if}
      </button>
    </form>
    <p class="mt-4 text-gray-600">
      Don't have an account? <a href="#register" on:click|preventDefault={handleRegisterRedirect} class="text-[#CA9335] hover:underline">Register</a>
    </p>
  {/if}
</div>

<style>
  .material-icons-outlined {
    font-size: 24px;
    vertical-align: middle;
  }
  button:disabled {
    background-color: #d1d5db;
    color: #6b7280;
    cursor: not-allowed;
    border: none;
  }
</style>
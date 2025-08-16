<script>
  import { onMount } from 'svelte';

  export let previousPage = 'home';

  let step = 1; // 1 for credentials, 2 for user info
  let username = '';
  let email = '';
  let password = '';
  let firstName = '';
  let lastName = '';
  let address = '';
  let phone = '';
  let dateOfBirth = '';
  let profilePicture = null;
  let error = null;
  let isLoading = false;
  let isAuthenticated = false;
  let csrfToken = null;

  async function fetchCsrfToken() {
    try {
      const response = await fetch('http://localhost:3001/api/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch CSRF token');
      const data = await response.json();
      csrfToken = data.csrfToken;
    } catch (err) {
      console.error('CSRF token fetch error:', err);
      error = 'Failed to initialize security token. Please refresh and try again.';
    }
  }

  async function checkAuth() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (response.ok) {
        isAuthenticated = true;
        window.location.hash = previousPage === 'cart' ? 'cart' : previousPage;
      }
    } catch (err) {
      isAuthenticated = false;
    }
  }

  async function handleNext(event) {
    event.preventDefault();
    // Validate credentials
    if (!username || username.length < 3) {
      error = 'Username must be at least 3 characters long';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      error = 'Please enter a valid email address';
      return;
    }
    if (!password || password.length < 6) {
      error = 'Password must be at least 6 characters long';
      return;
    }
    if (!csrfToken) {
      await fetchCsrfToken();
      if (!csrfToken) {
        error = 'Security token unavailable. Please refresh and try again.';
        return;
      }
    }
    step = 2; // Move to user info form
    error = null;
  }

  async function handleRegister(event) {
    event.preventDefault();
    // Validate optional fields
    if (phone && !/^\+?\d{10,15}$/.test(phone)) {
      error = 'Please enter a valid phone number (10-15 digits)';
      return;
    }
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      error = 'Please enter a valid date of birth (YYYY-MM-DD)';
      return;
    }
    if (profilePicture) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(profilePicture.type)) {
        error = 'Please upload a JPEG, PNG, or GIF image';
        return;
      }
      if (profilePicture.size > 5 * 1024 * 1024) {
        error = 'Profile picture must be less than 5MB';
        return;
      }
    }
    if (!csrfToken) {
      await fetchCsrfToken();
      if (!csrfToken) {
        error = 'Security token unavailable. Please refresh and try again.';
        return;
      }
    }
    isLoading = true;
    error = null;

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('first_name', firstName || '');
      formData.append('last_name', lastName || '');
      formData.append('address', address || '');
      formData.append('phone', phone || '');
      formData.append('date_of_birth', dateOfBirth || '');
      formData.append('_csrf', csrfToken);
      if (profilePicture) {
        formData.append('profile_picture', profilePicture);
      }

      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken // Add CSRF token as header
        },
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Clear guest cart
      const guestId = localStorage.getItem('guestId');
      if (guestId) {
        await fetch('http://localhost:3001/api/cart/clear-guest', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken // Add CSRF token for cart clear
          },
          body: JSON.stringify({ guestId, _csrf: csrfToken }),
          credentials: 'include'
        });
        localStorage.removeItem('guestId');
      }

      // Dispatch event to update Navbar
      document.dispatchEvent(new CustomEvent('userLoggedIn', { detail: data.user }));

      // Clear originalPreviousPage after registration
      localStorage.removeItem('originalPreviousPage');
      window.location.hash = 'home';
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleLoginRedirect() {
    history.pushState({ page: 'register' }, '', '#register');
    window.location.hash = `login?returnTo=${localStorage.getItem('originalPreviousPage') || previousPage}`;
  }

  function handleBack() {
    if (step === 2) {
      step = 1; // Go back to credentials form
      profilePicture = null; // Reset profile picture
    } else {
      history.back();
    }
  }

  onMount(() => {
    async function initialize() {
      await fetchCsrfToken();
      await checkAuth();
    }
    initialize();
  });
</script>

<div class="register-page flex flex-col p-8 max-w-md mx-auto">
  <div class="top flex flex-row justify-between items-center mb-6">
    <button on:click={handleBack} class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
      <span class="material-icons-outlined">keyboard_backspace</span> Back
    </button>
    <h1 class="text-4xl text-[#CA9335] font-bold">REGISTER</h1>
  </div>
  {#if error}
    <div class="text-red-500 mb-4">{error}</div>
  {/if}
  {#if !isAuthenticated}
    {#if step === 1}
      <form on:submit={handleNext} class="w-full flex flex-col gap-4">
        <div class="flex flex-col">
          <label for="username" class="text-[#CA9335] font-semibold mb-1">Username</label>
          <input
            id="username"
            type="text"
            bind:value={username}
            required
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
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
          Next
        </button>
      </form>
    {:else}
      <form on:submit={handleRegister} class="w-full flex flex-col gap-4">
        <div class="flex flex-col">
          <label for="profilePicture" class="text-[#CA9335] font-semibold mb-1">Profile Picture</label>
          <input
            id="profilePicture"
            type="file"
            accept="image/jpeg,image/png,image/gif"
            on:change={(e) => {
              if (e.target instanceof HTMLInputElement && e.target.files) {
                profilePicture = e.target.files[0];
              } else {
                profilePicture = null;
              }
            }}
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
        <div class="flex flex-col">
          <label for="firstName" class="text-[#CA9335] font-semibold mb-1">First Name</label>
          <input
            id="firstName"
            type="text"
            bind:value={firstName}
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
        <div class="flex flex-col">
          <label for="lastName" class="text-[#CA9335] font-semibold mb-1">Last Name</label>
          <input
            id="lastName"
            type="text"
            bind:value={lastName}
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
        <div class="flex flex-col">
          <label for="address" class="text-[#CA9335] font-semibold mb-1">Address</label>
          <textarea
            id="address"
            bind:value={address}
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          ></textarea>
        </div>
        <div class="flex flex-col">
          <label for="phone" class="text-[#CA9335] font-semibold mb-1">Phone</label>
          <input
            id="phone"
            type="tel"
            bind:value={phone}
            placeholder="e.g., +639123456789"
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
        <div class="flex flex-col">
          <label for="dateOfBirth" class="text-[#CA9335] font-semibold mb-1">Date of Birth</label>
          <input
            id="dateOfBirth"
            type="date"
            bind:value={dateOfBirth}
            class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          class="bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors"
        >
          {#if isLoading}Registering...{:else}Register{/if}
        </button>
      </form>
    {/if}
    <p class="mt-4 text-gray-600">
      Already have an account? <a href="#login" on:click|preventDefault={handleLoginRedirect} class="text-[#CA9335] hover:underline">Login</a>
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
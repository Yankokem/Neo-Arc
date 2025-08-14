<script>
  import logo from '/src/assets/logo1.png';
  import { onMount } from 'svelte';

  let menuData = { gadgets: [], computerHardware: { components: [], peripherals: [] } };
  let isLoading = false;
  let error = null;
  let isAuthenticated = false;
  let user = null;
  let isAccountDropdownOpen = false;
  let csrfToken = null;
  let profileImageUrl = null;

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

  async function fetchMenuData() {
    try {
      isLoading = true;
      const response = await fetch('http://localhost:3001/api/nav-menu');
      if (!response.ok) throw new Error('Failed to fetch menu data');
      menuData = await response.json();
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
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
        await fetchProfileImage();
      } else {
        isAuthenticated = false;
        user = null;
        profileImageUrl = null;
      }
    } catch (err) {
      isAuthenticated = false;
      user = null;
      profileImageUrl = null;
    }
  }

  async function fetchProfileImage() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      const data = await response.json();
      profileImageUrl = data.user.profile_image_url || null;
    } catch (err) {
      console.error('Profile image fetch error:', err);
      profileImageUrl = null;
    }
  }

  async function handleLogout() {
    try {
      if (!csrfToken) {
        await fetchCsrfToken();
        if (!csrfToken) throw new Error('CSRF token unavailable');
      }
      const response = await fetch('http://localhost:3001/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _csrf: csrfToken }),
        credentials: 'include'
      });
      if (response.ok) {
        isAuthenticated = false;
        user = null;
        isAccountDropdownOpen = false;
        profileImageUrl = null;
        window.location.hash = 'home';
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.error('Logout failed:', err);
      error = err.message;
    }
  }

  function handleUserLoggedIn(e) {
    user = e.detail;
    isAuthenticated = true;
    fetchProfileImage();
  }

  function toggleAccountDropdown() {
    isAccountDropdownOpen = !isAccountDropdownOpen;
  }

  onMount(() => {
    async function initialize() {
      await fetchCsrfToken();
      await fetchMenuData();
      await checkAuth();
    }
    initialize();

    document.addEventListener('userLoggedIn', handleUserLoggedIn);
    return () => {
      document.removeEventListener('userLoggedIn', handleUserLoggedIn);
    };
  });
</script>

<nav>
  <div class="navbar flex items-center justify-between px-[30px] py-[5px] relative">
    <div class="logo-container flex items-center">
      <img src="{logo}" alt="logo" class="w-25">
    </div>
    
    {#if isLoading}
      <div class="text-center">Loading menu...</div>
    {:else if error}
      <div class="text-red-500">Error: {error}</div>
    {:else}
      <div class="middle flex items-center gap-10 text-lg">
        <a href="#home" class="text-[#CA9335] font-semibold">Home</a>
        
        <!-- Gadgets Dropdown -->
        <div class="dropdown-container relative">
          <a href="#gadgets" class="text-[#CA9335] font-semibold hover:dropdown-trigger">Gadgets</a>
          <div class="dropdown-menu absolute hidden bg-white shadow-lg w-[200px] left-0 top-full mt-0 z-50">
            {#each menuData.gadgets as gadget}
              <a href={gadget.href} class="block px-4 py-2 hover:bg-[#eeeeee]">{gadget.name}</a>
            {/each}
          </div>
        </div>
        
        <!-- Computer Hardware Dropdown -->
        <div class="dropdown-container relative">
          <a href="#computer-hardware" class="text-[#CA9335] font-semibold hover:dropdown-trigger">Computer Hardware</a>
          <div class="dropdown-menu absolute hidden bg-white shadow-lg w-[200px] left-0 top-full mt-0 z-50">
            <!-- Components Sub-Dropdown -->
            <div class="sub-dropdown-container relative group">
              <a href="#components" class="block px-4 py-2 hover:bg-[#eeeeee]">Components</a>
              <div class="sub-dropdown-menu absolute hidden left-full top-0 ml-0 bg-white shadow-lg w-[200px] z-50">
                {#each menuData.computerHardware.components as component}
                  <a href={component.href} class="block px-4 py-2 hover:bg-[#eeeeee]">{component.name}</a>
                {/each}
              </div>
            </div>
            
            <!-- Peripherals Sub-Dropdown -->
            <div class="sub-dropdown-container relative group">
              <a href="#peripherals" class="block px-4 py-2 hover:bg-[#eeeeee]">Peripherals</a>
              <div class="sub-dropdown-menu absolute hidden left-full top-0 ml-0 bg-white shadow-lg w-[200px] z-50">
                {#each menuData.computerHardware.peripherals as peripheral}
                  <a href={peripheral.href} class="block px-4 py-2 hover:bg-[#eeeeee]">{peripheral.name}</a>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="dropdown-container relative">
          <a href="#all-products" class="text-[#CA9335] font-semibold hover:dropdown-trigger">All Products</a>
        </div>
      </div>
    {/if}

    <div class="right flex items-center gap-6">
      <a href="#cart" class="cart-icon flex items-center text-[#CA9335] text-lg font-semibold">
        <span class="material-icons-outlined text-[40px] leading-none">local_mall</span>
      </a>
      <div class="account relative flex flex-col items-end">
        {#if isAuthenticated}
          <div class="flex items-center gap-2 cursor-pointer" on:click={toggleAccountDropdown}>
            <div class="relative">
              {#if profileImageUrl}
                <img src={`http://localhost:3001${profileImageUrl}`} alt="Profile" class="w-10 h-10 rounded-full">
              {:else}
                <span class="material-icons-outlined leading-none text-[#CA9335] align-middle inline-block text-[40px]">account_box</span>
              {/if}
            </div>
            <div class="flex flex-col">
              <div class="text-[#CA9335] text-lg font-semibold cursor-default">{user.username}</div>
              <div class="account-text text-gray-500 text-sm cursor-pointer hover:underline">
                Account
                <span class="material-icons-outlined">arrow_drop_down</span>
              </div>
            </div>
          </div>
          
          {#if isAccountDropdownOpen}
            <div class="account-dropdown absolute bg-white shadow-lg w-[150px] right-0 top-full mt-2 z-50 rounded-md">
              <a href="#profile" class="block px-4 py-2 hover:bg-[#eeeeee]">Profile</a>
              <button on:click={handleLogout} class="block w-full text-left px-4 py-2 hover:bg-[#eeeeee]">Logout</button>
            </div>
          {/if}
        {:else}
          <a href="#login" class="text-[#CA9335] text-lg font-semibold">Login/Register</a>
        {/if}
      </div>
    </div>
  </div>
</nav>

<style>
  .relative {
    position: relative;
  }
  
  .absolute {
    position: absolute;
  }

  a {
    color: #CA9335;
    position: relative;
    text-decoration: none;
  }

  a::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 0%;
    height: 4px;
    bottom: -9px;
    background-color: #CA9335;
    transition: width 0.3s ease-in-out;
  }

  a:hover::after {
    width: 100%;
  }
  
  .dropdown-container:hover .dropdown-menu {
    display: block;
  }
  
  .dropdown-menu {
    display: none;
    border-radius: 0 0 4px 4px;
    border-top: 2px solid #CA9335;
  }
  
  .sub-dropdown-container:hover .sub-dropdown-menu {
    display: block !important;
  }
  
  .sub-dropdown-menu {
    display: none;
    border-radius: 0 4px 4px 4px;
  }
  
  .dropdown-menu a::after,
  .sub-dropdown-menu a::after {
    display: none;
  }
  
  .dropdown-menu a:hover,
  .sub-dropdown-menu a:hover {
    background-color: #eeeeee;
  }

  .account-dropdown {
    border: 1px solid #CA9335;
  }

  .account-dropdown button:hover {
    background-color: #eeeeee;
  }

  .account a::after {
    bottom: -2px;
  }

  .account {
    line-height: 1.5;
    font-size: unset;
  }

  .account .material-icons-outlined {
    font-size: 40px !important;
    line-height: 1;
    vertical-align: middle;
  }

  .cart-icon .material-icons-outlined {
    font-size: 40px !important;
  }

  .account-text .material-icons-outlined {
    font-size: 20px !important;
    vertical-align: middle;
  }
</style>
<script>
  import { onMount } from 'svelte';

  export let previousPage = 'home';

  let user = null;
  let isLoading = true;
  let error = null;
  let isAuthenticated = false;
  let editFullName = false;
  let editUsername = false;
  let editBillingAddress = false;
  let addingNewAddress = false;
  let csrfToken = null;
  let formData = {
    username: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    profile_picture: null
  };
  let fileInput = null;
  let newAddressTitle = '';

  // Format date to "Month DD, YYYY" (e.g., August 17, 2004)
  function formatDate(dateStr) {
    if (!dateStr) return 'Not set';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  // Get full name for display
  function getFullName(firstName, lastName) {
    const parts = [];
    if (firstName) parts.push(firstName);
    if (lastName) parts.push(lastName);
    return parts.length > 0 ? parts.join(' ') : 'Not set';
  }

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
      error = 'Failed to initialize security token';
    }
  }

  async function checkAuthAndFetchProfile() {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        isAuthenticated = false;
        window.location.hash = `login?returnTo=profile`;
        return;
      }
      isAuthenticated = true;

      const profileResponse = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'GET',
        credentials: 'include'
      });
      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile data');
      }
      const data = await profileResponse.json();
      user = data.user;
      formData = {
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        address: user.address || '',
        phone: user.phone || '',
        profile_picture: null
      };
    } catch (err) {
      error = err.message;
      isAuthenticated = false;
      window.location.hash = `login?returnTo=profile`;
    } finally {
      isLoading = false;
    }
  }

  async function handleSaveChanges(event) {
    event.preventDefault();
    if (!csrfToken) {
      await fetchCsrfToken();
      if (!csrfToken) {
        error = 'Security token unavailable. Please refresh and try again.';
        return;
      }
    }

    // Validate only relevant fields
    if (editUsername && formData.username.length < 3) {
      error = 'Username must be at least 3 characters long';
      return;
    }
    if (editBillingAddress && formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      error = 'Please enter a valid contact number (10-15 digits)';
      return;
    }
    if (formData.profile_picture) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(formData.profile_picture.type)) {
        error = 'Please upload a JPEG, PNG, or GIF image';
        return;
      }
      if (formData.profile_picture.size > 5 * 1024 * 1024) {
        error = 'Profile picture must be less than 5MB';
        return;
      }
    }

    isLoading = true;
    error = null;

    try {
      const formDataToSend = new FormData();
      if (editUsername) formDataToSend.append('username', formData.username);
      if (editFullName) {
        formDataToSend.append('first_name', formData.first_name || '');
        formDataToSend.append('last_name', formData.last_name || '');
      }
      if (editBillingAddress && !addingNewAddress) {
        formDataToSend.append('address', formData.address || '');
        formDataToSend.append('phone', formData.phone || '');
      }
      formDataToSend.append('_csrf', csrfToken);
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'X-CSRF-Token': csrfToken
        },
        body: formDataToSend,
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      user = data.user;
      formData = {
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        address: user.address || '',
        phone: user.phone || '',
        profile_picture: null
      };
      // Force image reload by appending timestamp to URL
      if (user.profile_picture_url) {
        user.profile_picture_url = `${user.profile_picture_url}?t=${Date.now()}`;
      }
      editFullName = false;
      editUsername = false;
      editBillingAddress = false;
      addingNewAddress = false;
      newAddressTitle = '';
      alert(data.message);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function handleAddAddress() {
    addingNewAddress = true;
    newAddressTitle = '';
    formData.address = '';
    formData.phone = '';
    editBillingAddress = true;
  }

  async function handleSaveNewAddress(event) {
    event.preventDefault();
    if (!newAddressTitle) {
      error = 'Address title is required';
      return;
    }
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      error = 'Please enter a valid contact number (10-15 digits)';
      return;
    }

    isLoading = true;
    error = null;

    try {
      const response = await fetch('http://localhost:3001/api/auth/address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          title: newAddressTitle,
          address: formData.address || '',
          phone: formData.phone || '',
          _csrf: csrfToken
        }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add address');
      }

      await checkAuthAndFetchProfile();
      addingNewAddress = false;
      newAddressTitle = '';
      editBillingAddress = false;
      alert(data.message);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function selectAddress(address) {
    if (editBillingAddress) return; // Prevent switching during edit
    isLoading = true;
    error = null;

    try {
      const response = await fetch('http://localhost:3001/api/auth/address/primary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          address_id: address.id,
          _csrf: csrfToken
        }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to set primary address');
      }

      await checkAuthAndFetchProfile();
      editBillingAddress = false; // Ensure default mode
      alert(data.message);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleEditBillingAddress() {
    editBillingAddress = true;
    addingNewAddress = false;
    formData.address = user.address || '';
    formData.phone = user.phone || '';
  }

  function handleCancel() {
    editFullName = false;
    editUsername = false;
    editBillingAddress = false;
    addingNewAddress = false;
    newAddressTitle = '';
    formData = {
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      address: user.address || '',
      phone: user.phone || '',
      profile_picture: null
    };
  }

  function triggerFileInput() {
    if (fileInput) {
      fileInput.click();
    }
  }

  function handleBack() {
    window.location.hash = previousPage;
  }

  onMount(async () => {
    await fetchCsrfToken();
    await checkAuthAndFetchProfile();
  });
</script>

<div class="profile-page flex flex-col p-8 w-full">
  <div class="top flex flex-row justify-between items-center mb-6">
    <button on:click={handleBack} class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
      <span class="material-icons-outlined">keyboard_backspace</span> Back
    </button>
    <h1 class="text-4xl text-[#CA9335] font-bold">PROFILE</h1>
  </div>

  {#if isLoading}
    <div class="p-4 text-center text-gray-600">Loading profile...</div>
  {:else if error}
    <div class="p-4 text-red-500">Error: {error}</div>
  {:else if !isAuthenticated}
    <div class="p-4 text-center text-gray-600">Redirecting to login...</div>
  {:else}
    <div class="profile-content flex flex-row gap-8">
      <!-- Profile Image and Username Container -->
      <div class="left-container flex flex-col items-center w-64 gap-4">
        <div
          class="image-container w-64 h-64 bg-gray-100 rounded-md flex items-center justify-center cursor-pointer relative"
          on:click={triggerFileInput}
        >
          {#if user.profile_picture_url}
            <img
              src={`http://localhost:3001${user.profile_picture_url}`}
              alt="Profile Picture"
              class="w-full h-full object-cover rounded-md hover:opacity-70 transition-opacity"
            />
          {:else}
            <span class="text-gray-400 text-sm">Click to select image</span>
          {/if}
          <div class="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span class="text-[#CA9335] text-lg flex items-center gap-2">
              <span class="material-icons-outlined">edit</span>
              Edit
            </span>
          </div>
        </div>
        <input
          bind:this={fileInput}
          id="profilePicture"
          type="file"
          accept="image/jpeg,image/png,image/gif"
          on:change={(e) => {
            if (e.target instanceof HTMLInputElement && e.target.files) {
              formData.profile_picture = e.target.files[0];
              handleSaveChanges(new Event('submit'));
            } else {
              formData.profile_picture = null;
            }
          }}
          class="hidden"
        />
        <div class="text-center relative w-full">
          {#if editUsername}
            <input
              id="username"
              type="text"
              bind:value={formData.username}
              class="text-3xl text-[#CA9335] font-bold text-center border-b-2 border-gray-600 py-2 px-3 focus:outline-none focus:border-[#CA9335] w-full"
              on:blur={() => { if (formData.username !== user.username) handleSaveChanges(new Event('submit')); editUsername = false; }}
              autofocus
            />
          {:else}
            <div
              class="username-container relative"
              on:click={() => editUsername = true}
            >
              <h2 class="text-3xl text-[#CA9335] font-bold text-center">{user.username || 'Not set'}</h2>
              <div class="absolute top-0 left-0 flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity p-1 z-10">
                <span class="material-icons-outlined text-sm text-[#CA9335]">edit</span>
              </div>
            </div>
          {/if}
          <p class="text-base text-gray-500 capitalize">{user.role || 'Not set'}</p>
        </div>
      </div>

      <!-- Profile Info -->
      <div class="info-container flex-1 flex flex-col gap-6">
        {#if editFullName}
          <form on:submit|preventDefault={handleSaveChanges} class="flex flex-col gap-6">
            <!-- Full Name Container -->
            <div class="border border-gray-300 rounded-md p-4 flex flex-col gap-4 relative">
              <h3 class="text-xl text-[#CA9335] font-semibold">Full Name</h3>
              <div class="flex flex-col gap-4">
                <div class="flex flex-col">
                  <label for="firstName" class="text-[#CA9335] font-semibold mb-1">First Name</label>
                  <input
                    id="firstName"
                    type="text"
                    bind:value={formData.first_name}
                    class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                  />
                </div>
                <div class="flex flex-col">
                  <label for="lastName" class="text-[#CA9335] font-semibold mb-1">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    bind:value={formData.last_name}
                    class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                  />
                </div>
              </div>
              <div class="ml-auto mt-2">
                <button
                  type="button"
                  on:click={handleCancel}
                  disabled={isLoading}
                  class="bg-white text-[#CA9335] py-2 px-4 rounded-md border-2 border-[#CA9335] hover:bg-[#CA9335] hover:text-white hover:border-[#CA9335] transition-colors mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
                >
                  {#if isLoading}Saving...{:else}Save{/if}
                </button>
              </div>
            </div>
          </form>
        {:else}
          <!-- Full Name Container -->
          <div class="border border-gray-300 rounded-md p-4 flex flex-col gap-2 relative">
            <h3 class="text-xl text-[#CA9335] font-semibold">Full Name</h3>
            <p class="text-gray-600">{getFullName(user.first_name, user.last_name)}</p>
            <button
              on:click={() => editFullName = true}
              class="absolute bottom-4 right-4 bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
            >
              Edit
            </button>
          </div>
        {/if}

        <!-- Billing Address Container -->
        <div class="border border-gray-300 rounded-md p-4 flex flex-col gap-4 relative">
          <h3 class="text-xl text-[#CA9335] font-semibold">Billing Address</h3>
          <!-- Always show address buttons -->
          <div class="flex flex-wrap gap-2 mb-2">
            <button
              type="button"
              on:click={handleAddAddress}
              disabled={isLoading || editBillingAddress}
              class="flex items-center gap-1 bg-[#CA9335] text-white py-1 px-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] border-2 border-transparent transition-colors disabled:bg-gray-300 disabled:text-gray-600 disabled:border-none disabled:cursor-not-allowed"
            >
              <span class="material-icons-outlined">add_home</span>
              Add
            </button>
            {#each user.addresses || [] as addr}
              <button
                type="button"
                on:click={() => selectAddress(addr)}
                disabled={isLoading || editBillingAddress}
                class="flex items-center gap-1 py-1 px-2 rounded-md border-2 transition-colors disabled:bg-gray-300 disabled:text-gray-600 disabled:border-none disabled:cursor-not-allowed"
                class:bg-[#CA9335]={addr.is_primary}
                class:text-white={addr.is_primary}
                class:bg-white={!addr.is_primary}
                class:text-[#CA9335]={!addr.is_primary}
                class:border-[#CA9335]={true}
                class:hover:bg-[#CA9335]={!addr.is_primary && !editBillingAddress}
                class:hover:text-white={!addr.is_primary && !editBillingAddress}
              >
                {addr.title}
                {#if addr.is_primary}
                  <span class="material-icons-outlined text-sm">check_circle</span>
                {/if}
              </button>
            {/each}
          </div>
          {#if editBillingAddress}
            <form on:submit|preventDefault={addingNewAddress ? handleSaveNewAddress : handleSaveChanges} class="flex flex-col gap-4">
              {#if addingNewAddress}
                <div class="flex flex-col">
                  <label for="addressTitle" class="text-[#CA9335] font-semibold mb-1">Title</label>
                  <input
                    id="addressTitle"
                    type="text"
                    bind:value={newAddressTitle}
                    class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                  />
                </div>
              {/if}
              <div class="flex flex-col gap-4">
                <div class="flex flex-col">
                  <label for="address" class="text-[#CA9335] font-semibold mb-1">Address</label>
                  <textarea
                    id="address"
                    bind:value={formData.address}
                    class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                  ></textarea>
                </div>
                <div class="flex flex-col">
                  <label for="phone" class="text-[#CA9335] font-semibold mb-1">Contact Number</label>
                  <input
                    id="phone"
                    type="tel"
                    bind:value={formData.phone}
                    placeholder="e.g., +639123456789"
                    class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                  />
                </div>
              </div>
              <div class="ml-auto mt-2">
                <button
                  type="button"
                  on:click={handleCancel}
                  disabled={isLoading}
                  class="bg-white text-[#CA9335] py-2 px-4 rounded-md border-2 border-[#CA9335] hover:bg-[#CA9335] hover:text-white hover:border-[#CA9335] transition-colors mr-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  class="bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
                >
                  {#if isLoading}Saving...{:else}{addingNewAddress ? 'Add' : 'Save'}{/if}
                </button>
              </div>
            </form>
          {:else}
            <div class="flex flex-col gap-2">
              <div>
                <span class="text-[#CA9335] font-semibold">Address</span>
                <p class="text-gray-600">{user.address || 'Not set'}</p>
              </div>
              <div>
                <span class="text-[#CA9335] font-semibold">Contact Number</span>
                <p class="text-gray-600">{user.phone || 'Not set'}</p>
              </div>
            </div>
            <button
              on:click={handleEditBillingAddress}
              class="absolute bottom-4 right-4 bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
            >
              Edit
            </button>
          {/if}
        </div>

        <!-- Email Container -->
        <div class="border border-gray-300 rounded-md p-4 flex flex-col gap-2">
          <h3 class="text-xl text-[#CA9335] font-semibold">Email</h3>
          <p class="text-gray-600">{user.email || 'Not set'}</p>
        </div>

        <!-- Birthday Container -->
        <div class="border border-gray-300 rounded-md p-4 flex flex-col gap-2">
          <h3 class="text-xl text-[#CA9335] font-semibold">Birthday</h3>
          <p class="text-gray-600">{formatDate(user.date_of_birth)}</p>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .material-icons-outlined {
    font-size: 24px;
    vertical-align: middle;
  }
  .material-icons-outlined.text-sm {
    font-size: 16px;
  }
  button:disabled {
    background-color: #d1d5db;
    color: #6b7280;
    cursor: not-allowed;
    border: none;
  }
  .username-container {
    position: relative;
    cursor: pointer;
  }
</style>
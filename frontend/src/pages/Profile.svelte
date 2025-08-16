<script>
  import { onMount } from 'svelte';
  export let previousPage = 'home';

  let user = null;
  let isLoading = true;
  let error = null;
  let isAuthenticated = false;
  let editMode = false;
  let csrfToken = null;
  let formData = {
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    address: '',
    phone: '',
    date_of_birth: '',
    profile_picture: null
  };

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
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        address: user.address || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
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

    // Basic validation
    if (formData.username && formData.username.length < 3) {
      error = 'Username must be at least 3 characters long';
      return;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      error = 'Please enter a valid email address';
      return;
    }
    if (formData.phone && !/^\+?\d{10,15}$/.test(formData.phone)) {
      error = 'Please enter a valid phone number (10-15 digits)';
      return;
    }
    if (formData.date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_of_birth)) {
      error = 'Please enter a valid date of birth (YYYY-MM-DD)';
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
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('first_name', formData.first_name || '');
      formDataToSend.append('last_name', formData.last_name || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('phone', formData.phone || '');
      formDataToSend.append('date_of_birth', formData.date_of_birth || '');
      formDataToSend.append('_csrf', csrfToken);
      if (formData.profile_picture) {
        formDataToSend.append('profile_picture', formData.profile_picture);
      }

      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'X-CSRF-Token': csrfToken // Add CSRF token as header
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
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        address: user.address || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        profile_picture: null
      };
      editMode = false;
      alert(data.message);
    } catch (err) {
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function toggleEditMode() {
    editMode = !editMode;
    if (!editMode) {
      formData.profile_picture = null; // Reset file input when exiting edit mode
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
      <!-- Profile Image Container -->
      <div class="image-container w-64 h-64 bg-gray-100 rounded-md flex items-center justify-center">
        {#if user.profile_picture_url}
          <img
            src={`http://localhost:3001${user.profile_picture_url}`}
            alt="Profile Picture"
            class="w-full h-full object-cover rounded-md"
          />
        {:else}
          <span class="text-gray-400 text-sm">Profile Image</span>
        {/if}
      </div>

      <!-- Profile Info -->
      <div class="info-container flex-1 flex flex-col gap-4">
        {#if editMode}
          <form on:submit|preventDefault={handleSaveChanges} class="flex flex-col gap-4">
            <div class="flex flex-col">
              <input
                id="username"
                type="text"
                bind:value={formData.username}
                placeholder="Username"
                class="text-4xl text-[#CA9335] font-bold border-b-2 border-gray-300 py-2 px-3 focus:outline-none focus:border-[#CA9335]"
              />
            </div>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col">
                <label for="profilePicture" class="text-xl text-[#CA9335] font-semibold mb-1">Profile Picture</label>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  on:change={(e) => {
                    if (e.target instanceof HTMLInputElement && e.target.files) {
                      formData.profile_picture = e.target.files[0];
                    } else {
                      formData.profile_picture = null;
                    }
                  }}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="email" class="text-xl text-[#CA9335] font-semibold mb-1">Email</label>
                <input
                  id="email"
                  type="email"
                  bind:value={formData.email}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="firstName" class="text-xl text-[#CA9335] font-semibold mb-1">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  bind:value={formData.first_name}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="lastName" class="text-xl text-[#CA9335] font-semibold mb-1">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  bind:value={formData.last_name}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="address" class="text-xl text-[#CA9335] font-semibold mb-1">Address</label>
                <textarea
                  id="address"
                  bind:value={formData.address}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                ></textarea>
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="phone" class="text-xl text-[#CA9335] font-semibold mb-1">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  bind:value={formData.phone}
                  placeholder="e.g., +639123456789"
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
              <hr class="border-gray-300" />
              <div class="flex flex-col">
                <label for="dateOfBirth" class="text-xl text-[#CA9335] font-semibold mb-1">Date of Birth</label>
                <input
                  id="dateOfBirth"
                  type="date"
                  bind:value={formData.date_of_birth}
                  class="border border-gray-600 rounded-md py-2 px-3 text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#CA9335]"
                />
              </div>
            </div>
            <div class="button-container ml-auto mt-4">
              <button
                type="submit"
                disabled={isLoading}
                class="bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
              >
                {#if isLoading}Saving...{:else}Save Changes{/if}
              </button>
            </div>
          </form>
        {:else}
          <div class="flex flex-col gap-4">
            <div>
              <h2 class="text-4xl text-[#CA9335] font-bold">{user.username || 'Not set'}</h2>
            </div>
            <div class="flex flex-col gap-4">
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">Email</span>
                <p class="text-gray-600">{user.email || 'Not set'}</p>
              </div>
              <hr class="border-gray-300" />
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">First Name</span>
                <p class="text-gray-600">{user.first_name || 'Not set'}</p>
              </div>
              <hr class="border-gray-300" />
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">Last Name</span>
                <p class="text-gray-600">{user.last_name || 'Not set'}</p>
              </div>
              <hr class="border-gray-300" />
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">Address</span>
                <p class="text-gray-600">{user.address || 'Not set'}</p>
              </div>
              <hr class="border-gray-300" />
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">Phone</span>
                <p class="text-gray-600">{user.phone || 'Not set'}</p>
              </div>
              <hr class="border-gray-300" />
              <div>
                <span class="text-xl text-[#CA9335] font-semibold">Date of Birth</span>
                <p class="text-gray-600">{user.date_of_birth || 'Not set'}</p>
              </div>
            </div>
            <div class="button-container ml-auto mt-4">
              <button
                on:click={toggleEditMode}
                class="bg-[#CA9335] text-white py-2 px-4 rounded-md border-2 border-transparent hover:bg-white hover:text-[#CA9335] hover:border-[#CA9335] transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>
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
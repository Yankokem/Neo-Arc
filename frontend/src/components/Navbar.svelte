<script>
    import logo from '/src/assets/logo1.png';
    import { onMount } from 'svelte';

    let menuData = { gadgets: [], computerHardware: { components: [], peripherals: [] } };
    let isLoading = false;
    let error = null;

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

    onMount(() => {
        fetchMenuData();
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

        <div class="right flex items-center gap-1">
            <a href="#cart" class="flex items-center gap-2 text-[#CA9335] text-lg font-semibold">
                <span class="material-icons-outlined text-[24px] leading-none">local_mall</span>
                <span>Cart</span>
            </a>
        </div>
    </div>
</nav>

<style>
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
</style>
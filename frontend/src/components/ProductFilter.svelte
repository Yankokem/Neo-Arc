<script>
    import { fade } from 'svelte/transition';
    
    // State for filters
    let filterData = {
        categories: [],
        brands: [],
        availability: {
            inStock: false,
            outOfStock: false
        },
        priceRange: {
            min: 0,
            max: 100000
        }
    };
    
    let selectedCategories = [];
    let selectedBrands = [];
    let minPrice = '0'; // Changed to string
    let maxPrice = '100000'; // Changed to string
    
    // UI state
    let showAvailability = false;
    let showCategories = false;
    let showBrands = false;
    let isLoading = true;
    let error = null;

    // Fetch filter options automatically on mount
    async function fetchFilterOptions() {
        try {
            const response = await fetch('http://localhost:3001/api/filter-data');
            const data = await response.json();
            filterData = {
                ...filterData,
                categories: data.categories,
                brands: data.brands,
                priceRange: {
                    min: data.priceRange.min,
                    max: data.priceRange.max
                }
            };
            minPrice = data.priceRange.min.toString(); // Convert to string
            maxPrice = data.priceRange.max.toString(); // Convert to string
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    fetchFilterOptions();

    // Toggle functions
    const toggleAvailability = (type) => {
        filterData.availability[type] = !filterData.availability[type];
    };

    const toggleCategory = (id) => {
        selectedCategories = selectedCategories.includes(id)
            ? selectedCategories.filter(c => c !== id)
            : [...selectedCategories, id];
    };

    const toggleBrand = (brand) => {
        selectedBrands = selectedBrands.includes(brand)
            ? selectedBrands.filter(b => b !== brand)
            : [...selectedBrands, brand];
    };

    // Apply filters
    async function applyFilters() {
        try {
            const queryParams = new URLSearchParams();
            if (selectedCategories.length > 0) {
                queryParams.append('categories', selectedCategories.join(','));
            }
            if (selectedBrands.length > 0) {
                queryParams.append('brands', selectedBrands.join(','));
            }
            queryParams.append('minPrice', Number(minPrice).toString()); // Convert to number for query
            queryParams.append('maxPrice', Number(maxPrice).toString()); // Convert to number for query
            if (filterData.availability.inStock) {
                queryParams.append('inStock', 'true');
            }
            if (filterData.availability.outOfStock) {
                queryParams.append('outOfStock', 'true');
            }

            const response = await fetch(`http://localhost:3001/api/filter-data/products?${queryParams.toString()}`);
            const products = await response.json();
            
            // Dispatch custom event to notify parent component of filtered products
            const event = new CustomEvent('filterApplied', { detail: { products } });
            document.dispatchEvent(event);
        } catch (err) {
            error = err.message;
        }
    }

    // Reset filters
    function resetFilters() {
        selectedCategories = [];
        selectedBrands = [];
        filterData.availability.inStock = false;
        filterData.availability.outOfStock = false;
        minPrice = filterData.priceRange.min.toString(); // Convert to string
        maxPrice = filterData.priceRange.max.toString(); // Convert to string
        applyFilters();
    }
</script>

<div class="filter-container flex flex-col gap-4 p-4">
    <div class="top flex flex-row justify-between items-center mb-4">
        <h2 class="text-3xl text-[#CA9335] font-bold">FILTER:</h2>
        <button class="text-sm text-gray-600 font-semibold border-b border-current hover:border-b-3" on:click={resetFilters}>Remove all</button>
    </div>

    {#if isLoading}
        <div class="p-4 text-center">Loading filters...</div>
    {:else if error}
        <div class="p-4 text-red-500">Error: {error}</div>
    {:else}
        <!-- Availability Section -->
        <div class="filter-section">
            <button
                class="flex justify-between items-center w-full text-left py-2"
                on:click={() => showAvailability = !showAvailability}
            >
                <h2 class="text-lg font-semibold text-[#CA9335]">Availability</h2>
                <span class="text-[#CA9335] text-xl">{showAvailability ? '−' : '+'}</span>
            </button>
            
            {#if showAvailability}
                <div class="flex flex-col gap-2 pl-4 pb-2" transition:fade>
                    <div class="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="in-stock"
                            bind:checked={filterData.availability.inStock}
                        >
                        <label for="in-stock" class="text-sm text-gray-600 font-semibold">In Stock</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            id="out-of-stock"
                            bind:checked={filterData.availability.outOfStock}
                        >
                        <label for="out-of-stock" class="text-sm text-gray-600 font-semibold ">Out of Stock</label>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Categories Section -->
        <div class="filter-section">
            <button
                class="flex justify-between items-center w-full text-left py-2"
                on:click={() => showCategories = !showCategories}
            >
                <h2 class="text-lg text-[#CA9335] font-semibold">Categories ({selectedCategories.length})</h2>
                <span class="text-[#CA9335] text-xl">{showCategories ? '−' : '+'}</span>
            </button>
            
            {#if showCategories}
                <div class="flex flex-col gap-2 pl-4 pb-2" transition:fade>
                    {#each filterData.categories as category}
                        <div class="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id={`cat-${category.id}`}
                                checked={selectedCategories.includes(category.id)}
                                on:change={() => toggleCategory(category.id)}
                            >
                            <label class="text-sm text-gray-600 font-semibold" for={`cat-${category.id}`}>{category.name}</label>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Brands Section -->
        <div class="filter-section">
            <button
                class="flex justify-between items-center w-full text-left py-2"
                on:click={() => showBrands = !showBrands}
            >
                <h2 class="text-lg text-[#CA9335] font-semibold">Brands ({selectedBrands.length})</h2>
                <span class="text-[#CA9335] text-xl">{showBrands ? '−' : '+'}</span>
            </button>
            
            {#if showBrands}
                <div class="flex flex-col gap-2 pl-4 pb-2" transition:fade>
                    {#each filterData.brands as brand}
                        <div class="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id={`brand-${brand}`}
                                checked={selectedBrands.includes(brand)}
                                on:change={() => toggleBrand(brand)}
                            >
                            <label class="text-sm text-gray-600 font-semibold" for={`brand-${brand}`}>{brand}</label>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Price Range Section -->
        <div class="filter-section mb-6">
            <h3 class="text-lg text-[#CA9335] font-semibold mb-4">Price Range</h3>
        
            <div class="price-range-content flex items-center mb-4 gap-10">
                <div class="flex-1 flex flex-row items-center gap-1">
                    <label for="minPrice" class="block text-sm text-gray-600 font-semibold mb-1">Min(₱):</label>
                    <input
                        id="minPrice"
                        type="number"
                        bind:value={minPrice}
                        min={filterData.priceRange.min}
                        max={filterData.priceRange.max}
                        class="w-21 border text-gray-600 font-semibold border-gray-600 bg-white rounded-md py-2 px-3"
                    >
                </div>
                
                <div class="flex-1 flex flex-row items-center gap-1">
                    <label for="maxPrice" class="block text-sm text-gray-600 font-semibold mb-1">Max(₱):</label>
                    <input
                        id="maxPrice"
                        type="number"
                        bind:value={maxPrice}
                        min={filterData.priceRange.min}
                        max={filterData.priceRange.max}
                        class="w-21 border text-gray-600 font-semibold border-gray-600 bg-white rounded-md py-2 px-2"
                    >
                </div>
            </div>

            <!-- Dual Range Slider -->
            <div class="relative h-2">
                <div class="absolute top-1/2 w-full h-1 bg-amber-300 rounded-full"></div>
                
                <label for="minRange" class="sr-only">Minimum price</label>
                <input
                    id="minRange"
                    type="range"
                    bind:value={minPrice}
                    min={filterData.priceRange.min}
                    max={filterData.priceRange.max}
                    step="1"
                    class="absolute top-1/2 w-full h-1 appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CA9335] [&::-webkit-slider-thumb]:pointer-events-auto"
                >
                
                <label for="maxRange" class="sr-only">Maximum price</label>
                <input
                    id="maxRange"
                    type="range"
                    bind:value={maxPrice}
                    min={filterData.priceRange.min}
                    max={filterData.priceRange.max}
                    step="1"
                    class="absolute top-1/2 w-full h-1 appearance-none pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#CA9335] [&::-webkit-slider-thumb]:pointer-events-auto"
                >
            </div>
        </div>
    {/if}
    
    <button class="filter-btn w-full bg-[#CA9335] text-white py-2 rounded hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors mt-4" on:click={applyFilters}>
        Apply Filters
    </button>
</div>

<style>
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    /* input[type="number"] {
        -moz-appearance: textfield;
    } */

    input[type="checkbox"] {
        accent-color: #CA9335;
        width: 16px;
        height: 16px;
        cursor: pointer;
    }
    
    label {
        cursor: pointer;
        user-select: none;
    }

    /* .filter-btn{
        background-color: #CA9335;
        color: white;
        border-radius: 5px;
        transition: all 0.3s;
    }

    .filter-btn:hover {
        border: 2px solid #CA9335;
        color: #CA9335;
        background-color: white;
    } */
    
    .filter-section {
        border-bottom: 1px solid #e5e7eb;
        transition: all 0.2s ease;
    }
    
    .filter-section button {
        transition: all 0.2s ease;
    }
    
    .filter-section button:hover {
        opacity: 0.8;
    }
</style>
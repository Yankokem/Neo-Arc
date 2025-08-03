<script>
    import ProductLayout from '../components/ProductLayout.svelte';
    import ProductFilter from '../components/AllFilter.svelte';
    import { onMount } from 'svelte';

    let products = [];
    let isLoading = true;
    let error = null;
    let sortOption = 'default';

    const sortOptions = [
        { value: 'default', label: 'Default' },
        { value: 'alpha-asc', label: 'Alphabetically A-Z' },
        { value: 'alpha-desc', label: 'Alphabetically Z-A' },
        { value: 'price-asc', label: 'Price, Low to High' },
        { value: 'price-desc', label: 'Price, High to Low' },
        { value: 'date-asc', label: 'Date, Old to New' },
        { value: 'date-desc', label: 'Date, New to Old' }
    ];

    async function fetchAllProducts() {
        try {
            const url = sortOption === 'default' 
                ? 'http://localhost:3001/api/all-products'
                : `http://localhost:3001/api/all-products?sort=${sortOption}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch products');
            products = await response.json();
        } catch (err) {
            error = err.message;
        } finally {
            isLoading = false;
        }
    }

    async function handleSortChange() {
        isLoading = true;
        error = null;
        await fetchAllProducts();
    }

    function handleFilterApplied(event) {
        products = event.detail.products;
        isLoading = false;
        error = null;
    }

    onMount(() => {
        fetchAllProducts();
        document.addEventListener('filterApplied', handleFilterApplied);
        return () => {
            document.removeEventListener('filterApplied', handleFilterApplied);
        };
    });
</script>

<ProductLayout title="">
    <svelte:fragment slot="filter">
        <ProductFilter />
    </svelte:fragment>

    <svelte:fragment slot="products">
        {#if isLoading}
            <div class="p-4 text-center">Loading products...</div>
        {:else if error}
            <div class="p-4 text-red-500">Error: {error}</div>
        {:else}
            <div class="product-counter flex flex-row justify-end items-center gap-4 mb-4">
                <div class="flex items-center gap-2">
                    <span class="text-base text-gray-500 font-semibold">Sort by:</span>
                    <select
                        bind:value={sortOption}
                        on:change={handleSortChange}
                        class="text-gray-500 font-semibold rounded-sm py-1 px-2 focus:outline-none focus:ring-2 focus:ring-[#000000]"
                    >
                        {#each sortOptions as option}
                            <option class="text-gray-500 font-semibold" value={option.value}>{option.label}</option>
                        {/each}
                    </select>
                </div>
                <h1 class="text-base text-gray-500 font-semibold">{products.length} Products</h1>
            </div>
            <div class="grid grid-cols-3 gap-2">
                {#each products as product}
                    <a href="#product/{product.id}" class="product-card flex flex-col" style="flex: 1 1 0%;">
                        <div class="relative aspect-square w-full bg-gray-100 mb-2 overflow-hidden rounded-2xl">
                            {#if product.image_url}
                                <img src={`http://localhost:3001${product.image_url}`} alt={product.name} class="absolute h-full w-full object-cover"/>
                            {:else}
                                <div class="absolute inset-0 flex items-center justify-center text-gray-400">
                                    Product Image
                                </div>
                            {/if}
                        </div>
                        <div class="text-center">
                            <h3 class="font-bold text-lg hover:underline">{product.name}</h3>
                            <p class="font-bold text-[#CA9335] text-mb">₱{product.price.toFixed(2)}</p>
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </svelte:fragment>
</ProductLayout>

<style>
    :global(.product-column) {
        padding: 0 !important;
        margin: 0 !important;
    }

    .product-card {
        transition: transform 0.2s;
    }
    
    .product-card:hover {
        transform: translateY(-5px);
    }

    @media (max-width: 1024px) {
        .grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (max-width: 640px) {
        .grid {
            grid-template-columns: 1fr;
        }
    }
</style>
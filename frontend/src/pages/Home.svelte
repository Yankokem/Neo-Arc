<script>
    import fLogo from '/src/assets/F-logo.png';
    import Logo from '/src/assets/logo1.png';
    import smartphone_category from '/src/assets/categories/smartphone_category.png';
    import computer_accessories_category from '/src/assets/categories/computer_accessories_category.png';
    import computer_components_category from '/src/assets/categories/computer_components_category.png';
    import laptopts_category from '/src/assets/categories/laptopts_category.png';
    import smartwatches_category from '/src/assets/categories/smartwatches_category.png';
    import tablets_category from '/src/assets/categories/tablets_category.png';
    import audio_category from '/src/assets/categories/audio_category.png';
    import home_greetings from  '/src/assets/home_greetings.png';

    function goToGadgets() {
        window.location.hash = 'gadgets';
    }

    let featuredProducts = [];
    let newArrivals = [];
    let isLoading = false;

    async function fetchFeaturedProducts() {
        try {
            const response = await fetch('http://localhost:3001/api/products/cheapest');
            featuredProducts = await response.json();
        } catch (error) {
            console.error('Error fetching featured products:', error);
        }
    }

    async function fetchNewArrivals() {
        isLoading = true;
        try {
            const response = await fetch('http://localhost:3001/api/products/newest');
            newArrivals = await response.json();
        } catch (error) {
            console.error('Error fetching new arrivals:', error);
        } finally {
            isLoading = false;
        }
    }

    fetchFeaturedProducts();
    fetchNewArrivals();
</script>

<div class="page flex flex-col flex-grow gap-12">
    <section class="display-container1 flex flex-col gap-2 w-full rounded-xl">
        <div class="display1 flex-1 rounded-xl">
            <img src="{home_greetings}" alt="" class="rounded-xl">
        </div>
    </section>

    <section class="display-container2 flex flex-col items-center gap-6">
        <div class="display2">
            <img src={fLogo} alt="full logo" class="h-auto max-w-90">
        </div>
        <div class="bottom2 flex flex-col items-center gap-4 text-center">
            <p class="text-lg">Discover the tech that empowers your greatness.</p>
            <button type="button" on:click={goToGadgets} class="gadgets-button px-6 py-2 text-lg">
                Browse Items
            </button>
        </div>
    </section>

    <section class="featured-products">
        <div class="flex gap-6 w-full">
            <div class="sidebar flex-shrink-0 text-[#CA9335] p-6 rounded-lg flex flex-col justify-center items-center" style="flex: 1 1 0%;">
                <h2 class="text-2xl font-bold mb-4 text-center">Products<br>You May<br>Like</h2>
                <button type="button" on:click={goToGadgets} class="gadgets-button px-6 py-2 text-lg">
                    Browse Items
                </button>
            </div>

            {#each featuredProducts as product}
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
    </section>

    <section class="new-arrivals">
        <div class="flex gap-6 w-full">
            {#each newArrivals as product}
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

            <div class="sidebar flex-shrink-0 text-[#CA9335] p-6 rounded-lg flex flex-col justify-center items-center" style="flex: 1 1 0%;">
                <h2 class="text-2xl font-bold mb-4 text-center">Latest<br>Tech<br>Drops</h2>
                <button type="button" on:click={goToGadgets} class="gadgets-button px-6 py-2 text-lg">
                    Browse Items
                </button>
            </div>
        </div>
    </section>

    <section class="featured-categories">
        <h2 class="text-2xl font-bold mb-6 text-center text-[#CA9335]">Shop by Category</h2>
        <div class="grid grid-cols-2 gap-6">
            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{smartphone_category}" alt="Smartphones" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Smartphones
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{tablets_category}" alt="Tablets" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Tablets
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{smartwatches_category}" alt="Smartwatches" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Smartwatches
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{audio_category}" alt="Audio" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Audio
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{laptopts_category}" alt="Laptops" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Laptops
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{computer_accessories_category}" alt="Peripherals" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Peripherals
                </button>
            </div>

            <div class="category-card h-[300px] bg-gray-100 rounded-xl overflow-hidden relative">
                <img src="{computer_components_category}" alt="Components" class="w-full h-full object-cover"/>
                <button class="category-btn absolute bottom-3 left-3 bg-[#CA9335] text-white px-6 py-2 rounded-4xl">
                    Components
                </button>
            </div>
        </div>
    </section>
</div>

<style>
    .category-card {
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
    }

    .category-card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    .category-card img {
        transition: transform 0.5s ease;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .category-card:hover img {
        transform: scale(1.1);
    }

    .category-card button {
        z-index: 10;
        transition: all 0.3s ease;
    }

    .category-btn:hover {
        color: #CA9335;
        background-color: white;
    }

    .sidebar {
        color: #CA9335;
    }

    .gadgets-button {
        border: 2px solid #CA9335;
        background-color: #CA9335;
        color: white;
        border-radius: 5px;
        transition: all 0.3s;
    }

    .gadgets-button:hover {
        border: 2px solid #CA9335;
        color: #CA9335;
        background-color: white;
    }

    .display1 {
        background-color: #CA9335;
    }

    .product-card {
        transition: transform 0.2s;
    }

    .product-card:hover {
        transform: translateY(-5px);
    }
</style>
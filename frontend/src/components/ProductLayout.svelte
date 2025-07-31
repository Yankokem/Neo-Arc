<script>
    export let title = "Products"; // Default title
</script>

<div class="product-layout">
    <!-- Left Column - Filter -->
    <div class="filter-column ">
        <slot name="filter">
            <!-- Default content if no filter slot provided -->
            <div class="p-4 text-gray-500">Filter area</div>
        </slot>
    </div>

    <!-- Right Column - Products -->
    <div class="product-column">
        {#if title}
            <h1 class="text-2xl font-bold mb-6">{title}</h1>
        {/if}
        <slot name="products">
            <!-- Default content if no products slot provided -->
            <div class="p-4 text-gray-500">Product area</div>
        </slot>
    </div>
</div>

<style>
    .product-layout {
        /* border: 2px solid blue; */
        display: grid;
        grid-template-columns: 350px 1fr;
        gap: 2rem;
        min-height: 80vh;
    }

    .filter-column {
        /* border: 2px solid blue; */
        position: sticky;
        top: 20px;
        height: fit-content;
    }

    .product-column {
        /* border: 2px solid blue; */
        padding: 1rem;
    }

    @media (max-width: 768px) {
        .product-layout {
            grid-template-columns: 1fr;
        }

        .filter-column {
            position: static;
            margin-bottom: 2rem;
        }
    }
</style>
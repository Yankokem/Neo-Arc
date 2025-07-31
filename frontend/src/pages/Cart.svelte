<div class="page flex flex-col p-4 flex-grow">
    <div class="top flex flex-row justify-between items-center p-4 mb-6">
        <a href="#products" class="text-[#CA9335] font-semibold text-lg hover:text-amber-600 transition-colors">
            <span class="material-icons-outlined">keyboard_backspace</span> Back to Shop
        </a>
        <h1 class="text-4xl text-[#CA9335] font-bold">SHOPPING CART</h1>
    </div>

    <div class="cart-table w-full">
        <div class="table-header grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 pb-2 mb-4">
            <div class="text-lg text-[#CA9335] font-semibold">Product</div>
            <div class="text-lg text-[#CA9335] font-semibold text-center">Quantity</div>
            <div class="text-lg text-[#CA9335] font-semibold text-right">Total</div>
            <div class="text-lg text-[#CA9335] font-semibold text-center"></div>
        </div>

        <hr class="text-[#CA9335] border-1">

        <div class="table-body flex flex-col gap-6">
            <!-- Sample Row 1 -->
            <div class="table-row grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 items-center">
                <div class="product flex flex-row gap-4">
                    <div class="image-container w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <span class="text-gray-400 text-sm">Product Image</span>
                    </div>
                    <div class="product-details flex flex-col gap-1">
                        <h3 class="text-lg text-gray-600 font-semibold">Sample Product Name</h3>
                        <p class="text-[#CA9335] font-semibold">₱10,000.00</p>
                        <p class="text-sm text-gray-600">Sample product description with key features.</p>
                    </div>
                </div>
                <div class="quantity flex flex-row items-center justify-center gap-2">
                    <button class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors">-</button>
                    <input
                        type="number"
                        value="1"
                        min="1"
                        class="w-12 text-center border border-gray-600 text-gray-600 font-semibold rounded-md py-1 px-2"
                    >
                    <button class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors">+</button>
                </div>
                <div class="total text-right text-[#CA9335] font-semibold">₱10,000.00</div>
                <div class="delete text-center">
                    <button class="text-[#CA9335] hover:text-red-500 transition-colors">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </div>
            </div>

            <!-- Sample Row 2 -->
            <div class="table-row grid grid-cols-[2fr_1fr_1fr_0.5fr] gap-4 items-center">
                <div class="product flex flex-row gap-4">
                    <div class="image-container w-24 h-24 bg-gray-100 rounded-md flex items-center justify-center">
                        <span class="text-gray-400 text-sm">Product Image</span>
                    </div>
                    <div class="product-details flex flex-col gap-1">
                        <h3 class="text-lg text-gray-600 font-semibold">Another Product</h3>
                        <p class="text-[#CA9335] font-semibold">₱5,000.00</p>
                        <p class="text-sm text-gray-600">Another description for a hardware product.</p>
                    </div>
                </div>
                <div class="quantity flex flex-row items-center justify-center gap-2">
                    <button class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors">-</button>
                    <input
                        type="number"
                        value="2"
                        min="1"
                        class="w-12 text-center border border-gray-600 text-gray-600 font-semibold rounded-md py-1 px-2"
                    >
                    <button class="w-8 h-8 bg-[#CA9335] text-white rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors">+</button>
                </div>
                <div class="total text-right text-[#CA9335] font-semibold">₱10,000.00</div>
                <div class="delete text-center">
                    <button class="text-[#CA9335] hover:text-red-500 transition-colors">
                        <span class="material-icons-outlined">delete</span>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div class="checkout-container ml-auto w-80 p-4 mt-6">
        <div class="subtotal flex justify-between items-center mb-4">
            <span class="text-lg text-[#CA9335] font-semibold">Subtotal</span>
            <span class="text-lg text-[#CA9335] font-semibold">₱20,000.00</span>
        </div>
        <p class="text-sm text-gray-600 mb-4 text-center">Taxes and shipping calculated at checkout</p>
        <button class="w-full bg-[#CA9335] text-white py-2 rounded-md hover:bg-white hover:text-[#CA9335] hover:border-2 hover:border-[#CA9335] transition-colors">
            Checkout
        </button>
    </div>
</div>

<style>
    input[type="number"]::-webkit-outer-spin-button,
    input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    input[type="number"] {
        -moz-appearance: textfield;
    }

    .cart-table {
        max-width: 100%;
    }

    .table-header {
        display: grid;
        align-items: center;
    }

    .table-row {
        display: grid;
        align-items: center;
        padding: 1rem 0;
        border-bottom: 1px solid #e5e7eb;
    }

    .product-details {
        max-width: 300px;
    }

    .quantity button {
        transition: all 0.3s ease;
    }

    .quantity input {
        appearance: textfield;
    }

    .delete button {
        transition: all 0.3s ease;
    }

    .material-icons-outlined {
        font-size: 24px;
        vertical-align: middle;
    }

    .checkout-container {
        max-width: 20rem;
    }
</style>
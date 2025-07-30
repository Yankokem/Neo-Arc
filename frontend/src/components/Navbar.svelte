<script>
    import logo from '/src/assets/logo1.png';
</script>

<nav>
    <div class="navbar flex items-center justify-between px-[30px] py-[5px] relative">
        <div class="logo-container flex items-center">
        <img src="{logo}" alt="logo" class="w-25">
        </div>
        
        <div class="middle flex items-center gap-10 text-lg">
            <a href="#home" class=" text-[#CA9335] font-semibold">Home</a>
            
            <!-- Gadgets Dropdown -->
            <div class="dropdown-container relative">
                <a href="#gadgets" class="text-[#CA9335] font-semibold hover:dropdown-trigger">Gadgets</a>
                <div class="dropdown-menu absolute hidden bg-white shadow-lg w-[200px] left-0 top-full mt-0 z-50">
                <a href="#smartphones" class="block px-4 py-2 hover:bg-[#eeeeee]">Smartphones</a>
                <a href="#tablets" class="block px-4 py-2 hover:bg-[#eeeeee]">Tablets</a>
                <a href="#laptops" class="block px-4 py-2 hover:bg-[#eeeeee]">Laptops</a>
                <a href="#wearables" class="block px-4 py-2 hover:bg-[#eeeeee]">Wearables</a>
                <a href="#audio" class="block px-4 py-2 hover:bg-[#eeeeee]">Audio Devices</a>
                </div>
            </div>
            
            <!-- Computer Hardware Dropdown -->
            <div class="dropdown-container relative">
                <a href="#computer-hardware" class="text-[#CA9335] font-semibold hover:dropdown-trigger">Computer Hardware</a>
                <div class="dropdown-menu absolute hidden bg-white shadow-lg w-[200px] left-0 top-full mt-0 z-50">
                <!-- Components (Hover to show submenu) -->
                <div class="sub-dropdown-container relative group">
                    <a href="#components" class="block px-4 py-2 hover:bg-[#eeeeee]">Components</a>
                    <div class="sub-dropdown-menu absolute hidden left-full top-0 ml-0 bg-white shadow-lg w-[200px] z-50">
                    <a href="#cpu" class="block px-4 py-2 hover:bg-[#eeeeee]">CPU</a>
                    <a href="#motherboard" class="block px-4 py-2 hover:bg-[#eeeeee]">Motherboard</a>
                    <a href="#gpu" class="block px-4 py-2 hover:bg-[#eeeeee]">GPU</a>
                    <a href="#cooling" class="block px-4 py-2 hover:bg-[#eeeeee]">Cooling</a>
                    <a href="#storage" class="block px-4 py-2 hover:bg-[#eeeeee]">Storage</a>
                    <a href="#psu" class="block px-4 py-2 hover:bg-[#eeeeee]">PSU</a>
                    <a href="#chasis" class="block px-4 py-2 hover:bg-[#eeeeee]">Chassis</a>
                    </div>
                </div>
                
                <!-- Peripherals (Hover to show submenu) -->
                <div class="sub-dropdown-container relative group">
                    <a href="#peripherals" class="block px-4 py-2 hover:bg-[#eeeeee]">Peripherals</a>
                    <div class="sub-dropdown-menu absolute hidden left-full top-0 ml-0 bg-white shadow-lg w-[200px] z-50">
                    <a href="#keyboards" class="block px-4 py-2 hover:bg-[#eeeeee]">Keyboards</a>
                    <a href="#mice" class="block px-4 py-2 hover:bg-[#eeeeee]">Mice</a>
                    <a href="#monitors" class="block px-4 py-2 hover:bg-[#eeeeee]">Monitors</a>
                    <a href="#networking" class="block px-4 py-2 hover:bg-[#eeeeee]">Networking</a>
                    <a href="#headphones" class="block px-4 py-2 hover:bg-[#eeeeee]">Headphones</a>
                    <a href="#microphones" class="block px-4 py-2 hover:bg-[#eeeeee]">Microphones</a>
                    <a href="#others" class="block px-4 py-2 hover:bg-[#eeeeee]">Others</a>
                    </div>
                </div>
                </div>
            </div>

            <div class="dropdown-container relative">
                <a href="#all-products" class="text-[#CA9335] font-semibold hover:dropdown-trigger">All Products</a>
            </div>
        </div>

        <div class="right flex items-center gap-1">
        <a href="#cart" class="flex items-center gap-2 text-[#CA9335] text-lg font-semibold">
            <span class="material-icons-outlined text-[24px] leading-none">local_mall</span>
            <span>Cart</span>
        </a>
        </div>
    </div>

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
        
        /* Remove underline for dropdown items */
        .dropdown-menu a::after,
        .sub-dropdown-menu a::after {
        display: none;
        }
        
        /* Hover effects */
        .dropdown-menu a:hover,
        .sub-dropdown-menu a:hover {
        background-color: #eeeeee;
        }
    </style>
</nav>
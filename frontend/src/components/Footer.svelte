<script>
    import Logo from '../assets/logo1.png'; // Adjust the path to your actual logo file
</script>

<footer>
    <hr class="text-[#CA9335]">
    <div class="content flex justify-between p-10">
        <div class="flex flex-col gap-3">
            <h1 class="mb-7">Resources</h1>
            <p>Become a Member</p>
            <p>Product Advice</p>
            <p>Discounts</p>
            <p>Send us a feedback</p>
        </div>
        <div class="flex flex-col gap-3">
            <h1 class="mb-7">Help</h1>
            <p>Get Help</p>
            <p>Returns</p>
            <p>Payment Options</p>
            <p>Contact Us</p>
        </div>
        <div class="flex flex-col gap-3">
            <div>
                <h1 class="mb-7">Company</h1>
                <p>About Us</p>
                <p>News</p>
                <p>Careers</p>
                <p>FAQ</p>
            </div>
        </div>
        <div>
            <h1>© 2025 NeoArc, Inc. All rights reserved</h1>
            <h1>Philippines</h1>
            <img src={Logo} alt="flogo" class="w-25">
        </div>
    </div>
</footer>

<style>
    footer{
        margin-top: 80px;
        h1{
            color: #CA9335;
            font-weight: bold;
        }
        p{
            color: #4B5563;
        }
    }
</style>
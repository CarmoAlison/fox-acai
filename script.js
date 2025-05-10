document.addEventListener('DOMContentLoaded', function() {
    // Cart functionality
    const cartIcon = document.querySelector('.cart-icon');
    const cartModal = document.querySelector('.cart-modal');
    const closeCart = document.querySelector('.close-cart');
    const cartItemsContainer = document.querySelector('.cart-items');
    const cartTotal = document.querySelector('.total-price');
    const clearCartBtn = document.querySelector('.clear-cart');
    const checkoutBtn = document.querySelector('.checkout');
    const overlay = document.createElement('div');
    overlay.classList.add('overlay');
    document.body.appendChild(overlay);
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let deliveryFee = 0; // Variável para armazenar a taxa de entrega
    
    // Toggle cart modal
    cartIcon.addEventListener('click', function() {
        cartModal.classList.add('active');
        overlay.classList.add('active');
        renderCartItems();
    });
    
    closeCart.addEventListener('click', function() {
        cartModal.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    overlay.addEventListener('click', function() {
        cartModal.classList.remove('active');
        overlay.classList.remove('active');
    });
    
    // Add to cart for regular products
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productCard = this.closest('.product-card');
            const productName = this.getAttribute('data-product');
            const productSize = productCard.querySelector('input[name*="size"]:checked').value;
            const productPrice = getProductPrice(productName, productSize);
            
            addToCart({
                name: productName,
                size: productSize + 'ml',
                price: productPrice,
                custom: false
            });
            
            updateCartCount();
            showAddedToCartMessage(productName);
        });
    });
    
    // Add custom açaí to cart
    const addCustomToCartBtn = document.getElementById('add-custom-to-cart');
    addCustomToCartBtn.addEventListener('click', function() {
        const size = document.getElementById('size').value;
        const sizeText = document.getElementById('size').options[document.getElementById('size').selectedIndex].text;
        const basePrice = getCustomBasePrice(size);
        
        // Get selected options
        const cremes = Array.from(document.querySelectorAll('input[name="Creme"]:checked')).map(el => el.value);
        const acompanhamentos = Array.from(document.querySelectorAll('input[name="AcompanhamentoGratis"]:checked')).map(el => el.value);
        const frutas = Array.from(document.querySelectorAll('input[name="fruta"]:checked')).map(el => el.value);
        const extras = Array.from(document.querySelectorAll('input[name="extra"]:checked')).map(el => el.value);
        const observations = document.getElementById('observations').value;
        
        // Calculate total price (sem taxa de entrega aqui)
        let totalPrice = basePrice;
        let description = `*_Açaí Personalizado_* (${sizeText})\n`;
        
        // Add creams
        if (cremes.length > 0) {
            description += `*_Cremes:_* \n${cremes.join('; ')}`;
        }
        
        // Add free accompaniments
        if (acompanhamentos.length > 0) {
            description += `\n *_Acompanhamentos:_* \n${acompanhamentos.join('; ')}`;
        }
        
        // Add fruits
        if (frutas.length > 0) {
            description += `\n*_Frutas:_* \n${frutas.join('; ')}`;
        }
        
        // Add extras
        if (extras.length > 0) {
            extras.forEach(extra => {
                if (extra === "Nutella") totalPrice += 3.5;
                if (extra === "Oreo") totalPrice += 2;
                if (extra === "Batom") totalPrice += 2;
                if (extra === "Kit Kat") totalPrice += 3;
            });
            description += `\n*_Extras:_*\n ${extras.join('; ')}`;
        }
        
        // Add observations if any
        if (observations.trim() !== '') {
            description += `, Obs: ${observations}`;
        }
        
        addToCart({
            name: "Açaí Personalizado",
            size: size + 'ml',
            price: totalPrice,
            description: description,
            custom: true
        });
        
        updateCartCount();
        showAddedToCartMessage("Açaí Personalizado");
    });
    
    // Clear cart
    clearCartBtn.addEventListener('click', function() {
        cart = [];
        deliveryFee = 0;
        saveCart();
        renderCartItems();
        updateCartCount();
    });
    
    // Checkout - Show customer info modal
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        // Show customer info modal
        const customerInfoModal = document.querySelector('.customer-info-modal');
        customerInfoModal.classList.add('active');
        overlay.classList.add('active');
        
        // Close modal
        document.querySelector('.close-customer-info').addEventListener('click', function() {
            customerInfoModal.classList.remove('active');
            overlay.classList.remove('active');
        });
    });
    
    // Form submission for customer info
    document.getElementById('customer-info-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get customer info
        const name = document.getElementById('customer-name').value;
        const address = document.getElementById('customer-address').value;
        const neighborhood = document.getElementById('customer-neighborhood').value;
        const payment = document.querySelector('input[name="payment"]:checked').value;
        const deliveryOption = document.querySelector('input[name="entrega"]:checked').value;
        const notes = document.getElementById('customer-notes').value;
        
        // Calculate delivery fee based on selected option
        deliveryFee = 0;
        if (deliveryOption === "Macau") deliveryFee = 2;
        if (deliveryOption === "I ilha") deliveryFee = 7;
        if (deliveryOption === "II ilha") deliveryFee = 10;
        
        // Prepare WhatsApp message
        const phoneNumber = "5584996720476";
        let message = `*NOVO PEDIDO - FOX AÇAÍ*\n`;
        message += `Quero meu açaí! Faço meu pedido pelo site foxacai.com.br e conto com seu atendimento especial!\n\n`;
        message += `*Cliente:* ${name}\n`;
        message += `*Endereço:* ${address}\n`;
        message += `*Bairro:* ${neighborhood}\n`;
        message += `*Pagamento:* ${payment}\n\n`;
        message += `*Local da entrega:* ${deliveryOption}\n\n`;
        message += `*ITENS DO PEDIDO:*\n\n`;
        
        cart.forEach((item, index) => {
            message += `*${index + 1}. ${item.name} (${item.size})* - R$${item.price.toFixed(2)}\n`;
            if (item.description) {
                message += `${item.description}\n`;
            }
            message += "\n";
        });
        
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const total = subtotal + deliveryFee;
        
        // Add delivery fee to message if applicable
        if (deliveryFee > 0) {
            message += `*Taxa de entrega: R$${deliveryFee.toFixed(2)}*\n`;
        }
        
        message += `*TOTAL: R$${total.toFixed(2)}*\n\n`;
        
        if (notes.trim() !== '') {
            message += `*Observações:* ${notes}\n\n`;
        }
        
        message += `*Obrigado pelo pedido!*`;
        
        // Close modals
        document.querySelector('.customer-info-modal').classList.remove('active');
        cartModal.classList.remove('active');
        overlay.classList.remove('active');
        
        // Clear form
        document.getElementById('customer-info-form').reset();
        
        // Clear cart
        cart = [];
        deliveryFee = 0;
        saveCart();
        renderCartItems();
        updateCartCount();
        
        // Open WhatsApp
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    });
    
    // Helper functions
    function addToCart(item) {
        cart.push(item);
        saveCart();
    }
    
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            cartTotal.textContent = 'R$0,00';
            return;
        }
        
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.classList.add('cart-item');
            
            cartItem.innerHTML = `
                <div class="item-info">
                    <h4>${item.name} (${item.size})</h4>
                    ${item.description ? `<p>${item.description}</p>` : ''}
                </div>
                <div class="item-right">
                    <span class="item-price">R$${item.price.toFixed(2)}</span>
                    <span class="item-remove" data-index="${index}">&times;</span>
                </div>
            `;
            
            cartItemsContainer.appendChild(cartItem);
        });
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.item-remove').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                cart.splice(index, 1);
                saveCart();
                renderCartItems();
                updateCartCount();
            });
        });
        
        // Update total (sem taxa de entrega aqui - será mostrada apenas no checkout)
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `R$${subtotal.toFixed(2)}`;
    }
    
    function updateCartCount() {
        document.querySelector('.cart-count').textContent = cart.length;
    }
    
    function showAddedToCartMessage(productName) {
        const message = document.createElement('div');
        message.classList.add('cart-message');
        message.innerHTML = `
            <span>${productName} foi adicionado ao carrinho!</span>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 3000);
    }
    
    function getProductPrice(productName, size) {
        const sizeInt = parseInt(size);
        
        switch(productName) {
            case 'ESPECIAL NIX':
            case 'ESPECIAL FOX':
            case 'ESPECIAL BOMBOM':
            case 'ESPECIAL TRUFADO':
                return sizeInt === 400 ? 24.00 : 32.00;
            default:
                return 25.00;
        }
    }
    
    function getCustomBasePrice(size) {
        switch(size) {
            case '300':
                return 10.00;
            case '400':
                return 14.00;
            case '500':
                return 17.00;
            case '700':
                return 22.00;
            default:
                return 14.00;
        }
    }
    
    // Initialize cart count
    updateCartCount();
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add cart message style
    const style = document.createElement('style');
    style.textContent = `
        .cart-message {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--primary-color);
            color: white;
            padding: 15px 25px;
            border-radius: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 3000;
        }
        
        .cart-message.show {
            opacity: 1;
        }
        
        .empty-cart {
            text-align: center;
            color: var(--gray-color);
            padding: 20px 0;
        }
        
        /* Estilos para o modal de informações do cliente */
        .customer-info-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 4000;
        }
        
        .customer-info-modal.active {
            display: flex;
        }
        
        .customer-info-content {
            background-color: white;
            padding: 20px;
            border-radius: 10px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .customer-info-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .customer-info-header h3 {
            color: var(--primary-color);
            margin: 0;
        }
        
        .close-customer-info {
            font-size: 24px;
            cursor: pointer;
        }
        
        .payment-options {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 10px;
        }
        
        .payment-options label {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .payment-entrega {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 10px;
        }
        
        .payment-entrega label {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: none;
            z-index: 2000;
        }
        
        .overlay.active {
            display: block;
        }
    `;
    document.head.appendChild(style);
});
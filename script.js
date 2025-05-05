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
        const borda = document.querySelector('input[name="borda"]:checked').value;
        const cremes = Array.from(document.querySelectorAll('input[name="creme"]:checked')).map(el => el.value);
        const frutas = Array.from(document.querySelectorAll('input[name="fruta"]:checked')).map(el => el.value);
        const extras = Array.from(document.querySelectorAll('input[name="extra"]:checked')).map(el => el.value);
        const observations = document.getElementById('observations').value;
        
        // Calculate total price
        let totalPrice = basePrice;
        let description = `Açaí Personalizado (${sizeText})`;
        
        // Add border price if selected
        if (borda !== "Sem borda") {
            const borderPrice = getBorderPrice(borda);
            totalPrice += borderPrice;
            description += `, Borda: ${borda}`;
        }
        
        // Add creams
        if (cremes.length > 0) {
            const creamPrice = cremes.length * 3; // Assuming each cream adds R$3
            totalPrice += creamPrice;
            description += `, Cremes: ${cremes.join(';')}`;
        }
        
        // Add fruits
        if (frutas.length > 0) {
            const fruitPrice = frutas.reduce((acc, fruit) => {
                return acc + (fruit === "Banana" ? 2 : 3); // Banana is R$2, others R$3
            }, 0);
            totalPrice += fruitPrice;
            description += `, Frutas: ${frutas.join('; ')}`;
        }
        
        // Add extras
        if (extras.length > 0) {
            const extraPrice = extras.reduce((acc, extra) => {
                return acc + (extra === "Granola" || extra === "Leite Condensado" ? 2 : 
                            extra === "Paçoca" ? 3 : 4); // Different prices for extras
            }, 0);
            totalPrice += extraPrice;
            description += `, Extras: ${extras.join('; ')}`;
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
        saveCart();
        renderCartItems();
        updateCartCount();
    });
    
    // Checkout - Send to WhatsApp
    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            alert('Seu carrinho está vazio!');
            return;
        }
        
        const phoneNumber = "5584996002433"; // Replace with your WhatsApp number
        let message = "Olá, gostaria de fazer um pedido:\n\n";
        
        cart.forEach((item, index) => {
            message += `*${index + 1}. ${item.name} (${item.size})* - R$${item.price.toFixed(2)}\n`;
            if (item.description) {
                message += `${item.description}\n`;
            }
            message += "\n";
        });
        
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        message += `*TOTAL: R$${total.toFixed(2)}*`;
        message += "\n\n*Informações de entrega:*\nNome:\nEndereço:\nComplemento:\nForma de pagamento:";
        
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
        
        // Update total
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        cartTotal.textContent = `R$${total.toFixed(2)}`;
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
            case 'COPO NIX':
            case 'COPO FOX':
            case 'BOMBOM':
            case 'TRUFADO':
                return sizeInt === 400 ? 24.00 : 32.00;
            case 'COPO RAPOSA':
                return 28.00;
            case 'COPO ZERO':
                return 20.00;
            default:
                return 25.00;
        }
    }
    
    function getCustomBasePrice(size) {
        switch(size) {
            case '300':
                return 18.00;
            case '400':
                return 22.00;
            case '500':
                return 28.00;
            default:
                return 22.00;
        }
    }
    
    function getBorderPrice(borda) {
        switch(borda) {
            case 'Nutella':
                return 4.00;
            case 'Doce de Leite':
                return 3.50;
            case 'Leite em Pó':
                return 2.50;
            default:
                return 0;
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
    `;
    document.head.appendChild(style);
});
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
    let deliveryFee = 0;
    let orderType = 'delivery'; // Padrão: entrega
    
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
    
    // Add to cart for all products
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productName = this.getAttribute('data-product');
            const productPrice = parseFloat(this.getAttribute('data-price'));
            
            // Verifica se é um combo
            if(productName.includes("Combo")) {
                addToCart({
                    name: productName,
                    size: "",
                    price: productPrice,
                    custom: false
                });
            } 
            // Verifica se é um salgado
            else if(productName === "Coxinha" || productName === "Pastel de forno" || productName === "Empada") {
                addToCart({
                    name: productName,
                    size: "Unidade",
                    price: productPrice,
                    custom: false,
                    description: this.closest('.product-card').querySelector('.product-description').textContent
                });
            }
            else {
                // Produtos normais (com tamanho)
                const productCard = this.closest('.product-card');
                const productSize = productCard.querySelector('input[name*="size"]:checked').value;
                const productPrice = getProductPrice(productName, productSize);
                
                addToCart({
                    name: productName,
                    size: productSize + 'ml',
                    price: productPrice,
                    custom: false
                });
            }
            
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
        
        // Calculate total price
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
        
        // Add observations
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
        
        // Reset order type to delivery when modal opens
        setOrderType('delivery');
    });
    
    // Order type buttons functionality
    const orderTypeButtons = document.querySelectorAll('.order-type-btn');
    orderTypeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            setOrderType(type);
        });
    });
    
    // Set order type (delivery or pickup)
    function setOrderType(type) {
        orderType = type;
        
        // Remove active class from all buttons
        orderTypeButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('delivery-active', 'pickup-active');
        });
        
        // Add active class to clicked button
        const activeButton = document.querySelector(`.order-type-btn[data-type="${type}"]`);
        activeButton.classList.add('active');
        
        // Add specific class based on type
        if (type === 'delivery') {
            activeButton.classList.add('delivery-active');
        } else {
            activeButton.classList.add('pickup-active');
        }
        
        // Show/hide delivery fields
        const deliveryFields = document.getElementById('delivery-fields');
        if (type === 'delivery') {
            deliveryFields.style.display = 'block';
            document.getElementById('customer-address').required = true;
            document.getElementById('customer-neighborhood').required = true;
            document.querySelector('input[name="entrega"]').required = true;
        } else {
            deliveryFields.style.display = 'none';
            document.getElementById('customer-address').required = false;
            document.getElementById('customer-neighborhood').required = false;
            document.querySelector('input[name="entrega"]').required = false;
        }
        
        // Update title
        const title = document.querySelector('.customer-info-header h3');
        title.textContent = type === 'delivery' 
            ? 'INFORMAÇÕES PARA ENTREGA' 
            : 'INFORMAÇÕES PARA RETIRADA';
    }
    
    // Form submission for customer info
    document.getElementById('customer-info-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get customer info
        const name = document.getElementById('customer-name').value;
        let address = "";
        let neighborhood = "";
        let deliveryOption = "";
        const payment = document.querySelector('input[name="payment"]:checked').value;
        const notes = document.getElementById('customer-notes').value;
        
        if (orderType === 'delivery') {
            address = document.getElementById('customer-address').value;
            neighborhood = document.getElementById('customer-neighborhood').value;
            deliveryOption = document.querySelector('input[name="entrega"]:checked').value;
        } else {
            address = "Retirada";
            neighborhood = "Retirada";
            deliveryOption = "Retirada";
        }
        
        // Verifica se há combo da madrugada no carrinho
        const hasMadrugadaCombo = cart.some(item => 
            item.name.includes("Combo Madrugadão") || 
            item.name.includes("Combo Casal") || 
            item.name.includes("Combo Família")
        );
        
        // Calculate delivery fee
        deliveryFee = 0;
        if (orderType === 'delivery' && !hasMadrugadaCombo) {
            if (deliveryOption === "Macau") deliveryFee = 2;
            if (deliveryOption === "I ilha") deliveryFee = 7;
            if (deliveryOption === "II ilha") deliveryFee = 10;
        }
        
        // Prepare WhatsApp message
        const phoneNumber = "5584996720476";
        let message = `*NOVO PEDIDO - FOX AÇAÍ*\n`;
        message += `Quero meu açaí! Faço meu pedido pelo site foxacai.com.br e conto com seu atendimento especial!\n\n`;
        message += `*Cliente:* ${name}\n`;
        
        if (orderType === 'delivery') {
            message += `*Endereço:* ${address}\n`;
            message += `*Bairro:* ${neighborhood}\n`;
        } else {
            message += `*Tipo de pedido:* Retirada\n`;
        }
        
        message += `*Pagamento:* ${payment}\n`;
        message += `*Tipo de entrega:* ${deliveryOption}\n\n`;
        message += `*ITENS DO PEDIDO:*\n\n`;
        
        cart.forEach((item, index) => {
            message += `*${index + 1}. ${item.name} ${item.size ? `(${item.size})` : ''}* - R$${item.price.toFixed(2)}\n`;
            if (item.description) {
                message += `${item.description}\n`;
            }
            message += "\n";
        });
        
        const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
        const total = subtotal + deliveryFee;
        
        // Add delivery fee to message
        if (deliveryFee > 0) {
            message += `*Taxa de entrega: R$${deliveryFee.toFixed(2)}*\n`;
        } else if (hasMadrugadaCombo && orderType === 'delivery') {
            message += `*Taxa de entrega: GRÁTIS (Combo Madrugada)*\n`;
        } else if (orderType === 'delivery') {
            message += `*Taxa de entrega: GRÁTIS*\n`;
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
        
        // Reset order type to delivery
        setOrderType('delivery');
        
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
                    <h4>${item.name} ${item.size ? `(${item.size})` : ''}</h4>
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
        
        // Preços para combos
        if(productName.includes("Combo Madrugadão")) return 30.00;
        if(productName.includes("Combo Casal")) return 99.00;
        if(productName.includes("Combo Família")) return 65.00;
        
        // Preços para produtos normais
        switch(productName) {
            case 'ESPECIAL MIX':
            case 'ESPECIAL FOX':
            case 'ESPECIAL BOMBOM':
            case 'ESPECIAL TRUFADO':
                return sizeInt === 400 ? 26.00 : 34.00;
            default:
                return 26.00;
        }
    }
    
    function getCustomBasePrice(size) {
        switch(size) {
            case '300':
                return 12.00;
            case '400':
                return 15.00;
            case '500':
                return 17.00;
            case '700':
                return 24.00;
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
    
    // Add styles
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
        
        /* Estilos para os botões de tipo de pedido */
        .order-type-options {
            display: flex;
            gap: 10px;
            margin-top: 5px;
        }
        
        .order-type-btn {
            flex: 1;
            padding: 10px;
            border: 2px solid #ddd;
            background-color: #f9f9f9;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .order-type-btn.active {
            background-color: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
        
        .order-type-btn.delivery-active {
            background-color: #4CAF50;
            color: white;
            border-color: #4CAF50;
        }
        
        .order-type-btn.pickup-active {
            background-color: #2196F3;
            color: white;
            border-color: #2196F3;
        }
        
        .order-type-btn:hover {
            background-color: #e9e9e9;
        }
        
        .order-type-btn.active:hover {
            background-color: var(--primary-color);
        }
    `;
    document.head.appendChild(style);
    
   
    // Insert the order type buttons at the top of the form
    const form = document.getElementById('customer-info-form');
    const firstFormGroup = form.querySelector('.form-group');
    form.insertBefore(orderTypeOptions, firstFormGroup);
    
    // Set initial state
    setOrderType('delivery');
});
// State
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let filteredProducts = [];

// DOM Elements
const productList = document.getElementById('productList');
const searchBar = document.getElementById('searchBar');
const categories = document.querySelectorAll('#categories button');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cart');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const cartCount = document.getElementById('cartCount');
const closeCart = document.getElementById('closeCart');
const overlay = document.querySelector('.overlay');
const loadingOverlay = document.getElementById('loading');
const toast = document.getElementById('toast');
const sortSelect = document.getElementById('sort');
const checkoutBtn = document.getElementById('checkoutBtn');

// Checkout Modal Elements
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckout = document.querySelector('.close-checkout');
const checkoutOptions = document.querySelector('.checkout-options');
const customerInfoForm = document.getElementById('customerInfoForm');
const paymentOptions = document.getElementById('paymentOptions');
const orderConfirmation = document.getElementById('orderConfirmation');
const backToOptions = document.getElementById('backToOptions');
const backToForm = document.getElementById('backToForm');
const confirmOrderBtn = document.getElementById('confirmOrder');
const closeCheckoutBtn = document.getElementById('closeCheckout');
const whatsappOrderBtn = document.getElementById('whatsappOrder');
const websiteOrderBtn = document.getElementById('websiteOrder');

// Phone number validation function
function validatePhoneNumber(phone) {
  const phoneRegex = /^\+?[0-9]{10,15}$/;
  return phoneRegex.test(phone);
}

// Generate a random order ID
function generateOrderId() {
  return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Format cart items for WhatsApp message
function formatCartForWhatsApp() {
  const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
  let message = 'New Order%0A%0A';
  message += `Order ID: ${generateOrderId()}%0A%0A`;
  message += 'Items:%0A';
  
  cartItems.forEach((item, index) => {
    message += `${index + 1}. ${item.name} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}%0A`;
  });
  
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  message += `%0ATotal: $${total.toFixed(2)}%0A%0A`;
  message += 'Please provide delivery address and contact information.';
  
  return message;
}

// Initialize the app
async function init() {
  showLoading();
  try {
    await loadProducts();
    updateCartUI();
  } catch (error) {
    showToast('Failed to load products. Please try again later.', 'error');
    console.error('Error initializing app:', error);
  } finally {
    hideLoading();
  }
}

// Load products from JSON
async function loadProducts() {
  try {
    console.log('Loading products...');
    const response = await fetch('products.json');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Products loaded:', data);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid products data format');
    }
    
    products = data;
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    return true;
  } catch (error) {
    console.error('Error loading products:', error);
    showToast('Failed to load products. Please check console for details.', 'error');
    return false;
  }
}

// Display products in the grid
function displayProducts(productsToDisplay) {
  if (!productsToDisplay || productsToDisplay.length === 0) {
    productList.innerHTML = '<div class="no-results">No products found. Try a different search.</div>';
    return;
  }

  productList.innerHTML = productsToDisplay.map(product => `
    <div class="product" data-id="${product.id}">
      <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
      <div class="product-info">
        <h3 class="product-title">${product.name}</h3>
        <span class="product-category">${product.category}</span>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <button class="add-to-cart" onclick="addToCart(${product.id})">
          <i class="fas fa-shopping-cart"></i> Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// Add product to cart
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId);
  
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  updateCart();
  showToast(`${product.name} added to cart`, 'success');
}

// Remove item from cart
function removeFromCart(index) {
  cart.splice(index, 1);
  updateCart();
}

// Update cart quantity
function updateCartItemQuantity(index, change) {
  const item = cart[index];
  item.quantity = Math.max(1, (item.quantity || 1) + change);
  updateCart();
}

// Update cart UI and local storage
function updateCart() {
  // Save to local storage
  localStorage.setItem('cart', JSON.stringify(cart));
  
  // Update cart count
  const itemCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  cartCount.textContent = itemCount;
  
  // Update cart items
  cartItems.innerHTML = cart.length > 0 
    ? cart.map((item, index) => `
        <li class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-image">
          <div class="cart-item-details">
            <h4 class="cart-item-title">${item.name}</h4>
            <span class="cart-item-price">$${item.price.toFixed(2)}</span>
            <div class="cart-item-actions">
              <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, -1)">-</button>
              <span class="quantity">${item.quantity || 1}</span>
              <button class="quantity-btn" onclick="updateCartItemQuantity(${index}, 1)">+</button>
              <button class="remove-item" onclick="removeFromCart(${index})">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </li>
      `).join('')
    : '<div class="empty-cart">Your cart is empty</div>';
  
  // Update total
  const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  cartTotal.textContent = total.toFixed(2);
}

// Filter products by search term
function filterProducts(searchTerm = '') {
  const normalizedTerm = searchTerm.toLowerCase().trim();
  filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(normalizedTerm) ||
    product.category.toLowerCase().includes(normalizedTerm)
  );
  
  sortProducts();
  displayProducts(filteredProducts);
}

// Sort products based on selected option
function sortProducts() {
  const sortValue = sortSelect.value;
  
  filteredProducts.sort((a, b) => {
    switch (sortValue) {
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });
  
  displayProducts(filteredProducts);
}

// Show toast notification
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Show loading overlay
function showLoading() {
  loadingOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Hide loading overlay
function hideLoading() {
  loadingOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

// Toggle cart sidebar
function toggleCart() {
  cartSidebar.classList.toggle('active');
  overlay.classList.toggle('active');
  document.body.style.overflow = cartSidebar.classList.contains('active') ? 'hidden' : '';
}

// Show checkout modal
function openCheckout() {
  if (cart.length === 0) {
    showToast('Your cart is empty!', 'error');
    return;
  }
  checkoutModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Reset all sections
  checkoutOptions.classList.remove('hidden');
  customerInfoForm.classList.add('hidden');
  paymentOptions.classList.add('hidden');
  orderConfirmation.classList.add('hidden');
}

// Close checkout modal
function closeCheckoutModal() {
  checkoutModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// Setup event listeners
function setupEventListeners() {
  // Search
  searchBar.addEventListener('input', (e) => filterProducts(e.target.value));
  
  // Categories
  categories.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      categories.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const category = btn.dataset.category;
      filteredProducts = category === 'all' 
        ? [...products] 
        : products.filter(p => p.category === category);
      
      sortProducts();
      displayProducts(filteredProducts);
    });
  });
  
  // Sort
  sortSelect.addEventListener('change', sortProducts);
  
  // Cart
  cartBtn.addEventListener('click', toggleCart);
  closeCart.addEventListener('click', toggleCart);
  overlay.addEventListener('click', toggleCart);
  
  // Checkout
  checkoutBtn.addEventListener('click', openCheckout);
  
  // Close cart when pressing Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartSidebar.classList.contains('active')) {
      toggleCart();
    }
  });
  
  // Event Listeners for Checkout
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', openCheckout);
  }

  if (closeCheckout) {
    closeCheckout.addEventListener('click', closeCheckoutModal);
  }

  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', closeCheckoutModal);
  }

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === checkoutModal) {
      closeCheckoutModal();
    }
  });

  // WhatsApp Order
  if (whatsappOrderBtn) {
    whatsappOrderBtn.addEventListener('click', () => {
      const phoneNumber = '03148326903'; // Replace with your WhatsApp number
      const message = formatCartForWhatsApp();
      window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    });
  }

  // Website Order
  if (websiteOrderBtn) {
    websiteOrderBtn.addEventListener('click', () => {
      checkoutOptions.classList.add('hidden');
      customerInfoForm.classList.remove('hidden');
    });
  }

  // Back to options
  if (backToOptions) {
    backToOptions.addEventListener('click', () => {
      customerInfoForm.classList.add('hidden');
      checkoutOptions.classList.remove('hidden');
    });
  }

  // Back to form from payment
  if (backToForm) {
    backToForm.addEventListener('click', () => {
      paymentOptions.classList.add('hidden');
      customerInfoForm.classList.remove('hidden');
    });
  }

  // Form submission
  if (customerInfoForm) {
    customerInfoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const fullName = document.getElementById('fullName').value.trim();
      const email = document.getElementById('email').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const address = document.getElementById('address').value.trim();
      const city = document.getElementById('city').value.trim();
      
      // Simple validation
      if (!fullName || !email || !phone || !address || !city) {
        showToast('Please fill in all required fields', 'error');
        return;
      }
      
      if (!validatePhoneNumber(phone)) {
        showToast('Please enter a valid phone number', 'error');
        return;
      }
      
      // Store customer info
      const customerInfo = { fullName, email, phone, address, city };
      localStorage.setItem('customerInfo', JSON.stringify(customerInfo));
      
      // Show payment options
      customerInfoForm.classList.add('hidden');
      paymentOptions.classList.remove('hidden');
    });
  }

  // Confirm Order
  if (confirmOrderBtn) {
    confirmOrderBtn.addEventListener('click', () => {
      // Process payment here (in a real app, you'd integrate with a payment gateway)
      const orderId = generateOrderId();
      document.getElementById('orderId').textContent = orderId;
      
      // Show order confirmation
      paymentOptions.classList.add('hidden');
      orderConfirmation.classList.remove('hidden');
      
      // Clear cart after successful order
      localStorage.removeItem('cart');
      cart = [];
      updateCartCount(0);
      
      // Update UI
      displayCartItems();
      updateCartTotal();
      
      // Show success message
      showToast('Order placed successfully!', 'success');
    });
  }

  // Payment Buttons
  document.querySelectorAll('.payment-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const paymentMethod = e.currentTarget.classList.contains('easypaisa') ? 'EasyPaisa' : 'JazzCash';
      
      // In a real app, you would redirect to the payment gateway
      // For demo, we'll just show a message
      showToast(`Redirecting to ${paymentMethod}...`, 'info');
      
      // Simulate payment processing
      setTimeout(() => {
        // After payment, show order confirmation
        const orderId = generateOrderId();
        document.getElementById('orderId').textContent = orderId;
        
        paymentOptions.classList.add('hidden');
        orderConfirmation.classList.remove('hidden');
        
        // Clear cart after successful order
        localStorage.removeItem('cart');
        cart = [];
        updateCartCount(0);
        
        // Update UI
        displayCartItems();
        updateCartTotal();
        
        showToast('Payment successful! Order placed.', 'success');
      }, 2000);
    });
  });

  // QR Code Payment
  document.getElementById('qrPayment')?.addEventListener('click', () => {
    // In a real app, you would show the QR code for scanning
    showToast('Please scan the QR code to complete your payment', 'info');
    
    // After successful payment, you would typically receive a webhook or poll for payment status
    // For demo, we'll show a success message after a delay
    setTimeout(() => {
      const orderId = generateOrderId();
      document.getElementById('orderId').textContent = orderId;
      
      paymentOptions.classList.add('hidden');
      orderConfirmation.classList.remove('hidden');
      
      // Clear cart after successful order
      localStorage.removeItem('cart');
      cart = [];
      updateCartCount(0);
      
      // Update UI
      displayCartItems();
      updateCartTotal();
      
      showToast('Payment received! Order placed.', 'success');
    }, 3000);
  });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Re-query the DOM elements after the page is loaded
  const searchBar = document.getElementById('searchBar');
  const categories = document.querySelectorAll('#categories button');
  const cartBtn = document.getElementById('cartBtn');
  const cartSidebar = document.getElementById('cart');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  const cartCount = document.getElementById('cartCount');
  const closeCart = document.getElementById('closeCart');
  const overlay = document.querySelector('.overlay');
  const loadingOverlay = document.getElementById('loading');
  const toast = document.getElementById('toast');
  const sortSelect = document.getElementById('sort');
  const checkoutBtn = document.getElementById('checkoutBtn');

  // Initialize the app
  init();

  // Call setupEventListeners after init is complete
  setupEventListeners();
});

// Expose functions to global scope for HTML onclick handlers
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;

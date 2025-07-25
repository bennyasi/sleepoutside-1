import { getLocalStorage, setLocalStorage, updateCartBadgeWithAnimation } from "./utils.mjs";

// Adjust this if your images folder moves
const imageBasePath = "../images/";

// Fixes image paths to be relative to the cart page
function fixImagePath(relativePath) {
  if (!relativePath) return "";
  // If the path already starts with "images/", just prepend the base path
  if (relativePath.startsWith("images/")) {
    return imageBasePath + relativePath.replace(/^images\//, "");
  }
  // Remove any leading ../ from the path and prepend imageBasePath
  return imageBasePath + relativePath.replace(/^(\.\.\/)+images\//, "");
}

// Renders the cart contents to the page
function renderCartContents() {
  const cartItems = getLocalStorage("so-cart") || [];
  const productList = document.querySelector(".product-list");

  if (!productList) return;

  if (cartItems.length === 0) {
    productList.innerHTML = "<p>Your cart is empty.</p>";
    updateCartBadgeWithAnimation();
    return;
  }

  const htmlItems = cartItems.map(cartItemTemplate).join("");
  const total = cartItems.reduce(
    (sum, item) => sum + Number(item.FinalPrice) * (item.Quantity || 1),
    0,
  );

  productList.innerHTML = `
    ${htmlItems}
    <li class="cart-total">Total: $${total.toFixed(2)}</li>
  `;

  updateCartBadgeWithAnimation();
  
  // Add event listeners for remove buttons and quantity buttons
  addRemoveListeners();
  addQuantityListeners();
  updateCheckoutButton();
}

// Template for each cart item
function cartItemTemplate(item) {
  // Build product page link relative to cart page
  const productLink = `../product_pages/index.html?id=${encodeURIComponent(item.Id)}`;
  return `
    <li class="cart-card divider">
      <a href="${productLink}" class="cart-card__image">
        <img src="${fixImagePath(item.Image)}" alt="${item.Name}" />
      </a>
      <a href="${productLink}">
        <h2 class="card__name">${item.Name}</h2>
      </a>
      <p class="cart-card__color">${item.Colors?.[0]?.ColorName || "N/A"}</p>
      <div class="cart-card__quantity">
        <button class="quantity-btn decrease-qty" data-id="${item.Id}">-</button>
        <span>qty: ${item.Quantity || 1}</span>
        <button class="quantity-btn increase-qty" data-id="${item.Id}">+</button>
      </div>
      <p class="cart-card__price">$${(item.FinalPrice * (item.Quantity || 1)).toFixed(2)}</p>
      <button class="remove-item" data-id="${item.Id}" aria-label="Remove ${item.Name} from cart">❌</button>
    </li>
  `;
}

// Updates the cart badge in the header (now handled by utils.mjs)

// Function to remove an item from the cart
function removeFromCart(productId) {
  let cartItems = getLocalStorage("so-cart") || [];
  
  // Filter out the item to be removed
  cartItems = cartItems.filter(item => item.Id !== productId);
  
  // Save the updated cart back to localStorage
  setLocalStorage("so-cart", cartItems);
  
  // Re-render the cart contents
  renderCartContents();
}

// Function to add event listeners to remove buttons
function addRemoveListeners() {
  const removeButtons = document.querySelectorAll(".remove-item");
  
  removeButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = e.target.dataset.id;
      
      // Optional: Add confirmation dialog
      if (confirm("Are you sure you want to remove this item from your cart?")) {
        removeFromCart(productId);
      }
    });
  });
}

// Function to update item quantity
function updateQuantity(productId, change) {
  let cartItems = getLocalStorage("so-cart") || [];
  
  const itemIndex = cartItems.findIndex(item => item.Id === productId);
  if (itemIndex !== -1) {
    cartItems[itemIndex].Quantity = (cartItems[itemIndex].Quantity || 1) + change;
    
    // Remove item if quantity becomes 0 or negative
    if (cartItems[itemIndex].Quantity <= 0) {
      cartItems.splice(itemIndex, 1);
    }
    
    setLocalStorage("so-cart", cartItems);
    renderCartContents();
    
    // Animate cart icon when quantity changes
    if (change > 0) {
      animateCartIcon();
    }
  }
}

// Function to add event listeners to quantity buttons
function addQuantityListeners() {
  const increaseButtons = document.querySelectorAll(".increase-qty");
  const decreaseButtons = document.querySelectorAll(".decrease-qty");
  
  increaseButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = e.target.dataset.id;
      updateQuantity(productId, 1);
    });
  });
  
  decreaseButtons.forEach(button => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const productId = e.target.dataset.id;
      updateQuantity(productId, -1);
    });
  });
}

// Initialize cart rendering
renderCartContents();

// Add functionality to enable/disable checkout button
function updateCheckoutButton() {
  const cartItems = getLocalStorage("so-cart") || [];
  const checkoutLink = document.querySelector("#checkout-link");
  
  if (checkoutLink) {
    if (cartItems.length === 0) {
      checkoutLink.style.opacity = "0.5";
      checkoutLink.style.pointerEvents = "none";
      checkoutLink.textContent = "Cart Empty";
    } else {
      checkoutLink.style.opacity = "1";
      checkoutLink.style.pointerEvents = "auto";
      checkoutLink.textContent = "Proceed to Checkout";
    }
  }
}

// Call it initially and after cart changes
updateCheckoutButton();
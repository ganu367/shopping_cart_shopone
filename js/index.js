document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");
  const paginationContainer = document.getElementById("pagination");
  const cartCountElement = document.getElementById("cart-count");
  const cartModal = document.getElementById("cart-modal");
  const cartItemsContainer = document.getElementById("cart-items");
  const totalItemsElement = document.getElementById("total-items");
  const totalPriceElement = document.getElementById("total-price");

  let currentPage = 1;
  const productsPerPage = 10;
  let cartCount = parseInt(localStorage.getItem("cartCount")) || 0;
  let cartItems = [];

  if (cartCount > 0) {
    cartCountElement.style.display = "block";
    updateCartCount();
  } else {
    cartCountElement.style.display = "none";
  }

  const fetchProducts = async (page, limit) => {
    try {
      const response = await fetch(
        `https://fakestoreapi.com/products?limit=${limit}&page=${page}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const renderProduct = (product) => {
    const productDiv = document.createElement("div");
    productDiv.classList.add("product");
    productDiv.innerHTML = `
            <h3>${product.title}</h3>
            <img src="${product.image}" alt="${product.title}">
            <p>Price: $${product.price}</p>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        `;
    productList.appendChild(productDiv);
  };

  const renderPagination = (totalPages) => {
    const paginationDiv = document.createElement("div");
    paginationDiv.classList.add("pagination");

    for (let i = 1; i <= totalPages; i++) {
      const button = document.createElement("button");
      button.textContent = i;
      button.addEventListener("click", () => loadProducts(i, productsPerPage));
      paginationDiv.appendChild(button);
    }

    paginationContainer.innerHTML = "";
    paginationContainer.appendChild(paginationDiv);
  };

  const loadProducts = async (page, limit) => {
    const products = await fetchProducts(page, limit);
    products.forEach(renderProduct);
    setAddToCartListeners();
  };

  const addToCart = async (productId) => {
    const product = await getProductById(productId);

    if (product) {
        const existingItemIndex = cartItems.findIndex((item) => item.id === productId);

        if (existingItemIndex !== -1) {
            updateCartItemQuantity(productId, 1);
        } else {
            cartItems.push({ ...product, quantity: 1 });
        }

        updateCartCount();
        updateCartSummary();
        localStorage.setItem("cartItems", JSON.stringify(cartItems.map(item => ({ ...item, quantity: item.quantity || 1 }))));
        cartCountElement.style.display = "block";
        openCartModal();
        setRemoveFromCartListeners();
    }
};

  
  const getProductById = async (productId) => {
    try {
      const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
      const product = await response.json();
      return {
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      };
    } catch (error) {
      console.error("Error fetching product by ID:", error);
      return null;
    }
  };
  

  const setAddToCartListeners = () => {
    const addToCartButtons = document.querySelectorAll(".add-to-cart-btn");
    addToCartButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-product-id");
        addToCart(productId);
      });
    });
  };

  const renderCartItem = (item) => {
    console.log("Rendering cart item:", item);
    const cartItemDiv = document.createElement("div");
    cartItemDiv.classList.add("cart-item");
    cartItemDiv.innerHTML = `
      <img class="cart-item-image" src="${item.image}" alt="${item.title}">
      <div class="cart-item-details">
        <p class="cart-item-title">${item.title}</p>
        <p>Price: $${item.price}</p>
        <p>Quantity: ${item.quantity}</p>
        <button class="remove-from-cart-btn" data-product-id="${item.id}">Remove</button>
      </div>
    `;
    cartItemsContainer.appendChild(cartItemDiv);
  
    
    const removeBtn = cartItemDiv.querySelector(".remove-from-cart-btn");

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        const productId = removeBtn.getAttribute("data-product-id");
        console.log("Remove button clicked for product ID:", productId);
        removeFromCart(productId);
      });
    }
    // setRemoveFromCartListeners();
  };
  
  const setRemoveFromCartListeners = () => {
    cartItemsContainer.addEventListener("click", (event) => {
      const removeBtn = event.target.closest(".remove-from-cart-btn");
      if (removeBtn) {
        const productId = removeBtn.getAttribute("data-product-id");
        removeFromCart(productId);
      }
    });
  };
  

  const removeFromCart = (productId) => {
    const itemIndex = cartItems.findIndex((item) => item.id === productId);
    console.log("index",itemIndex)
    if (itemIndex !== -1) {
      cartItems.splice(itemIndex, 1);
      updateCartCount();
      localStorage.setItem("cartItems", JSON.stringify(cartItems));
      console.log("After localStorage update:", JSON.parse(localStorage.getItem("cartItems")));
  
      const cartItemToRemove = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
      if (cartItemToRemove) {
        cartItemToRemove.remove();
        updateCartSummary();
      } else {
        console.log("CartItem not found in the DOM.");
      }
    } else {
      console.log("Item not found in cartItems array.");
    }
  };

  const updateCartCount = () => {
    cartCount = cartItems.length;
    cartCountElement.textContent = cartCount.toString();
  };
  
  const updateCartSummary = () => {
    console.log("Updating cart summary with:", cartItems);
    cartItemsContainer.innerHTML = "";
    let totalItems = 0;
    let totalPrice = 0;
  
    cartItems.forEach((item) => {
      totalItems++;
      totalPrice += item.price;
      renderCartItem(item);
    });
  
    totalItemsElement.textContent = `Total Items: ${totalItems}`;
    totalPriceElement.textContent = `Total Price: $${totalPrice.toFixed(2)}`;
  };


  const updateCartItemQuantity = (productId, quantity) => {
    const existingItem = cartItems.find((item) => item.id === productId);
  
    if (existingItem) {
      if (existingItem.quantity) {
        existingItem.quantity += quantity;
      } else {
        existingItem.quantity = 1;
      }
    }
  };
  
 
  loadProducts(currentPage, productsPerPage);

  window.addEventListener("scroll", () => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      currentPage++;
      loadProducts(currentPage, productsPerPage);
    }
  });

  document.getElementById("cartBtn").addEventListener("click", openCartModal);
  document.querySelector(".close").addEventListener("click", closeCartModal);

  document.getElementById("cartBtn").addEventListener("click", () => {
    console.log("Cart button clicked");
    openCartModal();
  });

  document.querySelector(".close").addEventListener("click", () => {
    console.log("Close button clicked");
    closeCartModal();
  });
});

function openCartModal() {
  document.getElementById("cart-modal").style.display = "block";
  document.getElementById("cart-modal").style.right = "0";
}

function closeCartModal() {
  document.getElementById("cart-modal").style.display = "none";
  document.getElementById("cart-modal").style.right = "-300px";
}

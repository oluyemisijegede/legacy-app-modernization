const productDiv = document.getElementById("products");
const cartDiv = document.getElementById("cart");

async function loadProducts() {

const res = await fetch("/products");

const products = await res.json();

productDiv.innerHTML = "";

products.forEach(p => {

productDiv.innerHTML += `
<div class="product">
<h3>${p.name}</h3>
<p>$${p.price}</p>
<button onclick="addToCart(${p.id})">Add to Cart</button>
</div>
`;

});

}

async function addToCart(id) {

await fetch("/cart", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
productId: id
})
});

loadCart();

}

async function loadCart(){

const res = await fetch("/cart");

const cart = await res.json();

cartDiv.innerHTML = "";

cart.forEach((item,index) => {

cartDiv.innerHTML += `
<div class="cart-item">
${item.name} - $${item.price}
</div>
`;

});

}

async function checkout(){

const res = await fetch("/checkout", {
method:"POST"
});

const data = await res.json();

/* Redirect to thank you page */

window.location.href = "/thankyou.html";

}

loadProducts();
loadCart();
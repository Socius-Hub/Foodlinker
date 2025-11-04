import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');

const modalOverlay = document.getElementById('phone-modal-overlay');
const modalTitle = document.getElementById('phone-modal-title');
const modalMessage = document.getElementById('phone-modal-message');
const phoneInputContainer = document.getElementById('phone-input-container');
const phoneInput = document.getElementById('phone-input');
const modalButtons = document.getElementById('phone-modal-buttons');

let currentUser;

onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

async function proceedToCheckout(userPhone) {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const fullName = userDoc.exists() ? userDoc.data().fullName : currentUser.displayName;

    const cart = getCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const orderItems = cart.map(item => ({
        sweetId: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price
    }));

    try {
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: fullName,
            userPhone: userPhone,
            items: orderItems,
            totalPrice: total,
            status: "Pendente",
            createdAt: serverTimestamp()
        });
        alert("Pedido realizado com sucesso!");
        localStorage.removeItem('cart');
        window.dispatchEvent(new Event('cartUpdated')); 
        window.location.href = "/pedidos"; 
    } catch (error) {
        console.error("Erro ao finalizar pedido: ", error);
        alert("Falha ao registrar o pedido.");
    } finally {
        modalOverlay.classList.remove('active');
    }
}

async function savePhoneAndCheckout(phone) {
    if (!phone.trim()) {
        alert("O número de telefone é obrigatório.");
        return;
    }
    try {
        const userDocRef = doc(db, "users", currentUser.uid);
        await updateDoc(userDocRef, { phone: phone });
        proceedToCheckout(phone);
    } catch (error) {
        console.error("Erro ao salvar o telefone: ", error);
        alert("Não foi possível salvar seu telefone. Tente novamente.");
    }
}

function requestPhoneNumber(existingPhone = '') {
    modalTitle.textContent = "Qual é o seu telefone de contato?";
    modalMessage.textContent = "Precisamos do seu número para confirmar os detalhes do pedido.";
    phoneInput.value = existingPhone;
    phoneInputContainer.style.display = 'block';

    modalButtons.innerHTML = '';
    const saveButton = document.createElement('button');
    saveButton.textContent = "Salvar e Continuar";
    saveButton.onclick = () => savePhoneAndCheckout(phoneInput.value);
    modalButtons.appendChild(saveButton);

    modalOverlay.classList.add('active');
}

function confirmPhoneNumber(phone) {
    modalTitle.textContent = "Confirme seu telefone";
    modalMessage.innerHTML = `Vamos usar o número <strong>${phone}</strong> para este pedido. Ele está correto?`;
    phoneInputContainer.style.display = 'none';

    modalButtons.innerHTML = ''; 
    const changeButton = document.createElement('button');
    changeButton.textContent = "Alterar";
    changeButton.className = "button-secondary"; 
    changeButton.onclick = () => requestPhoneNumber(phone);
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = "Sim, usar este";
    confirmButton.onclick = () => proceedToCheckout(phone);

    modalButtons.appendChild(changeButton);
    modalButtons.appendChild(confirmButton);
    modalOverlay.classList.add('active');
}

checkoutButton.addEventListener('click', async () => {
    if (!currentUser) {
        alert("Você precisa estar logado para finalizar o pedido.");
        window.location.href = "/login";
        return;
    }
    if (getCart().length === 0) {
        alert("Seu carrinho está vazio.");
        return;
    }

    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userPhone = userDoc.exists() ? userDoc.data().phone : null;

    if (userPhone) {
        confirmPhoneNumber(userPhone);
    } else {
        requestPhoneNumber();
    }
});

function getCart() { return JSON.parse(localStorage.getItem('cart')) || []; }
function saveCart(cart) { 
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated')); 
    renderCart(); 
}

function updateQuantity(sweetId, newQuantity) {
    const cart = getCart();
    const item = cart.find(i => i.id === sweetId);
    if (item) {
        if (newQuantity > 0) {
            item.quantity = newQuantity;
        } else {
            const itemIndex = cart.findIndex(i => i.id === sweetId);
            cart.splice(itemIndex, 1);
        }
    }
    saveCart(cart);
}
window.updateQuantity = updateQuantity;

function renderCart() {
    const cart = getCart();
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        checkoutButton.disabled = true;
    } else {
        checkoutButton.disabled = false;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.innerHTML = `<h4>${item.name}</h4><p>Preço: R$ ${item.price.toFixed(2)}</p><div class="quantity-controls"><label for="qty-${item.id}">Qtd:</label><input type="number" id="qty-${item.id}" value="${item.quantity}" min="0" onchange="updateQuantity('${item.id}', this.valueAsNumber)"></div><p>Subtotal: R$ ${itemTotal.toFixed(2)}</p>`;
            cartItemsContainer.appendChild(itemElement);
        });
    }
    cartTotalSpan.textContent = `R$ ${total.toFixed(2)}`;
}

renderCart();
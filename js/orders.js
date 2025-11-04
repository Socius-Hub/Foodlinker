import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const sweetsSelection = document.getElementById('sweets-selection');
const orderForm = document.getElementById('order-form');

let currentUser;

onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
    } else {
        alert("Você precisa estar logado para fazer uma encomenda.");
        window.location.href = "/login";
    }
});

async function fetchSweets() {
    const sweetsCollection = collection(db, 'sweets');
    const sweetsSnapshot = await getDocs(sweetsCollection);
    const sweetsList = sweetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderSweetsForOrder(sweetsList);
}

function renderSweetsForOrder(sweets) {
    sweetsSelection.innerHTML = '';
    sweets.forEach(sweet => {
        const sweetItem = document.createElement('div');
        sweetItem.classList.add('sweet-item-order');
        sweetItem.innerHTML = `
            <h4>${sweet.name} - R$ ${sweet.price.toFixed(2)}</h4>
            <input type="number" id="${sweet.id}" min="0" value="0" data-price="${sweet.price}" data-name="${sweet.name}">
        `;
        sweetsSelection.appendChild(sweetItem);
    });
}

orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentUser) {
        alert("Usuário não autenticado.");
        return;
    }

    const items = [];
    let totalPrice = 0;
    const inputs = sweetsSelection.querySelectorAll('input[type="number"]');

    inputs.forEach(input => {
        const quantity = parseInt(input.value);
        if (quantity > 0) {
            const price = parseFloat(input.dataset.price);
            items.push({
                sweetId: input.id,
                name: input.dataset.name,
                quantity: quantity,
                unitPrice: price
            });
            totalPrice += quantity * price;
        }
    });

    if (items.length === 0) {
        alert("Por favor, selecione pelo menos um doce.");
        return;
    }

    try {
        await addDoc(collection(db, "orders"), {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            items: items,
            totalPrice: totalPrice,
            status: "Pendente",
            createdAt: serverTimestamp()
        });
        alert("Encomenda realizada com sucesso!");
        orderForm.reset();
        window.location.href = "/";
    } catch (error) {
        console.error("Erro ao realizar pedido: ", error);
        alert("Falha ao realizar o pedido.");
    }
});

fetchSweets();
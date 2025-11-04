import { auth, db } from './firebase-config.js';
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

console.log("main.js foi carregado com sucesso.");

const sweetsContainer = document.getElementById('sweets-container');
const searchName = document.getElementById('search-by-name');
const searchCategory = document.getElementById('search-by-category');
const sortByPrice = document.getElementById('sort-by-price');

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
}

function addToCart(sweetId, allFetchedSweets) {
    const quantityInput = document.getElementById(`quantity-${sweetId}`);
    const quantity = parseInt(quantityInput.value, 10);

    if (isNaN(quantity) || quantity <= 0) {
        alert("Por favor, insira uma quantidade válida.");
        return;
    }

    const sweet = allFetchedSweets.find(s => s.id === sweetId);
    if (!sweet) return;

    const cart = getCart();
    const existingItem = cart.find(item => item.id === sweetId);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: sweet.id,
            name: sweet.name,
            price: sweet.price,
            quantity: quantity
        });
    }
    saveCart(cart);
    alert(`${quantity}x ${sweet.name} foi adicionado ao carrinho!`);
    quantityInput.value = 1;
}

function renderStars(rating) {
    const totalStars = 5;
    let starsHtml = `<div class="star-rating display-only" data-rating="${Math.round(rating)}">`;
    for (let i = 1; i <= totalStars; i++) {
        const isFilled = i <= Math.round(rating);
        starsHtml += `<span class="star ${isFilled ? 'filled' : ''}">&#9733;</span>`;
    }
    starsHtml += '</div>';
    return starsHtml;
}

async function renderSweets(sweets) {
    sweetsContainer.innerHTML = '';
    if (sweets.length === 0) {
        sweetsContainer.innerHTML = '<p>Nenhum doce encontrado com estes critérios.</p>';
        return;
    }

    for (const sweet of sweets) {
        const sweetElement = document.createElement('div');
        sweetElement.classList.add('sweet-card');
        
        const averageRating = sweet.averageRating || 0;
        const reviewCount = sweet.reviewCount || 0;
        
        sweetElement.innerHTML = `
            <img src="${sweet.imageUrl}" alt="${sweet.name}">
            <h3>${sweet.name}</h3>
            <p>${sweet.description}</p>
            <p class="price">R$ ${sweet.price.toFixed(2)}</p>
            <div class="card-footer">
                <div class="quantity-selector">
                    <label for="quantity-${sweet.id}">Qtd:</label>
                    <input type="number" id="quantity-${sweet.id}" value="1" min="1">
                </div>
                <button class="add-to-cart-btn" data-id="${sweet.id}">Adicionar</button>
            </div>
            <div class="reviews-section" id="reviews-${sweet.id}">
                <h4>Avaliações (${reviewCount})</h4>
                ${renderStars(averageRating)} 
            </div>
        `;
        sweetsContainer.appendChild(sweetElement);
    }
    
    addEventListenersToButtons(sweets);
}

function addEventListenersToButtons(allFetchedSweets) {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const sweetId = button.dataset.id;
            addToCart(sweetId, allFetchedSweets);
        });
    });
}

async function populateCategories() {
    try {
        const sweetsCollection = collection(db, 'sweets');
        const sweetsSnapshot = await getDocs(sweetsCollection);
        
        const allCategories = sweetsSnapshot.docs.map(doc => doc.data().category);
        const categories = [...new Set(allCategories)]; 

        searchCategory.innerHTML = '<option value="">Todas as Categorias</option>';
        categories.sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            searchCategory.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

async function applyFilters() {
    try {
        const nameFilter = searchName.value.toLowerCase();
        const categoryFilter = searchCategory.value;
        const sortOption = sortByPrice.value;

        let q = query(collection(db, 'sweets'));

        if (categoryFilter) {
            q = query(q, where("category", "==", categoryFilter));
        }

        if (sortOption === 'price-asc') {
            q = query(q, orderBy("price", "asc"));
        } else if (sortOption === 'price-desc') {
            q = query(q, orderBy("price", "desc"));
        } else {
            q = query(q, orderBy("name", "asc"));
        }

        const querySnapshot = await getDocs(q);
        const sweetsFromDB = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const filteredSweets = sweetsFromDB.filter(sweet => {
            return sweet.name.toLowerCase().includes(nameFilter);
        });

        renderSweets(filteredSweets);

    } catch (error) {
        console.error("Erro ao aplicar filtros: ", error);
        sweetsContainer.innerHTML = '<p>Ocorreu um erro ao carregar os produtos.</p>';
    }
}

searchName.addEventListener('change', applyFilters);
searchCategory.addEventListener('change', applyFilters);
sortByPrice.addEventListener('change', applyFilters);

populateCategories(); 
applyFilters();
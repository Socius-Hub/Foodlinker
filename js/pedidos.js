import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, query, where, getDocs, orderBy, doc, getDoc, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const orderHistoryList = document.getElementById('order-history-list');
const reviewModal = document.getElementById('review-modal');
const reviewForm = document.getElementById('review-form');
const cancelReviewBtn = document.getElementById('cancel-review-btn');
const reviewModalTitle = document.getElementById('review-modal-title');
const starRatingContainer = reviewModal.querySelector('.star-rating');
let currentSweetIdToReview = null;

const reviewedSweetIds = new Set();

async function fetchUserOrders(userId) {
    if (!userId) {
        orderHistoryList.innerHTML = '<p>Você precisa estar logado para ver seus pedidos.</p>';
        return;
    }
    
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
    
    try {
        reviewedSweetIds.clear();
        const reviewsRef = collection(db, "reviews");
        const qReviews = query(reviewsRef, where("userId", "==", userId));
        const reviewsSnapshot = await getDocs(qReviews);
        reviewsSnapshot.docs.forEach(doc => reviewedSweetIds.add(doc.data().sweetId));

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            orderHistoryList.innerHTML = '<p>Você ainda não fez nenhum pedido.</p>';
            return;
        }
        orderHistoryList.innerHTML = ''; 
        querySnapshot.forEach(doc => {
            const order = doc.data();
            const orderElement = document.createElement('div');
            orderElement.classList.add('order-card');
            
            const orderDate = new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR');
            
            let itemsHtml = order.items.map(item => {
                const alreadyReviewed = reviewedSweetIds.has(item.sweetId);
                let buttonHtml = '';

                if (order.status === 'Concluído') {
                    if (alreadyReviewed) {
                        buttonHtml = `<button class="review-button" disabled>Avaliado</button>`;
                    } else {
                        buttonHtml = `<button class="review-button" data-sweet-id="${item.sweetId}" data-sweet-name="${item.name}">Avaliar</button>`;
                    }
                }

                return `
                    <div class="order-item-detail">
                        <span>${item.quantity}x ${item.name}</span>
                        ${buttonHtml}
                    </div>
                `;
            }).join('');

            orderElement.innerHTML = `
                <div class="order-card-header">
                    <h4>Pedido de ${orderDate}</h4>
                    <p><strong>Status:</strong> ${order.status}</p>
                    <p><strong>Total:</strong> R$ ${order.totalPrice.toFixed(2)}</p>
                </div>
                <div class="order-card-body">
                    <p><strong>Itens:</strong></p>
                    ${itemsHtml}
                </div>
            `;
            orderHistoryList.appendChild(orderElement);
        });
        
        document.querySelectorAll('.review-button').forEach(button => {
            if (!button.disabled) {
                button.addEventListener('click', (e) => {
                    const sweetId = e.target.dataset.sweetId;
                    const sweetName = e.target.dataset.sweetName;
                    openReviewModal(sweetId, sweetName);
                });
            }
        });

    } catch (error) {
        console.error("Erro ao buscar histórico de pedidos: ", error);
        orderHistoryList.innerHTML = '<p>Ocorreu um erro ao carregar seu histórico.</p>';
    }
}

function openReviewModal(sweetId, sweetName) {
    currentSweetIdToReview = sweetId;
    reviewModalTitle.textContent = `Avaliar ${sweetName}`;
    reviewForm.reset();
    resetStars();
    reviewModal.classList.add('active');
}

function closeReviewModal() {
    reviewModal.classList.remove('active');
    currentSweetIdToReview = null;
}

function resetStars() {
    starRatingContainer.dataset.rating = "0";
    starRatingContainer.querySelectorAll('.star').forEach(s => s.classList.remove('selected'));
}

starRatingContainer.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
        const ratingValue = star.dataset.value;
        starRatingContainer.dataset.rating = ratingValue;
        starRatingContainer.querySelectorAll('.star').forEach(s => {
            s.classList.toggle('selected', s.dataset.value <= ratingValue);
        });
    });
});

reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !currentSweetIdToReview) return;

    const rating = starRatingContainer.dataset.rating;
    const comment = document.getElementById('review-comment').value;

    if (rating === "0" || !comment) {
        alert("Por favor, selecione uma nota e escreva um comentário.");
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const userName = userDoc.exists() ? userDoc.data().fullName : user.displayName;

        await addDoc(collection(db, "reviews"), {
            sweetId: currentSweetIdToReview,
            userId: user.uid,
            userName: userName,
            rating: Number(rating),
            comment: comment,
            createdAt: serverTimestamp()
        });
        
        reviewedSweetIds.add(currentSweetIdToReview);
        
        alert("Avaliação enviada com sucesso!");
        
        const buttonsToDisable = document.querySelectorAll(`.review-button[data-sweet-id="${currentSweetIdToReview}"]`);
        buttonsToDisable.forEach(button => {
            if (!button.disabled) {
                button.disabled = true;
                button.textContent = "Avaliado";
            }
        });
        
        closeReviewModal();

    } catch (error) {
        console.error("Erro ao enviar avaliação: ", error);
        alert("Falha ao enviar avaliação.");
    }
});

cancelReviewBtn.addEventListener('click', closeReviewModal);

onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchUserOrders(user.uid);
    } else {
        window.location.href = '/login';
    }
});
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, getDoc, addDoc, collection, getDocs, query, orderBy, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    
    const adminPanel = document.getElementById('admin-panel');
    const loadingMessage = document.getElementById('loading-message');
    const usersListAdmin = document.getElementById('users-list-admin');
    const ordersListAdmin = document.getElementById('orders-list-admin');
    const contactsListAdmin = document.getElementById('contacts-list-admin');
    const addSweetForm = document.getElementById('add-sweet-form');

    const sweetsListAdmin = document.getElementById('sweets-list-admin');
    const reviewsListAdmin = document.getElementById('reviews-list-admin');
    const editSweetModal = document.getElementById('edit-sweet-modal');
    const editSweetForm = document.getElementById('edit-sweet-form');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const orderStatusFilter = document.getElementById('order-status-filter');

    let allOrders = []; 
    let elementToFocusOnClose = null;

    function announce(message) {
        const announcer = document.getElementById('live-announcer');
        if (announcer) {
            announcer.textContent = message;
        }
    }

    function setupTabs() {
        const tablist = document.querySelector('[role="tablist"]');
        const tabs = document.querySelectorAll('[role="tab"]');
        const contents = document.querySelectorAll('[role="tabpanel"]');
        let tabFocus = 0;

        if (tablist) {
            tabs.forEach((tab, index) => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectTab(tab, index);
                });

                tab.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        tabs[tabFocus].setAttribute('tabindex', -1);
                        tabFocus++;
                        if (tabFocus >= tabs.length) tabFocus = 0;
                        tabs[tabFocus].setAttribute('tabindex', 0);
                        tabs[tabFocus].focus();
                    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        tabs[tabFocus].setAttribute('tabindex', -1);
                        tabFocus--;
                        if (tabFocus < 0) tabFocus = tabs.length - 1;
                        tabs[tabFocus].setAttribute('tabindex', 0);
                        tabs[tabFocus].focus();
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectTab(tab, index);
                    }
                });
            });
        }

        function selectTab(clickedTab, index) {
            const targetId = clickedTab.dataset.tab;
            const targetPanel = document.getElementById(targetId);

            tabs.forEach(tab => {
                tab.classList.remove('active');
                tab.setAttribute('aria-selected', 'false');
                tab.setAttribute('tabindex', -1);
            });

            clickedTab.classList.add('active');
            clickedTab.setAttribute('aria-selected', 'true');
            clickedTab.setAttribute('tabindex', 0);
            tabFocus = index;

            contents.forEach(panel => {
                panel.classList.remove('active');
                panel.setAttribute('aria-hidden', 'true');
            });

            if (targetPanel) {
                targetPanel.classList.add('active');
                targetPanel.setAttribute('aria-hidden', 'false');
                targetPanel.focus();
            }
        }
    }

    function renderOrders(statusFilter = 'Todos') {
        if (!ordersListAdmin) return;
        ordersListAdmin.innerHTML = '';

        const ordersToRender = statusFilter === 'Todos'
            ? allOrders
            : allOrders.filter(order => order.status === statusFilter);

        if (ordersToRender.length === 0) {
            ordersListAdmin.innerHTML = '<p>Nenhum pedido encontrado com este status.</p>';
            return;
        }

        ordersToRender.forEach(orderData => {
            const order = orderData;
            const orderId = order.id;
            const orderElement = document.createElement('div');
            orderElement.classList.add('order-item');
            let itemsHtml = order.items.map(item => `<li>${item.quantity}x ${item.name}</li>`).join('');
            
            const statusOptions = ['Pendente', 'Em produção', 'Concluído']
                .map(status => `<option value="${status}" ${order.status === status ? 'selected' : ''}>${status}</option>`)
                .join('');

            orderElement.innerHTML = `
                <h4>Pedido de: ${order.userEmail}</h4>
                <p><strong>Nome:</strong> ${order.userName || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${order.userPhone || 'Não informado'}</p>
                <p><strong>Data:</strong> ${new Date(order.createdAt.seconds * 1000).toLocaleString()}</p>
                <p><strong>Total:</strong> R$ ${order.totalPrice.toFixed(2)}</p>
                <div class="status-updater">
                    <label for="status-${orderId}"><strong>Status:</strong></label>
                    <select id="status-${orderId}" onchange="updateOrderStatus('${orderId}', this.value)">
                        ${statusOptions}
                    </select>
                </div>
                <ul>${itemsHtml}</ul>
            `;
            ordersListAdmin.appendChild(orderElement);
        });
    }

    async function fetchOrders() {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const ordersSnapshot = await getDocs(q);
        allOrders = ordersSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
        renderOrders(); 
    }

    function closeModal() {
        if(editSweetModal) editSweetModal.style.display = 'none';
        if(elementToFocusOnClose) {
            elementToFocusOnClose.focus();
            elementToFocusOnClose = null;
        }
    }

    async function fetchAndRenderSweets() {
        if (!sweetsListAdmin) return;
        const sweetsCollection = collection(db, 'sweets');
        const sweetsSnapshot = await getDocs(sweetsCollection);
        sweetsListAdmin.innerHTML = ''; 

        sweetsSnapshot.forEach(docSnap => {
            const sweet = { id: docSnap.id, ...docSnap.data() };
            const sweetElement = document.createElement('div');
            sweetElement.classList.add('sweet-item-admin');
            sweetElement.innerHTML = `
                <p><strong>${sweet.name}</strong> - R$ ${sweet.price.toFixed(2)}</p>
                <div>
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn">Excluir</button>
                </div>
            `;

            sweetElement.querySelector('.delete-btn').addEventListener('click', async () => {
                if (confirm(`Tem certeza que deseja excluir o doce "${sweet.name}"?`)) {
                    try {
                        await deleteDoc(doc(db, "sweets", sweet.id));
                        alert("Doce excluído com sucesso!");
                        announce("Doce excluído com sucesso!");
                        fetchAndRenderSweets();
                    } catch (error) {
                        console.error("Erro ao excluir doce: ", error);
                        alert("Falha ao excluir o doce.");
                        announce("Falha ao excluir o doce.");
                    }
                }
            });

            sweetElement.querySelector('.edit-btn').addEventListener('click', (e) => {
                elementToFocusOnClose = e.target;
                document.getElementById('edit-sweet-id').value = sweet.id;
                document.getElementById('edit-sweet-name').value = sweet.name;
                document.getElementById('edit-sweet-description').value = sweet.description;
                document.getElementById('edit-sweet-price').value = sweet.price;
                document.getElementById('edit-sweet-category').value = sweet.category;
                document.getElementById('edit-sweet-image-url').value = sweet.imageUrl;
                if(editSweetModal) editSweetModal.style.display = 'block';
                document.getElementById('edit-sweet-name').focus();
            });

            sweetsListAdmin.appendChild(sweetElement);
        });
    }

    async function fetchUsers() {
        if (!usersListAdmin) return;
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        usersListAdmin.innerHTML = '';
        
        usersSnapshot.forEach(docSnap => {
            const user = docSnap.data();
            const userElement = document.createElement('div');
            userElement.classList.add('user-item');
            userElement.innerHTML = `
                <p><strong>Nome:</strong> ${user.fullName || 'Não informado'}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Telefone:</strong> ${user.phone || 'Não informado'}</p>
            `;
            usersListAdmin.appendChild(userElement);
        });
    }

    window.updateOrderStatus = async (orderId, newStatus) => {
        const orderRef = doc(db, "orders", orderId);
        try {
            await updateDoc(orderRef, { status: newStatus });
            alert(`Status do pedido ${orderId} atualizado para ${newStatus}`);
            announce(`Status do pedido ${orderId} atualizado para ${newStatus}`);
            const orderToUpdate = allOrders.find(order => order.id === orderId);
            if (orderToUpdate) {
                orderToUpdate.status = newStatus;
            }
            if(orderStatusFilter) renderOrders(orderStatusFilter.value);
        } catch (error) {
            console.error("Erro ao atualizar status do pedido: ", error);
            alert("Falha ao atualizar o status.");
            announce("Falha ao atualizar o status.");
        }
    }

    async function fetchContacts() {
        if (!contactsListAdmin) return;
        const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
        const contactsSnapshot = await getDocs(q);
        contactsListAdmin.innerHTML = '';
        
        contactsSnapshot.forEach(docSnap => {
            const contact = docSnap.data();
            const contactElement = document.createElement('div');
            contactElement.classList.add('user-item');
            contactElement.innerHTML = `
                <p><strong>De:</strong> ${contact.firstName} ${contact.lastName} (${contact.email})</p>
                <p><strong>Data:</strong> ${new Date(contact.createdAt.seconds * 1000).toLocaleString()}</p>
                <p><strong>Mensagem:</strong> ${contact.message}</p>
            `;
            contactsListAdmin.appendChild(contactElement);
        });
    }

    async function fetchAndRenderReviews() {
        if (!reviewsListAdmin) return;
        const reviewsCollection = collection(db, 'reviews');
        const q = query(reviewsCollection, orderBy("createdAt", "desc"));
        const reviewsSnapshot = await getDocs(q);
        reviewsListAdmin.innerHTML = '';

        if (reviewsSnapshot.empty) {
            reviewsListAdmin.innerHTML = '<p>Nenhuma avaliação encontrada.</p>';
            return;
        }

        reviewsSnapshot.forEach(docSnap => {
            const review = { id: docSnap.id, ...docSnap.data() };
            const reviewElement = document.createElement('div');
            reviewElement.classList.add('user-item');
            reviewElement.innerHTML = `
                <p><strong>Usuário:</strong> ${review.userName} (${review.rating}/5)</p>
                <p><strong>Data:</strong> ${new Date(review.createdAt.seconds * 1000).toLocaleString()}</p>
                <p><strong>Comentário:</strong> ${review.comment}</p>
                <p><small>ID do Doce: ${review.sweetId}</small></p>
                <button class="delete-review-btn" data-id="${review.id}">Excluir Avaliação</button>
            `;
            reviewsListAdmin.appendChild(reviewElement);
        });

        document.querySelectorAll('.delete-review-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const reviewId = e.target.dataset.id;
                if (confirm("Tem certeza que deseja excluir esta avaliação?")) {
                    try {
                        await deleteDoc(doc(db, "reviews", reviewId));
                        alert("Avaliação excluída com sucesso!");
                        announce("Avaliação excluída com sucesso!");
                        fetchAndRenderReviews();
                    } catch (error) {
                        console.error("Erro ao excluir avaliação: ", error);
                        alert("Falha ao excluir a avaliação.");
                        announce("Falha ao excluir a avaliação.");
                    }
                }
            });
        });
    }

    if (editSweetForm) {
        editSweetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const sweetId = document.getElementById('edit-sweet-id').value;
            const updatedData = {
                name: document.getElementById('edit-sweet-name').value,
                description: document.getElementById('edit-sweet-description').value,
                price: parseFloat(document.getElementById('edit-sweet-price').value),
                category: document.getElementById('edit-sweet-category').value,
                imageUrl: document.getElementById('edit-sweet-image-url').value
            };

            const sweetRef = doc(db, "sweets", sweetId);
            try {
                await updateDoc(sweetRef, updatedData);
                alert("Doce atualizado com sucesso!");
                announce("Doce atualizado com sucesso!");
                closeModal();
                fetchAndRenderSweets(); 
            } catch (error) {
                console.error("Erro ao atualizar doce: ", error);
                alert("Falha ao atualizar o doce.");
                announce("Falha ao atualizar o doce.");
            }
        });
    }

    if(cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeModal);
    }

    if(editSweetModal) {
        editSweetModal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
    }

    if (addSweetForm) {
        addSweetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('sweet-name').value;
            const description = document.getElementById('sweet-description').value;
            const price = parseFloat(document.getElementById('sweet-price').value);
            const category = document.getElementById('sweet-category').value;
            const imageUrl = document.getElementById('sweet-image-url').value; 

            if (!imageUrl) {
                alert("Por favor, insira uma URL para a imagem.");
                announce("Por favor, insira uma URL para a imagem.");
                return;
            }

            try {
                await addDoc(collection(db, "sweets"), {
                    name, description, price, category, imageUrl
                });
                alert("Doce adicionado com sucesso!");
                announce("Doce adicionado com sucesso!");
                addSweetForm.reset();
                fetchAndRenderSweets(); 
            } catch (error) {
                console.error("Erro ao adicionar doce: ", error);
                alert("Falha ao adicionar o doce.");
                announce("Falha ao adicionar o doce.");
            }
        });
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "users", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                if (loadingMessage) loadingMessage.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'block';
                
                setupTabs();
                
                if (orderStatusFilter) {
                    orderStatusFilter.addEventListener('change', () => {
                        renderOrders(orderStatusFilter.value);
                    });
                }

                fetchUsers();
                fetchOrders();
                fetchContacts();
                fetchAndRenderSweets();
                fetchAndRenderReviews();
            } else {
                alert("Acesso negado. Você não é um administrador.");
                announce("Acesso negado. Você não é um administrador.");
                window.location.href = "/";
            }
        } else {
            alert("Você precisa estar logado para acessar esta página.");
            announce("Você precisa estar logado para acessar esta página.");
            window.location.href = "/login";
        }
    });

});
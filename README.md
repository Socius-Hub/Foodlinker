<div align="center">

# 🍰 Oishii Sobremesas Japonesas  
### E-commerce Web Application

<img width="1362" height="605" alt="image" src="https://github.com/user-attachments/assets/7c856610-a475-4280-9a04-d374caf461f4" />


</div>

---

## 🏪 Sobre o Projeto

**Oishii Sobremesas Japonesas** é uma aplicação web completa de e-commerce desenvolvida para uma confeitaria fictícia de doces japoneses.  
O projeto foi construído com **HTML5**, **CSS3** e **JavaScript (ES Modules)**, utilizando o **Firebase** como backend para autenticação, banco de dados (**Firestore**) e hospedagem.

A plataforma é dividida em duas partes principais:

- 🛍️ **Área do Cliente** — Vitrine, carrinho e pedidos  
- ⚙️ **Área Administrativa** — Painel de gerenciamento da loja  

---

## 🔥 Funcionalidades

### 👤 Lado do Cliente (Usuário)

- **Autenticação de Usuário**
  - Login com **Email/Senha** e **Google**
  - Cadastro com nome, email, telefone e senha

- **Catálogo de Produtos**
  - Vitrine dinâmica com filtros por **nome**, **categoria** e **ordenação por preço**

- **Sistema de Avaliações**
  - Usuários podem avaliar produtos (nota + comentário)
  - Exibição da média de avaliações nos produtos

- **Carrinho de Compras**
  - Adição e remoção de itens  
  - Ajuste de quantidades  
  - Cálculo automático do subtotal  
  - Persistência via **localStorage** (mantém o carrinho salvo localmente)

- **Checkout**
  - Finalização de pedidos com salvamento no **Firestore**  
  - Confirmação do número de telefone antes da conclusão  

- **Histórico de Pedidos**
  - Página dedicada para acompanhar pedidos (status: *Pendente*, *Em produção*, *Concluído*)

- **Formulário de Contato**
  - Envio de mensagens salvas no Firestore, visíveis ao administrador

---

### 🧠 Lado do Administrador

- **Painel de Admin Protegido**
  - Rota `/admin` acessível apenas para usuários com a *role* `admin`

- **Gerenciamento de Produtos (CRUD)**
  - Adicionar novos doces  
  - Editar informações (nome, preço, descrição, etc.)  
  - Excluir produtos do catálogo  

- **Gerenciamento de Pedidos**
  - Visualização e filtragem de pedidos por status  
  - Atualização do status do pedido (*Pendente*, *Em produção*, *Concluído*)

- **Visualização de Usuários**
  - Lista completa de todos os usuários cadastrados  

- **Caixa de Entrada**
  - Acesso às mensagens enviadas pelo formulário de contato  

- **Moderação de Avaliações**
  - Visualização e exclusão de avaliações enviadas pelos usuários  

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** — Estrutura semântica das páginas  
- **CSS3** — Layout responsivo (mobile-first), com **Grid**, **Flexbox** e **variáveis CSS**  
- **JavaScript (ES Modules)** — Lógica, DOM e modularização  

### Backend (BaaS - Firebase)
- **Firebase Hosting** — Hospedagem da aplicação  
- **Firebase Authentication** — Login com Email/Senha e Google  
- **Firebase Firestore (NoSQL)** — Armazenamento de usuários, produtos, pedidos, avaliações e mensagens  

### Outros
- **LocalStorage** — Persistência do carrinho no navegador  

---

## 📁 Estrutura do Projeto

```plaintext
.
├── css/
│   └── style.css
├── js/
│   ├── admin.js
│   ├── auth.js
│   ├── cart.js
│   ├── common.js
│   ├── contact.js
│   ├── firebase-config.js
│   ├── main.js
│   ├── orders.js
│   ├── pedidos.js
│   └── tabs.js
├── img/
│   ├── icon.jpg
│   └── (outras imagens...)
├── 404.html
├── admin.html
├── cart.html
├── contact.html
├── firebase.json
├── index.html
├── login.html
├── orders.html
├── pedidos.html
└── products.html

```
---

## 🎯 Objetivo

Este projeto foi desenvolvido com fins **educacionais e de portfólio**, demonstrando o desenvolvimento de uma aplicação **full-stack moderna, reativa e funcional** usando **JavaScript puro (ESM)** e **Firebase** como backend (*BaaS — Backend as a Service*).

---

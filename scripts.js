// --- INITIAL DATA (State) ---
let currentUser = null;

let books = [
    { category: "Book", title: "The Great Gatsby", author: "F. Scott Fitzgerald", serial: "B100", issued: false },
    { category: "Movie", title: "Interstellar", author: "Christopher Nolan", serial: "M500", issued: false },
    { category: "Book", title: "Atomic Habits", author: "James Clear", serial: "B101", issued: false },
    { category: "Book", title: "1984", author: "George Orwell", serial: "B102", issued: false }
];

let issuedBooks = [];
let pendingReturnData = null;

// --- AUTHENTICATION LOGIC ---
function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    if (user === 'admin' && pass === 'admin123') {
        currentUser = { name: 'Administrator', role: 'admin' };
    } else if (user === 'user' && pass === 'user123') {
        currentUser = { name: 'Standard User', role: 'user' };
    } else {
        alert("Invalid Username or Password!");
        return;
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('user-badge').innerText = currentUser.role === 'admin' ? 'A' : 'U';
    document.getElementById('user-name').innerText = currentUser.name;

    setupNavigation();
    showSection('search');
}

function logout() {
    currentUser = null;
    document.getElementById('login-page').classList.remove('hidden');
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-user').value = "";
    document.getElementById('login-pass').value = "";
}

// --- NAVIGATION LOGIC ---
function setupNavigation() {
    const nav = document.getElementById('nav-menu');
    let menuItems = [
        { id: 'search', label: 'Inventory', icon: '📊' },
        { id: 'issue', label: 'Issue Item', icon: '📤' },
        { id: 'return', label: 'Return Item', icon: '📥' }
    ];

    if (currentUser.role === 'admin') {
        menuItems.push({ id: 'add-book', label: 'Add New Item', icon: '➕' });
    }

    nav.innerHTML = menuItems.map(item => `
        <a href="#" onclick="showSection('${item.id}')" id="nav-${item.id}">
            <span>${item.icon}</span> ${item.label}
        </a>
    `).join('');
}

function showSection(id) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('#nav-menu a').forEach(a => a.classList.remove('active-link'));

    const section = document.getElementById(`section-${id}`);
    if (section) section.classList.remove('hidden');

    const navLink = document.getElementById(`nav-${id}`);
    if (navLink) navLink.classList.add('active-link');

    const titles = {
        'search': 'Library Inventory',
        'issue': 'Issue a Book/Media',
        'return': 'Return Process',
        'add-book': 'Inventory Management'
    };
    document.getElementById('page-title').innerText = titles[id] || 'Dashboard';

    // Refresh data
    if (id === 'search') renderBookTable();
    if (id === 'issue') populateIssueSelect();
    if (id === 'return') populateReturnSelect();
    if (id === 'add-book' && document.getElementById('edit-index').value === "-1") resetBookForm();
}

// --- INVENTORY LOGIC ---
function renderBookTable() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const tbody = document.getElementById('book-table-body');
    const actionHeader = document.getElementById('th-actions');

    if (currentUser.role === 'admin') {
        actionHeader.classList.remove('hidden');
    } else {
        actionHeader.classList.add('hidden');
    }

    const filtered = books.filter(b =>
        b.title.toLowerCase().includes(query) ||
        b.author.toLowerCase().includes(query) ||
        b.serial.toLowerCase().includes(query)
    );

    tbody.innerHTML = filtered.map((b) => {
        const originalIndex = books.findIndex(book => book.serial === b.serial);

        let actionButtons = '';
        if (currentUser.role === 'admin') {
            actionButtons = `
                <td class="px-6 py-4 text-right space-x-2">
                    <button onclick="editBook(${originalIndex})" class="text-blue-600 hover:underline font-semibold text-xs bg-blue-50 px-2 py-1 rounded">Edit</button>
                    <button onclick="deleteBook(${originalIndex})" class="text-red-600 hover:underline font-semibold text-xs bg-red-50 px-2 py-1 rounded">Delete</button>
                </td>
            `;
        }

        return `
            <tr class="text-sm text-gray-700">
                <td class="px-6 py-4 font-medium text-gray-400">${b.category}</td>
                <td class="px-6 py-4 font-bold text-gray-900">${b.title}</td>
                <td class="px-6 py-4">${b.author}</td>
                <td class="px-6 py-4 font-mono text-xs text-blue-600">${b.serial}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md text-xs font-bold ${b.issued ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}">
                        ${b.issued ? 'ISSUED' : 'AVAILABLE'}
                    </span>
                </td>
                ${actionButtons}
            </tr>
        `;
    }).join('');
}

function resetBookForm() {
    document.getElementById('form-title').innerText = "Add New Inventory Item";
    document.getElementById('btn-save').innerText = "Add to System";
    document.getElementById('edit-index').value = "-1";
    document.getElementById('add-title').value = "";
    document.getElementById('add-author').value = "";
    document.getElementById('add-serial').value = "";
    document.getElementById('add-serial').disabled = false;
    document.getElementById('btn-cancel-edit').classList.add('hidden');
}

function editBook(index) {
    const book = books[index];
    showSection('add-book');

    document.getElementById('form-title').innerText = "Update Item Details";
    document.getElementById('btn-save').innerText = "Update Item";
    document.getElementById('edit-index').value = index;

    document.getElementById('add-category').value = book.category;
    document.getElementById('add-title').value = book.title;
    document.getElementById('add-author').value = book.author;
    document.getElementById('add-serial').value = book.serial;
    document.getElementById('add-serial').disabled = true;
    document.getElementById('btn-cancel-edit').classList.remove('hidden');
}

function deleteBook(index) {
    if (books[index].issued) return alert("Error: Cannot delete an issued item.");
    if (confirm(`Delete "${books[index].title}"?`)) {
        books.splice(index, 1);
        renderBookTable();
    }
}

function handleSaveBook() {
    const title = document.getElementById('add-title').value;
    const author = document.getElementById('add-author').value;
    const serial = document.getElementById('add-serial').value;
    const category = document.getElementById('add-category').value;
    const editIndex = parseInt(document.getElementById('edit-index').value);

    if (!title || !author || !serial) return alert("Please fill all fields");

    if (editIndex === -1) {
        if (books.some(b => b.serial === serial)) return alert("Serial must be unique.");
        books.push({ category, title, author, serial, issued: false });
    } else {
        books[editIndex].category = category;
        books[editIndex].title = title;
        books[editIndex].author = author;
    }
    
    resetBookForm();
    showSection('search');
}

// --- ISSUE LOGIC ---
function populateIssueSelect() {
    const select = document.getElementById('issue-book-select');
    const available = books.filter(b => !b.issued);

    if (available.length === 0) {
        select.innerHTML = `<option value="">No items available</option>`;
    } else {
        select.innerHTML = available.map(b => `<option value="${b.serial}">${b.title} (${b.serial})</option>`).join('');
    }

    const dateInput = document.getElementById('issue-date');
    const future = new Date();
    future.setDate(future.getDate() + 14);
    dateInput.value = future.toISOString().split('T')[0];
}

function handleIssue() {
    const serial = document.getElementById('issue-book-select').value;
    const dueDate = document.getElementById('issue-date').value;

    if (!serial || !dueDate) return alert("Please select an item and date.");

    const book = books.find(b => b.serial === serial);
    book.issued = true;

    issuedBooks.push({
        serial: book.serial,
        title: book.title,
        dueDate: new Date(dueDate)
    });

    alert(`Success: "${book.title}" issued.`);
    showSection('search');
}

// --- RETURN LOGIC ---
function populateReturnSelect() {
    const select = document.getElementById('return-book-select');
    if (issuedBooks.length === 0) {
        select.innerHTML = `<option value="">No items currently issued</option>`;
    } else {
        select.innerHTML = issuedBooks.map(b => `<option value="${b.serial}">${b.title} (${b.serial})</option>`).join('');
    }
    document.getElementById('actual-return-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('fine-panel').classList.add('hidden');
}

function calculateReturn() {
    const serial = document.getElementById('return-book-select').value;
    if (!serial) return alert("No item selected");

    const issuedItem = issuedBooks.find(b => b.serial === serial);
    const returnDate = new Date(document.getElementById('actual-return-date').value);

    const diffTime = returnDate - issuedItem.dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const fine = diffDays > 0 ? diffDays * 2 : 0;

    pendingReturnData = { serial, fine };

    const panel = document.getElementById('fine-panel');
    const amountText = document.getElementById('fine-amount');
    
    panel.classList.remove('hidden');
    amountText.innerText = fine > 0 ? `Total Fine: $${fine}.00` : "Status: On Time (No Fine)";
    
    // Auto-check the box if there is no fine
    document.getElementById('fine-paid').checked = (fine === 0);
}

function processReturn() {
    if (!pendingReturnData) return;

    const isPaid = document.getElementById('fine-paid').checked;

    if (pendingReturnData.fine > 0 && !isPaid) {
        return alert("Error: Outstanding fines must be cleared.");
    }

    // 1. Update the master books array
    const book = books.find(b => b.serial === pendingReturnData.serial);
    if (book) book.issued = false;

    // 2. Remove from issued list
    issuedBooks = issuedBooks.filter(b => b.serial !== pendingReturnData.serial);
    
    // 3. Reset state and UI
    pendingReturnData = null;
    alert("Return processed successfully.");
    showSection('search');
}
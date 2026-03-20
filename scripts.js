// --- CONFIGURATION ---
const PLAN_OPTIONS = ["6 Months", "1 Year", "2 Years", "Lifetime"];

// --- STATE MANAGEMENT ---
let currentUser = null;
let books = [
    { category: "Book", title: "The Great Gatsby", author: "F. Scott Fitzgerald", serial: "B100", issued: false },
    { category: "Movie", title: "Interstellar", author: "Christopher Nolan", serial: "M500", issued: false },
    { category: "Book", title: "Atomic Habits", author: "James Clear", serial: "B101", issued: false },
    { category: "Book", title: "1984", author: "George Orwell", serial: "B102", issued: false }
];
let issuedBooks = [];
let memberships = [
    { id: "LIB-1001", name: "Johnny Joestat", plan: "1 Year" },
    { id: "LIB-1002", name: "Zhu Yuan", plan: "2 Year" },
    { id: "LIB-1003", name: "Dan Heng", plan: "Lifetime" },
];
let pendingReturnData = null;

// --- AUTHENTICATION ---
function handleLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    
    if (user === 'admin' && pass === 'admin123') {
        currentUser = { name: 'Administrator', role: 'admin' };
    } else if (user === 'user' && pass === 'user123') {
        currentUser = { name: 'Standard User', role: 'user' };
    } else {
        return alert("Invalid Credentials");
    }

    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    document.getElementById('user-badge').innerText = currentUser.role === 'admin' ? 'A' : 'U';
    document.getElementById('user-name').innerText = currentUser.name;
    
    setupNavigation();
    showSection('search');
}

function logout() { location.reload(); }

// --- NAVIGATION ---
function setupNavigation() {
    const nav = document.getElementById('nav-menu');
    let menuItems = [
        { id: 'search', label: 'Inventory', icon: '📊' },
        { id: 'issue', label: 'Issue Item', icon: '📤' },
        { id: 'return', label: 'Return Item', icon: '📥' }
    ];
    
    if (currentUser.role === 'admin') {
        menuItems.push({ id: 'membership', label: 'Memberships', icon: '👥' });
        menuItems.push({ id: 'add-book', label: 'Add Item', icon: '➕' });
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
    
    document.getElementById(`section-${id}`).classList.remove('hidden');
    document.getElementById(`nav-${id}`).classList.add('active-link');
    
    document.getElementById('page-title').innerText = id.charAt(0).toUpperCase() + id.slice(1).replace('-', ' ');

    if (id === 'search') renderBookTable();
    if (id === 'issue') populateIssueSelect();
    if (id === 'return') populateReturnSelect();
    if (id === 'membership') {
        initMembershipForm();
        renderMembershipTable();
    }
}

// --- MEMBERSHIP LOGIC ---
function generateMemberID() {
    // Generate ID based on current length + 1001 to ensure uniqueness
    const nextNum = memberships.length > 0 
        ? parseInt(memberships[memberships.length - 1].id.split('-')[1]) + 1 
        : 1001;
    return `LIB-${nextNum}`;
}

function initMembershipForm() {
    // Set the auto-generated ID
    document.getElementById('mem-id').value = generateMemberID();
    
    // Populate Plan dropdown from the list function/constant
    const planSelect = document.getElementById('mem-plan');
    planSelect.innerHTML = PLAN_OPTIONS.map(plan => `<option value="${plan}">${plan}</option>`).join('');
}

function renderMembershipTable() {
    const tbody = document.getElementById('member-table-body');
    if (memberships.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">No active memberships.</td></tr>`;
        return;
    }
    tbody.innerHTML = memberships.map((m, index) => `
        <tr class="text-sm">
            <td class="px-6 py-4 font-mono text-blue-600 font-bold">${m.id}</td>
            <td class="px-6 py-4 font-bold text-slate-900">${m.name}</td>
            <td class="px-6 py-4"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold">${m.plan}</span></td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="cancelMembership(${index})" class="text-red-600 hover:underline text-xs font-bold">Remove</button>
            </td>
        </tr>
    `).join('');
}

function handleSaveMembership() {
    const id = document.getElementById('mem-id').value;
    const name = document.getElementById('mem-name').value;
    const plan = document.getElementById('mem-plan').value;
    
    if (!name) return alert("Member name is mandatory");
    
    memberships.push({ id, name, plan });
    
    // Reset fields
    document.getElementById('mem-name').value = "";
    initMembershipForm(); // Generate next ID
    renderMembershipTable();
    alert(`Membership created for ${name} with ID: ${id}`);
}

function cancelMembership(index) {
    if (confirm(`Remove member ${memberships[index].id}?`)) {
        memberships.splice(index, 1);
        renderMembershipTable();
        initMembershipForm(); // Update ID field in case it was empty
    }
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

// --- ISSUE & RETURN LOGIC ---
function populateIssueSelect() {
    const select = document.getElementById('issue-book-select');
    const avail = books.filter(b => !b.issued);
    select.innerHTML = avail.map(b => `<option value="${b.serial}">${b.title}</option>`).join('');
    document.getElementById('issue-date').value = new Date(Date.now() + 12096e5).toISOString().split('T')[0];
}

function handleIssue() {
    const serial = document.getElementById('issue-book-select').value;
    if (!serial) return alert("No books available");
    
    const book = books.find(b => b.serial === serial);
    book.issued = true;
    issuedBooks.push({ 
        serial: book.serial, 
        title: book.title, 
        dueDate: new Date(document.getElementById('issue-date').value) 
    });
    alert("Book Issued!");
    showSection('search');
}

function populateReturnSelect() {
    const select = document.getElementById('return-book-select');
    select.innerHTML = issuedBooks.map(b => `<option value="${b.serial}">${b.title}</option>`).join('');
    document.getElementById('actual-return-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('fine-panel').classList.add('hidden');
}

function calculateReturn() {
    const serial = document.getElementById('return-book-select').value;
    if (!serial) return alert("No items to return");
    
    const item = issuedBooks.find(b => b.serial === serial);
    const returnDate = new Date(document.getElementById('actual-return-date').value);
    const delay = Math.ceil((returnDate - item.dueDate) / (1000 * 60 * 60 * 24));
    
    const fine = delay > 0 ? delay * 5 : 0;
    pendingReturnData = { serial, fine };
    
    document.getElementById('fine-panel').classList.remove('hidden');
    document.getElementById('fine-amount').innerText = `Fine: $${fine}.00`;
    document.getElementById('fine-paid').checked = fine === 0;
}

function processReturn() {
    if (pendingReturnData.fine > 0 && !document.getElementById('fine-paid').checked) {
        return alert("Please confirm fine payment first");
    }
    const book = books.find(b => b.serial === pendingReturnData.serial);
    book.issued = false;
    issuedBooks = issuedBooks.filter(b => b.serial !== pendingReturnData.serial);
    alert("Book Returned!");
    showSection('search');
}
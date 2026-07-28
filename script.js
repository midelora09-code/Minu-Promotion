/* AUDIO ENGINE WITH INITIAL MOBILE UNLOCK */
let soundEnabled = true;
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudioContext() {
    if (!audioCtx) { audioCtx = new AudioCtx(); }
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
}

// User interaction event listeners for unlocking mobile web audio
document.addEventListener('touchstart', initAudioContext, { once: true });
document.addEventListener('click', initAudioContext, { once: true });

function playSound(type) {
    if (!soundEnabled) return;
    try {
        initAudioContext();
        if (!audioCtx) return;
        
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'success') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'delete') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) { console.log('Audio Error:', e); }
}

/* RIPPLE EFFECT ON CLICK */
document.addEventListener('click', function (e) {
    const target = e.target.closest('.ripple');
    if (target) {
        playSound('click');
        const rect = target.getBoundingClientRect();
        const circle = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;

        circle.style.width = circle.style.height = `${diameter}px`;
        circle.style.left = `${e.clientX - rect.left - radius}px`;
        circle.style.top = `${e.clientY - rect.top - radius}px`;
        circle.classList.add('ripple-effect');

        const ripple = target.getElementsByClassName('ripple-effect')[0];
        if (ripple) { ripple.remove(); }
        target.appendChild(circle);
    }
});

/* DATA STORE & INITIALIZATION */
let clients = JSON.parse(localStorage.getItem('prostudio_clients')) || [];
let projects = JSON.parse(localStorage.getItem('prostudio_projects')) || [];
let isInitialized = localStorage.getItem('prostudio_initialized');

if (!isInitialized) {
    clients = [{ id: 'c1', name: 'Aman Verma', phone: '9876543210', business: 'FitX Gym', notes: 'Fitness reels' }];
    projects = [{ id: 'p1', clientId: 'c1', title: 'Gym Commercial Ad', type: 'Video Editing', priority: 'High', status: 'Active', deadline: getFutureDate(3), payment: 6000, investment: 800, paidStatus: 'Paid' }];
    localStorage.setItem('prostudio_initialized', 'true');
    saveToStorage();
}

function loadFromStorage() {
    clients = JSON.parse(localStorage.getItem('prostudio_clients')) || [];
    projects = JSON.parse(localStorage.getItem('prostudio_projects')) || [];
}

function getFutureDate(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function saveToStorage() {
    localStorage.setItem('prostudio_clients', JSON.stringify(clients));
    localStorage.setItem('prostudio_projects', JSON.stringify(projects));
    refreshUI();
}

window.addEventListener('pageshow', function () {
    loadFromStorage();
    refreshUI();
});

/* NAVIGATION & SIDEBAR */
function switchTab(tabId, element) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    if(element) element.classList.add('active');

    const headings = { dashboard: 'Dashboard', clients: 'Clients Directory', projects: 'Project Hub', tasks: 'Tasks Tracker', payments: 'Payment Dues', settings: 'Settings' };
    document.getElementById('pageHeading').innerText = headings[tabId] || 'Dashboard';

    if (window.innerWidth <= 768) { 
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('open')) toggleSidebar(); 
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('active');
}

/* MODAL LOGIC */
function openModal(modalId) {
    if(modalId === 'projectModal') {
        populateClientDropdown();
        if(clients.length === 0) { alert('Pehle ek Client add karein!'); return; }
    }
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if(modalId === 'clientModal') {
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        document.getElementById('clientModalTitle').innerText = 'Add New Client';
    }
    if(modalId === 'projectModal') {
        document.getElementById('projectForm').reset();
        document.getElementById('projectId').value = '';
        document.getElementById('projectModalTitle').innerText = 'Add New Project';
    }
}

function populateClientDropdown() {
    const select = document.getElementById('projectClientId');
    select.innerHTML = clients.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.business) || 'N/A'})</option>`).join('');
}

/* CLIENT MANAGEMENT */
function saveClient(e) {
    e.preventDefault();
    playSound('success');
    const id = document.getElementById('clientId').value || 'c_' + Date.now();
    const name = document.getElementById('clientName').value.trim();
    const phone = document.getElementById('clientPhone').value.trim();
    const business = document.getElementById('clientBusiness').value.trim();
    const notes = document.getElementById('clientNotes').value.trim();

    const index = clients.findIndex(c => c.id === id);
    if(index > -1) clients[index] = { id, name, phone, business, notes };
    else clients.push({ id, name, phone, business, notes });

    saveToStorage();
    closeModal('clientModal');
}

function editClient(id) {
    const c = clients.find(cl => cl.id === id);
    if(!c) return;
    document.getElementById('clientId').value = c.id;
    document.getElementById('clientName').value = c.name;
    document.getElementById('clientPhone').value = c.phone;
    document.getElementById('clientBusiness').value = c.business;
    document.getElementById('clientNotes').value = c.notes;
    
    document.getElementById('clientModalTitle').innerText = 'Edit Client';
    openModal('clientModal');
}

function deleteClient(id) {
    playSound('delete');
    if(confirm('Client delete karein? Iske saare projects bhi delete ho jayenge!')) {
        clients = clients.filter(c => c.id !== id);
        projects = projects.filter(p => p.clientId !== id);
        saveToStorage();
    }
}

function openWhatsApp(phone) {
    if(!phone) { alert("Phone number missing!"); return; }
    const clean = phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${clean.length === 10 ? '91' + clean : clean}`, '_blank');
}

function renderClients() {
    const tbody = document.getElementById('clientsTableBody');
    const search = document.getElementById('clientSearch').value.toLowerCase();
    const filtered = clients.filter(c => c.name.toLowerCase().includes(search) || (c.business && c.business.toLowerCase().includes(search)));

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td data-label="Name"><strong>${escapeHtml(c.name)}</strong></td>
            <td data-label="Phone">${escapeHtml(c.phone || '-')}</td>
            <td data-label="Business">${escapeHtml(c.business || '-')}</td>
            <td data-label="Notes">${escapeHtml(c.notes || '-')}</td>
            <td data-label="Actions">
                <div class="action-btns">
                    ${c.phone ? `<button class="btn-icon btn-whatsapp ripple" onclick="openWhatsApp('${c.phone}')" title="WhatsApp Chat"><i class="fa-brands fa-whatsapp"></i></button>` : ''}
                    <button class="btn-icon ripple" onclick="editClient('${c.id}')"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn-icon ripple" style="color:var(--danger)" onclick="deleteClient('${c.id}')"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

/* PROJECT MANAGEMENT */
function saveProject(e) {
    e.preventDefault();
    playSound('success');
    const id = document.getElementById('projectId').value || 'p_' + Date.now();
    const clientId = document.getElementById('projectClientId').value;
    const title = document.getElementById('projectTitle').value.trim();
    const type = document.getElementById('projectType').value;
    const priority = document.getElementById('projectPriority').value;
    const status = document.getElementById('projectStatus').value;
    const deadline = document.getElementById('projectDeadline').value;
    const payment = parseFloat(document.getElementById('projectPayment').value) || 0;
    const investment = parseFloat(document.getElementById('projectInvestment').value) || 0;
    const paidStatus = document.getElementById('projectPaidStatus').value;

    const index = projects.findIndex(p => p.id === id);
    if(index > -1) projects[index] = { id, clientId, title, type, priority, status, deadline, payment, investment, paidStatus };
    else projects.push({ id, clientId, title, type, priority, status, deadline, payment, investment, paidStatus });

    saveToStorage();
    closeModal('projectModal');
}

function editProject(id) {
    const p = projects.find(proj => proj.id === id);
    if(!p) return;

    populateClientDropdown();
    document.getElementById('projectId').value = p.id;
    document.getElementById('projectClientId').value = p.clientId;
    document.getElementById('projectTitle').value = p.title;
    document.getElementById('projectType').value = p.type;
    document.getElementById('projectPriority').value = p.priority || 'Medium';
    document.getElementById('projectStatus').value = p.status;
    document.getElementById('projectDeadline').value = p.deadline;
    document.getElementById('projectPayment').value = p.payment;
    document.getElementById('projectInvestment').value = p.investment;
    document.getElementById('projectPaidStatus').value = p.paidStatus;

    document.getElementById('projectModalTitle').innerText = 'Edit Project';
    openModal('projectModal');
}

function deleteProject(id) {
    playSound('delete');
    if(confirm('Project delete karein?')) {
        projects = projects.filter(p => p.id !== id);
        saveToStorage();
    }
}

function togglePaymentStatus(id) {
    playSound('success');
    const p = projects.find(proj => proj.id === id);
    if(p) {
        p.paidStatus = p.paidStatus === 'Paid' ? 'Pending' : 'Paid';
        saveToStorage();
    }
}

function renderProjects() {
    const tbody = document.getElementById('projectsTableBody');
    const search = document.getElementById('projectSearch').value.toLowerCase().trim();
    const statusFilter = document.getElementById('statusFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;

    const filtered = projects.filter(p => {
        const client = clients.find(c => c.id === p.clientId);
        const clientName = client ? client.name.toLowerCase() : '';
        const projectTitle = p.title.toLowerCase();

        const matchesSearch = projectTitle.includes(search) || clientName.includes(search);
        const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || p.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    tbody.innerHTML = filtered.map(p => {
        const client = clients.find(c => c.id === p.clientId);
        const profit = p.payment - p.investment;
        const statusClass = p.status === 'Completed' ? 'status-completed' : (p.status === 'Active' ? 'status-active' : 'status-pending');

        return `
            <tr>
                <td data-label="Project"><strong>${escapeHtml(p.title)}</strong></td>
                <td data-label="Client">${client ? escapeHtml(client.name) : 'Unknown'}</td>
                <td data-label="Priority"><span class="priority-badge priority-${p.priority || 'Medium'}">${p.priority || 'Medium'}</span></td>
                <td data-label="Type"><span class="type-badge">${p.type}</span></td>
                <td data-label="Deadline">${p.deadline}</td>
                <td data-label="Payment">₹${p.payment.toLocaleString()}</td>
                <td data-label="Investment">₹${p.investment.toLocaleString()}</td>
                <td data-label="Profit" style="color: ${profit >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">₹${profit.toLocaleString()}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${p.status}</span></td>
                <td data-label="Actions">
                    <div class="action-btns">
                        <button class="btn-icon ripple" onclick="editProject('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon ripple" style="color:var(--danger)" onclick="deleteProject('${p.id}')"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/* REFRESH UI & CHARTS */
let financeChartObj = null;
let typeChartObj = null;

function refreshUI() {
    renderDashboard();
    renderClients();
    renderProjects();
    renderTasks();
    renderPayments();
    checkNotifications();
    renderCharts();
}

function renderCharts() {
    const totalIncome = projects.reduce((acc, p) => acc + p.payment, 0);
    const totalInvestment = projects.reduce((acc, p) => acc + p.investment, 0);
    const totalProfit = totalIncome - totalInvestment;

    const ctx1 = document.getElementById('financeChart').getContext('2d');
    if(financeChartObj) financeChartObj.destroy();
    financeChartObj = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: ['Revenue', 'Cost', 'Net Profit'],
            datasets: [{
                data: [totalIncome, totalInvestment, Math.max(0, totalProfit)],
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }, x: { ticks: { color: '#94a3b8' } } }
        }
    });

    const editingCount = projects.filter(p => p.type === 'Video Editing').length;
    const promoCount = projects.filter(p => p.type === 'Promotion').length;
    const bothCount = projects.filter(p => p.type === 'Both').length;

    const ctx2 = document.getElementById('typeChart').getContext('2d');
    if(typeChartObj) typeChartObj.destroy();
    typeChartObj = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Editing', 'Promo', 'Both'],
            datasets: [{
                data: [editingCount, promoCount, bothCount],
                backgroundColor: ['#8b5cf6', '#ec4899', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: { 
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8' } } } 
        }
    });
}

function renderDashboard() {
    const totalIncome = projects.reduce((acc, p) => acc + p.payment, 0);
    const totalInvestment = projects.reduce((acc, p) => acc + p.investment, 0);
    const totalProfit = totalIncome - totalInvestment;

    document.getElementById('statClients').innerText = clients.length;
    document.getElementById('statIncome').innerText = '₹' + totalIncome.toLocaleString();
    document.getElementById('statInvestment').innerText = '₹' + totalInvestment.toLocaleString();
    document.getElementById('statProfit').innerText = '₹' + totalProfit.toLocaleString();

    const recent = [...projects].reverse().slice(0, 4);
    document.getElementById('recentProjectsTable').innerHTML = recent.map(p => {
        const client = clients.find(c => c.id === p.clientId);
        const statusClass = p.status === 'Completed' ? 'status-completed' : (p.status === 'Active' ? 'status-active' : 'status-pending');
        return `
            <tr>
                <td data-label="Project"><strong>${escapeHtml(p.title)}</strong></td>
                <td data-label="Client">${client ? escapeHtml(client.name) : '-'}</td>
                <td data-label="Type"><span class="type-badge">${p.type}</span></td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${p.status}</span></td>
                <td data-label="Amount">₹${p.payment.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

function renderTasks() {
    const editPending = projects.filter(p => p.status !== 'Completed' && (p.type === 'Video Editing' || p.type === 'Both')).length;
    const promoPending = projects.filter(p => p.status !== 'Completed' && (p.type === 'Promotion' || p.type === 'Both')).length;
    const completed = projects.filter(p => p.status === 'Completed').length;

    document.getElementById('taskEditPending').innerText = editPending;
    document.getElementById('taskPromoPending').innerText = promoPending;

    const total = projects.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    document.getElementById('completionRateText').innerText = rate + '%';
    document.getElementById('completionRateBar').style.width = rate + '%';

    document.getElementById('taskTableBody').innerHTML = projects.map(p => {
        const statusClass = p.status === 'Completed' ? 'status-completed' : (p.status === 'Active' ? 'status-active' : 'status-pending');
        return `
            <tr>
                <td data-label="Project"><strong>${escapeHtml(p.title)}</strong></td>
                <td data-label="Priority"><span class="priority-badge priority-${p.priority || 'Medium'}">${p.priority || 'Medium'}</span></td>
                <td data-label="Type"><span class="type-badge">${p.type}</span></td>
                <td data-label="Deadline">${p.deadline}</td>
                <td data-label="Status"><span class="status-badge ${statusClass}">${p.status}</span></td>
            </tr>
        `;
    }).join('');
}

function renderPayments() {
    const total = projects.reduce((acc, p) => acc + p.payment, 0);
    const received = projects.filter(p => p.paidStatus === 'Paid').reduce((acc, p) => acc + p.payment, 0);
    const pending = total - received;

    document.getElementById('payTotalEarnings').innerText = '₹' + total.toLocaleString();
    document.getElementById('payReceived').innerText = '₹' + received.toLocaleString();
    document.getElementById('payPending').innerText = '₹' + pending.toLocaleString();

    document.getElementById('paymentsTableBody').innerHTML = projects.map(p => {
        const client = clients.find(c => c.id === p.clientId);
        const isPaid = p.paidStatus === 'Paid';
        return `
            <tr>
                <td data-label="Project"><strong>${escapeHtml(p.title)}</strong></td>
                <td data-label="Client">${client ? escapeHtml(client.name) : '-'}</td>
                <td data-label="Amount">₹${p.payment.toLocaleString()}</td>
                <td data-label="Status"><span class="status-badge ${isPaid ? 'status-completed' : 'status-pending'}">${isPaid ? 'Paid' : 'Unpaid'}</span></td>
                <td data-label="Action">
                    <button class="btn-primary ripple" style="padding: 6px 12px; font-size: 0.75rem;" onclick="togglePaymentStatus('${p.id}')">
                        Mark ${isPaid ? 'Unpaid' : 'Paid'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function checkNotifications() {
    const today = new Date().toISOString().split('T')[0];
    const notifs = [];

    projects.forEach(p => {
        if(p.status !== 'Completed' && p.deadline <= today) {
            notifs.push(`Overdue/Deadline today for <strong>${escapeHtml(p.title)}</strong>!`);
        }
    });

    document.getElementById('notifBadge').innerText = notifs.length;
    document.getElementById('notifList').innerHTML = notifs.length ? notifs.map(n => `<div class="notif-item">${n}</div>`).join('') : '<div class="notif-item">No urgent alerts.</div>';
}

function toggleNotifs() {
    const panel = document.getElementById('notifPanel');
    panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
}

function exportData() {
    playSound('success');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ clients, projects }, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `prostudio_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const parsed = JSON.parse(evt.target.result);
            if (parsed.clients && parsed.projects) {
                clients = parsed.clients;
                projects = parsed.projects;
                saveToStorage();
                playSound('success');
                alert('Backup restored successfully!');
            }
        } catch(err) { alert('Invalid Backup File!'); }
    };
    reader.readAsText(file);
}

function clearAllDataDoubleConfirm() {
    playSound('delete');
    const firstConfirm = confirm("⚠️ PERMISSION 1: Kya aap sach me poora data clear karna chahte hain?");
    if (firstConfirm) {
        const secondConfirm = confirm("⚠️ PERMISSION 2 (FINAL): Saara data permanently erase ho jayega. Continue?");
        if (secondConfirm) {
            playSound('delete');
            localStorage.removeItem('prostudio_clients');
            localStorage.removeItem('prostudio_projects');
            localStorage.setItem('prostudio_initialized', 'true');
            clients = [];
            projects = [];
            saveToStorage();
            refreshUI();
            alert("Poora data clear kar diya gaya hai!");
        }
    }
}

function escapeHtml(str) {
    return String(str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

refreshUI();

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, getDoc, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = './index.html';
    }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
});

// UI UTILITIES
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `background:${type==='error'?'rgba(239,68,68,.15)':'rgba(16,185,129,.15)'};border:1px solid ${type==='error'?'rgba(239,68,68,.4)':'rgba(16,185,129,.4)'};color:${type==='error'?'#fca5a5':'#6ee7b7'};padding:.7rem 1rem;border-radius:10px;font-size:.82rem;pointer-events:auto;box-shadow:0 8px 24px rgba(0,0,0,.4);display:flex;align-items:center;gap:.5rem;backdrop-filter:blur(12px);min-width:200px;`;
    toast.textContent = (type==='error'?'✕ ':'✓ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const confirmModal = document.getElementById('confirmModal');
let confirmPromise = null;

function showConfirm(title, message) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    confirmModal.classList.add('show');

    return new Promise((resolve) => {
        confirmPromise = resolve;
    });
}

document.getElementById('confirmCancel').onclick = () => {
    confirmModal.classList.remove('show');
    if (confirmPromise) confirmPromise(false);
};

document.getElementById('confirmProceed').onclick = () => {
    confirmModal.classList.remove('show');
    if (confirmPromise) confirmPromise(true);
};

// Get lab ID from URL
const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('id');

if (!labId) {
    showToast('Invalid lab ID', 'error');
    setTimeout(() => window.location.href = './dashboard.html', 1000);
}

// MODALS LOGIC
const computerModal = document.getElementById('computerModal');
const editComputerModal = document.getElementById('editComputerModal');
const reviewsModal = document.getElementById('reviewsModal');

// Modal Open/Close Handlers
document.getElementById('openAddComputerModal')?.addEventListener('click', () => {
    computerModal.classList.add('show');
});

if (urlParams.get('addComputer') === '1') {
    setTimeout(() => {
        computerModal.classList.add('show');
        // Remove the query parameter so refreshing doesn't re-open it
        window.history.replaceState({}, document.title, window.location.pathname + "?id=" + labId);
    }, 100);
}

document.getElementById('closeComputerModal')?.addEventListener('click', () => {
    computerModal.classList.remove('show');
});

document.getElementById('closeEditComputerModal')?.addEventListener('click', () => {
    editComputerModal.classList.remove('show');
});

document.getElementById('closeReviewsModal')?.addEventListener('click', () => {
    reviewsModal.classList.remove('show');
});

// Close modals on outside click
window.addEventListener('click', (e) => {
    if (e.target === computerModal) computerModal.classList.remove('show');
    if (e.target === editComputerModal) editComputerModal.classList.remove('show');
    if (e.target === reviewsModal) reviewsModal.classList.remove('show');
});

// EXPORT TO WINDOW (TOP LEVEL)
window.showReviews = async (computerId) => {
    const reviewsList = document.getElementById('modalReviewsList');
    reviewsList.innerHTML = '<p class="text-center text-sm text-muted-foreground animate-pulse py-8">Loading history...</p>';
    reviewsModal.classList.add('show');

    try {
        const q = query(collection(db, 'reviews'), where('computerId', '==', computerId));
        const snap = await getDocs(q);
        reviewsList.innerHTML = '';

        if (snap.empty) {
            reviewsList.innerHTML = '<div class="text-center py-8 text-muted-foreground text-sm border border-dashed rounded-lg px-4">No report history found for this system.</div>';
            return;
        }

        const reviewsData = snap.docs.map(d => d.data());
        reviewsData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        reviewsData.forEach(r => {
            const isWorking = r.status === 'Working';
            reviewsList.innerHTML += `
                <div style="padding:.875rem;border-radius:10px;border:1px solid ${isWorking?'rgba(16,185,129,.2)':'rgba(239,68,68,.2)'};background:${isWorking?'rgba(16,185,129,.05)':'rgba(239,68,68,.05)'};margin-bottom:.5rem;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.4rem;">
                        <span style="display:inline-flex;align-items:center;gap:.3rem;padding:.2rem .6rem;border-radius:999px;font-size:.7rem;font-weight:600;background:${isWorking?'rgba(16,185,129,.15)':'rgba(239,68,68,.15)'};color:${isWorking?'#34d399':'#f87171'};">
                            ${isWorking ? '✓ Working' : '✕ Issue Reported'}
                        </span>
                        <span style="font-size:.7rem;color:var(--muted);">
                            ${new Date(r.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                    </div>
                    ${r.comment ? `<p style="margin:.4rem 0 0;font-size:.8rem;color:#94a3b8;line-height:1.5;">${r.comment}</p>` : ''}
                </div>
            `;
        });
    } catch (e) {
        console.error('Reviews error:', e);
        showToast('Error loading reviews', 'error');
    }
};

window.openEditComputer = (id, num, details, pass, status) => {
    document.getElementById('editCompId').value = id;
    document.getElementById('editCompNumber').value = num;
    document.getElementById('editCompDetails').value = details;
    document.getElementById('editCompPassword').value = pass;
    updateCustomDropdown('editCompStatusDropdown', status || 'Working');
    editComputerModal.classList.add('show');
};

// CUSTOM DROPDOWN UTILITY
function initCustomDropdown(id) {
    const container = document.getElementById(id);
    if (!container) return;

    const btn = container.querySelector('button');
    const options = container.querySelector('.dropdown-options');
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const labelSpan = container.querySelector('.selected-value');

    btn.onclick = (e) => {
        e.stopPropagation();
        const isOpen = options.classList.contains('open');
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-options').forEach(el => el.classList.remove('open'));
        if (!isOpen) options.classList.add('open');
    };

    options.querySelectorAll('button, .dropdown-option').forEach(opt => {
        opt.onclick = () => {
            const val = opt.getAttribute('data-value');
            hiddenInput.value = val;
            labelSpan.textContent = opt.textContent.trim();
            options.classList.remove('open');
        };
    });
}

function updateCustomDropdown(id, value) {
    const container = document.getElementById(id);
    if (!container) return;
    const hiddenInput = container.querySelector('input[type="hidden"]');
    const labelSpan = container.querySelector('.selected-value');
    hiddenInput.value = value;
    labelSpan.textContent = value;
}

document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-options').forEach(el => el.classList.remove('open'));
});

initCustomDropdown('computerStatusDropdown');
initCustomDropdown('editCompStatusDropdown');

// LOAD LAB DETAILS
async function loadLabDetails() {
    try {
        const labDoc = await getDoc(doc(db, 'labs', labId));
        if (labDoc.exists()) {
            const labData = labDoc.data();
            document.getElementById('labTitle').innerHTML = `
                <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                    </path>
                </svg>
                <span class="truncate">${labData.name}</span>
            `;
            document.getElementById('sidebarLabName').textContent = labData.name;
        } else {
            showToast('Lab not found', 'error');
            setTimeout(() => window.location.href = './dashboard.html', 1000);
        }
    } catch (error) {
        console.error('Error loading lab:', error);
        showToast('Error loading lab details', 'error');
    }
}

// ADD COMPUTER
document.getElementById('addComputerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = document.getElementById('computerNumber').value;
    const details = document.getElementById('computerDetails').value;
    const password = document.getElementById('computerPassword').value;
    const status = document.getElementById('computerStatus').value;
    
    try {
        await addDoc(collection(db, 'computers'), {
            labId: labId,
            number: parseInt(number),
            details: details,
            password: password,
            status: status,
            createdAt: new Date().toISOString()
        });
        
        showToast('Computer added successfully');
        document.getElementById('addComputerForm').reset();
        computerModal.classList.remove('show');
        loadComputers();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// EDIT COMPUTER
document.getElementById('editComputerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editCompId').value;
    const number = document.getElementById('editCompNumber').value;
    const details = document.getElementById('editCompDetails').value;
    const password = document.getElementById('editCompPassword').value;
    const status = document.getElementById('editCompStatus').value;

    try {
        await updateDoc(doc(db, 'computers', id), {
            number: parseInt(number),
            details: details,
            password: password,
            status: status
        });

        showToast('Computer updated');
        editComputerModal.classList.remove('show');
        loadComputers();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// LOAD COMPUTERS
async function loadComputers() {
    const list = document.getElementById('computersList');
    list.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:3rem;color:var(--muted);gap:.75rem;"><svg style="animation:spin 1s linear infinite;width:24px;height:24px;flex-shrink:0;" fill="none" viewBox="0 0 24 24"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Loading computers...</span></div>';

    try {
        const q = query(collection(db, 'computers'), where('labId', '==', labId));
        const snap = await getDocs(q);
        list.innerHTML = '';

        if (snap.empty) {
            list.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem;color:var(--muted);gap:.75rem;border:2px dashed var(--border);border-radius:12px;"><svg width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity:.3"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg><span style="font-size:.9rem;font-weight:600;">No computers added yet.</span><span style="font-size:.8rem;">Click "+ Computer" to add one.</span></div>';
            return;
        }

        snap.forEach((doc) => {
            const comp = doc.data();
            const isWorking = comp.status !== 'Not Working';

            const card = `
                <div class="computer-card">
                    <div class="card-header" onclick="window.toggleCardDetails('${doc.id}')">
                        <div class="comp-num">#${comp.number}</div>
                        <div class="comp-info">
                            <div class="comp-name">System ${comp.number}</div>
                            <div class="comp-detail">${comp.details}</div>
                        </div>
                        <div class="status-dot ${isWorking ? 'status-working' : 'status-not-working'}" style="margin-right:.5rem;"></div>
                        <svg id="icon-${doc.id}" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="transition:transform .3s;flex-shrink:0;color:var(--muted);"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>
                    </div>
                    <div class="expandable-content" id="details-${doc.id}">
                        <div class="card-body">
                            <div class="card-body-inner">
                                <div class="info-row"><span class="info-label">Status</span><span class="badge ${isWorking ? 'badge-green' : 'badge-red'}">${comp.status}</span></div>
                                <div class="info-row"><span class="info-label">Password</span><code style="font-size:.82rem;font-weight:700;color:#818cf8;">${comp.password}</code></div>
                                <div class="info-row"><span class="info-label">Details</span><span style="font-size:.8rem;">${comp.details}</span></div>
                                <div class="card-actions">
                                    <button onclick="window.showComputerDetails('${doc.id}')" class="btn btn-primary" style="font-size:.75rem;padding:.35rem .7rem;">
                                        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                                        QR Code
                                    </button>
                                    <button onclick="toggleStatus('${doc.id}', '${comp.status}')" class="btn btn-ghost" style="font-size:.75rem;padding:.35rem .7rem;">Toggle Status</button>
                                    <button onclick="window.showReviews('${doc.id}')" class="btn btn-ghost" style="font-size:.75rem;padding:.35rem .7rem;">Reviews</button>
                                    <button onclick="window.openEditComputer('${doc.id}', ${comp.number}, '${comp.details.replace(/'/g,"\\'")}', '${comp.password}', '${comp.status}')" class="btn btn-ghost" style="font-size:.75rem;padding:.35rem .7rem;">Edit</button>
                                    <button onclick="window.deleteComputer('${doc.id}')" class="btn" style="font-size:.75rem;padding:.35rem .7rem;background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);">Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            list.innerHTML += card;
        });

        // Store computer data for modal use
        snap.forEach((doc) => {
            window.computerData = window.computerData || {};
            window.computerData[doc.id] = doc.data();
        });
    } catch (e) {
        showToast(e.message, 'error');
    }
}


// OTHER FUNCTIONS
// CARD LOGIC - Define before loadComputers so inline onclick works
window.toggleCardDetails = (id) => {
    const details = document.getElementById(`details-${id}`);
    const icon = document.getElementById(`icon-${id}`);
    const card = details.closest('.computer-card');
    
    // Check if currently expanded
    const isExpanded = details.style.maxHeight && details.style.maxHeight !== '0px';

    // Close all other cards first for accordion effect
    document.querySelectorAll('.expandable-content').forEach(el => {
        if (el.id !== `details-${id}`) {
            el.style.maxHeight = '0px';
            const otherIcon = document.getElementById(`icon-${el.id.split('-')[1]}`);
            if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            el.closest('.computer-card')?.classList.remove('expanded');
        }
    });

    // Toggle current card with smooth animation
    if (isExpanded) {
        // Collapse
        details.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
        card?.classList.remove('expanded');
    } else {
        // Expand - set maxHeight to scrollHeight for smooth transition
        details.style.maxHeight = details.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
        card?.classList.add('expanded');
        
        // Scroll card into view smoothly
        setTimeout(() => {
            card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    }
};

window.toggleStatus = async (id, current) => {
    const next = current === 'Working' ? 'Not Working' : 'Working';
    try {
        await updateDoc(doc(db, 'computers', id), { status: next });
        showToast(`System marked as ${next}`);
        loadComputers();
    } catch (e) {
        showToast('Status update failed', 'error');
    }
};

window.downloadQR = (id, num) => {
    const canvas = document.getElementById(`qr-${id}`).querySelector('canvas');
    if (canvas) {
        const a = document.createElement('a');
        a.download = `PC_${num}_QR.png`;
        a.href = canvas.toDataURL();
        a.click();
    }
};

window.downloadBulkQRs = async () => {
    showToast('Starting bulk download...');
    const q = query(collection(db, 'computers'), where('labId', '==', labId));
    const snap = await getDocs(q);
    snap.forEach((d, i) => setTimeout(() => window.downloadQR(d.id, d.data().number), i * 500));
};

document.getElementById('bulkDownloadBtn').onclick = window.downloadBulkQRs;

window.deleteComputer = async (id) => {
    if (await showConfirm('Delete Computer', 'Are you sure you want to remove this system? All related reviews will remain in history but the system card will be gone.')) {
        try {
            await deleteDoc(doc(db, 'computers', id));
            showToast('Computer removed');
            loadComputers();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }
};

// INITIAL
loadLabDetails();
loadComputers();

// Password Toggles
document.getElementById('toggleCompPassword')?.addEventListener('click', function () {
    const input = document.getElementById('computerPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    this.innerHTML = type === 'password'
        ? `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`
        : `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
});

document.getElementById('toggleEditCompPassword')?.addEventListener('click', function () {
    const input = document.getElementById('editCompPassword');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    this.innerHTML = type === 'password'
        ? `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`
        : `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
});

// Sidebar Logic
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeSidebarBtn = document.getElementById('closeSidebar');

function toggleSidebar(show) {
    if (show) {
        sidebarOverlay.classList.add('show');
        setTimeout(() => {
            sidebarOverlay.classList.replace('opacity-0', 'opacity-100');
            sidebar.classList.replace('-translate-x-full', 'translate-x-0');
        }, 10);
    } else {
        sidebarOverlay.classList.replace('opacity-100', 'opacity-0');
        sidebar.classList.replace('translate-x-0', '-translate-x-full');
        setTimeout(() => {
            sidebarOverlay.classList.remove('show');
        }, 300);
    }
}

mobileMenuBtn?.addEventListener('click', () => toggleSidebar(true));
closeSidebarBtn?.addEventListener('click', () => toggleSidebar(false));
sidebarOverlay?.addEventListener('click', () => toggleSidebar(false));

// Sidebar Actions
document.getElementById('sidebarAddComp')?.addEventListener('click', () => {
    toggleSidebar(false);
    computerModal.classList.add('show');
});

document.getElementById('sidebarBulkQR')?.addEventListener('click', () => {
    toggleSidebar(false);
    window.downloadBulkQRs();
});




// QR Details Modal
const qrDetailsModal = document.getElementById('qrDetailsModal');
let currentQRComputerId = null;

document.getElementById('closeQRModal')?.addEventListener('click', () => {
    qrDetailsModal.classList.remove('show');
});

window.addEventListener('click', (e) => {
    if (e.target === qrDetailsModal) qrDetailsModal.classList.remove('show');
});

window.showComputerDetails = (computerId) => {
    currentQRComputerId = computerId;
    const comp = window.computerData[computerId];
    if (!comp) return;

    const content = document.getElementById('qrModalContent');
    content.innerHTML = `
        <div class="text-center">
            <div id="modal-qr-${computerId}" class="inline-block bg-white p-4 rounded-lg border-2 border-border"></div>
        </div>
        <div class="text-sm text-muted-foreground text-center">
            <p>Scan this QR code to access computer details</p>
        </div>
    `;

    qrDetailsModal.classList.add('show');

    setTimeout(() => {
        const qDiv = document.getElementById(`modal-qr-${computerId}`);
        if (qDiv) {
            qDiv.innerHTML = '';
            new QRCode(qDiv, { 
                text: `${window.location.origin}/computer.html?id=${computerId}`, 
                width: 200, 
                height: 200 
            });
        }
    }, 100);
};

document.getElementById('downloadQRFromModal')?.addEventListener('click', () => {
    if (!currentQRComputerId) return;
    const comp = window.computerData[currentQRComputerId];
    const canvas = document.getElementById(`modal-qr-${currentQRComputerId}`)?.querySelector('canvas');
    if (canvas) {
        const a = document.createElement('a');
        a.download = `PC_${comp.number}_QR.png`;
        a.href = canvas.toDataURL();
        a.click();
        showToast('QR Code downloaded');
    }
});


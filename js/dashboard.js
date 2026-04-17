import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
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
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = './index.html';
});

// UI UTILITIES
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'err' : 'ok');
    toast.textContent = (type === 'error' ? '✕ ' : '✓ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const confirmModal = document.getElementById('confirmModal');
let confirmPromise = null;

function showConfirm(title, message) {
    document.getElementById('confirmTitle').textContent = title;
    const msgEl = document.getElementById('confirmMessage') || document.getElementById('confirmMsg');
    if(msgEl) msgEl.textContent = message;
    confirmModal.classList.add('show');

    return new Promise((resolve) => {
        confirmPromise = resolve;
    });
}

document.getElementById('confirmCancel').onclick = () => {
    confirmModal.classList.remove('show');
    if (confirmPromise) confirmPromise(false);
};

document.getElementById('confirmOk') && (document.getElementById('confirmOk').onclick = () => {
    confirmModal.classList.remove('show');
    if (confirmPromise) confirmPromise(true);
});

document.getElementById('confirmProceed') && (document.getElementById('confirmProceed').onclick = () => {
    confirmModal.classList.remove('show');
    if (confirmPromise) confirmPromise(true);
});

// MODALS
const adminModal = document.getElementById('adminModal');
const createLabModal = document.getElementById('createLabModal');
const editLabModal = document.getElementById('editLabModal');

document.getElementById('createAdminBtn').addEventListener('click', () => adminModal.classList.add('show'));
document.getElementById('closeAdminModal').addEventListener('click', () => adminModal.classList.remove('show'));

document.getElementById('addLabBtn').addEventListener('click', () => createLabModal.classList.add('show'));
document.getElementById('closeLabModal').addEventListener('click', () => createLabModal.classList.remove('show'));

document.getElementById('closeEditLabModal').addEventListener('click', () => editLabModal.classList.remove('show'));

window.addEventListener('click', (e) => {
    if (e.target === adminModal) adminModal.classList.remove('show');
    if (e.target === createLabModal) createLabModal.classList.remove('show');
    if (e.target === editLabModal) editLabModal.classList.remove('show');
    if (e.target === confirmModal) confirmModal.classList.remove('show');
});

// Create Admin
document.getElementById('createAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('newAdminEmail').value;
    const password = document.getElementById('newAdminPassword').value;
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        // Find or Create secondary app instance
        let secondaryApp;
        try {
            secondaryApp = initializeApp(firebaseConfig, 'Secondary');
        } catch (e) {
            // Already initialized, get existing
            const { getApp } = await import('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
            secondaryApp = getApp('Secondary');
        }

        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        await addDoc(collection(db, 'admins'), {
            uid: userCredential.user.uid,
            email: email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });

        await signOut(secondaryAuth);

        showToast('Admin account created successfully');
        adminModal.classList.remove('show');
        document.getElementById('createAdminForm').reset();
        loadAdminCount();
    } catch (error) {
        console.error('Full Error:', error);
        let msg = error.message;
        if (error.code === 'auth/email-already-in-use') msg = 'Email already registered';
        if (error.code === 'auth/admin-restricted-operation') msg = 'Firebase Console setup missing for admin creation';
        showToast(msg, 'error');
    }
});

// Create Lab
document.getElementById('createLabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('labName').value;
    const number = document.getElementById('labNumber').value;
    const desc = document.getElementById('labDesc')?.value || '';
    
    try {
        await addDoc(collection(db, 'labs'), {
            name: name,
            number: number,
            description: desc,
            createdAt: new Date().toISOString()
        });
        showToast('Lab created successfully');
        document.getElementById('createLabForm').reset();
        createLabModal.classList.remove('show');
        loadLabs();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Edit Lab
document.getElementById('editLabForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editLabId').value;
    const name = document.getElementById('editLabName').value;
    const number = document.getElementById('editLabNumber')?.value || '';

    try {
        await updateDoc(doc(db, 'labs', id), { name, number });
        showToast('Lab updated');
        editLabModal.classList.remove('show');
        loadLabs();
    } catch (error) {
        showToast(error.message, 'error');
    }
});

// Admin Count
async function loadAdminCount() {
    try {
        const snap = await getDocs(collection(db, 'admins'));
        document.getElementById('adminCount').textContent = snap.size;
    } catch (e) { }
}

// Load Labs
async function loadLabs() {
    const list = document.getElementById('labsList');
    list.innerHTML = '<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;padding:4rem;color:var(--muted);gap:.75rem;"><svg style="animation:spin 1s linear infinite;width:28px;height:28px;" fill="none" viewBox="0 0 24 24"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Loading labs...</span></div>';
    
    try {
        const labsSnap = await getDocs(collection(db, 'labs'));
        const compsSnap = await getDocs(collection(db, 'computers'));

        // Map lab counts
        const labCounts = {};
        compsSnap.forEach(c => {
            const lid = c.data().labId;
            labCounts[lid] = (labCounts[lid] || 0) + 1;
        });

        list.innerHTML = '';
        
        if (labsSnap.empty) {
            list.innerHTML = '<div class="empty-labs"><svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="opacity:.2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg><span style="font-size:.9rem;font-weight:600;">No labs yet</span><span style="font-size:.8rem;">Click "+ Add Lab" to create your first lab.</span></div>';
            return;
        }
        
        labsSnap.forEach((doc) => {
            const lab = doc.data();
            const count = labCounts[doc.id] || 0;
            // Get computers for this lab
            const labComputers = compsSnap.docs.filter(c => c.data().labId === doc.id);
            
            let computersHTML = labComputers.map(c => {
                const comp = c.data();
                const isWorking = comp.status !== 'Not Working';
                const labPrefix = lab.name.replace(/\s+/g,'').substring(0,4).toUpperCase();
                return `
                <div class="comp-mini">
                    <div class="comp-mini-actions">
                        <button class="comp-action-btn comp-action-del" onclick="event.stopPropagation();window.deleteComputer('${c.id}')" title="Delete">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                        <button class="comp-action-btn comp-action-qr" onclick="event.stopPropagation();window.showComputerQR('${c.id}','${comp.number}')" title="QR Code">
                            <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                        </button>
                    </div>
                    <div class="comp-mini-id">${labPrefix}-${String(comp.number).padStart(2,'0')}</div>
                    <div class="comp-mini-status"><span class="comp-status-dot ${isWorking ? 'dot-green' : 'dot-red'}"></span>${isWorking ? 'Available' : 'Issue'}</div>
                    <div class="comp-mini-student">No student</div>
                </div>`;
            }).join('');

            computersHTML += `
                <div class="add-comp-card" onclick="window.openAddComputerForLab('${doc.id}')">
                    <div class="add-comp-icon"><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg></div>
                    <div class="add-comp-label">Add Computer</div>
                </div>`;

            list.innerHTML += `
                <div class="lab-section">
                    <div class="lab-section-hdr">
                        <div class="lab-section-name">${lab.name}</div>
                        <span class="lab-badge">${(lab.number || lab.name.replace(/\s+/g,'').substring(0,4)).toUpperCase()}</span>
                        <span class="lab-count-badge">${count} Station${count !== 1 ? 's' : ''}</span>
                        <div class="lab-section-actions">
                            <button onclick="window.openLabQR('${doc.id}','${lab.name.replace(/'/g,"\\'")}');" class="btn btn-success" style="font-size:.72rem;padding:.35rem .65rem;">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
                                Lab QR
                            </button>
                            <button onclick="openEditLab('${doc.id}','${lab.name.replace(/'/g,"\\'")}','${(lab.number||'').replace(/'/g,"\\'")}');" class="btn btn-ghost" style="font-size:.72rem;padding:.35rem .65rem;">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                Edit
                            </button>
                            <button onclick="deleteLab('${doc.id}');" class="btn btn-danger" style="font-size:.72rem;padding:.35rem .65rem;">
                                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                Delete Lab
                            </button>
                        </div>
                    </div>
                    <div class="computers-grid">${computersHTML}</div>
                </div>`;
        });
    } catch (error) {
        showToast('Error loading labs', 'error');
    }
}

// Delete Lab
window.deleteLab = async (id) => {
    if (await showConfirm('Delete Lab', 'Are you sure you want to delete this lab and all contained computers? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'labs', id));
            showToast('Lab deleted');
            loadLabs();
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
};

// Initial load
loadAdminCount();
loadLabs();

window.openEditLab = (id, currentName, currentNumber) => {
    document.getElementById('editLabId').value = id;
    document.getElementById('editLabName').value = currentName;
    if(document.getElementById('editLabNumber')) document.getElementById('editLabNumber').value = currentNumber || '';
    editLabModal.classList.add('show');
};

// Password Toggle
document.getElementById('toggleNewAdminPassword')?.addEventListener('click', function () {
    const input = document.getElementById('newAdminPassword');
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
document.getElementById('sidebarCreateAdminBtn')?.addEventListener('click', () => {
    toggleSidebar(false);
    adminModal.classList.add('show');
});

document.getElementById('sidebarLogoutBtn')?.addEventListener('click', () => {
    toggleSidebar(false);
    signOut(auth);
});



// Add Computer directly from dashboard - open modal on dashboard
window.openAddComputerForLab = (labId) => {
    // Store labId and open a quick-add modal
    window._addCompLabId = labId;
    const modal = document.getElementById('addCompModal');
    if(modal) {
        document.getElementById('addCompForm').reset();
        modal.classList.add('show');
    } else {
        // fallback - go to lab page
        window.location.href = `./lab.html?id=${labId}&addComputer=1`;
    }
};

// Delete Computer from dashboard
window.deleteComputer = async (id) => {
    if (await showConfirm('Delete Computer', 'Remove this computer? This cannot be undone.')) {
        try {
            await deleteDoc(doc(db, 'computers', id));
            showToast('Computer removed');
            loadLabs();
        } catch (e) {
            showToast(e.message, 'error');
        }
    }
};

// Show Computer QR from dashboard
window.showComputerQR = (computerId, compNum) => {
    const url = `${window.location.origin}/computer.html?id=${computerId}`;
    window.openLabQR(computerId + '_comp', `PC #${compNum}`);
    // Override the QR with computer URL
    setTimeout(() => {
        const qrDiv = document.getElementById('labQRCode');
        qrDiv.innerHTML = '';
        new QRCode(qrDiv, { text: url, width: 170, height: 170 });
        document.getElementById('labQRName').textContent = `Computer #${compNum}`;
        document.getElementById('labQRLink').textContent = url;
    }, 50);
};

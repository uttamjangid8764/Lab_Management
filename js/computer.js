import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection, addDoc, query, where, getDocs, orderBy } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// UI UTILITIES
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type === 'error' ? 'err' : 'ok');
    toast.textContent = (type === 'error' ? '✕ ' : '✓ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

const urlParams = new URLSearchParams(window.location.search);
const computerId = urlParams.get('id');

if (!computerId) {
    showToast('Invalid computer ID', 'error');
    setTimeout(() => window.location.href = './index.html', 1000);
}

// Load Computer
async function loadComputerDetails() {
    try {
        const docSnap = await getDoc(doc(db, 'computers', computerId));
        if (docSnap.exists()) {
            const data = docSnap.data();
            const isWorking = data.status !== 'Not Working';

            document.getElementById('computerInfo').innerHTML = `
                <div class="status-banner ${isWorking ? 'ok' : 'bad'}">
                    <div class="status-icon ${isWorking ? 'ok' : 'bad'}">
                        ${isWorking
                            ? '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
                            : '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>'
                        }
                    </div>
                    <div>
                        <div class="status-label">Current Status</div>
                        <div class="status-val ${isWorking ? 'ok' : 'bad'}">${isWorking ? 'System is Working' : 'Out of Order / Issue'}</div>
                    </div>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">System ID</div>
                        <div class="info-val">PC #${data.number}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Status</div>
                        <div class="info-val" style="color:${isWorking ? '#10b981' : '#ef4444'}">${data.status}</div>
                    </div>
                    <div class="info-item full">
                        <div class="info-label">Specifications</div>
                        <div class="info-val" style="font-size:.85rem;">${data.details}</div>
                    </div>
                    <div class="info-item full">
                        <div class="info-label">Computer Password</div>
                        <div class="info-val"><code style="background:rgba(99,102,241,.1);color:#818cf8;padding:.2rem .5rem;border-radius:5px;font-size:.9rem;">${data.password}</code></div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        showToast('Error loading details', 'error');
    }
}

// Submit Review
document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const status = document.getElementById('reviewStatus').value;
    const comment = document.getElementById('reviewComment').value;
    
    try {
        await addDoc(collection(db, 'reviews'), {
            computerId: computerId,
            status: status,
            comment: comment,
            timestamp: new Date().toISOString()
        });
        showToast('Thank you! Status submitted.');
        document.getElementById('reviewForm').reset();
        loadReviews();
    } catch (e) {
        showToast('Failed to submit', 'error');
    }
});

// Load Reviews
async function loadReviews() {
    const list = document.getElementById('reviewsList');
    list.innerHTML = '<div style="display:flex;justify-content:center;padding:2rem;"><svg style="animation:spin 1s linear infinite;width:24px;height:24px;color:var(--muted);" fill="none" viewBox="0 0 24 24"><circle opacity=".25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path opacity=".75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>';
    
    try {
        const q = query(collection(db, 'reviews'), where('computerId', '==', computerId));
        const snap = await getDocs(q);
        list.innerHTML = '';
        
        if (snap.empty) {
            list.innerHTML = '<p style="text-align:center;padding:2rem;font-size:.82rem;color:var(--muted);border:1px dashed var(--border);border-radius:10px;">No report history yet.</p>';
            return;
        }
        
        const reviews = snap.docs.map(d => d.data());
        reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        reviews.forEach(r => {
            const isWorking = r.status === 'Working';
            list.innerHTML += `
                <div class="review-item">
                    <div class="review-hdr">
                        <span class="badge ${isWorking ? 'badge-ok' : 'badge-bad'}">
                            ${isWorking
                                ? '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'
                                : '<svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'
                            }
                            ${isWorking ? 'Working' : 'Issue Reported'}
                        </span>
                        <span class="review-time">${new Date(r.timestamp).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</span>
                    </div>
                    ${r.comment ? `<div class="review-comment">${r.comment}</div>` : ''}
                </div>
            `;
        });
    } catch (e) {
        showToast('Error loading history', 'error');
    }
}

// Initial
loadComputerDetails();
loadReviews();


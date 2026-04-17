import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import firebaseConfig from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence);

// UI UTILITIES
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.style.cssText = `background:${type==='error'?'rgba(239,68,68,.15)':'rgba(16,185,129,.15)'};border:1px solid ${type==='error'?'rgba(239,68,68,.4)':'rgba(16,185,129,.4)'};color:${type==='error'?'#fca5a5':'#6ee7b7'};padding:.7rem 1rem;border-radius:10px;font-size:.82rem;pointer-events:auto;box-shadow:0 8px 24px rgba(0,0,0,.4);display:flex;align-items:center;gap:.5rem;min-width:200px;`;
    toast.textContent = (type==='error'?'✕ ':'✓ ') + message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    
    try {
        btn.disabled = true;
        btn.textContent = 'Signing in...';
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Login successful! Redirecting...');
        setTimeout(() => window.location.href = './dashboard.html', 1000);
    } catch (error) {
        btn.disabled = false;
        btn.textContent = 'Sign In as Admin';
        let msg = error.message;
        if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';
        showToast(msg, 'error');
    }
});
// Password Toggle
document.getElementById('togglePassword')?.addEventListener('click', function () {
    const input = document.getElementById('password');
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;

    this.innerHTML = type === 'password'
        ? `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`
        : `<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"></path></svg>`;
});

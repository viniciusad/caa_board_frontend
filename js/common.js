const API_BASE_URL = 'http://127.0.0.1:5000/api';

function getToken() {
  return localStorage.getItem('caa_auth_token');
}

function getUsername() {
  return localStorage.getItem('caa_username');
}

function setAuth(token, username) {
  if (token) localStorage.setItem('caa_auth_token', token);
  if (username) localStorage.setItem('caa_username', username);
}

function clearAuth() {
  localStorage.removeItem('caa_auth_token');
  localStorage.removeItem('caa_username');
}

function showFlash(message, type = 'info') {
  const flashMessages = document.getElementById('flashMessages');
  if (!flashMessages) return;

  const flash = document.createElement('div');
  flash.className = `flash`;
  if (type === 'error') {
    flash.style.backgroundColor = '#f44336';
  } else if (type === 'success') {
    flash.style.backgroundColor = '#4CAF50';
  }
  flash.innerText = message;

  flashMessages.appendChild(flash);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (flash.parentNode) flash.remove();
  }, 5000);
}

function renderNav() {
  const navMenu = document.getElementById('navMenu');
  if (!navMenu) return;

  const token = getToken();
  const username = getUsername();

  let html = '';

  // Theme toggle button
  html += `
        <button id="themeToggle" class="btn btn-outline" title="Alternar Tema"
            style="margin-left: 5px; margin-right: 5px; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-moon"></i> <span id="themeToggleText"
                style="font-size: 0.9em; font-weight: 600;">Modo Escuro</span>
        </button>
    `;

  if (token) {
    html = `<span class="user-greeting">Olá, ${username || 'Usuário'}!</span>` + html;
    html += `
            <a href="settings.html" class="btn btn-outline" title="Configurações"><i class="fa-solid fa-gear"></i></a>
            <a href="#" id="btnLogout" class="btn btn-outline" style="margin-left: 5px;">Sair</a>
        `;
  } else {
    // Prevent showing login/register if already on those pages
    const currentPath = window.location.pathname;
    if (!currentPath.endsWith('login.html')) {
      html += `<a href="login.html" class="btn btn-outline">Entrar</a>`;
    }
    if (!currentPath.endsWith('register.html')) {
      html += `<a href="register.html" class="btn btn-outline">Registrar</a>`;
    }
  }

  navMenu.innerHTML = html;

  // Attach theme toggle listener
  setupThemeToggle();

  // Attach logout listener
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Tem certeza que deseja sair?')) {
        clearAuth();
        window.location.href = 'index.html';
      }
    });
  }
}

function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const icon = themeToggle.querySelector('i');
  const textSpan = document.getElementById('themeToggleText');

  const updateIcon = () => {
    if (document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      if (textSpan) textSpan.innerText = 'Modo Claro';
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      if (textSpan) textSpan.innerText = 'Modo Escuro';
    }
  };
  updateIcon();

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
      localStorage.setItem('caa_theme', 'dark');
    } else {
      localStorage.removeItem('caa_theme');
    }
    updateIcon();
  });
}

// Global Headers struct for authenticated fetch
function getAuthHeaders() {
  const headers = {
    'Accept': 'application/json'
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
});

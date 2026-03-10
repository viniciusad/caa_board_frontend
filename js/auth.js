document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = loginForm.username.value;
      const password = loginForm.password.value;

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          setAuth(data.token, data.username);
          window.location.href = 'index.html';
        } else {
          showFlash(data.message || 'Erro ao fazer login', 'error');
        }
      } catch (error) {
        console.error('Login error:', error);
        showFlash('Erro de conexão', 'error');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = registerForm.username.value;
      const password = registerForm.password.value;

      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          showFlash('Registro concluído! Agora você pode entrar.', 'success');
          setTimeout(() => {
            window.location.href = 'login.html';
          }, 2000);
        } else {
          showFlash(data.message || 'Erro ao registrar', 'error');
        }
      } catch (error) {
        console.error('Register error:', error);
        showFlash('Erro de conexão', 'error');
      }
    });
  }
});

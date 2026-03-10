document.addEventListener('DOMContentLoaded', () => {
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const miniatureGrid = document.getElementById('miniatureGrid');
  const addCardForm = document.getElementById('addCardForm');
  const wordInput = document.getElementById('word');
  const wordHelp = document.getElementById('wordHelp');
  const iconOptions = document.querySelectorAll('.icon-option');
  const selectedIconInput = document.getElementById('selectedIcon');
  const imageUpload = document.getElementById('image_upload');
  const btnSubmitCard = document.getElementById('btnSubmitCard');

  // Fetch cards
  async function loadCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/cards`, {
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        clearAuth();
        window.location.href = 'login.html';
        return;
      }

      const data = await response.json();
      renderMiniatureGrid(data.cards || []);
      setupSortable();
    } catch (error) {
      console.error('Failed to load cards:', error);
      showFlash('Erro ao carregar os cards.', 'error');
    }
  }

  function renderMiniatureGrid(cardsList) {
    if (!miniatureGrid) return;
    miniatureGrid.innerHTML = '';

    cardsList.forEach(item => {
      if (item.is_hidden) return;

      const cardEl = document.createElement('div');
      cardEl.className = `miniature-card type-${item.card_type}`;
      cardEl.setAttribute('data-id', item.id);

      let iconHtml = '';
      if (item.icon_class && (item.icon_class.startsWith('fa-') || item.icon_class.startsWith('fas') || item.icon_class.includes('twa'))) {
        iconHtml = `<i class="${item.icon_class}"></i>`;
      } else if (item.icon_class) {
        iconHtml = `<img src="${item.icon_class}" alt="${item.word}" class="custom-card-img">`;
      }

      let deleteBtnHtml = '';
      if (!item.is_default && item.user_id_matches) {
        deleteBtnHtml = `
                    <button type="button" class="btn-mini-icon btn-mini-danger" title="Apagar" onclick="deleteCard(${item.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                `;
      }

      cardEl.innerHTML = `
                <div class="miniature-card-content">
                    ${iconHtml}
                    <span>${item.word}</span>
                </div>
                <div class="miniature-actions">
                    <button type="button" class="btn-mini-icon" title="Ocultar do Board" onclick="toggleVisibility(${item.id})">
                        <i class="fa-solid fa-eye-slash" style="color: #999;"></i>
                    </button>
                    ${deleteBtnHtml}
                </div>
            `;

      miniatureGrid.appendChild(cardEl);
    });
  }

  // Expose actions to window so inline onclick works
  window.deleteCard = async function (id) {
    if (!confirm('Tem certeza que deseja apagar este card permanentemente?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        showFlash('Card deletado com sucesso.', 'success');
        loadCards();
      } else {
        showFlash('Erro ao deletar card.', 'error');
      }
    } catch (error) {
      showFlash('Erro de conexão.', 'error');
    }
  };

  window.toggleVisibility = async function (id) {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${id}/toggle_visibility`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        loadCards();
      } else {
        showFlash('Erro ao alterar visibilidade.', 'error');
      }
    } catch (error) {
      showFlash('Erro de conexão.', 'error');
    }
  };

  // SortableJS
  function setupSortable() {
    if (miniatureGrid) {
      Sortable.create(miniatureGrid, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function () {
          const items = miniatureGrid.querySelectorAll('.miniature-card');
          const cardIds = Array.from(items).map(item => item.getAttribute('data-id'));

          fetch(`${API_BASE_URL}/save_board`, {
            method: 'POST',
            headers: {
              ...getAuthHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ card_ids: cardIds })
          })
            .then(response => response.json())
            .then(data => {
              if (data.status === 'success') {
                const alert = document.getElementById('saveAlert');
                alert.style.display = 'block';
                setTimeout(() => { alert.style.display = 'none'; }, 3000);
              }
            });
        }
      });
    }
  }

  // Form logic
  if (wordInput) {
    wordInput.addEventListener('input', function () {
      const text = this.value.trim();
      const words = text.split(/\s+/).filter(w => w.length > 0);

      if (words.length > 2) {
        this.value = words.slice(0, 2).join(' ');
        wordHelp.style.color = 'var(--danger-color)';
        wordHelp.innerText = "Limite de 2 palavras atingido.";
      } else {
        wordHelp.style.color = 'var(--text-muted)';
        wordHelp.innerText = `${words.length}/2 palavras.`;
      }
      checkFormValidity();
    });
  }

  iconOptions.forEach(icon => {
    icon.addEventListener('click', function () {
      iconOptions.forEach(i => i.classList.remove('active'));
      this.classList.add('active');
      selectedIconInput.value = this.getAttribute('data-icon');
      checkFormValidity();
    });
  });

  if (imageUpload) {
    imageUpload.addEventListener('change', checkFormValidity);
  }

  function checkFormValidity() {
    if (!wordInput) return;
    const hasImage = imageUpload && imageUpload.files.length > 0;
    if (wordInput.value.trim().length > 0 && (selectedIconInput.value !== '' || hasImage)) {
      btnSubmitCard.removeAttribute('disabled');
    } else {
      btnSubmitCard.setAttribute('disabled', 'true');
    }
  }

  if (addCardForm) {
    addCardForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      btnSubmitCard.setAttribute('disabled', 'true');
      btnSubmitCard.innerText = 'Salvando...';

      const formData = new FormData(addCardForm);

      try {
        const response = await fetch(`${API_BASE_URL}/cards`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`
          },
          body: formData // browser boundary handles Content-Type
        });

        if (response.ok) {
          showFlash('Novo card adicionado com sucesso!', 'success');
          addCardForm.reset();
          iconOptions.forEach(i => i.classList.remove('active'));
          selectedIconInput.value = '';
          checkFormValidity();
          loadCards();
        } else {
          const data = await response.json();
          showFlash(data.message || 'Erro ao adicionar card.', 'error');
        }
      } catch (error) {
        showFlash('Erro de conexão.', 'error');
      }

      btnSubmitCard.innerText = 'Adicionar e Salvar';
    });
  }

  loadCards();
});

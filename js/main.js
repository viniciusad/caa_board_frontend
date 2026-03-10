document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  const sequenceBar = document.getElementById('sequenceBar');
  const cardsGrid = document.getElementById('cardsGrid');
  const btnDelete = document.getElementById('btnDelete');
  const btnClear = document.getElementById('btnClear');
  const btnPlay = document.getElementById('btnPlay');

  let sequence = [];
  const MAX_CARDS = 10;

  const synth = window.speechSynthesis;
  let voicePTBR = null;

  function loadVoices() {
    const voices = synth.getVoices();
    voicePTBR = voices.find(voice => voice.lang.includes('pt-BR') || voice.lang.includes('pt_BR')) || voices[0];
  }

  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Fetch cards from API
  async function loadCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/cards`, {
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        clearAuth();
        window.location.href = 'login.html';
        return;
      }

      const data = await response.json();
      renderCards(data.cards || []);
    } catch (error) {
      console.error('Failed to load cards:', error);
      showFlash('Erro ao carregar os cards.', 'error');
    }
  }

  function renderCards(cardsList) {
    if (!cardsGrid) return;
    cardsGrid.innerHTML = '';

    cardsList.forEach(item => {
      const cardEl = document.createElement('div');
      cardEl.className = `card item-card type-${item.card_type}`;
      cardEl.setAttribute('data-word', item.word);
      cardEl.setAttribute('data-icon', item.icon_class);
      cardEl.setAttribute('data-id', item.id);

      let iconHtml = '';
      if (item.icon_class && (item.icon_class.startsWith('fa-') || item.icon_class.startsWith('fas') || item.icon_class.includes('twa'))) {
        iconHtml = `<i class="${item.icon_class}"></i>`;
      } else {
        iconHtml = `<img src="${item.icon_class}" alt="${item.word}" class="custom-card-img">`;
      }

      cardEl.innerHTML = `
                <div class="card-icon">${iconHtml}</div>
                <div class="card-word">${item.word}</div>
            `;

      cardEl.addEventListener('click', () => {
        if (sequence.length >= MAX_CARDS) {
          sequenceBar.style.backgroundColor = '#FFD2D2';
          setTimeout(() => sequenceBar.style.backgroundColor = '', 300);
          return;
        }
        sequence.push({ word: item.word, icon: item.icon_class });
        renderSequence();
      });

      cardsGrid.appendChild(cardEl);
    });
  }

  function renderSequence() {
    if (sequence.length === 0) {
      sequenceBar.innerHTML = '<div class="placeholder-text">Clique nos cards para formar uma frase...</div>';
      return;
    }

    sequenceBar.innerHTML = '';
    sequence.forEach((item, index) => {
      const el = document.createElement('div');
      el.className = 'sequence-item';

      let iconHtml = '';
      if (item.icon && (item.icon.startsWith('fa-') || item.icon.startsWith('fas') || item.icon.includes('twa'))) {
        iconHtml = `<i class="${item.icon}"></i>`;
      } else if (item.icon) {
        iconHtml = `<img src="${item.icon}" alt="${item.word}" style="width:24px; height:24px; vertical-align:middle;">`;
      }

      el.innerHTML = `${iconHtml} ${item.word}`;
      el.onclick = () => {
        sequence.splice(index, 1);
        renderSequence();
      };
      sequenceBar.appendChild(el);
    });
  }

  if (btnDelete) {
    btnDelete.addEventListener('click', () => {
      if (sequence.length > 0) {
        sequence.pop();
        renderSequence();
      }
    });
  }

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      sequence = [];
      renderSequence();
      synth.cancel();
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      if (sequence.length === 0) return;
      synth.cancel();
      const textToSpeak = sequence.map(s => s.word).join(' ');
      const utterThis = new SpeechSynthesisUtterance(textToSpeak);
      if (voicePTBR) utterThis.voice = voicePTBR;
      utterThis.lang = 'pt-BR';
      utterThis.rate = 0.9;
      utterThis.pitch = 1.1;

      btnPlay.style.transform = 'scale(0.95)';
      btnPlay.style.backgroundColor = '#4CAF50';
      btnPlay.innerHTML = `<i class="fa-solid fa-volume-high"></i> Falando...`;

      utterThis.onend = () => {
        btnPlay.style.transform = '';
        btnPlay.style.backgroundColor = '';
        btnPlay.innerHTML = '<i class="fa-solid fa-circle-play"></i> Falar';
      };
      utterThis.onerror = utterThis.onend;
      synth.speak(utterThis);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (btnPlay) btnPlay.click();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      if (btnDelete) btnDelete.click();
    }
  });

  // Initial load
  if (cardsGrid) {
    loadCards();
  }
});

// ============================================
// RH MANAGEMENT - JAVASCRIPT INTERACTIVITY
// ============================================

// ============================================
// MENU TOGGLE (MOBILE)
// ============================================
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function() {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
      if (window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  }

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const searchInputs = document.querySelectorAll('.search-bar input');
  searchInputs.forEach(input => {
    input.addEventListener('input', function(e) {
      const searchTerm = e.target.value.toLowerCase();
      console.log('Recherche:', searchTerm);
      // Here you would implement actual search functionality
    });
  });

  // ============================================
  // SLIDER VALUES UPDATE
  // ============================================
  const sliders = document.querySelectorAll('input[type="range"]');
  sliders.forEach(slider => {
    slider.addEventListener('input', function(e) {
      const value = e.target.value;
      const valueDisplay = e.target.parentElement.querySelector('.slider-value');
      if (valueDisplay) {
        valueDisplay.textContent = value + '%';
      }
    });
  });

  // ============================================
  // FORM VALIDATION
  // ============================================
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Check required fields
      const requiredFields = form.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          field.style.borderColor = 'var(--danger)';
        } else {
          field.style.borderColor = '';
        }
      });

      if (isValid) {
        console.log('Formulaire valide');
        showNotification('Formulaire envoyé avec succès!', 'success');
      } else {
        showNotification('Veuillez remplir tous les champs obligatoires', 'error');
      }
    });
  });

  // ============================================
  // SKILLS INPUT (Add/Remove Tags)
  // ============================================
  const skillsInputs = document.querySelectorAll('.skills-input input');
  skillsInputs.forEach(input => {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && this.value.trim()) {
        e.preventDefault();
        const skillText = this.value.trim();
        const skillTag = createSkillTag(skillText);
        this.parentElement.insertBefore(skillTag, this);
        this.value = '';
      }
    });
  });

  // Remove skill tag
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('skill-tag') && e.target.textContent.includes('×')) {
      e.target.remove();
    }
  });

  // ============================================
  // DRAG AND DROP (Kanban)
  // ============================================
  const candidateCards = document.querySelectorAll('.candidate-card');
  const kanbanColumns = document.querySelectorAll('.kanban-cards');

  candidateCards.forEach(card => {
    card.setAttribute('draggable', 'true');

    card.addEventListener('dragstart', function(e) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', this.innerHTML);
      this.style.opacity = '0.5';
    });

    card.addEventListener('dragend', function() {
      this.style.opacity = '1';
    });
  });

  kanbanColumns.forEach(column => {
    column.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      this.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
    });

    column.addEventListener('dragleave', function() {
      this.style.backgroundColor = '';
    });

    column.addEventListener('drop', function(e) {
      e.preventDefault();
      this.style.backgroundColor = '';
      
      const draggedHTML = e.dataTransfer.getData('text/html');
      if (draggedHTML) {
        showNotification('Candidat déplacé avec succès!', 'success');
      }
    });
  });

  // ============================================
  // COMPARE CANDIDATES
  // ============================================
  const compareCheckboxes = document.querySelectorAll('.match-actions input[type="checkbox"]');
  let selectedCandidates = [];

  compareCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const candidateName = this.closest('.match-card').querySelector('.match-name').textContent;
      
      if (this.checked) {
        if (selectedCandidates.length < 3) {
          selectedCandidates.push(candidateName);
        } else {
          this.checked = false;
          showNotification('Vous ne pouvez comparer que 3 candidats maximum', 'warning');
        }
      } else {
        selectedCandidates = selectedCandidates.filter(name => name !== candidateName);
      }

      updateCompareButton();
    });
  });

  // ============================================
  // FILTER FUNCTIONALITY
  // ============================================
  const filterInputs = document.querySelectorAll('.filter-panel select, .filter-panel input[type="checkbox"]');
  filterInputs.forEach(input => {
    input.addEventListener('change', function() {
      console.log('Filtre appliqué:', this.value);
      // Here you would implement actual filtering
      showNotification('Filtres appliqués', 'info');
    });
  });

  // Reset filters
  const resetButtons = document.querySelectorAll('.filter-reset');
  resetButtons.forEach(button => {
    button.addEventListener('click', function() {
      const filterPanel = this.closest('.filter-panel');
      if (filterPanel) {
        filterPanel.querySelectorAll('select').forEach(select => {
          select.selectedIndex = 0;
        });
        filterPanel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = false;
        });
        filterPanel.querySelectorAll('input[type="range"]').forEach(slider => {
          slider.value = 0;
        });
        showNotification('Filtres réinitialisés', 'info');
      }
    });
  });

  // ============================================
  // STATUS CHANGE
  // ============================================
  const statusSelects = document.querySelectorAll('.status-select');
  statusSelects.forEach(select => {
    select.addEventListener('change', function() {
      const newStatus = this.value;
      const candidateName = document.querySelector('.profile-name')?.textContent || 'le candidat';
      showNotification(`Statut de ${candidateName} changé vers: ${newStatus}`, 'success');
    });
  });

  // ============================================
  // MATCHING SCORE ANIMATION
  // ============================================
  const scoreBadges = document.querySelectorAll('.score-badge');
  scoreBadges.forEach(badge => {
    const score = parseInt(badge.textContent);
    if (score) {
      animateScore(badge, score);
    }
  });

  // ============================================
  // EXPLANATION TOGGLE
  // ============================================
  const explanationHeaders = document.querySelectorAll('.match-explanation-header');
  explanationHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      if (content && content.classList.contains('match-explanation-content')) {
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';
        
        const icon = this.querySelector('svg');
        if (icon) {
          icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      }
    });
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function createSkillTag(text) {
  const tag = document.createElement('span');
  tag.className = 'skill-tag';
  tag.innerHTML = `${text} <span style="cursor: pointer;">×</span>`;
  return tag;
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background-color: ${getNotificationColor(type)};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getNotificationColor(type) {
  const colors = {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6'
  };
  return colors[type] || colors.info;
}

function updateCompareButton() {
  const compareButtons = document.querySelectorAll('button:has(svg + text)');
  compareButtons.forEach(button => {
    if (button.textContent.includes('Comparer')) {
      const count = document.querySelectorAll('.match-actions input[type="checkbox"]:checked').length;
      button.innerHTML = button.innerHTML.replace(/\(\d+\)/, `(${count})`);
    }
  });
}

function animateScore(element, targetScore) {
  let currentScore = 0;
  const increment = targetScore / 30;
  const interval = setInterval(() => {
    currentScore += increment;
    if (currentScore >= targetScore) {
      currentScore = targetScore;
      clearInterval(interval);
    }
    element.textContent = Math.round(currentScore);
  }, 30);
}

// ============================================
// ANIMATIONS CSS (Add to head dynamically)
// ============================================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
`;
document.head.appendChild(style);

// ============================================
// EXPORT FUNCTIONALITY
// ============================================
function exportToCSV() {
  showNotification('Export CSV en cours...', 'info');
  setTimeout(() => {
    showNotification('Export réussi!', 'success');
  }, 1500);
}

function exportToPDF() {
  showNotification('Export PDF en cours...', 'info');
  setTimeout(() => {
    showNotification('Export réussi!', 'success');
  }, 1500);
}

// ============================================
// DEMO DATA (for testing)
// ============================================
window.demoData = {
  candidates: [
    {
      id: 1,
      name: 'Sophie Martin',
      school: 'ESSEC Business School',
      score: 92,
      skills: ['Python', 'SQL', 'Power BI', 'Excel'],
      status: 'nouveau'
    },
    {
      id: 2,
      name: 'Thomas Dubois',
      school: 'École 42',
      score: 88,
      skills: ['React', 'Node.js', 'MongoDB'],
      status: 'nouveau'
    },
    {
      id: 3,
      name: 'Alice Bernard',
      school: 'HEC Paris',
      score: 94,
      skills: ['Python', 'Machine Learning', 'R'],
      status: 'preselection'
    }
  ],
  offers: [
    {
      id: 1,
      title: 'Data Analyst - Stage 6 mois',
      department: 'Informatique',
      location: 'Paris',
      status: 'active',
      applications: 18
    },
    {
      id: 2,
      title: 'Développeur Full Stack - Alternance',
      department: 'Informatique',
      location: 'Lyon',
      status: 'paused',
      applications: 2
    }
  ]
};

console.log('✅ RH Management App - JavaScript chargé avec succès');
console.log('📊 Données de démo disponibles:', window.demoData);

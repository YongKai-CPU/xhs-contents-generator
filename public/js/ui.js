/**
 * UI State Management
 * Handles rendering of auth state and content display
 */

/**
 * Update UI for logged in state
 */
export function updateUIForLoggedInUser(user) {
  const loginSection = document.getElementById('loginSection');
  const loggedInSection = document.getElementById('loggedInSection');
  const userInfoElement = document.getElementById('userInfo');

  if (loginSection) loginSection.style.display = 'none';
  if (loggedInSection) loggedInSection.style.display = 'flex';

  if (userInfoElement) {
    const displayName = user.displayName || user.email || 'User';
    const avatar = user.picture || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ff2442&color=fff`;

    // Update avatar and name
    const avatarImg = userInfoElement.querySelector('.user-avatar');
    const nameSpan = userInfoElement.querySelector('.user-name');
    
    if (avatarImg) avatarImg.src = avatar;
    if (nameSpan) nameSpan.textContent = displayName;
  }

  // Enable tool UI
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.disabled = false;
    generateBtn.title = '';
  }

  console.log('UI updated for logged in user:', user.email);
}

/**
 * Update UI for logged out state
 */
export function updateUIForLoggedOutUser() {
  const loginSection = document.getElementById('loginSection');
  const loggedInSection = document.getElementById('loggedInSection');
  const userInfoElement = document.getElementById('userInfo');

  if (loginSection) loginSection.style.display = 'block';
  if (loggedInSection) loggedInSection.style.display = 'none';

  if (userInfoElement) {
    userInfoElement.innerHTML = '';
  }

  // Disable tool UI
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.disabled = true;
    generateBtn.title = 'Please log in to generate content';
  }

  console.log('UI updated for logged out state');
}

/**
 * Display results from AI generation
 */
export function displayResults(output) {
  if (!output) {
    showError('无输出内容');
    return;
  }

  // Display summary
  if (output.summary) {
    const s = output.summary;
    let summaryHTML = '';
    if (s.mainTopic) summaryHTML += `<p><strong>主题：</strong>${escapeHtml(s.mainTopic)}</p>`;
    if (s.corePoints && s.corePoints.length > 0) {
      summaryHTML += `<p><strong>核心观点：</strong>${s.corePoints.map(p => escapeHtml(p)).join('、')}</p>`;
    }
    if (s.highlights && s.highlights.length > 0) {
      summaryHTML += `<p><strong>亮点：</strong>${s.highlights.map(h => escapeHtml(h)).join('、')}</p>`;
    }
    if (s.targetAudience) summaryHTML += `<p><strong>适合人群：</strong>${escapeHtml(s.targetAudience)}</p>`;
    if (s.value) summaryHTML += `<p><strong>核心价值：</strong>${escapeHtml(s.value)}</p>`;
    
    const summaryContent = document.getElementById('summaryContent');
    if (summaryContent) summaryContent.innerHTML = summaryHTML;
  }

  // Display each card
  if (output.cards && Array.isArray(output.cards)) {
    output.cards.forEach((card, index) => {
      const key = index === 0 ? 'A' : index === 1 ? 'B' : 'C';
      displayCard(key, card);
    });
  }

  // Show results section
  const resultsSection = document.getElementById('resultsSection');
  if (resultsSection) {
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Display a single content card
 */
function displayCard(key, card) {
  const metaEl = document.getElementById(`meta${key}`);
  const titleEl = document.getElementById(`title${key}`);
  const hookEl = document.getElementById(`hook${key}`);
  const bodyEl = document.getElementById(`body${key}`);
  const ctaEl = document.getElementById(`cta${key}`);
  const hashtagsEl = document.getElementById(`hashtags${key}`);

  if (!metaEl) return;

  // Hide metadata for cleaner display
  metaEl.style.display = 'none';

  // Title
  if (titleEl) {
    titleEl.textContent = card.title || '';
    titleEl.style.display = card.title ? 'block' : 'none';
  }

  // Hook - convert \n to actual newlines and filter placeholders
  if (hookEl) {
    let hookText = Array.isArray(card.hook) ? card.hook.join('\n') : (card.hook || '');
    hookText = hookText.replace(/\\n/g, '\n');
    // Remove placeholder text
    hookText = hookText.replace(/AI 生成的内容/g, '').replace(/内容生成中\.\.\./g, '').trim();
    hookEl.textContent = hookText;
    hookEl.style.whiteSpace = 'pre-wrap';
    hookEl.style.display = hookText ? 'block' : 'none';
  }

  // Body - convert \n to actual newlines and filter placeholders
  if (bodyEl) {
    let bodyText = card.body || '';
    bodyText = bodyText.replace(/\\n/g, '\n');
    // Remove placeholder text
    bodyText = bodyText.replace(/AI 生成的内容/g, '').replace(/内容生成中\.\.\./g, '').trim();
    bodyEl.textContent = bodyText;
    bodyEl.style.whiteSpace = 'pre-wrap';
    bodyEl.style.display = bodyText ? 'block' : 'none';
  }

  // CTA - convert \n to actual newlines and filter placeholders
  if (ctaEl) {
    let ctaText = Array.isArray(card.cta) ? card.cta.join('\n') : (card.cta || '');
    ctaText = ctaText.replace(/\\n/g, '\n');
    // Remove placeholder text
    ctaText = ctaText.replace(/AI 生成的内容/g, '').replace(/内容生成中\.\.\./g, '').trim();
    ctaEl.textContent = ctaText;
    ctaEl.style.whiteSpace = 'pre-wrap';
    ctaEl.style.display = ctaText ? 'block' : 'none';
  }

  // Hashtags - filter out placeholder tags
  if (hashtagsEl) {
    if (card.hashtags && card.hashtags.length > 0) {
      // Filter out placeholder hashtags
      const validHashtags = card.hashtags.filter(tag => 
        !tag.includes('AI 生成') && !tag.includes('内容创作')
      );
      
      if (validHashtags.length > 0) {
        hashtagsEl.innerHTML = validHashtags
          .map(tag => `<span class="hashtag-item">${escapeHtml(tag)}</span>`)
          .join('');
        hashtagsEl.style.display = 'block';
      } else {
        hashtagsEl.style.display = 'none';
      }
    } else {
      hashtagsEl.style.display = 'none';
    }
  }
}

/**
 * Show error message
 */
export function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  if (errorMessage) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Hide error message
 */
export function hideError() {
  const errorMessage = document.getElementById('errorMessage');
  if (errorMessage) {
    errorMessage.style.display = 'none';
  }
}

/**
 * Update progress
 */
export function updateProgress(status, progress) {
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }

  // Update step indicators
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active', 'completed');
    const stepStatus = step.dataset.step;
    const statusOrder = ['CREATED', 'DOWNLOADING_AUDIO', 'ASR_TRANSCRIBING', 'CLEANING_TRANSCRIPT', 'GENERATING_COPY', 'DONE'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepStatus);

    if (stepIndex < currentIndex) {
      step.classList.add('completed');
    } else if (stepIndex === currentIndex) {
      step.classList.add('active');
    }
  });
}

/**
 * Show progress section
 */
export function showProgress() {
  const progressSection = document.getElementById('progressSection');
  if (progressSection) {
    progressSection.style.display = 'block';
  }
}

/**
 * Hide progress section
 */
export function hideProgress() {
  const progressSection = document.getElementById('progressSection');
  if (progressSection) {
    progressSection.style.display = 'none';
  }
}

/**
 * Set loading state
 */
export function setLoading(isLoading) {
  const generateBtn = document.getElementById('generateBtn');
  if (!generateBtn) return;

  const btnText = generateBtn.querySelector('.btn-text');
  const btnLoading = generateBtn.querySelector('.btn-loading');

  if (isLoading) {
    generateBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'inline';
    generateBtn.classList.add('loading');
  } else {
    generateBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
    generateBtn.classList.remove('loading');
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for global access
window.uiFunctions = {
  updateUIForLoggedInUser,
  updateUIForLoggedOutUser,
  displayResults,
  showError,
  hideError,
  updateProgress,
  showProgress,
  hideProgress,
  setLoading,
  escapeHtml
};

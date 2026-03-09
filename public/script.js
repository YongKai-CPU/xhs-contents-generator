/**
 * Xiaohongshu Content Generator - Frontend JavaScript v3.0
 * Hybrid UI with 3-version card layout and metadata display
 * 
 * With CSRF protection for API requests
 */

// State
let currentJobId = null;
let pollInterval = null;
let generatedData = null;
let csrfToken = null;

// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoading = generateBtn.querySelector('.btn-loading');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const resultsSection = document.getElementById('resultsSection');
const errorMessage = document.getElementById('errorMessage');
const toast = document.getElementById('toast');

// Summary elements
const summaryContent = document.getElementById('summaryContent');

// Version elements
const versionElements = {
  A: {
    meta: document.getElementById('metaA'),
    title: document.getElementById('titleA'),
    hook: document.getElementById('hookA'),
    body: document.getElementById('bodyA'),
    cta: document.getElementById('ctaA'),
    hashtags: document.getElementById('hashtagsA')
  },
  B: {
    meta: document.getElementById('metaB'),
    title: document.getElementById('titleB'),
    hook: document.getElementById('hookB'),
    body: document.getElementById('bodyB'),
    cta: document.getElementById('ctaB'),
    hashtags: document.getElementById('hashtagsB')
  },
  C: {
    meta: document.getElementById('metaC'),
    title: document.getElementById('titleC'),
    hook: document.getElementById('hookC'),
    body: document.getElementById('bodyC'),
    cta: document.getElementById('ctaC'),
    hashtags: document.getElementById('hashtagsC')
  }
};

/**
 * Fetch CSRF token from server
 */
async function fetchCSRFToken() {
  try {
    const response = await fetch('/csrf-token', {
      credentials: 'include'
    });
    const data = await response.json();
    csrfToken = data.token;
    return csrfToken;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Fetch CSRF token on page load
  await fetchCSRFToken();
  
  generateBtn.addEventListener('click', handleGenerate);

  // Allow Enter key to submit
  videoUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleGenerate();
    }
  });
});

// Handle Generate Button
async function handleGenerate() {
  const videoUrl = videoUrlInput.value.trim();

  if (!videoUrl) {
    showError('请输入视频链接');
    videoUrlInput.focus();
    return;
  }

  // Check if user is authenticated (optional - server will enforce)
  const authFunctions = window.authFunctions;
  if (authFunctions && !authFunctions.isAuthenticated()) {
    showError('请先登录以使用此功能 | Please log in to use this feature');
    return;
  }

  // Reset UI
  hideError();
  resultsSection.style.display = 'none';

  // Set loading state
  setLoading(true);

  try {
    // Ensure we have a CSRF token
    if (!csrfToken) {
      await fetchCSRFToken();
    }

    // Create job with CSRF token
    const response = await fetch('/api/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      credentials: 'include',
      body: JSON.stringify({
        videoUrl: videoUrl,
        options: {}
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || '创建任务失败');
    }

    // Handle cached result
    if (data.cached) {
      console.log('Using cached result');
      displayResults(data.output);
      setLoading(false);
      return;
    }

    // Start polling
    currentJobId = data.jobId;
    startPolling();

  } catch (error) {
    console.error('Generate error:', error);
    showError(error.message);
    setLoading(false);
  }
}

// Start Polling for Job Status
function startPolling() {
  progressSection.style.display = 'block';
  
  pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/jobs/${currentJobId}`);
      const job = await response.json();
      
      if (!response.ok) {
        throw new Error(job.error?.message || '获取状态失败');
      }
      
      // Update progress
      updateProgress(job.status, job.progress);
      
      // Handle completion
      if (job.status === 'DONE') {
        stopPolling();
        displayResults(job.output);
        setLoading(false);
      } else if (job.status === 'FAILED') {
        stopPolling();
        showError(job.error_message || '处理失败');
        setLoading(false);
      }
      
    } catch (error) {
      console.error('Polling error:', error);
      showError('轮询状态失败：' + error.message);
      stopPolling();
      setLoading(false);
    }
  }, 2000); // Poll every 2 seconds
}

// Stop Polling
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

// Update Progress UI
function updateProgress(status, progress) {
  progressFill.style.width = `${progress}%`;
  
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

// Display Results
function displayResults(output) {
  if (!output) {
    showError('无输出内容');
    return;
  }
  
  generatedData = output;
  
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
    summaryContent.innerHTML = summaryHTML;
  }
  
  // Display each card
  if (output.cards && Array.isArray(output.cards)) {
    output.cards.forEach((card, index) => {
      const key = index === 0 ? 'A' : index === 1 ? 'B' : 'C';
      const els = versionElements[key];
      
      if (card && els) {
        // Display metadata
        let metaHTML = '';
        if (card.key_takeaways && card.key_takeaways.length > 0) {
          metaHTML += '<div class="meta-section"><strong>💡 关键要点：</strong>' + 
            card.key_takeaways.map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('') + 
            '</div>';
        }
        if (card.target_audience && card.target_audience.length > 0) {
          metaHTML += '<div class="meta-section"><strong>👥 适合人群：</strong>' + 
            card.target_audience.map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('') + 
            '</div>';
        }
        if (card.caution && card.caution.length > 0) {
          metaHTML += '<div class="meta-section"><strong>⚠️ 注意事项：</strong>' + 
            card.caution.map(t => `<span class="meta-tag caution">${escapeHtml(t)}</span>`).join('') + 
            '</div>';
        }
        if (card.confidence || card.source_coverage) {
          metaHTML += '<div class="meta-section"><strong>📊 可信度：</strong>' + 
            `<span class="meta-score">内容忠实度 ${card.confidence || 0}%</span>` +
            `<span class="meta-score">信息覆盖 ${card.source_coverage || 0}%</span>` +
            '</div>';
        }
        els.meta.innerHTML = metaHTML;
        els.meta.style.display = 'block';
        
        // Title
        if (card.title) {
          els.title.textContent = card.title;
          els.title.style.display = 'block';
        } else {
          els.title.style.display = 'none';
        }
        
        // Hook
        if (card.hook) {
          els.hook.textContent = card.hook;
          els.hook.style.display = 'block';
        } else {
          els.hook.style.display = 'none';
        }
        
        // Body
        if (card.body) {
          els.body.textContent = card.body;
          els.body.style.display = 'block';
        } else {
          els.body.style.display = 'none';
        }
        
        // CTA
        if (card.cta) {
          els.cta.textContent = card.cta;
          els.cta.style.display = 'block';
        } else {
          els.cta.style.display = 'none';
        }
        
        // Hashtags
        if (card.hashtags && card.hashtags.length > 0) {
          els.hashtags.innerHTML = card.hashtags
            .map(tag => `<span class="hashtag-item">${escapeHtml(tag)}</span>`)
            .join('');
          els.hashtags.style.display = 'block';
        } else {
          els.hashtags.style.display = 'none';
        }
      }
    });
  }
  
  // Show results
  resultsSection.style.display = 'block';
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Copy Single Version
async function copyVersion(versionKey) {
  if (!generatedData || !generatedData.cards) return;
  
  const index = versionKey === 'A' ? 0 : versionKey === 'B' ? 1 : 2;
  const card = generatedData.cards[index];
  
  if (!card) return;
  
  let fullText = '';
  
  if (card.title) fullText += card.title + '\n\n';
  if (card.hook) fullText += (Array.isArray(card.hook) ? card.hook.join('\n') : card.hook) + '\n\n';
  if (card.body) fullText += card.body + '\n\n';
  if (card.cta) fullText += (Array.isArray(card.cta) ? card.cta.join('\n') : card.cta) + '\n';
  if (card.hashtags && card.hashtags.length > 0) {
    fullText += '\n' + card.hashtags.join(' ');
  }
  
  if (fullText) {
    await copyToClipboard(fullText);
    showToast(`${card.style} 已复制！`);
  }
}

// Copy All Versions
async function copyAllVersions() {
  if (!generatedData || !generatedData.cards) return;
  
  let fullText = '';
  
  generatedData.cards.forEach((card, index) => {
    if (card) {
      fullText += `\n=== ${card.style} ===\n\n`;
      if (card.title) fullText += card.title + '\n\n';
      if (card.hook) fullText += (Array.isArray(card.hook) ? card.hook.join('\n') : card.hook) + '\n\n';
      if (card.body) fullText += card.body + '\n\n';
      if (card.cta) fullText += (Array.isArray(card.cta) ? card.cta.join('\n') : card.cta) + '\n';
      if (card.hashtags && card.hashtags.length > 0) {
        fullText += '\n' + card.hashtags.join(' ') + '\n';
      }
    }
  });
  
  if (fullText) {
    await copyToClipboard(fullText.trim());
    showToast('全部 3 个版本已复制！');
  }
}

// Copy to Clipboard
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

// Show Toast
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// Show Error
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Hide Error
function hideError() {
  errorMessage.style.display = 'none';
}

// Set Loading State
function setLoading(isLoading) {
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

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

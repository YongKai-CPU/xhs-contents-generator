/**
 * Main Application
 * Initializes the app and handles user interactions
 */

import { initFirebaseAuth, loginWithGoogle, loginWithFacebook, logout } from './auth.js';
import { createJob, getJobStatus } from './api.js';
import { displayResults, showError, hideError, updateProgress, showProgress, hideProgress, setLoading } from './ui.js';

// State
let currentJobId = null;
let pollInterval = null;
let generatedData = null;

// DOM Elements
let videoUrlInput;
let generateBtn;
let btnText;
let btnLoading;
let progressSection;
let progressFill;
let resultsSection;
let errorMessage;

/**
 * Initialize the application
 */
export async function initApp() {
  // Get DOM elements
  videoUrlInput = document.getElementById('videoUrl');
  generateBtn = document.getElementById('generateBtn');
  btnText = generateBtn?.querySelector('.btn-text');
  btnLoading = generateBtn?.querySelector('.btn-loading');
  progressSection = document.getElementById('progressSection');
  progressFill = document.getElementById('progressFill');
  resultsSection = document.getElementById('resultsSection');
  errorMessage = document.getElementById('errorMessage');

  // Initialize Firebase Auth first
  await initFirebaseAuth();

  // Add login button listeners
  const googleBtn = document.getElementById('googleLoginBtn');
  const facebookBtn = document.getElementById('facebookLoginBtn');

  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await loginWithGoogle();
      } catch (error) {
        console.error('Google login failed:', error);
        showError('Google login failed: ' + error.message);
      }
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await loginWithFacebook();
      } catch (error) {
        console.error('Facebook login failed:', error);
        showError('Facebook login failed: ' + error.message);
      }
    });
  }

  // Add logout button listener
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await logout();
        console.log('Logged out successfully');
      } catch (error) {
        console.error('Logout failed:', error);
        showError('Logout failed: ' + error.message);
      }
    });
  }

  // Add event listeners
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  if (videoUrlInput) {
    videoUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleGenerate();
      }
    });
  }

  console.log('App initialized');
}

/**
 * Handle generate button click
 */
async function handleGenerate() {
  const videoUrl = videoUrlInput?.value.trim();

  console.log('[App] Generate button clicked');
  console.log('[App] Video URL:', videoUrl);

  if (!videoUrl) {
    console.error('[App] No video URL entered');
    showError('请输入视频链接');
    videoUrlInput?.focus();
    return;
  }

  // Check if user is authenticated
  const isAuthenticated = window.authFunctions?.isAuthenticated?.();
  console.log('[App] Is authenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.error('[App] User not authenticated');
    showError('请先登录以使用此功能 | Please log in to use this feature');
    return;
  }

  // Reset UI
  hideError();
  if (resultsSection) resultsSection.style.display = 'none';

  // Set loading state
  setLoading(true);
  console.log('[App] Loading state set');

  try {
    console.log('[App] Calling createJob...');
    // Create job
    const data = await createJob(videoUrl);
    console.log('[App] CreateJob response:', data);

    if (!data) {
      throw new Error('创建任务失败');
    }

    // Handle cached result
    if (data.cached) {
      console.log('Using cached result');
      displayResults(data.output);
      setLoading(false);
      return;
    }

    // Check if job is already complete (synchronous generation)
    if (data.status === 'DONE' && data.output) {
      console.log('Job completed synchronously');
      displayResults(data.output);
      setLoading(false);
      return;
    }

    // Handle failed job
    if (data.status === 'FAILED') {
      throw new Error(data.error_message || 'Generation failed');
    }

    // Start polling (for backward compatibility)
    currentJobId = data.jobId;
    console.log('[App] Starting polling for job:', currentJobId);
    startPolling();

  } catch (error) {
    console.error('[App] Generate error:', error);
    console.error('[App] Error stack:', error.stack);
    showError(error.message);
    setLoading(false);
  }
}

/**
 * Start polling for job status
 */
function startPolling() {
  showProgress();

  pollInterval = setInterval(async () => {
    try {
      const job = await getJobStatus(currentJobId);

      if (!job) {
        throw new Error('获取状态失败');
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

/**
 * Stop polling
 */
function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

/**
 * Copy version to clipboard
 */
export async function copyVersion(versionKey) {
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

/**
 * Copy all versions to clipboard
 */
export async function copyAllVersions() {
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

/**
 * Copy to clipboard
 */
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

/**
 * Show toast notification
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }
}

// Make functions available globally for HTML onclick handlers
window.copyVersion = copyVersion;
window.copyAllVersions = copyAllVersions;

// Store generated data
window.setGeneratedData = (data) => {
  generatedData = data;
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

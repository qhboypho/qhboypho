export function adminLoginHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>Đăng nhập Admin – QH Boypho</title>
<meta name="theme-color" content="#0f172a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QH Admin">
<link rel="manifest" href="/admin-manifest.webmanifest">
<link rel="icon" type="image/png" href="/qh-logo.png">
<link rel="apple-touch-icon" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Outfit', sans-serif; letter-spacing: -0.01em; }
  .login-bg { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); min-height: 100vh; }
  .glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
  .btn-login { background: linear-gradient(135deg, #e84393, #c0392b); transition: all 0.3s; }
  .btn-login:hover { opacity: 0.9; transform: scale(1.02); box-shadow: 0 10px 30px rgba(232,67,147,0.3); }
  .input-dark { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; }
  .input-dark::placeholder { color: rgba(255,255,255,0.4); }
  .input-dark:focus { border-color: #e84393; box-shadow: 0 0 0 3px rgba(232,67,147,0.15); outline: none; }
  .turnstile-box { display: flex; justify-content: center; min-height: 65px; }
  .turnstile-box.hidden { display: none; }
  body.login-bg { overflow: hidden; isolation: isolate; }
  body.login-bg > * { position: relative; z-index: 2147483646; }
  .login-shell { position: relative; z-index: 2147483647; pointer-events: auto; }
  #sidebarOverlay, .modal-overlay, .mobile-overlay { display: none !important; pointer-events: none !important; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.6s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
  .shake { animation: shake 0.5s ease; }
  @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .logo-spinner { position:relative; display:inline-flex; align-items:center; justify-content:center; }
  .logo-spinner::before { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; z-index:0; }
  .logo-spinner::after { content:''; position:absolute; inset:-3px; border-radius:50%; background:conic-gradient(from 0deg, #6366f1, #8b5cf6, #a855f7, #6366f1); animation: spinSlow 8s linear infinite; filter:blur(8px); opacity:0.6; z-index:0; }
  .logo-spinner img { position:relative; z-index:1; border-radius:50%; width:64px; height:64px; object-fit:cover; animation: spinSlow 12s linear infinite; background:white; }
</style>
</head>
<body class="login-bg flex items-center justify-center p-4">
  <div class="login-shell fade-up w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="flex flex-col items-center gap-3">
        <span class="logo-spinner">
          <img src="/qh-logo.png" alt="QH Boypho" class="rounded-full object-cover bg-white">
        </span>
        <h1 class="font-display text-3xl font-bold text-white"><span class="text-pink-400">Boypho</span></h1>
        <p class="text-gray-400 text-sm">Admin Panel</p>
      </div>
    </div>
    <!-- Login Card -->
    <div class="glass-card rounded-3xl p-8" id="loginCard">
      <h2 class="text-white text-xl font-bold mb-6 text-center">
        <i class="fas fa-lock text-pink-400 mr-2"></i>Đăng nhập quản trị
      </h2>
      <div id="loginError" class="hidden mb-4 bg-red-500/20 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl text-center">
        <i class="fas fa-exclamation-circle mr-1"></i><span id="loginErrorText"></span>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2"><i class="fas fa-user text-pink-400 mr-1"></i>Tên đăng nhập</label>
          <input type="text" id="loginUsername" placeholder="Nhập tên đăng nhập" class="input-dark w-full px-4 py-3 rounded-xl text-sm" autofocus>
        </div>
        <div>
          <label class="block text-gray-300 text-sm font-medium mb-2"><i class="fas fa-key text-pink-400 mr-1"></i>Mật khẩu</label>
          <div class="relative">
            <input type="password" id="loginPassword" placeholder="Nhập mật khẩu" class="input-dark w-full px-4 py-3 rounded-xl text-sm pr-10">
            <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-400 transition">
              <i id="togglePwIcon" class="fas fa-eye text-sm"></i>
            </button>
          </div>
        </div>
        <div id="adminTurnstileWrap" class="turnstile-box hidden">
          <div id="adminTurnstileWidget"></div>
        </div>
        <button onclick="doLogin()" id="loginBtn" class="btn-login w-full text-white py-3.5 rounded-xl font-bold text-sm mt-2">
          <i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập
        </button>
      </div>
    </div>
    <p class="text-center text-gray-500 text-xs mt-6">&copy; 2026 QH Boypho. All rights reserved.</p>
  </div>
<script>
  let adminTurnstileEnabled = false
  let adminTurnstileSiteKey = ''
  let adminTurnstileToken = ''
  let adminTurnstileWidgetId = null
  let adminTurnstileConfigPromise = null
  let adminTurnstileScriptPromise = null
  const ADMIN_TURNSTILE_LOCAL_TEST_SITE_KEY = '1x00000000000000000000AA'

  function isAdminTurnstileLocalDev() {
    return adminTurnstileSiteKey === ADMIN_TURNSTILE_LOCAL_TEST_SITE_KEY
  }

  function loadAdminTurnstileScript() {
    if (window.turnstile) return Promise.resolve()
    if (adminTurnstileScriptPromise) return adminTurnstileScriptPromise
    adminTurnstileScriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-turnstile-script="1"]')
      if (existing) {
        existing.addEventListener('load', resolve, { once: true })
        existing.addEventListener('error', reject, { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstileScript = '1'
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
    return adminTurnstileScriptPromise
  }

  async function loadAdminTurnstileConfig() {
    if (adminTurnstileConfigPromise) return adminTurnstileConfigPromise
    adminTurnstileConfigPromise = axios.get('/api/auth/turnstile-config')
      .then((res) => {
        const data = res.data?.data || {}
        adminTurnstileEnabled = data.enabled === true && !!data.site_key
        adminTurnstileSiteKey = adminTurnstileEnabled ? String(data.site_key || '') : ''
        return data
      })
      .catch(() => {
        adminTurnstileEnabled = false
        adminTurnstileSiteKey = ''
        return { enabled: false, site_key: '' }
      })
    return adminTurnstileConfigPromise
  }

  async function renderAdminTurnstile() {
    await loadAdminTurnstileConfig()
    const wrap = document.getElementById('adminTurnstileWrap')
    if (!wrap || !adminTurnstileEnabled || !adminTurnstileSiteKey) {
      if (wrap) wrap.classList.add('hidden')
      return
    }
    if (isAdminTurnstileLocalDev()) {
      wrap.classList.add('hidden')
      return
    }
    wrap.classList.remove('hidden')
    await loadAdminTurnstileScript()
    if (!window.turnstile || adminTurnstileWidgetId !== null) return
    const widget = document.getElementById('adminTurnstileWidget')
    if (!widget) return
    adminTurnstileWidgetId = window.turnstile.render(widget, {
      sitekey: adminTurnstileSiteKey,
      theme: 'dark',
      action: 'admin_login',
      callback: (token) => { adminTurnstileToken = token || '' },
      'expired-callback': () => { adminTurnstileToken = '' },
      'error-callback': () => { adminTurnstileToken = '' }
    })
  }

  function getAdminTurnstileToken() {
    return adminTurnstileEnabled ? adminTurnstileToken : ''
  }

  function resetAdminTurnstile() {
    adminTurnstileToken = ''
    if (window.turnstile && adminTurnstileWidgetId !== null) {
      try { window.turnstile.reset(adminTurnstileWidgetId) } catch (_) {}
    }
  }

  function sanitizeLoginSurface() {
    const loginShell = document.querySelector('.login-shell')
    document.documentElement.style.opacity = '1'
    document.documentElement.style.filter = 'none'
    document.documentElement.style.pointerEvents = 'auto'
    document.body.style.opacity = '1'
    document.body.style.filter = 'none'
    document.body.style.pointerEvents = ''
    document.body.style.overflow = 'hidden'
    if (loginShell instanceof HTMLElement) {
      loginShell.style.opacity = '1'
      loginShell.style.filter = 'none'
      loginShell.style.pointerEvents = 'auto'
    }
    document.querySelectorAll('#sidebarOverlay, .modal-overlay, .mobile-overlay').forEach((node) => {
      if (!(node instanceof HTMLElement)) return
      node.style.display = 'none'
      node.style.pointerEvents = 'none'
      node.classList.add('hidden')
      node.setAttribute('aria-hidden', 'true')
    })
    document.querySelectorAll('body > div, body > section, body > aside').forEach((node) => {
      if (!(node instanceof HTMLElement) || node.classList.contains('login-shell')) return
      const style = window.getComputedStyle(node)
      const isFullscreen = style.position === 'fixed' && style.inset === '0px'
      const coversViewport = node.clientWidth >= window.innerWidth - 4 && node.clientHeight >= window.innerHeight - 4
      if (!isFullscreen && !coversViewport) return
      node.style.display = 'none'
      node.style.pointerEvents = 'none'
      node.setAttribute('aria-hidden', 'true')
    })
  }

  sanitizeLoginSurface()
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/admin-sw.js', { scope: '/' }).catch(() => {})
    })
  }
  renderAdminTurnstile()
  window.addEventListener('load', sanitizeLoginSurface)
  window.addEventListener('pageshow', sanitizeLoginSurface)
  new MutationObserver(() => sanitizeLoginSurface()).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })

  document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin() })
  document.getElementById('loginUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('loginPassword').focus() })

  function togglePasswordVisibility() {
    const pw = document.getElementById('loginPassword')
    const icon = document.getElementById('togglePwIcon')
    if (pw.type === 'password') { pw.type = 'text'; icon.className = 'fas fa-eye-slash text-sm' }
    else { pw.type = 'password'; icon.className = 'fas fa-eye text-sm' }
  }

  async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim()
    const password = document.getElementById('loginPassword').value
    const errEl = document.getElementById('loginError')
    const errText = document.getElementById('loginErrorText')
    const btn = document.getElementById('loginBtn')
    const card = document.getElementById('loginCard')
    errEl.classList.add('hidden')
    if (!username || !password) {
      errText.textContent = 'Vui lòng nhập đầy đủ thông tin'
      errEl.classList.remove('hidden')
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
      return
    }
    btn.disabled = true
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Đang xử lý...'
    try {
      await renderAdminTurnstile()
      if (adminTurnstileEnabled && !getAdminTurnstileToken() && !isAdminTurnstileLocalDev()) {
        errText.textContent = 'Vui lòng xác minh bảo mật trước khi đăng nhập'
        errEl.classList.remove('hidden')
        return
      }
      await axios.post('/api/admin/login', { username, password, turnstile_token: getAdminTurnstileToken() })
      window.location.replace('/admin/dashboard')
    } catch (e) {
      const code = e?.response?.data?.error
      errText.textContent = code === 'TURNSTILE_REQUIRED' || code === 'TURNSTILE_INVALID'
        ? 'Xác minh bảo mật không hợp lệ, vui lòng thử lại'
        : 'Sai tên đăng nhập hoặc mật khẩu'
      errEl.classList.remove('hidden')
      resetAdminTurnstile()
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake')
    } finally {
      btn.disabled = false
      btn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập'
    }
  }
</script>
</body>
</html>`
}

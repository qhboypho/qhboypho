export function adminLoginHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Đăng nhập Admin – QH Clothes</title>
<link rel="icon" type="image/png" href="/qh-logo.png">
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Playfair Display', serif; }
  .login-bg { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%); min-height: 100vh; }
  .glass-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1); }
  .btn-login { background: linear-gradient(135deg, #e84393, #c0392b); transition: all 0.3s; }
  .btn-login:hover { opacity: 0.9; transform: scale(1.02); box-shadow: 0 10px 30px rgba(232,67,147,0.3); }
  .input-dark { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); color: white; }
  .input-dark::placeholder { color: rgba(255,255,255,0.4); }
  .input-dark:focus { border-color: #e84393; box-shadow: 0 0 0 3px rgba(232,67,147,0.15); outline: none; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.6s ease; }
  @keyframes shake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(8px)} 45%{transform:translateX(-6px)} 60%{transform:translateX(6px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
  .shake { animation: shake 0.5s ease; }
</style>
</head>
<body class="login-bg flex items-center justify-center p-4">
  <div class="fade-up w-full max-w-md">
    <!-- Logo -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center mx-auto mb-4 shadow-xl">
        <i class="fas fa-tshirt text-white text-2xl"></i>
      </div>
      <h1 class="font-display text-3xl font-bold text-white">QH<span class="text-pink-400">Clothes</span></h1>
      <p class="text-gray-400 mt-2 text-sm">Admin Panel</p>
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
        <button onclick="doLogin()" id="loginBtn" class="btn-login w-full text-white py-3.5 rounded-xl font-bold text-sm mt-2">
          <i class="fas fa-sign-in-alt mr-2"></i>Đăng nhập
        </button>
      </div>
    </div>
    <p class="text-center text-gray-500 text-xs mt-6">&copy; 2026 QH Clothes. All rights reserved.</p>
  </div>
<script>
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
      await axios.post('/api/admin/login', { username, password })
      window.location.href = '/admin/dashboard'
    } catch (e) {
      errText.textContent = 'Sai tên đăng nhập hoặc mật khẩu'
      errEl.classList.remove('hidden')
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

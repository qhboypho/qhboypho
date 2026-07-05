export function privacyPolicyHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chính sách bảo mật - QH Boypho</title>
  <meta name="description" content="Chính sách bảo mật của QH Boypho: thông tin thu thập, mục đích sử dụng, thời gian lưu trữ và quyền của khách hàng.">
  <link rel="icon" type="image/png" href="/qh-logo.png">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    * { box-sizing: border-box; }
    body { font-family: 'Inter', sans-serif; background: #070b16; color: #e5e7eb; }
    h1, h2, .font-display { font-family: 'Be Vietnam Pro', 'Inter', sans-serif; letter-spacing: -0.015em; }
    .policy-shell { background: radial-gradient(circle at 18% 6%, rgba(56,189,248,0.16), transparent 30%), radial-gradient(circle at 86% 0%, rgba(236,72,153,0.16), transparent 28%), linear-gradient(180deg, #070b16 0%, #0b1020 48%, #070b16 100%); }
    .policy-panel { background: rgba(15,23,42,0.72); border: 1px solid rgba(148,163,184,0.18); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 80px rgba(0,0,0,0.28); }
    .policy-section { border-top: 1px solid rgba(148,163,184,0.14); padding-top: 1.5rem; }
    .policy-section:first-child { border-top: 0; padding-top: 0; }
    .policy-section p, .policy-section li { color: rgba(203,213,225,0.92); line-height: 1.78; }
    .policy-section li + li { margin-top: 0.45rem; }
    .policy-marker { color: #f472b6; }
    .policy-callout { background: rgba(56,189,248,0.08); border: 1px solid rgba(125,211,252,0.2); }
    @media (max-width: 640px) {
      .policy-panel { border-left: 0; border-right: 0; border-radius: 0; }
    }
  </style>
</head>
<body>
  <main class="policy-shell min-h-[100dvh]">
    <header class="border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <a href="/" class="inline-flex items-center gap-2 text-white">
          <img src="/qh-logo.png" alt="QH Boypho" class="h-10 w-10 rounded-full bg-white object-cover">
          <span class="font-display text-xl font-extrabold"><span class="text-pink-400">Boypho</span></span>
        </a>
        <a href="/" class="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-pink-300/50 hover:text-white">
          <i class="fas fa-arrow-left"></i>
          Về trang chủ
        </a>
      </div>
    </header>

    <section class="mx-auto max-w-6xl px-4 pb-14 pt-10 md:pb-20 md:pt-16">
      <div class="mb-8 max-w-3xl">
        <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-sky-200">
          <i class="fas fa-lock"></i>
          QH Boypho
        </p>
        <h1 class="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">Chính sách bảo mật</h1>
        <p class="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">Tại QH Boypho, chúng tôi tôn trọng và cam kết bảo vệ thông tin cá nhân của khách hàng khi mua sắm trên website.</p>
      </div>

      <article class="policy-panel overflow-hidden rounded-[2rem] p-5 md:p-8">
        <div class="policy-callout mb-7 rounded-3xl p-4 md:p-5">
          <div class="flex gap-3">
            <span class="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sky-400/15 text-sky-200">
              <i class="fas fa-shield-halved"></i>
            </span>
            <p class="text-sm leading-7 text-slate-200 md:text-base">Thông tin khách hàng chỉ được dùng trong phạm vi xử lý đơn hàng, giao nhận và hỗ trợ sau mua. Shop không sử dụng dữ liệu cá nhân cho mục đích không liên quan đến việc bán hàng và chăm sóc khách hàng.</p>
          </div>
        </div>

        <div class="space-y-8">
          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">1.</span> Thông tin chúng tôi thu thập</h2>
            <p>Khi khách đặt hàng, shop có thể thu thập một số thông tin cần thiết như:</p>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Họ tên.</li>
              <li>Số điện thoại.</li>
              <li>Địa chỉ nhận hàng.</li>
              <li>Thông tin sản phẩm đã đặt.</li>
            </ul>
            <p class="mt-3">Những thông tin này chỉ được dùng để xử lý đơn hàng và hỗ trợ khách hàng khi cần.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">2.</span> Mục đích sử dụng thông tin</h2>
            <p>Thông tin của khách hàng được sử dụng để:</p>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Xác nhận và giao đơn hàng.</li>
              <li>Liên hệ khi cần hỗ trợ.</li>
              <li>Cập nhật tình trạng đơn hàng.</li>
              <li>Chăm sóc khách hàng sau mua.</li>
            </ul>
            <p class="mt-3">Shop không sử dụng thông tin của khách vào mục đích không liên quan đến việc bán hàng và hỗ trợ khách hàng.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">3.</span> Bảo mật thông tin khách hàng</h2>
            <p>Chúng tôi cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ khi cần thiết cho đơn vị vận chuyển để giao hàng hoặc theo yêu cầu của cơ quan có thẩm quyền.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">4.</span> Thời gian lưu trữ thông tin</h2>
            <p>Thông tin đơn hàng sẽ được lưu trữ trong thời gian cần thiết để phục vụ việc xử lý đơn, bảo hành, đổi trả hoặc hỗ trợ khách hàng.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">5.</span> Quyền của khách hàng</h2>
            <p>Khách hàng có quyền yêu cầu kiểm tra, chỉnh sửa hoặc xoá thông tin cá nhân bằng cách liên hệ với shop qua kênh hỗ trợ trên website.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">6.</span> Cam kết của shop</h2>
            <p>QH Boypho luôn cố gắng bảo vệ thông tin khách hàng an toàn và minh bạch. Việc khách đặt hàng trên website đồng nghĩa với việc khách đã đồng ý với chính sách bảo mật này.</p>
            <p class="mt-3">Nếu có thắc mắc về chính sách bảo mật, khách vui lòng liên hệ với shop để được hỗ trợ.</p>
          </section>
        </div>
      </article>
    </section>
  </main>
</body>
</html>`
}

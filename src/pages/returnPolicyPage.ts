export function returnPolicyHTML(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chính sách đổi trả - QH Boypho</title>
  <meta name="description" content="Chính sách đổi trả của QH Boypho: thời gian hỗ trợ, điều kiện đổi trả, chi phí và quy trình xử lý.">
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
    .policy-callout { background: rgba(236,72,153,0.08); border: 1px solid rgba(244,114,182,0.2); }
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
        <p class="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-pink-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-pink-200">
          <i class="fas fa-rotate-left"></i>
          QH Boypho
        </p>
        <h1 class="font-display text-4xl font-extrabold leading-tight text-white md:text-6xl">Chính sách đổi trả</h1>
        <p class="mt-5 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">Tại QH Boypho, chúng tôi luôn mong muốn khách hàng nhận được sản phẩm ưng ý nhất với mức giá tốt hơn khi mua trực tiếp tại website, không qua sàn thương mại điện tử.</p>
      </div>

      <article class="policy-panel overflow-hidden rounded-[2rem] p-5 md:p-8">
        <div class="policy-callout mb-7 rounded-3xl p-4 md:p-5">
          <div class="flex gap-3">
            <span class="mt-0.5 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-pink-400/15 text-pink-200">
              <i class="fas fa-shield-halved"></i>
            </span>
            <p class="text-sm leading-7 text-slate-200 md:text-base">Vì là kênh bán hàng riêng, chúng tôi tối ưu được nhiều chi phí trung gian để mang đến giá bán dễ chịu hơn cho khách. Đồng thời, shop vẫn có chính sách đổi trả rõ ràng, minh bạch để khách hàng yên tâm khi đặt mua.</p>
          </div>
        </div>

        <div class="space-y-8">
          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">1.</span> Thời gian hỗ trợ đổi trả</h2>
            <p>Shop hỗ trợ đổi hoặc trả sản phẩm trong vòng <strong class="text-white">3 ngày</strong> kể từ khi khách nhận hàng.</p>
            <p class="mt-3">Khách vui lòng kiểm tra sản phẩm ngay khi nhận được hàng. Nếu có vấn đề phát sinh, hãy liên hệ với shop sớm để được hỗ trợ nhanh nhất.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">2.</span> Các trường hợp được hỗ trợ đổi trả</h2>
            <p>Shop hỗ trợ đổi trả trong các trường hợp sau:</p>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Sản phẩm bị lỗi do nhà sản xuất.</li>
              <li>Sản phẩm bị rách, bung chỉ, lỗi form hoặc lỗi kỹ thuật.</li>
              <li>Shop gửi nhầm mẫu, nhầm màu hoặc nhầm size so với đơn đặt hàng.</li>
              <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển.</li>
              <li>Khách nhận hàng nhưng sản phẩm không đúng với mô tả cơ bản trên website.</li>
            </ul>
            <p class="mt-3">Trong các trường hợp lỗi từ shop, chúng tôi sẽ hỗ trợ xử lý nhanh chóng để khách hàng không bị thiệt.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">3.</span> Điều kiện sản phẩm khi đổi trả</h2>
            <p>Sản phẩm cần đáp ứng các điều kiện sau:</p>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Sản phẩm chưa qua sử dụng, chưa giặt, chưa có mùi lạ.</li>
              <li>Sản phẩm còn nguyên tem, tag, bao bì nếu có.</li>
              <li>Không bị dính bẩn, hư hỏng do quá trình sử dụng hoặc bảo quản từ phía khách hàng.</li>
              <li>Khách có hình ảnh hoặc video mở hàng để shop dễ kiểm tra và hỗ trợ.</li>
            </ul>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">4.</span> Trường hợp không hỗ trợ đổi trả</h2>
            <p>Shop rất mong khách thông cảm, chúng tôi chưa thể hỗ trợ đổi trả trong các trường hợp:</p>
            <ul class="mt-3 list-disc space-y-1 pl-5">
              <li>Khách đặt nhầm size, nhầm màu hoặc đổi ý sau khi nhận hàng.</li>
              <li>Sản phẩm đã qua sử dụng, đã giặt hoặc bị hư hỏng do khách hàng.</li>
              <li>Sản phẩm không còn đầy đủ tem, tag hoặc bao bì ban đầu.</li>
              <li>Khách báo đổi trả quá thời gian quy định.</li>
              <li>Sản phẩm thuộc chương trình xả kho, sale sâu hoặc được ghi rõ “không áp dụng đổi trả”.</li>
            </ul>
            <p class="mt-3">Tuy nhiên, nếu khách gặp vấn đề đặc biệt, hãy nhắn cho shop. Chúng tôi sẽ cố gắng xem xét và hỗ trợ trong khả năng tốt nhất.</p>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">5.</span> Chi phí đổi trả</h2>
            <ul class="list-disc space-y-1 pl-5">
              <li>Nếu lỗi đến từ shop hoặc sản phẩm bị lỗi sản xuất: shop chịu chi phí đổi trả.</li>
              <li>Nếu khách muốn đổi size hoặc đổi mẫu theo nhu cầu cá nhân, chi phí vận chuyển hai chiều sẽ do khách hàng thanh toán.</li>
              <li>Với các trường hợp cần hoàn tiền, shop sẽ xử lý sau khi nhận lại sản phẩm và kiểm tra tình trạng hàng.</li>
            </ul>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">6.</span> Quy trình đổi trả</h2>
            <p>Để được hỗ trợ đổi trả, khách vui lòng làm theo các bước sau:</p>
            <ol class="mt-3 list-decimal space-y-1 pl-5">
              <li>Liên hệ với shop qua kênh hỗ trợ trên website hoặc fanpage.</li>
              <li>Gửi thông tin đơn hàng kèm hình ảnh hoặc video sản phẩm gặp vấn đề.</li>
              <li>Shop kiểm tra và phản hồi phương án xử lý.</li>
              <li>Khách gửi lại sản phẩm theo hướng dẫn của shop.</li>
              <li>Sau khi nhận và kiểm tra sản phẩm, shop sẽ tiến hành đổi sản phẩm mới hoặc hoàn tiền theo thỏa thuận.</li>
            </ol>
          </section>

          <section class="policy-section">
            <h2 class="mb-3 flex items-center gap-2 text-xl font-extrabold text-white"><span class="policy-marker">7.</span> Cam kết của shop</h2>
            <p>Chúng tôi hiểu rằng mua hàng online cần sự tin tưởng. Vì vậy, shop luôn cố gắng mô tả sản phẩm rõ ràng, tư vấn size kỹ càng và hỗ trợ khách hàng tận tình trước cũng như sau khi mua.</p>
            <p class="mt-3">Mua trực tiếp tại website giúp khách có mức giá tốt hơn so với khi mua qua sàn, nhưng shop vẫn giữ cam kết bán hàng uy tín, hỗ trợ rõ ràng và đặt trải nghiệm của khách hàng lên hàng đầu.</p>
            <p class="mt-3">Nếu có bất kỳ thắc mắc nào về sản phẩm hoặc chính sách đổi trả, khách vui lòng liên hệ với shop để được hỗ trợ nhanh nhất.</p>
          </section>
        </div>
      </article>
    </section>
  </main>
</body>
</html>`
}

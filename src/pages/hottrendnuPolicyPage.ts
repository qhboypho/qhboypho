type PolicySection = {
  title: string
  body: string
}

type HotTrendNuPolicyConfig = {
  kind: 'return' | 'privacy' | 'payment' | 'shipping'
  title: string
  description: string
  badgeIcon: string
  badgeText: string
  lead: string
  calloutIcon: string
  callout: string
  sections: PolicySection[]
}

const returnPolicySections: PolicySection[] = [
  {
    title: 'Thời gian hỗ trợ đổi trả',
    body: `
      <p>Shop hỗ trợ đổi hoặc trả sản phẩm trong vòng <strong>3 ngày</strong> kể từ khi khách nhận hàng.</p>
      <p>Khách vui lòng kiểm tra sản phẩm ngay khi nhận được hàng. Nếu có vấn đề phát sinh, hãy liên hệ với shop sớm để được hỗ trợ nhanh nhất.</p>
    `,
  },
  {
    title: 'Các trường hợp được hỗ trợ đổi trả',
    body: `
      <p>Shop hỗ trợ đổi trả trong các trường hợp sau:</p>
      <ul>
        <li>Sản phẩm bị lỗi do nhà sản xuất.</li>
        <li>Sản phẩm bị rách, bung chỉ, lỗi form hoặc lỗi kỹ thuật.</li>
        <li>Shop gửi nhầm mẫu, nhầm màu hoặc nhầm size so với đơn đặt hàng.</li>
        <li>Sản phẩm bị hư hỏng trong quá trình vận chuyển.</li>
        <li>Khách nhận hàng nhưng sản phẩm không đúng với mô tả cơ bản trên website.</li>
      </ul>
      <p>Trong các trường hợp lỗi từ shop, chúng tôi sẽ hỗ trợ xử lý nhanh chóng để khách hàng không bị thiệt.</p>
    `,
  },
  {
    title: 'Điều kiện sản phẩm khi đổi trả',
    body: `
      <p>Sản phẩm cần đáp ứng các điều kiện sau:</p>
      <ul>
        <li>Sản phẩm chưa qua sử dụng, chưa giặt, chưa có mùi lạ.</li>
        <li>Sản phẩm còn nguyên tem, tag, bao bì nếu có.</li>
        <li>Không bị dính bẩn, hư hỏng do quá trình sử dụng hoặc bảo quản từ phía khách hàng.</li>
        <li>Khách có hình ảnh hoặc video mở hàng để shop dễ kiểm tra và hỗ trợ.</li>
      </ul>
    `,
  },
  {
    title: 'Trường hợp không hỗ trợ đổi trả',
    body: `
      <p>Shop rất mong khách thông cảm, chúng tôi chưa thể hỗ trợ đổi trả trong các trường hợp:</p>
      <ul>
        <li>Khách đặt nhầm size, nhầm màu hoặc đổi ý sau khi nhận hàng.</li>
        <li>Sản phẩm đã qua sử dụng, đã giặt hoặc bị hư hỏng do khách hàng.</li>
        <li>Sản phẩm không còn đầy đủ tem, tag hoặc bao bì ban đầu.</li>
        <li>Khách báo đổi trả quá thời gian quy định.</li>
        <li>Sản phẩm thuộc chương trình xả kho, sale sâu hoặc được ghi rõ "không áp dụng đổi trả".</li>
      </ul>
      <p>Tuy nhiên, nếu khách gặp vấn đề đặc biệt, hãy nhắn cho shop. Chúng tôi sẽ cố gắng xem xét và hỗ trợ trong khả năng tốt nhất.</p>
    `,
  },
  {
    title: 'Chi phí đổi trả',
    body: `
      <ul>
        <li>Nếu lỗi đến từ shop hoặc sản phẩm bị lỗi sản xuất: shop chịu chi phí đổi trả.</li>
        <li>Nếu khách muốn đổi size hoặc đổi mẫu theo nhu cầu cá nhân, chi phí vận chuyển hai chiều sẽ do khách hàng thanh toán.</li>
        <li>Với các trường hợp cần hoàn tiền, shop sẽ xử lý sau khi nhận lại sản phẩm và kiểm tra tình trạng hàng.</li>
      </ul>
    `,
  },
  {
    title: 'Quy trình đổi trả',
    body: `
      <p>Để được hỗ trợ đổi trả, khách vui lòng làm theo các bước sau:</p>
      <ol>
        <li>Liên hệ với shop qua kênh hỗ trợ trên website hoặc fanpage.</li>
        <li>Gửi thông tin đơn hàng kèm hình ảnh hoặc video sản phẩm gặp vấn đề.</li>
        <li>Shop kiểm tra và phản hồi phương án xử lý.</li>
        <li>Khách gửi lại sản phẩm theo hướng dẫn của shop.</li>
        <li>Sau khi nhận và kiểm tra sản phẩm, shop sẽ tiến hành đổi sản phẩm mới hoặc hoàn tiền theo thỏa thuận.</li>
      </ol>
    `,
  },
  {
    title: 'Cam kết của shop',
    body: `
      <p>Chúng tôi hiểu rằng mua hàng online cần sự tin tưởng. Vì vậy, shop luôn cố gắng mô tả sản phẩm rõ ràng, tư vấn size kỹ càng và hỗ trợ khách hàng tận tình trước cũng như sau khi mua.</p>
      <p>Mua trực tiếp tại website giúp khách có mức giá tốt hơn so với khi mua qua sàn, nhưng shop vẫn giữ cam kết bán hàng uy tín, hỗ trợ rõ ràng và đặt trải nghiệm của khách hàng lên hàng đầu.</p>
      <p>Nếu có bất kỳ thắc mắc nào về sản phẩm hoặc chính sách đổi trả, khách vui lòng liên hệ với shop để được hỗ trợ nhanh nhất.</p>
    `,
  },
]

const privacyPolicySections: PolicySection[] = [
  {
    title: 'Thông tin chúng tôi thu thập',
    body: `
      <p>Khi khách đặt hàng, shop có thể thu thập một số thông tin cần thiết như:</p>
      <ul>
        <li>Họ tên.</li>
        <li>Số điện thoại.</li>
        <li>Địa chỉ nhận hàng.</li>
        <li>Thông tin sản phẩm đã đặt.</li>
      </ul>
      <p>Những thông tin này chỉ được dùng để xử lý đơn hàng và hỗ trợ khách hàng khi cần.</p>
    `,
  },
  {
    title: 'Mục đích sử dụng thông tin',
    body: `
      <p>Thông tin của khách hàng được sử dụng để:</p>
      <ul>
        <li>Xác nhận và giao đơn hàng.</li>
        <li>Liên hệ khi cần hỗ trợ.</li>
        <li>Cập nhật tình trạng đơn hàng.</li>
        <li>Chăm sóc khách hàng sau mua.</li>
      </ul>
      <p>Shop không sử dụng thông tin của khách vào mục đích không liên quan đến việc bán hàng và hỗ trợ khách hàng.</p>
    `,
  },
  {
    title: 'Bảo mật thông tin khách hàng',
    body: '<p>Chúng tôi cam kết không bán, trao đổi hoặc chia sẻ thông tin cá nhân của khách hàng cho bên thứ ba, trừ khi cần thiết cho đơn vị vận chuyển để giao hàng hoặc theo yêu cầu của cơ quan có thẩm quyền.</p>',
  },
  {
    title: 'Thời gian lưu trữ thông tin',
    body: '<p>Thông tin đơn hàng sẽ được lưu trữ trong thời gian cần thiết để phục vụ việc xử lý đơn, bảo hành, đổi trả hoặc hỗ trợ khách hàng.</p>',
  },
  {
    title: 'Quyền của khách hàng',
    body: '<p>Khách hàng có quyền yêu cầu kiểm tra, chỉnh sửa hoặc xoá thông tin cá nhân bằng cách liên hệ với shop qua kênh hỗ trợ trên website.</p>',
  },
  {
    title: 'Cam kết của shop',
    body: `
      <p>QH Clothes luôn cố gắng bảo vệ thông tin khách hàng an toàn và minh bạch. Việc khách đặt hàng trên website đồng nghĩa với việc khách đã đồng ý với chính sách bảo mật này.</p>
      <p>Nếu có thắc mắc về chính sách bảo mật, khách vui lòng liên hệ với shop để được hỗ trợ.</p>
    `,
  },
]

const paymentPolicySections: PolicySection[] = [
  {
    title: 'Hình thức thanh toán',
    body: `
      <p>Để mang đến sự thuận tiện cho khách hàng, QH Clothes hỗ trợ các hình thức thanh toán sau:</p>
      <ol>
        <li>
          <strong>Thanh toán khi nhận hàng (COD)</strong>
          <p>Khách hàng thanh toán trực tiếp cho đơn vị vận chuyển khi nhận được hàng.</p>
          <p>Vui lòng kiểm tra đúng sản phẩm trước khi thanh toán.</p>
        </li>
        <li>
          <strong>Chuyển khoản ngân hàng</strong>
          <p>Khách hàng có thể thanh toán trước qua tài khoản ngân hàng theo thông tin được cung cấp sau khi đặt hàng.</p>
          <p>Sau khi chuyển khoản thành công, đơn hàng sẽ được xác nhận và tiến hành đóng gói, giao đến khách hàng.</p>
        </li>
      </ol>
    `,
  },
  {
    title: 'Xác nhận đơn hàng',
    body: `
      <p>Sau khi đặt hàng thành công:</p>
      <ul>
        <li>Hệ thống sẽ gửi thông tin xác nhận đơn hàng.</li>
        <li>Nhân viên có thể liên hệ để xác nhận thông tin trong một số trường hợp cần thiết.</li>
        <li>Đơn hàng chỉ được xử lý sau khi thông tin được xác nhận đầy đủ.</li>
      </ul>
    `,
  },
  {
    title: 'Giá bán',
    body: `
      <ul>
        <li>Giá sản phẩm hiển thị trên website là giá bán lẻ chính thức.</li>
        <li>Giá chưa bao gồm phí vận chuyển (nếu có).</li>
        <li>Phí vận chuyển sẽ được hiển thị rõ trước khi khách hàng xác nhận đặt hàng.</li>
      </ul>
    `,
  },
  {
    title: 'Thanh toán an toàn',
    body: `
      <p>QH Clothes cam kết:</p>
      <ul>
        <li>Không lưu trữ thông tin tài khoản ngân hàng hoặc thông tin thanh toán của khách hàng.</li>
        <li>Mọi giao dịch đều được thực hiện thông qua các kênh thanh toán an toàn.</li>
      </ul>
    `,
  },
  {
    title: 'Hoàn tiền',
    body: `
      <p>Trong trường hợp đơn hàng đủ điều kiện hoàn tiền theo Chính sách đổi trả, số tiền sẽ được hoàn theo phương thức thanh toán ban đầu hoặc theo thỏa thuận với khách hàng.</p>
    `,
  },
]

const shippingPolicySections: PolicySection[] = [
  {
    title: 'Phạm vi giao hàng',
    body: '<p>QH Clothes hỗ trợ giao hàng trên toàn quốc thông qua các đơn vị vận chuyển uy tín.</p>',
  },
  {
    title: 'Thời gian giao hàng',
    body: `
      <p>Thời gian giao hàng dự kiến:</p>
      <div class="policy-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Khu vực</th>
              <th>Thời gian</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nội thành</td>
              <td>1-3 ngày làm việc</td>
            </tr>
            <tr>
              <td>Tỉnh thành khác</td>
              <td>2-5 ngày làm việc</td>
            </tr>
            <tr>
              <td>Khu vực vùng sâu, vùng xa</td>
              <td>3-7 ngày làm việc</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>Thời gian có thể thay đổi do:</p>
      <ul>
        <li>Thời tiết.</li>
        <li>Lễ, Tết.</li>
        <li>Đơn vị vận chuyển.</li>
        <li>Các yếu tố khách quan khác.</li>
      </ul>
    `,
  },
  {
    title: 'Phí vận chuyển',
    body: `
      <ul>
        <li>Phí vận chuyển được tính theo địa chỉ nhận hàng và chính sách của đơn vị vận chuyển.</li>
        <li>Mức phí sẽ được hiển thị trước khi khách hàng xác nhận đặt hàng.</li>
      </ul>
    `,
  },
  {
    title: 'Kiểm tra hàng khi nhận',
    body: `
      <p>Khách hàng được khuyến khích:</p>
      <ul>
        <li>Kiểm tra tình trạng gói hàng.</li>
        <li>Kiểm tra đúng mẫu mã, màu sắc, kích thước đã đặt.</li>
      </ul>
      <p>Nếu phát hiện sản phẩm bị:</p>
      <ul>
        <li>Sai mẫu.</li>
        <li>Thiếu sản phẩm.</li>
        <li>Hư hỏng do vận chuyển.</li>
      </ul>
      <p>Vui lòng liên hệ với QH Clothes ngay sau khi nhận hàng để được hỗ trợ nhanh nhất.</p>
    `,
  },
  {
    title: 'Trường hợp giao hàng không thành công',
    body: `
      <p>Đơn hàng có thể bị hủy trong các trường hợp:</p>
      <ul>
        <li>Không liên hệ được với khách hàng.</li>
        <li>Sai địa chỉ nhận hàng.</li>
        <li>Khách hàng từ chối nhận hàng.</li>
        <li>Đơn vị vận chuyển giao nhiều lần nhưng không thành công.</li>
      </ul>
    `,
  },
  {
    title: 'Theo dõi đơn hàng',
    body: '<p>Sau khi đơn hàng được bàn giao cho đơn vị vận chuyển, khách hàng có thể theo dõi trạng thái giao hàng thông qua mã vận đơn được cung cấp.</p>',
  },
  {
    title: 'Lưu ý',
    body: `
      <ul>
        <li>Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng chính xác để quá trình giao hàng diễn ra thuận lợi.</li>
        <li>Trong trường hợp có phát sinh chậm trễ, QH Clothes sẽ chủ động thông báo đến khách hàng trong thời gian sớm nhất.</li>
      </ul>
    `,
  },
]

function renderPolicySections(sections: PolicySection[]): string {
  return sections.map((section, index) => `
    <section class="policy-section">
      <h2><span>${index + 1}.</span> ${section.title}</h2>
      ${section.body}
    </section>
  `).join('')
}

function hotTrendNuPolicyHTML(config: HotTrendNuPolicyConfig): string {
  const canonicalPathByKind: Record<HotTrendNuPolicyConfig['kind'], string> = {
    return: '/hottrendnu/chinh-sach-doi-tra',
    privacy: '/hottrendnu/chinh-sach-bao-mat',
    payment: '/hottrendnu/chinh-sach-thanh-toan',
    shipping: '/hottrendnu/chinh-sach-van-chuyen',
  }
  const canonicalPath = canonicalPathByKind[config.kind]
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title} - QH Clothes</title>
  <meta name="description" content="${config.description}">
  <link rel="canonical" href="${canonicalPath}">
  <link rel="icon" type="image/png" href="/qh-logo.png">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@500;600;700;800&family=Cormorant+Garamond:wght@500;600;700&display=swap');
    :root {
      --qhher-bg: #FFF7F8;
      --qhher-surface: #FCEEEF;
      --qhher-card: #FFFFFF;
      --qhher-text: #2B2024;
      --qhher-muted: #7B6870;
      --qhher-rose: #C94F7C;
      --qhher-sale: #E84D6A;
      --qhher-border: #F3DDE4;
      --qhher-chip: #F9E3EA;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Be Vietnam Pro', system-ui, sans-serif;
      background:
        radial-gradient(circle at 12% 0%, rgba(253,229,236,0.95), transparent 28%),
        radial-gradient(circle at 88% 4%, rgba(252,238,239,0.95), transparent 32%),
        linear-gradient(180deg, var(--qhher-bg) 0%, #fff 54%, var(--qhher-bg) 100%);
      color: var(--qhher-text);
    }
    .policy-header {
      position: sticky;
      top: 0;
      z-index: 20;
      border-bottom: 1px solid var(--qhher-border);
      background: rgba(255, 247, 248, 0.88);
      backdrop-filter: blur(18px);
      box-shadow: 0 10px 30px rgba(201, 79, 124, 0.08);
    }
    .policy-logo {
      font-family: 'Cormorant Garamond', serif;
      color: var(--qhher-rose);
      font-size: clamp(2rem, 5vw, 2.65rem);
      font-weight: 700;
      line-height: 1;
      letter-spacing: -0.03em;
    }
    .policy-back {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      border: 1px solid var(--qhher-border);
      border-radius: 999px;
      padding: 0.72rem 1rem;
      background: var(--qhher-card);
      color: var(--qhher-text);
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: transform 0.2s ease, border-color 0.2s ease, color 0.2s ease;
    }
    .policy-back:hover {
      transform: translateY(-1px);
      border-color: rgba(201, 79, 124, 0.4);
      color: var(--qhher-rose);
    }
    .policy-shell {
      min-height: 100dvh;
      overflow: hidden;
      position: relative;
    }
    .policy-shell::before {
      content: "";
      position: fixed;
      inset: auto -10rem -16rem auto;
      width: 34rem;
      height: 34rem;
      pointer-events: none;
      border-radius: 999px;
      background: radial-gradient(circle, rgba(232, 77, 106, 0.13), transparent 66%);
    }
    .policy-hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 72rem;
      margin: 0 auto;
      padding: clamp(3.25rem, 7vw, 6rem) 1rem 1.6rem;
      text-align: center;
    }
    .policy-kicker {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      border: 1px solid var(--qhher-border);
      border-radius: 999px;
      padding: 0.52rem 0.82rem;
      background: rgba(255,255,255,0.76);
      color: var(--qhher-rose);
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .policy-hero h1 {
      margin: 1.15rem auto 0;
      max-width: 52rem;
      color: var(--qhher-text);
      font-size: clamp(2rem, 5.5vw, 4.25rem);
      font-weight: 900;
      letter-spacing: -0.035em;
      line-height: 1.08;
    }
    .policy-lead {
      max-width: 47rem;
      margin: 1.2rem auto 0;
      color: var(--qhher-muted);
      font-size: clamp(0.98rem, 2vw, 1.13rem);
      line-height: 1.85;
    }
    .policy-panel {
      max-width: 72rem;
      margin: 1.25rem auto 0;
      padding: 0 1rem 4rem;
    }
    .policy-card {
      border: 1px solid var(--qhher-border);
      border-radius: 1.6rem;
      background: rgba(255,255,255,0.9);
      box-shadow: 0 24px 70px rgba(201, 79, 124, 0.1);
      overflow: hidden;
    }
    .policy-callout {
      display: flex;
      gap: 1rem;
      margin: 1rem;
      padding: 1rem;
      border: 1px solid var(--qhher-border);
      border-radius: 1.1rem;
      background: linear-gradient(135deg, rgba(249,227,234,0.92), rgba(255,247,248,0.96));
    }
    .policy-callout-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 2.4rem;
      height: 2.4rem;
      border-radius: 999px;
      background: var(--qhher-rose);
      color: #fff;
      box-shadow: 0 10px 22px rgba(201,79,124,0.2);
    }
    .policy-callout p {
      margin: 0;
      color: var(--qhher-text);
      font-size: 0.95rem;
      line-height: 1.8;
    }
    .policy-content {
      display: grid;
      gap: 0;
      min-width: 0;
      padding: 0 1.25rem 1.25rem;
    }
    .policy-section {
      min-width: 0;
      padding: 1.55rem 0;
      border-top: 1px solid var(--qhher-border);
    }
    .policy-section h2 {
      display: flex;
      align-items: baseline;
      gap: 0.55rem;
      margin: 0 0 0.75rem;
      color: var(--qhher-text);
      font-size: clamp(1.05rem, 2vw, 1.24rem);
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .policy-section h2 span {
      color: var(--qhher-sale);
      font-weight: 900;
    }
    .policy-section p,
    .policy-section li {
      color: var(--qhher-muted);
      font-size: 0.96rem;
      line-height: 1.82;
    }
    .policy-section p {
      margin: 0.55rem 0 0;
    }
    .policy-section strong {
      color: var(--qhher-sale);
      font-weight: 800;
    }
    .policy-section ul,
    .policy-section ol {
      margin: 0.75rem 0 0;
      padding-left: 1.25rem;
    }
    .policy-section li + li {
      margin-top: 0.35rem;
    }
    .policy-table-scroll {
      max-width: 100%;
      margin: 1rem 0 1.2rem;
      overflow-x: auto;
      border: 1px solid var(--qhher-border);
      border-radius: 1rem;
      background: #FFFFFF;
    }
    .policy-section table {
      width: 100%;
      min-width: 34rem;
      border-collapse: collapse;
      font-size: 0.95rem;
    }
    .policy-section th,
    .policy-section td {
      padding: 0.9rem 1rem;
      border-bottom: 1px solid var(--qhher-border);
      text-align: left;
      vertical-align: top;
    }
    .policy-section th {
      background: #FCEEEF;
      color: var(--qhher-text);
      font-weight: 900;
    }
    .policy-section td {
      color: var(--qhher-muted);
      font-weight: 700;
    }
    .policy-section tr:last-child td {
      border-bottom: 0;
    }
    .policy-footer-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      max-width: 72rem;
      margin: 0 auto;
      padding: 0 1rem 3.2rem;
    }
    .policy-footer-nav a {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border: 1px solid var(--qhher-border);
      border-radius: 999px;
      padding: 0.72rem 1rem;
      background: #fff;
      color: var(--qhher-rose);
      font-weight: 800;
      text-decoration: none;
    }
    @media (max-width: 640px) {
      .policy-header .inner {
        padding-top: 0.78rem;
        padding-bottom: 0.78rem;
      }
      .policy-back span {
        display: none;
      }
      .policy-hero {
        padding-top: 2.65rem;
        padding-bottom: 1.2rem;
      }
      .policy-hero h1 {
        max-width: 21rem;
        font-size: clamp(1.65rem, 7.2vw, 2.15rem);
        line-height: 1.12;
      }
      .policy-card {
        border-radius: 1.15rem;
      }
      .policy-callout {
        margin: 0.75rem;
        padding: 0.85rem;
      }
      .policy-content {
        padding: 0 1rem 1rem;
      }
      .policy-table-scroll {
        margin: 0.75rem 0 1rem;
        border-radius: 0.85rem;
      }
      .policy-section table {
        min-width: 0;
        table-layout: fixed;
        font-size: 0.86rem;
      }
      .policy-section th,
      .policy-section td {
        padding: 0.75rem 0.8rem;
      }
    }
  </style>
</head>
<body>
  <main class="policy-shell">
    <header class="policy-header">
      <div class="inner mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <a href="/hottrendnu" class="policy-logo" aria-label="QH Clothes">QH Clothes</a>
        <a href="/hottrendnu" class="policy-back">
          <i class="fas fa-arrow-left"></i>
          <span>Về QH Clothes</span>
        </a>
      </div>
    </header>

    <section class="policy-hero">
      <span class="policy-kicker"><i class="${config.badgeIcon}"></i>${config.badgeText}</span>
      <h1>${config.title}</h1>
      <p class="policy-lead">${config.lead}</p>
    </section>

    <section class="policy-panel">
      <article class="policy-card">
        <div class="policy-callout">
          <span class="policy-callout-icon"><i class="${config.calloutIcon}"></i></span>
          <p>${config.callout}</p>
        </div>
        <div class="policy-content">
          ${renderPolicySections(config.sections)}
        </div>
      </article>
    </section>

    <nav class="policy-footer-nav" aria-label="Liên kết chính sách">
      <a href="/hottrendnu/chinh-sach-doi-tra"><i class="fas fa-rotate-left"></i>Đổi trả</a>
      <a href="/hottrendnu/chinh-sach-thanh-toan"><i class="fas fa-credit-card"></i>Thanh toán</a>
      <a href="/hottrendnu/chinh-sach-van-chuyen"><i class="fas fa-truck-fast"></i>Vận chuyển</a>
      <a href="/hottrendnu/chinh-sach-bao-mat"><i class="fas fa-lock"></i>Bảo mật</a>
      <a href="/hottrendnu"><i class="fas fa-store"></i>QH Clothes</a>
    </nav>
  </main>
</body>
</html>`
}

export function hotTrendNuReturnPolicyHTML(): string {
  return hotTrendNuPolicyHTML({
    kind: 'return',
    title: 'Chính sách đổi trả',
    description: 'Chính sách đổi trả QH Clothes: thời gian hỗ trợ, điều kiện đổi trả, chi phí và quy trình xử lý.',
    badgeIcon: 'fas fa-rotate-left',
    badgeText: 'QH Clothes',
    lead: 'Tại QH Clothes, chúng tôi luôn mong muốn khách hàng nhận được sản phẩm ưng ý nhất với mức giá tốt hơn khi mua trực tiếp tại website, không qua sàn thương mại điện tử.',
    calloutIcon: 'fas fa-shield-halved',
    callout: 'Vì là kênh bán hàng riêng, chúng tôi tối ưu được nhiều chi phí trung gian để mang đến giá bán dễ chịu hơn cho khách. Đồng thời, shop vẫn có chính sách đổi trả rõ ràng, minh bạch để khách hàng yên tâm khi đặt mua.',
    sections: returnPolicySections,
  })
}

export function hotTrendNuPrivacyPolicyHTML(): string {
  return hotTrendNuPolicyHTML({
    kind: 'privacy',
    title: 'Chính sách bảo mật',
    description: 'Chính sách bảo mật QH Clothes: thông tin thu thập, mục đích sử dụng, thời gian lưu trữ và quyền của khách hàng.',
    badgeIcon: 'fas fa-lock',
    badgeText: 'QH Clothes',
    lead: 'Tại QH Clothes, chúng tôi tôn trọng và cam kết bảo vệ thông tin cá nhân của khách hàng khi mua sắm trên website.',
    calloutIcon: 'fas fa-user-shield',
    callout: 'Thông tin khách hàng chỉ được dùng trong phạm vi xử lý đơn hàng, giao nhận và hỗ trợ sau mua. Shop không sử dụng dữ liệu cá nhân cho mục đích không liên quan đến việc bán hàng và chăm sóc khách hàng.',
    sections: privacyPolicySections,
  })
}

export function hotTrendNuPaymentPolicyHTML(): string {
  return hotTrendNuPolicyHTML({
    kind: 'payment',
    title: 'Chính sách thanh toán',
    description: 'Chính sách thanh toán QH Clothes: hình thức thanh toán, xác nhận đơn hàng, giá bán, an toàn giao dịch và hoàn tiền.',
    badgeIcon: 'fas fa-credit-card',
    badgeText: 'QH Clothes',
    lead: 'QH Clothes hỗ trợ thanh toán linh hoạt để khách hàng đặt mua thuận tiện, kiểm tra rõ thông tin và yên tâm trong suốt quá trình xử lý đơn hàng.',
    calloutIcon: 'fas fa-lock',
    callout: 'Website không lưu trữ thông tin tài khoản ngân hàng hoặc dữ liệu thanh toán nhạy cảm của khách hàng. Mọi khoản phí cần thanh toán đều được hiển thị rõ trước khi khách xác nhận đơn.',
    sections: paymentPolicySections,
  })
}

export function hotTrendNuShippingPolicyHTML(): string {
  return hotTrendNuPolicyHTML({
    kind: 'shipping',
    title: 'Chính sách vận chuyển',
    description: 'Chính sách vận chuyển QH Clothes: phạm vi giao hàng, thời gian dự kiến, phí vận chuyển, kiểm tra hàng và theo dõi đơn.',
    badgeIcon: 'fas fa-truck-fast',
    badgeText: 'QH Clothes',
    lead: 'QH Clothes hỗ trợ giao hàng toàn quốc, minh bạch thời gian và chi phí để khách hàng chủ động theo dõi đơn ngay từ lúc đặt hàng.',
    calloutIcon: 'fas fa-box-open',
    callout: 'Khách hàng nên kiểm tra tình trạng gói hàng và đúng mẫu mã, màu sắc, kích thước khi nhận. Nếu có vấn đề phát sinh, hãy liên hệ với shop sớm để được hỗ trợ nhanh nhất.',
    sections: shippingPolicySections,
  })
}

export function storefrontPurchaseToastScript(): string {
  return `
(function() {
  var PURCHASE_USERNAMES = [
    'anhtuan', 'minhkhoi', 'thuynguyen', 'hoanganh', 'quocbao',
    'ngoclinh', 'thanhhoa', 'ducmanh', 'kimchi', 'bichvan',
    'trungkien', 'mylinh', 'songtung', 'haidang', 'phuongnam',
    'lanhuong', 'vietanh', 'thanhlong', 'minhchau', 'quynhmai',
    'tuananh', 'huongly', 'baominh', 'thanhvan', 'phucdat',
    'tuyetmai', 'khanhlinh', 'namphong', 'binhan', 'haianh'
  ];

  var purchaseToastTimer = null;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getPurchaseProducts() {
    // allProducts được khai báo bằng let ở cùng inline <script> block
    // Không nằm trên window, nhưng cùng scope toàn cục của script tag
    try { return (typeof allProducts !== 'undefined' && allProducts.length) ? allProducts : null; }
    catch(e) { return null; }
  }

  function showPurchaseNotification() {
    var products = getPurchaseProducts();
    if (!products) {
      // products chưa load, thử lại sau 2s
      purchaseToastTimer = setTimeout(showPurchaseNotification, 2000);
      return;
    }

    var product = products[Math.floor(Math.random() * products.length)];
    var username = PURCHASE_USERNAMES[Math.floor(Math.random() * PURCHASE_USERNAMES.length)];
    var container = document.getElementById('purchaseToastContainer');
    if (!container) return;

    var productName = escapeHtml(product.name || 'san pham');
    var thumbnail = product.thumbnail || '';

    var toast = document.createElement('div');
    toast.style.cssText = [
      'animation: purchaseFadeInOut 6.5s ease forwards',
      'pointer-events: auto',
      'background: #fff',
      'border-radius: 14px',
      'box-shadow: 0 8px 32px rgba(15,23,42,0.14), 0 1.5px 6px rgba(99,102,241,0.10)',
      'border-left: 4px solid #6366f1',
      'padding: 12px 14px',
      'min-width: 240px',
      'max-width: 320px',
      'display: flex',
      'align-items: center',
      'gap: 10px'
    ].join(';');

    var imgHtml = thumbnail
      ? '<img src="' + escapeHtml(thumbnail) + '" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1.5px solid rgba(99,102,241,0.18);">'
      : '<div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;">&#128717;</div>';

    toast.innerHTML =
      imgHtml +
      '<div style="min-width:0;">' +
        '<div style="font-size:11px;color:#9ca3af;margin-bottom:3px;font-weight:500;">&#128308; Vừa mua xong</div>' +
        '<div style="font-size:13px;line-height:1.4;">' +
          'Khách <strong style="color:#6366f1;">' + escapeHtml(username) + '</strong>' +
          ' vừa mua 1 ' +
          '<strong style="color:#111827;">' + productName + '</strong>' +
        '</div>' +
      '</div>';

    container.appendChild(toast);

    // Xóa toast sau 6.5s (khớp animation), rồi hiện cái tiếp theo sau 1s
    purchaseToastTimer = setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      purchaseToastTimer = setTimeout(showPurchaseNotification, 1000);
    }, 6500);
  }

  // Bắt đầu sau 5s để chờ loadProducts() hoàn thành
  purchaseToastTimer = setTimeout(showPurchaseNotification, 5000);
})();
`
}

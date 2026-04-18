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

  function showPurchaseNotification() {
    if (!window.allProducts || !window.allProducts.length) {
      purchaseToastTimer = setTimeout(showPurchaseNotification, 3000);
      return;
    }

    var products = window.allProducts;
    var product = products[Math.floor(Math.random() * products.length)];
    var username = PURCHASE_USERNAMES[Math.floor(Math.random() * PURCHASE_USERNAMES.length)];
    var container = document.getElementById('purchaseToastContainer');
    if (!container) return;

    var productName = escapeHtml(product.name || 'sản phẩm');
    var thumbnail = product.thumbnail ? escapeHtml(product.thumbnail) : '';

    var toast = document.createElement('div');
    toast.className = 'purchase-toast';
    toast.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;">' +
        (thumbnail
          ? '<img src="' + thumbnail + '" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1.5px solid rgba(99,102,241,0.18);">'
          : '<div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px;">🛍️</div>'
        ) +
        '<div style="min-width:0;">' +
          '<div style="font-size:12px;color:#6b7280;margin-bottom:2px;">Khách hàng vừa mua</div>' +
          '<div style="font-size:13px;line-height:1.35;">' +
            '<strong style="color:#6366f1;">' + escapeHtml(username) + '</strong>' +
            ' &mdash; 1 ' +
            '<strong style="color:#111827;">' + productName + '</strong>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.appendChild(toast);

    // After animation ends (6.5s total), remove and schedule next
    purchaseToastTimer = setTimeout(function() {
      toast.style.transition = 'none';
      if (toast.parentNode) toast.parentNode.removeChild(toast);
      // Short pause before showing next notification
      purchaseToastTimer = setTimeout(showPurchaseNotification, 800);
    }, 6500);
  }

  // Start after 5s to let products load
  purchaseToastTimer = setTimeout(showPurchaseNotification, 5000);
})();
`
}

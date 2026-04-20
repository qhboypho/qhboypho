function checkoutPaymentOptions(scope: 'order' | 'ck', bankHint: string): string {
  return `
        <div id="${scope === 'ck' ? 'ckFieldPaymentMethod' : 'fieldPaymentMethod'}">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-credit-card text-pink-400 mr-1"></i>Chọn phương thức thanh toán *
          </label>
          <div class="space-y-2">
            <button
              type="button"
              data-payment-scope="${scope}"
              class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectCheckoutPaymentMethod('${scope}','COD', this)"
            >
              <span class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                <i class="fas fa-money-bill-wave"></i>
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-800">COD</span>
                <span class="block text-xs text-gray-500">Thanh toán khi giao hàng</span>
              </span>
            </button>

            <button
              type="button"
              data-payment-scope="${scope}"
              class="payment-method-btn w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 text-left hover:border-pink-400 transition"
              onclick="selectCheckoutPaymentMethod('${scope}','BANK_TRANSFER', this)"
            >
              <span class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                <i class="fas fa-university"></i>
              </span>
              <span>
                <span class="block text-sm font-semibold text-gray-800">Chuyển khoản ngân hàng</span>
                <span class="block text-xs text-gray-500">${bankHint}</span>
              </span>
            </button>

            ${scope === 'order' ? `
            <div class="payment-method-unavailable w-full flex items-center gap-2 border rounded-xl px-3 py-2.5 transition" aria-disabled="true">
              <button type="button" data-payment-scope="${scope}" class="payment-method-btn flex-1 flex items-center gap-3 text-left border rounded-lg px-2 py-1.5" tabindex="-1" disabled>
                <span class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">ZP</span>
                <span>
                  <span class="block text-sm font-semibold text-gray-800">Zalopay</span>
                  <span class="payment-method-badge block text-xs text-gray-500 mt-0.5">Không khả dụng</span>
                </span>
              </button>
              <button type="button" class="text-sm font-semibold text-blue-600 flex items-center gap-1" tabindex="-1" disabled>
                Liên kết <i class="fas fa-chevron-right text-xs"></i>
              </button>
            </div>

            <div class="payment-method-unavailable w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 transition" aria-disabled="true">
              <button type="button" data-payment-scope="${scope}" class="payment-method-btn flex-1 flex items-center gap-3 text-left border rounded-lg px-2 py-1.5" tabindex="-1" disabled>
                <span class="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                  <i class="fas fa-wallet"></i>
                </span>
                <span>
                  <span class="block text-sm font-semibold text-gray-800">Ví điện tử MoMo</span>
                  <span class="payment-method-badge block text-xs text-gray-500 mt-0.5">Không khả dụng</span>
                </span>
              </button>
            </div>` : ''}
          </div>
        </div>`
}

export function storefrontModalsSection(): string {
  return `
<div id="orderOverlay" class="fixed inset-0 overlay z-50 hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-[56rem] max-h-[90vh] overflow-y-auto" id="orderPopupCard">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Đặt hàng nhanh</h3>
      <button onclick="closeOrder()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>

    <div class="px-6 py-4">
      <div id="orderProductPreview" class="flex gap-3 p-3 bg-gray-50 rounded-2xl mb-5">
        <img id="orderProductImg" src="" alt="" class="w-16 h-20 object-cover rounded-xl">
        <div>
          <p id="orderProductName" class="font-semibold text-gray-800 text-sm"></p>
          <p id="orderProductPrice" class="text-pink-600 font-bold mt-1"></p>
        </div>
      </div>

      <div class="space-y-4">
        <div id="fieldName">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
          </label>
          <input type="text" id="orderName" placeholder="Nhập họ và tên"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>

        <div id="fieldPhone">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
          </label>
          <input type="tel" id="orderPhone" placeholder="0987 654 321"
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>

        <div id="fieldAddress">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div id="orderProvinceDropdown" class="relative">
              <button type="button" id="orderProvinceTrigger" onclick="toggleAddressDropdown('order','province')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderProvinceSearch" placeholder="Tìm tỉnh/thành..."
                    oninput="onAddressDropdownSearchInput('order','province')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderProvinceOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderProvince" onchange="onAddressProvinceChange('order')" class="hidden">
                <option value="">Chọn tỉnh/thành</option>
              </select>
            </div>
            <div id="orderCommuneDropdown" class="relative">
              <button type="button" id="orderCommuneTrigger" onclick="toggleAddressDropdown('order','commune')"
                class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                <span id="orderCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
              </button>
              <div id="orderCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                <div class="p-2 border-b bg-gray-50">
                  <input type="text" id="orderCommuneSearch" placeholder="Tìm phường/xã..."
                    oninput="onAddressDropdownSearchInput('order','commune')"
                    class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                </div>
                <div id="orderCommuneOptions" class="max-h-56 overflow-auto"></div>
              </div>
              <select id="orderCommune" onchange="onAddressCommuneChange('order')" class="hidden">
                <option value="">Chọn phường/xã</option>
              </select>
            </div>
          </div>
          <input type="text" id="orderAddressDetail"
            placeholder="Số nhà, tên đường..."
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
            oninput="clearFieldError('fieldAddress'); syncAddressFullText('order')">
          <input type="text" id="orderAddress"
            readonly
            placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
            class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
        </div>

        <div id="fieldColor">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc *
          </label>
          <div id="colorOptions" class="flex flex-wrap gap-2"></div>
        </div>

        <div id="sizeSection">
          <label class="block text-sm font-semibold text-gray-700 mb-2 field-title">
            <i class="fas fa-ruler text-pink-400 mr-1"></i>Size *
          </label>
          <div id="sizeOptions" class="flex flex-wrap gap-2"></div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            <i class="fas fa-sort-numeric-up text-pink-400 mr-1"></i>Số lượng
          </label>
          <div class="flex items-center gap-3">
            <button onclick="changeQty(-1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">−</button>
            <span id="qtyDisplay" class="text-xl font-bold w-8 text-center">1</span>
            <button onclick="changeQty(1)" class="w-9 h-9 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-pink-400 hover:text-pink-500 transition font-bold">+</button>
          </div>
        </div>

        <div id="fieldVoucher">
          <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
            <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
          </label>
          <div class="flex gap-2">
            <input type="text" id="orderVoucher" placeholder="Nhập mã voucher..."
              class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
              oninput="this.value=this.value.toUpperCase()">
            <button onclick="applyVoucher()" id="voucherBtn"
              class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
              Áp dụng
            </button>
          </div>
          <div id="voucherStatus" class="mt-2 hidden"></div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">
            <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
          </label>
          <input type="text" id="orderNote" placeholder="Ghi chú cho đơn hàng..."
            class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
        </div>

        ${checkoutPaymentOptions('order', 'Chuyển khoản trực tiếp')}

        <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
          <div id="subtotalRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-gray-500">Tạm tính:</span>
            <span id="orderSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
          </div>
          <div id="discountRow" class="flex justify-between items-center hidden">
            <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
            <span id="orderDiscount" class="text-sm font-bold text-green-600">-0đ</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Tổng cộng:</span>
            <span id="orderTotal" class="text-2xl font-bold text-pink-600">0đ</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button onclick="addCurrentToCart()" id="addToCartBtn"
            class="add-to-cart-btn flex-shrink-0 flex items-center justify-center gap-2 text-white px-4 py-3.5 rounded-xl font-semibold text-sm transition">
            <i class="fas fa-shopping-bag"></i><span class="hidden sm:inline">Thêm vào giỏ hàng</span>
          </button>
          <button onclick="submitOrder()" id="submitOrderBtn"
            class="btn-primary flex-1 text-white py-3.5 rounded-xl font-bold text-base">
            <i class="fas fa-bolt mr-2"></i>Đặt ngay
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<div id="orderBankTransferOverlay" class="fixed inset-0 overlay z-[70] hidden flex items-center justify-center p-4">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">
        <i class="fas fa-qrcode text-pink-500 mr-2"></i>Quét mã QR để thanh toán
      </h3>
      <button onclick="closeOrderBankTransferModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-5">
      <div class="border rounded-2xl p-4 bg-gray-50">
        <div class="flex justify-center mb-3">
          <img id="orderBankQrImg" src="" alt="VietQR thanh toán đơn hàng" class="w-56 h-56 object-contain rounded-xl border bg-white">
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Ngân hàng</span>
            <span class="font-bold text-gray-800">MB Bank</span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số TK</span>
            <span class="font-bold text-gray-800">
              <span id="orderBankAccountNo"></span>
              <button type="button" class="ml-1 text-gray-400 hover:text-gray-600" onclick="copyBankValue(document.getElementById('orderBankAccountNo').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Chủ TK</span>
            <span class="font-bold text-gray-800" id="orderBankAccountName"></span>
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <p class="text-amber-700 text-xs font-semibold mb-1">Nội dung CK (BẮT BUỘC)</p>
            <div class="flex items-center justify-between">
              <span id="orderBankTransferContent" class="font-mono font-bold text-amber-800"></span>
              <button type="button" class="text-amber-500 hover:text-amber-700" onclick="copyBankValue(document.getElementById('orderBankTransferContent').textContent)">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Số tiền</span>
            <span class="font-bold text-pink-600" id="orderBankAmountDisplay"></span>
          </div>
          <div class="flex justify-between items-center bg-white rounded-lg px-3 py-2 border">
            <span class="text-gray-500">Mã đơn</span>
            <span class="font-mono font-bold text-blue-600" id="orderBankOrderCode"></span>
          </div>
        </div>
      </div>
      <div class="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-700">
        Sau khi chuyển khoản, đơn hàng sẽ được xác nhận khi shop đối soát giao dịch.
      </div>
    </div>
  </div>
</div>

<div id="orderPaidNoticeOverlay" class="fixed inset-0 z-[80] hidden items-center justify-center bg-black/30 p-4">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 text-center">
    <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
      <i class="fas fa-check text-xl"></i>
    </div>
    <p class="text-green-600 font-bold text-lg">Đã thanh toán thành công</p>
    <p class="text-sm text-gray-600 mt-1">Đơn hàng đã được ghi nhận.</p>
    <p class="text-xs font-mono text-blue-600 mt-2" id="orderPaidNoticeCode"></p>
  </div>
</div>

<div id="shippingJourneyOverlay" class="fixed inset-0 hidden items-center justify-center bg-black/30 p-4" style="z-index:85;" onclick="handleShippingJourneyOverlayClick(event)">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[88vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">
        <i class="fas fa-route text-pink-500 mr-2"></i>Hành trình vận chuyển
      </h3>
      <button onclick="closeShippingJourneyModal()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="shippingJourneyContent" class="px-6 py-5"></div>
  </div>
</div>

<div id="detailOverlay" class="fixed inset-0 overlay hidden flex items-center justify-center p-4" style="z-index:1001;">
  <div class="popup-card bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-[56rem] max-h-[90vh] overflow-y-auto">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h3 class="font-display text-xl font-bold text-gray-900">Chi tiết sản phẩm</h3>
      <button onclick="closeDetail()" class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div id="detailContent" class="px-6 py-4"></div>
  </div>
</div>

<div id="cartOverlay" class="fixed inset-0 overlay z-50 hidden" onclick="handleCartOverlayClick(event)">
  <div id="cartModal" class="cart-modal absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white flex flex-col shadow-2xl">
    <div id="cartHeader" class="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-gray-900 to-gray-800 text-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <button id="cartBackBtn" onclick="cartGoBack()" class="hidden w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-arrow-left text-sm"></i>
        </button>
        <div>
          <h2 id="cartTitle" class="font-display text-lg font-bold">Giỏ hàng</h2>
          <p id="cartSubtitle" class="text-xs text-gray-300">Chưa có sản phẩm</p>
        </div>
      </div>
      <button onclick="closeCart()" class="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div id="cartStep1" class="flex flex-col flex-1 overflow-hidden">
      <div id="cartCheckAllBar" class="hidden flex items-center gap-3 px-5 py-3 bg-gray-50 border-b flex-shrink-0">
        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" id="checkAll" onchange="toggleCheckAll(this)" class="w-4 h-4 accent-pink-500 cursor-pointer">
          <span class="text-sm font-medium text-gray-700">Chọn tất cả</span>
        </label>
        <span id="selectedCount" class="ml-auto text-xs text-gray-400"></span>
        <button onclick="removeChecked()" id="deleteCheckedBtn" class="hidden text-xs text-red-500 hover:text-red-600 font-medium transition">
          <i class="fas fa-trash mr-1"></i>Xoá đã chọn
        </button>
      </div>

      <div id="cartItemsList" class="flex-1 overflow-y-auto px-4 py-3 space-y-3"></div>

      <div id="cartFooter" class="hidden flex-shrink-0 border-t bg-white px-5 py-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-gray-600 font-medium">Tổng cộng (<span id="cartSelectedItems">0</span> sản phẩm):</span>
          <span id="cartTotalPrice" class="text-xl font-bold text-pink-600">0đ</span>
        </div>
        <button onclick="proceedToCheckout()" id="checkoutBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50">
          <i class="fas fa-credit-card mr-2"></i>Xác nhận & Đặt hàng
        </button>
      </div>
    </div>

    <div id="cartStep2" class="hidden flex-col flex-1 overflow-hidden checkout-slide">
      <div id="checkoutSummary" class="flex-shrink-0 bg-gray-50 border-b px-5 py-3 overflow-x-auto">
        <div id="checkoutSummaryItems" class="flex gap-3 min-w-max"></div>
      </div>

      <div class="flex-1 overflow-y-auto px-5 py-4">
        <h3 class="font-display text-base font-bold text-gray-800 mb-4">Thông tin giao hàng</h3>
        <div class="space-y-4">
          <div id="ckFieldName">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-user text-pink-400 mr-1"></i>Họ và tên *
            </label>
            <input type="text" id="ckName" placeholder="Nhập họ và tên"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldName')">
          </div>

          <div id="ckFieldPhone">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-phone text-pink-400 mr-1"></i>Số điện thoại *
            </label>
            <input type="tel" id="ckPhone" placeholder="0987 654 321"
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldPhone')">
          </div>

          <div id="ckFieldAddress">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5 field-title">
              <i class="fas fa-map-marker-alt text-pink-400 mr-1"></i>Địa chỉ giao hàng *
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div id="ckProvinceDropdown" class="relative">
                <button type="button" id="ckProvinceTrigger" onclick="toggleAddressDropdown('ck','province')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckProvinceLabel" class="text-gray-500">Chọn tỉnh/thành</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckProvinceMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckProvinceSearch" placeholder="Tìm tỉnh/thành..."
                      oninput="onAddressDropdownSearchInput('ck','province')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckProvinceOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckProvince" onchange="onAddressProvinceChange('ck')" class="hidden">
                  <option value="">Chọn tỉnh/thành</option>
                </select>
              </div>
              <div id="ckCommuneDropdown" class="relative">
                <button type="button" id="ckCommuneTrigger" onclick="toggleAddressDropdown('ck','commune')"
                  class="w-full border rounded-xl px-3.5 py-2.5 text-sm bg-white text-left flex items-center justify-between focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  <span id="ckCommuneLabel" class="text-gray-500">Chọn phường/xã</span>
                  <i class="fas fa-chevron-down text-gray-400 text-xs"></i>
                </button>
                <div id="ckCommuneMenu" class="hidden absolute z-[90] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div class="p-2 border-b bg-gray-50">
                    <input type="text" id="ckCommuneSearch" placeholder="Tìm phường/xã..."
                      oninput="onAddressDropdownSearchInput('ck','commune')"
                      class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
                  </div>
                  <div id="ckCommuneOptions" class="max-h-56 overflow-auto"></div>
                </div>
                <select id="ckCommune" onchange="onAddressCommuneChange('ck')" class="hidden">
                  <option value="">Chọn phường/xã</option>
                </select>
              </div>
            </div>
            <input type="text" id="ckAddressDetail"
              placeholder="Số nhà, tên đường..."
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200"
              oninput="clearCheckoutError('ckFieldAddress'); syncAddressFullText('ck')">
            <input type="text" id="ckAddress"
              readonly
              placeholder="Địa chỉ đầy đủ sẽ tự động ghép tại đây"
              class="mt-2.5 w-full border rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600 focus:outline-none">
          </div>

          <div id="ckFieldVoucher">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-tag text-pink-400 mr-1"></i>Mã giảm giá (tuỳ chọn)
            </label>
            <div class="flex gap-2">
              <input type="text" id="ckVoucher" placeholder="Nhập mã voucher..."
                class="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200 uppercase tracking-wider"
                oninput="this.value=this.value.toUpperCase()">
              <button onclick="applyCkVoucher()" id="ckVoucherBtn"
                class="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-semibold transition whitespace-nowrap">
                Áp dụng
              </button>
            </div>
            <div id="ckVoucherStatus" class="mt-2 hidden"></div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="fas fa-sticky-note text-pink-400 mr-1"></i>Ghi chú (tuỳ chọn)
            </label>
            <input type="text" id="ckNote" placeholder="Ghi chú cho đơn hàng..."
              class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-200">
          </div>

          ${checkoutPaymentOptions('ck', 'Thanh toán online khi chọn 1 sản phẩm')}

          <div class="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4 space-y-1.5">
            <div id="ckSubtotalRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-gray-500">Tạm tính:</span>
              <span id="ckSubtotal" class="text-sm font-semibold text-gray-700">0đ</span>
            </div>
            <div id="ckDiscountRow" class="hidden flex justify-between items-center">
              <span class="text-sm text-green-600 font-medium"><i class="fas fa-tag mr-1"></i>Giảm giá:</span>
              <span id="ckDiscount" class="text-sm font-bold text-green-600">-0đ</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="font-semibold text-gray-700">Tổng cộng:</span>
              <span id="ckTotal" class="text-2xl font-bold text-pink-600">0đ</span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-shrink-0 border-t bg-white px-5 py-4">
        <button onclick="submitCartOrder()" id="submitCartBtn"
          class="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base">
          <i class="fas fa-shopping-cart mr-2"></i>Đặt hàng ngay
        </button>
      </div>
    </div>
  </div>
</div>

<div id="userMenuOverlay" class="fixed inset-0 user-menu-overlay z-50 hidden" onclick="handleUserMenuOverlayClick(event)">
  <div id="userMenuPanel" class="user-menu-panel absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white flex flex-col shadow-2xl">
    <div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-5 flex-shrink-0">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-display text-lg font-bold">Tài khoản</h2>
        <button onclick="closeUserMenu()" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div id="userMenuGuest">
        <p class="text-gray-300 text-sm mb-3">Đăng nhập để lưu lịch sử đơn hàng</p>
        <button onclick="loginWithGoogle()" class="w-full flex items-center justify-center gap-3 bg-white text-gray-800 px-4 py-3 rounded-xl font-semibold text-sm hover:bg-gray-100 transition">
          <svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.7 2.6v2.2h2.8c1.6-1.5 2.7-3.7 2.7-6.4z" fill="#4285F4"/><path d="M9 18c2.4 0 4.5-.8 6-2.2l-2.8-2.2c-.8.6-1.9.9-3.2.9-2.5 0-4.5-1.7-5.3-3.9H.8v2.3C2.3 16 5.4 18 9 18z" fill="#34A853"/><path d="M3.7 10.7c-.2-.6-.3-1.2-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6 0 7.2 0 9s.3 3 .8 4l2.9-2.3z" fill="#FBBC05"/><path d="M9 3.6c1.4 0 2.6.5 3.5 1.4l2.6-2.6C13.5.9 11.4 0 9 0 5.4 0 2.3 2 .8 5l2.9 2.3c.8-2.2 2.8-3.7 5.3-3.7z" fill="#EA4335"/></svg>
          Đăng nhập bằng Google
        </button>
      </div>
      <div id="userMenuLoggedIn" class="hidden">
        <div class="flex items-center gap-3">
          <img id="userMenuAvatar" src="" class="w-12 h-12 rounded-full object-cover border-2 border-pink-400">
          <div>
            <p id="userMenuName" class="font-semibold"></p>
            <p id="userMenuEmail" class="text-gray-400 text-xs"></p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 py-4">
      <nav class="space-y-1">
        <button onclick="showUserAccount()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-user-circle w-5 text-pink-400"></i>Quản lý tài khoản
        </button>
        <button onclick="showUserOrders()" id="userOrdersBtn" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-clipboard-list w-5 text-pink-400"></i>Lịch sử mua hàng
        </button>
        <button onclick="showWalletInMenu()" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition text-sm font-medium text-left">
          <i class="fas fa-wallet w-5 text-pink-400"></i>Nạp tiền vào ví
          <span id="walletBalanceMenu" class="ml-auto text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-semibold">0đ</span>
        </button>
      </nav>
      <div id="userMenuContent" class="mt-4"></div>
    </div>

    <div id="userMenuLogoutArea" class="hidden flex-shrink-0 border-t px-5 py-4">
      <button onclick="logoutUser()" class="w-full flex items-center justify-center gap-2 border-2 border-red-200 text-red-500 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-50 transition">
        <i class="fas fa-sign-out-alt"></i>Đăng xuất
      </button>
    </div>
  </div>
</div>

<div id="toastContainer" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none"></div>`
}

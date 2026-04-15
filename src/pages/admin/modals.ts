export function adminModalsSection(): string {
  const gallerySlots = [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => `
                <div class="img-slot relative flex flex-col items-center justify-center min-h-[102px]" id="slot-${i}" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'gallery', ${i})">
                  <img id="galleryImg-${i}" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'gallery', ${i})" class="w-full h-full object-cover rounded-xl hidden absolute inset-0">
                  <div class="flex flex-col items-center gap-1 text-gray-400 text-center p-2" id="slotPlaceholder-${i}">
                    <i class="fas fa-plus text-base"></i>
                    <span class="text-xs">Ảnh ${i + 1}</span>
                  </div>
                  <button type="button" class="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden text-xs z-10"
                    id="slotDel-${i}" onclick="removeGalleryImg(${i})">×</button>
                  <input type="file" accept="image/*" multiple class="hidden" id="galleryFile-${i}" onchange="handleGalleryFile(${i},this)">
                </div>`).join('')

  return `<!-- PRODUCT MODAL -->
<div id="productModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 id="modalTitle" class="font-bold text-xl text-gray-900">Thêm sản phẩm mới</h2>
      <button onclick="closeProductModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    
    <form id="productForm" onsubmit="saveProduct(event)" class="px-6 py-5 space-y-6">
      <input type="hidden" id="productId">
      
      <!-- Basic Info -->
      <div class="grid md:grid-cols-2 gap-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Tên sản phẩm *</label>
          <input type="text" id="pName" required placeholder="VD: Áo thun Unisex Premium" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-100">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-images text-pink-400 mr-1"></i>Hình ảnh *</label>
          <p class="text-xs text-gray-400 mb-2">Ảnh chính hiển thị ở khung lớn bên trái, ảnh phụ nằm ở các khung nhỏ bên phải.</p>
          <div class="grid md:grid-cols-3 gap-3 items-start">
            <div class="md:col-span-1">
              <div class="img-slot w-full flex flex-col items-center justify-center p-3 min-h-[220px]" id="thumbnailPreviewBox" onclick="document.getElementById('thumbnailInput').click()" ondragover="handleImageDragOver(event)" ondragleave="handleImageDragLeave(event)" ondrop="handleImageDrop(event, 'thumbnail', -1)">
                <img id="thumbnailPreview" src="" alt="" draggable="true" ondragstart="startImageReorderDrag(event, 'thumbnail', -1)" class="w-full h-full object-cover rounded-xl hidden">
                <div id="thumbnailPlaceholder" class="flex flex-col items-center gap-1 text-gray-400">
                  <i class="fas fa-camera text-2xl"></i>
                  <span class="text-sm font-medium">Tải lên ảnh chính</span>
                </div>
              </div>
              <input type="file" id="thumbnailInput" accept="image/*" multiple class="hidden" onchange="handleThumbnailFile(this)">
              <input type="url" id="pThumbnail" placeholder="Dán URL ảnh chính..." class="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400 mt-2" oninput="previewThumbnail(this.value)">
            </div>
            <div class="md:col-span-2">
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3" id="galleryGrid">
                ${gallerySlots}
              </div>
              <p class="text-xs text-gray-400 mt-2">Nhấn vào từng ô để thêm ảnh phụ hoặc dán URL nhanh bên dưới.</p>
              <div class="mt-2 flex gap-2">
                <input type="url" id="galleryUrlInput" placeholder="Dán URL ảnh phụ..." class="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
                <button type="button" onclick="addGalleryUrl()" class="btn-pink text-white px-4 py-2 rounded-xl text-sm font-semibold">Thêm</button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá bán (VNĐ) *</label>
          <input type="number" id="pPrice" required placeholder="299000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Giá gốc (VNĐ)</label>
          <input type="number" id="pOriginalPrice" placeholder="399000" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Danh mục</label>
          <select id="pCategory" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
            <option value="unisex">Unisex</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Thương hiệu</label>
          <input type="text" id="pBrand" placeholder="VD: QH Clothes" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Chất liệu</label>
          <input type="text" id="pMaterial" placeholder="VD: 100% Cotton Combed" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Mô tả</label>
          <textarea id="pDescription" rows="3" placeholder="Mô tả chi tiết về sản phẩm..." class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-semibold mb-1.5 text-gray-700">Số lượng tồn kho</label>
          <input type="number" id="pStock" placeholder="100" min="0" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
        </div>
        <div class="flex items-center gap-6 pt-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pFeatured" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm nổi bật</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pTrending" class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Sản phẩm thịnh hành</span>
          </label>
          <div class="flex items-center gap-2">
            <label for="pTrendingOrder" class="text-sm font-medium text-gray-700 whitespace-nowrap">Vị trí hiển thị</label>
            <select id="pTrendingOrder" class="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
              <option value="0">Tự động</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>
              <option value="10">10</option>
              <option value="11">11</option>
              <option value="12">12</option>
            </select>
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="pActive" checked class="w-4 h-4 accent-pink-500">
            <span class="text-sm font-medium text-gray-700">Hiển thị</span>
          </label>
        </div>
      </div>
      <!-- Colors -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-palette text-pink-400 mr-1"></i>Màu sắc</label>
        <div id="colorOptionsEditor" class="space-y-2"></div>
        <button type="button" onclick="addColorOptionRow()" class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-pink-600 transition">
          <i class="fas fa-plus"></i>Thêm lựa chọn
        </button>
      </div>
      
      <!-- Sizes -->
      <div>
        <label class="block text-sm font-semibold mb-2 text-gray-700"><i class="fas fa-ruler text-pink-400 mr-1"></i>Size số</label>
        <div class="flex flex-wrap gap-2 mb-2">
          <button type="button" onclick="addPresetSizes(['XS','S','M','L','XL','XXL'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ XS→XXL</button>
          <button type="button" onclick="addPresetSizes(['28','29','30','31','32','33','34'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size quần</button>
          <button type="button" onclick="addPresetSizes(['35','36','37','38','39','40','41','42'])" class="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:border-pink-400 hover:text-pink-600 transition">+ Size giày</button>
        </div>
        <div id="sizeTags" class="flex flex-wrap gap-2 mb-2 min-h-[36px]"></div>
        <div class="flex gap-2">
          <input type="text" id="sizeInput" placeholder="VD: S, M, L, XL, 28, 29..." class="flex-1 border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-400"
            onkeydown="if(event.key==='Enter'){event.preventDefault();addTag('size')}">
          <button type="button" onclick="addTag('size')" class="btn-pink text-white px-4 py-2 rounded-xl text-sm">Thêm</button>
        </div>
      </div>
      
      <div class="flex gap-3 pt-2">
        <button type="button" onclick="closeProductModal()" class="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition">Huỷ</button>
        <button type="submit" class="flex-1 btn-pink text-white py-3 rounded-xl font-semibold">
          <i class="fas fa-save mr-2"></i><span id="saveBtn">Lưu sản phẩm</span>
        </button>
      </div>
    </form>
  </div>
</div>

<!-- ORDER DETAIL MODAL -->
<div id="orderDetailModal" class="fixed inset-0 modal-overlay z-50 hidden flex items-center justify-center p-4" onclick="if(event.target === this) closeOrderDetailModal()">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-lg" onclick="event.stopPropagation()">
    <div class="border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-xl text-gray-900">Chi tiết đơn hàng</h2>
      <button onclick="closeOrderDetailModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div id="orderDetailContent" class="px-6 py-4"></div>
  </div>
</div>

<!-- SHIPPING ARRANGE SUCCESS MODAL -->
<div id="arrangeSuccessModal" class="fixed inset-0 modal-overlay z-[80] hidden flex items-center justify-center p-4">
  <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
    <div class="px-6 py-4 border-b flex items-center justify-between">
      <h3 class="font-bold text-lg text-gray-900">Sắp xếp vận chuyển</h3>
      <button onclick="closeArrangeSuccessModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <div class="px-6 py-6 text-center">
      <div class="mx-auto mb-3 w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
        <i class="fas fa-check text-xl"></i>
      </div>
      <p id="arrangeSuccessText" class="text-gray-800 font-semibold">Đã sắp xếp vận chuyển thành công 0 đơn hàng.</p>
      <button id="arrangeModalPrintBtn" onclick="printArrangedOrdersFromModal()" class="mt-5 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition">
        <i class="fas fa-print"></i>In đơn
      </button>
      <div id="arrangeFailedWrap" class="hidden mt-4 text-left bg-amber-50 border border-amber-200 rounded-xl p-3">
        <p class="text-xs font-semibold text-amber-700 mb-2">Đơn lỗi khi tạo vận đơn GHTK</p>
        <div id="arrangeFailedList" class="max-h-32 overflow-auto space-y-1 text-xs text-amber-800"></div>
      </div>
    </div>
  </div>
</div>

<!-- CHANGE ADMIN PASSWORD MODAL -->
<div id="adminChangePasswordModal" onclick="if(event.target===this) closeChangeAdminPasswordModal()" style="display:none" class="fixed inset-0 modal-overlay z-50 items-start justify-center p-4 overflow-y-auto">
  <div class="modal-card bg-white rounded-3xl shadow-2xl w-full max-w-md my-8">
    <div class="sticky top-0 bg-white rounded-t-3xl border-b px-6 py-4 flex items-center justify-between">
      <h2 class="font-bold text-lg text-gray-900">Thay đổi mật khẩu</h2>
      <button onclick="closeChangeAdminPasswordModal()" class="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
        <i class="fas fa-times text-gray-600"></i>
      </button>
    </div>
    <form onsubmit="submitAdminPasswordChange(event)" class="px-6 py-5 space-y-4">
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
        <input type="password" id="adminOldPassword" required class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Mật khẩu mới</label>
        <input type="password" id="adminNewPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-700 mb-1.5">Nhập lại mật khẩu mới</label>
        <input type="password" id="adminConfirmPassword" required minlength="6" maxlength="64" class="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-pink-400">
      </div>
      <div class="pt-1 flex justify-end gap-3">
        <button type="button" onclick="closeChangeAdminPasswordModal()" class="px-4 py-2.5 rounded-xl border text-gray-600 font-medium hover:bg-gray-50 transition">Hủy</button>
        <button type="submit" id="adminChangePasswordBtn" class="bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition">
          Cập nhật mật khẩu
        </button>
      </div>
    </form>
  </div>
</div>

<!-- TOAST -->
<div id="adminToast" class="fixed top-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>`
}

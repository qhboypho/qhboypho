export function storefrontLiveChatStyles(): string {
  return `
  .live-chat-launcher {
    position: fixed;
    right: 1.5rem;
    bottom: 1.5rem;
    z-index: 1010;
    width: 3.5rem;
    min-width: 0;
    height: 3.5rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0;
    padding: 0;
    background: var(--qh-action-gradient, linear-gradient(135deg, #12b5f5 0%, #2f6df6 52%, #5b4bef 100%));
    color: #fff;
    box-shadow: var(--qh-action-shadow, 0 18px 34px rgba(37, 99, 235, 0.3));
    border: 1px solid rgba(255,255,255,0.42);
    font-weight: 800;
    letter-spacing: 0;
    white-space: nowrap;
    overflow: hidden;
    transform-origin: right center;
    transition:
      width 360ms cubic-bezier(0.22, 1, 0.36, 1),
      min-width 360ms cubic-bezier(0.22, 1, 0.36, 1),
      padding 360ms cubic-bezier(0.22, 1, 0.36, 1),
      gap 360ms cubic-bezier(0.22, 1, 0.36, 1),
      box-shadow 240ms ease,
      transform 240ms ease;
  }
  body[data-storefront-theme='light'] .live-chat-launcher {
    background: linear-gradient(135deg, #12b5f5 0%, #2f6df6 52%, #5b4bef 100%);
    box-shadow: 0 10px 22px rgba(37,99,235,0.24), 0 8px 20px rgba(34,211,238,0.18);
  }
  body[data-storefront-theme='dark'] .live-chat-launcher {
    background: var(--qh-action-gradient, linear-gradient(135deg, #00e5ff 0%, #2f6bff 48%, #ff1493 100%));
    box-shadow: var(--qh-action-shadow, 0 0 18px rgba(0,229,255,0.28), 0 0 26px rgba(255,20,147,0.18));
  }
  .live-chat-unread-badge {
    position: absolute;
    top: 0.18rem;
    right: 0.18rem;
    min-width: 1.12rem;
    height: 1.12rem;
    padding: 0 0.28rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #ef4444;
    color: #fff;
    border: 2px solid #fff;
    font-size: 0.62rem;
    line-height: 1;
    font-weight: 900;
    box-shadow: 0 8px 18px rgba(239, 68, 68, 0.32);
    pointer-events: none;
  }
  .live-chat-unread-badge.hidden {
    display: none;
  }
  .mobile-bottom-nav-link .live-chat-unread-badge {
    top: 0.35rem;
    right: 0.75rem;
  }
  .live-chat-launcher.is-expanded {
    width: 10.875rem;
    min-width: 10.875rem;
    justify-content: flex-start;
    gap: 0.55rem;
    padding: 0 1.05rem;
  }
  .live-chat-launcher.is-collapsed {
    width: 3.5rem;
    min-width: 0;
    justify-content: center;
    gap: 0;
    padding: 0;
  }
  .live-chat-launcher-icon {
    width: auto;
    height: auto;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    flex: none;
    transition:
      width 300ms ease,
      height 300ms ease,
      background 300ms ease;
  }
  .live-chat-launcher-icon i {
    color: #fff !important;
    -webkit-text-fill-color: #fff !important;
    filter: drop-shadow(0 2px 6px rgba(15,23,42,0.18));
  }
  .live-chat-launcher.is-expanded .live-chat-launcher-icon {
    width: 2rem;
    height: 2rem;
    background: rgba(255,255,255,0.18);
  }
  .live-chat-launcher.is-collapsed .live-chat-launcher-icon {
    width: auto;
    height: auto;
    background: transparent;
  }
  .live-chat-launcher-label {
    display: inline;
    font-size: 0.92rem;
    line-height: 1;
    max-width: 0;
    opacity: 0;
    transform: translateX(0.8rem);
    overflow: hidden;
    transition:
      max-width 360ms cubic-bezier(0.22, 1, 0.36, 1),
      opacity 220ms ease 80ms,
      transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .live-chat-launcher.is-expanded .live-chat-launcher-label {
    max-width: 7.25rem;
    opacity: 1;
    transform: translateX(0);
  }
  .live-chat-launcher.is-collapsed .live-chat-launcher-label {
    max-width: 0;
    opacity: 0;
    transform: translateX(0.8rem);
  }
  .live-chat-panel {
    position: fixed;
    right: 1.5rem;
    bottom: 6rem;
    z-index: 1011;
    width: min(25rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 8rem));
    display: flex;
    flex-direction: column;
    background: #fff;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 1.25rem;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
    overflow: hidden;
  }
  .live-chat-panel.hidden {
    display: none;
  }
  .live-chat-composer {
    position: relative;
  }
  .live-chat-send-btn {
    background: rgba(37, 99, 235, 0.1);
    color: #2563eb;
    border: 1px solid rgba(37, 99, 235, 0.16);
    box-shadow: none;
    transform: translateY(0);
    transition: background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }
  .live-chat-start-btn,
  .live-chat-send-btn.has-text {
    background: var(--qh-action-gradient, linear-gradient(135deg, #12b5f5 0%, #2f6df6 52%, #5b4bef 100%)) !important;
    color: #fff !important;
    border-color: transparent !important;
    box-shadow: var(--qh-action-shadow, 0 10px 22px rgba(37,99,235,0.24));
  }
  .live-chat-send-btn:active {
    transform: translateY(1px) scale(0.98);
  }
  .live-chat-start-btn {
    transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
  }
  .live-chat-start-btn:hover {
    filter: brightness(1.03);
  }
  .live-chat-start-btn:active {
    transform: translateY(1px) scale(0.98);
  }
  .live-chat-product-trigger {
    color: #2563eb !important;
    background: rgba(234, 242, 255, 0.92) !important;
    border-color: rgba(37, 99, 235, 0.18) !important;
    box-shadow: 0 8px 18px rgba(37, 99, 235, 0.08);
    transition: background 180ms ease, border-color 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 150ms ease;
  }
  .live-chat-product-trigger:hover {
    background: rgba(37, 99, 235, 0.11) !important;
    border-color: rgba(37, 99, 235, 0.3) !important;
  }
  .live-chat-product-trigger:active {
    transform: translateY(1px) scale(0.98);
  }
  .live-chat-messages {
    height: 20rem;
    max-height: calc(100vh - 22rem);
    overflow-y: auto;
    background: linear-gradient(180deg, #fff, #f8fafc);
  }
  .live-chat-bubble {
    position: relative;
    width: fit-content;
    max-width: 82%;
    border-radius: 1rem;
    padding: 0.65rem 0.8rem;
    font-size: 0.875rem;
    line-height: 1.35;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .live-chat-bubble::after {
    content: '';
    position: absolute;
    bottom: 0.04rem;
    width: 0.78rem;
    height: 0.64rem;
  }
  .live-chat-bubble.customer {
    margin-left: auto;
    margin-right: 0;
    background: #ec4899;
    color: #fff;
  }
  .live-chat-bubble.customer::after {
    right: -0.38rem;
    background: #ec4899;
    clip-path: path('M0 0 C2 4 6 7 12 8 C7 8 3 10 0 10 Z');
    transform: rotate(49deg);
  }
  .live-chat-bubble.is-media {
    padding: 0;
    background: transparent;
    color: inherit;
    white-space: normal;
  }
  .live-chat-bubble.is-media::after {
    display: none;
  }
  .live-chat-bubble.admin,
  .live-chat-bubble.system {
    margin-right: auto;
    margin-left: 0;
    background: #e1e2e6;
    color: #1e293b;
  }
  .live-chat-bubble.admin::after,
  .live-chat-bubble.system::after {
    left: -0.38rem;
    background: #e1e2e6;
    clip-path: path('M12 0 C10 4 6 7 0 8 C5 8 9 10 12 10 Z');
    transform: rotate(-49deg);
  }
  #liveChatInput,
  #liveChatGuestPhone,
  #liveChatProductSearch {
    color: #0f172a;
    background: #fff;
    caret-color: #2563eb;
  }
  #liveChatInput:focus,
  #liveChatGuestPhone:focus,
  #liveChatProductSearch:focus {
    border-color: #2f6df6 !important;
    box-shadow: 0 0 0 3px rgba(47, 109, 246, 0.1);
  }
  #liveChatInput::placeholder,
  #liveChatGuestPhone::placeholder,
  #liveChatProductSearch::placeholder {
    color: #94a3b8;
    opacity: 1;
  }
  #liveChatInput {
    min-height: 2.5rem;
    max-height: 6rem;
    resize: none;
    overflow-y: hidden;
    line-height: 1.35;
    padding-top: 0.62rem;
    padding-bottom: 0.62rem;
  }
  #liveChatInput.is-scrollable {
    overflow-y: auto;
  }
  #liveChatInput::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
  .live-chat-product-card {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    border: 1px solid #e2e8f0;
    background: #fff;
    border-radius: 0.9rem;
    padding: 0.65rem;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
  }
  .live-chat-product-card img {
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 0.7rem;
    object-fit: cover;
    background: #f1f5f9;
    flex: none;
  }
  .live-chat-product-picker {
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
    bottom: calc(100% + -0.3rem);
    z-index: 1012;
    display: block;
  }
  .live-chat-product-picker::after {
    content: '';
    position: absolute;
    left: 0.8rem;
    bottom: -0.3rem;
    width: 0;
    height: 0;
    border-left: 0.46rem solid transparent;
    border-right: 0.46rem solid transparent;
    border-top: 0.48rem solid #fff;
    filter: drop-shadow(0 5px 5px rgba(15, 23, 42, 0.08));
  }
  .live-chat-product-picker-panel {
    width: 100%;
    height: min(21rem, calc(100vh - 14rem));
    min-height: 14rem;
    overflow: hidden;
    background: #fff;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 0.35rem;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
  }
  .live-chat-product-picker.hidden {
    display: none;
  }
  .live-chat-product-search-shell {
    position: relative;
  }
  .live-chat-product-search-shell i {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
  }
  .live-chat-product-picker-list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  .live-chat-picker-item {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    padding: 0.65rem 0.75rem;
    border-bottom: 1px solid #f1f5f9;
    background: #fff;
  }
  .live-chat-picker-item:hover {
    background: #f8fafc;
  }
  .live-chat-picker-item img,
  .live-chat-picker-fallback {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.45rem;
    object-fit: cover;
    background: #f1f5f9;
    flex: none;
  }
  .live-chat-picker-name {
    font-size: 0.8rem;
    line-height: 1.2;
    font-weight: 700;
    color: #1e293b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .live-chat-picker-meta {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
    margin-top: 0.18rem;
    font-size: 0.72rem;
    line-height: 1.1;
    color: #94a3b8;
    white-space: nowrap;
  }
  .live-chat-picker-price {
    font-weight: 800;
    background: var(--qh-price-gradient, linear-gradient(135deg, #2563eb 0%, #2f6df6 46%, #22d3ee 100%));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .live-chat-picker-send {
    flex: none;
    padding: 0.48rem 0.78rem;
    border-radius: 0.5rem;
    background: var(--qh-action-gradient, linear-gradient(135deg, #12b5f5 0%, #2f6df6 52%, #5b4bef 100%));
    color: #fff;
    font-size: 0.78rem;
    font-weight: 800;
    box-shadow: var(--qh-action-shadow, 0 10px 22px rgba(37,99,235,0.24));
    transition: transform 150ms ease, box-shadow 150ms ease, filter 150ms ease;
  }
  .live-chat-picker-send:hover {
    filter: brightness(1.03);
    box-shadow: var(--qh-action-shadow, 0 10px 22px rgba(37,99,235,0.24));
  }
  .live-chat-picker-send:active {
    transform: scale(0.97);
  }
  body[data-storefront-theme='dark'] .live-chat-send-btn {
    background: rgba(0, 229, 255, 0.1);
    color: #00e5ff;
    border-color: rgba(0, 229, 255, 0.18);
  }
  body[data-storefront-theme='dark'] .live-chat-product-trigger {
    color: #00e5ff !important;
    background: rgba(5, 7, 13, 0.68) !important;
    border-color: rgba(0, 229, 255, 0.24) !important;
    box-shadow: 0 10px 22px rgba(0, 229, 255, 0.08);
  }
  body[data-storefront-theme='dark'] .live-chat-product-trigger:hover {
    background: rgba(0, 229, 255, 0.1) !important;
    border-color: rgba(0, 229, 255, 0.3) !important;
  }
  body[data-storefront-theme='dark'] #liveChatInput,
  body[data-storefront-theme='dark'] #liveChatGuestPhone,
  body[data-storefront-theme='dark'] #liveChatProductSearch {
    caret-color: #00e5ff;
  }
  body[data-storefront-theme='dark'] #liveChatInput:focus,
  body[data-storefront-theme='dark'] #liveChatGuestPhone:focus,
  body[data-storefront-theme='dark'] #liveChatProductSearch:focus {
    border-color: #00e5ff !important;
    box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.12);
  }
  @media (max-width: 640px) {
    .live-chat-launcher {
      display: none;
    }
    .live-chat-launcher.is-expanded {
      display: none;
    }
    .live-chat-launcher-icon {
      width: auto;
      height: auto;
      background: transparent;
    }
    .live-chat-launcher.is-expanded .live-chat-launcher-icon {
      width: auto;
      height: auto;
      background: transparent;
    }
    .live-chat-launcher-label {
      display: none;
    }
    .live-chat-panel {
      inset: 0;
      width: 100vw;
      height: 100dvh;
      max-height: none;
      border: 0;
      border-radius: 0;
    }
    .live-chat-messages {
      flex: 1;
      height: auto;
      max-height: none;
    }
    .live-chat-composer {
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom)) !important;
    }
    #liveChatInput,
    #liveChatGuestPhone,
    #liveChatProductSearch {
      font-size: 16px;
    }
  }
`
}

type StorefrontLiveChatSectionOptions = {
  brandName?: string
  logoAlt?: string
}

export function storefrontLiveChatSection(options: StorefrontLiveChatSectionOptions = {}): string {
  const brandName = options.brandName || 'QH Boypho'
  const logoAlt = options.logoAlt || brandName
  return `
<button id="liveChatLauncher" type="button" class="live-chat-launcher is-collapsed" onclick="openLiveChat()" aria-label="Chat với shop" title="Chat với shop">
  <span class="live-chat-launcher-icon"><i class="fas fa-comments text-xl"></i></span>
  <span class="live-chat-launcher-label">Chat với shop</span>
  <span class="live-chat-unread-badge hidden" aria-label="Tin nhắn chưa đọc">0</span>
</button>

<div id="liveChatPanel" class="live-chat-panel hidden">
  <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-950 text-white">
    <div class="flex items-center gap-2 min-w-0">
      <span class="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 overflow-hidden border border-white/20">
        <img src="/qh-logo.png" alt="${logoAlt}" class="w-full h-full object-cover">
      </span>
      <div class="min-w-0">
        <p class="font-bold text-sm leading-tight truncate">Chat với ${brandName}</p>
        <p id="liveChatStatus" class="text-xs text-slate-300 leading-tight">Sẵn sàng hỗ trợ</p>
      </div>
    </div>
    <button type="button" onclick="closeLiveChat()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition" aria-label="Đóng chat">
      <i class="fas fa-times"></i>
    </button>
  </div>
  <div id="liveChatPhoneGate" class="p-4 border-b border-slate-100 hidden">
    <label class="block text-xs font-bold text-slate-500 mb-1">Số điện thoại để shop liên hệ</label>
    <div class="flex gap-2">
      <input id="liveChatGuestPhone" type="tel" placeholder="0987 654 321" class="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
      <button type="button" onclick="startLiveChat()" class="live-chat-start-btn px-3 py-2 rounded-xl text-white text-sm font-bold">Bắt đầu</button>
    </div>
  </div>
  <div id="liveChatMessages" class="live-chat-messages p-4 space-y-3">
    <div class="live-chat-bubble admin">Shop đang online, bạn cần hỏi gì cứ nhắn ở đây nhé.</div>
  </div>
  <div class="live-chat-composer p-3 border-t border-slate-100 bg-white">
    <div id="liveChatProductPicker" class="live-chat-product-picker hidden">
      <div class="live-chat-product-picker-panel" onclick="event.stopPropagation()">
        <div class="p-2 border-b border-slate-100">
          <div class="live-chat-product-search-shell">
            <input id="liveChatProductSearch" type="text" placeholder="Tìm kiếm" oninput="renderLiveChatProductPicker()" class="w-full border border-slate-200 rounded-none px-3 py-1.5 pr-9 text-sm focus:outline-none focus:border-pink-400">
            <i class="fas fa-search text-sm"></i>
          </div>
        </div>
        <div id="liveChatProductPickerList" class="live-chat-product-picker-list"></div>
      </div>
    </div>
    <div class="flex gap-2">
      <button id="liveChatProductButton" type="button" onclick="toggleLiveChatProductPicker(event)" class="live-chat-product-trigger w-10 h-10 rounded-xl border transition" title="Gửi sản phẩm" aria-label="Gửi sản phẩm">
        <i class="fas fa-shirt"></i>
      </button>
      <textarea id="liveChatInput" rows="1" placeholder="Nhập tin nhắn..." class="flex-1 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-pink-400" oninput="handleLiveChatTextareaInput()" onkeydown="handleLiveChatInputKey(event)"></textarea>
      <button id="liveChatSendButton" type="button" onclick="sendLiveChatMessage()" class="live-chat-send-btn w-10 h-10 rounded-xl transition" aria-label="Gửi">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</div>
`
}

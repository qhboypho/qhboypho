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
    background: linear-gradient(135deg, #ff4da6, #6d5dfc);
    color: #fff;
    box-shadow: 0 18px 34px rgba(124, 58, 237, 0.34);
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
    background: #fff;
    border: 1px solid rgba(226, 232, 240, 0.95);
    border-radius: 1.25rem;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
    overflow: hidden;
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
    overflow-wrap: anywhere;
    word-break: break-word;
  }
  .live-chat-bubble::after {
    content: '';
    position: absolute;
    bottom: 0.15rem;
    width: 0.7rem;
    height: 0.7rem;
    background: inherit;
    transform: rotate(45deg);
    z-index: 0;
  }
  .live-chat-bubble.customer {
    margin-left: auto;
    margin-right: 0;
    background: #ec4899;
    color: #fff;
  }
  .live-chat-bubble.customer::after {
    right: -0.26rem;
    border-bottom-right-radius: 0.16rem;
  }
  .live-chat-bubble.admin,
  .live-chat-bubble.system {
    margin-right: auto;
    margin-left: 0;
    background: #eef2ff;
    color: #1e293b;
  }
  .live-chat-bubble.admin::after,
  .live-chat-bubble.system::after {
    left: -0.26rem;
    border-bottom-left-radius: 0.16rem;
  }
  #liveChatInput,
  #liveChatGuestPhone,
  #liveChatProductSearch {
    color: #0f172a;
    background: #fff;
    caret-color: #ec4899;
  }
  #liveChatInput::placeholder,
  #liveChatGuestPhone::placeholder,
  #liveChatProductSearch::placeholder {
    color: #94a3b8;
    opacity: 1;
  }
  .live-chat-product-card {
    display: flex;
    gap: 0.7rem;
    align-items: center;
    border: 1px solid #f9a8d4;
    background: #fff7fb;
    border-radius: 0.9rem;
    padding: 0.65rem;
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
    position: fixed;
    inset: 0;
    z-index: 1012;
    background: rgba(15, 23, 42, 0.56);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }
  .live-chat-product-picker-panel {
    width: min(42rem, 100%);
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: hidden;
    background: #fff;
    border-radius: 1.25rem;
    box-shadow: 0 24px 80px rgba(15, 23, 42, 0.3);
    display: flex;
    flex-direction: column;
  }
  @media (max-width: 640px) {
    .live-chat-launcher {
      right: 0.9rem;
      bottom: 4.9rem;
      width: 3.5rem;
      min-width: 0;
      padding: 0;
      gap: 0;
    }
    .live-chat-launcher.is-expanded {
      width: 3.5rem;
      min-width: 0;
      padding: 0;
      gap: 0;
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
      right: 0.75rem;
      bottom: 8.75rem;
      width: calc(100vw - 1.5rem);
      max-height: calc(100vh - 9.5rem);
    }
    .live-chat-messages {
      height: 18rem;
    }
  }
`
}

export function storefrontLiveChatSection(): string {
  return `
<button id="liveChatLauncher" type="button" class="live-chat-launcher is-collapsed" onclick="openLiveChat()" aria-label="Chat với shop" title="Chat với shop">
  <span class="live-chat-launcher-icon"><i class="fas fa-comments text-xl"></i></span>
  <span class="live-chat-launcher-label">Chat với shop</span>
</button>

<div id="liveChatPanel" class="live-chat-panel hidden">
  <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-950 text-white">
    <div class="flex items-center gap-2 min-w-0">
      <span class="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shrink-0"><i class="fas fa-headset text-sm"></i></span>
      <div class="min-w-0">
        <p class="font-bold text-sm leading-tight truncate">Chat với QH Boypho</p>
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
      <button type="button" onclick="startLiveChat()" class="px-3 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold">Bắt đầu</button>
    </div>
  </div>
  <div id="liveChatMessages" class="live-chat-messages p-4 space-y-3">
    <div class="live-chat-bubble admin">Shop đang online, bạn cần hỏi gì cứ nhắn ở đây nhé.</div>
  </div>
  <div class="p-3 border-t border-slate-100 bg-white">
    <div class="flex gap-2">
      <button type="button" onclick="openLiveChatProductPicker()" class="w-10 h-10 rounded-xl border border-slate-200 text-pink-500 hover:bg-pink-50 transition" title="Gửi sản phẩm" aria-label="Gửi sản phẩm">
        <i class="fas fa-shirt"></i>
      </button>
      <input id="liveChatInput" type="text" placeholder="Nhập tin nhắn..." class="flex-1 border border-slate-200 rounded-xl px-3 text-sm focus:outline-none focus:border-pink-400" onkeydown="handleLiveChatInputKey(event)">
      <button type="button" onclick="sendLiveChatMessage()" class="w-10 h-10 rounded-xl bg-slate-950 text-white hover:bg-pink-600 transition" aria-label="Gửi">
        <i class="fas fa-paper-plane"></i>
      </button>
    </div>
  </div>
</div>

<div id="liveChatProductPicker" class="live-chat-product-picker hidden">
  <div class="live-chat-product-picker-panel">
    <div class="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
      <h3 class="font-bold text-slate-900">Gửi sản phẩm vào chat</h3>
      <button type="button" onclick="closeLiveChatProductPicker()" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500" aria-label="Đóng"><i class="fas fa-times"></i></button>
    </div>
    <div class="p-3 border-b border-slate-100">
      <input id="liveChatProductSearch" type="text" placeholder="Tìm sản phẩm..." oninput="renderLiveChatProductPicker()" class="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-pink-400">
    </div>
    <div id="liveChatProductPickerList" class="p-3 overflow-y-auto space-y-2"></div>
  </div>
</div>
`
}

import type { AppBindings } from '../types/app'

type SocketAttachment = {
  role: 'customer' | 'admin'
  conversationId: string
  connectedAt: number
}

function safeSend(ws: WebSocket, payload: unknown) {
  try {
    ws.send(JSON.stringify(payload))
  } catch {
    try {
      ws.close(1011, 'send failed')
    } catch {}
  }
}

export class LiveChatRoom {
  private ctx: DurableObjectState
  private env: AppBindings

  constructor(ctx: DurableObjectState, env: AppBindings) {
    this.ctx = ctx
    this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.endsWith('/broadcast') && request.method === 'POST') {
      const payload = await request.json().catch(() => null)
      if (!payload) return new Response('Bad payload', { status: 400 })
      this.broadcast(payload)
      return Response.json({ success: true })
    }

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 })
    }

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    const role = url.searchParams.get('role') === 'admin' ? 'admin' : 'customer'
    const conversationId = url.searchParams.get('conversationId') || ''

    this.ctx.acceptWebSocket(server)
    server.serializeAttachment({
      role,
      conversationId,
      connectedAt: Date.now(),
    } satisfies SocketAttachment)

    safeSend(server, {
      type: 'connected',
      role,
      conversation_id: conversationId,
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    const attachment = ws.deserializeAttachment() as SocketAttachment | null
    if (typeof message === 'string' && message === 'ping') {
      safeSend(ws, { type: 'pong', at: Date.now() })
      return
    }
    safeSend(ws, {
      type: 'socket_echo',
      role: attachment?.role || 'customer',
      conversation_id: attachment?.conversationId || '',
    })
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    try {
      ws.close(code, reason)
    } catch {}
  }

  private broadcast(payload: unknown) {
    const message = {
      type: 'message_created',
      ...((payload && typeof payload === 'object') ? payload as Record<string, unknown> : { payload }),
    }
    for (const ws of this.ctx.getWebSockets()) {
      safeSend(ws, message)
    }
  }
}

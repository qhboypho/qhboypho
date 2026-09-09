import { cleanupExpiredLiveChat } from './routes/liveChatRoutes'
import type { AppBindings } from './types/app'

export { LiveChatRoom } from './durable/liveChatRoom'

// Only Pages bindings can reach the chat objects. No public fetch endpoint.
export default {
  async scheduled(_controller: ScheduledController, env: Pick<AppBindings, 'DB'>) {
    await cleanupExpiredLiveChat(env.DB)
  },
} satisfies ExportedHandler<Pick<AppBindings, 'DB'>>

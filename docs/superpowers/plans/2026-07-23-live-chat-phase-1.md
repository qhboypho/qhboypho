# Live Chat Phase 1 Plan

1. Add a contract test that locks the expected live chat schema, routes, bindings, storefront widget, and admin inbox.
2. Add D1 migration for conversations and messages with 7-day retention metadata.
3. Add a `LiveChatRoom` Durable Object for per-conversation WebSocket fan-out.
4. Add live chat HTTP routes for starting conversations, posting messages, listing messages, product context, admin inbox, admin replies, WebSocket upgrades, and cleanup.
5. Wire the routes and Durable Object export into the Hono app and Wrangler config.
6. Add storefront widget with guest phone gate and product context send/picker.
7. Add admin live chat page with conversation list, message panel, reply box, realtime socket, and sound notification.
8. Run contract test and production build.

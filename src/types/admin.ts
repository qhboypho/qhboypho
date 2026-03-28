import type { Context } from 'hono'
import type { AppBindings } from './app'

export type AppContext = Context<{ Bindings: AppBindings }>

export type AppSettingEntry = {
  key: string
  value: string
}

export type AdminProfile = {
  scope: 'db-user' | 'legacy-admin'
  adminUserKey: string
  userId: number
  email: string
  name: string
  avatar: string
  balance: number
  is_admin: 1
}


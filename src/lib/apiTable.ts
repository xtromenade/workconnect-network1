import { apiRequest } from './apiClient'

interface ListQuery {
  where?: Record<string, unknown>
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
}

/**
 * Drop-in replacement for `blink.db.table<T>('name')`. Same method shapes
 * (list/get/create/update), so hooks written against the Blink SDK need only
 * swap the import — the query logic underneath is unchanged.
 */
export function apiTable<T extends { id: string }>(tableName: string) {
  return {
    async list(query?: ListQuery): Promise<T[]> {
      const params = new URLSearchParams()
      if (query?.where) params.set('where', JSON.stringify(query.where))
      if (query?.orderBy) params.set('orderBy', JSON.stringify(query.orderBy))
      if (query?.limit) params.set('limit', String(query.limit))
      const qs = params.toString()
      const { records } = await apiRequest<{ records: T[] }>(`/api/records/${tableName}${qs ? `?${qs}` : ''}`)
      return records
    },

    async get(id: string): Promise<T | null> {
      try {
        const { record } = await apiRequest<{ record: T }>(`/api/records/${tableName}/${id}`)
        return record
      } catch {
        return null
      }
    },

    async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
      const { record } = await apiRequest<{ record: T }>(`/api/records/${tableName}`, { method: 'POST', body: data })
      return record
    },

    async update(id: string, data: Partial<T>): Promise<T> {
      const { record } = await apiRequest<{ record: T }>(`/api/records/${tableName}/${id}`, { method: 'PATCH', body: data })
      return record
    },

    async remove(id: string): Promise<void> {
      await apiRequest(`/api/records/${tableName}/${id}`, { method: 'DELETE' })
    },
  }
}

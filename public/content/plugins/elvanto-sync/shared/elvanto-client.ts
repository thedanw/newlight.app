/**
 * Shared Elvanto API Client — Used by both browser (via proxy) and Edge Function (direct)
 */

import type { ElvantoPerson, ElvantoPeopleResponse, ElvantoCategory } from './sync-types'

const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1'

export interface ElvantoClientOptions {
  apiKey: string
  baseUrl?: string
  maxConcurrent?: number
  defaultPageSize?: number
  isBrowser?: boolean
  supabaseUrl?: string
  accessToken?: string
}

export class ElvantoApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public endpoint: string,
    public requestBody: any
  ) {
    super(message)
    this.name = 'ElvantoApiError'
  }
}

class RateLimiter {
  private running = 0
  private queue: Array<() => void> = []
  private maxConcurrent: number
  
  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent
  }
  
  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++
      return
    }
    
    return new Promise(resolve => {
      this.queue.push(resolve)
    })
  }
  
  release(): void {
    this.running--
    if (this.queue.length > 0) {
      this.running++
      const next = this.queue.shift()
      if (next) next()
    }
  }
}

export class ElvantoClient {
  private apiKey: string
  private baseUrl: string
  private rateLimiter: RateLimiter
  private defaultPageSize: number
  private isBrowser: boolean
  private supabaseUrl?: string
  private accessToken?: string
  
  constructor(options: ElvantoClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || ELVANTO_BASE_URL
    this.rateLimiter = new RateLimiter(options.maxConcurrent ?? 2)
    this.defaultPageSize = options.defaultPageSize ?? 1000
    this.isBrowser = options.isBrowser ?? false
    this.supabaseUrl = options.supabaseUrl
    this.accessToken = options.accessToken
  }
  
  private getAuthHeader(): string {
    return `Basic ${btoa(this.apiKey + ':')}`
  }
  
  private getProxyUrl(endpoint: string): string {
    if (this.isBrowser) {
      return `/api/elvanto/v1/${endpoint}.json`
    }
    return `${this.baseUrl}/${endpoint}.json`
  }
  
  private async fetchWithProxy(url: string, body: Record<string, any>, options: RequestInit = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    
    if (!this.isBrowser) {
      headers['Authorization'] = this.getAuthHeader()
    } else if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }
    
    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      ...options,
    })
  }
  
  async request<T>(
    endpoint: string,
    body: Record<string, any> = {},
    options: { 
      method?: 'POST'
      retries?: number
      timeout?: number
    } = {}
  ): Promise<T> {
    const { retries = 3, timeout = 30000 } = options
    
    await this.rateLimiter.acquire()
    
    try {
      const url = this.getProxyUrl(endpoint)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await this.fetchWithProxy(url, body, { signal: controller.signal })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const error = new ElvantoApiError(
              response.status,
              errorData.error?.message || response.statusText,
              endpoint,
              body
            )
            
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              throw error
            }
            
            if (attempt < retries) {
              const retryAfter = response.headers.get('Retry-After')
              const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
              await new Promise(r => setTimeout(r, delay))
              continue
            }
            
            throw error
          }
          
          const data = await response.json()
          
          if (data.status === 'error' || data.error) {
            const error = new ElvantoApiError(
              data.error?.code || 500,
              data.error?.message || 'Unknown API error',
              endpoint,
              body
            )
            throw error
          }
          
          return data as T
          
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          
          if (err instanceof ElvantoApiError && err.code >= 400 && err.code < 500 && err.code !== 429) {
            throw err
          }
          
          if (attempt < retries) {
            const delay = Math.pow(2, attempt) * 1000
            await new Promise(r => setTimeout(r, delay))
            continue
          }
        }
      }
      
      throw lastError || new Error('Request failed after retries')
      
    } finally {
      this.rateLimiter.release()
    }
  }
  
  async getAllPages<T>(
    endpoint: string,
    baseBody: Record<string, any> = {},
    options: {
      pageSize?: number
      maxPages?: number
      onPage?: (page: number, items: T[]) => void
    } = {}
  ): Promise<T[]> {
    const { pageSize = this.defaultPageSize, maxPages = 100, onPage } = options
    const allItems: T[] = []
    let page = 1
    let hasMore = true
    
    while (hasMore && page <= maxPages) {
      const body = {
        ...baseBody,
        page,
        page_size: pageSize,
      }
      
      const response = await this.request<{ [key: string]: T[] | number }>(endpoint, body)
      
      const itemsKey = Object.keys(response).find(
        k => Array.isArray(response[k]) && k !== 'on_this_page' && k !== 'page' && k !== 'per_page' && k !== 'total'
      )
      
      const items = itemsKey ? (response[itemsKey] as T[]) : []
      allItems.push(...items)
      
      if (onPage) {
        onPage(page, items)
      }
      
      hasMore = items.length === pageSize
      page++
      
      if (hasMore) {
        await new Promise(r => setTimeout(r, 100))
      }
    }
    
    return allItems
  }
  
  async getById<T>(endpoint: string, id: string, fields?: string[]): Promise<T | null> {
    const body: Record<string, any> = { id }
    if (fields?.length) body.fields = fields
    
    const response = await this.request<any>(endpoint, body)
    
    const resourceKey = Object.keys(response).find(
      k => k !== 'generated_in' && k !== 'status'
    )
    
    const items = resourceKey ? response[resourceKey] : null
    return items?.[0] ?? null
  }
  
  async getPeople(
    page: number,
    pageSize: number,
    dateModifiedSince?: string,
    fields?: string[]
  ): Promise<ElvantoPeopleResponse> {
    const body: Record<string, any> = { page, page_size: pageSize }
    
    if (fields && fields.length > 0) {
      body.fields = fields
    }
    
    if (dateModifiedSince) {
      body.search = { date_modified: dateModifiedSince }
      return this.request<ElvantoPeopleResponse>('people/search', body)
    }
    
    return this.request<ElvantoPeopleResponse>('people/getAll', body)
  }
  
  async getCategories(): Promise<ElvantoCategory[]> {
    const response = await this.request<{ categories: { category: ElvantoCategory[] } }>('people/categories/getAll', {})
    return response.categories.category
  }
  
  async getCustomFields(): Promise<any[]> {
    const response = await this.request<{ custom_fields: { custom_field: any[] } }>('people/customFields/getAll', {})
    return response.custom_fields?.custom_field ?? []
  }
}

let defaultClient: ElvantoClient | null = null

export function createElvantoClient(options: ElvantoClientOptions): ElvantoClient {
  return new ElvantoClient(options)
}

export function getDefaultClient(): ElvantoClient | null {
  return defaultClient
}

export function setDefaultClient(client: ElvantoClient): void {
  defaultClient = client
}
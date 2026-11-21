/**
 * Elvanto API Client — Base client with auth, pagination, rate limiting, error handling
 */

const ELVANTO_BASE_URL = 'https://api.elvanto.com/v1'

export interface ElvantoClientOptions {
  apiKey: string
  baseUrl?: string
  maxConcurrent?: number
  defaultPageSize?: number
}

export interface ElvantoResponse<_T> {
  generated_in: string
  status: 'ok' | 'error'
  [key: string]: any
}

export interface ElvantoError {
  error: {
    code: number
    message: string
  }
}

export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface ElvantoListResponse<T> {
  on_this_page: number
  page: number
  per_page: number
  total: number
  [key: string]: T[] | number
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

/**
 * Rate limiter for concurrent requests
 */
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

/**
 * Main Elvanto API Client
 */
export class ElvantoClient {
  private apiKey: string
  private baseUrl: string
  private rateLimiter: RateLimiter
  private defaultPageSize: number
  
  constructor(options: ElvantoClientOptions) {
    this.apiKey = options.apiKey
    this.baseUrl = options.baseUrl || ELVANTO_BASE_URL
    this.rateLimiter = new RateLimiter(options.maxConcurrent ?? 2)
    this.defaultPageSize = options.defaultPageSize ?? 1000
  }
  
  /**
   * Make a request to the Elvanto API
   */
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
      const url = `${this.baseUrl}/${endpoint}.json`
      const authHeader = `Basic ${btoa(this.apiKey + ':')}`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      let lastError: Error | null = null
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          })
          
          clearTimeout(timeoutId)
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            const error = new ElvantoApiError(
              response.status,
              errorData.error?.message || response.statusText,
              endpoint,
              body
            )
            
            // Don't retry on client errors (4xx except 429)
            if (response.status >= 400 && response.status < 500 && response.status !== 429) {
              throw error
            }
            
            // Retry on 429 (rate limit) and 5xx
            if (attempt < retries) {
              const retryAfter = response.headers.get('Retry-After')
              const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000
              await new Promise(r => setTimeout(r, delay))
              continue
            }
            
            throw error
          }
          
          const data = await response.json()
          
          // Check for API-level errors in successful responses
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
          
          // Don't retry on non-retryable errors
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
  
  /**
   * Get all pages for a list endpoint (handles pagination automatically)
   */
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
      
      const response = await this.request<ElvantoListResponse<T>>(endpoint, body)
      
      // Extract items from response (key varies by endpoint)
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
      
      // Small delay between pages to be nice to the API
      if (hasMore) {
        await new Promise(r => setTimeout(r, 100))
      }
    }
    
    return allItems
  }
  
  /**
   * Get a single item by ID (using getInfo endpoint pattern)
   */
  async getById<T>(endpoint: string, id: string, fields?: string[]): Promise<T | null> {
    const body: Record<string, any> = { id }
    if (fields?.length) body.fields = fields
    
    const response = await this.request<any>(endpoint, body)
    
    // Response format: { generated_in, status, <resource>: [item] }
    const resourceKey = Object.keys(response).find(
      k => k !== 'generated_in' && k !== 'status'
    )
    
    const items = resourceKey ? response[resourceKey] : null
    return items?.[0] ?? null
  }
}

/**
 * Create a client instance (singleton pattern for convenience)
 */
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
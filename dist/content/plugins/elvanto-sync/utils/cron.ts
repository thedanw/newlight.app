/**
 * Cron Expression Utilities — Parsing and validation for cron expressions
 * Used by ScheduleTab for cron editor validation
 */

export interface CronExpression {
  minute: string
  hour: string
  dayOfMonth: string
  month: string
  dayOfWeek: string
}

export interface CronValidationResult {
  valid: boolean
  error?: string
  parsed?: CronExpression
  nextRun?: Date
  description?: string
}

/**
 * Parse a cron expression into its components
 * Format: minute hour dayOfMonth month dayOfWeek
 * Supports: *, *\/n, n-m, n,m, ranges
 */
export function parseCronExpression(expression: string): CronValidationResult {
  const parts = expression.trim().split(/\s+/)
  
  if (parts.length !== 5) {
    return {
      valid: false,
      error: 'Cron expression must have exactly 5 fields (minute hour dayOfMonth month dayOfWeek)',
    }
  }
  
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  
  // Validate each field
  const minuteResult = validateCronField(minute, 0, 59, 'minute')
  if (!minuteResult.valid) return minuteResult
  
  const hourResult = validateCronField(hour, 0, 23, 'hour')
  if (!hourResult.valid) return hourResult
  
  const dayOfMonthResult = validateCronField(dayOfMonth, 1, 31, 'day of month')
  if (!dayOfMonthResult.valid) return dayOfMonthResult
  
  const monthResult = validateCronField(month, 1, 12, 'month')
  if (!monthResult.valid) return monthResult
  
  const dayOfWeekResult = validateCronField(dayOfWeek, 0, 7, 'day of week', true)
  if (!dayOfWeekResult.valid) return dayOfWeekResult
  
  return {
    valid: true,
    parsed: { minute, hour, dayOfMonth, month, dayOfWeek },
    description: generateDescription(minute, hour, dayOfMonth, month, dayOfWeek),
    nextRun: calculateNextRun(minute, hour, dayOfMonth, month, dayOfWeek),
  }
}

function validateCronField(
  field: string, 
  min: number, 
  max: number, 
  fieldName: string,
  allowSeven = false
): CronValidationResult {
  // Allow *
  if (field === '*') return { valid: true }
  
  // Allow */n (step)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2), 10)
    if (isNaN(step) || step < 1 || step > max) {
      return { valid: false, error: `Invalid step value in ${fieldName}: ${step}` }
    }
    return { valid: true }
  }
  
  // Allow ranges (n-m)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(s => parseInt(s.trim(), 10))
    if (isNaN(start) || isNaN(end) || start < min || end > max || start > end) {
      return { valid: false, error: `Invalid range in ${fieldName}: ${field}` }
    }
    return { valid: true }
  }
  
  // Allow lists (n,m,p)
  if (field.includes(',')) {
    const values = field.split(',').map(s => parseInt(s.trim(), 10))
    for (const v of values) {
      if (isNaN(v) || v < min || v > max) {
        return { valid: false, error: `Invalid value in ${fieldName} list: ${v}` }
      }
    }
    return { valid: true }
  }
  
  // Single value
  const value = parseInt(field, 10)
  if (isNaN(value)) {
    return { valid: false, error: `Invalid ${fieldName} value: ${field}` }
  }
  
  const effectiveMax = allowSeven && fieldName === 'day of week' ? 7 : max
  if (value < min || value > effectiveMax) {
    return { valid: false, error: `${fieldName} value out of range (${min}-${effectiveMax}): ${value}` }
  }
  
  return { valid: true }
}

/**
 * Generate human-readable description of cron expression
 */
function generateDescription(
  minute: string, 
  hour: string, 
  dayOfMonth: string, 
  month: string, 
  dayOfWeek: string
): string {
  const parts: string[] = []
  
  // Time
  if (minute !== '*' && hour !== '*') {
    parts.push(`at ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`)
  } else if (hour !== '*') {
    parts.push(`at ${hour.padStart(2, '0')}:00`)
  } else if (minute !== '*') {
    parts.push(`at minute ${minute} of every hour`)
  }
  
  // Day of week
  if (dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(Number)
      parts.push(`on ${days[start]} through ${days[end]}`)
    } else if (dayOfWeek.includes(',')) {
      const dayNames = dayOfWeek.split(',').map(d => days[parseInt(d)]).join(', ')
      parts.push(`on ${dayNames}`)
    } else {
      const dayNum = parseInt(dayOfWeek)
      if (!isNaN(dayNum)) {
        parts.push(`on ${days[dayNum]}`)
      }
    }
  }
  
  // Day of month
  if (dayOfMonth !== '*') {
    if (dayOfMonth.includes('-')) {
      parts.push(`on days ${dayOfMonth} of the month`)
    } else if (dayOfMonth.includes(',')) {
      parts.push(`on days ${dayOfMonth} of the month`)
    } else {
      parts.push(`on day ${dayOfMonth} of the month`)
    }
  }
  
  // Month
  if (month !== '*') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    if (month.includes('-')) {
      const [start, end] = month.split('-').map(Number)
      parts.push(`in ${months[start - 1]} through ${months[end - 1]}`)
    } else if (month.includes(',')) {
      const monthNames = month.split(',').map(m => months[parseInt(m) - 1]).join(', ')
      parts.push(`in ${monthNames}`)
    } else {
      const monthNum = parseInt(month)
      if (!isNaN(monthNum)) {
        parts.push(`in ${months[monthNum - 1]}`)
      }
    }
  }
  
  if (parts.length === 0) return 'Every minute'
  if (parts.length === 1) return parts[0]
  return parts.join(', ')
}

/**
 * Calculate the next run time for a cron expression
 * Simplified implementation - returns approximate next run
 */
function calculateNextRun(
  minute: string, 
  hour: string, 
  _dayOfMonth: string, 
  _month: string, 
  _dayOfWeek: string
): Date | undefined {
  // This is a simplified implementation
  // A full implementation would use a proper cron parser library
  try {
    const now = new Date()
    const next = new Date(now)
    
    // Set to next minute if minute is specific
    if (minute !== '*') {
      const m = parseInt(minute)
      if (!isNaN(m)) {
        next.setMinutes(m, 0, 0)
        if (next <= now) next.setHours(next.getHours() + 1)
      }
    } else {
      next.setMinutes(now.getMinutes() + 1, 0, 0)
    }
    
    if (hour !== '*') {
      const h = parseInt(hour)
      if (!isNaN(h)) {
        next.setHours(h)
        if (next <= now) next.setDate(next.getDate() + 1)
      }
    }
    
    return next
  } catch {
    return undefined
  }
}

/**
 * Common cron expressions for quick selection
 */
export const COMMON_CRON_EXPRESSIONS = [
  { expression: '0 2 * * *', label: 'Daily at 02:00 UTC', description: 'Every day at 02:00' },
  { expression: '0 3 * * *', label: 'Daily at 03:00 UTC', description: 'Every day at 03:00' },
  { expression: '0 4 * * *', label: 'Daily at 04:00 UTC', description: 'Every day at 04:00' },
  { expression: '0 2 * * 0', label: 'Weekly on Sunday at 02:00 UTC', description: 'Every Sunday at 02:00' },
  { expression: '0 2 * * 1', label: 'Weekly on Monday at 02:00 UTC', description: 'Every Monday at 02:00' },
  { expression: '0 2 * * 5', label: 'Weekly on Friday at 02:00 UTC', description: 'Every Friday at 02:00' },
  { expression: '0 2 1 * *', label: 'Monthly on 1st at 02:00 UTC', description: '1st of every month at 02:00' },
  { expression: '0 2 15 * *', label: 'Monthly on 15th at 02:00 UTC', description: '15th of every month at 02:00' },
  { expression: '0 2 * * 1-5', label: 'Weekdays at 02:00 UTC', description: 'Monday-Friday at 02:00' },
  { expression: '0 */6 * * *', label: 'Every 6 hours', description: 'At minute 0 every 6 hours' },
  { expression: '*/15 * * * *', label: 'Every 15 minutes', description: 'Every 15 minutes' },
  { expression: '0 0 * * *', label: 'Daily at midnight UTC', description: 'Every day at 00:00' },
]

/**
 * Validate and get description for a cron expression
 */
export function validateAndDescribeCron(expression: string): CronValidationResult {
  return parseCronExpression(expression)
}

/**
 * Get cron expression from human-readable schedule
 */
export function cronFromSchedule(schedule: {
  frequency: 'daily' | 'weekly' | 'monthly' | 'hourly' | 'custom'
  time?: string // HH:MM format
  daysOfWeek?: number[] // 0-6
  dayOfMonth?: number
}): string {
  switch (schedule.frequency) {
    case 'daily':
      const [hour, minute] = schedule.time?.split(':').map(Number) || [2, 0]
      return `${minute} ${hour} * * *`
    
    case 'weekly':
      const [wHour, wMinute] = schedule.time?.split(':').map(Number) || [2, 0]
      const days = schedule.daysOfWeek?.join(',') || '0'
      return `${wMinute} ${wHour} * * ${days}`
    
    case 'monthly':
      const [mHour, mMinute] = schedule.time?.split(':').map(Number) || [2, 0]
      const day = schedule.dayOfMonth || 1
      return `${mMinute} ${mHour} ${day} * *`
    
    case 'hourly':
      return `0 * * * *`
    
    case 'custom':
    default:
      return '0 2 * * *'
  }
}
'use client'
import { Card, Heading, Text } from '@/core/ui'

/**
 * ChurchInformationSection — stub for Batch 2.
 * Full 12-field form (8 BrandForm fields + 4 new) lands in Batch 3.
 */
export default function ChurchInformationSection() {
  return (
    <Card.Root>
      <Card.Body>
        <Heading textStyle="md">Church Information</Heading>
        <Text color="fg.muted" textStyle="sm">
          Church name, app name, contact details, and brand/theme settings.
          Full form coming in Batch 3.
        </Text>
      </Card.Body>
    </Card.Root>
  )
}
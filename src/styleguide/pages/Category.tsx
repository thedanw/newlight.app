import { Badge, Card, Heading, Icon, Text } from '@/core/ui'
import { Box, HStack, Stack } from 'styled-system/jsx'
import { type TocCategory } from '../toc'

/* ---------------------------------------------------------------------------
   Minimal category placeholder — Batch 5 exercises the push/pop stack with
   real content. Batch 7 replaces this with the full subpage template (one
   Card per component, Accordion sections for long pages).
--------------------------------------------------------------------------- */

export function CategoryPage({ category }: { category: TocCategory }) {
  const CategoryIcon = category.icon

  return (
    <Stack gap="8">
      <HStack gap="4" alignItems="center">
        <Box
          boxSize="12"
          borderRadius="l2"
          bg="colorPalette.subtle.bg"
          color="colorPalette.subtle.fg"
          display="grid"
          placeItems="center"
        >
          <Icon size="lg">
            <CategoryIcon />
          </Icon>
        </Box>
        <Stack gap="1">
          <Heading textStyle="2xl">{category.name}</Heading>
          <Text color="fg.muted" textStyle="sm">
            {category.description}
          </Text>
        </Stack>
      </HStack>

      <Text textStyle="sm" color="fg.muted">
        {category.components.length} components — the full subpage template lands in Batch 7.
      </Text>

      <Stack gap="3">
        {category.components.map((component) => (
          <Card.Root key={component.name}>
            <Card.Body>
              <HStack justify="space-between" alignItems="flex-start" gap="4">
                <Stack gap="0.5">
                  <Heading textStyle="md">{component.name}</Heading>
                  <Text textStyle="sm" color="fg.muted">
                    {component.description}
                  </Text>
                </Stack>
                <Badge colorPalette={component.shipped ? 'green' : 'gray'}>
                  {component.shipped ? 'shipped' : 'pending'}
                </Badge>
              </HStack>
            </Card.Body>
          </Card.Root>
        ))}
      </Stack>
    </Stack>
  )
}

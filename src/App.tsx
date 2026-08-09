import { Badge, Button, Separator } from '@/core/ui'
import { HStack, Stack } from 'styled-system/jsx'

function App() {
  return (
    <main style={{ padding: 32 }}>
      <Stack gap="6" alignItems="flex-start">
        <h1 style={{ fontSize: 32, fontWeight: 700 }}>New Light — UI/UX Design Lab</h1>
        <p>Scaffold + Panda + Park UI wired.</p>
        <Separator />
        <HStack gap="4">
          <Button>Primary</Button>
          <Button variant="outline" colorPalette="gray">
            Outline
          </Button>
          <Badge colorPalette="orange">Badge</Badge>
        </HStack>
      </Stack>
    </main>
  )
}

export default App

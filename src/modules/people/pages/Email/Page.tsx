import { EmailComposer } from '@/core/email'
import { Page } from '@/core/ui'
import { Mail } from 'lucide-react'

export default function EmailPage() {
  return (
    <Page.Main>
      <Page.Header>
        <Page.Heading level={1} icon={Mail} title="Compose Email" />
      </Page.Header>
      <Page.Body>
        <EmailComposer />
      </Page.Body>
    </Page.Main>
  )
}

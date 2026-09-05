'use client'
import type { ReactNode } from 'react'
import { HStack, Stack } from 'styled-system/jsx'
import { Alert, Button, Loader, Progress, Skeleton, SkeletonCircle, SkeletonText, Spinner, toaster } from '@/core/ui'

/* ---------------------------------------------------------------------------
   Feedback demos — Alert, Loader, Progress, Skeleton, Spinner, Toast.
--------------------------------------------------------------------------- */

export const feedbackDemos: Record<string, ReactNode> = {
  Alert: (
    <Alert.Root>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Heads up</Alert.Title>
        <Alert.Description>This is an informational alert.</Alert.Description>
      </Alert.Content>
    </Alert.Root>
  ),
  Loader: <Loader text="Loading…" />,
  Progress: (
    <Progress.Root value={70} max={100}>
      <Progress.Label>Uploading</Progress.Label>
      <Progress.Track>
        <Progress.Range />
      </Progress.Track>
      <Progress.ValueText>70%</Progress.ValueText>
    </Progress.Root>
  ),
  Skeleton: (
    <Stack gap="3" w="full">
      <SkeletonText noOfLines={2} />
      <HStack gap="3">
        <SkeletonCircle boxSize="10" />
        <Skeleton h="4" flex="1" />
      </HStack>
    </Stack>
  ),
  Spinner: <Spinner size="md" />,
  Toast: (
    <Button
      onClick={() =>
        toaster.create({
          title: 'Changes saved',
          description: 'Your design has been applied to the shell.',
          type: 'success',
        })
      }
    >
      Show toast
    </Button>
  ),
}

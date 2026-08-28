import { createBrowserRouter } from 'react-router-dom'
import { lazy } from 'react'
import StyleguideApp from '@/styleguide/App'
import { peopleRoutes } from '@/modules/people/routes'
import { coreRoutes } from '@/core/routes'

const FormPublicPage = lazy(() => import('@/modules/people/pages/FormPublicPage'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StyleguideApp />,
  },
  {
    path: '/people',
    children: peopleRoutes,
  },
  {
    path: '/forms/:formId',
    element: <FormPublicPage />,
  },
  ...coreRoutes,
])

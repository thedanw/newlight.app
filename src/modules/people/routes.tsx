import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

const PeopleLayout = lazy(() => import('./pages/PeopleLayout'))
const PeopleListPage = lazy(() => import('./pages/PeopleListPage'))
const PersonProfilePage = lazy(() => import('./pages/PersonProfilePage'))
const CreatePersonPage = lazy(() => import('./pages/CreatePersonPage'))
const EditPersonPage = lazy(() => import('./pages/EditPersonPage'))
const HouseholdPage = lazy(() => import('./pages/HouseholdPage'))
const JourneyGridPage = lazy(() => import('./pages/JourneyGridPage'))
const JourneySettingsPage = lazy(() => import('./pages/JourneySettingsPage'))
const TagsPage = lazy(() => import('./pages/TagsPage'))
const FormsListPage = lazy(() => import('./pages/FormsListPage'))
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage'))
const FormSubmissionsPage = lazy(() => import('./pages/FormSubmissionsPage'))

export const peopleRoutes: RouteObject[] = [
  {
    element: <PeopleLayout />,
    children: [
      { index: true, element: <PeopleListPage /> },
      { path: 'new', element: <CreatePersonPage /> },
      { path: ':id/edit', element: <EditPersonPage /> },
      { path: 'journey', element: <JourneyGridPage /> },
      { path: 'journey/settings', element: <JourneySettingsPage /> },
        { path: 'tags', element: <TagsPage /> },
      { path: 'forms', element: <FormsListPage /> },
      { path: 'forms/new', element: <FormBuilderPage /> },
      { path: 'forms/:id/edit', element: <FormBuilderPage /> },
      { path: 'forms/:id/submissions', element: <FormSubmissionsPage /> },
      { path: 'households/:id', element: <HouseholdPage /> },
      { path: ':id', element: <PersonProfilePage /> },
    ],
  },
]

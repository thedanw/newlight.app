import { RouterProvider } from 'react-router-dom'
import { router } from './core/router'
import { SettingsProvider } from './core/settings/SettingsProvider'
import { Toaster } from './core/ui'

export default function App() {
	return (
		<SettingsProvider>
			<RouterProvider router={router} />
			{/* Toaster mounted once at the root so toasts work on every route */}
			<Toaster />
		</SettingsProvider>
	)
}

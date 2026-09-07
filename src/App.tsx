import { RouterProvider } from 'react-router-dom'
import { router } from './core/router'
import { AuthProvider } from './core/auth'
import { SettingsProvider } from './core/settings/lib/provider'
import { AppTitleSync } from './core/settings/lib/app-title-sync'
import { PluginLoader } from './core/plugins/PluginLoader'
import { Toaster } from './core/ui'
import { supabase } from './core/lib/supabase'

export default function App() {
	return (
		<AuthProvider>
			<SettingsProvider>
				<AppTitleSync />
				<PluginLoader supabase={supabase}>
					<RouterProvider router={router} />
					<Toaster />
				</PluginLoader>
			</SettingsProvider>
		</AuthProvider>
	)
}

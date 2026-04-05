import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useSettingsStore } from '@/lib/stores/settingsStore'
import BottomNav from '@/components/layout/BottomNav'
import Today from '@/pages/Today'
import Log from '@/pages/Log'
import Progress from '@/pages/Progress'
import Settings from '@/pages/Settings'
import Onboarding from '@/pages/Onboarding'

export default function App() {
  const onboarded = useSettingsStore((s) => s.onboarded)

  if (!onboarded) {
    return (
      <BrowserRouter>
        <Onboarding />
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg-primary">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/log" element={<Log />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

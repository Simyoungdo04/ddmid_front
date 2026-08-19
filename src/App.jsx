import { Route, Routes } from 'react-router-dom'
import MidpointMapPage from './pages/MidpointMapPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MidpointMapPage />} />
    </Routes>
  )
}

export default App

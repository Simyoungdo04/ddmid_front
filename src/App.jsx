import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import MidpointMapPage from './legacy/MidpointMapPage'
import RoomPage from './pages/RoomPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/multi" element={<MidpointMapPage />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
    </Routes>
  )
}

export default App

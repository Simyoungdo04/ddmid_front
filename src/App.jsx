import { Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import RoomEnterPage from './pages/RoomEnterPage'
import MapPage from './pages/MapPage'
import ResultPage from './pages/ResultPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/room/:roomId" element={<RoomEnterPage />} />
      <Route path="/room/:roomId/map" element={<MapPage />} />
      <Route path="/room/:roomId/result" element={<ResultPage />} />
    </Routes>
  )
}

export default App

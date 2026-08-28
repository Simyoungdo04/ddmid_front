import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 기본값은 localhost에만 바인딩돼서, 방화벽 포트를 열어도 다른 기기에서 IP로 접속이
    // 안 된다 - 0.0.0.0으로 열어야 LAN의 다른 기기에서 접근 가능하다.
    host: true,
  },
})

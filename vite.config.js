// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // ให้ dev server ฟังทุกอินเตอร์เฟซในคอนเทนเนอร์
    host: true,          // เทียบเท่า --host 0.0.0.0
    port: 5173,          // พอร์ตคงที่ให้แม็พกับ compose
    strictPort: true,    // ถ้าชนให้ fail (จะได้รู้ปัญหาทันที)
    cors: true,

    /**
     * HMR: สำคัญมากเมื่อรันใน Docker/WSL
     * - ถ้าเข้าจาก host ด้วย http://localhost:5173:
     *   ให้ใช้ clientPort = 5173
     * - ถ้าเข้าจากเครื่องอื่นในแลน (เช่น 192.168.x.x):
     *   ให้แก้ host เป็น ip เครื่องคุณ และ clientPort เป็น 5173 เช่นกัน
     */
    hmr: {
      host: 'localhost', // หรือใช้ IP ของเครื่องคุณถ้าเข้าผ่าน LAN
      clientPort: 5173
    },

    /**
     * allowedHosts:
     * - ถ้าเป็น Vite v5: ใส่เป็น array รายชื่อโฮสต์ที่อนุญาต เช่น ['localhost', '127.0.0.1']
     * - ถ้าอยู่หลัง proxy แปลก ๆ ค่อยเติมทีหลัง
     * - ค่าที่คุณตั้ง 'all' อาจไม่ตรงสเปคของเวอร์ชันที่ใช้อยู่ -> ลองลบหรือแก้เป็น array
     */
    // allowedHosts: ['localhost', '127.0.0.1'],
  },
})

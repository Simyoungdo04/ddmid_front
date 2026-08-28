import axios from 'axios'
import { API_BASE_URL } from '../constants'

// 백엔드 응답은 항상 { success, message, data } 형태로 감싸서 내려온다(삭제 204 제외 -
// 이때는 본문 자체가 없다). 인터셉터에서 성공 응답은 안쪽 data만 꺼내주고, 실패 응답은
// 표준 Error로 바꿔서, 호출하는 쪽(페이지 컴포넌트)은 res.data를 바로 쓰거나
// catch(err) { err.message }만 보면 되게 한다.
export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    const data = error.response?.data
    const message = (data && data.success === false && data.message) || data?.error || error.message
    return Promise.reject(new Error(message))
  }
)

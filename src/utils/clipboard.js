// navigator.clipboard는 HTTPS/localhost 같은 "보안 컨텍스트"에서만 존재한다. IP로
// 접속한 경우(http://<ip>:5173)는 다른 컴퓨터에서 이 객체 자체가 없어서 이 방식으로
// 대체해야 한다.
export function copyWithExecCommand(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  let succeeded = false
  try {
    succeeded = document.execCommand('copy')
  } catch (err) {
    succeeded = false
  }
  document.body.removeChild(textarea)
  return succeeded
}

export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  if (!copyWithExecCommand(text)) {
    throw new Error('복사 명령이 지원되지 않습니다.')
  }
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomApi } from '../roomApi'
import { Wrapper, Title, Field, Label, Input, SubmitButton, ErrorText } from './HomePage.styles'

// 메인 화면: 인원수만 입력받아 방을 만들고 바로 그 방으로 이동시킨다. 닉네임/위치는
// 방장도 다른 참여자와 똑같이 방 안의 참여하기 폼에서 입력한다.
function HomePage() {
  const navigate = useNavigate()
  const [headCount, setHeadCount] = useState(4)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const canSubmit = headCount >= 2 && !submitting

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)
    try {
      const room = await roomApi.create(Number(headCount))
      navigate(`/room/${room.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <Wrapper>
      <Title>딱중간</Title>
      <form onSubmit={handleSubmit}>
        <Field>
          <Label>인원수</Label>
          <Input type="number" min={2} value={headCount} onChange={(e) => setHeadCount(e.target.value)} />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
        <SubmitButton type="submit" disabled={!canSubmit}>
          {submitting ? '만드는 중...' : '방 만들기'}
        </SubmitButton>
      </form>
    </Wrapper>
  )
}

export default HomePage

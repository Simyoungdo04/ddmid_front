import styled from 'styled-components'

export const Wrapper = styled.div`
  max-width: 480px;
  margin: 40px auto;
  padding: 0 16px;
`

export const Title = styled.h1`
  font-size: 20px;
  color: ${({ theme }) => theme.color.text};
`

export const Field = styled.div`
  margin-top: 16px;
`

export const Label = styled.label`
  display: block;
  font-size: 13px;
  color: ${({ theme }) => theme.color.sub};
  margin-bottom: 4px;
`

export const Input = styled.input`
  width: 100%;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.inputBorder};
  background: ${({ theme }) => theme.color.inputBg};
`

export const SubmitButton = styled.button`
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.color.point};
  color: #fff;
  font-size: 14px;
  cursor: pointer;

  &:disabled {
    background: ${({ theme }) => theme.color.disabled};
    cursor: not-allowed;
  }
`

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.color.danger};
  font-size: 13px;
`

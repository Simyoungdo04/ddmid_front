import styled from 'styled-components'

export const Wrapper = styled.div`
  max-width: 520px;
  margin: 24px auto;
  padding: 0 16px;
`

export const Title = styled.h1`
  font-size: 18px;
  color: ${({ theme }) => theme.color.text};
`

export const SubText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.color.sub};
`

export const ParticipantList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 12px 0;
`

export const ParticipantItem = styled.li`
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.color.border};
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-bottom: 6px;
  font-size: 14px;
`

export const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`

export const Button = styled.button`
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.color.point};
  background: ${({ $active, theme }) => ($active ? theme.color.point : '#fff')};
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.color.point)};
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const RestaurantItem = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid ${({ $chosen, theme }) => ($chosen ? theme.color.point : theme.color.border)};
  border-radius: ${({ theme }) => theme.radius.sm};
  margin-bottom: 6px;
  font-size: 14px;
`

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.color.danger};
  font-size: 13px;
`

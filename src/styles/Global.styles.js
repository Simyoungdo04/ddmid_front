import { createGlobalStyle } from 'styled-components'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    margin: 0;
  }

  body {
    font-family: ${({ theme }) => theme.font};
    color: ${({ theme }) => theme.color.text};
    background: ${({ theme }) => theme.color.bg};
  }

  button, input {
    font-family: inherit;
  }
`

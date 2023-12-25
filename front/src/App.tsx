import './App.css'
import { Header } from './components/Header.tsx'
import { Chat } from './components/Chat.tsx'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { Amplify } from 'aws-amplify'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolClientId: import.meta.env.VITE_APP_USER_POOL_CLIENT_ID,
      userPoolId: import.meta.env.VITE_APP_USER_POOL_ID,
      identityPoolId: import.meta.env.VITE_APP_IDENTITY_POOL_ID,
      loginWith: {
        email: true,
      },
    },
  },
})

function App() {
  return (
    <Authenticator
      components={{
        Header: () => <Header className="my-10" />,
      }}
    >
      {({ signOut }) => (
        <div className="mx-auto max-w-screen-lg p-4">
          <Header signOut={signOut} />
          <Chat className="mt-10" />
        </div>
      )}
    </Authenticator>
  )
}

export default App

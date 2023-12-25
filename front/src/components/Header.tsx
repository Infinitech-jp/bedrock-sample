interface HeaderProps {
  className?: string
  signOut?: () => void
}

export function Header({ className = '', signOut }: HeaderProps) {
  return (
    <div className={'relative ' + className}>
      <h1 className="text-center text-3xl font-bold">Amazon Bedrock Sample</h1>
      {signOut && (
        <div className="absolute top-1 right-0 text-right rounded-sm bg-blue-300 px-5 py-2 text-white hover:bg-blue-400 active:bg-blue-500">
          <button onClick={signOut}>ログアウト</button>
        </div>
      )}
    </div>
  )
}

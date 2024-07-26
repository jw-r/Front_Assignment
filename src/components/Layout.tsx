import { PropsWithChildren } from 'react'

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex max-sm:flex-col max-sm:space-y-6 sm:space-x-6">{children}</div>
    </main>
  )
}

export default Layout

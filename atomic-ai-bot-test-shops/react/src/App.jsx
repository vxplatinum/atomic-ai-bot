import AtomicBot from './components/AtomicBot'

function App() {

  return (
    <div className="wrapper">
        <header className="header">
            <a className="header__logo" href="/">React</a>
        </header>
        <main className="main">
            <h1>This is an example of a React application.</h1>
        </main>
        <footer className="footer">
            <a className="header__logo" href="/">React</a>
        </footer>
        <AtomicBot />
    </div>
  )
}

export default App

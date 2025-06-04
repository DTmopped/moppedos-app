import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>Hostinger Horizons</h1>
        <p>Your React application is now working!</p>
        <button onClick={() => setCount((count) => count + 1)}>
          Count is: {count}
        </button>
      </header>
    </div>
  )
}

export default App

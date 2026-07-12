import './App.css'
import { Library } from './components/Library'
import { RecordPlayer } from './components/RecordPlayer'
import { TransportControls } from './components/TransportControls'

function App() {
  return (
    <div className="app-root">
      <Library />
      <main className="app-main">
        <RecordPlayer className="app-main__record" />
        <TransportControls />
      </main>
    </div>
  )
}

export default App

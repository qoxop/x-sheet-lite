import React, { useEffect } from 'react'
import Sheet from '../src/components/sheet';
import { demoData } from '../src/__test__/data'

function App() {
  
  useEffect(() => {
    new Sheet({id: 'sheet-container', data: demoData(200, 20)})
  }, []);
  return (
    <div className="App" id="sheet-container"></div>
  )
}

export default App

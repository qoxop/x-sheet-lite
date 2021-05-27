import React, { useEffect } from 'react'
import Sheet from '../src';
import { demoData } from '../src/__test__/data'

function App() {
  
  useEffect(() => {
    const sh = new Sheet('sheet-container', {});
    sh.load([demoData(100, 20)])
  }, []);
  return (
    <div className="App" id="sheet-container"></div>
  )
}

export default App

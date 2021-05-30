import React, { useEffect } from 'react'
import Sheet from '../src';
import { demoData } from '../src/__test__/data'
import { data } from '../src/__test__/json'
import './sheet.less'

function App() {
  
  useEffect(() => {
    const sh = new Sheet('sheet-container', {});
    sh.load([data])
  }, []);
  return (
    <div className="App" id="sheet-container"></div>
  )
}

export default App

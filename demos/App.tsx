import React, { useEffect } from 'react'
import Sheet from '../src';
import { demoData } from '../src/__test__/data'
import { data } from '../src/__test__/json'

function App() {
  
  useEffect(() => {
    const sh = new Sheet('sheet-container', {});
    console.log(data);
    sh.load([data])
  }, []);
  return (
    <div className="App" id="sheet-container"></div>
  )
}

export default App

import { useEffect, useState } from 'react'
import Splash from './Splash'
import Home from './Home'

export default function App(){
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // Mostrar splash 2.5s y luego home — ajústalo a lo que quieras
    const t = setTimeout(() => setShowSplash(false), 2500)
    return () => clearTimeout(t)
  }, [])

  return showSplash ? <Splash /> : <Home />
}

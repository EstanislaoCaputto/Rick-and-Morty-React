import { useEffect, useState } from "react";
import Nav from "./components/Nav";
import GridCards from "./components/GridCards";
import Pagination from "./components/Pagination";




function App() {
  const [personajes, setPersonajes] = useState([]);
  const [info, setInfo] = useState({})
  

  const urlInicial = "https://rickandmortyapi.com/api/character"
  const fetchPersonajes = (url) => {
    fetch(url)
     .then(respuesta => respuesta.json())
     .then(data => {
      setInfo(data.info)
      setPersonajes(data.results)
     })
     .catch(err=>console.log(err))
  }

  const onPrevious = () => {
    fetchPersonajes(info.prev)
  }
  const onNext = () => {
    fetchPersonajes(info.next)
  }

  useEffect(()=>{
    fetchPersonajes(urlInicial)
  },[])
  return (
      <div className="App">
        <Nav brand={"Rick and Morty"} />
        <Pagination
          prev={info.prev}
          next={info.next}
          onPrev={onPrevious}
          onNext={onNext}
        />
        <div className="container mt-5">
          <GridCards arrayDeResultado={personajes} />
        </div>
        {}
        <Pagination
          prev={info.prev}
          next={info.next}
          onPrev={onPrevious}
          onNext={onNext}
        />
      </div>
  );
}

export default App;

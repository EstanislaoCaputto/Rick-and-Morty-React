import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({
  personajes:null,
  personjeSeleccionad:null,
  estado: false
});

const URL = "https://rickandmortyapi.com/api/character";

export function UserProvider({ children }) {
  const [credencial, setCredencial] = useState(null)
  const [info, setInfo] = useState({})
  const [personaje, setPersonaje] = useState(null)

  const obtenerPersonaje = (url) => {
    fetch(url)
    .then(respuesta => respuesta.json())
    .then(dato=>{
      setCredencial(dato.results)
      setInfo(dato.info)
    })
  }
  
  const elejirPj = (url) => {
    fetch(url)
     .then(res=>res.json())
     .then(dato => setPersonaje(dato))
  }

  const onPrevious = () => {
    obtenerPersonaje(info.prev);
  };
  const onNext = () => {
    obtenerPersonaje(info.next);
  };
  useEffect(()=>{
    obtenerPersonaje(URL);
  },[])

  return (
    <UserContext.Provider
      value={{
        personajes: credencial,
        onPrevious,
        onNext,
        info,
        elejirPj,
        personjeSeleccionad: personaje,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export default UserContext
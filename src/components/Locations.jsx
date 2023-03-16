import { useEffect, useState } from "react"

const Location = () => {
    const [lugares, setLugares] = useState([])

    const urlInicial = "https://rickandmortyapi.com/api/location";
    const fetchLugares = (url) => {
        fetch(url)
          .then((respuesta) => respuesta.json())
          .then((datos) => setLugares(datos.results))
          .catch((err) => console.log(err));
    }

    useEffect(()=>{
        fetchLugares(urlInicial)
    },[])
    return (
      <div className="container mt-4">
        <div className="row">
          {lugares.map((place, idx) => (
            <div className="col" key={idx}>
              <div className="card">
                <div className="card-body">
                  <h3 className="card-title">{place.name}</h3>
                  <hr />
                  <p>Tipo: {place.type}</p>
                  <p>Dimensión: {place.dimension}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}

export default Location
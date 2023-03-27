import { useContext } from "react";
import UserContext from "../context/UserContext";
import Pagination from "./Pagination";


const GridCards = () => {
  const {personajes, elejirPj} = useContext(UserContext)
    if(personajes){
      return (
        <div className="row overflow-y-scroll" style={{maxHeight:'80vh'}}>
          <Pagination />
          {personajes.map((res, i) => (
            <div className="col mb-3" key={i}>
              <div className="card" style={{ maxWidth: "200px" }}>
                <img
                  src={res.image}
                  alt={res.name}
                  onClick={() => elejirPj(res.url)}
                />
                <div className="card-body">
                  <h4 className="card-title">{res.name}</h4>
                  <hr />
                  <p>Location: {res.location.name}</p>
                  <p>Especie: {res.species}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }else{
      return <h1>Error en buscar los personajes</h1>
    }
}

export default GridCards
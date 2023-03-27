import { useContext } from "react"
import UserContext from "../context/UserContext"

const Personaje = () => {

    const {personjeSeleccionad} = useContext(UserContext)
    return (
      <>
        <h3 className="text-center">Su Selección</h3>
        <div className="card text-center border rounded p-2">
          {personjeSeleccionad ? (
            <div className="card-body">
              <img
                src={personjeSeleccionad.image}
                className="rounded card-img-top img-fluid"
                alt={personjeSeleccionad.id}
                style={{maxWidth:350}}
              />
              <h2 className="card-title">{personjeSeleccionad.name}</h2>
              <p className="card-text">Estado: {personjeSeleccionad.status}</p>
              <p className="card-text">
                Lugar: {personjeSeleccionad.location.name}
              </p>
            </div>
          ) : (
            <h3>No hay selección</h3>
          )}
        </div>
      </>
    );
}

export default Personaje;
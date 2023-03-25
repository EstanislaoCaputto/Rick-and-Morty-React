import { useContext } from "react"
import UserContext from "../context/UserContext"

const Personaje = () => {

    const {personjeSeleccionad} = useContext(UserContext)
    return (
      <div className="card">
        <h3 className="title">Su selleción</h3>
        {personjeSeleccionad ? (
          <div className="card-body">
            <h2 className="card-title">{personjeSeleccionad.name}</h2>
          </div>
        ) : (
          <h3>No hay selección</h3>
        )}
      </div>
    );
}

export default Personaje;
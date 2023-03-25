import { useContext, useState } from "react";
import UserContext from "../context/UserContext";

const Login = () => {
  const {estado, login, logout, nombre} = useContext(UserContext)
  const [perfil,setPerfil] = useState('')
  const handleChange = (e) => {
    setPerfil(e.target.value)
  }
  const acceder = (e) =>{
    e.preventDefault()
    login(perfil)
  }
  const desloguear = (e) => {
    e.preventDefault()
    logout()
  }
  if(estado){
    return(
    <div>
      <h1>Hola Usuario {nombre}</h1>
      <button className="btn btn-outline-success" onClick={desloguear} type="submit">
            Desloguear
      </button>
    </div>)
  }else {
    return (
      <div className="container-fluid mt-5">
        <form className="d-flex">
          <input
            id="Nombre"
            type="text"
            onChange={handleChange}
            className="form-control me-5"
            placeholder="Nombre"
            aria-label="Nombre"
          />
          <button className="btn btn-outline-success" onClick={acceder} type="submit">
            Login
          </button>
        </form>
      </div>
    );

  }
}

export default Login
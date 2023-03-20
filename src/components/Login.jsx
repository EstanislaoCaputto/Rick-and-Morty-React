

const Login = () => {
    return (
      <usuarioProvider>
        
        <div className="container-fluid mt-5">
          <form className="d-flex">
            <input
              type="text"
              className="form-control me-5"
              placeholder="Nombre"
              aria-label="Nombre"
            />
            <button className="btn btn-outline-success" type="submit">
              Login
            </button>
          </form>
        </div>
      </usuarioProvider>
    );
}

export default Login
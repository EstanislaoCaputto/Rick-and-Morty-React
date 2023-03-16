const GridCards = ({arrayDeResultado = []}) => {
    return (
      <div className="row">
        {arrayDeResultado.map((res, i) => (
          <div className="col mb-3" key={i}>
            <div className="card" style={{ maxWidth: "200px" }}>
              <img src={res.image} alt={res.name} />
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
}

export default GridCards
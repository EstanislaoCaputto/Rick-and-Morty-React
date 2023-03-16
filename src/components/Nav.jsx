import { Link } from "react-router-dom";

const Nav = ({ brand }) => {
    return (
      <nav className="navbar navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand text-uppercase" href="/">
            {brand}
          </a>
          <Link to="/about" className="nav-link" style={{ color: "white" }}>
            About
          </Link>
          <Link to="/contact" className="nav-link" style={{ color: "white" }}>
            Contact
          </Link>
        </div>
      </nav>
    );
}

export default Nav
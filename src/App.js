import Nav from "./components/Nav";
import GridCards from "./components/GridCards";
import { UserProvider } from "./context/UserContext";
import Personaje from "./components/Personaje";




function App() {
  return (
    <div className="App">
      <UserProvider>
        <Nav brand={"Rick and Morty"} />
        <div className="container mt-5">
          <div className="row">
            <div className="col-md-6">
              <GridCards />
            </div>
            <div className="col-md-6">
              <Personaje />
            </div>
          </div>
        </div>
      </UserProvider>
    </div>
  );
}

export default App;

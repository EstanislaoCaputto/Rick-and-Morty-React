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
          <Personaje />
          <GridCards />
        </div>
        
      </UserProvider>
    </div>
  );
}

export default App;

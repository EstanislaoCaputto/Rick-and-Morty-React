import { createContext, useState, useContext } from "react";


const UsuarioContext = createContext(
    {
        estado:false,
        logout: () => {},
        login: () => {}
    }
)

export function usuarioProvider ({children}){
    const [estaAuth, setEstaAuth] = useState(false);

    const ingresar = () => {
        setEstaAuth(true)
    }

    const salir = () => {
        setEstaAuth(false)
    }

    return(
        <UsuarioContext.Provider 
            value={{estado: estaAuth, login:ingresar, logout:salir}}
        >
            {children}
        </UsuarioContext.Provider>
    )
    
}

export function usuarioConsumidor(){
    return useContext(UsuarioContext)
}
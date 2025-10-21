import { useState, createContext } from "react";
import EighthComponent from "./EighthComponent";

export const UsernameContext = createContext();

function SeventhComponent() {

  const [username, setUsername] = useState("Edwin");

  return (<div className="box"><h1>Seventh Component</h1>
  <h2>{`Hello ${username}`}</h2>
  <UsernameContext.Provider value={username}>
    <EighthComponent username = {username}/>  
  </UsernameContext.Provider>
            
  </div>);
}

export default SeventhComponent;
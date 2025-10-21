import { useContext } from "react";
import { UsernameContext } from "./SeventhComponent";

function TenthComponent() {

  const username = useContext(UsernameContext);

  return (<div className="box"><h1>Tenth Component</h1>
  <h2>{`Bye ${username}`}</h2>
  </div>);
}

export default TenthComponent;
import { useContext } from "react";
import { UsernameContext } from "./SeventhComponent";
import TenthComponent from "./TenthComponent";


function NinthComponent() {

  const username = useContext(UsernameContext);

  return (<div className="box"><h1>Ninth Component</h1>
  <h2>{`Hey ${username}, are you enjoying the show?`}</h2>
            <TenthComponent/>
  </div>);
}

export default NinthComponent;
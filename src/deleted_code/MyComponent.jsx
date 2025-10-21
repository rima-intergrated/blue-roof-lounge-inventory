import { useState } from "react";

function MyComponent () {
  const [name, setName] = useState("Guest");
  const [age, setAge] = useState(0);
  const [isEmployed, setIsEmployed] = useState();
  

  const updateName = () => {
    setName("John");
  }
  
  const updateAge = () => {
    setAge(age+1);
  } 
  
  const toggleEmployedStatus = () => {
    setIsEmployed(!isEmployed);
  }
  

  return (
    <div>
      <p>
        Name: {name}
      </p>

      <button onClick={updateName}>Set name</button>

      <p>
        Age: {age}
      </p>

      <button onClick={updateAge}>
        Set Age        
      </button>

      <p>
        Is employed: {isEmployed ? "Yes" : "No"}
      </p>

      <button onClick={toggleEmployedStatus}>
        Toggle Status        
      </button>

    </div>
  );
}
export default MyComponent
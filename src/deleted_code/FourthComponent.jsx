import { element } from "prop-types";
import { useState } from "react"

function FourthComponent () {
  const [foods, setFoods] = useState (["Pizza", "Burger", "Pasta"]);

  function handleAddFood () {
    const newFood = document.getElementById("foodInput").value;
    document.getElementById("foodInput").value = "";

    setFoods(f => [...f, newFood]);
  }

  function handleAddFood(event) {
  if (event.key === 'Enter') {
    // Your logic to add food
     const newFood = document.getElementById("foodInput").value;
    document.getElementById("foodInput").value = "";

    setFoods(f => [...f, newFood]);
  }
}

  function handleRemoveFood (index) {
    setFoods(foods.filter((_, i) => i !== index));
  }

  return(
    <div>
      <h2>List of Food</h2>

      <ul>
        {foods.map((food, index) => <li key={index} onClick={() => handleRemoveFood(index)}>{food}</li>)}
      </ul>

      <input type="text" placeholder="Enter food name" id="foodInput" onKeyDown={handleAddFood}/>

      <button onClick={handleAddFood}>Add food</button>
    </div>
  );
}

export default FourthComponent
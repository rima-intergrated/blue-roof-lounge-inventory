import { useState } from "react";

function ThirdComponent () {
  const [car, setCar] = useState({  year:2023,
                                    make:"Ford",
                                    model:"Ranger", color:"white"});

  function handleYearChange (event) {
    setCar(c => ({...c, year: event.target.value}));
  }

  function handleColorChange (event) {
    setCar(c => ({...c, color: event.target.value}));
  }

  function handleMakeChange (event) {
    setCar(c => ({...c, make: event.target.value}));
  }

  function handleModelChange (event) {
    setCar(c => ({...c, model: event.target.value}));
  }

  return (<div>
    <p>
      Your dream car is a {car.color} {car.year} {car.make} {car.model}
    </p>
    <input type="number" value={car.year} onChange={handleYearChange}/><br/>
    <input type="text" value={car.color} onChange={handleColorChange}/><br/>
    <input type="text" value={car.make} onChange={handleMakeChange}/><br/>
    <input type="textr" value={car.model} onChange={handleModelChange}/>
  </div>

  );
}

export default ThirdComponent;
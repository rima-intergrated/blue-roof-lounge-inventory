import React, { useState } from "react";

function SecondComponent () {
  const [name, setName] = useState("Guest");
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState("");
  const [shipping, setShipping] = useState("Delivery");

  function handleNameChange (event) {
    setName(event.target.value);
  }

  function handleQuantityChange (event) {
    setQuantity(event.target.value);
  }

  function handlePaymentChange (event) {
    setPayment(event.target.value);
  }

  function handleShippingChange (event) {
    setShipping(event.target.value);
  }

  return( <div>
            <input value={name} onChange={handleNameChange}/>
            <p>Name: {name}</p>

            <input value={quantity} onChange={handleQuantityChange} type="number"/>
            <p>Quantity: {quantity}</p>

            <select value={payment} onChange={handlePaymentChange}>
              <option value="">Select an option</option>
              <option value="Visa">Visa</option>
              <option value="Airtel Money">Airtel Money</option>
              <option value="TNM Mpamba">TNM Mpamba</option>              
            </select>
            <p>Payment: {payment}</p>

            <label>
              <input type="radio" value="Pick Up" checked={shipping === "Pick Up"} onChange={handleShippingChange}/>
              Pick up
            </label>

            <br/>

             <label>
              <input type="radio" value="Delivery" checked={shipping === "Delivery"} onChange={handleShippingChange}/>
              Delivery
            </label>
            <p>Shipping: {shipping}</p>

          </div>);
}

export default SecondComponent
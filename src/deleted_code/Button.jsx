function Button () {
  
  // let count = 0;
  // const handleClick = (name) => {
  //   if (count < 3) {
  //     count++;
  //     console.log(`${name} you clicked me ${count} time/s`)
  //   } else {
  //     console.log(`${name} stop clicking me`)
  //   }

  // };

  // const handleClick2 = (name) => console.log(`${name} stop clicking me`)

  // return(<button onClick={() => handleClick("Eddie")}>Click me ☺️</button>);

  const handleClick = (e) => e.target.textContent = "OUCH!"

  return(<button onDoubleClick={(e) => handleClick(e)}>Click me ☺️</button>);
}

export default Button
function ProfilePicture () {
  const imageUrl = `./src/assets/react.svg`;

  const handleClick = () => console.log("HEY!")

  return(<img onClick={handleClick} src={imageUrl}></img>)
}

export default ProfilePicture
import { useState } from "react"

function ToDoList() {
  const [tasks, setTasks] = useState(["Eat Breakfast", "Take a walk", "Read a book"]);
  const [newTask, setNewTask] = useState("");

  function HandleInputChange (event) {
    setNewTask(event.target.value);
  }

  function addTask () {
    if (newTask.trim() !== "") {
    setTasks(t => [...t, newTask]);
    setNewTask("");
    }
  }

  function deleteTask (index) {
    setTasks(t => t.filter((_, i) => i !== index));
  }

  function moveTaskUp (index) {
    if (index > 0) {
      const updatedTasks = [...tasks];
      updatedTasks[index] = tasks[index - 1];
      updatedTasks[index - 1] = tasks[index];
      setTasks(updatedTasks);
    }
  }

  function moveTaskDown (index) {
    if (index < tasks.length - 1) {
      const updatedTasks = [...tasks];
      updatedTasks[index] = tasks[index + 1];
      updatedTasks[index + 1] = tasks[index];
      setTasks(updatedTasks);
    }
  }

return (
  <div className="todo-list">
    <h1>To-Do-List</h1>

    <div>
      <input
      type="text"
      placeholder="Enter a task..."
      value={newTask}
      onChange={HandleInputChange}/>

      <button className="add-button" onClick={addTask}>
        Add
      </button>
    </div> 

    <ol>
      {tasks.map((task, index) => <li key={index}>

        <span>{task}</span>

        <button className="delete-button" onClick={() => deleteTask(index)}>Delete</button>

        <button className="move-button" onClick={() => moveTaskUp(index)}>UP</button>

        <button className="move-button" onClick={() => moveTaskDown(index)}>DN</button>

        </li>)}
    </ol>   

  </div>
);
}

export default ToDoList;
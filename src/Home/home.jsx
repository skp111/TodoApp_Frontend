import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import todoServices from "../services/todoServices";
import toast from "react-hot-toast";

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [newTodo, setNewTodo] = useState({
    task: "",
    description: "",
    deadlineLocal: "", // local string for datetime-local
  });

  // ---------------- Helper Functions ----------------

  // Convert UTC ISO string to local datetime string for input
  const formatUTCToLocal = (utcISOString) => {
    if (!utcISOString) return "";
    const localDate = new Date(utcISOString);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, "0");
    const day = String(localDate.getDate()).padStart(2, "0");
    const hours = String(localDate.getHours()).padStart(2, "0");
    const minutes = String(localDate.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Convert local datetime string to UTC ISO for backend
  const formatLocalToUTC = (localDateTime) => {
    if (!localDateTime) return "";
    return new Date(localDateTime).toISOString();
  };

  // ---------------- Load User ----------------
  useEffect(() => {
    if (location?.state?.user) {
      setUser(location.state.user);
    } else if (localStorage.getItem("user")) {
      setUser(JSON.parse(localStorage.getItem("user")));
    } else {
      navigate("/");
    }
  }, [location.state, navigate]);

  // ---------------- Fetch Todos ----------------
  useEffect(() => {
    if (!user) return;
    const fetchTodos = async () => {
      try {
        setLoading(true);
        const res = await todoServices.getTodos(user._id);
        setTodos(res.data.todos || []);
      } catch (err) {
        console.error(err);
        toast.error(err?.response?.data?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTodos();
  }, [user]);

  // ---------------- Create Todo ----------------
  const handleCreateTodo = async (e) => {
    e.preventDefault();
    try {
      const res = await todoServices.postTodo({
        ...newTodo,
        deadline: formatLocalToUTC(newTodo.deadlineLocal),
        createdBy: user._id,
      });
      toast.success(res.data.message);
      setTodos((todos) => [...todos, res.data.result]);
      setNewTodo({ task: "", description: "", deadlineLocal: "" });
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message);
    }
  };

  // ---------------- Edit Todo ----------------
  const handleEditTodo = async (e) => {
    e.preventDefault();
    try {
      const res = await todoServices.updateTodo(editing._id, {
        task: editing.task,
        description: editing.description,
        status: editing.status,
        deadline: formatLocalToUTC(editing.deadlineLocal),
      });
      toast.success(res.data.message);
      setTodos((prev) =>
        prev.map((t) => (t._id === editing._id ? res.data.todo : t))
      );
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message);
    }
  };

  // ---------------- Toggle Status ----------------
  const handleToggleStatus = async (todo) => {
    try {
      const res = await todoServices.updateTodo(todo._id, {
        task: todo.task,
        description: todo.description,
        status: !todo.status,
        deadline: todo.deadline,
      });
      toast.success(res.data.message);
      setTodos((prev) =>
        prev.map((t) => (t._id === todo._id ? { ...t, status: !todo.status } : t))
      );
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message);
    }
  };

  // ---------------- Delete Todo ----------------
  const handleDeleteTodo = async (todoId) => {
    if (!window.confirm("Are you sure you want to delete this todo?")) return;
    try {
      const res = await todoServices.deleteTodo(todoId);
      toast.success(res.data.message);
      setTodos((prev) => prev.filter((t) => t._id !== todoId));
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-gray-700">
        <p>Loading your data...</p>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif"
          alt="Loading"
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* ---------------- Create Todo Form ---------------- */}
      <form
        onSubmit={handleCreateTodo}
        className="mb-6 p-4 border rounded-lg shadow-sm space-y-3"
      >
        <h2 className="text-lg font-medium mb-2">Add New Todo</h2>
        <input
          type="text"
          placeholder="Task Title"
          value={newTodo.task}
          onChange={(e) => setNewTodo({ ...newTodo, task: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={newTodo.description}
          onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={newTodo.deadlineLocal}
          onChange={(e) => setNewTodo({ ...newTodo, deadlineLocal: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 cursor-pointer"
        >
          Add Todo
        </button>
      </form>

      {/* ---------------- Todo List ---------------- */}
      {todos.length > 0 ? (
        <ul className="space-y-3">
          {todos.map((todo) => (
            <div key={todo._id}>
              <li className="p-3 mb-3 border rounded-lg shadow-sm flex justify-between items-center">
                <div>
                  <h2 className="font-medium">{todo.task}</h2>
                  <p className="text-sm text-gray-600">{todo.description}</p>
                </div>

                <div className="flex gap-2 items-center">
                  <button
                    onClick={() =>
                      setEditing({
                        ...todo,
                        deadlineUTC: todo.deadline,
                        deadlineLocal: formatUTCToLocal(todo.deadline),
                      })
                    }
                    className="px-2 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 cursor-pointer"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleToggleStatus(todo)}
                    className={`px-2 py-1 text-sm rounded cursor-pointer ${
                      todo.status
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    {todo.status ? "Completed" : "Pending"}
                  </button>

                  <button
                    onClick={() => handleDeleteTodo(todo._id)}
                    className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </li>

              {/* ---------------- Edit Form ---------------- */}
              {editing?._id === todo._id && (
                <form
                  onSubmit={handleEditTodo}
                  className="mb-6 p-4 border rounded-lg shadow-sm space-y-3"
                >
                  <h2 className="text-lg font-medium mb-2">Edit Todo</h2>

                  <input
                    type="text"
                    value={editing.task}
                    onChange={(e) =>
                      setEditing({ ...editing, task: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <textarea
                    value={editing.description}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />

                  <input
                    type="datetime-local"
                    value={editing.deadlineLocal}
                    onChange={(e) =>
                      setEditing({ ...editing, deadlineLocal: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  />
                  
                  <button
                    type="submit"
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer"
                  >
                    Save Changes
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="ml-2 bg-gray-300 px-4 py-2 rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>
          ))}
        </ul>
      ) : (
        <p>No todos yet. Create one!</p>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { api } from '../api/api';

export default function Dashboard() {
  const { user, logout, upgradePremium } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => { fetchTodos(); }, []);

  async function fetchTodos() {
    setLoading(true);
    try {
      const data = await api.getTodos();
      setTodos(data.todos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const data = await api.createTodo(newTitle.trim());
      setTodos(prev => [data.todo, ...prev]);
      setNewTitle('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(todo) {
    try {
      const data = await api.updateTodo(todo.id, { completed: !todo.completed });
      setTodos(prev => prev.map(t => t.id === todo.id ? data.todo : t));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEditSave(id) {
    if (!editTitle.trim()) return;
    try {
      const data = await api.updateTodo(id, { title: editTitle.trim() });
      setTodos(prev => prev.map(t => t.id === id ? data.todo : t));
      setEditId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePremium() {
    setPayLoading(true);
    setError('');
    try {
      const order = await api.createOrder();

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Todo App',
        description: 'Premium Upgrade',
        order_id: order.orderId,
        handler: async function (response) {
          try {
            await api.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            upgradePremium();
            alert(' You are now Premium!');
          } catch (err) {
            setError('Payment verified but upgrade failed: ' + err.message);
          }
        },
        prefill: { email: user.email },
        theme: { color: '#111111' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    } finally {
      setPayLoading(false);
    }
  }

  const done = todos.filter(t => t.completed).length;

  return (
    <div className="dashboard">
      <header>
        <div className="header-left">
          <h1>todo<span>.</span></h1>
          <span className="user-email">{user.email}</span>
        </div>
        <div className="header-right">
          {!user.is_premium && (
            <button className="premium-btn" onClick={handlePremium} disabled={payLoading}>
              {payLoading ? '…' : '⭐ Go Premium'}
            </button>
          )}
          {user.is_premium && <span className="badge">⭐ Premium</span>}
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </header>

      <main>
        <div className="stats">
          <span>{todos.length} tasks</span>
          <span className="dot">·</span>
          <span>{done} done</span>
        </div>

        <form className="add-form" onSubmit={handleAdd}>
          <input
            placeholder="Add a new task…"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>

        {error && <p className="error">{error}</p>}

        {loading ? (
          <p className="hint">Loading…</p>
        ) : todos.length === 0 ? (
          <p className="hint">No tasks yet. Add one above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li key={todo.id} className={todo.completed ? 'done' : ''}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggle(todo)}
                />
                {editId === todo.id ? (
                  <div className="edit-row">
                    <input
                      className="edit-input"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEditSave(todo.id)}
                      autoFocus
                    />
                    <button className="save-btn" onClick={() => handleEditSave(todo.id)}>Save</button>
                    <button className="cancel-btn" onClick={() => setEditId(null)}>✕</button>
                  </div>
                ) : (
                  <span
                    className="todo-title"
                    onDoubleClick={() => { setEditId(todo.id); setEditTitle(todo.title); }}
                  >
                    {todo.title}
                  </span>
                )}
                <div className="todo-actions">
                  {editId !== todo.id && (
                    <button className="edit-btn" onClick={() => { setEditId(todo.id); setEditTitle(todo.title); }}>✎</button>
                  )}
                  <button className="del-btn" onClick={() => handleDelete(todo.id)}>✕</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
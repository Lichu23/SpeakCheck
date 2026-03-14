import { useState, useEffect } from 'react'

export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true)
      try {
        const res = await fetch('https://jsonplaceholder.typicode.com/users')
        const data = await res.json()
        setUsers(data)
      } catch (err) {
        console.log(err)
        setError('Failed to load users')

      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  },[] )

  console.log(users)

  return (
    <div style={{ marginTop: 24, padding: 16, border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#4a5568' }}>👥 Users</h3>
      {loading && <p style={{ color: '#a0aec0', fontSize: 13 }}>Loading...</p>}
      {error && <p style={{ color: '#e53e3e', fontSize: 13 }}>{error}</p>}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {users.map(user => (
          <li key={user.id} style={{ padding: '6px 0', borderBottom: '1px solid #f7fafc', fontSize: 13, color: '#2d3748' }}>
            {user.name} — <span style={{ color: '#a0aec0' }}>{user.email}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

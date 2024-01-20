document.addEventListener('DOMContentLoaded', () => {
  const userList = document.getElementById('userList');
  const userForm = document.getElementById('userForm');

  async function fetchUsers() {
    const response = await fetch('http://localhost:5500/users');
    const users = await response.json();

    userList.innerHTML = users
      .map((user) => `<li>${user.name} - ${user.email}</li>`)
      .join('');
  }

  fetchUsers();

  userForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;

    const response = await fetch('http://localhost:5500/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email }),
    });

    const newUser = await response.json();
    fetchUsers();

    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginbox');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      const response = await fetch('http://localhost:5500/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      

      if (data.success) {
        const response1 = await fetch('http://localhost:5500/setUserID', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });
        alert(data.message);
        if (data.role === 'Admin') {
          window.location.href = './adminhome.html';
        } else {
          window.location.href = './home.html';
        }
      } else {
        alert('Login failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again later.');
    }
  });
});

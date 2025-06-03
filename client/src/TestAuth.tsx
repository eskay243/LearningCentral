import { useState } from "react";

export default function TestAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (response.ok) {
        const user = await response.json();
        setMessage(`Login successful! Welcome ${user.firstName}`);
        // Redirect to dashboard after successful login
        window.location.href = "/dashboard";
      } else {
        const error = await response.text();
        setMessage(`Login failed: ${error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto" }}>
      <h1>Codelab Educare - Login</h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "10px" }}>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: "8px", marginTop: "4px" }}
          />
        </div>
        <button 
          type="submit"
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#6b46c1", 
            color: "white", 
            border: "none",
            cursor: "pointer"
          }}
        >
          Login
        </button>
      </form>
      
      {message && (
        <div style={{ marginTop: "20px", padding: "10px", border: "1px solid #ccc" }}>
          {message}
        </div>
      )}
      
      <div style={{ marginTop: "20px" }}>
        <h3>Demo Accounts:</h3>
        <p>Email: admin.user@codelabeducare.com<br/>Password: Password1234</p>
        <p>Email: mentor.smith@codelabeducare.com<br/>Password: Password1234</p>
        <p>Email: student.jones@codelabeducare.com<br/>Password: Password1234</p>
      </div>
    </div>
  );
}
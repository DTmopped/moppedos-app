import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      alert('Error sending magic link: ' + error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login to Mopped OS</h2>
        {sent ? (
          <p>✅ Magic link sent! Check your email.</p>
        ) : (
          <form onSubmit={handleLogin}>
            <label className="block mb-2">
              Email:
              <input
                type="email"
                className="border rounded w-full p-2 mt-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dt@moppedbbq.com"
                required
              />
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded mt-3 w-full"
            >
              Send Magic Link
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

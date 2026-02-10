import { useState } from "react";
import { Link } from "react-router-dom";


function Register() {
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas");
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          restaurantName,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'inscription");
      }

      setSuccess(true);
      setRestaurantName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h2 className="card-title justify-center text-2xl">
            Inscription GastroChef 🍽️
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Nom du restaurant</span>
              </label>
              <input
                type="text"
                placeholder="Le Bon Goût"
                className="input input-bordered"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@restaurant.com"
                className="input input-bordered"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Mot de passe</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Confirmer le mot de passe</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="alert alert-error text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success text-sm">
                Compte créé avec succès 🎉
              </div>
            )}

            <div className="form-control mt-4">
              <button
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                type="submit"
              >
                S'inscrire
              </button>
            </div>
          </form>

          <p className="text-center text-sm mt-4">
            Déjà un compte ?{" "}
            <Link to="/login" className="link link-primary">
                Connexion
            </Link>
            </p>

        </div>
      </div>
    </div>
  );
}

export default Register;

import { useGame } from "../context/GameContext";

function Header() {
  const { satisfaction, treasury } = useGame();

  return (
    <div className="navbar bg-base-100 shadow rounded-box px-4">
      <h1 className="text-xl font-bold">🍽️ GastroChef – La Tour d’Émeraude</h1>

      <div className="ml-auto flex gap-2">
        <div className="badge badge-success badge-lg">Trésorerie : {treasury} 💰</div>
        <div className="badge badge-primary badge-lg">Satisfaction : {satisfaction}</div>
      </div>
    </div>
  );
}

export default Header;

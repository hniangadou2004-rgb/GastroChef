import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext";

function Header() {
    const navigate = useNavigate();
    const { satisfaction, treasury, restaurantName } = useGame();

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
    };

    return (
        <div className="navbar bg-base-100 shadow rounded-box px-4 py-2 flex-wrap gap-2">
            <h1 className="text-lg md:text-xl font-bold">🍽️ GastroChef - {restaurantName}</h1>

            <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="badge badge-success badge-lg">Treasury: {treasury} 💰</div>
                <div className="badge badge-primary badge-lg">Reviews: {satisfaction}</div>

                <div className="dropdown dropdown-end">
                    <button tabIndex={0} className="btn btn-sm btn-ghost" aria-label="User menu">
                        ⚙️
                    </button>
                    <ul tabIndex={0} className="menu dropdown-content z-[1] mt-2 w-44 rounded-box bg-base-100 p-2 shadow">
                        <li>
                            <button onClick={handleLogout}>Log out</button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Header;

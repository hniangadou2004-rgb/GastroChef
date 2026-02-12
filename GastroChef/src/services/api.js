const API_URL = "http://localhost:5000/api";

const getHeaders = () => {
    const token = localStorage.getItem("token");

    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

export const api = {
    get: async (endpoint) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders()
        });

        const data = await res.json();
        if (!res.ok) throw data;
        return data;
    },

    post: async (endpoint, body) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body)
        });

        const data = await res.json();
        if (!res.ok) throw data;
        return data;
    }
};

import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
    autoConnect: false,
    auth: {
        token: localStorage.getItem("token") ? `Bearer ${localStorage.getItem("token")}` : ""
    }
});

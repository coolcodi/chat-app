import { createContext, useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // attach token to axios
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // check authentication
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  // login or signup
  const login = async (state, credentials) => {
    try {

      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setAuthUser(data.user);
        setToken(data.token);

        localStorage.setItem("token", data.token);

        axios.defaults.headers.common["Authorization"] =
          `Bearer ${data.token}`;

        connectSocket(data.user);

        toast.success(data.message);

      } else {
        toast.error(data.message);
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  // logout
  const logout = () => {

    localStorage.removeItem("token");

    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);

    axios.defaults.headers.common["Authorization"] = null;

    if (socket) socket.disconnect();

    toast.success("Logged out successfully");
  };

  // update profile
  const updateProfile = async (body) => {
    try {

      const { data } = await axios.put("/api/auth/update-profile", body);

      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }

    } catch (error) {
      toast.error(error.message);
    }
  };

  // socket connection
  const connectSocket = (userData) => {

    if (!userData || socket?.connected) return;

    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id
      }
    });

    newSocket.connect();

    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  };

  // run on app load
  useEffect(() => {
    if (token) checkAuth();
  }, [token]);

  const value = {
    axios,
    token,
    authUser,
    onlineUsers,
    socket,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
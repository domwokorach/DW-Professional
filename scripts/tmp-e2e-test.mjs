import { io } from "socket.io-client";

const tokenRes = await fetch("http://localhost:3000/api/live-chat/token", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ visitorId: "e2e-visitor" }),
});
const { token } = await tokenRes.json();
console.log("token issued:", token.slice(0, 20) + "...");

const socket = io("http://localhost:4001", { auth: { token }, transports: ["websocket"] });

socket.on("connect", () => {
  console.log("socket connected");
  socket.emit("send-message", { id: "msg-1", message: "What are your skills?", senderId: "e2e-visitor" });
});
socket.on("typing", (t) => console.log("typing:", t));
socket.on("receive-message", (msg) => {
  console.log("received reply:", JSON.stringify(msg, null, 2));
  socket.disconnect();
  process.exit(0);
});
socket.on("connect_error", (err) => { console.log("connect_error:", err.message); process.exit(1); });

setTimeout(() => { console.log("timeout"); process.exit(1); }, 8000);
